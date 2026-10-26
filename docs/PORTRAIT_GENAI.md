# Portraits parlants — planches GenAI

Les portraits de dialogue sont des **planches de sprites** dans `public/portraits/`.
Deux sources selon le personnage :

| Id | Source | Régénération |
|---|---|---|
| `gary` | **GenAI v2** (planche stabilisée validée par Leny, design « Janék ») — plus de bake | à la main, voir ci-dessous |
| `bob`, `sylvie`, `reine` | bake du Studio 3D (`src/three/Studio.ts`) | `npm run bake:portraits` |

Pas de GenAI au runtime. Un PNG présent dans `public/portraits/` prime ; s'il manque,
le jeu bake la planche au démarrage — **sauf pour les planches GenAI** (`GENAI_SHEETS`
dans `Studio.ts`) : ni `bake:portraits` ni le boot ne les régénèrent ou ne les écrasent
(si le PNG manque, repli sur le portrait 3D fixe). Le 3D suit l'image, pas l'inverse.

## Gary — planche GenAI (v2 stabilisée)

**v2 validée par Leny (2026-10-26)** : Gary et son drone sont verrouillés sur les 8 frames
(même cadrage, même casquette / lunettes / harnais, drone à la même place), fond bleu nuit
uni `#071D40`. Seuls la bouche et les yeux changent.

Fichiers :
- `public/portraits/gary-sheet.png` — planche v2, 1024 × 512, 4 × 2 frames de 256 px.
  **C'est la source de vérité suivie dans le repo** (copie exacte de la v2 validée,
  sha256 `feea3813…a9334a`).
- `public/portraits/gary-ref.png` — frame idle0 de la v2 seule (256 × 256), référence pour
  les prochaines générations.

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
  le drone sur l'épaule penche la tête (frame idle3) — garder son œil bleu dans le cadre.
- B.O.B. : la « bouche » est un égaliseur LED cyan sur la plaque (barres plus ou moins hautes).
- SYLVIE : visage-écran ; bouche = ovale lumineux qui grandit ; clignement = « —   — ».
- Reine : mandibules qui s'écartent, gueule sombre qui s'ouvre.

## Prompt — style lock

> low-poly toon cartoon, flat MeshToon shading, hard purple shadows, cream highlights,
> dark edge lines, Agent A / Sam & Max dialogue bust, matching reference

À ajouter : le personnage et l'état de bouche de chaque frame, « same framing, same
background gradient and scanlines as reference, 4×2 sprite sheet, no gaps, no borders ».

Ce style lock vaut pour les personnages bakés (B.O.B., SYLVIE, Reine). Gary a quitté le
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

La planche n'a que idle/talk : pas de mécanisme d'humeur dans le dialogue. La sheet
Janék propose 6 expressions (neutre, surpris, sceptique, content, agacé, réfléchit).
Pour les brancher : un tag Ink (`# mood: sceptique`), une ligne de planche par humeur
(ou une planche par humeur), et des poses de sourcils / bouche dans `setFace` de `gary()`.
