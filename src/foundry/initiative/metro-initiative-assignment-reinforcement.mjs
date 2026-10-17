import {
    drawMetroInitiativeCard
} from "./metro-initiative-draw.mjs";

import {
    getAvailableCardsForCombat
} from "./metro-initiative-draw-assignment.mjs";

import {
    METRO_INITIATIVE_FLAG_SCOPE,
    METRO_INITIATIVE_ASSIGNMENTS_FLAG_KEY,
    getCombatInitiativeAssignments,
    applyMetroInitiativeAssignment
} from "./metro-initiative-assignment-application.mjs";


function assertExploitableCombat(
    combat
) {

    if (
        !combat
        || !combat.combatants
        || typeof combat.getFlag !== "function"
        || typeof combat.setFlag !== "function"
    ) {

        throw new TypeError(
            "Un Combat Foundry exploitable est nécessaire."
        );

    }
}


/**
 * Rattache un ou plusieurs Combatants non
 * résolus à une attribution d'initiative
 * déjà résolue (renforts, A4.7 §117).
 *
 * Aucune nouvelle carte n'est tirée : les
 * nouveaux membres adoptent immédiatement
 * la carte et l'initiative de l'unité
 * existante.
 */
export async function attachCombatantsToInitiativeAssignment({
    combat,
    cardId,
    combatantIds
} = {}) {

    assertExploitableCombat(
        combat
    );


    if (
        typeof combat.updateEmbeddedDocuments
            !== "function"
    ) {

        throw new TypeError(
            "Un Combat Foundry exploitable est nécessaire."
        );

    }


    if (
        typeof cardId !== "string"
        || cardId.length === 0
    ) {

        throw new TypeError(
            "Un identifiant de carte est nécessaire."
        );

    }


    if (
        !Array.isArray(combatantIds)
        || combatantIds.length === 0
    ) {

        throw new TypeError(
            "Au moins un identifiant de Combatant est nécessaire."
        );

    }


    for (
        const combatantId
        of combatantIds
    ) {

        if (
            typeof combatantId !== "string"
            || combatantId.length === 0
        ) {

            throw new TypeError(
                "Chaque identifiant de Combatant doit être une chaîne non vide."
            );

        }

    }


    const uniqueNewCombatantIds =
        new Set(
            combatantIds
        );


    if (
        uniqueNewCombatantIds.size
        !== combatantIds.length
    ) {

        throw new Error(
            "Un Combatant ne peut apparaître qu'une seule fois dans le rattachement."
        );

    }


    for (
        const combatantId
        of combatantIds
    ) {

        if (
            !combat.combatants.get(
                combatantId
            )
        ) {

            throw new Error(
                `Le Combatant « ${combatantId} » ne participe pas au combat.`
            );

        }

    }


    const existingAssignments =
        getCombatInitiativeAssignments(
            combat
        );

    const targetAssignment =
        existingAssignments.find(
            assignment =>
                assignment.cardId === cardId
        );


    if (!targetAssignment) {

        throw new Error(
            `Aucune attribution d'initiative ne correspond à la carte « ${cardId} ».`
        );

    }


    const alreadyAssignedCombatantIds =
        new Set(
            existingAssignments.flatMap(
                assignment =>
                    assignment.combatantIds
            )
        );


    for (
        const combatantId
        of combatantIds
    ) {

        if (
            alreadyAssignedCombatantIds.has(
                combatantId
            )
        ) {

            throw new Error(
                `Le Combatant « ${combatantId} » possède déjà une initiative.`
            );

        }

    }


    const updatedAssignment = {
        ...targetAssignment,

        combatantIds: [
            ...targetAssignment.combatantIds,
            ...combatantIds
        ]
    };

    const nextAssignments =
        existingAssignments.map(
            assignment =>
                assignment.cardId === cardId
                    ? updatedAssignment
                    : assignment
        );


    await combat.setFlag(
        METRO_INITIATIVE_FLAG_SCOPE,
        METRO_INITIATIVE_ASSIGNMENTS_FLAG_KEY,
        nextAssignments
    );


    try {

        await combat.updateEmbeddedDocuments(
            "Combatant",
            combatantIds.map(
                combatantId => ({
                    _id:
                        combatantId,

                    initiative:
                        targetAssignment.initiative
                })
            )
        );

    }
    catch (projectionError) {

        try {

            await combat.setFlag(
                METRO_INITIATIVE_FLAG_SCOPE,
                METRO_INITIATIVE_ASSIGNMENTS_FLAG_KEY,
                existingAssignments
            );

        }
        catch (rollbackError) {

            throw new AggregateError(
                [
                    projectionError,
                    rollbackError
                ],
                "La projection de l'initiative a échoué et le flag du Combat n'a pas pu être restauré."
            );

        }


        throw projectionError;

    }


    return {
        assignment: {
            ...updatedAssignment,

            combatantIds:
                [...updatedAssignment.combatantIds]
        }
    };
}


/**
 * Extrait un Combatant d'une attribution
 * d'initiative résolue et lui fait tirer
 * exactement une nouvelle carte (A4.7
 * §118).
 *
 * L'attribution d'origine conserve sa
 * carte, son initiative et ses autres
 * membres. Interdit si le Combatant
 * constitue déjà, à lui seul, une unité
 * individuelle : l'opération n'a alors
 * aucun effet utile et viderait
 * l'attribution d'origine.
 *
 * La nouvelle carte est vérifiée/tirée
 * avant toute modification de
 * l'attribution d'origine ; en cas
 * d'échec ultérieur, l'état initial est
 * restauré.
 */
export async function extractCombatantFromInitiativeAssignment({
    combat,
    deck,
    combatantId,
    random = Math.random
} = {}) {

    assertExploitableCombat(
        combat
    );


    const existingAssignments =
        getCombatInitiativeAssignments(
            combat
        );

    const sourceAssignment =
        existingAssignments.find(
            assignment =>
                assignment.combatantIds.includes(
                    combatantId
                )
        );


    if (!sourceAssignment) {

        throw new Error(
            `Le Combatant « ${combatantId} » ne possède aucune initiative résolue.`
        );

    }


    if (
        sourceAssignment.combatantIds.length
        === 1
    ) {

        throw new Error(
            `Le Combatant « ${combatantId} » constitue déjà une unité d'initiative individuelle.`
        );

    }


    /*
     * La nouvelle carte est tirée avant
     * toute mutation de l'attribution
     * d'origine : un paquet saturé ne doit
     * laisser aucune trace de l'opération.
     */
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


    const trimmedAssignment = {
        ...sourceAssignment,

        combatantIds:
            sourceAssignment.combatantIds.filter(
                existingCombatantId =>
                    existingCombatantId
                    !== combatantId
            )
    };

    const nextAssignments =
        existingAssignments.map(
            assignment =>
                assignment.cardId
                === sourceAssignment.cardId
                    ? trimmedAssignment
                    : assignment
        );


    await combat.setFlag(
        METRO_INITIATIVE_FLAG_SCOPE,
        METRO_INITIATIVE_ASSIGNMENTS_FLAG_KEY,
        nextAssignments
    );


    try {

        const applicationResult =
            await applyMetroInitiativeAssignment({
                combat,

                cardId:
                    drawResult.cardId,

                initiative:
                    drawResult.initiative,

                combatantIds: [
                    combatantId
                ]
            });


        return {
            sourceAssignment: {
                ...trimmedAssignment,

                combatantIds:
                    [...trimmedAssignment.combatantIds]
            },

            newAssignment:
                applicationResult.assignment
        };

    }
    catch (applicationError) {

        try {

            await combat.setFlag(
                METRO_INITIATIVE_FLAG_SCOPE,
                METRO_INITIATIVE_ASSIGNMENTS_FLAG_KEY,
                existingAssignments
            );

        }
        catch (rollbackError) {

            throw new AggregateError(
                [
                    applicationError,
                    rollbackError
                ],
                "L'extraction a échoué et l'attribution d'origine n'a pas pu être restaurée."
            );

        }


        throw applicationError;

    }
}
