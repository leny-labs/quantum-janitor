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
  // ch.1 Station, Acte II (docs/CHAPTER1.md §6.5) : Duplicata garde le badge (pièce justificative)
  // jusqu'à la restitution par SYLVIE (st_eclat2) ; les copies agrafées en case A ne reviennent pas
  if (state.hasFlag('st_dossier_trouve') && !state.hasFlag('st_eclat2') && state.hasItem('badge')) state.take('badge');
  if (state.hasFlag('st_case_a') && state.hasItem('copies_dossier')) state.take('copies_dossier');
  if (state.hasFlag('st_case_a') && !state.hasFlag('st_reclasse')) state.setFlag('st_reclasse');
  // la liasse part dans le bac de la photocopieuse (st_papier) et devient les copies
  if (state.hasFlag('st_papier') && state.hasItem('liasse')) state.take('liasse');
  if (state.hasFlag('st_papier') && !state.hasFlag('st_case_a') && !state.hasItem('copies_dossier')) state.give('copies_dossier');
  // Acte III : l'accord part chez PERCO avec la fin de grève ; l'encreur reste chez Tamponnet
  if (state.hasFlag('st_greve_finie') && state.hasItem('accord')) state.take('accord');
  if (state.hasFlag('st_accord_pris') && !state.hasFlag('st_greve_finie') && !state.hasItem('accord')) state.give('accord');
  if (state.hasFlag('st_tamponnet_encre') && state.hasItem('encreur')) state.take('encreur');
  if (state.hasFlag('st_encreur_pris') && !state.hasFlag('st_tamponnet_encre') && !state.hasItem('encreur')) state.give('encreur');
  // Acte IV : M. Ficus siège au Conseil, la capsule part par tube, le ticket reste chez Sabot ;
  // SYLVIE rend le badge et délivre le permis (jusqu'au décollage)
  if (state.hasFlag('st_ficus') && state.hasItem('plante')) state.take('plante');
  if (state.hasFlag('st_vote_perco') && state.hasItem('capsule')) state.take('capsule');
  if (state.hasFlag('st_amende') && state.hasItem('ticket_douane')) state.take('ticket_douane');
  if (state.hasFlag('st_eclat2') && !state.ended) {
    if (!state.hasItem('badge')) state.give('badge');
    if (!state.hasItem('permis')) state.give('permis');
  }
  // le formulaire ne quitte jamais l'inventaire avant le dépôt au guichet
  if (state.hasFlag('st_formulaire') && !state.hasFlag('st_dossier_depose') && !state.hasItem('formulaire')) state.give('formulaire');
}
