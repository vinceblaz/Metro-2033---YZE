/**
 * Application persistante des conséquences
 * d'une attaque de mêlée.
 *
 * Ce service applique progressivement les mutations
 * réelles aux Documents Foundry.
 *
 * IMPORTANT :
 *
 * Chaque mutation doit être immédiatement suivie
 * de la persistance de son résultat dans le journal
 * d'application du workflow.
 *
 * Première étape implémentée :
 *
 * - dégâts de Vigueur.
 */


import {
    MELEE_APPLICATION_STEP_KEYS
} from "./melee-attack-workflow.mjs";


import {
    MeleeAttackWorkflowService
} from "./melee-attack-workflow-service.mjs";


import {
    MeleeAttackApplicationPlanService
} from "./melee-attack-application-plan-service.mjs";


import {
    InitiativeSwapService
} from "./initiative-swap-service.mjs";

import {
    GrappleService
} from "./grapple-service.mjs";

import {
    triggerWeaponVenom
} from "../foundry/poison/weapon-venom.mjs";

import {
    PoisonRollChat
} from "../foundry/chat/poison-roll-chat.mjs";


export class MeleeDamageApplicationService {


    /**
     * Construit le plan final à partir du workflow
     * actuellement persisté.
     */
    static createPlan(
        workflow
    ) {

        if (!workflow) {

            throw new TypeError(
                "Un workflow de mêlée est requis."
            );

        }


        return (
            MeleeAttackApplicationPlanService.resolve({

                consequences:
                    workflow.consequences?.result,

                protection:
                    workflow.protection?.result
                    ?? null

            })
        );

    }


    /**
     * Applique uniquement les dégâts de Vigueur.
     *
     * Cette méthode est volontairement limitée
     * à une seule mutation pour notre première
     * validation du pipeline réel.
     */
    static async applyVigorDamage(
        combat,
        workflowId
    ) {

        /*
         * Toujours partir de l'état persistant.
         */
        const workflow =
            MeleeAttackWorkflowService.get(
                combat,
                workflowId
            );


        if (!workflow) {

            throw new Error(
                `Workflow de mêlée introuvable : ${workflowId}.`
            );

        }


        if (
            !workflow.canApplyConsequences
        ) {

            throw new Error(
                "Les conséquences de cette attaque ne peuvent pas être appliquées."
            );

        }


        const stepKey =
            MELEE_APPLICATION_STEP_KEYS
                .VIGOR_DAMAGE;


        /*
         * Verrou AVANT mutation.
         *
         * Si cette étape existe déjà dans
         * Combat.flags, aucun Actor n'est modifié.
         */
        if (
            workflow.hasApplicationStep(
                stepKey
            )
        ) {

            return {

                alreadyResolved:
                    true,

                result:
                    workflow.getApplicationStep(
                        stepKey
                    ),

                workflow

            };

        }


        const target =
            MeleeAttackWorkflowService
                .getDefender(
                    workflow
                );


        if (!target) {

            throw new Error(
                "Le défenseur du workflow est introuvable."
            );

        }


        const plan =
            this.createPlan(
                workflow
            );


        const amount =
            Number(
                plan.damage?.vigor
                ?? 0
            );


        if (
            !Number.isInteger(amount)
            || amount < 0
        ) {

            throw new TypeError(
                "Les dégâts finaux de Vigueur sont invalides."
            );

        }


        /*
         * Même lorsqu'il n'y a aucun dégât,
         * l'étape doit être persistée comme
         * explicitement traitée.
         */
        if (
            amount === 0
        ) {

            const stepResult = {

                applied:
                    false,

                reason:
                    "no-damage",

                requestedDamage:
                    0

            };


            const persistedWorkflow =
                await MeleeAttackWorkflowService
                    .resolveApplicationStep(
                        combat,
                        workflowId,
                        stepKey,
                        stepResult
                    );


            return {

                alreadyResolved:
                    false,

                result:
                    persistedWorkflow
                        .getApplicationStep(
                            stepKey
                        ),

                workflow:
                    persistedWorkflow

            };

        }


        /*
         * PREMIÈRE MUTATION RÉELLE.
         */
        const damageResult =
            await target.takeAttributeDamage(
                "vigor",
                amount
            );


        /*
         * Poison de lame (livre p.204, « POISONS ET BLESSURES »).
         *
         * Déclenchement automatique, immédiatement après la
         * mutation réelle : c'est le dégât RÉELLEMENT appliqué à
         * la VIGUEUR (damageResult.damage) qui compte, pas la
         * quantité demandée avant plafond/overflow (amount) — le
         * livre dit « inflige au moins 1 point de dégâts »,
         * c'est-à-dire le dégât effectivement subi par la cible.
         *
         * La lame redevient immédiatement non empoisonnée, que la
         * victime résiste ou non au jet en opposition qui suit
         * (« une fois le poison inoculé » — l'inoculation a lieu
         * ici, indépendamment de l'issue du jet).
         *
         * Encapsulé dans un try/catch (cf. le même principe de
         * tolérance aux erreurs appliqué ailleurs dans ce projet,
         * par ex. `resolve-recurring-status-effects.mjs`) : cette
         * fonctionnalité annexe ne doit jamais faire échouer
         * l'application des dégâts de Vigueur elle-même.
         */
        try {

            const weapon =
                MeleeAttackWorkflowService.getWeapon(
                    workflow
                );


            if (
                weapon?.system?.poisonedBlade?.active === true
                && Number(
                    damageResult.damage
                    ?? 0
                ) >= 1
            ) {

                await PoisonRollChat.createPendingMessage({

                    actor:
                        target,

                    effectTypeKey:
                        weapon.system.poisonedBlade.effectType,

                    toxicity:
                        weapon.system.poisonedBlade.toxicity,

                    sourceLabel:
                        weapon.system.poisonedBlade.sourceLabel
                        || weapon.name,

                    bladePoison:
                        true

                });


                await weapon.update({

                    "system.poisonedBlade.active":
                        false

                });

            }

        }
        catch (error) {

            console.error(
                "Metro 2033 | Échec du déclenchement automatique du poison de lame.",
                {
                    target,
                    error
                }
            );

        }

        /*
         * Venin d'une arme naturelle de Créature : permanent,
         * déclenché par au moins 1 point de dégâts réellement
         * subi par la Vigueur.
         */
        await triggerWeaponVenom(
            MeleeAttackWorkflowService.getWeapon(
                workflow
            ),
            target,
            Number(
                damageResult.damage
                ?? 0
            )
        );


        const stepResult = {

            applied:
                true,

            requestedDamage:
                amount,

            attribute:
                damageResult.attribute,

            previous:
                Number(
                    damageResult.previous
                    ?? 0
                ),

            current:
                Number(
                    damageResult.current
                    ?? 0
                ),

            damage:
                Number(
                    damageResult.damage
                    ?? 0
                ),

            overflow:
                Number(
                    damageResult.overflow
                    ?? 0
                ),

            broken:
                damageResult.broken
                === true

        };


        /*
         * Persistance immédiate après mutation.
         */
        const persistedWorkflow =
            await MeleeAttackWorkflowService
                .resolveApplicationStep(
                    combat,
                    workflowId,
                    stepKey,
                    stepResult
                );


        return {

            alreadyResolved:
                false,

            result:
                persistedWorkflow
                    .getApplicationStep(
                        stepKey
                    ),

            workflow:
                persistedWorkflow

        };

    }

    /**
     * Applique uniquement les dégâts d'Agilité.
     *
     * Comme pour la Vigueur :
     *
     * - le workflow est relu depuis Combat.flags ;
     * - une étape déjà résolue n'est jamais rejouée ;
     * - la mutation réelle est effectuée sur l'Actor ;
     * - son résultat est immédiatement persisté.
     */
    static async applyAgilityDamage(
        combat,
        workflowId
    ) {

        /*
        * Toujours repartir de l'état persistant.
        */
        const workflow =
            MeleeAttackWorkflowService.get(
                combat,
                workflowId
            );


        if (!workflow) {

            throw new Error(
                `Workflow de mêlée introuvable : ${workflowId}.`
            );

        }


        if (
            !workflow.canApplyConsequences
        ) {

            throw new Error(
                "Les conséquences de cette attaque ne peuvent pas être appliquées."
            );

        }


        const stepKey =
            MELEE_APPLICATION_STEP_KEYS
                .AGILITY_DAMAGE;


        /*
        * Verrou avant toute mutation.
        */
        if (
            workflow.hasApplicationStep(
                stepKey
            )
        ) {

            return {

                alreadyResolved:
                    true,

                result:
                    workflow.getApplicationStep(
                        stepKey
                    ),

                workflow

            };

        }


        const target =
            MeleeAttackWorkflowService
                .getDefender(
                    workflow
                );


        if (!target) {

            throw new Error(
                "Le défenseur du workflow est introuvable."
            );

        }


        const plan =
            this.createPlan(
                workflow
            );


        const amount =
            Number(
                plan.damage?.agility
                ?? 0
            );


        if (
            !Number.isInteger(amount)
            || amount < 0
        ) {

            throw new TypeError(
                "Les dégâts finaux d'Agilité sont invalides."
            );

        }


        /*
        * Même sans dégâts d'Agilité,
        * l'étape doit être considérée comme traitée.
        */
        if (
            amount === 0
        ) {

            const stepResult = {

                applied:
                    false,

                reason:
                    "no-damage",

                requestedDamage:
                    0

            };


            const persistedWorkflow =
                await MeleeAttackWorkflowService
                    .resolveApplicationStep(
                        combat,
                        workflowId,
                        stepKey,
                        stepResult
                    );


            return {

                alreadyResolved:
                    false,

                result:
                    persistedWorkflow
                        .getApplicationStep(
                            stepKey
                        ),

                workflow:
                    persistedWorkflow

            };

        }


        /*
        * Mutation réelle de l'Actor.
        */
        const damageResult =
            await target.takeAttributeDamage(
                "agility",
                amount
            );


        const stepResult = {

            applied:
                true,

            requestedDamage:
                amount,

            attribute:
                damageResult.attribute,

            previous:
                Number(
                    damageResult.previous
                    ?? 0
                ),

            current:
                Number(
                    damageResult.current
                    ?? 0
                ),

            damage:
                Number(
                    damageResult.damage
                    ?? 0
                ),

            overflow:
                Number(
                    damageResult.overflow
                    ?? 0
                ),

            broken:
                damageResult.broken
                    === true

        };


        /*
        * Persistance immédiate après mutation.
        */
        const persistedWorkflow =
            await MeleeAttackWorkflowService
                .resolveApplicationStep(
                    combat,
                    workflowId,
                    stepKey,
                    stepResult
                );


        return {

            alreadyResolved:
                false,

            result:
                persistedWorkflow
                    .getApplicationStep(
                        stepKey
                    ),

            workflow:
                persistedWorkflow

        };

    }

    /**
     * Applique la dégradation éventuelle
     * de la Protection portée.
     *
     * Cette méthode :
     *
     * - relit toujours le workflow persistant ;
     * - vérifie le journal avant toute mutation ;
     * - détermine si une dégradation est nécessaire ;
     * - détecte si un choix armure/casque est requis ;
     * - applique automatiquement la dégradation
     *   lorsqu'une seule cible est possible ;
     * - persiste immédiatement le résultat.
     *
     * Si un choix utilisateur est nécessaire,
     * aucune mutation n'est effectuée et l'étape
     * reste pending.
     */
    static async applyProtectionDamage(
        combat,
        workflowId,
        {
            allocations = null
        } = {}
    ) {

        const workflow =
            MeleeAttackWorkflowService.get(
                combat,
                workflowId
            );


        if (!workflow) {

            throw new Error(
                `Workflow de mêlée introuvable : ${workflowId}.`
            );

        }


        if (!workflow.canApplyConsequences) {

            throw new Error(
                "Les conséquences de cette attaque ne peuvent pas être appliquées."
            );

        }


        const stepKey =
            MELEE_APPLICATION_STEP_KEYS
                .PROTECTION_DAMAGE;


        // ============================================================
        // 1. VERROU PERSISTANT
        // ============================================================

        if (
            workflow.hasApplicationStep(
                stepKey
            )
        ) {

            return {

                alreadyResolved:
                    true,

                requiresAllocation:
                    false,

                result:
                    workflow.getApplicationStep(
                        stepKey
                    ),

                workflow

            };

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


        const plan =
            this.createPlan(
                workflow
            );


        const degradation =
            plan.protection
                ?.degradation;


        if (!degradation) {

            throw new Error(
                "Le plan d'application ne contient aucune information de dégradation de Protection."
            );

        }


        // ============================================================
        // 2. AUCUNE DÉGRADATION
        // ============================================================

        if (
            degradation.required
            !== true
        ) {

            const stepResult = {

                applied:
                    false,

                reason:
                    "no-damage",

                requestedDamage:
                    0,

                appliedDamage:
                    0,

                overflow:
                    0,

                automatic:
                    true,

                allocations:
                    []

            };


            const persistedWorkflow =
                await MeleeAttackWorkflowService
                    .resolveApplicationStep(
                        combat,
                        workflowId,
                        stepKey,
                        stepResult
                    );


            return {

                alreadyResolved:
                    false,

                requiresAllocation:
                    false,

                result:
                    persistedWorkflow
                        .getApplicationStep(
                            stepKey
                        ),

                workflow:
                    persistedWorkflow

            };

        }


        const amount =
            Number(
                degradation.amount
                ?? 0
            );


        if (
            !Number.isInteger(amount)
            || amount < 0
        ) {

            throw new TypeError(
                "La dégradation de Protection est invalide."
            );

        }


        // ============================================================
        // 3. RÉSULTAT DE PROTECTION
        // ============================================================

        const protectionResult =
            workflow.protection
                ?.result;


        if (!protectionResult) {

            throw new Error(
                "Le résultat de Protection est introuvable."
            );

        }


        const source =
            protectionResult.source
            ?? {};


        /*
        * On travaille volontairement à partir
        * des Items réels de l'Actor.
        *
        * Les valeurs du snapshot du jet servent
        * à l'historique, mais la mutation doit viser
        * les Embedded Items réels.
        */
        const protectionPieces =
            [];


        const addProtectionPiece = (
            target,
            sourceData
        ) => {

            if (!sourceData?.itemId) {
                return;
            }


            const item =
                defender.items.get(
                    sourceData.itemId
                );


            if (!item) {

                throw new Error(
                    `La protection utilisée lors du jet n'existe plus sur cet Actor : ${sourceData.itemName ?? sourceData.itemId}.`
                );

            }


            const current =
                Number(
                    item.system
                        ?.protection
                        ?.current
                    ?? 0
                );


            if (
                !Number.isInteger(current)
                || current < 0
            ) {

                throw new TypeError(
                    `La valeur actuelle de Protection de "${item.name}" est invalide.`
                );

            }


            /*
            * Une pièce déjà à 0 ne peut plus
            * recevoir de dégradation.
            */
            if (current === 0) {
                return;
            }


            protectionPieces.push({

                target,

                item,

                itemId:
                    item.id,

                itemName:
                    item.name,

                current

            });

        };


        addProtectionPiece(
            "body",
            source.bodyArmor
        );

        addProtectionPiece(
            "helmet",
            source.helmet
        );


        // ============================================================
        // 4. PLUS AUCUNE PROTECTION À DÉGRADER
        // ============================================================

        const totalProtection =
            protectionPieces.reduce(
                (
                    total,
                    piece
                ) =>
                    total
                    + piece.current,
                0
            );


        if (
            totalProtection === 0
        ) {

            const stepResult = {

                applied:
                    false,

                reason:
                    "no-protection-left",

                requestedDamage:
                    amount,

                appliedDamage:
                    0,

                overflow:
                    amount,

                automatic:
                    true,

                allocations:
                    []

            };


            const persistedWorkflow =
                await MeleeAttackWorkflowService
                    .resolveApplicationStep(
                        combat,
                        workflowId,
                        stepKey,
                        stepResult
                    );


            return {

                alreadyResolved:
                    false,

                requiresAllocation:
                    false,

                result:
                    persistedWorkflow
                        .getApplicationStep(
                            stepKey
                        ),

                workflow:
                    persistedWorkflow

            };

        }


        // ============================================================
        // 5. DÉTERMINATION DE LA RÉPARTITION
        // ============================================================

        let resolvedAllocations =
            null;

        let automatic =
            false;

        let allocationReason =
            null;


        /*
        * Une seule protection disponible :
        * aucun choix utile.
        */
        if (
            protectionPieces.length === 1
        ) {

            const piece =
                protectionPieces[0];


            resolvedAllocations = {

                [piece.target]:
                    Math.min(
                        amount,
                        piece.current
                    )

            };


            automatic =
                true;

            allocationReason =
                "single-protection";

        }


        /*
        * Plusieurs protections, mais les dégâts
        * suffisent à toutes les détruire.
        *
        * Aucun choix utile non plus :
        * toutes passent automatiquement à 0.
        */
        else if (
            amount >= totalProtection
        ) {

            resolvedAllocations =
                Object.fromEntries(
                    protectionPieces.map(
                        piece => [
                            piece.target,
                            piece.current
                        ]
                    )
                );


            automatic =
                true;

            allocationReason =
                "total-destruction";

        }


        /*
        * Plusieurs protections et véritable choix.
        *
        * Sans répartition fournie :
        * aucune mutation et aucune persistance.
        *
        * Le Chat pourra donc présenter son bouton.
        */
        else if (
            allocations === null
        ) {

            return {

                alreadyResolved:
                    false,

                requiresAllocation:
                    true,

                damageToAllocate:
                    amount,

                totalProtection,

                protections:
                    protectionPieces.map(
                        piece => ({

                            target:
                                piece.target,

                            itemId:
                                piece.itemId,

                            itemName:
                                piece.itemName,

                            current:
                                piece.current

                        })
                    ),

                result:
                    null,

                workflow

            };

        }


        /*
        * Répartition fournie par la fenêtre.
        */
        else {

            if (
                typeof allocations !== "object"
                || Array.isArray(
                    allocations
                )
            ) {

                throw new TypeError(
                    "La répartition des dégâts de Protection est invalide."
                );

            }


            resolvedAllocations =
                {};


            for (
                const piece
                of protectionPieces
            ) {

                const value =
                    Number(
                        allocations[
                            piece.target
                        ]
                        ?? 0
                    );


                if (
                    !Number.isInteger(value)
                    || value < 0
                ) {

                    throw new TypeError(
                        `La dégradation attribuée à "${piece.itemName}" doit être un entier positif ou nul.`
                    );

                }


                if (
                    value > piece.current
                ) {

                    throw new Error(
                        `Impossible d'attribuer ${value} point(s) à "${piece.itemName}" : sa Protection restante est de ${piece.current}.`
                    );

                }


                resolvedAllocations[
                    piece.target
                ] =
                    value;

            }


            /*
            * On interdit également une clé inconnue.
            */
            const allowedTargets =
                new Set(
                    protectionPieces.map(
                        piece =>
                            piece.target
                    )
                );


            for (
                const target
                of Object.keys(
                    allocations
                )
            ) {

                if (
                    !allowedTargets.has(
                        target
                    )
                ) {

                    throw new TypeError(
                        `Cible de dégradation inconnue : ${target}.`
                    );

                }

            }


            const allocatedTotal =
                Object.values(
                    resolvedAllocations
                ).reduce(
                    (
                        total,
                        value
                    ) =>
                        total + value,
                    0
                );


            /*
            * RÈGLE IMPORTANTE :
            *
            * ni moins,
            * ni plus.
            */
            if (
                allocatedTotal
                !== amount
            ) {

                throw new Error(
                    `Tous les points de dégradation doivent être répartis exactement : ${allocatedTotal} / ${amount}.`
                );

            }


            automatic =
                false;

            allocationReason =
                "manual-allocation";

        }


        // ============================================================
        // 6. APPLICATION RÉELLE
        // ============================================================

        const applicationResults =
            [];


        for (
            const piece
            of protectionPieces
        ) {

            const allocatedDamage =
                Number(
                    resolvedAllocations[
                        piece.target
                    ]
                    ?? 0
                );


            if (
                allocatedDamage === 0
            ) {
                continue;
            }


            /*
            * resolveProtectionDamage() sait déjà
            * appliquer une dégradation à une pièce.
            *
            * On lui fournit simplement un clone du
            * résultat de Protection avec la quantité
            * attribuée à cette pièce.
            */
            const partialProtectionResult = {

                ...foundry.utils.deepClone(
                    protectionResult
                ),

                protectionDamage:
                    allocatedDamage

            };


            const damageResult =
                await defender
                    .resolveProtectionDamage(
                        partialProtectionResult,
                        piece.target
                    );


            applicationResults.push({

                applied:
                    damageResult.applied
                    === true,

                target:
                    piece.target,

                itemId:
                    damageResult.itemId
                    ?? piece.itemId,

                itemName:
                    damageResult.itemName
                    ?? piece.itemName,

                requestedDamage:
                    allocatedDamage,

                previous:
                    Number(
                        damageResult.previous
                        ?? piece.current
                    ),

                current:
                    Number(
                        damageResult.current
                        ?? piece.current
                    ),

                damage:
                    Number(
                        damageResult.lost
                        ?? 0
                    ),

                broken:
                    damageResult.broken
                    === true,

                resilienceLost:
                    damageResult.resilienceLost
                    === true,

                reason:
                    damageResult.reason
                    ?? null

            });

        }


        // ============================================================
        // 7. RÉSULTAT GLOBAL
        // ============================================================

        const appliedDamage =
            applicationResults.reduce(
                (
                    total,
                    result
                ) =>
                    total
                    + Number(
                        result.damage
                        ?? 0
                    ),
                0
            );


        const stepResult = {

            applied:
                appliedDamage > 0,

            reason:
                allocationReason,

            requestedDamage:
                amount,

            appliedDamage,

            /*
            * L'excédent n'a plus de support physique
            * à dégrader lorsque toutes les protections
            * sont déjà tombées à 0.
            */
            overflow:
                Math.max(
                    0,
                    amount
                    - appliedDamage
                ),

            automatic,

            allocations:
                applicationResults

        };


        // ============================================================
        // 8. PERSISTANCE DU LEDGER
        // ============================================================

        const persistedWorkflow =
            await MeleeAttackWorkflowService
                .resolveApplicationStep(
                    combat,
                    workflowId,
                    stepKey,
                    stepResult
                );


        return {

            alreadyResolved:
                false,

            requiresAllocation:
                false,

            result:
                persistedWorkflow
                    .getApplicationStep(
                        stepKey
                    ),

            workflow:
                persistedWorkflow

        };

    }


    /**
     *      * Programme l'échange d'initiative produit
     *      * par un éclat de mêlée.
     *      *
     *      * L'échange est appliqué au round suivant par
     *      * InitiativeSwapService et le hook de Combat.
     *      */
    static async applySwapInitiative(
               combat,
               workflowId    ) 
    {
        const workflow =
        MeleeAttackWorkflowService.get(
            combat,
            workflowId
        );
        
        
        if (!workflow) {
            
            throw new Error(
                `Workflow de mêlée introuvable : ${workflowId}.`
            );
        
        }
        
        
        if (!workflow.canApplyConsequences) {
            
            throw new Error(
                "Les conséquences de cette attaque ne peuvent pas être appliquées."
            );
        
        }
        
        
        const stepKey =
        MELEE_APPLICATION_STEP_KEYS.SWAP_INITIATIVE;
        
        
        if (
            workflow.hasApplicationStep(
                stepKey
            )
        ) {
            
            return {
                
                alreadyResolved:
                true,
                
                result:
                workflow.getApplicationStep(
                    stepKey
                ),
                
                workflow
            
            };
        
        }
        
        
        const plan =
        this.createPlan(
            workflow
        );
        
        
        if (
            plan.effects
            ?.swapInitiative
            !== true
        ) {
            
            const stepResult = {
                
                applied:
                false,
                scheduled:
                false,
                
                reason:
                "not-selected"
            
            };
            
            
            const persistedWorkflow =
            await MeleeAttackWorkflowService
            .resolveApplicationStep(
                combat,
                workflowId,
                stepKey,
                stepResult
            );
            
            
            return {
                alreadyResolved:
                false,
                
                result:
                persistedWorkflow
                .getApplicationStep(
                    stepKey
                ),
                
                workflow:
                persistedWorkflow
            
            };
        
        }
        
        
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
        
        
        const swapResult =
        await InitiativeSwapService
        .scheduleSwap(
            combat,
            attacker,
            defender
        );
        
        
        const stepResult = {
            
            applied:
            false,
            
            scheduled:
            swapResult.scheduled
            === true,
            
            reason:
            "scheduled-next-round",
            
            combatId:
            swapResult.combatId,
            
            createdRound:
            Number(
                swapResult.createdRound
                ?? combat.round
                ?? 0
            ),
            
            applyRound:
            Number(
                swapResult.applyRound
                ?? 0
            ),
            
            attacker: {
                
                actorId:
                swapResult.attacker
                ?.actorId
                ?? attacker.id,
                
                combatantId:
                swapResult.attacker
                ?.combatantId
                ?? null,
                
                initiative:
                swapResult.attacker
                ?.initiative
                ?? null
            
            },
            
            target: {
                
                actorId:
                swapResult.target
                ?.actorId
                ?? defender.id,
                
                combatantId:
                swapResult.target
                ?.combatantId
                ?? null,
                initiative:
                swapResult.target
                ?.initiative
                ?? null
            
            }
        
        };
        
        
        const persistedWorkflow =
        await MeleeAttackWorkflowService
        .resolveApplicationStep(
            combat,
            workflowId,
            stepKey,
            stepResult
        );
        
        
        return {
            
            alreadyResolved:
            false,
            
            result:
            persistedWorkflow
            .getApplicationStep(
                stepKey
            ),
            
            workflow:
            persistedWorkflow
        
        };
        
    }
        
        
    /**
     * Résout l'éclat de désarmement.
     *
     * Le désarmement est volontairement narratif :
     *
     * - aucune sélection d'Item ;
     * - aucune mutation d'équipement ;
     * - aucun objet n'est automatiquement déséquipé ;
     * - le workflow enregistre uniquement que
     *   l'effet narratif doit être appliqué en jeu.
     *
     * L'étape est également journalisée lorsque
     * l'éclat n'a pas été sélectionné.
     */
    static async applyDisarm(
        combat,
        workflowId
    ) {

        const workflow =
            MeleeAttackWorkflowService.get(
                combat,
                workflowId
            );


        if (!workflow) {

            throw new Error(
                `Workflow de mêlée introuvable : ${workflowId}.`
            );

        }


        if (!workflow.canApplyConsequences) {

            throw new Error(
                "Les conséquences de cette attaque ne peuvent pas être appliquées."
            );

        }


        const stepKey =
            MELEE_APPLICATION_STEP_KEYS
                .DISARM;


        /*
        * Verrou persistant.
        *
        * L'étape ne doit jamais être enregistrée
        * une seconde fois.
        */
        if (
            workflow.hasApplicationStep(
                stepKey
            )
        ) {

            return {

                alreadyResolved:
                    true,

                result:
                    workflow.getApplicationStep(
                        stepKey
                    ),

                workflow

            };

        }


        const plan =
            this.createPlan(
                workflow
            );


        /*
        * L'éclat n'a pas été sélectionné.
        */
        if (
            plan.effects
                ?.disarm
            !== true
        ) {

            const stepResult = {

                applied:
                    false,

                narrative:
                    false,

                reason:
                    "not-selected"

            };


            const persistedWorkflow =
                await MeleeAttackWorkflowService
                    .resolveApplicationStep(
                        combat,
                        workflowId,
                        stepKey,
                        stepResult
                    );


            return {

                alreadyResolved:
                    false,

                result:
                    persistedWorkflow
                        .getApplicationStep(
                            stepKey
                        ),

                workflow:
                    persistedWorkflow

            };

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


        /*
        * Aucun Document Foundry n'est modifié ici.
        *
        * L'effet est simplement enregistré comme
        * conséquence narrative de l'attaque.
        */
        const stepResult = {

            applied:
                true,

            narrative:
                true,

            reason:
                "narrative-disarm",

            targetId:
                defender.id,

            targetName:
                defender.name

        };


        const persistedWorkflow =
            await MeleeAttackWorkflowService
                .resolveApplicationStep(
                    combat,
                    workflowId,
                    stepKey,
                    stepResult
                );


        return {

            alreadyResolved:
                false,

            result:
                persistedWorkflow
                    .getApplicationStep(
                        stepKey
                    ),

            workflow:
                persistedWorkflow

        };

    }

    /**
     * Applique l'éclat de renversement.
     *
     * Le renversement est un état persistant de l'Actor :
     *
     * system.conditions.prone = true
     *
     * L'étape est journalisée même lorsque l'éclat
     * n'a pas été sélectionné.
     */
    static async applyKnockdown(
        combat,
        workflowId
    ) {

        const workflow =
            MeleeAttackWorkflowService.get(
                combat,
                workflowId
            );


        if (!workflow) {

            throw new Error(
                `Workflow de mêlée introuvable : ${workflowId}.`
            );

        }


        if (!workflow.canApplyConsequences) {

            throw new Error(
                "Les conséquences de cette attaque ne peuvent pas être appliquées."
            );

        }


        const stepKey =
            MELEE_APPLICATION_STEP_KEYS
                .KNOCKDOWN;


        /*
        * Verrou persistant AVANT mutation.
        */
        if (
            workflow.hasApplicationStep(
                stepKey
            )
        ) {

            return {

                alreadyResolved:
                    true,

                result:
                    workflow.getApplicationStep(
                        stepKey
                    ),

                workflow

            };

        }


        const plan =
            this.createPlan(
                workflow
            );


        /*
        * L'éclat n'a pas été choisi.
        *
        * L'étape est néanmoins considérée
        * comme explicitement traitée.
        */
        if (
            plan.effects
                ?.knockdown
            !== true
        ) {

            const stepResult = {

                applied:
                    false,

                reason:
                    "not-selected"

            };


            const persistedWorkflow =
                await MeleeAttackWorkflowService
                    .resolveApplicationStep(
                        combat,
                        workflowId,
                        stepKey,
                        stepResult
                    );


            return {

                alreadyResolved:
                    false,

                result:
                    persistedWorkflow
                        .getApplicationStep(
                            stepKey
                        ),

                workflow:
                    persistedWorkflow

            };

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


        /*
        * Mutation réelle de l'Actor.
        */
        const knockdownResult =
            await defender.applyKnockdown();


        const stepResult = {

            applied:
                knockdownResult.applied
                === true,

            reason:
                knockdownResult.reason
                ?? null,

            targetId:
                knockdownResult.targetId
                ?? defender.id,

            targetName:
                knockdownResult.targetName
                ?? defender.name,

            previous:
                knockdownResult.previous
                ?? null,

            current:
                knockdownResult.current
                ?? defender.system
                    ?.conditions
                    ?.prone
                ?? null,

            alreadyProne:
                knockdownResult.alreadyProne
                === true,

            requiresPositionResolution:
                knockdownResult
                    .requiresPositionResolution
                === true

        };


        /*
        * Persistance immédiate après mutation.
        */
        const persistedWorkflow =
            await MeleeAttackWorkflowService
                .resolveApplicationStep(
                    combat,
                    workflowId,
                    stepKey,
                    stepResult
                );


        return {

            alreadyResolved:
                false,

            result:
                persistedWorkflow
                    .getApplicationStep(
                        stepKey
                    ),

            workflow:
                persistedWorkflow

        };

    }    
        
    static async applyGrapple(
        combat,
        workflowId
    ) {

        const workflow =
            MeleeAttackWorkflowService.get(
                combat,
                workflowId
            );


        if (!workflow) {

            throw new Error(
                `Workflow de mêlée introuvable : ${workflowId}.`
            );

        }


        if (!workflow.canApplyConsequences) {

            throw new Error(
                "Les conséquences de cette attaque ne peuvent pas être appliquées."
            );

        }


        const stepKey =
            MELEE_APPLICATION_STEP_KEYS
                .GRAPPLE;


        /*
        * Verrou persistant :
        * si l'étape a déjà été traitée,
        * aucune nouvelle saisie n'est créée.
        */
        if (
            workflow.hasApplicationStep(
                stepKey
            )
        ) {

            return {

                alreadyResolved:
                    true,

                result:
                    workflow.getApplicationStep(
                        stepKey
                    ),

                workflow

            };

        }


        const plan =
            this.createPlan(
                workflow
            );


        /*
        * L'éclat n'a pas été sélectionné.
        */
        if (
            plan.effects
                ?.grapple
            !== true
        ) {

            const stepResult = {

                applied:
                    false,

                reason:
                    "not-selected"

            };


            const persistedWorkflow =
                await MeleeAttackWorkflowService
                    .resolveApplicationStep(
                        combat,
                        workflowId,
                        stepKey,
                        stepResult
                    );


            return {

                alreadyResolved:
                    false,

                result:
                    persistedWorkflow
                        .getApplicationStep(
                            stepKey
                        ),

                workflow:
                    persistedWorkflow

            };

        }


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


        /*
        * Mutation réelle du combat.
        */
        const grappleResult =
            await GrappleService.establish({
                combat,
                attacker,
                target:
                    defender
            });


        const grapple =
            GrappleService.getGrappleBetween(
                combat,
                attacker,
                defender
            );


        const stepResult = {

            applied:
                grappleResult?.applied
                === true
                || Boolean(grapple),

            reason:
                grappleResult?.reason
                ?? (
                    grapple
                        ? "grapple-established"
                        : null
                ),

            attackerId:
                attacker.id,

            targetId:
                defender.id,

            grappleId:
                grapple?.id
                ?? grappleResult?.id
                ?? null

        };


        const persistedWorkflow =
            await MeleeAttackWorkflowService
                .resolveApplicationStep(
                    combat,
                    workflowId,
                    stepKey,
                    stepResult
                );


        return {

            alreadyResolved:
                false,

            result:
                persistedWorkflow
                    .getApplicationStep(
                        stepKey
                    ),

            workflow:
                persistedWorkflow

        };

    }


    /**
     * Applique la contre-attaque issue des éclats
     * de blocage (p.197, « BLOQUER »).
     *
     * Le défenseur a choisi cette action À L'AVEUGLE,
     * juste après son jet de blocage. Ses dégâts ne
     * sont appliqués qu'ici, à la toute fin du
     * workflow, en même temps que les conséquences
     * de l'attaquant.
     *
     * La cible de cette mutation est l'ATTAQUANT,
     * pas le défenseur : c'est l'inverse des autres
     * étapes de ce service.
     */
    static async applyBlockCounterAttack(
        combat,
        workflowId
    ) {

        const workflow =
            MeleeAttackWorkflowService.get(
                combat,
                workflowId
            );


        if (!workflow) {

            throw new Error(
                `Workflow de mêlée introuvable : ${workflowId}.`
            );

        }


        if (!workflow.canApplyConsequences) {

            throw new Error(
                "Les conséquences de cette attaque ne peuvent pas être appliquées."
            );

        }


        const stepKey =
            MELEE_APPLICATION_STEP_KEYS
                .BLOCK_COUNTER_ATTACK;


        if (
            workflow.hasApplicationStep(
                stepKey
            )
        ) {

            return {

                alreadyResolved:
                    true,

                result:
                    workflow.getApplicationStep(
                        stepKey
                    ),

                workflow

            };

        }


        const blockStuntResult =
            workflow.blockStunts
                ?.result
            ?? null;


        if (
            blockStuntResult
                ?.effects
                ?.counterAttack
            !== true
        ) {

            const stepResult = {

                applied:
                    false,

                reason:
                    "not-selected"

            };


            const persistedWorkflow =
                await MeleeAttackWorkflowService
                    .resolveApplicationStep(
                        combat,
                        workflowId,
                        stepKey,
                        stepResult
                    );


            return {

                alreadyResolved:
                    false,

                result:
                    persistedWorkflow
                        .getApplicationStep(
                            stepKey
                        ),

                workflow:
                    persistedWorkflow

            };

        }


        const amount =
            Number(
                blockStuntResult
                    .weaponDamage
                ?? 0
            );


        if (
            !Number.isInteger(amount)
            || amount < 0
        ) {

            throw new TypeError(
                "Les dégâts de la contre-attaque de blocage sont invalides."
            );

        }


        if (
            amount === 0
        ) {

            const stepResult = {

                applied:
                    false,

                reason:
                    "no-damage",

                requestedDamage:
                    0

            };


            const persistedWorkflow =
                await MeleeAttackWorkflowService
                    .resolveApplicationStep(
                        combat,
                        workflowId,
                        stepKey,
                        stepResult
                    );


            return {

                alreadyResolved:
                    false,

                result:
                    persistedWorkflow
                        .getApplicationStep(
                            stepKey
                        ),

                workflow:
                    persistedWorkflow

            };

        }


        const attacker =
            MeleeAttackWorkflowService
                .getAttacker(
                    workflow
                );


        if (!attacker) {

            throw new Error(
                "L'attaquant du workflow est introuvable."
            );

        }


        /*
         * MUTATION RÉELLE : la cible est
         * l'attaquant, pas le défenseur.
         */
        const damageResult =
            await attacker.takeAttributeDamage(
                "vigor",
                amount
            );


        const stepResult = {

            applied:
                true,

            requestedDamage:
                amount,

            attribute:
                damageResult.attribute,

            previous:
                Number(
                    damageResult.previous
                    ?? 0
                ),

            current:
                Number(
                    damageResult.current
                    ?? 0
                ),

            damage:
                Number(
                    damageResult.damage
                    ?? 0
                ),

            overflow:
                Number(
                    damageResult.overflow
                    ?? 0
                ),

            broken:
                damageResult.broken
                === true,

            targetId:
                attacker.id,

            targetName:
                attacker.name

        };


        const persistedWorkflow =
            await MeleeAttackWorkflowService
                .resolveApplicationStep(
                    combat,
                    workflowId,
                    stepKey,
                    stepResult
                );


        return {

            alreadyResolved:
                false,

            result:
                persistedWorkflow
                    .getApplicationStep(
                        stepKey
                    ),

            workflow:
                persistedWorkflow

        };

    }


    /**
     * Applique le désarmement issu des éclats
     * de blocage (p.197, « BLOQUER »).
     *
     * Comme pour le désarmement d'attaque
     * (applyDisarm), cet effet est volontairement
     * narratif : aucun Document Foundry n'est
     * modifié, c'est au MJ de le mettre en scène.
     *
     * La cible est l'ATTAQUANT, pas le défenseur.
     */
    static async applyBlockDisarm(
        combat,
        workflowId
    ) {

        const workflow =
            MeleeAttackWorkflowService.get(
                combat,
                workflowId
            );


        if (!workflow) {

            throw new Error(
                `Workflow de mêlée introuvable : ${workflowId}.`
            );

        }


        if (!workflow.canApplyConsequences) {

            throw new Error(
                "Les conséquences de cette attaque ne peuvent pas être appliquées."
            );

        }


        const stepKey =
            MELEE_APPLICATION_STEP_KEYS
                .BLOCK_DISARM;


        if (
            workflow.hasApplicationStep(
                stepKey
            )
        ) {

            return {

                alreadyResolved:
                    true,

                result:
                    workflow.getApplicationStep(
                        stepKey
                    ),

                workflow

            };

        }


        const blockStuntResult =
            workflow.blockStunts
                ?.result
            ?? null;


        if (
            blockStuntResult
                ?.effects
                ?.disarm
            !== true
        ) {

            const stepResult = {

                applied:
                    false,

                narrative:
                    false,

                reason:
                    "not-selected"

            };


            const persistedWorkflow =
                await MeleeAttackWorkflowService
                    .resolveApplicationStep(
                        combat,
                        workflowId,
                        stepKey,
                        stepResult
                    );


            return {

                alreadyResolved:
                    false,

                result:
                    persistedWorkflow
                        .getApplicationStep(
                            stepKey
                        ),

                workflow:
                    persistedWorkflow

            };

        }


        const attacker =
            MeleeAttackWorkflowService
                .getAttacker(
                    workflow
                );


        if (!attacker) {

            throw new Error(
                "L'attaquant du workflow est introuvable."
            );

        }


        const stepResult = {

            applied:
                true,

            narrative:
                true,

            reason:
                "narrative-block-disarm",

            targetId:
                attacker.id,

            targetName:
                attacker.name

        };


        const persistedWorkflow =
            await MeleeAttackWorkflowService
                .resolveApplicationStep(
                    combat,
                    workflowId,
                    stepKey,
                    stepResult
                );


        return {

            alreadyResolved:
                false,

            result:
                persistedWorkflow
                    .getApplicationStep(
                        stepKey
                    ),

            workflow:
                persistedWorkflow

        };

    }


}
