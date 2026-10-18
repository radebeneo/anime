"""Build a labeled montage of all 64 extracted frames + center for verification."""

import os
import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRAMES = os.path.join(ROOT, "public", "frames")
OUT = os.path.join(ROOT, "scripts", "inspect", "verify_montage.png")

TILE_W, TILE_H, COLS = 320, 180, 8
names = [f"frame_{i:02d}.webp" for i in range(64)] + ["center.webp"]
rows = (len(names) + COLS - 1) // COLS
sheet = np.full((rows * (TILE_H + 22), COLS * TILE_W, 3), 30, np.uint8)

for k, name in enumerate(names):
    img = cv2.imread(os.path.join(FRAMES, name))
    tile = cv2.resize(img, (TILE_W, TILE_H))
    r, c = divmod(k, COLS)
    y = r * (TILE_H + 22)
    sheet[y:y + TILE_H, c * TILE_W:(c + 1) * TILE_W] = tile
    cv2.putText(sheet, name.replace(".webp", "").replace("frame_", "f"), (c * TILE_W + 6, y + TILE_H + 16),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 255), 1, cv2.LINE_AA)

cv2.imwrite(OUT, sheet)
print(OUT)

# Also save a full-res copy of center.webp as png for face-anchor inspection
center = cv2.imread(os.path.join(FRAMES, "center.webp"))
cv2.imwrite(os.path.join(ROOT, "scripts", "inspect", "center_full.png"), center)
