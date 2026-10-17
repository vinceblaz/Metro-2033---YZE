import test from "node:test";
import assert from "node:assert/strict";

import {
    buildPsychologicalTraumaItemData,
    buildAllPsychologicalTraumaItemsData,
    psychologicalTraumaSeedKey
} from "../../../src/data/seed/psychological-trauma-item-builder.mjs";

import { PSYCHOLOGICAL_TRAUMAS } from "../../../src/data/seed/psychological-trauma-catalog.mjs";


test("la table contient les 17 traumatismes couvrant l'intégralité de la plage D66 (11 à 66)", () => {

    assert.equal(PSYCHOLOGICAL_TRAUMAS.length, 17);

    const covered = new Set();
    for (const entry of PSYCHOLOGICAL_TRAUMAS) {
        for (let value = entry.min; value <= entry.max; value += 1) {
            covered.add(value);
        }
    }

    const expected = [
        11, 12, 13, 14, 15, 16,
        21, 22, 23, 24, 25, 26,
        31, 32, 33, 34, 35, 36,
        41, 42, 43, 44, 45, 46,
        51, 52, 53, 54, 55, 56,
        61, 62, 63, 64, 65, 66
    ];

    for (const value of expected) {
        assert.ok(covered.has(value), `résultat D66 ${value} non couvert par la table des Traumatismes`);
    }
});


test("buildPsychologicalTraumaItemData — Tremblements (11-16)", () => {

    const entry = PSYCHOLOGICAL_TRAUMAS.find((trauma) => trauma.name === "Tremblements");
    const data = buildPsychologicalTraumaItemData(entry);

    assert.equal(data.type, "psychologicalTrauma");
    assert.equal(data.system.d66.min, 11);
    assert.equal(data.system.d66.max, 16);
    assert.equal(data.system.recoveryFormula, "1d6");
    assert.equal(data.system.permanent, false);
});


test("buildPsychologicalTraumaItemData — Cheveux blancs (21) et Personnalité altérée (61-62) sont permanents", () => {

    const cheveuxBlancs = buildPsychologicalTraumaItemData(
        PSYCHOLOGICAL_TRAUMAS.find((trauma) => trauma.name === "Cheveux blancs")
    );
    assert.equal(cheveuxBlancs.system.permanent, true);
    assert.equal(cheveuxBlancs.system.recoveryFormula, "");

    const personnaliteAlteree = buildPsychologicalTraumaItemData(
        PSYCHOLOGICAL_TRAUMAS.find((trauma) => trauma.name === "Personnalité altérée")
    );
    assert.equal(personnaliteAlteree.system.d66.min, 61);
    assert.equal(personnaliteAlteree.system.d66.max, 62);
    assert.equal(personnaliteAlteree.system.permanent, true);
});


test("buildPsychologicalTraumaItemData — Infarctus (66) : seule mort instantanée de la table", () => {

    const infarctus = buildPsychologicalTraumaItemData(
        PSYCHOLOGICAL_TRAUMAS.find((trauma) => trauma.name === "Infarctus")
    );
    assert.equal(infarctus.system.instantDeath, true);

    const others = PSYCHOLOGICAL_TRAUMAS.filter((trauma) => trauma.name !== "Infarctus");
    for (const entry of others) {
        const data = buildPsychologicalTraumaItemData(entry);
        assert.equal(data.system.instantDeath, false, `${entry.name} ne doit pas être une mort instantanée`);
    }
});


test("psychologicalTraumaSeedKey / buildAllPsychologicalTraumaItemsData — un seedKey unique par traumatisme", () => {

    const items = buildAllPsychologicalTraumaItemsData(PSYCHOLOGICAL_TRAUMAS);

    assert.equal(items.length, PSYCHOLOGICAL_TRAUMAS.length);

    const seedKeys = items.map((item) => item.flags["metro-2033-yze"].seedKey);
    assert.equal(new Set(seedKeys).size, seedKeys.length);
    assert.ok(seedKeys.includes("psychological-trauma-11-16"));
    assert.ok(seedKeys.includes("psychological-trauma-66-66"));
});
