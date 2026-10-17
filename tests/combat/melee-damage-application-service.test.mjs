import { test } from "node:test";
import assert from "node:assert/strict";

import {
    MeleeDamageApplicationService
} from "../../src/combat/melee-damage-application-service.mjs";

import {
    MeleeAttackWorkflow
} from "../../src/combat/melee-attack-workflow.mjs";


/**
 * Ce fichier verrouille le comportement actuel des
 * 8 méthodes de MeleeDamageApplicationService qui
 * n'étaient couvertes par aucun test :
 *
 * createPlan, applyVigorDamage, applyAgilityDamage,
 * applyProtectionDamage, applySwapInitiative,
 * applyDisarm, applyKnockdown, applyGrapple.
 *
 * (applyBlockCounterAttack et applyBlockDisarm sont
 * déjà couverts par
 * melee-damage-application-service.block-stunts.test.mjs,
 * qu'on ne modifie pas.)
 *
 * Les patterns de stub reprennent tels quels ceux de
 * ce fichier voisin (withStubs / createActorStub /
 * createCombatStub / seedWorkflow), étendus ici pour
 * couvrir les besoins des 8 méthodes restantes
 * (items d'Actor, Combatants, applyKnockdown,
 * resolveProtectionDamage, applyDisarm...).
 */


/* ============================================================
 * STUBS
 * ============================================================ */


function createItemsCollection(
    itemsList
) {

    return {

        get(
            id
        ) {

            return (
                itemsList.find(
                    item =>
                        item.id === id
                )
                ?? null
            );

        },

        filter(
            predicate
        ) {

            return itemsList.filter(
                predicate
            );

        }

    };

}


function createActorStub({
    id,
    name,
    itemsList = [],
    takeAttributeDamageResult = null,
    knockdownResult = null,
    resolveProtectionDamageResult = null
}) {

    const calls = {

        takeAttributeDamage:
            [],

        applyKnockdown:
            [],

        resolveProtectionDamage:
            [],

        applyDisarm:
            []

    };


    return {

        id,

        name,

        uuid:
            `Actor.${id}`,

        calls,

        items:
            createItemsCollection(
                itemsList
            ),

        async takeAttributeDamage(
            attribute,
            amount
        ) {

            calls.takeAttributeDamage.push({
                attribute,
                amount
            });


            return (
                takeAttributeDamageResult
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

        },

        async applyKnockdown(

        ) {

            calls.applyKnockdown.push(
                true
            );


            return (
                knockdownResult
                ?? {

                    applied:
                        true,

                    reason:
                        null,

                    targetId:
                        id,

                    targetName:
                        name,

                    previous:
                        false,

                    current:
                        true,

                    alreadyProne:
                        false,

                    requiresPositionResolution:
                        false

                }
            );

        },

        async resolveProtectionDamage(
            partialProtectionResult,
            target
        ) {

            calls.resolveProtectionDamage.push({
                target,
                allocatedDamage:
                    partialProtectionResult
                        .protectionDamage
            });


            const item =
                itemsList.find(
                    candidate =>
                        candidate.id
                        === (
                            target === "body"
                                ? partialProtectionResult
                                    .source
                                    ?.bodyArmor
                                    ?.itemId
                                : partialProtectionResult
                                    .source
                                    ?.helmet
                                    ?.itemId
                        )
                );


            const allocated =
                Number(
                    partialProtectionResult
                        .protectionDamage
                    ?? 0
                );


            const previous =
                Number(
                    item
                        ?.system
                        ?.protection
                        ?.current
                    ?? 0
                );


            return (
                resolveProtectionDamageResult
                ?? {

                    applied:
                        true,

                    itemId:
                        item?.id
                        ?? null,

                    itemName:
                        item?.name
                        ?? null,

                    previous,

                    current:
                        Math.max(
                            0,
                            previous - allocated
                        ),

                    lost:
                        allocated,

                    broken:
                        false,

                    resilienceLost:
                        false,

                    reason:
                        null

                }
            );

        },

        async applyDisarm(

        ) {

            calls.applyDisarm.push(
                true
            );


            return {
                applied:
                    true
            };

        }

    };

}


function createItemStub({
    id,
    name,
    protectionCurrent
}) {

    return {

        id,

        name,

        type:
            "armor",

        system: {

            protection: {

                current:
                    protectionCurrent

            }

        }

    };

}


function createCombatantStub({
    id,
    actorId,
    initiative = 0
}) {

    return {

        id,

        actorId,

        initiative,

        actor: {
            id:
                actorId
        }

    };

}


function createCombatStub({
    combatants = []
} = {}) {

    const storage = {};

    return {

        id:
            "combat-1",

        round:
            1,

        combatants: {

            find(
                predicate
            ) {

                return (
                    combatants.find(
                        predicate
                    )
                    ?? null
                );

            }

        },

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
                            actor?.id === id
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
 * Construit un workflow persisté, rendu jusqu'à
 * CONSEQUENCES_RESOLVED (ou PROTECTION_RESOLVED
 * lorsque protectionResult est fourni), sans passer
 * par le blocage : la décision de défense est
 * "decline" (canBlock:false), ce qui suffit pour
 * atteindre les états requis par
 * MeleeDamageApplicationService.
 */
function seedWorkflow(
    combat,
    {
        attackerId,
        defenderId,
        consequenceResult,
        protectionResult = null
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
                false

        });


    workflow.resolveAttack({
        successes: 3
    });


    workflow.finalizeAttack();


    workflow.resolveConsequences(
        consequenceResult
    );


    if (protectionResult) {

        workflow.resolveProtection(
            protectionResult
        );

    }


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


/**
 * Construit un workflow persisté encore AVANT toute
 * résolution de conséquences (état ATTACK_PREPARATION).
 *
 * Sert uniquement à vérifier que
 * canApplyConsequences === false est bien respecté
 * par chaque méthode du service.
 */
function seedBareWorkflow(
    combat,
    {
        attackerId,
        defenderId
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
                false

        });


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


function defaultConsequenceResult(
    overrides = {}
) {

    return {

        hit:
            true,

        damage: {

            vigor: {

                beforeProtection:
                    0

            },

            agility: {

                total:
                    0

            }

        },

        protection: {

            required:
                false

        },

        effects: {

            swapInitiative:
                false,

            disarm:
                false,

            knockdown:
                false,

            grapple:
                false

        },

        ...overrides

    };

}


/* ============================================================
 * createPlan
 * ============================================================ */


test(
    "createPlan : construit un plan cohérent à partir des conséquences persistées",
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


                const workflow =
                    seedWorkflow(
                        combat,
                        {
                            attackerId:
                                attacker.id,

                            defenderId:
                                defender.id,

                            consequenceResult:
                                defaultConsequenceResult({

                                    damage: {

                                        vigor: {
                                            beforeProtection: 3
                                        },

                                        agility: {
                                            total: 1
                                        }

                                    },

                                    effects: {
                                        swapInitiative: true,
                                        disarm: false,
                                        knockdown: false,
                                        grapple: false
                                    }

                                })
                        }
                    );


                const plan =
                    MeleeDamageApplicationService
                        .createPlan(
                            workflow
                        );


                assert.equal(
                    plan.hit,
                    true
                );

                assert.equal(
                    plan.damage.vigor,
                    3
                );

                assert.equal(
                    plan.damage.agility,
                    1
                );

                assert.equal(
                    plan.effects.swapInitiative,
                    true
                );

                assert.equal(
                    plan.protection.required,
                    false
                );

            }
        );

    }
);


test(
    "createPlan : lance une TypeError lorsqu'aucun workflow n'est fourni",
    () => {

        assert.throws(
            () =>
                MeleeDamageApplicationService
                    .createPlan(
                        null
                    ),
            TypeError
        );

    }
);


test(
    "createPlan : échoue lorsque le workflow n'a encore aucune conséquence résolue",
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


                const workflow =
                    seedBareWorkflow(
                        combat,
                        {
                            attackerId:
                                attacker.id,

                            defenderId:
                                defender.id
                        }
                    );


                assert.throws(
                    () =>
                        MeleeDamageApplicationService
                            .createPlan(
                                workflow
                            ),
                    TypeError
                );

            }
        );

    }
);


/* ============================================================
 * applyVigorDamage
 * ============================================================ */


test(
    "applyVigorDamage : mute réellement la Vigueur du défenseur",
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

                        consequenceResult:
                            defaultConsequenceResult({

                                damage: {

                                    vigor: {
                                        beforeProtection: 4
                                    },

                                    agility: {
                                        total: 0
                                    }

                                }

                            })
                    }
                );


                const result =
                    await MeleeDamageApplicationService
                        .applyVigorDamage(
                            combat,
                            "workflow-1"
                        );


                assert.equal(
                    defender.calls
                        .takeAttributeDamage
                        .length,
                    1
                );

                assert.equal(
                    defender.calls
                        .takeAttributeDamage[0]
                        .attribute,
                    "vigor"
                );

                assert.equal(
                    defender.calls
                        .takeAttributeDamage[0]
                        .amount,
                    4
                );

                assert.equal(
                    attacker.calls
                        .takeAttributeDamage
                        .length,
                    0
                );

                assert.equal(
                    result.result.applied,
                    true
                );

                assert.equal(
                    result.result.damage,
                    4
                );

            }
        );

    }
);


test(
    "applyVigorDamage : ne mute rien lorsque les dégâts de Vigueur finaux sont nuls",
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

                        consequenceResult:
                            defaultConsequenceResult()
                    }
                );


                const result =
                    await MeleeDamageApplicationService
                        .applyVigorDamage(
                            combat,
                            "workflow-1"
                        );


                assert.equal(
                    defender.calls
                        .takeAttributeDamage
                        .length,
                    0
                );

                assert.equal(
                    result.result.applied,
                    false
                );

                assert.equal(
                    result.result.reason,
                    "no-damage"
                );

            }
        );

    }
);


test(
    "applyVigorDamage : ne rejoue jamais l'étape une seconde fois",
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

                        consequenceResult:
                            defaultConsequenceResult({

                                damage: {

                                    vigor: {
                                        beforeProtection: 2
                                    },

                                    agility: {
                                        total: 0
                                    }

                                }

                            })
                    }
                );


                await MeleeDamageApplicationService
                    .applyVigorDamage(
                        combat,
                        "workflow-1"
                    );


                const second =
                    await MeleeDamageApplicationService
                        .applyVigorDamage(
                            combat,
                            "workflow-1"
                        );


                assert.equal(
                    defender.calls
                        .takeAttributeDamage
                        .length,
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
    "applyVigorDamage : lance une erreur lorsque le workflow est introuvable",
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


                await assert.rejects(
                    () =>
                        MeleeDamageApplicationService
                            .applyVigorDamage(
                                combat,
                                "workflow-inconnu"
                            ),
                    /introuvable/
                );

            }
        );

    }
);


test(
    "applyVigorDamage : lance une erreur lorsque les conséquences ne peuvent pas encore être appliquées",
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


                seedBareWorkflow(
                    combat,
                    {
                        attackerId:
                            attacker.id,

                        defenderId:
                            defender.id
                    }
                );


                await assert.rejects(
                    () =>
                        MeleeDamageApplicationService
                            .applyVigorDamage(
                                combat,
                                "workflow-1"
                            ),
                    /ne peuvent pas être appliquées/
                );

            }
        );

    }
);


test(
    "applyVigorDamage : lance une erreur lorsque le défenseur est introuvable",
    async () => {

        const attacker =
            createActorStub({
                id: "actor-attacker",
                name: "L'attaquant"
            });


        await withStubs(
            {
                attacker,
                // Aucun défenseur inscrit dans game.actors.
                defender:
                    null
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
                            "actor-defender-absent",

                        consequenceResult:
                            defaultConsequenceResult({

                                damage: {

                                    vigor: {
                                        beforeProtection: 1
                                    },

                                    agility: {
                                        total: 0
                                    }

                                }

                            })
                    }
                );


                await assert.rejects(
                    () =>
                        MeleeDamageApplicationService
                            .applyVigorDamage(
                                combat,
                                "workflow-1"
                            ),
                    /défenseur du workflow est introuvable/
                );

            }
        );

    }
);


/* ============================================================
 * applyAgilityDamage
 * ============================================================ */


test(
    "applyAgilityDamage : mute réellement l'Agilité du défenseur",
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

                        consequenceResult:
                            defaultConsequenceResult({

                                damage: {

                                    vigor: {
                                        beforeProtection: 0
                                    },

                                    agility: {
                                        total: 2
                                    }

                                }

                            })
                    }
                );


                const result =
                    await MeleeDamageApplicationService
                        .applyAgilityDamage(
                            combat,
                            "workflow-1"
                        );


                assert.equal(
                    defender.calls
                        .takeAttributeDamage
                        .length,
                    1
                );

                assert.equal(
                    defender.calls
                        .takeAttributeDamage[0]
                        .attribute,
                    "agility"
                );

                assert.equal(
                    defender.calls
                        .takeAttributeDamage[0]
                        .amount,
                    2
                );

                assert.equal(
                    result.result.applied,
                    true
                );

            }
        );

    }
);


test(
    "applyAgilityDamage : ne mute rien lorsque les dégâts d'Agilité sont nuls",
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

                        consequenceResult:
                            defaultConsequenceResult()
                    }
                );


                const result =
                    await MeleeDamageApplicationService
                        .applyAgilityDamage(
                            combat,
                            "workflow-1"
                        );


                assert.equal(
                    defender.calls
                        .takeAttributeDamage
                        .length,
                    0
                );

                assert.equal(
                    result.result.applied,
                    false
                );

                assert.equal(
                    result.result.reason,
                    "no-damage"
                );

            }
        );

    }
);


test(
    "applyAgilityDamage : ne rejoue jamais l'étape une seconde fois",
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

                        consequenceResult:
                            defaultConsequenceResult({

                                damage: {

                                    vigor: {
                                        beforeProtection: 0
                                    },

                                    agility: {
                                        total: 1
                                    }

                                }

                            })
                    }
                );


                await MeleeDamageApplicationService
                    .applyAgilityDamage(
                        combat,
                        "workflow-1"
                    );


                const second =
                    await MeleeDamageApplicationService
                        .applyAgilityDamage(
                            combat,
                            "workflow-1"
                        );


                assert.equal(
                    defender.calls
                        .takeAttributeDamage
                        .length,
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


/* ============================================================
 * applyProtectionDamage
 * ============================================================ */


test(
    "applyProtectionDamage : n'applique rien lorsque le plan n'exige aucune dégradation",
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

                        consequenceResult:
                            defaultConsequenceResult({

                                damage: {

                                    vigor: {
                                        beforeProtection: 3
                                    },

                                    agility: {
                                        total: 0
                                    }

                                },

                                protection: {
                                    required: false
                                }

                            })
                    }
                );


                const result =
                    await MeleeDamageApplicationService
                        .applyProtectionDamage(
                            combat,
                            "workflow-1"
                        );


                assert.equal(
                    defender.calls
                        .resolveProtectionDamage
                        .length,
                    0
                );

                assert.equal(
                    result.requiresAllocation,
                    false
                );

                assert.equal(
                    result.result.applied,
                    false
                );

                assert.equal(
                    result.result.reason,
                    "no-damage"
                );

            }
        );

    }
);


test(
    "applyProtectionDamage : dégrade automatiquement l'unique protection disponible",
    async () => {

        const attacker =
            createActorStub({
                id: "actor-attacker",
                name: "L'attaquant"
            });


        const bodyArmor =
            createItemStub({
                id: "item-body",
                name: "Gilet pare-balles",
                protectionCurrent: 5
            });


        const defender =
            createActorStub({
                id: "actor-defender",
                name: "Le défenseur",
                itemsList: [
                    bodyArmor
                ]
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

                        consequenceResult:
                            defaultConsequenceResult({

                                damage: {

                                    vigor: {
                                        beforeProtection: 6
                                    },

                                    agility: {
                                        total: 0
                                    }

                                },

                                protection: {
                                    required: true
                                }

                            }),

                        protectionResult: {

                            source: {

                                type:
                                    "worn",

                                bodyArmor: {
                                    itemId:
                                        "item-body",
                                    itemName:
                                        "Gilet pare-balles"
                                },

                                helmet:
                                    null

                            },

                            incomingDamage:
                                6,

                            remainingDamage:
                                3,

                            totalPrevented:
                                3,

                            protectionDamage:
                                3

                        }
                    }
                );


                const result =
                    await MeleeDamageApplicationService
                        .applyProtectionDamage(
                            combat,
                            "workflow-1"
                        );


                assert.equal(
                    defender.calls
                        .resolveProtectionDamage
                        .length,
                    1
                );

                assert.equal(
                    defender.calls
                        .resolveProtectionDamage[0]
                        .target,
                    "body"
                );

                assert.equal(
                    defender.calls
                        .resolveProtectionDamage[0]
                        .allocatedDamage,
                    3
                );

                assert.equal(
                    result.requiresAllocation,
                    false
                );

                assert.equal(
                    result.result.applied,
                    true
                );

                assert.equal(
                    result.result.appliedDamage,
                    3
                );

                assert.equal(
                    result.result.automatic,
                    true
                );

                assert.equal(
                    result.result.reason,
                    "single-protection"
                );

            }
        );

    }
);


test(
    "applyProtectionDamage : n'applique rien lorsqu'il ne reste plus aucune protection à dégrader",
    async () => {

        const attacker =
            createActorStub({
                id: "actor-attacker",
                name: "L'attaquant"
            });


        const brokenBodyArmor =
            createItemStub({
                id: "item-body",
                name: "Gilet détruit",
                protectionCurrent: 0
            });


        const defender =
            createActorStub({
                id: "actor-defender",
                name: "Le défenseur",
                itemsList: [
                    brokenBodyArmor
                ]
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

                        consequenceResult:
                            defaultConsequenceResult({

                                damage: {

                                    vigor: {
                                        beforeProtection: 6
                                    },

                                    agility: {
                                        total: 0
                                    }

                                },

                                protection: {
                                    required: true
                                }

                            }),

                        protectionResult: {

                            source: {

                                type:
                                    "worn",

                                bodyArmor: {
                                    itemId:
                                        "item-body",
                                    itemName:
                                        "Gilet détruit"
                                },

                                helmet:
                                    null

                            },

                            incomingDamage:
                                6,

                            remainingDamage:
                                6,

                            totalPrevented:
                                0,

                            protectionDamage:
                                2

                        }
                    }
                );


                const result =
                    await MeleeDamageApplicationService
                        .applyProtectionDamage(
                            combat,
                            "workflow-1"
                        );


                assert.equal(
                    defender.calls
                        .resolveProtectionDamage
                        .length,
                    0
                );

                assert.equal(
                    result.result.applied,
                    false
                );

                assert.equal(
                    result.result.reason,
                    "no-protection-left"
                );

                assert.equal(
                    result.result.overflow,
                    2
                );

            }
        );

    }
);


test(
    "applyProtectionDamage : réclame une répartition explicite lorsque deux protections partagent la dégradation",
    async () => {

        const attacker =
            createActorStub({
                id: "actor-attacker",
                name: "L'attaquant"
            });


        const bodyArmor =
            createItemStub({
                id: "item-body",
                name: "Gilet pare-balles",
                protectionCurrent: 5
            });


        const helmet =
            createItemStub({
                id: "item-helmet",
                name: "Casque",
                protectionCurrent: 5
            });


        const defender =
            createActorStub({
                id: "actor-defender",
                name: "Le défenseur",
                itemsList: [
                    bodyArmor,
                    helmet
                ]
            });


        const protectionResult = {

            source: {

                type:
                    "worn",

                bodyArmor: {
                    itemId:
                        "item-body",
                    itemName:
                        "Gilet pare-balles"
                },

                helmet: {
                    itemId:
                        "item-helmet",
                    itemName:
                        "Casque"
                }

            },

            incomingDamage:
                6,

            remainingDamage:
                2,

            totalPrevented:
                4,

            protectionDamage:
                4

        };


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

                        consequenceResult:
                            defaultConsequenceResult({

                                damage: {

                                    vigor: {
                                        beforeProtection: 6
                                    },

                                    agility: {
                                        total: 0
                                    }

                                },

                                protection: {
                                    required: true
                                }

                            }),

                        protectionResult
                    }
                );


                const firstAttempt =
                    await MeleeDamageApplicationService
                        .applyProtectionDamage(
                            combat,
                            "workflow-1"
                        );


                assert.equal(
                    firstAttempt.requiresAllocation,
                    true
                );

                assert.equal(
                    firstAttempt.damageToAllocate,
                    4
                );

                assert.equal(
                    firstAttempt.result,
                    null
                );

                assert.equal(
                    defender.calls
                        .resolveProtectionDamage
                        .length,
                    0
                );


                const secondAttempt =
                    await MeleeDamageApplicationService
                        .applyProtectionDamage(
                            combat,
                            "workflow-1",
                            {
                                allocations: {
                                    body: 3,
                                    helmet: 1
                                }
                            }
                        );


                assert.equal(
                    defender.calls
                        .resolveProtectionDamage
                        .length,
                    2
                );

                assert.equal(
                    secondAttempt.result.applied,
                    true
                );

                assert.equal(
                    secondAttempt.result.automatic,
                    false
                );

                assert.equal(
                    secondAttempt.result.reason,
                    "manual-allocation"
                );

                assert.equal(
                    secondAttempt.result.appliedDamage,
                    4
                );

            }
        );

    }
);


test(
    "applyProtectionDamage : ne rejoue jamais l'étape une seconde fois",
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

                        consequenceResult:
                            defaultConsequenceResult()
                    }
                );


                await MeleeDamageApplicationService
                    .applyProtectionDamage(
                        combat,
                        "workflow-1"
                    );


                const second =
                    await MeleeDamageApplicationService
                        .applyProtectionDamage(
                            combat,
                            "workflow-1"
                        );


                assert.equal(
                    second.alreadyResolved,
                    true
                );

                assert.equal(
                    second.requiresAllocation,
                    false
                );

            }
        );

    }
);


/* ============================================================
 * applySwapInitiative
 * ============================================================ */


test(
    "applySwapInitiative : programme l'échange d'initiative au round suivant",
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

                const attackerCombatant =
                    createCombatantStub({
                        id: "combatant-attacker",
                        actorId: attacker.id,
                        initiative: 10
                    });


                const defenderCombatant =
                    createCombatantStub({
                        id: "combatant-defender",
                        actorId: defender.id,
                        initiative: 4
                    });


                const combat =
                    createCombatStub({
                        combatants: [
                            attackerCombatant,
                            defenderCombatant
                        ]
                    });


                seedWorkflow(
                    combat,
                    {
                        attackerId:
                            attacker.id,

                        defenderId:
                            defender.id,

                        consequenceResult:
                            defaultConsequenceResult({

                                effects: {
                                    swapInitiative: true,
                                    disarm: false,
                                    knockdown: false,
                                    grapple: false
                                }

                            })
                    }
                );


                const result =
                    await MeleeDamageApplicationService
                        .applySwapInitiative(
                            combat,
                            "workflow-1"
                        );


                assert.equal(
                    result.result.scheduled,
                    true
                );

                assert.equal(
                    result.result.applied,
                    false
                );

                assert.equal(
                    result.result.applyRound,
                    2
                );

                assert.equal(
                    result.result.attacker.actorId,
                    attacker.id
                );

                assert.equal(
                    result.result.target.actorId,
                    defender.id
                );


                const pendingSwaps =
                    combat.getFlag(
                        "metro-2033-yze",
                        "pendingInitiativeSwaps"
                    );


                assert.equal(
                    pendingSwaps.length,
                    1
                );

            }
        );

    }
);


test(
    "applySwapInitiative : n'applique rien lorsque l'éclat n'a pas été choisi",
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

                        consequenceResult:
                            defaultConsequenceResult()
                    }
                );


                const result =
                    await MeleeDamageApplicationService
                        .applySwapInitiative(
                            combat,
                            "workflow-1"
                        );


                assert.equal(
                    result.result.applied,
                    false
                );

                assert.equal(
                    result.result.scheduled,
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
    "applySwapInitiative : ne rejoue jamais l'étape une seconde fois",
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

                        consequenceResult:
                            defaultConsequenceResult()
                    }
                );


                await MeleeDamageApplicationService
                    .applySwapInitiative(
                        combat,
                        "workflow-1"
                    );


                const second =
                    await MeleeDamageApplicationService
                        .applySwapInitiative(
                            combat,
                            "workflow-1"
                        );


                assert.equal(
                    second.alreadyResolved,
                    true
                );

            }
        );

    }
);


/* ============================================================
 * applyDisarm
 * ============================================================ */


test(
    "applyDisarm : enregistre un effet narratif sur le défenseur sans muter aucun Actor",
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

                        consequenceResult:
                            defaultConsequenceResult({

                                effects: {
                                    swapInitiative: false,
                                    disarm: true,
                                    knockdown: false,
                                    grapple: false
                                }

                            })
                    }
                );


                const result =
                    await MeleeDamageApplicationService
                        .applyDisarm(
                            combat,
                            "workflow-1"
                        );


                assert.equal(
                    defender.calls
                        .applyDisarm
                        .length,
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
                    defender.id
                );

            }
        );

    }
);


test(
    "applyDisarm : n'applique rien lorsque le désarmement n'a pas été choisi",
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

                        consequenceResult:
                            defaultConsequenceResult()
                    }
                );


                const result =
                    await MeleeDamageApplicationService
                        .applyDisarm(
                            combat,
                            "workflow-1"
                        );


                assert.equal(
                    result.result.applied,
                    false
                );

                assert.equal(
                    result.result.narrative,
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
    "applyDisarm : ne rejoue jamais l'étape une seconde fois",
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

                        consequenceResult:
                            defaultConsequenceResult({

                                effects: {
                                    swapInitiative: false,
                                    disarm: true,
                                    knockdown: false,
                                    grapple: false
                                }

                            })
                    }
                );


                await MeleeDamageApplicationService
                    .applyDisarm(
                        combat,
                        "workflow-1"
                    );


                const second =
                    await MeleeDamageApplicationService
                        .applyDisarm(
                            combat,
                            "workflow-1"
                        );


                assert.equal(
                    second.alreadyResolved,
                    true
                );

            }
        );

    }
);


/* ============================================================
 * applyKnockdown
 * ============================================================ */


test(
    "applyKnockdown : mute réellement l'état prone du défenseur",
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

                        consequenceResult:
                            defaultConsequenceResult({

                                effects: {
                                    swapInitiative: false,
                                    disarm: false,
                                    knockdown: true,
                                    grapple: false
                                }

                            })
                    }
                );


                const result =
                    await MeleeDamageApplicationService
                        .applyKnockdown(
                            combat,
                            "workflow-1"
                        );


                assert.equal(
                    defender.calls
                        .applyKnockdown
                        .length,
                    1
                );

                assert.equal(
                    result.result.applied,
                    true
                );

                assert.equal(
                    result.result.current,
                    true
                );

            }
        );

    }
);


test(
    "applyKnockdown : n'applique rien lorsque l'éclat n'a pas été choisi",
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

                        consequenceResult:
                            defaultConsequenceResult()
                    }
                );


                const result =
                    await MeleeDamageApplicationService
                        .applyKnockdown(
                            combat,
                            "workflow-1"
                        );


                assert.equal(
                    defender.calls
                        .applyKnockdown
                        .length,
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
    "applyKnockdown : ne rejoue jamais l'étape une seconde fois",
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

                        consequenceResult:
                            defaultConsequenceResult({

                                effects: {
                                    swapInitiative: false,
                                    disarm: false,
                                    knockdown: true,
                                    grapple: false
                                }

                            })
                    }
                );


                await MeleeDamageApplicationService
                    .applyKnockdown(
                        combat,
                        "workflow-1"
                    );


                const second =
                    await MeleeDamageApplicationService
                        .applyKnockdown(
                            combat,
                            "workflow-1"
                        );


                assert.equal(
                    defender.calls
                        .applyKnockdown
                        .length,
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


/* ============================================================
 * applyGrapple
 * ============================================================ */


test(
    "applyGrapple : établit réellement une saisie entre l'attaquant et le défenseur",
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

                const attackerCombatant =
                    createCombatantStub({
                        id: "combatant-attacker",
                        actorId: attacker.id
                    });


                const defenderCombatant =
                    createCombatantStub({
                        id: "combatant-defender",
                        actorId: defender.id
                    });


                const combat =
                    createCombatStub({
                        combatants: [
                            attackerCombatant,
                            defenderCombatant
                        ]
                    });


                seedWorkflow(
                    combat,
                    {
                        attackerId:
                            attacker.id,

                        defenderId:
                            defender.id,

                        consequenceResult:
                            defaultConsequenceResult({

                                effects: {
                                    swapInitiative: false,
                                    disarm: false,
                                    knockdown: false,
                                    grapple: true
                                }

                            })
                    }
                );


                const result =
                    await MeleeDamageApplicationService
                        .applyGrapple(
                            combat,
                            "workflow-1"
                        );


                assert.equal(
                    defender.calls
                        .applyKnockdown
                        .length,
                    1
                );

                assert.equal(
                    attacker.calls
                        .applyKnockdown
                        .length,
                    1
                );

                assert.equal(
                    result.result.applied,
                    true
                );

                assert.equal(
                    result.result.attackerId,
                    attacker.id
                );

                assert.equal(
                    result.result.targetId,
                    defender.id
                );

                assert.ok(
                    result.result.grappleId
                );


                const activeGrapples =
                    combat.getFlag(
                        "metro-2033-yze",
                        "activeGrapples"
                    );


                assert.equal(
                    activeGrapples.length,
                    1
                );

            }
        );

    }
);


test(
    "applyGrapple : n'établit aucune saisie lorsque l'éclat n'a pas été choisi",
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

                        consequenceResult:
                            defaultConsequenceResult()
                    }
                );


                const result =
                    await MeleeDamageApplicationService
                        .applyGrapple(
                            combat,
                            "workflow-1"
                        );


                assert.equal(
                    defender.calls
                        .applyKnockdown
                        .length,
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

                assert.equal(
                    combat.getFlag(
                        "metro-2033-yze",
                        "activeGrapples"
                    ),
                    undefined
                );

            }
        );

    }
);


test(
    "applyGrapple : ne rejoue jamais l'étape une seconde fois",
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

                const attackerCombatant =
                    createCombatantStub({
                        id: "combatant-attacker",
                        actorId: attacker.id
                    });


                const defenderCombatant =
                    createCombatantStub({
                        id: "combatant-defender",
                        actorId: defender.id
                    });


                const combat =
                    createCombatStub({
                        combatants: [
                            attackerCombatant,
                            defenderCombatant
                        ]
                    });


                seedWorkflow(
                    combat,
                    {
                        attackerId:
                            attacker.id,

                        defenderId:
                            defender.id,

                        consequenceResult:
                            defaultConsequenceResult({

                                effects: {
                                    swapInitiative: false,
                                    disarm: false,
                                    knockdown: false,
                                    grapple: true
                                }

                            })
                    }
                );


                await MeleeDamageApplicationService
                    .applyGrapple(
                        combat,
                        "workflow-1"
                    );


                const second =
                    await MeleeDamageApplicationService
                        .applyGrapple(
                            combat,
                            "workflow-1"
                        );


                assert.equal(
                    second.alreadyResolved,
                    true
                );


                const activeGrapples =
                    combat.getFlag(
                        "metro-2033-yze",
                        "activeGrapples"
                    );


                assert.equal(
                    activeGrapples.length,
                    1
                );

            }
        );

    }
);
