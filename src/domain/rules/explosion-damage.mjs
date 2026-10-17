export function resolveExplosionDamage({
    explosionResult,
    protectionResult = null
} = {}) {

    if (!explosionResult) {
        throw new TypeError(
            "Un résultat d'explosion est nécessaire."
        );
    }


    /*
     * La cible se trouve hors de la zone
     * affectée par l'explosion.
     */
    if (!explosionResult.affected) {

        return {
            affected: false,

            rawDamage: 0,

            protectionPrevented: 0,

            remainingDamage: 0,

            takesDamage: false,

            knockdown: false
        };

    }


    const rawDamage =
        explosionResult.rawDamage ?? 0;


    /*
     * Aucun dégât produit par le jet.
     */
    if (rawDamage <= 0) {

        return {
            affected: true,

            rawDamage: 0,

            protectionPrevented: 0,

            remainingDamage: 0,

            takesDamage: false,

            knockdown: false
        };

    }


    /*
     * Si une Protection a été résolue,
     * elle nous fournit directement les
     * dégâts restant après absorption.
     *
     * Sinon, tous les dégâts passent.
     */
    const protectionPrevented =
        protectionResult?.totalPrevented
        ?? 0;


    const remainingDamage =
        protectionResult
            ? protectionResult.remainingDamage
            : rawDamage;


    const takesDamage =
        remainingDamage > 0;


    return {
        affected: true,

        rawDamage,

        protectionPrevented,

        remainingDamage,

        takesDamage,

        /*
         * Une victime qui subit réellement
         * des dégâts d'explosion tombe.
         */
        knockdown:
            takesDamage
    };

}