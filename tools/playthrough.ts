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
import { resolveCombine } from '../src/engine/combine';
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
        // fin de l'Acte III (case C, Archives) : instantané de référence des Actes I–III
        const c3 = checkpoints.find((c) => c.label === 'utiliser formulaire sur photocopieuse');
        if (!c3) throw new Error('Acte III : trois exemplaires (case C) non joués');
        const s3 = GameState.fromSave(c3.save);
        // stub de la Station : objets à payoff différé gardés jusqu'à la fin provisoire
        for (const kept of ['ticket_douane', 'plante', 'ticket_9848', 'fragment', 'plan_station']) if (!s3.hasItem(kept)) throw new Error(`Station : « ${kept} » absent à la fin du stub`);
        // Acte II (docs/CHAPTER1.md §6.13–21) : archives → tampons → réclamations → copies → case A
        for (const f of ['st_cherche_gary', 'st_dossier_trouve', 'st_tamponnet', 'st_chatiere', 'st_papier', 'st_case_a', 'st_reclasse', 'st_sait_greve']) if (!state.hasFlag(f)) throw new Error(`Acte II : flag ${f} absent`);
        for (const kept of ['formulaire', 'tampon_annule', 'capsule']) if (!s3.hasItem(kept)) throw new Error(`Acte II : « ${kept} » absent à la fin`);
        for (const gone of ['badge', 'liasse', 'copies_dossier']) if (s3.hasItem(gone)) throw new Error(`Acte II : « ${gone} » encore en poche à la fin`);
        const caseA = checkpoints.find((c) => c.label === 'combiner copies_dossier + formulaire');
        if (!caseA || !caseA.save.flags.includes('st_reclasse') || caseA.save.items.includes('copies_dossier')) throw new Error('Acte II : case A sans reclassement ou copies non agrafées');
        // Acte III (docs/CHAPTER1.md §6.22–33) : grève → p.o. → café → encre → VU → réveil → signature → 3 exemplaires
        for (const f of ['st_greve_connue', 'st_voit_delegation', 'st_accord_signe', 'st_greve_finie', 'st_encreur_cafe', 'st_cafe2', 'st_tamponnet_encre', 'st_case_b', 'st_delaigue_reveille', 'st_case_d', 'st_case_c']) if (!state.hasFlag(f)) throw new Error(`Acte III : flag ${f} absent`);
        for (const gone of ['accord', 'encreur', 'gobelet', 'cuillere']) if (s3.hasItem(gone)) throw new Error(`Acte III : « ${gone} » encore en poche à la fin`);
        // encreur + gobelet sans la cuillère de la cafétéria : gag, rien n'est imbibé ni consommé
        const noSpoon = GameState.fromSave({ ...c3.save, flags: c3.save.flags.filter((f) => f !== 'st_encreur_cafe' && f !== 'st_gobelet_vide'), items: ['encreur', 'gobelet'] });
        const sets: string[] = [];
        for (const step of [resolveCombine(content, 'encreur', 'gobelet') ?? []].flat()) {
          if (typeof step === 'string' || !noSpoon.check(step.if)) continue;
          if (step.set) sets.push(...[step.set].flat());
          if (step.stop) break;
        }
        if (sets.includes('st_encreur_cafe')) throw new Error('Acte III : l\'encreur ne doit pas s\'imbiber sans la cuillère');
        const unsigned = checkpoints.find((c) => c.label === 'utiliser accord sur perco');
        if (!unsigned || unsigned.save.flags.includes('st_greve_finie') || !unsigned.save.items.includes('accord')) throw new Error('Acte III : un accord non signé ne doit pas finir la grève');
        const asleep = checkpoints.find((c) => c.label === 'utiliser formulaire sur delaigue');
        if (!asleep || asleep.save.flags.includes('st_case_d')) throw new Error('Acte III : Delaigue endormi ne doit pas signer');
        const cold = checkpoints.find((c) => c.label === 'utiliser fragment sur perco');
        if (!cold || cold.save.flags.includes('st_greve_finie')) throw new Error('Acte III : l\'éclat sur PERCO ne doit rien débloquer');
        const badgeEarly = checkpoints.find((c) => c.label === 'utiliser badge sur fichier');
        if (!badgeEarly || !badgeEarly.save.items.includes('badge') || badgeEarly.save.flags.includes('st_dossier_trouve')) throw new Error('Acte II : badge sur le fichier sans demande de recherche devait être refusé');
        const formEarly = checkpoints.find((c) => c.label === 'utiliser formulaire sur tamponnet');
        if (!formEarly || !formEarly.save.items.includes('formulaire') || formEarly.save.flags.includes('st_sait_greve')) throw new Error('Acte II : le formulaire ne doit jamais quitter l\'inventaire chez Tamponnet');
        const broyeuse = checkpoints.find((c) => c.label === 'utiliser liasse sur broyeuse');
        if (!broyeuse?.save.items.includes('liasse')) throw new Error('Acte II : la broyeuse ne doit pas consommer la liasse');
        const decoy = checkpoints.find((c) => c.label === 'utiliser ticket_douane sur distributeur');
        if (!decoy?.save.items.includes('ticket_douane')) throw new Error('fausse piste : le distributeur ne doit pas garder le ticket de douane');
        for (const f of ['st_arrive', 'st_laisse', 'st_ticket_9848']) if (!state.hasFlag(f)) throw new Error(`Station : flag ${f} absent`);
        // Aile B (fin de l'Acte I) : 47bis → couloir → plante → formulaire, M. Ficus rendu à Gary
        for (const f of ['st_acces_aile_b', 'st_couloir_boucle', 'st_plante_posee', 'st_couloir_resolu', 'st_formulaire']) if (!state.hasFlag(f)) throw new Error(`Aile B : flag ${f} absent`);
        if (!s3.hasItem('formulaire')) throw new Error('Aile B : le Formulaire B-7/12 devait être en poche');
        const posee = checkpoints.find((c) => c.label === 'utiliser plante sur emplacement');
        if (!posee || posee.save.items.includes('plante')) throw new Error('Aile B : M. Ficus devait quitter l\'inventaire une fois posé');
        const wrong = checkpoints.find((c) => c.label === 'utiliser porte_b3');
        if (!wrong || wrong.save.flags.includes('st_couloir_resolu')) throw new Error('Aile B : la mauvaise direction devait boucler');
        const early47 = checkpoints.find((c) => c.label === 'regarder lecteur');
        if (!early47 || early47.save.flags.includes('st_acces_aile_b')) throw new Error('Aile B : accès 47bis avant la conversation');
        // carte à la fin de l'Acte III (aux Archives) : bureaux warpables, ascenseur pas encore visité, fourrière refusée
        const map = parseStationMap(readFileSync(join(ROOT, 'content', 'station-map.yaml'), 'utf8'));
        const zone = (id: string) => map.bands.flatMap((b) => b.zones).find((z) => z.scene === id)!;
        const exists = (id: string) => content.scenes.has(id);
        const expect = { 'st-sas': 'open', 'st-attente': 'open', 'st-cafeteria': 'open', 'st-guichet': 'open', 'st-couloir-b': 'open', 'st-archives': 'here', 'st-reclamations': 'open', 'st-tampons': 'open', 'st-pause': 'open', 'st-sous-chef': 'open', 'st-ascenseur': 'seen', 'st-conseil': 'locked', 'st-fourriere': 'locked', 'st-direction': 'locked' } as const;
        // repérée et accessible mais jamais visitée : pas de warp (on y va à pied d'abord)
        const early = chapterStateAt(s3, 'st-sas', ['st-sas']);
        if (zoneState(early, zone('st-attente'), exists) !== 'seen') throw new Error('carte : salle d\'attente non visitée devrait être « seen »');
        // avant le ticket 9848 : guichet repéré (afficheur vu) mais refusé
        const pre = checkpoints.find((c) => c.label === 'utiliser plante');
        if (!pre || zoneState(GameState.fromSave(pre.save), zone('st-guichet'), exists) !== 'locked') throw new Error('carte : guichet avant le ticket 9848 devrait être « locked »');
        for (const [id, want] of Object.entries(expect)) {
          const got = zoneState(s3, zone(id), exists);
          if (got !== want) throw new Error(`carte : ${id} « ${got} » au lieu de « ${want} »`);
        }
        // Acte IV (docs/CHAPTER1.md §6.34–46) : Conseil, Direction, dépôt, restitution, fourrière, décollage
        for (const f of ['st_ascenseur_conseil', 'st_quorum_connu', 'st_ficus', 'st_vote_perco', 'st_vote_egalite', 'st_case_e', 'st_ascenseur_direction', 'st_sylvie_refuse', 'st_dossier_depose', 'st_coffre_ouvert', 'st_eclat2', 'st_amende', 'st_vaisseau_libere', 'st_termine']) if (!state.hasFlag(f)) throw new Error(`Acte IV : flag ${f} absent`);
        for (const kept of ['badge', 'fragment', 'tampon_annule']) if (!state.hasItem(kept)) throw new Error(`Acte IV : « ${kept} » absent à la fin`);
        for (const gone of ['plante', 'capsule', 'formulaire', 'ticket_douane', 'permis']) if (state.hasItem(gone)) throw new Error(`Acte IV : « ${gone} » encore en poche à la fin`);
        const early4 = checkpoints.find((c) => c.label === 'utiliser fragment sur coffre');
        if (!early4 || early4.save.flags.includes('st_eclat2')) throw new Error('Acte IV : l\'éclat sur le coffre avant le dépôt ne doit rien ouvrir');
        const closed = checkpoints.find((c) => c.label === 'utiliser formulaire sur guichard');
        if (!closed || closed.save.flags.includes('st_dossier_depose') || !closed.save.items.includes('formulaire')) throw new Error('Acte IV : dépôt accepté guichet fermé');
        const urne = checkpoints.find((c) => c.label === 'utiliser tampon_annule sur urne');
        if (!urne || urne.save.flags.includes('st_case_e')) throw new Error('Acte IV : annulation acceptée avant le vote');
        const boot = checkpoints.find((c) => c.label === 'utiliser permis sur capsule_vaisseau');
        if (!boot || !boot.save.items.includes('permis') || boot.save.ended) throw new Error('Acte IV : décollage avec le sabot');
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
