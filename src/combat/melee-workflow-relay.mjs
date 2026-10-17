/**
 * Relais joueur → MJ des écritures d'un workflow de mêlée
 * (couche Foundry ; validation pure dans
 * domain/rules/melee-workflow-relay.mjs).
 *
 * Deux demandes, traitées uniquement par le MJ actif :
 *
 * 1. « save » : enregistrer un workflow dans le flag du Combat
 *    (un joueur ne peut pas écrire dans le Combat) ;
 * 2. « refresh » : recalculer le contenu de la carte de mêlée
 *    (un joueur ne peut pas modifier le message d'un autre). Le
 *    contenu est TOUJOURS recalculé par le MJ depuis le workflow
 *    stocké : rien n'est repris de la demande du joueur.
 *
 * Périmètre : étapes du défenseur uniquement (cf. module pur).
 *
 * Non testé unitairement (API Foundry) : validé par `node --check`.
 */

import {
    GM_RELAY_ERRORS,
    GM_RELAY_SOCKET,
    GM_RELAY_SYSTEM_ID,
    createPendingRequests
} from "../domain/rules/gm-message-relay.mjs";

import {
    MELEE_WORKFLOW_RELAY_MESSAGE_TYPES as TYPES,
    validateRelayedWorkflowSave
} from "../domain/rules/melee-workflow-relay.mjs";


const FLAG_KEY =
    "meleeAttackWorkflows";

const pendingRequests =
    createPendingRequests();


/**
 * Le Combat est-il modifiable directement par cet utilisateur ?
 */
export function canWriteCombatDirectly(
    combat,
    user = globalThis.game?.user
) {

    /*
     * Seul le MJ écrit directement : la permission de mise à jour
     * du Combat accordée à certains joueurs ne couvre pas, de façon
     * fiable, les flags du système. Tout joueur passe par le relais.
     */
    // Sans utilisateur Foundry (tests unitaires) : écriture directe.
    return !user || user.isGM === true;

}


function ensureActiveGM() {

    if (!game.users.activeGM) {
        throw new Error(
            GM_RELAY_ERRORS.NO_ACTIVE_GM
        );
    }

}


async function sendRequest(payload) {

    ensureActiveGM();

    const requestId =
        foundry.utils.randomID();

    const result =
        pendingRequests.register(requestId);

    result.catch(() => {});

    game.socket.emit(
        GM_RELAY_SOCKET,
        {
            ...payload,
            requestId,
            userId: game.user.id
        }
    );

    await result;

}


function sendResult(request, { ok, error }) {

    game.socket.emit(
        GM_RELAY_SOCKET,
        {
            type:
                request.type === TYPES.SAVE_REQUEST
                    ? TYPES.SAVE_RESULT
                    : TYPES.REFRESH_RESULT,
            requestId: request.requestId,
            userId: request.userId,
            ok,
            error
        }
    );

}


// ---------------------------------------------------------------
// CÔTÉ JOUEUR
// ---------------------------------------------------------------

/**
 * Demande au MJ d'enregistrer le workflow.
 *
 * @throws {Error} message lisible si refusé / pas de MJ.
 */
export async function relayWorkflowSave(
    combat,
    workflowObject
) {

    await sendRequest({
        type: TYPES.SAVE_REQUEST,
        combatId: combat.id,
        workflow:
            foundry.utils.deepClone(workflowObject)
    });

}


/**
 * Demande au MJ de recalculer la carte de mêlée.
 */
export async function relayMeleeMessageRefresh(message) {

    await sendRequest({
        type: TYPES.REFRESH_REQUEST,
        messageId: message.id
    });

}


// ---------------------------------------------------------------
// CÔTÉ MJ
// ---------------------------------------------------------------

function isActiveGM() {

    return (
        game.user.isGM
        && game.users.activeGM?.id === game.user.id
    );

}


async function requesterOwnsDefender(
    requester,
    defenderRef,
    combat
) {

    if (!requester || !defenderRef?.actorId) {
        return false;
    }

    // Actor synthétique du Token si connu, sinon Actor du monde.
    let actor = null;

    if (defenderRef.tokenId) {
        actor =
            [...combat.combatants]
                .find(c => c.tokenId === defenderRef.tokenId)
                ?.actor
            ?? null;
    }

    actor ??= game.actors.get(defenderRef.actorId) ?? null;

    return (
        actor?.testUserPermission(requester, "OWNER") === true
        && actor.id === defenderRef.actorId
    );

}


async function handleSaveRequest(request) {

    if (!isActiveGM()) {
        return;
    }

    try {

        const combat =
            game.combats.get(request.combatId);

        if (!combat) {
            throw new Error("Combat introuvable.");
        }

        const requester =
            game.users.get(request.userId);

        const stored =
            foundry.utils.deepClone(
                combat.getFlag(
                    GM_RELAY_SYSTEM_ID,
                    FLAG_KEY
                ) ?? {}
            );

        const incoming = request.workflow;

        const current =
            incoming?.id
                ? stored[incoming.id] ?? null
                : null;

        const validation =
            validateRelayedWorkflowSave({
                stored: current,
                incoming,
                requesterOwnsDefender:
                    await requesterOwnsDefender(
                        requester,
                        current?.defender,
                        combat
                    )
            });

        if (!validation.ok) {
            throw new Error(validation.reason);
        }

        stored[incoming.id] = validation.workflow;

        await combat.setFlag(
            GM_RELAY_SYSTEM_ID,
            FLAG_KEY,
            stored
        );

        sendResult(request, { ok: true });

    }
    catch (error) {

        console.warn(
            "Metro 2033 | Relais mêlée : enregistrement refusé",
            error
        );

        sendResult(request, {
            ok: false,
            error:
                error?.message
                ?? GM_RELAY_ERRORS.INVALID
        });

    }

}


async function handleRefreshRequest(request) {

    if (!isActiveGM()) {
        return;
    }

    try {

        const message =
            game.messages.get(request.messageId);

        if (!message) {
            throw new Error("Message introuvable.");
        }

        // Imports différés : évite un cycle avec le service.
        const [
            { MeleeAttackChat },
            { MeleeAttackWorkflowService }
        ] = await Promise.all([
            import("./melee-attack-chat.mjs"),
            import("./melee-attack-workflow-service.mjs")
        ]);

        const reference =
            MeleeAttackChat.getWorkflowReference(message);

        const combat =
            reference?.combatId
                ? game.combats.get(reference.combatId)
                : null;

        const workflow =
            combat
                ? MeleeAttackWorkflowService.get(
                    combat,
                    reference.workflowId
                )
                : null;

        if (!workflow) {
            throw new Error("Workflow de mêlée introuvable.");
        }

        const requester =
            game.users.get(request.userId);

        const owns =
            await requesterOwnsDefender(
                requester,
                workflow.defender,
                combat
            );

        if (!owns) {
            throw new Error(
                "Seul le propriétaire du défenseur peut rafraîchir cette carte."
            );
        }

        await MeleeAttackChat.updateMessage(
            message,
            workflow
        );

        sendResult(request, { ok: true });

    }
    catch (error) {

        console.warn(
            "Metro 2033 | Relais mêlée : rafraîchissement refusé",
            error
        );

        sendResult(request, {
            ok: false,
            error:
                error?.message
                ?? GM_RELAY_ERRORS.INVALID
        });

    }

}


/**
 * À appeler une fois (hook ready), sur tous les clients.
 */
export function registerMeleeWorkflowRelay() {

    game.socket.on(
        GM_RELAY_SOCKET,
        payload => {

            if (!payload || typeof payload !== "object") {
                return;
            }

            switch (payload.type) {

                case TYPES.SAVE_REQUEST:
                    handleSaveRequest(payload);
                    break;

                case TYPES.REFRESH_REQUEST:
                    handleRefreshRequest(payload);
                    break;

                case TYPES.SAVE_RESULT:
                case TYPES.REFRESH_RESULT:
                    if (payload.userId === game.user.id) {
                        pendingRequests.settle(
                            payload.requestId,
                            payload
                        );
                    }
                    break;

                default:
                    break;

            }

        }
    );

}
