// Plan héros de la fin : la dimension B-7 « Blattaria Prime ». Deux soleils,
// sol collant, la Reine couronnée et sa cour ; Gary à plat ventre, B.O.B., et
// le Seau renversé (évidemment).
import * as THREE from 'three';
import type { HeroShot } from '../Hero';
import { at, box, cyl, glow, mat, sphere, Vignette } from '../kit';
import { bob, gary, roach, seau } from '../props';
import { skyPlane, skyTexture } from './backdrop';

export function endShot(width: number, height: number): HeroShot {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#5a1f5e', 16, 60);
  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 200);

  const sky = skyTexture({
    stops: [
      [0, '#1a0830'],
      [0.35, '#4a145a'],
      [0.6, '#8a2a6a'],
      [0.82, '#e0605a'],
      [1, '#ffc46b'],
    ],
    clouds: [
      { x: 0.78, y: 0.32, r: 0.5, color: '#ffb34766' },
      { x: 0.3, y: 0.5, r: 0.45, color: '#9cff5722' },
    ],
    stars: 90,
    seed: 77,
  });
  scene.add(at(skyPlane(sky, 170, 85), 0, 18, -70));
  // deux soleils (aplats lumineux + halo)
  scene.add(at(sphere(4.2, '#ffd18a', { glow: true, seg: 24 }), 22, 22, -62), at(glow('#ffb347', 26, 0.55), 22, 22, -61));
  scene.add(at(sphere(1.8, '#c8ff9e', { glow: true, seg: 20 }), 32, 15, -60), at(glow('#9cff57', 12, 0.45), 32, 15, -59));

  scene.add(new THREE.HemisphereLight('#ffb0d0', '#2a0f2a', 1.2));
  const key = new THREE.DirectionalLight('#ffcf9a', 3);
  key.position.set(10, 12, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0008;
  Object.assign(key.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 50 });
  scene.add(key);
  const rim = new THREE.PointLight('#9cff57', 50, 16, 1.4);
  rim.position.set(-4, 4, -6);
  scene.add(rim);

  // sol organique : disques collants en aplats
  const ground = new THREE.Mesh(new THREE.CircleGeometry(80, 48), mat('#5c3420'));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  let s = 5;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 26; i++) {
    const r = 0.6 + rnd() * 2.2;
    const blob = new THREE.Mesh(new THREE.CircleGeometry(r, 10), mat(rnd() > 0.5 ? '#6e4026' : '#4a2a18'));
    blob.rotation.x = -Math.PI / 2;
    blob.position.set(-18 + rnd() * 36, 0.01 + i * 0.0005, -24 + rnd() * 26);
    blob.receiveShadow = true;
    scene.add(blob);
  }
  // colonnes de miettes géantes (monuments)
  for (const [x, z, h] of [[-14, -18, 7], [-9, -26, 11], [12, -22, 9], [17, -14, 5]] as const) {
    const col = at(cyl(1.1, 1.5, h, '#e8c27a', { seg: 6 }), x, h / 2, z);
    col.rotation.y = rnd();
    scene.add(col, at(box(2.6, 0.5, 2.6, '#c9a35e'), x, h + 0.25, z));
  }

  // la Reine et sa cour
  const queen = at(roach(6, true), -2.2, 0, -7, -0.35);
  scene.add(queen);
  const court: THREE.Object3D[] = [];
  for (const [x, z, sz, ry] of [[6, -11, 3.4, -2.6], [9.5, -6.5, 2.4, -2.2], [-9, -12, 2.8, 0.5], [3, -16, 2, -1.7], [-6, -4, 1.6, 0.9]] as const) {
    const r = at(roach(sz), x, 0, z, ry);
    scene.add(r);
    court.push(r);
  }

  // Gary à plat ventre, B.O.B. à côté, le Seau renversé
  const g = gary(1.4);
  g.rotation.x = -Math.PI / 2 + 0.15;
  g.position.set(0.6, 0.35, 2.4);
  g.rotation.z = 0.3;
  scene.add(g);
  const robot = at(bob(1.1), 2.6, 0, 2.8, -0.6);
  scene.add(robot);
  const bucket = at(seau(0.9, 1), -1.3, 0.45, 3.0);
  bucket.rotation.z = Math.PI / 2 - 0.1;
  bucket.rotation.y = 0.5;
  scene.add(bucket);
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(1.3, 20), new THREE.MeshBasicMaterial({ color: '#9cff57', transparent: true, opacity: 0.75, toneMapped: false }));
  puddle.rotation.x = -Math.PI / 2;
  puddle.position.set(-2.4, 0.03, 3.3);
  puddle.scale.set(1.4, 1, 1);
  scene.add(puddle, at(glow('#9cff57', 3, 0.4), -2.4, 0.4, 3.3));

  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh && !(m.material instanceof THREE.MeshBasicMaterial)) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
  });

  const LOOK = new THREE.Vector3(0, 2.4, -3);
  const tick = (t: number) => {
    camera.position.set(Math.sin(t * 0.1) * 0.8, 2.4 + Math.sin(t * 0.13) * 0.15, 11);
    camera.lookAt(LOOK);
    queen.position.y = Math.abs(Math.sin(t * 1.4)) * 0.06;
    court.forEach((r, i) => (r.position.y = Math.abs(Math.sin(t * 6 + i)) * 0.08));
    robot.rotation.y = -0.6 + Math.sin(t * 0.7) * 0.15;
  };
  tick(0);
  return { scene, camera, tick, vignette: new Vignette({ color: '#2a0a2a', strength: 0.55, warm: '#ffcf9a1c' }) };
}
