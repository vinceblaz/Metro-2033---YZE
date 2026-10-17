/**
 * Registre des états (statuts) qui infligent automatiquement
 * des dégâts à chaque round de combat tant qu'ils sont actifs
 * sur un Actor (ex. Asphyxié, et plus tard Poison/Empoisonné —
 * cf. reference/backlog-idees-futures.md).
 *
 * Mécanique volontairement homebrew, absente du livre de
 * règles : actée avec le porteur du projet le 28/09/2026 —
 * « en mode combat, ces états doivent infliger des dégâts tous
 * les rounds ; hors combat, c'est le MJ qui décide ». Ce module
 * ne fait que la mise en relation « identifiant d'état → gérant
 * (resolver) à appeler » ; il ne sait rien de Foundry (pas de
 * dépendance à `game`/`Hooks`) et reste donc testable seul,
 * séparément du parcours des Combatants réel (qui vit dans
 * `combat-round-coordinator.mjs`, non testé par convention du
 * projet).
 *
 * Chaque macro (jet d'Asphyxie, futur jet de Poison) enregistre
 * son propre gérant ici lors de son initialisation Foundry ;
 * `combat-hooks.mjs` n'a besoin de connaître aucune d'entre
 * elles individuellement.
 */
export function createRecurringStatusEffectRegistry() {

    const handlers =
        new Map();


    return {

        /**
         * Enregistre le gérant d'un état. `resolveActor` est
         * appelé avec `(actor, { combat })` à chaque round de
         * combat, pour chaque Actor portant cet état.
         *
         * Un second appel pour le même `statusId` remplace le
         * gérant précédent (utile en rechargement de module/
         * tests), il n'empile jamais deux gérants pour un même
         * état.
         */
        register(
            statusId,
            resolveActor
        ) {

            if (
                typeof statusId !== "string"
                || statusId.length === 0
            ) {

                throw new TypeError(
                    "L'identifiant de l'état doit être une chaîne non vide."
                );

            }


            if (typeof resolveActor !== "function") {

                throw new TypeError(
                    "Le gérant de l'état doit être une fonction."
                );

            }


            handlers.set(
                statusId,
                resolveActor
            );

        },


        /**
         * Retire le gérant d'un état (surtout utile pour les
         * tests, qui repartent d'un registre propre).
         */
        unregister(
            statusId
        ) {

            handlers.delete(
                statusId
            );

        },


        getHandler(
            statusId
        ) {

            return handlers.get(statusId)
                ?? null;

        },


        /**
         * Liste [statusId, resolveActor] de tous les gérants
         * enregistrés.
         */
        entries() {

            return [...handlers.entries()];

        }

    };

}


/**
 * Instance partagée par tout le système : chaque macro
 * s'enregistre ici lors de son initialisation Foundry, et
 * `combat-round-coordinator.mjs` la consulte à chaque round.
 */
export const recurringStatusEffectRegistry =
    createRecurringStatusEffectRegistry();
