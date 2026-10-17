/**
 * Préparation des modificateurs d'une résolution d'action.
 *
 * Cette couche fait le lien entre :
 *
 * - ActionResolutionContext
 * - talents
 * - circonstances
 * - effets
 * - modificateurs manuels
 *
 * Elle ne lance aucun jet.
 * Elle ne consomme aucune action.
 * Elle ne dépend pas de l'interface graphique.
 */


import {
    evaluateTalentsForAction,
    TALENT_EFFECT_TYPES
} from "../domain/rules/talents.mjs";


/* ============================================================
 * SOURCES
 * ============================================================ */


export const ACTION_MODIFIER_SOURCES =
    Object.freeze({

        TALENT:
            "talent",

        CIRCUMSTANCE:
            "circumstance",

        EFFECT:
            "effect",

        EQUIPMENT:
            "equipment",

        WEAPON:
            "weapon",

        MANUAL:
            "manual"

    });

/* ============================================================
 * DIFFICULTÉS
 * ============================================================ */


export const ACTION_DIFFICULTIES =
    Object.freeze({

        trivial: {
            id: "trivial",
            label: "Triviale",
            modifier: 3
        },

        easy: {
            id: "easy",
            label: "Aisée",
            modifier: 2
        },

        simple: {
            id: "simple",
            label: "Facile",
            modifier: 1
        },

        average: {
            id: "average",
            label: "Moyenne",
            modifier: 0
        },

        tricky: {
            id: "tricky",
            label: "Délicate",
            modifier: -1
        },

        hard: {
            id: "hard",
            label: "Ardue",
            modifier: -2
        },

        exceptional: {
            id: "exceptional",
            label: "Exceptionnelle",
            modifier: -3
        }

    });

/* ============================================================
 * UTILITAIRES
 * ============================================================ */


function normalizeNumber(
    value
) {

    const number =
        Number(value);


    return Number.isFinite(number)
        ? number
        : 0;

}


function normalizeBoolean(
    value,
    fallback = false
) {

    return (
        typeof value === "boolean"
            ? value
            : fallback
    );

}


/* ============================================================
 * AMÉLIORATIONS D'ARME (weaponMod)
 * ============================================================ */


/**
 * Normalise une entrée d'Amélioration d'arme proposable dans
 * la fenêtre de préparation.
 *
 * Toujours `selected: false` par défaut (jamais automatique) :
 * seule une sélection explicite du joueur/MJ dans la fenêtre
 * de préparation peut la faire passer à true (cf.
 * applyFormToPreparation dans action-modifier-dialog.mjs).
 *
 * Ne porte jamais de bonus chiffré : ce n'est pas un
 * ActionModifier au sens de ce fichier.
 */
function normalizeWeaponMod(
    weaponMod,
    {
        forceUnselected = false
    } = {}
) {

    return {

        id:
            weaponMod?.id
            ?? "",

        uuid:
            weaponMod?.uuid
            ?? "",

        name:
            weaponMod?.name
            ?? "",

        description:
            weaponMod?.description
            ?? "",

        resourceId:
            weaponMod?.resourceId
            ?? "",

        resourceAmount:
            normalizeNumber(
                weaponMod?.resourceAmount
                ?? 1
            ),

        selected:
            forceUnselected
                ? false
                : normalizeBoolean(
                    weaponMod?.selected,
                    false
                )

    };

}


function normalizeWeaponMods(
    weaponMods,
    options = {}
) {

    return (
        Array.isArray(weaponMods)
            ? weaponMods
            : []
    )
        .map(
            weaponMod =>
                normalizeWeaponMod(
                    weaponMod,
                    options
                )
        );

}


/* ============================================================
 * MODIFICATEUR
 * ============================================================ */


/**
 * Crée une proposition de modificateur.
 *
 * suggestedValue :
 * valeur issue des règles.
 *
 * value :
 * valeur réellement appliquée au jet.
 *
 * Le MJ/joueur pourra modifier value
 * sans perdre suggestedValue.
 */
export function createActionModifier({

    id,

    label,

    source,

    suggestedValue = 0,

    value = suggestedValue,

    selected = true,

    editable = true,

    reference = null,

    conditionState = null,

    metadata = {}

} = {}) {

    if (
        typeof id !== "string"
        || id.trim().length === 0
    ) {

        throw new TypeError(
            "Un modificateur d'action doit posséder un id."
        );

    }


    if (
        typeof label !== "string"
        || label.trim().length === 0
    ) {

        throw new TypeError(
            "Un modificateur d'action doit posséder un label."
        );

    }


    if (
        !Object.values(
            ACTION_MODIFIER_SOURCES
        ).includes(source)
    ) {

        throw new TypeError(
            `Source de modificateur inconnue : ${source}.`
        );

    }


    return {

        id:
            id.trim(),

        label:
            label.trim(),

        source,

        suggestedValue:
            normalizeNumber(
                suggestedValue
            ),

        value:
            normalizeNumber(
                value
            ),

        selected:
            normalizeBoolean(
                selected,
                true
            ),

        editable:
            normalizeBoolean(
                editable,
                true
            ),

        reference,

        conditionState,

        metadata: {
            ...metadata
        }

    };

}

/* ============================================================
 * SOURCE DE BONUS
 * ============================================================ */


/**
 * Source métier susceptible de contribuer
 * au pool d'une action.
 *
 * Les types restent distincts métierement :
 *
 * - weapon
 * - equipment
 * - talent
 *
 * L'interface pourra néanmoins les afficher
 * dans une liste unique.
 */
export function createActionSource({

    id,

    label,

    type,

    bonus = 0,

    selected = false,

    locked = false,

    reference = null,

    appliesTo = null,

    metadata = {}

} = {}) {

    if (
        typeof id !== "string"
        || id.trim().length === 0
    ) {

        throw new TypeError(
            "Une source d'action doit posséder un id."
        );

    }


    if (
        typeof label !== "string"
        || label.trim().length === 0
    ) {

        throw new TypeError(
            "Une source d'action doit posséder un label."
        );

    }


    if (
        ![
            ACTION_MODIFIER_SOURCES.WEAPON,
            ACTION_MODIFIER_SOURCES.EQUIPMENT,
            ACTION_MODIFIER_SOURCES.TALENT
        ].includes(type)
    ) {

        throw new TypeError(
            `Type de source d'action inconnu : ${type}.`
        );

    }


    const normalizedLocked =
        normalizeBoolean(
            locked,
            false
        );


    return {

        id:
            id.trim(),

        label:
            label.trim(),

        type,

        bonus:
            normalizeNumber(
                bonus
            ),

        /*
         * Une source verrouillée est nécessairement active.
         */
        selected:
            normalizedLocked
            || normalizeBoolean(
                selected,
                false
            ),

        locked:
            normalizedLocked,

        reference,

        /*
         * Information explicative uniquement.
         *
         * Exemples :
         * attribute
         * skill
         */
        appliesTo,

        metadata: {
            ...metadata
        }

    };

}


/* ============================================================
 * TRANSFORMATION DES TALENTS
 * ============================================================ */


function createTalentModifiers(
    talents,
    context
) {

    const evaluatedTalents =
        evaluateTalentsForAction(
            talents,
            context
        );


    const modifiers = [];


    for (
        const talent
        of evaluatedTalents
    ) {

        const modifierEffects =
            talent.effects.filter(
                effect =>
                    effect.type
                        === TALENT_EFFECT_TYPES
                            .ACTION_MODIFIER
            );


        /*
         * Un talent peut produire plusieurs effets.
         *
         * Seuls les effets numériques deviennent ici
         * des ActionModifier.
         *
         * Les autres effets seront conservés
         * séparément dans la préparation.
         */

        modifierEffects.forEach(
            (
                effect,
                index
            ) => {

                modifiers.push(
                    createActionModifier({

                        id:
                            `talent:${talent.key}:${index}`,

                        label:
                            talent.label,

                        source:
                            ACTION_MODIFIER_SOURCES
                                .TALENT,

                        suggestedValue:
                            effect.suggestedValue,

                        value:
                            effect.suggestedValue,

                        selected:
                            talent.selected,

                        /*
                         * Même une valeur issue
                         * d'un talent reste modifiable.
                         */
                        editable:
                            true,

                        reference:
                            talent.key,

                        conditionState:
                            talent.conditionState,

                        metadata: {

                            talentKey:
                                talent.key,

                            talentLevel:
                                talent.level,

                            incompatibilities: [
                                ...talent.incompatibilities
                            ],

                            ...(
                                effect.metadata
                                ?? {}
                            )

                        }

                    })
                );

            }
        );

    }


    return modifiers;

}


/**
 * Retourne les effets NON numériques
 * produits par les talents.
 *
 * Exemples :
 *
 * - coût d'action
 * - interdiction de viser
 * - modification des dégâts
 */
function createTalentSpecialEffects(
    talents,
    context
) {

    const evaluatedTalents =
        evaluateTalentsForAction(
            talents,
            context
        );


    const effects = [];


    for (
        const talent
        of evaluatedTalents
    ) {

        for (
            const effect
            of talent.effects
        ) {

            if (
                effect.type
                    === TALENT_EFFECT_TYPES
                        .ACTION_MODIFIER
            ) {

                continue;

            }


            effects.push({

                talentKey:
                    talent.key,

                talentLabel:
                    talent.label,

                selected:
                    talent.selected,

                conditionState:
                    talent.conditionState,

                effect: {
                    ...effect
                }

            });

        }

    }


    return effects;

}


/* ============================================================
 * CIRCONSTANCES / EFFETS EXTERNES
 * ============================================================ */


function normalizeExternalModifiers(
    modifiers,
    source
) {

    if (
        !Array.isArray(
            modifiers
        )
    ) {

        return [];

    }


    return modifiers.map(
        (
            modifier,
            index
        ) =>
            createActionModifier({

                id:
                    modifier.id
                    ?? `${source}:${index}`,

                label:
                    modifier.label
                    ?? `Modificateur ${index + 1}`,

                source,

                suggestedValue:
                    modifier.suggestedValue
                    ?? modifier.value
                    ?? 0,

                value:
                    modifier.value
                    ?? modifier.suggestedValue
                    ?? 0,

                selected:
                    modifier.selected
                    ?? true,

                /*
                 * Toutes les valeurs proposées
                 * dans cette fenêtre sont modifiables.
                 */
                editable:
                    true,

                reference:
                    modifier.reference
                    ?? null,

                conditionState:
                    modifier.conditionState
                    ?? null,

                metadata:
                    modifier.metadata
                    ?? {}

            })
    );

}


/* ============================================================
 * RÉSOLUTION DES SOURCES
 * ============================================================ */


export function getSelectedActionSources(
    sources
) {

    if (
        !Array.isArray(
            sources
        )
    ) {

        return [];

    }


    return sources.filter(
        source =>
            source?.selected
                === true
    );

}


export function getActionSourceTotal(
    sources
) {

    return getSelectedActionSources(
        sources
    )
        .reduce(
            (
                total,
                source
            ) =>
                total
                + normalizeNumber(
                    source.bonus
                ),

            0
        );

}


export function getActionSourceTotalByType(
    sources,
    type
) {

    return getSelectedActionSources(
        sources
    )
        .filter(
            source =>
                source.type
                    === type
        )
        .reduce(
            (
                total,
                source
            ) =>
                total
                + normalizeNumber(
                    source.bonus
                ),

            0
        );

}

/* ============================================================
 * RÉSOLUTION DES TOTAUX
 * ============================================================ */


export function getSelectedActionModifiers(
    modifiers
) {

    if (
        !Array.isArray(
            modifiers
        )
    ) {

        return [];

    }


    return modifiers.filter(
        modifier =>
            modifier?.selected
                === true
    );

}


export function getActionModifierTotal(
    modifiers
) {

    return getSelectedActionModifiers(
        modifiers
    )
        .reduce(
            (
                total,
                modifier
            ) =>
                total
                + normalizeNumber(
                    modifier.value
                ),

            0
        );

}


export function getActionBonusTotal(
    modifiers
) {

    return getSelectedActionModifiers(
        modifiers
    )
        .reduce(
            (
                total,
                modifier
            ) => {

                const value =
                    normalizeNumber(
                        modifier.value
                    );


                return (
                    value > 0
                        ? total + value
                        : total
                );

            },
            0
        );

}


export function getActionPenaltyTotal(
    modifiers
) {

    return getSelectedActionModifiers(
        modifiers
    )
        .reduce(
            (
                total,
                modifier
            ) => {

                const value =
                    normalizeNumber(
                        modifier.value
                    );


                return (
                    value < 0
                        ? total + Math.abs(value)
                        : total
                );

            },
            0
        );

}


/* ============================================================
 * SERVICE
 * ============================================================ */


export class ActionModifierService {


    /**
     * Prépare l'ensemble des propositions
     * destinées à UNE fenêtre de résolution.
     */
    static createPreparation({

        context,

        talents = [],

        circumstances = [],

        effects = [],

        equipmentModifiers = [],

        manualBonus = 0,

        manualPenalty = 0,

        base = {},

        sources = [],

        difficulty = "average",

        /*
        * Option d'Attribut alternatif proposée par un Talent
        * « au choix » (Esquive, Sens du danger, Menaçant) :
        * calculée en amont par ActionPreparationService (seul
        * endroit disposant de l'Actor), simplement transmise
        * ici telle quelle. `null` si aucun Talent pertinent
        * ne propose cette option pour ce contexte.
        */
        attributeSwap = null,

        /*
        * Améliorations d'arme (weaponMod, livre p.213-214)
        * proposables pour l'arme impliquée dans ce jet (déjà
        * filtrées par attachement et par disponibilité de
        * ressource en amont, par le domaine pur
        * getUsableWeaponModsForWeapon() — cf.
        * RangedAttackPreparationService).
        *
        * Toujours `selected: false` par défaut : leur sélection
        * est purement informative/narrative, elle n'ajoute
        * JAMAIS de bonus chiffré au jet. Seule une consommation
        * de ressource (si resourceId est renseigné) en découle,
        * et uniquement après résolution du jet.
        */
        weaponMods = [],

        /*
        * « Subir 1 Stress pour +3 » (livre, p.190) : une option
        * générique disponible pour n'importe quel jet d'Attribut
        * ou de Compétence (ce coffre-moteur ne restreint pas par
        * actionType, la fenêtre de préparation l'affiche pour
        * tous les types qui passent par elle). Choisir cette
        * option ajoute +3 au pool ET un dé de Stress
        * supplémentaire pour CE jet, sans modifier
        * `actor.system.stress.dice` ici : ce dé n'est persisté
        * qu'après résolution du jet (cf. actor.rollSkill/
        * rollAttribute), conformément à la Bible §25.2.
        */
        stressForBonus = false

    } = {}) {

        if (!context?.actionType) {

            throw new TypeError(
                "Un contexte de résolution est requis."
            );

        }


        const modifiers = [

            ...createTalentModifiers(
                talents,
                context
            ),

            ...normalizeExternalModifiers(
                circumstances,
                ACTION_MODIFIER_SOURCES
                    .CIRCUMSTANCE
            ),

            ...normalizeExternalModifiers(
                effects,
                ACTION_MODIFIER_SOURCES
                    .EFFECT
            ),

            ...normalizeExternalModifiers(
                equipmentModifiers,
                ACTION_MODIFIER_SOURCES
                    .EQUIPMENT
            )

        ];


        /*
        * Bonus manuel toujours disponible.
        *
        * Un modificateur manuel est toujours actif.
        * C'est sa valeur qui détermine s'il produit
        * réellement un effet :
        *
        * 0  = aucun bonus
        * >0 = bonus appliqué
        *
        * Il n'a donc pas besoin d'une case
        * de sélection dans l'interface.
        */
        modifiers.push(
            createActionModifier({

                id:
                    "manual-bonus",

                label:
                    "Bonus manuel",

                source:
                    ACTION_MODIFIER_SOURCES
                        .MANUAL,

                suggestedValue:
                    normalizeNumber(
                        manualBonus
                    ),

                value:
                    normalizeNumber(
                        manualBonus
                    ),

                selected:
                    true,

                editable:
                    true,

                metadata: {
                    manual: true,
                    kind: "bonus"
                }

            })
        );


        /*
        * Pénalité manuelle toujours disponible.
        *
        * Elle est stockée sous forme négative.
        *
        * Comme pour le bonus manuel :
        *
        * 0  = aucune pénalité
        * <0 = pénalité appliquée
        *
        * Elle est toujours sélectionnée.
        */
        const normalizedPenalty =
            Math.abs(
                normalizeNumber(
                    manualPenalty
                )
            );


        modifiers.push(
            createActionModifier({

                id:
                    "manual-penalty",

                label:
                    "Pénalité manuelle",

                source:
                    ACTION_MODIFIER_SOURCES
                        .MANUAL,

                suggestedValue:
                    -normalizedPenalty,

                value:
                    -normalizedPenalty,

                selected:
                    true,

                editable:
                    true,

                metadata: {
                    manual: true,
                    kind: "penalty"
                }

            })
        );


        const specialEffects =
            createTalentSpecialEffects(
                talents,
                context
            );


        const normalizedBase = {

            attribute:
                normalizeNumber(
                    base.attribute
                ),

            skill:
                normalizeNumber(
                    base.skill
                ),

            stress:
                normalizeNumber(
                    base.stress
                )

        };


        const normalizedSources =
            (
                Array.isArray(sources)
                    ? sources
                    : []
            )
                .map(
                    source =>
                        createActionSource(
                            source
                        )
                );


        
        const resolvedDifficulty =
            ACTION_DIFFICULTIES[
                difficulty
            ]
            ?? ACTION_DIFFICULTIES.average;

        const normalizedStressForBonus =
            normalizeBoolean(
                stressForBonus,
                false
            );


        return{

            context,

            /*
            * « Subir 1 Stress pour +3 », cf. commentaire du
            * paramètre ci-dessus.
            */
            stressForBonus:
                normalizedStressForBonus,

            /*
            * Valeurs fondamentales du jet.
            */
            base:
                normalizedBase,

            /*
            * Armes, équipements et talents
            * éligibles au test.
            *
            * Ils seront affichés ensemble par l'UI,
            * tout en restant typés métierement.
            */
            sources:
                normalizedSources,

            /*
            * Difficulté choisie pour le test.
            */
            difficulty: {
                ...resolvedDifficulty
            },

            /*
            * Ancien mécanisme conservé pendant
            * la migration.
            */
            modifiers,

            specialEffects,

            /*
            * Option d'Attribut alternatif (Esquive, Sens du
            * danger, Menaçant) : simple passe-plat, toujours
            * décochée par défaut (effet « au choix », jamais
            * automatique). `null` si aucun Talent pertinent.
            */
            attributeSwap:
                attributeSwap
                    ? { ...attributeSwap }
                    : null,

            /*
            * Améliorations d'arme proposables (cf. le paramètre
            * weaponMods ci-dessus). Jamais sélectionnées par
            * défaut, jamais une source de bonus chiffré.
            */
            weaponMods:
                normalizeWeaponMods(
                    weaponMods,
                    { forceUnselected: true }
                ),

            totals:
                this.resolvePreparationTotals({

                    base:
                        normalizedBase,

                    sources:
                        normalizedSources,

                    difficulty:
                        resolvedDifficulty,

                    modifiers,

                    stressForBonus:
                        normalizedStressForBonus

                })

        };

    }


    /**
     * Recalcule les totaux après modification
     * des valeurs / cases à cocher.
     */
    static resolveTotals(
        modifiers = []
    ) {

        return {

            total:
                getActionModifierTotal(
                    modifiers
                ),

            bonus:
                getActionBonusTotal(
                    modifiers
                ),

            penalty:
                getActionPenaltyTotal(
                    modifiers
                )

        };

    }


    /**
     * Calcule le résumé complet d'une préparation.
     *
     * Cette méthode alimente à terme la zone
     * "Pool de dés" non éditable du dialogue.
     */
    static resolvePreparationTotals
    ({

        base = {},

        sources = [],

        difficulty =
            ACTION_DIFFICULTIES.average,

        modifiers = [],

        stressForBonus = false

    } = {}) {

        const attribute =
            normalizeNumber(
                base.attribute
            );


        const skill =
            normalizeNumber(
                base.skill
            );


        const stress =
            normalizeNumber(
                base.stress
            );


        const weapon =
            getActionSourceTotalByType(
                sources,
                ACTION_MODIFIER_SOURCES.WEAPON
            );


        const equipment =
            getActionSourceTotalByType(
                sources,
                ACTION_MODIFIER_SOURCES.EQUIPMENT
            );


        const talent =
            getActionSourceTotalByType(
                sources,
                ACTION_MODIFIER_SOURCES.TALENT
            );


        const difficultyModifier =
            normalizeNumber(
                difficulty?.modifier
            );


        const modifier =
            getActionModifierTotal(
                modifiers
            );


        const sourcesTotal =
            weapon
            + equipment
            + talent;


        /*
        * « Subir 1 Stress pour +3 » (livre, p.190, cf.
        * createPreparation ci-dessus) : +3 au pool, et un dé de
        * Stress supplémentaire pour ce jet uniquement (non
        * persisté ici sur l'Actor).
        */
        const normalizedStressForBonus =
            normalizeBoolean(
                stressForBonus,
                false
            );

        const stressBonus =
            normalizedStressForBonus
                ? 3
                : 0;

        const extraStressDie =
            normalizedStressForBonus
                ? 1
                : 0;


        const dicePool =
            Math.max(
                0,

                attribute
                + skill
                + stress
                + sourcesTotal
                + difficultyModifier
                + modifier
                + stressBonus
                + extraStressDie
            );


        return {

            attribute,

            skill,

            stress,

            weapon,

            equipment,

            talent,

            sources:
                sourcesTotal,

            difficulty:
                difficultyModifier,

            modifier,

            stressForBonus:
                normalizedStressForBonus,

            stressBonus,

            extraStressDie,

            /*
            * Anciennes informations toujours disponibles.
            */
            bonus:
                getActionBonusTotal(
                    modifiers
                ),

            penalty:
                getActionPenaltyTotal(
                    modifiers
                ),

            /*
            * Résultat informatif final.
            */
            dicePool

        };

    }



/**
 * Produit la forme finale figée
 * transmise au resolver appelant.
 *
 * Le contrat historique est conservé
 * pendant la migration :
 *
 * - modifiers ;
 * - specialEffects ;
 * - total ;
 * - bonus ;
 * - penalty.
 *
 * Le nouveau contrat universel ajoute :
 *
 * - base ;
 * - sources ;
 * - difficulty ;
 * - totals.
 */
static resolvePreparation(
    preparation
) {

    if (
        !preparation
        || typeof preparation !== "object"
    ) {

        throw new TypeError(
            "Une préparation d'action est requise."
        );

    }


    const modifiers =
        Array.isArray(
            preparation.modifiers
        )
            ? preparation.modifiers
            : [];


    const sources =
        Array.isArray(
            preparation.sources
        )
            ? preparation.sources
            : [];


    const base = {

        attribute:
            normalizeNumber(
                preparation.base?.attribute
            ),

        skill:
            normalizeNumber(
                preparation.base?.skill
            ),

        stress:
            normalizeNumber(
                preparation.base?.stress
            )

    };


    const stressForBonus =
        normalizeBoolean(
            preparation.stressForBonus,
            false
        );


    const difficulty =
        (
            preparation.difficulty
            && typeof preparation.difficulty
                === "object"
        )
            ? {
                ...preparation.difficulty
            }
            : {
                ...ACTION_DIFFICULTIES.average
            };


    const selectedModifiers =
        getSelectedActionModifiers(
            modifiers
        );


    /*
     * Une source verrouillée reste nécessairement
     * sélectionnée dans la résolution finale.
     *
     * Cela constitue une sécurité métier supplémentaire
     * indépendamment de l'interface.
     */
    const normalizedSources =
        sources.map(
            source => ({

                ...source,

                selected:
                    source?.locked === true
                    || source?.selected === true,

                metadata: {
                    ...(source?.metadata ?? {})
                }

            })
        );


    const selectedSources =
        normalizedSources.filter(
            source =>
                source.selected === true
        );


    /*
     * Améliorations d'arme (weaponMod) : jamais de bonus chiffré,
     * jamais sélectionnées automatiquement. selectedWeaponMods
     * est ce que les appelants (ex. CharacterSheet, après
     * résolution du jet) utilisent pour décompter une éventuelle
     * ressource consommée.
     */
    const normalizedWeaponMods =
        normalizeWeaponMods(
            preparation.weaponMods
        );


    const selectedWeaponMods =
        normalizedWeaponMods.filter(
            weaponMod =>
                weaponMod.selected === true
        );


    /*
     * Résumé universel du pool.
     *
     * IMPORTANT :
     * Stress reste identifié séparément dans totals
     * même s'il contribue au total informatif dicePool.
     */
    const preparationTotals =
        this.resolvePreparationTotals({

            base,

            sources:
                normalizedSources,

            difficulty,

            modifiers,

            stressForBonus

        });


    /*
     * Ancien total des ActionModifier.
     *
     * Conservé pour ne pas casser les workflows
     * historiques pendant la migration.
     */
    const modifierTotals =
        this.resolveTotals(
            modifiers
        );


    /*
     * Un effet spécial de talent n'est actif
     * que si le modificateur correspondant
     * au talent est lui-même sélectionné.
     *
     * Comportement historique conservé.
     */
    const selectedTalentKeys =
        new Set(
            selectedModifiers

                .filter(
                    modifier =>
                        modifier.source
                            === ACTION_MODIFIER_SOURCES
                                .TALENT
                )

                .map(
                    modifier =>
                        modifier.metadata
                            ?.talentKey
                )

                .filter(Boolean)
        );


    const specialEffects =
        (
            preparation.specialEffects
            ?? []
        )
            .filter(
                entry =>
                    selectedTalentKeys.has(
                        entry.talentKey
                    )
            )
            .map(
                entry => ({

                    ...entry,

                    effect: {
                        ...(entry.effect ?? {})
                    }

                })
            );


    return {

        context:
            preparation.context
            ?? null,


        /*
         * Nouveau contrat universel.
         */
        base,

        /*
         * « Subir 1 Stress pour +3 » (livre, p.190) : répété ici
         * en plus de totals.stressForBonus pour un accès direct
         * par les workflows appelants (ex. _onSkillRoll).
         */
        stressForBonus,

        sources:
            normalizedSources,

        selectedSources,

        /*
         * Améliorations d'arme proposées pour l'arme impliquée
         * dans ce jet (cf. normalizeWeaponMod ci-dessus). Jamais
         * de bonus chiffré : purement informatif/narratif.
         */
        weaponMods:
            normalizedWeaponMods,

        selectedWeaponMods,

        difficulty,

        totals:
            preparationTotals,


        /*
         * Contrat historique conservé.
         */
        modifiers:
            selectedModifiers.map(
                modifier => ({

                    ...modifier,

                    metadata: {
                        ...(modifier.metadata ?? {})
                    }

                })
            ),

        specialEffects,

        total:
            modifierTotals.total,

        bonus:
            modifierTotals.bonus,

        penalty:
            modifierTotals.penalty

    };

}


}