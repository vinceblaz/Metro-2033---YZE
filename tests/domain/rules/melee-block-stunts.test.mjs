import { test } from "node:test";
import assert from "node:assert/strict";

import {
    MELEE_BLOCK_STUNT_KEYS,
    resolveMeleeBlockStunts
} from "../../../src/domain/rules/melee-block-stunts.mjs";


test(
    "resolveMeleeBlockStunts : sans allocation, aucune réussite de blocage n'est dépensée",
    () => {

        const result =
            resolveMeleeBlockStunts({
                blockSuccesses: 3
            });


        assert.equal(
            result.available,
            3
        );

        assert.equal(
            result.spent,
            0
        );

        assert.equal(
            result.remaining,
            3
        );

        assert.equal(
            result.effects.cancelledSuccesses,
            0
        );

        assert.equal(
            result.effects.counterAttack,
            false
        );

        assert.equal(
            result.effects.disarm,
            false
        );

    }
);


test(
    "resolveMeleeBlockStunts : annuler une réussite est répétable",
    () => {

        const result =
            resolveMeleeBlockStunts({

                blockSuccesses:
                    3,

                allocation: [

                    {
                        key:
                            MELEE_BLOCK_STUNT_KEYS
                                .CANCEL_SUCCESS,

                        quantity:
                            3
                    }

                ]

            });


        assert.equal(
            result.spent,
            3
        );

        assert.equal(
            result.remaining,
            0
        );

        assert.equal(
            result.effects.cancelledSuccesses,
            3
        );

    }
);


test(
    "resolveMeleeBlockStunts : contre-attaque et désarmement sont combinables mais non répétables",
    () => {

        const result =
            resolveMeleeBlockStunts({

                blockSuccesses:
                    2,

                allocation: [

                    {
                        key:
                            MELEE_BLOCK_STUNT_KEYS
                                .COUNTER_ATTACK,

                        quantity:
                            1
                    },

                    {
                        key:
                            MELEE_BLOCK_STUNT_KEYS
                                .DISARM,

                        quantity:
                            1
                    }

                ]

            });


        assert.equal(
            result.spent,
            2
        );

        assert.equal(
            result.effects.counterAttack,
            true
        );

        assert.equal(
            result.effects.disarm,
            true
        );

        assert.equal(
            result.effects.cancelledSuccesses,
            0
        );

    }
);


test(
    "resolveMeleeBlockStunts : la contre-attaque ne peut pas être choisie plusieurs fois pour augmenter ses dégâts",
    () => {

        assert.throws(
            () =>
                resolveMeleeBlockStunts({

                    blockSuccesses:
                        3,

                    allocation: [

                        {
                            key:
                                MELEE_BLOCK_STUNT_KEYS
                                    .COUNTER_ATTACK,

                            quantity:
                                2
                        }

                    ]

                }),
            /qu'une seule fois/
        );

    }
);


test(
    "resolveMeleeBlockStunts : le désarmement ne peut pas être choisi plusieurs fois",
    () => {

        assert.throws(
            () =>
                resolveMeleeBlockStunts({

                    blockSuccesses:
                        3,

                    allocation: [

                        {
                            key:
                                MELEE_BLOCK_STUNT_KEYS
                                    .DISARM,

                            quantity:
                                2
                        }

                    ]

                }),
            /qu'une seule fois/
        );

    }
);


test(
    "resolveMeleeBlockStunts : refuse une allocation qui dépense plus de réussites que disponibles",
    () => {

        assert.throws(
            () =>
                resolveMeleeBlockStunts({

                    blockSuccesses:
                        1,

                    allocation: [

                        {
                            key:
                                MELEE_BLOCK_STUNT_KEYS
                                    .CANCEL_SUCCESS,

                            quantity:
                                1
                        },

                        {
                            key:
                                MELEE_BLOCK_STUNT_KEYS
                                    .DISARM,

                            quantity:
                                1
                        }

                    ]

                }),
            /Trop de réussites/
        );

    }
);


test(
    "resolveMeleeBlockStunts : refuse une clé d'action inconnue",
    () => {

        assert.throws(
            () =>
                resolveMeleeBlockStunts({

                    blockSuccesses:
                        1,

                    allocation: [

                        {
                            key:
                                "inconnue",

                            quantity:
                                1
                        }

                    ]

                }),
            /inconnue/
        );

    }
);


test(
    "resolveMeleeBlockStunts : refuse un nombre de réussites de blocage négatif",
    () => {

        assert.throws(
            () =>
                resolveMeleeBlockStunts({
                    blockSuccesses: -1
                }),
            TypeError
        );

    }
);
