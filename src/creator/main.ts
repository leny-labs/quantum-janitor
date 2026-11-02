// Page debug /creator (dev uniquement) : choisir un chapitre, puis sauter à
// n'importe quel checkpoint de sa solution. Chaque checkpoint est un instantané
// de sauvegarde obtenu en rejouant la solution (engine/walkthrough.ts) avec le
// vrai moteur ; « Jouer ici » l'écrit via SaveSystem puis ouvre /?resume=1.
import './style.css';
import { loadContent } from '../engine/contentBrowser';
import { GameState } from '../engine/GameState';
import { SaveSystem } from '../engine/SaveSystem';
import type { SaveData } from '../engine/types';
import { CHAPTERS, walkChapter, type ChapterDef, type Checkpoint } from '../engine/walkthrough';

const content = loadContent();
const save = new SaveSystem();
const root = document.getElementById('creator')!;
const GAME_URL = import.meta.env.BASE_URL;

let chapter: ChapterDef = CHAPTERS.find((c) => c.id === new URLSearchParams(location.search).get('ch')) ?? CHAPTERS[0];
let checkpoints: Checkpoint[] = [];
let walkError = '';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Record<string, unknown> = {}, ...children: (Node | string)[]) {
  const e: HTMLElementTagNameMap[K] = Object.assign(document.createElement(tag), props);
  e.append(...children);
  return e;
}

const tags = (list: string[], cls: string, prefix = '') => list.map((t) => el('span', { className: `tag ${cls}` }, prefix + t));
const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

/** Checkpoint identique à la sauvegarde, sinon le dernier dont les flags sont tous posés. */
function locate(s: SaveData | null): { exact?: Checkpoint; near?: Checkpoint } {
  if (!s) return {};
  const exact = [...checkpoints]
    .reverse()
    .find((c) => c.save.scene === s.scene && c.save.ended === s.ended && sameSet(c.save.flags, s.flags) && sameSet(c.save.items, s.items));
  if (exact) return { exact };
  const near = [...checkpoints].reverse().find((c) => c.save.flags.every((f) => s.flags.includes(f)));
  return { near };
}

/** URL debug équivalente (?scene&flags&items) : n'écrase pas la sauvegarde, mais sans état Ink. */
function debugUrl(c: Checkpoint): string {
  const q = new URLSearchParams({ scene: c.save.ended ? 'fin' : c.save.scene });
  if (c.save.flags.length) q.set('flags', c.save.flags.join(','));
  if (c.save.items.length) q.set('items', c.save.items.join(','));
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
        onclick: () => {
          chapter = c;
          history.replaceState(null, '', `?ch=${c.id}`);
          void load();
        },
      }),
    ),
  );
}

function renderTimeline(current: SaveData | null): HTMLElement {
  const sec = el('section', {}, el('h2', {}, `Timeline — ${chapter.title} (${checkpoints.length} checkpoints)`));
  if (walkError) sec.append(el('p', { className: 'err' }, `Solution cassée : ${walkError}`));
  const { exact, near } = locate(current);
  let lastSection: string | null = null;
  let ol = el('ol');
  for (const c of checkpoints) {
    if (c.section !== lastSection) {
      lastSection = c.section;
      if (c.section) {
        sec.append(ol, el('h3', {}, c.section));
        ol = el('ol');
      }
    }
    const info = el('div', {}, el('span', { className: 'label' }, c.label), el('span', { className: 'scene' }, c.save.ended ? 'FIN' : c.scene));
    const t = [...tags(c.newFlags, 'flag', '+'), ...tags(c.gained, 'gain', '+'), ...tags(c.lost, 'lost')];
    if (t.length) info.append(el('div', { className: 'tags' }, ...t));
    const play = el('button', { textContent: 'Jouer ici', title: 'Écrit la sauvegarde puis lance le jeu', onclick: () => playAt(c) });
    const url = el('a', { className: 'btn', href: debugUrl(c), textContent: 'URL', title: 'Mode debug URL (sauvegarde intacte, sans état Ink)' });
    ol.append(
      el(
        'li',
        { className: `cp${c === exact ? ' match' : c === near ? ' near' : ''}`, title: `flags : ${c.save.flags.join(', ') || '—'}\nobjets : ${c.save.items.join(', ') || '—'}` },
        el('span', { className: 'idx' }, String(c.index)),
        info,
        el('div', { className: 'actions' }, play, url),
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
    const where = exact ? `checkpoint #${exact.index} (exact)` : near ? `après #${near.index} (approché)` : '—';
    sec.append(
      el(
        'dl',
        {},
        el('dt', {}, 'Où'),
        el('dd', {}, where),
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
      const data = JSON.parse(await f.text()) as SaveData;
      if (data.version !== 1 || typeof data.scene !== 'string' || !Array.isArray(data.flags)) throw new Error('format inattendu (version 1 attendue)');
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
  try {
    checkpoints = (await walkChapter(content, chapter)).checkpoints;
  } catch (e) {
    walkError = (e as Error).message;
  }
  render();
}

// la sauvegarde peut changer dans l'onglet du jeu
window.addEventListener('storage', render);
window.addEventListener('focus', render);
void load();
