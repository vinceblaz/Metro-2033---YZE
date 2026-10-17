/**
 * Assemblage pur (aucune dépendance à `foundry.*`) du modèle
 * de vue de l'Assistant de création de Personnage.
 *
 * Reprend « Les 10 étapes de la création de personnages »
 * (livre de règles p.163) :
 *
 *  1. archétype        6. fierté / honte
 *  2. âge               7. liens avec les autres PJ
 *  3. attributs         8. équipement de départ
 *  4. compétences       9. apparence
 *  5. talents          10. nom
 *
 * Une 11e étape (« review ») récapitule le tout avant la
 * création effective de l'Actor (gérée par
 * `character-creation-wizard-application.mjs`, non testée).
 *
 * Ce module ne modifie jamais l'Actor ni aucun Document
 * Foundry : il calcule seulement ce qu'il faut afficher et si
 * l'étape courante est valide.
 */

import { ARCHETYPE_DEFINITIONS, getArchetypeDefinition }
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

import { ARCHETYPES, GENERAL_TALENTS, ARCHETYPE_TALENTS }
    from "../../data/seed/talent-archetype-catalog.mjs";

import { SKILL_DEFINITIONS }
    from "../../domain/rules/skills.mjs";

import { getCharacterCreationOptions }
    from "../../data/seed/character-creation-catalog.mjs";

import { resolveStartingTalentCatalogEntry }
    from "../../data/seed/character-creation-actor-builder.mjs";

export { resolveStartingTalentCatalogEntry };


export const CREATION_STEPS = Object.freeze([
    "archetype", "age", "attributes", "skills", "talents",
    "prideShame", "bonds", "equipment", "appearance", "name",
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
 * État initial (vierge) d'un brouillon de création.
 */
export function createInitialDraft() {

    return {
        step: 0,

        archetypeKey: "",
        soldierAttributeChoice: "",
        soldierSkillChoice: "",

        age: 25,

        attributes: Object.fromEntries(ATTRIBUTE_KEYS.map((key) => [key, 2])),
        skills: Object.fromEntries(SKILL_KEYS.map((key) => [key, 0])),

        talents: [],

        pride: "",
        shame: "",

        bonds: [],

        appearance: "",
        gender: "",

        name: ""
    };
}


/**
 * Fusionne la définition canonique (archetypes.mjs) et la
 * fiche texte du livre (talent-archetype-catalog.mjs) pour un
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
 * Construit le modèle de vue complet de l'assistant pour un
 * brouillon donné.
 *
 * @param {object} draft Voir `createInitialDraft()`.
 * @param {object} [context]
 * @param {{id:string, name:string}[]} [context.otherCharacters]
 *   Les autres PJ du monde (pour l'étape « Liens »).
 */
export function buildCharacterCreationViewModel(draft, { otherCharacters = [] } = {}) {

    const archetypeDefinition = getArchetypeDefinition(draft.archetypeKey);
    const archetypeText = getArchetypeTextEntry(draft.archetypeKey);
    const creationOptions = getCharacterCreationOptions(draft.archetypeKey);

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
        prideShame: draft.pride.trim().length > 0 && draft.shame.trim().length > 0,
        /*
         * Les Liens avec les autres PJ sont une proposition du
         * livre (« ou créez-en une »), jamais une obligation
         * mécanique par PJ présent dans le monde : cette étape
         * est donc toujours considérée complète, même sans
         * aucun lien ajouté.
         */
        bonds: true,
        equipment: true,
        appearance: true,
        name: draft.name.trim().length > 0
    };

    const currentStep = CREATION_STEPS[draft.step] ?? CREATION_STEPS[0];

    /*
     * Une clé booléenne par étape (« stepFlags.archetype »,
     * etc.), directement exploitable par le template avec un
     * simple `{{#if}}` sur un chemin de propriété : cela évite
     * toute dépendance à un helper Handlebars personnalisé
     * (`eq`) pour la mécanique critique d'affichage d'une
     * seule étape à la fois.
     */
    const stepFlags = Object.fromEntries(
        CREATION_STEPS.map((step) => [step, step === currentStep])
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

    /*
     * Compétences regroupées par Attribut parent (règles p.176 :
     * chaque Attribut gouverne 3 Compétences), avec la valeur de
     * cet Attribut déjà saisie à l'étape précédente — pour que
     * le joueur garde ce repère sous les yeux à l'étape
     * Compétences.
     */
    const skillGroups = ATTRIBUTE_KEYS.map((attributeKey) => ({
        attributeKey,
        attributeLabel: ATTRIBUTE_LABELS[attributeKey],
        attributeValue: draft.attributes[attributeKey],
        skills: skillRows.filter((row) => SKILL_DEFINITIONS[row.key]?.attribute === attributeKey)
    }));

    /*
     * Étape Liens : un flux « Ajouter / Supprimer » plutôt
     * qu'une ligne obligatoire par PJ présent dans le monde.
     */
    const otherCharacterById = Object.fromEntries(
        otherCharacters.map((character) => [character.id, character])
    );

    const linkedActorIdSet = new Set((draft.bonds ?? []).map((bond) => bond.actorId));

    const bondRows = (draft.bonds ?? []).map((bond) => ({
        actorId: bond.actorId,
        actorName: otherCharacterById[bond.actorId]?.name ?? bond.actorId,
        text: bond.text ?? ""
    }));

    const availableCharactersToAdd = otherCharacters.filter(
        (character) => !linkedActorIdSet.has(character.id)
    );

    return {

        steps: CREATION_STEPS,
        currentStep,
        stepFlags,
        stepIndex: draft.step,
        stepNumber: draft.step + 1,
        stepCount: CREATION_STEPS.length,
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

        prideOptions: creationOptions?.pride ?? [],
        shameOptions: creationOptions?.shame ?? [],
        pride: draft.pride,
        shame: draft.shame,

        bondOptions: creationOptions?.bonds ?? [],
        hasOtherCharacters: otherCharacters.length > 0,
        bondRows,
        hasBondRows: bondRows.length > 0,
        availableCharactersToAdd,
        hasAvailableCharactersToAdd: availableCharactersToAdd.length > 0,
        bonds: draft.bonds,

        typicalNames: creationOptions?.typicalNames ?? [],

        appearance: draft.appearance,
        gender: draft.gender,

        name: draft.name,

        stepValidity,
        canAdvance: stepValidity[currentStep] ?? false,
        canGoBack: draft.step > 0
    };
}
