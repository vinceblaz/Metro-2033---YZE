import test from "node:test";
import assert from "node:assert/strict";

import {
    STATION_SUPPORT_PERSONNEL_ROLL_DICE_COUNT,
    resolveStationSupportPersonnelRoll
} from "../../../src/domain/rules/station-support-personnel.mjs";


test("resolveStationSupportPersonnelRoll exige exactement 3 faces de dé", () => {

    assert.throws(
        () => resolveStationSupportPersonnelRoll({
            diceResults: [1, 2]
        }),
        TypeError
    );

    assert.equal(
        STATION_SUPPORT_PERSONNEL_ROLL_DICE_COUNT,
        3
    );

});


test("resolveStationSupportPersonnelRoll rejette une face hors de 1-6", () => {

    assert.throws(
        () => resolveStationSupportPersonnelRoll({
            diceResults: [1, 2, 7]
        }),
        TypeError
    );

});


test("resolveStationSupportPersonnelRoll compte un succès par \"6\"", () => {

    const result =
        resolveStationSupportPersonnelRoll({
            diceResults: [6, 6, 3]
        });

    assert.equal(result.successes, 2);
    assert.equal(result.resourceGain, 2);
    assert.equal(result.personnelDied, false);

});


test("resolveStationSupportPersonnelRoll tue le personnel sur deux \"1\" ou plus", () => {

    const result =
        resolveStationSupportPersonnelRoll({
            diceResults: [1, 1, 6]
        });

    assert.equal(result.ones, 2);
    assert.equal(result.successes, 1);
    assert.equal(result.personnelDied, true);
    assert.equal(
        result.resourceGain,
        0
    );

});


test("resolveStationSupportPersonnelRoll ne tue pas le personnel sur un seul \"1\"", () => {

    const result =
        resolveStationSupportPersonnelRoll({
            diceResults: [1, 6, 6]
        });

    assert.equal(result.personnelDied, false);
    assert.equal(result.resourceGain, 2);

});
