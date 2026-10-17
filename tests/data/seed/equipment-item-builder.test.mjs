import test from "node:test";
import assert from "node:assert/strict";

import {
    buildMeleeWeaponItemData,
    buildRangedWeaponItemData,
    buildArmorItemData,
    buildAmmunitionItemData,
    buildConsumableItemData,
    buildAllEquipmentItemsData,
    DEFAULT_ITEM_IMAGE
} from "../../../src/data/seed/equipment-item-builder.mjs";

import {
    MELEE_WEAPONS,
    RANGED_WEAPONS,
    ARMORS,
    AMMUNITION,
    CONSUMABLES,
    RELICS
} from "../../../src/data/seed/equipment-catalog.mjs";


test("buildMeleeWeaponItemData — Couteau produit un Item weapon conforme", () => {

    const entry = MELEE_WEAPONS.find((item) => item.key === "melee-couteau");
    const data = buildMeleeWeaponItemData(entry);

    assert.equal(data.name, "Couteau");
    assert.equal(data.type, "weapon");
    assert.equal(data.img, DEFAULT_ITEM_IMAGE);
    assert.equal(data.flags["metro-2033-yze"].seedKey, "melee-couteau");

    assert.equal(data.system.category, "melee");
    assert.equal(data.system.grip, "1M");
    assert.equal(data.system.bonus.current, 1);
    assert.equal(data.system.bonus.max, 1);
    assert.equal(data.system.damage, 2);
    assert.equal(data.system.reliability, 2);
    assert.equal(data.system.range, "contact");
    assert.equal(data.system.weight, 0.5);
    assert.equal(data.system.usesAmmunition, false);
});


test("buildRangedWeaponItemData — Fusil d'assaut produit un Item weapon ranged conforme", () => {

    const entry = RANGED_WEAPONS.find((item) => item.key === "ranged-fusil-assaut");
    const data = buildRangedWeaponItemData(entry);

    assert.equal(data.system.category, "ranged");
    assert.equal(data.system.weaponCategory, "assaultRifle");
    assert.equal(data.system.automatic, true);
    assert.equal(data.system.usesAmmunition, true);
    assert.equal(data.system.ammunitionType, "assaultRifleStandard");
    assert.equal(data.system.allowsMilitaryAmmunition, true);
    assert.equal(data.system.range, "long");
    assert.equal(data.system.bonus.max, 2);
});


test("buildRangedWeaponItemData — Grenade est bien explosive avec sa puissance", () => {

    const entry = RANGED_WEAPONS.find((item) => item.key === "ranged-grenade");
    const data = buildRangedWeaponItemData(entry);

    assert.equal(data.system.explosive, true);
    assert.equal(data.system.explosionPower, 6);
    assert.equal(data.system.damage, 6);
    assert.equal(data.system.usesAmmunition, false);
});


test("buildArmorItemData — Gilet pare-balles conforme (résilience, Protection 4)", () => {

    const entry = ARMORS.find((item) => item.key === "armor-gilet-pare-balles");
    const data = buildArmorItemData(entry);

    assert.equal(data.type, "armor");
    assert.equal(data.system.category, "body");
    assert.equal(data.system.protection.current, 4);
    assert.equal(data.system.protection.max, 4);
    assert.equal(data.system.resilience, true);
});


test("buildArmorItemData — Tenue antiémeute reporte son malus d'Agilité", () => {

    const entry = ARMORS.find((item) => item.key === "armor-tenue-antiemeute");
    const data = buildArmorItemData(entry);

    assert.equal(data.system.protection.max, 6);
    assert.equal(data.system.modifiers.agility, -1);
    assert.equal(data.system.weight, 1);
});


test("buildAmmunitionItemData — munition standard Pistolet conforme", () => {

    const entry = AMMUNITION.find((item) => item.key === "ammo-pistol-standard");
    const data = buildAmmunitionItemData(entry);

    assert.equal(data.type, "ammunition");
    assert.equal(data.system.ammoType, "pistolStandard");
    assert.equal(data.system.consumptionMode, "container");
    assert.deepEqual(data.system.compatibleWeaponTypes, ["pistol"]);
});


test("buildConsumableItemData — Trousse de soins conforme", () => {

    const entry = CONSUMABLES.find((item) => item.key === "cons-trousse-de-soins");
    const data = buildConsumableItemData(entry);

    assert.equal(data.type, "consumable");
    assert.equal(data.system.quantity.current, 1);
    assert.equal(data.system.quantity.max, 1);
    assert.equal(data.system.unitLabel, "trousses");
});


test("buildConsumableItemData — un Vestige porte la note de troc générique", () => {

    const entry = RELICS.find((item) => item.key === "relic-roman");
    assert.ok(entry, "l'entrée 'Roman' doit exister dans le catalogue des Vestiges");

    const data = buildConsumableItemData(entry);

    assert.equal(data.type, "consumable");
    assert.match(data.system.special, /Vestige de l'Ancien Monde/);
    assert.equal(data.system.weight, 0);
});


test("buildAmmunitionItemData — variante qualité militaire conforme", () => {

    const entry = AMMUNITION.find((item) => item.key === "ammo-assault-rifle-military");
    const data = buildAmmunitionItemData(entry);

    assert.equal(data.system.quality, "military");
    assert.equal(data.system.protectionReduction, 2);
    assert.equal(data.system.ignoresResilience, true);
    assert.deepEqual(data.system.compatibleWeaponTypes, ["assaultRifle"]);
});


test("buildAllEquipmentItemsData — agrège l'ensemble du catalogue sans doublon de clé", () => {

    const items = buildAllEquipmentItemsData({
        meleeWeapons: MELEE_WEAPONS,
        rangedWeapons: RANGED_WEAPONS,
        armors: ARMORS,
        ammunition: AMMUNITION,
        consumables: CONSUMABLES,
        relics: RELICS
    });

    const expectedCount =
        MELEE_WEAPONS.length
        + RANGED_WEAPONS.length
        + ARMORS.length
        + AMMUNITION.length
        + CONSUMABLES.length
        + RELICS.length;

    assert.equal(items.length, expectedCount);

    const seedKeys = items.map(
        (item) => item.flags["metro-2033-yze"].seedKey
    );

    assert.equal(
        new Set(seedKeys).size,
        seedKeys.length,
        "chaque Item importé doit avoir une seedKey unique"
    );

    for (const item of items) {
        assert.ok(item.name, "chaque Item doit avoir un nom");
        assert.ok(item.type, "chaque Item doit avoir un type");
        assert.ok(item.system, "chaque Item doit avoir des données system");
    }
});
