import test from "node:test";
import assert from "node:assert/strict";

import {
    createMetroInitiativePendingUnit
} from "../../../src/domain/rules/metro-initiative-pending-unit.mjs";


test(
    "createMetroInitiativePendingUnit crée une unité individuelle",
    () => {

        const pendingUnit =
            createMetroInitiativePendingUnit({
                combatantIds: [
                    "combatant-vladimir"
                ],
                drawCount: 1
            });


        assert.deepEqual(
            pendingUnit,
            {
                combatantIds: [
                    "combatant-vladimir"
                ],

                drawCount: 1,

                reason: null
            }
        );

    }
);


test(
    "createMetroInitiativePendingUnit accepte plusieurs Combatants partageant un tirage",
    () => {

        const pendingUnit =
            createMetroInitiativePendingUnit({
                combatantIds: [
                    "brigand-1",
                    "brigand-2",
                    "brigand-3"
                ],
                drawCount: 1
            });


        assert.deepEqual(
            pendingUnit,
            {
                combatantIds: [
                    "brigand-1",
                    "brigand-2",
                    "brigand-3"
                ],

                drawCount: 1,

                reason: null
            }
        );

    }
);


test(
    "createMetroInitiativePendingUnit accepte un drawCount supérieur à 1 pour un tirage multiple",
    () => {

        const pendingUnit =
            createMetroInitiativePendingUnit({
                combatantIds: [
                    "combatant-artyom"
                ],
                drawCount: 2
            });


        assert.equal(
            pendingUnit.drawCount,
            2
        );

    }
);


test(
    "createMetroInitiativePendingUnit n'impose aucune limite artificielle au drawCount",
    () => {

        const pendingUnit =
            createMetroInitiativePendingUnit({
                combatantIds: [
                    "combatant-artyom"
                ],
                drawCount: 5
            });


        assert.equal(
            pendingUnit.drawCount,
            5
        );

    }
);


test(
    "createMetroInitiativePendingUnit accepte une raison descriptive optionnelle",
    () => {

        const pendingUnit =
            createMetroInitiativePendingUnit({
                combatantIds: [
                    "combatant-artyom"
                ],
                drawCount: 2,
                reason:
                    "Surprise déclarée par le MJ"
            });


        assert.equal(
            pendingUnit.reason,
            "Surprise déclarée par le MJ"
        );

    }
);


test(
    "createMetroInitiativePendingUnit conserve reason à null lorsqu'aucune raison n'est fournie",
    () => {

        const pendingUnit =
            createMetroInitiativePendingUnit({
                combatantIds: [
                    "combatant-artyom"
                ],
                drawCount: 1
            });


        assert.equal(
            pendingUnit.reason,
            null
        );

    }
);


test(
    "createMetroInitiativePendingUnit exige au moins un Combatant",
    () => {

        assert.throws(
            () =>
                createMetroInitiativePendingUnit({
                    combatantIds: [],
                    drawCount: 1
                }),
            {
                name: "TypeError"
            }
        );

    }
);


test(
    "createMetroInitiativePendingUnit exige des identifiants de Combatant non vides",
    () => {

        const invalidCombatantIds = [
            [""],
            ["combatant-1", ""],
            [null],
            [undefined],
            [42]
        ];


        for (
            const combatantIds
            of invalidCombatantIds
        ) {

            assert.throws(
                () =>
                    createMetroInitiativePendingUnit({
                        combatantIds,
                        drawCount: 1
                    }),
                {
                    name: "TypeError"
                }
            );

        }

    }
);


test(
    "createMetroInitiativePendingUnit refuse qu'un Combatant apparaisse deux fois",
    () => {

        assert.throws(
            () =>
                createMetroInitiativePendingUnit({
                    combatantIds: [
                        "brigand-1",
                        "brigand-1"
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
    "createMetroInitiativePendingUnit rejette un drawCount invalide",
    () => {

        const invalidDrawCounts = [
            0,
            -1,
            1.5,
            "2",
            null,
            undefined
        ];


        for (
            const drawCount
            of invalidDrawCounts
        ) {

            assert.throws(
                () =>
                    createMetroInitiativePendingUnit({
                        combatantIds: [
                            "combatant-artyom"
                        ],
                        drawCount
                    }),
                {
                    name: "RangeError"
                }
            );

        }

    }
);


test(
    "createMetroInitiativePendingUnit rejette une raison qui n'est pas une chaîne non vide",
    () => {

        const invalidReasons = [
            "",
            42,
            true
        ];


        for (
            const reason
            of invalidReasons
        ) {

            assert.throws(
                () =>
                    createMetroInitiativePendingUnit({
                        combatantIds: [
                            "combatant-artyom"
                        ],
                        drawCount: 1,
                        reason
                    }),
                {
                    name: "TypeError"
                }
            );

        }

    }
);


test(
    "createMetroInitiativePendingUnit produit une copie indépendante de la liste des Combatants",
    () => {

        const combatantIds = [
            "brigand-1",
            "brigand-2"
        ];


        const pendingUnit =
            createMetroInitiativePendingUnit({
                combatantIds,
                drawCount: 1
            });


        combatantIds.push(
            "brigand-3"
        );


        assert.deepEqual(
            pendingUnit.combatantIds,
            [
                "brigand-1",
                "brigand-2"
            ]
        );

    }
);
