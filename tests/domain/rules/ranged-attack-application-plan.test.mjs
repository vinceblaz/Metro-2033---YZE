import test from "node:test";
import assert from "node:assert/strict";

import {
    createRangedAttackApplicationPlan
} from "../../../src/domain/rules/ranged-attack-application-plan.mjs";


test(
    "createRangedAttackApplicationPlan prépare les dégâts de Vigueur restant après Protection",
    () => {

        const consequenceResult = {
            effects: {
                spiritDamage: 0,
                swapInitiative: false,
                disarm: false,
                knockdown: false,
                grenade: null
            }
        };

        const protectionResult = {
            remainingDamage: 2,
            protectionDamage: 0
        };


        const result =
            createRangedAttackApplicationPlan({
                consequenceResult,
                protectionResult
            });


        assert.deepEqual(
            result,
            {
                damage: {
                    vigor: 2
                }
            }
        );

    }
);

test(
    "createRangedAttackApplicationPlan prépare zéro dégât de Vigueur lorsque la Protection absorbe tous les dégâts",
    () => {

        const consequenceResult = {
            effects: {
                spiritDamage: 0,
                swapInitiative: false,
                disarm: false,
                knockdown: false,
                grenade: null
            }
        };

        const protectionResult = {
            remainingDamage: 0,
            protectionDamage: 0
        };


        const result =
            createRangedAttackApplicationPlan({
                consequenceResult,
                protectionResult
            });


        assert.deepEqual(
            result,
            {
                damage: {
                    vigor: 0
                }
            }
        );

    }
);

test(
    "createRangedAttackApplicationPlan prépare la dégradation de Protection",
    () => {

        const consequenceResult = {
            effects: {
                spiritDamage: 0,
                swapInitiative: false,
                disarm: false,
                knockdown: false,
                grenade: null
            }
        };

        const protectionResult = {
            remainingDamage: 1,
            protectionDamage: 2
        };


        const result =
            createRangedAttackApplicationPlan({
                consequenceResult,
                protectionResult
            });


        assert.deepEqual(
            result,
            {
                damage: {
                    vigor: 1
                },

                protection: {
                    damage: 2
                }
            }
        );

    }
);

test(
    "createRangedAttackApplicationPlan exige un résultat de conséquences",
    () => {

        assert.throws(
            () =>
                createRangedAttackApplicationPlan({
                    protectionResult: {
                        remainingDamage: 1,
                        protectionDamage: 0
                    }
                }),
            {
                name: "TypeError",
                message:
                    "Un résultat de conséquences d'attaque à distance est requis."
            }
        );

    }
);

test(
    "createRangedAttackApplicationPlan exige un résultat de Protection",
    () => {

        assert.throws(
            () =>
                createRangedAttackApplicationPlan({
                    consequenceResult: {
                        effects: {
                            spiritDamage: 0,
                            swapInitiative: false,
                            disarm: false,
                            knockdown: false,
                            grenade: null
                        }
                    }
                }),
            {
                name: "TypeError",
                message:
                    "Un résultat de Protection est requis."
            }
        );

    }
);

test(
    "createRangedAttackApplicationPlan exige des dégâts restants entiers positifs ou nuls",
    () => {

        const consequenceResult = {
            effects: {
                spiritDamage: 0,
                swapInitiative: false,
                disarm: false,
                knockdown: false,
                grenade: null
            }
        };

        const protectionResult = {
            remainingDamage: -1,
            protectionDamage: 0
        };


        assert.throws(
            () =>
                createRangedAttackApplicationPlan({
                    consequenceResult,
                    protectionResult
                }),
            {
                name: "TypeError",
                message:
                    "Les dégâts restants doivent être un entier positif ou nul."
            }
        );

    }
);

test(
    "createRangedAttackApplicationPlan exige des dégâts de Protection entiers positifs ou nuls",
    () => {

        const consequenceResult = {
            effects: {
                spiritDamage: 0,
                swapInitiative: false,
                disarm: false,
                knockdown: false,
                grenade: null
            }
        };

        const protectionResult = {
            remainingDamage: 1,
            protectionDamage: -1
        };


        assert.throws(
            () =>
                createRangedAttackApplicationPlan({
                    consequenceResult,
                    protectionResult
                }),
            {
                name: "TypeError",
                message:
                    "Les dégâts de Protection doivent être un entier positif ou nul."
            }
        );

    }
);

test(
    "createRangedAttackApplicationPlan prépare les dégâts d'Esprit",
    () => {

        const consequenceResult = {
            effects: {
                spiritDamage: 2,
                swapInitiative: false,
                disarm: false,
                knockdown: false,
                grenade: null
            }
        };

        const protectionResult = {
            remainingDamage: 1,
            protectionDamage: 0
        };


        const result =
            createRangedAttackApplicationPlan({
                consequenceResult,
                protectionResult
            });


        assert.deepEqual(
            result,
            {
                damage: {
                    vigor: 1,
                    spirit: 2
                }
            }
        );

    }
);

test(
    "createRangedAttackApplicationPlan exige des dégâts d'Esprit entiers positifs ou nuls",
    () => {

        const consequenceResult = {
            effects: {
                spiritDamage: -1,
                swapInitiative: false,
                disarm: false,
                knockdown: false,
                grenade: null
            }
        };

        const protectionResult = {
            remainingDamage: 1,
            protectionDamage: 0
        };


        assert.throws(
            () =>
                createRangedAttackApplicationPlan({
                    consequenceResult,
                    protectionResult
                }),
            {
                name: "TypeError",
                message:
                    "Les dégâts d'Esprit doivent être un entier positif ou nul."
            }
        );

    }
);

test(
    "createRangedAttackApplicationPlan prépare la mise au sol",
    () => {

        const consequenceResult = {
            effects: {
                spiritDamage: 0,
                swapInitiative: false,
                disarm: false,
                knockdown: true,
                grenade: null
            }
        };

        const protectionResult = {
            remainingDamage: 1,
            protectionDamage: 0
        };


        const result =
            createRangedAttackApplicationPlan({
                consequenceResult,
                protectionResult
            });


        assert.deepEqual(
            result,
            {
                damage: {
                    vigor: 1
                },

                effects: {
                    knockdown: true
                }
            }
        );

    }
);

test(
    "createRangedAttackApplicationPlan prépare le désarmement",
    () => {

        const consequenceResult = {
            effects: {
                spiritDamage: 0,
                swapInitiative: false,
                disarm: true,
                knockdown: false,
                grenade: null
            }
        };

        const protectionResult = {
            remainingDamage: 1,
            protectionDamage: 0
        };


        const result =
            createRangedAttackApplicationPlan({
                consequenceResult,
                protectionResult
            });


        assert.deepEqual(
            result,
            {
                damage: {
                    vigor: 1
                },

                effects: {
                    disarm: true
                }
            }
        );

    }
);

test(
    "createRangedAttackApplicationPlan cumule la mise au sol et le désarmement",
    () => {

        const consequenceResult = {
            effects: {
                spiritDamage: 0,
                swapInitiative: false,
                disarm: true,
                knockdown: true,
                grenade: null
            }
        };

        const protectionResult = {
            remainingDamage: 1,
            protectionDamage: 0
        };


        const result =
            createRangedAttackApplicationPlan({
                consequenceResult,
                protectionResult
            });


        assert.deepEqual(
            result,
            {
                damage: {
                    vigor: 1
                },

                effects: {
                    knockdown: true,
                    disarm: true
                }
            }
        );

    }
);

test(
    "createRangedAttackApplicationPlan prépare l'échange d'initiative",
    () => {

        const consequenceResult = {
            effects: {
                spiritDamage: 0,
                swapInitiative: true,
                disarm: false,
                knockdown: false,
                grenade: null
            }
        };

        const protectionResult = {
            remainingDamage: 1,
            protectionDamage: 0
        };


        const result =
            createRangedAttackApplicationPlan({
                consequenceResult,
                protectionResult
            });


        assert.deepEqual(
            result,
            {
                damage: {
                    vigor: 1
                },

                effects: {
                    swapInitiative: true
                }
            }
        );

    }
);

test(
    "createRangedAttackApplicationPlan prépare l'effet Grenade",
    () => {

        const consequenceResult = {
            effects: {
                spiritDamage: 0,
                swapInitiative: false,
                disarm: false,
                knockdown: false,
                grenade: true
            }
        };

        const protectionResult = {
            remainingDamage: 1,
            protectionDamage: 0
        };


        const result =
            createRangedAttackApplicationPlan({
                consequenceResult,
                protectionResult
            });


        assert.deepEqual(
            result,
            {
                damage: {
                    vigor: 1
                },

                effects: {
                    grenade: true
                }
            }
        );

    }
);

test(
    "createRangedAttackApplicationPlan compose toutes les conséquences applicables",
    () => {

        const consequenceResult = {
            effects: {
                spiritDamage: 2,
                swapInitiative: true,
                disarm: true,
                knockdown: true,
                grenade: true
            }
        };

        const protectionResult = {
            remainingDamage: 3,
            protectionDamage: 1
        };


        const result =
            createRangedAttackApplicationPlan({
                consequenceResult,
                protectionResult
            });


        assert.deepEqual(
            result,
            {
                damage: {
                    vigor: 3,
                    spirit: 2
                },

                protection: {
                    damage: 1
                },

                effects: {
                    knockdown: true,
                    disarm: true,
                    swapInitiative: true,
                    grenade: true
                }
            }
        );

    }
);

