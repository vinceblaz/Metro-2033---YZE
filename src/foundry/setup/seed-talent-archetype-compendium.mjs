import { buildAllTalentArchetypeItemsData }
    from "../../data/seed/talent-archetype-item-builder.mjs";

import {
    GENERAL_TALENTS,
    ARCHETYPE_TALENTS,
    ARCHETYPES
} from "../../data/seed/talent-archetype-catalog.mjs";


const SEED_PACK_LABEL = "Métro 2033 — Talents et Archétypes";
const SEED_PACK_NAME = "talents-et-archetypes";
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
 *   await CONFIG.Metro2033.seedTalentArchetypeCompendium();
 *
 * @returns {Promise<{created: number, updated: number, pack: CompendiumCollection}>}
 */
export async function seedTalentArchetypeCompendium() {

    if (!game.user?.isGM) {
        throw new Error(
            "Métro 2033 | Seul le MJ peut importer le catalogue Talents/Archétypes."
        );
    }

    const pack = await getOrCreateSeedPack();

    const itemsData = buildAllTalentArchetypeItemsData({
        generalTalents: GENERAL_TALENTS,
        archetypeTalents: ARCHETYPE_TALENTS,
        archetypes: ARCHETYPES
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
        "Métro 2033 | Import du catalogue Talents/Archétypes :",
        `${toCreate.length} créé(s), ${toUpdate.length} mis à jour`
    );

    ui.notifications?.info(
        `Métro 2033 — Talents/Archétypes : ${toCreate.length} Item(s) créé(s), `
        + `${toUpdate.length} mis à jour dans « ${SEED_PACK_LABEL} ».`
    );

    return {
        created: toCreate.length,
        updated: toUpdate.length,
        pack
    };
}
