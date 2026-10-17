import test from "node:test";
import assert from "node:assert/strict";

import {
    resolveEquipmentContextFromSources
} from "../../../src/domain/rules/equipment-affliction-source.mjs";


const items = {
    knife: { id: "knife", uuid: "Actor.a.Item.knife", name: "Couteau", type: "weapon" },
    torch: { id: "torch", uuid: "Actor.a.Item.torch", name: "Lampe", type: "equipment" }
};

const find = id => items[id] ?? null;


test("Retrouve l'arme cochée qui a fourni des dés", () => {

    const context = resolveEquipmentContextFromSources(
        [
            { selected: true, type: "weapon", bonus: 2, metadata: { itemId: "knife" } }
        ],
        find
    );

    assert.deepEqual(context, {
        itemId: "knife",
        itemUuid: "Actor.a.Item.knife",
        itemName: "Couteau",
        itemType: "weapon"
    });

});


test("Ignore une source non cochée, sans dé, d'un autre type ou sans Item", () => {

    const sources = [
        { selected: false, type: "weapon", bonus: 2, metadata: { itemId: "knife" } },
        { selected: true, type: "weapon", bonus: 0, metadata: { itemId: "knife" } },
        { selected: true, type: "talent", bonus: 1, metadata: { itemId: "knife" } },
        { selected: true, type: "weapon", bonus: 1, metadata: { itemId: "absent" } },
        { selected: true, type: "weapon", bonus: 1, metadata: {} }
    ];

    assert.equal(resolveEquipmentContextFromSources(sources, find), null);

});


test("Plusieurs sources : la première retenue gagne", () => {

    const context = resolveEquipmentContextFromSources(
        [
            { selected: true, type: "equipment", bonus: 1, metadata: { itemId: "torch" } },
            { selected: true, type: "weapon", bonus: 2, metadata: { itemId: "knife" } }
        ],
        find
    );

    assert.equal(context.itemId, "torch");

});


test("Entrées invalides : null", () => {

    assert.equal(resolveEquipmentContextFromSources(undefined, find), null);
    assert.equal(resolveEquipmentContextFromSources([], find), null);
    assert.equal(resolveEquipmentContextFromSources([{}], null), null);

});
