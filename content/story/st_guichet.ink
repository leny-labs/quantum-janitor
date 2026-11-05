// Chapitre 1 « La Station Bureaucratique » : le Guichet d'Accueil, joué en salle (st-guichet).
// Mme Guichard derrière l'hygiaphone : fermé (10 h 11), formulaire B-7/12 « au guichet ».
// Fin provisoire du stub = la première conversation (flag st_guichard_ferme) ; plus d'EndScene.
// `st_stub_fin` (st_fin.ink) reste l'endKnot nominal du ch.1 mais n'est plus joué par la porte.

=== st_guichard ===
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
bob: L'horloge a tremblé, Gary. Elle n'est pas prête. Le formulaire non plus. Nous non plus. # mood: sad
bob: La suite, c'est par l'horloge, puis par l'Aile B. Mais pas aujourd'hui. Aujourd'hui, on a un ticket, une plante et un sandwich en face de nous. C'est déjà beaucoup. # mood: love
-> END
