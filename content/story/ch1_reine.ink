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
-> END

=== ch1_reine ===
{
- has_flag("ch1_eclat_stabilise"):
    reine: CETTE LUEUR... GARRY. TU AS LAVÉ LE PREMIER MONDE. NE ME LE RACONTE PAS : MONTRE-LE-MOI.
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
- reine: LA PROPHÉTIE EST CLAIRE. L'HOMME AU SEAU PORTERA « LE SIGNE ». MONTRE LE SIGNE AU GRAND SCRIBE, ET LE SEAU SERA À TOI.
gary: Le Signe. D'accord. Et c'est quoi, le Signe ?
reine: C'EST ÉCRIT DANS LA GALERIE DES OFFRANDES. TOUT EST ÉCRIT DANS LA GALERIE. NOUS AIMONS ÉCRIRE. # set: ch1_audience
-> END

= attente
reine: {~LE SIGNE, GARRY. LE GRAND SCRIBE ATTEND DANS LA GALERIE.|TU N'AS TOUJOURS PAS MONTRÉ LE SIGNE ? LA PROPHÉTIE EST PATIENTE. MOI, MOINS.|VA DANS LA GALERIE, GARRY. ET NE MARCHE PAS SUR LES FIDÈLES.}
-> END

= remise
reine: GARRY. LE GRAND SCRIBE A PARLÉ. TU ES L'HOMME AU SEAU.
reine: GARDES ! RENDEZ LE SEAU SACRÉ À SON PORTEUR.
Deux gardes apportent le Seau sur un coussin. Il étincelle. Il n'a jamais été aussi propre. # give: seau # set: ch1_seau_rendu
gary: Il est... impeccable. Il y avait un yaourt dedans, non ?
reine: IL Y EN AVAIT UN. UN ÊTRE LACTÉ. IL S'EST LEVÉ, IL NOUS A SALUÉS, ET IL EST PARTI FONDER QUELQUE CHOSE.
bob: Fonder quoi ? # mood: surprised
reine: IL N'A PAS VOULU LE DIRE. IL AVAIT L'AIR TRÈS DÉTERMINÉ. ET TRÈS FERMENTÉ.
reine: MAINTENANT, GARRY : LE TEMPLE DE L'ANCIEN COULOIR. UN MONDE Y ATTEND D'ÊTRE LAVÉ.
gary: Laver un monde. Avec un seau. Ce sont des heures sup', ça.
reine: ICI, LE TEMPS N'EXISTE PAS. DONC NON.
-> END

= temple
reine: {~LE TEMPLE, GARRY. AU FOND DE LA GALERIE. SI LA FOULE TE BLOQUE, SOUVIENS-TOI : NOUS SOMMES UN PEUPLE SIMPLE. NOUS AIMONS LE GOÛTER.|TU ES ENCORE LÀ ? LE PREMIER MONDE NE VA PAS SE LAVER TOUT SEUL.|L'HOMME AU SEAU NE TRAÎNE PAS DANS LA SALLE DU TRÔNE. IL VA LAVER DES MONDES.}
-> END
