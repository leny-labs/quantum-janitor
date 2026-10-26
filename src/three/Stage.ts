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

/** Cadrage caméra : position, point regardé, focale. */
interface Pose {
  pos: THREE.Vector3;
  look: THREE.Vector3;
  fov: number;
}

/**
 * Travel d'examen : la caméra glisse vers un objet de la pièce pendant sa
 * réplique « Regarder », puis revient. Sans `cam`, le cadrage est calculé
 * depuis le rect du hotspot (rayon caméra → objet, recul pour qu'il occupe
 * `fill` de la hauteur de l'image).
 */
export interface ShotSpec {
  /** Part de la hauteur d'image occupée par l'objet (défaut 0.6). */
  fill?: number;
  /** Rotation de la caméra autour de l'objet (degrés, axe vertical ; + = sens trigonométrique vu du dessus). */
  orbit?: number;
  /** Décalage vertical de la caméra (grue), en mètres. */
  lift?: number;
  /** Pixel visé dans la vue pièce (défaut : centre du rect) — pour viser un objet fin ou creux. */
  px?: [x: number, y: number];
  /** Décalage du point regardé (cadrage décentré, contexte). */
  aim?: Vec3;
  fov?: number;
  /** Cadrage explicite (prioritaire sur le calcul automatique). */
  cam?: CameraSpec;
}

/** Travel caméra en cours. */
interface Travel {
  from: Pose;
  to: Pose;
  /** Point de contrôle de l'arc (Bézier quadratique : dolly + grue + léger panoramique). */
  ctrl: THREE.Vector3;
  /** Amplitude du petit dépassement / retour à l'arrivée (fraction du trajet). */
  settle: number;
  ease: (k: number) => number;
  /** Dose de vignette serrée au départ / à l'arrivée. */
  focus: readonly [number, number];
  k: number;
  dur: number;
  done: () => void;
}

/** Durées (s) : gros plan aller / retour, examen aller / retour. */
const CLOSEUP_IN = 1.3;
const CLOSEUP_OUT = 1.0;
const SHOT_IN = 1.15;
const SHOT_OUT = 0.85;
/** Vignette d'un travel d'examen (le gros plan « vue » est à 1). */
const SHOT_FOCUS = 0.55;

const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);
/** Bosse lisse en fin de course (0 → ~0.54 → 0, dérivées nulles aux bords) : dépassement puis retour. */
const settleBump = (k: number) => {
  const r = (k - 0.66) / 0.34;
  return r <= 0 || r >= 1 ? 0 : Math.pow(Math.sin(Math.PI * r), 2) * (1 - r);
};
const UP = new THREE.Vector3(0, 1, 0);

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
  /** Point regardé par la caméra (interpolé séparément de la position pendant un travel). */
  private looking = new THREE.Vector3();
  /** Travels d'examen déclarés : `scène/hotspot` → cadrage. */
  private shotSpecs = new Map<string, ShotSpec>();
  private shotPoses = new Map<string, Pose>();
  /** Examen en cours (`scène/hotspot`), sinon null. */
  private shotKey: string | null = null;
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
    this.building = def;
    this.apply(this.place(cam));
    this.viewId = def.id;
    this.views.set(def.id, this.pose());
  }

  // ── vues & travel caméra ─────────────────────────────────────────────

  private pose(): Pose {
    return { pos: this.camera.position.clone(), look: this.looking.clone(), fov: this.camera.fov };
  }

  private aim(pos: THREE.Vector3, look: THREE.Vector3, fov: number): void {
    this.camera.position.copy(pos);
    this.looking.copy(look);
    this.camera.up.copy(UP);
    this.camera.lookAt(look);
    if (this.camera.fov !== fov) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
    this.camera.updateMatrixWorld();
    this.dirty = true;
  }

  private apply(p: Pose): void {
    this.aim(p.pos, p.look, p.fov);
  }

  private place(cam: CameraSpec, frame?: THREE.Matrix4): Pose {
    const pos = new THREE.Vector3(...cam.pos);
    const look = new THREE.Vector3(...cam.look);
    if (frame) {
      pos.applyMatrix4(frame);
      look.applyMatrix4(frame);
    }
    return { pos, look, fov: cam.fov ?? 50 };
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

  /** Cadre la vue `id` sans transition (sauf si un travel ou un examen y est déjà en cours). */
  view(id: string): void {
    const p = this.views.get(id);
    if (!p) return;
    if (id === this.viewId && (this.travel || this.shotKey || this.camera.position.equals(p.pos))) return;
    this.travel?.done();
    this.travel = null;
    this.shotKey = null;
    this.highlight(null);
    this.viewId = id;
    this.focusAmount = this.closeups.has(id) ? 1 : 0;
    this.apply(p);
  }

  /** Travel caméra vers la vue `id` (pièce ⇄ gros plan). */
  travelTo(id: string): Promise<void> {
    const to = this.views.get(id);
    if (!to) return Promise.resolve();
    const inward = this.closeups.has(id);
    this.viewId = id;
    this.shotKey = null;
    return this.fly(to, inward ? 1 : 0, inward ? CLOSEUP_IN : CLOSEUP_OUT, inward ? 0.05 : 0.02);
  }

  /** Durée (s) d'un travel vers la vue `id` (pour caler un bruitage). */
  travelTime(id: string): number {
    return this.closeups.has(id) ? CLOSEUP_IN : CLOSEUP_OUT;
  }

  // ── travels d'examen ─────────────────────────────────────────────────

  /** Déclare des travels d'examen sur des hotspots de la scène `sceneId`. */
  shots(sceneId: string, specs: Record<string, ShotSpec>): void {
    for (const [id, spec] of Object.entries(specs)) this.shotSpecs.set(`${sceneId}/${id}`, spec);
  }

  /** Vrai si le hotspot `id` de la vue courante a un travel d'examen. */
  hasShot(id: string): boolean {
    return this.shotSpecs.has(`${this.viewId}/${id}`);
  }

  /** Examen en cours (id du hotspot) ou null. */
  get examining(): string | null {
    return this.shotKey?.split('/')[1] ?? null;
  }

  /** La caméra glisse vers le hotspot `id` (instantané si `instant`). Null s'il n'a pas de travel. */
  examine(id: string, instant = false): Promise<void> | null {
    const key = `${this.viewId}/${id}`;
    const spec = this.shotSpecs.get(key);
    if (!spec) return null;
    let to = this.shotPoses.get(key);
    if (!to) {
      to = this.frame(id, spec);
      this.shotPoses.set(key, to);
    }
    this.shotKey = key;
    if (instant) {
      this.travel?.done();
      this.travel = null;
      this.focusAmount = SHOT_FOCUS;
      this.apply(to);
      return Promise.resolve();
    }
    return this.fly(to, SHOT_FOCUS, SHOT_IN, 0.045);
  }

  /** Fin d'examen : retour à la vue courante. Null s'il n'y avait pas d'examen. */
  release(): Promise<void> | null {
    const to = this.views.get(this.viewId);
    if (!this.shotKey || !to) return null;
    this.shotKey = null;
    return this.fly(to, this.closeups.has(this.viewId) ? 1 : 0, SHOT_OUT, 0.02);
  }

  /** Durées (s) d'un travel d'examen aller / retour. */
  static readonly SHOT_TIMES = { in: SHOT_IN, out: SHOT_OUT } as const;

  /**
   * Cadrage automatique d'un hotspot : rayon depuis la caméra de la pièce
   * par le centre du rect → premier objet touché ; la caméra se rapproche
   * sur cet axe (± orbite, grue) jusqu'à ce que l'objet occupe `fill` de
   * l'image, sans traverser le décor.
   */
  private frame(id: string, spec: ShotSpec): Pose {
    const room = this.views.get(this.viewId)!;
    if (spec.cam) return this.place(spec.cam);
    const def = this.viewId === this.def.id ? this.def : null;
    const r = def?.hotspots?.find((h) => h.id === id)?.rect;
    if (!r) throw new Error(`[3D] ${this.viewId} : hotspot « ${id} » introuvable pour le travel`);
    const probe = new THREE.PerspectiveCamera(room.fov, this.width / this.height, 0.1, 100);
    probe.position.copy(room.pos);
    probe.lookAt(room.look);
    probe.updateMatrixWorld();
    const [x, y, w, h] = r;
    const [vx, vy] = spec.px ?? [x + w / 2, y + h / 2];
    this.raycaster.setFromCamera(new THREE.Vector2((vx / this.width) * 2 - 1, -(vy / this.height) * 2 + 1), probe);
    const solid = (o: THREE.Object3D) => {
      if (!(o instanceof THREE.Mesh)) return false;
      const m = o.material as THREE.Material;
      for (let p: THREE.Object3D | null = o; p; p = p.parent) if (!p.visible) return false;
      return !m.transparent;
    };
    const hit = this.raycaster.intersectObject(this.scene, true).find((i) => solid(i.object));
    const target = hit?.point.clone() ?? this.raycaster.ray.at(6, new THREE.Vector3());
    const d0 = target.distanceTo(room.pos);
    // taille monde du rect à la distance de l'objet, puis recul voulu
    const px = (2 * d0 * Math.tan(THREE.MathUtils.degToRad(room.fov / 2))) / this.height;
    const fov = spec.fov ?? room.fov - 8;
    const needH = (Math.max(h, (w * this.height) / this.width) * px) / (spec.fill ?? 0.6);
    const dist = THREE.MathUtils.clamp(needH / (2 * Math.tan(THREE.MathUtils.degToRad(fov / 2))), 1.1, d0 * 0.8);
    const dir = room.pos.clone().sub(target).normalize().applyAxisAngle(UP, THREE.MathUtils.degToRad(spec.orbit ?? 0));
    const look = target.clone().add(new THREE.Vector3(...(spec.aim ?? [0, 0, 0])));
    const pos = target.clone().addScaledVector(dir, dist);
    pos.y = THREE.MathUtils.clamp(pos.y + (spec.lift ?? 0), 0.5, 3.4);
    // pas de décor entre l'objet et la caméra
    const back = pos.clone().sub(look);
    const len = back.length();
    this.raycaster.set(look, back.normalize());
    const block = this.raycaster.intersectObject(this.scene, true).find((i) => i.distance > 0.35 && solid(i.object));
    if (block && block.distance < len) pos.copy(look).addScaledVector(back, Math.max(0.8, block.distance - 0.3));
    return { pos, look, fov };
  }

  /**
   * Vol de caméra vers `to` : position sur un arc (Bézier quadratique :
   * dolly + grue + léger panoramique latéral), regard interpolé à part et
   * en avance (il arrive ~20 % plus tôt), focale qui s'ouvre un peu à
   * mi-course, petit dépassement / retour à l'arrivée. Un vol lancé pendant
   * un autre repart de la position courante sans à-coup (départ lancé).
   */
  private fly(to: Pose, focusTo: number, dur: number, settle: number): Promise<void> {
    const prev = this.travel;
    prev?.done();
    this.travel = null;
    this.highlight(null);
    const from = this.pose();
    const dist = from.pos.distanceTo(to.pos);
    if (dist < 1e-3 && from.look.distanceTo(to.look) < 1e-3) {
      this.focusAmount = focusTo;
      this.apply(to);
      return Promise.resolve();
    }
    let ease = easeInOut;
    if (prev) {
      // on est déjà en mouvement : départ lancé, durée au prorata du chemin restant
      const span = prev.from.pos.distanceTo(prev.to.pos) || dist;
      dur *= THREE.MathUtils.clamp(dist / span, 0.45, 1);
      ease = easeOut;
    }
    // arc : un peu de hauteur, et un panoramique du côté où la caméra rapprochée est décalée (3/4)
    const close = focusTo >= this.focusAmount ? to : from;
    const path = to.pos.clone().sub(from.pos);
    const side = new THREE.Vector3(-path.z, 0, path.x);
    const lat = close.pos.clone().sub(close.look).setY(0);
    if (side.lengthSq() > 1e-6) side.normalize().multiplyScalar(Math.sign(side.dot(lat)) || 1);
    const ctrl = from.pos
      .clone()
      .lerp(to.pos, 0.5)
      .addScaledVector(UP, Math.min(0.45, dist * 0.07))
      .addScaledVector(side, dist * 0.1);
    return new Promise((resolve) => {
      this.travel = { from, to, ctrl, settle, ease, focus: [this.focusAmount, focusTo], k: 0, dur, done: resolve };
      this.dirty = true;
    });
  }

  private stepTravel(dt: number): void {
    const tr = this.travel;
    if (!tr) return;
    tr.k = Math.min(1, tr.k + dt / tr.dur);
    const e = tr.ease(tr.k);
    // position : arc + dépassement (la Bézier se prolonge naturellement au-delà de 1)
    const s = e + tr.settle * settleBump(tr.k);
    const a = (1 - s) * (1 - s);
    const b = 2 * (1 - s) * s;
    const c = s * s;
    const pos = new THREE.Vector3()
      .addScaledVector(tr.from.pos, a)
      .addScaledVector(tr.ctrl, b)
      .addScaledVector(tr.to.pos, c);
    // regard : en avance sur la position
    const look = new THREE.Vector3().lerpVectors(tr.from.look, tr.to.look, tr.ease(Math.min(1, tr.k / 0.8)));
    // focale : interpolée + légère ouverture à mi-course (sensation de poussée, pas de « zoom tunnel »)
    const fov = THREE.MathUtils.lerp(tr.from.fov, tr.to.fov, e) + Math.sin(Math.PI * Math.min(1, e)) * 3;
    this.aim(pos, look, fov);
    this.focusAmount = THREE.MathUtils.lerp(tr.focus[0], tr.focus[1], Math.min(1, e));
    if (tr.k >= 1) {
      this.travel = null;
      this.apply(tr.to);
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
