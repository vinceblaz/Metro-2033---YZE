/**
 * Préparation d'un blocage de mêlée.
 *
 * Responsabilités :
 *
 * - valider qu'un workflow attend réellement
 *   la préparation d'un blocage ;
 * - retrouver attaquant et défenseur ;
 * - construire le contexte de résolution ;
 * - récupérer les talents du défenseur ;
 * - produire une ActionModifierPreparation.
 *
 * Ce service :
 *
 * - n'affiche aucune UI ;
 * - ne lance aucun dé ;
 * - ne consomme aucune action ;
 * - ne modifie aucun Document Foundry.
 */


import {
    resolveTalentKey
} from "../domain/rules/talent-identity.mjs";

import {
    ACTION_RESOLUTION_TYPES,
    createActionResolutionContext
} from "../domain/rules/action-resolution-context.mjs";

import {
    MeleeAttackWorkflowService
} from "./melee-attack-workflow-service.mjs";

import {
    ActionPreparationService
} from "../action-resolution/action-preparation-service.mjs";




/* ============================================================
 * TALENTS
 * ============================================================ */


/**
 * Retourne les Items talent possédés par l'Actor.
 *
 * Le filtrage "ce talent est-il pertinent pour un blocage ?"
 * appartient ensuite aux règles de talents et à
 * ActionModifierService.
 */
function getActorTalents(
    actor
) {

    if (!actor) {

        return [];

    }


    return Array.from(
        actor.items ?? []
    )
        .filter(
            item =>
                item.type === "talent"
        )
        .map(
            item => ({

                id:
                    item.id,

                name:
                    item.name,

                key:
                    resolveTalentKey(item),

                level:
                    item.system?.level
                    ?? 1,

                configuration:
                    item.system?.configuration
                    ?? {}

            })
        );

}


/* ============================================================
 * ARME DU DÉFENSEUR
 * ============================================================ */


/**
 * Retrouve l'arme de mêlée équipée du défenseur.
 *
 * Pour l'instant nous utilisons la même convention
 * que le reste du système : Item type weapon +
 * information d'équipement dans system.
 *
 * La validation finale de la possibilité de bloquer
 * reste la responsabilité de rollMeleeBlock().
 */
function getEquippedMeleeWeapon(
    actor
) {

    if (!actor) {

        return null;

    }


    return (
        Array.from(
            actor.items ?? []
        )
            .find(
                item => {

                    if (
                        item.type !== "weapon"
                    ) {

                        return false;

                    }


                    const system =
                        item.system
                        ?? {};


                    const equipped =
                        system.equipped
                        === true;


                    const isMelee =
                        system.category
                            === "melee"
                        || system.weaponType
                            === "melee"
                        || system.type
                            === "melee"
                        || system.isMeleeWeapon
                            === true;


                    return (
                        equipped
                        && isMelee
                    );

                }
            )
        ?? null
    );

}


/**
 * Transforme un Item arme en données neutres
 * pour ActionResolutionContext.
 */
function normalizeWeapon(
    weapon
) {

    if (!weapon) {

        return null;

    }


    return {

        id:
            weapon.id,

        name:
            weapon.name,

        category:
            weapon.system?.category
            ?? null,

        type:
            weapon.system?.weaponType
            ?? weapon.system?.type
            ?? null,

        isMeleeWeapon:
            true

    };

}



/* ============================================================
 * SERVICE
 * ============================================================ */


export class MeleeBlockPreparationService {


    /**
     * Construit la préparation d'un blocage.
     *
     * Le workflow doit déjà être dans :
     *
     *     block-preparation
     *
     * Retour :
     *
     * {
     *   workflow,
     *   attacker,
     *   defender,
     *   weapon,
     *   context,
     *   preparation
     * }
     */
    static create(
        combat,
        workflow,
        {
            circumstances = [],
            effects = [],
            equipmentModifiers = [],
            manualBonus = 0,
            manualPenalty = 0
        } = {}
    ) {

        if (!combat) {

            throw new Error(
                "Un Combat Foundry est requis."
            );

        }


        if (!workflow) {

            throw new TypeError(
                "Un workflow de mêlée est requis."
            );

        }


        /*
         * Nous ne nous contentons pas de faire confiance
         * à l'objet passé par l'appelant.
         *
         * On relit le workflow persisté dans le Combat.
         */
        const currentWorkflow =
            MeleeAttackWorkflowService.get(
                combat,
                workflow.id
            );


        if (!currentWorkflow) {

            throw new Error(
                "Le workflow de mêlée est introuvable dans le Combat."
            );

        }


        if (
            !currentWorkflow
                .isAwaitingBlockPreparation
        ) {

            throw new Error(
                "Ce workflow n'attend pas la préparation d'un blocage."
            );

        }


        const attacker =
            MeleeAttackWorkflowService
                .getAttacker(
                    currentWorkflow
                );


        const defender =
            MeleeAttackWorkflowService
                .getDefender(
                    currentWorkflow
                );


        if (!attacker) {

            throw new Error(
                "L'attaquant du workflow est introuvable."
            );

        }


        if (!defender) {

            throw new Error(
                "Le défenseur du workflow est introuvable."
            );

        }


        const weapon =
            getEquippedMeleeWeapon(
                defender
            );


        const talents =
            getActorTalents(
                defender
            );


        const context =
            createActionResolutionContext({

                actionType:
                    ACTION_RESOLUTION_TYPES
                        .MELEE_BLOCK,

                actorId:
                    defender.id,

                opponentId:
                    attacker.id,

                attribute:
                    "vigor",

                skill:
                    "closeCombat",

                weapon:
                    normalizeWeapon(
                        weapon
                    ),

                metadata: {

                    combatId:
                        combat.id,

                    workflowId:
                        currentWorkflow.id,

                    attackerId:
                        attacker.id,

                    defenderId:
                        defender.id

                }

            });
        const preparation =
            ActionPreparationService
                .create(
                    defender,
                    context,
                    {
                        talents,

                        circumstances,

                        effects,

                        equipmentModifiers,

                        manualBonus,

                        manualPenalty
                    }
                );

             

        return {

            workflow:
                currentWorkflow,

            attacker,

            defender,

            weapon,

            talents,

            context,

            preparation

        };

    }


}