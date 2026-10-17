import test from "node:test";
import assert from "node:assert/strict";

import {
    rollStationSupportPersonnel,
    rollStationPopulationDice,
    applyStationPopulationWeek
} from "../../../src/domain/rules/station-population-roll-workflow.mjs";


function queueDie(
    faces
) {

    let index =
        0;

    return () => {

        if (index >= faces.length) {

            throw new Error(
                "Plus de face de dé préparée dans la file."
            );

        }


        return faces[index++];

    };

}


function fullResources(level = 5) {

    return {
        water: level,
        food: level,
        equipment: level,
        energy: level,
        medicine: level
    };

}


/* ============================================================
 * rollStationSupportPersonnel
 * ============================================================ */


test("rollStationSupportPersonnel ne lance aucun dé pour une ressource sans personnel", () => {

    const results =
        rollStationSupportPersonnel({
            supportPersonnel: {
                water: 0, food: 0, equipment: 0, energy: 0, medicine: 0
            },

            rollDie:
                () => {
                    throw new Error("ne devrait jamais être appelé");
                }
        });

    for (
        const key
        of Object.keys(results)
    ) {
        assert.equal(results[key], null);
    }

});


test("rollStationSupportPersonnel lance 3 dés par ressource pourvue d'un personnel", () => {

    const results =
        rollStationSupportPersonnel({
            supportPersonnel: {
                water: 1, food: 0, equipment: 0, energy: 0, medicine: 2
            },

            rollDie:
                queueDie([
                    6, 6, 3,
                    1, 1, 4
                ])
        });

    assert.equal(results.water.successes, 2);
    assert.equal(results.water.personnelDied, false);
    assert.deepEqual(results.water.diceResults, [6, 6, 3]);

    assert.equal(results.medicine.ones, 2);
    assert.equal(results.medicine.personnelDied, true);
    assert.deepEqual(results.medicine.diceResults, [1, 1, 4]);

    assert.equal(results.food, null);

});


/* ============================================================
 * rollStationPopulationDice
 * ============================================================ */


test("rollStationPopulationDice rejette un niveau de Population invalide", () => {

    assert.throws(
        () => rollStationPopulationDice({
            resources: fullResources(),
            populationLevel: -1
        }),
        TypeError
    );

});


test("rollStationPopulationDice lance le pool de base et les dés de Stress séparément", () => {

    const resources =
        fullResources(5);

    resources.water = 0;
    // water à 0 => 3 dés de Stress (table du livre)

    const result =
        rollStationPopulationDice({
            resources,
            populationLevel: 4,
            pendingMoralStressDice: 2,
            rollDie:
                queueDie([
                    1, 1, 6, 4,      // 4 dés de base
                    1, 6, 1, 1, 1    // 5 dés de Stress (3 ressource + 2 Moral)
                ])
        });

    assert.equal(result.baseDice.length, 4);
    assert.equal(result.stressDice.length, 5);
    assert.equal(result.zeroResourceStressDiceCount, 3);

    assert.equal(result.baseOnes, 2);
    assert.equal(result.baseSixes, 1);

    // Sur les 5 dés de stress : 4 "1" et 1 "6" (le "6" ne compte pas)
    assert.equal(result.stressOnes, 4);

});


/* ============================================================
 * applyStationPopulationWeek
 * ============================================================ */


test("applyStationPopulationWeek sans débordement ne lance aucun dé de contrecoup", () => {

    const result =
        applyStationPopulationWeek({
            resources: fullResources(5),
            members: 350,
            baseOnes: 1,
            baseSixes: 0,
            stressOnes: 0,
            resourceChoicesForSixes: [],
            rollDie:
                () => {
                    throw new Error("aucun dé de contrecoup attendu");
                }
        });

    assert.equal(result.contrecoup.totalMembersLost, 0);
    assert.equal(result.newMembers, 350);
    assert.equal(result.nextWeekMoralStressDice, 0);

});


test("applyStationPopulationWeek lance les dés de contrecoup pour chaque point de débordement et met à jour la Population", () => {

    // Toutes les ressources à 1, 3 "1" obtenus => Eau/Nourriture/
    // Énergie débordent chacune de 2 points (1 - 3 = -2).
    // L'Équipement n'est jamais affecté par les "1" et les
    // Médicaments ne baissent que de floor(3/2)=1 => pas de
    // débordement pour ces deux-là.
    const result =
        applyStationPopulationWeek({
            resources: fullResources(1),
            members: 50,
            baseOnes: 3,
            baseSixes: 0,
            stressOnes: 0,
            resourceChoicesForSixes: [],
            rollDie:
                queueDie([
                    1, 1, // 2 dés de contrecoup pour l'Eau
                    1, 1, // 2 dés de contrecoup pour la Nourriture
                    1, 1  // 2 dés de contrecoup pour l'Énergie
                ])
        });

    assert.equal(result.overflow.water, 2);
    assert.equal(result.overflow.food, 2);
    assert.equal(result.overflow.energy, 2);
    assert.equal(result.overflow.equipment, 0);
    assert.equal(result.overflow.medicine, 0);

    assert.equal(result.contrecoup.totalMembersLost, 6);
    assert.equal(result.newMembers, 44);
    // 44 membres >= seuil minimum du palier 1 (26)
    assert.equal(result.newLevel, 1);
    // 6 membres perdus => table p.221 : 6-12 => 2 dés de Moral
    assert.equal(result.nextWeekMoralStressDice, 2);

});


test("applyStationPopulationWeek fait chuter la Population si les membres passent sous le seuil minimum", () => {

    const result =
        applyStationPopulationWeek({
            resources: fullResources(1),
            members: 30,
            baseOnes: 3,
            baseSixes: 0,
            stressOnes: 0,
            resourceChoicesForSixes: [],
            rollDie:
                queueDie([
                    6, 6, // Eau
                    6, 6, // Nourriture
                    6, 6  // Énergie
                ])
        });

    assert.equal(result.contrecoup.totalMembersLost, 36);
    assert.equal(result.newMembers, 0);
    assert.equal(result.newLevel, 0);

});
