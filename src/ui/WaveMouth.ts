// Bouche-onde procédurale d'un portrait-planche (SYLVIE) : une polyligne cyan
// lumineuse dessinée par-dessus la planche (PORTRAIT_WAVES dans Studio.ts),
// façon B.O.B. / Bender. Au repos, un signal plat qui ondule à peine ; quand
// le personnage parle, des amplitudes qui bougent. L'humeur change le tracé.
import Phaser from 'phaser';
import type { Mood } from '../engine/mood';
import { PORTRAIT_WAVES, type PortraitWave } from '../three/Studio';

/** Fréquence (crêtes sur la largeur), vitesse, dents de scie (0 = sinus doux). */
const FLAVOR: Record<Mood, { freq: number; speed: number; jag: number }> = {
  calm: { freq: 11, speed: 1, jag: 0.6 },
  suspicious: { freq: 8, speed: 0.6, jag: 0.4 },
  angry: { freq: 15, speed: 1.7, jag: 1 },
  love: { freq: 6, speed: 0.8, jag: 0 },
};

const POINTS = 72;
const CYAN = 0x7fffd4;
const CORE = 0xe8fffa;

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
    const { x0, x1, y, amp } = this.def;
    const f = FLAVOR[this.mood];
    const t = this.t * f.speed;
    // enveloppe de parole : syllabes (deux sinus décalés) + un peu de bruit
    const speech = this.level * (0.35 + 0.65 * Math.abs(Math.sin(t * 7.3) * Math.sin(t * 3.1 + 1.3))) * (0.85 + Math.random() * 0.15);
    const rest = 0.09 + 0.04 * Math.sin(t * 1.7);
    const a = Math.max(rest, speech) * amp;
    const pts: Phaser.Math.Vector2[] = [];
    for (let i = 0; i <= POINTS; i++) {
      const u = i / POINTS;
      // bouts plats (comme la planche de ref), crêtes au milieu
      const win = Phaser.Math.SmoothStep(u, 0.04, 0.2) * (1 - Phaser.Math.SmoothStep(u, 0.8, 0.96));
      const ph = u * Math.PI * 2 * f.freq - t * 9;
      const sine = Math.sin(ph);
      // dents de scie : on pousse le sinus vers un triangle pointu
      const saw = (2 / Math.PI) * Math.asin(sine);
      const wave = sine * (1 - f.jag) + saw * f.jag;
      // relief qui voyage (une crête plus haute, comme le pic de la ref)
      const bump = 0.55 + 0.45 * Math.sin(u * Math.PI * 2 * 1.3 - t * 2.2);
      pts.push(new Phaser.Math.Vector2(this.left + (x0 + (x1 - x0) * u) * this.k, this.top + (y - wave * bump * win * a) * this.k));
    }
    const g = this.g;
    const k = this.k;
    g.clear();
    // halo, lueur, cœur
    g.lineStyle(9 * k, CYAN, 0.12);
    g.strokePoints(pts);
    g.lineStyle(5 * k, CYAN, 0.3);
    g.strokePoints(pts);
    g.lineStyle(2.4 * k, CYAN, 0.95);
    g.strokePoints(pts);
    g.lineStyle(1 * k, CORE, 0.9);
    g.strokePoints(pts);
  }
}
