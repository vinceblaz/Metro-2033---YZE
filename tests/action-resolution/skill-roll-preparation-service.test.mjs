import { test } from "node:test";
import assert from "node:assert/strict";

import {
    SkillRollPreparationService
} from "../../src/action-resolution/skill-roll-preparation-service.mjs";

import {
    ACTION_RESOLUTION_TYPES
} from "../../src/domain/rules/action-resolution-context.mjs";


/**
 * Ce fichier verrouille le comportement actuel de
 * skill-roll-preparation-service.mjs (aucun test n'existait
 * avant ce chantier).
 *
 * SkillRollPreparationService délègue :
 *
 * - la construction du contexte à createActionResolutionContext ;
 * - la récupération des talents à un filtrage local des Items ;
 * - la préparation finale à ActionPreparationService.
 *
 * Ces couches possèdent déjà leurs propres tests dédiés.
 * Ici, on verrouille uniquement le contrat public de
 * SkillRollPreparationService.create : validations, câblage
 * du contexte, extraction des talents, valeurs par défaut et
 * calcul du pool de dés.
 */


/* ============================================================
 * STUBS
 * ============================================================ */


function createTalentItem(
    {
        id = "talent-1",
        name = "Débrouillard",
        key = "resourceful",
        level = 1,
        configuration = {
            foo: "bar"
        }
    } = {}
) {

    return {

        id,

        name,

        type:
            "talent",

        system: {

            key,

            level,

            configuration

        }

    };

}


function createActor(
    {
        type = "character",
        attributes = {
            agility: {
                value: 3
            }
        },
        skills = {
            shooting: 2
        },
        stress = {
            dice: 0
        },
        items = []
    } = {}
) {

    return {

        id:
            "actor-1",

        type,

        items,

        system: {

            attributes,

            skills,

            stress

        },

        getSkillAttribute(
            skillId
        ) {

            return (
                skillId === "shooting"
                    ? "agility"
                    : null
            );

        }

    };

}


/* ============================================================
 * VALIDATIONS
 * ============================================================ */


test(
    "create : lève une erreur si l'actor est absent",
    () => {

        assert.throws(
            () =>
                SkillRollPreparationService.create(
                    null,
                    {
                        attribute:
                            "agility",

                        skill:
                            "shooting"
                    }
                ),
            TypeError
        );

    }
);


test(
    "create : lève une erreur si l'attribut est absent",
    () => {

        const actor =
            createActor();


        assert.throws(
            () =>
                SkillRollPreparationService.create(
                    actor,
                    {
                        skill:
                            "shooting"
                    }
                ),
            TypeError
        );

    }
);


test(
    "create : lève une erreur si l'attribut est une chaîne vide",
    () => {

        const actor =
            createActor();


        assert.throws(
            () =>
                SkillRollPreparationService.create(
                    actor,
                    {
                        attribute:
                            "   ",

                        skill:
                            "shooting"
                    }
                ),
            TypeError
        );

    }
);


test(
    "create : lève une erreur si la Compétence est absente",
    () => {

        const actor =
            createActor();


        assert.throws(
            () =>
                SkillRollPreparationService.create(
                    actor,
                    {
                        attribute:
                            "agility"
                    }
                ),
            TypeError
        );

    }
);


test(
    "create : lève une erreur si la Compétence est une chaîne vide",
    () => {

        const actor =
            createActor();


        assert.throws(
            () =>
                SkillRollPreparationService.create(
                    actor,
                    {
                        attribute:
                            "agility",

                        skill:
                            "   "
                    }
                ),
            TypeError
        );

    }
);


test(
    "create : lève une erreur si la Compétence n'est pas une chaîne",
    () => {

        const actor =
            createActor();


        assert.throws(
            () =>
                SkillRollPreparationService.create(
                    actor,
                    {
                        attribute:
                            "agility",

                        skill:
                            42
                    }
                ),
            TypeError
        );

    }
);


/* ============================================================
 * CAS NOMINAL
 * ============================================================ */


test(
    "create : construit une préparation pour une Compétence existante",
    () => {

        const actor =
            createActor();


        const {
            actor:
                returnedActor,
            talents,
            context,
            preparation
        } =
            SkillRollPreparationService.create(
                actor,
                {
                    attribute:
                        "agility",

                    skill:
                        "shooting"
                }
            );


        assert.equal(
            returnedActor,
            actor
        );

        assert.deepEqual(
            talents,
            []
        );

        assert.equal(
            context.actionType,
            ACTION_RESOLUTION_TYPES
                .SKILL_ROLL
        );

        assert.equal(
            context.attribute,
            "agility"
        );

        assert.equal(
            context.skill,
            "shooting"
        );

        assert.equal(
            context.actorId,
            "actor-1"
        );

        assert.deepEqual(
            preparation.base,
            {
                attribute: 3,
                skill: 2,
                stress: 0
            }
        );

    }
);


test(
    "create : transmet les métadonnées au contexte",
    () => {

        const actor =
            createActor();


        const {
            context
        } =
            SkillRollPreparationService.create(
                actor,
                {
                    attribute:
                        "agility",

                    skill:
                        "shooting",

                    metadata: {
                        source:
                            "dialog"
                    }
                }
            );


        assert.deepEqual(
            context.metadata,
            {
                source:
                    "dialog"
            }
        );

    }
);


/* ============================================================
 * TALENTS
 * ============================================================ */


test(
    "create : extrait les talents possédés par l'Actor",
    () => {

        const talentItem =
            createTalentItem();

        const otherItem = {

            id:
                "weapon-1",

            type:
                "weapon",

            system: {}

        };

        const actor =
            createActor({
                items: [
                    talentItem,
                    otherItem
                ]
            });


        const {
            talents
        } =
            SkillRollPreparationService.create(
                actor,
                {
                    attribute:
                        "agility",

                    skill:
                        "shooting"
                }
            );


        assert.equal(
            talents.length,
            1
        );

        assert.deepEqual(
            talents[0],
            {

                id:
                    "talent-1",

                name:
                    "Débrouillard",

                key:
                    "resourceful",

                level:
                    1,

                configuration: {
                    foo:
                        "bar"
                }

            }
        );

    }
);


test(
    "create : applique des valeurs par défaut pour un talent incomplet",
    () => {

        const incompleteTalent = {

            id:
                "talent-2",

            name:
                "Talent minimal",

            type:
                "talent"

            /*
             * Pas de bloc `system`.
             */

        };

        const actor =
            createActor({
                items: [
                    incompleteTalent
                ]
            });


        const {
            talents
        } =
            SkillRollPreparationService.create(
                actor,
                {
                    attribute:
                        "agility",

                    skill:
                        "shooting"
                }
            );


        assert.deepEqual(
            talents[0],
            {

                id:
                    "talent-2",

                name:
                    "Talent minimal",

                key:
                    "",

                level:
                    1,

                configuration: {}

            }
        );

    }
);


test(
    "create : ignore les Items qui ne sont pas des talents",
    () => {

        const actor =
            createActor({
                items: [
                    {
                        id:
                            "equipment-1",

                        type:
                            "equipment",

                        system: {}
                    }
                ]
            });


        const {
            talents
        } =
            SkillRollPreparationService.create(
                actor,
                {
                    attribute:
                        "agility",

                    skill:
                        "shooting"
                }
            );


        assert.deepEqual(
            talents,
            []
        );

    }
);


/* ============================================================
 * MODIFICATEURS MANUELS
 * ============================================================ */


test(
    "create : transmet le bonus et la pénalité manuels à la préparation",
    () => {

        const actor =
            createActor();


        const {
            preparation
        } =
            SkillRollPreparationService.create(
                actor,
                {
                    attribute:
                        "agility",

                    skill:
                        "shooting",

                    manualBonus:
                        2,

                    manualPenalty:
                        1
                }
            );


        const manualBonusModifier =
            preparation.modifiers
                .find(
                    modifier =>
                        modifier.id
                        === "manual-bonus"
                );

        const manualPenaltyModifier =
            preparation.modifiers
                .find(
                    modifier =>
                        modifier.id
                        === "manual-penalty"
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


/* ============================================================
 * SOURCES COMPATIBLES
 * ============================================================ */


test(
    "create : collecte une arme équipée compatible avec la Compétence testée",
    () => {

        const weapon = {

            id:
                "weapon-1",

            name:
                "Fusil d'assaut",

            type:
                "weapon",

            system: {

                equipped:
                    true,

                usableEquipmentBonus:
                    1,

                skillId:
                    "shooting"

            }

        };

        const actor =
            createActor({
                items: [
                    weapon
                ]
            });


        const {
            preparation
        } =
            SkillRollPreparationService.create(
                actor,
                {
                    attribute:
                        "agility",

                    skill:
                        "shooting"
                }
            );


        assert.equal(
            preparation.sources.length,
            1
        );

        assert.equal(
            preparation.sources[0].bonus,
            1
        );

    }
);


/* ============================================================
 * CALCUL DU POOL DE DÉS
 * ============================================================ */


test(
    "create : calcule le pool de dés final à partir de l'Attribut, de la Compétence, du Stress et des modificateurs manuels",
    () => {

        const actor =
            createActor({
                attributes: {
                    agility: {
                        value: 3
                    }
                },
                skills: {
                    shooting: 2
                },
                stress: {
                    dice: 1
                }
            });


        const {
            preparation
        } =
            SkillRollPreparationService.create(
                actor,
                {
                    attribute:
                        "agility",

                    skill:
                        "shooting",

                    manualBonus:
                        1,

                    manualPenalty:
                        2
                }
            );


        /*
         * dicePool = attribut + skill + stress + sources(0)
         *          + difficulté par défaut(0) + bonus manuel
         *          - pénalité manuelle
         *
         *          = 3 + 2 + 1 + 0 + 0 + 1 - 2 = 5
         */
        assert.equal(
            preparation.totals.dicePool,
            5
        );

    }
);


test(
    "create : le pool de dés ne descend jamais sous zéro",
    () => {

        const actor =
            createActor({
                attributes: {
                    agility: {
                        value: 1
                    }
                },
                skills: {
                    shooting: 0
                },
                stress: {
                    dice: 0
                }
            });


        const {
            preparation
        } =
            SkillRollPreparationService.create(
                actor,
                {
                    attribute:
                        "agility",

                    skill:
                        "shooting",

                    manualPenalty:
                        10
                }
            );


        assert.equal(
            preparation.totals.dicePool,
            0
        );

    }
);


test(
    "create : la valeur d'une Compétence inconnue vaut zéro",
    () => {

        const actor =
            createActor();


        const {
            preparation
        } =
            SkillRollPreparationService.create(
                actor,
                {
                    attribute:
                        "agility",

                    skill:
                        "unknownSkill"
                }
            );


        assert.equal(
            preparation.base.skill,
            0
        );

    }
);
