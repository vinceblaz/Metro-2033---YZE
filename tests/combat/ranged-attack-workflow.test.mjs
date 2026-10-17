import test from "node:test";
import assert from "node:assert/strict";

import {
    RANGED_ATTACK_APPLICATION_STATUSES,
    resolveRangedAttackApplicationStatus,
    canApplyReadyRangedAttack,
    isRangedAttackApplicationCompleted
} from "../../src/combat/ranged-attack-workflow.mjs";


/* ============================================================
 * resolveRangedAttackApplicationStatus
 * ============================================================ */


test("resolveRangedAttackApplicationStatus exige un tableau d'opérations bloquées", () => {

    assert.throws(
        () => resolveRangedAttackApplicationStatus({
            blockedOperations: null
        }),
        TypeError
    );

});


test("resolveRangedAttackApplicationStatus renvoie BLOCKED si au moins une opération est bloquée", () => {

    const status =
        resolveRangedAttackApplicationStatus({
            blockedOperations: [
                { type: "protection-damage", status: "blocked" }
            ]
        });

    assert.equal(
        status,
        RANGED_ATTACK_APPLICATION_STATUSES.BLOCKED
    );

});


test("resolveRangedAttackApplicationStatus renvoie READY si aucune opération n'est bloquée", () => {

    const status =
        resolveRangedAttackApplicationStatus({
            blockedOperations: []
        });

    assert.equal(
        status,
        RANGED_ATTACK_APPLICATION_STATUSES.READY
    );

});


test("resolveRangedAttackApplicationStatus ne renvoie jamais APPLIED", () => {

    const statusWithoutBlock =
        resolveRangedAttackApplicationStatus({
            blockedOperations: []
        });

    const statusWithBlock =
        resolveRangedAttackApplicationStatus({
            blockedOperations: [
                { type: "disarm", status: "blocked" }
            ]
        });

    assert.notEqual(
        statusWithoutBlock,
        RANGED_ATTACK_APPLICATION_STATUSES.APPLIED
    );

    assert.notEqual(
        statusWithBlock,
        RANGED_ATTACK_APPLICATION_STATUSES.APPLIED
    );

});


/* ============================================================
 * canApplyReadyRangedAttack
 * ============================================================ */


test("canApplyReadyRangedAttack est vrai uniquement à l'état READY", () => {

    assert.equal(
        canApplyReadyRangedAttack({
            status: RANGED_ATTACK_APPLICATION_STATUSES.READY
        }),
        true
    );

    assert.equal(
        canApplyReadyRangedAttack({
            status: RANGED_ATTACK_APPLICATION_STATUSES.BLOCKED
        }),
        false
    );

    assert.equal(
        canApplyReadyRangedAttack({
            status: RANGED_ATTACK_APPLICATION_STATUSES.APPLIED
        }),
        false
    );

    assert.equal(
        canApplyReadyRangedAttack({
            status: undefined
        }),
        false
    );

});


/* ============================================================
 * isRangedAttackApplicationCompleted
 * ============================================================ */


test("isRangedAttackApplicationCompleted est vrai uniquement à l'état APPLIED", () => {

    assert.equal(
        isRangedAttackApplicationCompleted({
            status: RANGED_ATTACK_APPLICATION_STATUSES.APPLIED
        }),
        true
    );

    assert.equal(
        isRangedAttackApplicationCompleted({
            status: RANGED_ATTACK_APPLICATION_STATUSES.READY
        }),
        false
    );

    assert.equal(
        isRangedAttackApplicationCompleted({
            status: RANGED_ATTACK_APPLICATION_STATUSES.BLOCKED
        }),
        false
    );

    assert.equal(
        isRangedAttackApplicationCompleted({
            status: null
        }),
        false
    );

});
