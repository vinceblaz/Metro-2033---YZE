import test from "node:test";
import assert from "node:assert/strict";

import {
    ASPHYXIATION_STATUS_EFFECT,
    ASPHYXIATION_SOURCE_LEVELS,
    getAsphyxiationSourceLevelChoices,
    computeAsphyxiationDicePool,
    resolveAsphyxiationOutcome
} from "../../../src/domain/rules/asphyxiation.mjs";


/* ============================================================
 * ASPHYXIATION_STATUS_EFFECT
 * ============================================================ */


test("ASPHYXIATION_STATUS_EFFECT expose un identifiant, un nom et une icône", () => {

    assert.equal(ASPHYXIATION_STATUS_EFFECT.id, "asphyxiated");
    assert.equal(ASPHYXIATION_STATUS_EFFECT.name, "Asphyxié");
    assert.equal(typeof ASPHYXIATION_STATUS_EFFECT.img, "string");
    assert.ok(ASPHYXIATION_STATUS_EFFECT.img.length > 0);
});


/* ============================================================
 * ASPHYXIATION_SOURCE_LEVELS / getAsphyxiationSourceLevelChoices
 * ============================================================ */


test("ASPHYXIATION_SOURCE_LEVELS reprend les 3 paliers du livre (p.205)", () => {

    assert.equal(ASPHYXIATION_SOURCE_LEVELS.light.frequency, "Tous les quarts");
    assert.equal(ASPHYXIATION_SOURCE_LEVELS.strong.frequency, "Tous les tours");
    assert.equal(ASPHYXIATION_SOURCE_LEVELS.extreme.frequency, "Tous les rounds");
});


test("getAsphyxiationSourceLevelChoices retourne les 3 paliers dans l'ordre du livre", () => {

    const choices = getAsphyxiationSourceLevelChoices();

    assert.equal(choices.length, 3);
    assert.deepEqual(
        choices.map((choice) => choice.key),
        ["light", "strong", "extreme"]
    );
});


/* ============================================================
 * computeAsphyxiationDicePool
 * ============================================================ */


test("computeAsphyxiationDicePool exige une VIGUEUR entière positive ou nulle", () => {
    assert.throws(
        () => computeAsphyxiationDicePool({ vigorAttribute: -1, enduranceSkill: 0 }),
        TypeError
    );
});


test("computeAsphyxiationDicePool exige une compétence ENDURANCE entière positive ou nulle", () => {
    assert.throws(
        () => computeAsphyxiationDicePool({ vigorAttribute: 3, enduranceSkill: -1 }),
        TypeError
    );
});


test("computeAsphyxiationDicePool est un test de Compétence standard (Attribut + Compétence)", () => {

    const pool = computeAsphyxiationDicePool({
        vigorAttribute: 4,
        enduranceSkill: 2
    });

    assert.equal(pool.attribute, 4);
    assert.equal(pool.skill, 2);
});


/* ============================================================
 * resolveAsphyxiationOutcome
 * ============================================================ */


test("resolveAsphyxiationOutcome exige un nombre de réussites entier positif ou nul", () => {
    assert.throws(
        () => resolveAsphyxiationOutcome({ successes: -1 }),
        TypeError
    );
});


test("resolveAsphyxiationOutcome : échec (0 réussite) -> 1 dégât VIGUEUR + 1 dégât ESPRIT", () => {

    const outcome = resolveAsphyxiationOutcome({ successes: 0 });

    assert.equal(outcome.failed, true);
    assert.equal(outcome.vigorDamage, 1);
    assert.equal(outcome.spiritDamage, 1);
});


test("resolveAsphyxiationOutcome : réussite (>=1) -> aucun dégât, quel que soit le nombre de réussites", () => {

    const oneSuccess = resolveAsphyxiationOutcome({ successes: 1 });
    const manySuccesses = resolveAsphyxiationOutcome({ successes: 4 });

    assert.equal(oneSuccess.failed, false);
    assert.equal(oneSuccess.vigorDamage, 0);
    assert.equal(oneSuccess.spiritDamage, 0);

    assert.equal(manySuccesses.failed, false);
    assert.equal(manySuccesses.vigorDamage, 0);
    assert.equal(manySuccesses.spiritDamage, 0);
});
