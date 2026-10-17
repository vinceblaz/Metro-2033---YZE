/**
 * Orchestration testable du jet de Population hebdomadaire
 * (système Station, livre p.218-221).
 *
 * Contrairement aux modules de src/domain/rules/station-*.mjs,
 * qui ne font que dériver un résultat à partir de dés déjà
 * lancés, ce module lance lui-même les dés — mais via une
 * fonction `rollDie` injectable (par défaut Math.random),
 * exactement comme `YZERoll.roll()`/`push()` acceptent un
 * `drawDie` injectable. Cela permet de tester entièrement
 * l'enchaînement (Personnel de soutien → jet de Population →
 * contrecoup → Moral) avec des dés déterministes, sans dépendre
 * de l'API Foundry : l'intégration réelle (fiche Station,
 * ApplicationV2, ChatMessage) ne fait qu'appeler ces fonctions.
 */

import {
    STATION_RESOURCE_KEYS,
    computeStationZeroResourceStressDiceCount,
    resolveStationPopulationRoll,
    resolveStationContrecoup,
    applyStationPopulationMembersLoss,
    resolveStationPopulationLevelForMembers,
    resolveStationMoralStressDiceCount
} from "./station-population.mjs";

import {
    resolveStationSupportPersonnelRoll,
    STATION_SUPPORT_PERSONNEL_ROLL_DICE_COUNT
} from "./station-support-personnel.mjs";


export function rollStationDieDefault() {

    return Math.floor(
        Math.random() * 6
    ) + 1;

}


function rollDice(
    count,
    rollDie
) {

    return Array.from(
        { length: count },
        () => rollDie()
    );

}


/**
 * Jet à 3 dés du Personnel de soutien, pour chaque ressource
 * qui en dispose d'au moins un (règles p.219). Doit être
 * résolu AVANT le jet de Population lui-même ; ses gains
 * éventuels doivent être appliqués aux ressources avant de
 * calculer les dés de Stress dus aux ressources à 0 pour le
 * jet de Population.
 */
export function rollStationSupportPersonnel({
    supportPersonnel,
    rollDie = rollStationDieDefault
} = {}) {

    const resultsByResource = {};

    for (
        const key
        of STATION_RESOURCE_KEYS
    ) {

        const count =
            Number(
                supportPersonnel?.[key]
                ?? 0
            );

        if (count <= 0) {

            resultsByResource[key] =
                null;

            continue;

        }


        const diceResults =
            rollDice(
                STATION_SUPPORT_PERSONNEL_ROLL_DICE_COUNT,
                rollDie
            );

        resultsByResource[key] = {

            ...resolveStationSupportPersonnelRoll({
                diceResults
            }),

            /*
             * Faces brutes conservées (en plus du résultat résolu
             * ci-dessus) pour que l'affichage puisse montrer les
             * dés réellement obtenus, pas seulement leur décompte.
             */
            diceResults

        };

    }


    return resultsByResource;

}


/**
 * Lance le pool de base (= niveau de Population) et les dés de
 * Stress additionnels (ressources à 0 + Moral en attente),
 * puis tallie leurs "1"/"6" séparément — seuls les "1" des dés
 * de Stress comptent (règles p.219-221).
 */
export function rollStationPopulationDice({
    resources,
    populationLevel,
    pendingMoralStressDice = 0,
    rollDie = rollStationDieDefault
} = {}) {

    if (
        !Number.isInteger(populationLevel)
        || populationLevel < 0
    ) {

        throw new TypeError(
            "Le niveau de Population doit être un entier "
            + "positif ou nul."
        );

    }


    const zeroResourceStressDiceCount =
        computeStationZeroResourceStressDiceCount({
            resources
        });

    const stressDiceCount =
        zeroResourceStressDiceCount
        + Number(
            pendingMoralStressDice
            ?? 0
        );


    const baseDice =
        rollDice(
            populationLevel,
            rollDie
        );

    const stressDice =
        rollDice(
            stressDiceCount,
            rollDie
        );


    const baseOnes =
        baseDice.filter(
            face => face === 1
        ).length;

    const baseSixes =
        baseDice.filter(
            face => face === 6
        ).length;

    const stressOnes =
        stressDice.filter(
            face => face === 1
        ).length;


    return {

        baseDice,
        stressDice,

        zeroResourceStressDiceCount,

        baseOnes,
        baseSixes,
        stressOnes

    };

}


/**
 * Applique le jet de Population déjà lancé : ressources,
 * contrecoup (lance ses propres dés, 1 par point de
 * débordement), nouveau nombre de membres, nouveau niveau de
 * Population, et dés de Moral programmés pour la semaine
 * suivante.
 */
export function applyStationPopulationWeek({
    resources,
    members,
    baseOnes,
    baseSixes,
    stressOnes,
    resourceChoicesForSixes = [],
    rollDie = rollStationDieDefault
} = {}) {

    const {
        newResources,
        overflow
    } =
        resolveStationPopulationRoll({
            resources,
            baseOnes,
            baseSixes,
            stressOnes,
            resourceChoicesForSixes
        });


    const dieResultsByResource = {};

    for (
        const key
        of STATION_RESOURCE_KEYS
    ) {

        const overflowCount =
            overflow[key]
            ?? 0;

        if (overflowCount > 0) {

            dieResultsByResource[key] =
                rollDice(
                    overflowCount,
                    rollDie
                );

        }

    }


    const {
        totalMembersLost,
        lossByResource
    } =
        resolveStationContrecoup({
            overflow,
            dieResultsByResource
        });


    const newMembers =
        applyStationPopulationMembersLoss({
            currentMembers:
                members,

            membersLost:
                totalMembersLost
        });


    const newLevel =
        resolveStationPopulationLevelForMembers(
            newMembers
        );


    const nextWeekMoralStressDice =
        resolveStationMoralStressDiceCount(
            totalMembersLost
        );


    return {

        newResources,

        overflow,

        contrecoup: {

            dieResultsByResource,

            lossByResource,

            totalMembersLost

        },

        newMembers,

        newLevel,

        nextWeekMoralStressDice

    };

}
