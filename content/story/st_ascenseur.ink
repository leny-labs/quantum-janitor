// Chapitre 1 « La Station Bureaucratique » : Ascenseur à Formulaires (st-ascenseur), docs/CHAPTER1.md §6.34, §6.40.
//   formulaire (A, B, D, C) → st_ascenseur_conseil (YAML : goto st-conseil)     [st_ascenseur_conseil]
//   formulaire complet      → st_ascenseur_direction (YAML : goto st-direction) [st_ascenseur_direction]

=== st_ascenseur_conseil ===
Gary glisse le Formulaire B-7/12 dans la fente. L'ascenseur l'avale, le lit, case par case. Clic. Clic. Clic. Clic. Il hésite sur la cinquième.
sylvie: CASES A, B, C, D : CONFORMES. CASE E : VIDE. AVIS DU CONSEIL REQUIS. DIRECTION : NIVEAU 7. # mood: calm
La fente recrache le formulaire. La cabine monte. Longtemps. Puis un peu plus. Ding.
bob: Il a dit « Conseil », Gary. J'espère qu'ils sont au complet. Ils ne sont jamais au complet, d'après M. Delaigue. # mood: suspicious
-> END

=== st_ascenseur_direction ===
Gary glisse le formulaire dans la fente. Clic. Clic. Clic. Clic. Clic. Pour la première fois, l'ascenseur ne s'arrête pas sur la cinquième case. Il la relit, deux fois, comme M. Duplicata.
sylvie: DOSSIER COMPLET. CINQ CASES SUR CINQ. DIRECTION : NIVEAU 12. DIRECTION GÉNÉRALE DE L'EXISTENCE. # mood: love
La cabine monte si vite que les antennes de Gary se plaquent contre son crâne. Ding. Un ding plus grave que les autres. Un ding de direction.
-> END

// B.O.B. dans l'ascenseur : indices gradués (Acte IV).
=== st_bob_ascenseur ===
{ not has_flag("st_ascenseur_conseil"):
    bob: Une fente, Gary. Glisse-lui le formulaire. Il lit la case la plus avancée et il choisit l'étage. Comme un fonctionnaire, mais en plus rapide. # mood: calm
    -> END
}
-> st_bob_acte4
