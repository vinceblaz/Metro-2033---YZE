import test from "node:test";
import assert from "node:assert/strict";

import {
    drawAndAssignMetroInitiative
} from "../../../src/foundry/initiative/metro-initiative-draw-assignment.mjs";


function createCardStub({
    id,
    initiative,
    rollbackFails = false
}) {

    const updates = [];


    return {
        id,

        drawn:
            false,

        updates,

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

            updates.push({
                ...changes
            });


            if (
                rollbackFails
                && changes.drawn === false
            ) {

                throw new Error(
                    "rollback-failed"
                );

            }


            Object.assign(
                this,
                changes
            );


            return this;
        }
    };
}


function createCombatStub({
    combatantIds = [],
    assignments = [],
    projectionFails = false
} = {}) {

    let persistedAssignments =
        structuredClone(
            assignments
        );

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

            if (projectionFails) {

                throw new Error(
                    "projection-failed"
                );

            }


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
    "drawAndAssignMetroInitiative tire puis attribue une initiative individuelle",
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
                combatantIds: [
                    "vladimir"
                ]
            });


        const result =
            await drawAndAssignMetroInitiative({
                combat,

                deck: {
                    cards:
                        new Map([
                            [
                                card.id,
                                card
                            ]
                        ]),

                    availableCards: [
                        card
                    ]
                },

                combatantIds: [
                    "vladimir"
                ],

                random:
                    () => 0
            });


        assert.equal(
            result.cardId,
            "card-4"
        );

        assert.equal(
            result.initiative,
            4
        );

        assert.deepEqual(
            result.combatantIds,
            [
                "vladimir"
            ]
        );

        assert.equal(
            card.drawn,
            false
        );

        assert.deepEqual(
            card.updates,
            []
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
    "drawAndAssignMetroInitiative attribue une seule carte à plusieurs Combatants groupés",
    async () => {

        const card =
            createCardStub({
                id:
                    "card-7",

                initiative:
                    7
            });

        const combat =
            createCombatStub({
                combatantIds: [
                    "brigand-1",
                    "brigand-2",
                    "brigand-3"
                ]
            });


        const result =
            await drawAndAssignMetroInitiative({
                combat,

                deck: {
                    cards:
                        new Map([
                            [
                                card.id,
                                card
                            ]
                        ]),

                    availableCards: [
                        card
                    ]
                },

                combatantIds: [
                    "brigand-1",
                    "brigand-2",
                    "brigand-3"
                ],

                random:
                    () => 0
            });


        assert.deepEqual(
            result.combatantIds,
            [
                "brigand-1",
                "brigand-2",
                "brigand-3"
            ]
        );


        for (
            const combatantId
            of result.combatantIds
        ) {

            assert.equal(
                combat.combatants
                    .get(combatantId)
                    .initiative,
                7
            );

        }

    }
);


test(
    "drawAndAssignMetroInitiative laisse la Card intacte si l'attribution est refusée",
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
                combatantIds: [
                    "vladimir"
                ],

                assignments: [
                    {
                        cardId:
                            "card-8",

                        initiative:
                            8,

                        combatantIds: [
                            "vladimir"
                        ]
                    }
                ]
            });


        combat.combatants
            .get("vladimir")
            .initiative = 8;


        const deck = {
            cards:
                new Map([
                    [
                        card.id,
                        card
                    ]
                ]),

            availableCards: [
                card
            ]
        };


        await assert.rejects(
            () =>
                drawAndAssignMetroInitiative({
                    combat,

                    deck,

                    combatantIds: [
                        "vladimir"
                    ],

                    random:
                        () => 0
                }),
            /possède déjà une initiative/
        );


        /*
         * Le refus appartient au Combat
         * courant.
         *
         * Il ne doit provoquer aucune
         * réservation ni libération globale
         * de la Card Foundry.
         */
        assert.deepEqual(
            card.updates,
            []
        );

        assert.equal(
            card.drawn,
            false
        );


        assert.equal(
            combat.combatants
                .get("vladimir")
                .initiative,
            8
        );

    }
);


test(
    "drawAndAssignMetroInitiative libère la carte si la projection Foundry échoue",
    async () => {

        const card =
            createCardStub({
                id:
                    "card-8",

                initiative:
                    8
            });

        const combat =
            createCombatStub({
                combatantIds: [
                    "vladimir"
                ],

                projectionFails:
                    true
            });


        await assert.rejects(
            () =>
                drawAndAssignMetroInitiative({
                    combat,

                    deck: {
                        cards:
                            new Map([
                                [
                                    card.id,
                                    card
                                ]
                            ]),

                        availableCards: [
                            card
                        ]
                    },

                    combatantIds: [
                        "vladimir"
                    ],

                    random:
                        () => 0
                }),
            /projection-failed/
        );


        assert.equal(
            card.drawn,
            false
        );

    }
);


test(
    "drawAndAssignMetroInitiative propage l'échec d'attribution sans compensation globale de Card",
    async () => {

        const card =
            createCardStub({
                id:
                    "card-4",

                initiative:
                    4,

                /*
                 * Si une compensation globale
                 * était encore tentée, le stub
                 * la ferait échouer.
                 */
                rollbackFails:
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
                            "card-8",

                        initiative:
                            8,

                        combatantIds: [
                            "vladimir"
                        ]
                    }
                ]
            });


        combat.combatants
            .get("vladimir")
            .initiative = 8;


        const deck = {
            cards:
                new Map([
                    [
                        card.id,
                        card
                    ]
                ]),

            availableCards: [
                card
            ]
        };


        await assert.rejects(
            () =>
                drawAndAssignMetroInitiative({
                    combat,

                    deck,

                    combatantIds: [
                        "vladimir"
                    ],

                    random:
                        () => 0
                }),
            error => {

                /*
                 * L'erreur métier d'origine
                 * doit être propagée telle
                 * quelle.
                 *
                 * Elle ne doit plus être
                 * transformée en AggregateError
                 * par une compensation de Card.
                 */
                assert.equal(
                    error instanceof AggregateError,
                    false
                );

                assert.match(
                    error.message,
                    /possède déjà une initiative/
                );


                return true;

            }
        );


        /*
         * rollbackFails=true constitue ici
         * notre sentinelle :
         *
         * aucune tentative drawn=false ne doit
         * avoir eu lieu.
         */
        assert.deepEqual(
            card.updates,
            []
        );

    }
);

test(
    "drawAndAssignMetroInitiative peut utiliser dans un Combat une carte déjà tirée par un autre Combat",
    async () => {

        /*
         * Cette carte représente une carte
         * physiquement marquée drawn parce
         * qu'elle est utilisée dans un autre
         * Combat.
         *
         * Sa valeur doit néanmoins rester
         * disponible pour le Combat courant.
         */
        const card =
            createCardStub({
                id:
                    "card-2",

                initiative:
                    2
            });


        card.drawn =
            true;


        const combat =
            createCombatStub({
                combatantIds: [
                    "vladimir"
                ],

                /*
                 * Aucune attribution dans CE
                 * Combat : l'initiative 2 doit
                 * donc être disponible ici.
                 */
                assignments: []
            });


        /*
         * Foundry ne place plus card-2 dans
         * availableCards puisqu'elle est déjà
         * drawn par un autre Combat.
         *
         * Le catalogue physique du deck
         * contient cependant toujours la
         * carte.
         */
        const deck = {
            cards:
                new Map([
                    [
                        card.id,
                        card
                    ]
                ]),

            availableCards:
                []
        };


        const result =
            await drawAndAssignMetroInitiative({
                combat,

                deck,

                combatantIds: [
                    "vladimir"
                ],

                random:
                    () => 0
            });


        assert.equal(
            result.cardId,
            "card-2"
        );

        assert.equal(
            result.initiative,
            2
        );

        assert.equal(
            combat.combatants
                .get("vladimir")
                .initiative,
            2
        );

    }
);

test(
    "drawAndAssignMetroInitiative ne peut pas réutiliser une carte déjà attribuée dans le même Combat",
    async () => {

        const card =
            createCardStub({
                id:
                    "card-2",

                initiative:
                    2
            });


        /*
         * La carte 2 existe dans le catalogue
         * physique.
         *
         * Son état drawn ne doit plus être
         * l'autorité métier déterminant sa
         * disponibilité pour ce Combat.
         */
        card.drawn =
            true;


        const combat =
            createCombatStub({
                combatantIds: [
                    "vladimir",
                    "anna"
                ],

                /*
                 * Dans CE Combat, Vladimir
                 * possède déjà la carte 2.
                 *
                 * La même carte ne doit donc
                 * pas pouvoir être attribuée
                 * à Anna.
                 */
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


        const deck = {
            cards:
                new Map([
                    [
                        card.id,
                        card
                    ]
                ]),

            /*
             * Comme dans le cas inter-Combat,
             * Foundry considère physiquement
             * cette carte comme déjà tirée.
             *
             * La différence métier vient ici
             * des initiativeAssignments du
             * Combat courant.
             */
            availableCards:
                []
        };


        await assert.rejects(
            () =>
                drawAndAssignMetroInitiative({
                    combat,

                    deck,

                    combatantIds: [
                        "anna"
                    ],

                    random:
                        () => 0
                }),
            /Aucune carte d'initiative/
        );


        /*
         * L'attribution existante doit rester
         * intacte.
         */
        assert.equal(
            combat.combatants
                .get("vladimir")
                .initiative,
            2
        );


        /*
         * Anna ne reçoit aucune initiative.
         */
        assert.equal(
            combat.combatants
                .get("anna")
                .initiative,
            null
        );


        /*
         * La carte appartenant déjà à ce
         * Combat ne doit subir aucune
         * mutation supplémentaire.
         */
        assert.deepEqual(
            card.updates,
            []
        );

    }
);

test(
    "drawAndAssignMetroInitiative exclut du tirage les cartes déjà attribuées dans le même Combat",
    async () => {

        const card2 =
            createCardStub({
                id:
                    "card-2",

                initiative:
                    2
            });


        const card7 =
            createCardStub({
                id:
                    "card-7",

                initiative:
                    7
            });


        /*
         * L'état physique du deck ne doit pas
         * décider de la disponibilité métier.
         *
         * La carte 2 peut notamment être
         * drawn à cause d'un autre Combat.
         */
        card2.drawn =
            true;


        const combat =
            createCombatStub({
                combatantIds: [
                    "vladimir",
                    "anna"
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


        /*
         * Le catalogue contient bien les
         * cartes 2 et 7.
         *
         * La disponibilité pour CE Combat
         * doit être calculée à partir de ses
         * initiativeAssignments :
         *
         * - card-2 : indisponible ;
         * - card-7 : disponible.
         */
        const deck = {
            cards:
                new Map([
                    [
                        card2.id,
                        card2
                    ],
                    [
                        card7.id,
                        card7
                    ]
                ]),

            /*
             * Cette propriété ne doit plus
             * constituer l'autorité métier.
             *
             * Elle est volontairement vide
             * afin de reproduire un deck dont
             * les cartes peuvent être drawn
             * par d'autres Combats.
             */
            availableCards:
                []
        };


        const result =
            await drawAndAssignMetroInitiative({
                combat,

                deck,

                combatantIds: [
                    "anna"
                ],

                /*
                 * Une seule carte doit rester
                 * disponible localement.
                 */
                random:
                    () => 0
            });


        assert.equal(
            result.cardId,
            "card-7"
        );

        assert.equal(
            result.initiative,
            7
        );


        assert.equal(
            combat.combatants
                .get("vladimir")
                .initiative,
            2
        );

        assert.equal(
            combat.combatants
                .get("anna")
                .initiative,
            7
        );


        /*
         * La carte 2 appartenant déjà à ce
         * Combat ne doit subir aucune
         * mutation.
         */
        assert.deepEqual(
            card2.updates,
            []
        );

    }
);

test(
    "drawAndAssignMetroInitiative ne libère pas globalement la Card si l'attribution échoue",
    async () => {

        const card =
            createCardStub({
                id:
                    "card-2",

                initiative:
                    2
            });


        /*
         * La Card peut déjà être marquée
         * drawn parce qu'un autre Combat
         * utilise la même valeur.
         */
        card.drawn =
            true;


        const combat =
            createCombatStub({
                combatantIds: [
                    "vladimir"
                ],

                assignments: [
                    {
                        cardId:
                            "card-7",

                        initiative:
                            7,

                        combatantIds: [
                            "vladimir"
                        ]
                    }
                ]
            });


        /*
         * Vladimir possède déjà une
         * initiative dans CE Combat.
         *
         * L'application de card-2 doit donc
         * être refusée.
         */
        combat.combatants
            .get("vladimir")
            .initiative = 7;


        const deck = {
            cards:
                new Map([
                    [
                        card.id,
                        card
                    ]
                ]),

            availableCards:
                []
        };


        await assert.rejects(
            () =>
                drawAndAssignMetroInitiative({
                    combat,

                    deck,

                    combatantIds: [
                        "vladimir"
                    ],

                    random:
                        () => 0
                }),
            /possède déjà une initiative/
        );


        /*
         * L'échec de CE Combat ne doit
         * modifier aucun état physique
         * global de la Card.
         *
         * En particulier, il ne doit jamais
         * faire drawn=false : un autre Combat
         * peut encore utiliser card-2.
         */
        assert.deepEqual(
            card.updates,
            []
        );


        assert.equal(
            card.drawn,
            true
        );


        /*
         * L'attribution préexistante du
         * Combat courant reste intacte.
         */
        assert.deepEqual(
            combat.getFlag(
                "metro-2033-yze",
                "initiativeAssignments"
            ),
            [
                {
                    cardId:
                        "card-7",

                    initiative:
                        7,

                    combatantIds: [
                        "vladimir"
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

