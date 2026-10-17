/**
 * Système "La Station" — Jet de Population hebdomadaire
 * (livre de règles p.218-221).
 *
 * Ce module est pur : il ne lance aucun dé lui-même. Il reçoit
 * les résultats déjà obtenus (nombre de "1"/"6", faces de dés
 * de contrecoup déjà lancées) et calcule les conséquences.
 *
 * Règles reprises telles quelles :
 * - Le jet de Population ne peut jamais être forcé (aucun Push).
 * - Pour chaque "1" obtenu, Eau/Nourriture/Énergie baissent de 1
 *   chacune. L'Équipement n'est PAS affecté par les "1" (il ne
 *   peut baisser que par d'autres mécanismes, ex. fabrication).
 * - Si le jet produit au moins deux "1", les Médicaments baissent
 *   de 1 tous les 2 "1" (4 "1" → -2).
 * - Pour chaque "6" obtenu (sur le pool de base uniquement —
 *   jamais sur les dés de Stress additionnels), une ressource au
 *   choix des PJ/MJ augmente de 1, à l'exception des Médicaments.
 * - Gains et pertes s'annulent, appliqués simultanément.
 * - Chaque ressource à 0 avant le jet ajoute 1 à 3 dés de Stress
 *   au jet (table STATION_ZERO_RESOURCE_STRESS_DICE). Seuls les
 *   "1" de ces dés comptent (leurs "6" n'ont aucun effet).
 * - Si une ressource passerait sous 0, c'est le contrecoup :
 *   pour chaque point négatif, 1 dé est lancé et son résultat est
 *   soustrait du nombre de membres de la communauté.
 * - Le nombre de membres détermine le niveau de Population
 *   (table p.220).
 * - Des pertes de membres par contrecoup ajoutent des dés de
 *   Stress au PROCHAIN jet de Population (Moral, table p.221).
 */

export const STATION_RESOURCE_KEYS =
    Object.freeze([
        "water",
        "food",
        "equipment",
        "energy",
        "medicine"
    ]);


/*
 * Ressources affectées par les pertes des "1" du jet
 * de Population (hors Médicaments, qui suit sa propre règle,
 * et hors Équipement, qui n'est jamais affecté par les "1").
 */
const DIRECT_ONES_LOSS_RESOURCE_KEYS =
    Object.freeze([
        "water",
        "food",
        "energy"
    ]);


export const STATION_ZERO_RESOURCE_STRESS_DICE =
    Object.freeze({
        water: 3,
        food: 2,
        equipment: 1,
        energy: 1,
        medicine: 2
    });


/*
 * Table p.220 : nombre minimum de membres pour chaque palier
 * de Population. Le niveau 0 n'a pas de minimum (toujours
 * valide, même avec 0 membre).
 */
export const STATION_POPULATION_MEMBER_THRESHOLDS =
    Object.freeze([
        { level: 0, minimumMembers: 0 },
        { level: 1, minimumMembers: 26 },
        { level: 2, minimumMembers: 52 },
        { level: 3, minimumMembers: 104 },
        { level: 4, minimumMembers: 206 },
        { level: 5, minimumMembers: 358 },
        { level: 6, minimumMembers: 510 }
    ]);


function assertResourceLevels(
    resources
) {

    if (
        !resources
        || typeof resources !== "object"
    ) {

        throw new TypeError(
            "Les niveaux de ressources sont requis."
        );

    }


    for (
        const key
        of STATION_RESOURCE_KEYS
    ) {

        const value =
            resources[key];

        if (
            !Number.isInteger(value)
            || value < 0
            || value > 10
        ) {

            throw new TypeError(
                `Le niveau de la ressource "${key}" doit être `
                + "un entier entre 0 et 10."
            );

        }

    }

}


function assertNonNegativeInteger(
    value,
    label
) {

    if (
        !Number.isInteger(value)
        || value < 0
    ) {

        throw new TypeError(
            `${label} doit être un entier positif ou nul.`
        );

    }

}


/**
 * Nombre de dés de Stress additionnels dus aux ressources
 * actuellement à 0, avant le jet de Population.
 */
export function computeStationZeroResourceStressDiceCount({
    resources
} = {}) {

    assertResourceLevels(
        resources
    );


    return STATION_RESOURCE_KEYS.reduce(
        (total, key) =>
            resources[key] === 0
                ? total + STATION_ZERO_RESOURCE_STRESS_DICE[key]
                : total,
        0
    );

}


/**
 * Nombre de dés de Stress de Moral à ajouter au PROCHAIN jet
 * de Population, en fonction des membres perdus en contrecoup
 * lors du jet qui vient d'être effectué (table p.221).
 */
export function resolveStationMoralStressDiceCount(
    membersLost
) {

    assertNonNegativeInteger(
        membersLost,
        "Le nombre de membres perdus"
    );


    if (membersLost === 0) {
        return 0;
    }

    if (membersLost <= 5) {
        return 1;
    }

    if (membersLost <= 12) {
        return 2;
    }

    return 3;

}


/**
 * Niveau de Population correspondant à un nombre de membres
 * donné (plus haut palier dont le minimum est atteint).
 */
export function resolveStationPopulationLevelForMembers(
    members
) {

    assertNonNegativeInteger(
        members,
        "Le nombre de membres"
    );


    let resolvedLevel =
        0;

    for (
        const entry
        of STATION_POPULATION_MEMBER_THRESHOLDS
    ) {

        if (members >= entry.minimumMembers) {
            resolvedLevel = entry.level;
        }

    }


    return resolvedLevel;

}


/**
 * Résout l'effet du jet de Population sur les ressources :
 * pertes dues aux "1" (de base + dés de Stress), gains dus aux
 * "6" de base (choix du MJ/des PJ), simultanés. Renvoie les
 * nouveaux niveaux de ressource (plancher 0, plafond 10) et,
 * pour chaque ressource qui serait passée sous 0, le nombre de
 * points de contrecoup à résoudre.
 */
export function resolveStationPopulationRoll({
    resources,
    baseOnes,
    baseSixes,
    stressOnes = 0,
    resourceChoicesForSixes = []
} = {}) {

    assertResourceLevels(
        resources
    );

    assertNonNegativeInteger(
        baseOnes,
        "Le nombre de \"1\" du pool de base"
    );

    assertNonNegativeInteger(
        baseSixes,
        "Le nombre de \"6\" du pool de base"
    );

    assertNonNegativeInteger(
        stressOnes,
        "Le nombre de \"1\" des dés de Stress additionnels"
    );


    if (
        !Array.isArray(resourceChoicesForSixes)
        || resourceChoicesForSixes.length !== baseSixes
    ) {

        throw new TypeError(
            "Il faut exactement un choix de ressource par \"6\" "
            + "obtenu sur le pool de base."
        );

    }


    for (
        const choice
        of resourceChoicesForSixes
    ) {

        if (choice === "medicine") {

            throw new Error(
                "Les Médicaments ne peuvent pas être augmentés "
                + "par un \"6\" du jet de Population."
            );

        }


        if (
            !STATION_RESOURCE_KEYS.includes(choice)
        ) {

            throw new TypeError(
                `"${choice}" n'est pas une ressource valide.`
            );

        }

    }


    const onesTotal =
        baseOnes
        + stressOnes;


    const rawValues = {
        ...resources
    };

    for (
        const key
        of DIRECT_ONES_LOSS_RESOURCE_KEYS
    ) {
        rawValues[key] -= onesTotal;
    }

    rawValues.medicine -=
        Math.floor(onesTotal / 2);


    for (
        const choice
        of resourceChoicesForSixes
    ) {
        rawValues[choice] += 1;
    }


    const newResources = {};
    const overflow = {};

    for (
        const key
        of STATION_RESOURCE_KEYS
    ) {

        if (rawValues[key] < 0) {

            overflow[key] =
                -rawValues[key];

            newResources[key] =
                0;

        }
        else {

            overflow[key] =
                0;

            newResources[key] =
                Math.min(
                    10,
                    rawValues[key]
                );

        }

    }


    return {

        onesTotal,

        newResources,

        overflow

    };

}


/**
 * Résout le contrecoup : pour chaque ressource ayant débordé
 * sous 0, les dés déjà lancés (1 par point de débordement) sont
 * sommés et soustraits du nombre de membres de la communauté.
 */
export function resolveStationContrecoup({
    overflow,
    dieResultsByResource = {}
} = {}) {

    if (
        !overflow
        || typeof overflow !== "object"
    ) {

        throw new TypeError(
            "Le débordement par ressource est requis."
        );

    }


    let totalMembersLost =
        0;

    const lossByResource = {};

    for (
        const key
        of STATION_RESOURCE_KEYS
    ) {

        const overflowCount =
            overflow[key]
            ?? 0;

        if (overflowCount === 0) {

            lossByResource[key] =
                0;

            continue;

        }


        const dice =
            dieResultsByResource[key];

        if (
            !Array.isArray(dice)
            || dice.length !== overflowCount
        ) {

            throw new Error(
                `Il faut exactement ${overflowCount} dé(s) de `
                + `contrecoup déjà lancé(s) pour "${key}".`
            );

        }


        const resourceLoss =
            dice.reduce(
                (sum, face) => sum + face,
                0
            );

        lossByResource[key] =
            resourceLoss;

        totalMembersLost +=
            resourceLoss;

    }


    return {

        totalMembersLost,

        lossByResource

    };

}


/**
 * Applique une perte de membres au nombre de membres actuel
 * de la communauté (plancher 0).
 */
export function applyStationPopulationMembersLoss({
    currentMembers,
    membersLost
} = {}) {

    assertNonNegativeInteger(
        currentMembers,
        "Le nombre de membres actuel"
    );

    assertNonNegativeInteger(
        membersLost,
        "Le nombre de membres perdus"
    );


    return Math.max(
        0,
        currentMembers - membersLost
    );

}
