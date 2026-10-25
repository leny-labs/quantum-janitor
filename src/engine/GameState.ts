import type { Condition, SaveData } from './types';

type Listener = () => void;

/** État mutable de la partie : scène courante, flags, inventaire. */
export class GameState {
  scene: string;
  flags = new Set<string>();
  items: string[] = [];
  visited = new Set<string>();
  ended = false;
  inkState?: string;
  /** Objet actuellement sélectionné dans l'inventaire (non sauvegardé). */
  selectedItem: string | null = null;

  private listeners: Listener[] = [];

  constructor(startScene: string) {
    this.scene = startScene;
  }

  onChange(fn: Listener): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  emit(): void {
    for (const l of [...this.listeners]) l();
  }

  hasFlag(f: string): boolean {
    return this.flags.has(f);
  }

  hasItem(i: string): boolean {
    return this.items.includes(i);
  }

  setFlag(f: string): void {
    if (this.flags.has(f)) return;
    this.flags.add(f);
    this.emit();
  }

  unsetFlag(f: string): void {
    if (this.flags.delete(f)) this.emit();
  }

  give(item: string): void {
    if (this.items.includes(item)) return;
    this.items.push(item);
    this.emit();
  }

  take(item: string): void {
    const i = this.items.indexOf(item);
    if (i < 0) return;
    this.items.splice(i, 1);
    if (this.selectedItem === item) this.selectedItem = null;
    this.emit();
  }

  select(item: string | null): void {
    this.selectedItem = item;
    this.emit();
  }

  check(c: Condition | undefined): boolean {
    if (!c) return true;
    return (
      (c.flags ?? []).every((f) => this.flags.has(f)) &&
      (c.notFlags ?? []).every((f) => !this.flags.has(f)) &&
      (c.items ?? []).every((i) => this.items.includes(i)) &&
      (c.notItems ?? []).every((i) => !this.items.includes(i))
    );
  }

  toSave(): SaveData {
    return {
      version: 1,
      scene: this.scene,
      flags: [...this.flags],
      items: [...this.items],
      visited: [...this.visited],
      ended: this.ended,
      inkState: this.inkState,
    };
  }

  static fromSave(d: SaveData): GameState {
    const s = new GameState(d.scene);
    s.flags = new Set(d.flags);
    s.items = [...d.items];
    s.visited = new Set(d.visited);
    s.ended = d.ended;
    s.inkState = d.inkState;
    return s;
  }
}
