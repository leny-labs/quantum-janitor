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

/**
 * Taille d'un élément de HUD : `game` px de jeu à la souris ; au doigt, au
 * moins `css` px CSS à l'écran (l'équivalent d'un `max(game, css)` en unités
 * d'écran, puisque le canvas 1280×720 est mis à l'échelle).
 */
export function uiPx(scene: Phaser.Scene, game: number, css: number): number {
  return isTouch() ? Math.max(game, Math.round(cssToGame(scene, css))) : game;
}

/** Taille minimale d'une cible tactile (px CSS). */
export const TOUCH_TARGET_CSS = 48;
