import Phaser from 'phaser';
import { COLORS, FONT, W } from './theme';

/** Libellé qui suit le curseur au survol d'un hotspot. */
export class HoverLabel {
  private text: Phaser.GameObjects.Text;

  constructor(private scene: Phaser.Scene) {
    this.text = scene.add
      .text(0, 0, '', {
        fontFamily: FONT,
        fontSize: '20px',
        color: COLORS.hover,
        backgroundColor: '#000000cc',
        padding: { x: 8, y: 4 },
      })
      .setDepth(800)
      .setVisible(false);
    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => this.place(p.x, p.y));
  }

  set(label: string | null): void {
    if (!label) {
      this.text.setVisible(false);
      return;
    }
    this.text.setText(label).setVisible(true);
    const p = this.scene.input.activePointer;
    this.place(p.x, p.y);
  }

  private place(x: number, y: number): void {
    const w = this.text.width;
    this.text.setPosition(Phaser.Math.Clamp(x + 18, 4, W - w - 4), Math.max(4, y - 38));
  }
}
