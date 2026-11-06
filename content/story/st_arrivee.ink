// Chapitre 1 « La Station Bureaucratique » (docs/CHAPTER1.md) : sas d'arrivée et salle d'attente.
// Knots st_*, flags st_*. Scènes : content/scenes/st-sas.yaml, st-attente.yaml.

=== st_arrivee ===
CRRRRUNCH. La capsule s'encastre dans le sas d'arrivée, en marche arrière, comme une voiture de location.
Gary s'extrait. Le sol est propre. Trop propre. Quelqu'un l'a tamponné.
sylvie: BIENVENUE À LA STATION. VOTRE VISITE EST ENREGISTRÉE. VOTRE ENREGISTREMENT EST ENREGISTRÉ. # mood: calm
gary: SYLVIE ? C'est... toi ? Tu as une voix plus... administrative.
sylvie: ICI, JE SUIS DIRECTRICE GÉNÉRALE DE L'EXISTENCE. VEUILLEZ FRANCHIR LE PORTIQUE. # mood: suspicious
Gary franchit le portique. Il bipe. Longuement. Avec mépris.
{ has_flag("combi_portee"):
    Les antennes de la combi frémissent sous le scanner. Le portique hésite. Puis il tranche.
}
sylvie: ESPÈCE : BLATTE (COMBINAISON). STATUT : ANIMAL DE COMPAGNIE. PROPRIÉTAIRE : B.O.B. # mood: calm
bob: ...Moi ? Je suis propriétaire ? De quelqu'un ? # mood: surprised
gary: C'est la combi. Elle me fait passer pour un cafard. C'est même son seul talent.
sylvie: VÉHICULE STATIONNÉ SANS AUTORISATION. MISE EN FOURRIÈRE IMMÉDIATE. # set: st_vaisseau_fourriere # mood: angry
Derrière eux, une pince géante décroche la capsule et l'emporte vers la fourrière. Le porte-gobelet reste par terre, seul, digne.
sylvie: PAR AILLEURS : L'OBJET TROUVÉ N° 2/4096 EST EN ATTENTE DE RÉCLAMATION. FORMULAIRE B-7/12. EN TROIS EXEMPLAIRES. # mood: love
gary: B.O.B. L'« objet trouvé n° 2 sur 4 096 ».
bob: Le deuxième éclat, Gary. Classé. Rangé. Sous scellés. On l'a retrouvé, et c'est pire. # mood: sad # set: st_arrive
-> END

=== st_laisse ===
{ has_flag("st_laisse"):
    bob: Je te tiens toujours, Gary. Symboliquement. Ne tire pas, j'ai des roues. # mood: love
    -> END
}
{ not has_flag("st_voit_borne"):
    bob: Je ne sais pas ce qu'on attend de moi, Gary. Je n'ai jamais été propriétaire de rien. Même pas de mon tome 1. # mood: sad
    bob: La borne, peut-être. Les bornes savent toujours ce qu'on attend des gens. C'est leur seul plaisir. # mood: suspicious
    -> END
}
bob: La borne dit que les animaux doivent être accompagnés. Je suis... ton accompagnateur. # mood: surprised
* [« Tiens-moi en laisse, B.O.B. »]
    gary: Tiens-moi en laisse, B.O.B. Symboliquement. Pour la borne.
    bob: Je... d'accord. Gary Plunk, tu es mon animal. Je m'engage à te nourrir, à te sortir, et à ne jamais t'abandonner sur une aire d'autoroute. # mood: love
    Gary noue le cordon de sa capuche de chitine à l'antenne de B.O.B. La borne émet un bip satisfait. # set: st_laisse
    sylvie: ANIMAL ACCOMPAGNÉ. ACCÈS À LA SALLE D'ATTENTE : AUTORISÉ. VEUILLEZ ATTENDRE. # mood: calm
    gary: Attendre quoi ?
    sylvie: C'EST UNE SALLE D'ATTENTE, ANIMAL PLUNK. # mood: suspicious
* [« Laisse tomber. Je suis un être humain. »]
    gary: Je suis un être humain, B.O.B. J'ai un badge.
    sylvie: LES BADGES D'ANIMAUX NE SONT PAS RECONNUS. # mood: calm
    bob: Elle a raison, Gary. Tu as un badge, mais tu as aussi des antennes. Il faut choisir. # mood: sad
- -> END

=== st_sabot ===
Derrière la vitre de la guérite de la fourrière, un homme en gilet orange tamponne des contraventions. Il ne lève pas les yeux.
sabot: Je fais pas les ventes.
gary: Je ne veux rien acheter. Vous avez pris notre capsule.
sabot: Pas pris. Mise en fourrière. C'est pas pareil. Pris, c'est du vol. Mise en fourrière, c'est du service public.
{ not has_flag("st_sabot_vu"):
    sabot: Amende : trois dimensions et demie. Plus les frais de garde : une dimension par jour de 24 heures de 10 h 11.
    gary: Il est 10 h 11 depuis quand ?
    sabot: Je compte pas. Si je compte, faut que je me facture. Ça fait une sacrée garde. # set: st_sabot_vu
}
sabot: Pour la récupérer : le ticket d'entrée. Et le permis de quitter la dimension, signé par la Direction.
{ has_item("ticket_douane"):
    gary: Un ticket d'entrée ? J'ai un ticket de douane.
    sabot: Gardez-le. Précieusement. On en reparlera le jour où vous aurez le permis. C'est-à-dire jamais. Au revoir.
- else:
    sabot: Le ticket, on vous l'a donné à l'entrée. Ou alors vous l'avez pas pris. Ou alors vous êtes un animal. Au revoir.
}
Le rideau de la guérite tombe. CLONK. Il se relève aussitôt : c'est l'heure de la pause de la pause.
-> END

=== st_patience ===
{ not (has_flag("st_voit_patience") && has_flag("st_main_serree") && has_flag("st_voit_afficheur")):
    bob: Il a l'air si paisible, Gary. Il a attendu si longtemps. Moi aussi, j'attends. Mais je ne sais pas quoi. # mood: sad
    {
    - not has_flag("st_voit_patience"):
        bob: Regarde-le mieux. Les squelettes ont toujours quelque chose dans la main. C'est pour ça qu'ils gardent les doigts. # mood: suspicious
    - not has_flag("st_main_serree"):
        bob: Il serre son ticket. Fort. Tu as essayé de le prendre, au moins ? Avec délicatesse ? # mood: calm
    - else:
        bob: Un ticket, c'est un numéro. Un numéro, ça s'appelle. Et ici, qui appelle les numéros, Gary ? Lève les yeux. # mood: calm
    }
    -> END
}
{ has_flag("st_ticket_9848"):
    bob: Repose en paix, M. Patience. Ton numéro passera. Un jour. Pour quelqu'un d'autre. # mood: sad
    -> END
}
bob: Gary. Le 9 848. C'est le numéro suivant, sur l'afficheur. Il l'a attendu toute sa vie. # mood: sad
* [« Il n'en a plus besoin… »]
    gary: B.O.B. Il n'en a plus besoin. Et toi, tu aspires. Délicatement.
    bob: Gary. Tu me demandes d'aspirer le ticket d'un mort. # mood: surprised
    gary: D'un usager. Le plus ancien de la file. Il a de l'ancienneté.
    bob: ...Bon. Je dis quelques mots d'abord. C'est la moindre des choses. # mood: sad
    bob: M. Patience. Nous ne nous connaissions pas. Tu étais assis. Tu attendais. Tu as été le meilleur d'entre nous à ça. # mood: sad
    bob: Tu n'as jamais doublé personne. Tu n'as jamais demandé à parler au responsable. Le responsable ne t'a jamais parlé non plus. # mood: sad
    bob: Repose en paix. Et prête-nous ton numéro. # mood: love
    SHLUUUP. Le ticket glisse d'entre les phalanges. B.O.B. le recrache aux pieds de Gary, à peine humide. # aspir # give: ticket_9848 # set: st_ticket_9848
    Les doigts de M. Patience retombent. On dirait qu'il sourit. C'est peut-être la mâchoire.
    gary: Merci, M. Patience. On vous rendra la monnaie.
* [« Non. On ne fait pas ça. »]
    gary: Non. On ne fait pas les poches des squelettes. Même ici. Surtout ici.
    bob: Merci, Gary. Mais réfléchis. Il ne lui reste que ça à donner. # mood: sad
- -> END
