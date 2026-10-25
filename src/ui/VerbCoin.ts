import Phaser from 'phaser';
import { verbIconScale, verbIconTexture, type VerbIcon } from './chrome';
import { cssToGame } from './input';
import { COLORS, FONT, H, ROOM_H, W, hex } from './theme';

export interface CoinVerb {
  /** Libellé complet (« Prendre le fusible »), affiché au survol. */
  label: string;
  icon: VerbIcon;
  run: () => void;
}

export interface CoinOpts {
  /** Tactile : boutons ≥ 48 px CSS, coin décalé au-dessus du doigt. */
  touch?: boolean;
}

/** Arc des boutons au-dessus du moyeu (degrés, 0 = droite, -90 = haut). */
const ARCS: Record<number, number[]> = {
  1: [-90],
  2: [-135, -45],
  3: [-150, -90, -30],
  4: [-165, -115, -65, -15],
};

/** Octogone centré sur (0, 0). */
function octagon(r: number): Phaser.Geom.Point[] {
  return Array.from({ length: 8 }, (_, i) => {
    const a = Math.PI / 8 + (i * Math.PI) / 4;
    return new Phaser.Geom.Point(Math.cos(a) * r, Math.sin(a) * r);
  });
}

function drawCoinButton(g: Phaser.GameObjects.Graphics, r: number, on: boolean): void {
  g.clear();
  const color = hex(on ? COLORS.hover : COLORS.accent);
  for (const [w, a] of [[10, 0.07], [5, 0.14]] as const) {
    g.lineStyle(w, color, a * (on ? 2 : 1));
    g.strokePoints(octagon(r), true);
  }
  g.fillStyle(on ? COLORS.panelHi : COLORS.panel, 0.94);
  g.fillPoints(octagon(r), true);
  g.fillStyle(0xffffff, on ? 0.09 : 0.05);
  g.fillPoints(octagon(r - 3).filter((p) => p.y < 0), true);
  g.lineStyle(2, color, 0.95);
  g.strokePoints(octagon(r), true);
  g.lineStyle(1, color, 0.3);
  g.strokePoints(octagon(r - 5), true);
}

/**
 * Verb coin façon Monkey Island / Thimbleweed Park : quelques boutons ronds en
 * arc, collés au curseur (ou au-dessus du doigt), touches 1…n. Échap, clic
 * ailleurs ou clic droit dans le vide le referment.
 */
export class VerbCoin {
  private root: Phaser.GameObjects.Container | null = null;
  private blocker: Phaser.GameObjects.Rectangle | null = null;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(private scene: Phaser.Scene) {
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.close());
  }

  get isOpen(): boolean {
    return this.root !== null;
  }

  open(x: number, y: number, title: string, verbs: CoinVerb[], opts: CoinOpts = {}): void {
    this.close();
    const s = this.scene;
    const touch = !!opts.touch;
    const n = Math.min(verbs.length, 4);
    // diamètre : 60 px de jeu à la souris, ≥ 52 px CSS au doigt
    const d = touch ? Math.max(68, cssToGame(s, 52)) : 60;
    const r = d / 2;
    const R = d + 12;
    const chipH = touch ? 34 : 28;
    const noteH = 15;
    // espace nécessaire autour du moyeu : arc au-dessus, cartouche en dessous
    const up = R + r + 8;
    const down = chipH + noteH + 20;

    let cx = x;
    let cy = touch ? y - cssToGame(s, 44) : y;
    const minY = 6 + up;
    const maxY = Math.min(ROOM_H, H) - down;
    if (cy < minY) {
      // trop près du haut : on descend le moyeu et, au doigt, on s'écarte
      // latéralement pour ne pas poser les boutons sous la main
      cy = minY;
      if (touch && y > cy - up) cx += x < W / 2 ? R + r : -(R + r);
    }
    cy = Math.min(cy, maxY);
    const spanX = n === 1 ? r : R + r;
    cx = Phaser.Math.Clamp(cx, 8 + spanX, W - 8 - spanX);

    this.blocker = s.add.rectangle(0, 0, W, H, 0, 0.001).setOrigin(0).setDepth(850).setInteractive();
    this.blocker.on('pointerdown', () => this.close());
    const root = (this.root = s.add.container(cx, cy).setDepth(851));

    // moyeu : point + cartouche du nom
    const hub = s.add.graphics();
    hub.fillStyle(hex(COLORS.hover), 0.25);
    hub.fillCircle(0, 0, 9);
    hub.fillStyle(hex(COLORS.hover), 1);
    hub.fillCircle(0, 0, 3.5);
    root.add(hub);
    const chip = s.add.graphics();
    const name = s.add
      .text(0, 12 + chipH / 2, title.toUpperCase(), { fontFamily: FONT, fontSize: touch ? '17px' : '14px', fontStyle: '700', color: COLORS.accent })
      .setOrigin(0.5)
      .setLetterSpacing(1.5);
    const note = s.add
      .text(0, 14 + chipH - 3, 'Usage autorisé par SYLVIE · consigné', { fontFamily: FONT, fontSize: '10px', fontStyle: 'italic 500', color: COLORS.dim })
      .setOrigin(0.5, 0)
      .setAlpha(0.9);
    const paintChip = (text: string, on: boolean) => {
      name.setText(text.toUpperCase()).setColor(on ? COLORS.hover : COLORS.accent).setScale(1);
      const maxW = W - 40;
      if (name.width > maxW) name.setScale(maxW / name.width);
      const w = Math.max(name.displayWidth, note.width) + 28;
      // le cartouche reste dans l'écran même si le moyeu est au bord
      const shift = Phaser.Math.Clamp(0, 8 - (cx - w / 2), W - 8 - (cx + w / 2));
      name.setX(shift);
      note.setX(shift);
      chip.clear();
      chip.fillStyle(COLORS.ink, 0.86);
      chip.fillRoundedRect(shift - w / 2, 14, w, chipH + noteH, 6);
      chip.lineStyle(1.5, hex(on ? COLORS.hover : COLORS.accent), 0.7);
      chip.strokeRoundedRect(shift - w / 2, 14, w, chipH + noteH, 6);
    };
    paintChip(title, false);
    root.add([chip, name, note]);

    const iconPx = touch ? 28 : 24;
    ARCS[n].forEach((deg, i) => {
      const v = verbs[i];
      const a = Phaser.Math.DegToRad(deg);
      const bx = Math.cos(a) * R;
      const by = Math.sin(a) * R;
      const btn = s.add.container(0, 0).setScale(0.3).setAlpha(0);
      const g = s.add.graphics();
      const icon = s.add.image(0, -5, verbIconTexture(s, v.icon, iconPx)).setScale(verbIconScale());
      const short = v.label.split(' ')[0];
      const label = s.add
        .text(0, r * 0.5, short.toUpperCase(), { fontFamily: FONT, fontSize: touch ? '12px' : '10px', fontStyle: '700', color: COLORS.text })
        .setOrigin(0.5)
        .setLetterSpacing(1);
      if (label.width > d - 14) label.setScale((d - 14) / label.width);
      const key = s.add
        .text(r * 0.72, -r * 0.72, String(i + 1), { fontFamily: FONT, fontSize: '11px', fontStyle: '700', color: '#07050f', backgroundColor: COLORS.accent, padding: { x: 4, y: 1 } })
        .setOrigin(0.5)
        .setVisible(!touch);
      const paint = (on: boolean) => {
        drawCoinButton(g, r, on);
        icon.setTint(hex(on ? COLORS.hover : COLORS.accent));
        label.setColor(on ? COLORS.hover : COLORS.text);
        key.setBackgroundColor(on ? COLORS.hover : COLORS.accent);
        paintChip(on ? `${v.label} : ${title}` : title, on);
      };
      paint(false);
      btn.add([g, icon, label, key]);
      btn.setSize(d, d).setInteractive(new Phaser.Geom.Circle(r, r, r + 4), Phaser.Geom.Circle.Contains);
      btn.on('pointerover', () => {
        paint(true);
        s.tweens.add({ targets: btn, scale: 1.08, duration: 90, ease: 'Quad.easeOut' });
      });
      btn.on('pointerout', () => {
        paint(false);
        s.tweens.add({ targets: btn, scale: 1, duration: 110, ease: 'Quad.easeOut' });
      });
      btn.on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (p.rightButtonDown()) return this.close();
        this.choose(v);
      });
      root.add(btn);
      // pop radial depuis le moyeu (~120 ms, léger décalage par bouton)
      s.tweens.add({ targets: btn, x: bx, y: by, scale: 1, alpha: 1, duration: 130, delay: i * 18, ease: 'Back.easeOut' });
    });
    root.setScale(0.85).setAlpha(0);
    s.tweens.add({ targets: root, scale: 1, alpha: 1, duration: 110, ease: 'Quad.easeOut' });

    this.keyHandler = (e: KeyboardEvent) => {
      const k = parseInt(e.key, 10);
      if (k >= 1 && k <= n) this.choose(verbs[k - 1]);
      else if (e.key === 'Escape') this.close();
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  private choose(v: CoinVerb): void {
    this.close();
    v.run();
  }

  close(): void {
    if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
    this.keyHandler = null;
    if (this.root) this.scene.tweens.killTweensOf([this.root, ...this.root.list]);
    this.root?.destroy();
    this.blocker?.destroy();
    this.root = null;
    this.blocker = null;
  }
}
