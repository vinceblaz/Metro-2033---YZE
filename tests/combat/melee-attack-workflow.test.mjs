import { test } from "node:test";
import assert from "node:assert/strict";

import {
    MeleeAttackWorkflow,
    MELEE_ATTACK_WORKFLOW_STATES,
    MELEE_DEFENSE_DECISIONS
} from "../../src/combat/melee-attack-workflow.mjs";


/**
 * Ce fichier ne couvre PAS l'intégralité de
 * MeleeAttackWorkflow (aucun test n'existait avant
 * ce chantier). Il se concentre sur le nouveau
 * comportement introduit pour les éclats de
 * blocage (contre-attaque / désarmement, p.197).
 */


function createWorkflowAwaitingBlockPreparation(
    overrides = {}
) {

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
                true,

            ...overrides

        });


    workflow.chooseDefense(
        MELEE_DEFENSE_DECISIONS.BLOCK
    );


    return workflow;

}


function createRolledBlockResult(
    successes
) {

    return {

        rolled:
            true,

        roll: {
            successes
        }

    };

}


test(
    "resolveBlock : un blocage sans réussite passe directement à la préparation de l'attaque",
    () => {

        const workflow =
            createWorkflowAwaitingBlockPreparation();


        workflow.resolveBlock(
            createRolledBlockResult(0)
        );


        assert.equal(
            workflow.state,
            MELEE_ATTACK_WORKFLOW_STATES
                .ATTACK_PREPARATION
        );

        assert.equal(
            workflow.hasBlockStuntResult,
            false
        );

    }
);


test(
    "resolveBlock : un blocage non résolu (non éligible) passe directement à la préparation de l'attaque",
    () => {

        const workflow =
            createWorkflowAwaitingBlockPreparation();


        workflow.resolveBlock({
            rolled: false,
            roll: null
        });


        assert.equal(
            workflow.state,
            MELEE_ATTACK_WORKFLOW_STATES
                .ATTACK_PREPARATION
        );

    }
);


test(
    "resolveBlock : un blocage réussi attend la répartition des éclats de blocage",
    () => {

        const workflow =
            createWorkflowAwaitingBlockPreparation();


        workflow.resolveBlock(
            createRolledBlockResult(2)
        );


        assert.equal(
            workflow.state,
            MELEE_ATTACK_WORKFLOW_STATES
                .AWAITING_BLOCK_STUNTS
        );

        assert.equal(
            workflow.isAwaitingBlockStunts,
            true
        );

        assert.equal(
            workflow.canResolveBlockStunts,
            true
        );

    }
);


test(
    "resolveBlockStunts : refuse d'être appelée hors de l'état d'attente",
    () => {

        const workflow =
            createWorkflowAwaitingBlockPreparation();


        workflow.resolveBlock(
            createRolledBlockResult(0)
        );


        assert.throws(
            () =>
                workflow.resolveBlockStunts({
                    effects: {
                        cancelledSuccesses: 0,
                        counterAttack: false,
                        disarm: false
                    }
                }),
            /état actuel/
        );

    }
);


test(
    "resolveBlockStunts : persiste le résultat et poursuit vers la préparation de l'attaque",
    () => {

        const workflow =
            createWorkflowAwaitingBlockPreparation();


        workflow.resolveBlock(
            createRolledBlockResult(2)
        );


        const blockStuntResult = {

            available:
                2,

            spent:
                2,

            remaining:
                0,

            effects: {

                cancelledSuccesses:
                    1,

                counterAttack:
                    true,

                disarm:
                    false

            }

        };


        workflow.resolveBlockStunts(
            blockStuntResult
        );


        assert.equal(
            workflow.state,
            MELEE_ATTACK_WORKFLOW_STATES
                .ATTACK_PREPARATION
        );

        assert.equal(
            workflow.hasBlockStuntResult,
            true
        );

        assert.deepEqual(
            workflow.blockStunts.result.effects,
            blockStuntResult.effects
        );

    }
);


test(
    "resolveBlockStunts : exige un résultat",
    () => {

        const workflow =
            createWorkflowAwaitingBlockPreparation();


        workflow.resolveBlock(
            createRolledBlockResult(1)
        );


        assert.throws(
            () =>
                workflow.resolveBlockStunts(
                    null
                ),
            TypeError
        );

    }
);


test(
    "toObject / fromObject : conserve le résultat des éclats de blocage",
    () => {

        const workflow =
            createWorkflowAwaitingBlockPreparation();


        workflow.resolveBlock(
            createRolledBlockResult(1)
        );


        workflow.resolveBlockStunts({

            available:
                1,

            spent:
                1,

            remaining:
                0,

            effects: {

                cancelledSuccesses:
                    0,

                counterAttack:
                    false,

                disarm:
                    true

            }

        });


        const restored =
            MeleeAttackWorkflow.fromObject(
                workflow.toObject()
            );


        assert.deepEqual(
            restored.blockStunts.result,
            workflow.blockStunts.result
        );

        assert.equal(
            restored.hasBlockStuntResult,
            true
        );

    }
);


test(
    "toObject / fromObject : un workflow sans blocage n'a jamais de résultat d'éclats de blocage",
    () => {

        const workflow =
            new MeleeAttackWorkflow({

                id:
                    "workflow-2",

                attackerId:
                    "actor-attacker",

                defenderId:
                    "actor-defender",

                weaponId:
                    "weapon-1",

                canBlock:
                    false

            });


        const restored =
            MeleeAttackWorkflow.fromObject(
                workflow.toObject()
            );


        assert.equal(
            restored.hasBlockStuntResult,
            false
        );

    }
);
