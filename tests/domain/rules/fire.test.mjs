import test from "node:test";
import assert from "node:assert/strict";

import {
    FIRE_STATUS_EFFECT,
    FIRE_STANDARD_INTENSITY,
    FIRE_MAX_INTENSITY,
    normalizeFireIntensity,
    resolveFireOutcome,
    resolveFireRound,
    isFireDeathRollRequired,
    isFireExtinguishSuccess
} from "../../../src/domain/rules/fire.mjs";

test("statut Feu : identifiant natif Foundry « burning »", () => {
    assert.equal(FIRE_STATUS_EFFECT.id, "burning");
    assert.equal(FIRE_STATUS_EFFECT.name, "En feu");
    assert.ok(FIRE_STATUS_EFFECT.img.length > 0);
});

test("un feu standard a une Intensité de 8 (p.203)", () => {
    assert.equal(FIRE_STANDARD_INTENSITY, 8);
});

test("normalizeFireIntensity : entier entre 1 et le maximum", () => {
    assert.equal(normalizeFireIntensity(8), 8);
    assert.equal(normalizeFireIntensity("10"), 10);
    assert.equal(normalizeFireIntensity(FIRE_MAX_INTENSITY + 50), FIRE_MAX_INTENSITY);
    assert.throws(() => normalizeFireIntensity(0));
    assert.throws(() => normalizeFireIntensity(-3));
    assert.throws(() => normalizeFireIntensity(2.5));
    assert.throws(() => normalizeFireIntensity("abc"));
    assert.throws(() => normalizeFireIntensity(null));
});

test("resolveFireOutcome : 1 dégât de Vigueur par réussite, moins la Protection", () => {
    assert.deepEqual(
        resolveFireOutcome({ successes: 4, remainingDamage: 3 }),
        { successes: 4, rawDamage: 4, remainingDamage: 3, prevented: 1, ignites: true }
    );
});

test("resolveFireOutcome : aucune réussite ou tout absorbé = ne prend pas feu", () => {
    assert.equal(resolveFireOutcome({ successes: 0, remainingDamage: 0 }).ignites, false);
    assert.equal(resolveFireOutcome({ successes: 3, remainingDamage: 0 }).ignites, false);
});

test("resolveFireOutcome : valeurs incohérentes refusées", () => {
    assert.throws(() => resolveFireOutcome({ successes: -1, remainingDamage: 0 }));
    assert.throws(() => resolveFireOutcome({ successes: 2, remainingDamage: 3 }));
    assert.throws(() => resolveFireOutcome({ successes: 2.5, remainingDamage: 1 }));
    assert.throws(() => resolveFireOutcome({ successes: 2, remainingDamage: -1 }));
});

test("resolveFireRound : l'Intensité augmente de 1 par round", () => {
    assert.deepEqual(
        resolveFireRound({ currentIntensity: 8 }),
        { intensity: 9 }
    );
    assert.deepEqual(
        resolveFireRound({ currentIntensity: FIRE_MAX_INTENSITY }),
        { intensity: FIRE_MAX_INTENSITY }
    );
});

test("le feu s'éteint d'office quand l'attaque n'inflige plus de dégâts", () => {
    assert.equal(resolveFireOutcome({ successes: 5, remainingDamage: 0 }).ignites, false);
    assert.equal(resolveFireOutcome({ successes: 5, remainingDamage: 1 }).ignites, true);
});

test("Trépas requis si le feu blesse un personnage Brisé (Vigueur à 0)", () => {
    assert.equal(isFireDeathRollRequired({ remainingDamage: 2, vigorAfter: 0 }), true);
    assert.equal(isFireDeathRollRequired({ remainingDamage: 2, vigorAfter: 1 }), false);
    assert.equal(isFireDeathRollRequired({ remainingDamage: 0, vigorAfter: 0 }), false);
});

test("extinction : au moins une réussite au jet de RÉACTION", () => {
    assert.equal(isFireExtinguishSuccess(1), true);
    assert.equal(isFireExtinguishSuccess(0), false);
    assert.throws(() => isFireExtinguishSuccess(-1));
});
