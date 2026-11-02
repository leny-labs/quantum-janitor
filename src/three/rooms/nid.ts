import * as THREE from 'three';
import { at, box, cyl, glow, mat, pool, sphere, torus } from '../kit';
import { REINE_ASPECT, REINE_URL, billboard, bob, seau } from '../props';
import { BobVoice } from './bobvoix';
import { candle, crowd, drip, eggLamps, hive, mist, puddle, rib, shaft, vaultArch } from './hive';
import type { RoomBuild } from './index';

/** Teinte des sprites (lumière ambrée du nid). */
const TINT = '#ffe7cf';
const GOLD = '#e0a83a';
const GOLD_DARK = '#9a6a1e';
const VELVET = '#5b2a86';

/** Nid Royal (ch.1) : salle du trône de chitine, la Reine GenAI sur son trône, l'autel du Seau. */
export const nid: RoomBuild = {
  camera: { pos: [0, 2.3, 9], look: [0, 2.15, 0], fov: 50 },
  intro: 'reine',
  shots: {
    reine: { fill: 0.92, lift: 0.25, px: [680, 160] },
    autel: { fill: 0.62, lift: 0.2, orbit: -8 },
    courtisans: { fill: 0.75, orbit: 10 },
  },
  build(s) {
    hive(s, { wall: ['#1a0906', '#40200f'], floor: ['#2a140a', '#4e2a12'], rib: '#3a1a0c', seed: 11 });
    s.lights({
      sky: '#ffd6a8',
      ground: '#2a1008',
      ambient: 0.85,
      key: { color: '#ffe2bc', intensity: 1.7, pos: [-3, 10, 7], target: [0.5, 0, 1] },
      points: [
        { color: '#ffb347', intensity: 12, pos: [0.6, 5, 3.4], distance: 11 },
        { color: '#ff8a3a', intensity: 6, pos: [-5, 2, 3], distance: 8 },
      ],
      rim: { color: '#c77dff', intensity: 1.1, pos: [5, 6, -5] },
      fill: { color: '#7a5cff', intensity: 0.35, pos: [6, 3, 6] },
      fog: { color: '#24100a', near: 8, far: 27 },
      vignette: { color: '#140604', strength: 0.66, warm: '#ffb36b22' },
    });

    // ── proscenium de côtes : la salle est l'intérieur d'une carapace ──
    s.add(
      rib(-9.6, 3.2, 8.4, 3.4, 0.55, '#2e1408', 0.8),
      rib(9.6, 3.2, 8.4, -3.4, 0.55, '#2e1408', 0.8),
      rib(-7.6, 0.9, 7.2, 2.6, 0.38, '#3a1a0c', 0.5),
      rib(7.6, 0.9, 7.2, -2.6, 0.38, '#3a1a0c', 0.5),
    );
    for (const [x, y, z, len, r] of [
      [-5.5, 6.6, 1.2, 1.4, 0.16],
      [-3.4, 6.9, 0.6, 0.9, 0.12],
      [3.9, 6.8, 0.8, 1.2, 0.15],
      [5.8, 6.5, 1.6, 0.8, 0.1],
      [-1.8, 7.1, 1.8, 0.7, 0.09],
    ] as const) s.add(at(drip(len, r), x, y, z));

    // ── trône ──
    const ts = s.stand([480, 150, 400, 320]);
    const u = ts.w * 0.78;
    const tx = ts.x;
    // l'estrade affleure le bas du rect ; le trône recule d'autant
    const tz = Math.max(ts.z - u * 0.45, 1.4);
    const throne = new THREE.Group();
    // estrade : trois marches rondes, liserés dorés
    let y = 0;
    const steps = [0.5, 0.41, 0.33].map((r, i) => {
      const h = u * 0.06;
      throne.add(at(cyl(u * r, u * (r + 0.02), h, i % 2 ? '#4a2210' : '#5e2e14', { seg: 28 }), 0, y + h / 2, 0));
      const rim = at(torus(u * (r + 0.005), u * 0.008, GOLD), 0, y + h, 0);
      rim.rotation.x = Math.PI / 2;
      throne.add(rim);
      y += h;
      return y;
    });
    const seatY = steps[2];
    // tapis de velours qui descend les marches vers la caméra
    for (const [rw, color, dy] of [[0.24, GOLD, 0.06], [0.2, VELVET, 0.064]] as const) {
      const rug = at(box(u * rw, 0.02, u * 0.5, color, { edges: false }), 0, u * dy, u * 0.3);
      rug.rotation.x = -0.3;
      throne.add(rug);
    }
    // dossier : éventail d'élytres (ellipsoïdes bordés d'or) + cimier à gemme
    const backZ = -u * 0.2;
    const fan = [-0.62, -0.32, 0, 0.32, 0.62];
    fan.forEach((a, i) => {
      const len = u * (i === 2 ? 0.62 : i % 2 ? 0.55 : 0.46);
      const leaf = new THREE.Group();
      const edge = at(sphere(1, GOLD_DARK, { seg: 20 }), 0, len, -0.03);
      edge.scale.set(u * 0.12, len, u * 0.04);
      const body = at(sphere(1, i % 2 ? '#6b3414' : '#7a3e18', { seg: 20 }), 0, len, 0);
      body.scale.set(u * 0.105, len * 0.96, u * 0.05);
      const vein = at(box(u * 0.008, len * 1.4, u * 0.01, '#2a1006', { edges: false }), 0, len, u * 0.05);
      leaf.add(edge, body, vein);
      leaf.rotation.z = a;
      leaf.position.set(0, seatY + u * 0.04, backZ - Math.abs(a) * 0.1);
      throne.add(leaf);
    });
    const crestY = seatY + u * 1.28;
    const crest = at(torus(u * 0.09, u * 0.018, GOLD), 0, crestY, backZ + 0.1);
    const gem = at(sphere(u * 0.06, '#c77dff', { glow: true, seg: 16 }), 0, crestY, backZ + 0.12);
    const gemHalo = at(glow('#c77dff', u * 0.6, 0.5), 0, crestY, backZ + 0.2);
    throne.add(crest, gem, gemHalo);
    for (const sx of [-1, 1]) {
      const spike = at(cyl(0, u * 0.025, u * 0.16, GOLD, { seg: 6 }), sx * u * 0.13, crestY + u * 0.05, backZ + 0.1);
      spike.rotation.z = -sx * 0.5;
      throne.add(spike);
    }
    // siège : assise, coussin de velours, accoudoirs à pommeaux dorés
    throne.add(at(box(u * 0.5, u * 0.12, u * 0.32, '#4a2210'), 0, seatY + u * 0.06, -u * 0.04));
    const cushion = at(sphere(1, VELVET, { seg: 18 }), 0, seatY + u * 0.13, -u * 0.04);
    cushion.scale.set(u * 0.24, u * 0.035, u * 0.15);
    throne.add(cushion);
    for (const sx of [-1, 1]) {
      throne.add(at(box(u * 0.07, u * 0.22, u * 0.32, '#5e2e14'), sx * u * 0.27, seatY + u * 0.11, -u * 0.04));
      throne.add(at(sphere(u * 0.05, GOLD, { seg: 12 }), sx * u * 0.27, seatY + u * 0.25, u * 0.12));
      // glands du coussin
      throne.add(at(sphere(u * 0.018, GOLD, { seg: 8 }), sx * u * 0.22, seatY + u * 0.1, u * 0.1));
    }
    throne.position.set(tx, 0, tz);
    s.add(throne);

    // tentures de velours tirées de part et d'autre, tringle dorée
    const rodY = s.wallAt(680, 30, tz - u * 0.35).y;
    const dz = tz - u * 0.35;
    const rod = at(cyl(u * 0.02, u * 0.02, u * 1.9, GOLD, { seg: 10 }), tx, rodY, dz);
    rod.rotation.z = Math.PI / 2;
    s.add(rod);
    for (const sx of [-1, 1]) {
      s.add(at(sphere(u * 0.04, GOLD, { seg: 12 }), tx + sx * u * 0.95, rodY, dz));
      s.add(at(drape(u * 0.62, rodY + 0.1, sx), tx + sx * u * 0.78, 0, dz));
    }

    // la Reine : sprite GenAI en pied sur l'estrade, devant le dossier
    const top = s.wallAt(680, 44, tz).y;
    const qh = top - seatY;
    const queen = billboard(REINE_URL, qh, REINE_ASPECT, { tint: '#fff2e2', shadow: u * 0.16 });
    queen.position.set(tx + u * 0.02, seatY + u * 0.02, tz + u * 0.04);
    const qs = queen.userData.sprite as THREE.Sprite;
    const qBase = qs.scale.clone();
    // contre-jour chaud derrière la Reine : sa silhouette se détache du dossier
    const aura = at(glow('#ffb347', qh * 1.3, 0.42), tx, seatY + qh * 0.55, tz - u * 0.12);
    s.add(aura);
    s.spot('reine', queen);
    s.animate((t) => {
      // respiration (échelle) + léger balancement royal
      const b = Math.sin(t * 1.25);
      qs.scale.set(qBase.x * (1 + b * 0.008), qBase.y * (1 + b * 0.014), 1);
      qs.material.rotation = Math.sin(t * 0.55) * 0.012;
      aura.material.opacity = 0.36 + b * 0.06;
      gemHalo.material.opacity = 0.4 + Math.sin(t * 2.1) * 0.15;
    });
    shaft(s, tx, tz - 0.2, 8.5, '#ffd8a0', 0.075);
    s.add(at(pool('#ffb347', u * 1.8, u * 1.0, 0.3), tx, 0.012, tz + u * 0.3));

    // ── autel du Seau Sacré ──
    const as = s.stand([195, 300, 170, 170]);
    const aw = as.w;
    const altarH = s.wallAt(280, 382, as.z).y;
    const altar = new THREE.Group();
    altar.add(at(cyl(aw * 0.42, aw * 0.5, altarH * 0.82, '#4e2412', { seg: 18 }), 0, altarH * 0.41, 0));
    altar.add(at(cyl(aw * 0.5, aw * 0.46, altarH * 0.18, '#6a3418', { seg: 18 }), 0, altarH * 0.91, 0));
    for (const yy of [0.08, 0.82, 1]) {
      const band = at(torus(aw * (yy === 0.08 ? 0.5 : 0.47), aw * 0.014, GOLD), 0, altarH * yy, 0);
      band.rotation.x = Math.PI / 2;
      altar.add(band);
    }
    // nappe brodée qui retombe à l'avant
    altar.add(at(box(aw * 0.36, altarH * 0.5, 0.02, VELVET, { edges: false }), 0, altarH * 0.72, aw * 0.47));
    altar.add(at(box(aw * 0.36, altarH * 0.05, 0.025, GOLD, { edges: false }), 0, altarH * 0.48, aw * 0.475));
    altar.position.set(as.x, 0, as.z);
    s.add(altar);
    // le Seau, sur son coussin, sous sa lumière
    const sb = s.stand([232, 292, 96, 92], altarH);
    const bucket = at(seau(sb.w * 0.8, sb.h * 0.92), as.x, altarH, as.z);
    bucket.rotation.y = -0.35;
    const halo = at(glow('#ffd166', aw * 1.5, 0.35), as.x, altarH + sb.h * 0.5, as.z - 0.2);
    const ray = shaft(s, as.x, as.z, 8, '#ffe6a8', 0.1);
    const altarCandles = [-1, 1].map((sx) => at(candle(s, aw * 0.14), as.x + sx * aw * 0.36, altarH, as.z + aw * 0.12));
    // deux gardes en 3/4, de part et d'autre
    const guards = crowd(
      s,
      [
        { px: [160, 474], hpx: 120, pose: '34', right: true },
        { px: [402, 474], hpx: 120, pose: '34', right: false },
      ],
      TINT,
    ).roaches;
    s.spot('autel', bucket, halo, ray, ...guards);
    s.add(...altarCandles);
    for (const [px, h] of [[148, 0.5], [420, 0.42], [210, 0.32]] as const) {
      const p = s.floorAt(px, 488);
      s.add(at(candle(s, h), p.x, 0, p.z));
    }
    s.add(at(pool('#ffd166', aw * 2.2, aw * 1.2, 0.22), as.x, 0.012, as.z + 0.4));

    // ── la cour : courtisans en prière, tournés vers la Reine ──
    const court = crowd(
      s,
      [
        { px: [945, 478], hpx: 118, right: false },
        { px: [1032, 466], hpx: 104, right: false },
        { px: [1118, 482], hpx: 128, right: false },
        { px: [1200, 462], hpx: 98, right: false },
        { px: [1262, 486], hpx: 134, right: false },
        { px: [985, 440], hpx: 78, right: false, pose: '34' },
        { px: [1078, 438], hpx: 74, right: false },
        { px: [1165, 436], hpx: 72, right: false },
      ],
      TINT,
    ).roaches;
    s.spot('courtisans', ...court);
    // fidèles du fond : d'autres prient, deux passent
    crowd(
      s,
      [
        { px: [452, 456], hpx: 54, right: true },
        { px: [486, 452], hpx: 48, right: true, pose: '34' },
        { px: [880, 452], hpx: 50, right: false },
        { px: [70, 470], hpx: 56, pose: 'walk1', walk: 0.9 },
        { px: [1010, 448], hpx: 44, pose: 'walk1', walk: 0.6, right: false },
      ],
      '#d9b394',
    );

    // ── passage vers la galerie : bouche organique dans la paroi ──
    const ex = s.fit(s.rect('vers_galerie'), 0.05);
    const mouth = new THREE.Mesh(new THREE.CircleGeometry(0.5, 32), mat('#0c0402', { glow: true }));
    mouth.scale.set(ex.w * 1.05, ex.h * 1.05, 1);
    mouth.position.set(ex.x, ex.y, 0.04);
    const ring = at(vaultArch(ex.w * 0.62, 0.16, '#3a1a0c', Math.PI * 1.25), ex.x, ex.y - ex.h * 0.05, 0.1);
    ring.scale.y = ex.h / ex.w;
    s.add(mouth, ring, at(glow('#ff9a4a', ex.w * 1.6, 0.35), ex.x, ex.y - ex.h * 0.2, 0.12));

    // ── voûte au-dessus du trône, niche royale ──
    const niche = new THREE.Mesh(new THREE.CircleGeometry(0.5, 40), mat('#1a0804', { glow: true }));
    niche.scale.set(u * 1.6, u * 2.2, 1);
    niche.position.set(tx, seatY + u * 0.9, 0.02);
    s.add(niche, at(glow('#ff9a3a', u * 2.2, 0.28), tx, seatY + u * 0.9, 0.05));
    s.add(at(vaultArch(u * 0.95, 0.24, '#3a1a0c'), tx, seatY + u * 0.6, 0.3));
    s.add(at(vaultArch(u * 0.95 + 0.34, 0.07, GOLD_DARK), tx, seatY + u * 0.6, 0.36));

    // ── lueurs, flaques, brume ──
    eggLamps(s, -6.4, 1.2, 0.8);
    eggLamps(s, 6.6, 1.1, 0.7, '#ffb36b');
    eggLamps(s, -2.9, 0.7, 0.45, '#ffd08a', false);
    const shines = [puddle(s, -4.6, 5.2, 2.4, 1.1), puddle(s, 3.4, 5.9, 1.8, 0.8), puddle(s, 6.2, 3.6, 1.3, 0.6)];
    s.animate((t) => shines.forEach((m, i) => ((m.material as THREE.MeshBasicMaterial).opacity = 0.28 + Math.sin(t * 0.9 + i * 2) * 0.08)));
    mist(s, '#ffb37a', [
      [-5, 3, 7],
      [1, 2.5, 8],
      [6, 3.5, 6],
    ]);

    // ── B.O.B. (« le Grand Avaleur ») ──
    const bb = s.stand(s.rect('bob'));
    const robot = at(bob(bb.w * 0.72), bb.x, 0, bb.z, 0.25);
    s.spot('bob', robot);
    s.expose('bobVoix', new BobVoice(s, robot));
    s.animate((t) => {
      robot.position.y = Math.abs(Math.sin(t * 1.2)) * 0.015;
    });
    // une miette sur un coussin, posée par un fidèle à côté de B.O.B.
    const crumb = s.floorAt(560, 520);
    const pillow = at(sphere(1, VELVET, { seg: 12 }), crumb.x, 0.06, crumb.z);
    pillow.scale.set(0.28, 0.07, 0.2);
    s.add(pillow, at(box(0.09, 0.07, 0.08, '#e8c27a'), crumb.x, 0.16, crumb.z));
  },
};

/**
 * Tenture de velours retenue sur le côté (`side` = -1 gauche, +1 droite) :
 * plan plissé (vrais plis 3D, ombrés en toon), resserré au bas vers l'extérieur,
 * frange dorée. Origine au sol, accrochée en `top`.
 */
function drape(w: number, top: number, side: number): THREE.Group {
  const g = new THREE.Group();
  const geo = new THREE.PlaneGeometry(w, top, 28, 12);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const yy = pos.getY(i);
    const v = (yy + top / 2) / top; // 0 en bas, 1 en haut
    // embrasse à 40 % de la hauteur : tissu resserré vers l'extérieur
    const tie = Math.exp(-Math.pow((v - 0.38) / 0.18, 2));
    const squeeze = 1 - 0.55 * tie;
    const nx = x * squeeze + side * (w / 2) * (1 - squeeze);
    pos.setXYZ(i, nx, yy, Math.sin((x / w) * Math.PI * 3.5) * w * 0.045 * squeeze);
  }
  geo.computeVertexNormals();
  const cloth = new THREE.Mesh(geo, mat(VELVET, { side: THREE.DoubleSide }));
  cloth.castShadow = cloth.receiveShadow = true;
  cloth.position.y = top / 2;
  g.add(cloth);
  // embrasse dorée + frange
  const tieY = top * 0.38;
  g.add(at(sphere(w * 0.08, GOLD, { seg: 10 }), side * w * 0.36, tieY, w * 0.08));
  g.add(at(box(w, top * 0.025, w * 0.12, GOLD, { edges: false }), 0, top * 0.012, 0));
  return g;
}
