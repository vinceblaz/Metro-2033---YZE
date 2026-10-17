import {
    drawMetroInitiativeCandidates
} from "./metro-initiative-draw.mjs";

import {
    getAvailableCardsForCombat
} from "./metro-initiative-draw-assignment.mjs";

import {
    applyMetroInitiativeAssignment
} from "./metro-initiative-assignment-application.mjs";

import {
    getCombatInitiativePendingUnits,
    createCombatInitiativePendingUnit,
    dissolveCombatInitiativePendingUnit
} from "./metro-initiative-pending-unit-application.mjs";


/**
 * Résout une unité d'initiative en attente
 * (A4.7) : tire drawCount candidates
 * distinctes, obtient le choix du MJ
 * lorsque plusieurs candidates existent,
 * puis transforme l'unité en
 * initiativeAssignment.
 *
 * Phase 1 (drawCount = 1) :
 * une seule candidate, assignment
 * immédiat, sans intervention du MJ.
 *
 * Phase 2 (drawCount > 1) :
 * plusieurs candidates distinctes sont
 * tirées ; aucun assignment n'est créé
 * tant que chooseCandidateCardId n'a pas
 * désigné l'une d'elles. Les candidates
 * rejetées ne sont jamais persistées et
 * restent donc localement disponibles.
 *
 * L'opération pending -> assignment est
 * traitée comme atomique : si
 * l'application de l'assignment échoue
 * après que l'unité pending a été
 * dissoute, l'unité pending est recréée
 * à l'identique avant que l'erreur ne
 * soit propagée.
 */
export async function resolveCombatInitiativePendingUnit({
    combat,
    deck,
    combatantId,
    chooseCandidateCardId = null,
    random = Math.random
} = {}) {

    const existingPendingUnits =
        getCombatInitiativePendingUnits(
            combat
        );

    const pendingUnit =
        existingPendingUnits.find(
            candidateUnit =>
                candidateUnit.combatantIds.includes(
                    combatantId
                )
        );


    if (!pendingUnit) {

        throw new Error(
            `Aucune unité d'initiative en attente ne contient le Combatant « ${combatantId} ».`
        );

    }


    const availableCards =
        getAvailableCardsForCombat({
            combat,
            deck
        });


    const candidates =
        await drawMetroInitiativeCandidates({
            deck,

            cards:
                availableCards,

            drawCount:
                pendingUnit.drawCount,

            random
        });


    let chosenCandidate;


    if (candidates.length === 1) {

        chosenCandidate =
            candidates[0];

    }
    else {

        if (
            typeof chooseCandidateCardId
                !== "function"
        ) {

            throw new Error(
                "Le choix du MJ est nécessaire lorsque plusieurs candidates ont été tirées."
            );

        }


        const chosenCardId =
            await chooseCandidateCardId(
                candidates,
                pendingUnit
            );


        chosenCandidate =
            candidates.find(
                candidate =>
                    candidate.cardId
                    === chosenCardId
            );


        if (!chosenCandidate) {

            throw new Error(
                "Le choix du MJ doit correspondre à l'une des candidates tirées."
            );

        }

    }


    const dissolveResult =
        await dissolveCombatInitiativePendingUnit({
            combat,

            combatantId
        });


    try {

        const applicationResult =
            await applyMetroInitiativeAssignment({
                combat,

                cardId:
                    chosenCandidate.cardId,

                initiative:
                    chosenCandidate.initiative,

                combatantIds:
                    dissolveResult
                        .dissolvedPendingUnit
                        .combatantIds
            });


        return {
            assignment:
                applicationResult.assignment,

            rejectedCandidates:
                candidates.filter(
                    candidate =>
                        candidate.cardId
                        !== chosenCandidate.cardId
                )
        };

    }
    catch (applicationError) {

        try {

            await createCombatInitiativePendingUnit({
                combat,

                combatantIds:
                    dissolveResult
                        .dissolvedPendingUnit
                        .combatantIds,

                drawCount:
                    dissolveResult
                        .dissolvedPendingUnit
                        .drawCount,

                reason:
                    dissolveResult
                        .dissolvedPendingUnit
                        .reason
            });

        }
        catch (restoreError) {

            throw new AggregateError(
                [
                    applicationError,
                    restoreError
                ],
                "L'attribution d'initiative a échoué et l'unité en attente n'a pas pu être restaurée."
            );

        }


        throw applicationError;

    }
}
