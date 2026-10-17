import test from "node:test";
import assert from "node:assert/strict";

import {
  ARCHETYPE_DEFINITIONS,
  getArchetypeDefinition,
  getArchetypeDefinitions,
  isKnownArchetype
} from "../../../src/domain/rules/archetypes.mjs";


/* ============================================================
 * DÉFINITIONS
 * ============================================================ */


test("ARCHETYPE_DEFINITIONS expose les huit archétypes attendus", () => {
  assert.deepEqual(
    Object.keys(
      ARCHETYPE_DEFINITIONS
    ),
    [
      "diplomat",
      "scout",
      "infiltrator",
      "mechanic",
      "medic",
      "soldier",
      "strategist",
      "trader"
    ]
  );
});


test("ARCHETYPE_DEFINITIONS est gelé", () => {
  assert.equal(
    Object.isFrozen(
      ARCHETYPE_DEFINITIONS
    ),
    true
  );
});


test("chaque définition d'archétype est gelée", () => {
  for (
    const definition
    of Object.values(
      ARCHETYPE_DEFINITIONS
    )
  ) {
    assert.equal(
      Object.isFrozen(
        definition
      ),
      true
    );
  }
});


test("chaque tableau skills est gelé", () => {
  for (
    const definition
    of Object.values(
      ARCHETYPE_DEFINITIONS
    )
  ) {
    assert.equal(
      Object.isFrozen(
        definition.skills
      ),
      true
    );
  }
});


/* ============================================================
 * ARCHÉTYPES SIMPLES
 * ============================================================ */


test("Diplomate possède la définition attendue", () => {
  assert.deepEqual(
    ARCHETYPE_DEFINITIONS.diplomat,
    {
      id: "diplomat",
      label: "Diplomate",
      attribute: "empathy",
      skills: [
        "analysis",
        "comprehension",
        "manipulation"
      ]
    }
  );
});


test("Éclaireur possède la définition attendue", () => {
  assert.deepEqual(
    ARCHETYPE_DEFINITIONS.scout,
    {
      id: "scout",
      label: "Éclaireur",
      attribute: "agility",
      skills: [
        "stealth",
        "observation",
        "survival"
      ]
    }
  );
});


test("Infiltrateur possède la définition attendue", () => {
  assert.deepEqual(
    ARCHETYPE_DEFINITIONS.infiltrator,
    {
      id: "infiltrator",
      label: "Infiltrateur",
      attribute: "agility",
      skills: [
        "closeCombat",
        "stealth",
        "shooting"
      ]
    }
  );
});


test("Mécanicien possède la définition attendue", () => {
  assert.deepEqual(
    ARCHETYPE_DEFINITIONS.mechanic,
    {
      id: "mechanic",
      label: "Mécanicien",
      attribute: "vigor",
      skills: [
        "repair",
        "comprehension",
        "reaction"
      ]
    }
  );
});


test("Médecin possède la définition attendue", () => {
  assert.deepEqual(
    ARCHETYPE_DEFINITIONS.medic,
    {
      id: "medic",
      label: "Médecin",
      attribute: "empathy",
      skills: [
        "analysis",
        "comprehension",
        "medicine"
      ]
    }
  );
});


test("Stratège possède la définition attendue", () => {
  assert.deepEqual(
    ARCHETYPE_DEFINITIONS.strategist,
    {
      id: "strategist",
      label: "Stratège",
      attribute: "spirit",
      skills: [
        "comprehension",
        "manipulation",
        "observation"
      ]
    }
  );
});


test("Trafiquant possède la définition attendue", () => {
  assert.deepEqual(
    ARCHETYPE_DEFINITIONS.trader,
    {
      id: "trader",
      label: "Trafiquant",
      attribute: "spirit",
      skills: [
        "closeCombat",
        "manipulation",
        "observation"
      ]
    }
  );
});


/* ============================================================
 * SOLDAT — CAS SPÉCIAL
 * ============================================================ */


test("Soldat possède une caractéristique principale à choisir", () => {
  assert.equal(
    ARCHETYPE_DEFINITIONS.soldier.attribute,
    null
  );

  assert.deepEqual(
    ARCHETYPE_DEFINITIONS.soldier.attributeChoices,
    [
      "agility",
      "vigor"
    ]
  );
});


test("les choix de caractéristique du Soldat sont gelés", () => {
  assert.equal(
    Object.isFrozen(
      ARCHETYPE_DEFINITIONS
        .soldier
        .attributeChoices
    ),
    true
  );
});


test("Soldat possède Réaction et Tir comme compétences fixes", () => {
  assert.deepEqual(
    ARCHETYPE_DEFINITIONS.soldier.skills,
    [
      "reaction",
      "shooting"
    ]
  );
});


test("Soldat doit choisir entre Corps à corps et Endurance", () => {
  assert.deepEqual(
    ARCHETYPE_DEFINITIONS.soldier.skillChoices,
    [
      [
        "closeCombat",
        "endurance"
      ]
    ]
  );
});


test("les choix de compétences du Soldat sont gelés à tous les niveaux", () => {
  assert.equal(
    Object.isFrozen(
      ARCHETYPE_DEFINITIONS
        .soldier
        .skillChoices
    ),
    true
  );

  assert.equal(
    Object.isFrozen(
      ARCHETYPE_DEFINITIONS
        .soldier
        .skillChoices[0]
    ),
    true
  );
});


/* ============================================================
 * getArchetypeDefinition
 * ============================================================ */


test("getArchetypeDefinition retourne la définition demandée", () => {
  assert.equal(
    getArchetypeDefinition(
      "medic"
    ),
    ARCHETYPE_DEFINITIONS.medic
  );
});


test("getArchetypeDefinition retourne null pour un identifiant inconnu", () => {
  assert.equal(
    getArchetypeDefinition(
      "unknown"
    ),
    null
  );
});


test("getArchetypeDefinition retourne null si aucun identifiant n'est fourni", () => {
  assert.equal(
    getArchetypeDefinition(),
    null
  );
});


test("la recherche d'archétype est sensible à la casse", () => {
  assert.equal(
    getArchetypeDefinition(
      "Medic"
    ),
    null
  );
});


test("la recherche d'archétype ne normalise pas les espaces", () => {
  assert.equal(
    getArchetypeDefinition(
      " medic "
    ),
    null
  );
});


/* ============================================================
 * getArchetypeDefinitions
 * ============================================================ */


test("getArchetypeDefinitions retourne huit définitions", () => {
  const definitions =
    getArchetypeDefinitions();

  assert.equal(
    definitions.length,
    8
  );
});


test("getArchetypeDefinitions retourne les définitions dans l'ordre déclaré", () => {
  assert.deepEqual(
    getArchetypeDefinitions()
      .map(
        definition =>
          definition.id
      ),
    [
      "diplomat",
      "scout",
      "infiltrator",
      "mechanic",
      "medic",
      "soldier",
      "strategist",
      "trader"
    ]
  );
});


test("getArchetypeDefinitions retourne un nouveau tableau à chaque appel", () => {
  const first =
    getArchetypeDefinitions();

  const second =
    getArchetypeDefinitions();

  assert.notEqual(
    first,
    second
  );

  assert.deepEqual(
    first,
    second
  );
});


test("modifier le tableau retourné ne modifie pas ARCHETYPE_DEFINITIONS", () => {
  const definitions =
    getArchetypeDefinitions();

  definitions.pop();

  assert.equal(
    getArchetypeDefinitions().length,
    8
  );
});


test("les objets retournés restent les définitions originales gelées", () => {
  const definitions =
    getArchetypeDefinitions();

  assert.equal(
    definitions[0],
    ARCHETYPE_DEFINITIONS.diplomat
  );

  assert.equal(
    Object.isFrozen(
      definitions[0]
    ),
    true
  );
});


/* ============================================================
 * isKnownArchetype
 * ============================================================ */


test("isKnownArchetype retourne true pour un archétype connu", () => {
  assert.equal(
    isKnownArchetype(
      "scout"
    ),
    true
  );
});


test("isKnownArchetype retourne false pour un archétype inconnu", () => {
  assert.equal(
    isKnownArchetype(
      "unknown"
    ),
    false
  );
});


test("isKnownArchetype retourne false sans identifiant", () => {
  assert.equal(
    isKnownArchetype(),
    false
  );
});


/* ============================================================
 * COHÉRENCE INTERNE
 * ============================================================ */


test("chaque clé d'ARCHETYPE_DEFINITIONS correspond à l'id de sa définition", () => {
  for (
    const [
      key,
      definition
    ]
    of Object.entries(
      ARCHETYPE_DEFINITIONS
    )
  ) {
    assert.equal(
      definition.id,
      key
    );
  }
});


test("tous les archétypes possèdent un label non vide", () => {
  for (
    const definition
    of getArchetypeDefinitions()
  ) {
    assert.equal(
      typeof definition.label,
      "string"
    );

    assert.ok(
      definition.label.length > 0
    );
  }
});


test("hors Soldat, chaque archétype possède exactement trois compétences fixes", () => {
  for (
    const definition
    of getArchetypeDefinitions()
  ) {
    if (
      definition.id
      === "soldier"
    ) {
      continue;
    }

    assert.equal(
      definition.skills.length,
      3
    );
  }
});


test("hors Soldat, chaque archétype possède une caractéristique fixe", () => {
  for (
    const definition
    of getArchetypeDefinitions()
  ) {
    if (
      definition.id
      === "soldier"
    ) {
      continue;
    }

    assert.equal(
      typeof definition.attribute,
      "string"
    );

    assert.ok(
      definition.attribute.length > 0
    );
  }
});