// Plan de fond de l'écran titre : l'anneau du réacteur d'improbabilité flottant
// dans l'espace (nébuleuse violet/bleu, planète en hint). Le héros (key art
// GenAI) est posé par-dessus côté Phaser — voir TitleScene. Un tout petit seau
// dérive au loin : clin d'œil, plus l'identité du menu.
import * as THREE from 'three';
import type { HeroShot } from '../Hero';
import { at, box, glow, torus, Vignette } from '../kit';
import { seau } from '../props';
import { skyPlane, skyTexture } from './backdrop';

export function titleShot(width: number, height: number): HeroShot {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 200);

  // ── espace profond ──
  const sky = skyTexture({
    stops: [
      [0, '#04030f'],
      [0.35, '#0a0826'],
      [0.65, '#130a36'],
      [1, '#07051a'],
    ],
    clouds: [
      { x: 0.68, y: 0.42, r: 0.6, color: '#5b2fb066' },
      { x: 0.8, y: 0.62, r: 0.42, color: '#2a4cff44' },
      { x: 0.55, y: 0.25, r: 0.35, color: '#a03cc044' },
      { x: 0.25, y: 0.55, r: 0.5, color: '#1d2a8a40' },
      { x: 0.9, y: 0.3, r: 0.3, color: '#ff4f9a22' },
      { x: 0.42, y: 0.75, r: 0.3, color: '#7fffd414' },
    ],
    planet: { x: 0.6, y: 0.87, r: 0.24, color: '#6a5ae0', band: '#5646c4', shade: '#1c1450', ring: '#b8a8ff55' },
    stars: 420,
    seed: 7,
  });
  scene.add(at(skyPlane(sky, 150, 75), 0, 6, -60));

  // ── lumières ──
  scene.add(new THREE.HemisphereLight('#8a7cff', '#0a0620', 1.2));
  const key = new THREE.DirectionalLight('#ffd2a1', 2.2);
  key.position.set(6, 9, 10);
  scene.add(key);
  const rimCyan = new THREE.PointLight('#7fffd4', 60, 12, 1.4);
  rimCyan.position.set(6.5, 4.2, -2);
  const rimPink = new THREE.PointLight('#ff4f9a', 70, 14, 1.4);
  rimPink.position.set(2.2, 2.5, -2.5);
  scene.add(rimCyan, rimPink);

  // ── l'anneau du réacteur d'improbabilité (derrière le héros) ──
  const RING = new THREE.Vector3(5.6, 3.6, -10);
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
  reactor.scale.setScalar(0.6);
  reactor.rotation.set(0.12, -0.42, 0);
  scene.add(reactor);
  const core = at(glow('#8a5cff', 6, 0.5), RING.x, RING.y, RING.z - 0.8);
  const core2 = at(glow('#7fffd4', 3, 0.3), RING.x, RING.y, RING.z - 0.5);
  scene.add(core, core2);

  // ── clin d'œil : un petit seau à la dérive, très loin ──
  const drift = seau(0.5, 0.56);
  drift.position.set(4.9, -2.2, -12);
  scene.add(drift);

  // ── poussière lumineuse ──
  const motes: { m: THREE.Sprite; base: THREE.Vector3; ph: number }[] = [];
  let s = 9;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 46; i++) {
    const m = glow(i % 3 ? '#9c8cff' : '#7fffd4', 0.1 + rnd() * 0.16, 0.4 + rnd() * 0.4);
    const base = new THREE.Vector3(-8 + rnd() * 18, -1 + rnd() * 8, -8 + rnd() * 9);
    m.position.copy(base);
    scene.add(m);
    motes.push({ m, base, ph: rnd() * 10 });
  }
  // (les astéroïdes sont côté Phaser, derrière la vitre — voir TitleScene)

  const LOOK = new THREE.Vector3(1.2, 2.55, 0);
  const tick = (t: number) => {
    camera.position.set(-0.6 + Math.sin(t * 0.12) * 0.4, 2.2 + Math.sin(t * 0.09) * 0.12, 10.5);
    camera.lookAt(LOOK);
    reactor.rotation.z = t * 0.06;
    (core.material as THREE.SpriteMaterial).opacity = 0.45 + Math.sin(t * 1.7) * 0.08;
    drift.rotation.set(t * 0.21, t * 0.33, 0.4 + t * 0.12);
    drift.position.y = -2.2 + Math.sin(t * 0.4) * 0.2;
    for (const d of motes) d.m.position.set(d.base.x + Math.sin(t * 0.3 + d.ph) * 0.4, d.base.y + Math.sin(t * 0.5 + d.ph * 2) * 0.3, d.base.z);
  };
  tick(0);
  return { scene, camera, tick, vignette: new Vignette({ color: '#05031a', strength: 0.7, warm: '#8a7cff10' }) };
}
