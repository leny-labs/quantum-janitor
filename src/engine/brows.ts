// Poses de sourcils par humeur (B.O.B.), partagées par le portrait de dialogue
// (src/ui/Brows.ts) et le robot 3D (props.bob, rooms/bobvoix.ts). Pas d'import
// Phaser / Three.
import type { Mood } from './mood';

/**
 * Pose d'un sourcil, dans le repère de SON œil :
 * - `y` : décalage vertical en rayons d'œil (négatif = plus haut) ;
 * - `rot` : inclinaison en degrés, positive = bout intérieur (côté nez) relevé ;
 * - `bend` : cambrure 0..1 (0 = plaque droite, 1 = arc bien rond ; ignorée en 3D) ;
 * - `len` : longueur relative (1 = repos).
 */
export interface BrowPose {
  y: number;
  rot: number;
  bend: number;
  len: number;
}

/** Sourcils gauche / droit (gauche = à gauche de l'image). */
export interface BrowPair {
  l: BrowPose;
  r: BrowPose;
}

const both = (p: BrowPose): BrowPair => ({ l: p, r: p });

export const BROW_POSES: Readonly<Record<Mood, BrowPair>> = {
  // blasé : plaques posées sur le haut de l'œil, intérieur un peu relevé
  // (l'inclinaison des sourcils peints d'origine et des paupières 3D)
  calm: both({ y: 0, rot: 13, bend: 0, len: 1 }),
  // un sourcil haut, l'autre bas et plissé
  suspicious: { l: { y: -0.42, rot: 4, bend: 0.25, len: 1 }, r: { y: 0.16, rot: -12, bend: 0, len: 0.96 } },
  // en V : intérieurs plongés sur les yeux
  angry: both({ y: 0.14, rot: -26, bend: 0, len: 1.04 }),
  // relevés, arrondis
  love: both({ y: -0.34, rot: -2, bend: 0.85, len: 1 }),
  // très hauts, légèrement arqués
  surprised: both({ y: -0.72, rot: 4, bend: 0.55, len: 0.98 }),
  // en ^ : intérieurs relevés, extérieurs tombants
  sad: both({ y: -0.08, rot: 24, bend: 0.15, len: 1 }),
};

/** Sursaut d'accent : le sourcil monte de `ACCENT_LIFT` rayons d'œil × force. */
export const ACCENT_LIFT = 0.28;

/** Force d'accent d'un caractère frappé (0 = aucun) : « ! », « ? », début de mot en capitales. */
export function accentOf(ch: string, prev: string): number {
  if (ch === '!') return 1;
  if (ch === '?') return 0.75;
  if (/[A-ZÀ-Ý]/.test(ch) && /[\s«"(]/.test(prev || ' ')) return 0.4;
  return 0;
}
