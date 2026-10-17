import test from "node:test";
import assert from "node:assert/strict";

import { DicePool } from "../../../src/domain/rolls/dice-pool.mjs";
import { YZERoll } from "../../../src/domain/rolls/yze-roll.mjs";


/* ============================================================
 * countInitialDiceToRoll
 *
 * Doit permettre à une intégration externe (ex. Foundry) de
 * savoir, AVANT tout lancer, combien de dés physiques demander.
 * ============================================================ */

test("countInitialDiceToRoll exige un DicePool", () => {
  assert.throws(
    () => YZERoll.countInitialDiceToRoll(null),
    TypeError
  );
});


test("countInitialDiceToRoll retourne les dés normaux effectifs et le Stress séparément", () => {
  const pool = new DicePool({
    attribute: 4,
    skill: 3,
    equipment: 1,
    bonus: 1,
    stress: 2,
    penalty: 2
  });

  const counts = YZERoll.countInitialDiceToRoll(pool);

  // normalDice = 9, penalty = 2 => effectiveNormalDice = 7
  assert.equal(counts.normal, 7);
  assert.equal(counts.stress, 2);
  assert.equal(counts.total, 9);
});


test("countInitialDiceToRoll sur un pool vide retourne des zéros", () => {
  const counts = YZERoll.countInitialDiceToRoll(new DicePool());

  assert.deepEqual(counts, { normal: 0, stress: 0, total: 0 });
});


/* ============================================================
 * countPushDiceToRoll
 * ============================================================ */

test("countPushDiceToRoll exige un YZEResult", () => {
  assert.throws(
    () => YZERoll.countPushDiceToRoll(null),
    TypeError
  );
});


test("countPushDiceToRoll rejette un additionalStressDice invalide", () => {
  const pool = new DicePool({ attribute: 2, stress: 1 });
  const result = YZERoll.roll(pool);

  assert.throws(
    () => YZERoll.countPushDiceToRoll(result, { additionalStressDice: -1 }),
    TypeError
  );
});


test("countPushDiceToRoll ne compte que les dés normaux autres que des 6, plus tout le Stress en jeu", () => {
  // Forcer des valeurs connues via un drawDie déterministe.
  const pool = new DicePool({ attribute: 4, stress: 2 });

  // Faces imposées, dans l'ordre de tirage : attribute x4, puis stress x2.
  const scripted = [6, 6, 1, 3, 6, 2];
  let index = 0;
  const drawDie = () => scripted[index++];

  const result = YZERoll.roll(pool, {}, { drawDie });

  // dice.attribute = [6,6,1,3] -> 2 six, 2 non-six.
  // dice.stress = un 6 elimine (éliminé), un 2 actif -> stress.length = 1.
  assert.deepEqual(result.dice.attribute, [6, 6, 1, 3]);
  assert.deepEqual(result.dice.stress, [2]);

  const counts = YZERoll.countPushDiceToRoll(result, { additionalStressDice: 0 });

  assert.equal(counts.normal, 2); // les deux non-six
  assert.equal(counts.stress, 1); // le seul dé de Stress encore en jeu
  assert.equal(counts.total, 3);
});


test("countPushDiceToRoll ajoute les dés de Stress supplémentaires au total", () => {
  const pool = new DicePool({ attribute: 2, stress: 1 });
  const result = YZERoll.roll(pool);

  const counts = YZERoll.countPushDiceToRoll(result, { additionalStressDice: 1 });

  assert.equal(counts.stress, result.dice.stress.length + 1);
});


/* ============================================================
 * drawDie injecté — roll()
 * ============================================================ */

test("roll() sans drawDie conserve le comportement historique (Math.random)", () => {
  const pool = new DicePool({ attribute: 3 });
  const result = YZERoll.roll(pool);

  assert.equal(result.dice.attribute.length, 3);
  for (const value of result.dice.attribute) {
    assert.ok(value >= 1 && value <= 6);
  }
});


test("roll() consomme drawDie dans l'ordre attribut, compétence, équipement, bonus, puis Stress", () => {
  const pool = new DicePool({
    attribute: 1,
    skill: 1,
    equipment: 1,
    bonus: 1,
    stress: 1
  });

  const scripted = [1, 2, 3, 4, 5];
  let index = 0;
  const drawDie = () => scripted[index++];

  const result = YZERoll.roll(pool, {}, { drawDie });

  assert.deepEqual(result.dice.attribute, [1]);
  assert.deepEqual(result.dice.skill, [2]);
  assert.deepEqual(result.dice.equipment, [3]);
  assert.deepEqual(result.dice.bonus, [4]);
  assert.deepEqual(result.dice.stress, [5]);
});


test("roll() avec drawDie : un 6 de Stress élimine bien le dé, les autres résultats restent inchangés", () => {
  const pool = new DicePool({ stress: 2 });

  const scripted = [6, 1];
  let index = 0;
  const drawDie = () => scripted[index++];

  const result = YZERoll.roll(pool, {}, { drawDie });

  assert.deepEqual(result.dice.stress, [1]);
  assert.equal(result.eliminatedStress, 1);
  assert.equal(result.stressAfflictions, 1);
});


/* ============================================================
 * drawDie injecté — push()
 * ============================================================ */

test("push() sans drawDie conserve le comportement historique (Math.random)", () => {
  const pool = new DicePool({ attribute: 3 });
  const result = YZERoll.roll(pool);

  const pushed = YZERoll.push(result, { maxPushes: 1 });

  assert.equal(pushed.pushCount, 1);
  assert.equal(pushed.dice.attribute.length, 3);
});


test("push() ne relance via drawDie que les dés normaux autres que des 6", () => {
  const pool = new DicePool({ attribute: 2 });

  // Premier jet : un 6 (conservé), un 3 (à relancer).
  const initialDrawDie = (() => {
    const scripted = [6, 3];
    let index = 0;
    return () => scripted[index++];
  })();

  const result = YZERoll.roll(pool, {}, { drawDie: initialDrawDie });

  assert.deepEqual(result.dice.attribute, [6, 3]);

  // Push : seul le 3 doit être relancé (1 seul appel à drawDie).
  let pushDrawCalls = 0;
  const pushDrawDie = () => {
    pushDrawCalls++;
    return 5;
  };

  const pushed = YZERoll.push(result, { maxPushes: 1, drawDie: pushDrawDie });

  assert.equal(pushDrawCalls, 1);
  assert.deepEqual(pushed.dice.attribute, [6, 5]);
});


test("push() relance aussi les dés de Stress déjà en jeu, plus les dés de Stress supplémentaires, via drawDie", () => {
  const pool = new DicePool({ stress: 1 });

  const result = YZERoll.roll(pool, {}, { drawDie: () => 2 });

  assert.deepEqual(result.dice.stress, [2]);

  const scripted = [4, 5];
  let index = 0;
  const pushDrawDie = () => scripted[index++];

  const pushed = YZERoll.push(result, {
    maxPushes: 1,
    additionalStressDice: 1,
    drawDie: pushDrawDie
  });

  assert.deepEqual(pushed.dice.stress, [4, 5]);
});
