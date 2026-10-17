/**
 * Transforme les entrées du catalogue d'équipement
 * (equipment-catalog.mjs) en données d'Item Foundry
 * conformes aux DataModels du système (weapon, armor,
 * ammunition, consumable).
 *
 * Fonctions pures : aucune dépendance à `foundry.*`,
 * testables directement avec node:test.
 */

export const DEFAULT_ITEM_IMAGE = "icons/svg/item-bag.svg";

const SEED_FLAG_SCOPE = "metro-2033-yze";
const SEED_FLAG_KEY = "seedKey";


export function seedFlags(key) {
    return {
        [SEED_FLAG_SCOPE]: {
            [SEED_FLAG_KEY]: key
        }
    };
}


/**
 * Arme (mêlée ou distance).
 *
 * `category` doit être fournie par l'appelant
 * ("melee" | "ranged"), les deux catalogues étant
 * séparés en amont.
 */
export function buildWeaponItemData(entry, category) {

    return {
        name: entry.name,
        type: "weapon",
        img: entry.img ?? DEFAULT_ITEM_IMAGE,
        flags: seedFlags(entry.key),
        system: {
            category,
            weaponCategory: entry.weaponCategory ?? "",
            grip: entry.grip ?? "1M",
            equipped: false,
            bonus: {
                current: entry.bonusMax ?? 0,
                max: entry.bonusMax ?? 0
            },
            repairable: true,
            damage: entry.damage ?? 0,
            reliability: entry.reliability ?? 0,
            range: entry.range ?? "contact",
            usesAmmunition: entry.usesAmmunition ?? false,
            ammunitionReferenceUuid: "",
            ammunitionType: entry.ammunitionType ?? "",
            allowsMilitaryAmmunition: entry.allowsMilitaryAmmunition ?? false,
            magazine: {
                loaded: false,
                ammoType: "",
                consumptionMode: "container",
                containerType: "magazine",
                quality: "standard",
                protectionReduction: 0,
                ignoresResilience: false,
                sourceAmmoItemId: ""
            },
            weight: entry.weight ?? 0,
            automatic: entry.automatic ?? false,
            heavy: entry.heavy ?? false,
            explosive: entry.explosive ?? false,
            explosionPower: entry.explosionPower ?? 0,
            price: {
                buy: entry.priceBuy ?? 0,
                sell: entry.priceSell ?? 0
            },
            description: entry.description ?? "",
            special: entry.special ?? "",
            gmNotes: ""
        }
    };
}


export function buildMeleeWeaponItemData(entry) {
    return buildWeaponItemData(entry, "melee");
}


export function buildRangedWeaponItemData(entry) {
    return buildWeaponItemData(entry, "ranged");
}


/**
 * Protection (armure ou casque).
 */
export function buildArmorItemData(entry) {

    return {
        name: entry.name,
        type: "armor",
        img: entry.img ?? DEFAULT_ITEM_IMAGE,
        flags: seedFlags(entry.key),
        system: {
            category: entry.category ?? "body",
            equipped: false,
            protection: {
                current: entry.protectionMax ?? 0,
                max: entry.protectionMax ?? 0
            },
            resilience: entry.resilience ?? false,
            resilienceLost: false,
            weight: entry.weight ?? 0,
            modifiers: {
                agility: entry.modifiers?.agility ?? 0,
                observation: entry.modifiers?.observation ?? 0
            },
            price: {
                buy: entry.priceBuy ?? 0,
                sell: entry.priceSell ?? 0
            },
            description: entry.description ?? "",
            gmNotes: "",
            special: entry.special ?? ""
        }
    };
}


/**
 * Munition.
 */
export function buildAmmunitionItemData(entry) {

    return {
        name: entry.name,
        type: "ammunition",
        img: entry.img ?? DEFAULT_ITEM_IMAGE,
        flags: seedFlags(entry.key),
        system: {
            ammoType: entry.ammoType ?? "",
            containerType: entry.containerType ?? "magazine",
            consumptionMode: entry.consumptionMode ?? "container",
            quantity: entry.quantity ?? 1,
            compatibleWeaponTypes: entry.compatibleWeaponTypes ?? [],
            quality: entry.quality ?? "standard",
            protectionReduction: entry.protectionReduction ?? 0,
            ignoresResilience: entry.ignoresResilience ?? false,
            weight: entry.weight ?? 0,
            price: {
                buy: entry.priceBuy ?? 0,
                sell: entry.priceSell ?? 0
            },
            description: entry.description ?? "",
            special: entry.special ?? "",
            gmNotes: ""
        }
    };
}


/**
 * Consommable (objet à quantité/doses : explosifs posés,
 * trousses, vestiges...).
 */
export function buildConsumableItemData(entry) {

    return {
        name: entry.name,
        type: "consumable",
        img: entry.img ?? DEFAULT_ITEM_IMAGE,
        flags: seedFlags(entry.key),
        system: {
            quantity: {
                current: entry.quantity ?? 1,
                max: entry.quantity ?? 1
            },
            unitLabel: entry.unitLabel ?? "unités",
            weight: entry.weight ?? 0,
            price: {
                buy: entry.priceBuy ?? 0,
                sell: entry.priceSell ?? 0
            },
            description: entry.description ?? "",
            special: entry.special ?? "",
            gmNotes: ""
        }
    };
}


/**
 * Construit la liste complète des données d'Item
 * à partir de l'ensemble du catalogue.
 *
 * @param {object} catalog
 * @param {object[]} catalog.meleeWeapons
 * @param {object[]} catalog.rangedWeapons
 * @param {object[]} catalog.armors
 * @param {object[]} catalog.ammunition
 * @param {object[]} catalog.consumables
 * @param {object[]} catalog.relics
 */
export function buildAllEquipmentItemsData(catalog) {

    const {
        meleeWeapons = [],
        rangedWeapons = [],
        armors = [],
        ammunition = [],
        consumables = [],
        relics = []
    } = catalog;

    return [
        ...meleeWeapons.map(buildMeleeWeaponItemData),
        ...rangedWeapons.map(buildRangedWeaponItemData),
        ...armors.map(buildArmorItemData),
        ...ammunition.map(buildAmmunitionItemData),
        ...consumables.map(buildConsumableItemData),
        ...relics.map(buildConsumableItemData)
    ];
}
