import {
    MetroActorSheet
} from "./metro-actor-sheet.mjs";

import {
    buildEmbeddedItemTooltip,
    htmlToPlainText
} from "../../domain/rules/embedded-item-tooltip.mjs";

import {
    prepareEmbeddedWeapons,
    prepareEmbeddedProtections,
    prepareEmbeddedAmmunition,
    prepareEmbeddedGear,
    prepareEmbeddedStatusEffects,
    bindEmbeddedWeaponListeners
} from "./embedded-weapon-attack.mjs";



/**
 * Groupes de Compétences par Attribut, avec leurs libellés
 * français, pour l'affichage de la fiche PNJ.
 *
 * Reprend exactement le regroupement de
 * src/domain/rules/skills.mjs (SKILL_DEFINITIONS) et les
 * libellés déjà utilisés côté Chat
 * (src/foundry/chat/yze-roll-chat.mjs).
 */
const SKILL_GROUPS = [

    {
        attribute: "vigor",
        attributeLabel: "Vigueur",
        skills: [
            { id: "repair", label: "Bricolage" },
            { id: "closeCombat", label: "Corps à corps" },
            { id: "endurance", label: "Endurance" }
        ]
    },

    {
        attribute: "agility",
        attributeLabel: "Agilité",
        skills: [
            { id: "stealth", label: "Discrétion" },
            { id: "reaction", label: "Réaction" },
            { id: "shooting", label: "Tir" }
        ]
    },

    {
        attribute: "spirit",
        attributeLabel: "Esprit",
        skills: [
            { id: "comprehension", label: "Compréhension" },
            { id: "observation", label: "Observation" },
            { id: "survival", label: "Survie" }
        ]
    },

    {
        attribute: "empathy",
        attributeLabel: "Empathie",
        skills: [
            { id: "analysis", label: "Analyse" },
            { id: "manipulation", label: "Manipulation" },
            { id: "medicine", label: "Médecine" }
        ]
    }

];


/**
 * Fiche Actor d'un Personnage Non-Joueur (PNJ).
 *
 * Fiche volontairement allégée par rapport à celle du
 * Personnage : pas d'onglets, un remplissage rapide pensé
 * pour le MJ (cf. discussion de conception, Bible v0.9.2).
 *
 * Les Talents/armes/protections restent embarqués comme de
 * simples Items Foundry ; l'ajout se fait par glisser-déposer
 * natif (aucune règle d'acquisition/XP ne s'applique à un
 * PNJ, à la différence du Personnage).
 */
export class NpcSheet extends MetroActorSheet {

    static DEFAULT_OPTIONS = {

        classes: [
            "metro-2033",
            "metro-actor-sheet",
            "metro-npc-sheet"
        ],

        position: {
            width: 560,
            height: 640
        }
    };


    static PARTS = {

        main: {
            template:
                "systems/metro-2033-yze/templates/actors/npc-sheet.hbs"
        }

    };


    async _prepareContext(
        options
    ) {

        const context =
            await super._prepareContext(
                options
            );

        const actor =
            this.actor;

        const system =
            actor.system;


        context.actor =
            actor;

        context.system =
            system;

        context.editable =
            this.isEditable;

        context.isGM =
            game.user.isGM === true;


        context.skillGroups =
            SKILL_GROUPS.map(
                group => ({

                    attribute:
                        group.attribute,

                    attributeLabel:
                        group.attributeLabel,

                    attributeValue:
                        system.attributes
                            ?.[group.attribute]
                            ?.value
                        ?? 0,

                    attributeMax:
                        system.attributes
                            ?.[group.attribute]
                            ?.max
                        ?? 0,

                    skills:
                        group.skills.map(
                            skill => ({

                                id:
                                    skill.id,

                                label:
                                    skill.label,

                                value:
                                    system.skills
                                        ?.[skill.id]
                                    ?? 0

                            })
                        )

                })
            );


        context.talents =
            this._prepareEmbeddedItems(
                "talent"
            );

        context.weapons =
            prepareEmbeddedWeapons(
                this.actor
            );

        context.protections =
            prepareEmbeddedProtections(
                this.actor
            );

        context.equippedWeapons =
            context.weapons.filter(
                weapon => weapon.equipped
            );

        context.equippedProtections =
            context.protections.filter(
                protection => protection.equipped
            );

        context.gearItems =
            prepareEmbeddedGear(
                this.actor
            );

        context.ammunitionItems =
            prepareEmbeddedAmmunition(
                this.actor
            );

        context.statusEffects =
            prepareEmbeddedStatusEffects(
                this.actor
            );


        return context;

    }


    /**
     * ViewModel minimal d'une liste d'Items embarqués
     * d'un type donné.
     */
    _prepareEmbeddedItems(
        type
    ) {

        return this.actor.items
            .filter(
                item =>
                    item.type === type
            )
            .map(
                item => ({

                    id:
                        item.id,

                    name:
                        item.name,

                    img:
                        item.img,

                    tooltip:
                        buildEmbeddedItemTooltip(
                            item
                        ),

                    effect:
                        item.type === "talent"
                            ? htmlToPlainText(
                                item.system?.effect
                                || item.system?.description
                                || ""
                            )
                            : ""

                })
            );

    }


    async _onRender(
        context,
        options
    ) {

        await super._onRender(
            context,
            options
        );


        bindEmbeddedWeaponListeners(
            this
        );


        this.element
            .querySelectorAll(
                "[data-action='open-embedded-item']"
            )
            .forEach(
                element => {

                    element.addEventListener(
                        "click",
                        () => {

                            const itemId =
                                element.dataset
                                    .itemId;

                            const item =
                                this.actor.items.get(
                                    itemId
                                );

                            item?.sheet?.render(
                                true
                            );

                        }
                    );

                }
            );


        this.element
            .querySelectorAll(
                "[data-action='delete-embedded-item']"
            )
            .forEach(
                element => {

                    element.addEventListener(
                        "click",
                        async () => {

                            const itemId =
                                element.dataset
                                    .itemId;

                            await this.actor
                                .deleteEmbeddedDocuments(
                                    "Item",
                                    [
                                        itemId
                                    ]
                                );

                        }
                    );

                }
            );

    }

}
