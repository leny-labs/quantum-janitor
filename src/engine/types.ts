// Types du contenu (YAML) et de l'état de jeu. Aucun import Phaser ici :
// ce fichier est partagé avec tools/validate-content.ts.

export type Rect = [x: number, y: number, w: number, h: number];

/** Condition évaluée sur l'état. Tous les critères doivent être vrais. */
export interface Condition {
  flags?: string[];
  notFlags?: string[];
  items?: string[];
  notItems?: string[];
}

/**
 * Une étape d'interaction. Plusieurs clés peuvent coexister ; elles sont
 * exécutées dans l'ordre : say → dialogue → take → give → unset → set → shake → goto → end.
 * Si `if` est faux, l'étape est ignorée. `stop: true` interrompt la séquence.
 */
export interface Action {
  if?: Condition;
  say?: string;
  dialogue?: string;
  take?: string;
  give?: string;
  unset?: string;
  set?: string;
  shake?: boolean;
  goto?: string;
  end?: string;
  stop?: boolean;
}

/** Une chaîne seule = raccourci pour `[{ say: "..." }]`. */
export type Interaction = string | Action[];

export interface ArtShape {
  if?: Condition;
  rect?: Rect;
  circle?: [x: number, y: number, r: number];
  text?: string;
  at?: [x: number, y: number];
  color?: string;
  stroke?: string;
  alpha?: number;
  size?: number;
}

export interface Hotspot {
  id: string;
  label: string;
  rect: Rect;
  if?: Condition;
  art?: ArtShape[];
  look?: Interaction;
  use?: Interaction;
  /** Libellé du verbe « utiliser » (ex. « Prendre », « Appuyer »). */
  useLabel?: string;
  talk?: Interaction;
  /** Utiliser un objet de l'inventaire sur ce hotspot : clé = id d'objet. */
  useItem?: Record<string, Interaction>;
  /** Réponse si l'objet utilisé n'a pas d'entrée dans useItem. */
  useItemDefault?: Interaction;
}

export type ExitDirection = 'left' | 'right' | 'up' | 'down';

export interface Exit {
  id: string;
  label: string;
  to: string;
  rect: Rect;
  dir?: ExitDirection;
  if?: Condition;
  /** Si la condition n'est pas remplie, la sortie est verrouillée. */
  requires?: Condition;
  lockedText?: Interaction;
}

export interface SceneDef {
  id: string;
  title: string;
  background: string;
  art?: ArtShape[];
  onFirstEnter?: Interaction;
  onEnter?: Interaction;
  hotspots?: Hotspot[];
  exits?: Exit[];
}

export interface ItemDef {
  id: string;
  name: string;
  icon: { color: string; glyph: string };
  look: Interaction;
  /** Combiner cet objet (sélectionné) avec un autre objet de l'inventaire. */
  combine?: Record<string, Interaction>;
}

export interface CharacterDef {
  id: string;
  name: string;
  color: string;
  /** Texte affiché dans le portrait placeholder (vide = pas de portrait). */
  portrait?: string;
}

export interface GameContent {
  scenes: Map<string, SceneDef>;
  items: Map<string, ItemDef>;
  characters: Map<string, CharacterDef>;
  startScene: string;
  inkSource: string;
}

export interface SaveData {
  version: number;
  scene: string;
  flags: string[];
  items: string[];
  visited: string[];
  ended: boolean;
  inkState?: string;
}
