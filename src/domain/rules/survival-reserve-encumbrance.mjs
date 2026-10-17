/**
 * Encombrement des réserves de survie (livre de règles, p.175).
 *
 * L'Eau et la Nourriture partagent le même barème ; l'Énergie
 * suit un barème distinct (les 3 premiers points ne comptent
 * pas comme encombrants).
 *
 *   Eau / Nourriture         Énergie
 *   0      -> 0              0 à 3  -> 0
 *   1 à 4  -> 1              4 à 5  -> 1
 *   5 à 6  -> 2              6 à 8  -> 2
 *   7 à 10 -> 3              9 à 10 -> 3
 */

function validateLevel(value, label) {

    if (
        !Number.isInteger(value)
        || value < 0
    ) {
        throw new TypeError(
            `Le niveau de ${label} doit être un entier positif ou nul.`
        );
    }

    if (value > 10) {
        throw new RangeError(
            `Le niveau de ${label} ne peut pas dépasser 10.`
        );
    }

}


function waterOrFoodWeight(level) {

    if (level === 0) {
        return 0;
    }

    if (level <= 4) {
        return 1;
    }

    if (level <= 6) {
        return 2;
    }

    return 3;

}


function energyWeight(level) {

    if (level <= 3) {
        return 0;
    }

    if (level <= 5) {
        return 1;
    }

    if (level <= 8) {
        return 2;
    }

    return 3;

}


export function resolveSurvivalReserveEncumbrance({
    water,
    food,
    energy
} = {}) {

    validateLevel(water, "Eau");
    validateLevel(food, "Nourriture");
    validateLevel(energy, "Énergie");


    const waterWeight =
        waterOrFoodWeight(water);

    const foodWeight =
        waterOrFoodWeight(food);

    const energyResult =
        energyWeight(energy);


    return {

        water:
            waterWeight,

        food:
            foodWeight,

        energy:
            energyResult,

        total:
            waterWeight + foodWeight + energyResult

    };

}
