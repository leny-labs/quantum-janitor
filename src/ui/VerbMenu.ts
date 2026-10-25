import Phaser from 'phaser';
import { COLORS, FONT, H, W } from './theme';

export interface Verb {
  label: string;
  run: () => void;
}

/** Petit menu contextuel « Regarder / Utiliser / Parler ». */
export class VerbMenu {
  private root: Phaser.GameObjects.Container | null = null;
  private blocker: Phaser.GameObjects.Rectangle | null = null;

  constructor(private scene: Phaser.Scene) {}

  get isOpen(): boolean {
    return this.root !== null;
  }

  show(x: number, y: number, title: string, verbs: Verb[]): void {
    this.close();
    const s = this.scene;
    this.blocker = s.add.rectangle(0, 0, W, H, 0, 0.001).setOrigin(0).setDepth(850).setInteractive();
    this.blocker.on('pointerdown', () => this.close());

    const itemH = 40;
    const width = 220;
    const height = 36 + verbs.length * itemH + 8;
    const px = Phaser.Math.Clamp(x - width / 2, 6, W - width - 6);
    const py = Phaser.Math.Clamp(y - 20, 6, H - height - 6);
    this.root = s.add.container(px, py).setDepth(851);
    this.root.add(s.add.rectangle(0, 0, width, height, COLORS.panel, 0.97).setOrigin(0).setStrokeStyle(2, COLORS.panelBorder));
    this.root.add(s.add.text(12, 8, title, { fontFamily: FONT, fontSize: '18px', color: COLORS.dim }));
    verbs.forEach((v, i) => {
      const t = s.add
        .text(16, 36 + i * itemH, `› ${v.label}`, { fontFamily: FONT, fontSize: '24px', color: COLORS.text })
        .setInteractive({ useHandCursor: true });
      t.on('pointerover', () => t.setColor(COLORS.hover));
      t.on('pointerout', () => t.setColor(COLORS.text));
      t.on('pointerdown', () => {
        this.close();
        v.run();
      });
      this.root!.add(t);
    });
  }

  close(): void {
    this.root?.destroy();
    this.blocker?.destroy();
    this.root = null;
    this.blocker = null;
  }
}
