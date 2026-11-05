// Chapitre 1 « La Station Bureaucratique » : Fourrière & Quai des Navettes (st-fourriere), docs/CHAPTER1.md §6.44–46.
//   ticket de douane (YAML, permis en poche) → st_sabot_amende   [st_amende] −ticket_douane
//   tampon ANNULÉ sur l'amende (YAML)        → st_sabot_annule   [st_vaisseau_libere]

=== st_sabot_quai ===
{ not has_flag("st_amende"):
    sabot: Retrait du véhicule CS-07 : ticket d'entrée et permis de la Direction. Les deux. Pas l'un ou l'autre. Les deux. # mood: calm
    { has_item("permis"):
        bob: Tu as les deux, Gary. Le ticket de douane, celui du tout début. Tu l'as gardé tout ce temps. # mood: love
    }
    -> END
}
{ not has_flag("st_vaisseau_libere"):
    sabot: L'amende est sur le pare-brise. 4 096 crédits. Je fais pas les ventes, je fais pas les ristournes. # mood: calm
    -> END
}
sabot: Le sabot est levé. Vous pouvez partir. Je dirais bien « bon voyage », mais je fais pas les vœux. # mood: calm
-> END

// Ticket de douane + permis (YAML : take ticket_douane, set st_amende).
=== st_sabot_amende ===
Gary tend le ticket de douane « D-0001 », un peu froissé, et le permis de la Direction. M. Sabot les tamponne tous les deux. CLONK. CLONK.
sabot: Ticket d'entrée : conforme. Permis de la Direction : conforme. Retrait possible. # mood: calm
sabot: Amende : 4 096 crédits. Stationnement en travers d'une dimension. # mood: suspicious
Il glisse un papier jaune sous l'essuie-glace de la capsule. Puis il garde le ticket de douane : « pièce de sortie ».
gary: Je n'ai pas de crédits.
sabot: Je fais pas les ventes. Je fais pas les crédits non plus. Une amende, ça se paie. Ou ça s'annule, si c'est réglementaire. Rien n'est jamais réglementaire. # mood: calm
-> END

// Tampon ANNULÉ sur l'amende (YAML : set st_vaisseau_libere).
=== st_sabot_annule ===
Gary sort le tampon « ANNULÉ ». Il le pose sur l'amende, sous l'essuie-glace. CLONK.
M. Sabot sort de sa guérite. Il regarde l'amende. Il regarde le tampon. Il regarde Gary. Il relit le panneau des tarifs, tout en bas : « TOUTE AMENDE TAMPONNÉE PAR LE BUREAU DES TAMPONS FAIT FOI. »
sabot: …Je fais pas les ventes. Mais ça, c'est réglementaire. # mood: surprised
Il se penche, déverrouille le sabot jaune du patin avant, et le hisse sur son épaule. CLONK. # shake
sabot: Bon. Vous pouvez y aller. Le permis sur le tableau de bord. Et garez-vous droit, la prochaine fois. Il y a d'autres dimensions qui attendent. # mood: calm
bob: Gary, on est libres. Avec un tampon que personne n'utilisait. Je vais le dire à Mme Tamponnet. Je vais lui écrire. En trois exemplaires. # mood: love
-> END

// B.O.B. à la fourrière : indices gradués (Acte IV).
=== st_bob_fourriere ===
-> st_bob_acte4
