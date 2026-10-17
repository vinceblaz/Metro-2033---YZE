import test from "node:test";
import assert from "node:assert/strict";

import {
    CHARACTER_CREATION_OPTIONS,
    getCharacterCreationOptions
} from "../../../src/data/seed/character-creation-catalog.mjs";

import { ARCHETYPE_DEFINITIONS } from "../../../src/domain/rules/archetypes.mjs";


test("les 8 archétypes de ARCHETYPE_DEFINITIONS ont chacun leurs options de création", () => {

    for (const archetypeId of Object.keys(ARCHETYPE_DEFINITIONS)) {

        const options = getCharacterCreationOptions(archetypeId);

        assert.ok(options, `options manquantes pour ${archetypeId}`);
        assert.equal(options.typicalNames.length, 6, `${archetypeId} devrait avoir 6 noms typiques`);
        assert.equal(options.pride.length, 2, `${archetypeId} devrait avoir 2 options de Fierté`);
        assert.equal(options.shame.length, 2, `${archetypeId} devrait avoir 2 options de Honte`);
        assert.ok(options.bonds.length >= 2, `${archetypeId} devrait avoir au moins 2 options de Lien`);
    }
});


test("getCharacterCreationOptions — retourne null pour un archétype inconnu", () => {
    assert.equal(getCharacterCreationOptions("inconnu"), null);
});


test("aucun archétype de CHARACTER_CREATION_OPTIONS n'est orphelin d'une définition canonique", () => {

    for (const key of Object.keys(CHARACTER_CREATION_OPTIONS)) {
        assert.ok(ARCHETYPE_DEFINITIONS[key], `« ${key} » n'existe pas dans ARCHETYPE_DEFINITIONS`);
    }
});
