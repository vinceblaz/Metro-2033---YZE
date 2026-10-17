/**
 * Résout les dégâts bruts d'une attaque à distance.
 *
 * Important :
 * - cette fonction ne touche aucun Actor Foundry ;
 * - elle ne lance aucun dé de Protection ;
 * - elle ne dépense pas encore les réussites excédentaires
 *   dans d'autres actions d'éclat.
 */
export function resolveRangedAttackDamage({
    rollResult,
    baseDamage,
    bonusDamage = null
} = {}) {

    if (!rollResult) {
        throw new TypeError(
            "Un résultat de jet est nécessaire."
        );
    }


    if (
        !Number.isInteger(baseDamage)
        || baseDamage < 0
    ) {
        throw new TypeError(
            "Les dégâts de base doivent être un entier positif ou nul."
        );
    }


    const successes =
        rollResult.successes ?? 0;


    if (
        !Number.isInteger(successes)
        || successes < 0
    ) {
        throw new TypeError(
            "Le nombre de réussites doit être un entier positif ou nul."
        );
    }


    // ============================================================
    // ÉCHEC
    // ============================================================

    const hit =
        successes >= 1;


    if (!hit) {

        return {

            hit: false,

            successes,

            baseDamage,

            extraSuccesses: 0,

            bonusDamage: 0,

            rawDamage: 0

        };

    }


    // ============================================================
    // RÉUSSITES EXCÉDENTAIRES
    // ============================================================

    const extraSuccesses =
        Math.max(
            0,
            successes - 1
        );


    /*
     * Pour l'instant, comportement par défaut :
     * toutes les réussites excédentaires sont dépensées
     * en dégâts supplémentaires.
     *
     * Plus tard, la feuille de combat pourra fournir
     * une autre valeur lorsque le joueur dépense des
     * réussites dans des actions d'éclat.
     */
    const resolvedBonusDamage =
        bonusDamage === null
            ? extraSuccesses
            : bonusDamage;


    if (
        !Number.isInteger(resolvedBonusDamage)
        || resolvedBonusDamage < 0
    ) {
        throw new TypeError(
            "Les dégâts supplémentaires doivent être un entier positif ou nul."
        );
    }


    if (
        resolvedBonusDamage
        > extraSuccesses
    ) {
        throw new RangeError(
            "Les dégâts supplémentaires ne peuvent pas dépasser les réussites excédentaires."
        );
    }


    const rawDamage =
        baseDamage
        + resolvedBonusDamage;


    return {

        hit: true,

        successes,

        baseDamage,

        extraSuccesses,

        bonusDamage:
            resolvedBonusDamage,

        rawDamage

    };

}