import test from "node:test";
import assert from "node:assert/strict";

import {
  KNOCKDOWN_MODES,
  resolveKnockdownChoice
} from "../../../src/domain/rules/knockdown-choice.mjs";


function createLivingActor(
  id = "target",
  {
    name = null,
    isLivingActor = true
  } = {}
) {
  return {
    id,
    name,
    isLivingActor
  };
}


test("KNOCKDOWN_MODES expose les deux modes attendus", () => {
  assert.deepEqual(
    KNOCKDOWN_MODES,
    {
      PRONE: "prone",
      PUSH: "push"
    }
  );
});


test("KNOCKDOWN_MODES est gelé", () => {
  assert.equal(
    Object.isFrozen(KNOCKDOWN_MODES),
    true
  );
});


test("resolveKnockdownChoice exige une cible", () => {
  assert.throws(
    () => resolveKnockdownChoice(),
    TypeError
  );
});


test("la cible doit être un Actor vivant", () => {
  assert.throws(
    () => resolveKnockdownChoice({
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


test("sans mode choisi, une décision est requise", () => {
  assert.deepEqual(
    resolveKnockdownChoice({
      target: createLivingActor(
        "target",
        {
          name: "Cible"
        }
      )
    }),
    {
      resolved: false,
      requiresChoice: true,
      targetId: "target",
      targetName: "Cible",
      availableModes: [
        "prone",
        "push"
      ],
      mode: null
    }
  );
});


test("sans choix, les deux modes sont disponibles dans l'ordre attendu", () => {
  const result =
    resolveKnockdownChoice({
      target: createLivingActor()
    });

  assert.deepEqual(
    result.availableModes,
    [
      KNOCKDOWN_MODES.PRONE,
      KNOCKDOWN_MODES.PUSH
    ]
  );
});


test("un mode inconnu est refusé", () => {
  assert.throws(
    () => resolveKnockdownChoice({
      target: createLivingActor(),
      mode: "unknown"
    }),
    Error
  );
});


test("le mode prone résout la mise à terre", () => {
  assert.deepEqual(
    resolveKnockdownChoice({
      target: createLivingActor(
        "target",
        {
          name: "Cible"
        }
      ),
      mode: KNOCKDOWN_MODES.PRONE
    }),
    {
      resolved: true,
      requiresChoice: false,
      mode: "prone",
      targetId: "target",
      targetName: "Cible",
      applyProne: true,
      requiresTokenMovement: false
    }
  );
});


test("le mode push demande un déplacement de Token sans appliquer prone", () => {
  assert.deepEqual(
    resolveKnockdownChoice({
      target: createLivingActor(
        "target",
        {
          name: "Cible"
        }
      ),
      mode: KNOCKDOWN_MODES.PUSH
    }),
    {
      resolved: true,
      requiresChoice: false,
      mode: "push",
      targetId: "target",
      targetName: "Cible",
      applyProne: false,
      requiresTokenMovement: true
    }
  );
});


test("le mode push ne fixe aucune distance de déplacement", () => {
  const result =
    resolveKnockdownChoice({
      target: createLivingActor(),
      mode: KNOCKDOWN_MODES.PUSH
    });

  assert.equal(
    "distance" in result,
    false
  );

  assert.equal(
    "pushDistance" in result,
    false
  );
});


test("resolveKnockdownChoice conserve l'identité de la cible", () => {
  const result =
    resolveKnockdownChoice({
      target: createLivingActor(
        "target-42",
        {
          name: "Bandit"
        }
      ),
      mode: KNOCKDOWN_MODES.PRONE
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
    resolveKnockdownChoice({
      target: {
        id: "target",
        isLivingActor: true
      }
    });

  assert.equal(
    result.targetName,
    undefined
  );
});