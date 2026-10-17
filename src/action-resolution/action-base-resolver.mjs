/**
 * Résout les valeurs de base d'une action à partir
 * d'un Actor et d'un ActionResolutionContext.
 */

function normalizeNumber(value) {
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : 0;
}


/**
 * Le Stress est actuellement réservé aux PJ.
 *
 * Pour les PNJ et les Créatures :
 * stress = 0.
 */
export function getActorStressDice(actor) {
    if (actor?.type !== "character") {
        return 0;
    }

    return normalizeNumber(
        actor.system?.stress?.dice
    );
}


export function getActorAttributeValue(
    actor,
    attributeId
) {
    if (
        !actor
        || typeof attributeId !== "string"
        || attributeId.length === 0
    ) {
        return 0;
    }

    return normalizeNumber(
        actor.system
            ?.attributes
            ?.[attributeId]
            ?.value
    );
}


export function getActorSkillValue(
    actor,
    skillId
) {
    if (
        !actor
        || typeof skillId !== "string"
        || skillId.length === 0
    ) {
        return 0;
    }

    return normalizeNumber(
        actor.system
            ?.skills
            ?.[skillId]
    );
}


export function resolveActionBase(
    actor,
    context
) {
    if (!actor) {
        throw new TypeError(
            "Un Actor est requis pour résoudre la base d'une action."
        );
    }

    if (!context) {
        throw new TypeError(
            "Un contexte de résolution est requis."
        );
    }

    return {
        attribute:
            getActorAttributeValue(
                actor,
                context.attribute
            ),

        skill:
            getActorSkillValue(
                actor,
                context.skill
            ),

        stress:
            getActorStressDice(
                actor
            )
    };
}