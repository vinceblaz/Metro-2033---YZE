import { test } from "node:test";
import assert from "node:assert/strict";

import {
    MeleeAttackConsequenceService
} from "../../src/combat/melee-attack-consequence-service.mjs";


/**
 * Ce fichier ne couvrait PAS
 * MeleeAttackConsequenceService avant ce chantier.
 *
 * Le contrat d'entrée s'appuie sur la production
 * réelle de melee-attack-chat-hooks.mjs :
 *
 * - outcome
 *   vient de MeleeAttackOutcomeService.resolve()
 *   (attackSuccesses, blockSuccesses,
 *   cancelledSuccesses, netSuccesses,
 *   effectiveSuccesses, extraSuccesses, hit) ;
 *
 * - weaponDamage
 *   vient de weapon.system.damage ;
 *
 * - stuntConsequences
 *   vient de MeleeStuntResolutionService.resolve(),
 *   avec la forme :
 *
 *   {
 *     damage: { vigorBonus, agilityBonus },
 *     effects: {
 *       swapInitiative, disarm, knockdown, grapple
 *     }
 *   }
 */


function createHitOutcome(
    overrides = {}
) {

    return {

        hit:
            true,

        attackSuccesses:
            3,

        blockSuccesses:
            0,

        cancelledSuccesses:
            0,

        netSuccesses:
            3,

        effectiveSuccesses:
            3,

        extraSuccesses:
            2,

        ...overrides

    };

}


function createMissOutcome(
    overrides = {}
) {

    return {

        hit:
            false,

        attackSuccesses:
            1,

        blockSuccesses:
            1,

        cancelledSuccesses:
            1,

        netSuccesses:
            0,

        effectiveSuccesses:
            0,

        extraSuccesses:
            0,

        ...overrides

    };

}


/* ============================================================
 * VALIDATION DE outcome
 * ============================================================ */


test(
    "resolve : un résultat d'opposition est requis",
    () => {

        assert.throws(
            () => {

                MeleeAttackConsequenceService.resolve({

                    weaponDamage:
                        3

                });

            },
            /résultat d'opposition de mêlée est requis/
        );

    }
);


test(
    "resolve : un résultat d'opposition qui n'est pas un objet est rejeté",
    () => {

        assert.throws(
            () => {

                MeleeAttackConsequenceService.resolve({

                    outcome:
                        "pas-un-objet",

                    weaponDamage:
                        3

                });

            },
            /résultat d'opposition de mêlée est requis/
        );

    }
);


test(
    "resolve : outcome.hit doit être un booléen",
    () => {

        assert.throws(
            () => {

                MeleeAttackConsequenceService.resolve({

                    outcome: {

                        hit:
                            "oui"

                    },

                    weaponDamage:
                        3

                });

            },
            /outcome\.hit doit être un booléen/
        );

    }
);


/* ============================================================
 * VALIDATION DE weaponDamage ET DES BONUS D'ÉCLAT
 * ============================================================ */


test(
    "resolve : des dégâts d'arme négatifs sont rejetés",
    () => {

        assert.throws(
            () => {

                MeleeAttackConsequenceService.resolve({

                    outcome:
                        createHitOutcome(),

                    weaponDamage:
                        -1

                });

            },
            /dégâts de l'arme doit être un entier positif ou nul/
        );

    }
);


test(
    "resolve : des dégâts d'arme non entiers sont rejetés",
    () => {

        assert.throws(
            () => {

                MeleeAttackConsequenceService.resolve({

                    outcome:
                        createHitOutcome(),

                    weaponDamage:
                        1.5

                });

            },
            /dégâts de l'arme doit être un entier positif ou nul/
        );

    }
);


test(
    "resolve : un bonus de dégâts de Vigueur négatif est rejeté",
    () => {

        assert.throws(
            () => {

                MeleeAttackConsequenceService.resolve({

                    outcome:
                        createHitOutcome(),

                    weaponDamage:
                        3,

                    stuntConsequences: {

                        damage: {

                            vigorBonus:
                                -1

                        }

                    }

                });

            },
            /bonus de dégâts de Vigueur doit être un entier positif ou nul/
        );

    }
);


test(
    "resolve : un bonus de dégâts d'Agilité négatif est rejeté",
    () => {

        assert.throws(
            () => {

                MeleeAttackConsequenceService.resolve({

                    outcome:
                        createHitOutcome(),

                    weaponDamage:
                        3,

                    stuntConsequences: {

                        damage: {

                            agilityBonus:
                                -2

                        }

                    }

                });

            },
            /bonus de dégâts d'Agilité doit être un entier positif ou nul/
        );

    }
);


/* ============================================================
 * ATTAQUE RATÉE
 * ============================================================ */


test(
    "resolve : une attaque ratée ne produit aucun dégât ni effet, même avec des stuntConsequences fournis",
    () => {

        const result =
            MeleeAttackConsequenceService.resolve({

                outcome:
                    createMissOutcome(),

                weaponDamage:
                    5,

                stuntConsequences: {

                    damage: {

                        vigorBonus:
                            2,

                        agilityBonus:
                            1

                    },

                    effects: {

                        swapInitiative:
                            true,

                        disarm:
                            true,

                        knockdown:
                            true,

                        grapple:
                            true

                    }

                }

            });


        assert.equal(
            result.hit,
            false
        );

        assert.deepEqual(
            result.damage,
            {

                weapon:
                    0,

                vigor: {

                    base:
                        0,

                    stuntBonus:
                        0,

                    beforeProtection:
                        0

                },

                agility: {

                    stuntBonus:
                        0,

                    total:
                        0

                }

            }
        );

        assert.deepEqual(
            result.protection,
            {

                required:
                    false,

                incomingVigorDamage:
                    0

            }
        );

        assert.deepEqual(
            result.effects,
            {

                swapInitiative:
                    false,

                disarm:
                    false,

                knockdown:
                    false,

                grapple:
                    false

            }
        );

        assert.equal(
            result.outcome.extraSuccesses,
            0
        );

    }
);


test(
    "resolve : une attaque ratée conserve la traçabilité des réussites de l'opposition",
    () => {

        const result =
            MeleeAttackConsequenceService.resolve({

                outcome:
                    createMissOutcome({

                        attackSuccesses:
                            2,

                        blockSuccesses:
                            3,

                        cancelledSuccesses:
                            2,

                        netSuccesses:
                            0

                    }),

                weaponDamage:
                    4

            });


        assert.deepEqual(
            result.outcome,
            {

                attackSuccesses:
                    2,

                blockSuccesses:
                    3,

                cancelledSuccesses:
                    2,

                netSuccesses:
                    0,

                extraSuccesses:
                    0

            }
        );

    }
);


test(
    "resolve : une attaque ratée retombe sur effectiveSuccesses si netSuccesses est absent",
    () => {

        const result =
            MeleeAttackConsequenceService.resolve({

                outcome: {

                    hit:
                        false,

                    attackSuccesses:
                        1,

                    blockSuccesses:
                        1,

                    cancelledSuccesses:
                        1,

                    effectiveSuccesses:
                        0

                    /*
                     * netSuccesses volontairement absent.
                     */

                },

                weaponDamage:
                    2

            });


        assert.equal(
            result.outcome.netSuccesses,
            0
        );

    }
);


/* ============================================================
 * ATTAQUE RÉUSSIE — DÉGÂTS
 * ============================================================ */


test(
    "resolve : une attaque réussie sans éclat inflige uniquement les dégâts de l'arme",
    () => {

        const result =
            MeleeAttackConsequenceService.resolve({

                outcome:
                    createHitOutcome(),

                weaponDamage:
                    4

            });


        assert.equal(
            result.hit,
            true
        );

        assert.deepEqual(
            result.damage,
            {

                weapon:
                    4,

                vigor: {

                    base:
                        4,

                    stuntBonus:
                        0,

                    beforeProtection:
                        4

                },

                agility: {

                    stuntBonus:
                        0,

                    total:
                        0

                }

            }
        );

        assert.deepEqual(
            result.protection,
            {

                required:
                    true,

                incomingVigorDamage:
                    4

            }
        );

        assert.deepEqual(
            result.effects,
            {

                swapInitiative:
                    false,

                disarm:
                    false,

                knockdown:
                    false,

                grapple:
                    false

            }
        );

    }
);


test(
    "resolve : le bonus de dégâts de Vigueur d'un éclat s'ajoute aux dégâts de l'arme dans les dégâts de Vigueur",
    () => {

        const result =
            MeleeAttackConsequenceService.resolve({

                outcome:
                    createHitOutcome(),

                weaponDamage:
                    4,

                stuntConsequences: {

                    damage: {

                        vigorBonus:
                            1

                    }

                }

            });


        assert.deepEqual(
            result.damage.vigor,
            {

                base:
                    4,

                stuntBonus:
                    1,

                beforeProtection:
                    5

            }
        );

        assert.equal(
            result.protection.incomingVigorDamage,
            5
        );

        assert.equal(
            result.protection.required,
            true
        );

    }
);


test(
    "resolve : le bonus de dégâts d'Agilité d'un éclat reste séparé des dégâts de Vigueur",
    () => {

        const result =
            MeleeAttackConsequenceService.resolve({

                outcome:
                    createHitOutcome(),

                weaponDamage:
                    3,

                stuntConsequences: {

                    damage: {

                        agilityBonus:
                            2

                    }

                }

            });


        assert.deepEqual(
            result.damage.vigor,
            {

                base:
                    3,

                stuntBonus:
                    0,

                beforeProtection:
                    3

            }
        );

        assert.deepEqual(
            result.damage.agility,
            {

                stuntBonus:
                    2,

                total:
                    2

            }
        );

        /*
         * Les dégâts d'Agilité ne font jamais
         * partie des dégâts soumis à la Protection.
         */
        assert.equal(
            result.protection.incomingVigorDamage,
            3
        );

    }
);


test(
    "resolve : une arme sans dégâts (weaponDamage par défaut) ne requiert pas de Protection",
    () => {

        const result =
            MeleeAttackConsequenceService.resolve({

                outcome:
                    createHitOutcome()

                /*
                 * weaponDamage volontairement absent
                 * (défaut : 0).
                 */

            });


        assert.equal(
            result.damage.weapon,
            0
        );

        assert.deepEqual(
            result.protection,
            {

                required:
                    false,

                incomingVigorDamage:
                    0

            }
        );

    }
);


test(
    "resolve : stuntConsequences null (aucun éclat) ne change rien aux dégâts de base",
    () => {

        const result =
            MeleeAttackConsequenceService.resolve({

                outcome:
                    createHitOutcome(),

                weaponDamage:
                    2,

                stuntConsequences:
                    null

            });


        assert.deepEqual(
            result.damage.vigor,
            {

                base:
                    2,

                stuntBonus:
                    0,

                beforeProtection:
                    2

            }
        );

        assert.deepEqual(
            result.damage.agility,
            {

                stuntBonus:
                    0,

                total:
                    0

            }
        );

    }
);


/* ============================================================
 * ATTAQUE RÉUSSIE — EFFETS D'ÉCLAT
 * ============================================================ */


test(
    "resolve : les effets d'éclat sont reportés indépendamment de la Protection",
    () => {

        const result =
            MeleeAttackConsequenceService.resolve({

                outcome:
                    createHitOutcome(),

                weaponDamage:
                    4,

                stuntConsequences: {

                    effects: {

                        swapInitiative:
                            true,

                        disarm:
                            true,

                        knockdown:
                            false,

                        grapple:
                            true

                    }

                }

            });


        assert.deepEqual(
            result.effects,
            {

                swapInitiative:
                    true,

                disarm:
                    true,

                knockdown:
                    false,

                grapple:
                    true

            }
        );

    }
);


test(
    "resolve : des valeurs d'effet non booléennes sont normalisées à false",
    () => {

        const result =
            MeleeAttackConsequenceService.resolve({

                outcome:
                    createHitOutcome(),

                weaponDamage:
                    1,

                stuntConsequences: {

                    effects: {

                        swapInitiative:
                            "true",

                        disarm:
                            1,

                        knockdown:
                            undefined,

                        grapple:
                            null

                    }

                }

            });


        assert.deepEqual(
            result.effects,
            {

                swapInitiative:
                    false,

                disarm:
                    false,

                knockdown:
                    false,

                grapple:
                    false

            }
        );

    }
);


/* ============================================================
 * ATTAQUE RÉUSSIE — TRAÇABILITÉ DE L'OPPOSITION
 * ============================================================ */


test(
    "resolve : conserve toutes les réussites de l'opposition sur une attaque réussie",
    () => {

        const result =
            MeleeAttackConsequenceService.resolve({

                outcome:
                    createHitOutcome({

                        attackSuccesses:
                            5,

                        blockSuccesses:
                            2,

                        cancelledSuccesses:
                            1,

                        netSuccesses:
                            4,

                        effectiveSuccesses:
                            4,

                        extraSuccesses:
                            3

                    }),

                weaponDamage:
                    3

            });


        assert.deepEqual(
            result.outcome,
            {

                attackSuccesses:
                    5,

                blockSuccesses:
                    2,

                cancelledSuccesses:
                    1,

                netSuccesses:
                    4,

                extraSuccesses:
                    3

            }
        );

    }
);


test(
    "resolve : retombe sur effectiveSuccesses si netSuccesses est absent sur une attaque réussie",
    () => {

        const result =
            MeleeAttackConsequenceService.resolve({

                outcome: {

                    hit:
                        true,

                    attackSuccesses:
                        2,

                    blockSuccesses:
                        0,

                    cancelledSuccesses:
                        0,

                    effectiveSuccesses:
                        2,

                    extraSuccesses:
                        1

                    /*
                     * netSuccesses volontairement absent.
                     */

                },

                weaponDamage:
                    2

            });


        assert.equal(
            result.outcome.netSuccesses,
            2
        );

    }
);


test(
    "resolve : rejette des extraSuccesses invalides sur une attaque réussie",
    () => {

        assert.throws(
            () => {

                MeleeAttackConsequenceService.resolve({

                    outcome:
                        createHitOutcome({

                            extraSuccesses:
                                -1

                        }),

                    weaponDamage:
                        2

                });

            },
            /réussites supplémentaires doit être un entier positif ou nul/
        );

    }
);
