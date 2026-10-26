// Intro cinématique en motion design, jouée avant le Chapitre 0 :
// la station, SYLVIE, Gary, B.O.B., le job, la carte de chapitre.
// Fond 3D (HeroView) + calques Phaser (tweens, masques, tampons, glitch).
// Clic / tap = plan suivant ; Échap, Espace, appui long ou « Passer » = fin.
import Phaser from 'phaser';
import { HeroView } from '../three/Hero';
import { introShot } from '../three/shots/intro';
import { titleShot } from '../three/shots/title';
import { SHEET, iconKey, sheetKey } from '../three/Studio';
import { makeButton } from '../ui/Button';
import { drawHazard, drawLed, drawPanel } from '../ui/chrome';
import { isTouch } from '../ui/input';
import { PressRing } from '../ui/PressRing';
import { playMusic } from '../ui/music';
import { blip, glitch, plouf, thud, whoosh } from '../ui/sfx';
import { t, tl, type TextKey } from '../i18n';
import { COLORS, DISPLAY, FONT, H, W, hex } from '../ui/theme';

const SEEN_KEY = 'quantum-janitor.introSeen';

export function introSeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function markIntroSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    // stockage indisponible : l'intro sera reproposée, tant pis
  }
}

export interface IntroData {
  /** Scène lancée à la fin (Room pour une nouvelle partie, Title pour « Revoir l'intro »). */
  next?: 'Room' | 'Title';
}

type Speaker = 'sylvie' | 'gary' | 'bob' | null;

const VOICES: Record<Exclude<Speaker, null>, { name: TextKey; color: string; pitch: number }> = {
  sylvie: { name: 'intro.names.sylvie', color: COLORS.accent, pitch: 1.35 },
  gary: { name: 'intro.names.gary', color: COLORS.warm, pitch: 0.85 },
  bob: { name: 'intro.names.bob', color: '#a9b8d0', pitch: 0.6 },
};

const BAR = 56;
const SUB_Y = H - BAR - 74;
const CPS = 40;

/** Portrait animé depuis une planche Studio (boucles idle / talk). */
class SheetPortrait {
  readonly image: Phaser.GameObjects.Image;
  private seq: readonly { frame: number; duration: number }[] = SHEET.idle;
  private i = 0;
  private left: number = SHEET.idle[0].duration;
  talking = false;

  constructor(scene: Phaser.Scene, id: string, x: number, y: number, size: number) {
    const key = sheetKey(id);
    const tex = scene.textures.get(key);
    if (!tex.has('f0')) {
      const src = tex.source[0];
      const fw = src.width / SHEET.cols;
      const fh = src.height / SHEET.rows;
      for (let i = 0; i < SHEET.cols * SHEET.rows; i++) tex.add(`f${i}`, 0, (i % SHEET.cols) * fw, Math.floor(i / SHEET.cols) * fh, fw, fh);
    }
    this.image = scene.add.image(x, y, key, 'f0').setDisplaySize(size, size);
  }

  talk(on: boolean): void {
    if (on === this.talking) return;
    this.talking = on;
    this.seq = on ? SHEET.talk : SHEET.idle;
    this.i = 0;
    this.left = this.seq[0].duration;
    this.image.setFrame(`f${this.seq[0].frame}`);
  }

  update(dt: number): void {
    this.left -= dt;
    while (this.left <= 0) {
      this.i = (this.i + 1) % this.seq.length;
      this.left += this.seq[this.i].duration;
      this.image.setFrame(`f${this.seq[this.i].frame}`);
    }
  }
}

export class IntroScene extends Phaser.Scene {
  private hero!: HeroView;
  private next: 'Room' | 'Title' = 'Room';
  private plan = -1;
  private planAt = 0;
  private planDur = 1;
  private ending = false;
  private layer!: Phaser.GameObjects.Container;
  private tint!: Phaser.GameObjects.Rectangle;
  /** Événements du plan courant (ms depuis le début du plan, horloge réelle). */
  private cues: { at: number; fn: () => void }[] = [];
  /** Télétypes en cours (texte révélé selon le temps écoulé). */
  private typers: { t: Phaser.GameObjects.Text; s: string; at: number; cps: number; n: number; tick?: (n: number) => void; done?: () => void }[] = [];
  private planTweens: Phaser.Tweens.Tween[] = [];
  /** Objets hors calque (masques) à détruire au changement de plan. */
  private trash: Phaser.GameObjects.GameObject[] = [];
  private faces = new Map<string, SheetPortrait>();
  private wave: { g: Phaser.GameObjects.Graphics; x: number; y: number; w: number; h: number } | null = null;
  private grid: Phaser.GameObjects.TileSprite | null = null;
  private progress!: Phaser.GameObjects.Graphics;
  private scanBar!: Phaser.GameObjects.Rectangle;
  private sub!: { root: Phaser.GameObjects.Container; plate: Phaser.GameObjects.Graphics; name: Phaser.GameObjects.Text; body: Phaser.GameObjects.Text };
  private press: PressRing | null = null;
  private skipButton!: Phaser.GameObjects.Container;
  private rotateHint!: Phaser.GameObjects.Text;
  private keyHandler!: (e: KeyboardEvent) => void;

  private readonly plans: (() => number)[] = [
    () => this.planStation(),
    () => this.planSylvie(),
    () => this.planGary(),
    () => this.planBob(),
    () => this.planJob(),
    () => this.planChapter(),
  ];

  constructor() {
    super('Intro');
  }

  create(data: IntroData): void {
    this.next = data?.next ?? 'Room';
    playMusic('title');
    this.plan = -1;
    this.ending = false;
    this.cues = [];
    this.typers = [];
    this.planTweens = [];
    this.trash = [];
    this.faces.clear();
    this.wave = null;
    this.grid = null;
    this.press = null;

    this.hero = new HeroView(this, introShot(W, H));
    this.tint = this.add.rectangle(0, 0, W, H, 0x000000, 0).setOrigin(0).setDepth(1);
    this.layer = this.add.container(0, 0).setDepth(10);
    this.buildChrome();
    this.buildSubtitles();

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (this.ending || over.includes(this.skipButton)) return;
      this.press?.cancel();
      this.press = new PressRing(this, p.x, p.y, () => this.advance(), () => this.finish());
    });
    this.keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') this.finish();
      else if (e.key === 'Enter' || e.key === 'ArrowRight') this.advance();
    };
    window.addEventListener('keydown', this.keyHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('keydown', this.keyHandler);
      this.press?.cancel();
      this.teardown();
    });

    this.cameras.main.fadeIn(600, 0, 0, 0);
    this.advance();
  }

  /** Temps écoulé dans le plan courant. Horloge réelle : les timers Phaser
   * suivent le temps de jeu, qui traîne quand le rendu 3D rame. */
  private get elapsed(): number {
    return performance.now() - this.planAt;
  }

  update(_t: number, dt: number): void {
    const now = this.elapsed;
    // une cue peut changer de plan : on copie la liste et on vérifie le plan
    const plan = this.plan;
    for (const c of this.cues.filter((c) => c.at <= now)) {
      if (this.plan !== plan) break;
      this.cues.splice(this.cues.indexOf(c), 1);
      c.fn();
    }
    for (const ty of [...this.typers]) {
      const n = Phaser.Math.Clamp(Math.floor(((now - ty.at) * ty.cps) / 1000), 0, ty.s.length);
      if (n === ty.n) continue;
      ty.n = n;
      ty.t.setText(ty.s.slice(0, n));
      ty.tick?.(n);
      if (n >= ty.s.length) {
        this.typers.splice(this.typers.indexOf(ty), 1);
        ty.done?.();
      }
    }
    this.hero.update();
    for (const f of this.faces.values()) f.update(dt);
    if (this.grid) this.grid.tilePositionY -= dt * 0.02;
    this.drawWave();
    this.drawProgress();
    this.scanBar.y = (this.scanBar.y + dt * 0.12) % H;
    this.rotateHint.setVisible(window.innerHeight > window.innerWidth);
  }

  // ── flux ─────────────────────────────────────────────────────────────

  private advance(): void {
    if (this.ending) return;
    if (this.plan >= this.plans.length - 1) return this.finish();
    if (this.plan >= 0) {
      this.glitchBurst();
      whoosh();
    }
    this.teardown();
    this.plan++;
    this.planAt = performance.now();
    this.planDur = this.plans[this.plan]();
    this.at(this.planDur, () => this.advance());
  }

  private finish(): void {
    if (this.ending) return;
    this.ending = true;
    markIntroSeen();
    this.press?.cancel();
    const cam = this.cameras.main;
    cam.fadeOut(500, 0, 0, 0);
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(this.next));
  }

  private teardown(): void {
    this.planTweens.forEach((t) => t.stop());
    this.cues = [];
    this.typers = [];
    this.planTweens = [];
    this.layer.removeAll(true);
    this.trash.forEach((o) => o.destroy());
    this.trash = [];
    this.faces.clear();
    this.wave = null;
    this.grid = null;
    this.sub?.root.setVisible(false);
  }

  private at(ms: number, fn: () => void): void {
    this.cues.push({ at: ms, fn });
  }

  private tw(config: Phaser.Types.Tweens.TweenBuilderConfig): Phaser.Tweens.Tween {
    const t = this.tweens.add(config);
    this.planTweens.push(t);
    return t;
  }

  // ── habillage permanent ──────────────────────────────────────────────

  private buildChrome(): void {
    // scanlines + barre de balayage
    const scan = this.add.graphics().setDepth(60);
    scan.fillStyle(0x000000, 0.12);
    for (let y = 0; y < H; y += 3) scan.fillRect(0, y, W, 1);
    this.scanBar = this.add.rectangle(0, 0, W, 90, hex(COLORS.accent), 0.035).setOrigin(0).setDepth(60);

    // bandes cinéma (entrent en glissant)
    const top = this.add.rectangle(0, 0, W, BAR, COLORS.ink, 1).setOrigin(0).setDepth(65);
    const bottom = this.add.rectangle(0, H - BAR, W, BAR, COLORS.ink, 1).setOrigin(0).setDepth(65);
    top.y = -BAR;
    bottom.y = H;
    this.tweens.add({ targets: top, y: 0, duration: 700, ease: 'Cubic.easeOut' });
    this.tweens.add({ targets: bottom, y: H - BAR, duration: 700, ease: 'Cubic.easeOut' });
    const edges = this.add.graphics().setDepth(66);
    drawHazard(edges, 0, H - BAR, W, 4, 0.9);
    edges.fillStyle(hex(COLORS.accent), 0.7);
    edges.fillRect(0, BAR - 1.5, W, 1.5);

    this.progress = this.add.graphics().setDepth(70);
    this.add
      .text(24 + this.plans.length * 52 + 8, BAR / 2, t('intro.header'), { fontFamily: FONT, fontSize: '12px', fontStyle: '700', color: COLORS.dim })
      .setOrigin(0, 0.5)
      .setLetterSpacing(2)
      .setDepth(70);
    this.skipButton = makeButton(this, W - 20, BAR / 2, t('intro.skip'), () => this.finish(), { size: 16, align: 'right' }).setDepth(70);

    const touch = isTouch();
    this.add
      .text(W / 2, H - BAR / 2 + 2, touch ? t('intro.helpTouch') : t('intro.helpMouse'), {
        fontFamily: FONT,
        fontSize: '13px',
        fontStyle: '600',
        color: COLORS.dim,
      })
      .setOrigin(0.5)
      .setLetterSpacing(1.5)
      .setDepth(70);
    // téléphone en portrait : le jeu est en 16:9, on suggère de tourner
    this.rotateHint = this.add
      .text(W / 2, BAR + 26, t('intro.rotate'), { fontFamily: FONT, fontSize: '22px', fontStyle: '700', color: COLORS.hover, backgroundColor: '#07050fcc', padding: { x: 12, y: 6 } })
      .setOrigin(0.5)
      .setDepth(70);
  }

  private drawProgress(): void {
    const g = this.progress;
    g.clear();
    const k = Phaser.Math.Clamp(this.elapsed / this.planDur, 0, 1);
    for (let i = 0; i < this.plans.length; i++) {
      const x = 24 + i * 52;
      g.fillStyle(0xffffff, 0.14);
      g.fillRect(x, BAR / 2 - 2, 46, 4);
      const fill = i < this.plan ? 1 : i === this.plan ? k : 0;
      if (fill > 0) {
        g.fillStyle(hex(i === this.plan ? COLORS.hover : COLORS.accent), 1);
        g.fillRect(x, BAR / 2 - 2, 46 * fill, 4);
      }
    }
  }

  private buildSubtitles(): void {
    const plate = this.add.graphics();
    const name = this.add.text(0, 0, '', { fontFamily: FONT, fontSize: '15px', fontStyle: '700', color: '#07050f' }).setOrigin(0.5).setLetterSpacing(2);
    const body = this.add
      .text(0, 0, '', { fontFamily: FONT, fontSize: '28px', fontStyle: '600', color: COLORS.text, align: 'center', wordWrap: { width: 960 }, lineSpacing: 4 })
      .setOrigin(0.5)
      .setShadow(0, 2, '#000000', 6, false, true);
    const root = this.add.container(W / 2, SUB_Y, [plate, name, body]).setDepth(50).setVisible(false);
    this.sub = { root, plate, name, body };
  }

  /** Réplique sous-titrée, tapée au télétype ; le portrait du locuteur parle. */
  private say(who: Speaker, text: string, delay: number): void {
    this.at(delay, () => {
      const { root, plate, name, body } = this.sub;
      const voice = who ? VOICES[who] : null;
      this.faces.forEach((f) => f.talk(false));
      const face = who ? this.faces.get(who) : undefined;
      face?.talk(true);
      // gabarit calculé sur le texte complet : la plaque ne bouge pas pendant la frappe
      body.setText(text).setFontStyle(voice ? '600' : 'italic 500').setColor(voice ? COLORS.text : '#d8d0f0');
      const w = Math.max(body.width, 260) + 60;
      const h = body.height + 30;
      plate.clear();
      drawPanel(plate, -w / 2, -h / 2, w, h, { fill: COLORS.ink, fillAlpha: 0.78, edge: hex(voice?.color ?? COLORS.dim), edgeAlpha: 0.6, cut: 12, glow: false });
      name.setVisible(!!voice);
      if (voice) {
        name.setText(t(voice.name)).setPosition(-w / 2 + 24 + name.width / 2, -h / 2);
        plate.fillStyle(hex(voice.color), 1);
        plate.fillRect(-w / 2 + 14, -h / 2 - 11, name.width + 20, 22);
      }
      body.setText('');
      root.setVisible(true).setAlpha(0);
      this.tw({ targets: root, alpha: 1, duration: 140 });
      this.typers = this.typers.filter((ty) => ty.t !== body);
      this.typers.push({
        t: body,
        s: text,
        at: this.elapsed,
        cps: CPS,
        n: 0,
        tick: (n) => voice && n % 3 === 0 && text[n - 1] !== ' ' && blip(voice.pitch),
        done: () => this.at(this.elapsed + 250, () => face?.talk(false)),
      });
    });
  }

  // ── briques de motion design ─────────────────────────────────────────

  private text(x: number, y: number, s: string, size: number, color: string, style: Partial<Phaser.Types.GameObjects.Text.TextStyle> = {}): Phaser.GameObjects.Text {
    const t = this.add.text(x, y, s, { fontFamily: FONT, fontSize: `${size}px`, fontStyle: '600', color, ...style });
    this.layer.add(t);
    return t;
  }

  /** Grand titre Bungee dégradé, trait sombre, ombre néon. */
  private display(x: number, y: number, s: string, size: number, top: string, bottom: string, glowColor = 'rgba(255,79,154,0.55)'): Phaser.GameObjects.Text {
    const t = this.add.text(x, y, s, { fontFamily: DISPLAY, fontSize: `${size}px`, color: '#ffffff', padding: { x: 6, y: 10 } });
    const grad = t.context.createLinearGradient(0, size * 0.2, 0, t.height - size * 0.2);
    grad.addColorStop(0, top);
    grad.addColorStop(1, bottom);
    t.setFill(grad).setStroke('#07050f', Math.round(size / 10)).setShadow(0, size / 10, glowColor, size / 4, true, true);
    this.layer.add(t);
    return t;
  }

  /** Apparition glissée. */
  private reveal(o: Phaser.GameObjects.Components.Transform & Phaser.GameObjects.Components.AlphaSingle, delay: number, dx = 0, dy = 18, duration = 500): void {
    const x = o.x;
    const y = o.y;
    o.setAlpha(0);
    o.setPosition(x - dx, y + dy);
    this.tw({ targets: o, alpha: 1, x, y, delay, duration, ease: 'Cubic.easeOut' });
  }

  /** Révélation par masque (balayage gauche → droite + liseré lumineux). */
  private wipe(t: Phaser.GameObjects.Text, delay: number, duration = 700): void {
    const b = t.getBounds();
    const shape = this.make.graphics({}, false);
    this.trash.push(shape);
    t.setMask(shape.createGeometryMask());
    const edge = this.add.rectangle(b.x, b.y - 6, 4, b.height + 12, hex(COLORS.accent), 0).setOrigin(0.5, 0);
    this.layer.add(edge);
    const st = { k: 0 };
    const draw = () => {
      shape.clear().fillStyle(0xffffff).fillRect(b.x - 12, b.y - 12, (b.width + 24) * st.k, b.height + 24);
      edge.x = b.x - 12 + (b.width + 24) * st.k;
    };
    draw();
    this.tw({
      targets: st,
      k: 1,
      delay,
      duration,
      ease: 'Cubic.easeInOut',
      onStart: () => edge.setFillStyle(hex(COLORS.accent), 0.9),
      onUpdate: draw,
      onComplete: () => this.tw({ targets: edge, alpha: 0, duration: 200 }),
    });
  }

  /** Texte tapé au télétype dans un objet existant. */
  private type(t: Phaser.GameObjects.Text, s: string, delay: number, cps = 55): void {
    t.setText('');
    this.typers.push({ t, s, at: delay, cps, n: 0, tick: (n) => n % 4 === 0 && blip(1.6) });
  }

  /** Tampon administratif qui s'abat (Paranoia). */
  private stamp(x: number, y: number, s: string, color: string, angle: number, delay: number, size = 24): Phaser.GameObjects.Container {
    const t = this.add.text(0, 0, s, { fontFamily: FONT, fontSize: `${size}px`, fontStyle: '700', color, align: 'center' }).setOrigin(0.5).setLetterSpacing(2);
    const g = this.add.graphics();
    const w = t.width + 34;
    const h = t.height + 20;
    g.fillStyle(COLORS.ink, 0.55);
    g.fillRect(-w / 2, -h / 2, w, h);
    g.lineStyle(4, hex(color), 1);
    g.strokeRect(-w / 2, -h / 2, w, h);
    g.lineStyle(1.5, hex(color), 0.6);
    g.strokeRect(-w / 2 + 6, -h / 2 + 6, w - 12, h - 12);
    const c = this.add.container(x, y, [g, t]).setAngle(angle).setScale(2.6).setAlpha(0);
    this.layer.add(c);
    this.tw({
      targets: c,
      scale: 1,
      alpha: 1,
      delay,
      duration: 180,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        thud();
        this.cameras.main.shake(110, 0.004);
      },
    });
    return c;
  }

  /** Cadre de portrait (panneau biseauté + scanlines) avec planche animée. */
  private portrait(id: string, x: number, y: number, size: number, edge: string): Phaser.GameObjects.Container {
    const g = this.add.graphics();
    drawPanel(g, -size / 2 - 8, -size / 2 - 8, size + 16, size + 16, { fill: COLORS.ink, edge: hex(edge), cut: 22, brackets: true });
    const face = new SheetPortrait(this, id, 0, 0, size);
    this.faces.set(id, face);
    const lines = this.add.graphics();
    lines.fillStyle(0x07050f, 0.16);
    for (let sy = -size / 2; sy < size / 2; sy += 4) lines.fillRect(-size / 2, sy, size, 1);
    const c = this.add.container(x, y, [g, face.image, lines]);
    this.layer.add(c);
    return c;
  }

  private setTint(color: number, alpha: number, duration = 500): void {
    this.tint.setFillStyle(color, this.tint.fillAlpha);
    this.tweens.add({ targets: this.tint, fillAlpha: alpha, duration });
  }

  /** Rayons de propagande en éventail, qui tournent lentement. */
  private rays(x: number, y: number, color: number, alpha: number): void {
    const g = this.add.graphics({ x, y });
    g.fillStyle(color, alpha);
    const n = 18;
    for (let i = 0; i < n; i += 2) {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = ((i + 1) / n) * Math.PI * 2;
      g.fillTriangle(0, 0, Math.cos(a0) * 1500, Math.sin(a0) * 1500, Math.cos(a1) * 1500, Math.sin(a1) * 1500);
    }
    this.layer.add(g);
    this.tw({ targets: g, angle: 20, duration: 12000 });
  }

  /** Transition : tranches RGB décalées + secousse. */
  private glitchBurst(heavy = false): void {
    glitch();
    const g = this.add.graphics().setDepth(80);
    const colors = [hex(COLORS.accent), hex('#ff4f9a'), 0xffffff, hex(COLORS.hover)];
    for (let i = 0; i < (heavy ? 22 : 12); i++) {
      g.fillStyle(colors[i % colors.length], 0.25 + Math.random() * 0.45);
      const y = Math.random() * H;
      g.fillRect(-40 + Math.random() * 80, y, W + 80, 3 + Math.random() * (heavy ? 40 : 22));
    }
    this.cameras.main.shake(heavy ? 260 : 140, heavy ? 0.012 : 0.005);
    this.tweens.add({ targets: g, alpha: 0, duration: heavy ? 320 : 180, ease: 'Stepped', easeParams: [3], onComplete: () => g.destroy() });
  }

  private drawWave(): void {
    const w = this.wave;
    if (!w) return;
    const talking = this.faces.get('bob')?.talking ?? false;
    const g = w.g;
    g.clear();
    const n = 28;
    const bw = w.w / n;
    const t = this.time.now / 1000;
    for (let i = 0; i < n; i++) {
      const amp = talking ? (0.25 + 0.75 * Math.abs(Math.sin(t * 9 + i * 0.7) * Math.sin(t * 5.3 + i * 0.31))) * (0.6 + Math.random() * 0.4) : 0.06;
      const bh = Math.max(3, amp * w.h * 0.9);
      g.fillStyle(hex(COLORS.accent), talking ? 0.95 : 0.5);
      g.fillRect(w.x + i * bw + 2, w.y + (w.h - bh) / 2, bw - 4, bh);
    }
  }

  // ── les plans ───────────────────────────────────────────────────────

  /** 1 — Le cosmos, la station. */
  private planStation(): number {
    this.setTint(0x000000, 0, 10);
    const kicker = this.text(80, 132, '', 16, COLORS.accent, { fontStyle: '700' }).setLetterSpacing(4);
    this.type(kicker, t('intro.station.kicker'), 700);
    const title = this.display(72, 300, t('intro.station.title'), 104, '#d9fff4', '#7fffd4');
    this.wipe(title, 1700, 800);
    const sub = this.text(82, 438, t('intro.station.sub'), 22, COLORS.text, { lineSpacing: 6 });
    this.reveal(sub, 2700);
    const tag = this.text(82, 168, '', 13, COLORS.dim, { fontStyle: '600' }).setLetterSpacing(2);
    this.type(tag, t('intro.station.tag'), 1300, 70);
    this.say(null, t('intro.station.say'), 4300);
    return 8500;
  }

  /** 2 — SYLVIE, l'autorité bienveillante-menaçante. */
  private planSylvie(): number {
    this.setTint(0x06302b, 0.82);
    this.rays(380, 330, hex(COLORS.accent), 0.07);
    const p = this.portrait('sylvie', 380, 300, 280, COLORS.accent);
    p.setScale(0.6).setAlpha(0);
    this.tw({ targets: p, scale: 1, alpha: 1, duration: 450, ease: 'Back.easeOut' });
    // anneaux de « surveillance » qui pulsent
    for (let i = 0; i < 3; i++) {
      const ring = this.add.circle(380, 300, 180, 0, 0).setStrokeStyle(2, hex(COLORS.accent), 0.6);
      this.layer.addAt(ring, 1);
      this.tw({ targets: ring, scale: 1.9, alpha: 0, duration: 2400, delay: i * 800, repeat: -1 });
    }
    const name = this.display(150, 448, t('intro.sylvie.name'), 60, '#e8fffa', '#7fffd4', 'rgba(127,255,212,0.5)');
    this.reveal(name, 350, -30, 0);
    const role = this.text(156, 532, t('intro.sylvie.role'), 14, COLORS.hover, { fontStyle: '700' }).setLetterSpacing(2);
    this.reveal(role, 600, -20, 0);
    this.stamp(930, 150, t('intro.sylvie.stamp1'), COLORS.hover, -4, 1500);
    this.stamp(960, 260, t('intro.sylvie.stamp2'), COLORS.accent, 3, 3300, 30);
    this.stamp(915, 380, t('intro.sylvie.stamp3'), COLORS.danger, -2, 5300);
    this.say('sylvie', t('intro.sylvie.say1'), 500);
    this.say('sylvie', t('intro.sylvie.say2'), 4100);
    return 9000;
  }

  /** 3 — Gary, le janitor quantique, et son seau. */
  private planGary(): number {
    this.setTint(0x2a0d30, 0.8);
    // bandes diagonales chaudes en parallaxe
    for (const [speed, alpha, y] of [[9000, 0.08, 0], [6000, 0.05, 40]] as const) {
      const g = this.add.graphics({ x: 0, y });
      g.fillStyle(hex(COLORS.warm), alpha);
      for (let x = -800; x < W + 800; x += 140) g.fillPoints([new Phaser.Geom.Point(x, 0), new Phaser.Geom.Point(x + 60, 0), new Phaser.Geom.Point(x - 340, H), new Phaser.Geom.Point(x - 400, H)], true);
      this.layer.add(g);
      this.tw({ targets: g, x: 280, duration: speed, repeat: -1 });
    }
    const p = this.portrait('gary', 300, 300, 330, COLORS.warm);
    this.reveal(p, 0, 120, 0, 600);

    const cx = 560;
    const card = this.add.graphics();
    drawPanel(card, cx, 96, 660, 400, { fill: COLORS.panel, fillAlpha: 0.92, edge: hex(COLORS.warm), cut: 18, brackets: true });
    card.fillStyle(hex(COLORS.warm), 0.16);
    card.fillRect(cx + 1, 110, 658, 40);
    drawLed(card, cx + 24, 130, hex(COLORS.warm), 3.5);
    this.layer.add(card);
    this.reveal(card, 250, 0, 30);
    const head = this.text(cx + 40, 130, t('intro.gary.head'), 14, COLORS.warm, { fontStyle: '700' }).setOrigin(0, 0.5).setLetterSpacing(2);
    this.reveal(head, 400, 0, 10);
    const name = this.display(cx + 30, 158, t('intro.gary.name'), 54, '#fff6e0', '#ffd166');
    this.wipe(name, 700, 600);
    const rows: [string, string][] = [
      [t('intro.gary.badgeKey'), t('intro.gary.badge')],
      [t('intro.gary.statusKey'), t('intro.gary.status')],
      [t('intro.gary.homeKey'), t('intro.gary.home')],
      [t('intro.gary.gearKey'), t('intro.gary.gear')],
    ];
    rows.forEach(([k, v], i) => {
      const y = 258 + i * 52;
      const key = this.text(cx + 34, y, k, 13, COLORS.dim, { fontStyle: '700' }).setLetterSpacing(2);
      this.reveal(key, 1200 + i * 650, -10, 0, 250);
      const val = this.text(cx + 180, y - 4, '', 22, COLORS.text);
      this.type(val, v, 1250 + i * 650);
    });
    this.stamp(cx + 470, 262, t('intro.gary.stamp'), COLORS.danger, -9, 2000, 18);
    if (this.textures.exists(iconKey('seau'))) {
      const seau = this.add.image(cx + 590, 438, iconKey('seau')).setDisplaySize(120, 120).setAngle(-8).setScale(0);
      this.layer.add(seau);
      this.tw({ targets: seau, scale: 0.75, duration: 420, delay: 3300, ease: 'Back.easeOut', onStart: () => plouf() });
      this.tw({ targets: seau, angle: 8, duration: 900, delay: 3700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    this.say('gary', t('intro.gary.say'), 4300);
    return 9000;
  }

  /** 4 — B.O.B., écran-grille façon Bender. */
  private planBob(): number {
    this.setTint(0x0d1428, 0.86);
    if (!this.textures.exists('intro-grid')) {
      const c = this.textures.createCanvas('intro-grid', 48, 48)!;
      const ctx = c.getContext();
      ctx.strokeStyle = 'rgba(127,255,212,0.16)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, 48, 48);
      c.refresh();
    }
    this.grid = this.add.tileSprite(0, 0, W, H, 'intro-grid').setOrigin(0).setAlpha(0);
    this.layer.add(this.grid);
    this.tw({ targets: this.grid, alpha: 1, duration: 600 });

    const p = this.portrait('bob', 940, 290, 320, '#a9b8d0');
    this.reveal(p, 0, -120, 0, 600);
    const name = this.display(90, 98, t('intro.bob.name'), 88, '#eef3ff', '#a9b8d0', 'rgba(127,255,212,0.45)');
    this.wipe(name, 300, 600);
    const role = this.text(96, 226, t('intro.bob.role'), 15, COLORS.accent, { fontStyle: '700' }).setLetterSpacing(2);
    this.reveal(role, 700, -20, 0);
    const fact = this.text(96, 262, '', 20, COLORS.text, { wordWrap: { width: 560 }, lineSpacing: 4 });
    this.type(fact, t('intro.bob.fact'), 1100, 60);

    // écran-grille : l'onde de sa voix
    const sx = 96;
    const sy = 360;
    const sw = 520;
    const sh = 120;
    const screen = this.add.graphics();
    drawPanel(screen, sx - 10, sy - 10, sw + 20, sh + 20, { fill: 0x061412, edge: hex(COLORS.accent), cut: 12 });
    screen.lineStyle(1, hex(COLORS.accent), 0.15);
    for (let x = sx; x <= sx + sw; x += 20) screen.lineBetween(x, sy, x, sy + sh);
    for (let y = sy; y <= sy + sh; y += 20) screen.lineBetween(sx, y, sx + sw, y);
    const wave = this.add.graphics();
    this.layer.add([screen, wave]);
    this.reveal(screen, 900, 0, 20);
    this.wave = { g: wave, x: sx, y: sy, w: sw, h: sh };
    this.say('bob', t('intro.bob.say'), 3300);
    return 9000;
  }

  /** 5 — Le job : nettoyer AUTOUR du réacteur. Qu'est-ce qui pourrait mal tourner ? */
  private planJob(): number {
    this.hero.show(titleShot(W, H));
    this.setTint(0x07050f, 0.2, 300);
    const shade = this.add.graphics();
    shade.fillGradientStyle(COLORS.ink, COLORS.ink, COLORS.ink, COLORS.ink, 0.9, 0, 0.9, 0);
    shade.fillRect(0, 0, W * 0.62, H);
    this.layer.add(shade);

    const cx = 70;
    const card = this.add.graphics();
    drawPanel(card, cx, 90, 560, 210, { fill: COLORS.panel, fillAlpha: 0.9, cut: 16, brackets: true });
    this.layer.add(card);
    this.reveal(card, 100, 0, 20);
    const head = this.text(cx + 24, 108, t('intro.job.head'), 16, COLORS.accent, { fontStyle: '700' }).setLetterSpacing(3);
    this.reveal(head, 250, -10, 0);
    const lines = tl('intro.job.lines');
    lines.forEach((l, i) => {
      const t = this.text(cx + 24, 146 + i * 34, '', 22, i < 2 ? COLORS.text : COLORS.dim);
      this.type(t, l, 500 + i * 650);
    });
    this.stamp(360, 350, t('intro.job.stamp'), COLORS.danger, -4, 3000, 20);

    // compteur d'incidents
    const counterLabel = this.text(cx + 4, 410, t('intro.job.counter'), 13, COLORS.dim, { fontStyle: '700' }).setLetterSpacing(2);
    const digits = this.add.text(cx, 430, '98', { fontFamily: DISPLAY, fontSize: '64px', color: COLORS.hover }).setStroke('#07050f', 8);
    const record = this.text(cx + 150, 466, t('intro.job.record'), 18, COLORS.text, { fontStyle: '700' });
    this.layer.add(digits);
    for (const o of [counterLabel, digits, record]) this.reveal(o, 4100, 0, 10, 350);

    this.say('sylvie', t('intro.job.say1'), 1200);
    // … et pourtant : glitch, fissures, l'enjeu
    this.at(6200, () => {
      this.glitchBurst(true);
      plouf();
      digits.setColor(COLORS.danger);
      for (let k = 1; k <= 15; k++) {
        this.at(6200 + k * 55, () => digits.setText(k === 15 ? '00' : String(Math.floor(Math.random() * 100)).padStart(2, '0')));
      }
      const crack = this.add.graphics();
      crack.lineStyle(4, 0xffffff, 0.9);
      for (const pts of [
        [[W * 0.55, 56], [W * 0.62, 200], [W * 0.57, 330], [W * 0.66, 470], [W * 0.6, H - 56]],
        [[W * 0.62, 200], [W * 0.78, 250], [W, 230]],
        [[W * 0.57, 330], [W * 0.4, 380], [W * 0.3, 520]],
      ]) {
        crack.beginPath();
        crack.moveTo(pts[0][0], pts[0][1]);
        for (const [x, y] of pts.slice(1)) crack.lineTo(x, y);
        crack.strokePath();
      }
      this.layer.add(crack);
      const stake = this.display(W - 560, 300, t('intro.job.stake'), 46, '#ffd9e6', '#ff4f9a');
      this.tw({ targets: stake, alpha: 0.25, duration: 70, yoyo: true, repeat: 6 });
    });
    this.say('gary', t('intro.job.say2'), 7000);
    this.at(8000, () => {
      const bar = this.add.rectangle(W / 2, 250, W, 70, 0x000000, 1).setScale(0, 1);
      this.layer.add(bar);
      this.tw({ targets: bar, scaleX: 1, duration: 160, ease: 'Cubic.easeOut' });
      this.stamp(W / 2, 250, t('intro.job.spoiler'), COLORS.hover, 0, 140, 26);
    });
    return 10500;
  }

  /** 6 — Carte de chapitre. */
  private planChapter(): number {
    this.setTint(COLORS.ink, 0.93, 400);
    const hz = this.add.graphics();
    drawHazard(hz, 0, 0, W, 14, 1);
    const hz2 = this.add.graphics();
    drawHazard(hz2, 0, 0, W, 14, 1);
    hz.setPosition(-W, 150);
    hz2.setPosition(W, 520);
    this.layer.add([hz, hz2]);
    this.tw({ targets: hz, x: 0, duration: 500, ease: 'Cubic.easeOut' });
    this.tw({ targets: hz2, x: 0, duration: 500, ease: 'Cubic.easeOut' });

    const kicker = this.text(W / 2, 214, '', 22, COLORS.hover, { fontStyle: '700' }).setOrigin(0.5).setLetterSpacing(8);
    this.type(kicker, t('intro.chapter.kicker'), 400, 30);
    const title = this.display(W / 2, 330, t('intro.chapter.title'), 116, '#fff6e0', '#ffd166').setOrigin(0.5);
    this.wipe(title, 900, 800);
    const tag = this.text(W / 2, 438, t('intro.chapter.tag'), 24, COLORS.text, { fontStyle: 'italic 500' }).setOrigin(0.5);
    this.reveal(tag, 1900);
    if (this.textures.exists(iconKey('seau'))) {
      const seau = this.add.image(W / 2 + title.width / 2 + 70, 330, iconKey('seau')).setDisplaySize(110, 110).setAlpha(0).setAngle(-12);
      this.layer.add(seau);
      this.tw({ targets: seau, alpha: 1, y: 320, duration: 500, delay: 1700, ease: 'Back.easeOut' });
    }
    const foot = this.text(W / 2, 560, t('intro.chapter.foot'), 12, COLORS.dim, { fontStyle: '600' }).setOrigin(0.5).setLetterSpacing(2);
    this.reveal(foot, 2500, 0, 0);
    return 5500;
  }
}
