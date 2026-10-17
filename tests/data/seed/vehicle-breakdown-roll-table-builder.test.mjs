import test from "node:test";
import assert from "node:assert/strict";

import {
    D6_FORMULA,
    buildTextRollTableResultData,
    buildVehicleBreakdownRollTableResultsData
} from "../../../src/data/seed/vehicle-breakdown-roll-table-builder.mjs";

import { VEHICLE_BREAKDOWN_RESULTS } from "../../../src/data/seed/vehicle-breakdown-catalog.mjs";


test("D6_FORMULA simule un simple D6", () => {
    assert.equal(D6_FORMULA, "1d6");
});


test("buildTextRollTableResultData — construit un résultat de type texte valide", () => {

    const result = buildTextRollTableResultData({
        range: [1, 1],
        text: "Conducteur touché — ..."
    });

    assert.equal(result.type, "text");
    assert.equal(result.text, "Conducteur touché — ...");
    assert.deepEqual(result.range, [1, 1]);
    assert.equal(result.weight, 1);
    assert.equal(result.drawn, false);
});


test("buildTextRollTableResultData — exige un range [min, max] d'entiers valides", () => {
    assert.throws(() => buildTextRollTableResultData({ range: [2, 1], text: "x" }), TypeError);
    assert.throws(() => buildTextRollTableResultData({ range: [1], text: "x" }), TypeError);
    assert.throws(() => buildTextRollTableResultData({ text: "x" }), TypeError);
});


test("buildTextRollTableResultData — exige un texte non vide", () => {
    assert.throws(() => buildTextRollTableResultData({ range: [1, 1], text: "" }), TypeError);
    assert.throws(() => buildTextRollTableResultData({ range: [1, 1] }), TypeError);
});


test("buildVehicleBreakdownRollTableResultsData — un résultat par entrée du catalogue, plage [n, n]", () => {

    const results = buildVehicleBreakdownRollTableResultsData(VEHICLE_BREAKDOWN_RESULTS);

    assert.equal(results.length, 6);
    assert.equal(results.length, VEHICLE_BREAKDOWN_RESULTS.length);

    for (const [index, result] of results.entries()) {
        const entry = VEHICLE_BREAKDOWN_RESULTS[index];
        assert.deepEqual(result.range, [entry.range, entry.range]);
        assert.equal(result.type, "text");
        assert.ok(result.text.includes(entry.name));
        assert.ok(result.text.includes(entry.text));
    }
});


test("buildVehicleBreakdownRollTableResultsData — couvre exactement les faces 1 à 6", () => {

    const results = buildVehicleBreakdownRollTableResultsData(VEHICLE_BREAKDOWN_RESULTS);

    const faces = results.map((result) => result.range[0]).sort((a, b) => a - b);

    assert.deepEqual(faces, [1, 2, 3, 4, 5, 6]);
});
