/**
 * Relais de mise à jour de ChatMessage via un MJ actif
 * (couche Foundry ; la logique pure est dans
 * domain/rules/gm-message-relay.mjs).
 *
 * Un joueur ne peut pas faire `message.update(...)` sur un
 * message dont il n'est pas l'auteur. `updateChatMessageAsGM`
 * fait l'update directement quand c'est permis, sinon demande à
 * un MJ actif (socket du système, `"socket": true` dans
 * system.json) de l'appliquer après validation stricte.
 *
 * Non testé unitairement (API Foundry) : validé par `node --check`.
 */

import {
    GM_RELAY_ALLOWED_FLAGS,
    GM_RELAY_ERRORS,
    GM_RELAY_MESSAGE_TYPES,
    GM_RELAY_SOCKET,
    GM_RELAY_SYSTEM_ID,
    chooseUpdateRoute,
    createPendingRequests,
    findRelayFlagName,
    validateRelayedUpdate
} from "../../domain/rules/gm-message-relay.mjs";


const pendingRequests =
    createPendingRequests();


/**
 * Rendus HTML des cartes, par nom de flag. Pour les flux en mode
 * « rendered » (Terreur, Poison, Maladie, Asphyxie), le MJ
 * IGNORE le `content` envoyé par le joueur et recalcule le HTML
 * à partir du flag validé : le joueur ne peut pas injecter de
 * HTML arbitraire dans le Chat. Chaque module de chat enregistre
 * son rendu à son chargement (tous sont chargés au démarrage par
 * system.mjs).
 */
const contentRenderers =
    new Map();

export function registerRelayContentRenderer(
    flagName,
    renderer
) {

    contentRenderers.set(
        flagName,
        renderer
    );

}


function serializeUpdate(
    data
) {

    const update = {
        ...data
    };

    if (Array.isArray(update.rolls)) {

        update.rolls = update.rolls.map(
            roll =>
                typeof roll?.toJSON === "function"
                    ? roll.toJSON()
                    : roll
        );

    }

    return update;

}


/**
 * Vérifie, AVANT toute action irréversible (jet payé en Stress,
 * dégâts...), qu'une mise à jour du message sera possible :
 * directement, ou via un MJ actif.
 *
 * @throws {Error} « Aucun MJ actif... » sinon.
 */
export function assertChatMessageUpdatable(
    message
) {

    const route =
        chooseUpdateRoute({
            isGM:
                game.user.isGM,
            canModify:
                message.canUserModify(
                    game.user,
                    "update"
                )
        });

    if (
        route === "relay"
        && !game.users.activeGM
    ) {

        throw new Error(
            GM_RELAY_ERRORS.NO_ACTIVE_GM
        );

    }

}


/**
 * Met à jour un ChatMessage, directement ou via un MJ actif.
 *
 * @throws {Error} message lisible (« Aucun MJ actif... »).
 */
export async function updateChatMessageAsGM(
    message,
    data
) {

    const route =
        chooseUpdateRoute({
            isGM:
                game.user.isGM,
            canModify:
                message.canUserModify(
                    game.user,
                    "update"
                )
        });


    if (route === "direct") {

        return message.update(data);

    }


    const activeGM =
        game.users.activeGM;

    if (!activeGM) {

        throw new Error(
            GM_RELAY_ERRORS.NO_ACTIVE_GM
        );

    }


    const requestId =
        foundry.utils.randomID();

    const result =
        pendingRequests.register(
            requestId
        );

    // Évite un « unhandled rejection » si emit lève avant l'await.
    result.catch(() => {});

    game.socket.emit(
        GM_RELAY_SOCKET,
        {
            type:
                GM_RELAY_MESSAGE_TYPES.UPDATE_REQUEST,
            requestId,
            userId:
                game.user.id,
            messageId:
                message.id,
            update:
                serializeUpdate(data)
        }
    );

    await result;

    return message;

}


function sendResult(
    request,
    {
        ok,
        error
    }
) {

    game.socket.emit(
        GM_RELAY_SOCKET,
        {
            type:
                GM_RELAY_MESSAGE_TYPES.UPDATE_RESULT,
            requestId:
                request.requestId,
            userId:
                request.userId,
            ok,
            error
        }
    );

}


async function handleUpdateRequest(
    request
) {

    // Seul le MJ actif désigné traite la demande (anti-doublon).
    if (
        !game.user.isGM
        || game.users.activeGM?.id !== game.user.id
    ) {

        return;

    }


    try {

        const message =
            game.messages.get(
                request.messageId
            );

        if (!message) {

            throw new Error(
                "Message introuvable."
            );

        }


        const currentFlags = {};

        for (const name of GM_RELAY_ALLOWED_FLAGS) {

            const value =
                message.getFlag(
                    GM_RELAY_SYSTEM_ID,
                    name
                );

            if (value) {

                currentFlags[name] = value;

            }

        }


        let requesterIsOwner = false;

        // Le propriétaire à contrôler est celui du flag VISÉ par
        // la mise à jour (jamais un autre flag du message).
        const targetFlagName =
            findRelayFlagName(
                request.update
            );

        const actorUuid =
            targetFlagName
                ? currentFlags[targetFlagName]?.actorUuid
                : undefined;

        const requester =
            game.users.get(request.userId);

        if (actorUuid && requester) {

            const actor =
                await fromUuid(actorUuid);

            requesterIsOwner =
                actor?.testUserPermission(
                    requester,
                    "OWNER"
                ) === true;

        }


        const validation =
            validateRelayedUpdate({
                update:
                    request.update,
                currentFlags,
                requesterIsOwner
            });

        if (!validation.ok) {

            throw new Error(
                validation.reason
            );

        }


        let update =
            validation.update;

        if (validation.contentMode === "rendered") {

            const renderer =
                contentRenderers.get(
                    validation.flagName
                );

            if (!renderer) {

                throw new Error(
                    "Rendu de carte indisponible côté MJ."
                );

            }

            update = {
                ...update,
                content:
                    renderer(
                        validation.nextFlag
                    )
            };

            if ("sound" in update) {

                update.sound =
                    CONFIG.sounds.dice;

            }

        }


        await message.update(
            update
        );

        sendResult(
            request,
            { ok: true }
        );

    }
    catch (error) {

        console.warn(
            "Metro 2033 | Relais MJ : mise à jour refusée",
            error
        );

        sendResult(
            request,
            {
                ok: false,
                error:
                    error?.message
                    ?? GM_RELAY_ERRORS.INVALID
            }
        );

    }

}


/**
 * À appeler une fois à l'initialisation (hook ready), sur tous
 * les clients : le MJ actif traite les demandes, les joueurs
 * reçoivent les accusés.
 */
export function registerGMMessageRelay() {

    game.socket.on(
        GM_RELAY_SOCKET,
        payload => {

            if (!payload || typeof payload !== "object") {

                return;

            }

            if (
                payload.type
                === GM_RELAY_MESSAGE_TYPES.UPDATE_REQUEST
            ) {

                handleUpdateRequest(payload);

            }
            else if (
                payload.type
                === GM_RELAY_MESSAGE_TYPES.UPDATE_RESULT
                && payload.userId === game.user.id
            ) {

                pendingRequests.settle(
                    payload.requestId,
                    payload
                );

            }

        }
    );

}
