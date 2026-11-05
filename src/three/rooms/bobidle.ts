// B.O.B. au repos (branché une fois pour toutes les salles par rooms/bobspot.ts) :
// il ne se fige plus quand on ne le sollicite pas. Style dépressif, lent, jamais nerveux :
// - clignements irréguliers (parfois doublés), via userData.eyes (scale.y) — sans setFace,
//   qui basculerait sur l'écran-onde et cacherait la plaque « B.O.B. » ;
// - micro-respiration : squash & stretch ±1,5 % sur Y (X/Z compensés), autour du pied
//   (origine du groupe au sol) : position et rotation intactes, hotspot et yeux HUD alignés ;
// - pointe d'antenne qui pulse doucement (échelle locale, base sauvée) ;
// - de loin en loin un soupir : sourcils qui s'affaissent un peu vers `sad` puis reviennent,
//   respiration plus ample le temps du soupir.
// Priorités : BobVoice parle → on ne touche à rien (il pilote échelle, rotation, visage,
// sourcils). Un rig de cinématique tient userData.anim (bobrepas, bobaspire) → on ne
// touche ni l'échelle, ni les yeux, ni l'antenne. Les sourcils passent toujours par
// BobVoice : on lui propose seulement une pose de repos (userData.idleBrows).
import * as THREE from 'three';
import { BROW_POSES, type BrowPair, type BrowPose } from '../../engine/brows';
import type { Stage } from '../Stage';
import type { BobVoice } from './bobvoix';

/** Respiration : période (s) et amplitude sur Y. */
const BREATH_PERIOD = 4.6;
const BREATH_AMP = 0.015;
/** Clignement : durée (s) d'un aller-retour paupière, intervalle aléatoire entre deux. */
const BLINK_TIME = 0.17;
const BLINK_GAP: [number, number] = [2.2, 6.5];
/** Soupir : durée (s), intervalle aléatoire, part de la pose `sad` atteinte au plus bas. */
const SIGH_TIME = 3.6;
const SIGH_GAP: [number, number] = [9, 17];
const SIGH_DEPTH = 0.5;

const rand = ([a, b]: [number, number]) => a + Math.random() * (b - a);
const mixPose = (a: BrowPose, b: BrowPose, k: number): BrowPose => ({
  y: a.y + (b.y - a.y) * k,
  rot: a.rot + (b.rot - a.rot) * k,
  bend: a.bend + (b.bend - a.bend) * k,
  len: a.len + (b.len - a.len) * k,
});

export class BobIdle {
  private eyes: THREE.Object3D[];
  private tip: THREE.Object3D | undefined;
  private tipBase: THREE.Vector3;
  /** Prochain clignement dans… (s) ; temps écoulé du clignement en cours (< 0 : aucun). */
  private blinkIn = rand(BLINK_GAP) * 0.5;
  private blinkT = -1;
  /** Clignements restant à enchaîner (double clignement). */
  private blinkMore = 0;
  private sighIn = rand(SIGH_GAP);
  private sighT = -1;
  /** Phase de respiration (avance seulement au repos : pas de saut à la reprise). */
  private breath = 0;
  /** Vrai si l'idle a la main sur l'échelle / les yeux à l'image précédente. */
  private owned = false;

  constructor(
    stage: Stage,
    private robot: THREE.Object3D,
    private voice: BobVoice,
  ) {
    this.eyes = (robot.userData.eyes as THREE.Object3D[] | undefined) ?? [];
    this.tip = robot.userData.tip as THREE.Object3D | undefined;
    this.tipBase = this.tip ? this.tip.scale.clone() : new THREE.Vector3(1, 1, 1);
    stage.animate((t, dt) => this.tick(t, dt));
  }

  private tick(t: number, dt: number): void {
    dt = Math.min(dt, 0.1);
    const robot = this.robot;
    // soupir : avance même pendant la parole (BobVoice ignore idleBrows tant qu'il parle)
    this.stepSigh(dt);
    if (this.voice.talking || robot.userData.anim) {
      // la main est ailleurs : on lâche tout, sans rien écrire
      this.blinkT = -1;
      this.blinkMore = 0;
      this.owned = false;
      return;
    }
    if (!this.owned) {
      // reprise : un blanc avant le prochain clignement, pas de clin d'œil immédiat
      this.blinkIn = Math.max(this.blinkIn, 0.8);
      this.owned = true;
    }
    const sigh = this.sighK();
    // respiration : lente, plus ample (et plus lente) pendant le soupir
    this.breath += (dt * Math.PI * 2) / (BREATH_PERIOD * (1 + 0.4 * sigh));
    const b = Math.sin(this.breath) * BREATH_AMP * (1 + 1.2 * sigh);
    robot.scale.set(1 - b * 0.5, 1 + b, 1 - b * 0.5);
    // clignements
    this.stepBlink(dt);
    const lid = this.blinkT < 0 ? 0 : Math.sin(Math.PI * Math.min(1, this.blinkT / BLINK_TIME));
    for (const e of this.eyes) e.scale.y = 1 - 0.82 * lid;
    // antenne : pulsation douce, un battement tous les ~2,6 s, plus faible quand il soupire
    if (this.tip) {
      const p = Math.pow(0.5 + 0.5 * Math.sin(t * 2.4), 3);
      this.tip.scale.copy(this.tipBase).multiplyScalar(1 + 0.22 * p * (1 - 0.6 * sigh));
      this.tip.visible = true;
    }
  }

  private stepBlink(dt: number): void {
    if (this.blinkT >= 0) {
      this.blinkT += dt;
      if (this.blinkT < BLINK_TIME) return;
      this.blinkT = -1;
      if (this.blinkMore > 0) {
        this.blinkMore--;
        this.blinkIn = 0.12;
      } else this.blinkIn = rand(BLINK_GAP);
      return;
    }
    this.blinkIn -= dt;
    if (this.blinkIn > 0) return;
    this.blinkT = 0;
    // un sur cinq : double clignement (paupières lourdes)
    if (Math.random() < 0.2) this.blinkMore = 1;
  }

  private stepSigh(dt: number): void {
    if (this.sighT >= 0) {
      this.sighT += dt;
      if (this.sighT >= SIGH_TIME) {
        this.sighT = -1;
        this.sighIn = rand(SIGH_GAP);
      }
    } else if ((this.sighIn -= dt) <= 0) this.sighT = 0;
    const k = this.sighK() * SIGH_DEPTH;
    const calm = BROW_POSES.calm;
    const sad = BROW_POSES.sad;
    const pose: BrowPair = { l: mixPose(calm.l, sad.l, k), r: mixPose(calm.r, sad.r, k) };
    this.robot.userData.idleBrows = pose;
  }

  /** Profondeur du soupir 0 → 1 → 0 (cloche lisse). */
  private sighK(): number {
    if (this.sighT < 0) return 0;
    const s = Math.sin(Math.PI * (this.sighT / SIGH_TIME));
    return s * s;
  }
}
