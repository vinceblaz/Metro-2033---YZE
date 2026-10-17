import test from "node:test";
import assert from "node:assert/strict";

import {
    computeAvailableAfflictions,
    isEquipmentAfflictionAllowed,
    getDefaultAllocation,
    validateAllocationDraft,
    describeResolution
} from "../../../src/domain/rules/affliction-allocation.mjs";


/* ---------- disponible ---------- */

test("computeAvailableAfflictions retranche les afflictions ignorées sans passer sous 0", () => {
    assert.equal(computeAvailableAfflictions({ total: 3, ignored: 1 }), 2);
    assert.equal(computeAvailableAfflictions({ total: 1, ignored: 1 }), 0);
    assert.equal(computeAvailableAfflictions({ total: 0, ignored: 1 }), 0);
    assert.equal(computeAvailableAfflictions({ total: 2 }), 2);
});

test("computeAvailableAfflictions tolère des valeurs invalides (0)", () => {
    assert.equal(computeAvailableAfflictions({ total: undefined, ignored: undefined }), 0);
    assert.equal(computeAvailableAfflictions({ total: -2, ignored: 0 }), 0);
    assert.equal(computeAvailableAfflictions({ total: "x", ignored: 0 }), 0);
});


/* ---------- équipement autorisé ---------- */

const forcedWithEquipment = {
    pushCount: 1,
    pool: { equipment: 2 },
    context: { equipment: { itemId: "item1" } }
};

test("isEquipmentAfflictionAllowed : jet forcé + dé d'équipement + équipement identifiable", () => {
    assert.equal(isEquipmentAfflictionAllowed(forcedWithEquipment), true);
});

test("isEquipmentAfflictionAllowed : refusé si jet non forcé", () => {
    assert.equal(
        isEquipmentAfflictionAllowed({ ...forcedWithEquipment, pushCount: 0 }),
        false
    );
});

test("isEquipmentAfflictionAllowed : refusé sans dé d'équipement", () => {
    assert.equal(
        isEquipmentAfflictionAllowed({ ...forcedWithEquipment, pool: { equipment: 0 } }),
        false
    );
});

test("isEquipmentAfflictionAllowed : refusé sans itemId ou sans résultat", () => {
    assert.equal(
        isEquipmentAfflictionAllowed({ ...forcedWithEquipment, context: {} }),
        false
    );
    assert.equal(isEquipmentAfflictionAllowed(null), false);
    assert.equal(isEquipmentAfflictionAllowed(undefined), false);
});


/* ---------- défaut ---------- */

test("getDefaultAllocation met tout en dégâts d'attribut", () => {
    assert.deepEqual(getDefaultAllocation(3), {
        attribute: 3,
        composure: 0,
        stress: 0,
        equipment: 0
    });
});

test("getDefaultAllocation(0) et valeurs invalides donnent une répartition vide", () => {
    assert.deepEqual(getDefaultAllocation(0), {
        attribute: 0, composure: 0, stress: 0, equipment: 0
    });
    assert.equal(getDefaultAllocation(-4).attribute, 0);
    assert.equal(getDefaultAllocation(undefined).attribute, 0);
});


/* ---------- validation ---------- */

test("validateAllocationDraft accepte une somme exacte", () => {
    const check = validateAllocationDraft({
        available: 3,
        draft: { attribute: 1, composure: 1, stress: 0, equipment: 1 },
        equipmentAllowed: true
    });

    assert.equal(check.valid, true);
    assert.equal(check.allocated, 3);
    assert.equal(check.remaining, 0);
    assert.deepEqual(check.errors, []);
    assert.deepEqual(check.allocation, {
        attribute: 1, composure: 1, stress: 0, equipment: 1
    });
});

test("validateAllocationDraft refuse une somme insuffisante", () => {
    const check = validateAllocationDraft({
        available: 3,
        draft: { attribute: 1 },
        equipmentAllowed: false
    });

    assert.equal(check.valid, false);
    assert.equal(check.allocated, 1);
    assert.equal(check.remaining, 2);
    assert.equal(check.errors.length, 1);
});

test("validateAllocationDraft refuse une somme excessive", () => {
    const check = validateAllocationDraft({
        available: 2,
        draft: { attribute: 2, stress: 1 },
        equipmentAllowed: false
    });

    assert.equal(check.valid, false);
    assert.equal(check.remaining, -1);
});

test("validateAllocationDraft refuse l'équipement si non autorisé", () => {
    const check = validateAllocationDraft({
        available: 1,
        draft: { equipment: 1 },
        equipmentAllowed: false
    });

    assert.equal(check.valid, false);
    assert.match(check.errors.join(" "), /équipement/i);
});

test("validateAllocationDraft refuse plus d'une affliction d'équipement", () => {
    const check = validateAllocationDraft({
        available: 2,
        draft: { equipment: 2 },
        equipmentAllowed: true
    });

    assert.equal(check.valid, false);
    assert.match(check.errors.join(" "), /équipement/i);
});

test("validateAllocationDraft refuse négatifs, décimaux et non numériques", () => {
    for (const bad of [-1, 1.5, "abc", NaN]) {
        const check = validateAllocationDraft({
            available: 1,
            draft: { attribute: bad },
            equipmentAllowed: false
        });

        assert.equal(check.valid, false, `valeur ${bad}`);
    }
});

test("validateAllocationDraft traite les champs absents ou vides comme 0 et accepte les chaînes numériques", () => {
    const check = validateAllocationDraft({
        available: 2,
        draft: { attribute: "2", composure: "", stress: undefined },
        equipmentAllowed: false
    });

    assert.equal(check.valid, true);
    assert.deepEqual(check.allocation, {
        attribute: 2, composure: 0, stress: 0, equipment: 0
    });
});


/* ---------- résumé ---------- */

function baseResolution(overrides = {}) {
    return {
        total: 0,
        attribute: { id: "agility", applied: 0 },
        composure: { applied: 0, reachedBreakingPoint: false },
        stress: { requested: 0, added: 0, limitExceeded: false },
        equipment: {
            requested: 0, applied: false, itemId: null, itemName: null,
            reliability: null, prevented: false, damage: null
        },
        ...overrides
    };
}

test("describeResolution : dégâts d'attribut avec avant/après", () => {
    const lines = describeResolution(
        baseResolution({ total: 2, attribute: { id: "agility", applied: 2 } }),
        { attributeLabel: "Agilité", attributeAfter: 1 }
    );

    assert.equal(lines.length, 1);
    assert.match(lines[0], /Agilité/);
    assert.match(lines[0], /−2|-2/);
    assert.match(lines[0], /3\s*→\s*1/);
});

test("describeResolution : Sang-froid et mention Brisé", () => {
    const lines = describeResolution(
        baseResolution({
            total: 1,
            composure: { applied: 1, reachedBreakingPoint: true }
        })
    );

    assert.equal(lines.length, 1);
    assert.match(lines[0], /Sang-froid/);
    assert.match(lines[0], /Brisé/);
});

test("describeResolution : Sang-froid sans limite atteinte, pas de mention Brisé", () => {
    const lines = describeResolution(
        baseResolution({
            total: 1,
            composure: { applied: 1, reachedBreakingPoint: false }
        })
    );

    assert.doesNotMatch(lines.join(" "), /Brisé/);
});

test("describeResolution : dés de Stress et limite dépassée", () => {
    const lines = describeResolution(
        baseResolution({
            total: 2,
            stress: { requested: 2, added: 1, limitExceeded: true }
        })
    );

    assert.equal(lines.length, 1);
    assert.match(lines[0], /Stress/);
    assert.match(lines[0], /limite/i);
});

test("describeResolution : équipement abîmé, protégé par la Fiabilité, hors d'usage", () => {
    const damaged = describeResolution(baseResolution({
        total: 1,
        equipment: {
            requested: 1, applied: true, itemId: "i", itemName: "Makarov",
            reliability: { success: false }, prevented: false,
            damage: { broken: false }
        }
    }));
    assert.match(damaged[0], /Makarov/);
    assert.match(damaged[0], /abîmé/);

    const prevented = describeResolution(baseResolution({
        total: 1,
        equipment: {
            requested: 1, applied: true, itemId: "i", itemName: "Makarov",
            reliability: { success: true }, prevented: true, damage: null
        }
    }));
    assert.match(prevented[0], /Fiabilité/);
    assert.doesNotMatch(prevented[0], /abîmé/);

    const broken = describeResolution(baseResolution({
        total: 1,
        equipment: {
            requested: 1, applied: true, itemId: "i", itemName: "Makarov",
            reliability: { success: false }, prevented: false,
            damage: { broken: true }
        }
    }));
    assert.match(broken[0], /hors d'usage/);
});

test("describeResolution : ne produit aucune ligne pour une répartition vide", () => {
    assert.deepEqual(describeResolution(baseResolution()), []);
    assert.deepEqual(describeResolution(null), []);
});

test("describeResolution : signale un dégât d'attribut partiellement absorbé (attribut déjà à 0)", () => {
    const lines = describeResolution(
        baseResolution({ total: 2, attribute: { id: "vigor", applied: 1 } }),
        { attributeLabel: "Vigueur", attributeAfter: 0, attributeRequested: 2 }
    );

    assert.match(lines[0], /2/);
    assert.match(lines[0], /1/);
});


/* ---------- idempotence (liste de jets déjà résolus) ---------- */

import {
    hasResolvedRollKey,
    markResolvedRollKey,
    getAttributeLabel
} from "../../../src/domain/rules/affliction-allocation.mjs";

test("hasResolvedRollKey lit une liste de clés, tolère l'absence de donnée", () => {
    assert.equal(hasResolvedRollKey(undefined, "m1"), false);
    assert.equal(hasResolvedRollKey(null, "m1"), false);
    assert.equal(hasResolvedRollKey("pas un tableau", "m1"), false);
    assert.equal(hasResolvedRollKey(["m1"], "m1"), true);
    assert.equal(hasResolvedRollKey(["m1"], "m2"), false);
    assert.equal(hasResolvedRollKey(["m1"], ""), false);
});

test("markResolvedRollKey ajoute la clé sans doublon et sans muter l'entrée", () => {
    const original = ["m1"];
    const next = markResolvedRollKey(original, "m2");

    assert.deepEqual(next, ["m1", "m2"]);
    assert.deepEqual(original, ["m1"]);
    assert.deepEqual(markResolvedRollKey(next, "m2"), ["m1", "m2"]);
    assert.deepEqual(markResolvedRollKey(undefined, "m1"), ["m1"]);
});

test("markResolvedRollKey borne la liste en gardant les plus récentes", () => {
    const next = markResolvedRollKey(["a", "b", "c"], "d", { max: 3 });

    assert.deepEqual(next, ["b", "c", "d"]);
});

test("getAttributeLabel traduit les 4 attributs et retombe sur l'identifiant", () => {
    assert.equal(getAttributeLabel("vigor"), "Vigueur");
    assert.equal(getAttributeLabel("agility"), "Agilité");
    assert.equal(getAttributeLabel("spirit"), "Esprit");
    assert.equal(getAttributeLabel("empathy"), "Empathie");
    assert.equal(getAttributeLabel("zzz"), "zzz");
    assert.equal(getAttributeLabel(null), "attribut");
});


/* ---------- adaptation du contexte d'une attaque de mêlée ---------- */

import {
    adaptMeleeAttackContext
} from "../../../src/domain/rules/affliction-allocation.mjs";

test("adaptMeleeAttackContext : attributeId devient attribute, l'arme devient l'équipement (dé d'équipement présent)", () => {
    const context = {
        action: "melee-attack",
        skill: "closeCombat",
        attributeId: "vigor",
        weapon: { id: "w1", uuid: "Actor.a.Item.w1", name: "Machette", bonus: 1 }
    };

    const adapted = adaptMeleeAttackContext({ context, equipmentDice: 1 });

    assert.equal(adapted.attribute, "vigor");
    assert.deepEqual(adapted.equipment, {
        itemId: "w1",
        itemUuid: "Actor.a.Item.w1",
        itemName: "Machette",
        itemType: "weapon"
    });
    // contexte d'origine inchangé, autres champs conservés
    assert.equal(context.attribute, undefined);
    assert.equal(adapted.skill, "closeCombat");
});

test("adaptMeleeAttackContext : pas d'équipement si aucun dé d'équipement ou attaque à mains nues", () => {
    const withWeapon = {
        attributeId: "vigor",
        weapon: { id: "w1", name: "Machette" }
    };

    assert.equal(
        adaptMeleeAttackContext({ context: withWeapon, equipmentDice: 0 }).equipment,
        undefined
    );

    assert.equal(
        adaptMeleeAttackContext({
            context: { attributeId: "vigor", weapon: null },
            equipmentDice: 0
        }).equipment,
        undefined
    );
});

test("adaptMeleeAttackContext : respecte attribute/equipment déjà présents", () => {
    const context = {
        attribute: "agility",
        attributeId: "vigor",
        equipment: { itemId: "e1" },
        weapon: { id: "w1" }
    };

    const adapted = adaptMeleeAttackContext({ context, equipmentDice: 2 });

    assert.equal(adapted.attribute, "agility");
    assert.deepEqual(adapted.equipment, { itemId: "e1" });
});

test("adaptMeleeAttackContext : contexte absent -> objet vide", () => {
    assert.deepEqual(adaptMeleeAttackContext({ context: null }), {});
});
