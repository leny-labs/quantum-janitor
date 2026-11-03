/**
 * Vérif headless des bruitages de props physiques (engine/propSfx.ts) : pour chaque
 * hotspot actionnable, calcule le son joué au « use » dans l'état « normal » et dans
 * l'état « hors tension / refusé » (`sfxDud` vrai). Échoue si un prop physique attendu
 * reste silencieux dans l'un des deux cas, ou si un hotspot `press` n'a aucun son.
 *   npm run check:sfx
 */
import { parseContent } from '../src/engine/content';
import { GameState } from '../src/engine/GameState';
import { propSfx, type PressGesture } from '../src/engine/propSfx';
import type { Condition, Hotspot } from '../src/engine/types';
import { readRawContent } from './readContent';

/** Props physiques connus (scène/hotspot → geste du mesh `pressable` dans three/rooms, s'il y en a). */
const PHYSICAL: Record<string, PressGesture> = {
  'panneau/bouton': 'button',
  'interlude-vaisseau/tableau': null,
  'interlude-vaisseau/bouton_npa': 'button',
  'interlude-vaisseau/bouton_hyper': 'button',
  'interlude-vaisseau/bouton_eject': 'button',
  'interlude-vaisseau/bouton_auto': 'button',
  'interlude-vaisseau/levier': 'lever',
  'interlude-vaisseau/navigateur': null,
  'interlude-vaisseau/dest_miniature': 'button',
  'interlude-vaisseau/dest_klepsydra': 'button',
  'interlude-vaisseau/dest_yaourt': 'button',
  'interlude-vaisseau/dest_station': 'button',
  'st-attente/distributeur': null,
  'st-sas/portique': null,
  'st-sas/borne': null,
};

/** État où `c` est vrai (flags/objets requis posés, les autres absents). */
function stateWhere(c: Condition | undefined): GameState {
  const s = new GameState('x');
  c?.flags?.forEach((f) => s.flags.add(f));
  c?.items?.forEach((i) => s.items.push(i));
  return s;
}
/** État où `c` est faux (on viole le premier critère). */
function stateWhereNot(c: Condition | undefined): GameState {
  const s = new GameState('x');
  if (!c) return s;
  if (c.notFlags?.length) s.flags.add(c.notFlags[0]);
  else if (c.notItems?.length) s.items.push(c.notItems[0]);
  // flags/items requis absents → faux
  if (c.notFlags?.length || c.notItems?.length) {
    c.flags?.forEach((f) => s.flags.add(f));
    c.items?.forEach((i) => s.items.push(i));
  }
  return s;
}

const content = parseContent(readRawContent());
const errors: string[] = [];
const rows: string[] = [];
const seen = new Set<string>();

for (const scene of content.scenes.values()) {
  for (const h of scene.hotspots as Hotspot[]) {
    if (!h.use) continue;
    const key = `${scene.id}/${h.id}`;
    const gesture = PHYSICAL[key];
    const physical = key in PHYSICAL;
    const on = propSfx(h, stateWhereNot(h.sfxDud), gesture);
    const off = h.sfxDud ? propSfx(h, stateWhere(h.sfxDud), gesture) : on;
    if (!physical && !on && !off) continue;
    seen.add(key);
    rows.push(`${key.padEnd(36)} ${(gesture ?? '—').padEnd(7)} ${String(on).padEnd(6)} ${off === on ? '(idem)' : off}`);
    if ((physical || h.useIcon === 'press') && (!on || !off)) errors.push(`${key} : silencieux (normal=${on}, hors tension/refus=${off})`);
  }
}
for (const k of Object.keys(PHYSICAL)) if (!seen.has(k)) errors.push(`${k} : hotspot introuvable ou sans « use »`);

console.log(`${'hotspot'.padEnd(36)} ${'geste'.padEnd(7)} ${'son'.padEnd(6)} hors tension / refusé`);
rows.forEach((r) => console.log(r));
if (errors.length) {
  console.error(`\n✗ ${errors.length} problème(s) :\n` + errors.join('\n'));
  process.exit(1);
}
console.log(`\n✓ ${rows.length} prop(s) actionnable(s), tous sonorisés.`);
