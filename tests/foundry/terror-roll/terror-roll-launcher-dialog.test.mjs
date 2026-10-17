import test from "node:test";
import assert from "node:assert/strict";

import {
    TerrorRollLauncherDialog
} from "../../../src/foundry/terror-roll/terror-roll-launcher-dialog.mjs";


/* ============================================================
 * createContent
 * ============================================================ */


test("createContent affiche les 3 paliers du livre et une valeur personnalisée", () => {

    const content =
        TerrorRollLauncherDialog.createContent({
            actorOptions: []
        });

    assert.match(content, /Effrayante/);
    assert.match(content, /Atroce/);
    assert.match(content, /Abominable/);
    assert.match(content, /Valeur personnalisée/);
});


test("createContent affiche un message si aucun Acteur n'est disponible", () => {

    const content =
        TerrorRollLauncherDialog.createContent({
            actorOptions: []
        });

    assert.match(content, /Aucun Acteur disponible/);
});


test("createContent affiche chaque Acteur fourni, pré-coché si demandé", () => {

    const content =
        TerrorRollLauncherDialog.createContent({
            actorOptions: [
                { id: "a1", name: "Artyom", preSelected: true },
                { id: "a2", name: "Miller", preSelected: false }
            ]
        });

    assert.match(content, /Artyom/);
    assert.match(content, /Miller/);
    assert.match(content, /name="actor\.a1"[^>]*checked/);
});


/* ============================================================
 * readSelection
 * ============================================================ */


function fakeForm(elements) {
    return { elements };
}


test("readSelection lit un palier nommé (valeur du tableau) et les Acteurs cochés", () => {

    const selection =
        TerrorRollLauncherDialog.readSelection({

            form: fakeForm({
                terrorSource: { value: "atrocious" },
                "actor.a1": { checked: true },
                "actor.a2": { checked: false }
            }),

            actorOptions: [
                { id: "a1", name: "Artyom" },
                { id: "a2", name: "Miller" }
            ]

        });

    assert.equal(selection.terrorValue, 5);
    assert.equal(selection.sourceLabel, "Atroce");
    assert.deepEqual(selection.actorIds, ["a1"]);
});


test("readSelection lit une valeur personnalisée quand terrorSource=custom", () => {

    const selection =
        TerrorRollLauncherDialog.readSelection({

            form: fakeForm({
                terrorSource: { value: "custom" },
                customValue: { value: "7" },
                "actor.a1": { checked: true }
            }),

            actorOptions: [
                { id: "a1", name: "Artyom" }
            ]

        });

    assert.equal(selection.terrorValue, 7);
    assert.equal(selection.sourceLabel, "Personnalisée");
});


test("readSelection rejette une valeur personnalisée invalide", () => {

    assert.throws(
        () => TerrorRollLauncherDialog.readSelection({

            form: fakeForm({
                terrorSource: { value: "custom" },
                customValue: { value: "-1" },
                "actor.a1": { checked: true }
            }),

            actorOptions: [
                { id: "a1", name: "Artyom" }
            ]

        }),
        /entier positif ou nul/
    );
});


test("readSelection rejette une sélection sans aucun Acteur coché", () => {

    assert.throws(
        () => TerrorRollLauncherDialog.readSelection({

            form: fakeForm({
                terrorSource: { value: "frightening" },
                "actor.a1": { checked: false }
            }),

            actorOptions: [
                { id: "a1", name: "Artyom" }
            ]

        }),
        /au moins un Acteur/
    );
});
