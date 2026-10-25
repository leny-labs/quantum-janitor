import * as THREE from 'three';
import type { Condition, Rect } from '../../engine/types';
import { at, box, cyl, glow, gradientTexture, label, mat, plane, sphere, stripeTexture, torus } from '../kit';
import { fusible } from '../props';
import type { Stage } from '../Stage';
import type { RoomBuild } from './index';

const FULL = { flags: ['refroidissement_verse'] };

/** Gros plan sur la console de stabilisation : pupitre incliné, vue plongeante. */
export const panneau: RoomBuild = {
  camera: { pos: [0, 2.7, 4.3], look: [0, 0.45, 0], fov: 50 },
  build(s) {
    s.lights({
      sky: '#dfe8ff',
      ground: '#10161f',
      ambient: 1.25,
      key: { color: '#ffffff', intensity: 2.4, pos: [-3, 8, 5], target: [0, 0, 0] },
      points: [{ color: '#b06cff', intensity: 14, pos: [0, 3, -3], distance: 10 }],
    });

    // arrière-plan : le labo, flou et violet
    const back = new THREE.Mesh(new THREE.PlaneGeometry(30, 14), mat('#ffffff', { glow: true, map: gradientTexture('#2a1d4a', '#0b0b12') }));
    back.position.set(0, 2, -6);
    s.add(back, at(glow('#b06cff', 7, 0.35), 0, 3.4, -5.5));
    for (let i = 0; i < 14; i++) s.add(at(sphere(0.05, i % 3 ? '#7fffd4' : '#ffd166', { glow: true }), -6 + i * 0.95, 2.6 + (i % 4) * 0.25, -5.4));

    // pupitre incliné : toutes les pièces sont posées dans son repère local
    const desk = new THREE.Group();
    desk.position.set(0, 0.45, 0);
    desk.rotation.x = -0.78;
    s.add(desk);
    const on = (rect: Rect, z: number, obj: THREE.Object3D, cond?: Condition, spot?: string) => {
      const f = s.fitIn(rect, desk);
      obj.position.set(f.x, f.y, z);
      desk.add(obj);
      if (cond) s.when(cond, obj);
      if (spot) s.spot(spot, obj);
      return f;
    };
    const fitted = (rect: Rect) => s.fitIn(rect, desk);

    // châssis
    const fr = fitted([40, 30, 1200, 510]);
    desk.add(at(box(fr.w, fr.h, 1.6, '#1b2533'), fr.x, fr.y, -0.8));
    const bevel = fr.h * 0.025;
    for (const [x, y, w, h] of [
      [0, fr.h / 2, fr.w, bevel],
      [0, -fr.h / 2, fr.w, bevel],
      [-fr.w / 2, 0, bevel, fr.h],
      [fr.w / 2, 0, bevel, fr.h],
    ]) desk.add(at(box(w + bevel, h + bevel, 0.08, '#4a5a70'), fr.x + x, fr.y + y, 0.02));
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) desk.add(at(sphere(bevel * 0.7, '#9aa5b1'), fr.x + sx * (fr.w / 2 - bevel * 2), fr.y + sy * (fr.h / 2 - bevel * 2), 0.04));

    const hd = fitted([240, 40, 800, 22]);
    on([240, 40, 800, 22], 0.01, label("CONSOLE DE STABILISATION — RÉACTEUR D'IMPROBABILITÉ Mk IV", hd.w, hd.h, { color: '#9aa5b1', bold: true }));

    // ── écran de diagnostic ──
    const ec = fitted(s.rect('ecran'));
    on(s.rect('ecran'), 0.03, box(ec.w, ec.h, 0.1, '#2e3a4c'), undefined, 'ecran');
    const scr = fitted([370, 90, 540, 200]);
    on([370, 90, 540, 200], 0.085, plane(scr.w, scr.h, '#050a08', { glow: true }), undefined, 'ecran');
    const screens: [Condition, string, string, number][] = [
      [{ notFlags: ['panneau_allume'] }, '— HORS TENSION —\n\nfusible stabilisateur 7B absent', '#335544', 34],
      [{ flags: ['panneau_allume'], notFlags: ['refroidissement_verse'] }, 'ALIMENTATION ....... OK\nREFROIDISSEMENT .... 0 %\nSTABILITÉ ...... CRITIQUE\n\n> REMPLIR LE RÉSERVOIR', '#7fffd4', 36],
      [FULL, 'ALIMENTATION ....... OK\nREFROIDISSEMENT .. 100 %\nCOMPOSITION ...... ???\n\n> APPUYER SUR STABILISER', '#ffd166', 36],
    ];
    for (const [cond, text, color, size] of screens) on([370, 90, 540, 200], 0.09, label(text, scr.w * 0.95, scr.h * 0.92, { color, mono: true, bold: true, size }), cond);
    const scan = plane(scr.w, scr.h * 0.04, '#7fffd4', { glow: true, opacity: 0.12 });
    on([370, 90, 540, 200], 0.095, scan, { flags: ['panneau_allume'] });
    s.animate((t) => {
      scan.position.y = scr.y + scr.h / 2 - ((t * 0.25) % 1) * scr.h;
    });

    // ── logement du fusible ──
    const lg = fitted(s.rect('logement'));
    on(s.rect('logement'), 0.02, plate(lg.w * 0.92, lg.h * 0.9, '#2a3444', '#ffd166'), undefined, 'logement');
    const lgl = fitted([125, 340, 170, 45]);
    on([125, 340, 170, 45], 0.07, label('STABILISATEUR\n7B', lgl.w, lgl.h, { color: '#ffd166', bold: true }), undefined, 'logement');
    const hole = fitted([185, 400, 50, 50]);
    on([185, 400, 50, 50], 0.07, box(hole.w, hole.h, 0.02, '#000000', { edges: false }), undefined, 'logement');
    const fuse = fusible(hole.w * 0.9);
    fuse.rotation.z = Math.PI / 2;
    on([185, 400, 50, 50], 0.12, fuse, { flags: ['fusible_pose'] }, 'logement');

    // ── cadran d'improbabilité ──
    const cd = fitted(s.rect('cadran'));
    on(s.rect('cadran'), 0.02, plate(cd.w * 0.95, cd.h * 0.88, '#222c3a', '#9aa5b1'), undefined, 'cadran');
    const cl = fitted([440, 355, 360, 30]);
    on([440, 355, 360, 30], 0.07, label('PROBABLE   ·   IMPROBABLE   ·   GARY', cl.w, cl.h, { color: '#ffffff', bold: true }), undefined, 'cadran');
    const scale = fitted([450, 410, 340, 40]);
    const track = plane(scale.w, scale.h, '#ffffff', { map: scaleTexture() });
    on([450, 410, 340, 40], 0.07, track, undefined, 'cadran');
    const needleSpots: [number, Condition][] = [
      [600, { notFlags: ['refroidissement_verse'] }],
      [760, FULL],
    ];
    const needles = needleSpots.map(([x, cond]) => {
      const n = fitted([x, 395, 6, 70]);
      const needle = box(n.w * 1.6, n.h, 0.05, '#ff5c7a');
      on([x, 395, 6, 70], 0.1, needle, cond, 'cadran');
      return { needle, x: n.x };
    });
    s.animate((t) => needles.forEach(({ needle, x }, i) => (needle.position.x = x + Math.sin(t * (7 + i * 5)) * 0.008 * (i + 1))));

    // ── gros bouton rouge ──
    const bt = fitted(s.rect('bouton'));
    const housing = new THREE.Group();
    housing.add(plate(bt.w * 0.92, bt.h * 0.88, '#2a1a1a', '#ff5c7a'));
    const ring = new THREE.Mesh(new THREE.RingGeometry(bt.h * 0.36, bt.h * 0.44, 32), mat('#ffffff', { map: stripeTexture('#ffd166', '#1a1a1a', 12) }));
    ring.position.set(0, bt.h * 0.04, 0.051);
    ring.receiveShadow = true;
    housing.add(ring);
    const cap = cyl(bt.h * 0.3, bt.h * 0.33, 0.18, '#d62839', { seg: 24 });
    cap.rotation.x = Math.PI / 2;
    const btn = at(new THREE.Group().add(cap, at(label('STABILISER', bt.h * 0.5, bt.h * 0.13, { color: '#ffffff', bold: true }), 0, 0, 0.1)), 0, bt.h * 0.04, 0.14);
    housing.add(btn, at(torus(bt.h * 0.33, 0.02, '#ffffff'), 0, bt.h * 0.04, 0.08));
    housing.add(at(label('(ne pas appuyer sans raison)', bt.w * 0.8, bt.h * 0.1, { color: '#ff99aa' }), 0, -bt.h * 0.38, 0.06));
    on(s.rect('bouton'), 0.02, housing, undefined, 'bouton');
    const ready = glow('#ff5c7a', bt.h * 1.3, 0.4);
    on(s.rect('bouton'), 0.3, ready, FULL);
    s.animate((t) => {
      ready.material.opacity = 0.25 + Math.sin(t * 5) * 0.2;
      btn.position.z = 0.14 + (s.is(FULL) ? Math.sin(t * 5) * 0.01 : 0);
    });

    // voyants décoratifs
    for (let i = 0; i < 8; i++) {
      const led = fitted([110 + i * 26, 510, 14, 14]);
      const m = sphere(led.w * 0.5, i % 3 ? '#7fffd4' : '#ffd166', { glow: true });
      on([110 + i * 26, 510, 14, 14], 0.03, m, { flags: ['panneau_allume'] });
    }
    blinkers(s, desk);
  },
};

/** Plaque avec liseré coloré, face +Z, épaisseur 0.1. */
function plate(w: number, h: number, color: string, stroke: string): THREE.Group {
  const t = Math.min(w, h) * 0.04;
  return new THREE.Group().add(
    at(box(w, h, 0.08, color), 0, 0, 0),
    at(box(w, t, 0.1, stroke, { edges: false }), 0, h / 2 - t / 2, 0.01),
    at(box(w, t, 0.1, stroke, { edges: false }), 0, -h / 2 + t / 2, 0.01),
    at(box(t, h, 0.1, stroke, { edges: false }), -w / 2 + t / 2, 0, 0.01),
    at(box(t, h, 0.1, stroke, { edges: false }), w / 2 - t / 2, 0, 0.01),
  );
}

/** Graduation probable → improbable → Gary (vert → jaune → violet). */
function scaleTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0, '#3ab36b');
  grad.addColorStop(0.5, '#ffd166');
  grad.addColorStop(1, '#b06cff');
  g.fillStyle = grad;
  g.fillRect(0, 16, 512, 32);
  g.fillStyle = '#10161f';
  for (let i = 0; i <= 20; i++) g.fillRect(i * 25.4, i % 5 ? 30 : 16, 3, i % 5 ? 18 : 32);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Quelques voyants qui clignotent sur le châssis (vie de la machine). */
function blinkers(s: Stage, desk: THREE.Group): void {
  const leds = [0, 1, 2].map((i) => {
    const f = s.fitIn([1160, 80 + i * 40, 20, 20], desk);
    const led = at(sphere(f.w * 0.3, '#ff5c7a', { glow: true }), f.x, f.y, 0.04);
    desk.add(led);
    return led;
  });
  s.animate((t) => leds.forEach((l, i) => (l.visible = Math.sin(t * (2 + i) + i) > 0)));
}
