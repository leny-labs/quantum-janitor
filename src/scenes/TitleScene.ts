import Phaser from 'phaser';
import { END_SCENE_ID, getSession } from '../session';
import { introSeen } from './IntroScene';
import { lang, langName, nextLang, setLang, t, tl } from '../i18n';
import { HeroView } from '../three/Hero';
import { titleShot } from '../three/shots/title';
import { bakeStudio, preloadPortraitSheets } from '../three/Studio';
import { makeButton } from '../ui/Button';
import { drawHazard, drawLed, drawPanel } from '../ui/chrome';
import { playMusic } from '../ui/music';
import { onSfxChange, sfxEnabled, toggleSfx } from '../ui/sfx';
import { makeMusicToggle } from '../ui/MusicToggle';
import { COLORS, DISPLAY, FONT, H, W, hex } from '../ui/theme';
import { BAY, DECOR_KEY, PUDDLE_KEY, SHEEN_KEY, SOFT_KEY, VIGNETTE_KEY, bakeDecor, bayPoints } from './titleDecor';

/** Ligne des réglages (♪, effets, langue), en haut à droite. */
const SETTINGS_Y = 62;

/** Key art GenAI du héros (détouré, fondu alpha) — validé tel quel. */
const HERO_ART = 'menu-hero';
const HERO_URL = `${import.meta.env.BASE_URL}menu/hero-keyart.png`;

export class TitleScene extends Phaser.Scene {
  private hero: HeroView | null = null;
  private ticker: Phaser.GameObjects.Container | null = null;
  private tickerWidth = 0;

  constructor() {
    super('Title');
  }

  preload(): void {
    // planches de portraits parlants (bake ou GenAI) ; absentes → bake runtime
    preloadPortraitSheets(this.load);
    if (!this.textures.exists(HERO_ART)) this.load.image(HERO_ART, HERO_URL);
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
    playMusic('menu');
    bakeDecor(this);

    this.drawStars();
    this.drawBay();
    this.drawHero();

    // assombrit la colonne gauche (lisibilité) + bas d'écran, puis vignette douce
    const shade = this.add.graphics();
    shade.fillGradientStyle(COLORS.ink, COLORS.ink, COLORS.ink, COLORS.ink, 0.8, 0, 0.8, 0);
    shade.fillRect(0, 0, W * 0.56, H);
    shade.fillGradientStyle(COLORS.ink, COLORS.ink, COLORS.ink, COLORS.ink, 0, 0, 0.45, 0.45);
    shade.fillRect(0, H - 100, W, 100);
    this.add.image(0, 0, VIGNETTE_KEY).setOrigin(0);

    this.drawTicker();
    this.drawTitle();
    this.drawMenu();
    // sous le bandeau défilant (30 px + bande de danger)
    const music = makeMusicToggle(this, W - 34, SETTINGS_Y).setDepth(1000);
    this.drawSettings(music.x - music.width / 2 - 12);

    // pied de page : formulaire officiel
    const foot = this.add.graphics();
    drawLed(foot, 42, H - 26, hex(COLORS.accent), 3);
    this.add
      .text(56, H - 26, t('title.footer'), {
        fontFamily: FONT,
        fontSize: '12px',
        color: COLORS.dim,
      })
      .setOrigin(0, 0.5)
      .setLetterSpacing(1.5);
    this.add
      .text(W - 32, H - 26, t('title.footerRight'), { fontFamily: FONT, fontSize: '12px', color: COLORS.dim })
      .setOrigin(1, 0.5)
      .setLetterSpacing(1);

    this.cameras.main.fadeIn(700, 7, 5, 15);
  }

  update(_t: number, dt: number): void {
    this.hero?.update();
    if (this.ticker) {
      this.ticker.x -= dt * 0.05;
      if (this.ticker.x < -this.tickerWidth) this.ticker.x += this.tickerWidth;
    }
  }

  /** Étoiles scintillantes par-dessus le ciel 3D, visibles à travers la baie. */
  private drawStars(): void {
    let s = 17;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const tints = [0xffffff, 0xcfc8ff, 0x7fffd4, 0xffd8a8];
    for (let i = 0; i < 46; i++) {
      const r = rnd() < 0.85 ? 0.8 + rnd() * 0.8 : 1.6 + rnd() * 1.2;
      const star = this.add.circle(BAY.x0 + rnd() * (BAY.x1 - BAY.x0), BAY.y0 + rnd() * (BAY.y1 - BAY.y0), r, tints[i % tints.length], 1).setAlpha(0.15 + rnd() * 0.3);
      this.tweens.add({
        targets: star,
        alpha: 0.6 + rnd() * 0.4,
        duration: 900 + rnd() * 2200,
        delay: rnd() * 3000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  /**
   * La grande baie du pont d'observation : un reflet balaie la vitre de temps
   * en temps, puis mur, cadre, vitre et sol peints (une seule texture), et
   * quelques LED de service qui clignotent sur le cadre.
   */
  private drawBay(): void {
    const cy = (BAY.y0 + BAY.y1) / 2;
    const sheen = this.add.image(BAY.x0 - 220, cy, SHEEN_KEY).setDisplaySize(170, 900).setAngle(24).setAlpha(0.16).setBlendMode(Phaser.BlendModes.ADD);
    const mask = this.make.graphics({}, false);
    mask.fillStyle(0xffffff);
    mask.fillPoints(bayPoints().map(([x, y]) => new Phaser.Geom.Point(x, y)), true);
    sheen.setMask(mask.createGeometryMask());
    this.tweens.add({ targets: sheen, x: BAY.x1 + 220, duration: 2600, delay: 1800, repeatDelay: 7000, repeat: -1, ease: 'Sine.easeInOut' });

    this.add.image(0, 0, DECOR_KEY).setOrigin(0);

    // LED de service sur le cadre, entre les rivets (pas de 34 px)
    const led = (k: number) => BAY.x0 + BAY.cut + 27 + k * 34;
    const leds: [number, number, number][] = [
      [led(0), BAY.y1 + 19, 0x7fffd4],
      [led(1), BAY.y1 + 19, 0xff4f9a],
      [led(2), BAY.y1 + 19, 0xffd166],
      [led(4), BAY.y0 - 19, 0xff4f9a],
      [led(13), BAY.y0 - 19, 0x7fffd4],
      [led(14), BAY.y0 - 19, 0x7fffd4],
    ];
    for (const [i, [x, y, color]] of leds.entries()) {
      const halo = this.add.image(x, y, SOFT_KEY).setDisplaySize(26, 26).setTint(color).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.5);
      const dot = this.add.circle(x, y, 2.6, color);
      this.tweens.add({ targets: [halo, dot], alpha: 0.2, duration: 500 + i * 230, yoyo: true, repeat: -1, delay: i * 300, ease: 'Stepped', easeParams: [2] });
    }
  }

  /**
   * Le héros (key art GenAI) debout sur le sol du pont, devant la baie :
   * halo derrière lui, flaque de lumière et ombres de contact sous les
   * bottes, poussière en suspension. Respiration légère (étirement depuis
   * les pieds) + balancement très discret pour ne pas faire glisser les pieds.
   */
  private drawHero(): void {
    const add = Phaser.BlendModes.ADD;
    const halo = this.add.image(W - 200, 330, SOFT_KEY).setDisplaySize(640, 760).setTint(0x8a5cff).setBlendMode(add).setAlpha(0.3);
    this.tweens.add({ targets: halo, alpha: 0.45, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const pool = this.add.image(W - 196, 648, PUDDLE_KEY).setDisplaySize(460, 110).setTint(0x9f8cff).setBlendMode(add).setAlpha(0.42);
    this.tweens.add({ targets: pool, alpha: 0.55, duration: 1900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // poussière flottante dans la lumière de la baie
    this.add.particles(0, 0, SOFT_KEY, {
      x: { min: 0, max: W },
      y: { min: 60, max: H - 40 },
      lifespan: 9000,
      speedX: { min: -6, max: 6 },
      speedY: { min: -9, max: -2 },
      scale: { min: 0.02, max: 0.055 },
      alpha: { onEmit: () => 0, onUpdate: (_p: unknown, _k: string, t: number) => Math.sin(t * Math.PI) * 0.55 },
      tint: [0xcfc8ff, 0x7fffd4, 0xffd8a8],
      blendMode: add,
      frequency: 280,
      advance: 9000,
    });

    if (!this.textures.exists(HERO_ART)) return;
    const bottom = H - 34;
    const height = H - 104;
    // ombres de contact (bottes gauche et droite), puis le héros
    const shadows = [
      this.add.image(W - 200, 652, PUDDLE_KEY).setDisplaySize(340, 70).setTint(0x020108).setAlpha(0.45),
      this.add.image(W - 266, 632, PUDDLE_KEY).setDisplaySize(200, 34).setTint(0x020108).setAlpha(0.9),
      this.add.image(W - 140, 667, PUDDLE_KEY).setDisplaySize(170, 32).setTint(0x020108).setAlpha(0.9),
    ];
    const hero = this.add.image(W - 210, bottom, HERO_ART).setOrigin(0.5, 1);
    hero.setScale(height / hero.height);
    const base = hero.scale;
    hero.setAlpha(0).setX(hero.x + 40);
    for (const sh of shadows) {
      const a = sh.alpha;
      sh.setAlpha(0).setX(sh.x + 40);
      this.tweens.add({ targets: sh, alpha: a, x: sh.x - 40, duration: 1000, delay: 300, ease: 'Cubic.easeOut' });
    }
    this.tweens.add({ targets: hero, alpha: 1, x: hero.x - 40, duration: 1000, delay: 300, ease: 'Cubic.easeOut' });
    this.tweens.add({ targets: hero, scaleY: base * 1.012, scaleX: base * 1.004, duration: 1900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: hero, angle: 0.3, duration: 3400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  /**
   * Réglages en haut à droite, à gauche du ♪ : langue (cycle, recharge la
   * page) et effets sonores (blips de texte compris ; touche S).
   */
  private drawSettings(right: number): void {
    const langBtn = makeButton(this, right, SETTINGS_Y, t('settings.language', { lang: langName(lang()) }), () => setLang(nextLang()), { size: 14, align: 'right' }).setDepth(1000);
    const x = langBtn.x - langBtn.width / 2 - 10;
    let sfxBtn: Phaser.GameObjects.Container | null = null;
    const drawSfx = () => {
      sfxBtn?.destroy();
      const label = t('settings.sfxValue', { state: sfxEnabled() ? t('settings.on') : t('settings.off') });
      sfxBtn = makeButton(this, x, SETTINGS_Y, label, () => toggleSfx(), { size: 14, align: 'right' }).setDepth(1000);
    };
    drawSfx();
    const off = onSfxChange(() => drawSfx());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, off);
  }

  /** Bandeau défilant : slogans en léger néon, séparateurs ✦ qui scintillent. */
  private drawTicker(): void {
    const y = 0;
    const h = 30;
    const g = this.add.graphics();
    g.fillStyle(COLORS.ink, 0.82);
    g.fillRect(0, y, W, h);
    drawHazard(g, 0, y + h, W, 5, 0.9);
    const strip = this.add.container(0, y + h / 2);
    const style = { fontFamily: FONT, fontSize: '13px', fontStyle: '600', color: COLORS.hover, padding: { x: 6, y: 6 } };
    const slogans = tl('title.slogans');
    let cx = 0;
    for (let rep = 0; rep < 2; rep++) {
      for (const [i, s] of slogans.entries()) {
        const text = this.add.text(cx, 0, s, style).setOrigin(0, 0.5).setLetterSpacing(2.5).setShadow(0, 0, 'rgba(255,209,102,0.7)', 6, false, true);
        cx += text.width + 16;
        const star = this.add.text(cx, 0, '✦', { ...style, color: COLORS.accent }).setOrigin(0.5).setAlpha(0.4);
        this.tweens.add({ targets: star, alpha: 1, scale: 1.35, duration: 380, yoyo: true, repeat: -1, repeatDelay: 1400 + ((i * 577) % 1700), delay: i * 260 + rep * 130, ease: 'Sine.easeInOut' });
        strip.add([text, star]);
        cx += 22;
      }
      if (rep === 0) this.tickerWidth = cx;
    }
    this.ticker = strip;
    // cartouche fixe à gauche, au-dessus du défilement
    const tag = this.add.graphics();
    tag.fillStyle(hex(COLORS.danger), 1);
    tag.fillRect(0, y, 196, h);
    tag.fillTriangle(196, y, 212, y, 196, y + h);
    this.add
      .text(14, y + h / 2, t('title.announce'), { fontFamily: FONT, fontSize: '13px', fontStyle: '700', color: '#07050f' })
      .setOrigin(0, 0.5)
      .setLetterSpacing(2);
  }

  /**
   * QUANTUM JANITOR : dégradé + contour, scanlines gravées dans la texture,
   * halo néon qui respire, reflet qui balaie les lettres, glitch chromatique
   * rare et court, étincelles quantiques autour.
   */
  private drawTitle(): void {
    const x = 78;
    this.add
      .text(x + 2, 104, t('title.station'), { fontFamily: FONT, fontSize: '15px', fontStyle: '600', color: COLORS.accent })
      .setLetterSpacing(4);

    const style = { fontFamily: DISPLAY, fontSize: '104px', color: '#ffffff', padding: { x: 4, y: 12 } };
    const word = (y: number, s: string, top: string, bottom: string) => {
      // halo néon précuit (flou canvas) derrière les lettres : ne coûte rien au rendu
      const pad = 36;
      const glow = this.add
        .text(x - pad + 4, y - pad + 12, s, { ...style, color: '#ff4f9a', padding: { x: pad, y: pad } })
        .setStroke('#ff4f9a', 12)
        .setShadow(0, 0, '#ff4f9a', 28, true, true)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0);
      // fantômes rouge/cyan pour le glitch chromatique (invisibles au repos)
      const ghosts = [0xff3b6b, 0x3bf0ff].map((c) => this.add.text(x, y, s, style).setTintFill(c).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0));
      const t = this.add.text(x, y, s, style);
      const grad = t.context.createLinearGradient(0, 22, 0, t.height - 22);
      grad.addColorStop(0, top);
      grad.addColorStop(0.55, bottom);
      grad.addColorStop(0.56, '#ff8ab8');
      grad.addColorStop(1, '#ff4f9a');
      t.setFill(grad);
      t.setStroke('#07050f', 10);
      t.setShadow(0, 7, '#07050f', 0, true, true);
      this.scanlines(t);
      t.preFX?.addShine(0.28, 0.35, 5);
      return { t, ghosts, glow };
    };
    const words = [word(124, t('title.word1'), '#fff6e0', '#ffd166'), word(226, t('title.word2'), '#d9fff4', '#7fffd4')];
    for (const [i, { t, glow }] of words.entries()) {
      t.setAlpha(0).setX(x - 30);
      this.tweens.add({ targets: t, alpha: 1, x, duration: 900, delay: 200 + i * 120, ease: 'Cubic.easeOut' });
      // le néon s'allume après l'entrée, puis respire
      this.tweens.add({ targets: glow, alpha: 0.55, duration: 500, delay: 1000 + i * 120, onComplete: () => this.tweens.add({ targets: glow, alpha: 0.95, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }) });
    }

    // glitch : rare (5–10 s), court (~150 ms), le texte reste lisible
    const glitch = () => {
      for (const { t, ghosts } of words) {
        const dx = Phaser.Math.Between(3, 6);
        ghosts[0].setPosition(x - dx, t.y + Phaser.Math.Between(-1, 1)).setAlpha(0.45);
        ghosts[1].setPosition(x + dx, t.y).setAlpha(0.45);
        t.setX(x + Phaser.Math.Between(-3, 3));
      }
      this.time.delayedCall(70, () => {
        for (const { ghosts } of words) for (const [k, gh] of ghosts.entries()) gh.setX(x + (k ? -2 : 2)).setAlpha(0.3);
      });
      this.time.delayedCall(150, () => {
        for (const { t, ghosts } of words) {
          t.setX(x);
          for (const gh of ghosts) gh.setAlpha(0);
        }
      });
      this.time.delayedCall(Phaser.Math.Between(5000, 10000), glitch);
    };
    this.time.delayedCall(3200, glitch);

    // étincelles quantiques autour du titre
    this.add.particles(0, 0, SOFT_KEY, {
      emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(x - 10, 136, 570, 200), quantity: 1 } as Phaser.Types.GameObjects.Particles.EmitZoneData,
      lifespan: { min: 700, max: 1500 },
      speedY: { min: -26, max: -6 },
      speedX: { min: -10, max: 10 },
      scale: { start: 0.11, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0x7fffd4, 0xffd166, 0xff4f9a, 0xffffff],
      blendMode: Phaser.BlendModes.ADD,
      frequency: 150,
    });

    // cartouche « chapitre »
    const y = 362;
    const g = this.add.graphics();
    drawPanel(g, x + 4, y, 372, 46, { fill: COLORS.ink, fillAlpha: 0.7, edge: hex(COLORS.hover), cut: 12, glow: false });
    g.fillStyle(hex(COLORS.hover), 1);
    g.fillRect(x + 4, y + 8, 5, 30);
    const chapter = this.add.text(x + 26, y + 23, t('title.chapter'), { fontFamily: FONT, fontSize: '15px', fontStyle: '700', color: COLORS.hover }).setOrigin(0, 0.5).setLetterSpacing(3);
    this.add.text(chapter.x + chapter.width + 16, y + 23, t('title.chapterName'), { fontFamily: FONT, fontSize: '24px', fontStyle: 'italic 500', color: COLORS.text }).setOrigin(0, 0.5);
    this.add
      .text(x + 4, y + 62, t('title.pitch'), {
        fontFamily: FONT,
        fontSize: '16px',
        color: COLORS.dim,
        lineSpacing: 4,
      });
  }

  /** Scanlines légères gravées dans la texture d'un texte (lettres seules). */
  private scanlines(text: Phaser.GameObjects.Text): void {
    const g = text.context;
    g.save();
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = 'rgba(7,5,15,0.14)';
    for (let y = 0; y < text.canvas.height; y += 4) g.fillRect(0, y, text.canvas.width, 1.5);
    g.restore();
    const r = this.renderer;
    if (r instanceof Phaser.Renderer.WebGL.WebGLRenderer) text.frame.source.glTexture = r.canvasToTexture(text.canvas, text.frame.source.glTexture ?? undefined, true);
  }

  /**
   * Finition des boutons du menu (local à l'écran titre) : halo au survol,
   * petit décalage vers la droite et chevron animé ; le bouton principal
   * respire doucement au repos.
   */
  private polishButton(c: Phaser.GameObjects.Container, primary: boolean): void {
    // halo doux derrière le bouton (sprite additif, pas de shader plein écran)
    const rest = primary ? 0.22 : 0;
    const glow = this.add
      .image(c.x, c.y, SOFT_KEY)
      .setDisplaySize(c.width + 90, c.height + 70)
      .setTint(primary ? 0x7fffd4 : 0xffd166)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(rest);
    c.setAbove(glow);
    const idle = primary ? this.tweens.add({ targets: glow, alpha: 0.4, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }) : null;
    const x0 = c.x;
    const left = c.x - c.width / 2;
    const chevron = this.add.graphics().setPosition(left - 14, c.y).setAlpha(0);
    chevron.fillStyle(hex(COLORS.hover), 1);
    chevron.fillTriangle(-6, -8, 4, 0, -6, 8);
    let bounce: Phaser.Tweens.Tween | null = null;
    c.on('pointerover', () => {
      idle?.pause();
      this.tweens.add({ targets: glow, alpha: 0.6, x: x0 + 6, duration: 160 });
      this.tweens.add({ targets: c, x: x0 + 6, duration: 140, ease: 'Quad.easeOut' });
      chevron.setAlpha(1).setX(left - 14);
      bounce = this.tweens.add({ targets: chevron, x: left - 6, duration: 320, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });
    c.on('pointerout', () => {
      this.tweens.add({ targets: glow, alpha: rest, x: x0, duration: 200, onComplete: () => idle?.resume() });
      this.tweens.add({ targets: c, x: x0, duration: 160, ease: 'Quad.easeOut' });
      bounce?.stop();
      chevron.setAlpha(0);
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
      const resume = makeButton(
        this,
        x,
        y,
        t('title.resume'),
        go(() => {
          if (!session.loadGame()) return this.scene.restart();
          if (session.state.ended) this.scene.start('End', { final: true });
          else this.scene.start('Room');
        }),
        { align: 'left', primary: true, size: 22, minWidth: 360, kicker: t('title.resumeKicker') },
      );
      this.polishButton(resume, true);
      y += 84;
    }
    // l'intro animée se joue à la première prise de service (ou ?intro=1)
    const playIntro = !introSeen() || session.debug.intro;
    const start = makeButton(
      this,
      x,
      y,
      hasSave ? t('title.newClone') : t('title.start'),
      go(() => {
        session.newGame();
        this.scene.start(playIntro ? 'Intro' : 'Room');
      }),
      {
        align: 'left',
        primary: !hasSave,
        size: hasSave ? 18 : 22,
        minWidth: hasSave ? 300 : 360,
        kicker: hasSave ? t('title.newCloneKicker') : t('title.startKicker'),
      },
    );
    this.polishButton(start, !hasSave);
    if (introSeen()) {
      const replay = makeButton(this, start.x + start.width / 2 + 20, y, t('title.replayIntro'), go(() => this.scene.start('Intro', { next: 'Title' })), {
        align: 'left',
        size: 15,
        kicker: t('title.replayIntroKicker'),
      });
      this.polishButton(replay, false);
    }
  }
}
