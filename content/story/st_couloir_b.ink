// Chapitre 1 « La Station Bureaucratique » : le Couloir Infini B (st-couloir-b), docs/CHAPTER1.md §6.10–12.
// Une seule pièce : la boucle est jouée ici (Ink), pas par la géométrie (§10).
//   porte (avant la plante)  → on revient au même extincteur          [st_couloir_boucle]
//   plante posée au sol (YAML, emplacement) → repère                    [st_plante_posee] −plante
//   porte / ficus ensuite    → « suivre la plante » (3 directions)     [st_couloir_resolu] +plante
//   casier STOCK B-7/12 (YAML) → le dernier formulaire                  [st_formulaire] = fin de l'Acte I

=== st_couloir_porte ===
{ has_flag("st_couloir_resolu"):
    La porte s'ouvre sur un vrai bureau. Vide. Une pancarte sur le bureau : « OUVERTURE DÈS QUE LE RÈGLEMENT LE PERMETTRA ».
    gary: Le couloir est dénoué, les bureaux existent, et il n'y a personne dedans. C'est presque rassurant.
    -> END
}
{ has_flag("st_plante_posee"):
    -> st_couloir_glisse
}
Gary pousse la porte. Derrière : un couloir administratif. Des néons. Une porte B-1, une porte B-2, une porte B-3. Un extincteur.
Il avance. Il passe la porte B-3. Derrière : un couloir administratif. Des néons. Une porte B-1. Un extincteur.
gary: C'est le même extincteur.
bob: Ce n'est pas le même extincteur, Gary. C'est l'extincteur. Il n'y en a qu'un. C'est nous qui sommes plusieurs fois. # mood: suspicious # set: st_couloir_boucle
{ not has_flag("st_couloir_boucle"):
    gary: On est revenus au point de départ sans jamais faire demi-tour. Le couloir boucle.
    bob: Les couloirs administratifs bouclent toujours, Gary. Celui-ci a juste arrêté de faire semblant. # mood: calm
    bob: Il nous faudrait un repère. Quelque chose qui ne bouge pas. Qui ne suit aucune procédure. Qui n'a pas d'avis. # mood: suspicious
    - else:
    gary: Encore. Les portes se ressemblent toutes. Il me faut quelque chose qui, lui, ne ressemble à rien d'administratif.
}
-> END

// Après la plante : la porte ramène au couloir… mais M. Ficus est une porte plus à gauche.
=== st_couloir_glisse ===
Gary pousse la porte, traverse le couloir, passe la porte B-3, et revient. Néons. Porte B-1. Extincteur.
Mais M. Ficus n'est plus à gauche de l'extincteur. Il est une porte plus à gauche. Exactement une.
gary: Le ficus n'a pas bougé. C'est le couloir qui a glissé.
bob: Un repère sans procédure, Gary. Le couloir ne sait pas quoi en faire. Suis la plante. # mood: love
-> st_couloir_suivre

=== st_couloir_suivre ===
{ has_flag("st_couloir_resolu"):
    gary: On a déjà suivi M. Ficus. Le couloir s'en souvient. Il boude un peu.
    -> END
}
Trois directions. Les trois ont un panneau « AILE B ». Un seul a une plante en plastique.
+ [Tout droit, vers la porte B-1.]
    gary: Tout droit. Vers la porte B-1. Elle a l'air sûre d'elle.
    Gary marche tout droit. Porte B-1. Porte B-2. Porte B-3. Extincteur. M. Ficus, une porte plus à gauche.
    bob: Elle avait l'air sûre d'elle parce qu'elle a l'habitude, Gary. Ça ne la rend pas juste. # mood: sad
    -> END
+ [À droite, vers « SORTIE DE SECOURS ».]
    gary: La sortie de secours. Dans le doute, toujours la sortie de secours.
    Gary pousse la porte de secours. Derrière : un couloir administratif. Un extincteur. Une affiche « SORTIE DE SECOURS → ».
    gary: La sortie de secours sort sur le couloir. C'est pour ça qu'on ne s'en sert jamais.
    bob: En cas d'urgence, Gary, le règlement prévoit de rester en cas d'urgence. # mood: calm
    -> END
+ [À gauche, vers M. Ficus.]
    gary: Vers M. Ficus. Il n'a pas d'avis. C'est pour ça que je lui fais confiance.
    Gary marche vers la plante. La porte qui était à côté d'elle recule, hésite, puis reste à sa place. Le couloir craque comme un classeur trop plein.
    Les néons clignent. La porte B-1 devient « ARCHIVES ». La B-2 devient « TAMPONS ». La B-3 devient « RÉCLAMATIONS ». Au bout, un casier gris : « STOCK B-7/12 ». # shake
    bob: Il s'est dénoué, Gary ! Le couloir s'est dénoué ! Une plante en plastique vient de faire ce que trois réformes n'ont jamais réussi ! # mood: surprised
    Gary ramasse M. Ficus. Il a l'air exactement aussi content que d'habitude. C'est-à-dire pas du tout, avec dignité. # give: plante
    gary: Merci, Monsieur Ficus. Vous êtes un repère. # set: st_couloir_resolu
    -> END

// Payoff : le dernier B-7/12, dans le casier « STOCK B-7/12 » (YAML : give formulaire, set st_formulaire).
// Fin de l'Acte I (Accueil) ; les portes des bureaux sont déjà des sorties (Acte II, st-archives…).
=== st_couloir_formulaire ===
Gary ouvre le casier. Dedans : une étagère. Sur l'étagère : un seul formulaire, bien à plat, légèrement jauni, avec une étiquette « DERNIER EXEMPLAIRE — NE PAS UTILISER ».
gary: Le Formulaire B-7/12. Le dernier. On l'a.
bob: On l'a, Gary. Le premier formulaire retiré dans cette Station depuis 1985. Je vais pleurer. Je n'ai pas de glandes, mais je vais trouver. # mood: love
Gary le retourne. Au dos : cinq cases. Rempli. Tamponné. Signé. Conforme. Et une cinquième, sans titre.
gary: Cinq cases. Aucune remplie.
sylvie: AVIS À LA CLIENTÈLE. LE COULOIR B EST DÉNOUÉ. LES BUREAUX DE L'AILE B SONT OUVERTS AUX USAGERS MUNIS D'UN DOSSIER. MERCI DE VOTRE PATIENCE. # mood: love
bob: « Munis d'un dossier. » Tu sais ce que ça veut dire, Gary ? # mood: suspicious
gary: Que je n'en ai pas ?
bob: Que tu es classé animal, et qu'un animal n'a pas de dossier. Il va falloir prouver que tu es quelqu'un. Les Archives, Gary. Porte B-1. # mood: calm
-> END

// B.O.B. dans le couloir : indices gradués (porte → plante → suivre M. Ficus → casier).
=== st_bob_couloir ===
{ not has_flag("st_couloir_boucle"):
    bob: L'Aile B, Gary. Trois portes, un extincteur, et ce son. Tu entends ? C'est l'écho d'un écho. # mood: suspicious
    bob: Pousse une porte. N'importe laquelle. On verra bien où elle nous ramène. # mood: calm
    -> END
}
{ not has_flag("st_plante_posee"):
    bob: Le couloir boucle, Gary. Toutes les portes se ressemblent. L'extincteur, lui, ne bouge jamais. Il a un panneau pour ça. # mood: suspicious
    { has_item("plante"):
        bob: Il nous faut un repère qui n'a rien d'administratif. Quelque chose de vert, en plastique, sans avis. Je ne vise personne. Pose-le à côté de l'extincteur. # mood: love
    - else:
        bob: Il nous faut un repère qui n'a rien d'administratif. Un objet sans procédure. Tu n'as rien de ce genre dans tes poches ? # mood: calm
    }
    -> END
}
{ not has_flag("st_couloir_resolu"):
    bob: M. Ficus est posé. Maintenant, pousse une porte, Gary. Le couloir va glisser. Lui, non. Et quand tu ne sauras plus où aller : suis la plante. # mood: love
    -> END
}
{ not has_flag("st_formulaire"):
    bob: Le casier, Gary. « STOCK B-7/12 ». Il était là depuis le début. Il attendait juste qu'on arrive par le bon côté. # mood: surprised
    -> END
}
// Acte II : les bureaux sont ouverts (sorties vers_archives / vers_tampons / vers_reclamations)
{ not has_flag("st_cherche_gary"):
    bob: On a le formulaire, Gary. Et les portes s'ouvrent : Archives, Tampons, Réclamations. Pour une Station comme celle-ci, c'est déjà une déclaration d'amour. # mood: love
}
-> st_bob_acte2
