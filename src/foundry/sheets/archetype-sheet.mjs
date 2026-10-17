import { MetroItemSheet }
    from "./metro-item-sheet.mjs";

import {
    getArchetypeDefinition,
    getArchetypeDefinitions
} from "../../domain/rules/archetypes.mjs";


export class ArchetypeSheet
    extends MetroItemSheet {


    static DEFAULT_OPTIONS = {

        ...super.DEFAULT_OPTIONS,

        classes: [
            "metro-2033",
            "metro-item-sheet",
            "metro-archetype-sheet"
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
            ...(super.DEFAULT_OPTIONS.window ?? {}),
            resizable: true
        }

    };


    static PARTS = {

        main: {
            template:
                "systems/metro-2033-yze/templates/items/archetype-sheet.hbs"
        }

    };


    /**
     * Prépare le contexte transmis
     * au template Handlebars.
     */
    async _prepareContext(
        options
    ) {

        const context =
            await super._prepareContext(options);


        const key =
            String(
                this.item.system.key
                ?? ""
            ).trim();


        const definition =
            getArchetypeDefinition(
                key
            );

        const attributeLabels = {

            vigor:
                "Vigueur",

            agility:
                "Agilité",

            spirit:
                "Esprit",

            empathy:
                "Empathie"

        };


        const skillLabels = {

            repair:
                "Bricolage",

            closeCombat:
                "Corps à corps",

            endurance:
                "Endurance",

            stealth:
                "Discrétion",

            reaction:
                "Réaction",

            shooting:
                "Tir",

            comprehension:
                "Compréhension",

            observation:
                "Observation",

            survival:
                "Survie",

            analysis:
                "Analyse",

            manipulation:
                "Manipulation",

            medicine:
                "Médecine"

        };




        context.item =
            this.item;

        context.system =
            this.item.system;

        context.editable =
            this.isEditable;

        context.isGM =
            game.user.isGM;


        /**
         * Définitions canoniques disponibles.
         *
         * La Sheet ne duplique pas leurs règles :
         * elle les utilise uniquement
         * pour construire son interface.
         */
        context.archetypeDefinitions =
            getArchetypeDefinitions()
                .map(
                    archetype => ({
                        id:
                            archetype.id,

                        label:
                            archetype.label,

                        selected:
                            archetype.id
                            === key
                    })
                );


        /**
         * Définition canonique actuellement liée
         * à cet Item.
         */
        context.archetype = {

            definition,

            isKnown:
                Boolean(
                    definition
                ),

            hasAttributeChoice:
                Boolean(
                    definition
                        ?.attributeChoices
                        ?.length
                ),

            attributeChoices:
                (
                    definition
                        ?.attributeChoices
                    ?? []
                ).map(
                    attributeId => ({
                        id:
                            attributeId,

                        label:
                            attributeLabels[
                                attributeId
                            ]
                            ?? attributeId,

                        selected:
                            attributeId
                            === (
                                this.item.system
                                    .configuration
                                    ?.attribute
                                ?? ""
                            )
                    })
                ),

            hasSkillChoice:
                Boolean(
                    definition
                        ?.skillChoices
                        ?.length
                ),

            skillChoices:
                (
                    definition
                        ?.skillChoices
                    ?? []
                )
                    .flat()
                    .map(
                        skillId => ({
                            id:
                                skillId,

                            label:
                                skillLabels[
                                    skillId
                                ]
                                ?? skillId,

                            selected:
                                skillId
                                === (
                                    this.item.system
                                        .configuration
                                        ?.skill
                                    ?? ""
                                )
                        })
                    )

        };


        return context;

    }

    /**
     * Active les interactions propres
     * à la fiche d'Archétype.
     *
     * Le changement de définition modifie uniquement
     * l'état du formulaire affiché.
     *
     * Aucune mise à jour du Document n'est effectuée ici :
     * MetroItemSheet sauvegardera le formulaire
     * lors de la fermeture avec X.
     */
    _onRender(
        context, options

    ) {

        super._onRender(
            context,
            options
        );


        const root =
            this.element;


        if (!root) {
            return;
        }


        const archetypeSelect =
            root.querySelector(
                '[name="system.key"]'
            );


        if (!archetypeSelect) {
            return;
        }


        archetypeSelect.addEventListener(
            "change",
            event => {

                this._refreshArchetypeConfiguration(
                    event.currentTarget.value
                );

            }
        );

    }


    /**
     * Met à jour la zone de configuration
     * en fonction de la définition sélectionnée.
     *
     * Cette méthode ne sauvegarde rien.
     * Elle modifie seulement les champs du formulaire.
     */
    _refreshArchetypeConfiguration(
        archetypeKey
    ) {

        const root =
            this.element;


        if (!root) {
            return;
        }


        const definition =
            getArchetypeDefinition(
                archetypeKey
            );

        const attributeLabels = {

            vigor:
                "Vigueur",

            agility:
                "Agilité",

            spirit:
                "Esprit",

            empathy:
                "Empathie"

        };


        const skillLabels = {

            repair:
                "Bricolage",

            closeCombat:
                "Corps à corps",

            endurance:
                "Endurance",

            stealth:
                "Discrétion",

            reaction:
                "Réaction",

            shooting:
                "Tir",

            comprehension:
                "Compréhension",

            observation:
                "Observation",

            survival:
                "Survie",

            analysis:
                "Analyse",

            manipulation:
                "Manipulation",

            medicine:
                "Médecine"

        };


        const attributeField =
            root.querySelector(
                "[data-archetype-attribute-field]"
            );

        const attributeSelect =
            root.querySelector(
                '[name="system.configuration.attribute"]'
            );


        const skillField =
            root.querySelector(
                "[data-archetype-skill-field]"
            );

        const skillSelect =
            root.querySelector(
                '[name="system.configuration.skill"]'
            );


        /*
        * Choix d'attribut.
        */
        const attributeChoices =
            definition?.attributeChoices
            ?? [];


        if (attributeField) {

            attributeField.hidden =
                attributeChoices.length === 0;

        }


        if (attributeSelect) {

            attributeSelect.innerHTML =
                '<option value="">—</option>';


            for (
                const attributeId
                of attributeChoices
            ) {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    attributeId;

                option.textContent =
                    attributeLabels[
                        attributeId
                    ]
                    ?? attributeId;

                attributeSelect.append(
                    option
                );

            }


            /*
            * Tout changement de définition
            * invalide l'ancien choix.
            */
            attributeSelect.value =
                "";

        }


        /*
        * Choix de compétence.
        */
        const skillChoices =
            (
                definition?.skillChoices
                ?? []
            ).flat();


        if (skillField) {

            skillField.hidden =
                skillChoices.length === 0;

        }


        if (skillSelect) {

            skillSelect.innerHTML =
                '<option value="">—</option>';


            for (
                const skillId
                of skillChoices
            ) {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    skillId;

                option.textContent =
                    skillLabels[
                        skillId
                    ]
                    ?? skillId;

                skillSelect.append(
                    option
                );

            }


            /*
            * Tout changement de définition
            * invalide l'ancien choix.
            */
            skillSelect.value =
                "";

        }


        /*
        * Message lorsque l'Archétype
        * ne nécessite aucune configuration.
        */
        const emptyMessage =
            root.querySelector(
                "[data-archetype-no-configuration]"
            );


        if (emptyMessage) {

            emptyMessage.hidden =
                (
                    attributeChoices.length > 0
                    || skillChoices.length > 0
                );

        }

    }    

}