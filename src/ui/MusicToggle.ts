import Phaser from 'phaser';
import { drawPanel } from './chrome';
import { cssToGame, isTouch, TOUCH_TARGET_CSS } from './input';
import { musicEnabled, onMusicChange, toggleMusic } from './music';
import { COLORS, hex } from './theme';

/** Petit bouton ♪ (musique on/off, touche M), même habillage que les boutons du HUD. */
export function makeMusicToggle(scene: Phaser.Scene, x: number, y: number, size = 38): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  let hover = false;
  const draw = () => {
    const on = musicEnabled();
    const accent = hex(hover ? COLORS.hover : COLORS.accent);
    g.clear();
    drawPanel(g, -size / 2, -size / 2, size, size, { fill: hover ? COLORS.panelHi : COLORS.panel, fillAlpha: 0.88, edge: accent, cut: size * 0.25, glow: hover });
    // deux croches liées
    const ink = on ? accent : hex(COLORS.dim);
    const s = size / 38;
    g.fillStyle(ink, on ? 1 : 0.7);
    g.fillEllipse(-7 * s, 8 * s, 9 * s, 7 * s);
    g.fillEllipse(7 * s, 5 * s, 9 * s, 7 * s);
    g.fillRect(-3.5 * s, -10 * s, 2.2 * s, 18 * s);
    g.fillRect(10.5 * s, -13 * s, 2.2 * s, 18 * s);
    g.fillPoints([new Phaser.Geom.Point(-3.5 * s, -10 * s), new Phaser.Geom.Point(12.7 * s, -13 * s), new Phaser.Geom.Point(12.7 * s, -8.5 * s), new Phaser.Geom.Point(-3.5 * s, -5.5 * s)], true);
    if (!on) {
      g.lineStyle(3 * s, hex('#ff5c7a'), 1);
      g.lineBetween(-13 * s, 13 * s, 13 * s, -13 * s);
    }
  };
  draw();
  const c = scene.add.container(x, y, [g]).setSize(size, size);
  const pad = Math.max(0, ((isTouch() ? cssToGame(scene, TOUCH_TARGET_CSS) : 0) - size) / 2);
  c.setInteractive({ hitArea: new Phaser.Geom.Rectangle(-pad, -pad, size + pad * 2, size + pad * 2), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
  c.on('pointerover', () => {
    hover = true;
    draw();
  });
  c.on('pointerout', () => {
    hover = false;
    draw();
  });
  c.on('pointerdown', (p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
    e.stopPropagation();
    if (p.leftButtonDown() || p.wasTouch) toggleMusic();
  });
  const off = onMusicChange(draw);
  c.once(Phaser.GameObjects.Events.DESTROY, off);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, off);
  return c;
}
