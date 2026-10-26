// Compilation Ink partagée (navigateur + outil de validation).
import { Compiler, CompilerOptions, Story } from 'inkjs/full';

export const INK_EXTERNALS = ['has_item', 'has_flag'] as const;

export function compileInk(source: string): { story: Story | null; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const compiler = new Compiler(
    source,
    new CompilerOptions(null, [], true, (msg: string, type: number) => {
      // ErrorType : 0 = Author, 1 = Warning, 2 = Error
      if (type === 2) errors.push(msg);
      else warnings.push(msg);
    }),
  );
  let story: Story | null = null;
  try {
    story = compiler.Compile();
  } catch (e) {
    if (errors.length === 0) errors.push(String(e));
  }
  return { story: errors.length ? null : story, errors, warnings };
}

/** Tags reconnus dans l'Ink : `# give: badge`, `# set: flag`, `# shake`, `# mood: angry`… */
export interface InkTag {
  key: string;
  value: string;
}

export function parseTag(raw: string): InkTag {
  const m = raw.trim().match(/^([a-z_]+)\s*(?::\s*(.*))?$/i);
  if (!m) return { key: raw.trim(), value: '' };
  return { key: m[1].toLowerCase(), value: (m[2] ?? '').trim() };
}

export const INK_TAG_KEYS = ['give', 'take', 'set', 'unset', 'goto', 'end', 'shake', 'mood'] as const;
