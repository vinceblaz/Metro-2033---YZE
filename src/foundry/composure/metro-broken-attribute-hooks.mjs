/**
 * États « Brisé » par attribut pour les PNJ et Créatures (cf.
 * domain/rules/broken-attribute-status.mjs).
 *
 * - `updateActor` : si un attribut change, les états sont alignés ;
 * - `createActiveEffect` / `deleteActiveEffect` : un ajout ou un
 *   retrait manuel (Token HUD) est aussitôt corrigé.
 *
 * Agit uniquement sur le client qui a effectué la modification
 * (`userId === game.user.id`). Best-effort : un échec ne bloque
 * jamais la mise à jour de l'attribut.
 */

import {
    BROKEN_ATTRIBUTE_STATUS_EFFECTS,
    resolveBrokenAttributeStatusSync
} from "../../domain/rules/broken-attribute-status.mjs";

const SYNCED_ACTOR_TYPES = ["npc", "creature"];

const BROKEN_IDS = new Set(BROKEN_ATTRIBUTE_STATUS_EFFECTS.map(e => e.id));


async function syncBrokenAttributeStatuses(actor) {

    if (!SYNCED_ACTOR_TYPES.includes(actor?.type)) {
        return;
    }

    const { add, remove } = resolveBrokenAttributeStatusSync({
        attributes: actor.system?.attributes,
        activeStatusIds: [...(actor.statuses ?? [])]
    });

    for (const id of add) {
        await toggle(actor, id, true);
    }

    for (const id of remove) {
        await toggle(actor, id, false);
    }

}


async function toggle(actor, statusId, active) {

    try {
        await actor.toggleStatusEffect(statusId, { active });
    }
    catch (error) {
        console.warn(
            `Métro 2033 | Impossible d'aligner l'état « ${statusId} ».`,
            error
        );
    }

}


export function registerBrokenAttributeHooks() {

    Hooks.on("updateActor", (actor, changes, options, userId) => {

        if (userId !== game.user.id) {
            return;
        }

        if (foundry.utils.getProperty(changes, "system.attributes") === undefined) {
            return;
        }

        syncBrokenAttributeStatuses(actor);

    });

    for (const hook of ["createActiveEffect", "deleteActiveEffect"]) {

        Hooks.on(hook, (effect, options, userId) => {

            if (
                userId !== game.user.id
                || effect?.parent?.documentName !== "Actor"
                || ![...(effect.statuses ?? [])].some(id => BROKEN_IDS.has(id))
            ) {
                return;
            }

            syncBrokenAttributeStatuses(effect.parent);

        });

    }

}
