import test from "node:test";
import assert from "node:assert/strict";

import {
    FireLauncherDialog
} from "../../../src/foundry/fire/fire-launcher-dialog.mjs";

const fakeForm = elements => ({ elements });

test("createContent propose l'Intensité 8 par défaut et cite la règle", () => {
    const content = FireLauncherDialog.createContent({ actorOptions: [] });
    assert.match(content, /name="intensity"[^>]*value="8"/);
    assert.match(content, /Intensité de\s+8/);
});

test("createContent affiche les Acteurs fournis", () => {
    const content = FireLauncherDialog.createContent({
        actorOptions: [{ id: "a1", name: "Artyom", preSelected: true }]
    });
    assert.match(content, /Artyom/);
    assert.match(content, /name="actor\.a1"[^>]*checked/);
});

test("readSelection : Intensité, source et acteurs cochés", () => {
    const selection = FireLauncherDialog.readSelection({
        form: fakeForm({
            intensity: { value: "10" },
            sourceLabel: { value: "  Incendie  " },
            "actor.a1": { checked: true },
            "actor.a2": { checked: false }
        }),
        actorOptions: [{ id: "a1" }, { id: "a2" }]
    });
    assert.deepEqual(selection, {
        intensity: 10,
        sourceLabel: "Incendie",
        actorIds: ["a1"]
    });
});

test("readSelection : source vide = null", () => {
    const selection = FireLauncherDialog.readSelection({
        form: fakeForm({
            intensity: { value: "8" },
            sourceLabel: { value: "" },
            "actor.a1": { checked: true }
        }),
        actorOptions: [{ id: "a1" }]
    });
    assert.equal(selection.sourceLabel, null);
});

test("readSelection : Intensité invalide ou aucun acteur refusés", () => {
    for (const value of ["", "0", "abc", "2.5"]) {
        assert.throws(() =>
            FireLauncherDialog.readSelection({
                form: fakeForm({
                    intensity: { value },
                    "actor.a1": { checked: true }
                }),
                actorOptions: [{ id: "a1" }]
            }),
            /Intensité/
        );
    }
    assert.throws(() =>
        FireLauncherDialog.readSelection({
            form: fakeForm({ intensity: { value: "8" } }),
            actorOptions: [{ id: "a1" }]
        })
    );
});
