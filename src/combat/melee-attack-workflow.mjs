/**
 * Workflow métier d'une attaque de mêlée.
 *
 * Cette classe orchestre uniquement les états :
 *
 * - décision de blocage ;
 * - préparation/résolution du blocage ;
 * - préparation/résolution de l'attaque ;
 * - résolution éventuelle des éclats ;
 * - calcul des conséquences ;
 * - résolution éventuelle de la Protection ;
 * - suivi de l'application finale ;
 * - fin du workflow.
 *
 * Elle ne :
 * - lance aucun jet ;
 * - ne calcule pas l'opposition attaque/blocage ;
 * - n'ouvre aucune fenêtre ;
 * - ne crée aucun ChatMessage ;
 * - ne consomme aucune action ;
 * - n'applique aucun dégât ou effet ;
 * - ne dépend pas de Foundry.
 */


/* ============================================================
 * ÉTATS
 * ============================================================ */


export const MELEE_ATTACK_WORKFLOW_STATES =
    Object.freeze({

        AWAITING_DEFENSE:
            "awaiting-defense",

        BLOCK_PREPARATION:
            "block-preparation",

        BLOCK_RESOLVED:
            "block-resolved",

        AWAITING_BLOCK_STUNTS:
            "awaiting-block-stunts",

        DEFENSE_DECLINED:
            "defense-declined",

        ATTACK_PREPARATION:
            "attack-preparation",

        ATTACK_RESOLVED:
            "attack-resolved",

        STUNTS_RESOLVED:
            "stunts-resolved",

        CONSEQUENCES_RESOLVED:
            "consequences-resolved",

        PROTECTION_RESOLVED:
            "protection-resolved",

        COMPLETED:
            "completed"

    });


/* ============================================================
 * DÉCISIONS DE DÉFENSE
 * ============================================================ */


export const MELEE_DEFENSE_DECISIONS =
    Object.freeze({

        BLOCK:
            "block",

        DECLINE:
            "decline"

    });


/* ============================================================
 * ÉTAPES D'APPLICATION
 * ============================================================ */


/**
 * Chaque mutation persistante possède sa propre
 * entrée dans le journal d'application.
 *
 * null
 * =
 * étape pas encore traitée.
 *
 * objet
 * =
 * étape traitée, qu'elle ait réellement produit
 * une mutation ou qu'elle ait été explicitement
 * ignorée car non nécessaire.
 */
export const MELEE_APPLICATION_STEP_KEYS =
    Object.freeze({

        VIGOR_DAMAGE:
            "vigorDamage",

        AGILITY_DAMAGE:
            "agilityDamage",

        PROTECTION_DAMAGE:
            "protectionDamage",

        SWAP_INITIATIVE:
            "swapInitiative",

        DISARM:
            "disarm",

        KNOCKDOWN:
            "knockdown",

        GRAPPLE:
            "grapple",

        BLOCK_COUNTER_ATTACK:
            "blockCounterAttack",

        BLOCK_DISARM:
            "blockDisarm"

    });


const APPLICATION_STEP_KEYS =
    Object.freeze(
        Object.values(
            MELEE_APPLICATION_STEP_KEYS
        )
    );


/* ============================================================
 * UTILITAIRES
 * ============================================================ */


function normalizeRequiredString(
    value,
    label
) {

    if (
        typeof value !== "string"
        || value.trim().length === 0
    ) {

        throw new TypeError(
            `${label} est requis.`
        );

    }


    return value.trim();

}


function normalizeOptionalString(
    value
) {

    if (
        value === null
        || value === undefined
    ) {

        return null;

    }


    const normalized =
        String(value).trim();


    return (
        normalized.length > 0
            ? normalized
            : null
    );

}


function cloneResult(
    result
) {

    if (
        result === null
        || result === undefined
    ) {

        return null;

    }


    /*
     * Le workflow ne dépend pas de Foundry.
     *
     * Les services Foundry sont responsables
     * de fournir des objets sérialisables.
     */
    if (
        typeof structuredClone
        === "function"
    ) {

        return structuredClone(
            result
        );

    }


    return result;

}


function createEmptyApplicationSteps(

) {

    return {

        [MELEE_APPLICATION_STEP_KEYS.VIGOR_DAMAGE]:
            null,

        [MELEE_APPLICATION_STEP_KEYS.AGILITY_DAMAGE]:
            null,

        [MELEE_APPLICATION_STEP_KEYS.PROTECTION_DAMAGE]:
            null,

        [MELEE_APPLICATION_STEP_KEYS.SWAP_INITIATIVE]:
            null,

        [MELEE_APPLICATION_STEP_KEYS.DISARM]:
            null,

        [MELEE_APPLICATION_STEP_KEYS.KNOCKDOWN]:
            null,

        [MELEE_APPLICATION_STEP_KEYS.GRAPPLE]:
            null,

        [MELEE_APPLICATION_STEP_KEYS.BLOCK_COUNTER_ATTACK]:
            null,

        [MELEE_APPLICATION_STEP_KEYS.BLOCK_DISARM]:
            null

    };

}


function normalizeApplicationSteps(
    steps
) {

    const normalized =
        createEmptyApplicationSteps();


    if (
        !steps
        || typeof steps !== "object"
        || Array.isArray(steps)
    ) {

        return normalized;

    }


    for (
        const stepKey
        of APPLICATION_STEP_KEYS
    ) {

        normalized[stepKey] =
            cloneResult(
                steps[stepKey]
                ?? null
            );

    }


    return normalized;

}


/* ============================================================
 * WORKFLOW
 * ============================================================ */


export class MeleeAttackWorkflow {


    constructor({

        id,

        attackerId,

        defenderId,

        weaponId,

        attackerTokenId = null,

        defenderTokenId = null,

        canBlock = true,

        metadata = {}

    } = {}) {

        this.id =
            normalizeRequiredString(
                id,
                "L'identifiant du workflow"
            );


        this.type =
            "melee";


        this.state =
            canBlock
                ? MELEE_ATTACK_WORKFLOW_STATES
                    .AWAITING_DEFENSE

                : MELEE_ATTACK_WORKFLOW_STATES
                    .ATTACK_PREPARATION;


        this.attacker = {

            actorId:
                normalizeRequiredString(
                    attackerId,
                    "L'attaquant"
                ),

            tokenId:
                normalizeOptionalString(
                    attackerTokenId
                )

        };


        this.defender = {

            actorId:
                normalizeRequiredString(
                    defenderId,
                    "Le défenseur"
                ),

            tokenId:
                normalizeOptionalString(
                    defenderTokenId
                )

        };


        if (
            this.attacker.actorId
            === this.defender.actorId
        ) {

            throw new Error(
                "L'attaquant et le défenseur doivent être différents."
            );

        }


        this.weaponId =
            normalizeRequiredString(
                weaponId,
                "L'arme"
            );


        this.defense = {

            offered:
                canBlock === true,

            decision:
                canBlock === true
                    ? null
                    : MELEE_DEFENSE_DECISIONS
                        .DECLINE,

            result:
                null

        };


        this.attack = {

            result:
                null,

            finalized:
                false

        };


        this.blockStunts = {

            result:
                null

        };


        this.stunts = {

            result:
                null

        };


        this.consequences = {

            result:
                null

        };


        this.protection = {

            result:
                null

        };


        /*
         * Journal persistant de l'application finale.
         *
         * Chaque étape est enregistrée séparément
         * afin de pouvoir reprendre une application
         * partiellement terminée sans rejouer les
         * étapes déjà confirmées.
         *
         * result reste null jusqu'à ce que toutes
         * les étapes aient été traitées.
         */
        this.application = {

            steps:
                createEmptyApplicationSteps(),

            result:
                null

        };


        this.metadata = {
            ...metadata
        };

    }


    /* ========================================================
     * LECTURE
     * ======================================================== */


    get isCompleted(

    ) {

        return (
            this.state
            === MELEE_ATTACK_WORKFLOW_STATES
                .COMPLETED
        );

    }


    get isAwaitingDefense(

    ) {

        return (
            this.state
            === MELEE_ATTACK_WORKFLOW_STATES
                .AWAITING_DEFENSE
        );

    }


    get isAwaitingBlockPreparation(

    ) {

        return (
            this.state
            === MELEE_ATTACK_WORKFLOW_STATES
                .BLOCK_PREPARATION
        );

    }


    get isAwaitingBlockStunts(

    ) {

        return (
            this.state
            === MELEE_ATTACK_WORKFLOW_STATES
                .AWAITING_BLOCK_STUNTS
        );

    }


    get canResolveBlockStunts(

    ) {

        return this.isAwaitingBlockStunts;

    }


    get hasBlockStuntResult(

    ) {

        return (
            this.blockStunts.result
            !== null
        );

    }


    get isAwaitingAttackPreparation(

    ) {

        return (
            this.state
            === MELEE_ATTACK_WORKFLOW_STATES
                .ATTACK_PREPARATION
        );

    }


    get isAwaitingStunts(

    ) {

        return (
            this.state
            === MELEE_ATTACK_WORKFLOW_STATES
                .ATTACK_RESOLVED

            && this.isAttackFinalized
        );

    }


    get isAwaitingConsequences(

    ) {

        return (
            this.state
            === MELEE_ATTACK_WORKFLOW_STATES
                .STUNTS_RESOLVED
        );

    }


    get isAwaitingProtection(

    ) {

        return (
            this.state
            === MELEE_ATTACK_WORKFLOW_STATES
                .CONSEQUENCES_RESOLVED

            && this.consequences
                .result
                ?.protection
                ?.required
                === true
        );

    }


    get hasBlockResult(

    ) {

        return (
            this.defense.result
            !== null
        );

    }


    get hasAttackResult(

    ) {

        return (
            this.attack.result
            !== null
        );

    }

    get isAttackFinalized(

    ) {

        return (
            this.hasAttackResult
            && this.attack.finalized
                === true
        );

    }    


    get hasStuntResult(

    ) {

        return (
            this.stunts.result
            !== null
        );

    }


    get hasConsequencesResult(

    ) {

        return (
            this.consequences.result
            !== null
        );

    }


    get hasProtectionResult(

    ) {

        return (
            this.protection.result
            !== null
        );

    }


    get hasApplicationResult(

    ) {

        return (
            this.application.result
            !== null
        );

    }


    get protectionRequired(

    ) {

        return (
            this.consequences
                .result
                ?.protection
                ?.required
            === true
        );

    }


    /**
     * Toutes les étapes du journal ont-elles été
     * explicitement traitées ?
     *
     * Une étape avec :
     *
     * {
     *   applied:false,
     *   reason:"not-required"
     * }
     *
     * est bien considérée comme traitée.
     */
    get areApplicationStepsResolved(

    ) {

        return APPLICATION_STEP_KEYS.every(
            stepKey =>
                this.application
                    .steps[
                        stepKey
                    ]
                !== null
        );

    }


    /**
     * Liste les étapes restant à traiter.
     */
    get pendingApplicationSteps(

    ) {

        return APPLICATION_STEP_KEYS.filter(
            stepKey =>
                this.application
                    .steps[
                        stepKey
                    ]
                === null
        );

    }


    get canApplyConsequences(

    ) {

        const withoutProtection =
            this.state
                === MELEE_ATTACK_WORKFLOW_STATES
                    .CONSEQUENCES_RESOLVED

            && !this.protectionRequired;


        const afterProtection =
            this.state
                === MELEE_ATTACK_WORKFLOW_STATES
                    .PROTECTION_RESOLVED

            && this.hasProtectionResult;


        return (
            !this.hasApplicationResult
            && (
                withoutProtection
                || afterProtection
            )
        );

    }


    get nextResolution(

    ) {

        switch (
            this.state
        ) {

            case MELEE_ATTACK_WORKFLOW_STATES
                .AWAITING_DEFENSE:

                return "defense-decision";


            case MELEE_ATTACK_WORKFLOW_STATES
                .BLOCK_PREPARATION:

                return "melee-block";


            case MELEE_ATTACK_WORKFLOW_STATES
                .AWAITING_BLOCK_STUNTS:

                return "melee-block-stunts";


            case MELEE_ATTACK_WORKFLOW_STATES
                .ATTACK_PREPARATION:

                return "melee-attack";


            case MELEE_ATTACK_WORKFLOW_STATES
                .ATTACK_RESOLVED:

                return this.isAttackFinalized
                    ? "melee-stunts"
                    : "melee-attack-result";


            case MELEE_ATTACK_WORKFLOW_STATES
                .STUNTS_RESOLVED:

                return "melee-consequences";


            case MELEE_ATTACK_WORKFLOW_STATES
                .CONSEQUENCES_RESOLVED:

                return this.protectionRequired
                    ? "melee-protection"
                    : "melee-apply-consequences";


            case MELEE_ATTACK_WORKFLOW_STATES
                .PROTECTION_RESOLVED:

                return "melee-apply-consequences";


            case MELEE_ATTACK_WORKFLOW_STATES
                .COMPLETED:

                return null;


            default:

                return null;

        }

    }


    /* ========================================================
     * JOURNAL D'APPLICATION
     * ======================================================== */


    /**
     * Retourne le résultat persistant d'une étape.
     */
    getApplicationStep(
        stepKey
    ) {

        this.#assertApplicationStepKey(
            stepKey
        );


        return cloneResult(
            this.application
                .steps[
                    stepKey
                ]
        );

    }


    /**
     * Indique si une étape a déjà été traitée.
     */
    hasApplicationStep(
        stepKey
    ) {

        this.#assertApplicationStepKey(
            stepKey
        );


        return (
            this.application
                .steps[
                    stepKey
                ]
            !== null
        );

    }


    /**
     * Enregistre le résultat d'une mutation ou
     * d'une étape explicitement ignorée.
     *
     * Une étape ne peut jamais être écrasée.
     */
    resolveApplicationStep(
        stepKey,
        stepResult
    ) {

        if (
            !this.canApplyConsequences
        ) {

            throw new Error(
                "Les conséquences ne peuvent pas être appliquées dans l'état actuel."
            );

        }


        this.#assertApplicationStepKey(
            stepKey
        );


        if (
            this.hasApplicationStep(
                stepKey
            )
        ) {

            throw new Error(
                `L'étape d'application "${stepKey}" a déjà été résolue.`
            );

        }


        if (
            stepResult === null
            || stepResult === undefined
        ) {

            throw new TypeError(
                `Un résultat est requis pour l'étape d'application "${stepKey}".`
            );

        }


        this.application
            .steps[
                stepKey
            ] =
                cloneResult(
                    stepResult
                );


        return this.getApplicationStep(
            stepKey
        );

    }


    #assertApplicationStepKey(
        stepKey
    ) {

        if (
            !APPLICATION_STEP_KEYS.includes(
                stepKey
            )
        ) {

            throw new TypeError(
                `Étape d'application inconnue : ${stepKey}.`
            );

        }


        return true;

    }


    /* ========================================================
     * DÉCISION DE BLOCAGE
     * ======================================================== */


    chooseDefense(
        decision
    ) {

        if (
            this.state
            !== MELEE_ATTACK_WORKFLOW_STATES
                .AWAITING_DEFENSE
        ) {

            throw new Error(
                "La décision de défense n'est plus attendue."
            );

        }


        if (
            decision
            !== MELEE_DEFENSE_DECISIONS.BLOCK

            && decision
            !== MELEE_DEFENSE_DECISIONS.DECLINE
        ) {

            throw new TypeError(
                `Décision de défense inconnue : ${decision}.`
            );

        }


        this.defense.decision =
            decision;


        if (
            decision
            === MELEE_DEFENSE_DECISIONS.BLOCK
        ) {

            this.state =
                MELEE_ATTACK_WORKFLOW_STATES
                    .BLOCK_PREPARATION;


            return this.state;

        }


        this.state =
            MELEE_ATTACK_WORKFLOW_STATES
                .DEFENSE_DECLINED;


        this.state =
            MELEE_ATTACK_WORKFLOW_STATES
                .ATTACK_PREPARATION;


        return this.state;

    }


    /* ========================================================
     * BLOCAGE
     * ======================================================== */
    /**
     * Annule uniquement la préparation du blocage.
     *
     * Aucun jet n'a encore eu lieu et aucune action
     * rapide n'a été consommée.
     *
     * Le défenseur revient donc au choix initial :
     *
     * - Bloquer ;
     * - Ne pas bloquer.
     */
    cancelBlockPreparation(
        
    ) {

        if (
            this.state
            !== MELEE_ATTACK_WORKFLOW_STATES
                .BLOCK_PREPARATION
        ) {

            throw new Error(
                "La préparation du blocage ne peut pas être annulée dans l'état actuel."
            );

        }


        /*
        * La décision BLOCK n'est plus considérée
        * comme prise puisque sa préparation
        * a été abandonnée.
        */
        this.defense.decision =
            null;


        /*
        * Sécurité :
        * aucun résultat ne doit subsister.
        */
        this.defense.result =
            null;


        this.state =
            MELEE_ATTACK_WORKFLOW_STATES
                .AWAITING_DEFENSE;


        return this.state;

    }

    resolveBlock(
        blockResult
    ) {

        if (
            this.state
            !== MELEE_ATTACK_WORKFLOW_STATES
                .BLOCK_PREPARATION
        ) {

            throw new Error(
                "Le blocage ne peut pas être résolu dans l'état actuel."
            );

        }


        if (
            blockResult === null
            || blockResult === undefined
        ) {

            throw new TypeError(
                "Un résultat de blocage est requis."
            );

        }


        this.defense.result =
            cloneResult(
                blockResult
            );


        this.state =
            MELEE_ATTACK_WORKFLOW_STATES
                .BLOCK_RESOLVED;


        /*
        * Un blocage réellement résolu avec au moins
        * une réussite (p.197) doit répartir ses
        * éclats de blocage — à l'aveugle, avant même
        * de connaître le résultat de l'attaquant —
        * avant de poursuivre vers la préparation de
        * l'attaque.
        *
        * Un blocage non éligible (rolled:false) ou
        * sans aucune réussite n'a rien à répartir :
        * on poursuit directement, comme avant.
        */
        const blockSuccesses =
            blockResult?.rolled === true
                ? Number(
                    blockResult.roll
                        ?.successes
                    ?? 0
                )
                : 0;


        this.state =
            blockSuccesses > 0
                ? MELEE_ATTACK_WORKFLOW_STATES
                    .AWAITING_BLOCK_STUNTS

                : MELEE_ATTACK_WORKFLOW_STATES
                    .ATTACK_PREPARATION;


        return this.state;

    }


    resolveBlockStunts(
        blockStuntResult
    ) {

        if (
            this.state
            !== MELEE_ATTACK_WORKFLOW_STATES
                .AWAITING_BLOCK_STUNTS
        ) {

            throw new Error(
                "Les éclats de blocage ne peuvent pas être résolus dans l'état actuel."
            );

        }


        if (
            blockStuntResult === null
            || blockStuntResult === undefined
        ) {

            throw new TypeError(
                "Un résultat d'éclats de blocage est requis."
            );

        }


        this.blockStunts.result =
            cloneResult(
                blockStuntResult
            );


        this.state =
            MELEE_ATTACK_WORKFLOW_STATES
                .ATTACK_PREPARATION;


        return this.state;

    }


    /* ========================================================
     * ATTAQUE
     * ======================================================== */


    resolveAttack(
        attackResult
    ) {

        if (
            this.state
            !== MELEE_ATTACK_WORKFLOW_STATES
                .ATTACK_PREPARATION
        ) {

            throw new Error(
                "L'attaque ne peut pas être résolue dans l'état actuel."
            );

        }


        if (
            attackResult === null
            || attackResult === undefined
        ) {

            throw new TypeError(
                "Un résultat d'attaque est requis."
            );

        }


        this.attack.result =
            cloneResult(
                attackResult
            );

        this.attack.finalized =
            false;            

        this.state =
            MELEE_ATTACK_WORKFLOW_STATES
                .ATTACK_RESOLVED;


        return this.state;

    }

    updateAttackResult(
        attackResult
    ) {

        if (
            this.state
            !== MELEE_ATTACK_WORKFLOW_STATES
                .ATTACK_RESOLVED
        ) {

            throw new Error(
                "Le résultat d'attaque ne peut être modifié que lorsqu'une attaque a été résolue."
            );

        }


        if (!this.hasAttackResult) {

            throw new Error(
                "Aucun résultat d'attaque initial n'est disponible."
            );

        }


        if (
            this.isAttackFinalized
        ) {

            throw new Error(
                "Le résultat d'attaque a déjà été finalisé."
            );

        }


        this.attack.result =
            structuredClone(
                attackResult
            );


        this.attack.finalized =
            false;


        return this;

    }

    finalizeAttack(

    ) {

        if (
            this.state
            !== MELEE_ATTACK_WORKFLOW_STATES
                .ATTACK_RESOLVED
        ) {

            throw new Error(
                "Le résultat d'attaque ne peut pas être finalisé dans l'état actuel."
            );

        }


        if (!this.hasAttackResult) {

            throw new Error(
                "Le workflow ne contient aucun résultat d'attaque à finaliser."
            );

        }


        if (this.isAttackFinalized) {

            return this.state;

        }


        this.attack.finalized =
            true;


        return this.state;

    }

    /* ========================================================
     * ÉCLATS
     * ======================================================== */


    resolveStunts(
        stuntResult
    ) {

        if (
            this.state
            !== MELEE_ATTACK_WORKFLOW_STATES
                .ATTACK_RESOLVED
        ) {

            throw new Error(
                "Les éclats ne peuvent pas être résolus dans l'état actuel."
            );

        }

        if (!this.isAttackFinalized) {

            throw new Error(
                "Le résultat d'attaque doit être finalisé avant la résolution des éclats."
            );

        }

        if (
            stuntResult === null
            || stuntResult === undefined
        ) {

            throw new TypeError(
                "Un résultat d'éclats est requis."
            );

        }


        this.stunts.result =
            cloneResult(
                stuntResult
            );


        this.state =
            MELEE_ATTACK_WORKFLOW_STATES
                .STUNTS_RESOLVED;


        return this.state;

    }


    /* ========================================================
     * CONSÉQUENCES
     * ======================================================== */


    resolveConsequences(
        consequenceResult
    ) {

        const allowedStates = [

            MELEE_ATTACK_WORKFLOW_STATES
                .ATTACK_RESOLVED,

            MELEE_ATTACK_WORKFLOW_STATES
                .STUNTS_RESOLVED

        ];


        if (
            !allowedStates.includes(
                this.state
            )
        ) {

            throw new Error(
                "Les conséquences ne peuvent pas être résolues dans l'état actuel."
            );

        }

        if (
            this.state
            === MELEE_ATTACK_WORKFLOW_STATES
                .ATTACK_RESOLVED

            && !this.isAttackFinalized
        ) {

            throw new Error(
                "Le résultat d'attaque doit être finalisé avant la résolution des conséquences."
            );

        }


        if (
            consequenceResult === null
            || consequenceResult === undefined
        ) {

            throw new TypeError(
                "Un résultat de conséquences est requis."
            );

        }


        this.consequences.result =
            cloneResult(
                consequenceResult
            );


        /*
         * Une nouvelle résolution de conséquences
         * invalide toujours les résultats situés
         * en aval.
         */
        this.protection.result =
            null;


        this.application = {

            steps:
                createEmptyApplicationSteps(),

            result:
                null

        };


        this.state =
            MELEE_ATTACK_WORKFLOW_STATES
                .CONSEQUENCES_RESOLVED;


        return this.state;

    }


    /* ========================================================
     * PROTECTION
     * ======================================================== */


    resolveProtection(
        protectionResult
    ) {

        if (
            this.state
            !== MELEE_ATTACK_WORKFLOW_STATES
                .CONSEQUENCES_RESOLVED
        ) {

            throw new Error(
                "La Protection ne peut pas être résolue dans l'état actuel."
            );

        }


        if (
            !this.protectionRequired
        ) {

            throw new Error(
                "Cette attaque ne nécessite aucun jet de Protection."
            );

        }


        if (
            protectionResult === null
            || protectionResult === undefined
        ) {

            throw new TypeError(
                "Un résultat de Protection est requis."
            );

        }


        this.protection.result =
            cloneResult(
                protectionResult
            );


        /*
         * Toute nouvelle Protection invalide
         * l'ancien journal d'application.
         */
        this.application = {

            steps:
                createEmptyApplicationSteps(),

            result:
                null

        };


        this.state =
            MELEE_ATTACK_WORKFLOW_STATES
                .PROTECTION_RESOLVED;


        return this.state;

    }


    /* ========================================================
     * APPLICATION FINALE
     * ======================================================== */


    /**
     * Enregistre le compte rendu final de
     * l'application.
     *
     * Toutes les étapes doivent déjà avoir été
     * explicitement traitées.
     */
    resolveApplication(
        applicationResult
    ) {

        if (
            !this.canApplyConsequences
        ) {

            if (
                this.hasApplicationResult
            ) {

                throw new Error(
                    "Les conséquences de cette attaque ont déjà été appliquées."
                );

            }


            throw new Error(
                "Les conséquences ne peuvent pas être appliquées dans l'état actuel."
            );

        }


        if (
            !this.areApplicationStepsResolved
        ) {

            throw new Error(
                "Toutes les étapes d'application doivent être résolues avant l'enregistrement du résultat final."
            );

        }


        if (
            applicationResult === null
            || applicationResult === undefined
        ) {

            throw new TypeError(
                "Un résultat d'application est requis."
            );

        }


        this.application.result =
            cloneResult(
                applicationResult
            );


        return this.application.result;

    }


    /* ========================================================
     * TERMINAISON
     * ======================================================== */


    complete(

    ) {

        const canCompleteWithoutProtection =
            this.state
                === MELEE_ATTACK_WORKFLOW_STATES
                    .CONSEQUENCES_RESOLVED

            && !this.protectionRequired;


        const canCompleteAfterProtection =
            this.state
                === MELEE_ATTACK_WORKFLOW_STATES
                    .PROTECTION_RESOLVED

            && this.hasProtectionResult;


        if (
            !canCompleteWithoutProtection
            && !canCompleteAfterProtection
        ) {

            throw new Error(
                "Le workflow ne peut pas être terminé dans l'état actuel."
            );

        }


        if (
            !this.hasApplicationResult
        ) {

            throw new Error(
                "Le workflow ne peut pas être terminé avant l'application réelle des conséquences."
            );

        }


        this.state =
            MELEE_ATTACK_WORKFLOW_STATES
                .COMPLETED;


        return this.state;

    }


    /* ========================================================
     * RECONSTRUCTION
     * ======================================================== */


    static fromObject(
        data
    ) {

        if (
            !data
            || typeof data !== "object"
        ) {

            throw new TypeError(
                "Les données du workflow sont requises."
            );

        }


        const workflow =
            new MeleeAttackWorkflow({

                id:
                    data.id,

                attackerId:
                    data.attacker?.actorId,

                defenderId:
                    data.defender?.actorId,

                weaponId:
                    data.weaponId,

                attackerTokenId:
                    data.attacker?.tokenId
                    ?? null,

                defenderTokenId:
                    data.defender?.tokenId
                    ?? null,

                canBlock:
                    data.defense?.offered
                    === true,

                metadata:
                    data.metadata
                    ?? {}

            });


        if (
            !Object.values(
                MELEE_ATTACK_WORKFLOW_STATES
            ).includes(
                data.state
            )
        ) {

            throw new TypeError(
                `État de workflow inconnu : ${data.state}.`
            );

        }


        workflow.state =
            data.state;


        workflow.defense = {

            offered:
                data.defense?.offered
                === true,

            decision:
                data.defense?.decision
                ?? null,

            result:
                cloneResult(
                    data.defense?.result
                    ?? null
                )

        };


        const restoredAttackResult =
            cloneResult(
                data.attack?.result
                ?? null
            );


        workflow.attack = {

            result:
                restoredAttackResult,

            finalized:
                data.attack?.finalized
                === true

                || (
                    data.attack?.finalized
                        === undefined

                    && restoredAttackResult
                        !== null
                )

        };


        workflow.blockStunts = {

            result:
                cloneResult(
                    data.blockStunts?.result
                    ?? null
                )

        };


        workflow.stunts = {

            result:
                cloneResult(
                    data.stunts?.result
                    ?? null
                )

        };


        workflow.consequences = {

            result:
                cloneResult(
                    data.consequences?.result
                    ?? null
                )

        };


        workflow.protection = {

            result:
                cloneResult(
                    data.protection?.result
                    ?? null
                )

        };


        /*
         * Compatibilité avec les workflows créés
         * avant l'introduction du journal d'étapes.
         *
         * Un ancien application.result déjà présent
         * est conservé.
         */
        workflow.application = {

            steps:
                normalizeApplicationSteps(
                    data.application
                        ?.steps
                ),

            result:
                cloneResult(
                    data.application
                        ?.result
                    ?? null
                )

        };


        return workflow;

    }


    /* ========================================================
     * SÉRIALISATION
     * ======================================================== */


    toObject(

    ) {

        return {

            id:
                this.id,

            type:
                this.type,

            state:
                this.state,

            attacker: {
                ...this.attacker
            },

            defender: {
                ...this.defender
            },

            weaponId:
                this.weaponId,

            defense: {
                ...this.defense
            },

            attack: {
                ...this.attack
            },

            blockStunts: {
                ...this.blockStunts
            },

            stunts: {
                ...this.stunts
            },

            consequences: {
                ...this.consequences
            },

            protection: {
                ...this.protection
            },

            application: {

                steps:
                    cloneResult(
                        this.application.steps
                    ),

                result:
                    cloneResult(
                        this.application.result
                    )

            },

            metadata: {
                ...this.metadata
            }

        };

    }


}