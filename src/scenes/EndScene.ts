import Phaser from 'phaser';
import { getSession } from '../session';
import { CHAPTERS, enterAct, findAct } from '../engine/walkthrough';
import { glowTexture, showChapterCard, slamStamp, stampObject } from '../ui/ChapterCard';
import { riftCue } from '../ui/sfx';
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
  /**
   * Coupure d'acte (ChapterDef.acts) : `knot` = cliffhanger de l'acte précédent (facultatif),
   * puis carte d'acte et entrée dans l'acte, sans écran de fin ni menu.
   */
  act?: string;
  /** Arrivée depuis une carte de transition (écran déjà noir) : fondu depuis le noir. */
  fromCard?: boolean;
}

/**
 * Fin de chaque chapitre : flag posé, plan affiché, chapitre suivant proposé.
 * `stub` = fond 2D de la faille vers la Station Bureaucratique (fin du ch.0).
 * Le plan 3D `roaches` (dimension des cafards) sert à la coupure d'acte Klepsydra → Blattaria.
 */
const END_BY_CHAPTER: Record<string, { flag: string; shot: 'roaches' | 'stub'; next?: string; hook?: string[] }> = {
  // la faille du Nid est franchie. TOUTES les sorties du Nid (couronnement `# end: ch1_suite`,
  // sortie « La Faille » `to: fin`, Reine avec la combi) arrivent ici.
  ch0: { flag: 'ch0_termine', shot: 'stub', next: 'ch1', hook: ['go_station2', 'fin_ch0'] },
  // fin du chapitre 1 (`st_suite`, permis sur la capsule à la fourrière) : la Station est derrière nous
  ch1: { flag: 'st_termine', shot: 'stub' },
};

/** Cliffhanger du chapitre (ch.0 : la dimension des cafards), puis « À suivre… ». */
export class EndScene extends Phaser.Scene {
  private hero: HeroView | null = null;
  private chapter = 'ch0';
  private transferring = false;

  constructor() {
    super('End');
  }

  async create(data: EndData): Promise<void> {
    const session = getSession();
    session.activeScene = this;
    this.transferring = false;
    if (data.act) return this.actBreak(data.act, data.knot);
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
      if (data.fromCard) this.cameras.main.fadeIn(900, 0, 0, 0);
      else this.cameras.main.fadeIn(1400, 255, 255, 255);
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

  /**
   * Coupure d'acte (fin Klepsydra → Blattaria) : l'état de l'acte suivant est posé tout de
   * suite (un rechargement reprend à l'arrivée, sans rejouer la catastrophe), puis plan de la
   * dimension des cafards + cliffhanger, carte « ACTE II », et la pièce de l'acte (intro filmée).
   */
  private async actBreak(actId: string, knot?: string): Promise<void> {
    const session = getSession();
    const act = findAct(session.chapter, actId);
    if (!act) {
      console.warn(`[end] acte inconnu « ${actId} » (${session.chapter})`);
      this.scene.start('Room');
      return;
    }
    enterAct(session.state, act);
    bakeStudio(this.textures);
    playMusic('fin');
    this.drawRoachDimension();
    if (knot) {
      this.cameras.main.fadeIn(1400, 255, 255, 255);
      await new Promise((r) => this.time.delayedCall(1500, r));
      const box = new DialogueBox(this);
      const deferred = await session.dialogue.run(knot, box);
      if (deferred.length) console.warn('goto/end ignorés dans la coupure d\'acte', deferred);
    } else {
      this.cameras.main.fadeIn(800, 0, 0, 0);
      await new Promise((r) => this.time.delayedCall(900, r));
    }
    await showChapterCard(this, {
      kicker: t('card.act2.kicker'),
      title: t('card.act2.title'),
      tagline: t('card.act2.tagline'),
      foot: t('card.act2.foot'),
    });
    this.scene.start('Room');
  }

  private drawRoachDimension(): void {
    this.hero = new HeroView(this, endShot(W, H));
    this.drawLocation(t('end.location'), t('end.jurisdiction'));
  }

  /** Fin du ch.0 : la faille du Nid s'ouvre sur la Station Bureaucratique (plan 2D) ; fin du stub ch.1 : le guichet fermé. */
  private drawBureaucracyStub(): void {
    const ch1 = this.chapter === 'ch1';
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
    // la faille (fin du ch.0) : elle pulse et grésille, prête à aspirer
    if (!ch1) {
      const rift = this.add.graphics();
      const pts = [[W / 2 - 10, 100], [W / 2 + 30, 160], [W / 2 - 25, 220], [W / 2 + 15, 260]];
      const paint = (k: number) => {
        rift.clear();
        rift.lineStyle(14 + k * 8, 0xb56cff, 0.18);
        rift.beginPath();
        rift.moveTo(pts[0][0], pts[0][1]);
        pts.slice(1).forEach(([x, y]) => rift.lineTo(x, y));
        rift.strokePath();
        rift.lineStyle(5, 0xff8ab8, 0.9);
        rift.beginPath();
        rift.moveTo(pts[0][0], pts[0][1]);
        pts.slice(1).forEach(([x, y]) => rift.lineTo(x + (Math.random() - 0.5) * k * 3, y));
        rift.strokePath();
      };
      const pulse = { k: 0 };
      this.tweens.add({ targets: pulse, k: 1, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', onUpdate: () => paint(pulse.k) });
      paint(0);
    }
    this.add
      .text(W / 2, 175, t(ch1 ? 'end.ch1.stub' : 'end.ch0.stub'), { fontFamily: FONT, fontSize: '26px', fontStyle: '700', color: '#ffd166', align: 'center' })
      .setOrigin(0.5)
      .setLetterSpacing(3)
      .setStroke('#07050f', 6);
    // le tampon géant
    this.add
      .text(W * (ch1 ? 0.8 : 0.84), 150, t(ch1 ? 'end.ch1.stamp' : 'end.ch0.stamp'), { fontFamily: DISPLAY, fontSize: '52px', color: '#ff4f9a' })
      .setOrigin(0.5)
      .setAngle(-14)
      .setAlpha(0.85)
      .setStroke('#ff4f9a', 3);
    if (ch1) this.drawLocation(t('end.ch1.location'), t('end.ch1.jurisdiction'));
    else this.drawLocation(t('end.ch0.location'), t('end.ch0.jurisdiction'));
  }

  /**
   * Transition fin du ch.0 → interlude (pas de coupure sèche) : la faille aspire l'écran
   * (halo violet, traînées vers le centre, zoom et rotation), souffle + harpe cosmique, éclair,
   * tampon « TRANSFÉRÉ » (CLONK), fondu au noir, puis `go` (la pièce suivante s'ouvre du noir).
   */
  private transfer(go: () => void): void {
    if (this.transferring) return;
    this.transferring = true;
    this.input.enabled = false;
    const cam = this.cameras.main;
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches; // i18n-ignore
    riftCue();
    const cx = W / 2;
    const cy = 190;
    const vortex = this.add.image(cx, cy, glowTexture(this)).setTint(0xb56cff).setBlendMode(Phaser.BlendModes.ADD).setDepth(1500).setScale(0.1).setAlpha(0.9);
    const core = this.add.image(cx, cy, glowTexture(this)).setTint(0xffd6ff).setBlendMode(Phaser.BlendModes.ADD).setDepth(1501).setScale(0.04);
    this.tweens.add({ targets: vortex, scale: 6, duration: 1700, ease: 'Cubic.easeIn' });
    this.tweens.add({ targets: core, scale: 3.5, duration: 1700, ease: 'Expo.easeIn' });
    // traînées aspirées vers la faille
    for (let i = 0; i < 70; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 380 + Math.random() * 520;
      const streak = this.add
        .rectangle(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 40 + Math.random() * 90, 2 + Math.random() * 2, Math.random() < 0.5 ? 0xff8ab8 : 0xb56cff, 0.85)
        .setRotation(a)
        .setDepth(1502)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0);
      this.tweens.add({ targets: streak, x: cx, y: cy, scaleX: 0.1, alpha: { from: 0.9, to: 0 }, duration: 600 + Math.random() * 700, delay: Math.random() * 1100, ease: 'Quad.easeIn' });
    }
    if (!calm) {
      cam.zoomTo(1.45, 1700, 'Cubic.easeIn');
      cam.rotateTo(0.22, false, 1700, 'Cubic.easeIn');
    }
    this.time.delayedCall(1700, () => {
      cam.flash(350, 255, 230, 255);
      cam.setZoom(1).setRotation(0);
      vortex.setScale(9).setAlpha(0.55);
      const stamp = stampObject(this, W / 2, H / 2, t('end.ch0.transfer'), '#ff4f9a', 64).setDepth(1600);
      this.time.delayedCall(250, () =>
        void slamStamp(this, stamp).then(() =>
          this.time.delayedCall(700, () => {
            cam.fadeOut(700, 0, 0, 0);
            cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
              this.input.enabled = true;
              go();
            });
          }),
        ),
      );
    });
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
      .text(W / 2, 290, this.chapter === 'ch1' ? t('end.ch1.toBeContinued') : t('end.toBeContinued'), { fontFamily: DISPLAY, fontSize: this.chapter === 'ch1' ? '82px' : '110px', color: '#ffffff', padding: { x: 4, y: 8 } })
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
      .text(W / 2, 385, this.chapter === 'ch0' ? t('end.ch0.next') : this.chapter === 'ch1' ? t('end.ch1.next') : t('end.next'), { fontFamily: FONT, fontSize: '22px', fontStyle: '600', color: COLORS.hover })
      .setOrigin(0.5)
      .setLetterSpacing(3)
      .setDepth(1001)
      .setAlpha(0);
    const thanks = this.add
      .text(W / 2, 425, this.chapter === 'ch0' ? t('end.ch0.thanks') : this.chapter === 'ch1' ? t('end.ch1.thanks') : t('end.thanks'), { fontFamily: FONT, fontSize: '17px', color: COLORS.dim })
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
        // vers le chapitre suivant : aspiration dans la faille, tampon « TRANSFÉRÉ », puis l'interlude
        makeButton(this, W / 2 + 16 - dx / 2 + 282, 560, t('end.nextChapter'), () => this.transfer(play(next)), {
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
