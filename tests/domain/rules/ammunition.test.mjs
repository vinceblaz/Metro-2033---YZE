import test from "node:test";
import assert from "node:assert/strict";

import {
  isAmmunitionCompatible,
  isAmmunitionAvailable,
  isAmmunitionAvailableForWeapon
} from "../../../src/domain/rules/ammunition.mjs";


/* ============================================================
 * HELPERS
 * ============================================================ */


function createWeapon({
  type = "weapon",
  usesAmmunition = true,
  ammunitionType = "9mm",
  allowsMilitaryAmmunition = false
} = {}) {

  return {
    type,

    system: {
      usesAmmunition,
      ammunitionType,
      allowsMilitaryAmmunition
    }
  };

}


function createAmmunition({
  type = "ammunition",
  ammoType = "9mm",
  quality = "standard",
  quantity = 1
} = {}) {

  return {
    type,

    system: {
      ammoType,
      quality,
      quantity
    }
  };

}


/* ============================================================
 * COMPATIBILITÉ — ARGUMENTS
 * ============================================================ */


test("une arme absente n'est jamais compatible avec une munition", () => {
  assert.equal(
    isAmmunitionCompatible(
      null,
      createAmmunition()
    ),
    false
  );
});


test("une munition absente n'est jamais compatible avec une arme", () => {
  assert.equal(
    isAmmunitionCompatible(
      createWeapon(),
      null
    ),
    false
  );
});


test("un document qui n'est pas de type weapon est refusé", () => {
  assert.equal(
    isAmmunitionCompatible(
      createWeapon({
        type: "equipment"
      }),
      createAmmunition()
    ),
    false
  );
});


test("un document qui n'est pas de type ammunition est refusé", () => {
  assert.equal(
    isAmmunitionCompatible(
      createWeapon(),
      createAmmunition({
        type: "equipment"
      })
    ),
    false
  );
});


/* ============================================================
 * COMPATIBILITÉ — UTILISATION DE MUNITIONS
 * ============================================================ */


test("une arme qui n'utilise pas de munitions est refusée", () => {
  assert.equal(
    isAmmunitionCompatible(
      createWeapon({
        usesAmmunition: false
      }),
      createAmmunition()
    ),
    false
  );
});


test("usesAmmunition utilise actuellement la vérité JavaScript", () => {
  const weapon =
    createWeapon({
      usesAmmunition: "false"
    });

  assert.equal(
    isAmmunitionCompatible(
      weapon,
      createAmmunition()
    ),
    true
  );
});


test("une arme sans objet system est refusée", () => {
  assert.equal(
    isAmmunitionCompatible(
      {
        type: "weapon"
      },
      createAmmunition()
    ),
    false
  );
});


/* ============================================================
 * COMPATIBILITÉ — TYPE DE MUNITION
 * ============================================================ */


test("une arme sans ammunitionType est refusée", () => {
  assert.equal(
    isAmmunitionCompatible(
      createWeapon({
        ammunitionType: ""
      }),
      createAmmunition()
    ),
    false
  );
});


test("une munition sans ammoType est refusée", () => {
  assert.equal(
    isAmmunitionCompatible(
      createWeapon(),
      createAmmunition({
        ammoType: ""
      })
    ),
    false
  );
});


test("des types de munition différents sont incompatibles", () => {
  assert.equal(
    isAmmunitionCompatible(
      createWeapon({
        ammunitionType: "9mm"
      }),
      createAmmunition({
        ammoType: "5.45x39"
      })
    ),
    false
  );
});


test("des types de munition identiques sont compatibles", () => {
  assert.equal(
    isAmmunitionCompatible(
      createWeapon({
        ammunitionType: "9mm"
      }),
      createAmmunition({
        ammoType: "9mm"
      })
    ),
    true
  );
});


test("la comparaison des types de munition est sensible à la casse", () => {
  assert.equal(
    isAmmunitionCompatible(
      createWeapon({
        ammunitionType: "9mm"
      }),
      createAmmunition({
        ammoType: "9MM"
      })
    ),
    false
  );
});


test("la comparaison des types de munition ne normalise pas les espaces", () => {
  assert.equal(
    isAmmunitionCompatible(
      createWeapon({
        ammunitionType: "9mm"
      }),
      createAmmunition({
        ammoType: " 9mm "
      })
    ),
    false
  );
});


test("la compatibilité ne dépend pas d'un identifiant Foundry", () => {
  const weapon =
    createWeapon();

  weapon.id =
    "weapon-1";

  const ammunition =
    createAmmunition();

  ammunition.id =
    "ammo-999";

  assert.equal(
    isAmmunitionCompatible(
      weapon,
      ammunition
    ),
    true
  );
});


/* ============================================================
 * COMPATIBILITÉ — QUALITÉ MILITAIRE
 * ============================================================ */


test("une munition standard compatible est autorisée sans permission militaire", () => {
  assert.equal(
    isAmmunitionCompatible(
      createWeapon({
        allowsMilitaryAmmunition: false
      }),
      createAmmunition({
        quality: "standard"
      })
    ),
    true
  );
});


test("une munition militaire est refusée si l'arme ne l'autorise pas", () => {
  assert.equal(
    isAmmunitionCompatible(
      createWeapon({
        allowsMilitaryAmmunition: false
      }),
      createAmmunition({
        quality: "military"
      })
    ),
    false
  );
});


test("une munition militaire est autorisée si l'arme l'autorise explicitement", () => {
  assert.equal(
    isAmmunitionCompatible(
      createWeapon({
        allowsMilitaryAmmunition: true
      }),
      createAmmunition({
        quality: "military"
      })
    ),
    true
  );
});


test("allowsMilitaryAmmunition utilise actuellement la vérité JavaScript", () => {
  assert.equal(
    isAmmunitionCompatible(
      createWeapon({
        allowsMilitaryAmmunition: "yes"
      }),
      createAmmunition({
        quality: "military"
      })
    ),
    true
  );
});


test("la qualité absente est actuellement traitée comme standard", () => {
  const ammunition = {
    type: "ammunition",

    system: {
      ammoType: "9mm",
      quantity: 1
    }
  };

  assert.equal(
    isAmmunitionCompatible(
      createWeapon(),
      ammunition
    ),
    true
  );
});


test("seule la valeur exacte military déclenche la restriction militaire", () => {
  assert.equal(
    isAmmunitionCompatible(
      createWeapon({
        allowsMilitaryAmmunition: false
      }),
      createAmmunition({
        quality: "Military"
      })
    ),
    true
  );
});


/* ============================================================
 * DISPONIBILITÉ — ARGUMENT
 * ============================================================ */


test("une munition absente n'est pas disponible", () => {
  assert.equal(
    isAmmunitionAvailable(
      null
    ),
    false
  );
});


test("un document qui n'est pas de type ammunition n'est pas disponible", () => {
  assert.equal(
    isAmmunitionAvailable(
      createAmmunition({
        type: "equipment"
      })
    ),
    false
  );
});


test("une munition sans system n'est pas disponible", () => {
  assert.equal(
    isAmmunitionAvailable({
      type: "ammunition"
    }),
    false
  );
});


/* ============================================================
 * DISPONIBILITÉ — QUANTITÉ
 * ============================================================ */


test("une quantité positive rend la munition disponible", () => {
  assert.equal(
    isAmmunitionAvailable(
      createAmmunition({
        quantity: 1
      })
    ),
    true
  );
});


test("une quantité supérieure à un reste disponible", () => {
  assert.equal(
    isAmmunitionAvailable(
      createAmmunition({
        quantity: 10
      })
    ),
    true
  );
});


test("une quantité égale à zéro rend la munition indisponible", () => {
  assert.equal(
    isAmmunitionAvailable(
      createAmmunition({
        quantity: 0
      })
    ),
    false
  );
});


test("une quantité négative rend la munition indisponible", () => {
  assert.equal(
    isAmmunitionAvailable(
      createAmmunition({
        quantity: -1
      })
    ),
    false
  );
});


test("une quantité décimale rend la munition indisponible", () => {
  assert.equal(
    isAmmunitionAvailable(
      createAmmunition({
        quantity: 1.5
      })
    ),
    false
  );
});


test("une quantité numérique sous forme de chaîne rend la munition indisponible", () => {
  assert.equal(
    isAmmunitionAvailable(
      createAmmunition({
        quantity: "3"
      })
    ),
    false
  );
});


test("une quantité booléenne rend la munition indisponible", () => {
  assert.equal(
    isAmmunitionAvailable(
      createAmmunition({
        quantity: true
      })
    ),
    false
  );
});


test("une quantité absente est actuellement traitée comme zéro", () => {
  const ammunition = {
    type: "ammunition",

    system: {
      ammoType: "9mm"
    }
  };

  assert.equal(
    isAmmunitionAvailable(
      ammunition
    ),
    false
  );
});


/* ============================================================
 * DISPONIBILITÉ POUR UNE ARME
 * ============================================================ */


test("une munition compatible et disponible peut être proposée à l'arme", () => {
  assert.equal(
    isAmmunitionAvailableForWeapon(
      createWeapon(),
      createAmmunition({
        quantity: 3
      })
    ),
    true
  );
});


test("une munition compatible mais épuisée ne peut pas être proposée", () => {
  assert.equal(
    isAmmunitionAvailableForWeapon(
      createWeapon(),
      createAmmunition({
        quantity: 0
      })
    ),
    false
  );
});


test("une munition disponible mais incompatible ne peut pas être proposée", () => {
  assert.equal(
    isAmmunitionAvailableForWeapon(
      createWeapon({
        ammunitionType: "9mm"
      }),
      createAmmunition({
        ammoType: "5.45x39",
        quantity: 10
      })
    ),
    false
  );
});


test("une munition militaire disponible reste refusée si l'arme ne l'autorise pas", () => {
  assert.equal(
    isAmmunitionAvailableForWeapon(
      createWeapon({
        allowsMilitaryAmmunition: false
      }),
      createAmmunition({
        quality: "military",
        quantity: 5
      })
    ),
    false
  );
});


test("une munition militaire compatible et disponible est proposée si l'arme l'autorise", () => {
  assert.equal(
    isAmmunitionAvailableForWeapon(
      createWeapon({
        allowsMilitaryAmmunition: true
      }),
      createAmmunition({
        quality: "military",
        quantity: 5
      })
    ),
    true
  );
});


test("isAmmunitionAvailableForWeapon retourne false si l'arme est absente", () => {
  assert.equal(
    isAmmunitionAvailableForWeapon(
      null,
      createAmmunition()
    ),
    false
  );
});


test("isAmmunitionAvailableForWeapon retourne false si la munition est absente", () => {
  assert.equal(
    isAmmunitionAvailableForWeapon(
      createWeapon(),
      null
    ),
    false
  );
});