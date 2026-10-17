import test from "node:test";
import assert from "node:assert/strict";

import {
    CoupDeGraceLauncherDialog
} from "../../../src/foundry/coup-de-grace/coup-de-grace-launcher-dialog.mjs";


function fakeForm(elements) {
    return { elements };
}


test("createContent affiche un message si aucun Personnage n'est disponible", () => {
    const content =
        CoupDeGraceLauncherDialog.createContent({ actorOptions: [] });

    assert.match(content, /Aucun Personnage disponible/);
});


test("createContent affiche chaque PJ, pré-coché si demandé, en grille à deux colonnes", () => {
    const content =
        CoupDeGraceLauncherDialog.createContent({
            actorOptions: [
                { id: "a1", name: "Artyom", preSelected: true },
                { id: "a2", name: "Miller", preSelected: false }
            ]
        });

    assert.match(content, /Artyom/);
    assert.match(content, /Miller/);
    assert.match(content, /name="actor\.a1"[^>]*checked/);
    assert.doesNotMatch(content, /name="actor\.a2"[^>]*checked/);
    assert.match(content, /metro-coup-de-grace-grid/);
});


test("createContent place une étoile rouge après le nom des seuls PJ Impitoyables", () => {
    const content =
        CoupDeGraceLauncherDialog.createContent({
            actorOptions: [
                { id: "a1", name: "Artyom", ruthless: true },
                { id: "a2", name: "Miller", ruthless: false }
            ]
        });

    assert.match(content, /Artyom\s*<span class="metro-red-star"[^>]*>★<\/span>/);
    assert.doesNotMatch(content, /Miller\s*<span class="metro-red-star"/);
});


test("createContent échappe les noms", () => {
    const content =
        CoupDeGraceLauncherDialog.createContent({
            actorOptions: [{ id: "a1", name: "<b>X</b>" }]
        });

    assert.doesNotMatch(content, /<b>X<\/b>/);
    assert.match(content, /&lt;b&gt;X&lt;\/b&gt;/);
});


test("createContent propose le texte par défaut exact, modifiable (textarea), un seul champ message", () => {
    const content =
        CoupDeGraceLauncherDialog.createContent({
            actorOptions: [{ id: "a1", name: "Artyom" }]
        });

    assert.match(
        content,
        /<textarea[^>]*name="message"[^>]*>Tu veux exécuter ta cible de sang-froid<\/textarea>/
    );
    assert.equal(content.match(/name="message"/g).length, 1);
});


test("createContent : aucun attribut name dupliqué", () => {
    const content =
        CoupDeGraceLauncherDialog.createContent({
            actorOptions: [
                { id: "a1", name: "Artyom" },
                { id: "a2", name: "Miller" }
            ]
        });

    const names = [...content.matchAll(/name="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(names).size, names.length);
});


test("readSelection lit les PJ cochés et le texte du MJ", () => {
    const selection =
        CoupDeGraceLauncherDialog.readSelection({
            form: fakeForm({
                "actor.a1": { checked: true },
                "actor.a2": { checked: false },
                message: { value: "  Il est à terre.  " }
            }),
            actorOptions: [
                { id: "a1", name: "Artyom" },
                { id: "a2", name: "Miller" }
            ]
        });

    assert.deepEqual(selection, {
        actorIds: ["a1"],
        message: "Il est à terre."
    });
});


test("readSelection : texte vide -> texte par défaut", () => {
    const selection =
        CoupDeGraceLauncherDialog.readSelection({
            form: fakeForm({
                "actor.a1": { checked: true },
                message: { value: "   " }
            }),
            actorOptions: [{ id: "a1", name: "Artyom" }]
        });

    assert.equal(selection.message, "Tu veux exécuter ta cible de sang-froid");
});


test("readSelection rejette une sélection sans aucun PJ coché", () => {
    assert.throws(
        () =>
            CoupDeGraceLauncherDialog.readSelection({
                form: fakeForm({
                    "actor.a1": { checked: false },
                    message: { value: "x" }
                }),
                actorOptions: [{ id: "a1", name: "Artyom" }]
            }),
        /au moins un Personnage/
    );
});
