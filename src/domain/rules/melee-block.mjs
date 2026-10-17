export function resolveMeleeBlock({
    attackSuccesses,
    blockSuccesses
} = {}) {

    if (
        !Number.isInteger(attackSuccesses)
        || attackSuccesses < 0
    ) {
        throw new TypeError(
            "Les réussites de l'attaque doivent être un entier positif ou nul."
        );
    }


    if (
        !Number.isInteger(blockSuccesses)
        || blockSuccesses < 0
    ) {
        throw new TypeError(
            "Les réussites du blocage doivent être un entier positif ou nul."
        );
    }


    const cancelledSuccesses =
        Math.min(
            attackSuccesses,
            blockSuccesses
        );


    const remainingSuccesses =
        Math.max(
            0,
            attackSuccesses
            - cancelledSuccesses
        );


    return {
        attackSuccesses,

        blockSuccesses,

        cancelledSuccesses,

        remainingSuccesses,

        /*
         * Une attaque de Corps à corps nécessite
         * au moins une réussite restante pour toucher.
         */
        blocked:
            remainingSuccesses === 0,

        hit:
            remainingSuccesses > 0,

        /*
         * Le blocage lui-même ne peut jamais
         * être forcé.
         */
        canPush:
            false
    };
}