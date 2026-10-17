import {
    getCombatInitiativePendingUnits
} from "./metro-initiative-pending-unit-application.mjs";

import {
    getCombatInitiativeAssignments
} from "./metro-initiative-assignment-application.mjs";


function assertExploitableCombat(
    combat
) {

    if (
        !combat
        || !combat.combatants
        || typeof combat.getFlag !== "function"
    ) {

        throw new TypeError(
            "Un Combat Foundry exploitable est nécessaire."
        );

    }
}


function normalizeCombatants(
    combatants
) {

    if (
        Array.isArray(
            combatants
        )
    ) {

        return [
            ...combatants
        ];

    }


    if (
        Array.isArray(
            combatants?.contents
        )
    ) {

        return [
            ...combatants.contents
        ];

    }


    if (
        typeof combatants?.values
            === "function"
    ) {

        return Array.from(
            combatants.values()
        );

    }


    if (
        typeof combatants?.[Symbol.iterator]
            === "function"
    ) {

        return Array.from(
            combatants
        );

    }


    return [];
}


function describeCombatant(
    combatant
) {

    return {
        id:
            combatant.id,

        name:
            combatant.name
            ?? combatant.id
    };
}


function resolveMembers(
    combatantIds,
    combatantsById
) {

    return combatantIds.map(
        combatantId => {

            const combatant =
                combatantsById.get(
                    combatantId
                );


            return combatant
                ? describeCombatant(
                    combatant
                )
                : {
                    id:
                        combatantId,

                    name:
                        combatantId
                };

        }
    );
}


/**
 * Construit le modèle de vue de la fenêtre
 * de Préparation de l'initiative (A4.7,
 * §115).
 *
 * Fonction pure vis-à-vis de l'affichage :
 * elle ne mute rien et ne connaît aucune
 * API Foundry au-delà de la lecture du
 * Combat fourni.
 *
 * Catégorise chaque Combatant du Combat en
 * exactement l'une des trois listes,
 * conformément aux invariants du §114 :
 * un Combatant sans unité pending ni
 * attribution résolue équivaut à une unité
 * individuelle implicite non configurée.
 */
export function buildInitiativePreparationViewModel(
    combat
) {

    assertExploitableCombat(
        combat
    );


    const combatants =
        normalizeCombatants(
            combat.combatants
        );

    const combatantsById =
        new Map(
            combatants.map(
                combatant => [
                    combatant.id,
                    combatant
                ]
            )
        );


    const pendingUnits =
        getCombatInitiativePendingUnits(
            combat
        );

    const assignments =
        getCombatInitiativeAssignments(
            combat
        );


    const configuredCombatantIds =
        new Set(
            [
                ...pendingUnits.flatMap(
                    pendingUnit =>
                        pendingUnit.combatantIds
                ),

                ...assignments.flatMap(
                    assignment =>
                        assignment.combatantIds
                )
            ]
        );


    const unconfiguredCombatants =
        combatants
            .filter(
                combatant =>
                    !configuredCombatantIds.has(
                        combatant.id
                    )
            )
            .map(
                combatant =>
                    describeCombatant(
                        combatant
                    )
            );


    const viewModelPendingUnits =
        pendingUnits.map(
            pendingUnit => ({
                combatantIds:
                    [...pendingUnit.combatantIds],

                members:
                    resolveMembers(
                        pendingUnit.combatantIds,
                        combatantsById
                    ),

                drawCount:
                    pendingUnit.drawCount,

                reason:
                    pendingUnit.reason
            })
        );


    const viewModelAssignments =
        [...assignments]
            .sort(
                (
                    a,
                    b
                ) =>
                    a.initiative
                    - b.initiative
            )
            .map(
                assignment => ({
                    cardId:
                        assignment.cardId,

                    initiative:
                        assignment.initiative,

                    combatantIds:
                        [...assignment.combatantIds],

                    members:
                        resolveMembers(
                            assignment.combatantIds,
                            combatantsById
                        )
                })
            );


    return {
        unconfiguredCombatants,

        pendingUnits:
            viewModelPendingUnits,

        assignments:
            viewModelAssignments
    };
}
