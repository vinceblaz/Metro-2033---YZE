import test from "node:test";
import assert from "node:assert/strict";
import { resolveVicieuseFollowUp } from "../../../src/domain/rules/vicieuse-follow-up.mjs";

const weapons = [
    { id: "g", name: "Griffes", category: "melee", canAttack: true },
    { id: "m", name: "Morsure", category: "melee", canAttack: true }
];
const base = { traitKeys: ["creature-trait-vicieuse"], usedWeaponName: "Griffes", hit: true, weapons };

test("griffes réussies + Vicieuse : morsure proposée", () => {
    assert.deepEqual(resolveVicieuseFollowUp(base), { available: true, weaponId: "m", weaponName: "Morsure" });
});

test("attaque manquée : rien", () => {
    assert.equal(resolveVicieuseFollowUp({ ...base, hit: false }).available, false);
});

test("sans le trait : rien", () => {
    assert.equal(resolveVicieuseFollowUp({ ...base, traitKeys: [] }).available, false);
});

test("attaque autre que griffes : rien (pas d'enchaînement sur la morsure)", () => {
    assert.equal(resolveVicieuseFollowUp({ ...base, usedWeaponName: "Morsure" }).available, false);
});

test("pas de morsure utilisable : rien", () => {
    const w = [weapons[0], { id: "m", name: "Morsure", category: "melee", canAttack: false }];
    assert.equal(resolveVicieuseFollowUp({ ...base, weapons: w }).available, false);
});
