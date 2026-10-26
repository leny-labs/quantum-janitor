# Portraits parlants — planches GenAI

Les portraits de dialogue sont des **planches de sprites** dans `public/portraits/`.
Deux sources selon le personnage :

| Id | Source | Régénération |
|---|---|---|
| `gary` | **GenAI v2** (planche stabilisée validée par Leny, design « Janék ») — plus de bake | à la main, voir ci-dessous |
| `sylvie` | **GenAI** (moniteur teal validé par Leny) — planche à **humeurs** + bouche-onde procédurale | à la main, voir « SYLVIE » |
| `bob` | **GenAI** (robot-aspirateur à écran-bouche validé par Leny) — planche + bouche-onde cyan procédurale | à la main, voir « B.O.B. » |
| `reine` | bake du Studio 3D (`src/three/Studio.ts`) | `npm run bake:portraits` |

Pas de GenAI au runtime. Un PNG présent dans `public/portraits/` prime ; s'il manque,
le jeu bake la planche au démarrage — **sauf pour les planches GenAI** (`GENAI_SHEETS`
dans `Studio.ts`) : ni `bake:portraits` ni le boot ne les régénèrent ou ne les écrasent
(si le PNG manque, repli sur le portrait 3D fixe). Le 3D suit l'image, pas l'inverse.

## Gary — planche GenAI (v2 stabilisée)

**v2 validée par Leny (2026-10-26)** : Gary et son drone sont verrouillés sur les 8 frames
(même cadrage, même casquette / lunettes / harnais, drone à la même place), fond bleu nuit
uni `#071D40`. Seuls la bouche et les yeux changent.

Fichiers :
- `public/portraits/gary-sheet.png` — planche de **base** v3, 1024 × 512, 4 × 2 frames de 256 px :
  pixels de la v2 validée, **drone retiré** (fond navy rebouché). Le drone est un calque
  séparé, voir « Gary : base + calque robot » ci-dessous.
- `public/portraits/gary-robot.png` — calque du drone dorsal (8 poses).
- `public/portraits/gary-ref.png` — frame idle0 de la v2 seule (256 × 256, drone compris),
  référence pour les prochaines générations.

Aucun bake ne l'écrase : `bake:portraits` et le bake runtime au boot sautent Gary
(`GENAI_SHEETS` dans `Studio.ts`), et il n'y a pas de script `predev` / `prebuild`.
Vérifié : hash de `gary-sheet.png` / `gary-ref.png` identiques avant et après
`npm run bake:portraits`.

Sources de la v1 (historique, hors repo) : `../qj-janek-genai/` (planche de ref `master.jpg`,
frames `frame-{0..7}-*.png`, `gary-anim.gif`).

Mapping de la planche v2 :

| | col 0 | col 1 | col 2 | col 3 |
|---|---|---|---|---|
| **idle** | 0 · neutre, sourire fermé | 1 · paupières mi-closes | 2 · yeux fermés (clignement) | 3 · neutre, petit sourire |
| **talk** | 4 · bouche mi-ouverte | 5 · grand sourire ouvert | 6 · lèvres entrouvertes | 7 · bouche en « o » |

Régénérer :
1. Générer les 8 frames 256 × 256 en image-to-image depuis la planche de ref de Leny
   (+ `gary-ref.png` comme ancre de cadrage), même fond bleu nuit uni `#071D40`, même cadrage,
   seuls bouche / yeux / drone changent (ordre : tableau ci-dessus).
2. Assembler en 4 × 2 sans marge, par ex. :
   `magick montage frame-{0..7}-*.png -tile 4x2 -geometry +0+0 gary-sheet.png`
   (garder ≤ 1024 px de côté ; 2048 × 1024 marche aussi, la grille est déduite de l'image).
3. Copier `gary-sheet.png` et `gary-ref.png` (frame 0) dans `public/portraits/`.
4. Ne **pas** lancer de bake pour Gary : il est exclu via `GENAI_SHEETS`.

## Gary : base + calque robot

Le mini-robot sur le dos de Gary (drone dorsal du design Janék — **pas** B.O.B.) est un
sprite séparé, collé par-dessus le portrait et animé sur **sa propre timeline** : toutes
les combinaisons pose de Gary × pose du drone sont possibles.

Fichiers :
- `public/portraits/gary-sheet.png` — base 1024 × 512, même layout que la v2 (4 × 2 @256),
  pixels v2 identiques hors drone ; drone retiré, fond rebouché.
- `public/portraits/gary-robot.png` — bande 640 × 112 RGBA, **8 frames de 80 × 112** en
  ligne, fond transparent.

Ancrage : le coin haut-gauche de chaque frame robot se pose en **(x = 160, y = 48)** d'une
cellule de 256 px de la planche ; à l'écran, offset = (160/256, 48/256) et taille =
(80/256, 112/256) de la taille affichée de la cellule. Base + robot r0 reproduit la v2
(MAD 0,03).

| r0 | r1 | r2 | r3 | r4 | r5 | r6 | r7 |
|---|---|---|---|---|---|---|---|
| neutre | flotte (−1 px) | haut de flottaison (tilt) | penche dehors | regarde Gary | regarde Gary + pulse de lueur | obturateur mi-clos | obturateur fermé (clignement) |

Code :
- `PORTRAIT_OVERLAYS` dans `src/three/Studio.ts` : géométrie (frames, taille, ancrage en px
  de cellule 256) et timelines `idle` (~8,9 s, durées irrégulières, décalée de `SHEET.idle`)
  / `talk` (plus de r4 / r5 : il regarde Gary pendant qu'il parle). Texture `overlayKey(id)`
  = `portraitOverlay:gary`, chargée par `preloadPortraitSheets`.
- `src/ui/PortraitOverlay.ts` (`OverlayPlayer`) : Image Phaser découpée en frames `r0..r7`,
  départ à un rang aléatoire de la boucle. Passer en `talk` ne remet **pas** la boucle à
  zéro (la pose en cours finit son temps, la suite reprend au même rang) : aucune synchro
  avec le lip-flap.
- Dialogue (`DialogueBox`) : le calque est enfant du conteneur interne de `TalkingPortrait`
  (même transform, respiration et visibilité que la face), placé d'après le fit « cover »
  de la planche. Visible seulement si le speaker a un calque et que sa planche est affichée.
- Intro (`SheetPortrait` dans `IntroScene`) : même calque au-dessus de la planche, dans le
  même cadre.

Régénérer : script **hors repo** `v3-build.py` (copie dans `_briefs/gary-overlay/`, non
suivi), qui part du master v2 (`v2-gary-master.png`) et du masque robot v2b
(`v2b-robot-mask.png`) : détourage du drone, rebouchage du fond pour la base, puis rendu
des 8 poses du calque. Garder la bande à 8 × (80 × 112) et l'ancrage 160/48, ou mettre à
jour `PORTRAIT_OVERLAYS` en conséquence.

## SYLVIE — planche GenAI à humeurs + onde

**Validée par Leny (2026-10-26)** : moniteur teal à liseré cyan, visage cyan (2 yeux),
une **onde** en guise de bouche, label « SYLVIE », fond navy.

Fichiers :
- `public/portraits/sylvie-sheet.png` — 1024 × 512, 4 × 2 frames de 256 px, **sans onde**
  (zone de l'écran rebouchée en teal uni) : la bouche est dessinée par le jeu.
- `public/portraits/sylvie-ref.png` — cellule « calme » complète (onde comprise), 256 × 256,
  référence pour les prochaines générations.

Mapping (une colonne par humeur) :

| | col 0 · `calm` | col 1 · `suspicious` | col 2 · `angry` | col 3 · `love` |
|---|---|---|---|---|
| **ligne 1 — yeux** | 0 · ronds | 1 · paupières mi-closes | 2 · chevrons `> <` | 3 · cœurs |
| **ligne 2 — accent** | 4 · clignement `—  —` | 5 · plisse encore | 6 · tressaillement | 7 · cœurs qui battent (plus petits) |

Le moniteur est **pixel-identique** sur les 8 frames : seule la zone des yeux change
(pas de saut de cadrage).

Code :
- `PORTRAIT_MOODS` dans `src/three/Studio.ts` : boucles idle / talk **par humeur** (à la
  place de `SHEET`), via `sheetLoops(id, mood)`. Humeur par défaut : `calm`.
- `PORTRAIT_WAVES` (`Studio.ts`) + `src/ui/WaveMouth.ts` : **bouche-onde** façon B.O.B. /
  Bender, polyligne cyan à lueur (halo, lueur, cœur) dessinée par-dessus la planche, de
  x 62 à 188, centrée en y 161, amplitude 13 (px de cellule 256). Au repos : signal quasi
  plat qui ondule à peine ; en parole (`face.talking`) : amplitudes qui bougent (enveloppe
  de syllabes), lissées à l'entrée / sortie. L'humeur change le tracé : `angry` en dents de
  scie rapides, `love` en sinus doux, `suspicious` lent.
- Dialogue (`DialogueBox`) : l'onde est enfant du contenu de `TalkingPortrait`, comme les
  calques (même transform, respiration, visibilité). Changer d'humeur remonte la planche
  avec les boucles de l'humeur ; même humeur → la boucle continue.
- Intro (`SheetPortrait` dans `IntroScene`) : même planche + onde ; `say(…, mood)`.

### Humeurs : tags et heuristique

Humeurs : `calm` · `suspicious` · `angry` · `love` (`src/engine/mood.ts`).

- **Ink** : tag en fin de réplique, combinable avec les autres tags :
  `sylvie: MENSONGE ÉGALEMENT ENREGISTRÉ. # mood: angry`
  (`… # shake # mood: suspicious` marche aussi).
- **YAML** (scènes) : clé d'action `mood` à côté du `say` :
  ```yaml
  - say: "sylvie: LECTEUR ENCRASSÉ. VEUILLEZ CONTACTER UN AGENT D'ENTRETIEN."
    mood: suspicious
  ```
- Sans tag : `guessMood(texte)`, FR + EN, sans accents ni casse : « !! », infraction,
  sanction, interdit, négatif, mensonge, colère, retenue… → `angry` ; merci, bravo,
  excellent, félicitations, ♥, thank, well done, good citizen… → `love` ; suspect,
  vérification, hmm, non conforme, confirmer, analyse, surveillé, filmé, enregistré… →
  `suspicious` ; sinon `calm`.
- `npm run validate` refuse une humeur inconnue (tag Ink ou clé YAML).
- Seuls les personnages listés dans `PORTRAIT_MOODS` ont des humeurs ; le tag est ignoré
  pour les autres.

Régénérer : script **hors repo** `_briefs/sylvie/build/build-sheet.py` (non suivi) à partir
de `_briefs/sylvie/sylvie-eyes-grid.jpg` (grille 2 × 2 : calme, suspicieux, colère, amour) :
recalage des cellules sur le moniteur (corrélation de phase), moniteur de la cellule calme
avec yeux + onde effacés, yeux de chaque humeur collés en additif, variantes « accent »
par redimensionnement des yeux. `python3 -I build-sheet.py <grille.jpg> <dossier de sortie>`.
Ne **pas** lancer de bake pour SYLVIE : elle est dans `GENAI_SHEETS`.

## B.O.B. — planche GenAI + onde Bender

**Validée par Leny (2026-10-26)** : robot-aspirateur gris, LED d'antenne rose, plaque
« B.O.B. » au-dessus d'un **écran-grille** en guise de bouche (bezel légèrement penché),
fond navy. Source : `_briefs/bob/bob-genai-nobrows.jpg` (1024², non suivi) — même robot
que la première version validée (`bob-genai-validated.png`) mais **sans sourcils peints**
(front métallique lisse) : les sourcils sont ceux du jeu (voir « Sourcils expressifs »).

Fichiers :
- `public/portraits/bob-sheet.png` — 1024 × 512, 4 × 2 frames de 256 px, cadrage bust
  comme SYLVIE (le robot remplit la cellule), **écran-bouche vide** (onde peinte effacée,
  fond d'écran sombre, barres et montants conservés) : la bouche est dessinée par le jeu.
  Pas de bouche humaine.
- `public/portraits/bob-ref.png` — cellule neutre complète (onde peinte comprise),
  256 × 256, référence pour les prochaines générations.

Mapping (boucles `SHEET` en calm ; humeurs : voir « Sourcils expressifs ») — le robot est **pixel-identique** sur
les 8 frames, seules les paupières et la LED d'antenne changent :

| | col 0 | col 1 | col 2 | col 3 |
|---|---|---|---|---|
| **idle** | 0 · neutre | 1 · clignement (paupières grises fermées) | 2 · LED qui pulse | 3 · paupières mi-closes (blasé) |
| **talk** | 4 · LED moyenne | 5 · neutre | 6 · LED faible | 7 · LED à fond |

En talk, pas de paupières : à ~9 i/s, elles clignoteraient. La LED qui varie suit la voix.

Onde (`PORTRAIT_WAVES.bob` dans `Studio.ts`, dessinée par `src/ui/WaveMouth.ts`) : de
x 60 à 158, centrée en y 188, amplitude 7 (px de cellule 256), entre les deux barres de
l'écran-grille, **inclinée de 3,2°** (`angle`, positif = côté droit plus bas, rotation
autour du centre de l'onde) : la grille est penchée, angle mesuré sur les deux barres
horizontales de la source (ajustement linéaire : 3,1° et 3,4°). Cyan Bender `#5ff6ff` (cœur `#e6feff`), `rest: 0.04` : au repos une ligne
quasi plate, en parole des amplitudes qui bougent sur les syllabes. Champs optionnels de
`PortraitWave` : `color`, `core`, `rest`, `angle` (SYLVIE garde ses valeurs par défaut,
angle 0). Même
logique que l'écran-bouche 3D en salle (`src/three/rooms/bobvoix.ts`, `setFace` de
`props.bob`). Dialogue et intro : rien de spécifique, `showWave` / `SheetPortrait` prennent
toute entrée de `PORTRAIT_WAVES`.

Régénérer : script **hors repo** `_briefs/bob/build/build-sheet.py` (non suivi) :
recadrage carré 920 px (x 52, y 22) → 256, effacement de la teinte cyan dans l'écran,
paupières peintes (couleur du corps échantillonnée à côté de l'œil), halo additif de LED.
`python3 -I build-sheet.py <bob-genai-nobrows.jpg> <dossier de sortie>`. Plus de passe
d'effacement de sourcils : la source n'en a pas.
Ne **pas** lancer de bake pour B.O.B. : il est dans `GENAI_SHEETS`.

### Sourcils expressifs (procéduraux, pas de sprites)

La source n'a **pas de sourcils peints** (`bob-sheet.png` et `bob-ref.png` ont un front
lisse, sans artefact d'effacement). Le jeu dessine deux plaques gris acier (`src/ui/Brows.ts`, `PORTRAIT_BROWS.bob` dans
`Studio.ts` : centre, longueur, épaisseur et rayon d'œil en px de cellule 256 ; centres
posés sur le liseré du haut de chaque orbite, gauche x 61 y 122, droit x 164 y 125), orientées
selon l'humeur de la réplique. Poses partagées avec le robot 3D : `BROW_POSES` dans
`src/engine/brows.ts` (`y` en rayons d'œil, `rot` en degrés bout intérieur relevé,
`bend` cambrure, `len` longueur).

| humeur | pose |
|---|---|
| `calm` | posés sur le haut des yeux, intérieurs un peu relevés (blasé, comme la peinture d'origine) |
| `suspicious` | gauche haut et un peu arqué, droit bas et plissé (intérieur plongé) |
| `angry` | en V : intérieurs plongés sur les yeux |
| `love` (= happy) | relevés et arrondis |
| `surprised` | très hauts, légèrement arqués |
| `sad` | en ^ : intérieurs relevés, extérieurs tombants |

Animation : ressorts un peu sous-amortis (le changement d'humeur « claque »), sursaut
des deux sourcils sur les accents du typewriter (« ! », « ? » — gauche plus haut —, mot
qui commence par une capitale), micro-sursauts aléatoires pendant la parole, retour à la
pose de l'humeur dès qu'il se tait. Pose posée sans transition quand B.O.B. prend la parole.

En salle : les plaques au-dessus des yeux de `props.bob` sont les sourcils (gris acier
sombre, hors des groupes `eyes`), pilotés par `userData.setBrows` ; `BobVoice.talk(s, mood)`
(RoomScene → `lineMood`) prend la pose de l'humeur, sursaute sur les syllabes, revient
à `calm` au `hush`. `bend` est ignoré en 3D.

Humeurs : `MOODS` gagne `surprised` et `sad` (heuristique : « ?! », oh non → surprised ;
soupir, triste, seul → sad, testées après les autres). Une humeur que la planche d'un
personnage ne connaît pas retombe sur son `fallback` pour la planche et l'onde
(`portraitMood`) : SYLVIE ne change pas. `PORTRAIT_MOODS.bob` varie un peu la planche
(paupières mi-closes en sad / suspicious, LED qui s'affole en angry). Toutes les
répliques de B.O.B. (ink + YAML) portent un `# mood:` / `mood:`.

## Layout de la planche (`{id}-sheet.png`)

Grille **4 colonnes × 2 lignes**, frames carrées, lues ligne par ligne.
Taille de référence : 1024 × 512 (frames de 256 px). Max 1024 px de côté (mobile).
Toute taille au ratio 2:1 marche : la grille est déduite de l'image.

| | col 0 | col 1 | col 2 | col 3 |
|---|---|---|---|---|
| **ligne 1 — idle** | 0 · neutre, bouche fermée | 1 · clignement (yeux fermés) | 2 · inspire (buste à peine plus haut) | 3 · tête légèrement penchée |
| **ligne 2 — talk** | 4 · bouche mi-ouverte | 5 · grande ouverte | 6 · entrouverte | 7 · ouverte (≈ ¾) |

Boucles (voir `SHEET` dans `Studio.ts`) : idle = 0 0 1 0 2 0 3 2 avec temps de pause,
talk = 4 5 6 5 7 4 6 7 à 9 i/s. Entre deux frames, **seuls la bouche, les yeux et un
micro-mouvement de tête** changent : même cadrage, même fond, même éclairage.

- Gary (design « Janék », voir `docs/STORY.md`) : vraie bouche dans la barbe de trois jours ;
  le drone dorsal est un calque à part (voir « Gary : base + calque robot »).
- B.O.B. : planche GenAI (voir « B.O.B. ») ; bouche = onde cyan procédurale sur l'écran-grille.
- SYLVIE : planche GenAI à humeurs, layout propre (voir « SYLVIE ») ; bouche = onde procédurale.
- Reine : mandibules qui s'écartent, gueule sombre qui s'ouvre.

## Prompt — style lock

> low-poly toon cartoon, flat MeshToon shading, hard purple shadows, cream highlights,
> dark edge lines, Agent A / Sam & Max dialogue bust, matching reference

À ajouter : le personnage et l'état de bouche de chaque frame, « same framing, same
background gradient and scanlines as reference, 4×2 sprite sheet, no gaps, no borders ».

Ce style lock vaut pour les personnages bakés (Reine). Gary a quitté le
bake : son style est celui de la planche v2 de Leny (cartoon encré, fond bleu nuit
`#071D40`) — joindre `public/portraits/gary-ref.png` et `gary-sheet.png`.

**Toujours attacher `public/portraits/{id}-ref.png`** (frame idle0) comme image de
référence, et idéalement la planche entière comme guide de layout.

**Interdit** : photoréaliste, anime brillant / cel-shading glossy, pixel art, dégradés
lisses façon 3D PBR, changement de palette, de cadrage ou de fond d'une frame à l'autre.

## Vérifier un remplacement

1. Déposer le PNG à `public/portraits/{id}-sheet.png` (ratio 2:1, ≤ 1024 px).
2. `npm run dev`, ouvrir un dialogue du personnage : la boucle idle tourne au repos,
   talk pendant la frappe du texte, idle aux pauses (. ! ?) et au clic « passer ».
3. Pas de saut de cadrage entre frames : sinon le portrait « tremble ».

## Expressions (suite possible)

Le mécanisme d'humeur existe (voir « SYLVIE » : tag `# mood:`, clé YAML `mood`,
`PORTRAIT_MOODS`). Pour Gary, la sheet Janék propose 6 expressions (neutre, surpris,
sceptique, content, agacé, réfléchit) : il faudrait une planche plus grande (ou une planche
par humeur, avec bouche), étendre `MOODS` dans `src/engine/mood.ts` et ajouter `gary` à
`PORTRAIT_MOODS`.
