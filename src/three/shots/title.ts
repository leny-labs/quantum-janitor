// Plan héros de l'écran titre : le Seau, sur son socle, devant l'anneau du
// réacteur d'improbabilité. Lumière chaude de face, contre-jour cyan/magenta.
import * as THREE from 'three';
import type { HeroShot } from '../Hero';
import { at, box, cyl, glow, mat, sphere, stripeTexture, tileTexture, torus, Vignette } from '../kit';
import { bob, seau, serpilliere } from '../props';
import { skyPlane, skyTexture } from './backdrop';

export function titleShot(width: number, height: number): HeroShot {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#2a1050', 14, 46);
  const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 200);

  // ── ciel ──
  const sky = skyTexture({
    stops: [
      [0, '#07041a'],
      [0.38, '#1c0d44'],
      [0.62, '#4a1660'],
      [0.8, '#a2386e'],
      [1, '#ff8a5c'],
    ],
    clouds: [
      { x: 0.72, y: 0.55, r: 0.55, color: '#ff5c7a55' },
      { x: 0.2, y: 0.3, r: 0.5, color: '#3b2a9e66' },
      { x: 0.85, y: 0.2, r: 0.35, color: '#7fffd418' },
    ],
    planet: { x: 0.18, y: 0.86, r: 0.3, color: '#ffb36b', band: '#f2894e', shade: '#7a2a5e', ring: '#ffd9a8aa' },
    stars: 160,
    seed: 42,
  });
  scene.add(at(skyPlane(sky, 150, 75), 0, 14, -60));

  // ── lumières ──
  scene.add(new THREE.HemisphereLight('#8a7cff', '#1a0b2e', 1.1));
  const key = new THREE.DirectionalLight('#ffd2a1', 3.2);
  key.position.set(6, 9, 10);
  key.target.position.set(2.6, 1, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0008;
  key.shadow.normalBias = 0.02;
  Object.assign(key.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 40 });
  scene.add(key, key.target);
  const rimCyan = new THREE.PointLight('#7fffd4', 60, 12, 1.4);
  rimCyan.position.set(5.6, 4.2, -2);
  const rimPink = new THREE.PointLight('#ff4f9a', 70, 14, 1.4);
  rimPink.position.set(0.2, 2.5, -2.5);
  const liquid = new THREE.PointLight('#9cff57', 10, 4, 1.6);
  liquid.position.set(3, 3.1, 0.5);
  scene.add(rimCyan, rimPink, liquid);

  // ── pont d'observation ──
  const deckTex = tileTexture('#231842', '#2a1d50', '#120b26', [14, 10]);
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(56, 40), mat('#ffffff', { map: deckTex }));
  deck.rotation.x = -Math.PI / 2;
  deck.position.set(0, 0, -6);
  deck.receiveShadow = true;
  scene.add(deck);
  // bord du pont : garde-corps en silhouette sur le vide
  const railZ = -9;
  scene.add(at(box(60, 0.12, 0.12, '#140c2a', { edges: false }), 0, 1.3, railZ));
  scene.add(at(box(60, 0.08, 0.08, '#140c2a', { edges: false }), 0, 0.7, railZ));
  scene.add(at(box(60, 0.05, 0.3, '#7fffd4', { glow: true }), 0, 0.03, railZ + 0.4));
  for (let x = -28; x <= 28; x += 2.4) scene.add(at(box(0.1, 1.3, 0.1, '#140c2a', { edges: false }), x, 0.65, railZ));

  // ── station en arrière-plan (silhouettes, fondues dans le brouillard) ──
  const station = new THREE.Group();
  const hull = '#3a2466';
  station.add(at(cyl(2.2, 2.2, 14, hull, { seg: 8 }), 0, 0, 0));
  station.children[0].rotation.z = Math.PI / 2;
  for (let i = -3; i <= 3; i++) {
    const rib = at(cyl(2.35, 2.35, 0.3, '#2a1a4e', { seg: 8 }), i * 2, 0, 0);
    rib.rotation.z = Math.PI / 2;
    station.add(rib);
    if (i % 2) station.add(at(box(0.5, 0.25, 0.1, '#ffd166', { glow: true }), i * 2 + 1, 0.6, 2.2));
  }
  station.add(at(box(0.15, 9, 0.15, '#2a1a4e'), 4.5, 5, 0), at(sphere(0.18, '#ff5c7a', { glow: true }), 4.5, 9.6, 0));
  station.add(at(box(9, 0.6, 0.6, '#2a1a4e'), -9, 1.5, 0));
  station.add(at(cyl(1.4, 1.4, 3, hull, { seg: 8 }), -14, 1.5, 0));
  station.position.set(-12, 6.5, -32);
  station.rotation.y = 0.35;
  scene.add(station);
  const tower = new THREE.Group();
  tower.add(at(box(2.4, 18, 2.4, '#2c1a52'), 0, 9, 0));
  for (let y = 2; y < 18; y += 1.6) tower.add(at(box(0.9, 0.3, 0.05, y % 3.2 < 1.6 ? '#7fffd4' : '#ffd166', { glow: true }), 0.4, y, 1.25));
  tower.add(at(box(4, 0.4, 4, '#2c1a52'), 0, 18, 0));
  tower.position.set(15, -4, -26);
  scene.add(tower);

  // ── l'anneau du réacteur d'improbabilité ──
  const RING = new THREE.Vector3(3.1, 3.6, -4.2);
  const reactor = new THREE.Group();
  reactor.add(torus(3.3, 0.42, '#5b2fb0'));
  reactor.add(at(torus(2.78, 0.08, '#7fffd4', { glow: true }), 0, 0, 0.12));
  reactor.add(at(torus(3.86, 0.05, '#ff4f9a', { glow: true }), 0, 0, 0));
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const clamp = at(box(0.5, 1.1, 1.1, i % 3 ? '#3a1e78' : '#ffd166'), Math.cos(a) * 3.3, Math.sin(a) * 3.3, 0);
    clamp.rotation.z = a;
    reactor.add(clamp);
  }
  reactor.position.copy(RING);
  reactor.rotation.set(0.12, -0.32, 0);
  scene.add(reactor);
  const core = at(glow('#ff4f9a', 9, 0.55), RING.x, RING.y, RING.z - 0.8);
  const core2 = at(glow('#7fffd4', 5, 0.35), RING.x, RING.y, RING.z - 0.5);
  scene.add(core, core2);
  // support de l'anneau
  scene.add(at(box(1.2, 0.5, 2, '#24164a'), RING.x, 0.25, RING.z), at(box(0.5, RING.y - 3.3, 0.6, '#24164a'), RING.x, (RING.y - 3.3) / 2, RING.z));

  // ── socle du Seau ──
  const P = new THREE.Vector3(3, 0, 0.4);
  const plinth = new THREE.Group();
  plinth.add(at(cyl(1.55, 1.75, 0.5, '#2e1d5c', { seg: 6 }), 0, 0.25, 0));
  const band = new THREE.Mesh(new THREE.CylinderGeometry(1.56, 1.66, 0.22, 6, 1, true), mat('#ffffff', { map: stripeTexture('#ffd166', '#1a1030', 10) }));
  (band.material as THREE.MeshToonMaterial).map!.repeat.set(6, 1);
  band.position.y = 0.25;
  plinth.add(band);
  plinth.add(at(cyl(1.25, 1.4, 0.45, '#3d2878', { seg: 6 }), 0, 0.72, 0));
  plinth.add(at(cyl(1.27, 1.27, 0.05, '#7fffd4', { seg: 6, glow: true }), 0, 0.97, 0));
  plinth.position.copy(P);
  plinth.rotation.y = 0.3;
  scene.add(plinth);
  // halo au sol sous le socle
  const pool = new THREE.Mesh(new THREE.CircleGeometry(2.6, 32), new THREE.MeshBasicMaterial({ color: '#7fffd4', transparent: true, opacity: 0.12, depthWrite: false, toneMapped: false }));
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(P.x, 0.01, P.z);
  scene.add(pool);

  // ── le Seau ──
  const hero = seau(1.5, 1.7);
  const goo = at(cyl(0.6, 0.6, 0.02, '#9cff57', { glow: true, edges: false }), 0, 1.25, 0);
  hero.add(goo);
  const gooGlow = at(glow('#9cff57', 2.2, 0.5), 0, 1.4, 0);
  hero.add(gooGlow);
  const heroBase = new THREE.Group();
  heroBase.add(hero);
  heroBase.position.set(P.x, 1.0, P.z);
  scene.add(heroBase);
  hero.rotation.set(0.06, 0, -0.08);

  // bulles de « Dégraissant Absolu »
  const bubbles: { m: THREE.Object3D; speed: number; phase: number; r: number }[] = [];
  for (let i = 0; i < 9; i++) {
    const b = sphere(0.05 + (i % 3) * 0.03, '#c8ff9e', { glow: true, opacity: 0.75, seg: 8 });
    scene.add(b);
    bubbles.push({ m: b, speed: 0.25 + (i % 4) * 0.08, phase: i * 0.37, r: 0.15 + (i % 5) * 0.08 });
  }

  // serpillière appuyée contre le socle, B.O.B. qui regarde le Seau d'en bas
  const mop = at(serpilliere(3.1), P.x - 1.75, 0, P.z + 0.3);
  mop.rotation.z = -0.28;
  mop.rotation.y = 0.4;
  scene.add(mop);
  const robot = at(bob(1.1), P.x + 2.1, 0, P.z + 1.4, -0.9);
  robot.rotation.x = -0.18;
  scene.add(robot);

  // ── poussière lumineuse ──
  const motes: { m: THREE.Sprite; base: THREE.Vector3; ph: number }[] = [];
  let s = 9;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 40; i++) {
    const m = glow(i % 3 ? '#7fffd4' : '#ff8ab8', 0.12 + rnd() * 0.18, 0.5 + rnd() * 0.4);
    const base = new THREE.Vector3(-6 + rnd() * 14, 0.3 + rnd() * 6.5, -6 + rnd() * 8);
    m.position.copy(base);
    scene.add(m);
    motes.push({ m, base, ph: rnd() * 10 });
  }

  // ombres
  scene.traverse((o) => {
    if ((o as THREE.Mesh).isMesh && !((o as THREE.Mesh).material instanceof THREE.MeshBasicMaterial)) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  deck.castShadow = false;

  const LOOK = new THREE.Vector3(1.2, 2.55, 0);
  const tick = (t: number) => {
    // caméra : légère contre-plongée, dérive lente
    camera.position.set(-0.6 + Math.sin(t * 0.12) * 0.5, 1.15 + Math.sin(t * 0.09) * 0.12, 10.5);
    camera.lookAt(LOOK);
    hero.position.y = 0.12 + Math.sin(t * 1.1) * 0.08;
    hero.rotation.y = t * 0.35;
    reactor.rotation.z = t * 0.06;
    (core.material as THREE.SpriteMaterial).opacity = 0.5 + Math.sin(t * 1.7) * 0.08;
    gooGlow.material.opacity = 0.45 + Math.sin(t * 3.1) * 0.1;
    liquid.intensity = 10 + Math.sin(t * 3.1) * 3;
    for (const b of bubbles) {
      const k = (t * b.speed + b.phase) % 1;
      b.m.position.set(P.x + Math.sin(b.phase * 9 + t) * b.r, 2.2 + k * 2.6, P.z + Math.cos(b.phase * 7) * b.r);
      b.m.scale.setScalar(k < 0.85 ? 1 : 1 + (k - 0.85) * 4);
      ((b.m as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = k < 0.85 ? 0.75 : 0.75 * (1 - (k - 0.85) / 0.15);
    }
    for (const d of motes) d.m.position.set(d.base.x + Math.sin(t * 0.3 + d.ph) * 0.4, d.base.y + Math.sin(t * 0.5 + d.ph * 2) * 0.3, d.base.z);
    robot.rotation.y = -0.9 + Math.sin(t * 0.6) * 0.08;
  };
  tick(0);
  return { scene, camera, tick, vignette: new Vignette({ color: '#12052a', strength: 0.7, warm: '#ffd2a120' }) };
}
