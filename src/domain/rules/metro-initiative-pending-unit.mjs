/**
 * Indique si une valeur représente
 * un drawCount Métro 2033 valide.
 *
 * Le domaine reste volontairement générique :
 * aucune limite artificielle (2, 3...)
 * n'est codée en dur ici. Seule la forme
 * (entier strictement positif) est
 * contrainte.
 */
export function isValidMetroInitiativeDrawCount(
    value
) {

    return (
        Number.isInteger(value)
        && value >= 1
    );
}


/**
 * Valide et retourne un drawCount
 * Métro 2033.
 *
 * @throws {RangeError}
 * si la valeur n'est pas un entier
 * supérieur ou égal à 1.
 */
export function validateMetroInitiativeDrawCount(
    value
) {

    if (
        !isValidMetroInitiativeDrawCount(
            value
        )
    ) {

        throw new RangeError(
            "Le drawCount d'une unité d'initiative en attente doit être un entier supérieur ou égal à 1."
        );

    }


    return value;
}


/**
 * Crée une unité d'initiative en attente
 * Métro 2033 (A4.7).
 *
 * Une unité en attente représente un ou
 * plusieurs Combatants qui tireront
 * ensemble drawCount cartes candidates
 * avant résolution. Une fois résolue,
 * l'unité devient un
 * initiativeAssignment (cardId +
 * initiative + combatantIds) : drawCount
 * et reason cessent alors de faire
 * autorité.
 *
 * Cette représentation reste
 * indépendante de Foundry et ne connaît
 * ni permissions, ni identité du
 * décideur, ni les autres unités en
 * attente ou résolues d'un même Combat.
 * L'unicité d'un Combatant à travers
 * plusieurs unités appartient à
 * l'orchestration au niveau Combat, pas
 * à cette primitive.
 */
export function createMetroInitiativePendingUnit({
    combatantIds,
    drawCount,
    reason = null
} = {}) {

    if (
        !Array.isArray(combatantIds)
        || combatantIds.length === 0
    ) {

        throw new TypeError(
            "Au moins un identifiant de Combatant est nécessaire pour créer une unité d'initiative en attente."
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
            "Un Combatant ne peut apparaître qu'une seule fois dans une unité d'initiative en attente."
        );

    }


    const validatedDrawCount =
        validateMetroInitiativeDrawCount(
            drawCount
        );


    if (
        reason !== null
        && (
            typeof reason !== "string"
            || reason.length === 0
        )
    ) {

        throw new TypeError(
            "La raison d'une unité d'initiative en attente, si elle est fournie, doit être une chaîne non vide."
        );

    }


    return {
        combatantIds:
            [...combatantIds],

        drawCount:
            validatedDrawCount,

        reason
    };
}
