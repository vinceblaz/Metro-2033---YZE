import test from "node:test";
import assert from "node:assert/strict";

import {
    createRecurringStatusEffectRegistry
} from "../../src/combat/recurring-status-effect-registry.mjs";


test("register exige un identifiant d'état non vide", () => {

    const registry = createRecurringStatusEffectRegistry();

    assert.throws(
        () => registry.register("", () => {}),
        TypeError
    );

    assert.throws(
        () => registry.register(null, () => {}),
        TypeError
    );
});


test("register exige un gérant de type fonction", () => {

    const registry = createRecurringStatusEffectRegistry();

    assert.throws(
        () => registry.register("asphyxiated", "pas une fonction"),
        TypeError
    );
});


test("register puis getHandler retrouve le gérant enregistré", () => {

    const registry = createRecurringStatusEffectRegistry();

    const handler = async () => {};

    registry.register("asphyxiated", handler);

    assert.equal(registry.getHandler("asphyxiated"), handler);
});


test("getHandler retourne null pour un état non enregistré", () => {

    const registry = createRecurringStatusEffectRegistry();

    assert.equal(registry.getHandler("inconnu"), null);
});


test("un second register pour le même état remplace le précédent (pas d'empilement)", () => {

    const registry = createRecurringStatusEffectRegistry();

    const firstHandler = async () => {};
    const secondHandler = async () => {};

    registry.register("asphyxiated", firstHandler);
    registry.register("asphyxiated", secondHandler);

    assert.equal(registry.getHandler("asphyxiated"), secondHandler);
    assert.equal(registry.entries().length, 1);
});


test("unregister retire le gérant d'un état", () => {

    const registry = createRecurringStatusEffectRegistry();

    registry.register("asphyxiated", async () => {});
    registry.unregister("asphyxiated");

    assert.equal(registry.getHandler("asphyxiated"), null);
});


test("entries liste tous les gérants enregistrés", () => {

    const registry = createRecurringStatusEffectRegistry();

    const asphyxiatedHandler = async () => {};
    const poisonedHandler = async () => {};

    registry.register("asphyxiated", asphyxiatedHandler);
    registry.register("poisoned", poisonedHandler);

    const entries = registry.entries();

    assert.equal(entries.length, 2);
    assert.deepEqual(
        entries.map(([statusId]) => statusId).sort(),
        ["asphyxiated", "poisoned"]
    );
});
