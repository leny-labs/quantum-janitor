// Chapitre 1 « La Station Bureaucratique » : Service des Réclamations (st-reclamations), docs/CHAPTER1.md §6.17–18.
// Pas de PNJ. La chatière « ANIMAUX DE SERVICE » reconnaît la carapace (combi portée), pas le statut (§6.5).
//   utiliser la chatière (YAML, si combi_portee) → derrière le comptoir   [st_chatiere]

=== st_reclamations_chatiere ===
Gary s'accroupit devant la chatière. Puis il s'aplatit, coudes en dedans, antennes rabattues. La combinaison de chitine craque comme une vieille armoire.
Le petit lecteur au-dessus de la chatière s'allume. Un rayon vert balaie la carapace, de la tête aux élytres.
sylvie: CARAPACE DÉTECTÉE. ANIMAL DE SERVICE. ACCÈS AUTORISÉ. BIENVENUE, COLLÈGUE. # mood: calm
CLONK. La chatière bascule. Gary passe à quatre pattes, avec une dignité de cafard, et se relève de l'autre côté du comptoir.
gary: Je suis derrière. Du côté du personnel. Il a suffi d'être un animal.
bob: Tu as été plus rapide que n'importe quel fonctionnaire, Gary. Ils ne savent pas ramper. Ils n'ont jamais eu à le faire. # mood: love
Derrière la vitre : une chaise, une sonnette, une tasse. Sur les étagères, des liasses de formulaires vierges. Et, posée sur le côté, une capsule pneumatique vide.
bob: Du papier, Gary ! Pour la photocopieuse ! Et une capsule… je ne sais pas pour quoi. Prends-la quand même. Tu prends toujours tout. Ça finit toujours par servir. # mood: surprised
-> END

// B.O.B. aux Réclamations : réplique de lieu, puis indices gradués de l'Acte II.
=== st_bob_reclamations ===
{ not has_flag("st_chatiere"):
    { not has_flag("st_dossier_trouve"):
        bob: Personne, Gary. Et derrière le comptoir, des piles de papier vierge. On ne sait pas encore à quoi il servirait. Mais retiens-le. # mood: calm
        -> END
    }
    { st_bob_reclamations > 1:
        bob: La chatière, Gary. « ANIMAUX DE SERVICE ». Le lecteur détecte les carapaces. Tu portes une carapace. Pousse-la. # mood: love
    - else:
        bob: Le comptoir est réservé au personnel. Mais ce Service a prévu un accès pour… d'autres. Regarde plus bas, Gary. Plus bas que ta dignité. # mood: suspicious
    }
    -> END
}
-> st_bob_acte2
