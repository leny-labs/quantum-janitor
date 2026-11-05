// Chapitre 1 « La Station Bureaucratique » : Bureau du Sous-Chef Adjoint (st-sous-chef), docs/CHAPTER1.md §6.23–25, §6.31–32.
// M. Hubert Delaigue, sous-chef adjoint par intérim depuis 19 ans, dort sur son fax. Signe « p.o. » d'un chef absent depuis 1987.
//   accord (YAML, reclassé + note lue)  → st_souschef_signe : Gary signe p.o.      [st_accord_signe]
//   gobelet plein (YAML)                → st_delaigue_reveil : « …PRIME ? »       [st_delaigue_reveille] −gobelet
//   formulaire (YAML, réveillé + VU)    → st_delaigue_signature : case D           [st_case_d]

=== st_delaigue ===
{ not has_flag("st_delaigue_reveille"):
    gary: Monsieur Delaigue ? Monsieur le sous-chef adjoint ?
    delaigue: …réunion… reportée… à la prochaine… réunion…
    gary: Il y a une prime, monsieur Delaigue.
    Un œil s'ouvre. Il regarde autour de lui. Il ne voit pas de prime. L'œil se referme.
    delaigue: …pas de prime… pas de réveil… article… quatre…
    bob: Il se réveille au mot « prime », Gary, mais il vérifie. Il faut lui donner autre chose de concret. Quelque chose qui sent bon. # mood: suspicious
    -> END
}
{ not has_flag("st_case_d"):
    delaigue: Cher collègue intérimaire ! Vous avez un dossier à me faire signer ? Je signe tout. Enfin, tout ce qui a été vu. # mood: love
    -> END
}
delaigue: L'ascenseur à formulaires, cher collègue. Fond du couloir. Il ne prend que les dossiers complets aux trois quarts. # mood: calm
delaigue: Et au Conseil, il faudra le quorum : trois membres. Mme Paraphe, le représentant du personnel… et un membre honoraire que personne n'a vu depuis le déménagement.
-> END

// Accord sur Delaigue endormi : Gary signe « p.o. » avec le stylo enchaîné (YAML : set st_accord_signe).
=== st_souschef_signe ===
Gary pose l'accord P-15 sur le bureau, à côté de la main endormie de M. Delaigue. Il relit la note punaisée. « Tout intérimaire de la Station signe p.o. »
gary: Sommeil compris.
Il prend le stylo enchaîné au bureau. La chaîne est juste assez longue pour signer. Pas pour partir avec.
Gary écrit : « p.o. H. Delaigue, sous-chef adjoint p.i. — par G. Plunk, intérimaire ».
delaigue: …très bien… très bien… le dossier suit son cours… zzz…
gary: Pour la première fois de ma vie, être intérimaire me sert à quelque chose.
bob: Tu as signé pour le remplaçant d'un chef absent, Gary. Je crois que c'est la définition exacte du pouvoir, ici. # mood: love
-> END

// Gobelet de café plein sur Delaigue (YAML : take gobelet, set st_delaigue_reveille).
=== st_delaigue_reveil ===
Gary approche le gobelet de café tiède sous le nez de M. Delaigue. Une narine frémit. Puis l'autre.
delaigue: …café… CAFÉ ? …PRIME ? QUELLE PRIME ? # mood: surprised # shake
M. Delaigue se redresse d'un bond. La feuille de fax se décolle de sa joue. Il attrape le gobelet à deux mains, comme un trophée.
delaigue: Du café ! Du vrai ! Tiède ! La grève est finie ? Qui a signé ?
gary: Vous. Enfin, moi. Pour vous. P.o.
delaigue: Un intérimaire qui signe pour un intérimaire ! Cher collègue ! Depuis dix-neuf ans, je n'ai jamais été aussi bien remplacé ! # mood: love
delaigue: Je garde le gobelet. On ne sait jamais quand arrivera la prochaine grève. # mood: calm
-> END

// Formulaire sur Delaigue réveillé, case B « VU » remplie (YAML : set st_case_d).
=== st_delaigue_signature ===
M. Delaigue pose le Formulaire B-7/12 sur son fax, chausse des lunettes qu'il n'a pas, et lit.
delaigue: Case A : humain, intérimaire. Bienvenue au club. Case B : « VU ». Tampon au café. Très bien. Ça sent bon.
delaigue: Case D : signature hiérarchique. Je suis la hiérarchie. Par intérim. Ça compte. # mood: love
Il signe. Une signature énorme, avec une boucle, deux traits et « p.i. » en exposant. Il souffle dessus. Elle est tiède.
delaigue: Maintenant, la case C : trois exemplaires certifiés conformes. C'est M. Duplicata. Il a du papier, paraît-il. Grâce à un intérimaire. # mood: calm
delaigue: Et ensuite, l'ascenseur à formulaires, au fond du couloir. Il ne prend que les dossiers complets aux trois quarts. Il est très strict sur les fractions.
delaigue: Et au Conseil, il vous faudra le quorum. Trois membres. Bonne chance : ils ne sont jamais plus d'une. # mood: sad
bob: Une case par bureau, Gary. On fait le tour de la Station comme un dossier. # mood: calm
-> END

// B.O.B. au Bureau du Sous-Chef : réplique de lieu, puis indices gradués.
=== st_bob_souschef ===
{ not has_flag("st_voit_delegation"):
    bob: Un intérimaire qui dort, Gary. Regarde ce qui est punaisé au-dessus du fax. Les gens qui dorment au travail laissent toujours des instructions. # mood: suspicious
    -> END
}
{ has_flag("st_case_a"):
    -> st_bob_acte3
}
-> st_bob_acte2
