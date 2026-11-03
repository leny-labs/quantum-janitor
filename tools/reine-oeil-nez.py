#!/usr/bin/env python3
"""Reine en pied (public/props/ch1/reine.png) : l'œil lointain passe SOUS le museau.

Dans le sprite GenAI, le contour gauche du museau s'arrêtait sous l'œil gauche
(côté spectateur) : entre (256, 224) et le pli du museau (284, 209), c'était le
bas de l'œil (contour noir + blanc + iris) qui servait de bord au museau, si bien
que l'œil « flottait » devant le nez en gros plan.

Correctif : on prolonge le contour du museau par une courbe (Bézier) qui part de
son bord gauche et rejoint le pli, on remplit l'intérieur avec la chitine du
museau située juste en dessous (décalage vertical colonne par colonne), puis on
redessine le contour noir (qui se fond dans la couleur du pli vers la droite) et
le liseré clair intérieur. Le bas de l'œil est ainsi masqué par le museau.

Entrée : assets/ch1/reine-pre-oeil.png (sprite après le fix du pied, conservé).
Sortie : public/props/ch1/reine.png.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/ch1/reine-pre-oeil.png"
DST = ROOT / "public/props/ch1/reine.png"

# Courbe du nouveau bord du museau (px du sprite 768 × 1024)
P = [(255.5, 225.0), (258.0, 216.0), (264.0, 207.5), (285.0, 208.5)]
BOX = (236, 190, 300, 245)  # zone de travail
SS = 8  # suréchantillonnage des tracés
OUTLINE = np.array([1, 0, 0], float)
CREASE = np.array([104, 45, 3], float)
RIM = np.array([212, 149, 93], float)


def bezier(n=200):
    t = np.linspace(0, 1, n)[:, None]
    p = np.array(P, float)
    return ((1 - t) ** 3) * p[0] + 3 * ((1 - t) ** 2) * t * p[1] + 3 * (1 - t) * t * t * p[2] + t ** 3 * p[3]


def coverage(draw_fn):
    """Masque de couverture [0, 1] sur BOX, tracé à SS× puis réduit."""
    w, h = BOX[2] - BOX[0], BOX[3] - BOX[1]
    m = Image.new("L", (w * SS, h * SS), 0)
    draw_fn(ImageDraw.Draw(m), lambda pts: [((x - BOX[0]) * SS, (y - BOX[1]) * SS) for x, y in pts])
    return np.asarray(m.resize((w, h), Image.BOX), float) / 255.0


def main():
    im = Image.open(SRC).convert("RGBA")
    a = np.asarray(im, float).copy()
    rgb = a[..., :3]
    lum = rgb @ [0.299, 0.587, 0.114]
    curve = bezier()

    # y de la courbe pour chaque colonne
    def yc(x):
        i = np.argmin(np.abs(curve[:, 0] - x))
        return curve[i, 1]

    # 1) remplissage : pour chaque colonne, chitine du museau remontée jusqu'à la courbe
    inside = coverage(lambda d, tr: d.polygon(tr(list(map(tuple, curve)) + [(285, 232), (254, 232)]), fill=255))
    filled = rgb.copy()
    for x in range(BOX[0], BOX[2]):
        y0 = yc(x)
        if x < P[0][0] - 1 or x > P[3][0]:
            continue
        # bas du contour noir de l'œil sous la courbe → début de la chitine existante
        ys = [y for y in range(int(y0), 234) if lum[y, x] < 70]
        if not ys:
            continue
        ye = max(ys) + 2
        d = ye - int(np.floor(y0))
        for y in range(int(np.floor(y0)) - 1, ye):
            sy = min(y + d, a.shape[0] - 1)
            filled[y, x] = rgb[sy, x]
    # adoucit la couture de la recopie
    blur = np.asarray(Image.fromarray(filled.clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6)), float)
    filled = filled * 0.5 + blur * 0.5
    sl = (slice(BOX[1], BOX[3]), slice(BOX[0], BOX[2]))
    k = inside[..., None]
    rgb[sl] = rgb[sl] * (1 - k) + filled[sl] * k

    # 2) liseré clair intérieur (décalé de ~2 px vers l'intérieur), qui s'éteint vers le pli
    n = len(curve)
    rim_pts = curve + np.array([1.8, 1.8])
    for j in range(n - 1):
        f = j / (n - 1)
        alpha = 0.55 * max(0.0, 1 - f / 0.55)
        if alpha <= 0:
            break
        c = coverage(lambda d, tr: d.line(tr([tuple(rim_pts[j]), tuple(rim_pts[j + 1])]), fill=255, width=int(1.4 * SS)))
        rgb[sl] = rgb[sl] * (1 - c[..., None] * alpha) + RIM * (c[..., None] * alpha)

    # 3) contour noir, qui se fond dans la couleur du pli (et s'affine) vers la droite
    segs = 24
    for s in range(segs):
        f0, f1 = s / segs, (s + 1) / segs
        pts = curve[int(f0 * (n - 1)): int(f1 * (n - 1)) + 1]
        f = (f0 + f1) / 2
        t = min(1.0, max(0.0, (f - 0.45) / 0.5))
        col = OUTLINE * (1 - t) + CREASE * t
        width = 2.3 * (1 - t) + 1.6 * t
        c = coverage(lambda d, tr: d.line(tr(list(map(tuple, pts))), fill=255, width=int(width * SS), joint="curve"))
        rgb[sl] = rgb[sl] * (1 - c[..., None]) + col * c[..., None]

    a[..., :3] = rgb
    Image.fromarray(a.clip(0, 255).round().astype(np.uint8), "RGBA").save(DST, optimize=True)
    print("écrit", DST)


if __name__ == "__main__":
    main()
