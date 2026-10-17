/**
 * Transforme les entrées de `station-catalog.mjs` en données
 * d'Item Foundry conformes à `StationDataModel`.
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
 * Item `station`.
 */
export function buildStationItemData(entry) {

    return {
        name: entry.name,
        type: "station",
        img: DEFAULT_ITEM_IMAGE,
        flags: seedFlags(entry.key),
        system: {
            description: entry.description ?? "",
            line: entry.line ?? "",
            population: {
                level: entry.population?.level ?? 0,
                members: entry.population?.members ?? 0
            },
            resources: {
                water: entry.resources?.water ?? 0,
                food: entry.resources?.food ?? 0,
                equipment: entry.resources?.equipment ?? 0,
                energy: entry.resources?.energy ?? 0,
                medicine: entry.resources?.medicine ?? 0
            },
            supportPersonnel: {
                water: entry.supportPersonnel?.water ?? 0,
                food: entry.supportPersonnel?.food ?? 0,
                equipment: entry.supportPersonnel?.equipment ?? 0,
                energy: entry.supportPersonnel?.energy ?? 0,
                medicine: entry.supportPersonnel?.medicine ?? 0
            },
            status: entry.status ?? "",
            controllingFaction: entry.controllingFaction ?? "",
            market: entry.market ?? "",
            defenses: entry.defenses ?? "",
            connections: entry.connections ?? [],
            notableNPCs: [],
            gmNotes: entry.gmNotes ?? ""
        }
    };
}


/**
 * Construit la liste complète des données d'Item Station.
 *
 * @param {object[]} catalog Le tableau STATIONS.
 */
export function buildAllStationItemsData(catalog) {
    return catalog.map(buildStationItemData);
}
