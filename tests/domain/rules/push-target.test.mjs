import test from "node:test";
import assert from "node:assert/strict";

import {
  resolvePushTarget
} from "../../../src/domain/rules/push-target.mjs";


function createActor(
  id,
  {
    name = null
  } = {}
) {
  return {
    id,
    name
  };
}


test("resolvePushTarget exige un attaquant", () => {
  assert.throws(
    () => resolvePushTarget({
      target: createActor("target")
    }),
    TypeError
  );
});


test("resolvePushTarget exige une cible", () => {
  assert.throws(
    () => resolvePushTarget({
      attacker: createActor("attacker")
    }),
    TypeError
  );
});


test("un Actor ne peut pas se repousser lui-même", () => {
  const actor =
    createActor("actor-1");

  assert.throws(
    () => resolvePushTarget({
      attacker: actor,
      target: actor
    }),
    Error
  );
});


test("un repoussement valide n'est pas appliqué immédiatement", () => {
  const result =
    resolvePushTarget({
      attacker: createActor("attacker"),
      target: createActor("target")
    });

  assert.equal(
    result.applied,
    false
  );

  assert.equal(
    result.pending,
    true
  );
});


test("le repoussement indique qu'un déplacement de Token est requis", () => {
  const result =
    resolvePushTarget({
      attacker: createActor("attacker"),
      target: createActor("target")
    });

  assert.equal(
    result.reason,
    "token-movement-required"
  );

  assert.equal(
    result.requiresTokenMovement,
    true
  );
});


test("le resolver ne fixe aucune distance de déplacement", () => {
  const result =
    resolvePushTarget({
      attacker: createActor("attacker"),
      target: createActor("target")
    });

  assert.equal(
    result.distance,
    null
  );
});


test("resolvePushTarget conserve l'identité de l'attaquant", () => {
  const result =
    resolvePushTarget({
      attacker: createActor(
        "attacker-1",
        {
          name: "Artyom"
        }
      ),

      target: createActor(
        "target-1",
        {
          name: "Bandit"
        }
      )
    });

  assert.deepEqual(
    result.attacker,
    {
      id: "attacker-1",
      name: "Artyom"
    }
  );
});


test("resolvePushTarget conserve l'identité de la cible", () => {
  const result =
    resolvePushTarget({
      attacker: createActor(
        "attacker-1",
        {
          name: "Artyom"
        }
      ),

      target: createActor(
        "target-1",
        {
          name: "Bandit"
        }
      )
    });

  assert.deepEqual(
    result.target,
    {
      id: "target-1",
      name: "Bandit"
    }
  );
});


test("les noms absents restent undefined", () => {
  const result =
    resolvePushTarget({
      attacker: {
        id: "attacker"
      },

      target: {
        id: "target"
      }
    });

  assert.equal(
    result.attacker.name,
    undefined
  );

  assert.equal(
    result.target.name,
    undefined
  );
});


test("le resolver ne copie pas les propriétés étrangères des Actors", () => {
  const result =
    resolvePushTarget({
      attacker: {
        id: "attacker",
        name: "Attaquant",
        uuid: "Actor.attacker",
        extra: true
      },

      target: {
        id: "target",
        name: "Cible",
        uuid: "Actor.target",
        extra: true
      }
    });

  assert.deepEqual(
    result.attacker,
    {
      id: "attacker",
      name: "Attaquant"
    }
  );

  assert.deepEqual(
    result.target,
    {
      id: "target",
      name: "Cible"
    }
  );
});


test("resolvePushTarget retourne la structure complète attendue", () => {
  assert.deepEqual(
    resolvePushTarget({
      attacker: createActor(
        "attacker",
        {
          name: "Attaquant"
        }
      ),

      target: createActor(
        "target",
        {
          name: "Cible"
        }
      )
    }),
    {
      applied: false,
      pending: true,
      reason: "token-movement-required",

      attacker: {
        id: "attacker",
        name: "Attaquant"
      },

      target: {
        id: "target",
        name: "Cible"
      },

      requiresTokenMovement: true,
      distance: null
    }
  );
});