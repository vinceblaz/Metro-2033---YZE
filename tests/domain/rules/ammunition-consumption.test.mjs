import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveAmmunitionConsumption
} from "../../../src/domain/rules/ammunition-consumption.mjs";


function unitAmmo() {
  return {
    consumptionMode: "unit"
  };
}


function containerAmmo() {
  return {
    consumptionMode: "container"
  };
}


test("resolveAmmunitionConsumption exige une munition", () => {
  assert.throws(
    () => resolveAmmunitionConsumption(),
    TypeError
  );
});


test("un mode de consommation inconnu est refusé", () => {
  assert.throws(
    () => resolveAmmunitionConsumption({
      ammo: {
        consumptionMode: "inconnu"
      }
    }),
    /Mode de consommation inconnu/
  );
});


test("un événement de consommation inconnu est refusé", () => {
  assert.throws(
    () => resolveAmmunitionConsumption({
      ammo: unitAmmo(),
      event: "inconnu"
    }),
    /Événement de consommation inconnu/
  );
});


test("une munition unitaire consomme une unité lors du tir", () => {
  assert.deepEqual(
    resolveAmmunitionConsumption({
      ammo: unitAmmo(),
      event: "shot"
    }),
    {
      consume: true,
      amount: 1,
      reason: "shot"
    }
  );
});


test("le Push ne consomme pas une deuxième munition unitaire", () => {
  assert.deepEqual(
    resolveAmmunitionConsumption({
      ammo: unitAmmo(),
      event: "push"
    }),
    {
      consume: false,
      amount: 0,
      reason: "unit-already-consumed"
    }
  );
});


test("un tir normal avec conteneur ne consomme pas le conteneur", () => {
  assert.deepEqual(
    resolveAmmunitionConsumption({
      ammo: containerAmmo(),
      event: "shot",
      burstFire: false
    }),
    {
      consume: false,
      amount: 0,
      reason: "normal-shot"
    }
  );
});


test("le comportement actuel consomme le conteneur lors d'une rafale", () => {
  assert.deepEqual(
    resolveAmmunitionConsumption({
      ammo: containerAmmo(),
      event: "shot",
      burstFire: true
    }),
    {
      consume: true,
      amount: 1,
      reason: "burst-fire"
    }
  );
});


test("le Push d'une rafale déjà consommée ne consomme pas un second conteneur", () => {
  assert.deepEqual(
    resolveAmmunitionConsumption({
      ammo: containerAmmo(),
      event: "push",
      rollResult: {
        pushed: true,
        normalAfflictions: 2,
        context: {
          attack: {
            burstFire: true
          }
        }
      }
    }),
    {
      consume: false,
      amount: 0,
      reason: "burst-already-consumed"
    }
  );
});


test("un conteneur n'est pas consommé lors d'un événement Push si le jet n'a pas été poussé", () => {
  assert.deepEqual(
    resolveAmmunitionConsumption({
      ammo: containerAmmo(),
      event: "push",
      rollResult: {
        pushed: false,
        normalAfflictions: 2
      }
    }),
    {
      consume: false,
      amount: 0,
      reason: "not-pushed"
    }
  );
});


test("un Push sans affliction normale ne consomme pas le conteneur", () => {
  assert.deepEqual(
    resolveAmmunitionConsumption({
      ammo: containerAmmo(),
      event: "push",
      rollResult: {
        pushed: true,
        normalAfflictions: 0
      }
    }),
    {
      consume: false,
      amount: 0,
      reason: "no-affliction"
    }
  );
});


test("une affliction de mauvaise qualité de munition ne vide pas le conteneur", () => {
  assert.deepEqual(
    resolveAmmunitionConsumption({
      ammo: containerAmmo(),
      event: "push",
      rollResult: {
        pushed: true,
        normalAfflictions: 1
      },
      causedByPoorAmmunition: true
    }),
    {
      consume: false,
      amount: 0,
      reason: "poor-ammunition-affliction"
    }
  );
});


test("un Push avec au moins une affliction normale consomme le conteneur", () => {
  assert.deepEqual(
    resolveAmmunitionConsumption({
      ammo: containerAmmo(),
      event: "push",
      rollResult: {
        pushed: true,
        normalAfflictions: 1
      }
    }),
    {
      consume: true,
      amount: 1,
      reason: "reload-affliction"
    }
  );
});