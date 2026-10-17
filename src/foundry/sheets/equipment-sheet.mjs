import { MetroItemSheet }
    from "./metro-item-sheet.mjs";


/**
 * Fiche d'un équipement Métro 2033.
 *
 * La fiche :
 *
 * - expose les données du DataModel ;
 * - prépare les informations dérivées nécessaires à l'UI ;
 * - ne contient aucune logique de réparation ;
 * - ne modifie pas les règles métier.
 */
export class EquipmentSheet
    extends MetroItemSheet {


    static DEFAULT_OPTIONS = {

        ...super.DEFAULT_OPTIONS,

        classes: [
            ...(super.DEFAULT_OPTIONS.classes ?? []),
            "metro-equipment-sheet"
        ],

        position: {
            width: 620,
            height: 720
        },

        form: {

            ...(super.DEFAULT_OPTIONS.form ?? {}),

            closeOnSubmit:
                false,

            submitOnChange:
                true

        }

    };


    static PARTS = {

        form: {
            template:
                "systems/metro-2033-yze/templates/items/equipment-sheet.hbs"
        }

    };


    /**
     * Prépare les données nécessaires au template.
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


        return {

            ...context,


            // ====================================================
            // DOCUMENT
            // ====================================================

            item:
                this.item,

            system,


            // ====================================================
            // PERMISSIONS
            // ====================================================

            isGM:
                game.user.isGM,


            // ====================================================
            // ÉTAT DÉRIVÉ
            // ====================================================

            equipmentState:
                this._getEquipmentState(
                    system
                ),


            // ====================================================
            // ENCOMBREMENT
            // ====================================================

            encumbranceChoices:
                this._getEncumbranceChoices(
                    system.weight
                ),

            attributeChoices:
                this._getAttributeChoices(
                    system.attribute
                ),

            skillChoices:
                this._getSkillChoices(
                    system.skill
                )               

        };

    }


    /**
     * Transforme l'état métier du DataModel
     * en informations directement affichables.
     */
    _getEquipmentState(
        system
    ) {

        switch (
            system.conditionState
        ) {

            case "destroyed":

                return {
                    id:
                        "destroyed",

                    label:
                        "Détruit",

                    damaged:
                        true,

                    repairable:
                        false,

                    broken:
                        true
                };


            case "broken-repairable":

                return {
                    id:
                        "broken-repairable",

                    label:
                        "Hors d’usage — Réparable",

                    damaged:
                        true,

                    repairable:
                        true,

                    broken:
                        true
                };


            case "damaged-repairable":

                return {
                    id:
                        "damaged-repairable",

                    label:
                        "Abîmé — Réparable",

                    damaged:
                        true,

                    repairable:
                        true,

                    broken:
                        false
                };


            case "damaged":

                return {
                    id:
                        "damaged",

                    label:
                        "Abîmé — Irréparable",

                    damaged:
                        true,

                    repairable:
                        false,

                    broken:
                        false
                };


            case "good":

            default:

                return {
                    id:
                        "good",

                    label:
                        "Bon état",

                    damaged:
                        false,

                    repairable:
                        false,

                    broken:
                        false
                };

        }

    }


    /**
     * Valeurs d'encombrement autorisées.
     *
     * L'utilisateur voit les fractions,
     * mais le DataModel stocke les valeurs numériques.
     */
    _getEncumbranceChoices(
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

    /**
     * Attributs disponibles pour le bonus
     * d'un équipement.
     */
    _getAttributeChoices(
        currentValue
    ) {

        const values = [

            {
                value: "",
                label: "Aucun"
            },

            {
                value: "vigor",
                label: "Vigueur"
            },

            {
                value: "agility",
                label: "Agilité"
            },

            {
                value: "spirit",
                label: "Esprit"
            },

            {
                value: "empathy",
                label: "Empathie"
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
     * Compétences disponibles pour le bonus
     * d'un équipement.
     */
    _getSkillChoices(
        currentValue
    ) {

        const values = [

            {
                value: "",
                label: "Aucune"
            },

            {
                value: "repair",
                label: "Bricolage"
            },

            {
                value: "closeCombat",
                label: "Corps à corps"
            },

            {
                value: "endurance",
                label: "Endurance"
            },

            {
                value: "stealth",
                label: "Discrétion"
            },

            {
                value: "reaction",
                label: "Réaction"
            },

            {
                value: "shooting",
                label: "Tir"
            },

            {
                value: "comprehension",
                label: "Compréhension"
            },

            {
                value: "observation",
                label: "Observation"
            },

            {
                value: "survival",
                label: "Survie"
            },

            {
                value: "analysis",
                label: "Analyse"
            },

            {
                value: "manipulation",
                label: "Manipulation"
            },

            {
                value: "medicine",
                label: "Médecine"
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

}