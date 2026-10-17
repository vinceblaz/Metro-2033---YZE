/**
 * Jet de Trépas (livre de règles, p.201).
 *
 * Un jet d'ENDURANCE utilisant la valeur de VIGUEUR TOTALE
 * (max, non réduite par les dégâts subis), éventuellement
 * modifié par le malus (ou bonus) figurant dans la colonne
 * "Fatal" de la Blessure critique. Ce jet ne peut jamais
 * être forcé (Push).
 *
 * Si le jet échoue (aucune réussite), le personnage meurt.
 * S'il réussit, le personnage survit mais devra refaire un
 * jet de Trépas au terme du même délai.
 */

export function computeDeathRollDicePool({
    vigorMax,
    enduranceSkill,
    deathRollModifier
} = {}) {

    if (
        !Number.isInteger(vigorMax)
        || vigorMax < 0
    ) {
        throw new TypeError(
            "La VIGUEUR max doit être un entier positif ou nul."
        );
    }


    if (
        !Number.isInteger(enduranceSkill)
        || enduranceSkill < 0
    ) {
        throw new TypeError(
            "La compétence ENDURANCE doit être un entier positif ou nul."
        );
    }


    if (!Number.isInteger(deathRollModifier)) {
        throw new TypeError(
            "Le modificateur du jet de Trépas doit être un entier."
        );
    }


    return {

        attribute:
            vigorMax,

        skill:
            enduranceSkill,

        penalty:
            deathRollModifier < 0
                ? -deathRollModifier
                : 0,

        bonus:
            deathRollModifier > 0
                ? deathRollModifier
                : 0

    };

}


export function resolveDeathRollOutcome({
    successes,
    previousRolls
} = {}) {

    if (
        !Number.isInteger(successes)
        || successes < 0
    ) {
        throw new TypeError(
            "Le nombre de réussites doit être un entier positif ou nul."
        );
    }


    if (
        !Number.isInteger(previousRolls)
        || previousRolls < 0
    ) {
        throw new TypeError(
            "Le nombre de jets précédents doit être un entier positif ou nul."
        );
    }


    return {

        successes,

        survived:
            successes > 0,

        rolls:
            previousRolls + 1

    };

}
