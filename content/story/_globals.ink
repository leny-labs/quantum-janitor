// Fonctions fournies par le moteur (src/engine/DialogueRunner.ts).
// has_item("seau") / has_flag("bob_suit")
EXTERNAL has_item(id)
EXTERNAL has_flag(id)

// Conventions :
//   « bob: texte »  → réplique de B.O.B. (id défini dans content/game.yaml)
//   ligne sans préfixe → narrateur
//   # give: objet / # take: objet / # set: flag / # unset: flag
//   # goto: scène / # end: knot_de_fin / # shake

-> END
