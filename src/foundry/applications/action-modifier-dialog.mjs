/**
 * Fenêtre générique de préparation d'une résolution d'action.
 *
 * Entrée :
 *   ActionModifierService.createPreparation(...)
 *
 * Sortie :
 *   ActionModifierService.resolvePreparation(...)
 *
 * Convention de workflow :
 *
 * - X / Annuler :
 *     ferme la fenêtre ;
 *     ne modifie pas le workflow.
 *
 * - validation invalide :
 *     affiche l'erreur ;
 *     garde la fenêtre ouverte.
 *
 * - validation valide :
 *     retourne la résolution ;
 *     ferme la fenêtre ;
 *     le workflow appelant peut avancer.
 *
 * Cette fenêtre :
 * - n'applique aucune règle de combat ;
 * - ne lance aucun jet ;
 * - ne consomme aucune action ;
 * - ne connaît ni attaque, ni blocage.
 */


import {
    ActionModifierService,
    ACTION_MODIFIER_SOURCES,
    ACTION_DIFFICULTIES
} from "../../action-resolution/action-modifier-service.mjs";


import {
    TALENT_EFFECT_TYPES
} from "../../domain/rules/talents.mjs";


function escapeHTML(
    value
) {

    return foundry.utils.escapeHTML(
        String(
            value ?? ""
        )
    );

}


function normalizeNumber(
    value
) {

    const number =
        Number(value);


    return Number.isFinite(number)
        ? number
        : 0;

}


function clonePreparation(
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


    return {

        ...preparation,

        context: {
            ...(preparation.context ?? {}),

            facts: {
                ...(preparation.context?.facts ?? {})
            },

            metadata: {
                ...(preparation.context?.metadata ?? {})
            },

            weapon:
                preparation.context?.weapon
                    ? {
                        ...preparation.context.weapon
                    }
                    : null
        },


        base: {
            ...(preparation.base ?? {})
        },


        sources:
            (
                preparation.sources
                ?? []
            )
                .map(
                    source => ({

                        ...source,

                        metadata: {
                            ...(source.metadata ?? {})
                        }

                    })
                ),


        difficulty:
            preparation.difficulty
                ? {
                    ...preparation.difficulty
                }
                : null,


        totals: {
            ...(preparation.totals ?? {})
        },


        modifiers:
            (
                preparation.modifiers
                ?? []
            )
                .map(
                    modifier => ({

                        ...modifier,

                        metadata: {
                            ...(modifier.metadata ?? {})
                        }

                    })
                ),


        specialEffects:
            (
                preparation.specialEffects
                ?? []
            )
                .map(
                    entry => ({

                        ...entry,

                        effect: {
                            ...(entry.effect ?? {})
                        }

                    })
                ),


        /*
         * Améliorations d'arme (weaponMod) proposées pour l'arme
         * impliquée dans ce jet. Purement informatif : jamais de
         * bonus chiffré (cf. ActionModifierService).
         */
        weaponMods:
            (
                preparation.weaponMods
                ?? []
            )
                .map(
                    weaponMod => ({
                        ...weaponMod
                    })
                )

    };

}


/* ============================================================
 * LABELS
 * ============================================================ */


const ATTRIBUTE_LABELS =
    Object.freeze({

        vigor:
            "Vigueur",

        agility:
            "Agilité",

        spirit:
            "Esprit",

        empathy:
            "Empathie"

    });


const SKILL_LABELS =
    Object.freeze({

        repair:
            "Bricolage",

        closeCombat:
            "Corps à corps",

        endurance:
            "Endurance",

        stealth:
            "Discrétion",

        reaction:
            "Réaction",

        shooting:
            "Tir",

        comprehension:
            "Compréhension",

        observation:
            "Observation",

        survival:
            "Survie",

        analysis:
            "Analyse",

        manipulation:
            "Manipulation",

        medicine:
            "Médecine"

    });


function getAttributeLabel(
    attributeId
) {

    return (
        ATTRIBUTE_LABELS[
            attributeId
        ]
        ?? attributeId
        ?? "Attribut"
    );

}


function getSkillLabel(
    skillId
) {

    return (
        SKILL_LABELS[
            skillId
        ]
        ?? skillId
        ?? "Compétence"
    );

}


function getActionLabel(
    context
) {

    switch (
        context?.actionType
    ) {

        case "melee-block":
            return "Blocage";

        case "melee-attack":
            return "Attaque de mêlée";

        case "ranged-attack":
            return "Attaque à distance";

        case "attribute-roll":
            return `Jet de ${getAttributeLabel(
                context?.attribute
            )}`;

        case "skill-roll":
            return `Jet de ${getSkillLabel(
                context?.skill
            )}`;

        default:
            return "Résolution d'action";

    }

}


/**
 * « Subir 1 Stress pour +3 » (livre, p.190) s'applique à
 * « un jet d'attribut ou de compétence, quel qu'il soit ».
 *
 * L'Attaque de mêlée (rollMeleeAttack) et l'Attaque à distance
 * (rollRangedAttack) sont, mécaniquement, des jets de
 * compétence (Corps à corps / Tir) : l'option s'applique donc
 * aussi à elles. rollMeleeAttack et rollRangedAttack acceptent
 * désormais extraStressDie sur le même patron que
 * rollAttribute()/rollSkill() (pool de dés, puis persistance
 * post-résolution via addStress()).
 */
function supportsStressForBonus(
    context
) {

    return (
        context?.actionType === "skill-roll"
        || context?.actionType === "attribute-roll"
        || context?.actionType === "melee-attack"
        || context?.actionType === "ranged-attack"
    );

}


function getConditionLabel(
    conditionState
) {

    switch (
        conditionState
    ) {

        case "met":
            return "Condition remplie";

        case "unmet":
            return "Condition non remplie";

        case "unknown":
            return "Condition à confirmer";

        default:
            return "";

    }

}


function getSourceTypeLabel(
    sourceType
) {

    switch (
        sourceType
    ) {

        case ACTION_MODIFIER_SOURCES.WEAPON:
            return "Arme";

        case ACTION_MODIFIER_SOURCES.EQUIPMENT:
            return "Outil";

        case ACTION_MODIFIER_SOURCES.TALENT:
            return "Talent";

        case ACTION_MODIFIER_SOURCES.CIRCUMSTANCE:
            return "Circonstance";

        case ACTION_MODIFIER_SOURCES.EFFECT:
            return "Effet";

        default:
            return "Bonus";

    }

}


/* ============================================================
 * CONTENU
 * ============================================================ */


function createSourceRow(
    source,
    index
) {

    const checked =
        source.selected
            ? "checked"
            : "";


    const disabled =
        source.locked
            ? "disabled"
            : "";


    const bonus =
        normalizeNumber(
            source.bonus
        );


    const bonusHTML =
        source.type
            === ACTION_MODIFIER_SOURCES.WEAPON

            ? `
                <input
                    type="number"
                    name="source.${index}.bonus"
                    value="${bonus}"
                    step="1"
                    class="action-source-bonus-input"
                />
            `

            : `
                <span
                    class="action-source-bonus-value"
                >
                    ${bonus >= 0 ? "+" : ""}${bonus}
                </span>
            `;


    return `
        <div
            class="metro2033 action-source-row"
            data-source-index="${index}"
        >

            <div
                class="action-source-selection"
            >

                <input
                    type="checkbox"
                    name="source.${index}.selected"
                    ${checked}
                    ${disabled}
                />

            </div>

            <div
                class="action-source-description"
            >

                <strong>
                    ${escapeHTML(source.label)}
                </strong>

                <small>
                    ${escapeHTML(
                        getSourceTypeLabel(
                            source.type
                        )
                    )}
                </small>

            </div>

            <div
                class="action-source-value"
            >

                ${bonusHTML}

            </div>

        </div>
    `;

}


function createModifierRow(
    modifier,
    index
) {

    /*
     * Les modificateurs manuels sont affichés
     * sous la forme d'un seul champ signé
     * dans la section Ajustements.
     */
    if (
        modifier.source
            === ACTION_MODIFIER_SOURCES.MANUAL
    ) {

        return "";

    }


    const checked =
        modifier.selected
            ? "checked"
            : "";


    const conditionLabel =
        getConditionLabel(
            modifier.conditionState
        );


    const conditionHTML =
        conditionLabel
            ? `
                <small
                    class="modifier-condition"
                >
                    ${escapeHTML(conditionLabel)}
                </small>
            `
            : "";


    const value =
        normalizeNumber(
            modifier.value
        );


    return `
        <div
            class="metro2033 action-modifier-row"
            data-modifier-index="${index}"
        >

            <div
                class="action-modifier-selection"
            >

                <input
                    type="checkbox"
                    name="modifier.${index}.selected"
                    ${checked}
                />

            </div>

            <div
                class="action-modifier-description"
            >

                <strong>
                    ${escapeHTML(
                        modifier.label
                    )}
                </strong>

                <small>
                    ${escapeHTML(
                        getSourceTypeLabel(
                            modifier.source
                        )
                    )}
                </small>

                ${conditionHTML}

            </div>

            <div
                class="action-modifier-value"
            >

                <span>
                    ${value >= 0 ? "+" : ""}${value}
                </span>

            </div>

        </div>
    `;

}


function getManualModifierValue(
    preparation
) {

    return (
        preparation.modifiers
        ?? []
    )
        .filter(
            modifier =>
                modifier.source
                    === ACTION_MODIFIER_SOURCES
                        .MANUAL
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


function createDifficultyOptions(
    preparation
) {

    const selectedId =
        preparation.difficulty?.id
        ?? "average";


    return Object.values(
        ACTION_DIFFICULTIES
    )
        .map(
            difficulty => {

                const selected =
                    difficulty.id
                        === selectedId
                        ? "selected"
                        : "";


                const modifier =
                    normalizeNumber(
                        difficulty.modifier
                    );


                return `
                    <option
                        value="${escapeHTML(
                            difficulty.id
                        )}"
                        ${selected}
                    >
                        ${escapeHTML(
                            difficulty.label
                        )}
                        (${modifier >= 0 ? "+" : ""}${modifier})
                    </option>
                `;

            }
        )
        .join("");

}


function createSpecialEffectsContent(
    preparation
) {

    const effects =
        (
            preparation.specialEffects
            ?? []
        )
            /*
             * L'échange d'Attribut (Esquive, Sens du danger,
             * Menaçant) a sa propre case à cocher dédiée
             * (section « Valeurs du test ») : il n'a pas besoin
             * d'être répété ici.
             */
            .filter(
                entry =>
                    entry.effect?.type
                        !== TALENT_EFFECT_TYPES
                            .ATTRIBUTE_SWAP
            );


    if (
        effects.length === 0
    ) {

        return `
            <p
                class="action-special-effects-empty"
            >
                Aucun effet spécial.
            </p>
        `;

    }


    const rows =
        effects.map(
            entry => {

                const talentLabel =
                    escapeHTML(
                        entry.talentLabel
                        ?? entry.talentKey
                        ?? "Talent"
                    );


                const effectType =
                    escapeHTML(
                        entry.effect?.type
                        ?? "effet"
                    );


                return `
                    <li>
                        <strong>
                            ${talentLabel}
                        </strong>
                        :
                        ${effectType}
                    </li>
                `;

            }
        )
        .join("");


    return `
        <ul
            class="action-special-effects-list"
        >
            ${rows}
        </ul>
    `;

}


/**
 * Rend la section « Améliorations d'arme » de la fenêtre de
 * préparation.
 *
 * IMPORTANT :
 *
 * - une case à cocher par Amélioration d'arme, NON cochée
 *   par défaut (preparation.weaponMods[i].selected === false
 *   à la création, cf. ActionModifierService.createPreparation) ;
 * - une info-bulle (data-tooltip, repli title) reprend le texte
 *   d'effet/bonus verbatim du livre ;
 * - cette section n'ajoute JAMAIS de bonus chiffré au jet : la
 *   sélection reste purement informative/narrative, gérée par
 *   le MJ à la table. Seule une éventuelle consommation de
 *   ressource (resourceId non vide) est appliquée, et seulement
 *   après résolution du jet, par l'appelant (CharacterSheet) ;
 * - des champs cachés portent itemId/uuid/resourceId/
 *   resourceAmount pour permettre de retrouver ces informations
 *   à la soumission, en plus de la préparation en mémoire déjà
 *   indexée par ce même `index`.
 */
function createWeaponModsContent(
    preparation
) {

    const weaponMods =
        preparation.weaponMods
        ?? [];


    if (
        weaponMods.length === 0
    ) {

        return "";

    }


    const rows =
        weaponMods
            .map(
                (
                    weaponMod,
                    index
                ) => {

                    const description =
                        escapeHTML(
                            weaponMod.description
                        );


                    const checked =
                        weaponMod.selected
                            ? "checked"
                            : "";


                    return `
                        <div
                            class="metro2033 action-weapon-mod-row"
                            data-weapon-mod-index="${index}"
                        >

                            <label
                                class="action-weapon-mod-selection"
                                data-tooltip="${description}"
                                title="${description}"
                            >

                                <input
                                    type="checkbox"
                                    name="weaponMod.${index}.selected"
                                    ${checked}
                                />

                                <strong>
                                    ${escapeHTML(weaponMod.name)}
                                </strong>

                            </label>


                            <input
                                type="hidden"
                                name="weaponMod.${index}.itemId"
                                value="${escapeHTML(weaponMod.id)}"
                            />

                            <input
                                type="hidden"
                                name="weaponMod.${index}.uuid"
                                value="${escapeHTML(weaponMod.uuid)}"
                            />

                            <input
                                type="hidden"
                                name="weaponMod.${index}.resourceId"
                                value="${escapeHTML(weaponMod.resourceId)}"
                            />

                            <input
                                type="hidden"
                                name="weaponMod.${index}.resourceAmount"
                                value="${normalizeNumber(weaponMod.resourceAmount)}"
                            />

                        </div>
                    `;

                }
            )
            .join("");


    return `
        <section
            class="action-preparation-section action-weapon-mods-section"
        >

            <h3>
                Améliorations d'arme
            </h3>

            <div
                class="action-weapon-mod-list"
            >
                ${rows}
            </div>

        </section>
    `;

}


function createDialogContent(
    preparation
) {

    const context =
        preparation.context
        ?? {};


    const actionLabel =
        getActionLabel(
            context
        );


    const sourceRows =
        (
            preparation.sources
            ?? []
        )
            .map(
                (
                    source,
                    index
                ) =>
                    createSourceRow(
                        source,
                        index
                    )
            )
            .join("");


    const modifierRows =
        (
            preparation.modifiers
            ?? []
        )
            .map(
                (
                    modifier,
                    index
                ) =>
                    createModifierRow(
                        modifier,
                        index
                    )
            )
            .join("");


    const bonusContent =
        (
            sourceRows
            || modifierRows
        )
            ? `
                ${sourceRows}
                ${modifierRows}
            `
            : `
                <p>
                    Aucun bonus applicable.
                </p>
            `;


    const attributeLabel =
        getAttributeLabel(
            context.attribute
        );


    const skillLabel =
        getSkillLabel(
            context.skill
        );


    const hasSkill =
        typeof context.skill === "string"
        && context.skill.length > 0;


    const manualModifier =
        getManualModifierValue(
            preparation
        );


    const totals =
        preparation.totals
        ?? {};


    return `
        <div
            class="metro2033 action-modifier-dialog"
        >

            <p
                class="action-preparation-title"
            >
                Préparation :
                <strong>
                    ${escapeHTML(actionLabel)}
                </strong>
            </p>


            <div
                class="action-preparation-grid"
            >

                <section
                    class="action-preparation-section action-base-section"
                >

                    <h3>
                        Valeurs du test
                    </h3>


                    <label>

                        <span
                            data-attribute-label
                        >
                            ${escapeHTML(attributeLabel)}
                        </span>

                        <input
                            type="number"
                            name="base.attribute"
                            value="${normalizeNumber(
                                preparation.base?.attribute
                            )}"
                            min="0"
                            step="1"
                        />

                    </label>


                    ${
                        preparation.attributeSwap
                            ? `
                                <label
                                    class="action-attribute-swap"
                                >

                                    <input
                                        type="checkbox"
                                        name="attributeSwap"
                                        data-attribute-swap
                                        data-default-value="${normalizeNumber(
                                            preparation.base?.attribute
                                        )}"
                                        data-swap-value="${normalizeNumber(
                                            preparation.attributeSwap.value
                                        )}"
                                        data-default-label="${escapeHTML(
                                            attributeLabel
                                        )}"
                                        data-swap-label="${escapeHTML(
                                            getAttributeLabel(
                                                preparation.attributeSwap.attribute
                                            )
                                        )}"
                                        ${
                                            preparation.attributeSwap.selected
                                                ? "checked"
                                                : ""
                                        }
                                    />

                                    <span>
                                        ${escapeHTML(
                                            preparation.attributeSwap.talentLabel
                                        )}
                                        : utiliser
                                        ${escapeHTML(
                                            getAttributeLabel(
                                                preparation.attributeSwap.attribute
                                            )
                                        )}
                                        (${normalizeNumber(
                                            preparation.attributeSwap.value
                                        )})
                                        au lieu de
                                        ${escapeHTML(attributeLabel)}
                                        (${normalizeNumber(
                                            preparation.base?.attribute
                                        )})
                                    </span>

                                </label>
                            `
                            : ""
                    }


                    ${
                        hasSkill
                            ? `
                                <label>

                                    <span>
                                        ${escapeHTML(skillLabel)}
                                    </span>

                                    <input
                                        type="number"
                                        name="base.skill"
                                        value="${normalizeNumber(
                                            preparation.base?.skill
                                        )}"
                                        min="0"
                                        step="1"
                                    />

                                </label>
                            `
                            : ""
                    }


                    <div
                        class="action-base-stress"
                    >

                        <span>
                            Stress
                        </span>

                        <strong>
                            ${normalizeNumber(
                                preparation.base?.stress
                            )}
                        </strong>

                    </div>

                </section>


                <section
                    class="action-preparation-section action-sources-section"
                >

                    <h3>
                        Bonus applicables
                    </h3>

                    <div
                        class="action-source-list"
                    >
                        ${bonusContent}
                    </div>

                </section>


                <section
                    class="action-preparation-section action-adjustments-section"
                >

                    <h3>
                        Ajustements
                    </h3>


                    <label>

                        <span>
                            Modificateur
                        </span>

                        <input
                            type="number"
                            name="manual.modifier"
                            value="${manualModifier}"
                            step="1"
                        />

                    </label>


                    <label>

                        <span>
                            Difficulté
                        </span>

                        <select
                            name="difficulty"
                        >
                            ${createDifficultyOptions(
                                preparation
                            )}
                        </select>

                    </label>


                    ${
                        supportsStressForBonus(context)
                            ? `
                                <label
                                    class="action-stress-for-bonus-option"
                                >

                                    <input
                                        type="checkbox"
                                        name="stressForBonus"
                                        ${
                                            preparation.stressForBonus
                                                ? "checked"
                                                : ""
                                        }
                                    />

                                    <span>
                                        Subir 1 Stress pour +3 dés
                                    </span>

                                </label>
                            `
                            : ""
                    }

                </section>


                <section
                    class="action-preparation-section action-special-effects-section"
                >

                    <h3>
                        Effets spéciaux
                    </h3>

                    ${createSpecialEffectsContent(
                        preparation
                    )}

                </section>


                ${createWeaponModsContent(
                    preparation
                )}

            </div>


            <section
                class="action-preparation-summary"
            >

                <h3>
                    Résumé
                </h3>

                <div>
                    <span>
                        Attribut
                    </span>

                    <strong
                        data-summary="attribute"
                    >
                        ${normalizeNumber(
                            totals.attribute
                        )}
                    </strong>
                </div>

                <div>
                    <span>
                        Compétence
                    </span>

                    <strong
                        data-summary="skill"
                    >
                        ${normalizeNumber(
                            totals.skill
                        )}
                    </strong>
                </div>

                <div>
                    <span>
                        Arme / Outil
                    </span>

                    <strong
                        data-summary="equipment"
                    >
                        ${
                            normalizeNumber(
                                totals.weapon
                            )
                            +
                            normalizeNumber(
                                totals.equipment
                            )
                        }
                    </strong>
                </div>

                <div>
                    <span>
                        Talents
                    </span>

                    <strong
                        data-summary="talent"
                    >
                        ${normalizeNumber(
                            totals.talent
                        )}
                    </strong>
                </div>

                <div>
                    <span>
                        Stress
                    </span>

                    <strong
                        data-summary="stress"
                    >
                        ${
                            normalizeNumber(
                                totals.stress
                            )
                            +
                            normalizeNumber(
                                totals.extraStressDie
                            )
                        }
                    </strong>
                </div>

                <div>
                    <span>
                        Stress → +3
                    </span>

                    <strong
                        data-summary="stressBonus"
                    >
                        ${normalizeNumber(
                            totals.stressBonus
                        )}
                    </strong>
                </div>

                <div>
                    <span>
                        Difficulté
                    </span>

                    <strong
                        data-summary="difficulty"
                    >
                        ${normalizeNumber(
                            totals.difficulty
                        )}
                    </strong>
                </div>

                <div>
                    <span>
                        Modificateur
                    </span>

                    <strong
                        data-summary="modifier"
                    >
                        ${normalizeNumber(
                            totals.modifier
                        )}
                    </strong>
                </div>


                <div
                    class="action-preparation-total"
                >

                    <span>
                        Pool total
                    </span>

                    <strong
                        data-summary="dicePool"
                    >
                        ${normalizeNumber(
                            totals.dicePool
                        )}
                    </strong>

                </div>

            </section>

        </div>
    `;

}


/* ============================================================
 * LECTURE DU FORMULAIRE
 * ============================================================ */


function applyFormToPreparation(
    preparation,
    form
) {

    /*
     * Valeurs fondamentales.
     */
    const attributeInput =
        form.elements[
            "base.attribute"
        ];


    const skillInput =
        form.elements[
            "base.skill"
        ];


    /*
     * Attribut alternatif (Esquive, Sens du danger, Menaçant) :
     * un effet « au choix », jamais automatique. La case à
     * cocher écrit directement la valeur du bon Attribut dans
     * le champ numérique existant (cf. activateLivePreparation),
     * ce qui suffit à ce que tout le reste du calcul (totaux,
     * actor.rollSkill/rollAttribute) l'utilise sans changement
     * supplémentaire.
     */
    const attributeSwapInput =
        form.elements[
            "attributeSwap"
        ];


    if (
        preparation.attributeSwap
    ) {

        preparation.attributeSwap.selected =
            attributeSwapInput?.checked
                === true;

    }


    preparation.base.attribute =
        normalizeNumber(
            attributeInput?.value
        );


    if (skillInput) {

        preparation.base.skill =
            normalizeNumber(
                skillInput.value
            );

    }


    /*
     * Sources métier.
     */
    (
        preparation.sources
        ?? []
    )
        .forEach(
            (
                source,
                index
            ) => {

                const selectedInput =
                    form.elements[
                        `source.${index}.selected`
                    ];


                const bonusInput =
                    form.elements[
                        `source.${index}.bonus`
                    ];


                source.selected =
                    (
                        source.locked === true
                        || selectedInput?.checked === true
                    );


                if (
                    bonusInput
                    && source.type
                        === ACTION_MODIFIER_SOURCES
                            .WEAPON
                ) {

                    source.bonus =
                        normalizeNumber(
                            bonusInput.value
                        );

                }

            }
        );


    /*
     * Modificateurs non manuels.
     */
    (
        preparation.modifiers
        ?? []
    )
        .forEach(
            (
                modifier,
                index
            ) => {

                if (
                    modifier.source
                        === ACTION_MODIFIER_SOURCES
                            .MANUAL
                ) {

                    return;

                }


                const selectedInput =
                    form.elements[
                        `modifier.${index}.selected`
                    ];


                modifier.selected =
                    selectedInput?.checked
                        === true;

            }
        );


    /*
     * Champ manuel signé unique.
     *
     * L'ancien contrat interne bonus/pénalité
     * est conservé.
     */
    const manualValue =
        normalizeNumber(
            form.elements[
                "manual.modifier"
            ]?.value
        );


    const manualBonus =
        (
            preparation.modifiers
            ?? []
        )
            .find(
                modifier =>
                    modifier.source
                        === ACTION_MODIFIER_SOURCES
                            .MANUAL

                    && modifier.metadata?.kind
                        === "bonus"
            );


    const manualPenalty =
        (
            preparation.modifiers
            ?? []
        )
            .find(
                modifier =>
                    modifier.source
                        === ACTION_MODIFIER_SOURCES
                            .MANUAL

                    && modifier.metadata?.kind
                        === "penalty"
            );


    if (manualBonus) {

        manualBonus.selected =
            true;

        manualBonus.value =
            Math.max(
                0,
                manualValue
            );

    }


    if (manualPenalty) {

        manualPenalty.selected =
            true;

        manualPenalty.value =
            Math.min(
                0,
                manualValue
            );

    }


    /*
     * Améliorations d'arme (weaponMod).
     *
     * Purement informatif : la sélection ne modifie jamais
     * totals (aucun bonus chiffré). Seul son état sélectionné
     * est lu ici, pour être consommé après résolution du jet
     * par l'appelant (ex. CharacterSheet, même timing que
     * stressForBonus / addStress()).
     */
    (
        preparation.weaponMods
        ?? []
    )
        .forEach(
            (
                weaponMod,
                index
            ) => {

                const selectedInput =
                    form.elements[
                        `weaponMod.${index}.selected`
                    ];


                weaponMod.selected =
                    selectedInput?.checked
                        === true;

            }
        );


    /*
     * Difficulté.
     */
    const difficultyId =
        form.elements[
            "difficulty"
        ]?.value;


    preparation.difficulty = {

        ...(
            ACTION_DIFFICULTIES[
                difficultyId
            ]
            ?? ACTION_DIFFICULTIES.average
        )

    };


    /*
     * « Subir 1 Stress pour +3 » (livre, p.190).
     */
    preparation.stressForBonus =
        form.elements[
            "stressForBonus"
        ]?.checked
            === true;


    /*
     * Totaux live.
     */
    preparation.totals =
        ActionModifierService
            .resolvePreparationTotals({

                base:
                    preparation.base,

                sources:
                    preparation.sources,

                difficulty:
                    preparation.difficulty,

                modifiers:
                    preparation.modifiers,

                stressForBonus:
                    preparation.stressForBonus

            });


    return preparation;

}

function updateSummary(
    preparation,
    root
) {

    const totals =
        preparation.totals
        ?? {};


    const values = {

        attribute:
            totals.attribute,

        skill:
            totals.skill,

        equipment:
            normalizeNumber(
                totals.weapon
            )
            +
            normalizeNumber(
                totals.equipment
            ),

        talent:
            totals.talent,

        stress:
            normalizeNumber(
                totals.stress
            )
            +
            normalizeNumber(
                totals.extraStressDie
            ),

        stressBonus:
            totals.stressBonus,

        difficulty:
            totals.difficulty,

        modifier:
            totals.modifier,

        dicePool:
            totals.dicePool

    };


    for (
        const [
            key,
            value
        ]
        of Object.entries(
            values
        )
    ) {

        const element =
            root.querySelector(
                `[data-summary="${key}"]`
            );


        if (!element) {

            continue;

        }


        element.textContent =
            String(
                normalizeNumber(
                    value
                )
            );

    }

}


function activateLivePreparation(
    preparation,
    dialog
) {

    const root =
        dialog.element
            ?.querySelector(
                ".action-modifier-dialog"
            );


    if (!root) {

        return;

    }


    const form =
        root.closest(
            "form"
        )
        ?? dialog.element
            ?.querySelector(
                "form"
            );


    if (!form) {

        return;

    }


    /*
     * Évite un double binding si Foundry
     * rerend le Dialog.
     */
    if (
        root.dataset
            .metroPreparationBound
        === "true"
    ) {

        return;

    }


    root.dataset
        .metroPreparationBound =
            "true";


    const syncAttributeSwap =
        () => {

            const swapInput =
                root.querySelector(
                    "[data-attribute-swap]"
                );


            if (!swapInput) {

                return;

            }


            const attributeInput =
                form.elements[
                    "base.attribute"
                ];

            const attributeLabelElement =
                root.querySelector(
                    "[data-attribute-label]"
                );


            const checked =
                swapInput.checked
                    === true;


            if (attributeInput) {

                attributeInput.value =
                    checked
                        ? swapInput.dataset
                            .swapValue
                        : swapInput.dataset
                            .defaultValue;

            }


            if (attributeLabelElement) {

                attributeLabelElement
                    .textContent =
                        checked
                            ? swapInput.dataset
                                .swapLabel
                            : swapInput.dataset
                                .defaultLabel;

            }

        };


    const refresh =
        () => {

            syncAttributeSwap();


            applyFormToPreparation(
                preparation,
                form
            );


            updateSummary(
                preparation,
                root
            );

        };


    root.addEventListener(
        "input",
        refresh
    );


    root.addEventListener(
        "change",
        refresh
    );


    refresh();

}


/* ============================================================
 * DIALOG
 * ============================================================ */


export class ActionModifierDialog {


    /**
     * Ouvre la fenêtre.
     *
     * Retour :
     *
     * - résolution finale si validée ;
     * - null si Annuler ou X.
     *
     * Une erreur de validation ne résout PAS
     * la Promise et ne ferme PAS la fenêtre.
     */
    static async prompt(
        preparation,
        {
            title = null,
            confirmLabel = "Valider",
            cancelLabel = "Annuler"
        } = {}
    ) {

        const workingPreparation =
            clonePreparation(
                preparation
            );


        const actionLabel =
            getActionLabel(
                workingPreparation
                    .context
            );


        const content =
            createDialogContent(
                workingPreparation
            );


        return new Promise(
            resolve => {

                let settled =
                    false;


                /*
                 * Garantit qu'une fermeture après validation
                 * ne transforme pas ensuite le résultat en null.
                 */
                const finish =
                    value => {

                        if (settled) {

                            return;

                        }


                        settled =
                            true;


                        resolve(
                            value
                        );

                    };


                const dialog =
                    new foundry.applications.api
                        .DialogV2({

                            /*
                             * Rattache cette fenêtre au chrome
                             * Métro commun (bandeau d'en-tête
                             * rouge) — voir le sélecteur
                             * :is(...) de metro-base.css.
                             */
                            classes: [
                                "metro-action-preparation-dialog"
                            ],


                            window: {

                                title:
                                    title
                                    ?? actionLabel

                            },


                            /*
                             * IMPORTANT :
                             *
                             * aucun bouton de formulaire
                             * ne ferme automatiquement
                             * la fenêtre.
                             *
                             * Nous contrôlons explicitement
                             * sa fermeture ci-dessous.
                             */
                            form: {

                                closeOnSubmit:
                                    false

                            },


                            content,


                            buttons: [

                                {

                                    action:
                                        "cancel",

                                    label:
                                        cancelLabel,

                                    callback:
                                        async (
                                            event,
                                            button,
                                            currentDialog
                                        ) => {

                                            /*
                                             * Annulation :
                                             *
                                             * aucun état métier
                                             * n'est retourné.
                                             */
                                            finish(
                                                null
                                            );


                                            await currentDialog
                                                .close();


                                            return null;

                                        }

                                },

                                {

                                    action:
                                        "confirm",

                                    label:
                                        confirmLabel,

                                    default:
                                        true,

                                    callback:
                                        async (
                                            event,
                                            button,
                                            currentDialog
                                        ) => {

                                            const form =
                                                button.form;


                                            if (!form) {

                                                ui.notifications.error(
                                                    "Le formulaire de préparation est introuvable."
                                                );


                                                /*
                                                 * Validation invalide :
                                                 * la fenêtre reste ouverte.
                                                 */
                                                return null;

                                            }


                                            try {

                                                /*
                                                 * On travaille uniquement
                                                 * sur la copie locale.
                                                 *
                                                 * Tant que la validation
                                                 * n'a pas réussi, rien
                                                 * n'est transmis au workflow.
                                                 */
                                                applyFormToPreparation(
                                                    workingPreparation,
                                                    form
                                                );


                                                const result =
                                                    ActionModifierService
                                                        .resolvePreparation(
                                                            workingPreparation
                                                        );


                                                /*
                                                 * Validation réussie :
                                                 *
                                                 * 1. résultat retourné ;
                                                 * 2. fermeture explicite.
                                                 */
                                                finish(
                                                    result
                                                );


                                                await currentDialog
                                                    .close();


                                                return result;

                                            }
                                            catch (error) {

                                                console.error(
                                                    "METRO2033 | Validation de la préparation impossible.",
                                                    error
                                                );


                                                ui.notifications.error(
                                                    error?.message
                                                    ?? "La préparation est invalide."
                                                );


                                                /*
                                                 * IMPORTANT :
                                                 *
                                                 * pas de finish(...)
                                                 * pas de close()
                                                 *
                                                 * → la fenêtre reste ouverte.
                                                 */
                                                return null;

                                            }

                                        }

                                }

                            ]

                        });


                dialog.addEventListener(
                    "render",
                    () => {

                        activateLivePreparation(
                            workingPreparation,
                            dialog
                        );

                    }
                );
                
                
                
                /*
                 * X de la fenêtre :
                 *
                 * exactement la même sémantique
                 * que le bouton Annuler.
                 */
                dialog.addEventListener(
                    "close",
                    () => {

                        finish(
                            null
                        );

                    },
                    {
                        once:
                            true
                    }
                );


                dialog.render({
                    force:
                        true
                });

            }
        );

    }


}