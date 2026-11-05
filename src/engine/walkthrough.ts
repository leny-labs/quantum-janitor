// Solution scriptée des chapitres, rejouée avec le vrai moteur (ActionRunner +
// DialogueRunner) sans Phaser.
//
// Numérotation (docs/CHAPTERS.md) : `ch0` « Le Seau » = acte I Klepsydra-9 + acte II
// Blattaria Prime ; `ch1` = la Station Bureaucratique (scènes `st-*`, flags `st_*`).
// Préfixe `ch1_` / `ch1-` = acte Blattaria du chapitre 0 (historique, pas renommé). Partagée par tools/playthrough.ts (vérifie qu'on
// atteint la fin) et la page debug /creator (un checkpoint = un instantané de
// sauvegarde après chaque étape).
import { ActionRunner, type ActionHost } from './ActionRunner';
import { resolveCombine } from './combine';
import { DialogueRunner, type DialogueView } from './DialogueRunner';
import { GameState } from './GameState';
import type { GameContent, Interaction, SaveData } from './types';

/**
 * `pick` : choix Ink à prendre, dans l'ordre, pendant l'étape (index 0-basés) ; au-delà,
 * le curseur cyclique habituel. Indispensable pour les menus en boucle (interlude).
 */
export type WalkStep =
  | { section: string }
  | { look: string; pick?: number[] }
  | { use: string; pick?: number[] }
  | { talk: string; pick?: number[] }
  | { useItem: [item: string, hotspot: string]; pick?: number[] }
  | { combine: [a: string, b: string] }
  | { go: string };

/**
 * Acte d'un chapitre. Le premier acte commence à `startScene` du chapitre ; les suivants
 * commencent par une **coupure d'acte** : quand le knot de fin `breakKnot` est atteint
 * (`# end: cafards`), le jeu ne termine pas le chapitre — EndScene joue le cliffhanger en
 * mode « acte », affiche la carte d'acte, puis `enterAct` et la pièce `startScene`.
 */
export interface ActDef {
  id: string;
  title: string;
  startScene: string;
  /** Knot `# end:` qui ouvre cet acte (cliffhanger de l'acte précédent). */
  breakKnot?: string;
  /** État propre à l'entrée de l'acte : inventaire et flags **remplacés** (les objets tombés dans la faille disparaissent). */
  enter?: { items?: string[]; flags?: string[] };
}

export interface ChapterDef {
  id: string;
  title: string;
  /** Scène de départ d'une nouvelle partie de ce chapitre. */
  startScene: string;
  /** État initial propre du chapitre (rien d'autre n'est hérité des chapitres précédents). */
  initial?: { items?: string[]; flags?: string[] };
  /** Knot de fin attendu (cliffhanger). */
  endKnot: string;
  /**
   * Chapitre encore ouvert (stub) : la solution s'arrête dès que ce flag est posé, sans
   * cliffhanger (`endKnot` non joué). Le playthrough vérifie alors ce flag au lieu du knot.
   */
  endFlag?: string;
  /** Actes (le premier = départ du chapitre) ; voir `ActDef`. */
  acts?: ActDef[];
  /**
   * Chapitre précédent dont l'écran de fin lance celui-ci (bouton « Chapitre N → »,
   * `END_BY_CHAPTER[from].next` dans EndScene) : /creator affiche cette transition en
   * tête de timeline (voir `chapterPrelude`).
   */
  from?: string;
  steps: WalkStep[];
}

export const CHAPTERS: ChapterDef[] = [
  {
    id: 'ch0',
    title: 'Chapitre 0 : Le Seau',
    startScene: 'placard',
    // fin du chapitre = fin de Blattaria (couronnement + faille) ; `cafards` n'est qu'une coupure d'acte
    endKnot: 'ch1_suite',
    acts: [
      { id: 'klepsydra', title: 'Acte I — Klepsydra-9', startScene: 'placard' },
      {
        id: 'blattaria',
        title: 'Acte II — Blattaria Prime',
        startScene: 'nid-royal',
        breakKnot: 'cafards',
        // arrivé par la faille avec Josiane et le badge ; le seau est passé avant lui,
        // le sandwich et le fusible sont restés sur Klepsydra
        enter: { items: ['serpilliere', 'badge'], flags: ['ch1', 'chapitre0_termine'] },
      },
    ],
    steps: [
      { section: 'Acte I · Puzzle 1 : le badge' },
      { use: 'seau' },
      { use: 'serpilliere' },
      { talk: 'bob' },
      { go: 'couloir' },
      { useItem: ['serpilliere', 'distributeur'] },
      { go: 'placard' },
      { useItem: ['sandwich', 'bob'] },
      { section: 'Acte I · Puzzle 2 : ouvrir le labo' },
      { go: 'couloir' },
      { useItem: ['badge', 'lecteur'] }, // refusé : encrassé
      { combine: ['serpilliere', 'seau'] },
      { useItem: ['serpilliere', 'lecteur'] },
      { useItem: ['badge', 'lecteur'] },
      { go: 'labo' },
      { section: 'Acte I · « Réparer » le réacteur' },
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
      { use: 'bouton' }, // le réacteur rit (reacteur_rit)
      { use: 'bouton' }, // clic direct « plus fort » : Clonk. Clonk. CLONK. → cliffhanger cafards
      { section: 'Acte II · Puzzle 1 : le Signe aux deux R' },
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
      { section: 'Acte II · Puzzle 2 : la Foule' },
      { go: 'galerie-des-offrandes' },
      { look: 'foule' },
      { use: 'grenier' }, // à mains nues : non
      { useItem: ['seau', 'grenier'] },
      { useItem: ['seau', 'foule'] },
      { section: 'Acte II · Puzzle 3 : tenir l\'éclat, refermer la faille' },
      { go: 'temple-couloir' },
      { look: 'distributeur' },
      { useItem: ['serpilliere', 'distributeur'] }, // Josiane reste coincée
      { look: 'distributeur' },
      { go: 'galerie-des-offrandes' },
      { useItem: ['seau', 'bassin'] },
      { go: 'temple-couloir' },
      { go: 'coeur-eclat' },
      { look: 'jauge' },
      { useItem: ['seau', 'eclat'] }, // le seau contient la faille et reste là
      { look: 'seau_sacre' },
      { go: 'temple-couloir' },
      { go: 'galerie-des-offrandes' },
      { go: 'nid-royal' },
      { useItem: ['fragment', 'reine'] },
    ],
  },
  {
    id: 'ch1',
    title: 'Chapitre 1 : La Station Bureaucratique',
    // interlude du mini-vaisseau (docs/INTERLUDE_VAISSEAU.md), puis la Station (scènes `st-*`)
    startScene: 'interlude-vaisseau',
    from: 'ch0',
    // ch.0 fini : éclat contenu, combi de chitine (enfilée dans l'interlude), badge ; B.O.B. suit
    initial: { items: ['badge', 'fragment', 'combi_chitine'], flags: ['st', 'ch0_termine', 'chapitre0_termine', 'bob_suit'] },
    // knot de fin nominal (EndScene) ; deviendra `st_suite`. Le stub, lui, s'arrête en salle au
    // guichet (`endFlag`) : plus de porte `to: fin`
    endKnot: 'st_stub_fin',
    endFlag: 'st_guichard_ferme',
    steps: [
      { section: 'Interlude — la Capsule de Service CS-07' },
      { look: 'pare_brise' },
      { useItem: ['badge', 'contact'] },
      { useItem: ['combi_chitine', 'siege'] },
      { talk: 'bob' },
      // boutons du tableau de bord en clic direct : NE PAS APPUYER, AUTOPILOTE, puis le levier sans étiquette
      { use: 'bouton_npa' },
      { use: 'bouton_auto' },
      { use: 'levier' },
      // destinations du navigateur en clic direct : Dimension Miniature (refusée), puis la Station
      { use: 'dest_miniature' },
      { use: 'dest_station' },
      { useItem: ['fragment', 'reacteur'] },
      { section: 'Station · le Sas d\'Arrivée (animal de compagnie)' },
      { talk: 'bob' }, // indice vague : « tout le monde a un ticket »
      { look: 'portique' },
      { use: 'portique' }, // +ticket_douane (payoff différé : la fourrière, fin du ch.1)
      { talk: 'guerite' }, // M. Sabot : « ticket d'entrée + permis de la Direction » (objectif final semé)
      { look: 'borne' }, // « les animaux doivent être accompagnés »
      { use: 'borne' }, // +plan_station : la carte de la Station (bouton PLAN, warp)
      { talk: 'bob', pick: [0] }, // « Tiens-moi en laisse, B.O.B. » → porte de l'attente
      { go: 'st-attente' },
      { section: 'Station · la Salle d\'Attente (M. Patience)' },
      { look: 'afficheur' }, // 9 847
      { look: 'squelette' }, // M. Patience tient le 9 848
      { useItem: ['ticket_douane', 'distributeur'] }, // fausse piste : le distributeur le recrache
      { use: 'squelette' }, // main serrée : il faut aspirer
      { use: 'plante' }, // +plante (payoff différé : couloir infini B, puis le Conseil)
      { go: 'st-cafeteria' }, // détour d'ambiance : la vitrine (sandwich consigné de Mme Guichard)
      { look: 'vitrine' },
      { go: 'st-attente' },
      { talk: 'bob', pick: [0] }, // « Il n'en a plus besoin… » → éloge funèbre, +ticket_9848
      { section: 'Station · le Guichet d\'Accueil (Mme Guichard)' },
      { go: 'st-guichet' }, // porte du guichet : ticket 9848 requis
      { look: 'horloge' }, // 10 h 11 (le guichet ouvre à 10 h 12)
      { look: 'horaires' },
      { useItem: ['ticket_9848', 'guichard'] }, // « c'est le suivant… de M. Patience » : animal, article 12
      { talk: 'guichard' }, // fermé, formulaire B-7/12 « au guichet » : fin provisoire du stub (st_guichard_ferme)
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

/** Acte d'un chapitre ouvert par le knot de fin `knot` (coupure d'acte), sinon undefined. */
export function actBreak(chapterId: string | undefined, knot: string): ActDef | undefined {
  return (findChapter(chapterId) ?? CHAPTERS[0]).acts?.find((a) => a.breakKnot === knot);
}

/** Acte `id` d'un chapitre. */
export function findAct(chapterId: string | undefined, id: string | undefined): ActDef | undefined {
  return (findChapter(chapterId) ?? CHAPTERS[0]).acts?.find((a) => a.id === id);
}

/**
 * Entrée dans un acte (pure, partagée jeu / walkChapter / /creator) : inventaire et flags
 * remplacés par `enter`, scène de départ de l'acte. Les pièces visitées et l'état Ink sont
 * gardés ; la pièce d'arrivée n'est pas marquée visitée (son intro `onFirstEnter` se joue).
 */
export function enterAct(state: GameState, act: ActDef): void {
  state.items = [...(act.enter?.items ?? state.items)];
  if (act.enter?.flags) state.flags = new Set(act.enter.flags);
  state.selectedItem = null;
  state.scene = act.startScene;
  state.ended = false;
  state.emit();
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
  /**
   * Entrées d'avant-chapitre de /creator (hors solution) : `transition` = écran de fin du
   * chapitre précédent ; `launch` = lancement réel du chapitre (intro d'arrivée à jouer) ;
   * `act` = coupure d'acte (cliffhanger puis arrivée dans l'acte suivant, intro à jouer).
   */
  kind?: 'transition' | 'launch' | 'act';
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
  /** Coupure d'acte atteinte pendant l'étape courante. */
  let pendingAct: ActDef | null = null;
  let choiceCursor = 0;
  /** Choix imposés de l'étape courante (`WalkStep.pick`). */
  let picks: number[] = [];

  const view: DialogueView = {
    async showLine(sp, text) {
      log(`  ${sp && sp.id !== 'narrateur' ? sp.name + ' : ' : ''}${text}`);
    },
    async showChoices(choices) {
      const forced = picks.shift();
      if (forced !== undefined && forced >= choices.length) throw new Error(`choix imposé ${forced} absent (${choices.length} choix : ${choices.join(' | ')})`);
      const i = forced ?? choiceCursor++ % choices.length;
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
      const act = actBreak(chapter.id, k);
      if (act) {
        // coupure d'acte (EndScene en mode acte) : cliffhanger joué, état propre de l'acte suivant
        enterAct(state, act);
        pendingAct = act;
        return;
      }
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
  const snap = (label: string, before: SaveData, kind?: Checkpoint['kind']) => {
    const save = state.toSave();
    checkpoints.push({
      ...(kind ? { kind } : {}),
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
    picks = 'pick' in s && s.pick ? [...s.pick] : [];
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
      // `to: fin` : franchir la sortie termine le chapitre (comme RoomScene.onClickExit)
      await runner.run([s.go === 'fin' ? { end: chapter.endKnot } : { goto: s.go }]);
    }
    const act = pendingAct as ActDef | null;
    if (act) {
      // checkpoint « coupure d'acte » : pièce d'arrivée pas encore visitée (« Jouer ici » rejoue l'intro)
      pendingAct = null;
      section = `↪ Coupure d'acte — ${act.title}`;
      snap(`${label} → cliffhanger « ${act.breakKnot} » → ${act.startScene}`, before, 'act');
      state.visited.add(state.scene);
      await runner.run(content.scenes.get(state.scene)!.onFirstEnter);
      continue;
    }
    snap(label, before);
  }

  return { checkpoints, state, ended };
}

/**
 * Entrées d'avant-chapitre pour /creator, avant le checkpoint « début » : la **transition**
 * (instantané final du chapitre `from` : écran de fin, « À suivre… », bouton « Chapitre N → »)
 * puis le **lancement** (état initial du chapitre, pièce jamais visitée → l'intro d'arrivée
 * `onFirstEnter` sera jouée, comme après le clic sur le bouton). Vide sans `from`.
 * Volontairement hors de `walkChapter` : les checkpoints de la solution (playthrough) ne changent pas.
 */
export async function chapterPrelude(content: GameContent, chapter: ChapterDef): Promise<Checkpoint[]> {
  const prev = findChapter(chapter.from);
  if (!prev) return [];
  const { checkpoints, ended } = await walkChapter(content, prev);
  const last = checkpoints[checkpoints.length - 1];
  if (!last || ended !== prev.endKnot) throw new Error(`fin de ${prev.id} non atteinte (ended=${ended})`);
  const section = `↪ Transition ${prev.id.replace(/^ch/, 'ch.')} → ${chapter.id.replace(/^ch/, 'ch.')}`;
  const launch = chapterState(chapter).toSave();
  return [
    {
      ...last,
      index: 0,
      section,
      label: `fin ${prev.id.replace(/^ch/, 'ch.')} — « À suivre… » + bouton « Chapitre ${chapter.id.replace(/^ch/, '')} → »`,
      newFlags: [],
      gained: [],
      lost: [],
      kind: 'transition',
    },
    {
      index: 0,
      section,
      label: `lancement ${chapter.id.replace(/^ch/, 'ch.')} — intro d'arrivée (${chapter.startScene})`,
      scene: chapter.startScene,
      newFlags: launch.flags.filter((f) => !last.save.flags.includes(f)),
      gained: launch.items.filter((i) => !last.save.items.includes(i)),
      lost: last.save.items.filter((i) => !launch.items.includes(i)),
      save: launch,
      kind: 'launch',
    },
  ];
}
