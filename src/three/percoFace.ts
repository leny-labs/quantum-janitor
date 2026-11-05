// PERCO, machine à café syndiquée : yeux pixel par humeur + bouche-onde ambre.
// Planches de dialogue : public/portraits/perco[-travail]-humeurs-sheet.png
// (tools/perco-faces.py, glyphes dans perco-face.json). Ici : les boucles de
// frames (partagées avec Studio.PORTRAIT_MOODS) et l'écran du billboard 3D de la
// Salle de Pause, redessiné en direct sur une CanvasTexture (mêmes glyphes,
// même onde que le portrait, humeur de la réplique en cours).
import * as THREE from 'three';
import type { Mood } from '../engine/mood';
import { speaking } from '../engine/speaking';
import { wavePoints } from '../ui/waveShape';
import type { PortraitWave } from './Studio';
import FACE from './perco-face.json';

interface Step {
  frame: number;
  duration: number;
}
interface Loops {
  idle: readonly Step[];
  talk: readonly Step[];
}

/**
 * Frames de la planche 4 × 2 (perco-face.json) : 0 calm · 1 suspicious · 2 angry ·
 * 3 love / 4 accent calm · 5 accent suspicious · 6 accent angry · 7 surprised.
 * En grève, « calm » = sourcils froncés (accent : clignement) ; au travail, yeux
 * plissés de contentement (accent : air narquois). PERCO est soupe au lait :
 * rythmes plus nerveux que SYLVIE, colère en saccades.
 */
export const PERCO_LOOPS: Readonly<Partial<Record<Mood, Loops>>> = {
  calm: {
    idle: [
      { frame: 0, duration: 2200 },
      { frame: 4, duration: 120 },
      { frame: 0, duration: 1500 },
      { frame: 4, duration: 90 },
      { frame: 0, duration: 110 },
      { frame: 4, duration: 90 },
    ],
    talk: [
      { frame: 0, duration: 1400 },
      { frame: 4, duration: 110 },
    ],
  },
  suspicious: {
    // un œil plissé, l'autre qui jauge… puis le regard en coin
    idle: [
      { frame: 1, duration: 1300 },
      { frame: 5, duration: 900 },
      { frame: 1, duration: 600 },
      { frame: 5, duration: 1400 },
    ],
    talk: [
      { frame: 1, duration: 900 },
      { frame: 5, duration: 700 },
    ],
  },
  angry: {
    // la vapeur monte : sourcils qui tressautent
    idle: [
      { frame: 2, duration: 600 },
      { frame: 6, duration: 70 },
      { frame: 2, duration: 90 },
      { frame: 6, duration: 70 },
      { frame: 2, duration: 90 },
      { frame: 6, duration: 70 },
      { frame: 2, duration: 1100 },
    ],
    talk: [
      { frame: 2, duration: 260 },
      { frame: 6, duration: 60 },
      { frame: 2, duration: 140 },
      { frame: 6, duration: 60 },
    ],
  },
  love: {
    idle: [{ frame: 3, duration: 1000 }],
    talk: [{ frame: 3, duration: 1000 }],
  },
  surprised: {
    idle: [
      { frame: 7, duration: 2400 },
      { frame: 4, duration: 90 },
    ],
    talk: [{ frame: 7, duration: 1000 }],
  },
};

/**
 * Onde de PERCO (cellule 512 de la planche de dialogue) : ambre CRT, posée en
 * marches sur la grille de l'écran (`step` = un bloc de 7 px), plus rapide et
 * plus sèche que celle de SYLVIE (`speed`, `punch`), trait épais.
 */
export const PERCO_WAVE: PortraitWave = {
  cell: 512,
  x0: 180,
  x1: 292,
  y: 412,
  amp: 22,
  color: 0xffa21f,
  core: 0xfff1c8,
  rest: 0.07,
  thick: 2.1,
  speed: 1.35,
  punch: 1.6,
  jag: 0.85,
  step: 7,
};

/** Image de la frame d'une boucle à l'instant `ms`. */
function loopFrame(steps: readonly Step[], ms: number): number {
  const total = steps.reduce((s, x) => s + x.duration, 0);
  let m = ms % total;
  for (const s of steps) {
    if (m < s.duration) return s.frame;
    m -= s.duration;
  }
  return steps[0].frame;
}

export const percoLoops = (mood?: Mood): Loops => PERCO_LOOPS[mood && PERCO_LOOPS[mood] ? mood : 'calm']!;

// ── écran du billboard (props/st/perco-sheet.png, cellule 548 × 1024) ──

/** Cadre de perco-ecran.png dans la cellule du billboard (px), cf. tools/perco-faces.py BB_CROP. */
const CROP = { x0: 150, y0: 262, x1: 358, y1: 414 };
const CELL_W = 548;
const CELL_H = 1024;
/** Portrait 512 → billboard : même dessin à 0,98, centre d'écran (236, 311) → (253,5, 275). */
const BB_K = 0.98;
const toCrop = (x: number, y: number): [number, number] => [253.5 + (x - 236) * BB_K - CROP.x0, 275 + (y - 311) * BB_K - CROP.y0];
const RES = 2;
const GLYPH = '#b4f351';

type Glyph = { l: string[]; r?: string[] };
const GLYPHS = FACE.glyphs as Record<string, Glyph>;

function drawEyes(g: CanvasRenderingContext2D, name: string): void {
  const gl = GLYPHS[name];
  const left = gl.l;
  const right = gl.r ?? left.map((row) => [...row].reverse().join(''));
  const b = 7 * BB_K * RES;
  g.save();
  g.fillStyle = GLYPH;
  g.shadowColor = GLYPH;
  g.shadowBlur = b * 1.2;
  ([[left, 176], [right, 240]] as const).forEach(([bm, ex]) => {
    const [ox, oy] = toCrop(ex, 330);
    bm.forEach((row, j) => [...row].forEach((c, i) => c === '#' && g.fillRect(ox * RES + i * b, oy * RES + j * b, Math.ceil(b), Math.ceil(b))));
  });
  g.restore();
}

/**
 * Écran vivant de PERCO, à poser par-dessus son billboard : yeux de l'humeur
 * (idle grève / travail, humeur de la réplique quand c'est elle qui parle) et
 * onde ambre qui s'agite pendant la frappe. `update(t, travail)` à chaque frame.
 */
export function percoScreen(billboardH: number, aspect: number): { mesh: THREE.Sprite; update: (t: number, travail: boolean) => void } {
  const w = CROP.x1 - CROP.x0;
  const h = CROP.y1 - CROP.y0;
  const canvas = document.createElement('canvas');
  canvas.width = w * RES;
  canvas.height = h * RES;
  const g = canvas.getContext('2d')!;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const bg = new Image();
  bg.src = `${import.meta.env.BASE_URL}props/st/perco-ecran.png`;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, color: '#fff6ee' });
  const mesh = new THREE.Sprite(mat);
  const bw = billboardH * aspect;
  mesh.scale.set((w / CELL_W) * bw, (h / CELL_H) * billboardH, 1);
  // repère du billboard : pieds en bas (center.y 0.008), centré en x
  mesh.position.set((((CROP.x0 + CROP.x1) / 2 - CELL_W / 2) / CELL_W) * bw, (1 - (CROP.y0 + CROP.y1) / 2 / CELL_H - 0.008) * billboardH, 0.03);
  mesh.renderOrder = 2;
  // onde en px de crop (même tracé que le portrait, ramené à l'échelle du billboard)
  const [wx0, wy] = toCrop(PERCO_WAVE.x0, PERCO_WAVE.y);
  const [wx1] = toCrop(PERCO_WAVE.x1, PERCO_WAVE.y);
  const wave: PortraitWave = { ...PERCO_WAVE, cell: w, x0: wx0, x1: wx1, y: wy, amp: PERCO_WAVE.amp * BB_K, step: PERCO_WAVE.step! * BB_K };
  let level = 0;
  let last = 0;
  let key = '';
  const update = (t: number, travail: boolean) => {
    if (!bg.complete || !bg.naturalWidth) return;
    const me = speaking.id === 'perco';
    const mood = me ? (speaking.mood as Mood | undefined) : undefined;
    const talking = me && speaking.talking;
    const dt = Math.min(0.1, Math.max(0, t - last)) * 1000;
    last = t;
    level += ((talking ? 1 : 0) - level) * Math.min(1, dt / (talking ? 60 : 160));
    const loops = percoLoops(mood);
    const frame = loopFrame(talking ? loops.talk : loops.idle, t * 1000);
    const name = (travail ? FACE.travail : FACE.strike)[frame];
    // ~30 redessins / s au plus (l'onde au repos ondule encore)
    const k = `${name}|${Math.round(t * 30)}`;
    if (k === key) return;
    key = k;
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.drawImage(bg, 0, 0, canvas.width, canvas.height);
    drawEyes(g, name);
    const pts = wavePoints(wave, mood ?? (travail ? 'calm' : 'angry'), t, level);
    g.save();
    g.lineJoin = 'miter';
    g.lineCap = 'square';
    const col = `#${PERCO_WAVE.color!.toString(16).padStart(6, '0')}`;
    const core = `#${PERCO_WAVE.core!.toString(16).padStart(6, '0')}`;
    const path = () => {
      g.beginPath();
      pts.forEach((p, i) => (i ? g.lineTo(p.x * RES, p.y * RES) : g.moveTo(p.x * RES, p.y * RES)));
    };
    g.shadowColor = col;
    g.shadowBlur = 8 * RES;
    g.strokeStyle = col;
    g.lineWidth = 2.6 * RES;
    path();
    g.stroke();
    g.shadowBlur = 0;
    g.strokeStyle = core;
    g.lineWidth = 1 * RES;
    path();
    g.stroke();
    g.restore();
    tex.needsUpdate = true;
  };
  return { mesh, update };
}
