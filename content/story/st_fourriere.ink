// Chapitre 1 « La Station Bureaucratique » : Fourrière & Quai des Navettes (st-fourriere), docs/CHAPTER1.md §6.44–46.
//   ticket de douane (YAML, permis en poche) → st_remorque_amende   [st_amende] −ticket_douane
//   tampon ANNULÉ sur l'amende (YAML)        → st_remorque_annule  [st_vaisseau_libere]

=== st_remorque_quai ===
{ not has_flag("st_amende"):
    remorque: Véhicule CS-07. Garé en travers d'une dimension. Immobilisé depuis ce matin. Pour lui, ça fait une éternité. Pour moi, c'est un mardi. # mood: calm
    remorque: Pour le retrait : le ticket d'entrée et le permis de la Direction. Les deux. Un seul, c'est un demi-départ. Les demi-départs, je les enlève aussi. # mood: suspicious
    { has_item("permis"):
        bob: Tu as les deux, Gary. Le ticket de douane, celui du tout début. Tu l'as gardé tout ce temps. # mood: love
    }
    -> END
}
{ not has_flag("st_vaisseau_libere"):
    remorque: L'amende est sous l'essuie-glace. 4 096 crédits. Je ne négocie pas. Je ne fais que les enlèvements. Et les condoléances, à la rigueur. # mood: calm
    -> END
}
remorque: Le sabot est rangé. Il a rejoint ses frères. Partez, avant que je change d'avis. Je ne change jamais d'avis, mais c'est la formule. # mood: calm
-> END

// Ticket de douane + permis (YAML : take ticket_douane, set st_amende).
=== st_remorque_amende ===
Gary tend le ticket de douane « D-0001 », un peu froissé, et le permis de la Direction. M. Remorque les examine longuement, de très haut. Son trousseau de sabots tinte.
remorque: Ticket d'entrée : conforme. Permis de la Direction : conforme. C'est bien la première fois. Je suis presque déçu. # mood: surprised
Il lève son tampon « ENLÈVEMENT », hésite, le repose. Il prend un carnet jaune à la place.
remorque: Amende : 4 096 crédits. Stationnement en travers d'une dimension. Avec circonstances aggravantes : vous l'avez fait exprès d'arriver. # mood: suspicious
Il glisse le papier jaune sous l'essuie-glace de la capsule. Puis il garde le ticket de douane : « pièce de sortie ».
gary: Je n'ai pas de crédits.
remorque: Personne n'a de crédits. C'est pour ça que la fourrière est pleine. Une amende, ça se paie. Ou ça s'annule, si c'est réglementaire. Depuis que je remorque, j'ai jamais rien vu de réglementaire. Même pas moi. # mood: calm
-> END

// Tampon ANNULÉ sur l'amende (YAML : set st_vaisseau_libere).
=== st_remorque_annule ===
Gary sort le tampon « ANNULÉ ». Il le pose sur l'amende, sous l'essuie-glace. CLONK.
M. Remorque déplie sa grande carcasse hors de la guérite. Il regarde l'amende. Il regarde le tampon. Il relit le panneau des tarifs, tout en bas : « TOUTE AMENDE TAMPONNÉE PAR LE BUREAU DES TAMPONS FAIT FOI. »
remorque: …Un tampon « ANNULÉ ». Officiel. Jamais servi. C'est réglementaire. Je déteste quand c'est réglementaire. # mood: surprised
Il s'agenouille, déverrouille le sabot jaune du patin avant, et l'accroche à son trousseau, avec les autres. CLONK. # shake
remorque: Vous pouvez y aller. Le permis sur le tableau de bord. Et garez-vous droit, la prochaine fois. Je vous attendrai. J'attends toujours. # mood: calm
bob: Gary, on est libres. Avec un tampon que personne n'utilisait. Je vais le dire à Mme Tamponnet. Je vais lui écrire. En trois exemplaires. # mood: love
-> END

// B.O.B. à la fourrière : indices gradués (Acte IV).
=== st_bob_fourriere ===
-> st_bob_acte4
