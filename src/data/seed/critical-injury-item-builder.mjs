/**
 * Transforme les entrées de `critical-injury-catalog.mjs` en
 * données d'Item Foundry conformes à `CriticalInjuryDataModel`.
 *
 * Fonction pure : aucune dépendance à `foundry.*`.
 */

export const DEFAULT_ITEM_IMAGE = "icons/svg/blood.svg";

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
 * Reprise par `seed-critical-injury-roll-table.mjs` pour
 * relier chaque résultat de la RollTable à l'Item correspondant.
 */
export function criticalInjurySeedKey(entry) {
    return `critical-injury-${entry.d66}`;
}


/**
 * Item `criticalInjury`.
 */
export function buildCriticalInjuryItemData(entry) {

    return {
        name: entry.name,
        type: "criticalInjury",
        img: DEFAULT_ITEM_IMAGE,
        flags: seedFlags(criticalInjurySeedKey(entry)),
        system: {
            d66: entry.d66 ?? 0,
            description: entry.description ?? "",
            gmNotes: entry.gmNotes ?? "",
            effect: entry.effect ?? "",
            fatal: entry.fatal ?? false,
            deathRollModifier: entry.deathRollModifier ?? 0,
            deathRollInterval: entry.deathRollInterval ?? "",
            instantDeath: entry.instantDeath ?? false,
            recoveryFormula: entry.recoveryFormula ?? "",
            permanent: entry.permanent ?? false
        }
    };
}


/**
 * Construit la liste complète des données d'Item Blessure
 * critique.
 *
 * @param {object[]} catalog Le tableau CRITICAL_INJURIES.
 */
export function buildAllCriticalInjuryItemsData(catalog) {
    return catalog.map(buildCriticalInjuryItemData);
}
