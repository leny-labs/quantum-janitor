"""PERCO : planches de dialogue à humeurs + écran vierge du billboard.

Les portraits GenAI de PERCO ont un visage peint (yeux + bouche) sur l'écran
vert. Pour animer PERCO comme SYLVIE (yeux par humeur + bouche-onde
procédurale), on efface le visage (inpainting par diffusion sur l'écran) et on
redessine des yeux pixel par humeur (src/three/perco-face.json). Pas de bouche :
c'est l'onde (PORTRAIT_WAVES.perco) qui parle.

  python3 -I tools/perco-faces.py

Écrit :
  public/portraits/perco-humeurs-sheet.png          (grève, 4 × 2 cellules de 512)
  public/portraits/perco-travail-humeurs-sheet.png  (au travail)
  public/props/st/perco-ecran.png                    (écran du billboard, sans visage)
"""

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
FACE = json.loads((ROOT / 'src/three/perco-face.json').read_text())
GLYPH = np.array([180, 243, 81], float)

# portrait 512 : boîte intérieure de l'écran, blocs de 7 px, yeux 8 × 8 blocs
SCREEN = (146, 314, 326, 437)  # x0, y0, x1, y1
BLOCK = 7
EYES_Y = 330
EYE_L_X = 176
EYE_R_X = 240

# billboard (props/st/perco-sheet.png, cellule 548 × 1024) : écran
BB_W = 548
BB_SCREEN = (166, 278, 341, 398)
BB_CROP = (150, 262, 358, 414)


def wipe(img: np.ndarray, box) -> np.ndarray:
    """Efface les glyphes verts clairs dans `box` (diffusion des pixels voisins + scanlines)."""
    out = img.astype(float).copy()
    x0, y0, x1, y1 = box
    sub = out[y0:y1, x0:x1, :3]
    r, g, b = sub[..., 0], sub[..., 1], sub[..., 2]
    glyph = (g > 105) & (g > r + 25) & (g > b + 40)
    # tout le rectangle du visage (glyphes + intérieur sombre de la bouche peinte), + marge
    ys, xs = np.nonzero(glyph)
    mask = np.zeros(glyph.shape, bool)
    mask[max(1, ys.min() - 5):min(glyph.shape[0] - 1, ys.max() + 6), max(1, xs.min() - 5):min(glyph.shape[1] - 1, xs.max() + 6)] = True
    fill = sub.copy()
    # premier jet : couleur médiane du fond ; puis diffusion (bords fixés hors masque)
    fill[mask] = np.median(sub[~mask], axis=0)
    for _ in range(1500):
        p = np.pad(fill, ((1, 1), (1, 1), (0, 0)), mode='edge')
        avg = (p[:-2, 1:-1] + p[2:, 1:-1] + p[1:-1, :-2] + p[1:-1, 2:]) / 4
        fill[mask] = avg[mask]
    # scanlines discrètes, prises sur le fond intact (moyenne par ligne / lissée)
    rows = np.array([sub[y][~mask[y]].mean(axis=0) if (~mask[y]).sum() > 8 else sub[y].mean(axis=0) for y in range(sub.shape[0])])
    k = np.ones(9) / 9
    smooth = np.stack([np.convolve(np.pad(rows[:, c], 4, mode='edge'), k, 'valid') for c in range(3)], 1)
    scan = np.clip(rows / np.maximum(smooth, 1), 0.85, 1.15)
    fill[mask] = (fill * scan[:, None, :])[mask]
    # reflet blanc du verre (peu saturé) : on garde l'original
    gloss = (r > 110) & (np.abs(r - g) < 45) & (np.abs(g - b) < 60)
    fill[gloss] = sub[gloss]
    out[y0:y1, x0:x1, :3] = fill
    return out


def eye_bitmaps(name: str):
    g = FACE['glyphs'][name]
    left = g['l']
    right = g.get('r') or [row[::-1] for row in left]
    return left, right


def draw_eyes(img: np.ndarray, name: str, ox: float, oy: float, block: float, lx: float, rx: float):
    """Blocs pixel vert phosphore + halo, en coordonnées de `img` (float RGB[A])."""
    h, w = img.shape[:2]
    lit = np.zeros((h, w), float)
    for bm, ex in zip(eye_bitmaps(name), (lx, rx)):
        for j, row in enumerate(bm):
            for i, ch in enumerate(row):
                if ch != '#':
                    continue
                x0 = int(round(ox + ex + i * block))
                y0 = int(round(oy + j * block))
                x1 = int(round(ox + ex + (i + 1) * block))
                y1 = int(round(oy + (j + 1) * block))
                lit[y0:y1, x0:x1] = 1
    glow = np.asarray(Image.fromarray((lit * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(block * 0.9))).astype(float) / 255
    a = np.clip(glow * 0.55, 0, 1)[..., None]
    img[..., :3] = img[..., :3] * (1 - a) + GLYPH * a
    # cœur des blocs : léger dégradé (haut un peu plus clair), comme les blocs peints
    a = lit[..., None]
    img[..., :3] = img[..., :3] * (1 - a) + GLYPH * a
    return img


def sheet(portrait: str, names, out: str):
    base = np.asarray(Image.open(ROOT / 'public/portraits' / portrait).convert('RGB')).astype(float)
    clean = wipe(base, SCREEN)
    cell = clean.shape[0]
    S = np.zeros((cell * 2, cell * 4, 3), float)
    for i, n in enumerate(names):
        f = draw_eyes(clean.copy(), n, 0, EYES_Y, BLOCK, EYE_L_X, EYE_R_X)
        S[(i // 4) * cell:(i // 4 + 1) * cell, (i % 4) * cell:(i % 4 + 1) * cell] = f
    Image.fromarray(np.clip(S, 0, 255).astype(np.uint8)).save(ROOT / 'public/portraits' / out, optimize=True)
    print('wrote', out)


def billboard_screen():
    src = np.asarray(Image.open(ROOT / 'public/props/st/perco-sheet.png').convert('RGBA')).astype(float)
    cell = src[:, :BB_W].copy()
    clean = wipe(cell, BB_SCREEN)
    x0, y0, x1, y1 = BB_CROP
    crop = clean[y0:y1, x0:x1]
    Image.fromarray(np.clip(crop, 0, 255).astype(np.uint8), 'RGBA').save(ROOT / 'public/props/st/perco-ecran.png', optimize=True)
    print('wrote perco-ecran.png', crop.shape[1], 'x', crop.shape[0])


if __name__ == '__main__':
    sheet('perco-portrait.png', FACE['strike'], 'perco-humeurs-sheet.png')
    sheet('perco-travail-portrait.png', FACE['travail'], 'perco-travail-humeurs-sheet.png')
    billboard_screen()
    sys.exit(0)
