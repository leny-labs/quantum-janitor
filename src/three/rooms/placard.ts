import * as THREE from 'three';
import { at, beam, box, cyl, glow, label, mat, neon, pool, sphere, stripeTexture } from '../kit';
import { bob, bottle, momPhoto, postIt, reglementPlaque, seau, serpilliere, tapeLabel } from '../props';
import { BobRig } from './bobrepas';
import type { RoomBuild } from './index';
import { against, pipe, shell, wallPanels } from './shell';
import { t as tr } from '../../i18n';

/** Placard à balais : exigu, vert-de-gris, une ampoule nue. */
export const placard: RoomBuild = {
  camera: { pos: [0.6, 2.15, 7.5], look: [0, 1.85, 0], fov: 50 },
  shots: {
    produits: { px: [205, 130], fill: 0.96, orbit: -5, fov: 36 },
    seau: { fill: 0.5, lift: 0.3 },
    serpilliere: { px: [455, 440], fill: 0.95, aim: [0, 0.9, 0], orbit: -8 },
    casier: { px: [1040, 330], fill: 2.5, orbit: 6, fov: 32 },
    affiche: { fill: 0.5 },
    // B.O.B. mange le sandwich (et le rend) : le robot et le sol devant lui
    [BobRig.SHOT]: { of: 'bob', fill: 0.36, lift: 0.3, aim: [0, -0.3, 0.3], orbit: -6 },
  },
  build(s) {
    shell(s, {
      floor: { a: '#24302a', b: '#2b3a32', joint: '#151c18', tile: 0.9 },
      wall: { top: '#4f6e5d', bottom: '#2c3c33' },
      right: 6,
      trim: '#1b231f',
    });
    wallPanels(s, '#253229', -8, 6, 1.7, 8);
    pipe(s, 4.9, 0.25, -9, 6, 0.12, '#6d7f73');
    pipe(s, 5.25, 0.35, -9, 6, 0.07, '#b38a3a');

    s.lights({
      sky: '#d9ffe8',
      ground: '#1b231f',
      ambient: 1.3,
      key: { color: '#fff1c4', intensity: 2.4, pos: [2.5, 9, 6], target: [-0.5, 0, 0] },
      points: [{ color: '#ffe9a0', intensity: 18, pos: [0, 4.6, 3], distance: 10 }],
      rim: { color: '#7fffd4', intensity: 1.1, pos: [-6, 5, -4] },
      fill: { color: '#8a7cff', intensity: 0.45, pos: [-6, 3, 6] },
      fog: { color: '#1a2620', near: 7, far: 26 },
      vignette: { color: '#0a1410', strength: 0.62, warm: '#fff1c428' },
    });

    // ampoule nue au bout de son fil
    const bulbAt = s.wallAt(640, 40, 3);
    const bulb = at(sphere(0.18, '#fff4b0', { glow: true }), bulbAt.x, bulbAt.y, 3);
    const wire = at(cyl(0.012, 0.012, 3, '#222222', { edges: false }), bulbAt.x, bulbAt.y + 1.6, 3);
    const socket = at(cyl(0.07, 0.09, 0.16, '#555555', { edges: false }), bulbAt.x, bulbAt.y + 0.2, 3);
    const halo = at(glow('#fff4b0', 2.6, 0.35), bulbAt.x, bulbAt.y, 3);
    // cône de lumière poussiéreuse et flaque chaude au sol, qui grésillent avec l'ampoule
    const cone = at(beam('#fff1c4', 0.12, 1.9, bulbAt.y - 0.1, 0.13), bulbAt.x, bulbAt.y - 0.1, 3);
    const spill = at(pool('#ffe2a0', 5, 3, 0.3), bulbAt.x, 0.012, 3);
    s.add(bulb, wire, socket, halo, cone, spill);
    s.animate((t) => {
      const k = 1 + Math.sin(t * 13) * 0.06 + (Math.sin(t * 2.3) > 0.97 ? -0.45 : 0);
      halo.material.opacity = 0.33 * k;
      (cone.material as THREE.MeshBasicMaterial).opacity = 0.13 * k;
      (spill.material as THREE.MeshBasicMaterial).opacity = 0.3 * k;
    });

    // néon de propagande : Sylvie veille (avec amour)
    const nf = s.fit([775, 205, 150, 72], 0.05);
    const sylvie = at(neon(tr('props.placard.neon'), nf.w, nf.h, '#ff7ab8', { plate: '#160a14' }), nf.x, nf.y, 0.05);
    const sylvieGlow = at(pool('#ff7ab8', nf.w * 2.2, nf.h * 2.4, 0.16), nf.x, nf.y, 0.03);
    sylvieGlow.rotation.x = 0;
    s.add(sylvie, sylvieGlow);
    s.animate((t) => {
      // micro-grésillement, une coupure franche de temps en temps
      sylvie.material.opacity = Math.sin(t * 0.9) > 0.985 ? 0.35 : 0.94 + Math.sin(t * 31) * 0.04;
    });

    // inscription pochoir
    const sign = s.fit([440, 110, 400, 60], 0.01);
    s.add(at(label(tr('props.placard.sign'), sign.w, sign.h, { color: '#7fa08d', bold: true }), sign.x, sign.y, 0.01));

    // étagères
    const SHELF_Z = 0.35;
    const shelfY: number[] = [];
    for (const y of [90, 230]) {
      const f = s.fit([40, y, 330, 16], SHELF_Z * 2);
      shelfY.push(f.y + f.h / 2);
      s.add(at(box(f.w, f.h, SHELF_Z * 2, '#7a5c3c'), f.x, f.y, SHELF_Z));
      for (const sx of [-1, 1]) s.add(at(box(0.08, 0.35, 0.5, '#3a2e22'), f.x + sx * (f.w / 2 - 0.4), f.y - 0.22, 0.25));
    }

    // produits ménagers (hotspot « produits »)
    // Étiquettes papier collées : nom en gras + pictogramme absurde + petits
    // caractères (lisibles au zoom) ; fiole « ??? ».
    type Kind = Parameters<typeof bottle>[4];
    const products: [rect: [number, number, number, number], color: string, tag: Parameters<typeof bottle>[3], kind: Kind, shelf: number][] = [
      [[40, 26, 78, 64], '#b33a3a', { mark: 'grin', name: tr('props.placard.bleach'), fine: tr('props.placard.bleachFine') }, 'square', 0],
      [[136, 18, 60, 72], '#3a8fb3', { mark: 'swirl', name: tr('props.placard.breeze'), fine: tr('props.placard.breezeFine') }, 'round', 0],
      [[202, 40, 100, 50], '#8f3ab3', { mark: 'mustache', name: tr('props.placard.antiflux'), fine: tr('props.placard.antifluxFine') }, 'jar', 0],
      [[52, 150, 136, 80], '#c9a13a', { mark: 'duck', name: tr('props.placard.degreaser'), fine: tr('props.placard.degreaserFine') }, 'square', 1],
      [[214, 172, 62, 58], '#3ab36b', null, 'flask', 1],
    ];
    for (const [rect, color, tag, kind, shelf] of products) {
      const p = s.stand(rect, shelfY[shelf]);
      // flacon rond tourné vers la caméra : l'étiquette enroulée reste lisible
      s.spot('produits', at(bottle(p.w, p.h, color, tag, kind), p.x, shelfY[shelf], p.z, kind === 'round' ? 0.45 : 0));
    }
    // post-it rose de Sylvie, collé au mur entre les étagères
    const sn = s.fit([292, 116, 64, 58], 0.012);
    const note = at(postIt(sn.h * 1.1, sn.h, tr('props.placard.sylvieNote'), '#ff9fd0', '#5a0f3a'), sn.x, sn.y, 0.012);
    note.rotation.z = 0.07;
    // scotch de masquage annoté, sur le chant de l'étagère haute
    const tp = s.fit([270, 88, 100, 20], SHELF_Z * 2);
    const th = tp.w / 3.8;
    const tape = at(tapeLabel(tp.w, th, tr('props.placard.shelfTape')), tp.x, shelfY[0] - th / 2 + 0.03, SHELF_Z * 2 + 0.004);
    tape.rotation.z = -0.015;
    s.spot('produits', note);
    s.spot('produits', tape);

    // seau
    const sb = s.stand(s.rect('seau'));
    s.spot('seau', at(seau(sb.w * 0.85, sb.h * 0.8), sb.x, 0, sb.z));

    // serpillière appuyée au mur
    const sp = s.stand(s.rect('serpilliere'));
    s.spot('serpilliere', at(serpilliere(sp.h * 0.98), sp.x, 0, Math.max(sp.z, 0.35)));

    // B.O.B.
    const bb = s.stand(s.rect('bob'));
    const robot = at(bob(bb.w * 0.8), bb.x, 0, bb.z, -0.15);
    s.spot('bob', robot);
    s.expose('bob', new BobRig(s, { robot, w: bb.w * 0.8 }));
    const sigh = at(label('…', 0.6, 0.4, { color: '#dddddd', bold: true, bg: '#2b3a32' }), bb.x, bb.h + 0.35, bb.z);
    s.when({ notFlags: ['bob_suit'] }, sigh);
    s.animate((t) => {
      robot.position.y = Math.abs(Math.sin(t * 1.3)) * 0.02;
      sigh.position.y = bb.h + 0.35 + Math.sin(t * 1.1) * 0.05;
    });

    // casier de Gary
    const cs = s.stand(s.rect('casier'));
    const lw = cs.w * 0.95;
    const locker = new THREE.Group();
    locker.add(at(box(lw, cs.h, 0.9, '#55626e'), 0, cs.h / 2, 0));
    for (let i = 0; i < 4; i++) locker.add(at(box(lw * 0.7, 0.06, 0.02, '#2e353c', { edges: false }), 0, cs.h * 0.86 - i * 0.14, 0.46));
    locker.add(at(box(0.06, 0.4, 0.06, '#c9ced6'), lw * 0.36, cs.h * 0.5, 0.48));
    locker.add(at(label(tr('props.placard.locker'), lw * 0.8, 0.55, { color: '#1a1a1a', bg: '#e8e1c8', bold: true, lit: true }), 0, cs.h * 0.6, 0.455));
    const dent = at(sphere(0.18, '#4a5560', { seg: 8 }), -lw * 0.2, cs.h * 0.3, 0.42);
    dent.scale.z = 0.3;
    locker.add(dent);
    // polaroid de la mère, aimanté de travers sous la plaque (Gary en « capitaine »)
    const pw = lw * 0.46;
    const photo = at(momPhoto(pw), -lw * 0.15, cs.h * 0.6 - 0.4 - pw * 0.6, 0.49);
    photo.rotation.z = 0.07;
    locker.add(photo);
    // post-it de la mère, collé à côté du polaroid
    const mn = at(postIt(lw * 0.27, lw * 0.27, tr('props.placard.momNote')), lw * 0.2, photo.position.y + pw * 0.22, 0.47);
    mn.rotation.z = -0.09;
    locker.add(mn);
    s.spot('casier', at(locker, cs.x, 0, against(cs.z, 0.9)));

    // plaque réglementaire émaillée
    const af = s.fit(s.rect('affiche'), 0.04);
    s.spot('affiche', at(reglementPlaque(af.w * 0.96, af.h * 0.86), af.x, af.y - af.h * 0.04, 0.04));

    // porte vers le couloir, dans le mur de droite
    const d = s.fitX(s.rect('vers_couloir'), 6);
    const door = new THREE.Group();
    door.add(at(box(0.3, d.h, d.d * 1.12, '#1b231f'), 0, 0, 0));
    door.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.1, d.h * 0.94, d.d), mat('#ffffff', { map: stripeTexture('#ffd166', '#2a2a2a', 10) })), -0.15, -d.h * 0.03, 0));
    door.add(at(sphere(0.07, '#7fffd4', { glow: true }), -0.22, d.h * 0.45, 0));
    s.add(at(door, 6, d.y, d.z));
  },
};
