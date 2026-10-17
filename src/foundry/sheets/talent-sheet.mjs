import {
    WEAPON_TALENT_TYPES
} from "../../domain/rules/weapon-talent-type.mjs";

import { MetroItemSheet }
    from "./metro-item-sheet.mjs";


export class TalentSheet
    extends MetroItemSheet {


    static DEFAULT_OPTIONS = {

        classes: [
            "metro-2033",
            "metro-item-sheet",
            "metro-talent-sheet"
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
                "systems/metro-2033-yze/templates/items/talent-sheet.hbs"
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
        // TALENT
        // ========================================================

        context.talent = {

            /**
             * Nouveau modèle cible.
             *
             * Le niveau réellement possédé par un Actor
             * ne sera pas stocké ici.
             */
            maxLevel:
                system.maxLevel
                ?? 1,


            /**
             * Données legacy conservées temporairement
             * jusqu'à migration complète de la progression
             * des Talents.
             *
             * Elles restent disponibles afin de ne pas
             * casser le template actuel avant son refactoring.
             */
            isAdvanced:
                system.isAdvanced
                ?? (
                    system.level === 2
                ),

            canAdvance:
                system.canAdvance
                ?? (
                    system.hasAdvancedLevel
                    && system.level === 1
                ),


            isGeneral:
                system.isGeneralTalent
                ?? (
                    !system.archetypeId
                )

        };


        // ========================================================
        // ATTRIBUTS
        // ========================================================

        context.attributeChoices =
            this._getAttributeChoices(
                system.configuration
                    ?.attribute
                ?? ""
            );


        // ========================================================
        // COMPÉTENCES
        // ========================================================

        context.skillChoices =
            this._getSkillChoices(
                system.configuration
                    ?.skill
                ?? ""
            );


        // ========================================================
        // CATÉGORIES D'ARME
        // ========================================================

        context.weaponCategoryChoices =
            this._getWeaponCategoryChoices(
                system.configuration
                    ?.weaponCategory
                ?? ""
            );


        // ========================================================
        // TYPE D'ARME (Spécialiste en armement)
        // ========================================================

        context.weaponTypeChoices =
            this._getWeaponTypeChoices(
                system.configuration
                    ?.weaponType
                ?? ""
            );


        return context;

    }


    /**
     * Types d'arme du Talent « Spécialiste en armement ».
     * Identifiants = ceux déduits de l'arme
     * (cf. domain/rules/weapon-talent-type.mjs).
     */
    _getWeaponTypeChoices(
        currentValue
    ) {

        return [
            { value: "", label: "—" },
            ...Object.entries(
                WEAPON_TALENT_TYPES
            ).map(
                ([value, label]) => ({ value, label })
            )
        ].map(
            choice => ({
                ...choice,
                selected:
                    choice.value
                    === currentValue
            })
        );

    }


    /**
     * Attributs disponibles pour
     * la configuration d'un Talent.
     */
    _getAttributeChoices(
        currentValue
    ) {

        const values = [

            {
                value: "",
                label: "—"
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
                    choice.value
                    === (
                        currentValue
                        ?? ""
                    )

            })
        );

    }


    /**
     * Compétences disponibles pour
     * la configuration d'un Talent.
     */
    _getSkillChoices(
        currentValue
    ) {

        const values = [

            {
                value: "",
                label: "—"
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
                    choice.value
                    === (
                        currentValue
                        ?? ""
                    )

            })
        );

    }


    /**
     * Catégories métier disponibles
     * pour la configuration d'un Talent.
     *
     * Les identifiants sont exactement
     * les mêmes que system.weaponCategory
     * dans WeaponDataModel.
     */
    _getWeaponCategoryChoices(
        currentValue
    ) {

        const values = [

            {
                value: "",
                label: "—"
            },

            {
                value: "assaultRifle",
                label: "Fusil d’assaut"
            },

            {
                value: "pistol",
                label: "Pistolet"
            },

            {
                value: "submachineGun",
                label: "Pistolet mitrailleur"
            },

            {
                value: "rifle",
                label: "Fusil"
            },

            {
                value: "rocketLauncher",
                label: "Lance-roquette"
            },

            {
                value: "shotgun",
                label: "Fusil à pompe"
            },

            {
                value: "lightMachineGun",
                label: "Mitrailleuse légère"
            },

            {
                value: "heavyMachineGun",
                label: "Mitrailleuse lourde"
            },

            {
                value: "revolver",
                label: "Revolver"
            },

            {
                value: "bladedWeapon",
                label: "Armes blanches"
            },

            {
                value: "bluntWeapon",
                label: "Armes contondantes"
            },

            {
                value: "unarmed",
                label: "Mains nues"
            },

            {
                value: "incendiaryWeapon",
                label: "Armes incendiaires"
            },

            {
                value: "explosiveWeapon",
                label: "Armes explosives"
            }

        ];


        return values.map(
            choice => ({

                ...choice,

                selected:
                    choice.value
                    === (
                        currentValue
                        ?? ""
                    )

            })
        );

    }

}