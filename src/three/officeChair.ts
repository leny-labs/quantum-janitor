/**
 * Siège de bureau procédural (primitives du kit, pas de sprite GenAI) : piètement 5 branches
 * à roulettes, vérin chromé, assise + dossier rembourrés beige-gris. Station cheap bureaucratique.
 * Origine au sol, assise face à +z (vers le joueur). `h` = hauteur totale (haut du dossier).
 */
import * as THREE from 'three';
import { at, box, cyl, sphere } from './kit';

export interface OfficeChairOpts {
  /** Rembourrage (assise / dossier). */
  pad?: string;
  /** Tubes / piètement. */
  metal?: string;
}

export function officeChair(h = 1.1, o: OfficeChairOpts = {}): THREE.Group {
  const pad = o.pad ?? '#b9b09a';
  const padDark = '#8f8774';
  const metal = o.metal ?? '#8d93a0';
  const k = h / 1.1; // dimensions pensées pour une chaise de 1.1 de haut
  const g = new THREE.Group();

  // piètement étoile 5 branches + roulettes
  const legR = 0.27 * k;
  const casterY = 0.03 * k;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + Math.PI / 10;
    const arm = at(box(legR, 0.035 * k, 0.05 * k, '#3a3d44', { edges: false }), Math.sin(a) * legR * 0.5, 0.075 * k, Math.cos(a) * legR * 0.5);
    arm.rotation.y = a + Math.PI / 2;
    g.add(arm, at(sphere(0.032 * k, '#1c1d22', { seg: 8 }), Math.sin(a) * legR, casterY, Math.cos(a) * legR));
  }
  // vérin
  const seatY = 0.5 * k;
  g.add(at(cyl(0.045 * k, 0.05 * k, 0.12 * k, '#3a3d44', { seg: 12 }), 0, 0.12 * k, 0));
  g.add(at(cyl(0.025 * k, 0.025 * k, seatY - 0.18 * k, metal, { seg: 10, edges: false }), 0, (seatY + 0.18 * k) / 2 - 0.02 * k, 0));
  // platine + assise rembourrée (coussin légèrement bombé : deux couches)
  g.add(at(box(0.3 * k, 0.03 * k, 0.3 * k, '#3a3d44', { edges: false }), 0, seatY - 0.02 * k, 0));
  g.add(at(box(0.5 * k, 0.07 * k, 0.46 * k, pad), 0, seatY + 0.03 * k, 0));
  g.add(at(box(0.44 * k, 0.025 * k, 0.4 * k, padDark, { edges: false }), 0, seatY + 0.075 * k, 0.01 * k));
  // tube de dossier (col de cygne) + dossier rembourré
  const backZ = -0.26 * k;
  g.add(at(box(0.05 * k, 0.04 * k, 0.2 * k, metal, { edges: false }), 0, seatY - 0.01 * k, -0.16 * k));
  g.add(at(box(0.05 * k, 0.3 * k, 0.04 * k, metal, { edges: false }), 0, seatY + 0.13 * k, backZ));
  const back = at(box(0.46 * k, 0.4 * k, 0.08 * k, pad), 0, seatY + 0.42 * k, backZ + 0.01 * k);
  back.rotation.x = -0.12; // léger dossier incliné
  g.add(back);
  const backInset = at(box(0.38 * k, 0.32 * k, 0.02 * k, padDark, { edges: false }), 0, seatY + 0.42 * k, backZ + 0.06 * k);
  backInset.rotation.x = -0.12;
  g.add(backInset);
  // accoudoirs tubulaires
  for (const sx of [-1, 1]) {
    g.add(at(box(0.03 * k, 0.2 * k, 0.03 * k, metal, { edges: false }), sx * 0.27 * k, seatY + 0.1 * k, -0.02 * k));
    g.add(at(box(0.06 * k, 0.03 * k, 0.26 * k, '#3a3d44'), sx * 0.27 * k, seatY + 0.2 * k, 0));
  }
  return g;
}
