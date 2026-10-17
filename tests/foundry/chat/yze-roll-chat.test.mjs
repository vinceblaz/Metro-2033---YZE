import test from "node:test";

import assert from "node:assert/strict";

import {
    DicePool
} from "../../../src/domain/rolls/dice-pool.mjs";

import {
    YZEResult
} from "../../../src/domain/rolls/yze-result.mjs";

import {
    YZERollChat
} from "../../../src/foundry/chat/yze-roll-chat.mjs";


/* ============================================================
 * HELPERS
 * ============================================================ */
globalThis.foundry = {

    utils: {

        deepClone(
            value
        ) {

            return structuredClone(
                value
            );

        }

    }

};

function createPool(
    overrides = {}
) {

    return new DicePool({

        attribute: 3,

        skill: 2,

        equipment: 1,

        bonus: 0,

        penalty: 0,

        stress: 0,

        ...overrides

    });

}


function createResult({
    pushCount = 0
} = {}) {

    return new YZEResult({

        pool:
            createPool(),

        successes:
            1,

        pushCount,

        dice: {

            attribute:
                [6, 3, 2],

            skill:
                [4, 5],

            equipment:
                [3],

            bonus:
                [],

            stress:
                []

        },

        context: {

            action:
                "ranged-attack",

            actorId:
                "actor-1",

            actorUuid:
                "Actor.actor-1",

            actorName:
                "Vladimir",

            attribute:
                "agility",

            skill:
                "shooting",

            attack: {

                type:
                    "ranged"

            }

        }

    });

}


/* ============================================================
 * VIEW MODEL — FINALISATION
 * ============================================================ */


test(
    "YZERollChat considère par défaut un résultat comme non finalisé",
    () => {

        const result =
            createResult({
                pushCount: 0
            });


        const viewModel =
            YZERollChat.createViewModel(
                result
            );


        assert.equal(
            viewModel.roll.finalized,
            false
        );


        assert.equal(
            viewModel.roll.canFinalize,
            true
        );

    }
);


test(
    "YZERollChat autorise le premier Push tant que R0 n'est pas finalisé",
    () => {

        const result =
            createResult({
                pushCount: 0
            });


        const viewModel =
            YZERollChat.createViewModel(
                result,
                {
                    finalized:
                        false
                }
            );


        assert.equal(
            viewModel.roll.canFirstPush,
            true
        );


        assert.equal(
            viewModel.roll.canSecondPush,
            false
        );


        assert.equal(
            viewModel.roll.canFinalize,
            true
        );

    }
);


test(
    "YZERollChat autorise le second Push tant que R1 n'est pas finalisé",
    () => {

        const result =
            createResult({
                pushCount: 1
            });


        const viewModel =
            YZERollChat.createViewModel(
                result,
                {
                    finalized:
                        false
                }
            );


        assert.equal(
            viewModel.roll.canFirstPush,
            false
        );


        assert.equal(
            viewModel.roll.canSecondPush,
            true
        );


        assert.equal(
            viewModel.roll.canFinalize,
            true
        );

    }
);


test(
    "YZERollChat distingue un Push épuisé d'un résultat finalisé",
    () => {

        const result =
            createResult({
                pushCount: 2
            });


        const viewModel =
            YZERollChat.createViewModel(
                result,
                {
                    finalized:
                        false
                }
            );


        assert.equal(
            viewModel.roll.pushFinished,
            true
        );


        assert.equal(
            viewModel.roll.finalized,
            false
        );


        assert.equal(
            viewModel.roll.canFirstPush,
            false
        );


        assert.equal(
            viewModel.roll.canSecondPush,
            false
        );


        assert.equal(
            viewModel.roll.canFinalize,
            true
        );

    }
);


test(
    "YZERollChat interdit tout Push lorsque le résultat est finalisé",
    () => {

        const result =
            createResult({
                pushCount: 0
            });


        const viewModel =
            YZERollChat.createViewModel(
                result,
                {
                    finalized:
                        true
                }
            );


        assert.equal(
            viewModel.roll.finalized,
            true
        );


        assert.equal(
            viewModel.roll.canFinalize,
            false
        );


        assert.equal(
            viewModel.roll.canFirstPush,
            false
        );


        assert.equal(
            viewModel.roll.canSecondPush,
            false
        );

    }
);


test(
    "YZERollChat conserve l'historique de Push après finalisation",
    () => {

        const result =
            createResult({
                pushCount: 2
            });


        const viewModel =
            YZERollChat.createViewModel(
                result,
                {
                    finalized:
                        true
                }
            );


        /*
         * La finalisation ne réécrit pas
         * l'histoire mécanique du jet.
         */
        assert.equal(
            viewModel.roll.pushCount,
            2
        );


        assert.equal(
            viewModel.roll.pushed,
            true
        );


        assert.equal(
            viewModel.roll.pushFinished,
            true
        );


        assert.equal(
            viewModel.roll.finalized,
            true
        );


        assert.equal(
            viewModel.roll.canFinalize,
            false
        );

    }
);

test(
    "YZERollChat lit un résultat non finalisé depuis le flag du message",
    () => {

        const message = {

            getFlag(
                systemId,
                flagName
            ) {

                assert.equal(
                    systemId,
                    "metro-2033-yze"
                );

                assert.equal(
                    flagName,
                    "yzeRoll"
                );

                return {
                    finalized: false
                };

            }

        };

        assert.equal(
            YZERollChat.isFinalized(
                message
            ),
            false
        );

    }
);


test(
    "YZERollChat lit un résultat finalisé depuis le flag du message",
    () => {

        const message = {

            getFlag() {

                return {
                    finalized: true
                };

            }

        };

        assert.equal(
            YZERollChat.isFinalized(
                message
            ),
            true
        );

    }
);


test(
    "YZERollChat considère un ancien flag sans finalized comme non finalisé",
    () => {

        const message = {

            getFlag() {

                return {
                    pushCount: 1
                };

            }

        };

        assert.equal(
            YZERollChat.isFinalized(
                message
            ),
            false
        );

    }
);

test(
    "YZERollChat finalise un message en persistant finalized=true",
    async () => {

        const originalRender =
            YZERollChat.render;


        const storedData = {

            successes: 1,

            pushCount: 0,

            dice: {},

            history: [],

            context: {},

            stressAfflictions: 0,

            eliminatedStress: 0,

            pool: {
                attribute: 0,
                skill: 0,
                equipment: 0,
                stress: 0,
                bonus: 0,
                penalty: 0
            }

        };


        let updateData =
            null;


        const message = {

            getFlag() {

                return storedData;

            },

            async update(
                data
            ) {

                updateData =
                    data;

            }

        };


        /*
         * On isole ici la responsabilité
         * de persistance de finalizeMessage().
         *
         * Le rendu sera testé séparément.
         */
        YZERollChat.render =
            async () =>
                "<div>finalized</div>";


        try {

            await YZERollChat.finalizeMessage(
                message
            );


            assert.ok(
                updateData
            );


            assert.equal(
                updateData.content,
                "<div>finalized</div>"
            );


            assert.equal(
                updateData[
                    "flags.metro-2033-yze.yzeRoll"
                ].finalized,
                true
            );


            /*
             * La finalisation ne doit pas
             * détruire le résultat stocké.
             */
            assert.equal(
                updateData[
                    "flags.metro-2033-yze.yzeRoll"
                ].successes,
                1
            );


            assert.equal(
                updateData[
                    "flags.metro-2033-yze.yzeRoll"
                ].pushCount,
                0
            );

        }
        finally {

            YZERollChat.render =
                originalRender;

        }

    }
);


test(
    "YZERollChat rend la finalisation idempotente",
    async () => {

        const originalRender =
            YZERollChat.render;


        let updateCount =
            0;


        const message = {

            getFlag() {

                return {

                    finalized:
                        true

                };

            },

            async update() {

                updateCount +=
                    1;

            }

        };


        YZERollChat.render =
            async () =>
                "<div>finalized</div>";


        try {

            const returnedMessage =
                await YZERollChat.finalizeMessage(
                    message
                );


            assert.equal(
                returnedMessage,
                message
            );


            /*
             * Déjà finalisé :
             * aucune nouvelle écriture.
             */
            assert.equal(
                updateCount,
                0
            );

        }
        finally {

            YZERollChat.render =
                originalRender;

        }

    }
);


test(
    "YZERollChat persiste séparément l'état d'application d'une attaque à distance",
    async () => {

        const applicationState = {

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

            applicationLedger: {
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
                    }
                ]
            },

            blockedOperations: [
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


        let updateData =
            null;


        const message = {

            async update(
                data
            ) {

                updateData =
                    data;

            }

        };


        const returnedMessage =
            await YZERollChat
                .storeRangedAttackApplication(
                    message,
                    applicationState
                );


        assert.equal(
            returnedMessage,
            message
        );


        assert.ok(
            updateData
        );


        assert.deepEqual(
            updateData[
                "flags.metro-2033-yze.rangedAttackApplication"
            ],
            applicationState
        );


        assert.equal(
            Object.hasOwn(
                updateData,
                "flags.metro-2033-yze.yzeRoll"
            ),
            false
        );

    }
);

test(
    "YZERollChat relit l'état d'application d'une attaque à distance",
    () => {

        const applicationState = {

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

            applicationLedger: {
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
                    }
                ]
            },

            blockedOperations: [
                {
                    type:
                        "protection-damage",

                    status:
                        "blocked"
                }
            ]
        };


        const message = {

            getFlag(
                systemId,
                flagName
            ) {

                assert.equal(
                    systemId,
                    "metro-2033-yze"
                );

                assert.equal(
                    flagName,
                    "rangedAttackApplication"
                );


                return applicationState;

            }

        };


        assert.equal(
            YZERollChat.getRangedAttackApplication(
                message
            ),
            applicationState
        );

    }
);

test(
    "YZERollChat refuse tout Push après finalisation",
    async () => {

        const message = {

            getFlag() {

                return {
                    finalized: true
                };

            }

        };


        await assert.rejects(

            () =>
                YZERollChat.pushMessage(
                    message
                ),

            error => {

                assert.equal(
                    error instanceof Error,
                    true
                );


                assert.match(
                    error.message,
                    /finalis/i
                );


                return true;

            }

        );

    }
);

test(
    "YZERollChat expose séparément l'état d'application ranged dans le ViewModel",
    () => {

        const result = {
            context: {
                actorId:
                    "attacker-1",

                attack: {
                    type:
                        "ranged"
                },

                target: {
                    actorId:
                        "target-1"
                }
            },

            pool: {},

            dice: {},

            successes:
                1,

            afflictions:
                0,

            stressAfflictions:
                0,

            pushCount:
                0
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
            },

            blockedOperations: [
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


        const viewModel =
            YZERollChat.createViewModel(
                result,
                {
                    finalized:
                        true,

                    rangedAttackApplication:
                        applicationState
                }
            );


        assert.equal(
            viewModel.rangedAttackApplication
                .hasBlockedOperations,
            true
        );


        assert.equal(
            viewModel.rangedAttackApplication
                .requiresProtectionChoice,
            true
        );


        assert.deepEqual(
            viewModel.rangedAttackApplication
                .protectionChoices,
            [
                "body",
                "helmet"
            ]
        );


        assert.equal(
            viewModel.rangedAttackApplication
                .readyForManualApplication,
            false
        );


        assert.equal(
            viewModel.rangedAttackApplication
                .applied,
            false
        );

    }
);

test(
    "YZERollChat place le ViewModel en readyForManualApplication quand le checkpoint est READY",
    () => {

        const result = {
            context: {
                actorId:
                    "attacker-1",

                attack: {
                    type:
                        "ranged"
                },

                target: {
                    actorId:
                        "target-1"
                }
            },

            pool: {},

            dice: {},

            successes:
                1,

            afflictions:
                0,

            stressAfflictions:
                0,

            pushCount:
                0
        };


        const viewModel =
            YZERollChat.createViewModel(
                result,
                {
                    finalized:
                        true,

                    rangedAttackApplication: {
                        status:
                            "ready",

                        applicationLedger: {
                            operations: []
                        },

                        blockedOperations: []
                    }
                }
            );


        assert.equal(
            viewModel.rangedAttackApplication
                .readyForManualApplication,
            true
        );


        assert.equal(
            viewModel.rangedAttackApplication
                .applied,
            false
        );

    }
);

test(
    "YZERollChat place le ViewModel en applied quand le checkpoint est APPLIED",
    () => {

        const result = {
            context: {
                actorId:
                    "attacker-1",

                attack: {
                    type:
                        "ranged"
                },

                target: {
                    actorId:
                        "target-1"
                }
            },

            pool: {},

            dice: {},

            successes:
                1,

            afflictions:
                0,

            stressAfflictions:
                0,

            pushCount:
                0
        };


        const viewModel =
            YZERollChat.createViewModel(
                result,
                {
                    finalized:
                        true,

                    rangedAttackApplication: {
                        status:
                            "applied",

                        applicationLedger: {
                            operations: []
                        },

                        blockedOperations: []
                    }
                }
            );


        assert.equal(
            viewModel.rangedAttackApplication
                .readyForManualApplication,
            false
        );


        assert.equal(
            viewModel.rangedAttackApplication
                .applied,
            true
        );

    }
);

test(
    "YZERollChat rend un message existant avec son état d'application ranged persisté",
    async () => {

        const storedResult = {
            context: {
                actorId:
                    "attacker-1",

                attack: {
                    type:
                        "ranged"
                },

                target: {
                    actorId:
                        "target-1"
                }
            },

            pool: {},

            dice: {},

            successes:
                1,

            afflictions:
                0,

            stressAfflictions:
                0,

            pushCount:
                0
        };


        const applicationState = {
            protectionResult: {
                absorbed:
                    1
            },

            applicationLedger: {
                operations: []
            },

            blockedOperations: [
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


        const message = {
            getFlag(
                systemId,
                flagName
            ) {

                assert.equal(
                    systemId,
                    "metro-2033-yze"
                );


                if (
                    flagName
                    === "rangedAttackApplication"
                ) {

                    return applicationState;

                }


                return null;

            }
        };


        const originalGetStoredResult =
            YZERollChat.getStoredResult;


        const originalRender =
            YZERollChat.render;


        let renderedResult =
            null;

        let renderedOptions =
            null;


        YZERollChat.getStoredResult =
            currentMessage => {

                assert.equal(
                    currentMessage,
                    message
                );

                return storedResult;

            };


        YZERollChat.render =
            async (
                result,
                options
            ) => {

                renderedResult =
                    result;

                renderedOptions =
                    options;

                return "<div>ranged</div>";

            };


        try {

            const content =
                await YZERollChat.renderStoredMessage(
                    message
                );


            assert.equal(
                content,
                "<div>ranged</div>"
            );


            assert.equal(
                renderedResult,
                storedResult
            );


            assert.deepEqual(
                renderedOptions,
                {
                    finalized:
                        false,

                    rangedAttackApplication:
                        applicationState
                }
            );

        }
        finally {

            YZERollChat.getStoredResult =
                originalGetStoredResult;

            YZERollChat.render =
                originalRender;

        }

    }
);

test(
    "YZERollChat rerend un message existant en mettant à jour son contenu",
    async () => {

        const message = {

            async update(
                data
            ) {

                updateCount +=
                    1;

                updateData =
                    data;

            }

        };


        const originalRenderStoredMessage =
            YZERollChat.renderStoredMessage;


        let renderStoredMessageCount =
            0;

        let renderedMessage =
            null;

        let updateCount =
            0;

        let updateData =
            null;


        YZERollChat.renderStoredMessage =
            async currentMessage => {

                renderStoredMessageCount +=
                    1;

                renderedMessage =
                    currentMessage;


                return "<div>ranged checkpoint</div>";

            };


        try {

            const returnedMessage =
                await YZERollChat.rerenderStoredMessage(
                    message
                );


            /*
             * Le rerendu doit repartir
             * du même ChatMessage.
             */
            assert.equal(
                renderStoredMessageCount,
                1
            );

            assert.equal(
                renderedMessage,
                message
            );


            /*
             * Le HTML produit doit réellement
             * remplacer le contenu du ChatMessage.
             */
            assert.equal(
                updateCount,
                1
            );

            assert.deepEqual(
                updateData,
                {
                    content:
                        "<div>ranged checkpoint</div>"
                }
            );


            /*
             * L'opération de présentation
             * retourne le ChatMessage mis à jour.
             */
            assert.equal(
                returnedMessage,
                message
            );

        }
        finally {

            YZERollChat.renderStoredMessage =
                originalRenderStoredMessage;

        }

    }
);

test(
    "YZERollChat transmet l'état d'application ranged au ViewModel lors du rendu",
    async () => {

        const result =
            createResult();


        const applicationState = {

            protectionResult: {
                absorbed:
                    1
            },

            applicationLedger: {
                operations: []
            },

            blockedOperations: [
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


        const originalCreateViewModel =
            YZERollChat.createViewModel;


        const originalApplications =
            foundry.applications;


        let receivedResult =
            null;

        let receivedOptions =
            null;

        let renderedViewModel =
            null;


        YZERollChat.createViewModel =
            (
                currentResult,
                options
            ) => {

                receivedResult =
                    currentResult;

                receivedOptions =
                    options;


                return {
                    marker:
                        "ranged-view-model"
                };

            };


        foundry.applications = {

            handlebars: {

                async renderTemplate(
                    template,
                    viewModel
                ) {

                    renderedViewModel =
                        viewModel;


                    return "<div>ranged render</div>";

                }

            }

        };


        try {

            const content =
                await YZERollChat.render(
                    result,
                    {
                        finalized:
                            true,

                        rangedAttackApplication:
                            applicationState
                    }
                );


            assert.equal(
                content,
                "<div>ranged render</div>"
            );


            assert.equal(
                receivedResult,
                result
            );


            assert.deepEqual(
                receivedOptions,
                {
                    finalized:
                        true,

                    rangedAttackApplication:
                        applicationState
                }
            );


            assert.deepEqual(
                renderedViewModel,
                {
                    marker:
                        "ranged-view-model"
                }
            );

        }
        finally {

            YZERollChat.createViewModel =
                originalCreateViewModel;

            foundry.applications =
                originalApplications;

        }

    }
);

test(
    "YZERollChat rend le choix de Protection d'une attaque à distance bloquée",
    async () => {

        const result = {
            actor: {
                name:
                    "Vladimir"
            },

            context: {
                testLabel:
                    "Tir"
            },

            pool: {
                attribute:
                    3,

                skill:
                    2,

                equipment:
                    0,

                bonus:
                    0,

                penalty:
                    0,

                stress:
                    0
            },

            dice: {
                attribute: [
                    6,
                    2,
                    3
                ],

                skill: [
                    4,
                    5
                ],

                equipment: [],
                bonus: [],
                stress: []
            },

            successes:
                1,

            afflictions:
                0,

            pushed:
                0
        };


        const rangedAttackApplication = {
            blockedOperations: [
                {
                    type:
                        "protection-damage",

                    status:
                        "blocked",

                    choices: [
                        "body",
                        "helmet"
                    ]
                }
            ]
        };


        let renderedViewModel =
            null;


        const previousFoundry =
            globalThis.foundry;


        globalThis.foundry = {
            applications: {
                handlebars: {
                    renderTemplate:
                        async (
                            template,
                            viewModel
                        ) => {

                            renderedViewModel =
                                viewModel;


                            if (
                                viewModel
                                    ?.rangedAttackApplication
                                    ?.requiresProtectionChoice
                            ) {

                                return `
                                    <section>
                                        CHOIX DE PROTECTION

                                        ${viewModel
                                            .rangedAttackApplication
                                            .protectionChoices
                                            .map(
                                                choice => `
                                                    <button
                                                        data-action="resolve-ranged-protection"
                                                        data-protection-target="${choice}"
                                                    >
                                                        ${choice}
                                                    </button>
                                                `
                                            )
                                            .join("")}
                                    </section>
                                `;

                            }


                            return "";

                        }
                }
            }
        };


        try {

            const content =
                await YZERollChat.render(
                    result,
                    {
                        finalized:
                            true,

                        rangedAttackApplication
                    }
                );


            assert.equal(
                renderedViewModel
                    .rangedAttackApplication
                    .requiresProtectionChoice,
                true
            );


            assert.deepEqual(
                renderedViewModel
                    .rangedAttackApplication
                    .protectionChoices,
                [
                    "body",
                    "helmet"
                ]
            );


            assert.match(
                content,
                /CHOIX DE PROTECTION/
            );


            assert.match(
                content,
                /data-action="resolve-ranged-protection"/
            );


            assert.match(
                content,
                /data-protection-target="body"/
            );


            assert.match(
                content,
                /data-protection-target="helmet"/
            );

        }
        finally {

            globalThis.foundry =
                previousFoundry;

        }

    }
);

test(
    "YZERollChat expose le choix de Désarmement d'une attaque à distance bloquée",
    () => {

        const result = {
            actor: {
                name:
                    "Vladimir"
            },

            context: {
                testLabel:
                    "Tir"
            },

            pool: {
                attribute:
                    3,

                skill:
                    2,

                equipment:
                    0,

                bonus:
                    0,

                penalty:
                    0,

                stress:
                    0
            },

            dice: {
                attribute: [
                    6,
                    2,
                    3
                ],

                skill: [
                    4,
                    5
                ],

                equipment: [],
                bonus: [],
                stress: []
            },

            successes:
                1,

            afflictions:
                0,

            pushed:
                0
        };


        const rangedAttackApplication = {
            blockedOperations: [
                {
                    type:
                        "disarm",

                    status:
                        "blocked",

                    choices: [
                        {
                            itemId:
                                "weapon-1",

                            name:
                                "Kalachnikov"
                        },

                        {
                            itemId:
                                "weapon-2",

                            name:
                                "Revolver"
                        }
                    ]
                }
            ]
        };


        const viewModel =
            YZERollChat.createViewModel(
                result,
                {
                    finalized:
                        true,

                    rangedAttackApplication
                }
            );


        assert.equal(
            viewModel
                .rangedAttackApplication
                .requiresDisarmChoice,
            true
        );


        assert.deepEqual(
            viewModel
                .rangedAttackApplication
                .disarmChoices,
            [
                {
                    itemId:
                        "weapon-1",

                    name:
                        "Kalachnikov"
                },

                {
                    itemId:
                        "weapon-2",

                    name:
                        "Revolver"
                }
            ]
        );

    }
);

test(
    "YZERollChat rend les choix de Désarmement d'une attaque à distance bloquée",
    async () => {

        const result = {
            actor: {
                name:
                    "Vladimir"
            },

            context: {
                testLabel:
                    "Tir"
            },

            pool: {
                attribute:
                    3,

                skill:
                    2,

                equipment:
                    0,

                bonus:
                    0,

                penalty:
                    0,

                stress:
                    0
            },

            dice: {
                attribute: [
                    6,
                    2,
                    3
                ],

                skill: [
                    4,
                    5
                ],

                equipment: [],
                bonus: [],
                stress: []
            },

            successes:
                1,

            afflictions:
                0,

            pushed:
                0
        };


        const rangedAttackApplication = {
            blockedOperations: [
                {
                    type:
                        "disarm",

                    status:
                        "blocked",

                    choices: [
                        {
                            itemId:
                                "weapon-1",

                            name:
                                "Kalachnikov"
                        },

                        {
                            itemId:
                                "weapon-2",

                            name:
                                "Revolver"
                        }
                    ]
                }
            ]
        };


        let renderedViewModel =
            null;


        const previousFoundry =
            globalThis.foundry;


        globalThis.foundry = {
            applications: {
                handlebars: {
                    renderTemplate:
                        async (
                            template,
                            viewModel
                        ) => {

                            renderedViewModel =
                                viewModel;


                            if (
                                viewModel
                                    ?.rangedAttackApplication
                                    ?.requiresDisarmChoice
                            ) {

                                return `
                                    <section>
                                        CHOIX DE L'ARME À DÉSARMER

                                        ${viewModel
                                            .rangedAttackApplication
                                            .disarmChoices
                                            .map(
                                                choice => `
                                                    <button
                                                        data-action="resolve-ranged-disarm"
                                                        data-item-id="${choice.itemId}"
                                                    >
                                                        ${choice.name}
                                                    </button>
                                                `
                                            )
                                            .join("")}
                                    </section>
                                `;

                            }


                            return "";

                        }
                }
            }
        };


        try {

            const content =
                await YZERollChat.render(
                    result,
                    {
                        finalized:
                            true,

                        rangedAttackApplication
                    }
                );


            assert.equal(
                renderedViewModel
                    .rangedAttackApplication
                    .requiresDisarmChoice,
                true
            );


            assert.deepEqual(
                renderedViewModel
                    .rangedAttackApplication
                    .disarmChoices,
                [
                    {
                        itemId:
                            "weapon-1",

                        name:
                            "Kalachnikov"
                    },

                    {
                        itemId:
                            "weapon-2",

                        name:
                            "Revolver"
                    }
                ]
            );


            assert.match(
                content,
                /CHOIX DE L'ARME À DÉSARMER/
            );


            assert.match(
                content,
                /data-action="resolve-ranged-disarm"/
            );


            assert.match(
                content,
                /data-item-id="weapon-1"/
            );


            assert.match(
                content,
                /Kalachnikov/
            );


            assert.match(
                content,
                /data-item-id="weapon-2"/
            );


            assert.match(
                content,
                /Revolver/
            );

        }
        finally {

            globalThis.foundry =
                previousFoundry;

        }

    }
);

