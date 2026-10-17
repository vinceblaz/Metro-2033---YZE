import test from "node:test";
import assert from "node:assert/strict";

import {
    AfflictionAllocationDialog
} from "../../../src/foundry/afflictions/affliction-allocation-dialog.mjs";


function names(content) {
    return [...content.matchAll(/name="([^"]+)"/g)].map(match => match[1]);
}

test("createContent annonce le nombre d'afflictions et met tout en dégâts d'attribut par défaut", () => {
    const content = AfflictionAllocationDialog.createContent({
        available: 3,
        attributeLabel: "Agilité",
        equipment: { allowed: false }
    });

    assert.match(content, /<strong>3<\/strong>\s*afflictions\s*à répartir/);
    assert.match(content, /Dégâts à Agilité/);
    assert.match(content, /name="allocation\.attribute"[^>]*value="3"/);
    assert.match(content, /name="allocation\.composure"[^>]*value="0"/);
    assert.match(content, /name="allocation\.stress"[^>]*value="0"/);
    assert.match(content, /data-role="allocated-total">3</);
    assert.match(content, /data-role="available-total">3</);
});

test("createContent : singulier pour une seule affliction", () => {
    const content = AfflictionAllocationDialog.createContent({
        available: 1,
        attributeLabel: "Vigueur"
    });

    assert.match(content, /<strong>1<\/strong>\s*affliction\s*à répartir/);
});

test("createContent : ligne Équipement absente si non autorisée, présente (max 1) sinon", () => {
    const without = AfflictionAllocationDialog.createContent({
        available: 2,
        attributeLabel: "Agilité",
        equipment: { allowed: false, label: "Makarov" }
    });
    assert.doesNotMatch(without, /allocation\.equipment/);

    const withEquipment = AfflictionAllocationDialog.createContent({
        available: 2,
        attributeLabel: "Agilité",
        equipment: { allowed: true, label: "Makarov" }
    });
    assert.match(withEquipment, /Équipement : Makarov/);
    assert.match(withEquipment, /name="allocation\.equipment"[^>]*max="1"/);
});

test("createContent : aucun attribut name en doublon et libellés échappés", () => {
    const content = AfflictionAllocationDialog.createContent({
        available: 2,
        attributeLabel: "<script>",
        equipment: { allowed: true, label: "<img>" },
        rollLabel: "<b>Jet</b>"
    });

    const list = names(content);

    assert.equal(new Set(list).size, list.length);
    assert.doesNotMatch(content, /<script>|<img>|<b>Jet/);
});

test("readDraft lit les champs du formulaire, un champ absent vaut 0", () => {
    const draft = AfflictionAllocationDialog.readDraft({
        elements: {
            "allocation.attribute": { value: "1" },
            "allocation.composure": { value: "1" },
            "allocation.stress": { value: "0" }
        }
    });

    assert.deepEqual(draft, {
        attribute: "1",
        composure: "1",
        equipment: 0,
        stress: "0"
    });
});

test("prompt refuse un nombre d'afflictions nul ou invalide", async () => {
    await assert.rejects(
        AfflictionAllocationDialog.prompt({ available: 0, DialogV2Class: class {} }),
        TypeError
    );
});
