/**
 * Validation du contenu : références croisées scènes / objets / knots Ink / flags.
 *   npm run validate
 * Code de sortie 1 en cas d'erreur (les avertissements ne bloquent pas).
 */
import { assembleInk, locateInkLine, parseContent, toActions } from '../src/engine/content';
import { compileInk, INK_TAG_KEYS, parseTag } from '../src/engine/ink';
import { MOODS, isMood } from '../src/engine/mood';
import { SMART_VALUES } from '../src/engine/verbs';
import { PROP_SFX } from '../src/engine/propSfx';
import { ROOM_ICONS, type Action, type ArtShape, type Condition, type GameContent, type Interaction } from '../src/engine/types';
import { CHAPTERS } from '../src/engine/walkthrough';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseStationMap } from '../src/engine/stationMap';
import { CLUE_PICTOS, deductionPairs, parseClues, parseDeductions, type ClueDef, type DeductionDef } from '../src/engine/clues';
import { ROOT, readRawContent } from './readContent';

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
    case 'card':
      if (!CARDS.includes(value)) err(`${where} : carte « ${value} » inconnue (attendues : ${CARDS.join(', ')})`);
      break;
    case 'mood':
      if (!isMood(value)) err(`${where} : mood « ${value} » inconnu (attendus : ${MOODS.join(', ')})`);
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

const ACTION_KEYS = ['if', 'say', 'mood', 'dialogue', 'take', 'give', 'unset', 'set', 'shake', 'card', 'goto', 'end', 'stop'];
/** Cartes de transition connues (src/ui/ChapterCard.ts, clés i18n `card.<id>.*`). */
const CARDS = ['ch1'];

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
    for (const key of ['give', 'take', 'set', 'unset', 'goto', 'end', 'dialogue', 'mood', 'card'] as const) {
      const v = a[key];
      if (typeof v === 'string') checkEffect(key, v, w);
    }
    if (a.mood && !a.say) warn(`${w} : mood sans say`);
    if (a.say) {
      const m = a.say.match(/^([a-z_]+):\s/);
      if (m && !content.characters.has(m[1])) warn(`${w} : préfixe « ${m[1]}: » ne correspond à aucun personnage`);
    }
  });
}

function checkArt(art: ArtShape[] | undefined, where: string): void {
  (art ?? []).forEach((a, n) => {
    checkCondition(a.if, `${where}.art[${n}]`);
    if (!a.rect && !a.circle && !a.text && !a.image) warn(`${where}.art[${n}] : forme vide`);
  });
}

// chaque chapitre démarre dans sa propre scène (src/engine/walkthrough.ts)
const reachable = new Set<string>([content.startScene, ...CHAPTERS.map((c) => c.startScene)]);
for (const c of CHAPTERS) {
  if (!content.scenes.has(c.startScene)) err(`chapitre ${c.id} : startScene « ${c.startScene} » inconnue`);
  c.initial?.items?.forEach((i) => content.items.has(i) || err(`chapitre ${c.id} : objet initial inconnu « ${i} »`));
  for (const a of c.acts ?? []) {
    reachable.add(a.startScene);
    if (!content.scenes.has(a.startScene)) err(`chapitre ${c.id} › acte ${a.id} : startScene « ${a.startScene} » inconnue`);
    a.enter?.items?.forEach((i) => content.items.has(i) || err(`chapitre ${c.id} › acte ${a.id} : objet d'entrée inconnu « ${i} »`));
    if (a.breakKnot) note(knotsUsed, a.breakKnot, `walkthrough ${c.id}.acts.${a.id}`);
  }
  note(knotsUsed, c.endKnot, `walkthrough ${c.id}.endKnot`);
}
if (!content.scenes.has(content.startScene)) err(`game.yaml : startScene « ${content.startScene} » inconnue`);

for (const s of content.scenes.values()) {
  const w = `scène ${s.id}`;
  if (!s.title) err(`${w} : title manquant`);
  if (s.icon !== undefined && !(ROOM_ICONS as readonly string[]).includes(s.icon)) err(`${w}.icon : valeur inconnue « ${s.icon} » (${ROOM_ICONS.join(', ')})`);
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
    if (h.smart !== undefined) {
      if (!(SMART_VALUES as readonly string[]).includes(h.smart)) err(`${hw}.smart : valeur inconnue « ${h.smart} » (${SMART_VALUES.join(', ')})`);
      else if (h.smart !== 'menu' && h.smart !== 'look' && !h[h.smart]) err(`${hw}.smart : « ${h.smart} » sans interaction correspondante`);
    }
    if (h.sfx !== undefined && !(PROP_SFX as readonly string[]).includes(h.sfx)) err(`${hw}.sfx : valeur inconnue « ${h.sfx} » (${PROP_SFX.join(', ')})`);
    if ((h.sfx !== undefined || h.sfxDud !== undefined) && !h.use) err(`${hw} : sfx / sfxDud sans « use »`);
    checkCondition(h.sfxDud, `${hw}.sfxDud`);
    checkInteraction(h.useItemDefault, `${hw}.useItemDefault`);
    for (const [item, i] of Object.entries(h.useItem ?? {})) {
      if (!content.items.has(item)) err(`${hw}.useItem : objet inconnu « ${item} »`);
      checkInteraction(i, `${hw}.useItem.${item}`);
    }
  }
  for (const e of s.exits ?? []) {
    const ew = `${w} › sortie ${e.id}`;
    // `to: fin` (END_SCENE_ID) = sortie vers la fin du chapitre (RoomScene → EndScene)
    if (e.to !== 'fin' && !content.scenes.has(e.to)) err(`${ew} : scène cible inconnue « ${e.to} »`);
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

// ── Carte de la Station (content/station-map.yaml, docs/CHAPTER1.md §4.1) ─────
{
  const w = 'station-map.yaml';
  let map;
  try {
    map = parseStationMap(readFileSync(join(ROOT, 'content', 'station-map.yaml'), 'utf8'));
  } catch (e) {
    err(`${w} : YAML invalide (${(e as Error).message})`);
  }
  const seen = new Set<string>();
  for (const band of map?.bands ?? []) {
    if (!band.id || !band.label?.fr) err(`${w} : bande sans id ou sans label.fr`);
    for (const z of band.zones ?? []) {
      const zw = `${w} › ${band.id} › ${z.scene}`;
      if (seen.has(z.scene)) err(`${zw} : zone en double`);
      seen.add(z.scene);
      if (!z.label?.fr) err(`${zw} : label.fr manquant`);
      if (z.unlock && !z.refused?.fr) warn(`${zw} : verrou sans motif « refused »`);
      if (z.planned) {
        // salle prévue (doc seulement) : pas de scène exigée ; ses flags viendront avec elle
        if (content.scenes.has(z.scene)) warn(`${zw} : la scène existe, retirer « planned: true »`);
        for (const c of [z.visible, z.unlock]) for (const k of Object.keys(c ?? {})) if (!['flags', 'notFlags', 'items', 'notItems'].includes(k)) err(`${zw} : clé de condition inconnue « ${k} »`);
        continue;
      }
      if (!content.scenes.has(z.scene)) err(`${zw} : scène inconnue (ajouter « planned: true » si elle n'existe pas encore)`);
      checkCondition(z.visible, `${zw}.visible`);
      checkCondition(z.unlock, `${zw}.unlock`);
    }
  }
  for (const id of content.scenes.keys()) if (id.startsWith('st-') && !seen.has(id)) warn(`${w} : la scène « ${id} » n'apparaît pas sur la carte`);
}

// ── Carnet de déduction (content/clues.yaml + deductions.yaml, docs/CHAPTER1.md) ─────
{
  const ids = new Set<string>();
  const icon = (i: string | undefined, where: string) => {
    if (!i) return;
    if (i.startsWith('item:')) {
      if (!content.items.has(i.slice(5))) err(`${where}.icon : objet inconnu « ${i.slice(5)} »`);
    } else if (!(CLUE_PICTOS as readonly string[]).includes(i)) err(`${where}.icon : pictogramme « ${i} » inconnu (attendus : ${CLUE_PICTOS.join(', ')}, item:<id>)`);
  };
  const text = (t: { fr?: string; en?: string } | undefined, what: string, where: string) => {
    if (!t?.fr) err(`${where} : ${what}.fr manquant`);
    else if (!t.en) warn(`${where} : ${what}.en manquant (retombe sur le français)`);
  };
  let clues: ClueDef[] = [];
  let deductions: DeductionDef[] = [];
  try {
    clues = parseClues(readFileSync(join(ROOT, 'content', 'clues.yaml'), 'utf8'));
    deductions = parseDeductions(readFileSync(join(ROOT, 'content', 'deductions.yaml'), 'utf8'));
  } catch (e) {
    err(`clues.yaml / deductions.yaml : YAML invalide (${(e as Error).message})`);
  }
  for (const c of clues) {
    const w = `clues.yaml › ${c.id}`;
    if (!c.id) err('clues.yaml : indice sans id');
    if (ids.has(c.id)) err(`${w} : id en double`);
    ids.add(c.id);
    text(c.title, 'title', w);
    text(c.text, 'text', w);
    icon(c.icon, w);
    if (!c.when || !Object.keys(c.when).length) err(`${w} : condition « when » vide`);
    checkCondition(c.when, `${w}.when`);
  }
  const sets = new Set<string>();
  for (const d of deductions) {
    const w = `deductions.yaml › ${d.id}`;
    if (!d.id) err('deductions.yaml : déduction sans id');
    if (ids.has(d.id)) err(`${w} : id en double (indices et déductions partagent les ids)`);
    ids.add(d.id);
  }
  for (const d of deductions) {
    const w = `deductions.yaml › ${d.id}`;
    text(d.title, 'title', w);
    text(d.text, 'text', w);
    if (d.line) text(d.line, 'line', w);
    if (d.nudge) text(d.nudge, 'nudge', w);
    if (d.piste) text(d.piste, 'piste', w);
    icon(d.icon, w);
    if (!d.set) err(`${w} : flag « set » manquant`);
    else {
      if (sets.has(d.set)) err(`${w} : flag « ${d.set} » déjà posé par une autre déduction`);
      sets.add(d.set);
      note(flagsSet, d.set, w);
    }
    const pairs = Array.isArray(d.needs) ? deductionPairs(d) : [];
    if (!pairs.length) err(`${w} : « needs » doit être [a, b] ou [[a, b], …]`);
    for (const p of pairs) {
      if (!Array.isArray(p) || p.length !== 2 || p[0] === p[1]) err(`${w}.needs : paire invalide ${JSON.stringify(p)}`);
      for (const id of p ?? []) {
        if (!ids.has(id)) err(`${w}.needs : pièce inconnue « ${id} »`);
        if (id === d.id) err(`${w}.needs : une déduction ne peut pas se citer elle-même`);
      }
    }
  }
  // deux déductions sur la même paire : la seconde serait inatteignable
  const seenPairs = new Map<string, string>();
  for (const d of deductions) for (const p of deductionPairs(d)) {
    const k = [...p].sort().join('+');
    if (seenPairs.has(k)) err(`deductions.yaml › ${d.id} : paire ${k} déjà utilisée par « ${seenPairs.get(k)} »`);
    seenPairs.set(k, d.id);
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

// posés par le moteur : EndScene, état initial des chapitres
// `ch0_termine` / `st_termine` : EndScene ; flags d'entrée des actes : enterAct (coupure d'acte)
const ENGINE_FLAGS = new Set([
  'chapitre0_termine',
  'ch0_termine',
  'st_termine',
  'go_station2',
  'fin_ch0',
  ...CHAPTERS.flatMap((c) => [...(c.initial?.flags ?? []), ...(c.acts ?? []).flatMap((a) => a.enter?.flags ?? [])]),
]);
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
