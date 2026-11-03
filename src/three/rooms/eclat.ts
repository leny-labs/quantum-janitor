import * as THREE from 'three';
import { at, box, cyl, glow, mat, plane, pool, sphere, torus } from '../kit';
import { candle, crowd, reactorShard, rng } from './hive';
import type { RoomBuild } from './index';

const STABLE = { flags: ['ch1_eclat_stabilise'] };
const UNSTABLE = { notFlags: ['ch1_eclat_stabilise'] };

/**
 * Gros plan « Éclat du Réacteur » (ch.1) : l'intérieur du bac de sortie du
 * Distrib'Ô-Matic devenu reliquaire. L'éclat pulse sur le plateau ; à gauche
 * la jauge de stabilité (aiguille dans le rouge), à droite la plaque gravée.
 */
export const eclat: RoomBuild = {
  camera: { pos: [0, 1.55, 5.2], look: [0, 1.45, 0], fov: 46 },
  shots: {
    eclat: { fill: 0.7, lift: 0.15 },
    jauge: { fill: 0.6 },
    gravure: { fill: 0.6 },
  },
  build(s) {
    s.lights({
      sky: '#e6d0ff',
      ground: '#140a1c',
      ambient: 0.9,
      key: { color: '#ffe6c8', intensity: 1.4, pos: [-2, 6, 6], target: [0, 1, 0] },
      points: [{ color: '#ffb347', intensity: 6, pos: [-2.6, 2.4, 2.4], distance: 6 }],
      rim: { color: '#c77dff', intensity: 1.0, pos: [3, 4, -3] },
      fill: { color: '#6a8cff', intensity: 0.3, pos: [4, 2, 4] },
      fog: { color: '#120a18', near: 6, far: 16 },
      vignette: { color: '#0a0410', strength: 0.72, warm: '#d8a0ff18' },
    });

    // ── caisson : fond de tôle sombre rivetée, bords bordeaux du distributeur ──
    const back = s.fit([150, 60, 980, 470], 0);
    const W = back.w * 1.3;
    const H = back.h * 1.4;
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(W, H), mat('#ffffff', { map: sheetTexture(W / H) }));
    plate.position.set(back.x, back.y, 0);
    plate.receiveShadow = true;
    s.add(plate);
    // bords du bac (bordeaux), en perspective : la caméra est « dans » le logement
    const D = 2.2;
    const left = at(box(0.2, H, D, '#6e2230'), back.x - W / 2 + 0.1, back.y, D / 2);
    const right = at(box(0.2, H, D, '#6e2230'), back.x + W / 2 - 0.1, back.y, D / 2);
    const ceiling = at(box(W, 0.2, D, '#5e1d2a'), back.x, back.y + H / 2 - 0.1, D / 2);
    // plateau (fond du bac) : tôle striée
    const floorY = s.wallAt(640, 450, 0.6).y;
    const tray = at(box(W, 0.12, D + 0.6, '#3a3446'), back.x, floorY - 0.06, (D + 0.6) / 2);
    s.add(left, right, ceiling, tray);
    for (let i = 0; i < 9; i++) s.add(at(box(W * 0.9, 0.012, 0.03, '#524a62', { edges: false }), back.x, floorY + 0.006, 0.2 + i * 0.26));
    // lèvre du clapet poussé, en bas du cadre (la sortie « retour »)
    s.add(at(box(W, 0.16, 0.12, '#5e1d2a'), back.x, floorY - 0.02, D + 0.35));

    // cire et bougies de culte jusque dans le bac (les fidèles ont le bras long)
    const r = rng(17);
    for (const [px, hh] of [[220, 0.42], [270, 0.3], [1050, 0.36], [1100, 0.26]] as const) {
      const p = s.floorAt(px, 440, floorY);
      s.add(at(candle(s, hh, 0.06), p.x, floorY, p.z));
    }
    for (let i = 0; i < 7; i++) {
      const x = back.x + (r() - 0.5) * W * 0.9;
      const len = 0.15 + r() * 0.4;
      const top = back.y + H / 2 - 0.2;
      s.add(at(cyl(0.03, 0.015, len, '#f3e2bf', { seg: 6, edges: false }), x, top - len / 2, 0.05), at(sphere(0.035, '#f3e2bf', { seg: 6 }), x, top - len, 0.05));
    }

    // ── l'éclat (tant qu'il n'est pas stabilisé et ramassé) ──
    const ec = s.stand(s.rect('eclat'), floorY);
    const shard = at(reactorShard(s, ec.h * 0.55), ec.x, floorY, ec.z);
    const heat = at(pool('#c77dff', ec.w * 1.6, ec.w, 0.5), ec.x, floorY + 0.01, ec.z);
    const scorch = new THREE.Mesh(new THREE.CircleGeometry(ec.w * 0.4, 24), new THREE.MeshBasicMaterial({ color: '#0c0610', transparent: true, opacity: 0.6, depthWrite: false }));
    scorch.rotation.x = -Math.PI / 2;
    scorch.position.set(ec.x, floorY + 0.008, ec.z);
    s.spot('eclat', shard, heat);
    s.add(scorch);
    // après le PLOUF : flaque d'eau bénite tiède, vapeur, la place vide
    const water = new THREE.Mesh(new THREE.CircleGeometry(ec.w * 0.75, 28), new THREE.MeshBasicMaterial({ color: '#6fd0ff', transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false }));
    water.rotation.x = -Math.PI / 2;
    water.scale.set(1.3, 0.8, 1);
    water.position.set(ec.x, floorY + 0.012, ec.z);
    const steam = [0, 1, 2, 3, 4].map(() => glow('#e6f6ff', ec.w * 0.9, 0));
    s.when(STABLE, water, ...steam);
    s.animate((t) => {
      steam.forEach((g, i) => {
        const k = (t * 0.2 + i / 5) % 1;
        g.position.set(ec.x + Math.sin(i * 2.1 + t * 0.5) * ec.w * 0.3, floorY + k * ec.h * 1.4, ec.z);
        g.material.opacity = Math.sin(k * Math.PI) * 0.18;
      });
    });

    // ── jauge de stabilité : cadran à aiguille ──
    const jf = s.fit(s.rect('jauge'), 0.08);
    const gauge = new THREE.Group();
    const R = Math.min(jf.w * 0.5, jf.h * 0.95);
    gauge.add(at(box(jf.w * 0.95, jf.h * 0.95, 0.1, '#222c3a'), 0, 0, 0));
    const dial = new THREE.Mesh(new THREE.CircleGeometry(R * 0.82, 40, 0, Math.PI), new THREE.MeshBasicMaterial({ map: dialTexture(), toneMapped: false }));
    dial.position.set(0, -jf.h * 0.38, 0.06);
    gauge.add(dial);
    const rim = at(torus(R * 0.84, R * 0.035, '#9aa5b1'), 0, -jf.h * 0.38, 0.06);
    (rim.geometry as THREE.TorusGeometry).dispose();
    rim.geometry = new THREE.TorusGeometry(R * 0.84, R * 0.035, 6, 24, Math.PI);
    gauge.add(rim);
    const needle = new THREE.Group();
    needle.add(at(box(R * 0.03, R * 0.72, 0.02, '#f6efe2', { edges: false }), 0, R * 0.36, 0));
    needle.position.set(0, -jf.h * 0.38, 0.08);
    gauge.add(needle, at(cyl(R * 0.07, R * 0.07, 0.04, '#9aa5b1', { seg: 12 }), 0, -jf.h * 0.38, 0.09));
    gauge.children[gauge.children.length - 1].rotation.x = Math.PI / 2;
    const alarm = at(sphere(R * 0.06, '#ff5c7a', { glow: true }), jf.w * 0.4, jf.h * 0.36, 0.07);
    const ok = at(sphere(R * 0.06, '#7fffd4', { glow: true }), jf.w * 0.4, jf.h * 0.36, 0.07);
    gauge.add(alarm, ok);
    s.when(UNSTABLE, alarm).when(STABLE, ok);
    s.spot('jauge', at(gauge, jf.x, jf.y, 0.08));
    s.animate((t) => {
      // aiguille : affolée dans le rouge, puis posée au vert (« STABLE (TIÈDE) »)
      const stable = s.is(STABLE);
      needle.rotation.z = stable ? 0.95 + Math.sin(t * 0.8) * 0.02 : -1.25 + Math.sin(t * 9) * 0.12 + Math.sin(t * 23) * 0.05;
      (alarm.material as THREE.MeshBasicMaterial).color.set(Math.sin(t * 6) > 0 ? '#ff5c7a' : '#5a1f2b');
    });

    // ── plaque gravée : symbole du réacteur, « 1/4096 » ──
    const gf = s.fit(s.rect('gravure'), 0.08);
    const plaque = new THREE.Group();
    plaque.add(at(box(gf.w * 0.95, gf.h * 0.92, 0.08, '#6a4a1a'), 0, 0, 0));
    plaque.add(at(plane(gf.w * 0.88, gf.h * 0.84, '#ffffff', { map: engravingTexture(gf.w / gf.h) }), 0, 0, 0.045));
    for (const [cx, cy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) plaque.add(at(sphere(gf.h * 0.04, '#d9c08a', { seg: 8 }), cx * gf.w * 0.43, cy * gf.h * 0.4, 0.06));
    s.spot('gravure', at(plaque, gf.x, gf.y, 0.08));

    // un petit fidèle, au bord du bac, qui adore l'éclat
    crowd(s, [{ px: [380, 452], hpx: 70, pose: 'worship', right: true }], '#f0d8e8', floorY);
  },
};

/** Tôle sombre rivetée, rayée, marbrée de reflets violets. */
function sheetTexture(aspect: number): THREE.CanvasTexture {
  const W = 1024;
  const H = Math.round(W / aspect);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const bg = g.createRadialGradient(W / 2, H * 0.55, 20, W / 2, H / 2, W * 0.7);
  bg.addColorStop(0, '#2c2440');
  bg.addColorStop(1, '#120e1c');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(0,0,0,0.5)';
  g.lineWidth = 3;
  for (let x = W / 6; x < W; x += W / 6) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, H);
    g.stroke();
  }
  g.fillStyle = '#4a4260';
  for (let x = W / 6; x < W; x += W / 6) for (let y = 30; y < H; y += 80) {
    g.beginPath();
    g.arc(x + 12, y, 5, 0, Math.PI * 2);
    g.fill();
  }
  const r = rng(9);
  g.strokeStyle = 'rgba(200,170,255,0.08)';
  g.lineWidth = 2;
  for (let i = 0; i < 40; i++) {
    const x = r() * W;
    const y = r() * H;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + 40 + r() * 60, y + (r() - 0.5) * 10);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Cadran de la jauge : arc rouge → jaune → vert, graduations. Demi-disque (CircleGeometry 0..π). */
function dialTexture(): THREE.CanvasTexture {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d')!;
  g.fillStyle = '#f2ead6';
  g.fillRect(0, 0, S, S);
  const cx = S / 2;
  const cy = S / 2;
  // zones (en haut du disque : la géométrie n'en garde que la moitié supérieure)
  const zones: [number, number, string][] = [
    [Math.PI, Math.PI * 1.3, '#7fbf3f'],
    [Math.PI * 1.3, Math.PI * 1.6, '#ffd166'],
    [Math.PI * 1.6, Math.PI * 2, '#ff5c7a'],
  ];
  for (const [a0, a1, col] of zones) {
    g.strokeStyle = col;
    g.lineWidth = 46;
    g.beginPath();
    g.arc(cx, cy, S * 0.38, a0, a1);
    g.stroke();
  }
  g.strokeStyle = '#2a1a10';
  for (let i = 0; i <= 20; i++) {
    const a = Math.PI + (i / 20) * Math.PI;
    g.lineWidth = i % 5 ? 3 : 7;
    const r0 = S * (i % 5 ? 0.3 : 0.27);
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    g.lineTo(cx + Math.cos(a) * S * 0.34, cy + Math.sin(a) * S * 0.34);
    g.stroke();
  }
  // pictos : flocon (froid) à gauche, flamme à droite
  g.fillStyle = '#2a1a10';
  g.beginPath();
  g.arc(cx - S * 0.2, cy - S * 0.09, 12, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#c0392b';
  g.beginPath();
  g.moveTo(cx + S * 0.2, cy - S * 0.16);
  g.quadraticCurveTo(cx + S * 0.25, cy - S * 0.07, cx + S * 0.2, cy - S * 0.05);
  g.quadraticCurveTo(cx + S * 0.15, cy - S * 0.07, cx + S * 0.2, cy - S * 0.16);
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Laiton gravé : symbole du réacteur (orbes en trèfle), « 1/4096 », filets. */
function engravingTexture(aspect: number): THREE.CanvasTexture {
  const W = 1024;
  const H = Math.round(W / aspect);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#d9b45a');
  bg.addColorStop(0.5, '#b88a34');
  bg.addColorStop(1, '#8a6420');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  // gravure : trait sombre + liseré clair décalé (relief)
  const engrave = (draw: () => void, lw: number) => {
    g.save();
    g.translate(2, 3);
    g.strokeStyle = 'rgba(255,240,200,0.6)';
    g.fillStyle = 'rgba(255,240,200,0.6)';
    g.lineWidth = lw;
    draw();
    g.restore();
    g.strokeStyle = '#3a2408';
    g.fillStyle = '#3a2408';
    g.lineWidth = lw;
    draw();
  };
  engrave(() => g.strokeRect(24, 24, W - 48, H - 48), 6);
  const sx = W * 0.25;
  const sy = H * 0.5;
  const sr = H * 0.26;
  engrave(() => {
    g.beginPath();
    g.arc(sx, sy, sr, 0, Math.PI * 2);
    g.stroke();
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 3;
      g.beginPath();
      g.arc(sx + Math.cos(a) * sr * 0.45, sy + Math.sin(a) * sr * 0.45, sr * 0.3, 0, Math.PI * 2);
      g.stroke();
    }
    g.beginPath();
    g.arc(sx, sy, sr * 0.12, 0, Math.PI * 2);
    g.fill();
  }, 8);
  // « 1/4096 » espacé glyphe par glyphe (Bungee colle le 1 au /), rétréci pour tenir entre symbole et bord
  const label = '1/4096';
  const left = sx + sr + W * 0.04;
  const maxW = W - 48 - W * 0.04 - left;
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  let size = Math.round(H * 0.3);
  let track = 0;
  const widthAt = () => [...label].reduce((w, ch) => w + g.measureText(ch).width, 0) + track * (label.length - 1);
  for (;;) {
    g.font = `${size}px Bungee, Impact, sans-serif`;
    track = size * 0.14;
    if (widthAt() <= maxW || size <= 24) break;
    size -= 2;
  }
  let tx = left + (maxW - widthAt()) / 2;
  const glyphs = [...label].map((ch) => {
    const x = tx;
    tx += g.measureText(ch).width + track;
    return { ch, x };
  });
  engrave(() => glyphs.forEach(({ ch, x }) => g.fillText(ch, x, H * 0.46)), 1);
  engrave(() => {
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.moveTo(W * 0.44, H * (0.72 + i * 0.06));
      g.lineTo(W * 0.86, H * (0.72 + i * 0.06));
      g.stroke();
    }
  }, 4);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
