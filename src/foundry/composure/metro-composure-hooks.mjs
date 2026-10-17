/**
 * État « Brisé » dérivé du Sang-froid (cf.
 * domain/rules/composure-break.mjs).
 *
 * - `updateActor` : si le Sang-froid change, l'état est aligné ;
 *   le message de Chat n'est publié qu'au passage effectif à
 *   Brisé.
 * - `createActiveEffect` / `deleteActiveEffect` : l'état n'est
 *   modifiable que par la valeur de Sang-froid ; une pose ou un
 *   retrait manuel (Token HUD) est aussitôt corrigé, sans
 *   nouveau message.
 *
 * Chaque hook n'agit que sur le client qui a effectué la
 * modification (`userId === game.user.id`) pour éviter les
 * doublons entre clients. Best-effort : un échec ne bloque
 * jamais la mise à jour du Sang-froid.
 */

import {
    COMPOSURE_BROKEN_STATUS_EFFECT,
    resolveComposureBreakSync,
    buildComposureBreakMessage
} from "../../domain/rules/composure-break.mjs";


async function syncComposureBrokenStatus(actor, { announceOnAdd }) {

    if (!actor?.isCharacter) {
        return;
    }

    const composure =
        actor.system?.stress?.composure;

    const decision =
        resolveComposureBreakSync({
            current: composure?.current,
            max: composure?.max,
            hasStatus:
                actor.statuses?.has(
                    COMPOSURE_BROKEN_STATUS_EFFECT.id
                ) === true,
            announceOnAdd
        });

    if (decision.action === "none") {
        return;
    }

    try {

        await actor.toggleStatusEffect(
            COMPOSURE_BROKEN_STATUS_EFFECT.id,
            { active: decision.action === "add" }
        );

    }
    catch (error) {

        console.warn(
            "Métro 2033 | Impossible d'aligner l'état Brisé (Sang-froid).",
            error
        );

        return;

    }

    if (decision.announce) {

        await ChatMessage.create({

            speaker: ChatMessage.getSpeaker({ actor }),

            content: buildComposureBreakMessage(actor.name)

        });

    }

}


function isComposureBrokenEffect(effect) {

    return effect?.parent?.documentName === "Actor"
        && effect.statuses?.has(
            COMPOSURE_BROKEN_STATUS_EFFECT.id
        ) === true;

}


export function registerComposureHooks() {

    Hooks.on(
        "updateActor",
        (actor, changes, options, userId) => {

            if (userId !== game.user.id) {
                return;
            }

            const composureChanged =
                foundry.utils.getProperty(
                    changes,
                    "system.stress.composure"
                ) !== undefined;

            if (!composureChanged) {
                return;
            }

            syncComposureBrokenStatus(
                actor,
                { announceOnAdd: true }
            );

        }
    );


    for (const hook of ["createActiveEffect", "deleteActiveEffect"]) {

        Hooks.on(
            hook,
            (effect, options, userId) => {

                if (
                    userId !== game.user.id
                    || !isComposureBrokenEffect(effect)
                ) {
                    return;
                }

                syncComposureBrokenStatus(
                    effect.parent,
                    { announceOnAdd: false }
                );

            }
        );

    }

}
