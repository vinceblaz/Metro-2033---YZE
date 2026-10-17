import { test } from "node:test";
import assert from "node:assert/strict";

import {
    AttributeRollPreparationService
} from "../../src/action-resolution/attribute-roll-preparation-service.mjs";

import {
    ACTION_RESOLUTION_TYPES
} from "../../src/domain/rules/action-resolution-context.mjs";


/**
 * Ce fichier verrouille le comportement actuel de
 * attribute-roll-preparation-service.mjs (aucun test n'existait
 * avant ce chantier).
 *
 * AttributeRollPreparationService délègue :
 *
 * - la construction du contexte à createActionResolutionContext ;
 * - la récupération des talents à un filtrage local des Items ;
 * - la préparation finale à ActionPreparationService.
 *
 * Ces couches possèdent déjà leurs propres tests dédiés.
 * Ici, on verrouille uniquement le contrat public de
 * AttributeRollPreparationService.create : validations,
 * câblage du contexte, extraction des talents, valeurs
 * par défaut et calcul du pool de dés.
 */


/* ============================================================
 * STUBS
 * ============================================================ */


function createTalentItem(
    {
        id = "talent-1",
        name = "Increvable",
        key = "tough",
        level = 2,
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
            vigor: {
                value: 3
            }
        },
        skills = {
            closeCombat: 1
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
                AttributeRollPreparationService.create(
                    null,
                    {
                        attribute:
                            "vigor"
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
                AttributeRollPreparationService.create(
                    actor,
                    {}
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
                AttributeRollPreparationService.create(
                    actor,
                    {
                        attribute:
                            "   "
                    }
                ),
            TypeError
        );

    }
);


test(
    "create : lève une erreur si l'attribut n'est pas une chaîne",
    () => {

        const actor =
            createActor();


        assert.throws(
            () =>
                AttributeRollPreparationService.create(
                    actor,
                    {
                        attribute:
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
    "create : construit une préparation pour un Attribut existant",
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
            AttributeRollPreparationService.create(
                actor,
                {
                    attribute:
                        "vigor"
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
                .ATTRIBUTE_ROLL
        );

        assert.equal(
            context.attribute,
            "vigor"
        );

        assert.equal(
            context.skill,
            null
        );

        assert.equal(
            context.actorId,
            "actor-1"
        );

        assert.deepEqual(
            preparation.base,
            {
                attribute: 3,
                skill: 0,
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
            AttributeRollPreparationService.create(
                actor,
                {
                    attribute:
                        "vigor",

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
            AttributeRollPreparationService.create(
                actor,
                {
                    attribute:
                        "vigor"
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
                    "Increvable",

                key:
                    "tough",

                level:
                    2,

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
            AttributeRollPreparationService.create(
                actor,
                {
                    attribute:
                        "vigor"
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
            AttributeRollPreparationService.create(
                actor,
                {
                    attribute:
                        "vigor"
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
            AttributeRollPreparationService.create(
                actor,
                {
                    attribute:
                        "vigor",

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
 * CALCUL DU POOL DE DÉS
 * ============================================================ */


test(
    "create : calcule le pool de dés final à partir de l'Attribut, du Stress et des modificateurs manuels",
    () => {

        const actor =
            createActor({
                attributes: {
                    vigor: {
                        value: 4
                    }
                },
                stress: {
                    dice: 1
                }
            });


        const {
            preparation
        } =
            AttributeRollPreparationService.create(
                actor,
                {
                    attribute:
                        "vigor",

                    manualBonus:
                        1,

                    manualPenalty:
                        2
                }
            );


        /*
         * dicePool = attribut + skill(0) + stress + sources(0)
         *          + difficulté par défaut(0) + bonus manuel
         *          - pénalité manuelle
         *
         *          = 4 + 0 + 1 + 0 + 0 + 1 - 2 = 4
         */
        assert.equal(
            preparation.totals.dicePool,
            4
        );

    }
);


test(
    "create : le pool de dés ne descend jamais sous zéro",
    () => {

        const actor =
            createActor({
                attributes: {
                    vigor: {
                        value: 1
                    }
                },
                stress: {
                    dice: 0
                }
            });


        const {
            preparation
        } =
            AttributeRollPreparationService.create(
                actor,
                {
                    attribute:
                        "vigor",

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
    "create : la valeur d'un Attribut inconnu vaut zéro",
    () => {

        const actor =
            createActor();


        const {
            preparation
        } =
            AttributeRollPreparationService.create(
                actor,
                {
                    attribute:
                        "unknownAttribute"
                }
            );


        assert.equal(
            preparation.base.attribute,
            0
        );

    }
);
