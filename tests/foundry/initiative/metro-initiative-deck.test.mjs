import test from "node:test";
import assert from "node:assert/strict";

import {
    METRO_INITIATIVE_DECK_NAME,
    createMetroInitiativeCardData,
    createMetroInitiativeDeckData,
    findMetroInitiativeDeck,
    getOrCreateMetroInitiativeDeck,
    isMetroInitiativeDeck
} from "../../../src/foundry/initiative/metro-initiative-deck.mjs";


function createCardsStub({
    type = "deck",
    initiativeDeck = false
} = {}) {

    return {
        type,

        getFlag(
            scope,
            key
        ) {

            if (
                scope === "metro-2033-yze"
                && key === "initiativeDeck"
            ) {

                return initiativeDeck;

            }


            return undefined;
        }
    };
}


test(
    "createMetroInitiativeDeckData décrit un deck Foundry identifié par un flag système",
    () => {

        assert.deepEqual(
            createMetroInitiativeDeckData(),
            {
                name:
                    METRO_INITIATIVE_DECK_NAME,

                type:
                    "deck",

                flags: {
                    "metro-2033-yze": {
                        initiativeDeck:
                            true
                    }
                }
            }
        );

    }
);


test(
    "createMetroInitiativeCardData crée exactement les cartes 1 à 10",
    () => {

        const cards =
            createMetroInitiativeCardData();


        assert.equal(
            cards.length,
            10
        );


        assert.deepEqual(
            cards.map(
                card =>
                    card.flags[
                        "metro-2033-yze"
                    ].initiative
            ),
            [
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9,
                10
            ]
        );

    }
);


test(
    "chaque carte conserve sa valeur indépendamment de son nom visible",
    () => {

        const cards =
            createMetroInitiativeCardData();


        for (
            let index = 0;
            index < cards.length;
            index += 1
        ) {

            const initiative =
                index + 1;

            assert.equal(
                cards[index]
                    .flags[
                        "metro-2033-yze"
                    ].initiative,
                initiative
            );

            assert.equal(
                cards[index].faces[0].name,
                String(initiative)
            );

        }

    }
);


test(
    "isMetroInitiativeDeck reconnaît le deck par son type et son flag",
    () => {

        assert.equal(
            isMetroInitiativeDeck(
                createCardsStub({
                    initiativeDeck:
                        true
                })
            ),
            true
        );

    }
);


test(
    "isMetroInitiativeDeck refuse un deck sans flag Métro",
    () => {

        assert.equal(
            isMetroInitiativeDeck(
                createCardsStub()
            ),
            false
        );

    }
);


test(
    "isMetroInitiativeDeck refuse une pile non deck même si elle possède le flag",
    () => {

        assert.equal(
            isMetroInitiativeDeck(
                createCardsStub({
                    type:
                        "pile",

                    initiativeDeck:
                        true
                })
            ),
            false
        );

    }
);


test(
    "findMetroInitiativeDeck retrouve le deck dans un tableau",
    () => {

        const ordinaryDeck =
            createCardsStub();

        const initiativeDeck =
            createCardsStub({
                initiativeDeck:
                    true
            });


        assert.equal(
            findMetroInitiativeDeck([
                ordinaryDeck,
                initiativeDeck
            ]),
            initiativeDeck
        );

    }
);


test(
    "findMetroInitiativeDeck accepte une collection de type Map",
    () => {

        const initiativeDeck =
            createCardsStub({
                initiativeDeck:
                    true
            });

        const collection =
            new Map([
                [
                    "ordinary",
                    createCardsStub()
                ],
                [
                    "metro",
                    initiativeDeck
                ]
            ]);


        assert.equal(
            findMetroInitiativeDeck(
                collection
            ),
            initiativeDeck
        );

    }
);


test(
    "findMetroInitiativeDeck retourne null lorsqu'aucun deck Métro n'existe",
    () => {

        assert.equal(
            findMetroInitiativeDeck([
                createCardsStub(),
                createCardsStub()
            ]),
            null
        );

    }
);


test(
    "getOrCreateMetroInitiativeDeck retourne le deck existant sans en créer un nouveau",
    async () => {

        const initiativeDeck =
            createCardsStub({
                initiativeDeck:
                    true
            });

        let creationCount = 0;


        const result =
            await getOrCreateMetroInitiativeDeck({
                cardStacks: [
                    createCardsStub(),
                    initiativeDeck
                ],

                createCardsDocument:
                    async () => {

                        creationCount += 1;

                        throw new Error(
                            "La création ne doit pas être appelée."
                        );
                    }
            });


        assert.equal(
            result,
            initiativeDeck
        );

        assert.equal(
            creationCount,
            0
        );

    }
);


test(
    "getOrCreateMetroInitiativeDeck crée le deck et ses dix cartes lorsqu'il n'existe pas",
    async () => {

        const embeddedCalls = [];

        const createdDeck = {
            type:
                "deck",

            async createEmbeddedDocuments(
                embeddedName,
                data
            ) {

                embeddedCalls.push({
                    embeddedName,
                    data
                });

                return data;
            }
        };

        const creationCalls = [];


        const result =
            await getOrCreateMetroInitiativeDeck({
                cardStacks: [],

                createCardsDocument:
                    async data => {

                        creationCalls.push(
                            data
                        );

                        return createdDeck;
                    }
            });


        assert.equal(
            result,
            createdDeck
        );

        assert.deepEqual(
            creationCalls,
            [
                createMetroInitiativeDeckData()
            ]
        );

        assert.equal(
            embeddedCalls.length,
            1
        );

        assert.equal(
            embeddedCalls[0].embeddedName,
            "Card"
        );

        assert.deepEqual(
            embeddedCalls[0].data,
            createMetroInitiativeCardData()
        );

    }
);


test(
    "getOrCreateMetroInitiativeDeck exige une fonction de création",
    async () => {

        await assert.rejects(
            () =>
                getOrCreateMetroInitiativeDeck({
                    cardStacks: []
                }),
            {
                name:
                    "TypeError"
            }
        );

    }
);


test(
    "getOrCreateMetroInitiativeDeck refuse un résultat de création qui n'est pas un Document Cards exploitable",
    async () => {

        await assert.rejects(
            () =>
                getOrCreateMetroInitiativeDeck({
                    cardStacks: [],

                    createCardsDocument:
                        async () => ({
                            type:
                                "deck"
                        })
                }),
            {
                name:
                    "TypeError"
            }
        );

    }
);