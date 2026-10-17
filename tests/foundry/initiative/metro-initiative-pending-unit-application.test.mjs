import test from "node:test";
import assert from "node:assert/strict";

import {
    getCombatInitiativePendingUnits,
    createCombatInitiativePendingUnit,
    modifyCombatInitiativePendingUnit,
    dissolveCombatInitiativePendingUnit
} from "../../../src/foundry/initiative/metro-initiative-pending-unit-application.mjs";


function createCombatStub({
    combatantIds = [],
    pendingUnits = [],
    assignments = []
} = {}) {

    const flags = {
        initiativePendingUnits:
            structuredClone(
                pendingUnits
            ),

        initiativeAssignments:
            structuredClone(
                assignments
            )
    };

    const combatants =
        new Map(
            combatantIds.map(
                combatantId => [
                    combatantId,
                    {
                        id:
                            combatantId
                    }
                ]
            )
        );

    const setFlagCalls = [];


    return {
        combatants,

        setFlagCalls,

        getFlag(
            scope,
            key
        ) {

            if (scope !== "metro-2033-yze") {

                return undefined;

            }


            if (
                key === "initiativePendingUnits"
                || key === "initiativeAssignments"
            ) {

                return flags[key];

            }


            return undefined;
        },

        async setFlag(
            scope,
            key,
            value
        ) {

            setFlagCalls.push({
                scope,
                key,

                value:
                    structuredClone(value)
            });


            if (
                scope === "metro-2033-yze"
                && (
                    key === "initiativePendingUnits"
                    || key === "initiativeAssignments"
                )
            ) {

                flags[key] =
                    structuredClone(value);

            }


            return this;
        }
    };
}


test(
    "getCombatInitiativePendingUnits retourne une liste vide lorsqu'aucune unité n'existe",
    () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "vladimir"
                ]
            });


        assert.deepEqual(
            getCombatInitiativePendingUnits(
                combat
            ),
            []
        );

    }
);


test(
    "createCombatInitiativePendingUnit persiste une unité individuelle",
    async () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "vladimir"
                ]
            });


        const result =
            await createCombatInitiativePendingUnit({
                combat,

                combatantIds: [
                    "vladimir"
                ],

                drawCount: 1
            });


        assert.deepEqual(
            result.pendingUnit,
            {
                combatantIds: [
                    "vladimir"
                ],

                drawCount: 1,

                reason: null
            }
        );


        assert.deepEqual(
            getCombatInitiativePendingUnits(
                combat
            ),
            [
                {
                    combatantIds: [
                        "vladimir"
                    ],

                    drawCount: 1,

                    reason: null
                }
            ]
        );

    }
);


test(
    "createCombatInitiativePendingUnit persiste une unité de groupe avec une raison",
    async () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "artyom"
                ]
            });


        const result =
            await createCombatInitiativePendingUnit({
                combat,

                combatantIds: [
                    "artyom"
                ],

                drawCount: 2,

                reason:
                    "Surprise déclarée par le MJ"
            });


        assert.equal(
            result.pendingUnit.drawCount,
            2
        );

        assert.equal(
            result.pendingUnit.reason,
            "Surprise déclarée par le MJ"
        );

    }
);


test(
    "createCombatInitiativePendingUnit refuse un Combatant absent du Combat",
    async () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "vladimir"
                ]
            });


        await assert.rejects(
            () =>
                createCombatInitiativePendingUnit({
                    combat,

                    combatantIds: [
                        "fantome"
                    ],

                    drawCount: 1
                }),
            {
                name: "Error"
            }
        );


        assert.deepEqual(
            getCombatInitiativePendingUnits(
                combat
            ),
            []
        );

    }
);


test(
    "createCombatInitiativePendingUnit refuse un Combatant déjà présent dans une autre unité pending",
    async () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "vladimir",
                    "artyom"
                ],

                pendingUnits: [
                    {
                        combatantIds: [
                            "vladimir"
                        ],

                        drawCount: 1,

                        reason: null
                    }
                ]
            });


        await assert.rejects(
            () =>
                createCombatInitiativePendingUnit({
                    combat,

                    combatantIds: [
                        "vladimir",
                        "artyom"
                    ],

                    drawCount: 1
                }),
            {
                name: "Error"
            }
        );


        assert.deepEqual(
            getCombatInitiativePendingUnits(
                combat
            ),
            [
                {
                    combatantIds: [
                        "vladimir"
                    ],

                    drawCount: 1,

                    reason: null
                }
            ]
        );

    }
);


test(
    "createCombatInitiativePendingUnit refuse un Combatant déjà résolu",
    async () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "vladimir"
                ],

                assignments: [
                    {
                        cardId:
                            "card-3",

                        initiative:
                            3,

                        combatantIds: [
                            "vladimir"
                        ]
                    }
                ]
            });


        await assert.rejects(
            () =>
                createCombatInitiativePendingUnit({
                    combat,

                    combatantIds: [
                        "vladimir"
                    ],

                    drawCount: 1
                }),
            {
                name: "Error"
            }
        );


        assert.deepEqual(
            getCombatInitiativePendingUnits(
                combat
            ),
            []
        );

    }
);


test(
    "modifyCombatInitiativePendingUnit modifie la composition et le drawCount",
    async () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "vladimir",
                    "artyom"
                ],

                pendingUnits: [
                    {
                        combatantIds: [
                            "vladimir"
                        ],

                        drawCount: 1,

                        reason: null
                    }
                ]
            });


        const result =
            await modifyCombatInitiativePendingUnit({
                combat,

                combatantId:
                    "vladimir",

                combatantIds: [
                    "vladimir",
                    "artyom"
                ],

                drawCount: 2,

                reason:
                    "Regroupement MJ"
            });


        assert.deepEqual(
            result.pendingUnit,
            {
                combatantIds: [
                    "vladimir",
                    "artyom"
                ],

                drawCount: 2,

                reason:
                    "Regroupement MJ"
            }
        );


        assert.deepEqual(
            getCombatInitiativePendingUnits(
                combat
            ),
            [
                {
                    combatantIds: [
                        "vladimir",
                        "artyom"
                    ],

                    drawCount: 2,

                    reason:
                        "Regroupement MJ"
                }
            ]
        );

    }
);


test(
    "modifyCombatInitiativePendingUnit refuse un Combatant introuvable dans une unité pending",
    async () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "vladimir"
                ]
            });


        await assert.rejects(
            () =>
                modifyCombatInitiativePendingUnit({
                    combat,

                    combatantId:
                        "vladimir",

                    combatantIds: [
                        "vladimir"
                    ],

                    drawCount: 1
                }),
            {
                name: "Error"
            }
        );

    }
);


test(
    "dissolveCombatInitiativePendingUnit retire l'unité entière et ne crée aucune unité individuelle",
    async () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "brigand-1",
                    "brigand-2"
                ],

                pendingUnits: [
                    {
                        combatantIds: [
                            "brigand-1",
                            "brigand-2"
                        ],

                        drawCount: 1,

                        reason: null
                    }
                ]
            });


        const result =
            await dissolveCombatInitiativePendingUnit({
                combat,

                combatantId:
                    "brigand-1"
            });


        assert.deepEqual(
            result.dissolvedPendingUnit,
            {
                combatantIds: [
                    "brigand-1",
                    "brigand-2"
                ],

                drawCount: 1,

                reason: null
            }
        );


        assert.deepEqual(
            getCombatInitiativePendingUnits(
                combat
            ),
            []
        );

    }
);


test(
    "dissolveCombatInitiativePendingUnit refuse un Combatant sans unité pending",
    async () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "vladimir"
                ]
            });


        await assert.rejects(
            () =>
                dissolveCombatInitiativePendingUnit({
                    combat,

                    combatantId:
                        "vladimir"
                }),
            {
                name: "Error"
            }
        );

    }
);
