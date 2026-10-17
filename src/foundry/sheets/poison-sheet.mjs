import { MetroItemSheet }
    from "./metro-item-sheet.mjs";

import {
    getPoisonEffectTypeChoices
} from "../../domain/rules/poison.mjs";


/**
 * Fiche Foundry VTT v14 d'un Poison (livre, p.204-205).
 *
 * Cette classe ne contient aucune règle métier. Elle prépare
 * uniquement les données nécessaires à l'affichage/l'édition de
 * l'Item (type d'effet, Toxicité, source) et au rappel en
 * lecture seule du texte des effets complets/réduits du type
 * choisi (toujours lu depuis `domain/rules/poison.mjs`, seule
 * source de vérité).
 */
export class PoisonSheet
    extends MetroItemSheet {

    static DEFAULT_OPTIONS = {

        classes: [
            "metro-2033",
            "metro-item-sheet",
            "metro-poison-sheet"
        ],

        position: {
            width: 520,
            height: 420
        }
    };


    static PARTS = {

        main: {
            template:
                "systems/metro-2033-yze/templates/items/poison-sheet.hbs"
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


        context.item =
            item;

        context.system =
            item.system;

        context.editable =
            this.isEditable;

        context.isEmbedded =
            item.isEmbedded === true;


        /*
         * Pas de helper Handlebars personnalisé dans ce projet
         * (convention actée : les helpers custom se sont révélés
         * peu fiables, cf. Assistant de création de Personnage).
         * L'état "selected" de chaque option est donc précalculé
         * ici plutôt que comparé dans le template.
         */
        context.effectTypeChoices =
            getPoisonEffectTypeChoices().map(
                choice => ({
                    ...choice,
                    selected:
                        choice.key === item.system.effectType
                })
            );


        context.selectedEffectType =
            context.effectTypeChoices.find(
                choice => choice.selected === true
            )
            ?? null;


        return context;

    }

}
