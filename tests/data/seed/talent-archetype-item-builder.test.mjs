import test from "node:test";
import assert from "node:assert/strict";

import {
    buildTalentItemData,
    buildArchetypeItemData,
    buildAllTalentArchetypeItemsData
} from "../../../src/data/seed/talent-archetype-item-builder.mjs";

import {
    GENERAL_TALENTS,
    ARCHETYPE_TALENTS,
    ARCHETYPES
} from "../../../src/data/seed/talent-archetype-catalog.mjs";


test("GENERAL_TALENTS contient les 22 Talents généraux du livre", () => {
    assert.equal(GENERAL_TALENTS.length, 22);
});


test("ARCHETYPES contient les 8 archétypes du livre", () => {
    assert.equal(ARCHETYPES.length, 8);

    const keys = ARCHETYPES.map((archetype) => archetype.key).sort();

    assert.deepEqual(
        keys,
        ["diplomat", "infiltrator", "mechanic", "medic", "scout", "soldier", "strategist", "trader"]
    );
});


test("buildTalentItemData — Arme de prédilection réutilise la clé mécanique existante", () => {

    const entry = GENERAL_TALENTS.find((talent) => talent.name === "Arme de prédilection");
    const data = buildTalentItemData(entry);

    assert.equal(data.type, "talent");
    assert.equal(data.system.key, "favoriteWeapon");
    assert.equal(data.system.maxLevel, 2);
    assert.equal(data.system.archetypeId, "");
});


test("buildTalentItemData — un Talent général sans mécanique reçoit une clé générée stable", () => {

    const entry = GENERAL_TALENTS.find((talent) => talent.name === "Chanceux");
    const data = buildTalentItemData(entry);

    assert.equal(data.system.key, "chanceux");
    assert.equal(data.system.maxLevel, 1);
});


test("buildTalentItemData — un Talent d'archétype partagé est décliné par archétype avec la même clé mécanique", () => {

    const copies = ARCHETYPE_TALENTS.filter((talent) => talent.name === "Imperturbable");
    assert.equal(copies.length, 3);

    const archetypeIds = copies.map((talent) => talent.archetypeId).sort();
    assert.deepEqual(archetypeIds, ["diplomat", "medic", "trader"]);

    const data = copies.map(buildTalentItemData);
    const mechanicalKeys = new Set(data.map((item) => item.system.key));
    assert.equal(mechanicalKeys.size, 1, "les 3 déclinaisons doivent partager la même clé mécanique");

    const seedKeys = data.map((item) => item.flags["metro-2033-yze"].seedKey);
    assert.equal(new Set(seedKeys).size, 3, "chaque déclinaison doit avoir sa propre seedKey");
});


test("buildTalentItemData — Spécialiste en armement réutilise sa clé mécanique sur ses deux déclinaisons", () => {

    const copies = ARCHETYPE_TALENTS.filter((talent) => talent.name === "Spécialiste en armement");
    assert.equal(copies.length, 2);

    for (const entry of copies) {
        const data = buildTalentItemData(entry);
        assert.equal(data.system.key, "weaponSpecialist");
    }
});


test("buildArchetypeItemData — Diplomate conforme et référence son équipement de départ", () => {

    const entry = ARCHETYPES.find((archetype) => archetype.key === "diplomat");
    const data = buildArchetypeItemData(entry);

    assert.equal(data.type, "archetype");
    assert.equal(data.system.key, "diplomat");
    assert.match(data.system.description, /Empathie/);
    assert.match(data.system.description, /grenades étourdissantes/);
});


test("buildAllTalentArchetypeItemsData — agrège l'ensemble sans doublon de seedKey", () => {

    const items = buildAllTalentArchetypeItemsData({
        generalTalents: GENERAL_TALENTS,
        archetypeTalents: ARCHETYPE_TALENTS,
        archetypes: ARCHETYPES
    });

    const expectedCount = GENERAL_TALENTS.length + ARCHETYPE_TALENTS.length + ARCHETYPES.length;
    assert.equal(items.length, expectedCount);

    const seedKeys = items.map((item) => item.flags["metro-2033-yze"].seedKey);
    assert.equal(new Set(seedKeys).size, seedKeys.length);
});
