import test from "node:test";
import assert from "node:assert/strict";

import {
  TALENT_ADVANCEMENT_COST,
  TALENT_PROGRESSION_REASONS,
  getTalentImprovementCost,
  evaluateTalentImprovement
} from "../../../src/domain/rules/talent-progression.mjs";


/* ============================================================
 * CONSTANTES
 * ============================================================ */


test("une augmentation de Talent coûte 5 XP", () => {
  assert.equal(
    TALENT_ADVANCEMENT_COST,
    5
  );

  assert.equal(
    getTalentImprovementCost(),
    5
  );
});


test("TALENT_PROGRESSION_REASONS expose les raisons attendues", () => {
  assert.deepEqual(
    TALENT_PROGRESSION_REASONS,
    {
      MAX_LEVEL: "max-level",
      INVALID_LEVEL: "invalid-level",
      INVALID_MAX_LEVEL: "invalid-max-level",
      INSUFFICIENT_XP: "insufficient-xp"
    }
  );
});


test("TALENT_PROGRESSION_REASONS n'est actuellement pas gelé", () => {
  assert.equal(
    Object.isFrozen(
      TALENT_PROGRESSION_REASONS
    ),
    false
  );
});


/* ============================================================
 * NIVEAU MAXIMUM
 * ============================================================ */


test("un maxLevel inférieur à 1 est invalide", () => {
  const result =
    evaluateTalentImprovement({
      currentLevel: 1,
      maxLevel: 0,
      availableXp: 10
    });

  assert.equal(
    result.allowed,
    false
  );

  assert.equal(
    result.reason,
    TALENT_PROGRESSION_REASONS.INVALID_MAX_LEVEL
  );
});


test("un maxLevel supérieur à 5 est invalide", () => {
  const result =
    evaluateTalentImprovement({
      currentLevel: 1,
      maxLevel: 6,
      availableXp: 10
    });

  assert.equal(
    result.allowed,
    false
  );

  assert.equal(
    result.reason,
    TALENT_PROGRESSION_REASONS.INVALID_MAX_LEVEL
  );
});


test("un maxLevel non entier est invalide", () => {
  for (
    const maxLevel
    of [
      1.5,
      2.2,
      NaN
    ]
  ) {
    const result =
      evaluateTalentImprovement({
        currentLevel: 1,
        maxLevel,
        availableXp: 10
      });

    assert.equal(
      result.allowed,
      false
    );

    assert.equal(
      result.reason,
      TALENT_PROGRESSION_REASONS.INVALID_MAX_LEVEL
    );
  }
});


test("un maxLevel numérique sous forme de chaîne est actuellement accepté", () => {
  const result =
    evaluateTalentImprovement({
      currentLevel: 1,
      maxLevel: "3",
      availableXp: 10
    });

  assert.equal(
    result.allowed,
    true
  );

  assert.equal(
    result.maxLevel,
    3
  );
});


test("un maxLevel invalide est vérifié avant le niveau actuel", () => {
  const result =
    evaluateTalentImprovement({
      currentLevel: 99,
      maxLevel: 0,
      availableXp: 10
    });

  assert.equal(
    result.reason,
    TALENT_PROGRESSION_REASONS.INVALID_MAX_LEVEL
  );
});


/* ============================================================
 * NIVEAU ACTUEL
 * ============================================================ */


test("un currentLevel inférieur à 1 est invalide", () => {
  const result =
    evaluateTalentImprovement({
      currentLevel: 0,
      maxLevel: 3,
      availableXp: 10
    });

  assert.equal(
    result.allowed,
    false
  );

  assert.equal(
    result.reason,
    TALENT_PROGRESSION_REASONS.INVALID_LEVEL
  );
});


test("un currentLevel supérieur au maxLevel est invalide", () => {
  const result =
    evaluateTalentImprovement({
      currentLevel: 4,
      maxLevel: 3,
      availableXp: 10
    });

  assert.equal(
    result.allowed,
    false
  );

  assert.equal(
    result.reason,
    TALENT_PROGRESSION_REASONS.INVALID_LEVEL
  );
});


test("un currentLevel non entier est invalide", () => {
  for (
    const currentLevel
    of [
      1.5,
      2.7,
      NaN
    ]
  ) {
    const result =
      evaluateTalentImprovement({
        currentLevel,
        maxLevel: 5,
        availableXp: 10
      });

    assert.equal(
      result.allowed,
      false
    );

    assert.equal(
      result.reason,
      TALENT_PROGRESSION_REASONS.INVALID_LEVEL
    );
  }
});


test("un currentLevel numérique sous forme de chaîne est actuellement accepté", () => {
  const result =
    evaluateTalentImprovement({
      currentLevel: "2",
      maxLevel: 4,
      availableXp: 10
    });

  assert.equal(
    result.allowed,
    true
  );

  assert.equal(
    result.currentLevel,
    2
  );

  assert.equal(
    result.targetLevel,
    3
  );
});


/* ============================================================
 * NIVEAU MAXIMUM ATTEINT
 * ============================================================ */


test("un Talent déjà au niveau maximum ne peut plus progresser", () => {
  assert.deepEqual(
    evaluateTalentImprovement({
      currentLevel: 3,
      maxLevel: 3,
      availableXp: 20
    }),
    {
      allowed: false,
      reason: "max-level",
      cost: 5,
      remainingXp: 20,
      missingXp: 0,
      currentLevel: 3,
      targetLevel: null,
      maxLevel: 3
    }
  );
});


test("atteindre le niveau maximum reste interdit même avec beaucoup d'XP", () => {
  const result =
    evaluateTalentImprovement({
      currentLevel: 5,
      maxLevel: 5,
      availableXp: 999
    });

  assert.equal(
    result.allowed,
    false
  );

  assert.equal(
    result.reason,
    TALENT_PROGRESSION_REASONS.MAX_LEVEL
  );

  assert.equal(
    result.targetLevel,
    null
  );
});


/* ============================================================
 * NORMALISATION DES XP
 * ============================================================ */


test("des XP négatifs sont actuellement ramenés à zéro", () => {
  const result =
    evaluateTalentImprovement({
      currentLevel: 1,
      maxLevel: 3,
      availableXp: -10
    });

  assert.equal(
    result.remainingXp,
    0
  );

  assert.equal(
    result.missingXp,
    5
  );
});


test("des XP absents sont actuellement considérés comme zéro", () => {
  const result =
    evaluateTalentImprovement({
      currentLevel: 1,
      maxLevel: 3
    });

  assert.equal(
    result.allowed,
    false
  );

  assert.equal(
    result.reason,
    TALENT_PROGRESSION_REASONS.INSUFFICIENT_XP
  );

  assert.equal(
    result.remainingXp,
    0
  );

  assert.equal(
    result.missingXp,
    5
  );
});


test("une chaîne d'XP numérique est actuellement acceptée", () => {
  const result =
    evaluateTalentImprovement({
      currentLevel: 1,
      maxLevel: 3,
      availableXp: "8"
    });

  assert.equal(
    result.allowed,
    true
  );

  assert.equal(
    result.remainingXp,
    3
  );
});


test("une valeur d'XP non numérique est actuellement ramenée à zéro", () => {
  const result =
    evaluateTalentImprovement({
      currentLevel: 1,
      maxLevel: 3,
      availableXp: "abc"
    });

  assert.equal(
    result.allowed,
    false
  );

  assert.equal(
    result.remainingXp,
    0
  );

  assert.equal(
    result.missingXp,
    5
  );
});


/* ============================================================
 * XP INSUFFISANTS
 * ============================================================ */


test("un Talent avec moins de 5 XP ne peut pas progresser", () => {
  assert.deepEqual(
    evaluateTalentImprovement({
      currentLevel: 2,
      maxLevel: 4,
      availableXp: 3
    }),
    {
      allowed: false,
      reason: "insufficient-xp",
      cost: 5,
      remainingXp: 3,
      missingXp: 2,
      currentLevel: 2,
      targetLevel: 3,
      maxLevel: 4
    }
  );
});


test("les XP manquants sont calculés par rapport au coût fixe de 5 XP", () => {
  const result =
    evaluateTalentImprovement({
      currentLevel: 1,
      maxLevel: 5,
      availableXp: 1
    });

  assert.equal(
    result.cost,
    5
  );

  assert.equal(
    result.missingXp,
    4
  );
});


/* ============================================================
 * PROGRESSION AUTORISÉE
 * ============================================================ */


test("disposer exactement de 5 XP autorise une progression", () => {
  assert.deepEqual(
    evaluateTalentImprovement({
      currentLevel: 1,
      maxLevel: 3,
      availableXp: 5
    }),
    {
      allowed: true,
      reason: null,
      cost: 5,
      remainingXp: 0,
      missingXp: 0,
      currentLevel: 1,
      targetLevel: 2,
      maxLevel: 3
    }
  );
});


test("une progression augmente toujours le niveau cible de un", () => {
  const cases = [
    {
      currentLevel: 1,
      maxLevel: 5,
      targetLevel: 2
    },
    {
      currentLevel: 2,
      maxLevel: 5,
      targetLevel: 3
    },
    {
      currentLevel: 3,
      maxLevel: 5,
      targetLevel: 4
    },
    {
      currentLevel: 4,
      maxLevel: 5,
      targetLevel: 5
    }
  ];

  for (
    const {
      currentLevel,
      maxLevel,
      targetLevel
    }
    of cases
  ) {
    const result =
      evaluateTalentImprovement({
        currentLevel,
        maxLevel,
        availableXp: 5
      });

    assert.equal(
      result.allowed,
      true
    );

    assert.equal(
      result.targetLevel,
      targetLevel
    );
  }
});


test("chaque progression coûte toujours exactement 5 XP", () => {
  for (
    const currentLevel
    of [
      1,
      2,
      3,
      4
    ]
  ) {
    const result =
      evaluateTalentImprovement({
        currentLevel,
        maxLevel: 5,
        availableXp: 20
      });

    assert.equal(
      result.cost,
      5
    );
  }
});


test("les XP restants correspondent aux XP disponibles moins 5", () => {
  const result =
    evaluateTalentImprovement({
      currentLevel: 2,
      maxLevel: 5,
      availableXp: 17
    });

  assert.equal(
    result.allowed,
    true
  );

  assert.equal(
    result.remainingXp,
    12
  );

  assert.equal(
    result.missingXp,
    0
  );
});


/* ============================================================
 * STRUCTURES DE RETOUR
 * ============================================================ */


test("un maxLevel invalide retourne la structure complète attendue", () => {
  assert.deepEqual(
    evaluateTalentImprovement({
      currentLevel: 1,
      maxLevel: 8,
      availableXp: 12
    }),
    {
      allowed: false,
      reason: "invalid-max-level",
      cost: 5,
      remainingXp: 12,
      missingXp: 0,
      currentLevel: 1,
      targetLevel: null,
      maxLevel: 8
    }
  );
});


test("un currentLevel invalide retourne la structure complète attendue", () => {
  assert.deepEqual(
    evaluateTalentImprovement({
      currentLevel: 0,
      maxLevel: 3,
      availableXp: 12
    }),
    {
      allowed: false,
      reason: "invalid-level",
      cost: 5,
      remainingXp: 12,
      missingXp: 0,
      currentLevel: 0,
      targetLevel: null,
      maxLevel: 3
    }
  );
});