// Chapitre 1 « La Station Bureaucratique » : Archives Centrales (st-archives), docs/CHAPTER1.md §6.13–14, §6.19–20.
// M. Régis Duplicata répète tout deux fois. Deux fois.
//   parler (chercher GARY)          → « AUCUN GARY. AUCUN GARY. »                 [st_cherche_gary]
//   badge sur le fichier (YAML)     → st_archives_badge : tiroir GARRY, badge gardé [st_dossier_trouve] −badge
//   liasse sur la photocopieuse     → st_archives_copies : 3 copies CONFORMES      [st_papier] −liasse +copies_dossier
//   copies + formulaire (items.yaml)→ st_reclassement : case A, intérimaire         [st_case_a] [st_reclasse]

=== st_duplicata ===
{ not has_flag("st_cherche_gary"):
    gary: Bonjour. Je voudrais mon dossier. Plunk. Gary Plunk.
    duplicata: Plunk. Plunk. Gary. Gary. Je cherche. Je cherche.
    M. Duplicata tire un tiroir, puis un autre, puis le même. Il colle son nez à chaque fiche. Ses lunettes grossissent les lettres jusqu'à ce qu'elles deviennent des paysages.
    duplicata: AUCUN GARY. AUCUN GARY. # mood: sad # set: st_cherche_gary
    gary: Comment ça, aucun Gary ? Je suis là. Je suis Gary.
    duplicata: Vous êtes là, c'est votre affaire. Votre affaire. Le fichier, lui, ne connaît que les pièces d'identité. Les pièces d'identité.
    duplicata: Présentez une pièce au fichier. Au fichier. Il lit la pièce, pas la personne. Pas la personne. La personne, c'est toujours mal orthographié.
    bob: Une pièce d'identité, Gary. Tu en as une. Elle a même un défaut que la RH n'a jamais voulu corriger. # mood: suspicious
    -> END
}
{ not has_flag("st_dossier_trouve"):
    duplicata: Le fichier. Le fichier. Une pièce d'identité dans la fente. Dans la fente. Je ne cherche plus à la main. Plus à la main. Mes yeux ont pris leur retraite. Pas moi.
    -> END
}
{ not has_flag("st_papier"):
    gary: Vous avez mon dossier. Je peux l'avoir ?
    duplicata: L'original ne sort pas. Ne sort pas. Je ne délivre que des copies. Que des copies.
    duplicata: Et la machine n'a plus de papier. Plus de papier. Depuis la grève. Depuis la grève. Le papier vierge, il n'y en a plus qu'au Service des Réclamations.
    duplicata: Personne n'y entre. Personne n'y entre. Réservé au personnel. Et le personnel n'y va jamais : il n'aime pas les réclamations. # mood: sad
    { has_item("liasse"):
        gary: J'ai une liasse de réclamations vierges.
        duplicata: Dans la machine ! Dans la machine ! Pas dans ma main ! # mood: surprised
    }
    -> END
}
{ not has_flag("st_case_a"):
    duplicata: Trois copies. Trois copies. Conformes. Conformes. Agrafez-les à votre demande, case A. Case A.
    duplicata: Le badge reste ici. Reste ici. Pièce justificative. Je vous le rendrai le jour où la Direction le demandera. La Direction ne demande jamais rien. Jamais rien. # mood: calm
    -> END
}
duplicata: Humain. Humain. Intérimaire. Intérimaire. Félicitations. Condoléances.
duplicata: Pour la case C, plus tard, il me faudra l'original tamponné et signé. Tamponné et signé. J'ai du papier, maintenant. Grâce à vous. Grâce à vous. # mood: love
-> END

// Badge sur le fichier (YAML : take badge, set st_dossier_trouve). Payoff du double R (§5).
=== st_archives_badge ===
Gary glisse le badge dans la fente du tiroir G. Le fichier ronronne, lit « GARRY », hésite, relit « GARRY ».
CLAC. Le tiroir G s'ouvre tout seul. Au fond, une fiche cartonnée, jaunie sur les bords.
gary: « PLUNK, GARRY. STATUT : HUMAIN. INTÉRIMAIRE. RENOUVELABLE PAR PITIÉ. »
gary: Deux R. Même ici. Même dans une autre dimension, la RH a mis deux R.
bob: Tu es humain, Gary ! C'est écrit ! Sur un carton ! Dans un tiroir ! Rien n'est plus vrai qu'un carton dans un tiroir ! # mood: surprised
duplicata: L'original ne sort pas. Ne sort pas. Je vous en ferai des copies. Des copies.
M. Duplicata appuie sur la photocopieuse. Elle tousse. Le voyant « EN PANNE DE PAPIER » clignote, ravi d'avoir enfin quelqu'un à qui le dire.
duplicata: Plus de papier. Plus de papier. Revenez avec du papier. Avec du papier.
duplicata: Et je garde la pièce. Je garde la pièce. Pièce justificative : elle reste avec le dossier tant que le dossier est ouvert. Tant qu'il est ouvert. # mood: calm
Il agrafe le badge à la fiche « GARRY ». Proprement. Deux agrafes.
gary: Mon badge…
bob: Il est en de bonnes mains, Gary. Des mains qui agrafent deux fois. Personne ne le perdra ici. Personne ne trouve jamais rien ici. # mood: sad
-> END

// Liasse sur la photocopieuse (YAML : take liasse, give copies_dossier, set st_papier).
=== st_archives_copies ===
Gary défait l'élastique et charge la liasse dans le bac. Cinq cents réclamations vierges, vert pâle. La photocopieuse les renifle.
Le voyant « EN PANNE DE PAPIER » s'éteint. Pour la première fois depuis la grève, quelque chose s'allume en vert.
duplicata: Du papier ! Du papier ! Le dossier ! Le dossier !
M. Duplicata pose la fiche « GARRY » sur la vitre. La machine chauffe, éclaire, avale, recrache. Une copie. Deux copies. Trois copies.
duplicata: Trois exemplaires. Trois exemplaires. Comme le veut l'usage.
Il lèche un tampon, l'essuie sur sa manchette, et l'abat trois fois. Le tampon laisse une trace brunâtre, à peine lisible, qui sent le vieux café.
duplicata: CONFORME. CONFORME. # mood: love
gary: Le tampon marche ? Mme Tamponnet n'a plus d'encre, elle.
duplicata: Je lèche les miens. Je lèche les miens. Il me reste du café de 1985 dans la moustache. Ne le dites à personne. À personne.
Le papier reste dans le bac. Il y en a pour des années.
bob: Trois copies de toi, Gary. Toutes humaines. Maintenant, agrafe-les au formulaire. Case A, identité. # mood: calm
-> END

// Copies + formulaire (items.yaml : take copies_dossier, set st_case_a + st_reclasse). Fin de l'Acte II.
=== st_reclassement ===
Gary agrafe mentalement les trois copies au Formulaire B-7/12. Puis vraiment, avec le trombone du formulaire. Il coche la case A : IDENTITÉ — REMPLI.
Quelque part dans les murs, un relais claque. Les haut-parleurs grésillent.
sylvie: AVIS À LA CLIENTÈLE. DOSSIER PLUNK, GARRY : PIÈCES CONFORMES. RECLASSEMENT EN COURS. # mood: calm
sylvie: ANCIEN STATUT : ANIMAL DE COMPAGNIE. NOUVEAU STATUT : HUMAIN. CATÉGORIE : INTÉRIMAIRE. # mood: calm
sylvie: (C'EST PIRE.) # mood: love
gary: Intérimaire. Même ici. Même après tout ça.
bob: Je… je n'ai plus d'animal, Gary. # mood: sad
bob: Je suis soulagé. Vraiment. Je ne savais pas quoi te donner à manger. Et je n'ai jamais su tenir une laisse, même symbolique. # mood: love
bob: Mais c'était bien, d'avoir quelqu'un. Pendant une heure. # mood: sad
gary: Tu m'as encore, B.O.B. Simplement, maintenant, c'est moi qui signe.
bob: Signe quoi ? # mood: suspicious
gary: Je ne sais pas encore. Mais un intérimaire, ça finit toujours par signer quelque chose.
sylvie: PROCHAINE ÉTAPE : CASE B, « VU ». BUREAU DES TAMPONS. SOUS RÉSERVE D'ENCRE. # mood: calm
-> END

// Acte III : le formulaire « VU » et signé sur la photocopieuse (YAML : set st_case_c). Le papier de l'étape 19.
=== st_archives_exemplaires ===
Gary pose le Formulaire B-7/12 sur la vitre. Case A : cochée. Case B : « VU ». Case D : une signature énorme, « p.i. ».
duplicata: Un original ! Un original ! Vu et signé ! Vu et signé ! # mood: surprised
La photocopieuse avale trois réclamations vierges du bac, chauffe, éclaire, recrache. Trois exemplaires du formulaire, encore tièdes.
duplicata: Trois exemplaires. Trois exemplaires. # mood: love
M. Duplicata lèche son tampon. Le café de 1985 de sa moustache suffit encore, de justesse. Il l'abat trois fois.
duplicata: CERTIFIÉS CONFORMES. CERTIFIÉS CONFORMES. Case C. Case C.
Il agrafe les trois exemplaires derrière l'original. Le formulaire est maintenant épais comme un vrai dossier.
gary: Quatre cases sur cinq.
duplicata: La cinquième, c'est l'avis du Conseil. Du Conseil. L'ascenseur à formulaires ne monte que les dossiers complets aux trois quarts. Aux trois quarts. Vous y êtes. Vous y êtes. # mood: calm
bob: Gary. Il a dit « vous y êtes » deux fois. Je crois que c'est un compliment. Deux compliments. # mood: love
-> END

// B.O.B. aux Archives : réplique de lieu, puis indices gradués de l'Acte II (st_bob_acte2).
=== st_bob_archives ===
{ not has_flag("st_cherche_gary"):
    bob: Des archives, Gary. Si tu existes quelque part dans cette Station, c'est sur un carton, ici. Demande ton dossier à l'archiviste. # mood: calm
    -> END
}
-> st_bob_acte2
