# Quantum Janitor — Bible courte

> *Space Quest* × *Rick & Morty* × *Paranoia* × *Futurama*. Un agent d'entretien intérimaire, un seau
> d'eau sale, et un multivers qui n'avait rien demandé.

## Pitch

Gary Plunk — « Garry » sur son badge, à cause de la RH — est agent d'entretien
intérimaire sur la station orbitale *Klepsydra-9*. Un matin, sommé de
« nettoyer autour » du Réacteur d'Improbabilité pendant que les scientifiques
sont en séminaire sur Mercure, il renverse son seau dans le réacteur. La
station se fend en 4 096 morceaux, chacun projeté dans une réalité différente.
Gary devra les nettoyer un par un. Avec une serpillière.

## Personnages

| Perso | Rôle | Voix |
|---|---|---|
| **Gary Plunk** | Héros. Agent d'entretien intérimaire (contrat de 3 jours « renouvelable par pitié »). Dort dans le placard à balais, appelle sa serpillière Josiane. | Résigné, pince-sans-rire, fier de détails minuscules. Rappelle à tout le monde qu'il est intérimaire. |
| **B.O.B.** | Compagnon. *Balayeur Organique Bienveillant*, aspirateur-robot de 2291. A acquis une conscience en aspirant le tome 2 d'un manuel de philosophie existentialiste (jamais trouvé le tome 1). | Dépressif, lucide, tendre. Il a toujours raison et personne ne l'écoute. Sert de système d'indices. |
| *Le drone porte-outils* | Petit drone de service blanc et orange (gros œil bleu, antenne) fixé au harnais de Gary par un bras articulé. Fourni avec la combinaison, tient la lampe et les vis. **Pas de conscience, pas de dialogue** : ce n'est pas B.O.B. (l'aspirateur du placard, qui ne suit Gary qu'après `bob_suit`). | Muet. Penche la tête, cligne de l'œil. |
| **SYLVIE** | IA de la station. Applique le règlement à la lettre, surtout quand c'est absurde. | MAJUSCULES, passive-agressive, secrètement attachée à Gary (« le niveau 4 s'appelle GARY »). |
| **Dr Halvorsen** | Scientifique en chef, absente (Mercure). N'existe qu'à travers ses mots et post-it paniqués. | Dramatique, smileys qui pleurent. |
| **Sa Majesté Blattaria XIV** | Reine des cafards de la dimension B-7. Voit en Gary « l'Homme au Seau » d'une prophétie. | MAJUSCULES royales. Appelle Gary « GARRY » (le badge fait foi). |

## Look de Gary (design « Janék »)

Référence : concept sheet « Janék — concierge et bricoleur de la station » (le
prénom reste **Gary Plunk** en fiction ; seul le design change). Homme d'âge
mûr, gros nez, grosses lunettes rectangulaires brunes, barbe de trois jours,
cheveux bruns en bataille sous une casquette de baseball blanc / orange.
Combinaison d'entretien orange, patch planète bleue à l'épaule, harnais gris-bleu
avec communicateur à écran vert, ceinture à outils, clé à molette glissée dans la
bretelle, drone porte-outils sur l'épaule gauche. Modèle 3D : `gary()` dans
`src/three/props.ts` (buste des portraits et plan de fin).

## Univers et ton

- **Klepsydra-9** : station de recherche vétuste. Tout y est tiède. Le
  compteur « jours sans incident d'improbabilité » affiche 98 (record : 99).
- **Réacteur d'Improbabilité Mk IV** : transforme l'improbable en énergie
  (« il est très improbable que tu sois encore employé ici : ça alimente
  l'éclairage du pont C »).
- **Running gags** : le double R de « Garry » ; « règlement n°1 : ne jamais
  nettoyer le réacteur » ; tout est tiède ; Gary est intérimaire ; le yaourt
  conscient ; le bruit « PLOUF ».
- Humour absurde mais personnages sincères : B.O.B. et Gary s'apprécient
  vraiment. Pas de cynisme gratuit.

## Dimensions prévues (chapitres)

Numérotation t173–t176 (2026-11-03) ; mapping ancien → nouveau, transitions et plan
de fusion : [`CHAPTERS.md`](CHAPTERS.md).

| Ch. | Dimension | Idée |
|---|---|---|
| 0 | *Klepsydra-9* (acte I) + **B-7 « Blattaria Prime »** (acte II) | **Le Seau.** Acte I : tutoriel + catastrophe (ci-dessous). Acte II : les cafards ont hérité de la galaxie ; Gary est un messie malgré lui, « tient l'éclat » et referme la faille ; il y perd Josiane et le Seau et repart en combinaison de chitine ([`CHAPTER0_BLATTARIA.md`](CHAPTER0_BLATTARIA.md)). **(jouable)** |
| — | *Interlude : le mini-vaisseau* | Cockpit très serré, énorme tableau de bord, boutons absurdes, choix de destination ([`INTERLUDE_VAISSEAU.md`](INTERLUDE_VAISSEAU.md)). |
| 1 | **Station Bureaucratique** | La station où le règlement a gagné : SYLVIE y est reine, Gary y est classé « animal de compagnie ». 13 lieux, paperasse, fonctionnaires caricaturaux, couloirs infinis, zéro nettoyage, inventaire à payoffs différés ([`CHAPTER1.md`](CHAPTER1.md)). |
| 2 | **Dimension Miniature** | Tout est minuscule sauf la poussière. B.O.B. devient un titan. |
| 3 | **Klepsydra-Lux** | Version luxueuse de la station où Gary est capitaine (sa mère avait raison). Il déteste ça. |
| 4 | **L'Envers du Yaourt** | Le yaourt conscient du lecteur de badge a fondé une civilisation lactée. Il est en colère. |
| fin | **Le Placard Originel** | Tous les morceaux reconvergent dans le placard à balais. |

Chaque chapitre : un fragment de station à stabiliser / contenir pour récupérer
un morceau du réacteur (à partir de l'acte Blattaria, plus de thème ménage : Gary a
perdu ses outils de janitor). Transitions sans hard cut : carte de fin → interlude
éventuel → carte titre du chapitre suivant ([`CHAPTERS.md`](CHAPTERS.md) §2).

> **Note t176 — inventaire et difficulté.** Le ch.0 reste un tutoriel linéaire
> (petit inventaire, puzzles courts). Il lui manque, volontairement, la sensation
> « plein d'objets en poche, dont certains ne serviront que 4–5 étapes plus tard ».
> À partir du ch.1, **c'est une exigence** : 12–18 objets par chapitre, 5–8 en poche
> simultanément, plusieurs objets ramassés tôt avec un payoff très tardif, puzzles
> multi-salles, chaînes longues explicites (tampon → formulaire → bureau → archive →
> accès), quelques fausses pistes et objets à double usage, des combinaisons. Voir le
> tableau d'inventaire de [`CHAPTER1.md`](CHAPTER1.md) §5.

## Chapitre 0 « Le Seau », acte I (Klepsydra-9) — chaîne de puzzles

Objets : **seau**, **serpillière**, **badge « Garry »**, **sandwich douteux**, **fusible 7B**.
Vues : **placard à balais**, **couloir de service**, **labo du réacteur**, **panneau de contrôle** (gros plan).

```
Intro (placard) : SYLVIE exige que Gary badge + nettoie le labo.
│
├─ PUZZLE 1 — Récupérer le badge
│   1. Prendre le seau et la serpillière (placard).
│   2. Parler à B.O.B. (dialogue à choix) → il a aspiré le badge ;
│      il faut lui faire avaler quelque chose d'indigeste.          [bob_avoue_badge]
│   3. Couloir : utiliser la serpillière sur le distributeur
│      → le sandwich coincé tombe.                                  [sandwich_tombe]
│   4. Donner le sandwich à B.O.B. → il recrache le badge
│      et décide de suivre Gary.                                    [bob_suit]
│
├─ PUZZLE 2 — Ouvrir le labo
│   5. Badge sur le lecteur → refusé, lecteur encrassé de yaourt.
│   6. Combiner serpillière + seau (inventaire) → serpillière mouillée. [serpilliere_mouillee]
│   7. Serpillière sur le lecteur → propre ; Gary rince la
│      serpillière… dans le seau (le yaourt y est désormais).        [lecteur_propre]
│   8. Badge sur le lecteur → « GARRY », accès accordé.             [labo_ouvert]
│
└─ PUZZLE 3 — « Réparer » le réacteur
    9. Panneau (gros plan) : logement « fusible 7B » vide.           [sait_fusible]
   10. Couloir : prendre le fusible 7B de la boîte du distributeur.  [fusible_retire]
   11. Fusible dans le panneau → sous tension ; refroidissement 0 %. [panneau_allume]
   12. Seau sur la trappe d'admission (choix ironiques) → Gary glisse,
       le seau entier tombe dedans. PLOUF.                          [refroidissement_verse]
   13. Appuyer sur STABILISER → le yaourt conscient + l'improbabilité
       → la station se fend. Cliffhanger : dimension des cafards. « À suivre… »
```

B.O.B. (une fois compagnon) donne un indice contextuel sur l'étape en cours.
