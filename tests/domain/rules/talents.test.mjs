import test from "node:test";
import assert from "node:assert/strict";

import {
  TALENT_KEYS,
  TALENT_EFFECT_TYPES,
  TALENT_CONDITION_STATES,
  TALENT_DEFINITIONS,
  getTalentDefinition,
  isKnownTalent,
  evaluateTalentForAction,
  evaluateTalentsForAction,
  areTalentsCompatible
} from "../../../src/domain/rules/talents.mjs";

import {
  ACTION_RESOLUTION_TYPES
} from "../../../src/domain/rules/action-resolution-context.mjs";


/* ============================================================
 * HELPERS DE TEST
 * ============================================================ */

function meleeContext(overrides = {}) {
  return {
    actionType: ACTION_RESOLUTION_TYPES.MELEE_ATTACK,
    skill: "closeCombat",
    weapon: {
      category: "bladedWeapon",
      type: "melee",
      isFirearm: false,
      isHeavyWeapon: false,
      isMeleeWeapon: true,
      isRangedWeapon: false
    },
    facts: {},
    ...overrides
  };
}


function rangedContext(overrides = {}) {
  return {
    actionType: ACTION_RESOLUTION_TYPES.RANGED_ATTACK,
    skill: "shooting",
    weapon: {
      category: "pistol",
      type: "firearm",
      isFirearm: true,
      isHeavyWeapon: false,
      isMeleeWeapon: false,
      isRangedWeapon: true
    },
    facts: {},
    ...overrides
  };
}


function blockContext(overrides = {}) {
  return {
    actionType: ACTION_RESOLUTION_TYPES.MELEE_BLOCK,
    skill: "closeCombat",
    weapon: {
      category: "bladedWeapon",
      type: "melee",
      isFirearm: false,
      isHeavyWeapon: false,
      isMeleeWeapon: true,
      isRangedWeapon: false
    },
    facts: {},
    ...overrides
  };
}


function skillContext(overrides = {}) {
  return {
    actionType: ACTION_RESOLUTION_TYPES.SKILL_ROLL,
    skill: "survival",
    facts: {},
    metadata: {},
    ...overrides
  };
}


/* ============================================================
 * CONSTANTES
 * ============================================================ */

test("TALENT_KEYS contient les dix-neuf talents actuellement connus", () => {
  assert.deepEqual(
    TALENT_KEYS,
    {
      FAVORITE_WEAPON: "favoriteWeapon",
      BRUTE: "brute",
      WEAK_POINT: "weakPoint",
      WEAPON_SPECIALIST: "weaponSpecialist",
      RAPID_FIRE: "rapidFire",
      SHARPSHOOTER: "sharpshooter",
      WATER_FORAGER: "waterForager",
      FOOD_FORAGER: "foodForager",
      ENERGY_FORAGER: "energyForager",
      MEDICINE_FORAGER: "medicineForager",
      EQUIPMENT_FORAGER: "equipmentForager",
      DODGE: "dodge",
      DANGER_SENSE: "dangerSense",
      INTIMIDATING: "intimidating",
      INSTINCTIVE_SHOOTER: "instinctiveShooter",
      PILOT: "pilot",
      CREATURE_FLIGHT: "creature-trait-vol",
      CREATURE_PHOTOSENSITIVE: "creature-trait-photosensible",
      CREATURE_LETHARGY: "creature-trait-lethargie"
    }
  );
});


test("TALENT_KEYS est gelé", () => {
  assert.equal(
    Object.isFrozen(TALENT_KEYS),
    true
  );
});


test("TALENT_EFFECT_TYPES contient les cinq types d'effet actuels", () => {
  assert.deepEqual(
    TALENT_EFFECT_TYPES,
    {
      ACTION_MODIFIER: "action-modifier",
      DAMAGE_MODIFIER: "damage-modifier",
      ACTION_COST: "action-cost",
      FORBID_AIM: "forbid-aim",
      ATTRIBUTE_SWAP: "attribute-swap"
    }
  );
});


test("TALENT_EFFECT_TYPES est gelé", () => {
  assert.equal(
    Object.isFrozen(TALENT_EFFECT_TYPES),
    true
  );
});


test("TALENT_CONDITION_STATES contient les quatre états attendus", () => {
  assert.deepEqual(
    TALENT_CONDITION_STATES,
    {
      MET: "met",
      UNMET: "unmet",
      UNKNOWN: "unknown",
      NONE: "none"
    }
  );
});


test("TALENT_CONDITION_STATES est gelé", () => {
  assert.equal(
    Object.isFrozen(TALENT_CONDITION_STATES),
    true
  );
});


test("TALENT_DEFINITIONS contient exactement les dix-neuf définitions actuelles", () => {
  assert.deepEqual(
    Object.keys(TALENT_DEFINITIONS),
    [
      "favoriteWeapon",
      "brute",
      "weakPoint",
      "weaponSpecialist",
      "rapidFire",
      "sharpshooter",
      "waterForager",
      "foodForager",
      "energyForager",
      "medicineForager",
      "equipmentForager",
      "dodge",
      "dangerSense",
      "intimidating",
      "instinctiveShooter",
      "pilot",
      "creature-trait-vol",
      "creature-trait-photosensible",
      "creature-trait-lethargie"
    ]
  );
});


test("TALENT_DEFINITIONS est gelé", () => {
  assert.equal(
    Object.isFrozen(TALENT_DEFINITIONS),
    true
  );
});


test("les définitions internes ne sont actuellement pas gelées", () => {
  for (const definition of Object.values(TALENT_DEFINITIONS)) {
    assert.equal(
      Object.isFrozen(definition),
      false
    );
  }
});


/* ============================================================
 * API DE LOOKUP
 * ============================================================ */

test("getTalentDefinition retourne la définition originale d'un talent connu", () => {
  assert.equal(
    getTalentDefinition(TALENT_KEYS.BRUTE),
    TALENT_DEFINITIONS.brute
  );
});


test("getTalentDefinition retourne null pour une clé inconnue", () => {
  assert.equal(
    getTalentDefinition("unknown"),
    null
  );
});


test("getTalentDefinition retourne null sans clé", () => {
  assert.equal(
    getTalentDefinition(),
    null
  );
});


test("les clés de Talent sont sensibles à la casse et aux espaces", () => {
  assert.equal(
    getTalentDefinition("Brute"),
    null
  );

  assert.equal(
    getTalentDefinition(" brute "),
    null
  );
});


test("isKnownTalent reconnaît les quinze clés connues", () => {
  for (const key of Object.values(TALENT_KEYS)) {
    assert.equal(
      isKnownTalent(key),
      true
    );
  }
});


test("isKnownTalent refuse une clé inconnue", () => {
  assert.equal(
    isKnownTalent("unknown"),
    false
  );
});


/* ============================================================
 * NORMALISATION DU NIVEAU — VIA API PUBLIQUE
 * ============================================================ */

test("un niveau absent vaut actuellement 1", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.BRUTE
      },
      meleeContext()
    );

  assert.equal(
    result.level,
    1
  );
});


test("un niveau null vaut actuellement 1", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.BRUTE,
        level: null
      },
      meleeContext()
    );

  assert.equal(
    result.level,
    1
  );
});


test("une chaîne numérique entière positive est convertie en niveau", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.BRUTE,
        level: "2"
      },
      meleeContext()
    );

  assert.equal(
    result.level,
    2
  );
});


test("un niveau entier supérieur à deux est actuellement conservé", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.BRUTE,
        level: 5
      },
      meleeContext()
    );

  assert.equal(
    result.level,
    5
  );
});


test("les niveaux invalides sont ramenés à 1", () => {
  for (
    const level
    of [
      0,
      -1,
      1.5,
      "abc",
      NaN,
      Infinity
    ]
  ) {
    const result =
      evaluateTalentForAction(
        {
          key: TALENT_KEYS.BRUTE,
          level
        },
        meleeContext()
      );

    assert.equal(
      result.level,
      1
    );
  }
});


test("tout niveau normalisé supérieur ou égal à deux est considéré comme avancé", () => {
  for (const level of [2, 3, 10]) {
    const result =
      evaluateTalentForAction(
        {
          key: TALENT_KEYS.BRUTE,
          level
        },
        meleeContext()
      );

    assert.equal(
      result.effects[0].suggestedValue,
      2
    );
  }
});


/* ============================================================
 * STRUCTURE COMMUNE D'UNE ÉVALUATION
 * ============================================================ */

test("un talent inconnu retourne null", () => {
  assert.equal(
    evaluateTalentForAction(
      {
        key: "unknown"
      },
      meleeContext()
    ),
    null
  );
});


test("un talent absent retourne null", () => {
  assert.equal(
    evaluateTalentForAction(
      null,
      meleeContext()
    ),
    null
  );
});


test("un talent non pertinent retourne null", () => {
  assert.equal(
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.BRUTE
      },
      rangedContext()
    ),
    null
  );
});


test("une évaluation pertinente possède la structure commune attendue", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.BRUTE,
        level: 1
      },
      meleeContext()
    );

  assert.equal(result.key, "brute");
  assert.equal(result.label, "Brute");
  assert.equal(result.level, 1);
  assert.equal(result.relevant, true);
  assert.equal(result.conditionState, "none");
  assert.equal(result.selected, true);
  assert.equal(result.editable, true);

  assert.equal(
    Array.isArray(result.effects),
    true
  );

  assert.equal(
    Array.isArray(result.incompatibilities),
    true
  );
});


test("la liste d'incompatibilités retournée est une nouvelle copie", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.FAVORITE_WEAPON,
        configuration: {
          weaponCategory: "bladedWeapon"
        }
      },
      meleeContext()
    );

  assert.notEqual(
    result.incompatibilities,
    TALENT_DEFINITIONS.favoriteWeapon.incompatibilities
  );

  assert.deepEqual(
    result.incompatibilities,
    [
      TALENT_KEYS.WEAPON_SPECIALIST
    ]
  );
});


/* ============================================================
 * ARME DE PRÉDILECTION
 * ============================================================ */

test("Arme de prédilection est pertinente pour une attaque de mêlée de la catégorie configurée", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.FAVORITE_WEAPON,
        configuration: {
          weaponCategory: "bladedWeapon"
        }
      },
      meleeContext()
    );

  assert.notEqual(result, null);
});


test("Arme de prédilection est pertinente pour une attaque à distance de la catégorie configurée", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.FAVORITE_WEAPON,
        configuration: {
          weaponCategory: "pistol"
        }
      },
      rangedContext()
    );

  assert.notEqual(result, null);
});


test("Arme de prédilection n'est pas pertinente pour un blocage", () => {
  assert.equal(
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.FAVORITE_WEAPON,
        configuration: {
          weaponCategory: "bladedWeapon"
        }
      },
      blockContext()
    ),
    null
  );
});


test("Arme de prédilection exige actuellement une weaponCategory configurée", () => {
  assert.equal(
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.FAVORITE_WEAPON
      },
      meleeContext()
    ),
    null
  );
});


test("Arme de prédilection exige une correspondance exacte de catégorie", () => {
  assert.equal(
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.FAVORITE_WEAPON,
        configuration: {
          weaponCategory: "sword"
        }
      },
      meleeContext()
    ),
    null
  );
});


test("la catégorie configurée est sensible à la casse et aux espaces", () => {
  assert.equal(
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.FAVORITE_WEAPON,
        configuration: {
          weaponCategory: "Knife"
        }
      },
      meleeContext()
    ),
    null
  );

  assert.equal(
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.FAVORITE_WEAPON,
        configuration: {
          weaponCategory: " bladedWeapon "
        }
      },
      meleeContext()
    ),
    null
  );
});


test("Arme de prédilection niveau 1 propose un bonus de +1", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.FAVORITE_WEAPON,
        level: 1,
        configuration: {
          weaponCategory: "bladedWeapon"
        }
      },
      meleeContext()
    );

  assert.equal(
    result.effects[0].suggestedValue,
    1
  );
});


test("Arme de prédilection niveau avancé propose un bonus de +2", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.FAVORITE_WEAPON,
        level: 2,
        configuration: {
          weaponCategory: "bladedWeapon"
        }
      },
      meleeContext()
    );

  assert.equal(
    result.effects[0].suggestedValue,
    2
  );
});


test("l'effet d'Arme de prédilection est un modificateur éditable", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.FAVORITE_WEAPON,
        configuration: {
          weaponCategory: "bladedWeapon"
        }
      },
      meleeContext()
    );

  assert.deepEqual(
    result.effects[0],
    {
      type: TALENT_EFFECT_TYPES.ACTION_MODIFIER,
      suggestedValue: 1,
      editable: true,
      metadata: {}
    }
  );
});


/* ============================================================
 * BRUTE
 * ============================================================ */

test("Brute est pertinent uniquement pour une attaque de mêlée utilisant closeCombat", () => {
  assert.notEqual(
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.BRUTE
      },
      meleeContext()
    ),
    null
  );

  assert.equal(
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.BRUTE
      },
      meleeContext({
        skill: "shooting"
      })
    ),
    null
  );

  assert.equal(
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.BRUTE
      },
      blockContext()
    ),
    null
  );

  assert.equal(
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.BRUTE
      },
      rangedContext()
    ),
    null
  );
});


test("Brute niveau 1 propose +1", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.BRUTE,
        level: 1
      },
      meleeContext()
    );

  assert.equal(
    result.effects[0].suggestedValue,
    1
  );
});


test("Brute niveau avancé propose +2", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.BRUTE,
        level: 2
      },
      meleeContext()
    );

  assert.equal(
    result.effects[0].suggestedValue,
    2
  );
});


test("Brute ajoute actuellement une action rapide supplémentaire", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.BRUTE
      },
      meleeContext()
    );

  assert.deepEqual(
    result.effects[1],
    {
      type: TALENT_EFFECT_TYPES.ACTION_COST,
      cost: "fast",
      mode: "additional"
    }
  );
});


/* ============================================================
 * POINT FAIBLE
 * ============================================================ */

test("Point faible est pertinent uniquement pour une attaque de mêlée au couteau", () => {
  assert.notEqual(
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.WEAK_POINT
      },
      meleeContext()
    ),
    null
  );

  assert.equal(
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.WEAK_POINT
      },
      meleeContext({
        weapon: {
          category: "sword"
        }
      })
    ),
    null
  );

  assert.equal(
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.WEAK_POINT
      },
      blockContext()
    ),
    null
  );
});


test("Point faible niveau 1 propose toujours +2 à l'action", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.WEAK_POINT,
        level: 1
      },
      meleeContext()
    );

  assert.deepEqual(
    result.effects,
    [
      {
        type: TALENT_EFFECT_TYPES.ACTION_MODIFIER,
        suggestedValue: 2,
        editable: true,
        metadata: {}
      }
    ]
  );
});


test("Point faible avancé conserve +2 et ajoute un remplacement des dégâts de base à 3", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.WEAK_POINT,
        level: 2
      },
      meleeContext()
    );

  assert.equal(
    result.effects.length,
    2
  );

  assert.equal(
    result.effects[0].suggestedValue,
    2
  );

  assert.deepEqual(
    result.effects[1],
    {
      type: TALENT_EFFECT_TYPES.DAMAGE_MODIFIER,
      mode: "set-base",
      suggestedValue: 3,
      editable: true
    }
  );
});


/* ============================================================
 * SPÉCIALISTE EN ARMEMENT
 * ============================================================ */

test("Spécialiste en armement est pertinent pour une attaque de mêlée du type configuré", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.WEAPON_SPECIALIST,
        configuration: {
          weaponType: "melee"
        }
      },
      meleeContext()
    );

  assert.notEqual(result, null);
});


test("Spécialiste en armement est pertinent pour une attaque à distance du type configuré", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.WEAPON_SPECIALIST,
        configuration: {
          weaponType: "firearm"
        }
      },
      rangedContext()
    );

  assert.notEqual(result, null);
});


test("Spécialiste en armement n'est pas pertinent pour un blocage", () => {
  assert.equal(
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.WEAPON_SPECIALIST,
        configuration: {
          weaponType: "melee"
        }
      },
      blockContext()
    ),
    null
  );
});


test("Spécialiste en armement exige actuellement un weaponType configuré", () => {
  assert.equal(
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.WEAPON_SPECIALIST
      },
      meleeContext()
    ),
    null
  );
});


test("Spécialiste en armement exige une correspondance exacte du type d'arme", () => {
  assert.equal(
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.WEAPON_SPECIALIST,
        configuration: {
          weaponType: "firearm"
        }
      },
      meleeContext()
    ),
    null
  );
});


test("Spécialiste en armement niveau 1 propose +1", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.WEAPON_SPECIALIST,
        level: 1,
        configuration: {
          weaponType: "melee"
        }
      },
      meleeContext()
    );

  assert.equal(
    result.effects[0].suggestedValue,
    1
  );
});


test("Spécialiste en armement avancé propose +2", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.WEAPON_SPECIALIST,
        level: 2,
        configuration: {
          weaponType: "melee"
        }
      },
      meleeContext()
    );

  assert.equal(
    result.effects[0].suggestedValue,
    2
  );
});


/* ============================================================
 * TIR RAPIDE
 * ============================================================ */

test("Tir rapide est pertinent pour une attaque à distance avec shooting et une arme à feu non lourde", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.RAPID_FIRE
      },
      rangedContext()
    );

  assert.notEqual(result, null);
});


test("Tir rapide n'est pas pertinent en mêlée", () => {
  assert.equal(
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.RAPID_FIRE
      },
      meleeContext()
    ),
    null
  );
});


test("Tir rapide exige la compétence shooting", () => {
  assert.equal(
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.RAPID_FIRE
      },
      rangedContext({
        skill: "survival"
      })
    ),
    null
  );
});


test("Tir rapide exige isFirearm strictement true", () => {
  assert.equal(
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.RAPID_FIRE
      },
      rangedContext({
        weapon: {
          isFirearm: 1,
          isHeavyWeapon: false
        }
      })
    ),
    null
  );
});


test("Tir rapide refuse une arme lourde lorsque isHeavyWeapon vaut strictement true", () => {
  assert.equal(
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.RAPID_FIRE
      },
      rangedContext({
        weapon: {
          isFirearm: true,
          isHeavyWeapon: true
        }
      })
    ),
    null
  );
});


test("Tir rapide tolère actuellement une valeur truthy non booléenne pour isHeavyWeapon", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.RAPID_FIRE
      },
      rangedContext({
        weapon: {
          isFirearm: true,
          isHeavyWeapon: 1
        }
      })
    );

  assert.notEqual(
    result,
    null
  );
});


test("Tir rapide niveau 1 propose actuellement un malus de -3", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.RAPID_FIRE,
        level: 1
      },
      rangedContext()
    );

  assert.equal(
    result.effects[0].suggestedValue,
    -3
  );
});


test("Tir rapide avancé propose actuellement un malus de -2", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.RAPID_FIRE,
        level: 2
      },
      rangedContext()
    );

  assert.equal(
    result.effects[0].suggestedValue,
    -2
  );
});


test("Tir rapide remplace le coût par une action rapide", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.RAPID_FIRE
      },
      rangedContext()
    );

  assert.deepEqual(
    result.effects[1],
    {
      type: TALENT_EFFECT_TYPES.ACTION_COST,
      cost: "fast",
      mode: "replace"
    }
  );
});


test("Tir rapide interdit la visée", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.RAPID_FIRE
      },
      rangedContext()
    );

  assert.deepEqual(
    result.effects[2],
    {
      type: TALENT_EFFECT_TYPES.FORBID_AIM
    }
  );
});


/* ============================================================
 * TIREUR D'ÉLITE — PERTINENCE
 * ============================================================ */

test("Tireur d'élite est pertinent pour une attaque à distance utilisant shooting", () => {
  assert.notEqual(
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.SHARPSHOOTER
      },
      rangedContext()
    ),
    null
  );
});


test("Tireur d'élite n'exige actuellement aucune propriété particulière de l'arme", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.SHARPSHOOTER
      },
      rangedContext({
        weapon: null
      })
    );

  assert.notEqual(
    result,
    null
  );
});


test("Tireur d'élite n'est pas pertinent si la compétence n'est pas shooting", () => {
  assert.equal(
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.SHARPSHOOTER
      },
      rangedContext({
        skill: "survival"
      })
    ),
    null
  );
});


test("Tireur d'élite n'est pas pertinent pour une autre action", () => {
  assert.equal(
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.SHARPSHOOTER
      },
      meleeContext({
        skill: "shooting"
      })
    ),
    null
  );
});


/* ============================================================
 * TIREUR D'ÉLITE — NIVEAU 1
 * ============================================================ */

test("Tireur d'élite niveau 1 est MET si overwatch vaut true", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.SHARPSHOOTER,
        level: 1
      },
      rangedContext({
        facts: {
          overwatch: true
        }
      })
    );

  assert.equal(
    result.conditionState,
    TALENT_CONDITION_STATES.MET
  );

  assert.equal(
    result.selected,
    true
  );
});


test("Tireur d'élite niveau 1 est UNMET si overwatch vaut false", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.SHARPSHOOTER,
        level: 1
      },
      rangedContext({
        facts: {
          overwatch: false
        }
      })
    );

  assert.equal(
    result.conditionState,
    TALENT_CONDITION_STATES.UNMET
  );

  assert.equal(
    result.selected,
    false
  );
});


test("Tireur d'élite niveau 1 est UNKNOWN si overwatch est absent", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.SHARPSHOOTER,
        level: 1
      },
      rangedContext({
        facts: {}
      })
    );

  assert.equal(
    result.conditionState,
    TALENT_CONDITION_STATES.UNKNOWN
  );

  assert.equal(
    result.selected,
    false
  );
});


test("une valeur truthy non booléenne pour overwatch produit UNMET", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.SHARPSHOOTER,
        level: 1
      },
      rangedContext({
        facts: {
          overwatch: 1
        }
      })
    );

  assert.equal(
    result.conditionState,
    TALENT_CONDITION_STATES.UNMET
  );
});


test("Tireur d'élite niveau 1 propose +1 lorsque overwatch est vrai", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.SHARPSHOOTER,
        level: 1
      },
      rangedContext({
        facts: {
          overwatch: true
        }
      })
    );

  assert.equal(
    result.effects[0].suggestedValue,
    1
  );
});


test("Tireur d'élite niveau 1 propose tout de même +1 lorsque la condition est inconnue", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.SHARPSHOOTER,
        level: 1
      },
      rangedContext({
        facts: {}
      })
    );

  assert.equal(
    result.effects[0].suggestedValue,
    1
  );

  assert.equal(
    result.selected,
    false
  );
});


test("Tireur d'élite niveau 1 propose aussi +1 lorsque la condition est explicitement non remplie", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.SHARPSHOOTER,
        level: 1
      },
      rangedContext({
        facts: {
          overwatch: false
        }
      })
    );

  assert.equal(
    result.effects[0].suggestedValue,
    1
  );

  assert.equal(
    result.selected,
    false
  );
});


/* ============================================================
 * TIREUR D'ÉLITE — NIVEAU AVANCÉ
 * ============================================================ */

test("Tireur d'élite avancé est MET si overwatch est vrai", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.SHARPSHOOTER,
        level: 2
      },
      rangedContext({
        facts: {
          overwatch: true,
          aiming: false
        }
      })
    );

  assert.equal(
    result.conditionState,
    TALENT_CONDITION_STATES.MET
  );
});


test("Tireur d'élite avancé est MET si aiming est vrai", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.SHARPSHOOTER,
        level: 2
      },
      rangedContext({
        facts: {
          overwatch: false,
          aiming: true
        }
      })
    );

  assert.equal(
    result.conditionState,
    TALENT_CONDITION_STATES.MET
  );
});


test("Tireur d'élite avancé est UNMET si overwatch et aiming sont explicitement faux", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.SHARPSHOOTER,
        level: 2
      },
      rangedContext({
        facts: {
          overwatch: false,
          aiming: false
        }
      })
    );

  assert.equal(
    result.conditionState,
    TALENT_CONDITION_STATES.UNMET
  );

  assert.equal(
    result.selected,
    false
  );
});


test("Tireur d'élite avancé est UNKNOWN si overwatch est inconnu et aiming faux", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.SHARPSHOOTER,
        level: 2
      },
      rangedContext({
        facts: {
          aiming: false
        }
      })
    );

  assert.equal(
    result.conditionState,
    TALENT_CONDITION_STATES.UNKNOWN
  );
});


test("Tireur d'élite avancé est UNKNOWN si overwatch est faux et aiming inconnu", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.SHARPSHOOTER,
        level: 2
      },
      rangedContext({
        facts: {
          overwatch: false
        }
      })
    );

  assert.equal(
    result.conditionState,
    TALENT_CONDITION_STATES.UNKNOWN
  );
});


test("Tireur d'élite avancé est UNKNOWN si les deux circonstances sont inconnues", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.SHARPSHOOTER,
        level: 2
      },
      rangedContext({
        facts: {}
      })
    );

  assert.equal(
    result.conditionState,
    TALENT_CONDITION_STATES.UNKNOWN
  );
});


test("Tireur d'élite avancé propose +2 si overwatch et aiming sont vrais", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.SHARPSHOOTER,
        level: 2
      },
      rangedContext({
        facts: {
          overwatch: true,
          aiming: true
        }
      })
    );

  assert.equal(
    result.effects[0].suggestedValue,
    2
  );
});


test("Tireur d'élite avancé propose +1 si seul overwatch est vrai", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.SHARPSHOOTER,
        level: 2
      },
      rangedContext({
        facts: {
          overwatch: true,
          aiming: false
        }
      })
    );

  assert.equal(
    result.effects[0].suggestedValue,
    1
  );
});


test("Tireur d'élite avancé propose +1 si seule la visée est vraie", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.SHARPSHOOTER,
        level: 2
      },
      rangedContext({
        facts: {
          overwatch: false,
          aiming: true
        }
      })
    );

  assert.equal(
    result.effects[0].suggestedValue,
    1
  );
});


test("Tireur d'élite avancé conserve un bonus minimal proposé de +1 sans circonstance vraie", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.SHARPSHOOTER,
        level: 2
      },
      rangedContext({
        facts: {
          overwatch: false,
          aiming: false
        }
      })
    );

  assert.equal(
    result.effects[0].suggestedValue,
    1
  );

  assert.equal(
    result.selected,
    false
  );
});


/* ============================================================
 * POLITIQUE selected / conditionState
 * ============================================================ */

test("une condition NONE est précochée", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.BRUTE
      },
      meleeContext()
    );

  assert.equal(
    result.conditionState,
    TALENT_CONDITION_STATES.NONE
  );

  assert.equal(
    result.selected,
    true
  );
});


test("une condition MET est précochée", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.SHARPSHOOTER
      },
      rangedContext({
        facts: {
          overwatch: true
        }
      })
    );

  assert.equal(
    result.selected,
    true
  );
});


test("une condition UNKNOWN est proposée décochée", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.SHARPSHOOTER
      },
      rangedContext({
        facts: {}
      })
    );

  assert.equal(
    result.selected,
    false
  );
});


test("une condition UNMET reste proposée mais décochée", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.SHARPSHOOTER
      },
      rangedContext({
        facts: {
          overwatch: false
        }
      })
    );

  assert.notEqual(
    result,
    null
  );

  assert.equal(
    result.conditionState,
    TALENT_CONDITION_STATES.UNMET
  );

  assert.equal(
    result.selected,
    false
  );
});


/* ============================================================
 * COLLECTION
 * ============================================================ */

test("evaluateTalentsForAction retourne un tableau vide si talents n'est pas un tableau", () => {
  for (
    const talents
    of [
      undefined,
      null,
      {},
      "brute",
      42
    ]
  ) {
    assert.deepEqual(
      evaluateTalentsForAction(
        talents,
        meleeContext()
      ),
      []
    );
  }
});


test("evaluateTalentsForAction élimine les talents inconnus et non pertinents", () => {
  const results =
    evaluateTalentsForAction(
      [
        {
          key: TALENT_KEYS.BRUTE
        },
        {
          key: TALENT_KEYS.RAPID_FIRE
        },
        {
          key: "unknown"
        }
      ],
      meleeContext()
    );

  assert.equal(
    results.length,
    1
  );

  assert.equal(
    results[0].key,
    TALENT_KEYS.BRUTE
  );
});


test("evaluateTalentsForAction conserve l'ordre des talents pertinents", () => {
  const results =
    evaluateTalentsForAction(
      [
        {
          key: TALENT_KEYS.WEAK_POINT
        },
        {
          key: TALENT_KEYS.BRUTE
        },
        {
          key: TALENT_KEYS.FAVORITE_WEAPON,
          configuration: {
            weaponCategory: "bladedWeapon"
          }
        }
      ],
      meleeContext()
    );

  assert.deepEqual(
    results.map(
      result =>
        result.key
    ),
    [
      TALENT_KEYS.WEAK_POINT,
      TALENT_KEYS.BRUTE,
      TALENT_KEYS.FAVORITE_WEAPON
    ]
  );
});


test("evaluateTalentsForAction conserve plusieurs occurrences du même talent", () => {
  const results =
    evaluateTalentsForAction(
      [
        {
          key: TALENT_KEYS.FAVORITE_WEAPON,
          configuration: {
            weaponCategory: "bladedWeapon"
          }
        },
        {
          key: TALENT_KEYS.FAVORITE_WEAPON,
          configuration: {
            weaponCategory: "bladedWeapon"
          }
        }
      ],
      meleeContext()
    );

  assert.equal(
    results.length,
    2
  );
});


/* ============================================================
 * COMPATIBILITÉ
 * ============================================================ */

test("deux talents absents sont considérés compatibles", () => {
  assert.equal(
    areTalentsCompatible(
      null,
      null
    ),
    true
  );
});


test("un talent absent et un talent présent sont considérés compatibles", () => {
  assert.equal(
    areTalentsCompatible(
      null,
      {
        key: TALENT_KEYS.BRUTE
      }
    ),
    true
  );
});


test("un talent inconnu est considéré compatible avec un talent connu", () => {
  assert.equal(
    areTalentsCompatible(
      {
        key: "unknown"
      },
      {
        key: TALENT_KEYS.BRUTE
      }
    ),
    true
  );
});


test("Arme de prédilection et Spécialiste en armement sont incompatibles", () => {
  assert.equal(
    areTalentsCompatible(
      {
        key:
          TALENT_KEYS.FAVORITE_WEAPON
      },
      {
        key:
          TALENT_KEYS.WEAPON_SPECIALIST
      }
    ),
    false
  );
});


test("l'incompatibilité Arme de prédilection / Spécialiste est symétrique", () => {
  assert.equal(
    areTalentsCompatible(
      {
        key:
          TALENT_KEYS.WEAPON_SPECIALIST
      },
      {
        key:
          TALENT_KEYS.FAVORITE_WEAPON
      }
    ),
    false
  );
});


test("Brute et Point faible sont compatibles", () => {
  assert.equal(
    areTalentsCompatible(
      {
        key: TALENT_KEYS.BRUTE
      },
      {
        key: TALENT_KEYS.WEAK_POINT
      }
    ),
    true
  );
});


test("la compatibilité repose actuellement uniquement sur les clés de définition", () => {
  assert.equal(
    areTalentsCompatible(
      {
        key: TALENT_KEYS.FAVORITE_WEAPON,
        configuration: {
          weaponCategory: "bladedWeapon"
        }
      },
      {
        key: TALENT_KEYS.WEAPON_SPECIALIST,
        configuration: {
          weaponType: "firearm"
        }
      }
    ),
    false
  );
});


test("deux occurrences d'Arme de prédilection sont actuellement compatibles entre elles", () => {
  assert.equal(
    areTalentsCompatible(
      {
        key: TALENT_KEYS.FAVORITE_WEAPON,
        configuration: {
          weaponCategory: "bladedWeapon"
        }
      },
      {
        key: TALENT_KEYS.FAVORITE_WEAPON,
        configuration: {
          weaponCategory: "pistol"
        }
      }
    ),
    true
  );
});


/* ============================================================
 * STRUCTURE DES EFFETS
 * ============================================================ */

test("les effets modificateurs créés sont de nouveaux objets à chaque évaluation", () => {
  const first =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.BRUTE
      },
      meleeContext()
    );

  const second =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.BRUTE
      },
      meleeContext()
    );

  assert.notEqual(
    first.effects,
    second.effects
  );

  assert.notEqual(
    first.effects[0],
    second.effects[0]
  );

  assert.notEqual(
    first.effects[0].metadata,
    second.effects[0].metadata
  );
});


test("les effets modificateurs sont éditables par défaut dans le moteur actuel", () => {
  const result =
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.BRUTE
      },
      meleeContext()
    );

  assert.equal(
    result.effects[0].editable,
    true
  );
});


test("le metadata d'un modificateur de Talent est actuellement vide pour les six définitions", () => {
  const evaluations = [
    evaluateTalentForAction(
      {
        key: TALENT_KEYS.FAVORITE_WEAPON,
        configuration: {
          weaponCategory: "bladedWeapon"
        }
      },
      meleeContext()
    ),

    evaluateTalentForAction(
      {
        key: TALENT_KEYS.BRUTE
      },
      meleeContext()
    ),

    evaluateTalentForAction(
      {
        key: TALENT_KEYS.WEAK_POINT
      },
      meleeContext()
    ),

    evaluateTalentForAction(
      {
        key: TALENT_KEYS.WEAPON_SPECIALIST,
        configuration: {
          weaponType: "melee"
        }
      },
      meleeContext()
    ),

    evaluateTalentForAction(
      {
        key: TALENT_KEYS.RAPID_FIRE
      },
      rangedContext()
    ),

    evaluateTalentForAction(
      {
        key: TALENT_KEYS.SHARPSHOOTER
      },
      rangedContext({
        facts: {
          overwatch: true
        }
      })
    )
  ];

  for (const evaluation of evaluations) {
    assert.deepEqual(
      evaluation.effects[0].metadata,
      {}
    );
  }
});

/* ============================================================
 * TALENTS « CHERCHEUR DE RESSOURCE » (Jet de SURVIE, Station)
 * ============================================================ */

const RESOURCE_FORAGER_TALENTS = [
  {
    talentKey: TALENT_KEYS.WATER_FORAGER,
    label: "Sourcier",
    resourceKey: "water"
  },
  {
    talentKey: TALENT_KEYS.FOOD_FORAGER,
    label: "Chasseur-cueilleur",
    resourceKey: "food"
  },
  {
    talentKey: TALENT_KEYS.ENERGY_FORAGER,
    label: "Carbochimiste",
    resourceKey: "energy"
  },
  {
    talentKey: TALENT_KEYS.MEDICINE_FORAGER,
    label: "Pharmacologiste",
    resourceKey: "medicine"
  },
  {
    talentKey: TALENT_KEYS.EQUIPMENT_FORAGER,
    label: "Dénicheur",
    resourceKey: "equipment"
  }
];


for (const {
  talentKey,
  label,
  resourceKey
} of RESOURCE_FORAGER_TALENTS) {

  test(`${label} est pertinent uniquement pour un Jet de SURVIE visant sa ressource (${resourceKey})`, () => {
    assert.notEqual(
      evaluateTalentForAction(
        {
          key: talentKey
        },
        skillContext({
          metadata: {
            resourceKey
          }
        })
      ),
      null
    );

    assert.equal(
      evaluateTalentForAction(
        {
          key: talentKey
        },
        skillContext({
          metadata: {
            resourceKey: "autre-ressource"
          }
        })
      ),
      null
    );

    assert.equal(
      evaluateTalentForAction(
        {
          key: talentKey
        },
        skillContext({
          skill: "closeCombat",
          metadata: {
            resourceKey
          }
        })
      ),
      null
    );

    assert.equal(
      evaluateTalentForAction(
        {
          key: talentKey
        },
        meleeContext()
      ),
      null
    );
  });


  test(`${label} niveau 1 propose toujours +1 à l'action`, () => {
    const result =
      evaluateTalentForAction(
        {
          key: talentKey,
          level: 1
        },
        skillContext({
          metadata: {
            resourceKey
          }
        })
      );

    assert.equal(
      result.conditionState,
      TALENT_CONDITION_STATES.NONE
    );

    assert.equal(
      result.selected,
      true
    );

    assert.deepEqual(
      result.effects,
      [
        {
          type: TALENT_EFFECT_TYPES.ACTION_MODIFIER,
          suggestedValue: 1,
          editable: true,
          metadata: {}
        }
      ]
    );
  });


  test(`${label} avancé (niveau 2) propose +2 à l'action`, () => {
    const result =
      evaluateTalentForAction(
        {
          key: talentKey,
          level: 2
        },
        skillContext({
          metadata: {
            resourceKey
          }
        })
      );

    assert.deepEqual(
      result.effects,
      [
        {
          type: TALENT_EFFECT_TYPES.ACTION_MODIFIER,
          suggestedValue: 2,
          editable: true,
          metadata: {}
        }
      ]
    );
  });

}


/* ============================================================
 * TALENTS « ÉCHANGE D'ATTRIBUT » (au choix, jamais automatique)
 * ============================================================ */

test("Esquive est pertinent uniquement pour un blocage en mêlée", () => {
  assert.notEqual(
    evaluateTalentForAction(
      { key: TALENT_KEYS.DODGE },
      blockContext()
    ),
    null
  );

  assert.equal(
    evaluateTalentForAction(
      { key: TALENT_KEYS.DODGE },
      meleeContext()
    ),
    null
  );

  assert.equal(
    evaluateTalentForAction(
      { key: TALENT_KEYS.DODGE },
      skillContext({ skill: "observation" })
    ),
    null
  );
});


test("Esquive propose toujours l'échange vers l'Agilité, décoché n'est pas pertinent ici (c'est un choix, pas un bonus numérique)", () => {
  const result =
    evaluateTalentForAction(
      { key: TALENT_KEYS.DODGE, level: 1 },
      blockContext()
    );

  assert.equal(result.conditionState, TALENT_CONDITION_STATES.NONE);

  assert.deepEqual(
    result.effects,
    [
      {
        type: TALENT_EFFECT_TYPES.ATTRIBUTE_SWAP,
        attribute: "agility",
        editable: true
      }
    ]
  );
});


test("Sens du danger est pertinent uniquement pour un Jet d'Observation", () => {
  assert.notEqual(
    evaluateTalentForAction(
      { key: TALENT_KEYS.DANGER_SENSE },
      skillContext({ skill: "observation" })
    ),
    null
  );

  assert.equal(
    evaluateTalentForAction(
      { key: TALENT_KEYS.DANGER_SENSE },
      skillContext({ skill: "survival" })
    ),
    null
  );

  assert.equal(
    evaluateTalentForAction(
      { key: TALENT_KEYS.DANGER_SENSE },
      meleeContext()
    ),
    null
  );
});


test("Sens du danger propose l'échange vers l'Empathie", () => {
  const result =
    evaluateTalentForAction(
      { key: TALENT_KEYS.DANGER_SENSE, level: 1 },
      skillContext({ skill: "observation" })
    );

  assert.equal(result.conditionState, TALENT_CONDITION_STATES.NONE);

  assert.deepEqual(
    result.effects,
    [
      {
        type: TALENT_EFFECT_TYPES.ATTRIBUTE_SWAP,
        attribute: "empathy",
        editable: true
      }
    ]
  );
});


test("Menaçant est pertinent uniquement pour un Jet de Manipulation", () => {
  assert.notEqual(
    evaluateTalentForAction(
      { key: TALENT_KEYS.INTIMIDATING },
      skillContext({ skill: "manipulation" })
    ),
    null
  );

  assert.equal(
    evaluateTalentForAction(
      { key: TALENT_KEYS.INTIMIDATING },
      skillContext({ skill: "observation" })
    ),
    null
  );
});


test("Menaçant niveau normal dépend de la circonstance narrative « menacer » (UNKNOWN si non renseignée)", () => {
  const unknown =
    evaluateTalentForAction(
      { key: TALENT_KEYS.INTIMIDATING, level: 1 },
      skillContext({ skill: "manipulation" })
    );

  assert.equal(unknown.conditionState, TALENT_CONDITION_STATES.UNKNOWN);
  assert.equal(unknown.selected, false);

  const met =
    evaluateTalentForAction(
      { key: TALENT_KEYS.INTIMIDATING, level: 1 },
      skillContext({
        skill: "manipulation",
        facts: { threatening: true }
      })
    );

  assert.equal(met.conditionState, TALENT_CONDITION_STATES.MET);

  const unmet =
    evaluateTalentForAction(
      { key: TALENT_KEYS.INTIMIDATING, level: 1 },
      skillContext({
        skill: "manipulation",
        facts: { threatening: false }
      })
    );

  assert.equal(unmet.conditionState, TALENT_CONDITION_STATES.UNMET);
});


test("Menaçant avancé (niveau 2) est toujours disponible, sans condition", () => {
  const result =
    evaluateTalentForAction(
      { key: TALENT_KEYS.INTIMIDATING, level: 2 },
      skillContext({ skill: "manipulation" })
    );

  assert.equal(result.conditionState, TALENT_CONDITION_STATES.NONE);

  assert.deepEqual(
    result.effects,
    [
      {
        type: TALENT_EFFECT_TYPES.ATTRIBUTE_SWAP,
        attribute: "vigor",
        editable: true
      }
    ]
  );
});


/* ============================================================
 * TIREUR INSTINCTIF (couvert / véhicule en mouvement — faits
 * narratifs à l'appréciation du MJ, comme pour Tireur d'élite)
 * ============================================================ */

test("Tireur instinctif est pertinent uniquement pour un Jet de TIR à distance", () => {
  assert.notEqual(
    evaluateTalentForAction(
      { key: TALENT_KEYS.INSTINCTIVE_SHOOTER },
      rangedContext()
    ),
    null
  );

  assert.equal(
    evaluateTalentForAction(
      { key: TALENT_KEYS.INSTINCTIVE_SHOOTER },
      meleeContext()
    ),
    null
  );

  assert.equal(
    evaluateTalentForAction(
      { key: TALENT_KEYS.INSTINCTIVE_SHOOTER },
      skillContext({ skill: "survival" })
    ),
    null
  );
});


test("Tireur instinctif niveau normal dépend uniquement du couvert", () => {
  const unknown =
    evaluateTalentForAction(
      { key: TALENT_KEYS.INSTINCTIVE_SHOOTER, level: 1 },
      rangedContext()
    );

  assert.equal(unknown.conditionState, TALENT_CONDITION_STATES.UNKNOWN);
  assert.equal(unknown.selected, false);
  assert.deepEqual(
    unknown.effects,
    [
      {
        type: TALENT_EFFECT_TYPES.ACTION_MODIFIER,
        suggestedValue: 1,
        editable: true,
        metadata: {}
      }
    ]
  );

  const covered =
    evaluateTalentForAction(
      { key: TALENT_KEYS.INSTINCTIVE_SHOOTER, level: 1 },
      rangedContext({ facts: { cover: true } })
    );

  assert.equal(covered.conditionState, TALENT_CONDITION_STATES.MET);
  assert.equal(covered.selected, true);
  assert.equal(covered.effects[0].suggestedValue, 1);

  const notCovered =
    evaluateTalentForAction(
      { key: TALENT_KEYS.INSTINCTIVE_SHOOTER, level: 1 },
      rangedContext({ facts: { cover: false } })
    );

  assert.equal(notCovered.conditionState, TALENT_CONDITION_STATES.UNMET);
  assert.equal(notCovered.selected, false);

  /*
   * Niveau normal : le véhicule en mouvement n'entre pas en
   * ligne de compte (texte du livre, effet réservé au niveau
   * supérieur).
   */
  const movingVehicleIgnoredAtNormalLevel =
    evaluateTalentForAction(
      { key: TALENT_KEYS.INSTINCTIVE_SHOOTER, level: 1 },
      rangedContext({ facts: { cover: false, movingVehicle: true } })
    );

  assert.equal(
    movingVehicleIgnoredAtNormalLevel.conditionState,
    TALENT_CONDITION_STATES.UNMET
  );
});


test("Tireur instinctif avancé cumule couvert (+2) et véhicule en mouvement (+1)", () => {
  const both =
    evaluateTalentForAction(
      { key: TALENT_KEYS.INSTINCTIVE_SHOOTER, level: 2 },
      rangedContext({
        facts: { cover: true, movingVehicle: true }
      })
    );

  assert.equal(both.conditionState, TALENT_CONDITION_STATES.MET);
  assert.equal(both.effects[0].suggestedValue, 3);

  const coverOnly =
    evaluateTalentForAction(
      { key: TALENT_KEYS.INSTINCTIVE_SHOOTER, level: 2 },
      rangedContext({ facts: { cover: true, movingVehicle: false } })
    );

  assert.equal(coverOnly.effects[0].suggestedValue, 2);

  const vehicleOnly =
    evaluateTalentForAction(
      { key: TALENT_KEYS.INSTINCTIVE_SHOOTER, level: 2 },
      rangedContext({ facts: { cover: false, movingVehicle: true } })
    );

  assert.equal(vehicleOnly.conditionState, TALENT_CONDITION_STATES.MET);
  assert.equal(vehicleOnly.effects[0].suggestedValue, 1);

  const unknownBoth =
    evaluateTalentForAction(
      { key: TALENT_KEYS.INSTINCTIVE_SHOOTER, level: 2 },
      rangedContext()
    );

  assert.equal(unknownBoth.conditionState, TALENT_CONDITION_STATES.UNKNOWN);
  assert.equal(unknownBoth.selected, false);
  assert.equal(unknownBoth.effects[0].suggestedValue, 2);

  const neitherKnown =
    evaluateTalentForAction(
      { key: TALENT_KEYS.INSTINCTIVE_SHOOTER, level: 2 },
      rangedContext({ facts: { cover: false, movingVehicle: false } })
    );

  assert.equal(neitherKnown.conditionState, TALENT_CONDITION_STATES.UNMET);
  assert.equal(neitherKnown.selected, false);
});



/* ============================================================
 * PILOTE (jet de RÉACTION pour piloter — circonstance narrative
 * à l'appréciation du MJ, proposé décoché)
 * ============================================================ */

test("Pilote est pertinent uniquement pour un jet de Compétence RÉACTION", () => {
  assert.notEqual(
    evaluateTalentForAction(
      { key: TALENT_KEYS.PILOT },
      skillContext({ skill: "reaction" })
    ),
    null
  );

  for (const skill of ["survival", "observation", "shooting", "closeCombat", "manipulation"]) {
    assert.equal(
      evaluateTalentForAction(
        { key: TALENT_KEYS.PILOT },
        skillContext({ skill })
      ),
      null,
      skill
    );
  }

  assert.equal(
    evaluateTalentForAction({ key: TALENT_KEYS.PILOT }, meleeContext()),
    null
  );
  assert.equal(
    evaluateTalentForAction({ key: TALENT_KEYS.PILOT }, rangedContext()),
    null
  );
  assert.equal(
    evaluateTalentForAction({ key: TALENT_KEYS.PILOT }, blockContext()),
    null
  );
});


test("Pilote : circonstance inconnue -> UNKNOWN, proposé décoché", () => {
  const result =
    evaluateTalentForAction(
      { key: TALENT_KEYS.PILOT, level: 1 },
      skillContext({ skill: "reaction" })
    );

  assert.equal(result.label, "Pilote");
  assert.equal(result.conditionState, TALENT_CONDITION_STATES.UNKNOWN);
  assert.equal(result.selected, false);
});


test("Pilote : fait `piloting` explicite -> MET (coché) ou UNMET (décoché)", () => {
  const met =
    evaluateTalentForAction(
      { key: TALENT_KEYS.PILOT },
      skillContext({ skill: "reaction", facts: { piloting: true } })
    );

  assert.equal(met.conditionState, TALENT_CONDITION_STATES.MET);
  assert.equal(met.selected, true);

  const unmet =
    evaluateTalentForAction(
      { key: TALENT_KEYS.PILOT },
      skillContext({ skill: "reaction", facts: { piloting: false } })
    );

  assert.equal(unmet.conditionState, TALENT_CONDITION_STATES.UNMET);
  assert.equal(unmet.selected, false);
});


test("Pilote propose +1 au niveau 1 (défaut) et +2 au niveau 2, modifiable", () => {
  const level1 =
    evaluateTalentForAction(
      { key: TALENT_KEYS.PILOT, level: 1 },
      skillContext({ skill: "reaction" })
    );

  assert.deepEqual(
    level1.effects,
    [
      {
        type: TALENT_EFFECT_TYPES.ACTION_MODIFIER,
        suggestedValue: 1,
        editable: true,
        metadata: {}
      }
    ]
  );

  const defaultLevel =
    evaluateTalentForAction(
      { key: TALENT_KEYS.PILOT },
      skillContext({ skill: "reaction" })
    );

  assert.equal(defaultLevel.effects[0].suggestedValue, 1);

  const level2 =
    evaluateTalentForAction(
      { key: TALENT_KEYS.PILOT, level: 2 },
      skillContext({ skill: "reaction" })
    );

  assert.equal(level2.level, 2);
  assert.equal(level2.effects.length, 1);
  assert.equal(level2.effects[0].suggestedValue, 2);
});
