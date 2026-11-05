import Phaser from 'phaser';
import { drawPanel } from './chrome';
import { cssToGame, isTouch, TOUCH_TARGET_CSS } from './input';
import { COLORS, FONT, hex } from './theme';

/** Bouton carré « plan » (touche P) : carte pliée en 3 volets + marqueur, même habillage que ♪. */
export function makeMapToggle(scene: Phaser.Scene, x: number, y: number, size: number, label: string, onOpen: () => void): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  let hover = false;
  let pressed = false;
  const P = (px: number, py: number) => new Phaser.Geom.Point(px, py);
  const draw = () => {
    const accent = hex(hover ? COLORS.hover : COLORS.accent);
    const s = size / 38;
    const k = pressed ? 0.92 : 1;
    g.clear();
    drawPanel(g, -size / 2, -size / 2, size, size, { fill: hover ? COLORS.panelHi : COLORS.panel, fillAlpha: 0.88, edge: accent, cut: size * 0.25, glow: hover });
    // carte pliée en zig-zag : 4 arêtes verticales, sommets alternés haut/bas
    const xs = [-12, -4, 4, 12].map((v) => v * s * k);
    const top = [-8, -11, -8, -11].map((v) => (v + 1) * s * k);
    const h = 19 * s * k;
    for (let i = 0; i < 3; i++) {
      const pts = [P(xs[i], top[i]), P(xs[i + 1], top[i + 1]), P(xs[i + 1], top[i + 1] + h), P(xs[i], top[i] + h)];
      g.fillStyle(accent, i === 1 ? 0.22 : 0.42);
      g.fillPoints(pts, true);
      g.lineStyle(1.8 * s, accent, 1);
      g.strokePoints(pts, true);
    }
    // tracé de route en pointillés sur les volets
    g.fillStyle(accent, 0.95);
    for (const [px, py] of [[-9, 6], [-6.5, 3.5], [-3.5, 2], [-0.5, 3.5], [2, 5]] as const) g.fillCircle(px * s * k, py * s * k, 0.9 * s);
    // marqueur (épingle) sur le volet droit
    const mx = 6.5 * s * k;
    const my = -1.5 * s * k;
    const warm = hex(COLORS.warm);
    g.fillStyle(COLORS.ink, 0.9);
    g.fillCircle(mx, my, 4.6 * s);
    g.fillStyle(warm, 1);
    g.fillCircle(mx, my, 3.6 * s);
    g.fillTriangle(mx - 3 * s, my + 1.8 * s, mx + 3 * s, my + 1.8 * s, mx, my + 7.5 * s);
    g.fillStyle(COLORS.ink, 1);
    g.fillCircle(mx, my, 1.4 * s);
  };
  draw();
  const tip = scene.add
    .text(0, size / 2 + 6, label, { fontFamily: FONT, fontSize: `${Math.round(13 * (size / 38))}px`, color: COLORS.hover, backgroundColor: '#07050fcc', padding: { x: 5, y: 2 } })
    .setOrigin(0.5, 0)
    .setVisible(false);
  const c = scene.add.container(x, y, [g, tip]).setSize(size, size);
  const pad = Math.max(0, ((isTouch() ? cssToGame(scene, TOUCH_TARGET_CSS) : 0) - size) / 2);
  c.setInteractive({ hitArea: new Phaser.Geom.Rectangle(-pad, -pad, size + pad * 2, size + pad * 2), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
  c.on('pointerover', () => {
    hover = true;
    tip.setVisible(!isTouch());
    draw();
  });
  c.on('pointerout', () => {
    hover = false;
    pressed = false;
    tip.setVisible(false);
    draw();
  });
  c.on('pointerup', () => {
    if (!pressed) return;
    pressed = false;
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
  return c;
}
