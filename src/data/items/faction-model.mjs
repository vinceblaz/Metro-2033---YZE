const {
    SchemaField,
    StringField,
    HTMLField,
    ArrayField
} = foundry.data.fields;


/**
 * DataModel d'une Faction Métro 2033.
 *
 * Une Faction est un Item de référence décrivant un groupe
 * politique, militaire ou marchand du monde (Rangers de la
 * Ligne, IVe Reich, Ligne Rouge, Hanse...).
 *
 * Le nom et l'image sont portés directement par
 * Item.name et Item.img.
 *
 * Ce DataModel décrit uniquement les données persistantes.
 * Aucune règle métier (réputation, influence, etc.) n'est
 * calculée ici : elle sera gérée par des services dédiés
 * si nécessaire.
 *
 * Une Faction est référencée :
 * - par un Personnage, via system.affiliations.faction
 *   (UUID) ;
 * - par une Station, via system.controllingFaction (UUID).
 *
 * Le lien n'est volontairement maintenu que dans un sens
 * (Station → Faction). La fiche Faction n'affiche pas de
 * liste automatique des Stations qu'elle contrôle.
 */
export class FactionDataModel
    extends foundry.abstract.TypeDataModel {

    /**
     * Structure d'une relation avec une autre Faction.
     *
     * Reprend le motif déjà utilisé pour les relations
     * PJ / PNJ du Personnage (character-model.mjs).
     */
    static _relationField() {

        return new SchemaField({

            /*
             * UUID de l'Item Faction concerné.
             */
            faction: new StringField({
                required: true,
                blank: true,
                initial: ""
            }),

            /*
             * Nature de la relation.
             *
             * Exemples :
             * "Alliée"
             * "Neutre"
             * "Hostile"
             * "En guerre"
             *
             * String libre plutôt qu'un enum strict, afin
             * de rester ouvert à l'homebrew.
             */
            attitude: new StringField({
                required: true,
                blank: true,
                initial: ""
            }),

            description: new StringField({
                required: true,
                blank: true,
                initial: ""
            })
        });
    }


    /**
     * Structure d'un membre notable de la Faction.
     */
    static _memberField() {

        return new SchemaField({

            /*
             * UUID de l'Actor concerné (PNJ, PJ...).
             */
            actor: new StringField({
                required: true,
                blank: true,
                initial: ""
            }),

            /*
             * Rôle du membre au sein de la Faction.
             *
             * Exemples :
             * "Commandant de la garnison"
             * "Chef du marché noir"
             */
            role: new StringField({
                required: true,
                blank: true,
                initial: ""
            })
        });
    }


    static defineSchema() {

        return {

            // ====================================================
            // DESCRIPTION
            // ====================================================

            /*
             * Description publique de la Faction.
             *
             * Histoire, doctrine, mode de vie.
             *
             * Visible par les utilisateurs ayant accès à l'Item.
             */
            description: new HTMLField({
                required: true,
                blank: true,
                initial: ""
            }),

            /*
             * Idéologie / étiquette politique.
             *
             * Exemples :
             * "Militariste"
             * "Communiste"
             * "Fasciste"
             * "Marchande"
             *
             * String libre plutôt qu'un enum strict, afin
             * de rester ouvert à l'homebrew. La fiche Item
             * propose des suggestions courantes.
             */
            ideology: new StringField({
                required: true,
                blank: true,
                initial: ""
            }),

            /*
             * Chef de la Faction.
             *
             * Texte libre, ou UUID d'un Actor PNJ si celui-ci
             * existe déjà en tant que Document.
             */
            leader: new StringField({
                required: true,
                blank: true,
                initial: ""
            }),

            /*
             * Ressources / spécialités de la Faction.
             *
             * Ce qu'elle produit, contrôle ou échange.
             *
             * Exemple :
             * "Contrôle la production de munitions militaires."
             */
            resources: new HTMLField({
                required: true,
                blank: true,
                initial: ""
            }),


            // ====================================================
            // RELATIONS
            // ====================================================

            /*
             * Relations avec les autres Factions.
             */
            relations: new ArrayField(
                FactionDataModel._relationField()
            ),

            /*
             * Membres notables de la Faction.
             */
            notableMembers: new ArrayField(
                FactionDataModel._memberField()
            ),


            // ====================================================
            // NOTES MJ
            // ====================================================

            /*
             * Note privée du MJ.
             *
             * La restriction d'affichage et d'édition sera gérée
             * par la fiche Item.
             */
            gmNotes: new HTMLField({
                required: true,
                blank: true,
                initial: ""
            })
        };
    }
}
