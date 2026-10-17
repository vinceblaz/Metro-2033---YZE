import {
    ProtectionRoll
} from "../rolls/protection-roll.mjs";

/**
 * Construit la demande de Protection
 * issue des conséquences d'une attaque à distance.
 *
 * Fonction pure :
 *
 * - aucun Actor Foundry ;
 * - aucun jet de dés ;
 * - aucune mutation ;
 * - aucune application de dégâts.
 */
export function createRangedAttackProtectionRequest(
    consequenceResult
) {

    if (!consequenceResult) {

        throw new TypeError(
            "Un résultat de conséquences d'attaque à distance est requis."
        );

    }


    if (
        !consequenceResult.protection
    ) {

        throw new TypeError(
            "Le résultat de conséquences doit contenir un contrat de Protection."
        );

    }


    if (
        consequenceResult.protection.required === true
        &&
        (
            !Number.isInteger(
                consequenceResult.protection.incomingDamage
            )
            ||
            consequenceResult.protection.incomingDamage <= 0
        )
    ) {

        throw new TypeError(
            "Une Protection requise doit avoir des dégâts entrants strictement positifs."
        );

    }


    return {
        required:
            consequenceResult.protection.required,

        incomingDamage:
            consequenceResult.protection.incomingDamage,

        protectionReduction:
            consequenceResult.protection.protectionReduction,

        ignoresResilience:
            consequenceResult.protection.ignoresResilience
    };

}

/**
 * Résout une demande de Protection
 * pour une attaque à distance.
 *
 * Cette fonction reste pure :
 *
 * - aucun Actor Foundry ;
 * - aucune mutation ;
 * - aucune application de dégâts ;
 * - aucune dégradation d'Item.
 *
 * La source de Protection est fournie
 * explicitement par l'orchestrateur.
 */
export function resolveRangedAttackProtection({
    request,
    source
} = {}) {

    if (!request) {

        throw new TypeError(
            "Une demande de Protection est requise."
        );

    }


    if (
        request.required === false
    ) {

        return {
            required:
                false,

            source:
                null,

            dice:
                [],

            successes:
                0,

            ones:
                0,

            incomingDamage:
                0,

            baseProtection:
                0,

            protectionReduction:
                0,

            effectiveProtection:
                0,

            protectionDamage:
                0,

            resilienceIgnored:
                false,

            resiliencePrevented:
                0,

            rawPrevented:
                0,

            totalPrevented:
                0,

            remainingDamage:
                0,

            canPush:
                false
        };

    }


    if (
        request.required === true
        && !source
    ) {

        throw new TypeError(
            "Une source de Protection est requise."
        );

    }

    const result =
        ProtectionRoll.roll(
            source,
            {
                incomingDamage:
                    request.incomingDamage,

                protectionReduction:
                    request.protectionReduction,

                ignoreWornResilience:
                    request.ignoresResilience
            }
        );


    return {
        required:
            true,

        ...result
    };

}


