import type { GameState } from './GameState';
import { toActions } from './content';
import type { Action, Interaction } from './types';

/** Services que l'hôte (la scène Phaser) fournit à l'exécuteur d'actions. */
export interface ActionHost {
  say(text: string, mood?: string): Promise<void>;
  dialogue(knot: string): Promise<Action[]>;
  goto(scene: string): Promise<void>;
  end(knot: string): Promise<void>;
  shake(): void;
}

/** Exécute séquentiellement les actions décrites dans le YAML. */
export class ActionRunner {
  constructor(
    private state: GameState,
    private host: ActionHost,
  ) {}

  async run(interaction: Interaction | undefined): Promise<void> {
    await this.runList(toActions(interaction));
  }

  private async runList(actions: Action[]): Promise<boolean> {
    for (const a of actions) {
      if (!this.state.check(a.if)) continue;
      if (a.say) await this.host.say(a.say, a.mood);
      if (a.dialogue) {
        const deferred = await this.host.dialogue(a.dialogue);
        if (deferred.length && (await this.runList(deferred))) return true;
      }
      if (a.take) this.state.take(a.take);
      if (a.give) this.state.give(a.give);
      if (a.unset) this.state.unsetFlag(a.unset);
      if (a.set) this.state.setFlag(a.set);
      if (a.shake) this.host.shake();
      if (a.goto) await this.host.goto(a.goto);
      if (a.end) {
        await this.host.end(a.end);
        return true;
      }
      if (a.stop) return true;
    }
    return false;
  }
}
