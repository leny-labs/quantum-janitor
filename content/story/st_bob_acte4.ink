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

// sans la déduction d_ficus (carnet) : on pointe le tableau, puis le carnet ; le geste ensuite
= ficus
{ has_flag("st_deduit_ficus"):
    bob: M. Ficus, Gary. Membre honoraire. Pose-le sur le siège du membre honoraire, au Conseil. # mood: love
    -> END
}
{ not has_flag("st_voit_tableau"):
    bob: Lis le tableau des membres, Gary. Personne ne le lit jamais. Toi, tu lis tout : c'est ton défaut, c'est notre chance. # mood: suspicious
    -> END
}
-> ficus_carnet

= ficus_carnet
{ st_bob_acte4.ficus_carnet > 1:
    bob: Le quorum, et les noms au mur, Gary. Dans ton carnet. Le troisième membre, tu le connais. Tu l'as dans ta poche depuis une heure. # mood: love
- else:
    bob: Elle compte ses membres, Gary. Le tableau les nomme. Toi, tu notes. Il y a un carnet qui attend qu'on s'en serve. # mood: suspicious
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

// sans la déduction d_annule (carnet) : on pointe le carnet ; le geste ensuite
= egalite
{ has_flag("st_deduit_annule"):
    bob: Le tampon ANNULÉ, Gary. Sur son bulletin, dans l'urne. « On n'annule jamais rien »… donc c'est valable. # mood: love
    -> END
}
{ st_bob_acte4.egalite > 1:
    bob: L'égalité, Gary, et ce que t'a confié Mme Tamponnet. Dans ton carnet, côte à côte. Laisse-les voter. # mood: love
- else:
    bob: Elle vote contre. Personne n'a jamais annulé son vote. Tu notes tout, Gary : relis-toi. # mood: suspicious
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
    bob: Redescends au Guichet d'Accueil, Gary. Le formulaire à Mme Guichard. Il y est encore 10 h 12. Il y sera toujours 10 h 12. # mood: love
- else:
    bob: Elle ne reçoit que les tubes, Gary. Et les tubes, ça part d'en bas. # mood: suspicious
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
