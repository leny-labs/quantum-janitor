# Chapitres — numérotation, transitions, plan de fusion

> Décisions Leny t173–t176 (2026-11-03). Ce document est la référence de la
> numérotation des chapitres. Designs détaillés :
> [`CHAPTER0_BLATTARIA.md`](CHAPTER0_BLATTARIA.md) (ch.0, acte 2),
> [`CHAPTER1.md`](CHAPTER1.md) (ch.1, Station Bureaucratique),
> [`INTERLUDE_VAISSEAU.md`](INTERLUDE_VAISSEAU.md) (transition ch.0 → ch.1),
> bible : [`STORY.md`](STORY.md).

## 1. Nouvelle numérotation

| Nouveau | Contenu | Ancien | Id interne | Statut |
|---|---|---|---|---|
| **Ch.0 « Le Seau »**, acte I | *Klepsydra-9* — tutoriel + catastrophe (placard, couloir, labo, panneau) | ch.0 | `ch0` | jouable |
| **Ch.0 « Le Seau »**, acte II | *Blattaria Prime* (B-7) — prophétie, Josiane et le Seau perdus, combi de chitine | ch.1 | `ch0` (scènes/flags/knots `ch1-*` / `ch1_*` conservés) | jouable |
| *Interlude* | Mini-vaisseau : cockpit serré, boutons absurdes, choix de destination | — (« interlude envisagé ») | début de `ch1` | stub jouable |
| **Ch.1 « La Station Bureaucratique »** | Le règlement a gagné. Paperasse, fonctionnaires, couloirs infinis, 13 lieux | ch.2 | `ch1` (scènes `st-*`, flags `st_*`, knots `st_*`) | stub jouable (2 salles) |
| Ch.2 | *Dimension Miniature* | ch.3 | `ch2` | idée |
| Ch.3 | *Klepsydra-Lux* | ch.4 | `ch3` | idée |
| Ch.4 | *L'Envers du Yaourt* | ch.5 | `ch4` | idée |
| Fin | *Le Placard Originel* | fin | `fin` | idée |

Le ch.0 reste un **tutoriel linéaire** en deux actes (petit inventaire, puzzles courts).
Le ch.1 est le premier « vrai » chapitre : long, multi-salles, inventaire qui s'empile,
objets à payoff différé (voir [`CHAPTER1.md`](CHAPTER1.md), §5).

### Convention sur les préfixes hérités (à lire avant de toucher au code)

- **`ch1-*` / `ch1_*` = « acte Blattaria du ch.0 »**, *pas* le chapitre 1. On ne renomme
  pas : 4 fichiers de scènes, 5 fichiers Ink, ~25 flags, les invariants de
  `repair.ts`, `items.yaml`, les entrées `END_BY_CHAPTER`, les liens /creator et les
  sauvegardes existantes en dépendent. Un renommage massif coûterait cher et casserait
  les sauvegardes pour un gain purement cosmétique.
- Le flag d'état **`ch1`** (garde des textes partagés d'`items.yaml`) garde son sens
  actuel : « on est dans l'acte Blattaria ». **La Station ne doit jamais le poser** ;
  elle utilise son propre flag d'état **`st`**.
- Le nouveau ch.1 utilise exclusivement le préfixe **`st`** : scènes `st-<lieu>`
  (fichiers `content/scenes/st-<lieu>.yaml`), flags `st_*`, knots Ink `st_*`
  (fichiers `content/story/st_*.ink`). L'interlude : scène `interlude-vaisseau`,
  knots `iv_*`, flags `iv_*`.
- Ajouter un commentaire d'en-tête dans `walkthrough.ts`, `repair.ts` et
  `content/story/ch1_*.ink` : « préfixe ch1_ = acte Blattaria du chapitre 0 (historique) ».

## 2. Règles de transition (pas de hard cut)

Toute transition suit la même grammaire, en trois temps :

1. **Carte de fin** (fin de chapitre) ou **carte d'acte** (changement d'acte) :
   plan filmé de clôture → fondu au noir **≥ 600 ms** → carte texte (« FIN DU
   CHAPITRE 0 » + sous-titre ironique, ou « ACTE II — BLATTARIA PRIME »).
2. **Interlude** (facultatif, par couple de chapitres) : scène jouable courte
   (1–2 min). Entre ch.0 et ch.1 : le mini-vaisseau
   ([`INTERLUDE_VAISSEAU.md`](INTERLUDE_VAISSEAU.md)).
3. **Carte titre du chapitre suivant** : fond sombre, « CHAPITRE 1 » (petites
   capitales espacées, couleur `COLORS.hover`) puis le nom en italique
   (« La Station Bureaucratique ») et une ligne d'accroche ; fondu entrant 800 ms,
   tenue 2,5 s, fondu sortant 800 ms vers le plan d'arrivée (`intro:` de la 1re salle).

Règles communes :

- **Musique** : fondu croisé 1,2 s (jamais de coupure sèche) ; la carte titre joue un
  sting court puis le thème du chapitre.
- **SFX** : fin de chapitre = faille (souffle + harpe cosmique, même synthé Web Audio
  que les effets papillon) ; carte titre ch.1 = **« CLONK » de tampon** administratif
  (le titre est littéralement tamponné à l'écran, léger shake 120 ms) ; carte d'acte
  ch.0 → acte II = « PLOUF » lointain (rappel du seau).
- **Skip** : clic / Échap après 1 s sur chaque carte ; l'interlude a un bouton
  « Passer » une fois terminé au moins une fois (flag persistant `iv_vu`).
- **Sauvegarde** : autosave **au début** de la carte titre avec l'état initial du
  chapitre suivant (`chapter` déjà basculé) → un rechargement ne rejoue pas la fin.
- **Accessibilité** : textes des cartes via i18n (`check:i18n` refuse les littéraux),
  durée de tenue doublée si `prefers-reduced-motion` (pas de shake).

## 3. Plan technique de la fusion (pour le run suivant)

### 3.1 Ids et `CHAPTERS` (`src/engine/walkthrough.ts`)

- **`ch0`** = chapitre fusionné. `startScene: 'placard'`, `endKnot: 'ch1_suite'`
  (la fin de Blattaria devient la fin du ch.0). Les `steps` = steps ch.0 actuels, puis
  `{ section: 'Acte II : Blattaria Prime' }`, un step de transition d'acte, puis les
  steps Blattaria actuels.
- Introduire les **actes** dans `ChapterDef` :
  ```ts
  acts?: { id: string; title: string; startScene: string;
           enter?: { items?: string[]; take?: string[]; flags?: string[] } }[];
  ```
  ch0 : `klepsydra` (`placard`) puis `blattaria` (`nid-royal`, `enter` =
  ce que fait aujourd'hui `initial` du ch1 Blattaria : inventaire réduit à
  `serpilliere` + `badge`, flags `ch1`, `chapitre0_termine`). Le seau, le sandwich,
  le fusible sont retirés (ils sont tombés dans la faille). Une fonction pure
  `enterAct(state, act)` applique `enter` ; elle est utilisée par le jeu, par
  `walkChapter` et par /creator.
- **`ch1`** (nouvel id) = Station : `startScene: 'interlude-vaisseau'`,
  `from: 'ch0'`, `initial: { items: ['badge', 'fragment', 'combi_chitine'], flags:
  ['st', 'ch0_termine'] }`, `endKnot: 'st_suite'`, steps = arbre de
  [`CHAPTER1.md`](CHAPTER1.md) §6 (stub au départ : voir `CHAPTER1.md` §9).
- Le **knot `cafards`** (`reacteur.ink`, dernière ligne `# end: cafards`) ne termine
  plus le chapitre : il déclenche une **coupure d'acte**. Deux options, recommandée
  en premier :
  1. Nouveau tag `# act: blattaria` à la place de `# end: cafards` → `RoomScene`
     lance `End` en mode « acte » (`{ act: 'blattaria' }`) : plan 3D `roaches`
     existant, carte « ACTE II », puis `enterAct` + `Room` sur `nid-royal` (intro
     `ch1_arrivee` filmée). Aucune sauvegarde « terminée » intermédiaire.
  2. Garder `# end: cafards` et une table `ACT_BREAKS = { cafards: { act:
     'blattaria' } }` dans `EndScene` (moins de changements Ink, mais `end` devient
     ambigu).
- **Implémenté (option 2)** : `ActDef.breakKnot: 'cafards'` dans `CHAPTERS` ; `actBreak()`
  est consulté par `RoomScene.end` (→ `End` en mode `{ act }`) et par `walkChapter` ; le knot
  `cafards` garde son `# end:`. `enterAct()` **remplace** inventaire et flags (les flags de
  Klepsydra comme `serpilliere_mouillee` changeraient les textes partagés d'`items.yaml`).
- `walkChapter` doit traverser la coupure d'acte (appliquer `enterAct` quand il voit
  le tag/knot) : `npm run playthrough` sur `ch0` doit enchaîner 27 + 29 checkpoints
  (± le step de transition) jusqu'à `ch1_suite`.

### 3.2 Flags de fin

| Flag | Sens après fusion | Posé par |
|---|---|---|
| `chapitre0_termine` | **acte Klepsydra terminé** (sens historique conservé) | coupure d'acte (`enterAct`) |
| `ch0_termine` (nouveau) | chapitre 0 entier terminé | `EndScene` sur `ch1_suite` |
| `chapitre1_termine` | **obsolète** (ancienne fin Blattaria) → migré en `ch0_termine` | — |
| `st_termine` (nouveau) | chapitre 1 (Station) terminé | `EndScene` sur `st_suite` |

`tools/validate-content.ts` : remplacer `chapitre1_termine` par `ch0_termine`,
ajouter `st`, `st_termine`, `iv_vu`, `combi_portee`.

### 3.3 Migration des sauvegardes (`GameState.fromJSON` / `session.loadGame`)

- `SaveData.version` passe de **1 à 2**. Toute écriture se fait en v2.
- Lecture d'une v1 :
  - `chapter === 'ch1'` (= Blattaria) → `chapter = 'ch0'` (acte Blattaria ; la scène
    `ch1-*`/`nid-royal`… et les flags `ch1_*` restent valides tels quels) ;
  - flag `chapitre1_termine` → remplacé par `ch0_termine` ;
  - `chapter` absent → `ch0` (inchangé).
- La migration est **conditionnée à `version === 1`** : une sauvegarde v2 avec
  `chapter: 'ch1'` est bien une partie Station. Test unitaire obligatoire (v1 ch1 au
  Nid, v1 ch1 terminée, v1 sans chapitre, v2 ch1 Station).
- Une sauvegarde v1 terminée (`ended`) avec `chapter: 'ch1'` reprend sur l'écran de fin
  du ch.0 qui propose « Chapitre 1 → » (= interlude + Station).

### 3.4 URLs (`src/engine/debug.ts`, `TitleScene`)

| URL | Effet |
|---|---|
| `/?chapter=0` | nouvelle partie ch.0 (placard) |
| `/?chapter=0&act=blattaria` | nouvelle partie ch.0 directement à l'acte II (`enterAct`), intro filmée |
| `/?chapter=1` | nouvelle partie ch.1 (interlude vaisseau puis Station) |
| `/?scene=st-sas&chapter=1&flags=st,ch0_termine&items=badge,fragment` | debug Station, interlude sauté |
| `/?scene=nid-royal&chapter=0&flags=ch1,chapitre0_termine&items=serpilliere,badge` | debug acte Blattaria (remplace `chapter=1`) |
| `/?scene=fin&chapter=0` | fin du ch.0 (couronnement/faille → interlude) |
| `/?scene=fin&chapter=1` | fin du ch.1 (Station) |

Le parse `?chapter=N` → `chN` existe déjà ; seul le sens de `1` change. Mettre à jour
le commentaire d'en-tête de `debug.ts` et les liens « URL » générés par /creator.

### 3.5 Menu / titre

- `title.chapterName` reste « Le Seau » pour le ch.0. Le panneau titre affiche le
  chapitre de la sauvegarde courante (`session.chapter`) : « CHAPITRE 1 · La Station
  Bureaucratique » si l'on reprend une partie Station (nouvelles clés
  `title.chapterName.ch1`).
- Pas de sélecteur de chapitres au MVP. Plus tard : liste « Chapitres » débloquée par
  `ch0_termine` (stockage séparé `qj-progress`, pour survivre à « Nouvelle partie »).

### 3.6 /creator (timeline)

- `?ch=ch0` : une seule timeline avec sections « Acte I — Klepsydra-9 », « ↪ Coupure
  d'acte (cliffhanger cafards) », « Acte II — Blattaria Prime ». Checkpoint FIN → « →
  suite : interlude + ch.1 » (`/creator?ch=ch1#transition`).
- `?ch=ch1` : `chapterPrelude` = fin du ch.0 (`ch1_suite`) → entrée « ▶ interlude
  vaisseau » → « ▶ arrivée Station (st-sas) » → steps Station.
- L'ancien `?ch=ch1` (Blattaria) redirige vers `?ch=ch0#acte-2`.

### 3.7 EndScene

- **Une seule fin pour le ch.0** : knot `ch1_suite` (couronnement + faille, déjà
  joué) → plan de fin (le plan `stub` « STATION BUREAUCRATIQUE — FORMULAIRE EN COURS
  DE TRAITEMENT » devient l'**amorce** : la faille + le tampon géant) → carte « FIN DU
  CHAPITRE 0 » → bouton **« Chapitre 1 → »** = `session.newGame('ch1')` → scène
  `interlude-vaisseau` → carte titre ch.1 → `st-sas`.
- `END_BY_CHAPTER` devient :
  ```ts
  ch0: { flag: 'ch0_termine', shot: 'faille', next: 'ch1' },
  ch1: { flag: 'st_termine', shot: 'stub', next: undefined }, // ch.2 pas encore
  ```
  Le plan `roaches` sort de `END_BY_CHAPTER` et devient le plan de la **coupure
  d'acte** (§3.1).
- i18n : `end.nextChapterKicker` → « STATION BUREAUCRATIQUE · FORMULAIRE B-7/12
  REQUIS » ; nouvelles clés `card.chapterEnd`, `card.act2`, `card.ch1.title`,
  `card.ch1.tagline`.

### 3.8 Ce qui ne bouge pas

Contenu des scènes ch.0 et Blattaria, Ink `ch1_*`, invariants `repair.ts` (Blattaria),
icônes, pièces 3D. La fusion est une affaire de **câblage** (walkthrough, session,
EndScene, debug, creator, migration), pas de contenu.

## 4. Ordre de travail recommandé (run suivant)

1. `acts` + `enterAct` + coupure d'acte (`# act:`) ; `playthrough` ch0 vert de bout en bout.
2. Migration v1 → v2 + tests.
3. EndScene : fin ch.0 unique, cartes (acte, fin, titre), bouton « Chapitre 1 → ».
4. Interlude vaisseau en stub ([`INTERLUDE_VAISSEAU.md`](INTERLUDE_VAISSEAU.md) §5).
5. Scaffold Station : `st-sas` + `st-attente` ([`CHAPTER1.md`](CHAPTER1.md) §9).
6. URLs, /creator, i18n, `validate-content`.
