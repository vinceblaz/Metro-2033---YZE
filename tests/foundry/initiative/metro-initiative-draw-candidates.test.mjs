import test from "node:test";
import assert from "node:assert/strict";

import {
    drawMetroInitiativeCandidates
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
    "drawMetroInitiativeCandidates tire un nombre distinct de candidates",
    async () => {

        const deck = {};

        const cards = [
            createCardStub({
                id: "card-1",
                initiative: 1
            }),
            createCardStub({
                id: "card-2",
                initiative: 2
            }),
            createCardStub({
                id: "card-3",
                initiative: 3
            })
        ];


        const candidates =
            await drawMetroInitiativeCandidates({
                deck,
                cards,

                drawCount: 2,

                random:
                    createSequentialRandom([
                        0,
                        0
                    ])
            });


        assert.equal(
            candidates.length,
            2
        );


        const cardIds =
            candidates.map(
                candidate =>
                    candidate.cardId
            );


        assert.equal(
            new Set(cardIds).size,
            2
        );

    }
);


test(
    "drawMetroInitiativeCandidates retourne une seule candidate pour drawCount = 1",
    async () => {

        const deck = {};

        const cards = [
            createCardStub({
                id: "card-5",
                initiative: 5
            })
        ];


        const candidates =
            await drawMetroInitiativeCandidates({
                deck,
                cards,

                drawCount: 1,

                random:
                    () => 0
            });


        assert.deepEqual(
            candidates.map(
                candidate => ({
                    cardId:
                        candidate.cardId,

                    initiative:
                        candidate.initiative
                })
            ),
            [
                {
                    cardId:
                        "card-5",

                    initiative:
                        5
                }
            ]
        );

    }
);


test(
    "drawMetroInitiativeCandidates refuse de tirer plus de candidates que de cartes disponibles",
    async () => {

        const deck = {};

        const cards = [
            createCardStub({
                id: "card-1",
                initiative: 1
            })
        ];


        await assert.rejects(
            () =>
                drawMetroInitiativeCandidates({
                    deck,
                    cards,

                    drawCount: 2,

                    random:
                        () => 0
                }),
            {
                name: "Error"
            }
        );

    }
);


test(
    "drawMetroInitiativeCandidates rejette un drawCount invalide",
    async () => {

        const deck = {};

        const cards = [
            createCardStub({
                id: "card-1",
                initiative: 1
            })
        ];


        await assert.rejects(
            () =>
                drawMetroInitiativeCandidates({
                    deck,
                    cards,

                    drawCount: 0,

                    random:
                        () => 0
                }),
            {
                name: "RangeError"
            }
        );

    }
);


test(
    "drawMetroInitiativeCandidates exige un paquet d'initiative",
    async () => {

        await assert.rejects(
            () =>
                drawMetroInitiativeCandidates({
                    deck: null,

                    cards: [],

                    drawCount: 1
                }),
            {
                name: "TypeError"
            }
        );

    }
);


test(
    "drawMetroInitiativeCandidates ne mute jamais physiquement les Cards",
    async () => {

        const deck = {};

        const cards = [
            createCardStub({
                id: "card-1",
                initiative: 1
            }),
            createCardStub({
                id: "card-2",
                initiative: 2
            })
        ];


        await drawMetroInitiativeCandidates({
            deck,
            cards,

            drawCount: 2,

            random:
                createSequentialRandom([
                    0,
                    0
                ])
        });


        for (
            const card
            of cards
        ) {

            assert.equal(
                card.drawn,
                false
            );

            assert.deepEqual(
                card.updates,
                []
            );

        }

    }
);
