import test from "node:test";
import assert from "node:assert/strict";

import {
    buildFactionItemData,
    buildAllFactionItemsData
} from "../../../src/data/seed/faction-item-builder.mjs";

import { FACTIONS } from "../../../src/data/seed/faction-catalog.mjs";


test("le catalogue contient 16 Factions, dont les 4 grandes factions", () => {

    assert.equal(FACTIONS.length, 16);

    const names = FACTIONS.map((faction) => faction.name);
    assert.ok(names.includes("Polis"));
    assert.ok(names.includes("La Hanse"));
    assert.ok(names.includes("La Ligne Rouge (la Krasnaya)"));
    assert.ok(names.includes("Le Quatrième Reich"));
});


test("buildFactionItemData — Polis conforme (type, description, leader)", () => {

    const entry = FACTIONS.find((faction) => faction.key === "faction-polis");
    const data = buildFactionItemData(entry);

    assert.equal(data.type, "faction");
    assert.equal(data.name, "Polis");
    assert.equal(data.system.leader, "Vitaly Misko, président du Conseil");
    assert.match(data.system.description, /brahmanes/);
    assert.deepEqual(data.system.relations, []);
    assert.deepEqual(data.system.notableMembers, []);
});


test("buildAllFactionItemsData — un seedKey unique par Faction", () => {

    const items = buildAllFactionItemsData(FACTIONS);

    assert.equal(items.length, FACTIONS.length);

    const seedKeys = items.map((item) => item.flags["metro-2033-yze"].seedKey);
    assert.equal(new Set(seedKeys).size, seedKeys.length);
});
