// Localisation du contenu (YAML + Ink). Pur TypeScript, partagé avec tools/.
//
// Le français est la langue source, écrit en clair dans content/. Une autre
// langue est un catalogue content/locales/<lang>.yaml :
//   keys: clé stable dérivée des ids du YAML → traduction
//   ink:  texte source de la réplique / du choix Ink → traduction
// Ce qui manque retombe sur le français. Voir docs/I18N.md.
import { parse } from 'yaml';
import type { Action, ArtShape, GameContent, Interaction } from './types';

export interface ContentCatalog {
  keys: Record<string, string>;
  ink: Record<string, string>;
}

/** Une chaîne traduisible du YAML : clé stable, lecture / écriture en place. */
export interface TextRef {
  key: string;
  get(): string;
  set(v: string): void;
}

const SPEAKER = /^([a-z_]+):\s*/;

export function parseCatalog(text: string): ContentCatalog {
  const raw = (parse(text) ?? {}) as Partial<ContentCatalog>;
  return { keys: raw.keys ?? {}, ink: raw.ink ?? {} };
}

/**
 * Toutes les chaînes affichables du contenu YAML, avec leur clé :
 *   scene.<scène>.title | .sector | .art.<n> | .onEnter[.<n>] | .onFirstEnter[.<n>]
 *   scene.<scène>.hotspot.<id>.label | .useLabel | .look[.<n>] | .use[.<n>] | .talk[.<n>]
 *                                  | .useItem.<objet>[.<n>] | .useItemDefault[.<n>] | .art.<n>
 *   scene.<scène>.exit.<id>.label | .lockedText[.<n>]
 *   item.<id>.name | .glyph | .look[.<n>] | .combine.<objet>[.<n>]
 *   character.<id>.name | .portrait
 * `.<n>` = rang de l'action dans la liste (une chaîne seule n'a pas de suffixe).
 * Le préfixe de locuteur (« bob: ») n'est pas traduit : il est conservé tel quel.
 */
export function contentTexts(c: GameContent): TextRef[] {
  const out: TextRef[] = [];
  const field = <T extends object>(key: string, o: T, k: keyof T & string) => {
    if (typeof o[k] !== 'string' || !(o[k] as string)) return;
    out.push({ key, get: () => o[k] as string, set: (v) => ((o as Record<string, unknown>)[k] = v) });
  };
  const said = (key: string, get: () => string, set: (v: string) => void) => {
    const m = get().match(SPEAKER);
    const prefix = m && c.characters.has(m[1]) ? m[0] : '';
    out.push({ key, get: () => get().slice(prefix.length), set: (v) => set(prefix + v) });
  };
  const interaction = (key: string, holder: object, k: string) => {
    const h = holder as Record<string, Interaction | undefined>;
    const i = h[k];
    if (typeof i === 'string') said(key, () => h[k] as string, (v) => (h[k] = v));
    else if (Array.isArray(i)) {
      i.forEach((a: Action, n) => {
        if (typeof a.say === 'string') said(`${key}.${n}`, () => a.say!, (v) => (a.say = v));
      });
    }
  };
  const art = (key: string, list: ArtShape[] | undefined) => list?.forEach((a, n) => field(`${key}.art.${n}`, a, 'text'));

  for (const s of c.scenes.values()) {
    const k = `scene.${s.id}`;
    field(`${k}.title`, s, 'title');
    field(`${k}.sector`, s, 'sector');
    art(k, s.art);
    interaction(`${k}.onEnter`, s, 'onEnter');
    interaction(`${k}.onFirstEnter`, s, 'onFirstEnter');
    for (const h of s.hotspots ?? []) {
      const hk = `${k}.hotspot.${h.id}`;
      field(`${hk}.label`, h, 'label');
      field(`${hk}.useLabel`, h, 'useLabel');
      art(hk, h.art);
      for (const v of ['look', 'use', 'talk', 'useItemDefault'] as const) interaction(`${hk}.${v}`, h, v);
      for (const item of Object.keys(h.useItem ?? {})) interaction(`${hk}.useItem.${item}`, h.useItem!, item);
    }
    for (const e of s.exits ?? []) {
      const ek = `${k}.exit.${e.id}`;
      field(`${ek}.label`, e, 'label');
      interaction(`${ek}.lockedText`, e, 'lockedText');
    }
  }
  for (const it of c.items.values()) {
    const k = `item.${it.id}`;
    field(`${k}.name`, it, 'name');
    field(`${k}.glyph`, it.icon, 'glyph');
    interaction(`${k}.look`, it, 'look');
    for (const other of Object.keys(it.combine ?? {})) interaction(`${k}.combine.${other}`, it.combine!, other);
  }
  for (const ch of c.characters.values()) {
    field(`character.${ch.id}.name`, ch, 'name');
    field(`character.${ch.id}.portrait`, ch, 'portrait');
  }
  return out;
}

/** Applique un catalogue au contenu (en place) ; les clés absentes gardent le français. */
export function localizeContent(c: GameContent, cat: ContentCatalog | undefined): void {
  if (!cat) return;
  for (const ref of contentTexts(c)) {
    const v = cat.keys[ref.key];
    if (typeof v === 'string' && v) ref.set(v);
  }
  c.inkText = new Map(Object.entries(cat.ink).filter(([, v]) => typeof v === 'string' && v));
}

// ── Ink : textes source, extraits statiquement (outils) ────────────────

/** Développe les alternatives Ink en ligne ({~a|b}, {a|b}, {cond: a|b}). */
function expand(line: string): string[] {
  const m = line.match(/\{([^{}]*\|[^{}]*)\}/);
  if (!m) return [line];
  let body = m[1];
  // séquence / cycle / une fois / mélange
  body = body.replace(/^[~&!]/, '');
  // conditionnelle : « cond: a | b »
  const cond = body.match(/^[^|:]*\)\s*:\s*/) ?? body.match(/^\s*[\w.]+\s*:\s*/);
  if (cond) body = body.slice(cond[0].length);
  return body.split('|').flatMap((alt) => expand(line.slice(0, m.index) + alt + line.slice(m.index! + m[0].length)));
}

/**
 * Textes affichés par l'Ink (répliques sans préfixe de locuteur, choix),
 * avec leur emplacement. Couvre la syntaxe utilisée dans content/story :
 * choix `* [texte]`, répliques « id: texte », alternatives en ligne, tags.
 */
export function inkTexts(files: Record<string, string>, speakers: Set<string>): { text: string; where: string }[] {
  const out: { text: string; where: string }[] = [];
  for (const [file, src] of Object.entries(files)) {
    src.split('\n').forEach((rawLine, i) => {
      const where = `${file}:${i + 1}`;
      let line = rawLine.replace(/\/\/.*$/, '').trim();
      if (!line || /^(===|=\s|->|~|EXTERNAL|VAR|CONST|INCLUDE|\{\s*$|}|- *else\s*:|- .*:\s*$)/.test(line)) return;
      // tags et redirections en fin de ligne
      line = line.replace(/\s#.*$/, '').replace(/\s*->\s*[\w.]+\s*$/, '').trim();
      const choice = line.match(/^[*+]+\s*(.*)$/);
      if (choice) {
        // « * avant [entre crochets] après » : le choix affiche « avant entre crochets »
        const c = choice[1].match(/^([^[]*)\[([^\]]*)\]/);
        const text = c ? (c[1] + c[2]).trim() : choice[1].trim();
        if (text) out.push({ text, where });
        return;
      }
      line = line.replace(/^-\s*/, '');
      if (!line) return;
      for (const variant of expand(line)) {
        const m = variant.match(SPEAKER);
        const text = (m && speakers.has(m[1]) ? variant.slice(m[0].length) : variant).trim();
        if (text) out.push({ text, where });
      }
    });
  }
  return out;
}
