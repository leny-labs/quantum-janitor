// Plan héros de l'intro : la station Klepsydra-9 en orbite. Coque toon,
// anneau d'habitat qui tourne, réacteur d'improbabilité qui pulse en rose,
// enseigne néon. La caméra avance lentement (travelling) puis dérive.
import * as THREE from 'three';
import type { HeroShot } from '../Hero';
import { at, box, cyl, glow, neon, sphere, stripeTexture, torus, Vignette } from '../kit';
import { skyPlane, skyTexture } from './backdrop';

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
  rimPink.position.set(10, -2, -6);
  const rimCyan = new THREE.PointLight('#7fffd4', 90, 30, 1.2);
  rimCyan.position.set(-12, 4, -4);
  scene.add(rimPink, rimCyan);

  const station = new THREE.Group();

  // ── épine dorsale ──
  const spine = cyl(1.5, 1.5, 18, HULL, { seg: 10 });
  spine.rotation.z = Math.PI / 2;
  station.add(spine);
  for (let i = -4; i <= 4; i++) {
    const rib = at(cyl(1.68, 1.68, 0.35, RIB, { seg: 10 }), i * 2, 0, 0);
    rib.rotation.z = Math.PI / 2;
    station.add(rib);
    // hublots allumés
    if (i !== 0) station.add(at(box(0.7, 0.28, 0.1, i % 2 ? '#ffd166' : '#7fffd4', { glow: true }), i * 2 + 1, 0.5, 1.5));
  }
  // bande de danger au niveau du réacteur
  const hazard = new THREE.Mesh(new THREE.CylinderGeometry(1.72, 1.72, 0.6, 10, 1, true), new THREE.MeshBasicMaterial({ map: stripeTexture('#ffd166', '#1a1030', 10) }));
  hazard.rotation.z = Math.PI / 2;
  hazard.position.x = 7.6;
  station.add(hazard);

  // ── anneau d'habitat (tourne autour de l'épine) ──
  const ring = new THREE.Group();
  ring.add(torus(6.4, 0.75, '#5b3aa0'));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const spoke = at(cyl(0.22, 0.22, 5.2, RIB, { seg: 6 }), Math.cos(a) * 3.6, Math.sin(a) * 3.6, 0);
    spoke.rotation.z = a - Math.PI / 2;
    ring.add(spoke);
    // modules + fenêtres sur l'anneau
    const mod = at(box(1.6, 1.2, 1.9, '#3d2878'), Math.cos(a + 0.5) * 6.4, Math.sin(a + 0.5) * 6.4, 0);
    mod.rotation.z = a + 0.5;
    ring.add(mod);
    ring.add(at(box(0.5, 0.18, 0.06, i % 2 ? '#ffd166' : '#7fffd4', { glow: true }), Math.cos(a + 0.5) * 6.4, Math.sin(a + 0.5) * 6.4, 0.98));
  }
  ring.add(torus(6.4, 0.08, '#7fffd4', { glow: true }));
  ring.rotation.y = Math.PI / 2;
  const ringPivot = at(new THREE.Group(), -2.5, 0, 0);
  ringPivot.add(ring);
  station.add(ringPivot);

  // ── panneaux solaires ──
  const panelTex = stripeTexture('#2a4fa8', '#14245a', 6);
  for (const s of [-1, 1]) {
    station.add(at(cyl(0.12, 0.12, 6, RIB, { seg: 6 }), -9, s * 3, 0));
    const wing = at(box(3.2, 0.06, 4.6, '#ffffff', { map: panelTex }), -9, s * 6.2, 0);
    wing.rotation.x = Math.PI / 2;
    station.add(wing);
  }

  // ── réacteur d'improbabilité (proue) ──
  const reactorCase = at(cyl(1.2, 2.2, 2.6, '#3a1e78', { seg: 10 }), 10.1, 0, 0);
  reactorCase.rotation.z = -Math.PI / 2;
  station.add(reactorCase);
  const core = at(sphere(1.25, '#ff4f9a', { glow: true, seg: 20 }), 11.6, 0, 0);
  station.add(core);
  const coreGlow = at(glow('#ff4f9a', 9, 0.7), 11.8, 0, 0.5);
  const coreGlow2 = at(glow('#7fffd4', 4, 0.4), 11.8, 0, 0.6);
  station.add(coreGlow, coreGlow2);
  const halo = at(torus(2.2, 0.06, '#7fffd4', { glow: true }), 11.4, 0, 0);
  halo.rotation.y = Math.PI / 2;
  station.add(halo);

  // ── mât + balise + enseigne ──
  station.add(at(box(0.18, 4.5, 0.18, RIB), 3, 3.6, 0));
  const beacon = at(sphere(0.28, '#ff5c7a', { glow: true }), 3, 6, 0);
  const beaconGlow = at(glow('#ff5c7a', 2.2, 0.8), 3, 6, 0.1);
  station.add(beacon, beaconGlow);
  const sign = at(neon('KLEPSYDRA-9', 7, 1.4, '#7fffd4', { plate: '#120a28' }), 3.4, 2.5, 1.6);
  station.add(sign);

  station.rotation.set(0.18, -0.42, 0.08);
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
    const z = 78 - k * 46;
    camera.position.set(-6 + k * 4 + Math.sin(t * 0.07) * 2, 3 + k * 1.5 + Math.sin(t * 0.05) * 0.8, z);
    camera.lookAt(LOOK);
    ring.rotation.z = t * 0.25;
    halo.rotation.x = t * 0.8;
    const pulse = 0.5 + Math.sin(t * 2.4) * 0.5;
    coreGlow.material.opacity = 0.55 + pulse * 0.3;
    coreGlow.scale.setScalar(8 + pulse * 2);
    beaconGlow.material.opacity = (t * 1.2) % 1 < 0.2 ? 0.95 : 0.15;
    sign.material.opacity = Math.sin(t * 13) > 0.97 ? 0.4 : 1;
    for (const d of motes) d.m.position.set(d.base.x + Math.sin(t * 0.2 + d.ph) * 0.6, d.base.y + Math.cos(t * 0.3 + d.ph) * 0.4, d.base.z);
  };
  tick(0);
  return { scene, camera, tick, vignette: new Vignette({ color: '#07031a', strength: 0.75, warm: '#ffd2a118' }) };
}
