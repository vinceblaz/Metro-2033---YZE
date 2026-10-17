/**
 * Règles de progression des compétences
 * pour Métro 2033.
 *
 * Ce module ne dépend pas de Foundry.
 *
 * Il ne modifie aucun Actor.
 * Il calcule uniquement :
 *
 * - le niveau cible ;
 * - le coût en XP ;
 * - l'éligibilité mécanique de l'augmentation.
 *
 * IMPORTANT :
 *
 * La condition narrative permettant d'apprendre
 * une compétence de niveau 0 à 1 n'est PAS
 * automatisée ici.
 *
 * Cette autorisation appartient au MJ.
 *
 * Règles Métro 2033 :
 *
 * - niveau de compétence : 0 à 5 ;
 *
 * - augmenter une compétence coûte :
 *      niveau cible × 5 XP ;
 *
 * - compétence d'archétype :
 *      niveau cible × 4 XP ;
 *
 * - exception 0 -> 1 :
 *      coûte toujours 5 XP ;
 *
 * - la condition narrative du passage 0 -> 1
 *   est laissée à l'appréciation du MJ.
 */

export const SKILL_MIN_LEVEL =
    0;

export const SKILL_MAX_LEVEL =
    5;


/**
 * Raisons structurées pouvant empêcher
 * mécaniquement une augmentation.
 */
export const SKILL_PROGRESSION_REASONS =
    Object.freeze({

        MAX_LEVEL:
            "max-level",

        INSUFFICIENT_XP:
            "insufficient-xp"

    });


/**
 * Vérifie qu'un niveau de compétence
 * est valide.
 */
function assertSkillLevel(
    level
) {

    if (
        !Number.isInteger(level)
        || level < SKILL_MIN_LEVEL
        || level > SKILL_MAX_LEVEL
    ) {

        throw new TypeError(
            `Niveau de compétence invalide : ${level}.`
        );

    }

}


/**
 * Vérifie une quantité d'XP.
 */
function assertXp(
    xp
) {

    if (
        !Number.isInteger(xp)
        || xp < 0
    ) {

        throw new TypeError(
            `Quantité d'XP invalide : ${xp}.`
        );

    }

}


/**
 * Calcule le coût pour augmenter
 * une compétence d'un niveau.
 *
 * Le passage 0 -> 1 coûte toujours 5 XP.
 *
 * La réduction d'archétype ne s'applique
 * donc pas à cet apprentissage initial.
 */
export function getSkillImprovementCost({
    currentLevel,
    isArchetypeSkill = false
}) {

    assertSkillLevel(
        currentLevel
    );


    /*
     * Une compétence à 5
     * ne peut plus être augmentée.
     */
    if (
        currentLevel >= SKILL_MAX_LEVEL
    ) {

        return null;

    }


    const targetLevel =
        currentLevel + 1;


    /*
     * Nouvelle compétence.
     *
     * La condition narrative permettant
     * cette augmentation est gérée par le MJ,
     * hors de ce calculateur.
     */
    if (
        currentLevel === 0
    ) {

        return 5;

    }


    /*
     * Progression normale.
     */
    const multiplier =
        isArchetypeSkill
            ? 4
            : 5;


    return (
        targetLevel
        * multiplier
    );

}


/**
 * Évalue mécaniquement une augmentation
 * de compétence.
 *
 * Cette fonction :
 *
 * - ne modifie aucune donnée ;
 * - ne prend aucune décision narrative ;
 * - ne vérifie pas la condition spéciale 0 -> 1.
 *
 * Cette dernière reste une décision du MJ.
 */
export function evaluateSkillImprovement({

    currentLevel,

    availableXp,

    isArchetypeSkill = false

}) {

    assertSkillLevel(
        currentLevel
    );

    assertXp(
        availableXp
    );


    /*
     * Niveau maximal.
     */
    if (
        currentLevel >= SKILL_MAX_LEVEL
    ) {

        return {

            allowed:
                false,

            reason:
                SKILL_PROGRESSION_REASONS
                    .MAX_LEVEL,

            currentLevel,

            targetLevel:
                currentLevel,

            cost:
                null,

            availableXp,

            isArchetypeSkill:
                Boolean(
                    isArchetypeSkill
                ),

            requiresGMApproval:
                false

        };

    }


    const targetLevel =
        currentLevel + 1;


    const cost =
        getSkillImprovementCost({

            currentLevel,

            isArchetypeSkill

        });


    /*
     * Le système indique seulement
     * qu'une décision du MJ est nécessaire
     * pour le passage 0 -> 1.
     *
     * Il ne bloque pas mécaniquement
     * l'augmentation pour cette raison.
     */
    const requiresGMApproval =
        currentLevel === 0;


    /*
     * XP insuffisants.
     */
    if (
        availableXp < cost
    ) {

        return {

            allowed:
                false,

            reason:
                SKILL_PROGRESSION_REASONS
                    .INSUFFICIENT_XP,

            currentLevel,

            targetLevel,

            cost,

            availableXp,

            missingXp:
                cost
                - availableXp,

            isArchetypeSkill:
                Boolean(
                    isArchetypeSkill
                ),

            requiresGMApproval

        };

    }


    /*
     * Augmentation mécaniquement autorisée.
     *
     * Pour 0 -> 1, requiresGMApproval indique
     * au workflow qu'une validation narrative
     * du MJ doit être obtenue avant mutation.
     */
    return {

        allowed:
            true,

        reason:
            null,

        currentLevel,

        targetLevel,

        cost,

        availableXp,

        remainingXp:
            availableXp
            - cost,

        isArchetypeSkill:
            Boolean(
                isArchetypeSkill
            ),

        requiresGMApproval

    };

}