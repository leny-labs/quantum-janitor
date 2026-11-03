// Logique pure (sans Phaser) : invariants de l'état, réparés au chargement
// d'une sauvegarde et en fin des séquences qui peuvent être interrompues.
// Préfixe `ch1_` = acte Blattaria du chapitre 0 (historique, docs/CHAPTERS.md) ; la Station
// (nouveau ch.1) utilise `st_*`.
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
  // ch.1 : `ch1_josiane` fait tomber l'éclat plusieurs répliques avant que Josiane reste coincée
  if (state.hasFlag('ch1_eclat_tombe') && !state.hasFlag('ch1_josiane_coincee')) state.setFlag('ch1_josiane_coincee');
  if (state.hasFlag('ch1_josiane_coincee') && state.hasItem('serpilliere')) state.take('serpilliere');
  // `ch1_plouf` stabilise l'éclat, le donne, puis le seau reste au Temple : jamais d'éclat
  // manquant, jamais de seau revenu dans l'inventaire
  if (state.hasFlag('ch1_eclat_stabilise') && !state.hasItem('fragment') && !state.ended) state.give('fragment');
  if (state.hasFlag('ch1_eclat_stabilise') && !state.hasFlag('ch1_seau_perdu')) state.setFlag('ch1_seau_perdu');
  if (state.hasFlag('ch1_seau_perdu') && state.hasItem('seau')) state.take('seau');
  // `ch1_couronnement` remet la combi avant la fin (jusqu'à ce qu'elle soit enfilée dans l'interlude)
  if (state.hasFlag('ch1_combi') && !state.hasItem('combi_chitine') && !state.hasFlag('combi_portee')) state.give('combi_chitine');
}
