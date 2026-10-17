import test from "node:test";
import assert from "node:assert/strict";
import { extractCreatureTraits, slugifyTraitName } from "../../../src/data/seed/creature-traits.mjs";

test("slug sans accents ni ponctuation", () => {
    assert.equal(slugifyTraitName("Attaque psychique – désespoir (action lente)"), "attaque-psychique-desespoir-action-lente");
    assert.equal(slugifyTraitName("Vicieuse"), "vicieuse");
});

test("un trait titré est extrait, le reste conservé", () => {
    const html = "<p><strong>Vicieuse :</strong> si la sentinelle réussit une attaque de griffes, elle peut mordre.</p>";
    const r = extractCreatureTraits(html);
    assert.deepEqual(r.traits, [{ name: "Vicieuse", effect: "si la sentinelle réussit une attaque de griffes, elle peut mordre." }]);
    assert.equal(r.remainder, "");
});

test("paragraphe sans titre conservé dans le reste", () => {
    const html = "<p>Texte libre.</p><p><strong>Vol :</strong> vole.</p>";
    const r = extractCreatureTraits(html);
    assert.equal(r.traits.length, 1);
    assert.equal(r.remainder, "<p>Texte libre.</p>");
});

test("« Note » n'est pas un trait", () => {
    const html = "<p><strong>Note :</strong> précision.</p>";
    const r = extractCreatureTraits(html);
    assert.deepEqual(r.traits, []);
    assert.equal(r.remainder, html);
});

test("entrée vide ou absente", () => {
    assert.deepEqual(extractCreatureTraits(""), { traits: [], remainder: "" });
    assert.deepEqual(extractCreatureTraits(undefined), { traits: [], remainder: "" });
});
