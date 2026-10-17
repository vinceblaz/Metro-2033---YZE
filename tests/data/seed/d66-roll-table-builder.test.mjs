import test from "node:test";
import assert from "node:assert/strict";

import {
    D66_FORMULA,
    buildDocumentRollTableResultData,
    buildCriticalInjuryRollTableResultsData,
    buildPsychologicalTraumaRollTableResultsData
} from "../../../src/data/seed/d66-roll-table-builder.mjs";

import { CRITICAL_INJURIES } from "../../../src/data/seed/critical-injury-catalog.mjs";
import { PSYCHOLOGICAL_TRAUMAS } from "../../../src/data/seed/psychological-trauma-catalog.mjs";


test("D66_FORMULA simule bien deux D6 (dizaines puis unités)", () => {
    assert.equal(D66_FORMULA, "(1d6 * 10) + 1d6");
});


test("buildDocumentRollTableResultData — construit un résultat de type document valide", () => {

    const result = buildDocumentRollTableResultData({
        range: [11, 11],
        documentUuid: "Compendium.world.blessures-critiques.Item.abc123"
    });

    assert.equal(result.type, "document");
    assert.deepEqual(result.range, [11, 11]);
    assert.equal(result.documentUuid, "Compendium.world.blessures-critiques.Item.abc123");
    assert.equal(result.weight, 1);
    assert.equal(result.drawn, false);
});


test("buildDocumentRollTableResultData — exige un documentUuid non vide", () => {
    assert.throws(() => buildDocumentRollTableResultData({ range: [11, 11], documentUuid: "" }));
});


test("buildCriticalInjuryRollTableResultsData — un résultat par entrée, plage [d66, d66]", () => {

    const itemUuidBySeedKey = new Map(
        CRITICAL_INJURIES.map((entry) => [`critical-injury-${entry.d66}`, `uuid-${entry.d66}`])
    );

    const results = buildCriticalInjuryRollTableResultsData(CRITICAL_INJURIES, itemUuidBySeedKey);

    assert.equal(results.length, CRITICAL_INJURIES.length);

    const first = results.find((result) => result.documentUuid === "uuid-11");
    assert.deepEqual(first.range, [11, 11]);
});


test("buildCriticalInjuryRollTableResultsData — échoue si l'UUID d'un Item est manquant", () => {

    const incompleteMap = new Map([["critical-injury-11", "uuid-11"]]);

    assert.throws(() => buildCriticalInjuryRollTableResultsData(CRITICAL_INJURIES, incompleteMap));
});


test("buildPsychologicalTraumaRollTableResultsData — un résultat par traumatisme, plage [min, max]", () => {

    const itemUuidBySeedKey = new Map(
        PSYCHOLOGICAL_TRAUMAS.map((entry) => [`psychological-trauma-${entry.min}-${entry.max}`, `uuid-${entry.min}-${entry.max}`])
    );

    const results = buildPsychologicalTraumaRollTableResultsData(PSYCHOLOGICAL_TRAUMAS, itemUuidBySeedKey);

    assert.equal(results.length, PSYCHOLOGICAL_TRAUMAS.length);

    const tremblements = results.find((result) => result.documentUuid === "uuid-11-16");
    assert.deepEqual(tremblements.range, [11, 16]);
});
