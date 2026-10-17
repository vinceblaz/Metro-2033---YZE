/**
 * Règles de progression des Talents.
 *
 * Un Talent peut posséder plusieurs niveaux.
 *
 * Le niveau actuel d'un Actor dans un Talent
 * correspond au nombre d'Items Talent embarqués
 * partageant le même system.key.
 *
 * Le niveau maximum est défini par :
 *
 * system.maxLevel
 *
 * Chaque augmentation d'un niveau coûte 5 XP.
 *
 * Ce module ne gère PAS :
 *
 * - la création de l'Embedded Item supplémentaire ;
 * - la dépense effective des XP ;
 * - l'entraînement ;
 * - un professeur ;
 * - un jet d'ESPRIT ;
 * - une tentative par jour ;
 * - l'autorisation narrative du MJ.
 *
 * Cette couche ne fait qu'évaluer
 * la progression mécaniquement.
 */


export const TALENT_ADVANCEMENT_COST = 5;


export const TALENT_PROGRESSION_REASONS = {

    MAX_LEVEL:
        "max-level",

    INVALID_LEVEL:
        "invalid-level",

    INVALID_MAX_LEVEL:
        "invalid-max-level",

    INSUFFICIENT_XP:
        "insufficient-xp"

};


/**
 * Retourne le coût d'une augmentation
 * d'un niveau de Talent.
 *
 * Chaque niveau supplémentaire coûte 5 XP.
 *
 * @returns {number}
 */
export function getTalentImprovementCost() {

    return TALENT_ADVANCEMENT_COST;

}


/**
 * Évalue si un Talent peut être augmenté
 * d'un niveau.
 *
 * Cette fonction est PURE :
 *
 * - elle ne modifie aucun Document ;
 * - elle ne crée aucun Embedded Item ;
 * - elle ne dépense aucun XP ;
 * - elle ne décide d'aucun prérequis narratif.
 *
 * @param {object} options
 * @param {number} options.currentLevel
 * @param {number} options.maxLevel
 * @param {number} options.availableXp
 *
 * @returns {{
 *   allowed: boolean,
 *   reason: string|null,
 *   cost: number,
 *   remainingXp: number,
 *   missingXp: number,
 *   currentLevel: number,
 *   targetLevel: number|null,
 *   maxLevel: number
 * }}
 */
export function evaluateTalentImprovement({
    currentLevel,
    maxLevel,
    availableXp
} = {}) {

    const level =
        Number(
            currentLevel
        );


    const maximum =
        Number(
            maxLevel
        );


    const xp =
        Math.max(
            0,
            Number(
                availableXp
            ) || 0
        );


    const cost =
        getTalentImprovementCost();


    // ========================================================
    // NIVEAU MAXIMUM INVALIDE
    // ========================================================

    if (
        !Number.isInteger(
            maximum
        )
        || maximum < 1
        || maximum > 5
    ) {

        return {

            allowed:
                false,

            reason:
                TALENT_PROGRESSION_REASONS
                    .INVALID_MAX_LEVEL,

            cost,

            remainingXp:
                xp,

            missingXp:
                0,

            currentLevel:
                level,

            targetLevel:
                null,

            maxLevel:
                maximum

        };

    }


    // ========================================================
    // NIVEAU ACTUEL INVALIDE
    // ========================================================

    if (
        !Number.isInteger(
            level
        )
        || level < 1
        || level > maximum
    ) {

        return {

            allowed:
                false,

            reason:
                TALENT_PROGRESSION_REASONS
                    .INVALID_LEVEL,

            cost,

            remainingXp:
                xp,

            missingXp:
                0,

            currentLevel:
                level,

            targetLevel:
                null,

            maxLevel:
                maximum

        };

    }


    // ========================================================
    // NIVEAU MAXIMUM ATTEINT
    // ========================================================

    if (
        level >= maximum
    ) {

        return {

            allowed:
                false,

            reason:
                TALENT_PROGRESSION_REASONS
                    .MAX_LEVEL,

            cost,

            remainingXp:
                xp,

            missingXp:
                0,

            currentLevel:
                level,

            targetLevel:
                null,

            maxLevel:
                maximum

        };

    }


    const targetLevel =
        level + 1;


    // ========================================================
    // XP INSUFFISANTS
    // ========================================================

    if (
        xp < cost
    ) {

        return {

            allowed:
                false,

            reason:
                TALENT_PROGRESSION_REASONS
                    .INSUFFICIENT_XP,

            cost,

            remainingXp:
                xp,

            missingXp:
                cost - xp,

            currentLevel:
                level,

            targetLevel,

            maxLevel:
                maximum

        };

    }


    // ========================================================
    // PROGRESSION AUTORISÉE
    // ========================================================

    return {

        allowed:
            true,

        reason:
            null,

        cost,

        remainingXp:
            xp - cost,

        missingXp:
            0,

        currentLevel:
            level,

        targetLevel,

        maxLevel:
            maximum

    };

}