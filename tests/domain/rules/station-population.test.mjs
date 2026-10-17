import test from "node:test";
import assert from "node:assert/strict";

import {
    STATION_ZERO_RESOURCE_STRESS_DICE,
    STATION_POPULATION_MEMBER_THRESHOLDS,
    computeStationZeroResourceStressDiceCount,
    resolveStationMoralStressDiceCount,
    resolveStationPopulationLevelForMembers,
    resolveStationPopulationRoll,
    resolveStationContrecoup,
    applyStationPopulationMembersLoss
} from "../../../src/domain/rules/station-population.mjs";


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
 * computeStationZeroResourceStressDiceCount
 * ============================================================ */


test("computeStationZeroResourceStressDiceCount rejette des ressources absentes", () => {

    assert.throws(
        () => computeStationZeroResourceStressDiceCount({}),
        TypeError
    );

});


test("computeStationZeroResourceStressDiceCount renvoie 0 si aucune ressource n'est à 0", () => {

    assert.equal(
        computeStationZeroResourceStressDiceCount({
            resources: fullResources(5)
        }),
        0
    );

});


test("computeStationZeroResourceStressDiceCount cumule la table pour chaque ressource à 0", () => {

    const resources =
        fullResources(5);

    resources.water = 0;
    resources.medicine = 0;

    assert.equal(
        computeStationZeroResourceStressDiceCount({
            resources
        }),
        STATION_ZERO_RESOURCE_STRESS_DICE.water
        + STATION_ZERO_RESOURCE_STRESS_DICE.medicine
    );

});


/* ============================================================
 * resolveStationMoralStressDiceCount
 * ============================================================ */


test("resolveStationMoralStressDiceCount rejette une valeur négative", () => {

    assert.throws(
        () => resolveStationMoralStressDiceCount(-1),
        TypeError
    );

});


test("resolveStationMoralStressDiceCount suit les paliers du livre", () => {

    assert.equal(resolveStationMoralStressDiceCount(0), 0);
    assert.equal(resolveStationMoralStressDiceCount(1), 1);
    assert.equal(resolveStationMoralStressDiceCount(5), 1);
    assert.equal(resolveStationMoralStressDiceCount(6), 2);
    assert.equal(resolveStationMoralStressDiceCount(12), 2);
    assert.equal(resolveStationMoralStressDiceCount(13), 3);
    assert.equal(resolveStationMoralStressDiceCount(500), 3);

});


/* ============================================================
 * resolveStationPopulationLevelForMembers
 * ============================================================ */


test("resolveStationPopulationLevelForMembers suit la table des paliers", () => {

    for (
        const entry
        of STATION_POPULATION_MEMBER_THRESHOLDS
    ) {

        assert.equal(
            resolveStationPopulationLevelForMembers(
                entry.minimumMembers
            ),
            entry.level
        );

    }

});


test("resolveStationPopulationLevelForMembers redescend d'un palier sous le minimum", () => {

    assert.equal(
        resolveStationPopulationLevelForMembers(25),
        0
    );

    assert.equal(
        resolveStationPopulationLevelForMembers(51),
        1
    );

    assert.equal(
        resolveStationPopulationLevelForMembers(103),
        2
    );

});


/* ============================================================
 * resolveStationPopulationRoll
 * ============================================================ */


test("resolveStationPopulationRoll applique les pertes des \"1\" à Eau/Nourriture/Énergie, jamais à l'Équipement", () => {

    const { newResources, overflow, onesTotal } =
        resolveStationPopulationRoll({
            resources: fullResources(5),
            baseOnes: 2,
            baseSixes: 0,
            resourceChoicesForSixes: []
        });

    assert.equal(onesTotal, 2);
    assert.equal(newResources.water, 3);
    assert.equal(newResources.food, 3);
    assert.equal(newResources.energy, 3);
    assert.equal(newResources.equipment, 5);
    assert.equal(
        newResources.medicine,
        4
    );

    assert.deepEqual(
        overflow,
        { water: 0, food: 0, equipment: 0, energy: 0, medicine: 0 }
    );

});


test("resolveStationPopulationRoll ne baisse les Médicaments qu'à partir de deux \"1\", par paliers de deux", () => {

    const oneOne =
        resolveStationPopulationRoll({
            resources: fullResources(5),
            baseOnes: 1,
            baseSixes: 0,
            resourceChoicesForSixes: []
        });

    assert.equal(oneOne.newResources.medicine, 5);

    const fourOnes =
        resolveStationPopulationRoll({
            resources: fullResources(5),
            baseOnes: 4,
            baseSixes: 0,
            resourceChoicesForSixes: []
        });

    assert.equal(fourOnes.newResources.medicine, 3);

});


test("resolveStationPopulationRoll applique un gain par \"6\", au choix, jamais sur les Médicaments", () => {

    assert.throws(
        () => resolveStationPopulationRoll({
            resources: fullResources(5),
            baseOnes: 0,
            baseSixes: 1,
            resourceChoicesForSixes: ["medicine"]
        }),
        /Médicaments/
    );


    const { newResources } =
        resolveStationPopulationRoll({
            resources: fullResources(5),
            baseOnes: 0,
            baseSixes: 1,
            resourceChoicesForSixes: ["water"]
        });

    assert.equal(newResources.water, 6);

});


test("resolveStationPopulationRoll annule simultanément gains et pertes sur une même ressource", () => {

    const { newResources } =
        resolveStationPopulationRoll({
            resources: fullResources(5),
            baseOnes: 1,
            baseSixes: 1,
            resourceChoicesForSixes: ["water"]
        });

    assert.equal(newResources.water, 5);

});


test("resolveStationPopulationRoll inclut les \"1\" des dés de Stress dans les pertes", () => {

    const { newResources, onesTotal } =
        resolveStationPopulationRoll({
            resources: fullResources(5),
            baseOnes: 1,
            stressOnes: 2,
            baseSixes: 0,
            resourceChoicesForSixes: []
        });

    assert.equal(onesTotal, 3);
    assert.equal(newResources.water, 2);

});


test("resolveStationPopulationRoll calcule le débordement sous 0 sans jamais renvoyer une ressource négative", () => {

    const { newResources, overflow } =
        resolveStationPopulationRoll({
            resources: fullResources(1),
            baseOnes: 3,
            baseSixes: 0,
            resourceChoicesForSixes: []
        });

    assert.equal(newResources.water, 0);
    assert.equal(overflow.water, 2);

});


test("resolveStationPopulationRoll plafonne les gains à 10", () => {

    const resources =
        fullResources(5);

    resources.water = 10;

    const { newResources } =
        resolveStationPopulationRoll({
            resources,
            baseOnes: 0,
            baseSixes: 1,
            resourceChoicesForSixes: ["water"]
        });

    assert.equal(newResources.water, 10);

});


test("resolveStationPopulationRoll exige exactement un choix de ressource par \"6\"", () => {

    assert.throws(
        () => resolveStationPopulationRoll({
            resources: fullResources(5),
            baseOnes: 0,
            baseSixes: 2,
            resourceChoicesForSixes: ["water"]
        }),
        TypeError
    );

});


/* ============================================================
 * resolveStationContrecoup
 * ============================================================ */


test("resolveStationContrecoup ne compte aucune perte sans débordement", () => {

    const result =
        resolveStationContrecoup({
            overflow: {
                water: 0, food: 0, equipment: 0, energy: 0, medicine: 0
            }
        });

    assert.equal(result.totalMembersLost, 0);

});


test("resolveStationContrecoup exige exactement un dé déjà lancé par point de débordement", () => {

    assert.throws(
        () => resolveStationContrecoup({
            overflow: { water: 2, food: 0, equipment: 0, energy: 0, medicine: 0 },
            dieResultsByResource: { water: [3] }
        }),
        Error
    );

});


test("resolveStationContrecoup somme les dés de chaque ressource en débordement", () => {

    const result =
        resolveStationContrecoup({
            overflow: { water: 2, food: 1, equipment: 0, energy: 0, medicine: 0 },
            dieResultsByResource: {
                water: [4, 5],
                food: [2]
            }
        });

    assert.equal(result.lossByResource.water, 9);
    assert.equal(result.lossByResource.food, 2);
    assert.equal(result.totalMembersLost, 11);

});


/* ============================================================
 * applyStationPopulationMembersLoss
 * ============================================================ */


test("applyStationPopulationMembersLoss plafonne à 0", () => {

    assert.equal(
        applyStationPopulationMembersLoss({
            currentMembers: 10,
            membersLost: 50
        }),
        0
    );

});


test("applyStationPopulationMembersLoss soustrait normalement", () => {

    assert.equal(
        applyStationPopulationMembersLoss({
            currentMembers: 100,
            membersLost: 30
        }),
        70
    );

});
