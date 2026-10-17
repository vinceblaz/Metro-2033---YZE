import test from "node:test";
import assert from "node:assert/strict";

import {
  GRAPPLE_ACTIONS,
  getGrappleRole,
  canMoveDuringGrapple,
  canPerformActionDuringGrapple,
  getGrappleActionState
} from "../../../src/domain/rules/grapple-actions.mjs";


function createGrapple({
  active = true,
  attackerId = "attacker",
  targetId = "target",
  useActorId = false
} = {}) {

  return {
    state: {
      active,

      attacker: useActorId
        ? { actorId: attackerId }
        : { id: attackerId },

      target: useActorId
        ? { actorId: targetId }
        : { id: targetId }
    }
  };

}


test("GRAPPLE_ACTIONS expose les trois actions de saisie attendues", () => {
  assert.deepEqual(
    GRAPPLE_ACTIONS,
    {
      ESCAPE: "grapple-escape",
      ATTACK: "grapple-attack",
      RELEASE: "grapple-release"
    }
  );
});


test("GRAPPLE_ACTIONS est gelé", () => {
  assert.equal(
    Object.isFrozen(GRAPPLE_ACTIONS),
    true
  );
});


test("getGrappleRole retourne null sans saisie", () => {
  assert.equal(
    getGrappleRole(
      null,
      { id: "attacker" }
    ),
    null
  );
});


test("getGrappleRole retourne null si la saisie est inactive", () => {
  assert.equal(
    getGrappleRole(
      createGrapple({
        active: false
      }),
      { id: "attacker" }
    ),
    null
  );
});


test("getGrappleRole retourne null sans Actor", () => {
  assert.equal(
    getGrappleRole(
      createGrapple(),
      null
    ),
    null
  );
});


test("getGrappleRole retourne null si l'Actor n'a pas d'identifiant", () => {
  assert.equal(
    getGrappleRole(
      createGrapple(),
      {}
    ),
    null
  );
});


test("getGrappleRole reconnaît le saisisseur avec id", () => {
  assert.equal(
    getGrappleRole(
      createGrapple(),
      { id: "attacker" }
    ),
    "attacker"
  );
});


test("getGrappleRole reconnaît la cible avec id", () => {
  assert.equal(
    getGrappleRole(
      createGrapple(),
      { id: "target" }
    ),
    "target"
  );
});


test("getGrappleRole accepte actorId dans l'état de saisie", () => {
  const grapple =
    createGrapple({
      useActorId: true
    });

  assert.equal(
    getGrappleRole(
      grapple,
      { id: "attacker" }
    ),
    "attacker"
  );

  assert.equal(
    getGrappleRole(
      grapple,
      { id: "target" }
    ),
    "target"
  );
});


test("getGrappleRole accepte actorId sur l'Actor interrogé", () => {
  const grapple =
    createGrapple();

  assert.equal(
    getGrappleRole(
      grapple,
      { actorId: "attacker" }
    ),
    "attacker"
  );

  assert.equal(
    getGrappleRole(
      grapple,
      { actorId: "target" }
    ),
    "target"
  );
});


test("getGrappleRole retourne null pour un Actor extérieur à la saisie", () => {
  assert.equal(
    getGrappleRole(
      createGrapple(),
      { id: "outsider" }
    ),
    null
  );
});


test("la cible saisie ne peut pas se déplacer", () => {
  assert.equal(
    canMoveDuringGrapple(
      createGrapple(),
      { id: "target" }
    ),
    false
  );
});


test("le saisisseur peut actuellement se déplacer", () => {
  assert.equal(
    canMoveDuringGrapple(
      createGrapple(),
      { id: "attacker" }
    ),
    true
  );
});


test("un Actor extérieur à la saisie peut se déplacer", () => {
  assert.equal(
    canMoveDuringGrapple(
      createGrapple(),
      { id: "outsider" }
    ),
    true
  );
});


test("la cible saisie ne peut effectuer que l'action de libération", () => {
  const grapple =
    createGrapple();

  const actor = {
    id: "target"
  };

  assert.equal(
    canPerformActionDuringGrapple(
      grapple,
      actor,
      GRAPPLE_ACTIONS.ESCAPE
    ),
    true
  );

  assert.equal(
    canPerformActionDuringGrapple(
      grapple,
      actor,
      GRAPPLE_ACTIONS.ATTACK
    ),
    false
  );

  assert.equal(
    canPerformActionDuringGrapple(
      grapple,
      actor,
      GRAPPLE_ACTIONS.RELEASE
    ),
    false
  );

  assert.equal(
    canPerformActionDuringGrapple(
      grapple,
      actor,
      "some-other-action"
    ),
    false
  );
});


test("le saisisseur ne peut pas effectuer l'action de libération de la cible", () => {
  assert.equal(
    canPerformActionDuringGrapple(
      createGrapple(),
      { id: "attacker" },
      GRAPPLE_ACTIONS.ESCAPE
    ),
    false
  );
});


test("le saisisseur peut effectuer l'attaque de saisie", () => {
  assert.equal(
    canPerformActionDuringGrapple(
      createGrapple(),
      { id: "attacker" },
      GRAPPLE_ACTIONS.ATTACK
    ),
    true
  );
});


test("le saisisseur peut relâcher la cible", () => {
  assert.equal(
    canPerformActionDuringGrapple(
      createGrapple(),
      { id: "attacker" },
      GRAPPLE_ACTIONS.RELEASE
    ),
    true
  );
});


test("le comportement actuel autorise les autres actions du saisisseur", () => {
  assert.equal(
    canPerformActionDuringGrapple(
      createGrapple(),
      { id: "attacker" },
      "some-other-action"
    ),
    true
  );
});


test("un Actor extérieur à la saisie n'est soumis à aucune restriction d'action", () => {
  assert.equal(
    canPerformActionDuringGrapple(
      createGrapple(),
      { id: "outsider" },
      "some-other-action"
    ),
    true
  );
});


test("getGrappleActionState retourne un état libre pour un Actor extérieur", () => {
  assert.deepEqual(
    getGrappleActionState(
      createGrapple(),
      { id: "outsider" }
    ),
    {
      grappled: false,
      role: null,
      canMove: true,
      onlyAction: null,

      actions: {
        escape: false,
        attack: false,
        release: false
      }
    }
  );
});


test("getGrappleActionState décrit les restrictions de la cible saisie", () => {
  assert.deepEqual(
    getGrappleActionState(
      createGrapple(),
      { id: "target" }
    ),
    {
      grappled: true,
      role: "target",
      canMove: false,
      onlyAction: GRAPPLE_ACTIONS.ESCAPE,

      actions: {
        escape: true,
        attack: false,
        release: false
      }
    }
  );
});


test("getGrappleActionState décrit les possibilités du saisisseur", () => {
  assert.deepEqual(
    getGrappleActionState(
      createGrapple(),
      { id: "attacker" }
    ),
    {
      grappled: true,
      role: "attacker",
      canMove: true,
      onlyAction: null,

      actions: {
        escape: false,
        attack: true,
        release: true
      }
    }
  );
});


test("une saisie inactive produit un état libre", () => {
  assert.deepEqual(
    getGrappleActionState(
      createGrapple({
        active: false
      }),
      { id: "target" }
    ),
    {
      grappled: false,
      role: null,
      canMove: true,
      onlyAction: null,

      actions: {
        escape: false,
        attack: false,
        release: false
      }
    }
  );
});