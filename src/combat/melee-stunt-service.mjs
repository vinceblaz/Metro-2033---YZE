import { resolveKnockdownChoice }
    from "../domain/rules/knockdown-choice.mjs";

import { resolvePushTarget }
    from "../domain/rules/push-target.mjs";

//import { resolveGrapple }
  //  from "../domain/rules/grapple.mjs";

import { InitiativeSwapService }
    from "./initiative-swap-service.mjs";   
    
import { GrappleService }
    from "./grapple-service.mjs";    


export class MeleeStuntService {

    static async resolve({
        attacker,
        target,
        attackResolution,
        knockdownMode = null,
        disarmItem = null,
        combat = game.combat
    } = {}) {

        if (!attacker) {
            throw new TypeError(
                "Un attaquant est nécessaire."
            );
        }


        if (!target) {
            throw new TypeError(
                "Une cible est nécessaire."
            );
        }


        if (!attackResolution) {
            throw new TypeError(
                "Une résolution d'attaque est nécessaire."
            );
        }


        if (
            attacker.id
            === target.id
        ) {
            throw new Error(
                "L'attaquant et la cible doivent être différents."
            );
        }


        const effects =
            attackResolution.pendingEffects
            ?? {};


        const result = {

            swapInitiative:
                null,

            disarm:
                null,

            knockdown:
                null,

            grapple:
                null

        };


        // ============================================================
        // 1. ÉCHANGE D'INITIATIVE
        //
        // Nous conservons volontairement cet effet comme
        // pending à ce niveau. La persistance dans Combat
        // est déjà la responsabilité d'InitiativeSwapService.
        // ============================================================

        if (
            effects.swapInitiative
            === true
        ) {

            if (!combat) {

                result.swapInitiative = {
                    scheduled:
                        false,

                    applied:
                        false,

                    pending:
                        true,

                    reason:
                        "combat-required",

                    attackerId:
                        attacker.id,

                    targetId:
                        target.id
                };

            }

            else {

                result.swapInitiative =
                    await InitiativeSwapService
                        .scheduleSwap(
                            combat,
                            attacker,
                            target
                        );

            }

        }


        // ============================================================
        // 2. DÉSARMEMENT
        // ============================================================

        if (
            effects.disarm
            === true
        ) {

            if (!disarmItem) {

                result.disarm = {

                    applied:
                        false,

                    pending:
                        true,

                    reason:
                        "disarm-item-required"
                };

            }

            else {

                result.disarm =
                    await target.applyDisarm(
                        disarmItem
                    );

            }

        }


        // ============================================================
        // 3. RENVERSEMENT / REPOUSSER
        // ============================================================

        if (
            effects.knockdown
            === true
        ) {

            const choice =
                resolveKnockdownChoice({
                    target, 
                    mode:
                        knockdownMode
                });


            /*
             * Aucun choix n'a encore été fourni :
             * l'interface devra demander
             * "mettre au sol" ou "repousser".
             */
            if (
                choice.pending
                === true
            ) {

                result.knockdown =
                    choice;

            }

            else if (
                choice.applyProne
                === true
            ) {

                const prone =
                    await target.applyKnockdown();


                result.knockdown = {
                    ...choice,

                    applied:
                        true,

                    pending:
                        false,

                    result:
                        prone
                };

            }

            else if (
                choice.requiresTokenMovement
                === true
            ) {

                const push =
                    resolvePushTarget({
                        attacker,
                        target
                    });


                result.knockdown = {
                    ...choice,
                    ...push
                };

            }

        }


        // ============================================================
        // 4. SAISIE
        // ============================================================

        if (
            effects.grapple
            === true
        ) {

            if (!combat) {

                result.grapple = {
                    established:
                        false,

                    pending:
                        true,

                    reason:
                        "combat-required"
                };

            }

            else {

                result.grapple =
                    await GrappleService.establish({
                        combat,
                        attacker,
                        target,
                        disarmItem
                    });

            }

        }


        // ============================================================
        // 5. RÉSULTAT
        // ============================================================

        return {

            attacker: {
                id:
                    attacker.id,

                name:
                    attacker.name
            },

            target: {
                id:
                    target.id,

                name:
                    target.name
            },

            requestedEffects: {
                swapInitiative:
                    effects.swapInitiative
                    === true,

                disarm:
                    effects.disarm
                    === true,

                knockdown:
                    effects.knockdown
                    === true,

                grapple:
                    effects.grapple
                    === true
            },

            effects:
                result

        };

    }

}