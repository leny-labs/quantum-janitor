// Chapitre 1 « La Station Bureaucratique » : indices B.O.B. de l'Acte II (docs/CHAPTER1.md §6.3),
// partagés par les trois bureaux (st_bob_archives / st_bob_tampons / st_bob_reclamations) et le couloir B.
// Une étape bloquante = un stitch : 1re demande vague, suivantes précises (compteur de lecture du stitch).
// Les stitches `tamponnet` et `vu` servent aussi à st_bob_acte3 (Tamponnet peut attendre la case A).

=== st_bob_acte2 ===
{ not has_flag("st_cherche_gary"):
    -> dossier
}
{ not has_flag("st_dossier_trouve"):
    -> garry
}
{ not has_flag("st_chatiere"):
    -> chatiere
}
{ not has_flag("st_liasse_prise"):
    -> derriere
}
{ not has_flag("st_papier"):
    -> papier
}
{ not has_flag("st_case_a"):
    -> case_a
}
// case A remplie : Acte III (st_bob_acte3 reprend Tamponnet, la grève, les cases B, D, C)
-> st_bob_acte3

= dossier
{ st_bob_acte2.dossier > 1:
    bob: Les Archives, Gary. Porte B-1. Demande ton dossier à M. Duplicata. Il te le demandera deux fois, mais demande-le. # mood: calm
- else:
    bob: Tu es classé animal, Gary. Pour être reclassé, il faut prouver que tu es quelqu'un. Et les preuves, ici, ça s'archive. # mood: suspicious
}
-> END

= garry
{ st_bob_acte2.garry > 1:
    bob: Ton badge, Gary. « GARRY ». Deux R. Glisse-le dans la fente du fichier : la machine cherchera ce qui est écrit, pas ce qui est juste. # mood: love
- else:
    bob: « Aucun Gary. » Évidemment. Gary, comment la RH t'appelle-t-elle, depuis toujours ? Le fichier ne lit pas les gens. Il lit les pièces. # mood: suspicious
}
-> END

= chatiere
{ st_bob_acte2.chatiere > 1:
    bob: Le Service des Réclamations, porte B-3. Derrière le comptoir, il y a du papier. Et au pied du comptoir, une chatière pour les animaux de service. Tu as une carapace. Sers-t'en. # mood: love
- else:
    bob: Pas de papier, pas de copie. Où est-ce qu'on stocke du papier que personne n'utilise jamais, Gary ? Là où personne ne va jamais réclamer. # mood: suspicious
}
-> END

= derriere
bob: Tu es derrière le comptoir des Réclamations, Gary. La liasse de formulaires vierges, sur l'étagère. Et la capsule, tant qu'on y est. # mood: calm
-> END

= papier
{ st_bob_acte2.papier > 1:
    bob: La liasse dans la photocopieuse des Archives, Gary. Le bac est vide. Il attend ça depuis la grève. # mood: love
- else:
    bob: Du papier vierge, une machine en panne de papier, un archiviste qui ne délivre que des copies. Je sens que les choses vont s'arranger, Gary. Pour une fois. # mood: calm
}
-> END

= case_a
{ st_bob_acte2.case_a > 1:
    bob: Ouvre ton inventaire, Gary. Les copies sur le formulaire. Case A, identité. Agrafe. # mood: love
- else:
    bob: Trois copies conformes de toi. Un formulaire avec une case « identité ». Gary, même moi, je vois où ça va. # mood: calm
}
-> END

= tamponnet
bob: Le Bureau des Tampons, Gary, porte B-2. La case B, c'est un tampon « VU ». Va voir qui tamponne, ici. # mood: calm
-> END

= vu
bob: Montre ton formulaire à Mme Tamponnet, Gary. Case A remplie : c'est le moment de demander le « VU ». Même si j'ai un mauvais pressentiment au sujet de l'encre. # mood: suspicious
-> END
