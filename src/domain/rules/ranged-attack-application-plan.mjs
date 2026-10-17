/**
 * Construit le plan d'application d'une attaque
 * à distance après résolution de la Protection.
 *
 * Fonction pure :
 *
 * - aucun Actor Foundry ;
 * - aucun Item Foundry ;
 * - aucune mutation ;
 * - aucun ChatMessage ;
 * - aucune application effective des conséquences.
 *
 * Le plan décrit uniquement ce qui devra être
 * appliqué ultérieurement par la frontière P6.
 */
export function createRangedAttackApplicationPlan({
    consequenceResult,
    protectionResult
} = {}) {

    if (!consequenceResult) {

    throw new TypeError(
        "Un résultat de conséquences d'attaque à distance est requis."
    );

}


    if (!protectionResult) {

        throw new TypeError(
            "Un résultat de Protection est requis."
        );

    }


    if (
        !Number.isInteger(
            protectionResult.remainingDamage
        )
        ||
        protectionResult.remainingDamage < 0
    ) {

        throw new TypeError(
            "Les dégâts restants doivent être un entier positif ou nul."
        );

    }


    if (
        !Number.isInteger(
            protectionResult.protectionDamage
        )
        ||
        protectionResult.protectionDamage < 0
    ) {

        throw new TypeError(
            "Les dégâts de Protection doivent être un entier positif ou nul."
        );

    }

    const spiritDamage =
        consequenceResult.effects
            ?.spiritDamage
        ?? 0;


    if (
        !Number.isInteger(
            spiritDamage
        )
        ||
        spiritDamage < 0
    ) {

        throw new TypeError(
            "Les dégâts d'Esprit doivent être un entier positif ou nul."
        );

    }    


    const plan = {
        damage: {
            vigor:
                protectionResult.remainingDamage
        }
    };


    if (
        spiritDamage > 0
    ) {

        plan.damage.spirit =
            spiritDamage;

    }


    if (
        protectionResult.protectionDamage > 0
    ) {

        plan.protection = {
            damage:
                protectionResult.protectionDamage
        };

    }


    if (
        consequenceResult.effects
            ?.knockdown === true
    ) {

        plan.effects ??= {};

        plan.effects.knockdown =
            true;

    }


    if (
        consequenceResult.effects
            ?.disarm === true
    ) {

        plan.effects ??= {};

        plan.effects.disarm =
            true;

    }


    if (
        consequenceResult.effects
            ?.swapInitiative === true
    ) {

        plan.effects ??= {};

        plan.effects.swapInitiative =
            true;

    }


    if (
        consequenceResult.effects
            ?.grenade === true
    ) {

        plan.effects ??= {};

        plan.effects.grenade =
            true;

    }


    return plan;

}