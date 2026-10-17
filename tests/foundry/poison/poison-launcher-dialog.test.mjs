import test from "node:test";
import assert from "node:assert/strict";

import {
    PoisonLauncherDialog
} from "../../../src/foundry/poison/poison-launcher-dialog.mjs";


/* ============================================================
 * createContent
 * ============================================================ */


test("createContent affiche les 4 types d'effet du livre", () => {

    const content =
        PoisonLauncherDialog.createContent({
            actorOptions: []
        });

    assert.match(content, /Poison Létal/);
    assert.match(content, /Poison Paralysant/);
    assert.match(content, /Poison Somnifère/);
    assert.match(content, /Poison Hallucinogène/);
});


test("createContent affiche un champ Toxicité et un champ Source libre", () => {

    const content =
        PoisonLauncherDialog.createContent({
            actorOptions: []
        });

    assert.match(content, /name="toxicity"/);
    assert.match(content, /name="sourceLabel"/);
});


test("createContent affiche un message si aucun Acteur n'est disponible", () => {

    const content =
        PoisonLauncherDialog.createContent({
            actorOptions: []
        });

    assert.match(content, /Aucun Acteur disponible/);
});


test("createContent affiche chaque Acteur fourni, pré-coché si demandé", () => {

    const content =
        PoisonLauncherDialog.createContent({
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


test("readSelection lit le type d'effet, la Toxicité, la source et les Acteurs cochés", () => {

    const selection =
        PoisonLauncherDialog.readSelection({

            form: fakeForm({
                effectType: { value: "paralyzing" },
                toxicity: { value: "6" },
                sourceLabel: { value: "Morsure de Vodianoï" },
                "actor.a1": { checked: true },
                "actor.a2": { checked: false }
            }),

            actorOptions: [
                { id: "a1", name: "Artyom" },
                { id: "a2", name: "Miller" }
            ]

        });

    assert.equal(selection.effectTypeKey, "paralyzing");
    assert.equal(selection.effectTypeLabel, "Poison Paralysant");
    assert.equal(selection.toxicity, 6);
    assert.equal(selection.sourceLabel, "Morsure de Vodianoï");
    assert.deepEqual(selection.actorIds, ["a1"]);
});


test("readSelection renvoie sourceLabel=null quand le champ est laissé vide", () => {

    const selection =
        PoisonLauncherDialog.readSelection({

            form: fakeForm({
                effectType: { value: "lethal" },
                toxicity: { value: "3" },
                sourceLabel: { value: "   " },
                "actor.a1": { checked: true }
            }),

            actorOptions: [
                { id: "a1", name: "Artyom" }
            ]

        });

    assert.equal(selection.sourceLabel, null);
});


test("readSelection rejette un type d'effet manquant/inconnu", () => {

    assert.throws(
        () => PoisonLauncherDialog.readSelection({

            form: fakeForm({
                effectType: { value: "" },
                toxicity: { value: "3" },
                "actor.a1": { checked: true }
            }),

            actorOptions: [
                { id: "a1", name: "Artyom" }
            ]

        }),
        /type d'effet/
    );
});


test("readSelection rejette une Toxicité nulle, négative ou non entière", () => {

    assert.throws(
        () => PoisonLauncherDialog.readSelection({

            form: fakeForm({
                effectType: { value: "lethal" },
                toxicity: { value: "0" },
                "actor.a1": { checked: true }
            }),

            actorOptions: [
                { id: "a1", name: "Artyom" }
            ]

        }),
        /Toxicité/
    );

    assert.throws(
        () => PoisonLauncherDialog.readSelection({

            form: fakeForm({
                effectType: { value: "lethal" },
                toxicity: { value: "-2" },
                "actor.a1": { checked: true }
            }),

            actorOptions: [
                { id: "a1", name: "Artyom" }
            ]

        }),
        /Toxicité/
    );
});


test("readSelection rejette une sélection sans aucun Acteur coché", () => {

    assert.throws(
        () => PoisonLauncherDialog.readSelection({

            form: fakeForm({
                effectType: { value: "lethal" },
                toxicity: { value: "3" },
                "actor.a1": { checked: false }
            }),

            actorOptions: [
                { id: "a1", name: "Artyom" }
            ]

        }),
        /au moins un Acteur/
    );
});
