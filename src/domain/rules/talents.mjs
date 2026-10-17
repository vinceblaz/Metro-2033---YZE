/**
 * Règles domaine des talents Métro 2033.
 *
 * Aucune dépendance à Foundry.
 *
 * Un talent est évalué pour UNE résolution précise :
 *
 * - melee-attack
 * - melee-block
 * - ranged-attack
 *
 * L'évaluation distingue :
 *
 * - relevance : le talent concerne cette action ;
 * - condition : les conditions sont remplies, absentes
 *   ou indéterminées ;
 * - selected : état proposé à l'ouverture de la fenêtre ;
 * - effects : effets réglementaires proposés.
 */


import {
    ACTION_RESOLUTION_TYPES,
    hasActionContextFact,
    getActionContextFact
} from "./action-resolution-context.mjs";


/* ============================================================
 * IDENTIFIANTS
 * ============================================================ */


export const TALENT_KEYS =
    Object.freeze({

        FAVORITE_WEAPON:
            "favoriteWeapon",

        BRUTE:
            "brute",

        WEAK_POINT:
            "weakPoint",

        WEAPON_SPECIALIST:
            "weaponSpecialist",

        RAPID_FIRE:
            "rapidFire",

        SHARPSHOOTER:
            "sharpshooter",

        WATER_FORAGER:
            "waterForager",

        FOOD_FORAGER:
            "foodForager",

        ENERGY_FORAGER:
            "energyForager",

        MEDICINE_FORAGER:
            "medicineForager",

        EQUIPMENT_FORAGER:
            "equipmentForager",

        DODGE:
            "dodge",

        DANGER_SENSE:
            "dangerSense",

        INTIMIDATING:
            "intimidating",

        INSTINCTIVE_SHOOTER:
            "instinctiveShooter",

        PILOT:
            "pilot",

        /*
         * Traits de Créature (livre des Monstres) à effet chiffré
         * sur un jet. Clés alignées sur celles générées à l'import
         * du bestiaire (`creature-trait-<nom>`).
         */
        CREATURE_FLIGHT:
            "creature-trait-vol",

        CREATURE_PHOTOSENSITIVE:
            "creature-trait-photosensible",

        CREATURE_LETHARGY:
            "creature-trait-lethargie"


    });


export const TALENT_EFFECT_TYPES =
    Object.freeze({

        ACTION_MODIFIER:
            "action-modifier",

        DAMAGE_MODIFIER:
            "damage-modifier",

        ACTION_COST:
            "action-cost",

        FORBID_AIM:
            "forbid-aim",

        /*
         * Permet (au choix du joueur, jamais automatique) de
         * faire CE jet sous un Attribut différent de celui
         * normalement associé à la Compétence/l'action
         * (Esquive, Sens du danger, Menaçant). L'effet porte
         * uniquement l'identifiant de l'Attribut alternatif
         * (`attribute`) ; c'est la couche Foundry
         * (ActionPreparationService, qui dispose de l'Actor)
         * qui résout le score correspondant.
         */
        ATTRIBUTE_SWAP:
            "attribute-swap"

    });


export const TALENT_CONDITION_STATES =
    Object.freeze({

        MET:
            "met",

        UNMET:
            "unmet",

        UNKNOWN:
            "unknown",

        NONE:
            "none"

    });


/* ============================================================
 * UTILITAIRES
 * ============================================================ */


function normalizeTalentLevel(
    talent
) {

    const level =
        Number(
            talent?.level
            ?? 1
        );


    if (
        !Number.isInteger(level)
        || level < 1
    ) {

        return 1;

    }


    return level;

}


function isAdvancedTalent(
    talent
) {

    return (
        normalizeTalentLevel(
            talent
        )
        >= 2
    );

}


function getTalentConfiguration(
    talent
) {

    return (
        talent?.configuration
        ?? {}
    );

}


function createModifierEffect(
    value,
    metadata = {}
) {

    return {

        type:
            TALENT_EFFECT_TYPES
                .ACTION_MODIFIER,

        suggestedValue:
            Number(value) || 0,

        editable:
            true,

        metadata: {
            ...metadata
        }

    };

}


function createAttributeSwapEffect(
    attribute
) {

    return {

        type:
            TALENT_EFFECT_TYPES
                .ATTRIBUTE_SWAP,

        attribute,

        editable:
            true

    };

}


/**
 * Condition circonstancielle booléenne.
 *
 * true      -> condition remplie
 * false     -> condition explicitement non remplie
 * undefined -> le système ne sait pas
 */
function evaluateBooleanFact(
    context,
    factId
) {

    if (
        !hasActionContextFact(
            context,
            factId
        )
    ) {

        return (
            TALENT_CONDITION_STATES
                .UNKNOWN
        );

    }


    return (
        getActionContextFact(
            context,
            factId
        )
        === true
    )
        ? TALENT_CONDITION_STATES.MET
        : TALENT_CONDITION_STATES.UNMET;

}


/* ============================================================
 * TALENTS « ÉCHANGE D'ATTRIBUT » (au choix, jamais automatique)
 * ============================================================ */


/**
 * ESQUIVE — "Lorsque vous bloquez une attaque en combat
 * rapproché, vous pouvez bloquer avec votre AGILITÉ plutôt que
 * votre VIGUEUR (au choix)." (Talents généraux, niveau max 1.)
 */
const DODGE_TALENT_DEFINITION = {

    key:
        TALENT_KEYS.DODGE,

    label:
        "Esquive",

    incompatibilities: [],


    isRelevant(
        talent,
        context
    ) {

        return (
            context?.actionType
                === ACTION_RESOLUTION_TYPES
                    .MELEE_BLOCK
        );

    },


    evaluateCondition() {

        /*
         * Toujours disponible : c'est un choix libre du
         * joueur, pas une circonstance à vérifier.
         */
        return (
            TALENT_CONDITION_STATES
                .NONE
        );

    },


    getEffects() {

        return [
            createAttributeSwapEffect(
                "agility"
            )
        ];

    }

};


/**
 * SENS DU DANGER — "Vous pouvez (si vous le souhaitez) faire
 * vos jets d'OBSERVATION sous l'EMPATHIE plutôt que sous
 * l'ESPRIT." (Talents généraux, niveau max 1.)
 */
const DANGER_SENSE_TALENT_DEFINITION = {

    key:
        TALENT_KEYS.DANGER_SENSE,

    label:
        "Sens du danger",

    incompatibilities: [],


    isRelevant(
        talent,
        context
    ) {

        return (
            context?.actionType
                === ACTION_RESOLUTION_TYPES
                    .SKILL_ROLL

            && context?.skill
                === "observation"
        );

    },


    evaluateCondition() {

        return (
            TALENT_CONDITION_STATES
                .NONE
        );

    },


    getEffects() {

        return [
            createAttributeSwapEffect(
                "empathy"
            )
        ];

    }

};


/**
 * MENAÇANT — "Vous pouvez (si vous le souhaitez) faire vos
 * jets de MANIPULATION sous la VIGUEUR plutôt que sous
 * l'EMPATHIE lorsque vous menacez quelqu'un [...]. Supérieur :
 * [...] en toutes circonstances." (Talents généraux, niveau
 * max 2.)
 *
 * Niveau normal : la circonstance (« vous menacez quelqu'un »)
 * est narrative, non détectable automatiquement — même
 * politique que Tireur d'élite (fait "threatening" absent du
 * contexte -> UNKNOWN, proposé décoché, arbitrage au MJ).
 * Niveau supérieur : toujours disponible.
 */
const INTIMIDATING_TALENT_DEFINITION = {

    key:
        TALENT_KEYS.INTIMIDATING,

    label:
        "Menaçant",

    incompatibilities: [],


    isRelevant(
        talent,
        context
    ) {

        return (
            context?.actionType
                === ACTION_RESOLUTION_TYPES
                    .SKILL_ROLL

            && context?.skill
                === "manipulation"
        );

    },


    evaluateCondition(
        talent,
        context
    ) {

        if (
            isAdvancedTalent(
                talent
            )
        ) {

            return (
                TALENT_CONDITION_STATES
                    .NONE
            );

        }


        return evaluateBooleanFact(
            context,
            "threatening"
        );

    },


    getEffects() {

        return [
            createAttributeSwapEffect(
                "vigor"
            )
        ];

    }

};


/**
 * TIREUR INSTINCTIF — "Lorsque vous tirez à couvert, le
 * modificateur appliqué à vos jets de TIR n'est que de –1 au
 * lieu de –2. Supérieur : vous ne subissez plus de modificateur
 * négatif au TIR lorsque vous faites feu depuis un abri ; vous
 * ne subissez pas non plus le modificateur de –1 lorsque vous
 * tirez depuis un véhicule en mouvement." (Talents généraux,
 * niveau max 2.)
 *
 * Les circonstances « à couvert » et « véhicule en mouvement »
 * sont purement narratives, à l'appréciation du MJ — exactement
 * comme « overwatch »/« aiming » pour Tireur d'élite : simples
 * faits de contexte optionnels (`cover`, `movingVehicle`),
 * absents par défaut (-> UNKNOWN, proposé décoché, arbitrage au
 * MJ via la case à cocher). Structure calquée sur Tireur d'élite.
 */
const INSTINCTIVE_SHOOTER_TALENT_DEFINITION = {

    key:
        TALENT_KEYS.INSTINCTIVE_SHOOTER,

    label:
        "Tireur instinctif",

    incompatibilities: [],


    isRelevant(
        talent,
        context
    ) {

        return (
            context?.actionType
                === ACTION_RESOLUTION_TYPES
                    .RANGED_ATTACK

            && context?.skill
                === "shooting"
        );

    },


    evaluateCondition(
        talent,
        context
    ) {

        const cover =
            evaluateBooleanFact(
                context,
                "cover"
            );


        if (
            cover
                === TALENT_CONDITION_STATES
                    .MET
        ) {

            return (
                TALENT_CONDITION_STATES
                    .MET
            );

        }


        if (
            !isAdvancedTalent(
                talent
            )
        ) {

            return cover;

        }


        const movingVehicle =
            evaluateBooleanFact(
                context,
                "movingVehicle"
            );


        if (
            movingVehicle
                === TALENT_CONDITION_STATES
                    .MET
        ) {

            return (
                TALENT_CONDITION_STATES
                    .MET
            );

        }


        if (
            cover
                === TALENT_CONDITION_STATES
                    .UNKNOWN

            || movingVehicle
                === TALENT_CONDITION_STATES
                    .UNKNOWN
        ) {

            return (
                TALENT_CONDITION_STATES
                    .UNKNOWN
            );

        }


        return (
            TALENT_CONDITION_STATES
                .UNMET
        );

    },


    getEffects(
        talent,
        context
    ) {

        const advanced =
            isAdvancedTalent(
                talent
            );


        let value = 0;


        if (
            getActionContextFact(
                context,
                "cover"
            )
            === true
        ) {

            value +=
                advanced
                    ? 2
                    : 1;

        }


        if (
            advanced

            && getActionContextFact(
                context,
                "movingVehicle"
            )
                === true
        ) {

            value += 1;

        }


        /*
         * Circonstance inconnue : on conserve le bonus minimal
         * proposé par le talent (celui du couvert, l'effet
         * principal du texte). La fenêtre le présentera décoché
         * et le MJ pourra décider.
         */
        if (
            value === 0
        ) {

            value =
                advanced
                    ? 2
                    : 1;

        }


        return [
            createModifierEffect(
                value
            )
        ];

    }

};


/**
 * PILOTE — "Modificateur de +1 sur vos jets de RÉACTION pour
 * piloter un véhicule ; vous ignorez automatiquement une
 * affliction lorsque vous forcez un tel jet. Supérieur : vous
 * pouvez conduire dans une zone encombrée sans réduire la valeur
 * de Déplacement du véhicule ; le modificateur de pilotage passe
 * à +2." (Talents d'archétype Éclaireur / Mécanicien / Stratège,
 * niveau max 2.)
 *
 * La circonstance « je pilote un véhicule » est purement
 * narrative : fait de contexte optionnel `piloting`, absent par
 * défaut (-> UNKNOWN, proposé DÉCOCHÉ, arbitrage du MJ via la
 * case à cocher). Seul le modificateur (+1 / +2) est automatisé :
 * l'affliction ignorée, la zone encombrée et le Déplacement du
 * véhicule restent à l'appréciation de la table (décision du
 * porteur du projet : « pas d'autre automatisation »).
 */
const PILOT_TALENT_DEFINITION = {

    key:
        TALENT_KEYS.PILOT,

    label:
        "Pilote",

    incompatibilities: [],


    isRelevant(
        talent,
        context
    ) {

        return (
            context?.actionType
                === ACTION_RESOLUTION_TYPES
                    .SKILL_ROLL

            && context?.skill
                === "reaction"
        );

    },


    evaluateCondition(
        talent,
        context
    ) {

        return evaluateBooleanFact(
            context,
            "piloting"
        );

    },


    getEffects(
        talent
    ) {

        return [
            createModifierEffect(
                isAdvancedTalent(talent)
                    ? 2
                    : 1
            )
        ];

    }

};


/**
 * Fabrique d'une définition de Talent « chercheur de ressource »
 * (Sourcier, Chasseur-cueilleur, Carbochimiste, Pharmacologiste,
 * Dénicheur) : tous réduisent de 1 (niveau normal) ou 2 (niveau
 * supérieur) le modificateur négatif du Jet de SURVIE visant à
 * augmenter UNE ressource de Station précise (p.219), ce qui
 * s'exprime comme un simple bonus additif via le mécanisme de
 * modificateur d'action déjà en place — aucun nouveau type
 * d'effet n'est nécessaire.
 *
 * `resourceKey` doit correspondre à une clé de
 * `STATION_SURVIVAL_ROLL_MODIFIERS`
 * (domain/rules/station-survival-roll.mjs) : "water", "food",
 * "energy", "medicine" ou "equipment".
 */
function createResourceForagerTalentDefinition({
    key,
    label,
    resourceKey
}) {

    return {

        key,

        label,

        incompatibilities: [],


        isRelevant(
            talent,
            context
        ) {

            return (
                context?.actionType
                    === ACTION_RESOLUTION_TYPES
                        .SKILL_ROLL

                && context?.skill
                    === "survival"

                && context?.metadata
                    ?.resourceKey
                    === resourceKey
            );

        },


        evaluateCondition() {

            return (
                TALENT_CONDITION_STATES
                    .NONE
            );

        },


        getEffects(
            talent
        ) {

            return [
                createModifierEffect(
                    isAdvancedTalent(talent)
                        ? 2
                        : 1
                )
            ];

        }

    };

}


/* ============================================================
 * DÉFINITIONS
 * ============================================================ */


/**
 * Définition d'un trait de Créature à modificateur fixe, toujours
 * proposé décoché (circonstance arbitrée par le MJ).
 */
function createCreatureTraitDefinition({
    key,
    label,
    value,
    isRelevant
}) {
    return {
        key,
        label,
        incompatibilities: [],
        isRelevant(talent, context) {
            return isRelevant(context);
        },
        evaluateCondition() {
            return TALENT_CONDITION_STATES.UNKNOWN;
        },
        getEffects() {
            return [createModifierEffect(value)];
        }
    };
}


export const TALENT_DEFINITIONS =
    Object.freeze({


        /* --------------------------------------------------------
         * ARME DE PRÉDILECTION
         * -------------------------------------------------------- */

        [TALENT_KEYS.FAVORITE_WEAPON]: {

            key:
                TALENT_KEYS.FAVORITE_WEAPON,

            label:
                "Arme de prédilection",

            incompatibilities: [
                TALENT_KEYS.WEAPON_SPECIALIST
            ],


            isRelevant(
                talent,
                context
            ) {

                /*
                 * Ce talent modifie une attaque,
                 * pas un blocage.
                 */

                if (
                    context?.actionType
                        !== ACTION_RESOLUTION_TYPES
                            .MELEE_ATTACK

                    && context?.actionType
                        !== ACTION_RESOLUTION_TYPES
                            .RANGED_ATTACK
                ) {

                    return false;

                }


                const weaponCategory =
                    getTalentConfiguration(
                        talent
                    )
                        .weaponCategory;


                if (!weaponCategory) {

                    return false;

                }


                return (
                    context?.weapon?.category
                    === weaponCategory
                );

            },


            evaluateCondition() {

                return (
                    TALENT_CONDITION_STATES
                        .NONE
                );

            },


            getEffects(
                talent
            ) {

                return [
                    createModifierEffect(
                        isAdvancedTalent(talent)
                            ? 2
                            : 1
                    )
                ];

            }

        },


        /* --------------------------------------------------------
         * BRUTE
         * -------------------------------------------------------- */

        [TALENT_KEYS.BRUTE]: {

            key:
                TALENT_KEYS.BRUTE,

            label:
                "Brute",

            incompatibilities: [],


            isRelevant(
                talent,
                context
            ) {

                /*
                 * Important :
                 * uniquement attaque de mêlée.
                 *
                 * Il ne sera donc PAS proposé
                 * dans la fenêtre de blocage.
                 */

                return (
                    context?.actionType
                        === ACTION_RESOLUTION_TYPES
                            .MELEE_ATTACK

                    && context?.skill
                        === "closeCombat"
                );

            },


            evaluateCondition() {

                return (
                    TALENT_CONDITION_STATES
                        .NONE
                );

            },


            getEffects(
                talent
            ) {

                return [

                    createModifierEffect(
                        isAdvancedTalent(talent)
                            ? 2
                            : 1
                    ),

                    {
                        type:
                            TALENT_EFFECT_TYPES
                                .ACTION_COST,

                        cost:
                            "fast",

                        mode:
                            "additional"
                    }

                ];

            }

        },


        /* --------------------------------------------------------
         * POINT FAIBLE
         * -------------------------------------------------------- */

        [TALENT_KEYS.WEAK_POINT]: {

            key:
                TALENT_KEYS.WEAK_POINT,

            label:
                "Point faible",

            incompatibilities: [],


            isRelevant(
                talent,
                context
            ) {

                return (
                    context?.actionType
                        === ACTION_RESOLUTION_TYPES
                            .MELEE_ATTACK

                    && context?.weapon?.category
                        === "bladedWeapon"
                );

            },


            evaluateCondition() {

                return (
                    TALENT_CONDITION_STATES
                        .NONE
                );

            },


            getEffects(
                talent
            ) {

                const effects = [

                    createModifierEffect(
                        2
                    )

                ];


                if (
                    isAdvancedTalent(
                        talent
                    )
                ) {

                    effects.push({

                        type:
                            TALENT_EFFECT_TYPES
                                .DAMAGE_MODIFIER,

                        mode:
                            "set-base",

                        suggestedValue:
                            3,

                        editable:
                            true

                    });

                }


                return effects;

            }

        },


        /* --------------------------------------------------------
         * SPÉCIALISTE EN ARMEMENT
         * -------------------------------------------------------- */

        [TALENT_KEYS.WEAPON_SPECIALIST]: {

            key:
                TALENT_KEYS.WEAPON_SPECIALIST,

            label:
                "Spécialiste en armement",

            incompatibilities: [
                TALENT_KEYS.FAVORITE_WEAPON
            ],


            isRelevant(
                talent,
                context
            ) {

                if (
                    context?.actionType
                        !== ACTION_RESOLUTION_TYPES
                            .MELEE_ATTACK

                    && context?.actionType
                        !== ACTION_RESOLUTION_TYPES
                            .RANGED_ATTACK
                ) {

                    return false;

                }


                const weaponType =
                    getTalentConfiguration(
                        talent
                    )
                        .weaponType;


                if (!weaponType) {

                    return false;

                }


                return (
                    context?.weapon?.type
                    === weaponType
                );

            },


            evaluateCondition() {

                return (
                    TALENT_CONDITION_STATES
                        .NONE
                );

            },


            getEffects(
                talent
            ) {

                return [
                    createModifierEffect(
                        isAdvancedTalent(talent)
                            ? 2
                            : 1
                    )
                ];

            }

        },


        /* --------------------------------------------------------
         * TIR RAPIDE
         * -------------------------------------------------------- */

        [TALENT_KEYS.RAPID_FIRE]: {

            key:
                TALENT_KEYS.RAPID_FIRE,

            label:
                "Tir rapide",

            incompatibilities: [],


            isRelevant(
                talent,
                context
            ) {

                /*
                 * Strictement une attaque à distance.
                 *
                 * Il n'apparaîtra donc jamais dans
                 * une fenêtre de mêlée ou de blocage.
                 */

                return (
                    context?.actionType
                        === ACTION_RESOLUTION_TYPES
                            .RANGED_ATTACK

                    && context?.skill
                        === "shooting"

                    && context?.weapon?.isFirearm
                        === true

                    && context?.weapon?.isHeavyWeapon
                        !== true
                );

            },


            evaluateCondition() {

                return (
                    TALENT_CONDITION_STATES
                        .NONE
                );

            },


            getEffects(
                talent
            ) {

                return [

                    createModifierEffect(
                        isAdvancedTalent(talent)
                            ? -2
                            : -3
                    ),

                    {
                        type:
                            TALENT_EFFECT_TYPES
                                .ACTION_COST,

                        cost:
                            "fast",

                        mode:
                            "replace"
                    },

                    {
                        type:
                            TALENT_EFFECT_TYPES
                                .FORBID_AIM
                    }

                ];

            }

        },


        /* --------------------------------------------------------
         * TIREUR D'ÉLITE
         * -------------------------------------------------------- */

        [TALENT_KEYS.SHARPSHOOTER]: {

            key:
                TALENT_KEYS.SHARPSHOOTER,

            label:
                "Tireur d'élite",

            incompatibilities: [],


            isRelevant(
                talent,
                context
            ) {

                /*
                 * Strictement Tir.
                 */

                return (
                    context?.actionType
                        === ACTION_RESOLUTION_TYPES
                            .RANGED_ATTACK

                    && context?.skill
                        === "shooting"
                );

            },


            evaluateCondition(
                talent,
                context
            ) {

                /*
                 * Niveau normal :
                 * surveillance nécessaire.
                 *
                 * Niveau supérieur :
                 * surveillance et/ou visée
                 * peuvent rendre le talent applicable.
                 */

                const overwatch =
                    evaluateBooleanFact(
                        context,
                        "overwatch"
                    );


                if (
                    overwatch
                        === TALENT_CONDITION_STATES
                            .MET
                ) {

                    return (
                        TALENT_CONDITION_STATES
                            .MET
                    );

                }


                if (
                    !isAdvancedTalent(
                        talent
                    )
                ) {

                    return overwatch;

                }


                const aiming =
                    evaluateBooleanFact(
                        context,
                        "aiming"
                    );


                if (
                    aiming
                        === TALENT_CONDITION_STATES
                            .MET
                ) {

                    return (
                        TALENT_CONDITION_STATES
                            .MET
                    );

                }


                if (
                    overwatch
                        === TALENT_CONDITION_STATES
                            .UNKNOWN

                    || aiming
                        === TALENT_CONDITION_STATES
                            .UNKNOWN
                ) {

                    return (
                        TALENT_CONDITION_STATES
                            .UNKNOWN
                    );

                }


                return (
                    TALENT_CONDITION_STATES
                        .UNMET
                );

            },


            getEffects(
                talent,
                context
            ) {

                let value = 0;


                if (
                    getActionContextFact(
                        context,
                        "overwatch"
                    )
                    === true
                ) {

                    value += 1;

                }


                if (
                    isAdvancedTalent(
                        talent
                    )

                    && getActionContextFact(
                        context,
                        "aiming"
                    )
                        === true
                ) {

                    value += 1;

                }


                /*
                 * Si la circonstance est inconnue,
                 * on conserve le bonus minimal
                 * proposé par le talent.
                 *
                 * La fenêtre le présentera décoché
                 * et le MJ pourra décider.
                 */

                if (
                    value === 0
                ) {

                    value = 1;

                }


                return [
                    createModifierEffect(
                        value
                    )
                ];

            }

        },


        /* --------------------------------------------------------
         * SOURCIER
         * -------------------------------------------------------- */

        [TALENT_KEYS.WATER_FORAGER]:
            createResourceForagerTalentDefinition({
                key: TALENT_KEYS.WATER_FORAGER,
                label: "Sourcier",
                resourceKey: "water"
            }),


        /* --------------------------------------------------------
         * CHASSEUR-CUEILLEUR
         * -------------------------------------------------------- */

        [TALENT_KEYS.FOOD_FORAGER]:
            createResourceForagerTalentDefinition({
                key: TALENT_KEYS.FOOD_FORAGER,
                label: "Chasseur-cueilleur",
                resourceKey: "food"
            }),


        /* --------------------------------------------------------
         * CARBOCHIMISTE
         * -------------------------------------------------------- */

        [TALENT_KEYS.ENERGY_FORAGER]:
            createResourceForagerTalentDefinition({
                key: TALENT_KEYS.ENERGY_FORAGER,
                label: "Carbochimiste",
                resourceKey: "energy"
            }),


        /* --------------------------------------------------------
         * PHARMACOLOGISTE
         * -------------------------------------------------------- */

        [TALENT_KEYS.MEDICINE_FORAGER]:
            createResourceForagerTalentDefinition({
                key: TALENT_KEYS.MEDICINE_FORAGER,
                label: "Pharmacologiste",
                resourceKey: "medicine"
            }),


        /* --------------------------------------------------------
         * DÉNICHEUR
         * -------------------------------------------------------- */

        [TALENT_KEYS.EQUIPMENT_FORAGER]:
            createResourceForagerTalentDefinition({
                key: TALENT_KEYS.EQUIPMENT_FORAGER,
                label: "Dénicheur",
                resourceKey: "equipment"
            }),


        /* --------------------------------------------------------
         * ESQUIVE
         * -------------------------------------------------------- */

        [TALENT_KEYS.DODGE]:
            DODGE_TALENT_DEFINITION,


        /* --------------------------------------------------------
         * SENS DU DANGER
         * -------------------------------------------------------- */

        [TALENT_KEYS.DANGER_SENSE]:
            DANGER_SENSE_TALENT_DEFINITION,


        /* --------------------------------------------------------
         * MENAÇANT
         * -------------------------------------------------------- */

        [TALENT_KEYS.INTIMIDATING]:
            INTIMIDATING_TALENT_DEFINITION,


        /* --------------------------------------------------------
         * TIREUR INSTINCTIF
         * -------------------------------------------------------- */

        [TALENT_KEYS.INSTINCTIVE_SHOOTER]:
            INSTINCTIVE_SHOOTER_TALENT_DEFINITION,


        /* --------------------------------------------------------
         * PILOTE
         * -------------------------------------------------------- */

        [TALENT_KEYS.PILOT]:
            PILOT_TALENT_DEFINITION,


        /* --------------------------------------------------------
         * TRAITS DE CRÉATURE À MODIFICATEUR DE JET
         *
         * Les circonstances (fuite, lumière vive, créature
         * rassasiée) relèvent du MJ : le modificateur est toujours
         * proposé décoché.
         * -------------------------------------------------------- */

        [TALENT_KEYS.CREATURE_FLIGHT]:
            createCreatureTraitDefinition({
                key: TALENT_KEYS.CREATURE_FLIGHT,
                label: "Vol (fuite)",
                value: 2,
                isRelevant: context =>
                    context?.skill === "reaction"
            }),

        [TALENT_KEYS.CREATURE_PHOTOSENSITIVE]:
            createCreatureTraitDefinition({
                key: TALENT_KEYS.CREATURE_PHOTOSENSITIVE,
                label: "Photosensible (lumière vive)",
                value: -2,
                isRelevant: context =>
                    [
                        "closeCombat",
                        "reaction",
                        "shooting",
                        "observation"
                    ].includes(context?.skill)
            }),

        [TALENT_KEYS.CREATURE_LETHARGY]:
            createCreatureTraitDefinition({
                key: TALENT_KEYS.CREATURE_LETHARGY,
                label: "Léthargie (rassasié)",
                value: -2,
                isRelevant: context =>
                    context?.actionType
                        === ACTION_RESOLUTION_TYPES.MELEE_ATTACK
                    || context?.actionType
                        === ACTION_RESOLUTION_TYPES.RANGED_ATTACK
                    || context?.skill === "reaction"
            })

    });


/* ============================================================
 * API PUBLIQUE
 * ============================================================ */


export function getTalentDefinition(
    key
) {

    return (
        TALENT_DEFINITIONS[key]
        ?? null
    );

}


export function isKnownTalent(
    key
) {

    return (
        getTalentDefinition(key)
        !== null
    );

}


/**
 * Évalue un talent pour UNE résolution.
 *
 * Un talent non pertinent retourne null :
 * l'interface ne doit même pas le proposer.
 */
export function evaluateTalentForAction(
    talent,
    context
) {

    const definition =
        getTalentDefinition(
            talent?.key
        );


    if (!definition) {

        return null;

    }


    if (
        !definition.isRelevant(
            talent,
            context
        )
    ) {

        return null;

    }


    const conditionState =
        definition.evaluateCondition(
            talent,
            context
        );


    /*
     * Politique d'interface :
     *
     * NONE    -> précoché
     * MET     -> précoché
     * UNKNOWN -> proposé décoché
     * UNMET   -> proposé décoché
     *
     * Même UNMET reste disponible afin que
     * le MJ puisse arbitrer la circonstance.
     */

    const selected =
        conditionState
            === TALENT_CONDITION_STATES.NONE

        || conditionState
            === TALENT_CONDITION_STATES.MET;


    return {

        key:
            definition.key,

        label:
            definition.label,

        level:
            normalizeTalentLevel(
                talent
            ),

        relevant:
            true,

        conditionState,

        selected,

        editable:
            true,

        effects:
            definition.getEffects(
                talent,
                context
            ),

        incompatibilities: [
            ...definition.incompatibilities
        ]

    };

}


/**
 * Spécialiste en armement : le Talent se prend plusieurs fois,
 * une fois par type d'arme (livre : « indépendamment pour chaque
 * type d'arme »), et un second exemplaire du MÊME type donne la
 * version Supérieure (+2). Les exemplaires de même type sont donc
 * fusionnés en un seul, de niveau = max(niveau, nombre
 * d'exemplaires) ; les types différents restent indépendants.
 */
function mergeStackableTalents(
    talents
) {

    const merged = [];

    const bySpecialistType = new Map();

    for (const talent of talents) {

        if (talent?.key !== TALENT_KEYS.WEAPON_SPECIALIST) {

            merged.push(talent);
            continue;

        }

        const typeKey =
            talent.configuration?.weaponType
            ?? "";

        const existing =
            bySpecialistType.get(typeKey);

        if (!existing) {

            const copy = {
                ...talent,
                level: normalizeTalentLevel(talent),
                _copies: 1
            };

            bySpecialistType.set(typeKey, copy);
            merged.push(copy);
            continue;

        }

        existing._copies += 1;

        existing.level = Math.max(
            existing.level,
            normalizeTalentLevel(talent),
            existing._copies
        );

    }

    return merged;

}


/**
 * Évalue une collection de talents.
 *
 * Les talents non pertinents sont éliminés.
 */
export function evaluateTalentsForAction(
    talents,
    context
) {

    if (
        !Array.isArray(
            talents
        )
    ) {

        return [];

    }


    return mergeStackableTalents(
        talents
    )
        .map(
            talent =>
                evaluateTalentForAction(
                    talent,
                    context
                )
        )
        .filter(Boolean);

}


/**
 * Compatibilité entre deux talents.
 */
export function areTalentsCompatible(
    firstTalent,
    secondTalent
) {

    if (
        !firstTalent
        || !secondTalent
    ) {

        return true;

    }


    const firstDefinition =
        getTalentDefinition(
            firstTalent.key
        );


    const secondDefinition =
        getTalentDefinition(
            secondTalent.key
        );


    if (
        !firstDefinition
        || !secondDefinition
    ) {

        return true;

    }


    return (
        !firstDefinition
            .incompatibilities
            .includes(
                secondTalent.key
            )

        && !secondDefinition
            .incompatibilities
            .includes(
                firstTalent.key
            )
    );

}