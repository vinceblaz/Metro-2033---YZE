import test from "node:test";
import assert from "node:assert/strict";

import {
    buildCharacterCreationActorData,
    resolveStartingTalentCatalogEntry
} from "../../../src/data/seed/character-creation-actor-builder.mjs";


function buildCompleteDraft(overrides = {}) {

    return {
        archetypeKey: "diplomat",
        soldierAttributeChoice: "",
        soldierSkillChoice: "",
        age: 30,
        attributes: { vigor: 3, agility: 3, spirit: 4, empathy: 4 },
        skills: {
            repair: 0, closeCombat: 0, endurance: 0, stealth: 0,
            reaction: 0, shooting: 0, comprehension: 3, observation: 0,
            survival: 0, analysis: 3, manipulation: 4, medicine: 0
        },
        talents: ["Compassion", "Courage"],
        pride: "On me dit souvent que je suis le/la meilleur(e).",
        shame: "Je dois faire d'énormes efforts pour me contrôler.",
        bonds: [{ actorId: "Actor.abc123", text: "Je ne lui fais pas confiance." }],
        appearance: "Grand, manteau en cuir rapiécé.",
        gender: "Homme",
        name: "Miroslav Abramovitch",
        ...overrides
    };
}


test("buildCharacterCreationActorData — produit un Actor « character » conforme au brouillon", () => {

    const { actorData, itemsData, warnings } = buildCharacterCreationActorData(buildCompleteDraft());

    assert.equal(actorData.type, "character");
    assert.equal(actorData.name, "Miroslav Abramovitch");
    assert.equal(actorData.system.identity.age, 30);
    assert.deepEqual(actorData.system.attributes.spirit, { value: 4, max: 4 });
    assert.deepEqual(actorData.system.attributes.vigor, { value: 3, max: 3 });
    assert.equal(actorData.system.skills.manipulation, 4);
    assert.equal(actorData.system.narrative.pride.description, "On me dit souvent que je suis le/la meilleur(e).");
    assert.equal(actorData.system.narrative.relationships.length, 1);
    assert.equal(actorData.system.narrative.relationships[0].actor, "Actor.abc123");

    assert.deepEqual(warnings, []);
});


test("buildCharacterCreationActorData — ajoute un Item Archétype et un Item par Talent choisi", () => {

    const { itemsData } = buildCharacterCreationActorData(buildCompleteDraft());

    const archetypeItems = itemsData.filter((item) => item.type === "archetype");
    const talentItems = itemsData.filter((item) => item.type === "talent");

    assert.equal(archetypeItems.length, 1);
    assert.equal(archetypeItems[0].system.key, "diplomat");
    assert.equal(talentItems.length, 2);
});


test("buildCharacterCreationActorData — reporte les choix du Soldat dans la configuration de l'Item Archétype", () => {

    const draft = buildCompleteDraft({
        archetypeKey: "soldier",
        soldierAttributeChoice: "vigor",
        soldierSkillChoice: "endurance",
        talents: []
    });

    const { itemsData } = buildCharacterCreationActorData(draft);

    const archetypeItem = itemsData.find((item) => item.type === "archetype");

    assert.equal(archetypeItem.system.configuration.attribute, "vigor");
    assert.equal(archetypeItem.system.configuration.skill, "endurance");
});


test("buildCharacterCreationActorData — signale un Talent introuvable sans le fabriquer", () => {

    const draft = buildCompleteDraft({ talents: ["Talent Complètement Inventé"] });

    const { itemsData, warnings } = buildCharacterCreationActorData(draft);

    const talentItems = itemsData.filter((item) => item.type === "talent");

    assert.equal(talentItems.length, 0);
    assert.ok(warnings.some((message) => message.includes("Talent Complètement Inventé")));
});


test("buildCharacterCreationActorData — signale un archétype introuvable sans le fabriquer", () => {

    const draft = buildCompleteDraft({ archetypeKey: "archetype-inconnu", talents: [] });

    const { itemsData, warnings } = buildCharacterCreationActorData(draft);

    assert.equal(itemsData.filter((item) => item.type === "archetype").length, 0);
    assert.ok(warnings.some((message) => message.includes("archetype-inconnu")));
});


test("resolveStartingTalentCatalogEntry — retourne null pour un nom inconnu", () => {
    assert.equal(resolveStartingTalentCatalogEntry("Talent Inexistant Xyz", "soldier"), null);
});


test("resolveStartingTalentCatalogEntry — trouve un Talent général valable pour tout archétype", () => {

    const entry = resolveStartingTalentCatalogEntry("Courage", "diplomat");

    assert.ok(entry, "« Courage » devrait exister dans au moins l'un des deux catalogues");
});
