import Phaser from 'phaser';
import { COLORS, FONT } from './theme';

/** Bouton texte simple avec survol. */
export function makeButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  opts: { size?: number; origin?: number } = {},
): Phaser.GameObjects.Text {
  const t = scene.add
    .text(x, y, label, {
      fontFamily: FONT,
      fontSize: `${opts.size ?? 28}px`,
      color: COLORS.text,
      backgroundColor: '#22223a',
      padding: { x: 18, y: 8 },
    })
    .setOrigin(opts.origin ?? 0.5)
    .setInteractive({ useHandCursor: true });
  t.on('pointerover', () => t.setColor(COLORS.hover));
  t.on('pointerout', () => t.setColor(COLORS.text));
  t.on('pointerdown', (p: Phaser.Input.Pointer) => {
    if (p.leftButtonDown()) onClick();
  });
  return t;
}
