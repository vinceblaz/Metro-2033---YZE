import test from "node:test";
import assert from "node:assert/strict";

import {
    htmlToPlainText,
    buildEmbeddedItemTooltip
} from "../../../src/domain/rules/embedded-item-tooltip.mjs";


test("htmlToPlainText retire les balises et normalise les espaces", () => {

    assert.equal(
        htmlToPlainText("<p><strong>Vol :</strong> +2&nbsp;à la RÉACTION.</p><p>Suite &amp; fin</p>"),
        "Vol : +2 à la RÉACTION. Suite & fin"
    );

    assert.equal(htmlToPlainText(null), "");

});


test("Arme : capacité particulière puis description", () => {

    const text = buildEmbeddedItemTooltip({
        type: "weapon",
        system: { special: "Vicieuse : morsure.", description: "<p>Griffes.</p>" }
    });

    assert.equal(text, "Vicieuse : morsure. — Griffes.");

});


test("Talent : texte d'effet en priorité", () => {

    const text = buildEmbeddedItemTooltip({
        type: "talent",
        system: { effect: "Effet du talent.", description: "" }
    });

    assert.equal(text, "Effet du talent.");

});


test("Item sans texte : info-bulle vide", () => {

    assert.equal(buildEmbeddedItemTooltip({ type: "armor", system: {} }), "");
    assert.equal(buildEmbeddedItemTooltip(null), "");

});
