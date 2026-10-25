// B.O.B. — Balayeur Organique Bienveillant. Le dialogue à choix qui pose le ton.

=== bob ===
{
- has_flag("bob_avoue_badge"):
    -> attente
- else:
    -> premiere
}

= premiere
bob: (long soupir électronique) Bonjour, Gary. Encore une journée. Encore de la poussière.
bob: Elle revient toujours, tu sais. La poussière. Comme le désespoir. Comme les lundis.
* [« Salut B.O.B. Tu n'aurais pas vu mon badge ? »]
    gary: Salut, B.O.B. Dis, tu n'aurais pas vu mon badge ? Il était juste là.
    bob: Ton badge. Oui. Je l'ai vu. De très près. De l'intérieur, même.
    -> confession
* [« Courage, mon vieux. Tu fais un boulot formidable. »]
    gary: Courage, mon vieux. Tu fais un boulot formidable, tu sais.
    bob: ...Personne ne m'avait jamais dit ça.
    bob: Tu mens. Mais c'est le plus beau mensonge qu'on m'ait fait. Alors je vais te dire la vérité, en échange.
    -> confession
* [« Toi. L'aspirateur. Tu as bouffé mon badge. »]
    gary: Toi. L'aspirateur. Tu as bouffé mon badge, hein ?
    bob: Accusation sans preuve. Je vais pleurer.
    bob: Je n'ai pas de canaux lacrymaux, alors je vais juste... vibrer tristement.
    bob: (il vibre tristement)
    bob: ...D'accord. C'est moi.
    -> confession

= confession
bob: Cette nuit, j'ai aspiré un petit rectangle de plastique. Il y avait ton visage dessus. Et « GARRY », avec deux R.
bob: J'ai trouvé ça tellement triste que je l'ai gardé. Pour te protéger. Ou pour me sentir moins seul. Les deux sont tristes.
gary: Rends-le-moi, B.O.B. SYLVIE va me retirer cent pour cent de mon salaire par minute.
bob: Je ne peux pas. Mon bac à poussière est verrouillé par un protocole anti-recrachage. Brevet déposé.
bob: Il faudrait que j'avale quelque chose de vraiment... indigeste. Quelque chose de si mauvais que mon système le rejetterait. Avec tout le reste. # set: bob_avoue_badge
gary: Quelque chose d'indigeste. Sur une station spatiale. Ça devrait se trouver.
-> menu

= attente
bob: Ah, Gary. Tu as trouvé quelque chose d'immonde pour moi ? Non ? Évidemment. Personne ne pense à moi.
-> menu

= menu
* [Demander ce qu'est un Réacteur d'Improbabilité]
    gary: B.O.B., c'est quoi, exactement, un Réacteur d'Improbabilité ?
    bob: Il transforme l'improbable en énergie. Par exemple : il est très improbable que tu sois encore employé ici.
    bob: Rien que ça, ça alimente l'éclairage du pont C.
    -> menu
* [Lui demander s'il va bien]
    gary: Et toi, ça va, sinon ?
    bob: Je suis un aspirateur qui a pris conscience de sa propre existence en aspirant un manuel de philosophie existentialiste. Tome 2.
    bob: Je n'ai jamais trouvé le tome 1. C'est peut-être ça, mon problème.
    -> menu
* [Demander où trouver quelque chose d'indigeste]
    gary: Tu as une idée de truc vraiment indigeste ?
    bob: Il y a un distributeur dans le couloir. Il contient un seul sandwich, depuis l'inauguration de la station.
    bob: Personne ne l'a jamais acheté. Même les rats ont signé une pétition contre lui.
    -> menu
+ [« Bon, je te laisse. »]
    gary: Bon. Je te laisse. Tiens bon.
    bob: Je ne fais que ça. Tenir. C'est épuisant.
    -> END

=== bob_sandwich ===
gary: Tiens, B.O.B. Cadeau. Ne me remercie pas.
bob: Un sandwich ? Pour moi ? Personne ne m'avait jamais rien offert. À part des miettes. Et du mépris.
Gary pose le sandwich. B.O.B. l'aspire dans un long bruit de succion. Puis plus rien. Un silence lourd. # take: sandwich
bob: Oh non. Oh non non non. C'est... du thon ? Ça a été du thon, un jour ?
bob: Protocole anti-recrachage... en échec... # shake
B.O.B. clignote, tremble, puis expulse dans un hoquet sonore un nuage de poussière, une chaussette, trois boulons et un rectangle de plastique gluant.
Gary récupère son badge. Il est tiède. Gary décide de ne pas y penser. # give: badge
bob: Je me sens vide. Plus que d'habitude. C'est presque agréable.
bob: Gary... Tu es la seule personne qui m'ait jamais nourri. Je crois que je vais te suivre. Si ça ne te dérange pas. Et même si ça te dérange. # set: bob_suit
gary: Bienvenue dans l'équipe, B.O.B. L'équipe, c'est nous deux. Et Josiane.
bob: Qui est Josiane ?
gary: La serpillière.
bob: Évidemment.
-> END

// B.O.B. en compagnon : indice contextuel + papotage déprimant.
=== bob_compagnon ===
{
- not has_flag("lecteur_propre") && not has_flag("serpilliere_mouillee"):
    bob: Le lecteur de badge du labo est couvert de yaourt. Il te faudrait une serpillière. Mouillée. Une serpillière sèche, c'est de la philosophie, pas du ménage.
- not has_flag("lecteur_propre"):
    bob: Ta serpillière dégouline sur mes capteurs. Le lecteur du labo attend, Gary.
- not has_flag("labo_ouvert"):
    bob: Le lecteur est propre. Il ne te reste plus qu'à badger, « Garry ».
- not has_flag("sait_fusible"):
    bob: Ce labo me met mal à l'aise. Tu devrais regarder le panneau de contrôle de près. Moi je reste ici. À distance de sécurité. Enfin, à distance de tristesse.
- not has_flag("fusible_pose") && has_item("fusible"):
    bob: Tu as un fusible 7B dans la poche et un logement 7B vide sur le panneau. Je ne suis qu'un aspirateur, mais même moi, je vois le motif.
- not has_flag("fusible_pose"):
    bob: Le fusible 7B... Le distributeur du couloir est sur le circuit 7B. Je dis ça, je ne dis rien. Je ne dis jamais rien. Personne n'écoute.
- not has_flag("refroidissement_verse"):
    bob: Le réservoir de refroidissement est vide. Et toi, tu as un seau plein d'un liquide. Techniquement, c'est un liquide. Techniquement.
- else:
    bob: Il ne reste que le gros bouton rouge sur le panneau. Tous les gros boutons rouges finissent par être pressés. C'est de la physique. Ou du destin. Ou de la bêtise.
}
+ [« Raconte-moi quelque chose de déprimant. »]
    gary: Raconte-moi quelque chose de déprimant, B.O.B.
    bob: {~L'univers se refroidit. Dans des milliards d'années, tout sera froid, immobile et silencieux. Comme mon bac à poussière le dimanche.|J'ai calculé que je passe 94 % de ma vie à aspirer, et 6 % à me demander pourquoi. Le ratio s'aggrave.|Un jour, quelqu'un m'a appelé « le petit robot mignon ». Puis il a vu ma tête. Il s'est excusé.|Les miettes que j'aspire étaient des sandwichs. Ils avaient des rêves. Maintenant ils sont en moi.}
    -> END
+ [« Merci, B.O.B. »]
    gary: Merci, B.O.B.
    bob: De rien. Rien, c'est ce que je fais de mieux.
    -> END
