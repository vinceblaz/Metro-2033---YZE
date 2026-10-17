import test
    from "node:test";

import assert
    from "node:assert/strict";

import {
    resolveRangedAttackConsequences
} from "../../../src/domain/rules/ranged-attack-consequences.mjs";


test(
    "resolveRangedAttackConsequences produit un plan pur avant Protection",
    () => {

        const rollResult = {

            successes: 3,

            context: {

                attack: {

                    type:
                        "ranged",

                    weapon: {

                        damage:
                            2,

                        explosive:
                            false

                    },

                    ammunition: {

                        protectionReduction:
                            1,

                        ignoresResilience:
                            true

                    }

                }

            }

        };


        const result =
            resolveRangedAttackConsequences({

                rollResult,

                stuntAllocation: {

                    vigorDamage:
                        1,

                    spiritDamage:
                        1

                }

            });


        assert.equal(
            result.hit,
            true
        );


        assert.equal(
            result.damage.rawDamage,
            3
        );


        assert.equal(
            result.stunts.effects.vigorDamage,
            1
        );


        assert.equal(
            result.stunts.effects.spiritDamage,
            1
        );


        assert.deepEqual(
            result.protection,
            {
                required:
                    true,

                incomingDamage:
                    3,

                protectionReduction:
                    1,

                ignoresResilience:
                    true
            }
        );


        assert.equal(
            result.effects.spiritDamage,
            1
        );

    }
);

test(
    "resolveRangedAttackConsequences produit un plan neutre lorsque l'attaque rate",
    () => {

        const rollResult = {

            successes: 0,

            context: {

                attack: {

                    type:
                        "ranged",

                    weapon: {

                        damage:
                            2,

                        explosive:
                            false

                    },

                    ammunition: {

                        protectionReduction:
                            1,

                        ignoresResilience:
                            true

                    }

                }

            }

        };


        const result =
            resolveRangedAttackConsequences({
                rollResult
            });


        assert.equal(
            result.hit,
            false
        );


        assert.equal(
            result.damage.rawDamage,
            0
        );


        assert.equal(
            result.stunts.extraSuccesses,
            0
        );


        assert.equal(
            result.stunts.spent,
            0
        );


        assert.deepEqual(
            result.protection,
            {
                required:
                    false,

                incomingDamage:
                    0,

                protectionReduction:
                    1,

                ignoresResilience:
                    true
            }
        );


        assert.deepEqual(
            result.effects,
            {
                spiritDamage:
                    0,

                swapInitiative:
                    false,

                disarm:
                    false,

                knockdown:
                    false,

                grenade:
                    false
            }
        );

    }
);

test(
    "les réussites dépensées dans des éclats non physiques ne deviennent pas des dégâts de Vigueur",
    () => {

        const rollResult = {

            successes: 4,

            context: {

                attack: {

                    type:
                        "ranged",

                    weapon: {

                        damage:
                            2,

                        explosive:
                            false

                    },

                    ammunition: {

                        protectionReduction:
                            0,

                        ignoresResilience:
                            false

                    }

                }

            }

        };


        const result =
            resolveRangedAttackConsequences({

                rollResult,

                stuntAllocation: {

                    spiritDamage:
                        1,

                    swapInitiative:
                        true,

                    knockdown:
                        true

                }

            });


        // 4 réussites :
        // 1 pour toucher
        // 3 excédentaires entièrement dépensées
        // dans des effets non physiques.

        assert.equal(
            result.stunts.extraSuccesses,
            3
        );

        assert.equal(
            result.stunts.spent,
            3
        );

        assert.equal(
            result.stunts.remaining,
            0
        );


        // Aucun éclat n'a été dépensé
        // en dégâts supplémentaires de Vigueur.

        assert.equal(
            result.stunts.effects.vigorDamage,
            0
        );


        // Les dégâts physiques doivent donc rester
        // strictement égaux aux dégâts de base de l'arme.

        assert.equal(
            result.damage.baseDamage,
            2
        );

        assert.equal(
            result.damage.bonusDamage,
            0
        );

        assert.equal(
            result.damage.rawDamage,
            2
        );


        // La Protection ne doit recevoir que
        // ces 2 dégâts physiques.

        assert.equal(
            result.protection.required,
            true
        );

        assert.equal(
            result.protection.incomingDamage,
            2
        );


        // Les autres conséquences restent
        // dans leur canal propre.

        assert.equal(
            result.effects.spiritDamage,
            1
        );

        assert.equal(
            result.effects.swapInitiative,
            true
        );

        assert.equal(
            result.effects.disarm,
            false
        );

        assert.equal(
            result.effects.knockdown,
            true
        );

    }
);

test(
    "une attaque explosive conserve Grenade comme conséquence séparée des dégâts physiques",
    () => {

        const rollResult = {

            successes: 2,

            context: {

                attack: {

                    type:
                        "ranged",

                    weapon: {

                        damage:
                            3,

                        explosive:
                            true

                    },

                    ammunition: {

                        protectionReduction:
                            0,

                        ignoresResilience:
                            false

                    }

                }

            }

        };


        const result =
            resolveRangedAttackConsequences({

                rollResult,

                stuntAllocation: {

                    grenade:
                        true

                }

            });


        // Une réussite excédentaire disponible,
        // dépensée dans Grenade !

        assert.equal(
            result.stunts.extraSuccesses,
            1
        );

        assert.equal(
            result.stunts.spent,
            1
        );

        assert.equal(
            result.stunts.remaining,
            0
        );


        assert.equal(
            result.stunts.effects.grenade,
            true
        );


        // Grenade ! ne doit pas être reconvertie
        // implicitement en dégâts supplémentaires.

        assert.equal(
            result.damage.baseDamage,
            3
        );

        assert.equal(
            result.damage.bonusDamage,
            0
        );

        assert.equal(
            result.damage.rawDamage,
            3
        );


        assert.equal(
            result.protection.required,
            true
        );

        assert.equal(
            result.protection.incomingDamage,
            3
        );


        // L'effet reste explicitement disponible
        // pour la suite du pipeline.

        assert.equal(
            result.effects.grenade,
            true
        );


        assert.deepEqual(
            result.effects,
            {
                spiritDamage:
                    0,

                swapInitiative:
                    false,

                disarm:
                    false,

                knockdown:
                    false,

                grenade:
                    true
            }
        );

    }
);

