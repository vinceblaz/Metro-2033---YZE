export function resolveMeleeBlockEligibility({
    attack = {},
    defense = {}
} = {}) {

    /*
     * Certaines attaques interdisent explicitement
     * le blocage.
     */
    if (attack.blockable === false) {

        return {
            eligible: false,
            reason: "attack-not-blockable",
            requiresBlockingItem: false
        };

    }


    const attackType =
        attack.type ?? "unarmed";


    /*
     * Attaque à mains nues :
     * elle peut être bloquée à mains nues.
     */
    if (attackType === "unarmed") {

        return {
            eligible: true,
            reason: "unarmed-block",
            requiresBlockingItem: false
        };

    }


    /*
     * Arme de mêlée, animal ou créature :
     * il faut quelque chose de suffisamment
     * résistant pour intercepter l'attaque.
     */
    if (
        attackType === "weapon"
        || attackType === "animal"
        || attackType === "creature"
    ) {

        if (defense.hasBlockingItem !== true) {

            return {
                eligible: false,
                reason: "blocking-item-required",
                requiresBlockingItem: true
            };

        }


        return {
            eligible: true,
            reason: "blocking-item",
            requiresBlockingItem: true
        };

    }


    throw new TypeError(
        `Type d'attaque de mêlée inconnu : ${attackType}`
    );
}