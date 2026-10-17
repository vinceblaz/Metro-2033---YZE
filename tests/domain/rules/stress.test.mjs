import test from "node:test";
import assert from "node:assert/strict";

import {
  MAX_STRESS_DICE,
  validateStressDice,
  clampStressDice,
  wouldExceedStressLimit
} from "../../../src/domain/rules/stress.mjs";


test("la limite normale de Stress est de 5 dés", () => {
  assert.equal(
    MAX_STRESS_DICE,
    5
  );
});


test("validateStressDice accepte zéro et les entiers positifs", () => {
  assert.equal(
    validateStressDice(0),
    0
  );

  assert.equal(
    validateStressDice(1),
    1
  );

  assert.equal(
    validateStressDice(5),
    5
  );

  assert.equal(
    validateStressDice(6),
    6
  );
});


test("validateStressDice rejette les valeurs non entières", () => {
  assert.throws(
    () => validateStressDice(1.5),
    TypeError
  );

  assert.throws(
    () => validateStressDice("3"),
    TypeError
  );

  assert.throws(
    () => validateStressDice(undefined),
    TypeError
  );
});


test("validateStressDice rejette les valeurs négatives", () => {
  assert.throws(
    () => validateStressDice(-1),
    RangeError
  );

  assert.throws(
    () => validateStressDice(-5),
    RangeError
  );
});


test("clampStressDice conserve les valeurs comprises entre 0 et 5", () => {
  assert.equal(
    clampStressDice(0),
    0
  );

  assert.equal(
    clampStressDice(3),
    3
  );

  assert.equal(
    clampStressDice(5),
    5
  );
});


test("clampStressDice plafonne le Stress à 5", () => {
  assert.equal(
    clampStressDice(6),
    5
  );

  assert.equal(
    clampStressDice(10),
    5
  );

  assert.equal(
    clampStressDice(100),
    5
  );
});


test("clampStressDice conserve la validation des valeurs", () => {
  assert.throws(
    () => clampStressDice(-1),
    RangeError
  );

  assert.throws(
    () => clampStressDice(2.5),
    TypeError
  );
});


test("wouldExceedStressLimit détecte un dépassement de la limite", () => {
  assert.equal(
    wouldExceedStressLimit(4, 1),
    false
  );

  assert.equal(
    wouldExceedStressLimit(5, 1),
    true
  );

  assert.equal(
    wouldExceedStressLimit(4, 2),
    true
  );

  assert.equal(
    wouldExceedStressLimit(0, 6),
    true
  );
});


test("atteindre exactement 5 dés de Stress n'est pas un dépassement", () => {
  assert.equal(
    wouldExceedStressLimit(0, 5),
    false
  );

  assert.equal(
    wouldExceedStressLimit(3, 2),
    false
  );

  assert.equal(
    wouldExceedStressLimit(5, 0),
    false
  );
});


test("wouldExceedStressLimit utilise 1 comme quantité par défaut", () => {
  assert.equal(
    wouldExceedStressLimit(4),
    false
  );

  assert.equal(
    wouldExceedStressLimit(5),
    true
  );
});


test("wouldExceedStressLimit valide le Stress actuel et la quantité ajoutée", () => {
  assert.throws(
    () => wouldExceedStressLimit(-1, 1),
    RangeError
  );

  assert.throws(
    () => wouldExceedStressLimit(3, -1),
    RangeError
  );

  assert.throws(
    () => wouldExceedStressLimit(2.5, 1),
    TypeError
  );

  assert.throws(
    () => wouldExceedStressLimit(3, 1.5),
    TypeError
  );
});