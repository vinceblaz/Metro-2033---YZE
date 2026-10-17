import {
    YZERollChat
} from "../foundry/chat/yze-roll-chat.mjs";

import {
    resolveFinalizedRangedAttack
} from "../domain/rules/ranged-attack-resolution.mjs";

import {
    createRangedAttackProtectionRequest,
    resolveRangedAttackProtection
} from "../domain/rules/ranged-attack-protection.mjs";



/**
 * Adaptateur Foundry pour la résolution
 * d'une attaque à distance finalisée.
 *
 * Cette classe ne contient aucune règle métier.
 *
 * Elle relie :
 *
 * - le ChatMessage ;
 * - le YZEResult stocké ;
 * - l'état de finalisation ;
 * - la frontière métier P4 -> P5.
 */
export class RangedAttackResolutionService {


    static resolveMessage(
        message,
        {
            stuntAllocation = {}
        } = {}
    ) {

        if (!message) {

            throw new TypeError(
                "Un message est requis pour résoudre une attaque à distance."
            );

        }


        const finalized =
            YZERollChat.isFinalized(
                message
            );


        if (!finalized) {

            throw new Error(
                "Le résultat de l'attaque à distance doit être finalisé avant d'en résoudre les conséquences."
            );

        }


        const rollResult =
            YZERollChat.getStoredResult(
                message
            );


        return resolveFinalizedRangedAttack({
            rollResult,
            finalized,
            stuntAllocation
        });

    }

    static resolveProtection({
        consequenceResult,
        target
    } = {}) {

        const request =
            createRangedAttackProtectionRequest(
                consequenceResult
            );


        if (
            request.required === true
            && !target
        ) {

            throw new TypeError(
                "Une cible est requise pour résoudre la Protection."
            );

        }


        const source =
            request.required === true
                ? target.getProtectionSource()
                : null;


        return resolveRangedAttackProtection({
            request,
            source
        });

    }


}

