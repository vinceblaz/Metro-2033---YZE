/**
 * Construit le ledger d'application d'une attaque
 * à distance à partir de son ApplicationPlan.
 *
 * Fonction pure :
 *
 * - aucun Actor Foundry ;
 * - aucun Item Foundry ;
 * - aucune mutation ;
 * - aucune application effective des conséquences.
 *
 * Le ledger décrit les opérations qui restent
 * à appliquer par la frontière P6.
 */
/**
 * Construit le ledger d'application d'une attaque
 * à distance à partir de son ApplicationPlan.
 *
 * Fonction pure :
 *
 * - aucun Actor Foundry ;
 * - aucun Item Foundry ;
 * - aucune mutation ;
 * - aucune application effective des conséquences.
 *
 * Le ledger décrit les opérations qui restent
 * à appliquer par la frontière P6.
 */
export function createRangedAttackApplicationLedger({
    applicationPlan,
    protectionResult,
    disarmChoices
} = {}) {

    if (!applicationPlan) {

        throw new TypeError(
            "Un plan d'application d'attaque à distance est requis."
        );

    }


    const operations = [];

    if (
        applicationPlan.damage.vigor > 0
    ) {
        operations.push({
            type:
                "attribute-damage",

            attribute:
                "vigor",

            amount:
                applicationPlan.damage.vigor,

            status:
                "pending"
        });
    }

    if (
        applicationPlan.damage.spirit > 0
    ) {
        operations.push({
            type:
                "attribute-damage",

            attribute:
                "spirit",

            amount:
                applicationPlan.damage.spirit,

            status:
                "pending"
        });
    }

    if (
        applicationPlan.protection?.damage > 0
        &&
        protectionResult?.source?.type === "worn"
        &&
        protectionResult.source.bodyArmor
        &&
        !protectionResult.source.helmet
    ) {
        operations.push({
            type:
                "protection-damage",

            amount:
                applicationPlan.protection.damage,

            target:
                "body",

            itemId:
                protectionResult.source.bodyArmor.itemId,

            status:
                "pending"
        });
    }

    if (
        applicationPlan.protection?.damage > 0
        &&
        protectionResult?.source?.type === "worn"
        &&
        !protectionResult.source.bodyArmor
        &&
        protectionResult.source.helmet
    ) {
        operations.push({
            type:
                "protection-damage",

            amount:
                applicationPlan.protection.damage,

            target:
                "helmet",

            itemId:
                protectionResult.source.helmet.itemId,

            status:
                "pending"
        });
    }

    if (
        applicationPlan.protection?.damage > 0
        &&
        protectionResult?.source?.type === "worn"
        &&
        protectionResult.source.bodyArmor
        &&
        protectionResult.source.helmet
    ) {
        operations.push({
            type:
                "protection-damage",

            amount:
                applicationPlan.protection.damage,

            target:
                null,

            choices: [
                "body",
                "helmet"
            ],

            status:
                "blocked"
        });
    }

    if (
        applicationPlan.effects?.disarm === true
    ) {

        const disarmOperation = {
            type:
                "disarm",

            status:
                "blocked"
        };


        if (
            Array.isArray(
                disarmChoices
            )
        ) {
            disarmOperation.choices =
                disarmChoices;
        }


        operations.push(
            disarmOperation
        );

    }

    if (
        applicationPlan
            .effects
            ?.knockdown
        === true
    ) {

        operations.push({
            type:
                "knockdown",

            status:
                "pending"
        });

    }

    if (
        applicationPlan.effects?.swapInitiative === true
    ) {
        operations.push({
            type:
                "initiative-swap",

            timing:
                "next-round",

            status:
                "pending"
        });
    }

    if (
        applicationPlan.effects?.grenade === true
    ) {
        operations.push({
            type:
                "explosion",

            range:
                "contact",

            status:
                "pending"
        });
    }

    return {
        operations
    };

}

/**
 * Retourne les opérations encore bloquées
 * dans un ledger d'application d'attaque
 * à distance.
 *
 * Fonction pure :
 *
 * - aucune mutation du ledger ;
 * - conserve l'ordre des opérations ;
 * - aucune résolution de choix ;
 * - aucune application P6.
 */
export function getRangedAttackBlockedOperations({
    ledger
} = {}) {

    return ledger.operations.filter(
        (operation) =>
            operation.status ===
                "blocked"
    );

}

/**
 * Résout un choix de cible pour une dégradation
 * de Protection bloquée dans le ledger.
 *
 * Fonction pure :
 *
 * - aucune mutation du ledger reçu ;
 * - aucun Actor Foundry ;
 * - aucun Item Foundry ;
 * - aucune application effective de la dégradation.
 */
export function resolveRangedAttackProtectionChoice({
    ledger,
    protectionResult,
    target
} = {}) {

    if (
        target !== "body"
        &&
        target !== "helmet"
    ) {
        throw new TypeError(
            "La cible de Protection doit être body ou helmet."
        );
    }


    const blockedProtectionOperation =
        ledger.operations.find(
            (operation) =>
                operation.type ===
                    "protection-damage"
                &&
                operation.status ===
                    "blocked"
        );

    if (
        !blockedProtectionOperation
            ?.choices
            ?.includes(target)
    ) {
        throw new Error(
            "La cible de Protection choisie n'est pas disponible dans le ledger."
        );
    }

    if (
        target === "body"
        &&
        !protectionResult.source.bodyArmor
    ) {
        throw new Error(
            "La protection corporelle choisie n'est pas disponible dans la source de Protection."
        );
    }

    if (
        target === "helmet"
        &&
        !protectionResult.source.helmet
    ) {
        throw new Error(
            "Le casque choisi n'est pas disponible dans la source de Protection."
        );
    }

    const itemId =
        target === "helmet"
            ? protectionResult.source.helmet.itemId
            : protectionResult.source.bodyArmor.itemId;

    const operations =
        ledger.operations.map(
            (operation) => {

                if (
                    operation.type !==
                        "protection-damage"
                    ||
                    operation.status !==
                        "blocked"
                ) {
                    return operation;
                }


                return {
                    type:
                        "protection-damage",

                    amount:
                        operation.amount,

                    target,

                    itemId,

                    status:
                        "pending"
                };

            }
        );


    return {
        operations
    };

}

export function resolveRangedAttackDisarmChoice({
    ledger,
    itemId
} = {}) {

    const operation =
        ledger.operations.find(
            operation =>
                operation.type ===
                "disarm"
        );


    if (
        operation?.status !==
            "blocked"
    ) {
        throw new Error(
            "L'opération de désarmement doit être bloquée avant la résolution du choix."
        );
    }


    if (
        typeof itemId !==
            "string"
        ||
        itemId.length === 0
    ) {
        throw new TypeError(
            "Un identifiant d'Item à désarmer est requis."
        );
    }


    if (
        Array.isArray(operation.choices)
        &&
        !operation.choices.some(
            choice =>
                choice?.itemId ===
                    itemId
        )
    ) {
        throw new Error(
            "L'Item choisi n'est pas disponible pour le désarmement."
        );
    }


    return {
        operations:
            ledger.operations.map(
                currentOperation => {

                    if (
                        currentOperation !==
                            operation
                    ) {
                        return currentOperation;
                    }


                    return {
                        type:
                            "disarm",

                        itemId,

                        status:
                            "pending"
                    };

                }
            )
    };

}