import {
    resolveRangedAttackConsequences
} from "./ranged-attack-consequences.mjs";


/**
 * Franchit la frontière entre :
 *
 * - un résultat de jet encore ajustable ;
 * - un résultat stabilisé dont les conséquences
 *   peuvent être dérivées.
 *
 * Cette fonction reste pure :
 *
 * - aucun ChatMessage ;
 * - aucun Actor Foundry ;
 * - aucune mutation ;
 * - aucun accès aux flags.
 *
 * L'état `finalized` est fourni par l'orchestrateur.
 * Il ne fait pas partie du YZEResult.
 */
export function resolveFinalizedRangedAttack({
    rollResult,
    finalized = false,
    stuntAllocation = {}
} = {}) {

    if (!rollResult) {

        throw new TypeError(
            "Un résultat de jet est requis."
        );

    }


    if (
        rollResult.context
            ?.attack
            ?.type
        !== "ranged"
    ) {

        throw new Error(
            "Ce résultat n'est pas une attaque à distance."
        );

    }


    if (finalized !== true) {

        throw new Error(
            "Le résultat de l'attaque à distance doit être finalisé avant d'en résoudre les conséquences."
        );

    }


    return resolveRangedAttackConsequences({

        rollResult,

        stuntAllocation

    });

}