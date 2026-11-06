// Chapitre 1 « La Station Bureaucratique » : le Guichet d'Accueil, joué en salle (st-guichet).
// Mme Guichard derrière l'hygiaphone : fermé (10 h 11), formulaire B-7/12 « au guichet ».
// Après D3 (st_deduit_formulaire) : l'article 47bis → demande verbale → st_acces_aile_b (porte de l'Aile B).
// Fin de l'Acte I (Accueil) = le B-7/12 trouvé dans le Couloir Infini B (st_formulaire, st_couloir_b.ink).

=== st_guichard ===
// 10 h 12 (éclat sur l'horloge après la déduction du carnet) : le guichet est ouvert
{ has_flag("st_guichet_ouvert"):
    -> st_guichard_ouvert
}
{ not has_flag("st_guichard_ferme"):
    Derrière la vitre, Mme Guichard tend un élastique entre deux doigts. Elle ne lève pas les yeux.
    guichard: C'est fermé.
    { has_item("ticket_9848"):
        gary: J'ai un ticket. Le 9 848. C'est le suivant.
    - else:
        gary: Bonjour. Je voudrais...
    }
    guichard: C'est pas moi qui décide. C'est l'horloge. Revenez à 10 h 12. Avec le Formulaire B-7/12. Rempli. Tamponné. Signé. En trois exemplaires.
    bob: Et le formulaire, on l'obtient où, madame ? # mood: calm
    guichard: Au guichet.
    Le rideau au-dessus d'elle tressaille de deux centimètres. CLONK. Puis on entend l'élastique claquer. # shake
    gary: Le formulaire est au guichet. Le guichet est fermé. Et le formulaire doit être rempli pour ouvrir le guichet.
    bob: En trois exemplaires, Gary. Le désespoir aussi. # mood: sad # set: st_guichard_ferme
    -> END
}
guichard: C'est toujours fermé.
* [« Il est quelle heure, exactement ? »]
    gary: Il est quelle heure, exactement ?
    guichard: 10 h 11. Comme d'habitude.
    gary: Depuis combien de temps ?
    guichard: Depuis que je suis là. Et je suis là depuis toujours. Enfin, depuis 1985. C'est pareil. # set: st_voit_horloge
* [« Le formulaire B-7/12, s'il vous plaît. »]
    gary: Le formulaire B-7/12. S'il vous plaît. J'ai dit s'il vous plaît.
    guichard: Le formulaire se retire au guichet. Le guichet ouvre à 10 h 12. Il est 10 h 11.
    gary: Et si l'horloge avançait ?
    guichard: L'horloge n'avance pas. Ce n'est pas son rôle. Son rôle, c'est d'être exacte.
    bob: Elle a dit « n'avance pas », Gary. Pas « ne peut pas ». Retiens la nuance. # mood: suspicious
- -> END

=== st_guichard_ticket ===
Gary plaque le ticket 9 848 contre la vitre, bien à plat, chiffres visibles.
guichard: C'est le suivant.
gary: Oui ! C'est moi, le suivant !
guichard: C'est le suivant de M. Patience. Vous êtes un animal. Les animaux passent après les usagers. Article 12.
{ has_flag("st_laisse"):
    bob: Il est accompagné, madame. Je suis son propriétaire. J'ai la laisse. # mood: love
    guichard: Alors c'est vous qui passez. À 10 h 12. Avec le formulaire. Et lui, il attend dehors, attaché à l'horloge.
}
guichard: De toute façon, l'afficheur est au 9 847. Je ne prends pas d'avance. On m'a déjà fait le coup en 1985.
gary: Et le formulaire ?
guichard: Au guichet. # set: st_guichard_ticket
-> END

// Guichet ouvert (st_guichet_ouvert) : elle prend le ticket… et le B-7/12 est en rupture.
// Pose st_guichard_rupture (indice du carnet → déduction « Formulaire B-7/12 requis »).
=== st_guichard_ouvert ===
{ has_flag("st_formulaire"):
    -> st_guichard_formulaire
}
{ has_flag("st_acces_aile_b"):
    guichard: Votre demande verbale au titre de l'article 47bis est enregistrée. Elle est valable jusqu'à 10 h 14. Il est 10 h 12. Depuis tout à l'heure.
    bob: Va, Gary. La porte de l'Aile B t'attend. Moi aussi, mais je suis plus patient. # mood: calm
    -> END
}
{ has_flag("st_deduit_formulaire"):
    -> st_guichard_47bis
}
{ has_flag("st_guichard_rupture"):
    guichard: Toujours en rupture. Le réassort est prévu. Revenez au réassort.
    bob: Elle a dit « prévu », Gary. Comme le guichet 2. # mood: sad
    -> END
}
Le rideau est en haut. Mme Guichard a posé sa balle d'élastiques sur une pile de dossiers. Elle regarde l'afficheur, puis Gary.
guichard: 9 848 ?
{ has_item("ticket_9848"):
    Gary glisse le ticket sous la vitre. Elle le prend du bout des doigts, le retourne, le tamponne « VU » et le rend. CLONK. # shake
- else:
    gary: C'est nous. Le ticket est dans ma poche. Quelque part.
}
guichard: Les animaux s'adressent au propriétaire.
bob: C'est moi. Bonjour, madame. Je voudrais un Formulaire B-7/12, s'il vous plaît. # mood: love
guichard: Le B-7/12. Bien sûr.
Elle ouvre un tiroir. Puis un deuxième. Puis le tiroir caché dans le deuxième tiroir.
guichard: En rupture.
gary: En rupture ? C'est du papier !
guichard: En rupture de stock depuis 1985. Le réassort est prévu.
guichard: Le dernier exemplaire est parti dans l'Aile B. Rien ne revient jamais de l'Aile B. Et il faut le formulaire pour y entrer.
bob: Donc il faut le formulaire pour aller chercher le formulaire. # mood: surprised
guichard: Voilà. Vous avez compris le règlement. C'est rare. # set: st_guichard_rupture
-> END

=== st_bob_guichet ===
{ not has_flag("st_guichard_ferme"):
    bob: C'est elle, Gary. La personne qui décide. Enfin, la personne qui dit que ce n'est pas elle qui décide. # mood: surprised
    bob: Parle-lui. Montre-lui le ticket. Et sois poli : elle a l'éternité devant elle, et nous, seulement une minute. # mood: calm
    -> END
}
{ has_item("ticket_9848") && not has_flag("st_guichard_ticket"):
    bob: Tu ne lui as pas montré le ticket, Gary. Le 9 848. Plaque-le contre la vitre. Les fonctionnaires respectent les numéros plus que les gens. # mood: calm
    -> END
}
{ not has_flag("st_voit_horloge"):
    bob: Tout ici tient à une minute, Gary. Regarde l'horloge. C'est elle, la vraie directrice du guichet. # mood: suspicious
    -> END
}
{ not has_flag("st_horloge_tremble"):
    bob: Il est très improbable que ce guichet ouvre un jour. Tu as quelque chose d'improbable sur toi ? Dans une poche ? Qui brille ? # mood: suspicious
    -> END
}
// indices gradués du carnet de déduction (touche C) : D1 puis D2, puis l'éclat au bon moment
{ not has_flag("st_deduit_minute"):
    bob: L'horloge a tremblé, Gary. Elle n'est pas prête parce que nous ne savons pas ce qu'on lui demande. # mood: sad
    bob: Ouvre ton carnet. Mets l'horloge à côté des horaires. Les fonctionnaires appellent ça « faire le rapprochement ». Moi, j'appelle ça lire. # mood: calm
    -> END
}
{ not has_flag("st_deduit_horloge"):
    bob: Une minute manquante et une horloge qui a peur de l'éclat, Gary. Dans ton carnet, ces deux-là ont des choses à se dire. # mood: suspicious
    -> END
}
{ not has_flag("st_guichet_ouvert"):
    bob: Tu sais ce qu'il manque : une minute. Tu as de l'improbable en poche. Vise l'horloge, pile quand la trotteuse hésite. # mood: love
    -> END
}
{ not has_flag("st_guichard_rupture"):
    bob: Le guichet est ouvert, Gary ! Parle-lui avant 10 h 14 ! Montre-lui le ticket ! Vite, mais poliment ! # mood: surprised
    -> END
}
{ not has_flag("st_deduit_formulaire"):
    bob: Note ça au carnet, Gary : un guichet ouvert et un formulaire en rupture. Rapproche-les. Ça va te faire de la peine, mais c'est instructif. # mood: suspicious
    -> END
}
{ not has_flag("st_acces_aile_b"):
    bob: Le formulaire est derrière la porte qui exige le formulaire. Je n'ai jamais été aussi fier de cette Station. # mood: love
    bob: Mais un règlement qui fabrique une boucle prévoit toujours un article pour en sortir. Sinon, personne ne pourrait le respecter. Demande à Mme Guichard. Elle connaît les articles par cœur. Même ceux qui n'existent pas. # mood: suspicious
    -> END
}
{ not has_flag("st_formulaire"):
    bob: Article 47bis, Gary. Demande verbale. La porte de l'Aile B ne peut plus rien te refuser. Enfin, elle peut. Mais elle n'a plus le droit. # mood: love
    -> END
}
bob: On a le B-7/12, Gary. Mme Guichard ne s'en remettra pas. Moi non plus. # mood: love
-> END

// Article 47bis : exception en cas de rupture d'un formulaire requis pour accéder au stock dudit formulaire.
=== st_guichard_47bis ===
gary: Madame. Le B-7/12 est en rupture. Le dernier est dans l'Aile B. Et l'Aile B exige le B-7/12. C'est une boucle.
guichard: C'est un règlement.
gary: C'est une boucle réglementaire.
Mme Guichard repose sa balle d'élastiques. Elle ouvre un classeur épais comme un annuaire, l'humecte d'un doigt, et tourne exactement quarante-sept pages. Puis une demi-page.
guichard: Article 47bis. « En cas de rupture d'un formulaire requis pour accéder au stock dudit formulaire, l'usager peut formuler une demande verbale. »
bob: Une demande verbale ? Sans papier ? Ici ? # mood: surprised
guichard: Verbale. Mais enregistrée. Je l'écris.
gary: Alors... je demande l'accès à l'Aile B. Verbalement. S'il vous plaît.
Elle note la phrase sur un formulaire de demande verbale. Le formulaire de demande verbale, lui, n'est pas en rupture. CLONK. Tampon. # shake
guichard: Demande verbale 47bis enregistrée. Le lecteur de l'Aile B est prévenu. Vous avez jusqu'à 10 h 14.
gary: Et après 10 h 14 ?
guichard: Il n'est jamais 10 h 14.
bob: Gary. Elle vient de nous rendre service. En quarante et un ans, c'est la première fois. Ne dis rien. Avance. # mood: love # set: st_acces_aile_b
-> END

// B-7/12 trouvé dans le couloir (st_formulaire) : Mme Guichard constate.
=== st_guichard_formulaire ===
// Acte IV (docs/CHAPTER1.md §6.42) : dépôt du dossier complet, à 10 h 12, après le refus de SYLVIE
{ has_flag("st_dossier_depose"):
    guichard: Votre dossier est parti par tube. C'est pas moi qui décide, maintenant. C'est la Direction. Bon courage.
    -> END
}
{ has_flag("st_case_e"):
    { not has_flag("st_sylvie_refuse"):
        guichard: Un dossier complet ? Cinq cases ? Ça monte à la Direction. Par l'ascenseur. Pas par moi. C'est pas moi qui décide.
        -> END
    }
    { not has_flag("st_guichet_ouvert"):
        guichard: C'est fermé. Il est 10 h 11. Revenez à 10 h 12. Vous savez faire, il paraît.
        -> END
    }
    -> st_guichard_depot
}
{ has_flag("st_case_a"):
    Gary plaque le formulaire contre la vitre. Mme Guichard compte les cases remplies, du bout d'un trombone.
    guichard: C'est pas complet. Revenez quand c'est complet. Et à 10 h 12. Les deux. C'est pas moi qui décide.
    -> END
}
Gary plaque le Formulaire B-7/12 contre la vitre. Mme Guichard le regarde longtemps. Elle enlève ses lunettes. Elle les remet.
guichard: Le dernier B-7/12. Il est revenu de l'Aile B.
guichard: Rien ne revient jamais de l'Aile B.
bob: Nous, si. Avec le formulaire. Et le ficus. # mood: love
guichard: Remplissez-le. Tamponnez-le. Faites-le signer. En trois exemplaires. Les bureaux de l'Aile B s'en chargent. Dès que le règlement le permettra.
-> END

// Dépôt du dossier complet au guichet (étape 42) : tube pneumatique vers la Direction.
=== st_guichard_depot ===
Gary glisse le Formulaire B-7/12 dans la fente sous l'hygiaphone. Épais comme un vrai dossier, il passe de justesse. Mme Guichard lève les yeux. Pour la première fois en quarante et un ans.
guichard: Cinq cases. Rempli. Tamponné. Signé. En trois exemplaires. Avec avis du Conseil.
guichard: …À 10 h 12.
Elle prend un tampon dans son tiroir. Un tampon « REÇU ». Il n'avait jamais servi non plus. CLONK.
guichard: Dépôt enregistré. Le dossier part à la Direction. # take: formulaire # set: st_dossier_depose
Elle roule le formulaire dans une capsule et la glisse dans le tube derrière elle. FLOUP.
guichard: C'est pas moi qui décide. Mais c'est moi qui ai envoyé. Ça compte un peu, quand même.
bob: Elle a levé les yeux, Gary. Pour toi. Je crois que c'est la plus haute distinction de la Station. # mood: love
-> END
