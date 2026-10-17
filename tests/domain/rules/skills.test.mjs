import test from "node:test";
import assert from "node:assert/strict";

import {
  SKILL_DEFINITIONS,
  getSkillDefinition,
  getSkillAttribute
} from "../../../src/domain/rules/skills.mjs";


/* ============================================================
 * RÉFÉRENTIEL
 * ============================================================ */


test("SKILL_DEFINITIONS expose les douze compétences attendues", () => {
  assert.deepEqual(
    Object.keys(
      SKILL_DEFINITIONS
    ),
    [
      "repair",
      "closeCombat",
      "endurance",
      "stealth",
      "reaction",
      "shooting",
      "comprehension",
      "observation",
      "survival",
      "analysis",
      "manipulation",
      "medicine"
    ]
  );
});


test("SKILL_DEFINITIONS est gelé", () => {
  assert.equal(
    Object.isFrozen(
      SKILL_DEFINITIONS
    ),
    true
  );
});


test("les définitions internes ne sont actuellement pas gelées", () => {
  for (
    const definition
    of Object.values(
      SKILL_DEFINITIONS
    )
  ) {
    assert.equal(
      Object.isFrozen(
        definition
      ),
      false
    );
  }
});


/* ============================================================
 * VIGUEUR
 * ============================================================ */


test("Réparation dépend de Vigueur", () => {
  assert.deepEqual(
    SKILL_DEFINITIONS.repair,
    {
      attribute: "vigor"
    }
  );
});


test("Corps à corps dépend de Vigueur", () => {
  assert.deepEqual(
    SKILL_DEFINITIONS.closeCombat,
    {
      attribute: "vigor"
    }
  );
});


test("Endurance dépend de Vigueur", () => {
  assert.deepEqual(
    SKILL_DEFINITIONS.endurance,
    {
      attribute: "vigor"
    }
  );
});


/* ============================================================
 * AGILITÉ
 * ============================================================ */


test("Discrétion dépend d'Agilité", () => {
  assert.deepEqual(
    SKILL_DEFINITIONS.stealth,
    {
      attribute: "agility"
    }
  );
});


test("Réaction dépend d'Agilité", () => {
  assert.deepEqual(
    SKILL_DEFINITIONS.reaction,
    {
      attribute: "agility"
    }
  );
});


test("Tir dépend d'Agilité", () => {
  assert.deepEqual(
    SKILL_DEFINITIONS.shooting,
    {
      attribute: "agility"
    }
  );
});


/* ============================================================
 * ESPRIT
 * ============================================================ */


test("Compréhension dépend d'Esprit", () => {
  assert.deepEqual(
    SKILL_DEFINITIONS.comprehension,
    {
      attribute: "spirit"
    }
  );
});


test("Observation dépend d'Esprit", () => {
  assert.deepEqual(
    SKILL_DEFINITIONS.observation,
    {
      attribute: "spirit"
    }
  );
});


test("Survie dépend d'Esprit", () => {
  assert.deepEqual(
    SKILL_DEFINITIONS.survival,
    {
      attribute: "spirit"
    }
  );
});


/* ============================================================
 * EMPATHIE
 * ============================================================ */


test("Analyse dépend d'Empathie", () => {
  assert.deepEqual(
    SKILL_DEFINITIONS.analysis,
    {
      attribute: "empathy"
    }
  );
});


test("Manipulation dépend d'Empathie", () => {
  assert.deepEqual(
    SKILL_DEFINITIONS.manipulation,
    {
      attribute: "empathy"
    }
  );
});


test("Médecine dépend d'Empathie", () => {
  assert.deepEqual(
    SKILL_DEFINITIONS.medicine,
    {
      attribute: "empathy"
    }
  );
});


/* ============================================================
 * getSkillDefinition
 * ============================================================ */


test("getSkillDefinition retourne la définition demandée", () => {
  assert.equal(
    getSkillDefinition(
      "shooting"
    ),
    SKILL_DEFINITIONS.shooting
  );
});


test("getSkillDefinition retourne null pour une compétence inconnue", () => {
  assert.equal(
    getSkillDefinition(
      "unknown"
    ),
    null
  );
});


test("getSkillDefinition retourne null sans identifiant", () => {
  assert.equal(
    getSkillDefinition(),
    null
  );
});


test("la recherche de compétence est sensible à la casse", () => {
  assert.equal(
    getSkillDefinition(
      "Shooting"
    ),
    null
  );
});


test("la recherche de compétence ne normalise pas les espaces", () => {
  assert.equal(
    getSkillDefinition(
      " shooting "
    ),
    null
  );
});


/* ============================================================
 * getSkillAttribute
 * ============================================================ */


test("getSkillAttribute retourne l'attribut d'une compétence connue", () => {
  assert.equal(
    getSkillAttribute(
      "medicine"
    ),
    "empathy"
  );
});


test("getSkillAttribute retourne null pour une compétence inconnue", () => {
  assert.equal(
    getSkillAttribute(
      "unknown"
    ),
    null
  );
});


test("getSkillAttribute retourne null sans identifiant", () => {
  assert.equal(
    getSkillAttribute(),
    null
  );
});


/* ============================================================
 * COHÉRENCE DU RÉFÉRENTIEL
 * ============================================================ */


test("chaque compétence possède exactement un attribut", () => {
  for (
    const definition
    of Object.values(
      SKILL_DEFINITIONS
    )
  ) {
    assert.deepEqual(
      Object.keys(
        definition
      ),
      [
        "attribute"
      ]
    );
  }
});


test("chaque compétence utilise un attribut métier connu", () => {
  const knownAttributes =
    new Set([
      "vigor",
      "agility",
      "spirit",
      "empathy"
    ]);

  for (
    const definition
    of Object.values(
      SKILL_DEFINITIONS
    )
  ) {
    assert.equal(
      knownAttributes.has(
        definition.attribute
      ),
      true
    );
  }
});


test("chaque attribut possède exactement trois compétences", () => {
  const counts = {
    vigor: 0,
    agility: 0,
    spirit: 0,
    empathy: 0
  };

  for (
    const definition
    of Object.values(
      SKILL_DEFINITIONS
    )
  ) {
    counts[
      definition.attribute
    ] += 1;
  }

  assert.deepEqual(
    counts,
    {
      vigor: 3,
      agility: 3,
      spirit: 3,
      empathy: 3
    }
  );
});


test("getSkillAttribute est cohérent avec toutes les définitions", () => {
  for (
    const [
      skillId,
      definition
    ]
    of Object.entries(
      SKILL_DEFINITIONS
    )
  ) {
    assert.equal(
      getSkillAttribute(
        skillId
      ),
      definition.attribute
    );
  }
});


test("getSkillDefinition retourne les objets originaux du référentiel", () => {
  assert.equal(
    getSkillDefinition(
      "repair"
    ),
    SKILL_DEFINITIONS.repair
  );
});