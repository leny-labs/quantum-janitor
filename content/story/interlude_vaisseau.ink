// Interlude ch.0 → ch.1 : la Capsule de Service CS-07 (docs/INTERLUDE_VAISSEAU.md).
// Knots iv_*, flags iv_*. Scène : content/scenes/interlude-vaisseau.yaml.

=== iv_arrivee ===
La porte de la capsule se referme. Sur le pied de Gary. Puis, après réflexion, sans le pied de Gary.
gary: Aïe. Bon. Je suis dedans.
bob: Gary. Cette capsule a été conçue pour un équipage de douze. Elle mesure un mètre vingt. # mood: suspicious
gary: Les cafards l'appelaient « LE PETIT CERCUEIL QUI VOLE ». J'aurais dû m'arrêter au mot « cercueil ».
sylvie: ...VOL... NON... DÉCLARÉ... # mood: suspicious
bob: Elle nous a suivis jusqu'ici. Même à travers la faille. Elle a toujours été fidèle. Comme un rhume. # mood: sad
gary: Il y a un siège. Il a la forme d'un cafard. Évidemment.
-> END

=== iv_siege ===
Gary déplie la Mue Sacrée. Elle crisse. Elle sent la reine, la cire et un peu la grand-mère.
Il l'enfile. Plastron. Épaulières en élytres. Antennes décoratives, qui frémissent toutes seules.
Puis il se laisse glisser dans le siège-carapace. Clac. Tout s'emboîte. # set: combi_portee # set: iv_assis
gary: B.O.B. C'est la première fois qu'un siège m'épouse.
bob: Tu ressembles à un cafard qui a réussi. C'est un compliment. Là-bas, ça en était un. # mood: love
-> END

=== iv_contact ===
Gary glisse le badge dans la fente « CONTACT ». Bip. Bip. BIIIP.
Les soixante boutons s'allument en même temps. Les quatorze leviers vibrent. Un des trois volants tourne tout seul, puis s'excuse.
L'écran central affiche, en lettres de trente centimètres : « BONJOUR, GARRY ». # set: iv_contact
gary: Même ici. Même dans une capsule de sauvetage. Deux R.
bob: La RH a de longs bras, Gary. Elle les a dans toutes les dimensions. # mood: sad
-> END

// Tableau de bord : props physiques en clic direct, un knot par bouton / levier
// (hotspots bouton_* et levier de la scène). Plus de menu « quel bouton presser ».
=== iv_btn_ascenseur ===
Gary appuie. Évidemment.
Une musique d'ascenseur commence. Douce. Insistante. Éternelle. # set: iv_ascenseur
bob: Gary. Il n'y a pas d'ascenseur ici. Il n'y a même pas de place pour une musique. # mood: suspicious
gary: Elle durera jusqu'au saut. Je le sens.
-> END

=== iv_btn_hyper ===
Clic. Un petit cylindre jaillit du tableau de bord, rouge, brûlant. # set: iv_hyper
gary: C'est... un allume-cigare.
bob: Personne ne fume à bord. Personne n'a jamais fumé à bord. Mais le règlement prévoit qu'on puisse. # mood: calm
-> END

=== iv_btn_eject ===
PFOUT. Le porte-gobelet est éjecté, traverse la capsule, rebondit sur le plafond et atterrit sur B.O.B. # set: iv_eject
bob: On avait un porte-gobelet ? # mood: surprised
gary: On avait un porte-gobelet.
-> END

=== iv_btn_auto ===
Un clapet s'ouvre. À l'intérieur, un post-it jauni, signé du Dr Halvorsen : « L'autopilote, c'est vous :'( » # set: iv_auto
gary: Je suis l'autopilote. Je suis intérimaire ET autopilote.
bob: Tu cumules, Gary. C'est très mal payé, de cumuler. # mood: sad
-> END

=== iv_levier ===
Gary tire le levier. Il ne fait rien de drôle. C'est suspect.
À droite, un écran se déplie dans un bruit de transat : « NAVIGATEUR DIMENSIONNEL — CHOISISSEZ UNE DESTINATION ». # set: iv_navigateur
bob: Le seul bouton sans blague. Évidemment, c'était le bon. # mood: calm
-> END

// Navigateur : écran tactile, une ligne par destination (hotspots dest_*).
=== iv_dest_miniature ===
sylvie: ACCÈS REFUSÉ. FORMULAIRE D'ACCÈS MANQUANT. # mood: angry # set: iv_refus_miniature
gary: Je n'ai même pas encore vu de formulaire.
sylvie: C'EST BIEN POUR ÇA QU'IL MANQUE. # mood: calm
-> END

=== iv_dest_klepsydra ===
sylvie: DESTINATION RÉSERVÉE AU CAPITAINE. VOUS N'ÊTES PAS CAPITAINE. # mood: suspicious # set: iv_refus_klepsydra
sylvie: ...ENCORE. # mood: love
gary: ...« Encore » ?
-> END

=== iv_dest_yaourt ===
L'écran se couvre de condensation. Quelque chose, derrière, toque poliment. Gary recule d'un siège. Il n'y a qu'un siège. # set: iv_refus_yaourt
bob: Non. Non non non. On ne va pas là-bas. Pas aujourd'hui. Pas avec cette tête. # mood: surprised
-> END

=== iv_dest_station ===
sylvie: DESTINATION ACCEPTÉE. VEUILLEZ PATIENTER. VOTRE PATIENCE EST IMPORTANTE POUR NOUS. # set: iv_destination # mood: calm
Sous l'écran, un petit réceptacle s'éclaire. Étiquette : « IMPROBABILITÉ (OPTIONNEL) ».
bob: Optionnel. J'adore quand l'énergie qui déchire les dimensions est optionnelle. # mood: suspicious
-> END

=== iv_saut ===
Gary pose l'éclat dans le réceptacle. Il ronronne. Il chauffe. Il devient... tiède.
sylvie: IMPROBABILITÉ DÉTECTÉE. NIVEAU : « GARY ». SAUT AUTORISÉ. CEINTURES : FACULTATIVES. SURVIE : FACULTATIVE. # mood: calm
{ has_flag("iv_ascenseur"):
    La musique d'ascenseur monte d'un demi-ton. C'est le moment le plus dramatique de sa carrière.
}
La faille, en plein milieu du pare-brise panoramique, s'ouvre en grand. La capsule s'y engouffre. # shake
Gary rattrape l'éclat au vol et le fourre dans la poche de poitrine de la combi. Il ne lâche plus rien, désormais. # set: iv_saut # set: iv_vu
bob: Gary. Si on meurt, je veux que tu saches que tu as été mon meilleur et unique propriétaire. # mood: love
gary: Je ne suis pas ton propri—
-> END

=== iv_bob ===
{
- not has_flag("iv_assis") && not has_flag("iv_contact"):
    bob: Deux choses, Gary. Assieds-toi. Et allume ce truc. Le siège veut un cafard : tu en as un costume. La fente dit « CONTACT » : tu as un badge. # mood: calm
- not has_flag("iv_assis"):
    bob: Tu ne vas pas piloter accroupi. Enfile la combi, Gary. Le siège n'attend qu'elle. # mood: calm
- not has_flag("iv_contact"):
    bob: Il y a une fente « CONTACT ». Il te reste un badge. Je ne dis rien, je constate. # mood: suspicious
- not has_flag("iv_navigateur"):
    bob: Soixante boutons, et tu cherches le bon. Prends celui qui n'a pas d'étiquette drôle. Les blagues, c'est pour les touristes. # mood: calm
- not has_flag("iv_destination"):
    bob: Le navigateur, à droite. Choisis une destination. N'importe laquelle sauf le yaourt. Surtout pas le yaourt. # mood: sad
- else:
    bob: « IMPROBABILITÉ (OPTIONNEL) ». Tu as l'éclat, Gary. Tu es l'improbabilité. Mets-le dans le trou. # mood: calm
}
-> END
