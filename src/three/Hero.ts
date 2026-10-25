// Plans « héros » plein écran (écran titre, fin du chapitre) rendus par Three.js
// dans leur propre canvas, affiché comme texture Phaser sous l'UI — même
// principe que RoomRenderer, mais en 1280 × 720 et sans hotspots.
import Phaser from 'phaser';
import * as THREE from 'three';

export const HERO_TEXTURE = 'hero3d';

export interface HeroShot {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  /** Animation (t en secondes depuis l'affichage). */
  tick?: (t: number, dt: number) => void;
}

let shared: HeroRenderer | null = null;

export class HeroRenderer {
  readonly canvas = document.createElement('canvas');
  private renderer: THREE.WebGLRenderer;
  private current: HeroShot | null = null;
  private timer = new THREE.Timer();
  private t0 = 0;

  static get(width: number, height: number): HeroRenderer {
    shared ??= new HeroRenderer(width, height);
    return shared;
  }

  private constructor(
    readonly width: number,
    readonly height: number,
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(width, height, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.setClearColor(0x0b0b12);
  }

  show(shot: HeroShot): void {
    this.current = shot;
    this.timer.update();
    this.t0 = this.timer.getElapsed();
  }

  render(): void {
    if (!this.current) return;
    this.timer.update();
    this.current.tick?.(this.timer.getElapsed() - this.t0, Math.min(this.timer.getDelta(), 0.1));
    this.renderer.render(this.current.scene, this.current.camera);
  }
}

/** Image Phaser plein écran affichant un plan héros. */
export class HeroView {
  readonly image: Phaser.GameObjects.Image;
  private source: Phaser.Textures.TextureSource;
  private hero: HeroRenderer;

  constructor(scene: Phaser.Scene, shot: HeroShot) {
    this.hero = HeroRenderer.get(scene.scale.width, scene.scale.height);
    if (!scene.textures.exists(HERO_TEXTURE)) scene.textures.addImage(HERO_TEXTURE, this.hero.canvas as unknown as HTMLImageElement);
    this.source = scene.textures.get(HERO_TEXTURE).source[0];
    this.image = scene.add.image(0, 0, HERO_TEXTURE).setOrigin(0).setDepth(0);
    this.hero.show(shot);
    this.update();
  }

  update(): void {
    this.hero.render();
    this.source.update();
  }
}
