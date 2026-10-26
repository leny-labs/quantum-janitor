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
    /** Affiche la pièce 3D de la scène ; renvoie false s'il n'y en a pas (rendu 2D). */
    private show3d: (def: SceneDef) => boolean = () => false,
    /** Travel caméra entre deux vues du même décor 3D (sinon null → fondu). */
    private travel: (from: string, to: string) => Promise<void> | null = () => null,
  ) {}

  current(): SceneDef {
    const def = this.content.scenes.get(this.state.scene);
    if (!def) throw new Error(`Scène inconnue : ${this.state.scene}`);
    return def;
  }

  refresh(): void {
    const def = this.current();
    this.layer.render(def, this.size.width, this.size.height, this.show3d(def));
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
    const move = this.travel(this.state.scene, id);
    if (move) {
      // gros plan ⇄ pièce : la caméra 3D voyage, les hotspots s'effacent le temps du trajet
      this.spots(false);
      await move;
      this.state.scene = id;
      const first = this.markVisited();
      this.spots(true);
      return first;
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

  /**
   * Hotspots et flèches : fondu de sortie (pendant un travel caméra, ils ne
   * sont plus alignés) ou d'entrée à l'arrivée — pas d'apparition sèche.
   */
  spots(show: boolean, instant = false): void {
    const c = this.layer.container;
    this.scene.tweens.killTweensOf(c);
    if (instant) {
      c.setVisible(show).setAlpha(1);
      return;
    }
    if (show) {
      if (!c.visible) c.setAlpha(0).setVisible(true);
      this.scene.tweens.add({ targets: c, alpha: 1, duration: 260, ease: 'Quad.easeOut' });
    } else {
      this.scene.tweens.add({ targets: c, alpha: 0, duration: 140, ease: 'Quad.easeIn', onComplete: () => c.setVisible(false).setAlpha(1) });
    }
  }

  private markVisited(): boolean {
    const first = !this.state.visited.has(this.state.scene);
    this.state.visited.add(this.state.scene);
    this.state.emit(); // déclenche refresh + sauvegarde
    return first;
  }
}
