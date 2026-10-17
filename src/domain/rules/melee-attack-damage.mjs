export function resolveMeleeAttackDamage({
    hit,
    weaponDamage = 0,
    bonusVigorDamage = 0,
    bonusAgilityDamage = 0
} = {}) {

    if (typeof hit !== "boolean") {
        throw new TypeError(
            "hit doit être un booléen."
        );
    }


    for (
        const [name, value]
        of Object.entries({
            weaponDamage,
            bonusVigorDamage,
            bonusAgilityDamage
        })
    ) {

        if (
            !Number.isInteger(value)
            || value < 0
        ) {
            throw new TypeError(
                `${name} doit être un entier positif ou nul.`
            );
        }

    }


    /*
     * Si le blocage a annulé toutes les réussites,
     * ou si l'attaque a simplement échoué,
     * aucun dégât n'est infligé.
     */
    if (!hit) {

        return {
            hit: false,

            weaponDamage: 0,
            bonusVigorDamage: 0,
            bonusAgilityDamage: 0,

            vigorDamage: 0,
            agilityDamage: 0
        };

    }


    /*
     * Les dégâts de base de l'arme et l'action
     * d'éclat +1 Vigueur alimentent les dégâts
     * physiques de Vigueur.
     *
     * L'action d'éclat Agilité reste séparée.
     */
    const vigorDamage =
        weaponDamage
        + bonusVigorDamage;


    return {
        hit: true,

        weaponDamage,
        bonusVigorDamage,
        bonusAgilityDamage,

        vigorDamage,

        agilityDamage:
            bonusAgilityDamage
    };
}