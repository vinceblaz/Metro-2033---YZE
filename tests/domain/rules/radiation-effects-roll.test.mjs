import test from "node:test";
import assert from "node:assert/strict";

import { resolveRadiationEffectsRoll } from "../../../src/domain/rules/radiation-effects-roll.mjs";


/* ============================================================
 * Validation
 * ============================================================ */


test("resolveRadiationEffectsRoll exige des doses entières positives ou nulles", () => {
    assert.throws(
        () => resolveRadiationEffectsRoll({ doses: -1, permanent: 0, ones: 0 }),
        TypeError
    );

    assert.throws(
        () => resolveRadiationEffectsRoll({ doses: 1.5, permanent: 0, ones: 0 }),
        TypeError
    );
});


test("resolveRadiationEffectsRoll exige des doses permanentes entières positives ou nulles", () => {
    assert.throws(
        () => resolveRadiationEffectsRoll({ doses: 0, permanent: -1, ones: 0 }),
        TypeError
    );
});


test("resolveRadiationEffectsRoll exige un nombre d'afflictions entier positif ou nul", () => {
    assert.throws(
        () => resolveRadiationEffectsRoll({ doses: 3, permanent: 0, ones: -1 }),
        TypeError
    );
});


test("resolveRadiationEffectsRoll rejette un nombre d'afflictions supérieur au nombre de dés lancés", () => {
    assert.throws(
        () => resolveRadiationEffectsRoll({ doses: 2, permanent: 0, ones: 3 }),
        RangeError
    );
});


/* ============================================================
 * Nombre de dés — doses + doses permanentes (règle p.206)
 * ============================================================ */


test("le nombre de dés lancés est égal au total des doses de Radiation emmagasinées", () => {
    const result = resolveRadiationEffectsRoll({ doses: 4, permanent: 2, ones: 0 });

    assert.equal(result.diceCount, 6);
});


test("aucune dose de Radiation ne lance aucun dé", () => {
    const result = resolveRadiationEffectsRoll({ doses: 0, permanent: 0, ones: 0 });

    assert.equal(result.diceCount, 0);
    assert.equal(result.vigorDamage, 0);
});


/* ============================================================
 * Dégâts de VIGUEUR
 * ============================================================ */


test("chaque affliction (\"1\") inflige 1 point de dégâts de VIGUEUR", () => {
    const result = resolveRadiationEffectsRoll({ doses: 5, permanent: 0, ones: 3 });

    assert.equal(result.vigorDamage, 3);
});


test("le résultat rapporte les doses, les doses permanentes et les afflictions obtenues", () => {
    const result = resolveRadiationEffectsRoll({ doses: 5, permanent: 1, ones: 2 });

    assert.equal(result.doses, 5);
    assert.equal(result.permanent, 1);
    assert.equal(result.ones, 2);
});
