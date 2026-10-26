// Pont Three.js → Phaser. Three rend la pièce dans un canvas WebGL hors écran ;
// ce canvas sert de texture à une Image Phaser placée sous l'UI. Phaser garde
// donc la main sur l'échelle, les entrées, les fondus et les tremblements.
import Phaser from 'phaser';
import * as THREE from 'three';
import type { Condition, SceneDef } from '../engine/types';
import { CLOSEUPS, ROOMS } from './rooms';
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

  /** Décor qui filme la scène `id` (une pièce, ou la pièce hôte d'un gros plan). */
  private stage(id: string, lookup: (id: string) => SceneDef | undefined): Stage | null {
    const hostId = CLOSEUPS[id] ?? id;
    const build = ROOMS[hostId];
    const host = lookup(hostId);
    if (!build || !host) return null;
    let stage = this.stages.get(hostId);
    if (!stage) {
      stage = new Stage(host, build.camera, this.width, this.height);
      build.build(stage, lookup);
      if (build.shots) stage.shots(hostId, build.shots);
      this.stages.set(hostId, stage);
    }
    return stage.films(id) ? stage : null;
  }

  /** Affiche la scène `def` (décor construit à la première visite puis gardé en cache). */
  show(def: SceneDef, check: (c: Condition | undefined) => boolean, lookup: (id: string) => SceneDef | undefined): Stage | null {
    const stage = this.stage(def.id, lookup);
    if (!stage) {
      this.current = null;
      return null;
    }
    if (stage !== this.current) this.current?.highlight(null);
    this.current = stage;
    stage.view(def.id);
    stage.sync(check);
    return stage;
  }

  /**
   * Si `from` et `to` sont deux vues du décor affiché (pièce ⇄ gros plan),
   * lance un travel caméra et renvoie sa promesse ; sinon null (fondu classique).
   */
  travel(from: string, to: string): Promise<void> | null {
    const stage = this.current;
    if (!stage || !stage.films(from) || !stage.films(to) || from === to) return null;
    return stage.travelTo(to);
  }

  /** Durée (s) du travel vers `to` (bruitage calé dessus). */
  travelTime(to: string): number {
    return this.current?.travelTime(to) ?? 1;
  }

  /** Travel d'examen vers le hotspot `id` de la vue courante (null s'il n'en a pas). */
  examine(id: string, instant = false): Promise<void> | null {
    return this.current?.examine(id, instant) ?? null;
  }

  /** Retour d'examen (null s'il n'y en a pas en cours). */
  release(): Promise<void> | null {
    return this.current?.release() ?? null;
  }

  get examining(): string | null {
    return this.current?.examining ?? null;
  }

  highlight(id: string | null): void {
    this.current?.highlight(id);
  }

  onSubject(x: number, y: number): boolean {
    return this.current?.onSubject(x, y) ?? true;
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
    stage.vignette?.render(this.renderer);
    if (stage.focus && stage.focusAmount > 0.01) {
      stage.focus.setOpacity(stage.focusAmount);
      stage.focus.render(this.renderer);
    }
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
    private lookup: (id: string) => SceneDef | undefined,
  ) {
    // addImage accepte un canvas (WebGL compris) et crée la frame de base.
    if (!scene.textures.exists(ROOM_TEXTURE)) scene.textures.addImage(ROOM_TEXTURE, room.canvas as unknown as HTMLImageElement);
    this.source = scene.textures.get(ROOM_TEXTURE).source[0];
    this.image = scene.add.image(0, 0, ROOM_TEXTURE).setOrigin(0).setDepth(0).setVisible(false);
  }

  show(def: SceneDef, check: (c: Condition | undefined) => boolean): boolean {
    const ok = !!this.room.show(def, check, this.lookup);
    this.image.setVisible(ok);
    return ok;
  }

  highlight(id: string | null): void {
    this.room.highlight(id);
  }

  /** Gros plan : le pixel tombe-t-il sur l'objet filmé (console…) ? */
  onSubject(x: number, y: number): boolean {
    return !this.image.visible || this.room.onSubject(x, y);
  }

  travel(from: string, to: string): Promise<void> | null {
    return this.image.visible ? this.room.travel(from, to) : null;
  }

  travelTime(to: string): number {
    return this.room.travelTime(to);
  }

  examine(id: string, instant = false): Promise<void> | null {
    return this.image.visible ? this.room.examine(id, instant) : null;
  }

  release(): Promise<void> | null {
    return this.image.visible ? this.room.release() : null;
  }

  /** Hotspot examiné (caméra rapprochée) ou null. */
  get examining(): string | null {
    return this.image.visible ? this.room.examining : null;
  }

  update(): void {
    if (!this.image.visible || !this.room.render()) return;
    // téléversement canvas → texture : seulement quand Three a redessiné
    this.source.update();
  }
}
