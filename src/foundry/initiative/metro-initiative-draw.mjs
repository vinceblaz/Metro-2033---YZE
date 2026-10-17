import {
    validateMetroInitiativeValue
} from "../../domain/rules/metro-initiative.mjs";

import {
    validateMetroInitiativeDrawCount
} from "../../domain/rules/metro-initiative-pending-unit.mjs";


const FLAG_SCOPE =
    "metro-2033-yze";

const INITIATIVE_FLAG_KEY =
    "initiative";


function normalizeCards(
    cards,
    {
        label =
            "Les cartes d'initiative"
    } = {}
) {

    if (!cards) {
        return [];
    }


    if (
        Array.isArray(
            cards
        )
    ) {

        return [
            ...cards
        ];

    }


    if (
        Array.isArray(
            cards.contents
        )
    ) {

        return [
            ...cards.contents
        ];

    }


    if (
        typeof cards.values
            === "function"
    ) {

        return Array.from(
            cards.values()
        );

    }


    if (
        typeof cards[Symbol.iterator]
            === "function"
    ) {

        return Array.from(
            cards
        );

    }


    throw new TypeError(
        `${label} ne sont pas exploitables.`
    );
}


/**
 * Retourne la valeur métier portée par
 * une carte d'initiative Métro 2033.
 */
export function getMetroInitiativeFromCard(
    card
) {

    if (
        !card
        || typeof card.getFlag !== "function"
    ) {

        throw new TypeError(
            "Une Card Foundry est nécessaire."
        );

    }


    return validateMetroInitiativeValue(
        card.getFlag(
            FLAG_SCOPE,
            INITIATIVE_FLAG_KEY
        )
    );
}


/**
 * Sélectionne une carte parmi une collection
 * de candidats d'initiative Métro.
 *
 * Par défaut, le comportement historique
 * reste disponible pour les appels directs :
 * les candidats proviennent de
 * deck.availableCards.
 *
 * Une collection `cards` peut être fournie
 * explicitement par la couche connaissant
 * le Combat.
 *
 * IMPORTANT :
 * cette fonction ne réserve pas physiquement
 * la Card Foundry.
 *
 * Card.drawn est un état global au Document
 * Cards et ne peut donc pas représenter la
 * disponibilité d'une initiative dans un
 * Combat particulier.
 *
 * La disponibilité métier est déterminée
 * par les initiativeAssignments du Combat.
 */
export async function drawMetroInitiativeCard({
    deck,
    cards = null,
    random = Math.random
} = {}) {

    if (!deck) {

        throw new TypeError(
            "Un paquet d'initiative est nécessaire."
        );

    }


    if (
        typeof random !== "function"
    ) {

        throw new TypeError(
            "Une fonction aléatoire est nécessaire."
        );

    }


    const candidateCards =
        cards === null
            ? normalizeCards(
                deck.availableCards,
                {
                    label:
                        "Les cartes disponibles du paquet"
                }
            )
            : normalizeCards(
                cards,
                {
                    label:
                        "Les cartes candidates"
                }
            );


    if (
        candidateCards.length === 0
    ) {

        throw new Error(
            "Aucune carte d'initiative n'est disponible."
        );

    }


    const randomValue =
        Number(
            random()
        );


    if (
        !Number.isFinite(randomValue)
        || randomValue < 0
        || randomValue >= 1
    ) {

        throw new RangeError(
            "La fonction aléatoire doit retourner une valeur comprise entre 0 inclus et 1 exclu."
        );

    }


    const index =
        Math.floor(
            randomValue
            * candidateCards.length
        );


    const card =
        candidateCards[index];


    const initiative =
        getMetroInitiativeFromCard(
            card
        );


    return {
        cardId:
            card.id,

        initiative,

        card
    };
}


/**
 * Sélectionne drawCount cartes candidates
 * distinctes parmi une collection de
 * candidats d'initiative Métro (A4.7).
 *
 * Primitive générique : elle ne connaît
 * ni permissions, ni identité du décideur,
 * ni Surprise, ni Talent. Elle sert aussi
 * bien un tirage individuel (drawCount = 1)
 * qu'un tirage multiple (Surprise,
 * Réflexes éclair...), sans plafond codé
 * en dur.
 *
 * Comme drawMetroInitiativeCard(), cette
 * fonction ne mute jamais physiquement les
 * Cards Foundry : elle se contente de
 * sélectionner, au hasard et sans remise,
 * drawCount cartes parmi les candidates
 * fournies.
 *
 * Le choix parmi les candidates retournées
 * appartient à l'appelant (MJ) et n'est pas
 * traité ici.
 */
export async function drawMetroInitiativeCandidates({
    deck,
    cards = null,
    drawCount,
    random = Math.random
} = {}) {

    if (!deck) {

        throw new TypeError(
            "Un paquet d'initiative est nécessaire."
        );

    }


    if (
        typeof random !== "function"
    ) {

        throw new TypeError(
            "Une fonction aléatoire est nécessaire."
        );

    }


    const validatedDrawCount =
        validateMetroInitiativeDrawCount(
            drawCount
        );


    const remainingCandidates =
        cards === null
            ? normalizeCards(
                deck.availableCards,
                {
                    label:
                        "Les cartes disponibles du paquet"
                }
            )
            : normalizeCards(
                cards,
                {
                    label:
                        "Les cartes candidates"
                }
            );


    if (
        remainingCandidates.length
        < validatedDrawCount
    ) {

        throw new Error(
            "Le nombre de cartes candidates disponibles est insuffisant pour ce tirage."
        );

    }


    const drawnCandidates = [];


    for (
        let drawIndex = 0;
        drawIndex < validatedDrawCount;
        drawIndex += 1
    ) {

        const drawResult =
            await drawMetroInitiativeCard({
                deck,

                cards:
                    remainingCandidates,

                random
            });


        const selectedIndex =
            remainingCandidates.findIndex(
                candidate =>
                    candidate.id
                    === drawResult.cardId
            );


        remainingCandidates.splice(
            selectedIndex,
            1
        );


        drawnCandidates.push(
            drawResult
        );

    }


    return drawnCandidates;
}