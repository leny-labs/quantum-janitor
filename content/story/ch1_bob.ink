// Chapitre 1 : B.O.B. compagnon, système d'indices (une branche par étape de docs/CHAPTER1.md).

=== ch1_bob ===
{
- not has_flag("ch1_audience"):
    bob: La grosse dame avec la couronne veut te parler, Gary. Enfin, « veut ». Elle ordonne. C'est sa façon de dire bonjour. # mood: calm
- not has_flag("ch1_sait_signe"):
    bob: « Le Signe ». La Reine a dit que c'était écrit dans la Galerie des Offrandes. Regarde les fresques. Moi je regarde les miettes. # mood: calm
- not has_flag("ch1_badge_refuse") && not has_flag("ch1_badge_propre"):
    bob: Le Signe aux deux R. Ton badge, Gary. Montre-le au Grand Scribe. Avec assurance. Enfin, avec ce que tu as. # mood: suspicious
- not has_flag("ch1_badge_propre") && not has_flag("ch1_josiane_mouillee"):
    bob: Ton badge sent le thon. C'est ma faute. Il faudrait le frotter. Josiane, un peu d'eau... Le bassin des ablutions, par exemple. # mood: sad
- not has_flag("ch1_badge_propre"):
    bob: Josiane est trempée, le badge sent le poisson. Frotte l'un avec l'autre, Gary. C'est ton métier. # mood: suspicious
- not has_flag("ch1_signe_reconnu"):
    bob: Le Signe brille. Va le montrer au Scribe avant qu'il ne se remette à sentir quoi que ce soit. # mood: calm
- not has_flag("ch1_seau_rendu"):
    bob: Le Scribe t'a reconnu. La Reine te doit un seau. Va le réclamer. Poliment. Elle a des mandibules. # mood: suspicious
- not has_flag("ch1_seau_miettes"):
    bob: La foule bloque le Temple. « Sauf pour le goûter », ils ont dit. Il y a un grenier plein de miettes, et toi, tu as un seau. Je dis ça par pur altruisme. # mood: love
- not has_flag("ch1_foule_dispersee"):
    bob: Un seau plein de miettes. Donne-le à la foule, Gary. Avant que je ne le fasse moi-même. Avec ma bouche. # mood: angry
- not has_flag("ch1_voit_eclat"):
    bob: Le Temple de l'Ancien Couloir, c'est notre couloir C. Regarde le distributeur. Il coince toujours quelque chose. # mood: calm
- not has_flag("ch1_eclat_tombe"):
    bob: L'éclat est coincé derrière la spirale. Comme le sandwich. Tu sais ce qui marche, Gary. Le manche. La trappe. Josiane. Je ne vois aucun risque. Je ne vois jamais rien venir, remarque. # mood: suspicious
- not has_flag("ch1_seau_plein"):
    bob: L'éclat crache de l'improbabilité, et Josiane n'est plus là pour personne. Il faut le calmer. Un seau. De l'eau. Le bassin de la galerie. De l'eau bénite. Ça ne peut pas faire de mal à une faille. Je crois. # mood: calm
- not has_flag("ch1_eclat_stabilise"):
    bob: Ton seau est plein, l'éclat saigne de l'improbabilité. Tu sais ce qu'il te reste à faire. Tu l'as déjà fait une fois. C'est comme ça qu'on est arrivés ici. # mood: sad
- else:
    bob: L'éclat est contenu, ton seau tient la faille. Apporte l'éclat à la Reine, Gary. Et demande-lui un reçu. Pour la RH. # mood: calm
}
+ [« Raconte-moi quelque chose de déprimant. »]
    gary: Raconte-moi quelque chose de déprimant, B.O.B.
    bob: {~Les cafards vivent six mois. Et ils ont l'air plus épanouis que moi.|Ils m'appellent « le Grand Avaleur ». Ils me vénèrent. C'est la première fois qu'on m'aime. C'est pour mon tube digestif.|La galaxie appartient aux cafards. Et moi, je n'ai même pas de bac à poussière à mon nom.|Quelque part dans le multivers, il y a 4 095 autres B.O.B. Et ils sont sûrement tous aussi tristes. Statistiquement, ça me console.} # mood: sad
    -> END
+ [« Merci, B.O.B. »]
    gary: Merci, B.O.B.
    bob: De rien. Ici, « rien » se dit « offrande ». Je fais des offrandes, maintenant. # mood: calm
    -> END
