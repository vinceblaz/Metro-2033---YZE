import { test } from "node:test";
import assert from "node:assert/strict";

import {
    ACTION_MODIFIER_SOURCES,
    ACTION_DIFFICULTIES,
    createActionModifier,
    createActionSource,
    getSelectedActionSources,
    getActionSourceTotal,
    getActionSourceTotalByType,
    getSelectedActionModifiers,
    getActionModifierTotal,
    getActionBonusTotal,
    getActionPenaltyTotal,
    ActionModifierService
} from "../../src/action-resolution/action-modifier-service.mjs";


/**
 * Ce fichier verrouille le comportement actuel de
 * action-modifier-service.mjs (aucun test n'existait
 * avant ce chantier).
 *
 * La couverture des règles propres aux talents
 * (evaluateTalentsForAction, effets conditionnels, ...)
 * est déjà assurée par tests/domain/rules/talents.test.mjs.
 * Ici, les talents sont systématiquement testés avec
 * un tableau vide, sauf mention contraire.
 */


/* ============================================================
 * createActionModifier
 * ============================================================ */


test(
    "createActionModifier : lève une erreur si id est absent",
    () => {

        assert.throws(
            () =>
                createActionModifier({
                    label: "Bonus",
                    source: ACTION_MODIFIER_SOURCES.MANUAL
                }),
            TypeError
        );

    }
);


test(
    "createActionModifier : lève une erreur si id est une chaîne vide",
    () => {

        assert.throws(
            () =>
                createActionModifier({
                    id: "   ",
                    label: "Bonus",
                    source: ACTION_MODIFIER_SOURCES.MANUAL
                }),
            TypeError
        );

    }
);


test(
    "createActionModifier : lève une erreur si label est absent",
    () => {

        assert.throws(
            () =>
                createActionModifier({
                    id: "bonus-1",
                    source: ACTION_MODIFIER_SOURCES.MANUAL
                }),
            TypeError
        );

    }
);


test(
    "createActionModifier : lève une erreur si la source est inconnue",
    () => {

        assert.throws(
            () =>
                createActionModifier({
                    id: "bonus-1",
                    label: "Bonus",
                    source: "n-importe-quoi"
                }),
            TypeError
        );

    }
);


test(
    "createActionModifier : accepte chacune des sources déclarées",
    () => {

        for (
            const source
            of Object.values(
                ACTION_MODIFIER_SOURCES
            )
        ) {

            const modifier =
                createActionModifier({
                    id: "modifier-1",
                    label: "Modificateur",
                    source
                });


            assert.equal(
                modifier.source,
                source
            );

        }

    }
);


test(
    "createActionModifier : value vaut suggestedValue par défaut",
    () => {

        const modifier =
            createActionModifier({
                id: "bonus-1",
                label: "Bonus",
                source: ACTION_MODIFIER_SOURCES.MANUAL,
                suggestedValue: 2
            });


        assert.equal(
            modifier.suggestedValue,
            2
        );

        assert.equal(
            modifier.value,
            2
        );

    }
);


test(
    "createActionModifier : value peut être explicitement différent de suggestedValue",
    () => {

        const modifier =
            createActionModifier({
                id: "bonus-1",
                label: "Bonus",
                source: ACTION_MODIFIER_SOURCES.MANUAL,
                suggestedValue: 2,
                value: 5
            });


        assert.equal(
            modifier.suggestedValue,
            2
        );

        assert.equal(
            modifier.value,
            5
        );

    }
);


test(
    "createActionModifier : normalise les valeurs numériques invalides à 0",
    () => {

        const modifier =
            createActionModifier({
                id: "bonus-1",
                label: "Bonus",
                source: ACTION_MODIFIER_SOURCES.MANUAL,
                suggestedValue: "pas-un-nombre",
                value: undefined
            });


        assert.equal(
            modifier.suggestedValue,
            0
        );

        assert.equal(
            modifier.value,
            0
        );

    }
);


test(
    "createActionModifier : convertit une chaîne numérique en nombre",
    () => {

        const modifier =
            createActionModifier({
                id: "bonus-1",
                label: "Bonus",
                source: ACTION_MODIFIER_SOURCES.MANUAL,
                suggestedValue: "3"
            });


        assert.equal(
            modifier.suggestedValue,
            3
        );

    }
);


test(
    "createActionModifier : selected et editable valent true par défaut",
    () => {

        const modifier =
            createActionModifier({
                id: "bonus-1",
                label: "Bonus",
                source: ACTION_MODIFIER_SOURCES.MANUAL
            });


        assert.equal(
            modifier.selected,
            true
        );

        assert.equal(
            modifier.editable,
            true
        );

    }
);


test(
    "createActionModifier : les valeurs booléennes non conformes retombent sur leur valeur par défaut",
    () => {

        const modifier =
            createActionModifier({
                id: "bonus-1",
                label: "Bonus",
                source: ACTION_MODIFIER_SOURCES.MANUAL,
                selected: "oui",
                editable: "non"
            });


        assert.equal(
            modifier.selected,
            true
        );

        assert.equal(
            modifier.editable,
            true
        );

    }
);


test(
    "createActionModifier : id et label sont recadrés (trim)",
    () => {

        const modifier =
            createActionModifier({
                id: "  bonus-1  ",
                label: "  Bonus  ",
                source: ACTION_MODIFIER_SOURCES.MANUAL
            });


        assert.equal(
            modifier.id,
            "bonus-1"
        );

        assert.equal(
            modifier.label,
            "Bonus"
        );

    }
);


test(
    "createActionModifier : metadata est copié dans un nouvel objet",
    () => {

        const metadata = {
            foo: "bar"
        };


        const modifier =
            createActionModifier({
                id: "bonus-1",
                label: "Bonus",
                source: ACTION_MODIFIER_SOURCES.MANUAL,
                metadata
            });


        assert.deepEqual(
            modifier.metadata,
            {
                foo: "bar"
            }
        );

        assert.notEqual(
            modifier.metadata,
            metadata
        );

    }
);


/* ============================================================
 * createActionSource
 * ============================================================ */


test(
    "createActionSource : lève une erreur si id est absent",
    () => {

        assert.throws(
            () =>
                createActionSource({
                    label: "Couteau",
                    type: ACTION_MODIFIER_SOURCES.WEAPON
                }),
            TypeError
        );

    }
);


test(
    "createActionSource : lève une erreur si label est absent",
    () => {

        assert.throws(
            () =>
                createActionSource({
                    id: "weapon:1",
                    type: ACTION_MODIFIER_SOURCES.WEAPON
                }),
            TypeError
        );

    }
);


test(
    "createActionSource : lève une erreur si le type n'est ni weapon, ni equipment, ni talent",
    () => {

        assert.throws(
            () =>
                createActionSource({
                    id: "source:1",
                    label: "Source",
                    type: ACTION_MODIFIER_SOURCES.MANUAL
                }),
            TypeError
        );

    }
);


test(
    "createActionSource : accepte les trois types métier",
    () => {

        for (
            const type
            of [
                ACTION_MODIFIER_SOURCES.WEAPON,
                ACTION_MODIFIER_SOURCES.EQUIPMENT,
                ACTION_MODIFIER_SOURCES.TALENT
            ]
        ) {

            const source =
                createActionSource({
                    id: "source:1",
                    label: "Source",
                    type
                });


            assert.equal(
                source.type,
                type
            );

        }

    }
);


test(
    "createActionSource : une source verrouillée est forcément sélectionnée",
    () => {

        const source =
            createActionSource({
                id: "weapon:1",
                label: "Couteau",
                type: ACTION_MODIFIER_SOURCES.WEAPON,
                locked: true,
                selected: false
            });


        assert.equal(
            source.locked,
            true
        );

        assert.equal(
            source.selected,
            true
        );

    }
);


test(
    "createActionSource : sans verrouillage, selected suit la valeur fournie",
    () => {

        const unselected =
            createActionSource({
                id: "weapon:1",
                label: "Couteau",
                type: ACTION_MODIFIER_SOURCES.WEAPON,
                selected: false
            });


        const selected =
            createActionSource({
                id: "weapon:2",
                label: "Hache",
                type: ACTION_MODIFIER_SOURCES.WEAPON,
                selected: true
            });


        assert.equal(
            unselected.selected,
            false
        );

        assert.equal(
            selected.selected,
            true
        );

    }
);


test(
    "createActionSource : selected et locked valent false par défaut",
    () => {

        const source =
            createActionSource({
                id: "weapon:1",
                label: "Couteau",
                type: ACTION_MODIFIER_SOURCES.WEAPON
            });


        assert.equal(
            source.selected,
            false
        );

        assert.equal(
            source.locked,
            false
        );

    }
);


test(
    "createActionSource : normalise le bonus en nombre",
    () => {

        const source =
            createActionSource({
                id: "weapon:1",
                label: "Couteau",
                type: ACTION_MODIFIER_SOURCES.WEAPON,
                bonus: "2"
            });


        assert.equal(
            source.bonus,
            2
        );

    }
);


/* ============================================================
 * getSelectedActionSources / totaux de sources
 * ============================================================ */


test(
    "getSelectedActionSources : retourne un tableau vide si l'entrée n'est pas un tableau",
    () => {

        assert.deepEqual(
            getSelectedActionSources(
                null
            ),
            []
        );

    }
);


test(
    "getSelectedActionSources : ne retient que les sources sélectionnées",
    () => {

        const sources = [
            createActionSource({
                id: "weapon:1",
                label: "Couteau",
                type: ACTION_MODIFIER_SOURCES.WEAPON,
                selected: true,
                bonus: 1
            }),
            createActionSource({
                id: "weapon:2",
                label: "Hache",
                type: ACTION_MODIFIER_SOURCES.WEAPON,
                selected: false,
                bonus: 3
            })
        ];


        const selected =
            getSelectedActionSources(
                sources
            );


        assert.equal(
            selected.length,
            1
        );

        assert.equal(
            selected[0].id,
            "weapon:1"
        );

    }
);


test(
    "getActionSourceTotal : additionne uniquement les sources sélectionnées",
    () => {

        const sources = [
            createActionSource({
                id: "weapon:1",
                label: "Couteau",
                type: ACTION_MODIFIER_SOURCES.WEAPON,
                selected: true,
                bonus: 1
            }),
            createActionSource({
                id: "equipment:1",
                label: "Gilet",
                type: ACTION_MODIFIER_SOURCES.EQUIPMENT,
                selected: true,
                bonus: 2
            }),
            createActionSource({
                id: "weapon:2",
                label: "Hache",
                type: ACTION_MODIFIER_SOURCES.WEAPON,
                selected: false,
                bonus: 10
            })
        ];


        assert.equal(
            getActionSourceTotal(
                sources
            ),
            3
        );

    }
);


test(
    "getActionSourceTotalByType : filtre par type et par sélection",
    () => {

        const sources = [
            createActionSource({
                id: "weapon:1",
                label: "Couteau",
                type: ACTION_MODIFIER_SOURCES.WEAPON,
                selected: true,
                bonus: 1
            }),
            createActionSource({
                id: "weapon:2",
                label: "Hache",
                type: ACTION_MODIFIER_SOURCES.WEAPON,
                selected: true,
                bonus: 2
            }),
            createActionSource({
                id: "equipment:1",
                label: "Gilet",
                type: ACTION_MODIFIER_SOURCES.EQUIPMENT,
                selected: true,
                bonus: 5
            })
        ];


        assert.equal(
            getActionSourceTotalByType(
                sources,
                ACTION_MODIFIER_SOURCES.WEAPON
            ),
            3
        );

        assert.equal(
            getActionSourceTotalByType(
                sources,
                ACTION_MODIFIER_SOURCES.EQUIPMENT
            ),
            5
        );

        assert.equal(
            getActionSourceTotalByType(
                sources,
                ACTION_MODIFIER_SOURCES.TALENT
            ),
            0
        );

    }
);


/* ============================================================
 * getSelectedActionModifiers / totaux de modificateurs
 * ============================================================ */


test(
    "getSelectedActionModifiers : retourne un tableau vide si l'entrée n'est pas un tableau",
    () => {

        assert.deepEqual(
            getSelectedActionModifiers(
                undefined
            ),
            []
        );

    }
);


test(
    "getSelectedActionModifiers : ne retient que les modificateurs sélectionnés",
    () => {

        const modifiers = [
            createActionModifier({
                id: "bonus-1",
                label: "Bonus",
                source: ACTION_MODIFIER_SOURCES.MANUAL,
                value: 2,
                selected: true
            }),
            createActionModifier({
                id: "bonus-2",
                label: "Bonus désactivé",
                source: ACTION_MODIFIER_SOURCES.MANUAL,
                value: 4,
                selected: false
            })
        ];


        const selected =
            getSelectedActionModifiers(
                modifiers
            );


        assert.equal(
            selected.length,
            1
        );

        assert.equal(
            selected[0].id,
            "bonus-1"
        );

    }
);


test(
    "getActionModifierTotal : additionne les valeurs (positives et négatives) des modificateurs sélectionnés",
    () => {

        const modifiers = [
            createActionModifier({
                id: "bonus-1",
                label: "Bonus",
                source: ACTION_MODIFIER_SOURCES.MANUAL,
                value: 3,
                selected: true
            }),
            createActionModifier({
                id: "penalty-1",
                label: "Pénalité",
                source: ACTION_MODIFIER_SOURCES.MANUAL,
                value: -2,
                selected: true
            }),
            createActionModifier({
                id: "bonus-2",
                label: "Bonus ignoré",
                source: ACTION_MODIFIER_SOURCES.MANUAL,
                value: 100,
                selected: false
            })
        ];


        assert.equal(
            getActionModifierTotal(
                modifiers
            ),
            1
        );

    }
);


test(
    "getActionBonusTotal / getActionPenaltyTotal : bonus et pénalités sont bien séparés",
    () => {

        const modifiers = [
            createActionModifier({
                id: "bonus-1",
                label: "Bonus",
                source: ACTION_MODIFIER_SOURCES.MANUAL,
                value: 3,
                selected: true
            }),
            createActionModifier({
                id: "bonus-2",
                label: "Bonus",
                source: ACTION_MODIFIER_SOURCES.MANUAL,
                value: 2,
                selected: true
            }),
            createActionModifier({
                id: "penalty-1",
                label: "Pénalité",
                source: ACTION_MODIFIER_SOURCES.MANUAL,
                value: -4,
                selected: true
            })
        ];


        assert.equal(
            getActionBonusTotal(
                modifiers
            ),
            5
        );

        /*
         * La pénalité est stockée en valeur négative
         * mais retournée en valeur absolue.
         */
        assert.equal(
            getActionPenaltyTotal(
                modifiers
            ),
            4
        );

    }
);


test(
    "getActionBonusTotal / getActionPenaltyTotal : une valeur nulle ne contribue ni au bonus ni à la pénalité",
    () => {

        const modifiers = [
            createActionModifier({
                id: "neutre",
                label: "Neutre",
                source: ACTION_MODIFIER_SOURCES.MANUAL,
                value: 0,
                selected: true
            })
        ];


        assert.equal(
            getActionBonusTotal(
                modifiers
            ),
            0
        );

        assert.equal(
            getActionPenaltyTotal(
                modifiers
            ),
            0
        );

    }
);


/* ============================================================
 * ActionModifierService.createPreparation
 * ============================================================ */


test(
    "createPreparation : lève une erreur si context.actionType est absent",
    () => {

        assert.throws(
            () =>
                ActionModifierService.createPreparation({
                    context: {}
                }),
            TypeError
        );

        assert.throws(
            () =>
                ActionModifierService.createPreparation({}),
            TypeError
        );

    }
);


test(
    "createPreparation : cas minimal, produit toujours un bonus et une pénalité manuels même à 0",
    () => {

        const preparation =
            ActionModifierService.createPreparation({
                context: {
                    actionType: "skill-roll"
                }
            });


        const manualBonus =
            preparation.modifiers.find(
                modifier =>
                    modifier.id === "manual-bonus"
            );

        const manualPenalty =
            preparation.modifiers.find(
                modifier =>
                    modifier.id === "manual-penalty"
            );


        assert.ok(
            manualBonus
        );

        assert.ok(
            manualPenalty
        );

        assert.equal(
            manualBonus.value,
            0
        );

        /*
         * La pénalité manuelle "à 0" peut être stockée
         * en -0 (résultat de -Math.abs(0)) : -0 === 0
         * au sens JavaScript, on évite donc assert.equal
         * strict (Object.is) qui distinguerait les deux.
         */
        assert.ok(
            manualPenalty.value === 0
        );

        assert.equal(
            manualBonus.selected,
            true
        );

        assert.equal(
            manualPenalty.selected,
            true
        );

    }
);


test(
    "createPreparation : la pénalité manuelle est toujours stockée en négatif, même fournie positive",
    () => {

        const preparation =
            ActionModifierService.createPreparation({
                context: {
                    actionType: "skill-roll"
                },
                manualPenalty: 3
            });


        const manualPenalty =
            preparation.modifiers.find(
                modifier =>
                    modifier.id === "manual-penalty"
            );


        assert.equal(
            manualPenalty.value,
            -3
        );

    }
);


test(
    "createPreparation : la pénalité manuelle reste négative même fournie déjà négative",
    () => {

        const preparation =
            ActionModifierService.createPreparation({
                context: {
                    actionType: "skill-roll"
                },
                manualPenalty: -3
            });


        const manualPenalty =
            preparation.modifiers.find(
                modifier =>
                    modifier.id === "manual-penalty"
            );


        assert.equal(
            manualPenalty.value,
            -3
        );

    }
);


test(
    "createPreparation : la difficulté par défaut est average",
    () => {

        const preparation =
            ActionModifierService.createPreparation({
                context: {
                    actionType: "skill-roll"
                }
            });


        assert.equal(
            preparation.difficulty.id,
            "average"
        );

        assert.equal(
            preparation.difficulty.modifier,
            0
        );

    }
);


test(
    "createPreparation : une difficulté inconnue retombe sur average",
    () => {

        const preparation =
            ActionModifierService.createPreparation({
                context: {
                    actionType: "skill-roll"
                },
                difficulty: "n-importe-quoi"
            });


        assert.equal(
            preparation.difficulty.id,
            "average"
        );

    }
);


test(
    "createPreparation : une difficulté connue est reprise telle quelle",
    () => {

        const preparation =
            ActionModifierService.createPreparation({
                context: {
                    actionType: "skill-roll"
                },
                difficulty: "hard"
            });


        assert.equal(
            preparation.difficulty.id,
            "hard"
        );

        assert.equal(
            preparation.difficulty.modifier,
            -2
        );

    }
);


test(
    "createPreparation : calcule le dicePool à partir des attributs, sources, difficulté et modificateurs",
    () => {

        const preparation =
            ActionModifierService.createPreparation({
                context: {
                    actionType: "skill-roll"
                },
                base: {
                    attribute: 3,
                    skill: 2,
                    stress: 1
                },
                sources: [
                    {
                        id: "weapon:1",
                        label: "Couteau",
                        type: ACTION_MODIFIER_SOURCES.WEAPON,
                        bonus: 1,
                        selected: true
                    }
                ],
                difficulty: "simple",
                manualBonus: 1,
                manualPenalty: 2
            });


        /*
         * attribut(3) + compétence(2) + stress(1)
         * + sources(1) + difficulté(simple = +1)
         * + modificateur net (bonus manuel 1 - pénalité manuelle 2 = -1)
         * = 7
         */
        assert.equal(
            preparation.totals.dicePool,
            7
        );

    }
);


test(
    "createPreparation : le dicePool ne descend jamais sous 0",
    () => {

        const preparation =
            ActionModifierService.createPreparation({
                context: {
                    actionType: "skill-roll"
                },
                base: {
                    attribute: 1,
                    skill: 0,
                    stress: 0
                },
                difficulty: "exceptional",
                manualPenalty: 10
            });


        assert.equal(
            preparation.totals.dicePool,
            0
        );

    }
);


test(
    "createPreparation : talents=[] ne produit aucun modificateur ni effet spécial issu des talents",
    () => {

        const preparation =
            ActionModifierService.createPreparation({
                context: {
                    actionType: "skill-roll"
                },
                talents: []
            });


        const talentModifiers =
            preparation.modifiers.filter(
                modifier =>
                    modifier.source
                        === ACTION_MODIFIER_SOURCES.TALENT
            );


        assert.deepEqual(
            talentModifiers,
            []
        );

        assert.deepEqual(
            preparation.specialEffects,
            []
        );

    }
);


test(
    "createPreparation : les circonstances et effets externes sont convertis en modificateurs sélectionnés par défaut",
    () => {

        const preparation =
            ActionModifierService.createPreparation({
                context: {
                    actionType: "skill-roll"
                },
                circumstances: [
                    {
                        label: "Obscurité",
                        value: -1
                    }
                ],
                effects: [
                    {
                        label: "Fatigue",
                        value: -1
                    }
                ]
            });


        const circumstance =
            preparation.modifiers.find(
                modifier =>
                    modifier.source
                        === ACTION_MODIFIER_SOURCES.CIRCUMSTANCE
            );

        const effect =
            preparation.modifiers.find(
                modifier =>
                    modifier.source
                        === ACTION_MODIFIER_SOURCES.EFFECT
            );


        assert.equal(
            circumstance.label,
            "Obscurité"
        );

        assert.equal(
            circumstance.value,
            -1
        );

        assert.equal(
            circumstance.selected,
            true
        );

        assert.equal(
            effect.value,
            -1
        );

    }
);


/* ============================================================
 * ActionModifierService.resolveTotals
 * ============================================================ */


test(
    "resolveTotals : agrège total, bonus et pénalité à partir de modificateurs bruts",
    () => {

        const modifiers = [
            createActionModifier({
                id: "bonus-1",
                label: "Bonus",
                source: ACTION_MODIFIER_SOURCES.MANUAL,
                value: 3,
                selected: true
            }),
            createActionModifier({
                id: "penalty-1",
                label: "Pénalité",
                source: ACTION_MODIFIER_SOURCES.MANUAL,
                value: -1,
                selected: true
            })
        ];


        const totals =
            ActionModifierService.resolveTotals(
                modifiers
            );


        assert.equal(
            totals.total,
            2
        );

        assert.equal(
            totals.bonus,
            3
        );

        assert.equal(
            totals.penalty,
            1
        );

    }
);


test(
    "resolveTotals : sans argument, retourne des totaux nuls",
    () => {

        const totals =
            ActionModifierService.resolveTotals();


        assert.deepEqual(
            totals,
            {
                total: 0,
                bonus: 0,
                penalty: 0
            }
        );

    }
);


/* ============================================================
 * ActionModifierService.resolvePreparationTotals
 * ============================================================ */


test(
    "resolvePreparationTotals : sépare les totaux weapon/equipment/talent par type de source",
    () => {

        const sources = [
            createActionSource({
                id: "weapon:1",
                label: "Couteau",
                type: ACTION_MODIFIER_SOURCES.WEAPON,
                bonus: 1,
                selected: true
            }),
            createActionSource({
                id: "equipment:1",
                label: "Gilet",
                type: ACTION_MODIFIER_SOURCES.EQUIPMENT,
                bonus: 2,
                selected: true
            }),
            createActionSource({
                id: "talent:1",
                label: "Talent",
                type: ACTION_MODIFIER_SOURCES.TALENT,
                bonus: 3,
                selected: true
            })
        ];


        const totals =
            ActionModifierService.resolvePreparationTotals({
                base: {
                    attribute: 1,
                    skill: 1,
                    stress: 0
                },
                sources,
                difficulty: ACTION_DIFFICULTIES.average,
                modifiers: []
            });


        assert.equal(
            totals.weapon,
            1
        );

        assert.equal(
            totals.equipment,
            2
        );

        assert.equal(
            totals.talent,
            3
        );

        assert.equal(
            totals.sources,
            6
        );

        assert.equal(
            totals.dicePool,
            8
        );

    }
);


test(
    "resolvePreparationTotals : difficulty par défaut vaut average si non fournie",
    () => {

        const totals =
            ActionModifierService.resolvePreparationTotals({
                base: {
                    attribute: 2,
                    skill: 0,
                    stress: 0
                }
            });


        assert.equal(
            totals.difficulty,
            0
        );

        assert.equal(
            totals.dicePool,
            2
        );

    }
);


test(
    "resolvePreparationTotals : bonus et penalty restent disponibles en plus des totaux universels",
    () => {

        const modifiers = [
            createActionModifier({
                id: "bonus-1",
                label: "Bonus",
                source: ACTION_MODIFIER_SOURCES.MANUAL,
                value: 2,
                selected: true
            }),
            createActionModifier({
                id: "penalty-1",
                label: "Pénalité",
                source: ACTION_MODIFIER_SOURCES.MANUAL,
                value: -1,
                selected: true
            })
        ];


        const totals =
            ActionModifierService.resolvePreparationTotals({
                base: {},
                sources: [],
                difficulty: ACTION_DIFFICULTIES.average,
                modifiers
            });


        assert.equal(
            totals.bonus,
            2
        );

        assert.equal(
            totals.penalty,
            1
        );

        assert.equal(
            totals.modifier,
            1
        );

    }
);


/* ============================================================
 * ActionModifierService.resolvePreparation
 * ============================================================ */


test(
    "resolvePreparation : lève une erreur si aucune préparation n'est fournie",
    () => {

        assert.throws(
            () =>
                ActionModifierService.resolvePreparation(
                    null
                ),
            TypeError
        );

        assert.throws(
            () =>
                ActionModifierService.resolvePreparation(
                    "pas-un-objet"
                ),
            TypeError
        );

    }
);


test(
    "resolvePreparation : ne conserve que les modificateurs sélectionnés",
    () => {

        const preparation = {

            context: {
                actionType: "skill-roll"
            },

            base: {
                attribute: 1,
                skill: 1,
                stress: 0
            },

            sources: [],

            difficulty: ACTION_DIFFICULTIES.average,

            modifiers: [
                createActionModifier({
                    id: "bonus-1",
                    label: "Bonus",
                    source: ACTION_MODIFIER_SOURCES.MANUAL,
                    value: 2,
                    selected: true
                }),
                createActionModifier({
                    id: "bonus-2",
                    label: "Bonus désactivé",
                    source: ACTION_MODIFIER_SOURCES.MANUAL,
                    value: 5,
                    selected: false
                })
            ],

            specialEffects: []

        };


        const resolved =
            ActionModifierService.resolvePreparation(
                preparation
            );


        assert.equal(
            resolved.modifiers.length,
            1
        );

        assert.equal(
            resolved.modifiers[0].id,
            "bonus-1"
        );

        assert.equal(
            resolved.total,
            2
        );

        assert.equal(
            resolved.bonus,
            2
        );

        assert.equal(
            resolved.penalty,
            0
        );

    }
);


test(
    "resolvePreparation : une source verrouillée reste sélectionnée même si selected:false lui est passé",
    () => {

        const preparation = {

            context: {
                actionType: "melee-attack"
            },

            base: {},

            sources: [
                createActionSource({
                    id: "weapon:1",
                    label: "Couteau",
                    type: ACTION_MODIFIER_SOURCES.WEAPON,
                    bonus: 0,
                    locked: true,
                    selected: true
                })
            ],

            difficulty: ACTION_DIFFICULTIES.average,

            modifiers: [],

            specialEffects: []

        };


        /*
         * On force artificiellement selected à false
         * comme le ferait une interface mal synchronisée :
         * la sécurité métier doit malgré tout la
         * conserver sélectionnée dans la résolution finale.
         */
        preparation.sources[0].selected = false;


        const resolved =
            ActionModifierService.resolvePreparation(
                preparation
            );


        assert.equal(
            resolved.sources[0].selected,
            true
        );

        assert.equal(
            resolved.selectedSources.length,
            1
        );

    }
);


test(
    "resolvePreparation : une source non verrouillée et non sélectionnée n'apparaît pas dans selectedSources",
    () => {

        const preparation = {

            context: {
                actionType: "skill-roll"
            },

            base: {},

            sources: [
                createActionSource({
                    id: "weapon:1",
                    label: "Couteau",
                    type: ACTION_MODIFIER_SOURCES.WEAPON,
                    bonus: 2,
                    selected: false
                })
            ],

            difficulty: ACTION_DIFFICULTIES.average,

            modifiers: [],

            specialEffects: []

        };


        const resolved =
            ActionModifierService.resolvePreparation(
                preparation
            );


        assert.equal(
            resolved.selectedSources.length,
            0
        );

        assert.equal(
            resolved.totals.weapon,
            0
        );

    }
);


test(
    "resolvePreparation : filtre les specialEffects selon les talents réellement sélectionnés",
    () => {

        const preparation = {

            context: {
                actionType: "melee-attack"
            },

            base: {},

            sources: [],

            difficulty: ACTION_DIFFICULTIES.average,

            modifiers: [
                createActionModifier({
                    id: "talent:brute:0",
                    label: "Brute",
                    source: ACTION_MODIFIER_SOURCES.TALENT,
                    value: 1,
                    selected: true,
                    metadata: {
                        talentKey: "brute"
                    }
                }),
                createActionModifier({
                    id: "talent:weakPoint:0",
                    label: "Point faible",
                    source: ACTION_MODIFIER_SOURCES.TALENT,
                    value: 1,
                    selected: false,
                    metadata: {
                        talentKey: "weakPoint"
                    }
                })
            ],

            specialEffects: [
                {
                    talentKey: "brute",
                    talentLabel: "Brute",
                    selected: true,
                    conditionState: "met",
                    effect: {
                        type: "damage-modifier"
                    }
                },
                {
                    talentKey: "weakPoint",
                    talentLabel: "Point faible",
                    selected: false,
                    conditionState: "met",
                    effect: {
                        type: "no-aim"
                    }
                }
            ]

        };


        const resolved =
            ActionModifierService.resolvePreparation(
                preparation
            );


        assert.equal(
            resolved.specialEffects.length,
            1
        );

        assert.equal(
            resolved.specialEffects[0].talentKey,
            "brute"
        );

    }
);


test(
    "resolvePreparation : sans difficulté fournie, retombe sur average",
    () => {

        const preparation = {
            context: {
                actionType: "skill-roll"
            },
            base: {},
            sources: [],
            modifiers: [],
            specialEffects: []
        };


        const resolved =
            ActionModifierService.resolvePreparation(
                preparation
            );


        assert.equal(
            resolved.difficulty.id,
            "average"
        );

    }
);


/* ============================================================
 * « Subir 1 Stress pour +3 » (livre, p.190)
 * ============================================================ */


test(
    "resolvePreparationTotals : stressForBonus=false n'ajoute rien au pool",
    () => {

        const totals =
            ActionModifierService.resolvePreparationTotals({
                base: {
                    attribute: 3,
                    skill: 2,
                    stress: 1
                },
                sources: [],
                modifiers: []
            });

        assert.equal(totals.stressBonus, 0);
        assert.equal(totals.extraStressDie, 0);
        assert.equal(totals.dicePool, 6);

    }
);


test(
    "resolvePreparationTotals : stressForBonus=true ajoute +3 et +1 dé de Stress au pool",
    () => {

        const totals =
            ActionModifierService.resolvePreparationTotals({
                base: {
                    attribute: 3,
                    skill: 2,
                    stress: 1
                },
                sources: [],
                modifiers: [],
                stressForBonus: true
            });

        assert.equal(totals.stressBonus, 3);
        assert.equal(totals.extraStressDie, 1);

        /*
        * 3 (attribut) + 2 (compétence) + 1 (stress existant)
        * + 3 (stressBonus) + 1 (dé de Stress supplémentaire)
        * = 10.
        */
        assert.equal(totals.dicePool, 10);

    }
);


test(
    "createPreparation : stressForBonus=false par défaut",
    () => {

        const preparation =
            ActionModifierService.createPreparation({
                context: {
                    actionType: "skill-roll"
                },
                base: {
                    attribute: 2,
                    skill: 1
                }
            });

        assert.equal(preparation.stressForBonus, false);
        assert.equal(preparation.totals.stressBonus, 0);
        assert.equal(preparation.totals.extraStressDie, 0);

    }
);


test(
    "createPreparation : stressForBonus=true propage +3/+1 dans les totaux",
    () => {

        const preparation =
            ActionModifierService.createPreparation({
                context: {
                    actionType: "skill-roll"
                },
                base: {
                    attribute: 2,
                    skill: 1
                },
                stressForBonus: true
            });

        assert.equal(preparation.stressForBonus, true);
        assert.equal(preparation.totals.stressBonus, 3);
        assert.equal(preparation.totals.extraStressDie, 1);

    }
);


test(
    "resolvePreparation : propage stressForBonus et ses totaux jusqu'au résultat final",
    () => {

        const preparation = {
            context: {
                actionType: "attribute-roll"
            },
            base: {
                attribute: 4,
                skill: 0,
                stress: 0
            },
            sources: [],
            modifiers: [],
            specialEffects: [],
            stressForBonus: true
        };

        const resolved =
            ActionModifierService.resolvePreparation(
                preparation
            );

        assert.equal(resolved.stressForBonus, true);
        assert.equal(resolved.totals.stressBonus, 3);
        assert.equal(resolved.totals.extraStressDie, 1);

    }
);


test(
    "resolvePreparation : stressForBonus absent équivaut à false",
    () => {

        const preparation = {
            context: {
                actionType: "skill-roll"
            },
            base: {},
            sources: [],
            modifiers: [],
            specialEffects: []
        };

        const resolved =
            ActionModifierService.resolvePreparation(
                preparation
            );

        assert.equal(resolved.stressForBonus, false);
        assert.equal(resolved.totals.stressBonus, 0);
        assert.equal(resolved.totals.extraStressDie, 0);

    }
);


/* ============================================================
 * weaponMods (Améliorations d'arme)
 * ============================================================ */


test(
    "createPreparation : sans weaponMods, produit un tableau vide",
    () => {

        const preparation =
            ActionModifierService.createPreparation({
                context: {
                    actionType: "ranged-attack"
                }
            });

        assert.deepEqual(preparation.weaponMods, []);

    }
);


test(
    "createPreparation : normalise les weaponMods fournis, toujours non sélectionnés par défaut",
    () => {

        const preparation =
            ActionModifierService.createPreparation({
                context: {
                    actionType: "ranged-attack"
                },

                weaponMods: [
                    {
                        id: "mod1",
                        uuid: "Actor.a1.Item.mod1",
                        name: "Pointeur laser",
                        description: "Effet pointeur laser.",
                        resourceId: "energy",
                        resourceAmount: 1,
                        /*
                         * Même fourni à true en amont, la
                         * normalisation doit forcer false : la
                         * sélection n'est jamais automatique.
                         */
                        selected: true
                    }
                ]
            });

        assert.equal(preparation.weaponMods.length, 1);
        assert.equal(preparation.weaponMods[0].id, "mod1");
        assert.equal(preparation.weaponMods[0].uuid, "Actor.a1.Item.mod1");
        assert.equal(preparation.weaponMods[0].name, "Pointeur laser");
        assert.equal(preparation.weaponMods[0].resourceId, "energy");
        assert.equal(preparation.weaponMods[0].resourceAmount, 1);
        assert.equal(preparation.weaponMods[0].selected, false);

    }
);


test(
    "resolvePreparation : weaponMods sans sélection => selectedWeaponMods vide",
    () => {

        const preparation = {
            context: {
                actionType: "ranged-attack"
            },
            base: {},
            sources: [],
            modifiers: [],
            specialEffects: [],
            weaponMods: [
                {
                    id: "mod1",
                    uuid: "Actor.a1.Item.mod1",
                    name: "Silencieux",
                    description: "Effet silencieux.",
                    resourceId: "",
                    resourceAmount: 1,
                    selected: false
                }
            ]
        };

        const resolved =
            ActionModifierService.resolvePreparation(
                preparation
            );

        assert.equal(resolved.weaponMods.length, 1);
        assert.deepEqual(resolved.selectedWeaponMods, []);

    }
);


test(
    "resolvePreparation : weaponMods sélectionnés sont reportés dans selectedWeaponMods, sans effet sur les totaux",
    () => {

        const preparation = {
            context: {
                actionType: "ranged-attack"
            },
            base: {
                attribute: 4,
                skill: 2
            },
            sources: [],
            modifiers: [],
            specialEffects: [],
            weaponMods: [
                {
                    id: "mod1",
                    uuid: "Actor.a1.Item.mod1",
                    name: "Pointeur laser",
                    description: "Effet pointeur laser.",
                    resourceId: "energy",
                    resourceAmount: 1,
                    selected: true
                },
                {
                    id: "mod2",
                    uuid: "Actor.a1.Item.mod2",
                    name: "Silencieux",
                    description: "Effet silencieux.",
                    resourceId: "",
                    resourceAmount: 1,
                    selected: false
                }
            ]
        };

        const resolved =
            ActionModifierService.resolvePreparation(
                preparation
            );

        assert.equal(resolved.selectedWeaponMods.length, 1);
        assert.equal(resolved.selectedWeaponMods[0].id, "mod1");
        assert.equal(resolved.selectedWeaponMods[0].resourceId, "energy");
        assert.equal(resolved.selectedWeaponMods[0].resourceAmount, 1);

        /*
         * Aucun bonus chiffré : le pool de dés reste déterminé
         * uniquement par attribute + skill (aucune source, aucun
         * modificateur manuel non nul).
         */
        assert.equal(resolved.totals.dicePool, 6);

    }
);


test(
    "resolvePreparation : sans weaponMods dans la préparation, les champs restent des tableaux vides",
    () => {

        const preparation = {
            context: {
                actionType: "skill-roll"
            },
            base: {},
            sources: [],
            modifiers: [],
            specialEffects: []
        };

        const resolved =
            ActionModifierService.resolvePreparation(
                preparation
            );

        assert.deepEqual(resolved.weaponMods, []);
        assert.deepEqual(resolved.selectedWeaponMods, []);

    }
);
