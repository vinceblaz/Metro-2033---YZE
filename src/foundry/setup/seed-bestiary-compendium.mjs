import { buildAllBestiaryActorsData }
    from "../../data/seed/bestiary-actor-builder.mjs";

import { CREATURES }
    from "../../data/seed/creature-catalog.mjs";

import { BESTIARY_NPCS }
    from "../../data/seed/bestiary-npc-catalog.mjs";


const SEED_PACK_LABEL = "Métro 2033 — Bestiaire";
const SEED_PACK_NAME = "bestiaire";
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
 * Importe (ou met à jour) le bestiaire (Créatures + PNJ notables
 * du chapitre Monstres) dans un compendium Actor du monde
 * courant.
 *
 * Idempotent (flags["metro-2033-yze"].seedKey), sur le même
 * principe que seedEquipmentCompendium() /
 * seedTalentArchetypeCompendium(). Attention : contrairement à
 * ces deux-là, chaque Actor importé embarque ses propres Items
 * (attaques, armure, Talents) ; une mise à jour remplace donc
 * l'Actor existant (ses Items embarqués sont régénérés).
 *
 * Utilisation, depuis la console ou un macro Foundry :
 *
 *   await CONFIG.Metro2033.seedBestiaryCompendium();
 *
 * @returns {Promise<{created: number, updated: number, pack: CompendiumCollection}>}
 */
export async function seedBestiaryCompendium() {

    if (!game.user?.isGM) {
        throw new Error(
            "Métro 2033 | Seul le MJ peut importer le bestiaire."
        );
    }

    const pack = await getOrCreateSeedPack();

    const actorsData = buildAllBestiaryActorsData({
        creatures: CREATURES,
        npcs: BESTIARY_NPCS
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

    /*
     * Actor.updateDocuments ne régénère pas les Items embarqués
     * d'un document existant : on supprime puis recrée les
     * entrées déjà connues pour garantir un bestiaire toujours
     * fidèle au catalogue (armes/Talents mis à jour compris).
     */
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
        "Métro 2033 | Import du bestiaire :",
        `${toCreate.length} créé(s), ${toUpdate.length} remplacé(s)`
    );

    ui.notifications?.info(
        `Métro 2033 — Bestiaire : ${toCreate.length} Actor(s) créé(s), `
        + `${toUpdate.length} remplacé(s) dans « ${SEED_PACK_LABEL} ».`
    );

    return {
        created: toCreate.length,
        updated: toUpdate.length,
        pack
    };
}
