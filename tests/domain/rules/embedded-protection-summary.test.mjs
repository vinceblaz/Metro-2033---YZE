import test from "node:test";
import assert from "node:assert/strict";
import { summarizeProtection } from "../../../src/domain/rules/embedded-protection-summary.mjs";

test("protection simple : valeur courante/maximale", () => {
    assert.equal(summarizeProtection({ protection: { current: 2, max: 3 } }), "Protection 2/3");
});

test("protection avec Résilience", () => {
    assert.equal(
        summarizeProtection({ protection: { current: 3, max: 3 }, resilience: true }),
        "Protection 3/3 · Résilience"
    );
});

test("Résilience perdue signalée", () => {
    assert.equal(
        summarizeProtection({ protection: { current: 1, max: 3 }, resilience: true, resilienceLost: true }),
        "Protection 1/3 · Résilience perdue"
    );
});

test("données absentes : protection 0/0", () => {
    assert.equal(summarizeProtection(undefined), "Protection 0/0");
});
