/**
 * Préparation d'une attaque de mêlée.
 *
 * Responsabilités :
 *
 * - valider qu'un workflow attend réellement
 *   la préparation de l'attaque ;
 * - retrouver attaquant, défenseur et arme ;
 * - construire le contexte de résolution ;
 * - récupérer les talents de l'attaquant ;
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
    resolveWeaponTalentType
} from "../domain/rules/weapon-talent-type.mjs";

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


/**
 * Bonus suggéré (p.196 du livre de règles) contre
 * une cible à terre.
 *
 * Comme pour le bonus de rafale en tir, ce bonus
 * n'est jamais appliqué automatiquement : il n'est
 * qu'une valeur suggérée, visible et modifiable,
 * dans le champ « Bonus manuel » de la fenêtre de
 * préparation. C'est toujours le joueur ou le MJ
 * qui décide de la valeur réellement utilisée pour
 * le jet.
 */
const PRONE_TARGET_SUGGESTED_BONUS =
    2;


/* ============================================================
 * TALENTS
 * ============================================================ */


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
 * ARME
 * ============================================================ */


function normalizeWeapon(
    weapon
) {

    if (!weapon) {

        return null;

    }


    const system =
        weapon.system
        ?? {};


    return {

        id:
            weapon.id,

        name:
            weapon.name,

        /*
         * Catégorie MÉTIER de l'arme (bladedWeapon, bluntWeapon,
         * unarmed...), comme dans le contexte de tir
         * (ranged-attack-preparation-service.mjs) : c'est ce que
         * comparent Arme de prédilection et Point faible. La
         * classification mécanique ("melee" | "ranged") reste
         * exposée par `isMeleeWeapon`.
         */
        category:
            String(
                system.weaponCategory
                ?? ""
            ).trim()
            || null,

        /*
         * Type d'arme pour Spécialiste en armement
         * ("melee" | "ranged" | "heavy"), déduit de l'arme.
         */
        type:
            resolveWeaponTalentType({
                category: system.category,
                heavy: system.heavy === true
            }),

        isMeleeWeapon:
            system.category === "melee"
            || system.weaponType === "melee"
            || system.type === "melee"
            || system.isMeleeWeapon === true,

        metadata: {

            equipped:
                system.equipped === true,

            broken:
                system.broken === true

        }

    };

}



/* ============================================================
 * SERVICE
 * ============================================================ */


export class MeleeAttackPreparationService {


    /**
     * Construit la préparation de l'attaque.
     *
     * Le workflow doit être en :
     *
     *     attack-preparation
     */
    static create(
        combat,
        workflow,
        {
            circumstances = [],
            effects = [],
            equipmentModifiers = [],
            manualBonus = null,
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
         * Le Combat reste la source de vérité.
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
                .isAwaitingAttackPreparation
        ) {

            throw new Error(
                "Ce workflow n'attend pas la préparation de l'attaque."
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


        const weapon =
            MeleeAttackWorkflowService
                .getWeapon(
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


        if (!weapon) {

            throw new Error(
                "L'arme de l'attaque est introuvable."
            );

        }


        const talents =
            getActorTalents(
                attacker
            );


        const context =
            createActionResolutionContext({

                actionType:
                    ACTION_RESOLUTION_TYPES
                        .MELEE_ATTACK,

                actorId:
                    attacker.id,

                opponentId:
                    defender.id,

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
                        defender.id,

                    defenseDecision:
                        currentWorkflow
                            .defense
                            ?.decision
                        ?? null,

                    hasBlockResult:
                        currentWorkflow
                            .hasBlockResult
                        === true

                }

            });

            
        /*
        * Le bonus manuel n'est jamais deviné
        * silencieusement à partir de rien : si
        * l'appelant en fournit un explicitement,
        * il reste prioritaire.
        *
        * Ce n'est qu'en son absence, et uniquement
        * si le défenseur est actuellement à terre,
        * qu'une valeur suggérée est proposée dans
        * le champ éditable de la fenêtre de
        * préparation.
        */
        const resolvedManualBonus =
            manualBonus
            ?? (
                defender.system
                    ?.conditions
                    ?.prone === true
                    ? PRONE_TARGET_SUGGESTED_BONUS
                    : 0
            );


        const preparation =
            ActionPreparationService
                .create(
                    attacker,
                    context,
                    {
                        talents,

                        circumstances,

                        effects,

                        equipmentModifiers,

                        manualBonus:
                            resolvedManualBonus,

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