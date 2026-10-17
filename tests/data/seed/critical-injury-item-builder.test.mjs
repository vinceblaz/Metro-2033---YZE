import test from "node:test";
import assert from "node:assert/strict";

import {
    buildCriticalInjuryItemData,
    buildAllCriticalInjuryItemsData,
    criticalInjurySeedKey
} from "../../../src/data/seed/critical-injury-item-builder.mjs";

import { CRITICAL_INJURIES } from "../../../src/data/seed/critical-injury-catalog.mjs";


test("la table contient les 36 résultats D66 (11 à 66)", () => {

    assert.equal(CRITICAL_INJURIES.length, 36);

    const values = CRITICAL_INJURIES.map((entry) => entry.d66);
    assert.equal(new Set(values).size, 36, "aucun doublon de D66");

    assert.ok(values.includes(11));
    assert.ok(values.includes(66));
});


test("buildCriticalInjuryItemData — Essoufflé (11) : bénin, aucun jet de Trépas", () => {

    const entry = CRITICAL_INJURIES.find((injury) => injury.d66 === 11);
    const data = buildCriticalInjuryItemData(entry);

    assert.equal(data.type, "criticalInjury");
    assert.equal(data.name, "Essoufflé");
    assert.equal(data.system.d66, 11);
    assert.equal(data.system.fatal, false);
    assert.equal(data.system.instantDeath, false);
});


test("buildCriticalInjuryItemData — Aorte ouverte (62) : fatale, modificateur -2, délai Round", () => {

    const entry = CRITICAL_INJURIES.find((injury) => injury.d66 === 62);
    const data = buildCriticalInjuryItemData(entry);

    assert.equal(data.system.fatal, true);
    assert.equal(data.system.deathRollModifier, -2);
    assert.equal(data.system.deathRollInterval, "Round");
    assert.equal(data.system.recoveryFormula, "3d6");
});


test("buildCriticalInjuryItemData — Bras sectionné (54) : fatal, permanent, sans formule de rémission", () => {

    const entry = CRITICAL_INJURIES.find((injury) => injury.d66 === 54);
    const data = buildCriticalInjuryItemData(entry);

    assert.equal(data.system.permanent, true);
    assert.equal(data.system.recoveryFormula, "");
});


test("buildCriticalInjuryItemData — Éventré, Crâne broyé, Cœur perforé, Cœur empalé (63-66) : mort instantanée", () => {

    const instantDeathResults = [63, 64, 65, 66];

    for (const d66 of instantDeathResults) {
        const entry = CRITICAL_INJURIES.find((injury) => injury.d66 === d66);
        const data = buildCriticalInjuryItemData(entry);
        assert.equal(data.system.instantDeath, true, `D66 ${d66} doit être une mort instantanée`);
    }
});


test("criticalInjurySeedKey / buildAllCriticalInjuryItemsData — un seedKey unique par résultat", () => {

    const items = buildAllCriticalInjuryItemsData(CRITICAL_INJURIES);

    assert.equal(items.length, CRITICAL_INJURIES.length);

    const seedKeys = items.map((item) => item.flags["metro-2033-yze"].seedKey);
    assert.equal(new Set(seedKeys).size, seedKeys.length);
    assert.ok(seedKeys.includes("critical-injury-11"));
    assert.ok(seedKeys.includes("critical-injury-66"));
});
