import test from "node:test";
import assert from "node:assert/strict";

import {
  SKILL_MIN_LEVEL,
  SKILL_MAX_LEVEL,
  SKILL_PROGRESSION_REASONS,
  getSkillImprovementCost,
  evaluateSkillImprovement
} from "../../../src/domain/rules/skill-progression.mjs";


/* ============================================================
 * CONSTANTES
 * ============================================================ */


test("les niveaux de compétence vont de 0 à 5", () => {
  assert.equal(
    SKILL_MIN_LEVEL,
    0
  );

  assert.equal(
    SKILL_MAX_LEVEL,
    5
  );
});


test("SKILL_PROGRESSION_REASONS expose les raisons attendues et est gelé", () => {
  assert.deepEqual(
    SKILL_PROGRESSION_REASONS,
    {
      MAX_LEVEL: "max-level",
      INSUFFICIENT_XP: "insufficient-xp"
    }
  );

  assert.equal(
    Object.isFrozen(
      SKILL_PROGRESSION_REASONS
    ),
    true
  );
});


/* ============================================================
 * VALIDATION DES NIVEAUX
 * ============================================================ */


test("getSkillImprovementCost refuse un niveau de compétence invalide", () => {
  for (
    const currentLevel
    of [
      -1,
      6,
      1.5,
      "1",
      null,
      undefined
    ]
  ) {
    assert.throws(
      () => getSkillImprovementCost({
        currentLevel
      }),
      TypeError
    );
  }
});


test("evaluateSkillImprovement refuse un niveau de compétence invalide", () => {
  for (
    const currentLevel
    of [
      -1,
      6,
      2.5,
      "2",
      null,
      undefined
    ]
  ) {
    assert.throws(
      () => evaluateSkillImprovement({
        currentLevel,
        availableXp: 10
      }),
      TypeError
    );
  }
});


test("evaluateSkillImprovement refuse une quantité d'XP invalide", () => {
  for (
    const availableXp
    of [
      -1,
      1.5,
      "10",
      null,
      undefined
    ]
  ) {
    assert.throws(
      () => evaluateSkillImprovement({
        currentLevel: 1,
        availableXp
      }),
      TypeError
    );
  }
});


/* ============================================================
 * COÛT D'AMÉLIORATION
 * ============================================================ */


test("une compétence au niveau maximal n'a plus de coût d'amélioration", () => {
  assert.equal(
    getSkillImprovementCost({
      currentLevel: 5
    }),
    null
  );
});


test("le passage de 0 à 1 coûte toujours 5 XP", () => {
  assert.equal(
    getSkillImprovementCost({
      currentLevel: 0
    }),
    5
  );
});


test("le passage de 0 à 1 coûte aussi 5 XP pour une compétence d'archétype", () => {
  assert.equal(
    getSkillImprovementCost({
      currentLevel: 0,
      isArchetypeSkill: true
    }),
    5
  );
});


test("une compétence normale coûte niveau cible multiplié par 5 XP", () => {
  const cases = [
    {
      currentLevel: 1,
      expectedCost: 10
    },
    {
      currentLevel: 2,
      expectedCost: 15
    },
    {
      currentLevel: 3,
      expectedCost: 20
    },
    {
      currentLevel: 4,
      expectedCost: 25
    }
  ];

  for (
    const {
      currentLevel,
      expectedCost
    }
    of cases
  ) {
    assert.equal(
      getSkillImprovementCost({
        currentLevel,
        isArchetypeSkill: false
      }),
      expectedCost
    );
  }
});


test("une compétence d'archétype coûte niveau cible multiplié par 4 XP", () => {
  const cases = [
    {
      currentLevel: 1,
      expectedCost: 8
    },
    {
      currentLevel: 2,
      expectedCost: 12
    },
    {
      currentLevel: 3,
      expectedCost: 16
    },
    {
      currentLevel: 4,
      expectedCost: 20
    }
  ];

  for (
    const {
      currentLevel,
      expectedCost
    }
    of cases
  ) {
    assert.equal(
      getSkillImprovementCost({
        currentLevel,
        isArchetypeSkill: true
      }),
      expectedCost
    );
  }
});


test("isArchetypeSkill est actuellement interprété selon sa truthiness pour le coût", () => {
  assert.equal(
    getSkillImprovementCost({
      currentLevel: 1,
      isArchetypeSkill: "false"
    }),
    8
  );
});


/* ============================================================
 * NIVEAU MAXIMAL
 * ============================================================ */


test("une compétence au niveau 5 ne peut pas être améliorée", () => {
  assert.deepEqual(
    evaluateSkillImprovement({
      currentLevel: 5,
      availableXp: 100
    }),
    {
      allowed: false,
      reason: "max-level",
      currentLevel: 5,
      targetLevel: 5,
      cost: null,
      availableXp: 100,
      isArchetypeSkill: false,
      requiresGMApproval: false
    }
  );
});


test("le niveau maximal reste interdit même avec beaucoup d'XP", () => {
  const result =
    evaluateSkillImprovement({
      currentLevel: 5,
      availableXp: 999
    });

  assert.equal(
    result.allowed,
    false
  );

  assert.equal(
    result.reason,
    SKILL_PROGRESSION_REASONS.MAX_LEVEL
  );
});


test("une compétence maximale ne demande pas d'approbation narrative du MJ", () => {
  const result =
    evaluateSkillImprovement({
      currentLevel: 5,
      availableXp: 0
    });

  assert.equal(
    result.requiresGMApproval,
    false
  );
});


/* ============================================================
 * PASSAGE 0 -> 1
 * ============================================================ */


test("le passage de 0 à 1 est mécaniquement autorisé avec 5 XP", () => {
  assert.deepEqual(
    evaluateSkillImprovement({
      currentLevel: 0,
      availableXp: 5
    }),
    {
      allowed: true,
      reason: null,
      currentLevel: 0,
      targetLevel: 1,
      cost: 5,
      availableXp: 5,
      remainingXp: 0,
      isArchetypeSkill: false,
      requiresGMApproval: true
    }
  );
});


test("le passage de 0 à 1 signale toujours qu'une approbation du MJ est nécessaire", () => {
  const result =
    evaluateSkillImprovement({
      currentLevel: 0,
      availableXp: 20
    });

  assert.equal(
    result.allowed,
    true
  );

  assert.equal(
    result.requiresGMApproval,
    true
  );
});


test("l'approbation du MJ ne bloque pas mécaniquement le passage de 0 à 1", () => {
  const result =
    evaluateSkillImprovement({
      currentLevel: 0,
      availableXp: 5
    });

  assert.equal(
    result.allowed,
    true
  );

  assert.equal(
    result.reason,
    null
  );

  assert.equal(
    result.requiresGMApproval,
    true
  );
});


test("le passage de 0 à 1 avec XP insuffisants reste soumis à approbation du MJ", () => {
  assert.deepEqual(
    evaluateSkillImprovement({
      currentLevel: 0,
      availableXp: 3
    }),
    {
      allowed: false,
      reason: "insufficient-xp",
      currentLevel: 0,
      targetLevel: 1,
      cost: 5,
      availableXp: 3,
      missingXp: 2,
      isArchetypeSkill: false,
      requiresGMApproval: true
    }
  );
});


test("une compétence d'archétype de niveau 0 coûte toujours 5 XP", () => {
  const result =
    evaluateSkillImprovement({
      currentLevel: 0,
      availableXp: 5,
      isArchetypeSkill: true
    });

  assert.equal(
    result.cost,
    5
  );

  assert.equal(
    result.targetLevel,
    1
  );

  assert.equal(
    result.requiresGMApproval,
    true
  );
});


/* ============================================================
 * PROGRESSION NORMALE
 * ============================================================ */


test("une progression normale autorisée calcule les XP restants", () => {
  assert.deepEqual(
    evaluateSkillImprovement({
      currentLevel: 2,
      availableXp: 20
    }),
    {
      allowed: true,
      reason: null,
      currentLevel: 2,
      targetLevel: 3,
      cost: 15,
      availableXp: 20,
      remainingXp: 5,
      isArchetypeSkill: false,
      requiresGMApproval: false
    }
  );
});


test("une compétence d'archétype bénéficie du coût réduit", () => {
  assert.deepEqual(
    evaluateSkillImprovement({
      currentLevel: 2,
      availableXp: 20,
      isArchetypeSkill: true
    }),
    {
      allowed: true,
      reason: null,
      currentLevel: 2,
      targetLevel: 3,
      cost: 12,
      availableXp: 20,
      remainingXp: 8,
      isArchetypeSkill: true,
      requiresGMApproval: false
    }
  );
});


test("une progression normale avec XP insuffisants indique les XP manquants", () => {
  assert.deepEqual(
    evaluateSkillImprovement({
      currentLevel: 3,
      availableXp: 17
    }),
    {
      allowed: false,
      reason: "insufficient-xp",
      currentLevel: 3,
      targetLevel: 4,
      cost: 20,
      availableXp: 17,
      missingXp: 3,
      isArchetypeSkill: false,
      requiresGMApproval: false
    }
  );
});


test("une compétence d'archétype avec XP insuffisants utilise son coût réduit", () => {
  assert.deepEqual(
    evaluateSkillImprovement({
      currentLevel: 3,
      availableXp: 15,
      isArchetypeSkill: true
    }),
    {
      allowed: false,
      reason: "insufficient-xp",
      currentLevel: 3,
      targetLevel: 4,
      cost: 16,
      availableXp: 15,
      missingXp: 1,
      isArchetypeSkill: true,
      requiresGMApproval: false
    }
  );
});


test("disposer exactement du coût laisse zéro XP restant", () => {
  const result =
    evaluateSkillImprovement({
      currentLevel: 4,
      availableXp: 25
    });

  assert.equal(
    result.allowed,
    true
  );

  assert.equal(
    result.cost,
    25
  );

  assert.equal(
    result.remainingXp,
    0
  );
});


/* ============================================================
 * NORMALISATION DU DRAPEAU D'ARCHÉTYPE
 * ============================================================ */


test("evaluateSkillImprovement normalise isArchetypeSkill en booléen dans le résultat", () => {
  const result =
    evaluateSkillImprovement({
      currentLevel: 1,
      availableXp: 20,
      isArchetypeSkill: "yes"
    });

  assert.equal(
    result.isArchetypeSkill,
    true
  );

  assert.equal(
    result.cost,
    8
  );
});