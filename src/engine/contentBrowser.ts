// Chargement du contenu côté navigateur (inclus dans le bundle par Vite).
import { parseContent } from './content';
import type { GameContent } from './types';

const scenes = import.meta.glob('/content/scenes/*.yaml', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const ink = import.meta.glob('/content/story/*.ink', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
import items from '/content/items.yaml?raw';
import game from '/content/game.yaml?raw';

export function loadContent(): GameContent {
  return parseContent({ scenes, ink, items, game });
}
