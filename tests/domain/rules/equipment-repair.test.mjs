import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveEquipmentRepair
} from "../../../src/domain/rules/equipment-repair.mjs";


/* ============================================================
 * VALIDATION — current
 * ============================================================ */


test("current doit être un entier positif ou nul", () => {
  for (
    const current
    of [
      -1,
      1.5,
      "1",
      NaN,
      Infinity
    ]
  ) {
    assert.throws(
      () =>
        resolveEquipmentRepair({
          current,
          max: 3,
          successes: 1
        }),
      TypeError
    );
  }
});


test("l'erreur de current possède le message attendu", () => {
  assert.throws(
    () =>
      resolveEquipmentRepair({
        current: -1,
        max: 3,
        successes: 1
      }),
    {
      name: "TypeError",
      message:
        "current doit être un entier positif ou nul."
    }
  );
});


/* ============================================================
 * VALIDATION — max
 * ============================================================ */


test("max doit être un entier positif ou nul", () => {
  for (
    const max
    of [
      -1,
      1.5,
      "3",
      NaN,
      Infinity
    ]
  ) {
    assert.throws(
      () =>
        resolveEquipmentRepair({
          current: 0,
          max,
          successes: 2
        }),
      TypeError
    );
  }
});


test("l'erreur de max possède le message attendu", () => {
  assert.throws(
    () =>
      resolveEquipmentRepair({
        current: 0,
        max: -1,
        successes: 2
      }),
    {
      name: "TypeError",
      message:
        "max doit être un entier positif ou nul."
    }
  );
});


/* ============================================================
 * VALIDATION — COHÉRENCE current / max
 * ============================================================ */


test("current ne peut pas dépasser max", () => {
  assert.throws(
    () =>
      resolveEquipmentRepair({
        current: 4,
        max: 3,
        successes: 1
      }),
    {
      message:
        "Le bonus actuel ne peut pas dépasser le bonus maximal."
    }
  );
});


test("la cohérence current/max est vérifiée avant successes", () => {
  assert.throws(
    () =>
      resolveEquipmentRepair({
        current: 4,
        max: 3,
        successes: -1
      }),
    {
      message:
        "Le bonus actuel ne peut pas dépasser le bonus maximal."
    }
  );
});


/* ============================================================
 * VALIDATION — successes
 * ============================================================ */


test("successes doit être un entier positif ou nul", () => {
  for (
    const successes
    of [
      -1,
      1.5,
      "2",
      NaN,
      Infinity
    ]
  ) {
    assert.throws(
      () =>
        resolveEquipmentRepair({
          current: 1,
          max: 3,
          successes
        }),
      TypeError
    );
  }
});


test("l'erreur de successes possède le message attendu", () => {
  assert.throws(
    () =>
      resolveEquipmentRepair({
        current: 1,
        max: 3,
        successes: -1
      }),
    {
      name: "TypeError",
      message:
        "successes doit être un entier positif ou nul."
    }
  );
});


/* ============================================================
 * VALIDATION — repairable / état
 * ============================================================ */


test("un équipement non réparable est refusé", () => {
  assert.throws(
    () =>
      resolveEquipmentRepair({
        current: 1,
        max: 3,
        successes: 2,
        repairable: false
      }),
    {
      message:
        "Cet équipement ne peut plus être réparé."
    }
  );
});


test("repairable utilise actuellement la vérité JavaScript", () => {
  assert.throws(
    () =>
      resolveEquipmentRepair({
        current: 1,
        max: 3,
        successes: 1,
        repairable: 0
      }),
    {
      message:
        "Cet équipement ne peut plus être réparé."
    }
  );

  const result =
    resolveEquipmentRepair({
      current: 1,
      max: 3,
      successes: 1,
      repairable: "false"
    });

  assert.equal(
    result.success,
    true
  );
});


test("un équipement déjà au maximum n'est pas considéré comme endommagé", () => {
  assert.throws(
    () =>
      resolveEquipmentRepair({
        current: 3,
        max: 3,
        successes: 1
      }),
    {
      message:
        "Cet équipement n'est pas endommagé."
    }
  );
});


test("repairable false est vérifié avant l'état non endommagé", () => {
  assert.throws(
    () =>
      resolveEquipmentRepair({
        current: 3,
        max: 3,
        successes: 1,
        repairable: false
      }),
    {
      message:
        "Cet équipement ne peut plus être réparé."
    }
  );
});


/* ============================================================
 * ÉCHEC — ÉQUIPEMENT SIMPLEMENT ENDOMMAGÉ
 * ============================================================ */


test("zéro réussite fait échouer la réparation d'un équipement endommagé", () => {
  assert.deepEqual(
    resolveEquipmentRepair({
      current: 2,
      max: 4,
      successes: 0
    }),
    {
      success: false,
      wasBroken: false,
      previous: 2,
      current: 2,
      restored: 0,
      repairable: false,
      destroyed: false,
      successesUsed: 0,
      unusedSuccesses: 0
    }
  );
});


test("un échec rend actuellement l'équipement endommagé non réparable", () => {
  const result =
    resolveEquipmentRepair({
      current: 1,
      max: 3,
      successes: 0
    });

  assert.equal(
    result.repairable,
    false
  );

  assert.equal(
    result.destroyed,
    false
  );
});


/* ============================================================
 * ÉCHEC — ÉQUIPEMENT HORS D'USAGE
 * ============================================================ */


test("zéro réussite sur un équipement à zéro le détruit définitivement", () => {
  const result =
    resolveEquipmentRepair({
      current: 0,
      max: 3,
      successes: 0
    });

  assert.deepEqual(
    result,
    {
      success: false,
      wasBroken: true,
      previous: 0,
      current: 0,
      restored: 0,
      repairable: false,
      destroyed: true,
      successesUsed: 0,
      unusedSuccesses: 0
    }
  );
});


test("une seule réussite ne suffit pas à sauver un équipement à zéro", () => {
  assert.deepEqual(
    resolveEquipmentRepair({
      current: 0,
      max: 3,
      successes: 1
    }),
    {
      success: false,
      wasBroken: true,
      previous: 0,
      current: 0,
      restored: 0,
      repairable: false,
      destroyed: true,
      successesUsed: 1,
      unusedSuccesses: 0
    }
  );
});


/* ============================================================
 * RÉPARATION D'UN ÉQUIPEMENT HORS D'USAGE
 * ============================================================ */


test("deux réussites restaurent un point depuis zéro", () => {
  assert.deepEqual(
    resolveEquipmentRepair({
      current: 0,
      max: 4,
      successes: 2
    }),
    {
      success: true,
      wasBroken: true,
      previous: 0,
      current: 1,
      restored: 1,
      repairable: true,
      destroyed: false,
      successesUsed: 2,
      unusedSuccesses: 0
    }
  );
});


test("trois réussites restaurent deux points depuis zéro", () => {
  const result =
    resolveEquipmentRepair({
      current: 0,
      max: 4,
      successes: 3
    });

  assert.equal(
    result.current,
    2
  );

  assert.equal(
    result.restored,
    2
  );

  assert.equal(
    result.successesUsed,
    3
  );
});


test("quatre réussites restaurent trois points depuis zéro", () => {
  const result =
    resolveEquipmentRepair({
      current: 0,
      max: 5,
      successes: 4
    });

  assert.equal(
    result.current,
    3
  );

  assert.equal(
    result.restored,
    3
  );

  assert.equal(
    result.successesUsed,
    4
  );
});


test("la réparation depuis zéro est plafonnée à max", () => {
  const result =
    resolveEquipmentRepair({
      current: 0,
      max: 2,
      successes: 10
    });

  assert.equal(
    result.current,
    2
  );

  assert.equal(
    result.restored,
    2
  );

  assert.equal(
    result.successesUsed,
    3
  );

  assert.equal(
    result.unusedSuccesses,
    7
  );
});


test("un équipement hors d'usage avec max égal à 1 demande toujours deux réussites", () => {
  const result =
    resolveEquipmentRepair({
      current: 0,
      max: 1,
      successes: 2
    });

  assert.equal(
    result.success,
    true
  );

  assert.equal(
    result.current,
    1
  );

  assert.equal(
    result.successesUsed,
    2
  );
});


/* ============================================================
 * ÉQUIPEMENT SIMPLEMENT ENDOMMAGÉ
 * ============================================================ */


test("une réussite restaure un point sur un équipement simplement endommagé", () => {
  assert.deepEqual(
    resolveEquipmentRepair({
      current: 2,
      max: 4,
      successes: 1
    }),
    {
      success: true,
      wasBroken: false,
      previous: 2,
      current: 3,
      restored: 1,
      repairable: true,
      destroyed: false,
      successesUsed: 1,
      unusedSuccesses: 0
    }
  );
});


test("plusieurs réussites restaurent autant de points que possible", () => {
  const result =
    resolveEquipmentRepair({
      current: 1,
      max: 5,
      successes: 3
    });

  assert.equal(
    result.current,
    4
  );

  assert.equal(
    result.restored,
    3
  );

  assert.equal(
    result.successesUsed,
    3
  );

  assert.equal(
    result.unusedSuccesses,
    0
  );
});


test("la réparation d'un équipement endommagé est plafonnée au maximum", () => {
  const result =
    resolveEquipmentRepair({
      current: 3,
      max: 4,
      successes: 5
    });

  assert.equal(
    result.current,
    4
  );

  assert.equal(
    result.restored,
    1
  );

  assert.equal(
    result.successesUsed,
    1
  );

  assert.equal(
    result.unusedSuccesses,
    4
  );
});


test("previous conserve toujours la valeur avant réparation", () => {
  const result =
    resolveEquipmentRepair({
      current: 2,
      max: 5,
      successes: 2
    });

  assert.equal(
    result.previous,
    2
  );

  assert.equal(
    result.current,
    4
  );
});


/* ============================================================
 * CAS LIMITES
 * ============================================================ */


test("max égal à zéro et current égal à zéro est considéré comme non endommagé", () => {
  assert.throws(
    () =>
      resolveEquipmentRepair({
        current: 0,
        max: 0,
        successes: 2
      }),
    {
      message:
        "Cet équipement n'est pas endommagé."
    }
  );
});


test("les valeurs booléennes sont refusées pour les données numériques", () => {
  assert.throws(
    () =>
      resolveEquipmentRepair({
        current: false,
        max: 3,
        successes: 1
      }),
    TypeError
  );

  assert.throws(
    () =>
      resolveEquipmentRepair({
        current: 1,
        max: false,
        successes: 1
      }),
    TypeError
  );

  assert.throws(
    () =>
      resolveEquipmentRepair({
        current: 1,
        max: 3,
        successes: false
      }),
    TypeError
  );
});