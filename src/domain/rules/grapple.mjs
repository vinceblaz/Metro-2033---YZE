export function resolveGrapple({
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
            "Un Actor ne peut pas se saisir lui-même."
        );
    }


    return {
        applied:
            false,

        pending:
            true,

        reason:
            "grapple-state-required",

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

        /*
         * L'action d'éclat établit la saisie.
         * La persistance Foundry sera ajoutée
         * dans la couche Actor/Combat.
         */
        establishesGrapple:
            true,

        /*
         * Le livre identifie ensuite
         * "Attaque de saisie" comme action rapide.
         */
        enablesGrappleAttack:
            true
    };
}