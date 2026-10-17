import test from "node:test";
import assert from "node:assert/strict";

import { DicePool } from "../../../src/domain/rolls/dice-pool.mjs";
import { YZEResult } from "../../../src/domain/rolls/yze-result.mjs";

function createPool(overrides = {}) {
  return new DicePool({
    attribute: 3,
    skill: 2,
    equipment: 1,
    bonus: 1,
    stress: 2,
    ...overrides
  });
}

test("YZEResult exige un DicePool", () => {
  assert.throws(
    () => new YZEResult(),
    TypeError
  );

  assert.throws(
    () => new YZEResult({ pool: {} }),
    TypeError
  );
});

test("YZEResult expose correctement l'état général d'un jet", () => {
  const result = new YZEResult({
    pool: createPool(),
    successes: 2,
    pushCount: 1
  });

  assert.equal(result.success, true);
  assert.equal(result.pushed, true);
  assert.equal(result.canPush, false);
  assert.equal(result.canPushAgain(1), false);
  assert.equal(result.canPushAgain(2), true);
});

test("YZEResult considère zéro réussite comme un échec", () => {
  const result = new YZEResult({
    pool: createPool(),
    successes: 0,
    pushCount: 0
  });

  assert.equal(result.success, false);
  assert.equal(result.pushed, false);
  assert.equal(result.canPush, true);
});

test("YZEResult valide pushCount et maxPushes", () => {
  const pool = createPool();

  assert.throws(
    () => new YZEResult({ pool, pushCount: -1 }),
    TypeError
  );

  assert.throws(
    () => new YZEResult({ pool, pushCount: 1.5 }),
    TypeError
  );

  const result = new YZEResult({ pool });

  assert.throws(
    () => result.canPushAgain(-1),
    TypeError
  );

  assert.throws(
    () => result.canPushAgain(1.5),
    TypeError
  );
});

test("YZEResult conserve séparément l'origine de chaque dé", () => {
  const result = new YZEResult({
    pool: createPool(),
    dice: {
      attribute: [6, 2, 1],
      skill: [5, 1],
      equipment: [1],
      bonus: [4],
      stress: [6, 1]
    }
  });

  assert.deepEqual(result.attributeResults, [6, 2, 1]);
  assert.deepEqual(result.skillResults, [5, 1]);
  assert.deepEqual(result.equipmentResults, [1]);
  assert.deepEqual(result.bonusResults, [4]);
  assert.deepEqual(result.stressDice, [6, 1]);

  assert.deepEqual(
    result.normalDice,
    [6, 2, 1, 5, 1, 1, 4]
  );

  assert.equal(result.diceCount, 9);
});

test("YZEResult expose la composition du DicePool", () => {
  const result = new YZEResult({
    pool: createPool({ penalty: 2 })
  });

  assert.equal(result.attributeDice, 3);
  assert.equal(result.skillDice, 2);
  assert.equal(result.equipmentDice, 1);
  assert.equal(result.bonusDice, 1);
  assert.equal(result.stressPoolDice, 2);
  assert.equal(result.penaltyDice, 2);
});

test("les 1 normaux ne deviennent des afflictions qu'après un Push", () => {
  const dice = {
    attribute: [1, 4],
    skill: [1],
    equipment: [1],
    bonus: [1],
    stress: []
  };

  const initial = new YZEResult({
    pool: createPool({ stress: 0 }),
    dice,
    pushCount: 0
  });

  assert.equal(initial.attributeOnes, 1);
  assert.equal(initial.skillOnes, 1);
  assert.equal(initial.equipmentOnes, 1);
  assert.equal(initial.bonusOnes, 1);
  assert.equal(initial.normalOnes, 4);
  assert.equal(initial.normalAfflictions, 0);
  assert.equal(initial.afflictions, 0);

  const pushed = new YZEResult({
    pool: createPool({ stress: 0 }),
    dice,
    pushCount: 1
  });

  assert.equal(pushed.normalOnes, 4);
  assert.equal(pushed.normalAfflictions, 4);
  assert.equal(pushed.afflictions, 4);
});

test("les afflictions de Stress sont ajoutées aux afflictions normales", () => {
  const result = new YZEResult({
    pool: createPool(),
    dice: {
      attribute: [1, 6],
      skill: [1, 3],
      stress: [1, 5]
    },
    pushCount: 1,
    stressAfflictions: 2
  });

  assert.equal(result.stressOnes, 1);
  assert.equal(result.normalAfflictions, 2);
  assert.equal(result.stressAfflictions, 2);
  assert.equal(result.afflictions, 4);
});

test("YZEResult copie les tableaux de dés, l'historique et le contexte à la construction", () => {
  const dice = {
    attribute: [6, 3],
    skill: [4],
    equipment: [2],
    bonus: [5],
    stress: [1]
  };

  const history = [{ push: 0 }];
  const context = { action: "test" };

  const result = new YZEResult({
    pool: createPool(),
    dice,
    history,
    context
  });

  dice.attribute.push(1);
  history.push({ push: 1 });
  context.action = "modifié";

  assert.deepEqual(result.attributeResults, [6, 3]);
  assert.deepEqual(result.history, [{ push: 0 }]);
  assert.deepEqual(result.context, { action: "test" });
});

test("les getters de résultats de dés renvoient des copies", () => {
  const result = new YZEResult({
    pool: createPool(),
    dice: {
      attribute: [6, 2],
      stress: [1, 4]
    }
  });

  const attributes = result.attributeResults;
  const stress = result.stressDice;
  const normal = result.normalDice;

  attributes.push(1);
  stress.push(6);
  normal.push(3);

  assert.deepEqual(result.attributeResults, [6, 2]);
  assert.deepEqual(result.stressDice, [1, 4]);
  assert.deepEqual(result.normalDice, [6, 2]);
});