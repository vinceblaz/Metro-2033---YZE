import test from "node:test";

import assert from "node:assert/strict";

import {
    createRangedAttackProtectionRequest,
    resolveRangedAttackProtection
} from "../../../src/domain/rules/ranged-attack-protection.mjs";

test(
    "createRangedAttackProtectionRequest crée la demande de Protection requise par les conséquences",
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


        const result =
            createRangedAttackProtectionRequest(
                consequenceResult
            );


        assert.deepEqual(
            result,
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
    "createRangedAttackProtectionRequest conserve explicitement l'absence de Protection requise",
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


        const result =
            createRangedAttackProtectionRequest(
                consequenceResult
            );


        assert.deepEqual(
            result,
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

    }
);

test(
    "createRangedAttackProtectionRequest refuse des conséquences sans contrat de Protection",
    () => {

        const consequenceResult = {

            hit:
                true

        };


        assert.throws(
            () => {

                createRangedAttackProtectionRequest(
                    consequenceResult
                );

            },
            /protection/i
        );

    }
);

test(
    "createRangedAttackProtectionRequest refuse une Protection requise sans dégâts entrants positifs",
    () => {

        const consequenceResult = {

            hit:
                true,

            protection: {

                required:
                    true,

                incomingDamage:
                    0,

                protectionReduction:
                    1,

                ignoresResilience:
                    false

            }

        };


        assert.throws(
            () => {

                createRangedAttackProtectionRequest(
                    consequenceResult
                );

            },
            /dégâts entrants/i
        );

    }
);

test(
    "resolveRangedAttackProtection refuse une résolution sans demande de Protection",
    () => {

        assert.throws(
            () => {

                resolveRangedAttackProtection({
                    request:
                        null,

                    source: {
                        type:
                            "worn",

                        value:
                            2,

                        resilience:
                            false,

                        degradable:
                            true
                    }
                });

            },
            /demande de Protection/i
        );

    }
);

test(
    "resolveRangedAttackProtection refuse une Protection requise sans source",
    () => {

        const request = {
            required:
                true,

            incomingDamage:
                3,

            protectionReduction:
                1,

            ignoresResilience:
                false
        };


        assert.throws(
            () => {

                resolveRangedAttackProtection({
                    request,
                    source:
                        null
                });

            },
            /source de Protection/i
        );

    }
);

test(
    "resolveRangedAttackProtection produit un résultat neutre lorsqu'aucune Protection n'est requise",
    () => {

        const request = {
            required:
                false,

            incomingDamage:
                0,

            protectionReduction:
                1,

            ignoresResilience:
                true
        };


        const result =
            resolveRangedAttackProtection({
                request,
                source:
                    null
            });


        assert.deepEqual(
            result,
            {
                required:
                    false,

                source:
                    null,

                dice:
                    [],

                successes:
                    0,

                ones:
                    0,

                incomingDamage:
                    0,

                baseProtection:
                    0,

                protectionReduction:
                    0,

                effectiveProtection:
                    0,

                protectionDamage:
                    0,

                resilienceIgnored:
                    false,

                resiliencePrevented:
                    0,

                rawPrevented:
                    0,

                totalPrevented:
                    0,

                remainingDamage:
                    0,

                canPush:
                    false
            }
        );

    }
);

test(
    "resolveRangedAttackProtection résout une Protection requise à partir de sa source",
    () => {

        const request = {
            required:
                true,

            incomingDamage:
                3,

            protectionReduction:
                1,

            ignoresResilience:
                true
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


        const result =
            resolveRangedAttackProtection({
                request,
                source
            });


        assert.deepEqual(
            result,
            {
                required:
                    true,

                source: {
                    ...source
                },

                dice:
                    [],

                successes:
                    0,

                ones:
                    0,

                incomingDamage:
                    3,

                baseProtection:
                    0,

                protectionReduction:
                    1,

                effectiveProtection:
                    0,

                protectionDamage:
                    0,

                resilienceIgnored:
                    true,

                resiliencePrevented:
                    0,

                rawPrevented:
                    0,

                totalPrevented:
                    0,

                remainingDamage:
                    3,

                canPush:
                    false
            }
        );

    }
);

test(
    "resolveRangedAttackProtection n'applique pas la réduction de Protection à une Protection naturelle",
    () => {

        const request = {
            required:
                true,

            incomingDamage:
                3,

            protectionReduction:
                2,

            ignoresResilience:
                true
        };


        const source = {
            type:
                "natural",

            value:
                0,

            resilience:
                true,

            resilienceCondition:
                "",

            degradable:
                false,

            coverage:
                "all",

            bodyArmor:
                null,

            helmet:
                null
        };


        const result =
            resolveRangedAttackProtection({
                request,
                source
            });


        assert.equal(
            result.protectionReduction,
            0
        );

        assert.equal(
            result.resilienceIgnored,
            false
        );

        assert.equal(
            result.remainingDamage,
            3
        );

    }
);