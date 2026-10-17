import {
    drawAndAssignMetroInitiative
} from "./metro-initiative-draw-assignment.mjs";


/**
 * Attribue une initiative Métro à plusieurs
 * Combatants d'un même Combat.
 *
 * Chaque Combatant reçoit actuellement sa
 * propre carte.
 *
 * Le regroupement optionnel des PNJ sera
 * traité séparément : cette fonction ne
 * l'invente pas automatiquement.
 *
 * Un Combatant possédant déjà une initiative
 * est ignoré : Métro 2033 ne retire pas une
 * nouvelle initiative pendant le conflit.
 */
export async function rollMetroInitiativeForCombatants({
    combat,
    deck,
    combatantIds,
    random = Math.random
} = {}) {

    if (
        !combat
        || !combat.combatants
    ) {

        throw new TypeError(
            "Un Combat Foundry est nécessaire."
        );

    }


    if (
        !Array.isArray(
            combatantIds
        )
    ) {

        throw new TypeError(
            "La liste des Combatants est nécessaire."
        );

    }


    const uniqueCombatantIds =
        [...new Set(
            combatantIds
        )];


    const assignments = [];
    const skippedCombatantIds = [];


    for (
        const combatantId
        of uniqueCombatantIds
    ) {

        if (
            typeof combatantId !== "string"
            || combatantId.length === 0
        ) {

            throw new TypeError(
                "Chaque identifiant de Combatant doit être une chaîne non vide."
            );

        }


        const combatant =
            combat.combatants.get(
                combatantId
            );


        if (!combatant) {

            throw new Error(
                `Le Combatant « ${combatantId} » ne participe pas au combat.`
            );

        }


        if (
            combatant.initiative !== null
            && combatant.initiative !== undefined
        ) {

            skippedCombatantIds.push(
                combatantId
            );

            continue;
        }


        const result =
            await drawAndAssignMetroInitiative({
                combat,
                deck,

                combatantIds: [
                    combatantId
                ],

                random
            });


        assignments.push({
            cardId:
                result.cardId,

            initiative:
                result.initiative,

            combatantIds:
                [...result.combatantIds]
        });
    }


    return {
        assignments,

        skippedCombatantIds
    };
}