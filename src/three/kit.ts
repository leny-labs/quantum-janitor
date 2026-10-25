// Kit de matériaux et de primitives « illustration » : aplats toon 3 tons,
// ombres dures, arêtes sombres, textes peints sur canvas. Aucun PBR.
import * as THREE from 'three';

const gradientMaps = new Map<number, THREE.DataTexture>();

/**
 * Rampe de lumière en paliers (filtrage nearest) : aplats francs. Les paliers
 * sont teintés — ombres violettes, lumière crème — façon affiche rétro-SF :
 * la couleur de l'objet ne vire jamais au gris sale dans l'ombre.
 */
const RAMP: [number, number, number][] = [
  [92, 78, 150],
  [176, 168, 214],
  [255, 248, 236],
];

function gradientMap(steps = 3): THREE.DataTexture {
  let t = gradientMaps.get(steps);
  if (t) return t;
  const data = new Uint8Array(steps * 4);
  for (let i = 0; i < steps; i++) {
    const c = RAMP[Math.round((i * (RAMP.length - 1)) / Math.max(1, steps - 1))];
    data.set([...c, 255], i * 4);
  }
  t = new THREE.DataTexture(data, steps, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  gradientMaps.set(steps, t);
  return t;
}

export interface MatOpts {
  /** Matériau non éclairé (écrans, néons, lumières). */
  glow?: boolean;
  map?: THREE.Texture;
  opacity?: number;
  side?: THREE.Side;
}

export function mat(color: THREE.ColorRepresentation, o: MatOpts = {}): THREE.Material {
  const opacity = o.opacity ?? 1;
  // three.js avertit sur les paramètres `undefined` : on ne passe que ceux fournis
  const params = { color, transparent: opacity < 1, opacity, ...(o.map && { map: o.map }), ...(o.side !== undefined && { side: o.side }) };
  if (o.glow) return new THREE.MeshBasicMaterial({ ...params, toneMapped: false, fog: false });
  return new THREE.MeshToonMaterial({ ...params, gradientMap: gradientMap() });
}

const EDGE = new THREE.LineBasicMaterial({ color: 0x0a0618, transparent: true, opacity: 0.7 });

/** Ajoute des arêtes sombres (trait d'illustration) à un mesh. */
export function outline(mesh: THREE.Mesh, angle = 30): THREE.Mesh {
  mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, angle), EDGE));
  return mesh;
}

export interface ShapeOpts extends MatOpts {
  edges?: boolean;
  shadow?: boolean;
}

function finish(geo: THREE.BufferGeometry, color: THREE.ColorRepresentation, o: ShapeOpts): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat(color, o));
  const lit = !o.glow;
  m.castShadow = lit && (o.shadow ?? true);
  m.receiveShadow = lit;
  if (o.edges ?? lit) outline(m);
  return m;
}

export function box(w: number, h: number, d: number, color: THREE.ColorRepresentation, o: ShapeOpts = {}): THREE.Mesh {
  return finish(new THREE.BoxGeometry(w, h, d), color, o);
}

export function cyl(rTop: number, rBot: number, h: number, color: THREE.ColorRepresentation, o: ShapeOpts & { seg?: number } = {}): THREE.Mesh {
  return finish(new THREE.CylinderGeometry(rTop, rBot, h, o.seg ?? 12), color, o);
}

export function sphere(r: number, color: THREE.ColorRepresentation, o: ShapeOpts & { seg?: number } = {}): THREE.Mesh {
  const s = o.seg ?? 12;
  return finish(new THREE.SphereGeometry(r, s, Math.max(6, s / 2)), color, { edges: false, ...o });
}

export function torus(r: number, tube: number, color: THREE.ColorRepresentation, o: ShapeOpts = {}): THREE.Mesh {
  return finish(new THREE.TorusGeometry(r, tube, 6, 20), color, { edges: false, ...o });
}

/** Plan simple (sol, mur, écran). Face +Z. */
export function plane(w: number, h: number, color: THREE.ColorRepresentation, o: ShapeOpts = {}): THREE.Mesh {
  return finish(new THREE.PlaneGeometry(w, h), color, { edges: false, shadow: false, ...o });
}

// ── textures peintes ───────────────────────────────────────────────────

const FONT = '"Chakra Petch", "Trebuchet MS", "DejaVu Sans", sans-serif';

export interface LabelOpts {
  color?: string;
  bg?: string;
  /** Hauteur de ligne en px de texture, à l'échelle 128 px / unité. */
  size?: number;
  bold?: boolean;
  mono?: boolean;
  align?: CanvasTextAlign;
}

/** Texture de texte, à poser sur un plan de taille w × h (unités monde). */
export function textTexture(text: string, w: number, h: number, o: LabelOpts = {}): THREE.CanvasTexture {
  // 320 px / unité, plafonné à 2048 : textes nets même en gros plan
  const PX = Math.min(320, 2048 / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.max(8, Math.round(w * PX));
  c.height = Math.max(8, Math.round(h * PX));
  const g = c.getContext('2d')!;
  if (o.bg) {
    g.fillStyle = o.bg;
    g.fillRect(0, 0, c.width, c.height);
  }
  const lines = text.split('\n');
  const family = o.mono ? '"Courier New", monospace' : FONT;
  const font = (px: number) => `${o.bold ? 'bold ' : ''}${px}px ${family}`;
  let size = o.size !== undefined ? (o.size * PX) / 128 : Math.min(c.height / (lines.length * 1.25), (48 * PX) / 128);
  // rétrécit le texte pour qu'il tienne en largeur
  g.font = font(size);
  const widest = Math.max(...lines.map((l) => g.measureText(l).width));
  if (widest > c.width * 0.92) size *= (c.width * 0.92) / widest;
  g.font = font(size);
  g.fillStyle = o.color ?? '#ffffff';
  g.textAlign = o.align ?? 'center';
  g.textBaseline = 'middle';
  const x = g.textAlign === 'left' ? size * 0.4 : c.width / 2;
  const lh = size * 1.2;
  lines.forEach((l, i) => g.fillText(l, x, c.height / 2 + (i - (lines.length - 1) / 2) * lh));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Panneau de texte plat (lumineux par défaut), face +Z. */
export function label(text: string, w: number, h: number, o: LabelOpts & { lit?: boolean } = {}): THREE.Mesh {
  const map = textTexture(text, w, h, o);
  const m = o.lit
    ? new THREE.MeshToonMaterial({ map, gradientMap: gradientMap(), transparent: !o.bg })
    : new THREE.MeshBasicMaterial({ map, transparent: !o.bg, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  mesh.receiveShadow = !!o.lit;
  return mesh;
}

/** Dégradé vertical (haut → bas), pour murs et ciels. */
export function gradientTexture(top: string, bottom: string, stops: [number, string][] = []): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 0, c.height);
  grad.addColorStop(0, top);
  for (const [at, col] of stops) grad.addColorStop(at, col);
  grad.addColorStop(1, bottom);
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Ciel étoilé (fond de hublot). */
export function starTexture(seed = 7, w = 512, h = 256, planet?: { x: number; y: number; r: number; color: string }): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#05030f');
  grad.addColorStop(1, '#1a0b33');
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 140; i++) {
    g.fillStyle = rnd() > 0.85 ? '#ffd8a8' : '#ffffff';
    const r = rnd() * 1.6 + 0.3;
    g.fillRect(rnd() * w, rnd() * h, r, r);
  }
  if (planet) {
    g.fillStyle = planet.color;
    g.beginPath();
    g.arc(planet.x * w, planet.y * h, planet.r * h, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.beginPath();
    g.arc(planet.x * w + planet.r * h * 0.35, planet.y * h + planet.r * h * 0.2, planet.r * h, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Bandes diagonales (signalétique danger). */
export function stripeTexture(a: string, b: string, n = 8): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = a;
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = b;
  const step = 128 / n;
  for (let i = -n; i < n * 2; i += 2) {
    g.beginPath();
    g.moveTo(i * step, 0);
    g.lineTo((i + 1) * step, 0);
    g.lineTo((i + 1) * step - 128, 128);
    g.lineTo(i * step - 128, 128);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Regroupe des objets dans un Group (avec position optionnelle). */
export function group(children: THREE.Object3D[], x = 0, y = 0, z = 0): THREE.Group {
  const g = new THREE.Group();
  g.add(...children);
  g.position.set(x, y, z);
  return g;
}

/** Positionne un objet et le renvoie (chaînage). */
export function at<T extends THREE.Object3D>(o: T, x: number, y: number, z: number, ry = 0): T {
  o.position.set(x, y, z);
  o.rotation.y = ry;
  return o;
}

/** Dalles de sol (deux tons + joints). */
export function tileTexture(a: string, b: string, joint: string, repeat: [number, number]): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = a;
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = b;
  g.fillRect(0, 0, 64, 64);
  g.fillRect(64, 64, 64, 64);
  g.strokeStyle = joint;
  g.lineWidth = 3;
  g.strokeRect(0, 0, 64, 64);
  g.strokeRect(64, 64, 64, 64);
  g.strokeRect(64, 0, 64, 64);
  g.strokeRect(0, 64, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 8;
  return t;
}

const glowTextures = new Map<string, THREE.CanvasTexture>();

/** Halo additif (sprite plat face caméra). */
export function glow(color: string, size: number, opacity = 0.6): THREE.Sprite {
  let t = glowTextures.get(color);
  if (!t) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, color);
    grad.addColorStop(0.35, color + 'aa');
    grad.addColorStop(1, color + '00');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    glowTextures.set(color, t);
  }
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: t, blending: THREE.AdditiveBlending, transparent: true, opacity, depthWrite: false, toneMapped: false, fog: false }),
  );
  s.scale.set(size, size, 1);
  return s;
}

// ── décalcomanies (étiquettes sans texte) ─────────────────────────────

/** Pictogramme imprimé sur une étiquette de produit. */
export type DecalMark = 'drop' | 'swirl' | 'atom' | 'flame' | 'skull';

const decalTextures = new Map<string, THREE.CanvasTexture>();

/**
 * Étiquette de flacon : papier crème, bandeau de la couleur du produit,
 * pictogramme encré et lignes de « petits caractères » illisibles. Le nom
 * du produit n'est donné qu'au survol (HUD) : l'objet reste un objet.
 */
export function decalTexture(band: string, mark: DecalMark): THREE.CanvasTexture {
  const id = `${band}|${mark}`;
  const cached = decalTextures.get(id);
  if (cached) return cached;
  const W = 256;
  const H = 192;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const ink = '#2a1f3a';
  g.fillStyle = '#efe7d4';
  g.beginPath();
  g.roundRect(4, 4, W - 8, H - 8, 18);
  g.fill();
  g.save();
  g.clip();
  g.fillStyle = band;
  g.fillRect(0, 0, W, 34);
  g.fillStyle = ink;
  g.globalAlpha = 0.85;
  g.fillRect(0, 34, W, 5);
  g.globalAlpha = 1;
  g.restore();
  // losange de danger, pictogramme au centre
  const cx = W / 2;
  const cy = 100;
  const r = 44;
  g.lineWidth = 7;
  g.strokeStyle = ink;
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(cx, cy - r);
  g.lineTo(cx + r, cy);
  g.lineTo(cx, cy + r);
  g.lineTo(cx - r, cy);
  g.closePath();
  g.stroke();
  g.fillStyle = ink;
  g.lineWidth = 5;
  g.beginPath();
  switch (mark) {
    case 'drop':
      g.moveTo(cx, cy - 20);
      g.bezierCurveTo(cx + 18, cy, cx + 14, cy + 18, cx, cy + 18);
      g.bezierCurveTo(cx - 14, cy + 18, cx - 18, cy, cx, cy - 20);
      g.fill();
      break;
    case 'swirl':
      for (let i = 0; i < 3; i++) {
        const y = cy - 12 + i * 12;
        g.moveTo(cx - 20, y);
        g.bezierCurveTo(cx - 8, y - 8, cx + 4, y + 8, cx + 20, y - 2);
      }
      g.stroke();
      break;
    case 'atom':
      for (const a of [0, Math.PI / 3, -Math.PI / 3]) g.ellipse(cx, cy, 22, 8, a, 0, Math.PI * 2);
      g.stroke();
      g.beginPath();
      g.arc(cx, cy, 5, 0, Math.PI * 2);
      g.fill();
      break;
    case 'flame':
      g.moveTo(cx, cy - 22);
      g.bezierCurveTo(cx + 22, cy - 2, cx + 14, cy + 20, cx, cy + 20);
      g.bezierCurveTo(cx - 14, cy + 20, cx - 20, cy + 4, cx - 6, cy - 8);
      g.bezierCurveTo(cx - 6, cy + 2, cx - 2, cy + 4, cx, cy + 2);
      g.bezierCurveTo(cx + 2, cy - 6, cx - 2, cy - 14, cx, cy - 22);
      g.fill();
      break;
    case 'skull':
      g.arc(cx, cy - 4, 14, 0, Math.PI * 2);
      g.fill();
      g.fillRect(cx - 8, cy + 6, 16, 10);
      g.fillStyle = '#efe7d4';
      g.beginPath();
      g.arc(cx - 5, cy - 4, 4, 0, Math.PI * 2);
      g.arc(cx + 5, cy - 4, 4, 0, Math.PI * 2);
      g.fill();
      break;
  }
  // petits caractères (illisibles à dessein)
  g.fillStyle = ink;
  g.globalAlpha = 0.35;
  for (const [y, w] of [[158, 150], [170, 110]] as const) g.fillRect(cx - w / 2, y, w, 5);
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  decalTextures.set(id, t);
  return t;
}

/**
 * Étiquette collée sur un flacon, éclairée comme lui. Sans `radius` : plan
 * face +Z ; avec : portion de cylindre qui épouse le corps (centrée sur +Z).
 */
export function decal(w: number, h: number, band: string, mark: DecalMark, radius?: number): THREE.Mesh {
  const geo = radius ? new THREE.CylinderGeometry(radius, radius, h, 20, 1, true, -w / radius / 2, w / radius) : new THREE.PlaneGeometry(w, h);
  const m = new THREE.MeshToonMaterial({ map: decalTexture(band, mark), gradientMap: gradientMap(), transparent: true, polygonOffset: true, polygonOffsetFactor: -2 });
  const mesh = new THREE.Mesh(geo, m);
  mesh.receiveShadow = true;
  return mesh;
}
