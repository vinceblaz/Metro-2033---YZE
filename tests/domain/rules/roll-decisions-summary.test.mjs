import test from "node:test";
import assert from "node:assert/strict";
import { summarizeRollDecisions } from "../../../src/domain/rules/roll-decisions-summary.mjs";

test("sans préparation : liste vide", () => {
    assert.deepEqual(summarizeRollDecisions(undefined), []);
    assert.deepEqual(summarizeRollDecisions({}), []);
});

test("difficulté nommée avec son modificateur signé", () => {
    const lines = summarizeRollDecisions({ difficulty: { label: "Délicate", modifier: -1 } });
    assert.deepEqual(lines, ["Difficulté : Délicate (−1 dé)"]);
});

test("difficulté moyenne : mentionnée sans modificateur", () => {
    const lines = summarizeRollDecisions({ difficulty: { label: "Moyenne", modifier: 0 } });
    assert.deepEqual(lines, ["Difficulté : Moyenne"]);
});

test("sources cochées avec leur type et leur bonus", () => {
    const lines = summarizeRollDecisions({
        selectedSources: [
            { label: "Couteau", type: "weapon", bonus: 2 },
            { label: "Gilet", type: "equipment", bonus: 1 },
            { label: "Tireur d'élite", type: "talent", bonus: 1 }
        ]
    });
    assert.deepEqual(lines, [
        "Arme — Couteau : +2 dés",
        "Équipement — Gilet : +1 dé",
        "Talent — Tireur d'élite : +1 dé"
    ]);
});

test("modificateur manuel et Stress volontaire", () => {
    const lines = summarizeRollDecisions({ totals: { modifier: -2, stressBonus: 3, extraStressDie: 1 } });
    assert.deepEqual(lines, [
        "Modificateur manuel : −2 dés",
        "Stress volontaire : +3 dés et 1 dé de Stress supplémentaire"
    ]);
});

test("source sans bonus : listée sans dés", () => {
    const lines = summarizeRollDecisions({ selectedSources: [{ label: "Lunettes", type: "equipment", bonus: 0 }] });
    assert.deepEqual(lines, ["Équipement — Lunettes"]);
});
