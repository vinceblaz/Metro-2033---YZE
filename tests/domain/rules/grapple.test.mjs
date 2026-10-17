import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveGrapple
} from "../../../src/domain/rules/grapple.mjs";


test("resolveGrapple exige un attaquant", () => {
  assert.throws(
    () => resolveGrapple({
      target: {
        id: "target"
      }
    }),
    TypeError
  );
});


test("resolveGrapple exige une cible", () => {
  assert.throws(
    () => resolveGrapple({
      attacker: {
        id: "attacker"
      }
    }),
    TypeError
  );
});


test("un Actor ne peut pas se saisir lui-même", () => {
  assert.throws(
    () => resolveGrapple({
      attacker: {
        id: "actor-1"
      },

      target: {
        id: "actor-1"
      }
    }),
    Error
  );
});


test("resolveGrapple retourne une résolution non encore appliquée", () => {
  const result =
    resolveGrapple({
      attacker: {
        id: "attacker",
        name: "Attaquant"
      },

      target: {
        id: "target",
        name: "Cible"
      }
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


test("resolveGrapple indique qu'un état de saisie est requis", () => {
  const result =
    resolveGrapple({
      attacker: {
        id: "attacker",
        name: "Attaquant"
      },

      target: {
        id: "target",
        name: "Cible"
      }
    });

  assert.equal(
    result.reason,
    "grapple-state-required"
  );
});


test("resolveGrapple conserve l'identité minimale de l'attaquant", () => {
  const result =
    resolveGrapple({
      attacker: {
        id: "attacker-1",
        name: "Artyom",
        uuid: "Actor.attacker-1",
        extra: "ignored"
      },

      target: {
        id: "target-1",
        name: "Bandit"
      }
    });

  assert.deepEqual(
    result.attacker,
    {
      id: "attacker-1",
      name: "Artyom"
    }
  );
});


test("resolveGrapple conserve l'identité minimale de la cible", () => {
  const result =
    resolveGrapple({
      attacker: {
        id: "attacker-1",
        name: "Artyom"
      },

      target: {
        id: "target-1",
        name: "Bandit",
        uuid: "Actor.target-1",
        extra: "ignored"
      }
    });

  assert.deepEqual(
    result.target,
    {
      id: "target-1",
      name: "Bandit"
    }
  );
});


test("resolveGrapple peut conserver un nom absent sous forme undefined", () => {
  const result =
    resolveGrapple({
      attacker: {
        id: "attacker"
      },

      target: {
        id: "target"
      }
    });

  assert.deepEqual(
    result.attacker,
    {
      id: "attacker",
      name: undefined
    }
  );

  assert.deepEqual(
    result.target,
    {
      id: "target",
      name: undefined
    }
  );
});


test("resolveGrapple indique que la résolution établit une saisie", () => {
  const result =
    resolveGrapple({
      attacker: {
        id: "attacker"
      },

      target: {
        id: "target"
      }
    });

  assert.equal(
    result.establishesGrapple,
    true
  );
});


test("resolveGrapple indique que l'attaque de saisie devient disponible", () => {
  const result =
    resolveGrapple({
      attacker: {
        id: "attacker"
      },

      target: {
        id: "target"
      }
    });

  assert.equal(
    result.enablesGrappleAttack,
    true
  );
});


test("resolveGrapple retourne la structure complète attendue", () => {
  assert.deepEqual(
    resolveGrapple({
      attacker: {
        id: "attacker",
        name: "Attaquant"
      },

      target: {
        id: "target",
        name: "Cible"
      }
    }),
    {
      applied: false,
      pending: true,
      reason: "grapple-state-required",

      attacker: {
        id: "attacker",
        name: "Attaquant"
      },

      target: {
        id: "target",
        name: "Cible"
      },

      establishesGrapple: true,
      enablesGrappleAttack: true
    }
  );
});