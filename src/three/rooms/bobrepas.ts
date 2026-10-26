// Mécanique 3D du repas de B.O.B. (placard) : le couvercle s'ouvre, le
// sandwich y plonge, clac, B.O.B. mâchouille (corps déformé, yeux, antenne) ;
// puis — sur le `# shake` du dialogue — tremblote, le couvercle saute et il
// recrache tout (poussière, chaussette, boulons, badge gluant). Le badge
// file vers Gary quand il entre dans l'inventaire. Pur Three.js : les sons
// sont joués côté Phaser (scenes/beats.ts) via `onCue`.
import * as THREE from 'three';
import { at, box, cyl, glow } from '../kit';
import { badgeCard } from '../props';
import type { Stage } from '../Stage';

export type BobCue = 'open' | 'slurp' | 'gulp' | 'chew' | 'retch' | 'burst' | 'land' | 'grab' | 'shut';

export interface BobParts {
  robot: THREE.Group;
  /** Largeur du robot (échelle des déplacements). */
  w: number;
}

const HAS_BADGE = { items: ['badge'] };
const GRAVITY = 9;

/** Repas, en secondes depuis le début (phases successives). */
const OPEN = 0.28; // le couvercle bascule
const FLY = OPEN + 0.55; // le sandwich vole au-dessus de la gueule
const SUCK = FLY + 0.3; // il y plonge en vrille
const CLOSE = SUCK + 0.2; // clac
/** Mâchouillage : durée de chaque coup de mâchoire (irrégulier, cartoon). */
const CHEWS = [0.34, 0.26, 0.42, 0.3, 0.48];
const CHEW_END = CLOSE + CHEWS.reduce((a, b) => a + b, 0);
/** Angle du couvercle ouvert (rad, charnière latérale). */
const LID_OPEN = 1.35;
/** Tremblote avant l'expulsion, couvercle ouvert, refermeture. */
const RETCH = 0.9;
const SPIT_OPEN = 0.12;
const SPIT_HOLD = 0.55;
const SPIT_SHUT = 0.22;

const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);
const easeIn = (k: number) => k * k;
/** Dépassement en fin de course (couvercle qui claque et rebondit). */
const easeOutBack = (k: number) => 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2);
const clamp01 = (k: number) => THREE.MathUtils.clamp(k, 0, 1);

interface Junk {
  obj: THREE.Object3D;
  vel: THREE.Vector3;
  spin: THREE.Vector3;
  /** Rayon au sol (hauteur de repos). */
  rest: number;
  bounces: number;
  scale: number;
}

interface Puff {
  sprite: THREE.Sprite;
  vel: THREE.Vector3;
  life: number;
}

export class BobRig {
  /** Plan du repas (B.O.B. et le sol devant lui). */
  static readonly SHOT = 'bob_repas';

  onCue: ((c: BobCue) => void) | null = null;

  /** Repère fixe au pied du robot (les débris n'héritent pas de ses secousses). */
  private root = new THREE.Group();
  private sandwich = new THREE.Group();
  private junk: Junk[] = [];
  private badge: Junk;
  private puffs: Puff[] = [];
  private base: { x: number; z: number; ry: number };
  private lidY: number;

  private lid: THREE.Object3D | null;
  private eyes: THREE.Object3D[];
  private chewIdx = -1;
  private mealT = -1;
  private mealDone: (() => void) | null = null;
  private retchT = -1;
  /** Badge au sol, en attente de `give: badge` ; puis temps de son envol vers Gary. */
  private grabT = -1;
  private clearT = -1;
  private clearDone: (() => void) | null = null;

  constructor(
    private stage: Stage,
    private parts: BobParts,
  ) {
    const { robot, w } = parts;
    this.base = { x: robot.position.x, z: robot.position.z, ry: robot.rotation.y };
    this.lidY = w * 0.3;
    this.lid = (robot.userData.lid as THREE.Object3D | undefined) ?? null;
    this.eyes = (robot.userData.eyes as THREE.Object3D[] | undefined) ?? [];
    this.root.position.set(robot.position.x, 0, robot.position.z);
    stage.add(this.root);

    // le sandwich Thon-Mayo-Mystère
    const sw = w * 0.32;
    this.sandwich.add(
      at(box(sw, sw * 0.18, sw * 0.7, '#e3c178'), 0, sw * 0.18, 0),
      at(box(sw * 0.96, sw * 0.12, sw * 0.68, '#8fae3a', { edges: false }), 0, sw * 0.03, 0),
      at(box(sw, sw * 0.18, sw * 0.7, '#e3c178'), 0, -sw * 0.12, 0),
    );
    this.sandwich.visible = false;
    this.root.add(this.sandwich);

    // ce qui ressort : une chaussette, trois boulons, le badge
    const sock = new THREE.Group();
    sock.add(at(box(w * 0.1, w * 0.26, w * 0.1, '#f2f2ee'), 0, w * 0.06, 0));
    sock.add(at(box(w * 0.1, w * 0.06, w * 0.105, '#ff5c9a', { edges: false }), 0, w * 0.16, 0));
    sock.add(at(box(w * 0.1, w * 0.1, w * 0.18, '#f2f2ee'), 0, -w * 0.07, w * 0.05));
    this.addJunk(sock, w * 0.06);
    for (let i = 0; i < 3; i++) {
      const bolt = new THREE.Group();
      bolt.add(cyl(w * 0.025, w * 0.025, w * 0.11, '#9aa5b1', { seg: 8 }));
      bolt.add(at(cyl(w * 0.045, w * 0.045, w * 0.025, '#c9d2dc', { seg: 6 }), 0, w * 0.06, 0));
      this.addJunk(bolt, w * 0.03);
    }
    const card = new THREE.Group();
    const cw = w * 0.34;
    const ch = cw * 0.7;
    // recto GenAI vers le haut
    const face = badgeCard(cw, 0.012);
    face.rotation.x = -Math.PI / 2;
    card.add(face);
    // bave verte : il sort de B.O.B., après tout
    card.add(at(box(cw * 0.45, 0.018, ch * 0.22, '#7fbf3f', { edges: false }), cw * 0.2, 0.002, ch * 0.25));
    this.badge = this.addJunk(card, 0.01);

    stage.animate((_t, dt) => this.tick(dt));
  }

  private addJunk(obj: THREE.Object3D, rest: number): Junk {
    obj.visible = false;
    this.root.add(obj);
    const j: Junk = { obj, vel: new THREE.Vector3(), spin: new THREE.Vector3(), rest, bounces: 0, scale: 1 };
    this.junk.push(j);
    return j;
  }

  /** Le sandwich vole vers B.O.B., est aspiré, B.O.B. déglutit. */
  eat(): Promise<void> {
    this.mealT = 0;
    this.sandwich.visible = true;
    return new Promise((resolve) => (this.mealDone = resolve));
  }

  /** `# shake` du dialogue : tremblote, puis expulsion. */
  retch(): void {
    if (this.retchT >= 0) return;
    this.retchT = 0;
    this.onCue?.('retch');
  }

  /**
   * Fin de la séquence : les débris restants fondent dans le décor. Le badge,
   * lui, ne fond jamais : s'il est dans l'inventaire il file vers Gary (on
   * attend la fin de son envol), sinon il reste au sol.
   */
  clear(): Promise<void> {
    if (!this.junk.some((j) => j.obj.visible) && this.retchT < 0) return Promise.resolve();
    this.clearT = 0;
    return new Promise((resolve) => (this.clearDone = resolve));
  }

  private tick(dt: number): void {
    dt = Math.min(dt, 0.05);
    // signale à BobVoice que l'échelle du robot est prise
    this.parts.robot.userData.anim = this.mealT >= 0 || this.retchT >= 0;
    if (this.mealT >= 0) this.stepMeal(dt);
    if (this.retchT >= 0) this.stepRetch(dt);
    this.stepJunk(dt);
    this.stepPuffs(dt);
    this.stepClear(dt);
  }

  /** Couvercle : 0 fermé, 1 ouvert (au-delà : dépassement). */
  private setLid(k: number): void {
    if (this.lid) this.lid.rotation.z = k * LID_OPEN;
  }

  /** Yeux : 1 normaux, < 1 plissés, > 1 écarquillés. */
  private setEyes(sy: number, sx = 1): void {
    for (const e of this.eyes) e.scale.set(sx, sy, 1);
  }

  private stepMeal(dt: number): void {
    const { robot, w } = this.parts;
    const prev = this.mealT;
    this.mealT += dt;
    const t = this.mealT;
    const crossed = (at: number) => prev < at && t >= at;
    const lid = new THREE.Vector3(0, this.lidY, 0);
    const tip = robot.userData.tip as THREE.Mesh | undefined;

    if (prev === 0) this.onCue?.('open');
    // 1. le couvercle bascule (avec rebond), les yeux s'écarquillent
    if (t < OPEN) {
      this.setLid(easeOutBack(t / OPEN));
      this.setEyes(1 + 0.35 * (t / OPEN));
    }
    // 2. le sandwich vole jusqu'au-dessus de la gueule ouverte
    if (t < FLY) {
      const k = easeOut(clamp01(t / FLY));
      const from = new THREE.Vector3(-w * 1.2, w * 1.3, w * 2.2);
      const above = lid.clone().setY(this.lidY + w * 0.2);
      this.sandwich.position.lerpVectors(from, above, k);
      this.sandwich.position.y += Math.sin(Math.PI * k) * w * 0.5;
      this.sandwich.rotation.set(k * 4, k * 2, 0);
      this.sandwich.scale.setScalar(1);
      return;
    }
    // 3. il plonge en vrille, aspiré ; le corps s'étire vers lui
    if (t < SUCK) {
      if (prev < FLY) this.onCue?.('slurp');
      const k = easeIn((t - FLY) / (SUCK - FLY));
      this.sandwich.position.set(0, this.lidY + w * 0.2 * (1 - k) - k * w * 0.1, 0);
      this.sandwich.rotation.y += dt * 20;
      this.sandwich.scale.set(1 - k * 0.8, 1 + k * 1.2, 1 - k * 0.8);
      robot.scale.set(1 - k * 0.06, 1 + k * 0.14, 1 - k * 0.06);
      return;
    }
    // 4. clac : le couvercle se referme, petit rebond du corps
    if (t < CLOSE) {
      if (this.sandwich.visible) this.sandwich.visible = false;
      const k = easeIn((t - SUCK) / (CLOSE - SUCK));
      this.setLid(1 - k);
      robot.scale.set(1 - 0.06 * (1 - k), 1 + 0.14 * (1 - k), 1 - 0.06 * (1 - k));
      this.setEyes(1.35 - 0.35 * k);
      return;
    }
    if (crossed(CLOSE)) {
      this.setLid(0);
      this.onCue?.('gulp');
    }
    // 5. mâchouillage : coups de mâchoire irréguliers, le couvercle se soulève à chaque coup,
    //    corps écrasé / étiré, yeux qui plissent, antenne qui clignote
    if (t < CHEW_END) {
      let c = t - CLOSE;
      let i = 0;
      while (i < CHEWS.length - 1 && c >= CHEWS[i]) c -= CHEWS[i++];
      if (i !== this.chewIdx) {
        this.chewIdx = i;
        this.onCue?.('chew');
      }
      const k = clamp01(c / CHEWS[i]);
      const bite = Math.sin(Math.PI * k);
      // un coup sur deux penche d'un côté, l'amplitude varie : ça mâche, pas ça pulse
      const amp = [1, 0.7, 1.2, 0.8, 1.1][i];
      const side = i % 2 ? 1 : -1;
      const squash = bite * 0.22 * amp;
      robot.scale.set(1 + squash * (1 + side * 0.4), 1 - squash, 1 + squash * (1 - side * 0.4));
      robot.rotation.z = side * bite * 0.06 * amp;
      this.setLid(Math.max(0, Math.sin(Math.PI * clamp01(k * 1.6))) * 0.12 * amp);
      this.setEyes(1 - bite * 0.6, 1 + bite * 0.15);
      if (tip) (tip.material as THREE.MeshBasicMaterial).color.set(bite > 0.5 ? '#ffd166' : '#ff5c7a');
      return;
    }
    robot.scale.set(1, 1, 1);
    robot.rotation.z = 0;
    this.setLid(0);
    this.setEyes(1);
    if (tip) (tip.material as THREE.MeshBasicMaterial).color.set('#ff5c7a');
    this.mealT = -1;
    this.chewIdx = -1;
    const done = this.mealDone;
    this.mealDone = null;
    done?.();
  }

  private stepRetch(dt: number): void {
    const { robot, w } = this.parts;
    this.retchT += dt;
    const t = this.retchT;
    const tip = robot.userData.tip as THREE.Mesh | undefined;
    if (t < RETCH) {
      // tremblote de plus en plus fort, le couvercle claquette, l'antenne clignote
      const p = t / RETCH;
      const a = p * w * 0.035;
      robot.position.x = this.base.x + Math.sin(t * 70) * a;
      robot.position.z = this.base.z + Math.cos(t * 53) * a * 0.6;
      robot.rotation.y = this.base.ry + Math.sin(t * 41) * 0.08 * p;
      robot.scale.set(1 + p * 0.08, 1 - p * 0.06, 1 + p * 0.08);
      this.setLid(Math.max(0, Math.sin(t * 38)) * 0.1 * p);
      this.setEyes(1 + p * 0.4);
      if (tip) (tip.material as THREE.MeshBasicMaterial).color.set(Math.sin(t * 30) > 0 ? '#ffd166' : '#ff5c7a');
      return;
    }
    // le couvercle saute, B.O.B. recrache tout, s'étire, puis referme
    if (t - dt < RETCH) this.burst();
    robot.position.x = this.base.x;
    robot.position.z = this.base.z;
    robot.rotation.y = this.base.ry;
    const o = t - RETCH;
    if (o < SPIT_OPEN) this.setLid(easeOut(o / SPIT_OPEN) * 1.1);
    else if (o < SPIT_OPEN + SPIT_HOLD) this.setLid(1.1 - 0.1 * ((o - SPIT_OPEN) / SPIT_HOLD) + Math.sin(o * 30) * 0.03);
    else this.setLid(1 - easeIn(clamp01((o - SPIT_OPEN - SPIT_HOLD) / SPIT_SHUT)));
    const k = clamp01(o / 0.5);
    const st = Math.sin(Math.PI * k) * (1 - k * 0.5);
    robot.scale.set(1 - st * 0.15, 1 + st * 0.4, 1 - st * 0.15);
    this.setEyes(1.4 - 0.4 * k);
    if (o >= SPIT_OPEN + SPIT_HOLD + SPIT_SHUT) {
      this.setLid(0);
      this.setEyes(1);
      robot.scale.set(1, 1, 1);
      if (tip) (tip.material as THREE.MeshBasicMaterial).color.set('#ff5c7a');
      this.onCue?.('shut');
      this.retchT = -1;
    }
  }

  /** Expulsion : chaque débris part en cloche vers l'avant, un nuage de poussière. */
  private burst(): void {
    const { w } = this.parts;
    this.onCue?.('burst');
    this.junk.forEach((j, i) => {
      const side = (i - (this.junk.length - 1) / 2) / this.junk.length;
      j.obj.visible = true;
      j.obj.position.set(side * w * 0.2, this.lidY + w * 0.05, w * 0.1);
      j.obj.scale.setScalar(1);
      j.scale = 1;
      j.bounces = 0;
      const badge = j === this.badge;
      // en gerbe sur les côtés (le bas de l'image est sous la boîte de dialogue) ; le badge à gauche, bien en vue
      const sx = badge ? -0.6 : side * 2.2 + (side >= 0 ? 0.45 : -0.45);
      j.vel.set(sx * w, w * (badge ? 3.2 : 2.6 + Math.random() * 0.8), w * (badge ? 0.35 : 0.1 + Math.random() * 0.4));
      j.spin.set((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 14);
      if (badge) j.spin.set(9, 2, 0);
    });
    for (let i = 0; i < 9; i++) {
      const sprite = glow(i % 3 ? '#9a9384' : '#6e695f', w * 0.3, 0.5);
      sprite.position.set(0, this.lidY + w * 0.05, 0);
      this.root.add(sprite);
      const a = (i / 9) * Math.PI * 2;
      this.puffs.push({ sprite, vel: new THREE.Vector3(Math.cos(a) * w * 1.6, w * (1 + Math.random()), Math.abs(Math.sin(a)) * w * 1.6), life: 1 });
    }
  }

  private stepJunk(dt: number): void {
    const { w } = this.parts;
    const has = this.stage.is(HAS_BADGE);
    // « Gary récupère son badge » : dès qu'il est dans l'inventaire et a touché le sol,
    // le badge saute vers la caméra et disparaît (même si le give a devancé le crachat)
    if (has && this.badge.obj.visible && this.grabT < 0 && this.badge.bounces >= 1) {
      this.grabT = 0;
      this.onCue?.('grab');
      this.badge.vel.set(-w * 0.8, w * 4.5, w * 4);
      this.badge.bounces = 99;
    }
    for (const j of this.junk) {
      if (!j.obj.visible) continue;
      if (j === this.badge && this.grabT >= 0) {
        this.grabT += dt;
        j.vel.y -= GRAVITY * 0.3 * dt;
        j.obj.position.addScaledVector(j.vel, dt);
        j.obj.rotation.x += dt * 8;
        j.obj.scale.setScalar(Math.max(0.01, 1 - this.grabT * 1.6));
        if (this.grabT > 0.6) {
          j.obj.visible = false;
          this.grabT = -1;
        }
        continue;
      }
      if (j.bounces >= 3) continue;
      j.vel.y -= GRAVITY * dt;
      j.obj.position.addScaledVector(j.vel, dt);
      j.obj.rotation.x += j.spin.x * dt;
      j.obj.rotation.y += j.spin.y * dt;
      j.obj.rotation.z += j.spin.z * dt;
      if (j.obj.position.y <= j.rest && j.vel.y < 0) {
        j.obj.position.y = j.rest;
        j.bounces++;
        if (j.bounces === 1 && j === this.badge) this.onCue?.('land');
        j.vel.y *= -0.35;
        j.vel.x *= 0.2;
        j.vel.z *= 0.2;
        j.spin.multiplyScalar(0.4);
        if (j.bounces >= 3 || Math.abs(j.vel.y) < w * 0.3) {
          j.bounces = 3;
          // à plat au sol (le badge, surtout, doit se lire)
          j.obj.rotation.x = j === this.badge ? 0 : Math.round(j.obj.rotation.x / Math.PI) * Math.PI + Math.PI / 2;
          j.obj.rotation.z = j === this.badge ? 0 : j.obj.rotation.z;
        }
      }
    }
  }

  private stepPuffs(dt: number): void {
    for (let i = this.puffs.length - 1; i >= 0; i--) {
      const p = this.puffs[i];
      p.life -= dt / 1.1;
      p.vel.multiplyScalar(Math.max(0, 1 - dt * 3));
      p.sprite.position.addScaledVector(p.vel, dt);
      p.sprite.material.opacity = 0.5 * Math.max(0, p.life);
      p.sprite.scale.setScalar(this.parts.w * (0.3 + (1 - p.life) * 0.7));
      if (p.life <= 0) {
        this.root.remove(p.sprite);
        p.sprite.material.dispose();
        this.puffs.splice(i, 1);
      }
    }
  }

  private stepClear(dt: number): void {
    // dialogue fini avant le crachat : on laisse B.O.B. recracher d'abord
    if (this.clearT < 0 || this.retchT >= 0) return;
    this.clearT += dt;
    const k = clamp01(this.clearT / 0.5);
    for (const j of this.junk) if (j.obj.visible && j !== this.badge) j.obj.scale.setScalar(Math.max(0.01, 1 - k));
    // le badge en vol vers Gary : on attend qu'il soit parti ; pas dans l'inventaire : il reste au sol
    const badgeOut = !this.badge.obj.visible || !this.stage.is(HAS_BADGE);
    if (k >= 1 && badgeOut) {
      for (const j of this.junk) if (j !== this.badge) j.obj.visible = false;
      this.clearT = -1;
      const done = this.clearDone;
      this.clearDone = null;
      done?.();
    }
  }
}
