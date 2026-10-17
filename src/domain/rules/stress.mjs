/**
 * Règles de Stress spécifiques à Métro 2033.
 *
 * Ces règles n'appartiennent pas au moteur YZE générique.
 */

export const MAX_STRESS_DICE = 5;


/**
 * Valide une quantité de dés de Stress.
 */
export function validateStressDice(value) {

    if (!Number.isInteger(value)) {

        throw new TypeError(
            "Le nombre de dés de Stress doit être un entier."
        );

    }

    if (value < 0) {

        throw new RangeError(
            "Le nombre de dés de Stress ne peut pas être négatif."
        );

    }

    return value;

}


/**
 * Retourne le nombre de dés de Stress pouvant
 * être stockés normalement sur le personnage.
 */
export function clampStressDice(value) {

    validateStressDice(value);

    return Math.min(
        MAX_STRESS_DICE,
        value
    );

}


/**
 * Indique si l'ajout demandé ferait dépasser
 * la limite normale de Stress.
 *
 * Le dépassement sera ultérieurement traité
 * par la règle "Repousser ses limites".
 */
export function wouldExceedStressLimit(
    current,
    amount = 1
) {

    validateStressDice(current);
    validateStressDice(amount);

    return (
        current + amount
        > MAX_STRESS_DICE
    );

}