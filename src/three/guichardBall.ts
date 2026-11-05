/**
 * Balle d'élastiques de Mme Guichard (frame 4 de sa planche) : une vraie sphère Three.js qui
 * tourne sur le bout de son doigt, à la place de la balle peinte (effacée de la cellule 4 de
 * `guichard-sheet.png`, motion lines comprises). Une sphère de base + ~20 tores fins
 * (élastiques jaunes / rouges / bleus / gris) aux axes tirés au hasard, contour cartoon par
 * coque inversée. Géométries et matériaux partagés (créés une fois au niveau du module) :
 * reconstruire la pièce ne réalloue rien.
 */
import * as THREE from 'three';
import { mat } from './kit';

/** Repère de la balle peinte dans une cellule 753 × 768 (centre / rayon, px). */
const CELL_W = 753;
const CELL_H = 768;
const BALL = { x: 598, y: 481, r: 43 };

const COLORS = ['#f2c230', '#e8b52a', '#d8483c', '#c23a33', '#4f86b8', '#3f6f9c', '#9aa2ab', '#e07a3a'];

let shared: { core: THREE.SphereGeometry; ink: THREE.SphereGeometry; bands: THREE.TorusGeometry[]; mats: THREE.Material[]; coreMat: THREE.Material; inkMat: THREE.Material } | undefined;

function assets() {
  if (shared) return shared;
  shared = {
    core: new THREE.SphereGeometry(0.93, 20, 14),
    ink: new THREE.SphereGeometry(1.13, 20, 14),
    // trois rayons légèrement différents : les bandes se chevauchent au lieu de se fondre
    bands: [0.96, 1.0, 1.04].map((r) => new THREE.TorusGeometry(r, 0.1, 5, 36)),
    mats: COLORS.map((c) => mat(c)),
    coreMat: mat('#9c4632'),
    inkMat: new THREE.MeshBasicMaterial({ color: 0x1a1018, side: THREE.BackSide }),
  };
  return shared;
}

/** Petit PRNG déterministe : même fouillis de bandes à chaque visite. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export interface GuichardBall {
  object: THREE.Group;
  /** À appeler chaque frame : `frame` = cellule courante de la planche, `t` en s, `breath` = scale.y / scale.y de repos. */
  update(frame: number, t: number, breath: number): void;
}

/**
 * Balle collée au doigt d'un billboard planche de largeur `w` et hauteur `h` (repère local du
 * groupe `billboardSheet`, ancre `center` (0.5, 0.008)). Visible seulement sur la cellule `cell`.
 */
export function guichardBall(w: number, h: number, cell = 4): GuichardBall {
  const a = assets();
  const r = (BALL.r / CELL_H) * h;
  const baseX = (BALL.x / CELL_W - 0.5) * w;
  const baseY = ((CELL_H - BALL.y) / CELL_H - 0.008) * h;

  const object = new THREE.Group();
  object.name = 'guichard-ball';
  const tilt = new THREE.Group(); // axe de rotation un peu penché
  tilt.rotation.set(0.25, 0, -0.32);
  const spin = new THREE.Group();
  spin.add(new THREE.Mesh(a.core, a.coreMat));
  const rand = rng(1985);
  for (let i = 0; i < 20; i++) {
    const band = new THREE.Mesh(a.bands[i % 3], a.mats[Math.floor(rand() * a.mats.length)]);
    // axe uniforme sur la sphère
    const u = rand() * 2 - 1;
    const th = rand() * Math.PI * 2;
    const n = new THREE.Vector3(Math.sqrt(1 - u * u) * Math.cos(th), u, Math.sqrt(1 - u * u) * Math.sin(th));
    band.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
    spin.add(band);
  }
  const ink = new THREE.Mesh(a.ink, a.inkMat);
  tilt.add(spin, ink);
  tilt.scale.setScalar(r);
  object.add(tilt);
  object.position.set(baseX, baseY, 0.04);
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
      // ≈ 1,5 tour/s, avec une légère nutation : le fouillis de bandes se lit en tournant
      spin.rotation.y = t * Math.PI * 3;
      spin.rotation.x = Math.sin(t * 2.3) * 0.18;
      object.position.y = baseY * breath;
      object.scale.setScalar(pop);
    },
  };
}
