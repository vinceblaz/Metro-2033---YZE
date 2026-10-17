/**
 * Résout la dégradation d'une protection portée.
 *
 * Cette fonction ne modifie aucun document Foundry.
 */
export function resolveProtectionDamage({
    current,
    damage
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
        !Number.isInteger(damage)
        || damage < 0
    ) {
        throw new TypeError(
            "Les dégâts de Protection doivent être un entier positif ou nul."
        );
    }


    const next =
        Math.max(
            0,
            current - damage
        );


    return {

        previous:
            current,

        current:
            next,

        requestedDamage:
            damage,

        lost:
            current - next,

        overflow:
            Math.max(
                0,
                damage - current
            ),

        broken:
            next === 0,

        becameBroken:
            current > 0
            && next === 0

    };

}