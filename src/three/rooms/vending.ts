// Mécanique 3D du Distrib'Ô-Matic 3000 : le sandwich qui nargue Gary
// (plan d'arrivée du couloir) et le mini-jeu du manche (serpillière passée
// par la trappe, coup au bon moment, chute cartoon dans le bac).
// Pur Three.js : les entrées et les sons sont gérés côté Phaser (scenes/VendingGame.ts).
import * as THREE from 'three';
import { at, cyl, glow, sphere } from '../kit';
import type { Stage } from '../Stage';
import { t as tr, tl } from '../../i18n';

/** Moments du mini-jeu, pour caler les bruitages côté Phaser. */
export type VendingCue = 'jab' | 'miss' | 'release' | 'bounce' | 'land';

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
}

/** Pulsation du balancement (rad/s) : une période ≈ 1,45 s. */
const SWING = (2 * Math.PI) / 1.45;
/** Fenêtre de frappe : bout du balancement (sin > seuil), ≈ 23 % de la période. */
const WINDOW = 0.72;
const GRAVITY = 9;
/** Axe du manche, de la pointe vers Gary (vers le bas, un peu vers la caméra). */
const AXIS = new THREE.Vector3(-0.36, -1, 0.17).normalize();

interface Fall {
  vel: THREE.Vector3;
  spin: number;
  bounces: number;
  settle: number;
  squash: number;
  done: () => void;
}

export class VendingRig {
  /** Plan de la scène pendant lequel le sandwich se fait remarquer. */
  static readonly TEASE_SHOT = 'teaser';
  /** Plan du mini-jeu. */
  static readonly GAME_SHOT = 'vitrine';

  /** Rappel des moments forts (bruitages). */
  onCue: ((c: VendingCue) => void) | null = null;

  private base: { pos: THREE.Vector3; rot: THREE.Euler; vendX: number };
  private mop = new THREE.Group();
  private tip: THREE.Vector3;
  private glint: THREE.Sprite;
  private tickerMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private canvas = document.createElement('canvas');
  private texture: THREE.CanvasTexture;

  private tease = 0;
  private playing = false;
  /** Dose de jeu (0 → 1 à l'entrée, retombe à l'abandon) : amplitude, manche, bandeau. */
  private amount = 0;
  private phase = 0;
  private thrust = -1;
  private thrustHit: (() => void) | null = null;
  private shake = 0;
  private fall: Fall | null = null;
  private message = '';
  private flash = 0;
  private lastGauge = -1;

  constructor(
    private stage: Stage,
    private parts: VendingParts,
  ) {
    const { sandwich, size, vend, ticker } = parts;
    this.base = { pos: sandwich.position.clone(), rot: sandwich.rotation.clone(), vendX: vend.position.x };

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

    stage.animate((time, dt) => this.tick(time, dt));
  }

  /** Vrai si le sandwich est en bout de balancement (coup gagnant). */
  get inWindow(): boolean {
    return this.playing && Math.sin(this.phase) > WINDOW;
  }

  /** Le manche entre par la trappe, le sandwich se met à vaciller. */
  start(): void {
    this.reset();
    this.playing = true;
    this.phase = -Math.PI / 2;
    this.message = tr('props.couloir.lcdStart');
    this.flash = 0;
    this.mop.visible = true;
    this.tickerMesh.visible = true;
  }

  /** Abandon : le manche ressort, le sandwich se recale sur sa spirale. */
  stop(): void {
    if (this.fall) this.reset();
    this.playing = false;
    this.thrust = -1;
    this.thrustHit = null;
  }

  /**
   * Coup de manche. Raté (`hit` faux) : la machine tremble et facture le
   * `miss`-ième coup. Gagné : le sandwich bascule et tombe ; la promesse se
   * résout quand il est posé dans le bac.
   */
  strike(hit: boolean, miss: number): Promise<void> {
    this.thrust = 0;
    this.onCue?.('jab');
    return new Promise((resolve) => {
      this.thrustHit = () => {
        if (!hit) {
          this.shake = 0.35;
          const bills = tl('props.couloir.lcdMiss');
          this.message = bills[Math.min(miss, bills.length) - 1];
          this.flash = 1;
          this.onCue?.('miss');
          setTimeout(resolve, 380);
          return;
        }
        this.playing = false;
        this.message = tr('props.couloir.lcdWin');
        this.flash = 1;
        this.onCue?.('release');
        const s = this.parts.size;
        this.fall = { vel: new THREE.Vector3(s * 1.6, s * 4.5, s * 0.6), spin: -7, bounces: 0, settle: 0, squash: 0, done: resolve };
      };
    });
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
    if (this.playing) this.phase += SWING * dt;

    // ── sandwich : narguer, vaciller, tomber ──
    if (this.fall) this.stepFall(dt);
    else {
      const s = Math.sin(this.phase);
      const idle = Math.sin(time * 2.3) * 0.05 * this.tease;
      sandwich.rotation.z = this.base.rot.z + idle + s * 0.26 * this.amount;
      sandwich.rotation.x = this.base.rot.x + Math.max(0, s) * 0.12 * this.amount;
      sandwich.position.x = this.base.pos.x + s * size * 0.08 * this.amount;
      sandwich.position.y = this.base.pos.y + Math.abs(Math.cos(this.phase)) * size * 0.03 * this.amount;
    }
    const window = this.playing ? THREE.MathUtils.clamp((Math.sin(this.phase) - WINDOW) / (1 - WINDOW), 0, 1) : 0;
    const shine = this.tease * (0.35 + 0.35 * Math.max(0, Math.sin(time * 3.1))) + window;
    this.glint.material.opacity = Math.min(0.95, shine);
    this.glint.material.rotation = time * 0.8;
    this.glint.scale.setScalar(size * (0.7 + 0.5 * shine));

    // ── manche : entrée par la trappe, coup, sortie ──
    let jab = 0;
    if (this.thrust >= 0) {
      this.thrust += dt / 0.22;
      jab = Math.sin(Math.PI * Math.min(1, this.thrust));
      if (this.thrust >= 0.5 && this.thrustHit) {
        const f = this.thrustHit;
        this.thrustHit = null;
        f();
      }
      if (this.thrust >= 1) this.thrust = -1;
    }
    const out = 1 - this.amount;
    this.mop.position.copy(this.tip).addScaledVector(AXIS, out * 1.4 - jab * size * 0.55);
    this.mop.visible = this.amount > 0.02;

    // ── machine : secousse sur un raté ──
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt);
    vend.position.x = this.base.vendX + Math.sin(time * 70) * size * 0.06 * (this.shake / 0.35);
    vend.rotation.z = Math.sin(time * 55) * 0.012 * (this.shake / 0.35);

    // ── bandeau LED ──
    this.flash = Math.max(0, this.flash - dt * 1.5);
    this.tickerMesh.material.opacity = this.amount;
    this.tickerMesh.visible = this.amount > 0.02;
    if (this.tickerMesh.visible) this.drawTicker(time);
  }

  private stepFall(dt: number): void {
    const f = this.fall!;
    const { sandwich, size, binY, binZ } = this.parts;
    const rest = binY + size * 0.24;
    if (f.settle > 0) {
      // posé : on remet à plat, l'écrasement se résorbe
      f.settle += dt;
      sandwich.rotation.z += (Math.round(sandwich.rotation.z / Math.PI) * Math.PI - sandwich.rotation.z) * Math.min(1, dt * 10);
      sandwich.rotation.x += -sandwich.rotation.x * Math.min(1, dt * 10);
    } else {
      f.vel.y -= GRAVITY * dt;
      sandwich.position.addScaledVector(f.vel, dt);
      sandwich.position.z += (binZ - sandwich.position.z) * Math.min(1, dt * 4);
      sandwich.rotation.z += f.spin * dt;
      sandwich.rotation.x += f.spin * 0.3 * dt;
      if (sandwich.position.y <= rest && f.vel.y < 0) {
        sandwich.position.y = rest;
        f.squash = 1;
        f.bounces++;
        f.vel.y = -f.vel.y * 0.34;
        f.vel.x *= 0.4;
        f.spin *= -0.35;
        this.onCue?.(f.bounces === 1 ? 'land' : 'bounce');
        if (f.bounces >= 2 || f.vel.y < size * 1.2) {
          f.vel.set(0, 0, 0);
          f.settle = 1e-3;
        }
      }
    }
    // squash & stretch : écrasé à l'impact, étiré en chute
    f.squash = Math.max(0, f.squash - dt * 4);
    const stretch = f.settle > 0 ? 0 : THREE.MathUtils.clamp(-f.vel.y / (size * 30), 0, 0.12);
    const sy = 1 - 0.38 * Math.sin(Math.PI * f.squash) + stretch;
    const sxz = 1 / Math.sqrt(Math.max(0.4, sy));
    sandwich.scale.set(sxz, sy, sxz);
    if (f.settle > 0.45) {
      this.fall = null;
      sandwich.scale.set(1, 1, 1);
      f.done();
    }
  }

  /** Bandeau : message en haut, jauge du balancement (zone verte = bout de course) en bas. */
  private drawTicker(time: number): void {
    const gauge = (Math.sin(this.phase) + 1) / 2;
    const key = Math.round(gauge * 200) + Math.round(this.flash * 20) * 1000 + Math.round(time * 2) * 1e5;
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
    const red = this.flash > 0 && Math.sin(time * 30) > -0.3 && this.message !== tr('props.couloir.lcdWin');
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
    // jauge
    const gx = pad * 2;
    const gw = W - pad * 4;
    const gy = H * 0.62;
    const gh = H * 0.2;
    g.fillStyle = '#14302a';
    g.fillRect(gx, gy, gw, gh);
    const zone = (WINDOW + 1) / 2;
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
    this.texture.needsUpdate = true;
  }
}
