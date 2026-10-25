/**
 * Mode debug via l'URL :
 *   ?scene=labo&flags=lab_ouvert,bob_suit&items=seau,fusible   démarre directement là
 *   &debug=1                                                     contours des hotspots + état
 *   ?reset=1                                                     efface la sauvegarde
 * `scene=fin` saute directement au cliffhanger.
 * En mode debug, la sauvegarde automatique est désactivée.
 */
export interface DebugOptions {
  active: boolean;
  scene?: string;
  flags: string[];
  items: string[];
  overlay: boolean;
  reset: boolean;
}

export function parseDebug(search: string): DebugOptions {
  const q = new URLSearchParams(search);
  const list = (k: string) =>
    (q.get(k) ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  const scene = q.get('scene')?.trim() || undefined;
  return {
    active: !!scene,
    scene,
    flags: list('flags'),
    items: list('items'),
    overlay: q.has('debug') && q.get('debug') !== '0',
    reset: q.has('reset'),
  };
}
