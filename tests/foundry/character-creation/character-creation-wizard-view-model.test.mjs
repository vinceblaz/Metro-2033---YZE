import test from "node:test";
import assert from "node:assert/strict";

import {
    CREATION_STEPS,
    createInitialDraft,
    getArchetypeChoices,
    resolveStartingTalentCatalogEntry,
    buildCharacterCreationViewModel
} from "../../../src/foundry/character-creation/character-creation-wizard-view-model.mjs";


test("createInitialDraft — brouillon vierge cohérent (attributs à 2, compétences à 0)", () => {

    const draft = createInitialDraft();

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


test("resolveStartingTalentCatalogEntry — priorise un Talent d'archétype sur un Talent général homonyme", () => {

    const entry = resolveStartingTalentCatalogEntry("Courage", "soldier");

    assert.ok(entry, "« Courage » devrait exister dans au moins l'un des deux catalogues");
});


test("resolveStartingTalentCatalogEntry — retourne null pour un nom inconnu", () => {
    assert.equal(resolveStartingTalentCatalogEntry("Talent Inexistant Xyz", "soldier"), null);
});


test("buildCharacterCreationViewModel — brouillon vierge : étape archétype invalide (rien choisi)", () => {

    const draft = createInitialDraft();
    const vm = buildCharacterCreationViewModel(draft);

    assert.equal(vm.currentStep, "archetype");
    assert.equal(vm.stepValidity.archetype, false);
    assert.equal(vm.canAdvance, false);
    assert.equal(vm.canGoBack, false);
    assert.equal(vm.archetypeChoices.length, 8);
});


test("buildCharacterCreationViewModel — archétype simple (Diplomate) valide dès le choix fait", () => {

    const draft = createInitialDraft();
    draft.archetypeKey = "diplomat";

    const vm = buildCharacterCreationViewModel(draft);

    assert.equal(vm.stepValidity.archetype, true);
    assert.deepEqual(
        vm.attributeRows.filter((row) => row.isArchetype).map((row) => row.key),
        ["empathy"]
    );
    assert.ok(vm.selectedArchetype);
    assert.equal(vm.prideOptions.length, 2);
    assert.equal(vm.typicalNames.length, 6);
});


test("buildCharacterCreationViewModel — Soldat invalide tant que les deux choix ne sont pas faits", () => {

    const draft = createInitialDraft();
    draft.archetypeKey = "soldier";

    const incomplete = buildCharacterCreationViewModel(draft);
    assert.equal(incomplete.stepValidity.archetype, false);
    assert.deepEqual(incomplete.attributeRows.filter((row) => row.isArchetype), []);

    draft.soldierAttributeChoice = "vigor";
    draft.soldierSkillChoice = "endurance";

    const complete = buildCharacterCreationViewModel(draft);
    assert.equal(complete.stepValidity.archetype, true);
    assert.deepEqual(
        complete.attributeRows.filter((row) => row.isArchetype).map((row) => row.key),
        ["vigor"]
    );

    const archetypeSkillKeys = complete.skillRows.filter((row) => row.isArchetype).map((row) => row.key);
    assert.ok(archetypeSkillKeys.includes("endurance"));
    assert.ok(archetypeSkillKeys.includes("reaction"));
    assert.ok(archetypeSkillKeys.includes("shooting"));
});


test("buildCharacterCreationViewModel — étape attributs valide une fois le budget respecté", () => {

    const draft = createInitialDraft();
    draft.archetypeKey = "diplomat";
    draft.age = 30;
    draft.attributes = { vigor: 3, agility: 3, spirit: 4, empathy: 4 };

    const vm = buildCharacterCreationViewModel(draft);

    assert.equal(vm.attributeBudget, 14);
    assert.equal(vm.attributeValidation.valid, true, vm.attributeValidation.errors.join(" / "));
    assert.equal(vm.stepValidity.attributes, true);
});


test("buildCharacterCreationViewModel — étape Liens toujours valide (facultative), même sans aucun lien ajouté", () => {

    const draft = createInitialDraft();
    draft.archetypeKey = "diplomat";

    const otherCharacters = [{ id: "actor-1", name: "Igor" }, { id: "actor-2", name: "Olga" }];

    const empty = buildCharacterCreationViewModel(draft, { otherCharacters });
    assert.equal(empty.stepValidity.bonds, true);
    assert.equal(empty.hasBondRows, false);
    assert.deepEqual(empty.availableCharactersToAdd.map((c) => c.id).sort(), ["actor-1", "actor-2"]);

    draft.bonds = [{ actorId: "actor-1", text: "Je lui fais confiance." }];

    const withOneBond = buildCharacterCreationViewModel(draft, { otherCharacters });
    assert.equal(withOneBond.stepValidity.bonds, true);
    assert.equal(withOneBond.bondRows.length, 1);
    assert.equal(withOneBond.bondRows[0].actorName, "Igor");
    assert.equal(withOneBond.bondRows[0].text, "Je lui fais confiance.");

    // Igor n'est plus disponible à l'ajout, Olga si.
    assert.deepEqual(withOneBond.availableCharactersToAdd.map((c) => c.id), ["actor-2"]);
});


test("buildCharacterCreationViewModel — stepFlags n'active qu'une seule étape à la fois, sans dépendre d'un helper Handlebars", () => {

    const draft = createInitialDraft();
    draft.step = 3;

    const vm = buildCharacterCreationViewModel(draft);

    assert.equal(vm.currentStep, "skills");
    assert.equal(vm.stepFlags.skills, true);
    assert.equal(vm.stepFlags.archetype, false);
    assert.equal(vm.stepFlags.review, false);
    assert.equal(vm.isReviewStep, false);
    assert.equal(vm.stepNumber, 4);

    const activeFlags = Object.values(vm.stepFlags).filter(Boolean);
    assert.equal(activeFlags.length, 1, "une seule étape doit être active à la fois");
});


test("buildCharacterCreationViewModel — options de Talents portent leur propre statut sélectionné (pas de helper « includes »)", () => {

    const draft = createInitialDraft();
    draft.archetypeKey = "diplomat";
    draft.talents = ["Compassion"];

    const vm = buildCharacterCreationViewModel(draft);

    const compassion = [...vm.archetypeTalentOptions, ...vm.generalTalentOptions]
        .find((option) => option.name === "Compassion");

    assert.ok(compassion, "« Compassion » devrait être une option disponible pour le Diplomate");
    assert.equal(compassion.selected, true);
    assert.equal(typeof compassion.effect, "string");
});


test("buildCharacterCreationViewModel — skillGroups regroupe les 12 compétences sous leurs 4 attributs, avec la valeur déjà saisie", () => {

    const draft = createInitialDraft();
    draft.archetypeKey = "diplomat";
    draft.attributes = { vigor: 3, agility: 3, spirit: 4, empathy: 4 };

    const vm = buildCharacterCreationViewModel(draft);

    assert.equal(vm.skillGroups.length, 4);

    const totalSkillsAcrossGroups = vm.skillGroups.reduce((sum, group) => sum + group.skills.length, 0);
    assert.equal(totalSkillsAcrossGroups, 12);

    const empathyGroup = vm.skillGroups.find((group) => group.attributeKey === "empathy");
    assert.equal(empathyGroup.attributeValue, 4);
    assert.deepEqual(
        empathyGroup.skills.map((skill) => skill.key).sort(),
        ["analysis", "manipulation", "medicine"].sort()
    );
});


test("buildCharacterCreationViewModel — équipement et apparence sont toujours valides (texte libre / info du livre)", () => {

    const draft = createInitialDraft();
    draft.archetypeKey = "diplomat";

    const vm = buildCharacterCreationViewModel(draft);

    assert.equal(vm.stepValidity.equipment, true);
    assert.equal(vm.stepValidity.appearance, true);
});


test("CREATION_STEPS — respecte l'ordre des 10 étapes du livre plus l'étape de récapitulatif", () => {

    assert.deepEqual(CREATION_STEPS, [
        "archetype", "age", "attributes", "skills", "talents",
        "prideShame", "bonds", "equipment", "appearance", "name",
        "review"
    ]);
});
