/**
 * Composition rapide de l'initiative : un groupe individuel par
 * combattant non encore groupé (en deçà d'un seuil). Fonctions pures.
 */

export const INDIVIDUAL_GROUPS_THRESHOLD = 10;

export function listUngroupedCombatantIds(allIds, groups) {

    const grouped = new Set(
        (groups ?? []).flatMap(group => group?.combatantIds ?? [])
    );

    return (allIds ?? []).filter(id => !grouped.has(id));
}

export function shouldDefaultToIndividualGroups(ungroupedCount) {

    return ungroupedCount >= 1 && ungroupedCount < INDIVIDUAL_GROUPS_THRESHOLD;
}
