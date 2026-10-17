import {
    validateMetroInitiativeValue
} from "./metro-initiative.mjs";


/**
 * Crée une attribution d'initiative Métro 2033.
 *
 * Une même initiative peut appartenir :
 * - à un Combatant individuel ;
 * - à plusieurs Combatants partageant
 *   l'initiative d'un groupe.
 *
 * Cette représentation reste indépendante
 * de Foundry Cards.
 */
export function createMetroInitiativeAssignment({
    initiative,
    combatantIds
} = {}) {

    const validatedInitiative =
        validateMetroInitiativeValue(
            initiative
        );


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


    const uniqueCombatantIds =
        new Set(
            combatantIds
        );


    if (
        uniqueCombatantIds.size
        !== combatantIds.length
    ) {

        throw new Error(
            "Un Combatant ne peut apparaître qu'une seule fois dans une attribution d'initiative."
        );

    }


    return {
        initiative:
            validatedInitiative,

        combatantIds:
            [...combatantIds]
    };
}