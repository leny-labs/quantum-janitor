// Mécanique 3D du Distrib'Ô-Matic 3000 : le sandwich qui nargue Gary
// (plan d'arrivée du couloir) et le mini-jeu du manche (serpillière passée
// par la trappe, coup au bon moment, chute cartoon dans le bac).
// Pur Three.js : les entrées et les sons sont gérés côté Phaser (scenes/VendingGame.ts).
import * as THREE from 'three';
import { at, cyl, glow, mat, sphere } from '../kit';
import type { Stage } from '../Stage';
import { t as tr, tl } from '../../i18n';

/** Moments du mini-jeu, pour caler les bruitages côté Phaser. */
export type VendingCue = 'jab' | 'hit' | 'miss' | 'back' | 'creak' | 'release' | 'tip' | 'land' | 'bounce';

/** Issue d'un coup de manche, décidée côté Phaser (fenêtre, pitié). */
export type VendingStrike = 'hit' | 'miss' | 'back';

export interface VendingParts {
  /** Corps du distributeur (repère local : pied au sol, façade en z = depth / 2). */
  vend: THREE.Group;
  sandwich: THREE.Group;
  /** Largeur du sandwich (échelle des petits déplacements). */
  size: number;
  /** Bandeau LED du mini-jeu (repère de `vend`) : centre et taille. */
  ticker: { x: number; y: number; z: number; w: number; h: number };
  /** Hauteur du fond du bac de sortie (repère de `vend`), et sa profondeur. */
  binY: number;
  binZ: number;
  /** Spirale du sandwich (repère de `vend`) : axe (x, y), rayon, du fond z0 à l'avant z1. */
  coil: { x: number; y: number; r: number; z0: number; z1: number };
}

/**
 * Les crans de la spirale : un coup réussi par cran. Chaque cran balance plus
 * vite, avec une zone de frappe plus étroite (part de la période où
 * sin > window) et, sur la fin, un rythme qui flotte.
 */
const PHASES = [
  { period: 1.5, window: 0.72, wobble: 0 }, // ≈ 24 % · 0,37 s
  { period: 1.25, window: 0.8, wobble: 0.1 }, // ≈ 20 % · 0,26 s
  { period: 1.05, window: 0.86, wobble: 0.22 }, // ≈ 17 % · 0,18 s
];
const GRAVITY = 9;
/** Tours de fil de la spirale, du fond à l'avant (un tour = un sandwich d'avance). */
const TURNS = 3.5;
/** Durée d'un coup de manche (recul, frappe, appui, retrait), et instant du contact. */
const JAB = 0.36;
const CONTACT = 0.45;
/** Axe du manche, de la pointe vers Gary (vers le bas, un peu vers la caméra). */
const AXIS = new THREE.Vector3(-0.36, -1, 0.17).normalize();
const X_AXIS = new THREE.Vector3(1, 0, 0);

/** Ressort amorti (vacillement du sandwich, roulis de la machine). */
class Spring {
  v = 0;
  vel = 0;
  constructor(
    private k: number,
    private c: number,
  ) {}
  kick(i: number): void {
    this.vel += i;
  }
  step(dt: number): void {
    this.vel += (-this.k * this.v - this.c * this.vel) * dt;
    this.v += this.vel * dt;
  }
}

/** Hélice de la spirale : axe z, centrée sur (0, 0). */
class Helix extends THREE.Curve<THREE.Vector3> {
  constructor(
    private r: number,
    private z0: number,
    private z1: number,
  ) {
    super();
  }
  override getPoint(t: number, target = new THREE.Vector3()): THREE.Vector3 {
    const a = t * TURNS * Math.PI * 2;
    return target.set(Math.sin(a) * this.r, -Math.cos(a) * this.r, this.z0 + (this.z1 - this.z0) * t);
  }
}

interface Fall {
  /** grind : dernier cran · tip : bascule par-dessus le fil · drop : chute · settle : à plat dans le bac. */
  stage: 'grind' | 'tip' | 'drop' | 'settle';
  t: number;
  /** Bascule : appui sous le sandwich, centre relatif à l'appui, inclinaison de départ. */
  pivot: THREE.Vector3;
  off: THREE.Vector3;
  rx: number;
  ang: number;
  spin: number;
  vel: THREE.Vector3;
  bounces: number;
  squash: number;
  done: () => void;
}

const smooth = (u: number) => u * u * (3 - 2 * u);

export class VendingRig {
  /** Plan de la scène pendant lequel le sandwich se fait remarquer. */
  static readonly TEASE_SHOT = 'teaser';
  /** Plan du mini-jeu. */
  static readonly GAME_SHOT = 'vitrine';
  /** Coups réussis nécessaires. */
  readonly steps = PHASES.length;

  /** Rappel des moments forts (bruitages). */
  onCue: ((c: VendingCue) => void) | null = null;

  private base: { pos: THREE.Vector3; rot: THREE.Euler; vendX: number };
  private mop = new THREE.Group();
  private tip: THREE.Vector3;
  private coil = new THREE.Group();
  /** Avance d'un sandwich par tour de spirale (pas de l'hélice). */
  private pitch: number;
  private glint: THREE.Sprite;
  private spark: THREE.Sprite;
  private tickerMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private canvas = document.createElement('canvas');
  private texture: THREE.CanvasTexture;

  private tease = 0;
  private playing = false;
  /** Dose de jeu (0 → 1 à l'entrée, retombe à l'abandon) : amplitude, manche, bandeau. */
  private amount = 0;
  /** Amplitude du balancement (retombe quand le jeu s'arrête). */
  private sway = 0;
  private phase = 0;
  /** Crans gagnés (cible) et position affichée de la spirale, en crans. */
  private notch = 0;
  private shown = 0;
  private turn: { from: number; to: number; t: number; dur: number } | null = null;
  private thrust = -1;
  private thrustHit: (() => void) | null = null;
  private shake = 0;
  private wob = new Spring(170, 5);
  private rock = new Spring(240, 7);
  private fall: Fall | null = null;
  private message = '';
  private alert = false;
  private flash = 0;
  private lastGauge = -1;

  constructor(
    private stage: Stage,
    private parts: VendingParts,
  ) {
    const { sandwich, size, vend, ticker, coil } = parts;
    this.base = { pos: sandwich.position.clone(), rot: sandwich.rotation.clone(), vendX: vend.position.x };

    // spirale : fil d'acier en hélice, moyeu au fond, embout rouge à l'avant (on le voit tourner)
    const wire = coil.r * 0.09;
    const helix = new THREE.Mesh(new THREE.TubeGeometry(new Helix(coil.r, coil.z0, coil.z1), 180, wire, 6), mat('#c9ced6'));
    const hub = cyl(coil.r * 0.3, coil.r * 0.3, wire * 4, '#6b707d', { seg: 10, edges: false });
    hub.rotation.x = Math.PI / 2;
    hub.position.z = coil.z0;
    const end = new Helix(coil.r, coil.z0, coil.z1).getPoint(1);
    this.coil.add(helix, hub, at(sphere(wire * 2.2, '#ff5c7a', { seg: 8 }), end.x, end.y, end.z));
    this.coil.position.set(coil.x, coil.y, 0);
    vend.add(this.coil);
    this.pitch = (coil.z1 - coil.z0) / TURNS;

    // manche de Josiane : bois, bague de scotch teal, franges grises tout au bout (hors champ)
    const len = 2.6;
    const r = size * 0.075;
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), AXIS);
    const handle = cyl(r, r, len, '#d6a25a', { seg: 10 });
    handle.quaternion.copy(q);
    handle.position.copy(AXIS).multiplyScalar(len / 2);
    const tape = cyl(r * 1.15, r * 1.15, size * 0.18, '#2fbfa0', { seg: 10, edges: false });
    tape.quaternion.copy(q);
    tape.position.copy(AXIS).multiplyScalar(size * 0.9);
    const cap = sphere(r * 1.1, '#8a5a2b', { seg: 10 });
    const head = new THREE.Group();
    for (let i = 0; i < 7; i++) head.add(at(sphere(size * 0.22, i % 2 ? '#bfc6c9' : '#9aa3a8', { seg: 8 }), (i - 3) * size * 0.08, 0, Math.sin(i) * size * 0.06));
    head.position.copy(AXIS).multiplyScalar(len);
    this.mop.add(handle, tape, cap, head);
    this.mop.visible = false;
    this.tip = new THREE.Vector3(this.base.pos.x + size * 0.18, this.base.pos.y - size * 0.42, this.base.pos.z + 0.02);
    vend.add(this.mop);

    // éclat au point d'impact du manche
    this.spark = glow('#fff6c8', size * 0.7, 0);
    vend.add(this.spark);

    // reflet qui court sur l'emballage (fenêtre de frappe, plan d'arrivée)
    this.glint = glow('#fff6c8', size * 0.9, 0);
    this.glint.position.set(size * 0.35, size * 0.3, size * 0.4);
    sandwich.add(this.glint);

    // bandeau LED (posé devant l'étiquette, invisible hors mini-jeu)
    this.canvas.width = 1024;
    this.canvas.height = Math.round((1024 * ticker.h) / ticker.w);
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 8;
    this.tickerMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(ticker.w, ticker.h),
      new THREE.MeshBasicMaterial({ map: this.texture, transparent: true, opacity: 0, toneMapped: false, fog: false }),
    );
    this.tickerMesh.position.set(ticker.x, ticker.y, ticker.z);
    this.tickerMesh.visible = false;
    vend.add(this.tickerMesh);

    stage.animate((time, dt) => this.tick(time, Math.min(dt, 1 / 30)));
  }

  /** Crans déjà gagnés. */
  get progress(): number {
    return this.notch;
  }

  private get pace() {
    return PHASES[Math.min(this.notch, PHASES.length - 1)];
  }

  /** Vrai si le sandwich est en bout de balancement (coup gagnant). */
  get inWindow(): boolean {
    return this.playing && Math.sin(this.phase) > this.pace.window;
  }

  /** Le manche entre par la trappe, le sandwich se met à vaciller. */
  start(): void {
    this.reset();
    this.playing = true;
    this.phase = -Math.PI / 2;
    this.notch = 0;
    this.shown = 0;
    this.turn = null;
    this.message = tr('props.couloir.lcdStart');
    this.alert = false;
    this.flash = 0;
    this.mop.visible = true;
    this.tickerMesh.visible = true;
  }

  /** Abandon : le manche ressort, la spirale se revisse, le sandwich se recale. */
  stop(): void {
    if (this.fall) this.reset();
    this.playing = false;
    this.thrust = -1;
    this.thrustHit = null;
    this.notch = 0;
    this.turnTo(0, 0.6);
  }

  /**
   * Coup de manche. `miss` : la machine tremble, le sandwich vacille et le
   * bandeau facture le `bill`-ième raté. `back` : pareil, et la spirale se
   * revisse d'un cran. `hit` : la spirale force d'un cran ; au dernier, le
   * sandwich bascule et tombe, la promesse se résout quand il est posé dans le bac.
   */
  strike(kind: VendingStrike, bill: number): Promise<void> {
    this.thrust = 0;
    this.onCue?.('jab');
    return new Promise((resolve) => {
      this.thrustHit = () => {
        this.spark.position.copy(this.mop.position);
        this.spark.material.opacity = 1;
        this.flash = 1;
        if (kind !== 'hit') {
          this.shake = 0.35;
          this.wob.kick((Math.random() < 0.5 ? -1 : 1) * 3.2);
          this.rock.kick(0.16);
          const bills = tl('props.couloir.lcdMiss');
          this.message = bills[Math.min(bill, bills.length) - 1];
          this.alert = true;
          this.onCue?.('miss');
          if (kind === 'back' && this.notch > 0) {
            this.notch--;
            this.turnTo(this.notch, 0.55);
            this.message = tr('props.couloir.lcdBack');
            this.onCue?.('back');
            setTimeout(resolve, 650);
          } else setTimeout(resolve, 400);
          return;
        }
        this.notch++;
        this.wob.kick(2.2);
        this.rock.kick(0.09);
        this.alert = false;
        this.onCue?.('hit');
        this.onCue?.('creak');
        if (this.notch < this.steps) {
          this.message = tl('props.couloir.lcdNotch')[this.notch - 1];
          this.turnTo(this.notch, 0.5);
          setTimeout(resolve, 600);
          return;
        }
        // dernier cran : la spirale lâche, la suite est physique
        this.playing = false;
        this.message = tr('props.couloir.lcdWin');
        this.onCue?.('release');
        this.turnTo(this.notch, 0.75);
        const v = () => new THREE.Vector3();
        this.fall = { stage: 'grind', t: 0, pivot: v(), off: v(), rx: 0, ang: 0, spin: 0, vel: v(), bounces: 0, squash: 0, done: resolve };
      };
    });
  }

  private turnTo(to: number, dur: number): void {
    this.turn = { from: this.shown, to, t: 0, dur };
  }

  private reset(): void {
    const { sandwich } = this.parts;
    this.fall = null;
    sandwich.position.copy(this.base.pos);
    sandwich.rotation.copy(this.base.rot);
    sandwich.scale.set(1, 1, 1);
  }

  private tick(time: number, dt: number): void {
    const { sandwich, size, vend } = this.parts;
    if (!sandwich.visible && !this.mop.visible) return;
    const teasing = this.stage.examining === VendingRig.TEASE_SHOT;
    this.tease += ((teasing ? 1 : 0) - this.tease) * Math.min(1, dt * 3);
    this.amount += ((this.playing || this.fall ? 1 : 0) - this.amount) * Math.min(1, dt * (this.playing ? 5 : 3));
    this.sway += ((this.playing ? 1 : 0) - this.sway) * Math.min(1, dt * (this.playing ? 5 : 2.5));
    if (this.playing) {
      const p = this.pace;
      this.phase += ((2 * Math.PI) / p.period) * (1 + p.wobble * Math.sin(time * 2.3)) * dt;
    }
    this.wob.step(dt);
    this.rock.step(dt);

    // ── spirale : force cran par cran, avec un à-coup (le fil résiste puis cède) ──
    if (this.turn) {
      const tw = this.turn;
      tw.t = Math.min(1, tw.t + dt / tw.dur);
      const u = tw.t;
      const stick = u < 0.3 ? 0.06 * Math.sin((u / 0.3) * Math.PI) : 0;
      this.shown = tw.from + (tw.to - tw.from) * (smooth(u) + stick * (1 - u)) + Math.sin(u * Math.PI * 7) * 0.025 * (1 - u) * Math.sign(tw.to - tw.from);
      if (u >= 1) {
        this.shown = tw.to;
        this.turn = null;
      }
    }
    this.coil.rotation.z = -(this.shown / this.steps) * Math.PI * 2;
    const k = this.shown / this.steps;

    // ── sandwich : narguer, vaciller, avancer sur la spirale, tomber ──
    if (this.fall && this.fall.stage !== 'grind') this.stepFall(dt);
    else {
      const s = Math.sin(this.phase) * this.sway;
      const idle = Math.sin(time * 2.3) * 0.05 * this.tease;
      const lean = 1 + 0.35 * k;
      sandwich.rotation.z = this.base.rot.z + idle + s * 0.26 * lean * this.amount + this.wob.v;
      sandwich.rotation.x = this.base.rot.x + (Math.max(0, s) * 0.12 + k * 0.24) * this.amount + this.wob.v * 0.35;
      sandwich.position.x = this.base.pos.x + s * size * 0.08 * this.amount;
      sandwich.position.y = this.base.pos.y + Math.abs(Math.cos(this.phase)) * size * 0.03 * this.sway - k * size * 0.06;
      sandwich.position.z = this.base.pos.z + k * this.pitch;
      if (this.fall && !this.turn) this.beginTip();
    }
    const p = this.pace;
    const window = this.playing ? THREE.MathUtils.clamp((Math.sin(this.phase) - p.window) / (1 - p.window), 0, 1) : 0;
    const shine = this.tease * (0.35 + 0.35 * Math.max(0, Math.sin(time * 3.1))) + window;
    this.glint.material.opacity = Math.min(0.95, shine);
    this.glint.material.rotation = time * 0.8;
    this.glint.scale.setScalar(size * (0.7 + 0.5 * shine));

    // ── manche : entrée par la trappe ; coup = recul, frappe sèche, appui, retrait ──
    let jab = 0;
    if (this.thrust >= 0) {
      const u = (this.thrust += dt / JAB);
      if (u < 0.3) jab = -0.3 * smooth(u / 0.3);
      else if (u < CONTACT) jab = -0.3 + 1.3 * ((u - 0.3) / (CONTACT - 0.3)) ** 2;
      else if (u < 0.6) jab = 1 - 0.12 * Math.sin(((u - CONTACT) / (0.6 - CONTACT)) * Math.PI);
      else jab = 1 - smooth(Math.min(1, (u - 0.6) / 0.4));
      if (u >= CONTACT && this.thrustHit) {
        const f = this.thrustHit;
        this.thrustHit = null;
        f();
      }
      if (u >= 1) this.thrust = -1;
    }
    const out = 1 - this.amount;
    this.mop.position.copy(this.tip).addScaledVector(AXIS, out * 1.4 - jab * size * 0.42);
    this.mop.position.z += k * this.pitch;
    this.mop.visible = this.amount > 0.02;
    this.spark.material.opacity = Math.max(0, this.spark.material.opacity - dt * 6);
    this.spark.scale.setScalar(size * (0.4 + (1 - this.spark.material.opacity) * 0.8));

    // ── machine : cliquetis sur un raté, roulis depuis le pied (coups, chute) ──
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt);
    vend.position.x = this.base.vendX + Math.sin(time * 70) * size * 0.06 * (this.shake / 0.35);
    vend.rotation.z = Math.sin(time * 55) * 0.012 * (this.shake / 0.35) + this.rock.v;

    // ── bandeau LED ──
    this.flash = Math.max(0, this.flash - dt * 1.5);
    this.tickerMesh.material.opacity = this.amount;
    this.tickerMesh.visible = this.amount > 0.02;
    if (this.tickerMesh.visible) this.drawTicker(time);
  }

  /** Dernier cran passé : le sandwich bascule en avant sur le dernier tour de fil. */
  private beginTip(): void {
    const f = this.fall!;
    const { sandwich, size } = this.parts;
    // appui : sous le ventre du sandwich, un peu en arrière de son centre
    f.pivot.set(0, -size * 0.21, -size * 0.12).applyEuler(sandwich.rotation).add(sandwich.position);
    f.off.copy(sandwich.position).sub(f.pivot);
    f.rx = sandwich.rotation.x;
    f.ang = 0;
    f.spin = 0.6;
    f.stage = 'tip';
    this.onCue?.('tip');
  }

  private stepFall(dt: number): void {
    const f = this.fall!;
    const { sandwich, size, binY, binZ } = this.parts;
    const rest = binY + size * 0.24;
    f.t += dt;
    if (f.stage === 'tip') {
      // pivot autour du fil : le poids, en avant de l'appui, accélère la bascule
      f.spin += 26 * Math.sin(f.ang + 0.5) * dt;
      f.ang += f.spin * dt;
      const prev = sandwich.position.clone();
      sandwich.position.copy(f.off).applyAxisAngle(X_AXIS, f.ang).add(f.pivot);
      sandwich.rotation.x = f.rx + f.ang;
      sandwich.rotation.z += (this.base.rot.z * 0.5 - sandwich.rotation.z) * Math.min(1, dt * 3);
      if (f.ang > 1.0) {
        // décroché : il part avec sa vitesse de bascule
        f.vel.copy(sandwich.position).sub(prev).divideScalar(Math.max(dt, 1e-3));
        f.vel.x += size * 0.5;
        f.stage = 'drop';
      }
    } else if (f.stage === 'drop') {
      f.vel.y -= GRAVITY * dt;
      sandwich.position.addScaledVector(f.vel, dt);
      sandwich.position.z += (binZ - sandwich.position.z) * Math.min(1, dt * 4);
      sandwich.rotation.x += f.spin * dt;
      sandwich.rotation.z += (0 - sandwich.rotation.z) * Math.min(1, dt * 1.5);
      // après le premier choc, il cherche à se poser à plat
      if (f.bounces > 0) sandwich.rotation.x += (Math.round(sandwich.rotation.x / Math.PI) * Math.PI - sandwich.rotation.x) * Math.min(1, dt * 7);
      if (sandwich.position.y <= rest && f.vel.y < 0) {
        sandwich.position.y = rest;
        f.squash = 1;
        f.bounces++;
        this.onCue?.(f.bounces === 1 ? 'land' : 'bounce');
        this.rock.kick(f.bounces === 1 ? 0.28 : 0.08);
        f.vel.y = -f.vel.y * (f.bounces === 1 ? 0.3 : 0.2);
        f.vel.x *= 0.35;
        f.spin *= -0.25;
        if (f.bounces >= 2 || f.vel.y < size * 1.0) {
          f.vel.set(0, 0, 0);
          f.stage = 'settle';
          f.t = 0;
        }
      }
    } else {
      // posé : on remet à plat, l'écrasement se résorbe
      sandwich.position.y = rest;
      sandwich.rotation.z += (Math.round(sandwich.rotation.z / Math.PI) * Math.PI - sandwich.rotation.z) * Math.min(1, dt * 10);
      sandwich.rotation.x += (Math.round(sandwich.rotation.x / Math.PI) * Math.PI - sandwich.rotation.x) * Math.min(1, dt * 10);
    }
    // squash & stretch : écrasé à l'impact, étiré en chute
    f.squash = Math.max(0, f.squash - dt * 4);
    const stretch = f.stage === 'drop' ? THREE.MathUtils.clamp(-f.vel.y / (size * 30), 0, 0.12) : 0;
    const sy = 1 - 0.34 * Math.sin(Math.PI * f.squash) + stretch;
    const sxz = 1 / Math.sqrt(Math.max(0.4, sy));
    sandwich.scale.set(sxz, sy, sxz);
    if (f.stage === 'settle' && f.t > 0.55) {
      this.fall = null;
      sandwich.scale.set(1, 1, 1);
      f.done();
    }
  }

  /** Bandeau : message en haut ; jauge du balancement (zone verte = bout de course) et crans de la spirale en bas. */
  private drawTicker(time: number): void {
    const gauge = (Math.sin(this.phase) + 1) / 2;
    const key = Math.round(gauge * 200) + Math.round(this.flash * 20) * 1000 + Math.round(this.shown * 20) * 30000 + Math.round(time * 2) * 1e7;
    if (key === this.lastGauge) return;
    this.lastGauge = key;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const g = this.canvas.getContext('2d')!;
    g.fillStyle = '#050b0a';
    g.fillRect(0, 0, W, H);
    // trame de LED
    g.fillStyle = '#0d1b18';
    for (let y = 3; y < H; y += 6) g.fillRect(0, y, W, 2);
    const pad = H * 0.08;
    // message (clignote rouge sur un raté)
    const red = this.alert && this.flash > 0 && Math.sin(time * 30) > -0.3;
    g.font = `700 ${H * 0.36}px "Chakra Petch", "Courier New", monospace`;
    let size = H * 0.36;
    // décalé à droite : le manche passe devant la moitié gauche du bandeau
    const maxW = W * 0.78 - pad * 2;
    const tw = g.measureText(this.message).width;
    if (tw > maxW) size *= maxW / tw;
    g.font = `700 ${size}px "Chakra Petch", "Courier New", monospace`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.shadowColor = red ? '#ff3355' : '#7fffd4';
    g.shadowBlur = H * 0.08;
    g.fillStyle = red ? '#ff5c7a' : '#bfffee';
    g.fillText(this.message, W * 0.6, H * 0.3);
    g.shadowBlur = 0;
    // jauge (zone verte plus étroite à chaque cran)
    const gx = pad * 2;
    const gy = H * 0.62;
    const gh = H * 0.2;
    const pipW = gh * 1.1;
    const gw = W - pad * 4 - this.steps * (pipW + pad) - pad;
    g.fillStyle = '#14302a';
    g.fillRect(gx, gy, gw, gh);
    const zone = (this.pace.window + 1) / 2;
    const live = this.playing && gauge >= zone;
    g.fillStyle = live ? '#7dff6a' : '#2f8f3a';
    g.fillRect(gx + gw * zone, gy, gw * (1 - zone), gh);
    g.strokeStyle = '#7fffd4';
    g.lineWidth = H * 0.025;
    g.strokeRect(gx, gy, gw, gh);
    // curseur
    const cx = gx + gw * gauge;
    g.fillStyle = live ? '#ffffff' : '#ffd166';
    g.beginPath();
    g.moveTo(cx, gy - H * 0.02);
    g.lineTo(cx - H * 0.07, gy - H * 0.13);
    g.lineTo(cx + H * 0.07, gy - H * 0.13);
    g.closePath();
    g.fill();
    g.fillRect(cx - H * 0.015, gy, H * 0.03, gh);
    // crans de la spirale : se remplissent pendant qu'elle tourne
    for (let i = 0; i < this.steps; i++) {
      const px = gx + gw + pad * 2 + i * (pipW + pad);
      const fill = THREE.MathUtils.clamp(this.shown - i, 0, 1);
      g.fillStyle = '#14302a';
      g.fillRect(px, gy, pipW, gh);
      g.fillStyle = '#ffd166';
      g.fillRect(px, gy + gh * (1 - fill), pipW, gh * fill);
      g.strokeStyle = '#7fffd4';
      g.strokeRect(px, gy, pipW, gh);
    }
    this.texture.needsUpdate = true;
  }
}
