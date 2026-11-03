import * as THREE from 'three';
import { t as tr } from '../../i18n';
import { at, box, cyl, glow, label, plane, pool, sphere, torus } from '../kit';
import { SIEGE_CARAPACE_ASPECT, SIEGE_CARAPACE_URL, billboard } from '../props';
import { pressable } from '../press';
import { bobSpot } from './bobspot';
import type { RoomBuild } from './index';

const CONTACT = { flags: ['iv_contact'] };
const DARK = { notFlags: ['iv_contact'] };
const NAV = { flags: ['iv_navigateur'] };
const GO = { flags: ['iv_destination'] };

/** Faille vue par le pare-brise : spirale violette peinte, tournée à chaque image. */
function riftTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d')!;
  const bg = g.createRadialGradient(256, 256, 10, 256, 256, 300);
  bg.addColorStop(0, '#ffe6ff');
  bg.addColorStop(0.12, '#ff8ab8');
  bg.addColorStop(0.35, '#8a2ad8');
  bg.addColorStop(0.62, 'rgba(42,10,80,0.85)');
  bg.addColorStop(0.85, 'rgba(20,6,40,0.3)');
  bg.addColorStop(1, 'rgba(7,3,15,0)');
  g.fillStyle = bg;
  g.fillRect(0, 0, 512, 512);
  // bras de la spirale
  g.translate(256, 256);
  for (let arm = 0; arm < 5; arm++) {
    g.rotate((Math.PI * 2) / 5);
    g.beginPath();
    for (let k = 0; k < 120; k++) {
      const a = k * 0.06;
      const r = 8 + k * 2.2;
      g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.strokeStyle = arm % 2 ? 'rgba(255,138,184,0.45)' : 'rgba(199,125,255,0.5)';
    g.lineWidth = 10;
    g.stroke();
  }
  // étoiles avalées
  for (let i = 0; i < 70; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 60 + Math.random() * 200;
    g.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.6})`;
    g.fillRect(Math.cos(a) * r, Math.sin(a) * r, 2, 2);
  }
  // fondu circulaire : la faille se pose sur le ciel sans bord carré
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'destination-in';
  const mask = g.createRadialGradient(256, 256, 150, 256, 256, 256);
  mask.addColorStop(0, '#000');
  mask.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = mask;
  g.fillRect(0, 0, 512, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Ciel intersidéral du pare-brise panoramique : fond profond, nébuleuses, galaxie lointaine. */
function skyTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 600;
  const g = c.getContext('2d')!;
  const bg = g.createLinearGradient(0, 0, 0, 600);
  bg.addColorStop(0, '#05030f');
  bg.addColorStop(0.55, '#0d0828');
  bg.addColorStop(1, '#1a0b33');
  g.fillStyle = bg;
  g.fillRect(0, 0, 2048, 600);
  // nébuleuses : nuages additifs violet, rose, turquoise
  g.globalCompositeOperation = 'lighter';
  const cloud = (x: number, y: number, r: number, color: string, a: number) => {
    const n = g.createRadialGradient(x, y, 0, x, y, r);
    n.addColorStop(0, color.replace('A', String(a)));
    n.addColorStop(1, color.replace('A', '0'));
    g.fillStyle = n;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  };
  for (let i = 0; i < 26; i++) {
    const left = i % 2 === 0;
    const x = left ? 120 + Math.random() * 640 : 1290 + Math.random() * 640;
    const y = 120 + Math.random() * 380;
    cloud(x, y, 90 + Math.random() * 170, ['rgba(181,108,255,A)', 'rgba(255,110,170,A)', 'rgba(80,220,200,A)', 'rgba(90,120,255,A)'][i % 4], 0.08 + Math.random() * 0.1);
  }
  // galaxie lointaine, en haut à droite, et une petite planète en bas à gauche
  g.save();
  g.translate(1720, 140);
  g.rotate(-0.35);
  g.scale(1, 0.32);
  cloud(0, 0, 110, 'rgba(255,230,200,A)', 0.55);
  cloud(0, 0, 40, 'rgba(255,255,255,A)', 0.7);
  g.restore();
  g.globalCompositeOperation = 'source-over';
  const pg = g.createRadialGradient(250, 470, 8, 280, 500, 90);
  pg.addColorStop(0, '#7fffd4');
  pg.addColorStop(0.5, '#2a7f8a');
  pg.addColorStop(1, '#0a1a2a');
  g.fillStyle = pg;
  g.beginPath();
  g.arc(280, 500, 70, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = 'rgba(255,209,102,0.55)';
  g.lineWidth = 5;
  g.beginPath();
  g.ellipse(280, 500, 120, 22, -0.2, 0, Math.PI * 2);
  g.stroke();
  // étoiles : une poussière fine et quelques grosses, avec halo en croix
  for (let i = 0; i < 1400; i++) {
    g.fillStyle = `rgba(255,255,255,${0.25 + Math.random() * 0.6})`;
    const r = Math.random() < 0.92 ? 1.2 : 2.2;
    g.fillRect(Math.random() * 2048, Math.random() * 600, r, r);
  }
  for (let i = 0; i < 28; i++) {
    const x = Math.random() * 2048;
    const y = Math.random() * 600;
    const col = ['#ffffff', '#ffd1a8', '#c8d8ff', '#ffe6ff'][i % 4];
    g.fillStyle = col;
    g.beginPath();
    g.arc(x, y, 2.6, 0, Math.PI * 2);
    g.fill();
    g.fillRect(x - 9, y - 0.8, 18, 1.6);
    g.fillRect(x - 0.8, y - 9, 1.6, 18);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Couche d'étoiles transparente qui défile lentement (parallaxe). */
function starDriftTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 300;
  const g = c.getContext('2d')!;
  for (let i = 0; i < 160; i++) {
    g.fillStyle = `rgba(220,230,255,${0.4 + Math.random() * 0.5})`;
    g.fillRect(Math.random() * 1024, Math.random() * 300, 2, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

/**
 * Interlude ch.0 → ch.1 : la Capsule de Service CS-07 (docs/INTERLUDE_VAISSEAU.md).
 * Vue de Gary, très serrée : un tableau de bord pour douze qui déborde du cadre,
 * un pare-brise panoramique (le seul truc bien fait) sur le ciel intersidéral et la faille,
 * le siège-carapace, B.O.B. sur les genoux. Boutons, levier et destinations : props
 * physiques en clic direct (un hotspot chacun, `pressable` = petit geste au clic).
 */
export const cockpit: RoomBuild = {
  camera: { pos: [0, 1.75, 4.6], look: [0, 1.45, 0], fov: 54 },
  shots: {
    pare_brise: { fill: 0.75 },
    tableau: { fill: 0.75, lift: 0.2 },
    contact: { fill: 0.5 },
    navigateur: { fill: 0.7 },
    reacteur: { fill: 0.55, lift: 0.3 },
    siege: { fill: 0.7, orbit: -8 },
  },
  intro: 'pare_brise',
  build(s) {
    s.lights({
      sky: '#d8c8ff',
      ground: '#0a0612',
      ambient: 0.85,
      key: { color: '#fff0d8', intensity: 1.5, pos: [-3, 6, 6], target: [0, 1, 0] },
      points: [
        { color: '#c77dff', intensity: 9, pos: [0, 2.6, 0.6], distance: 5 },
        { color: '#7fffd4', intensity: 3, pos: [2.5, 1.2, 2.2], distance: 4 },
      ],
      rim: { color: '#ff8ab8', intensity: 0.8, pos: [0, 4, -3] },
      fill: { color: '#6a8cff', intensity: 0.35, pos: [4, 2, 5] },
      fog: { color: '#0e0818', near: 5, far: 14 },
      vignette: { color: '#05020a', strength: 0.78, warm: '#c77dff14' },
    });

    // ── coque de la capsule : paroi du fond, plafond bas, joues obliques ──
    const back = s.fit([-200, -100, 1680, 620], 0);
    s.add(at(plane(back.w, back.h, '#2a2440'), back.x, back.y, 0));
    for (let i = -6; i <= 6; i++) s.add(at(box(0.05, back.h, 0.05, '#1a1628', { edges: false, shadow: false }), back.x + i * 0.9, back.y, 0.03));
    const ceilY = s.wallAt(640, -10, 1).y;
    const ceil = at(box(back.w, 0.1, 5, '#211c34'), back.x, ceilY, 2.5);
    s.add(ceil);
    for (const dir of [-1, 1]) {
      const cheek = at(box(0.1, back.h, 4, '#2f2846'), dir * back.w * 0.38, back.y, 2);
      cheek.rotation.y = dir * 0.5;
      s.add(cheek);
      // rivets
      for (let k = 0; k < 6; k++) s.add(at(sphere(0.04, '#8d86a8'), dir * back.w * 0.36, ceilY - 0.4 - k * 0.45, 1.4));
    }
    const pl = s.wallAt(230, 150, 0.05);
    s.add(at(label(tr('props.cockpit.plate'), 2.2, 0.5, { color: '#8d86a8', bold: true, bg: '#1d1830' }), pl.x, pl.y, 0.09));

    // ── pare-brise panoramique : ciel intersidéral, la faille au milieu ──
    const ws = s.fit(s.rect('pare_brise'), 0.05);
    const ft = ws.h * 0.07;
    const sky = at(new THREE.Mesh(new THREE.PlaneGeometry(ws.w - ft, ws.h - ft), new THREE.MeshBasicMaterial({ map: skyTexture(), toneMapped: false, fog: false })), ws.x, ws.y, 0.035);
    const drift = starDriftTexture();
    const stars = at(new THREE.Mesh(new THREE.PlaneGeometry(ws.w - ft, ws.h - ft), new THREE.MeshBasicMaterial({ map: drift, transparent: true, toneMapped: false, fog: false, depthWrite: false })), ws.x, ws.y, 0.038);
    const tex = riftTexture();
    const riftD = ws.h * 0.95;
    const rift = at(new THREE.Mesh(new THREE.PlaneGeometry(riftD, riftD), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, fog: false, depthWrite: false })), ws.x, ws.y, 0.042);
    const frame = new THREE.Group();
    frame.add(
      at(box(ws.w, ft, 0.2, '#5a5470'), 0, ws.h / 2 - ft / 2, 0),
      at(box(ws.w, ft * 1.4, 0.24, '#4a4460'), 0, -ws.h / 2 + ft * 0.7, 0),
      at(box(ft, ws.h, 0.2, '#5a5470'), -ws.w / 2 + ft / 2, 0, 0),
      at(box(ft, ws.h, 0.2, '#5a5470'), ws.w / 2 - ft / 2, 0, 0),
    );
    // deux montants : trois panneaux de verre, comme un vrai cockpit (le seul)
    for (const k of [-1, 1]) frame.add(at(box(ft * 0.55, ws.h, 0.16, '#5a5470'), k * ws.w * 0.31, 0, 0));
    // rivets du cadre
    for (let k = 0; k < 9; k++) frame.add(at(sphere(ft * 0.18, '#8d86a8'), -ws.w * 0.46 + k * ws.w * 0.115, ws.h / 2 - ft / 2, 0.11));
    // reflet sur la vitre
    const shine = at(plane(ws.w * 0.08, ws.h * 0.9, '#ffffff', { opacity: 0.06 }), -ws.w * 0.2, 0, 0.06);
    shine.rotation.z = -0.5;
    frame.add(shine);
    const wsGlow = at(glow('#c77dff', ws.w * 1.25, 0.32), ws.x, ws.y, 0.12);
    s.spot('pare_brise', sky, stars, rift, at(frame, ws.x, ws.y, 0.1), wsGlow);
    s.animate((t) => {
      tex.center.set(0.5, 0.5);
      tex.rotation = -t * 0.35;
      drift.offset.x = t * 0.004;
      wsGlow.material.opacity = 0.28 + Math.sin(t * 1.7) * 0.06;
    });

    // ── le drone porte-outils, plaqué au plafond ──
    const dr = s.wallAt(170, 40, 1.4);
    const drone = new THREE.Group();
    drone.add(at(box(0.7, 0.22, 0.45, '#ffb347'), 0, 0, 0), at(sphere(0.06, '#7fffd4', { glow: true }), 0.25, -0.02, 0.23));
    for (const [x, z] of [[-0.42, -0.25], [0.42, -0.25], [-0.42, 0.25], [0.42, 0.25]] as const) drone.add(at(cyl(0.16, 0.16, 0.03, '#3a3446', { edges: false }), x, 0.1, z));
    s.add(at(drone, dr.x, ceilY - 0.2, 1.4));
    s.animate((t) => (drone.position.y = ceilY - 0.2 + Math.sin(t * 2.1) * 0.02));

    // ── le tableau de bord : un pan incliné qui déborde du cadre ──
    const band = s.fit([-160, 205, 1600, 200], 1.25);
    const panel = new THREE.Group();
    panel.position.set(band.x, band.y, 1.25);
    panel.rotation.x = -0.42;
    s.add(panel);
    panel.add(at(box(band.w, band.h * 1.15, 0.24, '#353c4c'), 0, 0, -0.12));
    panel.add(at(box(band.w, 0.1, 0.34, '#1f2430'), 0, band.h * 0.58, -0.05));
    // écran central et fente CONTACT : zones réservées, aucun petit bouton ne mord dessus
    const sc = s.fitIn([548, 212, 264, 56], panel);
    const ct = s.fitIn(s.rect('contact'), panel);
    const keepOut = [sc, ct].map((r) => ({ x: r.x, y: r.y, hw: r.w / 2 + 0.14, hh: r.h / 2 + 0.1 }));
    const blocked = (x: number, y: number) => keepOut.some((k) => Math.abs(x - k.x) < k.hw && Math.abs(y - k.y) < k.hh);
    // soixante boutons, rangées régulières : sombres à l'arrêt, ils clignotent une fois le contact mis
    const COLORS = ['#ff4f5a', '#ffd166', '#7fffd4', '#3d7dd8', '#ff8c42', '#c77dff'];
    const lit: THREE.Mesh[] = [];
    for (let row = 0; row < 4; row++) {
      for (let i = 0; i < 15; i++) {
        const x = -band.w * 0.46 + i * (band.w * 0.92 / 14) + (row % 2) * 0.08;
        const y = band.h * 0.38 - row * band.h * 0.15;
        // laisse de la place aux gros boutons du centre
        if ((Math.abs(x) < band.w * 0.2 && row > 0) || blocked(x, y)) continue;
        const c = COLORS[(row * 7 + i * 3) % COLORS.length];
        panel.add(at(box(0.16, 0.1, 0.05, '#20242e', { edges: false }), x, y, 0.02));
        const b = at(box(0.12, 0.07, 0.04, c, { glow: true, edges: false }), x, y, 0.05);
        (b.material as THREE.MeshBasicMaterial).color.multiplyScalar(0.25);
        lit.push(b);
        panel.add(b);
      }
    }
    // gros boutons étiquetés : un hotspot chacun (clic direct = appuyer), le mesh suit son rect
    const BIG: [id: string, key: Parameters<typeof tr>[0], color: string, round: boolean][] = [
      ['bouton_npa', 'props.cockpit.dontPush', '#ff3344', true],
      ['bouton_hyper', 'props.cockpit.hyper', '#3d7dd8', false],
      ['bouton_eject', 'props.cockpit.eject', '#ff8c42', false],
      ['bouton_auto', 'props.cockpit.auto', '#7fffd4', false],
    ];
    for (const [id, key, color, round] of BIG) {
      const [rx, ry, rw] = s.rect(id);
      const f = s.fitIn([rx + rw / 2 - 50, ry + 4, 100, 68], panel);
      const cap = round ? at(cyl(f.h * 0.3, f.h * 0.36, 0.12, color, { seg: 20 }), 0, 0, 0) : at(box(f.w * 0.8, f.h * 0.5, 0.1, color), 0, 0, 0);
      if (round) cap.rotation.x = Math.PI / 2;
      const push = at(new THREE.Group().add(cap), f.x, f.y + f.h * (round ? 0.14 : 0.08), round ? 0.08 : 0.06);
      const tag = at(label(tr(key), f.w * 0.95, f.h * 0.34, { color: '#ffffff', bold: true, bg: '#14102a' }), f.x, f.y - f.h * 0.4, 0.03);
      s.spot(id, push, tag);
      s.spot('tableau', push, tag);
      pressable(s, id, push);
      panel.add(push, tag);
    }
    // quatorze leviers, dont le gris sans étiquette (le seul utile, hotspot `levier`)
    const levers: THREE.Group[] = [];
    const lv = s.fitIn(s.rect('levier'), panel);
    for (let i = 0; i < 14; i++) {
      const lever = new THREE.Group();
      const plain = i === 9;
      lever.add(at(cyl(plain ? 0.028 : 0.022, plain ? 0.028 : 0.022, plain ? 0.3 : 0.24, '#c9ced6', { edges: false }), 0, plain ? 0.15 : 0.12, 0), at(sphere(plain ? 0.07 : 0.055, plain ? '#8d93a0' : COLORS[i % COLORS.length]), 0, plain ? 0.31 : 0.25, 0));
      const x = plain ? lv.x : -band.w * 0.47 + i * (band.w * 0.94 / 13);
      lever.rotation.x = Math.PI / 2 + 0.5;
      levers.push(lever);
      if (!plain) {
        lever.position.set(x, -band.h * 0.55, 0.04);
        panel.add(lever);
        continue;
      }
      // pivot dédié (geste au clic) ; le levier lui-même suit iv_navigateur en douceur
      const pivot = at(new THREE.Group().add(lever), x, -band.h * 0.55, 0.04);
      const socle = at(box(0.2, 0.14, 0.04, '#20242e', { edges: false }), x, -band.h * 0.55, 0.02);
      s.spot('levier', pivot, socle);
      s.spot('tableau', pivot);
      pressable(s, 'levier', pivot, 'lever', 0.45);
      panel.add(pivot, socle);
    }
    // trois volants, dont un qui tourne tout seul (puis s'excuse)
    const wheels: THREE.Mesh[] = [];
    for (const px of [150, 490, 1130]) {
      const f = s.fitIn([px - 60, 345, 120, 60], panel);
      const w = at(torus(f.h * 0.55, 0.028, '#1f2430'), f.x, f.y, 0.16);
      wheels.push(w);
      panel.add(w);
    }
    // écran central : « BONJOUR, GARRY » au contact, veille sinon — cadre, dalle, texte centré avec marges
    panel.add(at(box(sc.w, sc.h, 0.05, '#1f2430'), sc.x, sc.y, 0.02));
    const glassOff = at(plane(sc.w * 0.92, sc.h * 0.78, '#0a0e14'), sc.x, sc.y, 0.05);
    const glassOn = at(plane(sc.w * 0.92, sc.h * 0.78, '#04140f'), sc.x, sc.y, 0.05);
    const screenOff = at(label(tr('props.cockpit.off'), sc.w * 0.8, sc.h * 0.52, { color: '#3a4a5a', bold: true }), sc.x, sc.y, 0.056);
    const screenOn = at(label(tr('props.cockpit.hello'), sc.w * 0.84, sc.h * 0.56, { color: '#7fffd4', bold: true }), sc.x, sc.y, 0.057);
    const screenGlow = at(glow('#7fffd4', sc.w * 1.1, 0.16), sc.x, sc.y, 0.07);
    panel.add(glassOff, glassOn, screenOff, screenOn, screenGlow);
    s.when(DARK, glassOff);
    s.when(CONTACT, glassOn, screenGlow);
    s.when(DARK, screenOff);
    s.when(CONTACT, screenOn);
    s.animate((t) => {
      const on = s.is(CONTACT);
      lit.forEach((b, i) => {
        const m = b.material as THREE.MeshBasicMaterial;
        const k = on ? (Math.sin(t * (2 + (i % 5)) + i) > -0.3 ? 1 : 0.35) : 0.22;
        m.opacity = 1;
        m.color.set(COLORS[i % COLORS.length]).multiplyScalar(k);
      });
      if (on) wheels[1].rotation.z = Math.sin(t * 0.8) * 0.4;
      // levier gris : bien dressé avant, rabattu une fois tiré (lisible depuis la caméra)
      const want = Math.PI / 2 + (s.is(NAV) ? 1.25 : -0.35);
      levers[9].rotation.x += (want - levers[9].rotation.x) * 0.12;
    });

    // ── fente « CONTACT » ──
    const slot = new THREE.Group();
    slot.add(at(box(ct.w * 0.8, ct.h * 0.5, 0.08, '#14102a'), 0, 0, 0), at(box(ct.w * 0.55, ct.h * 0.07, 0.1, '#000000', { edges: false }), 0, ct.h * 0.05, 0.01));
    slot.add(at(label(tr('props.cockpit.contact'), ct.w * 0.75, ct.h * 0.18, { color: '#ffd166', bold: true }), 0, -ct.h * 0.17, 0.05));
    const card = at(box(ct.w * 0.45, ct.h * 0.35, 0.02, '#e0e0e0'), 0, ct.h * 0.2, 0.06);
    const led = at(sphere(0.04, '#7fffd4', { glow: true }), ct.w * 0.33, ct.h * 0.15, 0.06);
    slot.add(card, led);
    s.when(CONTACT, card, led);
    s.spot('contact', at(slot, ct.x, ct.y, 0.04));
    panel.add(slot);

    // ── navigateur dimensionnel (déplié après le levier) : une ligne tactile par destination ──
    // posé devant le haut du tableau de bord (z 1.5) : rien ne le masque
    const NZ = 1.5;
    const nv = s.fit(s.rect('navigateur'), NZ);
    const nav = new THREE.Group();
    nav.add(at(box(nv.w, nv.h, 0.1, '#1f2430'), 0, 0, 0));
    const header = at(label(tr('props.cockpit.nav'), nv.w * 0.9, nv.h * 0.15, { color: '#ffd166', bold: true, bg: '#0a1414' }), 0, nv.h * 0.4, 0.06);
    const accepted = at(label(tr('props.cockpit.accepted'), nv.w * 0.9, nv.h * 0.15, { color: '#07050f', bg: '#7fffd4', bold: true }), 0, nv.h * 0.4, 0.07);
    nav.add(header, accepted);
    s.when({ notFlags: ['iv_destination'] }, header);
    s.when(GO, accepted);
    s.spot('navigateur', at(nav, nv.x, nv.y, NZ));
    const DEST: [id: string, key: Parameters<typeof tr>[0]][] = [
      ['dest_miniature', 'props.cockpit.destMini'],
      ['dest_klepsydra', 'props.cockpit.destKlepsydra'],
      ['dest_yaourt', 'props.cockpit.destYaourt'],
      ['dest_station', 'props.cockpit.destStation'],
    ];
    for (const [id, key] of DEST) {
      const r = s.fit(s.rect(id), NZ + 0.06);
      const station = id === 'dest_station';
      const row = at(label(tr(key), r.w * 0.94, r.h * 0.8, { color: station ? '#7fffd4' : '#5f8a80', bg: station ? '#06241c' : '#04140f', align: 'left', bold: station }), r.x, r.y, NZ + 0.06);
      s.spot(id, row);
      s.spot('navigateur', row);
      pressable(s, id, row, 'button', -0.03);
    }

    // ── réceptacle « IMPROBABILITÉ (OPTIONNEL) » ──
    const rc = s.fit(s.rect('reacteur'), 2.2);
    const cup = new THREE.Group();
    cup.add(at(cyl(rc.h * 0.32, rc.h * 0.26, rc.h * 0.3, '#3a3446', { seg: 20 }), 0, 0, 0));
    const well = at(cyl(rc.h * 0.25, rc.h * 0.25, 0.02, '#b56cff', { glow: true, seg: 20, edges: false }), 0, rc.h * 0.16, 0);
    cup.add(well, at(label(tr('props.cockpit.receptacle'), rc.w * 0.95, rc.h * 0.3, { color: '#ffffff', bold: true }), 0, -rc.h * 0.32, rc.h * 0.33));
    const cupGlow = at(glow('#c77dff', rc.w * 1.4, 0.5), rc.x, rc.y + rc.h * 0.1, 2.3);
    s.spot('reacteur', at(cup, rc.x, rc.y, 2.2), cupGlow);
    s.animate((t) => (cupGlow.material.opacity = 0.35 + Math.sin(t * 3) * 0.15));

    // ── siège-carapace (GenAI) : Gary y enfile la Mue Sacrée (useItem combi sur le siège) ──
    // posé en avant-plan (devant le pan du tableau de bord), pied bien au-dessus de la barre d'inventaire
    const st = s.fit(s.rect('siege'), 2.3);
    const seatH = Math.min(st.h, st.w / SIEGE_CARAPACE_ASPECT);
    s.spot('siege', at(billboard(SIEGE_CARAPACE_URL, seatH, SIEGE_CARAPACE_ASPECT, { tint: '#f2e4ff', shadow: 0 }), st.x, st.y - st.h / 2, st.z));

    // ── B.O.B., sur les genoux de Gary, le porte-gobelet sur la tête ──
    // face caméra (¾ vers le centre de la cabine) et cabré vers l'objectif (caméra plongeante)
    // pour que les yeux restent bien au-dessus du HUD
    const { robot, stand: bb } = bobSpot(s, { scale: 0.78, tilt: -0.28 });
    const cupHolder = at(cyl(bb.w * 0.1, bb.w * 0.08, bb.w * 0.12, '#c9ced6', { seg: 14 }), 0, bb.w * 0.27, 0);
    robot.add(cupHolder);
    s.animate((t) => (robot.position.y = Math.abs(Math.sin(t * 1.4)) * 0.015));
    s.add(at(pool('#c77dff', bb.w * 1.6, bb.w, 0.18), bb.x, 0.01, bb.z));
  },
};
