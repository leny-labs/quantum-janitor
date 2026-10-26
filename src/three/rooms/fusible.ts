// Mécanique 3D du fusible 7B (couloir) : Gary le secoue, l'arrache dans une
// gerbe d'étincelles, puis le néon et l'enseigne du circuit hoquettent et
// meurent ; le rouge de secours prend le relais quand `fusible_retire` passe
// à vrai. Pur Three.js : les sons sont joués côté Phaser (scenes/beats.ts).
import * as THREE from 'three';
import { glow } from '../kit';
import type { Stage } from '../Stage';

export type FuseCue = 'zap' | 'flicker' | 'die';

export interface FuseParts {
  /** Boîte à fusibles (repère local : centre de la boîte, façade vers +z). */
  box: THREE.Group;
  fuse: THREE.Object3D;
  /** Largeur de la boîte (échelle des déplacements). */
  w: number;
  /** Ce qui s'éteint avec le circuit 7B (néon, enseigne, reflets…). */
  lit: THREE.Object3D[];
  light: THREE.PointLight;
}

/** Durées (s) : secousse, arrachage, hoquets de la lumière, fin. */
const WIGGLE = 0.3;
const PULL = 0.3;
const FLICKER = 0.9;
const END = WIGGLE + PULL + FLICKER + 0.25;
/** Motif on / off des hoquets (fractions de FLICKER). */
const BLINKS = [0.1, 0.18, 0.3, 0.34, 0.5, 0.62, 0.7, 0.86];

const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);
const clamp01 = (k: number) => THREE.MathUtils.clamp(k, 0, 1);

interface Spark {
  sprite: THREE.Sprite;
  vel: THREE.Vector3;
  life: number;
}

export class FuseRig {
  static readonly SHOT = 'fusibles';

  onCue: ((c: FuseCue) => void) | null = null;

  private base: THREE.Vector3;
  private lightBase: number;
  private sparks: Spark[] = [];
  private t = -1;
  private blink = 0;
  private done: (() => void) | null = null;

  constructor(
    stage: Stage,
    private parts: FuseParts,
  ) {
    this.base = parts.fuse.position.clone();
    this.lightBase = parts.light.intensity;
    stage.animate((_t, dt) => this.tick(dt));
  }

  /** Arrachage complet ; se résout quand la lumière du circuit est morte. */
  pull(): Promise<void> {
    this.t = 0;
    this.blink = 0;
    return new Promise((resolve) => (this.done = resolve));
  }

  private tick(dt: number): void {
    dt = Math.min(dt, 0.05);
    this.stepSparks(dt);
    if (this.t < 0) return;
    const { fuse, w, lit, light } = this.parts;
    const prev = this.t;
    this.t += dt;
    const t = this.t;

    // le fusible : secoué, arraché, puis file dans la poche de Gary
    if (t < WIGGLE) {
      fuse.position.copy(this.base);
      fuse.rotation.z = Math.sin(t * 60) * 0.12;
    } else {
      const k = easeOut(clamp01((t - WIGGLE) / PULL));
      const fly = clamp01((t - WIGGLE - PULL) / 0.35);
      fuse.rotation.z = fly * 2;
      fuse.position.set(this.base.x - fly * w * 0.6, this.base.y - fly * w * 0.8, this.base.z + k * w * 0.5 + fly * w * 1.2);
      fuse.scale.setScalar(1 - fly * 0.9);
      fuse.visible = fly < 1;
    }
    if (prev < WIGGLE && t >= WIGGLE) {
      this.onCue?.('zap');
      this.burst();
    }

    // la lumière du circuit hoquette puis meurt
    const f = (t - WIGGLE - PULL * 0.5) / FLICKER;
    if (f >= 0) {
      const steps = BLINKS.filter((b) => f >= b).length;
      const on = f < 1 && steps % 2 === 0;
      if (steps !== this.blink) {
        this.blink = steps;
        this.onCue?.(f >= 1 || steps === BLINKS.length ? 'die' : 'flicker');
        if (steps % 2 === 1) this.burst(4);
      }
      for (const o of lit) o.visible = on;
      light.intensity = on ? this.lightBase * (0.6 + Math.random() * 0.4) : 0;
    }

    if (t >= END) {
      this.t = -1;
      fuse.position.copy(this.base);
      fuse.rotation.set(0, 0, 0);
      fuse.scale.setScalar(1);
      light.intensity = this.lightBase;
      const done = this.done;
      this.done = null;
      done?.();
    }
  }

  /** Gerbe d'étincelles depuis le logement du fusible. */
  private burst(n = 14): void {
    const { box, w } = this.parts;
    for (let i = 0; i < n; i++) {
      const sprite = glow(i % 3 ? '#ffd166' : '#ffffff', w * 0.12, 1);
      sprite.position.set(this.base.x, this.base.y, this.base.z + 0.05);
      box.add(sprite);
      const a = Math.random() * Math.PI * 2;
      const v = w * (1.5 + Math.random() * 2.5);
      this.sparks.push({ sprite, vel: new THREE.Vector3(Math.cos(a) * v, Math.abs(Math.sin(a)) * v * 0.8 + w * 0.6, w * (0.6 + Math.random())), life: 0.35 + Math.random() * 0.3 });
    }
  }

  private stepSparks(dt: number): void {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.life -= dt;
      s.vel.y -= 9 * dt * this.parts.w;
      s.sprite.position.addScaledVector(s.vel, dt);
      s.sprite.material.opacity = clamp01(s.life / 0.3);
      if (s.life <= 0) {
        this.parts.box.remove(s.sprite);
        s.sprite.material.dispose();
        this.sparks.splice(i, 1);
      }
    }
  }
}
