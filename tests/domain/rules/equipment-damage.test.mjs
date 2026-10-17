import test from "node:test";
import assert from "node:assert/strict";

import {
  rollReliability
} from "../../../src/domain/rules/equipment-damage.mjs";


/* ============================================================
 * HELPERS
 * ============================================================ */


function withRandomSequence(
  values,
  callback
) {

  const originalRandom =
    Math.random;

  let index = 0;

  Math.random = () => {
    const value =
      values[index];

    index += 1;

    return value;
  };

  try {
    return callback();
  }
  finally {
    Math.random =
      originalRandom;
  }

}


/* ============================================================
 * VALEUR PAR DÉFAUT
 * ============================================================ */


test("rollReliability utilise une Fiabilité de zéro par défaut", () => {
  assert.deepEqual(
    rollReliability(),
    {
      reliability: 0,
      dice: [],
      successes: 0,
      success: false
    }
  );
});


test("une Fiabilité explicitement égale à zéro produit aucun dé", () => {
  assert.deepEqual(
    rollReliability(0),
    {
      reliability: 0,
      dice: [],
      successes: 0,
      success: false
    }
  );
});


test("Math.random n'est pas appelé lorsque la Fiabilité vaut zéro", () => {
  const originalRandom =
    Math.random;

  let calls = 0;

  Math.random = () => {
    calls += 1;
    return 0;
  };

  try {
    rollReliability(0);
  }
  finally {
    Math.random =
      originalRandom;
  }

  assert.equal(
    calls,
    0
  );
});


/* ============================================================
 * VALIDATION
 * ============================================================ */


test("une Fiabilité négative est refusée", () => {
  assert.throws(
    () =>
      rollReliability(-1),
    {
      name: "TypeError",
      message:
        "La Fiabilité doit être un entier positif ou nul."
    }
  );
});


test("une Fiabilité décimale est refusée", () => {
  assert.throws(
    () =>
      rollReliability(1.5),
    TypeError
  );
});


test("une Fiabilité numérique sous forme de chaîne est refusée", () => {
  assert.throws(
    () =>
      rollReliability("3"),
    TypeError
  );
});


test("NaN comme Fiabilité est refusé", () => {
  assert.throws(
    () =>
      rollReliability(NaN),
    TypeError
  );
});


test("Infinity comme Fiabilité est refusé", () => {
  assert.throws(
    () =>
      rollReliability(Infinity),
    TypeError
  );
});


test("une valeur booléenne n'est pas acceptée comme Fiabilité", () => {
  assert.throws(
    () =>
      rollReliability(false),
    TypeError
  );
});


/* ============================================================
 * GÉNÉRATION DES DÉS
 * ============================================================ */


test("Math.random égal à zéro produit une face de 1", () => {
  const result =
    withRandomSequence(
      [
        0
      ],
      () =>
        rollReliability(1)
    );

  assert.deepEqual(
    result.dice,
    [
      1
    ]
  );
});


test("une valeur aléatoire correspondant à la borne du 6 produit une face de 6", () => {
  const result =
    withRandomSequence(
      [
        5 / 6
      ],
      () =>
        rollReliability(1)
    );

  assert.deepEqual(
    result.dice,
    [
      6
    ]
  );
});


test("rollReliability appelle Math.random une fois par point de Fiabilité", () => {
  const originalRandom =
    Math.random;

  let calls = 0;

  Math.random = () => {
    calls += 1;
    return 0;
  };

  try {
    rollReliability(4);
  }
  finally {
    Math.random =
      originalRandom;
  }

  assert.equal(
    calls,
    4
  );
});


test("les résultats des dés conservent leur ordre de génération", () => {
  const result =
    withRandomSequence(
      [
        0,
        1 / 6,
        2 / 6,
        3 / 6,
        4 / 6,
        5 / 6
      ],
      () =>
        rollReliability(6)
    );

  assert.deepEqual(
    result.dice,
    [
      1,
      2,
      3,
      4,
      5,
      6
    ]
  );
});


/* ============================================================
 * SUCCÈS
 * ============================================================ */


test("un jet sans aucun 6 produit zéro succès", () => {
  const result =
    withRandomSequence(
      [
        0,
        1 / 6,
        4 / 6
      ],
      () =>
        rollReliability(3)
    );

  assert.equal(
    result.successes,
    0
  );

  assert.equal(
    result.success,
    false
  );
});


test("un seul 6 suffit pour réussir le jet de Fiabilité", () => {
  const result =
    withRandomSequence(
      [
        0,
        5 / 6,
        1 / 6
      ],
      () =>
        rollReliability(3)
    );

  assert.equal(
    result.successes,
    1
  );

  assert.equal(
    result.success,
    true
  );
});


test("plusieurs 6 sont tous comptés comme succès", () => {
  const result =
    withRandomSequence(
      [
        5 / 6,
        0,
        5 / 6,
        5 / 6
      ],
      () =>
        rollReliability(4)
    );

  assert.equal(
    result.successes,
    3
  );

  assert.equal(
    result.success,
    true
  );
});


/* ============================================================
 * STRUCTURE DU RÉSULTAT
 * ============================================================ */


test("le résultat conserve la valeur de Fiabilité utilisée", () => {
  const result =
    withRandomSequence(
      [
        0,
        0,
        0
      ],
      () =>
        rollReliability(3)
    );

  assert.equal(
    result.reliability,
    3
  );
});


test("chaque appel retourne son propre tableau de dés", () => {
  const first =
    withRandomSequence(
      [
        0
      ],
      () =>
        rollReliability(1)
    );

  const second =
    withRandomSequence(
      [
        0
      ],
      () =>
        rollReliability(1)
    );

  assert.notEqual(
    first.dice,
    second.dice
  );

  assert.deepEqual(
    first.dice,
    second.dice
  );
});
