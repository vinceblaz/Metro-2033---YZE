import test from "node:test";
import assert from "node:assert/strict";

import {
    STATION_SURVIVAL_ROLL_MODIFIERS,
    getStationSurvivalRollModifier,
    applyStationSurvivalRollSuccesses
} from "../../../src/domain/rules/station-survival-roll.mjs";


test("getStationSurvivalRollModifier renvoie le modificateur du livre pour chaque ressource", () => {

    for (
        const [key, modifier]
        of Object.entries(STATION_SURVIVAL_ROLL_MODIFIERS)
    ) {

        assert.equal(
            getStationSurvivalRollModifier(key),
            modifier
        );

    }

});


test("getStationSurvivalRollModifier rejette une ressource inconnue", () => {

    assert.throws(
        () => getStationSurvivalRollModifier("ammo"),
        TypeError
    );

});


test("applyStationSurvivalRollSuccesses augmente la ressource d'une réussite", () => {

    assert.equal(
        applyStationSurvivalRollSuccesses({
            currentLevel: 4,
            successes: 2
        }),
        6
    );

});


test("applyStationSurvivalRollSuccesses plafonne à 10", () => {

    assert.equal(
        applyStationSurvivalRollSuccesses({
            currentLevel: 9,
            successes: 5
        }),
        10
    );

});


test("applyStationSurvivalRollSuccesses rejette un niveau actuel invalide", () => {

    assert.throws(
        () => applyStationSurvivalRollSuccesses({
            currentLevel: 11,
            successes: 1
        }),
        TypeError
    );

});


test("applyStationSurvivalRollSuccesses rejette un nombre de réussites négatif", () => {

    assert.throws(
        () => applyStationSurvivalRollSuccesses({
            currentLevel: 4,
            successes: -1
        }),
        TypeError
    );

});
