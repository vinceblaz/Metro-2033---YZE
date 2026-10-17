/**
 * Parcourt les Combatants d'un Combat à chaque changement de
 * round et déclenche, pour chaque Actor portant un état
 * enregistré dans `recurringStatusEffectRegistry` (Asphyxié,
 * plus tard Poison...), le gérant correspondant.
 *
 * Dépend de Foundry (`actor.statuses`) : non testé
 * unitairement, par convention du projet (cf. les autres
 * fonctions d'intégration Foundry, ex. StunEffectService).
 *
 * Une erreur sur un Actor n'interrompt jamais le traitement des
 * autres (ex. un Actor déjà mort dont `takeAttributeDamage`
 * refuserait le dégât) : chaque gérant est isolé dans son
 * propre try/catch.
 */

import {
    recurringStatusEffectRegistry
} from "./recurring-status-effect-registry.mjs";


export async function resolveRecurringStatusEffectsForRound(
    combat
) {

    if (!combat) {
        return;
    }


    const entries =
        recurringStatusEffectRegistry.entries();


    if (entries.length === 0) {
        return;
    }


    for (
        const combatant
        of combat.combatants
    ) {

        const actor =
            combatant.actor;


        if (!actor?.statuses) {
            continue;
        }


        for (
            const [statusId, resolveActor]
            of entries
        ) {

            if (!actor.statuses.has(statusId)) {
                continue;
            }


            try {

                await resolveActor(
                    actor,
                    { combat }
                );

            }
            catch (error) {

                console.error(
                    `Metro 2033 | Échec de la résolution automatique `
                    + `de l'état "${statusId}" pour ${actor.name}.`,
                    error
                );

            }

        }

    }

}
