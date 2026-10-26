// Logique pure (sans Phaser) : invariants de l'état, réparés au chargement
// d'une sauvegarde et en fin des séquences qui peuvent être interrompues.
import type { GameState } from './GameState';

/**
 * Sandwich tombé du distributeur et plus dans l'inventaire = B.O.B. l'a
 * mangé : le badge doit être rendu. Le dialogue `bob_sandwich` retire le
 * sandwich plusieurs répliques avant de donner le badge ; une sauvegarde
 * prise entre les deux (rechargement, sortie en plein repas) bloquerait la
 * partie.
 */
export function repairState(state: GameState): void {
  if (state.hasFlag('sandwich_tombe') && !state.hasItem('sandwich') && !state.hasItem('badge')) {
    state.give('badge');
    if (!state.hasFlag('bob_suit')) state.setFlag('bob_suit');
  }
}
