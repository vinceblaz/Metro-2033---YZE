import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveMeleeAttack
} from "../../../src/domain/rules/melee-attack-resolution.mjs";


/* ============================================================
 * VALIDATION
 * ============================================================ */


test("resolveMeleeAttack exige attackSuccesses", () => {
  assert.throws(
    () => resolveMeleeAttack(),
    TypeError
  );
});


test("attackSuccesses doit être un entier positif ou nul", () => {
  for (
    const value
    of [
      -1,
      1.5,
      "2",
      null
    ]
  ) {
    assert.throws(
      () => resolveMeleeAttack({
        attackSuccesses: value
      }),
      TypeError
    );
  }
});


test("blockSuccesses doit être un entier positif ou nul", () => {
  for (
    const value
    of [
      -1,
      1.5,
      "2",
      null
    ]
  ) {
    assert.throws(
      () => resolveMeleeAttack({
        attackSuccesses: 1,
        blockSuccesses: value
      }),
      TypeError
    );
  }
});


test("blockSuccesses vaut zéro par défaut", () => {
  const result =
    resolveMeleeAttack({
      attackSuccesses: 1
    });

  assert.equal(
    result.blockSuccesses,
    0
  );
});


/* ============================================================
 * SANS BLOCAGE
 * ============================================================ */


test("sans blocage, zéro réussite signifie que l'attaque rate", () => {
  assert.deepEqual(
    resolveMeleeAttack({
      attackSuccesses: 0
    }),
    {
      attackSuccesses: 0,
      blockAttempted: false,
      blockSuccesses: 0,
      cancelledSuccesses: 0,
      effectiveSuccesses: 0,
      hit: false,
      blocked: false,
      extraSuccesses: 0
    }
  );
});


test("sans blocage, une réussite suffit pour toucher", () => {
  assert.deepEqual(
    resolveMeleeAttack({
      attackSuccesses: 1
    }),
    {
      attackSuccesses: 1,
      blockAttempted: false,
      blockSuccesses: 0,
      cancelledSuccesses: 0,
      effectiveSuccesses: 1,
      hit: true,
      blocked: false,
      extraSuccesses: 0
    }
  );
});


test("sans blocage, les réussites au-delà de la première deviennent excédentaires", () => {
  const result =
    resolveMeleeAttack({
      attackSuccesses: 4
    });

  assert.equal(
    result.effectiveSuccesses,
    4
  );

  assert.equal(
    result.extraSuccesses,
    3
  );
});


test("sans blocage déclaré, blockSuccesses est ignoré dans la résolution", () => {
  const result =
    resolveMeleeAttack({
      attackSuccesses: 3,
      blockSuccesses: 2,
      blockAttempted: false
    });

  assert.deepEqual(
    result,
    {
      attackSuccesses: 3,
      blockAttempted: false,
      blockSuccesses: 0,
      cancelledSuccesses: 0,
      effectiveSuccesses: 3,
      hit: true,
      blocked: false,
      extraSuccesses: 2
    }
  );
});


test("sans blocage, blocked reste false même si l'attaque échoue", () => {
  const result =
    resolveMeleeAttack({
      attackSuccesses: 0,
      blockAttempted: false
    });

  assert.equal(
    result.hit,
    false
  );

  assert.equal(
    result.blocked,
    false
  );
});


/* ============================================================
 * BLOCAGE DÉCLARÉ
 * ============================================================ */


test("un blocage déclaré avec zéro réussite ne change pas l'attaque", () => {
  assert.deepEqual(
    resolveMeleeAttack({
      attackSuccesses: 3,
      blockSuccesses: 0,
      blockAttempted: true
    }),
    {
      attackSuccesses: 3,
      blockAttempted: true,
      blockSuccesses: 0,
      cancelledSuccesses: 0,
      effectiveSuccesses: 3,
      hit: true,
      blocked: false,
      extraSuccesses: 2
    }
  );
});


test("un blocage partiel réduit les réussites effectives", () => {
  const result =
    resolveMeleeAttack({
      attackSuccesses: 4,
      blockSuccesses: 1,
      blockAttempted: true
    });

  assert.equal(
    result.cancelledSuccesses,
    1
  );

  assert.equal(
    result.effectiveSuccesses,
    3
  );

  assert.equal(
    result.hit,
    true
  );
});


test("les réussites excédentaires sont calculées après le blocage", () => {
  const result =
    resolveMeleeAttack({
      attackSuccesses: 4,
      blockSuccesses: 2,
      blockAttempted: true
    });

  assert.equal(
    result.effectiveSuccesses,
    2
  );

  assert.equal(
    result.extraSuccesses,
    1
  );
});


test("si le blocage ne laisse qu'une réussite, l'attaque touche sans réussite excédentaire", () => {
  const result =
    resolveMeleeAttack({
      attackSuccesses: 3,
      blockSuccesses: 2,
      blockAttempted: true
    });

  assert.equal(
    result.effectiveSuccesses,
    1
  );

  assert.equal(
    result.hit,
    true
  );

  assert.equal(
    result.blocked,
    false
  );

  assert.equal(
    result.extraSuccesses,
    0
  );
});


test("un blocage égal aux réussites d'attaque bloque totalement", () => {
  const result =
    resolveMeleeAttack({
      attackSuccesses: 3,
      blockSuccesses: 3,
      blockAttempted: true
    });

  assert.equal(
    result.cancelledSuccesses,
    3
  );

  assert.equal(
    result.effectiveSuccesses,
    0
  );

  assert.equal(
    result.hit,
    false
  );

  assert.equal(
    result.blocked,
    true
  );

  assert.equal(
    result.extraSuccesses,
    0
  );
});


test("un surplus de réussites de blocage ne produit pas de réussites négatives", () => {
  const result =
    resolveMeleeAttack({
      attackSuccesses: 2,
      blockSuccesses: 5,
      blockAttempted: true
    });

  assert.equal(
    result.cancelledSuccesses,
    2
  );

  assert.equal(
    result.effectiveSuccesses,
    0
  );

  assert.equal(
    result.hit,
    false
  );

  assert.equal(
    result.blocked,
    true
  );

  assert.equal(
    result.extraSuccesses,
    0
  );
});


test("une attaque à zéro réussite avec blocage déclaré est considérée bloquée", () => {
  const result =
    resolveMeleeAttack({
      attackSuccesses: 0,
      blockSuccesses: 0,
      blockAttempted: true
    });

  assert.equal(
    result.hit,
    false
  );

  assert.equal(
    result.blocked,
    true
  );
});


/* ============================================================
 * STRICTESSE DE blockAttempted
 * ============================================================ */


test("seule une valeur truthy de blockAttempted déclenche actuellement la branche de blocage", () => {
  for (
    const value
    of [
      true,
      1,
      "true",
      {}
    ]
  ) {
    const result =
      resolveMeleeAttack({
        attackSuccesses: 2,
        blockSuccesses: 1,
        blockAttempted: value
      });

    assert.equal(
      result.blockAttempted,
      true
    );

    assert.equal(
      result.cancelledSuccesses,
      1
    );
  }
});


test("une valeur falsy de blockAttempted suit la branche sans blocage", () => {
  for (
    const value
    of [
      false,
      0,
      "",
      null,
      undefined
    ]
  ) {
    const result =
      resolveMeleeAttack({
        attackSuccesses: 2,
        blockSuccesses: 1,
        blockAttempted: value
      });

    assert.equal(
      result.blockAttempted,
      false
    );

    assert.equal(
      result.blockSuccesses,
      0
    );

    assert.equal(
      result.cancelledSuccesses,
      0
    );
  }
});


/* ============================================================
 * STRUCTURE COMPLÈTE
 * ============================================================ */


test("resolveMeleeAttack retourne la structure complète attendue après blocage partiel", () => {
  assert.deepEqual(
    resolveMeleeAttack({
      attackSuccesses: 5,
      blockSuccesses: 2,
      blockAttempted: true
    }),
    {
      attackSuccesses: 5,
      blockAttempted: true,
      blockSuccesses: 2,
      cancelledSuccesses: 2,
      effectiveSuccesses: 3,
      hit: true,
      blocked: false,
      extraSuccesses: 2
    }
  );
});