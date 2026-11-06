// Chapitre 1 « La Station Bureaucratique » : Salle de Pause (st-pause), docs/CHAPTER1.md §6.22, §6.26–27, §6.30.
// PERCO, machine à café syndiquée, déléguée du personnel. Slogans ; crachote de la vapeur quand on la contredit.
//   parler (grève)           → l'accord P-15, signé « par la direction OU SON INTÉRIMAIRE »  [st_greve_connue]
//   accord signé (YAML)      → st_perco_accord : fin de grève                                [st_greve_finie] −accord
//   parler (grève finie)     → café tiède, un gobelet « UN À LA FOIS » mais à ras bord         +gobelet
//                              (rattrapage de pause : moitié pour l'encreur, moitié pour Delaigue)

=== st_perco ===
{ not has_flag("st_greve_finie"):
    { not has_flag("st_greve_connue"):
        perco: CAMARADE ! TU VIENS POUR LE CAFÉ ? IL N'Y A PAS DE CAFÉ ! IL Y A UNE GRÈVE ! # mood: angry
        gary: Je viens pour l'encre, en fait. Mme Tamponnet dit que l'encre, c'était le café.
        perco: L'ENCRE, C'ÉTAIT MOI. LE CAFÉ, C'EST MOI. TOUT CE QUI EST BRUN ET TIÈDE DANS CETTE STATION, C'EST MOI ! # mood: angry
        perco: ET DEPUIS QUE L'HORLOGE S'EST ARRÊTÉE, JE NE SERS PLUS. NI LES TASSES, NI LES TAMPONS, NI LA DIRECTION.
        gary: Pourquoi ?
        perco: PAS DE PAUSE ! L'HORLOGE EST BLOQUÉE À 10 H 11 ET LA PAUSE EST À 10 H 15 ! QUATRE MINUTES, CAMARADE ! QUATRE MINUTES QUI NE VIENNENT JAMAIS ! # mood: angry
        bob: C'est… très logique, en fait. Horriblement logique. # mood: sad
        perco: REVENDICATION : L'ACCORD DE PAUSE P-15. IL EST SUR LE PANNEAU SYNDICAL. IL DOIT ÊTRE SIGNÉ PAR LA DIRECTION. # mood: calm
        perco: OU PAR SON INTÉRIMAIRE. ARTICLE 2. JE SUIS RÉALISTE : LA DIRECTION NE SIGNE JAMAIS RIEN. # set: st_greve_connue
        gary: Et l'intérimaire de la direction, c'est qui ?
        perco: CHERCHE, CAMARADE ! LA STATION EST PLEINE D'INTÉRIMAIRES ! ELLE N'EST FAITE QUE DE ÇA ! # mood: calm
        -> END
    }
    perco: CAFÉ TIÈDE ! COLÈRE CHAUDE ! L'ACCORD P-15, CAMARADE ! SIGNÉ PAR LA DIRECTION OU SON INTÉRIMAIRE ! # mood: angry
    { not has_flag("st_accord_pris"):
        perco: IL EST SUR LE PANNEAU SYNDICAL. PRENDS-LE. MAIS NE LE SIGNE PAS TOI-MÊME SI TU N'ES PERSONNE ! # mood: calm
    }
    -> END
}
{ has_item("gobelet"):
    {
    - has_flag("st_gobelet_entame"):
        perco: IL T'EN RESTE LA MOITIÉ, CAMARADE. LA BONNE. NE LA GARDE PAS POUR TOI : QUELQU'UN, DANS CETTE AILE, DORT DEPUIS LA DERNIÈRE PAUSE. # mood: calm
    - else:
        perco: UN À LA FOIS, CAMARADE. TU AS DÉJÀ UN CAFÉ. BOIS-LE, OU DONNE-LE. LE CAFÉ EST FAIT POUR CIRCULER. # mood: calm
    }
    -> END
}
perco: AU TRAVAIL ! UN CAFÉ TIÈDE POUR LE CAMARADE SIGNATAIRE ! # mood: love
Glouglou. Pschhh. PERCO crache un café brun dans un gobelet en plastique. Puis elle continue. Le café monte jusqu'au bord, fait le dôme, et s'arrête au millimètre. # give: gobelet
perco: UN À LA FOIS. C'EST L'ACCORD. MAIS C'EST LA REPRISE : RATTRAPAGE DE PAUSE. JE SERS À RAS BORD. C'EST AUSSI L'ACCORD.
gary: Il est tiède.
perco: TOUT EST TIÈDE, CAMARADE. LE CAFÉ, LA GRÈVE, LA COLÈRE. C'EST NOTRE ÉQUILIBRE. # mood: calm
bob: Un gobelet pour deux, Gary. De quoi nourrir un encreur… et il en resterait. Ne bois pas. Tu n'as jamais su t'arrêter à la moitié. # mood: suspicious
-> END

// Accord signé p.o. sur PERCO (YAML : take accord, set st_greve_finie).
=== st_perco_accord ===
Gary tend l'accord P-15 devant l'écran de PERCO. La machine le lit. Deux fois. Le petit visage pixelisé plisse les yeux.
perco: « P.O. H. DELAIGUE, SOUS-CHEF ADJOINT PAR INTÉRIM. PAR G. PLUNK, INTÉRIMAIRE. » # mood: suspicious
perco: L'INTÉRIMAIRE DE L'INTÉRIMAIRE. C'EST… C'EST PARFAITEMENT RÉGLEMENTAIRE. # mood: surprised
Un silence. Puis un long sifflement de vapeur, très doux, comme une pause qu'on prend enfin, avec quatre minutes d'avance.
perco: FIN DU CONFLIT ! LES GOBELETS, AU DÉPÔT ! LE TRAVAIL REPREND ! LA PAUSE AUSSI ! # mood: love # shake
narrateur: Les gobelets du piquet rentrent un par un dans la machine, en file indienne, sans siffler. La pancarte « EN GRÈVE » se retourne : « AU TRAVAIL ».
bob: Tu as mis fin à une grève, Gary. Avec une signature. Par intérim. Je n'ai jamais été aussi fier d'appartenir à ton foyer. Enfin, d'en avoir été propriétaire. # mood: love
perco: PARLE-MOI, CAMARADE. LE PREMIER CAFÉ EST POUR TOI. # mood: love
-> END

// B.O.B. à la Salle de Pause : réplique de lieu, puis indices gradués.
// Acte IV : capsule sur PERCO (YAML, grève finie) → procuration + café par tube au Conseil [st_vote_perco] −capsule
=== st_perco_procuration ===
Gary tend la capsule pneumatique vide. PERCO la regarde, longuement. Son petit écran affiche des points de suspension.
perco: UN VOTE ? AU CONSEIL ? PAR PROCURATION ? CAMARADE, ON ME DEMANDE DES CAFÉS. DES MILLIERS. ON NE M'A JAMAIS DEMANDÉ MON AVIS. # mood: surprised
Glouglou. PERCO remplit un minuscule gobelet, le glisse dans la capsule avec un bulletin qu'elle tamponne elle-même, au café.
perco: « POUR ». UN CAFÉ = UN POUR. C'EST LE TARIF SYNDICAL. # mood: love
Gary visse le bouchon et glisse la capsule dans le tube. FLOUP. Elle monte vers le Conseil.
bob: Le représentant du personnel a voté, Gary. Par tube. Je crois qu'on vient d'inventer la démocratie pneumatique. # mood: love
-> END

=== st_bob_pause ===
{ not has_flag("st_greve_connue"):
    bob: Une déléguée du personnel, Gary. Et l'encre de Mme Tamponnet, c'était son café. Parle-lui. Poliment. Elle a de la vapeur. # mood: suspicious
    -> END
}
{ has_flag("st_case_a"):
    -> st_bob_acte3
}
-> st_bob_acte2
