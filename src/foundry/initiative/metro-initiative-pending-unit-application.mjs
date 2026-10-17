import {
    createMetroInitiativePendingUnit
} from "../../domain/rules/metro-initiative-pending-unit.mjs";

import {
    getCombatInitiativeAssignments
} from "./metro-initiative-assignment-application.mjs";


export const METRO_INITIATIVE_FLAG_SCOPE =
    "metro-2033-yze";

export const METRO_INITIATIVE_PENDING_UNITS_FLAG_KEY =
    "initiativePendingUnits";


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
 * Retourne les unités d'initiative en
 * attente actuellement persistées dans
 * le Combat.
 *
 * Une unité pending redevient non
 * configurée dès qu'elle est résolue :
 * cette lecture ne reflète donc que les
 * unités encore en attente de tirage.
 */
export function getCombatInitiativePendingUnits(
    combat
) {

    assertExploitableCombat(
        combat
    );


    const pendingUnits =
        combat.getFlag(
            METRO_INITIATIVE_FLAG_SCOPE,
            METRO_INITIATIVE_PENDING_UNITS_FLAG_KEY
        );


    if (!Array.isArray(pendingUnits)) {

        return [];

    }


    return pendingUnits.map(
        pendingUnit => ({
            ...pendingUnit,

            combatantIds:
                Array.isArray(
                    pendingUnit.combatantIds
                )
                    ? [...pendingUnit.combatantIds]
                    : []
        })
    );
}


function findPendingUnitIndexByCombatantId(
    pendingUnits,
    combatantId
) {

    return pendingUnits.findIndex(
        pendingUnit =>
            pendingUnit.combatantIds.includes(
                combatantId
            )
    );
}


function assertCombatantsParticipateInCombat({
    combat,
    combatantIds
}) {

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
}


/**
 * Vérifie que des Combatants ne sont ni
 * déjà engagés dans une autre unité
 * pending, ni déjà résolus.
 *
 * `ignorePendingUnitIndex` permet
 * d'exclure l'unité en cours de
 * modification de la vérification de
 * pending.
 */
function assertCombatantsAreFreeForPending({
    combat,
    combatantIds,
    pendingUnits,
    ignorePendingUnitIndex = -1
}) {

    const alreadyPendingCombatantIds =
        new Set(
            pendingUnits.flatMap(
                (pendingUnit, index) =>
                    index === ignorePendingUnitIndex
                        ? []
                        : pendingUnit.combatantIds
            )
        );

    const alreadyResolvedCombatantIds =
        new Set(
            getCombatInitiativeAssignments(
                combat
            ).flatMap(
                assignment =>
                    assignment.combatantIds
            )
        );


    for (
        const combatantId
        of combatantIds
    ) {

        if (
            alreadyPendingCombatantIds.has(
                combatantId
            )
        ) {

            throw new Error(
                `Le Combatant « ${combatantId} » appartient déjà à une unité d'initiative en attente.`
            );

        }


        if (
            alreadyResolvedCombatantIds.has(
                combatantId
            )
        ) {

            throw new Error(
                `Le Combatant « ${combatantId} » possède déjà une initiative résolue.`
            );

        }

    }
}


/**
 * Crée et persiste une unité d'initiative
 * en attente.
 *
 * Un Combatant ne peut appartenir qu'à une
 * seule unité pending, et ne peut pas être
 * simultanément pending et résolu.
 */
export async function createCombatInitiativePendingUnit({
    combat,
    combatantIds,
    drawCount,
    reason
} = {}) {

    assertExploitableCombat(
        combat
    );


    const pendingUnit =
        createMetroInitiativePendingUnit({
            combatantIds,
            drawCount,
            reason
        });


    assertCombatantsParticipateInCombat({
        combat,

        combatantIds:
            pendingUnit.combatantIds
    });


    const existingPendingUnits =
        getCombatInitiativePendingUnits(
            combat
        );


    assertCombatantsAreFreeForPending({
        combat,

        combatantIds:
            pendingUnit.combatantIds,

        pendingUnits:
            existingPendingUnits
    });


    const nextPendingUnits = [
        ...existingPendingUnits,
        pendingUnit
    ];


    await combat.setFlag(
        METRO_INITIATIVE_FLAG_SCOPE,
        METRO_INITIATIVE_PENDING_UNITS_FLAG_KEY,
        nextPendingUnits
    );


    return {
        pendingUnit: {
            ...pendingUnit,

            combatantIds:
                [...pendingUnit.combatantIds]
        },

        pendingUnits:
            nextPendingUnits.map(
                existing => ({
                    ...existing,

                    combatantIds:
                        [...existing.combatantIds]
                })
            )
    };
}


/**
 * Modifie la composition, le drawCount ou
 * la raison d'une unité pending existante.
 *
 * `combatantId` identifie l'unité à
 * modifier : il doit appartenir à l'unité
 * pending visée avant modification. La
 * nouvelle composition remplace
 * entièrement l'ancienne.
 *
 * Autorisé uniquement tant qu'aucune
 * carte n'a été assignée à l'unité, ce qui
 * est garanti par construction : une
 * unité résolue n'existe plus dans
 * initiativePendingUnits.
 */
export async function modifyCombatInitiativePendingUnit({
    combat,
    combatantId,
    combatantIds,
    drawCount,
    reason
} = {}) {

    assertExploitableCombat(
        combat
    );


    const existingPendingUnits =
        getCombatInitiativePendingUnits(
            combat
        );

    const targetIndex =
        findPendingUnitIndexByCombatantId(
            existingPendingUnits,
            combatantId
        );


    if (targetIndex === -1) {

        throw new Error(
            `Aucune unité d'initiative en attente ne contient le Combatant « ${combatantId} ».`
        );

    }


    const updatedPendingUnit =
        createMetroInitiativePendingUnit({
            combatantIds,
            drawCount,
            reason
        });


    assertCombatantsParticipateInCombat({
        combat,

        combatantIds:
            updatedPendingUnit.combatantIds
    });


    assertCombatantsAreFreeForPending({
        combat,

        combatantIds:
            updatedPendingUnit.combatantIds,

        pendingUnits:
            existingPendingUnits,

        ignorePendingUnitIndex:
            targetIndex
    });


    const nextPendingUnits =
        existingPendingUnits.map(
            (pendingUnit, index) =>
                index === targetIndex
                    ? updatedPendingUnit
                    : pendingUnit
        );


    await combat.setFlag(
        METRO_INITIATIVE_FLAG_SCOPE,
        METRO_INITIATIVE_PENDING_UNITS_FLAG_KEY,
        nextPendingUnits
    );


    return {
        pendingUnit: {
            ...updatedPendingUnit,

            combatantIds:
                [...updatedPendingUnit.combatantIds]
        },

        pendingUnits:
            nextPendingUnits.map(
                existing => ({
                    ...existing,

                    combatantIds:
                        [...existing.combatantIds]
                })
            )
    };
}


/**
 * Dissout une unité pending entière.
 *
 * Tous ses membres redeviennent non
 * configurés. Aucune unité individuelle
 * n'est recréée automatiquement pour eux :
 * ils équivalent simplement, en l'absence
 * de tout assignment ou pending, à une
 * unité individuelle implicite à 1 carte.
 */
export async function dissolveCombatInitiativePendingUnit({
    combat,
    combatantId
} = {}) {

    assertExploitableCombat(
        combat
    );


    const existingPendingUnits =
        getCombatInitiativePendingUnits(
            combat
        );

    const targetIndex =
        findPendingUnitIndexByCombatantId(
            existingPendingUnits,
            combatantId
        );


    if (targetIndex === -1) {

        throw new Error(
            `Aucune unité d'initiative en attente ne contient le Combatant « ${combatantId} ».`
        );

    }


    const dissolvedPendingUnit =
        existingPendingUnits[targetIndex];

    const nextPendingUnits =
        existingPendingUnits.filter(
            (pendingUnit, index) =>
                index !== targetIndex
        );


    await combat.setFlag(
        METRO_INITIATIVE_FLAG_SCOPE,
        METRO_INITIATIVE_PENDING_UNITS_FLAG_KEY,
        nextPendingUnits
    );


    return {
        dissolvedPendingUnit,

        pendingUnits:
            nextPendingUnits.map(
                existing => ({
                    ...existing,

                    combatantIds:
                        [...existing.combatantIds]
                })
            )
    };
}
