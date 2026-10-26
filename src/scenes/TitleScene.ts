import Phaser from 'phaser';
import { END_SCENE_ID, getSession } from '../session';
import { introSeen } from './IntroScene';
import { HeroView } from '../three/Hero';
import { titleShot } from '../three/shots/title';
import { bakeStudio, preloadPortraitSheets } from '../three/Studio';
import { makeButton } from '../ui/Button';
import { drawHazard, drawLed, drawPanel } from '../ui/chrome';
import { playMusic } from '../ui/music';
import { makeMusicToggle } from '../ui/MusicToggle';
import { COLORS, DISPLAY, FONT, H, W, hex } from '../ui/theme';

/** Slogans de la station, en défilement permanent (SYLVIE y tient). */
const SLOGANS = [
  'LE BONHEUR EST OBLIGATOIRE',
  'SYLVIE VOUS OBSERVE — AVEC AFFECTION',
  'UNE SALETÉ NON SIGNALÉE EST UNE SALETÉ COMPLICE',
  'VOTRE CLONE DE REMPLACEMENT EST DÉJÀ AU CHAUD',
  'LE SEAU EST VOTRE AMI · LE SEAU EST LE PROTOCOLE',
  "TOUTE QUESTION SUR L'IMPROBABILITÉ EST UNE QUESTION DE TROP",
];

export class TitleScene extends Phaser.Scene {
  private hero: HeroView | null = null;
  private ticker: Phaser.GameObjects.Text | null = null;

  constructor() {
    super('Title');
  }

  preload(): void {
    // planches de portraits parlants (bake ou GenAI) ; absentes → bake runtime
    preloadPortraitSheets(this.load);
  }

  create(): void {
    const session = getSession();
    const d = session.debug;
    bakeStudio(this.textures);
    // Mode debug : on saute l'écran titre (une seule fois).
    if (d.active && !this.registry.get('debugStarted')) {
      this.registry.set('debugStarted', true);
      session.startDebug();
      if (d.scene === END_SCENE_ID) this.scene.start('End', { knot: 'cafards' });
      else this.scene.start('Room');
      return;
    }

    this.hero = new HeroView(this, titleShot(W, H));
    playMusic('title');

    // assombrit la colonne gauche (lisibilité) + vignette haut/bas
    const shade = this.add.graphics();
    shade.fillGradientStyle(COLORS.ink, COLORS.ink, COLORS.ink, COLORS.ink, 0.88, 0, 0.88, 0);
    shade.fillRect(0, 0, W * 0.62, H);
    shade.fillGradientStyle(COLORS.ink, COLORS.ink, COLORS.ink, COLORS.ink, 0, 0, 0.75, 0.75);
    shade.fillRect(0, H - 170, W, 170);

    this.drawTicker();
    this.drawTitle();
    this.drawMenu();
    makeMusicToggle(this, W - 34, 34).setDepth(1000);

    // pied de page : formulaire officiel
    const foot = this.add.graphics();
    drawLed(foot, 42, H - 26, hex(COLORS.accent), 3);
    this.add
      .text(56, H - 26, "FORMULAIRE QJ-0 · ACCRÉDITATION : INFRAROUGE · LECTURE DE CET ÉCRAN DÉJÀ ENREGISTRÉE", {
        fontFamily: FONT,
        fontSize: '12px',
        color: COLORS.dim,
      })
      .setOrigin(0, 0.5)
      .setLetterSpacing(1.5);
    this.add
      .text(W - 32, H - 26, 'Sauvegarde automatique · vos clones vous remercient · v0.1', { fontFamily: FONT, fontSize: '12px', color: COLORS.dim })
      .setOrigin(1, 0.5)
      .setLetterSpacing(1);

    this.cameras.main.fadeIn(700, 7, 5, 15);
  }

  update(_t: number, dt: number): void {
    this.hero?.update();
    if (this.ticker) {
      this.ticker.x -= dt * 0.05;
      if (this.ticker.x < -this.ticker.width / 2) this.ticker.x += this.ticker.width / 2;
    }
  }

  private drawTicker(): void {
    const y = 0;
    const h = 30;
    const g = this.add.graphics();
    g.fillStyle(COLORS.ink, 0.82);
    g.fillRect(0, y, W, h);
    drawHazard(g, 0, y + h, W, 5, 0.9);
    const line = SLOGANS.join('   ✦   ') + '   ✦   ';
    this.ticker = this.add
      .text(0, y + h / 2, line + line, { fontFamily: FONT, fontSize: '13px', fontStyle: '600', color: COLORS.hover })
      .setOrigin(0, 0.5)
      .setLetterSpacing(2.5);
    // cartouche fixe à gauche, au-dessus du défilement
    const tag = this.add.graphics();
    tag.fillStyle(hex(COLORS.danger), 1);
    tag.fillRect(0, y, 196, h);
    tag.fillTriangle(196, y, 212, y, 196, y + h);
    this.add
      .text(14, y + h / 2, '● SYLVIE · ANNONCE', { fontFamily: FONT, fontSize: '13px', fontStyle: '700', color: '#07050f' })
      .setOrigin(0, 0.5)
      .setLetterSpacing(2);
  }

  private drawTitle(): void {
    const x = 78;
    this.add
      .text(x + 2, 104, 'STATION KLEPSYDRA-9  ·  SERVICE D’ENTRETIEN QUANTIQUE', { fontFamily: FONT, fontSize: '15px', fontStyle: '600', color: COLORS.accent })
      .setLetterSpacing(4);

    const word = (y: number, s: string, top: string, bottom: string) => {
      const t = this.add.text(x, y, s, { fontFamily: DISPLAY, fontSize: '104px', color: '#ffffff', padding: { x: 4, y: 8 } });
      const grad = t.context.createLinearGradient(0, 18, 0, t.height - 18);
      grad.addColorStop(0, top);
      grad.addColorStop(0.55, bottom);
      grad.addColorStop(0.56, '#ff8ab8');
      grad.addColorStop(1, '#ff4f9a');
      t.setFill(grad);
      t.setStroke('#07050f', 10);
      t.setShadow(0, 10, 'rgba(255,79,154,0.55)', 26, true, true);
      return t;
    };
    const q = word(124, 'QUANTUM', '#fff6e0', '#ffd166');
    const j = word(226, 'JANITOR', '#d9fff4', '#7fffd4');
    for (const [t, delay] of [[q, 0], [j, 120]] as const) {
      t.setAlpha(0).setX(x - 30);
      this.tweens.add({ targets: t, alpha: 1, x, duration: 900, delay: 200 + delay, ease: 'Cubic.easeOut' });
    }

    // cartouche « chapitre »
    const y = 362;
    const g = this.add.graphics();
    drawPanel(g, x + 4, y, 372, 46, { fill: COLORS.ink, fillAlpha: 0.7, edge: hex(COLORS.hover), cut: 12, glow: false });
    g.fillStyle(hex(COLORS.hover), 1);
    g.fillRect(x + 4, y + 8, 5, 30);
    this.add.text(x + 26, y + 23, 'CHAPITRE 0', { fontFamily: FONT, fontSize: '15px', fontStyle: '700', color: COLORS.hover }).setOrigin(0, 0.5).setLetterSpacing(3);
    this.add.text(x + 148, y + 23, '« Le Seau »', { fontFamily: FONT, fontSize: '24px', fontStyle: 'italic 500', color: COLORS.text }).setOrigin(0, 0.5);
    this.add
      .text(x + 4, y + 62, 'Gary Plunk, agent d’entretien intérimaire. Un seau. Un réacteur.\nAucune formation. Formation obligatoire.', {
        fontFamily: FONT,
        fontSize: '16px',
        color: COLORS.dim,
        lineSpacing: 4,
      });
  }

  private drawMenu(): void {
    const session = getSession();
    const hasSave = session.save.has() && !session.debug.active;
    const x = 82;
    let y = 520;
    const go = (fn: () => void) => () => {
      this.cameras.main.fadeOut(350, 7, 5, 15);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, fn);
    };
    if (hasSave) {
      makeButton(
        this,
        x,
        y,
        'Reprendre le service',
        go(() => {
          if (!session.loadGame()) return this.scene.restart();
          if (session.state.ended) this.scene.start('End', { final: true });
          else this.scene.start('Room');
        }),
        { align: 'left', primary: true, size: 22, minWidth: 360, kicker: 'VOTRE CLONE PRÉCÉDENT VOUS ATTEND' },
      );
      y += 84;
    }
    // l'intro animée se joue à la première prise de service (ou ?intro=1)
    const playIntro = !introSeen() || session.debug.intro;
    const start = makeButton(
      this,
      x,
      y,
      hasSave ? 'Nouveau clone' : 'Prendre son service',
      go(() => {
        session.newGame();
        this.scene.start(playIntro ? 'Intro' : 'Room');
      }),
      {
        align: 'left',
        primary: !hasSave,
        size: hasSave ? 18 : 22,
        minWidth: hasSave ? 300 : 360,
        kicker: hasSave ? 'EFFACE LA SAUVEGARDE · LE CLONE ACTUEL SERA RECYCLÉ' : 'LE BONHEUR COMMENCE MAINTENANT',
      },
    );
    if (introSeen()) {
      makeButton(this, start.x + start.width / 2 + 20, y, 'Revoir l’intro', go(() => this.scene.start('Intro', { next: 'Title' })), {
        align: 'left',
        size: 15,
        kicker: 'ARCHIVE SYLVIE · VISIONNAGE CONSIGNÉ',
      });
    }
  }
}
