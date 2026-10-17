import { resolveMeleeBlock }
    from "./melee-block.mjs";


export function resolveMeleeAttack({
    attackSuccesses,
    blockSuccesses = 0,
    blockAttempted = false
} = {}) {

    if (
        !Number.isInteger(attackSuccesses)
        || attackSuccesses < 0
    ) {
        throw new TypeError(
            "Les réussites d'attaque doivent être un entier positif ou nul."
        );
    }


    if (
        !Number.isInteger(blockSuccesses)
        || blockSuccesses < 0
    ) {
        throw new TypeError(
            "Les réussites de blocage doivent être un entier positif ou nul."
        );
    }


    /*
     * Aucun blocage :
     * toutes les réussites de l'attaque restent disponibles.
     */
    if (!blockAttempted) {

        const hit =
            attackSuccesses > 0;

        return {
            attackSuccesses,

            blockAttempted:
                false,

            blockSuccesses:
                0,

            cancelledSuccesses:
                0,

            effectiveSuccesses:
                attackSuccesses,

            hit,

            blocked:
                false,

            /*
             * Une réussite est nécessaire pour toucher.
             * Les autres sont disponibles pour les
             * actions d'éclat.
             */
            extraSuccesses:
                hit
                    ? Math.max(
                        0,
                        attackSuccesses - 1
                    )
                    : 0
        };
    }


    /*
     * Blocage déclaré :
     * on annule d'abord les réussites.
     */
    const block =
        resolveMeleeBlock({
            attackSuccesses,
            blockSuccesses
        });


    const effectiveSuccesses =
        block.remainingSuccesses;


    const hit =
        effectiveSuccesses > 0;


    return {
        attackSuccesses,

        blockAttempted:
            true,

        blockSuccesses,

        cancelledSuccesses:
            block.cancelledSuccesses,

        effectiveSuccesses,

        hit,

        blocked:
            block.blocked,

        extraSuccesses:
            hit
                ? Math.max(
                    0,
                    effectiveSuccesses - 1
                )
                : 0
    };
}