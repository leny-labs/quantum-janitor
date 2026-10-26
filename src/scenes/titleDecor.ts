// Décor peint (canvas 2D) de l'écran titre : la grande baie vitrée du pont
// d'observation de Klepsydra-9 et le sol sur lequel se tient le héros. Le ciel
// 3D (plan titre) reste visible à travers la vitre : on ne peint que le mur,
// le cadre, le sol et la vitre (teinte + reflets, quasi transparente).
import Phaser from 'phaser';
import { H, W } from '../ui/theme';

/** Ouverture de la baie (bord intérieur du cadre), coins chanfreinés. */
export const BAY = { x0: 668, y0: 116, x1: 1250, y1: 528, cut: 40 };
/** Ligne de jonction mur / sol (haut de la plinthe néon). */
export const FLOOR_Y = 580;
/** Point de fuite du dallage (un peu au-dessus du héros). */
const VP = { x: 980, y: 300 };
/** Montants verticaux de la baie (x du centre). */
export const MULLIONS = [(BAY.x0 + BAY.x1) / 2];

export const DECOR_KEY = 'menu-decor';
export const SHEEN_KEY = 'menu-sheen';
export const SOFT_KEY = 'menu-soft';
export const PUDDLE_KEY = 'menu-puddle';
export const VIGNETTE_KEY = 'menu-vignette';
/** Voie lactée derrière la vitre : lueur (additive) puis poussières + étoiles. */
export const MILKY_SHADE_KEY = 'menu-milky-shade';
export const MILKY_KEY = 'menu-milky';
export const MILKY_DUST_KEY = 'menu-milky-dust';
/** Astéroïdes cartoon (net / flou pour la couche lointaine). */
export const ROCK_KEYS = ['menu-rock-0', 'menu-rock-1', 'menu-rock-2', 'menu-rock-3'];
export const ROCK_BLUR_KEYS = ROCK_KEYS.map((k) => `${k}-blur`);
export const STREAK_KEY = 'menu-streak';

const BAY_W = BAY.x1 - BAY.x0;
const BAY_H = BAY.y1 - BAY.y0;
/** Axe de la voie lactée (coordonnées écran) : monte de gauche à droite, traverse l'anneau. */
const BAND = { x0: BAY.x0 - 60, y0: BAY.y0 + 330, x1: BAY.x1 + 40, y1: BAY.y0 + 30 };
const BAND_SLOPE = (BAND.y1 - BAND.y0) / (BAND.x1 - BAND.x0);

/** y de l'axe de la voie lactée à l'abscisse `x` (écran). */
export function bandY(x: number): number {
  return BAND.y0 + (x - BAND.x0) * BAND_SLOPE;
}

/** Polygone chanfreiné de la baie, agrandi de `grow` px. */
export function bayPoints(grow = 0): [number, number][] {
  const { x0, y0, x1, y1, cut } = BAY;
  const a = x0 - grow;
  const b = y0 - grow;
  const c = x1 + grow;
  const d = y1 + grow;
  const k = cut + grow * 0.41;
  return [
    [a + k, b],
    [c - k, b],
    [c, b + k],
    [c, d - k],
    [c - k, d],
    [a + k, d],
    [a, d - k],
    [a, b + k],
  ];
}

function path(g: CanvasRenderingContext2D, pts: [number, number][]): void {
  g.moveTo(pts[0][0], pts[0][1]);
  for (const [x, y] of pts.slice(1)) g.lineTo(x, y);
  g.closePath();
}

function canvasTexture(scene: Phaser.Scene, key: string, w: number, h: number, paint: (g: CanvasRenderingContext2D) => void): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return;
  paint(tex.getContext());
  tex.refresh();
}

/** Toutes les textures du décor (une seule fois par session). */
export function bakeDecor(scene: Phaser.Scene): void {
  canvasTexture(scene, DECOR_KEY, W, H, paintDecor);
  // reflet mobile : bande diagonale floue, balayée sur la vitre
  canvasTexture(scene, SHEEN_KEY, 256, 64, (g) => {
    const grad = g.createLinearGradient(0, 0, 256, 0);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.45, 'rgba(220,235,255,0.5)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.9)');
    grad.addColorStop(0.55, 'rgba(220,235,255,0.5)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 64);
  });
  // tache douce blanche (halo, poussière, étincelles, ombres)
  canvasTexture(scene, SOFT_KEY, 128, 128, (g) => {
    const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    rg.addColorStop(0, 'rgba(255,255,255,1)');
    rg.addColorStop(0.25, 'rgba(255,255,255,0.55)');
    rg.addColorStop(0.6, 'rgba(255,255,255,0.12)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg;
    g.fillRect(0, 0, 128, 128);
  });
  // tache à plateau (ombres de contact, flaque de lumière)
  canvasTexture(scene, PUDDLE_KEY, 128, 128, (g) => {
    const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    rg.addColorStop(0, 'rgba(255,255,255,1)');
    rg.addColorStop(0.45, 'rgba(255,255,255,0.85)');
    rg.addColorStop(0.75, 'rgba(255,255,255,0.35)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg;
    g.fillRect(0, 0, 128, 128);
  });
  canvasTexture(scene, VIGNETTE_KEY, W, H, (g) => {
    const rg = g.createRadialGradient(W * 0.55, H * 0.45, H * 0.35, W * 0.55, H * 0.45, W * 0.78);
    rg.addColorStop(0, 'rgba(7,5,15,0)');
    rg.addColorStop(0.6, 'rgba(7,5,15,0.25)');
    rg.addColorStop(1, 'rgba(7,5,15,0.7)');
    g.fillStyle = rg;
    g.fillRect(0, 0, W, H);
  });
  // fond d'espace assombri derrière la vitre (contraste du héros et de la bande)
  canvasTexture(scene, MILKY_SHADE_KEY, BAY_W, BAY_H, (g) => {
    const grad = g.createLinearGradient(0, 0, BAY_W, 0);
    grad.addColorStop(0, 'rgba(4,2,14,0.55)');
    grad.addColorStop(1, 'rgba(4,2,14,0.3)');
    g.fillStyle = grad;
    g.fillRect(0, 0, BAY_W, BAY_H);
  });
  canvasTexture(scene, MILKY_KEY, BAY_W, BAY_H, paintMilkyGlow);
  canvasTexture(scene, MILKY_DUST_KEY, BAY_W, BAY_H, paintMilkyDust);
  for (const [i, key] of ROCK_KEYS.entries()) {
    canvasTexture(scene, key, 96, 96, (g) => paintRock(g, 11 + i * 31, i));
    canvasTexture(scene, ROCK_BLUR_KEYS[i], 96, 96, (g) => {
      const src = scene.textures.get(key).getSourceImage() as HTMLCanvasElement;
      g.filter = 'blur(2px)';
      g.drawImage(src, 0, 0);
      g.filter = 'none';
    });
  }
  // étoile filante : traîne effilée, tête brillante à droite
  canvasTexture(scene, STREAK_KEY, 256, 16, (g) => {
    const grad = g.createLinearGradient(0, 0, 256, 0);
    grad.addColorStop(0, 'rgba(127,255,212,0)');
    grad.addColorStop(0.7, 'rgba(200,220,255,0.45)');
    grad.addColorStop(1, 'rgba(255,255,255,1)');
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(0, 8);
    g.lineTo(250, 5);
    g.arc(250, 8, 3, -Math.PI / 2, Math.PI / 2);
    g.closePath();
    g.fill();
  });
}

function seeded(seed: number): () => number {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** Tirage ~gaussien centré (somme de trois uniformes), dans [-1, 1]. */
function gauss(rnd: () => number): number {
  return (rnd() + rnd() + rnd()) / 1.5 - 1;
}

/** Points le long de l'axe de la bande (repère local de la vitre). */
function alongBand(t: number, off: number): [number, number] {
  const x = BAND.x0 + (BAND.x1 - BAND.x0) * t;
  const len = Math.hypot(1, BAND_SLOPE);
  // normale à l'axe
  const nx = -BAND_SLOPE / len;
  const ny = 1 / len;
  return [x + nx * off - BAY.x0, bandY(x) + ny * off - BAY.y0];
}

/** Lueur de la voie lactée : nuées pourpre/magenta/cyan, cœur plus clair. */
function paintMilkyGlow(g: CanvasRenderingContext2D): void {
  const rnd = seeded(41);
  g.save();
  g.translate(-BAY.x0, -BAY.y0);
  path(g, bayPoints(2));
  g.clip();
  g.translate(BAY.x0, BAY.y0);
  g.globalCompositeOperation = 'lighter';
  const blob = (x: number, y: number, r: number, color: string, a: number) => {
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, `rgba(${color},${a})`);
    rg.addColorStop(0.5, `rgba(${color},${a * 0.4})`);
    rg.addColorStop(1, `rgba(${color},0)`);
    g.fillStyle = rg;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  };
  // halo large de la bande, puis nuées colorées, puis cœur
  for (let i = 0; i < 26; i++) {
    const [x, y] = alongBand(i / 25, gauss(rnd) * 40);
    blob(x, y, 110 + rnd() * 50, '70,40,190', 0.07);
  }
  const tints = ['200,60,220', '255,79,154', '60,190,255', '127,255,212', '140,90,255'];
  for (let i = 0; i < 90; i++) {
    const [x, y] = alongBand(rnd(), gauss(rnd) * 85);
    blob(x, y, 26 + rnd() * 60, tints[i % tints.length], 0.15 + rnd() * 0.17);
  }
  for (let i = 0; i < 50; i++) {
    const [x, y] = alongBand(0.05 + rnd() * 0.9, gauss(rnd) * 14);
    blob(x, y, 14 + rnd() * 26, i % 3 ? '255,150,220' : '255,214,160', 0.13 + rnd() * 0.1);
  }
  g.restore();
}

/** Filaments de poussière sombre le long de la bande + étoiles denses. */
function paintMilkyDust(g: CanvasRenderingContext2D): void {
  const rnd = seeded(73);
  g.save();
  g.translate(-BAY.x0, -BAY.y0);
  path(g, bayPoints(2));
  g.clip();
  g.translate(BAY.x0, BAY.y0);
  // filaments : courbes sinueuses floutées qui suivent l'axe
  g.lineCap = 'round';
  g.filter = 'blur(3px)';
  for (let f = 0; f < 9; f++) {
    const off = gauss(rnd) * 30;
    const ph = rnd() * 6;
    g.strokeStyle = `rgba(20,6,44,${0.4 + rnd() * 0.3})`;
    g.lineWidth = 2 + rnd() * 5;
    g.beginPath();
    const t0 = rnd() * 0.4;
    const t1 = t0 + 0.3 + rnd() * 0.4;
    for (let t = t0; t <= t1; t += 0.02) {
      const [x, y] = alongBand(t, off + Math.sin(t * 14 + ph) * 12);
      if (t === t0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  }
  // grumeaux sombres le long des filaments
  for (let i = 0; i < 18; i++) {
    const [x, y] = alongBand(rnd(), gauss(rnd) * 26);
    g.fillStyle = `rgba(20,6,44,${0.25 + rnd() * 0.25})`;
    g.beginPath();
    g.ellipse(x, y, 8 + rnd() * 18, 3 + rnd() * 6, Math.atan(BAND_SLOPE), 0, Math.PI * 2);
    g.fill();
  }
  g.filter = 'none';
  // étoiles : très denses le long de la bande, éparses ailleurs
  const tints = ['255,255,255', '207,200,255', '127,255,212', '255,216,168', '255,170,210'];
  for (let i = 0; i < 900; i++) {
    const inBand = i < 700;
    const [x, y] = inBand ? alongBand(rnd(), gauss(rnd) * 75) : [rnd() * BAY_W, rnd() * BAY_H];
    const r = rnd() < 0.92 ? 0.4 + rnd() * 0.6 : 1 + rnd() * 0.8;
    g.fillStyle = `rgba(${tints[i % tints.length]},${0.35 + rnd() * 0.6})`;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  // quelques étoiles vedettes à aigrettes (cartoon)
  for (let i = 0; i < 9; i++) {
    const [x, y] = alongBand(0.05 + rnd() * 0.9, gauss(rnd) * 60);
    const r = 5 + rnd() * 6;
    const c = tints[i % tints.length];
    const glow = g.createRadialGradient(x, y, 0, x, y, r * 1.6);
    glow.addColorStop(0, `rgba(${c},0.7)`);
    glow.addColorStop(1, `rgba(${c},0)`);
    g.fillStyle = glow;
    g.fillRect(x - r * 2, y - r * 2, r * 4, r * 4);
    g.fillStyle = 'rgba(255,255,255,0.95)';
    g.beginPath();
    g.moveTo(x, y - r);
    g.quadraticCurveTo(x, y, x + r, y);
    g.quadraticCurveTo(x, y, x, y + r);
    g.quadraticCurveTo(x, y, x - r, y);
    g.quadraticCurveTo(x, y, x, y - r);
    g.fill();
  }
  g.restore();
}

/** Rocher cartoon : contour encré, ombre propre en aplat, liseré de lumière, cratères. */
function paintRock(g: CanvasRenderingContext2D, seed: number, variant: number): void {
  const rnd = seeded(seed);
  const n = 8 + (variant % 3);
  const R = 34;
  const stretch = 0.75 + rnd() * 0.3;
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd() * 0.3;
    const r = R * (0.72 + rnd() * 0.28);
    pts.push([48 + Math.cos(a) * r, 48 + Math.sin(a) * r * stretch]);
  }
  const shape = (dx = 0, dy = 0) => {
    // coins arrondis : courbes par les milieux d'arêtes
    const p = pts.map(([x, y]) => [x + dx, y + dy] as [number, number]);
    const mid = (a: [number, number], b: [number, number]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const m0 = mid(p[n - 1], p[0]);
    g.moveTo(m0[0], m0[1]);
    for (let i = 0; i < n; i++) {
      const m = mid(p[i], p[(i + 1) % n]);
      g.quadraticCurveTo(p[i][0], p[i][1], m[0], m[1]);
    }
    g.closePath();
  };
  const palette = [
    ['#7a68b4', '#2c2052', '#7fffd4'],
    ['#8a6a9e', '#34204a', '#ff9ac8'],
    ['#6d68a8', '#24204c', '#ffd166'],
    ['#806090', '#2c1a44', '#9fd8ff'],
  ][variant % 4];
  const [base, dark, rim] = palette;
  g.save();
  g.beginPath();
  shape();
  g.clip();
  // liseré de lumière en haut à gauche, puis corps
  g.fillStyle = rim;
  g.fillRect(0, 0, 96, 96);
  g.fillStyle = base;
  g.beginPath();
  shape(5, 5);
  g.fill();
  // ombre propre : rocher moins lui-même décalé vers la lumière
  g.fillStyle = dark;
  g.beginPath();
  shape();
  shape(-14, -12);
  g.fill('evenodd');
  // cratères : creux sombre + lèvre claire
  for (let i = 0; i < 4; i++) {
    const cx = 30 + rnd() * 36;
    const cy = 30 + rnd() * 34;
    const cr = 1.6 + rnd() * (i ? 2.4 : 4.5);
    g.fillStyle = 'rgba(255,255,255,0.12)';
    g.beginPath();
    g.ellipse(cx + 1, cy + 1, cr, cr * 0.75, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = dark;
    g.beginPath();
    g.ellipse(cx, cy, cr, cr * 0.75, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
  g.strokeStyle = '#07050f';
  g.lineWidth = 3;
  g.lineJoin = 'round';
  g.beginPath();
  shape();
  g.stroke();
}

/** Vitre, mur de la station, cadre de baie, plinthe et dallage. */
function paintDecor(g: CanvasRenderingContext2D): void {
  paintGlass(g);
  // ── mur : métal sombre violacé, percé par la baie ──
  g.save();
  g.beginPath();
  g.rect(0, 0, W, FLOOR_Y);
  path(g, bayPoints(0));
  g.clip('evenodd');
  const wall = g.createLinearGradient(0, 0, 0, FLOOR_Y);
  wall.addColorStop(0, '#0d0a20');
  wall.addColorStop(0.6, '#16102e');
  wall.addColorStop(1, '#1d1538');
  g.fillStyle = wall;
  g.fillRect(0, 0, W, FLOOR_Y);
  // panneaux du mur : joints + légers biseaux
  g.lineWidth = 2;
  for (let x = 0; x < W; x += 128) {
    g.strokeStyle = 'rgba(3,2,10,0.7)';
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, FLOOR_Y);
    g.stroke();
    g.strokeStyle = 'rgba(138,124,255,0.07)';
    g.beginPath();
    g.moveTo(x + 2, 0);
    g.lineTo(x + 2, FLOOR_Y);
    g.stroke();
  }
  for (const y of [190, 420]) {
    g.strokeStyle = 'rgba(3,2,10,0.7)';
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(W, y);
    g.stroke();
    g.strokeStyle = 'rgba(138,124,255,0.06)';
    g.beginPath();
    g.moveTo(0, y + 2);
    g.lineTo(W, y + 2);
    g.stroke();
  }
  // lueur violette de la nébuleuse qui déborde sur le mur autour de la baie
  const spill = g.createRadialGradient(950, 320, 200, 950, 320, 520);
  spill.addColorStop(0, 'rgba(120,80,230,0.22)');
  spill.addColorStop(1, 'rgba(120,80,230,0)');
  g.fillStyle = spill;
  g.fillRect(0, 0, W, FLOOR_Y);
  g.restore();

  // ── cadre épais de la baie ──
  g.save();
  g.beginPath();
  path(g, bayPoints(30));
  path(g, bayPoints(0));
  g.clip('evenodd');
  const frame = g.createLinearGradient(0, BAY.y0 - 30, 0, BAY.y1 + 30);
  frame.addColorStop(0, '#4a3f7a');
  frame.addColorStop(0.5, '#2c2452');
  frame.addColorStop(1, '#3a2f66');
  g.fillStyle = frame;
  g.fillRect(0, 0, W, H);
  // biseau : arête claire extérieure, lèvre sombre intérieure
  g.lineJoin = 'miter';
  g.strokeStyle = 'rgba(200,190,255,0.35)';
  g.lineWidth = 2;
  g.beginPath();
  path(g, bayPoints(29));
  g.stroke();
  g.strokeStyle = '#0a0716';
  g.lineWidth = 12;
  g.beginPath();
  path(g, bayPoints(0));
  g.stroke();
  g.strokeStyle = 'rgba(127,255,212,0.55)';
  g.lineWidth = 1.5;
  g.beginPath();
  path(g, bayPoints(7));
  g.stroke();
  g.restore();
  // ombre portée du cadre sur le mur
  g.save();
  g.beginPath();
  g.rect(0, 0, W, FLOOR_Y);
  path(g, bayPoints(30));
  g.clip('evenodd');
  g.shadowColor = 'rgba(0,0,0,0.75)';
  g.shadowBlur = 24;
  g.strokeStyle = '#000';
  g.lineWidth = 4;
  g.beginPath();
  path(g, bayPoints(32));
  g.stroke();
  g.restore();
  // rivets le long du cadre
  const rivet = (x: number, y: number) => {
    g.fillStyle = '#16112c';
    g.beginPath();
    g.arc(x, y + 0.8, 3.4, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#8f84c8';
    g.beginPath();
    g.arc(x, y, 2.6, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.7)';
    g.beginPath();
    g.arc(x - 0.8, y - 0.8, 0.9, 0, Math.PI * 2);
    g.fill();
  };
  const r = 19;
  for (let x = BAY.x0 + BAY.cut + 10; x < BAY.x1 - BAY.cut - 4; x += 34) {
    rivet(x, BAY.y0 - r);
    rivet(x, BAY.y1 + r);
  }
  for (let y = BAY.y0 + BAY.cut + 10; y < BAY.y1 - BAY.cut - 4; y += 34) {
    rivet(BAY.x0 - r, y);
    rivet(BAY.x1 + r, y);
  }

  // ── montants verticaux (devant la vitre) ──
  for (const mx of MULLIONS) {
    const m = g.createLinearGradient(mx - 9, 0, mx + 9, 0);
    m.addColorStop(0, '#1a1434');
    m.addColorStop(0.35, '#4a3f7a');
    m.addColorStop(0.5, '#5d5293');
    m.addColorStop(0.65, '#3a3066');
    m.addColorStop(1, '#120d26');
    g.fillStyle = m;
    g.fillRect(mx - 9, BAY.y0, 18, BAY.y1 - BAY.y0);
    // pattes de fixation haut/bas
    g.fillStyle = '#2c2452';
    g.fillRect(mx - 14, BAY.y0, 28, 16);
    g.fillRect(mx - 14, BAY.y1 - 16, 28, 16);
    rivet(mx, BAY.y0 + 8);
    rivet(mx, BAY.y1 - 8);
  }

  // ── sol : dallage métal en perspective ──
  g.save();
  g.beginPath();
  g.rect(0, FLOOR_Y, W, H - FLOOR_Y);
  g.clip();
  const floor = g.createLinearGradient(0, FLOOR_Y, 0, H);
  floor.addColorStop(0, '#2c2358');
  floor.addColorStop(0.45, '#1e1642');
  floor.addColorStop(1, '#100c24');
  g.fillStyle = floor;
  g.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);
  // lumière de la baie projetée sur le sol (trapèze qui s'évase vers nous)
  g.save();
  g.beginPath();
  g.moveTo(BAY.x0 + 20, FLOOR_Y);
  g.lineTo(BAY.x1 - 10, FLOOR_Y);
  g.lineTo(BAY.x1 + 140, H);
  g.lineTo(BAY.x0 - 150, H);
  g.closePath();
  const lit = g.createLinearGradient(0, FLOOR_Y, 0, H);
  lit.addColorStop(0, 'rgba(150,120,255,0.32)');
  lit.addColorStop(0.5, 'rgba(110,90,230,0.12)');
  lit.addColorStop(1, 'rgba(110,90,230,0)');
  g.fillStyle = lit;
  g.filter = 'blur(10px)';
  g.fill();
  g.filter = 'none';
  g.restore();
  // joints de dalles : lignes vers le point de fuite…
  const depth = H - FLOOR_Y;
  for (let i = -14; i <= 14; i++) {
    const bx = VP.x + i * 150;
    const fx = VP.x + (bx - VP.x) * ((H - VP.y) / (FLOOR_Y - VP.y));
    g.strokeStyle = i % 2 ? 'rgba(4,2,12,0.75)' : 'rgba(4,2,12,0.9)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(bx, FLOOR_Y);
    g.lineTo(fx, H);
    g.stroke();
    g.strokeStyle = 'rgba(160,150,255,0.07)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(bx + 1.5, FLOOR_Y);
    g.lineTo(fx + 2.5, H);
    g.stroke();
  }
  // … et rangées transversales de plus en plus espacées
  let y = FLOOR_Y;
  for (let k = 0; y < H; k++) {
    y = FLOOR_Y + depth * ((k + 1) ** 1.8 / 5 ** 1.8);
    g.strokeStyle = 'rgba(4,2,12,0.85)';
    g.lineWidth = 1.5 + k * 0.4;
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(W, y);
    g.stroke();
    g.strokeStyle = 'rgba(160,150,255,0.06)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(0, y + 1.5 + k * 0.3);
    g.lineTo(W, y + 1.5 + k * 0.3);
    g.stroke();
  }
  // grille d'aération sous le héros (caillebotis)
  g.save();
  g.beginPath();
  g.moveTo(940, FLOOR_Y + 22);
  g.lineTo(1210, FLOOR_Y + 22);
  g.lineTo(1270, H);
  g.lineTo(890, H);
  g.closePath();
  g.fillStyle = 'rgba(10,7,24,0.45)';
  g.fill();
  g.clip();
  g.strokeStyle = 'rgba(127,255,212,0.09)';
  g.lineWidth = 1;
  for (let x = 860; x < 1300; x += 9) {
    g.beginPath();
    g.moveTo(x, FLOOR_Y);
    g.lineTo(VP.x + (x - VP.x) * ((H - VP.y) / (FLOOR_Y - VP.y)), H);
    g.stroke();
  }
  g.restore();
  g.restore();

  // ── plinthe : bande métal + néons cyan/rose qui lèchent le sol ──
  const base = g.createLinearGradient(0, FLOOR_Y - 14, 0, FLOOR_Y);
  base.addColorStop(0, '#2c2452');
  base.addColorStop(1, '#120d26');
  g.fillStyle = base;
  g.fillRect(0, FLOOR_Y - 14, W, 14);
  g.fillStyle = 'rgba(200,190,255,0.25)';
  g.fillRect(0, FLOOR_Y - 14, W, 1);
  g.save();
  g.shadowBlur = 14;
  g.shadowColor = '#7fffd4';
  g.fillStyle = '#7fffd4';
  g.fillRect(0, FLOOR_Y - 1, W, 2);
  g.shadowColor = '#ff4f9a';
  g.fillStyle = '#ff4f9a';
  g.fillRect(0, FLOOR_Y - 7, W, 1.5);
  g.restore();
  // reflet des néons sur le sol
  const glowFloor = g.createLinearGradient(0, FLOOR_Y, 0, FLOOR_Y + 40);
  glowFloor.addColorStop(0, 'rgba(127,255,212,0.22)');
  glowFloor.addColorStop(1, 'rgba(127,255,212,0)');
  g.fillStyle = glowFloor;
  g.fillRect(0, FLOOR_Y, W, 40);
}

/** Vitre : teinte froide, reflets diagonaux fixes, buée sur les bords. */
function paintGlass(g: CanvasRenderingContext2D): void {
  g.save();
  g.beginPath();
  path(g, bayPoints(0));
  g.clip();
  g.fillStyle = 'rgba(60,80,200,0.10)';
  g.fillRect(0, 0, W, H);
  // reflets : deux bandes obliques larges + une fine
  const band = (x: number, w: number, a: number) => {
    const grad = g.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, 'rgba(220,230,255,0)');
    grad.addColorStop(0.5, `rgba(220,230,255,${a})`);
    grad.addColorStop(1, 'rgba(220,230,255,0)');
    g.save();
    g.transform(1, 0, -0.55, 1, 0, 0);
    g.fillStyle = grad;
    g.fillRect(x, 0, w, H);
    g.restore();
  };
  band(760, 110, 0.07);
  band(900, 26, 0.09);
  band(1170, 70, 0.05);
  // bords : légère buée / épaisseur de verre
  g.lineWidth = 26;
  g.strokeStyle = 'rgba(140,160,255,0.07)';
  g.filter = 'blur(8px)';
  g.beginPath();
  path(g, bayPoints(-4));
  g.stroke();
  g.filter = 'none';
  g.restore();
}
