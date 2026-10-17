export const RANGED_STUNT_IDS =
    Object.freeze({
        VIGOR_DAMAGE:
            "vigorDamage",

        SPIRIT_DAMAGE:
            "spiritDamage",

        SWAP_INITIATIVE:
            "swapInitiative",

        DISARM:
            "disarm",

        KNOCKDOWN:
            "knockdown",

        GRENADE:
            "grenade"
    });


export function resolveRangedStunts({
    rollResult,
    allocation = {},
    explosive = false
} = {}) {

    if (!rollResult) {

        throw new TypeError(
            "Un résultat de jet est nécessaire."
        );

    }


    const successes =
        rollResult.successes
        ?? 0;


    const extraSuccesses =
        Math.max(
            0,
            successes - 1
        );


    const vigorDamage =
        allocation.vigorDamage
        ?? 0;


    const spiritDamage =
        allocation.spiritDamage
        ?? 0;


    const swapInitiative =
        allocation.swapInitiative
        === true;


    const disarm =
        allocation.disarm
        === true;


    const knockdown =
        allocation.knockdown
        === true;


    const grenade =
        allocation.grenade
        === true;


    if (
        !Number.isInteger(vigorDamage)
        || vigorDamage < 0
    ) {

        throw new RangeError(
            "vigorDamage doit être un entier positif ou nul."
        );

    }


    if (
        !Number.isInteger(spiritDamage)
        || spiritDamage < 0
    ) {

        throw new RangeError(
            "spiritDamage doit être un entier positif ou nul."
        );

    }


    const spent =
        vigorDamage
        + spiritDamage
        + Number(swapInitiative)
        + Number(disarm)
        + Number(knockdown)
        + Number(grenade);


    if (
        spent > extraSuccesses
    ) {

        throw new RangeError(
            `Les actions d'éclat dépensent ${spent} réussite(s), `
            + `mais seulement ${extraSuccesses} réussite(s) excédentaire(s) sont disponibles.`
        );

    }


    if (
        explosive
        && (
            vigorDamage > 0
            || spiritDamage > 0
            || swapInitiative
            || disarm
            || knockdown
        )
    ) {

        throw new Error(
            "Une attaque utilisant les règles d'explosion ne peut utiliser que l'action d'éclat « Grenade ! »."
        );

    }


    if (
        grenade
        && !explosive
    ) {

        throw new Error(
            "L'action d'éclat « Grenade ! » nécessite une attaque utilisant les règles d'explosion."
        );

    }


    return {

        successes,

        extraSuccesses,

        spent,

        remaining:
            extraSuccesses - spent,

        effects: {

            vigorDamage,

            spiritDamage,

            swapInitiative,

            disarm,

            knockdown,

            grenade

        }

    };

}