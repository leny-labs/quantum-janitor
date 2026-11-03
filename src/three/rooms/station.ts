// Chapitre 1 « La Station Bureaucratique » (docs/CHAPTER1.md) : sas d'arrivée et salle d'attente.
// Une Klepsydra où le règlement a gagné : beige administratif, néons blafards, tout est
// étiqueté, numéroté, tamponné. Objets de ces pièces aussi utilisés pour les icônes d'inventaire.
import * as THREE from 'three';
import { t as tr } from '../../i18n';
import { at, beam, box, cyl, glow, label, plane, pool, sphere, stripeTexture, torus } from '../kit';
import { PATIENCE_ACTOR, PATIENCE_ASPECT, PATIENCE_EMPTY_SHEET, PATIENCE_SHEET, SABOT_ACTOR, SABOT_ASPECT, SABOT_SHEET, SIEGE_ASPECT, SIEGE_URL, actorFrame, billboard, billboardSheet, bob } from '../props';
import { BobVoice } from './bobvoix';
import type { RoomBuild } from './index';
import { against, shell, wallPanels } from './shell';
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

/** Affiche administrative collée au mur (bordure, en-tête coloré). */
// z ≥ 0.05 : devant les joints de `wallPanels` (face avant à z = 0.04), sinon une barre verticale barre l'affiche
function poster(s: Stage, rect: [number, number, number, number], text: string, head: string, z = 0.06): void {
  const f = s.fit(rect, z);
  s.add(onTop(at(box(f.w, f.h, 0.02, '#f6efdc', { edges: true, shadow: false }), f.x, f.y, z)));
  s.add(onTop(at(plane(f.w * 0.96, f.h * 0.16, head), f.x, f.y + f.h * 0.38, z + 0.012), POSTER_ORDER + 1));
  s.add(onTop(at(label(text, f.w * 0.9, f.h * 0.66, { color: '#2a2830', bold: true }), f.x, f.y - f.h * 0.08, z + 0.013), POSTER_ORDER + 1));
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

/** B.O.B. au sol, avec sa voix (onde Bender). */
function bobHere(s: Stage, rect: [number, number, number, number]): void {
  const bb = s.stand(rect);
  const robot = at(bob(bb.w * 0.75), bb.x, 0, bb.z, -0.15);
  s.spot('bob', robot);
  s.expose('bobVoix', new BobVoice(s, robot));
  s.animate((t) => (robot.position.y = Math.abs(Math.sin(t * 1.3)) * 0.02));
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
    const ban = s.fit([540, 20, 520, 60], 0.03);
    s.add(onTop(at(box(ban.w, ban.h, 0.06, '#1f7f73'), ban.x, ban.y, 0.03)));
    s.add(onTop(at(label(tr('props.station.welcome'), ban.w * 0.95, ban.h * 0.8, { color: '#f6efdc', bold: true }), ban.x, ban.y, 0.065), POSTER_ORDER + 1));
    poster(s, [985, 110, 170, 110], tr('props.station.pets'), '#c0392b');
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
    arch.add(at(label(tr('props.station.customs'), pw, pr.h * 0.08, { color: '#ffd166', bold: true }), 0, pr.h * 0.95, 0.36));
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

    bobHere(s, s.rect('bob'));

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
    poster(s, [1050, 60, 120, 110], tr('props.station.hours'), '#1f7f73');
    poster(s, [380, 160, 110, 80], tr('props.station.patience'), '#c0392b');
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
    disp.add(at(label(tr('props.station.outOfStock'), ds.w * 0.68, ds.h * 0.1, { color: '#ff4f5a', bg: '#140a0a', bold: true, mono: true }), 0, ds.h * 0.73, 0.21));
    const button = at(cyl(ds.w * 0.1, ds.w * 0.1, 0.06, '#ffd166', { seg: 16 }), 0, ds.h * 0.6, 0.21);
    button.rotation.x = Math.PI / 2;
    disp.add(button, at(box(ds.w * 0.4, 0.03, 0.05, '#1a1a1a', { edges: false }), 0, ds.h * 0.53, 0.21));
    s.spot('distributeur', at(disp, ds.x, 0, ds.z));

    // ── M. Ficus, plante en plastique (tant qu'elle n'est pas dans la poche de Gary) ──
    const pl = s.stand(s.rect('plante'));
    s.spot('plante', at(ficus(pl.h * 0.95), pl.x, 0, pl.z, 0.4));

    bobHere(s, s.rect('bob'));

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
    const note = s.fitX([1180, 250, 70, 70], 9);
    const notice = at(label(tr('props.station.takeTicket'), note.d * 0.9, note.h * 0.8, { color: '#1a1a1a', bg: '#f6efdc', bold: true }), 8.88, note.y, note.z);
    notice.rotation.y = -Math.PI / 2;
    s.add(notice, at(pool('#ffd166', 3, 2, 0.1), 0, 0.01, 4));
  },
};
