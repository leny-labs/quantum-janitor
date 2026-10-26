// Plan héros de l'intro : la station Klepsydra-9 en orbite — un sablier géant
// de travers, bulbes habités qui tournent, cœur d'improbabilité qui « coule »
// dans le col de verre, enseigne néon. La caméra avance (travelling) puis dérive.
import * as THREE from 'three';
import type { HeroShot } from '../Hero';
import { at, box, cyl, glow, mat, neon, outline, sphere, stripeTexture, torus, Vignette } from '../kit';
import { skyPlane, skyTexture } from './backdrop';
import { t as tr } from '../../i18n';

const HULL = '#4a2f80';
const RIB = '#2a1a4e';

export function introShot(width: number, height: number): HeroShot {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 400);

  const sky = skyTexture({
    stops: [
      [0, '#05030f'],
      [0.45, '#140a33'],
      [0.75, '#2c0f4a'],
      [1, '#5a1a5e'],
    ],
    clouds: [
      { x: 0.25, y: 0.35, r: 0.55, color: '#3b2a9e55' },
      { x: 0.78, y: 0.6, r: 0.5, color: '#ff4f9a33' },
      { x: 0.6, y: 0.2, r: 0.3, color: '#7fffd41a' },
    ],
    planet: { x: 0.8, y: 0.78, r: 0.32, color: '#5fb8d8', band: '#4a98c0', shade: '#1f3a6a', ring: '#bff6ffaa' },
    stars: 420,
    seed: 2291,
  });
  scene.add(at(skyPlane(sky, 320, 160), 0, 0, -120));

  scene.add(new THREE.HemisphereLight('#9c8cff', '#1a0b2e', 1.2));
  const sun = new THREE.DirectionalLight('#ffd9a8', 3.4);
  sun.position.set(-10, 8, 12);
  scene.add(sun);
  const rimPink = new THREE.PointLight('#ff4f9a', 160, 30, 1.2);
  rimPink.position.set(30, -3, -12);
  const rimCyan = new THREE.PointLight('#7fffd4', 90, 30, 1.2);
  rimCyan.position.set(10, 8, -8);
  scene.add(rimPink, rimCyan);

  // ── KLEPSYDRA-9 : un sablier orbital géant, légèrement de travers ──
  // Deux bulbes habités reliés par un col de verre où « coule » le cœur
  // d'improbabilité ; un cadre à quatre montants (dont un tordu) les tient.
  const station = new THREE.Group();
  const spinner = new THREE.Group(); // bulbes + modules : tournent sur l'axe
  station.add(spinner);

  // bulbes (tour) : profil de goutte, ouvert sur le col
  const bulb = (dir: 1 | -1, k: number) => {
    const prof: [number, number][] = [
      [0.95, 1.7],
      [1.7, 2.15],
      [3.1, 2.9],
      [4.05, 3.9],
      [4.3, 4.85],
      [4.0, 5.85],
      [3.1, 6.7],
      [2.3, 7.25],
    ];
    const pts = prof.map(([r, y]) => new THREE.Vector2(r * k, dir * (1.7 + (y - 1.7) * k)));
    if (dir < 0) pts.reverse();
    const m = outline(new THREE.Mesh(new THREE.LatheGeometry(pts, 14), mat(HULL)));
    m.castShadow = m.receiveShadow = true;
    return m;
  };
  spinner.add(bulb(1, 1), bulb(-1, 1.08));

  // ceintures de hublots (tournent avec les bulbes)
  const winTex = windowTexture();
  for (const [y, r, h] of [
    [4.85, 4.36, 0.95],
    [-5.0, 4.68, 1.05],
    [-3.6, 3.95, 0.5],
  ] as const) {
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 14, 1, true), new THREE.MeshBasicMaterial({ map: winTex, toneMapped: false }));
    belt.position.y = y;
    spinner.add(belt);
  }
  // modules bricolés (asymétriques)
  const pod = at(box(1.7, 1.3, 1.5, '#3d2878'), 0, 3.3, 3.3);
  pod.rotation.set(0.5, 0, 0.12);
  spinner.add(pod, at(box(0.5, 0.2, 0.06, '#ffd166', { glow: true }), 0, 3.5, 4.1));
  const pipe = at(cyl(0.2, 0.2, 3.4, RIB, { seg: 6 }), -1.3, 4.6, 3.5);
  pipe.rotation.x = 0.35;
  spinner.add(pipe);
  const dish = at(cyl(1.1, 0.15, 0.5, '#8f7ad8', { seg: 10 }), 3.6, 5.6, -1.2);
  dish.rotation.z = -1.0;
  spinner.add(dish);
  const hz = at(box(1.9, 1.1, 0.2, '#ffffff', { map: stripeTexture('#ffd166', '#1a1030', 6) }), -3.2, -3.4, 3.0);
  hz.rotation.set(-0.35, -0.8, 0.1);
  spinner.add(hz);
  spinner.add(at(sphere(1.0, '#5b3aa0', { seg: 10 }), 3.3, -6.4, 2.4));
  spinner.add(at(box(1.2, 0.9, 1.2, '#3d2878'), -3.0, 5.4, -2.6));

  // col de verre + cœur d'improbabilité qui pulse
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 3.6, 14, 1, true), mat('#7fffd4', { glow: true, opacity: 0.22, side: THREE.DoubleSide }));
  station.add(glass);
  for (const y of [-1.7, 1.7]) {
    const lip = at(torus(1.05, 0.16, '#7fffd4', { glow: true }), 0, y, 0);
    lip.rotation.x = Math.PI / 2;
    station.add(lip);
  }
  const core = at(sphere(0.42, '#ff4f9a', { glow: true, seg: 14 }), 0, 0.9, 0);
  station.add(core);
  // filet continu + petit tas néon au fond du col
  station.add(cyl(0.06, 0.06, 2.9, '#ff8ab8', { glow: true, seg: 5, opacity: 0.7 }));
  station.add(at(cyl(0.05, 0.75, 0.45, '#ff4f9a', { glow: true, seg: 10 }), 0, -1.45, 0));
  const coreGlow = at(glow('#ff4f9a', 7, 0.7), 0, 0.4, 0.6);
  const coreGlow2 = at(glow('#7fffd4', 3.4, 0.4), 0, 0, 0.7);
  station.add(coreGlow, coreGlow2);
  const halo = torus(1.9, 0.06, '#7fffd4', { glow: true });
  station.add(halo);

  // le filet qui « coule » du bulbe haut vers le bas
  const DROPS = 14;
  const drops = Array.from({ length: DROPS }, (_, i) => {
    const d = sphere(0.14 + (i % 3) * 0.05, i % 4 === 3 ? '#7fffd4' : '#ffd1e3', { glow: true, seg: 6 });
    station.add(d);
    return d;
  });

  // ── cadre : deux plateaux épais + quatre montants ──
  const plates: [number, number][] = [
    [8.2, 5.2],
    [-8.6, 5.7],
  ];
  for (const [y, r] of plates) {
    station.add(at(cyl(r, r, 0.9, '#5b3aa0', { seg: 14 }), 0, y, 0));
    station.add(at(cyl(r * 0.55, r * 0.55, 0.3, RIB, { seg: 12 }), 0, y - Math.sign(y) * 0.55, 0));
    const rim = at(torus(r + 0.05, 0.09, '#7fffd4', { glow: true }), 0, y, 0);
    rim.rotation.x = Math.PI / 2;
    station.add(rim);
  }
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    const [x, z] = [Math.cos(a) * 4.7, Math.sin(a) * 4.7];
    if (i === 1) {
      // le montant tordu (rafistolé au scotch)
      const up = at(cyl(0.24, 0.24, 8.3, RIB, { seg: 6 }), x + 0.45, 3.9, z);
      up.rotation.z = 0.12;
      const lo = at(cyl(0.24, 0.24, 8.3, RIB, { seg: 6 }), x + 0.45, -4.3, z);
      lo.rotation.z = -0.12;
      station.add(up, lo, at(cyl(0.38, 0.38, 0.7, '#ffd166', { seg: 6 }), x + 0.95, -0.2, z));
    } else station.add(at(cyl(0.24, 0.24, 16.6, RIB, { seg: 6 }), x, -0.2, z));
  }

  // antenne tordue + balise sur le plateau haut
  const mast1 = at(cyl(0.12, 0.12, 2.6, RIB, { seg: 6 }), -3.9, 9.9, -0.6);
  mast1.rotation.z = 0.3;
  const mast2 = at(cyl(0.1, 0.1, 1.8, RIB, { seg: 6 }), -4.0, 11.8, -0.6);
  mast2.rotation.z = -0.5;
  station.add(mast1, mast2);
  const beacon = at(sphere(0.3, '#ff5c7a', { glow: true }), -3.55, 12.65, -0.6);
  const beaconGlow = at(glow('#ff5c7a', 2.4, 0.8), -3.55, 12.65, -0.5);
  station.add(beacon, beaconGlow);

  // enseigne plantée sur le toit, façon motel
  for (const x of [-2.4, 2.4]) station.add(at(box(0.16, 1.0, 0.16, RIB), x, 9.1, 0.8));
  const sign = at(neon(tr('props.introStation'), 7, 1.4, '#7fffd4', { plate: '#120a28' }), 0, 10.2, 0.8);
  station.add(sign);

  // un panneau solaire minuscule, ridicule, bricolé au plateau bas
  station.add(at(cyl(0.08, 0.08, 1.8, RIB, { seg: 6 }), -6.4, -8.6, 0.6).rotateZ(Math.PI / 2));
  const mini = at(box(1.0, 0.05, 0.8, '#ffffff', { map: stripeTexture('#2a4fa8', '#14245a', 4) }), -7.7, -8.5, 0.6);
  mini.rotation.set(0.9, 0, 0.3);
  station.add(mini);

  station.position.set(20.5, 1.8, 0);
  station.rotation.set(0.12, -0.25, -0.16);
  scene.add(station);

  // petits débris / poussière d'orbite
  const motes: { m: THREE.Sprite; base: THREE.Vector3; ph: number }[] = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 50; i++) {
    const m = glow(i % 3 ? '#7fffd4' : '#ff8ab8', 0.15 + rnd() * 0.25, 0.4 + rnd() * 0.4);
    const base = new THREE.Vector3(-30 + rnd() * 60, -14 + rnd() * 28, -20 + rnd() * 36);
    m.position.copy(base);
    scene.add(m);
    motes.push({ m, base, ph: rnd() * 10 });
  }

  const LOOK = new THREE.Vector3(1.5, 0.6, 0);
  const ease = (k: number) => 1 - (1 - k) ** 3;
  const tick = (t: number) => {
    // travelling avant sur ~8 s, puis lente dérive orbitale
    const k = ease(Math.min(1, t / 8));
    const z = 118 - k * 58;
    camera.position.set(-6 + k * 4 + Math.sin(t * 0.07) * 2, 3 + k * 1.5 + Math.sin(t * 0.05) * 0.8, z);
    camera.lookAt(LOOK);
    spinner.rotation.y = t * 0.22;
    station.rotation.z = -0.16 + Math.sin(t * 0.45) * 0.035;
    halo.rotation.set(Math.PI / 2 + Math.sin(t * 0.9) * 0.35, 0, t * 0.8);
    // chute en boucle dans le col : accélère du cœur jusqu'au tas
    for (let i = 0; i < DROPS; i++) {
      const u = (t * 0.55 + i / DROPS) % 1;
      drops[i].position.set(Math.sin(i * 2.3) * 0.14, 1.1 - u * u * 2.5, Math.cos(i * 1.7) * 0.14);
    }
    const pulse = 0.5 + Math.sin(t * 2.4) * 0.5;
    coreGlow.material.opacity = 0.55 + pulse * 0.3;
    coreGlow.scale.setScalar(6 + pulse * 2);
    core.scale.setScalar(1 + pulse * 0.12);
    beaconGlow.material.opacity = (t * 1.2) % 1 < 0.2 ? 0.95 : 0.15;
    sign.material.opacity = Math.sin(t * 13) > 0.97 ? 0.4 : 1;
    for (const d of motes) d.m.position.set(d.base.x + Math.sin(t * 0.2 + d.ph) * 0.6, d.base.y + Math.cos(t * 0.3 + d.ph) * 0.4, d.base.z);
  };
  tick(0);
  return { scene, camera, tick, vignette: new Vignette({ color: '#07031a', strength: 0.75, warm: '#ffd2a118' }) };
}

/** Bande de hublots allumés (jaune / cyan) pour les ceintures des bulbes. */
function windowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 32;
  const g = c.getContext('2d')!;
  g.fillStyle = '#1a1030';
  g.fillRect(0, 0, 512, 32);
  for (let i = 0; i < 16; i++) {
    if (i % 7 === 5) continue; // un hublot éteint, forcément
    g.fillStyle = i % 3 ? '#ffd166' : '#7fffd4';
    g.beginPath();
    g.roundRect(i * 32 + 7, 8, 18, 16, 5);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
