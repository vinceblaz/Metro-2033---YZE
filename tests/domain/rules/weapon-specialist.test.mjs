import test from "node:test";
import assert from "node:assert/strict";

import {
    WEAPON_TALENT_TYPES,
    resolveWeaponTalentType,
    composeSpecialistName
} from "../../../src/domain/rules/weapon-talent-type.mjs";

import {
    TALENT_KEYS,
    evaluateTalentsForAction
} from "../../../src/domain/rules/talents.mjs";

import {
    ACTION_RESOLUTION_TYPES
} from "../../../src/domain/rules/action-resolution-context.mjs";


test("type d'arme : lourde prioritaire, sinon catégorie mécanique", () => {
    assert.equal(resolveWeaponTalentType({ category: "ranged", heavy: true }), "heavy");
    assert.equal(resolveWeaponTalentType({ category: "ranged" }), "ranged");
    assert.equal(resolveWeaponTalentType({ category: "melee" }), "melee");
    assert.equal(resolveWeaponTalentType({}), null);
    assert.equal(resolveWeaponTalentType(null), null);
});

test("libellé : le type est ajouté au nom, sans doublon", () => {
    assert.equal(
        composeSpecialistName("Spécialiste en armement", "heavy"),
        "Spécialiste en armement (Arme lourde)"
    );
    assert.equal(
        composeSpecialistName("Spécialiste en armement (Arme lourde)", "melee"),
        "Spécialiste en armement (Arme de mêlée)"
    );
    assert.equal(
        composeSpecialistName("Spécialiste en armement (Arme lourde)", ""),
        "Spécialiste en armement"
    );
    assert.equal(
        composeSpecialistName("Mon talent (perso)", "ranged"),
        "Mon talent (perso) (Arme à distance)"
    );
});

function rangedContext(type) {
    return {
        actionType: ACTION_RESOLUTION_TYPES.RANGED_ATTACK,
        skill: "shooting",
        weapon: { category: "pistol", type }
    };
}

function specialist(weaponType, id = "t1", level = 1) {
    return {
        id,
        key: TALENT_KEYS.WEAPON_SPECIALIST,
        level,
        configuration: { weaponType }
    };
}

test("deux exemplaires du même type fusionnent en un Supérieur (+2)", () => {
    const result = evaluateTalentsForAction(
        [specialist("heavy", "a"), specialist("heavy", "b")],
        rangedContext("heavy")
    );
    assert.equal(result.length, 1);
    assert.equal(result[0].level, 2);
    assert.equal(result[0].effects[0].suggestedValue, 2);
});

test("des types différents restent indépendants", () => {
    const result = evaluateTalentsForAction(
        [specialist("heavy", "a"), specialist("melee", "b")],
        rangedContext("heavy")
    );
    assert.equal(result.length, 1);
    assert.equal(result[0].level, 1);
});

test("un seul exemplaire de niveau 2 reste Supérieur", () => {
    const result = evaluateTalentsForAction(
        [specialist("ranged", "a", 2)],
        rangedContext("ranged")
    );
    assert.equal(result[0].effects[0].suggestedValue, 2);
});
