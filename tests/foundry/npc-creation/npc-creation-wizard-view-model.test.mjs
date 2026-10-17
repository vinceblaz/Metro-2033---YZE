import test from "node:test";
import assert from "node:assert/strict";

import {
    NPC_CREATION_STEPS,
    createInitialNpcDraft,
    getArchetypeChoices,
    resolveStartingTalentCatalogEntry,
    buildNpcCreationViewModel
} from "../../../src/foundry/npc-creation/npc-creation-wizard-view-model.mjs";


test("createInitialNpcDraft — brouillon vierge cohérent (attributs à 2, compétences à 0)", () => {

    const draft = createInitialNpcDraft();

    assert.equal(draft.step, 0);
    assert.equal(draft.archetypeKey, "");
    assert.equal(draft.age, 25);
    assert.equal(draft.attributes.vigor, 2);
    assert.equal(draft.skills.repair, 0);
    assert.deepEqual(draft.talents, []);
});


test("getArchetypeChoices — retourne les 8 archétypes avec leur texte du livre", () => {

    const choices = getArchetypeChoices();

    assert.equal(choices.length, 8);
    assert.ok(choices.every((choice) => choice.key && choice.name && choice.startingEquipmentText));
});


test("resolveStartingTalentCatalogEntry — retourne null pour un nom inconnu", () => {
    assert.equal(resolveStartingTalentCatalogEntry("Talent Inexistant Xyz", "soldier"), null);
});


test("NPC_CREATION_STEPS — sans Fierté/Honte/Liens, à la différence des PJ", () => {

    assert.deepEqual(NPC_CREATION_STEPS, [
        "archetype", "age", "attributes", "skills", "talents",
        "equipment", "name",
        "review"
    ]);

    assert.ok(!NPC_CREATION_STEPS.includes("prideShame"));
    assert.ok(!NPC_CREATION_STEPS.includes("bonds"));
    assert.ok(!NPC_CREATION_STEPS.includes("appearance"));
});


test("buildNpcCreationViewModel — brouillon vierge : étape archétype invalide (rien choisi)", () => {

    const draft = createInitialNpcDraft();
    const vm = buildNpcCreationViewModel(draft);

    assert.equal(vm.currentStep, "archetype");
    assert.equal(vm.stepValidity.archetype, false);
    assert.equal(vm.canAdvance, false);
    assert.equal(vm.canGoBack, false);
    assert.equal(vm.archetypeChoices.length, 8);
});


test("buildNpcCreationViewModel — archétype simple (Diplomate) valide dès le choix fait", () => {

    const draft = createInitialNpcDraft();
    draft.archetypeKey = "diplomat";

    const vm = buildNpcCreationViewModel(draft);

    assert.equal(vm.stepValidity.archetype, true);
    assert.deepEqual(
        vm.attributeRows.filter((row) => row.isArchetype).map((row) => row.key),
        ["empathy"]
    );
    assert.ok(vm.selectedArchetype);
});


test("buildNpcCreationViewModel — Soldat invalide tant que les deux choix ne sont pas faits", () => {

    const draft = createInitialNpcDraft();
    draft.archetypeKey = "soldier";

    const incomplete = buildNpcCreationViewModel(draft);
    assert.equal(incomplete.stepValidity.archetype, false);

    draft.soldierAttributeChoice = "agility";
    draft.soldierSkillChoice = "shooting";

    const complete = buildNpcCreationViewModel(draft);
    assert.equal(complete.stepValidity.archetype, true);
    assert.deepEqual(
        complete.attributeRows.filter((row) => row.isArchetype).map((row) => row.key),
        ["agility"]
    );
});


test("buildNpcCreationViewModel — mêmes budgets/validations stricts que le PJ (même moteur de règles)", () => {

    const draft = createInitialNpcDraft();
    draft.archetypeKey = "diplomat";
    draft.age = 30;
    draft.attributes = { vigor: 3, agility: 3, spirit: 4, empathy: 4 };

    const vm = buildNpcCreationViewModel(draft);

    assert.equal(vm.attributeBudget, 14);
    assert.equal(vm.attributeValidation.valid, true, vm.attributeValidation.errors.join(" / "));
    assert.equal(vm.stepValidity.attributes, true);
});


test("buildNpcCreationViewModel — l'équipement est toujours valide (texte libre du livre)", () => {

    const draft = createInitialNpcDraft();
    draft.archetypeKey = "diplomat";

    const vm = buildNpcCreationViewModel(draft);

    assert.equal(vm.stepValidity.equipment, true);
});


test("buildNpcCreationViewModel — stepFlags n'active qu'une seule étape à la fois", () => {

    const draft = createInitialNpcDraft();
    draft.step = 3;

    const vm = buildNpcCreationViewModel(draft);

    assert.equal(vm.currentStep, "skills");
    assert.equal(vm.stepFlags.skills, true);
    assert.equal(vm.stepFlags.archetype, false);
    assert.equal(vm.stepFlags.review, false);
    assert.equal(vm.isReviewStep, false);
    assert.equal(vm.stepNumber, 4);

    const activeFlags = Object.values(vm.stepFlags).filter(Boolean);
    assert.equal(activeFlags.length, 1, "une seule étape doit être active à la fois");
});


test("buildNpcCreationViewModel — expose archetypeAttributeKeys/archetypeSkillKeys/*TalentNames pour les boutons « Aléatoire »", () => {

    const draft = createInitialNpcDraft();
    draft.archetypeKey = "scout";

    const vm = buildNpcCreationViewModel(draft);

    assert.deepEqual(vm.archetypeAttributeKeys, ["agility"]);
    assert.deepEqual(vm.archetypeSkillKeys.sort(), ["observation", "stealth", "survival"]);
    assert.ok(vm.archetypeTalentNames.length > 0);
    assert.ok(vm.generalTalentNames.length > 0);
});


test("buildNpcCreationViewModel — skillGroups regroupe les 12 compétences sous leurs 4 attributs", () => {

    const draft = createInitialNpcDraft();
    draft.archetypeKey = "diplomat";
    draft.attributes = { vigor: 3, agility: 3, spirit: 4, empathy: 4 };

    const vm = buildNpcCreationViewModel(draft);

    assert.equal(vm.skillGroups.length, 4);

    const totalSkillsAcrossGroups = vm.skillGroups.reduce((sum, group) => sum + group.skills.length, 0);
    assert.equal(totalSkillsAcrossGroups, 12);
});
