import test from "node:test";
import assert from "node:assert/strict";

import {
  ACTION_COSTS,
  COMBAT_ACTIONS,
  getCombatAction,
  isValidActionCost,
  createCombatActionState,
  normalizeCombatActionState,
  getRemainingFastActions,
  hasSlowActionAvailable,
  canSpendAction,
  spendAction,
  canPerformCombatAction,
  spendCombatAction
} from "../../../src/domain/rules/combat-actions.mjs";


/* ============================================================
 * CONSTANTES ET DÉFINITIONS
 * ============================================================ */

test("ACTION_COSTS contient les deux coûts attendus", () => {
  assert.deepEqual(ACTION_COSTS, {
    FAST: "fast",
    SLOW: "slow"
  });
});


test("ACTION_COSTS est gelé", () => {
  assert.equal(Object.isFrozen(ACTION_COSTS), true);
});


test("COMBAT_ACTIONS contient les neuf actions attendues", () => {
  assert.deepEqual(
    Object.keys(COMBAT_ACTIONS),
    [
      "MELEE_ATTACK",
      "RANGED_ATTACK",
      "GRAPPLE_ESCAPE",
      "RELOAD_WEAPON",
      "MELEE_BLOCK",
      "GRAPPLE_ATTACK",
      "MOVE",
      "CRAWL",
      "RETREAT"
    ]
  );
});


test("COMBAT_ACTIONS est gelé", () => {
  assert.equal(Object.isFrozen(COMBAT_ACTIONS), true);
});


test("les définitions internes de COMBAT_ACTIONS ne sont actuellement pas gelées", () => {
  assert.equal(Object.isFrozen(COMBAT_ACTIONS.MELEE_ATTACK), false);
  assert.equal(Object.isFrozen(COMBAT_ACTIONS.MELEE_BLOCK), false);
});


test("les actions lentes possèdent les identifiants et coûts attendus", () => {
  assert.deepEqual(
    [
      COMBAT_ACTIONS.MELEE_ATTACK,
      COMBAT_ACTIONS.RANGED_ATTACK,
      COMBAT_ACTIONS.GRAPPLE_ESCAPE,
      COMBAT_ACTIONS.RELOAD_WEAPON,
      COMBAT_ACTIONS.CRAWL
    ].map(({ id, cost }) => ({ id, cost })),
    [
      { id: "melee-attack", cost: "slow" },
      { id: "ranged-attack", cost: "slow" },
      { id: "grapple-escape", cost: "slow" },
      { id: "reload-weapon", cost: "slow" },
      { id: "crawl", cost: "slow" }
    ]
  );
});


test("les actions rapides possèdent les identifiants et coûts attendus", () => {
  assert.deepEqual(
    [
      COMBAT_ACTIONS.MELEE_BLOCK,
      COMBAT_ACTIONS.GRAPPLE_ATTACK,
      COMBAT_ACTIONS.MOVE,
      COMBAT_ACTIONS.RETREAT
    ].map(({ id, cost }) => ({ id, cost })),
    [
      { id: "melee-block", cost: "fast" },
      { id: "grapple-attack", cost: "fast" },
      { id: "move", cost: "fast" },
      { id: "retreat", cost: "fast" }
    ]
  );
});


test("MELEE_BLOCK est actuellement la seule définition marquée comme réaction", () => {
  assert.equal(COMBAT_ACTIONS.MELEE_BLOCK.reaction, true);

  for (const [key, action] of Object.entries(COMBAT_ACTIONS)) {
    if (key === "MELEE_BLOCK") continue;

    assert.equal(
      action.reaction,
      undefined
    );
  }
});


/* ============================================================
 * LOOKUP ET VALIDATION DES COÛTS
 * ============================================================ */

test("getCombatAction retourne la définition originale d'une action connue", () => {
  assert.equal(
    getCombatAction("move"),
    COMBAT_ACTIONS.MOVE
  );
});


test("getCombatAction retourne null pour une action inconnue ou absente", () => {
  assert.equal(
    getCombatAction("unknown"),
    null
  );

  assert.equal(
    getCombatAction(),
    null
  );
});


test("getCombatAction est sensible à la casse et ne normalise pas les espaces", () => {
  assert.equal(
    getCombatAction("MOVE"),
    null
  );

  assert.equal(
    getCombatAction(" move "),
    null
  );
});


test("isValidActionCost accepte fast et slow", () => {
  assert.equal(
    isValidActionCost(ACTION_COSTS.FAST),
    true
  );

  assert.equal(
    isValidActionCost(ACTION_COSTS.SLOW),
    true
  );
});


test("isValidActionCost refuse les autres valeurs", () => {
  for (
    const cost
    of [
      undefined,
      null,
      "FAST",
      " fast ",
      "free",
      1,
      true
    ]
  ) {
    assert.equal(
      isValidActionCost(cost),
      false
    );
  }
});


/* ============================================================
 * ÉTAT INITIAL ET NORMALISATION
 * ============================================================ */

test("createCombatActionState crée l'état initial attendu", () => {
  assert.deepEqual(
    createCombatActionState(),
    {
      slowUsed: false,
      fastUsed: 0
    }
  );
});


test("createCombatActionState retourne un nouvel objet à chaque appel", () => {
  assert.notEqual(
    createCombatActionState(),
    createCombatActionState()
  );
});


test("normalizeCombatActionState utilise un état vide par défaut", () => {
  assert.deepEqual(
    normalizeCombatActionState(),
    {
      slowUsed: false,
      fastUsed: 0
    }
  );
});


test("slowUsed n'est reconnu que lorsqu'il vaut strictement true", () => {
  for (
    const slowUsed
    of [
      false,
      1,
      "true",
      "false",
      null,
      undefined
    ]
  ) {
    assert.equal(
      normalizeCombatActionState({
        slowUsed
      }).slowUsed,
      false
    );
  }

  assert.equal(
    normalizeCombatActionState({
      slowUsed: true
    }).slowUsed,
    true
  );
});


test("fastUsed conserve les valeurs entières valides", () => {
  for (
    const fastUsed
    of [
      0,
      1,
      2
    ]
  ) {
    assert.equal(
      normalizeCombatActionState({
        fastUsed
      }).fastUsed,
      fastUsed
    );
  }
});


test("fastUsed non entier est actuellement normalisé à zéro", () => {
  for (
    const fastUsed
    of [
      undefined,
      null,
      "1",
      1.5,
      NaN,
      Infinity,
      true,
      false
    ]
  ) {
    assert.equal(
      normalizeCombatActionState({
        fastUsed
      }).fastUsed,
      0
    );
  }
});


test("fastUsed inférieur à zéro est refusé", () => {
  assert.throws(
    () =>
      normalizeCombatActionState({
        fastUsed: -1
      }),
    {
      name: "RangeError",
      message:
        "fastUsed doit être compris entre 0 et 2."
    }
  );
});


test("fastUsed supérieur à deux est refusé", () => {
  assert.throws(
    () =>
      normalizeCombatActionState({
        fastUsed: 3
      }),
    {
      name: "RangeError",
      message:
        "fastUsed doit être compris entre 0 et 2."
    }
  );
});


test("une action lente ne peut pas coexister avec deux actions rapides", () => {
  assert.throws(
    () =>
      normalizeCombatActionState({
        slowUsed: true,
        fastUsed: 2
      }),
    {
      message:
        "État d'actions invalide : une action lente ne peut pas coexister avec deux actions rapides."
    }
  );
});


test("une action lente peut coexister avec une seule action rapide", () => {
  assert.deepEqual(
    normalizeCombatActionState({
      slowUsed: true,
      fastUsed: 1
    }),
    {
      slowUsed: true,
      fastUsed: 1
    }
  );
});


test("normalizeCombatActionState retourne un nouvel objet", () => {
  const state = {
    slowUsed: false,
    fastUsed: 1
  };

  const normalized =
    normalizeCombatActionState(
      state
    );

  assert.notEqual(
    normalized,
    state
  );

  assert.deepEqual(
    normalized,
    state
  );
});


/* ============================================================
 * ACTIONS RAPIDES RESTANTES
 * ============================================================ */

test("un combattant frais possède deux actions rapides", () => {
  assert.equal(
    getRemainingFastActions(
      createCombatActionState()
    ),
    2
  );
});


test("après une action rapide il reste une action rapide", () => {
  assert.equal(
    getRemainingFastActions({
      slowUsed: false,
      fastUsed: 1
    }),
    1
  );
});


test("après deux actions rapides il ne reste plus d'action rapide", () => {
  assert.equal(
    getRemainingFastActions({
      slowUsed: false,
      fastUsed: 2
    }),
    0
  );
});


test("après une action lente il ne reste au maximum qu'une action rapide", () => {
  assert.equal(
    getRemainingFastActions({
      slowUsed: true,
      fastUsed: 0
    }),
    1
  );
});


test("après une lente et une rapide il ne reste plus d'action rapide", () => {
  assert.equal(
    getRemainingFastActions({
      slowUsed: true,
      fastUsed: 1
    }),
    0
  );
});


/* ============================================================
 * ACTION LENTE DISPONIBLE
 * ============================================================ */

test("une action lente est disponible dans l'état initial", () => {
  assert.equal(
    hasSlowActionAvailable(
      createCombatActionState()
    ),
    true
  );
});


test("une action lente reste disponible après une seule action rapide", () => {
  assert.equal(
    hasSlowActionAvailable({
      slowUsed: false,
      fastUsed: 1
    }),
    true
  );
});


test("une action lente n'est plus disponible après deux actions rapides", () => {
  assert.equal(
    hasSlowActionAvailable({
      slowUsed: false,
      fastUsed: 2
    }),
    false
  );
});


test("une seconde action lente n'est pas disponible", () => {
  assert.equal(
    hasSlowActionAvailable({
      slowUsed: true,
      fastUsed: 0
    }),
    false
  );
});


/* ============================================================
 * canSpendAction
 * ============================================================ */

test("canSpendAction refuse un coût inconnu avec le message attendu", () => {
  assert.throws(
    () =>
      canSpendAction(
        {},
        "free"
      ),
    {
      name: "TypeError",
      message:
        "Coût d'action inconnu : free."
    }
  );
});


test("canSpendAction valide le coût avant de normaliser l'état", () => {
  assert.throws(
    () =>
      canSpendAction(
        null,
        "free"
      ),
    {
      name: "TypeError",
      message:
        "Coût d'action inconnu : free."
    }
  );
});


test("canSpendAction applique les disponibilités des actions rapides", () => {
  assert.equal(
    canSpendAction(
      {
        slowUsed: false,
        fastUsed: 0
      },
      "fast"
    ),
    true
  );

  assert.equal(
    canSpendAction(
      {
        slowUsed: false,
        fastUsed: 1
      },
      "fast"
    ),
    true
  );

  assert.equal(
    canSpendAction(
      {
        slowUsed: false,
        fastUsed: 2
      },
      "fast"
    ),
    false
  );

  assert.equal(
    canSpendAction(
      {
        slowUsed: true,
        fastUsed: 0
      },
      "fast"
    ),
    true
  );

  assert.equal(
    canSpendAction(
      {
        slowUsed: true,
        fastUsed: 1
      },
      "fast"
    ),
    false
  );
});


test("canSpendAction applique les disponibilités des actions lentes", () => {
  assert.equal(
    canSpendAction(
      {
        slowUsed: false,
        fastUsed: 0
      },
      "slow"
    ),
    true
  );

  assert.equal(
    canSpendAction(
      {
        slowUsed: false,
        fastUsed: 1
      },
      "slow"
    ),
    true
  );

  assert.equal(
    canSpendAction(
      {
        slowUsed: false,
        fastUsed: 2
      },
      "slow"
    ),
    false
  );

  assert.equal(
    canSpendAction(
      {
        slowUsed: true,
        fastUsed: 0
      },
      "slow"
    ),
    false
  );

  assert.equal(
    canSpendAction(
      {
        slowUsed: true,
        fastUsed: 1
      },
      "slow"
    ),
    false
  );
});


/* ============================================================
 * spendAction
 * ============================================================ */

test("dépenser une action rapide incrémente fastUsed", () => {
  assert.deepEqual(
    spendAction(
      {
        slowUsed: false,
        fastUsed: 0
      },
      "fast"
    ),
    {
      slowUsed: false,
      fastUsed: 1
    }
  );
});


test("deux dépenses rapides successives produisent fastUsed égal à deux", () => {
  const first =
    spendAction(
      createCombatActionState(),
      "fast"
    );

  const second =
    spendAction(
      first,
      "fast"
    );

  assert.deepEqual(
    second,
    {
      slowUsed: false,
      fastUsed: 2
    }
  );
});


test("dépenser une action lente active slowUsed", () => {
  assert.deepEqual(
    spendAction(
      createCombatActionState(),
      "slow"
    ),
    {
      slowUsed: true,
      fastUsed: 0
    }
  );
});


test("une action lente peut être dépensée après une seule rapide", () => {
  assert.deepEqual(
    spendAction(
      {
        slowUsed: false,
        fastUsed: 1
      },
      "slow"
    ),
    {
      slowUsed: true,
      fastUsed: 1
    }
  );
});


test("une action rapide peut être dépensée après une action lente", () => {
  assert.deepEqual(
    spendAction(
      {
        slowUsed: true,
        fastUsed: 0
      },
      "fast"
    ),
    {
      slowUsed: true,
      fastUsed: 1
    }
  );
});


test("dépenser une action rapide indisponible produit une erreur", () => {
  assert.throws(
    () =>
      spendAction(
        {
          slowUsed: false,
          fastUsed: 2
        },
        "fast"
      ),
    {
      message:
        "Action fast indisponible."
    }
  );
});


test("dépenser une action lente indisponible produit une erreur", () => {
  assert.throws(
    () =>
      spendAction(
        {
          slowUsed: true,
          fastUsed: 0
        },
        "slow"
      ),
    {
      message:
        "Action slow indisponible."
    }
  );
});


test("spendAction ne modifie jamais l'état reçu", () => {
  const state = {
    slowUsed: false,
    fastUsed: 0
  };

  const next =
    spendAction(
      state,
      "fast"
    );

  assert.notEqual(
    next,
    state
  );

  assert.deepEqual(
    state,
    {
      slowUsed: false,
      fastUsed: 0
    }
  );
});


test("spendAction normalise l'état avant de valider le coût", () => {
  assert.throws(
    () =>
      spendAction(
        {
          slowUsed: true,
          fastUsed: 2
        },
        "free"
      ),
    {
      message:
        "État d'actions invalide : une action lente ne peut pas coexister avec deux actions rapides."
    }
  );
});


/* ============================================================
 * ACTIONS IDENTIFIÉES
 * ============================================================ */

test("canPerformCombatAction applique le coût défini par l'action", () => {
  const state = {
    slowUsed: false,
    fastUsed: 1
  };

  assert.equal(
    canPerformCombatAction(
      state,
      "move"
    ),
    true
  );

  assert.equal(
    canPerformCombatAction(
      state,
      "melee-attack"
    ),
    true
  );

  const twoFast = {
    slowUsed: false,
    fastUsed: 2
  };

  assert.equal(
    canPerformCombatAction(
      twoFast,
      "move"
    ),
    false
  );

  assert.equal(
    canPerformCombatAction(
      twoFast,
      "melee-attack"
    ),
    false
  );
});


test("canPerformCombatAction refuse une action inconnue", () => {
  assert.throws(
    () =>
      canPerformCombatAction(
        {},
        "unknown"
      ),
    {
      message:
        "Action de combat inconnue : unknown."
    }
  );
});


test("spendCombatAction dépense correctement une action rapide identifiée", () => {
  assert.deepEqual(
    spendCombatAction(
      createCombatActionState(),
      "move"
    ),
    {
      slowUsed: false,
      fastUsed: 1
    }
  );
});


test("spendCombatAction dépense correctement une action lente identifiée", () => {
  assert.deepEqual(
    spendCombatAction(
      createCombatActionState(),
      "ranged-attack"
    ),
    {
      slowUsed: true,
      fastUsed: 0
    }
  );
});


test("spendCombatAction refuse une action inconnue", () => {
  assert.throws(
    () =>
      spendCombatAction(
        {},
        "unknown"
      ),
    {
      message:
        "Action de combat inconnue : unknown."
    }
  );
});