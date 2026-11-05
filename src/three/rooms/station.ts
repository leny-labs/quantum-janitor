// Chapitre 1 « La Station Bureaucratique » (docs/CHAPTER1.md) : sas d'arrivée, salle d'attente, cafétéria,
// guichet d'accueil.
// Une Klepsydra où le règlement a gagné : beige administratif, néons blafards, tout est
// étiqueté, numéroté, tamponné. Objets de ces pièces aussi utilisés pour les icônes d'inventaire.
import * as THREE from 'three';
import { lang, t as tr } from '../../i18n';
import { at, beam, box, cyl, glow, label, plane, pool, sphere, stripeTexture, torus } from '../kit';
import { GUICHARD_ACTOR, GUICHARD_ASPECT, GUICHARD_SHEET, PATIENCE_ACTOR, PATIENCE_ASPECT, PATIENCE_EMPTY_SHEET, PATIENCE_SHEET, SABOT_ACTOR, SABOT_ASPECT, SABOT_SHEET, SIEGE_ASPECT, SIEGE_URL, actorFrame, billboard, billboardSheet } from '../props';
import { BobAspirRig } from './bobaspire';
import { bobSpot } from './bobspot';
import { pressable } from '../press';
import { speaking } from '../../engine/speaking';
import type { RoomBuild } from './index';
import { against, backDoor, shell, wallPanels } from './shell';
import type { Stage } from '../Stage';

const BEIGE = { top: '#cfc6a6', bottom: '#8f8668' };
const FLOOR = { a: '#5d5a52', b: '#66625a', joint: '#3a3832', tile: 0.8 };

// ── accessoires partagés (aussi icônes d'inventaire : three/Studio.ts) ─────────

/** Ticket papier (douane / attente) : rectangle fin, bande colorée, numéro. */
export function ticket(w: number, text: string, band: string): THREE.Group {
  const g = new THREE.Group();
  const h = w * 0.5;
  g.add(at(box(w, h, w * 0.02, '#f6efdc'), 0, 0, 0));
  g.add(at(label(text, w * 0.9, h * 0.55, { color: '#1a1a1a', bold: true }), 0, -h * 0.12, w * 0.012));
  g.add(at(plane(w, h * 0.22, band), 0, h * 0.39, w * 0.012));
  return g;
}

/** M. Ficus : plante en plastique, feuilles en éventail sur une tige, petit pot (sans pot : `pot = false`). */
export function ficus(h: number, pot = true): THREE.Group {
  const g = new THREE.Group();
  const potH = pot ? h * 0.22 : 0;
  if (pot) g.add(at(cyl(h * 0.13, h * 0.1, potH, '#8a5a3a', { seg: 14 }), 0, potH / 2, 0));
  g.add(at(cyl(h * 0.015, h * 0.02, h * 0.6, '#5a3a20', { edges: false }), 0, potH + h * 0.3, 0));
  const leaves = ['#3e8f4a', '#4fa65a', '#357a3f'];
  for (let i = 0; i < 14; i++) {
    const a = i * 2.4;
    const y = potH + h * (0.35 + (i % 7) * 0.08);
    const r = h * (0.1 + (i % 3) * 0.03);
    const leaf = at(sphere(h * 0.09, leaves[i % 3], { seg: 8 }), Math.cos(a) * r, y, Math.sin(a) * r);
    leaf.scale.set(1.4, 0.35, 0.8);
    leaf.rotation.set(0.3, a, 0.4);
    g.add(leaf);
  }
  // étiquette « MEMBRE HON. DU C... »
  g.add(at(label(tr('props.station.ficusTag'), h * 0.34, h * 0.09, { color: '#1a1a1a', bg: '#f6efdc', bold: true }), h * 0.05, potH + h * 0.25, h * 0.08));
  return g;
}

/** Le dépliant « Plan de la Station », plié en accordéon (icône d'inventaire). */
export function planFolded(w: number): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const leaf = at(box(w * 0.34, w * 0.8, w * 0.01, i === 1 ? '#efe7d0' : '#f6efdc'), (i - 1) * w * 0.32, 0, i === 1 ? -w * 0.04 : 0);
    leaf.rotation.y = (i - 1) * 0.35;
    g.add(leaf);
  }
  g.add(at(label(tr('props.station.planIcon'), w * 0.3, w * 0.14, { color: '#1f7f73', bold: true }), 0, w * 0.25, -w * 0.03));
  g.add(at(label(tr('props.station.stampSeen'), w * 0.22, w * 0.12, { color: '#c0392b', bold: true }), w * 0.32, -w * 0.25, w * 0.03));
  return g;
}

/** Tubes néon au plafond (lumière blafarde qui grésille). */
function neonTubes(s: Stage, y: number, xs: number[], z: number): void {
  for (const x of xs) {
    const tube = at(box(2.2, 0.08, 0.16, '#f4fff4', { glow: true, edges: false }), x, y, z);
    const halo = at(glow('#e8ffe0', 3, 0.25), x, y - 0.1, z);
    s.add(tube, halo, at(beam('#f0fff0', 0.3, 2.4, y - 0.1, 0.07), x, y - 0.1, z));
    s.animate((t) => (halo.material.opacity = Math.sin(t * 0.7 + x) > 0.98 ? 0.05 : 0.22 + Math.sin(t * 37 + x) * 0.02));
  }
}

/**
 * Affiches et tampons de la Station : ordre de profondeur mur → joints → affiche, et rien devant.
 * Les faisceaux des néons (`beam`, additifs, renderOrder 3, sans écriture de profondeur) sont
 * devant le mur : sans ça, leurs bords tracent des lignes claires en travers du texte. L'affiche
 * passe donc dans la file transparente (matériau cloné, opacité 1) et se dessine après eux.
 */
const POSTER_ORDER = 5;
function onTop(o: THREE.Object3D, order = POSTER_ORDER): THREE.Object3D {
  o.traverse((c) => {
    const m = c as THREE.Mesh;
    if (!m.material) return;
    m.material = (m.material as THREE.Material).clone();
    m.material.transparent = true;
    m.renderOrder = order;
  });
  return o;
}

/**
 * Signalétique GenAI de la Station (docs/CHAPTERS.md, « props GenAI ») : public/props/st/<id>-<lang>.jpg,
 * générée par _briefs/ch1/st-genai/ (texte peint dans l'image, une variante par langue).
 * Rapports largeur / hauteur des images recadrées : le panneau est ajusté dedans, jamais déformé.
 */
const SIGNS = {
  bienvenue: { fr: 1536 / 236, en: 1536 / 240 },
  douane: { fr: 1536 / 231, en: 1536 / 226 },
  animaux: { fr: 768 / 515, en: 768 / 515 },
  horaires: { fr: 1, en: 1 },
  patience: { fr: 768 / 573, en: 768 / 573 },
  platdujour: { fr: 768 / 573, en: 768 / 573 },
} as const;
type SignId = keyof typeof SIGNS;

/** Panneau texturé (plan) contenu dans `maxW × maxH`, au rapport de son image. */
function stSign(id: SignId, maxW: number, maxH: number, glowing = false): { mesh: THREE.Mesh; w: number; h: number } {
  const l = lang();
  const aspect = SIGNS[id][l];
  const w = Math.min(maxW, maxH * aspect);
  const h = w / aspect;
  const t = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}props/st/${id}-${l}.jpg`);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return { mesh: plane(w, h, '#ffffff', { map: t, glow: glowing }), w, h };
}

/** Affiche administrative GenAI collée au mur, sur un support à sa taille. */
// z ≥ 0.05 : devant les joints de `wallPanels` (face avant à z = 0.04), sinon une barre verticale barre l'affiche
function poster(s: Stage, rect: [number, number, number, number], id: SignId, z = 0.06): void {
  const f = s.fit(rect, z);
  const p = stSign(id, f.w, f.h);
  s.add(onTop(at(box(p.w * 1.02, p.h * 1.02, 0.02, '#3a3630', { edges: true, shadow: false }), f.x, f.y, z)));
  s.add(onTop(at(p.mesh, f.x, f.y, z + 0.012), POSTER_ORDER + 1));
}

/** Tampon « VU » encré de travers sur le mur (décor). */
function inkStamp(s: Stage, px: number, py: number, text: string, z = 0.08): void {
  const p = s.wallAt(px, py, z);
  const m = at(label(text, 0.9, 0.38, { color: '#c0392b', bold: true }), p.x, p.y, z);
  m.rotation.z = 0.25;
  onTop(m, POSTER_ORDER + 2);
  (m.material as THREE.MeshBasicMaterial).opacity = 0.75;
  s.add(m);
}

/** B.O.B. au sol, tourné vers la caméra, avec sa voix (onde Bender). */
function bobHere(s: Stage): { robot: THREE.Group; w: number } {
  const { robot, w } = bobSpot(s);
  s.animate((t) => (robot.position.y = Math.abs(Math.sin(t * 1.3)) * 0.02));
  return { robot, w };
}

/** 1. Sas d'Arrivée · Douane dimensionnelle. */
export const stSas: RoomBuild = {
  camera: { pos: [0.2, 2.2, 8.2], look: [0, 1.9, 0], fov: 50 },
  shots: {
    portique: { fill: 0.8, lift: 0.1 },
    borne: { fill: 0.7, orbit: 8 },
    guerite: { fill: 0.75, orbit: -10 },
    porte_gobelet: { fill: 0.3, lift: 0.4 },
  },
  intro: 'portique',
  build(s) {
    shell(s, { floor: FLOOR, wall: BEIGE, trim: '#4a4638', right: 9 });
    wallPanels(s, '#b3aa8a', -10, 9, 1.8, 8);
    s.lights({
      sky: '#f4f6ff',
      ground: '#3a3832',
      ambient: 1.25,
      key: { color: '#f6fff0', intensity: 2.2, pos: [1, 9, 6], target: [0, 0, 0] },
      points: [{ color: '#7fffd4', intensity: 5, pos: [3.4, 2.2, 1.6], distance: 5 }],
      rim: { color: '#ffd166', intensity: 0.6, pos: [-6, 5, -4] },
      fill: { color: '#9aa8ff', intensity: 0.4, pos: [-6, 3, 6] },
      fog: { color: '#2a2822', near: 9, far: 28 },
      vignette: { color: '#14120c', strength: 0.55, warm: '#fff8d010' },
    });
    neonTubes(s, s.wallAt(640, 10, 2).y, [-4.5, 0, 4.5], 2);

    // bandeau « BIENVENUE — VOTRE VISITE EST ENREGISTRÉE »
    // (plaque émaillée GenAI, au rapport de l'image, centrée dans l'emprise d'origine)
    const ban = s.fit([540, 20, 520, 60], 0.03);
    const welcome = stSign('bienvenue', ban.w, ban.h);
    s.add(onTop(at(box(welcome.w * 1.01, welcome.h * 1.04, 0.06, '#123f3a'), ban.x, ban.y, 0.03)));
    s.add(onTop(at(welcome.mesh, ban.x, ban.y, 0.065), POSTER_ORDER + 1));
    poster(s, [985, 110, 170, 110], 'animaux');
    inkStamp(s, 1070, 235, tr('props.station.stampSeen'));

    // tapis roulant à l'arrêt, du quai jusqu'au portique
    const belt = plane(10, 1.1, '#ffffff', { map: stripeTexture('#2a2830', '#3a3842', 24) });
    belt.rotation.x = -Math.PI / 2;
    const bz = s.floorAt(560, 520).z;
    s.add(at(belt, -2, 0.02, bz), at(box(10, 0.08, 0.1, '#ffd166', { edges: false }), -2, 0.04, bz - 0.6), at(box(10, 0.08, 0.1, '#ffd166', { edges: false }), -2, 0.04, bz + 0.6));

    // ── portique de scan ──
    const pr = s.stand(s.rect('portique'));
    const arch = new THREE.Group();
    const pw = pr.w * 0.9;
    arch.add(at(box(pw * 0.14, pr.h, 0.6, '#8d93a0'), -pw / 2, pr.h / 2, 0), at(box(pw * 0.14, pr.h, 0.6, '#8d93a0'), pw / 2, pr.h / 2, 0));
    arch.add(at(box(pw * 1.14, pr.h * 0.12, 0.7, '#6d7380'), 0, pr.h * 0.95, 0));
    // plaque « DOUANE DIMENSIONNELLE » (GenAI, lettres rétroéclairées : non éclairée)
    arch.add(at(stSign('douane', pw * 1.1, pr.h * 0.11, true).mesh, 0, pr.h * 0.95, 0.36));
    const scan = at(box(pw * 0.86, 0.04, 0.04, '#ff4f5a', { glow: true, edges: false }), 0, pr.h * 0.5, 0.05);
    const scanGlow = at(glow('#ff4f5a', pw * 1.1, 0.3), 0, pr.h * 0.5, 0.1);
    arch.add(scan, scanGlow);
    // fente « TICKET D'ENTRÉE » sur le montant droit, et le ticket qui dépasse
    arch.add(at(box(0.22, 0.4, 0.06, '#2a2830'), pw / 2 - 0.02, pr.h * 0.55, 0.32));
    arch.add(at(label(tr('props.station.ticketSlot'), 0.5, 0.2, { color: '#2a2830', bg: '#f6efdc', bold: true }), pw / 2, pr.h * 0.68, 0.31));
    const stub = at(ticket(0.32, 'D-0001', '#1f7f73'), pw / 2 - 0.02, pr.h * 0.52, 0.36);
    stub.rotation.z = -0.15;
    arch.add(stub);
    s.when({ notFlags: ['st_ticket_douane'] }, stub);
    s.spot('portique', at(arch, pr.x, 0, pr.z));
    s.animate((t) => {
      const k = (Math.sin(t * 1.6) + 1) / 2;
      scan.position.y = pr.h * (0.15 + k * 0.7);
      scanGlow.position.y = scan.position.y;
    });

    // ── borne SYLVIE ──
    const br = s.stand(s.rect('borne'));
    const kiosk = new THREE.Group();
    kiosk.add(at(box(br.w * 0.7, br.h * 0.75, 0.5, '#1f7f73'), 0, br.h * 0.375, 0), at(box(br.w * 0.8, 0.08, 0.6, '#14504a'), 0, br.h * 0.76, 0));
    kiosk.add(at(label(tr('props.station.kiosk'), br.w * 0.62, br.h * 0.32, { color: '#7fffd4', bg: '#04140f', bold: true }), 0, br.h * 0.55, 0.26));
    kiosk.add(at(sphere(0.07, '#7fffd4', { glow: true }), 0, br.h * 0.86, 0.1), at(label('[ S ]', 0.4, 0.2, { color: '#7fffd4', bold: true }), 0, br.h * 0.86 + 0.2, 0.05));
    s.spot('borne', at(kiosk, br.x, 0, against(br.z, 0.5)));

    // ── guérite de la fourrière (M. Sabot derrière la vitre) ──
    const gr = s.stand(s.rect('guerite'));
    const booth = new THREE.Group();
    booth.add(at(box(gr.w, gr.h * 0.42, 1, '#6d5a48'), 0, gr.h * 0.21, 0), at(box(gr.w * 1.04, 0.1, 1.1, '#4a3a2c'), 0, gr.h, 0));
    booth.add(at(plane(gr.w, gr.h * 0.06, '#ffffff', { map: stripeTexture('#ff8c42', '#2a2830', 8) }), 0, gr.h * 0.4, 0.505));
    for (const sx of [-1, 1]) booth.add(at(box(0.08, gr.h * 0.58, 1, '#8a4a1a'), sx * gr.w * 0.48, gr.h * 0.71, 0));
    const glass = at(plane(gr.w * 0.92, gr.h * 0.55, '#bfe6ff', { opacity: 0.22 }), 0, gr.h * 0.7, 0.5);
    booth.add(at(label(tr('props.station.pound'), gr.w * 0.9, gr.h * 0.12, { color: '#ffffff', bold: true }), 0, gr.h * 0.3, 0.51));
    // M. Sabot (planche GenAI) derrière la vitre : le comptoir lui cache les jambes ; il cligne, tamponne,
    // parle avec la boîte de dialogue et vous toise, agacé, entre deux répliques
    const sabot = billboardSheet(SABOT_SHEET, 5, gr.h * 0.92, SABOT_ASPECT, { tint: '#fff4e6', shadow: 0.01 });
    sabot.position.set(0, 0, -0.15);
    booth.add(sabot, glass);
    s.spot('guerite', at(booth, gr.x, 0, against(gr.z, 1)));
    s.animate((t) => sabot.userData.setFrame(actorFrame('sabot', SABOT_ACTOR, t)));

    // ── porte-gobelet orphelin (resté du vaisseau) ──
    const pg = s.stand(s.rect('porte_gobelet'));
    // posé sur le tapis roulant, devant son liseré du fond : jamais masqué par la bande jaune ni par l'UI
    const cupH = pg.h * 0.62;
    const cupR = Math.min(pg.w * 0.34, cupH * 0.6);
    const orphan = new THREE.Group();
    orphan.add(at(cyl(cupR, cupR * 0.82, cupH, '#c9ced6', { seg: 18 }), 0, cupH / 2 + 0.04, 0));
    orphan.add(at(cyl(cupR * 0.86, cupR * 0.86, 0.02, '#2a2830', { seg: 18, edges: false }), 0, cupH + 0.045, 0));
    orphan.add(at(cyl(cupR * 1.06, cupR * 1.06, cupH * 0.1, '#8d93a0', { seg: 18, edges: false }), 0, cupH * 0.9 + 0.04, 0));
    const cupGlint = at(glow('#e8f4ff', cupR * 4, 0.18), 0, cupH * 0.6, 0.05);
    orphan.add(cupGlint);
    s.spot('porte_gobelet', at(orphan, pg.x, 0, pg.z, -0.2));
    s.animate((t) => (cupGlint.material.opacity = 0.12 + Math.max(0, Math.sin(t * 1.3)) * 0.12));

    bobHere(s);

    // porte de la salle d'attente, dans le mur de droite
    const d = s.fitX(s.rect('vers_attente'), 9);
    const door = new THREE.Group();
    door.add(at(box(0.3, d.h, d.d * 1.12, '#4a4638'), 0, 0, 0), at(box(0.1, d.h * 0.94, d.d, '#8f8668'), -0.15, -d.h * 0.03, 0));
    door.add(at(label(tr('props.station.waitRoom'), 0.06, 0.3, { color: '#1a1a1a' }), -0.22, d.h * 0.35, 0));
    const lamp = at(sphere(0.08, '#ff4f5a', { glow: true }), -0.22, d.h * 0.46, 0);
    const lampOk = at(sphere(0.08, '#7fffd4', { glow: true }), -0.22, d.h * 0.46, 0);
    door.add(lamp, lampOk);
    s.when({ notFlags: ['st_laisse'] }, lamp);
    s.when({ flags: ['st_laisse'] }, lampOk);
    s.add(at(door, 9, d.y, d.z));
    const sign = at(label(tr('props.station.waitRoom'), d.d * 1.1, 0.35, { color: '#f6efdc', bg: '#1f7f73', bold: true }), 8.95, d.y + d.h / 2 + 0.3, d.z);
    sign.rotation.y = -Math.PI / 2;
    s.add(sign);
  },
};

/** Chaise (px) occupée par M. Patience : la rangée de sièges la saute, son sprite apporte la sienne. */
const PATIENCE_CHAIR = 265;

/** 2. Salle d'Attente. */
export const stAttente: RoomBuild = {
  camera: { pos: [0, 2.2, 8.2], look: [0, 1.85, 0], fov: 50 },
  shots: {
    afficheur: { fill: 0.45 },
    squelette: { fill: 0.75, orbit: -6 },
    distributeur: { fill: 0.8, orbit: 6 },
    plante: { fill: 0.7 },
    // aspiration du ticket 9 848 (# aspir) : léger push-in, plus bas ; M. Patience (gauche) et
    // B.O.B. (droite) restent dans le champ, le sol devant B.O.B. au-dessus de la bulle
    [BobAspirRig.SHOT]: { of: 'bob', cam: { pos: [0.4, 1.75, 6.6], look: [0.1, 0.55, 1.6], fov: 50 } },
  },
  build(s) {
    shell(s, { floor: { a: '#5a5040', b: '#635846', joint: '#3a3328', tile: 0.7 }, wall: { top: '#c4ba94', bottom: '#857b5c' }, trim: '#4a4232', left: -9, right: 9 });
    wallPanels(s, '#aaa080', -9, 9, 1.6, 8);
    s.lights({
      sky: '#fff6e0',
      ground: '#3a3328',
      ambient: 1.2,
      key: { color: '#fff4dc', intensity: 2.1, pos: [-1, 9, 6], target: [0, 0, 0] },
      points: [{ color: '#ff4f5a', intensity: 4, pos: [0, 4.2, 1.2], distance: 4 }],
      rim: { color: '#ffd166', intensity: 0.5, pos: [6, 5, -4] },
      fill: { color: '#9aa8ff', intensity: 0.35, pos: [6, 3, 6] },
      fog: { color: '#2a241a', near: 9, far: 26 },
      vignette: { color: '#120e08', strength: 0.6, warm: '#ffe8b018' },
    });
    neonTubes(s, s.wallAt(640, 10, 2).y, [-3.5, 3.5], 2);

    // horloge bloquée sur 10 h 11 (le guichet ouvre à 10 h 12)
    const ck = s.wallAt(980, 80, 0.04);
    const clock = new THREE.Group();
    const face = at(cyl(0.42, 0.42, 0.06, '#f6efdc', { seg: 24 }), 0, 0, 0);
    face.rotation.x = Math.PI / 2;
    clock.add(face, at(torus(0.42, 0.04, '#2a2830'), 0, 0, 0.03));
    const hourHand = at(box(0.04, 0.22, 0.02, '#1a1a1a', { edges: false }), 0, 0, 0.05);
    hourHand.geometry.translate(0, 0.11, 0);
    hourHand.rotation.z = -(10 / 12) * Math.PI * 2 - (11 / 60) * (Math.PI / 6);
    const minHand = at(box(0.03, 0.34, 0.02, '#1a1a1a', { edges: false }), 0, 0, 0.06);
    minHand.geometry.translate(0, 0.17, 0);
    minHand.rotation.z = -(11 / 60) * Math.PI * 2;
    clock.add(hourHand, minHand);
    s.add(at(clock, ck.x, ck.y, 0.05));
    poster(s, [1050, 60, 120, 110], 'horaires');
    poster(s, [380, 160, 110, 80], 'patience');
    inkStamp(s, 150, 120, tr('props.station.stampPending'));

    // ── afficheur « NOUS SERVONS LE N° 9 847 » ──
    const af = s.fit(s.rect('afficheur'), 0.06);
    const board = new THREE.Group();
    board.add(at(box(af.w, af.h, 0.12, '#1a1418'), 0, 0, 0));
    board.add(at(label(tr('props.station.serving'), af.w * 0.9, af.h * 0.24, { color: '#ffd166', bold: true }), 0, af.h * 0.32, 0.07));
    const digits = at(label('9 847', af.w * 0.8, af.h * 0.56, { color: '#ff4f5a', bg: '#140a0a', bold: true, mono: true }), 0, -af.h * 0.1, 0.07);
    board.add(digits, at(glow('#ff4f5a', af.w * 1.2, 0.18), 0, -af.h * 0.1, 0.1));
    s.spot('afficheur', at(board, af.x, af.y, 0.06));

    // rangée de chaises vissées, le long du mur du fond : sièges GenAI (même dessin que la chaise de
    // M. Patience, qui fait partie de son sprite), du plus loin au plus près pour un tri propre
    const seatH = 1.12;
    for (let px = 75; px <= 740; px += 95) {
      if (px === PATIENCE_CHAIR) continue;
      const c = s.floorAt(px, 470);
      s.add(at(billboard(SIEGE_URL, seatH, SIEGE_ASPECT, { tint: '#fff2de', shadow: 0.3 }), c.x, 0, against(c.z, 0.7) + 0.05));
    }

    // ── M. Patience (planche GenAI, assis sur sa propre chaise), ticket 9 848 tendu tant qu'il le tient ──
    // il soupire de temps en temps (crâne qui s'affaisse), la mâchoire claque parfois
    const ph = 1.72;
    const pc = s.floorAt(PATIENCE_CHAIR, 470);
    const pz = against(pc.z, 0.7) + 0.05;
    const withTicket = billboardSheet(PATIENCE_SHEET, 3, ph, PATIENCE_ASPECT, { tint: '#fff2de', shadow: 0.38 });
    const emptyHand = billboardSheet(PATIENCE_EMPTY_SHEET, 3, ph, PATIENCE_ASPECT, { tint: '#fff2de', shadow: 0.38 });
    s.when({ notFlags: ['st_ticket_9848'] }, withTicket);
    s.when({ flags: ['st_ticket_9848'] }, emptyHand);
    s.spot('squelette', at(withTicket, pc.x + 0.12, 0, pz), at(emptyHand, pc.x + 0.12, 0, pz));
    s.animate((t) => {
      const f = actorFrame('patience', PATIENCE_ACTOR, t);
      withTicket.userData.setFrame(f);
      emptyHand.userData.setFrame(f);
    });

    // ── distributeur de tickets (en rupture) ──
    const ds = s.stand(s.rect('distributeur'));
    const disp = new THREE.Group();
    disp.add(at(cyl(0.05, 0.05, ds.h * 0.5, '#8d93a0', { edges: false }), 0, ds.h * 0.25, 0));
    disp.add(at(box(ds.w * 0.8, ds.h * 0.45, 0.4, '#c0392b'), 0, ds.h * 0.72, 0));
    disp.add(at(label(tr('props.station.dispenser'), ds.w * 0.7, ds.h * 0.12, { color: '#ffffff', bold: true }), 0, ds.h * 0.86, 0.21));
    const rupt = at(label(tr('props.station.outOfStock'), ds.w * 0.68, ds.h * 0.1, { color: '#ff4f5a', bg: '#140a0a', bold: true, mono: true }), 0, ds.h * 0.73, 0.21);
    disp.add(rupt);
    // gros bouton « TICKET » en saillie (docs/CHAPTERS.md, « Props interactifs physiques ») :
    // collerette sombre + bague chromée, capuchon jaune bombé qui s'enfonce au clic, entre le
    // libellé RUPTURE (bas à 0,68 h) et la fente à ticket (haut à 0,54 h)
    const fz = 0.2;
    const by = ds.h * 0.61;
    const rb = Math.min(ds.w * 0.13, ds.h * 0.052);
    const rc = rb * 0.7;
    const collar = at(cyl(rb, rb * 1.06, 0.06, '#2a2830', { seg: 28 }), 0, by, fz + 0.03);
    collar.rotation.x = Math.PI / 2;
    disp.add(collar, at(torus(rb * 0.86, rb * 0.07, '#c9ced8'), 0, by, fz + 0.06));
    const capBody = at(cyl(rc, rc * 1.04, 0.08, '#ffd166', { seg: 24 }), 0, 0, 0.04);
    capBody.rotation.x = Math.PI / 2;
    const dome = at(sphere(rc * 0.98, '#ffe08a', { seg: 20 }), 0, 0, 0.08);
    dome.scale.z = 0.38;
    const push = at(new THREE.Group().add(capBody, dome), 0, by, fz + 0.05);
    pressable(s, 'distributeur', push, 'button', -0.065);
    disp.add(push);
    disp.add(at(label(tr('props.station.dispenserPress'), ds.w * 0.22, ds.h * 0.055, { color: '#ffd166', bg: '#140a0a', bold: true }), -(rb + ds.w * 0.14), by, fz + 0.012));
    // fente de sortie : cadre gris en relief, bouche noire
    disp.add(at(box(ds.w * 0.44, ds.h * 0.03, 0.04, '#8d93a0'), 0, ds.h * 0.522, fz + 0.02));
    disp.add(at(box(ds.w * 0.38, ds.h * 0.012, 0.02, '#0a0a0a', { edges: false }), 0, ds.h * 0.522, fz + 0.035));
    // au clic : le voyant RUPTURE clignote (bzzt), lueur rouge
    const buzz = at(glow('#ff4f5a', ds.w * 0.9, 0), 0, ds.h * 0.73, fz + 0.05);
    disp.add(buzz);
    let was = false;
    let since = -1e9;
    s.animate((t) => {
      const down = push.position.z < fz + 0.05 - 0.02;
      if (down && !was) since = t;
      was = down;
      const e = t - since;
      const on = e >= 0 && e < 1.3;
      const lit = !on || Math.floor(e * 9) % 2 === 0;
      rupt.visible = lit;
      buzz.material.opacity = on && lit ? 0.55 : 0;
    });
    s.spot('distributeur', at(disp, ds.x, 0, ds.z));

    // ── M. Ficus, plante en plastique (tant qu'elle n'est pas dans la poche de Gary) ──
    const pl = s.stand(s.rect('plante'));
    s.spot('plante', at(ficus(pl.h * 0.95), pl.x, 0, pl.z, 0.4));

    // B.O.B. ; sur le `# aspir` de st_patience, il aspire le ticket d'entre les phalanges
    // (main du squelette : pixel du ticket dans l'art du hotspot, sur le plan du sprite)
    const bob = bobHere(s);
    const tw = Math.max(0.22, bob.w * 0.42);
    const hand = s.wallAt(315, 340, pz + 0.08);
    s.expose('bobAspir', new BobAspirRig(s, { ...bob, hand, card: ticket(tw, '9 848', '#1f7f73'), cardW: tw }));

    // portes : retour au sas (gauche), guichet d'accueil (droite, panneau « MUNISSEZ-VOUS D'UN TICKET »)
    for (const [id, x, dir] of [['vers_sas', -9, 1], ['vers_guichet', 9, -1]] as const) {
      const d = s.fitX(s.rect(id), x);
      const door = new THREE.Group();
      door.add(at(box(0.3, d.h, d.d * 1.12, '#4a4232'), 0, 0, 0), at(box(0.1, d.h * 0.94, d.d, '#857b5c'), dir * 0.15, -d.h * 0.03, 0));
      s.add(at(door, x, d.y, d.z));
      const sign = at(label(tr(id === 'vers_sas' ? 'props.station.toSas' : 'props.station.toDesk'), d.d * 1.1, 0.35, { color: '#f6efdc', bg: '#1f7f73', bold: true }), x + dir * 0.05, d.y + d.h / 2 + 0.3, d.z);
      sign.rotation.y = (dir * Math.PI) / 2;
      s.add(sign);
    }
    // porte de service de la cafétéria, au fond (hublot, plaque, sandwich peint sur la vitre)
    const { door: cafDoor, f: cf } = backDoor(s, s.rect('vers_cafeteria'), 0.1, '#4a4232', '#7a6f52');
    const port = at(cyl(cf.w * 0.22, cf.w * 0.22, 0.04, '#bfe6ff', { seg: 24 }), 0, cf.h * 0.16, 0.03);
    port.rotation.x = Math.PI / 2;
    cafDoor.add(port, at(torus(cf.w * 0.22, 0.03, '#2a2830'), 0, cf.h * 0.16, 0.05));
    cafDoor.add(at(box(cf.w * 0.5, 0.06, 0.04, '#c9ced6'), 0, -cf.h * 0.06, 0.04));
    cafDoor.add(at(label(tr('props.station.toCafe'), cf.w * 1.25, 0.3, { color: '#f6efdc', bg: '#b5562a', bold: true }), 0, cf.h / 2 + 0.22, 0.06));
    cafDoor.add(at(billboard(SANDWICH_URL, cf.w * 0.3, SANDWICH_ASPECT, { shadow: 0 }), 0, cf.h * 0.06, 0.08));
    const note = s.fitX([1180, 250, 70, 70], 9);
    const notice = at(label(tr('props.station.takeTicket'), note.d * 0.9, note.h * 0.8, { color: '#1a1a1a', bg: '#f6efdc', bold: true }), 8.88, note.y, note.z);
    notice.rotation.y = -Math.PI / 2;
    s.add(notice, at(pool('#ffd166', 3, 2, 0.1), 0, 0.01, 4));
  },
};

/** Sandwich consigné (GenAI, détouré) : vitrine de la cafétéria, hublot de sa porte. */
const SANDWICH_URL = `${import.meta.env.BASE_URL}props/st/sandwich.png`;
const SANDWICH_ASPECT = 401 / 384;

/**
 * 2 bis. Cafétéria d'accueil (porte au fond de la Salle d'Attente). Lieu d'ambiance, sans puzzle :
 * le menu « LE MÊME », la vitrine aux sandwichs consignés (celui de Mme Guichard), la caisse aux
 * horaires du guichet, PERCO-JUNIOR en service minimum. Distincte de la Salle de Pause (aile B).
 */
export const stCafeteria: RoomBuild = {
  camera: { pos: [0, 2.2, 8.2], look: [0, 1.85, 0], fov: 50 },
  shots: {
    menu: { fill: 0.5 },
    vitrine: { fill: 0.75, orbit: -6 },
    comptoir: { fill: 0.75 },
    cafe: { fill: 0.75, orbit: 6 },
    tables: { fill: 0.7, orbit: 8 },
  },
  build(s) {
    shell(s, { floor: { a: '#6a5a44', b: '#e0d6bc', joint: '#4a3e30', tile: 0.6 }, wall: { top: '#d2c39a', bottom: '#8a7a58' }, trim: '#5a4630', left: -9, right: 9 });
    wallPanels(s, '#b5a67e', -9, 9, 1.6, 8);
    s.lights({
      sky: '#fff2d8',
      ground: '#3a3024',
      ambient: 1.2,
      key: { color: '#fff0d0', intensity: 2.1, pos: [1, 9, 6], target: [0, 0, 0] },
      points: [
        { color: '#9fd8ff', intensity: 3, pos: [-2.6, 1.6, 1.8], distance: 3.5 },
        { color: '#ffb066', intensity: 3, pos: [3.6, 2.6, 1.6], distance: 4 },
      ],
      rim: { color: '#ffd166', intensity: 0.5, pos: [6, 5, -4] },
      fill: { color: '#9aa8ff', intensity: 0.35, pos: [-6, 3, 6] },
      fog: { color: '#2a2218', near: 9, far: 26 },
      vignette: { color: '#120e08', strength: 0.6, warm: '#ffe0a018' },
    });
    neonTubes(s, s.wallAt(640, 10, 2).y, [-3.5, 3.5], 2);

    // frise carrelée à mi-mur (cantine) et menu GenAI « PLAT DU JOUR : LE MÊME »
    const fr = s.fit([0, 228, 1280, 18], 0.03);
    s.add(at(plane(18, fr.h, '#ffffff', { map: stripeTexture('#e6dcc0', '#b5562a', 48) }), 0, fr.y, 0.03));
    poster(s, s.rect('menu'), 'platdujour');
    inkStamp(s, 560, 150, tr('props.station.stampSeen'));
    // passe-plat « RETOUR PLATEAUX » (rideau baissé), au-dessus de B.O.B.
    const hatch = s.fit([150, 110, 200, 110], 0.05);
    s.add(at(box(hatch.w * 1.08, hatch.h * 1.1, 0.08, '#5a4630'), hatch.x, hatch.y, 0.04));
    s.add(at(plane(hatch.w, hatch.h * 0.8, '#ffffff', { map: stripeTexture('#9aa0a8', '#7a8088', 14) }), hatch.x, hatch.y - hatch.h * 0.08, 0.09));
    s.add(onTop(at(label(tr('props.station.trayReturn'), hatch.w * 0.8, hatch.h * 0.24, { color: '#f6efdc', bg: '#5a4630', bold: true }), hatch.x, hatch.y + hatch.h * 0.4, 0.1)));

    // ── vitrine réfrigérée : socle inox, caisson vitré, deux étagères, trois sandwichs consignés ──
    const vr = s.stand(s.rect('vitrine'));
    const case_ = new THREE.Group();
    const baseH = vr.h * 0.42;
    const caseH = vr.h - baseH;
    const cd = 0.9;
    case_.add(at(box(vr.w * 0.96, baseH, cd, '#9aa0a8'), 0, baseH / 2, 0));
    case_.add(at(plane(vr.w * 0.9, baseH * 0.3, '#ffffff', { map: stripeTexture('#7a8088', '#8d939c', 18) }), 0, baseH * 0.3, cd / 2 + 0.01));
    case_.add(at(label(tr('props.station.sandwiches'), vr.w * 0.6, baseH * 0.26, { color: '#ffffff', bg: '#1f7f73', bold: true }), 0, baseH * 0.72, cd / 2 + 0.01));
    case_.add(at(box(vr.w * 0.96, caseH, 0.06, '#d8e6ee'), 0, baseH + caseH / 2, -cd / 2 + 0.03));
    for (const sx of [-1, 1]) case_.add(at(box(0.06, caseH, cd, '#c9ced6'), (sx * vr.w * 0.96) / 2, baseH + caseH / 2, 0));
    case_.add(at(box(vr.w * 0.98, 0.07, cd * 1.04, '#c9ced6'), 0, vr.h, 0));
    const shelfY = [baseH + 0.04, baseH + caseH * 0.5];
    for (const y of shelfY) case_.add(at(box(vr.w * 0.9, 0.035, cd * 0.8, '#eef4f8', { edges: false }), 0, y, 0));
    const sw = Math.min(vr.w * 0.28, caseH * 0.42);
    // étage du bas : deux sandwichs ; étage du haut : un sandwich, et la place vide de Mme Guichard
    for (const [x, y] of [[-0.25, 0], [0.18, 0], [-0.2, 1]] as const) {
      const sand = at(billboard(SANDWICH_URL, sw / SANDWICH_ASPECT, SANDWICH_ASPECT, { tint: '#e8f0f4', shadow: sw * 0.4 }), x * vr.w, shelfY[y] + 0.02, -0.05);
      case_.add(sand);
    }
    case_.add(at(label(tr('props.station.reserved'), vr.w * 0.26, caseH * 0.14, { color: '#c0392b', bg: '#f6efdc', bold: true }), vr.w * 0.2, shelfY[1] + caseH * 0.1, 0.1));
    // vitre (froid bleuté) + plomb « NE PAS OUVRIR » ; lueur du groupe froid qui respire
    case_.add(at(plane(vr.w * 0.94, caseH * 0.98, '#bfe6ff', { opacity: 0.2 }), 0, baseH + caseH / 2, cd / 2));
    const seal = at(label(tr('props.station.sealed'), vr.w * 0.34, caseH * 0.1, { color: '#ffffff', bg: '#c0392b', bold: true }), vr.w * 0.25, baseH + caseH * 0.2, cd / 2 + 0.01);
    seal.rotation.z = -0.12;
    const cold = at(glow('#9fd8ff', vr.w * 1.2, 0.18), 0, baseH + caseH * 0.5, 0);
    case_.add(seal, cold);
    s.animate((t) => (cold.material.opacity = 0.14 + Math.sin(t * 0.9) * 0.05));
    s.spot('vitrine', at(case_, vr.x, 0, against(vr.z, cd)));

    // ── comptoir : caisse à manivelle, cloche « SONNEZ », pile de plateaux, horaires du guichet ──
    const cr = s.stand(s.rect('comptoir'));
    const counter = new THREE.Group();
    const ch = cr.h * 0.62;
    const ccd = 1;
    counter.add(at(box(cr.w, ch, ccd, '#7a5a3c'), 0, ch / 2, 0), at(box(cr.w * 1.04, 0.08, ccd * 1.1, '#e6dcc0'), 0, ch + 0.04, 0));
    counter.add(at(plane(cr.w * 0.96, ch * 0.18, '#ffffff', { map: stripeTexture('#e6dcc0', '#b5562a', 20) }), 0, ch * 0.78, ccd / 2 + 0.01));
    // rail à plateaux
    counter.add(at(box(cr.w * 1.02, 0.04, 0.3, '#c9ced6'), 0, ch * 0.55, ccd / 2 + 0.15));
    const top = ch + 0.08;
    const reg = new THREE.Group();
    reg.add(at(box(0.62, 0.34, 0.45, '#5a5f6a'), 0, 0.17, 0), at(box(0.55, 0.16, 0.3, '#3a3f4a'), 0, 0.42, -0.05));
    reg.add(at(label(tr('props.station.till'), 0.5, 0.12, { color: '#ffd166', bg: '#140a0a', bold: true, mono: true }), 0, 0.42, 0.105));
    const crank = at(cyl(0.025, 0.025, 0.3, '#c9ced6', { edges: false }), 0.36, 0.2, 0);
    crank.rotation.z = Math.PI / 2;
    reg.add(crank, at(sphere(0.05, '#c0392b'), 0.5, 0.2, 0));
    counter.add(at(reg, cr.w * 0.18, top, 0));
    // cloche de comptoir
    const bell = new THREE.Group();
    bell.add(at(cyl(0.12, 0.13, 0.03, '#2a2830', { seg: 18 }), 0, 0.015, 0));
    const dome = at(sphere(0.1, '#e8c26a', { seg: 18 }), 0, 0.03, 0);
    dome.scale.y = 0.7;
    bell.add(dome, at(sphere(0.02, '#e8c26a'), 0, 0.11, 0));
    counter.add(at(bell, -cr.w * 0.08, top, 0.25));
    counter.add(at(label(tr('props.station.bell'), 0.3, 0.08, { color: '#1a1a1a', bg: '#f6efdc', bold: true }), -cr.w * 0.08, top + 0.04, 0.42));
    // pile de plateaux beiges
    for (let i = 0; i < 6; i++) counter.add(at(box(0.6, 0.025, 0.42, i % 2 ? '#d8cfb4' : '#cfc6a6', { edges: i === 5 }), -cr.w * 0.34 + (i % 2) * 0.01, top + 0.0125 + i * 0.03, 0));
    // chevalet « CAISSE 10 H 12 – 10 H 14 »
    const tent = at(label(tr('props.station.tillHours'), 0.7, 0.28, { color: '#1a1a1a', bg: '#f6efdc', bold: true }), cr.w * 0.42, top + 0.16, 0.2);
    tent.rotation.x = -0.15;
    counter.add(tent);
    s.spot('comptoir', at(counter, cr.x, 0, against(cr.z, ccd)));

    // ── PERCO-JUNIOR : petite machine à café solidaire (service minimum) ──
    const mr = s.stand(s.rect('cafe'));
    const mach = new THREE.Group();
    const md = 0.7;
    mach.add(at(box(mr.w * 0.85, mr.h, md, '#3a3f4a'), 0, mr.h / 2, 0));
    mach.add(at(box(mr.w * 0.9, mr.h * 0.06, md * 1.05, '#ff8c42'), 0, mr.h * 0.95, 0));
    mach.add(at(label(tr('props.station.coffee'), mr.w * 0.7, mr.h * 0.07, { color: '#ffffff', bold: true }), 0, mr.h * 0.95, md * 0.53));
    mach.add(at(label(tr('props.station.coffeeScreen'), mr.w * 0.62, mr.h * 0.12, { color: '#ffd166', bg: '#140a0a', bold: true, mono: true }), 0, mr.h * 0.78, md / 2 + 0.01));
    for (let i = 0; i < 3; i++) mach.add(at(sphere(0.05, ['#c0392b', '#ffd166', '#7fffd4'][i], { glow: i === 2 }), (i - 1) * mr.w * 0.18, mr.h * 0.66, md / 2 + 0.02));
    // niche de distribution + gobelet tiède
    mach.add(at(box(mr.w * 0.5, mr.h * 0.18, 0.05, '#14120e', { edges: false }), 0, mr.h * 0.42, md / 2 + 0.005));
    mach.add(at(cyl(0.07, 0.055, 0.16, '#f6efdc', { seg: 14 }), 0, mr.h * 0.35, md / 2 - 0.05));
    mach.add(at(box(mr.w * 0.56, 0.03, 0.2, '#8d93a0'), 0, mr.h * 0.33 - 0.015, md / 2 - 0.04));
    const steam = at(glow('#ffffff', 0.3, 0), 0, mr.h * 0.5, md / 2);
    mach.add(steam);
    s.animate((t) => {
      const k = (t * 0.5) % 1;
      steam.position.y = mr.h * (0.44 + k * 0.12);
      steam.material.opacity = Math.sin(k * Math.PI) * 0.35;
    });
    s.spot('cafe', at(mach, mr.x, 0, against(mr.z, md)));

    // ── tables rondes vissées + tabourets, plateau abandonné ──
    const tr_ = s.stand(s.rect('tables'));
    const tables = new THREE.Group();
    const tH = tr_.h * 0.5;
    const tR = Math.min(tr_.w * 0.4, 0.75);
    tables.add(at(cyl(tR, tR, 0.06, '#e6dcc0', { seg: 28 }), 0, tH, 0), at(cyl(0.06, 0.06, tH, '#8d93a0', { edges: false }), 0, tH / 2, 0), at(cyl(0.3, 0.32, 0.04, '#5a5f6a', { seg: 18 }), 0, 0.02, 0));
    for (const [sx, sz] of [[-1, 0.4], [1, -0.3]] as const) {
      const st = new THREE.Group();
      st.add(at(cyl(0.22, 0.22, 0.07, '#b5562a', { seg: 18 }), 0, tH * 0.62, 0), at(cyl(0.04, 0.04, tH * 0.62, '#8d93a0', { edges: false }), 0, tH * 0.31, 0));
      tables.add(at(st, sx * tR * 1.15, 0, sz));
    }
    const tray = at(box(0.55, 0.025, 0.38, '#cfc6a6'), -0.05, tH + 0.045, 0.05);
    tray.rotation.y = 0.3;
    tables.add(tray, at(cyl(0.06, 0.045, 0.14, '#f6efdc', { seg: 12 }), 0.08, tH + 0.13, 0.05));
    s.spot('tables', at(tables, tr_.x, 0, tr_.z));

    bobHere(s);

    // retour à la salle d'attente (mur de gauche)
    const d = s.fitX(s.rect('vers_attente'), -9);
    const door = new THREE.Group();
    door.add(at(box(0.3, d.h, d.d * 1.12, '#5a4630'), 0, 0, 0), at(box(0.1, d.h * 0.94, d.d, '#8a7a58'), 0.15, -d.h * 0.03, 0));
    s.add(at(door, -9, d.y, d.z));
    const sign = at(label(tr('props.station.waitRoom'), d.d * 1.1, 0.35, { color: '#f6efdc', bg: '#1f7f73', bold: true }), -8.95, d.y + d.h / 2 + 0.3, d.z);
    sign.rotation.y = Math.PI / 2;
    s.add(sign, at(pool('#ffd166', 3, 2, 0.1), 0, 0.01, 4));
  },
};

/** Horloge murale ronde bloquée sur 10 h 11 (rayon `r`) ; trotteuse qui hésite sur la 59e seconde. */
function clock1011(s: Stage, r: number): THREE.Group {
  const clock = new THREE.Group();
  const face = at(cyl(r, r, 0.06, '#f6efdc', { seg: 28 }), 0, 0, 0);
  face.rotation.x = Math.PI / 2;
  clock.add(face, at(torus(r, r * 0.09, '#2a2830'), 0, 0, 0.03));
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    clock.add(at(box(r * 0.05, r * (i % 3 ? 0.1 : 0.18), 0.01, '#1a1a1a', { edges: false }), Math.sin(a) * r * 0.82, Math.cos(a) * r * 0.82, 0.04).rotateZ(-a));
  }
  const hand = (len: number, w: number, z: number, color = '#1a1a1a') => {
    const h = at(box(w, len, 0.02, color, { edges: false }), 0, 0, z);
    h.geometry.translate(0, len / 2, 0);
    return h;
  };
  const hour = hand(r * 0.5, r * 0.09, 0.05);
  hour.rotation.z = -(10 / 12) * Math.PI * 2 - (11 / 60) * (Math.PI / 6);
  const min = hand(r * 0.78, r * 0.07, 0.06);
  min.rotation.z = -(11 / 60) * Math.PI * 2;
  const sec = hand(r * 0.85, r * 0.025, 0.07, '#c0392b');
  clock.add(hour, min, sec, at(sphere(r * 0.06, '#c0392b'), 0, 0, 0.08));
  // la trotteuse avance jusqu'à 59 s, hésite, recule : il est 10 h 11 depuis 1985
  s.animate((t) => {
    const k = t % 2.4;
    const step = k < 1.2 ? 0 : 1;
    sec.rotation.z = -((58 + step) / 60) * Math.PI * 2 + Math.sin(t * 40) * 0.006 * step;
  });
  return clock;
}

/**
 * 3. Guichet d'Accueil. Mme Guichard derrière l'hygiaphone (planche GenAI repos / parle), le rideau
 * du guichet 1 à moitié baissé au-dessus d'elle, le guichet 2 fermé, l'horloge sur 10 h 11, les
 * horaires « 10 h 12 – 10 h 14 », le pupitre sans formulaire et la porte de l'Aile B (verrouillée).
 * Mauve administratif : la couleur de Mme Guichard (#8a6db0) en accents.
 */
export const stGuichet: RoomBuild = {
  camera: { pos: [0, 2.2, 8.2], look: [0, 1.85, 0], fov: 50 },
  shots: {
    guichard: { fill: 0.6 },
    hygiaphone: { fill: 0.45, lift: 0.1 },
    horloge: { fill: 0.35 },
    horaires: { fill: 0.4 },
    rideau: { fill: 0.6, orbit: 6 },
    pupitre: { fill: 0.7, orbit: -8 },
  },
  intro: 'guichard',
  build(s) {
    const MAUVE = '#8a6db0';
    shell(s, { floor: { a: '#4e4656', b: '#5a5262', joint: '#2e2836', tile: 0.7 }, wall: { top: '#c6bccb', bottom: '#7c6e86' }, trim: '#3e3448', left: -9, right: 9 });
    wallPanels(s, '#aa9db2', -9, 9, 1.6, 8);
    s.lights({
      sky: '#f6f0ff',
      ground: '#2e2836',
      ambient: 1.2,
      key: { color: '#fff4e6', intensity: 2.1, pos: [1, 9, 6], target: [0, 0, 0] },
      points: [
        // lampe de bureau derrière la vitre (chaude), voyant de l'Aile B (rouge)
        { color: '#ffcf8a', intensity: 3.5, pos: [-1.2, 2.4, 0.6], distance: 3.5 },
        { color: '#ff4f5a', intensity: 2, pos: [8.2, 3, 3], distance: 3 },
      ],
      rim: { color: MAUVE, intensity: 0.7, pos: [6, 5, -4] },
      fill: { color: '#9aa8ff', intensity: 0.35, pos: [-6, 3, 6] },
      fog: { color: '#221c28', near: 9, far: 26 },
      vignette: { color: '#100c14', strength: 0.6, warm: '#ffe0f018' },
    });
    neonTubes(s, s.wallAt(640, 10, 2).y, [-4.5, 4.5], 2.4);

    // ── le guichet : comptoir, deux baies vitrées, bandeau haut (horloge, afficheur) ──
    const zb = 1.1; // façade du guichet
    const zg = 0.45; // Mme Guichard, assise derrière
    const L = s.wallAt(395, 400, zb).x;
    const R = s.wallAt(915, 400, zb).x;
    const W = R - L;
    const cx = (L + R) / 2;
    const top = s.wallAt(640, 405, zb).y; // dessus du comptoir
    const fasciaB = s.wallAt(640, 122, zb).y; // bas du bandeau
    const fasciaT = s.wallAt(640, 0, zb).y + 0.4;
    const desk = new THREE.Group();
    // comptoir plein, plateau qui file jusque sous les coudes de Mme Guichard
    desk.add(at(box(W, top, 0.5, '#5a4a6a'), cx, top / 2, zb - 0.25));
    desk.add(at(box(W * 1.02, 0.07, zb - zg + 0.35, '#d8cfe0'), cx, top + 0.035, (zb + zg) / 2 - 0.05));
    desk.add(at(box(W, top * 0.12, 0.04, MAUVE), cx, top * 0.82, zb + 0.01));
    desk.add(at(box(W * 1.01, 0.1, 0.56, '#2e2836'), cx, 0.05, zb - 0.25));
    // bandeau haut + enseigne
    desk.add(at(box(W * 1.02, fasciaT - fasciaB, 0.3, '#6e5a82'), cx, (fasciaT + fasciaB) / 2, zb - 0.1));
    desk.add(at(box(W * 1.03, 0.06, 0.34, MAUVE), cx, fasciaB + 0.03, zb - 0.1));
    // enseigne à gauche de l'horloge
    const sign = s.fit([400, 76, 112, 26], zb + 0.06);
    desk.add(at(label(tr('props.station.reception'), sign.w, sign.h, { color: '#f6efdc', bg: '#3e3448', bold: true }), sign.x, sign.y, zb + 0.06));
    // montants entre les baies
    const posts = [395, 700, 708, 915].map((px) => s.wallAt(px, 300, zb).x);
    for (const x of [posts[0] + 0.06, (posts[1] + posts[2]) / 2, posts[3] - 0.06]) desk.add(at(box(0.12, fasciaB - top, 0.16, '#3e3448'), x, (fasciaB + top) / 2, zb));
    s.add(desk);

    // ── baie 1 : vitre + hygiaphone, Mme Guichard derrière, rideau à moitié baissé ──
    const w1 = posts[1] - posts[0];
    const x1 = (posts[0] + posts[1]) / 2;
    const glassH = fasciaB - top;
    s.add(at(plane(w1 - 0.12, glassH, '#cfe8ff', { opacity: 0.16 }), x1, (fasciaB + top) / 2, zb + 0.02));
    s.add(at(label(tr('props.station.desk1'), 0.9, 0.2, { color: '#3e3448', bg: '#f6efdc', bold: true }), x1 - w1 * 0.3, fasciaB - 0.16, zb + 0.04));
    // arrière-guichet : mur mauve, classeurs, calendrier figé, lampe
    const back = new THREE.Group();
    back.add(at(box(w1 * 1.1, glassH + 0.3, 0.06, '#9f8bb4'), x1, (fasciaB + top) / 2, 0.06));
    for (const sx of [-1, 1]) {
      const cab = at(box(0.55, 1.6, 0.4, '#7c8794'), x1 + sx * w1 * 0.38, 0.8, 0.3);
      back.add(cab);
      for (let i = 0; i < 3; i++) back.add(at(box(0.3, 0.05, 0.02, '#c9ced6', { edges: false }), x1 + sx * w1 * 0.38, 0.35 + i * 0.5, 0.51));
    }
    back.add(at(label('1985', 0.36, 0.42, { color: '#c0392b', bg: '#f6efdc', bold: true }), x1 + w1 * 0.36, top + glassH * 0.62, 0.1));
    const lamp = at(glow('#ffcf8a', 1.2, 0.35), x1 - w1 * 0.32, top + 0.5, zg);
    back.add(lamp);
    s.add(back);
    const g = s.fit(s.rect('guichard'), zg);
    // Buste réduit + assise un peu plus bas : la tête reste sous le rideau, les épaules loin des
    // montants. Le cadre du sprite garde sa hauteur (≈ 3,15) mais la planche v3 laisse une marge
    // transparente : buste visible ≈ 71 % de la hauteur / 67 % de la largeur du cadre (v1 : ≈ 99 %),
    // soit ≈ 2,24 de haut et ≈ 2,07 de large dans une baie de ≈ 3,49. Base top − 0,08 (v1 : − 0,05).
    const gBase = top - 0.08;
    const gh = Math.min((g.y + g.h / 2) - (top - 0.05), g.w / GUICHARD_ASPECT);
    const guichard = billboardSheet(GUICHARD_SHEET, 2, gh, GUICHARD_ASPECT, { tint: '#fff2f6', shadow: 0.01 });
    const gs = guichard.userData.sprite as THREE.Sprite;
    const baseSY = gs.scale.y;
    s.spot('guichard', at(guichard, x1, gBase, zg));
    s.animate((t) => {
      guichard.userData.setFrame(actorFrame('guichard', GUICHARD_ACTOR, t));
      gs.scale.y = baseSY * (1 + Math.sin(t * 1.1) * 0.006); // respiration de fonctionnaire
    });
    // rideau métallique du guichet 1, à moitié baissé : lames horizontales, barre de charge
    const shutter = new THREE.Group();
    const sh = glassH * 0.22;
    for (let i = 0; i < 7; i++) shutter.add(at(box(w1 - 0.14, sh / 7 - 0.01, 0.03, i % 2 ? '#9aa0a8' : '#a9afb8', { edges: false }), 0, -i * (sh / 7), 0));
    shutter.add(at(box(w1 - 0.1, 0.06, 0.06, '#5a5f6a'), 0, -sh, 0));
    const shutterY = fasciaB - sh / 14;
    s.add(at(shutter, x1, shutterY, zb - 0.06));
    // il tressaille quand elle parle (prêt à tomber à 10 h 14)
    s.animate((t) => (shutter.position.y = shutterY - (speaking.id === 'guichard' && speaking.talking ? Math.abs(Math.sin(t * 30)) * 0.01 : 0)));
    // hygiaphone : disque perforé dans la vitre, fente passe-documents au ras du comptoir
    const hy = s.fit(s.rect('hygiaphone'), zb + 0.03);
    const hr = Math.min(hy.h * 0.48, 0.24);
    const hyg = new THREE.Group();
    const disc = at(cyl(hr, hr, 0.03, '#d8dde4', { seg: 28 }), 0, 0, 0);
    disc.rotation.x = Math.PI / 2;
    hyg.add(disc, at(torus(hr, hr * 0.1, '#5a5f6a'), 0, 0, 0.02));
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) if (i * i + j * j <= 5) hyg.add(at(sphere(hr * 0.06, '#2a2830', { seg: 6 }), i * hr * 0.3, j * hr * 0.3, 0.02));
    hyg.add(at(label(tr('props.station.speakHere'), hr * 2.6, hr * 0.7, { color: '#3e3448', bg: '#f6efdc', bold: true }), hr * 2.4, 0, 0.01));
    const slot = at(box(w1 * 0.4, 0.05, 0.3, '#14120e', { edges: false }), 0, top + 0.03 - hy.y, -0.1);
    hyg.add(slot);
    s.spot('hygiaphone', at(hyg, hy.x, hy.y, zb + 0.03));

    // ── baie 2 : rideau baissé jusqu'en bas, cadenassé ──
    const w2 = posts[3] - posts[2];
    const x2 = (posts[2] + posts[3]) / 2;
    const closed = new THREE.Group();
    const n = 16;
    for (let i = 0; i < n; i++) closed.add(at(box(w2 - 0.14, glassH / n - 0.012, 0.04, i % 2 ? '#8d939c' : '#9aa0a8', { edges: false }), 0, top + glassH * (1 - (i + 0.5) / n), 0));
    closed.add(at(box(w2 - 0.1, 0.07, 0.07, '#5a5f6a'), 0, top + 0.06, 0.01));
    const lock = new THREE.Group();
    lock.add(at(box(0.16, 0.14, 0.05, '#e8c26a'), 0, 0, 0), at(torus(0.05, 0.015, '#c9ced6'), 0, 0.09, 0));
    closed.add(at(lock, 0, top + 0.02, 0.06));
    closed.add(at(label(tr('props.station.desk2'), w2 * 0.66, 0.42, { color: '#f6efdc', bg: '#3e3448', bold: true }), 0, top + glassH * 0.62, 0.03));
    s.spot('rideau', at(closed, x2, 0, zb - 0.02));

    // ── bandeau : horloge 10 h 11, afficheur « EN COURS 9 847 » ──
    const ck = s.fit(s.rect('horloge'), zb + 0.08);
    s.spot('horloge', at(clock1011(s, Math.min(ck.w, ck.h) * 0.48), ck.x, ck.y, zb + 0.08));
    const af = s.fit([690, 38, 150, 58], zb + 0.06);
    const board = new THREE.Group();
    board.add(at(box(af.w, af.h, 0.08, '#1a1418'), 0, 0, 0));
    board.add(at(label(tr('props.station.nowServing'), af.w * 0.4, af.h * 0.5, { color: '#ffd166', bold: true }), -af.w * 0.27, 0, 0.05));
    board.add(at(label('9 847', af.w * 0.5, af.h * 0.7, { color: '#ff4f5a', bg: '#140a0a', bold: true, mono: true }), af.w * 0.22, 0, 0.05), at(glow('#ff4f5a', af.w, 0.15), af.w * 0.22, 0, 0.08));
    s.add(at(board, af.x, af.y, zb + 0.06));

    // horaires d'ouverture (affiche GenAI) au mur, à droite du guichet ; tampon « EN ATTENTE »
    poster(s, s.rect('horaires'), 'horaires');
    inkStamp(s, 210, 160, tr('props.station.stampPending'));

    // ── pupitre de remplissage : pied, plateau incliné, stylo à chaînette, pas de formulaire ──
    const pr = s.stand(s.rect('pupitre'));
    const lect = new THREE.Group();
    const ph = pr.h * 0.62;
    lect.add(at(cyl(0.05, 0.06, ph, '#3e3448', { edges: false }), 0, ph / 2, 0), at(box(0.7, 0.05, 0.5, '#3e3448'), 0, 0.025, 0));
    const tablet = new THREE.Group();
    tablet.add(at(box(pr.w * 0.9, 0.05, 0.6, '#6d5a48'), 0, 0, 0));
    tablet.add(at(box(pr.w * 0.9, 0.06, 0.04, '#4a3a2c'), 0, 0.03, 0.31));
    const fill = at(label(tr('props.station.fillHere'), pr.w * 0.62, 0.2, { color: '#3e3448', bg: '#f6efdc', bold: true }), 0, 0.03, -0.12);
    fill.rotation.x = -Math.PI / 2;
    const empty = at(label(tr('props.station.outOfForms'), pr.w * 0.3, 0.16, { color: '#c0392b', bold: true }), pr.w * 0.18, 0.031, 0.1);
    empty.rotation.x = -Math.PI / 2;
    empty.rotation.z = 0.2;
    const pen = at(cyl(0.012, 0.012, 0.22, '#1f4fa0', { edges: false }), -pr.w * 0.3, 0.04, 0.12);
    pen.rotation.z = Math.PI / 2;
    tablet.add(fill, empty, pen, at(box(0.01, 0.01, 0.12, '#c9ced6', { edges: false }), -pr.w * 0.38, 0.04, 0.08));
    tablet.rotation.x = 0.45;
    lect.add(at(tablet, 0, ph, 0));
    s.spot('pupitre', at(lect, pr.x, 0, pr.z));

    bobHere(s);

    // ── portes : salle d'attente (gauche), Aile B (droite, lecteur de formulaire, voyant rouge) ──
    const d = s.fitX(s.rect('vers_attente'), -9);
    const door = new THREE.Group();
    door.add(at(box(0.3, d.h, d.d * 1.12, '#3e3448'), 0, 0, 0), at(box(0.1, d.h * 0.94, d.d, '#7c6e86'), 0.15, -d.h * 0.03, 0));
    s.add(at(door, -9, d.y, d.z));
    const wsign = at(label(tr('props.station.waitRoom'), d.d * 1.1, 0.35, { color: '#f6efdc', bg: '#1f7f73', bold: true }), -8.95, d.y + d.h / 2 + 0.3, d.z);
    wsign.rotation.y = Math.PI / 2;
    s.add(wsign);
    // Aile B : porte à deux battants au fond (hublots), lecteur de formulaire, voyant rouge
    const { door: wing, f: bf } = backDoor(s, s.rect('porte_b'), 0.1, '#3e3448', '#5a4a6a');
    wing.add(at(box(0.03, bf.h * 0.9, 0.04, '#2e2836'), 0, -bf.h * 0.05, 0.01));
    for (const sx of [-1, 1]) {
      const port = at(cyl(bf.w * 0.13, bf.w * 0.13, 0.03, '#bfe6ff', { seg: 18 }), (sx * bf.w) / 4, bf.h * 0.18, 0.02);
      port.rotation.x = Math.PI / 2;
      wing.add(port, at(torus(bf.w * 0.13, 0.025, '#2a2830'), (sx * bf.w) / 4, bf.h * 0.18, 0.04));
      wing.add(at(box(bf.w * 0.06, 0.04, 0.06, '#c9ced6'), (sx * bf.w) / 4 - sx * bf.w * 0.17, -bf.h * 0.05, 0.03));
    }
    wing.add(at(label(tr('props.station.wingB'), bf.w * 0.9, 0.3, { color: '#f6efdc', bg: MAUVE, bold: true }), 0, bf.h / 2 + 0.22, 0.06));
    const reader = new THREE.Group();
    reader.add(at(box(0.36, 0.5, 0.08, '#2a2830'), 0, 0, 0));
    const led = at(sphere(0.04, '#ff4f5a', { glow: true }), 0, -0.16, 0.05);
    reader.add(at(label(tr('props.station.wingBReader'), 0.32, 0.22, { color: '#ff4f5a', bg: '#140a0a', bold: true, mono: true }), 0, 0.08, 0.045), led);
    wing.add(at(reader, -bf.w / 2 - 0.3, -bf.h * 0.05, 0.02));
    s.animate((t) => (led.visible = Math.floor(t * 1.5) % 2 === 0));
    s.spot('porte_b', wing);
    s.add(at(pool('#ffd166', 3, 2, 0.1), 0, 0.01, 4));
  },
};
