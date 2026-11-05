// Couloir Infini B (st-couloir-b) : la boucle se VOIT. Une porte B-n poussée pendant la boucle Ink
// (avant `st_couloir_resolu`) = petite marche caméra en 3D, puis le dialogue :
//   1. la caméra avance vers la porte, le battant s'ouvre sur le noir, on passe dedans ;
//   2. on « ressort » au bout gauche du couloir, en enfilade (portes en perspective, néons qui filent),
//      et la caméra marche jusqu'à la vue de la pièce : même couloir, même extincteur.
// Après la plante (`st_plante_posee`, pas encore `st_couloir_glisse`), M. Ficus glisse pendant
// l'atterrissage d'une porte vers la gauche (de l'autre côté de la B-1) : ce que dit l'Ink.
// Clic / touche = coupe sèche sur la fin (RoomScene.corridorWalk).
import * as THREE from 'three';
import { at, glow } from '../kit';
import type { Stage } from '../Stage';

/** Battant mobile d'une porte du couloir (pivot sur le montant gauche). */
export interface WalkDoor {
  x: number;
  /** Hauteur du centre du battant. */
  y: number;
  leaf: THREE.Object3D;
}

const DUR = 1.35;
/** Part de la marche consacrée à l'avancée dans la porte (le reste : l'atterrissage). */
const IN = 0.36;
const OPEN = -1.45;

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
  private active: { door: WalkDoor; glisse: boolean; done: () => void } | null = null;
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
    return new Promise((done) => (this.active = { door, glisse, done }));
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
    this.k = this.freezeAt ?? Math.min(1, this.k + dt / DUR);
    this.pose(this.k, a);
    if (this.k >= 1 && this.freezeAt === null) this.finish();
  }

  private finish(): void {
    const a = this.active;
    if (!a) return;
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

  private pose(k: number, a: NonNullable<CouloirWalkRig['active']>): void {
    const cam = this.s.camera;
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
      pos.y += Math.sin(u * Math.PI * 3) * 0.035 * u;
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
      // pas : petit balancement vertical + roulis qui s'éteignent à l'arrivée
      const steps = Math.sin(u * Math.PI * 6);
      pos.y += Math.abs(steps) * 0.05 * (1 - e);
      roll = steps * 0.012 * (1 - e);
      door.leaf.rotation.y = 0;
      this.mist(1 - smooth(0.35, 1, u));
      // M. Ficus : le couloir glisse sous lui, il finit une porte plus à gauche
      if (a.glisse) this.ficus.obj.position.lerpVectors(this.ficus.from, this.ficus.to, smooth(0.22, 0.88, u));
    }
    cam.position.copy(pos);
    cam.up.set(0, 1, 0);
    cam.lookAt(look);
    if (roll) cam.rotateZ(roll);
    if (cam.fov !== fov) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
    cam.updateMatrixWorld();
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
