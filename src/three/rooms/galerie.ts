import * as THREE from 'three';
import { at, box, cyl, glow, mat, pool, sphere, torus } from '../kit';
import { ROACH_ACTOR, SCRIBE_ASPECT, SCRIBE_SHEET, actorFrame, billboardSheet } from '../props';
import { bobSpot } from './bobspot';
import { candle, crowd, drip, eggLamps, hive, mist, puddle, rib, rng, shaft, vaultArch } from './hive';
import type { RoomBuild } from './index';

const TINT = '#ffe7cf';
const GOLD = '#e0a83a';
const GOLD_DARK = '#9a6a1e';
const SCATTERED = { flags: ['ch1_foule_dispersee'] };

/** Galerie des Offrandes (ch.1) : fresque de la prophétie, Frère Élytre, bassin tiède, grenier, la foule. */
export const galerie: RoomBuild = {
  camera: { pos: [0, 2.3, 9], look: [0, 2.1, 0], fov: 50 },
  shots: {
    fresque: { fill: 0.82, lift: 0.3 },
    scribe: { fill: 0.86, lift: 0.1, px: [620, 260] },
    bassin: { fill: 0.6, lift: 0.5, orbit: 8 },
    grenier: { fill: 0.8, orbit: 6 },
    foule: { fill: 0.75, orbit: 12 },
  },
  build(s) {
    hive(s, { wall: ['#1c0c07', '#482612'], floor: ['#2c160a', '#553016'], rib: '#3a1a0c', seed: 23 });
    s.lights({
      sky: '#ffdcb0',
      ground: '#2a1008',
      ambient: 0.9,
      key: { color: '#ffe6c4', intensity: 1.7, pos: [3, 10, 7], target: [-0.5, 0, 1] },
      points: [
        { color: '#ffb347', intensity: 10, pos: [-4.5, 4, 3.5], distance: 10 },
        { color: '#9fe8ff', intensity: 5, pos: [3.2, 1.6, 3.5], distance: 6 },
      ],
      rim: { color: '#ff9a5a', intensity: 1.0, pos: [-5, 6, -5] },
      fill: { color: '#7a5cff', intensity: 0.3, pos: [6, 3, 6] },
      fog: { color: '#22100a', near: 8, far: 27 },
      vignette: { color: '#140604', strength: 0.64, warm: '#ffc47a20' },
    });

    // proscenium de côtes + coulures de la voûte
    s.add(
      rib(-9.8, 3.4, 8.4, 3.2, 0.55, '#2e1408', 0.8),
      rib(9.8, 3.4, 8.4, -3.2, 0.55, '#2e1408', 0.8),
      // côte de paroi derrière le Scribe : collée au mur, sinon elle passe devant sa plume
      rib(-0.9, 0.1, 7.4, -1.6, 0.26, '#3a1a0c', 0.3),
    );
    for (const [x, y, z, len, r] of [
      [-2.2, 6.9, 1.0, 1.0, 0.12],
      [1.6, 6.8, 1.4, 1.3, 0.14],
      [4.9, 6.6, 0.9, 0.8, 0.1],
      [-6.4, 6.5, 1.8, 1.1, 0.13],
    ] as const) s.add(at(drip(len, r), x, y, z));

    // ── fresque de la Prophétie : peinture GenAI, cadre sculpté ──
    const ff = s.fit(s.rect('fresque'), 0.08);
    // cadre au rapport de la peinture (contenu dans le hotspot, centré) : rien n'est rogné
    const fw = Math.min(ff.w, (ff.h * 0.88 * FRESCO_ASPECT) / 0.92);
    const fh = (fw * 0.92) / FRESCO_ASPECT / 0.88;
    const fresco = new THREE.Group();
    const paint = new THREE.Mesh(new THREE.PlaneGeometry(fw * 0.92, fh * 0.88), mat('#ffffff', { map: prophecyTexture((fw * 0.92) / (fh * 0.88)) }));
    paint.receiveShadow = true;
    fresco.add(at(paint, 0, 0, 0.03));
    const t = fh * 0.07;
    for (const [x, y, w, h] of [
      [0, fh / 2 - t / 2, fw, t],
      [0, -fh / 2 + t / 2, fw, t],
      [-fw / 2 + t / 2, 0, t, fh],
      [fw / 2 - t / 2, 0, t, fh],
    ]) fresco.add(at(box(w, h, 0.16, '#4a2410'), x, y, 0.06), at(box(w * (w > h ? 1 : 0.4), h * (h > w ? 1 : 0.4), 0.17, GOLD_DARK, { edges: false }), x, y, 0.07));
    for (const [cx, cy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) fresco.add(at(sphere(t * 0.7, GOLD, { seg: 12 }), cx * (fw / 2 - t / 2), cy * (fh / 2 - t / 2), 0.16));
    s.spot('fresque', at(fresco, ff.x, ff.y, 0.08));
    // appliques : deux bougies sur consoles, de part et d'autre
    for (const sx of [-1, 1]) {
      const cx = ff.x + sx * (fw / 2 + 0.35);
      const cy = ff.y - fh * 0.32;
      s.add(at(box(0.36, 0.08, 0.3, '#4a2410'), cx, cy, 0.18), at(candle(s, 0.34), cx, cy + 0.04, 0.2));
    }
    s.add(at(pool('#ffc47a', fw * 1.3, fh * 1.1, 0.14), ff.x, ff.y, 0.05));

    // ── Frère Élytre, Grand Scribe : sprite GenAI derrière son pupitre ──
    const sc = s.stand(s.rect('scribe'));
    const sz = sc.z - 0.5;
    const top = s.wallAt(620, 176, sz).y;
    // planche : antennes qui ondulent, mandibules qui s'écartent quand il parle
    const scribe = billboardSheet(SCRIBE_SHEET, 3, top, SCRIBE_ASPECT, { tint: '#fff0de', shadow: 0.5 });
    scribe.position.set(sc.x - 0.05, 0, sz);
    const ss = scribe.userData.sprite as THREE.Sprite;
    const sBase = ss.scale.clone();
    // pupitre : piétement de chitine, plateau incliné, grimoire ouvert, encrier, bougie
    const desk = new THREE.Group();
    const dh = top * 0.42;
    desk.add(at(cyl(0.12, 0.2, dh, '#4a2410', { seg: 10 }), 0, dh / 2, 0));
    desk.add(at(cyl(0.42, 0.5, 0.1, '#3a1a0c', { seg: 14 }), 0, 0.05, 0));
    const lectern = new THREE.Group();
    lectern.add(at(box(sc.w * 0.62, 0.07, 0.6, '#6a3418'), 0, 0, 0));
    lectern.add(at(box(sc.w * 0.64, 0.03, 0.62, GOLD, { edges: false }), 0, -0.04, 0));
    const pages = [-1, 1].map((sx) => {
      const p = at(box(sc.w * 0.27, 0.025, 0.44, '#f3e6c4'), sx * sc.w * 0.145, 0.05, 0);
      p.rotation.z = -sx * 0.08;
      return p;
    });
    lectern.add(...pages, at(box(0.02, 0.06, 0.44, '#8a2b2b', { edges: false }), 0, 0.04, 0));
    // lignes d'écriture (traits d'encre sur les pages)
    for (let i = 0; i < 6; i++) for (const sx of [-1, 1]) lectern.add(at(box(sc.w * 0.2, 0.004, 0.012, '#5a3a20', { edges: false, shadow: false }), sx * sc.w * 0.145, 0.065, -0.15 + i * 0.06));
    lectern.rotation.x = 0.42;
    lectern.position.set(0, dh + 0.06, 0);
    desk.add(lectern);
    desk.add(at(cyl(0.05, 0.06, 0.1, '#1a1020', { seg: 8 }), sc.w * 0.36, dh + 0.12, 0.28));
    const quill = at(cyl(0.006, 0.02, 0.36, '#f6efe2', { seg: 5, edges: false }), sc.w * 0.36, dh + 0.3, 0.28);
    quill.rotation.z = -0.4;
    desk.add(quill, at(candle(s, 0.22), -sc.w * 0.36, dh + 0.06, 0.25));
    desk.position.set(sc.x, 0, sc.z + 0.15);
    s.spot('scribe', scribe, desk);
    // archives : rouleaux en tas au pied du pupitre
    const scrolls = new THREE.Group();
    const r = rng(41);
    for (let i = 0; i < 9; i++) {
      const roll = at(cyl(0.07, 0.07, 0.55 + r() * 0.2, i % 3 ? '#e8d4a6' : '#d9bf86', { seg: 10 }), (r() - 0.5) * 1.2, 0.07 + Math.floor(i / 4) * 0.12, (r() - 0.5) * 0.4);
      roll.rotation.z = Math.PI / 2;
      roll.rotation.y = (r() - 0.5) * 0.8;
      scrolls.add(roll);
    }
    scrolls.position.set(sc.x - sc.w * 0.75, 0, sc.z + 0.3);
    s.add(scrolls);
    // casiers à parchemins dans la paroi, derrière le Scribe
    const rack = new THREE.Group();
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 5; col++) {
        const cell = at(cyl(0.2, 0.2, 0.3, '#1c0a05', { seg: 6 }), (col - 2) * 0.44 + (row % 2) * 0.22, row * 0.38, 0);
        cell.rotation.x = Math.PI / 2;
        const end = at(cyl(0.11, 0.11, 0.05, '#e8d4a6', { seg: 10, edges: false }), (col - 2) * 0.44 + (row % 2) * 0.22, row * 0.38, 0.14);
        end.rotation.x = Math.PI / 2;
        rack.add(cell, end);
      }
    }
    const rk = s.wallAt(620, 130, 0.2);
    rack.position.set(rk.x, rk.y - 0.4, 0.2);
    s.add(rack, at(vaultArch(1.45, 0.14, '#3a1a0c'), rk.x, rk.y - 0.5, 0.3), at(vaultArch(1.6, 0.05, GOLD_DARK), rk.x, rk.y - 0.5, 0.34));
    s.add(at(glow('#ffb347', top * 1.2, 0.3), sc.x, top * 0.55, sz - 0.3));
    s.animate((time) => {
      const b = Math.sin(time * 1.4);
      ss.scale.set(sBase.x, sBase.y * (1 + b * 0.012), 1);
      scribe.userData.setFrame(actorFrame('scribe', ROACH_ACTOR, time));
      // il hoche la tête en relisant (petit balancement)
      ss.material.rotation = Math.sin(time * 0.8) * 0.015;
    });

    // ── bassin des Ablutions : vasque de résine, eau bénite (tiède) ──
    const bs = s.stand(s.rect('bassin'));
    const br = bs.w * 0.42;
    const bh = s.wallAt(870, 392, bs.z).y;
    const basin = new THREE.Group();
    basin.add(at(cyl(br * 0.45, br * 0.6, bh * 0.6, '#4a2410', { seg: 16 }), 0, bh * 0.3, 0));
    basin.add(at(cyl(br, br * 0.7, bh * 0.45, '#6a3418', { seg: 24 }), 0, bh * 0.78, 0));
    const lip = at(torus(br * 0.98, br * 0.07, GOLD), 0, bh, 0);
    lip.rotation.x = Math.PI / 2;
    basin.add(lip);
    const water = at(cyl(br * 0.92, br * 0.92, 0.02, '#6fd0ff', { glow: true, opacity: 0.85, seg: 28 }), 0, bh + 0.012, 0);
    basin.add(water);
    const ripples = [0, 1, 2].map(() => {
      const ring = at(torus(br * 0.3, 0.012, '#d8f6ff', { glow: true }), 0, bh + 0.03, 0);
      ring.rotation.x = Math.PI / 2;
      basin.add(ring);
      return ring;
    });
    const steam = [0, 1, 2, 3].map(() => {
      const g = glow('#e6f6ff', br * 1.2, 0);
      basin.add(g);
      return g;
    });
    basin.position.set(bs.x, 0, bs.z);
    s.spot('bassin', basin);
    s.add(at(pool('#7fd8ff', br * 3.4, br * 2.2, 0.22), bs.x, 0.012, bs.z + 0.2));
    s.animate((time) => {
      ripples.forEach((ring, i) => {
        const k = (time * 0.35 + i / 3) % 1;
        ring.scale.setScalar(0.3 + k * 2.6);
        (ring.material as THREE.MeshBasicMaterial).transparent = true;
        (ring.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.6;
      });
      steam.forEach((g, i) => {
        const k = (time * 0.18 + i / 4) % 1;
        g.position.set(Math.sin(i * 2.3 + time * 0.4) * br * 0.4, bh + k * 1.4, 0);
        g.material.opacity = Math.sin(k * Math.PI) * 0.16;
      });
    });

    // ── grenier aux miettes : alvéoles de cire pleines de miettes saintes ──
    const gf = s.fit(s.rect('grenier'), 0.3);
    const granary = new THREE.Group();
    const R = Math.min(gf.w / 6.2, gf.h / 6.4);
    const crumbColors = ['#e8c27a', '#d9a55a', '#f0d49a', '#c98a3e'];
    const cr = rng(7);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        const x = (col - 1) * R * 1.8 + (row % 2 ? R * 0.9 : 0) - R * 0.45;
        const y = (1.5 - row) * R * 1.56;
        const cell = at(cyl(R, R, 0.3, '#c99a3a', { seg: 6 }), x, y, 0);
        cell.rotation.x = Math.PI / 2;
        cell.rotation.y = Math.PI / 6;
        const hole = at(cyl(R * 0.82, R * 0.82, 0.32, '#3a1e0a', { seg: 6, edges: false }), x, y, 0.01);
        hole.rotation.x = Math.PI / 2;
        hole.rotation.y = Math.PI / 6;
        granary.add(cell, hole);
        // miettes dans l'alvéole (une alvéole « croissant, ère préhistorique »)
        if (row === 1 && col === 2) {
          const croissant = at(torus(R * 0.4, R * 0.16, '#e0a24a'), x, y - R * 0.1, 0.2);
          (croissant.geometry as THREE.TorusGeometry).dispose();
          croissant.geometry = new THREE.TorusGeometry(R * 0.4, R * 0.17, 8, 16, Math.PI * 1.2);
          croissant.rotation.z = -0.3;
          granary.add(croissant);
          continue;
        }
        for (let i = 0; i < 7; i++) {
          const c = at(new THREE.Mesh(new THREE.DodecahedronGeometry(R * (0.12 + cr() * 0.1)), mat(crumbColors[i % 4])), x + (cr() - 0.5) * R * 0.9, y - R * 0.35 + cr() * R * 0.5, 0.18);
          c.rotation.set(cr() * 3, cr() * 3, 0);
          granary.add(c);
        }
      }
    }
    // rebord de résine + tas de miettes qui déborde
    granary.add(at(box(gf.w * 0.95, 0.14, 0.7, '#4a2410'), 0, -gf.h / 2 + 0.07, 0.25));
    for (let i = 0; i < 26; i++) {
      const a = cr() * Math.PI;
      const rr = cr() * gf.w * 0.32;
      const c = at(new THREE.Mesh(new THREE.DodecahedronGeometry(0.05 + cr() * 0.06), mat(crumbColors[i % 4])), Math.cos(a) * rr, -gf.h / 2 + 0.18 + Math.sin(a) * 0.12 * (1 - rr / gf.w), 0.3 + cr() * 0.25);
      granary.add(c);
    }
    s.spot('grenier', at(granary, gf.x, gf.y, 0.3));
    s.add(at(glow('#ffd08a', gf.w * 1.4, 0.18), gf.x, gf.y, 0.2));

    // ── la foule en prière, tournée vers le Temple : bouche le passage ──
    const prayer = crowd(
      s,
      [
        { px: [1030, 478], hpx: 112 },
        { px: [1100, 470], hpx: 104 },
        { px: [1175, 482], hpx: 124 },
        { px: [1250, 468], hpx: 106 },
        { px: [1060, 438], hpx: 84 },
        { px: [1140, 432], hpx: 80, pose: '34', right: false },
        { px: [1215, 430], hpx: 82 },
        { px: [1270, 426], hpx: 78 },
        { px: [1010, 420], hpx: 64 },
        { px: [1095, 406], hpx: 62 },
        { px: [1170, 404], hpx: 60 },
        { px: [1240, 400], hpx: 60 },
        { px: [1000, 500], hpx: 128, pose: '34' },
      ],
      TINT,
    ).roaches;
    s.spot('foule', ...prayer);

    // le goûter, au fond de la galerie, une fois la foule dispersée
    const snack = new THREE.Group();
    const pile = s.floorAt(1110, 462);
    for (let i = 0; i < 40; i++) {
      const a = cr() * Math.PI * 2;
      const rr = Math.sqrt(cr()) * 0.9;
      const c = at(new THREE.Mesh(new THREE.DodecahedronGeometry(0.06 + cr() * 0.08), mat(crumbColors[i % 4])), pile.x + Math.cos(a) * rr * 1.3, 0.05 + (1 - rr) * 0.25 * cr(), pile.z + Math.sin(a) * rr * 0.5);
      snack.add(c);
    }
    s.when(SCATTERED, snack);
    const eaters = crowd(
      s,
      [
        { px: [1040, 476], hpx: 96, pose: 'walk1', right: true },
        { px: [1175, 470], hpx: 92, pose: '34', right: false },
        { px: [1110, 438], hpx: 70, pose: 'worship', right: true },
        { px: [1220, 486], hpx: 104, pose: 'walk2', right: false },
        { px: [1085, 490], hpx: 108, pose: '34', right: true },
      ],
      TINT,
    ).roaches;
    s.when(SCATTERED, ...eaters);

    // ── passages : vers le Nid (gauche), vers le Temple (droite, lueur bleue de la station) ──
    const nidF = s.fit(s.rect('vers_nid'), 0.05);
    const tempF = s.fit(s.rect('vers_temple'), 0.05);
    for (const [f, color] of [
      [nidF, '#ff9a4a'],
      [tempF, '#7fb8ff'],
    ] as const) {
      const hole = new THREE.Mesh(new THREE.CircleGeometry(0.5, 32), mat('#0a0403', { glow: true }));
      hole.scale.set(f.w * 1.1, f.h * 1.05, 1);
      hole.position.set(f.x, f.y, 0.04);
      const ring = at(vaultArch(f.w * 0.62, 0.14, '#3a1a0c', Math.PI * 1.25), f.x, f.y - f.h * 0.05, 0.1);
      ring.scale.y = f.h / f.w;
      s.add(hole, ring, at(glow(color, f.w * 1.8, 0.4), f.x, f.y - f.h * 0.15, 0.12));
    }

    // ── lueurs, flaques, brume ──
    eggLamps(s, -6.6, 1.0, 0.7);
    eggLamps(s, -1.2, 0.8, 0.5, '#ffd08a', false);
    eggLamps(s, 6.9, 0.9, 0.6, '#ffb36b', false);
    shaft(s, sc.x, sz, 8.5, '#ffe2b0', 0.07);
    const shines = [puddle(s, -2.8, 5.6, 2.0, 0.9), puddle(s, 4.6, 6.2, 1.6, 0.7)];
    s.animate((time) => shines.forEach((m, i) => ((m.material as THREE.MeshBasicMaterial).opacity = 0.28 + Math.sin(time * 0.9 + i * 2) * 0.08)));
    mist(s, '#ffb37a', [
      [-4, 3, 7],
      [2, 2.5, 8],
    ]);

    // ── B.O.B. ──
    const { robot } = bobSpot(s, { scale: 0.72 });
    s.animate((time) => {
      // il tourne autour des miettes comme un requin (dépressif)
      robot.rotation.y = 0.4 + Math.sin(time * 0.6) * 0.35;
      robot.position.y = Math.abs(Math.sin(time * 1.2)) * 0.015;
    });
  },
};

/** Fresque de la Prophétie (GenAI, 1024 × 768) : _briefs/ch1/genai-fix/fresco-homme-seau-v1.jpg. */
const FRESCO_URL = `${import.meta.env.BASE_URL}props/ch1/fresco.jpg`;
const FRESCO_ASPECT = 1024 / 768;

/**
 * Fresque de la Prophétie, peinte sur enduit ocre : l'Homme au Seau lève
 * son seau, des rayons fendent quatre mondes, la foule des cafards
 * s'agenouille ; sur son cœur, le Signe aux deux R. Frise de glyphes.
 * Recadrée en « cover » sur un panneau de rapport `aspect` (centrée).
 */
function prophecyTexture(aspect: number): THREE.Texture {
  const t = new THREE.TextureLoader().load(FRESCO_URL);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (aspect > FRESCO_ASPECT) t.repeat.set(1, FRESCO_ASPECT / aspect);
  else t.repeat.set(aspect / FRESCO_ASPECT, 1);
  t.offset.set((1 - t.repeat.x) / 2, (1 - t.repeat.y) / 2);
  return t;
}
