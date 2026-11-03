// Chapitre 1 « Blattaria Prime » : l'arrivée au Nid Royal et les audiences de la Reine.

=== ch1_arrivee ===
...
Gary se relève. Le sol est tiède, collant, et il ne veut pas le lâcher. Au-dessus de lui, une couronne, et sous la couronne, Sa Majesté.
bob: Inventaire. Josiane : présente. Badge : présent. Seau : absent. Dignité : absente depuis longtemps. # mood: calm
gary: Où est mon seau ?
reine: L'HOMME AU SEAU SANS SEAU. LA PROPHÉTIE N'AVAIT PAS PRÉVU ÇA.
reine: TON SEAU EST PASSÉ PAR LA FAILLE AVANT TOI, GARRY. NOUS L'AVONS TROUVÉ. NOUS L'AVONS LÉCHÉ. CONSCIENCIEUSEMENT.
reine: IL REPOSE SUR L'AUTEL. TU L'AURAS QUAND TU AURAS PROUVÉ QUE TU ES L'HOMME AU SEAU.
gary: C'est mon seau. Ça ne prouve pas que je suis l'homme au seau, ça ?
reine: C'EST EXACTEMENT CE QUE DIRAIT UN IMPOSTEUR.
Les murs du Nid clignotent. Une seconde, la salle du trône est un peu plus petite. Puis elle revient, l'air de rien. # shake
gary: ...Vos murs viennent de clignoter.
reine: ILS FONT ÇA DEPUIS QUE L'ÉCLAT EST TOMBÉ DANS LE TEMPLE. LE NID SE REPLIE SUR LUI-MÊME, GARRY. HIER, LA NURSERIE ÉTAIT DANS LA NURSERIE. AUJOURD'HUI, ELLE EST AUSSI DANS LA CUISINE.
bob: Une faille d'improbabilité, Gary. Un petit bout de notre catastrophe. Elle a suivi le seau. Comme nous. # mood: sad
-> END

=== ch1_reine ===
{
- has_flag("ch1_eclat_stabilise"):
    reine: CETTE LUEUR... ET MES MURS QUI NE CLIGNOTENT PLUS. GARRY. TU TIENS L'ÉCLAT. NE ME LE RACONTE PAS : MONTRE-LE-MOI.
    -> END
- has_flag("ch1_seau_rendu"):
    -> temple
- has_flag("ch1_signe_reconnu"):
    -> remise
- has_flag("ch1_audience"):
    -> attente
- else:
    -> audience
}

= audience
reine: APPROCHE, GARRY. TU AS UNE QUESTION ? LES MESSIES ONT TOUJOURS DES QUESTIONS. C'EST FATIGANT.
* [« Je suis intérimaire. »]
    gary: Je dois vous prévenir : je suis intérimaire. En période d'essai. Un messie, ça a forcément un CDI.
    reine: LA PROPHÉTIE NE PARLE PAS DE CONTRAT. ELLE PARLE D'UN SEAU.
* [« Vous avez vu mon seau ? »]
    gary: Juste pour être sûr : c'est bien mon seau, sur l'autel ? Bleu, cabossé, odeur de catégorie 4 ?
    reine: IL NE SENT PLUS RIEN. NOUS Y AVONS VEILLÉ. AVEC NOS LANGUES.
    gary: J'aurais préféré ne pas savoir.
* [« Pourquoi moi ? »]
    gary: Pourquoi moi ? Il y a sûrement d'autres types avec des seaux, dans le multivers.
    reine: QUATRE MILLE QUATRE-VINGT-SEIZE. MAIS UN SEUL S'APPELLE GARRY.
- reine: ÉCOUTE LA PROPHÉTIE, GARRY. « QUAND LE NID SE REPLIERA, VIENDRA L'HOMME AU SEAU. IL TIENDRA L'ÉCLAT, ET LA FAILLE SE REFERMERA. »
gary: Tenir l'éclat. Refermer une faille. Je suis agent d'entretien. Je referme des placards. Parfois.
reine: UNE FAILLE EST UN GRAND PLACARD. MAIS D'ABORD : L'HOMME AU SEAU PORTERA « LE SIGNE ». MONTRE LE SIGNE AU GRAND SCRIBE, ET LE SEAU SERA À TOI.
gary: Le Signe. D'accord. Et c'est quoi, le Signe ?
reine: C'EST ÉCRIT DANS LA GALERIE DES OFFRANDES. TOUT EST ÉCRIT DANS LA GALERIE. NOUS AIMONS ÉCRIRE. # set: ch1_audience
-> END

= attente
reine: {~LE SIGNE, GARRY. LE GRAND SCRIBE ATTEND DANS LA GALERIE.|TU N'AS TOUJOURS PAS MONTRÉ LE SIGNE ? LA PROPHÉTIE EST PATIENTE. MON NID, MOINS. IL VIENT DE PERDRE UN ÉTAGE.|VA DANS LA GALERIE, GARRY. ET NE MARCHE PAS SUR LES FIDÈLES. NI SUR LEURS DOUBLES.}
-> END

= remise
reine: GARRY. LE GRAND SCRIBE A PARLÉ. IL A MÊME PLEURÉ. C'EST LA PREMIÈRE FOIS DEPUIS LE DÉLUGE DE DÉSINFECTANT.
reine: MAIS AVANT DE TE RENDRE LE SEAU, JE VEUX L'ENTENDRE DE TA BOUCHE. QUE FERAS-TU DE L'ÉCLAT, HOMME AU SEAU ?
* [« Le contenir. »]
    gary: Le contenir. Couvercle, scotch, étiquette « NE PAS OUVRIR ». Protocole de catégorie 4.
    reine: UNE ÉTIQUETTE. SUR L'IMPROBABILITÉ. ... C'EST SI BÊTE QUE ÇA PEUT MARCHER.
* [« Aucune idée. »]
    gary: Honnêtement ? Aucune idée. Je suis intérimaire. On ne me donne jamais la fiche de poste avant.
    reine: PARFAIT. LES MESSIES QUI ONT UN PLAN FINISSENT EN STATUE. LES AUTRES FINISSENT LE TRAVAIL.
* [« Je peux juste avoir mon seau ? »]
    gary: Je peux juste avoir mon seau ? C'est pour ça que je suis venu, à la base.
    reine: IL RÉCLAME SON SEAU AVANT LA GLOIRE. AUCUN IMPOSTEUR N'EST AUSSI PEU AMBITIEUX.
- reine: ÉCOUTE BIEN. SI LA FAILLE GRANDIT, MON NID SE REPLIE EN UN POINT. UN POINT TRÈS DENSE. TRÈS ÉTROIT. AVEC NOUS DEDANS. ET TOI AUSSI.
gary: Donc je ne suis pas vraiment volontaire.
reine: PERSONNE NE L'EST, GARRY. C'EST POUR ÇA QU'ON APPELLE ÇA UNE PROPHÉTIE.
reine: GARDES ! RENDEZ LE SEAU SACRÉ À SON PORTEUR.
Deux gardes apportent le Seau sur un coussin. Il étincelle. Il n'a jamais été aussi propre. # give: seau # set: ch1_seau_rendu
gary: Il est... impeccable. Il y avait un yaourt dedans, non ?
reine: IL S'EST LEVÉ, IL NOUS A SALUÉS, ET IL EST PARTI FONDER QUELQUE CHOSE. IL AVAIT L'AIR TRÈS DÉTERMINÉ. ET TRÈS FERMENTÉ.
reine: MAINTENANT : LE TEMPLE DE L'ANCIEN COULOIR. L'ÉCLAT Y SAIGNE DE L'IMPROBABILITÉ. TIENS-LE, ET REFERME LA FAILLE.
gary: Contenir une faille dimensionnelle. Avec un seau. Ce sont des heures sup', ça.
reine: ICI, LE TEMPS N'EXISTE PAS. DONC NON.
-> END

= temple
reine: {~LE TEMPLE, GARRY. AU FOND DE LA GALERIE. SI LA FOULE TE BLOQUE, SOUVIENS-TOI : NOUS SOMMES UN PEUPLE SIMPLE. NOUS AIMONS LE GOÛTER.|TU ES ENCORE LÀ ? LA FAILLE NE VA PAS SE REFERMER TOUTE SEULE. CE MATIN, MON TRÔNE ÉTAIT AU PLAFOND.|L'HOMME AU SEAU NE TRAÎNE PAS DANS LA SALLE DU TRÔNE. IL VA TENIR L'ÉCLAT.}
-> END
