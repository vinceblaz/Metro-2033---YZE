import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveDisarm
} from "../../../src/domain/rules/disarm.mjs";


function createTarget(
  id = "target"
) {
  return {
    id
  };
}


function createItem({
  id = "item",
  name = "Arme",
  ownerId = "target",
  equipped = true,
  includeEquipped = true
} = {}) {

  return {
    id,
    name,

    actor: {
      id: ownerId
    },

    system: includeEquipped
      ? {
          equipped
        }
      : {}
  };

}


test("resolveDisarm exige une cible", () => {
  assert.throws(
    () => resolveDisarm(),
    TypeError
  );
});


test("sans objet choisi, le désarmement demande une décision", () => {
  assert.deepEqual(
    resolveDisarm({
      target: createTarget()
    }),
    {
      applied: false,
      requiresChoice: true,
      reason: "item-required",
      targetId: "target",
      itemId: null,
      itemName: null
    }
  );
});


test("sans objet choisi, le resolver conserve l'identifiant de la cible", () => {
  const result =
    resolveDisarm({
      target: createTarget("target-42")
    });

  assert.equal(
    result.targetId,
    "target-42"
  );
});


test("l'objet à désarmer doit appartenir à la cible", () => {
  assert.throws(
    () => resolveDisarm({
      target: createTarget("target"),

      item: createItem({
        ownerId: "other-actor"
      })
    }),
    Error
  );
});


test("un objet sans état equipped ne peut pas être désarmé", () => {
  assert.throws(
    () => resolveDisarm({
      target: createTarget(),

      item: createItem({
        includeEquipped: false
      })
    }),
    Error
  );
});


test("un état equipped non booléen est refusé", () => {
  assert.throws(
    () => resolveDisarm({
      target: createTarget(),

      item: {
        id: "item",
        name: "Arme",

        actor: {
          id: "target"
        },

        system: {
          equipped: 1
        }
      }
    }),
    Error
  );

  assert.throws(
    () => resolveDisarm({
      target: createTarget(),

      item: {
        id: "item",
        name: "Arme",

        actor: {
          id: "target"
        },

        system: {
          equipped: "true"
        }
      }
    }),
    Error
  );
});


test("un objet appartenant à la cible mais non équipé n'est pas désarmé", () => {
  assert.deepEqual(
    resolveDisarm({
      target: createTarget(),

      item: createItem({
        id: "weapon-1",
        name: "Pistolet",
        equipped: false
      })
    }),
    {
      applied: false,
      requiresChoice: false,
      reason: "not-equipped",
      targetId: "target",
      itemId: "weapon-1",
      itemName: "Pistolet"
    }
  );
});


test("un objet équipé appartenant à la cible peut être désarmé", () => {
  assert.deepEqual(
    resolveDisarm({
      target: createTarget(),

      item: createItem({
        id: "weapon-1",
        name: "Pistolet",
        equipped: true
      })
    }),
    {
      applied: true,
      requiresChoice: false,
      reason: "disarmed",
      targetId: "target",
      itemId: "weapon-1",
      itemName: "Pistolet"
    }
  );
});


test("le resolver conserve l'identité de l'objet désarmé", () => {
  const result =
    resolveDisarm({
      target: createTarget("target-1"),

      item: createItem({
        id: "ak-74",
        name: "AK-74",
        ownerId: "target-1",
        equipped: true
      })
    });

  assert.equal(
    result.targetId,
    "target-1"
  );

  assert.equal(
    result.itemId,
    "ak-74"
  );

  assert.equal(
    result.itemName,
    "AK-74"
  );
});


test("le resolver ne modifie pas directement l'état equipped de l'objet", () => {
  const item =
    createItem({
      equipped: true
    });

  resolveDisarm({
    target: createTarget(),
    item
  });

  assert.equal(
    item.system.equipped,
    true
  );
});


test("un objet avec un nom absent reste désarmable", () => {
  const item =
    createItem({
      equipped: true
    });

  delete item.name;

  const result =
    resolveDisarm({
      target: createTarget(),
      item
    });

  assert.equal(
    result.applied,
    true
  );

  assert.equal(
    result.itemName,
    undefined
  );
});