# Interlude — le mini-vaisseau (ch.0 → ch.1)

> Un cockpit conçu pour un équipage de douze, installé dans une capsule d'une place
> par le moins-disant. Gary n'a jamais piloté. Le vaisseau non plus.

Voir [`CHAPTERS.md`](CHAPTERS.md) §2 (grammaire des transitions) et §3.7 (EndScene),
le chapitre d'avant [`CHAPTER0_BLATTARIA.md`](CHAPTER0_BLATTARIA.md) et celui d'après
[`CHAPTER1.md`](CHAPTER1.md). Statut : **stub jouable** (§5) — `content/scenes/interlude-vaisseau.yaml`,
`content/story/interlude_vaisseau.ink`, pièce 3D `src/three/rooms/cockpit.ts`, carte titre via l'action
`card: ch1` (YAML) / `# card: ch1` (Ink) → `src/ui/ChapterCard.ts`. Entrée depuis la fin du ch.0 :
bouton « Chapitre 1 → » = aspiration dans la faille + tampon « TRANSFÉRÉ » (`EndScene.transfer`).

## 1. Rôle

- Remplacer le hard cut entre la fin du ch.0 (couronnement + faille) et l'arrivée à
  la Station par **1–2 minutes jouables**, sans échec possible.
- Faire passer trois informations : Gary quitte Blattaria **avec** l'éclat, il
  **enfile** la combinaison de chitine (elle quitte l'inventaire → flag
  `combi_portee`), et la destination est choisie… par le règlement.
- Semer les chapitres suivants (destinations grisées au navigateur).

## 2. Mise en scène

**La Capsule de Service CS-07** : une capsule de sauvetage de *Klepsydra-9* échouée
avec le Temple de l'Ancien Couloir (les cafards la vénéraient comme « LE PETIT
CERCUEIL QUI VOLE »). La Reine l'offre à Gary à la fin du couronnement.

Cadrage : caméra fixe **au-dessus de l'épaule de Gary**, très serrée. Gary est
coincé, genoux au menton ; B.O.B. est sur ses genoux ; le drone porte-outils est
plaqué contre le plafond. Devant : un **tableau de bord gigantesque** qui déborde du
cadre (on ne voit jamais ses bords) : 60 boutons, 14 leviers, 3 volants, un pare-brise
minuscule au milieu. Par le pare-brise panoramique (le seul truc bien fait de la capsule) : le ciel
intersidéral, nébuleuses et étoiles, et la faille, violette, qui ondule au milieu.

Ton : chaque bouton fait quelque chose d'inutile et de parfaitement documenté.

## 3. Déroulé (≈ 4 actions, 1–2 min)

Scène unique `interlude-vaisseau`, Ink `iv_*`, flags `iv_*`. État d'entrée = état
initial du ch.1 (`badge`, `fragment`, `combi_chitine` ; flags `st`, `ch0_termine`).

```
Arrivée (onFirstEnter, Ink iv_arrivee) : la porte se referme sur le pied de Gary.
« Le siège est conçu pour un cafard. » SYLVIE (écho, brouillé) : « VOL NON DÉCLARÉ. »
│
1. Combi de chitine sur le siège → Gary l'enfile et se cale enfin dans le siège-carapace
   (« c'est la première fois qu'un siège m'épouse »).   [combi_portee] [iv_assis] −combi_chitine
2. Badge sur la fente « CONTACT » → l'écran affiche « BONJOUR, GARRY » (les deux R, même
   ici) ; tout s'allume en même temps.                                     [iv_contact]
3. Tableau de bord — **clic direct** sur chaque bouton / le levier (hotspots `bouton_npa`,
   `bouton_hyper`, `bouton_eject`, `bouton_auto`, `levier` ; knots `iv_btn_*`, `iv_levier`) :
   - « NE PAS APPUYER » → musique d'ascenseur, pour toujours (jusqu'au saut) ;
   - « HYPERESPACE » → allume-cigare ;
   - « ÉJECTION » → éjecte le porte-gobelet (B.O.B. : « On avait un porte-gobelet ? ») ;
   - « AUTOPILOTE » → un post-it du Dr Halvorsen : « L'autopilote c'est vous 😭 » ;
   - levier gris sans étiquette → bascule le navigateur ; c'est le seul utile. [iv_navigateur]
   B.O.B. indique le levier si on lui parle (« Celui qui n'a pas d'étiquette drôle. »).
4. Navigateur — **clic direct** sur une ligne de l'écran tactile (hotspots `dest_*`,
   knots `iv_dest_*`) :
   - « DIMENSION MINIATURE » → « FORMULAIRE D'ACCÈS MANQUANT » ;
   - « KLEPSYDRA-LUX » → « RÉSERVÉ AU CAPITAINE. VOUS N'ÊTES PAS CAPITAINE. ENCORE. » ;
   - « L'ENVERS DU YAOURT » → l'écran se couvre de condensation, Gary recule ;
   - « STATION (BUREAUCRATIQUE) » → « DESTINATION ACCEPTÉE. VEUILLEZ PATIENTER. »
                                                                       [iv_destination]
5. Éclat dans le réceptacle « IMPROBABILITÉ (OPTIONNEL) » → l'éclat chauffe (tiède),
   saut. Gary le récupère aussitôt (il reste en inventaire).                [iv_saut]
   → fondu blanc, « CLONK » → carte titre « CHAPITRE 1 — La Station Bureaucratique »
   → `st-sas` (le vaisseau s'encastre dans le sas, plan d'arrivée `st_arrivee`).
```

Les étapes 1–2 sont **libres dans l'ordre** ; 3 → 4 → 5 sont guidées (le navigateur et
le réceptacle n'apparaissent qu'après le contact). Aucune action n'est irréversible.
Flag persistant `iv_vu` à la fin : les fois suivantes, bouton « Passer ».

## 4. Version complète (plus tard)

- Vraie pièce 3D : cockpit toon, tableau de bord modulaire (boutons = instances), écran
  du navigateur en texture canvas, pare-brise avec shader de faille (réutiliser les VFX
  du réacteur).
- Petites animations par bouton (porte-gobelet éjecté qui rebondit, post-it qui tombe).
- Musique propre (thème « vaisseau » minimal, la musique d'ascenseur en surcouche si
  « NE PAS APPUYER »).
- Réutilisable comme **hub d'interludes** entre chapitres suivants (destinations qui se
  débloquent par flags `chN_termine`).

## 5. Stub minimal (réalisable vite)

| Élément | Stub |
|---|---|
| Scène | `content/scenes/interlude-vaisseau.yaml`, une seule vue ; art 2D (YAML `art:` : rectangles + labels) **ou** RoomScene 3D minimale (boîte serrée + plan incliné de boutons colorés) — choisir le 2D si le temps manque |
| Hotspots | `siege` (useItem `combi_chitine`), `contact` (useItem `badge`), `tableau` (regard), `bouton_npa` / `bouton_hyper` / `bouton_eject` / `bouton_auto` / `levier` (clic direct → `iv_btn_*` / `iv_levier`), `navigateur` (regard) + `dest_miniature` / `dest_klepsydra` / `dest_yaourt` / `dest_station` (`if: iv_navigateur`, clic direct → `iv_dest_*`), `reacteur` (`if: iv_destination`, useItem `fragment`), `bob` (talk → indice) |
| Ink | `content/story/interlude_vaisseau.ink` : knots `iv_arrivee`, `iv_btn_*`, `iv_levier`, `iv_dest_*`, `iv_saut` (tag de sortie vers `st-sas` : `# go: st-sas` ou équivalent existant) |
| Objets | aucun nouveau ; `combi_chitine` consommé (→ `combi_portee`), `badge` et `fragment` gardés |
| Transition | fondu au noir à l'entrée (depuis le bouton « Chapitre 1 → »), carte titre ch.1 à la sortie (§2 de `CHAPTERS.md`) |
| Walkthrough | `ch1` commence par : `useItem combi_chitine siege`, `useItem badge contact`, `use bouton_npa`, `use bouton_auto`, `use levier`, `use dest_miniature`, `use dest_station`, `useItem fragment reacteur` |
| i18n | titre de pièce, libellés de hotspots, carte titre |

Si le temps manque encore : `ch1.startScene = 'st-sas'` avec l'état final de
l'interlude (`combi_portee`, sans `combi_chitine`) et l'interlude branché plus tard ;
c'est ce que prévoit le scaffold de [`CHAPTER1.md`](CHAPTER1.md) §9.
