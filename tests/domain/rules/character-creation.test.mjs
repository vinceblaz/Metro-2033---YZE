import test from "node:test";
import assert from "node:assert/strict";

import {
    AGE_CATEGORY,
    getAgeCategory,
    getAttributePointsBudget,
    getSkillPointsBudget,
    validateAttributeAllocation,
    validateSkillAllocation,
    validateStartingTalentSelection,
    resolveArchetypeAttributeKeys,
    resolveArchetypeSkillKeys,
    randomizeAttributeAllocation,
    randomizeSkillAllocation,
    pickRandomTalents
} from "../../../src/domain/rules/character-creation.mjs";

import { ARCHETYPE_DEFINITIONS } from "../../../src/domain/rules/archetypes.mjs";


test("getAgeCategory — bornes Jeune/Adulte/Aîné (25, 26, 50, 51)", () => {
    assert.equal(getAgeCategory(18), AGE_CATEGORY.YOUNG);
    assert.equal(getAgeCategory(25), AGE_CATEGORY.YOUNG);
    assert.equal(getAgeCategory(26), AGE_CATEGORY.ADULT);
    assert.equal(getAgeCategory(50), AGE_CATEGORY.ADULT);
    assert.equal(getAgeCategory(51), AGE_CATEGORY.ELDER);
});


test("getAttributePointsBudget / getSkillPointsBudget — table p.172", () => {
    assert.equal(getAttributePointsBudget(20), 15);
    assert.equal(getSkillPointsBudget(20), 8);

    assert.equal(getAttributePointsBudget(30), 14);
    assert.equal(getSkillPointsBudget(30), 10);

    assert.equal(getAttributePointsBudget(60), 13);
    assert.equal(getSkillPointsBudget(60), 12);
});


test("validateAttributeAllocation — répartition Adulte valide respectant le budget de 14", () => {

    const result = validateAttributeAllocation({
        allocation: { vigor: 3, agility: 3, spirit: 4, empathy: 4 },
        age: 30,
        archetypeAttributes: ["empathy"]
    });

    assert.equal(result.total, 14);
    assert.equal(result.valid, true, result.errors.join(" / "));
});


test("validateAttributeAllocation — l'attribut d'archétype peut atteindre 5, les autres non", () => {

    const result = validateAttributeAllocation({
        allocation: { vigor: 2, agility: 2, spirit: 5, empathy: 5 },
        age: 30,
        archetypeAttributes: ["spirit"]
    });

    // empathy = 5 dépasse le plafond général de 4 (elle n'est pas l'attribut d'archétype)
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((message) => message.includes("empathy")));
});


test("validateAttributeAllocation — refuse un total hors budget", () => {

    const result = validateAttributeAllocation({
        allocation: { vigor: 2, agility: 2, spirit: 2, empathy: 2 },
        age: 30,
        archetypeAttributes: ["empathy"]
    });

    assert.equal(result.valid, false);
    assert.ok(result.errors.some((message) => message.includes("total des attributs")));
});


test("validateSkillAllocation — répartition Jeune valide (budget 8), 3 compétences d'archétype à 3 max", () => {

    const archetypeSkills = ["analysis", "comprehension", "manipulation"];

    const allocation = {
        analysis: 3, comprehension: 3, manipulation: 2,
        repair: 0, closeCombat: 0, endurance: 0,
        stealth: 0, reaction: 0, shooting: 0,
        observation: 0, survival: 0, medicine: 0
    };

    const result = validateSkillAllocation({ allocation, age: 20, archetypeSkills });

    assert.equal(result.total, 8);
    assert.equal(result.valid, true, result.errors.join(" / "));
});


test("validateSkillAllocation — refuse plus de 2 points sur une compétence hors archétype", () => {

    const archetypeSkills = ["analysis", "comprehension", "manipulation"];

    const allocation = {
        analysis: 2, comprehension: 2, manipulation: 1,
        repair: 3, closeCombat: 0, endurance: 0,
        stealth: 0, reaction: 0, shooting: 0,
        observation: 0, survival: 0, medicine: 0
    };

    const result = validateSkillAllocation({ allocation, age: 20, archetypeSkills });

    assert.equal(result.valid, false);
    assert.ok(result.errors.some((message) => message.includes("repair")));
});


test("validateStartingTalentSelection — accepte 2 Talents distincts, l'un d'archétype et l'un général", () => {

    const result = validateStartingTalentSelection({
        selected: ["Compassion", "Courage"],
        archetypeTalentNames: ["Compassion", "Hésitation", "Imperturbable"],
        generalTalentNames: ["Courage", "Brute"]
    });

    assert.equal(result.valid, true, result.errors.join(" / "));
});


test("resolveArchetypeAttributeKeys — archétype simple (Diplomate)", () => {
    assert.deepEqual(
        resolveArchetypeAttributeKeys(ARCHETYPE_DEFINITIONS.diplomat),
        ["empathy"]
    );
});


test("resolveArchetypeAttributeKeys — Soldat, choix requis (Agilité ou Vigueur)", () => {
    assert.deepEqual(resolveArchetypeAttributeKeys(ARCHETYPE_DEFINITIONS.soldier), []);
    assert.deepEqual(
        resolveArchetypeAttributeKeys(ARCHETYPE_DEFINITIONS.soldier, "vigor"),
        ["vigor"]
    );
    assert.deepEqual(
        resolveArchetypeAttributeKeys(ARCHETYPE_DEFINITIONS.soldier, "empathy"),
        [],
        "un attribut hors des choix proposés est ignoré"
    );
});


test("resolveArchetypeSkillKeys — archétype simple (Éclaireur), 3 compétences fixes", () => {
    assert.deepEqual(
        resolveArchetypeSkillKeys(ARCHETYPE_DEFINITIONS.scout).sort(),
        ["observation", "stealth", "survival"].sort()
    );
});


test("resolveArchetypeSkillKeys — Soldat, Réaction+Tir fixes, Corps à corps OU Endurance au choix", () => {

    const withoutChoice = resolveArchetypeSkillKeys(ARCHETYPE_DEFINITIONS.soldier);
    assert.deepEqual(withoutChoice.sort(), ["reaction", "shooting"].sort());

    const withChoice = resolveArchetypeSkillKeys(ARCHETYPE_DEFINITIONS.soldier, ["endurance"]);
    assert.deepEqual(withChoice.sort(), ["endurance", "reaction", "shooting"].sort());
});


test("validateStartingTalentSelection — refuse un nombre différent de 2 ou un Talent hors liste", () => {

    const oneOnly = validateStartingTalentSelection({
        selected: ["Compassion"],
        archetypeTalentNames: ["Compassion"],
        generalTalentNames: []
    });
    assert.equal(oneOnly.valid, false);

    const notAllowed = validateStartingTalentSelection({
        selected: ["Compassion", "Assassin"],
        archetypeTalentNames: ["Compassion"],
        generalTalentNames: ["Courage"]
    });
    assert.equal(notAllowed.valid, false);
    assert.ok(notAllowed.errors.some((message) => message.includes("Assassin")));
});


/*
 * Un `rng` fixe (toujours 0) rend le mélange déterministe
 * (Fisher-Yates avec `rng` constant ne modifie jamais l'ordre) :
 * pratique pour vérifier des cas précis sans dépendre du hasard.
 */
const ZERO_RNG = () => 0;


test("randomizeAttributeAllocation — toujours une répartition valide (budget exact, bornes respectées)", () => {

    for (const age of [18, 30, 60]) {
        for (let i = 0; i < 20; i++) {

            const allocation = randomizeAttributeAllocation({
                age,
                archetypeAttributes: ["empathy"]
            });

            const validation = validateAttributeAllocation({
                allocation,
                age,
                archetypeAttributes: ["empathy"]
            });

            assert.equal(validation.valid, true, validation.errors.join(" / "));
        }
    }
});


test("randomizeAttributeAllocation — l'attribut d'archétype ne descend jamais sous 4", () => {

    for (let i = 0; i < 30; i++) {

        const allocation = randomizeAttributeAllocation({
            age: 30,
            archetypeAttributes: ["vigor"]
        });

        assert.ok(allocation.vigor >= 4, `vigor=${allocation.vigor}`);
    }
});


test("randomizeAttributeAllocation — rng déterministe (0) : chaque tirage attribue le premier candidat disponible", () => {

    const allocation = randomizeAttributeAllocation({
        age: 30,
        archetypeAttributes: ["empathy"],
        rng: ZERO_RNG
    });

    const total = Object.values(allocation).reduce((sum, value) => sum + value, 0);
    assert.equal(total, 14);
    assert.ok(allocation.empathy >= 4);
});


test("randomizeSkillAllocation — toujours une répartition valide (budget exact, bornes respectées)", () => {

    for (const age of [18, 30, 60]) {
        for (let i = 0; i < 20; i++) {

            const archetypeSkills = ["analysis", "comprehension", "manipulation"];

            const allocation = randomizeSkillAllocation({ age, archetypeSkills });

            const validation = validateSkillAllocation({
                allocation,
                age,
                archetypeSkills
            });

            assert.equal(validation.valid, true, validation.errors.join(" / "));
        }
    }
});


test("randomizeSkillAllocation — les compétences d'archétype ne descendent jamais sous 2", () => {

    const archetypeSkills = ["stealth", "observation", "survival"];

    for (let i = 0; i < 30; i++) {

        const allocation = randomizeSkillAllocation({ age: 30, archetypeSkills });

        for (const key of archetypeSkills) {
            assert.ok(allocation[key] >= 2, `${key}=${allocation[key]}`);
        }
    }
});


test("pickRandomTalents — pioche le bon nombre de noms distincts parmi la liste", () => {

    const names = ["Courage", "Compassion", "Assassin", "Forte tête"];

    const one = pickRandomTalents(names, 1);
    assert.equal(one.length, 1);
    assert.ok(names.includes(one[0]));

    const two = pickRandomTalents(names, 2);
    assert.equal(two.length, 2);
    assert.equal(new Set(two).size, 2);
    assert.ok(two.every((name) => names.includes(name)));
});


test("pickRandomTalents — ne renvoie jamais plus de noms que la liste n'en contient", () => {

    const names = ["Courage", "Compassion"];

    const result = pickRandomTalents(names, 5);
    assert.equal(result.length, 2);
});
