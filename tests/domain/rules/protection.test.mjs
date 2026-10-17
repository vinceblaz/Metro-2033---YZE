import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveProtectionDamage
} from "../../../src/domain/rules/protection-damage.mjs";


test("resolveProtectionDamage conserve la Protection si les dégâts sont nuls", () => {
  assert.deepEqual(
    resolveProtectionDamage({
      current: 5,
      damage: 0
    }),
    {
      previous: 5,
      current: 5,
      requestedDamage: 0,
      lost: 0,
      overflow: 0,
      broken: false,
      becameBroken: false
    }
  );
});


test("resolveProtectionDamage réduit correctement la Protection", () => {
  assert.deepEqual(
    resolveProtectionDamage({
      current: 5,
      damage: 2
    }),
    {
      previous: 5,
      current: 3,
      requestedDamage: 2,
      lost: 2,
      overflow: 0,
      broken: false,
      becameBroken: false
    }
  );
});


test("resolveProtectionDamage peut réduire exactement la Protection à zéro", () => {
  assert.deepEqual(
    resolveProtectionDamage({
      current: 5,
      damage: 5
    }),
    {
      previous: 5,
      current: 0,
      requestedDamage: 5,
      lost: 5,
      overflow: 0,
      broken: true,
      becameBroken: true
    }
  );
});


test("resolveProtectionDamage ne permet jamais une Protection négative", () => {
  assert.deepEqual(
    resolveProtectionDamage({
      current: 3,
      damage: 8
    }),
    {
      previous: 3,
      current: 0,
      requestedDamage: 8,
      lost: 3,
      overflow: 5,
      broken: true,
      becameBroken: true
    }
  );
});


test("overflow indique les dégâts de Protection excédant la valeur disponible", () => {
  const result = resolveProtectionDamage({
    current: 2,
    damage: 7
  });

  assert.equal(
    result.lost,
    2
  );

  assert.equal(
    result.overflow,
    5
  );

  assert.equal(
    result.current,
    0
  );
});


test("une Protection déjà à zéro reste brisée même sans dégât", () => {
  assert.deepEqual(
    resolveProtectionDamage({
      current: 0,
      damage: 0
    }),
    {
      previous: 0,
      current: 0,
      requestedDamage: 0,
      lost: 0,
      overflow: 0,
      broken: true,
      becameBroken: false
    }
  );
});


test("une Protection déjà à zéro transforme tous les dégâts en overflow", () => {
  assert.deepEqual(
    resolveProtectionDamage({
      current: 0,
      damage: 4
    }),
    {
      previous: 0,
      current: 0,
      requestedDamage: 4,
      lost: 0,
      overflow: 4,
      broken: true,
      becameBroken: false
    }
  );
});


test("resolveProtectionDamage rejette une Protection négative", () => {
  assert.throws(
    () => resolveProtectionDamage({
      current: -1,
      damage: 1
    }),
    TypeError
  );
});


test("resolveProtectionDamage rejette des dégâts négatifs", () => {
  assert.throws(
    () => resolveProtectionDamage({
      current: 3,
      damage: -1
    }),
    TypeError
  );
});


test("resolveProtectionDamage rejette les valeurs non entières", () => {
  assert.throws(
    () => resolveProtectionDamage({
      current: 2.5,
      damage: 1
    }),
    TypeError
  );

  assert.throws(
    () => resolveProtectionDamage({
      current: 3,
      damage: 1.5
    }),
    TypeError
  );
});


test("resolveProtectionDamage rejette les valeurs absentes", () => {
  assert.throws(
    () => resolveProtectionDamage(),
    TypeError
  );

  assert.throws(
    () => resolveProtectionDamage({
      current: 3
    }),
    TypeError
  );

  assert.throws(
    () => resolveProtectionDamage({
      damage: 1
    }),
    TypeError
  );
});

test(
    "resolveProtectionDamage considère comme brisée une Protection déjà à zéro",
    () => {

        const result =
            resolveProtectionDamage({
                current:
                    0,

                damage:
                    2
            });


        assert.deepEqual(
            result,
            {
                previous:
                    0,

                current:
                    0,

                requestedDamage:
                    2,

                lost:
                    0,

                overflow:
                    2,

                broken:
                    true,
      becameBroken: false
            }
        );

    }
);

test(
    "resolveProtectionDamage indique lorsque la Protection vient d'être brisée",
    () => {

        const result =
            resolveProtectionDamage({
                current:
                    2,

                damage:
                    2
            });


        assert.equal(
            result.broken,
            true
        );

        assert.equal(
            result.becameBroken,
            true
        );

    }
);