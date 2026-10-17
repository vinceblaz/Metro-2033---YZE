import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveMeleeBlock
} from "../../../src/domain/rules/melee-block.mjs";


/* ============================================================
 * VALIDATION
 * ============================================================ */


test("resolveMeleeBlock exige attackSuccesses", () => {
  assert.throws(
    () => resolveMeleeBlock({
      blockSuccesses: 0
    }),
    TypeError
  );
});


test("resolveMeleeBlock exige blockSuccesses", () => {
  assert.throws(
    () => resolveMeleeBlock({
      attackSuccesses: 0
    }),
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
      () => resolveMeleeBlock({
        attackSuccesses: value,
        blockSuccesses: 0
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
      () => resolveMeleeBlock({
        attackSuccesses: 0,
        blockSuccesses: value
      }),
      TypeError
    );
  }
});


/* ============================================================
 * AUCUN BLOCAGE
 * ============================================================ */


test("zéro réussite de blocage ne retire aucune réussite d'attaque", () => {
  assert.deepEqual(
    resolveMeleeBlock({
      attackSuccesses: 3,
      blockSuccesses: 0
    }),
    {
      attackSuccesses: 3,
      blockSuccesses: 0,
      cancelledSuccesses: 0,
      remainingSuccesses: 3,
      blocked: false,
      hit: true,
      canPush: false
    }
  );
});


test("une attaque avec zéro réussite reste entièrement bloquée", () => {
  assert.deepEqual(
    resolveMeleeBlock({
      attackSuccesses: 0,
      blockSuccesses: 0
    }),
    {
      attackSuccesses: 0,
      blockSuccesses: 0,
      cancelledSuccesses: 0,
      remainingSuccesses: 0,
      blocked: true,
      hit: false,
      canPush: false
    }
  );
});


/* ============================================================
 * BLOCAGE PARTIEL
 * ============================================================ */


test("une réussite de blocage annule une réussite d'attaque", () => {
  const result =
    resolveMeleeBlock({
      attackSuccesses: 3,
      blockSuccesses: 1
    });

  assert.equal(
    result.cancelledSuccesses,
    1
  );

  assert.equal(
    result.remainingSuccesses,
    2
  );

  assert.equal(
    result.blocked,
    false
  );

  assert.equal(
    result.hit,
    true
  );
});


test("un blocage partiel laisse toucher s'il reste au moins une réussite", () => {
  const result =
    resolveMeleeBlock({
      attackSuccesses: 2,
      blockSuccesses: 1
    });

  assert.equal(
    result.remainingSuccesses,
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
});


/* ============================================================
 * BLOCAGE TOTAL
 * ============================================================ */


test("un nombre égal de réussites bloque totalement l'attaque", () => {
  const result =
    resolveMeleeBlock({
      attackSuccesses: 2,
      blockSuccesses: 2
    });

  assert.equal(
    result.cancelledSuccesses,
    2
  );

  assert.equal(
    result.remainingSuccesses,
    0
  );

  assert.equal(
    result.blocked,
    true
  );

  assert.equal(
    result.hit,
    false
  );
});


test("un surplus de réussites de blocage ne fait pas descendre l'attaque sous zéro", () => {
  const result =
    resolveMeleeBlock({
      attackSuccesses: 2,
      blockSuccesses: 5
    });

  assert.equal(
    result.cancelledSuccesses,
    2
  );

  assert.equal(
    result.remainingSuccesses,
    0
  );

  assert.equal(
    result.blocked,
    true
  );

  assert.equal(
    result.hit,
    false
  );
});


test("cancelledSuccesses ne dépasse jamais le nombre de réussites d'attaque", () => {
  const result =
    resolveMeleeBlock({
      attackSuccesses: 1,
      blockSuccesses: 10
    });

  assert.equal(
    result.cancelledSuccesses,
    1
  );
});


/* ============================================================
 * CONSERVATION DES VALEURS
 * ============================================================ */


test("le resolver conserve les nombres de réussites reçus", () => {
  const result =
    resolveMeleeBlock({
      attackSuccesses: 4,
      blockSuccesses: 2
    });

  assert.equal(
    result.attackSuccesses,
    4
  );

  assert.equal(
    result.blockSuccesses,
    2
  );
});


/* ============================================================
 * PUSH
 * ============================================================ */


test("un blocage ne peut jamais être Push", () => {
  for (
    const {
      attackSuccesses,
      blockSuccesses
    }
    of [
      {
        attackSuccesses: 0,
        blockSuccesses: 0
      },
      {
        attackSuccesses: 3,
        blockSuccesses: 0
      },
      {
        attackSuccesses: 3,
        blockSuccesses: 1
      },
      {
        attackSuccesses: 3,
        blockSuccesses: 3
      },
      {
        attackSuccesses: 3,
        blockSuccesses: 10
      }
    ]
  ) {
    const result =
      resolveMeleeBlock({
        attackSuccesses,
        blockSuccesses
      });

    assert.equal(
      result.canPush,
      false
    );
  }
});


/* ============================================================
 * STRUCTURE COMPLÈTE
 * ============================================================ */


test("resolveMeleeBlock retourne la structure complète attendue", () => {
  assert.deepEqual(
    resolveMeleeBlock({
      attackSuccesses: 5,
      blockSuccesses: 2
    }),
    {
      attackSuccesses: 5,
      blockSuccesses: 2,
      cancelledSuccesses: 2,
      remainingSuccesses: 3,
      blocked: false,
      hit: true,
      canPush: false
    }
  );
});