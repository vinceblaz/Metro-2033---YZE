/**
 * Système "La Station" — Personnel de soutien (livre de règles
 * p.219).
 *
 * Avant chaque jet de Population hebdomadaire, si au moins un
 * personnel de soutien est présent pour une ressource, on lance
 * 3 dés. Chaque "6" augmente la ressource de 1. Si le jet produit
 * au moins deux "1", le personnel de soutien meurt (il faudra lui
 * trouver un remplaçant) et la ressource n'augmente pas, même si
 * un "6" a par ailleurs été obtenu.
 *
 * Module pur : il ne lance aucun dé, il reçoit les 3 faces déjà
 * obtenues.
 */

export const STATION_SUPPORT_PERSONNEL_ROLL_DICE_COUNT =
    3;


export function resolveStationSupportPersonnelRoll({
    diceResults
} = {}) {

    if (
        !Array.isArray(diceResults)
        || diceResults.length
            !== STATION_SUPPORT_PERSONNEL_ROLL_DICE_COUNT
    ) {

        throw new TypeError(
            "Il faut exactement "
            + STATION_SUPPORT_PERSONNEL_ROLL_DICE_COUNT
            + " faces de dé déjà obtenues."
        );

    }


    for (
        const face
        of diceResults
    ) {

        if (
            !Number.isInteger(face)
            || face < 1
            || face > 6
        ) {

            throw new TypeError(
                "Chaque face de dé doit être un entier entre "
                + "1 et 6."
            );

        }

    }


    const successes =
        diceResults.filter(
            face => face === 6
        ).length;

    const ones =
        diceResults.filter(
            face => face === 1
        ).length;

    const personnelDied =
        ones >= 2;


    return {

        successes,

        ones,

        personnelDied,

        /*
         * Le personnel mort ne fait jamais augmenter la
         * ressource, même en cas de succès simultané.
         */
        resourceGain:
            personnelDied
                ? 0
                : successes

    };

}
