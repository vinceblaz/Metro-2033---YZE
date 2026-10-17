/**
 * Assemblage pur (aucune dépendance à `foundry.*`) du modèle de
 * vue de l'Assistant de création de PNJ.
 *
 * Repris de l'Assistant de création de Personnage
 * (character-creation-wizard-view-model.mjs), avec les
 * différences suivantes, actées avec le porteur du projet le
 * 28/09/2026 (aucun process de création de PNJ dans le livre de
 * base — construit conjointement) :
 *  - Pas de Fierté/Honte/Liens avec les autres PJ (outils de
 *    roleplay entre PJ, sans objet pour un PNJ créé par le MJ) ;
 *  - Mêmes règles strictes de budget de points que pour un PJ
 *    (mêmes catégories d'âge, mêmes bornes d'archétype) — le MJ
 *    reste libre de saisir ce qu'il veut à chaque étape, mais
 *    l'assistant l'avertit comme pour un PJ si le budget n'est
 *    pas respecté ;
 *  - L'Archétype choisi sert au calcul (budgets, Talents
 *    proposés, texte d'équipement) mais n'est PAS persisté comme
 *    Item Archétype sur le PNJ final : `NpcDataModel` ne prévoit
 *    volontairement aucun champ Archétype. Il est simplement
 *    noté en texte dans `system.identity.role`, à l'identique de
 *    la convention déjà utilisée pour les PNJ de Factions/
 *    Stations (cf. npc-creation-actor-builder.mjs).
 *
 * Étapes : archétype, âge, attributs, compétences, talents,
 * équipement, apparence, nom, puis un récapitulatif (« review »).
 *
 * Ce module ne modifie jamais l'Actor ni aucun Document
 * Foundry : il calcule seulement ce qu'il faut afficher et si
 * l'étape courante est valide.
 */

import { getArchetypeDefinition }
    from "../../domain/rules/archetypes.mjs";

import {
    resolveArchetypeAttributeKeys,
    resolveArchetypeSkillKeys,
    validateAttributeAllocation,
    validateSkillAllocation,
    validateStartingTalentSelection,
    getAttributePointsBudget,
    getSkillPointsBudget,
    ATTRIBUTE_KEYS,
    SKILL_KEYS
} from "../../domain/rules/character-creation.mjs";

export {
    randomizeAttributeAllocation,
    randomizeSkillAllocation,
    pickRandomTalents
} from "../../domain/rules/character-creation.mjs";

import { ARCHETYPES, GENERAL_TALENTS, ARCHETYPE_TALENTS }
    from "../../data/seed/talent-archetype-catalog.mjs";

import { SKILL_DEFINITIONS }
    from "../../domain/rules/skills.mjs";

import { resolveStartingTalentCatalogEntry }
    from "../../data/seed/npc-creation-actor-builder.mjs";

export { resolveStartingTalentCatalogEntry };


export const NPC_CREATION_STEPS = Object.freeze([
    "archetype", "age", "attributes", "skills", "talents",
    "equipment", "name",
    "review"
]);


const ATTRIBUTE_LABELS = Object.freeze({
    vigor: "Vigueur", agility: "Agilité", spirit: "Esprit", empathy: "Empathie"
});

const SKILL_LABELS = Object.freeze({
    repair: "Bricolage", closeCombat: "Corps à corps", endurance: "Endurance",
    stealth: "Furtivité", reaction: "Réaction", shooting: "Tir",
    comprehension: "Compréhension", observation: "Observation", survival: "Survie",
    analysis: "Analyse", manipulation: "Manipulation", medicine: "Soins"
});


/**
 * État initial (vierge) d'un brouillon de création de PNJ.
 */
export function createInitialNpcDraft() {

    return {
        step: 0,

        archetypeKey: "",
        soldierAttributeChoice: "",
        soldierSkillChoice: "",

        age: 25,

        attributes: Object.fromEntries(ATTRIBUTE_KEYS.map((key) => [key, 2])),
        skills: Object.fromEntries(SKILL_KEYS.map((key) => [key, 0])),

        talents: [],

        name: ""
    };
}


/**
 * Fusionne la définition canonique (archetypes.mjs) et la fiche
 * texte du livre (talent-archetype-catalog.mjs) pour un
 * archétype donné.
 */
export function getArchetypeChoices() {

    return ARCHETYPES.map((entry) => ({
        key: entry.key,
        name: entry.name,
        flavor: entry.flavor,
        attributeText: entry.attribute,
        skillsText: entry.skills,
        talentsText: entry.talents,
        startingEquipmentText: entry.startingEquipment
    }));
}


function getArchetypeTextEntry(archetypeKey) {
    return ARCHETYPES.find((entry) => entry.key === archetypeKey) ?? null;
}


function getAvailableTalentEntries(archetypeKey) {

    const archetypeTalentEntries = ARCHETYPE_TALENTS
        .filter((talent) => talent.archetypeId === archetypeKey);

    const generalTalentEntries = GENERAL_TALENTS;

    return { archetypeTalentEntries, generalTalentEntries };
}


/**
 * Construit le modèle de vue complet de l'assistant de création
 * de PNJ pour un brouillon donné.
 *
 * @param {object} draft Voir `createInitialNpcDraft()`.
 */
export function buildNpcCreationViewModel(draft) {

    const archetypeDefinition = getArchetypeDefinition(draft.archetypeKey);
    const archetypeText = getArchetypeTextEntry(draft.archetypeKey);

    const isSoldier = draft.archetypeKey === "soldier";

    const archetypeAttributeKeys = resolveArchetypeAttributeKeys(
        archetypeDefinition,
        draft.soldierAttributeChoice
    );

    const archetypeSkillKeys = resolveArchetypeSkillKeys(
        archetypeDefinition,
        [draft.soldierSkillChoice]
    );

    const attributeBudget = getAttributePointsBudget(draft.age);
    const skillBudget = getSkillPointsBudget(draft.age);

    const attributeValidation = validateAttributeAllocation({
        allocation: draft.attributes,
        age: draft.age,
        archetypeAttributes: archetypeAttributeKeys
    });

    const skillValidation = validateSkillAllocation({
        allocation: draft.skills,
        age: draft.age,
        archetypeSkills: archetypeSkillKeys
    });

    const { archetypeTalentEntries, generalTalentEntries } =
        getAvailableTalentEntries(draft.archetypeKey);

    const archetypeTalentNames = archetypeTalentEntries.map((talent) => talent.name);
    const generalTalentNames = generalTalentEntries.map((talent) => talent.name);

    const talentValidation = validateStartingTalentSelection({
        selected: draft.talents,
        archetypeTalentNames,
        generalTalentNames
    });

    const stepValidity = {
        archetype: Boolean(archetypeDefinition) && (!isSoldier || Boolean(draft.soldierAttributeChoice && draft.soldierSkillChoice)),
        age: Number.isInteger(draft.age) && draft.age >= 0,
        attributes: attributeValidation.valid,
        skills: skillValidation.valid,
        talents: talentValidation.valid,
        equipment: true,
        name: draft.name.trim().length > 0
    };

    const currentStep = NPC_CREATION_STEPS[draft.step] ?? NPC_CREATION_STEPS[0];

    const stepFlags = Object.fromEntries(
        NPC_CREATION_STEPS.map((step) => [step, step === currentStep])
    );

    const selectedTalentSet = new Set(draft.talents ?? []);

    const archetypeTalentOptions = archetypeTalentEntries.map((talent) => ({
        name: talent.name,
        effect: talent.effect ?? "",
        selected: selectedTalentSet.has(talent.name)
    }));

    const generalTalentOptions = generalTalentEntries.map((talent) => ({
        name: talent.name,
        effect: talent.effect ?? "",
        selected: selectedTalentSet.has(talent.name)
    }));

    const archetypeAttributeSet = new Set(archetypeAttributeKeys);
    const archetypeSkillSet = new Set(archetypeSkillKeys);

    const attributeRows = ATTRIBUTE_KEYS.map((key) => ({
        key,
        label: ATTRIBUTE_LABELS[key],
        value: draft.attributes[key],
        isArchetype: archetypeAttributeSet.has(key)
    }));

    const skillRows = SKILL_KEYS.map((key) => ({
        key,
        label: SKILL_LABELS[key],
        value: draft.skills[key] ?? 0,
        isArchetype: archetypeSkillSet.has(key)
    }));

    const skillGroups = ATTRIBUTE_KEYS.map((attributeKey) => ({
        attributeKey,
        attributeLabel: ATTRIBUTE_LABELS[attributeKey],
        attributeValue: draft.attributes[attributeKey],
        skills: skillRows.filter((row) => SKILL_DEFINITIONS[row.key]?.attribute === attributeKey)
    }));

    return {

        steps: NPC_CREATION_STEPS,
        currentStep,
        stepFlags,
        stepIndex: draft.step,
        stepNumber: draft.step + 1,
        stepCount: NPC_CREATION_STEPS.length,
        isReviewStep: currentStep === "review",

        archetypeChoices: getArchetypeChoices().map((choice) => ({
            ...choice,
            selected: choice.key === draft.archetypeKey
        })),
        selectedArchetypeKey: draft.archetypeKey,
        selectedArchetype: archetypeText
            ? { ...archetypeText, isSoldier }
            : null,

        isSoldier,
        soldierAttributeChoice: draft.soldierAttributeChoice,
        soldierSkillChoice: draft.soldierSkillChoice,
        soldierAttributeIsVigor: draft.soldierAttributeChoice === "vigor",
        soldierAttributeIsAgility: draft.soldierAttributeChoice === "agility",
        soldierSkillIsCloseCombat: draft.soldierSkillChoice === "closeCombat",
        soldierSkillIsEndurance: draft.soldierSkillChoice === "endurance",

        age: draft.age,
        attributeBudget,
        skillBudget,

        /*
         * Exposés pour les boutons « Aléatoire » (application) :
         * évite de recalculer la résolution des clés d'archétype
         * une seconde fois côté Application.
         */
        archetypeAttributeKeys,
        archetypeSkillKeys,
        archetypeTalentNames,
        generalTalentNames,

        attributeRows,
        attributeValidation,

        skillRows,
        skillGroups,
        skillValidation,

        archetypeTalentOptions,
        generalTalentOptions,
        selectedTalents: draft.talents,
        selectedTalentCount: draft.talents?.length ?? 0,
        talentValidation,

        name: draft.name,

        stepValidity,
        canAdvance: stepValidity[currentStep] ?? false,
        canGoBack: draft.step > 0
    };
}
