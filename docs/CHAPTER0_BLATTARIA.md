# Chapitre 0 — acte 2 : Blattaria Prime — design

> **Renumérotation t173–t176 (2026-11-03)** : ce document décrivait l'ancien
> « chapitre 1 ». Blattaria Prime est désormais l'**acte II du chapitre 0** (acte I =
> Klepsydra-9, « Le Seau »). Les ids internes `ch1-*` / `ch1_*` cités ci-dessous sont
> **conservés tels quels** (préfixe historique = « acte Blattaria ») ; voir
> [`CHAPTERS.md`](CHAPTERS.md) pour le mapping, la migration des sauvegardes et le
> plan de fusion. Le nouveau chapitre 1 est la Station Bureaucratique
> ([`CHAPTER1.md`](CHAPTER1.md)). Le texte ci-dessous est inchangé (historique) :
> « ch.1 » y désigne l'acte Blattaria, « ch.2 » la Station.

> Dimension B-7. Les cafards ont hérité de la galaxie, et ils ont une prophétie.
> Gary a un badge avec deux R. Pour eux, ça suffit.

Suite directe du cliffhanger du ch.0 (`fin.ink`, knot `cafards`). Même moteur, même
grain de puzzles, même ton (*Space Quest* × *Rick & Morty* × *Paranoia* × *Futurama*,
voir `docs/STORY.md`). Scope : MVP jouable de bout en bout sur un chemin scripté.

## 1. Pitch

> **Réécriture « containment » (2026-11-03, validée par Leny)** : plus de thème
> nettoyage dans l'intrigue. Le ch.0 était un jeu de ménage ; le ch.1 fait évoluer
> Gary : il y **perd ses outils de janitor** (Josiane, puis le Seau) et repart en
> **combinaison de chitine**, gardien d'une faille plutôt qu'agent d'entretien.

Gary s'est réveillé face contre un sol tiède et collant, au pied du trône de
**Sa Majesté Blattaria XIV**. Pour les cafards de B-7, il est **l'Homme au Seau** de
la prophétie : « QUAND LE NID SE REPLIERA, VIENDRA L'HOMME AU SEAU. IL **TIENDRA
L'ÉCLAT**, ET LA **FAILLE SE REFERMERA**. » Problème : le Seau est passé dans la
faille avant Gary. Les cafards l'ont trouvé, l'ont léché (consciencieusement), et
l'ont posé sur un autel. On ne touche pas au Seau Sacré. Sauf l'Homme au Seau. Qui
doit d'abord prouver qu'il est l'Homme au Seau. Avec un badge qui sent le thon.

Au fond de la galerie des offrandes, les cafards vénèrent « le Temple de l'Ancien
Couloir » : un morceau de **Klepsydra-9** échoué là — le couloir C, distributeur
compris. Coincé derrière la spirale du Distrib'Ô-Matic pulse un **éclat du Réacteur
d'Improbabilité** : un morceau d'improbabilité, une **faille** ouverte en plein nid.
Elle **menace le nid** : les murs clignotent, le Nid se replie (la nurserie est
aussi dans la cuisine), les cafards apparaissent en double (le Scribe est deux), la
gravité hésite dans le Temple. Gary doit **contenir** l'éclat, sinon le nid
s'effondre jusqu'à tenir dans une miette. Le prix : Josiane reste coincée dans le
distributeur, et le Seau devient le réceptacle de la faille. L'Homme au Seau…
sans seau. Encore.

**Running gags mobilisés** : GARRY (le badge fait foi, littéralement : c'est le Signe
de la prophétie) ; tout est tiède (même l'eau bénite, même la réussite) ; Gary est
intérimaire (« je ne peux pas être un messie, je suis en période d'essai ») ; PLOUF
(le seau sur l'éclat — un bon PLOUF, cette fois, « le PLOUF qui referme ») ; le yaourt (il a quitté le seau en arrivant : « UN ÊTRE LACTÉ. IL EST PARTI
FONDER QUELQUE CHOSE. » — graine du ch.5 *L'Envers du Yaourt*) ; le distributeur qui
recoince toujours quelque chose (cette fois : Josiane).

## 2. Vues / salles

Même logique que ch.0 : 3 pièces + 1 gros plan. Ids kebab-case, fichiers
`content/scenes/ch1-<id>.yaml` (le glob de `contentBrowser.ts` n'est pas récursif :
le préfixe de fichier range le chapitre, l'`id` reste celui ci-dessous).

| id | Titre / secteur | Rôle | Hotspots principaux |
|---|---|---|---|
| `nid-royal` | **Nid Royal** · B-7 · Salle du Trône | Pièce de départ. La Reine, l'autel. | `reine` (talk, useItem badge/fragment), `autel` (Seau Sacré, `if: notFlags ch1_seau_rendu`), `courtisans` (look, sprites), `bob` |
| `galerie-des-offrandes` | **Galerie des Offrandes** · B-7 · Archives sacrées | Hub : prophétie, eau, miettes, foule. | `fresque` (look), `scribe` (Frère Élytre, talk/useItem badge), `bassin` (Bassin des Ablutions, tiède), `grenier` (Grenier aux Miettes), `foule` (bloque la sortie, `if: notFlags ch1_foule_dispersee`), `bob` |
| `temple-couloir` | **Temple de l'Ancien Couloir** · B-7 · Fragment K9-C | Le morceau de Klepsydra-9. | `distributeur` (Distrib'Ô-Matic devenu reliquaire), `compteur` (« 0000 JOURS SANS INCIDENT »), `hublot` (le multivers en mosaïque), `lecteur` (traces de yaourt… parties), `bob` |
| `coeur-eclat` | **Éclat du Réacteur** · Gros plan | Gros plan (comme `panneau`). | `eclat` (look/useItem seau), `jauge` (stabilité), `gravure` (« Mk IV — 1/4096 — NE PAS LÉCHER »), `seau_sacre` (le Seau qui contient la faille, `if: ch1_seau_perdu`) |

Navigation : `nid-royal` ⇄ `galerie-des-offrandes` ⇄ `temple-couloir` ⇄ `coeur-eclat`.
La sortie galerie → temple a `requires: { flags: [ch1_foule_dispersee] }` ; la sortie
temple → `coeur-eclat` a `requires: { flags: [ch1_eclat_tombe] }`.

**Rendu** : les 4 vues sont de **vraies pièces 3D RoomScene** (entrées de `ROOMS`
dans `src/three/rooms/index.ts` : `nid.ts`, `galerie.ts`, `temple.ts`, `eclat.ts`),
même mécanique que le ch.0 (caméra fixe, rect YAML projetés sur les props, travels
d'examen, plan d'arrivée `intro: reine` au Nid). Décor **toon** : coque organique
commune `rooms/hive.ts` (paroi de chitine peinte, sol de résine brillant, côtes de
voûte effilées, coulures, flaques ambrées, lanternes-œufs, bougies, brume) ; le Temple
réutilise le gabarit du couloir C (paroi acier, dalle, distributeur reconstruit en
reliquaire, sans toucher `vending.ts`). Les **personnages insectes sont des sprites
2D GenAI en billboard** (`THREE.Sprite`, non éclairés, teintés à la lumière de la
pièce, ombre disque) : cafards = planche `public/props/ch1/roach-sheet.png`
(`roachSprite(len, right, { pose, tint })`, poses `walk1`/`walk2`/`34`/`worship`,
foules via `crowd()`), Reine = `public/props/ch1/reine.png` sur un trône 3D, Frère
Élytre = `public/props/ch1/scribe.png` derrière son pupitre. Le survol d'un hotspot
éclaircit aussi la teinte des sprites (`Stage.highlight`). L'`art:` des YAML reste
comme repli 2D mais ne s'affiche plus. En dialogue : Reine = planche GenAI existante
(`reine-sheet.png`) ; Scribe = portrait fixe `public/portraits/scribe-portrait.png`
(buste recadré, `GENAI_PORTRAITS` dans `Studio.ts`).

Musique : `themeForScene()` retombe sur `couloir` pour un id inconnu ; MVP = mapper les
4 ids ch.1 sur les thèmes existants (`fin` pour `nid-royal`, `couloir` ailleurs) dans
`SCENE_THEME` (`src/ui/music.ts`).

## 3. Chaîne de puzzles

Objets ch.1 : **serpillière** (Josiane) et **badge « Garry »** arrivés avec Gary,
**seau** (rendu par la Reine, réutilise l'objet `seau` du ch.0), **éclat du réacteur**
(`fragment`, contenu), **combinaison de chitine** (`combi_chitine`, fin). Tous les
flags du chapitre sont préfixés `ch1_` ; le flag `ch1` marque l'état « on est dans
le chapitre 1 » (garde des textes partagés de `items.yaml`).

```
Arrivée (nid-royal, onFirstEnter, Ink ch1_arrivee) : la Reine accueille GARRY, garde le
Seau Sacré « JUSQU'À CE QU'IL AIT PROUVÉ QU'IL EST L'HOMME AU SEAU » ; les murs clignotent :
la faille du Temple replie le nid.
│
├─ PUZZLE 1 — Le Signe aux deux R (récupérer le Seau)
│   1. Parler à la Reine (ch1_reine) → prophétie de la faille + exigence du Signe. [ch1_audience]
│      L'autel est intouchable : utiliser l'autel → deux gardes croisent leurs pattes.
│   2. Galerie (cafards en double à l'entrée) : regarder la fresque → « LE SIGNE AUX
│      DEUX R ». Gary regarde son badge. Oh non.                             [ch1_sait_signe]
│   3. Badge sur le Scribe → refusé : il sent « LE POISSON ANCIEN ».        [ch1_badge_refuse]
│   4. Serpillière sur le bassin → Josiane trempée d'eau bénite. Tiède.   [ch1_josiane_mouillee]
│   5. Combiner serpillière + badge → badge désodorisé, « GARRY » brille.   [ch1_badge_propre]
│      (dernier usage de Josiane avant le Temple : pas de conflit)
│   6. Badge sur le Scribe → proclamation (ch1_signe).                     [ch1_signe_reconnu]
│   7. Nid : parler à la Reine → elle rend le Seau ; le yaourt est parti « FONDER
│      QUELQUE CHOSE » ; « TIENS L'ÉCLAT, REFERME LA FAILLE ».          [ch1_seau_rendu] +seau
│
├─ PUZZLE 2 — La Foule (accéder au Temple)  — inchangé
│   8. Regarder / parler à la foule → « SAUF POUR LE GOÛTER ».              (indice)
│   9. Grenier à mains nues → non. Seau sur le grenier → miettes.          [ch1_seau_miettes]
│  10. Seau sur la foule → goûter au fond de la galerie, passage libre.  [ch1_foule_dispersee]
│
└─ PUZZLE 3 — Tenir l'éclat, refermer la faille
   11. Temple (la gravité hésite) : regarder le distributeur → l'éclat derrière la
       spirale.                                                              [ch1_voit_eclat]
   12. Serpillière sur le distributeur (Ink ch1_josiane) → l'éclat tombe dans le
       logement de sortie… et la spirale fait un tour de plus : **Josiane reste
       coincée** (« Josiane… on avait dit jusqu'à la retraite »). Deux fidèles
       l'adorent déjà. Elle quitte l'inventaire.
                              [ch1_eclat_tombe] [ch1_josiane_coincee] −serpilliere
   13. Galerie : seau sur le bassin → seau d'eau bénite tiède.               [ch1_seau_plein]
   14. Gros plan coeur-eclat : jauge « STABILITÉ : GARY ». Seau sur l'éclat (Ink
       ch1_plouf, 3 choix ironiques) → PLOUF. Le seau aspire la chaleur, le
       grésillement, la faille : le Nid arrête de clignoter, les doubles fusionnent.
       L'éclat remonte, **contenu** dans une coque d'eau bénite figée : Gary le garde.
       Le seau, lui, flotte à 3 cm du bac, existe « un peu à gauche de lui-même » :
       il **contient la faille** et ne peut plus bouger. **Gary perd son seau.**
                [ch1_eclat_stabilise] +fragment, puis [ch1_seau_perdu] −seau
   15. Nid : éclat sur la Reine → couronnement (ch1_couronnement) : « GARDIEN DE LA
       FAILLE, TENEUR D'ÉCLAT » ; procession de la **Mue Sacrée** → combinaison de
       chitine.                                      [ch1_combi] +combi_chitine
       → # end: ch1_suite.
```

Le seau n'est plus porté jusqu'au bout : il reste au Temple comme réceptacle de la
faille (hotspot `seau_sacre` du gros plan, prop 3D flottant + double clignotant).
L'état « vide / miettes / eau » de son icône est porté par les flags tant que Gary
l'a ; après `ch1_seau_perdu` l'objet a quitté l'inventaire (pas d'icône fantôme).
Le verset 2 (« IL NE LÂCHERA PLUS SON SEAU ») est, de l'aveu du Scribe, traduit
« à quatre-vingts pour cent » — B.O.B. : « ils l'avaient traduit à l'envers ».

**Invariants (`src/engine/repair.ts`)** : `ch1_eclat_tombe` ⇒ `ch1_josiane_coincee` ;
`ch1_josiane_coincee` ⇒ pas de `serpilliere` ; `ch1_eclat_stabilise` ⇒ `fragment`
(hors fin) et `ch1_seau_perdu` ; `ch1_seau_perdu` ⇒ pas de `seau` ; `ch1_combi` ⇒
`combi_chitine`.

Réponses aux fausses pistes (au moins une par hotspot clé) : seau sur la Reine
(« GARDE-LE, C'EST TON SEAU. ENFIN, PAS ENCORE. ») ; badge sur la foule ; seau vide
sur l'éclat (« ça ferait clang ») ; fragment sur le Scribe ; coup de pied au
distributeur après Josiane (« ARTICLE TOUJOURS NON DISTRIBUABLE ») ; prendre le seau
sacré (« l'anse se décale poliment d'un univers ») ; `useItemDefault` sur les cafards.

## 4. Personnages et beats

| Perso | id | Rôle ch.1 | Portrait |
|---|---|---|---|
| **Gary Plunk** | `gary` | Messie malgré lui. Répète qu'il est intérimaire, en période d'essai, et qu'un messie a forcément un CDI. | existant |
| **B.O.B.** | `bob` | Compagnon d'office (suit Gary depuis le ch.0). **Système d'indices** : Ink `ch1_bob`, une branche par étape (même structure que `bob_compagnon`). Running gag : les cafards le vénèrent comme « LE GRAND AVALEUR » et il trouve ça, pour la première fois, presque agréable. | existant |
| **Sa Majesté Blattaria XIV** | `reine` | Donneuse de quête et de récompense. MAJUSCULES royales, « GARRY », le badge fait foi. Sincèrement émue par la prophétie. | GenAI existant (`reine-sheet.png`) |
| **Frère Élytre**, Grand Scribe | `scribe` | Gardien de la prophétie, pédant, myope (antennes-lunettes). Parle en citations numérotées (« PROPHÉTIE, VERSET 7, ALINÉA B »). Valide le Signe. | nouveau `characters` dans `game.yaml` ; portrait fixe GenAI `public/portraits/scribe-portrait.png` (buste recadré de `scribe-body.png`), repli texte `portrait: "✒\n(◔ ◔)"` |
| La Foule / les gardes | narrateur ou `scribe` | Décor parlant via `say:` narrateur (« La foule bruisse. Avec beaucoup de pattes. »). | — |
| **SYLVIE** | `sylvie` | **Absente**, en écho : le badge, une fois propre, grésille « BADGE… VALI… GARRY… » avec sa voix ; et dans `ch1_suite`, un message brouillé de l'autre côté du multivers (« FORMULAIRE B-7/12 REQUIS POUR TOUT CHANGEMENT DE DIMENSION ») qui annonce la Station Bureaucratique. | existant |

Beats de dialogue (Ink, `content/story/ch1_*.ink`) :

- **`ch1_arrivee`** (onFirstEnter `nid-royal`) : Gary se relève ; B.O.B. inventorie
  (« Josiane : présente. Badge : présent. Seau : absent. ») ; la Reine : « L'HOMME AU
  SEAU SANS SEAU. » ; les murs clignotent, « LE NID SE REPLIE SUR LUI-MÊME » ; B.O.B. :
  « un petit bout de notre catastrophe. Elle a suivi le seau. »
- **`ch1_reine`** : 1re audience → choix (« Je suis intérimaire » / « Vous avez vu mon
  seau ? » / « Pourquoi moi ? ») → exigence du Signe ; ensuite branche « attente » ;
  après `ch1_signe_reconnu` → remise du Seau (+ réplique yaourt) ; après le seau →
  rappel « LE TEMPLE, GARRY » (symptômes du nid : trône au plafond, étage perdu).
- **`ch1_scribe`** : récitation de la prophétie (verset 12 : « IL TIENDRA L'ÉCLAT, ET
  LA FAILLE SE REFERMERA »), menu (la prophétie / la faille — « JE SUIS DEUX » / les
  cafards et la galaxie / « pourquoi deux R ? »).
- **`ch1_signe`** : badge propre → proclamation, applaudissements, `# set: ch1_signe_reconnu`.
- **`ch1_bob`** : indices contextuels (ordre des flags ci-dessus) + `+ [« Raconte-moi
  quelque chose de déprimant. »]` version cafards (« Ils vivent 6 mois et ils ont l'air
  plus épanouis que moi. »).
- **`ch1_josiane`** : serpillière dans le distributeur, `# set: ch1_eclat_tombe`, la
  spirale garde Josiane, 2 choix (« Tirer plus fort » / « Négocier avec le
  distributeur »), « Josiane… on avait dit jusqu'à la retraite », `# take:
  serpilliere # set: ch1_josiane_coincee`.
- **`ch1_plouf`** : seau sur l'éclat, 3 choix ironiques → PLOUF ; le seau aspire la
  faille, le nid se calme `# set: ch1_eclat_stabilise` ; l'éclat contenu `# give:
  fragment` ; l'anse traverse la main de Gary, « Au revoir, seau. Tiens bon. » `# take:
  seau # set: ch1_seau_perdu` ; B.O.B. : « L'Homme au Seau. Sans seau. Encore. »
- **`ch1_couronnement`** : la Reine constate le nid sauvé, « L'HOMME AU SEAU… SANS
  SEAU. ENCORE. » (le seau restera au Temple, léché chaque jour) ; adoube Gary
  « GARDIEN DE LA FAILLE, TENEUR D'ÉCLAT » (« Je peux avoir ça par écrit ? Pour la
  RH ? ») ; procession de la **Mue Sacrée** (« IL Y A UN PEU DE MA GRAND-MÈRE DANS
  L'ÉPAULE GAUCHE » ; Gary : « Ça compte comme équipement de protection
  individuelle ? »), `# give: combi_chitine # set: ch1_combi` ; B.O.B. : « un cafard qui
  aurait fait des études » ; l'éclat projette le prochain morceau (un tampon) ;
  « IL RESTE 4 095 ÉCLATS. ET AUCUN NE SE TIENDRA TOUT SEUL. » `# end: ch1_suite`.
- **`ch1_suite`** (joué dans l'écran de fin) : faille, écho SYLVIE brouillé, tampon
  administratif géant qui traverse l'écran ; B.O.B. : « J'ai un mauvais
  pressentiment. Il est en trois exemplaires. » ; si `ch1_combi`, SYLVIE classe la
  combi « ANIMAL DE COMPAGNIE » ; Gary : « Pas de seau. Pas de Josiane. Une
  combinaison en cafard et un éclat tiède. B.O.B., on y va. Et cette fois, je
  badge. » → « À suivre… ».

## 5. Condition de fin et transition

- **Fin** : `useItem: fragment` sur `reine` (avec `ch1_eclat_stabilise`) → dialogue
  `ch1_couronnement` (nid sauvé, Gary sacré Gardien de la Faille, combi remise) → tag
  `# end: ch1_suite`. Plus de « premier monde lavé » : l'éclat est **contenu**, Gary
  le garde (`fragment`, 1/4096 = premier des 4 096 morceaux à tenir), le seau reste
  au Temple, Josiane dans le distributeur. `RoomScene.end()` lance `End` avec
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

## Implémentation (Phase B) — état et écarts au design

**Fait** : les 4 salles, les 3 puzzles et la fin sont jouables de bout en bout
(`npm run playthrough` : ch0 27 checkpoints inchangés, ch1 29 checkpoints jusqu'à
`ch1_suite`). Démarrer / reprendre :

| Comment | Effet |
|---|---|
| `/?chapter=1` | nouvelle partie du ch.1 (état initial propre : `serpilliere`, `badge`, flags `ch1`, `chapitre0_termine`), sauvegarde active — écrase la sauvegarde existante |
| Écran de fin du ch.0 → **« Chapitre 1 → »** | idem ; « Reprendre » sur une partie ch.0 finie ramène à cet écran |
| `/creator?ch=ch1` → « Jouer ici » | checkpoint du ch.1 écrit dans la sauvegarde (avec `chapter: 'ch1'`) puis `?resume=1` |
| `/?scene=<salle>&chapter=1&flags=…&items=…` | mode debug ; `scene=fin&chapter=1` = fin du ch.1 (les liens « URL » de /creator l'ajoutent) |

**Tester la transition ch.0 → ch.1 depuis /creator** (`ChapterDef.from: 'ch0'` →
`chapterPrelude()` dans `src/engine/walkthrough.ts`, hors solution : les comptes de
checkpoints du playthrough ne bougent pas). `/creator?ch=ch1` commence par la section
« ↪ Transition ch.0 → ch.1 » :

| Entrée | « Jouer ici » | « URL » (sauvegarde intacte) |
|---|---|---|
| ↪ fin ch.0 | sauvegarde ch.0 terminée + `?resume=1` → écran « À suivre… » ; **« Chapitre 1 → »** = `newGame('ch1')`, arrivée au Nid avec le plan d'arrivée filmé | `/?scene=fin&flags=…` : rejoue aussi le cliffhanger avant les boutons |
| ▶ lancement ch.1 | état initial, Nid jamais visité → intro `ch1_arrivee` filmée | `/?scene=nid-royal&chapter=1&flags=ch1,chapitre0_termine&items=serpilliere,badge&cine=1` |
| #0 début (« Départ direct ») | Nid, intro déjà vue (comme avant) | `/?scene=nid-royal&chapter=1&…` |

Sur `/creator?ch=ch0`, le checkpoint FIN porte « → suite : transition ch.1 »
(`/creator?ch=ch1#transition`).

Écarts au design ci-dessus :
- Sortie `temple-couloir` → `coeur-eclat` : `if: ch1_eclat_tombe` (n'apparaît qu'une
  fois l'éclat tombé) plutôt que `requires` + `lockedText`.
- `ch1_couronnement` ne retire pas l'éclat : Gary le garde (fin = tag `# end`). Il
  remet la combinaison de chitine (`combi_chitine`).
- Fin : table `END_BY_CHAPTER` (ch0 → plan 3D `roaches` + bouton « Chapitre 1 → » ;
  ch1 → plan `stub` 2D « Station Bureaucratique ») ; le chapitre est déduit du knot de
  fin (`CHAPTERS[].endKnot`), sinon de `SaveData.chapter`.
- Sprites cafards : texture `roach2d` (= `public/props/roach-2d.png`) préchargée par
  `TitleScene` ; art YAML `{ image: roach2d, at, scale, flipX }` (+ `color` = teinte).
- `tools/validate-content.ts` connaît les scènes de départ des chapitres et les flags
  posés par l'état initial / la fin (`ch1`, `chapitre1_termine`).
- Le seau ne peut être rempli d'eau bénite qu'après avoir vu l'éclat
  (`ch1_voit_eclat`), pour éviter un seau à la fois plein de miettes et d'eau.
- `en.yaml` : titres de pièces, libellés de hotspots / sorties, `fragment`, `scribe` ;
  répliques et Ink du ch.1 en français (repli clé par clé).

## Vérification attendue (Phase B)

`npm run build` (inclut `check:i18n`) ; `npm run playthrough` : ch0 inchangé (même
nombre de checkpoints) puis ch1 jusqu'à `ch1_suite` ; captures `/creator?ch=ch1` et
d'une salle ch.1.

## Reste à faire (hors MVP)

- Plans d'arrivée filmés pour la galerie et le temple (seul le Nid a son `intro`).
- Portrait parlant du Scribe (planche idle/talk au layout `GENAI_SHEETS` ; portrait fixe au MVP).
- Traduction anglaise complète du ch.1.
- Mini-animations (PLOUF sur l'éclat, foule qui se rue) — `beats.ts`.
- Musique propre au ch.1 (les 4 salles réutilisent `fin` / `couloir` / `labo`).
- Icônes d'inventaire GenAI pour `fragment` (glyphe texte au MVP) et variante
  « Josiane trempée d'eau bénite » (`GENAI_VARIANTS` ne connaît que `serpilliere_mouillee`).
- Gros plan `coeur-eclat` : pièce 3D à part entière (pas d'entrée `CLOSEUPS` : pas de
  travel caméra depuis le temple, retour par la flèche, pas par clic dans le vide).
- Vraie fin ch.1 filmée (tampons animés, faille) au lieu du plan `stub` statique.

## Notes design pour la suite (non codé)

- **Ch.2 = Station 2 bureaucratique** : paperasse, dialogues absurdes, fonctionnaires
  caricaturaux, très longs couloirs, **zéro nettoyage**. Gary y arrive en combinaison
  de chitine (SYLVIE la classe « animal de compagnie »), avec l'éclat contenu et
  B.O.B., sans seau ni serpillière.
- **Interlude futur** : mini-vaisseau très serré, énorme tableau de bord ; Gary doit
  trouver les boutons et une destination pour s'échapper. Entre deux chapitres (ex.
  ch.1 → ch.2). Seulement mentionné : aucune implémentation.

## TODO assets (combi de chitine)

- **Icône d'inventaire `combi_chitine`** : stub actuel = bake 3D toon
  (`combiChitine()` dans `src/three/props.ts`, entrée `ICONS` de `Studio.ts`).
  À remplacer par une icône GenAI `public/inventory/combi_chitine.png` (même cadrage
  que `fragment.png`) puis ajouter `combi_chitine` à `GENAI_ICONS`.
- **Planche GenAI « Gary en combi de chitine »** (concept sheet face/3⁄4/dos, design
  Janék + plastron segmenté, épaulières en élytres, col à antennes, écusson orange
  recousu) : pour le portrait parlant et les plans du ch.2. Pas d'overlay héros au ch.1.
- Plan filmé du PLOUF / seau flottant et de Josiane en vitrine (aujourd'hui : props
  3D conditionnés par `ch1_seau_perdu` / `ch1_josiane_coincee`, sans animation de
  transition).
