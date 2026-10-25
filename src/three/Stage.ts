// Une vue fixe en 3D : caméra figée + décor + objets liés aux hotspots YAML.
// Les zones cliquables restent les `rect` du YAML (coordonnées écran) ; les
// helpers ci-dessous projettent ces rectangles dans la pièce pour que le
// décor 3D tombe exactement sous les hotspots.
import * as THREE from 'three';
import type { Condition, Rect, SceneDef } from '../engine/types';
import { Vignette } from './kit';

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
  /** Contre-jour coloré (directionnel, sans ombre) : découpe les silhouettes. */
  rim?: { color: THREE.ColorRepresentation; intensity?: number; pos: Vec3 };
  /** Débouché opposé à la clé (directionnel, sans ombre), teinte froide. */
  fill?: { color: THREE.ColorRepresentation; intensity?: number; pos: Vec3 };
  /** Brouillard de profondeur (le fond s'enfonce dans la teinte de la pièce). */
  fog?: { color: THREE.ColorRepresentation; near: number; far: number };
  /** Vignette teintée de passe finale (+ voile chaud optionnel). */
  vignette?: { color?: string; strength?: number; warm?: string };
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

/** Cadrage caméra d'une vue (pièce ou gros plan filmé dans le même décor). */
interface Pose {
  pos: THREE.Vector3;
  quat: THREE.Quaternion;
  fov: number;
}

/** Travel caméra en cours entre deux vues. */
interface Travel {
  from: Pose;
  to: Pose;
  /** Hauteur de l'arc (monde) au milieu du trajet. */
  lift: number;
  /** Dose de vignette serrée au départ / à l'arrivée. */
  focus: readonly [number, number];
  k: number;
  dur: number;
  done: () => void;
}

const TRAVEL_S = 1.0;
const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

export class Stage {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  private conditional: { cond: Condition; obj: THREE.Object3D }[] = [];
  /** Vues filmées dans ce décor : id de scène YAML → cadrage. */
  private views = new Map<string, Pose>();
  /** Scène YAML dont la caméra est active (hotspots surlignables). */
  private viewId: string;
  /** Scène YAML en cours de construction (rect / spot la consultent). */
  private building: SceneDef;
  private travel: Travel | null = null;
  private spots = new Map<string, THREE.Object3D[]>();
  private ticks: Tick[] = [];
  private lit: { mat: THREE.MeshToonMaterial; base: THREE.Color }[] = [];
  private highlighted: string | null = null;
  private raycaster = new THREE.Raycaster();
  private check: Check = () => true;
  /** Vrai quand l'image doit être recalculée (état, survol, première frame). */
  dirty = true;
  /** Passe finale (vignette) rendue par RoomRenderer après la scène. */
  vignette: Vignette | null = null;
  /** Vignette serrée des gros plans (le décor s'assombrit en bord de cadre). */
  focus: Vignette | null = null;
  /** Dose de `focus` : 0 en vue pièce, 1 en gros plan. */
  focusAmount = 0;
  /** Gros plans filmés ici : id de scène YAML → objet filmé (pour le clic « à côté »). */
  private closeups = new Map<string, THREE.Object3D>();

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
    this.building = def;
    this.viewId = def.id;
    this.views.set(def.id, this.pose());
  }

  // ── vues & travel caméra ─────────────────────────────────────────────

  private pose(): Pose {
    return { pos: this.camera.position.clone(), quat: this.camera.quaternion.clone(), fov: this.camera.fov };
  }

  private apply(p: Pose): void {
    this.camera.position.copy(p.pos);
    this.camera.quaternion.copy(p.quat);
    if (this.camera.fov !== p.fov) {
      this.camera.fov = p.fov;
      this.camera.updateProjectionMatrix();
    }
    this.camera.updateMatrixWorld();
    this.dirty = true;
  }

  private place(cam: CameraSpec, frame?: THREE.Matrix4): Pose {
    const pos = new THREE.Vector3(...cam.pos);
    const look = new THREE.Vector3(...cam.look);
    if (frame) {
      pos.applyMatrix4(frame);
      look.applyMatrix4(frame);
    }
    const m = new THREE.Matrix4().lookAt(pos, look, new THREE.Vector3(0, 1, 0));
    return { pos, quat: new THREE.Quaternion().setFromRotationMatrix(m), fov: cam.fov ?? 50 };
  }

  /**
   * Gros plan d'une autre scène YAML filmé dans ce décor. `build` construit le
   * contenu dans un repère local (groupe renvoyé, encore à l'identité pendant
   * la construction) comme si la caméra était `cam` : les rect du YAML se
   * projettent donc comme dans une pièce à part. Le groupe peut ensuite être
   * déplacé / mis à l'échelle (similitude) : la vue suit le même repère, si
   * bien que les hotspots du gros plan restent exactement sous les objets.
   */
  closeup(def: SceneDef, cam: CameraSpec, build: (s: Stage) => THREE.Object3D): void {
    const room = this.pose();
    const host = this.building;
    this.apply(this.place(cam));
    this.building = def;
    try {
      const rig = build(this);
      if (!rig.parent) this.scene.add(rig);
      rig.updateMatrixWorld(true);
      this.views.set(def.id, this.place(cam, rig.matrixWorld));
      this.closeups.set(def.id, rig);
      this.focus ??= new Vignette({ color: '#06030e', strength: 0.8 });
    } finally {
      this.building = host;
      this.apply(room);
    }
  }

  /**
   * En gros plan : vrai si le pixel (x, y) tombe sur l'objet filmé. Hors gros
   * plan (ou pendant un travel) : toujours vrai.
   */
  onSubject(x: number, y: number): boolean {
    const subject = this.closeups.get(this.viewId);
    if (!subject || this.travel) return true;
    const ndc = new THREE.Vector2((x / this.width) * 2 - 1, -(y / this.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    // maillages seulement (les contours LineSegments ont un seuil de picking trop large)
    const shown = (o: THREE.Object3D | null): boolean => !o || (o.visible && shown(o.parent));
    return this.raycaster.intersectObject(subject, true).some((h) => h.object instanceof THREE.Mesh && shown(h.object));
  }

  /** Vrai si la scène YAML `id` est une vue de ce décor. */
  films(id: string): boolean {
    return this.views.has(id);
  }

  /** Cadre la vue `id` sans transition (sauf si un travel y mène déjà). */
  view(id: string): void {
    const p = this.views.get(id);
    if (!p || (id === this.viewId && (this.travel || this.camera.position.equals(p.pos)))) return;
    this.travel?.done();
    this.travel = null;
    this.highlight(null);
    this.viewId = id;
    this.focusAmount = this.closeups.has(id) ? 1 : 0;
    this.apply(p);
  }

  /** Travel caméra (dolly + léger arc, easing) vers la vue `id`. */
  travelTo(id: string, dur = TRAVEL_S): Promise<void> {
    const to = this.views.get(id);
    if (!to) return Promise.resolve();
    this.travel?.done();
    this.highlight(null);
    this.viewId = id;
    return new Promise((resolve) => {
      const from = this.pose();
      const focus = [this.focusAmount, this.closeups.has(id) ? 1 : 0] as const;
      this.travel = { from, to, focus, lift: Math.min(0.6, from.pos.distanceTo(to.pos) * 0.06), k: 0, dur, done: resolve };
      this.dirty = true;
    });
  }

  private stepTravel(dt: number): void {
    const tr = this.travel;
    if (!tr) return;
    tr.k = Math.min(1, tr.k + dt / tr.dur);
    const e = easeInOut(tr.k);
    this.camera.position.lerpVectors(tr.from.pos, tr.to.pos, e);
    this.camera.position.y += Math.sin(Math.PI * e) * tr.lift;
    this.camera.quaternion.slerpQuaternions(tr.from.quat, tr.to.quat, e);
    const fov = THREE.MathUtils.lerp(tr.from.fov, tr.to.fov, e);
    if (fov !== this.camera.fov) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
    this.camera.updateMatrixWorld();
    this.focusAmount = THREE.MathUtils.lerp(tr.focus[0], tr.focus[1], e);
    if (tr.k >= 1) {
      this.travel = null;
      tr.done();
    }
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
    const def = this.building;
    const r = def.hotspots?.find((h) => h.id === id)?.rect ?? def.exits?.find((e) => e.id === id)?.rect;
    if (!r) throw new Error(`[3D] ${def.id} : hotspot/sortie « ${id} » introuvable`);
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
    const def = this.building;
    if (!def.hotspots?.some((h) => h.id === id)) throw new Error(`[3D] ${def.id} : hotspot « ${id} » introuvable`);
    const cond = def.hotspots.find((h) => h.id === id)?.if;
    const key = `${def.id}/${id}`;
    const members = this.spots.get(key) ?? [];
    for (const obj of objs) {
      if (!obj.parent) this.scene.add(obj);
      if (cond) this.conditional.push({ cond, obj });
      members.push(obj);
    }
    this.spots.set(key, members);
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
    for (const d of [l.rim, l.fill]) {
      if (!d) continue;
      const dl = new THREE.DirectionalLight(d.color, d.intensity ?? 1.2);
      dl.position.set(...d.pos);
      this.scene.add(dl);
    }
    if (l.fog) this.scene.fog = new THREE.Fog(l.fog.color, l.fog.near, l.fog.far);
    this.vignette = new Vignette(l.vignette);
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
    this.dirty = true;
  }

  /** Vrai si la pièce a des animations : elle se rend alors à chaque image. */
  get animated(): boolean {
    return this.ticks.length > 0 || !!this.travel;
  }

  tick(t: number, dt: number): void {
    this.stepTravel(dt);
    for (const f of this.ticks) f(t, dt);
  }

  highlight(id: string | null): void {
    if (id === this.highlighted) return;
    for (const { mat, base } of this.lit) mat.emissive.copy(base);
    this.lit = [];
    this.highlighted = id;
    this.dirty = true;
    const members = id ? (this.spots.get(`${this.viewId}/${id}`) ?? []) : [];
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
