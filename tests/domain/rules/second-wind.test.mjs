import test from "node:test";
import assert from "node:assert/strict";

import {
    isSecondWindAvailable,
    resolveSecondWind
} from "../../../src/domain/rules/second-wind.mjs";

import {
    TALENT_IDENTITIES,
    hasTalent,
    isTalentItem,
    normalizeTalentName
} from "../../../src/domain/rules/talent-identity.mjs";


test("Second souffle disponible : talent ET VIGUEUR à 0", () => {
    assert.equal(isSecondWindAvailable({ hasTalent: true, vigor: 0 }), true);
});

test("Second souffle indisponible sans talent ou avec VIGUEUR > 0", () => {
    assert.equal(isSecondWindAvailable({ hasTalent: false, vigor: 0 }), false);
    assert.equal(isSecondWindAvailable({ hasTalent: true, vigor: 1 }), false);
    assert.equal(isSecondWindAvailable({ hasTalent: true, vigor: 4 }), false);
    assert.equal(isSecondWindAvailable({}), false);
    assert.equal(isSecondWindAvailable(), false);
});

test("Second souffle : valeur de champ en direct (chaîne) -> bascule", () => {
    const at = vigor => isSecondWindAvailable({ hasTalent: true, vigor });
    assert.equal(at("0"), true);
    assert.equal(at("1"), false);
    assert.equal(at("0"), true);
    // Champ vidé en cours de saisie ou valeur absente : pas « 0 ».
    assert.equal(at(""), false);
    assert.equal(at("  "), false);
    assert.equal(at(null), false);
    assert.equal(at(undefined), false);
    assert.equal(at("abc"), false);
});

test("resolveSecondWind : 1 point de VIGUEUR par réussite", () => {
    assert.deepEqual(
        resolveSecondWind({ successes: 2, vigor: 0, vigorMax: 5 }),
        { successes: 2, previous: 0, recovered: 2, vigor: 2 }
    );
});

test("resolveSecondWind : 0 réussite -> rien récupéré", () => {
    const result = resolveSecondWind({ successes: 0, vigor: 0, vigorMax: 5 });
    assert.equal(result.recovered, 0);
    assert.equal(result.vigor, 0);
});

test("resolveSecondWind : plafonné au maximum de VIGUEUR", () => {
    const result = resolveSecondWind({ successes: 7, vigor: 0, vigorMax: 4 });
    assert.equal(result.recovered, 4);
    assert.equal(result.vigor, 4);
});

test("resolveSecondWind : entrées invalides tolérées, jamais de recul", () => {
    assert.equal(resolveSecondWind({ successes: -3, vigor: 0, vigorMax: 5 }).recovered, 0);
    assert.equal(resolveSecondWind({ successes: "x", vigor: 0, vigorMax: 5 }).recovered, 0);
    const noMax = resolveSecondWind({ successes: 2, vigor: 0, vigorMax: 0 });
    assert.equal(noMax.recovered, 0);
    assert.equal(noMax.vigor, 0);
});

test("normalizeTalentName ignore casse, accents et espaces", () => {
    assert.equal(normalizeTalentName("  Second   SOUFFLE "), "second souffle");
    assert.equal(normalizeTalentName("Impitoyable"), "impitoyable");
    assert.equal(normalizeTalentName(null), "");
});

test("isTalentItem : identification par clé métier", () => {
    const item = { type: "talent", name: "Autre nom", system: { key: "secondWind" } };
    assert.equal(isTalentItem(item, TALENT_IDENTITIES.SECOND_WIND), true);
});

test("isTalentItem : repli par nom quand la clé est absente ou générée", () => {
    assert.equal(
        isTalentItem(
            { type: "talent", name: "Second souffle", system: { key: "" } },
            TALENT_IDENTITIES.SECOND_WIND
        ),
        true
    );
    assert.equal(
        isTalentItem(
            { type: "talent", name: "IMPITOYABLE", system: { key: "impitoyable" } },
            TALENT_IDENTITIES.RUTHLESS
        ),
        true
    );
});

test("isTalentItem : refuse un autre type d'Item ou un autre talent", () => {
    assert.equal(
        isTalentItem(
            { type: "weapon", name: "Second souffle", system: { key: "secondWind" } },
            TALENT_IDENTITIES.SECOND_WIND
        ),
        false
    );
    assert.equal(
        isTalentItem(
            { type: "talent", name: "Brute", system: { key: "brute" } },
            TALENT_IDENTITIES.SECOND_WIND
        ),
        false
    );
});

test("hasTalent : collection, tableau, null", () => {
    const items = [
        { type: "talent", name: "Brute", system: { key: "brute" } },
        { type: "talent", name: "Impitoyable", system: { key: "ruthless" } }
    ];
    assert.equal(hasTalent(items, TALENT_IDENTITIES.RUTHLESS), true);
    assert.equal(hasTalent(items, TALENT_IDENTITIES.SECOND_WIND), false);
    assert.equal(hasTalent(new Set(items), TALENT_IDENTITIES.RUTHLESS), true);
    assert.equal(hasTalent(null, TALENT_IDENTITIES.RUTHLESS), false);
});
