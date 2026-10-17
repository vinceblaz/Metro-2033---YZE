/**
 * Construction des résultats d'une RollTable Foundry « D66 »
 * (Blessures critiques p.202, Traumatismes psychologiques
 * p.203).
 *
 * Un jet de D66 se simule avec deux D6 : le premier donne les
 * dizaines, le second les unités. La formule Foundry
 * correspondante est `D66_FORMULA` ci-dessous : elle ne peut
 * produire que des résultats à deux chiffres dont chacun est
 * compris entre 1 et 6 (11, 12... 16, 21... 66), exactement le
 * même ensemble de valeurs que la colonne D66 du livre.
 *
 * Fonctions pures : aucune dépendance à `foundry.*`. La
 * construction du Document RollTable lui-même (Foundry) vit
 * dans `seed-critical-injury-roll-table.mjs` et
 * `seed-psychological-trauma-roll-table.mjs`.
 */

import { criticalInjurySeedKey }
    from "./critical-injury-item-builder.mjs";

import { psychologicalTraumaSeedKey }
    from "./psychological-trauma-item-builder.mjs";


export const D66_FORMULA = "(1d6 * 10) + 1d6";


/**
 * Un résultat de RollTable pointant vers un Document
 * (convention Foundry v13+ : `documentUuid` unique, qui
 * remplace les anciens champs `documentCollection` /
 * `documentId`).
 */
export function buildDocumentRollTableResultData({
    range,
    documentUuid,
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

    if (typeof documentUuid !== "string" || documentUuid === "") {
        throw new TypeError(
            "documentUuid est requis pour un résultat de type Document."
        );
    }

    return {
        type: "document",
        documentUuid,
        range,
        weight,
        drawn: false
    };
}


/**
 * Construit les résultats de la RollTable « Blessures
 * critiques » à partir du catalogue et d'une correspondance
 * seedKey → UUID d'Item (déterminée après import des Items
 * dans leur compendium).
 *
 * @param {object[]} catalog CRITICAL_INJURIES
 * @param {Map<string,string>} itemUuidBySeedKey
 */
export function buildCriticalInjuryRollTableResultsData(
    catalog,
    itemUuidBySeedKey
) {

    return catalog.map((entry) => {

        const seedKey = criticalInjurySeedKey(entry);
        const documentUuid = itemUuidBySeedKey.get(seedKey);

        if (!documentUuid) {
            throw new Error(
                `Aucun UUID d'Item trouvé pour la Blessure critique « ${seedKey} ».`
            );
        }

        return buildDocumentRollTableResultData({
            range: [entry.d66, entry.d66],
            documentUuid
        });
    });
}


/**
 * Construit les résultats de la RollTable « Traumatismes
 * psychologiques » à partir du catalogue et d'une
 * correspondance seedKey → UUID d'Item.
 *
 * @param {object[]} catalog PSYCHOLOGICAL_TRAUMAS
 * @param {Map<string,string>} itemUuidBySeedKey
 */
export function buildPsychologicalTraumaRollTableResultsData(
    catalog,
    itemUuidBySeedKey
) {

    return catalog.map((entry) => {

        const seedKey = psychologicalTraumaSeedKey(entry);
        const documentUuid = itemUuidBySeedKey.get(seedKey);

        if (!documentUuid) {
            throw new Error(
                `Aucun UUID d'Item trouvé pour le Traumatisme psychologique « ${seedKey} ».`
            );
        }

        return buildDocumentRollTableResultData({
            range: [entry.min, entry.max],
            documentUuid
        });
    });
}
