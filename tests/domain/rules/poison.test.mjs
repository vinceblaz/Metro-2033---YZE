import test from "node:test";
import assert from "node:assert/strict";

import {
    POISON_EFFECT_TYPES,
    POISON_STATUS_EFFECT,
    getPoisonEffectTypeChoices,
    getPoisonEffectType,
    computePoisonOpposedPools,
    resolvePoisonOpposition,
    resolvePoisonRoundDamage,
    resolveBladePoisonOpposition
} from "../../../src/domain/rules/poison.mjs";


/* ============================================================
 * POISON_STATUS_EFFECT
 * ============================================================ */

test("POISON_STATUS_EFFECT expose un identifiant, un nom et une icône", () => {

    assert.equal(POISON_STATUS_EFFECT.id, "poisoned");
    assert.equal(POISON_STATUS_EFFECT.name, "Empoisonné");
    assert.equal(typeof POISON_STATUS_EFFECT.img, "string");
    assert.ok(POISON_STATUS_EFFECT.img.length > 0);
});


/* ============================================================
 * POISON_EFFECT_TYPES / getPoisonEffectTypeChoices
 * ============================================================ */

test("POISON_EFFECT_TYPES reprend les 4 types du livre (p.205), chacun rattaché au bon attribut", () => {

    assert.equal(POISON_EFFECT_TYPES.lethal.attribute, "vigor");
    assert.equal(POISON_EFFECT_TYPES.paralyzing.attribute, "agility");
    assert.equal(POISON_EFFECT_TYPES.sleep.attribute, "spirit");
    assert.equal(POISON_EFFECT_TYPES.hallucinogenic.attribute, "empathy");
});


test("getPoisonEffectTypeChoices retourne les 4 types dans l'ordre du livre", () => {

    const choices = getPoisonEffectTypeChoices();

    assert.equal(choices.length, 4);
    assert.deepEqual(
        choices.map(choice => choice.key),
        ["lethal", "paralyzing", "sleep", "hallucinogenic"]
    );
});


test("getPoisonEffectType retourne la définition correspondant à une clé connue", () => {

    const effectType = getPoisonEffectType("paralyzing");

    assert.equal(effectType.key, "paralyzing");
    assert.equal(effectType.attribute, "agility");
});


test("getPoisonEffectType lève pour une clé inconnue (pas de poison personnalisé)", () => {

    assert.throws(
        () => getPoisonEffectType("custom"),
        TypeError
    );
});


/* ============================================================
 * computePoisonOpposedPools
 * ============================================================ */

test("computePoisonOpposedPools construit le pool de la victime (VIGUEUR + Endurance) et celui du poison (Toxicité)", () => {

    const pools = computePoisonOpposedPools({
        toxicity: 6,
        vigorAttribute: 3,
        enduranceSkill: 2
    });

    assert.deepEqual(pools.victim, { attribute: 3, skill: 2 });
    assert.deepEqual(pools.poison, { bonus: 6 });
});


test("computePoisonOpposedPools rejette une Toxicité nulle ou négative", () => {

    assert.throws(
        () => computePoisonOpposedPools({
            toxicity: 0,
            vigorAttribute: 3,
            enduranceSkill: 2
        }),
        TypeError
    );

    assert.throws(
        () => computePoisonOpposedPools({
            toxicity: -1,
            vigorAttribute: 3,
            enduranceSkill: 2
        }),
        TypeError
    );
});


test("computePoisonOpposedPools rejette une VIGUEUR ou une compétence Endurance négative", () => {

    assert.throws(
        () => computePoisonOpposedPools({
            toxicity: 3,
            vigorAttribute: -1,
            enduranceSkill: 2
        }),
        TypeError
    );

    assert.throws(
        () => computePoisonOpposedPools({
            toxicity: 3,
            vigorAttribute: 3,
            enduranceSkill: -1
        }),
        TypeError
    );
});


/* ============================================================
 * resolvePoisonOpposition
 * ============================================================ */

test("resolvePoisonOpposition : le poison l'emporte (effets complets) seulement s'il a strictement plus de réussites", () => {

    const resolution = resolvePoisonOpposition({
        victimSuccesses: 1,
        poisonSuccesses: 2
    });

    assert.equal(resolution.fullEffect, true);
    assert.equal(resolution.tie, false);
    assert.equal(resolution.margin, 1);
});


test("resolvePoisonOpposition : une égalité protège la victime (effets réduits)", () => {

    const resolution = resolvePoisonOpposition({
        victimSuccesses: 2,
        poisonSuccesses: 2
    });

    assert.equal(resolution.fullEffect, false);
    assert.equal(resolution.tie, true);
});


test("resolvePoisonOpposition : la victime l'emportant subit aussi seulement les effets réduits (jamais aucun effet)", () => {

    const resolution = resolvePoisonOpposition({
        victimSuccesses: 3,
        poisonSuccesses: 1
    });

    assert.equal(resolution.fullEffect, false);
    assert.equal(resolution.tie, false);
    assert.equal(resolution.margin, -2);
});


test("resolvePoisonOpposition rejette des réussites négatives", () => {

    assert.throws(
        () => resolvePoisonOpposition({
            victimSuccesses: -1,
            poisonSuccesses: 1
        }),
        TypeError
    );

    assert.throws(
        () => resolvePoisonOpposition({
            victimSuccesses: 1,
            poisonSuccesses: -1
        }),
        TypeError
    );
});


/* ============================================================
 * resolvePoisonRoundDamage
 * ============================================================ */

test("resolvePoisonRoundDamage inflige 1 point de dégâts à l'attribut du type d'effet", () => {

    const result = resolvePoisonRoundDamage({
        effectTypeKey: "lethal",
        currentAttributeValue: 3
    });

    assert.equal(result.attribute, "vigor");
    assert.equal(result.amount, 1);
    assert.equal(result.alreadyBroken, false);
});


test("resolvePoisonRoundDamage n'inflige plus aucun dégât une fois l'attribut Brisé (valeur 0)", () => {

    const result = resolvePoisonRoundDamage({
        effectTypeKey: "hallucinogenic",
        currentAttributeValue: 0
    });

    assert.equal(result.attribute, "empathy");
    assert.equal(result.amount, 0);
    assert.equal(result.alreadyBroken, true);
});


test("resolvePoisonRoundDamage rejette une clé de type d'effet inconnue", () => {

    assert.throws(
        () => resolvePoisonRoundDamage({
            effectTypeKey: "unknown",
            currentAttributeValue: 2
        }),
        TypeError
    );
});


test("resolvePoisonRoundDamage rejette une valeur d'attribut invalide", () => {

    assert.throws(
        () => resolvePoisonRoundDamage({
            effectTypeKey: "lethal",
            currentAttributeValue: -1
        }),
        TypeError
    );
});


/* ============================================================
 * resolveBladePoisonOpposition (poison de lame, p.204)
 * ============================================================ */

test("resolveBladePoisonOpposition : la victime strictement gagnante ne subit aucun effet", () => {

    const resolution = resolveBladePoisonOpposition({
        victimSuccesses: 3,
        poisonSuccesses: 1
    });

    assert.equal(resolution.noEffect, true);
    assert.equal(resolution.tie, false);
    assert.equal(resolution.margin, -2);
});


test("resolveBladePoisonOpposition : une égalité protège la victime (aucun effet, jamais effets réduits)", () => {

    const resolution = resolveBladePoisonOpposition({
        victimSuccesses: 2,
        poisonSuccesses: 2
    });

    assert.equal(resolution.noEffect, true);
    assert.equal(resolution.tie, true);
    assert.equal(resolution.margin, 0);
});


test("resolveBladePoisonOpposition : le poison strictement gagnant inflige les effets réduits (noEffect faux)", () => {

    const resolution = resolveBladePoisonOpposition({
        victimSuccesses: 1,
        poisonSuccesses: 2
    });

    assert.equal(resolution.noEffect, false);
    assert.equal(resolution.tie, false);
    assert.equal(resolution.margin, 1);
});


test("resolveBladePoisonOpposition rejette des réussites négatives ou non entières", () => {

    assert.throws(
        () => resolveBladePoisonOpposition({
            victimSuccesses: -1,
            poisonSuccesses: 1
        }),
        TypeError
    );

    assert.throws(
        () => resolveBladePoisonOpposition({
            victimSuccesses: 1,
            poisonSuccesses: -1
        }),
        TypeError
    );

    assert.throws(
        () => resolveBladePoisonOpposition({
            victimSuccesses: 1.5,
            poisonSuccesses: 1
        }),
        TypeError
    );
});
