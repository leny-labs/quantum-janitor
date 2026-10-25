// Studio photo : rend les props 3D en petites images (icônes d'inventaire,
// portraits de dialogue) une seule fois, puis les enregistre comme textures
// Phaser. L'UI garde ainsi le même trait toon que les pièces.
import Phaser from 'phaser';
import * as THREE from 'three';
import { at, cyl, glow } from './kit';
import { badge, bob, fusible, gary, roach, sandwich, seau, serpilliere, sylvie } from './props';

export const iconKey = (id: string) => `icon3d:${id}`;
export const portraitKey = (id: string) => `portrait3d:${id}`;

interface Pose {
  build: () => THREE.Object3D;
  /** Point visé et distance de la caméra. */
  look: [number, number, number];
  dist: number;
  /** Azimut / élévation (radians). */
  yaw?: number;
  pitch?: number;
  rim?: string;
}

const ICONS: Record<string, Pose> = {
  seau: {
    build: () => {
      const g = seau(1, 1.1);
      g.add(at(cyl(0.42, 0.42, 0.02, '#9cff57', { glow: true, edges: false }), 0, 0.84, 0));
      return g;
    },
    look: [0, 0.48, 0],
    dist: 2.6,
    pitch: 0.42,
    rim: '#7fffd4',
  },
  serpilliere: {
    build: () => {
      const g = serpilliere(1.6);
      g.rotation.z = -0.65;
      return g;
    },
    look: [0.3, 0.6, 0],
    dist: 2.6,
    rim: '#ffd166',
  },
  badge: { build: () => badge(0.8), look: [0, 0.6, 0], dist: 2.2, yaw: -0.35, pitch: 0.12, rim: '#7fffd4' },
  sandwich: { build: () => sandwich(1), look: [0, 0.12, 0], dist: 2.1, pitch: 0.75, rim: '#ff8ab8' },
  fusible: { build: () => fusible(1.1), look: [0, 0, 0], dist: 2, yaw: -0.3, pitch: 0.35, rim: '#ff5c7a' },
};

const PORTRAITS: Record<string, Pose & { bg: [string, string] }> = {
  gary: { build: () => gary(1.6), look: [0, 1.0, 0], dist: 2.5, yaw: 0.35, pitch: 0.05, bg: ['#ff8c42', '#3a1240'], rim: '#7fffd4' },
  bob: {
    build: () => {
      const g = bob(1.2);
      g.rotation.x = 0.25;
      return g;
    },
    look: [0, 0.2, 0],
    dist: 1.9,
    yaw: 0.3,
    pitch: 0.25,
    bg: ['#5a6a8a', '#1a1030'],
    rim: '#ff5c7a',
  },
  sylvie: { build: () => sylvie(1.4), look: [0, 0.7, 0], dist: 2.4, yaw: 0.25, bg: ['#1f7f73', '#0b1430'], rim: '#7fffd4' },
  reine: {
    build: () => {
      const g = roach(1.6, true);
      g.rotation.y = -Math.PI / 2 + 0.5;
      return g;
    },
    look: [0.2, 0.35, 0.5],
    dist: 1.9,
    pitch: 0.2,
    bg: ['#ffb347', '#3a0f2a'],
    rim: '#9cff57',
  },
};

/** Génère (une fois par jeu) toutes les textures d'icônes et de portraits. */
export function bakeStudio(textures: Phaser.Textures.TextureManager): void {
  if (textures.exists(iconKey('seau'))) return;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);
  const shoot = (pose: Pose, size: number, bg?: [string, string]) => {
    renderer.setSize(size, size, false);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#b8b0ff', '#2a1640', 1.3));
    const key = new THREE.DirectionalLight('#fff0dc', 3);
    key.position.set(2, 3, 4);
    const rim = new THREE.DirectionalLight(pose.rim ?? '#7fffd4', 2.4);
    rim.position.set(-3, 2, -3);
    scene.add(key, rim);
    if (bg) {
      // fond de portrait : halo coloré + sol de scène
      scene.add(at(glow(bg[0], 6, 0.55), pose.look[0], pose.look[1] + 0.2, -1.6));
    }
    const prop = pose.build();
    scene.add(prop);
    const cam = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
    const yaw = pose.yaw ?? 0.5;
    const pitch = pose.pitch ?? 0.3;
    const [lx, ly, lz] = pose.look;
    cam.position.set(lx + Math.sin(yaw) * Math.cos(pitch) * pose.dist, ly + Math.sin(pitch) * pose.dist, lz + Math.cos(yaw) * Math.cos(pitch) * pose.dist);
    cam.lookAt(lx, ly, lz);
    renderer.render(scene, cam);
    const out = document.createElement('canvas');
    out.width = out.height = size;
    const g = out.getContext('2d')!;
    if (bg) {
      const grad = g.createLinearGradient(0, 0, 0, size);
      grad.addColorStop(0, bg[1]);
      grad.addColorStop(1, bg[0]);
      g.fillStyle = grad;
      g.fillRect(0, 0, size, size);
      // trames de scanlines, discrètes
      g.fillStyle = 'rgba(7,5,15,0.18)';
      for (let y = 0; y < size; y += 4) g.fillRect(0, y, size, 1);
    }
    g.drawImage(renderer.domElement, 0, 0, size, size);
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
    });
    return out;
  };
  for (const [id, pose] of Object.entries(ICONS)) textures.addCanvas(iconKey(id), shoot(pose, 160));
  for (const [id, pose] of Object.entries(PORTRAITS)) textures.addCanvas(portraitKey(id), shoot(pose, 300, pose.bg));
  renderer.dispose();
  renderer.forceContextLoss();
}
