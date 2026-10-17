import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveGrappleAttackEligibility,
  createGrappleAttackContext
} from "../../../src/domain/rules/grapple-attack.mjs";


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


test("sans saisie, l'attaque de saisie n'est pas éligible", () => {
  assert.deepEqual(
    resolveGrappleAttackEligibility({
      attacker: createActor("attacker"),
      target: createActor("target")
    }),
    {
      eligible: false,
      reason: "grapple-required"
    }
  );
});


test("avec une saisie présente, un attaquant est requis", () => {
  assert.throws(
    () => resolveGrappleAttackEligibility({
      grapple: {
        state: {
          active: true
        }
      },

      target: createActor("target")
    }),
    TypeError
  );
});


test("avec une saisie présente, une cible est requise", () => {
  assert.throws(
    () => resolveGrappleAttackEligibility({
      grapple: {
        state: {
          active: true
        }
      },

      attacker: createActor("attacker")
    }),
    TypeError
  );
});


test("l'attaquant et la cible doivent être différents", () => {
  const actor =
    createActor("actor-1");

  assert.throws(
    () => resolveGrappleAttackEligibility({
      grapple: {
        state: {
          active: true
        }
      },

      attacker: actor,
      target: actor
    }),
    Error
  );
});


test("une saisie inactive interdit l'attaque de saisie", () => {
  assert.deepEqual(
    resolveGrappleAttackEligibility({
      grapple: {
        state: {
          active: false
        }
      },

      attacker: createActor("attacker"),
      target: createActor("target")
    }),
    {
      eligible: false,
      reason: "grapple-inactive"
    }
  );
});


test("le resolver accepte directement un état de saisie sans wrapper state", () => {
  const result =
    resolveGrappleAttackEligibility({
      grapple: {
        active: true,

        attacker: {
          actorId: "attacker"
        },

        target: {
          actorId: "target"
        }
      },

      attacker: createActor("attacker"),
      target: createActor("target")
    });

  assert.equal(
    result.eligible,
    true
  );
});


test("un Actor différent du saisisseur n'est pas éligible", () => {
  assert.deepEqual(
    resolveGrappleAttackEligibility({
      grapple: {
        state: {
          active: true,

          attacker: {
            actorId: "real-attacker"
          },

          target: {
            actorId: "target"
          }
        }
      },

      attacker: createActor("other-attacker"),
      target: createActor("target")
    }),
    {
      eligible: false,
      reason: "not-grapple-attacker"
    }
  );
});


test("un Actor différent de la cible saisie n'est pas éligible", () => {
  assert.deepEqual(
    resolveGrappleAttackEligibility({
      grapple: {
        state: {
          active: true,

          attacker: {
            actorId: "attacker"
          },

          target: {
            actorId: "real-target"
          }
        }
      },

      attacker: createActor("attacker"),
      target: createActor("other-target")
    }),
    {
      eligible: false,
      reason: "not-grapple-target"
    }
  );
});


test("une saisie active avec actorId rend l'attaque de saisie éligible", () => {
  assert.deepEqual(
    resolveGrappleAttackEligibility({
      grapple: {
        state: {
          active: true,

          attacker: {
            actorId: "attacker"
          },

          target: {
            actorId: "target"
          }
        }
      },

      attacker: createActor("attacker"),
      target: createActor("target")
    }),
    {
      eligible: true,
      reason: null,

      action: {
        id: "grapple-attack",
        cost: "fast",
        attackType: "unarmed",
        skill: "closeCombat",
        attribute: "vigor",
        blockable: false
      }
    }
  );
});


test("le comportement actuel ne reconnaît pas les identités stockées uniquement sous id", () => {
  assert.deepEqual(
    resolveGrappleAttackEligibility({
      grapple: {
        state: {
          active: true,

          attacker: {
            id: "attacker"
          },

          target: {
            id: "target"
          }
        }
      },

      attacker: createActor("attacker"),
      target: createActor("target")
    }),
    {
      eligible: false,
      reason: "not-grapple-attacker"
    }
  );
});


test("createGrappleAttackContext retourne un échec si l'attaque n'est pas éligible", () => {
  const result =
    createGrappleAttackContext({
      grapple: {
        state: {
          active: false
        }
      },

      attacker: createActor("attacker"),
      target: createActor("target")
    });

  assert.deepEqual(
    result,
    {
      created: false,

      eligibility: {
        eligible: false,
        reason: "grapple-inactive"
      },

      context: null
    }
  );
});


test("createGrappleAttackContext crée le contexte d'une attaque de saisie éligible", () => {
  const result =
    createGrappleAttackContext({
      grapple: {
        id: "grapple-1",

        state: {
          active: true,

          attacker: {
            actorId: "attacker"
          },

          target: {
            actorId: "target"
          }
        }
      },

      attacker: createActor(
        "attacker",
        {
          uuid: "Actor.attacker",
          name: "Attaquant"
        }
      ),

      target: createActor(
        "target",
        {
          uuid: "Actor.target",
          name: "Cible"
        }
      )
    });

  assert.equal(
    result.created,
    true
  );

  assert.equal(
    result.eligibility.eligible,
    true
  );

  assert.deepEqual(
    result.context,
    {
      action: "grapple-attack",

      attacker: {
        id: "attacker",
        uuid: "Actor.attacker",
        name: "Attaquant"
      },

      target: {
        id: "target",
        uuid: "Actor.target",
        name: "Cible"
      },

      attack: {
        type: "unarmed",
        blockable: false
      },

      actionCost: "fast",
      skill: "closeCombat",
      attributeId: "vigor",
      grappleId: "grapple-1"
    }
  );
});


test("le contexte utilise null pour uuid et name absents", () => {
  const result =
    createGrappleAttackContext({
      grapple: {
        state: {
          active: true,

          attacker: {
            actorId: "attacker"
          },

          target: {
            actorId: "target"
          }
        }
      },

      attacker: {
        id: "attacker"
      },

      target: {
        id: "target"
      }
    });

  assert.deepEqual(
    result.context.attacker,
    {
      id: "attacker",
      uuid: null,
      name: null
    }
  );

  assert.deepEqual(
    result.context.target,
    {
      id: "target",
      uuid: null,
      name: null
    }
  );
});


test("grappleId vaut null si la saisie n'a pas d'identifiant", () => {
  const result =
    createGrappleAttackContext({
      grapple: {
        state: {
          active: true,

          attacker: {
            actorId: "attacker"
          },

          target: {
            actorId: "target"
          }
        }
      },

      attacker: createActor("attacker"),
      target: createActor("target")
    });

  assert.equal(
    result.context.grappleId,
    null
  );
});


test("le contexte d'attaque de saisie conserve les paramètres mécaniques attendus", () => {
  const result =
    createGrappleAttackContext({
      grapple: {
        state: {
          active: true,

          attacker: {
            actorId: "attacker"
          },

          target: {
            actorId: "target"
          }
        }
      },

      attacker: createActor("attacker"),
      target: createActor("target")
    });

  assert.equal(
    result.context.action,
    "grapple-attack"
  );

  assert.equal(
    result.context.attack.type,
    "unarmed"
  );

  assert.equal(
    result.context.attack.blockable,
    false
  );

  assert.equal(
    result.context.actionCost,
    "fast"
  );

  assert.equal(
    result.context.skill,
    "closeCombat"
  );

  assert.equal(
    result.context.attributeId,
    "vigor"
  );
});