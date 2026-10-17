import test from "node:test";
import assert from "node:assert/strict";

import {
    ILLNESS_STANDARD_VIRULENCE,
    ILLNESS_STATUS_EFFECT,
    computeIllnessOpposedPools,
    resolveIllnessOpposition
} from "../../../src/domain/rules/illness.mjs";


/* ============================================================
 * ILLNESS_STANDARD_VIRULENCE / ILLNESS_STATUS_EFFECT
 * ============================================================ */

test("ILLNESS_STANDARD_VIRULENCE vaut 3 (maladie « standard », livre p.204)", () => {

    assert.equal(ILLNESS_STANDARD_VIRULENCE, 3);
});


test("ILLNESS_STATUS_EFFECT expose un identifiant, un nom et une icône", () => {

    assert.equal(ILLNESS_STATUS_EFFECT.id, "sick");
    assert.equal(ILLNESS_STATUS_EFFECT.name, "Malade");
    assert.equal(typeof ILLNESS_STATUS_EFFECT.img, "string");
    assert.ok(ILLNESS_STATUS_EFFECT.img.length > 0);
});


/* ============================================================
 * computeIllnessOpposedPools
 * ============================================================ */

test("computeIllnessOpposedPools construit le pool de la victime (VIGUEUR + Endurance) et celui de la maladie (Virulence)", () => {

    const pools = computeIllnessOpposedPools({
        virulence: 3,
        vigorAttribute: 4,
        enduranceSkill: 1
    });

    assert.deepEqual(pools.victim, { attribute: 4, skill: 1 });
    assert.deepEqual(pools.illness, { bonus: 3 });
});


test("computeIllnessOpposedPools rejette une Virulence nulle ou négative", () => {

    assert.throws(
        () => computeIllnessOpposedPools({
            virulence: 0,
            vigorAttribute: 3,
            enduranceSkill: 1
        }),
        TypeError
    );

    assert.throws(
        () => computeIllnessOpposedPools({
            virulence: -1,
            vigorAttribute: 3,
            enduranceSkill: 1
        }),
        TypeError
    );
});


test("computeIllnessOpposedPools rejette une VIGUEUR ou une compétence Endurance négative", () => {

    assert.throws(
        () => computeIllnessOpposedPools({
            virulence: 3,
            vigorAttribute: -1,
            enduranceSkill: 1
        }),
        TypeError
    );

    assert.throws(
        () => computeIllnessOpposedPools({
            virulence: 3,
            vigorAttribute: 3,
            enduranceSkill: -1
        }),
        TypeError
    );
});


/* ============================================================
 * resolveIllnessOpposition
 * ============================================================ */

test("resolveIllnessOpposition : la maladie l'emporte (victime rendue Malade) seulement si elle a strictement plus de réussites", () => {

    const resolution = resolveIllnessOpposition({
        victimSuccesses: 1,
        illnessSuccesses: 2
    });

    assert.equal(resolution.sick, true);
    assert.equal(resolution.tie, false);
    assert.equal(resolution.margin, 1);
    assert.equal(resolution.vigorDamage, 1);
    assert.equal(resolution.agilityDamage, 1);
});


test("resolveIllnessOpposition : une égalité protège la victime (pas Malade)", () => {

    const resolution = resolveIllnessOpposition({
        victimSuccesses: 2,
        illnessSuccesses: 2
    });

    assert.equal(resolution.sick, false);
    assert.equal(resolution.tie, true);
    assert.equal(resolution.vigorDamage, 0);
    assert.equal(resolution.agilityDamage, 0);
});


test("resolveIllnessOpposition : la victime l'emportant n'est pas Malade (pas d'effets réduits pour ce jet)", () => {

    const resolution = resolveIllnessOpposition({
        victimSuccesses: 3,
        illnessSuccesses: 1
    });

    assert.equal(resolution.sick, false);
    assert.equal(resolution.tie, false);
    assert.equal(resolution.margin, -2);
    assert.equal(resolution.vigorDamage, 0);
    assert.equal(resolution.agilityDamage, 0);
});


test("resolveIllnessOpposition rejette des réussites négatives", () => {

    assert.throws(
        () => resolveIllnessOpposition({
            victimSuccesses: -1,
            illnessSuccesses: 1
        }),
        TypeError
    );

    assert.throws(
        () => resolveIllnessOpposition({
            victimSuccesses: 1,
            illnessSuccesses: -1
        }),
        TypeError
    );
});
