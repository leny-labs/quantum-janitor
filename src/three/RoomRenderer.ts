// Pont Three.js → Phaser. Three rend la pièce dans un canvas WebGL hors écran ;
// ce canvas sert de texture à une Image Phaser placée sous l'UI. Phaser garde
// donc la main sur l'échelle, les entrées, les fondus et les tremblements.
import Phaser from 'phaser';
import * as THREE from 'three';
import type { Condition, SceneDef } from '../engine/types';
import { ROOMS } from './rooms';
import { Stage } from './Stage';

export const ROOM_TEXTURE = 'room3d';

let shared: RoomRenderer | null = null;

export class RoomRenderer {
  readonly canvas = document.createElement('canvas');
  private renderer: THREE.WebGLRenderer;
  private stages = new Map<string, Stage>();
  private current: Stage | null = null;
  private timer = new THREE.Timer();
  /** Pièce présente dans le canvas (le cache de Stage est partagé entre scènes Phaser). */
  private drawn: Stage | null = null;

  /** Un seul contexte WebGL pour toute la partie (les scènes Phaser vont et viennent). */
  static get(width: number, height: number): RoomRenderer {
    shared ??= new RoomRenderer(width, height);
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

  /** Affiche la pièce `def` (construite à la première visite puis gardée en cache). */
  show(def: SceneDef, check: (c: Condition | undefined) => boolean): Stage | null {
    const build = ROOMS[def.id];
    if (!build) {
      this.current = null;
      return null;
    }
    let stage = this.stages.get(def.id);
    if (!stage) {
      stage = new Stage(def, build.camera, this.width, this.height);
      build.build(stage);
      this.stages.set(def.id, stage);
    }
    if (stage !== this.current) this.current?.highlight(null);
    this.current = stage;
    stage.sync(check);
    return stage;
  }

  highlight(id: string | null): void {
    this.current?.highlight(id);
  }

  /**
   * Rend l'image courante si elle a pu changer (pièce animée, état, survol,
   * changement de pièce). Renvoie false si le canvas n'a pas bougé — pas
   * besoin alors de le re-téléverser côté Phaser.
   */
  render(): boolean {
    const stage = this.current;
    this.timer.update();
    if (!stage || (!stage.animated && !stage.dirty && stage === this.drawn)) return false;
    stage.tick(this.timer.getElapsed(), Math.min(this.timer.getDelta(), 0.1));
    this.renderer.render(stage.scene, stage.camera);
    stage.dirty = false;
    this.drawn = stage;
    return true;
  }
}

/** Image Phaser qui affiche le rendu Three.js et le met à jour à chaque frame. */
export class RoomView {
  readonly image: Phaser.GameObjects.Image;
  private source: Phaser.Textures.TextureSource;

  constructor(
    scene: Phaser.Scene,
    private room: RoomRenderer,
  ) {
    // addImage accepte un canvas (WebGL compris) et crée la frame de base.
    if (!scene.textures.exists(ROOM_TEXTURE)) scene.textures.addImage(ROOM_TEXTURE, room.canvas as unknown as HTMLImageElement);
    this.source = scene.textures.get(ROOM_TEXTURE).source[0];
    this.image = scene.add.image(0, 0, ROOM_TEXTURE).setOrigin(0).setDepth(0).setVisible(false);
  }

  show(def: SceneDef, check: (c: Condition | undefined) => boolean): boolean {
    const ok = !!this.room.show(def, check);
    this.image.setVisible(ok);
    return ok;
  }

  highlight(id: string | null): void {
    this.room.highlight(id);
  }

  update(): void {
    if (!this.image.visible || !this.room.render()) return;
    // téléversement canvas → texture : seulement quand Three a redessiné
    this.source.update();
  }
}
