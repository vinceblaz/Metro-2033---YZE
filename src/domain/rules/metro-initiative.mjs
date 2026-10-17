/**
 * Valeurs possibles d'une carte d'initiative
 * dans Métro 2033.
 *
 * Une initiative plus faible agit avant
 * une initiative plus élevée.
 */
export const METRO_INITIATIVE_VALUES =
    Object.freeze([
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
    ]);


/**
 * Indique si une valeur représente
 * une initiative Métro 2033 valide.
 *
 * Le domaine reste volontairement strict :
 * - nombre uniquement ;
 * - entier uniquement ;
 * - compris entre 1 et 10 inclus.
 */
export function isValidMetroInitiativeValue(
    value
) {

    return (
        Number.isInteger(value)
        && value >= 1
        && value <= 10
    );
}


/**
 * Valide et retourne une valeur
 * d'initiative Métro 2033.
 *
 * @throws {RangeError}
 * si la valeur ne correspond pas
 * à une carte d'initiative valide.
 */
export function validateMetroInitiativeValue(
    value
) {

    if (
        !isValidMetroInitiativeValue(
            value
        )
    ) {

        throw new RangeError(
            "L'initiative Métro 2033 doit être un entier compris entre 1 et 10."
        );

    }


    return value;
}