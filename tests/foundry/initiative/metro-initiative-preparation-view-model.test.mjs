import test from "node:test";
import assert from "node:assert/strict";

import {
    buildInitiativePreparationViewModel
} from "../../../src/foundry/initiative/metro-initiative-preparation-view-model.mjs";


function createCombatantStub({
    id,
    name
}) {

    return {
        id,
        name
    };
}


function createCombatStub({
    combatants = [],
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

    const combatantMap =
        new Map(
            combatants.map(
                combatant => [
                    combatant.id,
                    combatant
                ]
            )
        );


    return {
        combatants:
            combatantMap,

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
        }
    };
}


test(
    "buildInitiativePreparationViewModel classe un Combatant sans unité comme non configuré",
    () => {

        const combat =
            createCombatStub({
                combatants: [
                    createCombatantStub({
                        id: "vladimir",
                        name: "Vladimir"
                    })
                ]
            });


        const viewModel =
            buildInitiativePreparationViewModel(
                combat
            );


        assert.deepEqual(
            viewModel.unconfiguredCombatants,
            [
                {
                    id:
                        "vladimir",

                    name:
                        "Vladimir"
                }
            ]
        );

        assert.deepEqual(
            viewModel.pendingUnits,
            []
        );

        assert.deepEqual(
            viewModel.assignments,
            []
        );

    }
);


test(
    "buildInitiativePreparationViewModel résout les noms des membres d'une unité pending",
    () => {

        const combat =
            createCombatStub({
                combatants: [
                    createCombatantStub({
                        id: "artyom",
                        name: "Artyom"
                    }),

                    createCombatantStub({
                        id: "khan",
                        name: "Khan"
                    })
                ],

                pendingUnits: [
                    {
                        combatantIds: [
                            "artyom",
                            "khan"
                        ],

                        drawCount: 2,

                        reason:
                            "Surprise"
                    }
                ]
            });


        const viewModel =
            buildInitiativePreparationViewModel(
                combat
            );


        assert.deepEqual(
            viewModel.unconfiguredCombatants,
            []
        );

        assert.equal(
            viewModel.pendingUnits.length,
            1
        );

        assert.deepEqual(
            viewModel.pendingUnits[0].members,
            [
                {
                    id: "artyom",
                    name: "Artyom"
                },
                {
                    id: "khan",
                    name: "Khan"
                }
            ]
        );

        assert.equal(
            viewModel.pendingUnits[0].drawCount,
            2
        );

        assert.equal(
            viewModel.pendingUnits[0].reason,
            "Surprise"
        );

    }
);


test(
    "buildInitiativePreparationViewModel résout les noms des membres d'une attribution résolue",
    () => {

        const combat =
            createCombatStub({
                combatants: [
                    createCombatantStub({
                        id: "brigand-1",
                        name: "Brigand"
                    }),

                    createCombatantStub({
                        id: "brigand-2",
                        name: "Brigand"
                    })
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


        const viewModel =
            buildInitiativePreparationViewModel(
                combat
            );


        assert.equal(
            viewModel.assignments.length,
            1
        );

        assert.equal(
            viewModel.assignments[0].cardId,
            "card-6"
        );

        assert.equal(
            viewModel.assignments[0].initiative,
            6
        );

        assert.deepEqual(
            viewModel.assignments[0].members,
            [
                {
                    id: "brigand-1",
                    name: "Brigand"
                },
                {
                    id: "brigand-2",
                    name: "Brigand"
                }
            ]
        );

    }
);


test(
    "buildInitiativePreparationViewModel trie les attributions par initiative croissante",
    () => {

        const combat =
            createCombatStub({
                combatants: [
                    createCombatantStub({
                        id: "a",
                        name: "A"
                    }),

                    createCombatantStub({
                        id: "b",
                        name: "B"
                    })
                ],

                assignments: [
                    {
                        cardId: "card-8",
                        initiative: 8,
                        combatantIds: ["b"]
                    },
                    {
                        cardId: "card-2",
                        initiative: 2,
                        combatantIds: ["a"]
                    }
                ]
            });


        const viewModel =
            buildInitiativePreparationViewModel(
                combat
            );


        assert.deepEqual(
            viewModel.assignments.map(
                assignment =>
                    assignment.initiative
            ),
            [
                2,
                8
            ]
        );

    }
);


test(
    "buildInitiativePreparationViewModel ignore un Combatant déjà pending ou résolu dans la liste des non configurés",
    () => {

        const combat =
            createCombatStub({
                combatants: [
                    createCombatantStub({
                        id: "vladimir",
                        name: "Vladimir"
                    }),

                    createCombatantStub({
                        id: "artyom",
                        name: "Artyom"
                    }),

                    createCombatantStub({
                        id: "khan",
                        name: "Khan"
                    })
                ],

                pendingUnits: [
                    {
                        combatantIds: [
                            "artyom"
                        ],

                        drawCount: 1,

                        reason: null
                    }
                ],

                assignments: [
                    {
                        cardId: "card-3",
                        initiative: 3,
                        combatantIds: [
                            "khan"
                        ]
                    }
                ]
            });


        const viewModel =
            buildInitiativePreparationViewModel(
                combat
            );


        assert.deepEqual(
            viewModel.unconfiguredCombatants,
            [
                {
                    id: "vladimir",
                    name: "Vladimir"
                }
            ]
        );

    }
);


test(
    "buildInitiativePreparationViewModel retourne des listes vides pour un Combat sans Combatant",
    () => {

        const combat =
            createCombatStub({});


        const viewModel =
            buildInitiativePreparationViewModel(
                combat
            );


        assert.deepEqual(
            viewModel,
            {
                unconfiguredCombatants: [],
                pendingUnits: [],
                assignments: []
            }
        );

    }
);


test(
    "buildInitiativePreparationViewModel exige un Combat Foundry exploitable",
    () => {

        assert.throws(
            () =>
                buildInitiativePreparationViewModel(
                    null
                ),
            {
                name: "TypeError"
            }
        );

    }
);
