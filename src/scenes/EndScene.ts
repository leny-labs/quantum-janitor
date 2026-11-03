import Phaser from 'phaser';
import { getSession } from '../session';
import { CHAPTERS } from '../engine/walkthrough';
import { t } from '../i18n';
import { makeButton } from '../ui/Button';
import { HeroView } from '../three/Hero';
import { endShot } from '../three/shots/end';
import { bakeStudio } from '../three/Studio';
import { drawHazard, drawPanel } from '../ui/chrome';
import { DialogueBox } from '../ui/DialogueBox';
import { playMusic } from '../ui/music';
import { COLORS, DISPLAY, FONT, H, W, hex } from '../ui/theme';

interface EndData {
  knot?: string;
  final?: boolean;
}

/**
 * Fin de chaque chapitre : flag posé, plan affiché, chapitre suivant
 * proposé. `roaches` = plan 3D de la Reine (ch.0) ; `stub` = fond 2D de
 * transition (ch.1 → Station Bureaucratique, non implémentée).
 */
const END_BY_CHAPTER: Record<string, { flag: string; shot: 'roaches' | 'stub'; next?: string; hook?: string[] }> = {
  ch0: { flag: 'chapitre0_termine', shot: 'roaches', next: 'ch1' },
  // hook merge ch.0 → Station 2 : la faille du Nid est franchie. TOUTES les sorties du Nid
  // (couronnement `# end: ch1_suite`, sortie « La Faille » `to: fin`, Reine avec la combi)
  // arrivent ici ; le merge n'a qu'à rebrancher `next` (Station Bureaucratique) et lire ces flags.
  ch1: { flag: 'chapitre1_termine', shot: 'stub', hook: ['go_station2', 'fin_ch0'] },
};

/** Cliffhanger du chapitre (ch.0 : la dimension des cafards), puis « À suivre… ». */
export class EndScene extends Phaser.Scene {
  private hero: HeroView | null = null;
  private chapter = 'ch0';

  constructor() {
    super('End');
  }

  async create(data: EndData): Promise<void> {
    const session = getSession();
    session.activeScene = this;
    const { state } = session;
    // le knot de fin désigne le chapitre ; sinon (reprise d'une partie finie) celui de la sauvegarde
    this.chapter = CHAPTERS.find((c) => c.endKnot === data.knot)?.id ?? session.chapter;
    const end = END_BY_CHAPTER[this.chapter] ?? END_BY_CHAPTER.ch0;
    state.chapter ??= this.chapter;
    playMusic('fin');
    state.ended = true;
    state.setFlag(end.flag);
    end.hook?.forEach((f) => state.setFlag(f));
    state.emit();
    bakeStudio(this.textures);

    this.hero = null;
    if (end.shot === 'stub') this.drawBureaucracyStub();
    else this.drawRoachDimension();
    const knot = data.knot;

    if (!data.final && knot) {
      this.cameras.main.fadeIn(1400, 255, 255, 255);
      await new Promise((r) => this.time.delayedCall(1500, r));
      const box = new DialogueBox(this);
      const deferred = await session.dialogue.run(knot, box);
      if (deferred.length) console.warn('goto/end ignorés dans la scène de fin', deferred);
    }
    this.showToBeContinued();
  }

  update(): void {
    this.hero?.update();
  }

  private drawRoachDimension(): void {
    this.hero = new HeroView(this, endShot(W, H));
    this.drawLocation(t('end.location'), t('end.jurisdiction'));
  }

  /** Fin du ch.1 : la faille s'ouvre sur la Station Bureaucratique (plan 2D, ch.2 non implémenté). */
  private drawBureaucracyStub(): void {
    const g = this.add.graphics();
    g.fillGradientStyle(0x1a0830, 0x1a0830, 0x6b5a3a, 0x6b5a3a, 1);
    g.fillRect(0, 0, W, H);
    // rangées de guichets à perte de vue
    for (let row = 0; row < 4; row++) {
      const y = 250 + row * 90;
      const n = 6 + row * 3;
      const w = W / n;
      for (let i = 0; i < n; i++) {
        g.fillStyle(0x2a2238, 0.55 + row * 0.1);
        g.fillRect(i * w + w * 0.12, y, w * 0.76, 60 + row * 6);
        g.fillStyle(0xffd166, 0.35 + row * 0.12);
        g.fillRect(i * w + w * 0.3, y + 12, w * 0.4, 8);
      }
    }
    // la faille
    g.lineStyle(5, 0xff8ab8, 0.9);
    g.beginPath();
    g.moveTo(W / 2 - 10, 100);
    [[W / 2 + 30, 160], [W / 2 - 25, 220], [W / 2 + 15, 260]].forEach(([x, y]) => g.lineTo(x, y));
    g.strokePath();
    this.add
      .text(W / 2, 175, t('end.ch1.stub'), { fontFamily: FONT, fontSize: '26px', fontStyle: '700', color: '#ffd166', align: 'center' })
      .setOrigin(0.5)
      .setLetterSpacing(3)
      .setStroke('#07050f', 6);
    // le tampon géant
    this.add
      .text(W * 0.84, 150, t('end.ch1.stamp'), { fontFamily: DISPLAY, fontSize: '52px', color: '#ff4f9a' })
      .setOrigin(0.5)
      .setAngle(-14)
      .setAlpha(0.85)
      .setStroke('#ff4f9a', 3);
    this.drawLocation(t('end.ch1.location'), t('end.ch1.jurisdiction'));
  }

  private drawLocation(label: string, jurisdiction: string): void {
    const g = this.add.graphics();
    g.fillGradientStyle(COLORS.ink, COLORS.ink, COLORS.ink, COLORS.ink, 0.7, 0.7, 0, 0);
    g.fillRect(0, 0, W, 90);
    // cartouche de localisation
    const tag = this.add.text(W / 2, 34, label, { fontFamily: FONT, fontSize: '17px', fontStyle: '700', color: COLORS.hover }).setOrigin(0.5).setLetterSpacing(4);
    const p = this.add.graphics();
    drawPanel(p, W / 2 - tag.width / 2 - 30, 16, tag.width + 60, 36, { fill: COLORS.ink, fillAlpha: 0.75, edge: hex(COLORS.hover), cut: 10 });
    tag.setDepth(1);
    this.add
      .text(W / 2, 64, jurisdiction, { fontFamily: FONT, fontSize: '11px', color: COLORS.dim })
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
      .text(W / 2, 290, t('end.toBeContinued'), { fontFamily: DISPLAY, fontSize: '110px', color: '#ffffff', padding: { x: 4, y: 8 } })
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
      .text(W / 2, 385, this.chapter === 'ch1' ? t('end.ch1.next') : t('end.next'), { fontFamily: FONT, fontSize: '22px', fontStyle: '600', color: COLORS.hover })
      .setOrigin(0.5)
      .setLetterSpacing(3)
      .setDepth(1001)
      .setAlpha(0);
    const thanks = this.add
      .text(W / 2, 425, this.chapter === 'ch1' ? t('end.ch1.thanks') : t('end.thanks'), { fontFamily: FONT, fontSize: '17px', color: COLORS.dim })
      .setOrigin(0.5)
      .setDepth(1001)
      .setAlpha(0);
    items.push(bands, title, sub, thanks);
    this.tweens.add({ targets: items, alpha: 1, duration: 1400, delay: 600 });

    this.time.delayedCall(1800, () => {
      const session = getSession();
      const chapter = this.chapter;
      const next = END_BY_CHAPTER[chapter]?.next;
      const play = (id: string) => () => {
        session.newGame(id);
        this.scene.start('Room');
      };
      // avec un chapitre suivant : trois boutons, le suivant en principal à droite
      const dx = next ? 290 : 0;
      makeButton(this, W / 2 - 16 - dx / 2, 560, t('end.menu'), () => this.scene.start('Title'), { align: 'right', size: 20, minWidth: next ? 250 : 300 }).setDepth(1001);
      makeButton(this, W / 2 + 16 - dx / 2, 560, t('end.replay'), play(chapter), {
        align: 'left',
        size: 20,
        primary: !next,
        minWidth: next ? 250 : 300,
        kicker: t('end.replayKicker'),
      }).setDepth(1001);
      if (next) {
        makeButton(this, W / 2 + 16 - dx / 2 + 282, 560, t('end.nextChapter'), play(next), {
          align: 'left',
          size: 20,
          primary: true,
          minWidth: 250,
          kicker: t('end.nextChapterKicker'),
        }).setDepth(1001);
      }
    });
  }
}
