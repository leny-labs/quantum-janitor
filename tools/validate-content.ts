/**
 * Validation du contenu : références croisées scènes / objets / knots Ink / flags.
 *   npm run validate
 * Code de sortie 1 en cas d'erreur (les avertissements ne bloquent pas).
 */
import { assembleInk, locateInkLine, parseContent, toActions } from '../src/engine/content';
import { compileInk, INK_TAG_KEYS, parseTag } from '../src/engine/ink';
import type { Action, ArtShape, Condition, GameContent, Interaction } from '../src/engine/types';
import { readRawContent } from './readContent';

const END_SCENE_ID = 'fin';

const errors: string[] = [];
const warnings: string[] = [];
const err = (m: string) => errors.push(m);
const warn = (m: string) => warnings.push(m);

const raw = readRawContent();

let content: GameContent;
try {
  content = parseContent(raw);
} catch (e) {
  console.error(`✗ Parsing YAML : ${(e as Error).message}`);
  process.exit(1);
}

// ── Ink ────────────────────────────────────────────────────────────────
const { spans } = assembleInk(raw.ink);
const { story, errors: inkErrors, warnings: inkWarnings } = compileInk(content.inkSource);
const relocate = (m: string) => m.replace(/line (\d+)/, (_, n) => locateInkLine(spans, Number(n)));
inkErrors.forEach((m) => err(`Ink : ${relocate(m)}`));
inkWarnings.forEach((m) => warn(`Ink : ${relocate(m)}`));

const flagsSet = new Map<string, string[]>(); // flag → où il est posé
const flagsRead = new Map<string, string[]>();
const itemsGiven = new Map<string, string[]>();
const knotsUsed = new Map<string, string[]>();
const note = (m: Map<string, string[]>, k: string, where: string) => m.set(k, [...(m.get(k) ?? []), where]);

for (const [file, src] of Object.entries(raw.ink)) {
  src.split('\n').forEach((line, i) => {
    const where = `${file}:${i + 1}`;
    if (line.trim().startsWith('//')) return;
    const code = line.replace(/\/\/.*$/, '');
    for (const m of code.matchAll(/has_flag\(\s*"([^"]+)"\s*\)/g)) note(flagsRead, m[1], where);
    for (const m of code.matchAll(/has_item\(\s*"([^"]+)"\s*\)/g)) {
      if (!content.items.has(m[1])) err(`${where} : has_item("${m[1]}") — objet inconnu`);
    }
    // tags : tout ce qui suit un # hors de la ligne EXTERNAL
    const hash = code.indexOf('#');
    if (hash < 0) return;
    for (const t of code.slice(hash + 1).split('#')) {
      const { key, value } = parseTag(t);
      if (!(INK_TAG_KEYS as readonly string[]).includes(key)) {
        err(`${where} : tag inconnu « #${t.trim()} » (attendus : ${INK_TAG_KEYS.join(', ')})`);
        continue;
      }
      checkEffect(key, value, where);
    }
  });
}

// Personnages : préfixes « id: » dans l'Ink
for (const [file, src] of Object.entries(raw.ink)) {
  src.split('\n').forEach((line, i) => {
    const m = line.trim().replace(/^[-*+]\s*(\[[^\]]*\])?\s*/, '').match(/^([a-z_]+):\s/);
    if (m && !content.characters.has(m[1])) warn(`${file}:${i + 1} : préfixe « ${m[1]}: » ne correspond à aucun personnage`);
  });
}

function checkEffect(key: string, value: string, where: string): void {
  switch (key) {
    case 'give':
      if (!content.items.has(value)) err(`${where} : give « ${value} » — objet inconnu`);
      note(itemsGiven, value, where);
      break;
    case 'take':
      if (!content.items.has(value)) err(`${where} : take « ${value} » — objet inconnu`);
      break;
    case 'set':
    case 'unset':
      if (!value) err(`${where} : ${key} sans flag`);
      if (key === 'set') note(flagsSet, value, where);
      break;
    case 'goto':
      if (!content.scenes.has(value)) err(`${where} : goto « ${value} » — scène inconnue`);
      break;
    case 'end':
    case 'dialogue':
      note(knotsUsed, value, where);
      break;
  }
}

// ── Scènes / objets ────────────────────────────────────────────────────
function checkCondition(c: Condition | undefined, where: string): void {
  if (!c) return;
  const allowed = ['flags', 'notFlags', 'items', 'notItems'];
  for (const k of Object.keys(c)) if (!allowed.includes(k)) err(`${where} : clé de condition inconnue « ${k} »`);
  [...(c.flags ?? []), ...(c.notFlags ?? [])].forEach((f) => note(flagsRead, f, where));
  [...(c.items ?? []), ...(c.notItems ?? [])].forEach((i) => {
    if (!content.items.has(i)) err(`${where} : condition sur objet inconnu « ${i} »`);
  });
}

const ACTION_KEYS = ['if', 'say', 'dialogue', 'take', 'give', 'unset', 'set', 'shake', 'goto', 'end', 'stop'];

function checkInteraction(i: Interaction | undefined, where: string): void {
  if (i === undefined) return;
  if (typeof i !== 'string' && !Array.isArray(i)) {
    err(`${where} : interaction invalide (attendu : texte ou liste d'actions)`);
    return;
  }
  toActions(i).forEach((a: Action, n) => {
    const w = `${where}[${n}]`;
    for (const k of Object.keys(a)) if (!ACTION_KEYS.includes(k)) err(`${w} : clé d'action inconnue « ${k} »`);
    checkCondition(a.if, w);
    for (const key of ['give', 'take', 'set', 'unset', 'goto', 'end', 'dialogue'] as const) {
      const v = a[key];
      if (typeof v === 'string') checkEffect(key, v, w);
    }
    if (a.say) {
      const m = a.say.match(/^([a-z_]+):\s/);
      if (m && !content.characters.has(m[1])) warn(`${w} : préfixe « ${m[1]}: » ne correspond à aucun personnage`);
    }
  });
}

function checkArt(art: ArtShape[] | undefined, where: string): void {
  (art ?? []).forEach((a, n) => {
    checkCondition(a.if, `${where}.art[${n}]`);
    if (!a.rect && !a.circle && !a.text) warn(`${where}.art[${n}] : forme vide`);
  });
}

const reachable = new Set<string>([content.startScene]);
if (!content.scenes.has(content.startScene)) err(`game.yaml : startScene « ${content.startScene} » inconnue`);

for (const s of content.scenes.values()) {
  const w = `scène ${s.id}`;
  checkArt(s.art, w);
  checkInteraction(s.onEnter, `${w}.onEnter`);
  checkInteraction(s.onFirstEnter, `${w}.onFirstEnter`);
  const ids = new Set<string>();
  for (const h of s.hotspots ?? []) {
    const hw = `${w} › hotspot ${h.id}`;
    if (ids.has(h.id)) err(`${hw} : id en double`);
    ids.add(h.id);
    if (!Array.isArray(h.rect) || h.rect.length !== 4) err(`${hw} : rect invalide`);
    if (!h.label) err(`${hw} : label manquant`);
    checkCondition(h.if, hw);
    checkArt(h.art, hw);
    checkInteraction(h.look, `${hw}.look`);
    checkInteraction(h.use, `${hw}.use`);
    checkInteraction(h.talk, `${hw}.talk`);
    checkInteraction(h.useItemDefault, `${hw}.useItemDefault`);
    for (const [item, i] of Object.entries(h.useItem ?? {})) {
      if (!content.items.has(item)) err(`${hw}.useItem : objet inconnu « ${item} »`);
      checkInteraction(i, `${hw}.useItem.${item}`);
    }
  }
  for (const e of s.exits ?? []) {
    const ew = `${w} › sortie ${e.id}`;
    if (!content.scenes.has(e.to)) err(`${ew} : scène cible inconnue « ${e.to} »`);
    reachable.add(e.to);
    checkCondition(e.if, ew);
    checkCondition(e.requires, ew);
    checkInteraction(e.lockedText, `${ew}.lockedText`);
  }
}

for (const it of content.items.values()) {
  const w = `objet ${it.id}`;
  if (!it.name) err(`${w} : name manquant`);
  if (!it.icon?.glyph || !it.icon?.color) err(`${w} : icon.color / icon.glyph manquant`);
  checkInteraction(it.look, `${w}.look`);
  for (const [other, i] of Object.entries(it.combine ?? {})) {
    if (!content.items.has(other)) err(`${w}.combine : objet inconnu « ${other} »`);
    checkInteraction(i, `${w}.combine.${other}`);
  }
}

// ── Références croisées ────────────────────────────────────────────────
if (story) {
  for (const [knot, where] of knotsUsed) {
    if (!story.KnotContainerWithName(knot)) err(`knot Ink inconnu « ${knot} » (utilisé : ${where.join(', ')})`);
  }
  const knots = new Set<string>();
  for (const src of Object.values(raw.ink)) for (const m of src.matchAll(/^\s*===\s*(\w+)\s*===/gm)) knots.add(m[1]);
  for (const k of knots) if (!knotsUsed.has(k) && !new RegExp(`->\\s*${k}\\b`).test(content.inkSource)) {
    warn(`knot « ${k} » jamais appelé depuis le YAML ni l'Ink`);
  }
}

const ENGINE_FLAGS = new Set(['chapitre0_termine']);
for (const [f, where] of flagsRead) {
  if (!flagsSet.has(f) && !ENGINE_FLAGS.has(f)) err(`flag « ${f} » lu mais jamais posé (lu : ${where.slice(0, 3).join(', ')})`);
}
for (const [f, where] of flagsSet) {
  if (!flagsRead.has(f)) warn(`flag « ${f} » posé mais jamais lu (${where[0]})`);
}
for (const id of content.items.keys()) {
  if (!itemsGiven.has(id)) warn(`objet « ${id} » jamais donné au joueur`);
}
for (const id of content.scenes.keys()) {
  if (!reachable.has(id)) warn(`scène « ${id} » inaccessible (aucune sortie n'y mène)`);
}
if (content.scenes.has(END_SCENE_ID)) err(`l'id de scène « ${END_SCENE_ID} » est réservé à l'écran de fin`);

// ── Rapport ────────────────────────────────────────────────────────────
for (const w of warnings) console.warn(`⚠ ${w}`);
for (const e of errors) console.error(`✗ ${e}`);
console.log(
  `\n${content.scenes.size} scènes · ${content.items.size} objets · ${knotsUsed.size} knots appelés · ${flagsSet.size} flags` +
    ` — ${errors.length} erreur(s), ${warnings.length} avertissement(s)`,
);
process.exit(errors.length ? 1 : 0);
