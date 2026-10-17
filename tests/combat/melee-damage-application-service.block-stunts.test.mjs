import { test } from "node:test";
import assert from "node:assert/strict";

import {
    MeleeDamageApplicationService
} from "../../src/combat/melee-damage-application-service.mjs";

import {
    MeleeAttackWorkflow,
    MELEE_DEFENSE_DECISIONS
} from "../../src/combat/melee-attack-workflow.mjs";


/**
 * Ce fichier ne couvre PAS l'intégralité de
 * MeleeDamageApplicationService (aucun test n'existait
 * avant ce chantier). Il se concentre uniquement sur
 * les deux nouvelles étapes issues des éclats de
 * blocage : la contre-attaque et le désarmement
 * (p.197, « BLOQUER »).
 *
 * Ces deux effets sont choisis À L'AVEUGLE par le
 * défenseur juste après son jet de blocage, mais ne
 * sont appliqués qu'ici, à la toute fin du workflow.
 */


function createActorStub({
    id,
    name,
    damageResult = null
}) {

    const calls = [];


    return {

        id,

        name,

        calls,

        async takeAttributeDamage(
            attribute,
            amount
        ) {

            calls.push({
                attribute,
                amount
            });


            return (
                damageResult
                ?? {

                    attribute,

                    previous:
                        5,

                    current:
                        5 - amount,

                    damage:
                        amount,

                    overflow:
                        0,

                    broken:
                        false

                }
            );

        }

    };

}


function createCombatStub() {

    const storage = {};

    return {

        id:
            "combat-1",

        getFlag(
            scope,
            key
        ) {

            return (
                scope === "metro-2033-yze"
                    ? storage[key]
                    : undefined
            );

        },

        async setFlag(
            scope,
            key,
            value
        ) {

            storage[key] =
                structuredClone(
                    value
                );

        }

    };

}


async function withStubs(
    {
        attacker,
        defender
    },
    callback
) {

    globalThis.foundry = {

        utils: {

            deepClone(
                value
            ) {

                return structuredClone(
                    value
                );

            },

            randomID() {

                return `id-${Math.random()}`;

            }

        }

    };


    globalThis.game = {

        combat:
            null,

        actors: {

            get(
                id
            ) {

                return (
                    [
                        attacker,
                        defender
                    ].find(
                        actor =>
                            actor.id === id
                    )
                    ?? null
                );

            }

        }

    };


    try {

        return await callback();

    }
    finally {

        delete globalThis.foundry;
        delete globalThis.game;

    }

}


/**
 * Construit un workflow persisté, déjà rendu jusqu'à
 * CONSEQUENCES_RESOLVED, avec un résultat d'éclats de
 * blocage donné.
 */
function seedWorkflow(
    combat,
    {
        attackerId,
        defenderId,
        blockStuntEffects,
        weaponDamage
    }
) {

    const workflow =
        new MeleeAttackWorkflow({

            id:
                "workflow-1",

            attackerId,

            defenderId,

            weaponId:
                "weapon-1",

            canBlock:
                true

        });


    workflow.chooseDefense(
        MELEE_DEFENSE_DECISIONS.BLOCK
    );


    workflow.resolveBlock({
        rolled: true,
        roll: {
            successes: 2
        }
    });


    workflow.resolveBlockStunts({

        available:
            2,

        spent:
            2,

        remaining:
            0,

        effects:
            blockStuntEffects,

        weaponDamage

    });


    workflow.resolveAttack({
        successes: 3
    });


    workflow.finalizeAttack();


    workflow.resolveConsequences({});


    combat.setFlag(
        "metro-2033-yze",
        "meleeAttackWorkflows",
        {
            [workflow.id]:
                workflow.toObject()
        }
    );


    return workflow;

}


test(
    "applyBlockCounterAttack : applique les dégâts de l'arme du défenseur à la Vigueur de l'ATTAQUANT",
    async () => {

        const attacker =
            createActorStub({
                id: "actor-attacker",
                name: "L'attaquant"
            });


        const defender =
            createActorStub({
                id: "actor-defender",
                name: "Le défenseur"
            });


        await withStubs(
            {
                attacker,
                defender
            },
            async () => {

                const combat =
                    createCombatStub();


                seedWorkflow(
                    combat,
                    {
                        attackerId:
                            attacker.id,

                        defenderId:
                            defender.id,

                        blockStuntEffects: {

                            cancelledSuccesses:
                                1,

                            counterAttack:
                                true,

                            disarm:
                                false

                        },

                        weaponDamage:
                            2
                    }
                );


                const result =
                    await MeleeDamageApplicationService
                        .applyBlockCounterAttack(
                            combat,
                            "workflow-1"
                        );


                assert.equal(
                    attacker.calls.length,
                    1
                );

                assert.equal(
                    attacker.calls[0].attribute,
                    "vigor"
                );

                assert.equal(
                    attacker.calls[0].amount,
                    2
                );

                assert.equal(
                    defender.calls.length,
                    0
                );

                assert.equal(
                    result.result.applied,
                    true
                );

                assert.equal(
                    result.result.targetId,
                    attacker.id
                );

            }
        );

    }
);


test(
    "applyBlockCounterAttack : n'applique rien lorsque la contre-attaque n'a pas été choisie",
    async () => {

        const attacker =
            createActorStub({
                id: "actor-attacker",
                name: "L'attaquant"
            });


        const defender =
            createActorStub({
                id: "actor-defender",
                name: "Le défenseur"
            });


        await withStubs(
            {
                attacker,
                defender
            },
            async () => {

                const combat =
                    createCombatStub();


                seedWorkflow(
                    combat,
                    {
                        attackerId:
                            attacker.id,

                        defenderId:
                            defender.id,

                        blockStuntEffects: {

                            cancelledSuccesses:
                                2,

                            counterAttack:
                                false,

                            disarm:
                                false

                        },

                        weaponDamage:
                            2
                    }
                );


                const result =
                    await MeleeDamageApplicationService
                        .applyBlockCounterAttack(
                            combat,
                            "workflow-1"
                        );


                assert.equal(
                    attacker.calls.length,
                    0
                );

                assert.equal(
                    result.result.applied,
                    false
                );

                assert.equal(
                    result.result.reason,
                    "not-selected"
                );

            }
        );

    }
);


test(
    "applyBlockCounterAttack : ne rejoue jamais l'étape une seconde fois",
    async () => {

        const attacker =
            createActorStub({
                id: "actor-attacker",
                name: "L'attaquant"
            });


        const defender =
            createActorStub({
                id: "actor-defender",
                name: "Le défenseur"
            });


        await withStubs(
            {
                attacker,
                defender
            },
            async () => {

                const combat =
                    createCombatStub();


                seedWorkflow(
                    combat,
                    {
                        attackerId:
                            attacker.id,

                        defenderId:
                            defender.id,

                        blockStuntEffects: {

                            cancelledSuccesses:
                                1,

                            counterAttack:
                                true,

                            disarm:
                                false

                        },

                        weaponDamage:
                            2
                    }
                );


                await MeleeDamageApplicationService
                    .applyBlockCounterAttack(
                        combat,
                        "workflow-1"
                    );


                const second =
                    await MeleeDamageApplicationService
                        .applyBlockCounterAttack(
                            combat,
                            "workflow-1"
                        );


                assert.equal(
                    attacker.calls.length,
                    1
                );

                assert.equal(
                    second.alreadyResolved,
                    true
                );

            }
        );

    }
);


test(
    "applyBlockDisarm : enregistre un effet narratif sur l'ATTAQUANT sans muter aucun Actor",
    async () => {

        const attacker =
            createActorStub({
                id: "actor-attacker",
                name: "L'attaquant"
            });


        const defender =
            createActorStub({
                id: "actor-defender",
                name: "Le défenseur"
            });


        await withStubs(
            {
                attacker,
                defender
            },
            async () => {

                const combat =
                    createCombatStub();


                seedWorkflow(
                    combat,
                    {
                        attackerId:
                            attacker.id,

                        defenderId:
                            defender.id,

                        blockStuntEffects: {

                            cancelledSuccesses:
                                0,

                            counterAttack:
                                false,

                            disarm:
                                true

                        },

                        weaponDamage:
                            0
                    }
                );


                const result =
                    await MeleeDamageApplicationService
                        .applyBlockDisarm(
                            combat,
                            "workflow-1"
                        );


                assert.equal(
                    attacker.calls.length,
                    0
                );

                assert.equal(
                    defender.calls.length,
                    0
                );

                assert.equal(
                    result.result.applied,
                    true
                );

                assert.equal(
                    result.result.narrative,
                    true
                );

                assert.equal(
                    result.result.targetId,
                    attacker.id
                );

            }
        );

    }
);


test(
    "applyBlockDisarm : n'applique rien lorsque le désarmement n'a pas été choisi",
    async () => {

        const attacker =
            createActorStub({
                id: "actor-attacker",
                name: "L'attaquant"
            });


        const defender =
            createActorStub({
                id: "actor-defender",
                name: "Le défenseur"
            });


        await withStubs(
            {
                attacker,
                defender
            },
            async () => {

                const combat =
                    createCombatStub();


                seedWorkflow(
                    combat,
                    {
                        attackerId:
                            attacker.id,

                        defenderId:
                            defender.id,

                        blockStuntEffects: {

                            cancelledSuccesses:
                                2,

                            counterAttack:
                                false,

                            disarm:
                                false

                        },

                        weaponDamage:
                            0
                    }
                );


                const result =
                    await MeleeDamageApplicationService
                        .applyBlockDisarm(
                            combat,
                            "workflow-1"
                        );


                assert.equal(
                    result.result.applied,
                    false
                );

                assert.equal(
                    result.result.reason,
                    "not-selected"
                );

            }
        );

    }
);
