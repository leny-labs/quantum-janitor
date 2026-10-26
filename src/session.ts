import type Phaser from 'phaser';
import { loadContent } from './engine/contentBrowser';
import { parseDebug, type DebugOptions } from './engine/debug';
import { DialogueRunner } from './engine/DialogueRunner';
import { GameState } from './engine/GameState';
import { SaveSystem } from './engine/SaveSystem';
import type { GameContent } from './engine/types';

export const END_SCENE_ID = 'fin';

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

  newGame(): void {
    this.attach(new GameState(this.content.startScene));
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
    const scene = d.scene && this.content.scenes.has(d.scene) ? d.scene : this.content.startScene;
    if (d.scene && d.scene !== END_SCENE_ID && !this.content.scenes.has(d.scene)) {
      console.warn(`[debug] scène inconnue "${d.scene}". Scènes : ${[...this.content.scenes.keys()].join(', ')}`);
    }
    const s = new GameState(scene);
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
    });
    this.detachSave = this.save.autoSave(state);
  }
}

let session: Session | null = null;
export function getSession(): Session {
  session ??= new Session();
  return session;
}
