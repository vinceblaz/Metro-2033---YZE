import {
    drawMetroInitiativeCard
} from "./metro-initiative-draw.mjs";

import {
    applyMetroInitiativeAssignment,
    getCombatInitiativeAssignments
} from "./metro-initiative-assignment-application.mjs";


function normalizeDeckCards(
    deck
) {

    if (
        !deck
        || !deck.cards
    ) {

        throw new TypeError(
            "Un paquet d'initiative exploitable est nécessaire."
        );

    }


    if (
        Array.isArray(
            deck.cards
        )
    ) {

        return [
            ...deck.cards
        ];

    }


    if (
        Array.isArray(
            deck.cards.contents
        )
    ) {

        return [
            ...deck.cards.contents
        ];

    }


    if (
        typeof deck.cards.values
            === "function"
    ) {

        return Array.from(
            deck.cards.values()
        );

    }


    if (
        typeof deck.cards[Symbol.iterator]
            === "function"
    ) {

        return Array.from(
            deck.cards
        );

    }


    throw new TypeError(
        "Les cartes du paquet d'initiative ne sont pas exploitables."
    );
}


/**
 * Retourne les cartes encore disponibles
 * pour un Combat précis.
 *
 * Le deck fournit le catalogue physique des
 * cartes d'initiative.
 *
 * Les initiativeAssignments du Combat sont
 * l'autorité déterminant quelles cartes sont
 * déjà utilisées dans CE Combat.
 *
 * Card.drawn et deck.availableCards ne sont
 * pas utilisés pour cette décision métier,
 * car leur état est global au Document Cards.
 */
export function getAvailableCardsForCombat({
    combat,
    deck
}) {

    const assignments =
        getCombatInitiativeAssignments(
            combat
        );


    const assignedCardIds =
        new Set(
            assignments.map(
                assignment =>
                    assignment.cardId
            )
        );


    return normalizeDeckCards(
        deck
    ).filter(
        card =>
            !assignedCardIds.has(
                card.id
            )
    );
}


/**
 * Sélectionne une carte d'initiative Métro
 * disponible pour le Combat courant puis
 * l'attribue à un ou plusieurs Combatants.
 *
 * Le tirage et l'attribution ne modifient
 * jamais Card.drawn.
 *
 * Il n'existe donc plus de compensation
 * physique à effectuer lorsqu'une attribution
 * échoue : applyMetroInitiativeAssignment()
 * reste responsable de ses propres mutations
 * persistantes et de leur rollback.
 */
export async function drawAndAssignMetroInitiative({
    combat,
    deck,
    combatantIds,
    random = Math.random
} = {}) {

    const availableCards =
        getAvailableCardsForCombat({
            combat,
            deck
        });


    const drawResult =
        await drawMetroInitiativeCard({
            deck,

            cards:
                availableCards,

            random
        });


    const applicationResult =
        await applyMetroInitiativeAssignment({
            combat,

            cardId:
                drawResult.cardId,

            initiative:
                drawResult.initiative,

            combatantIds
        });


    return {
        cardId:
            drawResult.cardId,

        initiative:
            drawResult.initiative,

        combatantIds:
            [
                ...applicationResult
                    .assignment
                    .combatantIds
            ],

        card:
            drawResult.card,

        assignment:
            applicationResult.assignment
    };
}