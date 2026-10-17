import { test } from "node:test";
import assert from "node:assert/strict";

import {
    MeleeBlockPreparationService
} from "../../src/combat/melee-block-preparation-service.mjs";

import {
    MeleeAttackWorkflow
} from "../../src/combat/melee-attack-workflow.mjs";


/**
 * Ce fichier ne couvrait PAS
 * MeleeBlockPreparationService avant ce chantier.
 *
 * Il verrouille son comportement actuel : validation
 * du workflow, résolution attaquant/défenseur, arme
 * de blocage équipée, talents du défenseur et
 * délégation à ActionPreparationService.
 */


function createActorStub(
    id,
    {
        items = []
    } = {}
) {

    const itemMap =
        new Map(
            items.map(
                item => [item.id, item]
            )
        );

    /*
     * Une vraie EmbeddedCollection Foundry
     * itère sur ses VALEURS, contrairement
     * à un Map natif qui itère sur des
     * entrées [clé, valeur].
     *
     * On aligne le stub sur ce comportement,
     * puisque getActorTalents/getEquippedMeleeWeapon
     * font Array.from(actor.items ?? []).
     */
    itemMap[Symbol.iterator] =
        itemMap.values.bind(
            itemMap
        );

    return {

        id,

        system: {

            attributes: {

                vigor: {
                    value: 3
                }

            },

            skills: {

                closeCombat: 2

            }

        },

        items:
            itemMap

    };

}


function createWeaponStub(
    id = "weapon-1",
    {
        equipped = true,
        category = "melee"
    } = {}
) {

    return {

        id,

        type:
            "weapon",

        name:
            "Couteau",

        system: {

            equipped,

            category

        }

    };

}


function createTalentStub(
    id,
    {
        key = "talent-key",
        level = 1,
        configuration = {}
    } = {}
) {

    return {

        id,

        type:
            "talent",

        name:
            `Talent ${id}`,

        system: {

            key,

            level,

            configuration

        }

    };

}


function createCombatStub(
    workflow
) {

    const stored = {

        [workflow.id]:
            workflow.toObject()

    };

    return {

        id:
            "combat-1",

        getFlag(
            scope
        ) {

            return (
                scope === "metro-2033-yze"
                    ? stored
                    : undefined
            );

        }

    };

}


function withGameActors(
    actors,
    callback
) {

    globalThis.game = {

        actors: {

            get(
                id
            ) {

                return (
                    actors[id]
                    ?? null
                );

            }

        }

    };


    try {

        return callback();

    }
    finally {

        delete globalThis.game;

    }

}


function createAwaitingBlockWorkflow(
    {
        weaponId = "attacker-weapon-1"
    } = {}
) {

    const workflow =
        new MeleeAttackWorkflow({

            id:
                "workflow-1",

            attackerId:
                "actor-attacker",

            defenderId:
                "actor-defender",

            weaponId,

            canBlock:
                true

        });


    workflow.chooseDefense(
        "block"
    );


    return workflow;

}


test(
    "MeleeBlockPreparationService.create : un Combat Foundry est requis",
    () => {

        assert.throws(
            () => {

                MeleeBlockPreparationService.create(
                    null,
                    createAwaitingBlockWorkflow()
                );

            },
            /Combat Foundry est requis/
        );

    }
);


test(
    "MeleeBlockPreparationService.create : un workflow est requis",
    () => {

        const workflow =
            createAwaitingBlockWorkflow();

        const combat =
            createCombatStub(
                workflow
            );


        assert.throws(
            () => {

                MeleeBlockPreparationService.create(
                    combat,
                    null
                );

            },
            /workflow de mêlée est requis/
        );

    }
);


test(
    "MeleeBlockPreparationService.create : le workflow doit être retrouvé dans le Combat",
    () => {

        const workflow =
            createAwaitingBlockWorkflow();

        const combat =
            createCombatStub(
                workflow
            );

        const foreignWorkflow =
            createAwaitingBlockWorkflow();

        foreignWorkflow.id =
            "workflow-introuvable";


        assert.throws(
            () => {

                MeleeBlockPreparationService.create(
                    combat,
                    foreignWorkflow
                );

            },
            /workflow de mêlée est introuvable dans le Combat/
        );

    }
);


test(
    "MeleeBlockPreparationService.create : le workflow doit attendre la préparation d'un blocage",
    () => {

        const workflow =
            new MeleeAttackWorkflow({

                id:
                    "workflow-1",

                attackerId:
                    "actor-attacker",

                defenderId:
                    "actor-defender",

                weaponId:
                    "weapon-1",

                canBlock:
                    true

            });

        /*
         * Aucune décision de défense n'a
         * encore été prise : le workflow
         * reste en AWAITING_DEFENSE.
         */
        const combat =
            createCombatStub(
                workflow
            );


        assert.throws(
            () => {

                MeleeBlockPreparationService.create(
                    combat,
                    workflow
                );

            },
            /n'attend pas la préparation d'un blocage/
        );

    }
);


test(
    "MeleeBlockPreparationService.create : l'attaquant du workflow doit être résolu",
    () => {

        const defender =
            createActorStub(
                "actor-defender"
            );

        const workflow =
            createAwaitingBlockWorkflow();

        const combat =
            createCombatStub(
                workflow
            );


        withGameActors(
            {

                "actor-defender":
                    defender

                /*
                 * "actor-attacker" volontairement
                 * absent.
                 */

            },
            () => {

                assert.throws(
                    () => {

                        MeleeBlockPreparationService.create(
                            combat,
                            workflow
                        );

                    },
                    /attaquant du workflow est introuvable/
                );

            }
        );

    }
);


test(
    "MeleeBlockPreparationService.create : le défenseur du workflow doit être résolu",
    () => {

        const attacker =
            createActorStub(
                "actor-attacker"
            );

        const workflow =
            createAwaitingBlockWorkflow();

        const combat =
            createCombatStub(
                workflow
            );


        withGameActors(
            {

                "actor-attacker":
                    attacker

                /*
                 * "actor-defender" volontairement
                 * absent.
                 */

            },
            () => {

                assert.throws(
                    () => {

                        MeleeBlockPreparationService.create(
                            combat,
                            workflow
                        );

                    },
                    /défenseur du workflow est introuvable/
                );

            }
        );

    }
);


test(
    "MeleeBlockPreparationService.create : construit une préparation complète pour un défenseur sans arme ni talent",
    () => {

        const attacker =
            createActorStub(
                "actor-attacker"
            );

        const defender =
            createActorStub(
                "actor-defender"
            );

        const workflow =
            createAwaitingBlockWorkflow();

        const combat =
            createCombatStub(
                workflow
            );


        withGameActors(
            {

                "actor-attacker":
                    attacker,

                "actor-defender":
                    defender

            },
            () => {

                const result =
                    MeleeBlockPreparationService.create(
                        combat,
                        workflow
                    );


                assert.equal(
                    result.attacker,
                    attacker
                );

                assert.equal(
                    result.defender,
                    defender
                );

                assert.equal(
                    result.weapon,
                    null
                );

                assert.deepEqual(
                    result.talents,
                    []
                );

                assert.equal(
                    result.context.actionType,
                    "melee-block"
                );

                assert.equal(
                    result.context.actorId,
                    "actor-defender"
                );

                assert.equal(
                    result.context.opponentId,
                    "actor-attacker"
                );

                assert.equal(
                    result.context.attribute,
                    "vigor"
                );

                assert.equal(
                    result.context.skill,
                    "closeCombat"
                );

                assert.equal(
                    result.context.weapon,
                    null
                );

                assert.equal(
                    result.context.metadata.combatId,
                    "combat-1"
                );

                assert.equal(
                    result.context.metadata.workflowId,
                    workflow.id
                );

                assert.equal(
                    result.context.metadata.attackerId,
                    "actor-attacker"
                );

                assert.equal(
                    result.context.metadata.defenderId,
                    "actor-defender"
                );

                assert.ok(
                    result.preparation
                );

                assert.equal(
                    result.workflow.id,
                    workflow.id
                );

            }
        );

    }
);


test(
    "MeleeBlockPreparationService.create : retrouve l'arme de mêlée équipée du défenseur et la normalise",
    () => {

        const attacker =
            createActorStub(
                "actor-attacker"
            );

        const equippedMeleeWeapon =
            createWeaponStub(
                "defender-weapon-1",
                {
                    equipped: true,
                    category: "melee"
                }
            );

        const unequippedWeapon =
            createWeaponStub(
                "defender-weapon-2",
                {
                    equipped: false,
                    category: "melee"
                }
            );

        const defender =
            createActorStub(
                "actor-defender",
                {
                    items: [
                        unequippedWeapon,
                        equippedMeleeWeapon
                    ]
                }
            );

        const workflow =
            createAwaitingBlockWorkflow();

        const combat =
            createCombatStub(
                workflow
            );


        withGameActors(
            {

                "actor-attacker":
                    attacker,

                "actor-defender":
                    defender

            },
            () => {

                const result =
                    MeleeBlockPreparationService.create(
                        combat,
                        workflow
                    );


                assert.equal(
                    result.weapon,
                    equippedMeleeWeapon
                );

                assert.deepEqual(
                    result.context.weapon,
                    {

                        id:
                            "defender-weapon-1",

                        name:
                            "Couteau",

                        category:
                            "melee",

                        type:
                            null,

                        isFirearm:
                            false,

                        isHeavyWeapon:
                            false,

                        isMeleeWeapon:
                            true,

                        isRangedWeapon:
                            false

                    }
                );

            }
        );

    }
);


test(
    "MeleeBlockPreparationService.create : ignore une arme non équipée ou non de mêlée",
    () => {

        const attacker =
            createActorStub(
                "actor-attacker"
            );

        const unequippedMeleeWeapon =
            createWeaponStub(
                "defender-weapon-1",
                {
                    equipped: false,
                    category: "melee"
                }
            );

        const equippedRangedWeapon =
            createWeaponStub(
                "defender-weapon-2",
                {
                    equipped: true,
                    category: "ranged"
                }
            );

        const defender =
            createActorStub(
                "actor-defender",
                {
                    items: [
                        unequippedMeleeWeapon,
                        equippedRangedWeapon
                    ]
                }
            );

        const workflow =
            createAwaitingBlockWorkflow();

        const combat =
            createCombatStub(
                workflow
            );


        withGameActors(
            {

                "actor-attacker":
                    attacker,

                "actor-defender":
                    defender

            },
            () => {

                const result =
                    MeleeBlockPreparationService.create(
                        combat,
                        workflow
                    );


                assert.equal(
                    result.weapon,
                    null
                );

                assert.equal(
                    result.context.weapon,
                    null
                );

            }
        );

    }
);


test(
    "MeleeBlockPreparationService.create : collecte les talents du défenseur avec leurs valeurs par défaut",
    () => {

        const attacker =
            createActorStub(
                "actor-attacker"
            );

        const talentWithDefaults =
            {

                id:
                    "talent-1",

                type:
                    "talent",

                name:
                    "Sang-froid"

                /*
                 * Aucun "system" : les valeurs par
                 * défaut (key, level, configuration)
                 * doivent être utilisées.
                 */

            };

        const talentComplet =
            createTalentStub(
                "talent-2",
                {
                    key: "iron-fist",
                    level: 3,
                    configuration: {
                        bonus: 1
                    }
                }
            );

        const defender =
            createActorStub(
                "actor-defender",
                {
                    items: [
                        talentWithDefaults,
                        talentComplet
                    ]
                }
            );

        const workflow =
            createAwaitingBlockWorkflow();

        const combat =
            createCombatStub(
                workflow
            );


        withGameActors(
            {

                "actor-attacker":
                    attacker,

                "actor-defender":
                    defender

            },
            () => {

                const result =
                    MeleeBlockPreparationService.create(
                        combat,
                        workflow
                    );


                assert.equal(
                    result.talents.length,
                    2
                );

                assert.deepEqual(
                    result.talents[0],
                    {

                        id:
                            "talent-1",

                        name:
                            "Sang-froid",

                        key:
                            "",

                        level:
                            1,

                        configuration:
                            {}

                    }
                );

                assert.deepEqual(
                    result.talents[1],
                    {

                        id:
                            "talent-2",

                        name:
                            "Talent talent-2",

                        key:
                            "iron-fist",

                        level:
                            3,

                        configuration:
                            {
                                bonus: 1
                            }

                    }
                );

            }
        );

    }
);


test(
    "MeleeBlockPreparationService.create : ne collecte aucun Item qui n'est pas un talent",
    () => {

        const attacker =
            createActorStub(
                "actor-attacker"
            );

        const weapon =
            createWeaponStub(
                "defender-weapon-1"
            );

        const talent =
            createTalentStub(
                "talent-1"
            );

        const defender =
            createActorStub(
                "actor-defender",
                {
                    items: [
                        weapon,
                        talent
                    ]
                }
            );

        const workflow =
            createAwaitingBlockWorkflow();

        const combat =
            createCombatStub(
                workflow
            );


        withGameActors(
            {

                "actor-attacker":
                    attacker,

                "actor-defender":
                    defender

            },
            () => {

                const result =
                    MeleeBlockPreparationService.create(
                        combat,
                        workflow
                    );


                assert.equal(
                    result.talents.length,
                    1
                );

                assert.equal(
                    result.talents[0].id,
                    "talent-1"
                );

            }
        );

    }
);


test(
    "MeleeBlockPreparationService.create : transmet circumstances/effects/equipmentModifiers/manualBonus/manualPenalty à la préparation",
    () => {

        const attacker =
            createActorStub(
                "actor-attacker"
            );

        const defender =
            createActorStub(
                "actor-defender"
            );

        const workflow =
            createAwaitingBlockWorkflow();

        const combat =
            createCombatStub(
                workflow
            );


        withGameActors(
            {

                "actor-attacker":
                    attacker,

                "actor-defender":
                    defender

            },
            () => {

                const result =
                    MeleeBlockPreparationService.create(
                        combat,
                        workflow,
                        {

                            manualBonus:
                                2,

                            manualPenalty:
                                1

                        }
                    );


                const manualBonusModifier =
                    result.preparation
                        .modifiers
                        .find(
                            modifier =>
                                modifier.id
                                === "manual-bonus"
                        );

                const manualPenaltyModifier =
                    result.preparation
                        .modifiers
                        .find(
                            modifier =>
                                modifier.id
                                === "manual-penalty"
                        );


                assert.equal(
                    manualBonusModifier.value,
                    2
                );

                assert.equal(
                    manualPenaltyModifier.value,
                    -1
                );

            }
        );

    }
);
