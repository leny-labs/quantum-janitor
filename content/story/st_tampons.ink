// Chapitre 1 « La Station Bureaucratique » : Bureau des Tampons (st-tampons), docs/CHAPTER1.md §6.15–16, §6.21.
// Mme Gisèle Tamponnet parle en onomatopées de tampons. CLONK.
//   parler                         → plus d'encre « depuis la grève », tampon ANNULÉ  [st_tamponnet] +tampon_annule
//   formulaire sur elle (YAML)     → « PAS D'ENCRE, PAS DE VU » → la grève             [st_sait_greve]

=== st_tamponnet ===
{ not has_flag("st_tamponnet"):
    tamponnet: CLONK. Bonjour. Bureau des Tampons, que puis-je tamponner pour vous ?
    gary: Euh. Rien, pour l'instant. Vous tamponnez… quoi, exactement ?
    tamponnet: Le comptoir. L'air. Les mains. Tout ce qui passe. Sans encre, ça ne laisse rien. Mais le geste, mon petit, le geste reste. # mood: love
    gary: Vous n'avez plus d'encre ?
    tamponnet: Plus une goutte depuis la grève. L'encre officielle, c'était le café. Le café, c'est la machine de la salle de pause. Et la machine est en grève. # mood: sad
    tamponnet: Elle est déléguée du personnel. On ne peut rien lui dire. Elle a un préavis.
    bob: L'encre, c'était le café. Gary, cette Station fonctionne exactement comme toi. # mood: suspicious
    tamponnet: Tenez. Prenez celui-là. Le tampon ANNULÉ. Pas servi une seule fois depuis que je suis ici. Ici, on n'annule jamais rien. Il me fait de la peine. # give: tampon_annule
    gary: Il ne sert jamais ?
    tamponnet: Jamais. C'est pour ça qu'il faut que quelqu'un l'emmène. Un tampon qui ne sert jamais finit par servir une fois. C'est statistique. CLONK. # set: st_tamponnet
    -> END
}
{ has_flag("st_tamponnet_encre"):
    { has_flag("st_case_b"):
        tamponnet: VU ! VU ! CLONK ! Je tamponne tout ce qui passe, maintenant, et ça marque. Même les mains. Surtout les mains. # mood: love
    - else:
        tamponnet: J'ai de l'encre, mon petit ! Montrez-moi votre formulaire, que je vous le VOIE ! # mood: love
    }
    -> END
}
{ not has_flag("st_encreur_pris"):
    tamponnet: Mon encreur est sec, vous voyez ? Là, sur le comptoir. Prenez-le, si ça vous chante. S'il vous arrive de croiser du café… # mood: sad
    -> END
}
{ not has_flag("st_case_a"):
    tamponnet: Quand vous aurez un dossier qui tient debout, revenez me le montrer. Je ne pourrai pas le tamponner. Mais je le regarderai avec beaucoup d'affection. # mood: love
    -> END
}
{ not has_flag("st_sait_greve"):
    tamponnet: Vous avez une case remplie, vous ! Ça se voit sur votre visage. Montrez-moi votre formulaire. # mood: surprised
    -> END
}
{ has_flag("st_encreur_cafe"):
    tamponnet: Ça sent le café ! Ça sent le café ! Mon petit, qu'est-ce que vous avez dans la poche ? Mon encreur ? Donnez ! # mood: surprised
    -> END
}
tamponnet: La salle de pause, mon petit. La machine. PERCO. Si vous la faites revenir au travail, je vous tamponne « VU » des deux mains. CLONK. # mood: love
-> END

// Formulaire sur Tamponnet (YAML : set st_sait_greve). Le « VU » exige l'encre (Acte III) et la case A.
=== st_tamponnet_formulaire ===
Gary tend le Formulaire B-7/12 par-dessus le comptoir. Mme Tamponnet le saisit, l'aplatit, lève son tampon « VU ».
{ not has_flag("st_case_a"):
    tamponnet: Case A vide. Identité : rien. On ne tamponne pas « VU » sur personne. On voit qui, d'abord. # mood: suspicious
    tamponnet: Et de toute façon, mon petit, pas d'encre. Pas d'encre, pas de VU. Pas de café, pas d'encre. C'est la grève. # mood: sad
    gary: Les Archives d'abord, donc. Et la grève ensuite.
    -> END
}
tamponnet: Case A : HUMAIN, INTÉRIMAIRE. Oh, mon pauvre. C'est pire, vous savez. # mood: love
Elle abat le tampon. CLONK. Rien. Elle le relève, souffle dessus, l'abat encore. Le papier reste vierge. # shake
tamponnet: PAS D'ENCRE, PAS DE VU. # mood: sad
tamponnet: La grève, mon petit. Salle de pause. La machine à café, PERCO, déléguée du personnel. Tant qu'elle fait grève, l'encre fait grève. Et moi, je tamponne de l'air.
gary: Il faut donc mettre fin à une grève pour obtenir un tampon.
bob: Gary. Tu es intérimaire, maintenant. Tu sais ce que ça veut dire, dans une grève ? # mood: suspicious
gary: Que je suis du côté de personne ?
bob: Que tu peux signer pour quelqu'un qui n'est pas là. J'ai lu ça quelque part. Dans un placard. Sur une note punaisée. # mood: calm
-> END

// Acte III : l'encreur imbibé de café (YAML : take encreur, set st_tamponnet_encre).
=== st_tamponnet_encre ===
Gary tend l'encreur. Il est brun, luisant, et il sent le café tiède de la Salle de Pause.
tamponnet: …C'est brun. Mon petit, c'est BRUN. # mood: surprised
tamponnet: CLONK ! CLONK CLONK CLONK ! # mood: love # shake
Mme Tamponnet presse son tampon « VU » sur le feutre, puis sur le comptoir. Un « VU » brun apparaît. Elle le regarde comme on regarde un premier enfant.
tamponnet: Il marque. Il marque ! Quarante et un ans que je tamponne de l'espoir, et il marque ! # mood: love
tamponnet: Je garde l'encreur, mon petit. Un encreur, ça ne se prête pas. Ça s'adopte.
bob: Elle pleure, Gary. Ou c'est le café qui coule. Dans les deux cas, c'est beau. # mood: love
-> END

// Acte III : formulaire sur Tamponnet, case A remplie et encre revenue (YAML : set st_case_b).
=== st_tamponnet_vu ===
Mme Tamponnet aplatit le Formulaire B-7/12 sur le comptoir. Elle lisse la case B avec le plat de la main, très lentement, comme on prépare un lit.
tamponnet: Case B. « VU ». CLONK. # shake
Un « VU » brun, net, légèrement de travers, comme tous les vrais « VU ». Il sent le café.
tamponnet: Le plus beau tampon de ma carrière. Et le plus récent. Ce qui, ici, est beaucoup plus rare. # mood: love
gary: Merci, madame Tamponnet.
tamponnet: Allez faire signer ça. La hiérarchie, c'est le sous-chef. Il dort, mais il signe. Enfin, il signait. # mood: calm
-> END

// B.O.B. au Bureau des Tampons : réplique de lieu, puis indices gradués de l'Acte II.
=== st_bob_tampons ===
{ not has_flag("st_tamponnet"):
    bob: Elle tamponne sans encre, Gary. Parle-lui. Les gens qui répètent un geste dans le vide avec autant de conviction ont souvent quelque chose à donner. # mood: calm
    -> END
}
-> st_bob_acte2
