import test from "node:test";
import assert from "node:assert/strict";

import {
    validateRelayedWorkflowSave
} from "../../../src/domain/rules/melee-workflow-relay.mjs";

function workflow(overrides = {}) {
    return {
        id: "wf1",
        type: "melee",
        state: "awaiting-defense",
        attacker: { actorId: "npc", tokenId: "t1" },
        defender: { actorId: "pj", tokenId: "t2" },
        weaponId: "w1",
        defense: { offered: true, decision: null, result: null },
        attack: { result: null, finalized: false },
        blockStunts: { result: null },
        stunts: { result: null },
        consequences: { result: null },
        protection: { result: null },
        application: { steps: {}, result: null },
        metadata: { createdAt: 1 },
        ...overrides
    };
}

const ok = (stored, incoming, owns = true) =>
    validateRelayedWorkflowSave({
        stored,
        incoming,
        requesterOwnsDefender: owns
    });

test("décision Bloquer : awaiting-defense -> block-preparation", () => {
    const stored = workflow();
    const incoming = workflow({
        state: "block-preparation",
        defense: { offered: true, decision: "block", result: null }
    });
    assert.equal(ok(stored, incoming).ok, true);
});

test("décision Encaisser : -> attack-preparation", () => {
    const stored = workflow();
    const incoming = workflow({
        state: "attack-preparation",
        defense: { offered: true, decision: "decline", result: null }
    });
    assert.equal(ok(stored, incoming).ok, true);
});

test("refus si le demandeur n'est pas propriétaire du défenseur", () => {
    const incoming = workflow({
        state: "block-preparation",
        defense: { offered: true, decision: "block", result: null }
    });
    assert.equal(ok(workflow(), incoming, false).ok, false);
});

test("refus si le workflow n'existe pas (pas de création par un joueur)", () => {
    assert.equal(ok(null, workflow()).ok, false);
});

test("refus si un champ d'identité change", () => {
    const stored = workflow();
    for (const patch of [
        { attacker: { actorId: "autre", tokenId: "t1" } },
        { defender: { actorId: "autre", tokenId: "t2" } },
        { weaponId: "w2" },
        { id: "wf2" }
    ]) {
        const incoming = workflow({
            state: "block-preparation",
            defense: { offered: true, decision: "block", result: null },
            ...patch
        });
        assert.equal(ok(stored, incoming).ok, false, JSON.stringify(patch));
    }
});

test("refus si une section réservée à l'attaquant / au MJ change", () => {
    const stored = workflow();
    for (const patch of [
        { attack: { result: { successes: 9 }, finalized: false } },
        { stunts: { result: {} } },
        { consequences: { result: {} } },
        { protection: { result: {} } },
        { application: { steps: { damage: true }, result: null } },
        { metadata: { createdAt: 2 } }
    ]) {
        const incoming = workflow({
            state: "block-preparation",
            defense: { offered: true, decision: "block", result: null },
            ...patch
        });
        assert.equal(ok(stored, incoming).ok, false, JSON.stringify(patch));
    }
});

test("refus d'une transition d'état non prévue", () => {
    const incoming = workflow({ state: "completed" });
    assert.equal(ok(workflow(), incoming).ok, false);
    const incoming2 = workflow({
        state: "attack-resolved",
        defense: { offered: true, decision: "block", result: null }
    });
    assert.equal(ok(workflow(), incoming2).ok, false);
});

test("refus d'une décision incohérente avec l'état", () => {
    const incoming = workflow({
        state: "block-preparation",
        defense: { offered: true, decision: "decline", result: null }
    });
    assert.equal(ok(workflow(), incoming).ok, false);
});

test("refus de décider si le blocage n'est pas offert", () => {
    const stored = workflow({
        defense: { offered: false, decision: "decline", result: null },
        state: "attack-preparation"
    });
    const incoming = workflow({
        state: "block-preparation",
        defense: { offered: false, decision: "block", result: null }
    });
    assert.equal(ok(stored, incoming).ok, false);
});

test("annulation de la préparation : block-preparation -> awaiting-defense", () => {
    const stored = workflow({
        state: "block-preparation",
        defense: { offered: true, decision: "block", result: null }
    });
    const incoming = workflow();
    assert.equal(ok(stored, incoming).ok, true);
});

const blockStored = () => workflow({
    state: "block-preparation",
    defense: { offered: true, decision: "block", result: null }
});

test("résultat de blocage avec réussites -> awaiting-block-stunts", () => {
    const incoming = workflow({
        state: "awaiting-block-stunts",
        defense: {
            offered: true,
            decision: "block",
            result: { rolled: true, roll: { successes: 2 } }
        }
    });
    assert.equal(ok(blockStored(), incoming).ok, true);
});

test("résultat de blocage sans réussite -> attack-preparation", () => {
    const incoming = workflow({
        state: "attack-preparation",
        defense: {
            offered: true,
            decision: "block",
            result: { rolled: true, roll: { successes: 0 } }
        }
    });
    assert.equal(ok(blockStored(), incoming).ok, true);
});

test("incohérence réussites / état refusée", () => {
    const withSuccesses = workflow({
        state: "attack-preparation",
        defense: {
            offered: true,
            decision: "block",
            result: { rolled: true, roll: { successes: 3 } }
        }
    });
    assert.equal(ok(blockStored(), withSuccesses).ok, false);

    const noSuccesses = workflow({
        state: "awaiting-block-stunts",
        defense: {
            offered: true,
            decision: "block",
            result: { rolled: true, roll: { successes: 0 } }
        }
    });
    assert.equal(ok(blockStored(), noSuccesses).ok, false);
});

test("résultat de blocage : la décision ne peut pas changer au passage", () => {
    const incoming = workflow({
        state: "attack-preparation",
        defense: {
            offered: true,
            decision: "decline",
            result: { rolled: false }
        }
    });
    assert.equal(ok(blockStored(), incoming).ok, false);
});

test("résultat de blocage trop volumineux refusé", () => {
    const incoming = workflow({
        state: "attack-preparation",
        defense: {
            offered: true,
            decision: "block",
            result: { rolled: false, junk: "x".repeat(30000) }
        }
    });
    assert.equal(ok(blockStored(), incoming).ok, false);
});

test("éclats de blocage : awaiting-block-stunts -> attack-preparation", () => {
    const stored = workflow({
        state: "awaiting-block-stunts",
        defense: {
            offered: true,
            decision: "block",
            result: { rolled: true, roll: { successes: 2 } }
        }
    });
    const incoming = workflow({
        state: "attack-preparation",
        defense: stored.defense,
        blockStunts: { result: { available: 2, spent: 2 } }
    });
    assert.equal(ok(stored, incoming).ok, true);

    const tampered = workflow({
        state: "attack-preparation",
        defense: { ...stored.defense, decision: "decline" },
        blockStunts: { result: {} }
    });
    assert.equal(ok(stored, tampered).ok, false);
});

test("entrée invalide refusée", () => {
    assert.equal(ok(workflow(), null).ok, false);
    assert.equal(ok(workflow(), "x").ok, false);
});
