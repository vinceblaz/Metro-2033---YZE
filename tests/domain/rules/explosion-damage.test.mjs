import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveExplosionDamage
} from "../../../src/domain/rules/explosion-damage.mjs";


/* ============================================================
 * ARGUMENT OBLIGATOIRE
 * ============================================================ */

test("un résultat d'explosion est obligatoire", () => {
  assert.throws(
    () =>
      resolveExplosionDamage(),
    {
      name: "TypeError",
      message:
        "Un résultat d'explosion est nécessaire."
    }
  );
});


test("un résultat d'explosion null est refusé", () => {
  assert.throws(
    () =>
      resolveExplosionDamage({
        explosionResult: null
      }),
    TypeError
  );
});


/* ============================================================
 * CIBLE HORS ZONE
 * ============================================================ */

test("une cible non affectée ne subit aucun dégât", () => {
  assert.deepEqual(
    resolveExplosionDamage({
      explosionResult: {
        affected: false,
        rawDamage: 5
      }
    }),
    {
      affected: false,
      rawDamage: 0,
      protectionPrevented: 0,
      remainingDamage: 0,
      takesDamage: false,
      knockdown: false
    }
  );
});


test("les dégâts bruts sont ignorés lorsque affected est falsy", () => {
  const result =
    resolveExplosionDamage({
      explosionResult: {
        affected: 0,
        rawDamage: 10
      }
    });

  assert.equal(
    result.affected,
    false
  );

  assert.equal(
    result.rawDamage,
    0
  );
});


test("la Protection est ignorée lorsque la cible n'est pas affectée", () => {
  const result =
    resolveExplosionDamage({
      explosionResult: {
        affected: false,
        rawDamage: 5
      },

      protectionResult: {
        totalPrevented: 3,
        remainingDamage: 2
      }
    });

  assert.equal(
    result.protectionPrevented,
    0
  );

  assert.equal(
    result.remainingDamage,
    0
  );
});


/* ============================================================
 * DÉGÂTS BRUTS NULS OU NÉGATIFS
 * ============================================================ */

test("rawDamage absent est traité comme zéro", () => {
  assert.deepEqual(
    resolveExplosionDamage({
      explosionResult: {
        affected: true
      }
    }),
    {
      affected: true,
      rawDamage: 0,
      protectionPrevented: 0,
      remainingDamage: 0,
      takesDamage: false,
      knockdown: false
    }
  );
});


test("rawDamage null est traité comme zéro", () => {
  const result =
    resolveExplosionDamage({
      explosionResult: {
        affected: true,
        rawDamage: null
      }
    });

  assert.equal(
    result.rawDamage,
    0
  );

  assert.equal(
    result.takesDamage,
    false
  );
});


test("rawDamage égal à zéro ne produit aucun dégât", () => {
  const result =
    resolveExplosionDamage({
      explosionResult: {
        affected: true,
        rawDamage: 0
      }
    });

  assert.equal(
    result.remainingDamage,
    0
  );

  assert.equal(
    result.knockdown,
    false
  );
});


test("rawDamage négatif est ramené à zéro dans le résultat", () => {
  const result =
    resolveExplosionDamage({
      explosionResult: {
        affected: true,
        rawDamage: -3
      }
    });

  assert.equal(
    result.rawDamage,
    0
  );

  assert.equal(
    result.remainingDamage,
    0
  );
});


test("la Protection n'est pas consultée lorsque rawDamage est nul", () => {
  const result =
    resolveExplosionDamage({
      explosionResult: {
        affected: true,
        rawDamage: 0
      },

      protectionResult: {
        totalPrevented: 99,
        remainingDamage: 99
      }
    });

  assert.equal(
    result.protectionPrevented,
    0
  );

  assert.equal(
    result.remainingDamage,
    0
  );
});


/* ============================================================
 * SANS PROTECTION
 * ============================================================ */

test("sans Protection tous les dégâts bruts passent", () => {
  assert.deepEqual(
    resolveExplosionDamage({
      explosionResult: {
        affected: true,
        rawDamage: 4
      }
    }),
    {
      affected: true,
      rawDamage: 4,
      protectionPrevented: 0,
      remainingDamage: 4,
      takesDamage: true,
      knockdown: true
    }
  );
});


test("protectionResult null équivaut à une absence de Protection", () => {
  const result =
    resolveExplosionDamage({
      explosionResult: {
        affected: true,
        rawDamage: 3
      },

      protectionResult: null
    });

  assert.equal(
    result.remainingDamage,
    3
  );

  assert.equal(
    result.takesDamage,
    true
  );
});


/* ============================================================
 * AVEC PROTECTION
 * ============================================================ */

test("le résultat de Protection fournit directement les dégâts restants", () => {
  assert.deepEqual(
    resolveExplosionDamage({
      explosionResult: {
        affected: true,
        rawDamage: 5
      },

      protectionResult: {
        totalPrevented: 2,
        remainingDamage: 3
      }
    }),
    {
      affected: true,
      rawDamage: 5,
      protectionPrevented: 2,
      remainingDamage: 3,
      takesDamage: true,
      knockdown: true
    }
  );
});


test("une Protection qui absorbe tous les dégâts empêche les dégâts et la chute", () => {
  const result =
    resolveExplosionDamage({
      explosionResult: {
        affected: true,
        rawDamage: 5
      },

      protectionResult: {
        totalPrevented: 5,
        remainingDamage: 0
      }
    });

  assert.equal(
    result.protectionPrevented,
    5
  );

  assert.equal(
    result.remainingDamage,
    0
  );

  assert.equal(
    result.takesDamage,
    false
  );

  assert.equal(
    result.knockdown,
    false
  );
});


test("totalPrevented absent est traité comme zéro", () => {
  const result =
    resolveExplosionDamage({
      explosionResult: {
        affected: true,
        rawDamage: 4
      },

      protectionResult: {
        remainingDamage: 2
      }
    });

  assert.equal(
    result.protectionPrevented,
    0
  );

  assert.equal(
    result.remainingDamage,
    2
  );
});


test("remainingDamage provenant de la Protection n'est pas recalculé depuis rawDamage", () => {
  const result =
    resolveExplosionDamage({
      explosionResult: {
        affected: true,
        rawDamage: 10
      },

      protectionResult: {
        totalPrevented: 1,
        remainingDamage: 2
      }
    });

  assert.equal(
    result.remainingDamage,
    2
  );

  assert.equal(
    result.protectionPrevented,
    1
  );
});


/* ============================================================
 * KNOCKDOWN
 * ============================================================ */

test("une victime tombe uniquement si elle subit réellement des dégâts", () => {
  const damaged =
    resolveExplosionDamage({
      explosionResult: {
        affected: true,
        rawDamage: 2
      }
    });

  const protectedTarget =
    resolveExplosionDamage({
      explosionResult: {
        affected: true,
        rawDamage: 2
      },

      protectionResult: {
        totalPrevented: 2,
        remainingDamage: 0
      }
    });

  assert.equal(
    damaged.knockdown,
    true
  );

  assert.equal(
    protectedTarget.knockdown,
    false
  );
});


test("takesDamage et knockdown restent synchronisés", () => {
  for (
    const remainingDamage
    of [
      0,
      1,
      5
    ]
  ) {
    const result =
      resolveExplosionDamage({
        explosionResult: {
          affected: true,
          rawDamage: 5
        },

        protectionResult: {
          totalPrevented: 0,
          remainingDamage
        }
      });

    assert.equal(
      result.knockdown,
      result.takesDamage
    );
  }
});


/* ============================================================
 * CARACTÉRISATION DES VALEURS NON VALIDÉES
 * ============================================================ */

test("affected utilise actuellement la vérité JavaScript", () => {
  const result =
    resolveExplosionDamage({
      explosionResult: {
        affected: "yes",
        rawDamage: 2
      }
    });

  assert.equal(
    result.affected,
    true
  );

  assert.equal(
    result.takesDamage,
    true
  );
});


test("une chaîne numérique positive comme rawDamage est actuellement acceptée", () => {
  const result =
    resolveExplosionDamage({
      explosionResult: {
        affected: true,
        rawDamage: "3"
      }
    });

  assert.equal(
    result.rawDamage,
    "3"
  );

  assert.equal(
    result.remainingDamage,
    "3"
  );

  assert.equal(
    result.takesDamage,
    true
  );
});


test("un objet protectionResult vide rend actuellement remainingDamage undefined", () => {
  const result =
    resolveExplosionDamage({
      explosionResult: {
        affected: true,
        rawDamage: 4
      },

      protectionResult: {}
    });

  assert.equal(
    result.protectionPrevented,
    0
  );

  assert.equal(
    result.remainingDamage,
    undefined
  );

  assert.equal(
    result.takesDamage,
    false
  );

  assert.equal(
    result.knockdown,
    false
  );
});


test("totalPrevented est actuellement conservé sans validation numérique", () => {
  const result =
    resolveExplosionDamage({
      explosionResult: {
        affected: true,
        rawDamage: 4
      },

      protectionResult: {
        totalPrevented: "2",
        remainingDamage: 2
      }
    });

  assert.equal(
    result.protectionPrevented,
    "2"
  );

  assert.equal(
    result.remainingDamage,
    2
  );
});


test("remainingDamage négatif fourni par la Protection ne produit pas de dégâts", () => {
  const result =
    resolveExplosionDamage({
      explosionResult: {
        affected: true,
        rawDamage: 4
      },

      protectionResult: {
        totalPrevented: 10,
        remainingDamage: -6
      }
    });

  assert.equal(
    result.remainingDamage,
    -6
  );

  assert.equal(
    result.takesDamage,
    false
  );

  assert.equal(
    result.knockdown,
    false
  );
});