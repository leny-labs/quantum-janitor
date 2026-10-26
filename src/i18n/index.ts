// Internationalisation : langue courante, textes d'interface (t / tl) et
// catalogues de contenu. Aucun import Phaser (partagé avec tools/).
//
// Langue : ?lang=xx (mémorisée) > préférence localStorage > français.
// Changer de langue recharge la page (les textes Phaser et les décors 3D sont
// figés en texture à la création). Voir docs/I18N.md.
import { en } from './locales/en';
import { fr, type Catalog, type PartialCatalog } from './locales/fr';

export const LANGS = ['fr', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const SOURCE_LANG: Lang = 'fr';

const UI: Record<Lang, PartialCatalog> = { fr, en };
const KEY = 'qj.lang';

/** Chemins pointés vers une chaîne (« hud.menu ») ou une liste (« title.slogans »). */
type Paths<T, Leaf> = {
  [K in keyof T & string]: T[K] extends Leaf ? K : T[K] extends string | readonly string[] ? never : `${K}.${Paths<T[K], Leaf>}`;
}[keyof T & string];
export type TextKey = Paths<Catalog, string>;
export type ListKey = Paths<Catalog, readonly string[]>;

export type Vars = Record<string, string | number>;

function isLang(s: string | null | undefined): s is Lang {
  return !!s && (LANGS as readonly string[]).includes(s);
}

function detect(): Lang {
  if (typeof window === 'undefined') return SOURCE_LANG;
  const q = new URLSearchParams(window.location.search).get('lang')?.toLowerCase();
  if (isLang(q)) {
    try {
      localStorage.setItem(KEY, q);
    } catch {
      /* stockage indisponible : langue pour cette visite seulement */
    }
    return q;
  }
  try {
    const saved = localStorage.getItem(KEY);
    if (isLang(saved)) return saved;
  } catch {
    /* idem */
  }
  return SOURCE_LANG;
}

let current: Lang = detect();

export function lang(): Lang {
  return current;
}

/** Change de langue (préférence mémorisée) et recharge la page. */
export function setLang(l: Lang): void {
  if (l === current) return;
  try {
    localStorage.setItem(KEY, l);
  } catch {
    /* idem */
  }
  const url = new URL(window.location.href);
  url.searchParams.delete('lang');
  window.location.replace(url.toString());
}

/** Langue suivante dans la liste (bouton de sélection). */
export function nextLang(): Lang {
  return LANGS[(LANGS.indexOf(current) + 1) % LANGS.length];
}

function lookup(cat: PartialCatalog, key: string): unknown {
  let o: unknown = cat;
  for (const k of key.split('.')) {
    if (o === null || typeof o !== 'object') return undefined;
    o = (o as Record<string, unknown>)[k];
  }
  return o;
}

/** Remplace `{nom}` par la variable correspondante (laissé tel quel si absente). */
export function interpolate(s: string, vars?: Vars): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** Texte d'interface dans la langue courante (repli : français, puis la clé). */
export function t(key: TextKey, vars?: Vars): string {
  const v = lookup(UI[current], key) ?? lookup(UI[SOURCE_LANG], key);
  return interpolate(typeof v === 'string' ? v : key, vars);
}

/** Liste de textes (slogans, répliques au choix…). */
export function tl(key: ListKey, vars?: Vars): string[] {
  const v = lookup(UI[current], key) ?? lookup(UI[SOURCE_LANG], key);
  return Array.isArray(v) ? v.map((s: string) => interpolate(s, vars)) : [key];
}

/** Nom d'une langue dans cette langue (« English »). */
export function langName(l: Lang): string {
  const v = lookup(UI[l], 'meta.langName');
  return typeof v === 'string' ? v : l;
}

/** Libellé court (« FR »). */
export function langCode(l: Lang): string {
  const v = lookup(UI[l], 'meta.langCode');
  return typeof v === 'string' ? v : l.toUpperCase();
}
