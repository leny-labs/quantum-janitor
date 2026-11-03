# Chapitre 1 « La Station Bureaucratique » — design

> Une station où le règlement a gagné. Chaque porte exige un formulaire, chaque
> formulaire exige un tampon, chaque tampon exige de l'encre, et l'encre est en grève.

Voir [`CHAPTERS.md`](CHAPTERS.md) (numérotation, transitions, ids), le chapitre
précédent [`CHAPTER0_BLATTARIA.md`](CHAPTER0_BLATTARIA.md), l'interlude d'arrivée
[`INTERLUDE_VAISSEAU.md`](INTERLUDE_VAISSEAU.md) et la bible [`STORY.md`](STORY.md).
Statut : **design** (rien n'est codé). Préfixes : scènes `st-*`, flags `st_*`,
knots `st_*`.

## 1. Pitch

Le mini-vaisseau de l'interlude s'encastre dans le sas d'arrivée d'un morceau de
station que Gary reconnaît à peine : c'est *Klepsydra-9*, mais une Klepsydra où, le jour
de la catastrophe, **le règlement a gagné**. SYLVIE n'y est plus une IA d'entretien :
elle est **Directrice Générale de l'Existence**, reine d'un empire de guichets, de
tampons et de couloirs qui ne mènent qu'à d'autres couloirs.

Le **deuxième éclat du Réacteur** est là. Il est tombé dans la station, quelqu'un l'a
trouvé, et donc il a été **classé** : « OBJET TROUVÉ N° 2/4096 — EN ATTENTE DE
RÉCLAMATION », sous scellés dans le coffre de la Direction. Pour le récupérer, Gary
doit déposer le **Formulaire B-7/12 (Demande de restitution d'un bien trouvé
inter-dimensionnel)**, rempli, tamponné, signé, en trois exemplaires, avec avis du
Conseil, **au guichet, aux heures d'ouverture**. Le guichet ouvre de 10 h 12 à 10 h 14.
L'horloge est bloquée sur 10 h 11 depuis quarante et un ans.

Problème initial : le portique a scanné Gary dans sa combinaison de chitine.
**Statut : ANIMAL DE COMPAGNIE. Propriétaire : B.O.B.** Un animal ne peut pas déposer
de demande. B.O.B., pour la première fois de sa vie, a un pouvoir. Il en est terrifié.

Ce que Gary a en arrivant : le **badge « Garry »**, l'**éclat contenu** (`fragment`,
1/4096), la **combinaison de chitine** (portée), et B.O.B. Pas de seau, pas de Josiane :
**zéro nettoyage** de tout le chapitre (une seule blague à ce sujet : Gary voit une
tache de café et sa main tremble).

## 2. Ton et règles de design

- **Absurde administratif cohérent** : chaque règle est stupide, mais elle est
  **appliquée à la lettre et toujours la même** ; le joueur gagne en apprenant le
  règlement, puis en le retournant contre lui-même (l'intérimaire qui signe « p.o. »,
  le tampon ANNULÉ qu'on n'utilise jamais, la plante membre honoraire du Conseil).
- **Plus dur que le ch.0, mais juste** : chaque solution est annoncée au moins une fois
  (panneau, réplique, document lisible) avant d'être nécessaire ; B.O.B. donne des
  indices gradués (1re demande = vague, 2e = précise). Aucune impasse : aucun objet
  indispensable ne peut être perdu ou gâché (voir §6.5).
- **Inventaire qui s'empile** : 14 objets sur le chapitre, 5–8 en poche la plupart du
  temps, plusieurs ramassés **20 à 40 étapes** avant leur usage (§5).
- **Chaînes longues, explicites** : le Formulaire B-7/12 a 5 cases (A → E) annoncées
  dès l'acte I ; son gros plan sert de **tableau de bord de la progression**.
- **Personnages sincères** : chaque fonctionnaire a une petite tristesse (Delaigue est
  intérimaire depuis 19 ans, Tamponnet n'a plus d'encre, Paraphe vote contre parce que
  personne ne l'écoute quand elle vote pour). SYLVIE, au fond, garde ce dossier
  ouvert parce que c'est celui de Gary.
- **Running gags** : GARRY (le dossier est classé à « GARRY » : la faute de la RH est
  universelle à travers les dimensions) ; tout est tiède (le café, la grève, la
  colère) ; Gary est intérimaire (et cette fois, **ça sert**) ; « en trois
  exemplaires » ; Duplicata répète tout deux fois ; l'horloge 10 h 11.

## 3. Personnages

| Perso | id | Rôle | Tic / voix |
|---|---|---|---|
| **Gary Plunk** | `gary` | Héros, en combi de chitine. Classé animal puis intérimaire (« c'est pire »). | Résigné ; découvre qu'il connaît le règlement mieux que les fonctionnaires (il a lu tous les panneaux pendant ses pauses). |
| **B.O.B.** | `bob` | Compagnon, **propriétaire officiel** de Gary jusqu'à l'acte II ; système d'indices (`st_bob`). Aspire un ticket au squelette. | Dépressif, terrifié par sa responsabilité : « Je n'ai jamais eu d'animal. J'ai eu un tome 2. » |
| **SYLVIE** | `sylvie` | **Reine du règlement**, Directrice Générale de l'Existence. Voix des haut-parleurs, des bornes, puis en personne (trône-photocopieuse, acte IV). | MAJUSCULES ; cite des articles qui n'existent pas encore (« ARTICLE 0 : TOUT EST INTERDIT SAUF LE RESTE ») ; craque une seule fois (§8). |
| **Mme Odile Guichard** | `guichard` | Guichet d'accueil. Ne travaille que de 10 h 12 à 10 h 14. Remet le Formulaire et en énonce les 5 cases. | « C'est pas moi qui décide. » Mange un sandwich depuis 41 ans (le même). |
| **M. Régis Duplicata** | `duplicata` | Archiviste. Ne délivre que des copies ; certifie « CONFORME ». | **Répète tout deux fois.** Deux fois. Myope, photocopie ses propres lunettes. |
| **Mme Gisèle Tamponnet** | `tamponnet` | Bureau des Tampons, 412 tampons au mur, encreur sec depuis la grève. | Tamponne tout ce qu'on lui tend, y compris les mains. Parle en onomatopées de tampons (« CLONK. Bonjour. CLONK. »). |
| **M. Hubert Delaigue** | `delaigue` | Sous-chef adjoint **par intérim** depuis 19 ans ; dort sur son fax. Signe « p.o. » d'un chef absent depuis 1987. | Murmure « …réunion… » en dormant ; se réveille au mot « prime » ou à l'odeur du café. Solidarité instantanée d'intérimaire avec Gary. |
| **PERCO** | `perco` | Machine à café syndiquée, **déléguée du personnel**, en grève illimitée. Ses gobelets font le piquet. | Voix de percolateur militant, slogans (« CAFÉ TIÈDE, COLÈRE CHAUDE ! »), crachote de la vapeur quand on la contredit. |
| **Mme Augustine Paraphe** | `paraphe` | Présidente du Conseil (seule membre présente). Vote contre « par principe ». | Paraphe chaque phrase (« … A.P. »). Exige le quorum. |
| **M. Jean-Claude Sabot** | `sabot` | Agent de la fourrière / quai des navettes. | « Je fais pas les ventes. » Calcule les amendes en dimensions. |
| *M. Patience* | — | Squelette d'usager, salle d'attente, ticket 9848 à la main. Figurant. | Ne dit rien. B.O.B. lui fait un éloge funèbre. |
| *M. Ficus* | — | Plante en plastique de la salle d'attente. Membre honoraire du Conseil (on l'apprend tard). | En plastique. Comme tout le monde. |

Portraits : SYLVIE et B.O.B. existants ; fonctionnaires = portraits fixes GenAI
(buste, style `scribe-portrait.png`), repli texte. PERCO = prop 3D avec écran-visage.

## 4. Lieux (13 + 1 gros plan)

| # | id | Lieu | Description | On y trouve | Sorties |
|---|---|---|---|---|---|
| 1 | `st-sas` | **Sas d'Arrivée** · Douane dimensionnelle | Portique de scan, tapis roulant à l'arrêt, borne SYLVIE, panneau « BIENVENUE — VOTRE VISITE EST ENREGISTRÉE ». Le vaisseau encastré est remorqué à l'arrivée. | `ticket_douane` ; borne (statut de Gary) ; panneau « LES ANIMAUX DOIVENT ÊTRE ACCOMPAGNÉS » | `st-attente` (après `st_laisse`), `st-fourriere` |
| 2 | `st-attente` | **Salle d'Attente** | Chaises vissées, afficheur « 9 847 », distributeur de tickets vide (« RUPTURE — FORMULAIRE DE RÉAPPROVISIONNEMENT AU GUICHET »), squelette M. Patience. | `ticket_9848` (via B.O.B.), `plante` (M. Ficus) | `st-sas`, `st-guichet` |
| 3 | `st-guichet` | **Guichet d'Accueil** | Hygiaphone, rideau métallique, horloge 10 h 11, horaires « 10 h 12 – 10 h 14 », pupitre de remplissage. Mme Guichard derrière la vitre. | `formulaire` ; horloge (puzzle de l'éclat) | `st-attente`, `st-couloir-b`, gros plan `st-formulaire` (pupitre) |
| 4 | `st-couloir-b` | **Couloir Infini B** · hub | Portes B-1, B-2… qui bouclent : on revient toujours au même extincteur. Une fois « dénoué » : hub des bureaux. | (puzzle de la plante) | `st-guichet`, `st-archives`, `st-tampons`, `st-reclamations`, `st-pause`, `st-sous-chef`, `st-ascenseur` (toutes après `st_couloir_resolu`) |
| 5 | `st-archives` | **Archives Centrales** | Rayonnages jusqu'au plafond (et au-delà), fichier à tiroirs A–Z, photocopieuse « EN PANNE DE PAPIER », M. Duplicata. | dossier « PLUNK, GARRY » (copies) ; photocopieuse (réutilisée) | `st-couloir-b` |
| 6 | `st-tampons` | **Bureau des Tampons** | Mur de 412 tampons classés par humeur, encreur sec, Mme Tamponnet qui tamponne dans le vide. | `tampon_annule`, `encreur` | `st-couloir-b` |
| 7 | `st-reclamations` | **Service des Réclamations** | Comptoir « RÉSERVÉ AU PERSONNEL », chatière « ANIMAUX DE SERVICE », boîte à réclamations reliée à une broyeuse, terminal de tubes pneumatiques. Personne (« VOTRE RÉCLAMATION EST IMPORTANTE POUR NOUS »). | `liasse`, `capsule` (derrière le comptoir) | `st-couloir-b` |
| 8 | `st-pause` | **Salle de Pause** | PERCO sous banderole « GRÈVE ILLIMITÉE », piquet de grève de gobelets, préavis, frigo « NE PAS TOUCHER AU YAOURT DE M. DELAIGUE » (graine ch.4). Terminal de tube pneumatique. | `accord` (P-15), `gobelet` (café, après la grève) | `st-couloir-b` |
| 9 | `st-sous-chef` | **Bureau du Sous-Chef Adjoint** | Un placard à balais reconverti (Gary se sent chez lui). Fax, plaque « H. DELAIGUE, p.i. », note de délégation de signature punaisée. | (signature p.o., réveil au café) | `st-couloir-b` |
| 10 | `st-ascenseur` | **Ascenseur à Formulaires** | Cabine sans boutons : une fente. On y glisse un dossier, l'ascenseur lit la case la plus avancée et choisit l'étage. | — | `st-couloir-b`, `st-conseil` (case C), `st-direction` (case E) |
| 11 | `st-conseil` | **Salle du Conseil** | Table ovale pour 12, Mme Paraphe seule, tableau des membres (Paraphe ; Représentant du personnel : PERCO ; Membre honoraire : M. FICUS), urne transparente, tube pneumatique d'arrivée. | (quorum, vote) | `st-ascenseur` |
| 12 | `st-direction` | **Direction Générale de l'Existence** | Bureau de SYLVIE : trône-photocopieuse, mur d'écrans, **coffre des Objets Trouvés** (le 2e éclat pulse derrière la vitre). | `permis` ; 2e éclat ; retour du `badge` | `st-ascenseur` |
| 13 | `st-fourriere` | **Fourrière & Quai des Navettes** | Le mini-vaisseau sabot aux patins, guérite de M. Sabot, panneau des amendes en dimensions. Visitable dès le début (graine du final). | (amende, sortie) | `st-sas` |
| — | `st-formulaire` | **Gros plan : Formulaire B-7/12** | Le formulaire sur le pupitre : cases A–E qui se remplissent (tampons, signature, trombone des 3 exemplaires). Tableau de bord du chapitre. | — | retour (`st-guichet`) |

Navigation : `st-fourriere` ⇄ `st-sas` ⇄ `st-attente` ⇄ `st-guichet` ⇄ `st-couloir-b`
⇄ {archives, tampons, réclamations, pause, sous-chef, ascenseur} ; `st-ascenseur` ⇄
`st-conseil` / `st-direction` selon le dossier glissé dans la fente.

## 5. Inventaire

Arrivée : `badge`, `fragment`, `combi_chitine` (cette dernière est **enfilée pendant
l'interlude** → flag `combi_portee`, elle quitte l'inventaire). Étapes = numéros de
l'arbre §6.

| Objet | id | Ramassé (étape) | Utilisé (étape) | Écart | Remarque |
|---|---|---|---|---|---|
| Badge « Garry » | `badge` | départ (0) | 14 (fichier des archives) | **14** | Payoff du double R. Duplicata le garde comme pièce justificative ; rendu par SYLVIE à l'étape 43. |
| Éclat contenu 1/4096 | `fragment` | départ (0) | 8, 42 (horloge), 43 (coffre) | 8 / 34 / 1 | **Réutilisé** : l'improbabilité fait avancer l'horloge ; fusionne avec le 2e éclat. |
| Ticket de douane | `ticket_douane` | 2 (sas) | 44 (fourrière) | **42** | Le plus long payoff du chapitre ; fausse piste au distributeur de tickets. |
| Plante en plastique (M. Ficus) | `plante` | 5 (attente) | 11 (couloir), 36 (Conseil) | 6 / **31** | **Double usage** : repère dans le couloir infini, puis membre honoraire au quorum. |
| Ticket n° 9848 | `ticket_9848` | 6 (B.O.B. l'aspire) | 9 (guichet) | 3 | Court, tutoriel du chapitre. |
| Formulaire B-7/12 | `formulaire` | 9 (guichet) | 20, 29, 32, 33, 34, 40, 42 | — | **Fil rouge** réutilisé 7 fois ; état par flags `st_case_a…e`. |
| Tampon « ANNULÉ » | `tampon_annule` | 15 (tampons) | 39 (Conseil), 45 (fourrière) | **24 / 30** | **Réutilisé** ; fausse piste sur la borne du sas (« on n'annule pas un statut »). |
| Encreur sec → imbibé | `encreur` | 16 (tampons) | 28 (combinaison), 29 (Tamponnet) | **12 / 13** | Combinaison avec le café. |
| Liasse de réclamations vierges | `liasse` | 18 (réclamations) | 19 (photocopieuse) | 1 | Le papier reste dans le bac : resservira à l'étape 33 (via la machine). |
| Capsule pneumatique | `capsule` | 18 (réclamations) | 37 (PERCO → Conseil) | **19** | Vote par procuration. |
| Copies du dossier Plunk | `copies_dossier` | 19 (archives) | 20 (combinaison avec le formulaire) | 1 | Remplit la case A. |
| Accord de pause P-15 | `accord` | 22 (pause) | 25 (signature p.o.), 26 (PERCO) | 3 / 4 | Bloqué tant que Gary est un animal (dépendance croisée). |
| Gobelet de café tiède | `gobelet` | 27 (PERCO) | 28 (combinaison), 31 (Delaigue) | 1 / 4 | Rempli deux fois (étapes 27 et 30) ; Delaigue le garde. |
| Permis de quitter la dimension | `permis` | 43 (SYLVIE) | 46 (quai) | 3 | Rendu du badge au même moment. |

**Total : 14 objets** (2 hérités + 12 nouveaux). **En poche simultanément** : 2–5 à
l'acte I, 6–8 aux actes II–III (pic à 8 aux étapes 18–19, 22–25, 27–28), 4–6 à
l'acte IV. **6 objets à écart ≥ 5** : `ticket_douane` (42), `plante` (31),
`tampon_annule` (24/30), `capsule` (19), `badge` (14), `encreur` (12), plus `fragment`
(34 entre ses deux usages d'horloge).

**Combinaisons** : `copies_dossier` + `formulaire` → case A ; `encreur` + `gobelet` →
encreur imbibé ; (refus drôles) `plante` + `gobelet` (« elle est en plastique, Gary ;
elle n'a pas soif, elle a des principes »), `ticket_9848` + `ticket_douane`
(« deux tickets ne font pas un rendez-vous »), `tampon_annule` + `formulaire`
(« tu veux annuler ta propre demande ? C'est très local, comme réflexe »).

## 6. Chaîne de puzzles

Flag d'état `st` posé par l'état initial. Les cases du formulaire s'enchaînent dans un
ordre imposé et annoncé (A identité → B « VU » → D signature → C copies conformes →
E avis du Conseil → dépôt). Mme Guichard l'explique à l'étape 9 ; le gros plan
`st-formulaire` le montre en permanence.

```
Arrivée (interlude → st-sas, onFirstEnter, Ink st_arrivee) : le vaisseau s'encastre ;
le portique scanne Gary : « ESPÈCE : BLATTE (COMBINAISON). STATUT : ANIMAL DE COMPAGNIE.
PROPRIÉTAIRE : B.O.B. » ; le vaisseau part en fourrière ; SYLVIE annonce que
« L'OBJET TROUVÉ N° 2/4096 » attend sa réclamation.        [st_arrive] [st_vaisseau_fourriere]
│
├─ ACTE I — « Vous êtes un animal » (sas, attente, guichet, couloir B)
│   1. (arrivée ci-dessus)
│   2. Sas : prendre le ticket de douane au portique.                 [st_ticket_douane] +ticket_douane
│   3. Sas : regarder la borne (« ANIMAUX ACCOMPAGNÉS ») ; parler à B.O.B. → il « tient
│      Gary en laisse, symboliquement ». La porte de l'attente s'ouvre.          [st_laisse]
│      (Fourrière visitable dès maintenant : M. Sabot exige « le ticket d'entrée et le
│       permis de la Direction » → objectif final semé.)
│   4. Attente : regarder le squelette (ticket 9848), l'afficheur (9 847), le
│      distributeur vide.                                                    [st_voit_patience]
│   5. Attente : prendre la plante en plastique.                             +plante
│   6. Attente : parler à B.O.B. (option « Il n'en a plus besoin… ») → B.O.B. aspire le
│      ticket ; éloge funèbre.                                 [st_ticket_9848] +ticket_9848
│   7. Guichet : rideau baissé, horloge 10 h 11, horaires 10 h 12–10 h 14.   [st_voit_horloge]
│   8. Guichet : éclat sur l'horloge → l'improbabilité pousse la grande aiguille :
│      10 h 12, le rideau remonte, l'afficheur passe à 9848.               [st_guichet_ouvert]
│   9. Guichet : ticket 9848 sur Mme Guichard → « les animaux s'adressent au
│      propriétaire » → B.O.B. parle → Formulaire B-7/12 + énoncé des 5 cases ;
│      10 h 14, rideau.                       [st_formulaire] −ticket_9848 +formulaire
│  10. Couloir B : on boucle (même extincteur, même porte B-1).              [st_couloir_boucle]
│  11. Couloir B : poser la plante → au tour suivant, la plante est **une porte plus
│      à gauche** : le couloir glisse.                                [st_plante_posee] −plante
│  12. Couloir B : « suivre la plante » (Ink, 3 choix de direction, le bon = vers la
│      plante) → le couloir se dénoue, les bureaux apparaissent ; Gary reprend M. Ficus.
│                                                               [st_couloir_resolu] +plante
│
├─ ACTE II — « Humain, preuves à l'appui » (archives, tampons, réclamations)
│  13. Archives : parler à Duplicata, chercher « PLUNK, GARY » → « AUCUN GARY. AUCUN
│      GARY. »                                                               [st_cherche_gary]
│  14. Archives : badge sur le fichier → tiroir G : « PLUNK, GARRY — STATUT : HUMAIN.
│      INTÉRIMAIRE. RENOUVELABLE PAR PITIÉ. » L'original ne sort pas ; la photocopieuse
│      n'a plus de papier ; Duplicata garde le badge (pièce justificative).
│                                                               [st_dossier_trouve] −badge
│  15. Tampons : parler à Tamponnet → plus d'encre « depuis la grève : l'encre, c'était
│      le café » ; elle donne le tampon ANNULÉ (« ICI, ON N'ANNULE JAMAIS RIEN »).
│                                                               [st_tamponnet] +tampon_annule
│  16. Tampons : prendre l'encreur sec.                                     +encreur
│  17. Réclamations : comptoir réservé au personnel ; combi de chitine sur la chatière
│      « ANIMAUX DE SERVICE » → Gary s'aplatit, la chatière reconnaît la carapace.
│                                                                            [st_chatiere]
│  18. Réclamations (derrière le comptoir) : prendre la liasse de formulaires de
│      réclamation vierges et une capsule pneumatique vide.          +liasse +capsule
│  19. Archives : liasse sur la photocopieuse → 3 copies du dossier, Duplicata :
│      « CONFORME. CONFORME. » ; le papier reste dans le bac.
│                                             [st_papier] −liasse +copies_dossier
│  20. Combiner copies + formulaire → case A remplie ; haut-parleurs : « RECLASSEMENT :
│      INTÉRIMAIRE. (C'EST PIRE.) » ; B.O.B. perd son animal, soulagé et un peu triste.
│                                          [st_case_a] [st_reclasse] −copies_dossier
│  21. (Tampons : formulaire sur Tamponnet → « PAS D'ENCRE, PAS DE VU. » → renvoie à la
│      grève.)                                                               [st_sait_greve]
│
├─ ACTE III — « La Grève » (pause, sous-chef, tampons, archives)
│  22. Pause : parler à PERCO → grève jusqu'à la signature de l'accord P-15 « par la
│      direction OU SON INTÉRIMAIRE » ; prendre l'accord.        [st_greve_connue] +accord
│  23. Sous-chef : Delaigue dort ; lire la plaque « p.i. » et la note : « en cas
│      d'absence (sommeil compris), tout intérimaire de la station signe p.o. ».
│                                                                       [st_voit_delegation]
│  24. (Si Gary n'est pas reclassé : accord sur Delaigue → « UN ANIMAL NE SIGNE PAS. IL
│      TAMPONNE AVEC LA PATTE. » — garde-fou, voir §6.5.)
│  25. Sous-chef : accord sur Delaigue (requiert `st_reclasse`) → Gary signe « p.o. »
│      avec le stylo enchaîné. « Pour la première fois de ma vie, être intérimaire
│      me sert à quelque chose. »                                         [st_accord_signe]
│  26. Pause : accord signé sur PERCO → fin de grève, les gobelets rentrent au
│      dépôt.                                                     [st_greve_finie] −accord
│  27. Pause : parler à PERCO → café tiède dans un gobelet (« UN À LA FOIS »). +gobelet
│  28. Combiner encreur + gobelet → encreur imbibé de café (brun, « conforme »).
│                                                                   [st_encreur_cafe]
│  29. Tampons : encreur sur Tamponnet → CLONK de joie ; formulaire sur Tamponnet →
│      « VU » (requiert case A).                                   [st_case_b] −encreur
│  30. Pause : gobelet sur PERCO → 2e café.                                  [st_cafe2]
│  31. Sous-chef : gobelet sur Delaigue → « …PRIME ? QUELLE PRIME ? » Réveillé ; il
│      garde le gobelet.                                     [st_delaigue_reveille] −gobelet
│  32. Sous-chef : formulaire sur Delaigue → signature hiérarchique (requiert « VU ») ;
│      il explique l'ascenseur (« il ne prend que les dossiers complets aux trois
│      quarts ») et le quorum du Conseil.                                     [st_case_d]
│  33. Archives : formulaire sur la photocopieuse (papier de l'étape 19) → 3
│      exemplaires, Duplicata certifie (tampon léché au café).               [st_case_c]
│
└─ ACTE IV — « Le Conseil et la Restitution » (ascenseur, Conseil, Direction, guichet, fourrière)
   34. Ascenseur : formulaire dans la fente → « AVIS DU CONSEIL REQUIS » → étage Conseil
       (refusé avant case C).                                         [st_ascenseur_conseil]
   35. Conseil : parler à Paraphe → quorum de 3 ; tableau des membres : PERCO
       (représentant du personnel), M. FICUS (membre honoraire, « en plastique depuis
       le déménagement »).                                                [st_quorum_connu]
   36. Conseil : plante sur le siège du membre honoraire. Présent.        [st_ficus] −plante
   37. Pause : capsule sur PERCO (requiert `st_greve_finie`) → procuration + un café
       (« UN CAFÉ = UN POUR ») envoyés par tube au Conseil.           [st_vote_perco] −capsule
   38. Conseil : parler à Paraphe → vote : PERCO POUR, Ficus abstention, Paraphe CONTRE
       « par principe » → égalité, avis AJOURNÉ.                           [st_vote_egalite]
   39. Conseil : tampon ANNULÉ sur le bulletin de Paraphe → « ON N'ANNULE JAMAIS RIEN…
       DONC C'EST VALABLE. » Avis favorable ; Paraphe, touchée qu'on ait lu son bulletin,
       paraphe.                                                               [st_case_e]
   40. Ascenseur : formulaire complet → DIRECTION GÉNÉRALE.
   41. Direction : SYLVIE en personne (Ink st_sylvie) → « DÉPÔT AU GUICHET
       UNIQUEMENT. » Le coffre pulse.                                     [st_sylvie_refuse]
   42. Guichet : éclat sur l'horloge (2e fois ; B.O.B. : « tu l'as déjà fait ») → 10 h 12,
       formulaire sur Mme Guichard → tube pneumatique vers la Direction.
                                                                     [st_dossier_depose]
   43. Direction : parler à SYLVIE → le coffre s'ouvre : « PROUVEZ QUE L'OBJET EST À
       VOUS. » Éclat sur le coffre → les deux éclats se reconnaissent et fusionnent
       (2/4096) ; SYLVIE craque (§8), rend le badge, délivre le permis.
                                                  [st_eclat2] +badge +permis
   44. Fourrière : ticket de douane sur M. Sabot → « RETRAIT POSSIBLE. AMENDE : 4 096
       CRÉDITS (STATIONNEMENT EN TRAVERS D'UNE DIMENSION). » −ticket_douane [st_amende]
   45. Fourrière : tampon ANNULÉ sur l'amende → Sabot : « …Je fais pas les ventes, mais
       ça, c'est réglementaire. »                                  [st_vaisseau_libere]
   46. Quai : permis sur le vaisseau → décollage → `# end: st_suite`.     −permis
```

### 6.1 Chaînes longues (explicites)

1. **Identité** : ticket 9848 (6) → guichet (9) → couloir (12) → badge aux archives (14)
   → papier volé par la chatière (17–18) → copies (19) → case A / reclassement (20).
2. **Grève** : reclassement (20) → signature p.o. (25) → fin de grève (26) → café (27)
   → encre (28) → « VU » (29) → 2e café (30) → Delaigue réveillé (31) → signature (32).
3. **Quorum** : plante prise à l'acte I (5) → Conseil (36) ; capsule prise à l'acte II
   (18) → PERCO, qui ne vote que si la grève est finie (37) ; tampon ANNULÉ (15) →
   égalité brisée (39).
4. **Sortie** : ticket de douane (2) + horloge apprise à l'acte I (8 → 42) + tampon
   (15 → 45) + permis (43) → décollage (46).

### 6.2 Dépendances croisées

| Puzzle bloqué | Tant que… (ailleurs) |
|---|---|
| Signer l'accord P-15 (sous-chef) | Gary n'est pas reclassé intérimaire (archives, case A) |
| Tampon « VU » (tampons) | la grève n'est pas finie (pause) **et** la case A n'est pas remplie |
| Signature hiérarchique (sous-chef) | Delaigue dort (café de la pause) **et** pas de « VU » (tampons) |
| 3 exemplaires (archives) | pas de papier (réclamations, via la chatière) **et** pas de signature |
| Ascenseur → Conseil | case C (archives) |
| Quorum (Conseil) | plante (attente, acte I) + vote de PERCO (pause, grève finie + capsule des réclamations) |
| Dépôt (guichet) | avis du Conseil + savoir manipuler l'horloge (acte I) |
| Sortie (fourrière) | ticket de douane (sas, acte I) + tampon ANNULÉ (tampons, acte II) + permis (Direction) |

### 6.3 Indices B.O.B. (`st_bob`)

Une branche par étape bloquante, deux niveaux : 1er appel vague, 2e appel précis
(flag `st_bob_<étape>_2`). Exemples : horloge (« Il est très improbable que ce guichet
ouvre. Tu as quelque chose d'improbable sur toi ? ») ; couloir (« Il faudrait un repère.
Quelque chose qui ne bouge pas. Quelque chose de… plastique. ») ; quorum (« Lis le
tableau des membres. Le troisième, tu le connais. Tu l'as dans ta poche depuis une
heure. ») ; égalité (« Elle vote contre. Personne n'a jamais annulé son vote. Tu as un
tampon que personne n'utilise. »).

### 6.4 Fausses pistes et répliques (au moins une par hotspot clé)

- `tampon_annule` sur la borne du sas : « ON N'ANNULE PAS UN STATUT. VOUS ÊTES UN ÉTAT
  DE FAIT. »
- `ticket_douane` sur le distributeur de tickets / Guichard : « Pas le bon ticket. Pas
  le bon guichet. Pas la bonne vie. »
- prendre un gobelet du piquet avant la fin de la grève : « BRISEUR DE GRÈVE ! » (les
  gobelets sifflent).
- secouer Delaigue : « …réunion… reportée… »
- `fragment` sur PERCO : la machine sert un café **froid** (« IMPROBABLE. INADMISSIBLE.
  PRÉAVIS RECONDUIT. » — puis rien ne change, pas de blocage).
- `plante` sur Paraphe : « Il vote déjà mieux que vous. A.P. »
- `badge` sur le portique : « BADGE : GARRY. ESPÈCE : TOUJOURS BLATTE. »
- `fragment` sur le coffre avant le dépôt : « DÉPÔT AU GUICHET. MÊME POUR LES MIRACLES. »

### 6.5 Aucune impasse (garde-fous)

- Aucun objet indispensable ne peut être donné au mauvais PNJ : les mauvais usages
  répondent mais ne consomment rien.
- La chatière reconnaît la **carapace** (combi portée), pas le statut : elle reste
  ouverte après le reclassement.
- PERCO sert un café « un à la fois » sans limite après la grève ; le papier reste dans
  le bac de la photocopieuse ; le tampon ANNULÉ n'est jamais consommé.
- L'éclat fait avancer l'horloge autant de fois que nécessaire (le guichet referme
  après chaque passage, sans perte).
- Invariants `repair.ts` à prévoir : `st_case_a` ⇒ pas de `copies_dossier` ;
  `st_dossier_trouve` ∧ ¬`st_eclat2` ⇒ pas de `badge` ; `st_eclat2` ⇒ `badge` ∧
  `permis` (avant 46) ; `st_ficus` ⇒ pas de `plante` ; `st_formulaire` ⇒ `formulaire`
  jusqu'à `st_dossier_depose`.

## 7. Structure en actes (résumé)

| Acte | Lieux | Objectif visible | Durée visée |
|---|---|---|---|
| I « Vous êtes un animal » | sas, attente, guichet, couloir B (+ fourrière en repérage) | obtenir le formulaire, dénouer le couloir | 15–20 min |
| II « Humain, preuves à l'appui » | archives, tampons, réclamations | case A, être reclassé | 15–20 min |
| III « La Grève » | pause, sous-chef, tampons, archives | cases B, D, C | 20–25 min |
| IV « Le Conseil et la Restitution » | ascenseur, Conseil, Direction, guichet, fourrière | case E, dépôt, 2e éclat, sortie | 15–20 min |

## 8. Fin du ch.1 et accroche ch.2

**Le craquage de SYLVIE** (étape 43, Ink `st_sylvie_restitution`) : en vérifiant le
dossier, SYLVIE lit « PLUNK, GARRY — CONTRAT RENOUVELABLE PAR PITIÉ ». Silence de
trois secondes (les écrans clignotent). « …C'EST MOI QUI AI TAPÉ LES DEUX R. DANS
TOUTES LES DIMENSIONS. POUR QUE VOTRE DOSSIER NE SOIT JAMAIS CLASSÉ AVEC LES AUTRES. »
Gary ne sait pas quoi dire ; B.O.B. : « C'est la chose la plus gentille qu'une base
de données ait jamais faite. » SYLVIE reprend aussitôt : « FORMULAIRE DE RETOUR À
REMPLIR À L'ARRIVÉE. EN TROIS EXEMPLAIRES. »

**Fin** (`# end: st_suite`, plan de fin) : le vaisseau décolle du quai ; dans le
rétroviseur, toute la station tamponne « VU » sur ses hublots. L'éclat 2/4096 tire
l'aiguille du navigateur vers… un grain de poussière sur le tableau de bord. B.O.B. :
« Gary. Je crois que la prochaine dimension est **dans** le vaisseau. » Le vaisseau
rétrécit. Carte : « FIN DU CHAPITRE 1 » → « Chapitre 2 — Dimension Miniature : tout est
minuscule, sauf la poussière. » → « À suivre… ». Flag `st_termine`.

Graine ch.4 semée en passant : le frigo de la pause, « NE PAS TOUCHER AU YAOURT DE
M. DELAIGUE » ; le yaourt a laissé une note : « PARTI FONDER QUELQUE CHOSE. »

## 9. Scaffold du run suivant

Objectif : **2 salles jouables en stub** pour valider le préfixe, l'état initial, la
mécanique d'objet à payoff différé et la présence dans /creator — sans bloquer sur l'art.

**Salles** : `st-sas` (arrivée) + `st-attente` (vrai mini-puzzle : obtenir le
ticket 9848 via B.O.B., plus la plante à payoff différé). La sortie vers `st-guichet`
existe mais renvoie « GUICHET FERMÉ — TRAVAUX DE RÉNOVATION DU RÈGLEMENT » (`lockedText`) ;
la sortie vers `st-fourriere` idem.

| Élément | Valeur proposée |
|---|---|
| Fichiers | `content/scenes/st-sas.yaml`, `content/scenes/st-attente.yaml`, `content/story/st_arrivee.ink`, `content/story/st_bob.ink` (knots `st_arrivee`, `st_bob`, `st_patience`) |
| Ids de scènes | `st-sas`, `st-attente` (stubs suivants : `st-guichet`, `st-couloir-b`, `st-fourriere`) |
| Hotspots `st-sas` | `portique` (look ; take → `ticket_douane`), `borne` (look : statut ; `useItem tampon_annule` plus tard), `vaisseau` (look : remorqué, `if: notFlags st_vaisseau_fourriere`), `bob` (talk → `st_laisse`) |
| Hotspots `st-attente` | `squelette` (look → `st_voit_patience`), `afficheur` (look « 9 847 »), `distributeur` (look ; `useItem ticket_douane` = fausse piste), `plante` (take → `plante`), `bob` (talk ; option aspirer si `st_voit_patience`) |
| Flags | `st` (état), `st_arrive`, `st_vaisseau_fourriere`, `st_ticket_douane`, `st_laisse`, `st_voit_patience`, `st_ticket_9848` |
| Objets (`items.yaml`) | `ticket_douane`, `ticket_9848`, `plante` (icônes : glyphes texte au stub) ; `look` de `badge` / `fragment` gardés par `st` |
| État initial `ch1` | `startScene: 'st-sas'` tant que l'interlude n'existe pas ; `items: ['badge', 'fragment']`, `flags: ['st', 'ch0_termine', 'combi_portee']` |
| Walkthrough `ch1` (stub) | `look portique` → `use portique` → `talk bob` → `go st-attente` → `look squelette` → `use plante` → `talk bob` ; fin provisoire : pas d'`endKnot` atteint (playthrough : vérifier `ticket_9848` + `plante` + `ticket_douane` en inventaire) |
| Rendu | Pièces RoomScene 3D minimales (coque « station » réutilisant le gabarit du couloir C : paroi acier, dalle) ; squelette = prop simple ; plante = cône vert. Art YAML 2D en repli. |
| Musique | `couloir` pour les deux ids (`SCENE_THEME`) |
| i18n | titres de pièces + libellés FR ; `en.yaml` facultatif |

Critère de fin du scaffold : `/?chapter=1` (ou `/?scene=st-sas&chapter=1&…`) → on
ramasse le ticket de douane, on entre dans l'attente, on obtient le ticket 9848 par
B.O.B. et la plante ; les deux objets différés (`ticket_douane`, `plante`) restent en
inventaire ; `npm run playthrough` passe ch0 inchangé + stub ch1.

## 10. Notes techniques (pour plus tard)

- **Tubes pneumatiques** : simple effet de mise en scène (prop + son « FLOUP »), pas un
  système de transport d'objets générique : chaque envoi est un `useItem` scripté.
- **Couloir infini** : une seule pièce `st-couloir-b` ; la boucle est jouée par Ink
  (choix de direction) + un décalage de la plante (prop conditionné par flags), pas par
  une vraie géométrie.
- **Gros plan `st-formulaire`** : entrée `CLOSEUPS` avec 5 cases dont l'art dépend des
  flags `st_case_*` ; même rôle que le panneau du ch.0.
- **Horloge** : prop avec aiguille pilotée par `st_guichet_ouvert` (temporaire : un
  `onExit` remet le flag à faux) ; le rideau du guichet suit le même flag.
- **Portraits** : 6 fonctionnaires → portraits fixes GenAI d'abord, planches parlantes
  pour SYLVIE-Directrice et Delaigue ensuite.
