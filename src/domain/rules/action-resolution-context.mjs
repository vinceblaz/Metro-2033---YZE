/**
 * Contexte normalisé d'une action nécessitant
 * une résolution de règles.
 *
 * Aucune dépendance à Foundry.
 */


/* ============================================================
 * TYPES D'ACTIONS
 * ============================================================ */


export const ACTION_RESOLUTION_TYPES =
    Object.freeze({

        ATTRIBUTE_ROLL:
            "attribute-roll",

        SKILL_ROLL:
            "skill-roll",

        MELEE_ATTACK:
            "melee-attack",

        MELEE_BLOCK:
            "melee-block",

        RANGED_ATTACK:
            "ranged-attack"

    });


/* ============================================================
 * UTILITAIRES
 * ============================================================ */


export function isActionResolutionType(
    actionType
) {

    return Object.values(
        ACTION_RESOLUTION_TYPES
    ).includes(
        actionType
    );

}


function normalizeOptionalString(
    value
) {

    if (
        value === null
        || value === undefined
    ) {

        return null;

    }


    const normalized =
        String(value).trim();


    return normalized.length > 0
        ? normalized
        : null;

}


function normalizeWeapon(
    weapon
) {

    if (!weapon) {

        return null;

    }


    return {

        id:
            normalizeOptionalString(
                weapon.id
            ),

        name:
            normalizeOptionalString(
                weapon.name
            ),

        category:
            normalizeOptionalString(
                weapon.category
            ),

        type:
            normalizeOptionalString(
                weapon.type
            ),

        isFirearm:
            weapon.isFirearm === true,

        isHeavyWeapon:
            weapon.isHeavyWeapon === true,

        isMeleeWeapon:
            weapon.isMeleeWeapon === true,

        isRangedWeapon:
            weapon.isRangedWeapon === true

    };

}


function normalizeFacts(
    facts
) {

    if (
        facts === null
        || facts === undefined
    ) {

        return {};

    }


    if (
        typeof facts !== "object"
        || Array.isArray(facts)
    ) {

        throw new TypeError(
            "Les faits du contexte doivent être un objet."
        );

    }


    return {
        ...facts
    };

}

/**
 * Une résolution est-elle un jet d'Attribut ?
 */
export function isAttributeResolution(
    context
) {

    return (
        context?.actionType
            === ACTION_RESOLUTION_TYPES
                .ATTRIBUTE_ROLL
    );

}


/**
 * Une résolution est-elle un jet de Compétence ?
 */
export function isSkillResolution(
    context
) {

    return (
        context?.actionType
            === ACTION_RESOLUTION_TYPES
                .SKILL_ROLL
    );

}

/* ============================================================
 * CRÉATION DU CONTEXTE
 * ============================================================ */


/**
 * Crée le contexte normalisé d'une résolution.
 *
 * Exemple :
 *
 * createActionResolutionContext({
 *     actionType: "melee-attack",
 *     actorId: "...",
 *     opponentId: "...",
 *     attribute: "vigor",
 *     skill: "closeCombat",
 *     weapon: {
 *         id: "...",
 *         name: "Couteau",
 *         category: "knife",
 *         type: "melee",
 *         isMeleeWeapon: true
 *     },
 *     facts: {
 *         night: true
 *     }
 * });
 */
export function createActionResolutionContext({
    actionType,

    actorId = null,
    opponentId = null,

    attribute = null,
    skill = null,

    weapon = null,

    facts = {},

    metadata = {}
} = {}) {

    if (
        !isActionResolutionType(
            actionType
        )
    ) {

        throw new TypeError(
            `Type de résolution d'action inconnu : ${actionType}.`
        );

    }


    if (
        metadata === null
        || typeof metadata !== "object"
        || Array.isArray(metadata)
    ) {

        throw new TypeError(
            "Les métadonnées du contexte doivent être un objet."
        );

    }


    return {

        actionType,

        actorId:
            normalizeOptionalString(
                actorId
            ),

        opponentId:
            normalizeOptionalString(
                opponentId
            ),

        attribute:
            normalizeOptionalString(
                attribute
            ),

        skill:
            normalizeOptionalString(
                skill
            ),

        weapon:
            normalizeWeapon(
                weapon
            ),

        facts:
            normalizeFacts(
                facts
            ),

        metadata: {
            ...metadata
        }

    };

}


/* ============================================================
 * INTERROGATION
 * ============================================================ */


/**
 * Une résolution est-elle une attaque ?
 */
export function isAttackResolution(
    context
) {

    return (
        context?.actionType
            === ACTION_RESOLUTION_TYPES
                .MELEE_ATTACK

        || context?.actionType
            === ACTION_RESOLUTION_TYPES
                .RANGED_ATTACK
    );

}


/**
 * Une résolution concerne-t-elle la mêlée ?
 *
 * Cela inclut :
 * - l'attaque de mêlée ;
 * - le blocage.
 */
export function isMeleeResolution(
    context
) {

    return (
        context?.actionType
            === ACTION_RESOLUTION_TYPES
                .MELEE_ATTACK

        || context?.actionType
            === ACTION_RESOLUTION_TYPES
                .MELEE_BLOCK
    );

}


/**
 * Une résolution concerne-t-elle une
 * attaque à distance ?
 */
export function isRangedResolution(
    context
) {

    return (
        context?.actionType
            === ACTION_RESOLUTION_TYPES
                .RANGED_ATTACK
    );

}


/**
 * Retourne un fait circonstanciel.
 *
 * Important :
 *
 * undefined = le système ne possède aucune
 * information sur cette circonstance.
 *
 * true      = condition vérifiée.
 * false     = condition explicitement absente.
 *
 * Cette distinction sera importante pour
 * les talents conditionnels.
 */
export function getActionContextFact(
    context,
    factId
) {

    if (
        !context?.facts
        || typeof factId !== "string"
    ) {

        return undefined;

    }


    return context.facts[
        factId
    ];

}


/**
 * Le système sait-il déterminer
 * cette circonstance ?
 *
 * Une valeur false est bien une information
 * connue, elle ne doit donc pas être confondue
 * avec undefined.
 */
export function hasActionContextFact(
    context,
    factId
) {

    return (
        context?.facts
        && Object.hasOwn(
            context.facts,
            factId
        )
    );

}


/**
 * La circonstance est-elle explicitement vraie ?
 */
export function isActionContextFactTrue(
    context,
    factId
) {

    return (
        getActionContextFact(
            context,
            factId
        )
        === true
    );

}