/**
 * Système "La Station" — Jet de SURVIE pour augmenter une
 * ressource (livre de règles p.219).
 *
 * Pour chaque semaine complète passée à rechercher une ressource
 * particulière, le Personnage a droit à un jet de SURVIE (qui ne
 * peut jamais être forcé), avec un modificateur négatif selon la
 * ressource recherchée. Chaque réussite augmente le niveau de la
 * ressource concernée de 1 (plafond 10). Ce jet lui-même passe
 * par le gabarit générique de jet de Compétence (YZERollChat) :
 * ce module n'en couvre que le modificateur et l'application du
 * résultat à la ressource de la Station.
 */

export const STATION_SURVIVAL_ROLL_MODIFIERS =
    Object.freeze({
        water: -3,
        food: -2,
        equipment: -1,
        energy: -2,
        medicine: -4
    });


export function getStationSurvivalRollModifier(
    resourceKey
) {

    const modifier =
        STATION_SURVIVAL_ROLL_MODIFIERS[resourceKey];

    if (
        !Number.isInteger(modifier)
    ) {

        throw new TypeError(
            `"${resourceKey}" n'est pas une ressource valide `
            + "pour le jet de Survie."
        );

    }


    return modifier;

}


export function applyStationSurvivalRollSuccesses({
    currentLevel,
    successes
} = {}) {

    if (
        !Number.isInteger(currentLevel)
        || currentLevel < 0
        || currentLevel > 10
    ) {

        throw new TypeError(
            "Le niveau actuel de la ressource doit être un "
            + "entier entre 0 et 10."
        );

    }


    if (
        !Number.isInteger(successes)
        || successes < 0
    ) {

        throw new TypeError(
            "Le nombre de réussites doit être un entier "
            + "positif ou nul."
        );

    }


    return Math.min(
        10,
        currentLevel + successes
    );

}
