// Lecture du dossier content/ depuis Node (outils).
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { RawContent } from '../src/engine/content';

export const ROOT = join(import.meta.dirname, '..');
const CONTENT = join(ROOT, 'content');

function readDir(dir: string, ext: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of readdirSync(dir).filter((f) => f.endsWith(ext)).sort()) {
    const p = join(dir, f);
    out[relative(ROOT, p)] = readFileSync(p, 'utf8');
  }
  return out;
}

export function readRawContent(): RawContent {
  return {
    scenes: readDir(join(CONTENT, 'scenes'), '.yaml'),
    ink: readDir(join(CONTENT, 'story'), '.ink'),
    items: readFileSync(join(CONTENT, 'items.yaml'), 'utf8'),
    game: readFileSync(join(CONTENT, 'game.yaml'), 'utf8'),
  };
}
