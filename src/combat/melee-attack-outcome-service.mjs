import {
    resolveMeleeAttack
} from "../domain/rules/melee-attack-resolution.mjs";


/* ============================================================
 * UTILITAIRES
 * ============================================================ */


/**
 * Extrait le nombre de réussites
 * d'un résultat d'attaque YZE.
 */
function getAttackSuccesses(
    attackResult
) {

    const successes =
        attackResult?.successes
        ?? 0;


    if (
        !Number.isInteger(successes)
        || successes < 0
    ) {

        throw new Error(
            "Le nombre de réussites de l'attaque est invalide."
        );

    }


    return successes;

}


/**
 * Extrait les réussites d'un résultat
 * de blocage.
 *
 * rollMeleeBlock() retourne une enveloppe :
 *
 * {
 *     rolled: true,
 *     roll: ...
 * }
 *
 * Un blocage finalement impossible peut
 * également retourner :
 *
 * {
 *     rolled: false
 * }
 */
function getBlockData(
    blockResult
) {

    if (!blockResult) {

        return {

            attempted:
                false,

            successes:
                0

        };

    }


    if (
        blockResult.rolled
        === false
    ) {

        return {

            attempted:
                false,

            successes:
                0

        };

    }


    const successes =
        blockResult.roll
            ?.successes
        ?? 0;


    if (
        !Number.isInteger(successes)
        || successes < 0
    ) {

        throw new Error(
            "Le nombre de réussites du blocage est invalide."
        );

    }


    return {

        attempted:
            true,

        successes

    };

}


/* ============================================================
 * SERVICE
 * ============================================================ */


export class MeleeAttackOutcomeService {


    /**
     * Résout uniquement l'opposition :
     *
     * attaque
     * - blocage éventuel
     * = réussites nettes
     *
     * Aucun dégât.
     * Aucun éclat.
     * Aucun Document Foundry modifié.
     */
    static resolve({
        attackResult,
        blockResult = null,
        blockStuntResult = null
    } = {}) {

        if (!attackResult) {

            throw new TypeError(
                "Un résultat d'attaque est requis."
            );

        }


        const attackSuccesses =
            getAttackSuccesses(
                attackResult
            );


        const block =
            getBlockData(
                blockResult
            );


        /*
         * Le défenseur choisit À L'AVEUGLE, juste
         * après son jet de blocage, comment
         * répartir ses réussites de blocage
         * (annuler / contre-attaquer / désarmer —
         * p.197, « BLOQUER »), sans connaître
         * encore le résultat de l'attaque.
         *
         * Seule la part que le défenseur a
         * effectivement choisi d'affecter à
         * l'annulation (`cancelledSuccesses`)
         * réduit les réussites de l'attaquant.
         * Une réussite de blocage dépensée en
         * contre-attaque ou en désarmement
         * n'annule rien ici : ses effets seront
         * appliqués séparément, à la toute fin
         * du workflow.
         *
         * Lorsqu'aucune répartition n'a encore
         * été déclarée, on conserve le
         * comportement historique (toutes les
         * réussites de blocage annulent).
         */
        const cancellationInput =
            blockStuntResult
                ? Number(
                    blockStuntResult.effects
                        ?.cancelledSuccesses
                    ?? 0
                )
                : block.successes;


        /*
         * On réutilise volontairement
         * la règle métier existante.
         *
         * On ne recode PAS ici :
         *
         * attaque - blocage,
         * touche,
         * réussites excédentaires.
         */
        const resolution =
            resolveMeleeAttack({

                attackSuccesses,

                blockSuccesses:
                    cancellationInput,

                blockAttempted:
                    block.attempted

            });


        return {

            attackSuccesses,

            blockAttempted:
                block.attempted,

            blockSuccesses:
                block.successes,

            cancelledSuccesses:
                Number(
                    resolution.cancelledSuccesses
                    ?? 0
                ),

            /*
            * Le moteur de mêlée nomme cette valeur
            * effectiveSuccesses.
            *
            * Le workflow Chat l'expose sous le nom
            * netSuccesses pour rendre son sens explicite :
            *
            * réussites attaque
            * - réussites annulées par le blocage.
            */
            netSuccesses:
                Number(
                    resolution.effectiveSuccesses
                    ?? 0
                ),

            effectiveSuccesses:
                Number(
                    resolution.effectiveSuccesses
                    ?? 0
                ),

            hit:
                resolution.hit
                === true,

            blocked:
                resolution.blocked
                === true,

            extraSuccesses:
                Number(
                    resolution.extraSuccesses
                    ?? 0
                )

        };

    }


    /**
     * Variante pratique pour un workflow
     * déjà résolu.
     *
     * Le service accepte la structure
     * persistée du workflow sans dépendre
     * de Foundry.
     */
    static fromWorkflow(
        workflow
    ) {

        if (!workflow) {

            throw new TypeError(
                "Un workflow de mêlée est requis."
            );

        }


        if (!workflow.attackResult) {

            throw new Error(
                "Le workflow ne possède pas encore de résultat d'attaque."
            );

        }


        return this.resolve({

            attackResult:
                workflow.attackResult,

            blockResult:
                workflow.blockResult
                ?? null

        });

    }

}