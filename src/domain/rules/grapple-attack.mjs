export function resolveGrappleAttackEligibility({
    grapple,
    attacker,
    target
} = {}) {

    if (!grapple) {
        return {
            eligible: false,
            reason: "grapple-required"
        };
    }


    if (!attacker) {
        throw new TypeError(
            "Le saisisseur est nécessaire."
        );
    }


    if (!target) {
        throw new TypeError(
            "La cible est nécessaire."
        );
    }


    if (
        attacker.id
        === target.id
    ) {
        throw new Error(
            "L'attaquant et la cible doivent être différents."
        );
    }


    const state =
        grapple.state
        ?? grapple;


    if (
        state.active
        !== true
    ) {
        return {
            eligible: false,
            reason: "grapple-inactive"
        };
    }


    if (
        state.attacker?.actorId
        !== attacker.id
    ) {
        return {
            eligible: false,
            reason: "not-grapple-attacker"
        };
    }


    if (
        state.target?.actorId
        !== target.id
    ) {
        return {
            eligible: false,
            reason: "not-grapple-target"
        };
    }


    return {
        eligible: true,
        reason: null,

        action: {
            id: "grapple-attack",
            cost: "fast",

            attackType:
                "unarmed",

            skill:
                "closeCombat",

            attribute:
                "vigor",

            blockable:
                false
        }
    };

}


export function createGrappleAttackContext({
    grapple,
    attacker,
    target
} = {}) {

    const eligibility =
        resolveGrappleAttackEligibility({
            grapple,
            attacker,
            target
        });


    if (
        eligibility.eligible
        !== true
    ) {
        return {
            created: false,
            eligibility,
            context: null
        };
    }


    return {
        created: true,

        eligibility,

        context: {
            action:
                "grapple-attack",

            attacker: {
                id:
                    attacker.id,

                uuid:
                    attacker.uuid ?? null,

                name:
                    attacker.name ?? null
            },

            target: {
                id:
                    target.id,

                uuid:
                    target.uuid ?? null,

                name:
                    target.name ?? null
            },

            attack: {
                type:
                    "unarmed",

                blockable:
                    false
            },

            actionCost:
                "fast",

            skill:
                "closeCombat",

            attributeId:
                "vigor",

            grappleId:
                grapple.id
                ?? null
        }
    };

}