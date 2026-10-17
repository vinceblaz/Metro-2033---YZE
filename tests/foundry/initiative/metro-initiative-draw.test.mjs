import test from "node:test";
import assert from "node:assert/strict";

import {
    drawMetroInitiativeCard,
    getMetroInitiativeFromCard
} from "../../../src/foundry/initiative/metro-initiative-draw.mjs";


function createCardStub({
    id,
    initiative
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

            Object.assign(
                this,
                changes
            );

            return this;
        }
    };
}


test(
    "getMetroInitiativeFromCard retourne la valeur métier de la carte",
    () => {

        const card =
            createCardStub({
                id:
                    "card-4",

                initiative:
                    4
            });


        assert.equal(
            getMetroInitiativeFromCard(
                card
            ),
            4
        );

    }
);


test(
    "getMetroInitiativeFromCard rejette une valeur d'initiative invalide",
    () => {

        const card =
            createCardStub({
                id:
                    "card-11",

                initiative:
                    11
            });


        assert.throws(
            () =>
                getMetroInitiativeFromCard(
                    card
                ),
            {
                name:
                    "RangeError"
            }
        );

    }
);


test(
    "drawMetroInitiativeCard tire parmi les cartes disponibles",
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


        const result =
            await drawMetroInitiativeCard({
                deck: {
                    availableCards:
                        cards
                },

                random:
                    () => 0.5
            });


        assert.equal(
            result.cardId,
            "card-6"
        );

        assert.equal(
            result.initiative,
            6
        );

        assert.equal(
            result.card,
            cards[1]
        );

    }
);


test(
    "drawMetroInitiativeCard sélectionne uniquement la carte déterminée sans modifier les Cards",
    async () => {

        const firstCard = {
            id:
                "card-1",

            drawn:
                false,

            updates:
                [],

            getFlag() {
                return 1;
            },

            async update(
                changes
            ) {

                this.updates.push(
                    changes
                );

                if (
                    Object.hasOwn(
                        changes,
                        "drawn"
                    )
                ) {

                    this.drawn =
                        changes.drawn;

                }

            }
        };


        const secondCard = {
            id:
                "card-2",

            drawn:
                false,

            updates:
                [],

            getFlag() {
                return 2;
            },

            async update(
                changes
            ) {

                this.updates.push(
                    changes
                );

                if (
                    Object.hasOwn(
                        changes,
                        "drawn"
                    )
                ) {

                    this.drawn =
                        changes.drawn;

                }

            }
        };


        const deck = {
            availableCards: [
                firstCard,
                secondCard
            ]
        };


        const result =
            await drawMetroInitiativeCard({
                deck,

                random:
                    () => 0.75
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
            result.card,
            secondCard
        );


        /*
         * Le tirage Métro est désormais
         * logique et local au Combat.
         *
         * Aucune Card Foundry globale ne doit
         * être mutée par cette opération.
         */
        assert.deepEqual(
            firstCard.updates,
            []
        );

        assert.deepEqual(
            secondCard.updates,
            []
        );

        assert.equal(
            firstCard.drawn,
            false
        );

        assert.equal(
            secondCard.drawn,
            false
        );

    }
);


test(
    "drawMetroInitiativeCard ne peut plus tirer une carte absente des cartes disponibles",
    async () => {

        const remainingCard =
            createCardStub({
                id:
                    "card-7",

                initiative:
                    7
            });


        const result =
            await drawMetroInitiativeCard({
                deck: {
                    availableCards: [
                        remainingCard
                    ]
                },

                random:
                    () => 0
            });


        assert.equal(
            result.cardId,
            "card-7"
        );

    }
);


test(
    "drawMetroInitiativeCard refuse un paquet sans carte disponible",
    async () => {

        await assert.rejects(
            () =>
                drawMetroInitiativeCard({
                    deck: {
                        availableCards:
                            []
                    },

                    random:
                        () => 0
                }),
            /Aucune carte d'initiative/
        );

    }
);


test(
    "drawMetroInitiativeCard refuse une valeur aléatoire hors de l'intervalle attendu",
    async () => {

        const deck = {
            availableCards: [
                createCardStub({
                    id:
                        "card-3",

                    initiative:
                        3
                })
            ]
        };


        await assert.rejects(
            () =>
                drawMetroInitiativeCard({
                    deck,

                    random:
                        () => 1
                }),
            {
                name:
                    "RangeError"
            }
        );


        await assert.rejects(
            () =>
                drawMetroInitiativeCard({
                    deck,

                    random:
                        () => -0.1
                }),
            {
                name:
                    "RangeError"
            }
        );

    }
);


test(
    "drawMetroInitiativeCard accepte une collection Foundry exposant contents",
    async () => {

        const card =
            createCardStub({
                id:
                    "card-5",

                initiative:
                    5
            });


        const result =
            await drawMetroInitiativeCard({
                deck: {
                    availableCards: {
                        contents: [
                            card
                        ]
                    }
                },

                random:
                    () => 0
            });


        assert.equal(
            result.initiative,
            5
        );

    }
);

test(
    "drawMetroInitiativeCard ne réserve pas globalement la Card Foundry",
    async () => {

        const updates =
            [];


        const card = {
            id:
                "card-2",

            drawn:
                true,

            getFlag(
                scope,
                key
            ) {

                assert.equal(
                    scope,
                    "metro-2033-yze"
                );

                assert.equal(
                    key,
                    "initiative"
                );


                return 2;

            },

            async update(
                changes
            ) {

                updates.push(
                    changes
                );


                if (
                    Object.hasOwn(
                        changes,
                        "drawn"
                    )
                ) {

                    this.drawn =
                        changes.drawn;

                }

            }
        };


        /*
         * La carte peut déjà être physiquement
         * marquée drawn parce qu'un autre
         * Combat utilise la même valeur.
         *
         * Le Combat courant l'a néanmoins
         * retenue comme candidate locale.
         */
        const deck = {
            availableCards:
                []
        };


        const result =
            await drawMetroInitiativeCard({
                deck,

                cards: [
                    card
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
            result.card,
            card
        );


        /*
         * Le tirage logique ne doit modifier
         * aucun état global de la Card.
         */
        assert.deepEqual(
            updates,
            []
        );


        /*
         * En particulier, l'état provenant
         * éventuellement d'un autre Combat
         * reste intact.
         */
        assert.equal(
            card.drawn,
            true
        );

    }
);

