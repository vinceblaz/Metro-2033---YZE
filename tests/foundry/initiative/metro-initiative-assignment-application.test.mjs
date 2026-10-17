import test from "node:test";
import assert from "node:assert/strict";

import {
    applyMetroInitiativeAssignment,
    getCombatInitiativeAssignments,
    releaseCombatInitiativeAssignments
} from "../../../src/foundry/initiative/metro-initiative-assignment-application.mjs";


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

    const setFlagCalls = [];
    const updateCalls = [];


    return {
        combatants,

        setFlagCalls,
        updateCalls,

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

            setFlagCalls.push({
                scope,
                key,

                value:
                    structuredClone(value)
            });


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

            updateCalls.push({
                embeddedName,

                updates:
                    structuredClone(updates)
            });


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


function createCardStub({
    id,
    drawn = true
} = {}) {

    const updateCalls = [];


    return {
        id,
        drawn,

        updateCalls,

        async update(
            data
        ) {

            updateCalls.push(
                structuredClone(data)
            );


            if (
                Object.hasOwn(
                    data,
                    "drawn"
                )
            ) {

                this.drawn =
                    data.drawn;

            }


            return this;
        }
    };
}


function createDeckStub(
    cards = []
) {

    return {
        cards:
            new Map(
                cards.map(
                    card => [
                        card.id,
                        card
                    ]
                )
            )
    };
}


test(
    "getCombatInitiativeAssignments retourne une liste vide lorsqu'aucune attribution n'existe",
    () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "vladimir"
                ],
                assignments: null
            });


        assert.deepEqual(
            getCombatInitiativeAssignments(
                combat
            ),
            []
        );

    }
);


test(
    "applyMetroInitiativeAssignment persiste une attribution individuelle",
    async () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "vladimir"
                ]
            });


        const result =
            await applyMetroInitiativeAssignment({
                combat,

                cardId:
                    "card-3",

                initiative:
                    3,

                combatantIds: [
                    "vladimir"
                ]
            });


        assert.deepEqual(
            result.assignment,
            {
                cardId:
                    "card-3",

                initiative:
                    3,

                combatantIds: [
                    "vladimir"
                ]
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
    "applyMetroInitiativeAssignment projette l'initiative sur le Combatant",
    async () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "vladimir"
                ]
            });


        await applyMetroInitiativeAssignment({
            combat,

            cardId:
                "card-7",

            initiative:
                7,

            combatantIds: [
                "vladimir"
            ]
        });


        assert.deepEqual(
            combat.updateCalls,
            [
                {
                    embeddedName:
                        "Combatant",

                    updates: [
                        {
                            _id:
                                "vladimir",

                            initiative:
                                7
                        }
                    ]
                }
            ]
        );


        assert.equal(
            combat.combatants
                .get("vladimir")
                .initiative,
            7
        );

    }
);


test(
    "applyMetroInitiativeAssignment applique une initiative commune à un groupe de Combatants",
    async () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "brigand-1",
                    "brigand-2",
                    "brigand-3"
                ]
            });


        await applyMetroInitiativeAssignment({
            combat,

            cardId:
                "card-6",

            initiative:
                6,

            combatantIds: [
                "brigand-1",
                "brigand-2",
                "brigand-3"
            ]
        });


        assert.deepEqual(
            combat.updateCalls[0],
            {
                embeddedName:
                    "Combatant",

                updates: [
                    {
                        _id:
                            "brigand-1",

                        initiative:
                            6
                    },
                    {
                        _id:
                            "brigand-2",

                        initiative:
                            6
                    },
                    {
                        _id:
                            "brigand-3",

                        initiative:
                            6
                    }
                ]
            }
        );

    }
);


test(
    "applyMetroInitiativeAssignment conserve les attributions déjà présentes",
    async () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "vladimir",
                    "artyom"
                ],

                assignments: [
                    {
                        cardId:
                            "card-2",

                        initiative:
                            2,

                        combatantIds: [
                            "vladimir"
                        ]
                    }
                ]
            });


        await applyMetroInitiativeAssignment({
            combat,

            cardId:
                "card-8",

            initiative:
                8,

            combatantIds: [
                "artyom"
            ]
        });


        assert.deepEqual(
            getCombatInitiativeAssignments(
                combat
            ),
            [
                {
                    cardId:
                        "card-2",

                    initiative:
                        2,

                    combatantIds: [
                        "vladimir"
                    ]
                },
                {
                    cardId:
                        "card-8",

                    initiative:
                        8,

                    combatantIds: [
                        "artyom"
                    ]
                }
            ]
        );

    }
);


test(
    "applyMetroInitiativeAssignment refuse une carte déjà attribuée",
    async () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "vladimir",
                    "artyom"
                ],

                assignments: [
                    {
                        cardId:
                            "card-4",

                        initiative:
                            4,

                        combatantIds: [
                            "vladimir"
                        ]
                    }
                ]
            });


        await assert.rejects(
            () =>
                applyMetroInitiativeAssignment({
                    combat,

                    cardId:
                        "card-4",

                    initiative:
                        7,

                    combatantIds: [
                        "artyom"
                    ]
                }),
            /déjà attribuée/
        );

    }
);


test(
    "applyMetroInitiativeAssignment refuse un Combatant déjà attribué",
    async () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "vladimir"
                ],

                assignments: [
                    {
                        cardId:
                            "card-2",

                        initiative:
                            2,

                        combatantIds: [
                            "vladimir"
                        ]
                    }
                ]
            });


        await assert.rejects(
            () =>
                applyMetroInitiativeAssignment({
                    combat,

                    cardId:
                        "card-9",

                    initiative:
                        9,

                    combatantIds: [
                        "vladimir"
                    ]
                }),
            /possède déjà une initiative/
        );

    }
);


test(
    "applyMetroInitiativeAssignment refuse un Combatant absent du Combat",
    async () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "vladimir"
                ]
            });


        await assert.rejects(
            () =>
                applyMetroInitiativeAssignment({
                    combat,

                    cardId:
                        "card-5",

                    initiative:
                        5,

                    combatantIds: [
                        "inconnu"
                    ]
                }),
            /ne participe pas au combat/
        );


        assert.equal(
            combat.setFlagCalls.length,
            0
        );

        assert.equal(
            combat.updateCalls.length,
            0
        );

    }
);


test(
    "applyMetroInitiativeAssignment restaure les attributions si la projection sur les Combatants échoue",
    async () => {

        const previousAssignments = [
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
                combatantIds: [
                    "artyom",
                    "vladimir"
                ],

                assignments:
                    previousAssignments
            });


        combat.updateEmbeddedDocuments =
            async () => {

                throw new Error(
                    "projection-failed"
                );

            };


        await assert.rejects(
            () =>
                applyMetroInitiativeAssignment({
                    combat,

                    cardId:
                        "card-7",

                    initiative:
                        7,

                    combatantIds: [
                        "vladimir"
                    ]
                }),
            /projection-failed/
        );


        assert.deepEqual(
            getCombatInitiativeAssignments(
                combat
            ),
            previousAssignments
        );


        assert.equal(
            combat.setFlagCalls.length,
            2
        );


        assert.deepEqual(
            combat.setFlagCalls[1].value,
            previousAssignments
        );

    }
);


test(
    "releaseCombatInitiativeAssignments libère uniquement les attributions du Combat sans modifier les Cards",
    async () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "vladimir",
                    "artyom"
                ],

                assignments: [
                    {
                        cardId:
                            "card-2",

                        initiative:
                            2,

                        combatantIds: [
                            "vladimir"
                        ]
                    },
                    {
                        cardId:
                            "card-8",

                        initiative:
                            8,

                        combatantIds: [
                            "artyom"
                        ]
                    }
                ]
            });


        combat.combatants
            .get("vladimir")
            .initiative = 2;

        combat.combatants
            .get("artyom")
            .initiative = 8;


        const card2 =
            createCardStub({
                id:
                    "card-2",

                drawn:
                    true
            });

        const card8 =
            createCardStub({
                id:
                    "card-8",

                drawn:
                    true
            });

        const card5 =
            createCardStub({
                id:
                    "card-5",

                drawn:
                    true
            });


        const deck =
            createDeckStub([
                card2,
                card8,
                card5
            ]);


        const result =
            await releaseCombatInitiativeAssignments({
                combat,
                deck
            });


        /*
         * Toutes les Cards appartiennent au
         * catalogue global.
         *
         * La restitution de ce Combat ne doit
         * en modifier aucune.
         */
        assert.equal(
            card2.drawn,
            true
        );

        assert.equal(
            card8.drawn,
            true
        );

        assert.equal(
            card5.drawn,
            true
        );


        assert.deepEqual(
            card2.updateCalls,
            []
        );

        assert.deepEqual(
            card8.updateCalls,
            []
        );

        assert.deepEqual(
            card5.updateCalls,
            []
        );


        assert.equal(
            combat.combatants
                .get("vladimir")
                .initiative,
            null
        );

        assert.equal(
            combat.combatants
                .get("artyom")
                .initiative,
            null
        );


        assert.deepEqual(
            getCombatInitiativeAssignments(
                combat
            ),
            []
        );


        /*
         * Les identifiants restent retournés
         * comme information de libération
         * logique dans CE Combat.
         */
        assert.deepEqual(
            result.releasedCardIds,
            [
                "card-2",
                "card-8"
            ]
        );

    }
);

test(
    "releaseCombatInitiativeAssignments nettoie le Combat même si une Card attribuée est absente du paquet",
    async () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "vladimir",
                    "artyom"
                ],

                assignments: [
                    {
                        cardId:
                            "card-2",

                        initiative:
                            2,

                        combatantIds: [
                            "vladimir"
                        ]
                    },
                    {
                        cardId:
                            "card-8",

                        initiative:
                            8,

                        combatantIds: [
                            "artyom"
                        ]
                    }
                ]
            });


        combat.combatants
            .get("vladimir")
            .initiative = 2;

        combat.combatants
            .get("artyom")
            .initiative = 8;


        const card2 =
            createCardStub({
                id:
                    "card-2",

                drawn:
                    true
            });


        /*
         * card-8 est volontairement absente
         * du catalogue.
         */
        const deck =
            createDeckStub([
                card2
            ]);


        const result =
            await releaseCombatInitiativeAssignments({
                combat,
                deck
            });


        assert.equal(
            combat.combatants
                .get("vladimir")
                .initiative,
            null
        );

        assert.equal(
            combat.combatants
                .get("artyom")
                .initiative,
            null
        );


        assert.deepEqual(
            getCombatInitiativeAssignments(
                combat
            ),
            []
        );


        /*
         * La Card existante n'est pas touchée.
         */
        assert.equal(
            card2.drawn,
            true
        );

        assert.deepEqual(
            card2.updateCalls,
            []
        );


        assert.deepEqual(
            result.releasedCardIds,
            [
                "card-2",
                "card-8"
            ]
        );

    }
);

test(
    "releaseCombatInitiativeAssignments ne dépend pas de la capacité des Cards à être mises à jour",
    async () => {

        const combat =
            createCombatStub({
                combatantIds: [
                    "vladimir"
                ],

                assignments: [
                    {
                        cardId:
                            "card-2",

                        initiative:
                            2,

                        combatantIds: [
                            "vladimir"
                        ]
                    }
                ]
            });


        combat.combatants
            .get("vladimir")
            .initiative = 2;


        const card2 = {
            id:
                "card-2",

            drawn:
                true
        };


        /*
         * La Card ne possède volontairement
         * aucune méthode update().
         */
        const deck =
            createDeckStub([
                card2
            ]);


        const result =
            await releaseCombatInitiativeAssignments({
                combat,
                deck
            });


        assert.equal(
            combat.combatants
                .get("vladimir")
                .initiative,
            null
        );


        assert.deepEqual(
            getCombatInitiativeAssignments(
                combat
            ),
            []
        );


        assert.equal(
            card2.drawn,
            true
        );


        assert.deepEqual(
            result.releasedCardIds,
            [
                "card-2"
            ]
        );

    }
);

test(
    "releaseCombatInitiativeAssignments conserve les attributions si la remise à zéro des initiatives échoue",
    async () => {

        const assignments = [
            {
                cardId:
                    "card-2",

                initiative:
                    2,

                combatantIds: [
                    "vladimir"
                ]
            },
            {
                cardId:
                    "card-8",

                initiative:
                    8,

                combatantIds: [
                    "artyom"
                ]
            }
        ];


        const combat =
            createCombatStub({
                combatantIds: [
                    "vladimir",
                    "artyom"
                ],

                assignments
            });


        combat.combatants
            .get("vladimir")
            .initiative = 2;

        combat.combatants
            .get("artyom")
            .initiative = 8;


        combat.updateEmbeddedDocuments =
            async () => {

                throw new Error(
                    "initiative-reset-failed"
                );

            };


        const card2 =
            createCardStub({
                id:
                    "card-2",

                drawn:
                    true
            });

        const card8 =
            createCardStub({
                id:
                    "card-8",

                drawn:
                    true
            });


        const deck =
            createDeckStub([
                card2,
                card8
            ]);


        await assert.rejects(
            () =>
                releaseCombatInitiativeAssignments({
                    combat,
                    deck
                }),
            /initiative-reset-failed/
        );


        /*
         * Aucun état de Card ne participe à
         * la transaction.
         */
        assert.equal(
            card2.drawn,
            true
        );

        assert.equal(
            card8.drawn,
            true
        );

        assert.deepEqual(
            card2.updateCalls,
            []
        );

        assert.deepEqual(
            card8.updateCalls,
            []
        );


        /*
         * Le stub échoue avant toute mutation
         * des projections.
         */
        assert.equal(
            combat.combatants
                .get("vladimir")
                .initiative,
            2
        );

        assert.equal(
            combat.combatants
                .get("artyom")
                .initiative,
            8
        );


        /*
         * Le flag n'a pas encore été modifié.
         */
        assert.deepEqual(
            getCombatInitiativeAssignments(
                combat
            ),
            assignments
        );


        assert.equal(
            combat.setFlagCalls.length,
            0
        );

    }
);

test(
    "releaseCombatInitiativeAssignments restaure les initiatives si la suppression des attributions échoue",
    async () => {

        const assignments = [
            {
                cardId:
                    "card-2",

                initiative:
                    2,

                combatantIds: [
                    "vladimir"
                ]
            },
            {
                cardId:
                    "card-8",

                initiative:
                    8,

                combatantIds: [
                    "artyom"
                ]
            }
        ];


        const combat =
            createCombatStub({
                combatantIds: [
                    "vladimir",
                    "artyom"
                ],

                assignments
            });


        combat.combatants
            .get("vladimir")
            .initiative = 2;

        combat.combatants
            .get("artyom")
            .initiative = 8;


        const originalSetFlag =
            combat.setFlag.bind(
                combat
            );


        combat.setFlag =
            async (
                scope,
                key,
                value
            ) => {

                if (
                    Array.isArray(value)
                    && value.length === 0
                ) {

                    throw new Error(
                        "assignment-clear-failed"
                    );

                }


                return originalSetFlag(
                    scope,
                    key,
                    value
                );

            };


        const card2 =
            createCardStub({
                id:
                    "card-2",

                drawn:
                    true
            });

        const card8 =
            createCardStub({
                id:
                    "card-8",

                drawn:
                    true
            });


        const deck =
            createDeckStub([
                card2,
                card8
            ]);


        await assert.rejects(
            () =>
                releaseCombatInitiativeAssignments({
                    combat,
                    deck
                }),
            /assignment-clear-failed/
        );


        /*
         * Les Cards restent hors de la
         * transaction.
         */
        assert.equal(
            card2.drawn,
            true
        );

        assert.equal(
            card8.drawn,
            true
        );

        assert.deepEqual(
            card2.updateCalls,
            []
        );

        assert.deepEqual(
            card8.updateCalls,
            []
        );


        /*
         * Les projections ont d'abord été
         * supprimées puis restaurées.
         */
        assert.equal(
            combat.combatants
                .get("vladimir")
                .initiative,
            2
        );

        assert.equal(
            combat.combatants
                .get("artyom")
                .initiative,
            8
        );


        assert.deepEqual(
            combat.updateCalls,
            [
                {
                    embeddedName:
                        "Combatant",

                    updates: [
                        {
                            _id:
                                "vladimir",

                            initiative:
                                null
                        },
                        {
                            _id:
                                "artyom",

                            initiative:
                                null
                        }
                    ]
                },
                {
                    embeddedName:
                        "Combatant",

                    updates: [
                        {
                            _id:
                                "vladimir",

                            initiative:
                                2
                        },
                        {
                            _id:
                                "artyom",

                            initiative:
                                8
                        }
                    ]
                }
            ]
        );


        assert.deepEqual(
            getCombatInitiativeAssignments(
                combat
            ),
            assignments
        );

    }
);

test(
    "releaseCombatInitiativeAssignments signale un AggregateError si la restauration des initiatives échoue",
    async () => {

        const assignments = [
            {
                cardId:
                    "card-2",

                initiative:
                    2,

                combatantIds: [
                    "vladimir"
                ]
            }
        ];


        const combat =
            createCombatStub({
                combatantIds: [
                    "vladimir"
                ],

                assignments
            });


        combat.combatants
            .get("vladimir")
            .initiative = 2;


        /*
         * Premier appel :
         * remise à zéro réussie.
         *
         * Second appel :
         * rollback de projection en échec.
         */
        let projectionCallCount =
            0;


        const originalUpdateEmbeddedDocuments =
            combat.updateEmbeddedDocuments.bind(
                combat
            );


        combat.updateEmbeddedDocuments =
            async (
                embeddedName,
                updates
            ) => {

                projectionCallCount += 1;


                if (
                    projectionCallCount === 2
                ) {

                    throw new Error(
                        "initiative-rollback-failed"
                    );

                }


                return originalUpdateEmbeddedDocuments(
                    embeddedName,
                    updates
                );

            };


        combat.setFlag =
            async () => {

                throw new Error(
                    "assignment-clear-failed"
                );

            };


        const card2 =
            createCardStub({
                id:
                    "card-2",

                drawn:
                    true
            });


        const deck =
            createDeckStub([
                card2
            ]);


        let thrownError =
            null;


        try {

            await releaseCombatInitiativeAssignments({
                combat,
                deck
            });

        }
        catch (error) {

            thrownError =
                error;

        }


        assert.ok(
            thrownError
                instanceof AggregateError
        );


        assert.equal(
            thrownError.errors.length,
            2
        );


        assert.match(
            thrownError.errors[0].message,
            /assignment-clear-failed/
        );


        assert.match(
            thrownError.errors[1].message,
            /initiative-rollback-failed/
        );


        /*
         * Aucune Card ne participe au rollback.
         */
        assert.equal(
            card2.drawn,
            true
        );

        assert.deepEqual(
            card2.updateCalls,
            []
        );


        /*
         * La remise à zéro initiale a réussi.
         * Le rollback ayant ensuite échoué,
         * la projection reste dans cet état
         * dégradé.
         *
         * L'AggregateError rend explicitement
         * compte de cette situation.
         */
        assert.equal(
            combat.combatants
                .get("vladimir")
                .initiative,
            null
        );


        /*
         * Le setFlag ayant échoué, l'autorité
         * persistante reste présente.
         */
        assert.deepEqual(
            getCombatInitiativeAssignments(
                combat
            ),
            assignments
        );

    }
);

test(
    "releaseCombatInitiativeAssignments ignore les Combatants attribués qui ne sont plus présents dans le Combat",
    async () => {

        const assignments = [
            {
                cardId:
                    "card-2",

                initiative:
                    2,

                combatantIds: [
                    "vladimir"
                ]
            },
            {
                cardId:
                    "card-8",

                initiative:
                    8,

                combatantIds: [
                    "combatant-retire"
                ]
            }
        ];


        /*
         * Seul Vladimir existe encore dans
         * l'EmbeddedCollection du Combat.
         *
         * L'autre Combatant a été retiré avant
         * la fin du conflit, mais son assignment
         * persiste encore.
         */
        const combat =
            createCombatStub({
                combatantIds: [
                    "vladimir"
                ],

                assignments
            });


        combat.combatants
            .get("vladimir")
            .initiative = 2;


        const card2 =
            createCardStub({
                id:
                    "card-2",

                drawn:
                    true
            });


        const card8 =
            createCardStub({
                id:
                    "card-8",

                drawn:
                    true
            });


        const deck =
            createDeckStub([
                card2,
                card8
            ]);


        const result =
            await releaseCombatInitiativeAssignments({
                combat,
                deck
            });


        /*
         * Les deux assignments sont libérés
         * logiquement, indépendamment de
         * l'existence actuelle de leurs
         * Combatants.
         */
        assert.deepEqual(
            result.releasedCardIds,
            [
                "card-2",
                "card-8"
            ]
        );


        /*
         * Les Cards appartiennent au catalogue
         * global.
         *
         * La restitution de ce Combat ne doit
         * donc modifier ni leur état drawn ni
         * appeler leur méthode update().
         */
        assert.equal(
            card2.drawn,
            true
        );

        assert.equal(
            card8.drawn,
            true
        );


        assert.deepEqual(
            card2.updateCalls,
            []
        );

        assert.deepEqual(
            card8.updateCalls,
            []
        );


        /*
         * Seul le Combatant encore présent
         * doit être transmis à Foundry.
         *
         * Envoyer l'identifiant du Combatant
         * retiré reproduirait l'erreur réelle :
         *
         * "does not exist in the
         * EmbeddedCollection collection"
         */
        assert.deepEqual(
            combat.updateCalls,
            [
                {
                    embeddedName:
                        "Combatant",

                    updates: [
                        {
                            _id:
                                "vladimir",

                            initiative:
                                null
                        }
                    ]
                }
            ]
        );


        assert.equal(
            combat.combatants
                .get("vladimir")
                .initiative,
            null
        );


        /*
         * La disparition d'un Combatant ne doit
         * pas empêcher le nettoyage de
         * l'autorité persistante du Combat.
         */
        assert.deepEqual(
            getCombatInitiativeAssignments(
                combat
            ),
            []
        );

    }
);

test(
    "releaseCombatInitiativeAssignments nettoie un Combat sans modifier les Cards partagées avec d'autres Combats",
    async () => {

        /*
         * Cette Card représente la valeur 2
         * du catalogue global.
         *
         * Elle peut simultanément être
         * référencée par un autre Combat.
         * Son état global ne doit donc jamais
         * être modifié par la restitution du
         * Combat courant.
         */
        const card2 =
            createCardStub({
                id:
                    "card-2",

                drawn:
                    true
            });


        const combat =
            createCombatStub({
                combatantIds: [
                    "vladimir"
                ],

                assignments: [
                    {
                        cardId:
                            "card-2",

                        initiative:
                            2,

                        combatantIds: [
                            "vladimir"
                        ]
                    }
                ]
            });


        combat.combatants
            .get("vladimir")
            .initiative = 2;


        const deck =
            createDeckStub([
                card2
            ]);


        const result =
            await releaseCombatInitiativeAssignments({
                combat,
                deck
            });


        /*
         * La projection appartenant au Combat
         * courant est bien supprimée.
         */
        assert.equal(
            combat.combatants
                .get("vladimir")
                .initiative,
            null
        );


        /*
         * L'autorité persistante de CE Combat
         * est bien nettoyée.
         */
        assert.deepEqual(
            getCombatInitiativeAssignments(
                combat
            ),
            []
        );


        /*
         * La Card est un élément du catalogue
         * global.
         *
         * La fin de ce Combat ne doit produire
         * aucune mutation physique de la Card,
         * puisqu'un autre Combat peut toujours
         * référencer card-2.
         */
        assert.deepEqual(
            card2.updateCalls,
            []
        );


        assert.equal(
            card2.drawn,
            true
        );


        /*
         * Le résultat peut toujours identifier
         * les cardId dont les assignments ont
         * été retirés du Combat.
         *
         * "releasedCardIds" signifie ici la
         * libération logique dans CE Combat,
         * et non une mutation de Card.drawn.
         */
        assert.deepEqual(
            result.releasedCardIds,
            [
                "card-2"
            ]
        );


        assert.deepEqual(
            combat.updateCalls,
            [
                {
                    embeddedName:
                        "Combatant",

                    updates: [
                        {
                            _id:
                                "vladimir",

                            initiative:
                                null
                        }
                    ]
                }
            ]
        );

    }
);

