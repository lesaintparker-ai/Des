"""Prépare le médaillon : découpe circulaire (fond blanc retiré) et points de reflets sur l'eau.

L'illustration n'est ni redessinée ni déformée : on applique seulement un masque
circulaire sur le contour extérieur de l'anneau vert émeraude.
Usage : python3 -I tools/prep_medaillon.py assets/medaillon-original.png assets
"""
import json
import math
import random
import sys

import numpy as np
from PIL import Image

src, out_dir = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB")
a = np.asarray(im).astype(np.int32)

# Cercle extérieur de l'anneau, mesuré par ajustement (voir README).
CX, CY, R = 624.0, 604.0, 568.5
INNER_R = 515.0  # bord intérieur de l'anneau : l'image peinte est à l'intérieur

size = int(math.ceil(R)) * 2 + 2
x0, y0 = int(round(CX - size / 2)), int(round(CY - size / 2))
crop = im.crop((x0, y0, x0 + size, y0 + size))

# Masque anti-crénelé (sur-échantillonnage x4)
ss = 4
yy, xx = np.mgrid[0:size * ss, 0:size * ss]
cxl, cyl = (CX - x0) * ss, (CY - y0) * ss
inside = ((xx + 0.5 - cxl) ** 2 + (yy + 0.5 - cyl) ** 2) <= (R * ss) ** 2
alpha = inside.reshape(size, ss, size, ss).mean(axis=(1, 3))
rgba = np.dstack([np.asarray(crop), (alpha * 255).round().astype(np.uint8)])
Image.fromarray(rgba, "RGBA").save(f"{out_dir}/medaillon.png", optimize=True)

# Points de reflets : uniquement sur des pixels d'eau (bleu dominant) dont tout le
# voisinage est de l'eau, sous la ligne de flottaison, loin des personnages.
r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
water = (b > r + 50) & (b > g + 5) & (np.arange(a.shape[0])[:, None] > 870)
N = 13
ok = water.copy()
for dy in range(-N, N + 1, 3):
    for dx in range(-N, N + 1, 3):
        ok &= np.roll(np.roll(water, dy, axis=0), dx, axis=1)
ys, xs = np.nonzero(ok)
keep = ((xs - CX) ** 2 + (ys - CY) ** 2) < (INNER_R - 25) ** 2
ys, xs = ys[keep], xs[keep]
random.seed(7)
pts = []
idx = list(range(len(xs)))
random.shuffle(idx)
for i in idx:
    x, y = int(xs[i]), int(ys[i])
    if all((x - p[0]) ** 2 + (y - p[1]) ** 2 > 45 ** 2 for p in pts):
        pts.append((x, y))
    if len(pts) >= 26:
        break
# Coordonnées normalisées dans le carré découpé (0..1)
glints = [{"x": round((x - x0) / size, 4), "y": round((y - y0) / size, 4)} for x, y in pts]
meta = {
    "size": size,
    "ringOuter": round(R / size, 4),
    "ringInner": round(INNER_R / size, 4),
    "halo": {"x": round((637 - x0) / size, 4), "y": round((250 - y0) / size, 4)},
    "glints": glints,
}
# Chargé par la page via <script> (fetch est bloqué en file://)
with open(f"{out_dir}/medaillon.js", "w") as f:
    f.write("window.MEDAILLON = " + json.dumps(meta, indent=1) + ";\n")
print(f"medaillon {size}px, {len(glints)} reflets")
