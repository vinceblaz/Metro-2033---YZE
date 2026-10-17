import {
    COMBAT_ACTIONS
} from "../domain/rules/combat-actions.mjs";

import {
    CombatActionService
} from "./combat-action-service.mjs";

import {
    GrappleService
} from "./grapple-service.mjs";


export class CombatMovementService {


    static getMovementAction(
        combat,
        actor
    ) {

        if (!actor) {

            throw new TypeError(
                "Un Actor est nécessaire."
            );

        }


        /*
         * Hors combat :
         * aucune économie d'action.
         */
        if (!combat) {

            return null;

        }


        const combatant =
            CombatActionService.getCombatant(
                combat,
                actor
            );


        /*
         * Actor hors du combat courant.
         */
        if (!combatant) {

            return null;

        }


        /*
         * Une cible saisie ne peut pas
         * se déplacer.
         */
        if (
            !GrappleService.canActorMove(
                combat,
                actor
            )
        ) {

            return {
                allowed: false,

                actionId: null,

                cost: null,

                reason:
                    "grappled"
            };

        }


        /*
         * Un Actor à terre doit ramper.
         *
         * Ramper est une action lente.
         */
        if (
            actor.system?.conditions
                ?.prone
            === true
        ) {

            return {
                allowed:
                    CombatActionService
                        .canActorPerform(
                            combat,
                            actor,
                            COMBAT_ACTIONS
                                .CRAWL
                                .id
                        ),

                actionId:
                    COMBAT_ACTIONS
                        .CRAWL
                        .id,

                cost:
                    COMBAT_ACTIONS
                        .CRAWL
                        .cost,

                reason:
                    "prone"
            };

        }


        /*
         * Déplacement normal :
         * action rapide.
         *
         * La retraite sera branchée plus tard,
         * lorsque la notion d'ennemi au contact
         * sera disponible.
         */
        return {

            allowed:
                CombatActionService
                    .canActorPerform(
                        combat,
                        actor,
                        COMBAT_ACTIONS
                            .MOVE
                            .id
                    ),

            actionId:
                COMBAT_ACTIONS
                    .MOVE
                    .id,

            cost:
                COMBAT_ACTIONS
                    .MOVE
                    .cost,

            reason:
                null

        };

    }


    static async spendMovementAction(
        combat,
        actor
    ) {

        const movement =
            this.getMovementAction(
                combat,
                actor
            );


        /*
         * Hors combat ou Actor hors Combat :
         * aucun coût.
         */
        if (!movement) {

            return null;

        }


        if (!movement.allowed) {

            if (
                movement.reason
                === "grappled"
            ) {

                throw new Error(
                    `${actor.name} est saisi et ne peut pas se déplacer.`
                );

            }


            throw new Error(
                `${actor.name} ne dispose pas de l'action nécessaire pour se déplacer.`
            );

        }


        return CombatActionService
            .spendActorAction(
                combat,
                actor,
                movement.actionId
            );

    }

}