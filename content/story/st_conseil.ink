// Chapitre 1 « La Station Bureaucratique » : Salle du Conseil (st-conseil), docs/CHAPTER1.md §6.35–39.
// Mme Augustine Paraphe paraphe chaque phrase (« … A.P. ») et vote contre « par principe ».
//   parler                 → quorum de 3                                  [st_quorum_connu]
//   parler (quorum atteint)→ vote : POUR / abstention / CONTRE → AJOURNÉ  [st_vote_egalite]
//   tampon ANNULÉ (YAML)   → st_conseil_annule : avis favorable           [st_case_e]

=== st_paraphe ===
{ has_flag("st_case_e"):
    paraphe: Avis favorable, jeune homme. Le premier de ma présidence. Je l'ai paraphé deux fois. C'est la seule entorse que je me permettrai. A.P. # mood: love
    -> END
}
{ not has_flag("st_quorum_connu"):
    gary: Bonjour, madame la présidente. Il me faudrait l'avis du Conseil. Case E.
    paraphe: Un avis exige un vote. Un vote exige le quorum. Le quorum est de trois membres. A.P.
    gary: Et vous êtes combien ?
    paraphe: Une. Depuis 1985. Le représentant du personnel est en grève, ou à la pause, ce qui revient au même. Le membre honoraire n'a plus été vu depuis le déménagement. A.P. # mood: sad
    paraphe: Consultez le tableau des membres, si vous voulez vous rendre utile. Personne ne le lit jamais. A.P. # set: st_quorum_connu
    bob: Trois membres, Gary. Elle, quelqu'un du personnel, et un honoraire. Il y a des gens, ici, que tu connais. Et une plante. # mood: suspicious
    -> END
}
{ not has_flag("st_ficus") || not has_flag("st_vote_perco"):
    paraphe: Le quorum, jeune homme. Je compte. A.P.
    { has_flag("st_ficus"):
        paraphe: Membre honoraire : présent. M. Ficus, toujours aussi discret. A.P.
    - else:
        paraphe: Membre honoraire : absent. Son siège attend. A.P.
    }
    { has_flag("st_vote_perco"):
        paraphe: Représentant du personnel : présent par procuration. Et par café. A.P.
    - else:
        paraphe: Représentant du personnel : absent. On ne quitte pas la Salle de Pause. Mais on peut voter par tube, paraît-il. Personne ne l'a jamais fait. A.P.
    }
    paraphe: Quorum non atteint. Séance suspendue. Elle reprendra quand elle pourra. A.P.
    -> END
}
{ not has_flag("st_vote_egalite"):
    paraphe: Quorum atteint. Pour la première fois depuis 1985. Je… Hum. Séance ouverte. A.P. # mood: surprised
    paraphe: Ordre du jour : avis sur le dossier « PLUNK, GARRY », Formulaire B-7/12, demande de restitution d'un bien trouvé. Nous votons. A.P.
    paraphe: Représentant du personnel, par procuration : « POUR ». Le bulletin est taché de café. C'est conforme. A.P.
    paraphe: Membre honoraire : … M. Ficus ? … Abstention. Il s'abstient toujours. C'est sa grande force. A.P.
    paraphe: Présidente : « CONTRE ». Par principe. A.P.
    gary: Par principe de quoi ?
    paraphe: Personne ne m'écoute quand je vote pour. Alors je vote contre. Au moins, ça se remarque. A.P. # mood: sad
    paraphe: Une voix pour, une contre, une abstention. Égalité. Avis AJOURNÉ. Prochaine séance : quand elle pourra. A.P. # set: st_vote_egalite
    bob: Elle vote contre et personne n'a jamais annulé son vote, Gary. Tu as un tampon que personne n'utilise. Je dis ça, je ne dis rien. # mood: suspicious
    -> END
}
paraphe: Égalité. Ajourné. Ce n'est pas un refus, jeune homme. C'est pire : c'est une attente. A.P. # mood: sad
-> END

// Tampon ANNULÉ sur le bulletin « CONTRE » de Paraphe (YAML : set st_case_e).
=== st_conseil_annule ===
Gary sort le tampon « ANNULÉ » de Mme Tamponnet. Il ouvre l'urne, prend le bulletin « CONTRE » de la présidente, et l'abat dessus. CLONK. Un grand « ANNULÉ » rouge, parfaitement droit.
paraphe: …Vous avez annulé mon vote. # mood: surprised
gary: Ici, on n'annule jamais rien. Donc ça doit être valable.
Un très long silence. Mme Paraphe regarde son bulletin. Puis Gary. Puis le bulletin.
paraphe: Quarante et un ans que je vote contre. Personne n'avait jamais lu mon bulletin. Vous l'avez lu. Assez pour l'annuler. A.P. # mood: love
paraphe: Une voix pour, une abstention, une annulation valable. Avis… FAVORABLE. # shake
Elle prend le formulaire, trempe sa plume, et paraphe la case E. Deux fois. Sa main tremble un peu.
paraphe: C'est la première fois qu'on m'écoute voter. Même contre moi-même. Merci, jeune homme. A.P.
bob: Cinq cases sur cinq, Gary. Je ne pensais pas vivre ça. Je ne pensais pas vivre, en général. # mood: love
-> END

// B.O.B. au Conseil : indices gradués (Acte IV).
=== st_bob_conseil ===
-> st_bob_acte4
