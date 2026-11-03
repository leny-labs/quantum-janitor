import * as THREE from 'three';
import { at, box, cyl, glow, label, mat, plane, pool, sphere, stripeTexture, tileTexture, torus, wallTexture } from '../kit';
import { serpilliere } from '../props';
import type { Stage } from '../Stage';
import { bobSpot } from './bobspot';
import { candle, crowd, drip, eggLamps, hive, mist, puddle, reactorShard, rib, rng, shaft, vaultArch } from './hive';
import type { RoomBuild } from './index';
import { pipe } from './shell';

const TINT = '#f2dcd0';
const GOLD = '#e0a83a';
const WAX = '#f3e2bf';
const STUCK = { notFlags: ['ch1_eclat_tombe'] };
const FALLEN = { flags: ['ch1_eclat_tombe'], notFlags: ['ch1_eclat_stabilise'] };
const JOSIANE = { flags: ['ch1_josiane_coincee'] };

/**
 * Temple de l'Ancien Couloir (ch.1) : un pan du couloir C de Klepsydra-9,
 * échoué dans la ruche et vénéré. Acier bleu, cire de bougie, offrandes ; la
 * chitine de B-7 en mange les bords.
 */
export const temple: RoomBuild = {
  camera: { pos: [-0.6, 2.2, 8.6], look: [0.2, 2.0, 0], fov: 50 },
  shots: {
    distributeur: { fill: 1.0, orbit: -10, lift: -0.1 },
    hublot: { fill: 0.62, lift: 0.15 },
    compteur: { fill: 0.4 },
    lecteur: { fill: 0.3, orbit: 12 },
  },
  build(s) {
    hive(s, { wall: ['#1a0a06', '#3e1e0e'], floor: ['#2a140a', '#4e2a12'], rib: '#3a1a0c', seed: 37 });
    s.lights({
      sky: '#e8dcff',
      ground: '#1e0e08',
      ambient: 0.95,
      key: { color: '#ffe6c8', intensity: 1.8, pos: [-4, 10, 7], target: [1, 0, 0] },
      points: [
        { color: '#9fd8ff', intensity: 12, pos: [0.5, 3.2, 3.4], distance: 11 },
        { color: '#ffb347', intensity: 9, pos: [-4, 1.4, 3], distance: 8 },
      ],
      rim: { color: '#ff7a5a', intensity: 0.9, pos: [6, 5, -4] },
      fill: { color: '#6a8cff', intensity: 0.35, pos: [6, 3, 6] },
      fog: { color: '#1c0e0a', near: 8, far: 27 },
      vignette: { color: '#100604', strength: 0.66, warm: '#ffc47a1c' },
    });

    // ── le fragment de couloir : pan de paroi + dalle de sol de la station ──
    const X0 = -6.4;
    const X1 = 6.8;
    const fw = X1 - X0;
    const fx = (X0 + X1) / 2;
    const H = 6.6;
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(fw, H), mat('#ffffff', { map: wallTexture('#3a4668', '#222a3e', fw, H) }));
    panel.position.set(fx, H / 2, 0.06);
    panel.receiveShadow = true;
    s.add(panel);
    for (let x = X0 + 1.1; x < X1; x += 2.1) s.add(at(box(0.05, H, 0.04, '#1d2436', { edges: false, shadow: false }), x, H / 2, 0.08));
    s.add(at(box(fw, 0.12, 0.06, '#3a4260', { edges: false }), fx, 1.15, 0.09));
    pipe(s, 0.55, 0.22, X0 + 0.3, X1 - 0.3, 0.1, '#525e7a');
    const slab = new THREE.Mesh(new THREE.PlaneGeometry(fw, 5.2), mat('#ffffff', { map: tileTexture('#1c2131', '#232a3d', '#0f121b', [fw / 2, 5.2 / 2]) }));
    slab.rotation.x = -Math.PI / 2;
    slab.position.set(fx, 0.02, 2.6);
    slab.receiveShadow = true;
    const stripe = plane(fw, 0.35, '#ffffff', { map: stripeTexture('#ffd166', '#1c2131', 6) });
    (stripe.material as THREE.MeshToonMaterial).map!.repeat.set(fw * 1.3, 1);
    stripe.rotation.x = -Math.PI / 2;
    s.add(slab, at(stripe, fx, 0.025, 0.5));
    // rail lumineux du plafond, figé dans la cire
    const railY = s.wallAt(640, 34, 0.2).y;
    s.add(at(box(fw, 0.22, 0.2, '#3a4260', { edges: false }), fx, railY + 0.08, 0.1));
    s.add(at(box(fw, 0.07, 0.08, '#ffe2a0', { glow: true }), fx, railY - 0.06, 0.2));
    s.add(at(pool('#ffd8a0', fw, 2.4, 0.16), fx, 0.03, 1.6));
    // coulures de cire sur l'acier
    const r = rng(53);
    for (let i = 0; i < 16; i++) {
      const x = X0 + 0.4 + r() * (fw - 0.8);
      const len = 0.25 + r() * 0.7;
      const y = i % 2 ? railY - 0.1 : 1.1;
      s.add(at(cyl(0.035, 0.02, len, WAX, { seg: 6, edges: false }), x, y - len / 2, 0.22), at(sphere(0.045, WAX, { seg: 6 }), x, y - len, 0.22));
    }
    // la chitine de B-7 dévore les bords du fragment : bourrelets, côtes, résine
    for (const [x, dir] of [
      [X0, -1],
      [X1, 1],
    ] as const) {
      for (let i = 0; i < 7; i++) {
        const blob = at(sphere(0.6 + r() * 0.55, i % 2 ? '#4a2410' : '#3a1a0c', { seg: 14 }), x + dir * (0.1 + r() * 0.5), 0.3 + i * 1.0, 0.2 + r() * 0.4);
        blob.scale.set(0.9, 1.25, 0.6);
        s.add(blob);
      }
      s.add(rib(x + dir * 0.4, 0.8, 7.6, -dir * 2.2, 0.32, '#3a1a0c', 0.5));
    }
    s.add(rib(-9.6, 3.2, 8.4, 3.4, 0.55, '#2e1408', 0.8), rib(9.8, 3.2, 8.4, -3.4, 0.55, '#2e1408', 0.8));
    for (const [x, y, z, len, rr] of [
      [-7.2, 6.4, 1.4, 1.2, 0.14],
      [7.6, 6.6, 1.2, 1.0, 0.12],
      [2.2, 7.0, 1.6, 0.8, 0.1],
    ] as const) s.add(at(drip(len, rr), x, y, z));

    // ── le distributeur devenu reliquaire ──
    reliquary(s);

    // ── hublot : le multivers en mosaïque ──
    const hb = s.fit(s.rect('hublot'), 0.1);
    const tiles = mosaicTexture();
    const sky = at(plane(hb.w * 0.9, hb.h * 0.86, '#ffffff', { glow: true, map: tiles }), hb.x, hb.y, 0.1);
    const ft = hb.h * 0.1;
    const frame = new THREE.Group();
    frame.add(
      at(box(hb.w, ft, 0.3, '#9aa5b1'), 0, hb.h / 2 - ft / 2, 0),
      at(box(hb.w, ft, 0.3, '#9aa5b1'), 0, -hb.h / 2 + ft / 2, 0),
      at(box(ft, hb.h, 0.3, '#9aa5b1'), -hb.w / 2 + ft / 2, 0, 0),
      at(box(ft, hb.h, 0.3, '#9aa5b1'), hb.w / 2 - ft / 2, 0, 0),
    );
    for (const [bx, by] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) frame.add(at(sphere(ft * 0.22, '#5a6470'), bx * (hb.w / 2 - ft / 2), by * (hb.h / 2 - ft / 2), 0.16));
    // guirlande de cire et deux bougies sur l'appui
    const sheen = at(plane(hb.w * 0.2, hb.h * 0.86, '#ffffff', { glow: true, opacity: 0.07 }), hb.x - hb.w * 0.15, hb.y, 0.14);
    sheen.rotation.z = -0.4;
    s.spot('hublot', sky, at(frame, hb.x, hb.y, 0.2), sheen);
    s.animate((t) => {
      tiles.offset.x = t * 0.006;
      tiles.offset.y = Math.sin(t * 0.1) * 0.02;
    });

    // ── compteur « jours sans incident » (remis à zéro) ──
    const cp = s.fit(s.rect('compteur'), 0.12);
    const counter = new THREE.Group();
    counter.add(at(box(cp.w * 0.95, cp.h * 0.85, 0.12, '#111111'), 0, 0, 0));
    const digits = at(label('0000', cp.w * 0.7, cp.h * 0.6, { color: '#ff5c7a', bold: true, mono: true, bg: '#1a0408' }), 0, 0, 0.065);
    counter.add(digits);
    // bougies et miettes sur le rebord : on y prie aussi
    counter.add(at(box(cp.w * 0.98, 0.06, 0.32, '#2a3148'), 0, -cp.h * 0.45, 0.12));
    s.spot('compteur', at(counter, cp.x, cp.y, 0.12));
    for (const dx of [-0.38, -0.2, 0.36]) s.add(at(candle(s, 0.18 + Math.abs(dx) * 0.2, 0.04), cp.x + dx * cp.w, cp.y - cp.h * 0.42, 0.24));
    s.animate((t) => {
      (digits.material as THREE.MeshBasicMaterial).opacity = Math.sin(t * 3) > -0.2 ? 1 : 0.35;
      (digits.material as THREE.MeshBasicMaterial).transparent = true;
    });

    // ── lecteur de badge : traces de yaourt… qui s'éloignent ──
    const lc = s.fit(s.rect('lecteur'), 0.12);
    const reader = new THREE.Group();
    reader.add(at(box(lc.w * 0.75, lc.h * 0.82, 0.14, '#2a2a2a'), 0, 0, 0));
    reader.add(at(box(lc.w * 0.5, lc.h * 0.12, 0.02, '#111111', { edges: false }), 0, lc.h * 0.28, 0.08));
    const led = at(sphere(lc.w * 0.07, '#ff5c7a', { glow: true }), 0, -lc.h * 0.05, 0.09);
    reader.add(led);
    for (const [x, y, rr] of [[-0.1, -0.2, 0.09], [0.12, -0.28, 0.06]]) {
      const blob = at(sphere(lc.w * rr * 1.6, '#f6f2e6', { seg: 10 }), x * lc.w, y * lc.h, 0.08);
      blob.scale.z = 0.3;
      reader.add(blob);
    }
    s.spot('lecteur', at(reader, lc.x, lc.y, 0.12));
    // petites traces de pas lactées, vers la droite puis vers le sol
    for (let i = 0; i < 9; i++) {
      const p = s.wallAt(1080 + i * 22, 300 + i * i * 2.2, 0.11);
      const step = at(sphere(0.04, '#f6f2e6', { seg: 8 }), p.x, p.y, 0.11);
      step.scale.set(1, 0.6, 0.3);
      s.add(step);
    }
    s.animate((t) => {
      (led.material as THREE.MeshBasicMaterial).color.set(Math.sin(t * 2.5) > 0 ? '#ff5c7a' : '#5a1f2b');
    });

    // ── fidèles ──
    crowd(
      s,
      [
        { px: [560, 476], hpx: 98, right: false },
        { px: [612, 466], hpx: 84, right: false, pose: '34' },
        { px: [470, 500], hpx: 112, right: false },
        { px: [1120, 470], hpx: 92, pose: 'walk1', walk: 0.9, right: false },
        { px: [960, 420], hpx: 52, right: false },
        { px: [930, 414], hpx: 46, right: false },
      ],
      TINT,
    );

    // ── passage vers la galerie (gauche) : la chitine s'ouvre ──
    const gf = s.fit(s.rect('vers_galerie'), 0.05);
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.5, 32), mat('#0a0403', { glow: true }));
    hole.scale.set(gf.w * 1.05, gf.h * 0.95, 1);
    hole.position.set(gf.x, gf.y, 0.3);
    const ring = at(vaultArch(gf.w * 0.6, 0.18, '#3a1a0c', Math.PI * 1.25), gf.x, gf.y - gf.h * 0.05, 0.36);
    ring.scale.y = gf.h / gf.w;
    s.add(hole, ring, at(glow('#ff9a4a', gf.w * 1.6, 0.35), gf.x, gf.y - gf.h * 0.15, 0.4));

    // ── lueurs, flaques, brume ──
    eggLamps(s, -7.4, 1.6, 0.7);
    eggLamps(s, 7.8, 1.4, 0.6, '#ffb36b', false);
    shaft(s, 1.6, 1.4, 8, '#bfe0ff', 0.06);
    const shines = [puddle(s, -3.6, 6.0, 1.8, 0.8), puddle(s, 5.2, 5.4, 1.4, 0.6)];
    s.animate((t) => shines.forEach((m, i) => ((m.material as THREE.MeshBasicMaterial).opacity = 0.28 + Math.sin(t * 0.9 + i * 2) * 0.08)));
    mist(s, '#ffc49a', [
      [-4, 3, 7],
      [3, 3, 7],
    ]);

    // ── B.O.B. ──
    const { robot } = bobSpot(s, { scale: 0.72 });
    s.animate((t) => {
      robot.position.y = Math.abs(Math.sin(t * 1.1)) * 0.015;
    });
  },
};

/**
 * Le Distrib'Ô-Matic 3000 du couloir C, même gabarit que celui du ch.0
 * (rooms/couloir.ts : caisse bordeaux, vitrine en saillie, spirales, bac),
 * devenu reliquaire : arche dorée, cire, bougies, offrandes ; l'éclat du
 * Réacteur coincé dans la spirale centrale, puis tombé dans le bac.
 */
function reliquary(s: Stage): void {
  const ds = s.stand(s.rect('distributeur'));
  const dw = ds.w * 0.88;
  const dd = 1.1;
  const h = ds.h * 0.92;
  const vend = new THREE.Group();
  vend.add(at(box(dw, h, dd, '#8a2b3c'), 0, h / 2, 0));
  vend.add(at(box(dw * 1.02, h * 0.08, dd * 1.04, '#5e1d2a'), 0, h * 0.96, 0));
  const glassW = dw * 0.72;
  const glassH = h * 0.55;
  const glassY = h * 0.6;
  const G = dd / 2;
  vend.add(at(box(glassW, glassH, 0.04, '#16314a', { glow: true }), -dw * 0.05, glassY, G + 0.02));
  for (const [x, y, w, hh] of [
    [0, glassH / 2, glassW + 0.08, 0.04],
    [0, -glassH / 2, glassW + 0.08, 0.04],
    [-glassW / 2, 0, 0.04, glassH],
    [glassW / 2, 0, 0.04, glassH],
  ]) vend.add(at(box(w, hh, 0.32, '#5e1d2a'), -dw * 0.05 + x, glassY + y, G + 0.16));
  vend.add(at(plane(glassW * 0.96, glassH * 0.96, '#c79fff', { glow: true, opacity: 0.12 }), -dw * 0.05, glassY, G + 0.3));
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const coil = at(torus(glassW * 0.1, 0.012, '#c9ced6'), -dw * 0.05 + (col - 1) * glassW * 0.3, glassY + glassH * 0.3 - row * glassH * 0.3 - glassH * 0.08, G + 0.12);
      vend.add(coil);
    }
  }
  // clavier (encroûté de cire), bac de sortie
  vend.add(at(box(dw * 0.18, h * 0.32, 0.06, '#2a2a2a'), dw * 0.39, glassY, dd / 2));
  for (let i = 0; i < 6; i++) vend.add(at(sphere(0.035, i % 2 ? '#ffd166' : WAX, { glow: i % 2 === 1 }), dw * 0.36 + (i % 2) * 0.07, glassY + 0.35 - Math.floor(i / 2) * 0.13, dd / 2 + 0.04));
  const binY = h * 0.16;
  vend.add(at(box(dw * 0.5, h * 0.07, 0.1, '#111111'), -dw * 0.05, binY, dd / 2));
  // arche dorée de reliquaire + bougies au sommet + coulures de cire
  const arch = at(vaultArch(dw * 0.62, 0.07, GOLD), 0, h * 0.95, G + 0.1);
  const arch2 = at(vaultArch(dw * 0.7, 0.04, '#9a6a1e'), 0, h * 0.95, G + 0.12);
  vend.add(arch, arch2, at(sphere(0.1, '#c77dff', { glow: true, seg: 12 }), 0, h * 0.95 + dw * 0.62, G + 0.12));
  for (const x of [-0.32, -0.08, 0.2, 0.38]) vend.add(at(candle(s, 0.2 + Math.abs(x) * 0.25, 0.045), x * dw, h, 0.1));
  const r = rng(71);
  for (let i = 0; i < 9; i++) {
    const x = (r() - 0.5) * dw * 0.95;
    const len = 0.15 + r() * 0.5;
    vend.add(at(cyl(0.03, 0.018, len, WAX, { seg: 6, edges: false }), x, h - len / 2, G + 0.02), at(sphere(0.04, WAX, { seg: 6 }), x, h - len, G + 0.02));
  }
  // l'éclat : coincé dans la spirale centrale, puis dans le bac de sortie
  const stuck = at(reactorShard(s, glassW * 0.26), -dw * 0.05, glassY - glassH * 0.12, G + 0.12);
  const fallen = at(reactorShard(s, h * 0.06), -dw * 0.05, binY - h * 0.02, dd / 2 + 0.06);
  const leak = at(glow('#c77dff', dw * 1.1, 0.22), -dw * 0.05, binY, dd / 2 + 0.2);
  // Josiane, recoincée dans la spirale centrale à la place de l'éclat, manche en travers de la vitrine
  const josiane = at(serpilliere(glassH * 0.95), -dw * 0.05 + glassW * 0.12, glassY - glassH * 0.46, G + 0.1);
  josiane.rotation.z = 0.42;
  const josianeHalo = at(glow('#ffd166', glassW * 0.7, 0.18), -dw * 0.05, glassY - glassH * 0.15, G + 0.25);
  vend.add(stuck, fallen, leak, josiane, josianeHalo);
  s.when(STUCK, stuck);
  s.when(FALLEN, fallen, leak);
  s.when(JOSIANE, josiane, josianeHalo);
  s.spot('distributeur', at(vend, ds.x, 0, Math.max(ds.z - dd / 2, dd / 2 + 0.25)));
  // offrandes au pied : miettes, bougies, coussin
  const base = s.floorAt(290, 486);
  for (const [dx, hh] of [[-0.9, 0.36], [-0.6, 0.24], [0.75, 0.3], [1.0, 0.2]] as const) s.add(at(candle(s, hh), base.x + dx * dw * 0.6, 0, base.z + 0.15));
  s.add(at(pool('#ffc47a', dw * 2.4, 1.6, 0.22), base.x, 0.03, base.z));
  s.add(at(pool('#c77dff', dw * 2, 1.4, 0.18), base.x, 0.031, base.z + 0.2));
}

/** Le multivers en mosaïque : 4 096 carreaux, chacun un morceau de station (répétée, défile). */
function mosaicTexture(): THREE.CanvasTexture {
  const S = 512;
  const N = 16;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d')!;
  const r = rng(4096);
  const palette = ['#3d7dd8', '#b56cff', '#ffd166', '#7fffd4', '#ff5c7a', '#8fae3a', '#ff9a4a', '#5a6ad8'];
  const cs = S / N;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const col = palette[Math.floor(r() * palette.length)];
      const grad = g.createLinearGradient(0, y * cs, 0, (y + 1) * cs);
      grad.addColorStop(0, '#05050c');
      grad.addColorStop(1, col);
      g.fillStyle = grad;
      g.fillRect(x * cs + 1, y * cs + 1, cs - 2, cs - 2);
      // un bout de station, une planète, des étoiles
      g.fillStyle = '#ffffff';
      for (let k = 0; k < 3; k++) g.fillRect(x * cs + r() * cs, y * cs + r() * cs * 0.6, 1.5, 1.5);
      if (r() > 0.5) {
        g.fillStyle = 'rgba(20,24,40,0.85)';
        g.fillRect(x * cs + cs * 0.15, y * cs + cs * (0.5 + r() * 0.2), cs * (0.3 + r() * 0.5), cs * 0.12);
      } else {
        g.fillStyle = col;
        g.beginPath();
        g.arc(x * cs + cs * (0.3 + r() * 0.4), y * cs + cs * 0.4, cs * 0.14, 0, Math.PI * 2);
        g.fill();
      }
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(0.9, 0.6);
  return t;
}
