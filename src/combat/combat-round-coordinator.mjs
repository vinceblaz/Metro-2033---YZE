/**
 * CombatRoundCoordinator.
 *
 * Coordonne les événements temporels objectivement liés aux
 * rounds de Combat (Bible, §28.2 « Temps METRO et
 * CombatRoundCoordinator », conçu dès la v0.8.0 mais jamais
 * implémenté jusqu'ici). Il ne porte aucune règle métier des
 * effets eux-mêmes : chaque danger (Asphyxie extrême, et plus
 * tard Poison, Feu, Radiation extrême...) enregistre son propre
 * évaluateur dans `recurring-status-effect-registry.mjs`, et ce
 * coordinateur se contente de les déclencher au bon moment, pour
 * chaque Actor concerné.
 *
 * Idempotence (exigée par la Bible, §28.2) : un rechargement ou
 * plusieurs notifications `updateCombat` pour le même round ne
 * doivent jamais produire un double tick. Le round déjà traité
 * est mémorisé dans un flag du Combat (`combatRoundCoordinator`),
 * posé AVANT la résolution des évaluateurs plutôt qu'après,
 * pour qu'une interruption en cours de traitement ne puisse pas
 * rejouer un tick déjà entamé au rechargement suivant.
 *
 * Suspension en fin de Combat (Bible, §28.2 : « La fin d'un
 * Combat suspend l'automatisation des effets par round sans
 * supprimer l'effet ni consommer sa durée restante ») : ce
 * coordinateur n'est appelé que depuis le hook `updateCombat`
 * filtré sur un changement de round (cf. `combat-hooks.mjs`).
 * Aucun round ne change plus une fois le Combat terminé/supprimé,
 * l'automatisation s'arrête donc naturellement sans qu'aucune
 * action explicite ne soit nécessaire ici ; l'état/l'exposition
 * eux-mêmes ne sont jamais touchés par ce module.
 *
 * Dépend de Foundry (`combat.getFlag`/`setFlag`, `actor.statuses`)
 * : non testé unitairement, par convention du projet pour les
 * fonctions d'intégration Foundry (cf. StunEffectService).
 */

import {
    recurringStatusEffectRegistry
} from "./recurring-status-effect-registry.mjs";


const SYSTEM_ID =
    "metro-2033-yze";

const LAST_PROCESSED_ROUND_FLAG =
    "combatRoundCoordinatorLastRound";


export class CombatRoundCoordinator {


    /**
     * Résout tous les évaluateurs enregistrés pour le round
     * courant du Combat donné, une seule fois par round.
     */
    static async resolveRound(
        combat
    ) {

        if (!combat) {
            return;
        }


        const entries =
            recurringStatusEffectRegistry
                .entries();


        if (entries.length === 0) {
            return;
        }


        const lastProcessedRound =
            combat.getFlag(
                SYSTEM_ID,
                LAST_PROCESSED_ROUND_FLAG
            )
            ?? null;


        if (lastProcessedRound === combat.round) {

            /*
             * Round déjà traité : rechargement ou notification
             * Foundry dupliquée. Ne jamais produire de double
             * tick (Bible, §28.2).
             */
            return;

        }


        /*
         * Marqué AVANT résolution, pas après : une interruption
         * en cours de traitement (erreur, rechargement) ne doit
         * jamais rejouer un tick déjà entamé pour ce round.
         */
        await combat.setFlag(
            SYSTEM_ID,
            LAST_PROCESSED_ROUND_FLAG,
            combat.round
        );


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


}
