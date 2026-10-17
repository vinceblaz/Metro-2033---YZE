import test from "node:test";
import assert from "node:assert/strict";

import {
    attachCombatantsToInitiativeAssignment,
    extractCombatantFromInitiativeAssignment
} from "../../../src/foundry/initiative/metro-initiative-assignment-reinforcement.mjs";

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
    assignments = []
} = {}) {

    const flags = {
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

            if (
                scope === "metro-2033-yze"
                && key === "initiativeAssignments"
            ) {

                return flags.initiativeAssignments;

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
                && key === "initiativeAssignments"
            ) {

                flags.initiativeAssignments =
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
    "attachCombatantsToInitiativeAssignment rattache un renfort à une attribution existante",
    async () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "brigand-1",
                    "brigand-2"
                ],

                assignments: [
                    {
                        cardId:
                            "card-6",

                        initiative:
                            6,

                        combatantIds: [
                            "brigand-1"
                        ]
                    }
                ]
            });


        const result =
            await attachCombatantsToInitiativeAssignment({
                combat,

                cardId:
                    "card-6",

                combatantIds: [
                    "brigand-2"
                ]
            });


        assert.deepEqual(
            result.assignment,
            {
                cardId:
                    "card-6",

                initiative:
                    6,

                combatantIds: [
                    "brigand-1",
                    "brigand-2"
                ]
            }
        );


        assert.equal(
            combat.combatants
                .get("brigand-2")
                .initiative,
            6
        );


        assert.deepEqual(
            getCombatInitiativeAssignments(
                combat
            ),
            [
                {
                    cardId:
                        "card-6",

                    initiative:
                        6,

                    combatantIds: [
                        "brigand-1",
                        "brigand-2"
                    ]
                }
            ]
        );

    }
);


test(
    "attachCombatantsToInitiativeAssignment refuse une carte sans attribution existante",
    async () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "brigand-1"
                ]
            });


        await assert.rejects(
            () =>
                attachCombatantsToInitiativeAssignment({
                    combat,

                    cardId:
                        "card-6",

                    combatantIds: [
                        "brigand-1"
                    ]
                }),
            {
                name: "Error"
            }
        );

    }
);


test(
    "attachCombatantsToInitiativeAssignment refuse un Combatant déjà résolu",
    async () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "brigand-1",
                    "brigand-2"
                ],

                assignments: [
                    {
                        cardId:
                            "card-6",

                        initiative:
                            6,

                        combatantIds: [
                            "brigand-1"
                        ]
                    },
                    {
                        cardId:
                            "card-2",

                        initiative:
                            2,

                        combatantIds: [
                            "brigand-2"
                        ]
                    }
                ]
            });


        await assert.rejects(
            () =>
                attachCombatantsToInitiativeAssignment({
                    combat,

                    cardId:
                        "card-6",

                    combatantIds: [
                        "brigand-2"
                    ]
                }),
            {
                name: "Error"
            }
        );


        assert.deepEqual(
            getCombatInitiativeAssignments(
                combat
            )[0].combatantIds,
            [
                "brigand-1"
            ]
        );

    }
);


test(
    "attachCombatantsToInitiativeAssignment refuse un Combatant absent du combat",
    async () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "brigand-1"
                ],

                assignments: [
                    {
                        cardId:
                            "card-6",

                        initiative:
                            6,

                        combatantIds: [
                            "brigand-1"
                        ]
                    }
                ]
            });


        await assert.rejects(
            () =>
                attachCombatantsToInitiativeAssignment({
                    combat,

                    cardId:
                        "card-6",

                    combatantIds: [
                        "fantome"
                    ]
                }),
            {
                name: "Error"
            }
        );

    }
);


test(
    "extractCombatantFromInitiativeAssignment retire un membre et lui tire exactement une nouvelle carte",
    async () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "brigand-1",
                    "brigand-2"
                ],

                assignments: [
                    {
                        cardId:
                            "card-6",

                        initiative:
                            6,

                        combatantIds: [
                            "brigand-1",
                            "brigand-2"
                        ]
                    }
                ]
            });

        combat.combatants
            .get("brigand-1")
            .initiative = 6;

        combat.combatants
            .get("brigand-2")
            .initiative = 6;

        const deck = {
            cards: [
                createCardStub({
                    id: "card-9",
                    initiative: 9
                })
            ]
        };


        const result =
            await extractCombatantFromInitiativeAssignment({
                combat,
                deck,

                combatantId:
                    "brigand-2",

                random:
                    () => 0
            });


        assert.deepEqual(
            result.sourceAssignment.combatantIds,
            [
                "brigand-1"
            ]
        );

        assert.equal(
            result.newAssignment.cardId,
            "card-9"
        );

        assert.equal(
            result.newAssignment.initiative,
            9
        );


        const assignments =
            getCombatInitiativeAssignments(
                combat
            );

        assert.equal(
            assignments.length,
            2
        );


        assert.equal(
            combat.combatants
                .get("brigand-1")
                .initiative,
            6
        );

        assert.equal(
            combat.combatants
                .get("brigand-2")
                .initiative,
            9
        );

    }
);


test(
    "extractCombatantFromInitiativeAssignment refuse un Combatant sans initiative résolue",
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
                extractCombatantFromInitiativeAssignment({
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
    "extractCombatantFromInitiativeAssignment refuse un Combatant déjà seul dans son attribution",
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

        const deck = {
            cards: [
                createCardStub({
                    id: "card-9",
                    initiative: 9
                })
            ]
        };


        await assert.rejects(
            () =>
                extractCombatantFromInitiativeAssignment({
                    combat,
                    deck,

                    combatantId:
                        "vladimir"
                }),
            {
                name: "Error"
            }
        );


        assert.deepEqual(
            getCombatInitiativeAssignments(
                combat
            ),
            [
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
        );

    }
);


test(
    "extractCombatantFromInitiativeAssignment refuse l'extraction lorsqu'aucune carte n'est disponible",
    async () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "brigand-1",
                    "brigand-2"
                ],

                assignments: [
                    {
                        cardId:
                            "card-6",

                        initiative:
                            6,

                        combatantIds: [
                            "brigand-1",
                            "brigand-2"
                        ]
                    }
                ]
            });

        const deck = {
            cards: []
        };


        await assert.rejects(
            () =>
                extractCombatantFromInitiativeAssignment({
                    combat,
                    deck,

                    combatantId:
                        "brigand-2"
                }),
            {
                name: "Error"
            }
        );


        assert.deepEqual(
            getCombatInitiativeAssignments(
                combat
            ),
            [
                {
                    cardId:
                        "card-6",

                    initiative:
                        6,

                    combatantIds: [
                        "brigand-1",
                        "brigand-2"
                    ]
                }
            ]
        );

    }
);


test(
    "extractCombatantFromInitiativeAssignment restaure l'attribution d'origine si la nouvelle attribution échoue",
    async () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "brigand-1",
                    "brigand-2"
                ],

                assignments: [
                    {
                        cardId:
                            "card-6",

                        initiative:
                            6,

                        combatantIds: [
                            "brigand-1",
                            "brigand-2"
                        ]
                    }
                ]
            });

        const deck = {
            cards: [
                createCardStub({
                    id: "card-9",
                    initiative: 9
                })
            ]
        };


        combat.updateEmbeddedDocuments =
            async () => {

                throw new Error(
                    "projection-failed"
                );

            };


        await assert.rejects(
            () =>
                extractCombatantFromInitiativeAssignment({
                    combat,
                    deck,

                    combatantId:
                        "brigand-2",

                    random:
                        () => 0
                }),
            {
                name: "Error"
            }
        );


        assert.deepEqual(
            getCombatInitiativeAssignments(
                combat
            ),
            [
                {
                    cardId:
                        "card-6",

                    initiative:
                        6,

                    combatantIds: [
                        "brigand-1",
                        "brigand-2"
                    ]
                }
            ]
        );

    }
);
