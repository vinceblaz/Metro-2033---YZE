import { MetroItemSheet }
    from "./metro-item-sheet.mjs";


/**
 * Fiche d'une munition Métro 2033.
 *
 * Responsabilités :
 *
 * - présenter les données de l'Item ammunition ;
 * - préparer les valeurs dérivées utiles à l'interface ;
 * - exposer les choix lisibles au template ;
 * - laisser les règles métier au DataModel et aux services.
 */
export class AmmunitionSheet
    extends MetroItemSheet {

    static DEFAULT_OPTIONS = {

        classes: [
            "metro-2033",
            "metro-item-sheet",
            "metro-ammunition-sheet"
        ],

        position: {
            width: 620,
            height: 720
        },

        form: {
            ...(super.DEFAULT_OPTIONS.form ?? {}),
            closeOnSubmit: false
        },

        window: {
            resizable: true
        }
    };


    static PARTS = {

        main: {
            template:
                "systems/metro-2033-yze/templates/items/ammunition-sheet.hbs"
        }
    };


    /**
     * Prépare le contexte Handlebars de la AmmunitionSheet.
     */
    async _prepareContext(
        options
    ) {

        const context =
            await super._prepareContext(
                options
            );


        const system =
            this.item.system;


        context.item =
            this.item;

        context.system =
            system;

        context.editable =
            this.isEditable;

        context.isGM =
            game.user.isGM;


        // ========================================================
        // FORME PHYSIQUE
        // ========================================================

        context.containerTypeChoices =
            this._getContainerTypeChoices(
                system.containerType
            );


        // ========================================================
        // MODE DE CONSOMMATION
        // ========================================================

        context.consumptionModeChoices =
            this._getConsumptionModeChoices(
                system.consumptionMode
            );


        // ========================================================
        // QUALITÉ
        // ========================================================

        context.qualityChoices =
            this._getQualityChoices(
                system.quality
            );


        // ========================================================
        // POIDS
        // ========================================================

        context.weightChoices =
            this._getWeightChoices(
                system.weight
            );


        return context;

    }


    /**
     * Choix de forme physique de la munition.
     */
    _getContainerTypeChoices(
        currentValue
    ) {

        const values = [

            {
                value: "magazine",
                label: "Chargeur"
            },

            {
                value: "cylinder",
                label: "Barillet"
            },

            {
                value: "belt",
                label: "Bande"
            },

            {
                value: "shell",
                label: "Cartouche"
            },

            {
                value: "arrow",
                label: "Flèche"
            },

            {
                value: "bolt",
                label: "Carreau"
            }

        ];


        return values.map(
            choice => ({

                ...choice,

                selected:
                    currentValue
                    === choice.value

            })
        );

    }


    /**
     * Choix du mode de consommation.
     */
    _getConsumptionModeChoices(
        currentValue
    ) {

        const values = [

            {
                value: "unit",
                label: "Unité"
            },

            {
                value: "container",
                label: "Conteneur"
            }

        ];


        return values.map(
            choice => ({

                ...choice,

                selected:
                    currentValue
                    === choice.value

            })
        );

    }


    /**
     * Choix de qualité.
     */
    _getQualityChoices(
        currentValue
    ) {

        const values = [

            {
                value: "standard",
                label: "Standard"
            },

            {
                value: "military",
                label: "Militaire"
            },

            {
                value: "poor",
                label: "Mauvaise qualité"
            }

        ];


        return values.map(
            choice => ({

                ...choice,

                selected:
                    currentValue
                    === choice.value

            })
        );

    }


    /**
     * Valeurs de poids autorisées.
     *
     * Les libellés sont destinés à l'interface,
     * tandis que le DataModel conserve les valeurs numériques.
     */
    _getWeightChoices(
        currentValue
    ) {

        const values = [

            {
                value: 0,
                label: "Minuscule (0)"
            },

            {
                value: 0.25,
                label: "Très léger (1/4)"
            },

            {
                value: 0.5,
                label: "Léger (1/2)"
            },

            {
                value: 1,
                label: "Standard (1)"
            },

            {
                value: 2,
                label: "Lourd (2)"
            },

            {
                value: 3,
                label: "Très lourd (3)"
            }

        ];


        return values.map(
            choice => ({

                ...choice,

                selected:
                    Number(
                        currentValue
                    )
                    === choice.value

            })
        );

    }

}