function actorSnapshot(actor) {

    if (!actor) {
        throw new TypeError(
            "Un Actor est nécessaire."
        );
    }


    return {
        id:
            actor.id,

        uuid:
            actor.uuid ?? null,

        name:
            actor.name ?? null
    };

}


export function createGrappleState({
    attacker,
    target
} = {}) {

    if (!attacker) {
        throw new TypeError(
            "Le saisisseur est nécessaire."
        );
    }


    if (!target) {
        throw new TypeError(
            "La cible saisie est nécessaire."
        );
    }


    if (
        attacker.id
        === target.id
    ) {

        throw new Error(
            "Un Actor ne peut pas se saisir lui-même."
        );

    }


    return {

        active:
            true,

        attacker:
            actorSnapshot(
                attacker
            ),

        target:
            actorSnapshot(
                target
            ),


        /*
         * Conséquences immédiates prévues
         * par la règle de saisie.
         */
        consequences: {

            attackerProne:
                true,

            targetProne:
                true,

            targetDropsHeldWeapon:
                true,

            targetMovementLocked:
                true
        },


        /*
         * Actions permises tant que la
         * saisie est active.
         */
        attackerActions: {

            release:
                true,

            grappleAttack:
                true,

            otherActions:
                false
        },


        targetActions: {

            escape:
                true,

            otherActions:
                false
        },


        /*
         * Attaque de saisie.
         */
        grappleAttack: {

            actionCost:
                "fast",

            attackType:
                "unarmed",

            skill:
                "closeCombat",

            blockable:
                false
        },


        /*
         * Tentative de libération.
         */
        escape: {

            actionCost:
                "slow",

            opposed:
                true,

            attackerAttribute:
                "vigor",

            targetAttribute:
                "vigor"
        }

    };

}


export function isActiveGrappleState(
    state
) {

    if (
        !state
        || typeof state !== "object"
    ) {
        return false;
    }


    if (
        state.active !== true
    ) {
        return false;
    }


    const attackerId =
        state.attacker?.id
        ?? state.attacker?.actorId;


    const targetId =
        state.target?.id
        ?? state.target?.actorId;


    if (
        !attackerId
        || !targetId
    ) {
        return false;
    }


    if (
        attackerId
        === targetId
    ) {
        return false;
    }


    return true;
}


export function resolveGrappleEscape({
    state,
    targetSuccesses,
    attackerSuccesses
} = {}) {

    if (
        !isActiveGrappleState(
            state
        )
    ) {
        throw new Error(
            "La saisie n'est pas active."
        );
    }


    if (
        !Number.isInteger(
            targetSuccesses
        )
        || targetSuccesses < 0
    ) {
        throw new TypeError(
            "Les réussites de la cible doivent être un entier positif ou nul."
        );
    }


    if (
        !Number.isInteger(
            attackerSuccesses
        )
        || attackerSuccesses < 0
    ) {
        throw new TypeError(
            "Les réussites du saisisseur doivent être un entier positif ou nul."
        );
    }


    /*
     * Jet en opposition :
     *
     * celui qui tente l'action doit obtenir
     * STRICTEMENT plus de réussites que
     * son adversaire.
     *
     * Une égalité est donc un échec.
     */
    const escaped =
        targetSuccesses
        > attackerSuccesses;


    if (!escaped) {

        return {
            escaped:
                false,

            resolved:
                true,

            tie:
                targetSuccesses
                === attackerSuccesses,

            targetSuccesses,

            attackerSuccesses,

            margin:
                targetSuccesses
                - attackerSuccesses,

            state
        };

    }


    const releasedState = {
        ...state,

        active:
            false,

        endedBy:
            "escape"
    };


    return {
        escaped:
            true,

        resolved:
            true,

        tie:
            false,

        targetSuccesses,

        attackerSuccesses,

        margin:
            targetSuccesses
            - attackerSuccesses,

        state:
            releasedState
    };

}