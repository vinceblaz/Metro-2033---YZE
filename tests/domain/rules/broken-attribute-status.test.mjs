import test from "node:test";
import assert from "node:assert/strict";
import {
    BROKEN_ATTRIBUTE_STATUS_EFFECTS,
    resolveBrokenAttributeStatusSync
} from "../../../src/domain/rules/broken-attribute-status.mjs";

test("quatre états Brisé, un par attribut, identifiants distincts", () => {
    assert.equal(BROKEN_ATTRIBUTE_STATUS_EFFECTS.length, 4);
    const ids = BROKEN_ATTRIBUTE_STATUS_EFFECTS.map(e => e.id);
    assert.equal(new Set(ids).size, 4);
    for (const e of BROKEN_ATTRIBUTE_STATUS_EFFECTS) {
        assert.ok(e.name.startsWith("Brisé"));
        assert.ok(e.img.startsWith("icons/svg/"));
    }
});

test("attribut à 0 sans état : ajout", () => {
    const r = resolveBrokenAttributeStatusSync({
        attributes: { vigor: { value: 0 }, agility: { value: 3 }, spirit: { value: 2 }, empathy: { value: 1 } },
        activeStatusIds: []
    });
    assert.deepEqual(r.add, ["brokenVigor"]);
    assert.deepEqual(r.remove, []);
});

test("attribut remonté au-dessus de 0 avec état présent : retrait", () => {
    const r = resolveBrokenAttributeStatusSync({
        attributes: { vigor: { value: 1 }, agility: { value: 3 }, spirit: { value: 2 }, empathy: { value: 1 } },
        activeStatusIds: ["brokenVigor"]
    });
    assert.deepEqual(r.add, []);
    assert.deepEqual(r.remove, ["brokenVigor"]);
});

test("plusieurs attributs Brisés : plusieurs états", () => {
    const r = resolveBrokenAttributeStatusSync({
        attributes: { vigor: { value: 0 }, agility: { value: 0 }, spirit: { value: 2 }, empathy: { value: 1 } },
        activeStatusIds: []
    });
    assert.deepEqual(r.add.sort(), ["brokenAgility", "brokenVigor"]);
});

test("déjà aligné : rien à faire ; valeur absente ignorée", () => {
    const r = resolveBrokenAttributeStatusSync({
        attributes: { vigor: { value: 0 }, agility: {} },
        activeStatusIds: ["brokenVigor"]
    });
    assert.deepEqual(r, { add: [], remove: [] });
});

test("les états étrangers sont ignorés", () => {
    const r = resolveBrokenAttributeStatusSync({
        attributes: { vigor: { value: 2 } },
        activeStatusIds: ["burning", "composureBroken"]
    });
    assert.deepEqual(r, { add: [], remove: [] });
});
