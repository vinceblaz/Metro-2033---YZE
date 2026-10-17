import {
    resolveProtectionDamage
} from "../domain/rules/protection-damage.mjs";

function validateRangedAttackProtectionDamageOperation({
    operation,
    item
} = {}) {

    if (
        operation?.type !==
            "protection-damage"
    ) {
        throw new TypeError(
            "Une opération de dégradation de Protection est requise."
        );
    }


    if (
        operation.status !==
            "pending"
    ) {
        throw new Error(
            "Une opération de dégradation de Protection doit être en attente avant son application."
        );
    }


    if (
        item?.id !==
            operation.itemId
    ) {
        throw new Error(
            "L'Item de Protection ne correspond pas à l'opération à appliquer."
        );
    }


    if (
        item.type !==
            "armor"
    ) {
        throw new TypeError(
            "L'Item de Protection doit être une armure."
        );
    }


    /*
     * Appel volontaire à la règle pure :
     *
     * elle valide également la Protection actuelle
     * et la quantité de dégâts sans effectuer
     * aucune mutation.
     */
    resolveProtectionDamage({
        current:
            item.system?.protection?.current,

        damage:
            operation.amount
    });

}

/**
 * Applique une opération de dégradation
 * de Protection à un Item Foundry.
 *
 * Frontière P6 :
 *
 * - reçoit une intention métier déjà résolue ;
 * - délègue le calcul à la règle pure ;
 * - effectue la mutation de l'Item.
 */
export async function applyRangedAttackProtectionDamage({
    operation,
    item
} = {}) {

    validateRangedAttackProtectionDamageOperation({
        operation,
        item
    });


    const resolution =
        resolveProtectionDamage({
            current:
                item.system.protection.current,

            damage:
                operation.amount
        });


    const updateData = {
        "system.protection.current":
            resolution.current
    };


    if (
        resolution.becameBroken === true
        &&
        item.system?.resilience
    ) {
        updateData["system.resilienceLost"] =
            true;
    }


    await item.update(
        updateData
    );

}

function validateRangedAttackAttributeDamageOperation(
    operation
) {

    if (
        operation.type !== "attribute-damage"
    ) {
        throw new TypeError(
            "Une opération de dégâts d'Attribut est requise."
        );
    }

    if (
        operation.status !== "pending"
    ) {
        throw new Error(
            "Une opération de dégâts d'Attribut doit être en attente avant son application."
        );
    }

    if (
        operation.attribute !== "vigor"
        && operation.attribute !== "spirit"
    ) {
        throw new TypeError(
            "L'Attribut doit être vigor ou spirit."
        );
    }

    if (
        !Number.isInteger(
            operation.amount
        )
        ||
        operation.amount < 0
    ) {
        throw new TypeError(
            "Les dégâts d'Attribut doivent être un entier positif ou nul."
        );
    }

}

function validateRangedAttackAttributeDamageTarget(
    actor
) {

    if (
        typeof actor?.takeAttributeDamage !== "function"
    ) {
        throw new TypeError(
            "Une cible capable d'appliquer des dégâts d'Attribut est requise."
        );
    }

}

export async function applyRangedAttackAttributeDamage({
    operation,
    actor
} = {}) {

    validateRangedAttackAttributeDamageOperation(
        operation
    );

    validateRangedAttackAttributeDamageTarget(
        actor
    );

    await actor.takeAttributeDamage(
        operation.attribute,
        operation.amount
    );
}

export async function applyRangedAttackKnockdown({
    operation,
    actor
} = {}) {

    if (
        operation.type !== "knockdown"
    ) {
        throw new TypeError(
            "Une opération de renversement est requise."
        );
    }


    if (
        operation.status !== "pending"
    ) {
        throw new Error(
            "Une opération de renversement doit être en attente avant son application."
        );
    }


    if (
        typeof actor?.applyKnockdown !== "function"
    ) {
        throw new TypeError(
            "Une cible capable d'appliquer un renversement est requise."
        );
    }


    return await actor.applyKnockdown();

}

function validateRangedAttackDisarmOperation({
    operation,
    actor
} = {}) {

    if (
        operation?.type !==
            "disarm"
    ) {
        throw new TypeError(
            "Une opération de désarmement est requise."
        );
    }


    if (
        operation.status !==
            "pending"
    ) {
        throw new Error(
            "Une opération de désarmement doit être en attente avant son application."
        );
    }


    const item =
        actor?.items?.get(
            operation.itemId
        );


    if (!item) {
        throw new Error(
            "L'Item à désarmer est introuvable sur la cible."
        );
    }


    if (
        typeof actor?.applyDisarm !==
            "function"
    ) {
        throw new TypeError(
            "Une cible capable d'appliquer un désarmement est requise."
        );
    }


    return item;

}

/**
 * Applique une opération de désarmement.
 *
 * Frontière P6 :
 *
 * - reçoit une intention métier déjà résolue ;
 * - retrouve l'Item explicitement choisi ;
 * - ne choisit jamais elle-même l'objet à désarmer ;
 * - délègue l'application concrète à la cible.
 */
export async function applyRangedAttackDisarm({
    operation,
    actor
} = {}) {

    const item =
        validateRangedAttackDisarmOperation({
            operation,
            actor
        });


    return await actor.applyDisarm(
        item
    );

}

/**
 * Applique une opération d'échange d'initiative.
 *
 * Frontière P6 :
 *
 * - reçoit une intention métier déjà résolue ;
 * - ne décide pas comment Foundry représente
 *   concrètement l'échange d'initiative ;
 * - délègue cette application au contexte de Combat.
 */
export async function applyRangedAttackInitiativeSwap({
    operation,
    combat,
    attacker,
    target,
    scheduleInitiativeSwap
} = {}) {

    if (
        operation?.type !==
            "initiative-swap"
    ) {
        throw new TypeError(
            "Une opération d'échange d'initiative est requise."
        );
    }


    if (
        operation.status !==
            "pending"
    ) {
        throw new Error(
            "Une opération d'échange d'initiative doit être en attente avant son application."
        );
    }


    if (
        operation.timing !==
            "next-round"
    ) {
        throw new TypeError(
            "Le timing d'échange d'initiative doit être next-round."
        );
    }


    if (!combat) {
        throw new TypeError(
            "Un Combat Foundry est requis pour programmer un échange d'initiative."
        );
    }


    if (!attacker) {
        throw new TypeError(
            "Un attaquant est requis pour programmer un échange d'initiative."
        );
    }


    if (!target) {
        throw new TypeError(
            "Une cible est requise pour programmer un échange d'initiative."
        );
    }


    if (
        typeof scheduleInitiativeSwap !==
            "function"
    ) {
        throw new TypeError(
            "Une capacité de programmation d'échange d'initiative est requise."
        );
    }


    await scheduleInitiativeSwap(
        combat,
        attacker,
        target
    );

}

/**
 * Applique une opération d'explosion.
 *
 * Frontière P6 :
 *
 * - reçoit une intention métier déjà résolue ;
 * - reçoit séparément la Puissance provenant
 *   du contexte objectif de l'attaque ;
 * - ne résout pas elle-même l'explosion ;
 * - délègue la résolution complète à la cible.
 */
/**
 * Applique une opération d'explosion.
 *
 * Frontière P6 :
 *
 * - reçoit une intention métier déjà résolue ;
 * - reçoit séparément la Puissance provenant
 *   du contexte objectif de l'attaque ;
 * - ne résout pas elle-même l'explosion ;
 * - délègue la résolution complète à la cible.
 */
export async function applyRangedAttackExplosion({
    operation,
    actor,
    power,
    cover = null
} = {}) {

    if (
        operation?.type !==
            "explosion"
    ) {
        throw new TypeError(
            "Une opération d'explosion est requise."
        );
    }


    if (
        operation.status !==
            "pending"
    ) {
        throw new Error(
            "Une opération d'explosion doit être en attente avant son application."
        );
    }


    if (
        operation.range !==
            "contact"
    ) {
        throw new TypeError(
            "La portée de l'explosion doit être contact."
        );
    }


    if (
        !Number.isInteger(power)
        ||
        power <= 0
    ) {
        throw new TypeError(
            "La Puissance de l'explosion doit être un entier strictement positif."
        );
    }


    if (
        typeof actor?.resolveExplosion !==
            "function"
    ) {
        throw new TypeError(
            "Une cible capable de résoudre une explosion est requise."
        );
    }


    return await actor.resolveExplosion({
        power,

        range:
            operation.range,

        cover
    });

}

export async function applyRangedAttackApplicationLedger({
    ledger,
    actor,
    combat,
    attacker,
    validateInitiativeSwap,
    scheduleInitiativeSwap,
    explosion = null
} = {}) {

    const blockedOperation =
        ledger.operations.find(
            (operation) =>
                operation.status ===
                    "blocked"
        );

    if (blockedOperation) {
        throw new Error(
            "Le ledger contient une opération bloquée et ne peut pas être appliqué."
        );
    }


    /*
     * Prévalidation des opérations
     * de dégradation de Protection.
     *
     * Toutes les Protections sont validées
     * avant la première mutation P6.
     */
    for (
        const operation
        of ledger.operations
    ) {
        if (
            operation.type !==
                "protection-damage"
        ) {
            continue;
        }


        const item =
            actor?.items?.get(
                operation.itemId
            );


        if (!item) {
            throw new Error(
                "L'Item de Protection désigné par l'opération est introuvable sur la cible."
            );
        }


        validateRangedAttackProtectionDamageOperation({
            operation,
            item
        });
    }


    /*
     * Prévalidation des opérations
     * de dégâts d'Attribut.
     */
    for (
        const operation
        of ledger.operations
    ) {
        if (
            operation.type !==
                "attribute-damage"
        ) {
            continue;
        }


        validateRangedAttackAttributeDamageOperation(
            operation
        );
    }


    /*
     * Prévalidation des opérations
     * de désarmement.
     *
     * Tous les désarmements sont validés
     * avant la première mutation P6.
     */
    for (
        const operation
        of ledger.operations
    ) {
        if (
            operation.type !==
                "disarm"
        ) {
            continue;
        }


        validateRangedAttackDisarmOperation({
            operation,
            actor
        });
    }


    /*
     * Prévalidation des opérations
     * de renversement.
     */
    for (
        const operation
        of ledger.operations
    ) {
        if (
            operation.type !==
                "knockdown"
        ) {
            continue;
        }


        if (
            operation.status !==
                "pending"
        ) {
            throw new Error(
                "Une opération de renversement doit être en attente avant son application."
            );
        }
    }


    /*
     * Prévalidation des opérations
     * d'échange d'initiative.
     */
    for (
        const operation
        of ledger.operations
    ) {
        if (
            operation.type !==
                "initiative-swap"
        ) {
            continue;
        }


        if (
            operation.status !==
                "pending"
        ) {
            throw new Error(
                "Une opération d'échange d'initiative doit être en attente avant son application."
            );
        }


        if (
            operation.timing !==
                "next-round"
        ) {
            throw new TypeError(
                "Le timing d'échange d'initiative doit être next-round."
            );
        }
    }


    /*
     * Prévalidation des opérations
     * d'explosion.
     *
     * L'opération porte l'intention métier
     * "explosion au contact".
     *
     * La Puissance reste fournie séparément
     * par le contexte objectif de l'attaque.
     */
    for (
        const operation
        of ledger.operations
    ) {
        if (
            operation.type !==
                "explosion"
        ) {
            continue;
        }


        if (
            operation.status !==
                "pending"
        ) {
            throw new Error(
                "Une opération d'explosion doit être en attente avant son application."
            );
        }


        if (
            operation.range !==
                "contact"
        ) {
            throw new TypeError(
                "La portée de l'explosion doit être contact."
            );
        }


        if (
            !Number.isInteger(
                explosion?.power
            )
            ||
            explosion.power <= 0
        ) {
            throw new TypeError(
                "La Puissance de l'explosion doit être un entier strictement positif."
            );
        }
    }


    /*
     * Prévalidation de la cible
     * des dégâts d'Attribut.
     */
    const hasAttributeDamage =
        ledger.operations.some(
            (operation) =>
                operation.type ===
                    "attribute-damage"
        );


    if (hasAttributeDamage) {
        validateRangedAttackAttributeDamageTarget(
            actor
        );
    }


    /*
     * Prévalidation de la cible
     * du renversement.
     */
    const hasKnockdown =
        ledger.operations.some(
            (operation) =>
                operation.type ===
                    "knockdown"
        );


    if (
        hasKnockdown
        &&
        typeof actor?.applyKnockdown !==
            "function"
    ) {
        throw new TypeError(
            "Une cible capable d'appliquer un renversement est requise."
        );
    }


    /*
     * Prévalidation du contexte d'exécution
     * de l'échange d'initiative.
     *
     * Le Combat Foundry reste une donnée.
     * La programmation de l'échange est une
     * capacité injectée séparément.
     */
    const hasInitiativeSwap =
        ledger.operations.some(
            (operation) =>
                operation.type ===
                    "initiative-swap"
        );


    if (
        hasInitiativeSwap
        &&
        !combat
    ) {
        throw new TypeError(
            "Un Combat Foundry est requis pour programmer un échange d'initiative."
        );
    }


    if (
        hasInitiativeSwap
        &&
        !attacker
    ) {
        throw new TypeError(
            "Un attaquant est requis pour programmer un échange d'initiative."
        );
    }


    if (
        hasInitiativeSwap
        &&
        !actor
    ) {
        throw new TypeError(
            "Une cible est requise pour programmer un échange d'initiative."
        );
    }


    if (
        hasInitiativeSwap
        &&
        typeof scheduleInitiativeSwap !==
            "function"
    ) {
        throw new TypeError(
            "Une capacité de programmation d'échange d'initiative est requise."
        );
    }


    if (
        hasInitiativeSwap
        &&
        typeof validateInitiativeSwap !==
            "function"
    ) {
        throw new TypeError(
            "Une capacité de validation d'échange d'initiative est requise."
        );
    }


    if (hasInitiativeSwap) {
        validateInitiativeSwap(
            combat,
            attacker,
            actor
        );
    }


    /*
     * Prévalidation de la cible
     * de l'explosion.
     */
    const hasExplosion =
        ledger.operations.some(
            (operation) =>
                operation.type ===
                    "explosion"
        );


    if (
        hasExplosion
        &&
        typeof actor?.resolveExplosion !==
            "function"
    ) {
        throw new TypeError(
            "Une cible capable de résoudre une explosion est requise."
        );
    }


    /*
     * À partir d'ici, toutes les prévalidations
     * sont terminées.
     *
     * Les mutations P6 peuvent commencer.
     */


    /*
     * La dégradation de Protection est appliquée
     * avant les dégâts d'Attribut.
     *
     * L'ordre de stockage des opérations dans
     * le ledger ne définit pas l'ordre P6.
     */
    for (
        const operation
        of ledger.operations
    ) {
        if (
            operation.type !==
                "protection-damage"
        ) {
            continue;
        }


        const item =
            actor.items.get(
                operation.itemId
            );


        await applyRangedAttackProtectionDamage({
            operation,
            item
        });
    }


    /*
     * Les dégâts d'Attribut sont appliqués
     * après la Protection.
     */
    for (
        const operation
        of ledger.operations
    ) {
        if (
            operation.type !==
                "attribute-damage"
        ) {
            continue;
        }


        await applyRangedAttackAttributeDamage({
            operation,
            actor
        });
    }


    /*
     * Les désarmements déjà résolus
     * sont appliqués après les dégâts d'Attribut
     * et avant les renversements.
     */
    for (
        const operation
        of ledger.operations
    ) {
        if (
            operation.type !==
                "disarm"
        ) {
            continue;
        }


        await applyRangedAttackDisarm({
            operation,
            actor
        });
    }


    /*
     * Les renversements déjà résolus
     * sont appliqués après les désarmements.
     */
    for (
        const operation
        of ledger.operations
    ) {
        if (
            operation.type !==
                "knockdown"
        ) {
            continue;
        }


        await applyRangedAttackKnockdown({
            operation,
            actor
        });
    }


    /*
     * Les échanges d'initiative sont programmés
     * après les conséquences appliquées à la cible.
     *
     * Leur timing métier reste "next-round".
     */
    for (
        const operation
        of ledger.operations
    ) {
        if (
            operation.type !==
                "initiative-swap"
        ) {
            continue;
        }


        await applyRangedAttackInitiativeSwap({
            operation,
            combat,
            attacker,
            target:
                actor,
            scheduleInitiativeSwap
        });
    }


    /*
     * L'explosion est une résolution secondaire.
     *
     * Elle est déclenchée après les conséquences
     * directes de l'attaque initiale.
     *
     * Sa propre résolution prend ensuite en charge
     * son jet, l'Abri, la Protection, les dégâts
     * et son éventuel renversement.
     */
    for (
        const operation
        of ledger.operations
    ) {
        if (
            operation.type !==
                "explosion"
        ) {
            continue;
        }


        await applyRangedAttackExplosion({
            operation,
            actor,

            power:
                explosion.power,

            cover:
                explosion.cover
                ?? null
        });
    }

}