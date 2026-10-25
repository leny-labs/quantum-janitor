# Brief : MVP Quantum Janitor — Chapitre 0 « Le Seau »

Repo : `/home/leny/Workspace/leny-labs/quantum-janitor` (GitHub : leny-labs/quantum-janitor).
Tu es le codeur. Implémente TOUT ce brief. Commits clairs au fil du travail. README en français.

## Pitch
Gary Plunk (badge « Garry »), agent d’entretien intérimaire sur la station *Klepsydra-9*, renverse son seau dans un Réacteur d’Improbabilité. La station se scinde. Compagnon : B.O.B., aspirateur-robot dépressif. Ton : Space Quest × Rick & Morty. Priorité HISTOIRE ; graphismes = placeholders OK.

## Techno (imposée)
- Phaser 3 + TypeScript + Vite
- Dialogues : Ink + inkjs
- Contenu scènes : YAML
- Deploy : prêt pour GitHub Pages (`base` Vite correct)
- Node LTS, `npm install` + `npm run dev` / `npm run build` doivent marcher

## Structure cible
```
quantum-janitor/
├─ src/
│  ├─ engine/   # SceneManager, HotspotLayer, Inventory, DialogueRunner, GameState, SaveSystem
│  ├─ ui/
│  └─ main.ts
├─ content/
│  ├─ scenes/*.yaml
│  ├─ story/*.ink
│  └─ items.yaml
├─ assets/placeholders/
├─ tools/validate-content.ts
├─ docs/STORY.md
└─ README.md
```

## Gameplay (style Agent A)
- Vues fixes illustrées ; clic sur sortie → autre vue (fondu) ; clic hotspot → look/use/talk
- Pas de personnage qui marche, pas de pathfinding
- Inventaire barre en bas ; sélection objet puis clic hotspot pour utiliser
- Dialogues Ink (portrait/texte/choix) ; peuvent donner objet, poser flag, débloquer sortie
- Curseur + label au survol

## MVP jouable (~10–15 min)
**4 vues :** placard à balais, couloir, labo du réacteur, 1 gros plan panneau de contrôle.
**5 objets :** seau, serpillière, badge « Garry », sandwich douteux, fusible.
**3 puzzles enchaînés :** récupérer le badge → ouvrir le labo → « réparer » le réacteur (= catastrophe).
**1 dialogue à choix** avec B.O.B. (pose le ton).
**Fin cliffhanger :** fracture de la station, Gary atterrit dimension cafards, écran « À suivre ».

## Contenu minimal au premier état jouable
Moteur générique + au moins le chapitre 0 complet et jouable de bout en bout dans le navigateur.
- Sauvegarde auto (localStorage)
- Mode debug : query `?scene=...&flags=...&items=...`
- `npm run validate` (ou équivalent) qui vérifie références croisées scènes/objets/knots Ink/flags
- Placeholders graphiques simples (formes/couleurs/texte) — pas besoin d’art définitif
- Textes en français

## Hors scope (ne pas faire)
Son/musique/voix, mobile/Capacitor, éditeur visuel, multi-saves, succès, perso animé qui marche, graphismes finis.

## Critères de done
1. `npm install && npm run build` OK
2. `npm run dev` lance le jeu ; on peut finir le Chapitre 0 du placard jusqu’au cliffhanger
3. README : pitch court, comment lancer, structure, debug URL
4. Au moins un commit initial propre + push sur `main` (remote déjà configuré)
5. docs/STORY.md : bible courte (persos, dimensions prévues, chaîne puzzles du ch.0)

Travaille dans ce dossier. Ne crée pas de sous-dossier port/ : le projet EST la racine.
