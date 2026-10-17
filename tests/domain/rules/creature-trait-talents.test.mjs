import test from "node:test";
import assert from "node:assert/strict";
import {
    evaluateTalentForAction,
    TALENT_CONDITION_STATES,
    TALENT_KEYS
} from "../../../src/domain/rules/talents.mjs";

const talent = key => ({ key, level: 1 });
const value = r => r.effects[0].suggestedValue;

test("Vol : +2 proposé (décoché) sur un jet de Réaction", () => {
    const r = evaluateTalentForAction(talent(TALENT_KEYS.CREATURE_FLIGHT), { actionType: "skill-roll", skill: "reaction" });
    assert.equal(value(r), 2);
    assert.equal(r.selected, false);
    assert.equal(r.conditionState, TALENT_CONDITION_STATES.UNKNOWN);
});

test("Vol : non pertinent hors Réaction", () => {
    assert.equal(evaluateTalentForAction(talent(TALENT_KEYS.CREATURE_FLIGHT), { actionType: "skill-roll", skill: "shooting" }), null);
});

test("Photosensible : −2 proposé sur Corps à corps, Réaction, Tir, Observation", () => {
    for (const skill of ["closeCombat", "reaction", "shooting", "observation"]) {
        const r = evaluateTalentForAction(talent(TALENT_KEYS.CREATURE_PHOTOSENSITIVE), { actionType: "skill-roll", skill });
        assert.equal(value(r), -2, skill);
        assert.equal(r.selected, false);
    }
    assert.equal(evaluateTalentForAction(talent(TALENT_KEYS.CREATURE_PHOTOSENSITIVE), { actionType: "skill-roll", skill: "stealth" }), null);
});

test("Léthargie : −2 proposé pour attaquer ou fuir", () => {
    for (const ctx of [
        { actionType: "melee-attack", skill: "closeCombat" },
        { actionType: "ranged-attack", skill: "shooting" },
        { actionType: "skill-roll", skill: "reaction" }
    ]) {
        const r = evaluateTalentForAction(talent(TALENT_KEYS.CREATURE_LETHARGY), ctx);
        assert.equal(value(r), -2);
        assert.equal(r.selected, false);
    }
    assert.equal(evaluateTalentForAction(talent(TALENT_KEYS.CREATURE_LETHARGY), { actionType: "skill-roll", skill: "observation" }), null);
});
