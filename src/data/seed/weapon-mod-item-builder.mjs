/**
 * Transforme les entrées du catalogue des Améliorations d'arme
 * (weapon-mod-catalog.mjs) en données d'Item Foundry conformes
 * au DataModel weaponMod.
 *
 * Fonctions pures : aucune dépendance à `foundry.*`,
 * testables directement avec node:test.
 */

import {
    DEFAULT_ITEM_IMAGE,
    seedFlags
} from "./equipment-item-builder.mjs";


export { DEFAULT_ITEM_IMAGE };


/**
 * Amélioration d'équipement (weaponMod).
 */
export function buildWeaponModItemData(entry) {

    return {
        name: entry.name,
        type: "weaponMod",
        img: entry.img ?? DEFAULT_ITEM_IMAGE,
        flags: seedFlags(entry.key),
        system: {
            attachedItemUuid: "",
            applicableTypes: entry.applicableTypes ?? ["weapon"],
            resource: {
                id: entry.resourceId ?? "",
                amount: entry.resourceAmount ?? 1
            },
            weight: entry.weight ?? 0,
            description: entry.description ?? "",
            gmNotes: ""
        }
    };
}


/**
 * Construit la liste complète des données d'Item weaponMod
 * à partir du catalogue des Améliorations d'arme.
 *
 * @param {object} catalog
 * @param {object[]} catalog.weaponMods
 */
export function buildAllWeaponModItemsData(catalog) {

    const {
        weaponMods = []
    } = catalog;

    return weaponMods.map(buildWeaponModItemData);
}
