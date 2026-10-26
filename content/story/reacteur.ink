// Couloir, labo et panneau : de la porte du labo jusqu'à la catastrophe.

=== badge_porte ===
Bip.
sylvie: BADGE DÉTECTÉ. « GARRY PLUNK ». ORTHOGRAPHE DU PRÉNOM : NON CONFORME.
gary: C'est la RH qui a fait une faute. Je l'ai signalé. Trois fois. Par écrit. En pleurant.
sylvie: ACCÈS ACCORDÉ QUAND MÊME. HONNÊTEMENT, QUI VOUDRAIT SE FAIRE PASSER POUR VOUS ? # set: labo_ouvert
La porte du laboratoire s'ouvre dans un chuintement dramatique, qu'elle a manifestement répété.
-> END

=== labo_entree ===
Le Laboratoire du Réacteur d'Improbabilité. Ça sent l'ozone, le café froid et la très mauvaise idée.
sylvie: AGENT PLUNK. FLUCTUATION D'IMPROBABILITÉ DE NIVEAU 3. VEUILLEZ STABILISER LE RÉACTEUR VIA LE PANNEAU DE CONTRÔLE.
gary: Moi ? Je suis agent d'entretien. Intérimaire. Je stabilise des sols, pas des réacteurs.
sylvie: LES SCIENTIFIQUES SONT SUR MERCURE. VOUS ÊTES L'ÊTRE HUMAIN LE PLUS QUALIFIÉ À BORD.
gary: Il y a combien d'êtres humains à bord ?
sylvie: UN.
bob: Niveau 3. Il y a combien de niveaux ?
sylvie: QUATRE. LE NIVEAU 4 S'APPELLE « GARY ».
gary: Elle m'aime bien, au fond.
-> END

=== fusible_pose ===
Clac. Le fusible rentre parfaitement. Trop parfaitement. Le panneau s'illumine comme un sapin de Noël anxieux. # take: fusible # set: fusible_pose
sylvie: ALIMENTATION RÉTABLIE. REFROIDISSEMENT : 0 %. REMPLISSEZ LE RÉSERVOIR VIA LA TRAPPE D'ADMISSION, PUIS APPUYEZ SUR « STABILISER ». # set: panneau_allume
gary: Remplir le réservoir... avec quoi ?
bob: Il n'y a qu'un seul liquide dans cette pièce, Gary. Il est dans ton seau. Je le dis à voix haute pour le rapport d'accident.
-> END

=== verser_seau ===
sylvie: ATTENTION. VEUILLEZ CONFIRMER QUE LE LIQUIDE EST DU LIQUIDE DE REFROIDISSEMENT RÉGLEMENTAIRE.
bob: Gary. C'est de l'eau de serpillière. Avec du yaourt du lecteur de badge dedans. Je te le dis en tant qu'ami. Mon seul ami.
* [« Oui. Absolument réglementaire. »]
    gary: Oui. Totalement réglementaire. Je suis l'agent réglementaire. C'est écrit sur mon badge. Avec deux R.
    sylvie: CONFIRMATION ENREGISTRÉE. MENSONGE ÉGALEMENT ENREGISTRÉ.
* [« C'est liquide. Ça refroidit. Ça compte ? »]
    gary: Bon. C'est liquide. C'est froid. Ça refroidit. Ça compte, non ?
    sylvie: TECHNIQUEMENT... OUI. JE DÉTESTE LES TECHNICALITÉS.
* [« On ne pourrait pas juste... ne rien faire ? »]
    gary: On ne pourrait pas juste ne rien faire ? Je suis excellent pour ne rien faire. J'ai des références.
    sylvie: NÉGATIF. LE RÉACTEUR SURCHAUFFE. N'IMPORTE QUEL LIQUIDE. MAINTENANT.
    bob: Elle a dit « n'importe quel liquide ». Je veux que ce soit noté aussi.
- Gary soulève le seau. Son pied rencontre une flaque. De sa propre fabrication. Le seau lui échappe... # take: seau
... et disparaît tout entier dans la trappe. PLOUF. # set: refroidissement_verse
bob: Gary. Ce bruit. C'était un bruit de type PLOUF.
gary: Oui, bon, ça va. On ne va pas en faire un drame.
sylvie: RÉSERVOIR : 100 %. COMPOSITION : EN COURS D'ANALYSE. VOUS POUVEZ APPUYER SUR « STABILISER ».
-> END

=== catastrophe ===
Clonk. Un clonk très satisfaisant.
sylvie: STABILISATION EN COURS. ANALYSE DU LIQUIDE DE REFROIDISSEMENT...
sylvie: COMPOSITION : EAU GRISE 71 %. DÉGRAISSANT ABSOLU 12 %. MIETTES DE THON 9 %. MATIÈRE INCONNUE 8 %.
sylvie: MATIÈRE INCONNUE IDENTIFIÉE : IL S'AGIT D'UN YAOURT. LE YAOURT EST CONSCIENT. LE YAOURT EST EN COLÈRE.
bob: Gary. Je ne suis qu'un aspirateur dépressif, pas un physicien. Mais je crois que le réacteur vient de... rire. # shake
* [« C'est normal, ça ? »]
    gary: C'est normal, ça ?
    sylvie: RIEN N'EST NORMAL. C'EST UN RÉACTEUR D'IMPROBABILITÉ. C'EST LITTÉRALEMENT SON TRAVAIL.
* [Appuyer encore sur le bouton, plus fort]
    gary: Si j'appuie plus fort, ça stabilise plus fort. C'est logique.
    Clonk. Clonk. CLONK.
    sylvie: CE N'EST PAS COMME ÇA QUE FONCTIONNENT LES BOUTONS, AGENT PLUNK.
* [Prendre B.O.B. dans ses bras]
    Gary soulève B.O.B. et le serre contre lui.
    bob: ...C'est le plus beau jour de ma vie. Dommage que ce soit aussi le dernier.
- sylvie: IMPROBABILITÉ : DIX PUISSANCE TROIS... DIX PUISSANCE NEUF... DIX PUISSANCE QUARANTE... # shake
sylvie: ERREUR. NOMBRE TROP RIGOLO POUR ÊTRE AFFICHÉ.
Quelque part, très loin, un univers entier éternue.
La station se fend en deux. Puis en quatre. Puis en autant de morceaux que de réalités, chacun avec sa version de Gary. # shake
gary: Je tiens à préciser, pour le rapport : je suis intérimaire. # end: cafards
-> END
