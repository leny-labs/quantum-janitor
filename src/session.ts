import type Phaser from 'phaser';
import { loadContent } from './engine/contentBrowser';
import { parseDebug, type DebugOptions } from './engine/debug';
import { DialogueRunner } from './engine/DialogueRunner';
import { GameState } from './engine/GameState';
import { repairState } from './engine/repair';
import { SaveSystem } from './engine/SaveSystem';
import type { GameContent } from './engine/types';
import { CHAPTERS, chapterState, findChapter } from './engine/walkthrough';

export const END_SCENE_ID = 'fin';

/**
 * Flags qui survivent à « Nouvelle partie » (stockage séparé de la sauvegarde) :
 * `iv_vu` = interlude du vaisseau déjà vu → bouton « Passer » (docs/CHAPTERS.md §2).
 */
const PROGRESS_KEY = 'qj.progress';
const PERSISTENT_FLAGS = ['iv_vu'];

function readProgress(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((f) => typeof f === 'string') : [];
  } catch {
    return [];
  }
}

/** Partie en cours : contenu, état, sauvegarde, dialogues. */
export class Session {
  readonly content: GameContent;
  readonly save = new SaveSystem();
  readonly debug: DebugOptions;
  state!: GameState;
  dialogue!: DialogueRunner;
  /** Scène Phaser active, pour les effets (tremblement) déclenchés depuis l'Ink. */
  activeScene: Phaser.Scene | null = null;
  private detachSave: (() => void) | null = null;

  constructor() {
    this.content = loadContent();
    this.debug = parseDebug(window.location.search);
    if (this.debug.reset) this.save.clear();
    if (this.debug.active) this.save.enabled = false;
  }

  /** Nouvelle partie au début d'un chapitre (ch0 par défaut), avec son état initial propre. */
  newGame(chapterId = 'ch0'): void {
    const s = chapterState(findChapter(chapterId) ?? CHAPTERS[0]);
    readProgress().forEach((f) => PERSISTENT_FLAGS.includes(f) && s.flags.add(f));
    this.attach(s);
  }

  /** Chapitre de la partie en cours (absent de la sauvegarde = ch0). */
  get chapter(): string {
    return this.state?.chapter ?? 'ch0';
  }

  loadGame(): boolean {
    const s = this.save.load();
    if (!s || (!this.content.scenes.has(s.scene) && !s.ended)) return false;
    this.attach(s);
    return true;
  }

  /** Démarre une partie construite depuis les paramètres d'URL. */
  startDebug(): void {
    const d = this.debug;
    const start = findChapter(d.chapter)?.startScene ?? this.content.startScene;
    const scene = d.scene && this.content.scenes.has(d.scene) ? d.scene : start;
    if (d.scene && d.scene !== END_SCENE_ID && !this.content.scenes.has(d.scene)) {
      console.warn(`[debug] scène inconnue "${d.scene}". Scènes : ${[...this.content.scenes.keys()].join(', ')}`);
    }
    const s = new GameState(scene);
    if (findChapter(d.chapter)) s.chapter = d.chapter;
    d.flags.forEach((f) => s.flags.add(f));
    d.items.forEach((i) => {
      if (this.content.items.has(i)) s.items.push(i);
      else console.warn(`[debug] objet inconnu "${i}"`);
    });
    // Évite de rejouer les intros quand on saute directement à une scène.
    s.visited.add(scene);
    this.attach(s);
  }

  private attach(state: GameState): void {
    this.detachSave?.();
    this.state = state;
    this.dialogue = new DialogueRunner(this.content, state, {
      shake: () => {
        this.activeScene?.cameras.main.shake(450, 0.012);
        // les petites animations des moments clés s'y accrochent (hoquet de B.O.B.)
        this.activeScene?.events.emit('ink-shake');
      },
      aspir: () => this.activeScene?.events.emit('ink-aspir'),
    });
    const autosave = this.save.autoSave(state);
    // flags persistants : notés dès qu'ils apparaissent (hors mode debug)
    const progress = state.onChange(() => {
      if (!this.save.enabled) return;
      const known = readProgress();
      const fresh = PERSISTENT_FLAGS.filter((f) => state.hasFlag(f) && !known.includes(f));
      if (fresh.length) {
        try {
          localStorage.setItem(PROGRESS_KEY, JSON.stringify([...known, ...fresh]));
        } catch {
          /* stockage indisponible */
        }
      }
    });
    this.detachSave = () => {
      autosave();
      progress();
    };
    repairState(state);
  }
}

let session: Session | null = null;
export function getSession(): Session {
  session ??= new Session();
  return session;
}
