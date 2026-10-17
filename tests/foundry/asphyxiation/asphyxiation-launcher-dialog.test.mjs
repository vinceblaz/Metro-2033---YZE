import test from "node:test";
import assert from "node:assert/strict";

import {
    AsphyxiationLauncherDialog
} from "../../../src/foundry/asphyxiation/asphyxiation-launcher-dialog.mjs";


/* ============================================================
 * createContent
 * ============================================================ */


test("createContent affiche les 3 paliers de Nocivité et leur fréquence", () => {

    const content =
        AsphyxiationLauncherDialog.createContent({
            actorOptions: []
        });

    assert.match(content, /Légère/);
    assert.match(content, /Tous les quarts/);
    assert.match(content, /Forte/);
    assert.match(content, /Tous les tours/);
    assert.match(content, /Extrême/);
    assert.match(content, /Tous les rounds/);
});


test("createContent précise que la Nocivité n'affecte pas le jet", () => {

    const content =
        AsphyxiationLauncherDialog.createContent({
            actorOptions: []
        });

    assert.match(content, /n'affecte pas le jet/);
});


test("createContent propose un choix (radio) de Nocivité, Légère cochée par défaut", () => {

    const content =
        AsphyxiationLauncherDialog.createContent({
            actorOptions: []
        });

    assert.match(
        content,
        /name="sourceLevel"\s+value="light"\s+checked/
    );
    assert.match(content, /name="sourceLevel"[^>]*value="strong"/);
    assert.match(content, /name="sourceLevel"[^>]*value="extreme"/);
});


test("createContent affiche chaque Acteur fourni, pré-coché si demandé, en grille", () => {

    const content =
        AsphyxiationLauncherDialog.createContent({
            actorOptions: [
                { id: "a1", name: "Artyom", preSelected: true },
                { id: "a2", name: "Miller", preSelected: false }
            ]
        });

    assert.match(content, /metro-multi-actor-grid/);
    assert.match(content, /Artyom/);
    assert.match(content, /name="actor\.a1"[^>]*checked/);
});


/* ============================================================
 * readSelection
 * ============================================================ */


function fakeForm(elements) {
    return { elements };
}


test("readSelection retourne la Nocivité et les Acteurs cochés", () => {

    const selection =
        AsphyxiationLauncherDialog.readSelection({

            form: fakeForm({
                sourceLevel: { value: "extreme" },
                "actor.a1": { checked: true },
                "actor.a2": { checked: false }
            }),

            actorOptions: [
                { id: "a1", name: "Artyom" },
                { id: "a2", name: "Miller" }
            ]

        });

    assert.equal(selection.sourceLevel, "extreme");
    assert.equal(selection.sourceLabel, "Extrême");
    assert.deepEqual(selection.actorIds, ["a1"]);
});


test("readSelection rejette une sélection sans aucun Acteur coché", () => {

    assert.throws(
        () => AsphyxiationLauncherDialog.readSelection({

            form: fakeForm({
                sourceLevel: { value: "light" },
                "actor.a1": { checked: false }
            }),

            actorOptions: [
                { id: "a1", name: "Artyom" }
            ]

        }),
        /au moins un Acteur/
    );
});


test("readSelection rejette une Nocivité absente ou inconnue", () => {

    assert.throws(
        () => AsphyxiationLauncherDialog.readSelection({

            form: fakeForm({
                sourceLevel: { value: "" },
                "actor.a1": { checked: true }
            }),

            actorOptions: [
                { id: "a1", name: "Artyom" }
            ]

        }),
        /Nocivité/
    );
});
