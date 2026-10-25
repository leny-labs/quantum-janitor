import * as THREE from 'three';
import { at, box, cyl, glow, label, mat, neon, plane, pool, sphere, starTexture, stripeTexture, torus } from '../kit';
import { bob, fusible } from '../props';
import type { RoomBuild } from './index';
import { against, backDoor, pipe, shell, wallPanels } from './shell';

const POWER_OFF = { flags: ['fusible_retire'] };
const POWER_ON = { notFlags: ['fusible_retire'] };

/** Couloir de service C : bleu acier, néon au plafond, vue sur le vide. */
export const couloir: RoomBuild = {
  camera: { pos: [-1.2, 2.1, 8], look: [0.3, 1.85, 0], fov: 50 },
  build(s) {
    shell(s, {
      floor: { a: '#1c2131', b: '#232a3d', joint: '#0f121b', tile: 1 },
      wall: { top: '#3a4668', bottom: '#222a3e' },
      trim: '#151a28',
    });
    wallPanels(s, '#1d2436', -9, 9, 2.1, 8);
    // bande de signalisation au sol, le long du mur
    const stripe = plane(30, 0.35, '#ffffff', { map: stripeTexture('#ffd166', '#1c2131', 6) });
    (stripe.material as THREE.MeshToonMaterial).map!.repeat.set(40, 1);
    stripe.rotation.x = -Math.PI / 2;
    s.add(at(stripe, 0, 0.005, 0.5));
    // bandeau mural à mi-hauteur
    s.add(at(box(30, 0.12, 0.06, '#3a4260', { edges: false }), 0, 1.15, 0.03));
    pipe(s, 0.55, 0.18, -12, 12, 0.1, '#525e7a');

    s.lights({
      sky: '#c8dcff',
      ground: '#151a28',
      ambient: 1.2,
      key: { color: '#e6f0ff', intensity: 2.3, pos: [-4, 10, 7], target: [1, 0, 0] },
      rim: { color: '#ff5c9a', intensity: 1.0, pos: [6, 5, -4] },
      fill: { color: '#6a8cff', intensity: 0.4, pos: [6, 3, 6] },
      fog: { color: '#151a2c', near: 7, far: 26 },
      vignette: { color: '#0a0c1c', strength: 0.7, warm: '#9fd8ff1c' },
    });

    // néon du plafond : bleu, ou rouge de secours sans le fusible
    const railY = s.wallAt(640, 36, 0.2).y;
    s.add(at(box(40, 0.22, 0.2, '#3a4260', { edges: false }), 0, railY + 0.08, 0.1));
    const neonOn = at(box(40, 0.07, 0.08, '#9fd8ff', { glow: true }), 0, railY - 0.06, 0.2);
    const neonOff = at(box(40, 0.07, 0.08, '#ff5c7a', { glow: true }), 0, railY - 0.06, 0.2);
    const lightOn = new THREE.PointLight('#9fd8ff', 22, 14, 1.4);
    lightOn.position.set(0, 3, 4);
    const lightOff = new THREE.PointLight('#ff3355', 26, 14, 1.4);
    lightOff.position.set(0, 3, 4);
    // reflets du néon sur le sol carrelé, bleus ou rouges selon le courant
    const shineOn = at(pool('#9fd8ff', 22, 2.6, 0.22), 0, 0.012, 1.6);
    const shineOff = at(pool('#ff3355', 22, 2.6, 0.2), 0, 0.012, 1.6);
    s.when(POWER_ON, neonOn, lightOn, shineOn).when(POWER_OFF, neonOff, lightOff, shineOff);

    // enseigne néon sur le circuit 7B (« éclairage d'ambiance ») : s'éteint avec le fusible
    const bf = s.fit([470, 92, 200, 62], 0.06);
    const motto = at(neon('BONHEUR\nOBLIGATOIRE', bf.w, bf.h, '#ff5c9a', { plate: '#120818' }), bf.x, bf.y, 0.06);
    const mottoGlow = at(pool('#ff5c9a', bf.w * 1.9, bf.h * 2.6, 0.15), bf.x, bf.y, 0.035);
    mottoGlow.rotation.x = 0;
    const mottoDead = at(neon('BONHEUR\nOBLIGATOIRE', bf.w, bf.h, '#4a2a44', { plate: '#120818', off: true }), bf.x, bf.y, 0.06);
    s.when(POWER_ON, motto, mottoGlow).when(POWER_OFF, mottoDead);
    s.animate((t) => {
      motto.material.opacity = Math.sin(t * 0.7 + 1) > 0.99 ? 0.4 : 0.95 + Math.sin(t * 27) * 0.04;
    });
    s.animate((t) => {
      if (s.is(POWER_OFF)) lightOff.intensity = 18 + Math.max(0, Math.sin(t * 3)) * 16;
    });

    // ── distributeur ──
    const ds = s.stand(s.rect('distributeur'));
    const dw = ds.w * 0.9;
    const dd = 1.1;
    const vend = new THREE.Group();
    vend.add(at(box(dw, ds.h, dd, '#8a2b3c'), 0, ds.h / 2, 0));
    vend.add(at(box(dw * 1.02, ds.h * 0.08, dd * 1.04, '#5e1d2a'), 0, ds.h * 0.96, 0));
    const glassW = dw * 0.72;
    const glassH = ds.h * 0.55;
    const glassY = ds.h * 0.6;
    // vitrine en saillie : fond sombre, spirales et sandwich devant, vitre par-dessus
    const G = dd / 2;
    vend.add(at(box(glassW, glassH, 0.04, '#16314a', { glow: true }), -dw * 0.05, glassY, G + 0.02));
    for (const [x, y, w, h] of [
      [0, glassH / 2, glassW + 0.08, 0.04],
      [0, -glassH / 2, glassW + 0.08, 0.04],
      [-glassW / 2, 0, 0.04, glassH],
      [glassW / 2, 0, 0.04, glassH],
    ]) vend.add(at(box(w, h, 0.32, '#5e1d2a'), -dw * 0.05 + x, glassY + y, G + 0.16));
    const glassOn = at(plane(glassW * 0.96, glassH * 0.96, '#9fd8ff', { glow: true, opacity: 0.18 }), -dw * 0.05, glassY, G + 0.3);
    s.when(POWER_ON, glassOn);
    vend.add(glassOn);
    // spirales
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const coil = at(torus(glassW * 0.1, 0.012, '#c9ced6'), -dw * 0.05 + (col - 1) * glassW * 0.3, glassY + glassH * 0.3 - row * glassH * 0.3 - glassH * 0.08, G + 0.12);
        vend.add(coil);
      }
    }
    // le sandwich coincé
    const sandwich = new THREE.Group();
    const sw = glassW * 0.22;
    sandwich.add(at(box(sw, sw * 0.18, sw * 0.7, '#e3c178'), 0, sw * 0.18, 0));
    sandwich.add(at(box(sw * 0.96, sw * 0.12, sw * 0.68, '#8fae3a', { edges: false }), 0, sw * 0.03, 0));
    sandwich.add(at(box(sw, sw * 0.18, sw * 0.7, '#e3c178'), 0, -sw * 0.12, 0));
    sandwich.rotation.z = 0.35;
    sandwich.position.set(-dw * 0.05, glassY - glassH * 0.02, G + 0.14);
    vend.add(sandwich);
    s.when({ notFlags: ['sandwich_tombe'] }, sandwich);
    vend.add(at(box(dw * 0.18, ds.h * 0.32, 0.06, '#2a2a2a'), dw * 0.39, glassY, dd / 2));
    for (let i = 0; i < 6; i++) vend.add(at(sphere(0.035, i % 2 ? '#ffd166' : '#ffffff', { glow: true }), dw * 0.36 + (i % 2) * 0.07, glassY + 0.35 - Math.floor(i / 2) * 0.13, dd / 2 + 0.04));
    vend.add(at(box(dw * 0.5, ds.h * 0.07, 0.1, '#111111'), -dw * 0.05, ds.h * 0.16, dd / 2));
    const header = at(label("DISTRIB'Ô-MATIC 3000", dw * 0.9, ds.h * 0.07, { color: '#ffffff', bold: true }), 0, ds.h * 0.25, dd / 2 + 0.01);
    s.when(POWER_ON, header);
    vend.add(header);
    s.spot('distributeur', at(vend, ds.x, 0, against(ds.z, dd)));

    // ── boîte à fusibles ──
    const fb = s.fit(s.rect('fusibles'), 0.25);
    const fuseBox = new THREE.Group();
    fuseBox.add(at(box(fb.w * 0.9, fb.h * 0.9, 0.4, '#5b5f6b'), 0, 0, 0));
    fuseBox.add(at(box(fb.w * 0.92, 0.06, 0.42, '#ffd166', { edges: false }), 0, fb.h * 0.45, 0));
    fuseBox.add(at(label("⚡ CIRCUIT 7B\nDistributeur & éclairage\nd'ambiance", fb.w * 0.8, fb.h * 0.4, { color: '#ffd166', bold: true }), 0, fb.h * 0.17, 0.21));
    const socket = at(box(fb.w * 0.36, fb.h * 0.18, 0.05, '#111111', { edges: false }), 0, -fb.h * 0.22, 0.2);
    fuseBox.add(socket);
    const fuse = at(fusible(fb.w * 0.3), 0, -fb.h * 0.22, 0.28);
    fuseBox.add(fuse);
    s.when(POWER_ON, fuse);
    // porte ouverte de la boîte
    const lid = at(box(fb.w * 0.9, fb.h * 0.9, 0.04, '#6b707d'), fb.w * 0.45 + 0.02, 0, 0.2 + fb.w * 0.3);
    lid.rotation.y = -1.25;
    lid.position.x = fb.w * 0.45 + Math.cos(1.25) * fb.w * 0.45;
    lid.position.z = 0.2 + Math.sin(1.25) * fb.w * 0.45;
    fuseBox.add(lid);
    s.spot('fusibles', at(fuseBox, fb.x, fb.y, 0.25));

    // ── hublot ──
    const hb = s.fit(s.rect('hublot'), 0.05);
    const stars = starTexture(11, 512, 320, { x: 0.86, y: 0.79, r: 0.09, color: '#d97a3a' });
    stars.wrapS = THREE.RepeatWrapping;
    const sky = at(plane(hb.w * 0.92, hb.h * 0.9, '#ffffff', { glow: true, map: stars }), hb.x, hb.y, 0.04);
    const t = hb.h * 0.1;
    const frame = new THREE.Group();
    frame.add(
      at(box(hb.w, t, 0.3, '#9aa5b1'), 0, hb.h / 2 - t / 2, 0),
      at(box(hb.w, t, 0.3, '#9aa5b1'), 0, -hb.h / 2 + t / 2, 0),
      at(box(t, hb.h, 0.3, '#9aa5b1'), -hb.w / 2 + t / 2, 0, 0),
      at(box(t, hb.h, 0.3, '#9aa5b1'), hb.w / 2 - t / 2, 0, 0),
    );
    for (const [bx, by] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) frame.add(at(sphere(t * 0.22, '#5a6470'), bx * (hb.w / 2 - t / 2), by * (hb.h / 2 - t / 2), 0.16));
    const sheen = at(plane(hb.w * 0.2, hb.h * 0.9, '#ffffff', { glow: true, opacity: 0.07 }), hb.x - hb.w * 0.15, hb.y, 0.08);
    sheen.rotation.z = -0.4;
    s.spot('hublot', sky, at(frame, hb.x, hb.y, 0.15), sheen);
    s.animate((time) => {
      stars.offset.x = time * 0.004;
    });

    // ── compteur « jours sans incident » ──
    const cp = s.fit(s.rect('compteur'), 0.1);
    s.spot(
      'compteur',
      at(box(cp.w * 0.95, cp.h * 0.85, 0.12, '#111111'), cp.x, cp.y, 0.06),
      at(label("KLEPSYDRA-9\n0098 JOURS SANS INCIDENT\nD'IMPROBABILITÉ", cp.w * 0.9, cp.h * 0.78, { color: '#7fffd4', bold: true, mono: true }), cp.x, cp.y, 0.13),
    );

    // ── porte du labo ──
    const { door: labDoor, f: lf } = backDoor(s, [1000, 120, 170, 350], 0.12, '#2f3a55', '#3d4a6b');
    const closed = new THREE.Group();
    closed.add(at(new THREE.Mesh(new THREE.PlaneGeometry(lf.w * 0.84, lf.h * 0.12), mat('#ffffff', { map: stripeTexture('#ffd166', '#2a2a2a', 6) })), 0, -lf.h * 0.38, 0.01));
    closed.add(at(label('LABO\nRÉACTEUR\n☢ ACCÈS\nRESTREINT', lf.w * 0.8, lf.h * 0.4, { color: '#ffd166', bold: true }), 0, lf.h * 0.18, 0.01));
    closed.add(at(box(0.02, lf.h * 0.9, 0.02, '#1d2436', { edges: false }), 0, -lf.h * 0.04, 0.01));
    closed.position.set(lf.x, lf.y, 0.13);
    const open = new THREE.Group();
    open.add(at(plane(lf.w * 0.84, lf.h * 0.92, '#140c26', { glow: true }), 0, -lf.h * 0.04, 0.02));
    open.add(at(glow('#b06cff', lf.w * 1.4, 0.45), 0, -lf.h * 0.1, 0.1));
    open.position.set(lf.x, lf.y, 0.13);
    const spill = new THREE.PointLight('#b06cff', 20, 6, 1.5);
    spill.position.set(lf.x, 1.6, 1.2);
    s.when({ notFlags: ['labo_ouvert'] }, closed).when({ flags: ['labo_ouvert'] }, open, spill);
    s.add(labDoor);
    const lamp = at(cyl(0.12, 0.12, 0.08, '#ff5c7a', { glow: true }), lf.x, lf.y + lf.h / 2 + 0.2, 0.2);
    lamp.rotation.x = Math.PI / 2;
    s.add(lamp);
    s.animate((time) => {
      (lamp.material as THREE.MeshBasicMaterial).color.set(s.is({ flags: ['labo_ouvert'] }) ? '#7fffd4' : Math.sin(time * 4) > 0 ? '#ff5c7a' : '#5a1f2b');
    });

    // ── lecteur de badge ──
    const lc = s.fit(s.rect('lecteur'), 0.12);
    const reader = new THREE.Group();
    reader.add(at(box(lc.w * 0.7, lc.h * 0.82, 0.14, '#2a2a2a'), 0, 0, 0));
    reader.add(at(box(lc.w * 0.5, lc.h * 0.12, 0.02, '#111111', { edges: false }), 0, lc.h * 0.28, 0.08));
    const slime = new THREE.Group();
    for (const [sx, sy, r] of [[0, 0, 0.16], [-0.06, -0.12, 0.1], [0.07, 0.1, 0.09], [0.03, -0.24, 0.05]]) {
      const blob = at(sphere(lc.w * r * 1.6, '#7fbf3f', { seg: 10 }), sx * lc.w, sy * lc.h, 0.08);
      blob.scale.z = 0.35;
      slime.add(blob);
    }
    const ledClean = at(torus(lc.w * 0.13, lc.w * 0.03, '#7fffd4', { glow: true }), 0, -lc.h * 0.05, 0.08);
    reader.add(slime, ledClean);
    s.when({ notFlags: ['lecteur_propre'] }, slime).when({ flags: ['lecteur_propre'] }, ledClean);
    s.spot('lecteur', at(reader, lc.x, lc.y, 0.12));

    // ── porte vers le placard ──
    const { f: pf } = backDoor(s, s.rect('vers_placard'), 0.12, '#2a3148', '#3b4560');
    s.add(at(label('ENTRETIEN', pf.w * 0.8, pf.h * 0.1, { color: '#7fffd4', bold: true }), pf.x, pf.y + pf.h * 0.25, 0.14));

    // ── B.O.B. (s'il suit Gary) ──
    const bb = s.stand(s.rect('bob'));
    const robot = at(bob(bb.w * 0.75), bb.x, 0, bb.z, -0.3);
    s.spot('bob', robot);
    s.animate((time) => {
      robot.rotation.y = -0.3 + Math.sin(time * 0.7) * 0.15;
    });
  },
};
