# Chapitre 1 « Blattaria Prime » — design

> Dimension B-7. Les cafards ont hérité de la galaxie, et ils ont une prophétie.
> Gary a un badge avec deux R. Pour eux, ça suffit.

Suite directe du cliffhanger du ch.0 (`fin.ink`, knot `cafards`). Même moteur, même
grain de puzzles, même ton (*Space Quest* × *Rick & Morty* × *Paranoia* × *Futurama*,
voir `docs/STORY.md`). Scope : MVP jouable de bout en bout sur un chemin scripté.

## 1. Pitch

Gary s'est réveillé face contre un sol tiède et collant, au pied du trône de
**Sa Majesté Blattaria XIV**. Pour les cafards de B-7, il est **l'Homme au Seau** de
la prophétie : celui qui « fendra les mondes et nettoiera les dimensions ». Problème :
le Seau, lui, est passé dans la faille avant Gary. Les cafards l'ont trouvé, l'ont
léché (consciencieusement), et l'ont posé sur un autel. On ne touche pas au Seau
Sacré. Sauf l'Homme au Seau. Qui doit d'abord prouver qu'il est l'Homme au Seau.
Avec un badge qui sent le thon.

Au fond de la galerie des offrandes, les cafards vénèrent « le Temple de l'Ancien
Couloir » : un morceau de **Klepsydra-9** échoué là — le couloir C, distributeur
compris. Coincé derrière la spirale du Distrib'Ô-Matic, à la place du sandwich, pulse
un **éclat du Réacteur d'Improbabilité**. Le nettoyer (= le stabiliser), c'est
récupérer le premier des 4 096 morceaux. La Reine appelle ça « LE PREMIER MONDE
LAVÉ ». Gary appelle ça « des heures sup' non payées ».

**Running gags mobilisés** : GARRY (le badge fait foi, littéralement : c'est le Signe
de la prophétie) ; tout est tiède (même l'eau bénite) ; Gary est intérimaire (« je
ne peux pas être un messie, je suis en période d'essai ») ; PLOUF (le seau sur
l'éclat) ; le yaourt (il a quitté le seau en arrivant : « UN ÊTRE LACTÉ. IL EST PARTI
FONDER QUELQUE CHOSE. » — graine du ch.5 *L'Envers du Yaourt*) ; le distributeur qui
recoince toujours quelque chose.

## 2. Vues / salles

Même logique que ch.0 : 3 pièces + 1 gros plan. Ids kebab-case, fichiers
`content/scenes/ch1-<id>.yaml` (le glob de `contentBrowser.ts` n'est pas récursif :
le préfixe de fichier range le chapitre, l'`id` reste celui ci-dessous).

| id | Titre / secteur | Rôle | Hotspots principaux |
|---|---|---|---|
| `nid-royal` | **Nid Royal** · B-7 · Salle du Trône | Pièce de départ. La Reine, l'autel. | `reine` (talk, useItem badge/fragment), `autel` (Seau Sacré, `if: notFlags ch1_seau_rendu`), `courtisans` (look, sprites), `bob` |
| `galerie-des-offrandes` | **Galerie des Offrandes** · B-7 · Archives sacrées | Hub : prophétie, eau, miettes, foule. | `fresque` (look), `scribe` (Frère Élytre, talk/useItem badge), `bassin` (Bassin des Ablutions, tiède), `grenier` (Grenier aux Miettes), `foule` (bloque la sortie, `if: notFlags ch1_foule_dispersee`), `bob` |
| `temple-couloir` | **Temple de l'Ancien Couloir** · B-7 · Fragment K9-C | Le morceau de Klepsydra-9. | `distributeur` (Distrib'Ô-Matic devenu reliquaire), `compteur` (« 0000 JOURS SANS INCIDENT »), `hublot` (le multivers en mosaïque), `lecteur` (traces de yaourt… parties), `bob` |
| `coeur-eclat` | **Éclat du Réacteur** · Gros plan | Gros plan (comme `panneau`). | `eclat` (look/useItem seau/serpillière), `jauge` (stabilité), `gravure` (« Mk IV — 1/4096 ») |

Navigation : `nid-royal` ⇄ `galerie-des-offrandes` ⇄ `temple-couloir` ⇄ `coeur-eclat`.
La sortie galerie → temple a `requires: { flags: [ch1_foule_dispersee] }` ; la sortie
temple → `coeur-eclat` a `requires: { flags: [ch1_eclat_tombe] }`.

**Rendu** : MVP en **2D de repli** (`art:` YAML, comme toute scène absente de
`ROOMS` dans `src/three/rooms/index.ts`). Les cafards sont des **sprites 2D** : on
ajoute au `ArtShape` un champ minimal `image` (clé de texture + `at` + `scale` +
`flipX`) dessiné par `HotspotLayer.drawArt`, qui affiche `public/props/roach-2d.png`
(même sprite que le PoC `?roach2d=1`). Pas de cafard 3D procédural. Une vraie pièce
3D (`src/three/rooms/nid.ts` avec `roachSprite()` en billboard) est hors MVP
(« Reste à faire »). La Reine n'apparaît en pied que comme silhouette 2D dans le
décor ; en dialogue c'est le **portrait GenAI** existant (`reine-sheet.png`,
`GENAI_SHEETS`).

Musique : `themeForScene()` retombe sur `couloir` pour un id inconnu ; MVP = mapper les
4 ids ch.1 sur les thèmes existants (`fin` pour `nid-royal`, `couloir` ailleurs) dans
`SCENE_THEME` (`src/ui/music.ts`).

## 3. Chaîne de puzzles

Objets ch.1 : **serpillière** (Josiane) et **badge « Garry »** arrivés avec Gary,
**seau** (rendu par la Reine, réutilise l'objet `seau` du ch.0), **éclat du réacteur**
(`fragment`, nouvel objet). Tous les flags du chapitre sont préfixés `ch1_` ; le flag
`ch1` marque l'état « on est dans le chapitre 1 » (sert de garde dans les textes
partagés de `items.yaml`).

```
Arrivée (nid-royal, onFirstEnter) : la Reine accueille GARRY, exige le Seau Sacré
dans les mains de l'Homme au Seau « QUAND IL AURA PROUVÉ QU'IL EST L'HOMME AU SEAU ».
│
├─ PUZZLE 1 — Le Signe aux deux R (récupérer le Seau)
│   1. Parler à la Reine (Ink ch1_reine) → la prophétie exige « LE SIGNE ».  [ch1_audience]
│      L'autel est intouchable : utiliser l'autel → deux gardes cafards croisent leurs pattes.
│   2. Galerie : regarder la fresque → « L'HOMME AU SEAU PORTERA SUR SON CŒUR
│      LE SIGNE AUX DEUX R ». Gary regarde son badge. Oh non.                [ch1_sait_signe]
│   3. Badge sur le Scribe (Frère Élytre) → refusé : « LE SIGNE EST TERNI.
│      IL SENT… LE POISSON ANCIEN. » (le thon de B.O.B., ch.0)               [ch1_badge_refuse]
│   4. Serpillière sur le bassin des ablutions → Josiane trempée d'eau
│      bénite. Tiède. Évidemment.                                            [ch1_josiane_mouillee]
│   5. Combiner serpillière + badge (inventaire) → badge propre,
│      « GARRY » brille.                                                      [ch1_badge_propre]
│   6. Badge sur le Scribe → il se prosterne, proclame l'Homme au Seau
│      (Ink ch1_signe). La galerie entière applaudit, avec beaucoup de pattes. [ch1_signe_reconnu]
│   7. Nid : parler à la Reine → elle rend le Seau. Il est propre (léché).
│      Le yaourt est parti « FONDER QUELQUE CHOSE ».                         [ch1_seau_rendu] +seau
│
├─ PUZZLE 2 — La Foule (accéder au Temple)
│   8. Galerie : la sortie vers le Temple est bouchée par la foule en prière.
│      Regarder / parler à la foule → « ON NE DÉRANGE PAS LA PRIÈRE. SAUF POUR
│      LE GOÛTER. »                                                           (indice)
│   9. Utiliser le grenier aux miettes → « à mains nues ? Il faut un récipient. »
│      Seau sur le grenier → seau plein de miettes saintes.                  [ch1_seau_miettes]
│  10. Seau sur la foule → Gary vide le seau au fond de la galerie. Plouf sec.
│      La foule se rue sur le goûter ; le passage est libre.                 [ch1_foule_dispersee]
│
└─ PUZZLE 3 — Laver le premier monde (l'éclat du réacteur)
   11. Temple : regarder le distributeur → derrière la spirale, à la place du
       sandwich, un éclat qui vibre d'improbabilité.                         [ch1_voit_eclat]
   12. Serpillière sur le distributeur (même geste que le ch.0, par la trappe)
       → l'éclat tombe et roule dans le logement de sortie. Trop chaud pour la main :
       la moustache de Gary pousse de 3 cm quand il approche.                [ch1_eclat_tombe]
   13. Galerie : seau sur le bassin → seau d'eau bénite tiède.               [ch1_seau_plein]
   14. Gros plan coeur-eclat : regarder la jauge → « STABILITÉ : GARY ».
       Seau sur l'éclat (choix ironiques, Ink ch1_plouf) → PLOUF.
       L'éclat refroidit, se stabilise ; Gary le ramasse.     [ch1_eclat_stabilise] +fragment
   15. Nid : éclat sur la Reine → couronnement (Ink ch1_couronnement)
       → « LE PREMIER MONDE EST LAVÉ » → # end: ch1_suite.
```

Le seau reste dans l'inventaire jusqu'au bout (l'Homme au Seau ne lâche plus son
seau). L'état « vide / miettes / eau » est porté par les flags (`look` du seau
conditionné : `ch1_seau_miettes` et pas `ch1_foule_dispersee` → miettes ;
`ch1_seau_plein` et pas `ch1_eclat_stabilise` → eau).

Réponses aux fausses pistes (au moins une par hotspot clé, comme au ch.0) : seau sur
la Reine (« GARDE-LE, C'EST TON SEAU. ENFIN, PAS ENCORE. ») ; badge sur la foule ;
serpillière sèche sur l'éclat (« ça étale de l'improbabilité ») ; seau vide sur
l'éclat ; fragment sur le Scribe ; etc. `useItemDefault` sur les cafards.

## 4. Personnages et beats

| Perso | id | Rôle ch.1 | Portrait |
|---|---|---|---|
| **Gary Plunk** | `gary` | Messie malgré lui. Répète qu'il est intérimaire, en période d'essai, et qu'un messie a forcément un CDI. | existant |
| **B.O.B.** | `bob` | Compagnon d'office (suit Gary depuis le ch.0). **Système d'indices** : Ink `ch1_bob`, une branche par étape (même structure que `bob_compagnon`). Running gag : les cafards le vénèrent comme « LE GRAND AVALEUR » et il trouve ça, pour la première fois, presque agréable. | existant |
| **Sa Majesté Blattaria XIV** | `reine` | Donneuse de quête et de récompense. MAJUSCULES royales, « GARRY », le badge fait foi. Sincèrement émue par la prophétie. | GenAI existant (`reine-sheet.png`) |
| **Frère Élytre**, Grand Scribe | `scribe` | Gardien de la prophétie, pédant, myope (antennes-lunettes). Parle en citations numérotées (« PROPHÉTIE, VERSET 7, ALINÉA B »). Valide le Signe. | nouveau `characters` dans `game.yaml`, portrait texte (`portrait: "✒\n(◔ ◔)"`) — pas de planche 3D/GenAI au MVP (à vérifier : le `DialogueBox` doit retomber sur le portrait texte pour un id absent de `PORTRAITS`) |
| La Foule / les gardes | narrateur ou `scribe` | Décor parlant via `say:` narrateur (« La foule bruisse. Avec beaucoup de pattes. »). | — |
| **SYLVIE** | `sylvie` | **Absente**, en écho : le badge, une fois propre, grésille « BADGE… VALI… GARRY… » avec sa voix ; et dans `ch1_suite`, un message brouillé de l'autre côté du multivers (« FORMULAIRE B-7/12 REQUIS POUR TOUT CHANGEMENT DE DIMENSION ») qui annonce la Station Bureaucratique. | existant |

Beats de dialogue (Ink, `content/story/ch1_*.ink`) :

- **`ch1_arrivee`** (onFirstEnter `nid-royal`, ou lignes `say:`) : Gary se relève ;
  B.O.B. inventorie (« Josiane : présente. Badge : présent. Seau : absent. Dignité :
  absente depuis longtemps. ») ; la Reine : « L'HOMME AU SEAU SANS SEAU. LA PROPHÉTIE
  N'AVAIT PAS PRÉVU ÇA. »
- **`ch1_reine`** : 1re audience → choix (« Je suis intérimaire » / « Vous avez vu mon
  seau ? » / « Pourquoi moi ? ») → exigence du Signe ; ensuite branche « attente » ;
  après `ch1_signe_reconnu` → remise du Seau (+ réplique yaourt) ; après le seau →
  rappel « LE TEMPLE, GARRY ».
- **`ch1_scribe`** : récitation de la prophétie, menu (la prophétie / les cafards et la
  galaxie / « pourquoi deux R ? » → « UNE FAUTE DE FRAPPE DIVINE N'EST PAS UNE FAUTE »).
- **`ch1_signe`** : badge propre → proclamation, applaudissements, `# set: ch1_signe_reconnu`.
- **`ch1_bob`** : indices contextuels (ordre des flags ci-dessus) + `+ [« Raconte-moi
  quelque chose de déprimant. »]` version cafards (« Ils vivent 6 mois et ils ont l'air
  plus épanouis que moi. »).
- **`ch1_plouf`** : seau sur l'éclat, 3 choix ironiques (« Avec délicatesse » / « Avec
  professionnalisme » / « Comme d'habitude ») → tous finissent en PLOUF, `# give:
  fragment # set: ch1_eclat_stabilise`.
- **`ch1_couronnement`** : la Reine adoube Gary « NETTOYEUR DES MONDES » (« Je peux
  avoir ça par écrit ? Pour la RH ? ») ; l'éclat projette sur le mur la position du
  prochain morceau ; `# end: ch1_suite`.
- **`ch1_suite`** (joué dans l'écran de fin) : faille, écho SYLVIE brouillé, tampon
  administratif géant qui traverse l'écran ; B.O.B. : « J'ai un mauvais
  pressentiment. Il est en trois exemplaires. » → « À suivre… ».

## 5. Condition de fin et transition

- **Fin** : `useItem: fragment` sur `reine` (avec `ch1_eclat_stabilise`) → dialogue
  `ch1_couronnement` → tag `# end: ch1_suite`. `RoomScene.end()` lance `End` avec
  `{ knot: 'ch1_suite' }`.
- **EndScene** : aujourd'hui câblée sur ch.0 (plan 3D de la Reine, flag
  `chapitre0_termine`). On la paramètre par knot : une table
  `END_BY_KNOT = { cafards: { flag: 'chapitre0_termine', shot: 'roaches' }, ch1_suite:
  { flag: 'chapitre1_termine', shot: 'stub' } }`. Le plan `stub` du ch.1 = fond 2D
  (dégradé + texte « STATION BUREAUCRATIQUE — FORMULAIRE EN COURS DE TRAITEMENT »),
  puis le même « À SUIVRE… ». Pas de ch.2 implémenté.
- Bouton supplémentaire sur l'écran de fin du ch.0 : **« Chapitre 1 → »** (lance le
  ch.1 avec son état initial propre). Sur l'écran de fin du ch.1 : seulement « Menu ».

## 6. Démarrer / reprendre le ch.1 — approche retenue

Principe : **un chapitre = un état initial déclaré**, pas de nouvelle sauvegarde ni de
nouveau format.

1. **`ChapterDef`** (`src/engine/walkthrough.ts`) gagne `startScene` et `initial: {
   items, flags }`. ch0 : `startScene: 'placard'`, rien d'autre. ch1 :
   `startScene: 'nid-royal'`, `items: [serpilliere, badge]`, `flags: [ch1,
   chapitre0_termine]`. Une fonction pure `chapterState(content, ch)` construit le
   `GameState` (aucun flag/objet du ch.0 hérité hormis ceux-là → **état initial
   propre**, la sauvegarde ch.0 n'interfère pas). `walkChapter` l'utilise au lieu de
   `new GameState(content.startScene)`.
2. **`?chapter=1`** (`src/engine/debug.ts`, champ `chapter`) : `TitleScene` démarre
   directement une nouvelle partie du ch.1 (`session.newGame('ch1')`), sauvegarde
   active (ce n'est pas un mode debug).
3. **Continuité** : bouton « Chapitre 1 → » sur l'écran de fin du ch.0 →
   `session.newGame('ch1')` puis `Room`. Une sauvegarde ch.0 terminée reprise par
   « Reprendre » revient à l'écran de fin, qui propose ce bouton.
4. **Reprise** : rien à faire — la sauvegarde contient `scene: 'nid-royal'` etc.,
   `loadGame()` la reprend. Pour l'écran de fin, `SaveData` gagne un champ optionnel
   `chapter?: string` (absent = `ch0`, rétrocompatible, `version` reste 1) afin que
   `End { final: true }` affiche la bonne fin.
5. **/creator** : `CHAPTERS` contient `ch1` → sélecteur `?ch=ch1`, checkpoints
   calculés par `walkChapter` ; « Jouer ici » écrit la sauvegarde et ouvre `?resume=1`
   (inchangé) ; « URL » utilise `?scene&flags&items` (inchangé, `scene=nid-royal`).
   Seul ajustement : le lien URL d'un checkpoint de fin ch.1 doit viser la bonne fin
   (aujourd'hui `scene=fin` = cliffhanger ch.0).

## 7. Fichiers à créer / modifier (Phase B)

**Créer**
- `content/scenes/ch1-nid-royal.yaml`, `ch1-galerie-des-offrandes.yaml`,
  `ch1-temple-couloir.yaml`, `ch1-coeur-eclat.yaml`.
- `content/story/ch1_reine.ink`, `ch1_scribe.ink`, `ch1_bob.ink`, `ch1_eclat.ink`
  (`ch1_plouf`, `ch1_couronnement`), `ch1_fin.ink` (`ch1_suite`). Assemblés
  automatiquement (`assembleInk`, ordre alphabétique) ; knots tous préfixés `ch1_`.

**Modifier**
- `content/items.yaml` : objet `fragment` (« Éclat du Réacteur (1/4096) ») ;
  combinaison `serpilliere` + `badge` gardée par `if: { flags: [ch1] }` (réplique
  neutre sinon, pour ne rien changer au ch.0) ; `look` du seau / de la serpillière :
  entrées ch.1 en tête, gardées par `ch1`.
- `content/game.yaml` : personnage `scribe`. `startScene` reste `placard`.
- `src/engine/walkthrough.ts` : `startScene`/`initial` dans `ChapterDef`,
  `chapterState()`, entrée `ch1` (steps = arbre §3, `endKnot: 'ch1_suite'`).
- `src/engine/types.ts` : `ArtShape.image` (+ `scale`, `flipX`) ; `SaveData.chapter?`.
- `src/engine/HotspotLayer.ts` : dessin de `image` (sprite cafard 2D).
- `src/engine/GameState.ts` : sérialiser `chapter`.
- `src/engine/debug.ts` : `?chapter=1`.
- `src/session.ts` : `newGame(chapterId = 'ch0')` via `chapterState()`.
- `src/scenes/TitleScene.ts` : `?chapter=1` ; préchargement de `roach-2d.png`.
- `src/scenes/EndScene.ts` : fin paramétrée par knot (`END_BY_KNOT`), plan stub ch.1,
  bouton « Chapitre 1 → » après le ch.0.
- `src/creator/main.ts` : lien URL de fin selon le chapitre.
- `src/ui/music.ts` : `SCENE_THEME` pour les 4 ids.
- `src/i18n/locales/fr.ts` (+ `en.ts`) : `end.nextChapter`, `end.locationCh1`,
  texte du plan stub — obligatoire, `check:i18n` refuse les littéraux.
- `content/locales/en.yaml` : facultatif (repli FR clé par clé) ; au minimum titres de
  pièces et nom du `fragment` si le temps le permet.
- `tools/playthrough.ts` : boucle déjà sur `CHAPTERS` ; vérifier en plus
  `fragment` dans l'inventaire avant la fin du ch.1.
- `src/engine/repair.ts` : invariant ch.1 si un dialogue donne/retire en plusieurs
  temps (`ch1_eclat_stabilise` sans `fragment` → redonner `fragment`).

**Ne pas toucher** : contenu ch.0 (scènes `placard/couloir/labo/panneau`, Ink ch.0)
hormis les ajouts gardés par `ch1` dans `items.yaml`.

## Vérification attendue (Phase B)

`npm run build` (inclut `check:i18n`) ; `npm run playthrough` : ch0 inchangé (même
nombre de checkpoints) puis ch1 jusqu'à `ch1_suite` ; captures `/creator?ch=ch1` et
d'une salle ch.1.

## Reste à faire (hors MVP)

- Pièce 3D `nid-royal` (`src/three/rooms/`) avec cafards `roachSprite()` billboard et
  Reine en sprite couronné ; plans d'arrivée filmés.
- Sprite cafard GenAI (planche de poses, `_briefs/roach-2d/README.md`).
- Portrait du Scribe (planche GenAI ou variante de `reine`).
- Traduction anglaise complète du ch.1.
- Mini-animations (PLOUF sur l'éclat, foule qui se rue) — `beats.ts`.
