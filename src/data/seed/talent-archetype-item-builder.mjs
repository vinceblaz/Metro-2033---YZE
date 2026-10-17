/**
 * Transforme les entrées du catalogue Talents/Archétypes
 * (talent-archetype-catalog.mjs) en données d'Item Foundry
 * conformes aux DataModels du système (talent, archetype).
 *
 * Fonctions pures : aucune dépendance à `foundry.*`.
 */

export const DEFAULT_ITEM_IMAGE = "icons/svg/item-bag.svg";

const SEED_FLAG_SCOPE = "metro-2033-yze";
const SEED_FLAG_KEY = "seedKey";


function seedFlags(key) {
    return {
        [SEED_FLAG_SCOPE]: {
            [SEED_FLAG_KEY]: key
        }
    };
}


/**
 * Talent (général ou d'archétype).
 *
 * `entry.mechanicalKey` porte l'identifiant métier stable
 * (`system.key`) : il correspond à une clé déjà implémentée
 * dans `domain/rules/talents.mjs` pour 6 Talents (bonus
 * automatisé) et à une clé générée pour les autres (Talent
 * non automatisé, effet décrit en texte uniquement).
 */
export function buildTalentItemData(entry) {

    return {
        name: entry.name,
        type: "talent",
        img: entry.img ?? DEFAULT_ITEM_IMAGE,
        flags: seedFlags(entry.key),
        system: {
            key: entry.mechanicalKey,
            maxLevel: entry.maxLevel ?? 1,
            level: 1,
            hasAdvancedLevel: (entry.maxLevel ?? 1) >= 2,
            archetypeId: entry.archetypeId ?? "",
            description: entry.description ?? "",
            effect: entry.effect ?? "",
            gmNotes: "",
            configuration: {
                weaponCategory: "",
                weaponType: "",
                skill: "",
                attribute: "",
                custom: ""
            }
        }
    };
}


/**
 * Archétype.
 *
 * Ne porte que ce que le schéma prévoit (key, configuration,
 * description, gmNotes) : les règles canoniques (attribut,
 * compétences, talents, choix du Soldat) restent dans
 * `domain/rules/archetypes.mjs`. Le texte de présentation,
 * les Talents d'archétype et l'équipement de départ du livre
 * sont regroupés ici dans `description`, à titre de référence
 * pour le joueur/MJ.
 */
export function buildArchetypeItemData(entry) {

    const description = [
        `<p>${entry.flavor}</p>`,
        `<p><strong>Attribut d'archétype :</strong> ${entry.attribute}</p>`,
        `<p><strong>Compétences d'archétype :</strong> ${entry.skills}</p>`,
        `<p><strong>Talents d'archétype :</strong> ${entry.talents}</p>`,
        `<p><strong>Équipement de départ :</strong> ${entry.startingEquipment}</p>`
    ].join("");

    return {
        name: entry.name,
        type: "archetype",
        img: entry.img ?? DEFAULT_ITEM_IMAGE,
        flags: seedFlags(entry.key),
        system: {
            key: entry.key,
            configuration: {
                attribute: "",
                skill: ""
            },
            description,
            gmNotes: ""
        }
    };
}


/**
 * Construit la liste complète des données d'Item Talent
 * et Archétype à partir de l'ensemble du catalogue.
 *
 * @param {object} catalog
 * @param {object[]} catalog.generalTalents
 * @param {object[]} catalog.archetypeTalents
 * @param {object[]} catalog.archetypes
 */
export function buildAllTalentArchetypeItemsData(catalog) {

    const {
        generalTalents = [],
        archetypeTalents = [],
        archetypes = []
    } = catalog;

    return [
        ...generalTalents.map(buildTalentItemData),
        ...archetypeTalents.map(buildTalentItemData),
        ...archetypes.map(buildArchetypeItemData)
    ];
}
