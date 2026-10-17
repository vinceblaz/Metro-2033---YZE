import { MetroItemSheet }
    from "./metro-item-sheet.mjs";


/**
 * Fiche Foundry VTT v14 d'une Blessure critique.
 *
 * Cette classe ne contient aucune règle métier.
 * Elle prépare uniquement les données nécessaires
 * à l'affichage et à l'édition de l'Item.
 *
 * Les comportements communs aux ItemSheets Métro 2033,
 * notamment la sauvegarde lors de la fermeture avec la X,
 * sont hérités de MetroItemSheet.
 */
export class CriticalInjurySheet
    extends MetroItemSheet {

    static DEFAULT_OPTIONS = {

        classes: [
            "metro-2033",
            "metro-item-sheet",
            "metro-critical-injury-sheet"
        ],

        position: {
            width: 620,
            height: 720
        }
    };


    static PARTS = {

        main: {
            template:
                "systems/metro-2033-yze/templates/items/critical-injury-sheet.hbs"
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
         * Données générales du document.
         */
        context.item =
            item;

        context.system =
            item.system;

        context.editable =
            this.isEditable;


        /*
         * Information de contexte :
         *
         * true lorsque la blessure est une copie
         * embarquée dans un Actor.
         */
        context.isEmbedded =
            item.isEmbedded === true;

        context.actor =
            item.actor ?? null;


        /*
         * Sécurité Note MJ.
         */
        context.isGM =
            game.user.isGM === true;


        /*
         * Données préparées pour le template.
         */
        context.injury = {

            d66:
                Number(item.system.d66 ?? 0),

            fatal:
                item.system.fatal === true,

            instantDeath:
                item.system.instantDeath === true,

            permanent:
                item.system.permanent === true,

            deathRollModifier:
                Number(
                    item.system.deathRollModifier ?? 0
                ),

            deathRollInterval:
                item.system.deathRollInterval ?? "",

            recoveryFormula:
                item.system.recoveryFormula ?? "",

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
            },

            death: {

                stabilized:
                    item.system.death
                        ?.stabilized === true,

                rolls:
                    Number(
                        item.system.death?.rolls
                        ?? 0
                    )
            }
        };


        return context;
    }
}