import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveRangedAttackDamage
} from "../../../src/domain/rules/ranged-attack-damage.mjs";


test("resolveRangedAttackDamage exige un résultat de jet", () => {
  assert.throws(
    () => resolveRangedAttackDamage({
      baseDamage: 2
    }),
    TypeError
  );
});


test("resolveRangedAttackDamage exige des dégâts de base entiers et positifs ou nuls", () => {
  assert.throws(
    () => resolveRangedAttackDamage({
      rollResult: { successes: 1 },
      baseDamage: -1
    }),
    TypeError
  );

  assert.throws(
    () => resolveRangedAttackDamage({
      rollResult: { successes: 1 },
      baseDamage: 1.5
    }),
    TypeError
  );

  assert.throws(
    () => resolveRangedAttackDamage({
      rollResult: { successes: 1 }
    }),
    TypeError
  );
});


test("un jet sans réussite rate l'attaque", () => {
  assert.deepEqual(
    resolveRangedAttackDamage({
      rollResult: {
        successes: 0
      },
      baseDamage: 3
    }),
    {
      hit: false,
      successes: 0,
      baseDamage: 3,
      extraSuccesses: 0,
      bonusDamage: 0,
      rawDamage: 0
    }
  );
});


test("un rollResult sans successes est traité comme zéro réussite", () => {
  assert.deepEqual(
    resolveRangedAttackDamage({
      rollResult: {},
      baseDamage: 2
    }),
    {
      hit: false,
      successes: 0,
      baseDamage: 2,
      extraSuccesses: 0,
      bonusDamage: 0,
      rawDamage: 0
    }
  );
});


test("une seule réussite inflige uniquement les dégâts de base", () => {
  assert.deepEqual(
    resolveRangedAttackDamage({
      rollResult: {
        successes: 1
      },
      baseDamage: 3
    }),
    {
      hit: true,
      successes: 1,
      baseDamage: 3,
      extraSuccesses: 0,
      bonusDamage: 0,
      rawDamage: 3
    }
  );
});


test("les réussites au-delà de la première deviennent des réussites excédentaires", () => {
  const result =
    resolveRangedAttackDamage({
      rollResult: {
        successes: 4
      },
      baseDamage: 2
    });

  assert.equal(
    result.extraSuccesses,
    3
  );
});


test("par défaut toutes les réussites excédentaires deviennent des dégâts supplémentaires", () => {
  assert.deepEqual(
    resolveRangedAttackDamage({
      rollResult: {
        successes: 4
      },
      baseDamage: 2
    }),
    {
      hit: true,
      successes: 4,
      baseDamage: 2,
      extraSuccesses: 3,
      bonusDamage: 3,
      rawDamage: 5
    }
  );
});


test("bonusDamage permet de ne dépenser qu'une partie des réussites excédentaires en dégâts", () => {
  assert.deepEqual(
    resolveRangedAttackDamage({
      rollResult: {
        successes: 4
      },
      baseDamage: 2,
      bonusDamage: 1
    }),
    {
      hit: true,
      successes: 4,
      baseDamage: 2,
      extraSuccesses: 3,
      bonusDamage: 1,
      rawDamage: 3
    }
  );
});


test("bonusDamage peut être explicitement fixé à zéro", () => {
  assert.deepEqual(
    resolveRangedAttackDamage({
      rollResult: {
        successes: 3
      },
      baseDamage: 2,
      bonusDamage: 0
    }),
    {
      hit: true,
      successes: 3,
      baseDamage: 2,
      extraSuccesses: 2,
      bonusDamage: 0,
      rawDamage: 2
    }
  );
});


test("bonusDamage ne peut pas dépasser les réussites excédentaires", () => {
  assert.throws(
    () => resolveRangedAttackDamage({
      rollResult: {
        successes: 2
      },
      baseDamage: 2,
      bonusDamage: 2
    }),
    RangeError
  );
});


test("bonusDamage doit être un entier positif ou nul", () => {
  assert.throws(
    () => resolveRangedAttackDamage({
      rollResult: {
        successes: 3
      },
      baseDamage: 2,
      bonusDamage: -1
    }),
    TypeError
  );

  assert.throws(
    () => resolveRangedAttackDamage({
      rollResult: {
        successes: 3
      },
      baseDamage: 2,
      bonusDamage: 1.5
    }),
    TypeError
  );
});


test("le nombre de réussites doit être un entier positif ou nul", () => {
  assert.throws(
    () => resolveRangedAttackDamage({
      rollResult: {
        successes: -1
      },
      baseDamage: 2
    }),
    TypeError
  );

  assert.throws(
    () => resolveRangedAttackDamage({
      rollResult: {
        successes: 1.5
      },
      baseDamage: 2
    }),
    TypeError
  );
});


test("un échec ignore bonusDamage et retourne toujours zéro dégât", () => {
  assert.deepEqual(
    resolveRangedAttackDamage({
      rollResult: {
        successes: 0
      },
      baseDamage: 3,
      bonusDamage: 5
    }),
    {
      hit: false,
      successes: 0,
      baseDamage: 3,
      extraSuccesses: 0,
      bonusDamage: 0,
      rawDamage: 0
    }
  );
});