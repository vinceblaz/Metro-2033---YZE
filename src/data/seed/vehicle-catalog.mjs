/**
 * Catalogue des véhicules de référence, extrait de la table
 * « VÉHICULES TYPES » (règles p.211).
 *
 * Donnée pure, aucune dépendance Foundry.
 *
 * Véhicules terrestres uniquement dans ce premier jalon du
 * chantier Véhicule : les véhicules aériens sont explicitement
 * hors scope et reportés à un chantier ultérieur.
 *
 * `reducedInEncumberedZone` correspond au `*` de la table du
 * livre : le véhicule peut entrer en zone encombrée, mais son
 * Déplacement tombe alors à 1 (cf.
 * src/domain/rules/vehicle.mjs, resolveVehicleDisplacement()).
 */

export const VEHICLES = [

    {
        key: "moto-tout-terrain",
        name: "Moto tout-terrain",
        vehicleType: "Moto tout-terrain",
        page: 211,
        displacement: 2,
        reducedInEncumberedZone: true,
        integrity: 3,
        reliability: 2,
        armor: 0
    },

    {
        key: "jeep",
        name: "Jeep",
        vehicleType: "Jeep",
        page: 211,
        displacement: 2,
        reducedInEncumberedZone: true,
        integrity: 6,
        reliability: 3,
        armor: 3
    },

    {
        key: "4x4",
        name: "4x4",
        vehicleType: "4x4",
        page: 211,
        displacement: 2,
        reducedInEncumberedZone: true,
        integrity: 8,
        reliability: 3,
        armor: 4
    },

    {
        key: "camion",
        name: "Camion",
        vehicleType: "Camion",
        page: 211,
        displacement: 2,
        reducedInEncumberedZone: false,
        integrity: 10,
        reliability: 3,
        armor: 5
    },

    {
        key: "vehicule-blinde",
        name: "Véhicule blindé",
        vehicleType: "Véhicule blindé",
        page: 211,
        displacement: 2,
        reducedInEncumberedZone: false,
        integrity: 12,
        reliability: 4,
        armor: 7
    }

];
