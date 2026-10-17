/**
 * Assemblage pur (aucune dépendance à `foundry.*`) des modèles
 * de vue du Jet de Population hebdomadaire (système Station,
 * règles p.218-221) :
 *
 * - `buildStationPopulationLauncherViewModel` prépare l'affichage
 *   de la fenêtre de lancement (`StationPopulationLauncherApplication`,
 *   non testée) à chaque phase (état initial, puis choix des
 *   ressources augmentées par les "6" s'il y en a).
 * - `buildStationPopulationRecapViewModel` prépare l'affichage du
 *   message de Chat récapitulatif
 *   (`postStationPopulationRecapMessage`, non testée) une fois la
 *   semaine entièrement résolue.
 *
 * Toute la résolution des règles elle-même reste dans
 * `domain/rules/station-population.mjs`,
 * `domain/rules/station-support-personnel.mjs` et
 * `domain/rules/station-population-roll-workflow.mjs` : ces
 * modules-ci ne font que choisir quoi afficher.
 */

import {
    STATION_RESOURCE_KEYS
} from "../../domain/rules/station-population.mjs";


/**
 * Définitions d'affichage des 5 ressources de la Station, dans
 * l'ordre canonique du livre (règles p.218-219).
 */
export const STATION_RESOURCE_DEFINITIONS =
    Object.freeze([

        Object.freeze({ key: "water", label: "Eau" }),
        Object.freeze({ key: "food", label: "Nourriture" }),
        Object.freeze({ key: "equipment", label: "Équipement" }),
        Object.freeze({ key: "energy", label: "Énergie" }),
        Object.freeze({ key: "medicine", label: "Médicaments" })

    ]);


function labelForResource(key) {

    return STATION_RESOURCE_DEFINITIONS.find(
        definition => definition.key === key
    )
        ?.label
        ?? key;

}


/**
 * Représentation d'un seul dé déjà lancé, sous forme de carré
 * affichant sa valeur numérique (même composant visuel que les
 * dés du jet de Compétence générique — `.metro-yze-die` — plutôt
 * que les petits glyphes Unicode de face de dé, jugés peu lisibles
 * par le porteur du projet).
 *
 * `successOnSix` : la plupart des pools de ce chantier comptent un
 * "6" comme une réussite (Personnel de soutien, pool de base de
 * Population) — mais pas les dés de Stress, dont les "6" éventuels
 * n'ont mécaniquement aucun effet (règles p.218-219), ni les dés de
 * contrecoup, qui ne sont pas un jet de réussite/échec mais un
 * simple nombre de membres perdus par point de débordement.
 *
 * `markOnes` : les dés de contrecoup n'ont pas non plus de "1"
 * mécaniquement signifiant (leur valeur est directement le nombre
 * de membres perdus) — désactivé pour eux uniquement.
 */
export function diceFaceSquare(face, { successOnSix = true, markOnes = true } = {}) {

    const value =
        Number(face);

    return {

        value,

        success:
            successOnSix
            && value === 6,

        one:
            markOnes
            && value === 1

    };

}


/**
 * Représentation d'une série de dés déjà lancés, dans l'ordre où
 * ils ont été obtenus, sous forme de carrés (cf. `diceFaceSquare`).
 */
export function diceFacesToSquares(faces = [], options = {}) {

    return (faces ?? [])
        .map(face => diceFaceSquare(face, options));

}


/* ============================================================
 * FENÊTRE DE LANCEMENT
 * ============================================================ */


/**
 * Prépare le contexte d'affichage de la fenêtre de lancement du
 * Jet de Population, pour l'une de ses deux phases.
 *
 * `phase === "intro"` : état de départ, avant tout lancer de
 * dés — `rollOutcome` est ignoré.
 *
 * `phase === "choices"` : les dés ont déjà été lancés
 * (`rollOutcome.supportResults` et `rollOutcome.populationDice`,
 * tels que renvoyés par `rollStationSupportPersonnel` et
 * `rollStationPopulationDice`) ; si au moins un "6" a été
 * obtenu sur le pool de base, un menu de choix de ressource est
 * préparé pour chacun (les Médicaments ne peuvent jamais être
 * choisis, règles p.219).
 */
export function buildStationPopulationLauncherViewModel({
    stationName = "",
    resources,
    supportPersonnel,
    population,
    phase = "intro",
    rollOutcome = null,
    resourceChoicesForSixes = []
} = {}) {

    const resourceRows =
        STATION_RESOURCE_DEFINITIONS.map(
            definition => ({

                key:
                    definition.key,

                label:
                    definition.label,

                level:
                    Number(
                        resources?.[definition.key]
                        ?? 0
                    ),

                supportPersonnel:
                    Number(
                        supportPersonnel?.[definition.key]
                        ?? 0
                    )

            })
        );


    const isChoices =
        phase === "choices"
        && rollOutcome
        !== null;


    let rollSummary =
        null;

    let sixChoiceSlots =
        [];

    if (isChoices) {

        const {
            supportResults,
            populationDice
        } =
            rollOutcome;


        const supportPersonnelRows =
            STATION_RESOURCE_DEFINITIONS
                .filter(
                    definition =>
                        supportResults?.[definition.key]
                        !== null
                        && supportResults?.[definition.key]
                        !== undefined
                )
                .map(
                    definition => {

                        const result =
                            supportResults[definition.key];

                        return {

                            key:
                                definition.key,

                            label:
                                definition.label,

                            successes:
                                result.successes,

                            ones:
                                result.ones,

                            personnelDied:
                                result.personnelDied,

                            resourceGain:
                                result.resourceGain,

                            diceSquares:
                                diceFacesToSquares(
                                    result.diceResults
                                )

                        };

                    }
                );


        rollSummary = {

            baseDiceCount:
                populationDice.baseDice.length,

            baseDiceSquares:
                diceFacesToSquares(
                    populationDice.baseDice
                ),

            stressDiceCount:
                populationDice.stressDice.length,

            stressDiceSquares:
                diceFacesToSquares(
                    populationDice.stressDice,
                    { successOnSix: false }
                ),

            zeroResourceStressDiceCount:
                populationDice.zeroResourceStressDiceCount,

            baseOnes:
                populationDice.baseOnes,

            baseSixes:
                populationDice.baseSixes,

            stressOnes:
                populationDice.stressOnes,

            supportPersonnelRows

        };


        const resourceOptions =
            STATION_RESOURCE_DEFINITIONS
                .filter(
                    definition => definition.key !== "medicine"
                )
                .map(
                    definition => ({
                        key: definition.key,
                        label: definition.label
                    })
                );

        sixChoiceSlots =
            Array.from(
                { length: populationDice.baseSixes },
                (_, index) => ({

                    index,

                    selected:
                        resourceChoicesForSixes[index]
                        ?? "",

                    options:
                        resourceOptions

                })
            );

    }


    const canValidate =
        isChoices
        && sixChoiceSlots.every(
            slot => slot.selected !== ""
        );


    return {

        stationName,

        resourceRows,

        population: {

            level:
                Number(
                    population?.level
                    ?? 0
                ),

            members:
                Number(
                    population?.members
                    ?? 0
                ),

            pendingMoralStressDice:
                Number(
                    population?.pendingMoralStressDice
                    ?? 0
                )

        },

        phase,

        isIntro:
            phase === "intro",

        isChoices,

        rollSummary,

        sixChoiceSlots,

        canValidate

    };

}


/* ============================================================
 * MESSAGE DE CHAT RÉCAPITULATIF
 * ============================================================ */


/**
 * Prépare le contexte d'affichage du message de Chat
 * récapitulatif, une fois la semaine entièrement résolue
 * (`applyStationPopulationWeek`, déjà appelé).
 */
export function buildStationPopulationRecapViewModel({
    stationName = "",
    resourcesBefore,
    supportResults = {},
    populationDice,
    resourceChoicesForSixes = [],
    membersBefore,
    levelBefore,
    weekResult
} = {}) {

    const supportPersonnelRows =
        STATION_RESOURCE_DEFINITIONS
            .filter(
                definition =>
                    supportResults?.[definition.key]
                    !== null
                    && supportResults?.[definition.key]
                    !== undefined
            )
            .map(
                definition => {

                    const result =
                        supportResults[definition.key];

                    return {

                        key:
                            definition.key,

                        label:
                            definition.label,

                        successes:
                            result.successes,

                        ones:
                            result.ones,

                        personnelDied:
                            result.personnelDied,

                        resourceGain:
                            result.resourceGain,

                        diceSquares:
                            diceFacesToSquares(
                                result.diceResults
                            )

                    };

                }
            );


    const sixChoiceRows =
        resourceChoicesForSixes.map(
            key => ({
                key,
                label: labelForResource(key)
            })
        );


    const resourceRows =
        STATION_RESOURCE_DEFINITIONS.map(
            definition => {

                const before =
                    Number(
                        resourcesBefore?.[definition.key]
                        ?? 0
                    );

                const after =
                    Number(
                        weekResult.newResources?.[definition.key]
                        ?? before
                    );

                return {

                    key:
                        definition.key,

                    label:
                        definition.label,

                    before,

                    after,

                    delta:
                        after - before

                };

            }
        );


    const contrecoupRows =
        STATION_RESOURCE_DEFINITIONS
            .filter(
                definition =>
                    (weekResult.overflow?.[definition.key] ?? 0) > 0
            )
            .map(
                definition => ({

                    key:
                        definition.key,

                    label:
                        definition.label,

                    overflow:
                        weekResult.overflow[definition.key],

                    dice:
                        weekResult.contrecoup
                            .dieResultsByResource[definition.key]
                        ?? [],

                    diceSquares:
                        diceFacesToSquares(
                            weekResult.contrecoup
                                .dieResultsByResource[definition.key],
                            { successOnSix: false, markOnes: false }
                        ),

                    loss:
                        weekResult.contrecoup
                            .lossByResource[definition.key]
                        ?? 0

                })
            );


    const personnelLostRows =
        supportPersonnelRows.filter(
            row => row.personnelDied
        );


    const totalMembersLost =
        weekResult.contrecoup.totalMembersLost;

    const membersAfter =
        weekResult.newMembers;

    const levelAfter =
        weekResult.newLevel;


    return {

        stationName,

        supportPersonnelRows,

        personnelLostRows,

        populationDiceSummary: {

            baseDiceCount:
                populationDice.baseDice.length,

            baseDiceSquares:
                diceFacesToSquares(
                    populationDice.baseDice
                ),

            baseOnes:
                populationDice.baseOnes,

            baseSixes:
                populationDice.baseSixes,

            stressDiceCount:
                populationDice.stressDice.length,

            stressDiceSquares:
                diceFacesToSquares(
                    populationDice.stressDice,
                    { successOnSix: false }
                ),

            stressOnes:
                populationDice.stressOnes,

            zeroResourceStressDiceCount:
                populationDice.zeroResourceStressDiceCount

        },

        sixChoiceRows,

        resourceRows,

        hasContrecoup:
            totalMembersLost > 0,

        contrecoupRows,

        totalMembersLost,

        membersBefore:
            Number(
                membersBefore
                ?? 0
            ),

        membersAfter,

        levelBefore:
            Number(
                levelBefore
                ?? 0
            ),

        levelAfter,

        levelChanged:
            Number(levelBefore ?? 0) !== levelAfter,

        nextWeekMoralStressDice:
            weekResult.nextWeekMoralStressDice

    };

}


/**
 * Garde-fou : toutes les clés de ressource connues du système
 * (utilisé par les tests pour vérifier l'exhaustivité des
 * définitions d'affichage ci-dessus).
 */
export function assertResourceDefinitionsAreComplete() {

    const definedKeys =
        STATION_RESOURCE_DEFINITIONS.map(
            definition => definition.key
        );

    return STATION_RESOURCE_KEYS.every(
        key => definedKeys.includes(key)
    );

}
