import test from "node:test";
import assert from "node:assert/strict";

import {
    AFFLICTION_CHOICES,
    buildChoicesReminder
} from "../../../src/domain/rules/choices-reminder.mjs";

import {
    MELEE_STUNT_DEFINITIONS
} from "../../../src/domain/rules/melee-stunts.mjs";

import {
    MELEE_BLOCK_STUNT_DEFINITIONS
} from "../../../src/domain/rules/melee-block-stunts.mjs";


test("Afflictions : quatre choix, dont l'équipement limité à une affliction", () => {

    assert.equal(AFFLICTION_CHOICES.length, 4);

    const equipement = AFFLICTION_CHOICES.find(c => c.label.startsWith("Équipement"));
    assert.match(equipement.detail, /une seule affliction/);

});


test("Éclats de mêlée et de blocage : repris des définitions du jeu", () => {

    const reminder = buildChoicesReminder({
        meleeStunts: Object.values(MELEE_STUNT_DEFINITIONS),
        blockStunts: Object.values(MELEE_BLOCK_STUNT_DEFINITIONS),
        rangedStunts: [{ label: "+1 dégât à l'Esprit", repeatable: true }]
    });

    assert.equal(reminder.meleeStunts.length, Object.keys(MELEE_STUNT_DEFINITIONS).length);
    assert.ok(reminder.meleeStunts.some(c => c.label === "Désarmer"));
    assert.ok(reminder.blockStunts.some(c => c.label === "Contre-attaquer"));
    assert.deepEqual(reminder.rangedStunts, [{ label: "+1 dégât à l'Esprit", repeatable: true }]);

});


test("Entrées absentes : listes vides, jamais d'erreur", () => {

    const reminder = buildChoicesReminder();

    assert.deepEqual(reminder.meleeStunts, []);
    assert.deepEqual(reminder.rangedStunts, []);
    assert.deepEqual(reminder.blockStunts, []);
    assert.equal(reminder.afflictions.length, 4);

});
