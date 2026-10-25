# Brief : PREMIUM partout (écran titre + HUD + 3D)

Leny vient d’envoyer `docs/refs/title-not-premium.png` avec le message : **« ça c’est pas premium ; je veux du premium partout »**.

Ce screenshot est l’ANTI-référence. Interdit de ressembler à ça.

## Ce qui est rejeté (visible sur le screenshot)
- Fond noir + points blancs = « étoiles cheap »
- Titre flat avec ombre chromatique amateur
- Gros **icône seau 2D plat** avec le mot « SEAU » écrit dessus
- Boutons rectangles gris basiques
- Look prototype / itch.io early access, pas un jeu soigné

## Direction PREMIUM (simple mais stylé, Agent A)
- **Écran titre** : vraie scène Three.js (hero shot) — seau 3D stylisé + fragment de station / réacteur en fond, lumière colorée dramatique, particules discrètes OK. Titre typo soignée intégrée (pas un label Phaser laid). Boutons avec profondeur, hover, glow cohérent avec la palette.
- **HUD in-game** : inventaire en cases premium (bordures, icônes formes 3D/2D stylisées, pas juste du texte) ; verbes dans un panneau dessiné ; dialogue avec cadre SF et portrait placeholder stylé ; titre de pièce intégré.
- **Salles 3D** : déjà en Three.js — monter le charisme (palette, silhouettes, 1-2 props signature par pièce, caméra cinématique). Toujours low-poly, jamais réaliste PBR.

## Barème
Si Leny ouvre le jeu et que l’écran titre fait encore « seau SEAU sur fond étoilé », c’est un **échec**. Même standard pour le reste de l’UI.

## Contraintes
- Gameplay / YAML / Ink / chap.0 finissable
- `npm run build` + `npm run validate` OK
- Commits clairs + `git push origin main`
- Lis `STYLE_POLISH_BRIEF.md` si présent, mais **ce brief prime**

Travaille à la racine du repo.

## Ton narratif — référence PARANOIA (JDR)
Leny ajoute **Paranoia** (le JDR) comme référence de ton, en plus de Space Quest × Rick & Morty.

À injecter dans les textes / dialogues / labels UI (sans tout réécrire le chapitre) :
- Autorité absurde, slogans de sécurité, bonheur obligatoire, « The Computer is your friend »
- Méfiance amicale, culte de la procédure, mort/clonage traité à la légère
- Acronymes ridicules, warnings officiels qui ne aident personne
- B.O.B. et Gary : humour noir bureaucratique, pas seulement absurde cosmique

Écran titre / menus : un slogan ou bandeau type Paranoia (ex. « Le bonheur est obligatoire » / « Friend Computer vous observe ») — premium, pas du meme cheap.
HUD : micro-copy dans l’esprit (inventaire « objets autorisés », etc.) si ça reste élégant.
