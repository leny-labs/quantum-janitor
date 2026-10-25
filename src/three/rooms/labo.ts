import * as THREE from 'three';
import type { Condition } from '../../engine/types';
import { at, box, cyl, glow, label, mat, plane, sphere, stripeTexture, torus } from '../kit';
import { bob, mug } from '../props';
import type { RoomBuild } from './index';
import { against, backDoor, pipe, shell, wallPanels } from './shell';

const FULL = { flags: ['refroidissement_verse'] };
const POWERED = { flags: ['panneau_allume'] };

/** Laboratoire du Réacteur : violet, halo d'improbabilité, plafond invisible. */
export const labo: RoomBuild = {
  camera: { pos: [0, 2.0, 9], look: [0, 1.85, 0], fov: 50 },
  build(s) {
    shell(s, {
      floor: { a: '#191127', b: '#21173a', joint: '#0c0815', tile: 1.1 },
      wall: { top: '#3a2766', bottom: '#1c1430' },
      trim: '#120d20',
    });
    wallPanels(s, '#2a1d4a', -10, 10, 2.4, 9);
    pipe(s, 0.6, 0.2, -12, 12, 0.14, '#4d3a7a');

    s.lights({
      sky: '#e0c8ff',
      ground: '#120d20',
      ambient: 1.1,
      key: { color: '#f3e8ff', intensity: 2.2, pos: [5, 11, 8], target: [-1, 0, 1] },
      points: [{ color: '#b06cff', intensity: 40, pos: [0, 2.5, 3.6], distance: 14 }],
    });

    // bandeau d'avertissement en haut du mur
    const warn = s.fit([330, 18, 860, 28], 0.05);
    s.add(
      at(box(warn.w * 1.04, warn.h * 1.5, 0.06, '#2a1d4a', { edges: false }), warn.x, warn.y, 0.03),
      at(label("☢  ZONE D'IMPROBABILITÉ — PORT DU CASQUE CONSEILLÉ (CASQUE NON FOURNI)", warn.w, warn.h, { color: '#ffd166', bold: true }), warn.x, warn.y, 0.07),
    );

    // ── réacteur ──
    const rs = s.stand(s.rect('reacteur'));
    const w = rs.w * 0.95;
    const h = rs.h;
    const reactor = new THREE.Group();
    reactor.add(at(cyl(w * 0.5, w * 0.54, h * 0.06, '#2a1d4a', { seg: 16 }), 0, h * 0.03, 0));
    reactor.add(at(cyl(w * 0.42, w * 0.46, h * 0.06, '#3a2a66', { seg: 16 }), 0, h * 0.09, 0));
    const colH = h * 0.68;
    const colY = h * 0.12 + colH / 2;
    const column = at(cyl(w * 0.27, w * 0.27, colH, '#b06cff', { glow: true, opacity: 0.45, seg: 20 }), 0, colY, 0);
    reactor.add(column);
    const core = at(cyl(w * 0.08, w * 0.08, colH * 0.95, '#f0dcff', { glow: true, seg: 10 }), 0, colY, 0);
    reactor.add(core);
    const coolant = at(cyl(w * 0.25, w * 0.25, colH * 0.5, '#7fbf3f', { glow: true, opacity: 0.55, seg: 20 }), 0, h * 0.12 + colH * 0.25, 0);
    reactor.add(coolant);
    s.when(FULL, coolant);
    const rings = [0.3, 0.55, 0.8].map((f, i) => {
      const ring = at(torus(w * 0.33, w * 0.025, i === 1 ? '#ffd166' : '#d6b8ff'), 0, h * 0.12 + colH * f, 0);
      ring.rotation.x = Math.PI / 2;
      reactor.add(ring);
      return ring;
    });
    // orbes (positions reprises du croquis 2D)
    const orbs = (
      [
        [170, '#ffffff', 26],
        [270, '#ffd166', 18],
        [360, '#7fffd4', 30],
      ] as const
    ).map(([sy, color, r]) => {
      const p = s.wallAt(640, sy, rs.z);
      const orb = at(sphere((w * r) / 260, color, { glow: true, seg: 14 }), 0, p.y, 0);
      reactor.add(orb, at(glow(color, (w * r) / 70, 0.5), 0, p.y, 0));
      return orb;
    });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      reactor.add(at(box(w * 0.06, colH, w * 0.06, '#2a1d4a'), Math.cos(a) * w * 0.38, colY, Math.sin(a) * w * 0.38));
    }
    const capY = h * 0.12 + colH;
    reactor.add(at(cyl(w * 0.44, w * 0.4, h * 0.08, '#3a2a66', { seg: 16 }), 0, capY + h * 0.04, 0));
    reactor.add(at(cyl(w * 0.2, w * 0.3, h * 0.07, '#2a1d4a', { seg: 16 }), 0, capY + h * 0.115, 0));
    const leds = [-1, 1].map((sx) => {
      const led = at(sphere(w * 0.05, '#ff5c7a', { glow: true }), sx * w * 0.3, capY + h * 0.09, w * 0.2);
      const halo = at(glow('#ff5c7a', w * 0.3, 0.5), sx * w * 0.3, capY + h * 0.09, w * 0.22);
      reactor.add(led, halo);
      return { led, halo };
    });
    reactor.add(at(label('Mk IV', w * 0.34, h * 0.04, { color: '#ffffff', bold: true, bg: '#2a1d4a' }), 0, h * 0.09, w * 0.46 + 0.01));
    const glou = at(label('glou… glou…', w * 0.7, h * 0.06, { color: '#b6ff6a', bold: true, bg: '#120d20' }), 0, h * 0.55, w * 0.5);
    reactor.add(glou);
    s.when(FULL, glou);
    const aura = at(glow('#b06cff', w * 3.2, 0.35), 0, colY, -w * 0.6);
    reactor.add(aura);
    // étincelles qui montent dans la colonne (plus nombreuses et vertes une fois refroidi)
    const moteBottom = h * 0.14;
    const moteRange = colH * 0.92;
    const motes = Array.from({ length: 16 }, (_, i) => {
      const m = glow('#ffffff', w * 0.09, 0);
      const a = i * 2.4;
      const r = w * (0.1 + ((i * 7) % 5) * 0.03);
      reactor.add(m);
      return { m, a, r, speed: 0.12 + ((i * 5) % 7) * 0.025, phase: (i * 0.618) % 1 };
    });
    s.spot('reacteur', at(reactor, rs.x, 0, rs.z));
    // conduits vers le plafond
    for (const sx of [-1, 1]) s.add(at(cyl(w * 0.06, w * 0.06, 6, '#4d3a7a'), rs.x + sx * w * 0.12, capY + h * 0.15 + 3, rs.z - 0.2));
    // anneau de sécurité au sol
    const hazard = new THREE.Mesh(new THREE.RingGeometry(w * 0.62, w * 0.78, 40), mat('#ffffff', { map: stripeTexture('#ffd166', '#191127', 16) }));
    hazard.rotation.x = -Math.PI / 2;
    hazard.position.set(rs.x, 0.006, rs.z);
    hazard.receiveShadow = true;
    (hazard.material as THREE.Material).transparent = true;
    s.add(hazard);
    const coreMat = core.material as THREE.MeshBasicMaterial;
    const coreHot = new THREE.Color('#ffffff');
    const coreDim = new THREE.Color('#b06cff');
    const columnMat = column.material as THREE.MeshBasicMaterial;
    const auraMat = aura.material as THREE.SpriteMaterial;
    const hazardMat = hazard.material as THREE.Material;
    const moteColor = new THREE.Color();
    const moteViolet = new THREE.Color('#e6c8ff');
    const moteGreen = new THREE.Color('#b6ff6a');
    const ledRed = new THREE.Color('#ff5c7a');
    s.animate((t) => {
      rings.forEach((r, i) => (r.rotation.z = t * (0.6 + i * 0.35) * (i % 2 ? -1 : 1)));
      orbs.forEach((o, i) => o.scale.setScalar(1 + Math.sin(t * 2.2 + i * 1.7) * 0.12));
      core.scale.x = core.scale.z = 1 + Math.sin(t * 9) * 0.15;
      // le cœur respire : lent souffle + petit frisson rapide
      const breath = 0.5 + 0.5 * Math.sin(t * 2.4);
      const flicker = 0.5 + 0.5 * Math.sin(t * 17.3) * Math.sin(t * 5.1);
      coreMat.color.copy(coreDim).lerp(coreHot, 0.55 + breath * 0.35 + flicker * 0.1);
      columnMat.opacity = 0.3 + breath * 0.25;
      auraMat.opacity = 0.22 + breath * 0.22;
      // anneaux : un sur deux pulse en décalage
      rings.forEach((r, i) => r.scale.setScalar(1 + Math.sin(t * 3 + (i % 2) * Math.PI) * 0.05));
      // étincelles
      const full = coolant.visible;
      const count = full ? 16 : 10;
      moteColor.copy(full ? moteGreen : moteViolet);
      motes.forEach(({ m, a, r, speed, phase }, i) => {
        m.visible = i < count;
        if (!m.visible) return;
        const k = (t * speed * (full ? 1.4 : 1) + phase) % 1;
        const ang = a + t * 0.8 + k * 3;
        m.position.set(Math.cos(ang) * r, moteBottom + k * moteRange, Math.sin(ang) * r);
        const sm = m.material as THREE.SpriteMaterial;
        sm.color.copy(moteColor);
        sm.opacity = Math.sin(k * Math.PI) * 0.9;
        m.scale.setScalar(w * (0.06 + 0.05 * Math.sin(k * Math.PI)));
      });
      // anneau de sécurité : rotation lente + pulse
      hazard.rotation.z = t * 0.12;
      hazardMat.opacity = 0.78 + 0.22 * Math.sin(t * 1.6);
      // leds du chapeau : clignotement asynchrone
      leds.forEach(({ led, halo }, i) => {
        const on = Math.sin(t * (1.3 + i * 0.47) + i * 2.1) > 0.35 ? 1 : 0.25;
        (led.material as THREE.MeshBasicMaterial).color.copy(ledRed).multiplyScalar(on);
        (halo.material as THREE.SpriteMaterial).opacity = on * 0.6;
      });
      glou.position.y = h * 0.55 + Math.abs(Math.sin(t * 3)) * 0.06;
    });

    // ── trappe de refroidissement ──
    const tr = s.stand(s.rect('trappe'));
    const tw = tr.w * 0.9;
    const th = tr.h * 0.75;
    const hatch = new THREE.Group();
    hatch.add(at(box(tw, th, 0.9, '#3a3f55'), 0, th / 2, 0));
    hatch.add(at(cyl(tw * 0.32, tw * 0.18, th * 0.25, '#4a5070', { seg: 14 }), 0, th + th * 0.12, 0));
    const lidClosed = at(cyl(tw * 0.34, tw * 0.34, 0.06, '#7fffd4', { seg: 14 }), 0, th + th * 0.26, 0);
    const lidOpen = at(cyl(tw * 0.34, tw * 0.34, 0.06, '#7fffd4', { seg: 14 }), -tw * 0.3, th + th * 0.5, 0);
    lidOpen.rotation.z = 1.2;
    hatch.add(lidClosed, lidOpen);
    s.when({ notFlags: ['panneau_allume'] }, lidClosed).when(POWERED, lidOpen);
    hatch.add(at(label('REFROIDISSEMENT\n(admission)', tw * 0.9, th * 0.32, { color: '#7fffd4', bold: true }), 0, th * 0.72, 0.46));
    const status: [Condition, string, string][] = [
      [{ notFlags: ['panneau_allume'] }, 'VERROUILLÉ', '#ff5c7a'],
      [{ flags: ['panneau_allume'], notFlags: ['refroidissement_verse'] }, 'OUVERT — VIDE 0 %', '#ffd166'],
      [FULL, 'PLEIN 100 %', '#7fbf3f'],
    ];
    for (const [cond, text, color] of status) {
      const l = at(label(text, tw * 0.9, th * 0.18, { color, bold: true, bg: '#14161f' }), 0, th * 0.35, 0.46);
      hatch.add(l);
      s.when(cond, l);
    }
    s.spot('trappe', at(hatch, tr.x, 0, against(tr.z, 0.9)));
    // conduit trappe → réacteur
    const duct = at(cyl(0.12, 0.12, Math.abs(tr.x - rs.x) - w * 0.3, '#4a5070'), (tr.x + rs.x) / 2 + w * 0.1, 0.5, tr.z - 0.6);
    duct.rotation.z = Math.PI / 2;
    s.add(duct);

    // ── tableau blanc ──
    const tb = s.fit(s.rect('tableau'), 0.06);
    s.spot(
      'tableau',
      at(box(tb.w, tb.h, 0.08, '#888888'), tb.x, tb.y, 0.04),
      at(
        label("I = P⁻¹ × café\n\nNE JAMAIS VERSER\nDE LIQUIDE NON\nRÉGLEMENTAIRE !!!\n— Dr Halvorsen  :'(", tb.w * 0.94, tb.h * 0.9, { color: '#333366', bg: '#eeeeee', bold: true, lit: true }),
        tb.x,
        tb.y,
        0.09,
      ),
      at(box(tb.w * 0.6, 0.06, 0.15, '#666666'), tb.x, tb.y - tb.h / 2 - 0.03, 0.12),
      at(cyl(0.025, 0.025, 0.25, '#d62839', { edges: false }), tb.x + tb.w * 0.1, tb.y - tb.h / 2 + 0.01, 0.14),
    );

    // ── bureau des scientifiques ──
    const bs = s.stand(s.rect('bureau'));
    const deskZ = against(bs.z, 1.1);
    const topY = s.wallAt(1100, 380, bs.z).y;
    const desk = new THREE.Group();
    desk.add(at(box(bs.w * 0.86, 0.08, 1.1, '#6b4e2e'), 0, topY - 0.04, 0));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) desk.add(at(box(0.08, topY - 0.08, 0.08, '#4a3520'), sx * bs.w * 0.4, (topY - 0.08) / 2, sz * 0.48));
    desk.position.set(bs.x, 0, deskZ);
    const note = s.stand([1030, 350, 60, 30], topY);
    // tablette de notes posée sur son pied (écran allumé)
    const noteMesh = new THREE.Group();
    noteMesh.add(box(note.w, note.h * 0.8, 0.04, '#2b2f3a'));
    noteMesh.add(at(label('NOTE DE SERVICE\n— — — —\n— — —', note.w * 0.86, note.h * 0.66, { color: '#7fffd4', bg: '#0d1a24', bold: true }), 0, 0, 0.022));
    noteMesh.position.set(note.x, topY + note.h * 0.4, Math.min(note.z, deskZ + 0.35));
    noteMesh.rotation.x = -0.35;
    const cup = s.stand([1120, 340, 40, 40], topY);
    const steam = at(glow('#ffffff', cup.w * 2, 0.15), cup.x, topY + cup.w * 1.8, Math.min(cup.z, deskZ + 0.2));
    s.spot('bureau', desk, noteMesh, at(mug(cup.w * 0.8), cup.x, topY, Math.min(cup.z, deskZ + 0.2)), steam);
    s.animate((t) => {
      steam.position.y = topY + cup.w * 1.6 + (t * 0.3) % 0.4;
      steam.material.opacity = 0.18 - ((t * 0.3) % 0.4) * 0.4;
    });

    // ── console (sortie vers le gros plan du panneau) ──
    const cs = s.stand([180, 290, 220, 170]);
    const cw = cs.w * 0.95;
    const consoleG = new THREE.Group();
    const baseH = cs.h * 0.62;
    consoleG.add(at(box(cw, baseH, 0.9, '#2a3444'), 0, baseH / 2, 0));
    const top = new THREE.Group();
    top.add(at(box(cw, 0.08, 0.9, '#3a4658'), 0, 0, 0));
    top.add(at(box(cw * 0.8, 0.02, 0.55, '#050a08', { edges: false }), 0, 0.05, -0.08));
    top.add(at(plane(cw * 0.76, 0.5, '#7fffd4', { glow: true, opacity: 0.25 }), 0, 0.065, -0.08));
    top.children[top.children.length - 1].rotation.x = -Math.PI / 2;
    top.add(at(cyl(0.11, 0.11, 0.08, '#d62839', { seg: 12 }), cw * 0.32, 0.06, 0.3));
    for (let i = 0; i < 6; i++) top.add(at(box(0.09, 0.04, 0.09, i % 3 ? '#222c3a' : '#ffd166'), -cw * 0.3 + (i % 3) * 0.13, 0.04, 0.22 + Math.floor(i / 3) * 0.13));
    top.position.set(0, baseH, 0);
    top.rotation.x = 0.45;
    consoleG.add(top);
    consoleG.add(at(label('CONSOLE', cw * 0.5, 0.18, { color: '#9aa5b1', bold: true }), 0, baseH * 0.35, 0.46));
    s.add(at(consoleG, cs.x, 0, against(cs.z, 0.9)));

    // ── porte vers le couloir ──
    backDoor(s, s.rect('vers_couloir'), 0.12, '#2a1d4a', '#3a2a66');

    // ── B.O.B. ──
    const bb = s.stand(s.rect('bob'));
    const robot = at(bob(bb.w * 0.75), bb.x, 0, bb.z, 0.35);
    s.spot('bob', robot);
    s.animate((t) => {
      robot.position.y = Math.abs(Math.sin(t * 1.1)) * 0.015;
    });
  },
};
