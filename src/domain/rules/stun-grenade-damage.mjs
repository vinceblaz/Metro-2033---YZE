export function resolveStunGrenadeDamage({
    stunResult,
    coverProtection = 0,
    helmetProtection = 0
} = {}) {

    if (!stunResult) {
        throw new TypeError(
            "Un résultat de grenade étourdissante est nécessaire."
        );
    }


    if (
        !Number.isInteger(coverProtection)
        || coverProtection < 0
    ) {
        throw new TypeError(
            "La Protection de l'abri doit être un entier positif ou nul."
        );
    }


    if (
        !Number.isInteger(helmetProtection)
        || helmetProtection < 0
    ) {
        throw new TypeError(
            "La Protection du casque doit être un entier positif ou nul."
        );
    }


    /*
     * Hors de la zone d'effet :
     * aucun dégât.
     */
    if (!stunResult.affected) {

        return {
            affected: false,

            rawSpiritDamage: 0,

            coverProtection: 0,
            helmetProtection: 0,

            totalProtection: 0,

            preventedDamage: 0,
            remainingSpiritDamage: 0,

            stunned: false
        };
    }


    const rawSpiritDamage =
        stunResult.rawSpiritDamage ?? 0;


    /*
     * Une grenade étourdissante ne bénéficie
     * que de la moitié de la Protection
     * procurée par l'abri, arrondie au supérieur.
     */
    const effectiveCoverProtection =
        Math.ceil(
            coverProtection / 2
        );


    /*
     * Seul le casque protège personnellement.
     *
     * L'armure corporelle n'entre donc jamais
     * dans ce resolver.
     */
    const effectiveHelmetProtection =
        helmetProtection;


    const totalProtection =
        effectiveCoverProtection
        + effectiveHelmetProtection;


    /*
     * Pour l'instant cette fonction résout
     * uniquement les valeurs de Protection
     * disponibles.
     *
     * Comme pour une Protection normale,
     * chaque point représente un dé de
     * Protection : on ne soustrait donc PAS
     * directement cette valeur aux dégâts.
     */
    return {
        affected: true,

        rawSpiritDamage,

        coverProtection:
            effectiveCoverProtection,

        helmetProtection:
            effectiveHelmetProtection,

        totalProtection,

        /*
         * Ces valeurs seront déterminées
         * après le jet de Protection.
         */
        preventedDamage: null,
        remainingSpiritDamage: null,
        stunned: null
    };
}