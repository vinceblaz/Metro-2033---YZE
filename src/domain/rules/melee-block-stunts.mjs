/**
 * Actions d'éclat de blocage en combat rapproché.
 *
 * Règle Métro 2033 (p.197, « BLOQUER ») :
 *
 * - pour CHAQUE réussite de blocage (pas seulement
 *   les excédentaires, contrairement à l'attaquant),
 *   le défenseur choisit un effet ;
 * - annuler une réussite de l'attaquant est
 *   répétable ;
 * - contre-attaquer (dégâts d'arme à la Vigueur de
 *   l'attaquant) ne peut être choisi qu'une fois :
 *   on ne peut pas dépenser plusieurs réussites
 *   pour augmenter les dégâts de la contre-attaque ;
 * - désarmer l'attaquant ne peut être choisi
 *   qu'une fois.
 *
 * Ce module est une règle de domaine pure :
 *
 * - aucune dépendance Foundry ;
 * - aucune modification d'Actor ;
 * - aucun dégât appliqué ;
 * - aucun désarmement appliqué.
 *
 * La répartition se fait « à l'aveugle » : le
 * défenseur ne connaît pas encore le nombre de
 * réussites de l'attaquant au moment de choisir.
 * C'est la couche appelante qui confrontera ensuite
 * `effects.cancelledSuccesses` (déclaré ici) au
 * résultat réel de l'attaque.
 */


/* ============================================================
 * CLÉS
 * ============================================================ */


export const MELEE_BLOCK_STUNT_KEYS =
    Object.freeze({

        CANCEL_SUCCESS:
            "cancel-success",

        COUNTER_ATTACK:
            "counter-attack",

        DISARM:
            "disarm"

    });


/* ============================================================
 * DÉFINITIONS
 * ============================================================ */


export const MELEE_BLOCK_STUNT_DEFINITIONS =
    Object.freeze({

        [MELEE_BLOCK_STUNT_KEYS.CANCEL_SUCCESS]:
            Object.freeze({

                key:
                    MELEE_BLOCK_STUNT_KEYS
                        .CANCEL_SUCCESS,

                label:
                    "Annuler une réussite de l'attaquant",

                cost:
                    1,

                repeatable:
                    true

            }),

        [MELEE_BLOCK_STUNT_KEYS.COUNTER_ATTACK]:
            Object.freeze({

                key:
                    MELEE_BLOCK_STUNT_KEYS
                        .COUNTER_ATTACK,

                label:
                    "Contre-attaquer",

                cost:
                    1,

                repeatable:
                    false

            }),

        [MELEE_BLOCK_STUNT_KEYS.DISARM]:
            Object.freeze({

                key:
                    MELEE_BLOCK_STUNT_KEYS
                        .DISARM,

                label:
                    "Désarmer l'attaquant",

                cost:
                    1,

                repeatable:
                    false

            })

    });


/* ============================================================
 * UTILITAIRES
 * ============================================================ */


function normalizeNonNegativeInteger(
    value,
    label = "Valeur"
) {

    const number =
        Number(value);


    if (
        !Number.isInteger(number)
        || number < 0
    ) {

        throw new TypeError(
            `${label} doit être un entier positif ou nul.`
        );

    }


    return number;

}


function normalizeBooleanQuantity(
    value
) {

    if (
        value === true
        || value === 1
    ) {

        return 1;

    }


    if (
        value === false
        || value === 0
        || value === null
        || value === undefined
    ) {

        return 0;

    }


    const number =
        Number(value);


    if (
        Number.isInteger(number)
        && number >= 0
    ) {

        return number;

    }


    throw new TypeError(
        "La quantité d'une action d'éclat de blocage est invalide."
    );

}


export function getMeleeBlockStuntDefinition(
    key
) {

    return (
        MELEE_BLOCK_STUNT_DEFINITIONS[key]
        ?? null
    );

}


export function getMeleeBlockStuntDefinitions() {

    return Object.values(
        MELEE_BLOCK_STUNT_DEFINITIONS
    )
        .map(
            definition => ({
                ...definition
            })
        );

}


/* ============================================================
 * NORMALISATION D'UNE ALLOCATION
 * ============================================================ */


function normalizeSelection(
    key,
    quantity
) {

    const definition =
        getMeleeBlockStuntDefinition(
            key
        );


    if (!definition) {

        throw new Error(
            `Action d'éclat de blocage inconnue : ${key}.`
        );

    }


    const normalizedQuantity =
        normalizeBooleanQuantity(
            quantity
        );


    if (
        !definition.repeatable
        && normalizedQuantity > 1
    ) {

        throw new Error(
            `L'action d'éclat de blocage "${definition.label}" ne peut être choisie qu'une seule fois.`
        );

    }


    return {

        key:
            definition.key,

        quantity:
            normalizedQuantity,

        cost:
            definition.cost,

        spent:
            normalizedQuantity
            * definition.cost

    };

}


function normalizeAllocation(
    allocation
) {

    if (
        allocation === null
        || allocation === undefined
    ) {

        return [];

    }


    if (
        !Array.isArray(
            allocation
        )
    ) {

        throw new TypeError(
            "L'allocation des actions d'éclat de blocage est invalide."
        );

    }


    const quantities =
        new Map();


    for (
        const entry
        of allocation
    ) {

        if (
            !entry
            || typeof entry !== "object"
        ) {

            throw new TypeError(
                "Une sélection d'éclat de blocage est invalide."
            );

        }


        const definition =
            getMeleeBlockStuntDefinition(
                entry.key
            );


        if (!definition) {

            throw new Error(
                `Action d'éclat de blocage inconnue : ${entry.key}.`
            );

        }


        const quantity =
            normalizeBooleanQuantity(
                entry.quantity
                ?? 0
            );


        const previous =
            quantities.get(
                definition.key
            )
            ?? 0;


        quantities.set(
            definition.key,
            previous + quantity
        );

    }


    return Object.values(
        MELEE_BLOCK_STUNT_DEFINITIONS
    )
        .map(
            definition =>
                normalizeSelection(
                    definition.key,
                    quantities.get(
                        definition.key
                    )
                    ?? 0
                )
        );

}


/* ============================================================
 * RÉSOLUTION
 * ============================================================ */


/**
 * Valide et résout la répartition des réussites
 * de blocage d'un défenseur.
 *
 * Cette fonction ne produit que des conséquences
 * abstraites. Elle n'applique rien à un Actor et ne
 * connaît pas le résultat de l'attaque : c'est à la
 * couche appelante de confronter ensuite
 * `effects.cancelledSuccesses` au nombre réel de
 * réussites de l'attaquant.
 */
export function resolveMeleeBlockStunts({

    blockSuccesses = 0,

    allocation = []

} = {}) {

    const available =
        normalizeNonNegativeInteger(
            blockSuccesses,
            "Le nombre de réussites de blocage"
        );


    const normalizedSelections =
        normalizeAllocation(
            allocation
        );


    const selections =
        normalizedSelections
            .filter(
                selection =>
                    selection.quantity > 0
            );


    const spent =
        selections.reduce(
            (
                total,
                selection
            ) =>
                total
                + selection.spent,
            0
        );


    if (
        spent > available
    ) {

        throw new Error(
            `Trop de réussites de blocage dépensées : ${spent}/${available}.`
        );

    }


    const getQuantity =
        key =>
            selections.find(
                selection =>
                    selection.key === key
            )
                ?.quantity
            ?? 0;


    const cancelledSuccesses =
        getQuantity(
            MELEE_BLOCK_STUNT_KEYS
                .CANCEL_SUCCESS
        );


    const counterAttack =
        getQuantity(
            MELEE_BLOCK_STUNT_KEYS
                .COUNTER_ATTACK
        ) === 1;


    const disarm =
        getQuantity(
            MELEE_BLOCK_STUNT_KEYS
                .DISARM
        ) === 1;


    return {

        available,

        spent,

        remaining:
            available - spent,

        selections:
            selections.map(
                selection => ({
                    ...selection
                })
            ),

        effects: {

            cancelledSuccesses,

            counterAttack,

            disarm

        }

    };

}
