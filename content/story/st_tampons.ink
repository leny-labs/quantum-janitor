// Chapitre 1 « La Station Bureaucratique » : Bureau des Tampons (st-tampons), docs/CHAPTER1.md §6.15–16, §6.21.
// Mme Gisèle Tamponnet parle en onomatopées de tampons. CLONK.
//   parler                         → plus d'encre « depuis la grève », tampon ANNULÉ  [st_tamponnet] +tampon_annule
//   formulaire sur elle (YAML)     → « PAS D'ENCRE, PAS DE VU » → la grève             [st_sait_greve]

=== st_tamponnet ===
{ not has_flag("st_tamponnet"):
    tamponnet: CLONK. Bonjour. CLONK. Bureau des Tampons, que puis-je tamponner pour vous ? CLONK.
    gary: Euh. Rien, pour l'instant. Vous tamponnez… quoi, exactement ?
    tamponnet: Le comptoir. L'air. Les mains. Tout ce qui passe. CLONK. Sans encre, ça ne laisse rien. Mais le geste, mon petit, le geste reste. # mood: love
    gary: Vous n'avez plus d'encre ?
    tamponnet: Plus une goutte depuis la grève. CLONK. L'encre officielle, c'était le café. Le café, c'est la machine de la salle de pause. Et la machine est en grève. # mood: sad
    tamponnet: Elle est déléguée du personnel. On ne peut rien lui dire. CLONK. Elle a un préavis.
    bob: L'encre, c'était le café. Gary, cette Station fonctionne exactement comme toi. # mood: suspicious
    tamponnet: Tenez. CLONK. Prenez celui-là. Le tampon ANNULÉ. Quarante et un ans sur son crochet. Ici, on n'annule jamais rien. Il me fait de la peine. # give: tampon_annule
    gary: Il ne sert jamais ?
    tamponnet: Jamais. C'est pour ça qu'il faut que quelqu'un l'emmène. Un tampon qui ne sert jamais finit par servir une fois. C'est statistique. CLONK. # set: st_tamponnet
    -> END
}
{ not has_flag("st_encreur_pris"):
    tamponnet: CLONK. Mon encreur est sec, vous voyez ? Là, sur le comptoir. Prenez-le, si ça vous chante. S'il vous arrive de croiser du café… CLONK. # mood: sad
    -> END
}
{ not has_flag("st_case_a"):
    tamponnet: CLONK. Quand vous aurez un dossier qui tient debout, revenez me le montrer. Je ne pourrai pas le tamponner. Mais je le regarderai avec beaucoup d'affection. CLONK. # mood: love
    -> END
}
{ not has_flag("st_sait_greve"):
    tamponnet: CLONK ! Vous avez une case remplie, vous ! Ça se voit sur votre visage. Montrez-moi votre formulaire. CLONK. # mood: surprised
    -> END
}
tamponnet: La salle de pause, mon petit. La machine. PERCO. Si vous la faites revenir au travail, je vous tamponne « VU » des deux mains. CLONK. CLONK. # mood: love
-> END

// Formulaire sur Tamponnet (YAML : set st_sait_greve). Le « VU » exige l'encre (Acte III) et la case A.
=== st_tamponnet_formulaire ===
Gary tend le Formulaire B-7/12 par-dessus le comptoir. Mme Tamponnet le saisit, l'aplatit, lève son tampon « VU ».
{ not has_flag("st_case_a"):
    tamponnet: CLONK ? Case A vide. Identité : rien. On ne tamponne pas « VU » sur personne. On voit qui, d'abord. CLONK. # mood: suspicious
    tamponnet: Et de toute façon, mon petit, pas d'encre. Pas d'encre, pas de VU. Pas de café, pas d'encre. C'est la grève. CLONK. # mood: sad
    gary: Les Archives d'abord, donc. Et la grève ensuite.
    -> END
}
tamponnet: Case A : HUMAIN, INTÉRIMAIRE. Oh, mon pauvre. CLONK. C'est pire, vous savez. # mood: love
Elle abat le tampon. CLONK. Rien. Elle le relève, souffle dessus, l'abat encore. CLONK. Le papier reste vierge. # shake
tamponnet: PAS D'ENCRE, PAS DE VU. # mood: sad
tamponnet: La grève, mon petit. Salle de pause. La machine à café, PERCO, déléguée du personnel. Tant qu'elle fait grève, l'encre fait grève. Et moi, je tamponne de l'air.
gary: Il faut donc mettre fin à une grève pour obtenir un tampon.
bob: Gary. Tu es intérimaire, maintenant. Tu sais ce que ça veut dire, dans une grève ? # mood: suspicious
gary: Que je suis du côté de personne ?
bob: Que tu peux signer pour quelqu'un qui n'est pas là. J'ai lu ça quelque part. Dans un placard. Sur une note punaisée. # mood: calm
-> END

// B.O.B. au Bureau des Tampons : réplique de lieu, puis indices gradués de l'Acte II.
=== st_bob_tampons ===
{ not has_flag("st_tamponnet"):
    bob: Elle tamponne sans encre, Gary. Parle-lui. Les gens qui font un geste dans le vide depuis quarante et un ans ont souvent quelque chose à donner. # mood: calm
    -> END
}
-> st_bob_acte2
