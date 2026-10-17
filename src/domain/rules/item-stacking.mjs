/**
 * Règles de regroupement ("stack") des Items à quantité.
 *
 * Seuls les Munitions et les Consommables se regroupent :
 * les Armes et les Protections conservent chacune leur état
 * individuel (usure, résilience...) et ne sont jamais fusionnées.
 *
 * Deux Items sont considérés identiques lorsqu'ils partagent :
 *
 * - le même type ;
 * - le même nom (insensible à la casse et aux espaces) ;
 * - les mêmes valeurs pour un ensemble EXPLICITE de champs
 *   "mécaniques" (STACK_IDENTITY_FIELDS ci-dessous), à
 *   l'exclusion de la quantité elle-même.
 *
 * Les champs de texte libre (description, particularités,
 * notes MJ...) sont volontairement ignorés : deux Munitions
 * ou Consommables par ailleurs identiques doivent pouvoir se
 * cumuler même si l'un porte une note différente de l'autre.
 * C'est aussi plus robuste qu'une comparaison "tout sauf la
 * quantité" : un champ HTML peut être normalisé différemment
 * par Foundry entre la donnée brute d'un compendium et sa
 * version une fois intégrée à un Actor, ce qui casserait une
 * comparaison trop stricte.
 */
export const STACKABLE_ITEM_TYPES = [
    "ammunition",
    "consumable"
];


/**
 * Champs "mécaniques" comparés pour déterminer si deux Items
 * d'un même type empilable sont identiques.
 */
const STACK_IDENTITY_FIELDS = {

    ammunition: [
        "ammoType",
        "containerType",
        "consumptionMode",
        "quality",
        "compatibleWeaponTypes",
        "protectionReduction",
        "ignoresResilience",
        "weight",
        "price"
    ],

    consumable: [
        "unitLabel",
        "weight",
        "price"
    ]

};


export function isStackableItemType(type) {

    return STACKABLE_ITEM_TYPES.includes(
        type
    );

}


/**
 * Calcule une clé d'identité stable pour un Item.
 *
 * Renvoie null si le type n'est pas empilable : deux Items
 * de ce type ne doivent jamais être considérés identiques
 * par cette règle.
 */
export function computeStackIdentity({
    type,
    name,
    system
} = {}) {

    if (
        typeof type !== "string"
        || type === ""
    ) {
        throw new TypeError(
            "Le type de l'Item doit être une chaîne non vide."
        );
    }


    if (typeof name !== "string") {

        throw new TypeError(
            "Le nom de l'Item doit être une chaîne."
        );

    }


    const normalizedName =
        name.trim()
            .toLowerCase();


    if (normalizedName === "") {

        throw new TypeError(
            "Le nom de l'Item ne peut pas être vide."
        );

    }


    if (!isStackableItemType(type)) {
        return null;
    }


    const identityFields =
        STACK_IDENTITY_FIELDS[type]
        ?? [];


    const identityValues =
        identityFields.map(
            field =>
                _normalizeValue(
                    system?.[field]
                )
        );


    return JSON.stringify([

        type,

        normalizedName,

        identityValues

    ]);

}


/**
 * Normalise une valeur en vue d'une comparaison stable,
 * insensible à l'ordre des clés d'un objet ou des éléments
 * d'un tableau (ex : compatibleWeaponTypes).
 */
function _normalizeValue(
    value
) {

    if (value === undefined) {
        return null;
    }


    if (Array.isArray(value)) {

        return [...value]
            .map(_normalizeValue)
            .sort();

    }


    if (
        value !== null
        && typeof value === "object"
    ) {

        return Object.keys(value)
            .sort()
            .reduce(
                (normalized, key) => {

                    normalized[key] =
                        _normalizeValue(
                            value[key]
                        );

                    return normalized;

                },
                {}
            );

    }


    return value;

}


/**
 * Additionne des quantités de Munitions
 * (nombre entier positif ou nul).
 */
export function sumAmmunitionQuantities(
    quantities = []
) {

    if (!Array.isArray(quantities)) {

        throw new TypeError(
            "La liste de quantités doit être un tableau."
        );

    }


    return quantities.reduce(
        (sum, quantity) => {

            if (
                !Number.isInteger(quantity)
                || quantity < 0
            ) {

                throw new TypeError(
                    "Chaque quantité de Munition doit être "
                    + "un entier positif ou nul."
                );

            }


            return sum + quantity;

        },
        0
    );

}


/**
 * Additionne des quantités de Consommables.
 *
 * current et max sont additionnés séparément :
 * fusionner un stock de 2/5 avec un stock de 3/3
 * donne 5/8.
 */
export function sumConsumableQuantities(
    entries = []
) {

    if (!Array.isArray(entries)) {

        throw new TypeError(
            "La liste d'entrées doit être un tableau."
        );

    }


    return entries.reduce(
        (totals, entry) => {

            const current =
                entry?.current;

            const max =
                entry?.max;


            for (
                const value
                of [current, max]
            ) {

                if (
                    !Number.isInteger(value)
                    || value < 0
                ) {

                    throw new TypeError(
                        "current et max doivent être "
                        + "des entiers positifs ou nuls."
                    );

                }

            }


            if (current > max) {

                throw new RangeError(
                    "current ne peut pas dépasser max."
                );

            }


            return {

                current:
                    totals.current + current,

                max:
                    totals.max + max

            };

        },
        {
            current: 0,
            max: 0
        }
    );

}
