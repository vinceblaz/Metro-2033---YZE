import test from "node:test";
import assert from "node:assert/strict";

import {
    rollMetroInitiativeForCombatants
} from "../../../src/foundry/initiative/metro-combat-initiative.mjs";


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

        async update(
            changes
        ) {

            Object.assign(
                this,
                changes
            );

            return this;
        }
    };
}


function createDeckStub(
    cards
) {

    return {
        cards
    };
}


function createCombatStub({
    combatants,
    assignments = []
}) {

    let persistedAssignments =
        structuredClone(
            assignments
        );


    const combatantMap =
        new Map(
            combatants.map(
                combatant => [
                    combatant.id,
                    {
                        ...combatant
                    }
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

            if (
                scope === "metro-2033-yze"
                && key === "initiativeAssignments"
            ) {

                return persistedAssignments;

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

                persistedAssignments =
                    structuredClone(
                        value
                    );

            }


            return this;
        },

        async updateEmbeddedDocuments(
            embeddedName,
            updates
        ) {

            assert.equal(
                embeddedName,
                "Combatant"
            );


            for (
                const update
                of updates
            ) {

                const combatant =
                    combatantMap.get(
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
    "rollMetroInitiativeForCombatants attribue une carte à chaque Combatant demandé",
    async () => {

        const cards = [
            createCardStub({
                id:
                    "card-2",

                initiative:
                    2
            }),

            createCardStub({
                id:
                    "card-8",

                initiative:
                    8
            })
        ];


        const combat =
            createCombatStub({
                combatants: [
                    {
                        id:
                            "artyom",

                        initiative:
                            null
                    },
                    {
                        id:
                            "vladimir",

                        initiative:
                            null
                    }
                ]
            });


        const result =
            await rollMetroInitiativeForCombatants({
                combat,

                deck:
                    createDeckStub(
                        cards
                    ),

                combatantIds: [
                    "artyom",
                    "vladimir"
                ],

                random:
                    () => 0
            });


        assert.equal(
            result.assignments.length,
            2
        );


        assert.deepEqual(
            result.assignments.map(
                assignment =>
                    assignment.initiative
            ),
            [
                2,
                8
            ]
        );


        assert.equal(
            combat.combatants
                .get("artyom")
                .initiative,
            2
        );


        assert.equal(
            combat.combatants
                .get("vladimir")
                .initiative,
            8
        );


        /*
         * L'attribution est portée par les
         * initiativeAssignments du Combat.
         *
         * Les Cards du catalogue global ne
         * sont jamais physiquement réservées.
         */
        assert.equal(
            cards[0].drawn,
            false
        );

        assert.equal(
            cards[1].drawn,
            false
        );

    }
);


test(
    "rollMetroInitiativeForCombatants ignore un Combatant possédant déjà une initiative",
    async () => {

        const card =
            createCardStub({
                id:
                    "card-4",

                initiative:
                    4
            });


        const combat =
            createCombatStub({
                combatants: [
                    {
                        id:
                            "artyom",

                        initiative:
                            3
                    },
                    {
                        id:
                            "vladimir",

                        initiative:
                            null
                    }
                ],

                assignments: [
                    {
                        cardId:
                            "card-3",

                        initiative:
                            3,

                        combatantIds: [
                            "artyom"
                        ]
                    }
                ]
            });


        const result =
            await rollMetroInitiativeForCombatants({
                combat,

                deck:
                    createDeckStub([
                        card
                    ]),

                combatantIds: [
                    "artyom",
                    "vladimir"
                ],

                random:
                    () => 0
            });


        assert.deepEqual(
            result.skippedCombatantIds,
            [
                "artyom"
            ]
        );

        assert.equal(
            result.assignments.length,
            1
        );

        assert.equal(
            result.assignments[0].initiative,
            4
        );

        assert.equal(
            combat.combatants
                .get("artyom")
                .initiative,
            3
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
    "rollMetroInitiativeForCombatants ne tire pas deux fois pour un identifiant dupliqué",
    async () => {

        const cards = [
            createCardStub({
                id:
                    "card-6",

                initiative:
                    6
            }),

            createCardStub({
                id:
                    "card-9",

                initiative:
                    9
            })
        ];


        const combat =
            createCombatStub({
                combatants: [
                    {
                        id:
                            "vladimir",

                        initiative:
                            null
                    }
                ]
            });


        const result =
            await rollMetroInitiativeForCombatants({
                combat,

                deck:
                    createDeckStub(
                        cards
                    ),

                combatantIds: [
                    "vladimir",
                    "vladimir"
                ],

                random:
                    () => 0
            });


        assert.equal(
            result.assignments.length,
            1
        );


        assert.equal(
            result.assignments[0].initiative,
            6
        );


        /*
         * Aucune Card n'est physiquement
         * réservée.
         *
         * Le fait qu'un seul tirage logique
         * ait eu lieu est démontré par
         * result.assignments.length === 1.
         */
        assert.equal(
            cards[0].drawn,
            false
        );

        assert.equal(
            cards[1].drawn,
            false
        );

    }
);


test(
    "rollMetroInitiativeForCombatants accepte une liste vide",
    async () => {

        const combat =
            createCombatStub({
                combatants: []
            });


        const result =
            await rollMetroInitiativeForCombatants({
                combat,

                deck:
                    createDeckStub(
                        []
                    ),

                combatantIds:
                    []
            });


        assert.deepEqual(
            result,
            {
                assignments:
                    [],

                skippedCombatantIds:
                    []
            }
        );

    }
);


test(
    "rollMetroInitiativeForCombatants refuse un Combatant absent du Combat",
    async () => {

        const combat =
            createCombatStub({
                combatants: []
            });


        await assert.rejects(
            () =>
                rollMetroInitiativeForCombatants({
                    combat,

                    deck:
                        createDeckStub(
                            []
                        ),

                    combatantIds: [
                        "inconnu"
                    ]
                }),
            /ne participe pas au combat/
        );

    }
);


test(
    "rollMetroInitiativeForCombatants refuse une liste de Combatants invalide",
    async () => {

        const combat =
            createCombatStub({
                combatants: []
            });


        await assert.rejects(
            () =>
                rollMetroInitiativeForCombatants({
                    combat,

                    deck:
                        createDeckStub(
                            []
                        ),

                    combatantIds:
                        null
                }),
            {
                name:
                    "TypeError"
            }
        );

    }
);