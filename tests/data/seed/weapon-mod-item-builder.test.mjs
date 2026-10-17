import test from "node:test";
import assert from "node:assert/strict";

import {
    buildWeaponModItemData,
    buildAllWeaponModItemsData,
    DEFAULT_ITEM_IMAGE
} from "../../../src/data/seed/weapon-mod-item-builder.mjs";

import {
    WEAPON_MODS
} from "../../../src/data/seed/weapon-mod-catalog.mjs";


test("buildWeaponModItemData — Bipied (sans ressource) produit un Item weaponMod conforme", () => {

    const entry = WEAPON_MODS.find((item) => item.key === "improvement-bipied");
    const data = buildWeaponModItemData(entry);

    assert.equal(data.name, "Amélioration d'arme — Bipied");
    assert.equal(data.type, "weaponMod");
    assert.equal(data.img, DEFAULT_ITEM_IMAGE);
    assert.equal(data.flags["metro-2033-yze"].seedKey, "improvement-bipied");

    assert.equal(data.system.attachedItemUuid, "");
    assert.deepEqual(data.system.applicableTypes, ["weapon"]);
    assert.equal(data.system.resource.id, "");
    assert.equal(data.system.resource.amount, 1);
    assert.equal(data.system.weight, 0);
    assert.match(data.system.description, /surveillance/);
    assert.equal(data.system.gmNotes, "");
});


test("buildWeaponModItemData — Pointeur laser nécessite 1 point d'Énergie", () => {

    const entry = WEAPON_MODS.find((item) => item.key === "improvement-pointeur-laser");
    const data = buildWeaponModItemData(entry);

    assert.match(data.name, /Vestige/);
    assert.match(data.system.description, /Vestige — non fabricable/);
    assert.equal(data.system.resource.id, "energy");
    assert.equal(data.system.resource.amount, 1);
});


test("buildWeaponModItemData — Système de vision nocturne nécessite de l'Énergie", () => {

    const entry = WEAPON_MODS.find((item) => item.key === "improvement-vision-nocturne");
    const data = buildWeaponModItemData(entry);

    assert.equal(data.system.resource.id, "energy");
});


test("buildWeaponModItemData — Viseur point rouge nécessite de l'Énergie", () => {

    const entry = WEAPON_MODS.find((item) => item.key === "improvement-viseur-point-rouge");
    const data = buildWeaponModItemData(entry);

    assert.equal(data.system.resource.id, "energy");
});


test("buildAllWeaponModItemsData — agrège les 11 Améliorations d'arme sans doublon de clé, 3 nécessitant de l'Énergie", () => {

    const items = buildAllWeaponModItemsData({
        weaponMods: WEAPON_MODS
    });

    assert.equal(items.length, 11);
    assert.equal(items.length, WEAPON_MODS.length);

    const seedKeys = items.map(
        (item) => item.flags["metro-2033-yze"].seedKey
    );

    assert.equal(
        new Set(seedKeys).size,
        seedKeys.length,
        "chaque Item importé doit avoir une seedKey unique"
    );

    for (const item of items) {
        assert.equal(item.type, "weaponMod");
        assert.ok(item.name, "chaque Item doit avoir un nom");
        assert.ok(item.system, "chaque Item doit avoir des données system");
    }

    const withEnergy = items.filter(
        (item) => item.system.resource.id === "energy"
    );

    assert.equal(withEnergy.length, 3);

    for (const item of items) {
        assert.deepEqual(
            item.system.applicableTypes,
            ["weapon"],
            "chaque Amélioration d'arme du livre doit être applicableTypes: ['weapon']"
        );
    }
});


test("buildAllWeaponModItemsData — retourne un tableau vide si aucun catalogue n'est fourni", () => {

    assert.deepEqual(buildAllWeaponModItemsData({}), []);
});
