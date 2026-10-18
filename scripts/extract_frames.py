"""
Extract 64 evenly-spaced WebP frames along the head's 360-degree yaw trajectory,
plus center.webp (neutral, looking at camera).

Anchor map: screen-angle (atan2 convention, 0=right, 90=down, 180=left, 270=up)
-> source video frame index (nose pointing toward that screen direction).
Linear interpolation of video frame indices between anchors gives uniform
angular spacing (360/64 = 5.625 degrees per output frame).

Usage: python scripts/extract_frames.py
"""

import os
import cv2

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VIDEO = os.path.join(ROOT, "public", "character.mp4")
OUT_DIR = os.path.join(ROOT, "public", "frames")
N_FRAMES = 64
CENTER_SRC = 0  # neutral frame looking at camera

# (angle_degrees, source_video_frame) - monotonic within each segment
ANCHORS = [
    (0.0, 44),     # nose pointing screen-right (profile)
    (45.0, 58),    # 3/4 right, turning away
    (90.0, 72),    # back of head (cursor below -> head turned fully away)
    (135.0, 86),   # back-left
    (180.0, 100),  # nose pointing screen-left (profile)
    (225.0, 118),  # 3/4 left, returning
    (270.0, 152),  # facing camera, chin raised (looking up)
    (315.0, 26),   # 3/4 front-right
    (360.0, 44),   # wrap
]


def angle_to_video_frame(angle_deg: float) -> int:
    a = angle_deg % 360.0
    for (a0, f0), (a1, f1) in zip(ANCHORS, ANCHORS[1:]):
        if a0 <= a <= a1:
            t = 0.0 if a1 == a0 else (a - a0) / (a1 - a0)
            return int(round(f0 + t * (f1 - f0)))
    return ANCHORS[0][1]


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    cap = cv2.VideoCapture(VIDEO)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open {VIDEO}")
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"Video frames: {total}")

    wanted = sorted({angle_to_video_frame(i * 360.0 / N_FRAMES) for i in range(N_FRAMES)} | {CENTER_SRC})
    wanted_set = set(wanted)
    grabbed = {}

    idx = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        if idx in wanted_set:
            grabbed[idx] = frame
            if len(grabbed) == len(wanted_set):
                break
        idx += 1
    cap.release()

    missing = wanted_set - set(grabbed)
    if missing:
        raise RuntimeError(f"Failed to read frames: {sorted(missing)}")

    q = [int(cv2.IMWRITE_WEBP_QUALITY), 85]
    for i in range(N_FRAMES):
        src = angle_to_video_frame(i * 360.0 / N_FRAMES)
        path = os.path.join(OUT_DIR, f"frame_{i:02d}.webp")
        cv2.imwrite(path, grabbed[src], q)
    cv2.imwrite(os.path.join(OUT_DIR, "center.webp"), grabbed[CENTER_SRC], q)

    total_bytes = sum(os.path.getsize(os.path.join(OUT_DIR, f)) for f in os.listdir(OUT_DIR))
    print(f"Wrote {N_FRAMES} frames + center.webp to {OUT_DIR}")
    print(f"Total size: {total_bytes / 1024 / 1024:.2f} MB")

    # Report character bounding box of the center frame via background subtraction
    frame = grabbed[CENTER_SRC]
    bg = frame[5, 5].astype(int)  # top-left background pixel
    diff = cv2.absdiff(frame.astype(int), bg).sum(axis=2)
    mask = (diff > 40).astype("uint8") * 255
    ys, xs = cv2.findNonZero(mask).T[1], cv2.findNonZero(mask).T[0]
    h, w = frame.shape[:2]
    print(f"Center-frame character bbox: x[{xs.min()}-{xs.max()}] y[{ys.min()}-{ys.max()}] of {w}x{h}")


if __name__ == "__main__":
    main()
