/**
 * Relais de mise à jour de ChatMessage via un MJ actif.
 *
 * Contexte : Foundry n'autorise un joueur à modifier que les
 * ChatMessage dont il est l'auteur. Les cartes « en attente »
 * (Coup de grâce...) sont créées par le MJ mais doivent être
 * résolues par le joueur propriétaire du personnage : la mise à
 * jour du message est donc confiée à un MJ via le socket du
 * système.
 *
 * Ce module est PUR (aucune dépendance à Foundry) : choix
 * direct/relais, validation stricte de la charge reçue par le MJ
 * (table de règles par flag : Coup de grâce, Terreur, Poison,
 * Maladie, Asphyxie),
 * suivi des requêtes en attente (timers injectés). La couche
 * Foundry est dans foundry/chat/gm-message-relay.mjs.
 */

import {
    resolveTerrorOutcome
} from "./terror.mjs";

import {
    resolvePoisonOpposition,
    resolveBladePoisonOpposition
} from "./poison.mjs";

import {
    resolveIllnessOpposition
} from "./illness.mjs";

import {
    resolveAsphyxiationOutcome
} from "./asphyxiation.mjs";

import {
    resolveFireOutcome
} from "./fire.mjs";


export const GM_RELAY_SYSTEM_ID =
    "metro-2033-yze";

export const GM_RELAY_SOCKET =
    `system.${GM_RELAY_SYSTEM_ID}`;

export const GM_RELAY_MESSAGE_TYPES =
    Object.freeze({
        UPDATE_REQUEST: "chat-message-update-request",
        UPDATE_RESULT: "chat-message-update-result"
    });


export const GM_RELAY_TIMEOUT_MS = 10000;

export const GM_RELAY_ERRORS =
    Object.freeze({
        NO_ACTIVE_GM:
            "Aucun MJ actif : la carte ne peut pas être mise à jour. "
            + "Demandez au MJ de se connecter puis réessayez.",
        TIMEOUT:
            "Le MJ actif n'a pas répondu à temps. Réessayez.",
        INVALID:
            "Mise à jour de message refusée."
    });

const MAX_CONTENT_LENGTH = 20000;
const MAX_ROLLS = 10;


/**
 * « direct » si l'utilisateur peut modifier le message lui-même
 * (auteur ou MJ), « relay » sinon.
 */
export function chooseUpdateRoute({
    isGM,
    canModify
} = {}) {

    return (
        isGM === true || canModify === true
            ? "direct"
            : "relay"
    );

}


function isPlainObject(
    value
) {

    return (
        value !== null
        && typeof value === "object"
        && !Array.isArray(value)
    );

}


/**
 * Nom complet de la clé de flag mise à jour pour un flag donné.
 */
export function relayFlagUpdateKey(
    flagName
) {

    return `flags.${GM_RELAY_SYSTEM_ID}.${flagName}`;

}


// ---------------------------------------------------------------
// Règles de validation PROPRES À CHAQUE FLAG
// ---------------------------------------------------------------
//
// Chaque flux a sa règle : champs d'identité IMMUABLES, champs
// admis dans le nouveau flag, transitions d'état valides. Rien
// n'est déduit du contenu fourni par le joueur quand il peut être
// recalculé (résultats dérivés des réussites, rendu HTML côté MJ).
//
// Limite assumée : les valeurs de dés elles-mêmes sont tirées sur
// le client du joueur et ne peuvent pas être vérifiées par le MJ ;
// le relais interdit en revanche toute incohérence (réussites /
// issue), toute réécriture d'une carte déjà résolue/acceptée, tout
// champ d'identité modifié et toute fabrication par un autre
// joueur que le propriétaire de l'Acteur.

const MAX_DICE = 100;
const MAX_SUCCESSES = 100;
const MAX_PUSHES = 2;
const MAX_RESULT_JSON_LENGTH = 20000;


function isNonNegativeInt(
    value,
    max = MAX_SUCCESSES
) {

    return (
        Number.isInteger(value)
        && value >= 0
        && value <= max
    );

}


function isDiceArray(
    value
) {

    return (
        Array.isArray(value)
        && value.length <= MAX_DICE
        && value.every(
            die =>
                Number.isInteger(die)
                && die >= 1
                && die <= 6
        )
    );

}


/**
 * Égalité structurelle (valeurs JSON) ; `undefined` et absence
 * sont équivalents.
 */
function sameValue(
    a,
    b
) {

    if (a === undefined && b === undefined) {

        return true;

    }

    try {

        return JSON.stringify(a) === JSON.stringify(b);

    }
    catch (error) {

        return false;

    }

}


function resultJsonLength(
    value
) {

    try {

        return JSON.stringify(value).length;

    }
    catch (error) {

        return Infinity;

    }

}


/**
 * Bloc « jet de la victime » commun au Poison et à la Maladie :
 * `victimResult` (YZEResult sérialisé), `victimDiceValues`,
 * `victimSuccesses`, cohérents entre eux.
 */
function victimBlockError(
    next
) {

    const result = next.victimResult;

    if (
        !isPlainObject(result)
        || resultJsonLength(result) > MAX_RESULT_JSON_LENGTH
    ) {

        return "Jet de la victime invalide.";

    }

    if (!isNonNegativeInt(result.pushCount, MAX_PUSHES)) {

        return "Nombre de Push invalide.";

    }

    if (
        !isNonNegativeInt(next.victimSuccesses)
        || result.successes !== next.victimSuccesses
        || !isDiceArray(next.victimDiceValues)
    ) {

        return "Jet de la victime incohérent.";

    }

    return null;

}


/**
 * Transitions du jet en opposition (Poison, Maladie) :
 *
 *   en attente --résolution--> jeté (rolled, non appliqué)
 *   jeté --Push--> jeté (pushCount + 1, jet de la victime SEUL)
 *   jeté --acceptation--> appliqué (issue recalculée)
 *
 * Une carte appliquée n'est jamais réécrite.
 */
function checkOppositionTransition(
    current,
    next,
    {
        opponent,
        acceptOnlyFields,
        deriveAcceptFields
    }
) {

    const opponentDice = `${opponent}DiceValues`;
    const opponentSuccesses = `${opponent}Successes`;

    const present = key => next[key] !== undefined;

    if (current.rolled !== true) {

        // Résolution du jet.
        if (next.rolled !== true || next.applied !== false) {

            return "Transition d'état invalide.";

        }

        const victimError = victimBlockError(next);

        if (victimError) {

            return victimError;

        }

        if (next.victimResult.pushCount !== 0) {

            return "Un premier jet ne peut pas avoir été forcé.";

        }

        if (
            !isDiceArray(next[opponentDice])
            || !isNonNegativeInt(next[opponentSuccesses])
        ) {

            return "Jet adverse invalide.";

        }

        if (acceptOnlyFields.some(present)) {

            return "Résultat d'acceptation prématuré.";

        }

        return null;

    }

    // Carte déjà jetée (non appliquée).
    if (next.rolled !== true) {

        return "Transition d'état invalide.";

    }

    const victimError = victimBlockError(next);

    if (victimError) {

        return victimError;

    }

    // Le jet adverse n'est JAMAIS modifié après la résolution.
    if (
        !sameValue(current[opponentDice], next[opponentDice])
        || !sameValue(
            current[opponentSuccesses],
            next[opponentSuccesses]
        )
    ) {

        return "Le jet adverse ne peut pas être modifié.";

    }

    if (next.applied === true) {

        // Acceptation : le jet de la victime est figé.
        if (
            !sameValue(current.victimResult, next.victimResult)
            || !sameValue(
                current.victimDiceValues,
                next.victimDiceValues
            )
            || !sameValue(
                current.victimSuccesses,
                next.victimSuccesses
            )
        ) {

            return "Le jet ne peut plus être modifié à l'acceptation.";

        }

        const derived = deriveAcceptFields(next, current);

        for (const key of acceptOnlyFields) {

            if (!sameValue(next[key], derived[key])) {

                return "Issue incohérente avec les réussites.";

            }

        }

        return null;

    }

    if (next.applied !== false) {

        return "Transition d'état invalide.";

    }

    // Push : un seul Push de plus, entre « jeté » et « appliqué ».
    const currentPushCount = current.victimResult?.pushCount;

    if (
        !Number.isInteger(currentPushCount)
        || currentPushCount >= MAX_PUSHES
        || next.victimResult.pushCount !== currentPushCount + 1
    ) {

        return "Push invalide.";

    }

    if (acceptOnlyFields.some(present)) {

        return "Résultat d'acceptation prématuré.";

    }

    return null;

}


function checkCoupDeGrace(
    current,
    next
) {

    return (
        next.resolved === true
            ? null
            : "Données du flag invalides."
    );

}


function checkTerror(
    current,
    next
) {

    if (
        next.rolled !== true
        || !isDiceArray(next.diceValues)
        || !isNonNegativeInt(next.successes)
    ) {

        return "Données du flag invalides.";

    }

    const outcome =
        resolveTerrorOutcome({
            successes: next.successes
        });

    if (
        next.damage !== outcome.damage
        || next.affected !== outcome.affected
    ) {

        return "Issue incohérente avec les réussites.";

    }

    return null;

}


function checkAsphyxiation(
    current,
    next
) {

    if (
        next.rolled !== true
        || !isDiceArray(next.diceValues)
        || !isNonNegativeInt(next.successes)
    ) {

        return "Données du flag invalides.";

    }

    if (
        next.failed
        !== resolveAsphyxiationOutcome({
            successes: next.successes
        }).failed
    ) {

        return "Issue incohérente avec les réussites.";

    }

    return null;

}


function checkFire(
    current,
    next
) {

    if (
        next.rolled !== true
        || !isDiceArray(next.diceValues)
        || !isNonNegativeInt(next.successes)
        || !isNonNegativeInt(next.remainingDamage)
        || typeof next.ignites !== "boolean"
        || typeof next.deathRollRequired !== "boolean"
    ) {

        return "Données du flag invalides.";

    }

    // Un dé par point d'Intensité, jet non forçable (aucun Push).
    if (next.diceValues.length !== current.intensity) {

        return "Nombre de dés incohérent avec l'Intensité.";

    }

    // Une réussite = un 6.
    if (
        next.successes
        !== next.diceValues.filter(die => die === 6).length
    ) {

        return "Réussites incohérentes avec les dés.";

    }

    if (next.remainingDamage > next.successes) {

        return "Dégâts restants supérieurs aux réussites.";

    }

    if (
        next.ignites
        !== resolveFireOutcome({
            successes: next.successes,
            remainingDamage: next.remainingDamage
        }).ignites
    ) {

        return "Issue incohérente avec les dégâts.";

    }

    return null;

}


function checkPoison(
    current,
    next
) {

    return checkOppositionTransition(
        current,
        next,
        {
            opponent: "poison",

            acceptOnlyFields: ["fullEffect", "bladeNoEffect"],

            deriveAcceptFields: (flag, previous) => {

                const args = {
                    victimSuccesses: flag.victimSuccesses,
                    poisonSuccesses: flag.poisonSuccesses
                };

                // Seule la valeur de `bladePoison` du message
                // (identité immuable) choisit le mode.
                return (
                    previous.bladePoison === true
                        ? {
                            bladeNoEffect:
                                resolveBladePoisonOpposition(args)
                                    .noEffect,
                            fullEffect: undefined
                        }
                        : {
                            fullEffect:
                                resolvePoisonOpposition(args)
                                    .fullEffect,
                            bladeNoEffect: undefined
                        }
                );

            }
        }
    );

}


function checkIllness(
    current,
    next
) {

    return checkOppositionTransition(
        current,
        next,
        {
            opponent: "illness",

            acceptOnlyFields: ["sick"],

            deriveAcceptFields: flag => ({
                sick:
                    resolveIllnessOpposition({
                        victimSuccesses: flag.victimSuccesses,
                        illnessSuccesses: flag.illnessSuccesses
                    }).sick
            })
        }
    );

}


const OPPOSITION_COMMON_FIELDS = [
    "rolled",
    "applied",
    "victimResult",
    "victimDiceValues",
    "victimSuccesses"
];


/**
 * Table des règles par flag.
 *
 * - `identityFields` : valeurs qui ne peuvent JAMAIS changer ;
 * - `allowedFields` : seules clés admises dans le nouveau flag
 *   (`null` = pas de restriction, Coup de grâce uniquement) ;
 * - `isDone(current)` : la carte est-elle déjà résolue (refus) ;
 * - `check(current, next)` : transition, `null` si valide ;
 * - `maxRolls` : nombre maximal de Roll Foundry joints (0 = aucun) ;
 * - `contentMode` : « free » (contenu du joueur conservé, flux
 *   historique du Coup de grâce) ou « rendered » (le MJ recalcule
 *   le HTML à partir du flag validé et ignore celui du joueur).
 */
export const GM_RELAY_FLAG_RULES = Object.freeze({

    coupDeGrace: Object.freeze({
        identityFields: ["actorUuid"],
        allowedFields: null,
        maxRolls: MAX_ROLLS,
        contentMode: "free",
        isDone: current => current.resolved === true,
        check: checkCoupDeGrace
    }),

    terrorRoll: Object.freeze({
        identityFields: ["actorUuid", "terrorValue", "sourceLabel"],
        allowedFields: [
            "actorUuid", "terrorValue", "sourceLabel",
            "rolled", "diceValues", "successes", "damage", "affected"
        ],
        maxRolls: 1,
        contentMode: "rendered",
        isDone: current => current.rolled === true,
        check: checkTerror
    }),

    poisonRoll: Object.freeze({
        identityFields: [
            "actorUuid", "effectTypeKey", "toxicity",
            "sourceLabel", "bladePoison"
        ],
        allowedFields: [
            "actorUuid", "effectTypeKey", "toxicity",
            "sourceLabel", "bladePoison",
            ...OPPOSITION_COMMON_FIELDS,
            "poisonDiceValues", "poisonSuccesses",
            "fullEffect", "bladeNoEffect"
        ],
        maxRolls: 2,
        contentMode: "rendered",
        isDone: current => current.applied === true,
        check: checkPoison
    }),

    illnessRoll: Object.freeze({
        identityFields: ["actorUuid", "virulence", "sourceLabel"],
        allowedFields: [
            "actorUuid", "virulence", "sourceLabel",
            ...OPPOSITION_COMMON_FIELDS,
            "illnessDiceValues", "illnessSuccesses", "sick"
        ],
        maxRolls: 2,
        contentMode: "rendered",
        isDone: current => current.applied === true,
        check: checkIllness
    }),

    asphyxiationRoll: Object.freeze({
        identityFields: ["actorUuid", "sourceLabel", "sourceLevel"],
        allowedFields: [
            "actorUuid", "sourceLabel", "sourceLevel",
            "rolled", "diceValues", "successes", "failed"
        ],
        // Le jet est publié par actor.rollSkill() sur sa propre
        // carte : la carte d'état ne reçoit aucun Roll.
        maxRolls: 0,
        contentMode: "rendered",
        isDone: current => current.rolled === true,
        check: checkAsphyxiation
    }),
    fireRoll: Object.freeze({
        identityFields: ["actorUuid", "sourceLabel", "intensity"],
        allowedFields: [
            "actorUuid", "sourceLabel", "intensity",
            "rolled", "diceValues", "successes",
            "remainingDamage", "ignites", "deathRollRequired"
        ],
        maxRolls: 0,
        contentMode: "rendered",
        isDone: current => current.rolled === true,
        check: checkFire
    })

});


/**
 * Flags de message dont la mise à jour peut être relayée.
 */
export const GM_RELAY_ALLOWED_FLAGS =
    Object.freeze(Object.keys(GM_RELAY_FLAG_RULES));


/**
 * Nom du flag autorisé visé par une mise à jour (null si aucun
 * ou plusieurs flags, ou flag non autorisé).
 */
export function findRelayFlagName(
    update
) {

    if (!isPlainObject(update)) {

        return null;

    }

    const flagKeys = Object.keys(update).filter(
        key => key.startsWith("flags.")
    );

    if (flagKeys.length !== 1) {

        return null;

    }

    return (
        GM_RELAY_ALLOWED_FLAGS.find(
            name => relayFlagUpdateKey(name) === flagKeys[0]
        )
        ?? null
    );

}


/**
 * Valide la mise à jour demandée par un joueur.
 *
 * Règles communes :
 * - seules les clés `content`, `rolls`, `sound` et la clé de flag
 *   `flags.<système>.<flag autorisé>` sont admises ;
 * - exactement UN flag autorisé, qui doit être déjà présent sur
 *   le message (flag courant fourni par l'appelant) ;
 * - le flag courant ne doit pas déjà être résolu/appliqué ;
 * - le demandeur doit être propriétaire du personnage
 *   (`requesterIsOwner`, établi par la couche Foundry) ;
 * - les champs d'identité du flag sont immuables ; le nouveau
 *   flag ne porte que des champs admis ;
 * - la transition d'état et la cohérence du résultat sont
 *   vérifiées par la règle propre au flag
 *   (`GM_RELAY_FLAG_RULES`) ;
 * - `rolls` : au plus `maxRolls` jets de la règle.
 *
 * @returns {{ok: true, update: object, flagName: string,
 *   contentMode: string, nextFlag: object}
 *   | {ok: false, reason: string}}
 */
export function validateRelayedUpdate({
    update,
    currentFlags,
    requesterIsOwner
} = {}) {

    const fail = reason => ({ ok: false, reason });

    if (!isPlainObject(update)) {

        return fail("Mise à jour absente ou invalide.");

    }

    if (!isPlainObject(currentFlags)) {

        return fail("Message introuvable ou sans flag autorisé.");

    }

    const keys = Object.keys(update);

    const flagKeys = keys.filter(
        key => key.startsWith("flags.")
    );

    if (flagKeys.length !== 1) {

        return fail("Un seul flag doit être mis à jour.");

    }

    const flagKey = flagKeys[0];

    const flagName = GM_RELAY_ALLOWED_FLAGS.find(
        name => relayFlagUpdateKey(name) === flagKey
    );

    if (!flagName) {

        return fail("Ce flag n'est pas autorisé.");

    }

    const rule = GM_RELAY_FLAG_RULES[flagName];

    const allowedKeys = new Set([
        "content",
        "rolls",
        "sound",
        flagKey
    ]);

    for (const key of keys) {

        if (!allowedKeys.has(key)) {

            return fail(`Clé non autorisée : ${key}.`);

        }

    }

    const current = currentFlags[flagName];

    if (!isPlainObject(current)) {

        return fail("Ce message ne porte pas le flag attendu.");

    }

    if (rule.isDone(current)) {

        return fail("Cette carte a déjà été résolue.");

    }

    if (requesterIsOwner !== true) {

        return fail(
            "Le demandeur n'est pas propriétaire du personnage."
        );

    }

    const nextFlag = update[flagKey];

    if (
        !isPlainObject(nextFlag)
        || nextFlag.actorUuid !== current.actorUuid
    ) {

        return fail("Données du flag invalides.");

    }

    for (const field of rule.identityFields) {

        if (!sameValue(current[field], nextFlag[field])) {

            return fail(
                `Le champ « ${field} » ne peut pas être modifié.`
            );

        }

    }

    if (rule.allowedFields) {

        const allowedFields = new Set(rule.allowedFields);

        for (const field of Object.keys(nextFlag)) {

            if (!allowedFields.has(field)) {

                return fail(`Champ de flag non autorisé : ${field}.`);

            }

        }

    }

    const transitionError = rule.check(current, nextFlag);

    if (transitionError) {

        return fail(transitionError);

    }

    if ("content" in update) {

        if (
            typeof update.content !== "string"
            || update.content.length > MAX_CONTENT_LENGTH
        ) {

            return fail("Contenu invalide.");

        }

    }

    if ("sound" in update && typeof update.sound !== "string") {

        return fail("Son invalide.");

    }

    if ("rolls" in update) {

        if (
            !Array.isArray(update.rolls)
            || update.rolls.length > rule.maxRolls
            || update.rolls.some(
                roll =>
                    typeof roll !== "string"
                    && !isPlainObject(roll)
            )
        ) {

            return fail("Jets invalides.");

        }

        // Un Push ou une acceptation n'apporte aucun nouveau jet
        // Foundry : les jets ne sont admis qu'à la résolution.
        if (
            update.rolls.length > 0
            && current.rolled === true
        ) {

            return fail("Aucun jet n'est admis à cette étape.");

        }

    }

    return {
        ok: true,
        update,
        flagName,
        contentMode: rule.contentMode,
        nextFlag
    };

}


/**
 * Suivi des requêtes de relais en attente (côté joueur).
 *
 * Les timers sont injectés pour rester testable.
 */
export function createPendingRequests({
    timeoutMs = GM_RELAY_TIMEOUT_MS,
    setTimeoutFn = setTimeout,
    clearTimeoutFn = clearTimeout
} = {}) {

    const pending = new Map();

    return {

        /**
         * Enregistre une requête ; la promesse est résolue par
         * `settle` ou rejetée au bout de `timeoutMs`.
         */
        register(
            requestId
        ) {

            return new Promise(
                (resolve, reject) => {

                    const timer = setTimeoutFn(
                        () => {

                            pending.delete(requestId);

                            reject(
                                new Error(GM_RELAY_ERRORS.TIMEOUT)
                            );

                        },
                        timeoutMs
                    );

                    pending.set(
                        requestId,
                        { resolve, reject, timer }
                    );

                }
            );

        },


        /**
         * Applique la réponse du MJ. Retourne false si la
         * requête est inconnue (déjà réglée / autre client).
         */
        settle(
            requestId,
            {
                ok,
                error
            } = {}
        ) {

            const entry = pending.get(requestId);

            if (!entry) {

                return false;

            }

            pending.delete(requestId);

            clearTimeoutFn(entry.timer);

            if (ok === true) {

                entry.resolve(true);

            }
            else {

                entry.reject(
                    new Error(
                        typeof error === "string" && error
                            ? error
                            : GM_RELAY_ERRORS.INVALID
                    )
                );

            }

            return true;

        },


        get size() {

            return pending.size;

        }

    };

}
