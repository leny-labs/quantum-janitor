// Chapitre 1 « La Station Bureaucratique » (docs/CHAPTER1.md) : sas d'arrivée, salle d'attente, cafétéria,
// guichet d'accueil.
// Une Klepsydra où le règlement a gagné : beige administratif, néons blafards, tout est
// étiqueté, numéroté, tamponné. Objets de ces pièces aussi utilisés pour les icônes d'inventaire.
import * as THREE from 'three';
import { lang, t as tr } from '../../i18n';
import { at, beam, box, cyl, glow, label, plane, pool, sphere, stripeTexture, torus } from '../kit';
import { CAPSULE_ASPECT, CAPSULE_SHEET, DELAIGUE_ASPECT, DELAIGUE_SHEET, DUPLICATA_ACTOR, DUPLICATA_ASPECT, DUPLICATA_SHEET, GUICHARD_ACTOR, GUICHARD_ASPECT, GUICHARD_FRAMES, GUICHARD_SHEET, PATIENCE_ACTOR, PATIENCE_ASPECT, PATIENCE_EMPTY_SHEET, PARAPHE_ACTOR, PARAPHE_ASPECT, PARAPHE_SHEET, PATIENCE_SHEET, PERCO_ASPECT, PERCO_SHEET, REMORQUE_ACTOR, REMORQUE_ASPECT, REMORQUE_SHEET, SABOT_ACTOR, SABOT_ASPECT, SABOT_DESK_PX, SABOT_FRAMES, SABOT_SHEET, SABOT_STAMP_PX, SIEGE_ASPECT, SIEGE_URL, TAMPONNET_ACTOR, TAMPONNET_ASPECT, TAMPONNET_SHEET, actorFrame, billboard, billboardSheet } from '../props';
import { BobAspirRig } from './bobaspire';
import { guichardBall } from '../guichardBall';
import { guichardChain } from '../guichardChain';
import { officeChair } from '../officeChair';
import { bobSpot } from './bobspot';
import { CouloirWalkRig, type WalkDoor } from './couloirWalk';
import { pressable, CASIER_OPEN_ID, CASIER_OPEN_MS, type OpenRig } from '../press';
import { percoScreen } from '../percoFace';
import { DIRECTION_TRONE_ASPECT, DIRECTION_TRONE_URL, sylvieWall } from '../sylvieDirection';
import { speaking } from '../../engine/speaking';
import type { Condition } from '../../engine/types';
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
  // Couloir Infini B : _briefs/aile-b/genai/ (gpt-image-2.6-sunburst)
  aileb: { fr: 1.5, en: 1.5 },
  extincteur: { fr: 2 / 3, en: 2 / 3 },
  stock: { fr: 1.5, en: 1.5 },
  // Acte II, bureaux de l'Aile B : _briefs/acte2/genai/ (gpt-image-2.6-sunburst)
  archives: { fr: 1.5, en: 1.5 },
  tampons: { fr: 1.5, en: 1.5 },
  reclamations: { fr: 1.5, en: 1.5 },
  papier: { fr: 1.5, en: 1.5 },
  personnel: { fr: 1.5, en: 1.5 },
  chatiere: { fr: 1.5, en: 1.5 },
  // Acte III : _briefs/acte3/genai/
  pause: { fr: 1.5, en: 1.5 },
  souschef: { fr: 1.5, en: 1.5 },
  greve: { fr: 1.5, en: 1.5 },
  yaourt: { fr: 2 / 3, en: 2 / 3 },
  delegation: { fr: 2 / 3, en: 2 / 3 },
  // Acte IV : _briefs/acte4/genai/
  ascenseur: { fr: 1.5, en: 1.5 },
  membres: { fr: 2 / 3, en: 2 / 3 },
  direction: { fr: 1.5, en: 1.5 },
  objets: { fr: 1.5, en: 1.5 },
  amendes: { fr: 1.5, en: 1.5 },
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
function poster(s: Stage, rect: [number, number, number, number], id: SignId, z = 0.06): THREE.Object3D {
  const f = s.fit(rect, z);
  const p = stSign(id, f.w, f.h);
  s.add(onTop(at(box(p.w * 1.02, p.h * 1.02, 0.02, '#3a3630', { edges: true, shadow: false }), f.x, f.y, z)));
  const art = onTop(at(p.mesh, f.x, f.y, z + 0.012), POSTER_ORDER + 1);
  s.add(art);
  return art;
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
/** Formulaire de fourrière à plat sur le comptoir de M. Sabot (lignes, cadre, coup de tampon rouge). */
function sabotFormTexture(stamped: boolean): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 288;
  c.height = 208;
  const g = c.getContext('2d')!;
  g.fillStyle = '#f6f1e4';
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = '#3a3a48';
  g.lineWidth = 5;
  g.strokeRect(2.5, 2.5, c.width - 5, c.height - 5);
  g.fillStyle = '#2c3e7a';
  g.fillRect(24, 22, 120, 10);
  g.fillStyle = '#9aa0b4';
  for (let y = 56; y < 180; y += 22) g.fillRect(24, y, c.width - 48 - (y % 44 ? 40 : 0), 5);
  if (stamped) {
    g.strokeStyle = '#c42a2a';
    g.lineWidth = 6;
    g.strokeRect(170, 110, 90, 60);
    g.fillStyle = 'rgba(196, 42, 42, 0.75)';
    g.fillRect(182, 124, 66, 10);
    g.fillRect(182, 146, 44, 10);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function bobHere(s: Stage): { robot: THREE.Group; w: number } {
  const { robot, w } = bobSpot(s);
  s.animate((t) => (robot.position.y = Math.abs(Math.sin(t * 1.3)) * 0.02));
  return { robot, w };
}

/** 1. Sas d'Arrivée · Douane dimensionnelle. */
export const stSas: RoomBuild = {
  camera: { pos: [0.2, 2.2, 8.2], look: [0, 1.9, 0], fov: 50 },
  shots: {
    portique: { fill: 0.85, lift: 0.1 },
    borne: { fill: 0.85, orbit: 6, fov: 42 },
    guerite: { fill: 0.85, orbit: -8, fov: 42 },
    porte_gobelet: { fill: 0.3, lift: 0.4 },
    // détails (sous-hotspots du YAML) : plans serrés
    bienvenue: { fill: 0.9, fov: 38 },
    affiche_animaux: { fill: 0.85, orbit: 4, fov: 36 },
    fente: { px: [707, 288], fill: 0.72, aim: [0, 0.2, 0], fov: 36, picks: ['fente'] },
    pupitre_sabot: { px: [200, 325], fill: 0.4, orbit: -5, aim: [0, 0.38, 0], fov: 38 },
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
    const welcomeArt = onTop(at(welcome.mesh, ban.x, ban.y, 0.065), POSTER_ORDER + 1);
    s.add(welcomeArt);
    s.spot('bienvenue', welcomeArt);
    s.spot('affiche_animaux', poster(s, [985, 110, 170, 110], 'animaux'));
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
    s.spot('fente', stub);
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
    // M. Sabot (planche GenAI) derrière la vitre : le comptoir lui cache les jambes ; il cligne et
    // tamponne. Le bras est peint d'un seul tenant dans la planche (tampon levé → impact) ;
    // le billboard est calé pour que sa ligne de coupe (SABOT_DESK_PX = bas du tampon à l'impact)
    // tombe pile sur le plateau 3D : à l'impact, le tampon est posé sur le formulaire.
    const deskY = gr.h * 0.42;
    const sabotH = gr.h * 0.92;
    const sabotPx = sabotH / 768; // planche 768 px de haut
    const sabot = billboardSheet(SABOT_SHEET, SABOT_FRAMES, sabotH, SABOT_ASPECT, { tint: '#fff4e6', shadow: 0.01 });
    const sabotZ = -0.32;
    // sprite.center.y = 0.008 : son bas est à 0,8 % de sa hauteur sous position.y
    sabot.position.set(0, deskY - (768 - SABOT_DESK_PX) * sabotPx + sabotH * 0.008, sabotZ);
    // formulaire sous le point de frappe (à cheval sur le plan du billboard : le tampon tombe en son
    // milieu) ; le coup de tampon rouge apparaît au premier impact
    const stampX = (SABOT_STAMP_PX - (768 * SABOT_ASPECT) / 2) * sabotPx;
    const formStamped = sabotFormTexture(true);
    const sheetA = at(plane(0.58, 0.5, '#ffffff', { map: sabotFormTexture(false) }), stampX + 0.05, deskY + 0.004, sabotZ + 0.14);
    sheetA.rotation.set(-Math.PI / 2, 0, 0.08);
    const sheetB = at(plane(0.46, 0.33, '#ffffff', { map: sabotFormTexture(false) }), stampX + 0.58, deskY + 0.002, sabotZ + 0.18);
    sheetB.rotation.set(-Math.PI / 2, 0, -0.07);
    // ombre de contact du tampon sur la feuille, à l'impact
    const stampShadow = at(
      new THREE.Mesh(new THREE.CircleGeometry(0.16, 20), new THREE.MeshBasicMaterial({ color: '#12060a', transparent: true, opacity: 0, depthWrite: false })),
      stampX,
      deskY + 0.008,
      sabotZ + 0.04,
    );
    stampShadow.rotation.x = -Math.PI / 2;
    stampShadow.scale.set(1, 0.45, 1);
    booth.add(sabot, sheetA, sheetB, stampShadow, glass);
    s.spot('guerite', at(booth, gr.x, 0, against(gr.z, 1)));
    s.animate((t) => {
      const f = actorFrame('sabot', SABOT_ACTOR, t);
      sabot.userData.setFrame(f);
      const hit = f === 4;
      if (hit) (sheetA.material as THREE.Material & { map: THREE.Texture | null }).map = formStamped;
      stampShadow.material.opacity = hit ? 0.4 : 0;
    });

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
    // Acte IV : le quai des navettes s'ouvre avec le permis de la Direction (sortie vers_fourriere)
    const q = s.fitX(s.rect('vers_fourriere'), -9);
    const quai = at(label(tr('props.station.dock'), q.d * 1.1, 0.35, { color: '#1a1a1a', bg: '#ffd166', bold: true }), -8.95, q.y + q.h / 2 + 0.3, q.z);
    quai.rotation.y = Math.PI / 2;
    const quaiGlow = at(plane(q.d * 0.8, q.h * 0.9, '#ffe6a0', { glow: true }), -8.97, q.y, q.z, Math.PI / 2);
    s.when({ flags: ['st_eclat2'] }, quai, quaiGlow);
  },
};

/** Chaise (px) occupée par M. Patience : la rangée de sièges la saute, son sprite apporte la sienne. */
const PATIENCE_CHAIR = 265;

/** 2. Salle d'Attente. */
export const stAttente: RoomBuild = {
  camera: { pos: [0, 2.2, 8.2], look: [0, 1.85, 0], fov: 50 },
  shots: {
    afficheur: { fill: 0.75, fov: 40 },
    squelette: { fill: 0.85, orbit: -6, fov: 42 },
    distributeur: { fill: 0.9, orbit: 6, fov: 42 },
    // détails (sous-hotspots du YAML) : plans serrés
    horloge: { fill: 0.9, fov: 36 },
    horaires: { fill: 0.9, orbit: 4, fov: 36 },
    affiche_patience: { fill: 0.9, orbit: -4, fov: 36 },
    ticket_patience: { px: [340, 352], fill: 0.6, orbit: 6, lift: 0.1, fov: 36 },
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
    s.spot('horloge', at(clock, ck.x, ck.y, 0.05));
    s.spot('horaires', poster(s, [1050, 60, 120, 110], 'horaires'));
    s.spot('affiche_patience', poster(s, [380, 160, 110, 80], 'patience'));
    inkStamp(s, 150, 120, tr('props.station.stampPending'));

    // ── afficheur « NOUS SERVONS LE N° 9 847 » ──
    const af = s.fit(s.rect('afficheur'), 0.06);
    const board = new THREE.Group();
    board.add(at(box(af.w, af.h, 0.12, '#1a1418'), 0, 0, 0));
    board.add(at(label(tr('props.station.serving'), af.w * 0.9, af.h * 0.24, { color: '#ffd166', bold: true }), 0, af.h * 0.32, 0.07));
    const digits = at(label('9 847', af.w * 0.8, af.h * 0.56, { color: '#ff4f5a', bg: '#140a0a', bold: true, mono: true, space: 0.28 }), 0, -af.h * 0.1, 0.07);
    board.add(digits, at(glow('#ff4f5a', af.w * 1.2, 0.18), 0, -af.h * 0.1, 0.1));
    s.spot('afficheur', at(board, af.x, af.y, 0.06));

    // rangée de chaises vissées, le long du mur du fond : sièges GenAI (même dessin que la chaise de
    // M. Patience, qui fait partie de son sprite), du plus loin au plus près pour un tri propre.
    // La rangée s'arrête à 550 px (plus de chaises à 645 / 740) : la double porte CAFÉTÉRIA (620-850 px) respire.
    const seatH = 1.12;
    for (let px = 75; px <= 550; px += 95) {
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

    // (M. Ficus est passé à la cafétéria, à côté de PERCO-JUNIOR)
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
    // porte de la cafétéria, au fond : double porte battante (deux vantaux, grands hublots vitrés
    // éclairés par la salle, plaques de poussée, plinthes inox), enseigne à la largeur du cadre
    const { door: cafDoor, f: cf } = backDoor(s, s.rect('vers_cafeteria'), 0.1, '#4a4232', '#2a2418');
    const ft = Math.min(cf.w, cf.h) * 0.08;
    const lw = (cf.w - 2 * ft) / 2 - 0.03;
    const lh = cf.h - ft - 0.06;
    const ly = -ft / 2 - 0.03;
    const portR = Math.min(lw * 0.42, cf.h * 0.15);
    const portY = cf.h * 0.14;
    for (const side of [-1, 1]) {
      const cx = side * (lw / 2 + 0.03);
      const leaf = new THREE.Group();
      leaf.add(at(box(lw, lh, 0.06, '#7a6f52'), 0, 0, 0));
      // hublot neutre : vitre éclairée (lumière de la cafétéria), bague sombre, deux reflets en
      // biais sur le verre — rien derrière (pas de sandwich : la vitrine est dans la cafétéria)
      const py = portY - ly;
      const glass = at(cyl(portR, portR, 0.03, '#f2dcae', { seg: 28 }), 0, py, 0.035);
      glass.rotation.x = Math.PI / 2;
      leaf.add(glass, at(torus(portR, 0.045, '#2a2830'), 0, py, 0.06));
      for (const [w, len, ox, oy, op] of [[0.16, 1.1, -0.22, 0.12, 0.42], [0.07, 0.8, 0.12, 0.3, 0.3]] as const) {
        // (dessinés après les faisceaux des néons, sinon ils ressortent délavés)
        const streak = at(plane(portR * w, portR * len, '#ffffff', { opacity: op }), portR * ox, py + portR * oy, 0.055);
        streak.rotation.z = -0.65;
        streak.renderOrder = POSTER_ORDER;
        leaf.add(streak);
      }
      // plaque de poussée inox (côté du battement), plinthe de coup de pied
      leaf.add(at(box(lw * 0.16, lh * 0.2, 0.03, '#c9ced6'), -side * lw * 0.32, -cf.h * 0.06 - ly, 0.045));
      leaf.add(at(box(lw * 0.9, lh * 0.1, 0.03, '#a8aeb8'), 0, -lh / 2 + lh * 0.07, 0.045));
      cafDoor.add(at(leaf, cx, ly, 0.02));
    }
    // enseigne sous le linteau, en haut des vantaux (au-dessus des hublots) : sur le linteau elle
    // touchait encore le bas de l'afficheur « NOUS SERVONS LE N° » ; masquée pendant le zoom examine.
    const cafSign = at(label(tr('props.station.toCafe'), cf.w * 0.7, 0.18, { color: '#f6efdc', bg: '#b5562a', bold: true }), 0, cf.h / 2 - ft / 2, 0.14);
    cafDoor.add(cafSign);
    s.animate(() => (cafSign.visible = s.examining !== 'afficheur'));
    const note = s.fitX([1180, 250, 70, 70], 9);
    const notice = at(label(tr('props.station.takeTicket'), note.d * 0.9, note.h * 0.8, { color: '#1a1a1a', bg: '#f6efdc', bold: true }), 8.88, note.y, note.z);
    notice.rotation.y = -Math.PI / 2;
    s.add(notice, at(pool('#ffd166', 3, 2, 0.1), 0, 0.01, 4));
  },
};

/** Sandwichs consignés de la vitrine, tous différents et tous bien moisis (GenAI gpt-image-2.6-sunburst,
 *  détourés au ras de l'alpha, base à plat) : club triangle, baguette jambon-beurre sous film, pain de mie
 *  œuf-mayo en barquette. Bruts : `assets/st-sandwich-*-raw.png`. `w` : largeur en fraction de `sw`. */
const SANDWICHES_SHELF = {
  club: { url: `${import.meta.env.BASE_URL}props/st/sandwich-club.png`, aspect: 512 / 429, w: 1.0 },
  baguette: { url: `${import.meta.env.BASE_URL}props/st/sandwich-baguette.png`, aspect: 512 / 173, w: 1.5 },
  oeuf: { url: `${import.meta.env.BASE_URL}props/st/sandwich-oeuf.png`, aspect: 512 / 327, w: 1.0 },
} as const;
/** Cuillère du plateau abandonné : même PNG GenAI que l'icône d'inventaire (256 × 238). */
const SPOON_URL = `${import.meta.env.BASE_URL}inventory/cuillere.png`;
const SPOON_ASPECT = 256 / 238;
/** Assiette de cantine GenAI vue de dessus (gpt-image-2.6-sunburst, détourée en disque 512²) :
 *  purée grise, viande mystère en sauce figée, petits pois flétris. Brut : `assets/st-assiette-raw.png`. */
const PLATE_URL = `${import.meta.env.BASE_URL}props/st/assiette.png`;

/** Décalque GenAI posé à plat (face vers le haut), texture partagée par URL ; pas d'ombre portée
 *  (le cadre transparent ferait une ombre carrée). `round` : disque (UV du carré inscrit). */
const flatMaps = new Map<string, THREE.Texture>();
function flatDecal(url: string, w: number, h: number, round = false): THREE.Mesh {
  let map = flatMaps.get(url);
  if (!map) {
    map = new THREE.TextureLoader().load(url);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    flatMaps.set(url, map);
  }
  const geo = round ? new THREE.CircleGeometry(w / 2, 48) : new THREE.PlaneGeometry(w, h);
  geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, new THREE.MeshToonMaterial({ map, transparent: true, alphaTest: 0.35, polygonOffset: true, polygonOffsetFactor: -2 }));
  m.receiveShadow = true;
  return m;
}

/**
 * 2 bis. Cafétéria d'accueil (porte au fond de la Salle d'Attente). Lieu d'ambiance, sans puzzle :
 * le menu « LE MÊME », la vitrine aux sandwichs consignés (celui de Mme Guichard), la caisse aux
 * horaires du guichet, PERCO-JUNIOR en service minimum. Distincte de la Salle de Pause (aile B).
 */
export const stCafeteria: RoomBuild = {
  camera: { pos: [0, 2.2, 8.2], look: [0, 1.85, 0], fov: 50 },
  shots: {
    menu: { fill: 0.82, fov: 38 },
    vitrine: { px: [470, 300], fill: 1.05, orbit: -5, fov: 38 },
    comptoir: { fill: 0.9, orbit: -4 },
    cafe: { px: [1030, 290], fill: 0.85, orbit: 3 },
    // couvert abandonné : assiette GenAI, verre, cuillère ; la cuillère se prend d'un clic dans le plan.
    // Cadrage explicite (le rayon auto du rect tombe tantôt sur la table, tantôt sur le sol du fond)
    tables: { cam: { pos: [4.4, 2.08, 3.5], look: [5.14, 0.96, 2.64], fov: 38 }, picks: ['cuillere'] },
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
    s.spot('menu', poster(s, s.rect('menu'), 'platdujour'));
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
    // étage du bas : club et œuf-mayo (à gauche du plomb pour rester lisibles) ; étage du haut : la
    // baguette, et la place vide de Mme Guichard
    // visuel redressé (base à plat), pied au ras du dessus de la tablette, un peu en avant pour la
    // lecture ; ombre de contact plaquée sur la tablette (pas l'ombre « sol » du billboard, 4 cm plus haut)
    const shelfTop = 0.035 / 2;
    for (const [kind, x, y] of [['club', -0.3, 0], ['oeuf', -0.01, 0], ['baguette', -0.2, 1]] as const) {
      const sp = SANDWICHES_SHELF[kind];
      const w = sw * sp.w;
      const sand = at(billboard(sp.url, w / sp.aspect, sp.aspect, { tint: '#e8f0f4', shadow: w * 0.42 }), x * vr.w, shelfY[y] + shelfTop - 0.002, 0.04);
      sand.children[0].position.y = 0.004;
      case_.add(sand);
    }
    const reserved = at(label(tr('props.station.reserved'), vr.w * 0.26, caseH * 0.14, { color: '#c0392b', bg: '#f6efdc', bold: true }), vr.w * 0.2, shelfY[1] + caseH * 0.1, 0.1);
    case_.add(reserved);
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

    // ── M. Ficus, devant entre le comptoir et PERCO-JUNIOR (tant qu'il n'est pas dans la poche de Gary) ──
    const pl = s.stand(s.rect('plante'));
    s.spot('plante', at(ficus(pl.h * 0.95), pl.x, 0, pl.z, -0.5));

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
    // couvert abandonné, posé à plat sur le dessus (y = topY) : assiette au centre, cuillère à sa
    // droite et verre derrière à droite, vus depuis le plan d'examen (caméra à l'avant-gauche).
    // Axes « écran » du plan `tables` au sol : droite ≈ (0.75, 0.66), profondeur ≈ (0.66, −0.75).
    const topY = tH + 0.03;
    const R = [0.75, 0.66] as const;
    const F = [0.66, -0.75] as const;
    const px = -0.1, pz = 0.08;
    const rimR = 0.2;
    const plateH = 0.022;
    const plate = new THREE.Group();
    plate.add(at(cyl(rimR, rimR * 0.72, plateH, '#ece6d6', { seg: 40 }), 0, plateH / 2, 0));
    plate.add(at(flatDecal(PLATE_URL, rimR * 2 * 0.995, 0, true), 0, plateH + 0.001, 0));
    tables.add(at(plate, px, topY, pz, 0.4));
    // verre de cantine (Duralex) debout sur la table, un fond d'eau tiède
    const gR = 0.048, gH = 0.13;
    const glass = new THREE.Group();
    glass.add(at(cyl(gR, gR * 0.84, gH, '#cfe8f2', { seg: 16, opacity: 0.42, edges: true }), 0, gH / 2, 0));
    glass.add(at(cyl(gR * 0.9, gR * 0.8, gH * 0.45, '#9fc7d6', { seg: 16, opacity: 0.55, edges: false }), 0, gH * 0.24, 0));
    glass.add(at(cyl(gR * 0.86, gR * 0.86, 0.008, '#e9f6fb', { seg: 16, opacity: 0.6, edges: false }), 0, 0.004, 0));
    const gd = rimR + 0.09;
    tables.add(at(glass, px + R[0] * gd * 0.8 + F[0] * gd * 0.75, topY, pz + R[1] * gd * 0.8 + F[1] * gd * 0.75));
    s.spot('tables', at(tables, tr_.x, 0, tr_.z));
    // cuillère en plastique beige couchée à plat à droite de l'assiette (GenAI `inventory/cuillere.png`,
    // la même image que l'icône d'inventaire ; hotspot `cuillere`, ramassable dans le plan d'examen).
    // L'image a la cuillère en diagonale (manche bas-gauche → cuilleron haut-droit) : à plat, elle
    // pointe donc déjà vers le fond ; petit quart de tour pour qu'elle longe le bord de l'assiette.
    const spoonW = 0.25;
    const spoon = flatDecal(SPOON_URL, spoonW, spoonW / SPOON_ASPECT);
    spoon.rotation.y = 0.3;
    const sd = rimR + 0.11;
    s.spot('cuillere', at(spoon, tr_.x + px + R[0] * sd, topY + 0.002, tr_.z + pz + R[1] * sd, 0.3));

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

/** Guichet ouvert (éclat sur l'horloge après la déduction du carnet) : 10 h 12, rideau levé, 9 848. */
const OPEN: Condition = { flags: ['st_guichet_ouvert'] };

/**
 * Horloge murale ronde bloquée sur 10 h 11 (rayon `r`) ; trotteuse qui hésite sur la 59e seconde.
 * Avec `open` vrai, la grande aiguille passe à 10 h 12 (petit à-coup), la trotteuse repart.
 */
function clock1011(s: Stage, r: number, open?: Condition): THREE.Group {
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
  let minute = 11;
  s.animate((t) => {
    const isOpen = !!open && s.is(open);
    if (isOpen) {
      // 10 h 12 : la grande aiguille franchit la minute (glisse + léger rebond), la trotteuse tourne enfin
      minute += (12 - minute) * 0.08;
      min.rotation.z = -(minute / 60) * Math.PI * 2 + Math.sin(t * 25) * 0.01 * (12 - minute);
      hour.rotation.z = -(10 / 12) * Math.PI * 2 - (minute / 60) * (Math.PI / 6);
      sec.rotation.z = -((t % 60) / 60) * Math.PI * 2;
      return;
    }
    minute = 11;
    min.rotation.z = -(11 / 60) * Math.PI * 2;
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
    guichard: { fill: 0.7 },
    hygiaphone: { fill: 0.8, lift: 0.1, fov: 38 },
    horloge: { fill: 0.85, fov: 36 },
    horaires: { fill: 0.85, orbit: 4, fov: 36 },
    rideau: { fill: 0.75, orbit: 6 },
    pupitre: { px: [240, 350], fill: 1.1, orbit: -3, lift: 1.1, aim: [0.1, -0.95, 0], fov: 36 },
    porte_b: { fill: 0.85, orbit: 6, fov: 42 },
    // détails (sous-hotspots du YAML) : plans serrés
    afficheur: { fill: 0.45, fov: 40 },
    lecteur: { fill: 1.3, orbit: 8, fov: 34 },
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
    // dessus du comptoir (rebord de la baie) relevé de 405 à 360 px : il coupe le buste de
    // Mme Guichard à mi-poitrine ; son assise remonte moins (372 px) pour que ses mains et ses
    // occupations (élastique, cartes, trombones) restent au-dessus du rebord
    const top = s.wallAt(640, 360, zb).y;
    const seat = s.wallAt(640, 372, zb).y;
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
    // Le rebord relevé (top) masque le bas du buste ; l'assise (seat) ne bouge pas.
    // Cadrage v4 : buste remonté de ≈ 22 px (assise visuelle 372 → 350 px) pour que le visage
    // soit net dans la vitre, menton au-dessus de l'hygiaphone ; la taille (gh) ne change pas.
    const lift = s.wallAt(640, 350, zb).y - seat;
    const gBase = seat - 0.08 + lift;
    const gh = Math.min((g.y + g.h / 2) - (seat - 0.05), g.w / GUICHARD_ASPECT);
    const guichard = billboardSheet(GUICHARD_SHEET, GUICHARD_FRAMES, gh, GUICHARD_ASPECT, { tint: '#fff2f6', shadow: 0.01 });
    const gs = guichard.userData.sprite as THREE.Sprite;
    const baseSY = gs.scale.y;
    s.spot('guichard', at(guichard, x1, gBase, zg));
    // occupations de bureau lentes, jamais synchronisées sur le dialogue (la bouche ne bouge que
    // dans le portrait de la boîte de dialogue)
    // frame 4 : la balle d'élastiques peinte est effacée de la planche, une vraie balle 3D tourne
    // sur le bout du doigt à sa place (elle suit la respiration du sprite)
    const ball = guichardBall(gs.scale.x, baseSY);
    guichard.add(ball.object);
    // frame 3 : même principe pour la chaîne de trombones, une vraie chaîne 3D qui se balance
    // sous ses doigts (la chaîne peinte est effacée de la cellule 3)
    const chain = guichardChain(gs.scale.x, baseSY);
    guichard.add(chain.object);
    s.animate((t) => {
      const f = actorFrame('guichard', GUICHARD_ACTOR, t);
      guichard.userData.setFrame(f);
      gs.scale.y = baseSY * (1 + Math.sin(t * 1.1) * 0.006); // respiration de fonctionnaire
      ball.update(f, t, gs.scale.y / baseSY);
      chain.update(f, t, gs.scale.y / baseSY);
    });
    // rideau métallique du guichet 1, à moitié baissé : lames horizontales, barre de charge
    const shutter = new THREE.Group();
    const sh = glassH * 0.12; // v4 : 0,22 → 0,12, un peu d'air au-dessus du chignon
    for (let i = 0; i < 7; i++) shutter.add(at(box(w1 - 0.14, sh / 7 - 0.01, 0.03, i % 2 ? '#9aa0a8' : '#a9afb8', { edges: false }), 0, -i * (sh / 7), 0));
    shutter.add(at(box(w1 - 0.1, 0.06, 0.06, '#5a5f6a'), 0, -sh, 0));
    const shutterY = fasciaB - sh / 14;
    s.add(at(shutter, x1, shutterY, zb - 0.06));
    // il tressaille quand elle parle (prêt à tomber à 10 h 14) ; à 10 h 12 il remonte dans le bandeau
    let lift1 = 0;
    s.animate((t) => {
      lift1 += ((s.is(OPEN) ? sh + 0.08 : 0) - lift1) * 0.1;
      shutter.position.y = shutterY + lift1 - (speaking.id === 'guichard' && speaking.talking ? Math.abs(Math.sin(t * 30)) * 0.01 : 0);
    });
    // pancarte suspendue derrière la vitre : FERMÉ (10 h 11) / OUVERT (10 h 12)
    const plate = (text: string, bg: string) => at(label(text, 0.62, 0.2, { color: '#f6efdc', bg, bold: true }), x1 - w1 * 0.36, top + glassH * 0.5, zb - 0.01);
    s.when({ notFlags: ['st_guichet_ouvert'] }, plate(tr('props.station.deskClosed'), '#c0392b'));
    s.when(OPEN, plate(tr('props.station.deskOpen'), '#1f7f73'));
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
    // cadenas accroché devant la barre de charge ET devant le nez du plateau du comptoir (plateau :
    // y = top…top + 0,07, nez à zb + 0,125). Le rideau est à zb - 0,02 : z local 0,2 met la face arrière
    // du corps à zb + 0,15, au-delà du nez, donc rien ne le coupe. Corps centré à top + 0,05 : il
    // chevauche le rebord blanc, l'anse enjambe la barre de charge.
    const lock = new THREE.Group();
    lock.add(at(box(0.19, 0.16, 0.06, '#e8c26a'), 0, 0, 0), at(torus(0.06, 0.018, '#c9ced6'), 0, 0.1, -0.01));
    closed.add(at(lock, 0, top + 0.05, 0.2));
    closed.add(at(label(tr('props.station.desk2'), w2 * 0.66, 0.42, { color: '#f6efdc', bg: '#3e3448', bold: true }), 0, top + glassH * 0.62, 0.03));
    s.spot('rideau', at(closed, x2, 0, zb - 0.02));

    // ── bandeau : horloge 10 h 11, afficheur « EN COURS 9 847 » ──
    const ck = s.fit(s.rect('horloge'), zb + 0.08);
    s.spot('horloge', at(clock1011(s, Math.min(ck.w, ck.h) * 0.48, OPEN), ck.x, ck.y, zb + 0.08));
    const af = s.fit([690, 38, 150, 58], zb + 0.06);
    const board = new THREE.Group();
    board.add(at(box(af.w, af.h, 0.08, '#1a1418'), 0, 0, 0));
    board.add(at(label(tr('props.station.nowServing'), af.w * 0.4, af.h * 0.5, { color: '#ffd166', bold: true }), -af.w * 0.27, 0, 0.05));
    // 9 847 depuis 1985 ; 9 848 à 10 h 12 (flag st_guichet_ouvert)
    const num = (n: string) => at(label(n, af.w * 0.5, af.h * 0.7, { color: '#ff4f5a', bg: '#140a0a', bold: true, mono: true, space: 0.28 }), af.w * 0.22, 0, 0.05);
    const n47 = num('9 847');
    const n48 = num('9 848');
    board.add(n47, n48, at(glow('#ff4f5a', af.w, 0.15), af.w * 0.22, 0, 0.08));
    s.when({ notFlags: ['st_guichet_ouvert'] }, n47);
    s.when(OPEN, n48);
    s.spot('afficheur', at(board, af.x, af.y, zb + 0.06));

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
    // emplacement du formulaire : creux vide, plus clair (poli par des milliers de coudes), filet sombre
    const slotW = pr.w * 0.5;
    tablet.add(at(box(slotW + 0.03, 0.002, 0.25, '#5a4836', { edges: false }), pr.w * 0.12, 0.026, 0.12));
    tablet.add(at(box(slotW, 0.004, 0.22, '#84705a', { edges: false }), pr.w * 0.12, 0.027, 0.12));
    // tampon encreur « B-7/12 — STOCK ÉPUISÉ » : cadre double, encre mangée par endroits, de biais
    const empty = label(tr('props.station.outOfForms'), pr.w * 0.3, 0.15, { color: '#c0392b', bold: true });
    const stampMat = empty.material as THREE.MeshBasicMaterial;
    const cv = stampMat.map!.image as HTMLCanvasElement;
    const ink = cv.getContext('2d')!;
    const u = cv.height / 40;
    ink.strokeStyle = '#c0392b';
    ink.lineWidth = u * 1.6;
    ink.strokeRect(u * 1.5, u * 1.5, cv.width - u * 3, cv.height - u * 3);
    ink.lineWidth = u * 0.6;
    ink.strokeRect(u * 3.6, u * 3.6, cv.width - u * 7.2, cv.height - u * 7.2);
    ink.globalCompositeOperation = 'destination-out';
    let seed = 47;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 170; i++) {
      ink.globalAlpha = 0.3 + rnd() * 0.7;
      ink.beginPath();
      ink.arc(rnd() * cv.width, rnd() * cv.height, u * (0.2 + rnd() * 0.9), 0, Math.PI * 2);
      ink.fill();
    }
    ink.globalAlpha = 1;
    ink.globalCompositeOperation = 'source-over';
    stampMat.map!.needsUpdate = true;
    stampMat.transparent = true;
    stampMat.opacity = 0.9;
    stampMat.depthWrite = false;
    at(empty, pr.w * 0.14, 0.031, 0.12);
    empty.rotation.x = -Math.PI / 2;
    empty.rotation.z = 0.16;
    // stylo à chaînette : corps bleu, capuchon, chaînette de maillons jusqu'à l'œillet du plateau
    const penX = -pr.w * 0.3;
    const pen = at(cyl(0.012, 0.012, 0.22, '#1f4fa0', { edges: false }), penX, 0.04, 0.12);
    pen.rotation.z = Math.PI / 2;
    const cap = at(cyl(0.014, 0.014, 0.05, '#c9ced6', { edges: false }), penX - 0.12, 0.04, 0.12);
    cap.rotation.z = Math.PI / 2;
    tablet.add(at(cyl(0.02, 0.02, 0.012, '#8a8f98', { edges: false }), -pr.w * 0.42, 0.032, -0.02));
    const c0 = new THREE.Vector3(penX - 0.145, 0.034, 0.12);
    const c1 = new THREE.Vector3(-pr.w * 0.42, 0.034, -0.02);
    for (let i = 0; i <= 9; i++) {
      const p = c0.clone().lerp(c1, i / 9);
      p.x += Math.sin((i / 9) * Math.PI) * -0.035; // léger mou
      const link = at(box(0.014, 0.008, 0.008, i % 2 ? '#aab0b8' : '#d6dae0', { edges: false }), p.x, p.y, p.z);
      link.rotation.y = i % 2 ? 0.9 : -0.5;
      tablet.add(link);
    }
    tablet.add(fill, empty, pen, cap);
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
    // demande verbale 47bis (st_acces_aile_b) : diode verte, « ACCÈS OK », battants entrouverts
    const ACCESS: Condition = { flags: ['st_acces_aile_b'] };
    const led = at(sphere(0.04, '#ff4f5a', { glow: true }), 0, -0.16, 0.05);
    const ledOk = at(sphere(0.04, '#4fe07a', { glow: true }), 0, -0.16, 0.05);
    const refused = at(label(tr('props.station.wingBReader'), 0.32, 0.22, { color: '#ff4f5a', bg: '#140a0a', bold: true, mono: true }), 0, 0.08, 0.045);
    const granted = at(label(tr('props.station.wingBReaderOk'), 0.32, 0.22, { color: '#4fe07a', bg: '#0a140c', bold: true, mono: true }), 0, 0.08, 0.045);
    reader.add(refused, granted, led, ledOk);
    s.when({ notFlags: ['st_acces_aile_b'] }, refused);
    s.when(ACCESS, granted, ledOk);
    wing.add(at(reader, -bf.w / 2 - 0.3, -bf.h * 0.05, 0.02));
    s.animate((t) => (led.visible = !s.is(ACCESS) && Math.floor(t * 1.5) % 2 === 0));
    // lueur froide du couloir derrière les battants entrouverts
    const gap = at(plane(bf.w * 0.16, bf.h * 0.86, '#d8f0ff', { glow: true }), 0, -bf.h * 0.05, 0.005);
    wing.add(gap);
    s.when(ACCESS, gap);
    // le hotspot porte_b disparaît avec l'accès (sortie vers_couloir_b à la place) : la porte, elle, reste
    s.add(wing);
    s.spot('lecteur', reader);
    s.add(at(pool('#ffd166', 3, 2, 0.1), 0, 0.01, 4));
  },
};

/** Couloir dénoué (Ink « suivre la plante ») : plaques des bureaux, sorties. */
const RESOLU: Condition = { flags: ['st_couloir_resolu'] };

/**
 * 4. Couloir Infini B (Aile B). Une seule pièce : trois portes mauves numérotées, l'extincteur
 * « NE PAS DÉPLACER » (repère), le panneau « VOUS ÊTES ICI (ENCORE) », le casier « STOCK B-7/12 » au
 * bout. La boucle est jouée par l'Ink (docs/CHAPTER1.md §10) ; ici, seuls les props suivent les flags :
 * M. Ficus posé (`st_plante_posee`), plaques ARCHIVES / TAMPONS / RÉCLAMATIONS (`st_couloir_resolu`),
 * casier fermé qui s'ouvre au « utiliser » du formulaire (`st_formulaire`), puis reste ouvert et vide. Accents mauves de l'Aile B.
 */
export const stCouloirB: RoomBuild = {
  camera: { pos: [0, 2.2, 8.2], look: [0, 1.85, 0], fov: 50 },
  shots: {
    porte_b1: { fill: 0.8, orbit: -6, fov: 42 },
    porte_b2: { fill: 0.8, fov: 42 },
    porte_b3: { fill: 0.8, orbit: 6, fov: 42 },
    panneau: { fill: 0.8, fov: 36 },
    extincteur: { fill: 0.9, lift: 0.2, fov: 36 },
    emplacement: { fill: 0.9, lift: 0.4, fov: 40 },
    ficus_pose: { fill: 0.85, lift: 0.2, fov: 40 },
    ficus: { fill: 0.85, lift: 0.2, orbit: -4, fov: 40 },
    casier: { fill: 0.85, orbit: 8, fov: 40 },
  },
  intro: 'panneau',
  build(s) {
    const MAUVE = '#5a4a6a';
    shell(s, { floor: { a: '#4a4e54', b: '#52565c', joint: '#2a2c30', tile: 0.6 }, wall: { top: '#b9c0c4', bottom: '#6e7880' }, trim: '#3e3448', left: -9, right: 9 });
    wallPanels(s, '#9aa2a8', -9, 9, 1.5, 8);
    s.lights({
      sky: '#eef6ff',
      ground: '#24262a',
      ambient: 1.1,
      key: { color: '#f0fff4', intensity: 1.9, pos: [0, 9, 6], target: [0, 0, 0] },
      points: [
        // halo rouge de l'extincteur, petite lampe froide sur le casier
        { color: '#ff5a4a', intensity: 1.6, pos: [-2.6, 2, 1.2], distance: 2.6 },
        { color: '#bfe6ff', intensity: 1.8, pos: [7.4, 3.2, 1.5], distance: 3.5 },
      ],
      rim: { color: '#8a6db0', intensity: 0.6, pos: [-6, 5, -4] },
      fill: { color: '#9aa8ff', intensity: 0.35, pos: [6, 3, 6] },
      fog: { color: '#1c1e22', near: 9, far: 24 },
      vignette: { color: '#0c0d10', strength: 0.65, warm: '#e0f0ff14' },
    });
    const neonY = s.wallAt(640, 10, 2).y;
    neonTubes(s, neonY, [-6, 0, 6], 2.4);

    // chemin de lino central (le couloir « file » vers le fond, jamais très loin)
    for (let i = 0; i < 6; i++) s.add(at(box(1.6, 0.012, 0.9, i % 2 ? '#5d6168' : '#666a70', { edges: false, shadow: false }), 0, 0.006, 1 + i * 1.1));

    // ── portes B-1, B-2, B-3 : mauves, hublot dépoli, plaque ; après le dénouement, plaque de bureau ──
    const doors: [string, string, string][] = [
      ['porte_b1', 'B-1', tr('props.station.officeArchives')],
      ['porte_b2', 'B-2', tr('props.station.officeStamps')],
      ['porte_b3', 'B-3', tr('props.station.officeComplaints')],
    ];
    const walkDoors: Record<string, WalkDoor> = {};
    for (const [id, num, office] of doors) {
      const { door, f } = backDoor(s, s.rect(id), 0.1, '#3e3448', MAUVE);
      // battant sur pivot (montant gauche) : il s'ouvre pendant la marche de la boucle ; derrière, le noir
      const jamb = Math.min(f.w, f.h) * 0.08;
      const hx = f.w / 2 - jamb;
      const leaf = at(new THREE.Group(), -hx, 0, 0);
      const panel = door.children[3];
      panel.position.x += hx;
      leaf.add(panel);
      door.add(leaf);
      const dark = new THREE.Mesh(new THREE.PlaneGeometry(f.w - 2 * jamb, f.h - jamb), new THREE.MeshBasicMaterial({ color: '#040507' }));
      door.add(at(dark, 0, -jamb / 2, -0.09), at(glow('#cfe0ff', f.w * 0.5, 0.18), 0, -f.h * 0.05, -0.085));
      walkDoors[id] = { x: f.x, y: f.y - jamb / 2, leaf };
      const port = at(cyl(f.w * 0.16, f.w * 0.16, 0.03, '#c9d6e0', { seg: 18 }), hx, f.h * 0.2, 0.02);
      port.rotation.x = Math.PI / 2;
      leaf.add(port, at(torus(f.w * 0.16, 0.025, '#2a2830'), hx, f.h * 0.2, 0.04));
      leaf.add(at(box(f.w * 0.08, 0.05, 0.08, '#c9ced6'), hx + f.w * 0.3, -f.h * 0.05, 0.04));
      const plateY = f.h / 2 + 0.24;
      const numPlate = at(label(num, f.w * 0.55, 0.32, { color: '#f6efdc', bg: '#2a2830', bold: true, mono: true }), 0, plateY, 0.08);
      const officePlate = at(label(office, f.w * 1.05, 0.32, { color: '#f6efdc', bg: '#1f7f73', bold: true }), 0, plateY, 0.08);
      // Acte II : dénouée, la porte devient une sortie (hotspot masqué, la porte reste) ; filet de lumière entrouvert
      const ajar = at(plane(f.w * 0.06, f.h * 0.86, '#fff2c0', { glow: true }), f.w * 0.42, -f.h * 0.05, 0.01);
      door.add(numPlate, officePlate, ajar);
      s.when({ notFlags: ['st_couloir_resolu'] }, numPlate);
      s.when(RESOLU, officePlate, ajar);
      // survol : la plaque numérotée suit le hotspot (masqué une fois le couloir dénoué)
      s.spot(id, numPlate);
    }

    // Acte III : deux petites portes entre la B-2 et la B-3 (Salle de Pause, Sous-Chef), apparues au dénouement
    for (const [id, num, office] of [
      ['vers_pause', 'B-4', tr('props.station.officeBreak')],
      ['vers_sous_chef', 'B-5', tr('props.station.officeDeputy')],
    ] as const) {
      const { door, f } = backDoor(s, s.rect(id), 0.1, '#3e3448', '#6e5a7a');
      door.add(at(box(f.w * 0.08, 0.05, 0.08, '#c9ced6'), f.w * 0.3, -f.h * 0.05, 0.04));
      door.add(at(label(num, f.w * 0.5, 0.22, { color: '#f6efdc', bg: '#2a2830', bold: true, mono: true }), 0, f.h * 0.28, 0.05));
      door.add(at(label(office, f.w * 1.1, 0.26, { color: '#f6efdc', bg: '#1f7f73', bold: true }), 0, f.h / 2 + 0.2, 0.08));
      s.when(RESOLU, door);
    }

    // panneau GenAI « AILE B — VOUS ÊTES ICI (ENCORE) »
    s.spot('panneau', poster(s, s.rect('panneau'), 'aileb'));
    inkStamp(s, 800, 232, tr('props.station.stampPending'));

    // ── l'extincteur (repère) : bouteille rouge, tête, flexible, support ; panneau GenAI au-dessus ──
    const ex = s.fit(s.rect('extincteur'), 0.25);
    const ext = new THREE.Group();
    const eh = ex.h * 0.62;
    const er = Math.min(ex.w * 0.32, 0.16);
    ext.add(at(cyl(er, er, eh, '#c0392b', { seg: 18 }), 0, 0, 0));
    ext.add(at(sphere(er, '#c0392b', { seg: 14 }), 0, eh / 2, 0));
    ext.add(at(cyl(er * 0.35, er * 0.45, er * 0.9, '#2a2830', { seg: 10 }), 0, eh / 2 + er * 0.9, 0));
    ext.add(at(box(er * 1.6, er * 0.25, er * 0.4, '#2a2830'), er * 0.4, eh / 2 + er * 1.35, 0));
    const hose = at(cyl(er * 0.12, er * 0.12, eh * 0.8, '#1a1a1a', { edges: false }), er * 1.2, 0, er * 0.3);
    hose.rotation.z = 0.08;
    ext.add(hose, at(box(er * 2.2, er * 0.5, er * 0.3, '#5a5f6a'), 0, eh * 0.1, -er - 0.02));
    ext.add(at(label('EXT-B-001', er * 1.6, er * 0.5, { color: '#1a1a1a', bg: '#f6efdc', bold: true, mono: true }), 0, -eh * 0.15, er + 0.005)); // i18n-ignore (étiquette d'inventaire)
    ext.add(at(glow('#ff5a4a', er * 8, 0.12), 0, 0, -0.1));
    s.spot('extincteur', at(ext, ex.x, ex.y - ex.h * 0.12, 0.25));
    const exSign = s.fit([418, 150, 74, 96], 0.06);
    const es = stSign('extincteur', exSign.w, exSign.h);
    s.add(onTop(at(box(es.w * 1.03, es.h * 1.03, 0.02, '#3a3630', { shadow: false }), exSign.x, exSign.y, 0.06)));
    s.add(onTop(at(es.mesh, exSign.x, exSign.y, 0.072), POSTER_ORDER + 1));

    // ── emplacement au sol (trace de pot, lino plus clair) / M. Ficus posé dessus ──
    const em = s.stand(s.rect('emplacement'));
    const trace = new THREE.Group();
    const sq = at(box(em.w * 0.55, 0.01, em.w * 0.55, '#7d8288', { edges: false, shadow: false }), 0, 0.012, 0);
    const ring = at(torus(em.w * 0.14, 0.012, '#3a3e44'), 0, 0.02, 0);
    ring.rotation.x = Math.PI / 2;
    trace.add(sq, ring);
    s.spot('emplacement', at(trace, em.x, 0, em.z));
    // M. Ficus posé juste à gauche de l'extincteur (ficus_pose) ; le couloir glissé (st_couloir_glisse),
    // le même M. Ficus une porte plus à gauche, de l'autre côté de la B-1 (ficus). La marche de la
    // boucle fait glisser le premier jusqu'à la place du second (CouloirWalkRig).
    const fh = s.stand(s.rect('ficus_pose')).h * 0.9;
    const plant = at(ficus(fh), em.x, 0, em.z, 0.5);
    s.spot('ficus_pose', plant);
    const fs = s.stand(s.rect('ficus'));
    const slid = at(ficus(fh), fs.x, 0, fs.z, 0.5);
    s.spot('ficus', slid);
    s.animate((t) => (plant.rotation.z = slid.rotation.z = Math.sin(t * 0.6) * 0.01));
    const walk = new CouloirWalkRig(s, walkDoors, { obj: plant, from: plant.position.clone(), to: slid.position.clone() }, { y: neonY - 0.05, z: 2.4, xs: [-6, 0, 6] });
    s.expose(CouloirWalkRig.ID, walk);
    if (import.meta.env.DEV) (window as unknown as { __qjCouloirWalk: CouloirWalkRig }).__qjCouloirWalk = walk;

    // ── casier « STOCK B-7/12 » : armoire grise, étiquette GenAI ; porte fermée, s'ouvre quand Gary prend le formulaire ──
    const cz = 0.45;
    const cs = s.fit(s.rect('casier'), cz);
    const cab = new THREE.Group();
    const cw = cs.w * 0.9;
    const ch = cs.h * 0.95;
    // caisson creux (fond, flancs, dessus, socle) : l'étagère se voit porte ouverte
    const T = 0.05;
    cab.add(at(box(T, ch, 0.7, '#6e7880'), -cw / 2 + T / 2, ch / 2, -0.35), at(box(T, ch, 0.7, '#6e7880'), cw / 2 - T / 2, ch / 2, -0.35));
    cab.add(at(box(cw, T, 0.7, '#6e7880'), 0, ch - T / 2, -0.35), at(box(cw, 0.12, 0.7, '#4a5058'), 0, 0.06, -0.35));
    // intérieur sombre (fond du casier) : visible quand la porte s'ouvre
    cab.add(at(box(cw, ch, 0.02, '#2a2c30', { edges: false }), 0, ch / 2, -0.69));
    // étagère et le formulaire (visible tant qu'il n'est pas pris)
    cab.add(at(box(cw * 0.88, 0.03, 0.6, '#9aa2a8'), 0, ch * 0.5, -0.3));
    const form = new THREE.Group();
    // posé debout contre le fond, légèrement incliné : lisible depuis la caméra
    form.add(at(box(cw * 0.55, cw * 0.72, 0.012, '#efe4c6'), 0, 0, 0));
    form.add(at(label(tr('props.station.formB712'), cw * 0.42, cw * 0.14, { color: '#1a1a1a', bold: true }), 0, cw * 0.2, 0.008));
    for (let i = 0; i < 4; i++) form.add(at(box(cw * 0.3, 0.012, 0.004, '#8a8070', { edges: false }), cw * 0.05, cw * (0.02 - i * 0.09), 0.008));
    form.rotation.x = -0.12;
    const formObj = at(form, 0, ch * 0.5 + cw * 0.38, -0.45);
    cab.add(formObj);
    s.when({ flags: ['st_couloir_resolu'], notFlags: ['st_formulaire'] }, formObj);
    const formGlow = at(glow('#fff2c0', cw * 1.2, 0.3), 0, ch * 0.5 + 0.1, 0);
    cab.add(formGlow);
    s.when({ flags: ['st_couloir_resolu'], notFlags: ['st_formulaire'] }, formGlow);
    s.animate((t) => (formGlow.material.opacity = 0.22 + Math.sin(t * 2.2) * 0.08));
    // porte pivotante (charnière à droite : elle s'ouvre vers la caméra sans masquer l'étagère), étiquette GenAI
    const hinge = new THREE.Group();
    hinge.position.set(cw / 2, ch / 2, 0.02);
    const leaf = new THREE.Group();
    leaf.add(at(box(cw, ch, 0.04, '#7c8794'), -cw / 2, 0, 0));
    for (let i = 0; i < 4; i++) leaf.add(at(box(cw * 0.5, 0.02, 0.01, '#4a5058', { edges: false }), -cw / 2, ch * 0.32 - i * 0.06, 0.025));
    const st = stSign('stock', cw * 0.8, ch * 0.22);
    leaf.add(at(st.mesh, -cw / 2, ch * 0.18, 0.025));
    leaf.add(at(box(0.04, 0.2, 0.05, '#c9ced6'), -cw * 0.88, -ch * 0.02, 0.04));
    hinge.add(leaf);
    cab.add(hinge);
    // fermé par défaut : la porte ne s'ouvre qu'au geste « utiliser » qui donne le formulaire
    // (rig `casier-open`, RoomScene attend CASIER_OPEN_MS avant la bulle), puis reste ouverte.
    let open = s.is({ flags: ['st_formulaire'] }) ? 1 : 0;
    let opening = false;
    s.animate(() => {
      const target = opening || s.is({ flags: ['st_formulaire'] }) ? 1 : 0;
      open += (target - open) * 0.06;
      hinge.rotation.y = open * 1.9;
    });
    s.expose(CASIER_OPEN_ID, {
      open(id: string): number {
        if (id !== 'casier' || !s.is({ flags: ['st_couloir_resolu'], notFlags: ['st_formulaire'] })) return 0;
        opening = true;
        return CASIER_OPEN_MS;
      },
    } satisfies OpenRig);
    s.spot('casier', at(cab, cs.x, 0, cz));

    bobHere(s);

    // Acte IV : porte d'ascenseur inox sur le mur de droite, après le casier (case D requise)
    const ld = s.fitX(s.rect('vers_ascenseur'), 9);
    const lift = new THREE.Group();
    lift.add(at(box(0.3, ld.h, ld.d * 1.15, '#5a5f6a'), 0, 0, 0));
    for (const sz of [-1, 1]) lift.add(at(box(0.08, ld.h * 0.94, ld.d * 0.48, '#a9b0b8'), -0.16, -ld.h * 0.03, (sz * ld.d) / 4));
    lift.add(at(sphere(0.05, '#4fe07a', { glow: true }), -0.2, ld.h / 2 - 0.15, 0));
    s.add(at(lift, 9, ld.y, ld.z));
    const lsign = at(label(tr('props.station.liftShort'), ld.d * 1.3, 0.32, { color: '#f6efdc', bg: '#1f5f5a', bold: true }), 8.95, ld.y + ld.h / 2 + 0.28, ld.z);
    lsign.rotation.y = -Math.PI / 2;
    s.when(RESOLU, lift, lsign);

    // ── porte de gauche : retour au Guichet d'Accueil ──
    const d = s.fitX(s.rect('vers_guichet'), -9);
    const door = new THREE.Group();
    door.add(at(box(0.3, d.h, d.d * 1.12, '#3e3448'), 0, 0, 0), at(box(0.1, d.h * 0.94, d.d, '#7c6e86'), 0.15, -d.h * 0.03, 0));
    s.add(at(door, -9, d.y, d.z));
    const wsign = at(label(tr('props.station.reception2'), d.d * 1.1, 0.35, { color: '#f6efdc', bg: '#8a6db0', bold: true }), -8.95, d.y + d.h / 2 + 0.3, d.z);
    wsign.rotation.y = Math.PI / 2;
    s.add(wsign, at(pool('#d8f0ff', 3, 2, 0.08), 0, 0.01, 4));
  },
};

// ── Acte II « Humain, preuves à l'appui » : les bureaux de l'Aile B (docs/CHAPTER1.md §4, lieux 5–7) ──

/** Porte de gauche (mur latéral) qui ramène au Couloir Infini B, avec sa plaque. */
function doorToCorridor(s: Stage, color: string): void {
  const d = s.fitX(s.rect('vers_couloir'), -9);
  const door = new THREE.Group();
  door.add(at(box(0.3, d.h, d.d * 1.12, '#3e3448'), 0, 0, 0), at(box(0.1, d.h * 0.94, d.d, '#7c6e86'), 0.15, -d.h * 0.03, 0));
  s.add(at(door, -9, d.y, d.z));
  const sign = at(label(tr('props.station.corridorB'), d.d * 1.1, 0.35, { color: '#f6efdc', bg: color, bold: true }), -8.95, d.y + d.h / 2 + 0.3, d.z);
  sign.rotation.y = Math.PI / 2;
  s.add(sign);
}

/**
 * Fonctionnaire en buste derrière un comptoir (planche GenAI ≥ 2 cellules, jamais synchronisée sur le
 * dialogue) : le bas du buste passe sous le plateau `top` (y monde) du comptoir placé devant.
 */
function clerk(s: Stage, id: string, sheet: string, aspect: number, loops: Parameters<typeof actorFrame>[1], z: number, top: number, tint: string, sink = 0.3): THREE.Group {
  const g = s.fit(s.rect(id), z);
  const base = top - sink;
  const h = Math.min(g.y + g.h / 2 - base, (g.w * 1.25) / aspect);
  // nombre de cellules = plus haute frame citée par les boucles (planche 2 cellules au minimum)
  const frames = Math.max(2, ...[...loops.idle, ...(loops.talk ?? [])].map((st) => st.frame + 1));
  const npc = billboardSheet(sheet, frames, h, aspect, { tint, shadow: 0.01 });
  const sp = npc.userData.sprite as THREE.Sprite;
  const sy = sp.scale.y;
  s.spot(id, at(npc, g.x, base, z));
  s.animate((t) => {
    npc.userData.setFrame(actorFrame(id, loops, t));
    sp.scale.y = sy * (1 + Math.sin(t * 1.1 + z) * 0.006); // respiration de fonctionnaire
  });
  return npc;
}

/**
 * 5. Archives Centrales. Rayonnages qui crèvent le plafond, fichier A–Z (le tiroir G sort avec le
 * dossier GARRY, `st_dossier_trouve`), M. Duplicata derrière son bureau (le badge agrafé y reste),
 * photocopieuse « EN PANNE DE PAPIER » (bac plein et voyant vert avec `st_papier`). Néons mauves.
 */
export const stArchives: RoomBuild = {
  camera: { pos: [0, 2.2, 8.2], look: [0, 1.85, 0], fov: 50 },
  shots: {
    rayonnages: { fill: 0.7, orbit: -8, fov: 44 },
    fichier: { fill: 0.85, orbit: -6, fov: 40 },
    duplicata: { fill: 0.7 },
    photocopieuse: { fill: 0.85, orbit: 6, fov: 40 },
  },
  intro: 'duplicata',
  build(s) {
    const MAUVE = '#6a5a8a';
    shell(s, { floor: { a: '#4a4454', b: '#544e5e', joint: '#2a2632', tile: 0.7 }, wall: { top: '#b4aac2', bottom: '#6e6480' }, trim: '#3e3448', left: -9, right: 9 });
    wallPanels(s, '#9a90aa', -9, 9, 1.6, 8);
    s.lights({
      sky: '#f2ecff',
      ground: '#2a2632',
      ambient: 1.1,
      key: { color: '#f4eeff', intensity: 1.9, pos: [0, 9, 6], target: [0, 0, 0] },
      points: [
        // lampe de bureau de Duplicata (chaude), voyant de la photocopieuse
        { color: '#ffcf8a', intensity: 3, pos: [0.4, 2.3, 1.2], distance: 3.2 },
        { color: '#c8a0ff', intensity: 1.6, pos: [5.2, 2.6, 1.6], distance: 3 },
      ],
      rim: { color: '#a58ad0', intensity: 0.8, pos: [-6, 5, -4] },
      fill: { color: '#9aa8ff', intensity: 0.35, pos: [6, 3, 6] },
      fog: { color: '#1e1a26', near: 9, far: 24 },
      vignette: { color: '#0e0c14', strength: 0.65, warm: '#f0e0ff14' },
    });
    neonTubes(s, s.wallAt(640, 10, 2).y, [-5, 0, 5], 2.4);

    // ── rayonnages : montants, tablettes, boîtes d'archives « 1985 » ; ils filent au-dessus du cadre ──
    const rz = 0.45;
    const r = s.fit(s.rect('rayonnages'), rz);
    const rack = new THREE.Group();
    const rh = r.y + r.h / 2 + 2.5; // au-delà du plafond
    const boxes = ['#8a8478', '#9a9488', '#7c7668', '#a49c8a', '#6e6a60'];
    for (const sx of [-1, 1]) rack.add(at(box(0.08, rh, 0.7, '#3a3444'), (sx * r.w) / 2, rh / 2, 0));
    const shelves = 9;
    for (let i = 0; i < shelves; i++) {
      const y = 0.15 + i * 0.62;
      rack.add(at(box(r.w, 0.05, 0.7, '#4a4454'), 0, y, 0));
      const n = 4;
      for (let k = 0; k < n; k++) {
        const bw = (r.w - 0.2) / n - 0.04;
        const tilt = (i * 7 + k * 3) % 5 === 0 ? 0.12 : 0;
        const b = at(box(bw, 0.48, 0.55, boxes[(i + k * 2) % boxes.length]), -r.w / 2 + 0.12 + bw / 2 + k * (bw + 0.04), y + 0.27, 0.02);
        b.rotation.z = tilt;
        rack.add(b);
        if ((i + k) % 2 === 0) rack.add(at(label('1985', bw * 0.6, 0.14, { color: '#2a2830', bg: '#f6efdc', bold: true, mono: true }), b.position.x, y + 0.3, 0.3)); // i18n-ignore
      }
    }
    s.spot('rayonnages', at(rack, r.x, 0, rz));
    // échelle à roulettes appuyée aux rayonnages
    const ladder = new THREE.Group();
    for (const sx of [-1, 1]) ladder.add(at(box(0.05, 3.4, 0.05, '#c9a24a'), sx * 0.22, 1.7, 0));
    for (let i = 0; i < 9; i++) ladder.add(at(box(0.44, 0.04, 0.04, '#c9a24a'), 0, 0.3 + i * 0.36, 0));
    ladder.rotation.x = -0.18;
    s.add(at(ladder, r.x + r.w * 0.32, 0, rz + 0.75));

    // ── plaque GenAI « ARCHIVES CENTRALES » au-dessus du bureau ──
    poster(s, [610, 22, 220, 100], 'archives');
    inkStamp(s, 880, 120, tr('props.station.stampCertified'));

    // ── bureau de Duplicata (comptoir bas) et M. Duplicata derrière ──
    const zb = 1.15;
    const zg = 0.33; // un poil en retrait du comptoir
    const d = s.fit(s.rect('duplicata'), zb);
    const top = s.wallAt(640, 352, zb).y;
    const desk = new THREE.Group();
    desk.add(at(box(d.w * 1.15, top, 0.7, '#5a4a6a'), 0, top / 2, 0));
    desk.add(at(box(d.w * 1.2, 0.07, 0.85, '#d8cfe0'), 0, top + 0.035, -0.05));
    desk.add(at(box(d.w * 1.15, top * 0.1, 0.02, MAUVE), 0, top * 0.8, 0.36));
    // piles de dossiers, lampe, tampon « CONFORME »
    for (const [x, n] of [[-0.42, 5], [-0.32, 3], [0.38, 7]] as [number, number][]) for (let i = 0; i < n; i++) desk.add(at(box(0.42, 0.035, 0.3, i % 2 ? '#efe4c6' : '#e2d6b6', { edges: false }), x * d.w, top + 0.09 + i * 0.036, -0.1 + (i % 3) * 0.01));
    const lamp = new THREE.Group();
    lamp.add(at(cyl(0.12, 0.14, 0.04, '#2a2830'), 0, 0, 0), at(cyl(0.02, 0.02, 0.5, '#2a2830', { edges: false }), 0, 0.25, 0));
    const shade = at(cyl(0.06, 0.18, 0.16, '#1f5f5a'), 0.08, 0.5, 0);
    shade.rotation.z = 0.5;
    lamp.add(shade, at(glow('#ffcf8a', 0.8, 0.4), 0.14, 0.4, 0.05));
    desk.add(at(lamp, d.w * 0.48, top + 0.07, -0.15));
    // le badge GARRY, agrafé à sa fiche (pièce justificative), une fois le dossier trouvé
    const proof = new THREE.Group();
    proof.add(at(box(0.36, 0.01, 0.26, '#efe4c6', { edges: false }), 0, 0, 0));
    const card = at(label(tr('props.station.badgeGarry'), 0.24, 0.14, { color: '#1a1a1a', bg: '#e0e0e0', bold: true }), 0.02, 0.012, 0.01);
    card.rotation.x = -Math.PI / 2;
    proof.add(card);
    const tag = at(label(tr('props.station.proofTag'), 0.3, 0.08, { color: '#c0392b', bold: true }), 0, 0.013, 0.1);
    tag.rotation.x = -Math.PI / 2;
    proof.add(tag);
    proof.rotation.y = -0.2;
    const proofObj = at(proof, -0.05 * d.w, top + 0.075, 0.12);
    desk.add(proofObj);
    s.when({ flags: ['st_dossier_trouve'] }, proofObj);
    s.add(at(desk, d.x, 0, zb));
    clerk(s, 'duplicata', DUPLICATA_SHEET, DUPLICATA_ASPECT, DUPLICATA_ACTOR, zg, top, '#fff6ec');

    // ── fichier A–Z : six tiroirs, fente à badge, diode ; le tiroir G–I sort avec le dossier GARRY ──
    const fz = 0.55;
    const fc = s.stand(s.rect('fichier'));
    const cab = new THREE.Group();
    const cw = fc.w * 0.92;
    const chh = fc.h * 0.9;
    cab.add(at(box(cw, chh, 0.7, '#7c8794'), 0, chh / 2, 0));
    const ranges = ['A–C', 'D–F', 'G–I', 'J–M', 'N–R', 'S–Z']; // i18n-ignore (étiquettes de tiroirs)
    const dh = (chh - 0.1) / ranges.length;
    let drawerG: THREE.Group | null = null;
    const FOUND: Condition = { flags: ['st_dossier_trouve'] };
    ranges.forEach((txt, i) => {
      const dr = new THREE.Group();
      const y = chh - 0.05 - dh * (i + 0.5);
      dr.add(at(box(cw * 0.94, dh - 0.03, 0.66, '#8d98a5'), 0, 0, 0));
      dr.add(at(label(txt, cw * 0.36, dh * 0.34, { color: '#1a1a1a', bg: '#f6efdc', bold: true, mono: true }), 0, dh * 0.15, 0.335));
      dr.add(at(box(cw * 0.3, 0.035, 0.04, '#c9ced6'), 0, -dh * 0.16, 0.35));
      dr.add(at(box(cw * 0.12, 0.02, 0.01, '#14120e', { edges: false }), cw * 0.32, dh * 0.15, 0.335));
      if (i === 2) {
        // fiche GARRY qui dépasse du tiroir ouvert
        const fiche = at(box(cw * 0.5, dh * 0.5, 0.02, '#efe4c6'), 0, dh * 0.45, 0.1);
        dr.add(fiche);
        s.when(FOUND, fiche);
        drawerG = dr;
      }
      cab.add(at(dr, 0, y, 0.03));
    });
    const ledR = at(sphere(0.035, '#ff4f5a', { glow: true }), cw * 0.38, chh + 0.06, 0.3);
    const ledG = at(sphere(0.035, '#4fe07a', { glow: true }), cw * 0.38, chh + 0.06, 0.3);
    cab.add(ledR, ledG, at(box(cw * 0.3, 0.12, 0.08, '#2a2830'), cw * 0.38, chh + 0.06, 0.25));
    s.when({ notFlags: ['st_dossier_trouve'] }, ledR);
    s.when(FOUND, ledG);
    s.animate((t) => {
      if (drawerG) drawerG.position.z += ((s.is(FOUND) ? 0.42 : 0.03) - drawerG.position.z) * 0.08;
      if (!s.is(FOUND)) ledR.visible = Math.floor(t * 1.4) % 2 === 0;
    });
    s.spot('fichier', at(cab, fc.x, 0, fz));

    // ── photocopieuse beige 1985 : capot, vitre, pupitre, bacs ; « EN PANNE DE PAPIER » (GenAI) ──
    const PAPER: Condition = { flags: ['st_papier'] };
    const pc = s.stand(s.rect('photocopieuse'));
    const cop = new THREE.Group();
    const pw = pc.w * 0.95;
    const ph = pc.h * 0.62;
    cop.add(at(box(pw, ph, 0.9, '#d8cfb8'), 0, ph / 2, 0));
    cop.add(at(box(pw * 1.02, 0.08, 0.95, '#bfb59c'), 0, ph + 0.04, 0));
    const lid = at(box(pw * 0.8, 0.06, 0.8, '#a69c84'), -pw * 0.06, ph + 0.11, 0);
    cop.add(lid);
    // pupitre : bouton vert, voyants
    cop.add(at(box(pw * 0.26, 0.1, 0.3, '#5a5f6a'), pw * 0.36, ph + 0.13, 0.25));
    cop.add(at(cyl(0.05, 0.05, 0.03, '#2fb35a', { seg: 12 }), pw * 0.4, ph + 0.19, 0.25));
    const warn = at(sphere(0.03, '#ff4f5a', { glow: true }), pw * 0.3, ph + 0.19, 0.3);
    const ok = at(sphere(0.03, '#4fe07a', { glow: true }), pw * 0.3, ph + 0.19, 0.3);
    cop.add(warn, ok);
    s.when({ notFlags: ['st_papier'] }, warn);
    s.when(PAPER, ok);
    s.animate((t) => (warn.visible = !s.is(PAPER) && Math.floor(t * 2) % 2 === 0));
    // bac d'alimentation sur le flanc droit : vide, ou plein de réclamations vert pâle (le papier reste)
    cop.add(at(box(0.08, 0.04, 0.6, '#8a8070'), pw / 2 + 0.2, ph * 0.55, 0));
    const stack = new THREE.Group();
    for (let i = 0; i < 9; i++) stack.add(at(box(0.32, 0.02, 0.5, i % 2 ? '#cfe0c0' : '#c2d6b2', { edges: false }), 0, i * 0.022, 0));
    const stackObj = at(stack, pw / 2 + 0.2, ph * 0.55 + 0.03, 0);
    cop.add(stackObj);
    s.when(PAPER, stackObj);
    // bac de sortie
    cop.add(at(box(0.36, 0.03, 0.5, '#8a8070'), -pw / 2 - 0.16, ph * 0.4, 0));
    // panneau GenAI sur la face avant (masqué une fois le papier chargé : un tampon « OK » le remplace)
    const sign = stSign('papier', pw * 0.7, ph * 0.42);
    const signObj = at(sign.mesh, 0, ph * 0.62, 0.456);
    cop.add(signObj);
    s.when({ notFlags: ['st_papier'] }, signObj);
    const okTag = at(label(tr('props.station.paperOk'), pw * 0.55, ph * 0.2, { color: '#f6efdc', bg: '#1f7f73', bold: true }), 0, ph * 0.62, 0.456);
    cop.add(okTag);
    s.when(PAPER, okTag);
    s.spot('photocopieuse', at(cop, pc.x, 0, pc.z));
    s.animate((t) => (ok.scale.setScalar(1 + Math.sin(t * 3) * 0.15)));

    bobHere(s);
    doorToCorridor(s, MAUVE);
    s.add(at(pool('#e0d0ff', 3, 2, 0.08), 0, 0.01, 4));
  },
};

/**
 * 6. Bureau des Tampons. Le mur des 412 tampons (texture GenAI + quelques tampons 3D sur les
 * crochets ; le crochet « ANNULÉ » se vide avec `st_tamponnet`), Mme Tamponnet derrière son comptoir
 * (planche GenAI : repos / CLONK), l'encreur sec sur le comptoir (jusqu'à `st_encreur_pris`).
 */
export const stTampons: RoomBuild = {
  camera: { pos: [0, 2.2, 8.2], look: [0, 1.85, 0], fov: 50 },
  shots: {
    mur_tampons: { fill: 0.75, lift: 0.1, fov: 44 },
    tamponnet: { fill: 0.7 },
    encreur: { fill: 1.2, lift: 0.3, fov: 34 },
    panneau: { fill: 0.85, orbit: -6, fov: 38 },
  },
  intro: 'tamponnet',
  build(s) {
    const TEAL = '#1f5f5a';
    shell(s, { floor: { a: '#3e4a48', b: '#465250', joint: '#222a28', tile: 0.7 }, wall: { top: '#aac0bc', bottom: '#5e7a76' }, trim: '#1e3836', left: -9, right: 9 });
    wallPanels(s, '#8aa6a2', -9, 9, 1.6, 8);
    s.lights({
      sky: '#eefff8',
      ground: '#222a28',
      ambient: 1.15,
      key: { color: '#fff6e6', intensity: 2, pos: [1, 9, 6], target: [0, 0, 0] },
      points: [{ color: '#ffd08a', intensity: 2.6, pos: [0, 3.4, 1.4], distance: 4 }],
      rim: { color: '#8a6db0', intensity: 0.6, pos: [6, 5, -4] },
      fill: { color: '#9affe8', intensity: 0.3, pos: [-6, 3, 6] },
      fog: { color: '#18201e', near: 9, far: 24 },
      vignette: { color: '#0a100e', strength: 0.6, warm: '#fff0d814' },
    });
    neonTubes(s, s.wallAt(640, 10, 2).y, [-4.5, 4.5], 2.4);

    // ── le mur des tampons : texture GenAI encadrée, tablette, quelques tampons en relief ──
    const mz = 0.06;
    const m = s.fit(s.rect('mur_tampons'), mz);
    const t = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}props/st/murtampons.jpg`);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.set(Math.max(1, (m.w / m.h) / 1.5), 1);
    const wall = new THREE.Group();
    wall.add(onTop(at(box(m.w * 1.02, m.h * 1.06, 0.03, '#4a3020', { shadow: false }), 0, 0, 0)));
    wall.add(onTop(at(plane(m.w, m.h, '#ffffff', { map: t }), 0, 0, 0.02), POSTER_ORDER + 1));
    wall.add(at(box(m.w * 1.04, 0.06, 0.2, '#6a4a2a'), 0, -m.h / 2 - 0.05, 0.08));
    const colors = ['#c0392b', '#1f7f73', '#c9a24a', '#6a4aa0', '#2a2830'];
    for (let i = 0; i < 9; i++) {
      const st = new THREE.Group();
      st.add(at(cyl(0.05, 0.06, 0.16, colors[i % colors.length], { seg: 10 }), 0, 0.08, 0), at(sphere(0.06, colors[(i + 2) % colors.length], { seg: 10 }), 0, 0.2, 0));
      st.add(at(box(0.16, 0.05, 0.12, '#3a2a1a'), 0, -0.02, 0));
      wall.add(at(st, -m.w / 2 + 0.3 + i * ((m.w - 0.6) / 8), -m.h / 2 + 0.02, 0.12));
    }
    // le crochet « ANNULÉ », au milieu : un tampon rouge seul, puis un crochet vide
    const hook = at(torus(0.05, 0.012, '#c9a24a'), 0, m.h * 0.05, 0.1);
    const annule = new THREE.Group();
    annule.add(at(cyl(0.06, 0.07, 0.2, '#8a5a2a', { seg: 10 }), 0, 0.1, 0), at(sphere(0.07, '#8a5a2a', { seg: 10 }), 0, 0.24, 0));
    annule.add(at(box(0.22, 0.07, 0.15, '#c0392b'), 0, -0.03, 0));
    const annuleObj = at(annule, 0, m.h * 0.05 - 0.32, 0.14);
    const hookTag = at(label(tr('props.station.stampCancelled'), 0.42, 0.11, { color: '#c0392b', bg: '#f6efdc', bold: true }), 0, m.h * 0.05 + 0.13, 0.11);
    wall.add(hook, annuleObj, hookTag);
    s.when({ notFlags: ['st_tamponnet'] }, annuleObj);
    s.spot('mur_tampons', at(wall, m.x, m.y, mz));

    // ── comptoir et Mme Tamponnet ──
    const zb = 1.15;
    const zg = 0.33; // un poil en retrait du comptoir
    const top = s.wallAt(640, 350, zb).y;
    const L = s.wallAt(380, 350, zb).x;
    const R = s.wallAt(980, 350, zb).x;
    const cw = R - L;
    const cx = (L + R) / 2;
    const desk = new THREE.Group();
    desk.add(at(box(cw, top, 0.6, '#5a3e2a'), 0, top / 2, 0));
    desk.add(at(box(cw * 1.03, 0.07, 0.8, '#d8c9a8'), 0, top + 0.035, -0.05));
    desk.add(at(box(cw, top * 0.12, 0.02, TEAL), 0, top * 0.78, 0.31));
    // marques de coups de tampon à vide sur le plateau (aucune encre, juste des creux)
    for (let i = 0; i < 6; i++) desk.add(at(box(0.16, 0.004, 0.1, '#c4b590', { edges: false }), -cw * 0.15 + i * 0.09, top + 0.073, 0.05 + (i % 2) * 0.08));
    s.add(at(desk, cx, 0, zb));
    const npc = clerk(s, 'tamponnet', TAMPONNET_SHEET, TAMPONNET_ASPECT, TAMPONNET_ACTOR, zg, top, '#fff6ec', 0.1);
    // CLONK : le buste tressaute à chaque coup de tampon (frame 1 de la planche)
    const baseY = npc.position.y;
    s.animate((tt) => (npc.position.y = baseY - (actorFrame('tamponnet', TAMPONNET_ACTOR, tt) === 1 ? 0.025 : 0)));

    // encreur en fer-blanc ouvert, feutre sec craquelé (jusqu'à ce que Gary le prenne)
    const e = s.fit(s.rect('encreur'), zb - 0.05);
    const pad = new THREE.Group();
    pad.add(at(box(0.36, 0.06, 0.26, '#7c8794'), 0, 0.03, 0));
    pad.add(at(box(0.3, 0.012, 0.2, '#9a8aa8', { edges: false }), 0, 0.064, 0));
    const lidp = at(box(0.36, 0.02, 0.26, '#8d98a5'), 0, 0.17, -0.13);
    lidp.rotation.x = -1.2;
    pad.add(lidp);
    s.spot('encreur', at(pad, e.x, top + 0.07, zb - 0.1));

    // plaque GenAI « BUREAU DES TAMPONS » à gauche
    s.spot('panneau', poster(s, s.rect('panneau'), 'tampons'));
    inkStamp(s, 1050, 230, tr('props.station.stampSeen'));

    bobHere(s);
    doorToCorridor(s, TEAL);
    s.add(at(pool('#ffe6b0', 3, 2, 0.08), 0, 0.01, 4));
  },
};

/**
 * 7. Service des Réclamations. Personne. Comptoir vitré « RÉSERVÉ AU PERSONNEL » (GenAI), chatière
 * « ANIMAUX DE SERVICE » au pied (battant entrouvert pour de bon avec `st_chatiere`), étagères de
 * liasses et capsule derrière la vitre (prises : `st_liasse_prise`, `st_capsule_prise`), boîte à
 * réclamations reliée à une broyeuse, terminal de tube pneumatique.
 */
export const stReclamations: RoomBuild = {
  camera: { pos: [0, 2.2, 8.2], look: [0, 1.85, 0], fov: 50 },
  shots: {
    panneau: { fill: 0.85, fov: 38 },
    comptoir: { fill: 0.75 },
    chatiere: { fill: 1.1, lift: 0.3, fov: 36 },
    liasse: { fill: 1, fov: 36 },
    capsule: { fill: 1, fov: 36 },
    broyeuse: { fill: 0.85, orbit: 6, fov: 40 },
    tube: { fill: 0.8, orbit: 8, fov: 42 },
  },
  intro: 'panneau',
  build(s) {
    const RUST = '#a8542a';
    shell(s, { floor: { a: '#4a4038', b: '#544a40', joint: '#2a241e', tile: 0.7 }, wall: { top: '#cbbca4', bottom: '#8a7660' }, trim: '#4a3020', left: -9, right: 9 });
    wallPanels(s, '#b4a48c', -9, 9, 1.6, 8);
    s.lights({
      sky: '#fff6ea',
      ground: '#2a241e',
      ambient: 1.1,
      key: { color: '#fff0dc', intensity: 1.9, pos: [0, 9, 6], target: [0, 0, 0] },
      points: [
        { color: '#ffb070', intensity: 1.6, pos: [0, 2.6, 0.6], distance: 3.5 },
        { color: '#bfe6ff', intensity: 1.4, pos: [7.2, 3, 1.2], distance: 3 },
      ],
      rim: { color: RUST, intensity: 0.6, pos: [6, 5, -4] },
      fill: { color: '#9aa8ff', intensity: 0.3, pos: [-6, 3, 6] },
      fog: { color: '#1e1a16', near: 9, far: 24 },
      vignette: { color: '#100c08', strength: 0.62, warm: '#ffe8d014' },
    });
    neonTubes(s, s.wallAt(640, 10, 2).y, [-4.5, 4.5], 2.4);

    s.spot('panneau', poster(s, s.rect('panneau'), 'reclamations'));

    // ── derrière la vitre : étagère murale haute (liasses vierges, capsule), chaise, tasse ──
    const shelfZ = 0.3;
    const lf = s.fit(s.rect('liasse'), shelfZ);
    const cf = s.fit(s.rect('capsule'), shelfZ);
    const shelfY = Math.min(lf.y - lf.h / 2, cf.y - cf.h / 2);
    const sl = s.wallAt(380, 0, shelfZ).x;
    const sr = s.wallAt(900, 0, shelfZ).x;
    s.add(at(box(sr - sl, 0.06, 0.5, '#6a4a2a'), (sl + sr) / 2, shelfY, shelfZ));
    for (const x of [sl + 0.1, sr - 0.1]) s.add(at(box(0.05, 0.3, 0.05, '#4a3020'), x, shelfY - 0.18, shelfZ - 0.2));
    // piles décoratives (toujours là : il y a du papier pour des années)
    for (const [x, n] of [[-0.9, 6], [0.2, 4], [1.3, 7]] as [number, number][]) {
      for (let i = 0; i < n; i++) s.add(at(box(0.38, 0.03, 0.28, i % 2 ? '#cfe0c0' : '#c2d6b2', { edges: false }), (sl + sr) / 2 + x, shelfY + 0.045 + i * 0.032, shelfZ));
    }
    // la liasse à prendre (élastique ocre)
    const liasse = new THREE.Group();
    for (let i = 0; i < 10; i++) liasse.add(at(box(0.62, 0.036, 0.4, i % 2 ? '#d8ead0' : '#cfe0c0', { edges: false }), 0, i * 0.038, 0));
    liasse.add(at(box(0.64, 0.05, 0.06, '#c9a24a', { edges: false }), 0, 0.19, 0));
    liasse.add(at(glow('#f0ffe0', 0.9, 0.22), 0, 0.2, 0.1));
    s.spot('liasse', at(liasse, lf.x, shelfY + 0.05, shelfZ + 0.05));
    // la capsule (cylindre transparent, bouchons laiton), couchée
    const cap = new THREE.Group();
    const tubeM = at(cyl(0.13, 0.13, 0.62, '#d8f0ff', { seg: 16, edges: false }), 0, 0, 0);
    (tubeM.material as THREE.MeshStandardMaterial).transparent = true;
    (tubeM.material as THREE.MeshStandardMaterial).opacity = 0.45;
    cap.add(tubeM, at(cyl(0.145, 0.145, 0.08, '#c9a24a', { seg: 16 }), 0, 0.32, 0), at(cyl(0.145, 0.145, 0.08, '#c9a24a', { seg: 16 }), 0, -0.32, 0));
    cap.rotation.z = Math.PI / 2;
    s.spot('capsule', at(cap, cf.x, shelfY + 0.2, shelfZ + 0.05));

    // ── le comptoir vitré « RÉSERVÉ AU PERSONNEL » ──
    const zb = 1.15;
    const c = s.fit(s.rect('comptoir'), zb);
    const top = s.wallAt(640, 330, zb).y;
    const counter = new THREE.Group();
    counter.add(at(box(c.w, top, 0.6, '#7a5a3a'), 0, top / 2, 0));
    counter.add(at(box(c.w * 1.03, 0.07, 0.75, '#d8c9a8'), 0, top + 0.035, -0.05));
    const glassH = c.y + c.h / 2 - top;
    counter.add(at(plane(c.w * 0.98, glassH, '#cfe8ff', { opacity: 0.14 }), 0, top + glassH / 2, -0.2));
    counter.add(at(box(c.w, 0.06, 0.1, '#4a3020'), 0, top + glassH, -0.2));
    // sonnette, tasse de café 1985 solidifié
    counter.add(at(cyl(0.08, 0.1, 0.06, '#c9a24a', { seg: 14 }), -c.w * 0.3, top + 0.1, 0.1), at(sphere(0.03, '#2a2830'), -c.w * 0.3, top + 0.15, 0.1));
    counter.add(at(cyl(0.07, 0.06, 0.12, '#f6efdc', { seg: 12 }), c.w * 0.3, top + 0.13, -0.15), at(cyl(0.062, 0.062, 0.01, '#3a2414', { seg: 12, edges: false }), c.w * 0.3, top + 0.19, -0.15));
    // plaque GenAI rouge sur la façade, à gauche de la chatière
    const ps = stSign('personnel', c.w * 0.3, top * 0.42);
    counter.add(at(ps.mesh, -c.w * 0.3, top * 0.62, 0.305));
    s.spot('comptoir', at(counter, c.x, 0, zb));

    // ── chatière « ANIMAUX DE SERVICE » : cadre laiton, battant (s'ouvre et reste entrouvert), lecteur ──
    const OPEN: Condition = { flags: ['st_chatiere'] };
    const ch = s.fit(s.rect('chatiere'), zb + 0.31);
    const flap = new THREE.Group();
    const fw = Math.min(ch.w * 0.75, 0.6);
    const fh = Math.min(ch.h * 0.7, 0.55);
    flap.add(at(box(fw + 0.08, 0.05, 0.04, '#c9a24a'), 0, fh / 2 + 0.02, 0), at(box(0.04, fh + 0.06, 0.04, '#c9a24a'), -fw / 2 - 0.02, 0, 0), at(box(0.04, fh + 0.06, 0.04, '#c9a24a'), fw / 2 + 0.02, 0, 0));
    flap.add(at(box(fw, fh, 0.01, '#140e08', { edges: false }), 0, 0, -0.01));
    const hinge = new THREE.Group();
    hinge.position.set(0, fh / 2, 0.005);
    hinge.add(at(box(fw - 0.02, fh - 0.02, 0.025, '#5a3e2a'), 0, -fh / 2, 0));
    flap.add(hinge);
    // lecteur « CARAPACE / FOURRURE / PLUMES » au-dessus, diode qui passe au vert
    const reader = at(box(0.24, 0.08, 0.05, '#2a2830'), 0, fh / 2 + 0.12, 0);
    const rled = at(sphere(0.025, '#ffd166', { glow: true }), 0.08, fh / 2 + 0.12, 0.03);
    const gled = at(sphere(0.025, '#4fe07a', { glow: true }), 0.08, fh / 2 + 0.12, 0.03);
    flap.add(reader, rled, gled);
    s.when({ notFlags: ['st_chatiere'] }, rled);
    s.when(OPEN, gled);
    let swing = 0;
    s.animate((tt) => {
      swing += ((s.is(OPEN) ? 1.15 : 0) - swing) * 0.06;
      hinge.rotation.x = -swing - (s.is(OPEN) ? Math.sin(tt * 1.3) * 0.03 : 0);
    });
    s.spot('chatiere', at(flap, ch.x, ch.y, zb + 0.31));
    // plaque laiton GenAI au-dessus de la chatière
    const cs = stSign('chatiere', 0.85, 0.5);
    s.add(at(cs.mesh, ch.x + fw / 2 + 0.6, ch.y + fh * 0.1, zb + 0.312));

    // ── boîte à réclamations rouge → tuyau → broyeuse (dents qui grincent) ──
    const bx = s.stand(s.rect('broyeuse'));
    const bw = Math.min(bx.w * 0.8, 0.9);
    const shred = new THREE.Group();
    const bh = bx.h;
    shred.add(at(box(bw, bh * 0.32, bw * 0.8, '#5a5f6a'), 0, bh * 0.16, 0));
    const teeth = new THREE.Group();
    for (let i = 0; i < 7; i++) teeth.add(at(box(0.03, 0.08, bw * 0.5, '#c9ced6', { edges: false }), -bw * 0.36 + i * bw * 0.12, 0, 0));
    shred.add(at(teeth, 0, bh * 0.33, 0));
    shred.add(at(cyl(0.08, 0.08, bh * 0.25, '#8d939c', { seg: 12 }), 0, bh * 0.46, 0));
    shred.add(at(box(bw * 0.9, bh * 0.36, bw * 0.6, '#c0392b'), 0, bh * 0.75, 0));
    shred.add(at(box(bw * 0.6, 0.04, 0.04, '#14120e', { edges: false }), 0, bh * 0.82, bw * 0.31));
    shred.add(at(label(tr('props.station.complaintBox'), bw * 0.8, bh * 0.1, { color: '#f6efdc', bold: true }), 0, bh * 0.68, bw * 0.305));
    s.animate((tt) => (teeth.position.x = Math.sin(tt * 9) * 0.006));
    s.spot('broyeuse', at(shred, bx.x, 0, bx.z));

    pneumaticTube(s);

    bobHere(s);
    doorToCorridor(s, RUST);
    s.add(at(pool('#ffe0c0', 3, 2, 0.08), 0, 0.01, 4));
  },
};

/** Terminal de tube pneumatique (hotspot `tube`) : colonne transparente, bagues laiton, boîtier, bouffée d'air. */
function pneumaticTube(s: Stage): void {
  {
    const tz = 0.35;
    const tf = s.fit(s.rect('tube'), tz);
    const pipe = new THREE.Group();
    const tubeH = tf.y + tf.h / 2 + 1.5;
    const glass = at(cyl(0.13, 0.13, tubeH, '#d8f0ff', { seg: 16, edges: false }), 0, tubeH / 2, 0);
    (glass.material as THREE.MeshStandardMaterial).transparent = true;
    (glass.material as THREE.MeshStandardMaterial).opacity = 0.35;
    pipe.add(glass);
    for (let i = 0; i < 5; i++) pipe.add(at(torus(0.14, 0.02, '#c9a24a'), 0, 0.6 + i * 0.75, 0).rotateX(Math.PI / 2));
    pipe.add(at(box(0.5, 0.5, 0.35, '#7c8794'), 0, tf.y - tf.h * 0.15, 0.1));
    pipe.add(at(label(tr('props.station.tubeDest'), 0.44, 0.3, { color: '#1a1a1a', bg: '#f6efdc', bold: true }), 0, tf.y - tf.h * 0.15, 0.28));
    const puff = at(glow('#e8f6ff', 0.5, 0.3), 0, tubeH * 0.6, 0.15);
    pipe.add(puff);
    s.animate((tt) => (puff.position.y = ((tt * 0.8) % 1) * tubeH));
    s.spot('tube', at(pipe, tf.x, 0, tz));
  }
}

// ── Acte III « La Grève » : Salle de Pause, Bureau du Sous-Chef Adjoint (docs/CHAPTER1.md §4, lieux 8–9) ──

const GREVE_FINIE: Condition = { flags: ['st_greve_finie'] };

/**
 * 8. Salle de Pause. PERCO (billboard GenAI : 0 en grève · 1 au travail, `st_greve_finie`) qui crachote,
 * banderole « GRÈVE ILLIMITÉE », piquet de gobelets (rentrés au dépôt après la grève), panneau syndical
 * (l'accord P-15 punaisé jusqu'à `st_accord_pris`), frigo « NE PAS TOUCHER AU YAOURT », tube pneumatique.
 */
export const stPause: RoomBuild = {
  camera: { pos: [0, 2.2, 8.2], look: [0, 1.85, 0], fov: 50 },
  shots: {
    perco: { fill: 0.75, fov: 42 },
    piquet: { fill: 1, lift: 0.3, fov: 38 },
    panneau_syndical: { fill: 0.85, orbit: -6, fov: 38 },
    frigo: { fill: 0.8, orbit: 6, fov: 40 },
    tube: { fill: 0.8, orbit: 8, fov: 42 },
  },
  intro: 'perco',
  build(s) {
    const BROWN = '#5a3a22';
    shell(s, { floor: { a: '#4a3c30', b: '#544638', joint: '#2a2018', tile: 0.6 }, wall: { top: '#c8b498', bottom: '#806850' }, trim: '#3a2818', left: -9, right: 9 });
    wallPanels(s, '#b09c80', -9, 9, 1.6, 8);
    s.lights({
      sky: '#fff4e6',
      ground: '#2a2018',
      ambient: 1.1,
      key: { color: '#fff0dc', intensity: 1.9, pos: [0, 9, 6], target: [0, 0, 0] },
      points: [
        { color: '#ff9a50', intensity: 2.2, pos: [-0.6, 2.4, 1.6], distance: 3.5 },
        { color: '#bfe6ff', intensity: 1.2, pos: [5.5, 2.6, 1.4], distance: 3 },
      ],
      rim: { color: '#d9762a', intensity: 0.7, pos: [6, 5, -4] },
      fill: { color: '#9aa8ff', intensity: 0.3, pos: [-6, 3, 6] },
      fog: { color: '#1e1610', near: 9, far: 24 },
      vignette: { color: '#100a06', strength: 0.62, warm: '#ffe0c018' },
    });
    neonTubes(s, s.wallAt(640, 10, 2).y, [-4.5, 4.5], 2.4);

    // plaque « SALLE DE PAUSE » et banderole de grève (GenAI) ; la banderole tombe à la fin de la grève
    poster(s, [1000, 40, 150, 100], 'pause');
    const banner = poster(s, [735, 18, 240, 150], 'greve');
    s.when({ notFlags: ['st_greve_finie'] }, banner);
    inkStamp(s, 1040, 120, tr('props.station.strikeStamp'));

    // ── PERCO : billboard GenAI, vapeur colérique (en grève) puis paisible ──
    const pz = 0.7;
    const p = s.stand(s.rect('perco'));
    const ph = p.h * 0.98;
    const perco = billboardSheet(PERCO_SHEET, 2, ph, PERCO_ASPECT, { tint: '#fff6ee', shadow: ph * PERCO_ASPECT * 0.45 });
    // écran vivant par-dessus le visage peint : yeux par humeur + onde ambre quand elle parle
    const screen = percoScreen(ph, PERCO_ASPECT);
    perco.add(screen.mesh);
    s.spot('perco', at(perco, p.x, 0, pz));
    const steam = at(glow('#ffffff', 0.7, 0.5), p.x + ph * PERCO_ASPECT * 0.22, ph * 0.98, pz + 0.05);
    s.add(steam);
    s.animate((t) => {
      const on = s.is(GREVE_FINIE);
      perco.userData.setFrame(on ? 1 : 0);
      screen.update(t, on);
      // en grève : tremblement de colère + bouffées ; au travail : ronron, vapeur douce
      perco.position.x = p.x + (on ? 0 : Math.sin(t * 31) * 0.006 * (Math.sin(t * 0.9) > 0.6 ? 1 : 0));
      const k = (t * (on ? 0.35 : 0.9)) % 1;
      steam.position.y = ph * 0.98 + k * (on ? 0.5 : 1.1);
      steam.material.opacity = (1 - k) * (on ? 0.25 : 0.55);
      steam.scale.setScalar(0.5 + k * (on ? 0.6 : 1.2));
    });

    // ── piquet de grève : gobelets en rang, minuscules pancartes ──
    const pq = s.stand(s.rect('piquet'));
    const picket = new THREE.Group();
    const signs = [tr('props.station.cupNo'), tr('props.station.cupNotToday'), '1985', tr('props.station.cupNo'), tr('props.station.cupNotToday'), '1985', tr('props.station.cupNo')];
    signs.forEach((txt, i) => {
      const x = -pq.w / 2 + 0.15 + i * ((pq.w - 0.3) / (signs.length - 1));
      const cup = new THREE.Group();
      cup.add(at(cyl(0.07, 0.055, 0.18, '#f6efdc', { seg: 12 }), 0, 0.09, 0));
      cup.add(at(cyl(0.006, 0.006, 0.24, '#8a6a3a', { edges: false }), 0.05, 0.3, 0));
      cup.add(at(label(txt, 0.2, 0.09, { color: '#c0392b', bg: '#f6efdc', bold: true }), 0.05, 0.4, 0.01));
      picket.add(at(cup, x, 0, (i % 2) * 0.12));
    });
    s.spot('piquet', at(picket, pq.x, 0, pq.z));
    s.animate((t) => picket.children.forEach((c, i) => (c.rotation.z = Math.sin(t * 3 + i) * 0.04)));

    // ── panneau syndical : liège, préavis, tract, l'accord P-15 punaisé ──
    const pz2 = 0.08;
    const ps = s.fit(s.rect('panneau_syndical'), pz2);
    const cork = new THREE.Group();
    cork.add(at(box(ps.w, ps.h, 0.04, '#b08a5a'), 0, 0, 0), at(box(ps.w * 1.04, ps.h * 1.04, 0.03, '#5a3a22'), 0, 0, -0.01));
    cork.add(at(label(tr('props.station.notice'), ps.w * 0.42, ps.h * 0.4, { color: '#1a1a1a', bg: '#f6efdc', bold: true }), -ps.w * 0.22, ps.h * 0.18, 0.03));
    cork.add(at(label(tr('props.station.coffeeRight'), ps.w * 0.36, ps.h * 0.26, { color: '#f6efdc', bg: '#c0392b', bold: true }), -ps.w * 0.24, -ps.h * 0.24, 0.03));
    const accord = new THREE.Group();
    accord.add(at(box(ps.w * 0.36, ps.h * 0.6, 0.01, '#f6efdc'), 0, 0, 0));
    accord.add(at(label('P-15', ps.w * 0.3, ps.h * 0.12, { color: '#f6efdc', bg: '#1f7f73', bold: true }), 0, ps.h * 0.22, 0.008)); // i18n-ignore (référence)
    for (let i = 0; i < 4; i++) accord.add(at(box(ps.w * 0.26, 0.012, 0.004, '#8a8070', { edges: false }), 0, ps.h * (0.06 - i * 0.07), 0.008));
    accord.add(at(sphere(0.025, '#c0392b'), 0, ps.h * 0.29, 0.02));
    const accordObj = at(accord, ps.w * 0.24, 0, 0.03);
    cork.add(accordObj);
    s.when({ notFlags: ['st_accord_pris'] }, accordObj);
    s.spot('panneau_syndical', onTop(at(cork, ps.x, ps.y, pz2)));

    // ── frigo : caisson blanc, poignée, mot GenAI « NE PAS TOUCHER AU YAOURT » ──
    const fr = s.stand(s.rect('frigo'));
    const fridge = new THREE.Group();
    const fw = fr.w * 0.9;
    const fh = fr.h * 0.95;
    fridge.add(at(box(fw, fh, 0.7, '#e8e8e0'), 0, fh / 2, 0));
    fridge.add(at(box(fw * 0.96, 0.02, 0.02, '#a0a098', { edges: false }), 0, fh * 0.7, 0.36));
    fridge.add(at(box(0.04, fh * 0.3, 0.06, '#a0a098'), -fw * 0.4, fh * 0.45, 0.37));
    const note = stSign('yaourt', fw * 0.45, fh * 0.32);
    fridge.add(at(note.mesh, fw * 0.08, fh * 0.45, 0.356));
    s.spot('frigo', at(fridge, fr.x, 0, fr.z));

    pneumaticTube(s);
    bobHere(s);
    doorToCorridor(s, BROWN);
    s.add(at(pool('#ffd8a8', 3, 2, 0.1), 0, 0.01, 4));
  },
};

const REVEILLE: Condition = { flags: ['st_delaigue_reveille'] };

/**
 * 9. Bureau du Sous-Chef Adjoint : un placard à balais reconverti (étagères de produits, balais, seau).
 * M. Delaigue derrière son bureau (billboard GenAI : 0 endormi · 1 réveillé, `st_delaigue_reveille`),
 * fax qui ronronne, stylo enchaîné, plaque « p.i. » et note de délégation (GenAI) au mur.
 */
export const stSousChef: RoomBuild = {
  camera: { pos: [0, 2.2, 8.2], look: [0, 1.85, 0], fov: 50 },
  shots: {
    delaigue: { fill: 0.7 },
    note: { fill: 0.9, orbit: 6, fov: 34 },
    plaque: { fill: 0.9, orbit: -6, fov: 34 },
    fax: { fill: 1.1, lift: 0.3, fov: 36 },
    balais: { fill: 0.8, orbit: 8, fov: 40 },
  },
  intro: 'delaigue',
  build(s) {
    const BLUE = '#5a6a80';
    shell(s, { floor: { a: '#3e3a32', b: '#48443a', joint: '#24201a', tile: 0.5 }, wall: { top: '#a49c86', bottom: '#5e584a' }, trim: '#2e2a22', left: -9, right: 9 });
    wallPanels(s, '#8a8270', -9, 9, 1.2, 8);
    s.lights({
      sky: '#f6f0e0',
      ground: '#24201a',
      ambient: 0.95,
      key: { color: '#ffe8c8', intensity: 1.6, pos: [0, 8, 5], target: [0, 0, 0] },
      points: [{ color: '#ffd08a', intensity: 3, pos: [0, 3.2, 1.6], distance: 4 }],
      rim: { color: '#7c8fa8', intensity: 0.6, pos: [-6, 5, -4] },
      fill: { color: '#9aa8ff', intensity: 0.25, pos: [6, 3, 6] },
      fog: { color: '#16140f', near: 8, far: 22 },
      vignette: { color: '#0c0a06', strength: 0.72, warm: '#ffe0b018' },
    });
    // une seule ampoule nue au plafond (c'est un placard)
    const bulbY = s.wallAt(640, 20, 1.5).y;
    s.add(at(sphere(0.12, '#fff2c0', { glow: true }), 0, bulbY, 1.5), at(cyl(0.01, 0.01, 0.6, '#2a2830', { edges: false }), 0, bulbY + 0.35, 1.5), at(glow('#ffe0a0', 2.5, 0.35), 0, bulbY, 1.5));

    // étagères de produits d'entretien en haut du mur, au-dessus des affiches (Gary se sent chez lui)
    const shelfY0 = s.wallAt(640, 100, 0.25).y;
    for (const [x0, x1] of [[-7.5, -1.7], [1.7, 7.5]] as [number, number][]) {
      for (let i = 0; i < 2; i++) {
        const y = shelfY0 + i * 0.75;
        s.add(at(box(x1 - x0, 0.05, 0.4, '#6a5a3a'), (x0 + x1) / 2, y, 0.25));
        for (let k = 0; k < 9; k++) {
          const c = ['#3fa0d0', '#e0c040', '#d04a4a', '#5ab05a', '#f6efdc'][(i + k) % 5];
          s.add(at(cyl(0.08, 0.1, 0.32, c, { seg: 10 }), x0 + 0.3 + k * ((x1 - x0 - 0.6) / 8), y + 0.18, 0.25));
        }
      }
    }

    // plaque « H. DELAIGUE — SOUS-CHEF ADJOINT p.i. » et note de délégation (GenAI)
    s.spot('plaque', poster(s, s.rect('plaque'), 'souschef'));
    s.spot('note', poster(s, s.rect('note'), 'delegation'));

    // ── bureau, fax, stylo enchaîné ; M. Delaigue derrière ──
    const zb = 1.2;
    const zg = 0.38; // un poil en retrait du bureau
    const top = s.wallAt(640, 360, zb).y;
    const L = s.wallAt(470, 360, zb).x;
    const R = s.wallAt(830, 360, zb).x;
    const dw = R - L;
    const dx = (L + R) / 2;
    const desk = new THREE.Group();
    desk.add(at(box(dw, top, 0.6, '#6a5040'), 0, top / 2, 0));
    desk.add(at(box(dw * 1.04, 0.06, 0.8, '#c8b898'), 0, top + 0.03, -0.05));
    desk.add(at(label(tr('props.station.deputyDesk'), dw * 0.5, top * 0.16, { color: '#f6efdc', bg: BLUE, bold: true }), 0, top * 0.66, 0.305));
    // stylo enchaîné
    const pen = at(cyl(0.012, 0.012, 0.2, '#1f4fa0', { edges: false }), -dw * 0.32, top + 0.07, 0.15);
    pen.rotation.z = Math.PI / 2;
    desk.add(pen);
    for (let i = 0; i < 6; i++) desk.add(at(sphere(0.012, '#c9ced6', { seg: 6 }), -dw * 0.4 + i * 0.03, top + 0.065, 0.2));
    s.add(at(desk, dx, 0, zb));
    // fax (hotspot) sur le plateau, feuille « RÉUNION REPORTÉE » qui sort lentement
    const fx = s.fit(s.rect('fax'), zb);
    const fax = new THREE.Group();
    fax.add(at(box(0.6, 0.18, 0.45, '#5a5f6a'), 0, 0.09, 0), at(box(0.5, 0.03, 0.2, '#3a3e44'), 0, 0.19, -0.05));
    fax.add(at(sphere(0.02, '#4fe07a', { glow: true }), 0.22, 0.19, 0.18));
    const sheet = at(label(tr('props.station.faxMeeting'), 0.4, 0.3, { color: '#1a1a1a', bg: '#f6efdc', bold: true }), 0, 0.3, 0.12);
    sheet.rotation.x = -0.9;
    fax.add(sheet);
    s.animate((t) => (sheet.position.z = 0.12 + ((t * 0.04) % 0.12)));
    s.spot('fax', at(fax, fx.x, top + 0.06, zb + 0.05));

    const g = s.fit(s.rect('delaigue'), zg);
    const base = top - 0.12; // réduit, on remonte un peu le buste pour garder les épaules au-dessus du plateau
    // ×0.72 : à pleine taille sa tête mangeait la moitié du placard (cf. fix Mme Guichard)
    const h = Math.min(g.y + g.h / 2 - base, (g.w * 1.25) / DELAIGUE_ASPECT) * 0.72;
    const npc = billboardSheet(DELAIGUE_SHEET, 2, h, DELAIGUE_ASPECT, { tint: '#fff6ec', shadow: 0.01 });
    const sp = npc.userData.sprite as THREE.Sprite;
    const sy = sp.scale.y;
    s.spot('delaigue', at(npc, g.x, base, zg));
    // « Z z z » qui monte tant qu'il dort
    const zzz = at(label(tr('props.station.zzz'), 0.5, 0.25, { color: '#f6efdc', bold: true }), g.x + 0.6, base + h * 0.85, zg + 0.1);
    s.when({ notFlags: ['st_delaigue_reveille'] }, zzz);
    // bave 3D (effacée de la planche) : un filet qui s'étire au coin de la bouche en se balançant,
    // une goutte qui grossit au bout, lâche, tombe, et le filet se rétracte — boucle de ~3,4 s.
    const DROOL = { u: 365 / 764 - 0.5, v: 1 - 377 / 768 }; // coin de la bouche dans la cellule 0
    const slime = new THREE.MeshBasicMaterial({ color: '#e8f4ff', transparent: true, opacity: 0.85, depthTest: false });
    const rimMat = new THREE.MeshBasicMaterial({ color: '#2a3440', transparent: true, opacity: 0.55, depthTest: false });
    const drool = new THREE.Group();
    drool.renderOrder = 5;
    const strand = new THREE.Group(); // pivot au coin de la bouche, filet vers -y (longueur 1, mise à l'échelle)
    const sw = h * 0.009;
    const strandIn = at(new THREE.Mesh(new THREE.CylinderGeometry(sw * 0.7, sw, 1, 8), slime), 0, -0.5, 0);
    const strandRim = at(new THREE.Mesh(new THREE.CylinderGeometry(sw * 1.25, sw * 1.5, 1, 8), rimMat), 0, -0.5, -0.002);
    strand.add(strandRim, strandIn);
    const drop = new THREE.Group();
    drop.add(new THREE.Mesh(new THREE.SphereGeometry(sw * 1.9, 12, 10), rimMat), at(new THREE.Mesh(new THREE.SphereGeometry(sw * 1.55, 12, 10), slime), 0, 0, 0.003));
    drop.add(at(new THREE.Mesh(new THREE.SphereGeometry(sw * 0.45, 6, 6), new THREE.MeshBasicMaterial({ color: '#ffffff', depthTest: false })), -sw * 0.5, sw * 0.5, sw * 1.6));
    const falling = drop.clone();
    drool.add(strand, drop, falling);
    for (const o of [strandIn, strandRim, ...drop.children, ...falling.children]) o.renderOrder = 5;
    npc.add(drool);
    s.when({ notFlags: ['st_delaigue_reveille'] }, drool);
    s.animate((t) => {
      const awake = s.is(REVEILLE);
      npc.userData.setFrame(awake ? 1 : 0);
      // endormi : grosse respiration de ronfleur ; réveillé : respiration de fonctionnaire
      sp.scale.y = sy * (1 + Math.sin(t * (awake ? 1.1 : 0.7)) * (awake ? 0.006 : 0.018));
      if (!awake) {
        drool.position.set(DROOL.u * sp.scale.x, (DROOL.v - 0.008) * sp.scale.y, 0.02);
        const P = 3.4;
        const k = (t % P) / P; // 0→0,75 : s'étire ; 0,75→1 : la goutte tombe, le filet remonte
        const stretch = k < 0.75 ? 0.25 + (k / 0.75) ** 1.6 : 1.25 - ((k - 0.75) / 0.25) * 0.95;
        const len = h * 0.075 * stretch * (1 + Math.sin(t * 0.7) * 0.12); // il respire, le filet suit
        const sway = Math.sin(t * 2.3) * 0.18 + Math.sin(t * 0.7) * 0.06;
        strand.scale.set(1, len, 1);
        strand.rotation.z = sway;
        drop.position.set(Math.sin(sway) * len, -Math.cos(sway) * len, 0);
        drop.scale.setScalar(k < 0.75 ? 0.55 + (k / 0.75) * 0.6 : 0.5);
        falling.visible = k >= 0.75;
        if (falling.visible) {
          const f = (k - 0.75) / 0.25;
          const tip = h * 0.075 * 1.25;
          falling.position.set(Math.sin(sway) * tip, -tip - f * f * h * 0.2, 0);
          falling.scale.set(1.1 * (1 - f), (1.1 + f * 0.6) * (1 - f * 0.8), 1); // s'écrase sur le menton
        }
      }
      const k = (t * 0.3) % 1;
      zzz.position.y = base + h * (0.8 + k * 0.25);
      (zzz.material as THREE.MeshBasicMaterial).opacity = 1 - k;
    });
    (zzz.material as THREE.MeshBasicMaterial).transparent = true;

    // ── balais, pelle, seau rouge, serpillière (pas Josiane) ──
    const bl = s.stand(s.rect('balais'));
    const brooms = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const b = new THREE.Group();
      b.add(at(cyl(0.025, 0.025, bl.h * 0.85, '#a07a4a', { edges: false }), 0, bl.h * 0.45, 0));
      b.add(at(box(0.3, 0.14, 0.08, i === 1 ? '#3a6ab0' : '#d0b060'), 0, 0.07, 0));
      b.rotation.z = -0.12 + i * 0.1;
      brooms.add(at(b, -bl.w * 0.3 + i * bl.w * 0.22, 0, -0.1));
    }
    brooms.add(at(cyl(0.2, 0.16, 0.34, '#c0392b', { seg: 14 }), bl.w * 0.25, 0.17, 0.15));
    const mop = new THREE.Group();
    mop.add(at(cyl(0.02, 0.02, bl.h * 0.8, '#8a8a80', { edges: false }), 0, bl.h * 0.5, 0));
    for (let i = 0; i < 9; i++) mop.add(at(cyl(0.012, 0.012, 0.3, '#d8d0c0', { edges: false }), Math.cos(i) * 0.06, bl.h * 0.08, Math.sin(i) * 0.06));
    brooms.add(at(mop, bl.w * 0.38, 0, -0.2));
    s.spot('balais', at(brooms, bl.x, 0, bl.z));

    bobHere(s);
    doorToCorridor(s, BLUE);
    s.add(at(pool('#ffe0a0', 3, 2, 0.1), 0, 0.01, 4));
  },
};

// ── Acte IV « Le Conseil et la Restitution » : Ascenseur, Conseil, Direction, Fourrière (lieux 10–13) ──

/** Porte de gauche (mur latéral) vers `exitId`, plaque `text` sur `color`. */
function sideDoor(s: Stage, exitId: string, text: string, color: string): void {
  const d = s.fitX(s.rect(exitId), -9);
  const door = new THREE.Group();
  door.add(at(box(0.3, d.h, d.d * 1.12, '#3e3448'), 0, 0, 0), at(box(0.1, d.h * 0.94, d.d, '#7c6e86'), 0.15, -d.h * 0.03, 0));
  s.add(at(door, -9, d.y, d.z));
  const sign = at(label(text, d.d * 1.1, 0.35, { color: '#f6efdc', bg: color, bold: true }), -8.95, d.y + d.h / 2 + 0.3, d.z);
  sign.rotation.y = Math.PI / 2;
  s.add(sign);
}

/**
 * 10. Ascenseur à Formulaires : cabine inox sans boutons, une fente à dossiers (diode verte), cadran
 * d'étages dont l'aiguille tremble, portes de droite qui s'ouvrent sur l'étage choisi par le dossier.
 */
export const stAscenseur: RoomBuild = {
  camera: { pos: [0, 2.2, 8.2], look: [0, 1.85, 0], fov: 50 },
  shots: {
    fente: { fill: 1.1, fov: 34 },
    panneau: { fill: 0.85, fov: 38 },
  },
  intro: 'fente',
  build(s) {
    const TEAL = '#1f5f5a';
    shell(s, { floor: { a: '#3a4044', b: '#42484c', joint: '#22262a', tile: 0.5 }, wall: { top: '#b8c2ca', bottom: '#6a747c' }, trim: '#2a3034', left: -9, right: 9 });
    // parois en inox brossé : bandes verticales
    for (let x = -8.5; x <= 8.5; x += 1.2) s.add(at(box(1.15, 9, 0.03, x % 2.4 ? '#a9b0b8' : '#9aa2aa', { edges: false, shadow: false }), x, 4.5, 0.02));
    s.lights({
      sky: '#eef6ff',
      ground: '#22262a',
      ambient: 1.1,
      key: { color: '#f0f8ff', intensity: 2, pos: [0, 9, 6], target: [0, 0, 0] },
      points: [{ color: '#7fffd4', intensity: 2, pos: [0, 2.4, 1.2], distance: 3 }],
      rim: { color: '#7fffd4', intensity: 0.5, pos: [6, 5, -4] },
      fill: { color: '#9aa8ff', intensity: 0.3, pos: [-6, 3, 6] },
      fog: { color: '#161a1e', near: 9, far: 24 },
      vignette: { color: '#0a0c10', strength: 0.6, warm: '#e0fff814' },
    });
    neonTubes(s, s.wallAt(640, 10, 2).y, [-3, 3], 2.4);

    // plaque GenAI + cadran à aiguille (COULOIR B · 7 · 12)
    const plate = poster(s, s.rect('panneau'), 'ascenseur');
    s.spot('panneau', plate);
    const dial = new THREE.Group();
    const dr = 0.38;
    const face = at(cyl(dr, dr, 0.04, '#f6efdc', { seg: 28 }), 0, 0, 0);
    face.rotation.x = Math.PI / 2;
    dial.add(face, at(torus(dr, 0.03, '#c9a24a'), 0, 0, 0.02));
    for (const [txt, a] of [['B', -0.9], ['7', 0], ['12', 0.9]] as [string, number][]) dial.add(at(label(txt, 0.18, 0.14, { color: '#1a1a1a', bold: true }), Math.sin(a) * dr * 0.7, Math.cos(a) * dr * 0.7, 0.03)); // i18n-ignore (étages)
    const needle = at(box(0.025, dr * 0.8, 0.01, '#c0392b', { edges: false }), 0, 0, 0.04);
    needle.geometry.translate(0, dr * 0.4, 0);
    dial.add(needle);
    const dp = s.wallAt(980, 110, 0.08);
    s.add(at(dial, dp.x, dp.y, 0.08));
    s.animate((t) => {
      const target = s.is({ flags: ['st_ascenseur_direction'] }) ? 0.9 : s.is({ flags: ['st_ascenseur_conseil'] }) ? 0 : -0.9;
      needle.rotation.z = -target + Math.sin(t * 7) * 0.03 + Math.sin(t * 1.3) * 0.05;
    });

    // fente à dossiers bordée de laiton, diode verte
    const f = s.fit(s.rect('fente'), 0.1);
    const slot = new THREE.Group();
    slot.add(at(box(f.w * 0.9, f.h * 0.8, 0.08, '#5a5f6a'), 0, 0, 0));
    slot.add(at(box(f.w * 0.7, 0.06, 0.1, '#14120e', { edges: false }), 0, 0, 0.02));
    slot.add(at(box(f.w * 0.76, 0.02, 0.1, '#c9a24a', { edges: false }), 0, 0.045, 0.03), at(box(f.w * 0.76, 0.02, 0.1, '#c9a24a', { edges: false }), 0, -0.045, 0.03));
    const led = at(sphere(0.035, '#4fe07a', { glow: true }), f.w * 0.36, f.h * 0.28, 0.06);
    slot.add(led, at(label(tr('props.station.insertFile'), f.w * 0.7, f.h * 0.22, { color: '#f6efdc', bold: true }), 0, -f.h * 0.3, 0.05));
    s.animate((t) => led.scale.setScalar(1 + Math.sin(t * 3) * 0.2));
    s.spot('fente', at(slot, f.x, f.y, 0.1));

    // portes de droite (palière) : elles s'ouvrent sur l'étage que le dossier a choisi
    const rd = s.fitX(s.rect('vers_conseil'), 9);
    const leaves = [-1, 1].map((sz) => at(box(0.1, rd.h * 0.94, rd.d * 0.5, '#a9b0b8'), 8.9, rd.y - rd.h * 0.03, rd.z + (sz * rd.d) / 4));
    s.add(at(box(0.3, rd.h, rd.d * 1.15, '#5a5f6a'), 9.05, rd.y, rd.z), ...leaves);
    const glowGap = at(plane(rd.d * 0.9, rd.h * 0.9, '#fff2c0', { glow: true }), 8.98, rd.y, rd.z, -Math.PI / 2);
    s.add(glowGap);
    const ARRIVED: Condition = { flags: ['st_ascenseur_conseil'] };
    let open = 0;
    s.animate(() => {
      open += ((s.is(ARRIVED) ? 1 : 0) - open) * 0.05;
      leaves.forEach((l, i) => (l.position.z = rd.z + ((i ? 1 : -1) * rd.d) / 4 + (i ? 1 : -1) * open * rd.d * 0.18));
      glowGap.visible = open > 0.05;
    });

    bobHere(s);
    sideDoor(s, 'vers_couloir', tr('props.station.corridorB'), TEAL);
    s.add(at(pool('#d8f0ff', 3, 2, 0.1), 0, 0.01, 4));
  },
};

/**
 * 11. Salle du Conseil : table ovale pour douze, onze chaises vides, Mme Paraphe (billboard GenAI),
 * tableau des membres (GenAI), siège du membre honoraire (M. Ficus avec `st_ficus`), urne transparente
 * (bulletins ; « ANNULÉ » avec `st_case_e`), tube pneumatique d'arrivée (capsule de PERCO).
 */
export const stConseil: RoomBuild = {
  camera: { pos: [0, 2.2, 8.2], look: [0, 1.85, 0], fov: 50 },
  shots: {
    paraphe: { fill: 0.7 },
    tableau: { fill: 0.9, orbit: -6, fov: 36 },
    siege: { fill: 0.85, orbit: 6, fov: 40 },
    urne: { fill: 1.1, lift: 0.3, fov: 34 },
    tube: { fill: 0.8, orbit: 8, fov: 42 },
  },
  intro: 'paraphe',
  build(s) {
    const NAVY = '#2a3a6a';
    shell(s, { floor: { a: '#3a2a3a', b: '#443444', joint: '#221822', tile: 0.9 }, wall: { top: '#9a9cb8', bottom: '#4a4c6a' }, trim: '#22243a', left: -9, right: 9 });
    wallPanels(s, '#7a7c98', -9, 9, 1.8, 8);
    s.lights({
      sky: '#f0f0ff',
      ground: '#221822',
      ambient: 1.05,
      key: { color: '#fff4e6', intensity: 1.9, pos: [0, 9, 6], target: [0, 0, 0] },
      points: [{ color: '#ffd08a', intensity: 2.6, pos: [0, 3.6, 2], distance: 4.5 }],
      rim: { color: '#8a6db0', intensity: 0.7, pos: [-6, 5, -4] },
      fill: { color: '#9aa8ff', intensity: 0.35, pos: [6, 3, 6] },
      fog: { color: '#14121e', near: 9, far: 24 },
      vignette: { color: '#0a0812', strength: 0.62, warm: '#ffe8d014' },
    });
    // lustre administratif (trois globes)
    const ly = s.wallAt(640, 15, 2.2).y;
    for (const dx of [-0.5, 0, 0.5]) s.add(at(sphere(0.12, '#fff2c0', { glow: true }), dx, ly, 2.2));
    s.add(at(glow('#ffe0a0', 3, 0.3), 0, ly, 2.2));

    s.spot('tableau', poster(s, s.rect('tableau'), 'membres'));

    // ── table ovale (vue de face : un grand plateau), chaises vides, Mme Paraphe derrière ──
    const zb = 1.3;
    const zg = 0.45; // un poil en retrait de la table
    const top = s.wallAt(640, 360, zb).y;
    const table = new THREE.Group();
    const tw = 7;
    const slab = at(cyl(1, 1, 0.08, '#6a3a2a', { seg: 32 }), 0, top, 0);
    slab.scale.set(tw / 2, 1, 0.9);
    table.add(slab, at(box(tw * 0.85, top - 0.1, 0.4, '#4a2a1a'), 0, (top - 0.1) / 2, 0.3));
    // sous-mains vides et petits chevalets « ABSENT »
    for (let i = 0; i < 6; i++) {
      const x = -tw * 0.38 + i * (tw * 0.76 / 5);
      if (Math.abs(x) < 0.8) continue;
      table.add(at(box(0.5, 0.01, 0.32, '#2a3a2a', { edges: false }), x, top + 0.05, 0.4));
      table.add(at(label(tr('props.station.absent'), 0.42, 0.12, { color: '#1a1a1a', bg: '#f6efdc', bold: true }), x, top + 0.13, 0.62));
    }
    s.add(at(table, 0, 0, zb));
    // chaises à haut dossier derrière la table
    for (let i = 0; i < 8; i++) {
      const x = -3.6 + i * 1.03;
      if (Math.abs(x) < 1) continue;
      const ch = new THREE.Group();
      ch.add(at(box(0.6, 1.6, 0.08, '#5a3a6a'), 0, 0.8 + top * 0.4, 0), at(box(0.62, 0.08, 0.5, '#4a2a5a'), 0, top * 0.6, 0.25));
      s.add(at(ch, x, 0, 0.35));
    }
    const g = s.fit(s.rect('paraphe'), zg);
    // Échelle réduite (~70 %) : elle ne remplit plus le bureau, visage toujours lisible, air au-dessus.
    const base = top - 0.15;
    const h = 0.7 * Math.min(g.y + g.h / 2 - (top - 0.3), (g.w * 1.25) / PARAPHE_ASPECT);
    const npc = billboardSheet(PARAPHE_SHEET, 2, h, PARAPHE_ASPECT, { tint: '#fff6ec', shadow: 0.01 });
    const sp = npc.userData.sprite as THREE.Sprite;
    const sy = sp.scale.y;
    s.spot('paraphe', at(npc, g.x, base, zg));
    s.animate((t) => {
      npc.userData.setFrame(actorFrame('paraphe', PARAPHE_ACTOR, t));
      sp.scale.y = sy * (1 + Math.sin(t * 1.1) * 0.005);
    });

    // ── urne transparente sur la table : bulletins ; « ANNULÉ » sur le CONTRE avec la case E ──
    const u = s.fit(s.rect('urne'), zb + 0.3);
    const urn = new THREE.Group();
    const uw = Math.min(u.w * 0.8, 0.6);
    const glass = at(box(uw, uw * 0.9, uw * 0.7, '#d8f0ff', { edges: true }), 0, uw * 0.45, 0);
    (glass.material as THREE.MeshStandardMaterial).transparent = true;
    (glass.material as THREE.MeshStandardMaterial).opacity = 0.3;
    urn.add(glass, at(box(uw * 0.5, 0.02, 0.06, '#14120e', { edges: false }), 0, uw * 0.91, 0));
    const ballot = (txt: string, color: string, dx: number, rz: number) => {
      const b = at(label(txt, uw * 0.5, uw * 0.3, { color, bg: '#f6efdc', bold: true }), dx, uw * 0.25, 0.02);
      b.rotation.z = rz;
      return b;
    };
    const contre = ballot(tr('props.station.voteAgainst'), '#2a3a6a', 0, 0.1);
    const pour = ballot(tr('props.station.voteFor'), '#5a3a22', -uw * 0.15, -0.2);
    const abst = ballot(tr('props.station.voteAbstain'), '#3e8f4a', uw * 0.15, 0.25);
    const annul = at(label(tr('props.station.stampCancelled'), uw * 0.55, uw * 0.18, { color: '#c0392b', bold: true }), 0, uw * 0.27, 0.04);
    annul.rotation.z = -0.15;
    urn.add(contre, pour, abst, annul);
    s.when({ flags: ['st_vote_egalite'] }, pour, abst);
    s.when({ flags: ['st_case_e'] }, annul);
    s.spot('urne', at(urn, u.x, top + 0.04, zb + 0.3));

    // ── siège du membre honoraire : chaise dorée, plaque ; M. Ficus y siège ──
    const sg = s.stand(s.rect('siege'));
    const seat = new THREE.Group();
    seat.add(at(box(sg.w * 0.7, sg.h * 0.9, 0.1, '#8a6a2a'), 0, sg.h * 0.45, -0.25), at(box(sg.w * 0.74, 0.1, 0.55, '#6a4a1a'), 0, sg.h * 0.32, 0));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) seat.add(at(box(0.06, sg.h * 0.32, 0.06, '#5a3a1a'), (sx * sg.w * 0.32), sg.h * 0.16, sz * 0.22));
    seat.add(at(label(tr('props.station.honorary'), sg.w * 0.6, 0.16, { color: '#2a2830', bg: '#e8c26a', bold: true }), 0, sg.h * 0.75, -0.19));
    s.spot('siege', at(seat, sg.x, 0, sg.z));
    const fic = at(ficus(sg.h * 0.55), sg.x, sg.h * 0.37, sg.z + 0.05);
    s.when({ flags: ['st_ficus'] }, fic);
    s.animate((t) => (fic.rotation.z = Math.sin(t * 0.5) * 0.008));

    pneumaticTube(s);
    // la capsule de PERCO arrivée dans le bac du tube (procuration + gobelet)
    const tf = s.fit(s.rect('tube'), 0.35);
    const arrived = new THREE.Group();
    const cap = at(cyl(0.12, 0.12, 0.5, '#d8f0ff', { seg: 14, edges: false }), 0, 0, 0);
    cap.rotation.z = Math.PI / 2;
    arrived.add(cap, at(cyl(0.06, 0.05, 0.12, '#f6efdc', { seg: 10 }), 0.45, 0.02, 0.05));
    s.when({ flags: ['st_vote_perco'] }, at(arrived, tf.x - 0.2, 0.55, 0.75));

    bobHere(s);
    sideDoor(s, 'vers_ascenseur', tr('props.station.liftShort'), NAVY);
    s.add(at(pool('#ffe0b0', 3, 2, 0.08), 0, 0.01, 4));
  },
};

/**
 * 12. Direction Générale de l'Existence : SYLVIE en personne (mur de CRT GenAI, visage-onde vivant sur l'écran
 * central : three/sylvieDirection.ts), trône-photocopieuse (billboard GenAI sur estrade), coffre des Objets Trouvés (vitre levée avec `st_coffre_ouvert`, éclat n° 2 qui
 * pulse jusqu'à `st_eclat2`), plaque en laiton (GenAI).
 */
export const stDirection: RoomBuild = {
  camera: { pos: [0, 2.2, 8.2], look: [0, 1.85, 0], fov: 50 },
  shots: {
    sylvie: { fill: 0.75, fov: 42 },
    trone: { fill: 0.85, fov: 40 },
    coffre: { fill: 0.85, orbit: 6, fov: 40 },
    plaque: { fill: 0.9, orbit: -6, fov: 36 },
  },
  intro: 'sylvie',
  build(s) {
    shell(s, { floor: { a: '#18222c', b: '#1e2a34', joint: '#0c1218', tile: 1 }, wall: { top: '#3a4a5a', bottom: '#1a2430' }, trim: '#0c1218', left: -9, right: 9 });
    s.lights({
      sky: '#d8fff4',
      ground: '#0c1218',
      ambient: 0.9,
      key: { color: '#e0fff8', intensity: 1.6, pos: [0, 9, 6], target: [0, 0, 0] },
      points: [
        { color: '#7fffd4', intensity: 3, pos: [0, 3.5, 1.5], distance: 5 },
        { color: '#b56cff', intensity: 2.4, pos: [5.4, 2.4, 1.4], distance: 3.2 },
      ],
      rim: { color: '#7fffd4', intensity: 0.9, pos: [-6, 5, -4] },
      fill: { color: '#9aa8ff', intensity: 0.3, pos: [6, 3, 6] },
      fog: { color: '#060a10', near: 9, far: 24 },
      vignette: { color: '#04060a', strength: 0.7, warm: '#d0fff014' },
    });

    s.spot('plaque', poster(s, s.rect('plaque'), 'direction'));

    // ── mur d'écrans (GenAI : CRT de bureau 1985, ondes, formulaires flous, visages-onde) debout contre le
    // fond ; SYLVIE en personne sur le grand écran central (visage dessiné en direct, bouche-onde qui parle) ──
    // hissé sur un socle d'acier (le visage reste au-dessus du dossier du trône) : 12 → 370 px à l'écran
    const wz = 0.2;
    const wTop = s.wallAt(640, 12, wz);
    const wBot = s.wallAt(640, 370, wz).y;
    const sylvieRig = sylvieWall(wTop.y - wBot);
    const plinthW = (wTop.y - wBot) * 1.3;
    s.add(at(box(plinthW, wBot, 0.5, '#232a33'), wTop.x, wBot / 2, wz - 0.1));
    s.add(at(box(plinthW * 1.02, 0.05, 0.54, '#3a4552'), wTop.x, wBot, wz - 0.1));
    s.spot('sylvie', at(sylvieRig.group, wTop.x, wBot, wz + 0.16));
    s.animate((t) => sylvieRig.update(t));

    // ── trône-photocopieuse (GenAI : capot relevé en dossier, bacs en accoudoirs, coussin) sur une estrade ;
    // ronronne (respiration lente) et « copie l'air » (balayage de vitre toutes les quelques secondes) ──
    const tr0 = s.stand(s.rect('trone'));
    const throne = new THREE.Group();
    const th = tr0.h * 1.02;
    const tw = th * DIRECTION_TRONE_ASPECT;
    const dais = 0.14;
    throne.add(at(box(tw * 1.08, dais, 1.1, '#232a33'), 0, dais / 2, -0.1));
    throne.add(at(box(tw * 0.9, 0.018, 0.02, '#3fae98', { glow: true }), 0, dais - 0.03, 0.46));
    const seat = billboard(DIRECTION_TRONE_URL, th - dais, DIRECTION_TRONE_ASPECT, { tint: '#fff4e4', shadow: 0.01 });
    seat.position.y = dais;
    throne.add(seat);
    const scan = at(glow('#cfffee', tw * 0.5, 0), 0, (th - dais) * 0.47 + dais, 0.08);
    scan.scale.set(tw * 0.12, tw * 0.5, 1);
    throne.add(scan);
    s.spot('trone', at(throne, tr0.x, 0, tr0.z));
    s.animate((t) => {
      seat.scale.set(1 + Math.sin(t * 2.2) * 0.004, 1 + Math.sin(t * 2.2) * 0.007, 1);
      const k = (t % 4.5) / 1.4;
      scan.material.opacity = k < 1 ? Math.sin(k * Math.PI) * 0.55 : 0;
      scan.position.x = (k - 0.5) * tw * 0.5;
    });

    // ── coffre des Objets Trouvés : caisson acier, plaque GenAI, vitre blindée, éclat n° 2 ──
    const OPEN: Condition = { flags: ['st_coffre_ouvert'] };
    const cf = s.stand(s.rect('coffre'));
    const safe = new THREE.Group();
    const cw = cf.w * 0.9;
    const chh = cf.h * 0.92;
    safe.add(at(box(cw, chh, 0.8, '#5a5f6a'), 0, chh / 2, 0));
    safe.add(at(box(cw * 0.7, chh * 0.45, 0.02, '#0c1018', { edges: false }), 0, chh * 0.6, 0.41));
    const ps = stSign('objets', cw * 0.8, chh * 0.2);
    safe.add(at(ps.mesh, 0, chh * 0.2, 0.41));
    const shard = new THREE.Group();
    const cr = at(box(0.18, 0.32, 0.18, '#b56cff', { glow: true }), 0, 0, 0);
    cr.rotation.set(0.4, 0.6, 0.3);
    shard.add(cr, at(glow('#b56cff', 1.2, 0.6), 0, 0, 0.1));
    const shardObj = at(shard, 0, chh * 0.6, 0.3);
    safe.add(shardObj);
    s.when({ notFlags: ['st_eclat2'] }, shardObj);
    const pane = at(box(cw * 0.72, chh * 0.47, 0.03, '#cfe8ff'), 0, chh * 0.6, 0.44);
    (pane.material as THREE.MeshStandardMaterial).transparent = true;
    (pane.material as THREE.MeshStandardMaterial).opacity = 0.35;
    safe.add(pane);
    let lift = 0;
    s.animate((t) => {
      lift += ((s.is(OPEN) ? 1 : 0) - lift) * 0.04;
      pane.position.y = chh * 0.6 + lift * chh * 0.45;
      shard.rotation.y = t * 0.8;
      shard.scale.setScalar(1 + Math.sin(t * 3.2) * 0.08);
    });
    s.spot('coffre', at(safe, cf.x, 0, cf.z));

    bobHere(s);
    sideDoor(s, 'vers_ascenseur', tr('props.station.liftShort'), '#1f7f73');
    s.add(at(pool('#7fffd4', 3, 2, 0.08), 0, 0.01, 4));
  },
};

/**
 * 13. Fourrière & Quai des Navettes : la capsule CS-07 (billboard GenAI : 0 sabot · 1 libérée,
 * `st_vaisseau_libere`), M. Remorque dans sa guérite (planche GenAI ≠ Sabot du sas), panneau des tarifs (GenAI),
 * l'amende jaune sur le pare-brise (`st_amende`), marquage au sol de quai.
 */
/** Largeur / profondeur (monde, × largeur du sprite) de l'ombre de contact CS-07. */
const POD_SHADOW_W = 0.84;
const POD_SHADOW_D = 0.42;
/** Recul (× largeur) : centre de l'ellipse sur la ligne de contact des patins, pas devant (vue plongeante). */
const POD_SHADOW_BACK = 0.17;
let softShadowTex: THREE.Texture | undefined;
/** Disque blanc → transparent (bords doux), teinté par le matériau : ombre de contact. */
function softShadowTexture(): THREE.Texture {
  if (softShadowTex) return softShadowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.8)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  softShadowTex = new THREE.CanvasTexture(c);
  return softShadowTex;
}

export const stFourriere: RoomBuild = {
  camera: { pos: [0, 2.2, 8.2], look: [0, 1.85, 0], fov: 50 },
  shots: {
    remorque: { fill: 0.75, orbit: -6, fov: 42 },
    amendes: { fill: 0.85, fov: 36 },
    capsule_vaisseau: { fill: 0.7, orbit: 6, fov: 46 },
    amende: { fill: 1.1, fov: 34 },
  },
  intro: 'capsule_vaisseau',
  build(s) {
    shell(s, { floor: { a: '#2a2e32', b: '#30343a', joint: '#16181c', tile: 1.2 }, wall: { top: '#5a6066', bottom: '#2a2e32' }, trim: '#16181c', left: -9, right: 9 });
    wallPanels(s, '#4a5056', -9, 9, 2, 8);
    s.lights({
      sky: '#fff6d8',
      ground: '#16181c',
      ambient: 1,
      key: { color: '#ffe8b0', intensity: 1.8, pos: [0, 9, 6], target: [0, 0, 0] },
      points: [
        { color: '#ffd166', intensity: 2.4, pos: [-4.2, 3, 1.6], distance: 4 },
        { color: '#8fd0ff', intensity: 1.6, pos: [3.5, 2, 2.5], distance: 4 },
      ],
      rim: { color: '#ffd166', intensity: 0.7, pos: [6, 5, -4] },
      fill: { color: '#9aa8ff', intensity: 0.3, pos: [-6, 3, 6] },
      fog: { color: '#0e1012', near: 9, far: 24 },
      vignette: { color: '#060708', strength: 0.65, warm: '#fff0c018' },
    });
    neonTubes(s, s.wallAt(640, 10, 2).y, [-5, 0, 5], 2.4);
    // marquage de quai : bandes jaunes et noires
    for (let i = 0; i < 10; i++) s.add(at(box(0.9, 0.012, 0.35, i % 2 ? '#ffd166' : '#1a1a1a', { edges: false, shadow: false }), -4.5 + i * 0.9, 0.007, 3.2));

    s.spot('amendes', poster(s, s.rect('amendes'), 'amendes'));

    // ── M. Remorque dans sa guérite (planche GenAI, ≠ Sabot du sas) ──
    const sb = s.stand(s.rect('remorque'));
    const booth = new THREE.Group();
    booth.add(at(box(sb.w * 1.05, sb.h * 0.45, 0.7, '#c8e02a'), 0, sb.h * 0.22, 0.2));
    booth.add(at(box(sb.w * 1.1, 0.1, 0.9, '#5a6a12'), 0, sb.h * 1.02, 0));
    for (const sx of [-1, 1]) booth.add(at(box(0.08, sb.h, 0.08, '#5a6a12'), sx * sb.w * 0.52, sb.h / 2, 0.5));
    booth.add(at(label(tr('props.station.pound'), sb.w * 0.8, 0.25, { color: '#f6efdc', bg: '#2a2830', bold: true }), 0, sb.h * 0.95, 0.46));
    // la guérite est posée devant le mur : M. Remorque derrière le comptoir, jamais dans le mur (z > 0)
    const bz = Math.max(sb.z, 0.9);
    s.add(at(booth, sb.x, 0, bz));
    const rem = billboardSheet(REMORQUE_SHEET, 2, sb.h * 0.72, REMORQUE_ASPECT, { tint: '#fff2e8', shadow: 0.01 });
    // un poil en retrait derrière le comptoir (plus collé au desk), toujours devant le mur
    s.spot('remorque', at(rem, sb.x, sb.h * 0.28, bz - 0.48));
    // siège de bureau 3D (procédural) derrière le comptoir, décalé à côté de M. Remorque :
    // le dossier dépasse du comptoir jaune → la profondeur de la guérite se lit (meuble entre NPC et mur)
    const chair = officeChair(sb.h * 0.56); // dossier ~0.45 au-dessus du comptoir
    s.add(at(chair, sb.x + sb.w * 0.27, 0, bz - 0.4, -0.45)); // tourné vers lui ; dossier z>0 (jamais dans le mur), piètement caché par le comptoir
    s.animate((t) => rem.userData.setFrame(actorFrame('remorque', REMORQUE_ACTOR, t)));

    // ── la capsule CS-07 (billboard GenAI : sabot / libérée), amende sur le pare-brise ──
    const FREE: Condition = { flags: ['st_vaisseau_libere'] };
    const cv = s.stand(s.rect('capsule_vaisseau'));
    // Un cran plus bas / un peu plus petite : patins vers le marquage de quai (Leny t257).
    // Le sprite touche le bas de sa planche : jamais sous y = 0, sinon le sol mange le pied
    // central + sabot IMPOUND. On le descend à l'écran en l'avançant (podZ) plutôt qu'en l'enfonçant.
    const ch = cv.h * 0.84; // 0.88 avant podZ : compense la perspective (même taille à l’écran)
    const podY = 0;
    const podZ = cv.z + 0.35;
    const pod = billboardSheet(CAPSULE_SHEET, 2, ch, CAPSULE_ASPECT, { tint: '#ffffff', shadow: 0.01 });
    pod.children[0].visible = false; // disque générique trop gros/sombre : ombre de contact dédiée ci-dessous
    s.spot('capsule_vaisseau', at(pod, cv.x, podY, podZ));
    // ombre de contact : ellipse plate et douce sous les patins (largeur ≈ patins extérieurs),
    // posée au sol sur la ligne de contact, dessinée juste avant la capsule
    const podW = ch * CAPSULE_ASPECT;
    const podShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(podW * POD_SHADOW_W, podW * POD_SHADOW_D),
      new THREE.MeshBasicMaterial({ map: softShadowTexture(), color: '#000000', transparent: true, opacity: 0.34, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }),
    );
    podShadow.rotation.x = -Math.PI / 2;
    podShadow.renderOrder = 1; // après le sol (transparent), avant la capsule
    pod.userData.sprite.renderOrder = 2;
    s.add(at(podShadow, cv.x, 0.03, podZ - podW * POD_SHADOW_BACK));
    const nozzle = at(glow('#8fd0ff', 1.2, 0.5), cv.x + ch * CAPSULE_ASPECT * 0.38, podY + ch * 0.62, podZ - 0.05);
    s.add(nozzle);
    s.animate((t) => {
      const free = s.is(FREE);
      pod.userData.setFrame(free ? 1 : 0);
      nozzle.visible = free;
      nozzle.material.opacity = 0.35 + Math.sin(t * 6) * 0.15;
      pod.position.y = podY + (free ? Math.abs(Math.sin(t * 1.6)) * 0.02 : 0);
    });
    const am = s.fit(s.rect('amende'), podZ + 0.4);
    const ticketMesh = at(label(tr('props.station.fine'), am.w * 0.8, am.h * 0.75, { color: '#1a1a1a', bg: '#ffd166', bold: true }), am.x, am.y, podZ + 0.4);
    ticketMesh.rotation.z = 0.08;
    s.spot('amende', ticketMesh);

    bobHere(s);
    sideDoor(s, 'vers_sas', tr('props.station.toSas'), '#d9762a');
    s.add(at(pool('#ffe6a0', 3, 2, 0.1), 0, 0.01, 4));
  },
};
