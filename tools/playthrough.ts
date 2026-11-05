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
import { GameState } from '../src/engine/GameState';
import { parseStationMap, zoneState } from '../src/engine/stationMap';
import { concluded, deduce, hasCarnet, knownClues } from '../src/engine/clues';
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

/** Copie de l'état, dans `scene`, avec seulement `visited` comme pièces visitées. */
function chapterStateAt(s: GameState, scene: string, visited: string[]): GameState {
  const c = GameState.fromSave({ ...s.toSave(), scene, visited });
  return c;
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
      if (chapter.id === 'ch1') {
        // interlude : la combi est enfilée (elle quitte l'inventaire), l'éclat et le badge restent
        const jump = checkpoints.find((c) => c.label === 'utiliser fragment sur reacteur');
        if (!jump) throw new Error('saut de l\'interlude non joué');
        for (const f of ['combi_portee', 'iv_saut', 'iv_vu']) if (!jump.save.flags.includes(f)) throw new Error(`interlude : flag ${f} absent après le saut`);
        if (jump.save.items.includes('combi_chitine')) throw new Error('interlude : la combi devait être enfilée (hors inventaire)');
        for (const kept of ['fragment', 'badge']) if (!jump.save.items.includes(kept)) throw new Error(`interlude : « ${kept} » perdu`);
        if (state.hasFlag('ch1')) throw new Error('la Station ne doit jamais poser le flag ch1 (acte Blattaria)');
        // stub de la Station : objets à payoff différé gardés jusqu'à la fin provisoire
        for (const kept of ['ticket_douane', 'plante', 'ticket_9848', 'fragment', 'badge', 'plan_station']) if (!state.hasItem(kept)) throw new Error(`Station : « ${kept} » absent à la fin du stub`);
        const decoy = checkpoints.find((c) => c.label === 'utiliser ticket_douane sur distributeur');
        if (!decoy?.save.items.includes('ticket_douane')) throw new Error('fausse piste : le distributeur ne doit pas garder le ticket de douane');
        for (const f of ['st_arrive', 'st_laisse', 'st_ticket_9848']) if (!state.hasFlag(f)) throw new Error(`Station : flag ${f} absent`);
        // carte : les salles du stub warpables (on finit au guichet), la fourrière refusée, la Direction inconnue
        const map = parseStationMap(readFileSync(join(ROOT, 'content', 'station-map.yaml'), 'utf8'));
        const zone = (id: string) => map.bands.flatMap((b) => b.zones).find((z) => z.scene === id)!;
        const exists = (id: string) => content.scenes.has(id);
        const expect = { 'st-sas': 'open', 'st-attente': 'open', 'st-cafeteria': 'open', 'st-guichet': 'here', 'st-fourriere': 'locked', 'st-direction': 'unknown' } as const;
        // repérée et accessible mais jamais visitée : pas de warp (on y va à pied d'abord)
        const early = chapterStateAt(state, 'st-sas', ['st-sas']);
        if (zoneState(early, zone('st-attente'), exists) !== 'seen') throw new Error('carte : salle d\'attente non visitée devrait être « seen »');
        // avant le ticket 9848 : guichet repéré (afficheur vu) mais refusé
        const pre = checkpoints.find((c) => c.label === 'utiliser plante');
        if (!pre || zoneState(GameState.fromSave(pre.save), zone('st-guichet'), exists) !== 'locked') throw new Error('carte : guichet avant le ticket 9848 devrait être « locked »');
        for (const [id, want] of Object.entries(expect)) {
          const got = zoneState(state, zone(id), exists);
          if (got !== want) throw new Error(`carte : ${id} « ${got} » au lieu de « ${want} »`);
        }
        // carnet de déduction : la chaîne de l'horloge ouvre le guichet (docs/CHAPTER1.md)
        const carnet = content.carnet!;
        const start = GameState.fromSave(checkpoints.find((c) => c.label.startsWith('début'))!.save);
        if (hasCarnet(start, carnet)) throw new Error('carnet : aucun indice attendu à l\'arrivée dans l\'interlude');
        const firstClue = checkpoints.find((c) => hasCarnet(GameState.fromSave(c.save), carnet));
        if (!firstClue) throw new Error('carnet : jamais d\'indice noté');
        for (const f of ['st_voit_horaires', 'st_deduit_minute', 'st_deduit_horloge', 'st_guichet_ouvert', 'st_guichard_rupture', 'st_deduit_formulaire']) {
          if (!state.hasFlag(f)) throw new Error(`carnet : flag ${f} absent à la fin`);
        }
        // l'horloge ne s'ouvre pas sans la déduction D2
        const tremble = checkpoints.find((c) => c.label === 'utiliser fragment sur horloge');
        if (!tremble || tremble.save.flags.includes('st_guichet_ouvert') || !tremble.save.flags.includes('st_horloge_tremble')) throw new Error('carnet : l\'éclat sans déduction devait seulement faire trembler l\'horloge');
        const d1 = checkpoints.find((c) => c.label === 'déduire horloge_1011 + horaires')!;
        const atD1 = GameState.fromSave(d1.save);
        if (deduce(atD1, carnet, 'horaires', 'horloge_1011').kind !== 'already') throw new Error('carnet : D1 devrait être conclue (ordre libre)');
        if (deduce(atD1, carnet, 'ticket_9848', 'horaires').kind !== 'rejected') throw new Error('carnet : mauvaise paire acceptée');
        if (deduce(atD1, carnet, 'guichet_ouvert', 'guichard_rupture').kind !== 'rejected') throw new Error('carnet : pièce non notée acceptée');
        const clues = knownClues(state, carnet).length;
        console.log(`✓ carnet : ${clues}/${carnet.clues.length} indices, ${concluded(state, carnet).length}/${carnet.deductions.length} conclusions, guichet ouvert à 10 h 12`);
      }
      if (chapter.endFlag) {
        if (!state.hasFlag(chapter.endFlag)) throw new Error(`fin provisoire non atteinte (flag ${chapter.endFlag} absent)`);
        if (ended) throw new Error(`stub ouvert : aucun cliffhanger attendu (ended=${ended})`);
        console.log(`\n✓ ${chapter.title} — fin provisoire en salle (${chapter.endFlag}, ${state.scene}) atteinte (${checkpoints.length} checkpoints).`);
      } else {
        if (ended !== chapter.endKnot) throw new Error(`fin non atteinte (ended=${ended})`);
        console.log(`\n✓ ${chapter.title} terminé — cliffhanger « ${ended} » atteint (${checkpoints.length} checkpoints).`);
      }
      console.log(`  flags : ${[...state.flags].join(', ')}`);
    } catch (e) {
      console.error(`\n✗ ${chapter.title} — ${(e as Error).message}${current ? `\n  dernière étape : ${current}` : ''}`);
      process.exit(1);
    }
  }
}

void main();
