import test from "node:test";
import assert from "node:assert/strict";

import {
  createGrappleState,
  isActiveGrappleState
} from "../../../src/domain/rules/grapple-state.mjs";


function createActor(
  id,
  {
    uuid = null,
    name = null
  } = {}
) {
  return {
    id,
    uuid,
    name
  };
}


test("createGrappleState exige un saisisseur", () => {
  assert.throws(
    () => createGrappleState({
      target: createActor("target")
    }),
    TypeError
  );
});


test("createGrappleState exige une cible", () => {
  assert.throws(
    () => createGrappleState({
      attacker: createActor("attacker")
    }),
    TypeError
  );
});


test("un Actor ne peut pas se saisir lui-même", () => {
  const actor =
    createActor(
      "actor-1"
    );

  assert.throws(
    () => createGrappleState({
      attacker: actor,
      target: actor
    }),
    Error
  );
});


test("createGrappleState crée un état de saisie actif", () => {
  const result =
    createGrappleState({
      attacker: createActor(
        "attacker-1",
        {
          uuid: "Actor.attacker-1",
          name: "Attaquant"
        }
      ),

      target: createActor(
        "target-1",
        {
          uuid: "Actor.target-1",
          name: "Cible"
        }
      )
    });

  assert.equal(
    result.active,
    true
  );

  assert.deepEqual(
    result.attacker,
    {
      id: "attacker-1",
      uuid: "Actor.attacker-1",
      name: "Attaquant"
    }
  );

  assert.deepEqual(
    result.target,
    {
      id: "target-1",
      uuid: "Actor.target-1",
      name: "Cible"
    }
  );
});


test("les snapshots Actor utilisent null pour uuid et name absents", () => {
  const result =
    createGrappleState({
      attacker: {
        id: "attacker-1"
      },

      target: {
        id: "target-1"
      }
    });

  assert.deepEqual(
    result.attacker,
    {
      id: "attacker-1",
      uuid: null,
      name: null
    }
  );

  assert.deepEqual(
    result.target,
    {
      id: "target-1",
      uuid: null,
      name: null
    }
  );
});


test("une saisie applique les conséquences immédiates prévues", () => {
  const result =
    createGrappleState({
      attacker: createActor("attacker"),
      target: createActor("target")
    });

  assert.deepEqual(
    result.consequences,
    {
      attackerProne: true,
      targetProne: true,
      targetDropsHeldWeapon: true,
      targetMovementLocked: true
    }
  );
});


test("le saisisseur ne peut que relâcher ou effectuer une attaque de saisie", () => {
  const result =
    createGrappleState({
      attacker: createActor("attacker"),
      target: createActor("target")
    });

  assert.deepEqual(
    result.attackerActions,
    {
      release: true,
      grappleAttack: true,
      otherActions: false
    }
  );
});


test("la cible ne peut que tenter de se libérer", () => {
  const result =
    createGrappleState({
      attacker: createActor("attacker"),
      target: createActor("target")
    });

  assert.deepEqual(
    result.targetActions,
    {
      escape: true,
      otherActions: false
    }
  );
});


test("l'attaque de saisie est une action rapide à mains nues non bloquable", () => {
  const result =
    createGrappleState({
      attacker: createActor("attacker"),
      target: createActor("target")
    });

  assert.deepEqual(
    result.grappleAttack,
    {
      actionCost: "fast",
      attackType: "unarmed",
      skill: "closeCombat",
      blockable: false
    }
  );
});


test("la tentative de libération est une action lente opposée de Vigueur", () => {
  const result =
    createGrappleState({
      attacker: createActor("attacker"),
      target: createActor("target")
    });

  assert.deepEqual(
    result.escape,
    {
      actionCost: "slow",
      opposed: true,
      attackerAttribute: "vigor",
      targetAttribute: "vigor"
    }
  );
});


test("isActiveGrappleState reconnaît un état de saisie valide", () => {
  const state =
    createGrappleState({
      attacker: createActor("attacker"),
      target: createActor("target")
    });

  assert.equal(
    isActiveGrappleState(state),
    true
  );
});


test("isActiveGrappleState rejette une valeur absente ou non objet", () => {
  assert.equal(
    isActiveGrappleState(),
    false
  );

  assert.equal(
    isActiveGrappleState(null),
    false
  );

  assert.equal(
    isActiveGrappleState("grapple"),
    false
  );
});


test("isActiveGrappleState exige active à true", () => {
  assert.equal(
    isActiveGrappleState({
      active: false,
      attacker: {
        id: "attacker"
      },
      target: {
        id: "target"
      }
    }),
    false
  );
});


test("isActiveGrappleState exige un saisisseur et une cible identifiables", () => {
  assert.equal(
    isActiveGrappleState({
      active: true,
      attacker: {},
      target: {
        id: "target"
      }
    }),
    false
  );

  assert.equal(
    isActiveGrappleState({
      active: true,
      attacker: {
        id: "attacker"
      },
      target: {}
    }),
    false
  );
});


test("isActiveGrappleState rejette un saisisseur identique à la cible", () => {
  assert.equal(
    isActiveGrappleState({
      active: true,
      attacker: {
        id: "actor-1"
      },
      target: {
        id: "actor-1"
      }
    }),
    false
  );
});


test("isActiveGrappleState accepte aussi la forme actorId", () => {
  assert.equal(
    isActiveGrappleState({
      active: true,
      attacker: {
        actorId: "attacker"
      },
      target: {
        actorId: "target"
      }
    }),
    true
  );
});


