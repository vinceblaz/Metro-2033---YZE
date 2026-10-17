import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveAfflictions
} from "../../../src/domain/rules/afflictions.mjs";


/* ============================================================
 * HELPERS
 * ============================================================ */


function createActor({
  attributes = {
    vigor: 5
  },
  composureResult = {
    added: 0,
    reachedBreakingPoint: false
  },
  stressResults = [],
  items = [],
  equipmentAfflictionResult = {
    reliability: 3,
    prevented: false,
    damage: 1
  }
} = {}) {

  const attributeValues = {
    ...attributes
  };

  const calls = {
    takeAttributeDamage: [],
    addComposure: [],
    addStress: [],
    applyEquipmentAffliction: []
  };

  let stressIndex = 0;

  const itemMap =
    new Map(
      items.map(
        item => [
          item.id,
          item
        ]
      )
    );

  const actor = {

    items: {
      get(itemId) {
        return itemMap.get(itemId);
      }
    },

    getAttribute(attributeId) {
      return attributeValues[attributeId];
    },

    async takeAttributeDamage(
      attributeId,
      amount
    ) {
      calls.takeAttributeDamage.push({
        attributeId,
        amount
      });

      attributeValues[attributeId] =
        Math.max(
          0,
          attributeValues[attributeId] - amount
        );
    },

    async addComposure(amount) {
      calls.addComposure.push(
        amount
      );

      return composureResult;
    },

    async addStress(amount) {
      calls.addStress.push(
        amount
      );

      const result =
        stressResults[
          stressIndex
        ]
        ?? {
          added: amount,
          exceedsLimit: false
        };

      stressIndex += 1;

      return result;
    },

    async applyEquipmentAffliction(item) {
      calls.applyEquipmentAffliction.push(
        item
      );

      return equipmentAfflictionResult;
    }

  };

  return {
    actor,
    calls,
    attributeValues
  };

}


function createResult({
  afflictions = 0,
  pushCount = 0,
  equipmentDice = 0,
  attribute = "vigor",
  equipmentItemId = null
} = {}) {

  return {
    afflictions,
    pushCount,

    pool: {
      equipment: equipmentDice
    },

    context: {
      attribute,

      equipment:
        equipmentItemId
          ? {
              itemId: equipmentItemId
            }
          : undefined
    }
  };

}


/* ============================================================
 * ARGUMENTS OBLIGATOIRES
 * ============================================================ */


test("resolveAfflictions exige un Actor", async () => {
  await assert.rejects(
    resolveAfflictions(
      null,
      createResult()
    ),
    {
      name: "TypeError",
      message:
        "resolveAfflictions nécessite un Actor."
    }
  );
});


test("resolveAfflictions exige un résultat de jet", async () => {
  const {
    actor
  } = createActor();

  await assert.rejects(
    resolveAfflictions(
      actor,
      null
    ),
    {
      name: "TypeError",
      message:
        "resolveAfflictions nécessite un résultat de jet."
    }
  );
});


/* ============================================================
 * VALIDATION DES QUANTITÉS
 * ============================================================ */


test("attribute doit être un entier positif ou nul", async () => {
  const {
    actor
  } = createActor();

  for (
    const attribute
    of [
      -1,
      1.5,
      "1",
      NaN
    ]
  ) {
    await assert.rejects(
      resolveAfflictions(
        actor,
        createResult(),
        {
          attribute
        }
      ),
      TypeError
    );
  }
});


test("composure doit être un entier positif ou nul", async () => {
  const {
    actor
  } = createActor();

  for (
    const composure
    of [
      -1,
      1.5,
      "1",
      NaN
    ]
  ) {
    await assert.rejects(
      resolveAfflictions(
        actor,
        createResult(),
        {
          composure
        }
      ),
      TypeError
    );
  }
});


test("stress doit être un entier positif ou nul", async () => {
  const {
    actor
  } = createActor();

  for (
    const stress
    of [
      -1,
      1.5,
      "1",
      NaN
    ]
  ) {
    await assert.rejects(
      resolveAfflictions(
        actor,
        createResult(),
        {
          stress
        }
      ),
      TypeError
    );
  }
});


test("equipment doit être un entier positif ou nul", async () => {
  const {
    actor
  } = createActor();

  for (
    const equipment
    of [
      -1,
      1.5,
      "1",
      NaN
    ]
  ) {
    await assert.rejects(
      resolveAfflictions(
        actor,
        createResult(),
        {
          equipment
        }
      ),
      TypeError
    );
  }
});


/* ============================================================
 * RÉPARTITION GLOBALE
 * ============================================================ */


test("toutes les afflictions doivent être attribuées", async () => {
  const {
    actor
  } = createActor();

  await assert.rejects(
    resolveAfflictions(
      actor,
      createResult({
        afflictions: 2
      }),
      {
        attribute: 1
      }
    ),
    {
      message:
        "Répartition invalide : 1 affliction(s) attribuée(s) pour 2 disponible(s)."
    }
  );
});


test("il est interdit d'attribuer plus d'afflictions que disponibles", async () => {
  const {
    actor
  } = createActor();

  await assert.rejects(
    resolveAfflictions(
      actor,
      createResult({
        afflictions: 1
      }),
      {
        attribute: 2
      }
    ),
    {
      message:
        "Répartition invalide : 2 affliction(s) attribuée(s) pour 1 disponible(s)."
    }
  );
});


test("une résolution sans affliction retourne une structure neutre", async () => {
  const {
    actor
  } = createActor();

  const resolution =
    await resolveAfflictions(
      actor,
      createResult({
        afflictions: 0
      })
    );

  assert.deepEqual(
    resolution,
    {
      total: 0,

      attribute: {
        id: "vigor",
        applied: 0
      },

      composure: {
        applied: 0,
        reachedBreakingPoint: false
      },

      stress: {
        requested: 0,
        added: 0,
        limitExceeded: false
      },

      equipment: {
        requested: 0,
        applied: false,
        itemId: null,
        itemName: null,
        reliability: null,
        prevented: false,
        damage: null
      }
    }
  );
});


test("une répartition peut combiner plusieurs destinations", async () => {
  const {
    actor
  } = createActor({
    attributes: {
      vigor: 5
    },
    composureResult: {
      added: 1,
      reachedBreakingPoint: false
    },
    stressResults: [
      {
        added: 1,
        exceedsLimit: false
      }
    ]
  });

  const resolution =
    await resolveAfflictions(
      actor,
      createResult({
        afflictions: 3
      }),
      {
        attribute: 1,
        composure: 1,
        stress: 1
      }
    );

  assert.equal(
    resolution.total,
    3
  );

  assert.equal(
    resolution.attribute.applied,
    1
  );

  assert.equal(
    resolution.composure.applied,
    1
  );

  assert.equal(
    resolution.stress.added,
    1
  );
});


/* ============================================================
 * ATTRIBUT
 * ============================================================ */


test("une affliction d'attribut exige un attribut dans le contexte", async () => {
  const {
    actor
  } = createActor();

  await assert.rejects(
    resolveAfflictions(
      actor,
      createResult({
        afflictions: 1,
        attribute: null
      }),
      {
        attribute: 1
      }
    ),
    {
      message:
        "Le résultat ne contient pas l'attribut concerné."
    }
  );
});


test("les dégâts d'attribut sont appliqués à l'attribut indiqué par le résultat", async () => {
  const {
    actor,
    calls
  } = createActor({
    attributes: {
      agility: 5
    }
  });

  const resolution =
    await resolveAfflictions(
      actor,
      createResult({
        afflictions: 2,
        attribute: "agility"
      }),
      {
        attribute: 2
      }
    );

  assert.deepEqual(
    calls.takeAttributeDamage,
    [
      {
        attributeId: "agility",
        amount: 2
      }
    ]
  );

  assert.equal(
    resolution.attribute.id,
    "agility"
  );

  assert.equal(
    resolution.attribute.applied,
    2
  );
});


test("le nombre réellement appliqué à l'attribut est calculé par différence avant/après", async () => {
  const {
    actor
  } = createActor({
    attributes: {
      vigor: 1
    }
  });

  const resolution =
    await resolveAfflictions(
      actor,
      createResult({
        afflictions: 3
      }),
      {
        attribute: 3
      }
    );

  assert.equal(
    resolution.attribute.applied,
    1
  );
});


test("sans affliction d'attribut, l'attribut du contexte est néanmoins reporté dans la résolution", async () => {
  const {
    actor
  } = createActor();

  const resolution =
    await resolveAfflictions(
      actor,
      createResult({
        afflictions: 0,
        attribute: "vigor"
      })
    );

  assert.equal(
    resolution.attribute.id,
    "vigor"
  );

  assert.equal(
    resolution.attribute.applied,
    0
  );
});


/* ============================================================
 * SANG-FROID
 * ============================================================ */


test("les afflictions de Sang-froid sont transmises en une seule fois à addComposure", async () => {
  const {
    actor,
    calls
  } = createActor({
    composureResult: {
      added: 2,
      reachedBreakingPoint: false
    }
  });

  const resolution =
    await resolveAfflictions(
      actor,
      createResult({
        afflictions: 2
      }),
      {
        composure: 2
      }
    );

  assert.deepEqual(
    calls.addComposure,
    [
      2
    ]
  );

  assert.equal(
    resolution.composure.applied,
    2
  );
});


test("le point de rupture de Sang-froid est propagé dans la résolution", async () => {
  const {
    actor
  } = createActor({
    composureResult: {
      added: 1,
      reachedBreakingPoint: true
    }
  });

  const resolution =
    await resolveAfflictions(
      actor,
      createResult({
        afflictions: 1
      }),
      {
        composure: 1
      }
    );

  assert.equal(
    resolution.composure.reachedBreakingPoint,
    true
  );
});


/* ============================================================
 * STRESS
 * ============================================================ */


test("les afflictions de Stress sont appliquées une par une", async () => {
  const {
    actor,
    calls
  } = createActor({
    stressResults: [
      {
        added: 1,
        exceedsLimit: false
      },
      {
        added: 1,
        exceedsLimit: false
      },
      {
        added: 1,
        exceedsLimit: false
      }
    ]
  });

  const resolution =
    await resolveAfflictions(
      actor,
      createResult({
        afflictions: 3
      }),
      {
        stress: 3
      }
    );

  assert.deepEqual(
    calls.addStress,
    [
      1,
      1,
      1
    ]
  );

  assert.equal(
    resolution.stress.requested,
    3
  );

  assert.equal(
    resolution.stress.added,
    3
  );
});


test("le Stress réellement ajouté est la somme des retours de addStress", async () => {
  const {
    actor
  } = createActor({
    stressResults: [
      {
        added: 1,
        exceedsLimit: false
      },
      {
        added: 0,
        exceedsLimit: true
      }
    ]
  });

  const resolution =
    await resolveAfflictions(
      actor,
      createResult({
        afflictions: 2
      }),
      {
        stress: 2
      }
    );

  assert.equal(
    resolution.stress.requested,
    2
  );

  assert.equal(
    resolution.stress.added,
    1
  );
});


test("limitExceeded devient vrai si au moins une addition de Stress dépasse la limite", async () => {
  const {
    actor
  } = createActor({
    stressResults: [
      {
        added: 1,
        exceedsLimit: false
      },
      {
        added: 0,
        exceedsLimit: true
      },
      {
        added: 0,
        exceedsLimit: false
      }
    ]
  });

  const resolution =
    await resolveAfflictions(
      actor,
      createResult({
        afflictions: 3
      }),
      {
        stress: 3
      }
    );

  assert.equal(
    resolution.stress.limitExceeded,
    true
  );
});


/* ============================================================
 * ÉQUIPEMENT — VALIDATION
 * ============================================================ */


test("une seule affliction maximum peut être attribuée à l'équipement", async () => {
  const {
    actor
  } = createActor();

  await assert.rejects(
    resolveAfflictions(
      actor,
      createResult({
        afflictions: 2,
        pushCount: 1,
        equipmentDice: 1,
        equipmentItemId: "item-1"
      }),
      {
        equipment: 2
      }
    ),
    {
      message:
        "Une seule affliction peut être appliquée à l'équipement sur un même jet."
    }
  );
});


test("la vérification du total attribué précède la limite d'une affliction d'équipement", async () => {
  const {
    actor
  } = createActor();

  await assert.rejects(
    resolveAfflictions(
      actor,
      createResult({
        afflictions: 1,
        pushCount: 1,
        equipmentDice: 1,
        equipmentItemId: "item-1"
      }),
      {
        equipment: 2
      }
    ),
    {
      message:
        "Répartition invalide : 2 affliction(s) attribuée(s) pour 1 disponible(s)."
    }
  );
});


test("une affliction d'équipement exige un jet forcé", async () => {
  const {
    actor
  } = createActor();

  await assert.rejects(
    resolveAfflictions(
      actor,
      createResult({
        afflictions: 1,
        pushCount: 0,
        equipmentDice: 1,
        equipmentItemId: "item-1"
      }),
      {
        equipment: 1
      }
    ),
    {
      message:
        "Une affliction ne peut être appliquée à l'équipement que sur un jet forcé."
    }
  );
});


test("une affliction d'équipement exige au moins un dé d'équipement dans le pool", async () => {
  const {
    actor
  } = createActor();

  await assert.rejects(
    resolveAfflictions(
      actor,
      createResult({
        afflictions: 1,
        pushCount: 1,
        equipmentDice: 0,
        equipmentItemId: "item-1"
      }),
      {
        equipment: 1
      }
    ),
    {
      message:
        "Aucun dé d'équipement n'a été utilisé sur ce jet."
    }
  );
});


test("une affliction d'équipement exige un itemId dans le contexte", async () => {
  const {
    actor
  } = createActor();

  await assert.rejects(
    resolveAfflictions(
      actor,
      createResult({
        afflictions: 1,
        pushCount: 1,
        equipmentDice: 1
      }),
      {
        equipment: 1
      }
    ),
    {
      message:
        "Le jet ne contient aucun équipement identifiable."
    }
  );
});


test("l'équipement identifié doit encore exister sur l'Actor", async () => {
  const {
    actor
  } = createActor();

  await assert.rejects(
    resolveAfflictions(
      actor,
      createResult({
        afflictions: 1,
        pushCount: 1,
        equipmentDice: 1,
        equipmentItemId: "missing-item"
      }),
      {
        equipment: 1
      }
    ),
    {
      message:
        "L'équipement utilisé pour ce jet n'existe plus sur l'Actor."
    }
  );
});


/* ============================================================
 * ÉQUIPEMENT — APPLICATION
 * ============================================================ */


test("l'affliction d'équipement est appliquée à l'Item identifié", async () => {
  const item = {
    id: "item-1",
    name: "Lunette de visée"
  };

  const {
    actor,
    calls
  } = createActor({
    items: [
      item
    ]
  });

  await resolveAfflictions(
    actor,
    createResult({
      afflictions: 1,
      pushCount: 1,
      equipmentDice: 2,
      equipmentItemId: "item-1"
    }),
    {
      equipment: 1
    }
  );

  assert.deepEqual(
    calls.applyEquipmentAffliction,
    [
      item
    ]
  );
});


test("la résolution d'équipement reprend les informations de l'Item et du résultat d'affliction", async () => {
  const item = {
    id: "item-1",
    name: "Fusil"
  };

  const {
    actor
  } = createActor({
    items: [
      item
    ],

    equipmentAfflictionResult: {
      reliability: 2,
      prevented: true,
      damage: 0
    }
  });

  const resolution =
    await resolveAfflictions(
      actor,
      createResult({
        afflictions: 1,
        pushCount: 1,
        equipmentDice: 1,
        equipmentItemId: "item-1"
      }),
      {
        equipment: 1
      }
    );

  assert.deepEqual(
    resolution.equipment,
    {
      requested: 1,
      applied: true,
      itemId: "item-1",
      itemName: "Fusil",
      reliability: 2,
      prevented: true,
      damage: 0
    }
  );
});


/* ============================================================
 * ORDRE D'APPLICATION
 * ============================================================ */


test("les conséquences sont appliquées dans l'ordre attribut, Sang-froid, Stress, équipement", async () => {
  const order = [];

  const item = {
    id: "item-1",
    name: "Équipement"
  };

  let vigor = 5;

  const actor = {

    items: {
      get() {
        order.push(
          "equipment-get"
        );

        return item;
      }
    },

    getAttribute() {
      return vigor;
    },

    async takeAttributeDamage() {
      order.push(
        "attribute"
      );

      vigor -= 1;
    },

    async addComposure() {
      order.push(
        "composure"
      );

      return {
        added: 1,
        reachedBreakingPoint: false
      };
    },

    async addStress() {
      order.push(
        "stress"
      );

      return {
        added: 1,
        exceedsLimit: false
      };
    },

    async applyEquipmentAffliction() {
      order.push(
        "equipment-apply"
      );

      return {
        reliability: 2,
        prevented: false,
        damage: 1
      };
    }
  };

  await resolveAfflictions(
    actor,
    createResult({
      afflictions: 4,
      pushCount: 1,
      equipmentDice: 1,
      equipmentItemId: "item-1"
    }),
    {
      attribute: 1,
      composure: 1,
      stress: 1,
      equipment: 1
    }
  );

  assert.deepEqual(
    order,
    [
      "attribute",
      "composure",
      "stress",
      "equipment-get",
      "equipment-apply"
    ]
  );
});


test("aucune méthode de conséquence n'est appelée lorsqu'aucune affliction n'est attribuée", async () => {
  const {
    actor,
    calls
  } = createActor();

  await resolveAfflictions(
    actor,
    createResult({
      afflictions: 0
    })
  );

  assert.deepEqual(
    calls.takeAttributeDamage,
    []
  );

  assert.deepEqual(
    calls.addComposure,
    []
  );

  assert.deepEqual(
    calls.addStress,
    []
  );

  assert.deepEqual(
    calls.applyEquipmentAffliction,
    []
  );
});

/* ============================================================
 * ignoredAfflictions (Imperturbable / Mental d'acier / Nerfs
 * d'acier / Résistance — ignorer une affliction sur un jet
 * forcé)
 * ============================================================ */

test("ignoredAfflictions réduit le total disponible avant répartition", async () => {
  const {
    actor
  } = createActor();

  const resolution =
    await resolveAfflictions(
      actor,
      createResult({
        afflictions: 2,
        pushCount: 1
      }),
      {
        attribute: 1,
        ignoredAfflictions: 1
      }
    );

  assert.equal(
    resolution.total,
    1
  );
});


test("ignoredAfflictions : une répartition qui ignore le total réduit est rejetée", async () => {
  const {
    actor
  } = createActor();

  await assert.rejects(
    resolveAfflictions(
      actor,
      createResult({
        afflictions: 2,
        pushCount: 1
      }),
      {
        attribute: 2,
        ignoredAfflictions: 1
      }
    ),
    {
      message:
        "Répartition invalide : 2 affliction(s) attribuée(s) pour 1 disponible(s)."
    }
  );
});


test("ignoredAfflictions ne peut pas rendre le total disponible négatif", async () => {
  const {
    actor
  } = createActor();

  const resolution =
    await resolveAfflictions(
      actor,
      createResult({
        afflictions: 0,
        pushCount: 1
      }),
      {
        ignoredAfflictions: 1
      }
    );

  assert.equal(
    resolution.total,
    0
  );
});


test("ignoredAfflictions doit être un entier positif ou nul", async () => {
  const {
    actor
  } = createActor();

  await assert.rejects(
    resolveAfflictions(
      actor,
      createResult({
        afflictions: 1,
        pushCount: 1
      }),
      {
        attribute: 1,
        ignoredAfflictions: -1
      }
    ),
    {
      message:
        "ignoredAfflictions doit être un entier positif ou nul."
    }
  );
});


test("ignoredAfflictions par défaut n'affecte pas une résolution existante", async () => {
  const {
    actor
  } = createActor();

  const resolution =
    await resolveAfflictions(
      actor,
      createResult({
        afflictions: 2,
        pushCount: 1
      }),
      {
        attribute: 2
      }
    );

  assert.equal(
    resolution.total,
    2
  );
});
