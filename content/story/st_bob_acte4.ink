// Chapitre 1 « La Station Bureaucratique » : indices B.O.B. de l'Acte IV « Le Conseil et la Restitution »
// (docs/CHAPTER1.md §6.3, §6.34–46). 1re demande vague, suivantes précises.

=== st_bob_acte4 ===
{ not has_flag("st_ascenseur_conseil"):
    -> ascenseur
}
{ not has_flag("st_quorum_connu"):
    -> quorum
}
{ not has_flag("st_ficus"):
    -> ficus
}
{ not has_flag("st_vote_perco"):
    -> perco
}
{ not has_flag("st_vote_egalite"):
    -> vote
}
{ not has_flag("st_case_e"):
    -> egalite
}
{ not has_flag("st_ascenseur_direction"):
    -> direction
}
{ not has_flag("st_sylvie_refuse"):
    -> sylvie
}
{ not has_flag("st_dossier_depose"):
    -> depot
}
{ not has_flag("st_coffre_ouvert"):
    -> coffre
}
{ not has_flag("st_eclat2"):
    -> fusion
}
{ not has_flag("st_amende"):
    -> fourriere
}
{ not has_flag("st_vaisseau_libere"):
    -> amende
}
bob: Le permis sur la capsule, Gary. On rentre. Enfin, on part. Avec toi, c'est toujours un peu la même chose. # mood: love
-> END

= ascenseur
bob: Quatre cases sur cinq, Gary. L'Ascenseur à Formulaires, au fond du couloir. Glisse le formulaire dans la fente. # mood: calm
-> END

= quorum
bob: Le Conseil, Gary. Parle à Mme Paraphe. Elle a l'air de quelqu'un qui attend qu'on lui parle depuis longtemps. # mood: calm
-> END

= ficus
{ st_bob_acte4.ficus > 1:
    bob: M. Ficus, Gary. Membre honoraire. Pose-le sur le siège du membre honoraire, au Conseil. # mood: love
- else:
    bob: Lis le tableau des membres. Le troisième, tu le connais. Tu l'as dans ta poche depuis une heure. # mood: suspicious
}
-> END

= perco
{ st_bob_acte4.perco > 1:
    bob: La capsule pneumatique des Réclamations, Gary. Donne-la à PERCO, en Salle de Pause : elle votera par tube. La grève est finie, elle a le droit. # mood: love
- else:
    bob: Le représentant du personnel ne quitte jamais la Salle de Pause. Mais il y a des tubes partout, ici. Et tu as une capsule vide depuis l'Acte II. # mood: suspicious
}
-> END

= vote
bob: Le quorum est atteint, Gary. Parle à Mme Paraphe : qu'elle ouvre la séance. # mood: calm
-> END

= egalite
{ st_bob_acte4.egalite > 1:
    bob: Le tampon ANNULÉ, Gary. Sur son bulletin, dans l'urne. « On n'annule jamais rien »… donc c'est valable. # mood: love
- else:
    bob: Elle vote contre. Personne n'a jamais annulé son vote. Tu as un tampon que personne n'utilise. # mood: suspicious
}
-> END

= direction
bob: Cinq cases, Gary. Retourne à l'ascenseur et glisse le formulaire. Il saura où aller. # mood: love
-> END

= sylvie
bob: La Direction, Gary. Parle à SYLVIE. En personne. Enfin, en écrans. # mood: calm
-> END

= depot
{ st_bob_acte4.depot > 1:
    bob: L'horloge du Guichet d'Accueil, Gary. L'éclat, pile quand la trotteuse hésite. Puis le formulaire à Mme Guichard. # mood: love
- else:
    bob: Dépôt au guichet. À 10 h 12. Tu l'as déjà fait, Gary. Tu as quelque chose d'improbable sur toi. Toujours le même. # mood: suspicious
}
-> END

= coffre
bob: Le dossier est parti par tube, Gary. Remonte à la Direction et parle à SYLVIE. # mood: calm
-> END

= fusion
bob: « Prouvez que l'objet est à vous. » Ton éclat ronronne, Gary. Montre-le au coffre. Ils se connaissent. # mood: love
-> END

= fourriere
{ st_bob_acte4.fourriere > 1:
    bob: La fourrière, par le sas. Le ticket de douane à M. Sabot, avec le permis. Tu l'as gardé depuis le tout début, Gary. # mood: love
- else:
    bob: Un permis, Gary. Et notre capsule est à la fourrière depuis l'arrivée. M. Sabot voulait deux choses. Tu les as. # mood: calm
}
-> END

= amende
bob: Une amende, Gary. « Toute amende tamponnée par le Bureau des Tampons fait foi. » Tu as un tampon. Il n'a servi qu'une fois. # mood: suspicious
-> END
