"""Redescend le pied gauche (côté spectateur) de la Reine pour qu'il pose sur la même
ligne que le pied droit. Étirement vertical lissé du bas de la jambe gauche
(tarse + griffes) — le haut de la jambe, la cape et la jambe droite restent intacts.

  python3 tools/reine-pied.py assets/ch1/reine-orig.png public/props/ch1/reine.png
"""
import sys
import numpy as np
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert('RGBA')).astype(np.float32)
H, W, _ = im.shape
a = im[:, :, 3]

def lowest(x0, x1):
    rows = np.where((a[:, x0:x1] > 128).any(axis=1))[0]
    return rows.max()

left, right = lowest(150, 340), lowest(420, 520)
D = float(right - left)  # décalage à rattraper (px)
print(f'pied gauche y={left}, pied droit y={right}, décalage {D:.0f}px')

Y0, Y1 = 800.0, float(left) - 30.0   # rampe : 0 au-dessus de Y0, D sous Y1
X0, X1, F = 120.0, 330.0, 18.0       # bande de la jambe gauche, fondu latéral F

def smooth(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)

ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
wx = smooth((xs - (X0 - F)) / F) * smooth(((X1 + F) - xs) / F)
# carte inverse : pour chaque pixel de sortie y, on cherche la source s avec s + dy(s) = y
s = ys.copy()
for _ in range(12):
    s = ys - D * wx * smooth((s - Y0) / (Y1 - Y0))

# échantillonnage bilinéaire vertical (x inchangé), en alpha prémultiplié
s = np.clip(s, 0, H - 1)
s0 = np.floor(s).astype(int); s1 = np.minimum(s0 + 1, H - 1); f = (s - s0)[..., None]
xi = xs.astype(int)
pm = im.copy(); pm[:, :, :3] *= pm[:, :, 3:4] / 255.0
out = pm[s0, xi] * (1 - f) + pm[s1, xi] * f
al = out[:, :, 3:4]
out[:, :, :3] = np.where(al > 0, out[:, :, :3] * 255.0 / np.maximum(al, 1e-3), 0)
Image.fromarray(np.clip(out, 0, 255).round().astype(np.uint8), 'RGBA').save(dst, optimize=True)
print('ok', dst)
