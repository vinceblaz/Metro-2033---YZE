/**
 * Calcule les conséquences d'une tentative
 * de réparation d'un équipement Métro 2033.
 *
 * Cette fonction ne modifie aucune donnée Foundry.
 */
export function resolveEquipmentRepair({
    current,
    max,
    successes,
    repairable = true
} = {}) {

    if (
        !Number.isInteger(current)
        || current < 0
    ) {

        throw new TypeError(
            "current doit être un entier positif ou nul."
        );

    }


    if (
        !Number.isInteger(max)
        || max < 0
    ) {

        throw new TypeError(
            "max doit être un entier positif ou nul."
        );

    }


    if (
        current > max
    ) {

        throw new Error(
            "Le bonus actuel ne peut pas dépasser le bonus maximal."
        );

    }


    if (
        !Number.isInteger(successes)
        || successes < 0
    ) {

        throw new TypeError(
            "successes doit être un entier positif ou nul."
        );

    }


    if (!repairable) {

        throw new Error(
            "Cet équipement ne peut plus être réparé."
        );

    }


    if (current >= max) {

        throw new Error(
            "Cet équipement n'est pas endommagé."
        );

    }


    const wasBroken =
        current === 0;


    // ============================================================
    // ÉCHEC DE RÉPARATION
    // ============================================================

    if (successes === 0) {

        return {

            success:
                false,

            wasBroken,

            previous:
                current,

            current,

            restored:
                0,

            repairable:
                false,

            destroyed:
                wasBroken,

            successesUsed:
                0,

            unusedSuccesses:
                0

        };

    }


    // ============================================================
    // ÉQUIPEMENT HORS D'USAGE
    // ============================================================

    if (wasBroken) {

        /*
         * Il faut au moins deux réussites pour
         * récupérer le premier point.
         *
         * Une seule réussite ne suffit donc pas
         * à sauver l'équipement.
         */
        if (successes < 2) {

            return {

                success:
                    false,

                wasBroken:
                    true,

                previous:
                    0,

                current:
                    0,

                restored:
                    0,

                repairable:
                    false,

                destroyed:
                    true,

                successesUsed:
                    successes,

                unusedSuccesses:
                    0

            };

        }


        /*
         * Deux réussites → premier point.
         *
         * Chaque réussite supplémentaire
         * → un point supplémentaire.
         *
         * Exemple :
         * 2 réussites → +1
         * 3 réussites → +2
         * 4 réussites → +3
         */
        const potentialRestored =
            successes - 1;


        const next =
            Math.min(
                max,
                potentialRestored
            );


        const restored =
            next;


        /*
         * Les réussites réellement nécessaires :
         * 2 pour le premier point,
         * puis une par point supplémentaire.
         */
        const successesUsed =
            restored > 0
                ? restored + 1
                : 0;


        return {

            success:
                true,

            wasBroken:
                true,

            previous:
                0,

            current:
                next,

            restored,

            repairable:
                true,

            destroyed:
                false,

            successesUsed,

            unusedSuccesses:
                Math.max(
                    0,
                    successes - successesUsed
                )

        };

    }


    // ============================================================
    // ÉQUIPEMENT SIMPLEMENT ENDOMMAGÉ
    // ============================================================

    const missing =
        max - current;


    const restored =
        Math.min(
            missing,
            successes
        );


    const next =
        current + restored;


    return {

        success:
            true,

        wasBroken:
            false,

        previous:
            current,

        current:
            next,

        restored,

        repairable:
            true,

        destroyed:
            false,

        successesUsed:
            restored,

        unusedSuccesses:
            Math.max(
                0,
                successes - restored
            )

    };

}