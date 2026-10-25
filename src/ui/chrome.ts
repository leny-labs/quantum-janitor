// Habillage commun de l'interface : panneaux biseautés à liseré lumineux,
// équerres d'angle, bandes de danger. Tout est dessiné (Graphics), rien en HTML.
import Phaser from 'phaser';
import { COLORS, hex } from './theme';

export interface PanelOpts {
  fill?: number;
  fillAlpha?: number;
  /** Couleur du liseré (et du halo). */
  edge?: number;
  edgeAlpha?: number;
  /** Taille du biseau d'angle (haut-gauche / bas-droit). */
  cut?: number;
  glow?: boolean;
  /** Équerres claires aux quatre coins. */
  brackets?: boolean;
}

function chamfer(x: number, y: number, w: number, h: number, c: number): Phaser.Geom.Point[] {
  return [
    new Phaser.Geom.Point(x + c, y),
    new Phaser.Geom.Point(x + w, y),
    new Phaser.Geom.Point(x + w, y + h - c),
    new Phaser.Geom.Point(x + w - c, y + h),
    new Phaser.Geom.Point(x, y + h),
    new Phaser.Geom.Point(x, y + c),
  ];
}

/** Dessine un panneau biseauté dans `g` (sans l'effacer). */
export function drawPanel(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, o: PanelOpts = {}): void {
  const c = Math.min(o.cut ?? 14, w / 3, h / 3);
  const edge = o.edge ?? COLORS.panelBorder;
  const pts = chamfer(x, y, w, h, c);
  if (o.glow ?? true) {
    for (const [width, alpha] of [[10, 0.06], [6, 0.1], [3, 0.16]] as const) {
      g.lineStyle(width, edge, alpha * (o.edgeAlpha ?? 1));
      g.strokePoints(pts, true);
    }
  }
  g.fillStyle(o.fill ?? COLORS.panel, o.fillAlpha ?? 0.94);
  g.fillPoints(pts, true);
  // reflet haut : liseré clair intérieur
  g.fillStyle(0xffffff, 0.05);
  g.fillPoints(chamfer(x + 3, y + 3, w - 6, Math.min(h * 0.45, 40), Math.max(0, c - 3)).slice(0, 6), true);
  g.lineStyle(1.5, edge, o.edgeAlpha ?? 0.9);
  g.strokePoints(pts, true);
  if (o.brackets) {
    const L = Math.min(16, w / 5, h / 5);
    g.lineStyle(2, 0xffffff, 0.75);
    g.beginPath();
    g.moveTo(x + w - L, y - 4).lineTo(x + w + 4, y - 4).lineTo(x + w + 4, y + L);
    g.moveTo(x - 4, y + h - L).lineTo(x - 4, y + h + 4).lineTo(x + L, y + h + 4);
    g.strokePath();
  }
}

/** Bande de danger jaune/noir (diagonales) dans un rectangle. */
export function drawHazard(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, alpha = 1): void {
  g.fillStyle(0x1a1030, alpha);
  g.fillRect(x, y, w, h);
  g.fillStyle(hex(COLORS.hover), alpha);
  const step = h * 1.6;
  for (let i = -h; i < w; i += step) {
    const x0 = Math.max(x, x + i);
    const pts = [
      new Phaser.Geom.Point(x + i, y + h),
      new Phaser.Geom.Point(x + i + h, y),
      new Phaser.Geom.Point(x + i + h + step / 2, y),
      new Phaser.Geom.Point(x + i + step / 2, y + h),
    ].map((p) => new Phaser.Geom.Point(Phaser.Math.Clamp(p.x, x, x + w), p.y));
    if (x0 <= x + w) g.fillPoints(pts, true);
  }
}

/** Petite LED ronde avec halo. */
export function drawLed(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number, r = 3): void {
  g.fillStyle(color, 0.25);
  g.fillCircle(x, y, r * 2.4);
  g.fillStyle(color, 1);
  g.fillCircle(x, y, r);
}
