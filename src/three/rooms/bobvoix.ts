// B.O.B. parle en salle : quand une réplique « bob: » s'écrit, l'écran-grille
// de sa bouche s'allume et l'onde danse façon Bender (setFace de props.bob),
// le corps rebondit en squash & stretch sur les syllabes. Plaque B.O.B. de
// retour quand il se tait. Ses sourcils prennent la pose de l'humeur de la
// réplique (engine/brows.ts, mêmes poses que le portrait), sursautent un peu
// sur les syllabes, et reviennent au calme quand il se tait.
// La scène Phaser appelle talk() / hush().
import * as THREE from 'three';
import { BROW_POSES, type BrowPair, type BrowPose } from '../../engine/brows';
import type { Mood } from '../../engine/mood';
import { setFace } from '../props';
import type { Stage } from '../Stage';

const copy = (p: BrowPair): BrowPair => ({ l: { ...p.l }, r: { ...p.r } });
/** Rapproche `p` de `to` (lissage exponentiel). */
function ease(p: BrowPose, to: BrowPose, k: number): void {
  p.y += (to.y - p.y) * k;
  p.rot += (to.rot - p.rot) * k;
  p.bend += (to.bend - p.bend) * k;
  p.len += (to.len - p.len) * k;
}

export class BobVoice {
  /** Temps de parole restant (s) : la frappe de la réplique. */
  private left = 0;
  /** Dose de parole lissée (0 → 1). */
  private amount = 0;
  private live = false;
  /** Humeur de la réplique en cours (calm hors réplique) et pose courante des sourcils. */
  private mood: Mood = 'calm';
  private brows: BrowPair = copy(BROW_POSES.calm);

  constructor(
    stage: Stage,
    private robot: THREE.Object3D,
  ) {
    stage.animate((t, dt) => this.tick(t, dt));
  }

  /** B.O.B. parle pendant `seconds`, sur l'humeur `mood` (gardée jusqu'à hush). */
  talk(seconds: number, mood: Mood = 'calm'): void {
    this.left = seconds;
    this.mood = mood;
  }

  /** Réplique passée : il se tait, sourcils au calme. */
  hush(): void {
    this.left = 0;
    this.mood = 'calm';
  }

  private tick(t: number, dt: number): void {
    const robot = this.robot;
    this.left = Math.max(0, this.left - dt);
    this.amount += ((this.left > 0 ? 1 : 0) - this.amount) * Math.min(1, dt * 12);
    // sourcils : vers la pose de l'humeur, petits sursauts sur les syllabes
    const to = BROW_POSES[this.mood];
    const k = Math.min(1, dt * 10);
    ease(this.brows.l, to.l, k);
    ease(this.brows.r, to.r, k);
    const syl = Math.abs(Math.sin(t * 13) * Math.sin(t * 7.3 + 1));
    (robot.userData.setBrows as ((p: BrowPair, lift?: number) => void) | undefined)?.(this.brows, -0.14 * syl * syl * this.amount);
    if (this.amount < 0.01) {
      if (!this.live) return;
      this.live = false;
      (robot.userData.restFace as (() => void) | undefined)?.();
      if (!robot.userData.anim) robot.scale.set(1, 1, 1);
      robot.rotation.x = 0;
      return;
    }
    this.live = true;
    // syllabes : deux sinus désaccordés, jamais tout à fait plat (syl, plus haut)
    setFace(robot, { mouth: Math.max(0.05, this.amount * (0.3 + 0.7 * syl)), blink: false, phase: t * 6 });
    // le repas de B.O.B. (BobRig) a la main sur l'échelle pendant ses phases
    if (!robot.userData.anim) {
      const b = syl * this.amount;
      robot.scale.set(1 - b * 0.035, 1 + b * 0.1, 1 - b * 0.035);
    }
    robot.rotation.x = Math.sin(t * 4.5) * 0.035 * this.amount;
  }
}
