/**
 * Jet de réserve (livre de règles, p.174).
 *
 * À intervalles réguliers, on lance un nombre de dés égal
 * au niveau actuel de la réserve concernée (Eau, Nourriture,
 * Énergie...), sans jamais dépasser 5 dés même si le niveau
 * est plus élevé. Pour chaque "1" obtenu (une affliction),
 * le niveau de réserve diminue de 1.
 *
 * Ce module ne lance aucun dé : il reçoit le nombre
 * d'afflictions déjà obtenues (ones) et calcule le
 * nouveau niveau de réserve.
 */

export const MAX_RESERVE_ROLL_DICE = 5;


export function resolveReserveRoll({
    level,
    ones
} = {}) {

    if (
        !Number.isInteger(level)
        || level < 0
    ) {
        throw new TypeError(
            "Le niveau de réserve doit être un entier positif ou nul."
        );
    }


    if (
        !Number.isInteger(ones)
        || ones < 0
    ) {
        throw new TypeError(
            "Le nombre d'afflictions doit être un entier positif ou nul."
        );
    }


    const diceCount =
        Math.min(
            MAX_RESERVE_ROLL_DICE,
            level
        );


    if (ones > diceCount) {
        throw new RangeError(
            "Le nombre d'afflictions ne peut pas dépasser "
            + "le nombre de dés lancés."
        );
    }


    const newLevel =
        Math.max(
            0,
            level - ones
        );


    return {

        previousLevel:
            level,

        diceCount,

        ones,

        newLevel,

        depleted:
            newLevel === 0

    };

}
