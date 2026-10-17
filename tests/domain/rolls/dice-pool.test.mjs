import test from "node:test";
import assert from "node:assert/strict";

import { DicePool } from "../../../src/domain/rolls/dice-pool.mjs";


test("DicePool crée un pool vide par défaut", () => {
  const pool = new DicePool();

  assert.equal(pool.attribute, 0);
  assert.equal(pool.skill, 0);
  assert.equal(pool.equipment, 0);
  assert.equal(pool.stress, 0);
  assert.equal(pool.bonus, 0);
  assert.equal(pool.penalty, 0);

  assert.equal(pool.normalDice, 0);
  assert.equal(pool.effectiveNormalDice, 0);
  assert.equal(pool.total, 0);
  assert.equal(pool.hasStress, false);
});


test("DicePool additionne les sources normales avant malus", () => {
  const pool = new DicePool({
    attribute: 4,
    skill: 3,
    equipment: 2,
    bonus: 1,
    stress: 2
  });

  assert.equal(pool.normalDice, 10);
  assert.equal(pool.effectiveNormalDice, 10);
  assert.equal(pool.total, 12);
});


test("DicePool applique le malus uniquement aux dés normaux", () => {
  const pool = new DicePool({
    attribute: 4,
    skill: 3,
    equipment: 2,
    bonus: 1,
    stress: 2,
    penalty: 3
  });

  assert.equal(pool.normalDice, 10);
  assert.equal(pool.effectiveNormalDice, 7);
  assert.equal(pool.total, 9);
});


test("DicePool ne produit jamais un nombre négatif de dés normaux effectifs", () => {
  const pool = new DicePool({
    attribute: 2,
    skill: 1,
    penalty: 10
  });

  assert.equal(pool.normalDice, 3);
  assert.equal(pool.effectiveNormalDice, 0);
  assert.equal(pool.total, 0);
});


test("DicePool conserve les dés de Stress même si le malus annule les dés normaux", () => {
  const pool = new DicePool({
    attribute: 2,
    skill: 1,
    stress: 2,
    penalty: 10
  });

  assert.equal(pool.effectiveNormalDice, 0);
  assert.equal(pool.total, 2);
  assert.equal(pool.hasStress, true);
});


test("DicePool indique correctement l'absence ou la présence de Stress", () => {
  assert.equal(
    new DicePool({ stress: 0 }).hasStress,
    false
  );

  assert.equal(
    new DicePool({ stress: 1 }).hasStress,
    true
  );
});


test("DicePool rejette les valeurs non entières", () => {
  assert.throws(
    () => new DicePool({
      attribute: 2.5
    }),
    TypeError
  );
});


test("DicePool rejette les valeurs négatives", () => {
  assert.throws(
    () => new DicePool({
      attribute: -1
    }),
    RangeError
  );
});