import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveEncumbrance
} from "../../../src/domain/rules/encumbrance.mjs";


/* ============================================================
 * VALIDATION — vigor
 * ============================================================ */


test("vigor doit être un entier strictement positif", () => {
  for (
    const vigor
    of [
      0,
      -1,
      1.5,
      "4",
      NaN,
      Infinity,
      false
    ]
  ) {
    assert.throws(
      () =>
        resolveEncumbrance({
          vigor,
          items: []
        }),
      TypeError
    );
  }
});


/* ============================================================
 * VALIDATION — items
 * ============================================================ */


test("items doit être un tableau", () => {
  assert.throws(
    () =>
      resolveEncumbrance({
        vigor: 4,
        items: "pas un tableau"
      }),
    TypeError
  );
});


test("le poids d'un objet doit être un nombre positif ou nul", () => {
  for (
    const weight
    of [
      -1,
      "1",
      NaN,
      Infinity,
      false
    ]
  ) {
    assert.throws(
      () =>
        resolveEncumbrance({
          vigor: 4,
          items: [
            { weight }
          ]
        }),
      TypeError
    );
  }
});


/* ============================================================
 * CALCUL DE LA CAPACITÉ
 * ============================================================ */


test("la capacité normale vaut le double de la Vigueur", () => {
  const result =
    resolveEncumbrance({
      vigor: 4,
      items: []
    });

  assert.equal(result.capacity, 8);
});


test("la capacité critique vaut quatre fois la Vigueur", () => {
  const result =
    resolveEncumbrance({
      vigor: 4,
      items: []
    });

  assert.equal(result.criticalCapacity, 16);
});


/* ============================================================
 * SOMME DES POIDS
 * ============================================================ */


test("le poids total additionne le poids de chaque objet", () => {
  const result =
    resolveEncumbrance({
      vigor: 4,
      items: [
        { weight: 1 },
        { weight: 0.5 },
        { weight: 2 }
      ]
    });

  assert.equal(result.totalWeight, 3.5);
});


test("un objet sans poids défini compte pour 0", () => {
  const result =
    resolveEncumbrance({
      vigor: 4,
      items: [
        {},
        { weight: 1 }
      ]
    });

  assert.equal(result.totalWeight, 1);
});


test("une liste vide donne un poids total de 0", () => {
  const result =
    resolveEncumbrance({
      vigor: 4,
      items: []
    });

  assert.equal(result.totalWeight, 0);
});


/* ============================================================
 * ÉTATS D'ENCOMBREMENT
 * ============================================================ */


test("sous la capacité normale, le personnage n'est pas encombré", () => {
  const result =
    resolveEncumbrance({
      vigor: 4,
      items: [
        { weight: 7 }
      ]
    });

  assert.equal(result.overloaded, false);
  assert.equal(result.criticallyOverloaded, false);
  assert.equal(result.remaining, 1);
  assert.equal(result.excess, 0);
});


test("à la capacité normale exacte, le personnage n'est pas encombré", () => {
  const result =
    resolveEncumbrance({
      vigor: 4,
      items: [
        { weight: 8 }
      ]
    });

  assert.equal(result.overloaded, false);
  assert.equal(result.remaining, 0);
  assert.equal(result.excess, 0);
});


test("au-delà de la capacité normale mais sous la capacité critique, le personnage est trop encombré", () => {
  const result =
    resolveEncumbrance({
      vigor: 4,
      items: [
        { weight: 10 }
      ]
    });

  assert.equal(result.overloaded, true);
  assert.equal(result.criticallyOverloaded, false);
  assert.equal(result.remaining, 0);
  assert.equal(result.excess, 2);
});


test("au-delà de la capacité critique, le personnage est critiquement encombré", () => {
  const result =
    resolveEncumbrance({
      vigor: 4,
      items: [
        { weight: 17 }
      ]
    });

  assert.equal(result.overloaded, true);
  assert.equal(result.criticallyOverloaded, true);
  assert.equal(result.excess, 9);
});


test("à la capacité critique exacte, le personnage n'est pas critiquement encombré", () => {
  const result =
    resolveEncumbrance({
      vigor: 4,
      items: [
        { weight: 16 }
      ]
    });

  assert.equal(result.overloaded, true);
  assert.equal(result.criticallyOverloaded, false);
});


/* ============================================================
 * VALEUR DE RETOUR — champs additionnels
 * ============================================================ */


test("le résultat renvoie la Vigueur telle que fournie", () => {
  const result =
    resolveEncumbrance({
      vigor: 5,
      items: []
    });

  assert.equal(result.vigor, 5);
});
