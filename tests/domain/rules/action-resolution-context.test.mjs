import test from "node:test";
import assert from "node:assert/strict";

import {
  ACTION_RESOLUTION_TYPES,
  isActionResolutionType,
  isAttributeResolution,
  isSkillResolution,
  createActionResolutionContext,
  isAttackResolution,
  isMeleeResolution,
  isRangedResolution,
  getActionContextFact,
  hasActionContextFact,
  isActionContextFactTrue
} from "../../../src/domain/rules/action-resolution-context.mjs";


/* ============================================================
 * TYPES DE RÉSOLUTION
 * ============================================================ */

test("ACTION_RESOLUTION_TYPES contient les cinq types attendus", () => {
  assert.deepEqual(
    ACTION_RESOLUTION_TYPES,
    {
      ATTRIBUTE_ROLL: "attribute-roll",
      SKILL_ROLL: "skill-roll",
      MELEE_ATTACK: "melee-attack",
      MELEE_BLOCK: "melee-block",
      RANGED_ATTACK: "ranged-attack"
    }
  );
});


test("ACTION_RESOLUTION_TYPES est gelé", () => {
  assert.equal(
    Object.isFrozen(ACTION_RESOLUTION_TYPES),
    true
  );
});


test("isActionResolutionType accepte tous les types déclarés", () => {
  for (
    const actionType
    of Object.values(ACTION_RESOLUTION_TYPES)
  ) {
    assert.equal(
      isActionResolutionType(actionType),
      true
    );
  }
});


test("isActionResolutionType refuse les valeurs inconnues", () => {
  for (
    const actionType
    of [
      undefined,
      null,
      "",
      "unknown",
      1,
      true,
      {}
    ]
  ) {
    assert.equal(
      isActionResolutionType(actionType),
      false
    );
  }
});


test("les types de résolution sont sensibles à la casse et aux espaces", () => {
  assert.equal(
    isActionResolutionType("MELEE-ATTACK"),
    false
  );

  assert.equal(
    isActionResolutionType(" melee-attack "),
    false
  );
});


/* ============================================================
 * CRÉATION — actionType
 * ============================================================ */

test("createActionResolutionContext exige un type de résolution valide", () => {
  for (
    const actionType
    of [
      undefined,
      null,
      "",
      "unknown"
    ]
  ) {
    assert.throws(
      () =>
        createActionResolutionContext({
          actionType
        }),
      TypeError
    );
  }
});


test("l'erreur de type de résolution possède le message attendu", () => {
  assert.throws(
    () =>
      createActionResolutionContext({
        actionType: "unknown"
      }),
    {
      name: "TypeError",
      message:
        "Type de résolution d'action inconnu : unknown."
    }
  );
});


test("tous les types déclarés peuvent créer un contexte", () => {
  for (
    const actionType
    of Object.values(ACTION_RESOLUTION_TYPES)
  ) {
    const context =
      createActionResolutionContext({
        actionType
      });

    assert.equal(
      context.actionType,
      actionType
    );
  }
});


test("le contexte minimal utilise les valeurs par défaut attendues", () => {
  assert.deepEqual(
    createActionResolutionContext({
      actionType:
        ACTION_RESOLUTION_TYPES.ATTRIBUTE_ROLL
    }),
    {
      actionType: "attribute-roll",
      actorId: null,
      opponentId: null,
      attribute: null,
      skill: null,
      weapon: null,
      facts: {},
      metadata: {}
    }
  );
});


/* ============================================================
 * MÉTADONNÉES
 * ============================================================ */

test("metadata null est refusé", () => {
  assert.throws(
    () =>
      createActionResolutionContext({
        actionType:
          ACTION_RESOLUTION_TYPES.ATTRIBUTE_ROLL,
        metadata: null
      }),
    {
      name: "TypeError",
      message:
        "Les métadonnées du contexte doivent être un objet."
    }
  );
});


test("metadata sous forme de tableau est refusé", () => {
  assert.throws(
    () =>
      createActionResolutionContext({
        actionType:
          ACTION_RESOLUTION_TYPES.ATTRIBUTE_ROLL,
        metadata: []
      }),
    TypeError
  );
});


test("metadata sous forme primitive est refusé", () => {
  for (
    const metadata
    of [
      "test",
      42,
      true
    ]
  ) {
    assert.throws(
      () =>
        createActionResolutionContext({
          actionType:
            ACTION_RESOLUTION_TYPES.ATTRIBUTE_ROLL,
          metadata
        }),
      TypeError
    );
  }
});


test("metadata sous forme de fonction est refusé", () => {
  assert.throws(
    () =>
      createActionResolutionContext({
        actionType:
          ACTION_RESOLUTION_TYPES.ATTRIBUTE_ROLL,
        metadata: () => {}
      }),
    TypeError
  );
});


test("metadata est copié dans un nouvel objet", () => {
  const metadata = {
    origin: "test"
  };

  const context =
    createActionResolutionContext({
      actionType:
        ACTION_RESOLUTION_TYPES.ATTRIBUTE_ROLL,
      metadata
    });

  assert.notEqual(
    context.metadata,
    metadata
  );

  assert.deepEqual(
    context.metadata,
    metadata
  );
});


test("la copie de metadata est superficielle", () => {
  const nested = {
    value: 1
  };

  const context =
    createActionResolutionContext({
      actionType:
        ACTION_RESOLUTION_TYPES.ATTRIBUTE_ROLL,
      metadata: {
        nested
      }
    });

  assert.equal(
    context.metadata.nested,
    nested
  );
});


/* ============================================================
 * CHAÎNES OPTIONNELLES
 * ============================================================ */

test("actorId, opponentId, attribute et skill sont trimés", () => {
  const context =
    createActionResolutionContext({
      actionType:
        ACTION_RESOLUTION_TYPES.SKILL_ROLL,

      actorId:
        " actor-1 ",

      opponentId:
        " target-1 ",

      attribute:
        " vigor ",

      skill:
        " closeCombat "
    });

  assert.equal(
    context.actorId,
    "actor-1"
  );

  assert.equal(
    context.opponentId,
    "target-1"
  );

  assert.equal(
    context.attribute,
    "vigor"
  );

  assert.equal(
    context.skill,
    "closeCombat"
  );
});


test("les chaînes optionnelles null ou undefined deviennent null", () => {
  const context =
    createActionResolutionContext({
      actionType:
        ACTION_RESOLUTION_TYPES.SKILL_ROLL,

      actorId: null,
      opponentId: undefined,
      attribute: null,
      skill: undefined
    });

  assert.equal(context.actorId, null);
  assert.equal(context.opponentId, null);
  assert.equal(context.attribute, null);
  assert.equal(context.skill, null);
});


test("les chaînes optionnelles vides ou composées d'espaces deviennent null", () => {
  const context =
    createActionResolutionContext({
      actionType:
        ACTION_RESOLUTION_TYPES.SKILL_ROLL,

      actorId: "",
      opponentId: "   ",
      attribute: "\t",
      skill: "\n"
    });

  assert.equal(context.actorId, null);
  assert.equal(context.opponentId, null);
  assert.equal(context.attribute, null);
  assert.equal(context.skill, null);
});


test("les valeurs non chaînes des champs optionnels sont converties avec String", () => {
  const context =
    createActionResolutionContext({
      actionType:
        ACTION_RESOLUTION_TYPES.SKILL_ROLL,

      actorId: 42,
      opponentId: true,
      attribute: 0,
      skill: false
    });

  assert.equal(
    context.actorId,
    "42"
  );

  assert.equal(
    context.opponentId,
    "true"
  );

  assert.equal(
    context.attribute,
    "0"
  );

  assert.equal(
    context.skill,
    "false"
  );
});


/* ============================================================
 * ARME
 * ============================================================ */

test("weapon absent, null ou falsy devient null", () => {
  for (
    const weapon
    of [
      undefined,
      null,
      false,
      0,
      ""
    ]
  ) {
    const context =
      createActionResolutionContext({
        actionType:
          ACTION_RESOLUTION_TYPES.MELEE_ATTACK,
        weapon
      });

    assert.equal(
      context.weapon,
      null
    );
  }
});


test("une arme complète est normalisée", () => {
  const context =
    createActionResolutionContext({
      actionType:
        ACTION_RESOLUTION_TYPES.MELEE_ATTACK,

      weapon: {
        id: " weapon-1 ",
        name: " Couteau ",
        category: " knife ",
        type: " melee ",
        isFirearm: false,
        isHeavyWeapon: false,
        isMeleeWeapon: true,
        isRangedWeapon: false
      }
    });

  assert.deepEqual(
    context.weapon,
    {
      id: "weapon-1",
      name: "Couteau",
      category: "knife",
      type: "melee",
      isFirearm: false,
      isHeavyWeapon: false,
      isMeleeWeapon: true,
      isRangedWeapon: false
    }
  );
});


test("les propriétés textuelles absentes de weapon deviennent null", () => {
  const context =
    createActionResolutionContext({
      actionType:
        ACTION_RESOLUTION_TYPES.MELEE_ATTACK,
      weapon: {}
    });

  assert.equal(context.weapon.id, null);
  assert.equal(context.weapon.name, null);
  assert.equal(context.weapon.category, null);
  assert.equal(context.weapon.type, null);
});


test("les indicateurs d'arme ne valent true que pour la valeur strictement true", () => {
  const context =
    createActionResolutionContext({
      actionType:
        ACTION_RESOLUTION_TYPES.RANGED_ATTACK,

      weapon: {
        isFirearm: 1,
        isHeavyWeapon: "true",
        isMeleeWeapon: true,
        isRangedWeapon: false
      }
    });

  assert.deepEqual(
    {
      isFirearm:
        context.weapon.isFirearm,

      isHeavyWeapon:
        context.weapon.isHeavyWeapon,

      isMeleeWeapon:
        context.weapon.isMeleeWeapon,

      isRangedWeapon:
        context.weapon.isRangedWeapon
    },
    {
      isFirearm: false,
      isHeavyWeapon: false,
      isMeleeWeapon: true,
      isRangedWeapon: false
    }
  );
});


test("une valeur primitive truthy utilisée comme weapon est actuellement tolérée", () => {
  const context =
    createActionResolutionContext({
      actionType:
        ACTION_RESOLUTION_TYPES.MELEE_ATTACK,
      weapon: "weapon"
    });

  assert.deepEqual(
    context.weapon,
    {
      id: null,
      name: null,
      category: null,
      type: null,
      isFirearm: false,
      isHeavyWeapon: false,
      isMeleeWeapon: false,
      isRangedWeapon: false
    }
  );
});


test("la normalisation de weapon crée un nouvel objet", () => {
  const weapon = {
    id: "weapon-1",
    name: "Couteau"
  };

  const context =
    createActionResolutionContext({
      actionType:
        ACTION_RESOLUTION_TYPES.MELEE_ATTACK,
      weapon
    });

  assert.notEqual(
    context.weapon,
    weapon
  );
});


/* ============================================================
 * FAITS
 * ============================================================ */

test("facts null ou undefined devient un objet vide", () => {
  for (
    const facts
    of [
      null,
      undefined
    ]
  ) {
    const context =
      createActionResolutionContext({
        actionType:
          ACTION_RESOLUTION_TYPES.ATTRIBUTE_ROLL,
        facts
      });

    assert.deepEqual(
      context.facts,
      {}
    );
  }
});


test("facts sous forme primitive est refusé", () => {
  for (
    const facts
    of [
      "night",
      1,
      true
    ]
  ) {
    assert.throws(
      () =>
        createActionResolutionContext({
          actionType:
            ACTION_RESOLUTION_TYPES.ATTRIBUTE_ROLL,
          facts
        }),
      {
        name: "TypeError",
        message:
          "Les faits du contexte doivent être un objet."
      }
    );
  }
});


test("facts sous forme de tableau est refusé", () => {
  assert.throws(
    () =>
      createActionResolutionContext({
        actionType:
          ACTION_RESOLUTION_TYPES.ATTRIBUTE_ROLL,
        facts: []
      }),
    TypeError
  );
});


test("facts est copié dans un nouvel objet", () => {
  const facts = {
    night: true,
    concealed: false
  };

  const context =
    createActionResolutionContext({
      actionType:
        ACTION_RESOLUTION_TYPES.ATTRIBUTE_ROLL,
      facts
    });

  assert.notEqual(
    context.facts,
    facts
  );

  assert.deepEqual(
    context.facts,
    facts
  );
});


test("la copie de facts est superficielle", () => {
  const nested = {
    known: true
  };

  const context =
    createActionResolutionContext({
      actionType:
        ACTION_RESOLUTION_TYPES.ATTRIBUTE_ROLL,

      facts: {
        nested
      }
    });

  assert.equal(
    context.facts.nested,
    nested
  );
});


test("une valeur false dans facts est conservée comme information explicite", () => {
  const context =
    createActionResolutionContext({
      actionType:
        ACTION_RESOLUTION_TYPES.ATTRIBUTE_ROLL,

      facts: {
        night: false
      }
    });

  assert.equal(
    context.facts.night,
    false
  );
});


/* ============================================================
 * CLASSIFICATION DES RÉSOLUTIONS
 * ============================================================ */

test("isAttributeResolution reconnaît uniquement les jets d'Attribut", () => {
  assert.equal(
    isAttributeResolution({
      actionType:
        ACTION_RESOLUTION_TYPES.ATTRIBUTE_ROLL
    }),
    true
  );

  assert.equal(
    isAttributeResolution({
      actionType:
        ACTION_RESOLUTION_TYPES.SKILL_ROLL
    }),
    false
  );
});


test("isSkillResolution reconnaît uniquement les jets de Compétence", () => {
  assert.equal(
    isSkillResolution({
      actionType:
        ACTION_RESOLUTION_TYPES.SKILL_ROLL
    }),
    true
  );

  assert.equal(
    isSkillResolution({
      actionType:
        ACTION_RESOLUTION_TYPES.ATTRIBUTE_ROLL
    }),
    false
  );
});


test("isAttackResolution reconnaît les attaques de mêlée et à distance", () => {
  assert.equal(
    isAttackResolution({
      actionType:
        ACTION_RESOLUTION_TYPES.MELEE_ATTACK
    }),
    true
  );

  assert.equal(
    isAttackResolution({
      actionType:
        ACTION_RESOLUTION_TYPES.RANGED_ATTACK
    }),
    true
  );
});


test("un blocage de mêlée n'est pas considéré comme une attaque", () => {
  assert.equal(
    isAttackResolution({
      actionType:
        ACTION_RESOLUTION_TYPES.MELEE_BLOCK
    }),
    false
  );
});


test("isMeleeResolution reconnaît attaque de mêlée et blocage", () => {
  assert.equal(
    isMeleeResolution({
      actionType:
        ACTION_RESOLUTION_TYPES.MELEE_ATTACK
    }),
    true
  );

  assert.equal(
    isMeleeResolution({
      actionType:
        ACTION_RESOLUTION_TYPES.MELEE_BLOCK
    }),
    true
  );

  assert.equal(
    isMeleeResolution({
      actionType:
        ACTION_RESOLUTION_TYPES.RANGED_ATTACK
    }),
    false
  );
});


test("isRangedResolution reconnaît uniquement l'attaque à distance", () => {
  assert.equal(
    isRangedResolution({
      actionType:
        ACTION_RESOLUTION_TYPES.RANGED_ATTACK
    }),
    true
  );

  assert.equal(
    isRangedResolution({
      actionType:
        ACTION_RESOLUTION_TYPES.MELEE_ATTACK
    }),
    false
  );
});


test("les helpers de classification tolèrent un contexte absent", () => {
  assert.equal(
    isAttributeResolution(null),
    false
  );

  assert.equal(
    isSkillResolution(undefined),
    false
  );

  assert.equal(
    isAttackResolution(null),
    false
  );

  assert.equal(
    isMeleeResolution(undefined),
    false
  );

  assert.equal(
    isRangedResolution(null),
    false
  );
});


/* ============================================================
 * LECTURE DES FAITS
 * ============================================================ */

test("getActionContextFact retourne la valeur exacte d'un fait connu", () => {
  const context = {
    facts: {
      visible: true,
      concealed: false,
      distance: 2,
      note: null
    }
  };

  assert.equal(
    getActionContextFact(
      context,
      "visible"
    ),
    true
  );

  assert.equal(
    getActionContextFact(
      context,
      "concealed"
    ),
    false
  );

  assert.equal(
    getActionContextFact(
      context,
      "distance"
    ),
    2
  );

  assert.equal(
    getActionContextFact(
      context,
      "note"
    ),
    null
  );
});


test("getActionContextFact retourne undefined pour un fait inconnu", () => {
  assert.equal(
    getActionContextFact(
      {
        facts: {}
      },
      "unknown"
    ),
    undefined
  );
});


test("getActionContextFact exige actuellement un factId de type string", () => {
  const context = {
    facts: {
      "1": true
    }
  };

  assert.equal(
    getActionContextFact(
      context,
      1
    ),
    undefined
  );

  assert.equal(
    getActionContextFact(
      context,
      null
    ),
    undefined
  );
});


test("getActionContextFact retourne undefined si le contexte ne possède pas facts", () => {
  assert.equal(
    getActionContextFact(
      {},
      "night"
    ),
    undefined
  );

  assert.equal(
    getActionContextFact(
      null,
      "night"
    ),
    undefined
  );
});


/* ============================================================
 * PRÉSENCE DES FAITS
 * ============================================================ */

test("hasActionContextFact distingue un fait false d'un fait absent", () => {
  const context = {
    facts: {
      night: false
    }
  };

  assert.equal(
    hasActionContextFact(
      context,
      "night"
    ),
    true
  );

  assert.equal(
    hasActionContextFact(
      context,
      "cover"
    ),
    false
  );
});


test("hasActionContextFact reconnaît aussi une propriété dont la valeur est undefined", () => {
  const context = {
    facts: {
      knownButUndefined:
        undefined
    }
  };

  assert.equal(
    hasActionContextFact(
      context,
      "knownButUndefined"
    ),
    true
  );
});


test("hasActionContextFact ignore les propriétés héritées", () => {
  const prototype = {
    inheritedFact: true
  };

  const facts =
    Object.create(
      prototype
    );

  facts.ownFact =
    true;

  const context = {
    facts
  };

  assert.equal(
    hasActionContextFact(
      context,
      "ownFact"
    ),
    true
  );

  assert.equal(
    hasActionContextFact(
      context,
      "inheritedFact"
    ),
    false
  );
});


test("hasActionContextFact retourne false pour un fait propre absent", () => {
  assert.equal(
    hasActionContextFact(
      {
        facts: {}
      },
      "night"
    ),
    false
  );
});


test("hasActionContextFact retourne une valeur falsy si facts est absent", () => {
  assert.equal(
    Boolean(
      hasActionContextFact(
        {},
        "night"
      )
    ),
    false
  );

  assert.equal(
    Boolean(
      hasActionContextFact(
        null,
        "night"
      )
    ),
    false
  );
});


/* ============================================================
 * FAIT EXPLICITEMENT VRAI
 * ============================================================ */

test("isActionContextFactTrue vaut true uniquement pour la valeur booléenne true", () => {
  const context = {
    facts: {
      trueBoolean: true,
      falseBoolean: false,
      numericTruth: 1,
      stringTruth: "true"
    }
  };

  assert.equal(
    isActionContextFactTrue(
      context,
      "trueBoolean"
    ),
    true
  );

  assert.equal(
    isActionContextFactTrue(
      context,
      "falseBoolean"
    ),
    false
  );

  assert.equal(
    isActionContextFactTrue(
      context,
      "numericTruth"
    ),
    false
  );

  assert.equal(
    isActionContextFactTrue(
      context,
      "stringTruth"
    ),
    false
  );
});


test("isActionContextFactTrue vaut false pour un fait inconnu", () => {
  assert.equal(
    isActionContextFactTrue(
      {
        facts: {}
      },
      "unknown"
    ),
    false
  );
});


/* ============================================================
 * IMMUTABILITÉ / STRUCTURE
 * ============================================================ */

test("createActionResolutionContext retourne un nouvel objet à chaque appel", () => {
  const first =
    createActionResolutionContext({
      actionType:
        ACTION_RESOLUTION_TYPES.ATTRIBUTE_ROLL
    });

  const second =
    createActionResolutionContext({
      actionType:
        ACTION_RESOLUTION_TYPES.ATTRIBUTE_ROLL
    });

  assert.notEqual(
    first,
    second
  );
});


test("les contextes créés ne sont actuellement pas gelés", () => {
  const context =
    createActionResolutionContext({
      actionType:
        ACTION_RESOLUTION_TYPES.ATTRIBUTE_ROLL
    });

  assert.equal(
    Object.isFrozen(context),
    false
  );

  assert.equal(
    Object.isFrozen(context.facts),
    false
  );

  assert.equal(
    Object.isFrozen(context.metadata),
    false
  );
});