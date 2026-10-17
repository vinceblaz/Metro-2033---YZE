import { test } from "node:test";
import assert from "node:assert/strict";

import {
    MeleeAttackPreparationService
} from "../../src/combat/melee-attack-preparation-service.mjs";

import {
    MeleeAttackWorkflow
} from "../../src/combat/melee-attack-workflow.mjs";


function createActorStub(
    id,
    {
        prone = false,
        items = []
    } = {}
) {

    const itemMap =
        new Map(
            items.map(
                item => [item.id, item]
            )
        );

    return {

        id,

        system: {

            conditions: {
                prone
            }

        },

        items:
            itemMap

    };

}


function createWeaponStub(
    id = "weapon-1"
) {

    return {

        id,

        name:
            "Couteau",

        system: {

            category:
                "melee"

        }

    };

}


function createCombatStub(
    workflow
) {

    const stored = {

        [workflow.id]:
            workflow.toObject()

    };

    return {

        id:
            "combat-1",

        getFlag(
            scope
        ) {

            return (
                scope === "metro-2033-yze"
                    ? stored
                    : undefined
            );

        }

    };

}


function withGameActors(
    actors,
    callback
) {

    globalThis.game = {

        actors: {

            get(
                id
            ) {

                return (
                    actors[id]
                    ?? null
                );

            }

        }

    };


    try {

        return callback();

    }
    finally {

        delete globalThis.game;

    }

}


function createAwaitingAttackWorkflow(
    {
        weaponId = "weapon-1"
    } = {}
) {

    return new MeleeAttackWorkflow({

        id:
            "workflow-1",

        attackerId:
            "actor-attacker",

        defenderId:
            "actor-defender",

        weaponId,

        canBlock:
            false

    });

}


test(
    "MeleeAttackPreparationService.create : construit une préparation pour une cible qui n'est pas à terre",
    () => {

        const weapon =
            createWeaponStub();

        const attacker =
            createActorStub(
                "actor-attacker",
                {
                    items: [weapon]
                }
            );

        const defender =
            createActorStub(
                "actor-defender",
                {
                    prone: false
                }
            );

        const workflow =
            createAwaitingAttackWorkflow();

        const combat =
            createCombatStub(
                workflow
            );


        withGameActors(
            {
                "actor-attacker":
                    attacker,

                "actor-defender":
                    defender
            },
            () => {

                const {
                    preparation
                } =
                    MeleeAttackPreparationService.create(
                        combat,
                        workflow
                    );


                const manualBonusModifier =
                    preparation.modifiers
                        .find(
                            modifier =>
                                modifier.id
                                === "manual-bonus"
                        );


                assert.equal(
                    manualBonusModifier.value,
                    0
                );

            }
        );

    }
);


test(
    "MeleeAttackPreparationService.create : une cible à terre suggère +2 dans le bonus manuel",
    () => {

        const weapon =
            createWeaponStub();

        const attacker =
            createActorStub(
                "actor-attacker",
                {
                    items: [weapon]
                }
            );

        const defender =
            createActorStub(
                "actor-defender",
                {
                    prone: true
                }
            );

        const workflow =
            createAwaitingAttackWorkflow();

        const combat =
            createCombatStub(
                workflow
            );


        withGameActors(
            {
                "actor-attacker":
                    attacker,

                "actor-defender":
                    defender
            },
            () => {

                const {
                    preparation
                } =
                    MeleeAttackPreparationService.create(
                        combat,
                        workflow
                    );


                const manualBonusModifier =
                    preparation.modifiers
                        .find(
                            modifier =>
                                modifier.id
                                === "manual-bonus"
                        );


                assert.equal(
                    manualBonusModifier.value,
                    2
                );

                assert.equal(
                    manualBonusModifier.suggestedValue,
                    2
                );

                assert.equal(
                    manualBonusModifier.editable,
                    true
                );

            }
        );

    }
);


test(
    "MeleeAttackPreparationService.create : un bonus manuel explicite reste prioritaire même si la cible est à terre",
    () => {

        const weapon =
            createWeaponStub();

        const attacker =
            createActorStub(
                "actor-attacker",
                {
                    items: [weapon]
                }
            );

        const defender =
            createActorStub(
                "actor-defender",
                {
                    prone: true
                }
            );

        const workflow =
            createAwaitingAttackWorkflow();

        const combat =
            createCombatStub(
                workflow
            );


        withGameActors(
            {
                "actor-attacker":
                    attacker,

                "actor-defender":
                    defender
            },
            () => {

                const {
                    preparation
                } =
                    MeleeAttackPreparationService.create(
                        combat,
                        workflow,
                        {
                            manualBonus:
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


                assert.equal(
                    manualBonusModifier.value,
                    1
                );

            }
        );

    }
);
