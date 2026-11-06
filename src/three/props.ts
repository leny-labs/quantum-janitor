// Objets 3D réutilisables (personnages-objets, objets d'inventaire posés dans
// une pièce). Chaque fonction renvoie un Group dont l'origine est au sol, au
// centre de la base : il suffit de le poser avec `at(prop, x, 0, z)`.
import * as THREE from 'three';
import { at, box, cyl, decal, glow, group, label, mat, mysteryTag, outline, shell, sphere, torus, type DecalMark } from './kit';
import { t as tr, tl as trl } from '../i18n';
import { BROW_POSES, type BrowPair } from '../engine/brows';
import { speaking } from '../engine/speaking';

/**
 * Expression d'un personnage pour le studio de portraits (frames de sprite).
 * `mouth` 0..1 = ouverture ; `phase` varie le détail d'une frame à l'autre
 * (barres LED, antennes) pour que la boucle ne semble pas figée.
 */
export interface FacePose {
  mouth: number;
  blink: boolean;
  phase: number;
}

/** Applique une expression si le prop en expose une (`userData.setFace`). */
export function setFace(obj: THREE.Object3D, pose: FacePose): void {
  obj.userData.mouthOpen = pose.mouth;
  (obj.userData.setFace as ((p: FacePose) => void) | undefined)?.(pose);
}

/** B.O.B., aspirateur-robot dépressif. `w` = diamètre. */
export function bob(w: number): THREE.Group {
  const r = w / 2;
  const h = w * 0.26;
  const body = at(cyl(r, r * 1.02, h, '#8994a3', { seg: 20 }), 0, h / 2 + r * 0.04, 0);
  const bumper = at(cyl(r * 1.04, r * 1.04, h * 0.28, '#3f4652', { seg: 20, edges: false }), 0, h * 0.3, 0);
  // couvercle sur charnière latérale (côté opposé à l'antenne) : fermé au repos,
  // il s'ouvre pour les repas (rooms/bobrepas.ts) sur une gueule sombre
  const lidHinge = at(new THREE.Group(), -r * 0.8, h + r * 0.04, 0);
  lidHinge.add(at(cyl(r * 0.78, r * 0.82, h * 0.18, '#a9b4c2', { seg: 20 }), r * 0.8, 0, 0));
  const maw = at(cyl(r * 0.66, r * 0.66, h * 0.02, '#1a1020', { glow: true, seg: 20 }), 0, h + r * 0.04, 0);
  const lid = group([lidHinge, maw]);
  const eyeR = r * 0.16;
  const eyeY = h * 0.62;
  const eyeZ = r * 0.9;
  // pivot de chaque groupe-œil au centre de l'œil (et non au sol, origine du robot) : clignements
  // (BobIdle, setFace) et plissements des rigs (scale.y/x) écrasent l'œil sur place au lieu de le
  // tasser vers le pare-choc, sous la plaque « B.O.B. ». Pupille : même décalage qu'avant (un poil bas).
  const eyes = [-1, 1].map((sx) => {
    const eye = sphere(eyeR, '#ffffff', { seg: 10 });
    const pupil = at(sphere(r * 0.07, '#11131a', { glow: true, seg: 8 }), 0, h * 0.55 - eyeY, r * 1.04 - eyeZ);
    return group([eye, pupil], sx * r * 0.36, eyeY, eyeZ);
  });
  // sourcils-plaques au-dessus des yeux (la déprime, en low-poly), orientés
  // selon l'humeur (setBrows, poses de engine/brows.ts) ; hors des groupes
  // `eyes` pour que clignements et mâchouillage ne les écrasent pas.
  // Au repos, le bas de la plaque flotte un poil au-dessus du sommet de l'œil ;
  // la plaque est avancée devant la sphère (face avant > avant de l'œil) pour
  // que les poses plongeantes (angry, suspicious) masquent le blanc au lieu
  // de le laisser dépasser devant.
  const browT = r * 0.1;
  const browD = r * 0.2;
  const browY = eyeY + eyeR + browT / 2 + r * 0.03;
  const browZ = eyeZ + eyeR - browD / 2 + r * 0.03;
  const brows = [-1, 1].map((sx) => at(group([box(r * 0.38, browT, browD, '#4f5764', { edges: false })]), sx * r * 0.36, browY, browZ));
  /** Pose des sourcils ; `lift` = sursaut commun, en rayons d'œil (négatif = plus haut). */
  const setBrows = (p: BrowPair, lift = 0) => {
    brows.forEach((b, i) => {
      const sx = i === 0 ? -1 : 1;
      const s = sx < 0 ? p.l : p.r;
      b.position.y = browY - (s.y + lift) * eyeR;
      // bout intérieur relevé : rotation de sens opposé de chaque côté
      b.rotation.z = -sx * THREE.MathUtils.degToRad(s.rot);
      b.scale.x = s.len;
    });
  };
  setBrows(BROW_POSES.calm);
  const antenna = at(cyl(r * 0.02, r * 0.02, r * 0.5, '#3f4652', { edges: false }), r * 0.4, h + r * 0.3, -r * 0.3);
  const tip = at(sphere(r * 0.06, '#ff5c7a', { glow: true }), r * 0.4, h + r * 0.56, -r * 0.3);
  // visage canonique (docs/CHAPTERS.md « visage de B.O.B. ») : yeux ronds blancs + pupilles noires,
  // sourcils gris, et sous les yeux l'écran-plaque « B.O.B. » vert dans son cadre clair.
  // Au repos l'écran affiche « B.O.B. » en LED verte ; en parlant (setFace), l'onde le remplace.
  const sy = h * 0.28;
  const sz = r * 1.06;
  // plaque de repos : plus étroite que l'écran parlant, centrée sous les yeux sans les mordre
  const py = h * 0.2;
  const plate = group([
    at(box(r * 0.56, r * 0.19, r * 0.02, '#c9d2dc', { edges: false, shadow: false }), 0, py, sz),
    at(label('B.O.B.', r * 0.5, r * 0.14, { color: '#5dffb0', bg: '#0b1a14', bold: true, mono: true }), 0, py, sz + r * 0.012),
  ]);
  const bezel = at(box(r * 0.8, r * 0.26, r * 0.02, '#c9d2dc', { edges: false, shadow: false }), 0, sy, sz - r * 0.01);
  const screen = at(box(r * 0.74, r * 0.2, r * 0.02, '#0b1018', { edges: false, shadow: false }), 0, sy, sz);
  // grille des « dents » : montants fins par-dessus l'onde
  const grille = [-1, 0, 1].map((i) => at(box(r * 0.012, r * 0.2, r * 0.02, '#2a3442', { edges: false, shadow: false }), i * r * 0.185, sy, sz + r * 0.03));
  // ligne plate : LED ambre triste au repos, trait cyan pâle sous l'onde en parlant
  const flat = at(box(r * 0.62, r * 0.018, r * 0.02, '#ffb347', { glow: true, edges: false, shadow: false }), 0, sy, sz + r * 0.015);
  const N = 11;
  const bars = Array.from({ length: N }, (_, i) => at(box(r * 0.046, r * 0.17, r * 0.02, '#7fffd4', { glow: true, edges: false, shadow: false }), (i - (N - 1) / 2) * r * 0.06, sy, sz + r * 0.02));
  const mouthParts = [bezel, screen, ...grille, flat, ...bars];
  mouthParts.forEach((m) => (m.visible = false));
  const g = group([body, bumper, lid, ...eyes, ...brows, antenna, tip, plate, ...mouthParts]);
  g.userData.tip = tip;
  g.userData.setBrows = setBrows;
  g.userData.lid = lidHinge;
  g.userData.eyes = eyes;
  g.userData.setFace = (p: FacePose) => {
    const on = p.mouth > 0.02;
    plate.visible = false;
    [bezel, screen, ...grille, flat].forEach((m) => (m.visible = true));
    (flat.material as THREE.MeshBasicMaterial).color.set(on ? '#2f8f7a' : '#ffb347');
    flat.scale.x = on ? 1 : 0.55;
    bars.forEach((b, i) => {
      b.visible = on;
      // onde symétrique autour de l'axe : enveloppe en cloche × sinusoïde qui glisse avec la phase
      const t = (i - (N - 1) / 2) / ((N - 1) / 2);
      const bell = 0.35 + 0.65 * Math.cos((t * Math.PI) / 2);
      const wave = 0.3 + 0.7 * Math.abs(Math.sin(p.phase * 2.1 + i * 0.95));
      b.scale.y = Math.max(0.1, p.mouth * bell * wave);
      // crêtes en ambre, corps en cyan
      (b.material as THREE.MeshBasicMaterial).color.set(b.scale.y > 0.62 ? '#ffd166' : '#7fffd4');
    });
    eyes.forEach((e) => (e.scale.y = p.blink ? 0.2 : 1));
    tip.visible = !p.blink;
  };
  // retour à l'apparence de salle (plaque B.O.B., écran éteint) après avoir parlé
  g.userData.restFace = () => {
    plate.visible = true;
    mouthParts.forEach((m) => (m.visible = false));
    eyes.forEach((e) => (e.scale.y = 1));
    tip.visible = true;
  };
  return g;
}

/** Le Seau (bleu, réglementaire). */
export function seau(w: number, h: number): THREE.Group {
  const r = w / 2;
  const bodyH = h * 0.8;
  const body = at(cyl(r, r * 0.78, bodyH, '#3d7dd8', { seg: 16 }), 0, bodyH / 2, 0);
  const rim = at(torus(r * 0.98, r * 0.06, '#6fa8ff'), 0, bodyH, 0);
  rim.rotation.x = Math.PI / 2;
  const inside = at(cyl(r * 0.9, r * 0.9, 0.01, '#1d3d6e', { edges: false, shadow: false }), 0, bodyH - 0.02, 0);
  const band = at(cyl(r * 0.91, r * 0.91, bodyH * 0.12, '#2b5fa8', { seg: 16, edges: false }), 0, bodyH * 0.35, 0);
  // anse : arc continu d'un flanc à l'autre, par-dessus l'ouverture, sur deux pivots
  const pivotY = bodyH * 0.86;
  const flank = r * (0.78 + 0.22 * 0.93); // rayon du corps (tronc de cône) à hauteur du pivot
  const sx = flank + r * 0.07;
  const arc = new THREE.CurvePath<THREE.Vector3>();
  arc.add(new THREE.LineCurve3(new THREE.Vector3(-sx, pivotY, 0), new THREE.Vector3(-sx, bodyH + r * 0.12, 0)));
  const top = new THREE.EllipseCurve(0, bodyH + r * 0.12, sx, r * 0.62, Math.PI, 0, true);
  arc.add(new THREE.CatmullRomCurve3(top.getPoints(24).map((p) => new THREE.Vector3(p.x, p.y, 0))));
  arc.add(new THREE.LineCurve3(new THREE.Vector3(sx, bodyH + r * 0.12, 0), new THREE.Vector3(sx, pivotY, 0)));
  const wire = outline(new THREE.Mesh(new THREE.TubeGeometry(arc, 48, r * 0.05, 8, false), mat('#d9e2ec')), 50);
  wire.castShadow = true;
  // poignée plastique au sommet, couchée selon x
  const grip = at(cyl(r * 0.09, r * 0.09, r * 0.5, '#2b5fa8', { seg: 10 }), 0, bodyH + r * 0.74, 0);
  grip.rotation.z = Math.PI / 2;
  // attaches moulées sur les flancs + rivet du pivot
  const lugs = [-1, 1].flatMap((side) => {
    const lug = at(box(r * 0.08, r * 0.26, r * 0.22, '#6fa8ff'), side * (flank + r * 0.02), pivotY, 0);
    const rivet = at(cyl(r * 0.07, r * 0.07, r * 0.06, '#cfd8e3', { seg: 10 }), side * sx, pivotY, 0);
    rivet.rotation.z = Math.PI / 2;
    return [lug, rivet];
  });
  const handle = group([wire, grip, ...lugs]);
  handle.rotation.y = 0.5;
  return group([body, band, rim, inside, handle]);
}

/**
 * Combinaison de chitine (ch.1, « la Mue Sacrée ») : plastron en plaques
 * segmentées, épaulières en élytres, col à deux antennes décoratives, jambes
 * annelées. Origine au sol, hauteur h. Icône d'inventaire `combi_chitine`.
 */
export function combiChitine(h: number): THREE.Group {
  const SHELL = '#6b3a12';
  const DARK = '#3e1f08';
  const AMBER = '#c9802e';
  const GOLD = '#e0a83a';
  const parts: THREE.Object3D[] = [];
  // jambes annelées
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const r = h * (0.07 - i * 0.004);
      parts.push(at(cyl(r, r * 0.9, h * 0.09, i % 2 ? DARK : SHELL, { seg: 10 }), sx * h * 0.09, h * (0.05 + i * 0.1), 0));
    }
  }
  // ceinture dorée
  parts.push(at(cyl(h * 0.17, h * 0.17, h * 0.04, GOLD, { seg: 16 }), 0, h * 0.44, 0));
  // plastron : plaques segmentées, de plus en plus larges vers les épaules
  for (let i = 0; i < 4; i++) {
    const plate = at(sphere(h * (0.15 + i * 0.012), i % 2 ? AMBER : SHELL, { seg: 14 }), 0, h * (0.5 + i * 0.075), h * 0.01);
    plate.scale.set(1.15, 0.42, 0.75);
    parts.push(plate);
  }
  // épaulières en élytres + bras annelés
  for (const sx of [-1, 1]) {
    const pad = at(sphere(h * 0.1, SHELL, { seg: 12 }), sx * h * 0.21, h * 0.76, 0);
    pad.scale.set(1.2, 0.6, 1);
    pad.rotation.z = sx * -0.5;
    parts.push(pad, at(sphere(h * 0.03, GOLD, { seg: 8 }), sx * h * 0.25, h * 0.8, h * 0.07));
    for (let i = 0; i < 3; i++) {
      const arm = at(cyl(h * 0.045, h * 0.04, h * 0.09, i % 2 ? DARK : SHELL, { seg: 8 }), sx * h * (0.27 + i * 0.015), h * (0.66 - i * 0.09), 0);
      arm.rotation.z = sx * 0.18;
      parts.push(arm);
    }
  }
  // col + deux antennes décoratives
  parts.push(at(torus(h * 0.08, h * 0.022, GOLD), 0, h * 0.84, 0));
  parts[parts.length - 1].rotation.x = Math.PI / 2;
  for (const sx of [-1, 1]) {
    const ant = at(cyl(h * 0.008, h * 0.005, h * 0.26, DARK, { seg: 4, edges: false }), sx * h * 0.07, h * 0.96, 0);
    ant.rotation.z = sx * -0.45;
    parts.push(ant, at(sphere(h * 0.018, '#ffd166', { glow: true, seg: 6 }), sx * h * 0.13, h * 1.07, 0));
  }
  // l'écusson orange de Gary, recousu sur la poitrine
  parts.push(at(cyl(h * 0.035, h * 0.035, h * 0.01, '#ff8c42', { seg: 12 }), -h * 0.07, h * 0.66, h * 0.11));
  parts[parts.length - 1].rotation.x = Math.PI / 2;
  return group(parts);
}

/** Serpillière appuyée contre le mur (penchée vers -x). */
export function serpilliere(h: number): THREE.Group {
  const stickH = h * 0.86;
  const stick = at(cyl(h * 0.012, h * 0.012, stickH, '#8a6a3a', { seg: 6 }), 0, h * 0.14 + stickH / 2, 0);
  const head = at(cyl(h * 0.06, h * 0.05, h * 0.05, '#7a5a2a', { seg: 8 }), 0, h * 0.15, 0);
  const strands: THREE.Object3D[] = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const s = at(cyl(h * 0.018, h * 0.024, h * 0.14, i % 2 ? '#c9b458' : '#b8a248', { seg: 5, edges: false }), Math.cos(a) * h * 0.05, h * 0.07, Math.sin(a) * h * 0.05);
    s.rotation.z = Math.cos(a) * 0.35;
    s.rotation.x = -Math.sin(a) * 0.35;
    strands.push(s);
  }
  const g = group([stick, head, ...strands]);
  g.rotation.z = 0.08;
  return g;
}

/** Fusible 7B (petit cylindre rouge à capuchons métal), couché selon x. */
export function fusible(len: number): THREE.Group {
  const r = len * 0.22;
  const body = cyl(r, r, len * 0.7, '#d94f4f', { seg: 10 });
  const caps = [-1, 1].map((s) => at(cyl(r * 1.1, r * 1.1, len * 0.15, '#c9ced6', { seg: 10 }), 0, (s * len * 0.42), 0));
  const tag = at(label('7B', len * 0.4, r * 1.2, { color: '#ffffff', bold: true }), 0, 0, r * 1.02);
  tag.rotation.z = Math.PI / 2;
  const g = group([body, ...caps, tag]);
  g.rotation.z = Math.PI / 2;
  return group([g]);
}

/**
 * Flacon générique : corps + goulot + bouchon + étiquette papier collée
 * (nom du produit en gras + pictogramme). `tag` à null : pas d'étiquette ;
 * la fiole (`flask`) porte une étiquette volante « ??? ».
 */
export function bottle(w: number, h: number, color: string, tag: { mark: DecalMark; name: string; fine?: string } | null, kind: 'round' | 'square' | 'jar' | 'flask' = 'round'): THREE.Group {
  const parts: THREE.Object3D[] = [];
  const bodyH = kind === 'jar' ? h * 0.85 : h * 0.72;
  if (kind === 'square') parts.push(at(box(w, bodyH, w * 0.6, color), 0, bodyH / 2, 0));
  else if (kind === 'flask') parts.push(at(sphere(w / 2, color, { seg: 14, glow: true, opacity: 0.85 }), 0, w / 2, 0));
  else parts.push(at(cyl(w / 2, w / 2, bodyH, color, { seg: kind === 'jar' ? 14 : 10 }), 0, bodyH / 2, 0));
  const top = kind === 'flask' ? w : bodyH;
  if (kind !== 'jar') {
    parts.push(at(cyl(w * 0.14, w * 0.2, h * 0.14, color, { seg: 8 }), 0, top + h * 0.07, 0));
    parts.push(at(cyl(w * 0.16, w * 0.16, h * 0.08, '#f2efe6', { seg: 8 }), 0, top + h * 0.18, 0));
  } else {
    parts.push(at(cyl(w * 0.52, w * 0.52, h * 0.12, '#f2efe6', { seg: 14 }), 0, bodyH + h * 0.06, 0));
  }
  if (kind === 'flask') parts.push(at(glow('#3ab36b', w * 2.2, 0.5), 0, w / 2, 0));
  if (kind === 'flask') {
    // fiole mystère : étiquette « ??? » nouée au goulot, pendue devant la panse
    const tw = w * 0.5;
    const th = tw / 1.5;
    const t = at(mysteryTag(tw, th), w * 0.04, w * 0.62, w * 0.5 + 0.01);
    t.rotation.z = -0.12;
    const string = at(cyl(0.004, 0.004, w * 0.42, '#2a1f3a', { edges: false }), -w * 0.1, top - w * 0.05, w * 0.36);
    string.rotation.x = 0.7;
    parts.push(t, string);
  } else if (tag) {
    const band = new THREE.Color(color).multiplyScalar(0.8).getStyle();
    // plaque large : ~70 % de la hauteur du corps (84 % avec petits caractères), presque toute la face
    const dh = bodyH * (tag.fine ? 0.84 : 0.7);
    // petits caractères : bande moins enroulée sur un flacon rond (texte lisible jusqu'aux bords)
    const dw = Math.min(dh * 2.4, w * (kind === 'square' ? 0.9 : tag.fine ? 0.82 : 0.95));
    const y = bodyH * 0.5;
    if (kind === 'square') parts.push(at(decal(dw, dh, band, tag.mark, tag.name, undefined, tag.fine), 0, y, w * 0.3 + 0.004));
    else parts.push(at(decal(dw, dh, band, tag.mark, tag.name, w / 2 + 0.004, tag.fine), 0, y, 0));
  }
  return group(parts);
}

/** Tasse de café fumante (enfin, tiède). */
export function mug(w: number): THREE.Group {
  const body = at(cyl(w / 2, w * 0.45, w, '#ffffff', { seg: 12 }), 0, w / 2, 0);
  const coffee = at(cyl(w * 0.44, w * 0.44, 0.005, '#3b2412', { edges: false }), 0, w * 0.97, 0);
  const handle = at(torus(w * 0.22, w * 0.06, '#ffffff'), w * 0.52, w * 0.5, 0);
  return group([body, coffee, handle]);
}

/** Recto GenAI du badge (carte redressée, 512×360). */
export const BADGE_CARD_URL = `${import.meta.env.BASE_URL}inventory/badge-card.png`;
const BADGE_RATIO = 360 / 512;
let badgeFace: THREE.MeshToonMaterial | null = null;

/** Matériau du recto, partagé : texture chargée une fois, recto masqué tant qu'elle n'est pas prête. */
function badgeFaceMat(): THREE.MeshToonMaterial {
  if (badgeFace) return badgeFace;
  const map = new THREE.TextureLoader().load(BADGE_CARD_URL, () => (m.visible = true));
  map.colorSpace = THREE.SRGBColorSpace;
  const m = (badgeFace = paperMat(map, 0.15));
  m.visible = false;
  return m;
}

/** Carte « GARRY » (recto GenAI sur tranche blanc cassé), centrée, face +Z. `cw` = largeur. */
export function badgeCard(cw: number, thick = cw * 0.03): THREE.Group {
  const ch = cw * BADGE_RATIO;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(cw, ch), badgeFaceMat());
  face.receiveShadow = true;
  face.position.z = thick / 2 + 0.001;
  return group([box(cw, ch, thick, '#f1efe6'), face]);
}

/** Badge d'accès « GARRY » (carte paysage + clip), debout face +Z. */
export function badge(w: number): THREE.Group {
  const h = w * BADGE_RATIO;
  const card = at(badgeCard(w, w * 0.04), 0, h / 2, 0);
  const clip = at(box(w * 0.22, w * 0.1, w * 0.07, '#c9ced6'), 0, h + w * 0.04, 0);
  return group([card, clip]);
}

/** Sandwich « Thon-Mayo-Mystère » sous film, en triangle. */
export function sandwich(w: number): THREE.Group {
  const tri = (h: number, color: string, y: number, scale = 1) => {
    const m = at(cyl(w * 0.6 * scale, w * 0.6 * scale, h, color, { seg: 3 }), 0, y, 0);
    m.rotation.y = Math.PI / 6;
    return m;
  };
  const t = w * 0.12;
  const parts = [
    tri(t, '#e8c27a', t / 2),
    tri(t * 0.5, '#8fae3a', t * 1.2, 0.97),
    tri(t * 0.5, '#f0e6c8', t * 1.6, 0.95),
    tri(t, '#e8c27a', t * 2.3),
  ];
  const wrap = at(cyl(w * 0.64, w * 0.64, t * 3.1, '#d9f2ff', { seg: 3, opacity: 0.28, edges: false }), 0, t * 1.5, 0);
  wrap.rotation.y = Math.PI / 6;
  const sticker = at(box(w * 0.36, 0.01, w * 0.2, '#ff5c7a', { edges: false }), w * 0.05, t * 3.08, w * 0.1);
  const g = group([...parts, wrap, sticker]);
  return g;
}

/** Tige entre deux points (bras articulés, branches de lunettes…). */
function rod(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, o: { edges?: boolean } = {}): THREE.Mesh {
  const d = new THREE.Vector3().subVectors(b, a);
  const m = cyl(r, r, d.length(), color, { seg: 8, edges: o.edges ?? false });
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return m;
}

/**
 * Drone porte-outils dorsal de Gary (design « Janék ») : tête blanche et orange,
 * gros œil bleu, antenne. Un outil de service sans conscience — rien à voir
 * avec B.O.B. (qui reste l'aspirateur du placard). `r` = rayon de la tête.
 */
function toolDrone(r: number): THREE.Group {
  const head = sphere(r, '#f2eee6', { seg: 16 });
  const band = at(torus(r * 0.98, r * 0.09, '#ff7a2a'), 0, 0, 0);
  const ears = [-1, 1].map((sx) => {
    const e = at(cyl(r * 0.42, r * 0.42, r * 0.22, '#ff7a2a', { seg: 14 }), sx * r * 0.95, 0, 0);
    e.rotation.z = Math.PI / 2;
    return e;
  });
  const bezel = at(cyl(r * 0.62, r * 0.66, r * 0.2, '#2a2f3a', { seg: 18 }), 0, 0, r * 0.86);
  bezel.rotation.x = Math.PI / 2;
  const iris = at(cyl(r * 0.5, r * 0.5, r * 0.04, '#3fa9ff', { seg: 18, glow: true }), 0, 0, r * 1.0);
  iris.rotation.x = Math.PI / 2;
  const pupil = at(cyl(r * 0.22, r * 0.22, r * 0.04, '#0b1a33', { seg: 14, glow: true }), 0, 0, r * 1.03);
  pupil.rotation.x = Math.PI / 2;
  const shine = at(sphere(r * 0.09, '#ffffff', { glow: true }), r * 0.2, r * 0.2, r * 1.06);
  const antenna = at(cyl(r * 0.04, r * 0.04, r * 0.9, '#3f4652', { edges: false }), -r * 0.35, r * 1.25, -r * 0.1);
  antenna.rotation.z = 0.25;
  const tip = at(sphere(r * 0.13, '#ff7a2a', { glow: true }), -r * 0.46, r * 1.7, -r * 0.1);
  const eye = group([iris, pupil, shine]);
  const g = group([head, band, ...ears, bezel, eye, antenna, tip]);
  g.userData.eye = eye;
  return g;
}

/** Clé à molette argentée (mâchoire ouverte), couchée dans le plan XY, tête en +y. */
function wrench(len: number): THREE.Group {
  const handle = at(box(len * 0.12, len * 0.72, len * 0.05, '#c7ccd4'), 0, len * 0.36, 0);
  const jaw = new THREE.Mesh(new THREE.TorusGeometry(len * 0.13, len * 0.06, 6, 14, Math.PI * 1.45), mat('#c7ccd4'));
  outline(jaw);
  jaw.position.set(0, len * 0.84, 0);
  jaw.rotation.z = -Math.PI * 0.22;
  return group([handle, jaw]);
}

/**
 * Buste de Gary Plunk, design « Janék » (concierge-bricoleur) : casquette
 * blanc/orange, grosses lunettes brunes, gros nez, barbe de trois jours,
 * combinaison orange, harnais + communicateur, drone porte-outils sur l'épaule.
 */
export function gary(h: number): THREE.Group {
  const u = h / 2;
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x * u, y * u, z * u);
  const SKIN = '#f0bf94';
  const SKIN_D = '#e2a57e';
  const HAIR = '#5e3a1f';
  const SUIT = '#f07828';
  const SUIT_D = '#c85a1a';
  const STRAP = '#4b5566';
  const FRAME = '#7a4320';

  // ── corps : combinaison orange, col, maillot blanc, ceinture à outils ──
  const torso = at(cyl(u * 0.55, u * 0.62, u * 0.78, SUIT, { seg: 12 }), 0, u * 0.39, 0);
  const shoulders = [-1, 1].map((sx) => {
    const s = at(sphere(u * 0.25, SUIT, { seg: 12 }), sx * u * 0.5, u * 0.66, 0);
    s.scale.set(1.1, 0.8, 1);
    return s;
  });
  const tee = at(cyl(u * 0.19, u * 0.24, u * 0.08, '#f4efe6', { seg: 12 }), 0, u * 0.79, 0);
  const collar = [-1, 1].map((sx) => {
    const c = at(box(u * 0.22, u * 0.05, u * 0.16, SUIT_D), sx * u * 0.15, u * 0.78, u * 0.24);
    c.rotation.set(-0.35, sx * -0.5, sx * 0.35);
    return c;
  });
  const placket = at(box(u * 0.05, u * 0.62, u * 0.02, SUIT_D, { edges: false }), -u * 0.06, u * 0.38, u * 0.59);
  placket.rotation.x = -0.09;
  const belt = at(cyl(u * 0.625, u * 0.625, u * 0.1, '#5a3a22', { seg: 12 }), 0, u * 0.06, 0);
  const buckle = at(box(u * 0.14, u * 0.1, u * 0.03, '#c7ccd4'), 0, u * 0.06, u * 0.63);
  const pouches = [-0.35, 0.38].map((x) => at(box(u * 0.2, u * 0.18, u * 0.1, '#7a5230'), x * u, u * 0.02, u * 0.56));
  // patch planète bleue sur l'épaule gauche (+x), tourné vers l'extérieur
  const disc = cyl(u * 0.09, u * 0.09, u * 0.02, '#2f7fd8', { seg: 16 });
  const ringP = torus(u * 0.11, u * 0.012, '#ffb347');
  ringP.rotation.set(Math.PI / 2, 0.5, 0);
  const patch = at(group([disc, ringP]), u * 0.68, u * 0.6, u * 0.22);
  patch.rotation.set(0, -0.8, -Math.PI / 2 + 0.2);
  // harnais du drone : bretelles gris-bleu, boucles, sac dorsal
  const straps = [-1, 1].map((sx) => {
    const st = at(box(u * 0.13, u * 0.64, u * 0.04, STRAP, { edges: false }), sx * u * 0.27, u * 0.4, u * 0.56);
    st.rotation.x = -0.1;
    return st;
  });
  const overs = [-1, 1].map((sx) => {
    const o = at(box(u * 0.13, u * 0.04, u * 0.5, STRAP, { edges: false }), sx * u * 0.3, u * 0.81, u * 0.05);
    o.rotation.x = 0.15;
    return o;
  });
  const buckles = [-1, 1].map((sx) => at(box(u * 0.15, u * 0.06, u * 0.03, '#a9b4c2', { edges: false }), sx * u * 0.27, u * 0.22, u * 0.6));
  const pack = at(box(u * 0.62, u * 0.52, u * 0.22, STRAP), 0, u * 0.42, -u * 0.66);
  // communicateur / scanner à écran vert sur la bretelle gauche
  const comm = at(box(u * 0.17, u * 0.25, u * 0.06, '#3a404c'), u * 0.27, u * 0.47, u * 0.62);
  const commScreen = at(box(u * 0.12, u * 0.08, u * 0.01, '#5cff9d', { glow: true }), u * 0.27, u * 0.53, u * 0.655);
  const commKeys = [-1, 0, 1].map((i) => at(box(u * 0.025, u * 0.025, u * 0.01, i === 0 ? '#5cff9d' : '#ff7a2a', { glow: true }), u * (0.27 + i * 0.04), u * 0.43, u * 0.655));
  const commAnt = at(cyl(u * 0.01, u * 0.01, u * 0.12, '#2a2f3a', { edges: false }), u * 0.33, u * 0.65, u * 0.62);
  // clé à molette glissée dans la bretelle droite
  const key = at(wrench(u * 0.5), -u * 0.36, u * 0.3, u * 0.62);
  key.rotation.z = -0.3;

  // ── tête : long visage, gros nez, barbe de trois jours ──
  const neck = at(cyl(u * 0.15, u * 0.17, u * 0.2, SKIN_D, { seg: 8 }), 0, u * 0.86, 0);
  const head = at(sphere(u * 0.42, SKIN, { seg: 18 }), 0, u * 1.25, 0);
  head.scale.set(0.92, 1.1, 0.95);
  const beard = at(shell(u * 0.43, '#a37a5e', { seg: 18, phi: [Math.PI * 0.08, Math.PI * 0.84], theta: [Math.PI * 0.6, Math.PI * 0.4] }), 0, u * 1.25, 0);
  beard.scale.set(0.92, 1.1, 0.95);
  const nose = at(sphere(u * 0.14, '#ec9f7e', { seg: 12 }), 0, u * 1.19, u * 0.44);
  nose.scale.set(0.85, 1, 1.45);
  const ears = [-1, 1].map((sx) => {
    const e = at(sphere(u * 0.11, SKIN_D, { seg: 8 }), sx * u * 0.39, u * 1.26, -u * 0.02);
    e.scale.set(0.6, 1.1, 0.9);
    return e;
  });
  const eyes = [-1, 1].map((sx) => {
    const white = at(sphere(u * 0.085, '#ffffff', { seg: 10 }), sx * u * 0.14, u * 1.33, u * 0.33);
    const pupil = at(sphere(u * 0.042, '#4a2a12', { seg: 8, glow: true }), sx * u * 0.13, u * 1.32, u * 0.41);
    const lid = at(box(u * 0.2, u * 0.05, u * 0.12, SKIN, { edges: false }), sx * u * 0.14, u * 1.42, u * 0.34);
    lid.rotation.z = sx * 0.12;
    return group([white, pupil, lid]);
  });
  // sourcils épais, froncés (l'air sceptique de la planche « Neutre »)
  const brows = [-1, 1].map((sx) => {
    const b = at(box(u * 0.2, u * 0.06, u * 0.06, HAIR, { edges: false }), sx * u * 0.15, u * (sx < 0 ? 1.45 : 1.47), u * 0.44);
    b.rotation.z = sx * (sx < 0 ? 0.2 : 0.08);
    return b;
  });
  // grosses lunettes rectangulaires brunes
  const lens = (sx: number) => {
    const cx = sx * u * 0.15;
    const w = u * 0.24;
    const hh = u * 0.17;
    const t = u * 0.028;
    const z = u * 0.47;
    const bars = [
      at(box(w, t, t, FRAME, { edges: false }), cx, u * 1.33 + hh / 2, z),
      at(box(w, t, t, FRAME, { edges: false }), cx, u * 1.33 - hh / 2, z),
      at(box(t, hh, t, FRAME, { edges: false }), cx - w / 2, u * 1.33, z),
      at(box(t, hh, t, FRAME, { edges: false }), cx + w / 2, u * 1.33, z),
    ];
    const glass = at(box(w, hh, u * 0.005, '#cfe8ff', { opacity: 0.18, edges: false, shadow: false }), cx, u * 1.33, z);
    const temple = rod(V(sx * 0.27, 1.37, 0.46), V(sx * 0.39, 1.33, 0.02), u * 0.014, FRAME);
    return [...bars, glass, temple];
  };
  const bridge = at(box(u * 0.07, u * 0.025, u * 0.025, FRAME, { edges: false }), 0, u * 1.36, u * 0.48);
  const glasses = group([...lens(-1), ...lens(1), bridge]);
  // cheveux bruns en bataille qui dépassent de la casquette
  const tufts = (
    [
      [-0.42, 1.44, 0.16, 1.1], [-0.45, 1.42, -0.04, 1.4], [-0.4, 1.4, -0.22, 1.7], [-0.28, 1.42, -0.38, 2.1],
      [0.42, 1.44, 0.16, -1.1], [0.45, 1.42, -0.04, -1.4], [0.4, 1.4, -0.22, -1.7], [0.28, 1.42, -0.38, -2.1],
      [0, 1.42, -0.45, 3.1],
    ] as const
  ).map(([x, y, z, rz]) => {
    const t = at(cyl(0, u * 0.09, u * 0.2, HAIR, { seg: 5, edges: false }), x * u, y * u, z * u);
    t.rotation.set(z < -0.3 ? -0.9 : 0, 0, rz);
    return t;
  });
  const sideburns = [-1, 1].map((sx) => at(box(u * 0.05, u * 0.16, u * 0.12, HAIR, { edges: false }), sx * u * 0.37, u * 1.37, u * 0.1));

  // ── casquette de baseball blanc / orange ──
  const crown = at(shell(u * 0.45, '#f3eee4', { seg: 18, theta: [0, Math.PI / 2] }), 0, u * 1.44, 0);
  crown.scale.y = 0.85;
  outline(crown, 40);
  const front = at(shell(u * 0.455, '#ff7a2a', { seg: 18, phi: [Math.PI * 0.32, Math.PI * 0.36], theta: [Math.PI * 0.08, Math.PI * 0.42] }), 0, u * 1.44, 0);
  front.scale.y = 0.85;
  const capBand = at(torus(u * 0.448, u * 0.02, '#ff7a2a'), 0, u * 1.45, 0);
  capBand.rotation.x = Math.PI / 2;
  const visor = new THREE.Mesh(new THREE.CylinderGeometry(u * 0.42, u * 0.42, u * 0.04, 16, 1, false, -Math.PI / 2, Math.PI), mat('#ff7a2a'));
  outline(visor);
  visor.position.set(0, u * 1.5, u * 0.26);
  visor.scale.z = 1.15;
  visor.rotation.x = 0.22;
  const capButton = at(sphere(u * 0.05, '#ff7a2a'), 0, u * 1.82, 0);

  // ── drone porte-outils sur bras articulé, au-dessus de l'épaule gauche ──
  const droneAt = V(0.56, 1.5, -0.32);
  const elbow = V(0.5, 0.95, -0.72);
  const arm = [
    rod(V(0.22, 0.66, -0.7), elbow, u * 0.045, '#8994a3'),
    rod(elbow, droneAt, u * 0.04, '#8994a3'),
    at(sphere(u * 0.07, '#ff7a2a'), elbow.x, elbow.y, elbow.z),
  ];
  const drone = toolDrone(u * 0.17);
  drone.position.copy(droneAt);
  drone.rotation.set(0.05, 0.55, 0.08);

  // bouche dans la barbe : fente sombre au repos, s'ouvre (mâchoire) en parlant
  const mouthY = u * 0.99;
  const inner = sphere(u * 0.11, '#3a0f1a', { seg: 12 });
  const tongue = at(sphere(u * 0.07, '#d9606a', { seg: 10 }), 0, -u * 0.05, u * 0.03);
  const teeth = at(box(u * 0.14, u * 0.035, u * 0.06, '#f4efe6', { edges: false }), 0, u * 0.07, u * 0.05);
  const mouth = at(group([inner, tongue, teeth]), 0, mouthY, u * 0.33);
  const g = group([
    torso, ...shoulders, tee, ...collar, placket, belt, buckle, ...pouches, patch,
    ...straps, ...overs, ...buckles, pack, comm, commScreen, ...commKeys, commAnt, key,
    neck, head, beard, nose, ...ears, ...eyes, ...brows, glasses, ...tufts, ...sideburns, mouth,
    crown, front, capBand, visor, capButton, ...arm, drone,
  ]);
  const openMouth = (v: number) => {
    mouth.scale.set(1 + v * 0.15, 0.14 + v * 0.95, 0.6);
    mouth.position.y = mouthY - v * u * 0.05;
    tongue.visible = teeth.visible = v > 0.2;
  };
  openMouth(0);
  const droneEye = drone.userData.eye as THREE.Object3D;
  g.userData.setFace = (p: FacePose) => {
    openMouth(p.mouth);
    for (const e of eyes) {
      const [white, pupil, lid] = e.children;
      white.scale.y = p.blink ? 0.15 : 1;
      pupil.visible = !p.blink;
      lid.position.y = p.blink ? u * 1.36 : u * 1.42;
    }
    // le drone vit sa vie : il penche la tête et cligne à contretemps
    drone.rotation.z = 0.08 + Math.sin(p.phase * 1.3) * 0.07;
    droneEye.scale.y = p.phase > 0.9 && p.phase < 1.2 ? 0.25 : 1;
  };
  return g;
}

/** SYLVIE, IA de station : écran flottant à visage + anneaux. */
export function sylvie(h: number): THREE.Group {
  const u = h / 2;
  const frame = at(box(u * 1.3, u * 1.0, u * 0.18, '#16314a'), 0, u, 0);
  const screen = at(box(u * 1.16, u * 0.86, 0.01, '#1f7f73', { glow: true }), 0, u, u * 0.095);
  // visage en deux lignes (mêmes tailles que l'ancien label unique « ◉ ◉ / ‿ »)
  // devant la face avant de l'écran (sinon le texte est masqué)
  const glyph = (t: string, dy: number) => at(label(t, u * 1.0, u * 0.35, { color: '#d9fff4', bold: true }), 0, u + dy, u * 0.13);
  const eyesOpen = glyph('◉   ◉', u * 0.168);
  const smile = glyph('‿', -u * 0.168);
  // bouche parlante : ovale lumineux qui pulse
  const talk = at(cyl(u * 0.11, u * 0.11, 0.005, '#d9fff4', { glow: true, edges: false, shadow: false, seg: 16 }), 0, u - u * 0.16, u * 0.13);
  talk.rotation.x = Math.PI / 2;
  talk.visible = false;
  const ring = at(torus(u * 0.9, u * 0.03, '#7fffd4', { glow: true }), 0, u, -u * 0.1);
  const halo = at(glow('#7fffd4', u * 3, 0.35), 0, u, -u * 0.3);
  const g = group([halo, ring, frame, screen, eyesOpen, smile, talk]);
  g.userData.ring = ring;
  let eyesShut: THREE.Mesh | null = null;
  g.userData.setFace = (p: FacePose) => {
    const open = p.mouth > 0.12;
    smile.visible = !open;
    talk.visible = open;
    talk.scale.set(0.8 + p.mouth * 0.5, 1, 0.15 + p.mouth * 0.85);
    if (p.blink && !eyesShut) g.add((eyesShut = glyph('—   —', u * 0.168)));
    if (eyesShut) eyesShut.visible = p.blink;
    eyesOpen.visible = !p.blink;
    ring.rotation.z = p.phase * 0.4;
  };
  return g;
}

/** Cafard géant low-poly (origine au sol, tête vers +X). */
export function roach(len: number, crown = false): THREE.Group {
  const u = len;
  const shellM = at(sphere(u * 0.4, '#6b3a12', { seg: 12 }), 0, u * 0.22, 0);
  shellM.scale.set(1.25, 0.45, 0.8);
  const stripe = at(box(u * 0.9, u * 0.02, u * 0.02, '#2a1406', { edges: false }), 0, u * 0.4, 0);
  const head = at(sphere(u * 0.16, '#4a2608', { seg: 10 }), u * 0.52, u * 0.2, 0);
  const eyes = [-1, 1].map((s) => at(sphere(u * 0.045, '#ffd166', { glow: true, seg: 8 }), u * 0.62, u * 0.27, s * u * 0.08));
  const parts: THREE.Object3D[] = [shellM, stripe, head, ...eyes];
  for (const s of [-1, 1]) {
    for (let i = -1; i <= 1; i++) {
      const leg = at(cyl(u * 0.018, u * 0.012, u * 0.42, '#2a1406', { seg: 5, edges: false }), i * u * 0.22, u * 0.12, s * u * 0.32);
      leg.rotation.x = s * 1.05;
      leg.rotation.z = i * 0.3;
      parts.push(leg);
    }
    const ant = at(cyl(u * 0.01, u * 0.006, u * 0.7, '#2a1406', { seg: 4, edges: false }), u * 0.85, u * 0.5, s * u * 0.12);
    ant.rotation.z = -0.9;
    ant.rotation.x = s * 0.3;
    parts.push(ant);
  }
  // mandibules + bouche : s'écartent en parlant
  const maw = at(sphere(u * 0.05, '#1a0600', { seg: 8 }), u * 0.66, u * 0.13, 0);
  const mandibles = [-1, 1].map((s) => {
    const m = at(cyl(u * 0.022, u * 0.004, u * 0.12, '#2a1406', { seg: 5, edges: false }), u * 0.7, u * 0.12, s * u * 0.045);
    m.rotation.z = 1.35;
    return m;
  });
  parts.push(maw, ...mandibles);
  const antennae = parts.filter((p) => Math.abs(p.rotation.z + 0.9) < 1e-6);
  if (crown) {
    const c = at(cyl(u * 0.12, u * 0.1, u * 0.1, '#ffd166', { seg: 6 }), u * 0.55, u * 0.38, 0);
    parts.push(c);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      parts.push(at(cyl(0, u * 0.03, u * 0.08, '#ffd166', { seg: 4, edges: false }), u * 0.55 + Math.cos(a) * u * 0.1, u * 0.47, Math.sin(a) * u * 0.1));
    }
    parts.push(at(sphere(u * 0.03, '#ff5c7a', { glow: true }), u * 0.66, u * 0.4, 0));
  }
  const g = group(parts);
  maw.scale.y = 0.3;
  g.userData.setFace = (p: FacePose) => {
    maw.scale.set(1, 0.3 + p.mouth * 1.1, 1 + p.mouth * 0.4);
    mandibles.forEach((m, i) => (m.rotation.x = (i ? 1 : -1) * p.mouth * 0.7));
    eyes.forEach((e) => (e.scale.y = p.blink ? 0.2 : 1));
    antennae.forEach((a, i) => (a.rotation.y = Math.sin(p.phase * 1.9 + i) * 0.12));
  };
  return g;
}

/** Sprite cafard 2D placeholder (PIL, _briefs/roach-2d/) : art YAML de repli des salles ch.1 (`image: roach2d`). */
export const ROACH_SPRITE_URL = `${import.meta.env.BASE_URL}props/roach-2d.png`;
/** Cafards du plan de fin en sprites 2D GenAI (par défaut) ; `?roach2d=0` revient aux `roach()` 3D. */
export const ROACH_2D = typeof window === 'undefined' || new URLSearchParams(window.location.search).get('roach2d') !== '0';
/** Planche GenAI des cafards (_briefs/ch1/genai) : 4 cellules égales, alignées en bas. */
export const ROACH_SHEET_URL = `${import.meta.env.BASE_URL}props/ch1/roach-sheet.png`;
/** Poses de la planche, dans l'ordre des cellules : marche (2 frames, profil droite), 3/4 face, dressé en prière. */
export const ROACH_POSES = ['walk1', 'walk2', '34', 'worship'] as const;
export type RoachPose = (typeof ROACH_POSES)[number];
/** Rapport hauteur / largeur d'une cellule (362 × 336). */
const ROACH_CELL_RATIO = 336 / 362;
let roachSheet: THREE.Texture | null = null;
/** Une texture par (pose, sens) : clones de la planche (même image, une seule copie GPU), UV décalées. */
const roachFrames = new Map<string, THREE.Texture>();

function roachFrame(pose: RoachPose, facingRight: boolean): THREE.Texture {
  const key = `${pose}:${facingRight}`;
  let t = roachFrames.get(key);
  if (t) return t;
  // les clones faits avant la fin du chargement doivent être re-téléversés une fois l'image arrivée
  roachSheet ??= new THREE.TextureLoader().load(ROACH_SHEET_URL, () => roachFrames.forEach((f) => (f.needsUpdate = true)));
  roachSheet.colorSpace = THREE.SRGBColorSpace;
  t = roachSheet.clone();
  const i = ROACH_POSES.indexOf(pose);
  // sens : UV miroir (un scale.x négatif ne retourne pas un Sprite three.js)
  t.repeat.set(facingRight ? 0.25 : -0.25, 1);
  t.offset.set(facingRight ? i * 0.25 : (i + 1) * 0.25, 0);
  t.anisotropy = 4;
  if (roachSheet.image) t.needsUpdate = true;
  roachFrames.set(key, t);
  return t;
}

/**
 * Disque d'ombre au sol (un sprite ne projette pas d'ombre). Posé au-dessus des
 * revêtements plaqués sur le sol (dalle de la station y = 0.02, bandes, bac de
 * l'éclat…) et tiré vers la caméra en profondeur : sinon il s'enterre dessous.
 */
function spriteShadow(r: number, opacity = 0.38): THREE.Mesh {
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(r, 20),
    new THREE.MeshBasicMaterial({ color: '#12060a', transparent: true, opacity, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(1, 0.42, 1);
  shadow.position.y = 0.04;
  shadow.renderOrder = 1;
  return shadow;
}

export interface RoachSpriteOpts {
  pose?: RoachPose;
  /** Teinte multipliée (lumière de la pièce : les sprites ne sont pas éclairés). */
  tint?: THREE.ColorRepresentation;
}

/**
 * Cafard en billboard 2D GenAI, même repère que `roach(len)` (pieds en y = 0) :
 * le sprite fait toujours face à la caméra ; `facingRight` = tête vers +x écran.
 * Matériau propre à chaque cafard (teinte, surbrillance de hotspot) ; la frame
 * (et le sens) se changent avec `userData.setPose(pose, right?)`. Ombre = disque sombre au sol.
 */
export function roachSprite(len: number, facingRight = true, o: RoachSpriteOpts = {}): THREE.Group {
  const w = len * 1.15;
  const material = new THREE.SpriteMaterial({ map: roachFrame(o.pose ?? 'walk1', facingRight), color: o.tint ?? '#ffffff', alphaTest: 0.12, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.center.set(0.5, 0.02);
  sprite.scale.set(w, w * ROACH_CELL_RATIO, 1);
  const g = group([spriteShadow(len * 0.45), sprite]);
  g.userData.sprite = sprite;
  let facing = facingRight;
  g.userData.setPose = (pose: RoachPose, right = facing) => {
    facing = right;
    const map = roachFrame(pose, right);
    if (material.map !== map) material.map = map;
  };
  return g;
}

const billboardMaps = new Map<string, THREE.Texture>();

/**
 * Personnage GenAI en pied (Reine, Scribe) plaqué en billboard : sprite ancré
 * en bas (pieds en y = 0), hauteur `h` monde, rapport largeur / hauteur
 * `aspect` de l'image. Ombre disque au sol. `userData.sprite` = le Sprite
 * (respiration / balancement animés par la pièce).
 */
export function billboard(url: string, h: number, aspect: number, o: { tint?: THREE.ColorRepresentation; shadow?: number } = {}): THREE.Group {
  let map = billboardMaps.get(url);
  if (!map) {
    map = new THREE.TextureLoader().load(url);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    billboardMaps.set(url, map);
  }
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, color: o.tint ?? '#ffffff', alphaTest: 0.12, transparent: true }));
  sprite.center.set(0.5, 0.008);
  sprite.scale.set(h * aspect, h, 1);
  const g = group([spriteShadow(o.shadow ?? h * aspect * 0.4), sprite]);
  g.userData.sprite = sprite;
  return g;
}

/** Une frame de planche et sa durée (ms). */
export interface ActorStep {
  frame: number;
  duration: number;
}

/**
 * Boucles d'un personnage en billboard à planche : `idle` au repos, `talk`
 * quand la boîte de dialogue le fait parler (frappe en cours), `listen`
 * (frame fixe) entre deux répliques à lui.
 */
export interface ActorLoops {
  idle: readonly ActorStep[];
  talk?: readonly ActorStep[];
  listen?: number;
}

/** Frame d'une boucle à l'instant `ms`. */
function loopFrame(steps: readonly ActorStep[], ms: number): number {
  const total = steps.reduce((a, s) => a + s.duration, 0);
  let x = ((ms % total) + total) % total;
  for (const s of steps) {
    if (x < s.duration) return s.frame;
    x -= s.duration;
  }
  return steps[0].frame;
}

/** Frame à afficher pour le personnage `id` à l'instant `t` (s), selon qu'il parle (engine/speaking). */
export function actorFrame(id: string, loops: ActorLoops, t: number): number {
  if (speaking.id === id) {
    if (speaking.talking && loops.talk) return loopFrame(loops.talk, t * 1000);
    if (loops.listen !== undefined) return loops.listen;
  }
  return loopFrame(loops.idle, t * 1000);
}

const sheetFrames = new Map<string, THREE.Texture[]>();

/**
 * Billboard GenAI à planche : `frames` cellules égales côte à côte (même cadre
 * que l'image fixe, pieds en bas), une texture-clone par cellule (une seule
 * copie GPU). `userData.setFrame(i)` change de cellule ; `userData.sprite` comme `billboard`.
 */
export function billboardSheet(url: string, frames: number, h: number, aspect: number, o: { tint?: THREE.ColorRepresentation; shadow?: number } = {}): THREE.Group {
  let maps = sheetFrames.get(url);
  if (!maps) {
    const all: THREE.Texture[] = [];
    const base = new THREE.TextureLoader().load(url, () => all.forEach((f) => (f.needsUpdate = true)));
    base.colorSpace = THREE.SRGBColorSpace;
    for (let i = 0; i < frames; i++) {
      const t = base.clone();
      t.repeat.set(1 / frames, 1);
      t.offset.set(i / frames, 0);
      t.anisotropy = 8;
      all.push(t);
    }
    maps = all;
    sheetFrames.set(url, maps);
  }
  const material = new THREE.SpriteMaterial({ map: maps[0], color: o.tint ?? '#ffffff', alphaTest: 0.12, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.center.set(0.5, 0.008);
  sprite.scale.set(h * aspect, h, 1);
  const g = group([spriteShadow(o.shadow ?? h * aspect * 0.4), sprite]);
  g.userData.sprite = sprite;
  const list = maps;
  g.userData.setFrame = (i: number) => {
    const m = list[Math.max(0, Math.min(list.length - 1, i))];
    if (material.map !== m) material.map = m;
  };
  return g;
}

/**
 * Planches in-world (_briefs/polish-placements/genai/tools/strip.py : seules
 * les zones qui bougent viennent des variantes GenAI, le reste est l'image fixe).
 *   Reine : 0 repos · 1 mandibules écartées (la cellule « antennes qui ondulent » a été retirée de
 *     la planche : antennes en mât jusqu'au halo du trône)
 *   Scribe : 0 repos · 1 mandibules écartées · 2 antennes qui ondulent (hors cycle, même défaut)
 *   Sabot : 0 repos (tampon levé) · 1 clignement · 2 parle · 3 agacé · 4 impact (tampon sur le plateau)
 *   Patience (avec / sans ticket) : 0 repos · 1 mâchoire ouverte · 2 soupir (crâne penché)
 */
/**
 * Reine : planche v2 (OpenAI gpt-image-2.6-sunburst, même ADN que le portrait d'encart ;
 * _briefs/reine/regen-v2). Cellules 729 × 1024 = l'art 697 × 1024 centré avec 16 px transparents
 * de chaque côté (anti sheet bleed au mipmap). Cadrage commun aux deux cellules (pas de jitter).
 * Nouveau nom de fichier à chaque refonte : le navigateur garde l'ancienne planche en cache.
 */
export const REINE_SHEET = `${import.meta.env.BASE_URL}props/ch1/reine-planche-v2.png`;
export const REINE_FRAMES = 2;
export const REINE_SHEET_ASPECT = 729 / 1024;
export const SCRIBE_SHEET = `${import.meta.env.BASE_URL}props/ch1/scribe-sheet.png`;
/**
 * v5 : la planche d'origine (GenAI, 5 cellules), bras dessiné d'un seul tenant épaule → manche →
 * coude → avant-bras → poing → tampon sur CHAQUE cellule — aucune découpe, aucune régénération du
 * flanc. 0 repos (tampon levé) · 1 clignement · 2 parle · 3 agacé · 4 impact (tampon au plateau).
 * Le corps et la tête de la cellule 4 sont pixel-identiques au repos (seul le bras change).
 * Tout est transparent sous `SABOT_DESK_PX` (= bas du tampon à l'impact) : le billboard est calé
 * pour que cette ligne tombe pile sur le plateau 3D, et à l'impact le tampon est posé dessus.
 * v6 : même planche, mais l'emmanchure du bras au tampon est repeinte localement (≈ 450–650 px par
 * cellule) : le contour noir épais + l'ombre entre manche et gilet, qui se lisaient comme un trou,
 * sont remplacés par la manche beige jusqu'au liseré orange (pont opaque, 1 px de trait au plus).
 */
export const SABOT_SHEET = `${import.meta.env.BASE_URL}props/st/sabot-sheet-v6.png`;
export const SABOT_FRAMES = 5;
export const SABOT_DESK_PX = 441;
/** Centre du tampon à l'impact (cellule 4), en px de planche depuis la gauche. */
export const SABOT_STAMP_PX = 200;
export const PATIENCE_SHEET = `${import.meta.env.BASE_URL}props/st/patience-sheet.png`;
export const PATIENCE_EMPTY_SHEET = `${import.meta.env.BASE_URL}props/st/patience-vide-sheet.png`;
/**
 * Cafards parlants (Reine, Scribe) : règle absolue, comme Mme Guichard — pas de boucle `talk`, le
 * billboard ne se synchronise jamais sur le dialogue (seul le portrait de la boîte de dialogue
 * parle). Au repos, de loin en loin, un petit cliquetis de mandibules. Jamais la frame 2 (antennes).
 */
export const ROACH_ACTOR: ActorLoops = {
  idle: [
    { frame: 0, duration: 5200 },
    { frame: 1, duration: 140 },
    { frame: 0, duration: 110 },
    { frame: 1, duration: 120 },
    { frame: 0, duration: 7400 },
    { frame: 1, duration: 150 },
  ],
};
/** Pas de `talk` ni de `listen` : seul le portrait de la boîte de dialogue parle, le billboard reste au guichet et tamponne. */
export const SABOT_ACTOR: ActorLoops = {
  // coup de tampon : levé (0) → impact (4) → levé ; deux poses, toutes deux dessinées d'un seul tenant
  idle: [
    { frame: 0, duration: 1900 },
    { frame: 1, duration: 120 },
    { frame: 0, duration: 1500 },
    { frame: 4, duration: 320 },
    { frame: 0, duration: 1600 },
    { frame: 1, duration: 110 },
    { frame: 0, duration: 1000 },
    { frame: 4, duration: 240 },
    { frame: 0, duration: 160 },
    { frame: 4, duration: 300 },
    { frame: 0, duration: 300 },
  ],
};
export const PATIENCE_ACTOR: ActorLoops = {
  idle: [
    { frame: 0, duration: 5200 },
    { frame: 2, duration: 1600 },
    { frame: 0, duration: 3800 },
    { frame: 1, duration: 300 },
    { frame: 0, duration: 2600 },
    { frame: 2, duration: 1300 },
  ],
  talk: [
    { frame: 1, duration: 180 },
    { frame: 0, duration: 140 },
  ],
};
/** Siège vide de salle d'attente (GenAI, même style que la chaise de M. Patience, 589 × 768). */
export const SIEGE_URL = `${import.meta.env.BASE_URL}props/st/siege.png`;
export const SIEGE_ASPECT = 589 / 768;
/** Siège de pilote en carapace de cafard de la capsule CS-07 (interlude ; GenAI, 610 × 1024). */
export const SIEGE_CARAPACE_URL = `${import.meta.env.BASE_URL}props/interlude/siege-carapace.png`;
export const SIEGE_CARAPACE_ASPECT = 610 / 1024;

/** Sa Majesté Blattaria XIV en pied (GenAI v2 qualité portrait, 697 × 1024, _briefs/ch1/genai-fix/cutout.py). */
export const REINE_URL = `${import.meta.env.BASE_URL}props/ch1/reine.png`;
export const REINE_ASPECT = 697 / 1024;
/** Frère Élytre, Grand Scribe, en pied (GenAI, 637 × 1024, _briefs/ch1/genai-fix/cutout.py). */
export const SCRIBE_URL = `${import.meta.env.BASE_URL}props/ch1/scribe.png`;
export const SCRIBE_ASPECT = 637 / 1024;
/** Gary à plat ventre (cliffhanger B-7), vu de profil, tête à gauche (GenAI, 1024 × 397, _briefs/ch1/genai-fix/cutout.py). */
export const GARY_PRONE_URL = `${import.meta.env.BASE_URL}props/ch1/gary-a-plat.png`;
export const GARY_PRONE_ASPECT = 1024 / 397;
/** M. Jean-Claude Sabot, agent de fourrière, tampon levé (GenAI, 772 × 1024). */
export const SABOT_URL = `${import.meta.env.BASE_URL}props/st/sabot.png`;
export const SABOT_ASPECT = 772 / 1024;
/** M. Roger Remorque, gardien de fourrière (GenAI, ≠ Sabot du sas) — 0 repos · 1 parle. */
export const REMORQUE_SHEET = `${import.meta.env.BASE_URL}props/st/remorque-sheet.png`;
export const REMORQUE_ASPECT = 642 / 768;
export const REMORQUE_URL = `${import.meta.env.BASE_URL}props/st/remorque.png`;
/** Il marmonne un règlement, de temps en temps, en tintant son trousseau de sabots. */
export const REMORQUE_ACTOR: ActorLoops = {
  idle: [
    { frame: 0, duration: 4800 },
    { frame: 1, duration: 280 },
    { frame: 0, duration: 200 },
    { frame: 1, duration: 260 },
    { frame: 0, duration: 6200 },
    { frame: 1, duration: 240 },
  ],
  talk: [
    { frame: 1, duration: 160 },
    { frame: 0, duration: 120 },
    { frame: 1, duration: 180 },
    { frame: 0, duration: 110 },
  ],
  listen: 0,
};

/**
 * Mme Odile Guichard derrière l'hygiaphone, coupée à la ligne du comptoir (GenAI v3/v4 OpenAI
 * gpt-image-2.6-sunburst, édition de guichard.png, badge « Mme Guichard » ; _briefs/guichet/genai/v4).
 * Planche 5 cellules d'occupations de bureau absurdes : 0 sandwich (retirée du cycle : il masquait
 * le visage, plus de sandwich dans le guichet) · 1 élastique tendu en lance-pierre · 2 château de
 * cartes sur la paume · 3 chaîne de trombones · 4 balle d'élastiques sur le doigt. Pas de boucle
 * `talk` : le billboard ne se synchronise jamais sur le dialogue (seul le portrait de la boîte de
 * dialogue parle).
 */
export const GUICHARD_URL = `${import.meta.env.BASE_URL}props/st/guichard.png`;
export const GUICHARD_SHEET = `${import.meta.env.BASE_URL}props/st/guichard-sheet.png`;
export const GUICHARD_FRAMES = 5;
export const GUICHARD_ASPECT = 753 / 768;
export const GUICHARD_ACTOR: ActorLoops = {
  // une occupation toutes les ~6–8 s, la balle d'élastiques (calme, menton dans la main) entre deux
  idle: [
    { frame: 4, duration: 6500 },
    { frame: 1, duration: 5500 },
    { frame: 4, duration: 5000 },
    { frame: 2, duration: 7500 },
    { frame: 4, duration: 5000 },
    { frame: 3, duration: 6000 },
  ],
};
/**
 * Acte II (Aile B) : M. Régis Duplicata (Archives) et Mme Gisèle Tamponnet (Tampons), bustes coupés
 * au comptoir (GenAI gpt-image-2.6-sunburst, style de guichard.png ; _briefs/acte2/genai/build.py).
 * Planches 2 cellules : 0 repos · 1 marmonne (visage « parle » recollé sur le repos). Comme Mme
 * Guichard, jamais synchronisées sur le dialogue : seul le portrait de la boîte de dialogue parle.
 * M. Duplicata a 3 cellules de plus (_briefs/acte2/genai/build_duplicata_busy.py) : 2 lit, tête
 * baissée · 3 coup d'œil soupçonneux au tampon du bureau · 4 tasse ses deux feuilles.
 */
export const DUPLICATA_SHEET = `${import.meta.env.BASE_URL}props/st/duplicata-sheet.png`;
export const DUPLICATA_ASPECT = 708 / 768;
/**
 * Toujours absorbé par ses papiers (jamais face caméra, même quand il parle) : il lit, tasse ses
 * feuilles, jette un œil au tampon, relit. Le repos face caméra (0) et la frame qui marmonne (1)
 * restent sur la planche mais sortent du cycle.
 */
export const DUPLICATA_ACTOR: ActorLoops = {
  idle: [
    { frame: 2, duration: 4800 },
    { frame: 4, duration: 700 },
    { frame: 2, duration: 3600 },
    { frame: 3, duration: 1500 },
    { frame: 2, duration: 5200 },
    { frame: 4, duration: 600 },
    { frame: 2, duration: 300 },
    { frame: 4, duration: 600 },
    { frame: 2, duration: 2800 },
    { frame: 3, duration: 1200 },
  ],
};
export const TAMPONNET_SHEET = `${import.meta.env.BASE_URL}props/st/tamponnet-sheet.png`;
export const TAMPONNET_ASPECT = 839 / 768;
/** Un « CLONK » ravi à chaque coup de tampon dans le vide (la planche suit le coup, pas la voix). */
export const TAMPONNET_ACTOR: ActorLoops = {
  idle: [
    { frame: 0, duration: 2600 },
    { frame: 1, duration: 420 },
    { frame: 0, duration: 3100 },
    { frame: 1, duration: 380 },
    { frame: 0, duration: 1900 },
  ],
};
/**
 * Acte III (Aile B) : M. Hubert Delaigue (0 endormi · 1 réveillé, gobelet à la main) et PERCO
 * (0 en grève · 1 au travail). Frame pilotée par les flags (`st_delaigue_reveille`, `st_greve_finie`),
 * jamais par le dialogue (_briefs/acte3/genai/build.py).
 */
export const DELAIGUE_SHEET = `${import.meta.env.BASE_URL}props/st/delaigue-sheet.png`;
export const DELAIGUE_ASPECT = 764 / 768;
export const PERCO_SHEET = `${import.meta.env.BASE_URL}props/st/perco-sheet.png`;
export const PERCO_ASPECT = 548 / 1024;
/**
 * Acte IV : Mme Augustine Paraphe (0 repos · 1 parle, planche jamais synchronisée sur le dialogue) et la
 * capsule CS-07 vue du quai (0 sabot · 1 libérée, `st_vaisseau_libere`) — _briefs/acte4/genai/build.py.
 */
export const PARAPHE_SHEET = `${import.meta.env.BASE_URL}props/st/paraphe-sheet.png`;
export const PARAPHE_ASPECT = 667 / 768;
/** Elle pince les lèvres, puis paraphe dans le vide (« A.P. »). */
export const PARAPHE_ACTOR: ActorLoops = {
  idle: [
    { frame: 0, duration: 5200 },
    { frame: 1, duration: 420 },
    { frame: 0, duration: 6400 },
    { frame: 1, duration: 300 },
  ],
};
export const CAPSULE_SHEET = `${import.meta.env.BASE_URL}props/st/capsule-sheet.png`;
export const CAPSULE_ASPECT = 752 / 768;
/** M. Patience assis sur sa chaise, ticket 9 848 tendu ; variante main vide (même cadre) une fois le ticket pris. */
export const PATIENCE_URL = `${import.meta.env.BASE_URL}props/st/patience.png`;
export const PATIENCE_EMPTY_URL = `${import.meta.env.BASE_URL}props/st/patience-vide.png`;
export const PATIENCE_ASPECT = 792 / 1024;

/** Texture de la plaque « Règlement n°1 » : émail bleu nuit, bandeau rouge, gravure ambre. */
function reglementTexture(aspect: number): THREE.CanvasTexture {
  const W = 1024;
  const H = Math.round(W / aspect);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const DISPLAY = 'Bungee, "Chakra Petch", Impact, sans-serif';
  const UI = '"Chakra Petch", "Trebuchet MS", sans-serif';
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1d2148');
  bg.addColorStop(1, '#10122c');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  // filet intérieur cyan + équerres
  const m = 34;
  g.strokeStyle = '#7fffd4';
  g.globalAlpha = 0.5;
  g.lineWidth = 3;
  g.strokeRect(m, m, W - m * 2, H - m * 2);
  g.globalAlpha = 1;
  g.lineWidth = 8;
  for (const [x, y, dx, dy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) {
    g.beginPath();
    g.moveTo(x + dx * 60, y);
    g.lineTo(x, y);
    g.lineTo(x, y + dy * 60);
    g.stroke();
  }
  // bandeau rouge
  const bandY = m + 22;
  const bandH = H * 0.16;
  g.fillStyle = '#d62839';
  g.fillRect(m + 22, bandY, W - (m + 22) * 2, bandH);
  g.fillStyle = '#ffffff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `${Math.round(bandH * 0.55)}px ${DISPLAY}`;
  g.fillText(tr('props.rule.band'), W / 2, bandY + bandH / 2 + 2);
  // bande de danger
  const hzY = bandY + bandH + 10;
  g.save();
  g.beginPath();
  g.rect(m + 22, hzY, W - (m + 22) * 2, 16);
  g.clip();
  g.fillStyle = '#ffd166';
  g.fillRect(0, hzY, W, 16);
  g.fillStyle = '#10122c';
  for (let x = -20; x < W; x += 36) {
    g.beginPath();
    g.moveTo(x, hzY + 16);
    g.lineTo(x + 16, hzY);
    g.lineTo(x + 34, hzY);
    g.lineTo(x + 18, hzY + 16);
    g.fill();
  }
  g.restore();
  // consigne
  const lines = trl('props.rule.lines');
  let size = H * 0.13;
  g.font = `${size}px ${DISPLAY}`;
  const widest = Math.max(...lines.map((l) => g.measureText(l).width));
  if (widest > W * 0.8) size *= (W * 0.8) / widest;
  g.font = `${size}px ${DISPLAY}`;
  g.fillStyle = '#ffd166';
  g.shadowColor = '#ffd166';
  g.shadowBlur = 14;
  const textY = hzY + 30 + size * 0.75;
  lines.forEach((l, i) => g.fillText(l, W / 2, textY + i * size * 1.15));
  g.shadowBlur = 0;
  // petits caractères
  g.font = `600 ${Math.round(H * 0.035)}px ${UI}`;
  g.fillStyle = '#a39cc4';
  g.fillText(tr('props.rule.small'), W / 2, textY + size * 1.15 + size * 0.9);
  // ajout au marqueur, de travers
  g.save();
  g.translate(W * 0.6, H - m - H * 0.09);
  g.rotate(-0.05);
  g.font = `italic 600 ${Math.round(H * 0.05)}px ${UI}`;
  g.fillStyle = '#f6efe2';
  g.globalAlpha = 0.85;
  g.fillText(tr('props.rule.note'), 0, 0);
  g.restore();
  // usure : rayures fines
  g.globalAlpha = 0.06;
  g.strokeStyle = '#ffffff';
  g.lineWidth = 1.5;
  for (let i = 0; i < 40; i++) {
    const x = (i * 197) % W;
    const y = (i * 131) % H;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + 30 + (i % 5) * 12, y + (i % 3) * 4 - 4);
    g.stroke();
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/**
 * Plaque réglementaire émaillée « Règlement n°1 », vissée au mur : cadre
 * acier, quatre rivets, liseuse lumineuse au-dessus. Face +Z, origine au centre.
 */
export function reglementPlaque(w: number, h: number): THREE.Group {
  const d = 0.06;
  const frame = box(w, h, d, '#3a3f52');
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.94, h * 0.92), mat('#ffffff', { map: reglementTexture((w * 0.94) / (h * 0.92)) }));
  face.receiveShadow = true;
  face.position.z = d / 2 + 0.003;
  const rivets = [-1, 1].flatMap((sx) => [-1, 1].map((sy) => at(sphere(w * 0.012, '#c9ced6', { seg: 8 }), sx * w * 0.485, sy * h * 0.47, d / 2 + 0.006)));
  // liseuse : réglette métal + tube lumineux + halo
  const lampY = h / 2 + h * 0.07;
  const arm = at(box(w * 0.5, h * 0.05, 0.14, '#2b2f3a'), 0, lampY, 0.08);
  const tube = at(box(w * 0.46, h * 0.018, 0.02, '#fff1c4', { glow: true }), 0, lampY - h * 0.03, 0.14);
  const halo = at(glow('#fff1c4', w * 0.9, 0.22), 0, lampY - h * 0.08, 0.12);
  halo.scale.y = 0.35;
  return group([frame, face, ...rivets, arm, tube, halo]);
}

/** Image GenAI du polaroid (remplace le dessin si présente dans public/props/). */
export const MOM_PHOTO_URL = `${import.meta.env.BASE_URL}props/mom-photo-genai.jpg`;

/** Scène dessinée du polaroid (repli sans image GenAI) : la mère et Gary « capitaine ». */
function drawMomScene(g: CanvasRenderingContext2D, m: number, pw: number, ph: number): void {
  const INK = '#1a1230';
  const shape = (fill: string, draw: () => void, line = 5) => {
    g.beginPath();
    draw();
    g.fillStyle = fill;
    g.fill();
    g.lineWidth = line;
    g.strokeStyle = INK;
    g.stroke();
  };
  const ell = (x: number, y: number, rx: number, ry: number, rot = 0) => g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  // fond de studio photo : ciel étoilé peint, planète à anneau
  const bg = g.createLinearGradient(0, m, 0, m + ph);
  bg.addColorStop(0, '#2b3f8f');
  bg.addColorStop(1, '#8a6fc4');
  g.fillStyle = bg;
  g.fillRect(m, m, pw, ph);
  g.fillStyle = '#fff4c8';
  for (let i = 0; i < 26; i++) {
    g.globalAlpha = 0.5 + (i % 3) * 0.2;
    g.fillRect(m + ((i * 167) % pw), m + ((i * 89) % (ph * 0.6)), 4, 4);
  }
  g.globalAlpha = 1;
  shape('#ffb347', () => ell(m + pw * 0.86, m + 70, 34, 34), 4);
  g.beginPath();
  ell(m + pw * 0.86, m + 70, 62, 14, -0.3);
  g.lineWidth = 6;
  g.strokeStyle = '#ffd166';
  g.stroke();

  // ── la mère (gauche) : cardigan rose, perles, brushing mauve, lunettes ──
  const mx = m + pw * 0.3;
  shape('#f27aa8', () => {
    g.moveTo(mx - 120, m + ph + 10);
    g.quadraticCurveTo(mx - 110, m + 300, mx, m + 290);
    g.quadraticCurveTo(mx + 110, m + 300, mx + 120, m + ph + 10);
  });
  shape('#c95684', () => {
    g.moveTo(mx - 24, m + 296);
    g.lineTo(mx, m + ph + 10);
    g.lineTo(mx + 24, m + 296);
  }, 4);
  // cheveux : nuage de boucles
  for (const [dx, dy, r] of [[-62, -10, 38], [62, -10, 38], [-46, -62, 40], [46, -62, 40], [0, -84, 44], [-70, 40, 30], [70, 40, 30]]) {
    shape('#b9a2e0', () => ell(mx + dx, m + 210 + dy, r, r), 4);
  }
  shape('#f0bf94', () => ell(mx, m + 222, 62, 70));
  // perles
  g.lineWidth = 3;
  for (let i = -4; i <= 4; i++) shape('#fff8ee', () => ell(mx + i * 13, m + 302 + Math.abs(i) * -3 + 12, 7, 7), 3);
  // lunettes rondes
  g.lineWidth = 5;
  g.strokeStyle = INK;
  for (const sx of [-1, 1]) {
    g.beginPath();
    ell(mx + sx * 26, m + 212, 21, 19);
    g.stroke();
  }
  g.beginPath();
  g.moveTo(mx - 6, m + 210);
  g.lineTo(mx + 6, m + 210);
  g.stroke();
  // yeux plissés de fierté
  for (const sx of [-1, 1]) {
    g.beginPath();
    g.arc(mx + sx * 26, m + 216, 9, Math.PI * 1.15, Math.PI * 1.85);
    g.stroke();
  }
  // joues + grand sourire
  g.fillStyle = '#ff8fa3';
  g.globalAlpha = 0.6;
  for (const sx of [-1, 1]) {
    g.beginPath();
    ell(mx + sx * 40, m + 246, 13, 9);
    g.fill();
  }
  g.globalAlpha = 1;
  shape('#8c1f3a', () => {
    g.moveTo(mx - 30, m + 248);
    g.quadraticCurveTo(mx, m + 292, mx + 30, m + 248);
    g.closePath();
  }, 4);

  // ── Gary (droite) en uniforme de capitaine : veste marine, épaulettes, casquette galonnée ──
  const gx = m + pw * 0.72;
  shape('#1f2d5c', () => {
    g.moveTo(gx - 118, m + ph + 10);
    g.quadraticCurveTo(gx - 112, m + 312, gx, m + 304);
    g.quadraticCurveTo(gx + 112, m + 312, gx + 118, m + ph + 10);
  });
  shape('#f4efe6', () => {
    g.moveTo(gx - 22, m + 306);
    g.lineTo(gx, m + 360);
    g.lineTo(gx + 22, m + 306);
  }, 4);
  for (const sx of [-1, 1]) {
    shape('#ffd166', () => g.rect(gx + sx * 92 - 26, m + 318, 52, 16), 4);
    g.fillStyle = '#ffd166';
    for (let k = 0; k < 5; k++) g.fillRect(gx + sx * 92 - 22 + k * 10, m + 334, 4, 14);
  }
  for (const y of [376, 410]) shape('#ffd166', () => ell(gx - 32, m + y, 7, 7), 3);
  shape('#f0bf94', () => ell(gx, m + 236, 58, 66));
  // favoris bruns
  for (const sx of [-1, 1]) shape('#5e3a1f', () => ell(gx + sx * 54, m + 218, 10, 24), 4);
  // casquette : calotte blanche, bandeau marine galonné d'or, visière noire, insigne
  shape('#f8f6f0', () => ell(gx, m + 160, 84, 30));
  shape('#1f2d5c', () => g.rect(gx - 60, m + 162, 120, 30), 4);
  g.fillStyle = '#ffd166';
  g.fillRect(gx - 58, m + 172, 116, 7);
  shape('#ffd166', () => {
    g.moveTo(gx, m + 140);
    g.lineTo(gx + 14, m + 162);
    g.lineTo(gx, m + 184);
    g.lineTo(gx - 14, m + 162);
    g.closePath();
  }, 3);
  shape('#16161e', () => {
    g.moveTo(gx - 62, m + 192);
    g.quadraticCurveTo(gx, m + 222, gx + 62, m + 192);
    g.closePath();
  }, 4);
  // yeux ronds de fierté + sourire niais
  for (const sx of [-1, 1]) shape(INK, () => ell(gx + sx * 20, m + 232, 6, 8), 2);
  g.lineWidth = 5;
  g.strokeStyle = INK;
  g.beginPath();
  g.arc(gx, m + 248, 28, Math.PI * 0.15, Math.PI * 0.85);
  g.stroke();
  // la main de la mère sur l'épaule du capitaine
  shape('#f0bf94', () => ell(gx - 86, m + 336, 20, 15, -0.4), 4);
  // cœurs qui flottent
  const heart = (x: number, y: number, s: number) =>
    shape('#ff4f7b', () => {
      g.moveTo(x, y + s * 0.9);
      g.bezierCurveTo(x - s * 1.4, y - s * 0.1, x - s * 0.6, y - s * 1.1, x, y - s * 0.35);
      g.bezierCurveTo(x + s * 0.6, y - s * 1.1, x + s * 1.4, y - s * 0.1, x, y + s * 0.9);
    }, 3);
  heart(mx - 92, m + 82, 18);
  heart(mx + 70, m + 66, 13);
}

/** Cœur (chemin seul), pointe en bas, centré sur (x, y). */
function heartPath(g: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  g.beginPath();
  g.moveTo(x, y + s * 0.9);
  g.bezierCurveTo(x - s * 1.4, y - s * 0.1, x - s * 0.6, y - s * 1.1, x, y - s * 0.35);
  g.bezierCurveTo(x + s * 0.6, y - s * 1.1, x + s * 1.4, y - s * 0.1, x, y + s * 0.9);
}

/**
 * Texture du polaroid de Mme Plunk : tirage (image GenAI si fournie, sinon
 * la scène dessinée), légende au stylo, cœur au feutre, baiser au rouge à
 * lèvres et coin corné. Le coin replié est transparent (le casier se voit
 * dessous). Haute définition : la caméra vient le lire de près.
 */
function momPhotoTexture(): THREE.CanvasTexture {
  const W = 512;
  const H = 620;
  const S = 2;
  const c = document.createElement('canvas');
  c.width = W * S;
  c.height = H * S;
  const g = c.getContext('2d')!;
  const UI = '"Chakra Petch", "Trebuchet MS", sans-serif';
  const m = 30;
  const pw = W - m * 2;
  const ph = 400; // tirage 452×400 : ratio de public/props/mom-photo-genai.jpg
  const E = 78; // coin corné (bas droite)
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  const paint = (img?: HTMLImageElement) => {
    g.setTransform(S, 0, 0, S, 0, 0);
    g.clearRect(0, 0, W, H);
    // papier du polaroid, légèrement jauni, amputé du coin replié
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(W, 0);
    g.lineTo(W, H - E);
    g.lineTo(W - E, H);
    g.lineTo(0, H);
    g.closePath();
    g.fillStyle = '#f6f0e0';
    g.fill();
    g.save();
    g.beginPath();
    g.rect(m, m, pw, ph);
    g.clip();
    if (img) {
      // recadrage « cover » de l'image GenAI dans la fenêtre du tirage
      const k = Math.max(pw / img.naturalWidth, ph / img.naturalHeight);
      const iw = img.naturalWidth * k;
      const ih = img.naturalHeight * k;
      g.drawImage(img, m + (pw - iw) / 2, m + (ph - ih) / 2, iw, ih);
    } else {
      drawMomScene(g, m, pw, ph);
    }
    // virage chaud d'un vieux tirage
    g.globalAlpha = 0.1;
    g.fillStyle = '#ffb347';
    g.fillRect(m, m, pw, ph);
    g.globalAlpha = 1;
    // baiser au rouge à lèvres sur la veste du capitaine
    g.save();
    g.translate(m + pw - 70, m + ph - 46);
    g.rotate(-0.3);
    g.globalAlpha = 0.78;
    g.fillStyle = '#d81e4a';
    for (const sy of [-1, 1]) {
      g.beginPath();
      g.moveTo(-36, 0);
      g.bezierCurveTo(-24, sy * 22, -8, sy * 20, 0, sy * (sy < 0 ? 8 : 18));
      g.bezierCurveTo(8, sy * 20, 24, sy * 22, 36, 0);
      g.quadraticCurveTo(0, sy * 4, -36, 0);
      g.fill();
    }
    g.globalAlpha = 1;
    g.restore();
    g.restore();
    g.lineWidth = 3;
    g.strokeStyle = '#cfc6b0';
    g.strokeRect(m, m, pw, ph);
    // légende au stylo bleu, de travers
    g.save();
    g.translate(W / 2 - 14, m + ph + (H - m - ph) / 2 + 2);
    g.rotate(-0.04);
    g.font = `italic 700 50px ${UI}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#2440a8';
    g.fillText(tr('props.placard.momPhoto'), 0, 0, W - E - 40);
    g.restore();
    // petit cœur au feutre rouge, repassé deux fois
    g.lineWidth = 5;
    g.lineJoin = 'round';
    g.strokeStyle = '#e0304f';
    heartPath(g, 46, m + ph + 28, 16);
    g.stroke();
    heartPath(g, 48, m + ph + 29, 15);
    g.stroke();
    // coin corné : ombre portée puis rabat (verso du papier, plus terne)
    g.fillStyle = 'rgba(20,12,40,0.28)';
    g.beginPath();
    g.moveTo(W, H - E);
    g.lineTo(W - E - 6, H - E + 4);
    g.lineTo(W - E, H);
    g.closePath();
    g.fill();
    g.beginPath();
    g.moveTo(W, H - E);
    g.lineTo(W - E, H - E);
    g.lineTo(W - E, H);
    g.closePath();
    g.fillStyle = '#ddd2b6';
    g.fill();
    g.lineWidth = 2;
    g.strokeStyle = '#b9ad90';
    g.stroke();
    t.needsUpdate = true;
  };
  paint();
  const img = new Image();
  img.onload = () => paint(img);
  // pas d'image GenAI déposée : on garde le dessin
  img.onerror = () => {};
  img.src = MOM_PHOTO_URL;
  return t;
}

/** Texture de papier manuscrit (post-it, scotch de masquage) : texte au feutre, découpé en lignes. */
function noteTexture(text: string, aspect: number, o: { paper: string; ink: string; tape?: boolean; torn?: boolean }): THREE.CanvasTexture {
  const H = 512;
  const W = Math.round(H * aspect);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const UI = '"Chakra Petch", "Trebuchet MS", sans-serif';
  g.fillStyle = o.paper;
  if (o.torn) {
    // bords déchirés du ruban adhésif
    g.beginPath();
    g.moveTo(0, 0);
    for (let x = 0; x <= W; x += 24) g.lineTo(x, (x / 24) % 2 ? 10 : 0);
    g.lineTo(W, H);
    for (let x = W; x >= 0; x -= 24) g.lineTo(x, H - ((x / 24) % 2 ? 10 : 0));
    g.closePath();
    g.fill();
  } else {
    g.fillRect(0, 0, W, H);
    // bande adhésive plus sombre en haut, ombre du coin décollé en bas
    g.fillStyle = 'rgba(0,0,0,0.06)';
    g.fillRect(0, 0, W, H * 0.16);
    const curl = g.createLinearGradient(W * 0.7, H * 0.7, W, H);
    curl.addColorStop(0, 'rgba(0,0,0,0)');
    curl.addColorStop(1, 'rgba(0,0,0,0.18)');
    g.fillStyle = curl;
    g.fillRect(0, 0, W, H);
  }
  const lines = text.split('\n');
  const pad = W * 0.08;
  const top = o.torn ? H * 0.12 : H * 0.2;
  const boxH = H - top - H * 0.08;
  let size = Math.min(110, boxH / (lines.length * 1.15));
  g.font = `italic 700 ${size}px ${UI}`;
  const widest = Math.max(...lines.map((l) => g.measureText(l).width));
  if (widest > W - pad * 2) size *= (W - pad * 2) / widest;
  g.font = `italic 700 ${size}px ${UI}`;
  g.fillStyle = o.ink;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const lh = size * 1.15;
  lines.forEach((l, i) => g.fillText(l, W / 2, top + boxH / 2 + (i - (lines.length - 1) / 2) * lh));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/**
 * Post-it manuscrit collé (face +Z, origine au centre), légèrement
 * auto-éclairé pour rester lisible dans les coins sombres.
 */
export function postIt(w: number, h: number, text: string, paper = '#ffe873', ink = '#1d2a7a'): THREE.Mesh {
  const map = noteTexture(text, w / h, { paper, ink });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), paperMat(map, 0.35));
  mesh.receiveShadow = true;
  return mesh;
}

/** Bout de scotch de masquage annoté au feutre (étiquette « faite main »). */
export function tapeLabel(w: number, h: number, text: string): THREE.Mesh {
  const map = noteTexture(text, w / h, { paper: '#e9dcb4', ink: '#1a1a1a', torn: true });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), paperMat(map, 0.3, { cutout: true }));
  mesh.receiveShadow = true;
  return mesh;
}

/** Matériau toon d'un papier peint en canvas, avec une pointe d'auto-illumination (lisible dans l'ombre). */
function paperMat(map: THREE.Texture, glow: number, o: { cutout?: boolean } = {}): THREE.MeshToonMaterial {
  const m = mat('#ffffff', { map }) as THREE.MeshToonMaterial;
  m.emissive.set('#ffffff');
  m.emissiveMap = map;
  m.emissiveIntensity = glow;
  m.polygonOffset = true;
  m.polygonOffsetFactor = -2;
  if (o.cutout) m.alphaTest = 0.5;
  return m;
}

/** Aimant de frigo en forme de fusée cartoon (corps rouge, hublot, ailerons), couché sur +Z. */
function rocketMagnet(l: number): THREE.Group {
  const r = l * 0.2;
  const body = at(cyl(r, r, l * 0.6, '#e0405a', { seg: 14 }), 0, 0, 0);
  const nose = at(cyl(0, r, l * 0.32, '#f8f6f0', { seg: 14 }), 0, l * 0.46, 0);
  const port = at(sphere(r * 0.42, '#7fe8ff', { seg: 10 }), 0, l * 0.08, r * 0.8);
  port.scale.z = 0.4;
  const fins = [-1, 1].map((sx) => {
    const f = at(box(r * 0.9, l * 0.24, r * 0.35, '#ffd166'), sx * r * 1.15, -l * 0.24, 0);
    f.rotation.z = sx * -0.35;
    return f;
  });
  const flame = at(cyl(r * 0.7, 0, l * 0.2, '#ff9f1c', { seg: 10, edges: false }), 0, -l * 0.4, 0);
  const g = group([body, nose, port, ...fins, flame]);
  // aplati contre la tôle : c'est un aimant, pas une maquette
  g.scale.z = 0.55;
  return g;
}

/**
 * Polaroid de la mère de Gary, tenu par un aimant fusée sur la porte du
 * casier ; coin bas droit corné. Face +Z, origine au centre du tirage.
 */
export function momPhoto(w: number): THREE.Group {
  const h = w * (620 / 512);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), paperMat(momPhotoTexture(), 0.15, { cutout: true }));
  face.receiveShadow = true;
  face.position.z = 0.004;
  // aimant sur le coin haut gauche : ne masque ni les visages ni la casquette
  const magnet = at(rocketMagnet(w * 0.3), -w * 0.4, h * 0.42, 0.004 + w * 0.05);
  magnet.rotation.z = 0.7;
  return group([face, magnet]);
}
