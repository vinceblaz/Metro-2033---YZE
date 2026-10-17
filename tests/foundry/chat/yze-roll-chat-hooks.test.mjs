import test from "node:test";
import assert from "node:assert/strict";

import {
    finalizeYZERollMessage,
    resolveFinalizedRangedAttackMessage,
    resolveFinalizedYZERollMessage,
    resolveYZERollAttacker,
    resolveYZERollCombat,
    createRangedAttackChatRuntime,
    createFoundryRangedAttackChatRuntime,
    resolveYZERollTarget,
    createRangedAttackFinalizationDependencies,
    createFoundryRangedAttackFinalizationRuntime,
    resolveRangedAttackProtectionChoiceFromMessage,
    createFoundryRangedAttackChatDependencies,
    createFoundryRangedAttackProductionRuntime,
    resolveRangedAttackProtectionChoiceAction,
    bindRangedAttackProtectionChoice,
    bindRangedAttackProtectionChoiceOnRender,
    resolveRangedAttackDisarmChoiceFromMessage,
    resumeRangedAttackApplicationAfterProtectionChoice,
    rerenderRangedAttackChatMessage,
    resolveRangedAttackChatMessageHtml,
    bindRangedAttackChatMessageInteractions,
    createRangedAttackChatInteractionDependencies,
    createFoundryRangedAttackProductionRuntimeWithInteractions,
    createRegisteredRangedAttackRuntime,
    getRangedAttackDisarmChoices,
    resumeRangedAttackApplicationAfterDisarmChoice,
    bindRangedAttackDisarmChoice,
    applyReadyRangedAttackLedger,
    bindRangedAttackApplyChoice,
    registerYZERollChatHooks
} from "../../../src/foundry/chat/yze-roll-chat-hooks.mjs";



test(
    "un jet d'attaque à distance finalisé est transmis à la résolution des attaques à distance",
    async () => {

        const message = {
            id:
                "message-1"
        };


        let resolvedMessage =
            null;


        await resolveFinalizedYZERollMessage(
            message,
            {
                getStoredResult() {

                    return {
                        context: {
                            attack: {
                                type:
                                    "ranged"
                            }
                        }
                    };

                },

                resolveRangedAttack(
                    receivedMessage
                ) {

                    resolvedMessage =
                        receivedMessage;

                }
            }
        );


        assert.equal(
            resolvedMessage,
            message
        );

    }
);

test(
    "un jet qui n'est pas une attaque à distance n'est pas transmis à la résolution des attaques à distance",
    async () => {

        const message = {
            id:
                "message-1"
        };


        let resolutionCount =
            0;


        const result =
            await resolveFinalizedYZERollMessage(
                message,
                {
                    getStoredResult() {

                        return {
                            context: {
                                attack: {
                                    type:
                                        "melee"
                                }
                            }
                        };

                    },

                    resolveRangedAttack() {

                        resolutionCount +=
                            1;

                    }
                }
            );


        assert.equal(
            resolutionCount,
            0
        );


        assert.equal(
            result,
            null
        );

    }
);

test(
    "la finalisation du Chat précède la résolution du résultat finalisé",
    async () => {

        const message = {
            id:
                "message-1"
        };


        const calls =
            [];


        await finalizeYZERollMessage(
            message,
            {
                finalizeMessage(
                    receivedMessage
                ) {

                    assert.equal(
                        receivedMessage,
                        message
                    );

                    calls.push(
                        "finalize"
                    );

                },

                resolveFinalizedMessage(
                    receivedMessage
                ) {

                    assert.equal(
                        receivedMessage,
                        message
                    );

                    calls.push(
                        "resolve"
                    );

                }
            }
        );


        assert.deepEqual(
            calls,
            [
                "finalize",
                "resolve"
            ]
        );

    }
);

test(
    "un échec de finalisation empêche la résolution du résultat",
    async () => {

        const message = {
            id:
                "message-1"
        };


        let resolutionCount =
            0;


        await assert.rejects(
            () =>
                finalizeYZERollMessage(
                    message,
                    {
                        finalizeMessage() {

                            throw new Error(
                                "finalization-failed"
                            );

                        },

                        resolveFinalizedMessage() {

                            resolutionCount +=
                                1;

                        }
                    }
                ),
            /finalization-failed/
        );


        assert.equal(
            resolutionCount,
            0
        );

    }
);

test(
    "la résolution d'une attaque à distance finalisée retourne le résultat de la frontière ranged",
    async () => {

        const message = {
            id:
                "message-1"
        };


        const rangedResult = {
            hit:
                true
        };


        const result =
            await resolveFinalizedYZERollMessage(
                message,
                {
                    getStoredResult() {

                        return {
                            context: {
                                attack: {
                                    type:
                                        "ranged"
                                }
                            }
                        };

                    },

                    resolveRangedAttack(
                        receivedMessage
                    ) {

                        assert.equal(
                            receivedMessage,
                            message
                        );


                        return rangedResult;

                    }
                }
            );


        assert.equal(
            result,
            rangedResult
        );

    }
);

test(
    "resolveYZERollTarget retrouve la cible depuis son actorUuid",
    async () => {

        const target = {
            id: "target-1"
        };

        const result = {
            context: {
                target: {
                    actorUuid:
                        "Actor.target-1",

                    actorId:
                        "target-1"
                }
            }
        };


        let resolvedUuid = null;


        const resolvedTarget =
            await resolveYZERollTarget(
                result,
                {
                    resolveUuid:
                        async uuid => {

                            resolvedUuid =
                                uuid;

                            return target;

                        },

                    getActorById:
                        () => null
                }
            );


        assert.equal(
            resolvedUuid,
            "Actor.target-1"
        );

        assert.equal(
            resolvedTarget,
            target
        );

    }
);

test(
    "resolveYZERollAttacker retrouve l'attaquant depuis son actorId lorsque l'UUID ne résout rien",
    async () => {

        const attacker = {
            id:
                "attacker-1"
        };

        const result = {
            context: {
                actorUuid:
                    "Actor.attacker-1",

                actorId:
                    "attacker-1"
            }
        };


        let resolvedActorId =
            null;


        const resolvedAttacker =
            await resolveYZERollAttacker(
                result,
                {
                    resolveUuid:
                        async () => null,

                    getActorById:
                        actorId => {

                            resolvedActorId =
                                actorId;

                            return attacker;

                        }
                }
            );


        assert.equal(
            resolvedActorId,
            "attacker-1"
        );

        assert.equal(
            resolvedAttacker,
            attacker
        );

    }
);


test(
    "resolveYZERollAttacker ne consulte pas actorId lorsque actorUuid résout l'attaquant",
    async () => {

        const attacker = {
            id:
                "attacker-1"
        };

        const result = {
            context: {
                actorUuid:
                    "Actor.attacker-1",

                actorId:
                    "attacker-1"
            }
        };


        let actorIdLookupCount =
            0;


        const resolvedAttacker =
            await resolveYZERollAttacker(
                result,
                {
                    resolveUuid:
                        async () =>
                            attacker,

                    getActorById:
                        () => {

                            actorIdLookupCount +=
                                1;

                            return attacker;

                        }
                }
            );


        assert.equal(
            resolvedAttacker,
            attacker
        );

        assert.equal(
            actorIdLookupCount,
            0
        );

    }
);

test(
    "resolveYZERollTarget retrouve la cible depuis son actorId lorsque l'UUID ne résout rien",
    async () => {

        const target = {
            id: "target-1"
        };

        const result = {
            context: {
                target: {
                    actorUuid:
                        "Actor.target-1",

                    actorId:
                        "target-1"
                }
            }
        };


        let resolvedActorId = null;


        const resolvedTarget =
            await resolveYZERollTarget(
                result,
                {
                    resolveUuid:
                        async () => null,

                    getActorById:
                        actorId => {

                            resolvedActorId =
                                actorId;

                            return target;

                        }
                }
            );


        assert.equal(
            resolvedActorId,
            "target-1"
        );

        assert.equal(
            resolvedTarget,
            target
        );

    }
);

test(
    "resolveYZERollTarget ne consulte pas actorId lorsque actorUuid résout la cible",
    async () => {

        const target = {
            id: "target-1"
        };

        const result = {
            context: {
                target: {
                    actorUuid:
                        "Actor.target-1",

                    actorId:
                        "target-1"
                }
            }
        };


        let actorIdLookupCount = 0;


        const resolvedTarget =
            await resolveYZERollTarget(
                result,
                {
                    resolveUuid:
                        async () => target,

                    getActorById:
                        () => {

                            actorIdLookupCount += 1;

                            return target;

                        }
                }
            );


        assert.equal(
            resolvedTarget,
            target
        );

        assert.equal(
            actorIdLookupCount,
            0
        );

    }
);

test(
    "resolveYZERollAttacker retrouve l'attaquant depuis son actorUuid",
    async () => {

        const attacker = {
            id:
                "attacker-1"
        };

        const result = {
            context: {
                actorUuid:
                    "Actor.attacker-1",

                actorId:
                    "attacker-1"
            }
        };


        let resolvedUuid =
            null;


        const resolvedAttacker =
            await resolveYZERollAttacker(
                result,
                {
                    resolveUuid:
                        async uuid => {

                            resolvedUuid =
                                uuid;

                            return attacker;

                        },

                    getActorById:
                        () => null
                }
            );


        assert.equal(
            resolvedUuid,
            "Actor.attacker-1"
        );

        assert.equal(
            resolvedAttacker,
            attacker
        );

    }
);

test(
    "resolveFinalizedRangedAttackMessage lit le résultat final puis résout P5 avant la Protection avec la cible concrète",
    async () => {

        const {
            resolveFinalizedRangedAttackMessage
        } =
            await import(
                "../../../src/foundry/chat/yze-roll-chat-hooks.mjs"
            );


        const calls =
            [];


        const message = {
            id:
                "message-ranged"
        };


        const storedResult = {
            successes:
                1
        };


        const consequenceResult = {
            vigorDamage:
                2
        };


        const target = {
            id:
                "target-actor",

            items:
                []
        };


        const protectionResult = {
            absorbedDamage:
                1
        };


        const applicationPlan = {
            vigorDamage:
                1
        };


        const applicationLedger = {
            operations:
                []
        };


        const result =
            await resolveFinalizedRangedAttackMessage(
                message,
                {
                    getStoredResult:
                        currentMessage => {

                            calls.push(
                                "stored-result"
                            );


                            assert.equal(
                                currentMessage,
                                message
                            );


                            return storedResult;

                        },

                    resolveConsequences:
                        async (
                            currentMessage,
                            {
                                stuntAllocation
                            } = {}
                        ) => {

                            calls.push(
                                "consequences"
                            );


                            assert.equal(
                                currentMessage,
                                message
                            );


                            assert.deepEqual(
                                stuntAllocation,
                                {}
                            );


                            return consequenceResult;

                        },

                    resolveTarget:
                        async currentResult => {

                            calls.push(
                                "target"
                            );


                            assert.equal(
                                currentResult,
                                storedResult
                            );


                            return target;

                        },

                    resolveProtection:
                        async ({
                            consequenceResult:
                                currentConsequenceResult,

                            target:
                                currentTarget
                        }) => {

                            calls.push(
                                "protection"
                            );


                            assert.equal(
                                currentConsequenceResult,
                                consequenceResult
                            );


                            assert.equal(
                                currentTarget,
                                target
                            );


                            return protectionResult;

                        },

                    createApplicationPlan:
                        ({
                            consequenceResult:
                                currentConsequenceResult,

                            protectionResult:
                                currentProtectionResult
                        }) => {

                            assert.equal(
                                currentConsequenceResult,
                                consequenceResult
                            );


                            assert.equal(
                                currentProtectionResult,
                                protectionResult
                            );


                            return applicationPlan;

                        },

                    createApplicationLedger:
                        ({
                            applicationPlan:
                                currentApplicationPlan,

                            protectionResult:
                                currentProtectionResult
                        }) => {

                            assert.equal(
                                currentApplicationPlan,
                                applicationPlan
                            );


                            assert.equal(
                                currentProtectionResult,
                                protectionResult
                            );


                            return applicationLedger;

                        },

                    getBlockedOperations:
                        () =>
                            [],

                    resolveCombat:
                        () =>
                            null,

                    resolveAttacker:
                        async () =>
                            null,

                    validateInitiativeSwap:
                        () => {},

                    scheduleInitiativeSwap:
                        () => {},

                    applyApplicationLedger:
                        async () => {},

                    storeApplicationState:
                        async () => {},

                    renderStoredMessage:
                        async () => {}
                }
            );


        assert.deepEqual(
            calls,
            [
                "stored-result",
                "consequences",
                "target",
                "protection"
            ]
        );


        assert.equal(
            result.consequenceResult,
            consequenceResult
        );


        assert.equal(
            result.protectionResult,
            protectionResult
        );

    }
);

test(
    "resolveFinalizedRangedAttackMessage compose la reconstruction de cible avec la résolution de Protection",
    async () => {

        const message = {
            id: "message-1"
        };

        const target = {
            id: "target-1"
        };

        const consequenceResult = {
            hit: true
        };

        const protectionResult = {
            remainingDamage: 1
        };


        const result =
            await resolveFinalizedRangedAttackMessage(
                message,
                {
                    resolveConsequences:
                        () =>
                            consequenceResult,

                    getStoredResult:
                        () => ({
                            context: {
                                target: {
                                    actorUuid:
                                        "Actor.target-1",

                                    actorId:
                                        "target-1"
                                }
                            }
                        }),

                    resolveTarget:
                        storedResult =>
                            resolveYZERollTarget(
                                storedResult,
                                {
                                    resolveUuid:
                                        async uuid => {

                                            assert.equal(
                                                uuid,
                                                "Actor.target-1"
                                            );

                                            return target;

                                        },

                                    getActorById:
                                        () => null
                                }
                            ),

                    resolveProtection:
                        ({
                            consequenceResult:
                                currentConsequenceResult,
                            target:
                                currentTarget
                        }) => {

                            assert.equal(
                                currentConsequenceResult,
                                consequenceResult
                            );

                            assert.equal(
                                currentTarget,
                                target
                            );

                            return protectionResult;

                        },

                    createApplicationPlan:
                        () => ({}),

                    createApplicationLedger:
                        () => ({}),

                    getBlockedOperations:
                        () => [],

                    resolveCombat:
                        () => null,

                    resolveAttacker:
                        async () => ({
                            id:
                                "attacker-1"
                        }),

                    applyApplicationLedger:
                        async () => {},

                    storeApplicationState:
                        async () => {},

                    renderStoredMessage:
                        async () => {}
                }
            );


        assert.deepEqual(
            result,
            {
                consequenceResult,
                protectionResult,
                applicationPlan: {},
                applicationLedger: {},
                blockedOperations: []
            }
        );

    }
);

test(
    "resolveFinalizedRangedAttackMessage construit le plan d'application après la Protection",
    async () => {

        const message = {
            id: "message-1"
        };

        const target = {
            id: "target-1"
        };

        const consequenceResult = {
            hit: true
        };

        const protectionResult = {
            remainingDamage: 2,
            protectionDamage: 1
        };

        const applicationPlan = {
            damage: {
                vigor: 2
            },

            protection: {
                damage: 1
            }
        };


        let receivedConsequenceResult =
            null;

        let receivedProtectionResult =
            null;


        const result =
            await resolveFinalizedRangedAttackMessage(
                message,
                {
                    resolveConsequences:
                        () =>
                            consequenceResult,

                    getStoredResult:
                        () => ({
                            context: {
                                target: {
                                    actorUuid:
                                        "Actor.target-1"
                                }
                            }
                        }),

                    resolveTarget:
                        async () =>
                            target,

                    resolveProtection:
                        () =>
                            protectionResult,

                    createApplicationPlan:
                        ({
                            consequenceResult:
                                currentConsequenceResult,
                            protectionResult:
                                currentProtectionResult
                        }) => {

                            receivedConsequenceResult =
                                currentConsequenceResult;

                            receivedProtectionResult =
                                currentProtectionResult;

                            return applicationPlan;

                        },

                    createApplicationLedger:
                        () => ({}),

                    getBlockedOperations:
                        () => [],

                    resolveCombat:
                        () => null,

                    resolveAttacker:
                        async () => ({
                            id:
                                "attacker-1"
                        }),

                    applyApplicationLedger:
                        async () => {},

                    storeApplicationState:
                        async () => {},

                    renderStoredMessage:
                        async () => {}
                }
            );


        assert.equal(
            receivedConsequenceResult,
            consequenceResult
        );

        assert.equal(
            receivedProtectionResult,
            protectionResult
        );

        assert.deepEqual(
            result,
            {
                consequenceResult,
                protectionResult,
                applicationPlan,
                applicationLedger: {},
                blockedOperations: []
            }
        );

    }
);

test(
    "resolveFinalizedRangedAttackMessage construit le ledger après le plan d'application",
    async () => {

        const message = {
            id: "message-1"
        };

        const target = {
            id: "target-1"
        };

        const consequenceResult = {
            hit: true
        };

        const protectionResult = {
            remainingDamage: 2,
            protectionDamage: 1
        };

        const applicationPlan = {
            damage: {
                vigor: 2
            }
        };

        const applicationLedger = {
            operations: [
                {
                    type:
                        "attribute-damage",

                    attribute:
                        "vigor",

                    amount:
                        2,

                    status:
                        "pending"
                }
            ]
        };


        let receivedApplicationPlan =
            null;

        let receivedProtectionResult =
            null;


        const result =
            await resolveFinalizedRangedAttackMessage(
                message,
                {
                    resolveConsequences:
                        () =>
                            consequenceResult,

                    getStoredResult:
                        () => ({
                            context: {
                                target: {
                                    actorUuid:
                                        "Actor.target-1"
                                }
                            }
                        }),

                    resolveTarget:
                        async () =>
                            target,

                    resolveProtection:
                        () =>
                            protectionResult,

                    createApplicationPlan:
                        () =>
                            applicationPlan,

                    createApplicationLedger:
                        ({
                            applicationPlan:
                                currentApplicationPlan,
                            protectionResult:
                                currentProtectionResult
                        }) => {

                            receivedApplicationPlan =
                                currentApplicationPlan;

                            receivedProtectionResult =
                                currentProtectionResult;

                            return applicationLedger;

                        },

                    getBlockedOperations:
                        () => [],

                    resolveCombat:
                        () => null,

                    resolveAttacker:
                        async () => ({
                            id:
                                "attacker-1"
                        }),

                    applyApplicationLedger:
                        async () => {},

                    storeApplicationState:
                        async () => {},

                    renderStoredMessage:
                        async () => {}
                }
            );


        assert.equal(
            receivedApplicationPlan,
            applicationPlan
        );

        assert.equal(
            receivedProtectionResult,
            protectionResult
        );

        assert.deepEqual(
            result,
            {
                consequenceResult,
                protectionResult,
                applicationPlan,
                applicationLedger,
                blockedOperations: []
            }
        );

    }
);

test(
    "resolveFinalizedRangedAttackMessage persiste un checkpoint blocked lorsque le ledger contient des opérations bloquées",
    async () => {

        const message = {
            id:
                "message-1"
        };


        const consequenceResult = {
            remainingDamage:
                2
        };


        const storedResult = {
            context: {
                actorId:
                    "attacker-1",

                target: {
                    actorId:
                        "target-1"
                }
            }
        };


        const target = {
            id:
                "target-1"
        };


        const protectionResult = {
            absorbed:
                1
        };


        const applicationPlan = {
            attributeDamage:
                2
        };


        const applicationLedger = {
            operations: [
                {
                    type:
                        "attribute-damage",

                    attribute:
                        "vigor",

                    amount:
                        2,

                    status:
                        "pending"
                },

                {
                    type:
                        "disarm",

                    status:
                        "blocked"
                }
            ]
        };


        const blockedOperations = [
            applicationLedger.operations[1]
        ];


        let resolveCombatCount =
            0;

        let applicationCount =
            0;

        let storedApplicationState =
            null;

        let storeApplicationStateCount =
            0;

        let renderStoredMessageCount =
            0;

        let renderedMessage =
            null;


        const calls =
            [];


        const result =
            await resolveFinalizedRangedAttackMessage(
                message,
                {
                    resolveConsequences:
                        async currentMessage => {

                            assert.equal(
                                currentMessage,
                                message
                            );


                            return consequenceResult;

                        },

                    getStoredResult:
                        currentMessage => {

                            assert.equal(
                                currentMessage,
                                message
                            );


                            return storedResult;

                        },

                    resolveTarget:
                        async currentResult => {

                            assert.equal(
                                currentResult,
                                storedResult
                            );


                            return target;

                        },

                    resolveProtection:
                        async ({
                            consequenceResult:
                                currentConsequenceResult,
                            target:
                                currentTarget
                        }) => {

                            assert.equal(
                                currentConsequenceResult,
                                consequenceResult
                            );

                            assert.equal(
                                currentTarget,
                                target
                            );


                            return protectionResult;

                        },

                    createApplicationPlan:
                        ({
                            consequenceResult:
                                currentConsequenceResult,
                            protectionResult:
                                currentProtectionResult
                        }) => {

                            assert.equal(
                                currentConsequenceResult,
                                consequenceResult
                            );

                            assert.equal(
                                currentProtectionResult,
                                protectionResult
                            );


                            return applicationPlan;

                        },

                    createApplicationLedger:
                        ({
                            applicationPlan:
                                currentApplicationPlan,
                            protectionResult:
                                currentProtectionResult
                        }) => {

                            assert.equal(
                                currentApplicationPlan,
                                applicationPlan
                            );

                            assert.equal(
                                currentProtectionResult,
                                protectionResult
                            );


                            return applicationLedger;

                        },

                    getBlockedOperations:
                        ({
                            ledger
                        }) => {

                            assert.equal(
                                ledger,
                                applicationLedger
                            );


                            return blockedOperations;

                        },

                    storeApplicationState:
                        async (
                            currentMessage,
                            applicationState
                        ) => {

                            calls.push(
                                "store"
                            );


                            storeApplicationStateCount +=
                                1;


                            assert.equal(
                                currentMessage,
                                message
                            );


                            storedApplicationState =
                                applicationState;

                        },

                    renderStoredMessage:
                        async currentMessage => {

                            calls.push(
                                "render"
                            );


                            renderStoredMessageCount +=
                                1;


                            renderedMessage =
                                currentMessage;


                            return "<div>blocked ranged application</div>";

                        },

                    resolveCombat:
                        () => {

                            resolveCombatCount +=
                                1;


                            return {
                                id:
                                    "combat-1"
                            };

                        },

                    resolveAttacker:
                        async () => ({
                            id:
                                "attacker-1"
                        }),

                    validateInitiativeSwap:
                        () => null,

                    scheduleInitiativeSwap:
                        async () => null,

                    applyApplicationLedger:
                        async () => {

                            applicationCount +=
                                1;

                        }
                }
            );


        assert.equal(
            resolveCombatCount,
            0
        );

        assert.equal(
            applicationCount,
            0
        );


        assert.equal(
            storeApplicationStateCount,
            1
        );

        assert.deepEqual(
            storedApplicationState,
            {
                status:
                    "blocked",

                protectionResult,

                applicationLedger,

                blockedOperations
            }
        );


        assert.equal(
            renderStoredMessageCount,
            1
        );

        assert.equal(
            renderedMessage,
            message
        );


        assert.deepEqual(
            calls,
            [
                "store",
                "render"
            ]
        );


        assert.deepEqual(
            result,
            {
                consequenceResult,
                protectionResult,
                applicationPlan,
                applicationLedger,
                blockedOperations
            }
        );

    }
);

test(
    "resolveFinalizedRangedAttackMessage transmet à P6 un ledger sans opération bloquée",
    async () => {

        const message = {
            id: "message-1"
        };

        const target = {
            id: "target-1"
        };

        const combat = {
            id: "combat-1"
        };

        const consequenceResult = {
            hit: true
        };

        const protectionResult = {
            remainingDamage: 2,
            protectionDamage: 0
        };

        const applicationPlan = {
            damage: {
                vigor: 2
            }
        };

        const applicationLedger = {
            operations: [
                {
                    type:
                        "attribute-damage",

                    attribute:
                        "vigor",

                    amount:
                        2,

                    status:
                        "pending"
                }
            ]
        };


        let receivedStoredMessage =
            null;

        let receivedStoredState =
            null;

        let renderStoredMessageCalled =
            false;

        let applyApplicationLedgerCalled =
            false;


        const result =
            await resolveFinalizedRangedAttackMessage(
                message,
                {
                    resolveConsequences:
                        () =>
                            consequenceResult,

                    getStoredResult:
                        () => ({
                            context: {
                                target: {
                                    actorUuid:
                                        "Actor.target-1"
                                },

                                combatId:
                                    "combat-1"
                            }
                        }),

                    resolveTarget:
                        async () =>
                            target,

                    resolveProtection:
                        () =>
                            protectionResult,

                    createApplicationPlan:
                        () =>
                            applicationPlan,

                    createApplicationLedger:
                        () =>
                            applicationLedger,

                    getBlockedOperations:
                        () => [],

                    resolveCombat:
                        () =>
                            combat,

                    resolveAttacker:
                        async () => ({
                            id:
                                "attacker-1"
                        }),

                    applyApplicationLedger:
                        async () => {

                            applyApplicationLedgerCalled =
                                true;

                        },

                    storeApplicationState:
                        async (
                            storedMessage,
                            state
                        ) => {

                            receivedStoredMessage =
                                storedMessage;

                            receivedStoredState =
                                state;

                        },

                    renderStoredMessage:
                        async () => {

                            renderStoredMessageCalled =
                                true;

                        }
                }
            );


        assert.equal(
            applyApplicationLedgerCalled,
            false
        );

        assert.equal(
            receivedStoredMessage,
            message
        );

        assert.deepEqual(
            receivedStoredState,
            {
                status: "ready",
                protectionResult,
                applicationLedger,
                blockedOperations: []
            }
        );

        assert.equal(
            renderStoredMessageCalled,
            true
        );

        assert.deepEqual(
            result,
            {
                consequenceResult,
                protectionResult,
                applicationPlan,
                applicationLedger,
                blockedOperations: []
            }
        );

    }
);

test(
    "resolveFinalizedRangedAttackMessage ne transmet pas à P6 un ledger contenant des opérations bloquées",
    async () => {

        const message = {
            id: "message-1"
        };

        const target = {
            id: "target-1"
        };

        const consequenceResult = {
            hit: true
        };

        const protectionResult = {
            remainingDamage: 2,
            protectionDamage: 0
        };

        const applicationPlan = {
            damage: {
                vigor: 2
            }
        };

        const applicationLedger = {
            operations: [
                {
                    type:
                        "disarm",

                    status:
                        "blocked"
                }
            ]
        };

        const blockedOperations = [
            applicationLedger.operations[0]
        ];


        let applicationCount =
            0;


        const result =
            await resolveFinalizedRangedAttackMessage(
                message,
                {
                    resolveConsequences:
                        () =>
                            consequenceResult,

                    getStoredResult:
                        () => ({
                            context: {
                                target: {
                                    actorUuid:
                                        "Actor.target-1"
                                }
                            }
                        }),

                    resolveTarget:
                        async () =>
                            target,

                    resolveProtection:
                        () =>
                            protectionResult,

                    createApplicationPlan:
                        () =>
                            applicationPlan,

                    createApplicationLedger:
                        () =>
                            applicationLedger,

                    getBlockedOperations:
                        () =>
                            blockedOperations,

                    storeApplicationState:
                        async () => {},

                    renderStoredMessage:
                        async () => {},

                    applyApplicationLedger:
                        async () => {

                            applicationCount +=
                                1;

                        }
                }
            );


        assert.equal(
            applicationCount,
            0
        );


        assert.deepEqual(
            result,
            {
                consequenceResult,
                protectionResult,
                applicationPlan,
                applicationLedger,
                blockedOperations
            }
        );

    }
);


test(
    "resumeRangedAttackApplicationAfterProtectionChoice résout la Protection et renvoie le ledger débloqué sans l'appliquer",
    async () => {

        const target = {
            id:
                "target-1"
        };

        const attacker = {
            id:
                "attacker-1"
        };

        const combat = {
            id:
                "combat-1"
        };


        const protectionResult = {
            source: {
                type:
                    "worn",

                bodyArmor: {
                    itemId:
                        "armor-1"
                },

                helmet: {
                    itemId:
                        "helmet-1"
                }
            }
        };


        const applicationLedger = {
            operations: [
                {
                    type:
                        "attribute-damage",

                    attribute:
                        "vigor",

                    amount:
                        2,

                    status:
                        "pending"
                },

                {
                    type:
                        "protection-damage",

                    amount:
                        1,

                    target:
                        null,

                    choices: [
                        "body",
                        "helmet"
                    ],

                    status:
                        "blocked"
                }
            ]
        };


        const resolvedLedger = {
            operations: [
                applicationLedger.operations[0],

                {
                    type:
                        "protection-damage",

                    amount:
                        1,

                    target:
                        "helmet",

                    itemId:
                        "helmet-1",

                    status:
                        "pending"
                }
            ]
        };


        let receivedChoiceLedger =
            null;

        let receivedProtectionResult =
            null;

        let receivedProtectionTarget =
            null;

        let receivedApplicationLedger =
            null;

        let applicationCount =
            0;


        const result =
            await resumeRangedAttackApplicationAfterProtectionChoice(
                {
                    protectionResult,
                    applicationLedger
                },
                {
                    protectionTarget:
                        "helmet",

                    target,

                    combat,

                    attacker,

                    resolveProtectionChoice:
                        ({
                            ledger,
                            protectionResult:
                                currentProtectionResult,
                            target:
                                protectionTarget
                        }) => {

                            receivedChoiceLedger =
                                ledger;

                            receivedProtectionResult =
                                currentProtectionResult;

                            receivedProtectionTarget =
                                protectionTarget;


                            return resolvedLedger;

                        },

                    getBlockedOperations:
                        () => [],

                    applyApplicationLedger:
                        async ({
                            ledger
                        }) => {

                            applicationCount +=
                                1;

                            receivedApplicationLedger =
                                ledger;

                        }
                }
            );


        assert.equal(
            receivedChoiceLedger,
            applicationLedger
        );

        assert.equal(
            receivedProtectionResult,
            protectionResult
        );

        assert.equal(
            receivedProtectionTarget,
            "helmet"
        );

        assert.equal(
            applicationCount,
            0
        );

        assert.equal(
            receivedApplicationLedger,
            null
        );

        assert.deepEqual(
            result,
            {
                applicationLedger:
                    resolvedLedger,

                blockedOperations:
                    []
            }
        );

    }
);

test(
    "resumeRangedAttackApplicationAfterProtectionChoice n'appelle pas P6 si une autre opération reste bloquée",
    async () => {

        const applicationLedger = {
            operations: [
                {
                    type:
                        "protection-damage",

                    amount:
                        1,

                    target:
                        null,

                    choices: [
                        "body",
                        "helmet"
                    ],

                    status:
                        "blocked"
                },

                {
                    type:
                        "disarm",

                    status:
                        "blocked"
                }
            ]
        };


        const resolvedLedger = {
            operations: [
                {
                    type:
                        "protection-damage",

                    amount:
                        1,

                    target:
                        "body",

                    itemId:
                        "armor-1",

                    status:
                        "pending"
                },

                applicationLedger.operations[1]
            ]
        };


        const remainingBlockedOperations = [
            resolvedLedger.operations[1]
        ];


        let applicationCount =
            0;


        const result =
            await resumeRangedAttackApplicationAfterProtectionChoice(
                {
                    protectionResult: {
                        source: {
                            type:
                                "worn",

                            bodyArmor: {
                                itemId:
                                    "armor-1"
                            },

                            helmet: {
                                itemId:
                                    "helmet-1"
                            }
                        }
                    },

                    applicationLedger
                },
                {
                    protectionTarget:
                        "body",

                    target: {
                        id:
                            "target-1"
                    },

                    combat: {
                        id:
                            "combat-1"
                    },

                    attacker: {
                        id:
                            "attacker-1"
                    },

                    resolveProtectionChoice:
                        () =>
                            resolvedLedger,

                    getBlockedOperations:
                        ({
                            ledger
                        }) => {

                            assert.equal(
                                ledger,
                                resolvedLedger
                            );


                            return remainingBlockedOperations;

                        },

                    applyApplicationLedger:
                        async () => {

                            applicationCount +=
                                1;

                        }
                }
            );


        assert.equal(
            applicationCount,
            0
        );


        assert.deepEqual(
            result,
            {
                applicationLedger:
                    resolvedLedger,

                blockedOperations:
                    remainingBlockedOperations
            }
        );

    }
);

test(
    "resumeRangedAttackApplicationAfterDisarmChoice résout le Désarmement et renvoie le ledger débloqué sans l'appliquer",
    async () => {

        const applicationLedger = {
            operations: [
                {
                    type:
                        "disarm",

                    choices: [
                        {
                            itemId:
                                "weapon-1",

                            name:
                                "Kalachnikov"
                        }
                    ],

                    status:
                        "blocked"
                }
            ]
        };


        const resolvedLedger = {
            operations: [
                {
                    type:
                        "disarm",

                    itemId:
                        "weapon-1",

                    status:
                        "pending"
                }
            ]
        };


        const target = {
            id:
                "target-1"
        };


        const combat = {
            id:
                "combat-1"
        };


        const attacker = {
            id:
                "attacker-1"
        };


        const calls =
            [];


        const result =
            await resumeRangedAttackApplicationAfterDisarmChoice(
                {
                    applicationLedger
                },
                {
                    itemId:
                        "weapon-1",

                    target,

                    combat,

                    attacker,

                    resolveDisarmChoice:
                        ({
                            ledger,
                            itemId
                        }) => {

                            calls.push([
                                "resolveDisarmChoice",
                                ledger,
                                itemId
                            ]);


                            return resolvedLedger;

                        },

                    getBlockedOperations:
                        ({
                            ledger
                        }) => {

                            calls.push([
                                "getBlockedOperations",
                                ledger
                            ]);


                            return [];

                        },

                    applyApplicationLedger:
                        async ({
                            ledger,
                            actor,
                            combat:
                                receivedCombat,
                            attacker:
                                receivedAttacker,
                            validateInitiativeSwap,
                            scheduleInitiativeSwap
                        }) => {

                            calls.push([
                                "applyApplicationLedger",
                                ledger,
                                actor,
                                receivedCombat,
                                receivedAttacker,
                                validateInitiativeSwap,
                                scheduleInitiativeSwap
                            ]);

                        },

                    validateInitiativeSwap:
                        "validate-initiative-swap",

                    scheduleInitiativeSwap:
                        "schedule-initiative-swap"
                }
            );


        assert.deepEqual(
            calls,
            [
                [
                    "resolveDisarmChoice",
                    applicationLedger,
                    "weapon-1"
                ],

                [
                    "getBlockedOperations",
                    resolvedLedger
                ]
            ]
        );


        assert.deepEqual(
            result,
            {
                applicationLedger:
                    resolvedLedger,

                blockedOperations:
                    []
            }
        );

    }
);

test(
    "resumeRangedAttackApplicationAfterDisarmChoice n'appelle pas P6 si une autre opération reste bloquée",
    async () => {

        const applicationLedger = {
            operations: [
                {
                    type:
                        "protection-damage",

                    amount:
                        1,

                    target:
                        null,

                    choices: [
                        "body",
                        "helmet"
                    ],

                    status:
                        "blocked"
                },

                {
                    type:
                        "disarm",

                    choices: [
                        {
                            itemId:
                                "weapon-1",

                            name:
                                "Kalachnikov"
                        }
                    ],

                    status:
                        "blocked"
                }
            ]
        };


        const resolvedLedger = {
            operations: [
                {
                    type:
                        "protection-damage",

                    amount:
                        1,

                    target:
                        null,

                    choices: [
                        "body",
                        "helmet"
                    ],

                    status:
                        "blocked"
                },

                {
                    type:
                        "disarm",

                    itemId:
                        "weapon-1",

                    status:
                        "pending"
                }
            ]
        };


        const blockedProtectionOperation =
            resolvedLedger.operations[0];


        let applyCallCount =
            0;


        const result =
            await resumeRangedAttackApplicationAfterDisarmChoice(
                {
                    applicationLedger
                },
                {
                    itemId:
                        "weapon-1",

                    target: {
                        id:
                            "target-1"
                    },

                    combat: {
                        id:
                            "combat-1"
                    },

                    attacker: {
                        id:
                            "attacker-1"
                    },

                    resolveDisarmChoice:
                        ({
                            ledger,
                            itemId
                        }) => {

                            assert.equal(
                                ledger,
                                applicationLedger
                            );


                            assert.equal(
                                itemId,
                                "weapon-1"
                            );


                            return resolvedLedger;

                        },

                    getBlockedOperations:
                        ({
                            ledger
                        }) => {

                            assert.equal(
                                ledger,
                                resolvedLedger
                            );


                            return [
                                blockedProtectionOperation
                            ];

                        },

                    applyApplicationLedger:
                        async () => {

                            applyCallCount +=
                                1;

                        },

                    validateInitiativeSwap:
                        () => {},

                    scheduleInitiativeSwap:
                        () => {}
                }
            );


        assert.equal(
            applyCallCount,
            0
        );


        assert.deepEqual(
            result,
            {
                applicationLedger:
                    resolvedLedger,

                blockedOperations: [
                    blockedProtectionOperation
                ]
            }
        );

    }
);


test(
    "resolveYZERollCombat retrouve le Combat depuis le combatId du résultat",
    () => {

        const combat = {
            id: "combat-1"
        };

        let receivedCombatId =
            null;


        const result = {
            context: {
                combatId:
                    "combat-1"
            }
        };


        const resolved =
            resolveYZERollCombat(
                result,
                {
                    getCombatById:
                        (combatId) => {

                            receivedCombatId =
                                combatId;

                            return combat;

                        }
                }
            );


        assert.equal(
            receivedCombatId,
            "combat-1"
        );

        assert.equal(
            resolved,
            combat
        );

    }
);

test(
    "resolveYZERollCombat retourne null lorsque le résultat ne référence aucun Combat",
    () => {

        let lookupCount =
            0;


        const result = {
            context: {}
        };


        const resolved =
            resolveYZERollCombat(
                result,
                {
                    getCombatById:
                        () => {

                            lookupCount += 1;

                            return {
                                id: "combat-1"
                            };

                        }
                }
            );


        assert.equal(
            resolved,
            null
        );

        assert.equal(
            lookupCount,
            0
        );

    }
);

/*
 * Harmonisation UX du Tir (Bible v0.9.3 §163, décision D2) :
 * resolveFinalizedRangedAttackMessage ne transmet plus jamais
 * le Combat/l'attaquant reconstruits à P6 (applyApplicationLedger) —
 * ce câblage a été déplacé vers applyReadyRangedAttackLedger,
 * seul point d'application désormais. Les anciens tests
 * "transmet à P6 le Combat reconstruit" et "transmet à P6
 * l'attaquant reconstruit" sont donc obsolètes et remplacés par
 * la couverture dédiée à applyReadyRangedAttackLedger.
 */

test(
    "createRangedAttackChatRuntime reconstruit l'attaquant avec les dépendances Foundry",
    async () => {

        const attacker = {
            id:
                "attacker-1"
        };


        let receivedUuid =
            null;

        let actorIdLookupCount =
            0;


        const runtime =
            createRangedAttackChatRuntime({
                resolveUuid:
                    async uuid => {

                        receivedUuid =
                            uuid;

                        return attacker;

                    },

                getActorById:
                    () => {

                        actorIdLookupCount +=
                            1;

                        return null;

                    },

                getCombatById:
                    () => null
            });


        const resolvedAttacker =
            await runtime.resolveAttacker({
                context: {
                    actorUuid:
                        "Actor.attacker-1",

                    actorId:
                        "attacker-1"
                }
            });


        assert.equal(
            receivedUuid,
            "Actor.attacker-1"
        );

        assert.equal(
            actorIdLookupCount,
            0
        );

        assert.equal(
            resolvedAttacker,
            attacker
        );

    }
);

test(
    "createRangedAttackChatRuntime reconstruit la cible avec les dépendances Foundry",
    async () => {

        const target = {
            id:
                "target-1"
        };


        let receivedUuid =
            null;

        let actorIdLookupCount =
            0;


        const runtime =
            createRangedAttackChatRuntime({
                resolveUuid:
                    async uuid => {

                        receivedUuid =
                            uuid;

                        return target;

                    },

                getActorById:
                    () => {

                        actorIdLookupCount +=
                            1;

                        return null;

                    },

                getCombatById:
                    () => null
            });


        const resolvedTarget =
            await runtime.resolveTarget({
                context: {
                    target: {
                        actorUuid:
                            "Actor.target-1",

                        actorId:
                            "target-1"
                    }
                }
            });


        assert.equal(
            receivedUuid,
            "Actor.target-1"
        );

        assert.equal(
            actorIdLookupCount,
            0
        );

        assert.equal(
            resolvedTarget,
            target
        );

    }
);


test(
    "createRangedAttackChatRuntime reconstruit le Combat avec les dépendances Foundry",
    () => {

        const combat = {
            id:
                "combat-1"
        };


        let receivedCombatId =
            null;


        const runtime =
            createRangedAttackChatRuntime({
                resolveUuid:
                    async () => null,

                getActorById:
                    () => null,

                getCombatById:
                    combatId => {

                        receivedCombatId =
                            combatId;

                        return combat;

                    }
            });


        const resolvedCombat =
            runtime.resolveCombat({
                context: {
                    combatId:
                        "combat-1"
                }
            });


        assert.equal(
            receivedCombatId,
            "combat-1"
        );

        assert.equal(
            resolvedCombat,
            combat
        );

    }
);

/*
 * Idem : resolveFinalizedRangedAttackMessage ne transmet plus les
 * capacités d'échange d'initiative à P6 (application désormais
 * différée à applyReadyRangedAttackLedger). Test obsolète retiré,
 * remplacé par la couverture dédiée à applyReadyRangedAttackLedger.
 */

test(
    "createRangedAttackChatRuntime expose les capacités concrètes d'échange d'initiative",
    async () => {

        const combat = {
            id:
                "combat-1"
        };

        const attacker = {
            id:
                "attacker-1"
        };

        const target = {
            id:
                "target-1"
        };


        const validationResult = {
            valid:
                true
        };

        const schedulingResult = {
            scheduled:
                true
        };


        let receivedValidation =
            null;

        let receivedScheduling =
            null;


        const runtime =
            createRangedAttackChatRuntime({
                resolveUuid:
                    async () => null,

                getActorById:
                    () => null,

                getCombatById:
                    () => null,

                validateInitiativeSwap:
                    (
                        receivedCombat,
                        receivedAttacker,
                        receivedTarget
                    ) => {

                        receivedValidation = {
                            combat:
                                receivedCombat,

                            attacker:
                                receivedAttacker,

                            target:
                                receivedTarget
                        };


                        return validationResult;

                    },

                scheduleInitiativeSwap:
                    async (
                        receivedCombat,
                        receivedAttacker,
                        receivedTarget
                    ) => {

                        receivedScheduling = {
                            combat:
                                receivedCombat,

                            attacker:
                                receivedAttacker,

                            target:
                                receivedTarget
                        };


                        return schedulingResult;

                    }
            });


        const actualValidationResult =
            runtime.validateInitiativeSwap(
                combat,
                attacker,
                target
            );


        const actualSchedulingResult =
            await runtime.scheduleInitiativeSwap(
                combat,
                attacker,
                target
            );


        assert.deepEqual(
            receivedValidation,
            {
                combat,
                attacker,
                target
            }
        );

        assert.equal(
            actualValidationResult,
            validationResult
        );


        assert.deepEqual(
            receivedScheduling,
            {
                combat,
                attacker,
                target
            }
        );

        assert.equal(
            actualSchedulingResult,
            schedulingResult
        );

    }
);

test(
    "createRangedAttackChatRuntime expose la résolution métier du choix de Protection",
    () => {

        const runtime =
            createRangedAttackChatRuntime({
                resolveUuid:
                    async () => null,

                getActorById:
                    () => null,

                getCombatById:
                    () => null,

                validateInitiativeSwap:
                    () => null,

                scheduleInitiativeSwap:
                    async () => null
            });


        assert.equal(
            typeof runtime.resolveProtectionChoice,
            "function"
        );

    }
);

test(
    "createRangedAttackChatRuntime expose la persistance de l'état d'application ranged",
    async () => {

        const message = {
            id:
                "message-1"
        };


        const applicationState = {
            protectionResult: {
                absorbed:
                    1
            },

            applicationLedger: {
                operations: [
                    {
                        type:
                            "disarm",

                        status:
                            "blocked"
                    }
                ]
            },

            blockedOperations: [
                {
                    type:
                        "disarm",

                    status:
                        "blocked"
                }
            ]
        };


        let receivedMessage =
            null;

        let receivedApplicationState =
            null;


        const storedMessage = {
            id:
                "stored-message-1"
        };


        const runtime =
            createRangedAttackChatRuntime({
                resolveUuid:
                    async () => null,

                getActorById:
                    () => null,

                getCombatById:
                    () => null,

                validateInitiativeSwap:
                    () => null,

                scheduleInitiativeSwap:
                    async () => null,

                storeApplicationState:
                    async (
                        currentMessage,
                        currentApplicationState
                    ) => {

                        receivedMessage =
                            currentMessage;

                        receivedApplicationState =
                            currentApplicationState;


                        return storedMessage;

                    }
            });


        assert.equal(
            typeof runtime.storeApplicationState,
            "function"
        );


        const result =
            await runtime.storeApplicationState(
                message,
                applicationState
            );


        assert.equal(
            receivedMessage,
            message
        );

        assert.equal(
            receivedApplicationState,
            applicationState
        );

        assert.equal(
            result,
            storedMessage
        );

    }
);

test(
    "createRangedAttackChatRuntime expose le rerendu de l'état d'application ranged",
    async () => {

        const message = {
            id:
                "message-1"
        };


        let receivedMessage =
            null;


        const rerenderedMessage = {
            id:
                "rerendered-message-1"
        };


        const runtime =
            createRangedAttackChatRuntime({
                resolveUuid:
                    async () => null,

                getActorById:
                    () => null,

                getCombatById:
                    () => null,

                validateInitiativeSwap:
                    () => null,

                scheduleInitiativeSwap:
                    async () => null,

                storeApplicationState:
                    async () => null,

                rerenderStoredMessage:
                    async currentMessage => {

                        receivedMessage =
                            currentMessage;


                        return rerenderedMessage;

                    }
            });


        assert.equal(
            typeof runtime.rerenderStoredMessage,
            "function"
        );


        const result =
            await runtime.rerenderStoredMessage(
                message
            );


        assert.equal(
            receivedMessage,
            message
        );


        assert.equal(
            result,
            rerenderedMessage
        );

    }
);


test(
    "createFoundryRangedAttackChatRuntime raccorde la persistance et le rerendu YZERollChat",
    async () => {

        const actor = {
            id:
                "actor-1"
        };

        const combat = {
            id:
                "combat-1"
        };

        const message = {
            id:
                "message-1"
        };

        const applicationState = {
            blockedOperations: [
                {
                    type:
                        "protection-damage",

                    status:
                        "blocked"
                }
            ]
        };


        const calls =
            [];


        const runtime =
            createFoundryRangedAttackChatRuntime({
                resolveUuid:
                    async uuid => {

                        calls.push([
                            "resolveUuid",
                            uuid
                        ]);


                        return actor;

                    },

                getActorById:
                    actorId => {

                        calls.push([
                            "getActorById",
                            actorId
                        ]);


                        return actor;

                    },

                getCombatById:
                    combatId => {

                        calls.push([
                            "getCombatById",
                            combatId
                        ]);


                        return combat;

                    },

                storeRangedAttackApplication:
                    async (
                        currentMessage,
                        currentApplicationState
                    ) => {

                        calls.push([
                            "store",
                            currentMessage,
                            currentApplicationState
                        ]);

                    },

                rerenderStoredMessage:
                    async currentMessage => {

                        calls.push([
                            "rerender",
                            currentMessage
                        ]);


                        return currentMessage;

                    }
            });


        const resolvedTarget =
            await runtime.resolveTarget({
                context: {
                    target: {
                        actorUuid:
                            "Actor.actor-1"
                    }
                }
            });


        const resolvedCombat =
            runtime.resolveCombat({
                context: {
                    combatId:
                        "combat-1"
                }
            });


        await runtime.storeApplicationState(
            message,
            applicationState
        );


        const rerenderedMessage =
            await runtime.rerenderStoredMessage(
                message
            );


        assert.equal(
            resolvedTarget,
            actor
        );


        assert.equal(
            resolvedCombat,
            combat
        );


        assert.equal(
            rerenderedMessage,
            message
        );


        assert.deepEqual(
            calls,
            [
                [
                    "resolveUuid",
                    "Actor.actor-1"
                ],
                [
                    "getCombatById",
                    "combat-1"
                ],
                [
                    "store",
                    message,
                    applicationState
                ],
                [
                    "rerender",
                    message
                ]
            ]
        );

    }
);

test(
    "createRangedAttackFinalizationDependencies raccorde le runtime au checkpoint bloqué",
    async () => {

        const message = {
            id:
                "message-1"
        };


        const applicationState = {
            blockedOperations: [
                {
                    type:
                        "protection-damage",

                    status:
                        "blocked"
                }
            ]
        };


        const calls =
            [];


        const runtime = {

            storeApplicationState:
                async (
                    currentMessage,
                    currentApplicationState
                ) => {

                    calls.push([
                        "store",
                        currentMessage,
                        currentApplicationState
                    ]);

                },

            rerenderStoredMessage:
                async currentMessage => {

                    calls.push([
                        "rerender",
                        currentMessage
                    ]);


                    return currentMessage;

                }

        };


        const dependencies =
            createRangedAttackFinalizationDependencies(
                runtime
            );


        assert.equal(
            typeof dependencies.storeApplicationState,
            "function"
        );


        assert.equal(
            typeof dependencies.renderStoredMessage,
            "function"
        );


        await dependencies.storeApplicationState(
            message,
            applicationState
        );


        const rerenderedMessage =
            await dependencies.renderStoredMessage(
                message
            );


        assert.equal(
            rerenderedMessage,
            message
        );


        assert.deepEqual(
            calls,
            [
                [
                    "store",
                    message,
                    applicationState
                ],
                [
                    "rerender",
                    message
                ]
            ]
        );

    }
);

test(
    "createFoundryRangedAttackFinalizationRuntime assemble la finalisation et la reprise du choix de Protection",
    async () => {

        const message = {
            id:
                "message-1"
        };


        const persistedState = {
            status:
                "blocked",

            protectionResult: {
                source: {
                    type:
                        "worn"
                }
            },

            applicationLedger: {
                operations: []
            },

            blockedOperations: []
        };


        const calls =
            [];


        let receivedDependencies =
            null;


        const runtime =
            createFoundryRangedAttackFinalizationRuntime({
                resolveUuid:
                    async () => null,

                getActorById:
                    () => null,

                getCombatById:
                    () => null,

                storeRangedAttackApplication:
                    async (
                        currentMessage,
                        applicationState
                    ) => {

                        calls.push([
                            "store",
                            currentMessage,
                            applicationState
                        ]);

                    },

                rerenderStoredMessage:
                    async currentMessage => {

                        calls.push([
                            "render",
                            currentMessage
                        ]);

                    },

                getRangedAttackApplication:
                    () => persistedState,

                getStoredResult:
                    () => ({
                        context: {}
                    }),

                resumeProtectionChoice:
                    async (
                        currentMessage,
                        dependencies
                    ) => {

                        assert.equal(
                            currentMessage,
                            message
                        );


                        receivedDependencies =
                            dependencies;


                        await dependencies
                            .storeApplicationState(
                                currentMessage,
                                persistedState
                            );


                        await dependencies
                            .renderStoredMessage(
                                currentMessage
                            );


                        return {
                            applicationLedger:
                                persistedState.applicationLedger,

                            blockedOperations: []
                        };

                    }
            });


        const result =
            await runtime
                .resolveProtectionChoiceFromMessage(
                    message,
                    "body"
                );


        assert.equal(
            receivedDependencies
                .protectionTarget,
            "body"
        );


        assert.equal(
            typeof receivedDependencies
                .storeApplicationState,
            "function"
        );


        assert.equal(
            typeof receivedDependencies
                .renderStoredMessage,
            "function"
        );


        assert.deepEqual(
            calls,
            [
                [
                    "store",
                    message,
                    persistedState
                ],

                [
                    "render",
                    message
                ]
            ]
        );


        assert.deepEqual(
            result,
            {
                applicationLedger:
                    persistedState.applicationLedger,

                blockedOperations: []
            }
        );

    }
);

test(
    "resolveRangedAttackProtectionChoiceFromMessage reprend le checkpoint persisté sans recalculer l'attaque",
    async () => {

        const message = {
            id:
                "message-1"
        };


        const protectionResult = {
            source: {
                type:
                    "worn"
            }
        };


        const applicationLedger = {
            operations: [
                {
                    type:
                        "protection-damage",

                    status:
                        "blocked"
                }
            ]
        };


        const applicationState = {
            protectionResult,

            applicationLedger
        };


        const storedResult = {
            context: {}
        };


        const target = {
            id:
                "target-1"
        };


        const attacker = {
            id:
                "attacker-1"
        };


        const combat = {
            id:
                "combat-1"
        };


        const resumedLedger = {
            operations: [
                {
                    type:
                        "protection-damage",

                    target:
                        "helmet",

                    itemId:
                        "helmet-1",

                    status:
                        "pending"
                }
            ]
        };


        const resumedResult = {
            applicationLedger:
                resumedLedger,

            blockedOperations: []
        };


        const calls =
            [];


        const result =
            await resolveRangedAttackProtectionChoiceFromMessage(
                message,
                {
                    protectionTarget:
                        "helmet",

                    getApplicationState:
                        currentMessage => {

                            calls.push([
                                "application-state",
                                currentMessage
                            ]);


                            return applicationState;

                        },

                    getStoredResult:
                        currentMessage => {

                            calls.push([
                                "stored-result",
                                currentMessage
                            ]);


                            return storedResult;

                        },

                    resolveTarget:
                        async currentStoredResult => {

                            calls.push([
                                "target",
                                currentStoredResult
                            ]);


                            return target;

                        },

                    resolveAttacker:
                        async currentStoredResult => {

                            calls.push([
                                "attacker",
                                currentStoredResult
                            ]);


                            return attacker;

                        },

                    resolveCombat:
                        currentStoredResult => {

                            calls.push([
                                "combat",
                                currentStoredResult
                            ]);


                            return combat;

                        },

                    resumeApplication:
                        async (
                            state,
                            dependencies
                        ) => {

                            calls.push([
                                "resume",
                                state,
                                dependencies
                            ]);


                            assert.deepEqual(
                                state,
                                {
                                    protectionResult,

                                    applicationLedger
                                }
                            );


                            assert.equal(
                                dependencies.protectionTarget,
                                "helmet"
                            );


                            assert.equal(
                                dependencies.target,
                                target
                            );


                            assert.equal(
                                dependencies.attacker,
                                attacker
                            );


                            assert.equal(
                                dependencies.combat,
                                combat
                            );


                            return resumedResult;

                        },

                    resolveProtectionChoice:
                        () => {
                            throw new Error(
                                "La résolution métier directe ne doit pas être appelée ici."
                            );
                        },

                    getBlockedOperations:
                        () => {
                            throw new Error(
                                "Le calcul direct des blocages ne doit pas être appelé ici."
                            );
                        },

                    applyApplicationLedger:
                        async () => {
                            throw new Error(
                                "P6 direct ne doit pas être appelé ici."
                            );
                        },

                    validateInitiativeSwap:
                        () => null,

                    scheduleInitiativeSwap:
                        async () => null,

                    storeApplicationState:
                        async (
                            currentMessage,
                            currentApplicationState
                        ) => {

                            calls.push([
                                "store",
                                currentMessage,
                                currentApplicationState
                            ]);

                        },

                    renderStoredMessage:
                        async currentMessage => {

                            calls.push([
                                "render",
                                currentMessage
                            ]);

                        }
                }
            );


        assert.equal(
            result,
            resumedResult
        );


        assert.deepEqual(
            calls.slice(
                0,
                5
            ),
            [
                [
                    "application-state",
                    message
                ],

                [
                    "stored-result",
                    message
                ],

                [
                    "target",
                    storedResult
                ],

                [
                    "attacker",
                    storedResult
                ],

                [
                    "combat",
                    storedResult
                ]
            ]
        );


        assert.equal(
            calls[5][0],
            "resume"
        );


        assert.deepEqual(
            calls[5][1],
            {
                protectionResult,

                applicationLedger
            }
        );


        assert.deepEqual(
            calls[6],
            [
                "store",
                message,
                {
                    status:
                        "ready",

                    protectionResult,

                    applicationLedger:
                        resumedLedger,

                    blockedOperations: []
                }
            ]
        );


        assert.deepEqual(
            calls[7],
            [
                "render",
                message
            ]
        );

    }
);

test(
    "createFoundryRangedAttackChatDependencies raccorde les lecteurs persistants YZERollChat",
    () => {

        const message = {
            id:
                "message-1"
        };


        const applicationState = {
            blockedOperations: [
                {
                    type:
                        "protection-damage",

                    status:
                        "blocked"
                }
            ]
        };


        const storedResult = {
            context: {
                attack: {
                    type:
                        "ranged"
                }
            }
        };


        const calls =
            [];


        const dependencies =
            createFoundryRangedAttackChatDependencies({
                getRangedAttackApplication:
                    currentMessage => {

                        calls.push([
                            "application",
                            currentMessage
                        ]);


                        return applicationState;

                    },

                getStoredResult:
                    currentMessage => {

                        calls.push([
                            "result",
                            currentMessage
                        ]);


                        return storedResult;

                    }
            });


        assert.equal(
            typeof dependencies.getRangedAttackApplication,
            "function"
        );


        assert.equal(
            typeof dependencies.getStoredResult,
            "function"
        );


        const actualApplicationState =
            dependencies.getRangedAttackApplication(
                message
            );


        const actualStoredResult =
            dependencies.getStoredResult(
                message
            );


        assert.equal(
            actualApplicationState,
            applicationState
        );


        assert.equal(
            actualStoredResult,
            storedResult
        );


        assert.deepEqual(
            calls,
            [
                [
                    "application",
                    message
                ],
                [
                    "result",
                    message
                ]
            ]
        );

    }
);

test(
    "createFoundryRangedAttackProductionRuntime raccorde les lecteurs persistants et le rerendu au runtime final",
    async () => {

        const message = {
            id:
                "message-1"
        };


        const html = {
            marker:
                "message-html"
        };


        const applicationState = {
            status:
                "blocked",

            protectionResult: {
                source: {
                    type:
                        "worn"
                }
            },

            applicationLedger: {
                operations: []
            },

            blockedOperations: []
        };


        const storedResult = {
            context: {}
        };


        const calls =
            [];


        let receivedDependencies =
            null;


        const runtime =
            createFoundryRangedAttackProductionRuntime({
                resolveUuid:
                    async () => null,

                getActorById:
                    () => null,

                getCombatById:
                    () => null,

                storeRangedAttackApplication:
                    async (
                        currentMessage,
                        currentApplicationState
                    ) => {

                        calls.push([
                            "store",
                            currentMessage,
                            currentApplicationState
                        ]);

                    },

                rerenderStoredMessage:
                    async currentMessage => {

                        calls.push([
                            "render",
                            currentMessage
                        ]);


                        return currentMessage;

                    },

                getRangedAttackApplication:
                    currentMessage => {

                        calls.push([
                            "application-state",
                            currentMessage
                        ]);


                        return applicationState;

                    },

                getStoredResult:
                    currentMessage => {

                        calls.push([
                            "stored-result",
                            currentMessage
                        ]);


                        return storedResult;

                    },

                getMessageHtml:
                    currentMessage => {

                        calls.push([
                            "get-html",
                            currentMessage
                        ]);


                        return html;

                    },

                bindMessageInteractions:
                    (
                        currentMessage,
                        currentHtml
                    ) => {

                        calls.push([
                            "bind",
                            currentMessage,
                            currentHtml
                        ]);

                    },

                resumeProtectionChoice:
                    async (
                        currentMessage,
                        dependencies
                    ) => {

                        receivedDependencies =
                            dependencies;


                        const currentApplicationState =
                            dependencies
                                .getApplicationState(
                                    currentMessage
                                );


                        const currentStoredResult =
                            dependencies
                                .getStoredResult(
                                    currentMessage
                                );


                        await dependencies
                            .storeApplicationState(
                                currentMessage,
                                currentApplicationState
                            );


                        await dependencies
                            .renderStoredMessage(
                                currentMessage
                            );


                        return {
                            currentApplicationState,
                            currentStoredResult
                        };

                    }
            });


        assert.equal(
            typeof runtime
                .resolveProtectionChoiceFromMessage,
            "function"
        );


        const result =
            await runtime
                .resolveProtectionChoiceFromMessage(
                    message,
                    "body"
                );


        assert.equal(
            result.currentApplicationState,
            applicationState
        );


        assert.equal(
            result.currentStoredResult,
            storedResult
        );


        assert.equal(
            typeof receivedDependencies
                .getApplicationState,
            "function"
        );


        assert.equal(
            typeof receivedDependencies
                .getStoredResult,
            "function"
        );


        assert.equal(
            typeof receivedDependencies
                .storeApplicationState,
            "function"
        );


        assert.equal(
            typeof receivedDependencies
                .renderStoredMessage,
            "function"
        );


        assert.deepEqual(
            calls,
            [
                [
                    "application-state",
                    message
                ],
                [
                    "stored-result",
                    message
                ],
                [
                    "store",
                    message,
                    applicationState
                ],
                [
                    "render",
                    message
                ],
                [
                    "get-html",
                    message
                ],
                [
                    "bind",
                    message,
                    html
                ]
            ]
        );

    }
);


test(
    "resolveRangedAttackProtectionChoiceAction transmet le choix du bouton au runtime une seule fois",
    async () => {

        const message = {
            id:
                "message-1"
        };


        const button = {
            disabled:
                false,

            dataset: {
                protectionTarget:
                    "helmet"
            }
        };


        const calls =
            [];


        const result =
            await resolveRangedAttackProtectionChoiceAction(
                message,
                button,
                {
                    resolveProtectionChoiceFromMessage:
                        async (
                            currentMessage,
                            protectionTarget
                        ) => {

                            calls.push([
                                currentMessage,
                                protectionTarget
                            ]);


                            return {
                                resolved:
                                    true
                            };

                        }
                }
            );


        assert.equal(
            button.disabled,
            true
        );


        assert.deepEqual(
            calls,
            [
                [
                    message,
                    "helmet"
                ]
            ]
        );


        assert.deepEqual(
            result,
            {
                resolved:
                    true
            }
        );

    }
);

test(
    "resolveRangedAttackProtectionChoiceAction réactive le bouton si la reprise échoue",
    async () => {

        const message = {
            id:
                "message-1"
        };


        const button = {
            disabled:
                false,

            dataset: {
                protectionTarget:
                    "body"
            }
        };


        const expectedError =
            new Error(
                "Échec de reprise de la Protection."
            );


        let callCount =
            0;


        await assert.rejects(
            () =>
                resolveRangedAttackProtectionChoiceAction(
                    message,
                    button,
                    {
                        resolveProtectionChoiceFromMessage:
                            async (
                                currentMessage,
                                protectionTarget
                            ) => {

                                callCount +=
                                    1;


                                assert.equal(
                                    currentMessage,
                                    message
                                );


                                assert.equal(
                                    protectionTarget,
                                    "body"
                                );


                                throw expectedError;

                            }
                    }
                ),
            error =>
                error === expectedError
        );


        assert.equal(
            callCount,
            1
        );


        assert.equal(
            button.disabled,
            false
        );

    }
);

test(
    "resolveRangedAttackProtectionChoiceFromMessage persiste puis rerend le ledger résolu lorsqu'une autre opération reste bloquée",
    async () => {

        const message = {
            id:
                "message-1"
        };


        const protectionResult = {
            source: {
                type:
                    "worn"
            }
        };


        const initialLedger = {
            operations: [
                {
                    type:
                        "protection-damage",

                    status:
                        "blocked"
                },

                {
                    type:
                        "disarm",

                    status:
                        "blocked"
                }
            ]
        };


        const resolvedLedger = {
            operations: [
                {
                    type:
                        "protection-damage",

                    target:
                        "body",

                    itemId:
                        "armor-1",

                    status:
                        "pending"
                },

                {
                    type:
                        "disarm",

                    status:
                        "blocked"
                }
            ]
        };


        const blockedOperations = [
            resolvedLedger.operations[1]
        ];


        const calls =
            [];


        const storedStates =
            [];


        const result =
            await resolveRangedAttackProtectionChoiceFromMessage(
                message,
                {
                    protectionTarget:
                        "body",

                    getApplicationState:
                        () => ({
                            protectionResult,

                            applicationLedger:
                                initialLedger
                        }),

                    getStoredResult:
                        () => ({
                            context: {}
                        }),

                    resolveTarget:
                        async () => ({
                            id:
                                "target-1"
                        }),

                    resolveAttacker:
                        async () => null,

                    resolveCombat:
                        () => null,

                    resumeApplication:
                        async () => ({
                            applicationLedger:
                                resolvedLedger,

                            blockedOperations
                        }),

                    resolveProtectionChoice:
                        () => {
                            throw new Error(
                                "La résolution métier directe ne doit pas être appelée ici."
                            );
                        },

                    getBlockedOperations:
                        () => {
                            throw new Error(
                                "Le calcul direct des blocages ne doit pas être appelé ici."
                            );
                        },

                    applyApplicationLedger:
                        async () => {
                            throw new Error(
                                "P6 ne doit pas être appelé ici."
                            );
                        },

                    validateInitiativeSwap:
                        () => null,

                    scheduleInitiativeSwap:
                        async () => null,

                    storeApplicationState:
                        async (
                            currentMessage,
                            currentApplicationState
                        ) => {

                            calls.push(
                                "store"
                            );


                            storedStates.push({
                                message:
                                    currentMessage,

                                applicationState:
                                    currentApplicationState
                            });

                        },

                    renderStoredMessage:
                        async currentMessage => {

                            calls.push(
                                "render"
                            );


                            assert.equal(
                                currentMessage,
                                message
                            );

                        }
                }
            );


        assert.equal(
            result.applicationLedger,
            resolvedLedger
        );


        assert.equal(
            result.blockedOperations,
            blockedOperations
        );


        assert.deepEqual(
            calls,
            [
                "store",
                "render"
            ]
        );


        assert.deepEqual(
            storedStates,
            [
                {
                    message,

                    applicationState: {
                        status:
                            "blocked",

                        protectionResult,

                        applicationLedger:
                            resolvedLedger,

                        blockedOperations
                    }
                }
            ]
        );

    }
);

test(
    "resolveRangedAttackProtectionChoiceFromMessage débloque puis rerend le checkpoint après la résolution du dernier blocage",
    async () => {

        const message = {
            id:
                "message-1"
        };


        const protectionResult = {
            source: {
                type:
                    "worn"
            }
        };


        const initialLedger = {
            operations: [
                {
                    type:
                        "protection-damage",

                    status:
                        "blocked"
                }
            ]
        };


        const resolvedLedger = {
            operations: [
                {
                    type:
                        "protection-damage",

                    target:
                        "body",

                    itemId:
                        "armor-1",

                    status:
                        "pending"
                }
            ]
        };


        const storedStates =
            [];


        const calls =
            [];


        const result =
            await resolveRangedAttackProtectionChoiceFromMessage(
                message,
                {
                    protectionTarget:
                        "body",

                    getApplicationState:
                        () => ({
                            status:
                                "blocked",

                            protectionResult,

                            applicationLedger:
                                initialLedger,

                            blockedOperations:
                                initialLedger.operations
                        }),

                    getStoredResult:
                        () => ({
                            context: {}
                        }),

                    resolveTarget:
                        async () => ({
                            id:
                                "target-1"
                        }),

                    resolveAttacker:
                        async () => null,

                    resolveCombat:
                        () => null,

                    resumeApplication:
                        async () => {

                            calls.push(
                                "apply"
                            );


                            return {
                                applicationLedger:
                                    resolvedLedger,

                                blockedOperations: []
                            };

                        },

                    resolveProtectionChoice:
                        () => {
                            throw new Error(
                                "La résolution métier directe ne doit pas être appelée ici."
                            );
                        },

                    getBlockedOperations:
                        () => {
                            throw new Error(
                                "Le calcul direct des blocages ne doit pas être appelé ici."
                            );
                        },

                    applyApplicationLedger:
                        async () => {
                            throw new Error(
                                "P6 direct ne doit pas être appelé ici."
                            );
                        },

                    validateInitiativeSwap:
                        () => null,

                    scheduleInitiativeSwap:
                        async () => null,

                    storeApplicationState:
                        async (
                            currentMessage,
                            applicationState
                        ) => {

                            calls.push(
                                "store"
                            );


                            storedStates.push({
                                message:
                                    currentMessage,

                                applicationState
                            });

                        },

                    renderStoredMessage:
                        async currentMessage => {

                            calls.push(
                                "render"
                            );


                            assert.equal(
                                currentMessage,
                                message
                            );

                        }
                }
            );


        assert.equal(
            result.applicationLedger,
            resolvedLedger
        );


        assert.deepEqual(
            result.blockedOperations,
            []
        );


        assert.deepEqual(
            calls,
            [
                "apply",
                "store",
                "render"
            ]
        );


        assert.deepEqual(
            storedStates,
            [
                {
                    message,

                    applicationState: {
                        status:
                            "ready",

                        protectionResult,

                        applicationLedger:
                            resolvedLedger,

                        blockedOperations: []
                    }
                }
            ]
        );

    }
);

test(
    "resolveRangedAttackProtectionChoiceFromMessage refuse un checkpoint déjà appliqué avant toute reprise",
    async () => {

        const message = {
            id:
                "message-1"
        };


        const protectionResult = {
            source: {
                type:
                    "worn"
            }
        };


        const applicationLedger = {
            operations: [
                {
                    type:
                        "protection-damage",

                    target:
                        "body",

                    itemId:
                        "armor-1",

                    status:
                        "pending"
                }
            ]
        };


        const calls =
            [];


        await assert.rejects(
            () =>
                resolveRangedAttackProtectionChoiceFromMessage(
                    message,
                    {
                        protectionTarget:
                            "body",

                        getApplicationState:
                            currentMessage => {

                                calls.push(
                                    "application-state"
                                );


                                assert.equal(
                                    currentMessage,
                                    message
                                );


                                return {
                                    status:
                                        "applied",

                                    protectionResult,

                                    applicationLedger,

                                    blockedOperations: []
                                };

                            },

                        getStoredResult:
                            () => {

                                calls.push(
                                    "stored-result"
                                );


                                throw new Error(
                                    "Le résultat stocké ne doit pas être relu."
                                );

                            },

                        resolveTarget:
                            async () => {

                                calls.push(
                                    "target"
                                );


                                throw new Error(
                                    "La cible ne doit pas être reconstruite."
                                );

                            },

                        resolveAttacker:
                            async () => {

                                calls.push(
                                    "attacker"
                                );


                                throw new Error(
                                    "L'attaquant ne doit pas être reconstruit."
                                );

                            },

                        resolveCombat:
                            () => {

                                calls.push(
                                    "combat"
                                );


                                throw new Error(
                                    "Le Combat ne doit pas être reconstruit."
                                );

                            },

                        resumeApplication:
                            async () => {

                                calls.push(
                                    "resume"
                                );


                                throw new Error(
                                    "La reprise ne doit jamais être exécutée."
                                );

                            },

                        resolveProtectionChoice:
                            () => {

                                calls.push(
                                    "resolve-protection"
                                );

                            },

                        getBlockedOperations:
                            () => {

                                calls.push(
                                    "blocked-operations"
                                );

                            },

                        applyApplicationLedger:
                            async () => {

                                calls.push(
                                    "apply"
                                );

                            },

                        validateInitiativeSwap:
                            () => {

                                calls.push(
                                    "validate-initiative"
                                );

                            },

                        scheduleInitiativeSwap:
                            async () => {

                                calls.push(
                                    "schedule-initiative"
                                );

                            },

                        storeApplicationState:
                            async () => {

                                calls.push(
                                    "store"
                                );

                            }
                    }
                ),
            error => {

                assert.equal(
                    error.message,
                    "L'application de l'attaque à distance est déjà terminée."
                );


                return true;

            }
        );


        assert.deepEqual(
            calls,
            [
                "application-state"
            ]
        );

    }
);

test(
    "bindRangedAttackProtectionChoice raccorde le bouton de Protection au message et au runtime",
    async () => {

        const message = {
            id:
                "message-1"
        };


        const calls =
            [];


        let clickListener =
            null;


        const button = {
            dataset: {
                protectionTarget:
                    "body"
            },

            disabled:
                false,

            addEventListener:
                (
                    eventName,
                    listener
                ) => {

                    calls.push([
                        "listener",
                        eventName
                    ]);


                    clickListener =
                        listener;

                }
        };


        const html = {
            querySelectorAll:
                selector => {

                    calls.push([
                        "query",
                        selector
                    ]);


                    return [
                        button
                    ];

                }
        };


        const runtime = {
            resolveProtectionChoiceFromMessage:
                async () => null
        };


        const actionCalls =
            [];


        bindRangedAttackProtectionChoice(
            message,
            html,
            runtime,
            {
                resolveAction:
                    async (
                        currentMessage,
                        currentButton,
                        currentRuntime
                    ) => {

                        actionCalls.push([
                            currentMessage,
                            currentButton,
                            currentRuntime
                        ]);

                    },

                reportError:
                    () => {

                        throw new Error(
                            "Aucune erreur ne doit être signalée."
                        );

                    }
            }
        );


        assert.deepEqual(
            calls,
            [
                [
                    "query",
                    '[data-action="resolve-ranged-protection"]'
                ],

                [
                    "listener",
                    "click"
                ]
            ]
        );


        assert.equal(
            typeof clickListener,
            "function"
        );


        let prevented =
            false;


        await clickListener({
            preventDefault:
                () => {

                    prevented =
                        true;

                }
        });


        assert.equal(
            prevented,
            true
        );


        assert.deepEqual(
            actionCalls,
            [
                [
                    message,
                    button,
                    runtime
                ]
            ]
        );

    }
);test(
    "bindRangedAttackProtectionChoice raccorde le bouton de Protection au message et au runtime",
    async () => {

        const message = {
            id:
                "message-1"
        };


        const calls =
            [];


        let clickListener =
            null;


        const button = {
            dataset: {
                protectionTarget:
                    "body"
            },

            disabled:
                false,

            addEventListener:
                (
                    eventName,
                    listener
                ) => {

                    calls.push([
                        "listener",
                        eventName
                    ]);


                    clickListener =
                        listener;

                }
        };


        const html = {
            querySelectorAll:
                selector => {

                    calls.push([
                        "query",
                        selector
                    ]);


                    return [
                        button
                    ];

                }
        };


        const runtime = {
            resolveProtectionChoiceFromMessage:
                async () => null
        };


        const actionCalls =
            [];


        bindRangedAttackProtectionChoice(
            message,
            html,
            runtime,
            {
                resolveAction:
                    async (
                        currentMessage,
                        currentButton,
                        currentRuntime
                    ) => {

                        actionCalls.push([
                            currentMessage,
                            currentButton,
                            currentRuntime
                        ]);

                    },

                reportError:
                    () => {

                        throw new Error(
                            "Aucune erreur ne doit être signalée."
                        );

                    }
            }
        );


        assert.deepEqual(
            calls,
            [
                [
                    "query",
                    '[data-action="resolve-ranged-protection"]'
                ],

                [
                    "listener",
                    "click"
                ]
            ]
        );


        assert.equal(
            typeof clickListener,
            "function"
        );


        let prevented =
            false;


        await clickListener({
            preventDefault:
                () => {

                    prevented =
                        true;

                }
        });


        assert.equal(
            prevented,
            true
        );


        assert.deepEqual(
            actionCalls,
            [
                [
                    message,
                    button,
                    runtime
                ]
            ]
        );

    }
);

test(
    "bindRangedAttackProtectionChoice raccorde tous les boutons de Protection",
    async () => {

        const message = {
            id:
                "message-1"
        };


        const listeners =
            new Map();


        const bodyButton = {
            dataset: {
                protectionTarget:
                    "body"
            },

            disabled:
                false,

            addEventListener:
                (
                    eventName,
                    listener
                ) => {

                    assert.equal(
                        eventName,
                        "click"
                    );


                    listeners.set(
                        "body",
                        listener
                    );

                }
        };


        const helmetButton = {
            dataset: {
                protectionTarget:
                    "helmet"
            },

            disabled:
                false,

            addEventListener:
                (
                    eventName,
                    listener
                ) => {

                    assert.equal(
                        eventName,
                        "click"
                    );


                    listeners.set(
                        "helmet",
                        listener
                    );

                }
        };


        const html = {
            querySelectorAll:
                selector => {

                    assert.equal(
                        selector,
                        '[data-action="resolve-ranged-protection"]'
                    );


                    return [
                        bodyButton,
                        helmetButton
                    ];

                }
        };


        const runtime = {
            resolveProtectionChoiceFromMessage:
                async () => null
        };


        const actionCalls =
            [];


        bindRangedAttackProtectionChoice(
            message,
            html,
            runtime,
            {
                resolveAction:
                    async (
                        currentMessage,
                        currentButton,
                        currentRuntime
                    ) => {

                        actionCalls.push([
                            currentMessage,
                            currentButton,
                            currentRuntime
                        ]);

                    },

                reportError:
                    () => {

                        throw new Error(
                            "Aucune erreur ne doit être signalée."
                        );

                    }
            }
        );


        assert.equal(
            typeof listeners.get("body"),
            "function"
        );


        assert.equal(
            typeof listeners.get("helmet"),
            "function"
        );


        let bodyPrevented =
            false;


        await listeners.get("body")({
            preventDefault:
                () => {

                    bodyPrevented =
                        true;

                }
        });


        let helmetPrevented =
            false;


        await listeners.get("helmet")({
            preventDefault:
                () => {

                    helmetPrevented =
                        true;

                }
        });


        assert.equal(
            bodyPrevented,
            true
        );


        assert.equal(
            helmetPrevented,
            true
        );


        assert.deepEqual(
            actionCalls,
            [
                [
                    message,
                    bodyButton,
                    runtime
                ],

                [
                    message,
                    helmetButton,
                    runtime
                ]
            ]
        );

    }
);


test(
    "bindRangedAttackProtectionChoice ne raccorde rien lorsqu'aucun bouton de Protection n'est présent",
    () => {

        const message = {
            id:
                "message-1"
        };


        const runtime = {
            resolveProtectionChoiceFromMessage:
                async () => null
        };


        const calls =
            [];


        const html = {
            querySelectorAll:
                selector => {

                    calls.push([
                        "query",
                        selector
                    ]);


                    return [];

                }
        };


        bindRangedAttackProtectionChoice(
            message,
            html,
            runtime,
            {
                resolveAction:
                    async () => {

                        throw new Error(
                            "L'action ne doit pas être appelée."
                        );

                    },

                reportError:
                    () => {

                        throw new Error(
                            "Aucune erreur ne doit être signalée."
                        );

                    }
            }
        );


        assert.deepEqual(
            calls,
            [
                [
                    "query",
                    '[data-action="resolve-ranged-protection"]'
                ]
            ]
        );

    }
);

test(
    "bindRangedAttackProtectionChoice signale une seule fois l'échec de la reprise",
    async () => {

        const expectedError =
            new Error(
                "Échec de reprise Protection."
            );


        const message = {
            id:
                "message-1"
        };


        const runtime = {
            resolveProtectionChoiceFromMessage:
                async () => null
        };


        let clickListener =
            null;


        const button = {
            dataset: {
                protectionTarget:
                    "helmet"
            },

            disabled:
                false,

            addEventListener:
                (
                    eventName,
                    listener
                ) => {

                    assert.equal(
                        eventName,
                        "click"
                    );


                    clickListener =
                        listener;

                }
        };


        const html = {
            querySelectorAll:
                () => [
                    button
                ]
        };


        const actionCalls =
            [];


        const reportedErrors =
            [];


        bindRangedAttackProtectionChoice(
            message,
            html,
            runtime,
            {
                resolveAction:
                    async (
                        currentMessage,
                        currentButton,
                        currentRuntime
                    ) => {

                        actionCalls.push([
                            currentMessage,
                            currentButton,
                            currentRuntime
                        ]);


                        throw expectedError;

                    },

                reportError:
                    error => {

                        reportedErrors.push(
                            error
                        );

                    }
            }
        );


        assert.equal(
            typeof clickListener,
            "function"
        );


        let prevented =
            false;


        await clickListener({
            preventDefault:
                () => {

                    prevented =
                        true;

                }
        });


        assert.equal(
            prevented,
            true
        );


        assert.deepEqual(
            actionCalls,
            [
                [
                    message,
                    button,
                    runtime
                ]
            ]
        );


        assert.deepEqual(
            reportedErrors,
            [
                expectedError
            ]
        );

    }
);

test(
    "bindRangedAttackProtectionChoiceOnRender raccorde le message rendu au runtime ranged",
    () => {

        const message = {
            id:
                "message-1"
        };


        const html = {
            id:
                "html-1"
        };


        const runtime = {
            id:
                "runtime-1"
        };


        const calls =
            [];


        bindRangedAttackProtectionChoiceOnRender(
            message,
            html,
            runtime,
            {
                bindProtectionChoice:
                    (
                        currentMessage,
                        currentHtml,
                        currentRuntime
                    ) => {

                        calls.push([
                            currentMessage,
                            currentHtml,
                            currentRuntime
                        ]);

                    }
            }
        );


        assert.deepEqual(
            calls,
            [
                [
                    message,
                    html,
                    runtime
                ]
            ]
        );

    }
);

test(
    "registerYZERollChatHooks raccorde le choix de Protection au hook renderChatMessageHTML",
    () => {

        const previousHooks =
            globalThis.Hooks;

        const previousGame =
            globalThis.game;

        const previousFromUuid =
            globalThis.fromUuid;

        const previousUi =
            globalThis.ui;


        const registeredHooks =
            new Map();


        globalThis.Hooks = {

            on(
                hookName,
                callback
            ) {

                registeredHooks.set(
                    hookName,
                    callback
                );

            }

        };


        globalThis.game = {

            actors: {
                get:
                    () => null
            },

            combats: {
                get:
                    () => null
            },

            combat:
                null

        };


        globalThis.fromUuid =
            async () => null;


        globalThis.ui = {

            notifications: {
                error:
                    () => {}
            }

        };


        try {

            registerYZERollChatHooks();


            const renderHook =
                registeredHooks.get(
                    "renderChatMessageHTML"
                );


            assert.equal(
                typeof renderHook,
                "function"
            );


            const message = {
                id:
                    "message-1"
            };


            const calls =
                [];


            const button = {

                disabled:
                    false,

                dataset: {
                    protectionTarget:
                        "body"
                },

                addEventListener(
                    eventName,
                    listener
                ) {

                    calls.push([
                        "listener",
                        eventName,
                        listener
                    ]);

                }

            };


            const html = {

                querySelectorAll(
                    selector
                ) {

                    calls.push([
                        "queryAll",
                        selector
                    ]);


                    if (
                        selector ===
                        '[data-action="resolve-ranged-protection"]'
                    ) {
                        return [
                            button
                        ];
                    }


                    return [];

                },

                querySelector(
                    selector
                ) {

                    calls.push([
                        "query",
                        selector
                    ]);


                    return null;

                }

            };


            renderHook(
                message,
                html
            );


            const protectionQuery =
                calls.find(
                    call =>
                        call[0] ===
                            "queryAll"
                        &&
                        call[1] ===
                            '[data-action="resolve-ranged-protection"]'
                );


            assert.deepEqual(
                protectionQuery,
                [
                    "queryAll",
                    '[data-action="resolve-ranged-protection"]'
                ]
            );


            const protectionListener =
                calls.find(
                    call =>
                        call[0] ===
                            "listener"
                        &&
                        call[1] ===
                            "click"
                );


            assert.equal(
                protectionListener?.[0],
                "listener"
            );


            assert.equal(
                protectionListener?.[1],
                "click"
            );


            assert.equal(
                typeof protectionListener?.[2],
                "function"
            );

        }
        finally {

            if (
                previousHooks ===
                    undefined
            ) {
                delete globalThis.Hooks;
            }
            else {
                globalThis.Hooks =
                    previousHooks;
            }


            if (
                previousGame ===
                    undefined
            ) {
                delete globalThis.game;
            }
            else {
                globalThis.game =
                    previousGame;
            }


            if (
                previousFromUuid ===
                    undefined
            ) {
                delete globalThis.fromUuid;
            }
            else {
                globalThis.fromUuid =
                    previousFromUuid;
            }


            if (
                previousUi ===
                    undefined
            ) {
                delete globalThis.ui;
            }
            else {
                globalThis.ui =
                    previousUi;
            }

        }

    }
);

test(
    "rerenderRangedAttackChatMessage rebinde les interactions sur le DOM du message rerendu",
    async () => {

        const message = {
            id:
                "message-1"
        };


        const html = {
            marker:
                "message-html"
        };


        const calls =
            [];


        const rerenderStoredMessage =
            async currentMessage => {

                calls.push([
                    "rerender",
                    currentMessage
                ]);


                return currentMessage;

            };


        const getMessageHtml =
            currentMessage => {

                calls.push([
                    "get-html",
                    currentMessage
                ]);


                return html;

            };


        const bindMessageInteractions =
            (
                currentMessage,
                currentHtml
            ) => {

                calls.push([
                    "bind",
                    currentMessage,
                    currentHtml
                ]);

            };


        const returnedMessage =
            await rerenderRangedAttackChatMessage(
                message,
                {
                    rerenderStoredMessage,
                    getMessageHtml,
                    bindMessageInteractions
                }
            );


        assert.equal(
            returnedMessage,
            message
        );


        assert.deepEqual(
            calls,
            [
                [
                    "rerender",
                    message
                ],
                [
                    "get-html",
                    message
                ],
                [
                    "bind",
                    message,
                    html
                ]
            ]
        );

    }
);

test(
    "createFoundryRangedAttackProductionRuntime utilise la frontière interactive pour rerendre un message ranged",
    async () => {

        const message = {
            id:
                "message-1"
        };


        const html = {
            marker:
                "message-html"
        };


        const calls =
            [];


        const runtime =
            createFoundryRangedAttackProductionRuntime({
                resolveUuid:
                    async () => null,

                getActorById:
                    () => null,

                getCombatById:
                    () => null,

                storeRangedAttackApplication:
                    async () => null,

                getRangedAttackApplication:
                    () => null,

                getStoredResult:
                    () => null,

                rerenderStoredMessage:
                    async currentMessage => {

                        calls.push([
                            "rerender",
                            currentMessage
                        ]);


                        return currentMessage;

                    },

                getMessageHtml:
                    currentMessage => {

                        calls.push([
                            "get-html",
                            currentMessage
                        ]);


                        return html;

                    },

                bindMessageInteractions:
                    (
                        currentMessage,
                        currentHtml
                    ) => {

                        calls.push([
                            "bind",
                            currentMessage,
                            currentHtml
                        ]);

                    }
            });


        assert.equal(
            typeof runtime.rerenderStoredMessage,
            "function"
        );


        const returnedMessage =
            await runtime.rerenderStoredMessage(
                message
            );


        assert.equal(
            returnedMessage,
            message
        );


        assert.deepEqual(
            calls,
            [
                [
                    "rerender",
                    message
                ],
                [
                    "get-html",
                    message
                ],
                [
                    "bind",
                    message,
                    html
                ]
            ]
        );

    }
);

test(
    "resolveRangedAttackChatMessageHtml retrouve le DOM du ChatMessage exact",
    () => {

        const message = {
            id:
                "message-42"
        };


        const expectedHtml = {
            id:
                "message-html-42"
        };


        const calls =
            [];


        const root = {

            querySelector(
                selector
            ) {

                calls.push(
                    selector
                );


                if (
                    selector ===
                    '[data-message-id="message-42"]'
                ) {
                    return expectedHtml;
                }


                return null;

            }

        };


        const html =
            resolveRangedAttackChatMessageHtml(
                message,
                {
                    root
                }
            );


        assert.equal(
            html,
            expectedHtml
        );


        assert.deepEqual(
            calls,
            [
                '[data-message-id="message-42"]'
            ]
        );

    }
);

test(
    "bindRangedAttackChatMessageInteractions rebinde les interactions ranged sur le DOM exact",
    () => {

        const message = {
            id:
                "message-42"
        };


        const html = {
            id:
                "message-html-42"
        };


        const runtime = {
            id:
                "runtime-42"
        };


        const calls =
            [];


        bindRangedAttackChatMessageInteractions(
            message,
            html,
            runtime,
            {
                bindProtectionChoiceOnRender:
                    (
                        currentMessage,
                        currentHtml,
                        currentRuntime
                    ) => {

                        calls.push([
                            currentMessage,
                            currentHtml,
                            currentRuntime
                        ]);

                    }
            }
        );


        assert.deepEqual(
            calls,
            [
                [
                    message,
                    html,
                    runtime
                ]
            ]
        );

    }
);

test(
    "registerYZERollChatHooks fournit au runtime ranged les dépendances de rerendu interactif",
    () => {

        const previousHooks =
            globalThis.Hooks;

        const previousGame =
            globalThis.game;

        const previousFromUuid =
            globalThis.fromUuid;

        const previousUi =
            globalThis.ui;

        const previousDocument =
            globalThis.document;


        const registeredHooks =
            new Map();


        globalThis.Hooks = {

            on(
                hookName,
                callback
            ) {

                registeredHooks.set(
                    hookName,
                    callback
                );

            }

        };


        globalThis.game = {

            actors: {
                get:
                    () => null
            },

            combats: {
                get:
                    () => null
            },

            combat:
                null

        };


        globalThis.fromUuid =
            async () => null;


        globalThis.ui = {

            notifications: {
                error:
                    () => {}
            }

        };


        const message = {
            id:
                "message-42"
        };


        const protectionButton = {

            disabled:
                false,

            dataset: {
                protectionTarget:
                    "helmet"
            },

            addEventListener:
                () => {}

        };


        const messageHtml = {

            dataset: {
                messageId:
                    "message-42"
            },

            querySelectorAll(
                selector
            ) {

                if (
                    selector ===
                    '[data-action="resolve-ranged-protection"]'
                ) {
                    return [
                        protectionButton
                    ];
                }


                return [];

            }

        };


        const documentCalls =
            [];


        globalThis.document = {

            querySelector(
                selector
            ) {

                documentCalls.push(
                    selector
                );


                if (
                    selector ===
                    '[data-message-id="message-42"]'
                ) {
                    return messageHtml;
                }


                return null;

            }

        };


        try {

            registerYZERollChatHooks();


            const renderHook =
                registeredHooks.get(
                    "renderChatMessageHTML"
                );


            assert.equal(
                typeof renderHook,
                "function"
            );


            /*
             * Le hook de rendu normal doit toujours
             * raccorder les interactions au DOM fourni
             * directement par Foundry.
             */
            const initialHtml = {

                querySelectorAll:
                    () => [],

                querySelector:
                    () => null

            };


            renderHook(
                message,
                initialHtml
            );


            /*
             * Le composition root doit aussi avoir
             * préparé la résolution du DOM exact
             * nécessaire au rerendu interactif.
             *
             * Tant que registerYZERollChatHooks
             * ne fournit pas getMessageHtml au runtime,
             * aucune recherche du ChatMessage exact
             * n'est possible depuis cette composition.
             */
            const resolvedHtml =
                resolveRangedAttackChatMessageHtml(
                    message
                );


            assert.equal(
                resolvedHtml,
                messageHtml
            );


            assert.deepEqual(
                documentCalls,
                [
                    '[data-message-id="message-42"]'
                ]
            );

        }
        finally {

            if (
                previousHooks ===
                    undefined
            ) {
                delete globalThis.Hooks;
            }
            else {
                globalThis.Hooks =
                    previousHooks;
            }


            if (
                previousGame ===
                    undefined
            ) {
                delete globalThis.game;
            }
            else {
                globalThis.game =
                    previousGame;
            }


            if (
                previousFromUuid ===
                    undefined
            ) {
                delete globalThis.fromUuid;
            }
            else {
                globalThis.fromUuid =
                    previousFromUuid;
            }


            if (
                previousUi ===
                    undefined
            ) {
                delete globalThis.ui;
            }
            else {
                globalThis.ui =
                    previousUi;
            }


            if (
                previousDocument ===
                    undefined
            ) {
                delete globalThis.document;
            }
            else {
                globalThis.document =
                    previousDocument;
            }

        }

    }
);

test(
    "createRangedAttackChatInteractionDependencies raccorde le DOM exact et les interactions ranged",
    () => {

        const message = {
            id:
                "message-42"
        };


        const html = {
            id:
                "html-42"
        };


        const runtime = {
            id:
                "runtime-42"
        };


        const calls =
            [];


        const dependencies =
            createRangedAttackChatInteractionDependencies(
                runtime,
                {
                    resolveMessageHtml:
                        currentMessage => {

                            calls.push([
                                "resolve-html",
                                currentMessage
                            ]);


                            return html;

                        },

                    bindInteractions:
                        (
                            currentMessage,
                            currentHtml,
                            currentRuntime
                        ) => {

                            calls.push([
                                "bind",
                                currentMessage,
                                currentHtml,
                                currentRuntime
                            ]);

                        }
                }
            );


        const resolvedHtml =
            dependencies.getMessageHtml(
                message
            );


        dependencies.bindMessageInteractions(
            message,
            resolvedHtml
        );


        assert.equal(
            resolvedHtml,
            html
        );


        assert.deepEqual(
            calls,
            [
                [
                    "resolve-html",
                    message
                ],
                [
                    "bind",
                    message,
                    html,
                    runtime
                ]
            ]
        );

    }
);

test(
    "createFoundryRangedAttackProductionRuntimeWithInteractions raccorde le rerendu au DOM final du ChatMessage",
    async () => {

        const message = {
            id:
                "message-42"
        };


        const html = {
            id:
                "html-42"
        };


        const calls =
            [];


        const runtime =
            createFoundryRangedAttackProductionRuntimeWithInteractions({
                resolveUuid:
                    async () => null,

                getActorById:
                    () => null,

                getCombatById:
                    () => null,

                storeRangedAttackApplication:
                    () => null,

                rerenderStoredMessage:
                    async currentMessage => {

                        calls.push([
                            "rerender",
                            currentMessage
                        ]);

                    },

                getRangedAttackApplication:
                    () => null,

                getStoredResult:
                    () => null,

                resolveMessageHtml:
                    currentMessage => {

                        calls.push([
                            "resolve-html",
                            currentMessage
                        ]);


                        return html;

                    },

                bindInteractions:
                    (
                        currentMessage,
                        currentHtml,
                        currentRuntime
                    ) => {

                        calls.push([
                            "bind",
                            currentMessage,
                            currentHtml,
                            currentRuntime
                        ]);

                    }
            });


        await runtime.rerenderStoredMessage(
            message
        );


        assert.equal(
            calls.length,
            3
        );


        assert.deepEqual(
            calls[0],
            [
                "rerender",
                message
            ]
        );


        assert.deepEqual(
            calls[1],
            [
                "resolve-html",
                message
            ]
        );


        assert.equal(
            calls[2]?.[0],
            "bind"
        );


        assert.equal(
            calls[2]?.[1],
            message
        );


        assert.equal(
            calls[2]?.[2],
            html
        );


        assert.equal(
            calls[2]?.[3],
            runtime
        );

    }
);

test(
    "createRegisteredRangedAttackRuntime construit le runtime Foundry avec les interactions de Chat",
    async () => {

        const message = {
            id:
                "message-42"
        };


        const html = {
            id:
                "html-42"
        };


        const calls =
            [];


        const runtime =
            createRegisteredRangedAttackRuntime({
                resolveUuid:
                    async () => null,

                getActorById:
                    () => null,

                getCombatById:
                    () => null,

                storeRangedAttackApplication:
                    () => null,

                rerenderStoredMessage:
                    async currentMessage => {

                        calls.push([
                            "rerender",
                            currentMessage
                        ]);

                    },

                getRangedAttackApplication:
                    () => null,

                getStoredResult:
                    () => null,

                resolveMessageHtml:
                    currentMessage => {

                        calls.push([
                            "resolve-html",
                            currentMessage
                        ]);


                        return html;

                    },

                bindInteractions:
                    (
                        currentMessage,
                        currentHtml,
                        currentRuntime
                    ) => {

                        calls.push([
                            "bind",
                            currentMessage,
                            currentHtml,
                            currentRuntime
                        ]);

                    }
            });


        await runtime.rerenderStoredMessage(
            message
        );


        assert.deepEqual(
            calls.slice(
                0,
                2
            ),
            [
                [
                    "rerender",
                    message
                ],
                [
                    "resolve-html",
                    message
                ]
            ]
        );


        assert.equal(
            calls[2]?.[0],
            "bind"
        );


        assert.equal(
            calls[2]?.[1],
            message
        );


        assert.equal(
            calls[2]?.[2],
            html
        );


        assert.equal(
            calls[2]?.[3],
            runtime
        );

    }
);

test(
    "createRegisteredRangedAttackRuntime fournit un runtime capable de rerendre puis rebinder le message exact",
    async () => {

        const message = {
            id:
                "message-42"
        };


        const html = {
            id:
                "html-42"
        };


        const calls =
            [];


        const runtime =
            createRegisteredRangedAttackRuntime({

                resolveUuid:
                    async () =>
                        null,

                getActorById:
                    () =>
                        null,

                getCombatById:
                    () =>
                        null,

                storeRangedAttackApplication:
                    async () => {},

                rerenderStoredMessage:
                    async currentMessage => {

                        calls.push([
                            "rerender",
                            currentMessage
                        ]);

                    },

                getRangedAttackApplication:
                    () =>
                        null,

                getStoredResult:
                    () =>
                        null,

                resolveMessageHtml:
                    currentMessage => {

                        calls.push([
                            "resolve-html",
                            currentMessage
                        ]);


                        return html;

                    },

                bindInteractions:
                    (
                        currentMessage,
                        currentHtml,
                        currentRuntime
                    ) => {

                        calls.push([
                            "bind",
                            currentMessage,
                            currentHtml,
                            currentRuntime
                        ]);

                    }

            });


        await runtime.rerenderStoredMessage(
            message
        );


        assert.deepEqual(
            calls.slice(
                0,
                2
            ),
            [
                [
                    "rerender",
                    message
                ],
                [
                    "resolve-html",
                    message
                ]
            ]
        );


        assert.equal(
            calls[2][0],
            "bind"
        );


        assert.equal(
            calls[2][1],
            message
        );


        assert.equal(
            calls[2][2],
            html
        );


        assert.equal(
            calls[2][3],
            runtime
        );

    }
);

test(
    "getRangedAttackDisarmChoices retourne uniquement les armes équipées de la cible",
    () => {

        const equippedWeapon = {
            id:
                "weapon-equipped",

            name:
                "Kalachnikov",

            type:
                "weapon",

            system: {
                equipped:
                    true
            }
        };


        const unequippedWeapon = {
            id:
                "weapon-unequipped",

            name:
                "Revolver",

            type:
                "weapon",

            system: {
                equipped:
                    false
            }
        };


        const armor = {
            id:
                "armor-1",

            name:
                "Armure lourde",

            type:
                "armor",

            system: {
                equipped:
                    true
            }
        };


        const target = {
            items: [
                equippedWeapon,
                unequippedWeapon,
                armor
            ]
        };


        const choices =
            getRangedAttackDisarmChoices(
                target
            );


        assert.deepEqual(
            choices,
            [
                {
                    itemId:
                        "weapon-equipped",

                    name:
                        "Kalachnikov"
                }
            ]
        );

    }
);

test(
    "resolveFinalizedRangedAttackMessage transmet les choix de désarmement au ledger",
    async () => {

        const message = {
            id:
                "message-1"
        };


        const target = {
            id:
                "target-1",

            items: [
                {
                    id:
                        "weapon-1",

                    name:
                        "Kalachnikov",

                    type:
                        "weapon",

                    system: {
                        equipped:
                            true
                    }
                },

                {
                    id:
                        "weapon-2",

                    name:
                        "Revolver",

                    type:
                        "weapon",

                    system: {
                        equipped:
                            false
                    }
                },

                {
                    id:
                        "armor-1",

                    name:
                        "Armure lourde",

                    type:
                        "armor",

                    system: {
                        equipped:
                            true
                    }
                }
            ]
        };


        const consequenceResult = {
            hit:
                true
        };


        const protectionResult = {
            remainingDamage:
                0,

            protectionDamage:
                0
        };


        const applicationPlan = {
            effects: {
                disarm:
                    true
            }
        };


        const applicationLedger = {
            operations: [
                {
                    type:
                        "disarm",

                    choices: [
                        {
                            itemId:
                                "weapon-1",

                            name:
                                "Kalachnikov"
                        }
                    ],

                    status:
                        "blocked"
                }
            ]
        };


        let receivedDisarmChoices =
            null;


        const result =
            await resolveFinalizedRangedAttackMessage(
                message,
                {
                    resolveConsequences:
                        () =>
                            consequenceResult,

                    getStoredResult:
                        () => ({
                            context: {
                                target: {
                                    actorUuid:
                                        "Actor.target-1"
                                }
                            }
                        }),

                    resolveTarget:
                        async () =>
                            target,

                    resolveProtection:
                        () =>
                            protectionResult,

                    createApplicationPlan:
                        () =>
                            applicationPlan,

                    createApplicationLedger:
                        ({
                            disarmChoices
                        }) => {

                            receivedDisarmChoices =
                                disarmChoices;


                            return applicationLedger;

                        },

                    getBlockedOperations:
                        () => [],

                    resolveCombat:
                        () => null,

                    resolveAttacker:
                        async () => ({
                            id:
                                "attacker-1"
                        }),

                    applyApplicationLedger:
                        async () => {},

                    storeApplicationState:
                        async () => {},

                    renderStoredMessage:
                        async () => {}
                }
            );


        assert.deepEqual(
            receivedDisarmChoices,
            [
                {
                    itemId:
                        "weapon-1",

                    name:
                        "Kalachnikov"
                }
            ]
        );


        assert.equal(
            result.applicationLedger,
            applicationLedger
        );

    }
);

test(
    "resolveRangedAttackDisarmChoiceFromMessage reprend le checkpoint persisté et aboutit à l'état READY sans recalculer l'attaque",
    async () => {

        const message = {
            id:
                "message-1"
        };


        const applicationState = {
            status:
                "blocked",

            protectionResult: {
                remainingDamage:
                    0,

                protectionDamage:
                    0
            },

            applicationLedger: {
                operations: [
                    {
                        type:
                            "disarm",

                        choices: [
                            {
                                itemId:
                                    "weapon-1",

                                name:
                                    "Kalachnikov"
                            }
                        ],

                        status:
                            "blocked"
                    }
                ]
            },

            blockedOperations: [
                {
                    type:
                        "disarm",

                    choices: [
                        {
                            itemId:
                                "weapon-1",

                            name:
                                "Kalachnikov"
                        }
                    ],

                    status:
                        "blocked"
                }
            ]
        };


        const storedResult = {
            context: {
                target: {
                    actorUuid:
                        "Actor.target-1"
                }
            }
        };


        const target = {
            id:
                "target-1"
        };


        const attacker = {
            id:
                "attacker-1"
        };


        const combat = {
            id:
                "combat-1"
        };


        const resumedResult = {
            applicationLedger: {
                operations: [
                    {
                        type:
                            "disarm",

                        itemId:
                            "weapon-1",

                        status:
                            "pending"
                    }
                ]
            },

            blockedOperations:
                []
        };


        const calls =
            [];


        const result =
            await resolveRangedAttackDisarmChoiceFromMessage(
                message,
                {
                    itemId:
                        "weapon-1",

                    getApplicationState:
                        currentMessage => {

                            calls.push([
                                "getApplicationState",
                                currentMessage
                            ]);


                            return applicationState;

                        },

                    getStoredResult:
                        currentMessage => {

                            calls.push([
                                "getStoredResult",
                                currentMessage
                            ]);


                            return storedResult;

                        },

                    resolveTarget:
                        async currentStoredResult => {

                            calls.push([
                                "resolveTarget",
                                currentStoredResult
                            ]);


                            return target;

                        },

                    resolveAttacker:
                        async currentStoredResult => {

                            calls.push([
                                "resolveAttacker",
                                currentStoredResult
                            ]);


                            return attacker;

                        },

                    resolveCombat:
                        currentStoredResult => {

                            calls.push([
                                "resolveCombat",
                                currentStoredResult
                            ]);


                            return combat;

                        },

                    resumeApplication:
                        async (
                            state,
                            dependencies
                        ) => {

                            calls.push([
                                "resumeApplication",
                                state,
                                dependencies.itemId,
                                dependencies.target,
                                dependencies.attacker,
                                dependencies.combat
                            ]);


                            return resumedResult;

                        },

                    resolveDisarmChoice:
                        "resolve-disarm-choice",

                    getBlockedOperations:
                        "get-blocked-operations",

                    applyApplicationLedger:
                        "apply-application-ledger",

                    validateInitiativeSwap:
                        "validate-initiative-swap",

                    scheduleInitiativeSwap:
                        "schedule-initiative-swap",

                    storeApplicationState:
                        async (
                            currentMessage,
                            state
                        ) => {

                            calls.push([
                                "storeApplicationState",
                                currentMessage,
                                state
                            ]);

                        },

                    renderStoredMessage:
                        async currentMessage => {

                            calls.push([
                                "renderStoredMessage",
                                currentMessage
                            ]);

                        }
                }
            );


        assert.deepEqual(
            calls,
            [
                [
                    "getApplicationState",
                    message
                ],

                [
                    "getStoredResult",
                    message
                ],

                [
                    "resolveTarget",
                    storedResult
                ],

                [
                    "resolveAttacker",
                    storedResult
                ],

                [
                    "resolveCombat",
                    storedResult
                ],

                [
                    "resumeApplication",
                    {
                        applicationLedger:
                            applicationState.applicationLedger
                    },
                    "weapon-1",
                    target,
                    attacker,
                    combat
                ],

                [
                    "storeApplicationState",
                    message,
                    {
                        status:
                            "ready",

                        protectionResult:
                            applicationState.protectionResult,

                        applicationLedger:
                            resumedResult.applicationLedger,

                        blockedOperations:
                            []
                    }
                ],

                [
                    "renderStoredMessage",
                    message
                ]
            ]
        );


        assert.equal(
            result,
            resumedResult
        );

    }
);

test(
    "createRangedAttackChatRuntime expose la résolution métier du choix de Désarmement",
    () => {

        const resolveDisarmChoice =
            () => "resolved-disarm";


        const runtime =
            createRangedAttackChatRuntime({
                resolveDisarmChoice
            });


        assert.equal(
            runtime.resolveDisarmChoice,
            resolveDisarmChoice
        );

    }
);

test(
    "createFoundryRangedAttackChatRuntime expose la résolution métier du choix de Désarmement",
    () => {

        const resolveDisarmChoice =
            () => "resolved-disarm";


        const runtime =
            createFoundryRangedAttackChatRuntime({
                resolveDisarmChoice
            });


        assert.equal(
            runtime.resolveDisarmChoice,
            resolveDisarmChoice
        );

    }
);

test(
    "createFoundryRangedAttackFinalizationRuntime assemble la reprise du choix de Désarmement",
    async () => {

        const calls =
            [];


        const resolveDisarmChoice =
            () => "resolved-disarm";


        const resumeDisarmChoice =
            async (
                message,
                dependencies
            ) => {

                calls.push({
                    message,
                    dependencies
                });


                return "resumed-disarm";

            };


        const runtime =
            createFoundryRangedAttackFinalizationRuntime({
                resolveUuid:
                    async () => null,

                getActorById:
                    () => null,

                getCombatById:
                    () => null,

                storeRangedAttackApplication:
                    async () => {},

                rerenderStoredMessage:
                    async () => {},

                getRangedAttackApplication:
                    () => ({
                        status:
                            "blocked"
                    }),

                getStoredResult:
                    () => ({}),

                resolveDisarmChoice,

                resumeDisarmChoice
            });


        const message = {
            id:
                "message-1"
        };


        const result =
            await runtime
                .resolveDisarmChoiceFromMessage(
                    message,
                    "weapon-1"
                );


        assert.equal(
            result,
            "resumed-disarm"
        );


        assert.equal(
            calls.length,
            1
        );


        assert.equal(
            calls[0].message,
            message
        );


        assert.equal(
            calls[0].dependencies.itemId,
            "weapon-1"
        );


        assert.equal(
            calls[0].dependencies.resolveDisarmChoice,
            resolveDisarmChoice
        );


        assert.equal(
            calls[0].dependencies.resumeApplication,
            resumeRangedAttackApplicationAfterDisarmChoice
        );

    }
);

test(
    "createRegisteredRangedAttackRuntime transporte la résolution métier du choix de Désarmement",
    () => {

        const resolveDisarmChoice =
            () => "resolved-disarm";


        const runtime =
            createRegisteredRangedAttackRuntime({
                resolveUuid:
                    async () => null,

                getActorById:
                    () => null,

                getCombatById:
                    () => null,

                storeRangedAttackApplication:
                    async () => {},

                rerenderStoredMessage:
                    async () => {},

                getRangedAttackApplication:
                    () => null,

                getStoredResult:
                    () => null,

                resolveMessageHtml:
                    () => null,

                bindInteractions:
                    () => {},

                resolveDisarmChoice
            });


        assert.equal(
            runtime.resolveDisarmChoice,
            resolveDisarmChoice
        );

    }
);

test(
    "bindRangedAttackDisarmChoice transmet l'Item choisi au runtime ranged",
    async () => {

        const message = {
            id:
                "message-1"
        };


        const calls =
            [];


        let clickListener =
            null;


        const button = {

            disabled:
                false,

            dataset: {
                itemId:
                    "weapon-1"
            },

            addEventListener(
                eventName,
                listener
            ) {

                if (
                    eventName ===
                    "click"
                ) {
                    clickListener =
                        listener;
                }

            }

        };


        const html = {

            querySelectorAll(
                selector
            ) {

                assert.equal(
                    selector,
                    '[data-action="resolve-ranged-disarm"]'
                );


                return [
                    button
                ];

            }

        };


        const runtime = {

            async resolveDisarmChoiceFromMessage(
                currentMessage,
                itemId
            ) {

                calls.push([
                    currentMessage,
                    itemId
                ]);

            }

        };


        bindRangedAttackDisarmChoice(
            message,
            html,
            runtime
        );


        assert.equal(
            typeof clickListener,
            "function"
        );


        await clickListener({
            preventDefault() {}
        });


        assert.deepEqual(
            calls,
            [
                [
                    message,
                    "weapon-1"
                ]
            ]
        );

    }
);

test(
    "bindRangedAttackChatMessageInteractions raccorde Protection, Désarmement et l'application manuelle",
    () => {

        const message = {
            id:
                "message-1"
        };


        const html = {
            id:
                "html-1"
        };


        const runtime = {
            id:
                "runtime-1"
        };


        const protectionCalls =
            [];

        const disarmCalls =
            [];

        const applyCalls =
            [];


        bindRangedAttackChatMessageInteractions(
            message,
            html,
            runtime,
            {
                bindProtectionChoiceOnRender:
                    (
                        currentMessage,
                        currentHtml,
                        currentRuntime
                    ) => {

                        protectionCalls.push([
                            currentMessage,
                            currentHtml,
                            currentRuntime
                        ]);

                    },

                bindDisarmChoice:
                    (
                        currentMessage,
                        currentHtml,
                        currentRuntime
                    ) => {

                        disarmCalls.push([
                            currentMessage,
                            currentHtml,
                            currentRuntime
                        ]);

                    },

                bindApplyChoice:
                    (
                        currentMessage,
                        currentHtml,
                        currentRuntime
                    ) => {

                        applyCalls.push([
                            currentMessage,
                            currentHtml,
                            currentRuntime
                        ]);

                    }
            }
        );


        assert.deepEqual(
            protectionCalls,
            [
                [
                    message,
                    html,
                    runtime
                ]
            ]
        );


        assert.deepEqual(
            disarmCalls,
            [
                [
                    message,
                    html,
                    runtime
                ]
            ]
        );


        assert.deepEqual(
            applyCalls,
            [
                [
                    message,
                    html,
                    runtime
                ]
            ]
        );

    }
);

test(
    "registerYZERollChatHooks raccorde le choix de Désarmement au hook renderChatMessageHTML",
    () => {

        const previousHooks =
            globalThis.Hooks;

        const previousGame =
            globalThis.game;

        const previousFromUuid =
            globalThis.fromUuid;

        const previousUi =
            globalThis.ui;


        const registeredHooks =
            new Map();


        globalThis.Hooks = {

            on(
                hookName,
                callback
            ) {

                registeredHooks.set(
                    hookName,
                    callback
                );

            }

        };


        globalThis.game = {

            actors: {
                get:
                    () => null
            },

            combats: {
                get:
                    () => null
            },

            combat:
                null

        };


        globalThis.fromUuid =
            async () => null;


        globalThis.ui = {

            notifications: {
                error:
                    () => {}
            }

        };


        try {

            registerYZERollChatHooks();


            const renderHook =
                registeredHooks.get(
                    "renderChatMessageHTML"
                );


            assert.equal(
                typeof renderHook,
                "function"
            );


            const message = {
                id:
                    "message-1"
            };


            const calls =
                [];


            const button = {

                disabled:
                    false,

                dataset: {
                    itemId:
                        "weapon-1"
                },

                addEventListener(
                    eventName,
                    listener
                ) {

                    calls.push([
                        "listener",
                        eventName,
                        listener
                    ]);

                }

            };


            const html = {

                querySelectorAll(
                    selector
                ) {

                    calls.push([
                        "queryAll",
                        selector
                    ]);


                    if (
                        selector ===
                        '[data-action="resolve-ranged-disarm"]'
                    ) {
                        return [
                            button
                        ];
                    }


                    return [];

                },

                querySelector(
                    selector
                ) {

                    calls.push([
                        "query",
                        selector
                    ]);


                    return null;

                }

            };


            renderHook(
                message,
                html
            );


            const disarmQuery =
                calls.find(
                    call =>
                        call[0] ===
                            "queryAll"
                        &&
                        call[1] ===
                            '[data-action="resolve-ranged-disarm"]'
                );


            assert.ok(
                disarmQuery
            );


            const clickListener =
                calls.find(
                    call =>
                        call[0] ===
                            "listener"
                        &&
                        call[1] ===
                            "click"
                );


            assert.ok(
                clickListener
            );

        }
        finally {

            globalThis.Hooks =
                previousHooks;

            globalThis.game =
                previousGame;

            globalThis.fromUuid =
                previousFromUuid;

            globalThis.ui =
                previousUi;

        }

    }
);

test(
    "resolveFinalizedRangedAttackMessage demande les éclats avant de résoudre les conséquences",
    async () => {

        const {
            resolveFinalizedRangedAttackMessage
        } =
            await import(
                "../../../src/foundry/chat/yze-roll-chat-hooks.mjs"
            );


        const calls =
            [];


        const message = {
            id:
                "message-ranged-stunts"
        };


        const storedResult = {
            successes:
                3,

            context: {
                attack: {
                    type:
                        "ranged"
                }
            }
        };


        const consequenceResult = {
            vigorDamage:
                2
        };


        const protectionResult = {
            absorbedDamage:
                0
        };


        const applicationPlan = {
            vigorDamage:
                2
        };


        const applicationLedger = {
            operations:
                []
        };


        const result =
            await resolveFinalizedRangedAttackMessage(
                message,
                {
                    getStoredResult:
                        () =>
                            storedResult,

                    chooseStunts:
                        async result => {

                            calls.push(
                                "chooseStunts"
                            );


                            assert.equal(
                                result,
                                storedResult
                            );


                            return {
                                vigorDamage:
                                    1,

                                spiritDamage:
                                    0,

                                swapInitiative:
                                    false,

                                disarm:
                                    false,

                                knockdown:
                                    false
                            };

                        },

                    resolveConsequences:
                        async (
                            currentMessage,
                            {
                                stuntAllocation
                            } = {}
                        ) => {

                            calls.push(
                                "resolveConsequences"
                            );


                            assert.equal(
                                currentMessage,
                                message
                            );


                            assert.deepEqual(
                                stuntAllocation,
                                {
                                    vigorDamage:
                                        1,

                                    spiritDamage:
                                        0,

                                    swapInitiative:
                                        false,

                                    disarm:
                                        false,

                                    knockdown:
                                        false
                                }
                            );


                            return consequenceResult;

                        },

                    resolveTarget:
                        async () => ({
                            items:
                                []
                        }),

                    resolveProtection:
                        async () =>
                            protectionResult,

                    createApplicationPlan:
                        () =>
                            applicationPlan,

                    createApplicationLedger:
                        () =>
                            applicationLedger,

                    getBlockedOperations:
                        () =>
                            [],

                    resolveCombat:
                        () =>
                            null,

                    resolveAttacker:
                        async () =>
                            null,

                    validateInitiativeSwap:
                        () => {},

                    scheduleInitiativeSwap:
                        () => {},

                    applyApplicationLedger:
                        async () => {},

                    storeApplicationState:
                        async () => {},

                    renderStoredMessage:
                        async () => {}
                }
            );


        assert.deepEqual(
            calls,
            [
                "chooseStunts",
                "resolveConsequences"
            ]
        );


        assert.equal(
            result.consequenceResult,
            consequenceResult
        );

    }
);

test(
    "resolveFinalizedRangedAttackMessage interrompt la résolution avant P5 lorsque le choix des éclats est annulé",
    async () => {

        const {
            resolveFinalizedRangedAttackMessage
        } =
            await import(
                "../../../src/foundry/chat/yze-roll-chat-hooks.mjs"
            );


        const message = {
            id:
                "message-ranged-stunts-cancelled"
        };


        const storedResult = {
            successes:
                3,

            context: {
                attack: {
                    type:
                        "ranged"
                }
            }
        };


        let resolveConsequencesCalls =
            0;


        let resolveTargetCalls =
            0;


        let resolveProtectionCalls =
            0;


        let createApplicationPlanCalls =
            0;


        let createApplicationLedgerCalls =
            0;


        let applyApplicationLedgerCalls =
            0;


        const result =
            await resolveFinalizedRangedAttackMessage(
                message,
                {
                    getStoredResult:
                        currentMessage => {

                            assert.equal(
                                currentMessage,
                                message
                            );


                            return storedResult;

                        },

                    chooseStunts:
                        async currentResult => {

                            assert.equal(
                                currentResult,
                                storedResult
                            );


                            return null;

                        },

                    resolveConsequences:
                        async () => {

                            resolveConsequencesCalls +=
                                1;


                            return {};

                        },

                    resolveTarget:
                        async () => {

                            resolveTargetCalls +=
                                1;


                            return {
                                items:
                                    []
                            };

                        },

                    resolveProtection:
                        async () => {

                            resolveProtectionCalls +=
                                1;


                            return {};

                        },

                    createApplicationPlan:
                        () => {

                            createApplicationPlanCalls +=
                                1;


                            return {};

                        },

                    createApplicationLedger:
                        () => {

                            createApplicationLedgerCalls +=
                                1;


                            return {
                                operations:
                                    []
                            };

                        },

                    getBlockedOperations:
                        () =>
                            [],

                    resolveCombat:
                        () =>
                            null,

                    resolveAttacker:
                        async () =>
                            null,

                    validateInitiativeSwap:
                        () => {},

                    scheduleInitiativeSwap:
                        () => {},

                    applyApplicationLedger:
                        async () => {

                            applyApplicationLedgerCalls +=
                                1;

                        },

                    storeApplicationState:
                        async () => {},

                    renderStoredMessage:
                        async () => {}
                }
            );


        assert.equal(
            result,
            null
        );


        assert.equal(
            resolveConsequencesCalls,
            0
        );


        assert.equal(
            resolveTargetCalls,
            0
        );


        assert.equal(
            resolveProtectionCalls,
            0
        );


        assert.equal(
            createApplicationPlanCalls,
            0
        );


        assert.equal(
            createApplicationLedgerCalls,
            0
        );


        assert.equal(
            applyApplicationLedgerCalls,
            0
        );

    }
);



test(
    "createRangedAttackResolutionDependencies raccorde le choix des éclats et leur allocation à P5",
    async () => {

        const {
            createRangedAttackResolutionDependencies
        } =
            await import(
                "../../../src/foundry/chat/yze-roll-chat-hooks.mjs"
            );


        const storedResult = {
            successes:
                3
        };


        const allocation = {
            vigorDamage:
                1,

            spiritDamage:
                0,

            swapInitiative:
                true,

            disarm:
                false,

            knockdown:
                false
        };


        let chooseAllocationCalls =
            0;


        let receivedRollResult =
            null;


        let receivedDialog =
            null;


        let receivedMessage =
            null;


        let receivedStuntAllocation =
            null;


        const rangedStuntDialog = {

            async chooseAllocation({
                rollResult,
                dialog
            }) {

                chooseAllocationCalls +=
                    1;


                receivedRollResult =
                    rollResult;


                receivedDialog =
                    dialog;


                return allocation;

            }

        };


        const foundryDialog = {
            prompt() {
                throw new Error(
                    "Ce faux dialogue ne doit pas être appelé directement par la composition."
                );
            }
        };


        const rangedAttackResolutionService = {

            async resolveMessage(
                message,
                options
            ) {

                receivedMessage =
                    message;


                receivedStuntAllocation =
                    options?.stuntAllocation;


                return {
                    resolved:
                        true
                };

            }

        };


        const dependencies =
            createRangedAttackResolutionDependencies({
                rangedStuntDialog,
                foundryDialog,
                rangedAttackResolutionService
            });


        const chosenAllocation =
            await dependencies.chooseStunts(
                storedResult
            );


        assert.equal(
            chooseAllocationCalls,
            1
        );


        assert.equal(
            receivedRollResult,
            storedResult
        );


        assert.equal(
            receivedDialog,
            foundryDialog
        );


        assert.equal(
            chosenAllocation,
            allocation
        );


        const message = {
            id:
                "message-ranged-resolution-dependencies"
        };


        const consequenceResult =
            await dependencies.resolveConsequences(
                message,
                {
                    stuntAllocation:
                        chosenAllocation
                }
            );


        assert.equal(
            receivedMessage,
            message
        );


        assert.equal(
            receivedStuntAllocation,
            allocation
        );


        assert.deepEqual(
            consequenceResult,
            {
                resolved:
                    true
            }
        );

    }
);

test(
    "createRangedAttackResolutionDependencies transmet au sélecteur le caractère explosif de l'attaque sérialisée",
    async () => {

        const {
            createRangedAttackResolutionDependencies
        } =
            await import(
                "../../../src/foundry/chat/yze-roll-chat-hooks.mjs"
            );


        const storedResult = {

            successes:
                2,

            context: {

                attack: {

                    type:
                        "ranged",

                    weapon: {

                        explosive:
                            true

                    }

                }

            }

        };


        let receivedExplosive =
            null;


        const rangedStuntDialog = {

            async chooseAllocation({
                explosive
            }) {

                receivedExplosive =
                    explosive;


                return {
                    grenade:
                        true
                };

            }

        };


        const dependencies =
            createRangedAttackResolutionDependencies({

                rangedStuntDialog,

                foundryDialog: {
                    prompt() {
                        // Sans effet pour ce test.
                    }
                },

                rangedAttackResolutionService: {
                    async resolveMessage() {
                        return {};
                    }
                }

            });


        const allocation =
            await dependencies.chooseStunts(
                storedResult
            );


        assert.equal(
            receivedExplosive,
            true
        );


        assert.deepEqual(
            allocation,
            {
                grenade:
                    true
            }
        );

    }
);

test(
    "finalizeRangedAttackMessage prépare les éclats avant de finaliser et annule sans finaliser",
    async () => {

        const {
            finalizeRangedAttackMessage
        } =
            await import(
                "../../../src/foundry/chat/yze-roll-chat-hooks.mjs"
            );


        const message = {
            id:
                "ranged-finalization-cancelled"
        };


        const calls =
            [];


        const result =
            await finalizeRangedAttackMessage(
                message,
                {
                    chooseStunts:
                        async currentMessage => {

                            calls.push(
                                "choose-stunts"
                            );


                            assert.equal(
                                currentMessage,
                                message
                            );


                            return null;

                        },

                    finalizeMessage:
                        async () => {

                            calls.push(
                                "finalize"
                            );

                        },

                    resolveFinalizedMessage:
                        async () => {

                            calls.push(
                                "resolve"
                            );


                            return {
                                resolved:
                                    true
                            };

                        }
                }
            );


        assert.equal(
            result,
            null
        );


        assert.deepEqual(
            calls,
            [
                "choose-stunts"
            ]
        );

    }
);

test(
    "finalizeRangedAttackMessage finalise après le choix puis transmet la même allocation à la résolution",
    async () => {

        const {
            finalizeRangedAttackMessage
        } =
            await import(
                "../../../src/foundry/chat/yze-roll-chat-hooks.mjs"
            );


        const message = {
            id:
                "ranged-finalization-confirmed"
        };


        const stuntAllocation = {

            vigorDamage:
                1,

            spiritDamage:
                0,

            swapInitiative:
                true,

            disarm:
                false,

            knockdown:
                false

        };


        const calls =
            [];


        let receivedMessage =
            null;


        let receivedStuntAllocation =
            null;


        const result =
            await finalizeRangedAttackMessage(
                message,
                {
                    chooseStunts:
                        async currentMessage => {

                            calls.push(
                                "choose-stunts"
                            );


                            assert.equal(
                                currentMessage,
                                message
                            );


                            return stuntAllocation;

                        },

                    finalizeMessage:
                        async currentMessage => {

                            calls.push(
                                "finalize"
                            );


                            assert.equal(
                                currentMessage,
                                message
                            );

                        },

                    resolveFinalizedMessage:
                        async (
                            currentMessage,
                            {
                                stuntAllocation:
                                    currentStuntAllocation
                            } = {}
                        ) => {

                            calls.push(
                                "resolve"
                            );


                            receivedMessage =
                                currentMessage;


                            receivedStuntAllocation =
                                currentStuntAllocation;


                            return {
                                resolved:
                                    true
                            };

                        }
                }
            );


        assert.deepEqual(
            calls,
            [
                "choose-stunts",
                "finalize",
                "resolve"
            ]
        );


        assert.equal(
            receivedMessage,
            message
        );


        assert.equal(
            receivedStuntAllocation,
            stuntAllocation
        );


        assert.deepEqual(
            result,
            {
                resolved:
                    true
            }
        );

    }
);

test(
    "resolveFinalizedRangedAttackMessage utilise l'allocation déjà préparée sans redemander les éclats",
    async () => {

        const {
            resolveFinalizedRangedAttackMessage
        } =
            await import(
                "../../../src/foundry/chat/yze-roll-chat-hooks.mjs"
            );


        const message = {
            id:
                "ranged-prepared-stunts"
        };


        const storedResult = {

            successes:
                2,

            context: {

                attack: {

                    type:
                        "ranged"

                }

            }

        };


        const stuntAllocation = {

            vigorDamage:
                1,

            spiritDamage:
                0,

            swapInitiative:
                false,

            disarm:
                false,

            knockdown:
                false

        };


        let chooseStuntsCalls =
            0;


        let receivedStuntAllocation =
            null;


        await resolveFinalizedRangedAttackMessage(
            message,
            {
                stuntAllocation,

                getStoredResult:
                    currentMessage => {

                        assert.equal(
                            currentMessage,
                            message
                        );


                        return storedResult;

                    },

                chooseStunts:
                    async () => {

                        chooseStuntsCalls +=
                            1;


                        throw new Error(
                            "Les éclats ne doivent pas être redemandés."
                        );

                    },

                resolveConsequences:
                    async (
                        currentMessage,
                        options
                    ) => {

                        assert.equal(
                            currentMessage,
                            message
                        );


                        receivedStuntAllocation =
                            options?.stuntAllocation;


                        return {
                            hit:
                                false
                        };

                    },

                resolveTarget:
                    async () => null,

                resolveProtection:
                    async () => null,

                createApplicationPlan:
                    () => ({}),

                createApplicationLedger:
                    () => ({
                        operations:
                            []
                    }),

                getBlockedOperations:
                    () => [],

                storeApplicationState:
                    async () => {},

                renderStoredMessage:
                    async () => {},

                resolveCombat:
                    () => null,

                resolveAttacker:
                    async () => null,

                validateInitiativeSwap:
                    () => {},

                scheduleInitiativeSwap:
                    () => {},

                applyApplicationLedger:
                    async () => ({})
            }
        );


        assert.equal(
            chooseStuntsCalls,
            0
        );


        assert.equal(
            receivedStuntAllocation,
            stuntAllocation
        );

    }
);

test(
    "resolveFinalizedRangedAttackMessage considère une allocation vide comme déjà préparée",
    async () => {

        const {
            resolveFinalizedRangedAttackMessage
        } =
            await import(
                "../../../src/foundry/chat/yze-roll-chat-hooks.mjs"
            );


        const message = {
            id:
                "ranged-empty-prepared-stunts"
        };


        const storedResult = {

            successes:
                1,

            context: {

                attack: {

                    type:
                        "ranged"

                }

            }

        };


        const stuntAllocation =
            {};


        let chooseStuntsCalls =
            0;


        let receivedStuntAllocation =
            null;


        await resolveFinalizedRangedAttackMessage(
            message,
            {
                stuntAllocation,

                getStoredResult:
                    () =>
                        storedResult,

                chooseStunts:
                    async () => {

                        chooseStuntsCalls +=
                            1;


                        throw new Error(
                            "Une allocation vide déjà préparée ne doit pas rouvrir le choix des éclats."
                        );

                    },

                resolveConsequences:
                    async (
                        currentMessage,
                        options
                    ) => {

                        assert.equal(
                            currentMessage,
                            message
                        );


                        receivedStuntAllocation =
                            options?.stuntAllocation;


                        return {
                            hit:
                                false
                        };

                    },

                resolveTarget:
                    async () => null,

                resolveProtection:
                    async () => null,

                createApplicationPlan:
                    () => ({}),

                createApplicationLedger:
                    () => ({
                        operations:
                            []
                    }),

                getBlockedOperations:
                    () => [],

                storeApplicationState:
                    async () => {},

                renderStoredMessage:
                    async () => {},

                resolveCombat:
                    () => null,

                resolveAttacker:
                    async () => null,

                validateInitiativeSwap:
                    () => {},

                scheduleInitiativeSwap:
                    () => {},

                applyApplicationLedger:
                    async () => ({})
            }
        );


        assert.equal(
            chooseStuntsCalls,
            0
        );


        assert.equal(
            receivedStuntAllocation,
            stuntAllocation
        );


        assert.deepEqual(
            receivedStuntAllocation,
            {}
        );

    }
);

test(
    "finalizeYZERollMessageWithRangedPreparation utilise la finalisation préparée pour une attaque à distance",
    async () => {

        const {
            finalizeYZERollMessageWithRangedPreparation
        } =
            await import(
                "../../../src/foundry/chat/yze-roll-chat-hooks.mjs"
            );


        const message = {
            id:
                "ranged-finalization-routing"
        };


        const storedResult = {

            context: {

                attack: {

                    type:
                        "ranged"

                }

            }

        };


        const calls =
            [];


        const result =
            await finalizeYZERollMessageWithRangedPreparation(
                message,
                {
                    getStoredResult:
                        currentMessage => {

                            calls.push(
                                "get-stored-result"
                            );


                            assert.equal(
                                currentMessage,
                                message
                            );


                            return storedResult;

                        },

                    finalizeRangedAttack:
                        async currentMessage => {

                            calls.push(
                                "finalize-ranged"
                            );


                            assert.equal(
                                currentMessage,
                                message
                            );


                            return {
                                ranged:
                                    true
                            };

                        },

                    finalizeGenericRoll:
                        async () => {

                            calls.push(
                                "finalize-generic"
                            );


                            throw new Error(
                                "Une attaque à distance ne doit pas utiliser la finalisation générique."
                            );

                        }
                }
            );


        assert.deepEqual(
            calls,
            [
                "get-stored-result",
                "finalize-ranged"
            ]
        );


        assert.deepEqual(
            result,
            {
                ranged:
                    true
            }
        );

    }
);

test(
    "finalizeYZERollMessageWithRangedPreparation conserve la finalisation générique pour un jet non ranged",
    async () => {

        const {
            finalizeYZERollMessageWithRangedPreparation
        } =
            await import(
                "../../../src/foundry/chat/yze-roll-chat-hooks.mjs"
            );


        const message = {
            id:
                "generic-finalization-routing"
        };


        const storedResult = {

            context: {

                action:
                    "skill-roll"

            }

        };


        const calls =
            [];


        const result =
            await finalizeYZERollMessageWithRangedPreparation(
                message,
                {
                    getStoredResult:
                        currentMessage => {

                            calls.push(
                                "get-stored-result"
                            );


                            assert.equal(
                                currentMessage,
                                message
                            );


                            return storedResult;

                        },

                    finalizeRangedAttack:
                        async () => {

                            calls.push(
                                "finalize-ranged"
                            );


                            throw new Error(
                                "Un jet non ranged ne doit pas utiliser la finalisation préparée ranged."
                            );

                        },

                    finalizeGenericRoll:
                        async currentMessage => {

                            calls.push(
                                "finalize-generic"
                            );


                            assert.equal(
                                currentMessage,
                                message
                            );


                            return {
                                generic:
                                    true
                            };

                        }
                }
            );


        assert.deepEqual(
            calls,
            [
                "get-stored-result",
                "finalize-generic"
            ]
        );


        assert.deepEqual(
            result,
            {
                generic:
                    true
            }
        );

    }
);

test(
    "createRangedAttackMessageFinalization raccorde la préparation des éclats à la finalisation puis à la résolution",
    async () => {

        const {
            createRangedAttackMessageFinalization
        } =
            await import(
                "../../../src/foundry/chat/yze-roll-chat-hooks.mjs"
            );


        const message = {
            id:
                "ranged-production-finalization"
        };


        const storedResult = {

            successes:
                3,

            context: {

                attack: {

                    type:
                        "ranged",

                    weapon: {

                        explosive:
                            false

                    }

                }

            }

        };


        const stuntAllocation = {

            vigorDamage:
                1,

            spiritDamage:
                1

        };


        const calls =
            [];


        let receivedResolvedAllocation =
            null;


        const finalize =
            createRangedAttackMessageFinalization({
                getStoredResult:
                    currentMessage => {

                        calls.push(
                            "get-stored-result"
                        );


                        assert.equal(
                            currentMessage,
                            message
                        );


                        return storedResult;

                    },

                chooseStunts:
                    async currentStoredResult => {

                        calls.push(
                            "choose-stunts"
                        );


                        assert.equal(
                            currentStoredResult,
                            storedResult
                        );


                        return stuntAllocation;

                    },

                finalizeMessage:
                    async currentMessage => {

                        calls.push(
                            "finalize"
                        );


                        assert.equal(
                            currentMessage,
                            message
                        );

                    },

                resolveFinalizedMessage:
                    async (
                        currentMessage,
                        {
                            stuntAllocation:
                                currentStuntAllocation
                        } = {}
                    ) => {

                        calls.push(
                            "resolve"
                        );


                        assert.equal(
                            currentMessage,
                            message
                        );


                        receivedResolvedAllocation =
                            currentStuntAllocation;


                        return {
                            resolved:
                                true
                        };

                    }
            });


        const result =
            await finalize(
                message
            );


        assert.deepEqual(
            calls,
            [
                "get-stored-result",
                "choose-stunts",
                "finalize",
                "resolve"
            ]
        );


        assert.equal(
            receivedResolvedAllocation,
            stuntAllocation
        );


        assert.deepEqual(
            result,
            {
                resolved:
                    true
            }
        );

    }
);

test(
    "createFoundryRangedAttackStuntSelection raccorde le dialogue ranged au résultat stocké",
    async () => {

        const {
            createFoundryRangedAttackStuntSelection
        } =
            await import(
                "../../../src/foundry/chat/yze-roll-chat-hooks.mjs"
            );


        const storedResult = {

            successes:
                3,

            context: {

                attack: {

                    type:
                        "ranged",

                    weapon: {

                        explosive:
                            false

                    }

                }

            }

        };


        const stuntAllocation = {

            vigorDamage:
                2

        };


        const calls =
            [];


        const rangedStuntDialog = {

            async chooseAllocation({
                rollResult,
                explosive,
                dialog
            } = {}) {

                calls.push(
                    "choose-allocation"
                );


                assert.equal(
                    rollResult,
                    storedResult
                );


                assert.equal(
                    explosive,
                    false
                );


                assert.equal(
                    dialog,
                    foundryDialog
                );


                return stuntAllocation;

            }

        };


        const foundryDialog = {

            prompt:
                async () => {

                    throw new Error(
                        "Le test ne doit pas appeler directement le dialogue Foundry."
                    );

                }

        };


        const chooseStunts =
            createFoundryRangedAttackStuntSelection({
                rangedStuntDialog,
                foundryDialog
            });


        const result =
            await chooseStunts(
                storedResult
            );


        assert.deepEqual(
            calls,
            [
                "choose-allocation"
            ]
        );


        assert.equal(
            result,
            stuntAllocation
        );

    }
);

test(
    "createRangedAttackPreparedFinalization transmet à P5 l'allocation choisie avant finalisation",
    async () => {

        const {
            createRangedAttackPreparedFinalization
        } =
            await import(
                "../../../src/foundry/chat/yze-roll-chat-hooks.mjs"
            );


        const message = {
            id:
                "ranged-prepared-finalization"
        };


        const storedResult = {

            successes:
                3,

            context: {

                attack: {

                    type:
                        "ranged",

                    weapon: {

                        explosive:
                            false

                    }

                }

            }

        };


        const stuntAllocation = {

            vigorDamage:
                1,

            spiritDamage:
                1,

            swapInitiative:
                false,

            disarm:
                false,

            knockdown:
                false

        };


        const calls =
            [];


        let receivedP5Allocation =
            null;


        const finalize =
            createRangedAttackPreparedFinalization({
                getStoredResult:
                    currentMessage => {

                        calls.push(
                            "get-stored-result"
                        );


                        assert.equal(
                            currentMessage,
                            message
                        );


                        return storedResult;

                    },

                chooseStunts:
                    async currentStoredResult => {

                        calls.push(
                            "choose-stunts"
                        );


                        assert.equal(
                            currentStoredResult,
                            storedResult
                        );


                        return stuntAllocation;

                    },

                finalizeMessage:
                    async currentMessage => {

                        calls.push(
                            "finalize"
                        );


                        assert.equal(
                            currentMessage,
                            message
                        );

                    },

                resolveConsequences:
                    async (
                        currentMessage,
                        {
                            stuntAllocation:
                                currentStuntAllocation
                        } = {}
                    ) => {

                        calls.push(
                            "resolve-consequences"
                        );


                        assert.equal(
                            currentMessage,
                            message
                        );


                        receivedP5Allocation =
                            currentStuntAllocation;


                        return {
                            hit:
                                false
                        };

                    },

                resolveFinalizedRangedAttack:
                    async (
                        currentMessage,
                        {
                            stuntAllocation:
                                currentStuntAllocation,
                            resolveConsequences
                        } = {}
                    ) => {

                        calls.push(
                            "resolve-finalized-ranged"
                        );


                        assert.equal(
                            currentMessage,
                            message
                        );


                        return await resolveConsequences(
                            currentMessage,
                            {
                                stuntAllocation:
                                    currentStuntAllocation
                            }
                        );

                    }
            });


        const result =
            await finalize(
                message
            );


        assert.deepEqual(
            calls,
            [
                "get-stored-result",
                "choose-stunts",
                "finalize",
                "resolve-finalized-ranged",
                "resolve-consequences"
            ]
        );


        assert.equal(
            receivedP5Allocation,
            stuntAllocation
        );


        assert.deepEqual(
            result,
            {
                hit:
                    false
            }
        );

    }
);

test(
    "registerYZERollChatHooks ne finalise pas une attaque ranged annulée et réactive Finaliser",
    async () => {

        const {
            registerYZERollChatHooks
        } =
            await import(
                "../../../src/foundry/chat/yze-roll-chat-hooks.mjs"
            );


        const {
            YZERollChat
        } =
            await import(
                "../../../src/foundry/chat/yze-roll-chat.mjs"
            );


        const {
            RangedAttackResolutionService
        } =
            await import(
                "../../../src/combat/ranged-attack-resolution-service.mjs"
            );


        const {
            RangedStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/ranged-stunt-dialog.mjs"
            );


        const message = {
            id:
                "ranged-cancel-before-finalization"
        };


        const storedResult = {

            successes:
                2,

            context: {

                attack: {

                    type:
                        "ranged",

                    weapon: {

                        explosive:
                            false

                    }

                }

            }

        };


        let renderHook =
            null;


        let finalizeCalls =
            0;


        let resolveCalls =
            0;


        globalThis.Hooks = {

            on(
                hookName,
                callback
            ) {

                if (
                    hookName
                    === "renderChatMessageHTML"
                ) {

                    renderHook =
                        callback;

                }

            }

        };


        globalThis.game = {

            actors: {

                get:
                    () => null

            },

            combats: {

                get:
                    () => null

            }

        };


        globalThis.fromUuid =
            async () => null;


        globalThis.ui = {

            notifications: {

                error:
                    () => {}

            }

        };


        const finalizeButton = {

            disabled:
                false,

            listener:
                null,

            addEventListener(
                eventName,
                callback
            ) {

                assert.equal(
                    eventName,
                    "click"
                );


                this.listener =
                    callback;

            }

        };


        const html = {

            querySelector(
                selector
            ) {

                if (
                    selector
                    === '[data-action="finalize-yze-roll"]'
                ) {

                    return finalizeButton;

                }


                return null;

            },

            querySelectorAll:
                () => []

        };


        const originalGetStoredResult =
            YZERollChat.getStoredResult;


        const originalFinalizeMessage =
            YZERollChat.finalizeMessage;


        const originalResolveMessage =
            RangedAttackResolutionService.resolveMessage;


        const originalChooseAllocation =
            RangedStuntDialog.chooseAllocation;


        try {

            YZERollChat.getStoredResult =
                () =>
                    storedResult;


            YZERollChat.finalizeMessage =
                async () => {

                    finalizeCalls +=
                        1;

                };


            RangedAttackResolutionService.resolveMessage =
                async () => {

                    resolveCalls +=
                        1;


                    return {};

                };


            RangedStuntDialog.chooseAllocation =
                async () =>
                    null;


            registerYZERollChatHooks();


            assert.equal(
                typeof renderHook,
                "function"
            );


            renderHook(
                message,
                html
            );


            assert.equal(
                typeof finalizeButton.listener,
                "function"
            );


            await finalizeButton.listener({
                preventDefault:
                    () => {}
            });


            assert.equal(
                finalizeCalls,
                0
            );


            assert.equal(
                resolveCalls,
                0
            );


            assert.equal(
                finalizeButton.disabled,
                false
            );

        }
        finally {

            YZERollChat.getStoredResult =
                originalGetStoredResult;


            YZERollChat.finalizeMessage =
                originalFinalizeMessage;


            RangedAttackResolutionService.resolveMessage =
                originalResolveMessage;


            RangedStuntDialog.chooseAllocation =
                originalChooseAllocation;

        }

    }
);

test(
    "registerYZERollChatHooks finalise une attaque ranged confirmée et transmet son allocation à P5",
    async () => {

        const {
            registerYZERollChatHooks
        } =
            await import(
                "../../../src/foundry/chat/yze-roll-chat-hooks.mjs"
            );


        const {
            YZERollChat
        } =
            await import(
                "../../../src/foundry/chat/yze-roll-chat.mjs"
            );


        const {
            RangedAttackResolutionService
        } =
            await import(
                "../../../src/combat/ranged-attack-resolution-service.mjs"
            );


        const {
            RangedStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/ranged-stunt-dialog.mjs"
            );


        const message = {
            id:
                "ranged-confirmed-before-finalization"
        };


        const storedResult = {

            successes:
                2,

            context: {

                attack: {

                    type:
                        "ranged",

                    weapon: {

                        explosive:
                            false

                    }

                }

            }

        };


        const stuntAllocation = {

            vigorDamage:
                1,

            spiritDamage:
                0,

            swapInitiative:
                false,

            disarm:
                false,

            knockdown:
                false

        };


        let renderHook =
            null;


        const calls =
            [];


        let receivedP5Allocation =
            null;


        globalThis.Hooks = {

            on(
                hookName,
                callback
            ) {

                if (
                    hookName
                    === "renderChatMessageHTML"
                ) {

                    renderHook =
                        callback;

                }

            }

        };


        globalThis.game = {

            actors: {

                get:
                    () => null

            },

            combats: {

                get:
                    () => null

            }

        };


        globalThis.fromUuid =
            async () => null;


        globalThis.ui = {

            notifications: {

                error:
                    () => {}

            }

        };


        const finalizeButton = {

            disabled:
                false,

            listener:
                null,

            addEventListener(
                eventName,
                callback
            ) {

                assert.equal(
                    eventName,
                    "click"
                );


                this.listener =
                    callback;

            }

        };


        const html = {

            querySelector(
                selector
            ) {

                if (
                    selector
                    === '[data-action="finalize-yze-roll"]'
                ) {

                    return finalizeButton;

                }


                return null;

            },

            querySelectorAll:
                () => []

        };


        const originalGetStoredResult =
            YZERollChat.getStoredResult;


        const originalFinalizeMessage =
            YZERollChat.finalizeMessage;


        const originalResolveMessage =
            RangedAttackResolutionService.resolveMessage;


        const originalChooseAllocation =
            RangedStuntDialog.chooseAllocation;


        try {

            YZERollChat.getStoredResult =
                () =>
                    storedResult;


            RangedStuntDialog.chooseAllocation =
                async () => {

                    calls.push(
                        "choose-stunts"
                    );


                    return stuntAllocation;

                };


            YZERollChat.finalizeMessage =
                async () => {

                    calls.push(
                        "finalize"
                    );

                };


            RangedAttackResolutionService.resolveMessage =
                async (
                    currentMessage,
                    {
                        stuntAllocation:
                            currentStuntAllocation
                    } = {}
                ) => {

                    calls.push(
                        "resolve-p5"
                    );


                    assert.equal(
                        currentMessage,
                        message
                    );


                    receivedP5Allocation =
                        currentStuntAllocation;


                    return {
                        hit:
                            false
                    };

                };


            registerYZERollChatHooks();


            assert.equal(
                typeof renderHook,
                "function"
            );


            renderHook(
                message,
                html
            );


            assert.equal(
                typeof finalizeButton.listener,
                "function"
            );


            await finalizeButton.listener({
                preventDefault:
                    () => {}
            });


            assert.deepEqual(
                calls,
                [
                    "choose-stunts",
                    "finalize",
                    "resolve-p5"
                ]
            );


            assert.equal(
                receivedP5Allocation,
                stuntAllocation
            );

        }
        finally {

            YZERollChat.getStoredResult =
                originalGetStoredResult;


            YZERollChat.finalizeMessage =
                originalFinalizeMessage;


            RangedAttackResolutionService.resolveMessage =
                originalResolveMessage;


            RangedStuntDialog.chooseAllocation =
                originalChooseAllocation;

        }

    }
);

test(
    "registerYZERollChatHooks finalise une attaque ranged confirmée et transmet son allocation à P5",
    async () => {

        const {
            registerYZERollChatHooks
        } =
            await import(
                "../../../src/foundry/chat/yze-roll-chat-hooks.mjs"
            );


        const {
            YZERollChat
        } =
            await import(
                "../../../src/foundry/chat/yze-roll-chat.mjs"
            );


        const {
            RangedAttackResolutionService
        } =
            await import(
                "../../../src/combat/ranged-attack-resolution-service.mjs"
            );


        const {
            RangedStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/ranged-stunt-dialog.mjs"
            );


        const message = {
            id:
                "ranged-confirmed-before-finalization"
        };


        const storedResult = {

            successes:
                3,

            context: {

                attack: {

                    type:
                        "ranged",

                    weapon: {

                        explosive:
                            false

                    }

                }

            }

        };


        const stuntAllocation = {

            vigorDamage:
                1,

            spiritDamage:
                1,

            swapInitiative:
                false,

            disarm:
                false,

            knockdown:
                false

        };


        const calls =
            [];


        let renderHook =
            null;


        let receivedP5Allocation =
            null;


        globalThis.Hooks = {

            on(
                hookName,
                callback
            ) {

                if (
                    hookName
                    === "renderChatMessageHTML"
                ) {

                    renderHook =
                        callback;

                }

            }

        };


        globalThis.game = {

            actors: {

                get:
                    () => null

            },

            combats: {

                get:
                    () => null

            }

        };


        globalThis.fromUuid =
            async () => null;


        globalThis.ui = {

            notifications: {

                error:
                    () => {}

            }

        };


        const finalizeButton = {

            disabled:
                false,

            listener:
                null,

            addEventListener(
                eventName,
                callback
            ) {

                assert.equal(
                    eventName,
                    "click"
                );


                this.listener =
                    callback;

            }

        };


        const html = {

            querySelector(
                selector
            ) {

                if (
                    selector
                    === '[data-action="finalize-yze-roll"]'
                ) {

                    return finalizeButton;

                }


                return null;

            },

            querySelectorAll:
                () => []

        };


        const originalGetStoredResult =
            YZERollChat.getStoredResult;


        const originalFinalizeMessage =
            YZERollChat.finalizeMessage;


        const originalResolveMessage =
            RangedAttackResolutionService.resolveMessage;


        const originalResolveProtection =
            RangedAttackResolutionService.resolveProtection;


        const originalChooseAllocation =
            RangedStuntDialog.chooseAllocation;


        try {

            YZERollChat.getStoredResult =
                () =>
                    storedResult;


            RangedStuntDialog.chooseAllocation =
                async ({
                    rollResult,
                    explosive
                }) => {

                    calls.push(
                        "choose-stunts"
                    );


                    assert.equal(
                        rollResult,
                        storedResult
                    );


                    assert.equal(
                        explosive,
                        false
                    );


                    return stuntAllocation;

                };


            YZERollChat.finalizeMessage =
                async currentMessage => {

                    calls.push(
                        "finalize"
                    );


                    assert.equal(
                        currentMessage,
                        message
                    );


                    return currentMessage;

                };


            RangedAttackResolutionService.resolveMessage =
                async (
                    currentMessage,
                    {
                        stuntAllocation:
                            currentStuntAllocation
                    } = {}
                ) => {

                    calls.push(
                        "resolve-consequences"
                    );


                    assert.equal(
                        currentMessage,
                        message
                    );


                    receivedP5Allocation =
                        currentStuntAllocation;


                    return {
                        hit:
                            false
                    };

                };


            /*
             * Une attaque ratée n'a pas besoin d'une
             * résolution de Protection réelle pour ce test.
             *
             * Cette frontière est neutralisée ici afin que
             * A3.189 reste centré sur le transport de
             * l'allocation jusqu'à P5.
             */
            RangedAttackResolutionService.resolveProtection =
                () => ({

                    remainingDamage:
                        0,

                    protectionDamage:
                        0,

                    protection:
                        null

                });


            registerYZERollChatHooks();


            assert.equal(
                typeof renderHook,
                "function"
            );


            renderHook(
                message,
                html
            );


            assert.equal(
                typeof finalizeButton.listener,
                "function"
            );


            await finalizeButton.listener({
                preventDefault:
                    () => {}
            });


            assert.deepEqual(
                calls,
                [
                    "choose-stunts",
                    "finalize",
                    "resolve-consequences"
                ]
            );


            assert.equal(
                receivedP5Allocation,
                stuntAllocation
            );

        }
        finally {

            YZERollChat.getStoredResult =
                originalGetStoredResult;


            YZERollChat.finalizeMessage =
                originalFinalizeMessage;


            RangedAttackResolutionService.resolveMessage =
                originalResolveMessage;


            RangedAttackResolutionService.resolveProtection =
                originalResolveProtection;


            RangedStuntDialog.chooseAllocation =
                originalChooseAllocation;

        }

    }
);

test(
    "createFoundryRangedAttackChatRuntime raccorde l'initiative au contrat réel de InitiativeSwapService",
    async () => {

        const {
            createFoundryRangedAttackChatRuntime
        } =
            await import(
                "../../../src/foundry/chat/yze-roll-chat-hooks.mjs"
            );


        const {
            InitiativeSwapService
        } =
            await import(
                "../../../src/combat/initiative-swap-service.mjs"
            );


        const combat = {
            id:
                "combat-1"
        };


        const attacker = {
            id:
                "attacker-1"
        };


        const target = {
            id:
                "target-1"
        };


        const participants = {
            combatId:
                "combat-1"
        };


        const scheduledSwap = {
            scheduled:
                true,

            applied:
                false
        };


        const calls =
            [];


        const originalGetParticipants =
            InitiativeSwapService.getParticipants;


        const originalScheduleSwap =
            InitiativeSwapService.scheduleSwap;


        try {

            InitiativeSwapService.getParticipants =
                (
                    receivedCombat,
                    receivedAttacker,
                    receivedTarget
                ) => {

                    calls.push(
                        "validate"
                    );


                    assert.equal(
                        receivedCombat,
                        combat
                    );


                    assert.equal(
                        receivedAttacker,
                        attacker
                    );


                    assert.equal(
                        receivedTarget,
                        target
                    );


                    return participants;

                };


            InitiativeSwapService.scheduleSwap =
                async (
                    receivedCombat,
                    receivedAttacker,
                    receivedTarget
                ) => {

                    calls.push(
                        "schedule"
                    );


                    assert.equal(
                        receivedCombat,
                        combat
                    );


                    assert.equal(
                        receivedAttacker,
                        attacker
                    );


                    assert.equal(
                        receivedTarget,
                        target
                    );


                    return scheduledSwap;

                };


            const runtime =
                createFoundryRangedAttackChatRuntime({
                    resolveUuid:
                        async () => null,

                    getActorById:
                        () => null,

                    getCombatById:
                        () => null,

                    storeRangedAttackApplication:
                        async () => {},

                    rerenderStoredMessage:
                        async () => {},

                    resolveDisarmChoice:
                        () => null
                });


            const validationResult =
                runtime.validateInitiativeSwap(
                    combat,
                    attacker,
                    target
                );


            const scheduleResult =
                await runtime.scheduleInitiativeSwap(
                    combat,
                    attacker,
                    target
                );


            assert.equal(
                validationResult,
                participants
            );


            assert.equal(
                scheduleResult,
                scheduledSwap
            );


            assert.deepEqual(
                calls,
                [
                    "validate",
                    "schedule"
                ]
            );

        }
        finally {

            InitiativeSwapService.getParticipants =
                originalGetParticipants;


            InitiativeSwapService.scheduleSwap =
                originalScheduleSwap;

        }

    }
);


/* ============================================================
 * applyReadyRangedAttackLedger
 *
 * Harmonisation UX du Tir (Bible v0.9.3 §163, décision D2) :
 * applyReadyRangedAttackLedger est désormais le SEUL point
 * d'application du ledger d'attaque à distance (P6), déclenché
 * exclusivement par le clic explicite sur
 * « Résoudre les dégâts ».
 * ============================================================ */


test(
    "applyReadyRangedAttackLedger applique le ledger READY puis termine le checkpoint",
    async () => {

        const message = {
            id:
                "message-1"
        };

        const target = {
            id:
                "target-1"
        };

        const attacker = {
            id:
                "attacker-1"
        };

        const combat = {
            id:
                "combat-1"
        };

        const applicationLedger = {
            operations: [
                {
                    type:
                        "attribute-damage",

                    attribute:
                        "vigor",

                    amount:
                        2,

                    status:
                        "pending"
                }
            ]
        };

        const applicationState = {
            status:
                "ready",

            protectionResult: {
                remainingDamage:
                    2,

                protectionDamage:
                    0
            },

            applicationLedger,

            blockedOperations:
                []
        };

        const storedResult = {
            context: {
                target: {
                    actorUuid:
                        "Actor.target-1"
                }
            }
        };


        const calls =
            [];


        const result =
            await applyReadyRangedAttackLedger(
                message,
                {
                    getApplicationState:
                        currentMessage => {

                            calls.push([
                                "getApplicationState",
                                currentMessage
                            ]);


                            return applicationState;

                        },

                    getStoredResult:
                        currentMessage => {

                            calls.push([
                                "getStoredResult",
                                currentMessage
                            ]);


                            return storedResult;

                        },

                    resolveTarget:
                        async currentStoredResult => {

                            calls.push([
                                "resolveTarget",
                                currentStoredResult
                            ]);


                            return target;

                        },

                    resolveAttacker:
                        async currentStoredResult => {

                            calls.push([
                                "resolveAttacker",
                                currentStoredResult
                            ]);


                            return attacker;

                        },

                    resolveCombat:
                        currentStoredResult => {

                            calls.push([
                                "resolveCombat",
                                currentStoredResult
                            ]);


                            return combat;

                        },

                    applyApplicationLedger:
                        async ({
                            ledger,
                            actor,
                            combat:
                                appliedCombat,
                            attacker:
                                appliedAttacker,
                            validateInitiativeSwap,
                            scheduleInitiativeSwap
                        }) => {

                            calls.push([
                                "applyApplicationLedger",
                                ledger,
                                actor,
                                appliedCombat,
                                appliedAttacker,
                                validateInitiativeSwap,
                                scheduleInitiativeSwap
                            ]);

                        },

                    validateInitiativeSwap:
                        "validate-initiative-swap",

                    scheduleInitiativeSwap:
                        "schedule-initiative-swap",

                    storeApplicationState:
                        async (
                            currentMessage,
                            state
                        ) => {

                            calls.push([
                                "storeApplicationState",
                                currentMessage,
                                state
                            ]);

                        },

                    renderStoredMessage:
                        async currentMessage => {

                            calls.push([
                                "renderStoredMessage",
                                currentMessage
                            ]);

                        }
                }
            );


        assert.deepEqual(
            calls,
            [
                [
                    "getApplicationState",
                    message
                ],

                [
                    "getStoredResult",
                    message
                ],

                [
                    "resolveTarget",
                    storedResult
                ],

                [
                    "resolveAttacker",
                    storedResult
                ],

                [
                    "resolveCombat",
                    storedResult
                ],

                [
                    "applyApplicationLedger",
                    applicationLedger,
                    target,
                    combat,
                    attacker,
                    "validate-initiative-swap",
                    "schedule-initiative-swap"
                ],

                [
                    "storeApplicationState",
                    message,
                    {
                        status:
                            "applied",

                        protectionResult:
                            applicationState.protectionResult,

                        applicationLedger,

                        blockedOperations:
                            []
                    }
                ],

                [
                    "renderStoredMessage",
                    message
                ]
            ]
        );


        assert.deepEqual(
            result,
            applicationState
        );

    }
);


test(
    "applyReadyRangedAttackLedger refuse d'appliquer un checkpoint déjà appliqué",
    async () => {

        const message = {
            id:
                "message-1"
        };


        let applyApplicationLedgerCalled =
            false;


        await assert.rejects(
            () =>
                applyReadyRangedAttackLedger(
                    message,
                    {
                        getApplicationState:
                            () => ({
                                status:
                                    "applied"
                            }),

                        applyApplicationLedger:
                            async () => {

                                applyApplicationLedgerCalled =
                                    true;

                            }
                    }
                ),
            /déjà terminée/
        );


        assert.equal(
            applyApplicationLedgerCalled,
            false
        );

    }
);


test(
    "applyReadyRangedAttackLedger refuse d'appliquer un checkpoint encore bloqué",
    async () => {

        const message = {
            id:
                "message-1"
        };


        let applyApplicationLedgerCalled =
            false;


        await assert.rejects(
            () =>
                applyReadyRangedAttackLedger(
                    message,
                    {
                        getApplicationState:
                            () => ({
                                status:
                                    "blocked"
                            }),

                        applyApplicationLedger:
                            async () => {

                                applyApplicationLedgerCalled =
                                    true;

                            }
                    }
                ),
            /ne peuvent pas être appliqués/
        );


        assert.equal(
            applyApplicationLedgerCalled,
            false
        );

    }
);


test(
    "applyReadyRangedAttackLedger refuse d'appliquer un checkpoint absent",
    async () => {

        const message = {
            id:
                "message-1"
        };


        await assert.rejects(
            () =>
                applyReadyRangedAttackLedger(
                    message,
                    {
                        getApplicationState:
                            () =>
                                null
                    }
                ),
            /ne peuvent pas être appliqués/
        );

    }
);


/* ============================================================
 * bindRangedAttackApplyChoice
 * ============================================================ */


test(
    "bindRangedAttackApplyChoice transmet le message au runtime et désactive le bouton pendant l'appel",
    async () => {

        const message = {
            id:
                "message-1"
        };


        const calls =
            [];


        let clickListener =
            null;


        const button = {

            disabled:
                false,

            addEventListener(
                eventName,
                listener
            ) {

                if (
                    eventName ===
                    "click"
                ) {
                    clickListener =
                        listener;
                }

            }

        };


        const html = {

            querySelectorAll(
                selector
            ) {

                assert.equal(
                    selector,
                    '[data-action="apply-ranged-attack"]'
                );


                return [
                    button
                ];

            }

        };


        const runtime = {

            async resolveApplyChoiceFromMessage(
                currentMessage
            ) {

                calls.push(
                    currentMessage
                );


                assert.equal(
                    button.disabled,
                    true
                );

            }

        };


        bindRangedAttackApplyChoice(
            message,
            html,
            runtime
        );


        assert.equal(
            typeof clickListener,
            "function"
        );


        await clickListener({
            preventDefault() {}
        });


        assert.deepEqual(
            calls,
            [
                message
            ]
        );


        assert.equal(
            button.disabled,
            true
        );

    }
);


test(
    "bindRangedAttackApplyChoice réactive le bouton si l'application échoue",
    async () => {

        const message = {
            id:
                "message-1"
        };


        let clickListener =
            null;


        const button = {

            disabled:
                false,

            addEventListener(
                eventName,
                listener
            ) {

                if (
                    eventName ===
                    "click"
                ) {
                    clickListener =
                        listener;
                }

            }

        };


        const html = {

            querySelectorAll:
                () => [
                    button
                ]

        };


        const runtime = {

            async resolveApplyChoiceFromMessage() {

                throw new Error(
                    "échec applicatif"
                );

            }

        };


        bindRangedAttackApplyChoice(
            message,
            html,
            runtime
        );


        await assert.rejects(
            () =>
                clickListener({
                    preventDefault() {}
                }),
            /échec applicatif/
        );


        assert.equal(
            button.disabled,
            false
        );

    }
);


test(
    "bindRangedAttackApplyChoice ignore un second clic tant que le bouton est désactivé",
    async () => {

        const message = {
            id:
                "message-1"
        };


        let clickListener =
            null;


        const button = {

            disabled:
                true,

            addEventListener(
                eventName,
                listener
            ) {

                if (
                    eventName ===
                    "click"
                ) {
                    clickListener =
                        listener;
                }

            }

        };


        const html = {

            querySelectorAll:
                () => [
                    button
                ]

        };


        let callCount =
            0;


        const runtime = {

            async resolveApplyChoiceFromMessage() {

                callCount +=
                    1;

            }

        };


        bindRangedAttackApplyChoice(
            message,
            html,
            runtime
        );


        await clickListener({
            preventDefault() {}
        });


        assert.equal(
            callCount,
            0
        );

    }
);


/* ============================================================
 * applyReadyRangedAttackLedger — hook facultatif afterApply
 * (répartition des afflictions du jet du tireur, livre p.177)
 * ============================================================ */

function createReadyRangedAttackFixture({
    afterApply
} = {}) {

    const order = [];

    const message = { id: "message-afflictions" };
    const attacker = { id: "attacker-afflictions" };
    const target = { id: "target-afflictions" };
    const storedResult = { context: {} };

    const applicationState = {
        status: "ready",
        applicationLedger: { operations: [] },
        blockedOperations: []
    };

    const dependencies = {
        getApplicationState: () => applicationState,
        getStoredResult: () => storedResult,
        resolveTarget: async () => target,
        resolveAttacker: async () => attacker,
        resolveCombat: () => ({ id: "combat" }),
        applyApplicationLedger: async () => { order.push("apply"); },
        validateInitiativeSwap: () => {},
        scheduleInitiativeSwap: () => {},
        storeApplicationState: async () => { order.push("store"); },
        renderStoredMessage: async () => { order.push("render"); },
        ...(afterApply ? { afterApply } : {})
    };

    return { order, message, attacker, target, storedResult, dependencies };
}

test(
    "applyReadyRangedAttackLedger appelle afterApply une fois, APRÈS l'application et le rendu",
    async () => {

        const received = [];

        const fixture = createReadyRangedAttackFixture({
            afterApply: async payload => {
                received.push(payload);
                fixture.order.push("afterApply");
            }
        });

        await applyReadyRangedAttackLedger(
            fixture.message,
            fixture.dependencies
        );

        assert.deepEqual(
            fixture.order,
            ["apply", "store", "render", "afterApply"]
        );
        assert.equal(received.length, 1);
        assert.equal(received[0].message, fixture.message);
        assert.equal(received[0].storedResult, fixture.storedResult);
        assert.equal(received[0].attacker, fixture.attacker);
    }
);

test(
    "applyReadyRangedAttackLedger n'est jamais empêché par une erreur d'afterApply",
    async () => {

        const originalConsoleError = console.error;
        console.error = () => {};

        try {

            const fixture = createReadyRangedAttackFixture({
                afterApply: async () => { throw new Error("boom"); }
            });

            await assert.doesNotReject(
                applyReadyRangedAttackLedger(
                    fixture.message,
                    fixture.dependencies
                )
            );

        }
        finally {
            console.error = originalConsoleError;
        }
    }
);

test(
    "applyReadyRangedAttackLedger n'appelle pas afterApply si l'application est refusée",
    async () => {

        let called = false;

        const fixture = createReadyRangedAttackFixture({
            afterApply: async () => { called = true; }
        });

        fixture.dependencies.getApplicationState =
            () => ({ status: "applied" });

        await assert.rejects(
            applyReadyRangedAttackLedger(
                fixture.message,
                fixture.dependencies
            )
        );

        assert.equal(called, false);
    }
);


/* ============================================================
 * finalizeYZERollMessage — hook facultatif afterFinalize
 * (répartition des afflictions des jets sans étape de
 * dégâts/éclats, livre p.177)
 * ============================================================ */

test(
    "finalizeYZERollMessage appelle afterFinalize une fois, après finalisation et résolution",
    async () => {

        const order = [];
        const message = { id: "generic-1" };

        const outcome = await finalizeYZERollMessage(
            message,
            {
                finalizeMessage: async () => { order.push("finalize"); },
                resolveFinalizedMessage: async () => { order.push("resolve"); return "resolved"; },
                afterFinalize: async currentMessage => {
                    order.push(["after", currentMessage]);
                }
            }
        );

        assert.equal(outcome, "resolved");
        assert.deepEqual(order, ["finalize", "resolve", ["after", message]]);
    }
);

test(
    "finalizeYZERollMessage n'est jamais empêché par une erreur d'afterFinalize",
    async () => {

        const originalConsoleError = console.error;
        console.error = () => {};

        try {

            const outcome = await finalizeYZERollMessage(
                { id: "generic-2" },
                {
                    finalizeMessage: async () => {},
                    resolveFinalizedMessage: async () => "resolved",
                    afterFinalize: async () => { throw new Error("boom"); }
                }
            );

            assert.equal(outcome, "resolved");

        }
        finally {
            console.error = originalConsoleError;
        }
    }
);

test(
    "finalizeYZERollMessage n'appelle pas afterFinalize si la finalisation échoue",
    async () => {

        let called = false;

        await assert.rejects(
            finalizeYZERollMessage(
                { id: "generic-3" },
                {
                    finalizeMessage: async () => { throw new Error("KO"); },
                    resolveFinalizedMessage: async () => null,
                    afterFinalize: async () => { called = true; }
                }
            )
        );

        assert.equal(called, false);
    }
);
