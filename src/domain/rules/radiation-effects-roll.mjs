/**
 * Effets des radiations (livre de règles, p.206).
 *
 * Chaque fois que le personnage subit une dose de Radiation,
 * il jette un nombre de dés égal à son total de doses de
 * Radiation emmagasinées (doses normales + doses devenues
 * permanentes : une dose permanente reste "emmagasinée",
 * elle ne peut simplement plus être éliminée). Pour chaque
 * "1" obtenu, le personnage subit 1 point de dégâts de
 * VIGUEUR (non convertible en dé de Stress).
 *
 * Ce module ne lance aucun dé : il reçoit le nombre
 * d'afflictions déjà obtenues (ones) et calcule les
 * dégâts de VIGUEUR correspondants.
 */

export function resolveRadiationEffectsRoll({
    doses,
    permanent,
    ones
} = {}) {

    if (
        !Number.isInteger(doses)
        || doses < 0
    ) {
        throw new TypeError(
            "Les doses de Radiation doivent être un entier positif ou nul."
        );
    }


    if (
        !Number.isInteger(permanent)
        || permanent < 0
    ) {
        throw new TypeError(
            "Les doses de Radiation permanentes doivent être "
            + "un entier positif ou nul."
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
        doses + permanent;


    if (ones > diceCount) {
        throw new RangeError(
            "Le nombre d'afflictions ne peut pas dépasser "
            + "le nombre de dés lancés."
        );
    }


    return {

        doses,

        permanent,

        diceCount,

        ones,

        vigorDamage:
            ones

    };

}
