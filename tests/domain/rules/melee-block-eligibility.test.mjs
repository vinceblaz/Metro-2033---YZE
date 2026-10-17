import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveMeleeBlockEligibility
} from "../../../src/domain/rules/melee-block-eligibility.mjs";


/* ============================================================
 * ATTAQUES EXPLICITEMENT NON BLOQUABLES
 * ============================================================ */


test("une attaque explicitement non bloquable est refusée", () => {
  assert.deepEqual(
    resolveMeleeBlockEligibility({
      attack: {
        blockable: false
      }
    }),
    {
      eligible: false,
      reason: "attack-not-blockable",
      requiresBlockingItem: false
    }
  );
});


test("l'interdiction explicite de blocage est prioritaire sur le reste", () => {
  assert.deepEqual(
    resolveMeleeBlockEligibility({
      attack: {
        blockable: false,
        type: "weapon"
      },

      defense: {
        hasFastAction: false,
        hasBlockingItem: false
      }
    }),
    {
      eligible: false,
      reason: "attack-not-blockable",
      requiresBlockingItem: false
    }
  );
});


/* ============================================================
 * ATTAQUE À MAINS NUES
 * ============================================================ */


test("une attaque sans type est considérée comme unarmed", () => {
  assert.deepEqual(
    resolveMeleeBlockEligibility(),
    {
      eligible: true,
      reason: "unarmed-block",
      requiresBlockingItem: false
    }
  );
});


test("une attaque unarmed peut être bloquée sans objet", () => {
  assert.deepEqual(
    resolveMeleeBlockEligibility({
      attack: {
        type: "unarmed"
      },

      defense: {
        hasFastAction: true,
        hasBlockingItem: false
      }
    }),
    {
      eligible: true,
      reason: "unarmed-block",
      requiresBlockingItem: false
    }
  );
});


test("un objet de blocage n'est pas requis pour une attaque unarmed", () => {
  const result =
    resolveMeleeBlockEligibility({
      attack: {
        type: "unarmed"
      },

      defense: {
        hasBlockingItem: true
      }
    });

  assert.equal(
    result.requiresBlockingItem,
    false
  );
});


/* ============================================================
 * ATTAQUE AVEC ARME
 * ============================================================ */


test("une attaque weapon exige un objet de blocage", () => {
  assert.deepEqual(
    resolveMeleeBlockEligibility({
      attack: {
        type: "weapon"
      },

      defense: {
        hasBlockingItem: false
      }
    }),
    {
      eligible: false,
      reason: "blocking-item-required",
      requiresBlockingItem: true
    }
  );
});


test("une attaque weapon peut être bloquée avec un objet adapté", () => {
  assert.deepEqual(
    resolveMeleeBlockEligibility({
      attack: {
        type: "weapon"
      },

      defense: {
        hasBlockingItem: true
      }
    }),
    {
      eligible: true,
      reason: "blocking-item",
      requiresBlockingItem: true
    }
  );
});


test("hasBlockingItem doit être strictement true pour bloquer une arme", () => {
  for (
    const value
    of [
      undefined,
      null,
      false,
      0,
      1,
      "true"
    ]
  ) {
    const result =
      resolveMeleeBlockEligibility({
        attack: {
          type: "weapon"
        },

        defense: {
          hasBlockingItem: value
        }
      });

    assert.equal(
      result.eligible,
      false
    );

    assert.equal(
      result.reason,
      "blocking-item-required"
    );
  }
});


/* ============================================================
 * ANIMAUX ET CRÉATURES
 * ============================================================ */


test("une attaque animal exige un objet de blocage", () => {
  assert.deepEqual(
    resolveMeleeBlockEligibility({
      attack: {
        type: "animal"
      },

      defense: {
        hasBlockingItem: false
      }
    }),
    {
      eligible: false,
      reason: "blocking-item-required",
      requiresBlockingItem: true
    }
  );
});


test("une attaque animal est bloquable avec un objet", () => {
  assert.deepEqual(
    resolveMeleeBlockEligibility({
      attack: {
        type: "animal"
      },

      defense: {
        hasBlockingItem: true
      }
    }),
    {
      eligible: true,
      reason: "blocking-item",
      requiresBlockingItem: true
    }
  );
});


test("une attaque creature exige un objet de blocage", () => {
  assert.deepEqual(
    resolveMeleeBlockEligibility({
      attack: {
        type: "creature"
      },

      defense: {
        hasBlockingItem: false
      }
    }),
    {
      eligible: false,
      reason: "blocking-item-required",
      requiresBlockingItem: true
    }
  );
});


test("une attaque creature est bloquable avec un objet", () => {
  assert.deepEqual(
    resolveMeleeBlockEligibility({
      attack: {
        type: "creature"
      },

      defense: {
        hasBlockingItem: true
      }
    }),
    {
      eligible: true,
      reason: "blocking-item",
      requiresBlockingItem: true
    }
  );
});


/* ============================================================
 * TYPES INCONNUS
 * ============================================================ */


test("un type d'attaque inconnu est refusé", () => {
  assert.throws(
    () => resolveMeleeBlockEligibility({
      attack: {
        type: "unknown"
      }
    }),
    TypeError
  );
});


test("une chaîne vide est un type inconnu et n'utilise pas le défaut unarmed", () => {
  assert.throws(
    () => resolveMeleeBlockEligibility({
      attack: {
        type: ""
      }
    }),
    TypeError
  );
});


/* ============================================================
 * PRIORITÉS DE RÉSOLUTION
 * ============================================================ */


test("attack-not-blockable reste prioritaire même avec un type inconnu", () => {
  assert.deepEqual(
    resolveMeleeBlockEligibility({
      attack: {
        type: "unknown",
        blockable: false
      }
    }),
    {
      eligible: false,
      reason: "attack-not-blockable",
      requiresBlockingItem: false
    }
  );
});


/* ============================================================
 * NON-MUTATION
 * ============================================================ */


test("resolveMeleeBlockEligibility ne modifie pas attack ni defense", () => {
  const attack = {
    type: "weapon",
    blockable: true
  };

  const defense = {
    hasFastAction: true,
    hasBlockingItem: true
  };

  resolveMeleeBlockEligibility({
    attack,
    defense
  });

  assert.deepEqual(
    attack,
    {
      type: "weapon",
      blockable: true
    }
  );

  assert.deepEqual(
    defense,
    {
      hasFastAction: true,
      hasBlockingItem: true
    }
  );
});