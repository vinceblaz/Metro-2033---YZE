/**
 * Gestion de la représentation Chat
 * d'un workflow d'attaque de mêlée.
 *
 * Ce module :
 *
 * - construit le ViewModel ;
 * - rend le template Handlebars ;
 * - crée le ChatMessage ;
 * - retrouve la référence workflow d'un message.
 *
 * Il ne contient aucune règle de combat.
 */


import {
    htmlToPlainText
} from "../domain/rules/embedded-item-tooltip.mjs";

import {
    summarizeRollOutcome
} from "../domain/rules/roll-outcome-summary.mjs";

import {
    summarizeRollDecisions
} from "../domain/rules/roll-decisions-summary.mjs";

import {
    resolveVicieuseFollowUp
} from "../domain/rules/vicieuse-follow-up.mjs";

import {
    summarizeMeleeAppliedEffects,
    summarizeMeleeStunts
} from "../domain/rules/applied-effects-summary.mjs";

import {
    relayMeleeMessageRefresh
} from "./melee-workflow-relay.mjs";

import {
    MELEE_ATTACK_WORKFLOW_STATES,
    MELEE_DEFENSE_DECISIONS,
    MELEE_APPLICATION_STEP_KEYS
} from "./melee-attack-workflow.mjs";


import {
    MeleeAttackWorkflowService
} from "./melee-attack-workflow-service.mjs";


import {
    MeleeAttackOutcomeService
} from "./melee-attack-outcome-service.mjs";


import {
    MeleeAttackApplicationPlanService
} from "./melee-attack-application-plan-service.mjs";


const SYSTEM_ID =
    "metro-2033-yze";


const MESSAGE_FLAG =
    "meleeAttackWorkflow";


const TEMPLATE =
    `systems/${SYSTEM_ID}/templates/chat/melee-attack.hbs`;


/* ============================================================
 * HELPERS
 * ============================================================ */


/**
 * Retourne le nombre de réussites contenu
 * dans un résultat de jet.
 *
 * Le résultat peut être :
 *
 * - un YZEResult en mémoire ;
 * - une représentation persistée ;
 * - une enveloppe contenant roll.
 */
function getSuccesses(
    result
) {

    if (!result) {

        return 0;

    }


    return Number(
        result.successes
        ?? result.roll?.successes
        ?? 0
    );

}


/**
 * Vérifie si l'utilisateur courant possède
 * réellement l'Actor.
 *
 * Le GM est considéré autorisé par Foundry,
 * conformément au modèle de permissions
 * Document.
 */
function canUserControlActor(
    actor
) {

    if (!actor) {

        return false;

    }


    return (
        game.user.isGM
        || actor.testUserPermission(
            game.user,
            CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
        )
    );

}


/**
 * Normalise le résultat persisté des éclats
 * exclusivement pour la présentation.
 */
function createStuntViewModel(
    stuntResult
) {

    if (!stuntResult) {

        return {

            resolved:
                false,

            available:
                0,

            spent:
                0,

            remaining:
                0,

            selections:
                [],

            hasSelections:
                false,

            effects: {

                vigorDamage:
                    0,

                agilityDamage:
                    0,

                swapInitiative:
                    false,

                disarm:
                    false,

                knockdown:
                    false,

                grapple:
                    false

            }

        };

    }


    const selections =
        Array.isArray(
            stuntResult.selections
        )
            ? stuntResult.selections
            : [];


    return {

        resolved:
            true,

        available:
            Number(
                stuntResult.available
                ?? 0
            ),

        spent:
            Number(
                stuntResult.spent
                ?? 0
            ),

        remaining:
            Number(
                stuntResult.remaining
                ?? 0
            ),

        selections,

        hasSelections:
            selections.length > 0,

        effects: {

            vigorDamage:
                Number(
                    stuntResult.effects
                        ?.vigorDamage
                    ?? 0
                ),

            agilityDamage:
                Number(
                    stuntResult.effects
                        ?.agilityDamage
                    ?? 0
                ),

            swapInitiative:
                stuntResult.effects
                    ?.swapInitiative
                === true,

            disarm:
                stuntResult.effects
                    ?.disarm
                === true,

            knockdown:
                stuntResult.effects
                    ?.knockdown
                === true,

            grapple:
                stuntResult.effects
                    ?.grapple
                === true

        }

    };

}


/**
 * Normalise une ligne de résultat
 * de dégradation de Protection.
 */
function createProtectionAllocationViewModel(
    allocation
) {

    if (
        !allocation
        || typeof allocation !== "object"
    ) {

        return null;

    }


    return {

        target:
            allocation.target
            ?? null,

        itemId:
            allocation.itemId
            ?? null,

        itemName:
            allocation.itemName
            ?? "Protection",

        requestedDamage:
            Number(
                allocation.requestedDamage
                ?? 0
            ),

        previous:
            Number(
                allocation.previous
                ?? 0
            ),

        current:
            Number(
                allocation.current
                ?? 0
            ),

        damage:
            Number(
                allocation.damage
                ?? 0
            ),

        broken:
            allocation.broken
            === true,

        resilienceLost:
            allocation.resilienceLost
            === true

    };

}


/**
 * Construit l'état de présentation
 * de la dégradation des protections.
 *
 * IMPORTANT :
 *
 * aucune règle de distribution n'est
 * recalculée ici.
 *
 * La seule source de vérité métier reste
 * MeleeAttackApplicationPlanService.
 */
function createProtectionDamageViewModel(
    workflow,
    defender
) {

    const empty = {

        available:
            false,

        required:
            false,

        resolved:
            false,

        pending:
            false,

        requiresAllocation:
            false,

        canAllocate:
            false,

        damage:
            0,

        totalProtection:
            0,

        protections:
            [],

        result:
            null,

        applied:
            false,

        automatic:
            false,

        reason:
            null,

        requestedDamage:
            0,

        appliedDamage:
            0,

        overflow:
            0,

        allocations:
            [],

        hasAllocations:
            false

    };


    /*
     * La dégradation d'une Protection
     * n'est présentée qu'une fois
     * le jet de Protection résolu.
     */
    if (
        workflow.state
        !== MELEE_ATTACK_WORKFLOW_STATES
            .PROTECTION_RESOLVED
        && workflow.state
        !== MELEE_ATTACK_WORKFLOW_STATES
            .COMPLETED
    ) {

        return empty;

    }


    const protectionResult =
        workflow.protection
            ?.result
        ?? null;


    if (!protectionResult) {

        return empty;

    }


    /* ========================================================
     * RÉSULTAT D'APPLICATION DÉJÀ PERSISTÉ
     * ======================================================== */


    /*
     * Le ledger est prioritaire.
     *
     * Une fois l'étape traitée,
     * le Chat ne doit plus recalculer
     * ce qui aurait dû se produire.
     *
     * Il affiche uniquement
     * le résultat historique.
     */
    const applicationResult =
        workflow.getApplicationStep?.(
            MELEE_APPLICATION_STEP_KEYS
                .PROTECTION_DAMAGE
        )
        ?? workflow.application
            ?.steps
            ?.[
                MELEE_APPLICATION_STEP_KEYS
                    .PROTECTION_DAMAGE
            ]
        ?? null;


    if (applicationResult) {

        const allocations =
            Array.isArray(
                applicationResult.allocations
            )
                ? applicationResult.allocations
                    .map(
                        allocation =>
                            createProtectionAllocationViewModel(
                                allocation
                            )
                    )
                    .filter(Boolean)
                : [];


        return {

            ...empty,

            available:
                true,

            required:
                Number(
                    applicationResult.requestedDamage
                    ?? 0
                ) > 0,

            resolved:
                true,

            pending:
                false,

            requiresAllocation:
                false,

            canAllocate:
                false,

            result:
                applicationResult,

            applied:
                applicationResult.applied
                === true,

            automatic:
                applicationResult.automatic
                === true,

            reason:
                applicationResult.reason
                ?? null,

            requestedDamage:
                Number(
                    applicationResult.requestedDamage
                    ?? 0
                ),

            appliedDamage:
                Number(
                    applicationResult.appliedDamage
                    ?? 0
                ),

            overflow:
                Number(
                    applicationResult.overflow
                    ?? 0
                ),

            allocations,

            hasAllocations:
                allocations.length > 0

        };

    }


    /* ========================================================
     * PLAN MÉTIER
     * ======================================================== */


    /*
     * L'étape n'est pas encore appliquée.
     *
     * Le service de plan détermine
     * ce qui doit être traité.
     *
     * Ce service est pur :
     * aucune mutation d'Actor ou d'Item.
     */
    const plan =
        MeleeAttackApplicationPlanService.resolve({

            consequences:
                workflow.consequences
                    ?.result,

            protection:
                protectionResult

        });


    const degradation =
        plan.protection
            ?.degradation
        ?? null;


    if (!degradation) {

        return empty;

    }


    const amount =
        Number(
            degradation.amount
            ?? 0
        );


    const required =
        degradation.required
        === true
        && amount > 0;


    if (!required) {

        return {

            ...empty,

            available:
                true,

            required:
                false,

            resolved:
                false,

            pending:
                true,

            damage:
                0

        };

    }


    /* ========================================================
     * PROTECTIONS RÉELLEMENT DISPONIBLES
     * ======================================================== */


    /*
     * Contrat réel du plan :
     *
     * availableTargets = [
     *     "body",
     *     "helmet"
     * ]
     *
     * Il s'agit d'identifiants métier,
     * pas de références d'Items.
     */
    const availableTargets =
        Array.isArray(
            degradation.availableTargets
        )
            ? degradation.availableTargets
            : [];


    /*
     * Les références d'Items ayant participé
     * au jet sont persistées dans :
     *
     * protectionResult.source.bodyArmor
     * protectionResult.source.helmet
     *
     * Elles nous permettent d'éviter
     * de sélectionner arbitrairement
     * une autre armure de l'Actor.
     */
    const protectionSource =
        protectionResult.source
        ?? null;


    /*
     * On reconstruit uniquement
     * les protections autorisées par
     * le plan métier.
     *
     * Leur valeur actuelle est relue
     * sur les Embedded Items du défenseur.
     */
    const protections =
        availableTargets
            .map(
                target => {

                    let sourceReference =
                        null;


                    if (
                        target === "body"
                    ) {

                        sourceReference =
                            protectionSource
                                ?.bodyArmor
                            ?? null;

                    }
                    else if (
                        target === "helmet"
                    ) {

                        sourceReference =
                            protectionSource
                                ?.helmet
                            ?? null;

                    }
                    else {

                        return null;

                    }


                    const itemId =
                        sourceReference
                            ?.itemId
                        ?? null;


                    if (!itemId) {

                        return null;

                    }


                    const item =
                        defender.items.get(
                            itemId
                        )
                        ?? null;


                    if (!item) {

                        return null;

                    }


                    const current =
                        Number(
                            item.system
                                ?.protection
                                ?.current
                            ?? 0
                        );


                    if (
                        !Number.isFinite(
                            current
                        )
                        || current <= 0
                    ) {

                        return null;

                    }


                    return {

                        target,

                        itemId:
                            item.id,

                        itemName:
                            item.name,

                        current

                    };

                }
            )
            .filter(Boolean);


    const totalProtection =
        protections.reduce(
            (
                total,
                protection
            ) =>
                total
                + protection.current,
            0
        );


    /* ========================================================
     * BESOIN D'UNE RÉPARTITION MANUELLE
     * ======================================================== */


    /*
     * Règle validée :
     *
     * aucune Protection disponible
     * → application automatique ;
     *
     * une seule Protection
     * → application automatique ;
     *
     * plusieurs Protections et
     * dégâts >= Protection totale
     * → destruction automatique ;
     *
     * plusieurs Protections et
     * dégâts < Protection totale
     * → répartition manuelle.
     */
    const requiresAllocation =
        protections.length > 1
        && amount < totalProtection;


    return {

        ...empty,

        available:
            true,

        required:
            true,

        resolved:
            false,

        pending:
            true,

        requiresAllocation,

        canAllocate:
            requiresAllocation
            && canUserControlActor(
                defender
            ),

        damage:
            amount,

        totalProtection,

        protections

    };

}


/* ============================================================
 * CHAT
 * ============================================================ */


export class MeleeAttackChat {


    /**
     * Transforme un workflow en données exclusivement
     * destinées à la présentation.
     */
    static createViewModel(
        workflow
    ) {

        if (!workflow) {

            throw new TypeError(
                "Un workflow de mêlée est requis."
            );

        }


        /* ====================================================
         * DOCUMENTS
         * ==================================================== */


        const attacker =
            MeleeAttackWorkflowService
                .getAttacker(
                    workflow
                );


        const defender =
            MeleeAttackWorkflowService
                .getDefender(
                    workflow
                );


        const weapon =
            MeleeAttackWorkflowService
                .getWeapon(
                    workflow
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
                "L'arme du workflow est introuvable."
            );

        }


        /* ====================================================
         * ÉTAT DU WORKFLOW
         * ==================================================== */


        const defenseDecision =
            workflow.defense?.decision
            ?? null;


        const blockResult =
            workflow.defense?.result
            ?? null;


        const attackResult =
            workflow.attack?.result
            ?? null;


        const stuntResult =
            workflow.stunts?.result
            ?? null;


        const defenseResolved =
            defenseDecision
                === MELEE_DEFENSE_DECISIONS.BLOCK
            && Boolean(
                blockResult
            );


        const defenseDeclined =
            defenseDecision
                === MELEE_DEFENSE_DECISIONS.DECLINE;


        const attackResolved =
            Boolean(
                attackResult
            );

        const attackPushCount =
            Number(
                attackResult?.pushCount
                ?? 0
            );


        const attackFinalized =
            workflow.isAttackFinalized
            === true;


        const attackCanPush =
            attackResolved
            && !attackFinalized
            && workflow.state
                === MELEE_ATTACK_WORKFLOW_STATES
                    .ATTACK_RESOLVED
            && attackPushCount < 2
            && canUserControlActor(
                attacker
            );


        const attackCanFinalize =
            attackResolved
            && !attackFinalized
            && workflow.state
                === MELEE_ATTACK_WORKFLOW_STATES
                    .ATTACK_RESOLVED
            && canUserControlActor(
                attacker
            );           


        const completed =
            workflow.state
                === MELEE_ATTACK_WORKFLOW_STATES
                    .COMPLETED;


        /* ====================================================
         * RÉSOLUTION ATTAQUE / BLOCAGE
         * ==================================================== */


        const outcome =
            attackResolved
            && attackFinalized
                ? MeleeAttackOutcomeService.resolve({
                    attackResult,
                    blockResult
                })
                : null;


        const netSuccesses =
            Number(
                outcome?.netSuccesses
                ?? 0
            );


        const hit =
            outcome?.hit
            === true;


        const extraSuccesses =
            Number(
                outcome?.extraSuccesses
                ?? 0
            );


        const canChooseStunts =
            workflow.state
                === MELEE_ATTACK_WORKFLOW_STATES
                    .ATTACK_RESOLVED
            && attackResolved
            && hit
            && extraSuccesses > 0;


        const stunts =
            createStuntViewModel(
                stuntResult
            );

        /* ====================================================
        * PROTECTION
        * ==================================================== */


        const protectionResult =
            workflow.protection
                ?.result
            ?? null;


        const protectionRequired =
            workflow.protectionRequired
            === true;


        const protectionAwaiting =
            workflow.isAwaitingProtection
            === true;


        const canResolveProtection =
            protectionAwaiting
            && canUserControlActor(
                defender
            );


        const incomingProtectionDamage =
            Number(
                workflow.consequences
                    ?.result
                    ?.protection
                    ?.incomingVigorDamage
                ?? 0
            );


        /* ====================================================
         * DÉGRADATION DE PROTECTION
         * ==================================================== */


        const protectionDamage =
            createProtectionDamageViewModel(
                workflow,
                defender
            );

        /* ====================================================
        * APPLICATION DES CONSÉQUENCES
        * ==================================================== */


        const applicationAvailable =
            workflow.state
                === MELEE_ATTACK_WORKFLOW_STATES
                    .CONSEQUENCES_RESOLVED
            || workflow.state
                === MELEE_ATTACK_WORKFLOW_STATES
                    .PROTECTION_RESOLVED;


        const applicationCompleted =
            completed
            || workflow.hasApplicationResult
                === true;


        const pendingApplicationSteps =
            Array.isArray(
                workflow.pendingApplicationSteps
            )
                ? workflow.pendingApplicationSteps
                : [];


        const canApplyConsequences =
            workflow.canApplyConsequences
            && !applicationCompleted
            && canUserControlActor(
                attacker
            );         

        /* ====================================================
         * VIEW MODEL
         * ==================================================== */


        return {

            workflowId:
                workflow.id,


            state:
                workflow.state,


            attacker: {

                id:
                    attacker.id,

                name:
                    attacker.name

            },


            defender: {

                id:
                    defender.id,

                name:
                    defender.name

            },


            /*
             * Détail des effets réellement appliqués (dégâts,
             * initiative, désarmement...), lu dans le journal
             * d'application du workflow.
             */
            appliedEffects:
                summarizeMeleeAppliedEffects(
                    workflow.application?.steps,
                    {
                        attackerName:
                            attacker.name,

                        defenderName:
                            defender.name
                    }
                ),


            weapon: {

                id:
                    weapon.id,

                name:
                    weapon.name,

                special:
                    htmlToPlainText(
                        weapon.system?.special
                        ?? ""
                    )

            },

            stuntLines:
                summarizeMeleeStunts(
                    stunts
                ),

            /*
             * Traits de Créature de l'attaquant (rappel des
             * règles du livre des Monstres applicables).
             */
            attackerTraits:
                attacker.items
                    .filter(
                        item =>
                            item.type === "talent"
                            && String(
                                item.system?.key ?? ""
                            ).startsWith(
                                "creature-trait-"
                            )
                    )
                    .map(
                        item => ({
                            name:
                                item.name,
                            effect:
                                htmlToPlainText(
                                    item.system?.effect
                                    ?? ""
                                )
                        })
                    ),

            /*
             * Trait de Créature « Vicieuse » : morsure proposée à
             * la suite d'une attaque de griffes réussie (MJ
             * uniquement, une seule fois par attaque).
             */
            vicieuse:
                (
                    completed
                    && game.user.isGM
                    && !game.combat?.getFlag?.(
                        "metro-2033-yze",
                        `vicieuseUsed.${workflow.id}`
                    )
                )
                    ? resolveVicieuseFollowUp({
                        traitKeys:
                            attacker.items
                                .filter(
                                    item =>
                                        item.type === "talent"
                                )
                                .map(
                                    item =>
                                        item.system?.key
                                ),
                        usedWeaponName:
                            weapon.name,
                        hit,
                        weapons:
                            attacker.items
                                .filter(
                                    item =>
                                        item.type === "weapon"
                                )
                                .map(
                                    item => ({
                                        id: item.id,
                                        name: item.name,
                                        category:
                                            item.system?.category,
                                        canAttack:
                                            item.system?.canAttack
                                            === true
                                    })
                                )
                    })
                    : {
                        available: false
                    },


            /* ------------------------------------------------
             * DÉFENSE
             * ------------------------------------------------ */


            defense: {

                awaitingDecision:
                    workflow.state
                        === MELEE_ATTACK_WORKFLOW_STATES
                            .AWAITING_DEFENSE,

                preparingBlock:
                    workflow.state
                        === MELEE_ATTACK_WORKFLOW_STATES
                            .BLOCK_PREPARATION,

                declined:
                    defenseDeclined,

                resolved:
                    defenseResolved,

                decision:
                    defenseDecision,

                successes:
                    getSuccesses(
                        blockResult
                    ),

                details: [
                    ...summarizeRollDecisions(
                        (blockResult?.roll ?? blockResult)?.context?.preparation
                    ),
                    ...summarizeRollOutcome(
                        blockResult?.roll
                        ?? blockResult
                    )
                ]

            },


            /* ------------------------------------------------
             * ATTAQUE
             * ------------------------------------------------ */


            attack: {

                preparing:
                    workflow.state
                        === MELEE_ATTACK_WORKFLOW_STATES
                            .ATTACK_PREPARATION,

                resolved:
                    attackResolved,

                successes:
                    getSuccesses(
                        attackResult
                    ),

                details: [
                    ...summarizeRollDecisions(
                        attackResult?.context?.preparation
                    ),
                    ...summarizeRollOutcome(
                        attackResult
                    )
                ],

                pushCount:
                    attackPushCount,

                canPush:
                    attackCanPush,

                finalized:
                    attackFinalized,

                canFinalize:
                    attackCanFinalize,                    

                canResolve:
                    workflow.state
                        === MELEE_ATTACK_WORKFLOW_STATES
                            .ATTACK_PREPARATION
                    && canUserControlActor(
                        attacker
                    )

            },


            /* ------------------------------------------------
             * RÉSULTAT DE L'OPPOSITION
             * ------------------------------------------------ */


            result: {

                completed,


                resolved:
                    Boolean(
                        outcome
                    ),


                attackSuccesses:
                    Number(
                        outcome?.attackSuccesses
                        ?? 0
                    ),


                blockAttempted:
                    outcome?.blockAttempted
                    === true,


                blockSuccesses:
                    Number(
                        outcome?.blockSuccesses
                        ?? 0
                    ),


                netSuccesses,


                hasNetSuccesses:
                    netSuccesses > 0,


                hit,


                missed:
                    Boolean(
                        outcome
                    )
                    && !hit,


                extraSuccesses,


                hasExtraSuccesses:
                    extraSuccesses > 0,


                canChooseStunts

            },


            /* ------------------------------------------------
             * ÉCLATS
             * ------------------------------------------------ */


            stunts: {

                ...stunts,


                workflowResolved:
                    workflow.state
                        === MELEE_ATTACK_WORKFLOW_STATES
                            .STUNTS_RESOLVED
                    || workflow.state
                        === MELEE_ATTACK_WORKFLOW_STATES
                            .CONSEQUENCES_RESOLVED
                    || workflow.state
                        === MELEE_ATTACK_WORKFLOW_STATES
                            .PROTECTION_RESOLVED
                    || completed

            },


            /* ------------------------------------------------
            * PROTECTION
            * ------------------------------------------------ */


            protection: {

                required:
                    protectionRequired,

                awaiting:
                    protectionAwaiting,

                resolved:
                    Boolean(
                        protectionResult
                    ),

                canResolve:
                    canResolveProtection,

                incomingDamage:
                    incomingProtectionDamage,

                result:
                    protectionResult,

                successes:
                    Number(
                        protectionResult
                            ?.successes
                        ?? 0
                    ),

                preventedDamage:
                    Number(
                        protectionResult
                            ?.totalPrevented
                        ?? 0
                    ),

                remainingDamage:
                    Number(
                        protectionResult
                            ?.remainingDamage
                        ?? incomingProtectionDamage
                    ),

                degradation:
                    Number(
                        protectionResult
                            ?.protectionDamage
                        ?? 0
                    )

            },            

            /* ------------------------------------------------
             * DÉGRADATION DES PROTECTIONS
             * ------------------------------------------------ */

        
            protectionDamage,


            /* ------------------------------------------------
            * APPLICATION DES CONSÉQUENCES
            * ------------------------------------------------ */


            application: {

                available:
                    applicationAvailable,

                completed:
                    applicationCompleted,

                canApply:
                    canApplyConsequences,

                pendingSteps:
                    pendingApplicationSteps,

                pendingCount:
                    pendingApplicationSteps.length,

                hasPendingSteps:
                    pendingApplicationSteps.length > 0

            }            

        };

    }


    /**
     * Produit le HTML du message.
     */
    static async render(
        workflow
    ) {

        const viewModel =
            this.createViewModel(
                workflow
            );


        return foundry
            .applications
            .handlebars
            .renderTemplate(
                TEMPLATE,
                viewModel
            );

    }


    /**
     * Compatibilité avec l'ancienne API.
     */
    static async createContent(
        workflow
    ) {

        return this.render(
            workflow
        );

    }


    /**
     * Crée le véritable ChatMessage associé
     * au workflow.
     */
    static async createMessage(
        combat,
        workflow
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


        const content =
            await this.render(
                workflow
            );


        return ChatMessage.create({

            content,

            flags: {

                [SYSTEM_ID]: {

                    [MESSAGE_FLAG]: {

                        combatId:
                            combat.id,

                        workflowId:
                            workflow.id

                    }

                }

            }

        });

    }


    /**
     * Met à jour le contenu d'un ChatMessage existant
     * à partir de l'état actuel du workflow.
     *
     * Si physicalRoll est fourni (jet physique Foundry
     * réellement effectué pour l'étape qui vient d'être
     * résolue, cf. actor.mjs#rollMeleeAttack), il est
     * attaché au ChatMessage via `rolls`, par cohérence
     * avec YZERollChat.createMessage/updateMessage :
     * le message reste notre carte habillée, mais Foundry
     * le reconnaît comme un véritable jet de dés (son,
     * reconnaissance par les modules tiers tels que
     * Dice So Nice).
     */
    static async updateMessage(
        message,
        workflow,
        {
            physicalRoll = null
        } = {}
    ) {

        if (!message) {

            throw new TypeError(
                "Un ChatMessage est requis."
            );

        }


        if (!workflow) {

            throw new TypeError(
                "Un workflow de mêlée est requis."
            );

        }


        const content =
            await this.render(
                workflow
            );


        const rolls =
            physicalRoll
                ? [physicalRoll]
                : undefined;


        /*
         * Un joueur (défenseur) ne peut pas modifier la carte créée
         * par un autre utilisateur : le MJ actif la recalcule depuis
         * le workflow stocké (aucun contenu n'est repris du joueur).
         */
        if (
            !game.user.isGM
            && !message.canUserModify(
                game.user,
                "update"
            )
        ) {

            await relayMeleeMessageRefresh(
                message
            );

            return message;

        }

        await message.update({

            content,

            ...(
                rolls
                    ? {
                        rolls,
                        sound:
                            CONFIG.sounds.dice
                    }
                    : {}
            )

        });


        return message;

    }


    /**
     * Retourne la référence persistée dans
     * les flags du ChatMessage.
     */
    static getWorkflowReference(
        message
    ) {

        if (!message) {

            return null;

        }


        return message.getFlag(
            SYSTEM_ID,
            MESSAGE_FLAG
        ) ?? null;

    }

}