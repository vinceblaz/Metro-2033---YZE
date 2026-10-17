import test from "node:test";
import assert from "node:assert/strict";

import {
    isWeaponModUsable,
    getUsableWeaponModsForWeapon,
    isWeaponModApplicableToItemType,
    canAttachWeaponModToItem
} from "../../../src/domain/rules/weapon-mod.mjs";


test("isWeaponModUsable — aucune ressource requise => toujours usable", () => {

    assert.equal(
        isWeaponModUsable({
            resourceId: "",
            resourceAmount: 1,
            actorResources: {}
        }),
        true
    );

    assert.equal(
        isWeaponModUsable({
            resourceId: "",
            resourceAmount: 5,
            actorResources: { energy: 0 }
        }),
        true
    );

});


test("isWeaponModUsable — ressource requise et suffisante => usable", () => {

    assert.equal(
        isWeaponModUsable({
            resourceId: "energy",
            resourceAmount: 1,
            actorResources: { energy: 3 }
        }),
        true
    );

    assert.equal(
        isWeaponModUsable({
            resourceId: "energy",
            resourceAmount: 2,
            actorResources: { energy: 2 }
        }),
        true
    );

});


test("isWeaponModUsable — ressource requise et insuffisante => non usable", () => {

    assert.equal(
        isWeaponModUsable({
            resourceId: "energy",
            resourceAmount: 2,
            actorResources: { energy: 1 }
        }),
        false
    );

    assert.equal(
        isWeaponModUsable({
            resourceId: "energy",
            resourceAmount: 1,
            actorResources: { energy: 0 }
        }),
        false
    );

});


test("isWeaponModUsable — ressource manquante de actorResources (undefined) => non usable si requise", () => {

    assert.equal(
        isWeaponModUsable({
            resourceId: "energy",
            resourceAmount: 1,
            actorResources: {}
        }),
        false
    );

    assert.equal(
        isWeaponModUsable({
            resourceId: "energy",
            resourceAmount: 1,
            actorResources: undefined
        }),
        false
    );

});


test("getUsableWeaponModsForWeapon — filtre par arme (plusieurs mods, certains attachés à une autre arme)", () => {

    const weaponMods = [
        {
            id: "mod1",
            uuid: "Actor.a1.Item.mod1",
            name: "Silencieux",
            description: "Effet silencieux.",
            resourceId: "",
            resourceAmount: 1,
            attachedItemUuid: "Actor.a1.Item.weaponA"
        },
        {
            id: "mod2",
            uuid: "Actor.a1.Item.mod2",
            name: "Pointeur laser",
            description: "Effet pointeur laser.",
            resourceId: "energy",
            resourceAmount: 1,
            attachedItemUuid: "Actor.a1.Item.weaponB"
        }
    ];

    const result = getUsableWeaponModsForWeapon({
        weaponUuid: "Actor.a1.Item.weaponA",
        weaponMods,
        actorResources: { energy: 5 }
    });

    assert.equal(result.length, 1);
    assert.equal(result[0].id, "mod1");
    assert.equal(result[0].name, "Silencieux");
    assert.equal(result[0].description, "Effet silencieux.");
    assert.equal(result[0].resourceId, "");
    assert.equal(result[0].resourceAmount, 1);
    assert.equal(result[0].attachedItemUuid, undefined);

});


test("getUsableWeaponModsForWeapon — exclut un mod attaché mais dont la ressource est insuffisante", () => {

    const weaponMods = [
        {
            id: "mod-laser",
            uuid: "Actor.a1.Item.mod-laser",
            name: "Pointeur laser",
            description: "Effet pointeur laser.",
            resourceId: "energy",
            resourceAmount: 2,
            attachedItemUuid: "Actor.a1.Item.weaponA"
        }
    ];

    const result = getUsableWeaponModsForWeapon({
        weaponUuid: "Actor.a1.Item.weaponA",
        weaponMods,
        actorResources: { energy: 1 }
    });

    assert.deepEqual(result, []);

});


test("getUsableWeaponModsForWeapon — un mod non attaché (attachedItemUuid vide) est exclu même s'il serait usable", () => {

    const weaponMods = [
        {
            id: "mod-libre",
            uuid: "Actor.a1.Item.mod-libre",
            name: "Bipied",
            description: "Effet bipied.",
            resourceId: "",
            resourceAmount: 1,
            attachedItemUuid: ""
        }
    ];

    const result = getUsableWeaponModsForWeapon({
        weaponUuid: "Actor.a1.Item.weaponA",
        weaponMods,
        actorResources: {}
    });

    assert.deepEqual(result, []);

});


test("getUsableWeaponModsForWeapon — valeurs par défaut quand aucun mod ni ressource n'est fourni", () => {

    assert.deepEqual(
        getUsableWeaponModsForWeapon({
            weaponUuid: "Actor.a1.Item.weaponA"
        }),
        []
    );

});


test("isWeaponModApplicableToItemType — compatible lorsque le type est déclaré", () => {

    assert.equal(
        isWeaponModApplicableToItemType({
            applicableTypes: ["weapon"],
            itemType: "weapon"
        }),
        true
    );

    assert.equal(
        isWeaponModApplicableToItemType({
            applicableTypes: ["weapon", "armor"],
            itemType: "armor"
        }),
        true
    );

});


test("isWeaponModApplicableToItemType — incompatible lorsque le type n'est pas déclaré", () => {

    assert.equal(
        isWeaponModApplicableToItemType({
            applicableTypes: ["weapon"],
            itemType: "armor"
        }),
        false
    );

});


test("isWeaponModApplicableToItemType — valeurs par défaut (aucun type déclaré) => incompatible", () => {

    assert.equal(
        isWeaponModApplicableToItemType({
            itemType: "weapon"
        }),
        false
    );

    assert.equal(
        isWeaponModApplicableToItemType({
            applicableTypes: undefined,
            itemType: "weapon"
        }),
        false
    );

});


test("canAttachWeaponModToItem — quota non atteint => autorisé", () => {

    assert.equal(
        canAttachWeaponModToItem({
            currentlyAttachedCount: 0,
            weaponModSlots: 2
        }),
        true
    );

    assert.equal(
        canAttachWeaponModToItem({
            currentlyAttachedCount: 1,
            weaponModSlots: 2
        }),
        true
    );

});


test("canAttachWeaponModToItem — quota atteint ou dépassé => refusé", () => {

    assert.equal(
        canAttachWeaponModToItem({
            currentlyAttachedCount: 2,
            weaponModSlots: 2
        }),
        false
    );

    assert.equal(
        canAttachWeaponModToItem({
            currentlyAttachedCount: 3,
            weaponModSlots: 2
        }),
        false
    );

});


test("canAttachWeaponModToItem — aucun emplacement configuré (0) => toujours refusé", () => {

    assert.equal(
        canAttachWeaponModToItem({
            currentlyAttachedCount: 0,
            weaponModSlots: 0
        }),
        false
    );

});


test("canAttachWeaponModToItem — valeurs par défaut (aucun paramètre) => refusé", () => {

    assert.equal(
        canAttachWeaponModToItem(),
        false
    );

});
