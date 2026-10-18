import cv2
import numpy as np

VIDEO = "public/character.mp4"
cap = cv2.VideoCapture(VIDEO)
n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
print(f"total frames: {n}")

samples = list(range(0, n, 8)) + [n - 1]

cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
ok, frame = cap.read()
h, w = frame.shape[:2]
corners = [frame[5, 5], frame[5, w - 6], frame[h - 6, 5], frame[h - 6, w - 6]]
bg = np.median(np.array(corners), axis=0).astype(int)
b, g, r = bg
print(f"background BGR: {tuple(int(x) for x in bg)} -> HEX: #{r:02x}{g:02x}{b:02x}")

import os
os.makedirs("scripts/inspect", exist_ok=True)
cols = []
for i in samples:
    cap.set(cv2.CAP_PROP_POS_FRAMES, i)
    ok, fr = cap.read()
    if not ok:
        continue
    small = cv2.resize(fr, (320, 180))
    cv2.putText(small, str(i), (8, 28), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 2)
    cols.append(small)
cap.release()

rows = []
per_row = 4
for i in range(0, len(cols), per_row):
    chunk = cols[i:i + per_row]
    while len(chunk) < per_row:
        chunk.append(np.zeros_like(cols[0]))
    rows.append(np.hstack(chunk))
montage = np.vstack(rows)
cv2.imwrite("scripts/inspect/montage.png", montage)
print("montage saved to scripts/inspect/montage.png")
