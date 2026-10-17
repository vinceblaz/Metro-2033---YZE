import { buildNpcActorData }
    from "../../data/seed/bestiary-actor-builder.mjs";

import { STATION_NPCS }
    from "../../data/seed/station-npc-catalog.mjs";


const SEED_PACK_LABEL = "Métro 2033 — PNJ des Stations";
const SEED_PACK_NAME = "pnj-des-stations";
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
 * Importe (ou met à jour) les PNJ notables des Stations
 * (Petchatniki, Doubrovka, Kojoukhovskaya) dans un compendium
 * Actor du monde courant.
 *
 * Idempotent (flags["metro-2033-yze"].seedKey). Comme pour
 * seedFactionNpcCompendium(), une mise à jour supprime puis
 * recrée l'Actor existant (ses Items Talent embarqués sont
 * régénérés), car Actor.updateDocuments ne régénère pas les
 * Items embarqués d'un document existant.
 *
 * Utilisation, depuis la console ou un macro Foundry :
 *
 *   await CONFIG.Metro2033.seedStationNpcCompendium();
 *
 * @returns {Promise<{created: number, updated: number, pack: CompendiumCollection}>}
 */
export async function seedStationNpcCompendium() {

    if (!game.user?.isGM) {
        throw new Error(
            "Métro 2033 | Seul le MJ peut importer les PNJ des Stations."
        );
    }

    const pack = await getOrCreateSeedPack();

    const actorsData = STATION_NPCS.map(buildNpcActorData);

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

        const idsToReplace = toUpdate.map((data) => data._id);

        await Actor.deleteDocuments(
            idsToReplace,
            { pack: pack.collection }
        );

        await Actor.createDocuments(
            toUpdate.map(({ _id, ...data }) => data),
            { pack: pack.collection }
        );
    }

    console.log(
        "Métro 2033 | Import des PNJ de Stations :",
        `${toCreate.length} créé(s), ${toUpdate.length} remplacé(s)`
    );

    ui.notifications?.info(
        `Métro 2033 — PNJ des Stations : ${toCreate.length} créé(s), `
        + `${toUpdate.length} remplacé(s) dans « ${SEED_PACK_LABEL} ».`
    );

    return {
        created: toCreate.length,
        updated: toUpdate.length,
        pack
    };
}
