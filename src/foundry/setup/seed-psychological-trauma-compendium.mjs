import { buildAllPsychologicalTraumaItemsData }
    from "../../data/seed/psychological-trauma-item-builder.mjs";

import { PSYCHOLOGICAL_TRAUMAS }
    from "../../data/seed/psychological-trauma-catalog.mjs";


const SEED_PACK_LABEL = "Métro 2033 — Traumatismes psychologiques";
const SEED_PACK_NAME = "traumatismes-psychologiques";
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
 * Importe (ou met à jour) la table des Traumatismes
 * psychologiques (règles p.203) dans un compendium Item du
 * monde courant.
 *
 * Idempotent (flags["metro-2033-yze"].seedKey), même principe
 * que seedFactionCompendium().
 *
 * Utilisation, depuis la console ou un macro Foundry :
 *
 *   await CONFIG.Metro2033.seedPsychologicalTraumaCompendium();
 *
 * Pour créer/mettre à jour ensuite la RollTable associée
 * (jet de D66 automatique), voir
 * CONFIG.Metro2033.seedPsychologicalTraumaRollTable().
 *
 * @returns {Promise<{created: number, updated: number, pack: CompendiumCollection}>}
 */
export async function seedPsychologicalTraumaCompendium() {

    if (!game.user?.isGM) {
        throw new Error(
            "Métro 2033 | Seul le MJ peut importer les Traumatismes psychologiques."
        );
    }

    const pack = await getOrCreateSeedPack();

    const itemsData = buildAllPsychologicalTraumaItemsData(PSYCHOLOGICAL_TRAUMAS);

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
        "Métro 2033 | Import des Traumatismes psychologiques :",
        `${toCreate.length} créé(s), ${toUpdate.length} mis à jour`
    );

    ui.notifications?.info(
        `Métro 2033 — Traumatismes psychologiques : ${toCreate.length} créé(s), `
        + `${toUpdate.length} mis à jour dans « ${SEED_PACK_LABEL} ».`
    );

    return {
        created: toCreate.length,
        updated: toUpdate.length,
        pack
    };
}
