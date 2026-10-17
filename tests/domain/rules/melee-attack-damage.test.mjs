import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveMeleeAttackDamage
} from "../../../src/domain/rules/melee-attack-damage.mjs";


test("resolveMeleeAttackDamage exige que hit soit un booléen", () => {
  assert.throws(
    () => resolveMeleeAttackDamage(),
    TypeError
  );

  assert.throws(
    () => resolveMeleeAttackDamage({
      hit: 1
    }),
    TypeError
  );

  assert.throws(
    () => resolveMeleeAttackDamage({
      hit: "true"
    }),
    TypeError
  );
});


test("une attaque de mêlée ratée n'inflige aucun dégât", () => {
  assert.deepEqual(
    resolveMeleeAttackDamage({
      hit: false,
      weaponDamage: 3,
      bonusVigorDamage: 2,
      bonusAgilityDamage: 1
    }),
    {
      hit: false,
      weaponDamage: 0,
      bonusVigorDamage: 0,
      bonusAgilityDamage: 0,
      vigorDamage: 0,
      agilityDamage: 0
    }
  );
});


test("une attaque réussie inflige les dégâts de base de l'arme à la Vigueur", () => {
  assert.deepEqual(
    resolveMeleeAttackDamage({
      hit: true,
      weaponDamage: 3
    }),
    {
      hit: true,
      weaponDamage: 3,
      bonusVigorDamage: 0,
      bonusAgilityDamage: 0,
      vigorDamage: 3,
      agilityDamage: 0
    }
  );
});


test("les dégâts bonus de Vigueur s'ajoutent aux dégâts de l'arme", () => {
  const result =
    resolveMeleeAttackDamage({
      hit: true,
      weaponDamage: 2,
      bonusVigorDamage: 3
    });

  assert.equal(
    result.vigorDamage,
    5
  );

  assert.equal(
    result.agilityDamage,
    0
  );
});


test("les dégâts bonus d'Agilité restent séparés des dégâts de Vigueur", () => {
  const result =
    resolveMeleeAttackDamage({
      hit: true,
      weaponDamage: 2,
      bonusVigorDamage: 1,
      bonusAgilityDamage: 3
    });

  assert.equal(
    result.vigorDamage,
    3
  );

  assert.equal(
    result.agilityDamage,
    3
  );
});


test("une attaque réussie peut infliger uniquement des dégâts d'Agilité", () => {
  assert.deepEqual(
    resolveMeleeAttackDamage({
      hit: true,
      weaponDamage: 0,
      bonusVigorDamage: 0,
      bonusAgilityDamage: 2
    }),
    {
      hit: true,
      weaponDamage: 0,
      bonusVigorDamage: 0,
      bonusAgilityDamage: 2,
      vigorDamage: 0,
      agilityDamage: 2
    }
  );
});


test("une attaque réussie sans dégâts retourne des dégâts nuls", () => {
  assert.deepEqual(
    resolveMeleeAttackDamage({
      hit: true
    }),
    {
      hit: true,
      weaponDamage: 0,
      bonusVigorDamage: 0,
      bonusAgilityDamage: 0,
      vigorDamage: 0,
      agilityDamage: 0
    }
  );
});


test("resolveMeleeAttackDamage rejette un weaponDamage négatif", () => {
  assert.throws(
    () => resolveMeleeAttackDamage({
      hit: true,
      weaponDamage: -1
    }),
    TypeError
  );
});


test("resolveMeleeAttackDamage rejette un bonusVigorDamage négatif", () => {
  assert.throws(
    () => resolveMeleeAttackDamage({
      hit: true,
      bonusVigorDamage: -1
    }),
    TypeError
  );
});


test("resolveMeleeAttackDamage rejette un bonusAgilityDamage négatif", () => {
  assert.throws(
    () => resolveMeleeAttackDamage({
      hit: true,
      bonusAgilityDamage: -1
    }),
    TypeError
  );
});


test("resolveMeleeAttackDamage rejette les valeurs non entières", () => {
  assert.throws(
    () => resolveMeleeAttackDamage({
      hit: true,
      weaponDamage: 1.5
    }),
    TypeError
  );

  assert.throws(
    () => resolveMeleeAttackDamage({
      hit: true,
      bonusVigorDamage: 2.5
    }),
    TypeError
  );

  assert.throws(
    () => resolveMeleeAttackDamage({
      hit: true,
      bonusAgilityDamage: 0.5
    }),
    TypeError
  );
});


test("une attaque ratée valide tout de même les valeurs de dégâts fournies", () => {
  assert.throws(
    () => resolveMeleeAttackDamage({
      hit: false,
      weaponDamage: -1
    }),
    TypeError
  );

  assert.throws(
    () => resolveMeleeAttackDamage({
      hit: false,
      bonusVigorDamage: 1.5
    }),
    TypeError
  );
});