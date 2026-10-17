import test from "node:test";
import assert from "node:assert/strict";

import {
    escapeHTML,
    renderActorSelectionFieldset,
    readSelectedActorIds
} from "../../../src/foundry/shared/dialog-html.mjs";


/* ============================================================
 * escapeHTML
 * ============================================================ */


test("escapeHTML échappe les caractères HTML dangereux", () => {
    assert.equal(
        escapeHTML(`<a href="x">&'</a>`),
        "&lt;a href=&quot;x&quot;&gt;&amp;&#039;&lt;/a&gt;"
    );
});


test("escapeHTML tolère une valeur absente", () => {
    assert.equal(escapeHTML(undefined), "");
    assert.equal(escapeHTML(null), "");
});


/* ============================================================
 * renderActorSelectionFieldset
 * ============================================================ */


test("renderActorSelectionFieldset affiche un message si aucun Acteur", () => {

    const html =
        renderActorSelectionFieldset({ actorOptions: [] });

    assert.match(html, /Aucun Acteur disponible/);
});


test("renderActorSelectionFieldset affiche chaque Acteur, pré-coché si demandé, en grille", () => {

    const html =
        renderActorSelectionFieldset({
            actorOptions: [
                { id: "a1", name: "Artyom", preSelected: true },
                { id: "a2", name: "Miller", preSelected: false }
            ]
        });

    assert.match(html, /metro-multi-actor-grid/);
    assert.match(html, /Artyom/);
    assert.match(html, /Miller/);
    assert.match(html, /name="actor\.a1"[^>]*checked/);
});


test("renderActorSelectionFieldset accepte un intitulé personnalisé", () => {

    const html =
        renderActorSelectionFieldset({
            actorOptions: [],
            legend: "Mon intitulé"
        });

    assert.match(html, /Mon intitulé/);
});


/* ============================================================
 * readSelectedActorIds
 * ============================================================ */


function fakeForm(elements) {
    return { elements };
}


test("readSelectedActorIds retourne les identifiants cochés", () => {

    const actorIds =
        readSelectedActorIds({

            form: fakeForm({
                "actor.a1": { checked: true },
                "actor.a2": { checked: false }
            }),

            actorOptions: [
                { id: "a1", name: "Artyom" },
                { id: "a2", name: "Miller" }
            ]

        });

    assert.deepEqual(actorIds, ["a1"]);
});


test("readSelectedActorIds rejette une sélection vide", () => {

    assert.throws(
        () => readSelectedActorIds({

            form: fakeForm({
                "actor.a1": { checked: false }
            }),

            actorOptions: [
                { id: "a1", name: "Artyom" }
            ]

        }),
        /au moins un Acteur/
    );
});
