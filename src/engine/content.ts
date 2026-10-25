// Chargement / parsing du contenu. Pur TypeScript, partagé avec l'outil de validation.
import { parse } from 'yaml';
import type { Action, CharacterDef, GameContent, Interaction, ItemDef, SceneDef } from './types';

export interface RawContent {
  /** chemin → texte YAML */
  scenes: Record<string, string>;
  items: string;
  game: string;
  /** chemin → source Ink */
  ink: Record<string, string>;
}

export interface InkFileSpan {
  file: string;
  startLine: number; // 1-indexé, dans la source concaténée
  lineCount: number;
}

/** Concatène les fichiers Ink (ordre alphabétique, `_*.ink` en premier). */
export function assembleInk(files: Record<string, string>): { source: string; spans: InkFileSpan[] } {
  const paths = Object.keys(files).sort((a, b) => {
    const an = basename(a).startsWith('_') ? 0 : 1;
    const bn = basename(b).startsWith('_') ? 0 : 1;
    return an - bn || a.localeCompare(b);
  });
  const spans: InkFileSpan[] = [];
  const chunks: string[] = [];
  let line = 1;
  for (const p of paths) {
    const text = files[p].replace(/\r\n/g, '\n').replace(/\n*$/, '\n');
    const lineCount = text.split('\n').length - 1;
    spans.push({ file: p, startLine: line, lineCount });
    chunks.push(text);
    line += lineCount;
  }
  return { source: chunks.join(''), spans };
}

/** Convertit « line N » de la source concaténée en « fichier:ligne ». */
export function locateInkLine(spans: InkFileSpan[], line: number): string {
  const s = spans.find((sp) => line >= sp.startLine && line < sp.startLine + sp.lineCount);
  return s ? `${s.file}:${line - s.startLine + 1}` : `ligne ${line}`;
}

function basename(p: string): string {
  return p.split('/').pop() ?? p;
}

export function parseContent(raw: RawContent): GameContent {
  const scenes = new Map<string, SceneDef>();
  for (const [path, text] of Object.entries(raw.scenes)) {
    const def = parse(text) as SceneDef;
    if (!def || typeof def.id !== 'string') throw new Error(`${path} : champ "id" manquant`);
    if (scenes.has(def.id)) throw new Error(`${path} : scène "${def.id}" définie deux fois`);
    def.hotspots ??= [];
    def.exits ??= [];
    scenes.set(def.id, def);
  }

  const items = new Map<string, ItemDef>();
  const itemList = (parse(raw.items) as { items: ItemDef[] }).items ?? [];
  for (const it of itemList) items.set(it.id, it);

  const game = parse(raw.game) as { startScene: string; characters: CharacterDef[] };
  const characters = new Map<string, CharacterDef>();
  for (const c of game.characters ?? []) characters.set(c.id, c);

  return {
    scenes,
    items,
    characters,
    startScene: game.startScene,
    inkSource: assembleInk(raw.ink).source,
  };
}

/** Normalise une interaction en liste d'actions. */
export function toActions(i: Interaction | undefined): Action[] {
  if (i === undefined || i === null) return [];
  if (typeof i === 'string') return [{ say: i }];
  return i;
}
