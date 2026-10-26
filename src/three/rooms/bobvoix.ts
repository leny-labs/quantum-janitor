// B.O.B. parle en salle : quand une réplique « bob: » s'écrit, l'écran-grille
// de sa bouche s'allume et l'onde danse façon Bender (setFace de props.bob),
// le corps rebondit en squash & stretch sur les syllabes. Plaque B.O.B. de
// retour quand il se tait. La scène Phaser appelle talk() / hush().
import * as THREE from 'three';
import { setFace } from '../props';
import type { Stage } from '../Stage';

export class BobVoice {
  /** Temps de parole restant (s) : la frappe de la réplique. */
  private left = 0;
  /** Dose de parole lissée (0 → 1). */
  private amount = 0;
  private live = false;

  constructor(
    stage: Stage,
    private robot: THREE.Object3D,
  ) {
    stage.animate((t, dt) => this.tick(t, dt));
  }

  /** B.O.B. parle pendant `seconds`. */
  talk(seconds: number): void {
    this.left = seconds;
  }

  /** Réplique passée : il se tait. */
  hush(): void {
    this.left = 0;
  }

  private tick(t: number, dt: number): void {
    const robot = this.robot;
    this.left = Math.max(0, this.left - dt);
    this.amount += ((this.left > 0 ? 1 : 0) - this.amount) * Math.min(1, dt * 12);
    if (this.amount < 0.01) {
      if (!this.live) return;
      this.live = false;
      (robot.userData.restFace as (() => void) | undefined)?.();
      if (!robot.userData.anim) robot.scale.set(1, 1, 1);
      robot.rotation.x = 0;
      return;
    }
    this.live = true;
    // syllabes : deux sinus désaccordés, jamais tout à fait plat
    const syl = Math.abs(Math.sin(t * 13) * Math.sin(t * 7.3 + 1));
    setFace(robot, { mouth: Math.max(0.05, this.amount * (0.3 + 0.7 * syl)), blink: false, phase: t * 6 });
    // le repas de B.O.B. (BobRig) a la main sur l'échelle pendant ses phases
    if (!robot.userData.anim) {
      const b = syl * this.amount;
      robot.scale.set(1 - b * 0.035, 1 + b * 0.1, 1 - b * 0.035);
    }
    robot.rotation.x = Math.sin(t * 4.5) * 0.035 * this.amount;
  }
}
