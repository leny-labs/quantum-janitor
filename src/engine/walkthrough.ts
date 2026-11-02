// Solution scriptée des chapitres, rejouée avec le vrai moteur (ActionRunner +
// DialogueRunner) sans Phaser. Partagée par tools/playthrough.ts (vérifie qu'on
// atteint la fin) et la page debug /creator (un checkpoint = un instantané de
// sauvegarde après chaque étape).
import { ActionRunner, type ActionHost } from './ActionRunner';
import { resolveCombine } from './combine';
import { DialogueRunner, type DialogueView } from './DialogueRunner';
import { GameState } from './GameState';
import type { GameContent, Interaction, SaveData } from './types';

export type WalkStep =
  | { section: string }
  | { look: string }
  | { use: string }
  | { talk: string }
  | { useItem: [item: string, hotspot: string] }
  | { combine: [a: string, b: string] }
  | { go: string };

export interface ChapterDef {
  id: string;
  title: string;
  /** Scène de départ d'une nouvelle partie de ce chapitre. */
  startScene: string;
  /** État initial propre du chapitre (rien d'autre n'est hérité des chapitres précédents). */
  initial?: { items?: string[]; flags?: string[] };
  /** Knot de fin attendu (cliffhanger). */
  endKnot: string;
  steps: WalkStep[];
}

export const CHAPTERS: ChapterDef[] = [
  {
    id: 'ch0',
    title: 'Chapitre 0 : Le Seau',
    startScene: 'placard',
    endKnot: 'cafards',
    steps: [
      { section: 'Puzzle 1 : le badge' },
      { use: 'seau' },
      { use: 'serpilliere' },
      { talk: 'bob' },
      { go: 'couloir' },
      { useItem: ['serpilliere', 'distributeur'] },
      { go: 'placard' },
      { useItem: ['sandwich', 'bob'] },
      { section: 'Puzzle 2 : ouvrir le labo' },
      { go: 'couloir' },
      { useItem: ['badge', 'lecteur'] }, // refusé : encrassé
      { combine: ['serpilliere', 'seau'] },
      { useItem: ['serpilliere', 'lecteur'] },
      { useItem: ['badge', 'lecteur'] },
      { go: 'labo' },
      { section: '« Réparer » le réacteur' },
      { go: 'panneau' },
      { look: 'logement' },
      { go: 'labo' },
      { go: 'couloir' },
      { use: 'fusibles' },
      { go: 'labo' },
      { go: 'panneau' },
      { useItem: ['fusible', 'logement'] },
      { go: 'labo' },
      { talk: 'bob' },
      { useItem: ['seau', 'trappe'] },
      { go: 'panneau' },
      { use: 'bouton' },
    ],
  },
  {
    id: 'ch1',
    title: 'Chapitre 1 : Blattaria Prime',
    startScene: 'nid-royal',
    // arrivé par la faille avec Josiane et le badge ; le Seau est passé avant lui
    initial: { items: ['serpilliere', 'badge'], flags: ['ch1', 'chapitre0_termine'] },
    endKnot: 'ch1_suite',
    steps: [
      { section: 'Puzzle 1 : le Signe aux deux R' },
      { talk: 'reine' },
      { use: 'autel' }, // refusé : les gardes
      { go: 'galerie-des-offrandes' },
      { look: 'fresque' },
      { useItem: ['badge', 'scribe'] }, // refusé : sent le thon
      { useItem: ['serpilliere', 'bassin'] },
      { combine: ['serpilliere', 'badge'] },
      { useItem: ['badge', 'scribe'] },
      { go: 'nid-royal' },
      { talk: 'reine' },
      { section: 'Puzzle 2 : la Foule' },
      { go: 'galerie-des-offrandes' },
      { look: 'foule' },
      { use: 'grenier' }, // à mains nues : non
      { useItem: ['seau', 'grenier'] },
      { useItem: ['seau', 'foule'] },
      { section: 'Puzzle 3 : laver le premier monde' },
      { go: 'temple-couloir' },
      { look: 'distributeur' },
      { useItem: ['serpilliere', 'distributeur'] },
      { go: 'galerie-des-offrandes' },
      { useItem: ['seau', 'bassin'] },
      { go: 'temple-couloir' },
      { go: 'coeur-eclat' },
      { look: 'jauge' },
      { useItem: ['seau', 'eclat'] },
      { go: 'temple-couloir' },
      { go: 'galerie-des-offrandes' },
      { go: 'nid-royal' },
      { useItem: ['fragment', 'reine'] },
    ],
  },
];

export function findChapter(id: string | undefined): ChapterDef | undefined {
  return CHAPTERS.find((c) => c.id === id);
}

/** Knot de fin d'un chapitre (inconnu = ch0). */
export function endKnotOf(id: string | undefined): string {
  return (findChapter(id) ?? CHAPTERS[0]).endKnot;
}

/** Nouvelle partie au début d'un chapitre : scène de départ + état initial déclaré. */
export function chapterState(chapter: ChapterDef): GameState {
  const s = new GameState(chapter.startScene);
  s.chapter = chapter.id;
  chapter.initial?.flags?.forEach((f) => s.flags.add(f));
  chapter.initial?.items?.forEach((i) => s.items.push(i));
  return s;
}

export interface Checkpoint {
  index: number;
  section: string;
  /** Libellé de l'étape (« utiliser serpilliere sur distributeur », « → couloir »). */
  label: string;
  scene: string;
  newFlags: string[];
  gained: string[];
  lost: string[];
  save: SaveData;
}

export interface WalkOptions {
  /** Appelée pour chaque réplique / choix (sortie verbeuse). */
  log?: (line: string) => void;
  /** Appelée avant chaque étape. */
  onStep?: (label: string) => void;
}

export interface WalkResult {
  checkpoints: Checkpoint[];
  state: GameState;
  ended: string | null;
}

/** Rejoue un chapitre depuis le début ; lève une erreur si une étape est impossible. */
export async function walkChapter(content: GameContent, chapter: ChapterDef, opts: WalkOptions = {}): Promise<WalkResult> {
  const log = opts.log ?? (() => {});
  const state = chapterState(chapter);
  let ended: string | null = null;
  let choiceCursor = 0;

  const view: DialogueView = {
    async showLine(sp, text) {
      log(`  ${sp && sp.id !== 'narrateur' ? sp.name + ' : ' : ''}${text}`);
    },
    async showChoices(choices) {
      const i = choiceCursor++ % choices.length;
      log(`  > [${choices[i]}]`);
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
      state.ended = true;
    },
    shake() {},
  };
  const runner = new ActionRunner(state, host);

  const scene = () => content.scenes.get(state.scene)!;
  const hotspot = (id: string) => {
    const h = scene().hotspots!.find((x) => x.id === id && state.check(x.if));
    if (!h) throw new Error(`hotspot « ${id} » absent/invisible dans ${state.scene}`);
    return h;
  };
  const exec = async (label: string, i: Interaction | undefined) => {
    if (!i) throw new Error(`rien à faire pour : ${label}`);
    await runner.run(i);
  };

  const checkpoints: Checkpoint[] = [];
  let section = '';
  const snap = (label: string, before: SaveData) => {
    const save = state.toSave();
    checkpoints.push({
      index: checkpoints.length,
      section,
      label,
      scene: state.scene,
      newFlags: save.flags.filter((f) => !before.flags.includes(f)),
      gained: save.items.filter((i) => !before.items.includes(i)),
      lost: before.items.filter((i) => !save.items.includes(i)),
      save,
    });
  };

  // Arrivée dans la scène de départ (comme une nouvelle partie).
  let before = state.toSave();
  state.visited.add(state.scene);
  await runner.run(scene().onFirstEnter);
  snap(`début — ${state.scene}`, before);

  for (const s of chapter.steps) {
    if ('section' in s) {
      section = s.section;
      continue;
    }
    before = state.toSave();
    let label: string;
    if ('look' in s) {
      label = `regarder ${s.look}`;
      opts.onStep?.(label);
      await exec(label, hotspot(s.look).look);
    } else if ('use' in s) {
      label = `utiliser ${s.use}`;
      opts.onStep?.(label);
      await exec(label, hotspot(s.use).use);
    } else if ('talk' in s) {
      label = `parler à ${s.talk}`;
      opts.onStep?.(label);
      await exec(label, hotspot(s.talk).talk);
    } else if ('useItem' in s) {
      const [item, h] = s.useItem;
      label = `utiliser ${item} sur ${h}`;
      opts.onStep?.(label);
      if (!state.hasItem(item)) throw new Error(`objet « ${item} » absent de l'inventaire`);
      await exec(label, hotspot(h).useItem?.[item]);
    } else if ('combine' in s) {
      const [a, b] = s.combine;
      label = `combiner ${a} + ${b}`;
      opts.onStep?.(label);
      await exec(label, resolveCombine(content, a, b));
    } else {
      label = `→ ${s.go}`;
      opts.onStep?.(label);
      const e = scene().exits!.find((x) => x.to === s.go && state.check(x.if));
      if (!e) throw new Error(`pas de sortie vers ${s.go} depuis ${state.scene}`);
      if (!state.check(e.requires)) throw new Error(`sortie vers ${s.go} verrouillée`);
      await runner.run([{ goto: s.go }]);
    }
    snap(label, before);
  }

  return { checkpoints, state, ended };
}
