import test
    from "node:test";

import assert
    from "node:assert/strict";

import {
    applyRangedAttackProtectionDamage,
    applyRangedAttackAttributeDamage,
    applyRangedAttackKnockdown,
    applyRangedAttackInitiativeSwap,
    applyRangedAttackExplosion,
    applyRangedAttackDisarm,
    applyRangedAttackApplicationLedger
} from "../../src/application/ranged-attack-application.mjs";

import {
    resolveRangedAttackDisarmChoice,
    resolveRangedAttackProtectionChoice
} from "../../src/domain/rules/ranged-attack-application-ledger.mjs";

test(
    "applyRangedAttackProtectionDamage applique une dégradation de Protection en attente",
    async () => {

        const updates = [];

        const item = {
            id:
                "armor-body",

            type:
                "armor",

            system: {
                protection: {
                    current:
                        5
                }
            },

            async update(
                updateData
            ) {
                updates.push(
                    updateData
                );
            }
        };

        const operation = {
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
        };


        await applyRangedAttackProtectionDamage({
            operation,
            item
        });


        assert.deepEqual(
            updates,
            [
                {
                    "system.protection.current":
                        3
                }
            ]
        );

    }
);

test(
    "applyRangedAttackProtectionDamage utilise la Protection courante du ArmorDataModel",
    async () => {

        const updates = [];


        const item = {

            id:
                "armor-body",

            type:
                "armor",

            system: {

                protection: {

                    current:
                        5,

                    max:
                        5

                },

                resilience:
                    false,

                resilienceLost:
                    false

            },


            async update(
                updateData
            ) {

                updates.push(
                    updateData
                );

            }

        };


        const operation = {

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

        };


        await applyRangedAttackProtectionDamage({
            operation,
            item
        });


        assert.deepEqual(
            updates,
            [
                {
                    "system.protection.current":
                        3
                }
            ]
        );

    }
);

test(
    "applyRangedAttackProtectionDamage refuse une opération de Protection bloquée",
    async () => {

        const updates = [];

        const item = {
            id:
                "armor-body",

            type:
                "armor",

            system: {
                protection: {
                    current:
                        5
                }
            },

            async update(
                updateData
            ) {
                updates.push(
                    updateData
                );
            }
        };

        const operation = {
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
        };


        await assert.rejects(
            () =>
                applyRangedAttackProtectionDamage({
                    operation,
                    item
                }),
            {
                name:
                    "Error",

                message:
                    "Une opération de dégradation de Protection doit être en attente avant son application."
            }
        );


        assert.deepEqual(
            updates,
            []
        );

    }
);

test(
    "applyRangedAttackProtectionDamage refuse une opération qui n'est pas une dégradation de Protection",
    async () => {

        const updates = [];

        const item = {
            id:
                "armor-body",

            type:
                "armor",

            system: {
                protection: {
                    current:
                        5
                }
            },

            async update(
                updateData
            ) {
                updates.push(
                    updateData
                );
            }
        };

        const operation = {
            type:
                "attribute-damage",

            attribute:
                "vigor",

            amount:
                2,

            status:
                "pending"
        };


        await assert.rejects(
            () =>
                applyRangedAttackProtectionDamage({
                    operation,
                    item
                }),
            {
                name:
                    "TypeError",

                message:
                    "Une opération de dégradation de Protection est requise."
            }
        );


        assert.deepEqual(
            updates,
            []
        );

    }
);

test(
    "applyRangedAttackProtectionDamage refuse un Item différent de celui désigné par l'opération",
    async () => {

        const updates = [];

        const item = {
            id:
                "armor-other",

            type:
                "armor",

            system: {
                protection: {
                    current:
                        5
                }
            },

            async update(
                updateData
            ) {
                updates.push(
                    updateData
                );
            }
        };

        const operation = {
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
        };


        await assert.rejects(
            () =>
                applyRangedAttackProtectionDamage({
                    operation,
                    item
                }),
            {
                name:
                    "Error",

                message:
                    "L'Item de Protection ne correspond pas à l'opération à appliquer."
            }
        );


        assert.deepEqual(
            updates,
            []
        );

    }
);

test(
    "applyRangedAttackProtectionDamage refuse un Item qui n'est pas une armure",
    async () => {

        const updates = [];

        const item = {
            id:
                "armor-body",

            type:
                "equipment",

            system: {
                protection: {
                    current:
                        5
                }
            },

            async update(
                updateData
            ) {
                updates.push(
                    updateData
                );
            }
        };

        const operation = {
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
        };


        await assert.rejects(
            () =>
                applyRangedAttackProtectionDamage({
                    operation,
                    item
                }),
            {
                name:
                    "TypeError",

                message:
                    "L'Item de Protection doit être une armure."
            }
        );


        assert.deepEqual(
            updates,
            []
        );

    }
);

test(
    "applyRangedAttackProtectionDamage désactive la Résilience lorsque la Protection est brisée",
    async () => {

        const updates = [];

        const item = {
            id:
                "armor-body",

            type:
                "armor",

            system: {
                protection: {
                    current:
                        2
                },

                resilience:
                    true,

                resilienceLost:
                    false
            },

            async update(
                updateData
            ) {
                updates.push(
                    updateData
                );
            }
        };

        const operation = {
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
        };


        await applyRangedAttackProtectionDamage({
            operation,
            item
        });


        assert.deepEqual(
            updates,
            [
                {
                    "system.protection.current":
                        0,

                    "system.resilienceLost":
                        true
                }
            ]
        );

    }
);

test(
    "applyRangedAttackProtectionDamage ne réduit pas la Résilience lorsque la Protection n'est pas brisée",
    async () => {

        const updates = [];

        const item = {
            id:
                "armor-body",

            type:
                "armor",

            system: {
                protection: {
                    current:
                        5
                },

                resilience:
                    3
            },

            async update(
                updateData
            ) {
                updates.push(
                    updateData
                );
            }
        };

        const operation = {
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
        };


        await applyRangedAttackProtectionDamage({
            operation,
            item
        });


        assert.deepEqual(
            updates,
            [
                {
                    "system.protection.current":
                        3
                }
            ]
        );

    }
);

test(
    "applyRangedAttackProtectionDamage ne désactive pas la Résilience d'une protection qui ne la possède pas",
    async () => {

        const updates = [];

        const item = {
            id:
                "armor-body",

            type:
                "armor",

            system: {
                protection: {
                    current:
                        2
                },

                resilience:
                    false,

                resilienceLost:
                    false
            },

            async update(
                updateData
            ) {
                updates.push(
                    updateData
                );
            }
        };

        const operation = {
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
        };


        await applyRangedAttackProtectionDamage({
            operation,
            item
        });


        assert.deepEqual(
            updates,
            [
                {
                    "system.protection.current":
                        0
                }
            ]
        );

    }
);

test(
    "applyRangedAttackProtectionDamage ne désactive pas à nouveau la Résilience d'une Protection déjà brisée",
    async () => {

        const updates = [];

        const item = {
            id:
                "armor-body",

            type:
                "armor",

            system: {
                protection: {
                    current:
                        0
                },

                resilience:
                    true,

                resilienceLost:
                    false
            },

            async update(
                updateData
            ) {
                updates.push(
                    updateData
                );
            }
        };

        const operation = {
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
        };


        await applyRangedAttackProtectionDamage({
            operation,
            item
        });


        assert.deepEqual(
            updates,
            [
                {
                    "system.protection.current":
                        0
                }
            ]
        );

    }
);

test(
    "applyRangedAttackProtectionDamage absorbe l'overflow sans le réaffecter à une autre Protection",
    async () => {

        const updates = [];

        const item = {
            id:
                "armor-body",

            type:
                "armor",

            system: {
                protection: {
                    current:
                        1
                },

                resilience:
                    false,

                resilienceLost:
                    false
            },

            async update(
                updateData
            ) {
                updates.push(
                    updateData
                );
            }
        };

        const operation = {
            type:
                "protection-damage",

            amount:
                3,

            target:
                "body",

            itemId:
                "armor-body",

            status:
                "pending"
        };


        await applyRangedAttackProtectionDamage({
            operation,
            item
        });


        assert.deepEqual(
            updates,
            [
                {
                    "system.protection.current":
                        0
                }
            ]
        );

    }
);

test(
    "applyRangedAttackAttributeDamage applique des dégâts de Vigueur en attente",
    async () => {

        const damages = [];

        const actor = {
            async takeAttributeDamage(
                attribute,
                amount
            ) {
                damages.push({
                    attribute,
                    amount
                });
            }
        };

        const operation = {
            type:
                "attribute-damage",

            attribute:
                "vigor",

            amount:
                3,

            status:
                "pending"
        };


        await applyRangedAttackAttributeDamage({
            operation,
            actor
        });


        assert.deepEqual(
            damages,
            [
                {
                    attribute:
                        "vigor",

                    amount:
                        3
                }
            ]
        );

    }
);

test(
    "applyRangedAttackAttributeDamage refuse une opération de dégâts d'Attribut bloquée",
    async () => {

        const damages = [];

        const actor = {
            async takeAttributeDamage(
                attribute,
                amount
            ) {
                damages.push({
                    attribute,
                    amount
                });
            }
        };

        const operation = {
            type:
                "attribute-damage",

            attribute:
                "vigor",

            amount:
                3,

            status:
                "blocked"
        };


        await assert.rejects(
            () =>
                applyRangedAttackAttributeDamage({
                    operation,
                    actor
                }),
            Error
        );


        assert.deepEqual(
            damages,
            []
        );

    }
);

test(
    "applyRangedAttackAttributeDamage refuse une opération qui n'est pas un dégât d'Attribut",
    async () => {

        const damages = [];

        const actor = {
            async takeAttributeDamage(
                attribute,
                amount
            ) {
                damages.push({
                    attribute,
                    amount
                });
            }
        };

        const operation = {
            type:
                "protection-damage",

            attribute:
                "vigor",

            amount:
                3,

            status:
                "pending"
        };


        await assert.rejects(
            () =>
                applyRangedAttackAttributeDamage({
                    operation,
                    actor
                }),
            TypeError
        );


        assert.deepEqual(
            damages,
            []
        );

    }
);

test(
    "applyRangedAttackAttributeDamage refuse un Attribut non pris en charge",
    async () => {

        const damages = [];

        const actor = {
            async takeAttributeDamage(
                attribute,
                amount
            ) {
                damages.push({
                    attribute,
                    amount
                });
            }
        };

        const operation = {
            type:
                "attribute-damage",

            attribute:
                "unknown",

            amount:
                3,

            status:
                "pending"
        };


        await assert.rejects(
            () =>
                applyRangedAttackAttributeDamage({
                    operation,
                    actor
                }),
            TypeError
        );


        assert.deepEqual(
            damages,
            []
        );

    }
);

test(
    "applyRangedAttackAttributeDamage applique des dégâts d'Esprit en attente",
    async () => {

        const damages = [];

        const actor = {
            async takeAttributeDamage(
                attribute,
                amount
            ) {
                damages.push({
                    attribute,
                    amount
                });
            }
        };

        const operation = {
            type:
                "attribute-damage",

            attribute:
                "spirit",

            amount:
                2,

            status:
                "pending"
        };


        await applyRangedAttackAttributeDamage({
            operation,
            actor
        });


        assert.deepEqual(
            damages,
            [
                {
                    attribute:
                        "spirit",

                    amount:
                        2
                }
            ]
        );

    }
);

test(
    "applyRangedAttackAttributeDamage refuse une quantité de dégâts négative",
    async () => {

        const damages = [];

        const actor = {
            async takeAttributeDamage(
                attribute,
                amount
            ) {
                damages.push({
                    attribute,
                    amount
                });
            }
        };

        const operation = {
            type:
                "attribute-damage",

            attribute:
                "vigor",

            amount:
                -1,

            status:
                "pending"
        };


        await assert.rejects(
            () =>
                applyRangedAttackAttributeDamage({
                    operation,
                    actor
                }),
            TypeError
        );


        assert.deepEqual(
            damages,
            []
        );

    }
);

test(
    "applyRangedAttackAttributeDamage refuse une quantité de dégâts non entière",
    async () => {

        const damages = [];

        const actor = {
            async takeAttributeDamage(
                attribute,
                amount
            ) {
                damages.push({
                    attribute,
                    amount
                });
            }
        };

        const operation = {
            type:
                "attribute-damage",

            attribute:
                "vigor",

            amount:
                1.5,

            status:
                "pending"
        };


        await assert.rejects(
            () =>
                applyRangedAttackAttributeDamage({
                    operation,
                    actor
                }),
            TypeError
        );


        assert.deepEqual(
            damages,
            []
        );

    }
);

test(
    "applyRangedAttackAttributeDamage refuse une cible incapable d'appliquer des dégâts d'Attribut",
    async () => {

        const actor = {};

        const operation = {
            type:
                "attribute-damage",

            attribute:
                "vigor",

            amount:
                3,

            status:
                "pending"
        };


        await assert.rejects(
            () =>
                applyRangedAttackAttributeDamage({
                    operation,
                    actor
                }),
            {
                name:
                    "TypeError",

                message:
                    "Une cible capable d'appliquer des dégâts d'Attribut est requise."
            }
        );

    }
);

test(
    "applyRangedAttackApplicationLedger applique une opération de dégâts d'Attribut en attente",
    async () => {

        const damages = [];

        const actor = {
            async takeAttributeDamage(
                attribute,
                amount
            ) {
                damages.push({
                    attribute,
                    amount
                });
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
                        3,

                    status:
                        "pending"
                }
            ]
        };


        await applyRangedAttackApplicationLedger({
            ledger,
            actor
        });


        assert.deepEqual(
            damages,
            [
                {
                    attribute:
                        "vigor",

                    amount:
                        3
                }
            ]
        );

    }
);

test(
    "applyRangedAttackApplicationLedger applique une dégradation de Protection en attente",
    async () => {

        const updates = [];

        const item = {
            id:
                "armor-1",

            type:
                "armor",

            system: {
                protection: {
                    current:
                        3
                },

                resilience:
                    false
            },

            async update(
                updateData
            ) {
                updates.push(
                    updateData
                );
            }
        };

        const actor = {
            items: {
                get(
                    itemId
                ) {
                    if (
                        itemId === "armor-1"
                    ) {
                        return item;
                    }

                    return undefined;
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
                        "body",

                    itemId:
                        "armor-1",

                    status:
                        "pending"
                }
            ]
        };


        await applyRangedAttackApplicationLedger({
            ledger,
            actor
        });


        assert.deepEqual(
            updates,
            [
                {
                    "system.protection.current":
                        1
                }
            ]
        );

    }
);

test(
    "applyRangedAttackApplicationLedger refuse une Protection introuvable sur la cible",
    async () => {

        const actor = {
            items: {
                get() {
                    return undefined;
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
                        "body",

                    itemId:
                        "armor-missing",

                    status:
                        "pending"
                }
            ]
        };


        await assert.rejects(
            () =>
                applyRangedAttackApplicationLedger({
                    ledger,
                    actor
                }),
            {
                name:
                    "Error",

                message:
                    "L'Item de Protection désigné par l'opération est introuvable sur la cible."
            }
        );

    }
);

test(
    "applyRangedAttackApplicationLedger applique la Protection avant les dégâts d'Attribut",
    async () => {

        const applications = [];

        const item = {
            id:
                "armor-1",

            type:
                "armor",

            system: {
                protection: {
                    current:
                        3
                },

                resilience:
                    false
            },

            async update() {
                applications.push(
                    "protection"
                );
            }
        };

        const actor = {
            items: {
                get(
                    itemId
                ) {
                    if (
                        itemId === "armor-1"
                    ) {
                        return item;
                    }

                    return undefined;
                }
            },

            async takeAttributeDamage(
                attribute
            ) {
                applications.push(
                    attribute
                );
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
                        2,

                    status:
                        "pending"
                },

                {
                    type:
                        "attribute-damage",

                    attribute:
                        "spirit",

                    amount:
                        1,

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
                }
            ]
        };


        await applyRangedAttackApplicationLedger({
            ledger,
            actor
        });


        assert.deepEqual(
            applications,
            [
                "protection",
                "vigor",
                "spirit"
            ]
        );

    }
);

test(
    "applyRangedAttackApplicationLedger refuse un ledger bloqué avant toute mutation",
    async () => {

        const applications = [];

        const item = {
            id:
                "armor-1",

            type:
                "armor",

            system: {
                protection: {
                    current:
                        3
                },

                resilience:
                    false
            },

            async update() {
                applications.push(
                    "protection"
                );
            }
        };

        const actor = {
            items: {
                get(
                    itemId
                ) {
                    if (
                        itemId === "armor-1"
                    ) {
                        return item;
                    }

                    return undefined;
                }
            },

            async takeAttributeDamage() {
                applications.push(
                    "attribute"
                );
            }
        };

        const ledger = {
            operations: [
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
                        "attribute-damage",

                    attribute:
                        "vigor",

                    amount:
                        2,

                    status:
                        "blocked"
                }
            ]
        };


        await assert.rejects(
            () =>
                applyRangedAttackApplicationLedger({
                    ledger,
                    actor
                }),
            Error
        );


        assert.deepEqual(
            applications,
            []
        );

    }
);

test(
    "applyRangedAttackApplicationLedger refuse une opération de dégâts d'Attribut invalide avant toute mutation",
    async () => {

        const applications = [];

        const item = {
            id:
                "armor-1",

            type:
                "armor",

            system: {
                protection: {
                    current:
                        3
                },

                resilience:
                    false
            },

            async update() {
                applications.push(
                    "protection"
                );
            }
        };

        const actor = {
            items: {
                get(
                    itemId
                ) {
                    if (
                        itemId === "armor-1"
                    ) {
                        return item;
                    }

                    return undefined;
                }
            },

            async takeAttributeDamage() {
                applications.push(
                    "attribute"
                );
            }
        };

        const ledger = {
            operations: [
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
                        "attribute-damage",

                    attribute:
                        "unknown",

                    amount:
                        2,

                    status:
                        "pending"
                }
            ]
        };


        await assert.rejects(
            () =>
                applyRangedAttackApplicationLedger({
                    ledger,
                    actor
                }),
            TypeError
        );


        assert.deepEqual(
            applications,
            []
        );

    }
);

test(
    "applyRangedAttackApplicationLedger refuse une quantité de dégâts d'Attribut invalide avant toute mutation",
    async () => {

        const applications = [];

        const item = {
            id:
                "armor-1",

            type:
                "armor",

            system: {
                protection: {
                    current:
                        3
                },

                resilience:
                    false
            },

            async update() {
                applications.push(
                    "protection"
                );
            }
        };

        const actor = {
            items: {
                get(
                    itemId
                ) {
                    if (
                        itemId === "armor-1"
                    ) {
                        return item;
                    }

                    return undefined;
                }
            },

            async takeAttributeDamage() {
                applications.push(
                    "attribute"
                );
            }
        };

        const ledger = {
            operations: [
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
                        "attribute-damage",

                    attribute:
                        "vigor",

                    amount:
                        -1,

                    status:
                        "pending"
                }
            ]
        };


        await assert.rejects(
            () =>
                applyRangedAttackApplicationLedger({
                    ledger,
                    actor
                }),
            TypeError
        );


        assert.deepEqual(
            applications,
            []
        );

    }
);

test(
    "applyRangedAttackApplicationLedger refuse une cible incapable d'appliquer les dégâts d'Attribut avant toute mutation",
    async () => {

        const applications = [];

        const item = {
            id:
                "armor-1",

            type:
                "armor",

            system: {
                protection: {
                    current:
                        3
                },

                resilience:
                    false
            },

            async update() {
                applications.push(
                    "protection"
                );
            }
        };

        const actor = {
            items: {
                get(
                    itemId
                ) {
                    if (
                        itemId === "armor-1"
                    ) {
                        return item;
                    }

                    return undefined;
                }
            }
        };

        const ledger = {
            operations: [
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
                        "attribute-damage",

                    attribute:
                        "vigor",

                    amount:
                        2,

                    status:
                        "pending"
                }
            ]
        };


        await assert.rejects(
            () =>
                applyRangedAttackApplicationLedger({
                    ledger,
                    actor
                }),
            {
                name:
                    "TypeError",

                message:
                    "Une cible capable d'appliquer des dégâts d'Attribut est requise."
            }
        );


        assert.deepEqual(
            applications,
            []
        );

    }
);

test(
    "applyRangedAttackKnockdown applique un renversement en attente sans choix",
    async () => {

        const applications = [];


        const actor = {

            async applyKnockdown() {

                applications.push(
                    "knockdown"
                );

            }

        };


        const operation = {

            type:
                "knockdown",

            status:
                "pending"

        };


        await applyRangedAttackKnockdown({
            operation,
            actor
        });


        assert.deepEqual(
            applications,
            [
                "knockdown"
            ]
        );

    }
);


test(
    "applyRangedAttackKnockdown refuse une cible incapable d'appliquer un renversement",
    async () => {

        const actor = {};

        const operation = {
            type:
                "knockdown",

            status:
                "pending"
        };


        await assert.rejects(
            () =>
                applyRangedAttackKnockdown({
                    operation,
                    actor
                }),
            {
                name:
                    "TypeError",

                message:
                    "Une cible capable d'appliquer un renversement est requise."
            }
        );

    }
);

test(
    "applyRangedAttackKnockdown refuse une opération qui n'est pas un renversement",
    async () => {

        const knockdowns = [];

        const actor = {
            async applyKnockdown() {
                knockdowns.push(
                    "knockdown"
                );
            }
        };

        const operation = {
            type:
                "attribute-damage",

            status:
                "pending"
        };


        await assert.rejects(
            () =>
                applyRangedAttackKnockdown({
                    operation,
                    actor
                }),
            {
                name:
                    "TypeError",

                message:
                    "Une opération de renversement est requise."
            }
        );


        assert.deepEqual(
            knockdowns,
            []
        );

    }
);

test(
    "applyRangedAttackKnockdown refuse une opération de renversement bloquée",
    async () => {

        const knockdowns = [];

        const actor = {
            async applyKnockdown() {
                knockdowns.push(
                    "knockdown"
                );
            }
        };

        const operation = {
            type:
                "knockdown",

            status:
                "blocked"
        };


        await assert.rejects(
            () =>
                applyRangedAttackKnockdown({
                    operation,
                    actor
                }),
            {
                name:
                    "Error",

                message:
                    "Une opération de renversement doit être en attente avant son application."
            }
        );


        assert.deepEqual(
            knockdowns,
            []
        );

    }
);



test(
    "applyRangedAttackApplicationLedger applique un renversement en attente sans choix",
    async () => {

        const applications = [];


        const actor = {

            async applyKnockdown() {

                applications.push(
                    "knockdown"
                );

            }

        };


        const ledger = {

            operations: [

                {
                    type:
                        "knockdown",

                    status:
                        "pending"
                }

            ]

        };


        await applyRangedAttackApplicationLedger({
            ledger,
            actor
        });


        assert.deepEqual(
            applications,
            [
                "knockdown"
            ]
        );

    }
);


test(
    "applyRangedAttackApplicationLedger refuse une cible incapable d'appliquer un renversement avant toute mutation",
    async () => {

        const applications = [];

        const item = {
            id:
                "armor-1",

            type:
                "armor",

            system: {
                protection: {
                    current:
                        3
                },

                resilience:
                    false
            },

            async update() {
                applications.push(
                    "protection"
                );
            }
        };

        const actor = {
            items: {
                get(
                    itemId
                ) {
                    if (
                        itemId === "armor-1"
                    ) {
                        return item;
                    }

                    return undefined;
                }
            },

            async takeAttributeDamage() {
                applications.push(
                    "attribute"
                );
            }
        };

        const ledger = {
            operations: [
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
                        "knockdown",

                    status:
                        "pending"
                }
            ]
        };


        await assert.rejects(
            () =>
                applyRangedAttackApplicationLedger({
                    ledger,
                    actor
                }),
            {
                name:
                    "TypeError",

                message:
                    "Une cible capable d'appliquer un renversement est requise."
            }
        );


        assert.deepEqual(
            applications,
            []
        );

    }
);


test(
    "applyRangedAttackApplicationLedger applique la Protection, les dégâts d'Attribut puis le renversement",
    async () => {

        const applications = [];

        const item = {
            id:
                "armor-1",

            type:
                "armor",

            system: {
                protection: {
                    current:
                        3
                },

                resilience:
                    false
            },

            async update() {
                applications.push(
                    "protection"
                );
            }
        };

        const actor = {
            items: {
                get(
                    itemId
                ) {
                    if (
                        itemId === "armor-1"
                    ) {
                        return item;
                    }

                    return undefined;
                }
            },

            async takeAttributeDamage(
                attribute
            ) {
                applications.push(
                    attribute
                );
            },

            async applyKnockdown() {
                applications.push(
                    "knockdown"
                );
            }
        };

        const ledger = {
            operations: [
                {
                    type:
                        "knockdown",

                    status:
                        "pending"
                },

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
                        "body",

                    itemId:
                        "armor-1",

                    status:
                        "pending"
                },

                {
                    type:
                        "attribute-damage",

                    attribute:
                        "spirit",

                    amount:
                        1,

                    status:
                        "pending"
                }
            ]
        };


        await applyRangedAttackApplicationLedger({
            ledger,
            actor
        });


        assert.deepEqual(
            applications,
            [
                "protection",
                "vigor",
                "spirit",
                "knockdown"
            ]
        );

    }
);



test(
    "applyRangedAttackInitiativeSwap applique un échange d'initiative au prochain round",
    async () => {

        const applications = [];

        const combat = {
            id:
                "combat-1"
        };

        const attacker = {
            id:
                "attacker-1"
        };

        const target = {
            id:
                "target-1"
        };

        const operation = {
            type:
                "initiative-swap",

            timing:
                "next-round",

            status:
                "pending"
        };


        const scheduleInitiativeSwap =
            async (
                currentCombat,
                currentAttacker,
                currentTarget
            ) => {

                applications.push({
                    combat:
                        currentCombat,

                    attacker:
                        currentAttacker,

                    target:
                        currentTarget
                });

            };

        const validateInitiativeSwap =
            (
                currentCombat,
                currentAttacker,
                currentTarget
            ) => {

                assert.equal(
                    currentCombat,
                    combat
                );

                assert.equal(
                    currentAttacker,
                    attacker
                );

                assert.equal(
                    currentTarget,
                    actor
                );

            };            

        await applyRangedAttackInitiativeSwap({
            operation,
            combat,
            attacker,
            target,
            scheduleInitiativeSwap,
            validateInitiativeSwap
        });


        assert.deepEqual(
            applications,
            [
                {
                    combat,
                    attacker,
                    target
                }
            ]
        );

    }
);


test(
    "applyRangedAttackInitiativeSwap refuse une opération qui n'est pas un échange d'initiative",
    async () => {

        const applications = [];

        const combat = {
            async applyInitiativeSwap({
                timing
            }) {
                applications.push(
                    timing
                );
            }
        };

        const operation = {
            type:
                "knockdown",

            timing:
                "next-round",

            status:
                "pending"
        };


        await assert.rejects(
            () =>
                applyRangedAttackInitiativeSwap({
                    operation,
                    combat
                }),
            {
                name:
                    "TypeError",

                message:
                    "Une opération d'échange d'initiative est requise."
            }
        );


        assert.deepEqual(
            applications,
            []
        );

    }
);


test(
    "applyRangedAttackInitiativeSwap refuse une opération d'initiative qui n'est pas en attente",
    async () => {

        const applications = [];

        const combat = {
            async applyInitiativeSwap({
                timing
            }) {
                applications.push(
                    timing
                );
            }
        };

        const operation = {
            type:
                "initiative-swap",

            timing:
                "next-round",

            status:
                "blocked"
        };


        await assert.rejects(
            () =>
                applyRangedAttackInitiativeSwap({
                    operation,
                    combat
                }),
            {
                name:
                    "Error",

                message:
                    "Une opération d'échange d'initiative doit être en attente avant son application."
            }
        );


        assert.deepEqual(
            applications,
            []
        );

    }
);


test(
    "applyRangedAttackInitiativeSwap refuse un timing d'initiative non pris en charge",
    async () => {

        const applications = [];

        const combat = {
            async applyInitiativeSwap({
                timing
            }) {
                applications.push(
                    timing
                );
            }
        };

        const operation = {
            type:
                "initiative-swap",

            timing:
                "immediate",

            status:
                "pending"
        };


        await assert.rejects(
            () =>
                applyRangedAttackInitiativeSwap({
                    operation,
                    combat
                }),
            {
                name:
                    "TypeError",

                message:
                    "Le timing d'échange d'initiative doit être next-round."
            }
        );


        assert.deepEqual(
            applications,
            []
        );

    }
);

test(
    "applyRangedAttackInitiativeSwap refuse une capacité de programmation absente",
    async () => {

        const combat = {
            id:
                "combat-1"
        };

        const attacker = {
            id:
                "attacker-1"
        };

        const target = {
            id:
                "target-1"
        };

        const operation = {
            type:
                "initiative-swap",

            timing:
                "next-round",

            status:
                "pending"
        };


        await assert.rejects(
            () =>
                applyRangedAttackInitiativeSwap({
                    operation,
                    combat,
                    attacker,
                    target
                }),
            {
                name:
                    "TypeError",

                message:
                    "Une capacité de programmation d'échange d'initiative est requise."
            }
        );

    }
);

test(
    "applyRangedAttackApplicationLedger applique un échange d'initiative en attente",
    async () => {

        const applications = [];

        const actor = {
            id:
                "target-1"
        };

        const attacker = {
            id:
                "attacker-1"
        };

        const combat = {
            id:
                "combat-1"
        };

        const ledger = {
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
        };


        const validateInitiativeSwap =
            (
                currentCombat,
                currentAttacker,
                currentTarget
            ) => {

                assert.equal(
                    currentCombat,
                    combat
                );

                assert.equal(
                    currentAttacker,
                    attacker
                );

                assert.equal(
                    currentTarget,
                    actor
                );

            };


        const scheduleInitiativeSwap =
            async (
                currentCombat,
                currentAttacker,
                currentTarget
            ) => {

                applications.push({
                    combat:
                        currentCombat,

                    attacker:
                        currentAttacker,

                    target:
                        currentTarget
                });

            };


        await applyRangedAttackApplicationLedger({
            ledger,
            actor,
            combat,
            attacker,
            validateInitiativeSwap,
            scheduleInitiativeSwap
        });


        assert.deepEqual(
            applications,
            [
                {
                    combat,
                    attacker,
                    target:
                        actor
                }
            ]
        );

    }
);

test(
    "applyRangedAttackApplicationLedger refuse un timing d'initiative invalide avant toute mutation",
    async () => {

        const applications = [];

        const item = {
            id:
                "armor-1",

            type:
                "armor",

            system: {
                protection: {
                    current:
                        3
                },

                resilience:
                    false
            },

            async update() {
                applications.push(
                    "protection"
                );
            }
        };

        const actor = {
            items: {
                get(
                    itemId
                ) {
                    if (
                        itemId === "armor-1"
                    ) {
                        return item;
                    }

                    return undefined;
                }
            },

            async takeAttributeDamage() {
                applications.push(
                    "attribute"
                );
            }
        };

        const combat = {
            async applyInitiativeSwap() {
                applications.push(
                    "initiative"
                );
            }
        };

        const ledger = {
            operations: [
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
                        "immediate",

                    status:
                        "pending"
                }
            ]
        };


        await assert.rejects(
            () =>
                applyRangedAttackApplicationLedger({
                    ledger,
                    actor,
                    combat
                }),
            {
                name:
                    "TypeError",

                message:
                    "Le timing d'échange d'initiative doit être next-round."
            }
        );


        assert.deepEqual(
            applications,
            []
        );

    }
);


test(
    "applyRangedAttackApplicationLedger refuse une capacité de programmation d'initiative absente avant toute mutation",
    async () => {

        const applications = [];

        const item = {
            id:
                "armor-1",

            type:
                "armor",

            system: {
                protection: {
                    current:
                        3
                },

                resilience:
                    false
            },

            async update() {
                applications.push(
                    "protection"
                );
            }
        };

        const actor = {
            items: {
                get(
                    itemId
                ) {
                    if (
                        itemId ===
                            "armor-1"
                    ) {
                        return item;
                    }

                    return undefined;
                }
            },

            async takeAttributeDamage() {
                applications.push(
                    "attribute"
                );
            }
        };

        const attacker = {
            id:
                "attacker-1"
        };

        const combat = {
            id:
                "combat-1"
        };

        const ledger = {
            operations: [
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


        await assert.rejects(
            () =>
                applyRangedAttackApplicationLedger({
                    ledger,
                    actor,
                    combat,
                    attacker
                }),
            {
                name:
                    "TypeError",

                message:
                    "Une capacité de programmation d'échange d'initiative est requise."
            }
        );


        assert.deepEqual(
            applications,
            []
        );

    }
);

test(
    "applyRangedAttackApplicationLedger applique la Protection, les dégâts d'Attribut, le renversement puis l'échange d'initiative",
    async () => {

        const applications = [];

        const item = {
            id:
                "armor-1",

            type:
                "armor",

            system: {
                protection: {
                    current:
                        3
                },

                resilience:
                    false
            },

            async update() {
                applications.push(
                    "protection"
                );
            }
        };

        const actor = {
            items: {
                get(
                    itemId
                ) {
                    if (
                        itemId === "armor-1"
                    ) {
                        return item;
                    }

                    return undefined;
                }
            },

            async takeAttributeDamage(
                attribute
            ) {
                applications.push(
                    attribute
                );
            },

            async applyKnockdown() {
                applications.push(
                    "knockdown"
                );
            }
        };

        const attacker = {
            id:
                "attacker-1"
        };

        const combat = {
            id:
                "combat-1"
        };

        const scheduleInitiativeSwap =
            async (
                currentCombat,
                currentAttacker,
                currentTarget
            ) => {

                assert.equal(
                    currentCombat,
                    combat
                );

                assert.equal(
                    currentAttacker,
                    attacker
                );

                assert.equal(
                    currentTarget,
                    actor
                );

                applications.push(
                    "initiative-swap:next-round"
                );

            };

        const validateInitiativeSwap =
            (
                currentCombat,
                currentAttacker,
                currentTarget
            ) => {

                assert.equal(
                    currentCombat,
                    combat
                );

                assert.equal(
                    currentAttacker,
                    attacker
                );

                assert.equal(
                    currentTarget,
                    actor
                );

            };

        const ledger = {
            operations: [
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
                        "knockdown",

                    status:
                        "pending"
                },

                {
                    type:
                        "attribute-damage",

                    attribute:
                        "spirit",

                    amount:
                        1,

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
                        "attribute-damage",

                    attribute:
                        "vigor",

                    amount:
                        2,

                    status:
                        "pending"
                }
            ]
        };


        await applyRangedAttackApplicationLedger({
            ledger,
            actor,
            combat,
            attacker,
            scheduleInitiativeSwap,
            validateInitiativeSwap
        });


        assert.deepEqual(
            applications,
            [
                "protection",
                "spirit",
                "vigor",
                "knockdown",
                "initiative-swap:next-round"
            ]
        );

    }
);

test(
    "applyRangedAttackExplosion applique une explosion au contact avec la Puissance fournie",
    async () => {

        const applications = [];

        const actor = {

            async resolveExplosion({
                power,
                range,
                cover
            }) {

                applications.push({
                    power,
                    range,
                    cover
                });


                return {
                    exploded:
                        true
                };

            }

        };


        const operation = {

            type:
                "explosion",

            range:
                "contact",

            status:
                "pending"

        };


        const result =
            await applyRangedAttackExplosion({
                operation,
                actor,
                power:
                    5
            });


        assert.deepEqual(
            applications,
            [
                {
                    power:
                        5,

                    range:
                        "contact",

                    cover:
                        null
                }
            ]
        );


        assert.deepEqual(
            result,
            {
                exploded:
                    true
            }
        );

    }
);

test(
    "applyRangedAttackExplosion exige une opération d'explosion",
    async () => {

        await assert.rejects(
            () =>
                applyRangedAttackExplosion({
                    operation: {
                        type:
                            "knockdown",

                        range:
                            "contact",

                        status:
                            "pending"
                    },

                    actor: {
                        async resolveExplosion() {}
                    },

                    power:
                        5
                }),
            {
                name:
                    "TypeError",

                message:
                    "Une opération d'explosion est requise."
            }
        );

    }
);


test(
    "applyRangedAttackExplosion exige une opération en attente",
    async () => {

        await assert.rejects(
            () =>
                applyRangedAttackExplosion({
                    operation: {
                        type:
                            "explosion",

                        range:
                            "contact",

                        status:
                            "blocked"
                    },

                    actor: {
                        async resolveExplosion() {}
                    },

                    power:
                        5
                }),
            {
                message:
                    "Une opération d'explosion doit être en attente avant son application."
            }
        );

    }
);


test(
    "applyRangedAttackExplosion exige la portée contact",
    async () => {

        await assert.rejects(
            () =>
                applyRangedAttackExplosion({
                    operation: {
                        type:
                            "explosion",

                        range:
                            "short",

                        status:
                            "pending"
                    },

                    actor: {
                        async resolveExplosion() {}
                    },

                    power:
                        5
                }),
            {
                name:
                    "TypeError",

                message:
                    "La portée de l'explosion doit être contact."
            }
        );

    }
);


test(
    "applyRangedAttackExplosion exige une Puissance strictement positive",
    async () => {

        await assert.rejects(
            () =>
                applyRangedAttackExplosion({
                    operation: {
                        type:
                            "explosion",

                        range:
                            "contact",

                        status:
                            "pending"
                    },

                    actor: {
                        async resolveExplosion() {}
                    },

                    power:
                        0
                }),
            {
                name:
                    "TypeError",

                message:
                    "La Puissance de l'explosion doit être un entier strictement positif."
            }
        );

    }
);


test(
    "applyRangedAttackExplosion exige une cible capable de résoudre une explosion",
    async () => {

        await assert.rejects(
            () =>
                applyRangedAttackExplosion({
                    operation: {
                        type:
                            "explosion",

                        range:
                            "contact",

                        status:
                            "pending"
                    },

                    actor: {},

                    power:
                        5
                }),
            {
                name:
                    "TypeError",

                message:
                    "Une cible capable de résoudre une explosion est requise."
            }
        );

    }
);

test(
    "applyRangedAttackApplicationLedger applique une explosion en attente",
    async () => {

        const applications = [];

        const actor = {

            items: {
                get() {
                    return undefined;
                }
            },

            async resolveExplosion({
                power,
                range,
                cover
            }) {

                applications.push({
                    power,
                    range,
                    cover
                });

            }

        };


        const ledger = {
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
        };


        await applyRangedAttackApplicationLedger({
            ledger,
            actor,

            explosion: {
                power:
                    5,

                cover:
                    null
            }
        });


        assert.deepEqual(
            applications,
            [
                {
                    power:
                        5,

                    range:
                        "contact",

                    cover:
                        null
                }
            ]
        );

    }
);


test(
    "applyRangedAttackApplicationLedger rejette une portée d'explosion invalide avant toute mutation",
    async () => {

        const applications = [];

        const actor = {

            items: {
                get() {
                    return undefined;
                }
            },

            async takeAttributeDamage() {
                applications.push(
                    "attribute-damage"
                );
            },

            async resolveExplosion() {
                applications.push(
                    "explosion"
                );
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
                        2,

                    status:
                        "pending"
                },

                {
                    type:
                        "explosion",

                    range:
                        "short",

                    status:
                        "pending"
                }
            ]
        };


        await assert.rejects(
            () =>
                applyRangedAttackApplicationLedger({
                    ledger,
                    actor,

                    explosion: {
                        power:
                            5,

                        cover:
                            null
                    }
                }),
            {
                name:
                    "TypeError",

                message:
                    "La portée de l'explosion doit être contact."
            }
        );


        assert.deepEqual(
            applications,
            []
        );

    }
);


test(
    "applyRangedAttackApplicationLedger rejette un contexte d'explosion invalide avant toute mutation",
    async () => {

        const applications = [];

        const actor = {

            items: {
                get() {
                    return undefined;
                }
            },

            async takeAttributeDamage() {
                applications.push(
                    "attribute-damage"
                );
            },

            async resolveExplosion() {
                applications.push(
                    "explosion"
                );
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
                        2,

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
        };


        await assert.rejects(
            () =>
                applyRangedAttackApplicationLedger({
                    ledger,
                    actor,

                    explosion: {
                        power:
                            0,

                        cover:
                            null
                    }
                }),
            {
                name:
                    "TypeError",

                message:
                    "La Puissance de l'explosion doit être un entier strictement positif."
            }
        );


        assert.deepEqual(
            applications,
            []
        );

    }
);

test(
    "applyRangedAttackApplicationLedger applique l'explosion après les conséquences directes indépendamment de l'ordre du ledger",
    async () => {

        const applications = [];


        const protectionItem = {

            id:
                "armor-1",

            type:
                "armor",

            system: {

                protection: {

                    current:
                        3

                }

            },

            async update() {

                applications.push(
                    "protection"
                );

            }

        };


        const actor = {

            items: {

                get(itemId) {

                    if (
                        itemId ===
                            "armor-1"
                    ) {
                        return protectionItem;
                    }

                    return undefined;

                }

            },


            async takeAttributeDamage(
                attribute,
                amount
            ) {

                applications.push(
                    `${attribute}:${amount}`
                );

            },


            async applyKnockdown() {

                applications.push(
                    "knockdown"
                );

            },


            async resolveExplosion({
                power,
                range,
                cover
            }) {

                applications.push(
                    `explosion:${power}:${range}`
                );

            }

        };


        const attacker = {
            id:
                "attacker-1"
        };

        const combat = {
            id:
                "combat-1"
        };

        const scheduleInitiativeSwap =
            async (
                currentCombat,
                currentAttacker,
                currentTarget
            ) => {

                assert.equal(
                    currentCombat,
                    combat
                );

                assert.equal(
                    currentAttacker,
                    attacker
                );

                assert.equal(
                    currentTarget,
                    actor
                );

                applications.push(
                    "initiative-swap:next-round"
                );

            };

        const validateInitiativeSwap =
            (
                currentCombat,
                currentAttacker,
                currentTarget
            ) => {

                assert.equal(
                    currentCombat,
                    combat
                );

                assert.equal(
                    currentAttacker,
                    attacker
                );

                assert.equal(
                    currentTarget,
                    actor
                );

            };


        const ledger = {

            operations: [

                {
                    type:
                        "explosion",

                    range:
                        "contact",

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
                        "knockdown",

                    status:
                        "pending"
                },

                {
                    type:
                        "attribute-damage",

                    attribute:
                        "spirit",

                    amount:
                        1,

                    status:
                        "pending"
                },

                {
                    type:
                        "protection-damage",

                    itemId:
                        "armor-1",

                    amount:
                        1,

                    status:
                        "pending"
                },

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

        };


        await applyRangedAttackApplicationLedger({
            ledger,
            actor,
            combat,
            attacker,
            scheduleInitiativeSwap,
            validateInitiativeSwap,

            explosion: {
                power:
                    5,

                cover:
                    null
            }
        });


        assert.deepEqual(
            applications,
            [
                "protection",
                "spirit:1",
                "vigor:2",
                "knockdown",
                "initiative-swap:next-round",
                "explosion:5:contact"
            ]
        );

    }
);

test(
    "applyRangedAttackApplicationLedger refuse une Protection introuvable avant toute mutation",
    async () => {

        const applications = [];


        const actor = {

            items: {

                get() {
                    return undefined;
                }

            },


            async takeAttributeDamage(
                attribute,
                amount
            ) {

                applications.push(
                    `${attribute}:${amount}`
                );

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
                        2,

                    status:
                        "pending"
                },

                {
                    type:
                        "protection-damage",

                    itemId:
                        "armor-missing",

                    amount:
                        1,

                    status:
                        "pending"
                }

            ]

        };


        await assert.rejects(
            () =>
                applyRangedAttackApplicationLedger({
                    ledger,
                    actor
                }),
            {
                message:
                    "L'Item de Protection désigné par l'opération est introuvable sur la cible."
            }
        );


        assert.deepEqual(
            applications,
            []
        );

    }
);

test(
    "applyRangedAttackApplicationLedger refuse une Protection invalide avant toute mutation",
    async () => {

        const applications = [];


        const validProtectionItem = {

            id:
                "armor-valid",

            type:
                "armor",

            system: {

                protection: {

                    current:
                        3

                }

            },

            async update() {

                applications.push(
                    "valid-protection"
                );

            }

        };


        const invalidProtectionItem = {

            id:
                "armor-invalid",

            type:
                "equipment",

            system: {

                protection: {

                    current:
                        3

                }

            },

            async update() {

                applications.push(
                    "invalid-protection"
                );

            }

        };


        const actor = {

            items: {

                get(itemId) {

                    if (
                        itemId ===
                            "armor-valid"
                    ) {
                        return validProtectionItem;
                    }


                    if (
                        itemId ===
                            "armor-invalid"
                    ) {
                        return invalidProtectionItem;
                    }


                    return undefined;

                }

            }

        };


        const ledger = {

            operations: [

                {
                    type:
                        "protection-damage",

                    itemId:
                        "armor-valid",

                    amount:
                        1,

                    status:
                        "pending"
                },

                {
                    type:
                        "protection-damage",

                    itemId:
                        "armor-invalid",

                    amount:
                        1,

                    status:
                        "pending"
                }

            ]

        };


        await assert.rejects(
            () =>
                applyRangedAttackApplicationLedger({
                    ledger,
                    actor
                }),
            {
                name:
                    "TypeError",

                message:
                    "L'Item de Protection doit être une armure."
            }
        );


        assert.deepEqual(
            applications,
            []
        );

    }
);

test(
    "applyRangedAttackApplicationLedger refuse des dégâts de Protection invalides avant toute mutation",
    async () => {

        const applications = [];


        const firstProtectionItem = {

            id:
                "armor-first",

            type:
                "armor",

            system: {
                protection: {
                    current:
                        3
                }
            },

            async update() {

                applications.push(
                    "first-protection"
                );

            }

        };


        const secondProtectionItem = {

            id:
                "armor-second",

            type:
                "armor",

            system: {
                protection: {
                    current:
                        3
                }
            },

            async update() {

                applications.push(
                    "second-protection"
                );

            }

        };


        const actor = {

            items: {

                get(itemId) {

                    if (
                        itemId ===
                            "armor-first"
                    ) {
                        return firstProtectionItem;
                    }


                    if (
                        itemId ===
                            "armor-second"
                    ) {
                        return secondProtectionItem;
                    }


                    return undefined;

                }

            }

        };


        const ledger = {

            operations: [

                {
                    type:
                        "protection-damage",

                    itemId:
                        "armor-first",

                    amount:
                        1,

                    status:
                        "pending"
                },

                {
                    type:
                        "protection-damage",

                    itemId:
                        "armor-second",

                    amount:
                        -1,

                    status:
                        "pending"
                }

            ]

        };


        await assert.rejects(
            () =>
                applyRangedAttackApplicationLedger({
                    ledger,
                    actor
                }),
            TypeError
        );


        assert.deepEqual(
            applications,
            []
        );

    }
);

test(
    "applyRangedAttackDisarm applique le désarmement de l'Item choisi",
    async () => {

        const applications = [];


        const item = {
            id:
                "weapon-1"
        };


        const actor = {

            items: {

                get(itemId) {

                    if (
                        itemId ===
                            "weapon-1"
                    ) {
                        return item;
                    }

                    return undefined;

                }

            },


            async applyDisarm(
                disarmItem
            ) {

                applications.push(
                    disarmItem.id
                );

                return {
                    applied:
                        true
                };

            }

        };


        const operation = {

            type:
                "disarm",

            itemId:
                "weapon-1",

            status:
                "pending"

        };


        const result =
            await applyRangedAttackDisarm({
                operation,
                actor
            });


        assert.deepEqual(
            applications,
            [
                "weapon-1"
            ]
        );


        assert.deepEqual(
            result,
            {
                applied:
                    true
            }
        );

    }
);

test(
    "applyRangedAttackDisarm refuse une opération qui n'est pas un désarmement",
    async () => {

        const actor = {

            items: {

                get() {
                    return {
                        id:
                            "weapon-1"
                    };
                }

            },

            async applyDisarm() {
                throw new Error(
                    "applyDisarm ne doit pas être appelé."
                );
            }

        };


        const operation = {

            type:
                "knockdown",

            itemId:
                "weapon-1",

            status:
                "pending"

        };


        await assert.rejects(
            () =>
                applyRangedAttackDisarm({
                    operation,
                    actor
                }),
            {
                name:
                    "TypeError",

                message:
                    "Une opération de désarmement est requise."
            }
        );

    }
);

test(
    "applyRangedAttackDisarm refuse une opération de désarmement bloquée",
    async () => {

        const actor = {

            items: {

                get() {
                    return {
                        id:
                            "weapon-1"
                    };
                }

            },

            async applyDisarm() {
                throw new Error(
                    "applyDisarm ne doit pas être appelé."
                );
            }

        };


        const operation = {

            type:
                "disarm",

            itemId:
                "weapon-1",

            status:
                "blocked"

        };


        await assert.rejects(
            () =>
                applyRangedAttackDisarm({
                    operation,
                    actor
                }),
            {
                name:
                    "Error",

                message:
                    "Une opération de désarmement doit être en attente avant son application."
            }
        );

    }
);

test(
    "applyRangedAttackDisarm refuse un Item introuvable sur la cible",
    async () => {

        const actor = {

            items: {

                get() {
                    return undefined;
                }

            },

            async applyDisarm() {
                throw new Error(
                    "applyDisarm ne doit pas être appelé."
                );
            }

        };


        const operation = {

            type:
                "disarm",

            itemId:
                "weapon-missing",

            status:
                "pending"

        };


        await assert.rejects(
            () =>
                applyRangedAttackDisarm({
                    operation,
                    actor
                }),
            {
                name:
                    "Error",

                message:
                    "L'Item à désarmer est introuvable sur la cible."
            }
        );

    }
);

test(
    "applyRangedAttackDisarm refuse une cible incapable d'appliquer un désarmement",
    async () => {

        const item = {
            id:
                "weapon-1"
        };


        const actor = {

            items: {

                get(itemId) {

                    if (
                        itemId ===
                            "weapon-1"
                    ) {
                        return item;
                    }

                    return undefined;

                }

            }

        };


        const operation = {

            type:
                "disarm",

            itemId:
                "weapon-1",

            status:
                "pending"

        };


        await assert.rejects(
            () =>
                applyRangedAttackDisarm({
                    operation,
                    actor
                }),
            {
                name:
                    "TypeError",

                message:
                    "Une cible capable d'appliquer un désarmement est requise."
            }
        );

    }
);

test(
    "applyRangedAttackApplicationLedger applique un désarmement en attente",
    async () => {

        const applications = [];


        const item = {
            id:
                "weapon-1"
        };


        const actor = {

            items: {

                get(itemId) {

                    if (
                        itemId ===
                            "weapon-1"
                    ) {
                        return item;
                    }

                    return undefined;

                }

            },


            async applyDisarm(
                disarmItem
            ) {

                applications.push(
                    disarmItem.id
                );

                return {
                    applied:
                        true
                };

            }

        };


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


        await applyRangedAttackApplicationLedger({
            ledger,
            actor
        });


        assert.deepEqual(
            applications,
            [
                "weapon-1"
            ]
        );

    }
);

test(
    "applyRangedAttackApplicationLedger refuse un désarmement invalide avant toute mutation",
    async () => {

        let vigorUpdates = 0;


        const actor = {

            system: {

                attributes: {

                    vigor: {
                        value: 5
                    }

                }

            },


            items: {

                get() {
                    return undefined;
                }

            },


            async update() {

                vigorUpdates += 1;

            },


            async applyDisarm() {

                throw new Error(
                    "applyDisarm ne doit pas être appelé."
                );

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
                        "disarm",

                    itemId:
                        "weapon-missing",

                    status:
                        "pending"
                }

            ]

        };


        await assert.rejects(
            () =>
                applyRangedAttackApplicationLedger({
                    ledger,
                    actor
                }),
            {
                name:
                    "Error",

                message:
                    "L'Item à désarmer est introuvable sur la cible."
            }
        );


        assert.equal(
            vigorUpdates,
            0
        );

    }
);

test(
    "applyRangedAttackApplicationLedger ne désarme pas avant la fin des prévalidations",
    async () => {

        let disarmApplications = 0;


        const item = {
            id:
                "weapon-1"
        };


        const actor = {

            items: {

                get(itemId) {

                    if (
                        itemId ===
                            "weapon-1"
                    ) {
                        return item;
                    }

                    return undefined;

                }

            },


            async applyDisarm() {

                disarmApplications += 1;

                return {
                    applied:
                        true
                };

            }

        };


        const ledger = {

            operations: [

                {
                    type:
                        "disarm",

                    itemId:
                        "weapon-1",

                    status:
                        "pending"
                },

                {
                    type:
                        "initiative-swap",

                    timing:
                        "invalid-timing",

                    status:
                        "pending"
                }

            ]

        };


        await assert.rejects(
            () =>
                applyRangedAttackApplicationLedger({
                    ledger,
                    actor
                }),
            {
                name:
                    "TypeError",

                message:
                    "Le timing d'échange d'initiative doit être next-round."
            }
        );


        assert.equal(
            disarmApplications,
            0
        );

    }
);

test(
    "applyRangedAttackApplicationLedger applique le désarmement après les dégâts d'Attribut et avant le renversement indépendamment de l'ordre du ledger",
    async () => {

        const applications = [];


        const item = {
            id:
                "weapon-1"
        };


        const actor = {

            system: {

                attributes: {

                    vigor: {
                        value: 5
                    }

                }

            },


            items: {

                get(itemId) {

                    if (
                        itemId ===
                            "weapon-1"
                    ) {
                        return item;
                    }

                    return undefined;

                }

            },


            async takeAttributeDamage() {

                applications.push(
                    "attribute-damage"
                );

            },


            async applyDisarm(
                disarmItem
            ) {

                assert.equal(
                    disarmItem,
                    item
                );

                applications.push(
                    "disarm"
                );

                return {
                    applied:
                        true
                };

            },


            async applyKnockdown() {

                applications.push(
                    "knockdown"
                );

            }

        };


        const ledger = {

            /*
             * Ordre volontairement inverse
             * de l'ordre d'application P6 attendu.
             */
            operations: [

                {
                    type:
                        "knockdown",

                    status:
                        "pending"
                },

                {
                    type:
                        "disarm",

                    itemId:
                        "weapon-1",

                    status:
                        "pending"
                },

                {
                    type:
                        "attribute-damage",

                    attribute:
                        "vigor",

                    amount:
                        1,

                    status:
                        "pending"
                }

            ]

        };


        await applyRangedAttackApplicationLedger({
            ledger,
            actor
        });


        assert.deepEqual(
            applications,
            [
                "attribute-damage",
                "disarm",
                "knockdown"
            ]
        );

    }
);

test(
    "pipeline renversement : une opération en attente est applicable directement par P6",
    async () => {

        const applications = [];


        const actor = {

            async applyKnockdown() {

                applications.push(
                    "knockdown"
                );

            }

        };


        const ledger = {

            operations: [

                {
                    type:
                        "knockdown",

                    status:
                        "pending"
                }

            ]

        };


        await applyRangedAttackApplicationLedger({
            ledger,
            actor
        });


        assert.deepEqual(
            applications,
            [
                "knockdown"
            ]
        );

    }
);



test(
    "pipeline Protection : un choix bloqué devient applicable par P6",
    async () => {

        const updates = [];


        const bodyArmor = {

            id:
                "body-armor-1",

            type:
                "armor",

            system: {

                protection: {
                    current: 4
                },

                resilience:
                    false

            },


            async update(
                data
            ) {

                updates.push(
                    data
                );

            }

        };


        const helmet = {

            id:
                "helmet-1",

            type:
                "armor",

            system: {

                protection: {
                    current: 2
                },

                resilience:
                    false

            },


            async update() {

                throw new Error(
                    "Le casque ne doit pas être modifié."
                );

            }

        };


        const actor = {

            items: {

                get(itemId) {

                    if (
                        itemId ===
                            "body-armor-1"
                    ) {
                        return bodyArmor;
                    }

                    if (
                        itemId ===
                            "helmet-1"
                    ) {
                        return helmet;
                    }

                    return undefined;

                }

            }

        };


        const protectionResult = {

            source: {

                type:
                    "worn",

                bodyArmor: {
                    itemId:
                        "body-armor-1"
                },

                helmet: {
                    itemId:
                        "helmet-1"
                }

            }

        };


        const blockedLedger = {

            operations: [

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
                }

            ]

        };


        const resolvedLedger =
            resolveRangedAttackProtectionChoice({
                ledger:
                    blockedLedger,

                protectionResult,

                target:
                    "body"
            });


        assert.deepEqual(
            resolvedLedger,
            {
                operations: [

                    {
                        type:
                            "protection-damage",

                        amount:
                            1,

                        target:
                            "body",

                        itemId:
                            "body-armor-1",

                        status:
                            "pending"
                    }

                ]
            }
        );


        await applyRangedAttackApplicationLedger({
            ledger:
                resolvedLedger,

            actor
        });


        assert.equal(
            updates.length,
            1
        );

    }
);

test(
    "applyRangedAttackInitiativeSwap programme l'échange entre l'attaquant et la cible",
    async () => {

        const operation = {
            type:
                "initiative-swap",

            timing:
                "next-round",

            status:
                "pending"
        };

        const combat = {
            id:
                "combat-1"
        };

        const attacker = {
            id:
                "attacker-1"
        };

        const target = {
            id:
                "target-1"
        };


        let receivedCombat =
            null;

        let receivedAttacker =
            null;

        let receivedTarget =
            null;


        await applyRangedAttackInitiativeSwap({
            operation,
            combat,
            attacker,
            target,

            scheduleInitiativeSwap:
                async (
                    currentCombat,
                    currentAttacker,
                    currentTarget
                ) => {

                    receivedCombat =
                        currentCombat;

                    receivedAttacker =
                        currentAttacker;

                    receivedTarget =
                        currentTarget;

                }
        });


        assert.equal(
            receivedCombat,
            combat
        );

        assert.equal(
            receivedAttacker,
            attacker
        );

        assert.equal(
            receivedTarget,
            target
        );

    }
);

test(
    "applyRangedAttackApplicationLedger exige l'attaquant avant toute mutation lorsqu'un échange d'initiative est prévu",
    async () => {

        const mutations = [];

        const actor = {
            async takeAttributeDamage(
                attribute,
                amount
            ) {
                mutations.push(
                    `${attribute}:${amount}`
                );
            }
        };

        const combat = {
            id:
                "combat-1"
        };

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


        await assert.rejects(
            () =>
                applyRangedAttackApplicationLedger({
                    ledger,
                    actor,
                    combat,

                    scheduleInitiativeSwap:
                        async () => {}
                }),
            {
                name:
                    "TypeError",

                message:
                    "Un attaquant est requis pour programmer un échange d'initiative."
            }
        );


        assert.deepEqual(
            mutations,
            []
        );

    }
);


test(
    "applyRangedAttackApplicationLedger valide les participants de l'échange d'initiative avant toute mutation",
    async () => {

        const mutations = [];

        const actor = {
            id:
                "target-1",

            async takeAttributeDamage(
                attribute,
                amount
            ) {
                mutations.push(
                    `${attribute}:${amount}`
                );
            }
        };

        const attacker = {
            id:
                "attacker-1"
        };

        const combat = {
            id:
                "combat-1"
        };

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

        const validateInitiativeSwap =
            () => {
                throw new Error(
                    "L'attaquant ne participe pas au combat."
                );
            };

        const scheduleInitiativeSwap =
            async () => {
                mutations.push(
                    "initiative"
                );
            };


        await assert.rejects(
            () =>
                applyRangedAttackApplicationLedger({
                    ledger,
                    actor,
                    combat,
                    attacker,
                    validateInitiativeSwap,
                    scheduleInitiativeSwap
                }),
            {
                name:
                    "Error",

                message:
                    "L'attaquant ne participe pas au combat."
            }
        );


        assert.deepEqual(
            mutations,
            []
        );

    }
);

