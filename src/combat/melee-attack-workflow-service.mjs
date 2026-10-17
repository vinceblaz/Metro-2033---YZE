/**
 * Adaptateur Foundry pour les workflows
 * d'attaque de mêlée.
 *
 * Responsabilités :
 *
 * - créer un workflow ;
 * - le persister sur un Combat Foundry ;
 * - le retrouver ;
 * - le mettre à jour ;
 * - vérifier qui peut répondre au blocage ;
 * - sérialiser les résultats métier avant persistance.
 *
 * Ce service :
 *
 * - n'ouvre aucune fenêtre ;
 * - ne crée pas de ChatMessage ;
 * - ne lance aucun jet ;
 * - ne calcule aucune conséquence ;
 * - n'applique aucun dégât ou effet ;
 * - ne vérifie pas le ciblage Foundry.
 */


import {
    canWriteCombatDirectly,
    relayWorkflowSave
} from "./melee-workflow-relay.mjs";

import {
    MeleeAttackWorkflow
} from "./melee-attack-workflow.mjs";


const SYSTEM_ID =
    "metro-2033-yze";


const FLAG_KEY =
    "meleeAttackWorkflows";


/* ============================================================
 * UTILITAIRES
 * ============================================================ */


function assertCombat(
    combat
) {

    if (!combat) {

        throw new Error(
            "Un Combat Foundry actif est requis."
        );

    }


    return combat;

}


function getStoredWorkflows(
    combat
) {

    assertCombat(
        combat
    );


    const stored =
        combat.getFlag(
            SYSTEM_ID,
            FLAG_KEY
        );


    if (
        !stored
        || typeof stored !== "object"
        || Array.isArray(stored)
    ) {

        return {};

    }


    return stored;

}


function cloneStoredWorkflows(
    combat
) {

    return foundry.utils.deepClone(
        getStoredWorkflows(
            combat
        )
    );

}


/* ============================================================
 * SÉRIALISATION DES RÉSULTATS DE JET
 * ============================================================ */


function serializeRollResult(
    result
) {

    if (!result) {

        return null;

    }


    return {

        successes:
            Number(
                result.successes
                ?? 0
            ),

        pushCount:
            Number(
                result.pushCount
                ?? 0
            ),

        dice:
            foundry.utils.deepClone(
                result.dice
                ?? {}
            ),

        history:
            foundry.utils.deepClone(
                result.history
                ?? []
            ),

        context:
            foundry.utils.deepClone(
                result.context
                ?? {}
            ),

        stressAfflictions:
            Number(
                result.stressAfflictions
                ?? 0
            ),

        eliminatedStress:
            Number(
                result.eliminatedStress
                ?? 0
            ),

        pool: {

            attribute:
                Number(
                    result.pool?.attribute
                    ?? 0
                ),

            skill:
                Number(
                    result.pool?.skill
                    ?? 0
                ),

            equipment:
                Number(
                    result.pool?.equipment
                    ?? 0
                ),

            stress:
                Number(
                    result.pool?.stress
                    ?? 0
                ),

            bonus:
                Number(
                    result.pool?.bonus
                    ?? 0
                ),

            penalty:
                Number(
                    result.pool?.penalty
                    ?? 0
                )

        }

    };

}


function serializeBlockResult(
    blockResult
) {

    if (!blockResult) {

        return null;

    }


    const serialized =
        {};


    for (
        const [
            key,
            value
        ]
        of Object.entries(
            blockResult
        )
    ) {

        if (key === "roll") {

            continue;

        }


        serialized[key] =
            foundry.utils.deepClone(
                value
            );

    }


    serialized.roll =
        blockResult.roll
            ? serializeRollResult(
                blockResult.roll
            )
            : null;


    return serialized;

}


/* ============================================================
 * SÉRIALISATION DES ÉCLATS
 * ============================================================ */


function serializeStuntResult(
    stuntResult
) {

    if (!stuntResult) {

        return null;

    }


    return {

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

        selections:
            Array.isArray(
                stuntResult.selections
            )
                ? stuntResult.selections.map(
                    selection => ({

                        key:
                            String(
                                selection.key
                                ?? ""
                            ),

                        quantity:
                            Number(
                                selection.quantity
                                ?? 0
                            ),

                        cost:
                            Number(
                                selection.cost
                                ?? 0
                            ),

                        spent:
                            Number(
                                selection.spent
                                ?? 0
                            ),

                        parameters:
                            foundry.utils.deepClone(
                                selection.parameters
                                ?? {}
                            )

                    })
                )
                : [],

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
 * Sérialise le résultat de la répartition des
 * éclats de blocage (p.197, « BLOQUER »).
 *
 * Ce résultat est déclaré par le défenseur À
 * L'AVEUGLE, juste après le jet de blocage, avant
 * de connaître le résultat de l'attaque. Il n'est
 * appliqué à aucun Actor à ce stade : la
 * contre-attaque et le désarmement ne seront
 * appliqués qu'à la toute fin du workflow, en même
 * temps que les conséquences de l'attaquant.
 */
function serializeBlockStuntResult(
    blockStuntResult
) {

    if (!blockStuntResult) {

        return null;

    }


    return {

        available:
            Number(
                blockStuntResult.available
                ?? 0
            ),

        spent:
            Number(
                blockStuntResult.spent
                ?? 0
            ),

        remaining:
            Number(
                blockStuntResult.remaining
                ?? 0
            ),

        selections:
            Array.isArray(
                blockStuntResult.selections
            )
                ? blockStuntResult.selections.map(
                    selection => ({

                        key:
                            String(
                                selection.key
                                ?? ""
                            ),

                        quantity:
                            Number(
                                selection.quantity
                                ?? 0
                            ),

                        cost:
                            Number(
                                selection.cost
                                ?? 0
                            ),

                        spent:
                            Number(
                                selection.spent
                                ?? 0
                            )

                    })
                )
                : [],

        effects: {

            cancelledSuccesses:
                Number(
                    blockStuntResult.effects
                        ?.cancelledSuccesses
                    ?? 0
                ),

            counterAttack:
                blockStuntResult.effects
                    ?.counterAttack
                === true,

            disarm:
                blockStuntResult.effects
                    ?.disarm
                === true

        },

        /*
         * Dégâts de l'arme du DÉFENSEUR
         * (celle utilisée pour bloquer), capturés
         * au moment de la déclaration à l'aveugle.
         *
         * Nécessaire pour appliquer la contre-attaque
         * à la toute fin du workflow, sans avoir à
         * retrouver l'arme de blocage a posteriori.
         */
        weaponDamage:
            Number(
                blockStuntResult.weaponDamage
                ?? 0
            )

    };

}


/* ============================================================
 * SÉRIALISATION DES CONSÉQUENCES
 * ============================================================ */


/**
 * Transforme un plan de conséquences déjà validé
 * en représentation simple persistable.
 *
 * IMPORTANT :
 *
 * ce plan décrit uniquement ce que l'attaque
 * devra produire.
 *
 * Il n'applique encore absolument rien
 * aux Actors ou au Combat.
 */
function serializeConsequenceResult(
    consequenceResult
) {

    if (!consequenceResult) {

        return null;

    }


    return {

        hit:
            consequenceResult.hit
            === true,


        outcome: {

            attackSuccesses:
                Number(
                    consequenceResult.outcome
                        ?.attackSuccesses
                    ?? 0
                ),

            blockSuccesses:
                Number(
                    consequenceResult.outcome
                        ?.blockSuccesses
                    ?? 0
                ),

            cancelledSuccesses:
                Number(
                    consequenceResult.outcome
                        ?.cancelledSuccesses
                    ?? 0
                ),

            netSuccesses:
                Number(
                    consequenceResult.outcome
                        ?.netSuccesses
                    ?? 0
                ),

            extraSuccesses:
                Number(
                    consequenceResult.outcome
                        ?.extraSuccesses
                    ?? 0
                )

        },


        damage: {

            weapon:
                Number(
                    consequenceResult.damage
                        ?.weapon
                    ?? 0
                ),

            vigor: {

                base:
                    Number(
                        consequenceResult.damage
                            ?.vigor
                            ?.base
                        ?? 0
                    ),

                stuntBonus:
                    Number(
                        consequenceResult.damage
                            ?.vigor
                            ?.stuntBonus
                        ?? 0
                    ),

                beforeProtection:
                    Number(
                        consequenceResult.damage
                            ?.vigor
                            ?.beforeProtection
                        ?? 0
                    )

            },

            agility: {

                stuntBonus:
                    Number(
                        consequenceResult.damage
                            ?.agility
                            ?.stuntBonus
                        ?? 0
                    ),

                total:
                    Number(
                        consequenceResult.damage
                            ?.agility
                            ?.total
                        ?? 0
                    )

            }

        },


        protection: {

            required:
                consequenceResult.protection
                    ?.required
                === true,

            incomingVigorDamage:
                Number(
                    consequenceResult.protection
                        ?.incomingVigorDamage
                    ?? 0
                )

        },


        effects: {

            swapInitiative:
                consequenceResult.effects
                    ?.swapInitiative
                === true,

            disarm:
                consequenceResult.effects
                    ?.disarm
                === true,

            knockdown:
                consequenceResult.effects
                    ?.knockdown
                === true,

            grapple:
                consequenceResult.effects
                    ?.grapple
                === true

        }

    };

}

/* ============================================================
 * SÉRIALISATION DE LA PROTECTION
 * ============================================================ */


/**
 * Transforme un résultat de Protection déjà résolu
 * en représentation simple persistable.
 *
 * Ce service ne lance aucun jet et ne calcule
 * aucun dégât final.
 *
 * Il conserve uniquement les informations
 * nécessaires à la reprise du workflow.
 */
function serializeProtectionResult(
    protectionResult
) {

    if (!protectionResult) {

        return null;

    }


    return {

        source:
            foundry.utils.deepClone(
                protectionResult.source
                ?? null
            ),


        dice:
            Array.isArray(
                protectionResult.dice
            )
                ? protectionResult.dice.map(
                    value =>
                        Number(
                            value
                            ?? 0
                        )
                )
                : [],


        successes:
            Number(
                protectionResult.successes
                ?? 0
            ),


        ones:
            Number(
                protectionResult.ones
                ?? 0
            ),


        incomingDamage:
            Number(
                protectionResult.incomingDamage
                ?? 0
            ),


        baseProtection:
            Number(
                protectionResult.baseProtection
                ?? 0
            ),


        protectionReduction:
            Number(
                protectionResult.protectionReduction
                ?? 0
            ),


        effectiveProtection:
            Number(
                protectionResult.effectiveProtection
                ?? 0
            ),


        protectionDamage:
            Number(
                protectionResult.protectionDamage
                ?? 0
            ),


        resilienceIgnored:
            protectionResult.resilienceIgnored
            === true,


        resiliencePrevented:
            Number(
                protectionResult.resiliencePrevented
                ?? 0
            ),


        rawPrevented:
            Number(
                protectionResult.rawPrevented
                ?? 0
            ),


        totalPrevented:
            Number(
                protectionResult.totalPrevented
                ?? 0
            ),


        remainingDamage:
            Number(
                protectionResult.remainingDamage
                ?? 0
            ),


        canPush:
            protectionResult.canPush
            === true

    };

}

/* ============================================================
 * SÉRIALISATION DE L'APPLICATION
 * ============================================================ */


/**
 * Transforme le résultat de l'application réelle
 * des conséquences en représentation persistable.
 *
 * Contrairement au plan de conséquences,
 * ce résultat décrit ce qui A RÉELLEMENT été
 * appliqué aux Documents Foundry.
 *
 * Le format reste volontairement générique à ce
 * stade : le futur service d'application sera
 * responsable de produire une structure métier
 * précise.
 */
function serializeApplicationResult(
    applicationResult
) {

    if (
        applicationResult === null
        || applicationResult === undefined
    ) {

        return null;

    }


    if (
        typeof applicationResult
        !== "object"
        || Array.isArray(
            applicationResult
        )
    ) {

        throw new TypeError(
            "Le résultat d'application doit être un objet."
        );

    }


    return foundry.utils.deepClone(
        applicationResult
    );

}

/* ============================================================
 * SERVICE
 * ============================================================ */


export class MeleeAttackWorkflowService {


    /* ========================================================
     * LECTURE
     * ======================================================== */


    static getAll(
        combat
    ) {

        const stored =
            getStoredWorkflows(
                combat
            );


        return Object.values(
            stored
        )
            .map(
                data =>
                    MeleeAttackWorkflow
                        .fromObject(
                            data
                        )
            );

    }


    static get(
        combat,
        workflowId
    ) {

        assertCombat(
            combat
        );


        if (
            typeof workflowId !== "string"
            || workflowId.length === 0
        ) {

            return null;

        }


        const stored =
            getStoredWorkflows(
                combat
            );


        const data =
            stored[
                workflowId
            ];


        if (!data) {

            return null;

        }


        return (
            MeleeAttackWorkflow
                .fromObject(
                    data
                )
        );

    }


    /* ========================================================
     * CRÉATION
     * ======================================================== */


    static async create(
        combat,
        {

            attacker,

            defender,

            weapon,

            attackerToken = null,

            defenderToken = null,

            canBlock = true,

            metadata = {}

        } = {}
    ) {

        assertCombat(
            combat
        );


        if (!attacker?.id) {

            throw new TypeError(
                "Un Actor attaquant est requis."
            );

        }


        if (!defender?.id) {

            throw new TypeError(
                "Un Actor défenseur est requis."
            );

        }


        if (!weapon?.id) {

            throw new TypeError(
                "Une arme est requise."
            );

        }


        const workflow =
            new MeleeAttackWorkflow({

                id:
                    foundry.utils.randomID(),

                attackerId:
                    attacker.id,

                defenderId:
                    defender.id,

                weaponId:
                    weapon.id,

                attackerTokenId:
                    attackerToken?.id
                    ?? null,

                defenderTokenId:
                    defenderToken?.id
                    ?? null,

                canBlock,

                metadata: {

                    createdAt:
                        Date.now(),

                    ...metadata

                }

            });


        await this.save(
            combat,
            workflow
        );


        return workflow;

    }


    /* ========================================================
     * PERSISTANCE
     * ======================================================== */


    static async save(
        combat,
        workflow
    ) {

        assertCombat(
            combat
        );


        if (
            !(
                workflow
                instanceof
                MeleeAttackWorkflow
            )
        ) {

            throw new TypeError(
                "Un MeleeAttackWorkflow est requis."
            );

        }


        const stored =
            cloneStoredWorkflows(
                combat
            );


        /*
         * Un joueur ne peut pas écrire dans le Combat : ses étapes
         * de défenseur sont relayées au MJ actif, qui les valide
         * (cf. melee-workflow-relay.mjs). Le MJ écrit directement.
         */
        if (!canWriteCombatDirectly(combat)) {

            await relayWorkflowSave(
                combat,
                workflow.toObject()
            );

            return workflow;

        }

        stored[
            workflow.id
        ] =
            workflow.toObject();


        await combat.setFlag(
            SYSTEM_ID,
            FLAG_KEY,
            stored
        );


        return workflow;

    }


    static async remove(
        combat,
        workflowId
    ) {

        assertCombat(
            combat
        );


        const stored =
            cloneStoredWorkflows(
                combat
            );


        if (
            !Object.hasOwn(
                stored,
                workflowId
            )
        ) {

            return false;

        }


        delete stored[
            workflowId
        ];


        if (
            Object.keys(
                stored
            ).length === 0
        ) {

            await combat.unsetFlag(
                SYSTEM_ID,
                FLAG_KEY
            );

        }
        else {

            await combat.setFlag(
                SYSTEM_ID,
                FLAG_KEY,
                stored
            );

        }


        return true;

    }


    static async clear(
        combat
    ) {

        assertCombat(
            combat
        );


        await combat.unsetFlag(
            SYSTEM_ID,
            FLAG_KEY
        );


        return true;

    }


    /* ========================================================
    * RÉSOLUTION DES DOCUMENTS
    * ======================================================== */


    /**
     * Retrouve un Actor associé à une référence
     * persistée du workflow.
     *
     * Priorité :
     *
     * 1. Actor synthétique du Token encore présent
     *    dans le Combat ;
     *
     * 2. Actor monde.
     *
     * Cela garantit que les Items embarqués,
     * états et ressources modifiés correspondent
     * exactement au participant réel du combat.
     */
    static getActorFromReference(
        reference
    ) {

        if (!reference?.actorId) {
            return null;
        }


        /*
        * Si le workflow connaît le Token,
        * on cherche d'abord le Combatant
        * correspondant.
        *
        * Cette approche fonctionne également
        * pour les Tokens non liés disposant
        * d'un Actor synthétique.
        */
        if (
            reference.tokenId
            && game.combat
        ) {

            const combatant =
                Array.from(
                    game.combat.combatants
                ).find(
                    candidate =>
                        candidate.tokenId
                        === reference.tokenId
                );


            const tokenActor =
                combatant?.actor
                ?? null;


            if (
                tokenActor
                && tokenActor.id
                    === reference.actorId
            ) {

                return tokenActor;

            }

        }


        /*
        * Fallback :
        * Actor monde classique.
        */
        return (
            game.actors.get(
                reference.actorId
            )
            ?? null
        );

    }


    static getAttacker(
        workflow
    ) {

        return this.getActorFromReference(
            workflow?.attacker
        );

    }


    static getDefender(
        workflow
    ) {

        return this.getActorFromReference(
            workflow?.defender
        );

    }


    static getWeapon(
        workflow
    ) {

        const attacker =
            this.getAttacker(
                workflow
            );


        if (!attacker) {
            return null;
        }


        return (
            attacker.items.get(
                workflow?.weaponId
            )
            ?? null
        );

    }


    /* ========================================================
     * AUTORISATION DE DÉFENSE
     * ======================================================== */


    static canUserDecideDefense(
        workflow,
        user = game.user
    ) {

        if (
            !workflow
            || !user
        ) {

            return false;

        }


        if (
            user.isGM
        ) {

            return true;

        }


        const defender =
            this.getDefender(
                workflow
            );


        if (!defender) {

            return false;

        }


        return defender.testUserPermission(
            user,
            "OWNER"
        );

    }


    static assertUserCanDecideDefense(
        workflow,
        user = game.user
    ) {

        if (
            !this.canUserDecideDefense(
                workflow,
                user
            )
        ) {

            throw new Error(
                "Seul le MJ ou le propriétaire du défenseur peut prendre cette décision."
            );

        }


        return true;

    }


    /* ========================================================
     * DÉCISION DE DÉFENSE
     * ======================================================== */


    static async chooseDefense(
        combat,
        workflowId,
        decision,
        {
            user = game.user
        } = {}
    ) {

        const workflow =
            this.get(
                combat,
                workflowId
            );


        if (!workflow) {

            throw new Error(
                `Workflow de mêlée introuvable : ${workflowId}.`
            );

        }


        this.assertUserCanDecideDefense(
            workflow,
            user
        );


        workflow.chooseDefense(
            decision
        );


        await this.save(
            combat,
            workflow
        );


        return workflow;

    }


    /* ========================================================
     * BLOCAGE
     * ======================================================== */


    static async resolveBlock(
        combat,
        workflowId,
        blockResult
    ) {

        const workflow =
            this.get(
                combat,
                workflowId
            );


        if (!workflow) {

            throw new Error(
                `Workflow de mêlée introuvable : ${workflowId}.`
            );

        }


        const serializedBlockResult =
            serializeBlockResult(
                blockResult
            );


        workflow.resolveBlock(
            serializedBlockResult
        );


        await this.save(
            combat,
            workflow
        );


        return workflow;

    }

    /**
     * Résout la répartition des éclats de blocage
     * déclarée par le défenseur À L'AVEUGLE, juste
     * après le jet de blocage.
     *
     * La contre-attaque et le désarmement qui en
     * découlent ne sont pas appliqués ici : ils ne
     * le seront qu'à la toute fin du workflow, en
     * même temps que les conséquences de l'attaquant.
     */
    static async resolveBlockStunts(
        combat,
        workflowId,
        blockStuntResult
    ) {

        const workflow =
            this.get(
                combat,
                workflowId
            );


        if (!workflow) {

            throw new Error(
                `Workflow de mêlée introuvable : ${workflowId}.`
            );

        }


        const serializedBlockStuntResult =
            serializeBlockStuntResult(
                blockStuntResult
            );


        workflow.resolveBlockStunts(
            serializedBlockStuntResult
        );


        await this.save(
            combat,
            workflow
        );


        return workflow;

    }

    /**
     * Annule une préparation de blocage
     * et restaure la décision de défense.
     */
    static async cancelBlockPreparation(
        combat,
        workflowId,
        {
            user = game.user
        } = {}
    ) {

        const workflow =
            this.get(
                combat,
                workflowId
            );


        if (!workflow) {

            throw new Error(
                `Workflow de mêlée introuvable : ${workflowId}.`
            );

        }


        /*
        * Seul le défenseur concerné ou le MJ
        * peut revenir sur cette décision.
        */
        this.assertUserCanDecideDefense(
            workflow,
            user
        );


        workflow.cancelBlockPreparation();


        await this.save(
            combat,
            workflow
        );


        return workflow;

    }    

    /* ========================================================
     * ATTAQUE
     * ======================================================== */


    static async resolveAttack(
        combat,
        workflowId,
        attackResult
    ) {

        const workflow =
            this.get(
                combat,
                workflowId
            );


        if (!workflow) {

            throw new Error(
                `Workflow de mêlée introuvable : ${workflowId}.`
            );

        }


        const serializedAttackResult =
            serializeRollResult(
                attackResult
            );


        workflow.resolveAttack(
            serializedAttackResult
        );


        await this.save(
            combat,
            workflow
        );


        return workflow;

    }

    static async updateAttackResult(
        combat,
        workflowId,
        attackResult
    ) {

        const workflow =
            this.get(
                combat,
                workflowId
            );


        if (!workflow) {

            throw new Error(
                `Workflow de mêlée introuvable : ${workflowId}.`
            );

        }


        const serializedAttackResult =
            serializeRollResult(
                attackResult
            );


        if (!serializedAttackResult) {

            throw new TypeError(
                "Un résultat d'attaque est requis."
            );

        }


        workflow.updateAttackResult(
            serializedAttackResult
        );


        await this.save(
            combat,
            workflow
        );


        const persistedWorkflow =
            this.get(
                combat,
                workflowId
            );


        if (!persistedWorkflow) {

            throw new Error(
                "Le workflow vient d'être enregistré mais ne peut pas être relu depuis le Combat."
            );

        }


        return persistedWorkflow;

    }

    static async finalizeAttack(
        combat,
        workflowId
    ) {

        const workflow =
            this.get(
                combat,
                workflowId
            );


        if (!workflow) {

            throw new Error(
                `Workflow de mêlée introuvable : ${workflowId}.`
            );

        }


        workflow.finalizeAttack();


        await this.save(
            combat,
            workflow
        );


        const persistedWorkflow =
            this.get(
                combat,
                workflowId
            );


        if (!persistedWorkflow) {

            throw new Error(
                "Le workflow vient d'être enregistré mais ne peut pas être relu depuis le Combat."
            );

        }


        return persistedWorkflow;

    }    

    /* ========================================================
     * ÉCLATS
     * ======================================================== */


    static async resolveStunts(
        combat,
        workflowId,
        stuntResult
    ) {

        const workflow =
            this.get(
                combat,
                workflowId
            );


        if (!workflow) {

            throw new Error(
                `Workflow de mêlée introuvable : ${workflowId}.`
            );

        }


        const serializedStuntResult =
            serializeStuntResult(
                stuntResult
            );


        if (!serializedStuntResult) {

            throw new TypeError(
                "Un résultat d'éclats est requis."
            );

        }


        workflow.resolveStunts(
            serializedStuntResult
        );


        await this.save(
            combat,
            workflow
        );


        const persistedWorkflow =
            this.get(
                combat,
                workflowId
            );


        if (!persistedWorkflow) {

            throw new Error(
                "Le workflow vient d'être enregistré mais ne peut pas être relu depuis le Combat."
            );

        }


        return persistedWorkflow;

    }


    /* ========================================================
     * CONSÉQUENCES
     * ======================================================== */


    /**
     * Persiste un plan de conséquences déjà calculé
     * et validé par la couche métier.
     *
     * Le service ne calcule aucune conséquence
     * et ne modifie aucun Actor.
     */
    static async resolveConsequences(
        combat,
        workflowId,
        consequenceResult
    ) {

        const workflow =
            this.get(
                combat,
                workflowId
            );


        if (!workflow) {

            throw new Error(
                `Workflow de mêlée introuvable : ${workflowId}.`
            );

        }


        const serializedConsequenceResult =
            serializeConsequenceResult(
                consequenceResult
            );


        if (!serializedConsequenceResult) {

            throw new TypeError(
                "Un résultat de conséquences est requis."
            );

        }


        /*
         * Le workflow revalide son état.
         *
         * Les deux chemins actuellement légitimes sont :
         *
         * ATTACK_RESOLVED
         * → attaque sans étape d'éclats
         *
         * STUNTS_RESOLVED
         * → attaque avec éclats validés
         */
        workflow.resolveConsequences(
            serializedConsequenceResult
        );


        await this.save(
            combat,
            workflow
        );


        /*
         * Comme pour les éclats, on relit
         * depuis Combat.flags afin que la valeur
         * retournée corresponde réellement
         * à l'état persisté.
         */
        const persistedWorkflow =
            this.get(
                combat,
                workflowId
            );


        if (!persistedWorkflow) {

            throw new Error(
                "Le workflow vient d'être enregistré mais ne peut pas être relu depuis le Combat."
            );

        }


        return persistedWorkflow;

    }

    /* ========================================================
     * PROTECTION
     * ======================================================== */


    /**
     * Persiste un résultat de Protection déjà résolu.
     *
     * Le service :
     *
     * - ne lance aucun jet ;
     * - ne calcule pas la Protection ;
     * - n'applique aucun dégât ;
     * - ne modifie aucun Actor.
     *
     * Il sérialise uniquement le résultat reçu,
     * délègue la transition d'état au workflow,
     * puis persiste celui-ci dans Combat.flags.
     */
    static async resolveProtection(
        combat,
        workflowId,
        protectionResult
    ) {

        const workflow =
            this.get(
                combat,
                workflowId
            );


        if (!workflow) {

            throw new Error(
                `Workflow de mêlée introuvable : ${workflowId}.`
            );

        }


        const serializedProtectionResult =
            serializeProtectionResult(
                protectionResult
            );


        if (!serializedProtectionResult) {

            throw new TypeError(
                "Un résultat de Protection est requis."
            );

        }


        /*
         * Le workflow contrôle lui-même :
         *
         * - que l'état est CONSEQUENCES_RESOLVED ;
         * - qu'une Protection est réellement requise.
         */
        workflow.resolveProtection(
            serializedProtectionResult
        );


        await this.save(
            combat,
            workflow
        );


        /*
         * On relit depuis Combat.flags afin
         * de vérifier que le résultat retourné
         * correspond réellement à l'état persisté.
         */
        const persistedWorkflow =
            this.get(
                combat,
                workflowId
            );


        if (!persistedWorkflow) {

            throw new Error(
                "Le workflow vient d'être enregistré mais ne peut pas être relu depuis le Combat."
            );

        }


        return persistedWorkflow;

    }

    /* ========================================================
     * APPLICATION
     * ======================================================== */

        /**
     * Persiste le résultat d'une étape individuelle
     * de l'application finale.
     *
     * Cette méthode est le verrou de reprise :
     *
     * - elle relit toujours le workflow persistant ;
     * - elle délègue au workflow la vérification
     *   que l'étape n'a pas déjà été traitée ;
     * - elle sauvegarde immédiatement l'étape ;
     * - elle relit ensuite Combat.flags.
     *
     * Une étape déjà persistée ne peut donc pas être
     * appliquée une deuxième fois lors d'une reprise.
     */
    static async resolveApplicationStep(
        combat,
        workflowId,
        stepKey,
        stepResult
    ) {

        const workflow =
            this.get(
                combat,
                workflowId
            );


        if (!workflow) {

            throw new Error(
                `Workflow de mêlée introuvable : ${workflowId}.`
            );

        }


        const serializedStepResult =
            serializeApplicationResult(
                stepResult
            );


        if (!serializedStepResult) {

            throw new TypeError(
                "Un résultat d'étape d'application est requis."
            );

        }


        /*
         * Le workflow contrôle :
         *
         * - que l'application est actuellement autorisée ;
         * - que stepKey est connu ;
         * - que cette étape n'a pas déjà été résolue.
         */
        workflow.resolveApplicationStep(
            stepKey,
            serializedStepResult
        );


        /*
         * Persistance immédiate.
         *
         * C'est volontaire :
         *
         * on ne veut pas attendre la fin des sept
         * étapes pour écrire le journal, sinon une
         * erreur intermédiaire pourrait provoquer
         * une nouvelle application des mutations
         * précédentes.
         */
        await this.save(
            combat,
            workflow
        );


        /*
         * Relecture réelle depuis Combat.flags.
         */
        const persistedWorkflow =
            this.get(
                combat,
                workflowId
            );


        if (!persistedWorkflow) {

            throw new Error(
                "Le workflow vient d'être enregistré mais ne peut pas être relu depuis le Combat."
            );

        }


        return persistedWorkflow;

    }

    /**
     * Persiste le résultat de l'application réelle
     * des conséquences.
     *
     * IMPORTANT :
     *
     * ce service n'applique lui-même aucun dégât
     * et aucun effet.
     *
     * Il reçoit uniquement le compte rendu produit
     * par le futur service d'application Foundry.
     *
     * Le workflow contrôle notamment que :
     *
     * - toutes les résolutions nécessaires sont faites ;
     * - l'application n'a pas déjà été enregistrée.
     */
    static async resolveApplication(
        combat,
        workflowId,
        applicationResult
    ) {

        const workflow =
            this.get(
                combat,
                workflowId
            );


        if (!workflow) {

            throw new Error(
                `Workflow de mêlée introuvable : ${workflowId}.`
            );

        }


        const serializedApplicationResult =
            serializeApplicationResult(
                applicationResult
            );


        if (!serializedApplicationResult) {

            throw new TypeError(
                "Un résultat d'application est requis."
            );

        }


        /*
         * Le workflow contrôle :
         *
         * - que les conséquences peuvent être appliquées ;
         * - qu'aucune application n'a déjà été enregistrée.
         */
        workflow.resolveApplication(
            serializedApplicationResult
        );


        await this.save(
            combat,
            workflow
        );


        /*
         * Comme pour les conséquences et la Protection,
         * on relit depuis Combat.flags.
         *
         * Le résultat retourné représente donc
         * réellement l'état persistant.
         */
        const persistedWorkflow =
            this.get(
                combat,
                workflowId
            );


        if (!persistedWorkflow) {

            throw new Error(
                "Le workflow vient d'être enregistré mais ne peut pas être relu depuis le Combat."
            );

        }


        return persistedWorkflow;

    }

    /* ========================================================
     * TERMINAISON
     * ======================================================== */


    static async complete(
        combat,
        workflowId
    ) {

        const workflow =
            this.get(
                combat,
                workflowId
            );


        if (!workflow) {

            throw new Error(
                `Workflow de mêlée introuvable : ${workflowId}.`
            );

        }


        workflow.complete();


        await this.save(
            combat,
            workflow
        );


        return workflow;

    }

}