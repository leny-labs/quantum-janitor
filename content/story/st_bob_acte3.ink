// Chapitre 1 « La Station Bureaucratique » : indices B.O.B. de l'Acte III « La Grève » (docs/CHAPTER1.md §6.3, §6.22–33),
// partagés par les bureaux de l'Aile B (après la case A). 1re demande vague, suivantes précises.

=== st_bob_acte3 ===
{ not has_flag("st_tamponnet"):
    -> st_bob_acte2.tamponnet
}
{ not has_flag("st_sait_greve"):
    -> st_bob_acte2.vu
}
{ not has_flag("st_greve_connue"):
    -> greve
}
{ not has_flag("st_accord_pris"):
    -> accord
}
{ not has_flag("st_voit_delegation"):
    -> delegation
}
{ not has_flag("st_accord_signe"):
    -> signer
}
{ not has_flag("st_greve_finie"):
    -> fin_greve
}
{ not has_flag("st_encreur_pris"):
    -> encreur
}
{ not has_flag("st_encreur_cafe"):
    -> encre
}
{ not has_flag("st_tamponnet_encre"):
    -> rendre_encre
}
{ not has_flag("st_case_b"):
    -> case_b
}
{ not has_flag("st_delaigue_reveille"):
    -> reveil
}
{ not has_flag("st_case_d"):
    -> case_d
}
{ not has_flag("st_case_c"):
    -> case_c
}
// cases A, B, D, C : Acte IV (st_bob_acte4)
-> st_bob_acte4

= greve
{ st_bob_acte3.greve > 1:
    bob: La Salle de Pause, Gary. PERCO, la machine à café. C'est elle, la grève. Parle-lui. # mood: calm
- else:
    bob: Pas de café, pas d'encre. Pas d'encre, pas de « VU ». Une grève, ça se négocie là où on fait la pause, Gary. # mood: suspicious
}
-> END

= accord
bob: L'accord P-15, Gary. Sur le panneau syndical de la Salle de Pause. Prends-le. PERCO a dit qu'il fallait le faire signer. # mood: calm
-> END

= delegation
{ st_bob_acte3.delegation > 1:
    bob: Le Bureau du Sous-Chef Adjoint, Gary. M. Delaigue dort. Lis la note punaisée au-dessus de son fax. # mood: love
- else:
    bob: « Par la direction ou son intérimaire. » Qui est intérimaire, ici, Gary ? Qui dort au travail depuis dix-neuf ans ? Et qui d'autre est intérimaire… depuis ce matin ? # mood: suspicious
}
-> END

// sans la déduction d_po (carnet) : on pointe le carnet, pas le geste
= signer
{ not has_flag("st_deduit_po"):
    -> signer_carnet
}
bob: Tu as lu la note, Gary : sommeil compris, tout intérimaire signe p.o. Donne l'accord à M. Delaigue. Enfin, à sa main. C'est toi qui signeras. # mood: love
-> END

= signer_carnet
{ st_bob_acte3.signer_carnet > 1:
    bob: Ce que veut PERCO et ce qui est punaisé au-dessus du fax, Gary. Mets-les côte à côte dans ton carnet. Les papiers, ça se comprend mieux à deux. # mood: love
- else:
    bob: Tu as lu beaucoup de choses aujourd'hui, Gary. Deux d'entre elles parlent de la même signature. Elles ne le savent pas encore. # mood: suspicious
}
-> END

= fin_greve
bob: L'accord est signé, Gary. P.o. Apporte-le à PERCO. Une déléguée respecte toujours une signature. Surtout une signature tordue. # mood: calm
-> END

= encreur
bob: L'encreur sec de Mme Tamponnet, Gary. Sur son comptoir. Il va falloir le nourrir. # mood: calm
-> END

= encre
{ st_bob_acte3.encre > 1:
    bob: L'encreur et le gobelet, Gary. Dans ton inventaire. Trempe l'un dans l'autre. # mood: love
- else:
    bob: « L'encre, c'était le café. » Tu as un encreur sec. PERCO sert à nouveau. Je te laisse faire le calcul, Gary. Il est brun et tiède. # mood: suspicious
}
-> END

= rendre_encre
bob: L'encreur sent le café, Gary. Rapporte-le à Mme Tamponnet. Elle va faire CLONK de joie. # mood: love
-> END

= case_b
bob: Mme Tamponnet a de l'encre, Gary. Montre-lui le formulaire. Case B : « VU ». # mood: calm
-> END

= reveil
{ has_flag("st_gobelet_entame") && has_item("gobelet"):
    bob: Il te reste un demi-gobelet, Gary. L'encreur a eu sa part. Il y a quelqu'un qui dort, et qui en a besoin plus que toi. # mood: love
    -> END
}
{ st_bob_acte3.reveil > 1:
    bob: Du café, Gary. Ton gobelet, ou un autre chez PERCO. Apporte-le sous le nez de M. Delaigue. # mood: love
- else:
    bob: Il faut une signature hiérarchique, Gary, et la hiérarchie dort. Il se réveille au mot « prime »… ou à l'odeur du café. Les primes, ici, n'existent pas. # mood: suspicious
}
-> END

= case_d
bob: M. Delaigue est réveillé, Gary. Le formulaire a son « VU ». Fais-le signer. Case D. # mood: calm
-> END

= case_c
{ st_bob_acte3.case_c > 1:
    bob: La photocopieuse des Archives, Gary. Le formulaire dessus. Le papier est resté dans le bac. M. Duplicata certifiera. # mood: love
- else:
    bob: « En trois exemplaires », Gary. Qui ne délivre que des copies ? Et qui a du papier, maintenant, grâce à toi ? # mood: suspicious
}
-> END
