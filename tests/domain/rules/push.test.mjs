import test from "node:test";
import assert from "node:assert/strict";

import { DicePool } from "../../../src/domain/rolls/dice-pool.mjs";
import { YZEResult } from "../../../src/domain/rolls/yze-result.mjs";
import {
  pushMetroRoll,
  METRO_MAX_PUSHES
} from "../../../src/domain/rules/push.mjs";


function makeResult({
  pushCount = 0,
  dice = {},
  stressAfflictions = 0,
  eliminatedStress = 0,
  context = {}
} = {}) {
  return new YZEResult({
    pool: new DicePool({
      attribute: 3,
      skill: 2,
      stress: 1
    }),

    dice: {
      attribute: [6, 2, 3],
      skill: [4, 5],
      stress: [2],
      ...dice
    },

    successes: 1,
    pushCount,
    stressAfflictions,
    eliminatedStress,
    context,

    history: [
      {
        type: "initial",
        pushCount: 0
      }
    ]
  });
}


function makeActor({
  added = 1,
  exceedsLimit = false
} = {}) {
  return {
    addedStress: [],
    removedStress: [],

    async addStress(n) {
      this.addedStress.push(n);

      return {
        added,
        exceedsLimit
      };
    },

    async removeStress(n) {
      this.removedStress.push(n);
      return n;
    }
  };
}


/*
 * Permet de rendre Math.random déterministe pendant un test.
 *
 * Les valeurs fournies correspondent directement
 * aux faces de D6 souhaitées.
 */
async function withRandom(values, fn) {
  const originalRandom = Math.random;
  let index = 0;

  Math.random = () => {
    const value = values[index++] ?? 3;

    return (value - 0.5) / 6;
  };

  try {
    return await fn();
  }
  finally {
    Math.random = originalRandom;
  }
}


test("Métro autorise au maximum deux Push", () => {
  assert.equal(
    METRO_MAX_PUSHES,
    2
  );
});


test("pushMetroRoll exige un Actor et un résultat", async () => {
  await assert.rejects(
    () => pushMetroRoll(
      null,
      makeResult()
    ),
    TypeError
  );

  await assert.rejects(
    () => pushMetroRoll(
      makeActor(),
      null
    ),
    TypeError
  );
});


test("le premier Push est gratuit et passe pushCount à 1", async () => {
  const actor = makeActor();
  const result = makeResult();

  const pushed = await withRandom(
    [2, 3, 4, 5, 2],
    () => pushMetroRoll(
      actor,
      result
    )
  );

  assert.equal(
    pushed.pushCount,
    1
  );

  assert.deepEqual(
    actor.addedStress,
    []
  );
});


test("le premier Push conserve les 6 et relance les autres dés normaux", async () => {
  const actor = makeActor();

  const result = makeResult({
    dice: {
      attribute: [6, 2],
      skill: [3],
      stress: []
    }
  });

  const pushed = await withRandom(
    [1, 4],
    () => pushMetroRoll(
      actor,
      result
    )
  );

  assert.deepEqual(
    pushed.attributeResults,
    [6, 1]
  );

  assert.deepEqual(
    pushed.skillResults,
    [4]
  );
});


test("un 6 de Stress obtenu pendant le premier Push retire du Stress à l'Actor", async () => {
  const actor = makeActor();

  const result = makeResult({
    dice: {
      attribute: [6],
      skill: [],
      stress: [2]
    }
  });

  const pushed = await withRandom(
    [6],
    () => pushMetroRoll(
      actor,
      result
    )
  );

  assert.equal(
    pushed.eliminatedStress,
    1
  );

  assert.deepEqual(
    pushed.stressDice,
    []
  );

  assert.deepEqual(
    actor.removedStress,
    [1]
  );
});


test("le second Push est refusé sans paiement en Stress", async () => {
  const actor = makeActor();

  const result = makeResult({
    pushCount: 1
  });

  await assert.rejects(
    () => pushMetroRoll(
      actor,
      result
    ),
    /second Push nécessite de subir un dé de Stress/
  );

  assert.deepEqual(
    actor.addedStress,
    []
  );
});


test("le second Push payé ajoute le Stress avant la relance et marque le contexte Métro", async () => {
  const actor = makeActor({
    added: 1,
    exceedsLimit: false
  });

  const result = makeResult({
    pushCount: 1,

    dice: {
      attribute: [6],
      skill: [],
      stress: [2]
    },

    context: {
      action: "test"
    }
  });

  const pushed = await withRandom(
    [3, 4],
    () => pushMetroRoll(
      actor,
      result,
      {
        useStress: true
      }
    )
  );

  assert.equal(
    pushed.pushCount,
    2
  );

  assert.deepEqual(
    actor.addedStress,
    [1]
  );

  assert.equal(
    pushed.stressDice.length,
    2
  );

  assert.equal(
    pushed.context.action,
    "test"
  );

  assert.deepEqual(
    pushed.context.metro,
    {
      secondPush: true,
      stressCost: true,
      stressAdded: 1,
      stressLimitExceeded: false
    }
  );
});


test("si la limite de Stress est atteinte, le second Push n'ajoute pas de dé mais conserve l'information", async () => {
  const actor = makeActor({
    added: 0,
    exceedsLimit: true
  });

  const result = makeResult({
    pushCount: 1,

    dice: {
      attribute: [6],
      skill: [],
      stress: [2]
    }
  });

  const pushed = await withRandom(
    [3],
    () => pushMetroRoll(
      actor,
      result,
      {
        useStress: true
      }
    )
  );

  assert.equal(
    pushed.stressDice.length,
    1
  );

  assert.equal(
    pushed.context.metro.stressAdded,
    0
  );

  assert.equal(
    pushed.context.metro.stressLimitExceeded,
    true
  );
});


test("au second Push, les anciennes afflictions de Stress sont remplacées par celles de l'ultime relance", async () => {
  const actor = makeActor({
    added: 1
  });

  const result = makeResult({
    pushCount: 1,
    stressAfflictions: 3,

    dice: {
      attribute: [6],
      skill: [],
      stress: [2]
    }
  });

  const pushed = await withRandom(
    [1, 3],
    () => pushMetroRoll(
      actor,
      result,
      {
        useStress: true
      }
    )
  );

  assert.equal(
    pushed.stressAfflictions,
    1
  );
});


test("un troisième Push est toujours interdit", async () => {
  const actor = makeActor();

  const result = makeResult({
    pushCount: 2
  });

  await assert.rejects(
    () => pushMetroRoll(
      actor,
      result,
      {
        useStress: true
      }
    ),
    /jamais être forcé une troisième fois/
  );

  assert.deepEqual(
    actor.addedStress,
    []
  );
});