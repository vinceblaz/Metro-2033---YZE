import test from "node:test";
import assert from "node:assert/strict";

import { resolveRest } from "../../../src/domain/rules/rest.mjs";


/* ============================================================
 * Validation
 * ============================================================ */


test("resolveRest exige un nombre de dés de Stress entier positif ou nul", () => {
    assert.throws(
        () => resolveRest({
            stressDice: -1,
            composureCurrent: 0,
            attributes: {}
        }),
        TypeError
    );
});


test("resolveRest exige une valeur de Sang-froid actuelle entière positive ou nulle", () => {
    assert.throws(
        () => resolveRest({
            stressDice: 0,
            composureCurrent: -1,
            attributes: {}
        }),
        TypeError
    );
});


test("resolveRest exige un objet d'attributs", () => {
    assert.throws(
        () => resolveRest({
            stressDice: 0,
            composureCurrent: 0,
            attributes: null
        }),
        TypeError
    );
});


test("resolveRest exige que chaque attribut fournisse value et max", () => {
    assert.throws(
        () => resolveRest({
            stressDice: 0,
            composureCurrent: 0,
            attributes: {
                vigor: { value: 2 }
            }
        }),
        TypeError
    );
});


/* ============================================================
 * Un quart de repos (règle : -2 Stress, -2 Sang-froid,
 * attributs remis à leur maximum)
 * ============================================================ */


test("un quart de repos réduit les dés de Stress de 2", () => {
    const result = resolveRest({
        stressDice: 5,
        composureCurrent: 0,
        attributes: {}
    });

    assert.equal(result.stressDice, 3);
});


test("les dés de Stress ne peuvent pas descendre sous 0", () => {
    const result = resolveRest({
        stressDice: 1,
        composureCurrent: 0,
        attributes: {}
    });

    assert.equal(result.stressDice, 0);
});


test("un quart de repos réduit le Sang-froid de 2", () => {
    const result = resolveRest({
        stressDice: 0,
        composureCurrent: 5,
        attributes: {}
    });

    assert.equal(result.composureCurrent, 3);
});


test("le Sang-froid ne peut pas descendre sous 0", () => {
    const result = resolveRest({
        stressDice: 0,
        composureCurrent: 1,
        attributes: {}
    });

    assert.equal(result.composureCurrent, 0);
});


test("un quart de repos remet chaque attribut à sa valeur maximale", () => {
    const result = resolveRest({
        stressDice: 0,
        composureCurrent: 0,
        attributes: {
            vigor: { value: 1, max: 4 },
            agility: { value: 0, max: 3 },
            spirit: { value: 5, max: 5 },
            empathy: { value: 2, max: 4 }
        }
    });

    assert.deepEqual(
        result.attributes,
        {
            vigor: { value: 4, max: 4 },
            agility: { value: 3, max: 3 },
            spirit: { value: 5, max: 5 },
            empathy: { value: 4, max: 4 }
        }
    );
});


/* ============================================================
 * Attributs bloqués (Poison/Maladie, livre p.204-205) : "tant
 * que [le poison/la maladie] fait effet, vous ne pouvez pas
 * récupérer de points dans l'attribut affecté"
 * ============================================================ */


test("resolveRest exige que blockedAttributeKeys soit un tableau", () => {
    assert.throws(
        () => resolveRest({
            stressDice: 0,
            composureCurrent: 0,
            attributes: {},
            blockedAttributeKeys: "vigor"
        }),
        TypeError
    );
});


test("un attribut listé dans blockedAttributeKeys n'est pas restauré au maximum", () => {
    const result = resolveRest({
        stressDice: 0,
        composureCurrent: 0,
        attributes: {
            vigor: { value: 1, max: 4 },
            agility: { value: 0, max: 3 }
        },
        blockedAttributeKeys: ["vigor"]
    });

    assert.deepEqual(
        result.attributes,
        {
            vigor: { value: 1, max: 4 },
            agility: { value: 3, max: 3 }
        }
    );
});


test("blockedAttributeKeys ignore une clé qui ne correspond à aucun attribut fourni", () => {
    const result = resolveRest({
        stressDice: 0,
        composureCurrent: 0,
        attributes: {
            vigor: { value: 1, max: 4 }
        },
        blockedAttributeKeys: ["spirit"]
    });

    assert.deepEqual(
        result.attributes,
        {
            vigor: { value: 4, max: 4 }
        }
    );

    assert.deepEqual(
        result.blockedAttributeKeys,
        []
    );
});


test("blockedAttributeKeys est vide par défaut (comportement historique inchangé)", () => {
    const result = resolveRest({
        stressDice: 0,
        composureCurrent: 0,
        attributes: {
            vigor: { value: 1, max: 4 }
        }
    });

    assert.deepEqual(
        result.attributes,
        {
            vigor: { value: 4, max: 4 }
        }
    );

    assert.deepEqual(
        result.blockedAttributeKeys,
        []
    );
});


test("resolveRest renvoie la liste des attributs effectivement bloqués", () => {
    const result = resolveRest({
        stressDice: 0,
        composureCurrent: 0,
        attributes: {
            vigor: { value: 1, max: 4 },
            agility: { value: 2, max: 3 }
        },
        blockedAttributeKeys: ["vigor", "agility"]
    });

    assert.deepEqual(
        result.blockedAttributeKeys,
        ["vigor", "agility"]
    );
});
