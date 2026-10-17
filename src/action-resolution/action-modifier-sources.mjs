/**
 * Collecte des sources métier applicables
 * à la préparation d'une résolution d'action.
 *
 * Cette couche transforme les Items possédés
 * par un Actor en sources normalisées destinées
 * à ActionModifierService.
 *
 * Responsabilités :
 *
 * - détecter les armes compatibles avec le test ;
 * - détecter les équipements compatibles avec le test ;
 * - normaliser ces sources ;
 * - verrouiller l'arme imposée par le contexte ;
 * - ne proposer que des bonus actuellement utilisables.
 *
 * Cette couche :
 *
 * - ne lance aucun jet ;
 * - ne consomme aucune action ;
 * - ne modifie aucun Document ;
 * - ne dépend pas de l'interface graphique ;
 * - ne décide pas des règles propres aux talents.
 */


import {
    ACTION_MODIFIER_SOURCES,
    createActionSource
} from "./action-modifier-service.mjs";

import {
    isAttackResolution
} from "../domain/rules/action-resolution-context.mjs";




/* ============================================================
 * UTILITAIRES
 * ============================================================ */


/**
 * Retourne une collection exploitable.
 */
function normalizeCollection(
    collection
) {

    if (
        collection == null
    ) {

        return [];

    }


    if (
        Array.isArray(
            collection
        )
    ) {

        return collection;

    }


    /*
     * EmbeddedCollection Foundry.
     */
    if (
        typeof collection.values
            === "function"
    ) {

        return [
            ...collection.values()
        ];

    }


    /*
     * Collection itérable générique.
     */
    if (
        typeof collection[
            Symbol.iterator
        ] === "function"
    ) {

        return [
            ...collection
        ];

    }


    return [];

}


/**
 * Normalise une valeur numérique.
 */
function normalizeNumber(
    value
) {

    const number =
        Number(
            value
        );


    return Number.isFinite(
        number
    )
        ? number
        : 0;

}


/**
 * Retourne l'identifiant stable d'un Document.
 */
function getDocumentId(
    document
) {

    return (
        document?.id
        ?? document?._id
        ?? null
    );

}


/**
 * Retourne le nom lisible d'un Document.
 */
function getDocumentName(
    document
) {

    const name =
        document?.name;


    return (
        typeof name === "string"
        && name.trim().length > 0
    )
        ? name.trim()
        : "Source sans nom";

}


/**
 * Retourne le type Foundry d'un Item.
 */
function getItemType(
    item
) {

    return (
        typeof item?.type === "string"
            ? item.type
            : null
    );

}


/**
 * Retourne le système métier d'un Item.
 */
function getItemSystem(
    item
) {

    return (
        item?.system
        ?? null
    );

}


/* ============================================================
 * CONTEXTE DU TEST
 * ============================================================ */


/**
 * Retourne l'identifiant d'attribut
 * actuellement testé.
 */
function getContextAttributeId(
    context
) {

    const attribute =
        context?.attribute;


    return (
        typeof attribute === "string"
        && attribute.length > 0
    )
        ? attribute
        : null;

}


/**
 * Retourne l'identifiant de compétence
 * actuellement testé.
 */
function getContextSkillId(
    context
) {

    const skill =
        context?.skill;


    return (
        typeof skill === "string"
        && skill.length > 0
    )
        ? skill
        : null;

}


/* ============================================================
 * BONUS UTILISABLE
 * ============================================================ */


/**
 * Retourne le bonus actuellement utilisable
 * d'une source Item.
 *
 * Règle métier :
 *
 * - weapon :
 *   l'arme doit respecter ses règles
 *   d'utilisation, notamment être équipée ;
 *
 * - equipment :
 *   sa présence dans l'inventaire suffit.
 *   Le flag equipped ne conditionne PAS
 *   la proposition de son bonus.
 */
function getUsableItemBonus(
    item
) {

    const itemType =
        getItemType(
            item
        );


    if (
        itemType === "weapon"
    ) {

        /*
        * Une arme ne peut jamais être proposée
        * comme source si elle n'est pas équipée.
        *
        * Cette règle vaut aussi lorsque l'arme
        * est seulement optionnelle :
        *
        * - blocage ;
        * - jet de Compétence ;
        * - jet d'Attribut.
        */
        if (
            item?.system?.equipped
                !== true
        ) {

            return 0;

        }


        return normalizeNumber(
            item?.system
                ?.usableEquipmentBonus
        );

    }


    if (
        itemType === "equipment"
    ) {

        return normalizeNumber(
            item?.system
                ?.bonus
                ?.current
        );

    }


    return 0;

}


/* ============================================================
 * IDENTIFIANTS MÉTIER
 * ============================================================ */


/**
 * Identifiant de compétence auquel
 * l'Item peut contribuer.
 *
 * WeaponDataModel et EquipmentDataModel
 * exposent skillId.
 */
function getItemSkillId(
    item
) {

    const skillId =
        item?.system
            ?.skillId;


    return (
        typeof skillId === "string"
        && skillId.length > 0
    )
        ? skillId
        : null;

}


/**
 * Identifiant d'attribut auquel
 * l'Item peut contribuer.
 *
 * EquipmentDataModel expose attributeId.
 * Une arme retourne normalement null.
 */
function getItemAttributeId(
    item
) {

    const attributeId =
        item?.system
            ?.attributeId;


    return (
        typeof attributeId === "string"
        && attributeId.length > 0
    )
        ? attributeId
        : null;

}


/* ============================================================
 * CORRESPONDANCE AVEC LE TEST
 * ============================================================ */


/**
 * Détermine pourquoi un Item est compatible
 * avec le test courant.
 *
 * Priorité :
 *
 * 1. compétence ;
 * 2. attribut.
 *
 * Un Item configuré pour les deux peut donc
 * rester une source unique.
 */
function resolveItemApplication(
    item,
    context
) {

    const contextSkillId =
        getContextSkillId(
            context
        );


    const contextAttributeId =
        getContextAttributeId(
            context
        );


    const itemSkillId =
        getItemSkillId(
            item
        );


    const itemAttributeId =
        getItemAttributeId(
            item
        );


    if (
        contextSkillId
        && itemSkillId
        && contextSkillId
            === itemSkillId
    ) {

        return "skill";

    }


    if (
        contextAttributeId
        && itemAttributeId
        && contextAttributeId
            === itemAttributeId
    ) {

        return "attribute";

    }


    return null;

}


/* ============================================================
 * ARME IMPOSÉE PAR LE CONTEXTE
 * ============================================================ */


/**
 * Retourne l'identifiant de l'arme explicitement
 * utilisée par la résolution.
 *
 * ActionResolutionContext peut contenir
 * une représentation normalisée de l'arme.
 *
 * Plusieurs formes d'identifiant sont tolérées
 * pendant la migration afin de ne pas coupler
 * ce service à une seule représentation.
 */
function getContextWeaponId(
    context
) {

    return (
        context?.weapon?.id
        ?? context?.weapon?._id
        ?? context?.weapon?.itemId
        ?? context?.weapon?.documentId
        ?? null
    );

}


/**
 * Détermine si l'Item est l'arme explicitement
 * imposée par le contexte.
 */
function isContextWeapon(
    item,
    context
) {

    const contextWeaponId =
        getContextWeaponId(
            context
        );


    const itemId =
        getDocumentId(
            item
        );


    if (
        !contextWeaponId
        || !itemId
    ) {

        return false;

    }


    return (
        contextWeaponId
        === itemId
    );

}


/* ============================================================
 * CRÉATION D'UNE SOURCE ITEM
 * ============================================================ */


/**
 * Transforme une arme ou un équipement
 * en ActionSource normalisée.
 */
/**
 * Transforme une arme ou un équipement
 * en ActionSource normalisée.
 */
function createItemActionSource(
    item,
    context
) {

    const itemType =
        getItemType(
            item
        );


    const type =
        (
            itemType === "weapon"
                ? ACTION_MODIFIER_SOURCES
                    .WEAPON

                : itemType === "equipment"
                    ? ACTION_MODIFIER_SOURCES
                        .EQUIPMENT

                    : null
        );


    if (!type) {

        return null;

    }


    const contextWeapon =
        (
            type
                === ACTION_MODIFIER_SOURCES
                    .WEAPON

            && isContextWeapon(
                item,
                context
            )
        );


    /*
     * Seule l'arme explicitement utilisée
     * pour une ATTAQUE est imposée.
     *
     * Cela concerne :
     *
     * - attaque de mêlée ;
     * - attaque à distance.
     *
     * Pour :
     *
     * - blocage ;
     * - jet d'Attribut ;
     * - jet de Compétence ;
     *
     * une arme reste toujours optionnelle.
     */
    const mandatoryAttackWeapon =
        (
            contextWeapon
            && isAttackResolution(
                context
            )
        );


    const bonus =
        getUsableItemBonus(
            item
        );


    /*
     * Les sources optionnelles avec un bonus
     * nul ou inutilisable ne sont pas proposées.
     *
     * Exception :
     *
     * l'arme imposée par une attaque reste
     * visible même si son bonus actuel vaut 0.
     *
     * Cela permet à la fenêtre de préparation
     * de toujours représenter explicitement
     * l'arme utilisée par l'attaque.
     */
    if (
        bonus <= 0
        && !mandatoryAttackWeapon
    ) {

        return null;

    }


    const appliesTo =
        resolveItemApplication(
            item,
            context
        );


    if (!appliesTo) {

        return null;

    }


    const itemId =
        getDocumentId(
            item
        );


    if (!itemId) {

        return null;

    }


    return createActionSource({

        id:
            `${type}:${itemId}`,

        label:
            getDocumentName(
                item
            ),

        type,

        bonus,

        appliesTo,

        /*
         * L'arme d'une attaque est :
         *
         * - sélectionnée ;
         * - verrouillée.
         *
         * Toutes les autres sources restent
         * optionnelles.
         */
        selected:
            mandatoryAttackWeapon,

        locked:
            mandatoryAttackWeapon,

        /*
         * Référence au Document précis.
         *
         * Elle ne sert pas à définir
         * la compatibilité métier.
         */
        reference:
            item.uuid
            ?? itemId,

        metadata: {

            itemId,

            itemType,

            skillId:
                getItemSkillId(
                    item
                ),

            attributeId:
                getItemAttributeId(
                    item
                ),

            contextWeapon,

            mandatoryAttackWeapon

        }

    });

}


/* ============================================================
 * COLLECTE DES ARMES
 * ============================================================ */


/**
 * Retourne les armes utilisables
 * et compatibles avec le test.
 */
export function collectWeaponActionSources(
    actor,
    context
) {

    const items =
        normalizeCollection(
            actor?.items
        );


    const sources = [];


    for (
        const item
        of items
    ) {

        if (
            getItemType(
                item
            )
            !== "weapon"
        ) {

            continue;

        }


        const source =
            createItemActionSource(
                item,
                context
            );


        if (source) {

            sources.push(
                source
            );

        }

    }


    return sources;

}


/* ============================================================
 * COLLECTE DES ÉQUIPEMENTS
 * ============================================================ */


/**
 * Retourne les équipements utilisables
 * et compatibles avec le test.
 */
export function collectEquipmentActionSources(
    actor,
    context
) {

    const items =
        normalizeCollection(
            actor?.items
        );


    const sources = [];


    for (
        const item
        of items
    ) {

        if (
            getItemType(
                item
            )
            !== "equipment"
        ) {

            continue;

        }


        const source =
            createItemActionSource(
                item,
                context
            );


        if (source) {

            sources.push(
                source
            );

        }

    }


    return sources;

}


/* ============================================================
 * COLLECTE GLOBALE
 * ============================================================ */


/**
 * Collecte toutes les sources Item
 * applicables à une résolution.
 *
 * Pour cette première version :
 *
 * - weapon ;
 * - equipment.
 *
 * Les talents ne sont volontairement
 * PAS transformés ici.
 *
 * Leur bonus dépend de règles métier
 * spécifiques évaluées dans talents.mjs
 * puis intégrées par ActionModifierService.
 */
export function collectActionSources(
    actor,
    context
) {

    return [

        ...collectWeaponActionSources(
            actor,
            context
        ),

        ...collectEquipmentActionSources(
            actor,
            context
        )

    ];

}