import test from "node:test";
import assert from "node:assert/strict";

import {
    TERROR_SOURCE_LEVELS,
    getTerrorSourceLevelChoices,
    computeTerrorDicePool,
    resolveTerrorOutcome
} from "../../../src/domain/rules/terror.mjs";


/* ============================================================
 * TERROR_SOURCE_LEVELS / getTerrorSourceLevelChoices
 * ============================================================ */


test("TERROR_SOURCE_LEVELS reprend les 3 paliers du livre (p.207)", () => {

    assert.equal(TERROR_SOURCE_LEVELS.frightening.value, 3);
    assert.equal(TERROR_SOURCE_LEVELS.atrocious.value, 5);
    assert.equal(TERROR_SOURCE_LEVELS.abominable.value, 8);

    assert.equal(TERROR_SOURCE_LEVELS.frightening.label, "Effrayante");
    assert.equal(TERROR_SOURCE_LEVELS.atrocious.label, "Atroce");
    assert.equal(TERROR_SOURCE_LEVELS.abominable.label, "Abominable");
});


test("getTerrorSourceLevelChoices retourne les 3 paliers dans l'ordre du livre", () => {

    const choices = getTerrorSourceLevelChoices();

    assert.equal(choices.length, 3);
    assert.deepEqual(
        choices.map((choice) => choice.key),
        ["frightening", "atrocious", "abominable"]
    );
});


/* ============================================================
 * computeTerrorDicePool
 * ============================================================ */


test("computeTerrorDicePool exige une valeur de Terreur entière positive ou nulle", () => {
    assert.throws(
        () => computeTerrorDicePool({ terrorValue: -1, targetStressDice: 0 }),
        TypeError
    );
    assert.throws(
        () => computeTerrorDicePool({ terrorValue: 1.5, targetStressDice: 0 }),
        TypeError
    );
});


test("computeTerrorDicePool exige un nombre de dés de Stress entier positif ou nul", () => {
    assert.throws(
        () => computeTerrorDicePool({ terrorValue: 3, targetStressDice: -1 }),
        TypeError
    );
});


test("computeTerrorDicePool place la valeur de Terreur en bonus et le Stress de la cible en stress", () => {

    const pool = computeTerrorDicePool({
        terrorValue: 5,
        targetStressDice: 2
    });

    assert.equal(pool.bonus, 5);
    assert.equal(pool.stress, 2);
});


test("computeTerrorDicePool accepte l'absence de dés de Stress (0 par défaut)", () => {

    const pool = computeTerrorDicePool({ terrorValue: 3 });

    assert.equal(pool.bonus, 3);
    assert.equal(pool.stress, 0);
});


/* ============================================================
 * resolveTerrorOutcome
 * ============================================================ */


test("resolveTerrorOutcome exige un nombre de réussites entier positif ou nul", () => {
    assert.throws(
        () => resolveTerrorOutcome({ successes: -1 }),
        TypeError
    );
});


test("resolveTerrorOutcome : chaque réussite inflige 1 point de dégâts à l'ESPRIT", () => {

    const outcome = resolveTerrorOutcome({ successes: 3 });

    assert.equal(outcome.successes, 3);
    assert.equal(outcome.damage, 3);
    assert.equal(outcome.affected, true);
});


test("resolveTerrorOutcome : aucune réussite -> aucun dégât, cible non affectée", () => {

    const outcome = resolveTerrorOutcome({ successes: 0 });

    assert.equal(outcome.damage, 0);
    assert.equal(outcome.affected, false);
});
