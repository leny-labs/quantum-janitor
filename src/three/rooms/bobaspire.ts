// Mini-cinématique 3D de la salle d'attente (ch. 1) : sur le `# aspir` du dialogue
// `st_patience`, B.O.B. aspire le ticket 9 848 d'entre les phalanges de M. Patience.
// Le ticket quitte la main du squelette, vole en cloche jusqu'à la gueule ouverte,
// y plonge en vrille (SHLUUUP), clac, B.O.B. goûte… et le recrache aux pieds de
// Gary, à peine humide. Une fois dans l'inventaire, le ticket file vers la caméra.
// Indépendant du repas du placard (bobrepas.ts) ; mêmes cues, donc mêmes sons
// côté Phaser (scenes/beats.ts → bobCue).
import * as THREE from 'three';
import type { Stage } from '../Stage';
import type { BobCue, BobParts } from './bobrepas';

export interface BobAspirParts extends BobParts {
  /** Main de M. Patience (monde) : d'où part le ticket. */
  hand: THREE.Vector3;
  /** Le ticket volant (`ticket()` de station.ts, posé à plat dans son plan XY). */
  card: THREE.Group;
  /** Largeur du ticket (son épaisseur au sol en découle). */
  cardW: number;
}

const HAS_TICKET = { items: ['ticket_9848'] };
const GRAVITY = 9;

/** Phases, en secondes depuis le `# aspir`. */
const OPEN = 0.14; // le couvercle bascule, le ticket se décolle de la main
const FLY = 0.72; // vol en cloche jusqu'au-dessus de la gueule
const SUCK = FLY + 0.22; // aspiré en vrille, étiré
const CLOSE = SUCK + 0.12; // clac
const TASTE = CLOSE + 0.34; // il goûte (corps qui ondule, yeux plissés)
const SPIT_OPEN = 0.1; // le couvercle saute
const SPIT_SHUT = 0.3;
/** Pause au sol avant que Gary ramasse le ticket (s'il est déjà dans l'inventaire). */
const GRAB_WAIT = 0.35;
const GRAB_TIME = 0.55;
const LID_OPEN = 1.35;

const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);
const easeIn = (k: number) => k * k;
const easeOutBack = (k: number) => 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2);
const clamp01 = (k: number) => THREE.MathUtils.clamp(k, 0, 1);

type Phase = 'idle' | 'suck' | 'spit' | 'ground' | 'grab';

export class BobAspirRig {
  /** Plan de l'aspiration : B.O.B. au premier plan, M. Patience au fond à gauche. */
  static readonly SHOT = 'bob_aspir';

  onCue: ((c: BobCue) => void) | null = null;

  private card: THREE.Group;
  private lid: THREE.Object3D | null;
  private eyes: THREE.Object3D[];
  private mouth: THREE.Vector3;
  private lidY: number;
  private phase: Phase = 'idle';
  private t = 0;
  private vel = new THREE.Vector3();
  private spin = new THREE.Vector3();
  private bounces = 0;
  private rest: number;
  private done: (() => void) | null = null;

  constructor(
    private stage: Stage,
    private parts: BobAspirParts,
  ) {
    const { robot, w } = parts;
    this.lid = (robot.userData.lid as THREE.Object3D | undefined) ?? null;
    this.eyes = (robot.userData.eyes as THREE.Object3D[] | undefined) ?? [];
    this.lidY = w * 0.3;
    this.mouth = new THREE.Vector3(robot.position.x, this.lidY, robot.position.z);
    this.card = parts.card;
    this.rest = parts.cardW * 0.02;
    this.card.visible = false;
    stage.add(this.card);
    stage.animate((_t, dt) => this.tick(dt));
  }

  /** Vrai pendant la séquence (le ticket est visible). */
  get busy(): boolean {
    return this.phase !== 'idle';
  }

  /**
   * Aspiration complète ; résolue quand le ticket recraché s'est posé au sol
   * (~2 s). L'envol vers l'inventaire continue ensuite tout seul.
   */
  play(): Promise<void> {
    if (this.phase !== 'idle') return Promise.resolve();
    this.phase = 'suck';
    this.t = 0;
    this.bounces = 0;
    this.card.visible = true;
    this.card.scale.setScalar(1);
    this.card.position.copy(this.parts.hand);
    this.card.rotation.set(0, 0, 0.2);
    return new Promise((resolve) => (this.done = resolve));
  }

  private tick(dt: number): void {
    dt = Math.min(dt, 0.05);
    this.parts.robot.userData.anim = this.phase === 'suck' || this.phase === 'spit';
    if (this.phase === 'idle') return;
    const prev = this.t;
    this.t += dt;
    if (this.phase === 'suck') this.stepSuck(prev);
    else if (this.phase === 'spit') this.stepSpit(prev, dt);
    else if (this.phase === 'ground') this.stepGround(dt);
    else this.stepGrab(dt);
  }

  private setLid(k: number): void {
    if (this.lid) this.lid.rotation.z = k * LID_OPEN;
  }

  private setEyes(sy: number, sx = 1): void {
    for (const e of this.eyes) e.scale.set(sx, sy, 1);
  }

  private stepSuck(prev: number): void {
    const { robot, w } = this.parts;
    const t = this.t;
    const card = this.card;
    if (prev === 0) this.onCue?.('open');
    // 1. couvercle ouvert (rebond), yeux écarquillés ; il ne quittera plus le ticket des yeux
    if (t < OPEN) {
      this.setLid(easeOutBack(t / OPEN));
      this.setEyes(1 + 0.35 * (t / OPEN));
    }
    // 2. le ticket se décolle de la main et vole en cloche, en tournoyant, jusqu'au-dessus de la gueule
    if (t < FLY) {
      const k = clamp01(t / FLY);
      // départ hésitant (il résiste aux phalanges), puis happé de plus en plus vite
      const e = k < 0.15 ? k * 0.3 : 0.045 + easeIn((k - 0.15) / 0.85) * 0.955;
      const above = this.mouth.clone().setY(this.lidY + w * 0.35);
      card.position.lerpVectors(this.parts.hand, above, e);
      const dist = this.parts.hand.distanceTo(above);
      card.position.y += Math.sin(Math.PI * e) * Math.min(0.75, dist * 0.15);
      // un frisson au décollage, puis la vrille
      const shiver = k < 0.15 ? Math.sin(t * 90) * 0.15 : 0;
      card.rotation.set(e * 5, e * 3 + shiver, 0.2 + e * 2);
      // B.O.B. se cabre vers sa proie : il s'étire d'impatience
      const lean = easeOut(k) * 0.1;
      robot.scale.set(1 - lean * 0.4, 1 + lean, 1 - lean * 0.4);
      return;
    }
    // 3. SHLUUUP : aspiré en vrille, étiré comme une nouille, le corps s'étire vers lui
    if (t < SUCK) {
      if (prev < FLY) this.onCue?.('slurp');
      const k = easeIn((t - FLY) / (SUCK - FLY));
      card.position.copy(this.mouth).setY(this.lidY + w * 0.35 * (1 - k) - k * w * 0.08);
      card.rotation.set(Math.PI / 2 * k, card.rotation.y + 0.6, 0);
      card.scale.set(1 - k * 0.85, 1 + k * 1.6, 1 - k * 0.5);
      robot.scale.set(1 - 0.04 - k * 0.04, 1.1 + k * 0.1, 1 - 0.04 - k * 0.04);
      this.setEyes(1.35 + k * 0.15, 1 - k * 0.1);
      return;
    }
    // 4. clac
    if (t < CLOSE) {
      card.visible = false;
      const k = easeIn((t - SUCK) / (CLOSE - SUCK));
      this.setLid(1 - k);
      const s = 0.2 * (1 - k);
      robot.scale.set(1 - s * 0.4, 1 + s, 1 - s * 0.4);
      this.setEyes(1.5 - 0.5 * k);
      return;
    }
    if (prev < CLOSE) {
      this.setLid(0);
      this.onCue?.('gulp');
    }
    // 5. il goûte : deux ondulations, yeux plissés, une moue dubitative
    if (t < TASTE) {
      const k = (t - CLOSE) / (TASTE - CLOSE);
      const wob = Math.sin(k * Math.PI * 2);
      robot.scale.set(1 + wob * 0.08, 1 - wob * 0.08, 1 + wob * 0.08);
      robot.rotation.z = Math.sin(k * Math.PI * 2) * 0.05;
      this.setEyes(1 - Math.sin(Math.PI * k) * 0.55, 1 + Math.sin(Math.PI * k) * 0.1);
      return;
    }
    // 6. pouah : le couvercle saute, le ticket ressort en cloche vers Gary (vers la caméra)
    robot.rotation.z = 0;
    this.phase = 'spit';
    this.t = 0;
    this.onCue?.('burst');
    const cam = this.stage.camera.position;
    const toward = new THREE.Vector3(cam.x - this.mouth.x, 0, cam.z - this.mouth.z).normalize();
    // un peu vers le centre de l'image (B.O.B. est à droite), pas trop près : au-dessus de la bulle
    const side = new THREE.Vector3(-toward.z, 0, toward.x).multiplyScalar(this.mouth.x > cam.x ? 1 : -1);
    card.visible = true;
    card.scale.setScalar(1);
    card.position.copy(this.mouth).setY(this.lidY + w * 0.05);
    card.rotation.set(-0.4, 0, 0);
    this.vel.copy(toward).multiplyScalar(w * 0.9).addScaledVector(side, w * 0.45).setY(w * 3.4);
    this.spin.set(-11, 3, 1.5);
  }

  private stepSpit(prev: number, dt: number): void {
    const { robot } = this.parts;
    const o = this.t;
    if (o < SPIT_OPEN) this.setLid(easeOut(o / SPIT_OPEN) * 1.1);
    else this.setLid(1.1 * (1 - easeIn(clamp01((o - SPIT_OPEN) / SPIT_SHUT))));
    const k = clamp01(o / 0.45);
    const st = Math.sin(Math.PI * k) * (1 - k * 0.5);
    robot.scale.set(1 - st * 0.15, 1 + st * 0.35, 1 - st * 0.15);
    this.setEyes(1.35 - 0.35 * k);
    if (prev < SPIT_OPEN + SPIT_SHUT && o >= SPIT_OPEN + SPIT_SHUT) {
      this.setLid(0);
      this.onCue?.('shut');
    }
    this.fall(dt);
    if (this.bounces >= 3 && o >= SPIT_OPEN + SPIT_SHUT) {
      robot.scale.set(1, 1, 1);
      this.setEyes(1);
      this.setLid(0);
      this.phase = 'ground';
      this.t = 0;
      const done = this.done;
      this.done = null;
      done?.();
    }
  }

  /** Chute avec rebonds ; le ticket finit à plat, recto vers le haut. */
  private fall(dt: number): void {
    if (this.bounces >= 3) return;
    const { w } = this.parts;
    const card = this.card;
    this.vel.y -= GRAVITY * dt;
    card.position.addScaledVector(this.vel, dt);
    card.rotation.x += this.spin.x * dt;
    card.rotation.y += this.spin.y * dt;
    card.rotation.z += this.spin.z * dt;
    if (card.position.y <= this.rest && this.vel.y < 0) {
      card.position.y = this.rest;
      this.bounces++;
      if (this.bounces === 1) this.onCue?.('land');
      this.vel.y *= -0.35;
      this.vel.x *= 0.25;
      this.vel.z *= 0.25;
      this.spin.multiplyScalar(0.35);
      if (this.bounces >= 3 || Math.abs(this.vel.y) < w * 0.3) {
        this.bounces = 3;
        // à plat, recto (numéro) vers le haut, légèrement de biais (Rz dans le plan du ticket, puis Rx)
        card.rotation.set(-Math.PI / 2, 0, 0.35);
      }
    }
  }

  private stepGround(dt: number): void {
    this.fall(dt);
    // le `give` Ink a déjà mis le ticket dans l'inventaire : Gary le ramasse
    if (this.t >= GRAB_WAIT && this.stage.is(HAS_TICKET)) {
      this.phase = 'grab';
      this.t = 0;
      this.onCue?.('grab');
      const { w } = this.parts;
      const cam = this.stage.camera.position;
      const toward = new THREE.Vector3().subVectors(cam, this.card.position).normalize();
      this.vel.copy(toward).multiplyScalar(w * 4).setY(w * 4.5);
    }
  }

  private stepGrab(dt: number): void {
    const card = this.card;
    this.vel.y -= GRAVITY * 0.3 * dt;
    card.position.addScaledVector(this.vel, dt);
    card.rotation.x += dt * 8;
    card.scale.setScalar(Math.max(0.01, 1 - this.t / GRAB_TIME));
    if (this.t >= GRAB_TIME) {
      card.visible = false;
      this.phase = 'idle';
    }
  }
}
