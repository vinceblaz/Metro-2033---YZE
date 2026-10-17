import { test } from "node:test";
import assert from "node:assert/strict";

import {
    CombatActionService
} from "../../src/combat/combat-action-service.mjs";


/**
 * Ce fichier verrouille le comportement actuel de
 * CombatActionService (aucun test n'existait avant
 * ce chantier). Il ne modifie pas la source : il en
 * fige le contrat.
 */


function createCombatantStub({
    id,
    actorId
}) {

    const storage = {};

    return {

        id,

        actor:
            actorId
                ? { id: actorId }
                : null,

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


function createCombatStub({
    combatants = [],
    round = 1
} = {}) {

    return {

        id:
            "combat-1",

        round,

        combatants

    };

}


// ============================================================
// getCombatant
// ============================================================

test(
    "CombatActionService.getCombatant : retourne null sans Combat ou sans Actor",
    () => {

        const combatant =
            createCombatantStub({
                id: "combatant-1",
                actorId: "actor-1"
            });

        const combat =
            createCombatStub({
                combatants: [
                    combatant
                ]
            });

        assert.equal(
            CombatActionService.getCombatant(
                null,
                { id: "actor-1" }
            ),
            null
        );

        assert.equal(
            CombatActionService.getCombatant(
                combat,
                null
            ),
            null
        );

    }
);


test(
    "CombatActionService.getCombatant : retrouve le Combatant correspondant à un Actor",
    () => {

        const combatant =
            createCombatantStub({
                id: "combatant-1",
                actorId: "actor-1"
            });

        const combat =
            createCombatStub({
                combatants: [
                    combatant
                ]
            });

        const found =
            CombatActionService.getCombatant(
                combat,
                { id: "actor-1" }
            );

        assert.equal(
            found,
            combatant
        );

        assert.equal(
            CombatActionService.getCombatant(
                combat,
                { id: "actor-inconnu" }
            ),
            null
        );

    }
);


test(
    "CombatActionService.getCombatant : accepte un itérable non-Array pour combatants",
    () => {

        const combatant =
            createCombatantStub({
                id: "combatant-1",
                actorId: "actor-1"
            });

        const combat =
            createCombatStub({
                combatants:
                    new Set([
                        combatant
                    ])
            });

        const found =
            CombatActionService.getCombatant(
                combat,
                { id: "actor-1" }
            );

        assert.equal(
            found,
            combatant
        );

    }
);


// ============================================================
// createState
// ============================================================

test(
    "CombatActionService.createState : refuse sans Combat",
    () => {

        assert.throws(
            () =>
                CombatActionService.createState(
                    null
                ),
            TypeError
        );

    }
);


test(
    "CombatActionService.createState : retourne un état initial lié au round courant",
    () => {

        const combat =
            createCombatStub({
                round: 3
            });

        const state =
            CombatActionService.createState(
                combat
            );

        assert.deepEqual(
            state,
            {
                round: 3,
                slowUsed: false,
                fastUsed: 0
            }
        );

    }
);


test(
    "CombatActionService.createState : utilise 0 si le Combat n'a pas de round",
    () => {

        const combat =
            createCombatStub();

        delete combat.round;

        const state =
            CombatActionService.createState(
                combat
            );

        assert.equal(
            state.round,
            0
        );

    }
);


// ============================================================
// getState
// ============================================================

test(
    "CombatActionService.getState : refuse sans Combat",
    () => {

        const combatant =
            createCombatantStub({
                id: "combatant-1",
                actorId: "actor-1"
            });

        assert.throws(
            () =>
                CombatActionService.getState(
                    null,
                    combatant
                ),
            TypeError
        );

    }
);


test(
    "CombatActionService.getState : refuse sans Combatant",
    () => {

        const combat =
            createCombatStub();

        assert.throws(
            () =>
                CombatActionService.getState(
                    combat,
                    null
                ),
            TypeError
        );

    }
);


test(
    "CombatActionService.getState : retourne un état initial si rien n'est enregistré",
    () => {

        const combatant =
            createCombatantStub({
                id: "combatant-1",
                actorId: "actor-1"
            });

        const combat =
            createCombatStub({
                combatants: [
                    combatant
                ],
                round: 2
            });

        const state =
            CombatActionService.getState(
                combat,
                combatant
            );

        assert.deepEqual(
            state,
            {
                round: 2,
                slowUsed: false,
                fastUsed: 0
            }
        );

    }
);


test(
    "CombatActionService.getState : retourne un état initial si le flag appartient à un ancien round",
    async () => {

        const combatant =
            createCombatantStub({
                id: "combatant-1",
                actorId: "actor-1"
            });

        const combat =
            createCombatStub({
                combatants: [
                    combatant
                ],
                round: 2
            });

        await combatant.setFlag(
            "metro-2033-yze",
            "combatActions",
            {
                round: 1,
                slowUsed: true,
                fastUsed: 0
            }
        );

        const state =
            CombatActionService.getState(
                combat,
                combatant
            );

        assert.deepEqual(
            state,
            {
                round: 2,
                slowUsed: false,
                fastUsed: 0
            }
        );

    }
);


test(
    "CombatActionService.getState : normalise l'état stocké pour le round courant",
    async () => {

        const combatant =
            createCombatantStub({
                id: "combatant-1",
                actorId: "actor-1"
            });

        const combat =
            createCombatStub({
                combatants: [
                    combatant
                ],
                round: 2
            });

        await combatant.setFlag(
            "metro-2033-yze",
            "combatActions",
            {
                round: 2,
                slowUsed: true,
                fastUsed: 0
            }
        );

        const state =
            CombatActionService.getState(
                combat,
                combatant
            );

        assert.deepEqual(
            state,
            {
                round: 2,
                slowUsed: true,
                fastUsed: 0
            }
        );

    }
);


test(
    "CombatActionService.getState : propage une erreur si l'état stocké est invalide",
    async () => {

        const combatant =
            createCombatantStub({
                id: "combatant-1",
                actorId: "actor-1"
            });

        const combat =
            createCombatStub({
                combatants: [
                    combatant
                ],
                round: 2
            });

        await combatant.setFlag(
            "metro-2033-yze",
            "combatActions",
            {
                round: 2,
                slowUsed: true,
                fastUsed: 2
            }
        );

        assert.throws(
            () =>
                CombatActionService.getState(
                    combat,
                    combatant
                ),
            /état d'actions invalide/i
        );

    }
);


// ============================================================
// getActorState
// ============================================================

test(
    "CombatActionService.getActorState : refuse un Actor absent du combat",
    () => {

        const combat =
            createCombatStub();

        assert.throws(
            () =>
                CombatActionService.getActorState(
                    combat,
                    { id: "actor-inconnu" }
                ),
            /n'est pas présent dans ce combat/
        );

    }
);


test(
    "CombatActionService.getActorState : délègue à getState pour un Actor présent",
    () => {

        const combatant =
            createCombatantStub({
                id: "combatant-1",
                actorId: "actor-1"
            });

        const combat =
            createCombatStub({
                combatants: [
                    combatant
                ],
                round: 5
            });

        const state =
            CombatActionService.getActorState(
                combat,
                { id: "actor-1" }
            );

        assert.deepEqual(
            state,
            {
                round: 5,
                slowUsed: false,
                fastUsed: 0
            }
        );

    }
);


// ============================================================
// canActorPerform
// ============================================================

test(
    "CombatActionService.canActorPerform : refuse une action inconnue",
    () => {

        const combatant =
            createCombatantStub({
                id: "combatant-1",
                actorId: "actor-1"
            });

        const combat =
            createCombatStub({
                combatants: [
                    combatant
                ]
            });

        assert.throws(
            () =>
                CombatActionService.canActorPerform(
                    combat,
                    { id: "actor-1" },
                    "action-inexistante"
                ),
            /Action de combat inconnue/
        );

    }
);


test(
    "CombatActionService.canActorPerform : autorise une action lente en début de round",
    () => {

        const combatant =
            createCombatantStub({
                id: "combatant-1",
                actorId: "actor-1"
            });

        const combat =
            createCombatStub({
                combatants: [
                    combatant
                ]
            });

        assert.equal(
            CombatActionService.canActorPerform(
                combat,
                { id: "actor-1" },
                "melee-attack"
            ),
            true
        );

    }
);


test(
    "CombatActionService.canActorPerform : refuse une action lente si une lente est déjà utilisée",
    async () => {

        const combatant =
            createCombatantStub({
                id: "combatant-1",
                actorId: "actor-1"
            });

        const combat =
            createCombatStub({
                combatants: [
                    combatant
                ],
                round: 1
            });

        await combatant.setFlag(
            "metro-2033-yze",
            "combatActions",
            {
                round: 1,
                slowUsed: true,
                fastUsed: 0
            }
        );

        assert.equal(
            CombatActionService.canActorPerform(
                combat,
                { id: "actor-1" },
                "ranged-attack"
            ),
            false
        );

        assert.equal(
            CombatActionService.canActorPerform(
                combat,
                { id: "actor-1" },
                "grapple-attack"
            ),
            true
        );

    }
);


test(
    "CombatActionService.canActorPerform : refuse une action rapide si les deux rapides sont épuisées",
    async () => {

        const combatant =
            createCombatantStub({
                id: "combatant-1",
                actorId: "actor-1"
            });

        const combat =
            createCombatStub({
                combatants: [
                    combatant
                ],
                round: 1
            });

        await combatant.setFlag(
            "metro-2033-yze",
            "combatActions",
            {
                round: 1,
                slowUsed: false,
                fastUsed: 2
            }
        );

        assert.equal(
            CombatActionService.canActorPerform(
                combat,
                { id: "actor-1" },
                "grapple-attack"
            ),
            false
        );

    }
);


// ============================================================
// spendActorAction
// ============================================================

test(
    "CombatActionService.spendActorAction : refuse un Actor absent du combat",
    async () => {

        const combat =
            createCombatStub();

        await assert.rejects(
            () =>
                CombatActionService.spendActorAction(
                    combat,
                    { id: "actor-inconnu" },
                    "melee-attack"
                ),
            /n'est pas présent dans ce combat/
        );

    }
);


test(
    "CombatActionService.spendActorAction : refuse une action de combat inconnue",
    async () => {

        const combatant =
            createCombatantStub({
                id: "combatant-1",
                actorId: "actor-1"
            });

        const combat =
            createCombatStub({
                combatants: [
                    combatant
                ]
            });

        await assert.rejects(
            () =>
                CombatActionService.spendActorAction(
                    combat,
                    { id: "actor-1" },
                    "action-inexistante"
                ),
            /Action de combat inconnue/
        );

    }
);


test(
    "CombatActionService.spendActorAction : dépense une action lente et la persiste",
    async () => {

        const combatant =
            createCombatantStub({
                id: "combatant-1",
                actorId: "actor-1"
            });

        const combat =
            createCombatStub({
                combatants: [
                    combatant
                ],
                round: 4
            });

        const result =
            await CombatActionService.spendActorAction(
                combat,
                { id: "actor-1" },
                "melee-attack"
            );

        assert.deepEqual(
            result,
            {
                round: 4,
                slowUsed: true,
                fastUsed: 0
            }
        );

        const persisted =
            combatant.getFlag(
                "metro-2033-yze",
                "combatActions"
            );

        assert.deepEqual(
            persisted,
            {
                round: 4,
                slowUsed: true,
                fastUsed: 0
            }
        );

    }
);


test(
    "CombatActionService.spendActorAction : dépense deux actions rapides successivement",
    async () => {

        const combatant =
            createCombatantStub({
                id: "combatant-1",
                actorId: "actor-1"
            });

        const combat =
            createCombatStub({
                combatants: [
                    combatant
                ],
                round: 1
            });

        await CombatActionService.spendActorAction(
            combat,
            { id: "actor-1" },
            "grapple-attack"
        );

        const second =
            await CombatActionService.spendActorAction(
                combat,
                { id: "actor-1" },
                "move"
            );

        assert.deepEqual(
            second,
            {
                round: 1,
                slowUsed: false,
                fastUsed: 2
            }
        );

    }
);


test(
    "CombatActionService.spendActorAction : refuse une troisième action rapide",
    async () => {

        const combatant =
            createCombatantStub({
                id: "combatant-1",
                actorId: "actor-1"
            });

        const combat =
            createCombatStub({
                combatants: [
                    combatant
                ],
                round: 1
            });

        await CombatActionService.spendActorAction(
            combat,
            { id: "actor-1" },
            "grapple-attack"
        );

        await CombatActionService.spendActorAction(
            combat,
            { id: "actor-1" },
            "move"
        );

        await assert.rejects(
            () =>
                CombatActionService.spendActorAction(
                    combat,
                    { id: "actor-1" },
                    "grapple-attack"
                ),
            /indisponible/
        );

    }
);


test(
    "CombatActionService.spendActorAction : refuse une lente après une rapide déjà utilisée deux fois",
    async () => {

        const combatant =
            createCombatantStub({
                id: "combatant-1",
                actorId: "actor-1"
            });

        const combat =
            createCombatStub({
                combatants: [
                    combatant
                ],
                round: 1
            });

        await CombatActionService.spendActorAction(
            combat,
            { id: "actor-1" },
            "grapple-attack"
        );

        await CombatActionService.spendActorAction(
            combat,
            { id: "actor-1" },
            "move"
        );

        await assert.rejects(
            () =>
                CombatActionService.spendActorAction(
                    combat,
                    { id: "actor-1" },
                    "melee-attack"
                ),
            /indisponible/
        );

    }
);


test(
    "CombatActionService.spendActorAction : réinitialise l'état à un nouveau round",
    async () => {

        const combatant =
            createCombatantStub({
                id: "combatant-1",
                actorId: "actor-1"
            });

        const combat =
            createCombatStub({
                combatants: [
                    combatant
                ],
                round: 1
            });

        await CombatActionService.spendActorAction(
            combat,
            { id: "actor-1" },
            "melee-attack"
        );

        combat.round = 2;

        const result =
            await CombatActionService.spendActorAction(
                combat,
                { id: "actor-1" },
                "melee-attack"
            );

        assert.deepEqual(
            result,
            {
                round: 2,
                slowUsed: true,
                fastUsed: 0
            }
        );

    }
);


// ============================================================
// resetCombatant / resetActor / resetAll
// ============================================================

test(
    "CombatActionService.resetCombatant : refuse sans Combat ou sans Combatant",
    async () => {

        const combatant =
            createCombatantStub({
                id: "combatant-1",
                actorId: "actor-1"
            });

        const combat =
            createCombatStub({
                combatants: [
                    combatant
                ]
            });

        await assert.rejects(
            () =>
                CombatActionService.resetCombatant(
                    null,
                    combatant
                ),
            TypeError
        );

        await assert.rejects(
            () =>
                CombatActionService.resetCombatant(
                    combat,
                    null
                ),
            TypeError
        );

    }
);


test(
    "CombatActionService.resetCombatant : réinitialise l'état d'un Combatant déjà entamé",
    async () => {

        const combatant =
            createCombatantStub({
                id: "combatant-1",
                actorId: "actor-1"
            });

        const combat =
            createCombatStub({
                combatants: [
                    combatant
                ],
                round: 3
            });

        await CombatActionService.spendActorAction(
            combat,
            { id: "actor-1" },
            "melee-attack"
        );

        const result =
            await CombatActionService.resetCombatant(
                combat,
                combatant
            );

        assert.deepEqual(
            result,
            {
                round: 3,
                slowUsed: false,
                fastUsed: 0
            }
        );

    }
);


test(
    "CombatActionService.resetActor : refuse un Actor absent du combat",
    async () => {

        const combat =
            createCombatStub();

        await assert.rejects(
            () =>
                CombatActionService.resetActor(
                    combat,
                    { id: "actor-inconnu" }
                ),
            /n'est pas présent dans ce combat/
        );

    }
);


test(
    "CombatActionService.resetActor : réinitialise l'état correspondant à l'Actor",
    async () => {

        const combatant =
            createCombatantStub({
                id: "combatant-1",
                actorId: "actor-1"
            });

        const combat =
            createCombatStub({
                combatants: [
                    combatant
                ],
                round: 1
            });

        await CombatActionService.spendActorAction(
            combat,
            { id: "actor-1" },
            "grapple-attack"
        );

        const result =
            await CombatActionService.resetActor(
                combat,
                { id: "actor-1" }
            );

        assert.deepEqual(
            result,
            {
                round: 1,
                slowUsed: false,
                fastUsed: 0
            }
        );

    }
);


test(
    "CombatActionService.resetAll : refuse sans Combat",
    async () => {

        await assert.rejects(
            () =>
                CombatActionService.resetAll(
                    null
                ),
            TypeError
        );

    }
);


test(
    "CombatActionService.resetAll : réinitialise tous les Combatants du Combat",
    async () => {

        const combatantOne =
            createCombatantStub({
                id: "combatant-1",
                actorId: "actor-1"
            });

        const combatantTwo =
            createCombatantStub({
                id: "combatant-2",
                actorId: "actor-2"
            });

        const combat =
            createCombatStub({
                combatants: [
                    combatantOne,
                    combatantTwo
                ],
                round: 2
            });

        await CombatActionService.spendActorAction(
            combat,
            { id: "actor-1" },
            "melee-attack"
        );

        await CombatActionService.spendActorAction(
            combat,
            { id: "actor-2" },
            "grapple-attack"
        );

        const results =
            await CombatActionService.resetAll(
                combat
            );

        assert.equal(
            results.length,
            2
        );

        for (
            const result
            of results
        ) {

            assert.deepEqual(
                result,
                {
                    round: 2,
                    slowUsed: false,
                    fastUsed: 0
                }
            );

        }

        assert.deepEqual(
            combatantOne.getFlag(
                "metro-2033-yze",
                "combatActions"
            ),
            {
                round: 2,
                slowUsed: false,
                fastUsed: 0
            }
        );

    }
);


test(
    "CombatActionService.resetAll : fonctionne avec un Combat sans Combatants",
    async () => {

        const combat =
            createCombatStub({
                combatants: []
            });

        const results =
            await CombatActionService.resetAll(
                combat
            );

        assert.deepEqual(
            results,
            []
        );

    }
);
