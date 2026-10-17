/**
 * Transforme les entrées de `psychological-trauma-catalog.mjs`
 * en données d'Item Foundry conformes à
 * `PsychologicalTraumaDataModel`.
 *
 * Fonction pure : aucune dépendance à `foundry.*`.
 */

export const DEFAULT_ITEM_IMAGE = "icons/svg/paralysis.svg";

const SEED_FLAG_SCOPE = "metro-2033-yze";
const SEED_FLAG_KEY = "seedKey";


function seedFlags(key) {
    return {
        [SEED_FLAG_SCOPE]: {
            [SEED_FLAG_KEY]: key
        }
    };
}


/**
 * Clé de seed stable d'une entrée du catalogue.
 *
 * Reprise par `seed-psychological-trauma-roll-table.mjs` pour
 * relier chaque résultat de la RollTable à l'Item correspondant.
 */
export function psychologicalTraumaSeedKey(entry) {
    return `psychological-trauma-${entry.min}-${entry.max}`;
}


/**
 * Item `psychologicalTrauma`.
 */
export function buildPsychologicalTraumaItemData(entry) {

    return {
        name: entry.name,
        type: "psychologicalTrauma",
        img: DEFAULT_ITEM_IMAGE,
        flags: seedFlags(psychologicalTraumaSeedKey(entry)),
        system: {
            d66: {
                min: entry.min ?? 0,
                max: entry.max ?? 0
            },
            description: entry.description ?? "",
            gmNotes: entry.gmNotes ?? "",
            effect: entry.effect ?? "",
            instantDeath: entry.instantDeath ?? false,
            recoveryFormula: entry.recoveryFormula ?? "",
            permanent: entry.permanent ?? false
        }
    };
}


/**
 * Construit la liste complète des données d'Item Traumatisme
 * psychologique.
 *
 * @param {object[]} catalog Le tableau PSYCHOLOGICAL_TRAUMAS.
 */
export function buildAllPsychologicalTraumaItemsData(catalog) {
    return catalog.map(buildPsychologicalTraumaItemData);
}
