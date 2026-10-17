import { test } from "node:test";
import assert from "node:assert/strict";

import {
    SkillRollPreparationService
} from "../../src/action-resolution/skill-roll-preparation-service.mjs";

import {
    resolveTalentKey,
    isTalentItem,
    TALENT_IDENTITIES
} from "../../src/domain/rules/talent-identity.mjs";

import {
    getTalentDefinition
} from "../../src/domain/rules/talents.mjs";


function talentItem({ name = "Pilote", key = "pilote" } = {}) {
    return {
        id: `t-${name}-${key}`,
        name,
        type: "talent",
        system: { key, level: 1, maxLevel: 2, configuration: {} }
    };
}

function actor(items) {
    return {
        id: "actor-1",
        type: "character",
        items,
        system: {
            attributes: { agility: { value: 3 }, strength: { value: 3 } },
            skills: { reaction: 2, shooting: 2 },
            stress: { dice: 0 }
        }
    };
}

function pilotModifiers(preparation) {
    return preparation.modifiers.filter(
        modifier => modifier.metadata?.talentKey === "pilot"
    );
}


test("resolveTalentKey : ancienne clé générée 'pilote' -> 'pilot'", () => {
    assert.equal(resolveTalentKey(talentItem({ key: "pilote" })), "pilot");
    assert.equal(
        getTalentDefinition(resolveTalentKey(talentItem({ key: "pilote" })))?.label,
        "Pilote"
    );
    // Sans le correctif, la clé brute n'a aucune définition.
    assert.equal(getTalentDefinition("pilote"), null);
});

test("resolveTalentKey : anciennes clés Second souffle / Impitoyable", () => {
    assert.equal(
        resolveTalentKey(talentItem({ name: "Second souffle", key: "secondSouffle" })),
        TALENT_IDENTITIES.SECOND_WIND.key
    );
    assert.equal(
        resolveTalentKey(talentItem({ name: "Impitoyable", key: "impitoyable" })),
        TALENT_IDENTITIES.RUTHLESS.key
    );
});

test("resolveTalentKey : clé vide ou inconnue -> repli par nom (accents/casse)", () => {
    assert.equal(resolveTalentKey(talentItem({ name: "  PILOTE ", key: "" })), "pilot");
    assert.equal(resolveTalentKey(talentItem({ name: "pilote", key: "xyz" })), "pilot");
    assert.equal(resolveTalentKey(talentItem({ name: "Second  Souffle", key: "" })), "secondWind");
});

test("resolveTalentKey : clé canonique conservée ; autre Talent inchangé", () => {
    assert.equal(resolveTalentKey(talentItem({ key: "pilot" })), "pilot");
    assert.equal(
        resolveTalentKey(talentItem({ name: "Esquive", key: "dodge" })),
        "dodge"
    );
    assert.equal(
        resolveTalentKey(talentItem({ name: "Inconnu", key: " custom " })),
        "custom"
    );
    assert.equal(resolveTalentKey(null), "");
});

test("isTalentItem reconnaît l'ancienne clé", () => {
    assert.equal(
        isTalentItem(
            talentItem({ name: "Autre nom", key: "pilote" }),
            { key: "pilot", name: "Pilote" }
        ),
        true
    );
});

test("Jet de RÉACTION : Pilote (ancienne clé 'pilote') est proposé, décoché, +1", () => {
    const { preparation, talents } = SkillRollPreparationService.create(
        actor([talentItem({ key: "pilote" })]),
        { attribute: "agility", skill: "reaction" }
    );

    assert.equal(talents[0].key, "pilot");

    const mods = pilotModifiers(preparation);
    assert.equal(mods.length, 1);
    assert.equal(mods[0].selected, false);
    assert.equal(mods[0].value, 1);
});

test("Jet de RÉACTION : Pilote niveau 2 -> +2", () => {
    const item = talentItem({ key: "pilote" });
    item.system.level = 2;
    const { preparation } = SkillRollPreparationService.create(
        actor([item]),
        { attribute: "agility", skill: "reaction" }
    );
    const mods = pilotModifiers(preparation);
    assert.equal(mods.length, 1);
    assert.equal(mods[0].value, 2);
    assert.equal(mods[0].selected, false);
});

test("Pilote n'est pas proposé sur une autre compétence", () => {
    const { preparation } = SkillRollPreparationService.create(
        actor([talentItem({ key: "pilote" })]),
        { attribute: "agility", skill: "shooting" }
    );
    assert.equal(pilotModifiers(preparation).length, 0);
});

test("Pilote (clé vide, repli par nom) proposé sur RÉACTION", () => {
    const { preparation } = SkillRollPreparationService.create(
        actor([talentItem({ key: "" })]),
        { attribute: "agility", skill: "reaction" }
    );
    assert.equal(pilotModifiers(preparation).length, 1);
});
