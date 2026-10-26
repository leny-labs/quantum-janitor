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
