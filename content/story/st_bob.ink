// Chapitre 1 « La Station Bureaucratique » : B.O.B., propriétaire officiel de Gary, indices gradués
// (1re demande = vague, 2e = précise ; docs/CHAPTER1.md §6.3). Au sas : d'abord le ticket du
// portique, puis la laisse (st_laisse).

=== st_bob ===
{ has_flag("st_ticket_douane"):
    -> st_laisse
}
{ st_bob > 1:
    bob: Le portique, Gary. Il imprime quelque chose dès qu'on le touche. Il ne demande que ça : servir. Comme moi. # mood: calm
- else:
    bob: Tout le monde a un ticket, ici. Sauf nous. C'est la première chose qui m'inquiète. La deuxième, c'est le reste. # mood: suspicious
}
-> END
