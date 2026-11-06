// Carnet de déduction (ch.1, docs/CHAPTER1.md « Carnet de déduction ») : bouton HUD « CARNET »
// (touche C / N, pastille « nouveau »), notification « Noté au carnet », et overlay paperasse
// façon Detective Grimoire : constatations + conclusions à gauche, deux emplacements
// « INDICE A + INDICE B → DÉDUIRE » à droite. Mauvaise paire = réplique absurde, sans pénalité.
// Rien n'est stocké ici : indices = conditions sur l'état, déductions = flags (engine/clues.ts).
import Phaser from 'phaser';
import { clueText, concluded, deduce, knownClues, type Carnet, type ClueDef, type DeductionDef } from '../engine/clues';
import type { GameState } from '../engine/GameState';
import { lang, t, tl } from '../i18n';
import { itemIconKey } from '../three/Studio';
import { makeButton } from './Button';
import { drawPanel } from './chrome';
import { cssToGame, isTouch, TOUCH_TARGET_CSS } from './input';
import { pickupCue, stampClonk, tick, unlockCue } from './sfx';
import { COLORS, DISPLAY, FONT, H, MONO, W, hex } from './theme';

const PAPER = 0xf3ecd8;
const RULE = 0x9fb4d8;
const INK = '#2a2830';
const INK_N = 0x2a2830;
const RED = '#c0392b';
const TEAL = '#1f7f73';
const DIM = '#5a5870';
/** Dents de la roue du carnet : un cran = une rangée de la liste. */
const GEAR_TEETH = 14;

// ── suivi « nouveau » (hors sauvegarde : un indice déjà là au chargement n'est pas « nouveau ») ──

interface Tracker {
  seen: Set<string>;
  unread: Set<string>;
}
const trackers = new WeakMap<GameState, Tracker>();

function tracker(state: GameState, c: Carnet): Tracker {
  let tr = trackers.get(state);
  if (!tr) {
    tr = { seen: new Set([...knownClues(state, c).map((k) => k.id), ...concluded(state, c).map((d) => d.id)]), unread: new Set() };
    trackers.set(state, tr);
  }
  return tr;
}

/** Indices notés depuis le dernier appel (à appeler à chaque changement d'état). */
export function freshClues(state: GameState, c: Carnet): ClueDef[] {
  const tr = tracker(state, c);
  const fresh = knownClues(state, c).filter((k) => !tr.seen.has(k.id));
  for (const k of fresh) {
    tr.seen.add(k.id);
    tr.unread.add(k.id);
  }
  return fresh;
}

export function hasUnread(state: GameState, c: Carnet): boolean {
  return tracker(state, c).unread.size > 0;
}

// ── pictogrammes dessinés ────────────────────────────────────────────

/** Dessine un pictogramme `kind` centré en (x, y), taille `s` (≈ côté). */
export function drawPicto(g: Phaser.GameObjects.Graphics, kind: string, x: number, y: number, s: number, color = INK_N): void {
  const k = s / 32;
  const P = (px: number, py: number) => new Phaser.Geom.Point(x + px * k, y + py * k);
  g.lineStyle(2 * k, color, 1);
  g.fillStyle(color, 1);
  switch (kind) {
    case 'clock': {
      g.fillStyle(0xfffaf0, 1);
      g.fillCircle(x, y, 13 * k);
      g.strokeCircle(x, y, 13 * k);
      g.lineBetween(x, y, x, y - 9 * k);
      g.lineBetween(x, y, x - 6 * k, y - 3 * k);
      g.lineStyle(1.4 * k, hex(RED), 1);
      g.lineBetween(x, y, x + 5 * k, y + 8 * k);
      break;
    }
    case 'schedule': {
      g.fillStyle(0xfffaf0, 1);
      g.fillRect(x - 11 * k, y - 13 * k, 22 * k, 26 * k);
      g.strokeRect(x - 11 * k, y - 13 * k, 22 * k, 26 * k);
      g.fillStyle(hex(TEAL), 1);
      g.fillRect(x - 11 * k, y - 13 * k, 22 * k, 6 * k);
      g.lineStyle(2 * k, color, 1);
      for (const yy of [0, 6]) g.lineBetween(x - 7 * k, y + yy * k, x + 7 * k, y + yy * k);
      break;
    }
    case 'display': {
      g.fillStyle(0x1a1418, 1);
      g.fillRect(x - 15 * k, y - 8 * k, 30 * k, 16 * k);
      g.fillStyle(0xff4f5a, 1);
      for (let i = 0; i < 4; i++) g.fillRect(x - 11 * k + i * 6 * k, y - 4 * k, 4 * k, 8 * k);
      break;
    }
    case 'ticket': {
      g.fillStyle(0xfff2b0, 1);
      g.fillRect(x - 13 * k, y - 8 * k, 26 * k, 16 * k);
      g.strokeRect(x - 13 * k, y - 8 * k, 26 * k, 16 * k);
      g.lineBetween(x - 5 * k, y - 8 * k, x - 5 * k, y + 8 * k);
      break;
    }
    case 'skeleton': {
      g.fillStyle(0xfffaf0, 1);
      g.fillCircle(x, y - 6 * k, 9 * k);
      g.strokeCircle(x, y - 6 * k, 9 * k);
      g.fillStyle(color, 1);
      g.fillCircle(x - 3.5 * k, y - 7 * k, 2.2 * k);
      g.fillCircle(x + 3.5 * k, y - 7 * k, 2.2 * k);
      for (let i = -1; i <= 1; i++) g.lineBetween(x + i * 4 * k - 4 * k, y + 6 * k + Math.abs(i) * k, x + i * 4 * k + 4 * k, y + 6 * k + Math.abs(i) * k);
      g.lineBetween(x, y + 3 * k, x, y + 13 * k);
      break;
    }
    case 'stamp': {
      g.fillStyle(0x7a4a2c, 1);
      g.fillRect(x - 3 * k, y - 14 * k, 6 * k, 12 * k);
      g.fillCircle(x, y - 14 * k, 5 * k);
      g.fillStyle(color, 1);
      g.fillRect(x - 11 * k, y - 2 * k, 22 * k, 6 * k);
      g.lineStyle(2 * k, hex(RED), 1);
      g.strokeRect(x - 13 * k, y + 7 * k, 26 * k, 7 * k);
      break;
    }
    case 'speech': {
      g.fillStyle(0xfffaf0, 1);
      g.fillRoundedRect(x - 14 * k, y - 11 * k, 28 * k, 18 * k, 5 * k);
      g.strokeRoundedRect(x - 14 * k, y - 11 * k, 28 * k, 18 * k, 5 * k);
      g.fillTriangle(x - 6 * k, y + 6 * k, x + 1 * k, y + 6 * k, x - 8 * k, y + 13 * k);
      g.fillStyle(color, 1);
      for (const dx of [-6, 0, 6]) g.fillCircle(x + dx * k, y - 2 * k, 1.8 * k);
      break;
    }
    case 'shard': {
      const pts = [P(0, -15), P(9, -3), P(5, 13), P(-6, 12), P(-9, -2)];
      g.fillStyle(0x8a6dff, 1);
      g.fillPoints(pts, true);
      g.strokePoints(pts, true);
      g.lineStyle(1.2 * k, 0xffffff, 0.8);
      g.lineBetween(x, y - 15 * k, x - 1 * k, y + 12 * k);
      // ondes : ça tremble
      g.lineStyle(1.5 * k, color, 0.7);
      g.lineBetween(x + 12 * k, y - 8 * k, x + 15 * k, y - 4 * k);
      g.lineBetween(x - 12 * k, y + 4 * k, x - 15 * k, y + 8 * k);
      break;
    }
    case 'map': {
      const xs = [-13, -4, 4, 13];
      for (let i = 0; i < 3; i++) {
        const pts = [P(xs[i], i % 2 ? -9 : -12), P(xs[i + 1], i % 2 ? -12 : -9), P(xs[i + 1], i % 2 ? 9 : 12), P(xs[i], i % 2 ? 12 : 9)];
        g.fillStyle(i === 1 ? 0xe9e0c6 : 0xfffaf0, 1);
        g.fillPoints(pts, true);
        g.strokePoints(pts, true);
      }
      g.fillStyle(hex(RED), 1);
      g.fillCircle(x + 6 * k, y - 2 * k, 3 * k);
      break;
    }
    case 'form': {
      g.fillStyle(0xfffaf0, 1);
      g.fillRect(x - 10 * k, y - 14 * k, 20 * k, 28 * k);
      g.strokeRect(x - 10 * k, y - 14 * k, 20 * k, 28 * k);
      for (const yy of [-8, -3, 2]) g.lineBetween(x - 6 * k, y + yy * k, x + 6 * k, y + yy * k);
      g.lineStyle(2.4 * k, hex(RED), 1);
      g.lineBetween(x - 13 * k, y + 12 * k, x + 13 * k, y - 4 * k);
      break;
    }
    case 'shutter': {
      g.fillStyle(0xa9afb8, 1);
      g.fillRect(x - 13 * k, y - 13 * k, 26 * k, 12 * k);
      g.lineStyle(1.2 * k, color, 1);
      for (let i = 1; i < 4; i++) g.lineBetween(x - 13 * k, y - 13 * k + i * 3 * k, x + 13 * k, y - 13 * k + i * 3 * k);
      g.lineStyle(2 * k, color, 1);
      g.strokeRect(x - 13 * k, y - 13 * k, 26 * k, 26 * k);
      g.fillStyle(hex(TEAL), 1);
      g.fillTriangle(x, y + 1 * k, x - 6 * k, y + 8 * k, x + 6 * k, y + 8 * k);
      break;
    }
    case 'conclusion': {
      // ampoule tamponnée
      g.fillStyle(0xffd166, 1);
      g.fillCircle(x, y - 4 * k, 10 * k);
      g.strokeCircle(x, y - 4 * k, 10 * k);
      g.fillStyle(color, 1);
      g.fillRect(x - 5 * k, y + 6 * k, 10 * k, 3 * k);
      g.fillRect(x - 4 * k, y + 10 * k, 8 * k, 3 * k);
      break;
    }
    default:
      g.strokeRect(x - 10 * k, y - 10 * k, 20 * k, 20 * k);
  }
}

/** Icône d'une pièce : icône d'inventaire (`item:<id>`) si chargée, sinon pictogramme. */
function pieceIcon(scene: Phaser.Scene, state: GameState, icon: string | undefined, x: number, y: number, s: number): Phaser.GameObjects.GameObject {
  if (icon?.startsWith('item:')) {
    const key = itemIconKey(icon.slice(5), (f) => state.hasFlag(f));
    if (scene.textures.exists(key)) return scene.add.image(x, y, key).setDisplaySize(s * 1.15, s * 1.15);
  }
  const g = scene.add.graphics();
  drawPicto(g, icon?.startsWith('item:') ? 'ticket' : (icon ?? 'conclusion'), x, y, s);
  return g;
}

// ── bouton HUD ───────────────────────────────────────────────────────

export type CarnetButton = Phaser.GameObjects.Container & { setUnread(on: boolean): void };

/**
 * Trombone Gem qui pince le bord haut d'une feuille (bord à y = 0, coords locales ×k) :
 * `back` = jambe longue + grand coude, à dessiner AVANT la feuille (seul le coude dépasse au-dessus
 * du bord, le reste est masqué par le papier) ; `front` = l'autre jambe, coude du bas, boucle
 * intérieure, à dessiner APRÈS la feuille. Le papier passe entre les deux fils.
 * Sans `inner` (petite taille), la face avant s'arrête à la remontée du coude du bas.
 */
function paperclip(g: Phaser.GameObjects.Graphics, x: number, y: number, k: number, part: 'back' | 'front', inner = true): void {
  // fil : a = jambe avant extérieure, b / c = boucle intérieure, d = jambe arrière (longue)
  const [a, b, c, d] = inner ? [0, 5, 12, 18] : [0, 0, 9, 18];
  const top = -16;
  const bot = 50;
  const R = (d - a) / 2;
  const r = (c - a) / 2;
  const X = (u: number) => x + u * k;
  const Y = (v: number) => y + v * k;
  g.beginPath();
  if (part === 'back') {
    g.moveTo(X(d), Y(40));
    g.lineTo(X(d), Y(top + R));
    g.arc(X(a + R), Y(top + R), R * k, 0, -Math.PI, true);
    g.lineTo(X(a), Y(2));
  } else {
    g.moveTo(X(a), Y(0));
    g.lineTo(X(a), Y(bot - r));
    g.arc(X(a + r), Y(bot - r), r * k, Math.PI, 0, true);
    if (inner) {
      const ri = (c - b) / 2;
      g.lineTo(X(c), Y(4 + ri));
      g.arc(X(b + ri), Y(4 + ri), ri * k, 0, -Math.PI, true);
      g.lineTo(X(b), Y(38));
    } else g.lineTo(X(c), Y(14));
  }
  g.strokePath();
}

/** Bouton carré « carnet » (touche C) : dossier à trombone, même habillage que ♪ / PLAN ; pastille « nouveau ». */
export function makeCarnetToggle(scene: Phaser.Scene, x: number, y: number, size: number, label: string, onOpen: () => void): CarnetButton {
  const g = scene.add.graphics();
  let hover = false;
  let pressed = false;
  let unread = false;
  const draw = () => {
    const accent = hex(hover ? COLORS.hover : COLORS.accent);
    const s = (size / 38) * (pressed ? 0.92 : 1);
    g.clear();
    drawPanel(g, -size / 2, -size / 2, size, size, { fill: hover ? COLORS.panelHi : COLORS.panel, fillAlpha: 0.88, edge: accent, cut: size * 0.25, glow: hover });
    // dossier : onglet + chemise, feuille qui dépasse, lignes manuscrites
    g.fillStyle(accent, 0.3);
    g.fillRect(-11 * s, -10 * s, 9 * s, 4 * s);
    // trombone : fil arrière d'abord (coude au-dessus du bord de la feuille, jambe masquée)
    const warm = hex(COLORS.warm);
    const ck = 0.27 * s;
    g.lineStyle(1.8 * s, warm, 1);
    paperclip(g, 3.6 * s, -9 * s, ck, 'back', false);
    g.fillStyle(0xf3ecd8, 0.95);
    g.fillRect(-8 * s, -9 * s, 17 * s, 18 * s);
    g.lineStyle(1.2 * s, INK_N, 0.8);
    for (const yy of [-4, 0, 4]) g.lineBetween(-5 * s, yy * s, 6 * s, yy * s);
    g.fillStyle(accent, 0.45);
    g.fillRect(-12 * s, -6 * s, 24 * s, 17 * s);
    g.lineStyle(1.8 * s, accent, 1);
    g.strokeRect(-12 * s, -6 * s, 24 * s, 17 * s);
    // trombone : fil avant, par-dessus la feuille (elle passe entre les deux fils)
    g.lineStyle(1.8 * s, warm, 1);
    paperclip(g, 3.6 * s, -9 * s, ck, 'front', false);
    if (unread) {
      g.fillStyle(COLORS.ink, 1);
      g.fillCircle(size / 2 - 4, -size / 2 + 4, 7.5);
      g.fillStyle(hex(COLORS.danger), 1);
      g.fillCircle(size / 2 - 4, -size / 2 + 4, 6);
      g.fillStyle(0xffffff, 1);
      g.fillRect(size / 2 - 5, -size / 2 + 0.5, 2, 4.5);
      g.fillRect(size / 2 - 5, -size / 2 + 6, 2, 2);
    }
  };
  draw();
  const tip = scene.add
    .text(0, size / 2 + 6, label, { fontFamily: FONT, fontSize: `${Math.round(13 * (size / 38))}px`, color: COLORS.hover, backgroundColor: '#07050fcc', padding: { x: 5, y: 2 } })
    .setOrigin(0.5, 0)
    .setVisible(false);
  const c = scene.add.container(x, y, [g, tip]).setSize(size, size) as CarnetButton;
  const pad = Math.max(0, ((isTouch() ? cssToGame(scene, TOUCH_TARGET_CSS) : 0) - size) / 2);
  c.setInteractive({ hitArea: new Phaser.Geom.Rectangle(-pad, -pad, size + pad * 2, size + pad * 2), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
  c.on('pointerover', () => {
    hover = true;
    tip.setVisible(!isTouch());
    draw();
  });
  c.on('pointerout', () => {
    hover = pressed = false;
    tip.setVisible(false);
    draw();
  });
  c.on('pointerdown', (p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
    e.stopPropagation();
    if (!(p.leftButtonDown() || p.wasTouch)) return;
    pressed = true;
    draw();
    scene.time.delayedCall(90, () => {
      if (!c.active) return;
      pressed = false;
      draw();
    });
    onOpen();
  });
  c.setUnread = (on: boolean) => {
    if (on === unread) return;
    unread = on;
    draw();
  };
  return c;
}

/** Petite fiche « Noté au carnet » sous les boutons du HUD (non bloquante, ≈ 2,5 s). */
export function notifyNoted(scene: Phaser.Scene, x: number, y: number, fresh: ClueDef[]): void {
  if (!fresh.length) return;
  const L = lang();
  const title = clueText(fresh[fresh.length - 1].title, L);
  const head = scene.add.text(0, 0, `✎ ${t('hud.carnetNoted')}`, { fontFamily: FONT, fontSize: '12px', fontStyle: '700', color: RED }).setLetterSpacing(2);
  const body = scene.add.text(0, 17, title + (fresh.length > 1 ? `  ${t('hud.carnetMore', { n: fresh.length - 1 })}` : ''), {
    fontFamily: FONT,
    fontSize: '15px',
    fontStyle: '700',
    color: INK,
    wordWrap: { width: 300 },
  });
  const w = Math.max(head.width, body.width) + 24;
  const h = body.y + body.height + 14;
  const bg = scene.add.graphics();
  bg.fillStyle(0x000000, 0.3);
  bg.fillRect(-8, -6, w, h);
  bg.fillStyle(PAPER, 1);
  bg.fillRect(-12, -10, w, h);
  bg.lineStyle(1, RULE, 0.6);
  bg.lineBetween(-12, 12, w - 12, 12);
  bg.fillStyle(hex(COLORS.warm), 1);
  bg.fillRect(w - 26, -14, 5, 14);
  const card = scene.add.container(x - w + 12, y + 10, [bg, head, body]).setDepth(720).setAngle(-1.2).setAlpha(0);
  scene.tweens.add({ targets: card, alpha: 1, y: y + 16, duration: 220, ease: 'Quad.easeOut' });
  scene.tweens.add({ targets: card, alpha: 0, delay: 2600, duration: 400, onComplete: () => card.destroy() });
  pickupCue();
}

// ── overlay ──────────────────────────────────────────────────────────

type Piece = { id: string; title: string; text: string; icon?: string; conclusion: boolean; /** « → tenter … » (conclusions) */ piste?: string };

type Result = { kind: 'ok' | 'already'; d: DeductionDef } | { kind: 'rejected'; line: string } | null;

export class CarnetOverlay {
  private root: Phaser.GameObjects.Container;
  private dyn: Phaser.GameObjects.Container;
  private onKey: (e: KeyboardEvent) => void;
  private closed = false;
  private slots: [string | null, string | null] = [null, null];
  private focus: string | null = null;
  private result: Result = null;
  private readonly px: number;
  private readonly py: number;
  private readonly pw: number;
  private readonly ph: number;
  private readonly rejectedBag: string[] = [];
  private readonly sheetAngle: number;
  // ── liste défilante (colonne gauche) : conteneur racine masqué (Phaser ne masque que les
  // conteneurs à la racine), calé sur la feuille ; la roue crantée vit dans la marge ──
  private listRoot: Phaser.GameObjects.Container;
  private inner: Phaser.GameObjects.Container;
  private maskG: Phaser.GameObjects.Graphics;
  private sticky!: Phaser.GameObjects.Text;
  private wheel: Phaser.GameObjects.Container;
  private gear: Phaser.GameObjects.Graphics;
  private chevrons: Phaser.GameObjects.Graphics;
  private wheelZone: Phaser.GameObjects.Zone;
  /** Défilement vertical de la liste (≥ 0), conservé d'un render() à l'autre. */
  private listScroll = 0;
  private maxScroll = 0;
  private rowH = 40;
  private stickyLabels = { clues: '', conclusions: '', concY: 0 };
  private zones: { zone: Phaser.GameObjects.Zone; y: number; h: number }[] = [];
  private rowPos = new Map<string, { y: number; h: number }>();
  private drag: { y: number; scroll: number; moved: boolean; wheel: boolean } | null = null;
  private scrollTween: Phaser.Tweens.Tween | null = null;
  private wheelTarget: number | null = null;
  private wheelAcc = 0;
  private notch = 0;
  private lastTick = 0;
  private offInput: () => void;

  constructor(
    private scene: Phaser.Scene,
    private carnet: Carnet,
    private state: GameState,
    private onClose: () => void,
    /** Nom affiché d'un locuteur (« bob » → « B.O.B. »), pour la réplique sous la conclusion. */
    private speakerName: (id: string) => string | undefined = () => undefined,
  ) {
    const touch = isTouch();
    this.root = scene.add.container(0, 0).setDepth(2500);
    const dim = scene.add.rectangle(0, 0, W, H, COLORS.ink, 0.72).setOrigin(0).setInteractive();
    dim.on('pointerdown', () => !this.drag?.moved && this.close());
    this.root.add(dim);

    this.px = touch ? 16 : 56;
    this.py = touch ? 10 : 22;
    this.pw = W - this.px * 2;
    this.ph = H - this.py * 2;
    const { pw, ph } = this;
    this.sheetAngle = touch ? 0 : 0.4;
    const sheet = scene.add.container(this.px, this.py).setAngle(this.sheetAngle);
    // trombone sur le coin, fil arrière : posé avant la feuille, qui en masque la jambe
    const CLIP = 0x9aa0a8;
    const clipX = pw - 64;
    const clipBack = scene.add.graphics();
    clipBack.lineStyle(4, CLIP, 1);
    paperclip(clipBack, clipX, 0, 1, 'back');
    const paper = scene.add.graphics();
    paper.fillStyle(0x000000, 0.35);
    paper.fillRect(8, 10, pw, ph);
    paper.fillStyle(PAPER, 1);
    paper.fillRect(0, 0, pw, ph);
    // lignes de cahier + marge rouge
    paper.lineStyle(1, RULE, 0.35);
    for (let y = 100; y < ph - 8; y += 26) paper.lineBetween(0, y, pw, y);
    paper.lineStyle(1.5, hex(RED), 0.35);
    paper.lineBetween(48, 0, 48, ph);
    // perforations
    paper.fillStyle(0xd8d0b8, 1);
    for (let y = 60; y < ph; y += 120) paper.fillCircle(22, y, 8);
    paper.lineStyle(3, INK_N, 0.8);
    paper.strokeRect(10, 10, pw - 20, ph - 20);
    // séparation colonne gauche / droite
    paper.lineStyle(2, INK_N, 0.25);
    paper.lineBetween(this.split, 96, this.split, ph - 24);
    const block = scene.add.zone(0, 0, pw, ph).setOrigin(0).setInteractive();
    sheet.add([clipBack, paper, block]);
    sheet.add(scene.add.text(62, 20, t('carnet.title'), { fontFamily: DISPLAY, fontSize: touch ? '24px' : '28px', color: INK }).setLetterSpacing(2));
    sheet.add(scene.add.text(64, 58, t('carnet.sub'), { fontFamily: FONT, fontSize: '12px', fontStyle: '700', color: DIM, wordWrap: { width: pw - 360 } }).setLetterSpacing(1.5));
    sheet.add(scene.add.text(pw - 340, 26, t('carnet.stamp'), { fontFamily: DISPLAY, fontSize: '24px', color: RED }).setAngle(-8).setAlpha(0.55));
    // trombone, fil avant (par-dessus la feuille) : ombre portée sur le papier, empreinte de la
    // jambe arrière qui marque la feuille, puis le fil
    const clip = scene.add.graphics();
    clip.lineStyle(4, 0x000000, 0.14);
    paperclip(clip, clipX + 2, 2, 1, 'front');
    clip.lineStyle(2, INK_N, 0.12);
    clip.lineBetween(clipX + 18, 3, clipX + 18, 40);
    clip.lineStyle(4, CLIP, 1);
    paperclip(clip, clipX, 0, 1, 'front');
    sheet.add(clip);
    this.dyn = scene.add.container(0, 0);
    sheet.add(this.dyn);
    // roue crantée (fixe, dans la marge, au-dessus de la liste masquée)
    const v = this.view;
    const R = this.wheelR;
    this.gear = scene.add.graphics();
    this.chevrons = scene.add.graphics();
    const socket = scene.add.graphics();
    this.drawSocket(socket, R);
    this.wheel = scene.add.container(this.wheelX, v.y + v.h / 2, [socket, this.gear, this.chevrons]);
    this.drawGear(R);
    this.wheelZone = scene.add.zone(0, v.y, this.view.x + 6, v.h).setOrigin(0).setInteractive({ cursor: 'ns-resize' });
    sheet.add([this.wheel, this.wheelZone]);
    this.root.add(sheet);
    const close = makeButton(scene, this.px + pw - 24, this.py + ph - 34, t('carnet.close'), () => this.close(), { align: 'right', size: 16, kicker: t('carnet.closeKicker') });
    this.root.add(close);
    this.listRoot = scene.add.container(this.px, this.py).setDepth(2501).setAngle(this.sheetAngle);
    this.inner = scene.add.container(0, 0);
    this.listRoot.add(this.inner);
    this.maskG = scene.make.graphics({}, false).setPosition(this.px, this.py).setAngle(this.sheetAngle);
    this.maskG.fillStyle(0xffffff).fillRect(v.x, v.y, v.w, v.h);
    this.listRoot.setMask(this.maskG.createGeometryMask());
    this.offInput = this.bindScroll();

    this.render();
    const first = [...tracker(state, carnet).unread].find((id) => this.rowPos.has(id));
    if (first) this.reveal(first, false);
    this.root.setAlpha(0).setScale(0.96).setPosition(W * 0.02, H * 0.02);
    this.syncList();
    scene.tweens.add({ targets: this.root, alpha: 1, scale: 1, x: 0, y: 0, duration: 220, ease: 'Quad.easeOut', onUpdate: () => this.syncList() });
    pickupCue();
    if (import.meta.env.DEV) {
      (window as unknown as { __qjCarnet?: object }).__qjCarnet = {
        scrollTo: (y: number) => this.scrollTo(y, false),
        scrollToEnd: () => this.scrollTo(this.maxScroll, false),
        scroll: () => this.listScroll,
        max: () => this.maxScroll,
        /** Centre de la roue, coordonnées jeu. */
        wheel: () => this.toWorld(this.wheelX, v.y + v.h / 2),
        /** Point au milieu de la liste, coordonnées jeu. */
        list: () => this.toWorld(v.x + v.w / 2, v.y + v.h / 2),
        /** Clic simulé sur une pièce (captures) ; `deduce` = bouton DÉDUIRE. */
        pick: (id: string) => this.pick(id),
        deduce: () => this.deduce(),
      };
    }

    this.onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'c' || e.key === 'C' || e.key === 'n' || e.key === 'N') this.close();
      else if (e.key === 'Enter' && this.slots[0] && this.slots[1]) this.deduce();
    };
    window.addEventListener('keydown', this.onKey);
  }

  /** x de la séparation entre la liste (gauche) et le bureau de déduction (droite). */
  private get split(): number {
    return Math.round(this.pw * 0.5);
  }

  private pieces(): { clues: Piece[]; conclusions: Piece[] } {
    const L = lang();
    return {
      clues: knownClues(this.state, this.carnet).map((c) => ({ id: c.id, title: clueText(c.title, L), text: clueText(c.text, L), icon: c.icon, conclusion: false })),
      conclusions: concluded(this.state, this.carnet).map((d) => ({ id: d.id, title: clueText(d.title, L), text: clueText(d.text, L), icon: d.icon ?? 'conclusion', conclusion: true, piste: d.piste ? clueText(d.piste, L) : undefined })),
    };
  }

  private render(): void {
    this.dyn.removeAll(true);
    this.inner.removeAll(true);
    this.zones = [];
    this.rowPos.clear();
    const s = this.scene;
    const { clues, conclusions } = this.pieces();
    const all = [...clues, ...conclusions];
    const unread = tracker(this.state, this.carnet).unread;

    // ── gauche : constatations (2 colonnes), puis conclusions — hauteur de case fixe, la liste
    // défile (masque + roue crantée) quand elle dépasse ──
    const v = this.view;
    const x0 = 62;
    const colGap = 10;
    const colW = (this.split - x0 - 16 - colGap) / 2;
    const rowH = (this.rowH = Math.max(isTouch() ? cssToGame(s, 40) : 0, 40));
    // en-tête collant (hors masque) : CONSTATATIONS, puis CONCLUSIONS quand on y arrive
    this.stickyLabels.clues = `${t('carnet.clues')} (${clues.length})`;
    this.stickyLabels.conclusions = `${t('carnet.conclusions')} (${conclusions.length})`;
    this.sticky = s.add.text(x0, v.y - 20, this.stickyLabels.clues, { fontFamily: FONT, fontSize: '13px', fontStyle: '700', color: DIM }).setLetterSpacing(2);
    this.dyn.add(this.sticky);
    const y0 = v.y + 4;
    clues.forEach((p, i) => this.row(p, x0 + (i % 2) * (colW + colGap), y0 + Math.floor(i / 2) * rowH, colW, rowH - 5, unread.has(p.id)));
    const cy = (this.stickyLabels.concY = y0 + Math.ceil(clues.length / 2) * rowH + 8);
    this.inner.add(s.add.text(x0, cy, this.stickyLabels.conclusions, { fontFamily: FONT, fontSize: '13px', fontStyle: '700', color: RED }).setLetterSpacing(2));
    let end = cy + 22;
    if (!conclusions.length) {
      const none = s.add.text(x0, cy + 24, t('carnet.noConclusion'), { fontFamily: FONT, fontSize: '13px', fontStyle: 'italic', color: DIM, wordWrap: { width: this.split - x0 - 20 } });
      this.inner.add(none);
      end = none.y + none.height;
    }
    conclusions.forEach((p, i) => this.row(p, x0 + (i % 2) * (colW + colGap), cy + 22 + Math.floor(i / 2) * rowH, colW, rowH - 5, this.result?.kind === 'ok' && this.result.d.id === p.id));
    end += Math.ceil(conclusions.length / 2) * rowH;
    this.maxScroll = Math.max(0, Math.ceil(end + 6 - (v.y + v.h)));
    const on = this.maxScroll > 0;
    this.wheel.setVisible(on);
    if (this.wheelZone.input) this.wheelZone.input.enabled = on;
    this.applyScroll(this.listScroll, true);

    // ── droite : fiche de la pièce lue, emplacements A + B, verdict ──
    const rx = this.split + 22;
    const rw = this.pw - rx - 30;
    const focus = all.find((p) => p.id === this.focus);
    const detailH = 180;
    const dg = s.add.graphics();
    dg.fillStyle(0xfffaf0, 0.9);
    dg.fillRect(rx, 100, rw, detailH);
    dg.lineStyle(1.5, INK_N, 0.35);
    dg.strokeRect(rx, 100, rw, detailH);
    this.dyn.add(dg);
    if (focus) {
      this.dyn.add(pieceIcon(s, this.state, focus.icon, rx + 32, 132, 40));
      this.dyn.add(s.add.text(rx + 62, 112, focus.title, { fontFamily: FONT, fontSize: '17px', fontStyle: '700', color: focus.conclusion ? RED : INK, wordWrap: { width: rw - 74 } }));
      const body = s.add.text(rx + 14, 160, focus.text, { fontFamily: FONT, fontSize: '14px', color: INK, wordWrap: { width: rw - 28 }, lineSpacing: 2 }).setMaxLines(focus.piste ? 4 : 6);
      this.dyn.add(body);
      // piste « → tenter … » (façon Detective Grimoire) : la prochaine hypothèse, sous la conclusion
      if (focus.piste) this.dyn.add(this.piste(focus.piste, rx + 14, body.y + body.height + 6, rw - 28));
    } else {
      this.dyn.add(s.add.text(rx + 16, 116, t('carnet.hint'), { fontFamily: FONT, fontSize: '14px', fontStyle: 'italic', color: DIM, wordWrap: { width: rw - 32 } }));
    }

    // emplacements A + B → DÉDUIRE
    const sy = 100 + detailH + 18;
    const slotW = (rw - 40) / 2;
    const slotH = 64;
    (['carnet.slotA', 'carnet.slotB'] as const).forEach((key, i) => {
      const x = rx + i * (slotW + 40);
      const id = this.slots[i];
      const p = all.find((q) => q.id === id);
      const g = s.add.graphics();
      g.fillStyle(p ? 0xffffff : 0xece6d4, 1);
      g.fillRect(x, sy, slotW, slotH);
      g.lineStyle(2, p ? hex(TEAL) : INK_N, p ? 1 : 0.45);
      if (p) g.strokeRect(x, sy, slotW, slotH);
      else for (let k = 0; k < slotW; k += 12) g.lineBetween(x + k, sy, x + Math.min(k + 6, slotW), sy), g.lineBetween(x + k, sy + slotH, x + Math.min(k + 6, slotW), sy + slotH);
      this.dyn.add(g);
      this.dyn.add(s.add.text(x + 6, sy - 15, t(key), { fontFamily: FONT, fontSize: '11px', fontStyle: '700', color: DIM }).setLetterSpacing(2));
      if (p) {
        this.dyn.add(pieceIcon(s, this.state, p.icon, x + 24, sy + slotH / 2, 30));
        this.dyn.add(s.add.text(x + 46, sy + slotH / 2, p.title, { fontFamily: FONT, fontSize: '13px', fontStyle: '700', color: p.conclusion ? RED : INK, wordWrap: { width: slotW - 54 } }).setOrigin(0, 0.5).setMaxLines(3));
        const hit = s.add.zone(x, sy, slotW, slotH).setOrigin(0).setInteractive({ useHandCursor: true });
        hit.on('pointerup', () => {
          this.slots[i] = null;
          this.result = null;
          this.render();
        });
        this.dyn.add(hit);
      } else {
        this.dyn.add(s.add.text(x + slotW / 2, sy + slotH / 2, t('carnet.slotEmpty'), { fontFamily: FONT, fontSize: '12px', fontStyle: 'italic', color: DIM }).setOrigin(0.5));
      }
    });
    this.dyn.add(s.add.text(rx + slotW + 20, sy + slotH / 2, '+', { fontFamily: DISPLAY, fontSize: '26px', color: INK }).setOrigin(0.5));
    const ready = !!(this.slots[0] && this.slots[1]);
    const btn = makeButton(s, rx + rw / 2, sy + slotH + 40, t('carnet.deduce'), () => ready && this.deduce(), { size: 18, kicker: t('carnet.deduceKicker'), primary: ready });
    btn.setAlpha(ready ? 1 : 0.45);
    this.dyn.add(btn);

    // verdict
    const vy = sy + slotH + 80;
    const r = this.result;
    if (r) {
      const vh = Math.min(this.ph - vy - 70, 150);
      const vg = s.add.graphics();
      vg.fillStyle(r.kind === 'rejected' ? 0xf6dcd6 : 0xe4f3ec, 1);
      vg.fillRect(rx, vy, rw, vh);
      vg.lineStyle(2, r.kind === 'rejected' ? hex(RED) : hex(TEAL), 0.7);
      vg.strokeRect(rx, vy, rw, vh);
      this.dyn.add(vg);
      if (r.kind === 'rejected') {
        this.dyn.add(s.add.text(rx + rw - 14, vy + 10, t('carnet.rejectedStamp'), { fontFamily: DISPLAY, fontSize: '22px', color: RED }).setOrigin(1, 0).setAngle(-6).setAlpha(0.8));
        this.dyn.add(s.add.text(rx + 14, vy + 46, r.line, { fontFamily: MONO, fontSize: '14px', fontStyle: 'bold', color: INK, wordWrap: { width: rw - 28 } }));
      } else {
        const L = lang();
        const d = r.d;
        this.dyn.add(s.add.text(rx + 14, vy + 10, clueText(d.title, L).toUpperCase(), { fontFamily: FONT, fontSize: '16px', fontStyle: '700', color: RED, wordWrap: { width: rw - 150 } }).setLetterSpacing(1));
        // le texte de la conclusion est dans la fiche au-dessus : ici, la réplique (ou « déjà conclu »)
        if (r.kind === 'already') this.dyn.add(s.add.text(rx + 14, vy + 60, t('carnet.already'), { fontFamily: MONO, fontSize: '14px', fontStyle: 'bold', color: INK, wordWrap: { width: rw - 28 } }));
        else if (d.line) {
          const said = this.speech(clueText(d.line, L), rx + 14, vy + 52, rw - 28);
          this.dyn.add(said);
          if (d.piste) this.dyn.add(this.piste(clueText(d.piste, L), rx + 14, Math.min(said.y + said.height + 8, vy + vh - 40), rw - 28));
        }
        const stamp = s.add.text(rx + rw - 16, vy + 8, t('carnet.validated'), { fontFamily: DISPLAY, fontSize: '26px', color: TEAL }).setOrigin(1, 0).setAngle(-9);
        const frame = s.add.graphics();
        frame.lineStyle(3, hex(TEAL), 1);
        frame.strokeRect(stamp.x - stamp.width - 8, stamp.y - 4, stamp.width + 16, stamp.height + 8);
        const stampBox = s.add.container(0, 0, [frame, stamp]).setAlpha(0.85);
        this.dyn.add(stampBox);
        if (r.kind === 'ok' && !(r as { shown?: boolean }).shown) {
          (r as { shown?: boolean }).shown = true;
          stampBox.setScale(1.6).setAlpha(0);
          s.tweens.add({ targets: stampBox, scale: 1, alpha: 0.85, duration: 180, ease: 'Back.easeOut' });
        }
      }
    }
  }

  /** Piste « → tenter … » : rouge tampon (la réplique de B.O.B. est sarcelle), deux lignes au plus. */
  private piste(text: string, x: number, y: number, w: number): Phaser.GameObjects.Text {
    return this.scene.add.text(x, y, text, { fontFamily: FONT, fontSize: '13px', fontStyle: 'bold italic', color: RED, wordWrap: { width: w } }).setMaxLines(2); // i18n-ignore
  }

  /** Réplique (« bob: … ») sous la conclusion : italique, couleur du locuteur (B.O.B. = sarcelle). */
  private speech(line: string, x: number, y: number, w: number): Phaser.GameObjects.Text {
    const m = line.match(/^([a-z_]+):\s*/);
    const who = m?.[1];
    const name = who && who !== 'narrateur' ? this.speakerName(who) : undefined;
    const text = m ? line.slice(m[0].length) : line;
    return this.scene.add.text(x, y, name ? `${name} — ${text}` : text, {
      fontFamily: FONT,
      fontSize: '13px',
      fontStyle: who === 'narrateur' ? 'italic' : 'bold italic', // i18n-ignore
      color: who === 'bob' ? TEAL : who === 'narrateur' ? DIM : INK,
      wordWrap: { width: w },
    });
  }

  private row(p: Piece, x: number, y: number, w: number, h: number, isNew: boolean): void {
    const s = this.scene;
    const c = s.add.container(x, y);
    const g = s.add.graphics();
    const slotted = this.slots.includes(p.id);
    const paint = (hover: boolean) => {
      g.clear();
      g.fillStyle(slotted ? 0xd9fff4 : hover ? 0xfff5d6 : p.conclusion ? 0xfbe9e4 : 0xfffaf0, 1);
      g.fillRect(0, 0, w, h);
      g.lineStyle(slotted || this.focus === p.id ? 2.5 : 1.2, slotted ? hex(TEAL) : p.conclusion ? hex(RED) : INK_N, slotted ? 1 : 0.5);
      g.strokeRect(0, 0, w, h);
    };
    paint(false);
    c.add(g);
    const icon = Math.min(h - 6, 28);
    c.add(pieceIcon(s, this.state, p.icon, 6 + icon / 2, h / 2, icon));
    c.add(
      s.add
        .text(icon + 12, h / 2, p.title, { fontFamily: FONT, fontSize: h < 34 ? '12px' : '13px', fontStyle: '700', color: p.conclusion ? RED : INK, wordWrap: { width: w - icon - 18 - (isNew ? 50 : 0) } })
        .setOrigin(0, 0.5)
        .setMaxLines(2),
    );
    if (p.conclusion) {
      c.add(s.add.text(w - 4, 2, `✓ ${t('carnet.validated')}`, { fontFamily: FONT, fontSize: '9px', fontStyle: '700', color: TEAL }).setOrigin(1, 0));
    }
    if (isNew) {
      const tag = s.add.text(w - 4, h - 3, t('carnet.newTag'), { fontFamily: FONT, fontSize: '10px', fontStyle: '700', color: '#ffffff', backgroundColor: RED, padding: { x: 3, y: 1 } }).setOrigin(1, 1);
      c.add(tag);
    }
    // zone cliquable rognée au champ visible (un GeometryMask ne coupe pas l'input)
    const hit = s.add.zone(0, 0, w, h).setOrigin(0);
    hit.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, 0, w, h),
      hitAreaCallback: (r: Phaser.Geom.Rectangle, hx: number, hy: number) => Phaser.Geom.Rectangle.Contains(r, hx, hy) && this.inView(y + hy - this.listScroll),
      useHandCursor: true,
    });
    hit.on('pointerover', () => paint(true));
    hit.on('pointerout', () => paint(false));
    hit.on('pointerup', () => !this.drag?.moved && this.pick(p.id));
    c.add(hit);
    this.zones.push({ zone: hit, y, h });
    this.rowPos.set(p.id, { y, h });
    this.inner.add(c);
  }

  // ── défilement de la liste ─────────────────────────────────────────

  /** Champ visible de la liste (coordonnées feuille) : sous l'en-tête, jusqu'au bas de la feuille. */
  private get view(): { x: number; y: number; w: number; h: number } {
    const y = 124;
    return { x: 50, y, w: this.split - 4 - 50, h: this.ph - 30 - y };
  }

  /** x du centre de la roue, dans la marge (entre perforations et filet rouge). */
  private get wheelX(): number {
    return 26;
  }

  /** Rayon de la roue (dents comprises) : assez grande pour le doigt, sans mordre sur la liste. */
  private get wheelR(): number {
    return isTouch() ? 21 : 19;
  }

  private inView(y: number): boolean {
    const v = this.view;
    return y >= v.y && y <= v.y + v.h;
  }

  /** Feuille → jeu (rotation de la feuille + échelle de l'ouverture). */
  private toWorld(x: number, y: number): { x: number; y: number } {
    const k = this.root.scaleX;
    const a = Phaser.Math.DegToRad(this.sheetAngle);
    return { x: this.root.x + k * (this.px + x * Math.cos(a) - y * Math.sin(a)), y: this.root.y + k * (this.py + x * Math.sin(a) + y * Math.cos(a)) };
  }

  /** Jeu → feuille. */
  private toSheet(x: number, y: number): { x: number; y: number } {
    const k = this.root.scaleX || 1;
    const a = Phaser.Math.DegToRad(this.sheetAngle);
    const dx = (x - this.root.x) / k - this.px;
    const dy = (y - this.root.y) / k - this.py;
    return { x: dx * Math.cos(a) + dy * Math.sin(a), y: -dx * Math.sin(a) + dy * Math.cos(a) };
  }

  /** Cale la liste masquée (conteneur racine) sur la feuille pendant l'animation d'ouverture. */
  private syncList(): void {
    const k = this.root.scaleX;
    const x = this.root.x + this.px * k;
    const y = this.root.y + this.py * k;
    this.listRoot.setPosition(x, y).setScale(k).setAlpha(this.root.alpha);
    this.maskG.setPosition(x, y).setScale(k);
  }

  /** Position de cran la plus proche (une rangée), la butée basse comptant pour un cran. */
  private snap(v: number): number {
    if (v >= this.maxScroll - this.rowH / 2) return this.maxScroll;
    return Phaser.Math.Clamp(Math.round(v / this.rowH) * this.rowH, 0, this.maxScroll);
  }

  private applyScroll(v: number, silent = false): void {
    const max = this.maxScroll;
    this.listScroll = Phaser.Math.Clamp(v, 0, max);
    this.inner.y = -this.listScroll;
    // un cran de roue = une rangée
    this.gear.rotation = -(this.listScroll / this.rowH) * ((Math.PI * 2) / GEAR_TEETH);
    this.drawChevrons(this.listScroll > 0.5, this.listScroll < max - 0.5);
    const crossed = this.stickyLabels.concY - this.listScroll < this.view.y - 4;
    this.sticky.setText(crossed ? this.stickyLabels.conclusions : this.stickyLabels.clues).setColor(crossed ? RED : DIM);
    // les zones hors champ restent cliquables pour Phaser : on coupe celles dont le centre est masqué
    for (const z of this.zones) if (z.zone.input) z.zone.input.enabled = this.inView(z.y + z.h / 2 - this.listScroll);
    const n = Math.round(this.listScroll / this.rowH);
    if (n !== this.notch) {
      this.notch = n;
      const now = this.scene.time.now;
      if (!silent && now - this.lastTick > 45) {
        this.lastTick = now;
        tick();
      }
    }
  }

  private scrollTo(v: number, animate = true): void {
    this.scrollTween?.remove();
    this.scrollTween = null;
    const to = Phaser.Math.Clamp(v, 0, this.maxScroll);
    if (!animate || Math.abs(to - this.listScroll) < 0.5) {
      this.applyScroll(to);
      this.wheelTarget = null;
      return;
    }
    const o = { v: this.listScroll };
    this.scrollTween = this.scene.tweens.add({
      targets: o,
      v: to,
      duration: Phaser.Math.Clamp(Math.abs(to - this.listScroll) * 2.2, 110, 320),
      ease: 'Quad.easeOut',
      onUpdate: () => this.applyScroll(o.v),
      onComplete: () => {
        this.scrollTween = null;
        this.wheelTarget = null;
      },
    });
  }

  /** Fait défiler pour que la pièce `id` soit entièrement visible. */
  private reveal(id: string, animate = true): void {
    const r = this.rowPos.get(id);
    if (!r) return;
    const v = this.view;
    let to = this.listScroll;
    if (r.y - to < v.y) to = r.y - v.y - 4;
    else if (r.y + r.h - to > v.y + v.h) to = r.y + r.h - (v.y + v.h) + 6;
    if (to !== this.listScroll) this.scrollTo(to, animate);
  }

  /** Molette (souris / pavé), glisser sur la liste (tactile, slop) ou sur la roue. */
  private bindScroll(): () => void {
    const s = this.scene;
    const slop = () => cssToGame(s, 10);
    const inLeft = (p: Phaser.Input.Pointer) => {
      const q = this.toSheet(p.x, p.y);
      const v = this.view;
      return { q, list: q.x >= v.x && q.x <= v.x + v.w && q.y >= v.y && q.y <= v.y + v.h, wheel: q.x >= 0 && q.x < v.x + 6 && q.y >= v.y && q.y <= v.y + v.h };
    };
    const down = (p: Phaser.Input.Pointer) => {
      if (this.closed || this.maxScroll <= 0) return;
      const h = inLeft(p);
      if (!h.list && !h.wheel) return;
      this.scrollTween?.remove();
      this.scrollTween = null;
      this.wheelTarget = null;
      this.drag = { y: p.y, scroll: this.listScroll, moved: h.wheel, wheel: h.wheel };
    };
    const move = (p: Phaser.Input.Pointer) => {
      if (!this.drag || !p.isDown) return;
      const dy = (p.y - this.drag.y) / (this.root.scaleX || 1);
      if (!this.drag.moved && Math.abs(dy) < slop()) return;
      this.drag.moved = true;
      // la liste suit le doigt, et la roue entraîne le papier dans le même sens
      this.applyScroll(this.drag.scroll - dy);
    };
    const up = () => {
      if (!this.drag) return;
      const moved = this.drag.moved;
      // relâché au tour suivant : les « pointerup » des cases (émis avant) voient encore le glisser
      s.time.delayedCall(0, () => (this.drag = null));
      if (moved) this.scrollTo(this.snap(this.listScroll));
    };
    const wheel = (p: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number) => {
      if (this.closed || !(p.event instanceof WheelEvent)) return;
      const h = inLeft(p);
      if (h.q.x > this.split || h.q.y < this.view.y - 30 || h.q.y > this.view.y + this.view.h) return;
      p.event.preventDefault();
      if (this.maxScroll <= 0 || !dy) return;
      // un cran de molette souris (≈ 100 px) = une rangée ; le pavé tactile s'accumule
      this.wheelAcc += dy;
      const step = Math.abs(dy) >= 50 ? Math.sign(dy) : Math.abs(this.wheelAcc) >= 60 ? Math.sign(this.wheelAcc) : 0;
      if (!step) return;
      this.wheelAcc = 0;
      // cran suivant / précédent, aligné sur une rangée (la butée basse compte pour un cran)
      const from = (this.wheelTarget ?? this.snap(this.listScroll)) / this.rowH;
      const to = (step > 0 ? Math.floor(from + 1e-6) + 1 : Math.ceil(from - 1e-6) - 1) * this.rowH;
      this.wheelTarget = to >= this.maxScroll - this.rowH / 2 ? this.maxScroll : Phaser.Math.Clamp(to, 0, this.maxScroll);
      this.scrollTo(this.wheelTarget);
    };
    s.input.on('pointerdown', down);
    s.input.on('pointermove', move);
    s.input.on('pointerup', up);
    s.input.on('pointerupoutside', up);
    s.input.on('wheel', wheel);
    return () => {
      s.input.off('pointerdown', down);
      s.input.off('pointermove', move);
      s.input.off('pointerup', up);
      s.input.off('pointerupoutside', up);
      s.input.off('wheel', wheel);
    };
  }

  // ── roue crantée (laiton, encre) ───────────────────────────────────

  /** Logement fixe de la roue : ombre, plaque rivetée sur la marge, repère d'encre. */
  private drawSocket(g: Phaser.GameObjects.Graphics, R: number): void {
    const hw = R + 5;
    const hh = R + 24;
    g.fillStyle(0x000000, 0.18);
    g.fillRoundedRect(-hw + 2, -hh + 3, hw * 2, hh * 2, 6);
    g.fillStyle(0xe4dac0, 1);
    g.fillRoundedRect(-hw, -hh, hw * 2, hh * 2, 6);
    g.lineStyle(1.5, INK_N, 0.55);
    g.strokeRoundedRect(-hw, -hh, hw * 2, hh * 2, 6);
    // rivets
    g.fillStyle(0x8a7348, 1);
    for (const [x, y] of [[-hw + 5, -hh + 5], [hw - 5, -hh + 5], [-hw + 5, hh - 5], [hw - 5, hh - 5]]) g.fillCircle(x, y, 1.8);
    // creux sous la roue
    g.fillStyle(0x3a3226, 0.35);
    g.fillCircle(1, 2, R + 1);
    // repère fixe (à droite, côté liste) : la dent alignée = la rangée en tête
    g.fillStyle(hex(RED), 0.9);
    g.fillTriangle(hw - 1, 0, hw + 6, -4, hw + 6, 4);
  }

  private drawGear(R: number): void {
    const g = this.gear;
    const n = GEAR_TEETH;
    const rb = R - 4;
    const pts: Phaser.Geom.Point[] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const w = Math.PI / n;
      pts.push(new Phaser.Geom.Point(Math.cos(a - w * 0.62) * rb, Math.sin(a - w * 0.62) * rb));
      pts.push(new Phaser.Geom.Point(Math.cos(a - w * 0.36) * R, Math.sin(a - w * 0.36) * R));
      pts.push(new Phaser.Geom.Point(Math.cos(a + w * 0.36) * R, Math.sin(a + w * 0.36) * R));
      pts.push(new Phaser.Geom.Point(Math.cos(a + w * 0.62) * rb, Math.sin(a + w * 0.62) * rb));
    }
    g.fillStyle(0xb8893a, 1);
    g.fillPoints(pts, true);
    g.lineStyle(1.6, INK_N, 0.9);
    g.strokePoints(pts, true);
    // flasque + reflet
    g.fillStyle(0xd3a955, 1);
    g.fillCircle(0, 0, rb - 3);
    g.lineStyle(1, 0x7a5a22, 0.8);
    g.strokeCircle(0, 0, rb - 3);
    g.lineStyle(2, 0xf3d58c, 0.7);
    g.beginPath();
    g.arc(0, 0, rb - 6, Math.PI * 1.05, Math.PI * 1.45);
    g.strokePath();
    // ajours (3) : on voit la roue tourner
    g.fillStyle(0x6a4e1e, 1);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
      g.fillCircle(Math.cos(a) * (rb * 0.52), Math.sin(a) * (rb * 0.52), Math.max(2.2, R * 0.16));
    }
    // moyeu + index rouge sur la jante
    g.fillStyle(INK_N, 1);
    g.fillCircle(0, 0, 3.4);
    g.fillStyle(0xd3a955, 1);
    g.fillCircle(0, 0, 1.4);
    g.fillStyle(hex(RED), 1);
    g.fillCircle(rb - 6, 0, 1.9);
  }

  /** Flèches d'encre au-dessus / au-dessous : estompées en butée. */
  private drawChevrons(up: boolean, downOk: boolean): void {
    const g = this.chevrons;
    const R = this.wheelR;
    const y = R + 14;
    g.clear();
    g.fillStyle(INK_N, up ? 0.8 : 0.18);
    g.fillTriangle(-6, -y + 4, 6, -y + 4, 0, -y - 4);
    g.fillStyle(INK_N, downOk ? 0.8 : 0.18);
    g.fillTriangle(-6, y - 4, 6, y - 4, 0, y + 4);
  }

  /** Clic sur une pièce : on la lit, et on la pose en A (ou B) ; re-clic = on la retire. */
  private pick(id: string): void {
    this.focus = id;
    this.result = null;
    const at = this.slots.indexOf(id);
    if (at >= 0) this.slots[at] = null;
    else if (!this.slots[0]) this.slots[0] = id;
    else if (!this.slots[1]) this.slots[1] = id;
    else this.slots[1] = id;
    this.render();
  }

  private deduce(): void {
    const [a, b] = this.slots;
    if (!a || !b) return;
    const r = deduce(this.state, this.carnet, a, b);
    if (r.kind === 'rejected') {
      if (!this.rejectedBag.length) this.rejectedBag.push(...Phaser.Utils.Array.Shuffle([...tl('carnet.rejected')]));
      this.result = { kind: 'rejected', line: this.rejectedBag.pop()! };
      stampClonk();
      this.scene.tweens.add({ targets: [this.dyn, this.inner], x: 5, duration: 45, yoyo: true, repeat: 2, onComplete: () => (this.dyn.setX(0), this.inner.setX(0)) });
    } else {
      this.result = { kind: r.kind, d: r.deduction };
      this.slots = [null, null];
      this.focus = r.deduction.id;
      if (r.kind === 'ok') {
        tracker(this.state, this.carnet).seen.add(r.deduction.id);
        this.state.setFlag(r.deduction.set);
        unlockCue();
        stampClonk();
      }
    }
    if (!this.closed) {
      this.render();
      // conclusion fraîchement validée : on la ramène dans le champ
      if (this.result?.kind !== 'rejected' && this.focus) this.reveal(this.focus);
    }
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    tracker(this.state, this.carnet).unread.clear();
    window.removeEventListener('keydown', this.onKey);
    this.offInput();
    this.scrollTween?.remove();
    if (import.meta.env.DEV) delete (window as unknown as { __qjCarnet?: object }).__qjCarnet;
    this.listRoot.clearMask(true);
    this.listRoot.destroy();
    this.maskG.destroy();
    this.root.destroy();
    this.onClose();
  }

  get isOpen(): boolean {
    return !this.closed;
  }
}
