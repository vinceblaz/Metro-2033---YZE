import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveArmorRepair
} from "../../../src/domain/rules/armor-repair.mjs";


/* ============================================================
 * VALIDATION — current
 * ============================================================ */


test("current doit être un entier positif ou nul", () => {
  for (
    const current
    of [
      -1,
      1.5,
      "1",
      NaN,
      Infinity,
      false
    ]
  ) {
    assert.throws(
      () =>
        resolveArmorRepair({
          current,
          max: 3,
          successes: 1
        }),
      TypeError
    );
  }
});


test("l'erreur de current possède le message attendu", () => {
  assert.throws(
    () =>
      resolveArmorRepair({
        current: -1,
        max: 3,
        successes: 1
      }),
    {
      name: "TypeError",
      message:
        "La Protection actuelle doit être un entier positif ou nul."
    }
  );
});


/* ============================================================
 * VALIDATION — max
 * ============================================================ */


test("max doit être un entier positif ou nul", () => {
  for (
    const max
    of [
      -1,
      1.5,
      "3",
      NaN,
      Infinity,
      false
    ]
  ) {
    assert.throws(
      () =>
        resolveArmorRepair({
          current: 0,
          max,
          successes: 1
        }),
      TypeError
    );
  }
});


test("l'erreur de max possède le message attendu", () => {
  assert.throws(
    () =>
      resolveArmorRepair({
        current: 0,
        max: -1,
        successes: 1
      }),
    {
      name: "TypeError",
      message:
        "La Protection maximale doit être un entier positif ou nul."
    }
  );
});


/* ============================================================
 * VALIDATION — COHÉRENCE current / max
 * ============================================================ */


test("current ne peut pas dépasser max", () => {
  assert.throws(
    () =>
      resolveArmorRepair({
        current: 4,
        max: 3,
        successes: 1
      }),
    {
      name: "RangeError",
      message:
        "La Protection actuelle ne peut pas dépasser la Protection maximale."
    }
  );
});


test("la cohérence current/max est vérifiée avant successes", () => {
  assert.throws(
    () =>
      resolveArmorRepair({
        current: 4,
        max: 3,
        successes: -1
      }),
    {
      name: "RangeError",
      message:
        "La Protection actuelle ne peut pas dépasser la Protection maximale."
    }
  );
});


/* ============================================================
 * VALIDATION — successes
 * ============================================================ */


test("successes doit être un entier positif ou nul", () => {
  for (
    const successes
    of [
      -1,
      1.5,
      "2",
      NaN,
      Infinity,
      false
    ]
  ) {
    assert.throws(
      () =>
        resolveArmorRepair({
          current: 1,
          max: 3,
          successes
        }),
      TypeError
    );
  }
});


test("l'erreur de successes possède le message attendu", () => {
  assert.throws(
    () =>
      resolveArmorRepair({
        current: 1,
        max: 3,
        successes: -1
      }),
    {
      name: "TypeError",
      message:
        "Le nombre de réussites doit être un entier positif ou nul."
    }
  );
});


/* ============================================================
 * ÉTAT NON ENDOMMAGÉ
 * ============================================================ */


test("une Protection déjà au maximum n'est pas considérée comme endommagée", () => {
  assert.throws(
    () =>
      resolveArmorRepair({
        current: 3,
        max: 3,
        successes: 1
      }),
    {
      message:
        "Cette protection n'est pas endommagée."
    }
  );
});


/* ============================================================
 * RÉPARATION NORMALE
 * ============================================================ */


test("une réussite restaure un point de Protection", () => {
  assert.deepEqual(
    resolveArmorRepair({
      current: 2,
      max: 4,
      successes: 1
    }),
    {
      success: true,
      previous: 2,
      current: 3,
      max: 4,
      restored: 1,
      successes: 1,
      successesUsed: 1,
      unusedSuccesses: 0,
      fullyRepaired: false,
      hasResilience: false,
      resilienceWasLost: false,
      resilienceLost: false,
      resilienceRestored: false,
      broken: false
    }
  );
});


test("plusieurs réussites restaurent autant de points que possible", () => {
  const result =
    resolveArmorRepair({
      current: 1,
      max: 5,
      successes: 3
    });

  assert.equal(
    result.current,
    4
  );

  assert.equal(
    result.restored,
    3
  );

  assert.equal(
    result.successesUsed,
    3
  );

  assert.equal(
    result.unusedSuccesses,
    0
  );
});


test("la réparation est plafonnée à la Protection maximale", () => {
  const result =
    resolveArmorRepair({
      current: 3,
      max: 4,
      successes: 5
    });

  assert.equal(
    result.current,
    4
  );

  assert.equal(
    result.restored,
    1
  );

  assert.equal(
    result.successesUsed,
    1
  );

  assert.equal(
    result.unusedSuccesses,
    4
  );
});


test("previous conserve la Protection avant réparation", () => {
  const result =
    resolveArmorRepair({
      current: 2,
      max: 5,
      successes: 2
    });

  assert.equal(
    result.previous,
    2
  );

  assert.equal(
    result.current,
    4
  );
});


test("fullyRepaired vaut true lorsque la Protection atteint son maximum", () => {
  const result =
    resolveArmorRepair({
      current: 2,
      max: 4,
      successes: 2
    });

  assert.equal(
    result.fullyRepaired,
    true
  );
});


/* ============================================================
 * RÉPARATION DEPUIS PROTECTION 0
 * ============================================================ */


test("une seule réussite suffit à restaurer un point depuis Protection 0", () => {
  const result =
    resolveArmorRepair({
      current: 0,
      max: 3,
      successes: 1
    });

  assert.equal(
    result.success,
    true
  );

  assert.equal(
    result.previous,
    0
  );

  assert.equal(
    result.current,
    1
  );

  assert.equal(
    result.restored,
    1
  );
});


test("deux réussites restaurent deux points depuis Protection 0", () => {
  const result =
    resolveArmorRepair({
      current: 0,
      max: 4,
      successes: 2
    });

  assert.equal(
    result.current,
    2
  );

  assert.equal(
    result.restored,
    2
  );

  assert.equal(
    result.successesUsed,
    2
  );
});


test("une réparation depuis Protection 0 peut atteindre directement le maximum", () => {
  const result =
    resolveArmorRepair({
      current: 0,
      max: 2,
      successes: 4
    });

  assert.equal(
    result.current,
    2
  );

  assert.equal(
    result.fullyRepaired,
    true
  );

  assert.equal(
    result.successesUsed,
    2
  );

  assert.equal(
    result.unusedSuccesses,
    2
  );
});


/* ============================================================
 * ÉCHEC
 * ============================================================ */


test("zéro réussite ne modifie pas une Protection endommagée", () => {
  assert.deepEqual(
    resolveArmorRepair({
      current: 2,
      max: 4,
      successes: 0
    }),
    {
      success: false,
      previous: 2,
      current: 2,
      max: 4,
      restored: 0,
      successes: 0,
      successesUsed: 0,
      unusedSuccesses: 0,
      fullyRepaired: false,
      hasResilience: false,
      resilienceWasLost: false,
      resilienceLost: false,
      resilienceRestored: false,
      broken: false
    }
  );
});


test("zéro réussite depuis Protection 0 ne détruit pas définitivement la protection", () => {
  const result =
    resolveArmorRepair({
      current: 0,
      max: 3,
      successes: 0
    });

  assert.equal(
    result.success,
    false
  );

  assert.equal(
    result.current,
    0
  );

  assert.equal(
    result.broken,
    true
  );
});


/* ============================================================
 * RÉSILIENCE
 * ============================================================ */


test("une Résilience non perdue reste non perdue pendant une réparation partielle", () => {
  const result =
    resolveArmorRepair({
      current: 1,
      max: 3,
      successes: 1,
      hasResilience: true,
      resilienceLost: false
    });

  assert.equal(
    result.hasResilience,
    true
  );

  assert.equal(
    result.resilienceWasLost,
    false
  );

  assert.equal(
    result.resilienceLost,
    false
  );

  assert.equal(
    result.resilienceRestored,
    false
  );
});


test("une Résilience perdue reste perdue tant que la Protection n'est pas au maximum", () => {
  const result =
    resolveArmorRepair({
      current: 0,
      max: 3,
      successes: 1,
      hasResilience: true,
      resilienceLost: true
    });

  assert.equal(
    result.fullyRepaired,
    false
  );

  assert.equal(
    result.resilienceWasLost,
    true
  );

  assert.equal(
    result.resilienceLost,
    true
  );

  assert.equal(
    result.resilienceRestored,
    false
  );
});


test("une Résilience perdue est restaurée lorsque la Protection atteint son maximum", () => {
  const result =
    resolveArmorRepair({
      current: 1,
      max: 3,
      successes: 2,
      hasResilience: true,
      resilienceLost: true
    });

  assert.equal(
    result.fullyRepaired,
    true
  );

  assert.equal(
    result.resilienceWasLost,
    true
  );

  assert.equal(
    result.resilienceLost,
    false
  );

  assert.equal(
    result.resilienceRestored,
    true
  );
});


test("des réussites excédentaires n'empêchent pas la restauration de Résilience", () => {
  const result =
    resolveArmorRepair({
      current: 2,
      max: 3,
      successes: 5,
      hasResilience: true,
      resilienceLost: true
    });

  assert.equal(
    result.current,
    3
  );

  assert.equal(
    result.unusedSuccesses,
    4
  );

  assert.equal(
    result.resilienceLost,
    false
  );

  assert.equal(
    result.resilienceRestored,
    true
  );
});


test("resilienceLost ne peut rester vrai dans le résultat si l'équipement n'a pas Résilience", () => {
  const result =
    resolveArmorRepair({
      current: 1,
      max: 3,
      successes: 1,
      hasResilience: false,
      resilienceLost: true
    });

  assert.equal(
    result.resilienceWasLost,
    true
  );

  assert.equal(
    result.resilienceLost,
    false
  );

  assert.equal(
    result.resilienceRestored,
    false
  );
});


test("hasResilience et resilienceLost utilisent actuellement la vérité JavaScript", () => {
  const result =
    resolveArmorRepair({
      current: 1,
      max: 3,
      successes: 1,
      hasResilience: "yes",
      resilienceLost: 1
    });

  assert.equal(
    result.hasResilience,
    "yes"
  );

  assert.equal(
    result.resilienceWasLost,
    1
  );

  assert.equal(
    result.resilienceLost,
    true
  );

  assert.equal(
    result.resilienceRestored,
    false
  );
});


/* ============================================================
 * CAS LIMITES ET STRUCTURE
 * ============================================================ */


test("max égal à zéro avec current égal à zéro est considéré comme non endommagé", () => {
  assert.throws(
    () =>
      resolveArmorRepair({
        current: 0,
        max: 0,
        successes: 1
      }),
    {
      message:
        "Cette protection n'est pas endommagée."
    }
  );
});


test("broken vaut true uniquement si la Protection finale vaut zéro", () => {
  const broken =
    resolveArmorRepair({
      current: 0,
      max: 3,
      successes: 0
    });

  const repaired =
    resolveArmorRepair({
      current: 0,
      max: 3,
      successes: 1
    });

  assert.equal(
    broken.broken,
    true
  );

  assert.equal(
    repaired.broken,
    false
  );
});


test("le nombre original de réussites est conservé dans le résultat", () => {
  const result =
    resolveArmorRepair({
      current: 2,
      max: 3,
      successes: 5
    });

  assert.equal(
    result.successes,
    5
  );

  assert.equal(
    result.successesUsed,
    1
  );

  assert.equal(
    result.unusedSuccesses,
    4
  );
});