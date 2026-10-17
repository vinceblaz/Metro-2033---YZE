import { test } from "node:test";
import assert from "node:assert/strict";

import {
    ActionPreparationService
} from "../../src/action-resolution/action-preparation-service.mjs";

import {
    ACTION_RESOLUTION_TYPES
} from "../../src/domain/rules/action-resolution-context.mjs";

import {
    ACTION_MODIFIER_SOURCES
} from "../../src/action-resolution/action-modifier-service.mjs";


/**
 * Ce fichier verrouille le comportement actuel de
 * action-preparation-service.mjs (aucun test n'existait
 * avant ce chantier).
 *
 * ActionPreparationService délègue :
 *
 * - la résolution des valeurs de base à action-base-resolver.mjs ;
 * - la collecte des sources à action-modifier-sources.mjs ;
 * - la construction de la préparation à ActionModifierService.
 *
 * Ces couches possèdent déjà leurs propres tests dédiés.
 * Ici, on verrouille uniquement le contrat public de
 * ActionPreparationService.create : validations, câblage
 * des dépendances, valeurs par défaut.
 */


/* ============================================================
 * STUBS
 * ============================================================ */


function createActor(
    {
        type = "character",
        attributes = {},
        skills = {},
        stress = {
            dice: 0
        },
        items = []
    } = {}
) {

    return {

        type,

        items,

        system: {

            attributes,

            skills,

            stress

        }

    };

}


function createWeaponItem(
    {
        id = "weapon-1",
        name = "Couteau",
        equipped = true,
        usableEquipmentBonus = 1,
        skillId = "closeCombat"
    } = {}
) {

    return {

        id,

        name,

        type: "weapon",

        system: {

            equipped,

            usableEquipmentBonus,

            skillId

        }

    };

}


/* ============================================================
 * VALIDATIONS
 * ============================================================ */


test(
    "create : lève une erreur si actor est absent",
    () => {

        const context = {
            actionType: ACTION_RESOLUTION_TYPES.ATTRIBUTE_ROLL,
            attribute: "vigor",
            skill: "closeCombat"
        };


        assert.throws(
            () =>
                ActionPreparationService.create(
                    null,
                    context
                ),
            TypeError
        );

    }
);


test(
    "create : lève une erreur si context est absent",
    () => {

        const actor = createActor();


        assert.throws(
            () =>
                ActionPreparationService.create(
                    actor,
                    null
                ),
            TypeError
        );

    }
);


/* ============================================================
 * CÂBLAGE DES VALEURS DE BASE
 * ============================================================ */


test(
    "create : résout les valeurs de base à partir de l'Actor et du contexte",
    () => {

        const actor = createActor({
            attributes: {
                vigor: {
                    value: 4
                }
            },
            skills: {
                closeCombat: 2
            },
            stress: {
                dice: 1
            }
        });

        const context = {
            actionType: ACTION_RESOLUTION_TYPES.ATTRIBUTE_ROLL,
            attribute: "vigor",
            skill: "closeCombat"
        };

        const preparation =
            ActionPreparationService.create(
                actor,
                context
            );


        assert.deepEqual(
            preparation.base,
            {
                attribute: 4,
                skill: 2,
                stress: 1
            }
        );

    }
);


test(
    "create : le stress reste toujours nul pour un PNJ",
    () => {

        const actor = createActor({
            type: "npc",
            attributes: {
                vigor: {
                    value: 3
                }
            },
            skills: {
                closeCombat: 1
            },
            stress: {
                dice: 9
            }
        });

        const context = {
            actionType: ACTION_RESOLUTION_TYPES.ATTRIBUTE_ROLL,
            attribute: "vigor",
            skill: "closeCombat"
        };

        const preparation =
            ActionPreparationService.create(
                actor,
                context
            );


        assert.equal(
            preparation.base.stress,
            0
        );

    }
);


/* ============================================================
 * CÂBLAGE DES SOURCES
 * ============================================================ */


test(
    "create : collecte les armes équipées compatibles avec le test",
    () => {

        const weapon =
            createWeaponItem();

        const actor = createActor({
            items: [
                weapon
            ]
        });

        const context = {
            actionType: ACTION_RESOLUTION_TYPES.SKILL_ROLL,
            attribute: "vigor",
            skill: "closeCombat"
        };

        const preparation =
            ActionPreparationService.create(
                actor,
                context
            );


        assert.equal(
            preparation.sources.length,
            1
        );

        assert.equal(
            preparation.sources[0].type,
            ACTION_MODIFIER_SOURCES.WEAPON
        );

        assert.equal(
            preparation.sources[0].bonus,
            1
        );

    }
);


test(
    "create : n'ajoute aucune source si l'arme n'est pas équipée",
    () => {

        const weapon =
            createWeaponItem({
                equipped: false
            });

        const actor = createActor({
            items: [
                weapon
            ]
        });

        const context = {
            actionType: ACTION_RESOLUTION_TYPES.SKILL_ROLL,
            attribute: "vigor",
            skill: "closeCombat"
        };

        const preparation =
            ActionPreparationService.create(
                actor,
                context
            );


        assert.deepEqual(
            preparation.sources,
            []
        );

    }
);


/* ============================================================
 * VALEURS PAR DÉFAUT
 * ============================================================ */


test(
    "create : utilise des listes vides et des modificateurs manuels nuls par défaut",
    () => {

        const actor = createActor();

        const context = {
            actionType: ACTION_RESOLUTION_TYPES.ATTRIBUTE_ROLL,
            attribute: "vigor",
            skill: "closeCombat"
        };

        const preparation =
            ActionPreparationService.create(
                actor,
                context
            );


        assert.deepEqual(
            preparation.sources,
            []
        );

        assert.deepEqual(
            preparation.specialEffects,
            []
        );

        const manualBonusModifier =
            preparation.modifiers.find(
                modifier =>
                    modifier.id === "manual-bonus"
            );

        const manualPenaltyModifier =
            preparation.modifiers.find(
                modifier =>
                    modifier.id === "manual-penalty"
            );


        assert.equal(
            manualBonusModifier.value,
            0
        );

        /*
         * ActionModifierService stocke la pénalité manuelle
         * sous la forme -Math.abs(manualPenalty). Avec une
         * pénalité par défaut de 0, la valeur obtenue est
         * donc -0 (égale à 0 numériquement, mais distincte
         * pour Object.is, utilisé par assert.strict).
         */
        assert.equal(
            Object.is(
                manualPenaltyModifier.value,
                -0
            )
            || Object.is(
                manualPenaltyModifier.value,
                0
            ),
            true
        );

    }
);


test(
    "create : transmet manualBonus et manualPenalty à la préparation",
    () => {

        const actor = createActor();

        const context = {
            actionType: ACTION_RESOLUTION_TYPES.ATTRIBUTE_ROLL,
            attribute: "vigor",
            skill: "closeCombat"
        };

        const preparation =
            ActionPreparationService.create(
                actor,
                context,
                {
                    manualBonus: 2,
                    manualPenalty: 1
                }
            );

        const manualBonusModifier =
            preparation.modifiers.find(
                modifier =>
                    modifier.id === "manual-bonus"
            );

        const manualPenaltyModifier =
            preparation.modifiers.find(
                modifier =>
                    modifier.id === "manual-penalty"
            );


        assert.equal(
            manualBonusModifier.value,
            2
        );

        assert.equal(
            manualPenaltyModifier.value,
            -1
        );

    }
);


test(
    "create : transmet les circonstances, effets et modificateurs d'équipement fournis",
    () => {

        const actor = createActor();

        const context = {
            actionType: ACTION_RESOLUTION_TYPES.ATTRIBUTE_ROLL,
            attribute: "vigor",
            skill: "closeCombat"
        };

        const preparation =
            ActionPreparationService.create(
                actor,
                context,
                {
                    circumstances: [
                        {
                            id: "night",
                            label: "Nuit",
                            value: -1
                        }
                    ],
                    effects: [
                        {
                            id: "wounded",
                            label: "Blessé",
                            value: -1
                        }
                    ],
                    equipmentModifiers: [
                        {
                            id: "lamp",
                            label: "Lampe",
                            value: 1
                        }
                    ]
                }
            );

        const circumstanceModifier =
            preparation.modifiers.find(
                modifier =>
                    modifier.source
                        === ACTION_MODIFIER_SOURCES.CIRCUMSTANCE
            );

        const effectModifier =
            preparation.modifiers.find(
                modifier =>
                    modifier.source
                        === ACTION_MODIFIER_SOURCES.EFFECT
            );

        const equipmentModifier =
            preparation.modifiers.find(
                modifier =>
                    modifier.source
                        === ACTION_MODIFIER_SOURCES.EQUIPMENT
            );


        assert.equal(
            circumstanceModifier.value,
            -1
        );

        assert.equal(
            effectModifier.value,
            -1
        );

        assert.equal(
            equipmentModifier.value,
            1
        );

    }
);


/* ============================================================
 * FORME DE LA PRÉPARATION RETOURNÉE
 * ============================================================ */


test(
    "create : retourne une préparation dont le context est celui fourni",
    () => {

        const actor = createActor();

        const context = {
            actionType: ACTION_RESOLUTION_TYPES.ATTRIBUTE_ROLL,
            attribute: "vigor",
            skill: "closeCombat"
        };

        const preparation =
            ActionPreparationService.create(
                actor,
                context
            );


        assert.equal(
            preparation.context,
            context
        );

    }
);


test(
    "create : calcule un dicePool cohérent avec la base et les sources",
    () => {

        const weapon =
            createWeaponItem({
                usableEquipmentBonus: 2
            });

        const actor = createActor({
            attributes: {
                vigor: {
                    value: 4
                }
            },
            skills: {
                closeCombat: 2
            },
            items: [
                weapon
            ]
        });

        const context = {
            actionType: ACTION_RESOLUTION_TYPES.SKILL_ROLL,
            attribute: "vigor",
            skill: "closeCombat"
        };

        const preparation =
            ActionPreparationService.create(
                actor,
                context
            );


        /*
         * attribute (4) + skill (2) + stress (0)
         * + weapon (2, source non verrouillée hors attaque
         *   donc non sélectionnée par défaut) + difficulté (0)
         *
         * L'arme n'étant pas verrouillée en dehors d'une
         * attaque, elle n'est pas automatiquement sélectionnée :
         * son bonus ne contribue donc pas au dicePool tant
         * qu'elle n'est pas explicitement choisie.
         */
        assert.equal(
            preparation.totals.attribute,
            4
        );

        assert.equal(
            preparation.totals.skill,
            2
        );

        assert.equal(
            preparation.totals.dicePool,
            6
        );

    }
);


/* ============================================================
 * ATTRIBUT ALTERNATIF (Esquive, Sens du danger, Menaçant)
 * ============================================================ */


test(
    "create : attributeSwap est null sans Talent pertinent",
    () => {

        const actor = createActor({
            attributes: {
                vigor: { value: 3 },
                agility: { value: 5 }
            }
        });

        const context = {
            actionType: ACTION_RESOLUTION_TYPES.MELEE_BLOCK,
            attribute: "vigor",
            skill: "closeCombat"
        };

        const preparation =
            ActionPreparationService.create(
                actor,
                context,
                {
                    talents: []
                }
            );

        assert.equal(
            preparation.attributeSwap,
            null
        );

    }
);


test(
    "create : Esquive propose l'Agilité pour un blocage en mêlée",
    () => {

        const actor = createActor({
            attributes: {
                vigor: { value: 3 },
                agility: { value: 5 }
            }
        });

        const context = {
            actionType: ACTION_RESOLUTION_TYPES.MELEE_BLOCK,
            attribute: "vigor",
            skill: "closeCombat"
        };

        const preparation =
            ActionPreparationService.create(
                actor,
                context,
                {
                    talents: [
                        {
                            key: "dodge",
                            level: 1
                        }
                    ]
                }
            );

        assert.deepEqual(
            preparation.attributeSwap,
            {
                talentKey: "dodge",
                talentLabel: "Esquive",
                attribute: "agility",
                value: 5,
                conditionState: "none",
                selected: false,
                editable: true
            }
        );

    }
);


test(
    "create : Sens du danger propose l'Empathie pour un jet d'Observation",
    () => {

        const actor = createActor({
            attributes: {
                spirit: { value: 2 },
                empathy: { value: 4 }
            }
        });

        const context = {
            actionType: ACTION_RESOLUTION_TYPES.SKILL_ROLL,
            attribute: "spirit",
            skill: "observation"
        };

        const preparation =
            ActionPreparationService.create(
                actor,
                context,
                {
                    talents: [
                        {
                            key: "dangerSense",
                            level: 1
                        }
                    ]
                }
            );

        assert.equal(
            preparation.attributeSwap.attribute,
            "empathy"
        );

        assert.equal(
            preparation.attributeSwap.value,
            4
        );

        assert.equal(
            preparation.attributeSwap.selected,
            false
        );

    }
);


test(
    "create : Menaçant propose la Vigueur pour un jet de Manipulation, même sans circonstance connue",
    () => {

        const actor = createActor({
            attributes: {
                empathy: { value: 2 },
                vigor: { value: 5 }
            }
        });

        const context = {
            actionType: ACTION_RESOLUTION_TYPES.SKILL_ROLL,
            attribute: "empathy",
            skill: "manipulation"
        };

        const preparation =
            ActionPreparationService.create(
                actor,
                context,
                {
                    talents: [
                        {
                            key: "intimidating",
                            level: 1
                        }
                    ]
                }
            );

        assert.equal(
            preparation.attributeSwap.attribute,
            "vigor"
        );

        assert.equal(
            preparation.attributeSwap.value,
            5
        );

        assert.equal(
            preparation.attributeSwap.conditionState,
            "unknown"
        );

        assert.equal(
            preparation.attributeSwap.selected,
            false
        );

    }
);


test(
    "create : attributeSwap reste null si le Talent n'est pas pertinent pour ce contexte",
    () => {

        const actor = createActor({
            attributes: {
                vigor: { value: 3 },
                agility: { value: 5 }
            }
        });

        const context = {
            actionType: ACTION_RESOLUTION_TYPES.SKILL_ROLL,
            attribute: "vigor",
            skill: "survival"
        };

        const preparation =
            ActionPreparationService.create(
                actor,
                context,
                {
                    talents: [
                        {
                            key: "dodge",
                            level: 1
                        }
                    ]
                }
            );

        assert.equal(
            preparation.attributeSwap,
            null
        );

    }
);
