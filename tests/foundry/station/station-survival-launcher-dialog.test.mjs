import test from "node:test";
import assert from "node:assert/strict";

import {
    StationSurvivalLauncherDialog
} from "../../../src/foundry/station/station-survival-launcher-dialog.mjs";


/* ============================================================
 * createContent
 * ============================================================ */


test("createContent liste les Stations fournies et les 5 ressources avec leur modificateur", () => {

    const content =
        StationSurvivalLauncherDialog.createContent({
            stationOptions: [
                { value: "Item.station1", label: "Petchatniki" },
                { value: "Item.station2", label: "Doubrovka" }
            ]
        });

    assert.match(content, /name="stationUuid"/);
    assert.match(content, /Petchatniki/);
    assert.match(content, /Doubrovka/);

    assert.match(content, /name="resourceKey"/);
    assert.match(content, /Eau \(-3\)/);
    assert.match(content, /Nourriture \(-2\)/);
    assert.match(content, /Équipement \(-1\)/);
    assert.match(content, /Énergie \(-2\)/);
    assert.match(content, /Médicaments \(-4\)/);

});


test("createContent affiche un message si aucune Station n'est disponible", () => {

    const content =
        StationSurvivalLauncherDialog.createContent({
            stationOptions: []
        });

    assert.match(content, /Aucune Station n'est disponible/);
    assert.doesNotMatch(content, /name="stationUuid"/);

});


/* ============================================================
 * readSelection
 * ============================================================ */


function fakeForm(elements) {
    return { elements };
}


test("readSelection lit la Station et la ressource choisies", () => {

    const selection =
        StationSurvivalLauncherDialog.readSelection({

            form: fakeForm({
                stationUuid: { value: "Item.station1" },
                resourceKey: { value: "water" }
            }),

            stationOptions: [
                { value: "Item.station1", label: "Petchatniki" }
            ]

        });

    assert.equal(selection.stationUuid, "Item.station1");
    assert.equal(selection.resourceKey, "water");

});


test("readSelection rejette une Station non sélectionnée", () => {

    assert.throws(
        () => StationSurvivalLauncherDialog.readSelection({

            form: fakeForm({
                stationUuid: { value: "" },
                resourceKey: { value: "water" }
            }),

            stationOptions: [
                { value: "Item.station1", label: "Petchatniki" }
            ]

        }),
        /Sélectionnez la Station/
    );

});


test("readSelection rejette une Station qui ne fait pas partie des options fournies", () => {

    assert.throws(
        () => StationSurvivalLauncherDialog.readSelection({

            form: fakeForm({
                stationUuid: { value: "Item.inconnue" },
                resourceKey: { value: "water" }
            }),

            stationOptions: [
                { value: "Item.station1", label: "Petchatniki" }
            ]

        }),
        /n'est plus disponible/
    );

});


test("readSelection rejette une ressource non sélectionnée ou invalide", () => {

    assert.throws(
        () => StationSurvivalLauncherDialog.readSelection({

            form: fakeForm({
                stationUuid: { value: "Item.station1" },
                resourceKey: { value: "" }
            }),

            stationOptions: [
                { value: "Item.station1", label: "Petchatniki" }
            ]

        }),
        /Sélectionnez la ressource/
    );

    assert.throws(
        () => StationSurvivalLauncherDialog.readSelection({

            form: fakeForm({
                stationUuid: { value: "Item.station1" },
                resourceKey: { value: "gold" }
            }),

            stationOptions: [
                { value: "Item.station1", label: "Petchatniki" }
            ]

        }),
        /n'est pas une ressource valide/
    );

});
