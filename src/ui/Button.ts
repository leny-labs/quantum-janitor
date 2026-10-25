import Phaser from 'phaser';
import { drawLed, drawPanel } from './chrome';
import { COLORS, FONT, hex } from './theme';

export interface ButtonOpts {
  size?: number;
  /** Ancrage horizontal du bouton sur `x`. */
  align?: 'left' | 'center' | 'right';
  /** Ancrage vertical : `top` = `y` est le bord haut. */
  valign?: 'top' | 'middle';
  /** Bouton principal (plein, cyan) ou secondaire (fumé). */
  primary?: boolean;
  /** Petit texte au-dessus du libellé (référence de formulaire, etc.). */
  kicker?: string;
  minWidth?: number;
}

/** Bouton biseauté avec liseré lumineux, survol et pression. */
export function makeButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  opts: ButtonOpts = {},
): Phaser.GameObjects.Container {
  const size = opts.size ?? 26;
  const primary = opts.primary ?? false;
  const text = scene.add
    .text(0, 0, label.toUpperCase(), { fontFamily: FONT, fontSize: `${size}px`, fontStyle: '600', color: primary ? '#07050f' : COLORS.text })
    .setOrigin(0.5);
  text.setLetterSpacing?.(size * 0.08);
  const kicker = opts.kicker
    ? scene.add.text(0, 0, opts.kicker, { fontFamily: FONT, fontSize: `${Math.round(size * 0.42)}px`, color: primary ? '#07050f' : COLORS.dim }).setOrigin(0.5).setAlpha(0.8)
    : null;
  const padX = size * 1.2;
  const padY = size * (kicker ? 0.55 : 0.45);
  const w = Math.max(opts.minWidth ?? 0, text.width + padX * 2 + 18);
  const h = text.height + padY * 2 + (kicker ? size * 0.5 : 0);
  const g = scene.add.graphics();
  const draw = (hover: boolean, down = false) => {
    g.clear();
    const accent = hex(hover ? COLORS.hover : COLORS.accent);
    drawPanel(g, -w / 2, -h / 2, w, h, {
      fill: primary ? accent : hover ? COLORS.panelHi : COLORS.panel,
      fillAlpha: primary ? (down ? 0.8 : 1) : 0.88,
      edge: accent,
      cut: size * 0.5,
      glow: hover || primary,
    });
    drawLed(g, -w / 2 + 16, 0, primary ? COLORS.ink : accent, 3);
    text.setColor(primary ? '#07050f' : hover ? COLORS.hover : COLORS.text);
  };
  if (kicker) {
    kicker.setY(-h / 2 + padY * 0.9);
    text.setY(size * 0.22);
  }
  draw(false);
  const parts: Phaser.GameObjects.GameObject[] = [g, text];
  if (kicker) parts.push(kicker);
  const ox = opts.align === 'left' ? w / 2 : opts.align === 'right' ? -w / 2 : 0;
  const oy = opts.valign === 'top' ? h / 2 : 0;
  const c = scene.add.container(x + ox, y + oy, parts).setSize(w, h);
  c.setInteractive({ useHandCursor: true });
  c.on('pointerover', () => {
    draw(true);
    scene.tweens.add({ targets: c, scale: 1.04, duration: 120, ease: 'Quad.easeOut' });
  });
  c.on('pointerout', () => {
    draw(false);
    scene.tweens.add({ targets: c, scale: 1, duration: 160, ease: 'Quad.easeOut' });
  });
  c.on('pointerdown', (p: Phaser.Input.Pointer) => {
    if (!p.leftButtonDown()) return;
    draw(true, true);
    onClick();
  });
  return c;
}
