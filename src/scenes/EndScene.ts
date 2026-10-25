import Phaser from 'phaser';
import { getSession } from '../session';
import { makeButton } from '../ui/Button';
import { DialogueBox } from '../ui/DialogueBox';
import { COLORS, FONT, H, W } from '../ui/theme';

interface EndData {
  knot?: string;
  final?: boolean;
}

/** Cliffhanger : la dimension des cafards, puis « À suivre… ». */
export class EndScene extends Phaser.Scene {
  constructor() {
    super('End');
  }

  async create(data: EndData): Promise<void> {
    const session = getSession();
    session.activeScene = this;
    const { state } = session;
    state.ended = true;
    state.setFlag('chapitre0_termine');
    state.emit();

    this.drawRoachDimension();

    if (!data.final && data.knot) {
      this.cameras.main.fadeIn(1400, 255, 255, 255);
      await new Promise((r) => this.time.delayedCall(1500, r));
      const box = new DialogueBox(this);
      const deferred = await session.dialogue.run(data.knot, box);
      if (deferred.length) console.warn('goto/end ignorés dans la scène de fin', deferred);
    }
    this.showToBeContinued();
  }

  private drawRoachDimension(): void {
    // ciel violet maladif
    const bands = [0x2a0f3d, 0x3a1450, 0x4d1a5e, 0x63206a, 0x7a2a6e];
    bands.forEach((c, i) => this.add.rectangle(0, i * 90, W, 90, c).setOrigin(0));
    // deux soleils
    this.add.circle(1040, 110, 60, 0xffb347, 0.9);
    this.add.circle(1150, 170, 28, 0x9cff57, 0.9);
    // sol
    this.add.rectangle(0, 380, W, H - 380, 0x3b2a1a).setOrigin(0);
    this.add.rectangle(0, 380, W, 8, 0x5c4026).setOrigin(0);
    // cafards géants (placeholders)
    const roach = (x: number, y: number, s: number, crown = false) => {
      const g = this.add.graphics();
      g.lineStyle(4 * s, 0x1a0f05, 1);
      for (let i = -1; i <= 1; i++) {
        g.lineBetween(x + i * 40 * s, y, x + i * 55 * s - 30 * s, y + 70 * s);
        g.lineBetween(x + i * 40 * s, y, x + i * 55 * s + 30 * s, y + 70 * s);
      }
      g.lineBetween(x - 70 * s, y - 20 * s, x - 150 * s, y - 110 * s);
      g.lineBetween(x - 70 * s, y - 20 * s, x - 120 * s, y - 130 * s);
      this.add.ellipse(x, y, 180 * s, 90 * s, 0x6b3a12).setStrokeStyle(3, 0x2a1406);
      this.add.ellipse(x - 85 * s, y - 10 * s, 50 * s, 44 * s, 0x4a2608);
      if (crown) this.add.text(x - 85 * s, y - 52 * s, '♛', { fontFamily: FONT, fontSize: `${46 * s}px`, color: '#ffd166' }).setOrigin(0.5);
    };
    roach(300, 300, 1.4, true);
    roach(840, 290, 0.8);
    roach(1080, 330, 1.0);
    roach(560, 220, 0.5);
    // Gary à plat ventre + B.O.B.
    this.add.rectangle(560, 405, 150, 34, 0xff8c42).setStrokeStyle(2, 0xffffff);
    this.add.text(560, 405, 'GARY (à plat)', { fontFamily: FONT, fontSize: '16px', color: '#ffffff' }).setOrigin(0.5);
    this.add.ellipse(720, 415, 80, 30, 0x9aa5b1).setStrokeStyle(2, 0xffffff);
    this.add.text(720, 415, 'B.O.B.', { fontFamily: FONT, fontSize: '14px', color: '#000000' }).setOrigin(0.5);
    // seau renversé, évidemment
    this.add.rectangle(640, 425, 40, 34, 0x3d7dd8).setAngle(80).setStrokeStyle(2, 0xffffff);

    this.add
      .text(W / 2, 30, 'Dimension B-7 « Blattaria Prime »', { fontFamily: FONT, fontSize: '24px', color: '#ffd166', backgroundColor: '#00000088', padding: { x: 10, y: 4 } })
      .setOrigin(0.5, 0);
  }

  private showToBeContinued(): void {
    const veil = this.add.rectangle(0, 0, W, H, 0x000000, 0).setOrigin(0).setDepth(1000);
    this.tweens.add({ targets: veil, fillAlpha: 0.85, duration: 1200 });
    const items: Phaser.GameObjects.GameObject[] = [];
    const title = this.add
      .text(W / 2, 250, 'À SUIVRE…', { fontFamily: FONT, fontSize: '96px', color: COLORS.accent, fontStyle: 'bold' })
      .setOrigin(0.5)
      .setDepth(1001)
      .setAlpha(0);
    const sub = this.add
      .text(W / 2, 350, 'Prochainement — Chapitre 1 : « La Reine des Cafards »', { fontFamily: FONT, fontSize: '28px', color: COLORS.text })
      .setOrigin(0.5)
      .setDepth(1001)
      .setAlpha(0);
    const thanks = this.add
      .text(W / 2, 400, "Merci d'avoir joué le chapitre 0 de Quantum Janitor.", { fontFamily: FONT, fontSize: '18px', color: COLORS.dim })
      .setOrigin(0.5)
      .setDepth(1001)
      .setAlpha(0);
    items.push(title, sub, thanks);
    this.tweens.add({ targets: items, alpha: 1, duration: 1400, delay: 600 });

    this.time.delayedCall(1800, () => {
      const session = getSession();
      makeButton(this, W / 2 - 170, 520, 'Menu principal', () => this.scene.start('Title')).setDepth(1001);
      makeButton(this, W / 2 + 170, 520, 'Rejouer', () => {
        session.newGame();
        this.scene.start('Room');
      }).setDepth(1001);
    });
  }
}
