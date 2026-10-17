import test from "node:test";
import assert from "node:assert/strict";

import {
  MELEE_STUNT_KEYS,
  MELEE_STUNT_DEFINITIONS,
  getMeleeStuntDefinition,
  getMeleeStuntDefinitions,
  resolveMeleeStunts
} from "../../../src/domain/rules/melee-stunts.mjs";


/* ============================================================
 * CONSTANTES
 * ============================================================ */


test("MELEE_STUNT_KEYS expose les six actions d'éclat attendues", () => {
  assert.deepEqual(
    MELEE_STUNT_KEYS,
    {
      VIGOR_DAMAGE: "vigor-damage",
      AGILITY_DAMAGE: "agility-damage",
      SWAP_INITIATIVE: "swap-initiative",
      DISARM: "disarm",
      KNOCKDOWN: "knockdown",
      GRAPPLE: "grapple"
    }
  );
});


test("MELEE_STUNT_KEYS est gelé", () => {
  assert.equal(
    Object.isFrozen(MELEE_STUNT_KEYS),
    true
  );
});


test("MELEE_STUNT_DEFINITIONS est gelé", () => {
  assert.equal(
    Object.isFrozen(MELEE_STUNT_DEFINITIONS),
    true
  );
});


test("chaque définition d'éclat est gelée", () => {
  for (
    const definition
    of Object.values(MELEE_STUNT_DEFINITIONS)
  ) {
    assert.equal(
      Object.isFrozen(definition),
      true
    );
  }
});


test("les six définitions d'éclat sont présentes", () => {
  assert.equal(
    Object.keys(MELEE_STUNT_DEFINITIONS).length,
    6
  );

  for (
    const key
    of Object.values(MELEE_STUNT_KEYS)
  ) {
    assert.ok(
      MELEE_STUNT_DEFINITIONS[key]
    );
  }
});


test("toutes les actions d'éclat coûtent une réussite excédentaire", () => {
  for (
    const definition
    of Object.values(MELEE_STUNT_DEFINITIONS)
  ) {
    assert.equal(
      definition.cost,
      1
    );
  }
});


test("seuls les dégâts de Vigueur et d'Agilité sont répétables", () => {
  assert.equal(
    MELEE_STUNT_DEFINITIONS[
      MELEE_STUNT_KEYS.VIGOR_DAMAGE
    ].repeatable,
    true
  );

  assert.equal(
    MELEE_STUNT_DEFINITIONS[
      MELEE_STUNT_KEYS.AGILITY_DAMAGE
    ].repeatable,
    true
  );

  for (
    const key
    of [
      MELEE_STUNT_KEYS.SWAP_INITIATIVE,
      MELEE_STUNT_KEYS.DISARM,
      MELEE_STUNT_KEYS.KNOCKDOWN,
      MELEE_STUNT_KEYS.GRAPPLE
    ]
  ) {
    assert.equal(
      MELEE_STUNT_DEFINITIONS[key].repeatable,
      false
    );
  }
});


/* ============================================================
 * ACCÈS AUX DÉFINITIONS
 * ============================================================ */


test("getMeleeStuntDefinition retourne la définition demandée", () => {
  assert.equal(
    getMeleeStuntDefinition(
      MELEE_STUNT_KEYS.DISARM
    ),
    MELEE_STUNT_DEFINITIONS[
      MELEE_STUNT_KEYS.DISARM
    ]
  );
});


test("getMeleeStuntDefinition retourne null pour une clé inconnue", () => {
  assert.equal(
    getMeleeStuntDefinition("unknown"),
    null
  );
});


test("getMeleeStuntDefinitions retourne les six définitions", () => {
  const definitions =
    getMeleeStuntDefinitions();

  assert.equal(
    definitions.length,
    6
  );
});


test("getMeleeStuntDefinitions retourne de nouvelles structures", () => {
  const definitions =
    getMeleeStuntDefinitions();

  for (
    const definition
    of definitions
  ) {
    assert.notEqual(
      definition,
      MELEE_STUNT_DEFINITIONS[
        definition.key
      ]
    );
  }
});


test("modifier une définition retournée ne modifie pas la constante métier", () => {
  const definitions =
    getMeleeStuntDefinitions();

  const vigor =
    definitions.find(
      definition =>
        definition.key
        === MELEE_STUNT_KEYS.VIGOR_DAMAGE
    );

  vigor.label = "MODIFIÉ";

  assert.equal(
    MELEE_STUNT_DEFINITIONS[
      MELEE_STUNT_KEYS.VIGOR_DAMAGE
    ].label,
    "+1 dégât à la Vigueur"
  );
});


/* ============================================================
 * RÉSOLUTION VIDE
 * ============================================================ */


test("resolveMeleeStunts utilise zéro réussite par défaut", () => {
  const result =
    resolveMeleeStunts();

  assert.equal(
    result.available,
    0
  );

  assert.equal(
    result.spent,
    0
  );

  assert.equal(
    result.remaining,
    0
  );
});


test("une allocation vide ne produit aucune sélection", () => {
  const result =
    resolveMeleeStunts({
      extraSuccesses: 3,
      allocation: {}
    });

  assert.deepEqual(
    result.selections,
    []
  );

  assert.equal(
    result.spent,
    0
  );

  assert.equal(
    result.remaining,
    3
  );
});


test("une allocation null est traitée comme une allocation vide", () => {
  const result =
    resolveMeleeStunts({
      extraSuccesses: 2,
      allocation: null
    });

  assert.deepEqual(
    result.selections,
    []
  );

  assert.equal(
    result.remaining,
    2
  );
});


test("sans sélection tous les effets sont neutres", () => {
  assert.deepEqual(
    resolveMeleeStunts({
      extraSuccesses: 2
    }).effects,
    {
      vigorDamage: 0,
      agilityDamage: 0,
      swapInitiative: false,
      disarm: false,
      knockdown: false,
      grapple: false
    }
  );
});


/* ============================================================
 * VALIDATION DU BUDGET
 * ============================================================ */


test("extraSuccesses doit être un entier positif ou nul", () => {
  for (
    const value
    of [
      -1,
      1.5,
      "abc"
    ]
  ) {
    assert.throws(
      () => resolveMeleeStunts({
        extraSuccesses: value
      }),
      TypeError
    );
  }
});


test("extraSuccesses accepte actuellement une chaîne numérique entière", () => {
  const result =
    resolveMeleeStunts({
      extraSuccesses: "3"
    });

  assert.equal(
    result.available,
    3
  );
});


test("une allocation non objet et non tableau est refusée", () => {
  assert.throws(
    () => resolveMeleeStunts({
      extraSuccesses: 1,
      allocation: "invalid"
    }),
    TypeError
  );
});


test("il est impossible de dépenser plus de réussites que disponibles", () => {
  assert.throws(
    () => resolveMeleeStunts({
      extraSuccesses: 1,

      allocation: {
        vigorDamage: 2
      }
    }),
    Error
  );
});


test("il est possible de ne dépenser qu'une partie des réussites disponibles", () => {
  const result =
    resolveMeleeStunts({
      extraSuccesses: 4,

      allocation: {
        vigorDamage: 2
      }
    });

  assert.equal(
    result.available,
    4
  );

  assert.equal(
    result.spent,
    2
  );

  assert.equal(
    result.remaining,
    2
  );
});


/* ============================================================
 * FORMAT LEGACY
 * ============================================================ */


test("le format legacy résout les dégâts supplémentaires de Vigueur", () => {
  const result =
    resolveMeleeStunts({
      extraSuccesses: 3,

      allocation: {
        vigorDamage: 3
      }
    });

  assert.equal(
    result.effects.vigorDamage,
    3
  );

  assert.equal(
    result.spent,
    3
  );

  assert.equal(
    result.remaining,
    0
  );
});


test("le format legacy résout les dégâts supplémentaires d'Agilité", () => {
  const result =
    resolveMeleeStunts({
      extraSuccesses: 2,

      allocation: {
        agilityDamage: 2
      }
    });

  assert.equal(
    result.effects.agilityDamage,
    2
  );
});


test("le format legacy accepte les actions booléennes", () => {
  const result =
    resolveMeleeStunts({
      extraSuccesses: 4,

      allocation: {
        swapInitiative: true,
        disarm: true,
        knockdown: true,
        grapple: true
      }
    });

  assert.deepEqual(
    result.effects,
    {
      vigorDamage: 0,
      agilityDamage: 0,
      swapInitiative: true,
      disarm: true,
      knockdown: true,
      grapple: true
    }
  );

  assert.equal(
    result.spent,
    4
  );
});


test("false vaut zéro pour une action legacy", () => {
  const result =
    resolveMeleeStunts({
      extraSuccesses: 1,

      allocation: {
        disarm: false
      }
    });

  assert.equal(
    result.effects.disarm,
    false
  );

  assert.equal(
    result.spent,
    0
  );
});


test("une action non répétable ne peut pas avoir une quantité supérieure à un", () => {
  assert.throws(
    () => resolveMeleeStunts({
      extraSuccesses: 2,

      allocation: {
        disarm: 2
      }
    }),
    Error
  );
});


test("les actions répétables peuvent recevoir plusieurs réussites", () => {
  const result =
    resolveMeleeStunts({
      extraSuccesses: 5,

      allocation: {
        vigorDamage: 3,
        agilityDamage: 2
      }
    });

  assert.equal(
    result.effects.vigorDamage,
    3
  );

  assert.equal(
    result.effects.agilityDamage,
    2
  );

  assert.equal(
    result.spent,
    5
  );
});


/* ============================================================
 * NOUVEAU FORMAT DE SÉLECTION
 * ============================================================ */


test("le nouveau format accepte une sélection normalisée", () => {
  const result =
    resolveMeleeStunts({
      extraSuccesses: 2,

      allocation: [
        {
          key: MELEE_STUNT_KEYS.VIGOR_DAMAGE,
          quantity: 2
        }
      ]
    });

  assert.equal(
    result.effects.vigorDamage,
    2
  );

  assert.deepEqual(
    result.selections,
    [
      {
        key: "vigor-damage",
        quantity: 2,
        cost: 1,
        spent: 2
      }
    ]
  );
});


test("une entrée de sélection null est refusée", () => {
  assert.throws(
    () => resolveMeleeStunts({
      extraSuccesses: 1,
      allocation: [null]
    }),
    TypeError
  );
});


test("une entrée de sélection non objet est refusée", () => {
  assert.throws(
    () => resolveMeleeStunts({
      extraSuccesses: 1,
      allocation: ["disarm"]
    }),
    TypeError
  );
});


test("une clé d'éclat inconnue est refusée dans le nouveau format", () => {
  assert.throws(
    () => resolveMeleeStunts({
      extraSuccesses: 1,

      allocation: [
        {
          key: "unknown",
          quantity: 1
        }
      ]
    }),
    Error
  );
});


test("une quantité absente vaut zéro", () => {
  const result =
    resolveMeleeStunts({
      extraSuccesses: 1,

      allocation: [
        {
          key: MELEE_STUNT_KEYS.DISARM
        }
      ]
    });

  assert.equal(
    result.spent,
    0
  );

  assert.deepEqual(
    result.selections,
    []
  );
});


test("les doublons du nouveau format sont additionnés", () => {
  const result =
    resolveMeleeStunts({
      extraSuccesses: 3,

      allocation: [
        {
          key: MELEE_STUNT_KEYS.VIGOR_DAMAGE,
          quantity: 1
        },
        {
          key: MELEE_STUNT_KEYS.VIGOR_DAMAGE,
          quantity: 2
        }
      ]
    });

  assert.equal(
    result.effects.vigorDamage,
    3
  );

  assert.deepEqual(
    result.selections,
    [
      {
        key: "vigor-damage",
        quantity: 3,
        cost: 1,
        spent: 3
      }
    ]
  );
});


test("les doublons d'une action non répétable sont refusés après agrégation", () => {
  assert.throws(
    () => resolveMeleeStunts({
      extraSuccesses: 2,

      allocation: [
        {
          key: MELEE_STUNT_KEYS.DISARM,
          quantity: 1
        },
        {
          key: MELEE_STUNT_KEYS.DISARM,
          quantity: 1
        }
      ]
    }),
    Error
  );
});


test("les quantités booléennes sont acceptées dans le nouveau format", () => {
  const result =
    resolveMeleeStunts({
      extraSuccesses: 1,

      allocation: [
        {
          key: MELEE_STUNT_KEYS.GRAPPLE,
          quantity: true
        }
      ]
    });

  assert.equal(
    result.effects.grapple,
    true
  );

  assert.equal(
    result.spent,
    1
  );
});


test("une chaîne numérique entière est actuellement acceptée comme quantité", () => {
  const result =
    resolveMeleeStunts({
      extraSuccesses: 2,

      allocation: [
        {
          key: MELEE_STUNT_KEYS.VIGOR_DAMAGE,
          quantity: "2"
        }
      ]
    });

  assert.equal(
    result.effects.vigorDamage,
    2
  );
});


test("une quantité négative est refusée", () => {
  assert.throws(
    () => resolveMeleeStunts({
      extraSuccesses: 1,

      allocation: [
        {
          key: MELEE_STUNT_KEYS.VIGOR_DAMAGE,
          quantity: -1
        }
      ]
    }),
    TypeError
  );
});


test("une quantité décimale est refusée", () => {
  assert.throws(
    () => resolveMeleeStunts({
      extraSuccesses: 2,

      allocation: [
        {
          key: MELEE_STUNT_KEYS.VIGOR_DAMAGE,
          quantity: 1.5
        }
      ]
    }),
    TypeError
  );
});


/* ============================================================
 * ALLOCATION COMBINÉE
 * ============================================================ */


test("plusieurs éclats peuvent partager le budget disponible", () => {
  const result =
    resolveMeleeStunts({
      extraSuccesses: 6,

      allocation: [
        {
          key: MELEE_STUNT_KEYS.VIGOR_DAMAGE,
          quantity: 2
        },
        {
          key: MELEE_STUNT_KEYS.AGILITY_DAMAGE,
          quantity: 1
        },
        {
          key: MELEE_STUNT_KEYS.SWAP_INITIATIVE,
          quantity: 1
        },
        {
          key: MELEE_STUNT_KEYS.DISARM,
          quantity: 1
        },
        {
          key: MELEE_STUNT_KEYS.GRAPPLE,
          quantity: 1
        }
      ]
    });

  assert.equal(
    result.available,
    6
  );

  assert.equal(
    result.spent,
    6
  );

  assert.equal(
    result.remaining,
    0
  );

  assert.deepEqual(
    result.effects,
    {
      vigorDamage: 2,
      agilityDamage: 1,
      swapInitiative: true,
      disarm: true,
      knockdown: false,
      grapple: true
    }
  );
});


test("les sélections à quantité zéro ne sont pas retournées", () => {
  const result =
    resolveMeleeStunts({
      extraSuccesses: 2,

      allocation: [
        {
          key: MELEE_STUNT_KEYS.VIGOR_DAMAGE,
          quantity: 2
        },
        {
          key: MELEE_STUNT_KEYS.DISARM,
          quantity: 0
        }
      ]
    });

  assert.equal(
    result.selections.length,
    1
  );

  assert.equal(
    result.selections[0].key,
    MELEE_STUNT_KEYS.VIGOR_DAMAGE
  );
});


test("chaque sélection expose key, quantity, cost et spent", () => {
  const result =
    resolveMeleeStunts({
      extraSuccesses: 2,

      allocation: {
        vigorDamage: 1,
        disarm: true
      }
    });

  assert.deepEqual(
    result.selections,
    [
      {
        key: "vigor-damage",
        quantity: 1,
        cost: 1,
        spent: 1
      },
      {
        key: "disarm",
        quantity: 1,
        cost: 1,
        spent: 1
      }
    ]
  );
});


test("resolveMeleeStunts ne modifie pas l'allocation reçue", () => {
  const allocation = [
    {
      key: MELEE_STUNT_KEYS.VIGOR_DAMAGE,
      quantity: 2
    }
  ];

  resolveMeleeStunts({
    extraSuccesses: 2,
    allocation
  });

  assert.deepEqual(
    allocation,
    [
      {
        key: "vigor-damage",
        quantity: 2
      }
    ]
  );
});