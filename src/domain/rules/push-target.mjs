export function resolvePushTarget({
    attacker,
    target
} = {}) {

    if (!attacker) {
        throw new TypeError(
            "Un attaquant est nécessaire."
        );
    }

    if (!target) {
        throw new TypeError(
            "Une cible est nécessaire."
        );
    }

    if (attacker.id === target.id) {
        throw new Error(
            "Un Actor ne peut pas se repousser lui-même."
        );
    }

    return {
        applied: false,

        pending: true,

        reason:
            "token-movement-required",

        attacker: {
            id:
                attacker.id,

            name:
                attacker.name
        },

        target: {
            id:
                target.id,

            name:
                target.name
        },

        requiresTokenMovement:
            true,

        /*
         * Le livre autorise à repousser la cible,
         * mais nous ne fixons ici aucune distance
         * arbitraire.
         */
        distance:
            null
    };
}
