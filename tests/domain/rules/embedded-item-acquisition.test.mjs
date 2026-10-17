import test from "node:test";
import assert from "node:assert/strict";

import {
  canAcquireTalent,
  canAcquireArchetype
} from "../../../src/domain/rules/embedded-item-acquisition.mjs";


/* ============================================================
 * TALENT — IDENTITÉ MÉTIER
 * ============================================================ */


test("un Talent sans key exploitable n'est pas bloqué par la règle d'acquisition", () => {
  assert.deepEqual(
    canAcquireTalent({
      talent: {}
    }),
    {
      allowed: true,
      reason: null
    }
  );
});


test("un Talent absent est traité comme un Talent sans key exploitable", () => {
  assert.deepEqual(
    canAcquireTalent(),
    {
      allowed: true,
      reason: null
    }
  );
});


test("une key vide après trim n'est pas bloquée", () => {
  assert.deepEqual(
    canAcquireTalent({
      talent: {
        key: "   "
      }
    }),
    {
      allowed: true,
      reason: null
    }
  );
});


test("la key du Talent entrant est normalisée avec String et trim", () => {
  const result =
    canAcquireTalent({
      talent: {
        key: "  favorite-weapon  ",
        maxLevel: 2
      },
      ownedTalents: []
    });

  assert.equal(
    result.key,
    "favorite-weapon"
  );
});


test("une key numérique est actuellement convertie en chaîne", () => {
  const result =
    canAcquireTalent({
      talent: {
        key: 42,
        maxLevel: 2
      },
      ownedTalents: []
    });

  assert.equal(
    result.key,
    "42"
  );

  assert.equal(
    result.allowed,
    true
  );
});


/* ============================================================
 * TALENT — MAX LEVEL
 * ============================================================ */


test("maxLevel vaut 1 par défaut", () => {
  const result =
    canAcquireTalent({
      talent: {
        key: "talent-a"
      },
      ownedTalents: []
    });

  assert.equal(
    result.maxLevel,
    1
  );

  assert.equal(
    result.nextLevel,
    1
  );
});


test("un maxLevel inférieur à 1 est ramené à 1", () => {
  const result =
    canAcquireTalent({
      talent: {
        key: "talent-a",
        maxLevel: -10
      },
      ownedTalents: []
    });

  assert.equal(
    result.maxLevel,
    1
  );
});


test("un maxLevel supérieur à 5 est ramené à 5", () => {
  const result =
    canAcquireTalent({
      talent: {
        key: "talent-a",
        maxLevel: 99
      },
      ownedTalents: []
    });

  assert.equal(
    result.maxLevel,
    5
  );
});


test("un maxLevel décimal est actuellement tronqué", () => {
  const result =
    canAcquireTalent({
      talent: {
        key: "talent-a",
        maxLevel: 3.9
      },
      ownedTalents: []
    });

  assert.equal(
    result.maxLevel,
    3
  );
});


test("un maxLevel numérique sous forme de chaîne est actuellement accepté", () => {
  const result =
    canAcquireTalent({
      talent: {
        key: "talent-a",
        maxLevel: "4"
      },
      ownedTalents: []
    });

  assert.equal(
    result.maxLevel,
    4
  );
});


test("un maxLevel non numérique est ramené à 1", () => {
  const result =
    canAcquireTalent({
      talent: {
        key: "talent-a",
        maxLevel: "abc"
      },
      ownedTalents: []
    });

  assert.equal(
    result.maxLevel,
    1
  );
});


test("Infinity comme maxLevel est ramené à 1", () => {
  const result =
    canAcquireTalent({
      talent: {
        key: "talent-a",
        maxLevel: Infinity
      },
      ownedTalents: []
    });

  assert.equal(
    result.maxLevel,
    1
  );
});


/* ============================================================
 * TALENT — NIVEAU ACTUEL
 * ============================================================ */


test("sans Talent possédé de même key, le niveau actuel vaut zéro", () => {
  const result =
    canAcquireTalent({
      talent: {
        key: "talent-a",
        maxLevel: 3
      },
      ownedTalents: []
    });

  assert.equal(
    result.currentLevel,
    0
  );

  assert.equal(
    result.nextLevel,
    1
  );
});


test("chaque Talent possédé avec la même key augmente le niveau actuel", () => {
  const result =
    canAcquireTalent({
      talent: {
        key: "talent-a",
        maxLevel: 4
      },
      ownedTalents: [
        {
          key: "talent-a"
        },
        {
          key: "talent-a"
        }
      ]
    });

  assert.equal(
    result.currentLevel,
    2
  );

  assert.equal(
    result.nextLevel,
    3
  );
});


test("les Talents avec une autre key ne comptent pas dans le niveau actuel", () => {
  const result =
    canAcquireTalent({
      talent: {
        key: "talent-a",
        maxLevel: 3
      },
      ownedTalents: [
        {
          key: "talent-b"
        },
        {
          key: "talent-c"
        }
      ]
    });

  assert.equal(
    result.currentLevel,
    0
  );
});


test("la key des Talents possédés est également normalisée avec trim", () => {
  const result =
    canAcquireTalent({
      talent: {
        key: "talent-a",
        maxLevel: 3
      },
      ownedTalents: [
        {
          key: "  talent-a "
        }
      ]
    });

  assert.equal(
    result.currentLevel,
    1
  );
});


test("la comparaison des keys reste sensible à la casse", () => {
  const result =
    canAcquireTalent({
      talent: {
        key: "talent-a",
        maxLevel: 3
      },
      ownedTalents: [
        {
          key: "Talent-A"
        }
      ]
    });

  assert.equal(
    result.currentLevel,
    0
  );
});


test("le nom et l'identifiant Foundry du Talent ne participent pas à la comparaison", () => {
  const result =
    canAcquireTalent({
      talent: {
        key: "talent-a",
        maxLevel: 3,
        name: "Talent entrant",
        id: "incoming-id"
      },
      ownedTalents: [
        {
          key: "talent-b",
          name: "Talent entrant",
          id: "incoming-id"
        }
      ]
    });

  assert.equal(
    result.currentLevel,
    0
  );

  assert.equal(
    result.allowed,
    true
  );
});


/* ============================================================
 * TALENT — ACQUISITION
 * ============================================================ */


test("une acquisition sous le niveau maximum est autorisée", () => {
  assert.deepEqual(
    canAcquireTalent({
      talent: {
        key: "talent-a",
        maxLevel: 3
      },
      ownedTalents: [
        {
          key: "talent-a"
        }
      ]
    }),
    {
      allowed: true,
      reason: null,
      key: "talent-a",
      currentLevel: 1,
      nextLevel: 2,
      maxLevel: 3
    }
  );
});


test("atteindre exactement le niveau maximum interdit une nouvelle acquisition", () => {
  assert.deepEqual(
    canAcquireTalent({
      talent: {
        key: "talent-a",
        maxLevel: 2
      },
      ownedTalents: [
        {
          key: "talent-a"
        },
        {
          key: "talent-a"
        }
      ]
    }),
    {
      allowed: false,
      reason: "talent-max-level-reached",
      key: "talent-a",
      currentLevel: 2,
      maxLevel: 2
    }
  );
});


test("un niveau actuel supérieur au maximum interdit également l'acquisition", () => {
  const result =
    canAcquireTalent({
      talent: {
        key: "talent-a",
        maxLevel: 2
      },
      ownedTalents: [
        {
          key: "talent-a"
        },
        {
          key: "talent-a"
        },
        {
          key: "talent-a"
        }
      ]
    });

  assert.equal(
    result.allowed,
    false
  );

  assert.equal(
    result.currentLevel,
    3
  );

  assert.equal(
    result.maxLevel,
    2
  );
});


test("un Talent de maxLevel 1 ne peut pas être acquis une deuxième fois", () => {
  const result =
    canAcquireTalent({
      talent: {
        key: "talent-a",
        maxLevel: 1
      },
      ownedTalents: [
        {
          key: "talent-a"
        }
      ]
    });

  assert.equal(
    result.allowed,
    false
  );

  assert.equal(
    result.reason,
    "talent-max-level-reached"
  );
});


test("canAcquireTalent ne modifie ni le Talent entrant ni les Talents possédés", () => {
  const talent = {
    key: " talent-a ",
    maxLevel: 2
  };

  const ownedTalents = [
    {
      key: "talent-a"
    }
  ];

  canAcquireTalent({
    talent,
    ownedTalents
  });

  assert.deepEqual(
    talent,
    {
      key: " talent-a ",
      maxLevel: 2
    }
  );

  assert.deepEqual(
    ownedTalents,
    [
      {
        key: "talent-a"
      }
    ]
  );
});


/* ============================================================
 * ARCHÉTYPE — APPEL HISTORIQUE
 * ============================================================ */


test("sans Archétype possédé, l'acquisition unitaire historique est autorisée", () => {
  assert.deepEqual(
    canAcquireArchetype(),
    {
      allowed: true,
      reason: null
    }
  );
});


test("avec un Archétype déjà possédé, l'acquisition unitaire historique est refusée", () => {
  assert.deepEqual(
    canAcquireArchetype({
      ownedArchetypes: [
        {
          key: "ranger"
        }
      ]
    }),
    {
      allowed: false,
      reason: "archetype-already-owned"
    }
  );
});


test("incomingArchetypes null utilise explicitement le comportement historique", () => {
  const result =
    canAcquireArchetype({
      ownedArchetypes: [],
      incomingArchetypes: null
    });

  assert.deepEqual(
    result,
    {
      allowed: true,
      reason: null
    }
  );
});


/* ============================================================
 * ARCHÉTYPE — ACQUISITION GROUPÉE
 * ============================================================ */


test("un seul Archétype entrant est autorisé si l'Actor n'en possède aucun", () => {
  assert.deepEqual(
    canAcquireArchetype({
      ownedArchetypes: [],
      incomingArchetypes: [
        {
          key: "ranger"
        }
      ]
    }),
    {
      allowed: true,
      reason: null
    }
  );
});


test("un Archétype entrant est refusé si l'Actor en possède déjà un", () => {
  assert.deepEqual(
    canAcquireArchetype({
      ownedArchetypes: [
        {
          key: "soldier"
        }
      ],
      incomingArchetypes: [
        {
          key: "ranger"
        }
      ]
    }),
    {
      allowed: false,
      reason: "archetype-already-owned"
    }
  );
});


test("plusieurs Archétypes entrants sont refusés", () => {
  assert.deepEqual(
    canAcquireArchetype({
      ownedArchetypes: [],
      incomingArchetypes: [
        {
          key: "ranger"
        },
        {
          key: "soldier"
        }
      ]
    }),
    {
      allowed: false,
      reason: "multiple-archetypes"
    }
  );
});


test("si un Archétype est déjà possédé, archetype-already-owned est prioritaire sur multiple-archetypes", () => {
  const result =
    canAcquireArchetype({
      ownedArchetypes: [
        {
          key: "existing"
        }
      ],
      incomingArchetypes: [
        {
          key: "incoming-a"
        },
        {
          key: "incoming-b"
        }
      ]
    });

  assert.equal(
    result.allowed,
    false
  );

  assert.equal(
    result.reason,
    "archetype-already-owned"
  );
});


test("aucun Archétype entrant reste autorisé même si l'Actor possède déjà un Archétype", () => {
  assert.deepEqual(
    canAcquireArchetype({
      ownedArchetypes: [
        {
          key: "existing"
        }
      ],
      incomingArchetypes: []
    }),
    {
      allowed: true,
      reason: null
    }
  );
});


test("les identités des Archétypes n'interviennent pas dans la règle d'unicité", () => {
  const result =
    canAcquireArchetype({
      ownedArchetypes: [
        {
          key: "archetype-a"
        }
      ],
      incomingArchetypes: [
        {
          key: "archetype-b"
        }
      ]
    });

  assert.equal(
    result.allowed,
    false
  );

  assert.equal(
    result.reason,
    "archetype-already-owned"
  );
});


test("canAcquireArchetype ne modifie pas les tableaux reçus", () => {
  const ownedArchetypes = [];

  const incomingArchetypes = [
    {
      key: "ranger"
    }
  ];

  canAcquireArchetype({
    ownedArchetypes,
    incomingArchetypes
  });

  assert.deepEqual(
    ownedArchetypes,
    []
  );

  assert.deepEqual(
    incomingArchetypes,
    [
      {
        key: "ranger"
      }
    ]
  );
});