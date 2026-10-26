/**
 * Mode debug via l'URL :
 *   ?scene=labo&flags=lab_ouvert,bob_suit&items=seau,fusible   démarre directement là
 *   &debug=1                                                     contours des hotspots + état
 *   ?reset=1                                                     efface la sauvegarde
 *   ?touch=1 / ?touch=0                                          force / interdit le mode tactile
 *   ?intro=1                                                     rejoue l'intro animée même si déjà vue
 *   ?music=0 / ?music=1                                          coupe / force la musique (lu par ui/music.ts)
 * `scene=fin` saute directement au cliffhanger ; `scene=panneau` ouvre le labo cadré sur la console.
 * En mode debug, la sauvegarde automatique est désactivée.
 */
export interface DebugOptions {
  active: boolean;
  scene?: string;
  flags: string[];
  items: string[];
  overlay: boolean;
  reset: boolean;
  /** Mode tactile forcé (true) ou interdit (false) ; sinon détecté. */
  touch?: boolean;
  /** Rejouer l'intro animée même si déjà vue. */
  intro: boolean;
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
    touch: q.get('touch') === '1' ? true : q.get('touch') === '0' ? false : undefined,
    intro: q.get('intro') === '1',
  };
}
