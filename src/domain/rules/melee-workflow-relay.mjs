/**
 * Relais joueur → MJ des écritures d'un workflow de mêlée.
 *
 * Contexte : le workflow de mêlée est stocké dans un flag du
 * Combat, qu'un joueur ne peut pas modifier. Quand le PNJ attaque
 * un PJ, c'est pourtant le joueur propriétaire du PJ qui décide de
 * la défense (Bloquer / Encaisser), prépare et lance son blocage
 * et répartit ses éclats de blocage. Le MJ actif applique donc
 * ces écritures APRÈS validation par ce module (pur, sans Foundry).
 *
 * Périmètre (décision du porteur du projet) : uniquement les trois
 * étapes du DÉFENSEUR. Tout le reste (attaque, éclats, dommages,
 * Protection, application) reste réservé au MJ ou au propriétaire
 * de l'attaquant et est refusé ici.
 *
 * Limite assumée : les valeurs de dés sont tirées sur le client du
 * joueur et ne peuvent pas être vérifiées par le MJ (comme pour les
 * autres relais) ; le relais interdit en revanche toute écriture
 * hors périmètre, toute transition d'état imprévue et toute
 * incohérence réussites / état.
 */

export const MELEE_WORKFLOW_RELAY_MESSAGE_TYPES =
    Object.freeze({
        SAVE_REQUEST: "melee-workflow-save-request",
        SAVE_RESULT: "melee-workflow-save-result",
        REFRESH_REQUEST: "melee-message-refresh-request",
        REFRESH_RESULT: "melee-message-refresh-result"
    });

const MAX_BLOCK_RESULT_JSON_LENGTH = 20000;

// Sections qui doivent rester strictement identiques.
const FROZEN_KEYS = Object.freeze([
    "id",
    "type",
    "attacker",
    "defender",
    "weaponId",
    "attack",
    "stunts",
    "consequences",
    "protection",
    "application",
    "metadata"
]);

const ALL_KNOWN_KEYS = Object.freeze([
    ...FROZEN_KEYS,
    "state",
    "defense",
    "blockStunts"
]);

const S = Object.freeze({
    AWAITING_DEFENSE: "awaiting-defense",
    BLOCK_PREPARATION: "block-preparation",
    AWAITING_BLOCK_STUNTS: "awaiting-block-stunts",
    ATTACK_PREPARATION: "attack-preparation"
});


export function deepEqual(a, b) {

    if (a === b) {
        return true;
    }

    if (
        a === null
        || b === null
        || typeof a !== "object"
        || typeof b !== "object"
    ) {
        return false;
    }

    if (Array.isArray(a) !== Array.isArray(b)) {
        return false;
    }

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) {
        return false;
    }

    return keysA.every(
        key =>
            Object.hasOwn(b, key)
            && deepEqual(a[key], b[key])
    );

}


function isPlainObject(value) {

    return (
        value !== null
        && typeof value === "object"
        && !Array.isArray(value)
    );

}


function refuse(reason) {

    return { ok: false, reason };

}


function jsonLength(value) {

    try {
        return JSON.stringify(value ?? null).length;
    }
    catch {
        return Infinity;
    }

}


function blockSuccesses(result) {

    return result?.rolled === true
        ? Number(result.roll?.successes ?? 0)
        : 0;

}


/**
 * @param {object} params
 * @param {object|null} params.stored   Workflow actuellement stocké.
 * @param {object} params.incoming      Workflow proposé par le joueur.
 * @param {boolean} params.requesterOwnsDefender
 * @returns {{ok: true, workflow: object}|{ok: false, reason: string}}
 */
export function validateRelayedWorkflowSave({
    stored,
    incoming,
    requesterOwnsDefender
} = {}) {

    if (requesterOwnsDefender !== true) {
        return refuse(
            "Seul le propriétaire du défenseur peut effectuer cette étape."
        );
    }

    if (!isPlainObject(stored)) {
        return refuse(
            "Workflow de mêlée introuvable : un joueur ne peut pas en créer."
        );
    }

    if (!isPlainObject(incoming)) {
        return refuse("Workflow de mêlée invalide.");
    }

    // Aucune clé inconnue.
    for (const key of Object.keys(incoming)) {
        if (!ALL_KNOWN_KEYS.includes(key)) {
            return refuse(`Champ non autorisé : ${key}.`);
        }
    }

    for (const key of FROZEN_KEYS) {
        if (!deepEqual(stored[key], incoming[key])) {
            return refuse(
                `Le champ « ${key} » n'est pas modifiable par le défenseur.`
            );
        }
    }

    const from = stored.state;
    const to = incoming.state;

    const sd = stored.defense ?? {};
    const id = incoming.defense ?? {};

    if (
        !isPlainObject(incoming.defense)
        || !isPlainObject(incoming.blockStunts)
        || sd.offered !== id.offered
    ) {
        return refuse("Section de défense invalide.");
    }

    const sameBlockStunts =
        deepEqual(stored.blockStunts, incoming.blockStunts);

    // --- Décision de défense --------------------------------------
    if (from === S.AWAITING_DEFENSE) {

        if (
            sd.offered !== true
            || !sameBlockStunts
            || id.result !== null
        ) {
            return refuse("Décision de défense refusée.");
        }

        if (
            to === S.BLOCK_PREPARATION
            && id.decision === "block"
        ) {
            return { ok: true, workflow: incoming };
        }

        if (
            to === S.ATTACK_PREPARATION
            && id.decision === "decline"
        ) {
            return { ok: true, workflow: incoming };
        }

        return refuse("Décision de défense incohérente.");

    }

    // --- Préparation du blocage -----------------------------------
    if (from === S.BLOCK_PREPARATION) {

        if (!sameBlockStunts) {
            return refuse("Éclats de blocage non modifiables à ce stade.");
        }

        // Annulation.
        if (to === S.AWAITING_DEFENSE) {

            return (
                id.decision === null
                && id.result === null
            )
                ? { ok: true, workflow: incoming }
                : refuse("Annulation du blocage incohérente.");

        }

        // Résultat du jet de blocage.
        if (
            (
                to === S.AWAITING_BLOCK_STUNTS
                || to === S.ATTACK_PREPARATION
            )
            && id.decision === "block"
            && sd.decision === "block"
            && isPlainObject(id.result)
        ) {

            if (
                jsonLength(id.result)
                > MAX_BLOCK_RESULT_JSON_LENGTH
            ) {
                return refuse("Résultat de blocage trop volumineux.");
            }

            const expected =
                blockSuccesses(id.result) > 0
                    ? S.AWAITING_BLOCK_STUNTS
                    : S.ATTACK_PREPARATION;

            return to === expected
                ? { ok: true, workflow: incoming }
                : refuse("État incohérent avec les réussites du blocage.");

        }

        return refuse("Résolution du blocage refusée.");

    }

    // --- Éclats de blocage ----------------------------------------
    if (from === S.AWAITING_BLOCK_STUNTS) {

        if (
            to !== S.ATTACK_PREPARATION
            || !deepEqual(sd, id)
            || !isPlainObject(incoming.blockStunts.result)
        ) {
            return refuse("Éclats de blocage refusés.");
        }

        if (
            jsonLength(incoming.blockStunts.result)
            > MAX_BLOCK_RESULT_JSON_LENGTH
        ) {
            return refuse("Éclats de blocage trop volumineux.");
        }

        return { ok: true, workflow: incoming };

    }

    return refuse(
        "Cette étape n'est pas réalisable par le défenseur."
    );

}
