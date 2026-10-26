import {
    decideAffiliationDrop
} from "../../domain/rules/affiliation-drop.mjs";

import {
    MetroActorSheet
} from "./metro-actor-sheet.mjs";

import {
    YZERollChat
} from "../chat/yze-roll-chat.mjs";

import {
    evaluateSkillImprovement
} from "../../domain/rules/skill-progression.mjs";

import {
    isStackableItemType,
    computeStackIdentity,
    sumAmmunitionQuantities,
    sumConsumableQuantities
} from "../../domain/rules/item-stacking.mjs";


import {
    MeleeAttackWorkflowService
} from "../../combat/melee-attack-workflow-service.mjs";

import {
    MeleeAttackChat
} from "../../combat/melee-attack-chat.mjs";

import {
    AttributeRollPreparationService
} from "../../action-resolution/attribute-roll-preparation-service.mjs";

import {
    SkillRollPreparationService
} from "../../action-resolution/skill-roll-preparation-service.mjs";

import {
    RangedAttackPreparationService
} from "../../action-resolution/ranged-attack-preparation-service.mjs";

import {
    ActionModifierDialog
} from "../applications/action-modifier-dialog.mjs";

import {
    rollStationSurvivalForActor
} from "../station/station-survival-roll.mjs";

import {
    canAcquireTalent,
    canAcquireArchetype
} from "../../domain/rules/embedded-item-acquisition.mjs";

import {
    resolveReserveRoll
} from "../../domain/rules/reserve-roll.mjs";

import {
    resolveRadiationEffectsRoll
} from "../../domain/rules/radiation-effects-roll.mjs";

import {
    resolveRest
} from "../../domain/rules/rest.mjs";

import {
    SecondWindChat
} from "../chat/second-wind-chat.mjs";

import {
    TALENT_IDENTITIES
} from "../../domain/rules/talent-identity.mjs";

import {
    isSecondWindAvailable
} from "../../domain/rules/second-wind.mjs";


import {
    getPoisonEffectType
} from "../../domain/rules/poison.mjs";

import {
    ILLNESS_STATUS_EFFECT
} from "../../domain/rules/illness.mjs";

import {
    computeDeathRollDicePool,
    resolveDeathRollOutcome
} from "../../domain/rules/death-roll.mjs";

import {
    buildChoicesReminder
} from "../../domain/rules/choices-reminder.mjs";

import {
    STANDARD_RANGED_STUNT_DEFINITIONS
} from "../applications/ranged-stunt-dialog.mjs";

import {
    MELEE_STUNT_DEFINITIONS
} from "../../domain/rules/melee-stunts.mjs";

import {
    MELEE_BLOCK_STUNT_DEFINITIONS
} from "../../domain/rules/melee-block-stunts.mjs";

import {
    DicePool
} from "../../domain/rolls/dice-pool.mjs";

import {
    YZERoll
} from "../../domain/rolls/yze-roll.mjs";

import {
    rollPhysicalDice,
    createDieDrawer
} from "../rolls/physical-dice-roller.mjs";




/**
 * Fiche Foundry VTT v14 d'un personnage Métro 2033.
 *
 * Cette classe ne contient aucune règle métier.
 *
 * Elle prépare les données nécessaires à l'affichage
 * du personnage et transmet les actions de l'utilisateur
 * à l'Actor ou aux services métier.
 *
 * Les comportements communs aux ActorSheets Métro 2033,
 * notamment la sauvegarde lors de la fermeture avec la X,
 * sont hérités de MetroActorSheet.
 */
export class CharacterSheet
    extends MetroActorSheet {

    _talentSortAscending = true;

    static DEFAULT_OPTIONS = {

        classes: [
            "metro-2033",
            "metro-actor-sheet",
            "metro-character-sheet"
        ],

        position: {
            width: 700,
            height: 780
        }
    };


    /**
     * Parties Handlebars de la fiche.
     */
    static PARTS = {

        main: {
            template:
                "systems/metro-2033-yze/templates/actors/character-sheet.hbs"
        }

    };


    /**
     * Prépare le contexte passé au template.
     */
    async _prepareContext(
        options
    ) {

        const context =
            await super._prepareContext(
                options
            );

        const actor =
            this.actor;


        context.actor =
            actor;

        context.system =
            actor.system;

        context.editable =
            this.isEditable;

        context.isGM =
            game.user.isGM === true;


        // ========================================================
        // XP
        // ========================================================

        const xpAvailable =
            Number(
                actor.system.progression
                    ?.xp?.available
                ?? 0
            );

        const xpSpent =
            Number(
                actor.system.progression
                    ?.xp?.spent
                ?? 0
            );


        // ========================================================
        // ARCHÉTYPE
        // ========================================================

        const archetype =
            this._prepareArchetype();


        // ========================================================
        // VIEWMODEL PRINCIPAL
        // ========================================================

        context.character = {

            identity: {

                name:
                    actor.name
                    ?? "",

                img:
                    actor.img
                    ?? "",

                /*
                 * Champ historique conservé temporairement
                 * pour compatibilité avec les Actors existants.
                 *
                 * Les règles utilisent désormais archetypeId.
                 */
                archetype:
                    actor.system.identity
                        ?.archetype
                    ?? "",

                archetypeId:
                    actor.system.identity
                        ?.archetypeId
                    ?? "",

                archetype,

                gender:
                    actor.system.identity
                        ?.gender
                    ?? "",

                age:
                    Number(
                        actor.system.identity
                            ?.age
                        ?? 0
                    )
            },


            attributes: {

                vigor:
                    actor.system.attributes
                        ?.vigor,

                agility:
                    actor.system.attributes
                        ?.agility,

                spirit:
                    actor.system.attributes
                        ?.spirit,

                empathy:
                    actor.system.attributes
                        ?.empathy
            },


            xp: {

                available:
                    xpAvailable,

                spent:
                    xpSpent,

                total:
                    xpAvailable
                    + xpSpent
            },

            skillGroups:
                this._prepareSkillGroups(),

            talents:
                this._prepareTalents(),

            combat:
                this._prepareCombat(),

            reminders:
                buildChoicesReminder({
                    meleeStunts:
                        Object.values(
                            MELEE_STUNT_DEFINITIONS
                        ),
                    rangedStunts:
                        STANDARD_RANGED_STUNT_DEFINITIONS,
                    blockStunts:
                        Object.values(
                            MELEE_BLOCK_STUNT_DEFINITIONS
                        )
                }),

            equipment:
                this._prepareEquipmentTab(),

            survival:
                this._prepareSurvivalTab(),

            biography:
                await this._prepareBiographyTab(),

            talentSortAscending:
                this._talentSortAscending
                    };

        return context;
    }


    /**
     * Prépare le ViewModel de sélection
     * de l'archétype.
     *
     * Les définitions canoniques viennent
     * du domaine métier.
     *
     * La CharacterSheet ne redéfinit donc
     * ni les archétypes, ni leurs règles.
     */
    _prepareArchetype(
        
    ) {

        const actor =
            this.actor;


        // ========================================================
        // ITEM ARCHÉTYPE
        // ========================================================

        const item =
            actor.getArchetypeItem();


        const definition =
            actor.getArchetypeDefinition();


        // ========================================================
        // LABELS DE PRÉSENTATION
        // ========================================================

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


        // ========================================================
        // AUCUN ITEM ARCHÉTYPE
        // ========================================================

        if (!item) {

            return {

                hasItem:
                    false,

                itemId:
                    null,

                uuid:
                    null,

                name:
                    "",

                img:
                    "",

                key:
                    "",

                label:
                    "",

                attribute:
                    null,

                attributeLabel:
                    "",

                skills:
                    [],

                hasAttributeChoice:
                    false,

                hasSkillChoice:
                    false

            };
        }


        // ========================================================
        // ATTRIBUT EFFECTIF
        // ========================================================

        const attribute =
            actor.getArchetypeAttribute();


        // ========================================================
        // COMPÉTENCES EFFECTIVES
        // ========================================================

        const skills =
            actor
                .getArchetypeSkills()
                .map(
                    skillId => ({

                        id:
                            skillId,

                        label:
                            skillLabels[
                                skillId
                            ]
                            ?? skillId

                    })
                );


        // ========================================================
        // VIEWMODEL ITEM-BACKED
        // ========================================================

        return {

            hasItem:
                true,

            itemId:
                item.id,

            uuid:
                item.uuid,

            name:
                item.name,

            img:
                item.img,

            key:
                item.system?.key
                ?? "",

            label:
                definition?.label
                ?? item.name,

            attribute,

            attributeLabel:
                attribute
                    ? (
                        attributeLabels[
                            attribute
                        ]
                        ?? attribute
                    )
                    : "",

            skills,

            hasAttributeChoice:
                (
                    definition
                        ?.attributeChoices
                        ?.length
                    ?? 0
                ) > 0,

            hasSkillChoice:
                (
                    definition
                        ?.skillChoices
                        ?.length
                    ?? 0
                ) > 0

        };
    }


    /**
     * Prépare les compétences regroupées
     * par attribut pour l'affichage.
     *
     * L'association compétence -> attribut
     * reste déterminée par l'Actor et les règles métier.
     *
     * La CharacterSheet ne détermine pas elle-même
     * si une compétence est une compétence d'archétype.
     * Cette information est demandée à l'Actor.
     *
     * Le calcul du coût d'amélioration reste délégué
     * au service métier de progression.
     */
    _prepareSkillGroups() {

        const actor =
            this.actor;


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


        const groups = {

            vigor: {
                id:
                    "vigor",

                label:
                    "Vigueur",

                skills:
                    []
            },

            agility: {
                id:
                    "agility",

                label:
                    "Agilité",

                skills:
                    []
            },

            spirit: {
                id:
                    "spirit",

                label:
                    "Esprit",

                skills:
                    []
            },

            empathy: {
                id:
                    "empathy",

                label:
                    "Empathie",

                skills:
                    []
            }

        };


        const availableXp =
            Number(
                actor.system.progression
                    ?.xp?.available
                ?? 0
            );


        for (
            const skillId
            of Object.keys(
                actor.system.skills
                ?? {}
            )
        ) {

            const attributeId =
                actor.getSkillAttribute(
                    skillId
                );


            const group =
                groups[
                    attributeId
                ];


            /*
             * Une compétence inconnue ou sans attribut
             * valide n'est pas affichée.
             */
            if (!group) {
                continue;
            }


            const value =
                Number(
                    actor.system.skills[
                        skillId
                    ]
                    ?? 0
                );


            const isArchetypeSkill =
                actor.isArchetypeSkill(
                    skillId
                );


            const progression =
                evaluateSkillImprovement({

                    currentLevel:
                        value,

                    availableXp,

                    isArchetypeSkill

                });


            /*
             * Le passage 0 -> 1 demande une validation
             * narrative du MJ.
             *
             * Le système ne tente pas de vérifier
             * automatiquement si le personnage
             * a utilisé la compétence sans formation
             * ou reçu un enseignement.
             *
             * Un MJ peut effectuer directement
             * l'amélioration.
             */
            const canImprove =
                progression.allowed
                && (
                    !progression.requiresGMApproval
                    || game.user.isGM === true
                );


            group.skills.push({

                id:
                    skillId,

                label:
                    skillLabels[
                        skillId
                    ]
                    ?? skillId,

                attributeId,

                attributeLabel:
                    group.label,

                value,


                progression: {

                    allowed:
                        progression.allowed,

                    canImprove,

                    cost:
                        progression.cost,

                    reason:
                        progression.reason,

                    requiresGMApproval:
                        progression.requiresGMApproval,

                    isArchetypeSkill

                }

            });

        }


        return [
            groups.vigor,
            groups.agility,
            groups.spirit,
            groups.empathy
        ];
    }

    /**
     * Prépare les données nécessaires
     * à l'onglet Combat.
     *
     * Cette méthode ne contient aucune règle métier.
     *
     * Elle :
     * - sélectionne les armes équipées ;
     * - expose les munitions disponibles déjà filtrées
     *   par l'Actor ;
     * - sélectionne les protections équipées ;
     * - prépare les données dérivées nécessaires
     *   à leur affichage.
     */
    _prepareCombat(
        
    ) {

        const actor =
            this.actor;

        const rangeLabels = {

            contact:
                "Contact",

            short:
                "Courte",

            medium:
                "Moyenne",

            long:
                "Longue",

            extreme:
                "Extrême"

        };            

        // ========================================================
        // ARMES ÉQUIPÉES
        // ========================================================

        const weapons =
            actor.items
                .filter(
                    item =>
                        item.type === "weapon"
                        && item.system?.equipped === true
                )
                .map(
                    weapon => {

                        const category =
                            weapon.system?.category
                            ?? "";


                        const isMelee =
                            category === "melee";


                        const isRanged =
                            category === "ranged";


                        const requiresAmmunition =
                            weapon.system
                                ?.requiresAmmunition
                            ?? false;


                        // ====================================================
                        // MUNITION ACTUELLEMENT AFFECTÉE
                        // ====================================================

                        const assignedAmmunitionId =
                            weapon.system
                                ?.magazine
                                ?.sourceAmmoItemId
                            ?? "";


                        const assignedItem =
                            assignedAmmunitionId
                                ? actor.items.get(
                                    assignedAmmunitionId
                                )
                                : null;


                        const assignedAmmunition =
                            (
                                assignedItem
                                && assignedItem.type
                                    === "ammunition"
                            )
                                ? {

                                    id:
                                        assignedItem.id,

                                    uuid:
                                        assignedItem.uuid,

                                    name:
                                        assignedItem.name,

                                    img:
                                        assignedItem.img,

                                    quantity:
                                        Number(
                                            assignedItem.system
                                                ?.quantity
                                            ?? 0
                                        ),

                                    ammoType:
                                        assignedItem.system
                                            ?.ammoType
                                        ?? "",

                                    consumptionMode:
                                        assignedItem.system
                                            ?.consumptionMode
                                        ?? "",

                                    containerType:
                                        assignedItem.system
                                            ?.containerType
                                        ?? "",

                                    quality:
                                        assignedItem.system
                                            ?.quality
                                        ?? "standard",

                                    protectionReduction:
                                        Number(
                                            assignedItem.system
                                                ?.protectionReduction
                                            ?? 0
                                        ),

                                    ignoresResilience:
                                        assignedItem.system
                                            ?.ignoresResilience
                                        === true

                                }
                                : null;


                        // ====================================================
                        // MUNITIONS DISPONIBLES
                        // ====================================================

                        const availableAmmunition =
                            (
                                isRanged
                                && requiresAmmunition
                                && typeof actor
                                    .getAvailableAmmunitionForWeapon
                                    === "function"
                            )
                                ? actor
                                    .getAvailableAmmunitionForWeapon(
                                        weapon
                                    )
                                    .map(
                                        ammunition => ({

                                            id:
                                                ammunition.id,

                                            uuid:
                                                ammunition.uuid,

                                            name:
                                                ammunition.name,

                                            img:
                                                ammunition.img,

                                            quantity:
                                                Number(
                                                    ammunition.system
                                                        ?.quantity
                                                    ?? 0
                                                ),

                                            ammoType:
                                                ammunition.system
                                                    ?.ammoType
                                                ?? "",

                                            consumptionMode:
                                                ammunition.system
                                                    ?.consumptionMode
                                                ?? "",

                                            containerType:
                                                ammunition.system
                                                    ?.containerType
                                                ?? "",

                                            quality:
                                                ammunition.system
                                                    ?.quality
                                                ?? "standard",

                                            protectionReduction:
                                                Number(
                                                    ammunition.system
                                                        ?.protectionReduction
                                                    ?? 0
                                                ),

                                            ignoresResilience:
                                                ammunition.system
                                                    ?.ignoresResilience
                                                === true,

                                            selected:
                                                ammunition.id
                                                === assignedAmmunitionId

                                        })
                                    )
                                : [];


                        return {

                            id:
                                weapon.id,

                            uuid:
                                weapon.uuid,

                            name:
                                weapon.name,

                            img:
                                weapon.img,

                            category,

                            isMelee,

                            isRanged,

                            equipped:
                                true,

                            bonus:
                                Number(
                                    weapon.system
                                        ?.bonus
                                        ?.current
                                    ?? 0
                                ),

                            bonusMax:
                                Number(
                                    weapon.system
                                        ?.bonus
                                        ?.max
                                    ?? 0
                                ),

                            damage:
                                Number(
                                    weapon.system
                                        ?.damage
                                    ?? 0
                                ),

                            reliability:
                                Number(
                                    weapon.system
                                        ?.reliability
                                    ?? 0
                                ),

                            range:
                                weapon.system
                                    ?.range
                                ?? "",

                            rangeLabel:
                                rangeLabels[
                                    weapon.system?.range
                                ]
                                ?? weapon.system?.range
                                ?? "",

                            automatic:
                                weapon.system
                                    ?.automatic
                                === true,

                            heavy:
                                weapon.system
                                    ?.heavy
                                === true,

                            explosive:
                                weapon.system
                                    ?.explosive
                                === true,

                            canFire:
                                weapon.system
                                    ?.canFire
                                ?? false,


                            ammunition: {

                                required:
                                    requiresAmmunition,

                                assigned:
                                    assignedAmmunition,

                                hasAssigned:
                                    assignedAmmunition
                                    !== null,

                                available:
                                    availableAmmunition,

                                hasAvailable:
                                    availableAmmunition.length
                                    > 0

                            }

                        };

                    }
                );


        // ========================================================
        // PROTECTIONS ÉQUIPÉES
        // ========================================================

        const protections =
            actor.items
                .filter(
                    item =>
                        item.type === "armor"
                        && item.system?.equipped === true
                )
                .map(
                    armor => {

                        const category =
                            armor.system?.category
                            ?? "";


                        const protectionCurrent =
                            Number(
                                armor.system
                                    ?.protection
                                    ?.current
                                ?? 0
                            );


                        const protectionMax =
                            Number(
                                armor.system
                                    ?.protection
                                    ?.max
                                ?? 0
                            );


                        /*
                        * La règle d'utilisation réelle
                        * appartient déjà au DataModel.
                        *
                        * La CharacterSheet ne la recalcule pas.
                        */
                        const usableProtection =
                            Number(
                                armor.system
                                    ?.usableProtection
                                ?? 0
                            );


                        const resilience =
                            armor.system
                                ?.resilience
                            === true;


                        const activeResilience =
                            armor.system
                                ?.activeResilience
                            === true;


                        return {

                            id:
                                armor.id,

                            uuid:
                                armor.uuid,

                            name:
                                armor.name,

                            img:
                                armor.img,

                            category,

                            isBodyArmor:
                                category === "body",

                            isHelmet:
                                category === "helmet",

                            categoryLabel:
                                category === "helmet"
                                    ? "Tête"
                                    : "Corps",

                            equipped:
                                true,

                            protectionCurrent,

                            protectionMax,

                            usableProtection,

                            damaged:
                                armor.system
                                    ?.damaged
                                === true,

                            broken:
                                armor.system
                                    ?.broken
                                === true,

                            resilience,

                            activeResilience,

                            resilienceLost:
                                armor.system
                                    ?.resilienceLost
                                === true

                        };

                    }
                );


        // ========================================================
        // SYNTHÈSE DES PROTECTIONS
        // ========================================================

        const bodyArmor =
            protections.find(
                armor =>
                    armor.isBodyArmor
            )
            ?? null;


        const helmet =
            protections.find(
                armor =>
                    armor.isHelmet
            )
            ?? null;


        const bodyProtection =
            bodyArmor
                ?.usableProtection
            ?? 0;


        const helmetProtection =
            helmet
                ?.usableProtection
            ?? 0;


        const totalProtection =
            bodyProtection
            + helmetProtection;


        const hasActiveResilience =
            protections.some(
                armor =>
                    armor.activeResilience
            );


        return {

            weapons,

            hasWeapons:
                weapons.length > 0,


            protections,

            hasProtections:
                protections.length > 0,


            defense: {

                bodyArmor,

                helmet,

                bodyProtection,

                helmetProtection,

                totalProtection,

                hasActiveResilience

            }

        };

    }

    /**
     * Prépare les Talents embarqués du personnage
     * pour leur affichage dans l'onglet Compétences.
     *
     * Plusieurs Embedded Items partageant le même
     * system.key représentent plusieurs acquisitions
     * du même Talent.
     *
     * La CharacterSheet les regroupe donc en une seule
     * ligne d'affichage.
     *
     * Niveau actuel :
     * nombre d'instances possédées avec le même key.
     *
     * Niveau maximum :
     * maxLevel porté par la définition du Talent.
     */
    _prepareTalents(

    ) {

        const actor =
            this.actor;


        // ========================================================
        // REGROUPEMENT PAR IDENTIFIANT MÉTIER
        // ========================================================

        const groups =
            new Map();


        for (
            const item
            of actor.items.filter(
                item =>
                    item.type === "talent"
            )
        ) {

            const key =
                String(
                    item.system?.key
                    ?? ""
                ).trim();


            /*
            * Tous les nouveaux Talents possèdent normalement
            * un system.key.
            *
            * Le fallback sur l'id évite cependant de fusionner
            * par erreur plusieurs anciennes données sans key.
            */
            const groupKey =
                key
                || `item:${item.id}`;


            let group =
                groups.get(
                    groupKey
                );


            if (!group) {

                group = {

                    key,

                    /*
                    * Une instance embarquée sert de document
                    * représentatif pour les actions d'interface
                    * (ouvrir, menu contextuel, Chat...).
                    */
                    item,

                    items: [],

                    maxLevel: 1

                };


                groups.set(
                    groupKey,
                    group
                );

            }


            group.items.push(
                item
            );


            /*
            * Défensif pendant la période de transition :
            * si plusieurs anciennes copies portent des maxLevel
            * différents, on retient le plus élevé.
            */
            group.maxLevel =
                Math.max(
                    group.maxLevel,

                    Number(
                        item.system?.maxLevel
                        ?? 1
                    )
                );

        }


        // ========================================================
        // VIEWMODEL
        // ========================================================

        const talents =
            Array.from(
                groups.values()
            )
            .map(
                group => {

                    const item =
                        group.item;


                    const currentLevel =
                        group.items.length;


                    const maxLevel =
                        Math.max(
                            1,
                            Math.min(
                                5,
                                Math.trunc(
                                    Number(
                                        group.maxLevel
                                        ?? 1
                                    )
                                )
                            )
                        );


                    return {

                        /*
                        * L'id représentatif reste utilisable par
                        * les actions existantes de la Sheet.
                        */
                        id:
                            item.id,

                        uuid:
                            item.uuid,

                        key:
                            group.key,

                        name:
                            item.name,

                        img:
                            item.img,

                        description:
                            item.system?.description
                            ?? "",


                        // ====================================================
                        // PROGRESSION ACTUELLE
                        // ====================================================

                        currentLevel,

                        maxLevel,

                        levelLabel:
                            `${currentLevel}/${maxLevel}`,

                        isMaxLevel:
                            currentLevel
                            >= maxLevel,


                        /*
                        * Liste conservée dans le ViewModel pour les futures
                        * opérations qui pourraient avoir besoin de connaître
                        * toutes les instances correspondant à ce Talent.
                        */
                        itemIds:
                            group.items.map(
                                ownedItem =>
                                    ownedItem.id
                            )

                    };

                }
            );


        // ========================================================
        // TRI
        // ========================================================

        const direction =
            this._talentSortAscending
                ? 1
                : -1;


        talents.sort(
            (
                a,
                b
            ) => {

                return a.name.localeCompare(
                    b.name,
                    game.i18n.lang,
                    {
                        sensitivity:
                            "base"
                    }
                ) * direction;

            }
        );


        return talents;

    }


    /**
     * Types d'Item affichés dans l'onglet Équipement,
     * dans l'ordre de présentation attendu.
     */
    static EQUIPMENT_TAB_SECTIONS = [
        { type: "weapon", label: "Armes" },
        { type: "armor", label: "Protections" },
        { type: "ammunition", label: "Munitions" },
        { type: "equipment", label: "Outils" },
        { type: "consumable", label: "Objets" }
    ];


    /**
     * Réserves affichées dans l'onglet Survie
     * (system.survival.*), dans l'ordre attendu.
     */
    static SURVIVAL_RESERVES = [
        { key: "water", label: "Eau" },
        { key: "food", label: "Nourriture" },
        { key: "energy", label: "Énergie" }
    ];


    /**
     * États persistants (system.conditions.*) affichés
     * dans l'onglet Survie. Tous manuels : aucune
     * automatisation ne les active ou ne les désactive.
     */
    static SURVIVAL_CONDITIONS = [
        { key: "hungry", label: "Affamé" },
        { key: "dehydrated", label: "Déshydraté" },
        { key: "exhausted", label: "Épuisé" },
        { key: "frozen", label: "Gelé" },
        { key: "prone", label: "Au sol" },
        { key: "grappled", label: "Saisi" },
        { key: "stunned", label: "Étourdi" }
    ];


    /**
     * Types d'Item affichés dans le bloc Blessures/Traumas
     * de l'onglet Survie.
     */
    static SURVIVAL_AFFLICTION_ITEM_TYPES = [
        "criticalInjury",
        "psychologicalTrauma"
    ];


    /**
     * Prépare le ViewModel de l'onglet Équipement.
     *
     * L'encombrement est calculé par Actor.getEncumbrance(),
     * qui s'appuie sur la règle de domaine resolveEncumbrance.
     * La Sheet ne fait ici que grouper les Items par type
     * et les mettre en forme pour l'affichage.
     */
    _prepareEquipmentTab(

    ) {

        const actor =
            this.actor;


        const grouped =
            new Map();


        for (
            const { type }
            of this.constructor
                .EQUIPMENT_TAB_SECTIONS
        ) {

            grouped.set(
                type,
                []
            );

        }


        for (
            const item
            of actor.items
        ) {

            if (!grouped.has(item.type)) {
                continue;
            }

            grouped.get(item.type).push(
                this._prepareEquipmentItem(item)
            );

        }


        const sections =
            this.constructor
                .EQUIPMENT_TAB_SECTIONS
                .map(
                    ({ type, label }) => ({

                        type,

                        label,

                        items:
                            grouped.get(type)

                    })
                );


        const reserveEncumbrance =
            actor.getSurvivalReserveEncumbrance();


        return {

            sections,

            encumbrance:
                actor.getEncumbrance(),

            /*
             * Lecture seule : les réserves de survie
             * (Eau/Nourriture/Énergie) se modifient
             * uniquement depuis l'onglet Survie. Cette
             * vue n'existe ici que pour expliquer leur
             * contribution au total d'encombrement.
             */
            reserves: {

                water: {
                    level:
                        Number(
                            actor.system.survival
                                ?.water
                            ?? 0
                        ),
                    weight:
                        reserveEncumbrance.water
                },

                food: {
                    level:
                        Number(
                            actor.system.survival
                                ?.food
                            ?? 0
                        ),
                    weight:
                        reserveEncumbrance.food
                },

                energy: {
                    level:
                        Number(
                            actor.system.survival
                                ?.energy
                            ?? 0
                        ),
                    weight:
                        reserveEncumbrance.energy
                },

                total:
                    reserveEncumbrance.total

            },

            currency: {

                militaryBullets:
                    Number(
                        actor.system.currency
                            ?.militaryBullets
                        ?? 0
                    )

            }

        };

    }


    /**
     * Met en forme un Item pour une ligne
     * de l'onglet Équipement.
     */
    _prepareEquipmentItem(
        item
    ) {

        const system =
            item.system
            ?? {};


        return {

            id:
                item.id,

            name:
                item.name,

            img:
                item.img,

            type:
                item.type,

            weight:
                Number(
                    system.weight
                    ?? 0
                ),

            conditionLabel:
                this._equipmentConditionLabel(
                    item
                ),

            quantityLabel:
                this._equipmentQuantityLabel(
                    item
                ),

            /*
             * Seuls les Munitions et Consommables affichent
             * un stepper +/- : les Armes et Protections
             * gardent chacune leur état individuel.
             */
            stackable:
                isStackableItemType(
                    item.type
                ),

            /*
             * Case à cocher « Équipée », Armes et Protections
             * uniquement (champ `system.equipped`, déjà lu par
             * le moteur de Combat — `_prepareCombat()` ci-dessous,
             * `canAttack`/`canFire`/`usableProtection` des
             * DataModels concernés). Demande du porteur du
             * projet, 04/10/2026 : pouvoir marquer explicitement
             * ce qui est équipé pour le combat après un
             * glisser-déposer sur la fiche.
             */
            canToggleEquipped:
                item.type === "weapon"
                || item.type === "armor",

            equipped:
                system.equipped
                === true

        };

    }


    /**
     * Libellé d'état à afficher dans l'onglet Équipement.
     *
     * Réutilise les données dérivées déjà exposées par
     * chaque DataModel (conditionState, ou à défaut les
     * indicateurs broken / damaged), sans redéfinir
     * la moindre règle métier.
     */
    _equipmentConditionLabel(
        item
    ) {

        const system =
            item.system
            ?? {};


        const stateLabels = {

            good:
                "Bon état",

            damaged:
                "Endommagé(e)",

            "damaged-repairable":
                "Endommagé(e) (réparable)",

            "broken-repairable":
                "Hors d'usage (réparable)",

            destroyed:
                "Détruit(e)",

            full:
                "Complet",

            partial:
                "Entamé",

            depleted:
                "Épuisé"

        };


        if (
            typeof system.conditionState
            === "string"
        ) {

            return (
                stateLabels[
                    system.conditionState
                ]
                ?? system.conditionState
            );

        }


        if (
            typeof system.broken
            === "boolean"
        ) {

            if (system.broken) {
                return "Hors d'usage";
            }

            if (system.damaged) {
                return "Endommagé(e)";
            }

            return "Bon état";

        }


        return null;

    }


    /**
     * Libellé de quantité à afficher dans
     * l'onglet Équipement.
     *
     * Uniquement pertinent pour les Munitions
     * (quantité simple) et les Consommables
     * (quantité actuelle / quantité d'origine).
     */
    _equipmentQuantityLabel(
        item
    ) {

        const system =
            item.system
            ?? {};


        if (item.type === "ammunition") {

            return `${
                Number(
                    system.quantity
                    ?? 0
                )
            } munitions`;

        }


        if (item.type === "consumable") {

            const current =
                Number(
                    system.quantity
                        ?.current
                    ?? 0
                );

            const max =
                Number(
                    system.quantity
                        ?.max
                    ?? 0
                );

            const unitLabel =
                system.unitLabel
                || "unités";


            return `${current} / ${max} ${unitLabel}`;

        }


        return null;

    }


    // ================================================================
    // ONGLET SURVIE
    // ================================================================

    /**
     * Prépare le ViewModel de l'onglet Survie.
     *
     * Regroupe les jauges de réserve, la Radiation, le Stress/
     * Sang-froid, les états persistants et les Blessures
     * critiques / Traumas psychologiques en cours. Aucune règle
     * métier n'est recalculée ici au-delà de la simple lecture
     * des champs déjà présents dans le DataModel : les jets
     * (Réserve, Radiation, Repos) sont résolus par les méthodes
     * dédiées lors d'une action explicite du joueur/MJ.
     */
    _prepareSurvivalTab(

    ) {

        const actor =
            this.actor;

        const system =
            actor.system;


        const reserves =
            this.constructor
                .SURVIVAL_RESERVES
                .map(
                    ({ key, label }) => {

                        const level =
                            Number(
                                system.survival
                                    ?.[key]
                                ?? 0
                            );

                        return {

                            key,

                            label,

                            level,

                            rollDiceCount:
                                Math.min(
                                    5,
                                    level
                                )

                        };

                    }
                );


        const conditions =
            this.constructor
                .SURVIVAL_CONDITIONS
                .map(
                    ({ key, label }) => ({

                        key,

                        label,

                        active:
                            system.conditions
                                ?.[key]
                            === true

                    })
                );


        /*
         * États Foundry propres à Métro 2033 (Asphyxié, et
         * futurs Poison/Maladie...), par opposition aux
         * "conditions" ci-dessus qui sont de simples booléens
         * du DataModel. Ceux-ci sont de vrais états Foundry
         * (CONFIG.statusEffects / actor.statuses), normalement
         * réservés au Token HUD ; ils sont également affichés
         * ici pour rester visibles/activables sans passer par un
         * Token sur le canevas. Activation/désactivation
         * réservée au MJ (cf. gestion round par round, à la
         * différence des "conditions" ci-dessus qui restent
         * manuelles et accessibles à tout propriétaire).
         */
        const statusEffects =
            (
                CONFIG.Metro2033
                    ?.trackedStatusEffects
                ?? []
            )
                .map(
                    ({ id, name, img }) => ({

                        id,

                        name,

                        img,

                        active:
                            actor.statuses
                                ?.has(id)
                            === true

                    })
                );


        const doses =
            Number(
                system.radiation
                    ?.doses
                ?? 0
            );

        const permanent =
            Number(
                system.radiation
                    ?.permanent
                ?? 0
            );


        const afflictions =
            actor.items
                .filter(
                    item =>
                        this.constructor
                            .SURVIVAL_AFFLICTION_ITEM_TYPES
                            .includes(item.type)
                )
                .map(
                    item => ({

                        id:
                            item.id,

                        name:
                            item.name,

                        img:
                            item.img,

                        type:
                            item.type,

                        typeLabel:
                            item.type === "criticalInjury"
                                ? "Blessure critique"
                                : "Trauma psychologique",

                        fatal:
                            item.system?.fatal
                            === true,

                        /*
                         * Seules les Blessures critiques
                         * fatales ET ne provoquant pas une
                         * mort instantanée requièrent un
                         * jet de Trépas répété (p.201).
                         */
                        canDeathRoll:
                            item.type === "criticalInjury"
                            && item.system?.fatal === true
                            && item.system?.instantDeath
                                !== true,

                        deathRolls:
                            Number(
                                item.system?.death
                                    ?.rolls
                                ?? 0
                            ),

                        stabilized:
                            item.system?.death
                                ?.stabilized
                            === true

                    })
                );


        return {

            stress: {

                dice:
                    Number(
                        system.stress
                            ?.dice
                        ?? 0
                    )

            },

            composure: {

                current:
                    Number(
                        system.stress
                            ?.composure
                            ?.current
                        ?? 0
                    ),

                max:
                    Number(
                        system.stress
                            ?.composure
                            ?.max
                        ?? 5
                    )

            },

            breakingPoint:
                system.stress
                    ?.breakingPoint
                === 1,

            /*
             * Talent Second souffle : bouton proposé sous
             * « Repos » uniquement si le Talent est possédé ET
             * que la VIGUEUR vaut 0 (Brisé).
             */
            secondWindOwned:
                this.actor.hasTalent(
                    TALENT_IDENTITIES.SECOND_WIND
                ),

            secondWindAvailable:
                isSecondWindAvailable({
                    hasTalent:
                        this.actor.hasTalent(
                            TALENT_IDENTITIES.SECOND_WIND
                        ),
                    vigor:
                        system.attributes
                            ?.vigor
                            ?.value
                }),

            reserves,

            conditions,

            statusEffects,

            radiation: {

                doses,

                permanent,

                total:
                    doses + permanent

            },

            afflictions

        };

    }


    /**
     * Prépare le ViewModel de l'onglet Biographie.
     *
     * Toutes les données affichées existent déjà dans le
     * DataModel (identity, affiliations, narrative) : cet
     * onglet ne fait qu'afficher/éditer ces champs, sans
     * nouvelle règle métier.
     *
     * Les références UUID (Faction, Station, Acteurs liés
     * par un Lien) sont résolues ici de façon asynchrone,
     * afin d'afficher un nom/image plutôt que le seul UUID
     * brut. Rien n'est mis à jour ici : cette méthode ne
     * fait que lire l'état courant de l'Actor.
     */
    async _prepareBiographyTab() {

        const system =
            this.actor.system;


        const identity = {

            age:
                Number(
                    system.identity?.age
                    ?? 0
                ),

            gender:
                system.identity?.gender
                ?? "",

            appearance:
                system.identity?.appearance
                ?? "",

            biography:
                system.identity?.biography
                ?? ""

        };


        const affiliations = {

            faction:
                await this._resolveDocumentReference(
                    system.affiliations?.faction,
                    "system.affiliations.faction",
                    ["faction"]
                ),

            community:
                await this._resolveDocumentReference(
                    system.affiliations?.community,
                    "system.affiliations.community",
                    ["station"]
                )

        };


        const pride = {

            description:
                system.narrative?.pride?.description
                ?? "",

            used:
                system.narrative?.pride?.used === 1

        };


        const shame =
            system.narrative?.shame
            ?? "";


        const relationshipRows =
            system.narrative?.relationships
            ?? [];

        const relationships =
            await Promise.all(
                relationshipRows.map(
                    async (relation, index) => ({

                        index,

                        actor:
                            await this._resolveDocumentReference(
                                relation.actor,
                                `system.narrative.relationships.${index}.actor`,
                                ["character", "npc", "creature", "vehicle"]
                            ),

                        type:
                            relation.type
                            ?? "",

                        description:
                            relation.description
                            ?? ""

                    })
                )
            );


        return {

            identity,

            affiliations,

            pride,

            shame,

            relationships,

            gmNotes:
                system.narrative?.gmNotes
                ?? ""

        };

    }


    /**
     * Résout une référence UUID (Faction, Station, Acteur
     * lié) en un petit ViewModel affichable.
     *
     * path est le chemin de mise à jour Foundry associé à
     * cette référence (ex. "system.affiliations.faction"),
     * transmis tel quel au template pour les zones de dépôt
     * et les boutons Ouvrir/Retirer.
     *
     * allowedTypes restreint les types de Document acceptés
     * (Item "faction"/"station", ou Actor "character"/
     * "npc"/"creature"/"vehicle"). Un Document résolu mais
     * du mauvais type est signalé (typeMismatch), sans être
     * rejeté ici : la validation stricte a lieu au dépôt
     * (_onDocumentReferenceDrop).
     */
    async _resolveDocumentReference(
        uuid,
        path,
        allowedTypes = null
    ) {

        const value =
            String(uuid ?? "").trim();


        if (!value) {

            return {
                uuid: "",
                path,
                name: "",
                img: "",
                resolved: false,
                typeMismatch: false
            };

        }


        let document = null;

        try {

            document =
                await fromUuid(value);

        } catch (error) {

            document = null;

        }


        if (!document) {

            return {
                uuid: value,
                path,
                name: "",
                img: "",
                resolved: false,
                typeMismatch: false
            };

        }


        const typeMismatch =
            Array.isArray(allowedTypes)
            && allowedTypes.length > 0
            && !allowedTypes.includes(document.type);


        return {

            uuid: value,
            path,

            name:
                document.name
                ?? "",

            img:
                document.img
                ?? "",

            resolved: true,
            typeMismatch

        };

    }


    /**
     * Lance un jet de Réserve (livre p.174) pour la ressource
     * de survie désignée (water/food/energy).
     *
     * Jette min(niveau, 5) dés ; chaque "1" réduit le niveau
     * de réserve de 1. La résolution pure est déléguée à
     * resolveReserveRoll ; cette méthode se limite au lancer
     * de dés, à l'application du résultat sur l'Actor et à
     * la publication du résultat dans le chat.
     */
    async _rollSurvivalReserve(
        resourceKey
    ) {

        const entry =
            this.constructor
                .SURVIVAL_RESERVES
                .find(
                    reserve =>
                        reserve.key === resourceKey
                );


        if (!entry) {
            return;
        }


        const level =
            Number(
                this.actor.system.survival
                    ?.[resourceKey]
                ?? 0
            );


        const diceValues =
            this._rollD6(
                Math.min(
                    5,
                    level
                )
            );

        const ones =
            diceValues.filter(
                value => value === 1
            ).length;


        const result =
            resolveReserveRoll({
                level,
                ones
            });


        await this.actor.update({
            [`system.survival.${resourceKey}`]:
                result.newLevel
        });


        await this._postSurvivalRollChatMessage({
            title:
                `Jet de Réserve — ${entry.label}`,
            diceValues,
            summary:
                result.depleted
                    ? `Niveau de réserve à sec (0). `
                        + `(${result.previousLevel} → `
                        + `${result.newLevel})`
                    : `Niveau de réserve : `
                        + `${result.previousLevel} → `
                        + `${result.newLevel}.`
        });


        if (result.depleted) {

            ui.notifications.info(
                `${entry.label} : réserve à sec.`
            );

        }

    }


    /**
     * Lance le jet d'Effets des radiations (livre p.206).
     *
     * Jette (doses + doses permanentes) dés ; chaque "1"
     * inflige 1 point de dégâts de VIGUEUR (non convertible
     * en dé de Stress — ceci reste à la charge du MJ/joueur,
     * la fiche ne fait qu'appliquer le dégât brut).
     */
    /**
     * Active/désactive un état Foundry propre à Métro 2033
     * (Asphyxié, et futurs Poison/Maladie...) depuis l'onglet
     * Survie, sans passer par le Token HUD.
     *
     * Réservé au MJ : ces états pilotent des mécaniques
     * automatisées (dégâts récurrents en combat, cf.
     * recurring-status-effect-registry.mjs) que seul le MJ doit
     * pouvoir poser ou lever, à la différence des "conditions"
     * narratives du DataModel qui restent accessibles à tout
     * propriétaire de l'Acteur.
     */
    async _toggleStatusEffect(
        statusId
    ) {

        if (!game.user?.isGM) {

            ui.notifications?.warn(
                "Seul le MJ peut activer ou désactiver cet état."
            );

            return;

        }


        if (!statusId) {
            return;
        }


        const active =
            this.actor.statuses
                ?.has(statusId)
            === true;


        try {

            await this.actor.toggleStatusEffect(
                statusId,
                { active: !active }
            );

        }
        catch (error) {

            console.error(
                "Metro 2033 | Impossible de basculer l'état "
                + `« ${statusId} » (Acteur sans Token sur le `
                + "canevas ?).",
                error
            );

            ui.notifications?.warn(
                "Impossible de basculer cet état : l'Acteur n'a "
                + "peut-être pas de Token sur le canevas."
            );

        }

    }


    async _rollRadiationEffects(

    ) {

        const doses =
            Number(
                this.actor.system.radiation
                    ?.doses
                ?? 0
            );

        const permanent =
            Number(
                this.actor.system.radiation
                    ?.permanent
                ?? 0
            );


        const diceValues =
            this._rollD6(
                doses + permanent
            );

        const ones =
            diceValues.filter(
                value => value === 1
            ).length;


        const result =
            resolveRadiationEffectsRoll({
                doses,
                permanent,
                ones
            });


        if (result.vigorDamage > 0) {

            const currentVigor =
                Number(
                    this.actor.system.attributes
                        ?.vigor
                        ?.value
                    ?? 0
                );

            await this.actor.update({
                "system.attributes.vigor.value":
                    Math.max(
                        0,
                        currentVigor - result.vigorDamage
                    )
            });

        }


        await this._postSurvivalRollChatMessage({
            title:
                "Effets des radiations",
            diceValues,
            summary:
                result.vigorDamage > 0
                    ? `${result.vigorDamage} point(s) de `
                        + "dégâts de VIGUEUR (non convertibles "
                        + "en dé de Stress)."
                    : "Aucun dégât."
        });

    }


    /**
     * Détermine les attributs qu'un Repos long ne doit PAS
     * restaurer, parce qu'un Poison à effets complets ou la
     * Maladie fait actuellement effet sur l'Acteur (livre,
     * p.204-205 : « tant que [le poison/la maladie] fait effet,
     * vous ne pouvez pas récupérer de points dans l'attribut
     * affecté »).
     *
     * - Poison : chaque Item embarqué de type "poison" (effets
     *   complets uniquement — les effets réduits ne créent
     *   jamais d'Item, cf. `domain/rules/poison.mjs`) bloque
     *   l'attribut de son propre type d'effet. Plusieurs
     *   instances peuvent bloquer plusieurs attributs à la fois.
     * - Maladie : l'état « Malade » (`ILLNESS_STATUS_EFFECT`)
     *   bloque toujours VIGUEUR et AGILITÉ ensemble, conformément
     *   au dégât fixe qu'il représente (cf.
     *   `domain/rules/illness.mjs`).
     *
     * Dépend de l'API Foundry (`actor.items`, `actor.statuses`) :
     * non testé unitairement, par convention du projet.
     */
    _computeRestBlockedAttributeKeys() {

        const blocked =
            new Set();


        const poisonItems =
            this.actor.items.filter(
                item => item.type === "poison"
            );

        for (
            const item
            of poisonItems
        ) {

            const effectTypeKey =
                item.system?.effectType
                ?? "lethal";

            try {

                const effectType =
                    getPoisonEffectType(
                        effectTypeKey
                    );

                blocked.add(
                    effectType.attribute
                );

            }
            catch (error) {

                console.warn(
                    "Metro 2033 | Type d'effet de Poison inconnu, "
                    + "ignoré pour le calcul du Repos.",
                    error
                );

            }

        }


        if (
            this.actor.statuses?.has(
                ILLNESS_STATUS_EFFECT.id
            )
        ) {

            blocked.add("vigor");
            blocked.add("agility");

        }


        return Array.from(
            blocked
        );

    }


    /**
     * Applique un Repos long (1 quart, 5 à 10h) : Stress -2,
     * Sang-froid -2, tous les attributs remis à leur maximum —
     * à l'exception des attributs bloqués par un Poison à effets
     * complets ou par la Maladie (cf.
     * `_computeRestBlockedAttributeKeys`), que le Repos laisse
     * inchangés.
     *
     * La résolution pure est déléguée à resolveRest.
     */
    async _applySurvivalRest(

    ) {

        /*
         * Les champs Attributs (valeur/max) vivent dans
         * l'en-tête de la fiche, hors de l'onglet Survie :
         * ils suivent donc encore la convention "sauvegarde
         * à la fermeture" du reste de la fiche. On force ici
         * la soumission du formulaire avant de lire l'Actor,
         * pour ne jamais calculer le Repos sur un max
         * d'attribut fraîchement modifié mais pas encore
         * enregistré.
         */
        if (this.isEditable) {

            await this.submit();

        }


        const system =
            this.actor.system;


        const attributeKeys =
            [
                "vigor",
                "agility",
                "spirit",
                "empathy"
            ];


        const attributes = {};

        for (
            const key
            of attributeKeys
        ) {

            attributes[key] = {

                value:
                    Number(
                        system.attributes
                            ?.[key]
                            ?.value
                        ?? 0
                    ),

                max:
                    Number(
                        system.attributes
                            ?.[key]
                            ?.max
                        ?? 0
                    )

            };

        }


        const blockedAttributeKeys =
            this._computeRestBlockedAttributeKeys();


        const result =
            resolveRest({

                stressDice:
                    Number(
                        system.stress
                            ?.dice
                        ?? 0
                    ),

                composureCurrent:
                    Number(
                        system.stress
                            ?.composure
                            ?.current
                        ?? 0
                    ),

                attributes,

                blockedAttributeKeys

            });


        const update = {

            "system.stress.dice":
                result.stressDice,

            "system.stress.composure.current":
                result.composureCurrent

        };

        for (
            const key
            of attributeKeys
        ) {

            update[`system.attributes.${key}.value`] =
                result.attributes[key].value;

        }


        await this.actor.update(
            update
        );


        const ATTRIBUTE_LABELS = {
            vigor: "VIGUEUR",
            agility: "AGILITÉ",
            spirit: "ESPRIT",
            empathy: "EMPATHIE"
        };

        const blockedLabels =
            result.blockedAttributeKeys
                .map(key => ATTRIBUTE_LABELS[key] ?? key);

        const blockedSuffix =
            blockedLabels.length > 0
                ? ` (hors ${blockedLabels.join(", ")}, bloqué(e) `
                    + "par un Poison ou la Maladie en cours)"
                : "";

        ui.notifications.info(
            "Repos effectué : Stress et Sang-froid réduits de 2, "
            + `attributs restaurés au maximum${blockedSuffix}.`
        );

    }


    /**
     * Affiche / masque en direct le bouton « Second souffle »
     * selon la valeur COURANTE (saisie, non encore enregistrée)
     * du champ VIGUEUR de l'en-tête. Le bouton est présent dans
     * le DOM dès que l'Actor possède le Talent.
     */
    _syncSecondWindButton(

    ) {

        const button =
            this.element?.querySelector(
                ".metro-character-survival-second-wind"
            );

        const field =
            this.element?.querySelector(
                '[name="system.attributes.vigor.value"]'
            );

        if (!button || !field) {

            return;

        }

        button.hidden =
            !isSecondWindAvailable({
                hasTalent:
                    true,
                vigor:
                    field.value
            });

    }


    /**
     * Talent Second souffle : jet d'ENDURANCE (dés de
     * compétence seuls, non forçable) ; chaque réussite rend
     * 1 point de VIGUEUR. La règle et le jet sont délégués à
     * SecondWindChat / domain/rules/second-wind.mjs.
     */
    async _useSecondWind(

    ) {

        if (this.isEditable) {

            await this.submit();

        }


        /*
         * Le champ VIGUEUR de l'en-tête n'est enregistré qu'à la
         * soumission : on revérifie ici, sur la valeur désormais
         * persistée, que le Talent est toujours utilisable.
         */
        const available =
            isSecondWindAvailable({
                hasTalent:
                    this.actor.hasTalent(
                        TALENT_IDENTITIES.SECOND_WIND
                    ),
                vigor:
                    this.actor.system.attributes
                        ?.vigor
                        ?.value
            });


        if (!available) {

            this._syncSecondWindButton();

            ui.notifications.warn(
                "Second souffle n'est utilisable que lorsque "
                + "la VIGUEUR est à 0."
            );

            return;

        }


        await SecondWindChat.execute(
            this.actor
        );

    }


    /**
     * Lance count dés à 6 faces.
     *
     * Seule méthode de la fiche à faire appel au hasard :
     * les règles de domaine (resolveReserveRoll,
     * resolveRadiationEffectsRoll) ne reçoivent que le
     * nombre d'afflictions ("1") déjà obtenues et restent
     * ainsi entièrement pures et testables.
     */
    _rollD6(
        count
    ) {

        const values = [];

        for (
            let index = 0;
            index < count;
            index += 1
        ) {

            values.push(
                Math.floor(Math.random() * 6) + 1
            );

        }

        return values;

    }


    /**
     * Poste dans le chat le résultat d'un jet de Survie
     * (Réserve ou Effets des radiations).
     */
    async _postSurvivalRollChatMessage({
        title,
        diceValues,
        summary
    }) {

        const diceList =
            diceValues.length
                ? diceValues.join(", ")
                : "—";


        const content = `
            <div class="metro-chat-survival-card">

                <header class="metro-chat-survival-card-header">
                    <strong>${title}</strong>
                </header>

                <div class="metro-chat-survival-card-dice">
                    Dés : ${diceList}
                </div>

                <div class="metro-chat-survival-card-summary">
                    ${summary}
                </div>

            </div>
        `;


        await ChatMessage.create({

            speaker:
                ChatMessage.getSpeaker({
                    actor:
                        this.actor
                }),

            content

        });

    }


    /**
     * Lance un jet de Trépas (livre p.201) pour une Blessure
     * critique fatale (hors mort instantanée).
     *
     * Jet d'ENDURANCE utilisant la VIGUEUR max (non réduite
     * par les dégâts subis), modifié par le malus/bonus
     * "Fatal" de la blessure. Ce jet ne peut jamais être
     * forcé (Push) : la carte de chat dédiée n'offre donc
     * aucune option de Push, contrairement aux jets de
     * Compétence habituels.
     *
     * Une réussite (au moins un "6") signifie que le
     * personnage survit pour l'instant, mais devra refaire
     * ce jet à l'expiration du même délai. Un échec (aucune
     * réussite) signifie la mort du personnage : la fiche se
     * contente de le signaler clairement (chat + notification
     * + statut "Mort" sur le Token si possible) — elle ne
     * remplace pas la décision du MJ à la table.
     */
    async _rollDeathSave(
        itemId
    ) {

        /*
         * La VIGUEUR max et la compétence ENDURANCE vivent
         * hors de l'onglet Survie (en-tête / onglet
         * Compétences) et suivent donc encore la convention
         * "sauvegarde à la fermeture". On force la
         * soumission du formulaire avant de les lire, pour
         * ne jamais calculer ce jet sur une valeur modifiée
         * mais pas encore enregistrée.
         */
        if (this.isEditable) {

            await this.submit();

        }


        const item =
            this.actor.items.get(
                itemId
            );

        if (!item) {

            ui.notifications.warn(
                "Cet élément est introuvable."
            );

            return;

        }


        if (
            item.type !== "criticalInjury"
            || item.system?.fatal !== true
            || item.system?.instantDeath === true
        ) {

            ui.notifications.warn(
                "Cette Blessure ne nécessite pas de jet de Trépas."
            );

            return;

        }


        const vigorMax =
            Number(
                this.actor.system.attributes
                    ?.vigor
                    ?.max
                ?? 0
            );

        const enduranceSkill =
            Number(
                this.actor.system.skills
                    ?.endurance
                ?? 0
            );

        const deathRollModifier =
            Number(
                item.system?.deathRollModifier
                ?? 0
            );


        const poolConfig =
            computeDeathRollDicePool({
                vigorMax,
                enduranceSkill,
                deathRollModifier
            });

        const pool =
            new DicePool(
                poolConfig
            );

        const diceToRoll =
            YZERoll.countInitialDiceToRoll(
                pool
            );

        const {
            roll: physicalRoll,
            values: physicalDiceValues
        } =
            await rollPhysicalDice({

                normal:
                    diceToRoll.normal,

                stress:
                    diceToRoll.stress

            });

        const drawDie =
            physicalDiceValues.length > 0
                ? createDieDrawer(
                    physicalDiceValues
                )
                : null;

        const roll =
            YZERoll.roll(
                pool,
                {
                    type:
                        "death-roll",
                    itemId
                },
                {
                    drawDie
                }
            );


        if (physicalRoll) {

            roll.physicalRoll =
                physicalRoll;

        }


        const previousRolls =
            Number(
                item.system?.death
                    ?.rolls
                ?? 0
            );

        const outcome =
            resolveDeathRollOutcome({
                successes:
                    roll.successes,
                previousRolls
            });


        await item.update({
            "system.death.rolls":
                outcome.rolls
        });


        const diceValues =
            [
                ...roll.dice.attribute,
                ...roll.dice.skill,
                ...roll.dice.equipment,
                ...roll.dice.bonus
            ];


        await this._postDeathRollChatMessage({
            item,
            diceValues,
            outcome,
            physicalRoll
        });


        if (outcome.survived) {

            ui.notifications.info(
                `${this.actor.name} survit au jet de Trépas `
                + `(${item.name}), pour l'instant.`
            );

        } else {

            ui.notifications.error(
                `${this.actor.name} échoue son jet de Trépas `
                + `(${item.name}) et meurt.`
            );

            try {

                await this.actor.toggleStatusEffect(
                    "dead",
                    { active: true }
                );

            } catch (error) {

                /*
                 * Best-effort : certaines configurations
                 * Foundry (pas de Token lié, statut "dead"
                 * absent) peuvent empêcher ce marquage.
                 * Le chat et la notification suffisent
                 * déjà à informer la table.
                 */

            }

        }

    }


    /**
     * Poste dans le chat le résultat d'un jet de Trépas.
     */
    async _postDeathRollChatMessage({
        item,
        diceValues,
        outcome,
        physicalRoll = null
    }) {

        const diceList =
            diceValues.length
                ? diceValues.join(", ")
                : "—";

        const summary =
            outcome.survived
                ? `${outcome.successes} réussite(s) — `
                    + "le personnage survit (pour l'instant)."
                : "Aucune réussite — le personnage meurt.";


        const content = `
            <div class="metro-chat-survival-card metro-chat-death-roll-card">

                <header class="metro-chat-survival-card-header">
                    <strong>Jet de Trépas — ${item.name}</strong>
                </header>

                <div class="metro-chat-survival-card-dice">
                    Dés : ${diceList}
                </div>

                <div class="metro-chat-survival-card-summary">
                    ${summary}
                    (jet n°${outcome.rolls})
                </div>

            </div>
        `;


        const rolls =
            physicalRoll
                ? [physicalRoll]
                : undefined;


        await ChatMessage.create({

            speaker:
                ChatMessage.getSpeaker({
                    actor:
                        this.actor
                }),

            content,

            ...(
                rolls
                    ? {
                        rolls,
                        sound:
                            CONFIG.sounds.dice
                    }
                    : {}
            )

        });

    }


    /**
     * Clé d'identité "empilable" d'un Item embarqué,
     * ou null si son type n'est pas empilable.
     *
     * Simple câblage de la règle de domaine
     * computeStackIdentity : la Sheet ne redéfinit
     * aucune notion d'identité ici.
     */
    _stackIdentityOf(
        item
    ) {

        return computeStackIdentity({

            type:
                item.type,

            name:
                item.name,

            system:
                item.system
                ?? {}

        });

    }


    /**
     * Cherche, parmi les Items déjà embarqués sur l'Actor,
     * un Item empilable identique à celui fourni.
     *
     * Utilisé lors d'un dépôt (drag & drop) pour incrémenter
     * un stock existant plutôt que créer un doublon.
     *
     * L'Item déposé (droppedItem) n'est PAS forcément déjà
     * embarqué sur cet Actor : la plupart du temps c'est
     * encore le document source (Item de monde ou de
     * compendium) résolu par Foundry, qui conserve son
     * propre _id. Foundry préserve cet _id lors de la
     * toute première intégration sur l'Actor, si bien que
     * le premier exemplaire embarqué peut porter EXACTEMENT
     * le même id que le document source qu'on redépose
     * ensuite : exclure systématiquement "existing.id ===
     * droppedItem.id" écarterait alors à tort ce premier
     * exemplaire. On n'exclut donc l'Item de même id que
     * lorsque l'Item déposé est déjà, lui-même, un Item
     * embarqué de cet Actor (cas d'un glisser-déposer d'un
     * Item déjà présent sur la fiche, par ex. réordonnancement).
     */
    _findStackableItem(
        droppedItem
    ) {

        const identity =
            this._stackIdentityOf(
                droppedItem
            );


        if (!identity) {
            return null;
        }


        const droppedItemIsAlreadyEmbedded =
            droppedItem.parent?.id
            === this.actor.id;


        return this.actor.items.find(
            existing => {

                if (
                    droppedItemIsAlreadyEmbedded
                    && existing.id === droppedItem.id
                ) {
                    return false;
                }

                return this._stackIdentityOf(existing)
                    === identity;

            }
        )
        ?? null;

    }


    /**
     * Cherche tous les doublons d'un Item déjà embarqué
     * (même identité empilable, Item différent).
     *
     * Utilisé par l'action "Fusionner les doublons"
     * du menu contextuel.
     */
    _findStackDuplicates(
        item
    ) {

        const identity =
            this._stackIdentityOf(
                item
            );


        if (!identity) {
            return [];
        }


        return this.actor.items.filter(
            other =>
                other.id !== item.id
                && this._stackIdentityOf(other)
                    === identity
        );

    }


    /**
     * Reporte la quantité cumulée d'un ensemble d'Items
     * empilables sur un unique Item cible, en s'appuyant
     * sur les règles de domaine sumAmmunitionQuantities /
     * sumConsumableQuantities.
     */
    async _applyMergedStackQuantity(
        targetItem,
        allItems
    ) {

        if (targetItem.type === "ammunition") {

            const total =
                sumAmmunitionQuantities(
                    allItems.map(
                        it =>
                            Number(
                                it.system?.quantity
                                ?? 0
                            )
                    )
                );


            await targetItem.update({
                "system.quantity":
                    total
            });

            return;

        }


        if (targetItem.type === "consumable") {

            const totals =
                sumConsumableQuantities(
                    allItems.map(
                        it => ({

                            current:
                                Number(
                                    it.system?.quantity
                                        ?.current
                                    ?? 0
                                ),

                            max:
                                Number(
                                    it.system?.quantity
                                        ?.max
                                    ?? 0
                                )

                        })
                    )
                );


            await targetItem.update({

                "system.quantity.current":
                    totals.current,

                "system.quantity.max":
                    totals.max

            });

        }

    }


    /**
     * Fusionne tous les doublons d'un Item empilable
     * sur celui-ci, puis supprime les doublons.
     *
     * Déclenché depuis le menu contextuel de l'Item
     * (action "merge").
     */
    async _mergeStackDuplicates(
        itemId
    ) {

        const item =
            this.actor.items.get(
                itemId
            );


        if (!item) {

            ui.notifications.warn(
                "Cet élément est introuvable."
            );

            return;

        }


        const duplicates =
            this._findStackDuplicates(
                item
            );


        if (duplicates.length === 0) {

            ui.notifications.info(
                "Aucun doublon à fusionner pour cet objet."
            );

            return;

        }


        await this._applyMergedStackQuantity(
            item,
            [
                item,
                ...duplicates
            ]
        );


        await this.actor.deleteEmbeddedDocuments(
            "Item",
            duplicates.map(
                duplicate =>
                    duplicate.id
            )
        );


        ui.notifications.info(
            `${duplicates.length + 1} objets identiques `
            + `fusionnés sur ${item.name}.`
        );

    }


    /**
     * Ajuste d'un cran (+1 / -1) la quantité en stock
     * d'un Item empilable, depuis le stepper de
     * l'onglet Équipement.
     *
     * Pour un Consommable, la quantité actuelle ne peut
     * jamais dépasser la quantité d'origine : ce stepper
     * consomme ou restitue une dose, il n'agrandit pas
     * le stock (c'est le rôle du dépôt / de la fusion).
     */
    async _adjustStackQuantity(
        itemId,
        delta
    ) {

        const item =
            this.actor.items.get(
                itemId
            );


        if (!item) {

            ui.notifications.warn(
                "Cet élément est introuvable."
            );

            return;

        }


        if (item.type === "ammunition") {

            const current =
                Number(
                    item.system?.quantity
                    ?? 0
                );


            const next =
                Math.max(
                    0,
                    current + delta
                );


            await item.update({
                "system.quantity":
                    next
            });

            return;

        }


        if (item.type === "consumable") {

            const current =
                Number(
                    item.system?.quantity
                        ?.current
                    ?? 0
                );

            const max =
                Number(
                    item.system?.quantity
                        ?.max
                    ?? 0
                );


            const next =
                Math.min(
                    max,
                    Math.max(
                        0,
                        current + delta
                    )
                );


            await item.update({
                "system.quantity.current":
                    next
            });

        }

    }


    /**
     * Bascule la case « Équipée » d'une Arme ou
     * d'une Protection embarquée, onglet Équipement.
     *
     * Champ `system.equipped` déjà lu par le moteur
     * de Combat (`_prepareCombat()` ci-dessus ne liste
     * que les Armes/Protections équipées ;
     * `canAttack`/`canFire`/`usableProtection` des
     * DataModels concernés en dépendent également) :
     * cette méthode n'ajoute aucune règle, elle expose
     * simplement le champ existant à l'édition depuis
     * la fiche de Personnage.
     */
    async _toggleEquippedItem(
        itemId
    ) {

        const item =
            this.actor.items.get(
                itemId
            );


        if (!item) {

            ui.notifications?.warn(
                "Cet élément est introuvable."
            );

            return;

        }


        if (
            item.type !== "weapon"
            && item.type !== "armor"
        ) {
            return;
        }


        const equipped =
            item.system?.equipped
            === true;


        try {

            await item.update({
                "system.equipped":
                    !equipped
            });

        }
        catch (error) {

            console.error(
                "Metro 2033 | Impossible de basculer "
                + "l'état « Équipée » de l'Item "
                + `« ${item.name} ».`,
                error
            );

            ui.notifications?.warn(
                "Impossible de modifier l'état « Équipée » "
                + "de cet objet."
            );

        }

    }


    /**
     * Intercepte le dépôt d'un Item sur la CharacterSheet.
     *
     * En Foundry VTT v14 / ActorSheetV2,
     * le second argument est déjà l'Item résolu
     * par le moteur Foundry.
     *
     * La Sheet normalise uniquement les données
     * nécessaires aux règles métier, puis laisse
     * Foundry poursuivre son comportement natif
     * lorsque l'acquisition est autorisée.
     */
    async _onDropItem(
        event,
        item
    ) {

        /*
        * Sécurité :
        * si Foundry ne fournit pas un Item exploitable,
        * on conserve son comportement natif.
        */
        if (!item) {

            return super._onDropItem(
                event,
                item
            );

        }


        try {

            // ====================================================
            // FACTION / STATION : une seule de chaque par Personnage
            // ====================================================

            const affiliation =
                decideAffiliationDrop({
                    itemType:
                        item.type,
                    itemUuid:
                        item.uuid,
                    currentUuid:
                        item.type === "faction"
                            ? this.actor.system.affiliations?.faction
                            : this.actor.system.affiliations?.community
                });

            if (
                affiliation.action
                !== "not-affiliation"
            ) {

                const label =
                    item.type === "faction"
                        ? "Faction"
                        : "Station";

                if (affiliation.action === "same") {

                    ui.notifications.info(
                        `${item.name} est déjà la ${label} de ${this.actor.name}.`
                    );

                    return null;

                }

                if (affiliation.action === "ignore") {
                    return null;
                }

                await this.actor.update({
                    [affiliation.path]:
                        item.uuid
                });

                ui.notifications.info(
                    affiliation.action === "replace"
                        ? `${item.name} remplace l'ancienne ${label} de ${this.actor.name}.`
                        : `${item.name} devient la ${label} de ${this.actor.name}.`
                );

                return null;

            }


            // ====================================================
            // TALENT
            // ====================================================

            if (
                item.type
                === "talent"
            ) {

                const ownedTalents =
                    this.actor.items
                        .filter(
                            ownedItem =>
                                ownedItem.type
                                === "talent"
                        )
                        .map(
                            ownedItem => ({
                                key:
                                    ownedItem.system
                                        ?.key
                                    ?? ""
                            })
                        );


                const acquisition =
                    canAcquireTalent({

                        talent: {

                            key:
                                item.system
                                    ?.key
                                ?? "",

                            maxLevel:
                                item.system
                                    ?.maxLevel
                                ?? 1

                        },

                        ownedTalents

                    });


                if (
                    acquisition.allowed
                    !== true
                ) {

                    if (
                        acquisition.reason
                        === "talent-max-level-reached"
                    ) {

                        ui.notifications.warn(
                            `${this.actor.name} possède déjà le niveau maximum `
                            + `de ${item.name} `
                            + `(${acquisition.currentLevel}/${acquisition.maxLevel}).`
                        );

                    }
                    else {

                        ui.notifications.warn(
                            "Ce Talent ne peut pas être ajouté."
                        );

                    }


                    return null;

                }


                /*
                * Acquisition autorisée :
                * ActorSheetV2 réalise lui-même
                * la création de la copie embarquée.
                */
                return super._onDropItem(
                    event,
                    item
                );

            }


            // ====================================================
            // ARCHÉTYPE
            // ====================================================

            if (
                item.type
                === "archetype"
            ) {

                const ownedArchetypes =
                    this.actor.items
                        .filter(
                            ownedItem =>
                                ownedItem.type
                                === "archetype"
                        )
                        .map(
                            ownedItem => ({
                                key:
                                    ownedItem.system
                                        ?.key
                                    ?? ""
                            })
                        );


                const acquisition =
                    canAcquireArchetype({
                        ownedArchetypes
                    });


                if (
                    acquisition.allowed
                    !== true
                ) {

                    if (
                        acquisition.reason
                        === "archetype-already-owned"
                    ) {

                        ui.notifications.warn(
                            `${this.actor.name} possède déjà un Archétype.`
                        );

                    }
                    else {

                        ui.notifications.warn(
                            "Cet Archétype ne peut pas être ajouté."
                        );

                    }


                    return null;

                }


                /*
                * Acquisition autorisée :
                * ActorSheetV2 réalise lui-même
                * la création de la copie embarquée.
                */
                return super._onDropItem(
                    event,
                    item
                );

            }


            // ====================================================
            // MUNITIONS ET CONSOMMABLES — EMPILEMENT
            // ====================================================

            /*
            * Déposer une Munition ou un Consommable identique
            * à un Item déjà présent incrémente son stock au
            * lieu de créer un doublon.
            */
            if (
                isStackableItemType(
                    item.type
                )
            ) {

                const existing =
                    this._findStackableItem(
                        item
                    );


                if (existing) {

                    await this._applyMergedStackQuantity(
                        existing,
                        [
                            existing,
                            item
                        ]
                    );


                    ui.notifications.info(
                        `${item.name} ajouté au stock `
                        + `existant (${existing.name}).`
                    );


                    return existing;

                }


                return super._onDropItem(
                    event,
                    item
                );

            }


            // ====================================================
            // AUTRES ITEMS
            // ====================================================

            /*
            * Tous les autres Items conservent
            * intégralement le comportement natif
            * de l'ActorSheetV2.
            */
            return super._onDropItem(
                event,
                item
            );

        }
        catch (error) {

            console.error(
                "Métro 2033 | Impossible de valider l'acquisition de l'Item déposé.",
                error
            );


            ui.notifications.error(
                error.message
                ?? "Impossible d'ajouter cet Item."
            );


            return null;

        }

    }


    /**
     * Branche les interactions spécifiques
     * à la CharacterSheet après son rendu.
     */
    _onRender(
        context,
        options
    ) {

        super._onRender(
            context,
            options
        );


        // ========================================================
        // Gestion des onglets de la fiche
        // ========================================================
        this._activateCharacterTabListeners();


        // ========================================================
        // XP TOTAL
        // ========================================================

        const totalInput =
            this.element.querySelector(
                ".metro-character-xp-total-input"
            );


        if (totalInput) {

            totalInput.addEventListener(
                "change",
                this._onXpTotalChange.bind(
                    this
                )
            );

        }


        // ========================================================
        // XP ACTUEL
        // ========================================================

        const availableInput =
            this.element.querySelector(
                ".metro-character-xp-available-input"
            );


        if (availableInput) {

            availableInput.addEventListener(
                "change",
                this._onXpAvailableChange.bind(
                    this
                )
            );

        }


        // ========================================================
        // VALEURS DE COMPÉTENCE
        // ========================================================

        const skillValueInputs =
            this.element.querySelectorAll(
                ".metro-character-skill-value"
            );


        for (
            const input
            of skillValueInputs
        ) {

            input.addEventListener(
                "change",
                this._onSkillValueChange.bind(
                    this
                )
            );

        }

        // ========================================================
        // OUVERTURE DES TALENTS
        // ========================================================

        const talentLinks =
            this.element.querySelectorAll(
                ".metro-character-talent-link"
            );


        for (
            const link
            of talentLinks
        ) {

            link.addEventListener(
                "click",
                this._onTalentOpen.bind(
                    this
                )
            );

        }

        // ========================================================
        // MENU DES ITEMS EMBARQUÉS
        // ========================================================

        this._activateEmbeddedItemOpenListeners();
        this._activateEmbeddedItemMenuListeners();

        // ========================================================
        // PROGRESSION DES TALENTS
        // ========================================================

        const talentImproveButtons =
            this.element.querySelectorAll(
                ".metro-character-talent-improve"
            );


        for (
            const button
            of talentImproveButtons
        ) {

            button.addEventListener(
                "click",
                this._onTalentImprove.bind(
                    this
                )
            );

        }        


        // ========================================================
        // TRI des Talents
        // ========================================================

        const talentSortButton =
            this.element.querySelector(
                ".metro-character-talent-sort"
            );

        talentSortButton?.addEventListener(
            "click",
            this._onTalentSort.bind(this)
        );        


        // ========================================================
        // TESTS D'ATTRIBUT
        // ========================================================
        const attributeRollButtons =
            this.element.querySelectorAll(
                ".metro-character-attribute-roll[data-attribute]"
            );


        for (
            const button
            of attributeRollButtons
        ) {

            button.addEventListener(
                "click",
                this._onAttributeRoll.bind(
                    this
                )
            );

        }


        // ========================================================
        // TESTS DE COMPÉTENCE
        // ========================================================

        const skillRollButtons =
            this.element.querySelectorAll(
                ".metro-character-skill-roll"
            );


        for (
            const button
            of skillRollButtons
        ) {

            button.addEventListener(
                "click",
                this._onSkillRoll.bind(
                    this
                )
            );

        }


        // ========================================================
        // JET DE SURVIE (système Station, règles p.219)
        // ========================================================

        const stationSurvivalRollButton =
            this.element.querySelector(
                ".metro-character-station-survival-roll"
            );

        if (stationSurvivalRollButton) {

            stationSurvivalRollButton.addEventListener(
                "click",
                this._onStationSurvivalRoll.bind(
                    this
                )
            );

        }


        // ========================================================
        // PROGRESSION DES COMPÉTENCES
        // ========================================================
        const skillXpButtons =
            this.element.querySelectorAll(
                ".metro-character-skill-xp[data-skill]"
            );


        for (
            const button
            of skillXpButtons
        ) {

            button.addEventListener(
                "click",
                this._onSkillImprove.bind(
                    this
                )
            );

        }

        this._activateCombatItemListeners();
        this._activateCombatAmmunitionListeners();
        this._activateCombatAttackListeners();        
    }


    /**
     * Modification manuelle du total d'XP.
     *
     * Le total n'est pas persisté.
     *
     * available = total demandé - spent
     */
    async _onXpTotalChange(
        event
    ) {

        if (!this.isEditable) {
            return;
        }


        const spent =
            Number(
                this.actor.system.progression
                    ?.xp?.spent
                ?? 0
            );


        const requestedTotal =
            Number(
                event.currentTarget.value
            );


        if (
            !Number.isFinite(
                requestedTotal
            )
        ) {
            return;
        }


        const total =
            Math.max(
                spent,
                Math.trunc(
                    requestedTotal
                )
            );


        const available =
            total
            - spent;


        await this.actor.update({

            "system.progression.xp.available":
                available

        });

    }


    /**
     * Modification manuelle de la valeur actuelle d'XP.
     *
     * Le total n'est pas persisté et reste inchangé.
     *
     * spent = total - available
     */
    async _onXpAvailableChange(
        event
    ) {

        if (!this.isEditable) {
            return;
        }


        const currentAvailable =
            Number(
                this.actor.system.progression
                    ?.xp?.available
                ?? 0
            );

        const currentSpent =
            Number(
                this.actor.system.progression
                    ?.xp?.spent
                ?? 0
            );


        const total =
            currentAvailable
            + currentSpent;


        const requestedAvailable =
            Number(
                event.currentTarget.value
            );


        if (
            !Number.isFinite(
                requestedAvailable
            )
        ) {
            return;
        }


        const available =
            Math.min(
                total,
                Math.max(
                    0,
                    Math.trunc(
                        requestedAvailable
                    )
                )
            );


        const spent =
            total
            - available;


        await this.actor.update({

            "system.progression.xp.available":
                available,

            "system.progression.xp.spent":
                spent

        });

    }


    /**
     * Prépare puis effectue
     * un test d'attribut.
     *
     * La Sheet :
     *
     * - identifie l'attribut demandé ;
     * - demande au service métier la préparation ;
     * - ouvre le Dialog universel ;
     * - délègue le vrai jet à l'Actor.
     *
     * Elle ne décide pas elle-même
     * quels bonus sont applicables.
     */
    async _onAttributeRoll(
        event
    ) {

        event.preventDefault();


        const attributeId =
            event.currentTarget
                .dataset.attribute;


        if (!attributeId) {

            return;

        }


        if (
            typeof this.actor.rollAttribute
                !== "function"
        ) {

            ui.notifications.error(
                "Métro 2033 : la méthode rollAttribute() n'est pas disponible sur cet Actor."
            );

            return;

        }


        try {

            /*
            * 1. Préparation métier.
            */
            const {
                preparation
            } =
                AttributeRollPreparationService
                    .create(
                        this.actor,
                        {
                            attribute:
                                attributeId
                        }
                    );


            /*
            * 2. Choix utilisateur.
            */
            const resolvedPreparation =
                await ActionModifierDialog.prompt(
                    preparation,
                    {
                        title:
                            `${this.actor.name} — Jet d'attribut`,

                        confirmLabel:
                            "Lancer"
                    }
                );


            /*
            * Annuler / X :
            *
            * aucun jet ;
            * aucun message Chat.
            */
            if (!resolvedPreparation) {

                return;

            }


            const totals =
                resolvedPreparation.totals
                ?? {};


            /*
            * Armes + équipements utilisent
            * les dés d'Équipement du moteur YZE.
            */
            const equipment =
                Number(
                    totals.weapon
                    ?? 0
                )
                +
                Number(
                    totals.equipment
                    ?? 0
                );


            /*
            * Le reste est un ajustement signé :
            *
            * - talent ;
            * - difficulté ;
            * - modificateurs sélectionnés/manuels.
            *
            * resolvePreparationTotals() calcule déjà
            * ces valeurs séparément. :contentReference[oaicite:2]{index=2}
            */
            const adjustment =
                Number(
                    totals.talent
                    ?? 0
                )
                +
                Number(
                    totals.difficulty
                    ?? 0
                )
                +
                Number(
                    totals.modifier
                    ?? 0
                )
                +
                /*
                * « Subir 1 Stress pour +3 dés » (livre, p.190) :
                * omis par erreur jusqu'ici, la case cochée ne
                * changeait donc jamais réellement le jet.
                */
                Number(
                    totals.stressBonus
                    ?? 0
                );


            const bonus =
                Math.max(
                    0,
                    adjustment
                );


            const penalty =
                Math.max(
                    0,
                    -adjustment
                );


            /*
            * 3. Vrai jet YZE.
            */
            const result =
                await this.actor.rollAttribute(
                    attributeId,
                    {
                        attributeOverride:
                            resolvedPreparation
                                .base
                                ?.attribute
                            ?? null,

                        equipment,

                        stressOverride:
                            resolvedPreparation
                                .base
                                ?.stress
                            ?? null,

                        /*
                        * « Subir 1 Stress pour +3 » (livre, p.190) :
                        * cf. ActionModifierService.
                        */
                        extraStressDie:
                            Number(
                                totals.extraStressDie
                                ?? 0
                            ),

                        bonus,

                        penalty,

                        context: {

                            preparation: {

                                base:
                                    foundry.utils.deepClone(
                                        resolvedPreparation.base
                                        ?? {}
                                    ),

                                sources:
                                    foundry.utils.deepClone(
                                        resolvedPreparation.sources
                                        ?? []
                                    ),

                                selectedSources:
                                    foundry.utils.deepClone(
                                        resolvedPreparation.selectedSources
                                        ?? []
                                    ),

                                difficulty:
                                    foundry.utils.deepClone(
                                        resolvedPreparation.difficulty
                                        ?? null
                                    ),

                                totals:
                                    foundry.utils.deepClone(
                                        resolvedPreparation.totals
                                        ?? {}
                                    )

                            }

                        }
                    }
                );


            /*
            * 4. Chat.
            */
            await YZERollChat.createMessage(
                result
            );

        }
        catch (error) {

            console.error(
                `Metro 2033 | Impossible d'effectuer le test d'attribut ${attributeId}`,
                error
            );


            ui.notifications.error(
                error.message
                ?? "Impossible d'effectuer le test d'attribut."
            );

        }

    }


    /**
     * Prépare puis effectue
     * un test de compétence.
     *
     * La Sheet :
     *
     * - identifie la compétence demandée ;
     * - attend la sauvegarde éventuelle de sa valeur ;
     * - demande au service métier la préparation ;
     * - ouvre le Dialog universel ;
     * - délègue le vrai jet à l'Actor.
     *
     * Elle ne décide pas elle-même
     * quels bonus sont applicables.
     */
    async _onSkillRoll(
        event
    ) {

        event.preventDefault();


        /*
        * Une modification de la valeur de compétence
        * peut être encore en cours de sauvegarde.
        *
        * La préparation doit travailler
        * sur la valeur réellement persistée.
        */
        if (this._skillSavePromise) {

            await this._skillSavePromise;

        }


        const skillId =
            event.currentTarget
                .dataset.skill;


        if (!skillId) {

            return;

        }


        if (
            typeof this.actor.rollSkill
                !== "function"
        ) {

            ui.notifications.error(
                "Métro 2033 : la méthode rollSkill() n'est pas disponible sur cet Actor."
            );

            return;

        }


        try {

            /*
            * 1. Préparation métier.
            */
            const attributeId =
                this.actor.getSkillAttribute(
                    skillId
                );


            if (!attributeId) {

                throw new Error(
                    `Impossible de déterminer l'attribut lié à la compétence ${skillId}.`
                );

            }


            const {
                preparation
            } =
                SkillRollPreparationService
                    .create(
                        this.actor,
                        {
                            attribute:
                                attributeId,

                            skill:
                                skillId
                        }
                    );


            /*
            * 2. Choix utilisateur.
            */
            const resolvedPreparation =
                await ActionModifierDialog.prompt(
                    preparation,
                    {
                        title:
                            `${this.actor.name} — Jet de compétence`,

                        confirmLabel:
                            "Lancer"
                    }
                );


            /*
            * Annuler / X :
            *
            * aucun jet ;
            * aucun message Chat.
            */
            if (!resolvedPreparation) {

                return;

            }


            const totals =
                resolvedPreparation.totals
                ?? {};


            /*
            * Armes + équipements utilisent
            * les dés d'Équipement du moteur YZE.
            */
            const equipment =
                Number(
                    totals.weapon
                    ?? 0
                )
                +
                Number(
                    totals.equipment
                    ?? 0
                );


            /*
            * Talents, difficulté et modificateurs
            * deviennent un ajustement signé.
            */
            const adjustment =
                Number(
                    totals.talent
                    ?? 0
                )
                +
                Number(
                    totals.difficulty
                    ?? 0
                )
                +
                Number(
                    totals.modifier
                    ?? 0
                )
                +
                /*
                * « Subir 1 Stress pour +3 dés » (livre, p.190) :
                * omis par erreur jusqu'ici, la case cochée ne
                * changeait donc jamais réellement le jet.
                */
                Number(
                    totals.stressBonus
                    ?? 0
                );


            const bonus =
                Math.max(
                    0,
                    adjustment
                );


            const penalty =
                Math.max(
                    0,
                    -adjustment
                );


            /*
            * 3. Vrai jet YZE.
            */
            const result =
                await this.actor.rollSkill(
                    skillId,
                    {
                        attributeOverride:
                            resolvedPreparation
                                .base
                                ?.attribute
                            ?? null,

                        skillOverride:
                            resolvedPreparation
                                .base
                                ?.skill
                            ?? null,

                        equipment,

                        stressOverride:
                            resolvedPreparation
                                .base
                                ?.stress
                            ?? null,

                        /*
                        * « Subir 1 Stress pour +3 » (livre, p.190) :
                        * cf. ActionModifierService.
                        */
                        extraStressDie:
                            Number(
                                totals.extraStressDie
                                ?? 0
                            ),

                        bonus,

                        penalty,

                        context: {

                            preparation: {

                                base:
                                    foundry.utils.deepClone(
                                        resolvedPreparation.base
                                        ?? {}
                                    ),

                                sources:
                                    foundry.utils.deepClone(
                                        resolvedPreparation.sources
                                        ?? []
                                    ),

                                selectedSources:
                                    foundry.utils.deepClone(
                                        resolvedPreparation.selectedSources
                                        ?? []
                                    ),

                                difficulty:
                                    foundry.utils.deepClone(
                                        resolvedPreparation.difficulty
                                        ?? null
                                    ),

                                totals:
                                    foundry.utils.deepClone(
                                        resolvedPreparation.totals
                                        ?? {}
                                    )

                            }

                        }
                    }
                );


            /*
            * 4. Chat.
            */
            await YZERollChat.createMessage(
                result
            );

        }
        catch (error) {

            console.error(
                `Metro 2033 | Impossible d'effectuer le test de compétence ${skillId}`,
                error
            );


            ui.notifications.error(
                error.message
                ?? "Impossible d'effectuer le test de compétence."
            );

        }

    }


    /**
     * Jet de SURVIE (système Station, règles p.219) : pour chaque
     * semaine complète passée à rechercher une ressource, le PJ a
     * droit à ce jet non forçable. Choix de la Station et de la
     * ressource recherchée (StationSurvivalLauncherDialog), puis
     * jet de Compétence SURVIE via la fenêtre de préparation
     * universelle (modificateur de la ressource déjà prérempli),
     * comme n'importe quel autre jet de Compétence de cette fiche
     * — toute la logique vit dans
     * `station-survival-roll.mjs` pour rester réutilisable
     * ailleurs (ex. depuis une fiche de PNJ, le cas échéant).
     */
    async _onStationSurvivalRoll(
        event
    ) {

        event.preventDefault();


        try {

            await rollStationSurvivalForActor(
                this.actor
            );

        }
        catch (error) {

            console.error(
                "Metro 2033 | Impossible de lancer le Jet de Survie",
                error
            );


            ui.notifications.error(
                error.message
                ?? "Impossible de lancer le Jet de Survie."
            );

        }

    }


    /**
     * Demande à l'Actor d'augmenter
     * une compétence d'un niveau.
     */
    async _onSkillImprove(
        event
    ) {

        event.preventDefault();


        if (!this.isEditable) {
            return;
        }


        if (this._skillSavePromise) {

            await this._skillSavePromise;

        }


        const skillId =
            event.currentTarget
                .dataset.skill;


        if (!skillId) {
            return;
        }


        if (
            typeof this.actor.improveSkill
            !== "function"
        ) {

            ui.notifications.error(
                "Métro 2033 : la méthode improveSkill() n'est pas disponible sur cet Actor."
            );

            return;
        }


        try {

            const result =
                await this.actor.improveSkill(
                    skillId
                );


            if (!result.applied) {

                switch (
                    result.reason
                ) {

                    case "max-level":

                        ui.notifications.warn(
                            "Cette compétence est déjà au niveau maximum."
                        );

                        break;


                    case "insufficient-xp":

                        ui.notifications.warn(
                            `XP insuffisants. Il manque ${result.missingXp ?? 0} XP.`
                        );

                        break;


                    case "gm-approval-required":

                        ui.notifications.warn(
                            "Le passage du niveau 0 au niveau 1 nécessite l'autorisation du MJ."
                        );

                        break;


                    default:

                        ui.notifications.warn(
                            "Cette compétence ne peut pas être augmentée."
                        );

                        break;

                }


                return;
            }


            ui.notifications.info(
                `Compétence augmentée : ${result.previousLevel} → ${result.currentLevel} (${result.cost} XP).`
            );


            await this.render();

        }
        catch (error) {

            console.error(
                `Metro 2033 | Impossible d'améliorer la compétence ${skillId}`,
                error
            );


            ui.notifications.error(
                error.message
                ?? "Impossible d'augmenter cette compétence."
            );

        }

    }
    

    /**
     * Sauvegarde immédiatement
     * la valeur d'une compétence.
     */
    async _onSkillValueChange(
        event
    ) {

        if (!this.isEditable) {
            return;
        }


        const input =
            event.currentTarget;


        const skillId =
            input
                .closest(
                    "[data-skill]"
                )
                ?.dataset.skill;


        if (!skillId) {
            return;
        }


        const requestedValue =
            Number(
                input.value
            );


        if (
            !Number.isFinite(
                requestedValue
            )
        ) {
            return;
        }


        const value =
            Math.min(
                5,
                Math.max(
                    0,
                    Math.trunc(
                        requestedValue
                    )
                )
            );


        input.value =
            value;


        this._skillSavePromise =
            this.actor.update({

                [`system.skills.${skillId}`]:
                    value

            });


        try {

            await this._skillSavePromise;

        }
        finally {

            this._skillSavePromise =
                null;

        }

    }

    /**
     * Ouvre la fiche d'un Talent embarqué.
     */
    async _onTalentOpen(
        event
    ) {

        event.preventDefault();


        const talentId =
            event.currentTarget
                .dataset.talentId;


        if (!talentId) {
            return;
        }


        const talent =
            this.actor.items.get(
                talentId
            );


        if (
            !talent
            || talent.type !== "talent"
        ) {

            ui.notifications.warn(
                "Ce Talent est introuvable."
            );

            return;
        }


        talent.sheet?.render(
            true
        );

    }


    /**
     * Demande à l'Actor d'augmenter
     * un Talent d'un niveau.
     *
     * Le niveau actuel correspond au nombre
     * d'Embedded Items Talent partageant
     * le même system.key.
     *
     * La CharacterSheet ne calcule ni le coût,
     * ni le niveau : elle délègue intégralement
     * la progression à MetroActor.improveTalent().
     */
    async _onTalentImprove(
        event
    ) {

        event.preventDefault();


        if (!this.isEditable) {
            return;
        }


        const talentId =
            event.currentTarget
                .dataset.talentId;


        if (!talentId) {
            return;
        }


        if (
            typeof this.actor.improveTalent
            !== "function"
        ) {

            ui.notifications.error(
                "Métro 2033 : la méthode improveTalent() n'est pas disponible sur cet Actor."
            );

            return;

        }


        try {

            const result =
                await this.actor.improveTalent(
                    talentId
                );


            // ========================================================
            // PROGRESSION REFUSÉE
            // ========================================================

            if (
                !result.applied
            ) {

                switch (
                    result.reason
                ) {

                    case "max-level":

                        ui.notifications.warn(
                            `${result.talentName} est déjà au niveau maximum `
                            + `(${result.currentLevel}/${result.maxLevel}).`
                        );

                        break;


                    case "insufficient-xp":

                        ui.notifications.warn(
                            `XP insuffisants. Il manque ${result.missingXp ?? 0} XP.`
                        );

                        break;


                    case "invalid-level":

                        ui.notifications.warn(
                            "Le niveau actuel de ce Talent est invalide."
                        );

                        break;


                    case "invalid-max-level":

                        ui.notifications.warn(
                            "Le niveau maximum de ce Talent est invalide."
                        );

                        break;


                    default:

                        ui.notifications.warn(
                            "Ce Talent ne peut pas être augmenté."
                        );

                        break;

                }


                return;

            }


            // ========================================================
            // PROGRESSION APPLIQUÉE
            // ========================================================

            ui.notifications.info(
                `${result.talentName} : `
                + `${result.previousLevel}/${result.maxLevel} → `
                + `${result.currentLevel}/${result.maxLevel} `
                + `(${result.cost} XP).`
            );


            await this.render();

        }
        catch (error) {

            console.error(
                `Metro 2033 | Impossible d'améliorer le Talent ${talentId}`,
                error
            );


            ui.notifications.error(
                error.message
                ?? "Impossible d'augmenter ce Talent."
            );

        }

    }

    /**
     * Tri des talents
     */
    async _onTalentSort(event

    ) {
        event.preventDefault();

        const scrollContainer =
            this.element.querySelector(
                ".metro-character-sheet-form"
            );

        const scrollTop =
            scrollContainer?.scrollTop ?? 0;

        this._talentSortAscending =
            !this._talentSortAscending;

        await this.render();

        const refreshedScrollContainer =
            this.element.querySelector(
                ".metro-character-sheet-form"
            );

        if (refreshedScrollContainer) {
            refreshedScrollContainer.scrollTop =
                scrollTop;
        }
    }

    _activateCombatAmmunitionListeners(

    ) {

        const root = document.querySelector(
            `#${this.id}`
        );

        if (!root) {
            return;
        }

        const selects =
            root.querySelectorAll(
                ".metro-character-weapon-ammunition-select"
            );

        for (const select of selects) {

            select.addEventListener(
                "change",
                async event => {

                    const weaponId =
                        event.currentTarget.dataset.weaponId;

                    const ammunitionId =
                        event.currentTarget.value;

                    const actor = this.actor;

                    if (!actor) {
                        return;
                    }

                    const weapon =
                        actor.items.get(weaponId);

                    if (!weapon) {
                        ui.notifications.error(
                            "Arme introuvable."
                        );

                        return;
                    }

                    /*
                    * L'option « Aucune » ne désaffecte
                    * volontairement rien pour l'instant.
                    *
                    * La désaffectation sera traitée plus tard
                    * par une vraie méthode métier dédiée.
                    */
                    if (!ammunitionId) {

                        await this.render();

                        return;
                    }

                    const ammunition =
                        actor.items.get(ammunitionId);

                    if (!ammunition) {
                        ui.notifications.error(
                            "Munition introuvable."
                        );

                        await this.render();

                        return;
                    }

                    try {

                        const result =
                            await actor.assignAmmunitionToWeapon(
                                weapon,
                                ammunition
                            );

                        if (
                            result?.applied === false
                        ) {

                            ui.notifications.warn(
                                "Cette munition ne peut pas être affectée à cette arme."
                            );

                        }

                    } catch (error) {

                        console.error(
                            "Métro 2033 | Erreur lors de l'affectation de la munition.",
                            error
                        );

                        ui.notifications.error(
                            "Impossible d'affecter cette munition."
                        );

                    }

                    await this.render();
                }
            );
        }
    }  
    
    /**
     * Retourne l'unique Token ciblé par l'utilisateur
     * pour une attaque de Combat.
     *
     * La CharacterSheet collecte l'information UI.
     * La validation métier détaillée de la cible
     * reste effectuée par MetroActor.
     */
    _getSingleCombatTarget(

    ) {

        const targets =
            [
                ...game.user.targets
            ];


        if (
            targets.length === 0
        ) {

            ui.notifications.warn(
                "Sélectionnez une cible avant d'effectuer l'attaque."
            );

            return null;

        }


        if (
            targets.length > 1
        ) {

            ui.notifications.warn(
                "Une attaque ne peut cibler qu'un seul Token à la fois."
            );

            return null;

        }


        return targets[0];

    }

    _activateCombatAttackListeners(

    ) {

        const root = document.querySelector(
            `#${this.id}`
        );

        if (!root) {
            return;
        }


        // ============================================================
        // ATTAQUES NORMALES
        // ============================================================

        const attackButtons =
            root.querySelectorAll(
                ".metro-character-weapon-attack"
            );


        for (const button of attackButtons) {

            button.addEventListener(
                "click",
                async event => {

                    event.preventDefault();
                    const target =
                        this._getSingleCombatTarget();


                    if (!target) {
                        return;
                    }

                    const weaponId =
                        event.currentTarget.dataset.weaponId;

                    const attackType =
                        event.currentTarget.dataset.attackType;

                    const weapon =
                        this.actor.items.get(
                            weaponId
                        );


                    if (!weapon) {

                        ui.notifications.error(
                            "Arme introuvable."
                        );

                        return;
                    }


                    try {

                        let result = null;


                        if (
                            attackType === "ranged"
                        ) {

                            // ========================================================
                            // 1. PRÉPARATION MÉTIER
                            // ========================================================

                            const {
                                preparation
                            } =
                                RangedAttackPreparationService
                                    .create(
                                        this.actor,
                                        weapon,
                                        {
                                            burstFire:
                                                false
                                        }
                                    );


                            // ========================================================
                            // 2. FENÊTRE UNIVERSELLE
                            // ========================================================

                            const resolvedPreparation =
                                await ActionModifierDialog.prompt(
                                    preparation,
                                    {
                                        title:
                                            `${this.actor.name} — Tir avec ${weapon.name}`,

                                        confirmLabel:
                                            "Tirer"
                                    }
                                );


                            /*
                            * Annuler / X :
                            *
                            * aucun jet ;
                            * aucune consommation d'action ;
                            * aucune consommation de munition ;
                            * aucun message Chat.
                            */
                            if (!resolvedPreparation) {

                                return;

                            }


                            // ========================================================
                            // 3. TOTAL DES DÉS D'ÉQUIPEMENT
                            // ========================================================

                            const totals =
                                resolvedPreparation.totals
                                ?? {};


                            const equipment =
                                Number(
                                    totals.weapon
                                    ?? 0
                                )
                                +
                                Number(
                                    totals.equipment
                                    ?? 0
                                );


                            // ========================================================
                            // 4. AJUSTEMENT SIGNÉ
                            // ========================================================

                            const adjustment =
                                Number(
                                    totals.talent
                                    ?? 0
                                )
                                +
                                Number(
                                    totals.difficulty
                                    ?? 0
                                )
                                +
                                Number(
                                    totals.modifier
                                    ?? 0
                                )
                                +
                                /*
                                * « Subir 1 Stress pour +3 dés » (livre, p.190) :
                                * omis par erreur jusqu'ici, la case cochée ne
                                * changeait donc jamais réellement le jet.
                                */
                                Number(
                                    totals.stressBonus
                                    ?? 0
                                );


                            const bonus =
                                Math.max(
                                    0,
                                    adjustment
                                );


                            const penalty =
                                Math.max(
                                    0,
                                    -adjustment
                                );


                            // ========================================================
                            // 5. VRAIE ATTAQUE
                            // ========================================================

                            result =
                                await this.actor.rollRangedAttack(
                                    weapon,
                                    {
                                        target,

                                        burstFire:
                                            false,

                                        attributeOverride:
                                            resolvedPreparation
                                                .base
                                                ?.attribute
                                            ?? null,

                                        skillOverride:
                                            resolvedPreparation
                                                .base
                                                ?.skill
                                            ?? null,

                                        equipment,

                                        stressOverride:
                                            resolvedPreparation
                                                .base
                                                ?.stress
                                            ?? null,

                                        /*
                                        * « Subir 1 Stress pour +3 » (livre, p.190) :
                                        * cf. ActionModifierService.
                                        */
                                        extraStressDie:
                                            Number(
                                                totals.extraStressDie
                                                ?? 0
                                            ),

                                        bonus,

                                        penalty,

                                        context: {

                                            preparation: {

                                                base:
                                                    foundry.utils.deepClone(
                                                        resolvedPreparation.base
                                                        ?? {}
                                                    ),

                                                sources:
                                                    foundry.utils.deepClone(
                                                        resolvedPreparation.sources
                                                        ?? []
                                                    ),

                                                selectedSources:
                                                    foundry.utils.deepClone(
                                                        resolvedPreparation.selectedSources
                                                        ?? []
                                                    ),

                                                difficulty:
                                                    foundry.utils.deepClone(
                                                        resolvedPreparation.difficulty
                                                        ?? null
                                                    ),

                                                totals:
                                                    foundry.utils.deepClone(
                                                        resolvedPreparation.totals
                                                        ?? {}
                                                    )

                                            }

                                        }
                                    }
                                );


                            // ========================================================
                            // 5bis. AMÉLIORATIONS D'ARME — CONSOMMATION DE RESSOURCE
                            // ========================================================

                            await this._consumeSelectedWeaponModResources(
                                resolvedPreparation
                            );


                            // ========================================================
                            // 6. CHAT
                            // ========================================================

                            await YZERollChat.createMessage(
                                result
                            );

                        }
                        else if (
                            attackType === "melee"
                        ) {

                            const combat =
                                game.combat;


                            if (!combat) {

                                throw new Error(
                                    "Une attaque de mêlée nécessite un Combat actif."
                                );

                            }


                            const defender =
                                target.actor
                                ?? target.document?.actor
                                ?? null;


                            if (!defender) {

                                throw new Error(
                                    "L'Actor de la cible est introuvable."
                                );

                            }


                            const workflow =
                                await MeleeAttackWorkflowService.create(
                                    combat,
                                    {
                                        attacker:
                                            this.actor,

                                        defender,

                                        weapon,

                                        /*
                                         * Un Token non lié possède un Actor
                                         * synthétique dont les Items ne se
                                         * retrouvent pas via game.actors : le
                                         * workflow doit connaître le Token
                                         * attaquant pour retrouver l'arme.
                                         */
                                        attackerToken:
                                            this.actor.token
                                            ?? this.actor.getActiveTokens()[0]
                                            ?? null,

                                        defenderToken:
                                            target,

                                        canBlock:
                                            true
                                    }
                                );


                            await MeleeAttackChat.createMessage(
                                combat,
                                workflow
                            );


                            console.log(
                                "Métro 2033 | Workflow de mêlée créé :",
                                {
                                    combatId:
                                        combat.id,

                                    workflowId:
                                        workflow.id,

                                    attacker:
                                        this.actor.name,

                                    defender:
                                        defender.name,

                                    weapon:
                                        weapon.name,

                                    defenderTokenId:
                                        target.id
                                        ?? target.document?.id
                                        ?? null
                                }
                            );


                            return;

                        }
                        else {

                            throw new Error(
                                `Type d'attaque inconnu : ${attackType}`
                            );

                        }


                        console.log(
                            "Métro 2033 | Résultat attaque :",
                            result
                        );

                    }
                    catch (error) {

                        console.error(
                            "Métro 2033 | Erreur attaque :",
                            error
                        );

                        ui.notifications.error(
                            error.message
                            ?? "Impossible d'effectuer l'attaque."
                        );

                    }

                }
            );

        }


        // ============================================================
        // RAFALES
        // ============================================================

        const burstButtons =
            root.querySelectorAll(
                ".metro-character-weapon-burst"
            );


        for (const button of burstButtons) {

            button.addEventListener(
                "click",
                async event => {

                    event.preventDefault();


                    const target =
                        this._getSingleCombatTarget();

                    if (!target) {
                        return;
                    }


                    const weaponId =
                        event.currentTarget.dataset.weaponId;


                    const weapon =
                        this.actor.items.get(
                            weaponId
                        );


                    if (!weapon) {

                        ui.notifications.error(
                            "Arme introuvable."
                        );

                        return;

                    }


                    try {

                        // ========================================================
                        // 1. PRÉPARATION MÉTIER
                        // ========================================================

                        const {
                            preparation
                        } =
                            RangedAttackPreparationService
                                .create(
                                    this.actor,
                                    weapon,
                                    {
                                        burstFire:
                                            true
                                    }
                                );


                        // ========================================================
                        // 2. FENÊTRE UNIVERSELLE
                        // ========================================================

                        const resolvedPreparation =
                            await ActionModifierDialog.prompt(
                                preparation,
                                {
                                    title:
                                        `${this.actor.name} — Rafale avec ${weapon.name}`,

                                    confirmLabel:
                                        "Tirer en rafale"
                                }
                            );


                        /*
                        * Annuler / X :
                        *
                        * aucun jet ;
                        * aucune consommation d'action ;
                        * aucune consommation de munition ;
                        * aucun message Chat.
                        */
                        if (!resolvedPreparation) {

                            return;

                        }


                        // ========================================================
                        // 3. TOTAL DES DÉS D'ÉQUIPEMENT
                        // ========================================================

                        const totals =
                            resolvedPreparation.totals
                            ?? {};


                        const equipment =
                            Number(
                                totals.weapon
                                ?? 0
                            )
                            +
                            Number(
                                totals.equipment
                                ?? 0
                            );


                        // ========================================================
                        // 4. AJUSTEMENT SIGNÉ
                        // ========================================================

                        const adjustment =
                            Number(
                                totals.talent
                                ?? 0
                            )
                            +
                            Number(
                                totals.difficulty
                                ?? 0
                            )
                            +
                            Number(
                                totals.modifier
                                ?? 0
                            )
                            +
                            /*
                            * « Subir 1 Stress pour +3 dés » (livre, p.190) :
                            * omis par erreur jusqu'ici, la case cochée ne
                            * changeait donc jamais réellement le jet.
                            */
                            Number(
                                totals.stressBonus
                                ?? 0
                            );


                        const bonus =
                            Math.max(
                                0,
                                adjustment
                            );


                        const penalty =
                            Math.max(
                                0,
                                -adjustment
                            );


                        // ========================================================
                        // 5. ATTAQUE EN RAFALE
                        // ========================================================

                        const result =
                            await this.actor.rollRangedAttack(
                                weapon,
                                {
                                    target,

                                    burstFire:
                                        true,

                                    attributeOverride:
                                        resolvedPreparation
                                            .base
                                            ?.attribute
                                        ?? null,

                                    skillOverride:
                                        resolvedPreparation
                                            .base
                                            ?.skill
                                        ?? null,

                                    equipment,

                                    stressOverride:
                                        resolvedPreparation
                                            .base
                                            ?.stress
                                        ?? null,

                                    /*
                                    * « Subir 1 Stress pour +3 » (livre, p.190) :
                                    * cf. ActionModifierService.
                                    */
                                    extraStressDie:
                                        Number(
                                            totals.extraStressDie
                                            ?? 0
                                        ),

                                    bonus,

                                    penalty,

                                    context: {

                                        preparation: {

                                            base:
                                                foundry.utils.deepClone(
                                                    resolvedPreparation.base
                                                    ?? {}
                                                ),

                                            sources:
                                                foundry.utils.deepClone(
                                                    resolvedPreparation.sources
                                                    ?? []
                                                ),

                                            selectedSources:
                                                foundry.utils.deepClone(
                                                    resolvedPreparation.selectedSources
                                                    ?? []
                                                ),

                                            difficulty:
                                                foundry.utils.deepClone(
                                                    resolvedPreparation.difficulty
                                                    ?? null
                                                ),

                                            totals:
                                                foundry.utils.deepClone(
                                                    resolvedPreparation.totals
                                                    ?? {}
                                                )

                                        }

                                    }
                                }
                            );


                        // ========================================================
                        // 5bis. AMÉLIORATIONS D'ARME — CONSOMMATION DE RESSOURCE
                        // ========================================================

                        await this._consumeSelectedWeaponModResources(
                            resolvedPreparation
                        );


                        // ========================================================
                        // 6. CHAT
                        // ========================================================

                        await YZERollChat.createMessage(
                            result
                        );

                    }
                    catch (error) {

                        console.error(
                            "Métro 2033 | Erreur rafale :",
                            error
                        );


                        ui.notifications.error(
                            error.message
                            ?? "Impossible d'effectuer la rafale."
                        );

                    }

                }
            );

        }

    }    

    /**
     * Décompte, après résolution d'un jet, la ressource des
     * Améliorations d'arme (weaponMod) sélectionnées dans la
     * fenêtre de préparation.
     *
     * IMPORTANT — timing :
     *
     * cette méthode ne doit être appelée qu'APRÈS résolution du
     * jet (actor.rollRangedAttack déjà résolu), jamais avant, ni
     * si la préparation a été annulée. C'est exactement le même
     * timing que la persistance du dé de Stress « Subir 1 Stress
     * pour +3 » (cf. addStress() dans actor.mjs), afin de ne
     * jamais décompter une ressource si le dialogue est annulé.
     *
     * Une Amélioration d'arme sélectionnée mais sans ressource
     * requise (resourceId vide) ne consomme rien : la sélection
     * reste purement informative/narrative, gérée par le MJ.
     */
    async _consumeSelectedWeaponModResources(
        resolvedPreparation
    ) {

        const selectedWeaponMods =
            resolvedPreparation
                ?.selectedWeaponMods
            ?? [];


        for (
            const weaponMod
            of selectedWeaponMods
        ) {

            if (!weaponMod.resourceId) {

                continue;

            }


            try {

                await this.actor.consumeResource(
                    weaponMod.resourceId,
                    weaponMod.resourceAmount
                        ?? 1
                );

            }
            catch (error) {

                console.error(
                    "Métro 2033 | Impossible de décompter la ressource d'une Amélioration d'arme.",
                    {
                        weaponMod,
                        error
                    }
                );


                ui.notifications.warn(
                    `Ressource insuffisante pour ${weaponMod.name} : son effet n'a pas été décompté.`
                );

            }

        }

    }


    /**
     * Branche les interactions communes aux Items embarqués
     * affichés dans la CharacterSheet.
     *
     * Le même menu est ouvert :
     * - avec le bouton ⋮ ;
     * - avec un clic droit sur la ligne de l'Item.
     */
    _activateEmbeddedItemMenuListeners(

    ) {

        const actionButtons =
            this.element.querySelectorAll(
                ".metro-character-item-actions[data-item-id]"
            );


        for (
            const button
            of actionButtons
        ) {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    this._openEmbeddedItemMenu(
                        event.currentTarget,
                        event.currentTarget.dataset.itemId
                    );

                }
            );

        }


        const itemRows =
            this.element.querySelectorAll(
                ".metro-character-embedded-item[data-item-id]"
            );


        for (
            const row
            of itemRows
        ) {

            row.addEventListener(
                "contextmenu",
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    this._openEmbeddedItemMenu(
                        event.currentTarget,
                        event.currentTarget.dataset.itemId
                    );

                }
            );

        }


        /*
         * Bouton "nom de l'objet" de l'onglet Équipement :
         * un simple clic ouvre directement la fiche de l'Item,
         * sans passer par le menu contextuel.
         */
        const equipmentLinks =
            this.element.querySelectorAll(
                ".metro-character-equipment-link[data-item-id]"
            );


        for (
            const link
            of equipmentLinks
        ) {

            link.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    this._editEmbeddedItem(
                        event.currentTarget.dataset.itemId
                    );

                }
            );

        }


        /*
         * Stepper +/- de l'onglet Équipement (Munitions
         * et Consommables uniquement).
         */
        const stepperButtons =
            this.element.querySelectorAll(
                ".metro-character-equipment-stepper-button[data-item-id]"
            );


        for (
            const button
            of stepperButtons
        ) {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();


                    const delta =
                        event.currentTarget.dataset.action
                            === "decrement"
                            ? -1
                            : 1;


                    this._adjustStackQuantity(
                        event.currentTarget.dataset.itemId,
                        delta
                    );

                }
            );

        }


        /*
         * Case « Équipée » de l'onglet Équipement (Armes et
         * Protections uniquement). Volontairement sans attribut
         * "name" : il s'agit d'un champ d'un Item embarqué, pas
         * un champ de l'Actor — même convention que les cases
         * d'état Foundry de l'onglet Survie ci-dessous.
         */
        const equippedCheckboxes =
            this.element.querySelectorAll(
                ".metro-character-equipment-equipped-checkbox[data-item-id]"
            );


        for (
            const checkbox
            of equippedCheckboxes
        ) {

            checkbox.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    this._toggleEquippedItem(
                        event.currentTarget.dataset.itemId
                    );

                }
            );

        }


        /*
         * Lien "nom de l'objet" de la liste Blessures/Traumas
         * de l'onglet Survie : ouvre directement la fiche
         * de l'Item, sans passer par le menu contextuel.
         */
        const survivalLinks =
            this.element.querySelectorAll(
                ".metro-character-survival-link[data-item-id]"
            );


        for (
            const link
            of survivalLinks
        ) {

            link.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    this._editEmbeddedItem(
                        event.currentTarget.dataset.itemId
                    );

                }
            );

        }


        /*
         * Boutons "Jet de Réserve" (un par ressource de survie).
         */
        const reserveRollButtons =
            this.element.querySelectorAll(
                ".metro-character-survival-reserve-roll[data-resource]"
            );


        for (
            const button
            of reserveRollButtons
        ) {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    this._rollSurvivalReserve(
                        event.currentTarget.dataset.resource
                    );

                }
            );

        }


        /*
         * Bouton "Effets des radiations".
         */
        const radiationEffectsButton =
            this.element.querySelector(
                ".metro-character-survival-radiation-roll"
            );


        if (radiationEffectsButton) {

            radiationEffectsButton.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    this._rollRadiationEffects();

                }
            );

        }


        /*
         * Bouton "Repos".
         */
        const restButton =
            this.element.querySelector(
                ".metro-character-survival-rest"
            );


        if (restButton) {

            restButton.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    this._applySurvivalRest();

                }
            );

        }


        /*
         * Bouton "Second souffle" (Talent), sous "Repos".
         */
        const secondWindButton =
            this.element.querySelector(
                ".metro-character-survival-second-wind"
            );


        if (secondWindButton) {

            const vigorField =
                this.element.querySelector(
                    '[name="system.attributes.vigor.value"]'
                );

            if (vigorField) {

                for (
                    const eventName
                    of ["input", "change"]
                ) {

                    vigorField.addEventListener(
                        eventName,
                        () =>
                            this._syncSecondWindButton()
                    );

                }

            }

            secondWindButton.addEventListener(
                "click",
                async event => {

                    event.preventDefault();
                    event.stopPropagation();

                    if (secondWindButton.disabled) {
                        return;
                    }

                    secondWindButton.disabled =
                        true;

                    try {

                        await this._useSecondWind();

                    }
                    catch (error) {

                        console.error(
                            "Metro 2033 | Impossible d'exécuter Second souffle",
                            error
                        );

                        ui.notifications.error(
                            error.message
                            ?? "Impossible d'exécuter Second souffle."
                        );

                    }
                    finally {

                        secondWindButton.disabled =
                            false;

                    }

                }
            );

        }


        /*
         * États Foundry propres à Métro 2033 (Asphyxié...),
         * onglet Survie. Volontairement sans attribut "name" :
         * ce ne sont pas des champs du DataModel, ils ne doivent
         * donc pas être captés par la sauvegarde générique des
         * champs de l'onglet Survie ci-dessus.
         */
        const statusEffectCheckboxes =
            this.element.querySelectorAll(
                ".metro-character-survival-status-effect [data-status-id]"
            );


        for (
            const checkbox
            of statusEffectCheckboxes
        ) {

            checkbox.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    this._toggleStatusEffect(
                        event.currentTarget.dataset.statusId
                    );

                }
            );

        }


        /*
         * Champs de l'onglet Survie (Stress, Sang-froid,
         * Réserves, Radiation, États) : enregistrement
         * immédiat à chaque modification, contrairement au
         * reste de la fiche (sauvegardée à la fermeture).
         *
         * Ces valeurs évoluent en cours de partie et doivent
         * rester à jour sans que le joueur ou le MJ ait à
         * fermer la fiche pour les voir prises en compte.
         */
        const survivalFields =
            this.element.querySelectorAll(
                ".metro-character-survival input[name]"
            );


        for (
            const field
            of survivalFields
        ) {

            field.addEventListener(
                "change",
                event => {

                    this._commitSurvivalField(
                        event.currentTarget
                    );

                }
            );

        }


        /*
         * Bouton "Jet de Trépas" (Blessures critiques fatales).
         */
        const deathRollButtons =
            this.element.querySelectorAll(
                ".metro-character-survival-death-roll[data-item-id]"
            );


        for (
            const button
            of deathRollButtons
        ) {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    this._rollDeathSave(
                        event.currentTarget.dataset.itemId
                    );

                }
            );

        }


        /*
         * Onglet Biographie : ajout / retrait de lignes
         * dans la liste des Liens (PJ/PNJ), sur le même
         * motif que les listes des Items Faction/Station.
         */
        const biographyListAddButtons =
            this.element.querySelectorAll(
                ".metro-character-biography [data-action='addListRow']"
            );

        for (
            const button
            of biographyListAddButtons
        ) {

            button.addEventListener(
                "click",
                () => this._addBiographyListRow(
                    button.dataset.list
                )
            );

        }


        const biographyListRemoveButtons =
            this.element.querySelectorAll(
                ".metro-character-biography [data-action='removeListRow']"
            );

        for (
            const button
            of biographyListRemoveButtons
        ) {

            button.addEventListener(
                "click",
                () => this._removeBiographyListRow(
                    button.dataset.list,
                    Number(button.dataset.index)
                )
            );

        }


        /*
         * Onglet Biographie : zones de dépôt Faction /
         * Station / Acteur lié (glisser-déposer un Document
         * Foundry). Le dépôt met à jour l'Actor directement,
         * indépendamment de la sauvegarde à la fermeture.
         */
        const documentReferenceDropzones =
            this.element.querySelectorAll(
                ".metro-character-doc-ref[data-uuid-field]"
            );

        for (
            const dropzone
            of documentReferenceDropzones
        ) {

            dropzone.addEventListener(
                "dragover",
                event => {
                    event.preventDefault();
                }
            );

            dropzone.addEventListener(
                "drop",
                event => {

                    event.preventDefault();

                    this._onDocumentReferenceDrop(
                        event,
                        dropzone.dataset.uuidField,
                        (dropzone.dataset.allowedTypes ?? "")
                            .split(",")
                            .map(type => type.trim())
                            .filter(type => type !== "")
                    );

                }
            );

        }


        const documentReferenceOpenButtons =
            this.element.querySelectorAll(
                ".metro-character-doc-ref-open[data-uuid-field]"
            );

        for (
            const button
            of documentReferenceOpenButtons
        ) {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    this._openDocumentReference(
                        button.dataset.uuidField
                    );

                }
            );

        }


        const documentReferenceClearButtons =
            this.element.querySelectorAll(
                ".metro-character-doc-ref-clear[data-uuid-field]"
            );

        for (
            const button
            of documentReferenceClearButtons
        ) {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    this._clearDocumentReference(
                        button.dataset.uuidField
                    );

                }
            );

        }

    }


    /**
     * Ajoute une ligne vide à une liste de l'onglet
     * Biographie (actuellement : narrative.relationships).
     */
    async _addBiographyListRow(
        listName
    ) {

        if (listName !== "relationships") {
            return;
        }

        const current =
            foundry.utils.deepClone(
                this.actor.system.narrative?.relationships
                ?? []
            );

        current.push({
            actor: "",
            type: "",
            description: ""
        });

        await this.actor.update({
            "system.narrative.relationships": current
        });

    }


    /**
     * Retire une ligne d'une liste de l'onglet Biographie.
     */
    async _removeBiographyListRow(
        listName,
        index
    ) {

        if (listName !== "relationships") {
            return;
        }

        const current =
            foundry.utils.deepClone(
                this.actor.system.narrative?.relationships
                ?? []
            );

        if (
            index < 0
            || index >= current.length
        ) {
            return;
        }

        current.splice(index, 1);

        await this.actor.update({
            "system.narrative.relationships": current
        });

    }


    /**
     * Traite le dépôt d'un Document Foundry (glisser-déposer)
     * sur une zone de référence de l'onglet Biographie
     * (Faction, Station, Acteur lié d'un Lien).
     *
     * Le format brut du transfert (JSON dans "text/plain")
     * est lu directement plutôt que via une méthode d'API
     * propre à une version de Foundry précise : ce format
     * est stable depuis les premières versions de Foundry
     * VTT et ne dépend d'aucune classe utilitaire pouvant
     * changer d'emplacement d'une version à l'autre.
     */
    async _onDocumentReferenceDrop(
        event,
        path,
        allowedTypes
    ) {

        if (!path) {
            return;
        }

        let data;

        try {

            data =
                JSON.parse(
                    event.dataTransfer.getData("text/plain")
                );

        } catch (error) {

            return;

        }

        const uuid =
            data?.uuid;

        if (!uuid) {
            return;
        }

        let document = null;

        try {

            document =
                await fromUuid(uuid);

        } catch (error) {

            document = null;

        }

        if (!document) {

            ui.notifications.warn(
                "Impossible de résoudre le Document déposé."
            );

            return;

        }

        if (
            allowedTypes.length > 0
            && !allowedTypes.includes(document.type)
        ) {

            ui.notifications.warn(
                "Ce Document n'est pas du type attendu ici."
            );

            return;

        }

        await this.actor.update({
            [path]: uuid
        });

    }


    /**
     * Ouvre la fiche du Document référencé à ce chemin.
     */
    async _openDocumentReference(
        path
    ) {

        if (!path) {
            return;
        }

        const uuid =
            foundry.utils.getProperty(
                this.actor,
                path
            );

        if (!uuid) {
            return;
        }

        let document = null;

        try {

            document =
                await fromUuid(uuid);

        } catch (error) {

            document = null;

        }

        if (!document) {

            ui.notifications.warn(
                "Ce Document est introuvable."
            );

            return;

        }

        document.sheet?.render(true);

    }


    /**
     * Retire la référence de Document à ce chemin.
     */
    async _clearDocumentReference(
        path
    ) {

        if (!path) {
            return;
        }

        await this.actor.update({
            [path]: ""
        });

    }


    /**
     * Enregistre immédiatement un champ de l'onglet Survie
     * sur l'Actor, dès sa modification (voir commentaire
     * de câblage ci-dessus).
     */
    async _commitSurvivalField(
        input
    ) {

        const name =
            input.name;

        if (!name) {
            return;
        }


        let value;

        if (input.type === "checkbox") {

            value =
                input.checked;

        } else if (input.type === "number") {

            const raw =
                input.value.trim();

            if (raw === "") {
                return;
            }

            const parsed =
                Number(raw);

            if (!Number.isFinite(parsed)) {
                return;
            }

            let clamped =
                parsed;

            if (input.min !== "") {

                clamped =
                    Math.max(
                        Number(input.min),
                        clamped
                    );

            }

            if (input.max !== "") {

                clamped =
                    Math.min(
                        Number(input.max),
                        clamped
                    );

            }

            value =
                Math.round(
                    clamped
                );

        } else {

            value =
                input.value;

        }


        await this.actor.update({
            [name]: value
        });

    }


    /**
     * Ouvre le menu contextuel commun d'un Item embarqué.
     */
    _openEmbeddedItemMenu(
        anchor,
        itemId
    ) {

        this._closeEmbeddedItemMenu();


        if (!itemId) {
            return;
        }


        const item =
            this.actor.items.get(
                itemId
            );


        if (!item) {

            ui.notifications.warn(
                "Cet élément est introuvable."
            );

            return;
        }


        const menu =
            document.createElement(
                "div"
            );


        menu.classList.add(
            "metro-character-item-context-menu"
        );


        menu.dataset.itemId =
            item.id;


        const hasDuplicates =
            this._findStackDuplicates(
                item
            ).length > 0;


        menu.innerHTML = `
            <button
                type="button"
                class="metro-character-item-context-action"
                data-action="edit"
            >
                <i
                    class="fa-solid fa-pen"
                    aria-hidden="true"
                ></i>

                <span>Éditer</span>
            </button>

            ${
                hasDuplicates
                    ? `
            <button
                type="button"
                class="metro-character-item-context-action"
                data-action="merge"
            >
                <i
                    class="fa-solid fa-layer-group"
                    aria-hidden="true"
                ></i>

                <span>Fusionner les doublons</span>
            </button>
            `
                    : ""
            }

            <button
                type="button"
                class="metro-character-item-context-action"
                data-action="delete"
            >
                <i
                    class="fa-solid fa-trash"
                    aria-hidden="true"
                ></i>

                <span>Supprimer</span>
            </button>

            <button
                type="button"
                class="metro-character-item-context-action"
                data-action="chat"
            >
                <i
                    class="fa-solid fa-message"
                    aria-hidden="true"
                ></i>

                <span>Post to Chat</span>
            </button>
        `;


        /*
         * Pour cette première étape, les boutons ne déclenchent
         * encore aucune action métier.
         *
         * On valide d'abord l'infrastructure du menu.
         */
        for (
            const button
            of menu.querySelectorAll(
                ".metro-character-item-context-action"
            )
        ) {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();


                    const action =
                        event.currentTarget.dataset.action;


                    if (
                        action === "edit"
                    ) {

                        this._editEmbeddedItem(
                            item.id
                        );

                        return;

                    }


                    if (
                        action === "merge"
                    ) {

                        this._closeEmbeddedItemMenu();

                        this._mergeStackDuplicates(
                            item.id
                        );

                        return;

                    }


                    if (
                        action === "delete"
                    ) {

                        this._deleteEmbeddedItem(
                            item.id
                        );

                    }

                    if (
                        action === "chat"
                    ) {

                        this._postEmbeddedItemToChat(
                            item.id
                        );

                    }                    

                }
            );

        }


        document.body.appendChild(
            menu
        );


        const rect =
            anchor.getBoundingClientRect();


        menu.style.position =
            "fixed";

        menu.style.left =
            `${rect.right - menu.offsetWidth}px`;

        menu.style.top =
            `${rect.bottom + 4}px`;

        menu.style.zIndex =
            "10000";


        this._embeddedItemMenu =
            menu;


        this._embeddedItemMenuCloseHandler =
            event => {

                if (
                    this._embeddedItemMenu
                    ?.contains(
                        event.target
                    )
                ) {
                    return;
                }

                this._closeEmbeddedItemMenu();

            };


        /*
         * setTimeout évite que le clic ayant ouvert le menu
         * soit immédiatement interprété comme un clic extérieur.
         */
        setTimeout(
            () => {

                document.addEventListener(
                    "pointerdown",
                    this._embeddedItemMenuCloseHandler
                );

            },
            0
        );

    }


    /**
     * Ouvre la Sheet d'un Item embarqué de l'Actor.
     */
    _editEmbeddedItem(
        itemId
    ) {

        const item =
            this.actor.items.get(
                itemId
            );


        if (!item) {

            ui.notifications.warn(
                "Cet élément est introuvable."
            );

            return;

        }


        this._closeEmbeddedItemMenu();


        item.sheet.render(
            true
        );

    }


    /**
     * Supprime un Item embarqué de l'Actor
     * après confirmation explicite.
     */
    async _deleteEmbeddedItem(
        itemId
    ) {

        const item =
            this.actor.items.get(
                itemId
            );


        if (!item) {

            ui.notifications.warn(
                "Cet élément est introuvable."
            );

            return;

        }


        this._closeEmbeddedItemMenu();


        const confirmed =
            await foundry.applications.api.DialogV2.confirm(
                {
                    window: {
                        title: "Supprimer l'élément"
                    },

                    content: `
                        <p>
                            Voulez-vous vraiment supprimer
                            <strong>${item.name}</strong> ?
                        </p>

                        <p>
                            Cette action est irréversible.
                        </p>
                    `,

                    yes: {
                        label: "Supprimer",
                        icon: "fa-solid fa-trash"
                    },

                    no: {
                        label: "Annuler",
                        icon: "fa-solid fa-xmark"
                    }
                }
            );


        if (!confirmed) {
            return;
        }


        await this.actor.deleteEmbeddedDocuments(
            "Item",
            [
                item.id
            ]
        );

    }

    /**
     * Publie un Item embarqué dans le Chat.
     */
    async _postEmbeddedItemToChat(
        itemId
    ) {

        const item =
            this.actor.items.get(
                itemId
            );


        if (!item) {

            ui.notifications.warn(
                "Cet élément est introuvable."
            );

            return;

        }


        this._closeEmbeddedItemMenu();


        const description =
            item.system?.description
            ?? "";

        const itemUuid =
            item.uuid;            


        const content = `
            <div
                class="metro-chat-item-card"
                data-item-uuid="${itemUuid}"
            >

                <header class="metro-chat-item-card-header">

                    <a
                        class="metro-chat-item-card-link"
                        data-uuid="${itemUuid}"
                    >

                        <img
                            class="metro-chat-item-card-image"
                            src="${item.img}"
                            alt="${item.name}"
                        >

                        <strong class="metro-chat-item-card-name">
                            ${item.name}
                        </strong>

                    </a>

                </header>

            </div>
        `;


        await ChatMessage.create({

            speaker:
                ChatMessage.getSpeaker({
                    actor:
                        this.actor
                }),

            content

        });

    }    

    /**
     * Ferme le menu contextuel d'Item embarqué actuellement ouvert.
     */
    _closeEmbeddedItemMenu(

    ) {

        if (
            this._embeddedItemMenuCloseHandler
        ) {

            document.removeEventListener(
                "pointerdown",
                this._embeddedItemMenuCloseHandler
            );

        }


        this._embeddedItemMenuCloseHandler =
            null;


        if (
            this._embeddedItemMenu
        ) {

            this._embeddedItemMenu.remove();

        }


        this._embeddedItemMenu =
            null;

    }

    _activateCombatItemListeners(
        
    ) {

        const links =
            this.element.querySelectorAll(
                ".metro-character-combat-item-link"
            );

        for (const link of links) {

            link.addEventListener(
                "click",
                async event => {

                    event.preventDefault();                 

                    const itemId =
                        event.currentTarget
                            .dataset.itemId;

                    if (!itemId) {
                        return;
                    }

                    const item =
                        this.actor.items.get(
                            itemId
                        );

                    if (!item) {

                        ui.notifications.warn(
                            "Cet équipement est introuvable."
                        );

                        return;
                    }

                    item.sheet?.render(
                        true
                    );

                }
            );

        }

    }

    /**
     * Active l'ouverture directe d'un Item embarqué
     * depuis la CharacterSheet.
     */
    _activateEmbeddedItemOpenListeners(
        
    ) {

        const root =
            this.element;

        if (!root) {
            return;
        }

        root
            .querySelectorAll(
                '[data-action="openEmbeddedItem"]'
            )
            .forEach(
                element => {

                    element.addEventListener(
                        "click",
                        event => {

                            event.preventDefault();

                            const itemId =
                                event.currentTarget
                                    ?.dataset
                                    ?.itemId;

                            if (!itemId) {
                                return;
                            }

                            this._editEmbeddedItem(
                                itemId
                            );
                        }
                    );
                }
            );
    }    

    /**
     * Active la navigation par onglets de la CharacterSheet.
     */
    _activateCharacterTabListeners(
        
    ) {

        const root =
            this.element;


        if (!root) {
            return;
        }


        const tabs =
            root.querySelectorAll(
                "[data-character-tab]"
            );


        const panels =
            root.querySelectorAll(
                "[data-character-tab-panel]"
            );


        if (
            tabs.length === 0
            || panels.length === 0
        ) {
            return;
        }


        const activateTab =
            tabId => {

                this._activeCharacterTab =
                    tabId;


                for (
                    const tab
                    of tabs
                ) {

                    const isActive =
                        tab.dataset.characterTab
                        === tabId;


                    tab.classList.toggle(
                        "is-active",
                        isActive
                    );


                    tab.setAttribute(
                        "aria-selected",
                        isActive
                            ? "true"
                            : "false"
                    );

                }


                for (
                    const panel
                    of panels
                ) {

                    const isActive =
                        panel.dataset.characterTabPanel
                        === tabId;


                    panel.classList.toggle(
                        "is-active",
                        isActive
                    );


                    panel.hidden =
                        !isActive;

                }

            };


        const initialTab =
            this._activeCharacterTab
            ?? "skills";


        activateTab(
            initialTab
        );


        for (
            const tab
            of tabs
        ) {

            tab.addEventListener(
                "click",
                event => {

                    event.preventDefault();


                    const tabId =
                        event.currentTarget
                            .dataset.characterTab;


                    if (!tabId) {
                        return;
                    }


                    activateTab(
                        tabId
                    );

                }
            );

        }

    }    

}