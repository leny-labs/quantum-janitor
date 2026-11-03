// Migration des sauvegardes (pure, partagée jeu / /creator / outils). Voir docs/CHAPTERS.md §3.3.
import type { SaveData } from './types';

/** Version courante du format de sauvegarde. */
export const SAVE_VERSION = 2;

/**
 * v1 → v2 (fusion ch.0 + Blattaria) : en v1, `chapter: 'ch1'` désignait Blattaria Prime,
 * devenu l'acte II du ch.0 (scènes `ch1-*` / `nid-royal` et flags `ch1_*` inchangés) ;
 * `chapitre1_termine` (fin de Blattaria) devient `ch0_termine`. Une v2 avec `chapter: 'ch1'`
 * est une partie Station : on ne la touche pas. Renvoie null si le format est inconnu.
 */
export function migrateSave(raw: unknown): SaveData | null {
  const d = raw as SaveData | null;
  if (!d || typeof d !== 'object' || typeof d.scene !== 'string' || !Array.isArray(d.flags) || !Array.isArray(d.items)) return null;
  if (d.version === SAVE_VERSION) return d;
  if (d.version !== 1) return null;
  const flags = d.flags.map((f) => (f === 'chapitre1_termine' ? 'ch0_termine' : f));
  const { chapter, ...rest } = d;
  return {
    ...rest,
    version: SAVE_VERSION,
    flags: [...new Set(flags)],
    visited: Array.isArray(d.visited) ? d.visited : [],
    ...(chapter && chapter !== 'ch1' ? { chapter } : chapter === 'ch1' ? { chapter: 'ch0' } : {}),
  };
}
