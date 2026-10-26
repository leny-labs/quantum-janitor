# Portraits parlants — remplacement GenAI

Les portraits de dialogue sont des **planches de sprites bakées depuis la salle 3D**
(`src/three/Studio.ts`, mêmes props et matériaux toon que le jeu). C'est la source
de vérité. Une image générée peut **remplacer** une planche, à condition de garder
exactement le même layout et le même style. Pas de GenAI au runtime.

```
npm run bake:portraits     # (re)génère public/portraits/{id}-sheet.png + {id}-ref.png
```

Ids : `gary`, `bob`, `sylvie`, `reine`. Un PNG présent dans `public/portraits/` prime ;
s'il manque ou est illisible, le jeu bake la planche au démarrage.

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

- Gary (design « Janék », voir `docs/STORY.md`) : vraie bouche dans la barbe de trois jours
  (fente → mâchoire ouverte, dents, langue) ; le drone sur l'épaule penche la tête et cligne
  (frame idle3) — garder son œil bleu dans le cadre.
- B.O.B. : la « bouche » est un égaliseur LED cyan sur la plaque (barres plus ou moins hautes).
- SYLVIE : visage-écran ; bouche = ovale lumineux qui grandit ; clignement = « —   — ».
- Reine : mandibules qui s'écartent, gueule sombre qui s'ouvre.

## Prompt — style lock

> low-poly toon cartoon, flat MeshToon shading, hard purple shadows, cream highlights,
> dark edge lines, Agent A / Sam & Max dialogue bust, matching reference

À ajouter : le personnage et l'état de bouche de chaque frame, « same framing, same
background gradient and scanlines as reference, 4×2 sprite sheet, no gaps, no borders ».

Pour Gary, joindre aussi la concept sheet Janék (hors repo) comme référence de *design*
— le *style* reste celui du bake toon ci-dessus.

**Toujours attacher `public/portraits/{id}-ref.png`** (frame idle0 bakée) comme image de
référence, et idéalement la planche bakée entière comme guide de layout.

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
