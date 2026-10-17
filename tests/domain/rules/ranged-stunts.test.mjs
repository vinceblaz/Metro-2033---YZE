
import test from "node:test";
import assert from "node:assert/strict";

import {
  RANGED_STUNT_IDS,
  resolveRangedStunts
} from "../../../src/domain/rules/ranged-stunts.mjs";


function createRollResult(successes = 0) {
  return {
    successes
  };
}


/* ============================================================
 * CONSTANTES
 * ============================================================ */


test("RANGED_STUNT_IDS expose les six actions d'éclat attendues", () => {
  assert.deepEqual(
    RANGED_STUNT_IDS,
    {
      VIGOR_DAMAGE: "vigorDamage",
      SPIRIT_DAMAGE: "spiritDamage",
      SWAP_INITIATIVE: "swapInitiative",
      DISARM: "disarm",
      KNOCKDOWN: "knockdown",
      GRENADE: "grenade"
    }
  );
});


test("RANGED_STUNT_IDS est gelé", () => {
  assert.equal(
    Object.isFrozen(RANGED_STUNT_IDS),
    true
  );
});


/* ============================================================
 * VALIDATION DE BASE
 * ============================================================ */


test("resolveRangedStunts exige un résultat de jet", () => {
  assert.throws(
    () => resolveRangedStunts(),
    TypeError
  );
});


test("successes vaut zéro si absent du résultat", () => {
  const result =
    resolveRangedStunts({
      rollResult: {}
    });

  assert.equal(
    result.successes,
    0
  );

  assert.equal(
    result.extraSuccesses,
    0
  );
});


test("une réussite ne fournit aucune réussite excédentaire", () => {
  const result =
    resolveRangedStunts({
      rollResult: createRollResult(1)
    });

  assert.equal(
    result.extraSuccesses,
    0
  );
});


test("les réussites excédentaires valent successes moins un", () => {
  const result =
    resolveRangedStunts({
      rollResult: createRollResult(4)
    });

  assert.equal(
    result.extraSuccesses,
    3
  );
});


test("extraSuccesses ne descend jamais sous zéro", () => {
  const result =
    resolveRangedStunts({
      rollResult: createRollResult(0)
    });

  assert.equal(
    result.extraSuccesses,
    0
  );
});


/* ============================================================
 * ALLOCATION VIDE
 * ============================================================ */


test("une allocation vide ne dépense aucune réussite", () => {
  const result =
    resolveRangedStunts({
      rollResult: createRollResult(3)
    });

  assert.equal(
    result.spent,
    0
  );

  assert.equal(
    result.remaining,
    2
  );
});


test("sans allocation tous les effets sont neutres", () => {
  assert.deepEqual(
    resolveRangedStunts({
      rollResult: createRollResult(3)
    }).effects,
    {
      vigorDamage: 0,
      spiritDamage: 0,
      swapInitiative: false,
      disarm: false,
      knockdown: false,
      grenade: false
    }
  );
});


/* ============================================================
 * DÉGÂTS SUPPLÉMENTAIRES
 * ============================================================ */


test("vigorDamage dépense une réussite par point", () => {
  const result =
    resolveRangedStunts({
      rollResult: createRollResult(4),

      allocation: {
        vigorDamage: 2
      }
    });

  assert.equal(
    result.effects.vigorDamage,
    2
  );

  assert.equal(
    result.spent,
    2
  );

  assert.equal(
    result.remaining,
    1
  );
});


test("spiritDamage dépense une réussite par point", () => {
  const result =
    resolveRangedStunts({
      rollResult: createRollResult(3),

      allocation: {
        spiritDamage: 2
      }
    });

  assert.equal(
    result.effects.spiritDamage,
    2
  );

  assert.equal(
    result.spent,
    2
  );
});


test("vigorDamage doit être un entier positif ou nul", () => {
  for (
    const value
    of [
      -1,
      1.5,
      "2"
    ]
  ) {
    assert.throws(
      () => resolveRangedStunts({
        rollResult: createRollResult(4),

        allocation: {
          vigorDamage: value
        }
      }),
      RangeError
    );
  }
});


test("spiritDamage doit être un entier positif ou nul", () => {
  for (
    const value
    of [
      -1,
      1.5,
      "2"
    ]
  ) {
    assert.throws(
      () => resolveRangedStunts({
        rollResult: createRollResult(4),

        allocation: {
          spiritDamage: value
        }
      }),
      RangeError
    );
  }
});


/* ============================================================
 * ACTIONS BOOLÉENNES
 * ============================================================ */


test("swapInitiative coûte une réussite lorsqu'il vaut true", () => {
  const result =
    resolveRangedStunts({
      rollResult: createRollResult(2),

      allocation: {
        swapInitiative: true
      }
    });

  assert.equal(
    result.effects.swapInitiative,
    true
  );

  assert.equal(
    result.spent,
    1
  );
});


test("disarm coûte une réussite lorsqu'il vaut true", () => {
  const result =
    resolveRangedStunts({
      rollResult: createRollResult(2),

      allocation: {
        disarm: true
      }
    });

  assert.equal(
    result.effects.disarm,
    true
  );

  assert.equal(
    result.spent,
    1
  );
});


test("knockdown coûte une réussite lorsqu'il vaut true", () => {
  const result =
    resolveRangedStunts({
      rollResult: createRollResult(2),

      allocation: {
        knockdown: true
      }
    });

  assert.equal(
    result.effects.knockdown,
    true
  );

  assert.equal(
    result.spent,
    1
  );
});


test("seule la valeur booléenne true active les actions booléennes", () => {
  const result =
    resolveRangedStunts({
      rollResult: createRollResult(6),

      allocation: {
        swapInitiative: 1,
        disarm: "true",
        knockdown: false,
        grenade: 1
      }
    });

  assert.deepEqual(
    result.effects,
    {
      vigorDamage: 0,
      spiritDamage: 0,
      swapInitiative: false,
      disarm: false,
      knockdown: false,
      grenade: false
    }
  );

  assert.equal(
    result.spent,
    0
  );
});


/* ============================================================
 * BUDGET DE RÉUSSITES
 * ============================================================ */


test("plusieurs actions peuvent partager les réussites excédentaires", () => {
  const result =
    resolveRangedStunts({
      rollResult: createRollResult(6),

      allocation: {
        vigorDamage: 2,
        spiritDamage: 1,
        swapInitiative: true,
        disarm: true
      }
    });

  assert.equal(
    result.extraSuccesses,
    5
  );

  assert.equal(
    result.spent,
    5
  );

  assert.equal(
    result.remaining,
    0
  );

  assert.deepEqual(
    result.effects,
    {
      vigorDamage: 2,
      spiritDamage: 1,
      swapInitiative: true,
      disarm: true,
      knockdown: false,
      grenade: false
    }
  );
});


test("il est impossible de dépenser plus de réussites que disponibles", () => {
  assert.throws(
    () => resolveRangedStunts({
      rollResult: createRollResult(2),

      allocation: {
        vigorDamage: 2
      }
    }),
    RangeError
  );
});


test("il est possible de conserver des réussites non dépensées", () => {
  const result =
    resolveRangedStunts({
      rollResult: createRollResult(5),

      allocation: {
        disarm: true
      }
    });

  assert.equal(
    result.extraSuccesses,
    4
  );

  assert.equal(
    result.spent,
    1
  );

  assert.equal(
    result.remaining,
    3
  );
});


/* ============================================================
 * EXPLOSIONS ET GRENADE
 * ============================================================ */


test("Grenade ! est interdite sur une attaque non explosive", () => {
  assert.throws(
    () => resolveRangedStunts({
      rollResult: createRollResult(2),

      allocation: {
        grenade: true
      },

      explosive: false
    }),
    Error
  );
});


test("Grenade ! est autorisée sur une attaque explosive", () => {
  const result =
    resolveRangedStunts({
      rollResult: createRollResult(2),

      allocation: {
        grenade: true
      },

      explosive: true
    });

  assert.equal(
    result.effects.grenade,
    true
  );

  assert.equal(
    result.spent,
    1
  );

  assert.equal(
    result.remaining,
    0
  );
});


test("une attaque explosive peut ne dépenser aucune réussite", () => {
  const result =
    resolveRangedStunts({
      rollResult: createRollResult(3),
      explosive: true
    });

  assert.equal(
    result.spent,
    0
  );

  assert.equal(
    result.remaining,
    2
  );
});


test("une attaque explosive interdit vigorDamage", () => {
  assert.throws(
    () => resolveRangedStunts({
      rollResult: createRollResult(3),

      allocation: {
        vigorDamage: 1
      },

      explosive: true
    }),
    Error
  );
});


test("une attaque explosive interdit spiritDamage", () => {
  assert.throws(
    () => resolveRangedStunts({
      rollResult: createRollResult(3),

      allocation: {
        spiritDamage: 1
      },

      explosive: true
    }),
    Error
  );
});


test("une attaque explosive interdit swapInitiative", () => {
  assert.throws(
    () => resolveRangedStunts({
      rollResult: createRollResult(3),

      allocation: {
        swapInitiative: true
      },

      explosive: true
    }),
    Error
  );
});


test("une attaque explosive interdit disarm", () => {
  assert.throws(
    () => resolveRangedStunts({
      rollResult: createRollResult(3),

      allocation: {
        disarm: true
      },

      explosive: true
    }),
    Error
  );
});


test("une attaque explosive interdit knockdown", () => {
  assert.throws(
    () => resolveRangedStunts({
      rollResult: createRollResult(3),

      allocation: {
        knockdown: true
      },

      explosive: true
    }),
    Error
  );
});


test("une attaque explosive peut dépenser plusieurs réussites uniquement si Grenade ! reste à coût unitaire", () => {
  const result =
    resolveRangedStunts({
      rollResult: createRollResult(4),

      allocation: {
        grenade: true
      },

      explosive: true
    });

  assert.equal(
    result.extraSuccesses,
    3
  );

  assert.equal(
    result.spent,
    1
  );

  assert.equal(
    result.remaining,
    2
  );
});


test("Grenade ! combinée à un autre éclat reste interdite sur une attaque explosive", () => {
  assert.throws(
    () => resolveRangedStunts({
      rollResult: createRollResult(4),

      allocation: {
        grenade: true,
        vigorDamage: 1
      },

      explosive: true
    }),
    Error
  );
});


/* ============================================================
 * STRUCTURE DE SORTIE
 * ============================================================ */


test("resolveRangedStunts retourne la structure complète attendue", () => {
  assert.deepEqual(
    resolveRangedStunts({
      rollResult: createRollResult(5),

      allocation: {
        vigorDamage: 1,
        spiritDamage: 1,
        swapInitiative: true
      }
    }),
    {
      successes: 5,
      extraSuccesses: 4,
      spent: 3,
      remaining: 1,

      effects: {
        vigorDamage: 1,
        spiritDamage: 1,
        swapInitiative: true,
        disarm: false,
        knockdown: false,
        grenade: false
      }
    }
  );
});


test("resolveRangedStunts ne modifie pas l'allocation reçue", () => {
  const allocation = {
    vigorDamage: 1,
    disarm: true
  };

  resolveRangedStunts({
    rollResult: createRollResult(3),
    allocation
  });

  assert.deepEqual(
    allocation,
    {
      vigorDamage: 1,
      disarm: true
    }
  );
});