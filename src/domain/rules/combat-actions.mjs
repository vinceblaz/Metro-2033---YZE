/**
 * Économie d'actions de combat.
 *
 * Règle de base :
 *
 * - 1 action lente + 1 action rapide
 *   OU
 * - 2 actions rapides
 *
 * Une action lente consomme :
 * - l'action lente disponible ;
 * - et empêche ensuite d'utiliser deux rapides.
 *
 * Deux rapides sont possibles si aucune lente
 * n'a été consommée.
 */


/**
 * Coût des actions.
 */
export const ACTION_COSTS =
    Object.freeze({

        FAST:
            "fast",

        SLOW:
            "slow"

    });


/**
 * Définition des actions actuellement connues.
 *
 * Le but n'est pas encore de tout implémenter,
 * mais de disposer d'une source centrale.
 */
export const COMBAT_ACTIONS =
    Object.freeze({

        MELEE_ATTACK: {
            id:
                "melee-attack",

            cost:
                ACTION_COSTS.SLOW
        },

        RANGED_ATTACK: {
            id:
                "ranged-attack",

            cost:
                ACTION_COSTS.SLOW
        },

        GRAPPLE_ESCAPE: {
            id:
                "grapple-escape",

            cost:
                ACTION_COSTS.SLOW
        },

        RELOAD_WEAPON: {
            id:
                "reload-weapon",

            cost:
                ACTION_COSTS.SLOW
        },

        MELEE_BLOCK: {
            id:
                "melee-block",

            cost:
                ACTION_COSTS.FAST,

            reaction:
                true
        },

        GRAPPLE_ATTACK: {
            id:
                "grapple-attack",

            cost:
                ACTION_COSTS.FAST
        },

        MOVE: {
            id:
                "move",

            cost:
                ACTION_COSTS.FAST
        },

        CRAWL: {
            id: "crawl",
            cost: ACTION_COSTS.SLOW
        },

        RETREAT: {
            id: "retreat",
            cost: ACTION_COSTS.FAST
        }        

    });


/**
 * Index rapide par identifiant.
 */
const ACTION_BY_ID =
    Object.freeze(
        Object.fromEntries(
            Object.values(
                COMBAT_ACTIONS
            ).map(
                action => [
                    action.id,
                    action
                ]
            )
        )
    );


/**
 * Retourne la définition d'une action.
 */
export function getCombatAction(
    actionId
) {

    return (
        ACTION_BY_ID[actionId]
        ?? null
    );

}


/**
 * Vérifie qu'un coût d'action est valide.
 */
export function isValidActionCost(
    cost
) {

    return (
        cost === ACTION_COSTS.FAST
        || cost === ACTION_COSTS.SLOW
    );

}


/**
 * Crée l'état d'actions initial
 * d'un combattant pour un round.
 */
export function createCombatActionState() {

    return {

        slowUsed:
            false,

        fastUsed:
            0

    };

}


/**
 * Normalise et valide un état d'actions.
 */
export function normalizeCombatActionState(
    state = {}
) {

    const slowUsed =
        state.slowUsed === true;


    const fastUsed =
        Number.isInteger(
            state.fastUsed
        )
            ? state.fastUsed
            : 0;


    if (
        fastUsed < 0
        || fastUsed > 2
    ) {

        throw new RangeError(
            "fastUsed doit être compris entre 0 et 2."
        );

    }


    /*
     * Une action lente et deux rapides
     * ne peuvent jamais coexister.
     */
    if (
        slowUsed
        && fastUsed > 1
    ) {

        throw new Error(
            "État d'actions invalide : une action lente ne peut pas coexister avec deux actions rapides."
        );

    }


    return {

        slowUsed,
        fastUsed

    };

}


/**
 * Nombre d'actions rapides encore disponibles.
 */
export function getRemainingFastActions(
    state
) {

    const normalized =
        normalizeCombatActionState(
            state
        );


    /*
     * Si une lente a été utilisée,
     * une seule rapide est disponible
     * pour le round.
     */
    const maximum =
        normalized.slowUsed
            ? 1
            : 2;


    return Math.max(
        0,
        maximum - normalized.fastUsed
    );

}


/**
 * Indique si une action lente
 * reste disponible.
 */
export function hasSlowActionAvailable(
    state
) {

    const normalized =
        normalizeCombatActionState(
            state
        );


    /*
     * Si deux rapides ont déjà été utilisées,
     * la lente n'est plus possible.
     */
    return (
        normalized.slowUsed === false
        && normalized.fastUsed < 2
    );

}


/**
 * Détermine si un coût peut être payé.
 */
export function canSpendAction(
    state,
    cost
) {

    if (
        !isValidActionCost(
            cost
        )
    ) {

        throw new TypeError(
            `Coût d'action inconnu : ${cost}.`
        );

    }


    const normalized =
        normalizeCombatActionState(
            state
        );


    if (
        cost === ACTION_COSTS.FAST
    ) {

        return (
            getRemainingFastActions(
                normalized
            ) > 0
        );

    }


    return hasSlowActionAvailable(
        normalized
    );

}


/**
 * Dépense une action.
 *
 * La fonction ne modifie jamais l'objet reçu.
 */
export function spendAction(
    state,
    cost
) {

    const normalized =
        normalizeCombatActionState(
            state
        );


    if (
        !canSpendAction(
            normalized,
            cost
        )
    ) {

        throw new Error(
            `Action ${cost} indisponible.`
        );

    }


    if (
        cost === ACTION_COSTS.FAST
    ) {

        return {

            ...normalized,

            fastUsed:
                normalized.fastUsed + 1

        };

    }


    return {

        ...normalized,

        slowUsed:
            true

    };

}


/**
 * Détermine si une action identifiée
 * peut actuellement être effectuée.
 */
export function canPerformCombatAction(
    state,
    actionId
) {

    const action =
        getCombatAction(
            actionId
        );


    if (!action) {

        throw new Error(
            `Action de combat inconnue : ${actionId}.`
        );

    }


    return canSpendAction(
        state,
        action.cost
    );

}


/**
 * Dépense le coût correspondant
 * à une action identifiée.
 */
export function spendCombatAction(
    state,
    actionId
) {

    const action =
        getCombatAction(
            actionId
        );


    if (!action) {

        throw new Error(
            `Action de combat inconnue : ${actionId}.`
        );

    }


    return spendAction(
        state,
        action.cost
    );

}
