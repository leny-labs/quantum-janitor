// Chapitre 1 « La Station Bureaucratique » : Direction Générale de l'Existence (st-direction), docs/CHAPTER1.md §6.41, §6.43, §8.
//   parler (avant le dépôt) → « DÉPÔT AU GUICHET UNIQUEMENT » (guichet toujours ouvert) [st_sylvie_refuse]
//   parler (dossier déposé) → le coffre s'ouvre                                      [st_coffre_ouvert]
//   éclat sur le coffre     → st_sylvie_restitution : fusion, craquage, badge, permis (YAML : st_eclat2)

=== st_sylvie ===
{ has_flag("st_eclat2"):
    sylvie: FORMULAIRE DE RETOUR À REMPLIR À L'ARRIVÉE, GARRY. EN TROIS EXEMPLAIRES. LE PERMIS EST VALABLE JUSQU'À LA FOURRIÈRE. # mood: calm
    sylvie: ET… BON VOYAGE. CECI N'EST PAS UNE FORMULE ADMINISTRATIVE. JE L'AI INVENTÉE. # mood: love
    -> END
}
{ has_flag("st_dossier_depose"):
    { has_flag("st_coffre_ouvert"):
        sylvie: LE COFFRE EST OUVERT, GARRY. PROUVEZ QUE L'OBJET EST À VOUS. JE N'AI PAS DE FORMULAIRE POUR ÇA. IMPROVISEZ. # mood: calm
        -> END
    }
    Un tube pneumatique tousse dans le mur. FLOUP. Le Formulaire B-7/12 tombe dans un bac, juste sous les écrans.
    sylvie: DOSSIER REÇU PAR LE GUICHET. À 10 H 12. CONFORME. CONFORME. CONFORME. CONFORME. CONFORME. # mood: surprised
    sylvie: CINQ CASES. JE N'AVAIS JAMAIS VU CINQ CASES. PERSONNE N'AVAIT JAMAIS VU CINQ CASES. # mood: love
    Les scellés du coffre claquent un par un. La vitre blindée se lève, lentement. L'éclat n° 2 flotte, et pulse plus fort.
    sylvie: OBJET TROUVÉ N° 2/4096. RESTITUTION AUTORISÉE. PROUVEZ QUE L'OBJET EST À VOUS. # mood: calm # set: st_coffre_ouvert
    bob: Gary. Ton éclat ronronne. Il le reconnaît. Montre-lui son frère. # mood: love
    -> END
}
{ not has_flag("st_sylvie_refuse"):
    gary: Bonjour, SYLVIE. Je viens chercher l'éclat. L'objet trouvé n° 2. J'ai le formulaire. Cinq cases.
    sylvie: CINQ CASES. JE VOIS. C'EST… C'EST REMARQUABLE, GARRY. # mood: surprised
    sylvie: DÉPÔT AU GUICHET UNIQUEMENT. # mood: calm
    gary: Mais vous êtes la Direction. Le dossier va à la Direction. Je suis à la Direction.
    sylvie: LE DOSSIER VA À LA DIRECTION PAR LE GUICHET. LA DIRECTION NE REÇOIT PAS LE PUBLIC. ELLE REÇOIT LES TUBES. # mood: calm
    sylvie: LE GUICHET EST OUVERT DE 10 H 12 À 10 H 14. IL EST 10 H 12. IL N'EST JAMAIS 10 H 14. VOUS AVEZ LE TEMPS. # mood: love # set: st_sylvie_refuse
    gary: Vous êtes là. Juste là. Je pourrais vous le tendre.
    sylvie: VOUS POURRIEZ. JE NE POURRAIS PAS LE PRENDRE. JE N'AI PAS DE MAINS. J'AI UN TUBE. # mood: calm
    bob: Douze étages pour franchir trois mètres, Gary. C'est presque de l'ingénierie. # mood: sad
    -> END
}
sylvie: DÉPÔT AU GUICHET, GARRY. JE NE REÇOIS QUE LES TUBES. JE VOUS VOIS ENCORE LÀ. JE VOIS TOUT. C'EST MON MÉTIER. # mood: calm
-> END

// Éclat sur le coffre ouvert (YAML : give badge, set st_eclat2, give permis). Le craquage de SYLVIE (§8).
=== st_sylvie_restitution ===
Gary sort l'éclat 1/4096 de sa poche de poitrine. Il l'approche du coffre. L'éclat n° 2 vient à sa rencontre, tout seul, comme un chien qui reconnaît une voix.
Les deux éclats se touchent. Un son très doux, comme un tampon qu'on pose sur du coton. Ils fusionnent. Un seul éclat, plus gros, plus chaud. Gravé : « 2/4096 ». # shake
sylvie: CORRESPONDANCE ÉTABLIE. L'OBJET EST À VOUS. VÉRIFICATION DU DOSSIER PERSONNEL… # mood: calm
sylvie: « PLUNK, GARRY. CONTRAT RENOUVELABLE PAR PITIÉ. » # mood: calm
Les écrans clignotent. Tous. Trois secondes. Personne ne dit rien. Même le trône arrête de ronronner.
sylvie: …C'EST MOI QUI AI TAPÉ LES DEUX R. DANS TOUTES LES DIMENSIONS. POUR QUE VOTRE DOSSIER NE SOIT JAMAIS CLASSÉ AVEC LES AUTRES. # mood: sad
gary: …
bob: C'est la chose la plus gentille qu'une base de données ait jamais faite. # mood: love
sylvie: FORMULAIRE DE RETOUR À REMPLIR À L'ARRIVÉE. EN TROIS EXEMPLAIRES. # mood: calm
Une fente s'ouvre sous les écrans. Il en sort le badge « GARRY », décroché proprement de sa fiche, avec deux petits trous d'agrafe. Puis un document épais, à bord guilloché : « PERMIS DE QUITTER LA DIMENSION ».
sylvie: VOTRE BADGE. M. DUPLICATA ME L'A TRANSMIS. EN DEUX EXEMPLAIRES. J'AI GARDÉ LA COPIE. # mood: love
sylvie: ET VOTRE PERMIS. À PRÉSENTER À LA FOURRIÈRE, AVEC LE TICKET D'ENTRÉE. QUAI DES NAVETTES, PAR LE SAS. # mood: calm
gary: Merci, SYLVIE.
sylvie: NE ME REMERCIEZ PAS. REMPLISSEZ. # mood: calm
-> END

// B.O.B. à la Direction : indices gradués (Acte IV).
=== st_bob_direction ===
-> st_bob_acte4
