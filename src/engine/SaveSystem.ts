import { GameState } from './GameState';
import { migrateSave } from './saveMigration';
import type { SaveData } from './types';

// la clé garde « v1 » : le numéro de format est dans `SaveData.version` (migration : saveMigration.ts)
const KEY = 'quantum-janitor.save.v1';

/** Sauvegarde unique, automatique, dans localStorage. */
export class SaveSystem {
  /** Désactivé en mode debug pour ne pas écraser la vraie partie. */
  enabled = true;

  has(): boolean {
    return this.read() !== null;
  }

  read(): SaveData | null {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      // v1 (avant la fusion ch.0 + Blattaria) migrée à la lecture ; réécrite en v2 au premier changement
      return migrateSave(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  load(): GameState | null {
    const d = this.read();
    return d ? GameState.fromSave(d) : null;
  }

  save(state: GameState): void {
    if (!this.enabled) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state.toSave()));
    } catch (e) {
      console.warn('Sauvegarde impossible', e);
    }
  }

  clear(): void {
    localStorage.removeItem(KEY);
  }

  /** Branche la sauvegarde automatique sur chaque changement d'état. */
  autoSave(state: GameState): () => void {
    this.save(state);
    return state.onChange(() => this.save(state));
  }
}
