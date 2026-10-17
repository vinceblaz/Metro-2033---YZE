import { VEHICLE_BREAKDOWN_RESULTS }
    from "../../data/seed/vehicle-breakdown-catalog.mjs";

import {
    D6_FORMULA,
    buildVehicleBreakdownRollTableResultsData
} from "../../data/seed/vehicle-breakdown-roll-table-builder.mjs";


const TABLE_NAME = "Métro 2033 — Véhicules hors d'état (D6)";
const TABLE_SEED_KEY = "vehicle-breakdown-table";
const SEED_FLAG_SCOPE = "metro-2033-yze";
const SEED_FLAG_KEY = "seedKey";


/**
 * Crée (ou met à jour) la RollTable Foundry « Véhicules hors
 * d'état », qui tire automatiquement le résultat de D6
 * correspondant (règles p.211).
 *
 * Contrairement aux RollTables « Blessures critiques » /
 * « Traumatismes psychologiques », les résultats sont du
 * texte pur : aucun compendium d'Items préalable n'est
 * nécessaire.
 *
 * Idempotent (flags["metro-2033-yze"].seedKey sur la
 * RollTable) : un second appel met à jour la RollTable
 * existante plutôt que d'en recréer une seconde.
 *
 * Utilisation, depuis la console ou un macro Foundry :
 *
 *   await CONFIG.Metro2033.seedVehicleBreakdownRollTable();
 *
 * Puis, en jeu : ouvrir la RollTable « Véhicules hors d'état »
 * dans l'onglet Tables de jet et cliquer sur « Lancer ».
 *
 * @returns {Promise<RollTable>}
 */
export async function seedVehicleBreakdownRollTable() {

    if (!game.user?.isGM) {
        throw new Error(
            "Métro 2033 | Seul le MJ peut créer la table de jet des Véhicules hors d'état."
        );
    }

    const results = buildVehicleBreakdownRollTableResultsData(
        VEHICLE_BREAKDOWN_RESULTS
    );

    const existingTable = game.tables.find(
        (table) => foundry.utils.getProperty(
            table,
            `flags.${SEED_FLAG_SCOPE}.${SEED_FLAG_KEY}`
        ) === TABLE_SEED_KEY
    );

    const tableData = {
        name: TABLE_NAME,
        formula: D6_FORMULA,
        replacement: true,
        displayRoll: true,
        results,
        flags: {
            [SEED_FLAG_SCOPE]: {
                [SEED_FLAG_KEY]: TABLE_SEED_KEY
            }
        }
    };

    if (existingTable) {

        await existingTable.deleteEmbeddedDocuments(
            "TableResult",
            existingTable.results.map((result) => result.id)
        );

        await existingTable.update(tableData);

        console.log(
            "Métro 2033 | RollTable « Véhicules hors d'état » mise à jour."
        );

        ui.notifications?.info(
            `Métro 2033 — RollTable « ${TABLE_NAME} » mise à jour.`
        );

        return existingTable;
    }

    const createdTable = await RollTable.create(tableData);

    console.log(
        "Métro 2033 | RollTable « Véhicules hors d'état » créée."
    );

    ui.notifications?.info(
        `Métro 2033 — RollTable « ${TABLE_NAME} » créée.`
    );

    return createdTable;
}
