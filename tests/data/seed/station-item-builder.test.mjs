import test from "node:test";
import assert from "node:assert/strict";

import {
    buildStationItemData,
    buildAllStationItemsData
} from "../../../src/data/seed/station-item-builder.mjs";

import { STATIONS } from "../../../src/data/seed/station-catalog.mjs";


test("le catalogue contient les 3 Stations du chapitre « Station de départ »", () => {

    assert.equal(STATIONS.length, 3);

    const names = STATIONS.map((station) => station.name);
    assert.ok(names.includes("Petchatniki"));
    assert.ok(names.includes("Doubrovka"));
    assert.ok(names.includes("Kojoukhovskaya"));
});


test("buildStationItemData — Petchatniki conforme (type, population, ressources)", () => {

    const entry = STATIONS.find((station) => station.key === "station-petchatniki");
    const data = buildStationItemData(entry);

    assert.equal(data.type, "station");
    assert.equal(data.name, "Petchatniki");
    assert.equal(data.system.population.level, 4);
    assert.equal(data.system.population.members, 343);
    assert.equal(data.system.resources.water, 7);
    assert.equal(data.system.resources.food, 5);
    assert.equal(data.system.controllingFaction, "");
    assert.deepEqual(data.system.notableNPCs, []);
    assert.match(data.system.description, /Mamouchka/);
});


test("buildStationItemData — les connexions déclarées sont reprises telles quelles", () => {

    const entry = STATIONS.find((station) => station.key === "station-kojoukhovskaya");
    const data = buildStationItemData(entry);

    assert.equal(data.system.connections.length, 2);
    assert.match(data.system.connections[0].description, /Petchatniki/);
});


test("buildAllStationItemsData — un seedKey unique par Station", () => {

    const items = buildAllStationItemsData(STATIONS);

    assert.equal(items.length, STATIONS.length);

    const seedKeys = items.map((item) => item.flags["metro-2033-yze"].seedKey);
    assert.equal(new Set(seedKeys).size, seedKeys.length);
});
