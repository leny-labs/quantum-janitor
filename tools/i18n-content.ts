/**
 * Catalogues de traduction du contenu (content/locales/<lang>.yaml) :
 * couverture par langue, clés orphelines, variables et préfixes cohérents.
 *   npm run i18n                     rapport (code 1 si clé orpheline / incohérente)
 *   npm run i18n -- missing=en       textes source non traduits, au format du catalogue
 *   npm run i18n -- keys             toutes les clés du YAML avec leur texte source
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { stringify } from 'yaml';
import { parseContent } from '../src/engine/content';
import { contentTexts, inkTexts, parseCatalog } from '../src/engine/localize';
import { ROOT, readRawContent } from './readContent';

const args = Object.fromEntries(process.argv.slice(2).map((a) => [a.split('=')[0], a.split('=')[1] ?? '1']));
const raw = readRawContent();
const content = parseContent(raw);
const yamlTexts = new Map(contentTexts(content).map((r) => [r.key, r.get()]));
const inkList = inkTexts(raw.ink, new Set(content.characters.keys()));
const inkSource = new Map<string, string>();
for (const { text, where } of inkList) if (!inkSource.has(text)) inkSource.set(text, where);

if (args.keys) {
  for (const [k, v] of yamlTexts) console.log(`${k}\t${v}`);
  process.exit(0);
}

const DIR = join(ROOT, 'content', 'locales');
const files = existsSync(DIR) ? readdirSync(DIR).filter((f) => f.endsWith('.yaml')) : [];

if (args.missing) {
  const file = join(DIR, `${args.missing}.yaml`);
  const cat = existsSync(file) ? parseCatalog(readFileSync(file, 'utf8')) : { keys: {}, ink: {} };
  const keys = Object.fromEntries([...yamlTexts].filter(([k]) => !cat.keys[k]));
  const ink = Object.fromEntries([...inkSource.keys()].filter((s) => !cat.ink[s]).map((s) => [s, s]));
  console.log(`# ${Object.keys(keys).length + Object.keys(ink).length} texte(s) à traduire en « ${args.missing} » (valeur = texte source)`);
  console.log(stringify({ keys, ink }, { lineWidth: 0 }));
  process.exit(0);
}

const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
let errors = 0;
console.log(`Source (fr) : ${yamlTexts.size} textes YAML, ${inkSource.size} textes Ink.`);
for (const f of files) {
  const lang = f.replace(/\.yaml$/, '');
  const cat = parseCatalog(readFileSync(join(DIR, f), 'utf8'));
  const problems: string[] = [];
  for (const [k, v] of Object.entries(cat.keys)) {
    if (!yamlTexts.has(k)) problems.push(`clé orpheline « ${k} » (le YAML n'a plus ce texte)`);
    else if (vars(v) !== vars(yamlTexts.get(k)!)) problems.push(`${k} : variables {…} différentes de la source`);
    else if (/^[a-z_]+:\s/.test(v) && content.characters.has(v.split(':')[0])) problems.push(`${k} : ne pas répéter le préfixe de locuteur dans la traduction`);
  }
  for (const s of Object.keys(cat.ink)) if (!inkSource.has(s)) problems.push(`texte Ink orphelin « ${s.slice(0, 60)}… » (modifié ou supprimé dans content/story)`);
  const yamlDone = [...yamlTexts.keys()].filter((k) => cat.keys[k]).length;
  const inkDone = [...inkSource.keys()].filter((s) => cat.ink[s]).length;
  console.log(`${problems.length ? '✗' : '✓'} ${lang} : YAML ${yamlDone}/${yamlTexts.size}, Ink ${inkDone}/${inkSource.size} (le reste retombe sur le français)`);
  problems.forEach((p) => console.error(`   ✗ ${p}`));
  errors += problems.length;
}
process.exit(errors ? 1 : 0);
