// Kit organique de la dimension B-7 (ch.1 « Blattaria Prime ») : coque de
// chitine et de résine (mur à plaques, sol tiède collant et brillant), côtes
// de voûte, coulures, flaques ambrées, bougies, lanternes-œufs, brume, et
// foules de cafards en sprites GenAI. Même grammaire toon que shell.ts (ch.0).
import * as THREE from 'three';
import { at, beam, cyl, glow, mat, outline, pool, sphere } from '../kit';
import { roachSprite, type RoachPose } from '../props';
import type { Stage } from '../Stage';

/** Petit PRNG déterministe (mêmes décors à chaque chargement). */
export function rng(seed: number): () => number {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function canvasTexture(c: HTMLCanvasElement, repeat?: [number, number]): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repeat);
  }
  return t;
}

const INK = '#160806';

/**
 * Paroi de chitine : plaques arrondies qui se chevauchent (trait encré,
 * reflet crème en croissant), coulures de résine ambrée, assombrie en haut.
 */
export function chitinTexture(top: string, bottom: string, w: number, h: number, seed = 3): THREE.CanvasTexture {
  const W = 2048;
  const H = Math.round((W * h) / w);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const r = rng(seed);
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, top);
  bg.addColorStop(1, bottom);
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  // plaques : rangées décalées, de bas en haut (celles du dessus recouvrent)
  const pw = W / (w / 1.6);
  const ph = pw * 0.62;
  for (let row = Math.ceil(H / ph) + 1; row >= -1; row--) {
    const y = row * ph * 0.78;
    for (let x = (row % 2) * (pw / 2) - pw; x < W + pw; x += pw) {
      const jx = x + (r() - 0.5) * pw * 0.2;
      const jw = pw * (0.55 + r() * 0.12);
      const jh = ph * (0.62 + r() * 0.15);
      const k = y / H;
      const shade = g.createLinearGradient(0, y - jh, 0, y + jh);
      shade.addColorStop(0, `rgba(255,214,160,${0.1 + 0.08 * k})`);
      shade.addColorStop(0.5, 'rgba(0,0,0,0)');
      shade.addColorStop(1, 'rgba(10,2,0,0.42)');
      g.fillStyle = bg;
      g.beginPath();
      g.ellipse(jx, y, jw, jh, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = shade;
      g.fill();
      g.strokeStyle = INK;
      g.globalAlpha = 0.75;
      g.lineWidth = 5;
      g.stroke();
      // reflet crème en croissant, en haut à gauche de la plaque
      g.globalAlpha = 0.22 + 0.18 * k;
      g.strokeStyle = '#ffe2b0';
      g.lineWidth = 6;
      g.beginPath();
      g.ellipse(jx - jw * 0.08, y - jh * 0.1, jw * 0.72, jh * 0.62, 0, Math.PI * 1.12, Math.PI * 1.55);
      g.stroke();
      g.globalAlpha = 1;
    }
  }
  // coulures de résine (ambre, reflet) : fines, courtes, discrètes
  for (let i = 0; i < Math.round(w * 0.7); i++) {
    const x = r() * W;
    const y0 = r() * H * 0.6;
    const len = H * (0.04 + r() * 0.1);
    const lw = 4 + r() * 6;
    g.strokeStyle = 'rgba(170,96,30,0.45)';
    g.lineCap = 'round';
    g.lineWidth = lw;
    g.beginPath();
    g.moveTo(x, y0);
    g.bezierCurveTo(x + (r() - 0.5) * 8, y0 + len * 0.4, x + (r() - 0.5) * 8, y0 + len * 0.7, x, y0 + len);
    g.stroke();
    g.fillStyle = 'rgba(200,124,44,0.6)';
    g.beginPath();
    g.arc(x, y0 + len, lw * 0.75, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(255,230,180,0.4)';
    g.lineWidth = lw * 0.25;
    g.beginPath();
    g.moveTo(x - lw * 0.2, y0 + len * 0.2);
    g.lineTo(x - lw * 0.2, y0 + len * 0.75);
    g.stroke();
  }
  // le haut se perd dans l'ombre de la voûte
  const dark = g.createLinearGradient(0, 0, 0, H * 0.45);
  dark.addColorStop(0, 'rgba(8,2,0,0.7)');
  dark.addColorStop(1, 'rgba(8,2,0,0)');
  g.fillStyle = dark;
  g.fillRect(0, 0, W, H * 0.45);
  return canvasTexture(c);
}

/** Sol de résine tiède : cellules organiques, veines sombres, reflets brillants (répétée). */
export function resinTexture(base: string, light: string, seed = 5): THREE.CanvasTexture {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d')!;
  const r = rng(seed);
  g.fillStyle = base;
  g.fillRect(0, 0, S, S);
  // cellules : ellipses claires cernées de sombre, dessinées en tuile (répétées aux bords)
  const cells: [number, number, number, number, number][] = [];
  for (let i = 0; i < 26; i++) cells.push([r() * S, r() * S, 30 + r() * 46, 20 + r() * 30, r() * Math.PI]);
  for (const [cx, cy, rx, ry, a] of cells) {
    for (const dx of [-S, 0, S]) {
      for (const dy of [-S, 0, S]) {
        g.fillStyle = light;
        g.globalAlpha = 0.5;
        g.beginPath();
        g.ellipse(cx + dx, cy + dy, rx, ry, a, 0, Math.PI * 2);
        g.fill();
        g.globalAlpha = 0.55;
        g.strokeStyle = INK;
        g.lineWidth = 3;
        g.stroke();
        // reflet humide
        g.globalAlpha = 0.35;
        g.strokeStyle = '#ffe9c4';
        g.lineWidth = 3;
        g.beginPath();
        g.ellipse(cx + dx, cy + dy, rx * 0.6, ry * 0.5, a, Math.PI * 1.1, Math.PI * 1.5);
        g.stroke();
      }
    }
  }
  g.globalAlpha = 1;
  return canvasTexture(c);
}

/** Tube effilé le long d'une courbe (rayon r0 → r1) : côtes, défenses, coulures. */
export function taperedTube(points: THREE.Vector3[], r0: number, r1: number, color: THREE.ColorRepresentation, seg = 40): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(points);
  const radial = 10;
  const geo = new THREE.TubeGeometry(curve, seg, 1, radial, false);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const p = new THREE.Vector3();
  const v = new THREE.Vector3();
  for (let i = 0; i <= seg; i++) {
    const u = i / seg;
    curve.getPointAt(u, p);
    const rad = THREE.MathUtils.lerp(r0, r1, u);
    for (let j = 0; j <= radial; j++) {
      const k = i * (radial + 1) + j;
      v.fromBufferAttribute(pos, k).sub(p).multiplyScalar(rad).add(p);
      pos.setXYZ(k, v.x, v.y, v.z);
    }
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat(color));
  m.castShadow = m.receiveShadow = true;
  return outline(m, 55);
}

/** Arche de voûte : demi-anneau de chitine de rayon R dans le plan z, centré en (x, y). */
export function vaultArch(R: number, tube: number, color: THREE.ColorRepresentation, arc = Math.PI): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.TorusGeometry(R, tube, 10, 48, arc), mat(color));
  m.rotation.z = (Math.PI - arc) / 2;
  m.castShadow = m.receiveShadow = true;
  return outline(m, 50);
}

export interface HiveSpec {
  /** Paroi : haut / bas du dégradé. */
  wall: [top: string, bottom: string];
  /** Sol : fond / cellules. */
  floor: [base: string, cells: string];
  /** Couleur des côtes de chitine. */
  rib: string;
  width?: number;
  depth?: number;
  height?: number;
  seed?: number;
}

/**
 * Coque organique : sol de résine, paroi de chitine (z = 0), ombres d'angle,
 * et proscenium de côtes sur les bords du cadre (la pièce est « dans » la ruche).
 */
export function hive(s: Stage, spec: HiveSpec): void {
  const width = spec.width ?? 26;
  const depth = spec.depth ?? 16;
  const height = spec.height ?? 10;
  const seed = spec.seed ?? 3;
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    mat('#ffffff', { map: resinTexture(spec.floor[0], spec.floor[1], seed + 2) }),
  );
  ((floor.material as THREE.MeshToonMaterial).map as THREE.Texture).repeat.set(width / 3.2, depth / 3.2);
  ((floor.material as THREE.MeshToonMaterial).map as THREE.Texture).wrapS = THREE.RepeatWrapping;
  ((floor.material as THREE.MeshToonMaterial).map as THREE.Texture).wrapT = THREE.RepeatWrapping;
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, depth / 2);
  floor.receiveShadow = true;
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat('#ffffff', { map: chitinTexture(spec.wall[0], spec.wall[1], width, height, seed) }));
  wall.position.set(0, height / 2, 0);
  wall.receiveShadow = true;
  s.add(floor, wall);
  // bourrelet de résine au pied de la paroi (la jonction sol / mur est organique)
  // (cylindre couché le long de x, à moitié dans le sol et dans la paroi)
  const lip = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, width, 12), mat(spec.floor[1]));
  lip.rotation.z = Math.PI / 2;
  lip.position.set(0, 0, 0.02);
  lip.receiveShadow = true;
  s.add(lip);
}

/** Côte de chitine plantée au sol en (x, z), qui monte en se courbant vers `lean` (x) et vers la caméra (`bow`). */
export function rib(x: number, z: number, h: number, lean: number, r: number, color: THREE.ColorRepresentation, bow = 0.6): THREE.Mesh {
  return taperedTube(
    [
      new THREE.Vector3(x, -0.2, z),
      new THREE.Vector3(x + lean * 0.12, h * 0.35, z + bow * 0.3),
      new THREE.Vector3(x + lean * 0.45, h * 0.75, z + bow * 0.8),
      new THREE.Vector3(x + lean, h, z + bow),
    ],
    r,
    r * 0.35,
    color,
  );
}

/** Stalactite de résine (pointe en bas) suspendue en (x, y, z), longueur `len`. */
export function drip(len: number, r: number, color = '#c47a24'): THREE.Group {
  const g = new THREE.Group();
  const body = at(cyl(r, r * 0.12, len, color, { seg: 8, edges: false }), 0, -len / 2, 0);
  const tip = at(sphere(r * 0.35, '#ffcf7a', { glow: true, seg: 8 }), 0, -len, 0);
  g.add(body, tip);
  return g;
}

/** Flaque ambrée au sol : aplat brillant + reflet additif. Renvoie le reflet (pour l'animer). */
export function puddle(s: Stage, x: number, z: number, w: number, d: number, color = '#b8741e'): THREE.Mesh {
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.5, 28), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.78, depthWrite: false }));
  disc.rotation.x = -Math.PI / 2;
  disc.scale.set(w, d, 1);
  disc.position.set(x, 0.008, z);
  disc.renderOrder = 1;
  const rim = new THREE.Mesh(new THREE.RingGeometry(0.46, 0.5, 28), new THREE.MeshBasicMaterial({ color: '#2a1206', transparent: true, opacity: 0.55, depthWrite: false }));
  rim.rotation.x = -Math.PI / 2;
  rim.scale.set(w, d, 1);
  rim.position.set(x, 0.009, z);
  rim.renderOrder = 1;
  const shine = at(pool('#ffd08a', w * 0.7, d * 0.5, 0.35), x - w * 0.1, 0.012, z - d * 0.08);
  s.add(disc, rim, shine);
  return shine;
}

/** Bougie de cire : corps crème, coulures, flamme (sphère + halo) qui vacille. */
export function candle(s: Stage, h: number, r = h * 0.18): THREE.Group {
  const g = new THREE.Group();
  g.add(at(cyl(r, r * 1.08, h, '#f3e2bf', { seg: 10 }), 0, h / 2, 0));
  g.add(at(cyl(r * 1.6, r * 1.9, h * 0.12, '#e9d3a8', { seg: 10, edges: false }), 0, h * 0.06, 0));
  const drop = at(sphere(r * 0.35, '#f7ead0', { seg: 6 }), r * 0.9, h * 0.75, 0);
  drop.scale.y = 1.8;
  g.add(drop);
  const flame = at(sphere(r * 0.55, '#ffe9a8', { glow: true, seg: 8 }), 0, h + r * 0.7, 0);
  flame.scale.y = 1.7;
  const halo = at(glow('#ffb347', r * 9, 0.55), 0, h + r * 0.8, 0);
  g.add(flame, halo);
  const ph = Math.random() * 10;
  s.animate((t) => {
    const k = 1 + Math.sin(t * 11 + ph) * 0.08 + Math.sin(t * 23 + ph * 2) * 0.05;
    flame.scale.set(k, 1.7 * k, k);
    halo.material.opacity = 0.45 * k;
  });
  return g;
}

/** Grappe de lanternes-œufs luminescentes (lueur chaude au pied des parois). */
export function eggLamps(s: Stage, x: number, z: number, size: number, color = '#ffc46b', light = true): THREE.Group {
  const g = new THREE.Group();
  const r = rng(Math.round(x * 31 + z * 17 + 99));
  const eggs: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const e = at(sphere(size * (0.22 + r() * 0.12), i % 2 ? color : '#ffe0a0', { glow: true, seg: 14 }), (r() - 0.5) * size * 0.8, 0, (r() - 0.5) * size * 0.4);
    e.scale.y = 1.35;
    e.position.y = (e.geometry as THREE.SphereGeometry).parameters.radius * 1.3;
    eggs.push(e);
    g.add(e);
  }
  // cupule de résine sombre
  g.add(at(cyl(size * 0.55, size * 0.4, size * 0.18, '#3a1a0a', { seg: 14 }), 0, size * 0.09, 0));
  const halo = at(glow(color, size * 4, 0.42), 0, size * 0.4, 0.05);
  g.add(halo);
  g.position.set(x, 0, z);
  s.add(g, at(pool(color, size * 5, size * 3, 0.28), x, 0.011, z + size * 0.3));
  if (light) {
    const l = new THREE.PointLight(color, 6, size * 9, 1.6);
    l.position.set(x, size * 0.9, z + 0.4);
    s.add(l);
  }
  const ph = x * 1.7;
  s.animate((t) => {
    halo.material.opacity = 0.36 + Math.sin(t * 1.3 + ph) * 0.08;
    eggs.forEach((e, i) => e.scale.set(1, 1.35 + Math.sin(t * 1.1 + i + ph) * 0.04, 1));
  });
  return g;
}

/** Nappes de brume chaude au ras du sol, qui dérivent lentement. */
export function mist(s: Stage, color: string, spots: [x: number, z: number, size: number][], opacity = 0.09): void {
  const puffs = spots.map(([x, z, size]) => {
    const m = at(glow(color, size, opacity), x, size * 0.12, z);
    m.scale.y = size * 0.35;
    m.renderOrder = 4;
    s.add(m);
    return { m, x };
  });
  s.animate((t) => puffs.forEach(({ m, x }, i) => (m.position.x = x + Math.sin(t * 0.13 + i * 1.9) * 0.6)));
}

/** Rai de lumière poussiéreuse qui tombe de la voûte. */
export function shaft(s: Stage, x: number, z: number, top: number, color = '#ffd8a0', opacity = 0.08): THREE.Mesh {
  const b = at(beam(color, 0.5, 2.4, top, opacity), x, top, z);
  s.add(b);
  return b;
}

// ── foules de cafards (sprites GenAI) ─────────────────────────────────

export interface RoachSpec {
  /** Pied du cafard à l'écran (pixel) et hauteur du sprite à l'écran (px). */
  px: [x: number, y: number];
  hpx: number;
  pose?: RoachPose;
  right?: boolean;
  /** Marche : aller-retour de `walk` mètres le long de x. */
  walk?: number;
}

export interface Crowd {
  roaches: THREE.Group[];
}

/**
 * Foule de cafards posés au sol d'après des points écran (la caméra de la
 * pièce les projette). Prière : dressés, petit balancement, de temps en temps
 * un regard (3/4) ; marche : frames walk1/walk2 en alternance + petit bob.
 */
export function crowd(s: Stage, specs: RoachSpec[], tint: THREE.ColorRepresentation, floorY = 0): Crowd {
  const roaches = specs.map((r, i) => {
    const foot = s.floorAt(r.px[0], r.px[1], floorY);
    const top = s.wallAt(r.px[0], r.px[1] - r.hpx, foot.z);
    const h = top.y - floorY;
    // hauteur du sprite = len × 1.15 × (336 / 362)
    const len = h / (1.15 * (336 / 362));
    const pose = r.pose ?? 'worship';
    const g = at(roachSprite(len, r.right ?? true, { pose, tint }), foot.x, floorY, foot.z);
    s.add(g);
    const sprite = g.userData.sprite as THREE.Sprite;
    const base = sprite.scale.clone();
    const ph = i * 1.37;
    const x0 = foot.x;
    let right = r.right ?? true;
    s.animate((t) => {
      if (r.walk) {
        // aller-retour : demi-tour aux bouts (changement de sens = UV miroir)
        const k = Math.sin(t * 0.35 + ph);
        g.position.x = x0 + k * r.walk;
        const dir = Math.cos(t * 0.35 + ph) > 0;
        if (dir !== right) right = dir;
        const step = Math.floor(t * 7 + ph) % 2 ? 'walk2' : 'walk1';
        g.userData.setPose(step, right);
        g.position.y = floorY + Math.abs(Math.sin(t * 14 + ph)) * len * 0.015;
        return;
      }
      if (pose === 'worship') {
        // prière : on s'incline, on se redresse ; parfois un coup d'œil vers la caméra
        const peek = Math.sin(t * 0.21 + ph * 3.1) > 0.93;
        g.userData.setPose(peek ? '34' : 'worship');
        sprite.scale.set(base.x, base.y * (1 + Math.sin(t * 2.2 + ph) * 0.035), 1);
        g.position.y = floorY + Math.max(0, Math.sin(t * 2.2 + ph)) * len * 0.02;
      } else {
        sprite.scale.set(base.x, base.y * (1 + Math.sin(t * 1.6 + ph) * 0.02), 1);
      }
    });
    return g;
  });
  return { roaches };
}

// ── l'éclat du Réacteur ───────────────────────────────────────────────

/**
 * Éclat du Réacteur d'Improbabilité : grappe de cristaux violets (âme
 * blanche), halo qui respire, étincelles qui tournoient (même grammaire que
 * le cœur du réacteur du labo). Origine à la base. Renvoie le groupe ; la
 * lumière ponctuelle est incluse.
 */
export function reactorShard(s: Stage, size: number): THREE.Group {
  const g = new THREE.Group();
  const crystals: THREE.Mesh[] = [];
  for (const [x, z, h, rz, rx] of [
    [0, 0, 1, 0, 0],
    [-0.28, 0.05, 0.62, 0.45, 0.1],
    [0.3, -0.04, 0.7, -0.4, -0.1],
    [0.08, 0.22, 0.45, -0.15, 0.5],
  ] as const) {
    const geo = new THREE.OctahedronGeometry(size * 0.22, 0);
    geo.scale(1, (h * 2.4) / 1, 1);
    const shell = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#b56cff', transparent: true, opacity: 0.82, toneMapped: false, fog: false }));
    shell.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: '#f3e0ff', transparent: true, opacity: 0.7 })));
    const core = new THREE.Mesh(geo.clone().scale(0.45, 0.8, 0.45), new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false, fog: false }));
    shell.add(core);
    shell.position.set(x * size, size * 0.22 * h * 2.4 * 0.75, z * size);
    shell.rotation.set(rx, 0, rz);
    crystals.push(shell);
    g.add(shell);
  }
  const halo = at(glow('#c77dff', size * 3.2, 0.55), 0, size * 0.45, 0.05);
  const inner = at(glow('#ffffff', size * 1.1, 0.5), 0, size * 0.45, 0.1);
  g.add(halo, inner);
  // petit éclat (bac de sortie) : lumière à proportion, pour ne pas brûler le décor proche
  const power = Math.min(1, size / 0.5);
  const light = new THREE.PointLight('#c77dff', 10 * power, size * 10, 1.4);
  light.position.set(0, size * 0.7, size * 0.6);
  g.add(light);
  const motes = Array.from({ length: 10 }, (_, i) => {
    const m = glow(i % 3 ? '#e6c8ff' : '#ff8ab8', size * 0.12, 0);
    g.add(m);
    return { m, a: i * 2.4, r: size * (0.35 + (i % 4) * 0.1), speed: 0.3 + (i % 5) * 0.07, ph: (i * 0.618) % 1 };
  });
  s.animate((t) => {
    const breath = 0.5 + 0.5 * Math.sin(t * 2.4);
    const flicker = 0.5 + 0.5 * Math.sin(t * 17.3) * Math.sin(t * 5.1);
    halo.material.opacity = 0.38 + breath * 0.25;
    inner.material.opacity = 0.35 + flicker * 0.3;
    light.intensity = (7 + breath * 6) * power;
    crystals.forEach((c, i) => c.scale.setScalar(1 + Math.sin(t * 3 + i * 1.7) * 0.03));
    g.rotation.y = Math.sin(t * 0.5) * 0.15;
    motes.forEach(({ m, a, r, speed, ph }) => {
      const k = (t * speed + ph) % 1;
      const ang = a + t * 1.2;
      m.position.set(Math.cos(ang) * r, size * (0.1 + k * 1.1), Math.sin(ang) * r);
      m.material.opacity = Math.sin(k * Math.PI) * 0.9;
    });
  });
  return g;
}
