/**
 * Mode debug via l'URL :
 *   ?scene=labo&flags=lab_ouvert,bob_suit&items=seau,fusible   démarre directement là
 *   &debug=1                                                     contours des hotspots + état
 *   ?reset=1                                                     efface la sauvegarde
 *   ?touch=1 / ?touch=0                                          force / interdit le mode tactile
 *   ?intro=1                                                     rejoue l'intro animée même si déjà vue
 *   ?music=0 / ?music=1                                          coupe / force la musique (lu par ui/music.ts)
 *   ?scene=couloir&shot=distributeur                            caméra déjà rapprochée sur un hotspot (travel d'examen)
 *   ?scene=couloir&cine=1                                       rejoue le plan d'arrivée de la pièce (push-in sur le distributeur)
 *   ?scene=couloir&items=serpilliere                            mini-jeu du manche : utiliser la serpillière sur le distributeur
 *   ?scene=couloir&flags=serpilliere_mouillee&items=serpilliere  frottage animé : serpillière sur le lecteur de badge
 *   ?scene=couloir&flags=lecteur_propre&items=badge             badge sur le lecteur : bip, LED verte, porte du labo qui s'escamote
 *   ?scene=placard&items=sandwich                               sandwich à B.O.B. : aspiré, puis recraché avec le badge (# shake)
 *   ?scene=couloir&flags=sait_fusible                           « Prendre le fusible » : étincelles, le néon du circuit 7B hoquette et meurt
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
  /** Travel d'examen à ouvrir d'emblée (id de hotspot de la scène de départ). */
  shot?: string;
  /** Rejouer le plan d'arrivée (onFirstEnter filmé) de la scène de départ. */
  cine: boolean;
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
    shot: q.get('shot')?.trim() || undefined,
    cine: q.get('cine') === '1',
  };
}
