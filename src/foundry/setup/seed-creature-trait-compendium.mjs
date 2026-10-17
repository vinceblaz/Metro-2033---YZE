import { buildCreatureTraitCompendiumItems }
    from "../../data/seed/bestiary-actor-builder.mjs";

import { CREATURES }
    from "../../data/seed/creature-catalog.mjs";


const SEED_PACK_LABEL = "Métro 2033 — Traits de Créatures";
const SEED_PACK_NAME = "traits-de-creatures";
const SEED_FLAG_SCOPE = "metro-2033-yze";
const SEED_FLAG_KEY = "seedKey";


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
 * Importe (ou met à jour) le catalogue de Talents et
 * d'Archétypes dans un compendium Item du monde courant.
 *
 * Idempotent, sur le même principe que
 * seedEquipmentCompendium() (flags["metro-2033-yze"].seedKey).
 *
 * Utilisation, depuis la console ou un macro Foundry :
 *
 *   await CONFIG.Metro2033.seedCreatureTraitCompendium();
 *
 * @returns {Promise<{created: number, updated: number, pack: CompendiumCollection}>}
 */
export async function seedCreatureTraitCompendium() {

    if (!game.user?.isGM) {
        throw new Error(
            "Métro 2033 | Seul le MJ peut importer le catalogue Traits de Créature."
        );
    }

    const pack = await getOrCreateSeedPack();

    const itemsData = buildCreatureTraitCompendiumItems(CREATURES);

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
        "Métro 2033 | Import du catalogue Traits de Créature :",
        `${toCreate.length} créé(s), ${toUpdate.length} mis à jour`
    );

    ui.notifications?.info(
        `Métro 2033 — Traits de Créature : ${toCreate.length} Item(s) créé(s), `
        + `${toUpdate.length} mis à jour dans « ${SEED_PACK_LABEL} ».`
    );

    return {
        created: toCreate.length,
        updated: toUpdate.length,
        pack
    };
}
