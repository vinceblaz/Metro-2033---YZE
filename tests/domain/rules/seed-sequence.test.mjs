import test from "node:test";
import assert from "node:assert/strict";

import {
    runSeedSequence,
    needsInitialization,
    summarizeSeedReport
} from "../../../src/domain/rules/seed-sequence.mjs";

test("exécute les étapes dans l'ordre et rapporte chaque résultat", async () => {
    const order = [];
    const report = await runSeedSequence([
        { key: "a", label: "A", run: async () => { order.push("a"); return { created: 2 }; } },
        { key: "b", label: "B", run: async () => { order.push("b"); return { created: 1 }; } }
    ]);
    assert.deepEqual(order, ["a", "b"]);
    assert.equal(report.length, 2);
    assert.equal(report.every(entry => entry.status === "ok"), true);
    assert.deepEqual(report[0].result, { created: 2 });
});

test("une étape en échec n'arrête pas les autres", async () => {
    const report = await runSeedSequence([
        { key: "a", label: "A", run: async () => { throw new Error("boom"); } },
        { key: "b", label: "B", run: async () => ({}) }
    ]);
    assert.equal(report[0].status, "error");
    assert.equal(report[0].error, "boom");
    assert.equal(report[1].status, "ok");
});

test("une étape dont un prérequis a échoué est ignorée", async () => {
    let ran = false;
    const report = await runSeedSequence([
        { key: "a", label: "A", run: async () => { throw new Error("x"); } },
        { key: "b", label: "B", requires: ["a"], run: async () => { ran = true; } }
    ]);
    assert.equal(ran, false);
    assert.equal(report[1].status, "skipped");
});

test("onStep est appelé avant chaque étape", async () => {
    const seen = [];
    await runSeedSequence(
        [{ key: "a", label: "A", run: async () => ({}) }],
        { onStep: (step, index, total) => seen.push([step.key, index, total]) }
    );
    assert.deepEqual(seen, [["a", 0, 1]]);
});

test("summarizeSeedReport compte réussites, échecs et ignorées", () => {
    assert.deepEqual(
        summarizeSeedReport([
            { status: "ok" }, { status: "ok" }, { status: "error" }, { status: "skipped" }
        ]),
        { ok: 2, error: 1, skipped: 1, success: false }
    );
    assert.equal(summarizeSeedReport([{ status: "ok" }]).success, true);
});

test("needsInitialization : première installation, mise à jour, ou à jour", () => {
    assert.equal(needsInitialization({ installedVersion: "", currentVersion: "0.2.0" }), true);
    assert.equal(needsInitialization({ installedVersion: "0.1.0", currentVersion: "0.2.0" }), true);
    assert.equal(needsInitialization({ installedVersion: "0.2.0", currentVersion: "0.2.0" }), false);
    assert.equal(needsInitialization({ installedVersion: "0.2.0", currentVersion: "" }), false);
});
