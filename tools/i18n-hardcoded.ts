/**
 * Détecte les chaînes affichables écrites en dur dans src/ (hors catalogues
 * de langue src/i18n/locales/). Tout texte visible doit passer par t().
 *   npm run check:i18n
 * Heuristique : littéral (ou morceau statique de template) contenant une
 * lettre accentuée / typographie française, deux mots, ou un mot capitalisé.
 * Faux positif assumé : ajouter `// i18n-ignore` en fin de ligne, ou
 * compléter IGNORE ci-dessous (identifiants techniques).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT } from './readContent';

const SRC = join(ROOT, 'src');
const SKIP_DIRS = [join(SRC, 'i18n', 'locales')];

/** Littéraux techniques qui ressemblent à du texte. */
const IGNORE = new Set([
  'Room', 'Title', 'Intro', 'End', 'Bungee', 'Arial', 'Impact', 'Escape', 'Enter', 'ArrowDown', 'ArrowRight', 'ArrowLeft', 'ArrowUp',
  'Chakra Petch', 'Trebuchet MS', 'DejaVu Sans', 'Courier New', 'DejaVu Sans Mono', 'Stepped', 'Linear',
]);

export interface Hit {
  file: string;
  line: number;
  text: string;
}

/** Morceaux de texte littéral d'un source TS (chaînes, templates hors `${}`), commentaires exclus. */
export function literals(src: string): { text: string; line: number; lineText: string }[] {
  const out: { text: string; line: number; lineText: string }[] = [];
  const lines = src.split('\n');
  let i = 0;
  let line = 1;
  /** Profondeur d'accolades à laquelle chaque template ouvert a commencé un `${`. */
  const tpl: number[] = [];
  let depth = 0;
  let prev = ''; // dernier caractère significatif (pour distinguer regex / division)
  const push = (text: string, at: number) => out.push({ text, line: at, lineText: lines[at - 1] ?? '' });
  const readTemplate = () => {
    // i pointe juste après ` ou après la } fermant un ${
    let buf = '';
    const at = line;
    while (i < src.length) {
      const c = src[i];
      if (c === '\\') {
        buf += src.slice(i, i + 2);
        i += 2;
        continue;
      }
      if (c === '\n') line++;
      if (c === '`') {
        i++;
        push(buf, at);
        prev = '`';
        return;
      }
      if (c === '$' && src[i + 1] === '{') {
        i += 2;
        push(buf, at);
        tpl.push(depth);
        depth++;
        prev = '{';
        return;
      }
      buf += c;
      i++;
    }
  };
  while (i < src.length) {
    const c = src[i];
    if (c === '\n') {
      line++;
      i++;
      continue;
    }
    if (c === '/' && src[i + 1] === '/') {
      while (i < src.length && src[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      const stop = end < 0 ? src.length : end + 2;
      for (let k = i; k < stop; k++) if (src[k] === '\n') line++;
      i = stop;
      continue;
    }
    if (c === "'" || c === '"') {
      const at = line;
      let buf = '';
      i++;
      while (i < src.length && src[i] !== c && src[i] !== '\n') {
        if (src[i] === '\\') {
          buf += src.slice(i, i + 2);
          i += 2;
        } else buf += src[i++];
      }
      i++;
      push(buf, at);
      prev = c;
      continue;
    }
    if (c === '`') {
      i++;
      readTemplate();
      continue;
    }
    if (c === '/' && /[(,=:[!&|?{};+\-*%<>~^]|^$/.test(prev)) {
      // littéral regex : on le saute
      i++;
      let cls = false;
      while (i < src.length && src[i] !== '\n') {
        if (src[i] === '\\') i += 2;
        else if (src[i] === '[') (cls = true), i++;
        else if (src[i] === ']') (cls = false), i++;
        else if (src[i] === '/' && !cls) break;
        else i++;
      }
      i++;
      while (/[a-z]/i.test(src[i] ?? '')) i++;
      prev = 'r';
      continue;
    }
    if (c === '{') depth++;
    if (c === '}') {
      depth--;
      if (tpl.length && tpl[tpl.length - 1] === depth) {
        tpl.pop();
        i++;
        readTemplate();
        continue;
      }
    }
    if (!/\s/.test(c)) prev = c;
    i++;
  }
  return out;
}

/** Le littéral ressemble-t-il à du texte destiné au joueur ? */
export function looksLikeText(s: string): boolean {
  const t = s.replace(/\\n/g, ' ').trim();
  if (t.length < 2 || IGNORE.has(t)) return false;
  if (/^(\.{0,2}\/|@|<|#[0-9a-f]{3,8}$|data:|https?:|[\w-]+\.(ts|js|png|json|yaml|svg|css)$)/i.test(t)) return false;
  // listes de polices, styles CSS / canvas (« 500 20px … », « italic 500 », « bold 40px … »)
  if (/\b(sans-serif|serif|monospace)\b/.test(t)) return false;
  if (/^(italic |bold )?\d{3}( \d+px)?/.test(t) || /^(bold |italic )?\d+px /.test(t)) return false;
  if (/[À-ÿ«»…’œŒ⚡☢♥]/.test(t)) return true;
  if (/[A-Za-z]{2,}[\s·—:,!?'()&]+[A-Za-z]{2,}/.test(t)) return true; // au moins deux mots
  if (/^[A-Z]{3,}/.test(t)) return true; // « MENU », « GARRY », « CONSOLE »
  if (/^[A-Z][a-z]{2,}[.!?]?$/.test(t)) return true; // « Menu », « Rejouer »
  return false;
}

function walk(dir: string): string[] {
  if (SKIP_DIRS.includes(dir)) return [];
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return walk(p);
    return p.endsWith('.ts') && !p.endsWith('.d.ts') ? [p] : [];
  });
}

export function scan(): Hit[] {
  const hits: Hit[] = [];
  for (const file of walk(SRC)) {
    for (const l of literals(readFileSync(file, 'utf8'))) {
      if (/i18n-ignore/.test(l.lineText)) continue;
      // console.* / throw / Error : messages développeur, pas de l'affichage joueur
      if (/console\.(warn|error|log|info)|new Error\(|throw /.test(l.lineText)) continue;
      if (looksLikeText(l.text)) hits.push({ file: relative(ROOT, file), line: l.line, text: l.text });
    }
  }
  return hits;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const hits = scan();
  for (const h of hits) console.error(`✗ ${h.file}:${h.line}  ${JSON.stringify(h.text.length > 70 ? h.text.slice(0, 70) + '…' : h.text)}`);
  if (hits.length) {
    console.error(`\n${hits.length} chaîne(s) en dur dans src/ : passer par t() (src/i18n), ou marquer // i18n-ignore si technique.`);
    process.exit(1);
  }
  console.log('✓ Aucune chaîne affichable en dur dans src/.');
}
