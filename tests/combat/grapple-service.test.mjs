import { test } from "node:test";
import assert from "node:assert/strict";

import {
    GrappleService
} from "../../src/combat/grapple-service.mjs";


/**
 * Ce fichier verrouille le comportement actuel de
 * GrappleService (aucun test n'existait avant ce
 * chantier). Il ne modifie pas la source : il en
 * fige le contrat.
 */


async function withFoundryStub(
    callback
) {

    globalThis.foundry = {

        utils: {

            deepClone(
                value
            ) {

                return structuredClone(
                    value
                );

            },

            randomID() {

                return `id-${Math.random()}`;

            }

        }

    };


    try {

        return await callback();

    }
    finally {

        delete globalThis.foundry;

    }

}


function createCombatStub({
    combatants = [],
    round = 1
} = {}) {

    const storage = {};

    return {

        id:
            "combat-1",

        round,

        combatants,

        getFlag(
            scope,
            key
        ) {

            return (
                scope === "metro-2033-yze"
                    ? storage[key]
                    : undefined
            );

        },

        async setFlag(
            scope,
            key,
            value
        ) {

            storage[key] =
                structuredClone(
                    value
                );

        }

    };

}


function createActorStub({
    id,
    name,
    uuid = null,
    items = []
}) {

    const knockdownCalls = [];

    const disarmCalls = [];

    return {

        id,

        name,

        uuid,

        items,

        knockdownCalls,

        disarmCalls,

        async applyKnockdown() {

            knockdownCalls.push(
                true
            );

            return {
                applied: true
            };

        },

        async applyDisarm(
            item
        ) {

            disarmCalls.push(
                item
            );

            return {
                applied: true,

                itemId:
                    item.id
            };

        }

    };

}


function createCombatantStub(
    actorId
) {

    return {

        id:
            `combatant-${actorId}`,

        actorId

    };

}


function createWeaponItem({
    id,
    name,
    equipped = true,
    parentId = null
}) {

    return {

        id,

        name,

        type:
            "weapon",

        system: {
            equipped
        },

        parent:
            parentId
                ? { id: parentId }
                : null

    };

}


function buildBasicCombat() {

    const attacker =
        createActorStub({
            id: "actor-attacker",
            name: "Le saisisseur",
            uuid: "Actor.attacker"
        });

    const target =
        createActorStub({
            id: "actor-target",
            name: "La cible",
            uuid: "Actor.target"
        });

    const combat =
        createCombatStub({
            combatants: [
                createCombatantStub(
                    attacker.id
                ),

                createCombatantStub(
                    target.id
                )
            ]
        });

    return {
        attacker,
        target,
        combat
    };

}


// ============================================================
// getActiveGrapples
// ============================================================

test(
    "GrappleService.getActiveGrapples : retourne un tableau vide sans Combat",
    async () => {

        await withFoundryStub(
            async () => {

                assert.deepEqual(
                    GrappleService.getActiveGrapples(
                        null
                    ),
                    []
                );

            }
        );

    }
);


test(
    "GrappleService.getActiveGrapples : retourne un tableau vide si aucun flag n'est enregistré",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();

                assert.deepEqual(
                    GrappleService.getActiveGrapples(
                        combat
                    ),
                    []
                );

            }
        );

    }
);


// ============================================================
// establish
// ============================================================

test(
    "GrappleService.establish : refuse sans Combat actif",
    async () => {

        await withFoundryStub(
            async () => {

                const { attacker, target } =
                    buildBasicCombat();

                await assert.rejects(
                    () =>
                        GrappleService.establish({
                            combat: null,
                            attacker,
                            target
                        }),
                    /combat actif/
                );

            }
        );

    }
);


test(
    "GrappleService.establish : refuse sans saisisseur",
    async () => {

        await withFoundryStub(
            async () => {

                const { combat, target } =
                    buildBasicCombat();

                await assert.rejects(
                    () =>
                        GrappleService.establish({
                            combat,
                            attacker: null,
                            target
                        }),
                    TypeError
                );

            }
        );

    }
);


test(
    "GrappleService.establish : refuse sans cible",
    async () => {

        await withFoundryStub(
            async () => {

                const { combat, attacker } =
                    buildBasicCombat();

                await assert.rejects(
                    () =>
                        GrappleService.establish({
                            combat,
                            attacker,
                            target: null
                        }),
                    TypeError
                );

            }
        );

    }
);


test(
    "GrappleService.establish : refuse qu'un Actor se saisisse lui-même",
    async () => {

        await withFoundryStub(
            async () => {

                const { combat, attacker } =
                    buildBasicCombat();

                await assert.rejects(
                    () =>
                        GrappleService.establish({
                            combat,
                            attacker,
                            target: attacker
                        }),
                    /lui-même/
                );

            }
        );

    }
);


test(
    "GrappleService.establish : refuse si le saisisseur n'est pas dans le combat",
    async () => {

        await withFoundryStub(
            async () => {

                const { combat, target } =
                    buildBasicCombat();

                const outsider =
                    createActorStub({
                        id: "actor-outsider",
                        name: "Un inconnu"
                    });

                await assert.rejects(
                    () =>
                        GrappleService.establish({
                            combat,
                            attacker: outsider,
                            target
                        }),
                    /saisisseur n'est pas présent/
                );

            }
        );

    }
);


test(
    "GrappleService.establish : refuse si la cible n'est pas dans le combat",
    async () => {

        await withFoundryStub(
            async () => {

                const { combat, attacker } =
                    buildBasicCombat();

                const outsider =
                    createActorStub({
                        id: "actor-outsider",
                        name: "Un inconnu"
                    });

                await assert.rejects(
                    () =>
                        GrappleService.establish({
                            combat,
                            attacker,
                            target: outsider
                        }),
                    /cible n'est pas présente/
                );

            }
        );

    }
);


test(
    "GrappleService.establish : refuse si le saisisseur est déjà impliqué dans une saisie",
    async () => {

        await withFoundryStub(
            async () => {

                const { combat, attacker, target } =
                    buildBasicCombat();

                const third =
                    createActorStub({
                        id: "actor-third",
                        name: "Un troisième"
                    });

                combat.combatants.push(
                    createCombatantStub(
                        third.id
                    )
                );

                await GrappleService.establish({
                    combat,
                    attacker,
                    target
                });

                await assert.rejects(
                    () =>
                        GrappleService.establish({
                            combat,
                            attacker,
                            target: third
                        }),
                    /saisisseur est déjà impliqué/
                );

            }
        );

    }
);


test(
    "GrappleService.establish : refuse si la cible est déjà impliquée dans une saisie",
    async () => {

        await withFoundryStub(
            async () => {

                const { combat, attacker, target } =
                    buildBasicCombat();

                const third =
                    createActorStub({
                        id: "actor-third",
                        name: "Un troisième"
                    });

                combat.combatants.push(
                    createCombatantStub(
                        third.id
                    )
                );

                await GrappleService.establish({
                    combat,
                    attacker,
                    target
                });

                await assert.rejects(
                    () =>
                        GrappleService.establish({
                            combat,
                            attacker: third,
                            target
                        }),
                    /cible est déjà impliquée/
                );

            }
        );

    }
);


test(
    "GrappleService.establish : cas nominal sans arme équipée",
    async () => {

        await withFoundryStub(
            async () => {

                const { combat, attacker, target } =
                    buildBasicCombat();

                const result =
                    await GrappleService.establish({
                        combat,
                        attacker,
                        target
                    });

                assert.equal(
                    result.established,
                    true
                );

                assert.equal(
                    result.combatId,
                    combat.id
                );

                assert.equal(
                    result.createdRound,
                    combat.round
                );

                assert.equal(
                    result.state.active,
                    true
                );

                assert.equal(
                    result.state.attacker.actorId,
                    attacker.id
                );

                assert.equal(
                    result.state.target.actorId,
                    target.id
                );

                assert.equal(
                    result.disarm.applied,
                    false
                );

                assert.equal(
                    result.disarm.reason,
                    "no-equipped-weapon"
                );

                assert.equal(
                    attacker.knockdownCalls.length,
                    1
                );

                assert.equal(
                    target.knockdownCalls.length,
                    1
                );

                assert.equal(
                    target.disarmCalls.length,
                    0
                );


                const stored =
                    GrappleService.getActiveGrapples(
                        combat
                    );

                assert.equal(
                    stored.length,
                    1
                );

                assert.equal(
                    stored[0].id,
                    result.grappleId
                );

            }
        );

    }
);


test(
    "GrappleService.establish : désarme automatiquement l'unique arme équipée de la cible",
    async () => {

        await withFoundryStub(
            async () => {

                const { combat, attacker, target } =
                    buildBasicCombat();

                const knife =
                    createWeaponItem({
                        id: "item-knife",
                        name: "Couteau",
                        parentId: target.id
                    });

                target.items.push(
                    knife
                );

                const result =
                    await GrappleService.establish({
                        combat,
                        attacker,
                        target
                    });

                assert.equal(
                    result.disarm.applied,
                    true
                );

                assert.equal(
                    target.disarmCalls.length,
                    1
                );

                assert.equal(
                    target.disarmCalls[0].id,
                    knife.id
                );

            }
        );

    }
);


test(
    "GrappleService.establish : signale une sélection en attente si la cible a plusieurs armes équipées",
    async () => {

        await withFoundryStub(
            async () => {

                const { combat, attacker, target } =
                    buildBasicCombat();

                target.items.push(
                    createWeaponItem({
                        id: "item-knife",
                        name: "Couteau",
                        parentId: target.id
                    })
                );

                target.items.push(
                    createWeaponItem({
                        id: "item-pistol",
                        name: "Pistolet",
                        parentId: target.id
                    })
                );

                const result =
                    await GrappleService.establish({
                        combat,
                        attacker,
                        target
                    });

                assert.equal(
                    result.disarm.applied,
                    false
                );

                assert.equal(
                    result.disarm.pending,
                    true
                );

                assert.equal(
                    result.disarm.reason,
                    "held-weapon-selection-required"
                );

                assert.equal(
                    result.disarm.candidates.length,
                    2
                );

                assert.equal(
                    target.disarmCalls.length,
                    0
                );

            }
        );

    }
);


test(
    "GrappleService.establish : ignore les armes non équipées",
    async () => {

        await withFoundryStub(
            async () => {

                const { combat, attacker, target } =
                    buildBasicCombat();

                target.items.push(
                    createWeaponItem({
                        id: "item-spare",
                        name: "Arme rangée",
                        equipped: false,
                        parentId: target.id
                    })
                );

                const result =
                    await GrappleService.establish({
                        combat,
                        attacker,
                        target
                    });

                assert.equal(
                    result.disarm.reason,
                    "no-equipped-weapon"
                );

            }
        );

    }
);


test(
    "GrappleService.establish : accepte un disarmItem explicite appartenant à la cible",
    async () => {

        await withFoundryStub(
            async () => {

                const { combat, attacker, target } =
                    buildBasicCombat();

                const knife =
                    createWeaponItem({
                        id: "item-knife",
                        name: "Couteau",
                        parentId: target.id
                    });

                const pistol =
                    createWeaponItem({
                        id: "item-pistol",
                        name: "Pistolet",
                        parentId: target.id
                    });

                target.items.push(
                    knife,
                    pistol
                );

                const result =
                    await GrappleService.establish({
                        combat,
                        attacker,
                        target,
                        disarmItem: pistol
                    });

                assert.equal(
                    result.disarm.applied,
                    true
                );

                assert.equal(
                    target.disarmCalls[0].id,
                    pistol.id
                );

            }
        );

    }
);


test(
    "GrappleService.establish : refuse un disarmItem n'appartenant pas à la cible",
    async () => {

        await withFoundryStub(
            async () => {

                const { combat, attacker, target } =
                    buildBasicCombat();

                const foreignItem =
                    createWeaponItem({
                        id: "item-foreign",
                        name: "Arme étrangère",
                        parentId: attacker.id
                    });

                await assert.rejects(
                    () =>
                        GrappleService.establish({
                            combat,
                            attacker,
                            target,
                            disarmItem: foreignItem
                        }),
                    /n'appartient pas à la cible/
                );

            }
        );

    }
);


// ============================================================
// getGrappleForActor / getGrappleBetween / isActorGrappled
// ============================================================

test(
    "GrappleService.getGrappleForActor : retourne null sans arguments valides",
    async () => {

        await withFoundryStub(
            async () => {

                const { combat, attacker } =
                    buildBasicCombat();

                assert.equal(
                    GrappleService.getGrappleForActor(
                        null,
                        attacker
                    ),
                    null
                );

                assert.equal(
                    GrappleService.getGrappleForActor(
                        combat,
                        null
                    ),
                    null
                );

            }
        );

    }
);


test(
    "GrappleService.getGrappleForActor / getGrappleBetween / isActorGrappled : cas nominal après establish",
    async () => {

        await withFoundryStub(
            async () => {

                const { combat, attacker, target } =
                    buildBasicCombat();

                await GrappleService.establish({
                    combat,
                    attacker,
                    target
                });

                const forAttacker =
                    GrappleService.getGrappleForActor(
                        combat,
                        attacker
                    );

                const forTarget =
                    GrappleService.getGrappleForActor(
                        combat,
                        target
                    );

                assert.ok(
                    forAttacker
                );

                assert.equal(
                    forAttacker.id,
                    forTarget.id
                );

                const between =
                    GrappleService.getGrappleBetween(
                        combat,
                        attacker,
                        target
                    );

                assert.equal(
                    between.id,
                    forAttacker.id
                );

                assert.equal(
                    GrappleService.getGrappleBetween(
                        combat,
                        target,
                        attacker
                    ),
                    null
                );

                assert.equal(
                    GrappleService.isActorGrappled(
                        combat,
                        attacker
                    ),
                    true
                );

                const bystander =
                    createActorStub({
                        id: "actor-bystander",
                        name: "Un témoin"
                    });

                assert.equal(
                    GrappleService.isActorGrappled(
                        combat,
                        bystander
                    ),
                    false
                );

            }
        );

    }
);


test(
    "GrappleService.getGrappleForActor : ignore une saisie terminée",
    async () => {

        await withFoundryStub(
            async () => {

                const { combat, attacker, target } =
                    buildBasicCombat();

                const established =
                    await GrappleService.establish({
                        combat,
                        attacker,
                        target
                    });

                await GrappleService.resolveEscape(
                    combat,
                    established.grappleId,
                    {
                        targetSuccesses: 1,
                        attackerSuccesses: 0
                    }
                );

                assert.equal(
                    GrappleService.getGrappleForActor(
                        combat,
                        attacker
                    ),
                    null
                );

                assert.equal(
                    GrappleService.isActorGrappled(
                        combat,
                        attacker
                    ),
                    false
                );

            }
        );

    }
);


// ============================================================
// resolveEscape
// ============================================================

test(
    "GrappleService.resolveEscape : refuse sans Combat",
    async () => {

        await withFoundryStub(
            async () => {

                await assert.rejects(
                    () =>
                        GrappleService.resolveEscape(
                            null,
                            "grapple-1",
                            {
                                targetSuccesses: 1,
                                attackerSuccesses: 0
                            }
                        ),
                    /Combat actif est nécessaire/i
                );

            }
        );

    }
);


test(
    "GrappleService.resolveEscape : refuse sans identifiant de saisie",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();

                await assert.rejects(
                    () =>
                        GrappleService.resolveEscape(
                            combat,
                            null,
                            {
                                targetSuccesses: 1,
                                attackerSuccesses: 0
                            }
                        ),
                    TypeError
                );

            }
        );

    }
);


test(
    "GrappleService.resolveEscape : refuse si la saisie est introuvable",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();

                await assert.rejects(
                    () =>
                        GrappleService.resolveEscape(
                            combat,
                            "grapple-inconnu",
                            {
                                targetSuccesses: 1,
                                attackerSuccesses: 0
                            }
                        ),
                    /Saisie active introuvable/
                );

            }
        );

    }
);


test(
    "GrappleService.resolveEscape : la cible échoue et la saisie reste active",
    async () => {

        await withFoundryStub(
            async () => {

                const { combat, attacker, target } =
                    buildBasicCombat();

                const established =
                    await GrappleService.establish({
                        combat,
                        attacker,
                        target
                    });

                const result =
                    await GrappleService.resolveEscape(
                        combat,
                        established.grappleId,
                        {
                            targetSuccesses: 1,
                            attackerSuccesses: 2
                        }
                    );

                assert.equal(
                    result.escaped,
                    false
                );

                assert.equal(
                    result.resolved,
                    true
                );

                assert.equal(
                    result.tie,
                    false
                );

                assert.equal(
                    result.state.active,
                    true
                );

                assert.equal(
                    GrappleService.isActorGrappled(
                        combat,
                        target
                    ),
                    true
                );

            }
        );

    }
);


test(
    "GrappleService.resolveEscape : une égalité compte comme un échec pour la cible",
    async () => {

        await withFoundryStub(
            async () => {

                const { combat, attacker, target } =
                    buildBasicCombat();

                const established =
                    await GrappleService.establish({
                        combat,
                        attacker,
                        target
                    });

                const result =
                    await GrappleService.resolveEscape(
                        combat,
                        established.grappleId,
                        {
                            targetSuccesses: 1,
                            attackerSuccesses: 1
                        }
                    );

                assert.equal(
                    result.escaped,
                    false
                );

                assert.equal(
                    result.tie,
                    true
                );

            }
        );

    }
);


test(
    "GrappleService.resolveEscape : la cible réussit et la saisie est libérée",
    async () => {

        await withFoundryStub(
            async () => {

                const { combat, attacker, target } =
                    buildBasicCombat();

                const established =
                    await GrappleService.establish({
                        combat,
                        attacker,
                        target
                    });

                const result =
                    await GrappleService.resolveEscape(
                        combat,
                        established.grappleId,
                        {
                            targetSuccesses: 3,
                            attackerSuccesses: 1
                        }
                    );

                assert.equal(
                    result.escaped,
                    true
                );

                assert.equal(
                    result.margin,
                    2
                );

                assert.equal(
                    result.state.active,
                    false
                );

                assert.equal(
                    result.state.endedBy,
                    "escape"
                );

                assert.equal(
                    GrappleService.isActorGrappled(
                        combat,
                        target
                    ),
                    false
                );

            }
        );

    }
);


// ============================================================
// getActionState / canActorMove / canActorPerformAction
// ============================================================

test(
    "GrappleService.getActionState : refuse sans Actor",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();

                assert.throws(
                    () =>
                        GrappleService.getActionState(
                            combat,
                            null
                        ),
                    TypeError
                );

            }
        );

    }
);


test(
    "GrappleService.getActionState : Actor libre",
    async () => {

        await withFoundryStub(
            async () => {

                const { combat } =
                    buildBasicCombat();

                const bystander =
                    createActorStub({
                        id: "actor-bystander",
                        name: "Un témoin"
                    });

                const state =
                    GrappleService.getActionState(
                        combat,
                        bystander
                    );

                assert.equal(
                    state.grappled,
                    false
                );

                assert.equal(
                    state.canMove,
                    true
                );

            }
        );

    }
);


test(
    "GrappleService.getActionState : cible saisie ne peut que tenter de s'échapper",
    async () => {

        await withFoundryStub(
            async () => {

                const { combat, attacker, target } =
                    buildBasicCombat();

                await GrappleService.establish({
                    combat,
                    attacker,
                    target
                });

                const state =
                    GrappleService.getActionState(
                        combat,
                        target
                    );

                assert.equal(
                    state.grappled,
                    true
                );

                assert.equal(
                    state.role,
                    "target"
                );

                assert.equal(
                    state.canMove,
                    false
                );

                assert.equal(
                    state.onlyAction,
                    "grapple-escape"
                );

            }
        );

    }
);


test(
    "GrappleService.getActionState : saisisseur conserve la mobilité",
    async () => {

        await withFoundryStub(
            async () => {

                const { combat, attacker, target } =
                    buildBasicCombat();

                await GrappleService.establish({
                    combat,
                    attacker,
                    target
                });

                const state =
                    GrappleService.getActionState(
                        combat,
                        attacker
                    );

                assert.equal(
                    state.role,
                    "attacker"
                );

                assert.equal(
                    state.canMove,
                    true
                );

                assert.equal(
                    state.actions.attack,
                    true
                );

            }
        );

    }
);


test(
    "GrappleService.canActorMove : refuse sans Actor",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();

                assert.throws(
                    () =>
                        GrappleService.canActorMove(
                            combat,
                            null
                        ),
                    TypeError
                );

            }
        );

    }
);


test(
    "GrappleService.canActorMove : la cible saisie ne peut pas se déplacer",
    async () => {

        await withFoundryStub(
            async () => {

                const { combat, attacker, target } =
                    buildBasicCombat();

                await GrappleService.establish({
                    combat,
                    attacker,
                    target
                });

                assert.equal(
                    GrappleService.canActorMove(
                        combat,
                        target
                    ),
                    false
                );

                assert.equal(
                    GrappleService.canActorMove(
                        combat,
                        attacker
                    ),
                    true
                );

            }
        );

    }
);


test(
    "GrappleService.canActorPerformAction : refuse sans Actor",
    async () => {

        await withFoundryStub(
            async () => {

                const combat =
                    createCombatStub();

                assert.throws(
                    () =>
                        GrappleService.canActorPerformAction(
                            combat,
                            null,
                            "grapple-escape"
                        ),
                    TypeError
                );

            }
        );

    }
);


test(
    "GrappleService.canActorPerformAction : refuse un actionId invalide",
    async () => {

        await withFoundryStub(
            async () => {

                const { combat, attacker } =
                    buildBasicCombat();

                assert.throws(
                    () =>
                        GrappleService.canActorPerformAction(
                            combat,
                            attacker,
                            ""
                        ),
                    TypeError
                );

                assert.throws(
                    () =>
                        GrappleService.canActorPerformAction(
                            combat,
                            attacker,
                            42
                        ),
                    TypeError
                );

            }
        );

    }
);


test(
    "GrappleService.canActorPerformAction : la cible saisie ne peut tenter que l'échappée",
    async () => {

        await withFoundryStub(
            async () => {

                const { combat, attacker, target } =
                    buildBasicCombat();

                await GrappleService.establish({
                    combat,
                    attacker,
                    target
                });

                assert.equal(
                    GrappleService.canActorPerformAction(
                        combat,
                        target,
                        "grapple-escape"
                    ),
                    true
                );

                assert.equal(
                    GrappleService.canActorPerformAction(
                        combat,
                        target,
                        "melee-attack"
                    ),
                    false
                );

            }
        );

    }
);


test(
    "GrappleService.canActorPerformAction : le saisisseur ne peut pas tenter l'échappée",
    async () => {

        await withFoundryStub(
            async () => {

                const { combat, attacker, target } =
                    buildBasicCombat();

                await GrappleService.establish({
                    combat,
                    attacker,
                    target
                });

                assert.equal(
                    GrappleService.canActorPerformAction(
                        combat,
                        attacker,
                        "grapple-escape"
                    ),
                    false
                );

                assert.equal(
                    GrappleService.canActorPerformAction(
                        combat,
                        attacker,
                        "grapple-attack"
                    ),
                    true
                );

            }
        );

    }
);
