import test from "node:test";
import assert from "node:assert/strict";

import { resolveReserveRoll } from "../../../src/domain/rules/reserve-roll.mjs";


/* ============================================================
 * Validation
 * ============================================================ */


test("resolveReserveRoll exige un niveau entier positif ou nul", () => {
    assert.throws(
        () => resolveReserveRoll({ level: -1, ones: 0 }),
        TypeError
    );

    assert.throws(
        () => resolveReserveRoll({ level: 1.5, ones: 0 }),
        TypeError
    );

    assert.throws(
        () => resolveReserveRoll({ level: "3", ones: 0 }),
        TypeError
    );
});


test("resolveReserveRoll exige un nombre d'afflictions entier positif ou nul", () => {
    assert.throws(
        () => resolveReserveRoll({ level: 5, ones: -1 }),
        TypeError
    );

    assert.throws(
        () => resolveReserveRoll({ level: 5, ones: 1.5 }),
        TypeError
    );
});


test("resolveReserveRoll rejette un nombre d'afflictions supérieur au nombre de dés lancés", () => {
    assert.throws(
        () => resolveReserveRoll({ level: 3, ones: 4 }),
        RangeError
    );
});


/* ============================================================
 * Nombre de dés — plafonné à 5 (règle p.174)
 * ============================================================ */


test("le nombre de dés lancés est égal au niveau de réserve tant qu'il ne dépasse pas 5", () => {
    const result = resolveReserveRoll({ level: 3, ones: 0 });

    assert.equal(result.diceCount, 3);
});


test("le nombre de dés lancés ne dépasse jamais 5, même si le niveau atteint 10", () => {
    const result = resolveReserveRoll({ level: 10, ones: 0 });

    assert.equal(result.diceCount, 5);
});


test("un niveau de réserve à 0 ne lance aucun dé", () => {
    const result = resolveReserveRoll({ level: 0, ones: 0 });

    assert.equal(result.diceCount, 0);
    assert.equal(result.newLevel, 0);
    assert.equal(result.depleted, true);
});


/* ============================================================
 * Réduction du niveau de réserve
 * ============================================================ */


test("chaque affliction (\"1\") réduit le niveau de réserve de 1", () => {
    const result = resolveReserveRoll({ level: 6, ones: 2 });

    assert.equal(result.diceCount, 5);
    assert.equal(result.newLevel, 4);
    assert.equal(result.depleted, false);
});


test("le niveau de réserve ne peut jamais descendre sous 0", () => {
    const result = resolveReserveRoll({ level: 3, ones: 3 });

    assert.equal(result.newLevel, 0);
    assert.equal(result.depleted, true);
});


test("aucune affliction ne laisse le niveau de réserve inchangé", () => {
    const result = resolveReserveRoll({ level: 7, ones: 0 });

    assert.equal(result.newLevel, 7);
    assert.equal(result.depleted, false);
});


test("le résultat rapporte le niveau précédent et les afflictions obtenues", () => {
    const result = resolveReserveRoll({ level: 4, ones: 1 });

    assert.equal(result.previousLevel, 4);
    assert.equal(result.ones, 1);
});
