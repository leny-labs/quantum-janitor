# Brief : passage graphique Agent A — hybride Phaser + Three.js

Repo : `/home/leny/Workspace/leny-labs/quantum-janitor`
Leny a rejeté les placeholders 2D plats (« c’est une blague ») et a choisi l’option **A : hybride Phaser + Three.js**.

## Contexte Agent A (référence)
Agent A est réellement en 3D (Unity/Blender) avec un look illustration : surfaces plates, gradients, ombres dures, angles forts. Les pièces sont des greybox 3D ; on peut zoomer et planter des objets 3D ponctuellement. Le clic pour naviguer / hotspots reste du point & click.

## Objectif
Remplacer le rendu 2D généré (rectangles, texte, SVG) par des **salles 3D low-poly stylisées** (Three.js), tout en gardant :
- Phaser pour UI (inventaire, dialogues, menu verbes, HUD, hotspots en overlay écran)
- le contenu YAML/Ink et le Chapitre 0 jouable de bout en bout
- le même gameplay Agent A (vues fixes / angles caméra, pas de marche libre)

## Architecture cible
- Canvas Three.js en fond (pièce 3D) + Phaser en overlay transparent pour UI/hotspots, **ou** Phaser qui affiche une texture/render target Three.js — choisis la solution la plus stable et simple à maintenir.
- Chaque scène YAML (`placard`, `couloir`, `labo`, `panneau`) a un **layout 3D** (caméra fixe + mesh) défini en code TypeScript (procedural greybox OK pour commencer — pas besoin de Blender pour le MVP 3D).
- Hotspots / exits restent en coords écran (comme maintenant) OU projetés depuis des ancres 3D — si ancres 3D, mieux (zoom/close-up futurs). Au minimum : hotspots écran alignés visuellement avec les objets 3D.
- Style : science-fiction absurde / station spatiale, palettes saturées, ombres dures, matériaux unlit/toon-ish (pas de PBR réaliste). Inspi Agent A + Space Quest.
- Possibilité claire d’**ajouter un mesh 3D ponctuel** (ex. un objet inventaire posé dans la pièce) sans redessiner toute la vue.

## Critères de done
1. Les 4 vues du ch.0 ont un décor 3D greybox crédible (plus de rectangles plats seuls).
2. `npm run build` + `npm run validate` OK ; Chapitre 0 toujours finissable.
3. README mis à jour (section visuelle : Phaser UI + Three.js salles).
4. Commits clairs + `git push origin main`.
5. Screenshot ou note de ce qui a changé dans le message final.

## Hors scope
Art définitif Blender, animations personnages, lumière baked complexe, migration Godot.

Travaille à la racine du repo. Lis le code existant avant de tout casser.
