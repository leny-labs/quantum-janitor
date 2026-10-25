// Objets 3D réutilisables (personnages-objets, objets d'inventaire posés dans
// une pièce). Chaque fonction renvoie un Group dont l'origine est au sol, au
// centre de la base : il suffit de le poser avec `at(prop, x, 0, z)`.
import * as THREE from 'three';
import { at, box, cyl, glow, group, label, mat, sphere, torus } from './kit';

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
  const g = group([body, bumper, lid, ...eyes, antenna, tip, plate]);
  g.userData.tip = tip;
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
  const handle = new THREE.Mesh(new THREE.TorusGeometry(r * 0.95, r * 0.035, 5, 16, Math.PI), mat('#cfd8e3'));
  handle.castShadow = true;
  handle.position.set(0, bodyH, 0);
  handle.rotation.y = 0.5;
  const band = at(cyl(r * 0.91, r * 0.91, bodyH * 0.12, '#2b5fa8', { seg: 16, edges: false }), 0, bodyH * 0.35, 0);
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

/** Flacon générique : corps + goulot + bouchon + étiquette. */
export function bottle(w: number, h: number, color: string, text: string, kind: 'round' | 'square' | 'jar' | 'flask' = 'round'): THREE.Group {
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
  const lw = w * 0.92;
  const lh = Math.min(bodyH * 0.6, w * 0.9);
  const tag = label(text, lw, lh, { color: '#ffffff', bg: '#00000055', bold: true });
  const front = kind === 'square' ? w * 0.31 : w / 2 + 0.005;
  parts.push(at(tag, 0, kind === 'flask' ? w / 2 : bodyH * 0.5, front));
  return group(parts);
}

/** Tasse de café fumante (enfin, tiède). */
export function mug(w: number): THREE.Group {
  const body = at(cyl(w / 2, w * 0.45, w, '#ffffff', { seg: 12 }), 0, w / 2, 0);
  const coffee = at(cyl(w * 0.44, w * 0.44, 0.005, '#3b2412', { edges: false }), 0, w * 0.97, 0);
  const handle = at(torus(w * 0.22, w * 0.06, '#ffffff'), w * 0.52, w * 0.5, 0);
  return group([body, coffee, handle]);
}
