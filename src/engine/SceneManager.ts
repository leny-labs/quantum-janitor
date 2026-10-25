import Phaser from 'phaser';
import type { GameState } from './GameState';
import type { HotspotLayer } from './HotspotLayer';
import type { GameContent, SceneDef } from './types';

const FADE_MS = 280;

/** Navigation entre vues fixes, avec fondu. */
export class SceneManager {
  constructor(
    private scene: Phaser.Scene,
    private content: GameContent,
    private state: GameState,
    private layer: HotspotLayer,
    private size: { width: number; height: number },
  ) {}

  current(): SceneDef {
    const def = this.content.scenes.get(this.state.scene);
    if (!def) throw new Error(`Scène inconnue : ${this.state.scene}`);
    return def;
  }

  refresh(): void {
    this.layer.render(this.current(), this.size.width, this.size.height);
  }

  /** Affiche la scène courante sans fondu (chargement de partie). */
  show(): boolean {
    return this.markVisited();
  }

  /** Change de vue avec fondu. Renvoie true si c'est la première visite. */
  async goto(id: string): Promise<boolean> {
    if (!this.content.scenes.has(id)) {
      console.error(`goto : scène inconnue "${id}"`);
      return false;
    }
    const cam = this.scene.cameras.main;
    await new Promise<void>((resolve) => {
      cam.fadeOut(FADE_MS, 0, 0, 0);
      cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => resolve());
    });
    this.state.scene = id;
    const first = this.markVisited();
    cam.fadeIn(FADE_MS, 0, 0, 0);
    return first;
  }

  private markVisited(): boolean {
    const first = !this.state.visited.has(this.state.scene);
    this.state.visited.add(this.state.scene);
    this.state.emit(); // déclenche refresh + sauvegarde
    return first;
  }
}
