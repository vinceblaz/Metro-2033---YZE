import { buildAllWeaponModItemsData }
    from "../../data/seed/weapon-mod-item-builder.mjs";

import {
    WEAPON_MODS
} from "../../data/seed/weapon-mod-catalog.mjs";


const SEED_PACK_LABEL = "Métro 2033 — Améliorations d'armes";
const SEED_PACK_NAME = "ameliorations-armes";
const SEED_FLAG_SCOPE = "metro-2033-yze";
const SEED_FLAG_KEY = "seedKey";


/**
 * Retrouve (ou crée) le compendium Item dédié
 * aux Améliorations d'arme importées depuis les règles.
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
 * Importe (ou met à jour) le catalogue des Améliorations d'arme
 * dans un compendium Item du monde courant.
 *
 * Idempotent : chaque entrée du catalogue porte une seedKey
 * stable (flags["metro-2033-yze"].seedKey) ; les Items déjà
 * présents dans le compendium sont mis à jour plutôt que
 * dupliqués lors d'un ré-import.
 *
 * Utilisation, depuis la console ou un macro Foundry :
 *
 *   await CONFIG.Metro2033.seedWeaponModCompendium();
 *
 * @returns {Promise<{created: number, updated: number, pack: CompendiumCollection}>}
 */
export async function seedWeaponModCompendium() {

    if (!game.user?.isGM) {
        throw new Error(
            "Métro 2033 | Seul le MJ peut importer le catalogue des Améliorations d'arme."
        );
    }

    const pack = await getOrCreateSeedPack();

    const itemsData = buildAllWeaponModItemsData({
        weaponMods: WEAPON_MODS
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
        "Métro 2033 | Import du catalogue des Améliorations d'arme :",
        `${toCreate.length} créé(s), ${toUpdate.length} mis à jour`
    );

    ui.notifications?.info(
        `Métro 2033 — Améliorations d'arme : ${toCreate.length} Item(s) créé(s), `
        + `${toUpdate.length} mis à jour dans « ${SEED_PACK_LABEL} ».`
    );

    return {
        created: toCreate.length,
        updated: toUpdate.length,
        pack
    };
}
