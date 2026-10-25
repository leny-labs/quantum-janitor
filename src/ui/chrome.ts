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

// ── boutons de navigation (sorties) ──────────────────────────────────

export type NavDir = 'left' | 'right' | 'up' | 'down';
export type NavState = 'idle' | 'hover' | 'locked';

/**
 * Bouton de sortie centré sur (0, 0), rayon `r` : octogone biseauté sombre,
 * anneau du thème avec halo, chevron vectoriel. Cyan au repos, ambre au
 * survol, rouge danger si verrouillé.
 */
export function drawNavButton(g: Phaser.GameObjects.Graphics, r: number, dir: NavDir, state: NavState): void {
  g.clear();
  const color = hex(state === 'hover' ? COLORS.hover : state === 'locked' ? COLORS.danger : COLORS.accent);
  const oct = (rad: number) =>
    Array.from({ length: 8 }, (_, i) => {
      const a = Math.PI / 8 + (i * Math.PI) / 4;
      return new Phaser.Geom.Point(Math.cos(a) * rad, Math.sin(a) * rad);
    });
  // halo
  for (const [width, alpha] of [[12, 0.06], [7, 0.1], [4, 0.16]] as const) {
    g.lineStyle(width, color, alpha * (state === 'hover' ? 1.8 : 1));
    g.strokePoints(oct(r), true);
  }
  g.fillStyle(COLORS.panel, 0.72);
  g.fillPoints(oct(r), true);
  // reflet haut
  g.fillStyle(0xffffff, 0.06);
  g.fillPoints(oct(r - 3).filter((p) => p.y < 0), true);
  g.lineStyle(2, color, 0.95);
  g.strokePoints(oct(r), true);
  g.lineStyle(1, color, 0.35);
  g.strokePoints(oct(r - 5), true);
  // encoches aux quatre points cardinaux
  g.lineStyle(2, 0xffffff, state === 'locked' ? 0.25 : 0.6);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    g.lineBetween(Math.cos(a) * (r + 3), Math.sin(a) * (r + 3), Math.cos(a) * (r + 8), Math.sin(a) * (r + 8));
  }
  // chevron (pointe vers la droite, puis tourné)
  const rot = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }[dir];
  const c = r * 0.36;
  const pts = [
    [-c * 0.55, -c],
    [c * 0.55, 0],
    [-c * 0.55, c],
  ].map(([x, y]) => new Phaser.Geom.Point(x * Math.cos(rot) - y * Math.sin(rot), x * Math.sin(rot) + y * Math.cos(rot)));
  g.lineStyle(9, color, 0.18);
  g.strokePoints(pts, false);
  g.lineStyle(5, color, 1);
  g.strokePoints(pts, false);
  for (const p of [pts[0], pts[2]]) {
    g.fillStyle(color, 1);
    g.fillCircle(p.x, p.y, 2.5);
  }
  g.fillCircle(pts[1].x, pts[1].y, 2.5);
}

// ── icônes de verbes ──────────────────────────────────────────────────
// Pictos au trait (grille 24×24, tracés dans l'esprit de Lucide, ISC),
// peints en blanc sur canvas puis teintés : cyan au repos, ambre au survol.

export type VerbIcon = 'look' | 'use' | 'take' | 'press' | 'talk';

const ICON_PATHS: Record<VerbIcon, string[]> = {
  look: [
    'M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0',
    'M15 12a3 3 0 1 1-6 0 3 3 0 1 1 6 0',
  ],
  use: [
    'M18 11V6a2 2 0 0 0-4 0',
    'M14 10V4a2 2 0 0 0-4 0v2',
    'M10 10.5V6a2 2 0 0 0-4 0v8',
    'M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15',
  ],
  take: [
    'M18 11.5V9a2 2 0 0 0-4 0v1.4',
    'M14 10V8a2 2 0 0 0-4 0v2',
    'M10 9.9V9a2 2 0 0 0-4 0v5',
    'M6 14a2 2 0 0 0-4 0',
    'M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8 2 2 0 1 1 4 0',
  ],
  press: [
    'M22 14a8 8 0 0 1-8 8',
    'M18 11v-1a2 2 0 0 0-4 0',
    'M14 10V9a2 2 0 0 0-4 0v1',
    'M10 9.5V4a2 2 0 0 0-4 0v10',
    'M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15',
  ],
  talk: ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', 'M8 10h.01', 'M12 10h.01', 'M16 10h.01'],
};

/** Devine le picto d'un verbe d'après son libellé (« Prendre le fusible » → main qui saisit). */
export function verbIcon(label: string): VerbIcon {
  const l = label.toLowerCase();
  if (l.startsWith('regard') || l.startsWith('examin') || l.startsWith('lire')) return 'look';
  if (l.startsWith('parl') || l.startsWith('discut')) return 'talk';
  if (l.startsWith('prend') || l.startsWith('ramass') || l.startsWith('saisi')) return 'take';
  if (l.startsWith('appuy') || l.startsWith('press') || l.startsWith('activ')) return 'press';
  return 'use';
}

const ICON_RES = 4;

/** Clé de texture du picto (créée à la demande, blanche, à teinter). */
export function verbIconTexture(scene: Phaser.Scene, icon: VerbIcon, px = 22): string {
  const key = `verb-icon-${icon}-${px}`;
  if (scene.textures.exists(key)) return key;
  const pad = 4;
  const size = (px + pad * 2) * ICON_RES;
  const tex = scene.textures.createCanvas(key, size, size)!;
  const ctx = tex.getContext();
  const k = (px * ICON_RES) / 24;
  ctx.translate(pad * ICON_RES, pad * ICON_RES);
  ctx.scale(k, k);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#ffffff';
  // halo doux puis trait net
  for (const [width, blur, alpha] of [[2.6, 6, 0.55], [1.9, 0, 1]] as const) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineWidth = width;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = blur * ICON_RES;
    for (const d of ICON_PATHS[icon]) ctx.stroke(new Path2D(d));
    ctx.restore();
  }
  tex.refresh();
  return key;
}

export function verbIconScale(): number {
  return 1 / ICON_RES;
}
