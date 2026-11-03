// Page debug /creator (dev uniquement) : choisir un chapitre, puis sauter à
// n'importe quel checkpoint de sa solution. Chaque checkpoint est un instantané
// de sauvegarde obtenu en rejouant la solution (engine/walkthrough.ts) avec le
// vrai moteur ; « Jouer ici » l'écrit via SaveSystem puis ouvre /?resume=1.
//
// Transition entre chapitres (ChapterDef.from, engine/walkthrough.ts → chapterPrelude) :
// /creator?ch=ch1 (Station Bureaucratique) commence par « ↪ Transition ch.0 → ch.1 » :
//   ↪ fin ch.0 : « Jouer ici » = sauvegarde ch.0 terminée + ?resume=1 → écran de fin
//     (« À suivre… ») ; « Chapitre 1 → » = aspiration dans la faille puis l'interlude.
//     « URL » = ?scene=fin (rejoue aussi le cliffhanger ch1_suite, sauvegarde intacte).
//   ▶ lancement ch.1 : état initial, interlude du vaisseau jamais visité (intro filmée).
//   #0 début : direct dans le cockpit, intro déjà vue.
// Sur ch0, le checkpoint FIN porte un lien « → suite : transition ch.1 ».
// ch0 = acte I Klepsydra + acte II Blattaria : la coupure d'acte (cliffhanger cafards → Nid Royal)
// est une entrée « ↪ » (kind `act`, ancre #acte-2) ; « Jouer ici » rejoue l'intro du Nid.
import './style.css';
import { loadContent } from '../engine/contentBrowser';
import { GameState } from '../engine/GameState';
import { migrateSave } from '../engine/saveMigration';
import { SaveSystem } from '../engine/SaveSystem';
import type { SaveData } from '../engine/types';
import { CHAPTERS, chapterPrelude, walkChapter, type ChapterDef, type Checkpoint } from '../engine/walkthrough';

const content = loadContent();
const save = new SaveSystem();
const root = document.getElementById('creator')!;
const GAME_URL = import.meta.env.BASE_URL;

let chapter: ChapterDef = CHAPTERS.find((c) => c.id === new URLSearchParams(location.search).get('ch')) ?? CHAPTERS[0];
let checkpoints: Checkpoint[] = [];
/** Transition depuis le chapitre précédent + lancement (intro), avant les checkpoints. */
let prelude: Checkpoint[] = [];
let walkError = '';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Record<string, unknown> = {}, ...children: (Node | string)[]) {
  const e: HTMLElementTagNameMap[K] = Object.assign(document.createElement(tag), props);
  e.append(...children);
  return e;
}

const tags = (list: string[], cls: string, prefix = '') => list.map((t) => el('span', { className: `tag ${cls}` }, prefix + t));
const sameSet = (a: string[] = [], b: string[] = []) => a.length === b.length && a.every((x) => b.includes(x));

/** Checkpoint identique à la sauvegarde, sinon le dernier dont les flags sont tous posés. */
function locate(s: SaveData | null): { exact?: Checkpoint; near?: Checkpoint } {
  if (!s) return {};
  const all = [...prelude, ...checkpoints].reverse();
  const same = (c: Checkpoint) => c.save.scene === s.scene && c.save.ended === s.ended && sameSet(c.save.flags, s.flags) && sameSet(c.save.items, s.items);
  // « lancement » et « début » ne diffèrent que par les pièces visitées (intro jouée ou non)
  const exact = all.find((c) => same(c) && sameSet(c.save.visited, s.visited)) ?? all.find(same);
  if (exact) return { exact };
  const near = [...checkpoints].reverse().find((c) => c.save.flags.every((f) => s.flags.includes(f)));
  return { near };
}

/** URL debug équivalente (?scene&flags&items) : n'écrase pas la sauvegarde, mais sans état Ink. */
function debugUrl(c: Checkpoint): string {
  const q = new URLSearchParams({ scene: c.save.ended ? 'fin' : c.save.scene });
  // lancement : startDebug marque la pièce visitée, `cine=1` rejoue quand même le plan d'arrivée
  // hors ch.0 : le chapitre choisit la bonne fin (`scene=fin`) et se retrouve dans la sauvegarde
  if (c.save.chapter && c.save.chapter !== 'ch0') q.set('chapter', c.save.chapter.replace(/^ch/, ''));
  if (c.save.flags.length) q.set('flags', c.save.flags.join(','));
  if (c.save.items.length) q.set('items', c.save.items.join(','));
  if (c.kind === 'launch' || c.kind === 'act') q.set('cine', '1');
  return `${GAME_URL}?${q.toString().replace(/%2C/g, ',')}`;
}

function playAt(c: Checkpoint): void {
  save.save(GameState.fromSave(c.save));
  location.href = `${GAME_URL}?resume=1`;
}

function renderChapters(): HTMLElement {
  return el(
    'section',
    {},
    el('h2', {}, 'Chapitres'),
    ...CHAPTERS.map((c) =>
      el('button', {
        className: `chapter${c === chapter ? ' on' : ''}`,
        textContent: c.title,
        onclick: () => selectChapter(c),
      }),
    ),
  );
}

function selectChapter(c: ChapterDef, anchor?: string): void {
  chapter = c;
  history.replaceState(null, '', `?ch=${c.id}${anchor ? `#${anchor}` : ''}`);
  void load().then(() => anchor && document.getElementById(anchor)?.scrollIntoView({ block: 'center' }));
}

/** Repère affiché d'une entrée : ↪ transition, ▶ lancement, sinon son numéro. */
const mark = (c: Checkpoint) => (c.kind === 'transition' || c.kind === 'act' ? '↪' : c.kind === 'launch' ? '▶' : String(c.index));
const where = (c: Checkpoint) => (c.kind ? `« ${c.label} »` : `checkpoint #${c.index}`);

function renderTimeline(current: SaveData | null): HTMLElement {
  const extra = prelude.length ? ` + transition` : '';
  const sec = el('section', {}, el('h2', {}, `Timeline — ${chapter.title} (${checkpoints.length} checkpoints${extra})`));
  if (walkError) sec.append(el('p', { className: 'err' }, `Solution cassée : ${walkError}`));
  const { exact, near } = locate(current);
  const next = CHAPTERS.find((c) => c.from === chapter.id);
  let lastSection: string | null = null;
  let ol = el('ol');
  for (const c of [...prelude, ...checkpoints]) {
    // après la transition, le checkpoint « début » (sans section) reçoit son propre titre
    const section = c.section || (prelude.length ? `Départ direct — ${chapter.startScene} (intro déjà vue)` : '');
    if (section !== lastSection) {
      lastSection = section;
      if (section) {
        sec.append(ol, el('h3', { className: c.kind ? 'transition' : '' }, section));
        ol = el('ol');
      }
    }
    const info = el('div', {}, el('span', { className: 'label' }, c.label), el('span', { className: 'scene' }, c.save.ended ? 'FIN' : c.scene));
    const t = [...tags(c.newFlags, 'flag', '+'), ...tags(c.gained, 'gain', '+'), ...tags(c.lost, 'lost')];
    if (t.length) info.append(el('div', { className: 'tags' }, ...t));
    const play = el('button', { textContent: 'Jouer ici', title: 'Écrit la sauvegarde puis lance le jeu', onclick: () => playAt(c) });
    const url = el('a', { className: 'btn', href: debugUrl(c), textContent: 'URL', title: 'Mode debug URL (sauvegarde intacte, sans état Ink)' });
    const actions = el('div', { className: 'actions' }, play, url);
    // fin du chapitre : lien croisé vers la transition en tête du chapitre suivant
    if (next && !c.kind && c.save.ended) {
      actions.append(el('button', { className: 'link', textContent: `→ suite : transition ${next.id.replace(/^ch/, 'ch.')}`, onclick: () => selectChapter(next, 'transition') }));
    }
    ol.append(
      el(
        'li',
        {
          id: c.kind === 'act' ? 'acte-2' : (c.kind ?? ''),
          className: `cp${c.kind ? ` ${c.kind}` : ''}${c === exact ? ' match' : c === near ? ' near' : ''}`,
          title: `flags : ${c.save.flags.join(', ') || '—'}\nobjets : ${c.save.items.join(', ') || '—'}`,
        },
        el('span', { className: 'idx' }, mark(c)),
        info,
        actions,
      ),
    );
  }
  sec.append(ol);
  return sec;
}

function renderSave(current: SaveData | null): HTMLElement {
  const sec = el('section', {}, el('h2', {}, 'Sauvegarde actuelle'));
  if (!current) sec.append(el('p', { className: 'note' }, 'Aucune sauvegarde.'));
  else {
    const { exact, near } = locate(current);
    const at = exact ? `${where(exact)} (exact)` : near ? `après ${where(near)} (approché)` : '—';
    sec.append(
      el(
        'dl',
        {},
        el('dt', {}, 'Où'),
        el('dd', {}, at),
        el('dt', {}, 'Scène'),
        el('dd', {}, current.ended ? `${current.scene} (fin)` : current.scene),
        el('dt', {}, 'Flags'),
        el('dd', {}, current.flags.join(', ') || '—'),
        el('dt', {}, 'Objets'),
        el('dd', {}, current.items.join(', ') || '—'),
        el('dt', {}, 'Visités'),
        el('dd', {}, current.visited.join(', ') || '—'),
        el('dt', {}, 'Ink'),
        el('dd', {}, current.inkState ? `${Math.round(current.inkState.length / 1024)} Ko` : '—'),
      ),
    );
  }
  const file = el('input', { type: 'file', accept: 'application/json,.json', hidden: true });
  file.onchange = async () => {
    const f = file.files?.[0];
    if (!f) return;
    try {
      // v1 (avant la fusion ch.0 + Blattaria) migrée comme au chargement du jeu
      const data = migrateSave(JSON.parse(await f.text()));
      if (!data) throw new Error('format inattendu (version 1 ou 2 attendue)');
      save.save(GameState.fromSave(data));
      render();
    } catch (e) {
      alert(`Import impossible : ${(e as Error).message}`);
    }
  };
  sec.append(
    el(
      'div',
      { className: 'row' },
      el('a', { className: 'btn', href: `${GAME_URL}?resume=1`, textContent: 'Reprendre' }),
      el('button', {
        textContent: 'Exporter JSON',
        disabled: !current,
        onclick: () => {
          const a = el('a', { href: URL.createObjectURL(new Blob([JSON.stringify(current, null, 2)], { type: 'application/json' })), download: 'quantum-janitor-save.json' });
          a.click();
          URL.revokeObjectURL(a.href);
        },
      }),
      el('button', { textContent: 'Importer JSON', onclick: () => file.click() }),
      el('button', {
        className: 'danger',
        textContent: 'Reset',
        disabled: !current,
        onclick: () => {
          if (!confirm('Effacer la sauvegarde ?')) return;
          save.clear();
          render();
        },
      }),
      file,
    ),
    el('p', { className: 'note' }, '« Jouer ici » remplace la sauvegarde puis ouvre le jeu avec ?resume=1. « URL » passe par le mode debug (?scene&flags&items) sans toucher à la sauvegarde.'),
  );
  return sec;
}

function render(): void {
  const current = save.read();
  root.replaceChildren(
    el('h1', {}, 'Quantum Janitor — Creator', el('small', {}, 'saut à un point de l’histoire (debug)')),
    renderChapters(),
    renderTimeline(current),
    renderSave(current),
  );
}

async function load(): Promise<void> {
  walkError = '';
  checkpoints = [];
  prelude = [];
  try {
    checkpoints = (await walkChapter(content, chapter)).checkpoints;
    prelude = await chapterPrelude(content, chapter);
  } catch (e) {
    walkError = (e as Error).message;
  }
  render();
}

// la sauvegarde peut changer dans l'onglet du jeu
window.addEventListener('storage', render);
window.addEventListener('focus', render);
void load();
