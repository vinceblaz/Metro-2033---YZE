import { test } from "node:test";
import assert from "node:assert/strict";

import {
    MeleeAttackOutcomeService
} from "../../src/combat/melee-attack-outcome-service.mjs";


/**
 * Ce fichier ne couvre PAS l'intégralité de
 * MeleeAttackOutcomeService (aucun test n'existait
 * avant ce chantier). Il verrouille le comportement
 * de base puis se concentre sur le nouveau paramètre
 * blockStuntResult introduit pour les éclats de
 * blocage (p.197).
 */


test(
    "resolve : sans blocage, toutes les réussites d'attaque restent disponibles",
    () => {

        const outcome =
            MeleeAttackOutcomeService.resolve({
                attackResult: {
                    successes: 3
                }
            });


        assert.equal(
            outcome.hit,
            true
        );

        assert.equal(
            outcome.cancelledSuccesses,
            0
        );

        assert.equal(
            outcome.effectiveSuccesses,
            3
        );

        assert.equal(
            outcome.extraSuccesses,
            2
        );

    }
);


test(
    "resolve : sans blockStuntResult, le blocage annule directement ses réussites brutes (comportement historique)",
    () => {

        const outcome =
            MeleeAttackOutcomeService.resolve({

                attackResult: {
                    successes: 3
                },

                blockResult: {
                    rolled: true,
                    roll: {
                        successes: 2
                    }
                }

            });


        assert.equal(
            outcome.blockSuccesses,
            2
        );

        assert.equal(
            outcome.cancelledSuccesses,
            2
        );

        assert.equal(
            outcome.effectiveSuccesses,
            1
        );

    }
);


test(
    "resolve : avec blockStuntResult, seule la répartition déclarée à l'aveugle annule des réussites",
    () => {

        const outcome =
            MeleeAttackOutcomeService.resolve({

                attackResult: {
                    successes: 3
                },

                blockResult: {
                    rolled: true,
                    roll: {
                        successes: 2
                    }
                },

                blockStuntResult: {

                    available: 2,
                    spent: 2,
                    remaining: 0,

                    effects: {

                        cancelledSuccesses:
                            1,

                        counterAttack:
                            true,

                        disarm:
                            false

                    }

                }

            });


        assert.equal(
            outcome.blockSuccesses,
            2
        );

        assert.equal(
            outcome.cancelledSuccesses,
            1
        );

        assert.equal(
            outcome.effectiveSuccesses,
            2
        );

    }
);


test(
    "resolve : avec blockStuntResult, une contre-attaque sans annulation ne réduit aucune réussite d'attaque",
    () => {

        const outcome =
            MeleeAttackOutcomeService.resolve({

                attackResult: {
                    successes: 2
                },

                blockResult: {
                    rolled: true,
                    roll: {
                        successes: 1
                    }
                },

                blockStuntResult: {

                    available: 1,
                    spent: 1,
                    remaining: 0,

                    effects: {

                        cancelledSuccesses:
                            0,

                        counterAttack:
                            true,

                        disarm:
                            false

                    }

                }

            });


        assert.equal(
            outcome.cancelledSuccesses,
            0
        );

        assert.equal(
            outcome.effectiveSuccesses,
            2
        );

        assert.equal(
            outcome.hit,
            true
        );

    }
);
