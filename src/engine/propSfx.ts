import type { GameState } from './GameState';
import type { Hotspot } from './types';

/**
 * Bruitage d'un prop physique actionnable (docs/CHAPTERS.md, « Props interactifs physiques ») :
 * TOUT actionnement (« use ») d'un prop physique joue un son, même au réappui, hors tension
 * ou refusé — jamais silencieux.
 *
 * - `click` petit bouton · `clonk` gros bouton · `lever` levier · `beep` écran tactile
 * - `dud` clic dans le vide (hors tension, refusé) · `none` : pas de son
 */
export const PROP_SFX = ['click', 'clonk', 'lever', 'beep', 'dud', 'none'] as const;
export type PropSfx = (typeof PROP_SFX)[number];

/** Geste 3D éventuellement joué par le décor (three/press.ts). */
export type PressGesture = 'button' | 'lever' | null | undefined;

/**
 * Son à jouer au « use » du hotspot `h`, ou `null`. Priorité :
 * `sfxDud` vrai → `dud` ; sinon `sfx:` du YAML ; sinon défaut d'après le mesh
 * `pressable` (levier → `lever`, bouton → `click`) ou le picto `press` (→ `click`).
 */
export function propSfx(h: Hotspot, state: Pick<GameState, 'check'>, gesture?: PressGesture): Exclude<PropSfx, 'none'> | null {
  if (h.sfx === 'none') return null;
  if (h.sfxDud && state.check(h.sfxDud)) return 'dud';
  if (h.sfx) return h.sfx;
  if (gesture === 'lever') return 'lever';
  if (gesture === 'button' || h.useIcon === 'press') return 'click';
  return null;
}
