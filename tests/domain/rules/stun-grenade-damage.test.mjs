import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveStunGrenadeDamage
} from "../../../src/domain/rules/stun-grenade-damage.mjs";


test("resolveStunGrenadeDamage exige un résultat de grenade étourdissante", () => {
  assert.throws(
    () => resolveStunGrenadeDamage(),
    TypeError
  );
});


test("resolveStunGrenadeDamage valide la Protection d'abri", () => {
  assert.throws(
    () => resolveStunGrenadeDamage({
      stunResult: {
        affected: true,
        rawSpiritDamage: 2
      },
      coverProtection: -1
    }),
    TypeError
  );

  assert.throws(
    () => resolveStunGrenadeDamage({
      stunResult: {
        affected: true,
        rawSpiritDamage: 2
      },
      coverProtection: 1.5
    }),
    TypeError
  );
});


test("resolveStunGrenadeDamage valide la Protection du casque", () => {
  assert.throws(
    () => resolveStunGrenadeDamage({
      stunResult: {
        affected: true,
        rawSpiritDamage: 2
      },
      helmetProtection: -1
    }),
    TypeError
  );

  assert.throws(
    () => resolveStunGrenadeDamage({
      stunResult: {
        affected: true,
        rawSpiritDamage: 2
      },
      helmetProtection: 1.5
    }),
    TypeError
  );
});


test("une cible hors zone d'effet ne subit aucun dégât", () => {
  assert.deepEqual(
    resolveStunGrenadeDamage({
      stunResult: {
        affected: false,
        rawSpiritDamage: 4
      },
      coverProtection: 6,
      helmetProtection: 3
    }),
    {
      affected: false,
      rawSpiritDamage: 0,
      coverProtection: 0,
      helmetProtection: 0,
      totalProtection: 0,
      preventedDamage: 0,
      remainingSpiritDamage: 0,
      stunned: false
    }
  );
});


test("une cible affectée conserve les dégâts bruts d'Esprit", () => {
  const result =
    resolveStunGrenadeDamage({
      stunResult: {
        affected: true,
        rawSpiritDamage: 4
      }
    });

  assert.equal(
    result.rawSpiritDamage,
    4
  );
});


test("rawSpiritDamage vaut zéro s'il est absent", () => {
  const result =
    resolveStunGrenadeDamage({
      stunResult: {
        affected: true
      }
    });

  assert.equal(
    result.rawSpiritDamage,
    0
  );
});


test("la Protection d'abri est divisée par deux et arrondie au supérieur", () => {
  assert.equal(
    resolveStunGrenadeDamage({
      stunResult: {
        affected: true,
        rawSpiritDamage: 2
      },
      coverProtection: 1
    }).coverProtection,
    1
  );

  assert.equal(
    resolveStunGrenadeDamage({
      stunResult: {
        affected: true,
        rawSpiritDamage: 2
      },
      coverProtection: 2
    }).coverProtection,
    1
  );

  assert.equal(
    resolveStunGrenadeDamage({
      stunResult: {
        affected: true,
        rawSpiritDamage: 2
      },
      coverProtection: 3
    }).coverProtection,
    2
  );

  assert.equal(
    resolveStunGrenadeDamage({
      stunResult: {
        affected: true,
        rawSpiritDamage: 2
      },
      coverProtection: 5
    }).coverProtection,
    3
  );
});


test("la Protection du casque est conservée intégralement", () => {
  const result =
    resolveStunGrenadeDamage({
      stunResult: {
        affected: true,
        rawSpiritDamage: 3
      },
      helmetProtection: 4
    });

  assert.equal(
    result.helmetProtection,
    4
  );
});


test("la Protection totale additionne l'abri effectif et le casque", () => {
  const result =
    resolveStunGrenadeDamage({
      stunResult: {
        affected: true,
        rawSpiritDamage: 3
      },
      coverProtection: 5,
      helmetProtection: 2
    });

  assert.equal(
    result.coverProtection,
    3
  );

  assert.equal(
    result.helmetProtection,
    2
  );

  assert.equal(
    result.totalProtection,
    5
  );
});


test("la Protection disponible n'est pas soustraite directement aux dégâts d'Esprit", () => {
  const result =
    resolveStunGrenadeDamage({
      stunResult: {
        affected: true,
        rawSpiritDamage: 4
      },
      coverProtection: 6,
      helmetProtection: 3
    });

  assert.equal(
    result.rawSpiritDamage,
    4
  );

  assert.equal(
    result.totalProtection,
    6
  );

  assert.equal(
    result.preventedDamage,
    null
  );

  assert.equal(
    result.remainingSpiritDamage,
    null
  );
});


test("l'état stunned reste indéterminé tant que la suite de la résolution n'a pas eu lieu", () => {
  const result =
    resolveStunGrenadeDamage({
      stunResult: {
        affected: true,
        rawSpiritDamage: 2
      }
    });

  assert.equal(
    result.stunned,
    null
  );
});


test("avec zéro Protection, une cible affectée reste en attente du jet de résolution", () => {
  assert.deepEqual(
    resolveStunGrenadeDamage({
      stunResult: {
        affected: true,
        rawSpiritDamage: 2
      },
      coverProtection: 0,
      helmetProtection: 0
    }),
    {
      affected: true,
      rawSpiritDamage: 2,
      coverProtection: 0,
      helmetProtection: 0,
      totalProtection: 0,
      preventedDamage: null,
      remainingSpiritDamage: null,
      stunned: null
    }
  );
});