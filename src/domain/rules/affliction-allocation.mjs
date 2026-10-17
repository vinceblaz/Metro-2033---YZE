/**
 * Répartition des afflictions d'un jet (livre p.177, 190, 199).
 *
 * Logique PURE (aucune dépendance à Foundry) utilisée par la
 * fenêtre de répartition et par le service d'orchestration :
 *
 * - calcul du nombre d'afflictions réellement à répartir ;
 * - autorisation de l'affliction d'équipement ;
 * - répartition par défaut (tout en dégâts d'attribut) ;
 * - validation d'un brouillon de répartition ;
 * - texte français du résumé posté dans le chat.
 *
 * La résolution effective sur l'Actor reste dans
 * domain/rules/afflictions.mjs (resolveAfflictions).
 */


export const AFFLICTION_TARGET_KEYS =
    Object.freeze([
        "attribute",
        "composure",
        "equipment",
        "stress"
    ]);


function toNonNegativeInteger(
    value
) {

    const number =
        Number(value);

    return (
        Number.isInteger(number)
        && number > 0
    )
        ? number
        : 0;

}


/**
 * Nombre d'afflictions à répartir :
 * max(0, total - ignorées par un Talent).
 */
export function computeAvailableAfflictions({
    total = 0,
    ignored = 0
} = {}) {

    return Math.max(
        0,
        toNonNegativeInteger(total)
        - toNonNegativeInteger(ignored)
    );

}


/**
 * L'équipement ne peut être abîmé que sur un jet FORCÉ, si un
 * dé d'équipement a été lancé et si l'équipement est
 * identifiable (mêmes conditions que resolveAfflictions).
 */
export function isEquipmentAfflictionAllowed(
    result
) {

    if (!result) {
        return false;
    }

    return (
        Number(result.pushCount ?? 0) > 0
        && Number(result.pool?.equipment ?? 0) > 0
        && Boolean(result.context?.equipment?.itemId)
    );

}


/**
 * Répartition par défaut : tout en dégâts d'attribut.
 */
export function getDefaultAllocation(
    available
) {

    return {
        attribute:
            toNonNegativeInteger(available),
        composure: 0,
        stress: 0,
        equipment: 0
    };

}


/**
 * Valeur de champ -> entier >= 0, ou null si invalide.
 * Champ absent ou vide = 0.
 */
function parseField(
    raw
) {

    if (
        raw === undefined
        || raw === null
        || String(raw).trim() === ""
    ) {
        return 0;
    }

    const number =
        Number(raw);

    if (
        !Number.isInteger(number)
        || number < 0
    ) {
        return null;
    }

    return number;

}


/**
 * Valide un brouillon de répartition (jamais d'exception).
 *
 * Retourne { valid, allocation, allocated, remaining, errors }.
 * remaining = available - allocated (négatif si excès).
 */
export function validateAllocationDraft({
    available = 0,
    draft = {},
    equipmentAllowed = false
} = {}) {

    const errors = [];

    const allocation = {
        attribute: 0,
        composure: 0,
        stress: 0,
        equipment: 0
    };

    for (const key of AFFLICTION_TARGET_KEYS) {

        const value =
            parseField(draft?.[key]);

        if (value === null) {

            errors.push(
                `La valeur « ${key} » doit être un entier positif ou nul.`
            );

            continue;

        }

        allocation[key] = value;

    }


    if (
        allocation.equipment > 0
        && !equipmentAllowed
    ) {

        errors.push(
            "L'équipement ne peut pas être abîmé sur ce jet."
        );

    }

    if (allocation.equipment > 1) {

        errors.push(
            "Une seule affliction peut être appliquée à l'équipement."
        );

    }


    const allocated =
        allocation.attribute
        + allocation.composure
        + allocation.stress
        + allocation.equipment;

    const target =
        toNonNegativeInteger(available);

    const remaining =
        target - allocated;

    if (remaining !== 0) {

        errors.push(
            `Répartition incomplète ou excessive : ${allocated} / ${target}.`
        );

    }


    return {
        valid: errors.length === 0,
        allocation,
        allocated,
        remaining,
        errors
    };

}


function plural(
    count,
    singular,
    pluralForm
) {

    return count > 1
        ? pluralForm
        : singular;

}


/**
 * Lignes françaises du résumé à partir de la `resolution`
 * renvoyée par resolveAfflictions.
 *
 * options (facultatives, fournies par l'appelant) :
 * - attributeLabel     : libellé français de l'attribut ;
 * - attributeAfter     : valeur de l'attribut après application ;
 * - attributeRequested : dégâts demandés (si > appliqués,
 *                        l'attribut était déjà trop bas) ;
 * - composureRequested : points de Sang-froid demandés.
 *
 * L'état « Brisé » lui-même est posé par un hook sur la valeur
 * de Sang-froid : ici on ne fait que le MENTIONNER.
 */
export function describeResolution(
    resolution,
    {
        attributeLabel = null,
        attributeAfter = null,
        attributeRequested = null,
        composureRequested = null
    } = {}
) {

    if (!resolution) {
        return [];
    }

    const lines = [];


    // ---- Attribut ------------------------------------------------

    const attributeApplied =
        toNonNegativeInteger(
            resolution.attribute?.applied
        );

    const attributeAsked =
        toNonNegativeInteger(
            attributeRequested
        );

    if (
        attributeApplied > 0
        || attributeAsked > 0
    ) {

        const label =
            attributeLabel
            ?? resolution.attribute?.id
            ?? "attribut";

        let line =
            `Dégâts à ${label} : −${attributeApplied}`;

        if (
            Number.isFinite(Number(attributeAfter))
            && attributeAfter !== null
        ) {

            const after =
                Number(attributeAfter);

            line +=
                ` (${after + attributeApplied} → ${after})`;

        }

        if (attributeAsked > attributeApplied) {

            line +=
                ` — ${attributeAsked} demandé${attributeAsked > 1 ? "s" : ""}, `
                + `${attributeApplied} appliqué${attributeApplied > 1 ? "s" : ""} `
                + "(attribut déjà épuisé)";

        }

        lines.push(line);

    }


    // ---- Sang-froid ----------------------------------------------

    const composureApplied =
        toNonNegativeInteger(
            resolution.composure?.applied
        );

    const composureAsked =
        toNonNegativeInteger(
            composureRequested
        );

    if (
        composureApplied > 0
        || composureAsked > 0
        || resolution.composure?.reachedBreakingPoint === true
    ) {

        let line =
            `Sang-froid : +${composureApplied}`;

        if (composureAsked > composureApplied) {

            line +=
                ` (${composureAsked} demandé${composureAsked > 1 ? "s" : ""}, `
                + "jauge pleine)";

        }

        if (resolution.composure?.reachedBreakingPoint === true) {

            line +=
                " — limite atteinte : Brisé";

        }

        lines.push(line);

    }


    // ---- Stress --------------------------------------------------

    const stressRequested =
        toNonNegativeInteger(
            resolution.stress?.requested
        );

    const stressAdded =
        toNonNegativeInteger(
            resolution.stress?.added
        );

    if (
        stressRequested > 0
        || stressAdded > 0
    ) {

        let line =
            `Stress : +${stressAdded} ${plural(stressAdded, "dé", "dés")} de Stress`;

        if (resolution.stress?.limitExceeded === true) {

            line +=
                " — limite de dés de Stress dépassée";

        }

        lines.push(line);

    }


    // ---- Équipement ----------------------------------------------

    const equipment =
        resolution.equipment;

    if (equipment?.applied === true) {

        const name =
            equipment.itemName
            ?? "Équipement";

        if (equipment.prevented === true) {

            lines.push(
                `${name} : protégé par sa Fiabilité (aucun dégât)`
            );

        }
        else if (equipment.damage?.broken === true) {

            lines.push(
                `${name} : hors d'usage`
            );

        }
        else {

            const damage =
                equipment.damage;

            let detail = "";

            if (
                damage
                && Number.isFinite(Number(damage.previous))
                && Number.isFinite(Number(damage.current))
            ) {

                detail =
                    ` (bonus ${damage.previous} → ${damage.current})`;

            }

            lines.push(
                `${name} : abîmé${detail}`
            );

        }

    }


    return lines;

}


/* ============================================================
 * LIBELLÉS
 * ============================================================ */


const ATTRIBUTE_LABELS =
    Object.freeze({
        vigor: "Vigueur",
        agility: "Agilité",
        spirit: "Esprit",
        empathy: "Empathie"
    });


export function getAttributeLabel(
    attributeId
) {

    if (!attributeId) {
        return "attribut";
    }

    return ATTRIBUTE_LABELS[attributeId]
        ?? String(attributeId);

}


/* ============================================================
 * IDEMPOTENCE
 *
 * Liste de clés de jets dont les afflictions ont déjà été
 * (ou sont en cours d'être) réparties. Stockée dans un flag de
 * l'Actor concerné (cf. afflictions-service.mjs).
 * ============================================================ */


export const RESOLVED_ROLL_KEYS_MAX = 200;


export function hasResolvedRollKey(
    keys,
    key
) {

    return (
        Array.isArray(keys)
        && typeof key === "string"
        && key.length > 0
        && keys.includes(key)
    );

}


export function markResolvedRollKey(
    keys,
    key,
    {
        max = RESOLVED_ROLL_KEYS_MAX
    } = {}
) {

    const current =
        Array.isArray(keys)
            ? keys
            : [];

    if (hasResolvedRollKey(current, key)) {
        return [...current];
    }

    return [
        ...current,
        key
    ].slice(-max);

}


/* ============================================================
 * ADAPTATION DU CONTEXTE D'UNE ATTAQUE DE MÊLÉE
 *
 * Le jet d'attaque de mêlée (Actor.rollMeleeAttack) range
 * l'attribut sous `context.attributeId` (toujours « vigor ») et
 * décrit l'arme dans `context.weapon` (l'arme fournit les dés
 * d'équipement), alors que la résolution des afflictions lit
 * `context.attribute` et `context.equipment.itemId`. On relie
 * ces champs EXISTANTS, sans rien inventer.
 * ============================================================ */


export function adaptMeleeAttackContext({
    context,
    equipmentDice = 0
} = {}) {

    const source =
        context
        && typeof context === "object"
            ? context
            : {};

    const adapted = {
        ...source
    };

    if (
        !adapted.attribute
        && adapted.attributeId
    ) {

        adapted.attribute =
            adapted.attributeId;

    }

    if (
        !adapted.equipment
        && Number(equipmentDice) > 0
        && source.weapon?.id
    ) {

        adapted.equipment = {
            itemId:
                source.weapon.id,
            itemUuid:
                source.weapon.uuid
                ?? null,
            itemName:
                source.weapon.name
                ?? null,
            itemType:
                "weapon"
        };

    }

    return adapted;

}
