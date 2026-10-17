/**
 * Résout la réparation d'une armure ou d'un casque.
 *
 * Règles Métro 2033 :
 *
 * - 1 réussite = +1 Protection ;
 * - cela fonctionne même depuis Protection 0 ;
 * - aucun coût supplémentaire pour le premier point ;
 * - un échec ne détruit jamais la protection ;
 * - la Protection ne dépasse jamais sa valeur initiale ;
 * - Résilience perdue n'est récupérée qu'au maximum.
 */
export function resolveArmorRepair({
    current,
    max,
    successes,
    hasResilience = false,
    resilienceLost = false
} = {}) {

    if (
        !Number.isInteger(current)
        || current < 0
    ) {
        throw new TypeError(
            "La Protection actuelle doit être un entier positif ou nul."
        );
    }


    if (
        !Number.isInteger(max)
        || max < 0
    ) {
        throw new TypeError(
            "La Protection maximale doit être un entier positif ou nul."
        );
    }


    if (current > max) {

        throw new RangeError(
            "La Protection actuelle ne peut pas dépasser la Protection maximale."
        );

    }


    if (
        !Number.isInteger(successes)
        || successes < 0
    ) {
        throw new TypeError(
            "Le nombre de réussites doit être un entier positif ou nul."
        );
    }


    if (current >= max) {

        throw new Error(
            "Cette protection n'est pas endommagée."
        );

    }


    const previous =
        current;


    const missing =
        max - current;


    const restored =
        Math.min(
            missing,
            successes
        );


    const next =
        current + restored;


    const fullyRepaired =
        next === max;


    /*
     * Un échec n'a aucun effet irréversible
     * sur une armure ou un casque.
     */
    const success =
        successes > 0;


    /*
     * Résilience :
     *
     * - si elle n'avait pas été perdue, rien ne change ;
     * - si elle avait été perdue à Protection 0,
     *   elle ne revient qu'au maximum.
     */
    const nextResilienceLost =
        hasResilience
        && resilienceLost
        && !fullyRepaired;


    return {

        success,

        previous,

        current:
            next,

        max,

        restored,

        successes,

        successesUsed:
            restored,

        unusedSuccesses:
            Math.max(
                0,
                successes - restored
            ),

        fullyRepaired,

        hasResilience,

        resilienceWasLost:
            resilienceLost,

        resilienceLost:
            nextResilienceLost,

        resilienceRestored:
            (
                hasResilience
                && resilienceLost
                && fullyRepaired
            ),

        broken:
            next === 0

    };

}