// Logique pure (sans Phaser) : importable par les outils Node (playthrough).
import type { GameContent, Interaction } from './types';

/** Résout la combinaison objet sélectionné + objet cliqué (dans les deux sens). */
export function resolveCombine(content: GameContent, a: string, b: string): Interaction | undefined {
  return content.items.get(a)?.combine?.[b] ?? content.items.get(b)?.combine?.[a];
}
