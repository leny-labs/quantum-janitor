import type Phaser from 'phaser';
import { getSession } from '../session';

/** Durée de l'appui long (tactile) qui ouvre le verb coin. */
export const LONG_PRESS_MS = 400;

const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

/**
 * Mode tactile : `?touch=1|0` force, sinon le pointeur de l'événement
 * (`wasTouch`), sinon le pointeur principal de l'appareil (coarse).
 * Pas de test de largeur : une tablette avec souris reste « PC ».
 */
export function isTouch(p?: Phaser.Input.Pointer): boolean {
  const forced = getSession().debug.touch;
  if (forced !== undefined) return forced;
  return p ? p.wasTouch : coarse;
}

/** Taille en px de jeu correspondant à `css` px CSS à l'écran (canvas mis à l'échelle). */
export function cssToGame(scene: Phaser.Scene, css: number): number {
  return css * scene.scale.displayScale.x;
}
