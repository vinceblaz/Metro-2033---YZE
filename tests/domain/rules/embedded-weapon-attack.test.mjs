import test from "node:test";
import assert from "node:assert/strict";

import {
    resolveEmbeddedWeaponAttack
} from "../../../src/domain/rules/embedded-weapon-attack.mjs";

const weapon = (system) => ({ system });

test("mêlée équipée : bouton Frapper actif", () => {
    const r = resolveEmbeddedWeaponAttack(weapon({ category: "melee", equipped: true, canAttack: true }));
    assert.deepEqual(r, { attackType: "melee", label: "Frapper", enabled: true, reason: "" });
});

test("mêlée non équipée : pas de bouton", () => {
    const r = resolveEmbeddedWeaponAttack(weapon({ category: "melee", equipped: false, canAttack: false }));
    assert.equal(r, null);
});

test("distance équipée et prête : Tirer actif", () => {
    const r = resolveEmbeddedWeaponAttack(weapon({ category: "ranged", equipped: true, canAttack: true, canFire: true }));
    assert.equal(r.attackType, "ranged");
    assert.equal(r.label, "Tirer");
    assert.equal(r.enabled, true);
});

test("distance équipée mais ne pouvant pas tirer : bouton désactivé avec raison", () => {
    const r = resolveEmbeddedWeaponAttack(weapon({ category: "ranged", equipped: true, canAttack: false, canFire: false }));
    assert.equal(r.enabled, false);
    assert.notEqual(r.reason, "");
});

test("arme hors d'usage : bouton désactivé", () => {
    const r = resolveEmbeddedWeaponAttack(weapon({ category: "melee", equipped: true, broken: true, canAttack: false }));
    assert.equal(r.enabled, false);
});

test("catégorie inconnue ou arme absente : aucun bouton", () => {
    assert.equal(resolveEmbeddedWeaponAttack(weapon({ category: "", equipped: true })), null);
    assert.equal(resolveEmbeddedWeaponAttack(null), null);
});

test("distance automatique prête : bouton Rafale actif en plus de Tirer", () => {
    const r = resolveEmbeddedWeaponAttack(weapon({ category: "ranged", equipped: true, automatic: true, canFire: true }));
    assert.deepEqual(r.burst, { attackType: "burst", label: "Rafale", enabled: true });
});

test("distance automatique sans munition : Rafale désactivée", () => {
    const r = resolveEmbeddedWeaponAttack(weapon({ category: "ranged", equipped: true, automatic: true, canFire: false }));
    assert.equal(r.burst.enabled, false);
});

test("arme non automatique ou de mêlée : pas de Rafale", () => {
    assert.equal(resolveEmbeddedWeaponAttack(weapon({ category: "ranged", equipped: true, canFire: true })).burst, null);
    assert.equal(resolveEmbeddedWeaponAttack(weapon({ category: "melee", equipped: true, canAttack: true })).burst ?? null, null);
});
