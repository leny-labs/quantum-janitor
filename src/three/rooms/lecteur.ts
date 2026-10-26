// Mécanique 3D du lecteur de badge du labo : la serpillière mouillée qui
// frotte le yaourt (il s'étire, couine, puis tombe et fond), le badge
// présenté au lecteur (bip, LED) et la porte du labo qui s'escamote quand
// `labo_ouvert` passe à vrai. Pur Three.js : les sons sont joués côté Phaser
// (scenes/beats.ts) via `onCue`.
import * as THREE from 'three';
import { at, box, cyl, glow, sphere } from '../kit';
import type { Stage } from '../Stage';

/** Moments forts, pour caler les bruitages côté Phaser. */
export type LecteurCue = 'squeak' | 'plop' | 'clean' | 'bip' | 'granted' | 'door' | 'clunk';

export interface LecteurParts {
  /** Boîtier du lecteur (repère local : centre du boîtier, façade vers +z). */
  reader: THREE.Group;
  slime: THREE.Group;
  /** Anneau LED de l'état propre. */
  led: THREE.Mesh;
  /** Largeur / hauteur du boîtier. */
  w: number;
  h: number;
  /** Tablier de la porte du labo, pivot sur le linteau (scale.y 1 = fermée). */
  shutter: THREE.Group;
  /** Halo et lumière violette du labo, dosés par l'ouverture. */
  doorGlow: THREE.Sprite;
  spill: THREE.PointLight;
}

const OPEN = { flags: ['labo_ouvert'] };
const TEAL = new THREE.Color('#7fffd4');
const AMBER = new THREE.Color('#ffb340');
const GREEN = new THREE.Color('#5dff6a');

/** Durées (s) du frottage : entrée du manche, va-et-vient, sortie. */
const SCRUB_IN = 0.35;
const SCRUB_RUB = 1.25;
const SCRUB_OUT = 0.45;
/** Va-et-vient par seconde. */
const RUB_HZ = 2.4;
/** Durées (s) du badge : approche, lecture, retrait. */
const SWIPE_IN = 0.32;
const SWIPE_HOLD = 0.5;
const SWIPE_OUT = 0.3;
/** Porte : délai après le feu vert, ramassé, montée. */
const DOOR_DELAY = 0.6;
const DOOR_CROUCH = 0.22;
const DOOR_RISE = 0.7;

const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);
const easeIn = (k: number) => k * k * k;
const clamp01 = (k: number) => THREE.MathUtils.clamp(k, 0, 1);

interface Blob {
  mesh: THREE.Object3D;
  pos: THREE.Vector3;
  scale: THREE.Vector3;
  vel: THREE.Vector3;
  spin: number;
}

interface Drop {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
}

export class LecteurRig {
  /** Plan du frottage (serré sur le boîtier). */
  static readonly SCRUB_SHOT = 'lecteur_frotte';
  /** Plan du badge : lecteur + porte du labo. */
  static readonly SWIPE_SHOT = 'lecteur';

  onCue: ((c: LecteurCue) => void) | null = null;

  private mop = new THREE.Group();
  private head = new THREE.Group();
  private card = new THREE.Group();
  private ledMat: THREE.MeshBasicMaterial;
  private ledHalo: THREE.Sprite;
  private blobs: Blob[] = [];
  private drops: Drop[] = [];

  /** Temps écoulé dans le frottage (-1 : au repos). */
  private scrubT = -1;
  private scrubDone: (() => void) | null = null;
  private lastSide = 0;
  private detached = false;
  private ledPop = -1;

  private swipeT = -1;
  private swipeDone: (() => void) | null = null;
  /** Lecture en cours / accordée : LED ambre clignotante, puis verte. */
  private reading = false;

  /** Porte : null tant que l'état initial n'est pas lu, puis temps depuis le feu vert (Infinity = ouverte d'office). */
  private doorT: number | null = null;
  private shutterY: number;
  private doorWait: (() => void) | null = null;

  constructor(
    private stage: Stage,
    private parts: LecteurParts,
  ) {
    const { reader, slime, led, w, shutter } = parts;
    this.shutterY = shutter.position.y;

    // LED : matériau propre (on en change la couleur), halo de « pop »
    this.ledMat = (led.material as THREE.MeshBasicMaterial).clone();
    led.material = this.ledMat;
    this.ledHalo = glow('#7fffd4', w * 1.4, 0);
    this.ledHalo.position.copy(led.position).setZ(led.position.z + 0.04);
    reader.add(this.ledHalo);

    for (const mesh of slime.children) {
      this.blobs.push({ mesh, pos: mesh.position.clone(), scale: mesh.scale.clone(), vel: new THREE.Vector3(), spin: 0 });
    }

    // Josiane, mouillée : franges gris-vert luisantes, plaquées contre le boîtier, manche vers Gary
    const strand = w * 0.06;
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const s = at(sphere(strand * (1.5 + (i % 3) * 0.25), i % 2 ? '#8fa8a2' : '#6f8c86', { seg: 8 }), Math.cos(a) * w * 0.17, Math.sin(a) * w * 0.12, 0);
      s.scale.z = 0.55;
      this.head.add(s);
    }
    this.head.add(at(sphere(w * 0.15, '#7d9993', { seg: 10 }), 0, 0, 0.01));
    // reflet humide
    const wet = glow('#c8fff0', w * 0.5, 0.35);
    wet.position.set(-w * 0.08, w * 0.08, w * 0.12);
    this.head.add(wet);
    const axis = new THREE.Vector3(-0.45, -0.75, 0.5).normalize();
    const len = 2.2;
    const r = w * 0.05;
    const handle = cyl(r, r, len, '#d6a25a', { seg: 10 });
    handle.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis);
    handle.position.copy(axis).multiplyScalar(len / 2);
    const tape = cyl(r * 1.2, r * 1.2, w * 0.14, '#2fbfa0', { seg: 10, edges: false });
    tape.quaternion.copy(handle.quaternion);
    tape.position.copy(axis).multiplyScalar(w * 0.45);
    const socket = cyl(r * 1.6, r * 1.3, w * 0.16, '#3a4260', { seg: 10 });
    socket.quaternion.copy(handle.quaternion);
    socket.position.copy(axis).multiplyScalar(w * 0.12);
    this.mop.add(this.head, handle, tape, socket);
    this.mop.visible = false;
    reader.add(this.mop);

    // gouttes de seau (recyclées)
    for (let i = 0; i < 6; i++) {
      const d = sphere(w * 0.035, '#9fe8d0', { seg: 6 });
      d.visible = false;
      reader.add(d);
      this.drops.push({ mesh: d, vel: new THREE.Vector3(), life: 0 });
    }

    // badge « GARRY » : carte blanche, bandeau teal, photo
    const cw = w * 0.8;
    const ch = cw * 0.64;
    this.card.add(
      at(box(cw, ch, 0.012, '#f1efe6'), 0, 0, 0),
      at(box(cw, ch * 0.24, 0.014, '#2fbfa0', { edges: false }), 0, ch * 0.38, 0.001),
      at(box(cw * 0.3, ch * 0.42, 0.016, '#e0a97a', { edges: false }), -cw * 0.27, -ch * 0.08, 0.001),
      at(box(cw * 0.42, ch * 0.07, 0.016, '#3a4260', { edges: false }), cw * 0.16, -ch * 0.02, 0.001),
      at(box(cw * 0.3, ch * 0.07, 0.016, '#3a4260', { edges: false }), cw * 0.1, -ch * 0.2, 0.001),
    );
    this.card.visible = false;
    reader.add(this.card);

    stage.animate((_t, dt) => this.tick(dt));
  }

  /** Frottage complet ; se résout quand le manche est ressorti et la LED allumée. */
  scrub(): Promise<void> {
    this.resetSlime();
    this.scrubT = 0;
    this.detached = false;
    this.lastSide = 0;
    this.mop.visible = true;
    this.parts.led.visible = false;
    return new Promise((resolve) => (this.scrubDone = resolve));
  }

  /** Badge présenté : bip, LED ambre ; le vert vient avec `labo_ouvert`. */
  swipe(): Promise<void> {
    this.swipeT = 0;
    this.card.visible = true;
    return new Promise((resolve) => (this.swipeDone = resolve));
  }

  /** Se résout quand la porte a fini de s'ouvrir (tout de suite si elle ne bouge pas). */
  settled(): Promise<void> {
    if (this.doorT === null || this.doorT < 0 || this.doorT === Infinity) return Promise.resolve();
    return new Promise((resolve) => (this.doorWait = resolve));
  }

  /** Fin de séquence : la LED reprend son état (vert si ouvert, teal sinon). */
  idle(): void {
    this.reading = false;
  }

  private resetSlime(): void {
    for (const b of this.blobs) {
      b.mesh.position.copy(b.pos);
      b.mesh.scale.copy(b.scale);
      b.mesh.rotation.set(0, 0, 0);
      b.vel.set(0, 0, 0);
    }
  }

  private tick(dt: number): void {
    dt = Math.min(dt, 0.05);
    if (this.scrubT >= 0) this.stepScrub(dt);
    if (this.swipeT >= 0) this.stepSwipe(dt);
    this.stepDrops(dt);
    this.stepLed(dt);
    this.stepDoor(dt);
  }

  private stepScrub(dt: number): void {
    const { w, h } = this.parts;
    this.scrubT += dt;
    const t = this.scrubT;
    const rubT = t - SCRUB_IN;
    // position du manche : entrée en bas à gauche, va-et-vient, sortie
    let x = 0;
    let y = 0;
    let enter = 1;
    if (t < SCRUB_IN) enter = easeOut(t / SCRUB_IN);
    else if (rubT < SCRUB_RUB) {
      const ph = rubT * RUB_HZ * Math.PI * 2;
      x = Math.sin(ph) * w * 0.36;
      y = Math.sin(ph * 2) * h * 0.04 - h * 0.1 - (rubT / SCRUB_RUB) * h * 0.1;
      const side = Math.sign(Math.cos(ph));
      if (side !== this.lastSide) {
        if (this.lastSide !== 0) this.onCue?.('squeak');
        this.lastSide = side;
        this.spawnDrop(x, y);
      }
    } else enter = 1 - easeIn(clamp01((rubT - SCRUB_RUB) / SCRUB_OUT));
    const away = 1 - enter;
    this.mop.position.set(x - away * w * 1.4, y - away * h * 1.6, 0.11 + away * 0.5);
    this.mop.rotation.z = (x / w) * 0.35;
    this.head.scale.set(1 + Math.abs(x / w) * 0.25, 1 - Math.abs(x / w) * 0.15, 1);

    // le yaourt : traîné et étiré par le manche, puis lâche et fond
    const rubbing = rubT > 0 && rubT < SCRUB_RUB;
    if (!this.detached && rubT >= SCRUB_RUB * 0.82) {
      this.detached = true;
      this.onCue?.('plop');
      this.blobs.forEach((b, i) => {
        b.vel.set((i - 1.5) * w * 0.5, h * (0.6 + (i % 2) * 0.4), w * 0.8);
        b.spin = (i % 2 ? 1 : -1) * 6;
      });
      for (let i = 0; i < 3; i++) this.spawnDrop(x, y, '#7fbf3f');
    }
    for (const [i, b] of this.blobs.entries()) {
      if (!this.detached) {
        const drag = rubbing ? x * (0.5 + i * 0.1) : 0;
        const stretch = rubbing ? Math.abs(Math.cos(rubT * RUB_HZ * Math.PI * 2 + i)) * 0.5 : 0;
        // fin du frottage : le yaourt s'étire vers le bas, accroché au manche, avant de lâcher
        const droop = clamp01((rubT / SCRUB_RUB - 0.55) / 0.27);
        b.mesh.position.set(b.pos.x + drag, b.pos.y - droop * h * 0.14, b.pos.z);
        b.mesh.scale.set(b.scale.x * (1 + stretch) * (1 - droop * 0.3), b.scale.y * (1 - stretch * 0.4) * (1 + droop * 0.9), b.scale.z);
      } else {
        b.vel.y -= 9 * dt * h;
        b.mesh.position.addScaledVector(b.vel, dt);
        b.mesh.rotation.z += b.spin * dt;
        const melt = Math.max(0, 1 - dt * 2.6);
        b.mesh.scale.multiplyScalar(melt);
      }
    }

    // LED : pop dès que le yaourt est parti
    if (this.detached && this.ledPop < 0 && rubT >= SCRUB_RUB + 0.1) {
      this.ledPop = 0;
      this.parts.led.visible = true;
      this.onCue?.('clean');
    }
    if (rubT >= SCRUB_RUB + SCRUB_OUT + 0.35) {
      this.scrubT = -1;
      this.mop.visible = false;
      this.parts.slime.visible = false;
      this.resetSlime();
      const done = this.scrubDone;
      this.scrubDone = null;
      done?.();
    }
  }

  private spawnDrop(x: number, y: number, color?: string): void {
    const d = this.drops.find((d) => d.life <= 0);
    if (!d) return;
    const { w, h } = this.parts;
    if (color) (d.mesh.material as THREE.MeshToonMaterial).color.set(color);
    else (d.mesh.material as THREE.MeshToonMaterial).color.set('#9fe8d0');
    d.mesh.position.set(x + (Math.random() - 0.5) * w * 0.3, y - h * 0.12, 0.16);
    d.vel.set((Math.random() - 0.5) * w * 1.2, h * 0.4, w * 0.6);
    d.life = 0.7;
    d.mesh.visible = true;
  }

  private stepDrops(dt: number): void {
    for (const d of this.drops) {
      if (d.life <= 0) continue;
      d.life -= dt;
      d.vel.y -= 9 * dt * this.parts.h;
      d.mesh.position.addScaledVector(d.vel, dt);
      d.mesh.scale.setScalar(Math.max(0.2, d.life / 0.7));
      if (d.life <= 0) d.mesh.visible = false;
    }
  }

  private stepSwipe(dt: number): void {
    const { w } = this.parts;
    this.swipeT += dt;
    const t = this.swipeT;
    let k = 1;
    if (t < SWIPE_IN) k = easeOut(t / SWIPE_IN);
    else if (t > SWIPE_IN + SWIPE_HOLD) k = 1 - easeIn(clamp01((t - SWIPE_IN - SWIPE_HOLD) / SWIPE_OUT));
    const hold = t >= SWIPE_IN && t <= SWIPE_IN + SWIPE_HOLD;
    // petit tapotement contre le lecteur pendant la lecture
    const tap = hold ? Math.abs(Math.sin((t - SWIPE_IN) * 18)) * 0.02 : 0;
    this.card.position.set((1 - k) * w * 1.6, -this.parts.h * 0.05 + (1 - k) * -w * 0.4, 0.13 + tap + (1 - k) * 0.45);
    this.card.rotation.set(0, (1 - k) * -0.9, (1 - k) * 0.5 - 0.08);
    if (hold && !this.reading && t >= SWIPE_IN + 0.12) {
      this.reading = true;
      this.onCue?.('bip');
    }
    if (t >= SWIPE_IN + SWIPE_HOLD + SWIPE_OUT) {
      this.swipeT = -1;
      this.card.visible = false;
      const done = this.swipeDone;
      this.swipeDone = null;
      done?.();
    }
  }

  private stepLed(dt: number): void {
    const { led, w } = this.parts;
    const open = this.stage.is(OPEN);
    if (open) this.ledMat.color.copy(GREEN);
    else if (this.reading) this.ledMat.color.copy(Math.sin(performance.now() / 70) > 0 ? AMBER : TEAL);
    else this.ledMat.color.copy(TEAL);
    if (this.ledPop >= 0) {
      this.ledPop += dt;
      const k = clamp01(this.ledPop / 0.4);
      // 0 → 1,35 → 1 : pop élastique
      led.scale.setScalar(k < 0.55 ? easeOut(k / 0.55) * 1.35 : 1.35 - 0.35 * easeOut((k - 0.55) / 0.45));
      this.ledHalo.material.opacity = 0.9 * (1 - k);
      this.ledHalo.scale.setScalar(w * (0.8 + k * 1.6));
      if (k >= 1) this.ledPop = -1;
    }
  }

  private stepDoor(dt: number): void {
    const { shutter, doorGlow, spill } = this.parts;
    const open = this.stage.is(OPEN);
    if (this.doorT === null) this.doorT = open ? Infinity : -1;
    if (!open) {
      this.doorT = -1;
      shutter.visible = true;
      shutter.scale.y = 1;
      shutter.position.y = this.shutterY;
      return;
    }
    if (this.doorT < 0) {
      // ouverte sans badge sous les yeux (sauvegarde, debug) : déjà ouverte
      this.doorT = this.reading ? 0 : Infinity;
      if (this.reading) this.onCue?.('granted');
    }
    if (this.doorT === Infinity) {
      shutter.visible = false;
      doorGlow.material.opacity = 0.45;
      spill.intensity = 20;
      return;
    }
    const prev = this.doorT;
    this.doorT += dt;
    const t = this.doorT - DOOR_DELAY;
    const reveal = clamp01((t - DOOR_CROUCH) / (DOOR_RISE * 1.4));
    doorGlow.material.opacity = 0.45 * reveal;
    spill.intensity = 20 * reveal;
    if (t < 0) return;
    if (prev - DOOR_DELAY < DOOR_CROUCH && t >= DOOR_CROUCH) this.onCue?.('door');
    // ramassé : le tablier s'écrase un peu avant de filer dans le linteau
    const crouch = t < DOOR_CROUCH ? Math.sin((t / DOOR_CROUCH) * Math.PI) : 0;
    const rise = easeIn(clamp01((t - DOOR_CROUCH) / DOOR_RISE));
    shutter.scale.y = Math.max(0.02, 1 - crouch * 0.04 - rise * 0.98);
    shutter.position.y = this.shutterY - crouch * 0.03;
    if (t >= DOOR_CROUCH + DOOR_RISE) {
      shutter.visible = false;
      this.onCue?.('clunk');
      this.doorT = Infinity;
      this.reading = false;
      const done = this.doorWait;
      this.doorWait = null;
      done?.();
    }
  }
}
