import test from "node:test";
import assert from "node:assert/strict";

import {
    createRangedAttackApplicationLedger,
    getRangedAttackBlockedOperations,
    resolveRangedAttackProtectionChoice,
    resolveRangedAttackDisarmChoice
} from "../../../src/domain/rules/ranged-attack-application-ledger.mjs";

test(
    "createRangedAttackApplicationLedger prépare les dégâts de Vigueur en attente",
    () => {

        const applicationPlan = {
            damage: {
                vigor: 2
            }
        };


        const result =
            createRangedAttackApplicationLedger({
                applicationPlan
            });


        assert.deepEqual(
            result,
            {
                operations: [
                    {
                        type:
                            "attribute-damage",

                        attribute:
                            "vigor",

                        amount:
                            2,

                        status:
                            "pending"
                    }
                ]
            }
        );

    }
);

test(
    "createRangedAttackApplicationLedger exige un plan d'application",
    () => {

        assert.throws(
            () =>
                createRangedAttackApplicationLedger(),
            {
                name:
                    "TypeError",

                message:
                    "Un plan d'application d'attaque à distance est requis."
            }
        );

    }
);

test(
    "createRangedAttackApplicationLedger ne prépare aucune opération pour zéro dégât de Vigueur",
    () => {

        const applicationPlan = {
            damage: {
                vigor: 0
            }
        };


        const result =
            createRangedAttackApplicationLedger({
                applicationPlan
            });


        assert.deepEqual(
            result,
            {
                operations: []
            }
        );

    }
);

test(
    "createRangedAttackApplicationLedger prépare les dégâts d'Esprit en attente",
    () => {

        const applicationPlan = {
            damage: {
                vigor: 0,
                spirit: 2
            }
        };

        const result =
            createRangedAttackApplicationLedger({
                applicationPlan
            });


        assert.deepEqual(
            result,
            {
                operations: [
                    {
                        type:
                            "attribute-damage",

                        attribute:
                            "spirit",

                        amount:
                            2,

                        status:
                            "pending"
                    }
                ]
            }
        );

    }
);

test(
    "createRangedAttackApplicationLedger cumule les dégâts de Vigueur et d'Esprit",
    () => {

        const applicationPlan = {
            damage: {
                vigor: 3,
                spirit: 2
            }
        };


        const result =
            createRangedAttackApplicationLedger({
                applicationPlan
            });


        assert.deepEqual(
            result,
            {
                operations: [
                    {
                        type:
                            "attribute-damage",

                        attribute:
                            "vigor",

                        amount:
                            3,

                        status:
                            "pending"
                    },

                    {
                        type:
                            "attribute-damage",

                        attribute:
                            "spirit",

                        amount:
                            2,

                        status:
                            "pending"
                    }
                ]
            }
        );

    }
);

test(
    "createRangedAttackApplicationLedger prépare la dégradation d'une armure corporelle seule",
    () => {

        const applicationPlan = {
            damage: {
                vigor: 1
            },

            protection: {
                damage: 2
            }
        };

        const protectionResult = {
            source: {
                type:
                    "worn",

                bodyArmor: {
                    itemId:
                        "armor-body"
                },

                helmet:
                    null
            }
        };


        const result =
            createRangedAttackApplicationLedger({
                applicationPlan,
                protectionResult
            });


        assert.deepEqual(
            result,
            {
                operations: [
                    {
                        type:
                            "attribute-damage",

                        attribute:
                            "vigor",

                        amount:
                            1,

                        status:
                            "pending"
                    },

                    {
                        type:
                            "protection-damage",

                        amount:
                            2,

                        target:
                            "body",

                        itemId:
                            "armor-body",

                        status:
                            "pending"
                    }
                ]
            }
        );

    }
);

test(
    "createRangedAttackApplicationLedger prépare la dégradation d'un casque seul",
    () => {

        const applicationPlan = {
            damage: {
                vigor: 1
            },

            protection: {
                damage: 2
            }
        };

        const protectionResult = {
            source: {
                type:
                    "worn",

                bodyArmor:
                    null,

                helmet: {
                    itemId:
                        "armor-helmet"
                }
            }
        };


        const result =
            createRangedAttackApplicationLedger({
                applicationPlan,
                protectionResult
            });


        assert.deepEqual(
            result,
            {
                operations: [
                    {
                        type:
                            "attribute-damage",

                        attribute:
                            "vigor",

                        amount:
                            1,

                        status:
                            "pending"
                    },

                    {
                        type:
                            "protection-damage",

                        amount:
                            2,

                        target:
                            "helmet",

                        itemId:
                            "armor-helmet",

                        status:
                            "pending"
                    }
                ]
            }
        );

    }
);

test(
    "createRangedAttackApplicationLedger bloque la dégradation lorsqu'une armure et un casque peuvent la recevoir",
    () => {

        const applicationPlan = {
            damage: {
                vigor: 1
            },

            protection: {
                damage: 2
            }
        };

        const protectionResult = {
            source: {
                type:
                    "worn",

                bodyArmor: {
                    itemId:
                        "armor-body"
                },

                helmet: {
                    itemId:
                        "armor-helmet"
                }
            }
        };


        const result =
            createRangedAttackApplicationLedger({
                applicationPlan,
                protectionResult
            });


        assert.deepEqual(
            result,
            {
                operations: [
                    {
                        type:
                            "attribute-damage",

                        attribute:
                            "vigor",

                        amount:
                            1,

                        status:
                            "pending"
                    },

                    {
                        type:
                            "protection-damage",

                        amount:
                            2,

                        target:
                            null,

                        choices: [
                            "body",
                            "helmet"
                        ],

                        status:
                            "blocked"
                    }
                ]
            }
        );

    }
);

test(
    "resolveRangedAttackProtectionChoice résout le choix vers l'armure corporelle",
    () => {

        const protectionResult = {
            source: {
                type:
                    "worn",

                bodyArmor: {
                    itemId:
                        "armor-body"
                },

                helmet: {
                    itemId:
                        "armor-helmet"
                }
            }
        };

        const ledger = {
            operations: [
                {
                    type:
                        "attribute-damage",

                    attribute:
                        "vigor",

                    amount:
                        1,

                    status:
                        "pending"
                },

                {
                    type:
                        "protection-damage",

                    amount:
                        2,

                    target:
                        null,

                    choices: [
                        "body",
                        "helmet"
                    ],

                    status:
                        "blocked"
                }
            ]
        };


        const result =
            resolveRangedAttackProtectionChoice({
                ledger,
                protectionResult,
                target:
                    "body"
            });


        assert.deepEqual(
            result,
            {
                operations: [
                    {
                        type:
                            "attribute-damage",

                        attribute:
                            "vigor",

                        amount:
                            1,

                        status:
                            "pending"
                    },

                    {
                        type:
                            "protection-damage",

                        amount:
                            2,

                        target:
                            "body",

                        itemId:
                            "armor-body",

                        status:
                            "pending"
                    }
                ]
            }
        );

    }
);

test(
    "resolveRangedAttackProtectionChoice résout le choix vers le casque",
    () => {

        const protectionResult = {
            source: {
                type:
                    "worn",

                bodyArmor: {
                    itemId:
                        "armor-body"
                },

                helmet: {
                    itemId:
                        "armor-helmet"
                }
            }
        };

        const ledger = {
            operations: [
                {
                    type:
                        "attribute-damage",

                    attribute:
                        "vigor",

                    amount:
                        1,

                    status:
                        "pending"
                },

                {
                    type:
                        "protection-damage",

                    amount:
                        2,

                    target:
                        null,

                    choices: [
                        "body",
                        "helmet"
                    ],

                    status:
                        "blocked"
                }
            ]
        };


        const result =
            resolveRangedAttackProtectionChoice({
                ledger,
                protectionResult,
                target:
                    "helmet"
            });


        assert.deepEqual(
            result,
            {
                operations: [
                    {
                        type:
                            "attribute-damage",

                        attribute:
                            "vigor",

                        amount:
                            1,

                        status:
                            "pending"
                    },

                    {
                        type:
                            "protection-damage",

                        amount:
                            2,

                        target:
                            "helmet",

                        itemId:
                            "armor-helmet",

                        status:
                            "pending"
                    }
                ]
            }
        );

    }
);

test(
    "resolveRangedAttackProtectionChoice refuse une cible de Protection invalide",
    () => {

        const protectionResult = {
            source: {
                type:
                    "worn",

                bodyArmor: {
                    itemId:
                        "armor-body"
                },

                helmet: {
                    itemId:
                        "armor-helmet"
                }
            }
        };

        const ledger = {
            operations: [
                {
                    type:
                        "protection-damage",

                    amount:
                        2,

                    target:
                        null,

                    choices: [
                        "body",
                        "helmet"
                    ],

                    status:
                        "blocked"
                }
            ]
        };


        assert.throws(
            () =>
                resolveRangedAttackProtectionChoice({
                    ledger,
                    protectionResult,
                    target:
                        "invalid"
                }),
            {
                name:
                    "TypeError",

                message:
                    "La cible de Protection doit être body ou helmet."
            }
        );

    }
);

test(
    "resolveRangedAttackProtectionChoice refuse une cible absente des choix du ledger",
    () => {

        const protectionResult = {
            source: {
                type:
                    "worn",

                bodyArmor: {
                    itemId:
                        "armor-body"
                },

                helmet: {
                    itemId:
                        "armor-helmet"
                }
            }
        };

        const ledger = {
            operations: [
                {
                    type:
                        "protection-damage",

                    amount:
                        2,

                    target:
                        null,

                    choices: [
                        "helmet"
                    ],

                    status:
                        "blocked"
                }
            ]
        };


        assert.throws(
            () =>
                resolveRangedAttackProtectionChoice({
                    ledger,
                    protectionResult,
                    target:
                        "body"
                }),
            {
                name:
                    "Error",

                message:
                    "La cible de Protection choisie n'est pas disponible dans le ledger."
            }
        );

    }
);

test(
    "resolveRangedAttackProtectionChoice refuse une armure corporelle absente de la source de Protection",
    () => {

        const protectionResult = {
            source: {
                type:
                    "worn",

                bodyArmor:
                    null,

                helmet: {
                    itemId:
                        "armor-helmet"
                }
            }
        };

        const ledger = {
            operations: [
                {
                    type:
                        "protection-damage",

                    amount:
                        2,

                    target:
                        null,

                    choices: [
                        "body",
                        "helmet"
                    ],

                    status:
                        "blocked"
                }
            ]
        };


        assert.throws(
            () =>
                resolveRangedAttackProtectionChoice({
                    ledger,
                    protectionResult,
                    target:
                        "body"
                }),
            {
                name:
                    "Error",

                message:
                    "La protection corporelle choisie n'est pas disponible dans la source de Protection."
            }
        );

    }
);

test(
    "resolveRangedAttackProtectionChoice refuse un casque absent de la source de Protection",
    () => {

        const protectionResult = {
            source: {
                type:
                    "worn",

                bodyArmor: {
                    itemId:
                        "armor-body"
                },

                helmet:
                    null
            }
        };

        const ledger = {
            operations: [
                {
                    type:
                        "protection-damage",

                    amount:
                        2,

                    target:
                        null,

                    choices: [
                        "body",
                        "helmet"
                    ],

                    status:
                        "blocked"
                }
            ]
        };


        assert.throws(
            () =>
                resolveRangedAttackProtectionChoice({
                    ledger,
                    protectionResult,
                    target:
                        "helmet"
                }),
            {
                name:
                    "Error",

                message:
                    "Le casque choisi n'est pas disponible dans la source de Protection."
            }
        );

    }
);

test(
    "createRangedAttackApplicationLedger bloque un désarmement qui nécessite le choix d'un objet",
    () => {

        const applicationPlan = {
            damage: {
                vigor:
                    0
            },

            effects: {
                disarm:
                    true
            }
        };

        const protectionResult = {
            source:
                null
        };


        const ledger =
            createRangedAttackApplicationLedger({
                applicationPlan,
                protectionResult
            });


        assert.deepEqual(
            ledger,
            {
                operations: [
                    {
                        type:
                            "disarm",

                        status:
                            "blocked"
                    }
                ]
            }
        );

    }
);

test(
    "createRangedAttackApplicationLedger conserve les choix disponibles pour un désarmement",
    () => {

        const applicationPlan = {
            damage: {
                vigor:
                    0
            },

            effects: {
                disarm:
                    true
            }
        };


        const protectionResult = {
            source:
                null
        };


        const disarmChoices = [
            {
                itemId:
                    "weapon-1",

                name:
                    "Kalachnikov"
            },
            {
                itemId:
                    "weapon-2",

                name:
                    "Revolver"
            }
        ];


        const ledger =
            createRangedAttackApplicationLedger({
                applicationPlan,
                protectionResult,
                disarmChoices
            });


        assert.deepEqual(
            ledger,
            {
                operations: [
                    {
                        type:
                            "disarm",

                        choices: [
                            {
                                itemId:
                                    "weapon-1",

                                name:
                                    "Kalachnikov"
                            },
                            {
                                itemId:
                                    "weapon-2",

                                name:
                                    "Revolver"
                            }
                        ],

                        status:
                            "blocked"
                    }
                ]
            }
        );

    }
);



test(
    "createRangedAttackApplicationLedger prépare directement le renversement sans choix humain",
    () => {

        const applicationPlan = {
            damage: {
                vigor:
                    0
            },

            effects: {
                knockdown:
                    true
            }
        };

        const protectionResult = {
            source:
                null
        };

        const ledger =
            createRangedAttackApplicationLedger({
                applicationPlan,
                protectionResult
            });

        assert.deepEqual(
            ledger,
            {
                operations: [
                    {
                        type:
                            "knockdown",

                        status:
                            "pending"
                    }
                ]
            }
        );

    }
);

test(
    "createRangedAttackApplicationLedger prépare un échange d'initiative pour le round suivant",
    () => {

        const applicationPlan = {
            damage: {
                vigor:
                    0
            },

            effects: {
                swapInitiative:
                    true
            }
        };

        const protectionResult = {
            source:
                null
        };


        const ledger =
            createRangedAttackApplicationLedger({
                applicationPlan,
                protectionResult
            });


        assert.deepEqual(
            ledger,
            {
                operations: [
                    {
                        type:
                            "initiative-swap",

                        timing:
                            "next-round",

                        status:
                            "pending"
                    }
                ]
            }
        );

    }
);

test(
    "createRangedAttackApplicationLedger prépare l'explosion au contact lorsque l'action d'éclat Grenade est choisie",
    () => {

        const applicationPlan = {
            damage: {
                vigor:
                    0
            },

            effects: {
                grenade:
                    true
            }
        };

        const protectionResult = {
            source:
                null
        };


        const ledger =
            createRangedAttackApplicationLedger({
                applicationPlan,
                protectionResult
            });


        assert.deepEqual(
            ledger,
            {
                operations: [
                    {
                        type:
                            "explosion",

                        range:
                            "contact",

                        status:
                            "pending"
                    }
                ]
            }
        );

    }
);

test(
    "createRangedAttackApplicationLedger compose les dégâts, la Protection et tous les effets d'une attaque à distance",
    () => {

        const applicationPlan = {
            damage: {
                vigor:
                    3,

                spirit:
                    2
            },

            protection: {
                damage:
                    1
            },

            effects: {
                disarm:
                    true,

                knockdown:
                    true,

                swapInitiative:
                    true,

                grenade:
                    true
            }
        };

        const protectionResult = {
            source: {
                type:
                    "worn",

                bodyArmor: {
                    itemId:
                        "armor-1"
                },

                helmet:
                    null
            }
        };


        const ledger =
            createRangedAttackApplicationLedger({
                applicationPlan,
                protectionResult
            });


        assert.deepEqual(
            ledger,
            {
                operations: [
                    {
                        type:
                            "attribute-damage",

                        attribute:
                            "vigor",

                        amount:
                            3,

                        status:
                            "pending"
                    },

                    {
                        type:
                            "attribute-damage",

                        attribute:
                            "spirit",

                        amount:
                            2,

                        status:
                            "pending"
                    },

                    {
                        type:
                            "protection-damage",

                        amount:
                            1,

                        target:
                            "body",

                        itemId:
                            "armor-1",

                        status:
                            "pending"
                    },

                    {
                        type:
                            "disarm",

                        status:
                            "blocked"
                    },

                    {
                        type:
                            "knockdown",

                        status:
                            "pending"
                    },

                    {
                        type:
                            "initiative-swap",

                        timing:
                            "next-round",

                        status:
                            "pending"
                    },

                    {
                        type:
                            "explosion",

                        range:
                            "contact",

                        status:
                            "pending"
                    }
                ]
            }
        );

    }
);


test(
    "resolveRangedAttackDisarmChoice résout un désarmement bloqué avec l'Item choisi",
    () => {

        const ledger = {

            operations: [

                {
                    type:
                        "disarm",

                    status:
                        "blocked"
                }

            ]

        };


        const resolved =
            resolveRangedAttackDisarmChoice({
                ledger,

                itemId:
                    "weapon-1"
            });


        assert.deepEqual(
            resolved,
            {
                operations: [

                    {
                        type:
                            "disarm",

                        itemId:
                            "weapon-1",

                        status:
                            "pending"
                    }

                ]
            }
        );

    }
);

test(
    "resolveRangedAttackDisarmChoice refuse un désarmement qui n'est pas bloqué",
    () => {

        const ledger = {

            operations: [

                {
                    type:
                        "disarm",

                    itemId:
                        "weapon-1",

                    status:
                        "pending"
                }

            ]

        };


        assert.throws(
            () =>
                resolveRangedAttackDisarmChoice({
                    ledger,

                    itemId:
                        "weapon-2"
                }),
            {
                name:
                    "Error",

                message:
                    "L'opération de désarmement doit être bloquée avant la résolution du choix."
            }
        );

    }
);

test(
    "resolveRangedAttackDisarmChoice exige un identifiant d'Item non vide",
    () => {

        const ledger = {

            operations: [

                {
                    type:
                        "disarm",

                    status:
                        "blocked"
                }

            ]

        };


        assert.throws(
            () =>
                resolveRangedAttackDisarmChoice({
                    ledger,

                    itemId:
                        ""
                }),
            {
                name:
                    "TypeError",

                message:
                    "Un identifiant d'Item à désarmer est requis."
            }
        );

    }
);

test(
    "resolveRangedAttackDisarmChoice refuse un Item absent des choix de désarmement",
    () => {

        const ledger = {

            operations: [

                {
                    type:
                        "disarm",

                    choices: [
                        {
                            itemId:
                                "weapon-1",

                            name:
                                "Kalachnikov"
                        },
                        {
                            itemId:
                                "weapon-2",

                            name:
                                "Revolver"
                        }
                    ],

                    status:
                        "blocked"
                }

            ]

        };


        assert.throws(
            () =>
                resolveRangedAttackDisarmChoice({
                    ledger,

                    itemId:
                        "armor-1"
                }),
            {
                name:
                    "Error",

                message:
                    "L'Item choisi n'est pas disponible pour le désarmement."
            }
        );

    }
);

test(
    "resolveRangedAttackDisarmChoice ne mute pas le ledger d'origine",
    () => {

        const ledger = {

            operations: [

                {
                    type:
                        "attribute-damage",

                    attribute:
                        "vigor",

                    amount:
                        2,

                    status:
                        "pending"
                },

                {
                    type:
                        "disarm",

                    status:
                        "blocked"
                }

            ]

        };


        const original =
            structuredClone(
                ledger
            );


        const resolved =
            resolveRangedAttackDisarmChoice({
                ledger,

                itemId:
                    "weapon-1"
            });


        assert.deepEqual(
            ledger,
            original
        );


        assert.notStrictEqual(
            resolved,
            ledger
        );


        assert.deepEqual(
            resolved.operations[1],
            {
                type:
                    "disarm",

                itemId:
                    "weapon-1",

                status:
                    "pending"
            }
        );

    }
);

test(
    "getRangedAttackBlockedOperations retourne les opérations bloquées dans l'ordre du ledger",
    () => {

        const ledger = {
            operations: [
                {
                    type:
                        "attribute-damage",

                    attribute:
                        "vigor",

                    amount:
                        2,

                    status:
                        "pending"
                },

                {
                    type:
                        "protection-damage",

                    amount:
                        1,

                    target:
                        null,

                    choices: [
                        "body",
                        "helmet"
                    ],

                    status:
                        "blocked"
                },

                {
                    type:
                        "knockdown",

                    status:
                        "pending"
                },

                {
                    type:
                        "disarm",

                    status:
                        "blocked"
                },

                {
                    type:
                        "initiative-swap",

                    timing:
                        "next-round",

                    status:
                        "pending"
                }
            ]
        };


        const result =
            getRangedAttackBlockedOperations({
                ledger
            });


        assert.deepEqual(
            result,
            [
                ledger.operations[1],
                ledger.operations[3]
            ]
        );

    }
);

test(
    "getRangedAttackBlockedOperations retourne un tableau vide lorsque le ledger n'est pas bloqué",
    () => {

        const ledger = {
            operations: [
                {
                    type:
                        "attribute-damage",

                    attribute:
                        "vigor",

                    amount:
                        2,

                    status:
                        "pending"
                },

                {
                    type:
                        "initiative-swap",

                    timing:
                        "next-round",

                    status:
                        "pending"
                }
            ]
        };


        const result =
            getRangedAttackBlockedOperations({
                ledger
            });


        assert.deepEqual(
            result,
            []
        );

    }
);

