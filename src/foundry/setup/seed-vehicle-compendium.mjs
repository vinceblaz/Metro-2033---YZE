import { buildAllVehicleActorsData }
    from "../../data/seed/vehicle-actor-builder.mjs";

import { VEHICLES }
    from "../../data/seed/vehicle-catalog.mjs";


const SEED_PACK_LABEL = "Métro 2033 — Véhicules";
const SEED_PACK_NAME = "vehicules";
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
            type: "Actor",
            label: SEED_PACK_LABEL,
            name: SEED_PACK_NAME,
            package: "world"
        }
    );
}


/**
 * Importe (ou met à jour) le catalogue de véhicules (table
 * « VÉHICULES TYPES », règles p.211) dans un compendium Actor
 * du monde courant.
 *
 * Idempotent (flags["metro-2033-yze"].seedKey), sur le même
 * principe que seedBestiaryCompendium().
 *
 * Utilisation, depuis la console ou un macro Foundry :
 *
 *   await CONFIG.Metro2033.seedVehicleCompendium();
 *
 * @returns {Promise<{created: number, updated: number, pack: CompendiumCollection}>}
 */
export async function seedVehicleCompendium() {

    if (!game.user?.isGM) {
        throw new Error(
            "Métro 2033 | Seul le MJ peut importer les véhicules."
        );
    }

    const pack = await getOrCreateSeedPack();

    const actorsData = buildAllVehicleActorsData(VEHICLES);

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

    for (const data of actorsData) {

        const seedKey = data.flags[SEED_FLAG_SCOPE][SEED_FLAG_KEY];
        const existingId = existingBySeedKey.get(seedKey);

        if (existingId) {
            toUpdate.push({ _id: existingId, ...data });
        } else {
            toCreate.push(data);
        }
    }

    if (toCreate.length > 0) {
        await Actor.createDocuments(
            toCreate,
            { pack: pack.collection }
        );
    }

    if (toUpdate.length > 0) {
        await Actor.updateDocuments(
            toUpdate,
            { pack: pack.collection }
        );
    }

    console.log(
        "Métro 2033 | Import des véhicules :",
        `${toCreate.length} créé(s), ${toUpdate.length} mis à jour`
    );

    ui.notifications?.info(
        `Métro 2033 — Véhicules : ${toCreate.length} Actor(s) créé(s), `
        + `${toUpdate.length} mis à jour dans « ${SEED_PACK_LABEL} ».`
    );

    return {
        created: toCreate.length,
        updated: toUpdate.length,
        pack
    };
}
