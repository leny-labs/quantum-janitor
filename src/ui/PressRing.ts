import Phaser from 'phaser';
import { cssToGame, LONG_PRESS_MS } from './input';
import { COLORS, hex } from './theme';

/** Distance (px CSS) au-delà de laquelle un appui devient un glissé annulé. */
const SLOP_CSS = 12;

/**
 * Appui tactile : tap court → `onTap` au relâché ; maintenu LONG_PRESS_MS →
 * `onLong`, avec un anneau de progression autour du doigt (assez large pour
 * dépasser de la pulpe). Glisser annule.
 */
export class PressRing {
  private g: Phaser.GameObjects.Graphics;
  private tween: Phaser.Tweens.Tween;
  private timer: number;
  private done = false;
  private readonly offMove: (p: Phaser.Input.Pointer) => void;
  private readonly offUp: () => void;

  constructor(
    private scene: Phaser.Scene,
    private x: number,
    private y: number,
    onTap: () => void,
    onLong: () => void,
  ) {
    const t0 = performance.now();
    const radius = Math.max(40, cssToGame(scene, 34));
    this.g = scene.add.graphics({ x, y }).setDepth(860);
    const prog = { k: 0 };
    this.tween = scene.tweens.add({
      targets: prog,
      k: 1,
      duration: LONG_PRESS_MS - 90,
      // l'anneau n'apparaît qu'après un court délai : un tap ne clignote pas
      delay: 90,
      onUpdate: () => this.draw(radius, prog.k),
    });
    // horloge réelle (setTimeout) : le temps de jeu Phaser peut traîner
    this.timer = window.setTimeout(() => {
      if (this.done || !scene.sys.isActive()) return;
      this.finish();
      onLong();
    }, LONG_PRESS_MS);
    const slop = cssToGame(scene, SLOP_CSS);
    this.offMove = (p) => {
      if (p.isDown && Phaser.Math.Distance.Between(p.x, p.y, this.x, this.y) > slop) this.cancel();
    };
    this.offUp = () => {
      if (this.done) return;
      this.finish();
      if (performance.now() - t0 >= LONG_PRESS_MS) onLong();
      else onTap();
    };
    scene.input.on('pointermove', this.offMove);
    scene.input.once('pointerup', this.offUp);
  }

  get active(): boolean {
    return !this.done;
  }

  cancel(): void {
    this.finish();
  }

  private draw(radius: number, k: number): void {
    const g = this.g;
    g.clear();
    g.lineStyle(7, COLORS.ink, 0.55);
    g.strokeCircle(0, 0, radius);
    g.lineStyle(4, hex(COLORS.hover), 0.95);
    g.beginPath();
    g.arc(0, 0, radius, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2);
    g.strokePath();
  }

  private finish(): void {
    if (this.done) return;
    this.done = true;
    window.clearTimeout(this.timer);
    this.tween.stop();
    this.scene.input.off('pointermove', this.offMove);
    this.scene.input.off('pointerup', this.offUp);
    const g = this.g;
    this.scene.tweens.add({ targets: g, alpha: 0, scale: 1.25, duration: 120, onComplete: () => g.destroy() });
  }
}
