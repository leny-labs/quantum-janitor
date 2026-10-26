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
  [74, 58, 140],
  [170, 158, 214],
  [255, 246, 230],
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

const EDGE = new THREE.LineBasicMaterial({ color: 0x0a0618, transparent: true, opacity: 0.82 });

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
  // filtrage trilinéaire + anisotropie (bridée par le GPU) : net de biais et à distance
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.anisotropy = 8;
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
  // biseau : arête claire en haut à gauche de chaque dalle, sombre en bas à droite
  for (const [x, y] of [[0, 0], [64, 0], [0, 64], [64, 64]]) {
    g.fillStyle = 'rgba(255,240,220,0.09)';
    g.fillRect(x + 2, y + 2, 60, 3);
    g.fillRect(x + 2, y + 2, 3, 60);
    g.fillStyle = 'rgba(8,4,20,0.22)';
    g.fillRect(x + 2, y + 59, 60, 3);
    g.fillRect(x + 59, y + 2, 3, 60);
  }
  // usure : rayures et taches discrètes (illustration, pas de bruit photo)
  let s = 13;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  g.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    g.strokeStyle = `rgba(8,4,20,${0.1 + rnd() * 0.1})`;
    g.lineWidth = 1 + rnd() * 1.5;
    const x = rnd() * 128;
    const y = rnd() * 128;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + 8 + rnd() * 18, y + (rnd() - 0.5) * 6);
    g.stroke();
  }
  for (let i = 0; i < 3; i++) {
    g.fillStyle = 'rgba(8,4,20,0.12)';
    g.beginPath();
    g.ellipse(rnd() * 128, rnd() * 128, 4 + rnd() * 8, 2 + rnd() * 4, rnd() * 3, 0, Math.PI * 2);
    g.fill();
  }
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

// ── décalcomanies (étiquettes de produits) ────────────────────────────

/** Pictogramme imprimé sur une étiquette de produit. */
export type DecalMark = 'drop' | 'swirl' | 'atom' | 'flame' | 'skull';

const decalTextures = new Map<string, THREE.CanvasTexture>();
const DECAL_PAPER = '#efe7d4';
const DECAL_INK = '#1c1428';

/** Losange de danger + pictogramme, centré sur (cx, cy), rayon r. */
function drawDecalMark(g: CanvasRenderingContext2D, mark: DecalMark, cx: number, cy: number, r: number): void {
  g.save();
  g.translate(cx, cy);
  g.scale(r / 44, r / 44);
  g.lineWidth = 7;
  g.strokeStyle = DECAL_INK;
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(0, -44);
  g.lineTo(44, 0);
  g.lineTo(0, 44);
  g.lineTo(-44, 0);
  g.closePath();
  g.stroke();
  g.fillStyle = DECAL_INK;
  g.lineWidth = 5;
  g.beginPath();
  switch (mark) {
    case 'drop':
      g.moveTo(0, -20);
      g.bezierCurveTo(18, 0, 14, 18, 0, 18);
      g.bezierCurveTo(-14, 18, -18, 0, 0, -20);
      g.fill();
      break;
    case 'swirl':
      for (let i = 0; i < 3; i++) {
        const y = -12 + i * 12;
        g.moveTo(-20, y);
        g.bezierCurveTo(-8, y - 8, 4, y + 8, 20, y - 2);
      }
      g.stroke();
      break;
    case 'atom':
      for (const a of [0, Math.PI / 3, -Math.PI / 3]) g.ellipse(0, 0, 22, 8, a, 0, Math.PI * 2);
      g.stroke();
      g.beginPath();
      g.arc(0, 0, 5, 0, Math.PI * 2);
      g.fill();
      break;
    case 'flame':
      g.moveTo(0, -22);
      g.bezierCurveTo(22, -2, 14, 20, 0, 20);
      g.bezierCurveTo(-14, 20, -20, 4, -6, -8);
      g.bezierCurveTo(-6, 2, -2, 4, 0, 2);
      g.bezierCurveTo(2, -6, -2, -14, 0, -22);
      g.fill();
      break;
    case 'skull':
      g.arc(0, -4, 14, 0, Math.PI * 2);
      g.fill();
      g.fillRect(-8, 6, 16, 10);
      g.fillStyle = DECAL_PAPER;
      g.beginPath();
      g.arc(-5, -4, 4, 0, Math.PI * 2);
      g.arc(5, -4, 4, 0, Math.PI * 2);
      g.fill();
      break;
  }
  g.restore();
}

/** Texte gras centré, réduit pour tenir dans la boîte (x, y, w, h). */
function fitText(g: CanvasRenderingContext2D, text: string, x: number, y: number, w: number, h: number, max: number): void {
  const lines = text.split('\n');
  let size = Math.min(max, h / (lines.length * 1.08));
  g.font = `700 ${size}px ${FONT}`;
  const widest = Math.max(...lines.map((l) => g.measureText(l).width));
  if (widest > w) size *= w / widest;
  g.font = `700 ${size}px ${FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const lh = size * 1.02;
  // contour de la même encre : trait épaissi, lisible une fois réduit
  g.strokeStyle = g.fillStyle;
  g.lineWidth = size * 0.12;
  g.lineJoin = 'round';
  lines.forEach((l, i) => {
    const ly = y + h / 2 + (i - (lines.length - 1) / 2) * lh;
    g.strokeText(l, x + w / 2, ly);
    g.fillText(l, x + w / 2, ly);
  });
}

/**
 * Étiquette de flacon : papier crème liseré d'encre, bandeau de la couleur
 * du produit, pictogramme de danger à gauche et nom en gras à l'encre
 * (lisible à distance de jeu). `name` : lignes séparées par « \n » ;
 * `aspect` : largeur / hauteur de la plaque.
 */
export function decalTexture(band: string, mark: DecalMark, name: string, aspect = 1.25): THREE.CanvasTexture {
  const H = 256;
  const W = Math.round(H * Math.min(3, Math.max(1, aspect)));
  const id = `${band}|${mark}|${name}|${W}`;
  const cached = decalTextures.get(id);
  if (cached) return cached;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = DECAL_PAPER;
  g.beginPath();
  g.roundRect(4, 4, W - 8, H - 8, 20);
  g.fill();
  g.save();
  g.clip();
  g.fillStyle = band;
  g.fillRect(0, 0, W, 34);
  g.fillRect(0, H - 22, W, 22);
  g.fillStyle = DECAL_INK;
  g.fillRect(0, 34, W, 5);
  g.fillRect(0, H - 26, W, 4);
  g.restore();
  // liseré d'encre : plaque bien détachée du flacon
  g.strokeStyle = DECAL_INK;
  g.lineWidth = 7;
  g.beginPath();
  g.roundRect(7, 7, W - 14, H - 14, 18);
  g.stroke();
  // picto à gauche, nom sur tout le reste
  const r = 34;
  drawDecalMark(g, mark, 18 + r, 133, r);
  g.fillStyle = DECAL_INK;
  const nx = 18 + r * 2 + 8;
  fitText(g, name, nx, 46, W - nx - 16, 174, 96);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  decalTextures.set(id, t);
  return t;
}

/** Petite étiquette volante « ??? » (fiole mystère), recto-verso. */
export function mysteryTag(w: number, h: number): THREE.Mesh {
  const key = '|mystery|';
  let t = decalTextures.get(key);
  if (!t) {
    const c = document.createElement('canvas');
    c.width = 192;
    c.height = 128;
    const g = c.getContext('2d')!;
    g.fillStyle = DECAL_PAPER;
    g.beginPath();
    // étiquette à coin coupé + œillet
    g.moveTo(34, 6);
    g.lineTo(186, 6);
    g.lineTo(186, 122);
    g.lineTo(34, 122);
    g.lineTo(6, 64);
    g.closePath();
    g.fill();
    g.strokeStyle = DECAL_INK;
    g.lineWidth = 6;
    g.stroke();
    g.beginPath();
    g.arc(34, 64, 8, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = DECAL_INK;
    fitText(g, '???', 50, 14, 128, 100, 92);
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    decalTextures.set(key, t);
  }
  const m = new THREE.MeshToonMaterial({ map: t, gradientMap: gradientMap(), transparent: true, side: THREE.DoubleSide, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 0.45 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Étiquette collée sur un flacon, éclairée comme lui (avec une pointe
 * d'auto-illumination). Sans `radius` : plan
 * face +Z ; avec : portion de cylindre qui épouse le corps (centrée sur +Z).
 */
export function decal(w: number, h: number, band: string, mark: DecalMark, name: string, radius?: number): THREE.Mesh {
  const geo = radius ? new THREE.CylinderGeometry(radius, radius, h, 20, 1, true, -w / radius / 2, w / radius) : new THREE.PlaneGeometry(w, h);
  const map = decalTexture(band, mark, name, w / h);
  // légère auto-illumination : le papier reste lisible dans les coins sombres
  const m = new THREE.MeshToonMaterial({
    map,
    gradientMap: gradientMap(),
    transparent: true,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    emissive: '#ffffff',
    emissiveMap: map,
    emissiveIntensity: 0.45,
  });
  const mesh = new THREE.Mesh(geo, m);
  mesh.receiveShadow = true;
  return mesh;
}

// ── mise en lumière « affiche » : murs peints, flaques, faisceaux, néons ──

/**
 * Mur peint façon illustration : dégradé haut → bas, corniche sombre, joint
 * horizontal à mi-hauteur, soubassement plus foncé liseré de clair, coulures
 * de crasse. `width` / `height` en unités monde ; le motif se répète tous les
 * 4 unités en largeur.
 */
export function wallTexture(top: string, bottom: string, width: number, height: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const g = c.getContext('2d')!;
  const H = c.height;
  const px = H / height;
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, H);
  // corniche : ombre portée du plafond
  const cor = g.createLinearGradient(0, 0, 0, px * 1.4);
  cor.addColorStop(0, 'rgba(6,3,16,0.55)');
  cor.addColorStop(1, 'rgba(6,3,16,0)');
  g.fillStyle = cor;
  g.fillRect(0, 0, c.width, px * 1.4);
  // joint horizontal (panneaux hauts / bas)
  const seam = H - px * 3.4;
  g.fillStyle = 'rgba(6,3,16,0.35)';
  g.fillRect(0, seam, c.width, 3);
  g.fillStyle = 'rgba(255,240,220,0.1)';
  g.fillRect(0, seam + 3, c.width, 2);
  // soubassement
  const wain = H - px * 1.1;
  g.fillStyle = 'rgba(6,3,16,0.28)';
  g.fillRect(0, wain, c.width, H - wain);
  g.fillStyle = 'rgba(255,240,220,0.16)';
  g.fillRect(0, wain, c.width, 3);
  g.fillStyle = 'rgba(6,3,16,0.4)';
  g.fillRect(0, wain + 3, c.width, 2);
  // coulures sous le joint
  let s = 29;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 7; i++) {
    const x = rnd() * c.width;
    const len = px * (0.3 + rnd() * 1.2);
    const lg = g.createLinearGradient(0, seam, 0, seam + len);
    lg.addColorStop(0, 'rgba(6,3,16,0.22)');
    lg.addColorStop(1, 'rgba(6,3,16,0)');
    g.fillStyle = lg;
    g.fillRect(x, seam + 5, 2 + rnd() * 4, len);
  }
  // rivets le long du joint
  g.fillStyle = 'rgba(255,240,220,0.18)';
  for (let x = 16; x < c.width; x += 64) {
    g.beginPath();
    g.arc(x, seam - 8, 2.5, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.repeat.set(width / 4, 1);
  t.anisotropy = 4;
  return t;
}

const softTextures = new Map<string, THREE.CanvasTexture>();

/** Dégradé alpha (blanc → transparent) : radial (`disc`) ou vertical (`fade`). */
function softTexture(kind: 'disc' | 'fade' | 'edge'): THREE.CanvasTexture {
  let t = softTextures.get(kind);
  if (t) return t;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  if (kind === 'disc') {
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.45, 'rgba(255,255,255,0.55)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
  } else {
    // fade : opaque en haut → transparent en bas ; edge : idem, en marche plus raide
    const grad = g.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    if (kind === 'edge') grad.addColorStop(0.35, 'rgba(255,255,255,0.45)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
  }
  g.fillRect(0, 0, 128, 128);
  t = new THREE.CanvasTexture(c);
  softTextures.set(kind, t);
  return t;
}

function additive(color: THREE.ColorRepresentation, map: THREE.Texture, opacity: number, side: THREE.Side = THREE.FrontSide): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ color, map, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false, side });
}

/** Flaque de lumière au sol (reflet de néon, halo de lampe). Ellipse w × d. */
export function pool(color: THREE.ColorRepresentation, w: number, d: number, opacity = 0.35): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), additive(color, softTexture('disc'), opacity));
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 2;
  return m;
}

/**
 * Faisceau de lumière volumétrique (cône ouvert, additif, qui s'éteint vers
 * le bas). Origine au sommet ; s'étend vers -Y sur `h`.
 */
export function beam(color: THREE.ColorRepresentation, rTop: number, rBot: number, h: number, opacity = 0.16): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(rTop, rBot, h, 24, 1, true);
  geo.translate(0, -h / 2, 0);
  const m = new THREE.Mesh(geo, additive(color, softTexture('fade'), opacity, THREE.DoubleSide));
  m.renderOrder = 3;
  return m;
}

/**
 * Ombre d'angle (occlusion peinte) : bande sombre qui s'estompe, posée au
 * pied d'un mur ou au sol. Plan w × h face +Z, sombre côté haut de la texture.
 */
export function aoStrip(w: number, h: number, opacity = 0.5, color: THREE.ColorRepresentation = '#07030f'): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ color, alphaMap: softTexture('edge'), transparent: true, opacity, depthWrite: false, toneMapped: false }),
  );
  m.renderOrder = 1;
  return m;
}

/**
 * Enseigne néon : texte en tube lumineux (halo peint) sur plaque sombre
 * optionnelle. Renvoie le mesh ; `material.opacity` sert au grésillement.
 * `off` : tube éteint (verre teinté, ni halo ni âme blanche).
 */
export function neon(text: string, w: number, h: number, color: string, o: { plate?: string; font?: string; off?: boolean } = {}): THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> {
  const PX = Math.min(256, 2048 / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * PX);
  c.height = Math.round(h * PX);
  const g = c.getContext('2d')!;
  if (o.plate) {
    g.fillStyle = o.plate;
    g.beginPath();
    g.roundRect(4, 4, c.width - 8, c.height - 8, c.height * 0.18);
    g.fill();
    g.strokeStyle = color;
    g.globalAlpha = 0.35;
    g.lineWidth = 3;
    g.stroke();
    g.globalAlpha = 1;
  }
  const lines = text.split('\n');
  const family = o.font ?? 'Bungee, "Chakra Petch", Impact, sans-serif';
  let size = c.height / (lines.length * 1.35);
  g.font = `${size}px ${family}`;
  const widest = Math.max(...lines.map((l) => g.measureText(l).width));
  if (widest > c.width * 0.86) size *= (c.width * 0.86) / widest;
  g.font = `${size}px ${family}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const lh = size * 1.15;
  const draw = () => lines.forEach((l, i) => g.fillText(l, c.width / 2, c.height / 2 + (i - (lines.length - 1) / 2) * lh));
  if (o.off) {
    g.fillStyle = color;
    draw();
  } else {
    // halo large, puis tube coloré, puis âme presque blanche
    g.shadowColor = color;
    g.shadowBlur = size * 0.6;
    g.fillStyle = color;
    draw();
    draw();
    g.shadowBlur = size * 0.15;
    g.fillStyle = '#ffffff';
    g.globalAlpha = 0.55;
    draw();
    g.globalAlpha = 1;
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false, fog: false, depthWrite: false }));
  m.renderOrder = 2;
  return m;
}

/**
 * Passe finale plein écran : vignette teintée (coins violets) + léger voile
 * chaud au centre-haut. Rendue par-dessus la scène, sans profondeur.
 */
export class Vignette {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  constructor(o: { color?: string; strength?: number; warm?: string } = {}) {
    // quad en z = 0 : la caméra recule pour qu'il ne tombe pas sur le plan near
    this.camera.position.z = 0.5;
    const c = document.createElement('canvas');
    c.width = 320;
    c.height = 180;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(160, 80, 40, 160, 90, 200);
    const col = new THREE.Color(o.color ?? '#120626');
    const rgb = `${Math.round(col.r * 255)},${Math.round(col.g * 255)},${Math.round(col.b * 255)}`;
    const k = o.strength ?? 0.6;
    grad.addColorStop(0, `rgba(${rgb},0)`);
    grad.addColorStop(0.55, `rgba(${rgb},${k * 0.12})`);
    grad.addColorStop(1, `rgba(${rgb},${k})`);
    g.fillStyle = grad;
    g.fillRect(0, 0, 320, 180);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
    this.scene.add(quad);
    if (o.warm) {
      const wc = document.createElement('canvas');
      wc.width = wc.height = 64;
      const wg = wc.getContext('2d')!;
      const wgrad = wg.createRadialGradient(32, 18, 0, 32, 18, 40);
      wgrad.addColorStop(0, o.warm);
      wgrad.addColorStop(1, o.warm.slice(0, 7) + '00');
      wg.fillStyle = wgrad;
      wg.fillRect(0, 0, 64, 64);
      const wt = new THREE.CanvasTexture(wc);
      const veil = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.MeshBasicMaterial({ map: wt, transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, toneMapped: false }),
      );
      this.scene.add(veil);
    }
  }

  /** Dose de la passe (0 = invisible, 1 = pleine). */
  setOpacity(a: number): void {
    this.scene.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined;
      if (m) m.opacity = a;
    });
  }

  render(renderer: THREE.WebGLRenderer): void {
    const auto = renderer.autoClear;
    renderer.autoClear = false;
    renderer.render(this.scene, this.camera);
    renderer.autoClear = auto;
  }
}
