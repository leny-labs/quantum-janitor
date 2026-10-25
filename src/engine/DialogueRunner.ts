import type { Story } from 'inkjs/full';
import type { GameState } from './GameState';
import { compileInk, parseTag } from './ink';
import type { Action, CharacterDef, GameContent } from './types';

/** Ce que le moteur attend de l'interface de dialogue. */
export interface DialogueView {
  showLine(speaker: CharacterDef | null, text: string): Promise<void>;
  showChoices(choices: string[]): Promise<number>;
  close(): void;
}

export interface SpokenLine {
  speaker: CharacterDef | null;
  text: string;
}

/**
 * Exécute des knots Ink. Une seule Story pour toute la partie (compteurs de
 * visites et variables Ink persistés dans la sauvegarde).
 */
export class DialogueRunner {
  private story: Story;

  constructor(
    private content: GameContent,
    private state: GameState,
    private hooks: { shake: () => void },
  ) {
    const { story, errors } = compileInk(content.inkSource);
    if (!story) throw new Error('Erreur Ink :\n' + errors.join('\n'));
    this.story = story;
    story.BindExternalFunction('has_item', (id: string) => this.state.hasItem(id), true);
    story.BindExternalFunction('has_flag', (id: string) => this.state.hasFlag(id), true);
    if (state.inkState) {
      try {
        story.state.LoadJson(state.inkState);
      } catch (e) {
        console.warn('État Ink incompatible, ignoré', e);
      }
    }
  }

  hasKnot(name: string): boolean {
    return !!this.story.KnotContainerWithName(name);
  }

  /** « bob: Bonjour » → { speaker: bob, text: "Bonjour" }. */
  parseLine(raw: string, defaultSpeaker: string | null): SpokenLine {
    const m = raw.match(/^([a-z_]+):\s*(.*)$/s);
    if (m && this.content.characters.has(m[1])) {
      return { speaker: this.content.characters.get(m[1])!, text: m[2] };
    }
    return { speaker: defaultSpeaker ? this.content.characters.get(defaultSpeaker) ?? null : null, text: raw };
  }

  /**
   * Joue un knot jusqu'à sa fin. Les effets immédiats (give/take/set) sont
   * appliqués au fil de l'eau ; goto/end sont renvoyés pour être exécutés
   * après la fermeture du dialogue.
   */
  async run(knot: string, view: DialogueView): Promise<Action[]> {
    const story = this.story;
    const deferred: Action[] = [];
    story.ChoosePathString(knot);
    for (;;) {
      while (story.canContinue) {
        const text = (story.Continue() ?? '').trim();
        for (const t of story.currentTags ?? []) this.applyTag(t, deferred);
        if (text) {
          const line = this.parseLine(text, 'narrateur');
          await view.showLine(line.speaker, line.text);
        }
      }
      const choices = story.currentChoices;
      if (choices.length === 0) break;
      const idx = await view.showChoices(choices.map((c) => c.text));
      story.ChooseChoiceIndex(idx);
    }
    view.close();
    this.state.inkState = story.state.toJson();
    this.state.emit();
    return deferred;
  }

  private applyTag(raw: string, deferred: Action[]): void {
    const { key, value } = parseTag(raw);
    switch (key) {
      case 'give':
        this.state.give(value);
        break;
      case 'take':
        this.state.take(value);
        break;
      case 'set':
        this.state.setFlag(value);
        break;
      case 'unset':
        this.state.unsetFlag(value);
        break;
      case 'shake':
        this.hooks.shake();
        break;
      case 'goto':
        deferred.push({ goto: value });
        break;
      case 'end':
        deferred.push({ end: value });
        break;
      default:
        console.warn(`Tag Ink inconnu : #${raw}`);
    }
  }
}
