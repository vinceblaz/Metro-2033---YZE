/**
 * Actions d'éclat de combat rapproché.
 *
 * Règle Métro 2033 :
 *
 * - la première réussite permet de toucher ;
 * - chaque réussite excédentaire peut être dépensée
 *   pour UNE action d'éclat ;
 * - certaines actions sont répétables ;
 * - les autres ne peuvent être choisies qu'une fois.
 *
 * Ce module est une règle de domaine pure :
 *
 * - aucune dépendance Foundry ;
 * - aucune modification d'Actor ;
 * - aucun dégât appliqué ;
 * - aucun mouvement appliqué ;
 * - aucune initiative modifiée.
 */


/* ============================================================
 * CLÉS
 * ============================================================ */


export const MELEE_STUNT_KEYS =
    Object.freeze({

        VIGOR_DAMAGE:
            "vigor-damage",

        AGILITY_DAMAGE:
            "agility-damage",

        SWAP_INITIATIVE:
            "swap-initiative",

        DISARM:
            "disarm",

        KNOCKDOWN:
            "knockdown",

        GRAPPLE:
            "grapple"

    });


/* ============================================================
 * DÉFINITIONS
 * ============================================================ */


/**
 * Toutes les actions d'éclat de mêlée coûtent
 * une réussite excédentaire par utilisation.
 *
 * repeatable indique si plusieurs réussites
 * peuvent être dépensées dans le même éclat.
 */
export const MELEE_STUNT_DEFINITIONS =
    Object.freeze({

        [MELEE_STUNT_KEYS.VIGOR_DAMAGE]:
            Object.freeze({

                key:
                    MELEE_STUNT_KEYS
                        .VIGOR_DAMAGE,

                label:
                    "+1 dégât à la Vigueur",

                cost:
                    1,

                repeatable:
                    true

            }),

        [MELEE_STUNT_KEYS.AGILITY_DAMAGE]:
            Object.freeze({

                key:
                    MELEE_STUNT_KEYS
                        .AGILITY_DAMAGE,

                label:
                    "+1 dégât à l'Agilité",

                cost:
                    1,

                repeatable:
                    true

            }),

        [MELEE_STUNT_KEYS.SWAP_INITIATIVE]:
            Object.freeze({

                key:
                    MELEE_STUNT_KEYS
                        .SWAP_INITIATIVE,

                label:
                    "Échanger l'initiative",

                cost:
                    1,

                repeatable:
                    false

            }),

        [MELEE_STUNT_KEYS.DISARM]:
            Object.freeze({

                key:
                    MELEE_STUNT_KEYS
                        .DISARM,

                label:
                    "Désarmer",

                cost:
                    1,

                repeatable:
                    false

            }),

        [MELEE_STUNT_KEYS.KNOCKDOWN]:
            Object.freeze({

                key:
                    MELEE_STUNT_KEYS
                        .KNOCKDOWN,

                label:
                    "Faire tomber ou repousser",

                cost:
                    1,

                repeatable:
                    false

            }),

        [MELEE_STUNT_KEYS.GRAPPLE]:
            Object.freeze({

                key:
                    MELEE_STUNT_KEYS
                        .GRAPPLE,

                label:
                    "Saisir",

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
        "La quantité d'une action d'éclat est invalide."
    );

}


/**
 * Retourne la définition d'un éclat.
 */
export function getMeleeStuntDefinition(
    key
) {

    return (
        MELEE_STUNT_DEFINITIONS[key]
        ?? null
    );

}


/**
 * Retourne la liste exploitable par une interface.
 *
 * On retourne de nouvelles structures pour éviter
 * qu'une Application ne modifie les constantes métier.
 */
export function getMeleeStuntDefinitions() {

    return Object.values(
        MELEE_STUNT_DEFINITIONS
    )
        .map(
            definition => ({
                ...definition
            })
        );

}


/* ============================================================
 * NORMALISATION D'UNE SÉLECTION
 * ============================================================ */


function normalizeSelection(
    key,
    quantity
) {

    const definition =
        getMeleeStuntDefinition(
            key
        );


    if (!definition) {

        throw new Error(
            `Action d'éclat de mêlée inconnue : ${key}.`
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
            `L'action d'éclat "${definition.label}" ne peut être choisie qu'une fois.`
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


/* ============================================================
 * COMPATIBILITÉ AVEC L'ALLOCATION ACTUELLE
 * ============================================================ */


/**
 * Le moteur actuel utilise une allocation sous forme :
 *
 * {
 *     vigorDamage: 2,
 *     agilityDamage: 1,
 *     swapInitiative: true,
 *     disarm: false,
 *     knockdown: true,
 *     grapple: false
 * }
 *
 * La future fenêtre utilisera des sélections normalisées.
 *
 * Cette fonction permet de conserver les deux formats
 * pendant la migration du workflow.
 */
function normalizeLegacyAllocation(
    allocation
) {

    return [

        normalizeSelection(
            MELEE_STUNT_KEYS
                .VIGOR_DAMAGE,
            allocation?.vigorDamage
                ?? 0
        ),

        normalizeSelection(
            MELEE_STUNT_KEYS
                .AGILITY_DAMAGE,
            allocation?.agilityDamage
                ?? 0
        ),

        normalizeSelection(
            MELEE_STUNT_KEYS
                .SWAP_INITIATIVE,
            allocation?.swapInitiative
                ?? 0
        ),

        normalizeSelection(
            MELEE_STUNT_KEYS
                .DISARM,
            allocation?.disarm
                ?? 0
        ),

        normalizeSelection(
            MELEE_STUNT_KEYS
                .KNOCKDOWN,
            allocation?.knockdown
                ?? 0
        ),

        normalizeSelection(
            MELEE_STUNT_KEYS
                .GRAPPLE,
            allocation?.grapple
                ?? 0
        )

    ];

}


/**
 * Nouveau format :
 *
 * [
 *     {
 *         key: "vigor-damage",
 *         quantity: 3
 *     },
 *     {
 *         key: "knockdown",
 *         quantity: 1
 *     }
 * ]
 */
function normalizeSelectionArray(
    selections
) {

    const quantities =
        new Map();


    for (
        const entry
        of selections
    ) {

        if (
            !entry
            || typeof entry !== "object"
        ) {

            throw new TypeError(
                "Une sélection d'éclat est invalide."
            );

        }


        const definition =
            getMeleeStuntDefinition(
                entry.key
            );


        if (!definition) {

            throw new Error(
                `Action d'éclat de mêlée inconnue : ${entry.key}.`
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
        MELEE_STUNT_DEFINITIONS
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


function normalizeAllocation(
    allocation
) {

    if (
        Array.isArray(
            allocation
        )
    ) {

        return normalizeSelectionArray(
            allocation
        );

    }


    if (
        allocation === null
        || allocation === undefined
    ) {

        return normalizeLegacyAllocation(
            {}
        );

    }


    if (
        typeof allocation !== "object"
    ) {

        throw new TypeError(
            "L'allocation des actions d'éclat est invalide."
        );

    }


    return normalizeLegacyAllocation(
        allocation
    );

}


/* ============================================================
 * RÉSOLUTION
 * ============================================================ */


/**
 * Valide et résout la dépense des réussites
 * supplémentaires d'une attaque de mêlée.
 *
 * Cette fonction ne produit que des conséquences
 * abstraites.
 *
 * Elle n'applique rien à un Actor.
 */
export function resolveMeleeStunts({

    extraSuccesses = 0,

    allocation = {}

} = {}) {

    const available =
        normalizeNonNegativeInteger(
            extraSuccesses,
            "Le nombre de réussites excédentaires"
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
            `Trop de réussites excédentaires dépensées : ${spent}/${available}.`
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


    const vigorDamage =
        getQuantity(
            MELEE_STUNT_KEYS
                .VIGOR_DAMAGE
        );


    const agilityDamage =
        getQuantity(
            MELEE_STUNT_KEYS
                .AGILITY_DAMAGE
        );


    const swapInitiative =
        getQuantity(
            MELEE_STUNT_KEYS
                .SWAP_INITIATIVE
        ) === 1;


    const disarm =
        getQuantity(
            MELEE_STUNT_KEYS
                .DISARM
        ) === 1;


    const knockdown =
        getQuantity(
            MELEE_STUNT_KEYS
                .KNOCKDOWN
        ) === 1;


    const grapple =
        getQuantity(
            MELEE_STUNT_KEYS
                .GRAPPLE
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

            vigorDamage,

            agilityDamage,

            swapInitiative,

            disarm,

            knockdown,

            grapple

        }

    };

}