import test from "node:test";
import assert from "node:assert/strict";

import {
    computeDeathRollDicePool,
    resolveDeathRollOutcome
} from "../../../src/domain/rules/death-roll.mjs";


/* ============================================================
 * computeDeathRollDicePool
 * ============================================================ */


test("computeDeathRollDicePool exige une VIGUEUR max entière positive ou nulle", () => {
    assert.throws(
        () => computeDeathRollDicePool({ vigorMax: -1, enduranceSkill: 0, deathRollModifier: 0 }),
        TypeError
    );
});


test("computeDeathRollDicePool exige une compétence ENDURANCE entière positive ou nulle", () => {
    assert.throws(
        () => computeDeathRollDicePool({ vigorMax: 4, enduranceSkill: -1, deathRollModifier: 0 }),
        TypeError
    );
});


test("computeDeathRollDicePool exige un modificateur entier", () => {
    assert.throws(
        () => computeDeathRollDicePool({ vigorMax: 4, enduranceSkill: 2, deathRollModifier: 1.5 }),
        TypeError
    );
});


test("le jet de Trépas utilise la VIGUEUR max et la compétence ENDURANCE", () => {
    const pool = computeDeathRollDicePool({
        vigorMax: 4,
        enduranceSkill: 2,
        deathRollModifier: 0
    });

    assert.equal(pool.attribute, 4);
    assert.equal(pool.skill, 2);
    assert.equal(pool.penalty, 0);
    assert.equal(pool.bonus, 0);
});


test("un modificateur négatif (colonne Fatal) devient un malus", () => {
    const pool = computeDeathRollDicePool({
        vigorMax: 4,
        enduranceSkill: 2,
        deathRollModifier: -1
    });

    assert.equal(pool.penalty, 1);
    assert.equal(pool.bonus, 0);
});


test("un modificateur positif devient un bonus", () => {
    const pool = computeDeathRollDicePool({
        vigorMax: 4,
        enduranceSkill: 2,
        deathRollModifier: 2
    });

    assert.equal(pool.penalty, 0);
    assert.equal(pool.bonus, 2);
});


/* ============================================================
 * resolveDeathRollOutcome
 * ============================================================ */


test("resolveDeathRollOutcome exige un nombre de réussites entier positif ou nul", () => {
    assert.throws(
        () => resolveDeathRollOutcome({ successes: -1, previousRolls: 0 }),
        TypeError
    );
});


test("resolveDeathRollOutcome exige un nombre de jets précédents entier positif ou nul", () => {
    assert.throws(
        () => resolveDeathRollOutcome({ successes: 0, previousRolls: -1 }),
        TypeError
    );
});


test("au moins une réussite : le personnage survit", () => {
    const outcome = resolveDeathRollOutcome({ successes: 1, previousRolls: 0 });

    assert.equal(outcome.survived, true);
});


test("aucune réussite : le personnage meurt", () => {
    const outcome = resolveDeathRollOutcome({ successes: 0, previousRolls: 0 });

    assert.equal(outcome.survived, false);
});


test("le compteur de jets est incrémenté à chaque résolution", () => {
    const outcome = resolveDeathRollOutcome({ successes: 1, previousRolls: 2 });

    assert.equal(outcome.rolls, 3);
});
