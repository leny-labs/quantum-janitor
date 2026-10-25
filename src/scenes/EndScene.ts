import Phaser from 'phaser';
import { getSession } from '../session';
import { makeButton } from '../ui/Button';
import { HeroView } from '../three/Hero';
import { endShot } from '../three/shots/end';
import { bakeStudio } from '../three/Studio';
import { drawHazard, drawPanel } from '../ui/chrome';
import { DialogueBox } from '../ui/DialogueBox';
import { COLORS, DISPLAY, FONT, H, W, hex } from '../ui/theme';

interface EndData {
  knot?: string;
  final?: boolean;
}

/** Cliffhanger : la dimension des cafards, puis « À suivre… ». */
export class EndScene extends Phaser.Scene {
  private hero: HeroView | null = null;

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
    bakeStudio(this.textures);

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

  update(): void {
    this.hero?.update();
  }

  private drawRoachDimension(): void {
    this.hero = new HeroView(this, endShot(W, H));
    const g = this.add.graphics();
    g.fillGradientStyle(COLORS.ink, COLORS.ink, COLORS.ink, COLORS.ink, 0.7, 0.7, 0, 0);
    g.fillRect(0, 0, W, 90);
    // cartouche de localisation
    const label = 'DIMENSION B-7  ·  « BLATTARIA PRIME »';
    const t = this.add.text(W / 2, 34, label, { fontFamily: FONT, fontSize: '17px', fontStyle: '700', color: COLORS.hover }).setOrigin(0.5).setLetterSpacing(4);
    const p = this.add.graphics();
    drawPanel(p, W / 2 - t.width / 2 - 30, 16, t.width + 60, 36, { fill: COLORS.ink, fillAlpha: 0.75, edge: hex(COLORS.hover), cut: 10 });
    t.setDepth(1);
    this.add
      .text(W / 2, 64, 'HORS JURIDICTION DE SYLVIE · VOTRE BONHEUR N’Y EST PLUS GARANTI', { fontFamily: FONT, fontSize: '11px', color: COLORS.dim })
      .setOrigin(0.5)
      .setLetterSpacing(2);
  }

  private showToBeContinued(): void {
    const veil = this.add.rectangle(0, 0, W, H, COLORS.ink, 0).setOrigin(0).setDepth(1000);
    this.tweens.add({ targets: veil, fillAlpha: 0.78, duration: 1200 });
    const items: Phaser.GameObjects.GameObject[] = [];
    const bands = this.add.graphics().setDepth(1001).setAlpha(0);
    drawHazard(bands, 0, 196, W, 8);
    drawHazard(bands, 0, 470, W, 8);
    const title = this.add
      .text(W / 2, 290, 'À SUIVRE…', { fontFamily: DISPLAY, fontSize: '110px', color: '#ffffff', padding: { x: 4, y: 8 } })
      .setOrigin(0.5)
      .setDepth(1001)
      .setAlpha(0);
    const grad = title.context.createLinearGradient(0, 18, 0, title.height - 18);
    grad.addColorStop(0, '#d9fff4');
    grad.addColorStop(0.55, '#7fffd4');
    grad.addColorStop(0.56, '#ff8ab8');
    grad.addColorStop(1, '#ff4f9a');
    title.setFill(grad).setStroke('#07050f', 10).setShadow(0, 10, 'rgba(255,79,154,0.55)', 26, true, true);
    const sub = this.add
      .text(W / 2, 385, 'PROCHAINEMENT — CHAPITRE 1 : « LA REINE DES CAFARDS »', { fontFamily: FONT, fontSize: '22px', fontStyle: '600', color: COLORS.hover })
      .setOrigin(0.5)
      .setLetterSpacing(3)
      .setDepth(1001)
      .setAlpha(0);
    const thanks = this.add
      .text(W / 2, 425, "Merci d'avoir joué le chapitre 0. Votre satisfaction a été enregistrée d'office.", { fontFamily: FONT, fontSize: '17px', color: COLORS.dim })
      .setOrigin(0.5)
      .setDepth(1001)
      .setAlpha(0);
    items.push(bands, title, sub, thanks);
    this.tweens.add({ targets: items, alpha: 1, duration: 1400, delay: 600 });

    this.time.delayedCall(1800, () => {
      const session = getSession();
      makeButton(this, W / 2 - 16, 560, 'Menu principal', () => this.scene.start('Title'), { align: 'right', size: 20, minWidth: 300 }).setDepth(1001);
      makeButton(
        this,
        W / 2 + 16,
        560,
        'Rejouer',
        () => {
          session.newGame();
          this.scene.start('Room');
        },
        { align: 'left', size: 20, primary: true, minWidth: 300, kicker: 'UN NOUVEAU CLONE EST PRÊT' },
      ).setDepth(1001);
    });
  }
}
