// Une vue fixe en 3D : caméra figée + décor + objets liés aux hotspots YAML.
// Les zones cliquables restent les `rect` du YAML (coordonnées écran) ; les
// helpers ci-dessous projettent ces rectangles dans la pièce pour que le
// décor 3D tombe exactement sous les hotspots.
import * as THREE from 'three';
import type { Condition, Rect, SceneDef } from '../engine/types';

export type Vec3 = [x: number, y: number, z: number];

export interface CameraSpec {
  pos: Vec3;
  look: Vec3;
  fov?: number;
}

export interface LightSpec {
  sky: THREE.ColorRepresentation;
  ground: THREE.ColorRepresentation;
  ambient?: number;
  key: { color: THREE.ColorRepresentation; intensity?: number; pos: Vec3; target?: Vec3 };
  /** Lumières ponctuelles colorées (sans ombre). */
  points?: { color: THREE.ColorRepresentation; intensity: number; pos: Vec3; distance?: number }[];
}

/** Placement d'un objet posé au sol : base (x, z) et taille à l'écran. */
export interface Standing {
  x: number;
  z: number;
  w: number;
  h: number;
}

/** Rectangle écran projeté sur un plan vertical z = cste. */
export interface Fitted {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
}

type Check = (c: Condition | undefined) => boolean;
type Tick = (t: number, dt: number) => void;

export class Stage {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  private conditional: { cond: Condition; obj: THREE.Object3D }[] = [];
  private spots = new Map<string, THREE.Object3D[]>();
  private ticks: Tick[] = [];
  private lit: { mat: THREE.MeshToonMaterial; base: THREE.Color }[] = [];
  private highlighted: string | null = null;
  private raycaster = new THREE.Raycaster();
  private check: Check = () => true;

  constructor(
    readonly def: SceneDef,
    cam: CameraSpec,
    readonly width: number,
    readonly height: number,
  ) {
    this.camera = new THREE.PerspectiveCamera(cam.fov ?? 50, width / height, 0.1, 100);
    this.camera.position.set(...cam.pos);
    this.camera.lookAt(...cam.look);
    this.camera.updateMatrixWorld();
  }

  // ── écran ⇄ monde ────────────────────────────────────────────────────

  /** Point d'intersection du rayon caméra passant par le pixel (x, y) avec un plan. */
  hit(x: number, y: number, plane: THREE.Plane): THREE.Vector3 {
    const ndc = new THREE.Vector2((x / this.width) * 2 - 1, -(y / this.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const out = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(plane, out)) out.copy(this.raycaster.ray.at(10, out));
    return out;
  }

  /** Point du sol (y = floorY) sous le pixel. */
  floorAt(x: number, y: number, floorY = 0): THREE.Vector3 {
    return this.hit(x, y, new THREE.Plane(new THREE.Vector3(0, 1, 0), -floorY));
  }

  /** Point du plan vertical z = cste sous le pixel. */
  wallAt(x: number, y: number, z: number): THREE.Vector3 {
    return this.hit(x, y, new THREE.Plane(new THREE.Vector3(0, 0, 1), -z));
  }

  /** Projette un rectangle écran sur le plan z = cste (centre + taille monde). */
  fit(rect: Rect, z: number): Fitted {
    const [x, y, w, h] = rect;
    const a = this.wallAt(x, y, z);
    const b = this.wallAt(x + w, y + h, z);
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z, w: Math.abs(b.x - a.x), h: Math.abs(a.y - b.y) };
  }

  /** Projette un rectangle écran sur le plan vertical x = cste (mur latéral). */
  fitX(rect: Rect, x: number): { x: number; y: number; z: number; d: number; h: number } {
    const [rx, ry, w, h] = rect;
    const plane = new THREE.Plane(new THREE.Vector3(1, 0, 0), -x);
    const pts = [this.hit(rx, ry, plane), this.hit(rx + w, ry + h, plane), this.hit(rx, ry + h, plane), this.hit(rx + w, ry, plane)];
    const zs = pts.map((p) => p.z);
    const ys = pts.map((p) => p.y);
    const [z0, z1, y0, y1] = [Math.min(...zs), Math.max(...zs), Math.min(...ys), Math.max(...ys)];
    return { x, y: (y0 + y1) / 2, z: (z0 + z1) / 2, d: z1 - z0, h: y1 - y0 };
  }

  /**
   * Projette un rectangle écran sur le plan local z = 0 d'un objet orienté
   * quelconque (pupitre incliné…). Renvoie centre et taille en coordonnées locales.
   */
  fitIn(rect: Rect, obj: THREE.Object3D): { x: number; y: number; w: number; h: number } {
    obj.updateWorldMatrix(true, false);
    const normal = new THREE.Vector3(0, 0, 1).transformDirection(obj.matrixWorld);
    const origin = new THREE.Vector3().setFromMatrixPosition(obj.matrixWorld);
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, origin);
    const [x, y, w, h] = rect;
    const pts = [
      [x, y],
      [x + w, y],
      [x, y + h],
      [x + w, y + h],
    ].map(([px, py]) => obj.worldToLocal(this.hit(px, py, plane)));
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
  }

  /** Objet posé au sol dont la silhouette remplit `rect` à l'écran. */
  stand(rect: Rect, floorY = 0): Standing {
    const [x, y, w, h] = rect;
    const base = this.floorAt(x + w / 2, y + h, floorY);
    const f = this.fit(rect, base.z);
    return { x: base.x, z: base.z, w: f.w, h: f.y + f.h / 2 - floorY };
  }

  /** Ancre 3D → pixel écran (pour des hotspots projetés, gros plans futurs). */
  project(p: THREE.Vector3): [x: number, y: number] {
    const v = p.clone().project(this.camera);
    return [((v.x + 1) / 2) * this.width, ((1 - v.y) / 2) * this.height];
  }

  /** Rectangle d'un hotspot ou d'une sortie du YAML. */
  rect(id: string): Rect {
    const r = this.def.hotspots?.find((h) => h.id === id)?.rect ?? this.def.exits?.find((e) => e.id === id)?.rect;
    if (!r) throw new Error(`[3D] ${this.def.id} : hotspot/sortie « ${id} » introuvable`);
    return r;
  }

  // ── contenu ──────────────────────────────────────────────────────────

  add(...objs: THREE.Object3D[]): this {
    this.scene.add(...objs);
    return this;
  }

  /**
   * Objet visible seulement si la condition est vraie (mêmes clés que le YAML).
   * Un objet déjà rattaché à un parent y reste.
   */
  when(cond: Condition, ...objs: THREE.Object3D[]): this {
    for (const obj of objs) {
      if (!obj.parent) this.scene.add(obj);
      this.conditional.push({ cond, obj });
    }
    return this;
  }

  /**
   * Objets liés à un hotspot : suivent sa condition `if` du YAML et
   * s'illuminent au survol. Un objet déjà rattaché (ex. à un pupitre) y reste.
   */
  spot(id: string, ...objs: THREE.Object3D[]): this {
    if (!this.def.hotspots?.some((h) => h.id === id)) throw new Error(`[3D] ${this.def.id} : hotspot « ${id} » introuvable`);
    const cond = this.def.hotspots.find((h) => h.id === id)?.if;
    const members = this.spots.get(id) ?? [];
    for (const obj of objs) {
      if (!obj.parent) this.scene.add(obj);
      if (cond) this.conditional.push({ cond, obj });
      members.push(obj);
    }
    this.spots.set(id, members);
    return this;
  }

  /** Animation appelée à chaque image (t en secondes). */
  animate(fn: Tick): this {
    this.ticks.push(fn);
    return this;
  }

  lights(l: LightSpec): this {
    this.scene.add(new THREE.HemisphereLight(l.sky, l.ground, l.ambient ?? 1.4));
    const key = new THREE.DirectionalLight(l.key.color, l.key.intensity ?? 2.6);
    key.position.set(...l.key.pos);
    key.target.position.set(...(l.key.target ?? [0, 0, 0]));
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.0008;
    key.shadow.normalBias = 0.02;
    const sc = key.shadow.camera;
    sc.left = sc.bottom = -12;
    sc.right = sc.top = 12;
    sc.near = 0.5;
    sc.far = 60;
    this.scene.add(key, key.target);
    for (const p of l.points ?? []) {
      const pl = new THREE.PointLight(p.color, p.intensity, p.distance ?? 12, 1.6);
      pl.position.set(...p.pos);
      this.scene.add(pl);
    }
    return this;
  }

  // ── cycle de vie (appelé par RoomRenderer) ─────────────────────────────

  /** Évalue une condition sur l'état courant (utile dans les animations). */
  is(cond: Condition | undefined): boolean {
    return this.check(cond);
  }

  sync(check: Check): void {
    this.check = check;
    // un objet peut cumuler plusieurs conditions (hotspot + état) : toutes doivent être vraies
    const visible = new Map<THREE.Object3D, boolean>();
    for (const { cond, obj } of this.conditional) visible.set(obj, (visible.get(obj) ?? true) && check(cond));
    for (const [obj, v] of visible) obj.visible = v;
  }

  tick(t: number, dt: number): void {
    for (const f of this.ticks) f(t, dt);
  }

  highlight(id: string | null): void {
    if (id === this.highlighted) return;
    for (const { mat, base } of this.lit) mat.emissive.copy(base);
    this.lit = [];
    this.highlighted = id;
    const members = id ? (this.spots.get(id) ?? []) : [];
    for (const g of members) {
      g.traverse((o) => {
        const m = (o as THREE.Mesh).material;
        if (m instanceof THREE.MeshToonMaterial && !this.lit.some((l) => l.mat === m)) {
          this.lit.push({ mat: m, base: m.emissive.clone() });
          m.emissive.set(0x2a2a1a);
        }
      });
    }
  }
}
