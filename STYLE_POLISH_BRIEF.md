# Brief : polish graphique — 3D stylisée + HUD

Leny : « c’est pas mal ; pousse plus loin HUD et 3D » + « 3D stylisée, simple mais stylé ».

Le passage Phaser + Three.js est (presque) en place. Ne refais PAS l’archi. **Monte le niveau artistique.**

## Direction visuelle (obligatoire)
Inspiration Agent A / Kevin Dart / illustration spatiale absurde :
- Formes **simples** (boîtes, cylindres, plans) mais **lisibles et charismatiques**
- Palette saturée, contrastée (néons froids + accents chauds absurdes)
- Matériaux **unlit / flat / léger toon** — pas de PBR réaliste, pas de greybox béton triste
- Ombres dures ou faux self-shadow par couleur, angles forts, silhouettes claires
- Une ou deux « trouvailles » par pièce (enseigne, lumière colorée, prop signature) pour que ce ne soit pas juste des boîtes

## 3D — pièces
Pour chaque vue (placard, couloir, labo, panneau) :
- Composition caméra plus cinématique (légère plongée / contreplongée, pas vue frontale morte)
- Props reconnaissables (DISTRIB’O-MATIC, porte labo, seau, B.O.B., panneau) avec couleurs signature
- Sol / murs / plafond avec variation (bande, grille, panneau technique) — toujours low-poly
- Fog léger ou vignette optionnelle pour la profondeur

## HUD / UI Phaser
Actuellement trop « debug » (barres plates, texte brut). Soigner :
- Inventaire : cases avec bordure/glow, icônes couleur ou formes stylisées (pas seulement le nom)
- Menu de verbes : panneau stylé (pas un menu système gris)
- Boîte de dialogue : cadre SF absurde, portrait placeholder stylé pour B.O.B. / Gary
- Titre de pièce + bouton Menu : intégrés au look, pas des labels HTML
- Curseur / hover label plus soignés
- Écran titre + « À suivre » : un vrai impact (pas du texte sur fond uni)

## Contraintes
- Gameplay / YAML / Ink / hotspots inchangés (ou hotspots réalignés si la caméra change)
- `npm run build` + `npm run validate` OK ; chapitre 0 toujours finissable
- Commits + `git push origin main`
- README : 2 lignes sur le style

Travaille à la racine. Lis `src/three/` et `src/ui/` avant d’éditer.
