import test
    from "node:test";

import assert
    from "node:assert/strict";

import {
    resolveFinalizedRangedAttack
} from "../../../src/domain/rules/ranged-attack-resolution.mjs";


test(
    "resolveFinalizedRangedAttack refuse un résultat non finalisé",
    () => {

        const rollResult = {

            successes: 1,

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


        assert.throws(
            () => {

                resolveFinalizedRangedAttack({

                    rollResult,

                    finalized:
                        false

                });

            },
            /finalis/i
        );

    }
);

test(
    "resolveFinalizedRangedAttack résout les conséquences d'un résultat finalisé",
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
            resolveFinalizedRangedAttack({

                rollResult,

                finalized:
                    true,

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
            result.damage.bonusDamage,
            1
        );


        assert.equal(
            result.stunts.effects.vigorDamage,
            1
        );


        assert.equal(
            result.effects.spiritDamage,
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

    }
);

test(
    "resolveFinalizedRangedAttack refuse un résultat qui n'est pas une attaque à distance",
    () => {

        const rollResult = {

            successes:
                1,

            context: {

                action:
                    "skill-roll",

                skill:
                    "shooting"

            }

        };


        assert.throws(
            () => {

                resolveFinalizedRangedAttack({

                    rollResult,

                    finalized:
                        true

                });

            },
            /attaque à distance/i
        );

    }
);