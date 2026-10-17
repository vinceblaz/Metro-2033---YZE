import {
    METRO_INITIATIVE_VALUES
} from "../../domain/rules/metro-initiative.mjs";


export const METRO_INITIATIVE_DECK_NAME =
    "Initiative Métro 2033";


export const METRO_INITIATIVE_DECK_FLAG_SCOPE =
    "metro-2033-yze";


export const METRO_INITIATIVE_DECK_FLAG_KEY =
    "initiativeDeck";


/**
 * Indique si une pile Cards est le paquet
 * d'initiative Métro 2033.
 *
 * L'identification repose sur un flag système
 * stable et non sur le seul nom visible.
 */
export function isMetroInitiativeDeck(
    cards
) {

    return (
        cards?.type === "deck"
        && cards?.getFlag?.(
            METRO_INITIATIVE_DECK_FLAG_SCOPE,
            METRO_INITIATIVE_DECK_FLAG_KEY
        ) === true
    );
}


/**
 * Recherche le paquet d'initiative Métro 2033
 * dans une collection de piles Cards.
 */
export function findMetroInitiativeDeck(
    cardStacks
) {

    if (!cardStacks) {
        return null;
    }


    const stacks =
        typeof cardStacks.values === "function"
            ? cardStacks.values()
            : cardStacks;


    if (
        !stacks
        || typeof stacks[Symbol.iterator]
            !== "function"
    ) {

        throw new TypeError(
            "Une collection de piles Cards est nécessaire."
        );

    }


    for (const cards of stacks) {

        if (
            isMetroInitiativeDeck(
                cards
            )
        ) {

            return cards;

        }

    }


    return null;
}


/**
 * Construit les données Foundry nécessaires
 * à la création du paquet d'initiative.
 *
 * Cette fonction ne crée aucun Document :
 * elle reste donc testable sans runtime Foundry.
 */
export function createMetroInitiativeDeckData() {

    return {
        name:
            METRO_INITIATIVE_DECK_NAME,

        type:
            "deck",

        flags: {
            [METRO_INITIATIVE_DECK_FLAG_SCOPE]: {
                [METRO_INITIATIVE_DECK_FLAG_KEY]:
                    true
            }
        }
    };
}


/**
 * Construit les dix cartes d'initiative.
 *
 * La valeur numérique est persistée dans
 * un flag système plutôt que déduite du nom.
 */
export function createMetroInitiativeCardData() {

    return METRO_INITIATIVE_VALUES.map(
        initiative => ({
            name:
                `Initiative ${initiative}`,

            type:
                "base",

            faces: [
                {
                    name:
                        String(initiative)
                }
            ],

            face:
                0,

            flags: {
                [METRO_INITIATIVE_DECK_FLAG_SCOPE]: {
                    initiative
                }
            }
        })
    );
}

/**
 * Obtient le paquet d'initiative Métro 2033
 * ou le crée s'il n'existe pas encore.
 *
 * La création du Document Cards est injectée
 * afin de conserver cette orchestration testable
 * sans runtime Foundry.
 */
export async function getOrCreateMetroInitiativeDeck({
    cardStacks,
    createCardsDocument
} = {}) {

    if (
        typeof createCardsDocument
        !== "function"
    ) {

        throw new TypeError(
            "Une fonction de création de Cards est nécessaire."
        );

    }


    const existingDeck =
        findMetroInitiativeDeck(
            cardStacks
        );


    if (existingDeck) {
        return existingDeck;
    }


    const deck =
        await createCardsDocument(
            createMetroInitiativeDeckData()
        );


    if (
        !deck
        || typeof deck.createEmbeddedDocuments
            !== "function"
    ) {

        throw new TypeError(
            "La création du paquet n'a pas retourné un Document Cards valide."
        );

    }


    await deck.createEmbeddedDocuments(
        "Card",
        createMetroInitiativeCardData()
    );


    return deck;
}


/**
 * Adaptateur destiné au runtime Foundry.
 *
 * Il raccorde l'orchestration testable
 * à game.cards et Cards.create().
 */
export async function getOrCreateFoundryMetroInitiativeDeck() {

    return getOrCreateMetroInitiativeDeck({
        cardStacks:
            game.cards,

        createCardsDocument:
            data =>
                Cards.create(
                    data
                )
    });
}