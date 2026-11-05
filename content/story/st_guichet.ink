// Chapitre 1 « La Station Bureaucratique » : le Guichet d'Accueil, joué en salle (st-guichet).
// Mme Guichard derrière l'hygiaphone : fermé (10 h 11), formulaire B-7/12 « au guichet ».
// Fin provisoire du stub = la première conversation (flag st_guichard_ferme) ; plus d'EndScene.
// `st_stub_fin` (st_fin.ink) reste l'endKnot nominal du ch.1 mais n'est plus joué par la porte.

=== st_guichard ===
// 10 h 12 (éclat sur l'horloge après la déduction du carnet) : le guichet est ouvert
{ has_flag("st_guichet_ouvert"):
    -> st_guichard_ouvert
}
{ not has_flag("st_guichard_ferme"):
    Derrière la vitre, Mme Guichard mâche. Elle ne lève pas les yeux.
    guichard: C'est fermé.
    { has_item("ticket_9848"):
        gary: J'ai un ticket. Le 9 848. C'est le suivant.
    - else:
        gary: Bonjour. Je voudrais...
    }
    guichard: C'est pas moi qui décide. C'est l'horloge. Revenez à 10 h 12. Avec le Formulaire B-7/12. Rempli. Tamponné. Signé. En trois exemplaires.
    bob: Et le formulaire, on l'obtient où, madame ? # mood: calm
    guichard: Au guichet.
    Le rideau au-dessus d'elle tressaille de deux centimètres. CLONK. Puis on l'entend reprendre sa bouchée. # shake
    gary: B.O.B. Garde le ticket de douane et M. Ficus. J'ai le pressentiment qu'on en aura besoin. Beaucoup plus tard.
    bob: En trois exemplaires, Gary. Le pressentiment aussi. # mood: sad # set: st_guichard_ferme
    -> END
}
guichard: C'est toujours fermé.
* [« Il est quelle heure, exactement ? »]
    gary: Il est quelle heure, exactement ?
    guichard: 10 h 11. Comme d'habitude.
    gary: Depuis combien de temps ?
    guichard: Depuis que je suis là. Et je suis là depuis toujours. Enfin, depuis 1985. C'est pareil. # set: st_voit_horloge
* [« Et ce sandwich ? »]
    gary: Pardon, mais... ce sandwich. Il est d'aujourd'hui ?
    guichard: Il est de ce matin.
    gary: Quel matin ?
    guichard: Le même.
* [« Le formulaire B-7/12, s'il vous plaît. »]
    gary: Le formulaire B-7/12. S'il vous plaît. J'ai dit s'il vous plaît.
    guichard: Le formulaire se retire au guichet. Le guichet ouvre à 10 h 12. Il est 10 h 11.
    gary: Et si l'horloge avançait ?
    guichard: L'horloge n'avance pas. Ce n'est pas son rôle. Son rôle, c'est d'être exacte.
    bob: Elle a dit « n'avance pas », Gary. Pas « ne peut pas ». Retiens la nuance. # mood: suspicious
* [« Bon appétit. »]
    gary: Bon appétit, madame.
    guichard: ... # mood: calm
    Elle s'arrête de mâcher. Elle le regarde. Pour la première fois en quarante et un ans, quelqu'un lui a souhaité bon appétit.
    guichard: C'est fermé quand même.
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
{ has_flag("st_guichard_rupture"):
    guichard: Toujours en rupture. Le réassort est prévu. Revenez au réassort.
    bob: Elle a dit « prévu », Gary. Comme le guichet 2. # mood: sad
    -> END
}
Le rideau est en haut. Mme Guichard a posé son sandwich sur une pile de dossiers. Elle regarde l'afficheur, puis Gary.
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
bob: Le formulaire est derrière la porte qui exige le formulaire. Je n'ai jamais été aussi fier de cette Station. # mood: love
bob: La suite, c'est par l'Aile B. Mais pas aujourd'hui. Aujourd'hui, on a ouvert un guichet. Personne n'avait fait ça depuis 1985. # mood: calm
-> END
