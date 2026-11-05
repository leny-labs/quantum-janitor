// Solution scriptée des chapitres, rejouée avec le vrai moteur (ActionRunner +
// DialogueRunner) sans Phaser.
//
// Numérotation (docs/CHAPTERS.md) : `ch0` « Le Seau » = acte I Klepsydra-9 + acte II
// Blattaria Prime ; `ch1` = la Station Bureaucratique (scènes `st-*`, flags `st_*`).
// Préfixe `ch1_` / `ch1-` = acte Blattaria du chapitre 0 (historique, pas renommé). Partagée par tools/playthrough.ts (vérifie qu'on
// atteint la fin) et la page debug /creator (un checkpoint = un instantané de
// sauvegarde après chaque étape).
import { ActionRunner, type ActionHost } from './ActionRunner';
import { resolveCombine } from './combine';
import { deduce } from './clues';
import { DialogueRunner, type DialogueView } from './DialogueRunner';
import { GameState } from './GameState';
import type { GameContent, Interaction, SaveData } from './types';

/**
 * `pick` : choix Ink à prendre, dans l'ordre, pendant l'étape (index 0-basés) ; au-delà,
 * le curseur cyclique habituel. Indispensable pour les menus en boucle (interlude).
 */
export type WalkStep =
  | { section: string }
  | { look: string; pick?: number[] }
  | { use: string; pick?: number[] }
  | { talk: string; pick?: number[] }
  | { useItem: [item: string, hotspot: string]; pick?: number[] }
  | { combine: [a: string, b: string] }
  /** Carnet de déduction (ch.1) : rapprocher deux pièces (indices / conclusions, engine/clues.ts). */
  | { deduce: [a: string, b: string] }
  | { go: string };

/**
 * Acte d'un chapitre. Le premier acte commence à `startScene` du chapitre ; les suivants
 * commencent par une **coupure d'acte** : quand le knot de fin `breakKnot` est atteint
 * (`# end: cafards`), le jeu ne termine pas le chapitre — EndScene joue le cliffhanger en
 * mode « acte », affiche la carte d'acte, puis `enterAct` et la pièce `startScene`.
 */
export interface ActDef {
  id: string;
  title: string;
  startScene: string;
  /** Knot `# end:` qui ouvre cet acte (cliffhanger de l'acte précédent). */
  breakKnot?: string;
  /** État propre à l'entrée de l'acte : inventaire et flags **remplacés** (les objets tombés dans la faille disparaissent). */
  enter?: { items?: string[]; flags?: string[] };
}

export interface ChapterDef {
  id: string;
  title: string;
  /** Scène de départ d'une nouvelle partie de ce chapitre. */
  startScene: string;
  /** État initial propre du chapitre (rien d'autre n'est hérité des chapitres précédents). */
  initial?: { items?: string[]; flags?: string[] };
  /** Knot de fin attendu (cliffhanger). */
  endKnot: string;
  /**
   * Chapitre encore ouvert (stub) : la solution s'arrête dès que ce flag est posé, sans
   * cliffhanger (`endKnot` non joué). Le playthrough vérifie alors ce flag au lieu du knot.
   */
  endFlag?: string;
  /** Actes (le premier = départ du chapitre) ; voir `ActDef`. */
  acts?: ActDef[];
  /**
   * Chapitre précédent dont l'écran de fin lance celui-ci (bouton « Chapitre N → »,
   * `END_BY_CHAPTER[from].next` dans EndScene) : /creator affiche cette transition en
   * tête de timeline (voir `chapterPrelude`).
   */
  from?: string;
  steps: WalkStep[];
}

export const CHAPTERS: ChapterDef[] = [
  {
    id: 'ch0',
    title: 'Chapitre 0 : Le Seau',
    startScene: 'placard',
    // fin du chapitre = fin de Blattaria (couronnement + faille) ; `cafards` n'est qu'une coupure d'acte
    endKnot: 'ch1_suite',
    acts: [
      { id: 'klepsydra', title: 'Acte I — Klepsydra-9', startScene: 'placard' },
      {
        id: 'blattaria',
        title: 'Acte II — Blattaria Prime',
        startScene: 'nid-royal',
        breakKnot: 'cafards',
        // arrivé par la faille avec Josiane et le badge ; le seau est passé avant lui,
        // le sandwich et le fusible sont restés sur Klepsydra
        enter: { items: ['serpilliere', 'badge'], flags: ['ch1', 'chapitre0_termine'] },
      },
    ],
    steps: [
      { section: 'Acte I · Puzzle 1 : le badge' },
      { use: 'seau' },
      { use: 'serpilliere' },
      { talk: 'bob' },
      { go: 'couloir' },
      { useItem: ['serpilliere', 'distributeur'] },
      { go: 'placard' },
      { useItem: ['sandwich', 'bob'] },
      { section: 'Acte I · Puzzle 2 : ouvrir le labo' },
      { go: 'couloir' },
      { useItem: ['badge', 'lecteur'] }, // refusé : encrassé
      { combine: ['serpilliere', 'seau'] },
      { useItem: ['serpilliere', 'lecteur'] },
      { useItem: ['badge', 'lecteur'] },
      { go: 'labo' },
      { section: 'Acte I · « Réparer » le réacteur' },
      { go: 'panneau' },
      { look: 'logement' },
      { go: 'labo' },
      { go: 'couloir' },
      { use: 'fusibles' },
      { go: 'labo' },
      { go: 'panneau' },
      { useItem: ['fusible', 'logement'] },
      { go: 'labo' },
      { talk: 'bob' },
      { useItem: ['seau', 'trappe'] },
      { go: 'panneau' },
      { use: 'bouton' }, // le réacteur rit (reacteur_rit)
      { use: 'bouton' }, // clic direct « plus fort » : Clonk. Clonk. CLONK. → cliffhanger cafards
      { section: 'Acte II · Puzzle 1 : le Signe aux deux R' },
      { talk: 'reine' },
      { use: 'autel' }, // refusé : les gardes
      { go: 'galerie-des-offrandes' },
      { look: 'fresque' },
      { useItem: ['badge', 'scribe'] }, // refusé : sent le thon
      { useItem: ['serpilliere', 'bassin'] },
      { combine: ['serpilliere', 'badge'] },
      { useItem: ['badge', 'scribe'] },
      { go: 'nid-royal' },
      { talk: 'reine' },
      { section: 'Acte II · Puzzle 2 : la Foule' },
      { go: 'galerie-des-offrandes' },
      { look: 'foule' },
      { use: 'grenier' }, // à mains nues : non
      { useItem: ['seau', 'grenier'] },
      { useItem: ['seau', 'foule'] },
      { section: 'Acte II · Puzzle 3 : tenir l\'éclat, refermer la faille' },
      { go: 'temple-couloir' },
      { look: 'distributeur' },
      { useItem: ['serpilliere', 'distributeur'] }, // Josiane reste coincée
      { look: 'distributeur' },
      { go: 'galerie-des-offrandes' },
      { useItem: ['seau', 'bassin'] },
      { go: 'temple-couloir' },
      { go: 'coeur-eclat' },
      { look: 'jauge' },
      { useItem: ['seau', 'eclat'] }, // le seau contient la faille et reste là
      { look: 'seau_sacre' },
      { go: 'temple-couloir' },
      { go: 'galerie-des-offrandes' },
      { go: 'nid-royal' },
      { useItem: ['fragment', 'reine'] },
    ],
  },
  {
    id: 'ch1',
    title: 'Chapitre 1 : La Station Bureaucratique',
    // interlude du mini-vaisseau (docs/INTERLUDE_VAISSEAU.md), puis la Station (scènes `st-*`)
    startScene: 'interlude-vaisseau',
    from: 'ch0',
    // ch.0 fini : éclat contenu, combi de chitine (enfilée dans l'interlude), badge ; B.O.B. suit
    initial: { items: ['badge', 'fragment', 'combi_chitine'], flags: ['st', 'ch0_termine', 'chapitre0_termine', 'bob_suit'] },
    // fin du chapitre : permis sur la capsule à la fourrière (`end: st_suite`, EndScene, flag st_termine)
    endKnot: 'st_suite',
    steps: [
      { section: 'Interlude — la Capsule de Service CS-07' },
      { look: 'pare_brise' },
      { useItem: ['badge', 'contact'] },
      { useItem: ['combi_chitine', 'siege'] },
      { talk: 'bob' },
      // boutons du tableau de bord en clic direct : NE PAS APPUYER, AUTOPILOTE, puis le levier sans étiquette
      { use: 'bouton_npa' },
      { use: 'bouton_auto' },
      { use: 'levier' },
      // destinations du navigateur en clic direct : Dimension Miniature (refusée), puis la Station
      { use: 'dest_miniature' },
      { use: 'dest_station' },
      { useItem: ['fragment', 'reacteur'] },
      { section: 'Station · le Sas d\'Arrivée (animal de compagnie)' },
      { talk: 'bob' }, // indice vague : « tout le monde a un ticket »
      { look: 'portique' },
      { use: 'portique' }, // +ticket_douane (payoff différé : la fourrière, fin du ch.1)
      { talk: 'guerite' }, // M. Sabot : « ticket d'entrée + permis de la Direction » (objectif final semé)
      { look: 'borne' }, // « les animaux doivent être accompagnés »
      { use: 'borne' }, // +plan_station : la carte de la Station (bouton PLAN, warp)
      { talk: 'bob', pick: [0] }, // « Tiens-moi en laisse, B.O.B. » → porte de l'attente
      { go: 'st-attente' },
      { section: 'Station · la Salle d\'Attente (M. Patience)' },
      { look: 'afficheur' }, // 9 847
      { look: 'squelette' }, // M. Patience tient le 9 848
      { useItem: ['ticket_douane', 'distributeur'] }, // fausse piste : le distributeur le recrache
      { use: 'squelette' }, // main serrée : il faut aspirer
      { use: 'plante' }, // +plante (payoff différé : couloir infini B, puis le Conseil)
      { go: 'st-cafeteria' }, // détour d'ambiance : la vitrine (sandwich consigné de Mme Guichard)
      { look: 'vitrine' },
      { go: 'st-attente' },
      { talk: 'bob', pick: [0] }, // « Il n'en a plus besoin… » → éloge funèbre, +ticket_9848
      { section: 'Station · le Guichet d\'Accueil (Mme Guichard)' },
      { go: 'st-guichet' }, // porte du guichet : ticket 9848 requis
      { look: 'horloge' }, // 10 h 11 (le guichet ouvre à 10 h 12)
      { look: 'horaires' },
      { useItem: ['ticket_9848', 'guichard'] }, // « c'est le suivant… de M. Patience » : animal, article 12
      { talk: 'guichard' }, // fermé, formulaire B-7/12 « au guichet » : fin provisoire du stub (st_guichard_ferme)
      { section: 'Station · le Guichet — carnet de déduction (l\'horloge)' },
      { useItem: ['fragment', 'horloge'] }, // l'aiguille tremble puis retombe (st_horloge_tremble)
      { talk: 'bob' }, // « ouvre ton carnet » (indice gradué)
      { deduce: ['horloge_1011', 'horaires'] }, // D1 « la minute manquante » (st_deduit_minute)
      { deduce: ['d_minute', 'horloge_tremble'] }, // D2 « l'improbable pousse l'aiguille » (st_deduit_horloge)
      { useItem: ['fragment', 'horloge'] }, // 10 h 12 : rideau levé, afficheur 9 848 (st_guichet_ouvert)
      { talk: 'guichard' }, // ticket tamponné, B-7/12 « en rupture » (st_guichard_rupture)
      { deduce: ['guichet_ouvert', 'guichard_rupture'] }, // D3 « Formulaire B-7/12 requis » (st_deduit_formulaire)
      { look: 'lecteur' }, // la porte qui exige le formulaire qui est derrière la porte
      { section: 'Station · l\'article 47bis (Mme Guichard)' },
      { talk: 'bob' }, // « un règlement qui fabrique une boucle prévoit un article pour en sortir »
      { talk: 'guichard' }, // article 47bis : demande verbale enregistrée (st_acces_aile_b)
      { go: 'st-couloir-b' }, // porte de l'Aile B (sortie vers_couloir_b)
      { section: 'Station · le Couloir Infini B (M. Ficus)' },
      { use: 'casier' }, // à trois pas, toujours à trois pas
      { talk: 'bob' }, // « pousse une porte »
      { use: 'porte_b2' }, // même extincteur : le couloir boucle (st_couloir_boucle)
      { look: 'extincteur' }, // « NE PAS DÉPLACER » : le repère
      { useItem: ['plante', 'emplacement'] }, // M. Ficus posé à gauche de l'extincteur (st_plante_posee)
      { use: 'porte_b3', pick: [0] }, // le couloir glisse ; suivre la plante : tout droit = boucle ironique
      { use: 'ficus', pick: [2] }, // vers M. Ficus : le couloir se dénoue (st_couloir_resolu), +plante
      { use: 'casier' }, // le dernier Formulaire B-7/12 (st_formulaire) : fin de l'Acte I
      { section: 'Acte II · les Archives Centrales (M. Duplicata)' },
      { go: 'st-archives' }, // porte B-1 (sortie vers_archives, couloir dénoué)
      { useItem: ['badge', 'fichier'] }, // refusé : pas sans demande de recherche
      { talk: 'duplicata' }, // « AUCUN GARY. AUCUN GARY. » (st_cherche_gary)
      { talk: 'bob' }, // indice vague : « comment la RH t'appelle-t-elle ? »
      { look: 'fichier' }, // « le fichier lit la pièce, pas la personne »
      { useItem: ['badge', 'fichier'] }, // tiroir G : PLUNK, GARRY ; Duplicata garde le badge (st_dossier_trouve) −badge
      { look: 'photocopieuse' }, // EN PANNE DE PAPIER ; le papier, c'est aux Réclamations
      { go: 'st-couloir-b' },
      { section: 'Acte II · le Bureau des Tampons (Mme Tamponnet)' },
      { go: 'st-tampons' }, // porte B-2
      { look: 'mur_tampons' }, // 412 tampons, un crochet vide : ANNULÉ
      { talk: 'tamponnet' }, // l'encre, c'était le café : grève ; +tampon_annule (st_tamponnet)
      { use: 'encreur' }, // +encreur (sec, payoff Acte III)
      { useItem: ['formulaire', 'tamponnet'] }, // case A vide, pas d'encre (rien n'est consommé)
      { go: 'st-couloir-b' },
      { section: 'Acte II · le Service des Réclamations (la chatière)' },
      { go: 'st-reclamations' }, // porte B-3
      { use: 'comptoir' }, // RÉSERVÉ AU PERSONNEL : « l'accès prévu à cet effet »
      { talk: 'bob' }, // indice vague : « plus bas que ta dignité »
      { look: 'chatiere' }, // ANIMAUX DE SERVICE — détection : carapace
      { use: 'chatiere' }, // la combi de chitine passe (st_chatiere)
      { use: 'liasse' }, // +liasse
      { use: 'capsule' }, // +capsule (payoff Acte IV : procuration de PERCO)
      { useItem: ['liasse', 'broyeuse'] }, // fausse piste : on ne broie pas le seul papier de la Station
      { go: 'st-couloir-b' },
      { section: 'Acte II · case A : humain, intérimaire' },
      { go: 'st-archives' },
      { useItem: ['liasse', 'photocopieuse'] }, // 3 copies CONFORMES, le papier reste dans le bac (st_papier) +copies_dossier
      { combine: ['copies_dossier', 'formulaire'] }, // case A ; reclassement INTÉRIMAIRE (C'EST PIRE) (st_case_a, st_reclasse)
      { talk: 'duplicata' }, // « Humain. Humain. Intérimaire. Intérimaire. »
      { go: 'st-couloir-b' },
      { go: 'st-tampons' },
      { useItem: ['formulaire', 'tamponnet'] }, // PAS D'ENCRE, PAS DE VU : la grève (st_sait_greve, teaser Acte III)
      { section: 'Acte III · la Salle de Pause (PERCO)' },
      { go: 'st-couloir-b' },
      { go: 'st-pause' }, // porte B-4
      { use: 'piquet' }, // BRISEUR DE GRÈVE ! (les gobelets sifflent)
      { useItem: ['fragment', 'perco'] }, // café froid : PRÉAVIS RECONDUIT (fausse piste, rien ne change)
      { talk: 'perco' }, // grève jusqu'à l'accord P-15 « par la direction ou son intérimaire » (st_greve_connue)
      { use: 'panneau_syndical' }, // +accord (st_accord_pris)
      { useItem: ['accord', 'perco'] }, // NON SIGNÉ ! (rien n'est consommé)
      { look: 'frigo' }, // graine ch.4 : le yaourt de M. Delaigue
      { section: 'Acte III · le Sous-Chef Adjoint (M. Delaigue)' },
      { go: 'st-couloir-b' },
      { go: 'st-sous-chef' }, // porte B-5
      { use: 'delaigue' }, // secouer : « …réunion… reportée… »
      { useItem: ['accord', 'delaigue'] }, // il dort, pas de note lue : Gary n'ose pas
      { look: 'plaque' }, // « p.i. » depuis dix-neuf ans
      { look: 'note' }, // « tout intérimaire signe p.o. » (st_voit_delegation)
      { useItem: ['accord', 'delaigue'] }, // Gary signe p.o. avec le stylo enchaîné (st_accord_signe)
      { go: 'st-couloir-b' },
      { section: 'Acte III · fin de la grève, encre au café' },
      { go: 'st-pause' },
      { useItem: ['accord', 'perco'] }, // FIN DU CONFLIT (st_greve_finie) −accord
      { talk: 'perco' }, // café tiède, un à la fois : +gobelet
      { combine: ['encreur', 'gobelet'] }, // encreur imbibé (st_encreur_cafe), gobelet vide (st_gobelet_vide)
      { useItem: ['gobelet', 'perco'] }, // resservi (st_cafe2)
      { go: 'st-couloir-b' },
      { go: 'st-tampons' },
      { useItem: ['encreur', 'tamponnet'] }, // CLONK de joie (st_tamponnet_encre) −encreur
      { useItem: ['formulaire', 'tamponnet'] }, // case B « VU » au café (st_case_b)
      { section: 'Acte III · signature hiérarchique et trois exemplaires' },
      { go: 'st-couloir-b' },
      { go: 'st-sous-chef' },
      { useItem: ['formulaire', 'delaigue'] }, // il dort : pas de signature
      { useItem: ['gobelet', 'delaigue'] }, // …PRIME ? Réveillé, il garde le gobelet (st_delaigue_reveille) −gobelet
      { useItem: ['formulaire', 'delaigue'] }, // case D, signature « p.i. » ; ascenseur et quorum (st_case_d)
      { talk: 'bob' }, // « en trois exemplaires » : Duplicata
      { go: 'st-couloir-b' },
      { go: 'st-archives' },
      { useItem: ['formulaire', 'photocopieuse'] }, // case C, trois exemplaires certifiés (st_case_c) : fin de l'Acte III
      { section: 'Acte IV · l\'Ascenseur à Formulaires et le Conseil' },
      { go: 'st-couloir-b' },
      { go: 'st-ascenseur' }, // mur de droite : case D requise
      { useItem: ['formulaire', 'fente'] }, // AVIS DU CONSEIL REQUIS → Niveau 7 (st_ascenseur_conseil)
      { talk: 'paraphe' }, // quorum de 3 (st_quorum_connu)
      { look: 'tableau' }, // PERCO (personnel), M. FICUS (honoraire)
      { useItem: ['plante', 'paraphe'] }, // « il vote déjà mieux que vous » (rien n'est consommé)
      { useItem: ['plante', 'siege'] }, // M. Ficus siège (st_ficus) −plante
      { talk: 'paraphe' }, // quorum non atteint : PERCO absente
      { useItem: ['tampon_annule', 'urne'] }, // rien à annuler avant le vote
      { go: 'st-ascenseur' },
      { go: 'st-couloir-b' },
      { go: 'st-pause' },
      { useItem: ['capsule', 'perco'] }, // procuration + café par tube (st_vote_perco) −capsule
      { go: 'st-couloir-b' },
      { go: 'st-ascenseur' },
      { go: 'st-conseil' }, // la porte de droite mène au Conseil (st_ascenseur_conseil)
      { talk: 'paraphe' }, // POUR / abstention / CONTRE : égalité, AJOURNÉ (st_vote_egalite)
      { talk: 'bob' }, // « un tampon que personne n'utilise »
      { useItem: ['tampon_annule', 'urne'] }, // ON N'ANNULE JAMAIS RIEN… DONC C'EST VALABLE (st_case_e)
      { section: 'Acte IV · la Direction, le dépôt, la restitution' },
      { go: 'st-ascenseur' },
      { useItem: ['formulaire', 'fente'] }, // DOSSIER COMPLET → Niveau 12 (st_ascenseur_direction)
      { useItem: ['fragment', 'coffre'] }, // DÉPÔT AU GUICHET. MÊME POUR LES MIRACLES.
      { talk: 'sylvie' }, // DÉPÔT AU GUICHET UNIQUEMENT ; le guichet referme (st_sylvie_refuse)
      { go: 'st-ascenseur' },
      { go: 'st-couloir-b' },
      { go: 'st-guichet' },
      { useItem: ['formulaire', 'guichard'] }, // fermé, 10 h 11
      { useItem: ['fragment', 'horloge'] }, // 2e passage : 10 h 12 (st_guichet_ouvert)
      { useItem: ['formulaire', 'guichard'] }, // dépôt, tube vers la Direction (st_dossier_depose) −formulaire
      { go: 'st-couloir-b' },
      { go: 'st-ascenseur' },
      { go: 'st-direction' },
      { talk: 'sylvie' }, // dossier reçu, le coffre s'ouvre (st_coffre_ouvert)
      { useItem: ['fragment', 'coffre'] }, // fusion 2/4096, SYLVIE craque ; +badge +permis (st_eclat2)
      { section: 'Acte IV · la Fourrière et le décollage' },
      { go: 'st-ascenseur' },
      { go: 'st-couloir-b' },
      { go: 'st-guichet' },
      { go: 'st-attente' },
      { go: 'st-sas' },
      { go: 'st-fourriere' }, // avec le permis (st_eclat2)
      { useItem: ['permis', 'capsule_vaisseau'] }, // VÉHICULE IMMOBILISÉ (rien n'est consommé)
      { useItem: ['ticket_douane', 'sabot'] }, // amende 4 096 crédits (st_amende) −ticket_douane
      { useItem: ['tampon_annule', 'amende'] }, // « ça, c'est réglementaire » (st_vaisseau_libere)
      { useItem: ['permis', 'capsule_vaisseau'] }, // décollage : fin du chapitre 1 (`end: st_suite`)
    ],
  },
];

export function findChapter(id: string | undefined): ChapterDef | undefined {
  return CHAPTERS.find((c) => c.id === id);
}

/** Knot de fin d'un chapitre (inconnu = ch0). */
export function endKnotOf(id: string | undefined): string {
  return (findChapter(id) ?? CHAPTERS[0]).endKnot;
}

/** Acte d'un chapitre ouvert par le knot de fin `knot` (coupure d'acte), sinon undefined. */
export function actBreak(chapterId: string | undefined, knot: string): ActDef | undefined {
  return (findChapter(chapterId) ?? CHAPTERS[0]).acts?.find((a) => a.breakKnot === knot);
}

/** Acte `id` d'un chapitre. */
export function findAct(chapterId: string | undefined, id: string | undefined): ActDef | undefined {
  return (findChapter(chapterId) ?? CHAPTERS[0]).acts?.find((a) => a.id === id);
}

/**
 * Entrée dans un acte (pure, partagée jeu / walkChapter / /creator) : inventaire et flags
 * remplacés par `enter`, scène de départ de l'acte. Les pièces visitées et l'état Ink sont
 * gardés ; la pièce d'arrivée n'est pas marquée visitée (son intro `onFirstEnter` se joue).
 */
export function enterAct(state: GameState, act: ActDef): void {
  state.items = [...(act.enter?.items ?? state.items)];
  if (act.enter?.flags) state.flags = new Set(act.enter.flags);
  state.selectedItem = null;
  state.scene = act.startScene;
  state.ended = false;
  state.emit();
}

/** Nouvelle partie au début d'un chapitre : scène de départ + état initial déclaré. */
export function chapterState(chapter: ChapterDef): GameState {
  const s = new GameState(chapter.startScene);
  s.chapter = chapter.id;
  chapter.initial?.flags?.forEach((f) => s.flags.add(f));
  chapter.initial?.items?.forEach((i) => s.items.push(i));
  return s;
}

export interface Checkpoint {
  index: number;
  section: string;
  /** Libellé de l'étape (« utiliser serpilliere sur distributeur », « → couloir »). */
  label: string;
  scene: string;
  newFlags: string[];
  gained: string[];
  lost: string[];
  save: SaveData;
  /**
   * Entrées d'avant-chapitre de /creator (hors solution) : `transition` = écran de fin du
   * chapitre précédent ; `launch` = lancement réel du chapitre (intro d'arrivée à jouer) ;
   * `act` = coupure d'acte (cliffhanger puis arrivée dans l'acte suivant, intro à jouer).
   */
  kind?: 'transition' | 'launch' | 'act';
}

export interface WalkOptions {
  /** Appelée pour chaque réplique / choix (sortie verbeuse). */
  log?: (line: string) => void;
  /** Appelée avant chaque étape. */
  onStep?: (label: string) => void;
}

export interface WalkResult {
  checkpoints: Checkpoint[];
  state: GameState;
  ended: string | null;
}

/** Rejoue un chapitre depuis le début ; lève une erreur si une étape est impossible. */
export async function walkChapter(content: GameContent, chapter: ChapterDef, opts: WalkOptions = {}): Promise<WalkResult> {
  const log = opts.log ?? (() => {});
  const state = chapterState(chapter);
  let ended: string | null = null;
  /** Coupure d'acte atteinte pendant l'étape courante. */
  let pendingAct: ActDef | null = null;
  let choiceCursor = 0;
  /** Choix imposés de l'étape courante (`WalkStep.pick`). */
  let picks: number[] = [];

  const view: DialogueView = {
    async showLine(sp, text) {
      log(`  ${sp && sp.id !== 'narrateur' ? sp.name + ' : ' : ''}${text}`);
    },
    async showChoices(choices) {
      const forced = picks.shift();
      if (forced !== undefined && forced >= choices.length) throw new Error(`choix imposé ${forced} absent (${choices.length} choix : ${choices.join(' | ')})`);
      const i = forced ?? choiceCursor++ % choices.length;
      log(`  > [${choices[i]}]`);
      return i;
    },
    close() {},
  };
  const dialogue = new DialogueRunner(content, state, { shake() {} });
  const host: ActionHost = {
    say: (t, mood) => view.showLine(dialogue.parseLine(t, 'gary').speaker, dialogue.parseLine(t, 'gary').text, mood),
    dialogue: (k) => dialogue.run(k, view),
    async goto(id) {
      if (!content.scenes.has(id)) throw new Error(`goto scène inconnue ${id}`);
      state.scene = id;
      const first = !state.visited.has(id);
      state.visited.add(id);
      const def = content.scenes.get(id)!;
      if (first) await runner.run(def.onFirstEnter);
      await runner.run(def.onEnter);
    },
    async end(k) {
      await dialogue.run(k, view);
      const act = actBreak(chapter.id, k);
      if (act) {
        // coupure d'acte (EndScene en mode acte) : cliffhanger joué, état propre de l'acte suivant
        enterAct(state, act);
        pendingAct = act;
        return;
      }
      ended = k;
      state.ended = true;
    },
    shake() {},
  };
  const runner = new ActionRunner(state, host);

  const scene = () => content.scenes.get(state.scene)!;
  const hotspot = (id: string) => {
    const h = scene().hotspots!.find((x) => x.id === id && state.check(x.if));
    if (!h) throw new Error(`hotspot « ${id} » absent/invisible dans ${state.scene}`);
    return h;
  };
  const exec = async (label: string, i: Interaction | undefined) => {
    if (!i) throw new Error(`rien à faire pour : ${label}`);
    await runner.run(i);
  };

  const checkpoints: Checkpoint[] = [];
  let section = '';
  const snap = (label: string, before: SaveData, kind?: Checkpoint['kind']) => {
    const save = state.toSave();
    checkpoints.push({
      ...(kind ? { kind } : {}),
      index: checkpoints.length,
      section,
      label,
      scene: state.scene,
      newFlags: save.flags.filter((f) => !before.flags.includes(f)),
      gained: save.items.filter((i) => !before.items.includes(i)),
      lost: before.items.filter((i) => !save.items.includes(i)),
      save,
    });
  };

  // Arrivée dans la scène de départ (comme une nouvelle partie).
  let before = state.toSave();
  state.visited.add(state.scene);
  await runner.run(scene().onFirstEnter);
  snap(`début — ${state.scene}`, before);

  for (const s of chapter.steps) {
    if ('section' in s) {
      section = s.section;
      continue;
    }
    before = state.toSave();
    picks = 'pick' in s && s.pick ? [...s.pick] : [];
    let label: string;
    if ('look' in s) {
      label = `regarder ${s.look}`;
      opts.onStep?.(label);
      await exec(label, hotspot(s.look).look);
    } else if ('use' in s) {
      label = `utiliser ${s.use}`;
      opts.onStep?.(label);
      await exec(label, hotspot(s.use).use);
    } else if ('talk' in s) {
      label = `parler à ${s.talk}`;
      opts.onStep?.(label);
      await exec(label, hotspot(s.talk).talk);
    } else if ('useItem' in s) {
      const [item, h] = s.useItem;
      label = `utiliser ${item} sur ${h}`;
      opts.onStep?.(label);
      if (!state.hasItem(item)) throw new Error(`objet « ${item} » absent de l'inventaire`);
      await exec(label, hotspot(h).useItem?.[item]);
    } else if ('combine' in s) {
      const [a, b] = s.combine;
      label = `combiner ${a} + ${b}`;
      opts.onStep?.(label);
      await exec(label, resolveCombine(content, a, b));
    } else if ('deduce' in s) {
      const [a, b] = s.deduce;
      label = `déduire ${a} + ${b}`;
      opts.onStep?.(label);
      const r = deduce(state, content.carnet ?? { clues: [], deductions: [] }, a, b);
      if (r.kind !== 'ok') throw new Error(`déduction ${a} + ${b} : ${r.kind === 'already' ? 'déjà conclue' : 'rejetée (pièce non notée ou paire inconnue)'}`);
      log(`  [carnet] ${r.deduction.title.fr}`);
      state.setFlag(r.deduction.set);
    } else {
      label = `→ ${s.go}`;
      opts.onStep?.(label);
      const e = scene().exits!.find((x) => x.to === s.go && state.check(x.if));
      if (!e) throw new Error(`pas de sortie vers ${s.go} depuis ${state.scene}`);
      if (!state.check(e.requires)) throw new Error(`sortie vers ${s.go} verrouillée`);
      // `to: fin` : franchir la sortie termine le chapitre (comme RoomScene.onClickExit)
      await runner.run([s.go === 'fin' ? { end: chapter.endKnot } : { goto: s.go }]);
    }
    const act = pendingAct as ActDef | null;
    if (act) {
      // checkpoint « coupure d'acte » : pièce d'arrivée pas encore visitée (« Jouer ici » rejoue l'intro)
      pendingAct = null;
      section = `↪ Coupure d'acte — ${act.title}`;
      snap(`${label} → cliffhanger « ${act.breakKnot} » → ${act.startScene}`, before, 'act');
      state.visited.add(state.scene);
      await runner.run(content.scenes.get(state.scene)!.onFirstEnter);
      continue;
    }
    snap(label, before);
  }

  return { checkpoints, state, ended };
}

/**
 * Entrées d'avant-chapitre pour /creator, avant le checkpoint « début » : la **transition**
 * (instantané final du chapitre `from` : écran de fin, « À suivre… », bouton « Chapitre N → »)
 * puis le **lancement** (état initial du chapitre, pièce jamais visitée → l'intro d'arrivée
 * `onFirstEnter` sera jouée, comme après le clic sur le bouton). Vide sans `from`.
 * Volontairement hors de `walkChapter` : les checkpoints de la solution (playthrough) ne changent pas.
 */
export async function chapterPrelude(content: GameContent, chapter: ChapterDef): Promise<Checkpoint[]> {
  const prev = findChapter(chapter.from);
  if (!prev) return [];
  const { checkpoints, ended } = await walkChapter(content, prev);
  const last = checkpoints[checkpoints.length - 1];
  if (!last || ended !== prev.endKnot) throw new Error(`fin de ${prev.id} non atteinte (ended=${ended})`);
  const section = `↪ Transition ${prev.id.replace(/^ch/, 'ch.')} → ${chapter.id.replace(/^ch/, 'ch.')}`;
  const launch = chapterState(chapter).toSave();
  return [
    {
      ...last,
      index: 0,
      section,
      label: `fin ${prev.id.replace(/^ch/, 'ch.')} — « À suivre… » + bouton « Chapitre ${chapter.id.replace(/^ch/, '')} → »`,
      newFlags: [],
      gained: [],
      lost: [],
      kind: 'transition',
    },
    {
      index: 0,
      section,
      label: `lancement ${chapter.id.replace(/^ch/, 'ch.')} — intro d'arrivée (${chapter.startScene})`,
      scene: chapter.startScene,
      newFlags: launch.flags.filter((f) => !last.save.flags.includes(f)),
      gained: launch.items.filter((i) => !last.save.items.includes(i)),
      lost: last.save.items.filter((i) => !launch.items.includes(i)),
      save: launch,
      kind: 'launch',
    },
  ];
}
