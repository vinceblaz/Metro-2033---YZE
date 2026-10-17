import test from "node:test";
import assert from "node:assert/strict";

import {
    COUP_DE_GRACE_DEFAULT_TEXT,
    COUP_DE_GRACE_VERDICTS,
    requiresEmpathyRoll,
    resolveCoupDeGrace
} from "../../../src/domain/rules/coup-de-grace.mjs";


test("texte par défaut de la macro", () => {
    assert.equal(
        COUP_DE_GRACE_DEFAULT_TEXT,
        "Tu veux exécuter ta cible de sang-froid"
    );
});

test("jet d'EMPATHIE requis sauf pour Impitoyable", () => {
    assert.equal(requiresEmpathyRoll({ hasRuthless: false }), true);
    assert.equal(requiresEmpathyRoll({}), true);
    assert.equal(requiresEmpathyRoll(), true);
    assert.equal(requiresEmpathyRoll({ hasRuthless: true }), false);
});

test("Impitoyable : aucun jet, coup porté, 1 dégât EMPATHIE, pas de Sang-froid", () => {
    assert.deepEqual(
        resolveCoupDeGrace({ hasRuthless: true }),
        {
            hasRuthless: true,
            rolled: false,
            empathySuccesses: null,
            verdict: COUP_DE_GRACE_VERDICTS.EXECUTED,
            executed: true,
            empathyDamage: 1,
            composureChecks: 0
        }
    );
});

test("Impitoyable ignore tout résultat de jet fourni", () => {
    const result = resolveCoupDeGrace({ hasRuthless: true, empathySuccesses: 3 });
    assert.equal(result.executed, true);
    assert.equal(result.rolled, false);
    assert.equal(result.composureChecks, 0);
});

test("sans Impitoyable, 0 réussite : échec du jet = coup porté, 1 dégât EMPATHIE + 1 Sang-froid", () => {
    assert.deepEqual(
        resolveCoupDeGrace({ hasRuthless: false, empathySuccesses: 0 }),
        {
            hasRuthless: false,
            rolled: true,
            empathySuccesses: 0,
            verdict: COUP_DE_GRACE_VERDICTS.EXECUTED,
            executed: true,
            empathyDamage: 1,
            composureChecks: 1
        }
    );
});

test("sans Impitoyable, >= 1 réussite : le personnage n'y parvient pas, aucun coût", () => {
    for (const successes of [1, 2, 5]) {
        assert.deepEqual(
            resolveCoupDeGrace({ empathySuccesses: successes }),
            {
                hasRuthless: false,
                rolled: true,
                empathySuccesses: successes,
                verdict: COUP_DE_GRACE_VERDICTS.FAILED,
                executed: false,
                empathyDamage: 0,
                composureChecks: 0
            }
        );
    }
});

test("sans Impitoyable, le nombre de réussites est obligatoire et valide", () => {
    assert.throws(() => resolveCoupDeGrace({}), TypeError);
    assert.throws(() => resolveCoupDeGrace({ empathySuccesses: -1 }), TypeError);
    assert.throws(() => resolveCoupDeGrace({ empathySuccesses: 1.5 }), TypeError);
    assert.throws(() => resolveCoupDeGrace({ empathySuccesses: "1" }), TypeError);
});

test("COUP_DE_GRACE_VERDICTS est gelé", () => {
    assert.equal(Object.isFrozen(COUP_DE_GRACE_VERDICTS), true);
});
