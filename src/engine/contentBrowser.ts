// Chargement du contenu côté navigateur (inclus dans le bundle par Vite).
import { lang } from '../i18n';
import { parseContent } from './content';
import { localizeContent, parseCatalog } from './localize';
import type { GameContent } from './types';

const scenes = import.meta.glob('/content/scenes/*.yaml', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const ink = import.meta.glob('/content/story/*.ink', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
/** Catalogues de traduction du contenu : /content/locales/<lang>.yaml. */
const locales = import.meta.glob('/content/locales/*.yaml', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
import items from '/content/items.yaml?raw';
import game from '/content/game.yaml?raw';

export function loadContent(): GameContent {
  const content = parseContent({ scenes, ink, items, game });
  const file = locales[`/content/locales/${lang()}.yaml`];
  if (file) localizeContent(content, parseCatalog(file));
  return content;
}
