import test from "node:test";
import assert from "node:assert/strict";

import {
    IllnessLauncherDialog
} from "../../../src/foundry/illness/illness-launcher-dialog.mjs";


/* ============================================================
 * createContent
 * ============================================================ */


test("createContent affiche un champ Virulence préempli à 3 et un champ Source libre", () => {

    const content =
        IllnessLauncherDialog.createContent({
            actorOptions: []
        });

    assert.match(content, /name="virulence"/);
    assert.match(content, /value="3"/);
    assert.match(content, /name="sourceLabel"/);
});


test("createContent affiche un message si aucun Acteur n'est disponible", () => {

    const content =
        IllnessLauncherDialog.createContent({
            actorOptions: []
        });

    assert.match(content, /Aucun Acteur disponible/);
});


test("createContent affiche chaque Acteur fourni, pré-coché si demandé", () => {

    const content =
        IllnessLauncherDialog.createContent({
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


test("readSelection lit la Virulence, la source et les Acteurs cochés", () => {

    const selection =
        IllnessLauncherDialog.readSelection({

            form: fakeForm({
                virulence: { value: "6" },
                sourceLabel: { value: "Eau contaminée" },
                "actor.a1": { checked: true },
                "actor.a2": { checked: false }
            }),

            actorOptions: [
                { id: "a1", name: "Artyom" },
                { id: "a2", name: "Miller" }
            ]

        });

    assert.equal(selection.virulence, 6);
    assert.equal(selection.sourceLabel, "Eau contaminée");
    assert.deepEqual(selection.actorIds, ["a1"]);
});


test("readSelection renvoie sourceLabel=null quand le champ est laissé vide", () => {

    const selection =
        IllnessLauncherDialog.readSelection({

            form: fakeForm({
                virulence: { value: "3" },
                sourceLabel: { value: "   " },
                "actor.a1": { checked: true }
            }),

            actorOptions: [
                { id: "a1", name: "Artyom" }
            ]

        });

    assert.equal(selection.sourceLabel, null);
});


test("readSelection rejette une Virulence nulle, négative ou non entière", () => {

    assert.throws(
        () => IllnessLauncherDialog.readSelection({

            form: fakeForm({
                virulence: { value: "0" },
                "actor.a1": { checked: true }
            }),

            actorOptions: [
                { id: "a1", name: "Artyom" }
            ]

        }),
        /Virulence/
    );

    assert.throws(
        () => IllnessLauncherDialog.readSelection({

            form: fakeForm({
                virulence: { value: "-2" },
                "actor.a1": { checked: true }
            }),

            actorOptions: [
                { id: "a1", name: "Artyom" }
            ]

        }),
        /Virulence/
    );
});


test("readSelection rejette une sélection sans aucun Acteur coché", () => {

    assert.throws(
        () => IllnessLauncherDialog.readSelection({

            form: fakeForm({
                virulence: { value: "3" },
                "actor.a1": { checked: false }
            }),

            actorOptions: [
                { id: "a1", name: "Artyom" }
            ]

        }),
        /au moins un Acteur/
    );
});
