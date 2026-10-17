import test from "node:test";
import assert from "node:assert/strict";

import {
    buildNpcCreationActorData,
    resolveStartingTalentCatalogEntry
} from "../../../src/data/seed/npc-creation-actor-builder.mjs";


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
        name: "Boris le passeur",
        ...overrides
    };
}


test("buildNpcCreationActorData — produit un Actor « npc » conforme au brouillon", () => {

    const { actorData, warnings } = buildNpcCreationActorData(buildCompleteDraft());

    assert.equal(actorData.type, "npc");
    assert.equal(actorData.name, "Boris le passeur");
    assert.deepEqual(actorData.system.attributes.spirit, { value: 4, max: 4 });
    assert.deepEqual(actorData.system.attributes.vigor, { value: 3, max: 3 });
    assert.equal(actorData.system.skills.manipulation, 4);

    assert.deepEqual(warnings, []);
});


test("buildNpcCreationActorData — n'ajoute aucun Item Archétype (absent du schéma NpcDataModel), le note en texte dans role", () => {

    const { actorData, itemsData } = buildNpcCreationActorData(buildCompleteDraft());

    assert.equal(itemsData.filter((item) => item.type === "archetype").length, 0);
    assert.equal(actorData.system.identity.role, "Archétype : Diplomate");
});


test("buildNpcCreationActorData — ajoute un Item par Talent choisi", () => {

    const { itemsData } = buildNpcCreationActorData(buildCompleteDraft());

    const talentItems = itemsData.filter((item) => item.type === "talent");
    assert.equal(talentItems.length, 2);
});


test("buildNpcCreationActorData — system.identity.description reste vide (pas de Genre/Apparence collectés)", () => {

    const { actorData } = buildNpcCreationActorData(buildCompleteDraft());

    assert.equal(actorData.system.identity.description, "");
});


test("buildNpcCreationActorData — signale un Talent introuvable sans le fabriquer", () => {

    const draft = buildCompleteDraft({ talents: ["Talent Complètement Inventé"] });

    const { itemsData, warnings } = buildNpcCreationActorData(draft);

    assert.equal(itemsData.filter((item) => item.type === "talent").length, 0);
    assert.ok(warnings.some((message) => message.includes("Talent Complètement Inventé")));
});


test("buildNpcCreationActorData — signale un archétype introuvable sans le fabriquer", () => {

    const draft = buildCompleteDraft({ archetypeKey: "archetype-inconnu", talents: [] });

    const { actorData, warnings } = buildNpcCreationActorData(draft);

    assert.equal(actorData.system.identity.role, "");
    assert.ok(warnings.some((message) => message.includes("archetype-inconnu")));
});


test("resolveStartingTalentCatalogEntry — ré-exporté tel quel depuis character-creation-actor-builder", () => {
    assert.equal(resolveStartingTalentCatalogEntry("Talent Inexistant Xyz", "soldier"), null);
    assert.ok(resolveStartingTalentCatalogEntry("Courage", "diplomat"));
});
