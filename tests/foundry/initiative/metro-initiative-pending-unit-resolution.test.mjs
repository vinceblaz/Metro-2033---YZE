import test from "node:test";
import assert from "node:assert/strict";

import {
    resolveCombatInitiativePendingUnit
} from "../../../src/foundry/initiative/metro-initiative-pending-unit-resolution.mjs";

import {
    getCombatInitiativePendingUnits,
    createCombatInitiativePendingUnit
} from "../../../src/foundry/initiative/metro-initiative-pending-unit-application.mjs";

import {
    getCombatInitiativeAssignments
} from "../../../src/foundry/initiative/metro-initiative-assignment-application.mjs";


function createCardStub({
    id,
    initiative
}) {

    return {
        id,

        drawn:
            false,

        getFlag(
            scope,
            key
        ) {

            if (
                scope === "metro-2033-yze"
                && key === "initiative"
            ) {

                return initiative;

            }


            return undefined;
        },

        async update() {

            return this;

        }
    };
}


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
                            combatantId,

                        initiative:
                            null
                    }
                ]
            )
        );


    return {
        combatants,

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
        },

        async updateEmbeddedDocuments(
            embeddedName,
            updates
        ) {

            for (
                const update
                of updates
            ) {

                const combatant =
                    combatants.get(
                        update._id
                    );


                if (combatant) {

                    combatant.initiative =
                        update.initiative;

                }

            }


            return updates;
        }
    };
}


test(
    "resolveCombatInitiativePendingUnit résout automatiquement une unité à drawCount = 1",
    async () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "vladimir"
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

        const deck = {
            cards: [
                createCardStub({
                    id: "card-4",
                    initiative: 4
                })
            ]
        };


        const result =
            await resolveCombatInitiativePendingUnit({
                combat,
                deck,

                combatantId:
                    "vladimir",

                random:
                    () => 0
            });


        assert.equal(
            result.assignment.cardId,
            "card-4"
        );

        assert.equal(
            result.assignment.initiative,
            4
        );


        assert.deepEqual(
            getCombatInitiativePendingUnits(
                combat
            ),
            []
        );

        assert.equal(
            getCombatInitiativeAssignments(
                combat
            ).length,
            1
        );

        assert.equal(
            combat.combatants
                .get("vladimir")
                .initiative,
            4
        );

    }
);


test(
    "resolveCombatInitiativePendingUnit exige un choix MJ pour un drawCount > 1",
    async () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "artyom"
                ],

                pendingUnits: [
                    {
                        combatantIds: [
                            "artyom"
                        ],

                        drawCount: 2,

                        reason:
                            "Surprise"
                    }
                ]
            });

        const deck = {
            cards: [
                createCardStub({
                    id: "card-1",
                    initiative: 1
                }),
                createCardStub({
                    id: "card-9",
                    initiative: 9
                })
            ]
        };


        await assert.rejects(
            () =>
                resolveCombatInitiativePendingUnit({
                    combat,
                    deck,

                    combatantId:
                        "artyom",

                    random:
                        () => 0
                }),
            {
                name: "Error"
            }
        );


        assert.equal(
            getCombatInitiativeAssignments(
                combat
            ).length,
            0
        );

        assert.equal(
            getCombatInitiativePendingUnits(
                combat
            ).length,
            1
        );

    }
);


function createSequentialRandom(
    values
) {

    let index = 0;


    return () => {

        const value =
            values[index % values.length];

        index += 1;


        return value;
    };
}


test(
    "resolveCombatInitiativePendingUnit applique la carte choisie par le MJ parmi les candidates tirées",
    async () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "artyom"
                ],

                pendingUnits: [
                    {
                        combatantIds: [
                            "artyom"
                        ],

                        drawCount: 2,

                        reason:
                            "Surprise"
                    }
                ]
            });

        const deck = {
            cards: [
                createCardStub({
                    id: "card-1",
                    initiative: 1
                }),
                createCardStub({
                    id: "card-9",
                    initiative: 9
                })
            ]
        };


        const chosenCardIds = [];


        const result =
            await resolveCombatInitiativePendingUnit({
                combat,
                deck,

                combatantId:
                    "artyom",

                chooseCandidateCardId:
                    candidates => {

                        chosenCardIds.push(
                            ...candidates.map(
                                candidate =>
                                    candidate.cardId
                            )
                        );


                        return "card-1";
                    },

                random:
                    createSequentialRandom([
                        0,
                        0
                    ])
            });


        assert.equal(
            result.assignment.cardId,
            "card-1"
        );

        assert.equal(
            result.assignment.initiative,
            1
        );

        assert.equal(
            chosenCardIds.length,
            2
        );

    }
);


test(
    "resolveCombatInitiativePendingUnit refuse un choix MJ hors des candidates tirées",
    async () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "artyom"
                ],

                pendingUnits: [
                    {
                        combatantIds: [
                            "artyom"
                        ],

                        drawCount: 2,

                        reason: null
                    }
                ]
            });

        const deck = {
            cards: [
                createCardStub({
                    id: "card-1",
                    initiative: 1
                }),
                createCardStub({
                    id: "card-9",
                    initiative: 9
                })
            ]
        };


        await assert.rejects(
            () =>
                resolveCombatInitiativePendingUnit({
                    combat,
                    deck,

                    combatantId:
                        "artyom",

                    chooseCandidateCardId:
                        () =>
                            "card-inexistante",

                    random:
                        createSequentialRandom([
                            0,
                            0
                        ])
                }),
            {
                name: "Error"
            }
        );


        assert.equal(
            getCombatInitiativePendingUnits(
                combat
            ).length,
            1
        );

    }
);


test(
    "resolveCombatInitiativePendingUnit refuse un Combatant sans unité pending",
    async () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "vladimir"
                ]
            });

        const deck = {
            cards: []
        };


        await assert.rejects(
            () =>
                resolveCombatInitiativePendingUnit({
                    combat,
                    deck,

                    combatantId:
                        "vladimir"
                }),
            {
                name: "Error"
            }
        );

    }
);


test(
    "resolveCombatInitiativePendingUnit restaure l'unité pending si l'attribution échoue",
    async () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "vladimir"
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

        const deck = {
            cards: [
                createCardStub({
                    id: "card-4",
                    initiative: 4
                })
            ]
        };


        /*
         * La projection Foundry échoue au
         * moment de l'attribution (panne
         * réseau, permissions...), alors que
         * le Combatant participe toujours
         * normalement au Combat.
         */
        combat.updateEmbeddedDocuments =
            async () => {

                throw new Error(
                    "projection-failed"
                );

            };


        await assert.rejects(
            () =>
                resolveCombatInitiativePendingUnit({
                    combat,
                    deck,

                    combatantId:
                        "vladimir",

                    random:
                        () => 0
                }),
            {
                name: "Error"
            }
        );


        assert.equal(
            getCombatInitiativeAssignments(
                combat
            ).length,
            0
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
    "resolveCombatInitiativePendingUnit compose avec createCombatInitiativePendingUnit",
    async () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "khan"
                ]
            });

        const deck = {
            cards: [
                createCardStub({
                    id: "card-2",
                    initiative: 2
                })
            ]
        };


        await createCombatInitiativePendingUnit({
            combat,

            combatantIds: [
                "khan"
            ],

            drawCount: 1
        });


        const result =
            await resolveCombatInitiativePendingUnit({
                combat,
                deck,

                combatantId:
                    "khan",

                random:
                    () => 0
            });


        assert.equal(
            result.assignment.cardId,
            "card-2"
        );

    }
);
