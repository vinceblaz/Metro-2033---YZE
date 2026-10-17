import test from "node:test";
import assert from "node:assert/strict";

import {
    registerCombatHooks
} from "../../src/combat/combat-hooks.mjs";


function createCombatantStub({
    id,
    initiative
}) {

    return {
        id,

        initiative,

        actor: {
            id:
                `actor-${id}`
        }
    };
}


function createCombatStub({
    round,
    combatants,
    initiativeAssignments
}) {

    const flags = {
        initiativeAssignments:
            structuredClone(
                initiativeAssignments
            ),

        pendingInitiativeSwaps:
            []
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


    /*
     * Représentation minimale de la
     * EmbeddedCollection Foundry.
     *
     * Contrairement à Map, son itération
     * retourne directement les Documents
     * Combatant et non des couples
     * [id, Combatant].
     */
    const combatantCollection = {

        get(
            id
        ) {

            return (
                combatantMap.get(
                    id
                )
                ?? null
            );

        },


        find(
            predicate
        ) {

            return Array.from(
                combatantMap.values()
            ).find(
                predicate
            );

        },


        values() {

            return combatantMap.values();

        },


        [Symbol.iterator]() {

            return combatantMap
                .values();

        }

    };


    return {
        round,

        combatants:
            combatantCollection,

        getFlag(
            scope,
            key
        ) {

            assert.equal(
                scope,
                "metro-2033-yze"
            );


            return structuredClone(
                flags[key]
            );

        },

        async setFlag(
            scope,
            key,
            value
        ) {

            assert.equal(
                scope,
                "metro-2033-yze"
            );


            flags[key] =
                structuredClone(
                    value
                );


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


                if (
                    combatant
                    && Object.hasOwn(
                        update,
                        "initiative"
                    )
                ) {

                    combatant.initiative =
                        update.initiative;

                }

            }


            return updates;

        }
    };
}


test(
    "un changement de round ne modifie pas l'initiative Métro",
    async () => {

        let updateCombatHook =
            null;


        globalThis.Hooks = {

            on(
                hookName,
                callback
            ) {

                if (
                    hookName
                    === "updateCombat"
                ) {

                    updateCombatHook =
                        callback;

                }


                return callback;
            }

        };


        globalThis.game = {

            user: {
                isGM:
                    true
            }

        };


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


        registerCombatHooks();


        assert.equal(
            typeof updateCombatHook,
            "function"
        );


        const artyom =
            createCombatantStub({
                id:
                    "artyom",

                initiative:
                    2
            });


        const vladimir =
            createCombatantStub({
                id:
                    "vladimir",

                initiative:
                    8
            });


        const initiativeAssignments = [
            {
                cardId:
                    "card-2",

                initiative:
                    2,

                combatantIds: [
                    "artyom"
                ]
            },
            {
                cardId:
                    "card-8",

                initiative:
                    8,

                combatantIds: [
                    "vladimir"
                ]
            }
        ];


        const combat =
            createCombatStub({
                round:
                    2,

                combatants: [
                    artyom,
                    vladimir
                ],

                initiativeAssignments
            });


        await updateCombatHook(
            combat,
            {
                round:
                    2
            },
            {},
            "gm-user"
        );


        assert.equal(
            artyom.initiative,
            2
        );

        assert.equal(
            vladimir.initiative,
            8
        );


        assert.deepEqual(
            combat.getFlag(
                "metro-2033-yze",
                "initiativeAssignments"
            ),
            initiativeAssignments
        );

    }
);

test(
    "une mise à jour sans changement de round ne touche pas l'initiative",
    async () => {

        let updateCombatHook =
            null;


        globalThis.Hooks = {

            on(
                hookName,
                callback
            ) {

                if (
                    hookName
                    === "updateCombat"
                ) {

                    updateCombatHook =
                        callback;

                }


                return callback;
            }

        };


        globalThis.game = {

            user: {
                isGM:
                    true
            }

        };


        registerCombatHooks();


        assert.equal(
            typeof updateCombatHook,
            "function"
        );


        const artyom =
            createCombatantStub({
                id:
                    "artyom",

                initiative:
                    2
            });


        const initiativeAssignments = [
            {
                cardId:
                    "card-2",

                initiative:
                    2,

                combatantIds: [
                    "artyom"
                ]
            }
        ];


        const combat =
            createCombatStub({
                round:
                    2,

                combatants: [
                    artyom
                ],

                initiativeAssignments
            });


        await updateCombatHook(
            combat,
            {
                turn:
                    1
            },
            {},
            "gm-user"
        );


        assert.equal(
            artyom.initiative,
            2
        );


        assert.deepEqual(
            combat.getFlag(
                "metro-2033-yze",
                "initiativeAssignments"
            ),
            initiativeAssignments
        );

    }
);

test(
    "un client non-GM ne déclenche aucune application d'échanges d'initiative",
    async () => {

        let updateCombatHook =
            null;


        globalThis.Hooks = {

            on(
                hookName,
                callback
            ) {

                if (
                    hookName
                    === "updateCombat"
                ) {

                    updateCombatHook =
                        callback;

                }


                return callback;
            }

        };


        globalThis.game = {

            user: {
                isGM:
                    false
            }

        };


        registerCombatHooks();


        assert.equal(
            typeof updateCombatHook,
            "function"
        );


        const artyom =
            createCombatantStub({
                id:
                    "artyom",

                initiative:
                    2
            });


        const initiativeAssignments = [
            {
                cardId:
                    "card-2",

                initiative:
                    2,

                combatantIds: [
                    "artyom"
                ]
            }
        ];


        const combat =
            createCombatStub({
                round:
                    2,

                combatants: [
                    artyom
                ],

                initiativeAssignments
            });


        await updateCombatHook(
            combat,
            {
                round:
                    2
            },
            {},
            "player-user"
        );


        assert.equal(
            artyom.initiative,
            2
        );


        assert.deepEqual(
            combat.getFlag(
                "metro-2033-yze",
                "initiativeAssignments"
            ),
            initiativeAssignments
        );

    }
);

test(
    "l'initiative est conservée sur plusieurs rounds successifs",
    async () => {

        let updateCombatHook =
            null;


        globalThis.Hooks = {

            on(
                hookName,
                callback
            ) {

                if (
                    hookName
                    === "updateCombat"
                ) {

                    updateCombatHook =
                        callback;

                }


                return callback;
            }

        };


        globalThis.game = {

            user: {
                isGM:
                    true
            }

        };


        registerCombatHooks();


        assert.equal(
            typeof updateCombatHook,
            "function"
        );


        const artyom =
            createCombatantStub({
                id:
                    "artyom",

                initiative:
                    2
            });


        const vladimir =
            createCombatantStub({
                id:
                    "vladimir",

                initiative:
                    8
            });


        const initiativeAssignments = [
            {
                cardId:
                    "card-2",

                initiative:
                    2,

                combatantIds: [
                    "artyom"
                ]
            },
            {
                cardId:
                    "card-8",

                initiative:
                    8,

                combatantIds: [
                    "vladimir"
                ]
            }
        ];


        const combat =
            createCombatStub({
                round:
                    2,

                combatants: [
                    artyom,
                    vladimir
                ],

                initiativeAssignments
            });


        /*
         * Passage du round 1 au round 2.
         */
        await updateCombatHook(
            combat,
            {
                round:
                    2
            },
            {},
            "gm-user"
        );


        assert.equal(
            artyom.initiative,
            2
        );

        assert.equal(
            vladimir.initiative,
            8
        );


        /*
         * Foundry a désormais avancé le
         * Combat au round 3 avant d'émettre
         * updateCombat.
         */
        combat.round =
            3;


        await updateCombatHook(
            combat,
            {
                round:
                    3
            },
            {},
            "gm-user"
        );


        /*
         * L'initiative appartient au conflit :
         * aucune nouvelle distribution et
         * aucune restitution entre les rounds.
         */
        assert.equal(
            artyom.initiative,
            2
        );

        assert.equal(
            vladimir.initiative,
            8
        );


        assert.deepEqual(
            combat.getFlag(
                "metro-2033-yze",
                "initiativeAssignments"
            ),
            initiativeAssignments
        );

    }
);
