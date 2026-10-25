import Phaser from 'phaser';
import { drawLed, drawPanel, verbIcon, verbIconScale, verbIconTexture, type VerbIcon } from './chrome';
import { COLORS, FONT, H, W, hex } from './theme';

export interface Verb {
  label: string;
  run: () => void;
  /** Picto forcé ; sinon déduit du libellé. */
  icon?: VerbIcon;
}

/** Petit menu contextuel « Regarder / Utiliser / Parler ». */
export class VerbMenu {
  private root: Phaser.GameObjects.Container | null = null;
  private blocker: Phaser.GameObjects.Rectangle | null = null;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(private scene: Phaser.Scene) {
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.close());
  }

  get isOpen(): boolean {
    return this.root !== null;
  }

  show(x: number, y: number, title: string, verbs: Verb[]): void {
    this.close();
    const s = this.scene;
    this.blocker = s.add.rectangle(0, 0, W, H, 0, 0.001).setOrigin(0).setDepth(850).setInteractive();
    this.blocker.on('pointerdown', () => this.close());

    const itemH = 44;
    const width = 272;
    const head = 40;
    const foot = 24;
    const height = head + verbs.length * itemH + foot;
    const px = Phaser.Math.Clamp(x - width / 2, 8, W - width - 8);
    const py = Phaser.Math.Clamp(y - 20, 8, H - height - 8);
    const root = (this.root = s.add.container(px, py).setDepth(851));
    const g = s.add.graphics();
    drawPanel(g, 0, 0, width, height, { cut: 14, brackets: true });
    g.fillStyle(hex(COLORS.accent), 0.14);
    g.fillRect(1, 14, width - 2, head - 16);
    g.lineStyle(1, hex(COLORS.accent), 0.4);
    g.lineBetween(10, head, width - 10, head);
    drawLed(g, 16, head / 2 + 3, hex(COLORS.hover), 3);
    root.add(g);
    const t = s.add.text(28, head / 2 + 3, title.toUpperCase(), { fontFamily: FONT, fontSize: '14px', fontStyle: '700', color: COLORS.accent }).setOrigin(0, 0.5).setLetterSpacing(1.5);
    if (t.width > width - 40) t.setScale((width - 40) / t.width);
    root.add(t);
    verbs.forEach((v, i) => {
      const ry = head + 4 + i * itemH;
      const bar = s.add.graphics();
      const cy = ry + itemH / 2;
      const slot = 30;
      const sx = 14;
      const icon = s.add.image(sx + slot / 2, cy, verbIconTexture(s, v.icon ?? verbIcon(v.label))).setScale(verbIconScale());
      const label = s.add.text(sx + slot + 14, cy, v.label, { fontFamily: FONT, fontSize: '21px', fontStyle: '600', color: COLORS.text }).setOrigin(0, 0.5);
      const key = s.add.text(width - 16, cy, String(i + 1), { fontFamily: FONT, fontSize: '12px', fontStyle: '700', color: COLORS.dim }).setOrigin(1, 0.5);
      const paint = (on: boolean) => {
        bar.clear();
        const tone = hex(on ? COLORS.hover : COLORS.accent);
        if (on) {
          bar.fillStyle(hex(COLORS.hover), 0.12);
          bar.fillRect(6, ry + 3, width - 12, itemH - 6);
          bar.fillStyle(hex(COLORS.hover), 1);
          bar.fillRect(6, ry + 3, 3, itemH - 6);
        }
        // logement du picto : petit cadre biseauté
        drawPanel(bar, sx, cy - slot / 2, slot, slot, { cut: 6, fill: COLORS.ink, fillAlpha: 0.7, edge: tone, edgeAlpha: on ? 0.95 : 0.45, glow: on });
        icon.setTint(tone);
        label.setColor(on ? COLORS.hover : COLORS.text);
        key.setColor(on ? COLORS.hover : COLORS.dim);
      };
      paint(false);
      const zone = s.add.zone(0, ry, width, itemH).setOrigin(0).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => paint(true));
      zone.on('pointerout', () => paint(false));
      zone.on('pointerdown', () => {
        this.close();
        v.run();
      });
      root.add([bar, icon, label, key, zone]);
    });
    root.add(
      s.add
        .text(width / 2, height - foot / 2 - 2, 'Toute action est consignée. Merci.', { fontFamily: FONT, fontSize: '10px', fontStyle: 'italic 500', color: COLORS.dim })
        .setOrigin(0.5),
    );
    root.setAlpha(0).setScale(0.96);
    s.tweens.add({ targets: root, alpha: 1, scale: 1, duration: 110, ease: 'Quad.easeOut' });

    this.keyHandler = (e: KeyboardEvent) => {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= verbs.length) {
        this.close();
        verbs[n - 1].run();
      } else if (e.key === 'Escape') this.close();
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  close(): void {
    if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
    this.keyHandler = null;
    this.root?.destroy();
    this.blocker?.destroy();
    this.root = null;
    this.blocker = null;
  }
}
