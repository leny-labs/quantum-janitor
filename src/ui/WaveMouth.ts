// Bouche-onde procédurale d'un portrait-planche (SYLVIE, B.O.B.) : une polyligne cyan
// lumineuse dessinée par-dessus la planche (PORTRAIT_WAVES dans Studio.ts),
// façon B.O.B. / Bender. Au repos, un signal plat qui ondule à peine ; quand
// le personnage parle, des amplitudes qui bougent. L'humeur change le tracé.
import Phaser from 'phaser';
import type { Mood } from '../engine/mood';
import { PORTRAIT_WAVES, type PortraitWave } from '../three/Studio';
import { WAVE_CORE, WAVE_GLOW, wavePoints } from './waveShape';

export const waveFor = (id: string): PortraitWave | null => PORTRAIT_WAVES[id] ?? null;

export class WaveMouth {
  readonly g: Phaser.GameObjects.Graphics;
  private left = 0;
  private top = 0;
  private k = 1;
  private t = Math.random() * 10;
  /** Amplitude lissée (0 = repos, 1 = parole) : pas de saut talk ↔ idle. */
  private level = 0;
  private mood: Mood = 'calm';

  constructor(
    scene: Phaser.Scene,
    private def: PortraitWave,
  ) {
    this.g = scene.add.graphics();
  }

  /** Pose l'onde sur une cellule de planche de `cellPx` px, coin haut-gauche en (`left`, `top`). */
  place(left: number, top: number, cellPx: number): this {
    this.left = left;
    this.top = top;
    this.k = cellPx / this.def.cell;
    this.draw();
    return this;
  }

  setMood(mood: Mood): void {
    this.mood = mood;
  }

  update(dt: number, talking: boolean): void {
    this.t += dt / 1000;
    const target = talking ? 1 : 0;
    this.level += (target - this.level) * Math.min(1, dt / (talking ? 60 : 160));
    this.draw();
  }

  private draw(): void {
    const k = this.k;
    const pts = wavePoints(this.def, this.mood, this.t, this.level).map((p) => new Phaser.Math.Vector2(this.left + p.x * k, this.top + p.y * k));
    const g = this.g;
    const glow = this.def.color ?? WAVE_GLOW;
    const core = this.def.core ?? WAVE_CORE;
    const w = k * (this.def.thick ?? 1);
    g.clear();
    // halo, lueur, cœur
    g.lineStyle(9 * w, glow, 0.12);
    g.strokePoints(pts);
    g.lineStyle(5 * w, glow, 0.3);
    g.strokePoints(pts);
    g.lineStyle(2.4 * w, glow, 0.95);
    g.strokePoints(pts);
    g.lineStyle(1 * w, core, 0.9);
    g.strokePoints(pts);
  }
}
