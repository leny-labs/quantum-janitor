# Brief UX premium #2 — Leny live (immédiat)

Leny joue. Deux corrections graphiques, plus rien d'autre. Commit + push `main` quand c'est bon. `npm run build` + validate doivent passer.

Refs :
- `docs/refs/labels-invisible.png` — flacons : on ne voit quasiment rien (petit tag beige vide)
- `docs/refs/labels-abuse.png` — l'ancien extrême : gros bandeaux noirs UI collés dessus (trop)
- `docs/refs/exit-arrow-not-premium.png` — flèche de sortie : cercle noir + triangle unicode cyan cheap

## 1. Étiquettes des flacons — visibles ET premium

Problème : après le dernier pass, les noms ont disparu (picto seul / tag vide). Leny : « on voit pas les étiquettes ».

Cible (milieu) :
- Petite plaque **physique** collée sur chaque flacon (crème / papier usagé / plastique réglementaire), **lisible** à distance de jeu (texte court du produit : JAVEL Q., BRISE DU VIDE, ANTI-FLUX, DÉGRAISSANT ABSOLU, ???).
- Pas de bandeau Phaser noir flottant. Pas de texte HUD par-dessus le mesh.
- Typo bold courte, contraste fort (encre sombre sur crème, ou blanc sur bande colorée du produit).
- Picto OK en plus du texte, pas à la place.
- Taille : assez grande pour lire sur mobile (~1/3–1/2 de la face du flacon), sans masquer tout le mesh.
- Fiole « ??? » : petite étiquette mystère lisible « ??? » (pas un rectangle vide).
- Code : `src/three/props.ts` (`bottle` + callers) + évent. `kit.ts` / `decal`.

## 2. Flèches de sortie / navigation — premium

Problème : `HotspotLayer` dessine un cercle noir + caractère `◀▶▲▼` — look placeholder, pas mobile-friendly tactile.

Cible (esprit HUD Agent A / Paranoia) :
- Bouton rond **dessiné** (Graphics / texture canvas), pas unicode.
- Cadre biseauté / anneau cyan du thème (`COLORS.accent`), fond semi-transparent sombre, chevron vectoriel net.
- Hover : ambre + léger scale / halo (comme les verbes).
- Locked : rouge danger, opacity basse.
- Touch-friendly : hit area ≥ 56px (mobile).
- Optionnel : mini libellé du lieu sous/à côté au hover seulement (déjà via HoverLabel — garder).
- Fichier : `src/engine/HotspotLayer.ts` (+ helper dans `src/ui/chrome.ts` si besoin).

## Hors scope
- Pas de GenAI / portraits / voix dans ce brief.
- Ne pas casser les icônes de verbes ni la plaque réglementaire.
- Pas de refactor large.

## Livrable
1. Corrections ci-dessus
2. `npm run build` OK
3. Commit clair + push `origin/main`
4. Résumé court en français dans le log
