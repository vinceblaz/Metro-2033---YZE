import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveVehicleDisplacement,
  vehicleArmorAsProtectionValue,
  resolveOccupantHitIntegrityLoss,
  isVehicleOutOfOrder
} from "../../../src/domain/rules/vehicle.mjs";


/* ============================================================
 * resolveVehicleDisplacement
 * ============================================================ */


test("hors zone encombrée, le Déplacement de base est retourné", () => {
  assert.equal(
    resolveVehicleDisplacement({
      baseDisplacement: 2,
      reducedInEncumberedZone: true,
      inEncumberedZone: false
    }),
    2
  );
});


test("un véhicule marqué * voit son Déplacement réduit à 1 en zone encombrée", () => {
  assert.equal(
    resolveVehicleDisplacement({
      baseDisplacement: 2,
      reducedInEncumberedZone: true,
      inEncumberedZone: true
    }),
    1
  );
});


test("un camion (Déplacement 2, non marqué *) ne peut pas entrer en zone encombrée", () => {
  assert.throws(
    () => resolveVehicleDisplacement({
      baseDisplacement: 2,
      reducedInEncumberedZone: false,
      inEncumberedZone: true
    }),
    Error
  );
});


test("hors zone encombrée, un véhicule non marqué * garde son Déplacement de base", () => {
  assert.equal(
    resolveVehicleDisplacement({
      baseDisplacement: 2,
      reducedInEncumberedZone: false,
      inEncumberedZone: false
    }),
    2
  );
});


test("baseDisplacement doit être un entier positif ou nul", () => {
  assert.throws(
    () => resolveVehicleDisplacement({
      baseDisplacement: -1,
      reducedInEncumberedZone: true,
      inEncumberedZone: false
    }),
    TypeError
  );

  assert.throws(
    () => resolveVehicleDisplacement({
      baseDisplacement: 1.5,
      reducedInEncumberedZone: true,
      inEncumberedZone: false
    }),
    TypeError
  );
});


test("reducedInEncumberedZone doit être un booléen", () => {
  assert.throws(
    () => resolveVehicleDisplacement({
      baseDisplacement: 2,
      reducedInEncumberedZone: undefined,
      inEncumberedZone: false
    }),
    TypeError
  );
});


test("inEncumberedZone doit être un booléen", () => {
  assert.throws(
    () => resolveVehicleDisplacement({
      baseDisplacement: 2,
      reducedInEncumberedZone: true,
      inEncumberedZone: undefined
    }),
    TypeError
  );
});


/* ============================================================
 * vehicleArmorAsProtectionValue
 * ============================================================ */


test("le Blindage sert directement de valeur de Protection", () => {
  assert.equal(
    vehicleArmorAsProtectionValue({ armor: 7 }),
    7
  );
});


test("un Blindage nul donne une Protection nulle", () => {
  assert.equal(
    vehicleArmorAsProtectionValue({ armor: 0 }),
    0
  );
});


test("armor doit être un entier positif ou nul", () => {
  assert.throws(
    () => vehicleArmorAsProtectionValue({ armor: -1 }),
    TypeError
  );

  assert.throws(
    () => vehicleArmorAsProtectionValue({ armor: 1.2 }),
    TypeError
  );

  assert.throws(
    () => vehicleArmorAsProtectionValue({}),
    TypeError
  );
});


/* ============================================================
 * resolveOccupantHitIntegrityLoss
 * ============================================================ */


test("la perte d'Intégrité d'un occupant touché est toujours de 1", () => {
  assert.equal(
    resolveOccupantHitIntegrityLoss(),
    1
  );
});


/* ============================================================
 * isVehicleOutOfOrder
 * ============================================================ */


test("un véhicule à Intégrité 0 est hors d'état", () => {
  assert.equal(
    isVehicleOutOfOrder({ integrity: 0 }),
    true
  );
});


test("un véhicule à Intégrité positive n'est pas hors d'état", () => {
  assert.equal(
    isVehicleOutOfOrder({ integrity: 3 }),
    false
  );
});


test("un véhicule à Intégrité négative est considéré hors d'état", () => {
  assert.equal(
    isVehicleOutOfOrder({ integrity: -2 }),
    true
  );
});


test("integrity doit être un entier", () => {
  assert.throws(
    () => isVehicleOutOfOrder({ integrity: 1.5 }),
    TypeError
  );

  assert.throws(
    () => isVehicleOutOfOrder({}),
    TypeError
  );
});
