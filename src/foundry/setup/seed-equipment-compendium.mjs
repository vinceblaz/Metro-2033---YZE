import { buildAllEquipmentItemsData }
    from "../../data/seed/equipment-item-builder.mjs";

import {
    MELEE_WEAPONS,
    RANGED_WEAPONS,
    ARMORS,
    AMMUNITION,
    CONSUMABLES,
    RELICS
} from "../../data/seed/equipment-catalog.mjs";


const SEED_PACK_LABEL = "Métro 2033 — Équipement de base";
const SEED_PACK_NAME = "equipement-de-base";
const SEED_FLAG_SCOPE = "metro-2033-yze";
const SEED_FLAG_KEY = "seedKey";


/**
 * Retrouve (ou crée) le compendium Item dédié
 * à l'équipement de base importé depuis les règles.
 *
 * @returns {Promise<CompendiumCollection>}
 */
async function getOrCreateSeedPack() {

    const existingPack = game.packs.get(
        `world.${SEED_PACK_NAME}`
    );

    if (existingPack) {
        return existingPack;
    }

    return foundry.documents.collections.CompendiumCollection.createCompendium(
        {
            type: "Item",
            label: SEED_PACK_LABEL,
            name: SEED_PACK_NAME,
            package: "world"
        }
    );
}


/**
 * Importe (ou met à jour) le catalogue d'équipement de base
 * dans un compendium Item du monde courant.
 *
 * Idempotent : chaque entrée du catalogue porte une seedKey
 * stable (flags["metro-2033-yze"].seedKey) ; les Items déjà
 * présents dans le compendium sont mis à jour plutôt que
 * dupliqués lors d'un ré-import.
 *
 * Utilisation, depuis la console ou un macro Foundry :
 *
 *   await CONFIG.Metro2033.seedEquipmentCompendium();
 *
 * @returns {Promise<{created: number, updated: number, pack: CompendiumCollection}>}
 */
export async function seedEquipmentCompendium() {

    if (!game.user?.isGM) {
        throw new Error(
            "Métro 2033 | Seul le MJ peut importer le catalogue d'équipement."
        );
    }

    const pack = await getOrCreateSeedPack();

    const itemsData = buildAllEquipmentItemsData({
        meleeWeapons: MELEE_WEAPONS,
        rangedWeapons: RANGED_WEAPONS,
        armors: ARMORS,
        ammunition: AMMUNITION,
        consumables: CONSUMABLES,
        relics: RELICS
    });

    const index = await pack.getIndex(
        {
            fields: [`flags.${SEED_FLAG_SCOPE}.${SEED_FLAG_KEY}`]
        }
    );

    const existingBySeedKey = new Map();

    for (const entry of index) {
        const seedKey = foundry.utils.getProperty(
            entry,
            `flags.${SEED_FLAG_SCOPE}.${SEED_FLAG_KEY}`
        );

        if (seedKey) {
            existingBySeedKey.set(seedKey, entry._id);
        }
    }

    const toCreate = [];
    const toUpdate = [];

    for (const data of itemsData) {

        const seedKey = data.flags[SEED_FLAG_SCOPE][SEED_FLAG_KEY];
        const existingId = existingBySeedKey.get(seedKey);

        if (existingId) {
            toUpdate.push({ _id: existingId, ...data });
        } else {
            toCreate.push(data);
        }
    }

    if (toCreate.length > 0) {
        await Item.createDocuments(
            toCreate,
            { pack: pack.collection }
        );
    }

    if (toUpdate.length > 0) {
        await Item.updateDocuments(
            toUpdate,
            { pack: pack.collection }
        );
    }

    console.log(
        "Métro 2033 | Import du catalogue d'équipement :",
        `${toCreate.length} créé(s), ${toUpdate.length} mis à jour`
    );

    ui.notifications?.info(
        `Métro 2033 — Catalogue d'équipement : ${toCreate.length} Item(s) créé(s), `
        + `${toUpdate.length} mis à jour dans « ${SEED_PACK_LABEL} ».`
    );

    return {
        created: toCreate.length,
        updated: toUpdate.length,
        pack
    };
}
