/**
 * Construction des résultats d'une RollTable Foundry « D6 »
 * pour la table « VÉHICULES HORS D'ÉTAT » (règles p.211).
 *
 * Contrairement aux tables D66 (Blessures critiques,
 * Traumatismes psychologiques), les résultats de cette table
 * sont du texte pur : pas de Document (Item) par résultat.
 *
 * Fonctions pures : aucune dépendance à `foundry.*`. La
 * construction du Document RollTable lui-même (Foundry) vit
 * dans `seed-vehicle-breakdown-roll-table.mjs`.
 */

export const D6_FORMULA = "1d6";


/**
 * Un résultat de RollTable de type texte pur (pas de Document
 * associé).
 */
export function buildTextRollTableResultData({
    range,
    text,
    weight = 1
} = {}) {

    if (
        !Array.isArray(range)
        || range.length !== 2
        || !Number.isInteger(range[0])
        || !Number.isInteger(range[1])
        || range[0] > range[1]
    ) {
        throw new TypeError(
            "range doit être un tableau [min, max] d'entiers valides."
        );
    }

    if (typeof text !== "string" || text === "") {
        throw new TypeError(
            "text est requis pour un résultat de type texte."
        );
    }

    return {
        type: "text",
        text,
        range,
        weight,
        drawn: false
    };
}


/**
 * Construit les résultats de la RollTable « Véhicules hors
 * d'état » à partir du catalogue.
 *
 * @param {object[]} catalog VEHICLE_BREAKDOWN_RESULTS
 */
export function buildVehicleBreakdownRollTableResultsData(catalog) {

    return catalog.map((entry) => buildTextRollTableResultData({
        range: [entry.range, entry.range],
        text: `${entry.name} — ${entry.text}`
    }));

}
