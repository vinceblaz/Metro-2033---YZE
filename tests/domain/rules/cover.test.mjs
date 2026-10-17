import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveCover
} from "../../../src/domain/rules/cover.mjs";


/* ============================================================
 * VALIDATION — value
 * ============================================================ */


test("value doit être un entier positif ou nul", () => {
  for (
    const value
    of [
      -1,
      1.5,
      "2",
      NaN,
      Infinity,
      false
    ]
  ) {
    assert.throws(
      () =>
        resolveCover({
          value
        }),
      RangeError
    );
  }
});


test("l'erreur de value possède le message attendu", () => {
  assert.throws(
    () =>
      resolveCover({
        value: -1
      }),
    {
      name: "RangeError",
      message:
        "La Protection d'un abri doit être un entier positif ou nul."
    }
  );
});


/* ============================================================
 * VALIDATION — range
 * ============================================================ */


test("la portée contact est acceptée", () => {
  assert.doesNotThrow(
    () =>
      resolveCover({
        value: 1,
        range: "contact"
      })
  );
});


test("la portée short est acceptée", () => {
  assert.doesNotThrow(
    () =>
      resolveCover({
        value: 1,
        range: "short"
      })
  );
});


test("la portée medium est acceptée", () => {
  assert.doesNotThrow(
    () =>
      resolveCover({
        value: 1,
        range: "medium"
      })
  );
});


test("une portée inconnue est refusée", () => {
  assert.throws(
    () =>
      resolveCover({
        value: 1,
        range: "long"
      }),
    {
      message:
        "Portée invalide pour un abri : long."
    }
  );
});


test("la portée est sensible à la casse", () => {
  assert.throws(
    () =>
      resolveCover({
        value: 1,
        range: "Short"
      }),
    {
      message:
        "Portée invalide pour un abri : Short."
    }
  );
});


test("la portée n'est pas normalisée par suppression des espaces", () => {
  assert.throws(
    () =>
      resolveCover({
        value: 1,
        range: " short "
      }),
    {
      message:
        "Portée invalide pour un abri :  short ."
    }
  );
});


/* ============================================================
 * VALIDATION — protectionReduction
 * ============================================================ */


test("protectionReduction doit être un entier positif ou nul", () => {
  for (
    const protectionReduction
    of [
      -1,
      1.5,
      "1",
      NaN,
      Infinity,
      false
    ]
  ) {
    assert.throws(
      () =>
        resolveCover({
          value: 3,
          protectionReduction
        }),
      RangeError
    );
  }
});


test("l'erreur de protectionReduction possède le message attendu", () => {
  assert.throws(
    () =>
      resolveCover({
        value: 3,
        protectionReduction: -1
      }),
    {
      name: "RangeError",
      message:
        "La réduction de Protection doit être un entier positif ou nul."
    }
  );
});


test("la portée est validée avant protectionReduction", () => {
  assert.throws(
    () =>
      resolveCover({
        value: 3,
        range: "long",
        protectionReduction: -1
      }),
    {
      message:
        "Portée invalide pour un abri : long."
    }
  );
});


/* ============================================================
 * VALEURS PAR DÉFAUT
 * ============================================================ */


test("resolveCover utilise ses valeurs par défaut", () => {
  assert.deepEqual(
    resolveCover(),
    {
      applies: false,
      reason: "no-effective-cover",
      baseProtection: 0,
      protectionReduction: 0,
      effectiveProtection: 0,
      totalCover: false,
      contactAllowed: true
    }
  );
});


test("la portée par défaut est short et n'ignore donc pas automatiquement l'abri", () => {
  const result =
    resolveCover({
      value: 2
    });

  assert.equal(
    result.applies,
    true
  );

  assert.equal(
    result.reason,
    "cover-applies"
  );

  assert.equal(
    result.effectiveProtection,
    2
  );
});


/* ============================================================
 * ABRI NORMAL
 * ============================================================ */


test("un abri positif à courte portée s'applique", () => {
  assert.deepEqual(
    resolveCover({
      value: 3,
      range: "short"
    }),
    {
      applies: true,
      reason: "cover-applies",
      baseProtection: 3,
      protectionReduction: 0,
      effectiveProtection: 3,
      totalCover: false,
      contactAllowed: true
    }
  );
});


test("un abri positif à moyenne portée s'applique", () => {
  const result =
    resolveCover({
      value: 2,
      range: "medium"
    });

  assert.equal(
    result.applies,
    true
  );

  assert.equal(
    result.effectiveProtection,
    2
  );
});


test("un abri de valeur zéro ne s'applique pas", () => {
  const result =
    resolveCover({
      value: 0,
      range: "short"
    });

  assert.equal(
    result.applies,
    false
  );

  assert.equal(
    result.reason,
    "no-effective-cover"
  );

  assert.equal(
    result.effectiveProtection,
    0
  );
});


/* ============================================================
 * CONTACT
 * ============================================================ */


test("au contact l'abri est ignoré par défaut", () => {
  assert.deepEqual(
    resolveCover({
      value: 4,
      range: "contact"
    }),
    {
      applies: false,
      reason: "contact-bypasses-cover",
      baseProtection: 4,
      protectionReduction: 0,
      effectiveProtection: 0,
      totalCover: false,
      contactAllowed: true
    }
  );
});


test("au contact un abri total empêche l'ignorance automatique de l'abri", () => {
  const result =
    resolveCover({
      value: 4,
      range: "contact",
      totalCover: true
    });

  assert.equal(
    result.applies,
    true
  );

  assert.equal(
    result.reason,
    "cover-applies"
  );

  assert.equal(
    result.effectiveProtection,
    4
  );
});


test("au contact contactAllowed false empêche l'ignorance automatique de l'abri", () => {
  const result =
    resolveCover({
      value: 4,
      range: "contact",
      contactAllowed: false
    });

  assert.equal(
    result.applies,
    true
  );

  assert.equal(
    result.reason,
    "cover-applies"
  );

  assert.equal(
    result.effectiveProtection,
    4
  );
});


test("au contact totalCover true reste prioritaire sur contactAllowed true", () => {
  const result =
    resolveCover({
      value: 3,
      range: "contact",
      totalCover: true,
      contactAllowed: true
    });

  assert.equal(
    result.reason,
    "cover-applies"
  );

  assert.equal(
    result.effectiveProtection,
    3
  );
});


test("au contact un abri ignoré ne rapporte aucune réduction de Protection", () => {
  const result =
    resolveCover({
      value: 5,
      range: "contact",
      protectionReduction: 2
    });

  assert.equal(
    result.protectionReduction,
    0
  );

  assert.equal(
    result.effectiveProtection,
    0
  );
});


/* ============================================================
 * RÉDUCTION DE PROTECTION
 * ============================================================ */


test("la réduction diminue la Protection effective", () => {
  const result =
    resolveCover({
      value: 4,
      range: "short",
      protectionReduction: 2
    });

  assert.equal(
    result.baseProtection,
    4
  );

  assert.equal(
    result.protectionReduction,
    2
  );

  assert.equal(
    result.effectiveProtection,
    2
  );

  assert.equal(
    result.applies,
    true
  );
});


test("une réduction égale à la Protection annule l'abri", () => {
  const result =
    resolveCover({
      value: 3,
      protectionReduction: 3
    });

  assert.equal(
    result.protectionReduction,
    3
  );

  assert.equal(
    result.effectiveProtection,
    0
  );

  assert.equal(
    result.applies,
    false
  );

  assert.equal(
    result.reason,
    "no-effective-cover"
  );
});


test("une réduction supérieure à la Protection ne produit jamais de Protection négative", () => {
  const result =
    resolveCover({
      value: 3,
      protectionReduction: 10
    });

  assert.equal(
    result.effectiveProtection,
    0
  );

  assert.equal(
    result.applies,
    false
  );
});


test("la réduction retournée est plafonnée à la Protection de base", () => {
  const result =
    resolveCover({
      value: 3,
      protectionReduction: 10
    });

  assert.equal(
    result.protectionReduction,
    3
  );

  assert.equal(
    result.baseProtection,
    3
  );
});


test("une réduction peut aussi s'appliquer au contact lorsque l'abri n'est pas ignoré", () => {
  const result =
    resolveCover({
      value: 5,
      range: "contact",
      totalCover: true,
      protectionReduction: 2
    });

  assert.equal(
    result.applies,
    true
  );

  assert.equal(
    result.protectionReduction,
    2
  );

  assert.equal(
    result.effectiveProtection,
    3
  );
});


/* ============================================================
 * BOOLÉENS / VÉRITÉ JAVASCRIPT
 * ============================================================ */


test("totalCover utilise actuellement la vérité JavaScript", () => {
  const result =
    resolveCover({
      value: 2,
      range: "contact",
      totalCover: "false"
    });

  assert.equal(
    result.applies,
    true
  );

  assert.equal(
    result.totalCover,
    "false"
  );
});


test("contactAllowed utilise actuellement la vérité JavaScript", () => {
  const result =
    resolveCover({
      value: 2,
      range: "contact",
      contactAllowed: 0
    });

  assert.equal(
    result.applies,
    true
  );

  assert.equal(
    result.contactAllowed,
    0
  );
});


test("une valeur truthy de contactAllowed permet actuellement d'ignorer l'abri au contact", () => {
  const result =
    resolveCover({
      value: 2,
      range: "contact",
      contactAllowed: "yes"
    });

  assert.equal(
    result.applies,
    false
  );

  assert.equal(
    result.reason,
    "contact-bypasses-cover"
  );

  assert.equal(
    result.contactAllowed,
    "yes"
  );
});


/* ============================================================
 * STRUCTURE DU RÉSULTAT
 * ============================================================ */


test("le résultat conserve les valeurs totalCover et contactAllowed fournies", () => {
  const result =
    resolveCover({
      value: 2,
      range: "short",
      totalCover: true,
      contactAllowed: false
    });

  assert.equal(
    result.totalCover,
    true
  );

  assert.equal(
    result.contactAllowed,
    false
  );
});


test("baseProtection conserve toujours la valeur originale de l'abri", () => {
  const result =
    resolveCover({
      value: 5,
      protectionReduction: 3
    });

  assert.equal(
    result.baseProtection,
    5
  );

  assert.equal(
    result.effectiveProtection,
    2
  );
});