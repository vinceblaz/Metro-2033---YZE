import test from "node:test";
import assert from "node:assert/strict";

import {
  STACKABLE_ITEM_TYPES,
  isStackableItemType,
  computeStackIdentity,
  sumAmmunitionQuantities,
  sumConsumableQuantities
} from "../../../src/domain/rules/item-stacking.mjs";


/* ============================================================
 * STACKABLE_ITEM_TYPES / isStackableItemType
 * ============================================================ */


test("seuls munition et consommable sont empilables", () => {
  assert.deepEqual(
    STACKABLE_ITEM_TYPES,
    [
      "ammunition",
      "consumable"
    ]
  );
});


test("isStackableItemType reconnaît munition et consommable", () => {
  assert.equal(isStackableItemType("ammunition"), true);
  assert.equal(isStackableItemType("consumable"), true);
});


test("isStackableItemType rejette les armes et protections", () => {
  assert.equal(isStackableItemType("weapon"), false);
  assert.equal(isStackableItemType("armor"), false);
  assert.equal(isStackableItemType("equipment"), false);
  assert.equal(isStackableItemType("talent"), false);
});


/* ============================================================
 * computeStackIdentity — validation
 * ============================================================ */


test("computeStackIdentity exige un type non vide", () => {
  assert.throws(
    () =>
      computeStackIdentity({
        type: "",
        name: "Chargeur 9mm",
        system: {}
      }),
    TypeError
  );
});


test("computeStackIdentity exige un nom non vide", () => {
  assert.throws(
    () =>
      computeStackIdentity({
        type: "ammunition",
        name: "",
        system: {}
      }),
    TypeError
  );
});


/* ============================================================
 * computeStackIdentity — types non empilables
 * ============================================================ */


test("computeStackIdentity renvoie null pour un type non empilable", () => {
  assert.equal(
    computeStackIdentity({
      type: "weapon",
      name: "Kalachnikov",
      system: {}
    }),
    null
  );
});


/* ============================================================
 * computeStackIdentity — munitions
 * ============================================================ */


test("deux munitions identiques (hors quantité) partagent la même identité", () => {
  const a =
    computeStackIdentity({
      type: "ammunition",
      name: "Chargeur 9mm",
      system: {
        ammoType: "9x18",
        quality: "standard",
        quantity: 1
      }
    });

  const b =
    computeStackIdentity({
      type: "ammunition",
      name: "Chargeur 9mm",
      system: {
        ammoType: "9x18",
        quality: "standard",
        quantity: 5
      }
    });

  assert.equal(a, b);
});


test("deux munitions de qualité différente n'ont pas la même identité", () => {
  const a =
    computeStackIdentity({
      type: "ammunition",
      name: "Chargeur 9mm",
      system: {
        ammoType: "9x18",
        quality: "standard",
        quantity: 1
      }
    });

  const b =
    computeStackIdentity({
      type: "ammunition",
      name: "Chargeur 9mm",
      system: {
        ammoType: "9x18",
        quality: "military",
        quantity: 1
      }
    });

  assert.notEqual(a, b);
});


test("deux munitions de noms différents n'ont pas la même identité", () => {
  const a =
    computeStackIdentity({
      type: "ammunition",
      name: "Chargeur 9mm",
      system: {
        ammoType: "9x18"
      }
    });

  const b =
    computeStackIdentity({
      type: "ammunition",
      name: "Chargeur 7.62mm",
      system: {
        ammoType: "9x18"
      }
    });

  assert.notEqual(a, b);
});


test("la casse et les espaces superflus du nom n'affectent pas l'identité", () => {
  const a =
    computeStackIdentity({
      type: "ammunition",
      name: "Chargeur 9mm",
      system: {}
    });

  const b =
    computeStackIdentity({
      type: "ammunition",
      name: "  chargeur 9mm  ",
      system: {}
    });

  assert.equal(a, b);
});


/* ============================================================
 * computeStackIdentity — consommables
 * ============================================================ */


test("deux consommables identiques (hors quantité) partagent la même identité", () => {
  const a =
    computeStackIdentity({
      type: "consumable",
      name: "Filtre à air",
      system: {
        unitLabel: "filtres",
        weight: 0.25,
        quantity: {
          current: 1,
          max: 1
        }
      }
    });

  const b =
    computeStackIdentity({
      type: "consumable",
      name: "Filtre à air",
      system: {
        unitLabel: "filtres",
        weight: 0.25,
        quantity: {
          current: 3,
          max: 5
        }
      }
    });

  assert.equal(a, b);
});


test("deux munitions avec une description ou des notes MJ différentes partagent la même identité", () => {
  const a =
    computeStackIdentity({
      type: "ammunition",
      name: "Chargeur 9mm",
      system: {
        ammoType: "9x18",
        quality: "standard",
        quantity: 1,
        description: "Trouvé sur un cadavre.",
        gmNotes: "Rien de spécial."
      }
    });

  const b =
    computeStackIdentity({
      type: "ammunition",
      name: "Chargeur 9mm",
      system: {
        ammoType: "9x18",
        quality: "standard",
        quantity: 5,
        description: "",
        gmNotes: "Peut-être piégé ?"
      }
    });

  assert.equal(a, b);
});


test("l'ordre des munitions compatibles n'affecte pas l'identité", () => {
  const a =
    computeStackIdentity({
      type: "ammunition",
      name: "Chargeur 9mm",
      system: {
        compatibleWeaponTypes: ["pistol", "smg"]
      }
    });

  const b =
    computeStackIdentity({
      type: "ammunition",
      name: "Chargeur 9mm",
      system: {
        compatibleWeaponTypes: ["smg", "pistol"]
      }
    });

  assert.equal(a, b);
});


test("deux consommables avec une description différente partagent la même identité", () => {
  const a =
    computeStackIdentity({
      type: "consumable",
      name: "Filtre à air",
      system: {
        unitLabel: "filtres",
        weight: 0.25,
        description: "Presque neuf.",
        special: "",
        quantity: { current: 1, max: 1 }
      }
    });

  const b =
    computeStackIdentity({
      type: "consumable",
      name: "Filtre à air",
      system: {
        unitLabel: "filtres",
        weight: 0.25,
        description: "",
        special: "Légèrement encrassé.",
        quantity: { current: 3, max: 5 }
      }
    });

  assert.equal(a, b);
});


test("deux consommables d'unitLabel différent n'ont pas la même identité", () => {
  const a =
    computeStackIdentity({
      type: "consumable",
      name: "Antidote",
      system: {
        unitLabel: "doses",
        quantity: { current: 1, max: 1 }
      }
    });

  const b =
    computeStackIdentity({
      type: "consumable",
      name: "Antidote",
      system: {
        unitLabel: "flacons",
        quantity: { current: 1, max: 1 }
      }
    });

  assert.notEqual(a, b);
});


/* ============================================================
 * sumAmmunitionQuantities
 * ============================================================ */


test("sumAmmunitionQuantities additionne des entiers positifs ou nuls", () => {
  assert.equal(
    sumAmmunitionQuantities([
      1,
      5,
      2
    ]),
    8
  );
});


test("sumAmmunitionQuantities accepte une liste vide", () => {
  assert.equal(
    sumAmmunitionQuantities([]),
    0
  );
});


test("sumAmmunitionQuantities rejette une valeur négative", () => {
  assert.throws(
    () =>
      sumAmmunitionQuantities([
        1,
        -1
      ]),
    TypeError
  );
});


test("sumAmmunitionQuantities rejette une valeur non entière", () => {
  assert.throws(
    () =>
      sumAmmunitionQuantities([
        1.5
      ]),
    TypeError
  );
});


/* ============================================================
 * sumConsumableQuantities
 * ============================================================ */


test("sumConsumableQuantities additionne current et max séparément", () => {
  const result =
    sumConsumableQuantities([
      { current: 2, max: 5 },
      { current: 3, max: 3 }
    ]);

  assert.deepEqual(
    result,
    {
      current: 5,
      max: 8
    }
  );
});


test("sumConsumableQuantities accepte une liste vide", () => {
  assert.deepEqual(
    sumConsumableQuantities([]),
    {
      current: 0,
      max: 0
    }
  );
});


test("sumConsumableQuantities rejette une entrée où current dépasse max", () => {
  assert.throws(
    () =>
      sumConsumableQuantities([
        { current: 4, max: 3 }
      ]),
    RangeError
  );
});


test("sumConsumableQuantities rejette une valeur négative", () => {
  assert.throws(
    () =>
      sumConsumableQuantities([
        { current: -1, max: 3 }
      ]),
    TypeError
  );
});
