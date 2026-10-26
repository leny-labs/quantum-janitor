/**
 * Partie scriptée sans navigateur : rejoue la solution complète du chapitre 0
 * avec le vrai moteur (ActionRunner + DialogueRunner) et vérifie qu'on atteint
 * le cliffhanger.   npm run playthrough   (ajouter -- -v pour voir les dialogues)
 * `-- lang=en` applique d'abord le catalogue content/locales/en.yaml : même
 * solution, mêmes flags, textes traduits (vérifie que l'i18n ne casse rien).
 */
import { ActionRunner, type ActionHost } from '../src/engine/ActionRunner';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseContent, toActions } from '../src/engine/content';
import { localizeContent, parseCatalog } from '../src/engine/localize';
import { DialogueRunner, type DialogueView } from '../src/engine/DialogueRunner';
import { GameState } from '../src/engine/GameState';
import { resolveCombine } from '../src/engine/combine';
import type { Interaction } from '../src/engine/types';
import { ROOT, readRawContent } from './readContent';

const verbose = process.argv.includes('-v');
const content = parseContent(readRawContent());
const lang = process.argv.find((a) => a.startsWith('lang='))?.slice(5);
if (lang) localizeContent(content, parseCatalog(readFileSync(join(ROOT, 'content', 'locales', `${lang}.yaml`), 'utf8')));
const state = new GameState(content.startScene);
let ended: string | null = null;
let choiceCursor = 0;

const view: DialogueView = {
  async showLine(sp, text) {
    if (verbose) console.log(`  ${sp && sp.id !== 'narrateur' ? sp.name + ' : ' : ''}${text}`);
  },
  async showChoices(choices) {
    const i = choiceCursor++ % choices.length;
    if (verbose) console.log(`  > [${choices[i]}]`);
    return i;
  },
  close() {},
};
const dialogue = new DialogueRunner(content, state, { shake() {} });
const host: ActionHost = {
  say: (t, mood) => view.showLine(dialogue.parseLine(t, 'gary').speaker, dialogue.parseLine(t, 'gary').text, mood),
  dialogue: (k) => dialogue.run(k, view),
  async goto(id) {
    if (!content.scenes.has(id)) throw new Error(`goto scène inconnue ${id}`);
    state.scene = id;
    const first = !state.visited.has(id);
    state.visited.add(id);
    const def = content.scenes.get(id)!;
    if (first) await runner.run(def.onFirstEnter);
    await runner.run(def.onEnter);
  },
  async end(k) {
    await dialogue.run(k, view);
    ended = k;
  },
  shake() {},
};
const runner = new ActionRunner(state, host);

const scene = () => content.scenes.get(state.scene)!;
function hotspot(id: string) {
  const h = scene().hotspots!.find((x) => x.id === id && state.check(x.if));
  if (!h) throw new Error(`hotspot « ${id} » absent/invisible dans ${state.scene}`);
  return h;
}
async function step(label: string, i: Interaction | undefined) {
  console.log(`· ${label}`);
  if (!i) throw new Error(`rien à faire pour : ${label}`);
  await runner.run(i);
}
const look = (h: string) => step(`regarder ${h}`, hotspot(h).look);
const use = (h: string) => step(`utiliser ${h}`, hotspot(h).use);
const talk = (h: string) => step(`parler à ${h}`, hotspot(h).talk);
const useItem = (item: string, h: string) => {
  if (!state.hasItem(item)) throw new Error(`objet « ${item} » absent de l'inventaire`);
  return step(`utiliser ${item} sur ${h}`, hotspot(h).useItem?.[item]);
};
const combine = (a: string, b: string) => step(`combiner ${a} + ${b}`, resolveCombine(content, a, b));
async function go(to: string) {
  const e = scene().exits!.find((x) => x.to === to && state.check(x.if));
  if (!e) throw new Error(`pas de sortie vers ${to} depuis ${state.scene}`);
  if (!state.check(e.requires)) throw new Error(`sortie vers ${to} verrouillée`);
  console.log(`→ ${to}`);
  await runner.run([{ goto: to }]);
}

async function main() {
  await runner.run(toActions(undefined));
  state.visited.add(state.scene);
  await runner.run(scene().onFirstEnter);

  // Puzzle 1 : le badge
  await use('seau');
  await use('serpilliere');
  await talk('bob');
  await go('couloir');
  await useItem('serpilliere', 'distributeur');
  await go('placard');
  await useItem('sandwich', 'bob');
  if (!state.hasItem('badge')) throw new Error('pas de badge après le sandwich');

  // Puzzle 2 : ouvrir le labo
  await go('couloir');
  await useItem('badge', 'lecteur'); // refusé : encrassé
  await combine('serpilliere', 'seau');
  await useItem('serpilliere', 'lecteur');
  await useItem('badge', 'lecteur');
  await go('labo');

  // Puzzle 3 : « réparer » le réacteur
  await go('panneau');
  await look('logement');
  await go('labo');
  await go('couloir');
  await use('fusibles');
  await go('labo');
  await go('panneau');
  await useItem('fusible', 'logement');
  await go('labo');
  await talk('bob');
  await useItem('seau', 'trappe');
  await go('panneau');
  await use('bouton');

  if (ended !== 'cafards') throw new Error(`fin non atteinte (ended=${ended})`);
  console.log(`\n✓ Chapitre 0 terminé — cliffhanger « ${ended} » atteint.`);
  console.log(`  flags : ${[...state.flags].join(', ')}`);
}

main().catch((e) => {
  console.error(`\n✗ ${e.message}\n  scène=${state.scene} flags=${[...state.flags]} objets=${state.items}`);
  process.exit(1);
});
