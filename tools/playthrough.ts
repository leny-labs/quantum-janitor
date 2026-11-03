/**
 * Partie scriptée sans navigateur : rejoue la solution complète de chaque chapitre (CHAPTERS)
 * avec le vrai moteur (ActionRunner + DialogueRunner) et vérifie qu'on atteint
 * le cliffhanger.   npm run playthrough   (ajouter -- -v pour voir les dialogues)
 * `-- lang=en` applique d'abord le catalogue content/locales/en.yaml : même
 * solution, mêmes flags, textes traduits (vérifie que l'i18n ne casse rien).
 * La solution elle-même vit dans src/engine/walkthrough.ts (partagée avec /creator).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseContent } from '../src/engine/content';
import { localizeContent, parseCatalog } from '../src/engine/localize';
import { CHAPTERS, walkChapter } from '../src/engine/walkthrough';
import { ROOT, readRawContent } from './readContent';

const verbose = process.argv.includes('-v');
const content = parseContent(readRawContent());
const lang = process.argv.find((a) => a.startsWith('lang='))?.slice(5);
if (lang) localizeContent(content, parseCatalog(readFileSync(join(ROOT, 'content', 'locales', `${lang}.yaml`), 'utf8')));

async function main() {
  for (const chapter of CHAPTERS) {
    let current = '';
    try {
      const { checkpoints, state, ended } = await walkChapter(content, chapter, {
        log: verbose ? (l) => console.log(l) : undefined,
        onStep: (label) => console.log(label.startsWith('→') ? label : `· ${(current = label)}`),
      });
      const sandwich = checkpoints.find((c) => c.label === 'utiliser sandwich sur bob');
      if (sandwich && !sandwich.save.items.includes('badge')) throw new Error('pas de badge après le sandwich');
      // ch.1 : l'éclat du Réacteur doit être dans l'inventaire avant le couronnement
      const plouf = checkpoints.find((c) => c.label === 'utiliser seau sur eclat');
      if (chapter.id === 'ch1') {
        if (!plouf?.save.items.includes('fragment')) throw new Error('pas d\'éclat (fragment) après le PLOUF');
        if (plouf.save.items.includes('seau') || !plouf.save.flags.includes('ch1_seau_perdu')) throw new Error('le seau devait rester au Temple après le PLOUF');
        const josiane = checkpoints.find((c) => c.label === 'utiliser serpilliere sur distributeur');
        if (josiane?.save.items.includes('serpilliere') || !josiane?.save.flags.includes('ch1_josiane_coincee')) throw new Error('Josiane devait rester coincée dans le distributeur');
        // fin : ni seau ni Josiane, l'éclat contenu et la combi de chitine
        for (const gone of ['seau', 'serpilliere']) if (state.hasItem(gone)) throw new Error(`« ${gone} » encore dans l'inventaire à la fin`);
        for (const kept of ['fragment', 'combi_chitine']) if (!state.hasItem(kept)) throw new Error(`« ${kept} » absent de l'inventaire à la fin`);
        if (!state.hasFlag('ch1_combi')) throw new Error('flag ch1_combi absent à la fin');
      }
      if (ended !== chapter.endKnot) throw new Error(`fin non atteinte (ended=${ended})`);
      console.log(`\n✓ ${chapter.title} terminé — cliffhanger « ${ended} » atteint (${checkpoints.length} checkpoints).`);
      console.log(`  flags : ${[...state.flags].join(', ')}`);
    } catch (e) {
      console.error(`\n✗ ${chapter.title} — ${(e as Error).message}${current ? `\n  dernière étape : ${current}` : ''}`);
      process.exit(1);
    }
  }
}

void main();
