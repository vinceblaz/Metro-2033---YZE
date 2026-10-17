import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveKnockdown
} from "../../../src/domain/rules/knockdown.mjs";


function createLivingActor(
  id = "target",
  {
    name = null,
    prone = false,
    isLivingActor = true
  } = {}
) {
  return {
    id,
    name,
    isLivingActor,

    system: {
      conditions: {
        prone
      }
    }
  };
}


test("resolveKnockdown exige une cible", () => {
  assert.throws(
    () => resolveKnockdown(),
    TypeError
  );
});


test("la cible doit être un Actor vivant", () => {
  assert.throws(
    () => resolveKnockdown({
      target: createLivingActor(
        "target",
        {
          isLivingActor: false
        }
      )
    }),
    Error
  );
});


test("une cible debout est mise à terre", () => {
  assert.deepEqual(
    resolveKnockdown({
      target: createLivingActor(
        "target",
        {
          name: "Cible",
          prone: false
        }
      )
    }),
    {
      applied: true,
      targetId: "target",
      targetName: "Cible",
      previous: false,
      current: true,
      alreadyProne: false,
      reason: "knocked-down",
      requiresPositionResolution: true
    }
  );
});


test("une cible déjà à terre n'est pas réappliquée", () => {
  assert.deepEqual(
    resolveKnockdown({
      target: createLivingActor(
        "target",
        {
          name: "Cible",
          prone: true
        }
      )
    }),
    {
      applied: false,
      targetId: "target",
      targetName: "Cible",
      previous: true,
      current: true,
      alreadyProne: true,
      reason: "already-prone",
      requiresPositionResolution: true
    }
  );
});


test("previous reflète l'état prone précédent", () => {
  const standing =
    resolveKnockdown({
      target: createLivingActor(
        "standing",
        {
          prone: false
        }
      )
    });

  const prone =
    resolveKnockdown({
      target: createLivingActor(
        "prone",
        {
          prone: true
        }
      )
    });

  assert.equal(
    standing.previous,
    false
  );

  assert.equal(
    prone.previous,
    true
  );
});


test("current vaut toujours true après résolution", () => {
  assert.equal(
    resolveKnockdown({
      target: createLivingActor(
        "standing",
        {
          prone: false
        }
      )
    }).current,
    true
  );

  assert.equal(
    resolveKnockdown({
      target: createLivingActor(
        "prone",
        {
          prone: true
        }
      )
    }).current,
    true
  );
});


test("alreadyProne reflète l'état initial de la cible", () => {
  assert.equal(
    resolveKnockdown({
      target: createLivingActor(
        "standing",
        {
          prone: false
        }
      )
    }).alreadyProne,
    false
  );

  assert.equal(
    resolveKnockdown({
      target: createLivingActor(
        "prone",
        {
          prone: true
        }
      )
    }).alreadyProne,
    true
  );
});


test("une cible sans system.conditions.prone est considérée debout", () => {
  const result =
    resolveKnockdown({
      target: {
        id: "target",
        name: "Cible",
        isLivingActor: true
      }
    });

  assert.equal(
    result.applied,
    true
  );

  assert.equal(
    result.previous,
    false
  );

  assert.equal(
    result.alreadyProne,
    false
  );

  assert.equal(
    result.reason,
    "knocked-down"
  );
});


test("seule la valeur booléenne true compte comme déjà à terre", () => {
  const result =
    resolveKnockdown({
      target: {
        id: "target",
        isLivingActor: true,

        system: {
          conditions: {
            prone: 1
          }
        }
      }
    });

  assert.equal(
    result.alreadyProne,
    false
  );

  assert.equal(
    result.applied,
    true
  );
});


test("resolveKnockdown conserve l'identité de la cible", () => {
  const result =
    resolveKnockdown({
      target: createLivingActor(
        "target-42",
        {
          name: "Bandit"
        }
      )
    });

  assert.equal(
    result.targetId,
    "target-42"
  );

  assert.equal(
    result.targetName,
    "Bandit"
  );
});


test("un nom absent reste undefined", () => {
  const result =
    resolveKnockdown({
      target: {
        id: "target",
        isLivingActor: true,

        system: {
          conditions: {
            prone: false
          }
        }
      }
    });

  assert.equal(
    result.targetName,
    undefined
  );
});


test("la résolution de position reste toujours déléguée à une autre couche", () => {
  const standing =
    resolveKnockdown({
      target: createLivingActor(
        "standing",
        {
          prone: false
        }
      )
    });

  const prone =
    resolveKnockdown({
      target: createLivingActor(
        "prone",
        {
          prone: true
        }
      )
    });

  assert.equal(
    standing.requiresPositionResolution,
    true
  );

  assert.equal(
    prone.requiresPositionResolution,
    true
  );
});


test("resolveKnockdown ne modifie pas directement l'Actor", () => {
  const target =
    createLivingActor(
      "target",
      {
        prone: false
      }
    );

  resolveKnockdown({
    target
  });

  assert.equal(
    target.system.conditions.prone,
    false
  );
});