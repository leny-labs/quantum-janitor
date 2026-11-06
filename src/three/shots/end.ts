// Plan héros de la fin : la dimension B-7 « Blattaria Prime ». Deux soleils,
// sol collant, la Reine couronnée et sa cour ; Gary à plat ventre, B.O.B., et
// le Seau renversé (évidemment).
import * as THREE from 'three';
import type { HeroShot } from '../Hero';
import { at, box, cyl, glow, mat, sphere, Vignette } from '../kit';
import { GARY_PRONE_ASPECT, GARY_PRONE_URL, REINE_FRAMES, REINE_SHEET, REINE_SHEET_ASPECT, ROACH_2D, ROACH_ACTOR, actorFrame, billboardSheet, bob, roach, roachSprite, seau } from '../props';
import { skyPlane, skyTexture } from './backdrop';
import { speaking } from '../../engine/speaking';

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
  // Reine : sprite GenAI en pied (par défaut), ou l'ancien cafard 3D couronné (?roach2d=0)
  const queen = ROACH_2D ? at(billboardSheet(REINE_SHEET, REINE_FRAMES, 6.2, REINE_SHEET_ASPECT, { shadow: 1.6 }), -2.2, 0, -7) : at(roach(6, true), -2.2, 0, -7, -0.35);
  scene.add(queen);
  const court: THREE.Object3D[] = [];
  for (const [x, z, sz, ry] of [[6, -11, 3.4, -2.6], [9.5, -6.5, 2.4, -2.2], [-9, -12, 2.8, 0.5], [3, -16, 2, -1.7], [-6, -4, 1.6, 0.9]] as const) {
    // sprites GenAI en prière (tête vers la droite de l'écran si cos(ry) > 0) ; ?roach2d=0 : cafards 3D
    const r = ROACH_2D ? at(roachSprite(sz * 0.8, Math.cos(ry) > 0, { pose: 'worship', tint: '#ffd9c4' }), x, 0, z) : at(roach(sz), x, 0, z, ry);
    scene.add(r);
    court.push(r);
  }

  // Gary à plat ventre, B.O.B. à côté, le Seau renversé
  // Gary : image GenAI allongée de profil (tête à gauche), vue de 3/4 haut. Un Sprite vertical
  // ancré en bas ne touche le sol que par la main avant (les jambes sont ~27 % plus haut dans
  // l'image) → il « flotte ». On la couche donc presque à plat sur le sol (plan incliné, bord
  // bas = mains devant), longueur compensée chaque frame selon la plongée de la caméra pour
  // garder les proportions de l'image à l'écran ; ombre de contact allongée sous tout le corps.
  const gary = garyProne(GARY_H, -0.1, 2.5);
  scene.add(gary.group);
  const robot = at(bob(1.1), 3.05, 0, 2.9, -0.6);
  scene.add(robot);
  const bucket = at(seau(0.9, 1), -2.55, 0.45, 3.1);
  bucket.rotation.z = Math.PI / 2 - 0.1;
  bucket.rotation.y = 0.5;
  scene.add(bucket);
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(1.3, 20), new THREE.MeshBasicMaterial({ color: '#9cff57', transparent: true, opacity: 0.75, toneMapped: false }));
  puddle.rotation.x = -Math.PI / 2;
  puddle.position.set(-3.5, 0.03, 3.4);
  puddle.scale.set(1.4, 1, 1);
  scene.add(puddle, at(glow('#9cff57', 3, 0.4), -3.5, 0.4, 3.4));

  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh && !(m.material instanceof THREE.MeshBasicMaterial)) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
  });

  const queenSprite = queen.userData.sprite as THREE.Sprite | undefined;
  const queenScale = queenSprite?.scale.clone();
  const LOOK = new THREE.Vector3(0, 2.4, -3);
  // pendant les répliques, le panneau de dialogue couvre le bas de l'écran (y > 462 / 720) :
  // la caméra recule, monte et plonge pour que Gary, B.O.B. et le Seau passent au-dessus,
  // couronne de la Reine toujours dans le cadre ; fondu entre les deux cadrages
  let talkK = 0;
  let last = 0;
  const tick = (t: number) => {
    const dt = Math.min(0.1, Math.max(0, t - last));
    last = t;
    talkK += ((speaking.open ? 1 : 0) - talkK) * Math.min(1, dt * 2.5);
    const k = talkK * talkK * (3 - 2 * talkK);
    camera.position.set(Math.sin(t * 0.1) * 0.8 * (1 - k * 0.5), 2.4 + 0.6 * k + Math.sin(t * 0.13) * 0.15, 11 + 3.5 * k);
    LOOK.y = 2.4 - 2.15 * k;
    camera.lookAt(LOOK);
    const fov = 38 + 4 * k;
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    if (queenSprite && queenScale) {
      // sprite : respiration royale plutôt que des petits sauts
      queenSprite.scale.set(queenScale.x, queenScale.y * (1 + Math.sin(t * 1.3) * 0.015), 1);
      queen.userData.setFrame?.(actorFrame('reine', ROACH_ACTOR, t));
    } else queen.position.y = Math.abs(Math.sin(t * 1.4)) * 0.06;
    court.forEach((r, i) => {
      r.position.y = Math.abs(Math.sin(t * 6 + i)) * 0.08;
      // en prière ; de temps en temps un coup d'œil vers Gary (3/4)
      if (ROACH_2D) r.userData.setPose?.(Math.sin(t * 0.37 + i * 2.3) > 0.9 ? '34' : 'worship');
    });
    gary.fit(camera);
    robot.rotation.y = -0.6 + Math.sin(t * 0.7) * 0.15;
  };
  tick(0);
  return { scene, camera, tick, vignette: new Vignette({ color: '#2a0a2a', strength: 0.55, warm: '#ffcf9a1c' }) };
}

/** Hauteur apparente (monde, à la distance de Gary) de l'image de Gary couché. */
const GARY_H = 1.7;
/** Inclinaison du plan de Gary depuis la verticale (rad) : presque couché au sol. */
const GARY_LEAN = THREE.MathUtils.degToRad(76);

/**
 * Gary à plat ventre : plan texturé (non éclairé, comme les sprites) presque couché, bord bas
 * de l'image (les mains) au sol en (x, z), le haut de l'image part vers le fond. `fit(camera)`
 * ajuste sa longueur pour que l'image garde, vue de la caméra, la hauteur apparente `h`
 * (rapport d'aspect de l'image respecté). Ombre de contact : la silhouette de l'image floutée,
 * posée sur le sol sous le plan et décalée vers l'avant, limitée à la bande du corps (le
 * casque et les étoiles, en l'air, n'en font pas).
 */
function garyProne(h: number, x: number, z: number): { group: THREE.Group; fit: (cam: THREE.Camera) => void } {
  const w = h * GARY_PRONE_ASPECT;
  const geo = new THREE.PlaneGeometry(w, 1);
  geo.translate(0, 0.5, 0); // pivot sur le bord bas
  const bodyMat = new THREE.MeshBasicMaterial({ color: '#ffe6dc', alphaTest: 0.3, transparent: true, side: THREE.DoubleSide });
  const shadowMat = new THREE.MeshBasicMaterial({ color: '#12060a', transparent: true, opacity: 0.62, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
  new THREE.ImageLoader().load(GARY_PRONE_URL, (img) => {
    const map = new THREE.Texture(img);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    map.needsUpdate = true;
    bodyMat.map = map;
    bodyMat.needsUpdate = true;
    // silhouette floutée, fondue vers le haut de l'image
    const W = 512;
    const H = Math.round(W / GARY_PRONE_ASPECT);
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d')!;
    g.filter = 'blur(6px)';
    g.drawImage(img, 0, 0, W, H);
    g.filter = 'none';
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = '#000';
    g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'destination-in';
    const fade = g.createLinearGradient(0, 0, 0, H);
    fade.addColorStop(0, 'rgba(0,0,0,0)');
    fade.addColorStop(0.55, 'rgba(0,0,0,0)');
    fade.addColorStop(0.72, 'rgba(0,0,0,1)');
    fade.addColorStop(1, 'rgba(0,0,0,1)');
    g.fillStyle = fade;
    g.fillRect(0, 0, W, H);
    shadowMat.alphaMap = new THREE.CanvasTexture(c);
    shadowMat.needsUpdate = true;
  });
  const body = new THREE.Mesh(geo, bodyMat);
  body.rotation.x = -GARY_LEAN;
  body.position.y = 0.02;
  body.renderOrder = 2;
  // l'ombre : même cadre, à plat au sol, un peu en avant (vers la caméra) et élargie
  const shadow = new THREE.Mesh(geo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.012;
  shadow.renderOrder = 1;
  shadow.visible = false;
  const group = new THREE.Group();
  group.add(shadow, body);
  group.position.set(x, 0, z);
  const cos = Math.cos(GARY_LEAN);
  const sin = Math.sin(GARY_LEAN);
  const p = new THREE.Vector3();
  const fit = (cam: THREE.Camera) => {
    cam.getWorldPosition(p);
    // plongée vers le milieu du corps : un plan incliné de longueur L paraît haut de
    // L·(cos + sin·tan(plongée)) à l'écran ; on vise h
    const elev = Math.atan2(Math.max(0.2, p.y - 0.2), Math.max(0.5, p.z - z));
    const len = h / (cos + sin * Math.tan(elev));
    body.scale.y = len;
    // ombre : profondeur au sol de l'image, décalée vers l'avant
    shadow.scale.set(1.04, len * sin, 1);
    shadow.position.z = len * sin * 0.08;
    shadow.visible = !!shadowMat.alphaMap;
  };
  return { group, fit };
}
