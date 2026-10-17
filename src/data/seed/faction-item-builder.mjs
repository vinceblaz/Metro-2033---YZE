/**
 * Transforme les entrées de `faction-catalog.mjs` en données
 * d'Item Foundry conformes à `FactionDataModel`.
 *
 * Fonction pure : aucune dépendance à `foundry.*`.
 */

export const DEFAULT_ITEM_IMAGE = "icons/svg/city.svg";

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
 * Item `faction`.
 */
export function buildFactionItemData(entry) {

    return {
        name: entry.name,
        type: "faction",
        img: DEFAULT_ITEM_IMAGE,
        flags: seedFlags(entry.key),
        system: {
            description: entry.description ?? "",
            ideology: entry.ideology ?? "",
            leader: entry.leader ?? "",
            resources: entry.resources ?? "",
            relations: [],
            notableMembers: [],
            gmNotes: ""
        }
    };
}


/**
 * Construit la liste complète des données d'Item Faction.
 *
 * @param {object[]} catalog Le tableau FACTIONS.
 */
export function buildAllFactionItemsData(catalog) {
    return catalog.map(buildFactionItemData);
}
