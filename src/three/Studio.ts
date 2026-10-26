// Studio photo : rend les props 3D en petites images (icônes d'inventaire,
// portraits de dialogue) une seule fois, puis les enregistre comme textures
// Phaser. L'UI garde ainsi le même trait toon que les pièces.
//
// Portraits parlants : chaque personnage est aussi shooté en planche de sprites
// (boucle idle + boucle talk, voir SHEET). `npm run bake:portraits` écrit ces
// planches dans public/portraits/ ; un PNG présent là (bake ou remplacement
// GenAI au même layout) prime sur le bake runtime. Les planches GenAI
// (GENAI_SHEETS) ne sont jamais rebakées.
import Phaser from 'phaser';
import * as THREE from 'three';
import { at, cyl, glow } from './kit';
import type { Mood } from '../engine/mood';
import { badge, bob, fusible, gary, roach, sandwich, seau, serpilliere, setFace, sylvie, type FacePose } from './props';

export const iconKey = (id: string) => `icon3d:${id}`;
export const portraitKey = (id: string) => `portrait3d:${id}`;
export const sheetKey = (id: string) => `portraitSheet:${id}`;
/** Chemin (relatif au site) de la planche de sprites d'un personnage. */
export const sheetUrl = (id: string) => `portraits/${id}-sheet.png`;
/** Calque animé collé par-dessus la planche (ex. drone dorsal de Gary). */
export const overlayKey = (id: string) => `portraitOverlay:${id}`;
export const overlayUrl = (id: string) => `portraits/${id}-robot.png`;

/** Une frame de planche : expression + micro-mouvement du buste. */
interface SheetFrame extends FacePose {
  /** Inclinaison latérale / hochement (radians), respiration (0..1). */
  tilt: number;
  nod: number;
  breath: number;
}

/**
 * Layout des planches (contrat partagé avec docs/PORTRAIT_GENAI.md) :
 * grille 4 × 2 de frames carrées, lue ligne par ligne.
 *   ligne 1 : idle0 (neutre) · idle1 (clignement) · idle2 (inspire) · idle3 (tête penchée)
 *   ligne 2 : talk0 (mi-ouvert) · talk1 (grand ouvert) · talk2 (entrouvert) · talk3 (ouvert)
 */
export const SHEET = {
  cols: 4,
  rows: 2,
  frame: 256,
  idle: [
    { frame: 0, duration: 1700 },
    { frame: 1, duration: 90 },
    { frame: 0, duration: 650 },
    { frame: 2, duration: 850 },
    { frame: 0, duration: 400 },
    { frame: 3, duration: 1100 },
    { frame: 2, duration: 450 },
  ],
  // durées irrégulières (~9 i/s en moyenne) : débit de parole, pas métronome
  talk: [
    { frame: 4, duration: 120 },
    { frame: 5, duration: 95 },
    { frame: 6, duration: 135 },
    { frame: 5, duration: 100 },
    { frame: 7, duration: 145 },
    { frame: 4, duration: 90 },
    { frame: 6, duration: 125 },
    { frame: 7, duration: 110 },
  ],
} as const;

const SHEET_FRAMES: SheetFrame[] = [
  { mouth: 0, blink: false, phase: 0, tilt: 0, nod: 0, breath: 0 },
  { mouth: 0, blink: true, phase: 0, tilt: 0, nod: 0, breath: 0 },
  { mouth: 0, blink: false, phase: 0.5, tilt: 0.012, nod: -0.012, breath: 1 },
  { mouth: 0, blink: false, phase: 1, tilt: -0.04, nod: 0.015, breath: 0.4 },
  { mouth: 0.5, blink: false, phase: 1.6, tilt: 0.01, nod: -0.02, breath: 0.3 },
  { mouth: 1, blink: false, phase: 2.7, tilt: 0.025, nod: 0.03, breath: 0.6 },
  { mouth: 0.22, blink: false, phase: 3.9, tilt: -0.01, nod: -0.01, breath: 0.2 },
  { mouth: 0.78, blink: false, phase: 5.2, tilt: -0.025, nod: 0.02, breath: 0.5 },
];

interface Pose {
  build: () => THREE.Object3D;
  /** Point visé et distance de la caméra. */
  look: [number, number, number];
  dist: number;
  /** Azimut / élévation (radians). */
  yaw?: number;
  pitch?: number;
  rim?: string;
}

const ICONS: Record<string, Pose> = {
  seau: {
    build: () => {
      const g = seau(1, 1.1);
      g.add(at(cyl(0.42, 0.42, 0.02, '#9cff57', { glow: true, edges: false }), 0, 0.84, 0));
      return g;
    },
    // cadre assez haut pour l'anse entière (sommet ≈ y 1.3)
    look: [0, 0.62, 0],
    dist: 3.1,
    pitch: 0.42,
    rim: '#7fffd4',
  },
  serpilliere: {
    build: () => {
      const g = serpilliere(1.6);
      g.rotation.z = -0.65;
      return g;
    },
    look: [0.3, 0.6, 0],
    dist: 2.6,
    rim: '#ffd166',
  },
  badge: { build: () => badge(0.8), look: [0, 0.6, 0], dist: 2.2, yaw: -0.35, pitch: 0.12, rim: '#7fffd4' },
  sandwich: { build: () => sandwich(1), look: [0, 0.12, 0], dist: 2.1, pitch: 0.75, rim: '#ff8ab8' },
  fusible: { build: () => fusible(1.1), look: [0, 0, 0], dist: 2, yaw: -0.3, pitch: 0.35, rim: '#ff5c7a' },
};

const PORTRAITS: Record<string, Pose & { bg: [string, string] }> = {
  gary: { build: () => gary(1.6), look: [0, 1.0, 0], dist: 2.5, yaw: 0.35, pitch: 0.05, bg: ['#ff8c42', '#3a1240'], rim: '#7fffd4' },
  bob: {
    build: () => {
      const g = bob(1.2);
      // face avant relevée vers l'objectif : yeux + plaque LED dans le cadre
      g.rotation.x = -0.3;
      return g;
    },
    look: [0.05, 0.3, 0],
    dist: 2.7,
    yaw: 0.12,
    pitch: 0.2,
    bg: ['#5a6a8a', '#1a1030'],
    rim: '#ff5c7a',
  },
  sylvie: { build: () => sylvie(1.4), look: [0, 0.7, 0], dist: 2.4, yaw: 0.25, bg: ['#1f7f73', '#0b1430'], rim: '#7fffd4' },
  reine: {
    build: () => {
      const g = roach(1.6, true);
      g.rotation.y = -Math.PI / 2 + 0.5;
      return g;
    },
    look: [0.2, 0.35, 0.5],
    dist: 1.9,
    pitch: 0.2,
    bg: ['#ffb347', '#3a0f2a'],
    rim: '#9cff57',
  },
};

/** Ids des personnages ayant un portrait (et donc une planche). */
export const PORTRAIT_IDS = Object.keys(PORTRAITS);
/**
 * Planches GenAI (docs/PORTRAIT_GENAI.md) : jamais rebakées, ni par
 * `bake:portraits` ni au runtime — le 3D suit l'image, pas l'inverse.
 */
export const GENAI_SHEETS: ReadonlySet<string> = new Set(['gary', 'sylvie', 'bob']);

function makeRenderer(): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);
  return renderer;
}

function disposeRenderer(renderer: THREE.WebGLRenderer): void {
  renderer.dispose();
  renderer.forceContextLoss();
}

/**
 * Prépare la scène d'un pose et renvoie une fonction de prise de vue ;
 * `f` (planches) anime l'expression et le buste avant chaque rendu.
 */
function studio(renderer: THREE.WebGLRenderer, pose: Pose, bg?: [string, string]) {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#b8b0ff', '#2a1640', 1.3));
  const key = new THREE.DirectionalLight('#fff0dc', 3);
  key.position.set(2, 3, 4);
  const rim = new THREE.DirectionalLight(pose.rim ?? '#7fffd4', 2.4);
  rim.position.set(-3, 2, -3);
  scene.add(key, rim);
  if (bg) {
    // fond de portrait : halo coloré + sol de scène
    scene.add(at(glow(bg[0], 6, 0.55), pose.look[0], pose.look[1] + 0.2, -1.6));
  }
  const prop = pose.build();
  // le buste bouge dans un pivot : les rotations propres au pose restent intactes
  const pivot = new THREE.Group();
  pivot.add(prop);
  scene.add(pivot);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
  const yaw = pose.yaw ?? 0.5;
  const pitch = pose.pitch ?? 0.3;
  const [lx, ly, lz] = pose.look;
  cam.position.set(lx + Math.sin(yaw) * Math.cos(pitch) * pose.dist, ly + Math.sin(pitch) * pose.dist, lz + Math.cos(yaw) * Math.cos(pitch) * pose.dist);
  cam.lookAt(lx, ly, lz);
  // axe caméra → sujet, pour pencher la tête « vers » l'objectif
  const view = new THREE.Vector3(lx, ly, lz).sub(cam.position).normalize();
  const side = new THREE.Vector3().crossVectors(view, new THREE.Vector3(0, 1, 0)).normalize();

  const shoot = (out: CanvasRenderingContext2D, x: number, y: number, size: number, f?: SheetFrame) => {
    if (f) {
      setFace(prop, f);
      pivot.quaternion
        .setFromAxisAngle(view, f.tilt)
        .multiply(new THREE.Quaternion().setFromAxisAngle(side, f.nod));
      pivot.scale.set(1 - f.breath * 0.004, 1 + f.breath * 0.012, 1 - f.breath * 0.004);
    }
    renderer.setSize(size, size, false);
    renderer.render(scene, cam);
    if (bg) {
      const grad = out.createLinearGradient(0, y, 0, y + size);
      grad.addColorStop(0, bg[1]);
      grad.addColorStop(1, bg[0]);
      out.fillStyle = grad;
      out.fillRect(x, y, size, size);
      // trames de scanlines, discrètes
      out.fillStyle = 'rgba(7,5,15,0.18)';
      for (let sy = 0; sy < size; sy += 4) out.fillRect(x, y + sy, size, 1);
    }
    out.drawImage(renderer.domElement, x, y, size, size);
  };
  const dispose = () =>
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
    });
  return { shoot, dispose };
}

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

/** Une frame de calque et sa durée (ms). */
export interface OverlayStep {
  frame: number;
  duration: number;
}

/**
 * Calque de portrait (contrat partagé avec docs/PORTRAIT_GENAI.md) : bande de
 * `frames` frames `frameW × frameH` en ligne, dont le coin haut-gauche se pose
 * en (`x`, `y`) d'une cellule de planche de `cell` px. Il joue SA PROPRE
 * timeline, indépendante des boucles idle / talk du personnage ; `talk` est la
 * variante lue pendant que le personnage parle (sans resynchronisation).
 */
export interface PortraitOverlay {
  frames: number;
  frameW: number;
  frameH: number;
  cell: number;
  x: number;
  y: number;
  idle: readonly OverlayStep[];
  talk: readonly OverlayStep[];
}

/**
 * Gary : le drone dorsal est un sprite séparé (planche de base sans robot).
 * Poses : r0 neutre · r1 flotte · r2 haut de flottaison · r3 penche dehors ·
 * r4 regarde Gary · r5 regarde Gary + pulse · r6 obturateur mi-clos · r7 fermé.
 */
export const PORTRAIT_OVERLAYS: Readonly<Record<string, PortraitOverlay>> = {
  gary: {
    frames: 8,
    frameW: 80,
    frameH: 112,
    cell: 256,
    x: 160,
    y: 48,
    // ~8,9 s, volontairement décalée de SHEET.idle
    idle: [
      { frame: 0, duration: 900 },
      { frame: 1, duration: 500 },
      { frame: 2, duration: 700 },
      { frame: 1, duration: 400 },
      { frame: 0, duration: 600 },
      { frame: 3, duration: 800 },
      { frame: 4, duration: 700 },
      { frame: 5, duration: 500 },
      { frame: 4, duration: 400 },
      { frame: 0, duration: 500 },
      { frame: 6, duration: 70 },
      { frame: 7, duration: 110 },
      { frame: 6, duration: 70 },
      { frame: 0, duration: 800 },
    ],
    // Gary parle : le drone le regarde davantage, à son rythme
    talk: [
      { frame: 4, duration: 800 },
      { frame: 5, duration: 450 },
      { frame: 4, duration: 600 },
      { frame: 1, duration: 500 },
      { frame: 2, duration: 600 },
      { frame: 4, duration: 700 },
      { frame: 5, duration: 400 },
      { frame: 4, duration: 500 },
      { frame: 6, duration: 70 },
      { frame: 7, duration: 110 },
      { frame: 6, duration: 70 },
      { frame: 0, duration: 600 },
    ],
  },
};

/** Boucles idle / talk d'une planche (mêmes pas que SHEET). */
export interface SheetLoops {
  idle: readonly OverlayStep[];
  talk: readonly OverlayStep[];
}

/**
 * Planches à humeurs (contrat partagé avec docs/PORTRAIT_GENAI.md) : chaque
 * humeur a ses propres boucles idle / talk dans la planche 4 × 2, à la place
 * de SHEET. SYLVIE : ligne 1 = yeux calm · suspicious · angry · love, ligne 2 =
 * leur variante « accent » (clignement, plissement, tressaillement, cœurs qui
 * battent). Pas de bouche dans la planche : l'onde est procédurale (PORTRAIT_WAVES),
 * donc talk ne change que le rythme des yeux. B.O.B. : sa planche par défaut
 * (SHEET) en calm, paupières mi-closes plus présentes en sad / suspicious, LED
 * qui s'affole en angry ; ses humeurs passent surtout par les sourcils
 * (PORTRAIT_BROWS). Une humeur absente d'un personnage retombe sur `fallback`
 * (planche, onde) : voir portraitMood.
 */
export const PORTRAIT_MOODS: Readonly<Record<string, { fallback: Mood; loops: Readonly<Partial<Record<Mood, SheetLoops>>> }>> = {
  sylvie: {
    fallback: 'calm',
    loops: {
      calm: {
        idle: [
          { frame: 0, duration: 2600 },
          { frame: 4, duration: 110 },
          { frame: 0, duration: 1900 },
          { frame: 4, duration: 90 },
          { frame: 0, duration: 140 },
          { frame: 4, duration: 90 },
        ],
        talk: [
          { frame: 0, duration: 1800 },
          { frame: 4, duration: 100 },
        ],
      },
      suspicious: {
        idle: [
          { frame: 1, duration: 1500 },
          { frame: 5, duration: 700 },
          { frame: 1, duration: 2000 },
          { frame: 5, duration: 300 },
        ],
        talk: [
          { frame: 1, duration: 1200 },
          { frame: 5, duration: 500 },
        ],
      },
      angry: {
        idle: [
          { frame: 2, duration: 900 },
          { frame: 6, duration: 80 },
          { frame: 2, duration: 120 },
          { frame: 6, duration: 80 },
          { frame: 2, duration: 1500 },
        ],
        talk: [
          { frame: 2, duration: 500 },
          { frame: 6, duration: 70 },
          { frame: 2, duration: 300 },
          { frame: 6, duration: 70 },
        ],
      },
      love: {
        // battement de cœur : boum-boum, pause
        idle: [
          { frame: 3, duration: 700 },
          { frame: 7, duration: 140 },
          { frame: 3, duration: 160 },
          { frame: 7, duration: 140 },
        ],
        talk: [
          { frame: 3, duration: 450 },
          { frame: 7, duration: 120 },
          { frame: 3, duration: 130 },
          { frame: 7, duration: 120 },
        ],
      },
    },
  },  bob: {
    fallback: 'calm',
    loops: {
      calm: SHEET,
      // paupières mi-closes qui traînent
      sad: {
        idle: [
          { frame: 3, duration: 2200 },
          { frame: 1, duration: 120 },
          { frame: 3, duration: 1700 },
          { frame: 0, duration: 500 },
        ],
        talk: SHEET.talk,
      },
      suspicious: {
        idle: [
          { frame: 0, duration: 900 },
          { frame: 3, duration: 1500 },
          { frame: 0, duration: 400 },
          { frame: 1, duration: 90 },
          { frame: 3, duration: 1200 },
        ],
        talk: SHEET.talk,
      },
      // LED à fond, par saccades
      angry: {
        idle: [
          { frame: 7, duration: 260 },
          { frame: 2, duration: 220 },
          { frame: 7, duration: 260 },
          { frame: 0, duration: 900 },
          { frame: 1, duration: 80 },
        ],
        talk: [
          { frame: 7, duration: 110 },
          { frame: 4, duration: 90 },
          { frame: 7, duration: 120 },
          { frame: 6, duration: 100 },
          { frame: 7, duration: 130 },
          { frame: 4, duration: 95 },
        ],
      },
      // yeux grands ouverts : pas de paupières
      surprised: {
        idle: [
          { frame: 0, duration: 2400 },
          { frame: 1, duration: 70 },
          { frame: 0, duration: 1300 },
          { frame: 2, duration: 400 },
        ],
        talk: SHEET.talk,
      },
    },
  },
};

/** Humeur que la planche (et l'onde) de `id` sait jouer : `mood` si elle a ses boucles, sinon son repli. */
export function portraitMood(id: string, mood?: Mood): Mood | undefined {
  const m = PORTRAIT_MOODS[id];
  if (!m) return undefined;
  return mood && m.loops[mood] ? mood : m.fallback;
}

/** Boucles d'un personnage pour une humeur (planche à humeurs), sinon SHEET. */
export function sheetLoops(id: string, mood?: Mood): SheetLoops {
  const m = PORTRAIT_MOODS[id];
  return m ? m.loops[portraitMood(id, mood)!]! : SHEET;
}

/**
 * Sourcils procéduraux dessinés par-dessus la planche (contrat partagé avec
 * docs/PORTRAIT_GENAI.md, poses dans engine/brows.ts) : plaque centrée en
 * (`x`, `y`) au repos, longue de `len`, épaisse de `thick`, posée sur un œil
 * de rayon `eye` ; px d'une cellule de `cell` px. Gauche = à gauche de l'image.
 */
export interface BrowSpot {
  x: number;
  y: number;
  len: number;
  thick: number;
  eye: number;
}

export interface PortraitBrows {
  cell: number;
  l: BrowSpot;
  r: BrowSpot;
  /** Face de la plaque, biseau éclairé du haut, contour. */
  fill: number;
  top: number;
  edge: number;
}

export const PORTRAIT_BROWS: Readonly<Record<string, PortraitBrows>> = {
  // plaques gris acier sur le haut des yeux (planche sans sourcils peints) ;
  // l'œil droit est plus près de la caméra : sourcil un peu plus grand
  bob: {
    cell: 256,
    l: { x: 61, y: 122, len: 44, thick: 10, eye: 18 },
    r: { x: 166, y: 125, len: 48, thick: 11, eye: 20 },
    fill: 0x8f8595,
    top: 0xcfc2ca,
    edge: 0x2a2531,
  },
};

/**
 * Bouche-onde procédurale (façon B.O.B.) dessinée par-dessus la planche
 * (contrat partagé avec docs/PORTRAIT_GENAI.md) : de `x0` à `x1`, centrée en
 * `y`, amplitude max `amp`, en px d'une cellule de `cell` px.
 */
export interface PortraitWave {
  cell: number;
  x0: number;
  x1: number;
  y: number;
  amp: number;
  /** Teinte de la lueur et du cœur (défaut : aquamarine SYLVIE). */
  color?: number;
  core?: number;
  /** Amplitude au repos, en fraction de `amp` (défaut 0.09 : ondule à peine). */
  rest?: number;
}

export const PORTRAIT_WAVES: Readonly<Record<string, PortraitWave>> = {
  sylvie: { cell: 256, x0: 62, x1: 188, y: 161, amp: 13 },
  // B.O.B. : écran-grille de la bouche (entre les deux barres), cyan Bender,
  // ligne quasi plate au repos
  bob: { cell: 256, x0: 60, x1: 158, y: 186, amp: 7, color: 0x5ff6ff, core: 0xe6feff, rest: 0.04 },
};

function shootSingle(renderer: THREE.WebGLRenderer, pose: Pose, size: number, bg?: [string, string]): HTMLCanvasElement {
  const [c, g] = canvas(size, size);
  const s = studio(renderer, pose, bg);
  s.shoot(g, 0, 0, size);
  s.dispose();
  return c;
}

function shootSheet(renderer: THREE.WebGLRenderer, id: string): HTMLCanvasElement {
  const pose = PORTRAITS[id];
  const { cols, rows, frame } = SHEET;
  const [c, g] = canvas(cols * frame, rows * frame);
  const s = studio(renderer, pose, pose.bg);
  SHEET_FRAMES.forEach((f, i) => s.shoot(g, (i % cols) * frame, Math.floor(i / cols) * frame, frame, f));
  s.dispose();
  return c;
}

/** Rend les planches de tous les portraits (outil `bake:portraits`). */
export function renderPortraitSheets(): Record<string, HTMLCanvasElement> {
  const renderer = makeRenderer();
  const ids = PORTRAIT_IDS.filter((id) => !GENAI_SHEETS.has(id));
  const out = Object.fromEntries(ids.map((id) => [id, shootSheet(renderer, id)]));
  disposeRenderer(renderer);
  return out;
}

/** Charge les planches de public/portraits/ (à appeler dans un `preload`). */
export function preloadPortraitSheets(load: Phaser.Loader.LoaderPlugin): void {
  for (const id of PORTRAIT_IDS) if (!load.textureManager.exists(sheetKey(id))) load.image(sheetKey(id), sheetUrl(id));
  for (const id of Object.keys(PORTRAIT_OVERLAYS)) if (!load.textureManager.exists(overlayKey(id))) load.image(overlayKey(id), overlayUrl(id));
}

/** Génère (une fois par jeu) toutes les textures d'icônes et de portraits. */
export function bakeStudio(textures: Phaser.Textures.TextureManager): void {
  if (textures.exists(iconKey('seau'))) return;
  const renderer = makeRenderer();
  for (const [id, pose] of Object.entries(ICONS)) textures.addCanvas(iconKey(id), shootSingle(renderer, pose, 160));
  for (const [id, pose] of Object.entries(PORTRAITS)) {
    textures.addCanvas(portraitKey(id), shootSingle(renderer, pose, 300, pose.bg));
    // planche absente de public/portraits/ (ou illisible) : bake runtime, même layout
    // (sauf planche GenAI : repli sur le portrait fixe)
    if (!GENAI_SHEETS.has(id) && !textures.exists(sheetKey(id))) textures.addCanvas(sheetKey(id), shootSheet(renderer, id));
  }
  disposeRenderer(renderer);
}
