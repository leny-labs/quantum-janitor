// Couloir Infini B (st-couloir-b) : la boucle se VOIT. Une porte B-n poussée pendant la boucle Ink
// (avant `st_couloir_resolu`) = petite marche caméra en 3D, puis le dialogue :
//   1. la caméra avance vers la porte, le battant s'ouvre sur le noir, on passe dedans ;
//   2. on « ressort » au bout gauche du couloir, en enfilade (portes en perspective, néons qui filent),
//      et la caméra marche jusqu'à la vue de la pièce : même couloir, même extincteur.
// Après la plante (`st_plante_posee`, pas encore `st_couloir_glisse`), M. Ficus glisse pendant
// l'atterrissage d'une porte vers la gauche (de l'autre côté de la B-1) : ce que dit l'Ink.
// Clic / touche = coupe sèche sur la fin (RoomScene.corridorWalk).
// Pas : la caméra monte / descend au rythme d'une vraie marche (creux = pied posé) et chaque pied
// posé joue un `footstep()` (sfx synthé, bus SFX), gauche / droite en alternance.
// Dénouement (`# couloir_out`, RoomScene) : `exit()` = on reprend la porte pour de bon. Même plongée
// battant → noir, puis on ressort sur le couloir redevenu droit (bureaux, sorties Acte II), sans
// l'enfilade de la boucle : petite avancée qui se pose sur la vue de la pièce.
import * as THREE from 'three';
import { at, glow } from '../kit';
import type { Stage } from '../Stage';
import { footstep } from '../../ui/sfx';

/** Battant mobile d'une porte du couloir (pivot sur le montant gauche). */
export interface WalkDoor {
  x: number;
  /** Hauteur du centre du battant. */
  y: number;
  leaf: THREE.Object3D;
}

const DUR = 3;
/** Part de la marche consacrée à l'avancée dans la porte (le reste : l'atterrissage). */
const IN = 0.27;
/** Pas pendant l'avancée vers la porte, puis pendant la marche le long du couloir. */
const STEPS_IN = 2;
const STEPS_OUT = 5;
/** Bob vertical (m, creux → crête) et roulis / balancement latéral (rad, m) d'un pas. */
const BOB = 0.12;
const ROLL = 0.02;
const SWAY = 0.035;
const OPEN = -1.45;
/** Sortie de boucle : durée, part de la plongée (le reste : on se pose dans le couloir dénoué), pas. */
const EXIT_DUR = 2.6;
const EXIT_IN = 0.58;
const EXIT_STEPS_IN = 3;
const EXIT_STEPS_OUT = 2;
/** Porte reprise au dénouement : la B-1, à côté de M. Ficus. */
export const EXIT_DOOR = 'porte_b1';

const easeIn = (k: number) => k * k * k;
const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);
const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const smooth = (a: number, b: number, k: number) => {
  const x = THREE.MathUtils.clamp((k - a) / (b - a), 0, 1);
  return x * x * (3 - 2 * x);
};

export class CouloirWalkRig {
  static readonly ID = 'couloir-walk';
  /** Debug (captures) : fige la marche à cette fraction [0, 1]. */
  freezeAt: number | null = null;

  private k = 0;
  /** Dernier pas posé (compteur de pas entier), pour un seul bruitage par pas. */
  private lastStep = 0;
  /** DEV : pas joués pendant la dernière marche. */
  stepsPlayed = 0;
  private active: {
    mode: 'walk' | 'exit';
    door: WalkDoor;
    glisse: boolean;
    done: () => void;
    /** Sortie : appelé une fois, quand la caméra a passé le battant (écran noir). */
    onDark?: () => void;
  } | null = null;
  private readonly room: { pos: THREE.Vector3; look: THREE.Vector3; fov: number };
  private readonly streaks: THREE.Sprite[] = [];
  /** Brouillard de la pièce : resserré pendant l'atterrissage, le fond du couloir se perd dans le noir. */
  private readonly fog: { near: number; far: number } | null;

  constructor(
    private s: Stage,
    private doors: Record<string, WalkDoor>,
    /** M. Ficus d'avant la glisse (hotspot ficus_pose) et ses deux places au sol. */
    private ficus: { obj: THREE.Object3D; from: THREE.Vector3; to: THREE.Vector3 },
    neon: { y: number; z: number; xs: number[] },
  ) {
    this.room = { pos: s.camera.position.clone(), look: new THREE.Vector3(), fov: s.camera.fov };
    s.camera.getWorldDirection(this.room.look);
    // regard de la vue pièce : sur le plan du mur (z = 0) dans l'axe de la caméra
    this.room.look.multiplyScalar(-this.room.pos.z / this.room.look.z).add(this.room.pos);
    // traînées des néons : n'apparaissent que quand la caméra file
    for (const x of neon.xs) {
      const g = at(glow('#e8ffe0', 1, 0), x, neon.y, neon.z);
      g.visible = false;
      this.streaks.push(g);
      s.add(g);
    }
    const fog = s.scene.fog instanceof THREE.Fog ? s.scene.fog : null;
    this.fog = fog ? { near: fog.near, far: fog.far } : null;
    s.animate((_t, dt) => this.step(dt));
  }

  /** Vrai si pousser ce hotspot doit jouer la marche (portes B-n, couloir pas encore dénoué). */
  loops(id: string): boolean {
    return id in this.doors && !this.s.is({ flags: ['st_couloir_resolu'] });
  }

  get walking(): boolean {
    return !!this.active;
  }

  walk(id: string): Promise<void> {
    const door = this.doors[id];
    if (!door) return Promise.resolve();
    this.finish();
    const glisse = this.s.is({ flags: ['st_plante_posee'], notFlags: ['st_couloir_glisse'] });
    this.k = 0;
    this.lastStep = 0;
    this.stepsPlayed = 0;
    return new Promise((done) => (this.active = { mode: 'walk', door, glisse, done }));
  }

  /**
   * Dénouement : on reprend la porte `id` (plongée dans le battant, comme la marche) et on se pose
   * sur la vue de la pièce, déjà dans l'état dénoué. `onDark` : passage du noir (fondu de l'écran).
   */
  exit(id: string = EXIT_DOOR, onDark?: () => void): Promise<void> {
    const door = this.doors[id];
    if (!door) return Promise.resolve();
    this.finish();
    this.k = 0;
    this.lastStep = 0;
    this.stepsPlayed = 0;
    return new Promise((done) => (this.active = { mode: 'exit', door, glisse: false, done, onDark }));
  }

  private get dur(): number {
    return this.active?.mode === 'exit' ? EXIT_DUR : DUR;
  }

  private get split(): number {
    return this.active?.mode === 'exit' ? EXIT_IN : IN;
  }

  private get stepsTotal(): number {
    return this.active?.mode === 'exit' ? EXIT_STEPS_IN + EXIT_STEPS_OUT : STEPS_IN + STEPS_OUT;
  }

  /** Coupe sèche sur l'atterrissage. */
  skip(): void {
    if (!this.active) return;
    this.freezeAt = null;
    this.k = 1;
    this.finish();
  }

  private step(dt: number): void {
    const a = this.active;
    if (!a) return;
    this.k = this.freezeAt ?? Math.min(1, this.k + dt / this.dur);
    if (a.mode === 'exit' && this.k >= this.split) this.dark(a);
    if (a.mode === 'exit') this.poseExit(this.k, a);
    else this.pose(this.k, a);
    // un pied posé à chaque entier franchi du compteur de pas (pas de son figé / après coupe)
    const n = Math.floor(this.stepAt(this.k) + 1e-6);
    if (this.freezeAt !== null) this.lastStep = n;
    else {
      if (n > this.lastStep) {
        this.lastStep = n;
        this.stepsPlayed++;
        // l'arrivée : dernier pas plus doux
        footstep(n % 2 ? -1 : 1, n >= this.stepsTotal ? 0.6 : 1);
      }
    }
    if (this.k >= 1 && this.freezeAt === null) this.finish();
  }

  private finish(): void {
    const a = this.active;
    if (!a) return;
    this.dark(a);
    this.active = null;
    a.door.leaf.rotation.y = 0;
    if (a.glisse) this.ficus.obj.position.copy(this.ficus.to);
    for (const g of this.streaks) g.visible = false;
    this.mist(0);
    // vue de la pièce exacte (le Stage reprend la main sur la caméra)
    this.s.view(this.s.def.id);
    this.s.dirty = true;
    a.done();
  }

  /** Sortie : le noir est passé (une seule fois, même sur une coupe). */
  private dark(a: NonNullable<CouloirWalkRig['active']>): void {
    const f = a.onDark;
    a.onDark = undefined;
    f?.();
  }

  /**
   * Compteur de pas continu sur toute la marche : entier = pied posé (creux du bob).
   * Avancée : cadence qui accélère avec la caméra ; couloir : cadence qui ralentit à l'arrivée.
   */
  private stepAt(k: number): number {
    if (this.active?.mode === 'exit') {
      if (k < EXIT_IN) return EXIT_STEPS_IN * Math.pow(k / EXIT_IN, 1.2);
      return EXIT_STEPS_IN + EXIT_STEPS_OUT * easeOut((k - EXIT_IN) / (1 - EXIT_IN));
    }
    if (k < IN) return STEPS_IN * Math.pow(k / IN, 1.35);
    const u = (k - IN) / (1 - IN);
    return STEPS_IN + STEPS_OUT * (0.75 * u + 0.25 * easeOut(u));
  }

  /** Position caméra de l'atterrissage (Bézier : bout gauche du couloir → vue de la pièce). */
  private camAt(k: number, a: NonNullable<CouloirWalkRig['active']>): THREE.Vector3 {
    if (k < IN) return this.room.pos.clone().lerp(new THREE.Vector3(a.door.x, a.door.y, 0.32), easeIn(k / IN));
    const e = easeOut((k - IN) / (1 - IN));
    const p0 = new THREE.Vector3(-7.2, 1.6, 2.7);
    const c = new THREE.Vector3(-3.8, 1.75, 6.9);
    return new THREE.Vector3()
      .addScaledVector(p0, (1 - e) * (1 - e))
      .addScaledVector(c, 2 * (1 - e) * e)
      .addScaledVector(this.room.pos, e * e);
  }

  /** Brouillard resserré (1) → celui de la pièce (0). */
  private mist(d: number): void {
    const fog = this.s.scene.fog;
    if (!(fog instanceof THREE.Fog) || !this.fog) return;
    fog.near = THREE.MathUtils.lerp(this.fog.near, 3.5, d);
    fog.far = THREE.MathUtils.lerp(this.fog.far, 13, d);
  }

  /**
   * Sortie de boucle : 1. vers la porte, battant ouvert sur le noir, on passe dedans (bob de pas) ;
   * 2. on ressort un peu en arrière de la vue de la pièce, dans le couloir dénoué, et on avance
   * jusqu'à elle (deux derniers pas, le brouillard se lève).
   */
  private poseExit(k: number, a: NonNullable<CouloirWalkRig['active']>): void {
    const { door } = a;
    const st = Math.sin(this.stepAt(k) * Math.PI);
    let pos: THREE.Vector3;
    let look: THREE.Vector3;
    let fov: number;
    let roll: number;
    if (k < EXIT_IN) {
      const u = k / EXIT_IN;
      // avancée plus posée que la boucle (on sait où on va), qui accélère dans le battant
      const e = 0.35 * u * u + 0.65 * easeIn(u);
      pos = this.room.pos.clone().lerp(new THREE.Vector3(door.x, door.y, 0.32), e);
      look = this.room.look.clone().lerp(new THREE.Vector3(door.x, door.y, -3), easeInOut(Math.min(1, u * 1.3)));
      fov = THREE.MathUtils.lerp(this.room.fov, 64, easeIn(u));
      const amp = smooth(0, 0.25, u) * (1 - smooth(0.8, 1, u));
      pos.y += (Math.abs(st) - 0.4) * BOB * 0.8 * amp;
      pos.x += st * SWAY * 0.6 * amp;
      roll = st * ROLL * 0.7 * amp;
      door.leaf.rotation.y = OPEN * smooth(0.05, 0.55, u);
      this.mist(smooth(0.55, 1, u));
    } else {
      const u = (k - EXIT_IN) / (1 - EXIT_IN);
      const e = easeOut(u);
      const from = this.room.pos.clone().add(new THREE.Vector3(0.35, 0.1, 1.6));
      pos = from.lerp(this.room.pos, e);
      look = this.room.look.clone();
      fov = THREE.MathUtils.lerp(66, this.room.fov, e);
      const fade = 1 - smooth(0.55, 1, u);
      pos.y += (Math.abs(st) - 0.4) * BOB * 0.7 * fade;
      pos.x += st * SWAY * fade;
      roll = st * ROLL * fade;
      door.leaf.rotation.y = OPEN * (1 - smooth(0, 0.5, u));
      this.mist(1 - smooth(0.1, 0.9, u));
    }
    for (const g of this.streaks) g.visible = false;
    this.place(pos, look, fov, roll);
  }

  private place(pos: THREE.Vector3, look: THREE.Vector3, fov: number, roll: number): void {
    const cam = this.s.camera;
    cam.position.copy(pos);
    cam.up.set(0, 1, 0);
    cam.lookAt(look);
    if (roll) cam.rotateZ(roll);
    if (cam.fov !== fov) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
    cam.updateMatrixWorld();
    this.s.dirty = true;
  }

  private pose(k: number, a: NonNullable<CouloirWalkRig['active']>): void {
    const { door } = a;
    let pos: THREE.Vector3;
    let look: THREE.Vector3;
    let fov: number;
    let roll = 0;
    if (k < IN) {
      // 1. vers la porte : avancée qui accélère, battant ouvert sur le noir
      const u = k / IN;
      const e = easeIn(u);
      pos = this.camAt(k, a);
      look = this.room.look.clone().lerp(new THREE.Vector3(door.x, door.y, -3), easeInOut(Math.min(1, u * 1.4)));
      fov = THREE.MathUtils.lerp(this.room.fov, 64, e);
      // pas vers la porte : bob plus court, qui grandit avec l'élan
      const st = Math.sin(this.stepAt(k) * Math.PI);
      pos.y += (Math.abs(st) - 0.4) * BOB * 0.6 * smooth(0, 0.35, u);
      roll = st * ROLL * 0.5;
      door.leaf.rotation.y = OPEN * smooth(0.12, 0.7, u);
      this.mist(smooth(0.6, 1, u));
      if (a.glisse) this.ficus.obj.position.copy(this.ficus.from);
    } else {
      // 2. on ressort au bout gauche, en enfilade, et on marche jusqu'à la vue de la pièce
      const u = (k - IN) / (1 - IN);
      const e = easeOut(u);
      pos = this.camAt(k, a);
      look = new THREE.Vector3(2.2, 1.5, -0.4).lerp(this.room.look, easeInOut(Math.min(1, u * 1.15)));
      fov = THREE.MathUtils.lerp(60, this.room.fov, e);
      // pas : bob haut / bas (creux = pied posé), roulis et balancement latéral alternés,
      // qui s'éteignent sur l'atterrissage
      const st = Math.sin(this.stepAt(k) * Math.PI);
      const fade = 1 - smooth(0.72, 1, u);
      pos.y += (Math.abs(st) - 0.4) * BOB * fade;
      pos.z += st * SWAY * fade;
      roll = st * ROLL * fade;
      door.leaf.rotation.y = 0;
      this.mist(1 - smooth(0.35, 1, u));
      // M. Ficus : le couloir glisse sous lui, il finit une porte plus à gauche
      if (a.glisse) this.ficus.obj.position.lerpVectors(this.ficus.from, this.ficus.to, smooth(0.14, 0.76, u));
    }
    this.place(pos, look, fov, roll);
    // néons qui filent : traînée proportionnelle à la vitesse latérale de la caméra
    const prev = this.camAt(Math.max(0, k - 0.02), a);
    const speed = k < IN ? 0 : Math.min(1, Math.abs(pos.x - prev.x) * 9);
    for (const g of this.streaks) {
      g.visible = speed > 0.05;
      g.scale.set(2.4 + speed * 4.5, 0.18 + speed * 0.05, 1);
      g.material.opacity = 0.55 * speed;
    }
    this.s.dirty = true;
  }
}
