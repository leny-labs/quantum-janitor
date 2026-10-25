// Ciels peints (canvas) pour les plans héros : dégradé, nébuleuse, planète.
import * as THREE from 'three';

export interface SkySpec {
  stops: [number, string][];
  /** Planète à anneau : centre et rayon en fraction de la hauteur. */
  planet?: { x: number; y: number; r: number; color: string; shade: string; band: string; ring?: string };
  /** Nébuleuses : halos radiaux colorés. */
  clouds?: { x: number; y: number; r: number; color: string }[];
  stars?: number;
  seed?: number;
}

export function skyTexture(spec: SkySpec, w = 2048, h = 1024): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 0, h);
  for (const [at, col] of spec.stops) grad.addColorStop(at, col);
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);

  for (const cl of spec.clouds ?? []) {
    const rg = g.createRadialGradient(cl.x * w, cl.y * h, 0, cl.x * w, cl.y * h, cl.r * h);
    rg.addColorStop(0, cl.color);
    rg.addColorStop(1, cl.color.slice(0, 7) + '00');
    g.fillStyle = rg;
    g.fillRect(0, 0, w, h);
  }

  let s = spec.seed ?? 3;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < (spec.stars ?? 0); i++) {
    const y = rnd() ** 1.6 * h * 0.75;
    const a = 0.15 + rnd() * 0.5 * (1 - y / h);
    g.fillStyle = rnd() > 0.6 ? `rgba(255,216,168,${a})` : rnd() > 0.5 ? `rgba(127,255,212,${a})` : `rgba(255,255,255,${a})`;
    const r = rnd() * 2 + 0.6;
    g.beginPath();
    g.arc(rnd() * w, y, r, 0, Math.PI * 2);
    g.fill();
  }

  const p = spec.planet;
  if (p) {
    const px = p.x * w;
    const py = p.y * h;
    const pr = p.r * h;
    const ring = (front: boolean) => {
      if (!p.ring) return;
      g.save();
      g.translate(px, py);
      g.rotate(-0.28);
      g.scale(1, 0.22);
      g.strokeStyle = p.ring;
      g.lineWidth = pr * 0.32;
      g.beginPath();
      g.arc(0, 0, pr * 1.75, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2);
      g.stroke();
      g.restore();
    };
    ring(false);
    g.save();
    g.beginPath();
    g.arc(px, py, pr, 0, Math.PI * 2);
    g.clip();
    g.fillStyle = p.color;
    g.fillRect(px - pr, py - pr, pr * 2, pr * 2);
    // bandes en aplat
    g.fillStyle = p.band;
    for (const [dy, th] of [[-0.45, 0.12], [-0.1, 0.2], [0.32, 0.09], [0.55, 0.14]]) g.fillRect(px - pr, py + dy * pr, pr * 2, th * pr);
    // terminateur dur (ombre en aplat, pas de dégradé)
    g.fillStyle = p.shade;
    g.beginPath();
    g.arc(px + pr * 0.55, py + pr * 0.35, pr * 1.05, 0, Math.PI * 2);
    g.fill();
    g.restore();
    ring(true);
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Grand plan de fond face caméra, non éclairé, sans brouillard. */
export function skyPlane(tex: THREE.Texture, w: number, h: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, fog: false, toneMapped: false, depthWrite: false }));
  m.renderOrder = -10;
  return m;
}
