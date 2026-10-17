import test from "node:test";
import assert from "node:assert/strict";

import { InitiativeSwapService }
    from "../../src/combat/initiative-swap-service.mjs";

import { getCombatInitiativeAssignments }
    from "../../src/foundry/initiative/metro-initiative-assignment-application.mjs";


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


function createCombatStub({
    combatants = [],
    assignments = [],
    pendingInitiativeSwaps = [],
    round = 1
} = {}) {

    const flags = {
        initiativeAssignments:
            structuredClone(
                assignments
            ),

        pendingInitiativeSwaps:
            structuredClone(
                pendingInitiativeSwaps
            )
    };

    const combatantMap =
        new Map(
            combatants.map(
                entry => [
                    entry.id,
                    {
                        id:
                            entry.id,

                        initiative:
                            entry.initiative
                    }
                ]
            )
        );

    const setFlagCalls = [];
    const updateCalls = [];


    return {
        round,

        combatants:
            combatantMap,

        setFlagCalls,
        updateCalls,

        getFlag(
            scope,
            key
        ) {

            if (scope !== "metro-2033-yze") {
                return undefined;
            }


            return flags[key];
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


            if (scope === "metro-2033-yze") {
                flags[key] =
                    structuredClone(value);
            }


            return this;
        },

        async updateEmbeddedDocuments(
            embeddedName,
            updates
        ) {

            updateCalls.push({
                embeddedName,

                updates:
                    structuredClone(updates)
            });


            for (const update of updates) {

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
    "applyPendingSwaps échange les valeurs numériques lorsqu'aucune carte n'est suivie",
    async () => {

        const combat =
            createCombatStub({
                combatants: [
                    { id: "vladimir", initiative: 5 },
                    { id: "artyom", initiative: 2 }
                ],

                pendingInitiativeSwaps: [
                    {
                        id: "swap-1",
                        createdRound: 0,
                        applyRound: 1,

                        attacker: {
                            actorId: "actor-vladimir",
                            combatantId: "vladimir",
                            initiative: 5
                        },

                        target: {
                            actorId: "actor-artyom",
                            combatantId: "artyom",
                            initiative: 2
                        }
                    }
                ]
            });


        const result =
            await InitiativeSwapService.applyPendingSwaps(
                combat
            );


        assert.equal(
            combat.combatants.get("vladimir").initiative,
            2
        );

        assert.equal(
            combat.combatants.get("artyom").initiative,
            5
        );

        assert.equal(
            result.applied.length,
            1
        );

    }
);


test(
    "applyPendingSwaps déplace l'appartenance des cartes d'initiative plutôt que de seulement permuter les projections numériques",
    async () => {

        const combat =
            createCombatStub({
                combatants: [
                    { id: "vladimir", initiative: 8 },
                    { id: "artyom", initiative: 3 }
                ],

                assignments: [
                    {
                        cardId: "card-8",
                        initiative: 8,
                        combatantIds: ["vladimir"]
                    },
                    {
                        cardId: "card-3",
                        initiative: 3,
                        combatantIds: ["artyom"]
                    }
                ],

                pendingInitiativeSwaps: [
                    {
                        id: "swap-1",
                        createdRound: 0,
                        applyRound: 1,

                        attacker: {
                            actorId: "actor-vladimir",
                            combatantId: "vladimir",
                            initiative: 8
                        },

                        target: {
                            actorId: "actor-artyom",
                            combatantId: "artyom",
                            initiative: 3
                        }
                    }
                ]
            });


        await InitiativeSwapService.applyPendingSwaps(
            combat
        );


        assert.equal(
            combat.combatants.get("vladimir").initiative,
            3
        );

        assert.equal(
            combat.combatants.get("artyom").initiative,
            8
        );


        assert.deepEqual(
            getCombatInitiativeAssignments(combat),
            [
                {
                    cardId: "card-8",
                    initiative: 8,
                    combatantIds: ["artyom"]
                },
                {
                    cardId: "card-3",
                    initiative: 3,
                    combatantIds: ["vladimir"]
                }
            ]
        );

    }
);


test(
    "applyPendingSwaps reste cohérent après une restitution du Combat qui re-projette l'initiative depuis les cartes",
    async () => {

        const combat =
            createCombatStub({
                combatants: [
                    { id: "vladimir", initiative: 8 },
                    { id: "artyom", initiative: 3 }
                ],

                assignments: [
                    {
                        cardId: "card-8",
                        initiative: 8,
                        combatantIds: ["vladimir"]
                    },
                    {
                        cardId: "card-3",
                        initiative: 3,
                        combatantIds: ["artyom"]
                    }
                ],

                pendingInitiativeSwaps: [
                    {
                        id: "swap-1",
                        createdRound: 0,
                        applyRound: 1,

                        attacker: {
                            actorId: "actor-vladimir",
                            combatantId: "vladimir",
                            initiative: 8
                        },

                        target: {
                            actorId: "actor-artyom",
                            combatantId: "artyom",
                            initiative: 3
                        }
                    }
                ]
            });


        await InitiativeSwapService.applyPendingSwaps(
            combat
        );


        /*
        * On simule ici une opération ultérieure qui
        * re-projette Combatant.initiative depuis
        * l'autorité persistante des cartes (par exemple
        * une réattribution ou un nettoyage) : elle NE
        * DOIT PAS annuler l'échange, puisque celui-ci a
        * déjà déplacé l'appartenance dans les cartes
        * elles-mêmes.
        */
        const assignments =
            getCombatInitiativeAssignments(combat);

        for (const assignment of assignments) {

            for (const combatantId of assignment.combatantIds) {

                await combat.updateEmbeddedDocuments(
                    "Combatant",
                    [
                        {
                            _id: combatantId,
                            initiative: assignment.initiative
                        }
                    ]
                );

            }

        }


        assert.equal(
            combat.combatants.get("vladimir").initiative,
            3
        );

        assert.equal(
            combat.combatants.get("artyom").initiative,
            8
        );

    }
);


test(
    "applyPendingSwaps retombe sur l'échange numérique si un seul des deux Combatants est suivi par une carte",
    async () => {

        const combat =
            createCombatStub({
                combatants: [
                    { id: "vladimir", initiative: 8 },
                    { id: "artyom", initiative: 3 }
                ],

                assignments: [
                    {
                        cardId: "card-8",
                        initiative: 8,
                        combatantIds: ["vladimir"]
                    }
                ],

                pendingInitiativeSwaps: [
                    {
                        id: "swap-1",
                        createdRound: 0,
                        applyRound: 1,

                        attacker: {
                            actorId: "actor-vladimir",
                            combatantId: "vladimir",
                            initiative: 8
                        },

                        target: {
                            actorId: "actor-artyom",
                            combatantId: "artyom",
                            initiative: 3
                        }
                    }
                ]
            });


        await InitiativeSwapService.applyPendingSwaps(
            combat
        );


        assert.equal(
            combat.combatants.get("vladimir").initiative,
            3
        );

        assert.equal(
            combat.combatants.get("artyom").initiative,
            8
        );


        assert.deepEqual(
            getCombatInitiativeAssignments(combat),
            [
                {
                    cardId: "card-8",
                    initiative: 8,
                    combatantIds: ["vladimir"]
                }
            ]
        );

    }
);


test(
    "applyPendingSwaps ignore un échange dont un participant a quitté le combat",
    async () => {

        const combat =
            createCombatStub({
                combatants: [
                    { id: "vladimir", initiative: 8 }
                ],

                pendingInitiativeSwaps: [
                    {
                        id: "swap-1",
                        createdRound: 0,
                        applyRound: 1,

                        attacker: {
                            actorId: "actor-vladimir",
                            combatantId: "vladimir",
                            initiative: 8
                        },

                        target: {
                            actorId: "actor-artyom",
                            combatantId: "artyom-parti",
                            initiative: 3
                        }
                    }
                ]
            });


        const result =
            await InitiativeSwapService.applyPendingSwaps(
                combat
            );


        assert.equal(
            result.applied.length,
            0
        );

        assert.deepEqual(
            result.skipped,
            [
                {
                    id: "swap-1",
                    reason: "combatant-missing"
                }
            ]
        );

        assert.equal(
            combat.combatants.get("vladimir").initiative,
            8
        );

    }
);


test(
    "applyPendingSwaps ne réécrit pas le flag des cartes lorsqu'aucun échange n'a déplacé d'appartenance",
    async () => {

        const combat =
            createCombatStub({
                combatants: [
                    { id: "vladimir", initiative: 8 },
                    { id: "artyom", initiative: 3 }
                ],

                pendingInitiativeSwaps: [
                    {
                        id: "swap-1",
                        createdRound: 0,
                        applyRound: 1,

                        attacker: {
                            actorId: "actor-vladimir",
                            combatantId: "vladimir",
                            initiative: 8
                        },

                        target: {
                            actorId: "actor-artyom",
                            combatantId: "artyom",
                            initiative: 3
                        }
                    }
                ]
            });


        await InitiativeSwapService.applyPendingSwaps(
            combat
        );


        const assignmentFlagCalls =
            combat.setFlagCalls.filter(
                call =>
                    call.key === "initiativeAssignments"
            );

        assert.equal(
            assignmentFlagCalls.length,
            0
        );

    }
);


test(
    "applyPendingSwaps conserve les échanges non encore échus",
    async () => {

        const combat =
            createCombatStub({
                round: 1,

                combatants: [
                    { id: "vladimir", initiative: 8 },
                    { id: "artyom", initiative: 3 }
                ],

                pendingInitiativeSwaps: [
                    {
                        id: "swap-futur",
                        createdRound: 1,
                        applyRound: 2,

                        attacker: {
                            actorId: "actor-vladimir",
                            combatantId: "vladimir",
                            initiative: 8
                        },

                        target: {
                            actorId: "actor-artyom",
                            combatantId: "artyom",
                            initiative: 3
                        }
                    }
                ]
            });


        const result =
            await InitiativeSwapService.applyPendingSwaps(
                combat
            );


        assert.equal(
            result.applied.length,
            0
        );

        assert.equal(
            result.remaining,
            1
        );

        assert.equal(
            combat.combatants.get("vladimir").initiative,
            8
        );

        assert.equal(
            combat.combatants.get("artyom").initiative,
            3
        );

    }
);
