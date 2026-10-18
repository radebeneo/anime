import cv2
import numpy as np

cap = cv2.VideoCapture("public/character.mp4")
n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

samples = list(range(0, n, 4))
tiles = []
for i in samples:
    cap.set(cv2.CAP_PROP_POS_FRAMES, i)
    ok, fr = cap.read()
    if not ok:
        continue
    small = cv2.resize(fr, (256, 144))
    cv2.putText(small, str(i), (6, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
    tiles.append(small)
cap.release()

per_row = 6
rows = []
for i in range(0, len(tiles), per_row):
    chunk = tiles[i:i + per_row]
    while len(chunk) < per_row:
        chunk.append(np.zeros_like(tiles[0]))
    rows.append(np.hstack(chunk))
montage = np.vstack(rows)
cv2.imwrite("scripts/inspect/montage_fine.png", montage)
print("saved", len(tiles), "tiles")
