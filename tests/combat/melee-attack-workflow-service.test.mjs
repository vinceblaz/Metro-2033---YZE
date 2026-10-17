import { test } from "node:test";
import assert from "node:assert/strict";

import {
    MeleeAttackWorkflowService
} from "../../src/combat/melee-attack-workflow-service.mjs";

import {
    MeleeAttackWorkflow,
    MELEE_ATTACK_WORKFLOW_STATES,
    MELEE_APPLICATION_STEP_KEYS
} from "../../src/combat/melee-attack-workflow.mjs";


/**
 * Ce fichier ne couvre PAS l'intégralité de
 * MeleeAttackWorkflowService (aucun test n'existait
 * avant ce chantier). Il se concentre sur le nouveau
 * comportement introduit pour les éclats de blocage.
 */


async function withFoundryStub(
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


    try {

        return await callback();

    }
    finally {

        delete globalThis.foundry;

    }

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

        },

        async unsetFlag(
            scope,
            key
        ) {

            delete storage[key];

        }

    };

}


async function createBlockedWorkflow(
    combat,
    blockSuccesses
) {

    const workflow =
        await MeleeAttackWorkflowService.create(
            combat,
            {

                attacker: {
                    id: "actor-attacker"
                },

                defender: {
                    id: "actor-defender"
                },

                weapon: {
                    id: "weapon-1"
                },

                canBlock:
                    true

            }
        );


    await MeleeAttackWorkflowService.chooseDefense(
        combat,
        workflow.id,
        "block",
        {
            user: {
                isGM: true
            }
        }
    );


    return MeleeAttackWorkflowService.resolveBlock(
        combat,
        workflow.id,
        {
            rolled: true,
            roll: {
                successes: blockSuccesses
            }
        }
    );

}


test(
    "MeleeAttackWorkflowService.resolveBlockStunts : persiste le résultat et fait progresser l'état",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const blockedWorkflow =
                    await createBlockedWorkflow(
                        combat,
                        2
                    );


                assert.equal(
                    blockedWorkflow.state,
                    MELEE_ATTACK_WORKFLOW_STATES
                        .AWAITING_BLOCK_STUNTS
                );


                const resolvedWorkflow =
                    await MeleeAttackWorkflowService
                        .resolveBlockStunts(
                            combat,
                            blockedWorkflow.id,
                            {

                                available:
                                    2,

                                spent:
                                    2,

                                remaining:
                                    0,

                                effects: {

                                    cancelledSuccesses:
                                        1,

                                    counterAttack:
                                        true,

                                    disarm:
                                        false

                                }

                            }
                        );


                assert.equal(
                    resolvedWorkflow.state,
                    MELEE_ATTACK_WORKFLOW_STATES
                        .ATTACK_PREPARATION
                );

                assert.equal(
                    resolvedWorkflow.hasBlockStuntResult,
                    true
                );

                assert.equal(
                    resolvedWorkflow.blockStunts
                        .result
                        .effects
                        .counterAttack,
                    true
                );


                const reloaded =
                    MeleeAttackWorkflowService.get(
                        combat,
                        blockedWorkflow.id
                    );


                assert.equal(
                    reloaded.blockStunts
                        .result
                        .effects
                        .cancelledSuccesses,
                    1
                );

            }
        );

    }
);


test(
    "MeleeAttackWorkflowService.resolveBlockStunts : signale un workflow introuvable",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                await assert.rejects(
                    () =>
                        MeleeAttackWorkflowService
                            .resolveBlockStunts(
                                combat,
                                "inconnu",
                                {
                                    effects: {
                                        cancelledSuccesses: 0,
                                        counterAttack: false,
                                        disarm: false
                                    }
                                }
                            ),
                    /introuvable/
                );

            }
        );

    }
);


test(
    "MeleeAttackWorkflowService.resolveBlockStunts : rejette une résolution hors de l'état d'attente",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const blockedWorkflow =
                    await createBlockedWorkflow(
                        combat,
                        0
                    );


                assert.equal(
                    blockedWorkflow.state,
                    MELEE_ATTACK_WORKFLOW_STATES
                        .ATTACK_PREPARATION
                );


                await assert.rejects(
                    () =>
                        MeleeAttackWorkflowService
                            .resolveBlockStunts(
                                combat,
                                blockedWorkflow.id,
                                {
                                    effects: {
                                        cancelledSuccesses: 0,
                                        counterAttack: false,
                                        disarm: false
                                    }
                                }
                            ),
                    /état actuel/
                );

            }
        );

    }
);


/**
 * ============================================================
 * COMPLÉMENT DE COUVERTURE
 * ============================================================
 *
 * Les tests ci-dessous verrouillent le comportement
 * actuel des méthodes de MeleeAttackWorkflowService
 * qui n'étaient pas encore couvertes :
 *
 * getAll, save, remove, clear,
 * getActorFromReference, getAttacker, getDefender,
 * getWeapon, canUserDecideDefense,
 * assertUserCanDecideDefense, cancelBlockPreparation,
 * resolveAttack, updateAttackResult, finalizeAttack,
 * resolveStunts, resolveConsequences, resolveProtection,
 * resolveApplicationStep, resolveApplication, complete.
 *
 * Aucun bug connu n'est visé : il s'agit uniquement
 * de figer le comportement existant.
 */


/**
 * Stub `game` minimal, utilisé uniquement par les
 * tests qui résolvent des Actors ou des permissions.
 */
async function withGameStub(
    {
        actors = [],
        combat = null
    },
    callback
) {

    globalThis.game = {

        combat,

        actors: {

            get(
                id
            ) {

                return (
                    actors.find(
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

        delete globalThis.game;

    }

}


/**
 * Crée un workflow directement en ATTACK_PREPARATION
 * (canBlock:false), afin de piloter les étapes
 * suivantes sans avoir à rejouer tout le blocage.
 */
async function createDeclinedWorkflow(
    combat,
    overrides = {}
) {

    return MeleeAttackWorkflowService.create(
        combat,
        {

            attacker: {
                id: "actor-attacker"
            },

            defender: {
                id: "actor-defender"
            },

            weapon: {
                id: "weapon-1"
            },

            canBlock:
                false,

            ...overrides

        }
    );

}


function minimalConsequenceResult(
    {
        protectionRequired = false
    } = {}
) {

    return {

        hit:
            true,

        protection: {

            required:
                protectionRequired,

            incomingVigorDamage:
                protectionRequired
                    ? 3
                    : 0

        }

    };

}


function minimalProtectionResult() {

    return {

        successes:
            1,

        incomingDamage:
            3,

        remainingDamage:
            2

    };

}


function minimalApplicationStepResult() {

    return {

        applied:
            false,

        reason:
            "not-required"

    };

}


/**
 * Fait progresser un workflow décliné jusqu'à
 * ATTACK_RESOLVED, avec un résultat d'attaque
 * finalisé ou non selon `finalize`.
 */
async function driveToAttackResolved(
    combat,
    {
        finalize = false
    } = {}
) {

    const created =
        await createDeclinedWorkflow(
            combat
        );


    const resolved =
        await MeleeAttackWorkflowService.resolveAttack(
            combat,
            created.id,
            {
                successes: 2
            }
        );


    if (!finalize) {

        return resolved;

    }


    return MeleeAttackWorkflowService.finalizeAttack(
        combat,
        created.id
    );

}


/**
 * Fait progresser un workflow décliné jusqu'à
 * CONSEQUENCES_RESOLVED, en passant par une attaque
 * finalisée mais sans résolution d'éclats.
 */
async function driveToConsequencesResolved(
    combat,
    {
        protectionRequired = false
    } = {}
) {

    const finalized =
        await driveToAttackResolved(
            combat,
            {
                finalize: true
            }
        );


    return MeleeAttackWorkflowService.resolveConsequences(
        combat,
        finalized.id,
        minimalConsequenceResult(
            {
                protectionRequired
            }
        )
    );

}


/**
 * Fait progresser un workflow décliné jusqu'à ce que
 * toutes les étapes du journal d'application soient
 * résolues (sans Protection requise).
 */
async function driveToApplicationStepsResolved(
    combat
) {

    let workflow =
        await driveToConsequencesResolved(
            combat,
            {
                protectionRequired: false
            }
        );


    for (
        const stepKey
        of Object.values(
            MELEE_APPLICATION_STEP_KEYS
        )
    ) {

        workflow =
            await MeleeAttackWorkflowService
                .resolveApplicationStep(
                    combat,
                    workflow.id,
                    stepKey,
                    minimalApplicationStepResult()
                );

    }


    return workflow;

}


/* ============================================================
 * getAll
 * ============================================================ */


test(
    "MeleeAttackWorkflowService.getAll : retourne toutes les instances persistées",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const first =
                    await createDeclinedWorkflow(
                        combat
                    );

                const second =
                    await createDeclinedWorkflow(
                        combat
                    );


                const all =
                    MeleeAttackWorkflowService.getAll(
                        combat
                    );


                assert.equal(
                    all.length,
                    2
                );

                assert.ok(
                    all.every(
                        workflow =>
                            workflow
                            instanceof
                            MeleeAttackWorkflow
                    )
                );

                assert.deepEqual(
                    all.map(
                        workflow =>
                            workflow.id
                    ).sort(),
                    [
                        first.id,
                        second.id
                    ].sort()
                );

            }
        );

    }
);


test(
    "MeleeAttackWorkflowService.getAll : retourne un tableau vide sans workflow stocké",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                assert.deepEqual(
                    MeleeAttackWorkflowService.getAll(
                        combat
                    ),
                    []
                );

            }
        );

    }
);


/* ============================================================
 * save
 * ============================================================ */


test(
    "MeleeAttackWorkflowService.save : persiste une nouvelle version du workflow",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const workflow =
                    await createDeclinedWorkflow(
                        combat
                    );


                workflow.metadata.marqueur =
                    "modifié";


                await MeleeAttackWorkflowService.save(
                    combat,
                    workflow
                );


                const reloaded =
                    MeleeAttackWorkflowService.get(
                        combat,
                        workflow.id
                    );


                assert.equal(
                    reloaded.metadata.marqueur,
                    "modifié"
                );

            }
        );

    }
);


test(
    "MeleeAttackWorkflowService.save : rejette un objet qui n'est pas un MeleeAttackWorkflow",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                await assert.rejects(
                    () =>
                        MeleeAttackWorkflowService.save(
                            combat,
                            {
                                id: "pas-un-workflow"
                            }
                        ),
                    TypeError
                );

            }
        );

    }
);


/* ============================================================
 * remove
 * ============================================================ */


test(
    "MeleeAttackWorkflowService.remove : supprime un workflow existant sans toucher aux autres",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const first =
                    await createDeclinedWorkflow(
                        combat
                    );

                const second =
                    await createDeclinedWorkflow(
                        combat
                    );


                const removed =
                    await MeleeAttackWorkflowService.remove(
                        combat,
                        first.id
                    );


                assert.equal(
                    removed,
                    true
                );

                assert.equal(
                    MeleeAttackWorkflowService.get(
                        combat,
                        first.id
                    ),
                    null
                );

                assert.ok(
                    MeleeAttackWorkflowService.get(
                        combat,
                        second.id
                    )
                );

            }
        );

    }
);


test(
    "MeleeAttackWorkflowService.remove : retourne false pour un identifiant inconnu",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                await createDeclinedWorkflow(
                    combat
                );


                const removed =
                    await MeleeAttackWorkflowService.remove(
                        combat,
                        "inconnu"
                    );


                assert.equal(
                    removed,
                    false
                );

            }
        );

    }
);


test(
    "MeleeAttackWorkflowService.remove : vide entièrement le flag lorsque le dernier workflow est retiré",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const only =
                    await createDeclinedWorkflow(
                        combat
                    );


                await MeleeAttackWorkflowService.remove(
                    combat,
                    only.id
                );


                assert.deepEqual(
                    MeleeAttackWorkflowService.getAll(
                        combat
                    ),
                    []
                );

            }
        );

    }
);


/* ============================================================
 * clear
 * ============================================================ */


test(
    "MeleeAttackWorkflowService.clear : supprime tous les workflows d'un Combat",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                await createDeclinedWorkflow(
                    combat
                );

                await createDeclinedWorkflow(
                    combat
                );


                const cleared =
                    await MeleeAttackWorkflowService.clear(
                        combat
                    );


                assert.equal(
                    cleared,
                    true
                );

                assert.deepEqual(
                    MeleeAttackWorkflowService.getAll(
                        combat
                    ),
                    []
                );

            }
        );

    }
);


test(
    "MeleeAttackWorkflowService.clear : exige un Combat actif",
    async () => {

        await withFoundryStub(
            async () => {

                await assert.rejects(
                    () =>
                        MeleeAttackWorkflowService.clear(
                            null
                        ),
                    /Combat Foundry actif est requis/
                );

            }
        );

    }
);


/* ============================================================
 * getActorFromReference / getAttacker / getDefender
 * ============================================================ */


test(
    "MeleeAttackWorkflowService.getActorFromReference : retombe sur l'Actor monde sans Token connu",
    async () => {

        const attacker = {
            id: "actor-attacker"
        };


        await withGameStub(
            {
                actors: [
                    attacker
                ]
            },
            () => {

                const found =
                    MeleeAttackWorkflowService
                        .getActorFromReference({
                            actorId:
                                "actor-attacker"
                        });


                assert.equal(
                    found,
                    attacker
                );

            }
        );

    }
);


test(
    "MeleeAttackWorkflowService.getActorFromReference : retourne null sans actorId",
    () => {

        assert.equal(
            MeleeAttackWorkflowService
                .getActorFromReference(
                    null
                ),
            null
        );

    }
);


test(
    "MeleeAttackWorkflowService.getActorFromReference : préfère l'Actor synthétique du Combatant lorsqu'il correspond",
    async () => {

        const worldActor = {
            id: "actor-defender"
        };

        const tokenActor = {
            id: "actor-defender"
        };


        await withGameStub(
            {
                actors: [
                    worldActor
                ],

                combat: {

                    combatants: [
                        {
                            tokenId:
                                "token-defender",

                            actor:
                                tokenActor
                        }
                    ]

                }
            },
            () => {

                const found =
                    MeleeAttackWorkflowService
                        .getActorFromReference({
                            actorId:
                                "actor-defender",

                            tokenId:
                                "token-defender"
                        });


                assert.equal(
                    found,
                    tokenActor
                );

            }
        );

    }
);


test(
    "MeleeAttackWorkflowService.getAttacker / getDefender : résolvent les deux camps du workflow",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const workflow =
                    await createDeclinedWorkflow(
                        combat
                    );


                const attacker = {
                    id: "actor-attacker"
                };

                const defender = {
                    id: "actor-defender"
                };


                await withGameStub(
                    {
                        actors: [
                            attacker,
                            defender
                        ]
                    },
                    () => {

                        assert.equal(
                            MeleeAttackWorkflowService
                                .getAttacker(
                                    workflow
                                ),
                            attacker
                        );

                        assert.equal(
                            MeleeAttackWorkflowService
                                .getDefender(
                                    workflow
                                ),
                            defender
                        );

                    }
                );

            }
        );

    }
);


test(
    "MeleeAttackWorkflowService.getAttacker : retourne null sans workflow",
    async () => {

        await withGameStub(
            {
                actors: []
            },
            () => {

                assert.equal(
                    MeleeAttackWorkflowService
                        .getAttacker(
                            null
                        ),
                    null
                );

            }
        );

    }
);


/* ============================================================
 * getWeapon
 * ============================================================ */


test(
    "MeleeAttackWorkflowService.getWeapon : retrouve l'Item porté par l'attaquant",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const workflow =
                    await createDeclinedWorkflow(
                        combat
                    );


                const weaponItem = {
                    id: "weapon-1",
                    name: "Couteau"
                };

                const attacker = {

                    id:
                        "actor-attacker",

                    items: {

                        get(
                            itemId
                        ) {

                            return (
                                itemId === "weapon-1"
                                    ? weaponItem
                                    : null
                            );

                        }

                    }

                };


                await withGameStub(
                    {
                        actors: [
                            attacker
                        ]
                    },
                    () => {

                        assert.equal(
                            MeleeAttackWorkflowService
                                .getWeapon(
                                    workflow
                                ),
                            weaponItem
                        );

                    }
                );

            }
        );

    }
);


test(
    "MeleeAttackWorkflowService.getWeapon : retourne null lorsque l'attaquant est introuvable",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const workflow =
                    await createDeclinedWorkflow(
                        combat
                    );


                await withGameStub(
                    {
                        actors: []
                    },
                    () => {

                        assert.equal(
                            MeleeAttackWorkflowService
                                .getWeapon(
                                    workflow
                                ),
                            null
                        );

                    }
                );

            }
        );

    }
);


/* ============================================================
 * canUserDecideDefense / assertUserCanDecideDefense
 * ============================================================ */


test(
    "MeleeAttackWorkflowService.canUserDecideDefense : autorise toujours le MJ",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const workflow =
                    await createDeclinedWorkflow(
                        combat
                    );


                await withGameStub(
                    {
                        actors: []
                    },
                    () => {

                        assert.equal(
                            MeleeAttackWorkflowService
                                .canUserDecideDefense(
                                    workflow,
                                    {
                                        isGM: true
                                    }
                                ),
                            true
                        );

                    }
                );

            }
        );

    }
);


test(
    "MeleeAttackWorkflowService.canUserDecideDefense : autorise le propriétaire du défenseur",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const workflow =
                    await createDeclinedWorkflow(
                        combat
                    );


                const defender = {

                    id:
                        "actor-defender",

                    testUserPermission() {

                        return true;

                    }

                };


                await withGameStub(
                    {
                        actors: [
                            defender
                        ]
                    },
                    () => {

                        assert.equal(
                            MeleeAttackWorkflowService
                                .canUserDecideDefense(
                                    workflow,
                                    {
                                        isGM: false
                                    }
                                ),
                            true
                        );

                    }
                );

            }
        );

    }
);


test(
    "MeleeAttackWorkflowService.canUserDecideDefense : refuse un joueur sans droits sur le défenseur",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const workflow =
                    await createDeclinedWorkflow(
                        combat
                    );


                const defender = {

                    id:
                        "actor-defender",

                    testUserPermission() {

                        return false;

                    }

                };


                await withGameStub(
                    {
                        actors: [
                            defender
                        ]
                    },
                    () => {

                        assert.equal(
                            MeleeAttackWorkflowService
                                .canUserDecideDefense(
                                    workflow,
                                    {
                                        isGM: false
                                    }
                                ),
                            false
                        );

                    }
                );

            }
        );

    }
);


test(
    "MeleeAttackWorkflowService.assertUserCanDecideDefense : lève une erreur pour un utilisateur non autorisé",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const workflow =
                    await createDeclinedWorkflow(
                        combat
                    );


                const defender = {

                    id:
                        "actor-defender",

                    testUserPermission() {

                        return false;

                    }

                };


                await withGameStub(
                    {
                        actors: [
                            defender
                        ]
                    },
                    () => {

                        assert.throws(
                            () =>
                                MeleeAttackWorkflowService
                                    .assertUserCanDecideDefense(
                                        workflow,
                                        {
                                            isGM: false
                                        }
                                    ),
                            /propriétaire du défenseur/
                        );

                    }
                );

            }
        );

    }
);


/* ============================================================
 * cancelBlockPreparation
 * ============================================================ */


test(
    "MeleeAttackWorkflowService.cancelBlockPreparation : restaure l'état AWAITING_DEFENSE",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const workflow =
                    await MeleeAttackWorkflowService.create(
                        combat,
                        {

                            attacker: {
                                id: "actor-attacker"
                            },

                            defender: {
                                id: "actor-defender"
                            },

                            weapon: {
                                id: "weapon-1"
                            },

                            canBlock:
                                true

                        }
                    );


                await MeleeAttackWorkflowService.chooseDefense(
                    combat,
                    workflow.id,
                    "block",
                    {
                        user: {
                            isGM: true
                        }
                    }
                );


                const cancelled =
                    await MeleeAttackWorkflowService
                        .cancelBlockPreparation(
                            combat,
                            workflow.id,
                            {
                                user: {
                                    isGM: true
                                }
                            }
                        );


                assert.equal(
                    cancelled.state,
                    MELEE_ATTACK_WORKFLOW_STATES
                        .AWAITING_DEFENSE
                );

                assert.equal(
                    cancelled.defense.decision,
                    null
                );

            }
        );

    }
);


test(
    "MeleeAttackWorkflowService.cancelBlockPreparation : signale un workflow introuvable",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                await assert.rejects(
                    () =>
                        MeleeAttackWorkflowService
                            .cancelBlockPreparation(
                                combat,
                                "inconnu",
                                {
                                    user: {
                                        isGM: true
                                    }
                                }
                            ),
                    /introuvable/
                );

            }
        );

    }
);


test(
    "MeleeAttackWorkflowService.cancelBlockPreparation : rejette une annulation hors de BLOCK_PREPARATION",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const workflow =
                    await createDeclinedWorkflow(
                        combat
                    );


                await assert.rejects(
                    () =>
                        MeleeAttackWorkflowService
                            .cancelBlockPreparation(
                                combat,
                                workflow.id,
                                {
                                    user: {
                                        isGM: true
                                    }
                                }
                            ),
                    /état actuel/
                );

            }
        );

    }
);


/* ============================================================
 * resolveAttack
 * ============================================================ */


test(
    "MeleeAttackWorkflowService.resolveAttack : fait progresser un workflow prêt vers ATTACK_RESOLVED",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const resolved =
                    await driveToAttackResolved(
                        combat
                    );


                assert.equal(
                    resolved.state,
                    MELEE_ATTACK_WORKFLOW_STATES
                        .ATTACK_RESOLVED
                );

                assert.equal(
                    resolved.hasAttackResult,
                    true
                );

                assert.equal(
                    resolved.isAttackFinalized,
                    false
                );

            }
        );

    }
);


test(
    "MeleeAttackWorkflowService.resolveAttack : signale un workflow introuvable",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                await assert.rejects(
                    () =>
                        MeleeAttackWorkflowService
                            .resolveAttack(
                                combat,
                                "inconnu",
                                {
                                    successes: 1
                                }
                            ),
                    /introuvable/
                );

            }
        );

    }
);


test(
    "MeleeAttackWorkflowService.resolveAttack : rejette une résolution hors de ATTACK_PREPARATION",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const resolved =
                    await driveToAttackResolved(
                        combat
                    );


                await assert.rejects(
                    () =>
                        MeleeAttackWorkflowService
                            .resolveAttack(
                                combat,
                                resolved.id,
                                {
                                    successes: 1
                                }
                            ),
                    /état actuel/
                );

            }
        );

    }
);


/* ============================================================
 * updateAttackResult
 * ============================================================ */


test(
    "MeleeAttackWorkflowService.updateAttackResult : remplace le résultat tant qu'il n'est pas finalisé",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const resolved =
                    await driveToAttackResolved(
                        combat
                    );


                const updated =
                    await MeleeAttackWorkflowService
                        .updateAttackResult(
                            combat,
                            resolved.id,
                            {
                                successes: 5
                            }
                        );


                assert.equal(
                    updated.attack.result.successes,
                    5
                );

                assert.equal(
                    updated.isAttackFinalized,
                    false
                );

            }
        );

    }
);


test(
    "MeleeAttackWorkflowService.updateAttackResult : exige un résultat d'attaque",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const resolved =
                    await driveToAttackResolved(
                        combat
                    );


                await assert.rejects(
                    () =>
                        MeleeAttackWorkflowService
                            .updateAttackResult(
                                combat,
                                resolved.id,
                                null
                            ),
                    TypeError
                );

            }
        );

    }
);


test(
    "MeleeAttackWorkflowService.updateAttackResult : rejette une modification après finalisation",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const finalized =
                    await driveToAttackResolved(
                        combat,
                        {
                            finalize: true
                        }
                    );


                await assert.rejects(
                    () =>
                        MeleeAttackWorkflowService
                            .updateAttackResult(
                                combat,
                                finalized.id,
                                {
                                    successes: 9
                                }
                            ),
                    /déjà été finalisé/
                );

            }
        );

    }
);


/* ============================================================
 * finalizeAttack
 * ============================================================ */


test(
    "MeleeAttackWorkflowService.finalizeAttack : marque le résultat d'attaque comme finalisé",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const finalized =
                    await driveToAttackResolved(
                        combat,
                        {
                            finalize: true
                        }
                    );


                assert.equal(
                    finalized.isAttackFinalized,
                    true
                );

                assert.equal(
                    finalized.state,
                    MELEE_ATTACK_WORKFLOW_STATES
                        .ATTACK_RESOLVED
                );

            }
        );

    }
);


test(
    "MeleeAttackWorkflowService.finalizeAttack : signale un workflow introuvable",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                await assert.rejects(
                    () =>
                        MeleeAttackWorkflowService
                            .finalizeAttack(
                                combat,
                                "inconnu"
                            ),
                    /introuvable/
                );

            }
        );

    }
);


test(
    "MeleeAttackWorkflowService.finalizeAttack : est idempotent une fois déjà finalisé",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const finalized =
                    await driveToAttackResolved(
                        combat,
                        {
                            finalize: true
                        }
                    );


                const secondCall =
                    await MeleeAttackWorkflowService
                        .finalizeAttack(
                            combat,
                            finalized.id
                        );


                assert.equal(
                    secondCall.isAttackFinalized,
                    true
                );

            }
        );

    }
);


/* ============================================================
 * resolveStunts
 * ============================================================ */


test(
    "MeleeAttackWorkflowService.resolveStunts : persiste les éclats d'attaque après finalisation",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const finalized =
                    await driveToAttackResolved(
                        combat,
                        {
                            finalize: true
                        }
                    );


                const withStunts =
                    await MeleeAttackWorkflowService
                        .resolveStunts(
                            combat,
                            finalized.id,
                            {

                                available:
                                    1,

                                spent:
                                    1,

                                remaining:
                                    0,

                                selections: [],

                                effects: {

                                    vigorDamage:
                                        1,

                                    agilityDamage:
                                        0,

                                    swapInitiative:
                                        false,

                                    disarm:
                                        false,

                                    knockdown:
                                        false,

                                    grapple:
                                        false

                                }

                            }
                        );


                assert.equal(
                    withStunts.state,
                    MELEE_ATTACK_WORKFLOW_STATES
                        .STUNTS_RESOLVED
                );

                assert.equal(
                    withStunts.hasStuntResult,
                    true
                );

            }
        );

    }
);


test(
    "MeleeAttackWorkflowService.resolveStunts : exige un résultat d'éclats",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const finalized =
                    await driveToAttackResolved(
                        combat,
                        {
                            finalize: true
                        }
                    );


                await assert.rejects(
                    () =>
                        MeleeAttackWorkflowService
                            .resolveStunts(
                                combat,
                                finalized.id,
                                null
                            ),
                    TypeError
                );

            }
        );

    }
);


test(
    "MeleeAttackWorkflowService.resolveStunts : rejette une résolution avant finalisation de l'attaque",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const resolved =
                    await driveToAttackResolved(
                        combat
                    );


                await assert.rejects(
                    () =>
                        MeleeAttackWorkflowService
                            .resolveStunts(
                                combat,
                                resolved.id,
                                {
                                    available: 0,
                                    spent: 0,
                                    remaining: 0
                                }
                            ),
                    /finalisé/
                );

            }
        );

    }
);


/* ============================================================
 * resolveConsequences
 * ============================================================ */


test(
    "MeleeAttackWorkflowService.resolveConsequences : accepte une attaque finalisée sans éclats",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const withConsequences =
                    await driveToConsequencesResolved(
                        combat
                    );


                assert.equal(
                    withConsequences.state,
                    MELEE_ATTACK_WORKFLOW_STATES
                        .CONSEQUENCES_RESOLVED
                );

                assert.equal(
                    withConsequences
                        .hasConsequencesResult,
                    true
                );

            }
        );

    }
);


test(
    "MeleeAttackWorkflowService.resolveConsequences : exige un résultat de conséquences",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const finalized =
                    await driveToAttackResolved(
                        combat,
                        {
                            finalize: true
                        }
                    );


                await assert.rejects(
                    () =>
                        MeleeAttackWorkflowService
                            .resolveConsequences(
                                combat,
                                finalized.id,
                                null
                            ),
                    TypeError
                );

            }
        );

    }
);


test(
    "MeleeAttackWorkflowService.resolveConsequences : rejette une résolution hors des états autorisés",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const created =
                    await createDeclinedWorkflow(
                        combat
                    );


                await assert.rejects(
                    () =>
                        MeleeAttackWorkflowService
                            .resolveConsequences(
                                combat,
                                created.id,
                                minimalConsequenceResult()
                            ),
                    /état actuel/
                );

            }
        );

    }
);


/* ============================================================
 * resolveProtection
 * ============================================================ */


test(
    "MeleeAttackWorkflowService.resolveProtection : persiste le résultat lorsqu'une Protection est requise",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const withConsequences =
                    await driveToConsequencesResolved(
                        combat,
                        {
                            protectionRequired: true
                        }
                    );


                const withProtection =
                    await MeleeAttackWorkflowService
                        .resolveProtection(
                            combat,
                            withConsequences.id,
                            minimalProtectionResult()
                        );


                assert.equal(
                    withProtection.state,
                    MELEE_ATTACK_WORKFLOW_STATES
                        .PROTECTION_RESOLVED
                );

                assert.equal(
                    withProtection.hasProtectionResult,
                    true
                );

            }
        );

    }
);


test(
    "MeleeAttackWorkflowService.resolveProtection : rejette une Protection non requise",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const withConsequences =
                    await driveToConsequencesResolved(
                        combat,
                        {
                            protectionRequired: false
                        }
                    );


                await assert.rejects(
                    () =>
                        MeleeAttackWorkflowService
                            .resolveProtection(
                                combat,
                                withConsequences.id,
                                minimalProtectionResult()
                            ),
                    /aucun jet de Protection/
                );

            }
        );

    }
);


test(
    "MeleeAttackWorkflowService.resolveProtection : exige un résultat de Protection",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const withConsequences =
                    await driveToConsequencesResolved(
                        combat,
                        {
                            protectionRequired: true
                        }
                    );


                await assert.rejects(
                    () =>
                        MeleeAttackWorkflowService
                            .resolveProtection(
                                combat,
                                withConsequences.id,
                                null
                            ),
                    TypeError
                );

            }
        );

    }
);


/* ============================================================
 * resolveApplicationStep
 * ============================================================ */


test(
    "MeleeAttackWorkflowService.resolveApplicationStep : persiste une étape individuelle",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const withConsequences =
                    await driveToConsequencesResolved(
                        combat
                    );


                const afterStep =
                    await MeleeAttackWorkflowService
                        .resolveApplicationStep(
                            combat,
                            withConsequences.id,
                            MELEE_APPLICATION_STEP_KEYS
                                .VIGOR_DAMAGE,
                            minimalApplicationStepResult()
                        );


                assert.equal(
                    afterStep.hasApplicationStep(
                        MELEE_APPLICATION_STEP_KEYS
                            .VIGOR_DAMAGE
                    ),
                    true
                );

            }
        );

    }
);


test(
    "MeleeAttackWorkflowService.resolveApplicationStep : rejette une clé d'étape inconnue",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const withConsequences =
                    await driveToConsequencesResolved(
                        combat
                    );


                await assert.rejects(
                    () =>
                        MeleeAttackWorkflowService
                            .resolveApplicationStep(
                                combat,
                                withConsequences.id,
                                "etape-inconnue",
                                minimalApplicationStepResult()
                            ),
                    TypeError
                );

            }
        );

    }
);


test(
    "MeleeAttackWorkflowService.resolveApplicationStep : refuse de rejouer une étape déjà résolue",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const withConsequences =
                    await driveToConsequencesResolved(
                        combat
                    );


                await MeleeAttackWorkflowService
                    .resolveApplicationStep(
                        combat,
                        withConsequences.id,
                        MELEE_APPLICATION_STEP_KEYS
                            .VIGOR_DAMAGE,
                        minimalApplicationStepResult()
                    );


                await assert.rejects(
                    () =>
                        MeleeAttackWorkflowService
                            .resolveApplicationStep(
                                combat,
                                withConsequences.id,
                                MELEE_APPLICATION_STEP_KEYS
                                    .VIGOR_DAMAGE,
                                minimalApplicationStepResult()
                            ),
                    /déjà été résolue/
                );

            }
        );

    }
);


/* ============================================================
 * resolveApplication
 * ============================================================ */


test(
    "MeleeAttackWorkflowService.resolveApplication : persiste le résultat final une fois toutes les étapes traitées",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const allStepsResolved =
                    await driveToApplicationStepsResolved(
                        combat
                    );


                const applied =
                    await MeleeAttackWorkflowService
                        .resolveApplication(
                            combat,
                            allStepsResolved.id,
                            {
                                summary:
                                    "aucune mutation requise"
                            }
                        );


                assert.equal(
                    applied.hasApplicationResult,
                    true
                );

            }
        );

    }
);


test(
    "MeleeAttackWorkflowService.resolveApplication : refuse tant que toutes les étapes ne sont pas résolues",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const withConsequences =
                    await driveToConsequencesResolved(
                        combat
                    );


                await assert.rejects(
                    () =>
                        MeleeAttackWorkflowService
                            .resolveApplication(
                                combat,
                                withConsequences.id,
                                {
                                    summary: "trop tôt"
                                }
                            ),
                    /doivent être résolues/
                );

            }
        );

    }
);


test(
    "MeleeAttackWorkflowService.resolveApplication : exige un résultat d'application",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const allStepsResolved =
                    await driveToApplicationStepsResolved(
                        combat
                    );


                await assert.rejects(
                    () =>
                        MeleeAttackWorkflowService
                            .resolveApplication(
                                combat,
                                allStepsResolved.id,
                                null
                            ),
                    TypeError
                );

            }
        );

    }
);


/* ============================================================
 * complete
 * ============================================================ */


test(
    "MeleeAttackWorkflowService.complete : termine le workflow une fois l'application enregistrée",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const allStepsResolved =
                    await driveToApplicationStepsResolved(
                        combat
                    );


                await MeleeAttackWorkflowService
                    .resolveApplication(
                        combat,
                        allStepsResolved.id,
                        {
                            summary:
                                "terminé"
                        }
                    );


                const completed =
                    await MeleeAttackWorkflowService
                        .complete(
                            combat,
                            allStepsResolved.id
                        );


                assert.equal(
                    completed.state,
                    MELEE_ATTACK_WORKFLOW_STATES
                        .COMPLETED
                );

                assert.equal(
                    completed.isCompleted,
                    true
                );

            }
        );

    }
);


test(
    "MeleeAttackWorkflowService.complete : signale un workflow introuvable",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                await assert.rejects(
                    () =>
                        MeleeAttackWorkflowService
                            .complete(
                                combat,
                                "inconnu"
                            ),
                    /introuvable/
                );

            }
        );

    }
);


test(
    "MeleeAttackWorkflowService.complete : refuse de terminer avant l'application réelle des conséquences",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();


                const withConsequences =
                    await driveToConsequencesResolved(
                        combat
                    );


                await assert.rejects(
                    () =>
                        MeleeAttackWorkflowService
                            .complete(
                                combat,
                                withConsequences.id
                            ),
                    /application réelle des conséquences/
                );

            }
        );

    }
);
