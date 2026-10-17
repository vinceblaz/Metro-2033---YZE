import { buildAllCriticalInjuryItemsData }
    from "../../data/seed/critical-injury-item-builder.mjs";

import { CRITICAL_INJURIES }
    from "../../data/seed/critical-injury-catalog.mjs";


const SEED_PACK_LABEL = "Métro 2033 — Blessures critiques";
const SEED_PACK_NAME = "blessures-critiques";
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
 * Importe (ou met à jour) la table des Blessures critiques
 * (règles p.202) dans un compendium Item du monde courant.
 *
 * Idempotent (flags["metro-2033-yze"].seedKey), même principe
 * que seedFactionCompendium().
 *
 * Utilisation, depuis la console ou un macro Foundry :
 *
 *   await CONFIG.Metro2033.seedCriticalInjuryCompendium();
 *
 * Pour créer/mettre à jour ensuite la RollTable associée
 * (jet de D66 automatique), voir
 * CONFIG.Metro2033.seedCriticalInjuryRollTable().
 *
 * @returns {Promise<{created: number, updated: number, pack: CompendiumCollection}>}
 */
export async function seedCriticalInjuryCompendium() {

    if (!game.user?.isGM) {
        throw new Error(
            "Métro 2033 | Seul le MJ peut importer les Blessures critiques."
        );
    }

    const pack = await getOrCreateSeedPack();

    const itemsData = buildAllCriticalInjuryItemsData(CRITICAL_INJURIES);

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
        "Métro 2033 | Import des Blessures critiques :",
        `${toCreate.length} créée(s), ${toUpdate.length} mise(s) à jour`
    );

    ui.notifications?.info(
        `Métro 2033 — Blessures critiques : ${toCreate.length} créée(s), `
        + `${toUpdate.length} mise(s) à jour dans « ${SEED_PACK_LABEL} ».`
    );

    return {
        created: toCreate.length,
        updated: toUpdate.length,
        pack
    };
}
