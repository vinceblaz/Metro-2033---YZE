import { InitiativeSwapService }
    from "./initiative-swap-service.mjs";
  
import {
    GrappleService
} from "./grapple-service.mjs";

import {
    CombatRoundCoordinator
} from "./combat-round-coordinator.mjs";

import {
    StunEffectService
} from "./stun-effect-service.mjs";


export function registerCombatHooks() {

    Hooks.on(
        "updateCombat",
        async (
            combat,
            changes,
            options,
            userId
        ) => {

            /*
             * Nous ne nous intéressons qu'à un
             * changement de round.
             */
            if (!Object.hasOwn(changes, "round")) {
                return;
            }


            /*
             * Évite que chaque client connecté
             * tente d'appliquer l'effet.
             *
             * Seul le GM actif effectue
             * la modification du Combat.
             */
            if (!game.user?.isGM) {
                return;
            }


            try {

                await InitiativeSwapService
                    .applyPendingSwaps(
                        combat
                    );

            }
            catch (error) {

                console.error(
                    "Metro 2033 | Erreur lors de l'application des échanges d'initiative.",
                    error
                );

            }

            /*
            * États à dégâts récurrents (Asphyxié, Poison...) :
            * cf. recurring-status-effect-registry.mjs. Chaque
            * macro enregistre son propre gérant ; ce hook ne
            * connaît que le coordinateur générique et idempotent
            * (CombatRoundCoordinator, Bible §28.2).
            */
            try {

                await CombatRoundCoordinator.resolveRound(
                    combat
                );

            }
            catch (error) {

                console.error(
                    "Metro 2033 | Erreur lors de la résolution des états à dégâts récurrents.",
                    error
                );

            }

            /*
            * Purge les effets d'Étourdissement expirés
            * (grenade assourdissante, p.190-191) : sans ce
            * nettoyage, `StunEffectService.clearExpired()`
            * restait défini mais jamais appelé (dette technique
            * signalée lors de l'audit Combat/Bible v0.9.5, cf.
            * backlog). `isActive()`/`getPenalty()` ignorent déjà
            * un effet expiré par eux-mêmes (comparaison de round),
            * donc l'absence de cet appel n'était pas un bug de
            * jeu — seul le flag restait indéfiniment posé sur
            * l'Acteur, sans jamais être retiré.
            */
            try {

                await StunEffectService.clearExpired(
                    combat
                );

            }
            catch (error) {

                console.error(
                    "Metro 2033 | Erreur lors du nettoyage des effets d'Étourdissement expirés.",
                    error
                );

            }

        }
    );

    Hooks.on(
        "preUpdateToken",
        (
            tokenDocument,
            changes,
            options,
            userId
        ) => {

            const isMovement =
                Object.hasOwn(changes, "x")
                || Object.hasOwn(changes, "y")
                || Object.hasOwn(changes, "elevation");


            if (!isMovement) {

                return true;

            }


            const actor =
                tokenDocument.actor;


            if (!actor) {

                return true;

            }


            const combat =
                game.combat;


            if (!combat) {

                return true;

            }


            const combatant =
                combat.combatants.find(
                    candidate =>
                        candidate.actor?.id
                        === actor.id
                );


            if (!combatant) {

                return true;

            }


            if (
                GrappleService.canActorMove(
                    combat,
                    actor
                )
            ) {

                return true;

            }


            ui.notifications.warn(
                `${actor.name} est saisi et ne peut pas se déplacer.`
            );


            return false;

        }
    );

    

}