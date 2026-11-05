/**
 * Chaîne de trombones / maillons de Mme Guichard (frame 3 de sa planche) : une vraie chaîne
 * Three.js qui pend de ses doigts et se balance doucement, à la place de la chaîne peinte (effacée
 * de la cellule 3 de `guichard-sheet.png`, sauf le petit maillon pincé entre pouce et index).
 *
 * Onze maillons ovales (tube le long d'une ellipse), alternés de face / de chant comme une vraie
 * chaîne, contour cartoon par coque inversée. Chaque maillon est l'enfant du précédent : un petit
 * angle sinusoïdal déphasé par articulation suffit à donner un pendule souple (pas de physique).
 * Géométries et matériaux partagés au niveau du module : reconstruire la pièce ne réalloue rien.
 *
 * « Derrière la vitre » : même voile que la balle d'élastiques (`guichardBall.ts`) — couleurs
 * tirées vers le bleu-gris du plexi (#cfe8ff) et un poil assombries, contour fin violacé, chaîne
 * recollée au plan du sprite (z local bas) pour prendre la même « peau » de verre que le buste.
 */
import * as THREE from 'three';
import { mat } from './kit';

/** Repère dans une cellule 753 × 768 (px) : maillon pincé entre pouce et index. */
const CELL_W = 753;
const CELL_H = 768;
const GRIP = { x: 216, y: 396 };
/** Maillon (px cellule) : demi-axes de l'ellipse médiane, rayon du fil, pas entre maillons. */
const LINK = { a: 8, b: 19, r: 3, pitch: 32 };
const LINKS = 11; // ≈ 350 px de chaîne, jusqu'au bas de la cellule (masqué par le comptoir)

const COLORS = ['#c9ced6', '#aab0b8', '#8a8f98'];
/** Voile du plexi : identique à la balle (teinte de la vitre, part du mélange, assombrissement). */
const GLASS = new THREE.Color('#cfe8ff');
const VEIL = 0.2;
const DIM = 0.8;

function seen(c: THREE.ColorRepresentation): THREE.Color {
  return new THREE.Color(c).lerp(GLASS, VEIL).multiplyScalar(DIM);
}

/** Ellipse fermée (plan XY) : ligne médiane d'un maillon. */
function linkCurve(): THREE.CatmullRomCurve3 {
  const pts = Array.from({ length: 16 }, (_, i) => {
    const th = (i / 16) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(th) * LINK.a, Math.sin(th) * LINK.b, 0);
  });
  return new THREE.CatmullRomCurve3(pts, true, 'centripetal');
}

let shared: { link: THREE.TubeGeometry; ink: THREE.TubeGeometry; mats: THREE.Material[]; inkMat: THREE.Material } | undefined;

function assets() {
  if (shared) return shared;
  const curve = linkCurve();
  shared = {
    link: new THREE.TubeGeometry(curve, 28, LINK.r, 6, true),
    ink: new THREE.TubeGeometry(curve, 28, LINK.r + 1.3, 6, true), // trait fin : la vitre adoucit le contour
    mats: COLORS.map((c) => mat(seen(c))),
    inkMat: new THREE.MeshBasicMaterial({ color: seen('#241a2c'), side: THREE.BackSide }),
  };
  return shared;
}

export interface GuichardChain {
  object: THREE.Group;
  /** À appeler chaque frame : `frame` = cellule courante de la planche, `t` en s, `breath` = scale.y / scale.y de repos. */
  update(frame: number, t: number, breath: number): void;
}

/**
 * Chaîne pendue aux doigts d'un billboard planche de largeur `w` et hauteur `h` (repère local du
 * groupe `billboardSheet`, ancre `center` (0.5, 0.008)). Visible seulement sur la cellule `cell`.
 */
export function guichardChain(w: number, h: number, cell = 3): GuichardChain {
  const a = assets();
  const k = h / CELL_H; // px cellule → unités monde
  const baseX = (GRIP.x / CELL_W - 0.5) * w;
  const baseY = ((CELL_H - GRIP.y) / CELL_H - 0.008) * h;

  const object = new THREE.Group();
  object.name = 'guichard-chain';
  const root = new THREE.Group(); // en px cellule, mis à l'échelle d'un coup
  root.scale.setScalar(k);
  object.add(root);
  const joints: THREE.Group[] = [];
  let parent: THREE.Object3D = root;
  for (let i = 0; i < LINKS; i++) {
    const joint = new THREE.Group();
    joint.position.y = i === 0 ? 0 : -LINK.pitch;
    const link = new THREE.Group();
    // haut intérieur du maillon accroché à l'articulation ; un sur deux vu de chant
    link.position.y = -(LINK.b - LINK.r);
    link.rotation.y = i % 2 ? Math.PI / 2 : 0;
    link.add(new THREE.Mesh(a.link, a.mats[i % 2 ? 1 : i % 4 === 0 ? 0 : 2]), new THREE.Mesh(a.ink, a.inkMat));
    joint.add(link);
    parent.add(joint);
    joints.push(joint);
    parent = joint;
  }
  // recollée au plan du sprite, à peine devant : même profondeur que les doigts peints, bien
  // derrière la vitre (zb + 0,02) ; opaque, elle est dessinée avant la vitre qui la voile ensuite
  object.position.set(baseX, baseY, 0.02);
  object.visible = false;

  let pop = 0;
  return {
    object,
    update(frame, t, breath) {
      const want = frame === cell ? 1 : 0;
      pop += (want - pop) * 0.25;
      if (pop < 0.02) {
        object.visible = false;
        return;
      }
      object.visible = true;
      // pendule doux (période ≈ 2,4 s) : la main lance, chaque articulation suit avec un retard,
      // le bas fouette un peu ; léger va-et-vient vers la vitre (jamais derrière le gilet) et
      // une torsion lente qui fait tourner les maillons de face / de chant
      const w0 = 2.6;
      root.rotation.z = Math.sin(t * w0) * 0.13;
      root.rotation.x = -0.08 - Math.sin(t * w0 * 0.5 + 0.7) * 0.05;
      root.rotation.y = Math.sin(t * 0.9) * 0.6;
      for (let i = 1; i < LINKS; i++) joints[i].rotation.z = Math.sin(t * w0 - i * 0.38) * 0.03;
      object.position.y = baseY * breath;
      object.scale.setScalar(pop);
    },
  };
}
