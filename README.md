# Quantum Janitor — Chapitre 0 : « Le Seau »

Point & click narratif, *Space Quest* × *Rick & Morty*.

Gary Plunk (badge « Garry », merci la RH), agent d'entretien intérimaire sur la
station *Klepsydra-9*, renverse son seau dans un Réacteur d'Improbabilité. La
station se scinde en 4 096 réalités. Son seul allié : B.O.B., un aspirateur-robot
dépressif. Ce dépôt contient le moteur et le chapitre 0, jouable de bout en bout
en 10–15 minutes.

Graphismes : placeholders (formes, couleurs, texte). L'histoire passe avant tout.

## Lancer le jeu

Prérequis : Node.js LTS (≥ 20).

```bash
npm install
npm run dev          # http://localhost:5173
```

| Commande | Rôle |
|---|---|
| `npm run dev` | serveur de développement Vite |
| `npm run build` | validation du contenu + typecheck + build dans `dist/` |
| `npm run preview` | sert le build localement |
| `npm run validate` | vérifie les références croisées du contenu |
| `npm run playthrough` | rejoue la solution complète sans navigateur (`-- -v` pour lire les dialogues) |

## Comment jouer

- **Clic sur un élément** → menu *Regarder / Utiliser (Prendre, Appuyer…) / Parler*.
- **Clic droit sur un élément** → le regarder directement.
- **Flèches** (◀ ▶ ▲ ▼) → changer de vue.
- **Inventaire** (en bas) : clic pour prendre un objet en main, puis clic sur un
  élément du décor pour l'utiliser dessus, ou sur un autre objet pour les
  combiner. Clic droit sur un objet : l'examiner. Clic droit dans le vide : le reposer.
- **Dialogues** : clic, Espace ou Entrée pour avancer ; touches 1–9 pour les choix.
- Sauvegarde **automatique** (localStorage). « Menu » ramène à l'écran titre.

## Mode debug (URL)

```
?scene=labo&flags=labo_ouvert,bob_suit&items=seau,badge   # démarre directement ici
&debug=1                                                  # contours des hotspots + état affiché
?scene=fin                                                # saute au cliffhanger
?reset=1                                                  # efface la sauvegarde
```

Exemple : <http://localhost:5173/?scene=panneau&flags=bob_suit,labo_ouvert,sait_fusible&items=fusible,seau&debug=1>

En mode debug la sauvegarde est désactivée et l'intro de la scène de départ
n'est pas rejouée. Ids de scènes, objets et flags : voir `content/` et
`docs/STORY.md`. En dev, `window.__game` expose l'instance Phaser.

## Structure

```
quantum-janitor/
├─ src/
│  ├─ engine/        # moteur générique, sans contenu codé en dur
│  │  ├─ GameState.ts        flags, inventaire, scène courante, conditions
│  │  ├─ SaveSystem.ts       sauvegarde auto localStorage
│  │  ├─ SceneManager.ts     navigation entre vues + fondus
│  │  ├─ HotspotLayer.ts     dessin des placeholders + zones cliquables
│  │  ├─ Inventory.ts        barre d'inventaire, combinaisons
│  │  ├─ DialogueRunner.ts   exécution Ink (tags → effets de jeu)
│  │  ├─ ActionRunner.ts     exécution des actions YAML
│  │  ├─ content.ts / ink.ts parsing YAML + compilation Ink (partagés avec tools/)
│  │  └─ debug.ts            paramètres d'URL
│  ├─ ui/            # boîte de dialogue, menu de verbes, label de survol, thème
│  ├─ scenes/        # scènes Phaser : Title, Room (jeu), End (cliffhanger)
│  └─ main.ts
├─ content/
│  ├─ scenes/*.yaml  # une vue fixe par fichier : décor, hotspots, sorties
│  ├─ story/*.ink    # dialogues Ink (concaténés, `_globals.ink` en premier)
│  ├─ items.yaml     # objets d'inventaire
│  └─ game.yaml      # scène de départ, personnages (portraits placeholder)
├─ assets/placeholders/
├─ tools/            # validate-content.ts, playthrough.ts
├─ docs/STORY.md     # bible : persos, dimensions, chaîne de puzzles
└─ .github/workflows/deploy.yml   # déploiement GitHub Pages
```

## Écrire du contenu

**Scène (YAML)** — extrait :

```yaml
hotspots:
  - id: lecteur
    label: Lecteur de badge
    rect: [1180, 240, 70, 110]          # x, y, largeur, hauteur (vue 1280×580)
    if: { notFlags: [labo_ouvert] }     # visible seulement si…
    art: [{ rect: [1190, 250, 50, 90], color: "#2a2a2a" }]
    look: "Texte dit par Gary."
    use:  [{ say: "sylvie: ACCÈS REFUSÉ." }]
    useItem:
      badge:
        - if: { flags: [lecteur_propre] }
          dialogue: badge_porte          # knot Ink
          stop: true
        - say: "Encrassé."
exits:
  - { id: vers_labo, label: Labo, to: labo, dir: right, rect: [...], requires: { flags: [labo_ouvert] }, lockedText: "Fermé." }
```

Actions disponibles : `say`, `dialogue`, `give`, `take`, `set`, `unset`,
`goto`, `end`, `shake`, `stop`, avec une condition `if:`
(`flags`, `notFlags`, `items`, `notItems`). Une ligne `say` préfixée par un id
de personnage (`bob: …`) change l'orateur (Gary par défaut).

**Dialogue (Ink)** — préfixe `id:` pour l'orateur, tags pour les effets :

```ink
=== bob_sandwich ===
bob: Un sandwich ? Pour moi ? # take: sandwich
Gary récupère son badge. # give: badge
{ has_flag("bob_suit"): … }
* [Choix] gary: Réplique.
```

Tags : `give`, `take`, `set`, `unset`, `goto`, `end`, `shake`.
Fonctions : `has_flag("id")`, `has_item("id")`.

`npm run validate` vérifie : scènes cibles des sorties et `goto`, objets
référencés, knots Ink appelés, flags lus jamais posés (et l'inverse), tags et
préfixes de personnages inconnus, erreurs de compilation Ink (avec fichier:ligne).

## Déploiement GitHub Pages

`vite.config.ts` utilise `base: '/quantum-janitor/'` au build (surchargable
avec `BASE_PATH=/autre/ npm run build`). Le workflow
`.github/workflows/deploy.yml` construit et publie à chaque push sur `main` :
activer *Settings → Pages → Source : GitHub Actions* sur le dépôt.

## Hors périmètre du MVP

Son, mobile, éditeur visuel, sauvegardes multiples, succès, personnage animé,
graphismes définitifs.
