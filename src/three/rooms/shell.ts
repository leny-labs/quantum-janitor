// Éléments communs aux pièces : sol, mur du fond, murs latéraux, plinthes.
import * as THREE from 'three';
import type { Rect } from '../../engine/types';
import { aoStrip, at, box, mat, tileTexture, wallTexture } from '../kit';
import type { Stage } from '../Stage';

export interface ShellSpec {
  floor: { a: string; b: string; joint: string; tile?: number };
  wall: { top: string; bottom: string };
  /** Abscisses des murs latéraux (absents = hors champ). */
  left?: number;
  right?: number;
  depth?: number;
  height?: number;
  trim?: string;
}

export function shell(s: Stage, spec: ShellSpec): void {
  const depth = spec.depth ?? 12;
  const height = spec.height ?? 8;
  const x0 = spec.left ?? -16;
  const x1 = spec.right ?? 16;
  const width = x1 - x0;
  const cx = (x0 + x1) / 2;
  const tile = spec.floor.tile ?? 1.2;

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    mat('#ffffff', { map: tileTexture(spec.floor.a, spec.floor.b, spec.floor.joint, [width / (tile * 2), depth / (tile * 2)]) }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(cx, 0, depth / 2);
  floor.receiveShadow = true;

  const wallTex = wallTexture(spec.wall.top, spec.wall.bottom, width, height);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat('#ffffff', { map: wallTex }));
  wall.position.set(cx, height / 2, 0);
  wall.receiveShadow = true;
  s.add(floor, wall);

  const trim = spec.trim ?? spec.wall.bottom;
  s.add(at(box(width, 0.22, 0.08, trim, { edges: false }), cx, 0.11, 0.04));

  for (const [x, dir] of [
    [spec.left, 1],
    [spec.right, -1],
  ] as const) {
    if (x === undefined) continue;
    const side = new THREE.Mesh(new THREE.PlaneGeometry(depth, height), mat('#ffffff', { map: wallTexture(spec.wall.top, spec.wall.bottom, depth, height) }));
    side.rotation.y = (dir * Math.PI) / 2;
    side.position.set(x, height / 2, depth / 2);
    side.receiveShadow = true;
    s.add(side, at(box(0.08, 0.22, depth, trim, { edges: false }), x + dir * 0.04, 0.11, depth / 2));
    // arête du coin, pour lire le volume
    s.add(at(box(0.12, height, 0.12, trim, { edges: false }), x, height / 2, 0));
    // ombres d'angle : coin vertical + pied du mur latéral
    const corner = at(aoStrip(1.2, height, 0.45), x + dir * 0.6, height / 2, 0.012);
    corner.rotation.z = (dir * Math.PI) / 2;
    const foot = at(aoStrip(depth, 0.9, 0.5), x + dir * 0.45, 0.004, depth / 2);
    foot.rotation.set(-Math.PI / 2, 0, (dir * Math.PI) / 2);
    s.add(corner, foot);
  }

  // ombres peintes au pied du mur du fond (sol + bas du mur) : ancre les volumes
  const floorAo = at(aoStrip(width, 1.1, 0.55), cx, 0.003, 0.55);
  floorAo.rotation.x = -Math.PI / 2;
  const wallAo = at(aoStrip(width, 0.9, 0.4), cx, 0.45, 0.011);
  wallAo.rotation.z = Math.PI;
  s.add(floorAo, wallAo);
}

/** Joints de panneaux verticaux sur le mur du fond. */
export function wallPanels(s: Stage, color: string, from: number, to: number, step: number, height: number): void {
  for (let x = from; x <= to; x += step) s.add(at(box(0.05, height, 0.04, color, { edges: false, shadow: false }), x, height / 2, 0.02));
}

/** Tuyau horizontal le long du mur avec colliers. */
export function pipe(s: Stage, y: number, z: number, x0: number, x1: number, r: number, color: string): void {
  const len = x1 - x0;
  const p = at(new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), mat(color)), (x0 + x1) / 2, y, z);
  p.rotation.z = Math.PI / 2;
  p.castShadow = true;
  s.add(p);
  for (let x = x0 + 0.6; x < x1; x += 2.2) {
    const c = at(new THREE.Mesh(new THREE.CylinderGeometry(r * 1.3, r * 1.3, r * 0.8, 10), mat('#2a2f38')), x, y, z);
    c.rotation.z = Math.PI / 2;
    s.add(c);
  }
}

/** Porte coulissante de station sur le mur du fond, remplissant `rect`. */
export function backDoor(s: Stage, rect: Rect, z: number, frame: string, panel: string): { door: THREE.Group; f: { x: number; y: number; w: number; h: number } } {
  const f = s.fit(rect, z);
  const t = Math.min(f.w, f.h) * 0.08;
  const door = new THREE.Group();
  door.add(
    at(box(f.w, t, 0.25, frame), 0, f.h / 2 - t / 2, 0),
    at(box(t, f.h, 0.25, frame), -f.w / 2 + t / 2, 0, 0),
    at(box(t, f.h, 0.25, frame), f.w / 2 - t / 2, 0, 0),
    at(box(f.w - 2 * t, f.h - t, 0.08, panel), 0, -t / 2, -0.04),
  );
  door.position.set(f.x, f.y, z);
  s.add(door);
  return { door, f };
}

/** Centre z d'un meuble de profondeur `d` dont la face avant est en `front`, sans traverser le mur. */
export function against(front: number, d: number): number {
  return Math.max(front - d / 2, d / 2 + 0.05);
}
