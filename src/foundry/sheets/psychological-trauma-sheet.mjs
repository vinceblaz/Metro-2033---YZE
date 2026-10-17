import { MetroItemSheet }
    from "./metro-item-sheet.mjs";


/**
 * Fiche Foundry VTT v14 d'un Traumatisme psychologique.
 *
 * Cette classe ne contient aucune règle métier.
 * Elle prépare uniquement les données nécessaires
 * à l'affichage et à l'édition de l'Item.
 *
 * Les comportements communs aux ItemSheets Métro 2033,
 * notamment la sauvegarde lors de la fermeture avec la X,
 * sont hérités de MetroItemSheet.
 */
export class PsychologicalTraumaSheet
    extends MetroItemSheet {

    static DEFAULT_OPTIONS = {

        classes: [
            "metro-2033",
            "metro-item-sheet",
            "metro-psychological-trauma-sheet"
        ],

        position: {
            width: 620,
            height: 720
        }
    };


    static PARTS = {

        main: {
            template:
                "systems/metro-2033-yze/templates/items/psychological-trauma-sheet.hbs"
        }

    };


    /**
     * Prépare le contexte passé au template.
     */
    async _prepareContext(options) {

        const context =
            await super._prepareContext(options);


        const item =
            this.item;


        /*
         * Données générales.
         */
        context.item =
            item;

        context.system =
            item.system;

        context.editable =
            this.isEditable;


        /*
         * Item embarqué dans un Actor.
         */
        context.isEmbedded =
            item.isEmbedded === true;

        context.actor =
            item.actor ?? null;


        /*
         * Accès MJ.
         */
        context.isGM =
            game.user.isGM === true;


        /*
         * Données préparées pour le template.
         */
        context.trauma = {

            d66: {

                min:
                    Number(
                        item.system.d66?.min
                        ?? 0
                    ),

                max:
                    Number(
                        item.system.d66?.max
                        ?? 0
                    )
            },

            instantDeath:
                item.system.instantDeath === true,

            recoveryFormula:
                item.system.recoveryFormula ?? "",

            permanent:
                item.system.permanent === true,

            recovery: {

                totalDays:
                    Number(
                        item.system.recovery?.totalDays
                        ?? 0
                    ),

                remainingDays:
                    Number(
                        item.system.recovery?.remainingDays
                        ?? 0
                    ),

                treatmentApplied:
                    item.system.recovery
                        ?.treatmentApplied === true,

                healed:
                    item.system.recovery
                        ?.healed === true
            }
        };


        return context;
    }
}