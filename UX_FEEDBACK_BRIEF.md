# Brief UX feedback Leny (immédiat)

Leny joue en live. Corrections graphiques/UI :

## 1. Menu verbes — vraies icônes
Ref `docs/refs/verbs-need-icons.png`
Les losanges / pastilles ne suffisent pas. Icônes lisibles premium :
- Regarder → œil
- Utiliser / Prendre / Appuyer → main / grapin selon le verbe
- Parler → bulle
Style line-icon cohérent avec le chrome HUD (cyan/orange), pas emoji, pas des diamants.

## 2. Étiquettes 3D — trop agressives
Ref `docs/refs/labels-abuse.png`
Les gros bandeaux noirs « JAVEL Q. », « BRISE DU VIDE », « DÉGRAISSANT ABSOLU », « ??? » sur chaque flacon **abusent**. Ça crie UI debug, pas objet du monde.
→ Réduire fortement : petites décalcomanies intégrées au mesh, ou texte discret, ou **pas de label** et le nom uniquement au hover HUD. Les formes/couleurs des flacons doivent suffire.

## 3. Post-it / props texte — pas premium
Ref `docs/refs/postit-not-premium.png`
Le post-it jaune « RÈGLEMENT N°1 : NE JAMAIS NETTOYER LE RÉACTEUR » est cheap (texture pixelisée, look PowerPoint).
→ Remplacer par un panneau mural / plaque réglementaire / écran mural stylisé Paranoia (premium), pas un sticky note 2D pourri.

## 4. Toujours vrai
- Premium partout (Agent A stylisé + ton Paranoia)
- Pas d’écran noir : `makeButton` = Container → plus de `.setOrigin()` dessus
- Build + validate OK, chap.0 jouable, push `origin/main`

Travaille à la racine. Commits clairs.
