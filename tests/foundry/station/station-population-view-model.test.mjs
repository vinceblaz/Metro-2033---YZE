import test from "node:test";
import assert from "node:assert/strict";

import {
    STATION_RESOURCE_DEFINITIONS,
    buildStationPopulationLauncherViewModel,
    buildStationPopulationRecapViewModel,
    assertResourceDefinitionsAreComplete,
    diceFaceSquare,
    diceFacesToSquares
} from "../../../src/foundry/station/station-population-view-model.mjs";


function fullResources(level = 5) {

    return {
        water: level,
        food: level,
        equipment: level,
        energy: level,
        medicine: level
    };

}


test("diceFaceSquare marque succès (6) et échec (1) par défaut", () => {

    assert.deepEqual(
        diceFaceSquare(6),
        { value: 6, success: true, one: false }
    );

    assert.deepEqual(
        diceFaceSquare(1),
        { value: 1, success: false, one: true }
    );

    assert.deepEqual(
        diceFaceSquare(3),
        { value: 3, success: false, one: false }
    );

});


test("diceFaceSquare peut désactiver le marquage des succès (dés de Stress) et des échecs (dés de contrecoup)", () => {

    assert.deepEqual(
        diceFaceSquare(6, { successOnSix: false }),
        { value: 6, success: false, one: false }
    );

    assert.deepEqual(
        diceFaceSquare(1, { markOnes: false }),
        { value: 1, success: false, one: false }
    );

});


test("diceFacesToSquares assemble une série de dés dans l'ordre obtenu", () => {

    assert.deepEqual(
        diceFacesToSquares([6, 1, 3]),
        [
            { value: 6, success: true, one: false },
            { value: 1, success: false, one: true },
            { value: 3, success: false, one: false }
        ]
    );

    assert.deepEqual(diceFacesToSquares([]), []);
    assert.deepEqual(diceFacesToSquares(), []);

});


test("STATION_RESOURCE_DEFINITIONS couvre les 5 ressources connues", () => {

    assert.equal(
        assertResourceDefinitionsAreComplete(),
        true
    );

    assert.equal(
        STATION_RESOURCE_DEFINITIONS.length,
        5
    );

});


/* ============================================================
 * buildStationPopulationLauncherViewModel
 * ============================================================ */


test("buildStationPopulationLauncherViewModel en phase intro n'affiche aucun résumé de jet", () => {

    const viewModel =
        buildStationPopulationLauncherViewModel({
            stationName: "Polis",
            resources: fullResources(3),
            supportPersonnel: {
                water: 1, food: 0, equipment: 0, energy: 0, medicine: 0
            },
            population: {
                level: 4, members: 200, pendingMoralStressDice: 1
            },
            phase: "intro"
        });

    assert.equal(viewModel.isIntro, true);
    assert.equal(viewModel.isChoices, false);
    assert.equal(viewModel.rollSummary, null);
    assert.equal(viewModel.sixChoiceSlots.length, 0);
    assert.equal(viewModel.canValidate, false);

    assert.equal(viewModel.resourceRows.length, 5);
    assert.equal(viewModel.resourceRows[0].key, "water");
    assert.equal(viewModel.resourceRows[0].level, 3);
    assert.equal(viewModel.resourceRows[0].supportPersonnel, 1);

    assert.equal(viewModel.population.level, 4);
    assert.equal(viewModel.population.members, 200);
    assert.equal(viewModel.population.pendingMoralStressDice, 1);

});


test("buildStationPopulationLauncherViewModel en phase choices prépare un menu par \"6\" obtenu, sans Médicaments", () => {

    const viewModel =
        buildStationPopulationLauncherViewModel({
            stationName: "Polis",
            resources: fullResources(3),
            supportPersonnel: {
                water: 1, food: 0, equipment: 0, energy: 0, medicine: 2
            },
            population: {
                level: 4, members: 200, pendingMoralStressDice: 0
            },
            phase: "choices",
            rollOutcome: {
                supportResults: {
                    water: { successes: 1, ones: 0, personnelDied: false, resourceGain: 1, diceResults: [6, 3, 4] },
                    food: null,
                    equipment: null,
                    energy: null,
                    medicine: { successes: 0, ones: 2, personnelDied: true, resourceGain: 0, diceResults: [1, 1, 4] }
                },
                populationDice: {
                    baseDice: [1, 6, 6, 3],
                    stressDice: [1],
                    zeroResourceStressDiceCount: 0,
                    baseOnes: 1,
                    baseSixes: 2,
                    stressOnes: 1
                }
            },
            resourceChoicesForSixes: ["water"]
        });

    assert.equal(viewModel.isChoices, true);
    assert.equal(viewModel.rollSummary.baseOnes, 1);
    assert.equal(viewModel.rollSummary.baseSixes, 2);
    assert.equal(viewModel.rollSummary.stressOnes, 1);
    assert.deepEqual(
        viewModel.rollSummary.baseDiceSquares,
        [
            { value: 1, success: false, one: true },
            { value: 6, success: true, one: false },
            { value: 6, success: true, one: false },
            { value: 3, success: false, one: false }
        ]
    );
    // Les "6" d'un dé de Stress ne sont jamais des succès (règles p.218-219).
    assert.deepEqual(
        viewModel.rollSummary.stressDiceSquares,
        [{ value: 1, success: false, one: true }]
    );

    assert.equal(viewModel.rollSummary.supportPersonnelRows.length, 2);
    assert.equal(viewModel.rollSummary.supportPersonnelRows[0].key, "water");
    assert.deepEqual(
        viewModel.rollSummary.supportPersonnelRows[0].diceSquares,
        [
            { value: 6, success: true, one: false },
            { value: 3, success: false, one: false },
            { value: 4, success: false, one: false }
        ]
    );
    assert.equal(viewModel.rollSummary.supportPersonnelRows[1].key, "medicine");
    assert.equal(viewModel.rollSummary.supportPersonnelRows[1].personnelDied, true);
    assert.deepEqual(
        viewModel.rollSummary.supportPersonnelRows[1].diceSquares,
        [
            { value: 1, success: false, one: true },
            { value: 1, success: false, one: true },
            { value: 4, success: false, one: false }
        ]
    );

    assert.equal(viewModel.sixChoiceSlots.length, 2);
    assert.equal(viewModel.sixChoiceSlots[0].selected, "water");
    assert.equal(viewModel.sixChoiceSlots[1].selected, "");

    for (const slot of viewModel.sixChoiceSlots) {
        assert.equal(
            slot.options.some(option => option.key === "medicine"),
            false
        );
    }

    // Un des deux choix est encore vide => on ne peut pas valider.
    assert.equal(viewModel.canValidate, false);

});


test("buildStationPopulationLauncherViewModel autorise la validation quand tous les choix sont faits", () => {

    const viewModel =
        buildStationPopulationLauncherViewModel({
            resources: fullResources(3),
            supportPersonnel: {
                water: 0, food: 0, equipment: 0, energy: 0, medicine: 0
            },
            population: { level: 2, members: 60, pendingMoralStressDice: 0 },
            phase: "choices",
            rollOutcome: {
                supportResults: {
                    water: null, food: null, equipment: null, energy: null, medicine: null
                },
                populationDice: {
                    baseDice: [6, 6],
                    stressDice: [],
                    zeroResourceStressDiceCount: 0,
                    baseOnes: 0,
                    baseSixes: 2,
                    stressOnes: 0
                }
            },
            resourceChoicesForSixes: ["water", "food"]
        });

    assert.equal(viewModel.canValidate, true);

});


/* ============================================================
 * buildStationPopulationRecapViewModel
 * ============================================================ */


test("buildStationPopulationRecapViewModel sans contrecoup ni mort de personnel", () => {

    const viewModel =
        buildStationPopulationRecapViewModel({
            stationName: "VDNKh",
            resourcesBefore: fullResources(5),
            supportResults: {
                water: { successes: 1, ones: 0, personnelDied: false, resourceGain: 1, diceResults: [6, 4, 3] },
                food: null,
                equipment: null,
                energy: null,
                medicine: null
            },
            populationDice: {
                baseDice: [2, 3, 4],
                stressDice: [],
                zeroResourceStressDiceCount: 0,
                baseOnes: 0,
                baseSixes: 0,
                stressOnes: 0
            },
            resourceChoicesForSixes: [],
            membersBefore: 150,
            levelBefore: 3,
            weekResult: {
                newResources: {
                    water: 6, food: 5, equipment: 5, energy: 5, medicine: 5
                },
                overflow: {
                    water: 0, food: 0, equipment: 0, energy: 0, medicine: 0
                },
                contrecoup: {
                    dieResultsByResource: {},
                    lossByResource: {
                        water: 0, food: 0, equipment: 0, energy: 0, medicine: 0
                    },
                    totalMembersLost: 0
                },
                newMembers: 150,
                newLevel: 3,
                nextWeekMoralStressDice: 0
            }
        });

    assert.equal(viewModel.stationName, "VDNKh");
    assert.equal(viewModel.hasContrecoup, false);
    assert.equal(viewModel.contrecoupRows.length, 0);
    assert.equal(viewModel.personnelLostRows.length, 0);

    const water =
        viewModel.resourceRows.find(row => row.key === "water");

    assert.equal(water.before, 5);
    assert.equal(water.after, 6);
    assert.equal(water.delta, 1);

    assert.deepEqual(
        viewModel.supportPersonnelRows.find(row => row.key === "water").diceSquares,
        [
            { value: 6, success: true, one: false },
            { value: 4, success: false, one: false },
            { value: 3, success: false, one: false }
        ]
    );
    assert.deepEqual(
        viewModel.populationDiceSummary.baseDiceSquares,
        [
            { value: 2, success: false, one: false },
            { value: 3, success: false, one: false },
            { value: 4, success: false, one: false }
        ]
    );

    assert.equal(viewModel.membersBefore, 150);
    assert.equal(viewModel.membersAfter, 150);
    assert.equal(viewModel.levelChanged, false);
    assert.equal(viewModel.nextWeekMoralStressDice, 0);

});


test("buildStationPopulationRecapViewModel avec contrecoup, mort de personnel et chute de niveau", () => {

    const viewModel =
        buildStationPopulationRecapViewModel({
            stationName: "Rizhskaya",
            resourcesBefore: fullResources(1),
            supportResults: {
                water: { successes: 0, ones: 2, personnelDied: true, resourceGain: 0, diceResults: [1, 1, 4] },
                food: null,
                equipment: null,
                energy: null,
                medicine: null
            },
            populationDice: {
                baseDice: [1, 1, 1],
                stressDice: [],
                zeroResourceStressDiceCount: 0,
                baseOnes: 3,
                baseSixes: 0,
                stressOnes: 0
            },
            resourceChoicesForSixes: [],
            membersBefore: 30,
            levelBefore: 1,
            weekResult: {
                newResources: {
                    water: 0, food: 0, equipment: 1, energy: 0, medicine: 0
                },
                overflow: {
                    water: 2, food: 2, equipment: 0, energy: 2, medicine: 0
                },
                contrecoup: {
                    dieResultsByResource: {
                        water: [3, 4],
                        food: [2, 2],
                        energy: [1, 1]
                    },
                    lossByResource: {
                        water: 7, food: 4, equipment: 0, energy: 2, medicine: 0
                    },
                    totalMembersLost: 13
                },
                newMembers: 17,
                newLevel: 0,
                nextWeekMoralStressDice: 3
            }
        });

    assert.equal(viewModel.hasContrecoup, true);
    assert.equal(viewModel.contrecoupRows.length, 3);
    assert.deepEqual(
        viewModel.contrecoupRows.map(row => row.key),
        ["water", "food", "energy"]
    );
    // Les dés de contrecoup ne marquent ni succès ni échec : leur
    // valeur est directement le nombre de membres perdus par dé,
    // pas un résultat de réussite/échec.
    assert.deepEqual(
        viewModel.contrecoupRows.find(row => row.key === "water").diceSquares,
        [
            { value: 3, success: false, one: false },
            { value: 4, success: false, one: false }
        ]
    );

    assert.deepEqual(
        viewModel.populationDiceSummary.baseDiceSquares,
        [
            { value: 1, success: false, one: true },
            { value: 1, success: false, one: true },
            { value: 1, success: false, one: true }
        ]
    );

    assert.deepEqual(
        viewModel.supportPersonnelRows.find(row => row.key === "water").diceSquares,
        [
            { value: 1, success: false, one: true },
            { value: 1, success: false, one: true },
            { value: 4, success: false, one: false }
        ]
    );

    assert.equal(viewModel.totalMembersLost, 13);
    assert.equal(viewModel.membersAfter, 17);
    assert.equal(viewModel.levelBefore, 1);
    assert.equal(viewModel.levelAfter, 0);
    assert.equal(viewModel.levelChanged, true);
    assert.equal(viewModel.nextWeekMoralStressDice, 3);

    assert.equal(viewModel.personnelLostRows.length, 1);
    assert.equal(viewModel.personnelLostRows[0].key, "water");

});


test("buildStationPopulationRecapViewModel liste les ressources choisies pour les \"6\"", () => {

    const viewModel =
        buildStationPopulationRecapViewModel({
            resourcesBefore: fullResources(5),
            supportResults: {
                water: null, food: null, equipment: null, energy: null, medicine: null
            },
            populationDice: {
                baseDice: [6, 6],
                stressDice: [],
                zeroResourceStressDiceCount: 0,
                baseOnes: 0,
                baseSixes: 2,
                stressOnes: 0
            },
            resourceChoicesForSixes: ["water", "equipment"],
            membersBefore: 200,
            levelBefore: 4,
            weekResult: {
                newResources: {
                    water: 6, food: 5, equipment: 6, energy: 5, medicine: 5
                },
                overflow: {
                    water: 0, food: 0, equipment: 0, energy: 0, medicine: 0
                },
                contrecoup: {
                    dieResultsByResource: {},
                    lossByResource: {
                        water: 0, food: 0, equipment: 0, energy: 0, medicine: 0
                    },
                    totalMembersLost: 0
                },
                newMembers: 200,
                newLevel: 4,
                nextWeekMoralStressDice: 0
            }
        });

    assert.deepEqual(
        viewModel.sixChoiceRows,
        [
            { key: "water", label: "Eau" },
            { key: "equipment", label: "Équipement" }
        ]
    );

});
