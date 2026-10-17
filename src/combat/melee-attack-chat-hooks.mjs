/**
 * Interactions Chat du workflow d'attaque de mêlée.
 *
 * Responsabilités :
 *
 * - écouter les boutons des ChatMessages de mêlée ;
 * - retrouver le Combat et le workflow réels ;
 * - contrôler les permissions ;
 * - revalider l'état courant ;
 * - enregistrer la décision de défense ;
 * - préparer et résoudre un blocage ;
 * - préparer et lancer l'attaque ;
 * - gérer la sélection des éclats ;
 * - construire et persister les conséquences ;
 * - maintenir le ChatMessage synchronisé
 *   avec l'état réel du workflow.
 *
 * Ce module orchestre les services.
 * Il ne contient aucune règle métier.
 */


import {
    MeleeAttackChat
} from "./melee-attack-chat.mjs";


import {
    MeleeAttackWorkflowService
} from "./melee-attack-workflow-service.mjs";


import {
    MELEE_ATTACK_WORKFLOW_STATES,
    MELEE_DEFENSE_DECISIONS
} from "./melee-attack-workflow.mjs";


import {
    MeleeBlockPreparationService
} from "./melee-block-preparation-service.mjs";


import {
    MeleeAttackPreparationService
} from "./melee-attack-preparation-service.mjs";


import {
    MeleeAttackOutcomeService
} from "./melee-attack-outcome-service.mjs";


import {
    MeleeStuntResolutionService
} from "./melee-stunt-resolution-service.mjs";


import {
    MeleeAttackConsequenceService
} from "./melee-attack-consequence-service.mjs";


import {
    ActionModifierDialog
} from "../foundry/applications/action-modifier-dialog.mjs";


import {
    MeleeStuntDialog
} from "../foundry/applications/melee-stunt-dialog.mjs";


import {
    MeleeBlockStuntDialog,
    FoundryMeleeBlockStuntDialog
} from "../foundry/applications/melee-block-stunt-dialog.mjs";


import {
    GrappleService
} from "./grapple-service.mjs";


import {
    MeleeDamageApplicationService
} from "./melee-damage-application-service.mjs";


import {
    ProtectionDamageAllocationDialog
} from "../foundry/applications/protection-damage-allocation-dialog.mjs";

import {
    deserializeRollResult
} from "../foundry/chat/yze-roll-chat.mjs";

import {
    resolveAfflictionsForRoll
} from "../foundry/afflictions/afflictions-service.mjs";

import {
    resolveVicieuseFollowUp
} from "../domain/rules/vicieuse-follow-up.mjs";
import {
    adaptMeleeAttackContext
} from "../domain/rules/affliction-allocation.mjs";






/**
 * Instantané de la préparation d'un jet (difficulté, sources
 * cochées, totaux) conservé avec le résultat du jet, pour que le
 * Chat puisse transcrire les décisions prises.
 */
function snapshotPreparation(resolved) {

    return {
        base: foundry.utils.deepClone(resolved?.base ?? {}),
        sources: foundry.utils.deepClone(resolved?.sources ?? []),
        selectedSources: foundry.utils.deepClone(resolved?.selectedSources ?? []),
        difficulty: foundry.utils.deepClone(resolved?.difficulty ?? null),
        totals: foundry.utils.deepClone(resolved?.totals ?? {})
    };

}


/* ============================================================
 * ACTIONS CHAT
 * ============================================================ */


const CHAT_ACTIONS =
    Object.freeze({

        BLOCK:
            "melee-defense-block",

        DECLINE:
            "melee-defense-decline",

        RESOLVE_ATTACK:
            "melee-resolve-attack",

        PUSH_ATTACK:
            "melee-push-attack",

        FINALIZE_ATTACK:
            "melee-finalize-attack",            

        CHOOSE_STUNTS:
            "melee-choose-stunts",

        RESOLVE_PROTECTION:
                    "melee-resolve-protection",             

        ALLOCATE_PROTECTION_DAMAGE:
            "melee-allocate-protection-damage",

        APPLY_CONSEQUENCES:
            "melee-apply-consequences"

    });


/* ============================================================
 * UTILITAIRES
 * ============================================================ */


function getReferencedCombat(
    reference
) {

    if (
        !reference?.combatId
    ) {

        return null;

    }


    return (
        game.combats.get(
            reference.combatId
        )
        ?? null
    );

}


function getCurrentWorkflow(
    message
) {

    const reference =
        MeleeAttackChat
            .getWorkflowReference(
                message
            );


    if (!reference) {

        throw new Error(
            "Ce message n'est associé à aucun workflow de mêlée."
        );

    }


    const combat =
        getReferencedCombat(
            reference
        );


    if (!combat) {

        throw new Error(
            "Le Combat associé à cette attaque est introuvable."
        );

    }


    const workflow =
        MeleeAttackWorkflowService.get(
            combat,
            reference.workflowId
        );


    if (!workflow) {

        throw new Error(
            "Le workflow associé à cette attaque est introuvable."
        );

    }


    return {

        reference,

        combat,

        workflow

    };

}


async function refreshMessage(
    message
) {

    const {
        workflow
    } =
        getCurrentWorkflow(
            message
        );


    await MeleeAttackChat.updateMessage(
        message,
        workflow
    );


    return workflow;

}


/**
 * Calcule l'opposition à partir des résultats
 * réellement persistés dans le workflow.
 */
function resolveWorkflowOutcome(
    workflow
) {

    if (!workflow) {

        throw new TypeError(
            "Un workflow de mêlée est requis."
        );

    }


    const attackResult =
        workflow.attack?.result
        ?? null;


    if (!attackResult) {

        throw new Error(
            "Le workflow ne contient aucun résultat d'attaque."
        );

    }


    const blockResult =
        workflow.defense?.result
        ?? null;


    const blockStuntResult =
        workflow.blockStunts?.result
        ?? null;


    return (
        MeleeAttackOutcomeService.resolve({

            attackResult,

            blockResult,

            blockStuntResult

        })
    );

}


/**
 * Indique si l'attaque doit attendre
 * une sélection d'éclats.
 */
function shouldAwaitStunts(
    outcome
) {

    return (
        outcome?.hit === true
        && Number(
            outcome?.extraSuccesses
            ?? 0
        ) > 0
    );

}

/**
 * Finalise le résultat d'attaque actuellement
 * persisté puis poursuit automatiquement
 * jusqu'aux conséquences lorsqu'aucun choix
 * d'éclats n'est nécessaire.
 */
async function finalizeResolvedAttack(
    combat,
    workflow
) {

    const currentWorkflow =
        MeleeAttackWorkflowService.get(
            combat,
            workflow.id
        );


    if (!currentWorkflow) {

        throw new Error(
            "Le workflow de mêlée est introuvable."
        );

    }


    if (
        currentWorkflow.state
        !== MELEE_ATTACK_WORKFLOW_STATES
            .ATTACK_RESOLVED
    ) {

        throw new Error(
            "Cette attaque n'est pas en attente de finalisation."
        );

    }


    if (!currentWorkflow.hasAttackResult) {

        throw new Error(
            "Le workflow ne contient aucun résultat d'attaque."
        );

    }


    let resolvedWorkflow =
        await MeleeAttackWorkflowService
            .finalizeAttack(
                combat,
                currentWorkflow.id
            );


    const outcome =
        resolveWorkflowOutcome(
            resolvedWorkflow
        );


    if (
        !shouldAwaitStunts(
            outcome
        )
    ) {

        const consequenceResolution =
            await resolveAttackConsequences(
                combat,
                resolvedWorkflow
            );


        resolvedWorkflow =
            consequenceResolution.workflow;


        return {

            workflow:
                resolvedWorkflow,

            outcome,

            consequences:
                consequenceResolution
                    .consequences,

            awaitingStunts:
                false

        };

    }


    return {

        workflow:
            resolvedWorkflow,

        outcome,

        consequences:
            null,

        awaitingStunts:
            true

    };

}

/* ============================================================
 * PERMISSIONS
 * ============================================================ */


function updateButtonAvailability(
    html,
    workflow
) {

    const authorized =
        MeleeAttackWorkflowService
            .canUserDecideDefense(
                workflow,
                game.user
            );


    const buttons =
        html.querySelectorAll(
            [
                '[data-action="melee-defense-block"]',
                '[data-action="melee-defense-decline"]'
            ].join(",")
        );


    for (
        const button
        of buttons
    ) {

        button.disabled =
            !authorized
            || !workflow.isAwaitingDefense;

    }

}


function assertUserCanResolveAttack(
    combat,
    workflow
) {

    const attacker =
        MeleeAttackWorkflowService.getAttacker(
            workflow
        );


    if (!attacker) {

        throw new Error(
            "L'attaquant du workflow est introuvable."
        );

    }


    const allowed =
        game.user.isGM
        || attacker.testUserPermission(
            game.user,
            CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
        );


    if (!allowed) {

        throw new Error(
            "Seul le propriétaire de l'attaquant ou le MJ peut résoudre cette attaque."
        );

    }


    return attacker;

}


/* ============================================================
 * DÉCISION DE DÉFENSE
 * ============================================================ */


async function processDefenseDecision(
    message,
    decision
) {

    const {
        combat,
        workflow
    } =
        getCurrentWorkflow(
            message
        );


    if (
        !workflow.isAwaitingDefense
    ) {

        throw new Error(
            "La décision de défense a déjà été prise."
        );

    }


    MeleeAttackWorkflowService
        .assertUserCanDecideDefense(
            workflow,
            game.user
        );


    return (
        MeleeAttackWorkflowService
            .chooseDefense(
                combat,
                workflow.id,
                decision,
                {
                    user:
                        game.user
                }
            )
    );

}


/* ============================================================
 * PRÉPARATION / RÉSOLUTION DU BLOCAGE
 * ============================================================ */


async function resolveBlockPreparation(
    combat,
    workflow
) {

    const currentWorkflow =
        MeleeAttackWorkflowService.get(
            combat,
            workflow.id
        );


    if (!currentWorkflow) {

        throw new Error(
            "Le workflow de mêlée est introuvable."
        );

    }


    if (
        !currentWorkflow
            .isAwaitingBlockPreparation
    ) {

        throw new Error(
            "Le workflow n'attend plus la préparation du blocage."
        );

    }


    const blockData =
        MeleeBlockPreparationService.create(
            combat,
            currentWorkflow
        );


    const {
        defender,
        attacker,
        weapon: blockingItem,
        preparation
    } = blockData;


    if (!defender) {

        throw new Error(
            "Le défenseur est introuvable."
        );

    }


    const canPerformBlock =
        GrappleService.canActorPerformAction(
            combat,
            defender,
            "melee-block"
        );


    if (!canPerformBlock) {

        throw new Error(
            `${defender.name} ne peut pas bloquer dans son état actuel.`
        );

    }


    const resolvedPreparation =
        await ActionModifierDialog.prompt(
            preparation,
            {
                title:
                    `${defender.name} — Blocage`,

                confirmLabel:
                    "Bloquer"
            }
        );


    if (!resolvedPreparation) {

        return {

            cancelled:
                true,

            workflow:
                currentWorkflow,

            blockResult:
                null

        };

    }


    const blockTotals =
        resolvedPreparation.totals
        ?? {};

    /*
     * « Subir 1 Stress pour +3 dés » (livre, p.190) : ce bonus
     * n'est pas inclus dans `bonus` (contrat historique des
     * ActionModifier) ; il était ignoré pour le blocage.
     */
    const bonus =
        Number(
            resolvedPreparation.bonus
            ?? 0
        )
        + Number(
            blockTotals.stressBonus
            ?? 0
        );


    const penalty =
        resolvedPreparation.penalty
        ?? 0;


    const beforeRollWorkflow =
        MeleeAttackWorkflowService.get(
            combat,
            currentWorkflow.id
        );


    if (
        !beforeRollWorkflow
            ?.isAwaitingBlockPreparation
    ) {

        throw new Error(
            "Ce blocage a déjà été résolu ou n'est plus disponible."
        );

    }


    const blockResult =
        await defender.rollMeleeBlock({

            attackType:
                "weapon",

            blockable:
                true,

            blockingItem,

            attributeId:
                "vigor",

            bonus,

            penalty,

            extraStressDie:

                Number(

                    blockTotals.extraStressDie

                    ?? 0

                ),

            preparationContext:

                snapshotPreparation(

                    resolvedPreparation

                ),

            combat

        });


    const resolvedWorkflow =
        await MeleeAttackWorkflowService
            .resolveBlock(
                combat,
                beforeRollWorkflow.id,
                blockResult
            );


    /*
     * Éclats de blocage (p.197, « BLOQUER ») :
     *
     * pour chaque réussite de blocage, le défenseur
     * choisit MAINTENANT — à l'aveugle, sans connaître
     * le résultat de l'attaque — d'annuler une réussite
     * de l'attaquant, de contre-attaquer, ou de désarmer.
     *
     * La contre-attaque et le désarmement ne seront
     * appliqués qu'à la toute fin du workflow, en même
     * temps que les conséquences de l'attaquant.
     */
    let finalWorkflow =
        resolvedWorkflow;


    let blockStuntResult =
        null;


    if (
        finalWorkflow
            .isAwaitingBlockStunts
    ) {

        const blockSuccesses =
            blockResult?.rolled === true
                ? Number(
                    blockResult.roll
                        ?.successes
                    ?? 0
                )
                : 0;


        const blockWeaponDamage =
            Number(
                blockingItem?.system
                    ?.damage
                ?? 0
            );


        const chosenBlockStuntResult = {

            ...(
                await MeleeBlockStuntDialog.prompt({

                    blockSuccesses,

                    dialog:
                        FoundryMeleeBlockStuntDialog

                })
                ?? {

                    available:
                        blockSuccesses,

                    spent:
                        0,

                    remaining:
                        blockSuccesses,

                    selections:
                        [],

                    effects: {

                        cancelledSuccesses:
                            0,

                        counterAttack:
                            false,

                        disarm:
                            false

                    }

                }
            ),

            weaponDamage:
                blockWeaponDamage

        };


        const beforeBlockStuntsWorkflow =
            MeleeAttackWorkflowService.get(
                combat,
                finalWorkflow.id
            );


        if (
            beforeBlockStuntsWorkflow
                ?.isAwaitingBlockStunts
        ) {

            finalWorkflow =
                await MeleeAttackWorkflowService
                    .resolveBlockStunts(
                        combat,
                        beforeBlockStuntsWorkflow.id,
                        chosenBlockStuntResult
                    );


            blockStuntResult =
                chosenBlockStuntResult;

        }
        else {

            finalWorkflow =
                beforeBlockStuntsWorkflow
                ?? finalWorkflow;

        }

    }


    return {

        cancelled:
            false,

        workflow:
            finalWorkflow,

        blockResult,

        blockStuntResult,

        preparation:
            resolvedPreparation,

        attacker,

        defender

    };

}


/* ============================================================
 * PRÉPARATION / JET DE L'ATTAQUE
 * ============================================================ */


async function resolveAttackPreparation(
    combat,
    workflow
) {

    const currentWorkflow =
        MeleeAttackWorkflowService.get(
            combat,
            workflow.id
        );


    if (!currentWorkflow) {

        throw new Error(
            "Le workflow de mêlée est introuvable."
        );

    }


    if (
        currentWorkflow.state
        !== MELEE_ATTACK_WORKFLOW_STATES
            .ATTACK_PREPARATION
    ) {

        throw new Error(
            "Le workflow n'attend pas la préparation de l'attaque."
        );

    }


    const attackData =
        MeleeAttackPreparationService.create(
            combat,
            currentWorkflow
        );


    const {
        attacker,
        defender,
        weapon,
        preparation
    } = attackData;


    if (!attacker) {

        throw new Error(
            "L'attaquant est introuvable."
        );

    }


    if (!defender) {

        throw new Error(
            "Le défenseur est introuvable."
        );

    }


    if (!weapon) {

        throw new Error(
            "L'arme utilisée pour l'attaque est introuvable."
        );

    }


    const resolvedPreparation =
        await ActionModifierDialog.prompt(
            preparation,
            {
                title:
                    `${attacker.name} — Attaque de mêlée`,

                confirmLabel:
                    "Attaquer"
            }
        );


    if (!resolvedPreparation) {

        return {

            cancelled:
                true,

            workflow:
                currentWorkflow,

            attackRoll:
                null,

            attacker,

            defender,

            weapon

        };

    }


    const totals =
        resolvedPreparation.totals
        ?? {};


    const bonus =
        Number(
            resolvedPreparation.bonus
            ?? 0
        )
        +
        /*
        * « Subir 1 Stress pour +3 dés » (livre, p.190) :
        * resolvedPreparation.bonus (contrat historique des
        * ActionModifier) n'inclut pas ce bonus — cf. le même
        * correctif dans character-sheet.mjs.
        */
        Number(
            totals.stressBonus
            ?? 0
        );


    const penalty =
        resolvedPreparation.penalty
        ?? 0;


    const beforeRollWorkflow =
        MeleeAttackWorkflowService.get(
            combat,
            currentWorkflow.id
        );


    if (
        beforeRollWorkflow?.state
        !== MELEE_ATTACK_WORKFLOW_STATES
            .ATTACK_PREPARATION
    ) {

        throw new Error(
            "Cette attaque a déjà été résolue ou n'est plus disponible."
        );

    }


    /*
    * La cible de l'attaque ne doit jamais être relue
    * depuis game.user.targets à ce stade.
    *
    * Elle a été figée lors de la déclaration
    * de l'attaque et appartient désormais
    * au workflow persistant.
    */
    const defenderTokenId =
        beforeRollWorkflow
            .defender
            ?.tokenId
        ?? null;


    if (!defenderTokenId) {

        throw new Error(
            "Le workflow ne contient aucun Token défenseur."
        );

    }


    const target =
        canvas.tokens.get(
            defenderTokenId
        )
        ?? null;


    if (!target) {

        throw new Error(
            "Le Token cible de cette attaque est introuvable sur la scène."
        );

    }


    /*
    * La possibilité de blocage est celle
    * qui a été figée lors de la création
    * du workflow.
    *
    * On ne la redéduit pas au moment du jet.
    */
    const blockable =
        beforeRollWorkflow
            .defense
            ?.offered
        === true;


    const attackRoll =
        await attacker.rollMeleeAttack(
            weapon,
            {
                target,

                bonus,

                penalty,

                /*
                * « Subir 1 Stress pour +3 » (livre, p.190) :
                * cf. ActionModifierService.
                */
                extraStressDie:
                    Number(
                        totals.extraStressDie
                        ?? 0
                    ),

                blockable,

                preparationContext:
                    snapshotPreparation(
                        resolvedPreparation
                    ),
                combat

            }
        );


    return {

        cancelled:
            false,

        workflow:
            beforeRollWorkflow,

        attackRoll,

        preparation:
            resolvedPreparation,

        attacker,

        defender,

        weapon

    };

}


/* ============================================================
 * CONSÉQUENCES
 * ============================================================ */


/**
 * Construit puis persiste le plan complet
 * de conséquences d'une attaque.
 *
 * Aucun effet n'est encore appliqué aux Actors.
 */
async function resolveAttackConsequences(
    combat,
    workflow
) {

    const currentWorkflow =
        MeleeAttackWorkflowService.get(
            combat,
            workflow.id
        );


    if (!currentWorkflow) {

        throw new Error(
            "Le workflow de mêlée est introuvable."
        );

    }


    const allowedStates = [

        MELEE_ATTACK_WORKFLOW_STATES
            .ATTACK_RESOLVED,

        MELEE_ATTACK_WORKFLOW_STATES
            .STUNTS_RESOLVED

    ];


    if (
        !allowedStates.includes(
            currentWorkflow.state
        )
    ) {

        throw new Error(
            "Les conséquences ne peuvent pas être calculées dans l'état actuel du workflow."
        );

    }


    const outcome =
        resolveWorkflowOutcome(
            currentWorkflow
        );


    if (
        currentWorkflow.state
        === MELEE_ATTACK_WORKFLOW_STATES
            .ATTACK_RESOLVED
        && shouldAwaitStunts(
            outcome
        )
    ) {

        throw new Error(
            "Les éclats doivent être résolus avant les conséquences."
        );

    }


    const weapon =
        MeleeAttackWorkflowService.getWeapon(
            currentWorkflow
        );


    if (!weapon) {

        throw new Error(
            "L'arme utilisée pour cette attaque est introuvable."
        );

    }


    const weaponDamage =
        Number(
            weapon.system?.damage
            ?? 0
        );


    let stuntConsequences =
        null;


    if (
        currentWorkflow.state
        === MELEE_ATTACK_WORKFLOW_STATES
            .STUNTS_RESOLVED
    ) {

        const stuntResult =
            currentWorkflow.stunts?.result
            ?? null;


        if (!stuntResult) {

            throw new Error(
                "Le workflow indique des éclats résolus mais aucun résultat d'éclats n'est disponible."
            );

        }


        stuntConsequences =
            MeleeStuntResolutionService.resolve(
                stuntResult
            );

    }


    const consequenceResult =
        MeleeAttackConsequenceService.resolve({

            outcome,

            weaponDamage,

            stuntConsequences

        });


    const resolvedWorkflow =
        await MeleeAttackWorkflowService
            .resolveConsequences(
                combat,
                currentWorkflow.id,
                consequenceResult
            );


    return {

        workflow:
            resolvedWorkflow,

        outcome,

        stuntConsequences,

        consequences:
            consequenceResult,

        weapon

    };

}


/* ============================================================
 * CHOIX DES ÉCLATS
 * ============================================================ */


async function resolveStuntSelection(
    combat,
    workflow
) {

    const currentWorkflow =
        MeleeAttackWorkflowService.get(
            combat,
            workflow.id
        );


    if (!currentWorkflow) {

        throw new Error(
            "Le workflow de mêlée est introuvable."
        );

    }


    if (
        currentWorkflow.state
        !== MELEE_ATTACK_WORKFLOW_STATES
            .ATTACK_RESOLVED
    ) {

        throw new Error(
            "Cette attaque n'est plus en attente d'une sélection d'éclats."
        );

    }


    const outcome =
        resolveWorkflowOutcome(
            currentWorkflow
        );


    if (
        outcome.hit !== true
    ) {

        throw new Error(
            "Une attaque ratée ne permet pas de choisir des éclats."
        );

    }


    const extraSuccesses =
        Number(
            outcome.extraSuccesses
            ?? 0
        );


    if (
        extraSuccesses <= 0
    ) {

        throw new Error(
            "Cette attaque ne possède aucune réussite excédentaire."
        );

    }


    const stuntResult =
        await MeleeStuntDialog.prompt({

            extraSuccesses,

            title:
                "Choisir les éclats"

        });


    if (!stuntResult) {

        return {

            cancelled:
                true,

            workflow:
                currentWorkflow,

            stuntResult:
                null,

            consequences:
                null

        };

    }


    const beforePersistWorkflow =
        MeleeAttackWorkflowService.get(
            combat,
            currentWorkflow.id
        );


    if (
        beforePersistWorkflow?.state
        !== MELEE_ATTACK_WORKFLOW_STATES
            .ATTACK_RESOLVED
    ) {

        throw new Error(
            "Les éclats de cette attaque ont déjà été résolus."
        );

    }


    const stuntsWorkflow =
        await MeleeAttackWorkflowService
            .resolveStunts(
                combat,
                beforePersistWorkflow.id,
                stuntResult
            );


    const consequenceResolution =
        await resolveAttackConsequences(
            combat,
            stuntsWorkflow
        );


    return {

        cancelled:
            false,

        workflow:
            consequenceResolution.workflow,

        stuntResult,

        stuntConsequences:
            consequenceResolution
                .stuntConsequences,

        consequences:
            consequenceResolution
                .consequences,

        outcome:
            consequenceResolution
                .outcome

    };

}

/* ============================================================
 * AFFLICTIONS DU JET D'ATTAQUE (livre p.177)
 * ============================================================ */


/**
 * Répartition des afflictions du jet d'attaque, une fois les
 * dommages/effets entièrement résolus (workflow terminé).
 *
 * - Les éclats de mêlée sont choisis AVANT « Résoudre les
 *   dommages / effets » (MeleeStuntResolutionService.resolve est
 *   pur) : ce clic est donc l'unique point d'ouverture.
 * - Idempotence : clé « melee:<combat>:<workflow> » mémorisée dans
 *   un flag de l'Actor attaquant (cf. afflictions-service.mjs).
 * - Ne lève jamais : les dommages sont déjà appliqués.
 *
 * Dépend de l'API Foundry : non testée unitairement.
 */
async function resolveMeleeAttackAfflictions(
    combat,
    workflowId
) {

    try {

        const workflow =
            MeleeAttackWorkflowService.get(
                combat,
                workflowId
            );

        const storedAttackResult =
            workflow?.attack?.result
            ?? null;

        if (!storedAttackResult) {

            return null;

        }


        const result =
            deserializeRollResult(
                storedAttackResult
            );

        if (!result) {

            return null;

        }


        result.context =
            adaptMeleeAttackContext({
                context:
                    result.context,
                equipmentDice:
                    result.pool?.equipment
            });


        const attacker =
            MeleeAttackWorkflowService.getAttacker(
                workflow
            );

        const weaponName =
            result.context.weapon?.name
            ?? null;

        return await resolveAfflictionsForRoll({
            actor:
                attacker,
            result,
            rollKey:
                `melee:${combat.id}:${workflowId}`,
            rollLabel:
                weaponName
                    ? `Attaque de mêlée — ${weaponName}`
                    : "Attaque de mêlée"
        });

    }
    catch (error) {

        console.error(
            "Metro 2033 | Afflictions : échec après la résolution des dommages de mêlée",
            error
        );

        return null;

    }

}


/**
 * Répartition des afflictions du jet de BLOCAGE du défenseur
 * (les « 1 » de ses dés de Stress ; le blocage n'est jamais
 * forçable), au même moment que celles de l'attaquant.
 *
 * Le jet de blocage range lui aussi l'attribut sous
 * `context.attributeId` : même adaptation que pour l'attaque,
 * l'objet de blocage étant déjà décrit dans `context.equipment`.
 *
 * Ne lève jamais : les dommages sont déjà appliqués.
 *
 * Dépend de l'API Foundry : non testée unitairement.
 */
async function resolveMeleeBlockAfflictions(
    combat,
    workflowId
) {
    try {
        const workflow =
            MeleeAttackWorkflowService.get(
                combat,
                workflowId
            );

        const storedBlockResult =
            workflow?.defense?.result?.roll
            ?? null;

        if (!storedBlockResult) {
            return null;
        }

        const result =
            deserializeRollResult(
                storedBlockResult
            );

        if (!result) {
            return null;
        }

        result.context =
            adaptMeleeAttackContext({
                context:
                    result.context,
                equipmentDice:
                    result.pool?.equipment
            });

        const defender =
            MeleeAttackWorkflowService.getDefender(
                workflow
            );

        return await resolveAfflictionsForRoll({
            actor:
                defender,
            result,
            rollKey:
                `melee-block:${combat.id}:${workflowId}`,
            rollLabel:
                "Blocage"
        });
    }
    catch (error) {
        console.error(
            "Metro 2033 | Afflictions : échec après la résolution du blocage",
            error
        );

        return null;
    }
}


/**
 * Afflictions de l'attaquant puis du défenseur (blocage).
 */
async function resolveMeleeAfflictions(
    combat,
    workflowId
) {
    await resolveMeleeAttackAfflictions(
        combat,
        workflowId
    );

    await resolveMeleeBlockAfflictions(
        combat,
        workflowId
    );
}


/* ============================================================
 * APPLICATION DES CONSÉQUENCES
 * ============================================================ */


/**
 * Applique toutes les étapes qui peuvent être résolues
 * immédiatement.
 *
 * La fonction s'arrête dès qu'une intervention utilisateur
 * est nécessaire.
 *
 * Elle ne ferme jamais prématurément le workflow.
 */
export async function applyPendingConsequences(
    combat,
    workflowId
) {

    let workflow =
        MeleeAttackWorkflowService.get(
            combat,
            workflowId
        );


    if (!workflow) {

        throw new Error(
            `Workflow de mêlée introuvable : ${workflowId}.`
        );

    }


    /*
     * 1. Dégâts de Vigueur
     */
    if (
        !workflow.hasApplicationStep(
            "vigorDamage"
        )
    ) {

        const result =
            await MeleeDamageApplicationService
                .applyVigorDamage(
                    combat,
                    workflowId
                );


        workflow =
            result.workflow;

    }


    /*
     * 2. Dégâts d'Agilité
     */
    if (
        !workflow.hasApplicationStep(
            "agilityDamage"
        )
    ) {

        const result =
            await MeleeDamageApplicationService
                .applyAgilityDamage(
                    combat,
                    workflowId
                );


        workflow =
            result.workflow;

    }


    /*
     * 3. Dégradation de Protection
     *
     * Cette étape peut demander un choix.
     */
    if (
        !workflow.hasApplicationStep(
            "protectionDamage"
        )
    ) {

        const result =
            await MeleeDamageApplicationService
                .applyProtectionDamage(
                    combat,
                    workflowId
                );


        if (
            result.requiresAllocation
            === true
        ) {

            return {

                completed:
                    false,

                requiresAction:
                    "protectionDamage",

                interaction:
                    result,

                workflow:
                    result.workflow

            };

        }


        workflow =
            result.workflow;

    }


    /*
     * 4. Échange d'initiative
     */
    if (
        !workflow.hasApplicationStep(
            "swapInitiative"
        )
    ) {

        const result =
            await MeleeDamageApplicationService
                .applySwapInitiative(
                    combat,
                    workflowId
                );


        workflow =
            result.workflow;

    }


    /*
     * 5. Désarmement
     */
    if (
        !workflow.hasApplicationStep(
            "disarm"
        )
    ) {

        const result =
            await MeleeDamageApplicationService
                .applyDisarm(
                    combat,
                    workflowId
                );


        workflow =
            result.workflow;

    }


    /*
     * 6. Renversement
     */
    if (
        !workflow.hasApplicationStep(
            "knockdown"
        )
    ) {

        const result =
            await MeleeDamageApplicationService
                .applyKnockdown(
                    combat,
                    workflowId
                );


        workflow =
            result.workflow;

    }


    /*
     * 7. Saisie
     */
    if (
        !workflow.hasApplicationStep(
            "grapple"
        )
    ) {

        const result =
            await MeleeDamageApplicationService
                .applyGrapple(
                    combat,
                    workflowId
                );


        workflow =
            result.workflow;

    }


    /*
     * 8. Contre-attaque de blocage (p.197)
     *
     * Choisie À L'AVEUGLE par le défenseur juste
     * après son jet de blocage, mais appliquée
     * seulement maintenant, en même temps que les
     * conséquences de l'attaquant.
     */
    if (
        !workflow.hasApplicationStep(
            "blockCounterAttack"
        )
    ) {

        const result =
            await MeleeDamageApplicationService
                .applyBlockCounterAttack(
                    combat,
                    workflowId
                );


        workflow =
            result.workflow;

    }


    /*
     * 9. Désarmement de blocage (p.197)
     *
     * Même logique que la contre-attaque : choisi
     * à l'aveugle, appliqué à la toute fin.
     */
    if (
        !workflow.hasApplicationStep(
            "blockDisarm"
        )
    ) {

        const result =
            await MeleeDamageApplicationService
                .applyBlockDisarm(
                    combat,
                    workflowId
                );


        workflow =
            result.workflow;

    }


    /*
     * Toutes les étapes doivent maintenant
     * être explicitement traitées.
     */
    workflow =
        MeleeAttackWorkflowService.get(
            combat,
            workflowId
        );


    if (
        !workflow
            .areApplicationStepsResolved
    ) {

        return {

            completed:
                false,

            requiresAction:
                null,

            workflow

        };

    }


    /*
     * Résultat global.
     *
     * On ne le recrée jamais s'il existe déjà.
     */
    if (
        !workflow.hasApplicationResult
    ) {

        workflow =
            await MeleeAttackWorkflowService
                .resolveApplication(
                    combat,
                    workflowId,
                    {
                        applied:
                            true,

                        reason:
                            "all-steps-resolved",

                        completedSteps: [
                            "vigorDamage",
                            "agilityDamage",
                            "protectionDamage",
                            "swapInitiative",
                            "disarm",
                            "knockdown",
                            "grapple"
                        ]
                    }
                );

    }


    /*
     * Transition finale.
     */
    if (
        workflow.state
        !== MELEE_ATTACK_WORKFLOW_STATES
            .COMPLETED
    ) {

        workflow =
            await MeleeAttackWorkflowService
                .complete(
                    combat,
                    workflowId
                );

    }


    return {

        completed:
            true,

        requiresAction:
            null,

        workflow

    };

}

/* ============================================================
 * HANDLER
 * ============================================================ */


async function onMeleeActionClick(
    event,
    message
) {

    event.preventDefault();
    event.stopPropagation();


    const button =
        event.currentTarget;


    if (
        !(button instanceof HTMLElement)
    ) {

        return;

    }


    const action =
        button.dataset.action;

        


    /* ========================================================
     * RÉPARTITION DES DOMMAGES D'ARMURE
     * ======================================================== */


    if (
        action
        === CHAT_ACTIONS
            .ALLOCATE_PROTECTION_DAMAGE
    ) {

        button.disabled =
            true;


        try {

            const {
                combat,
                workflow
            } =
                getCurrentWorkflow(
                    message
                );


            const defender =
                MeleeAttackWorkflowService
                    .getDefender(
                        workflow
                    );


            if (!defender) {

                throw new Error(
                    "Le défenseur du workflow est introuvable."
                );

            }


            const allowed =
                game.user.isGM
                || defender.testUserPermission(
                    game.user,
                    CONST.DOCUMENT_OWNERSHIP_LEVELS
                        .OWNER
                );


            if (!allowed) {

                throw new Error(
                    "Seul le propriétaire du défenseur ou le MJ peut répartir les dommages d'armure."
                );

            }


            const preparation =
                await MeleeDamageApplicationService
                    .applyProtectionDamage(
                        combat,
                        workflow.id
                    );


            if (
                preparation.alreadyResolved
                || preparation.requiresAllocation
                    !== true
            ) {

                await MeleeAttackChat.updateMessage(
                    message,
                    preparation.workflow
                );


                return;

            }


            const allocations =
                await ProtectionDamageAllocationDialog
                    .prompt({

                        damage:
                            preparation
                                .damageToAllocate,

                        protections:
                            preparation
                                .protections,

                        actorName:
                            defender.name

                    });


            if (
                allocations === null
            ) {

                /*
                 * Convention projet :
                 *
                 * Annuler / X
                 * → aucune mutation métier ;
                 * → aucune persistance ;
                 * → aucun jet / aucune action consommée.
                 *
                 * On reconstruit le même ChatMessage
                 * depuis le workflow persistant.
                 *
                 * Cela recrée également le bouton
                 * dans son état normal au lieu de
                 * dépendre du nœud DOM désactivé
                 * au début du clic.
                 */
                await refreshMessage(
                    message
                );


                return;

            }


            const applied =
                await MeleeDamageApplicationService
                    .applyProtectionDamage(
                        combat,
                        workflow.id,
                        {
                            allocations
                        }
                    );


            await MeleeAttackChat.updateMessage(
                message,
                applied.workflow
            );


            if (
                applied.alreadyResolved
            ) {

                ui.notifications.info(
                    "La dégradation des protections avait déjà été résolue."
                );


                return;

            }


            const appliedDamage =
                Number(
                    applied.result
                        ?.appliedDamage
                    ?? 0
                );


            if (
                appliedDamage > 0
            ) {

                ui.notifications.info(
                    `${appliedDamage} point${
                        appliedDamage > 1
                            ? "s"
                            : ""
                    } de Protection ${
                        appliedDamage > 1
                            ? "ont été répartis"
                            : "a été réparti"
                    }.`
                );

            }
            else {

                ui.notifications.info(
                    "Aucune Protection n'a été dégradée."
                );

            }


            return;

        }
        catch (error) {

            console.error(
                "Metro 2033 | Erreur de répartition des dommages d'armure",
                error
            );


            ui.notifications.error(
                error.message
                ?? "Impossible de répartir les dommages d'armure."
            );


            try {

                await refreshMessage(
                    message
                );

            }
            catch {

                // Le workflow peut avoir disparu.

            }


            if (
                button.isConnected
            ) {

                button.disabled =
                    false;

            }


            return;

        }

    }


    /* ========================================================
    * RÉSOLUTION DE LA PROTECTION
    * ======================================================== */


    if (
        action
        === CHAT_ACTIONS
            .RESOLVE_PROTECTION
    ) {

        button.disabled =
            true;


        try {

            const {
                combat,
                workflow
            } =
                getCurrentWorkflow(
                    message
                );


            /*
            * Revalidation métier.
            */
            if (
                !workflow.isAwaitingProtection
            ) {

                throw new Error(
                    "Cette attaque n'attend plus de jet de Protection."
                );

            }


            const defender =
                MeleeAttackWorkflowService
                    .getDefender(
                        workflow
                    );


            if (!defender) {

                throw new Error(
                    "Le défenseur du workflow est introuvable."
                );

            }


            const weapon =
                MeleeAttackWorkflowService
                    .getWeapon(
                        workflow
                    );


            if (!weapon) {

                throw new Error(
                    "L'arme du workflow est introuvable."
                );

            }


            /*
            * Permission réelle.
            */
            const allowed =
                game.user.isGM
                || defender.testUserPermission(
                    game.user,
                    CONST.DOCUMENT_OWNERSHIP_LEVELS
                        .OWNER
                );


            if (!allowed) {

                throw new Error(
                    "Seul le propriétaire du défenseur ou le MJ peut résoudre la Protection."
                );

            }


            const incomingDamage =
                Number(
                    workflow.consequences
                        ?.result
                        ?.protection
                        ?.incomingVigorDamage
                    ?? 0
                );


            if (
                !Number.isInteger(
                    incomingDamage
                )
                || incomingDamage < 0
            ) {

                throw new Error(
                    "Les dégâts entrants pour la Protection sont invalides."
                );

            }


            /*
            * Jet réel de Protection.
            *
            * MetroActor gère :
            * - armure / casque ;
            * - Protection naturelle ;
            * - réduction de Protection ;
            * - Résilience ;
            * - munitions éventuelles.
            */
            const protectionResult =
                await defender
                    .rollProtectionAgainstWeapon(
                        incomingDamage,
                        weapon
                    );


            /*
            * Relecture juste avant persistance :
            * protection contre double clic /
            * modification concurrente.
            */
            const beforePersistWorkflow =
                MeleeAttackWorkflowService.get(
                    combat,
                    workflow.id
                );


            if (
                !beforePersistWorkflow
                    ?.isAwaitingProtection
            ) {

                throw new Error(
                    "La Protection de cette attaque a déjà été résolue."
                );

            }


            const resolvedWorkflow =
                await MeleeAttackWorkflowService
                    .resolveProtection(
                        combat,
                        workflow.id,
                        protectionResult
                    );


            /*
            * Le ChatMessage est immédiatement
            * synchronisé avec le nouvel état.
            */
            await MeleeAttackChat.updateMessage(
                message,
                resolvedWorkflow
            );


            ui.notifications.info(
                `${defender.name} résout sa Protection.`
            );


            return;

        }
        catch (error) {

            console.error(
                "Metro 2033 | Erreur de résolution de la Protection",
                error
            );


            ui.notifications.error(
                error.message
                ?? "Impossible de résoudre la Protection."
            );


            /*
            * Remet le message en cohérence avec
            * l'état persistant, quelle que soit
            * l'origine de l'erreur.
            */
            try {

                await refreshMessage(
                    message
                );

            }
            catch {

                // Le message ou le workflow peuvent avoir disparu.

            }


            return;

        }

    }    


    /* ========================================================
    * APPLICATION DES DOMMAGES / EFFETS
    * ======================================================== */


    if (
        action
        === CHAT_ACTIONS
            .APPLY_CONSEQUENCES
    ) {

        button.disabled =
            true;


        try {

            const {
                combat,
                workflow
            } =
                getCurrentWorkflow(
                    message
                );


            /*
            * Même autorisation que pour la résolution
            * de l'attaque :
            *
            * - MJ ;
            * - propriétaire de l'attaquant.
            */
            assertUserCanResolveAttack(
                combat,
                workflow
            );


            const result =
                await applyPendingConsequences(
                    combat,
                    workflow.id
                );


            /*
            * Toujours reconstruire le message depuis
            * le workflow persistant.
            *
            * Cela permet notamment de faire apparaître
            * l'étape interactive suivante.
            */
            await refreshMessage(
                message
            );


            /* ====================================================
            * CHOIX DE RÉPARTITION DE PROTECTION REQUIS
            * ==================================================== */


            if (
                result.requiresAction
                === "protectionDamage"
            ) {

                const currentWorkflow =
                    MeleeAttackWorkflowService.get(
                        combat,
                        workflow.id
                    );


                if (!currentWorkflow) {

                    throw new Error(
                        `Workflow de mêlée introuvable : ${workflow.id}.`
                    );

                }


                const defender =
                    MeleeAttackWorkflowService
                        .getDefender(
                            currentWorkflow
                        );


                if (!defender) {

                    throw new Error(
                        "Le défenseur du workflow est introuvable."
                    );

                }


                /*
                * L'orchestrateur nous a déjà retourné
                * la préparation produite par
                * applyProtectionDamage().
                */
                const preparation =
                    result.interaction;


                const allocations =
                    await ProtectionDamageAllocationDialog
                        .prompt({

                            damage:
                                preparation
                                    .damageToAllocate,

                            protections:
                                preparation
                                    .protections,

                            actorName:
                                defender.name

                        });


                /*
                * Convention projet :
                *
                * Annuler / X
                * → aucune mutation supplémentaire ;
                * → le workflow reste arrêté sur cette étape ;
                * → le bouton reste disponible.
                */
                if (
                    allocations === null
                ) {

                    await refreshMessage(
                        message
                    );


                    return;

                }


                /*
                * Validation du choix et persistance
                * de l'étape protectionDamage.
                */
                await MeleeDamageApplicationService
                    .applyProtectionDamage(
                        combat,
                        workflow.id,
                        {
                            allocations
                        }
                    );


                /*
                * Reprise automatique exactement
                * à l'étape suivante.
                */
                const resumed =
                    await applyPendingConsequences(
                        combat,
                        workflow.id
                    );


                await refreshMessage(
                    message
                );



                if (
                    resumed.completed
                    === true
                ) {

                    ui.notifications.info(
                        "Les dommages et effets ont été appliqués."
                    );


                    await resolveMeleeAfflictions(
                        combat,
                        workflow.id
                    );


                    return;

                }


                return;

            }


            /* ====================================================
            * WORKFLOW TERMINÉ
            * ==================================================== */


            if (
                result.completed
                === true
            ) {

                ui.notifications.info(
                    "Les dommages et effets ont été appliqués."
                );


                await resolveMeleeAfflictions(
                    combat,
                    workflow.id
                );


                return;

            }


            /*
            * Sécurité :
            *
            * normalement l'orchestrateur retourne soit
            * une interaction requise, soit completed=true.
            */
            console.warn(
                "METRO2033 — Application des conséquences interrompue sans interaction explicite",
                {
                    workflowId:
                        workflow.id,

                    result
                }
            );


            return;

        }
        catch (error) {

            console.error(
                "Metro 2033 | Erreur d'application des dommages et effets",
                error
            );


            ui.notifications.error(
                error.message
                ?? "Impossible d'appliquer les dommages et effets."
            );


            try {

                /*
                * Comme pour les autres handlers :
                * reconstruction depuis l'état réellement
                * persisté du workflow.
                */
                await refreshMessage(
                    message
                );

            }
            catch {

                // Le workflow peut avoir disparu.

            }


            if (
                button.isConnected
            ) {

                button.disabled =
                    false;

            }


            return;

        }

    }    


    /* ========================================================
     * CHOIX DES ÉCLATS
     * ======================================================== */


    if (
        action
        === CHAT_ACTIONS.CHOOSE_STUNTS
    ) {

        button.disabled =
            true;


        try {

            const {
                combat,
                workflow
            } =
                getCurrentWorkflow(
                    message
                );


            assertUserCanResolveAttack(
                combat,
                workflow
            );


            const result =
                await resolveStuntSelection(
                    combat,
                    workflow
                );


            if (
                result.cancelled
            ) {

                if (
                    button.isConnected
                ) {

                    button.disabled =
                        false;

                }


                return;

            }


            await MeleeAttackChat.updateMessage(
                message,
                result.workflow
            );


            console.log(
                "METRO2033 — Melee consequences resolved",
                {

                    workflowId:
                        result.workflow.id,

                    state:
                        result.workflow.state,

                    outcome:
                        result.outcome,

                    stuntResult:
                        result.stuntResult,

                    stuntConsequences:
                        result.stuntConsequences,

                    consequences:
                        result.consequences

                }
            );


            ui.notifications.info(
                "Les éclats et les conséquences de l'attaque ont été enregistrés."
            );


            return;

        }
        catch (error) {

            console.error(
                "Metro 2033 | Erreur de résolution des éclats",
                error
            );


            ui.notifications.error(
                error.message
                ?? "Impossible de résoudre les éclats."
            );


            try {

                await refreshMessage(
                    message
                );

            }
            catch {

                // Le workflow peut avoir disparu.

            }


            if (
                button.isConnected
            ) {

                button.disabled =
                    false;

            }


            return;

        }

    }

    /* ========================================================
    * PUSH DE L'ATTAQUE
    * ======================================================== */


    if (
        action
        === CHAT_ACTIONS.PUSH_ATTACK
    ) {

        button.disabled =
            true;


        try {

            const {
                combat,
                workflow
            } =
                getCurrentWorkflow(
                    message
                );


            const attacker =
                assertUserCanResolveAttack(
                    combat,
                    workflow
                );


            if (
                workflow.state
                !== MELEE_ATTACK_WORKFLOW_STATES
                    .ATTACK_RESOLVED
            ) {

                throw new Error(
                    "Cette attaque ne peut plus être forcée."
                );

            }


            if (
                workflow.isAttackFinalized
            ) {

                throw new Error(
                    "Le résultat de cette attaque a déjà été conservé."
                );

            }


            const serializedResult =
                workflow.attack
                    ?.result
                ?? null;


            if (!serializedResult) {

                throw new Error(
                    "Le résultat d'attaque à forcer est introuvable."
                );

            }


            const previousResult =
                deserializeRollResult(
                    serializedResult
                );


            if (!previousResult) {

                throw new Error(
                    "Impossible de reconstruire le résultat YZE de l'attaque."
                );

            }


            const pushCount =
                Number(
                    previousResult.pushCount
                    ?? 0
                );


            if (
                pushCount >= 2
            ) {

                throw new Error(
                    "Cette attaque ne peut plus être forcée."
                );

            }


            /*
            * Règle Métro :
            *
            * Push 1 = gratuit.
            * Push 2 = Stress.
            *
            * La règle elle-même reste gérée
            * par le moteur YZE / MetroActor.
            */
            const useStress =
                pushCount === 1;


            const pushedResult =
                await attacker.pushRoll(
                    previousResult,
                    {
                        useStress
                    }
                );


            /*
            * Relecture juste avant persistance.
            *
            * Protège notamment contre :
            * - double clic ;
            * - modification concurrente ;
            * - finalisation entre-temps.
            */
            const beforePersistWorkflow =
                MeleeAttackWorkflowService.get(
                    combat,
                    workflow.id
                );


            if (
                !beforePersistWorkflow
                || beforePersistWorkflow.state
                    !== MELEE_ATTACK_WORKFLOW_STATES
                        .ATTACK_RESOLVED
                || beforePersistWorkflow
                    .isAttackFinalized
            ) {

                throw new Error(
                    "Le résultat de cette attaque a déjà été modifié ou finalisé."
                );

            }


            let resolvedWorkflow =
                await MeleeAttackWorkflowService
                    .updateAttackResult(
                        combat,
                        workflow.id,
                        pushedResult
                    );


            /*
            * Après le deuxième Push,
            * aucune troisième relance n'est possible.
            *
            * Le résultat devient donc automatiquement
            * définitif.
            */
            if (
                Number(
                    pushedResult.pushCount
                    ?? 0
                ) >= 2
            ) {

                const resolution =
                    await finalizeResolvedAttack(
                        combat,
                        resolvedWorkflow
                    );


                resolvedWorkflow =
                    resolution.workflow;


                await MeleeAttackChat.updateMessage(
                    message,
                    resolvedWorkflow
                );


                if (
                    resolution.awaitingStunts
                ) {

                    ui.notifications.info(
                        `${attacker.name} a effectué son dernier Push : choisissez les éclats.`
                    );

                }
                else if (
                    resolution.outcome.hit
                ) {

                    ui.notifications.info(
                        `${attacker.name} a effectué son dernier Push et touche sa cible.`
                    );

                }
                else {

                    ui.notifications.info(
                        `${attacker.name} a effectué son dernier Push et manque sa cible.`
                    );

                }


                return;

            }


            /*
            * Après Push 1, le résultat reste
            * provisoire.
            */
            await MeleeAttackChat.updateMessage(
                message,
                resolvedWorkflow
            );


            ui.notifications.info(
                `${attacker.name} force son jet.`
            );


            return;

        }
        catch (error) {

            console.error(
                "Metro 2033 | Erreur de Push de l'attaque de mêlée",
                error
            );


            ui.notifications.error(
                error.message
                ?? "Impossible de forcer cette attaque."
            );


            try {

                await refreshMessage(
                    message
                );

            }
            catch {

                // Le workflow peut avoir disparu.

            }


            if (
                button.isConnected
            ) {

                button.disabled =
                    false;

            }


            return;

        }

    }

    /* ========================================================
    * CONSERVATION DU RÉSULTAT D'ATTAQUE
    * ======================================================== */


    if (
        action
        === CHAT_ACTIONS.FINALIZE_ATTACK
    ) {

        button.disabled =
            true;


        try {

            const {
                combat,
                workflow
            } =
                getCurrentWorkflow(
                    message
                );


            const attacker =
                assertUserCanResolveAttack(
                    combat,
                    workflow
                );


            if (
                workflow.state
                !== MELEE_ATTACK_WORKFLOW_STATES
                    .ATTACK_RESOLVED
            ) {

                throw new Error(
                    "Cette attaque n'est plus en attente de finalisation."
                );

            }


            if (
                workflow.isAttackFinalized
            ) {

                throw new Error(
                    "Le résultat de cette attaque a déjà été conservé."
                );

            }


            const resolution =
                await finalizeResolvedAttack(
                    combat,
                    workflow
                );


            await MeleeAttackChat.updateMessage(
                message,
                resolution.workflow
            );


            if (
                resolution.awaitingStunts
            ) {

                ui.notifications.info(
                    `${attacker.name} conserve son résultat : choisissez les éclats.`
                );

            }
            else if (
                resolution.outcome.hit
            ) {

                ui.notifications.info(
                    `${attacker.name} conserve son résultat et touche sa cible.`
                );

            }
            else {

                ui.notifications.info(
                    `${attacker.name} conserve son résultat et manque sa cible.`
                );

            }


            return;

        }
        catch (error) {

            console.error(
                "Metro 2033 | Erreur de finalisation de l'attaque de mêlée",
                error
            );


            ui.notifications.error(
                error.message
                ?? "Impossible de conserver ce résultat."
            );


            try {

                await refreshMessage(
                    message
                );

            }
            catch {

                // Le workflow peut avoir disparu.

            }


            if (
                button.isConnected
            ) {

                button.disabled =
                    false;

            }


            return;

        }

    }

    /* ========================================================
     * RÉSOLUTION DE L'ATTAQUE
     * ======================================================== */


    if (
        action
        === CHAT_ACTIONS.RESOLVE_ATTACK
    ) {

        button.disabled =
            true;


        try {

            const {
                combat,
                workflow
            } =
                getCurrentWorkflow(
                    message
                );


            const attacker =
                assertUserCanResolveAttack(
                    combat,
                    workflow
                );


            if (
                workflow.state
                !== MELEE_ATTACK_WORKFLOW_STATES
                    .ATTACK_PREPARATION
            ) {

                throw new Error(
                    "Cette attaque n'est pas en attente de résolution."
                );

            }


            const result =
                await resolveAttackPreparation(
                    combat,
                    workflow
                );


            if (
                result.cancelled
            ) {

                if (
                    button.isConnected
                ) {

                    button.disabled =
                        false;

                }


                return;

            }


            const physicalRoll =
                result.attackRoll
                    ?.physicalRoll
                ?? null;


            let resolvedWorkflow =
                await MeleeAttackWorkflowService
                    .resolveAttack(
                        combat,
                        result.workflow.id,
                        result.attackRoll
                    );


            await MeleeAttackChat.updateMessage(
                message,
                resolvedWorkflow,
                {
                    physicalRoll
                }
            );


            ui.notifications.info(
                `${result.attacker.name} a lancé son attaque : forcez le jet ou conservez le résultat.`
            );


            return;

        }
        catch (error) {

            console.error(
                "Metro 2033 | Erreur de résolution de l'attaque",
                error
            );


            ui.notifications.error(
                error.message
                ?? "Impossible de résoudre cette attaque."
            );


            try {

                await refreshMessage(
                    message
                );

            }
            catch {

                // Le workflow peut avoir disparu.

            }


            if (
                button.isConnected
            ) {

                button.disabled =
                    false;

            }


            return;

        }

    }


    /* ========================================================
     * DÉCISION DE DÉFENSE
     * ======================================================== */


    let decision;


    switch (
        action
    ) {

        case CHAT_ACTIONS.BLOCK:

            decision =
                MELEE_DEFENSE_DECISIONS
                    .BLOCK;

            break;


        case CHAT_ACTIONS.DECLINE:

            decision =
                MELEE_DEFENSE_DECISIONS
                    .DECLINE;

            break;


        default:

            return;

    }


    button.disabled =
        true;


    try {

        const workflow =
            await processDefenseDecision(
                message,
                decision
            );


        if (
            decision
            === MELEE_DEFENSE_DECISIONS.BLOCK
        ) {

            await refreshMessage(
                message
            );


            const {
                combat
            } =
                getCurrentWorkflow(
                    message
                );


            const blockResolution =
                await resolveBlockPreparation(
                    combat,
                    workflow
                );


            if (
                blockResolution.cancelled
            ) {

                /*
                * Annuler la fenêtre signifie :
                *
                * - aucun jet ;
                * - aucune action consommée ;
                * - abandon du choix provisoire BLOCK ;
                * - retour au choix de défense.
                */
                await MeleeAttackWorkflowService
                    .cancelBlockPreparation(
                        combat,
                        blockResolution.workflow.id,
                        {
                            user:
                                game.user
                        }
                    );


                /*
                * Le Chat est maintenant rerendu
                * depuis le vrai workflow persisté.
                *
                * Les boutons :
                *
                * - Bloquer ;
                * - Ne pas bloquer
                *
                * doivent réapparaître.
                */
                await refreshMessage(
                    message
                );


                ui.notifications.info(
                    "Préparation du blocage annulée."
                );


                return;

            }


            const blockResult =
                blockResolution.blockResult;


            const successes =
                blockResult?.rolled
                    ? (
                        blockResult.roll
                            ?.successes
                        ?? 0
                    )
                    : 0;


            await refreshMessage(
                message
            );


            if (
                blockResult?.rolled
                === false
            ) {

                ui.notifications.warn(
                    `${blockResolution.defender.name} ne peut finalement pas bloquer cette attaque.`
                );

            }
            else {

                ui.notifications.info(
                    `${blockResolution.defender.name} bloque avec ${successes} réussite${successes > 1 ? "s" : ""}.`
                );

            }

        }
        else {

            const updatedWorkflow =
                await refreshMessage(
                    message
                );


            ui.notifications.info(
                `${MeleeAttackWorkflowService.getDefender(updatedWorkflow)?.name ?? "Le défenseur"} ne bloque pas.`
            );

        }

    }
    catch (error) {

        console.error(
            "Metro 2033 | Erreur de décision de défense",
            error
        );


        ui.notifications.error(
            error.message
            ?? "Impossible de prendre cette décision de défense."
        );


        try {

            await refreshMessage(
                message
            );

        }
        catch {

            // Le message ou le workflow peuvent avoir disparu.

        }


        try {

            const {
                workflow
            } =
                getCurrentWorkflow(
                    message
                );


            button.disabled =
                !workflow.isAwaitingDefense
                || !MeleeAttackWorkflowService
                    .canUserDecideDefense(
                        workflow,
                        game.user
                    );

        }
        catch {

            button.disabled =
                true;

        }

    }

}


/* ============================================================
 * ENREGISTREMENT DES LISTENERS
 * ============================================================ */


function activateMessageListeners(
    message,
    html
) {

    const reference =
        MeleeAttackChat
            .getWorkflowReference(
                message
            );


    if (!reference) {

        return;

    }


    const combat =
        getReferencedCombat(
            reference
        );


    if (!combat) {

        return;

    }


    const workflow =
        MeleeAttackWorkflowService.get(
            combat,
            reference.workflowId
        );


    if (!workflow) {

        return;

    }


    updateButtonAvailability(
        html,
        workflow
    );


    const buttons =
        html.querySelectorAll(
            [
                '[data-action="melee-defense-block"]',
                '[data-action="melee-defense-decline"]',
                '[data-action="melee-resolve-attack"]',
                '[data-action="melee-push-attack"]',
                '[data-action="melee-finalize-attack"]',
                '[data-action="melee-choose-stunts"]',
                '[data-action="melee-resolve-protection"]',
                '[data-action="melee-allocate-protection-damage"]',
                '[data-action="melee-apply-consequences"]'
            ].join(",")
        );


    for (
        const button
        of buttons
    ) {

        button.addEventListener(
            "click",
            event =>
                onMeleeActionClick(
                    event,
                    message
                )
        );

    }

    html
        .querySelectorAll('[data-action="melee-vicieuse"]')
        .forEach(
            button =>
                button.addEventListener(
                    "click",
                    event => onVicieuseClick(event, message)
                )
        );

}


/* ============================================================
 * TRAIT « VICIEUSE »
 * ============================================================ */

function toFollowUpWeapons(attacker) {

    return attacker.items
        .filter(item => item.type === "weapon")
        .map(item => ({
            id: item.id,
            name: item.name,
            category: item.system?.category,
            canAttack: item.system?.canAttack === true
        }));

}


function toTraitKeys(attacker) {

    return attacker.items
        .filter(item => item.type === "talent")
        .map(item => item.system?.key);

}


async function onVicieuseClick(
    event,
    message
) {

    event.preventDefault();
    event.stopPropagation();

    const button =
        event.currentTarget;

    button.disabled = true;

    try {

        if (!game.user.isGM) {

            throw new Error(
                "Seul le MJ peut déclencher l'attaque de Vicieuse."
            );

        }

        const {
            combat,
            workflow
        } =
            getCurrentWorkflow(
                message
            );

        const flagKey =
            `vicieuseUsed.${workflow.id}`;

        if (combat.getFlag("metro-2033-yze", flagKey)) {

            ui.notifications.warn(
                "Vicieuse a déjà été utilisée pour cette attaque."
            );

            return;

        }

        const attacker =
            MeleeAttackWorkflowService.getAttacker(workflow);

        const defender =
            MeleeAttackWorkflowService.getDefender(workflow);

        const usedWeapon =
            MeleeAttackWorkflowService.getWeapon(workflow);

        const followUp =
            resolveVicieuseFollowUp({
                traitKeys: toTraitKeys(attacker),
                usedWeaponName: usedWeapon?.name,
                hit: true,
                weapons: toFollowUpWeapons(attacker)
            });

        if (!followUp.available) {

            throw new Error(
                "Aucune attaque de morsure utilisable."
            );

        }

        await combat.setFlag("metro-2033-yze", flagKey, true);

        const biteWorkflow =
            await MeleeAttackWorkflowService.create(
                combat,
                {
                    attacker,
                    defender,
                    weapon: attacker.items.get(followUp.weaponId),
                    attackerToken:
                        canvas.tokens?.get(workflow.attacker.tokenId)
                        ?? null,
                    defenderToken:
                        canvas.tokens?.get(workflow.defender.tokenId)
                        ?? null,
                    canBlock: true
                }
            );

        await MeleeAttackChat.createMessage(
            combat,
            biteWorkflow
        );

    }
    catch (error) {

        console.error("Metro 2033 | Vicieuse :", error);

        ui.notifications.error(
            error.message
            ?? "Impossible de lancer l'attaque de Vicieuse."
        );

        button.disabled = false;

    }

}


/* ============================================================
 * HOOKS
 * ============================================================ */


export function registerMeleeAttackChatHooks() {

    Hooks.on(
        "renderChatMessageHTML",
        (
            message,
            html
        ) => {

            try {

                activateMessageListeners(
                    message,
                    html
                );

            }
            catch (error) {

                console.error(
                    "Metro 2033 | Impossible d'activer les interactions du message de mêlée",
                    error
                );

            }

        }
    );

}