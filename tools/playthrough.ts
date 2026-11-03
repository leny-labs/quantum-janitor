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
import { migrateSave, SAVE_VERSION } from '../src/engine/saveMigration';
import type { SaveData } from '../src/engine/types';
import { CHAPTERS, walkChapter } from '../src/engine/walkthrough';
import { ROOT, readRawContent } from './readContent';

const verbose = process.argv.includes('-v');
const content = parseContent(readRawContent());
const lang = process.argv.find((a) => a.startsWith('lang='))?.slice(5);
if (lang) localizeContent(content, parseCatalog(readFileSync(join(ROOT, 'content', 'locales', `${lang}.yaml`), 'utf8')));

/** Migration des sauvegardes v1 → v2 (fusion ch.0 + Blattaria, docs/CHAPTERS.md §3.3). */
function checkMigration(): void {
  const v1 = (o: Partial<SaveData>): SaveData => ({ version: 1, scene: 'placard', flags: [], items: [], visited: [], ended: false, ...o });
  const eq = (what: string, a: unknown, b: unknown) => {
    if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`migration ${what} : ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`);
  };
  const nid = migrateSave(v1({ chapter: 'ch1', scene: 'nid-royal', flags: ['ch1', 'chapitre0_termine', 'ch1_audience'], items: ['serpilliere', 'badge'] }))!;
  eq('v1 ch1 au Nid → chapitre', nid.chapter, 'ch0');
  eq('v1 ch1 au Nid → scène', nid.scene, 'nid-royal');
  eq('v1 ch1 au Nid → flags', nid.flags, ['ch1', 'chapitre0_termine', 'ch1_audience']);
  eq('v1 → version', nid.version, SAVE_VERSION);
  const done = migrateSave(v1({ chapter: 'ch1', scene: 'nid-royal', ended: true, flags: ['ch1', 'ch1_combi', 'chapitre1_termine'], items: ['fragment', 'combi_chitine'] }))!;
  eq('v1 ch1 terminée → chapitre', done.chapter, 'ch0');
  eq('v1 ch1 terminée → flags', done.flags, ['ch1', 'ch1_combi', 'ch0_termine']);
  eq('v1 ch1 terminée → ended', done.ended, true);
  const none = migrateSave(v1({ scene: 'couloir', flags: ['bob_suit'] }))!;
  eq('v1 sans chapitre', [none.chapter, none.scene, none.flags], [undefined, 'couloir', ['bob_suit']]);
  const st: SaveData = { version: 2, chapter: 'ch1', scene: 'st-sas', flags: ['st'], items: ['badge'], visited: ['st-sas'], ended: false };
  eq('v2 ch1 Station intacte', migrateSave(st), st);
  eq('format inconnu', migrateSave({ version: 9, scene: 'x', flags: [], items: [] }), null);
  console.log('✓ migration des sauvegardes v1 → v2 (4 cas)');
}

async function main() {
  checkMigration();
  for (const chapter of CHAPTERS) {
    let current = '';
    try {
      const { checkpoints, state, ended } = await walkChapter(content, chapter, {
        log: verbose ? (l) => console.log(l) : undefined,
        onStep: (label) => console.log(label.startsWith('→') ? label : `· ${(current = label)}`),
      });
      const sandwich = checkpoints.find((c) => c.label === 'utiliser sandwich sur bob');
      if (sandwich && !sandwich.save.items.includes('badge')) throw new Error('pas de badge après le sandwich');
      // acte Blattaria (ch.0) : l'éclat du Réacteur doit être dans l'inventaire avant le couronnement
      const plouf = checkpoints.find((c) => c.label === 'utiliser seau sur eclat');
      if (chapter.id === 'ch0') {
        // coupure d'acte Klepsydra → Blattaria : état propre (Josiane + badge), flags d'acte, intro du Nid
        const cut = checkpoints.find((c) => c.kind === 'act');
        if (!cut) throw new Error('coupure d\'acte (cafards → Blattaria) non traversée');
        if (cut.save.scene !== 'nid-royal' || cut.save.ended) throw new Error(`coupure d'acte : scène ${cut.save.scene}, ended=${cut.save.ended}`);
        if (cut.save.items.join(',') !== 'serpilliere,badge') throw new Error(`coupure d'acte : inventaire ${cut.save.items.join(',')}`);
        for (const f of ['ch1', 'chapitre0_termine']) if (!cut.save.flags.includes(f)) throw new Error(`coupure d'acte : flag ${f} absent`);
        if (cut.save.flags.includes('serpilliere_mouillee')) throw new Error('coupure d\'acte : flags de Klepsydra non nettoyés');
        if (!plouf?.save.items.includes('fragment')) throw new Error('pas d\'éclat (fragment) après le PLOUF');
        if (plouf.save.items.includes('seau') || !plouf.save.flags.includes('ch1_seau_perdu')) throw new Error('le seau devait rester au Temple après le PLOUF');
        // (même libellé à l'acte I, au distributeur du couloir : on cherche après la coupure d'acte)
        const josiane = checkpoints.slice(cut.index).find((c) => c.label === 'utiliser serpilliere sur distributeur');
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
