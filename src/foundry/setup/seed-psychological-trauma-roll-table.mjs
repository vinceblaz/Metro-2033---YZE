import { PSYCHOLOGICAL_TRAUMAS }
    from "../../data/seed/psychological-trauma-catalog.mjs";

import {
    D66_FORMULA,
    buildPsychologicalTraumaRollTableResultsData
} from "../../data/seed/d66-roll-table-builder.mjs";


const ITEM_PACK_NAME = "traumatismes-psychologiques";
const TABLE_NAME = "Métro 2033 — Traumatismes psychologiques (D66)";
const TABLE_SEED_KEY = "psychological-trauma-table";
const SEED_FLAG_SCOPE = "metro-2033-yze";
const SEED_FLAG_KEY = "seedKey";


/**
 * Crée (ou met à jour) la RollTable Foundry « Traumatismes
 * psychologiques », qui tire automatiquement le résultat de
 * D66 correspondant (règles p.203) et pointe directement vers
 * l'Item du compendium « Métro 2033 — Traumatismes
 * psychologiques ».
 *
 * Préalable : les Items doivent déjà avoir été importés via
 * CONFIG.Metro2033.seedPsychologicalTraumaCompendium().
 *
 * Idempotent (flags["metro-2033-yze"].seedKey sur la
 * RollTable) : un second appel met à jour la RollTable
 * existante plutôt que d'en recréer une seconde.
 *
 * Utilisation, depuis la console ou un macro Foundry :
 *
 *   await CONFIG.Metro2033.seedPsychologicalTraumaCompendium();
 *   await CONFIG.Metro2033.seedPsychologicalTraumaRollTable();
 *
 * Puis, en jeu : ouvrir la RollTable « Traumatismes
 * psychologiques » dans l'onglet Tables de jet et cliquer sur
 * « Lancer ».
 *
 * @returns {Promise<RollTable>}
 */
export async function seedPsychologicalTraumaRollTable() {

    if (!game.user?.isGM) {
        throw new Error(
            "Métro 2033 | Seul le MJ peut créer la table de jet des Traumatismes psychologiques."
        );
    }

    const itemPack = game.packs.get(`world.${ITEM_PACK_NAME}`);

    if (!itemPack) {
        throw new Error(
            "Métro 2033 | Le compendium « Traumatismes psychologiques » n'existe pas encore. "
            + "Lancez d'abord CONFIG.Metro2033.seedPsychologicalTraumaCompendium()."
        );
    }

    const index = await itemPack.getIndex(
        {
            fields: [`flags.${SEED_FLAG_SCOPE}.${SEED_FLAG_KEY}`]
        }
    );

    const itemUuidBySeedKey = new Map();

    for (const entry of index) {

        const seedKey = foundry.utils.getProperty(
            entry,
            `flags.${SEED_FLAG_SCOPE}.${SEED_FLAG_KEY}`
        );

        if (seedKey) {
            itemUuidBySeedKey.set(
                seedKey,
                `Compendium.world.${ITEM_PACK_NAME}.Item.${entry._id}`
            );
        }
    }

    const results = buildPsychologicalTraumaRollTableResultsData(
        PSYCHOLOGICAL_TRAUMAS,
        itemUuidBySeedKey
    );

    const existingTable = game.tables.find(
        (table) => foundry.utils.getProperty(
            table,
            `flags.${SEED_FLAG_SCOPE}.${SEED_FLAG_KEY}`
        ) === TABLE_SEED_KEY
    );

    const tableData = {
        name: TABLE_NAME,
        formula: D66_FORMULA,
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
            "Métro 2033 | RollTable « Traumatismes psychologiques » mise à jour."
        );

        ui.notifications?.info(
            `Métro 2033 — RollTable « ${TABLE_NAME} » mise à jour.`
        );

        return existingTable;
    }

    const createdTable = await RollTable.create(tableData);

    console.log(
        "Métro 2033 | RollTable « Traumatismes psychologiques » créée."
    );

    ui.notifications?.info(
        `Métro 2033 — RollTable « ${TABLE_NAME} » créée.`
    );

    return createdTable;
}
