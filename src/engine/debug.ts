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
 *   ?scene=placard&items=seau,serpilliere                       serpillière sur le seau (inventaire) : plouf et gerbe de gouttes
 *   ?resume=1                                                   reprend directement la sauvegarde (page /creator), sans écran titre
 *   ?scene=fin&roach2d=0                                        plan de fin avec l'ancienne Reine / cour en 3D procédural (défaut : sprites GenAI)
 *   ?chapter=0                                                  nouvelle partie du chapitre 0 « Le Seau » (Klepsydra puis Blattaria)
 *   ?chapter=0&act=blattaria                                    nouvelle partie du ch.0 directement à l'acte II (carte d'acte, intro du Nid)
 *   ?chapter=1                                                  nouvelle partie du chapitre 1 « La Station Bureaucratique » (sauvegarde active)
 *   ?scene=nid-royal&chapter=0&flags=ch1,chapitre0_termine&items=serpilliere,badge   debug acte Blattaria
 *   ?scene=fin&chapter=0                                        fin du ch.0 (couronnement / faille → bouton « Chapitre 1 → »)
 *   ?scene=st-sas&chapter=1&flags=st,ch0_termine,combi_portee&items=badge,fragment   debug Station
 * Anciens liens : `?scene=<pièce Blattaria>&chapter=1` (Blattaria était le ch.1) → alias ch.0.
 * Numérotation : docs/CHAPTERS.md (`ch1-*` / `ch1_*` = acte Blattaria du ch.0, préfixe historique).
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
  /** Reprendre la sauvegarde sans passer par l'écran titre (sauvegarde active). */
  resume: boolean;
  /** Chapitre (`?chapter=1` ou `ch1`) : nouvelle partie de ce chapitre, ou contexte du mode debug. */
  chapter?: string;
  /** Acte de départ d'une nouvelle partie (`?chapter=0&act=blattaria`). */
  act?: string;
}

export function parseDebug(search: string): DebugOptions {
  const q = new URLSearchParams(search);
  const list = (k: string) =>
    (q.get(k) ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  const scene = q.get('scene')?.trim() || undefined;
  const ch = q.get('chapter')?.trim();
  let chapter = ch ? (/^\d+$/.test(ch) ? `ch${ch}` : ch) : undefined;
  // ancien lien Blattaria (`chapter=1` avant la fusion) : ni Station (`st-*`), ni interlude, ni fin
  if (chapter === 'ch1' && scene && scene !== 'fin' && !/^(st-|interlude-)/.test(scene)) chapter = 'ch0';
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
    resume: q.get('resume') === '1',
    chapter,
    act: q.get('act')?.trim() || undefined,
  };
}
