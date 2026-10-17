import test from "node:test";

import assert from "node:assert/strict";

import {
    RangedAttackResolutionService
} from "../../src/combat/ranged-attack-resolution-service.mjs";

globalThis.foundry = {

    utils: {

        deepClone(
            value
        ) {

            return structuredClone(
                value
            );

        }

    }

};


test(
    "RangedAttackResolutionService refuse un message absent",
    () => {

        assert.throws(
            () => {

                RangedAttackResolutionService.resolveMessage(
                    null
                );

            },
            /message/i
        );

    }
);

test(
    "RangedAttackResolutionService refuse un message non finalisé",
    () => {

        const message = {

            getFlag(
                systemId,
                flagName
            ) {

                assert.equal(
                    systemId,
                    "metro-2033-yze"
                );

                assert.equal(
                    flagName,
                    "yzeRoll"
                );

                return {

                    finalized:
                        false

                };

            }

        };


        assert.throws(
            () => {

                RangedAttackResolutionService.resolveMessage(
                    message
                );

            },
            /finalis/i
        );

    }
);

test(
    "RangedAttackResolutionService résout les conséquences d'un message finalisé",
    () => {

        const message = {

            getFlag() {

                return {

                    finalized:
                        true,

                    successes:
                        2,

                    pushCount:
                        0,

                    dice:
                        {},

                    history:
                        [],

                    context: {

                        action:
                            "ranged-attack",

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
                                    false

                            }

                        }

                    },

                    stressAfflictions:
                        0,

                    eliminatedStress:
                        0,

                    pool: {

                        attribute:
                            3,

                        skill:
                            2,

                        equipment:
                            1,

                        stress:
                            0,

                        bonus:
                            0,

                        penalty:
                            0

                    }

                };

            }

        };


        const result =
            RangedAttackResolutionService.resolveMessage(
                message,
                {
                    stuntAllocation: {

                        vigorDamage:
                            1

                    }

                }
            );


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
                    false
            }
        );

    }
);

test(
    "RangedAttackResolutionService refuse un message finalisé qui n'est pas une attaque à distance",
    () => {

        const message = {

            getFlag() {

                return {

                    finalized:
                        true,

                    successes:
                        1,

                    pushCount:
                        0,

                    dice:
                        {},

                    history:
                        [],

                    context: {

                        action:
                            "skill-roll",

                        skill:
                            "shooting"

                    },

                    stressAfflictions:
                        0,

                    eliminatedStress:
                        0,

                    pool: {

                        attribute:
                            3,

                        skill:
                            2,

                        equipment:
                            0,

                        stress:
                            0,

                        bonus:
                            0,

                        penalty:
                            0

                    }

                };

            }

        };


        assert.throws(
            () => {

                RangedAttackResolutionService.resolveMessage(
                    message
                );

            },
            /attaque à distance/i
        );

    }
);

test(
    "RangedAttackResolutionService refuse de résoudre une Protection requise sans cible",
    () => {

        const consequenceResult = {

            hit:
                true,

            protection: {

                required:
                    true,

                incomingDamage:
                    3,

                protectionReduction:
                    1,

                ignoresResilience:
                    false

            }

        };


        assert.throws(
            () => {

                RangedAttackResolutionService.resolveProtection({
                    consequenceResult,
                    target:
                        null
                });

            },
            /cible/i
        );

    }
);

test(
    "RangedAttackResolutionService ne consulte pas la cible lorsqu'aucune Protection n'est requise",
    () => {

        const consequenceResult = {

            hit:
                false,

            protection: {

                required:
                    false,

                incomingDamage:
                    0,

                protectionReduction:
                    1,

                ignoresResilience:
                    true

            }

        };


        let sourceRequested =
            false;


        const target = {

            getProtectionSource() {

                sourceRequested =
                    true;

                throw new Error(
                    "La source de Protection ne devait pas être consultée."
                );

            }

        };


        const result =
            RangedAttackResolutionService.resolveProtection({
                consequenceResult,
                target
            });


        assert.equal(
            sourceRequested,
            false
        );

        assert.equal(
            result.required,
            false
        );

        assert.equal(
            result.remainingDamage,
            0
        );

        assert.deepEqual(
            result.dice,
            []
        );

    }
);

test(
    "RangedAttackResolutionService utilise la source de Protection de la cible lorsqu'elle est requise",
    () => {

        const consequenceResult = {

            hit:
                true,

            protection: {

                required:
                    true,

                incomingDamage:
                    3,

                protectionReduction:
                    1,

                ignoresResilience:
                    true

            }

        };


        const source = {

            type:
                "worn",

            value:
                0,

            resilience:
                true,

            degradable:
                true,

            bodyArmor:
                null,

            helmet:
                null

        };


        let sourceRequested =
            0;


        const target = {

            getProtectionSource() {

                sourceRequested +=
                    1;

                return source;

            }

        };


        const result =
            RangedAttackResolutionService.resolveProtection({
                consequenceResult,
                target
            });


        assert.equal(
            sourceRequested,
            1
        );

        assert.equal(
            result.required,
            true
        );

        assert.deepEqual(
            result.source,
            source
        );

        assert.equal(
            result.incomingDamage,
            3
        );

        assert.equal(
            result.protectionReduction,
            1
        );

        assert.equal(
            result.resilienceIgnored,
            true
        );

        assert.equal(
            result.remainingDamage,
            3
        );

    }
);


