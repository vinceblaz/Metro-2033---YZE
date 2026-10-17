import test from "node:test";
import assert from "node:assert/strict";

import { resolveSurvivalReserveEncumbrance } from "../../../src/domain/rules/survival-reserve-encumbrance.mjs";


/* ============================================================
 * Validation
 * ============================================================ */


test("resolveSurvivalReserveEncumbrance exige des niveaux entiers positifs ou nuls", () => {
    assert.throws(
        () => resolveSurvivalReserveEncumbrance({ water: -1, food: 0, energy: 0 }),
        TypeError
    );

    assert.throws(
        () => resolveSurvivalReserveEncumbrance({ water: 0, food: 1.5, energy: 0 }),
        TypeError
    );

    assert.throws(
        () => resolveSurvivalReserveEncumbrance({ water: 0, food: 0, energy: "3" }),
        TypeError
    );
});


test("resolveSurvivalReserveEncumbrance rejette un niveau supérieur à 10", () => {
    assert.throws(
        () => resolveSurvivalReserveEncumbrance({ water: 11, food: 0, energy: 0 }),
        RangeError
    );
});


/* ============================================================
 * Eau / Nourriture (livre p.175)
 * 0 -> 0 ; 1-4 -> 1 ; 5-6 -> 2 ; 7-10 -> 3
 * ============================================================ */


test("Eau à 0 n'occupe aucun encombrement", () => {
    const result = resolveSurvivalReserveEncumbrance({ water: 0, food: 0, energy: 0 });
    assert.equal(result.water, 0);
});


test("Eau de 1 à 4 occupe 1 d'encombrement", () => {
    for (const water of [1, 2, 3, 4]) {
        const result = resolveSurvivalReserveEncumbrance({ water, food: 0, energy: 0 });
        assert.equal(result.water, 1, `water=${water}`);
    }
});


test("Eau de 5 à 6 occupe 2 d'encombrement", () => {
    for (const water of [5, 6]) {
        const result = resolveSurvivalReserveEncumbrance({ water, food: 0, energy: 0 });
        assert.equal(result.water, 2, `water=${water}`);
    }
});


test("Eau de 7 à 10 occupe 3 d'encombrement", () => {
    for (const water of [7, 8, 9, 10]) {
        const result = resolveSurvivalReserveEncumbrance({ water, food: 0, energy: 0 });
        assert.equal(result.water, 3, `water=${water}`);
    }
});


test("Nourriture suit le même barème que l'Eau", () => {
    const result = resolveSurvivalReserveEncumbrance({ water: 0, food: 6, energy: 0 });
    assert.equal(result.food, 2);
});


/* ============================================================
 * Énergie (livre p.175)
 * 0-3 -> 0 ; 4-5 -> 1 ; 6-8 -> 2 ; 9-10 -> 3
 * ============================================================ */


test("Énergie de 0 à 3 n'occupe aucun encombrement", () => {
    for (const energy of [0, 1, 2, 3]) {
        const result = resolveSurvivalReserveEncumbrance({ water: 0, food: 0, energy });
        assert.equal(result.energy, 0, `energy=${energy}`);
    }
});


test("Énergie de 4 à 5 occupe 1 d'encombrement", () => {
    for (const energy of [4, 5]) {
        const result = resolveSurvivalReserveEncumbrance({ water: 0, food: 0, energy });
        assert.equal(result.energy, 1, `energy=${energy}`);
    }
});


test("Énergie de 6 à 8 occupe 2 d'encombrement", () => {
    for (const energy of [6, 7, 8]) {
        const result = resolveSurvivalReserveEncumbrance({ water: 0, food: 0, energy });
        assert.equal(result.energy, 2, `energy=${energy}`);
    }
});


test("Énergie de 9 à 10 occupe 3 d'encombrement", () => {
    for (const energy of [9, 10]) {
        const result = resolveSurvivalReserveEncumbrance({ water: 0, food: 0, energy });
        assert.equal(result.energy, 3, `energy=${energy}`);
    }
});


/* ============================================================
 * Total
 * ============================================================ */


test("le total additionne les trois contributions", () => {
    const result = resolveSurvivalReserveEncumbrance({ water: 7, food: 5, energy: 9 });

    assert.equal(result.water, 3);
    assert.equal(result.food, 2);
    assert.equal(result.energy, 3);
    assert.equal(result.total, 8);
});
