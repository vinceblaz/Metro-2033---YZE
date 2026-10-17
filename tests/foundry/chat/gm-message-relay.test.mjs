import { test } from "node:test";
import assert from "node:assert/strict";

import {
    GM_RELAY_ERRORS,
    GM_RELAY_SOCKET,
    chooseUpdateRoute,
    createPendingRequests,
    relayFlagUpdateKey,
    validateRelayedUpdate
} from "../../../src/domain/rules/gm-message-relay.mjs";


const FLAG_KEY = relayFlagUpdateKey("coupDeGrace");

const current = {
    coupDeGrace: {
        actorUuid: "Actor.abc",
        actorName: "Artyom",
        resolved: false
    }
};

function goodUpdate(overrides = {}) {
    return {
        content: "<div>ok</div>",
        rolls: [{ class: "Roll" }],
        sound: "sounds/dice.wav",
        [FLAG_KEY]: { actorUuid: "Actor.abc", resolved: true },
        ...overrides
    };
}

function validate(update, extra = {}) {
    return validateRelayedUpdate({
        update,
        currentFlags: current,
        requesterIsOwner: true,
        ...extra
    });
}


test("socket du système", () => {
    assert.equal(GM_RELAY_SOCKET, "system.metro-2033-yze");
});

test("chooseUpdateRoute : direct pour MJ ou auteur, relais sinon", () => {
    assert.equal(chooseUpdateRoute({ isGM: true, canModify: false }), "direct");
    assert.equal(chooseUpdateRoute({ isGM: false, canModify: true }), "direct");
    assert.equal(chooseUpdateRoute({ isGM: false, canModify: false }), "relay");
    assert.equal(chooseUpdateRoute(), "relay");
});

test("charge valide acceptée", () => {
    const result = validate(goodUpdate());
    assert.equal(result.ok, true);
    assert.equal(result.flagName, "coupDeGrace");
});

test("charge valide sans jets (Impitoyable) acceptée", () => {
    const update = goodUpdate();
    delete update.rolls;
    delete update.sound;
    assert.equal(validate(update).ok, true);
});

test("clé non autorisée refusée", () => {
    assert.equal(validate(goodUpdate({ author: "x" })).ok, false);
    assert.equal(validate(goodUpdate({ whisper: ["a"] })).ok, false);
    assert.equal(validate(goodUpdate({ "flags.core.x": {} })).ok, false);
});

test("flag non autorisé ou multiple refusé", () => {
    const other = relayFlagUpdateKey("terror");
    const update = goodUpdate();
    delete update[FLAG_KEY];
    update[other] = { resolved: true };
    assert.equal(validate(update).ok, false);
    assert.equal(
        validate(goodUpdate({ [other]: { resolved: true } })).ok,
        false
    );
    const none = goodUpdate();
    delete none[FLAG_KEY];
    assert.equal(validate(none).ok, false);
});

test("message sans le flag coupDeGrace refusé", () => {
    assert.equal(
        validateRelayedUpdate({
            update: goodUpdate(),
            currentFlags: {},
            requesterIsOwner: true
        }).ok,
        false
    );
    assert.equal(
        validateRelayedUpdate({
            update: goodUpdate(),
            currentFlags: null,
            requesterIsOwner: true
        }).ok,
        false
    );
});

test("carte déjà résolue refusée", () => {
    const result = validateRelayedUpdate({
        update: goodUpdate(),
        currentFlags: { coupDeGrace: { actorUuid: "Actor.abc", resolved: true } },
        requesterIsOwner: true
    });
    assert.equal(result.ok, false);
});

test("demandeur non propriétaire refusé", () => {
    assert.equal(validate(goodUpdate(), { requesterIsOwner: false }).ok, false);
    assert.equal(validate(goodUpdate(), { requesterIsOwner: undefined }).ok, false);
});

test("flag modifié : actorUuid changé ou non résolu refusé", () => {
    assert.equal(
        validate(goodUpdate({ [FLAG_KEY]: { actorUuid: "Actor.zzz", resolved: true } })).ok,
        false
    );
    assert.equal(
        validate(goodUpdate({ [FLAG_KEY]: { actorUuid: "Actor.abc", resolved: false } })).ok,
        false
    );
    assert.equal(validate(goodUpdate({ [FLAG_KEY]: "x" })).ok, false);
});

test("types de content / rolls / sound contrôlés", () => {
    assert.equal(validate(goodUpdate({ content: 3 })).ok, false);
    assert.equal(validate(goodUpdate({ content: "x".repeat(20001) })).ok, false);
    assert.equal(validate(goodUpdate({ rolls: "x" })).ok, false);
    assert.equal(validate(goodUpdate({ rolls: [3] })).ok, false);
    assert.equal(validate(goodUpdate({ rolls: new Array(11).fill("{}") })).ok, false);
    assert.equal(validate(goodUpdate({ sound: 3 })).ok, false);
    assert.equal(validateRelayedUpdate({}).ok, false);
    assert.equal(validate(null).ok, false);
});

test("pending : accusé positif résout la promesse", async () => {
    const pending = createPendingRequests({ timeoutMs: 1000 });
    const promise = pending.register("r1");
    assert.equal(pending.size, 1);
    assert.equal(pending.settle("r1", { ok: true }), true);
    assert.equal(await promise, true);
    assert.equal(pending.size, 0);
    assert.equal(pending.settle("r1", { ok: true }), false);
});

test("pending : accusé négatif rejette avec le message du MJ", async () => {
    const pending = createPendingRequests({ timeoutMs: 1000 });
    const promise = pending.register("r2");
    pending.settle("r2", { ok: false, error: "Cette carte a déjà été résolue." });
    await assert.rejects(promise, /déjà été résolue/);
});

test("pending : timeout -> erreur lisible, requête purgée", async () => {
    const pending = createPendingRequests({ timeoutMs: 5 });
    await assert.rejects(
        pending.register("r3"),
        error => error.message === GM_RELAY_ERRORS.TIMEOUT
    );
    assert.equal(pending.size, 0);
});

test("pending : timer annulé à l'accusé", async () => {
    const cleared = [];
    const pending = createPendingRequests({
        timeoutMs: 1000,
        setTimeoutFn: () => 42,
        clearTimeoutFn: id => cleared.push(id)
    });
    const promise = pending.register("r4");
    pending.settle("r4", { ok: true });
    await promise;
    assert.deepEqual(cleared, [42]);
});

test("message d'absence de MJ lisible", () => {
    assert.match(GM_RELAY_ERRORS.NO_ACTIVE_GM, /Aucun MJ actif/);
});
