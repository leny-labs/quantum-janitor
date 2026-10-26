// Objets 3D réutilisables (personnages-objets, objets d'inventaire posés dans
// une pièce). Chaque fonction renvoie un Group dont l'origine est au sol, au
// centre de la base : il suffit de le poser avec `at(prop, x, 0, z)`.
import * as THREE from 'three';
import { at, box, cyl, decal, glow, group, label, mat, mysteryTag, outline, shell, sphere, torus, type DecalMark } from './kit';

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
  const lid = at(cyl(r * 0.78, r * 0.82, h * 0.18, '#a9b4c2', { seg: 20 }), 0, h + r * 0.04, 0);
  const eyes = [-1, 1].map((sx) => {
    const eye = at(sphere(r * 0.16, '#ffffff', { seg: 10 }), sx * r * 0.36, h * 0.62, r * 0.9);
    const pupil = at(sphere(r * 0.07, '#11131a', { glow: true, seg: 8 }), sx * r * 0.36, h * 0.55, r * 1.04);
    // paupières tombantes : la déprime, en low-poly
    const lidBox = at(box(r * 0.38, r * 0.1, r * 0.2, '#8994a3', { edges: false }), sx * r * 0.36, h * 0.8, r * 0.92);
    lidBox.rotation.z = sx * -0.25;
    return group([eye, pupil, lidBox]);
  });
  const antenna = at(cyl(r * 0.02, r * 0.02, r * 0.5, '#3f4652', { edges: false }), r * 0.4, h + r * 0.3, -r * 0.3);
  const tip = at(sphere(r * 0.06, '#ff5c7a', { glow: true }), r * 0.4, h + r * 0.56, -r * 0.3);
  const plate = at(label('B.O.B.', r * 0.7, r * 0.18, { color: '#1a1a1a', bold: true }), 0, h * 0.28, r * 1.05);
  // « bouche » façon Bender : écran-grille où une onde danse avec la voix.
  // Caché en salle (plaque B.O.B. visible) ; le studio de portraits l'allume.
  const sy = h * 0.28;
  const sz = r * 1.06;
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
  const g = group([body, bumper, lid, ...eyes, antenna, tip, plate, ...mouthParts]);
  g.userData.tip = tip;
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
export function bottle(w: number, h: number, color: string, tag: { mark: DecalMark; name: string } | null, kind: 'round' | 'square' | 'jar' | 'flask' = 'round'): THREE.Group {
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
    // plaque large : ~70 % de la hauteur du corps, presque toute la face
    const dh = bodyH * 0.7;
    const dw = Math.min(dh * 2.4, w * (kind === 'square' ? 0.9 : 0.95));
    const y = bodyH * 0.5;
    if (kind === 'square') parts.push(at(decal(dw, dh, band, tag.mark, tag.name), 0, y, w * 0.3 + 0.004));
    else parts.push(at(decal(dw, dh, band, tag.mark, tag.name, w / 2 + 0.004), 0, y, 0));
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

/** Badge d'accès « GARRY » (plaque + clip), debout face +Z. */
export function badge(w: number): THREE.Group {
  const h = w * 1.35;
  const card = at(box(w, h, w * 0.06, '#e8e4da'), 0, h / 2, 0);
  const band = at(box(w * 1.001, h * 0.22, w * 0.062, '#1f7f73', { edges: false }), 0, h * 0.86, 0);
  const photo = at(box(w * 0.42, w * 0.5, 0.01, '#ff8c42', { edges: false }), -w * 0.2, h * 0.46, w * 0.035);
  const head = at(sphere(w * 0.1, '#f2c49b', { seg: 10 }), -w * 0.2, h * 0.5, w * 0.045);
  head.scale.z = 0.3;
  const name = at(label('GARRY', w * 0.42, w * 0.18, { color: '#14102a', bold: true }), w * 0.22, h * 0.52, w * 0.035);
  const bar = at(box(w * 0.42, w * 0.05, 0.01, '#14102a', { edges: false }), w * 0.22, h * 0.36, w * 0.035);
  const clip = at(box(w * 0.3, w * 0.14, w * 0.1, '#c9ced6'), 0, h + w * 0.05, 0);
  return group([card, band, photo, head, name, bar, clip]);
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
  g.fillText('RÈGLEMENT N°1', W / 2, bandY + bandH / 2 + 2);
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
  const lines = ['NE JAMAIS NETTOYER', 'LE RÉACTEUR'];
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
  g.fillText("TOUTE INFRACTION SERA CÉLÉBRÉE · L'ORDINATEUR VOUS AIME", W / 2, textY + size * 1.15 + size * 0.9);
  // ajout au marqueur, de travers
  g.save();
  g.translate(W * 0.6, H - m - H * 0.09);
  g.rotate(-0.05);
  g.font = `italic 600 ${Math.round(H * 0.05)}px ${UI}`;
  g.fillStyle = '#f6efe2';
  g.globalAlpha = 0.85;
  g.fillText('n°2 : voir n°1. Sérieusement, Gary.', 0, 0);
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
