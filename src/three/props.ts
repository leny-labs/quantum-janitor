// Objets 3D réutilisables (personnages-objets, objets d'inventaire posés dans
// une pièce). Chaque fonction renvoie un Group dont l'origine est au sol, au
// centre de la base : il suffit de le poser avec `at(prop, x, 0, z)`.
import * as THREE from 'three';
import { at, box, cyl, decal, glow, group, label, mat, mysteryTag, sphere, torus, type DecalMark } from './kit';

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

/** Buste de Gary Plunk : combinaison orange, casquette, moustache tombante. */
export function gary(h: number): THREE.Group {
  const u = h / 2;
  const torso = at(cyl(u * 0.52, u * 0.62, u * 0.7, '#ff8c42', { seg: 10 }), 0, u * 0.35, 0);
  const collar = at(cyl(u * 0.3, u * 0.4, u * 0.12, '#d96a2a', { seg: 10 }), 0, u * 0.72, 0);
  const strapL = at(box(u * 0.1, u * 0.6, u * 0.04, '#2b5fa8', { edges: false }), -u * 0.22, u * 0.38, u * 0.53);
  const strapR = at(box(u * 0.1, u * 0.6, u * 0.04, '#2b5fa8', { edges: false }), u * 0.22, u * 0.38, u * 0.53);
  strapL.rotation.x = strapR.rotation.x = -0.18;
  const tag = at(box(u * 0.2, u * 0.12, u * 0.02, '#e8e4da', { edges: false }), u * 0.2, u * 0.5, u * 0.55);
  const neck = at(cyl(u * 0.15, u * 0.17, u * 0.2, '#e9b48a', { seg: 8 }), 0, u * 0.85, 0);
  const head = at(sphere(u * 0.42, '#f2c49b', { seg: 16 }), 0, u * 1.25, 0);
  head.scale.set(0.95, 1.08, 0.95);
  const nose = at(sphere(u * 0.13, '#e8987a', { seg: 10 }), 0, u * 1.2, u * 0.4);
  const eyes = [-1, 1].map((sx) => {
    const white = at(sphere(u * 0.09, '#ffffff', { seg: 10 }), sx * u * 0.15, u * 1.36, u * 0.33);
    const pupil = at(sphere(u * 0.045, '#14102a', { seg: 8, glow: true }), sx * u * 0.14, u * 1.35, u * 0.41);
    const lid = at(box(u * 0.2, u * 0.05, u * 0.12, '#e9b48a', { edges: false }), sx * u * 0.15, u * 1.43, u * 0.35);
    lid.rotation.z = sx * 0.2;
    return group([white, pupil, lid]);
  });
  const stache = [-1, 1].map((sx) => {
    const m = at(cyl(u * 0.06, u * 0.03, u * 0.3, '#6b3a1a', { seg: 6, edges: false }), sx * u * 0.13, u * 1.06, u * 0.37);
    m.rotation.z = sx * 1.1;
    return m;
  });
  const cap = at(cyl(u * 0.42, u * 0.44, u * 0.22, '#1f7f73', { seg: 16 }), 0, u * 1.6, 0);
  const visor = at(box(u * 0.6, u * 0.04, u * 0.38, '#155f56'), 0, u * 1.51, u * 0.42);
  visor.rotation.x = 0.15;
  const logo = at(sphere(u * 0.07, '#7fffd4', { glow: true }), 0, u * 1.62, u * 0.42);
  const ears = [-1, 1].map((sx) => at(sphere(u * 0.1, '#e9b48a', { seg: 8 }), sx * u * 0.4, u * 1.25, 0));
  return group([torso, collar, strapL, strapR, tag, neck, head, nose, ...eyes, ...stache, cap, visor, logo, ...ears]);
}

/** SYLVIE, IA de station : écran flottant à visage + anneaux. */
export function sylvie(h: number): THREE.Group {
  const u = h / 2;
  const frame = at(box(u * 1.3, u * 1.0, u * 0.18, '#16314a'), 0, u, 0);
  const screen = at(box(u * 1.16, u * 0.86, 0.01, '#1f7f73', { glow: true }), 0, u, u * 0.095);
  const face = at(label('◉   ◉\n‿', u * 1.0, u * 0.7, { color: '#d9fff4', bold: true }), 0, u, u * 0.1);
  const ring = at(torus(u * 0.9, u * 0.03, '#7fffd4', { glow: true }), 0, u, -u * 0.1);
  const halo = at(glow('#7fffd4', u * 3, 0.35), 0, u, -u * 0.3);
  const g = group([halo, ring, frame, screen, face]);
  g.userData.ring = ring;
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
  if (crown) {
    const c = at(cyl(u * 0.12, u * 0.1, u * 0.1, '#ffd166', { seg: 6 }), u * 0.55, u * 0.38, 0);
    parts.push(c);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      parts.push(at(cyl(0, u * 0.03, u * 0.08, '#ffd166', { seg: 4, edges: false }), u * 0.55 + Math.cos(a) * u * 0.1, u * 0.47, Math.sin(a) * u * 0.1));
    }
    parts.push(at(sphere(u * 0.03, '#ff5c7a', { glow: true }), u * 0.66, u * 0.4, 0));
  }
  return group(parts);
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
