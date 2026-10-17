/**
 * Transforme les entrées du catalogue de véhicules
 * (vehicle-catalog.mjs) en données d'Actor Foundry conformes
 * au DataModel `vehicle` (VehicleDataModel).
 *
 * Fonction pure : aucune dépendance à `foundry.*`.
 */

export const DEFAULT_ACTOR_IMAGE = "icons/svg/mystery-man.svg";

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
 * Actor `vehicle`.
 */
export function buildVehicleActorData(entry) {

    return {
        name: entry.name,
        type: "vehicle",
        img: DEFAULT_ACTOR_IMAGE,
        flags: seedFlags(entry.key),
        system: {
            identity: {
                vehicleType: entry.vehicleType ?? "",
                description: entry.page ? `<p>Source : règles p.${entry.page}.</p>` : ""
            },
            stats: {
                displacement: entry.displacement ?? 0,
                reducedInEncumberedZone: entry.reducedInEncumberedZone ?? false,
                integrity: {
                    value: entry.integrity ?? 0,
                    max: entry.integrity ?? 0
                },
                reliability: entry.reliability ?? 0,
                armor: entry.armor ?? 0
            },
            occupants: {
                driver: "",
                passengers: []
            },
            gmNotes: ""
        }
    };
}


/**
 * Construit la liste complète des données d'Actor du
 * catalogue de véhicules.
 *
 * @param {object[]} catalog VEHICLES
 */
export function buildAllVehicleActorsData(catalog) {

    return catalog.map(buildVehicleActorData);

}
