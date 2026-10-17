import test from "node:test";
import assert from "node:assert/strict";

import {
    resolveAfflictionsForRoll,
    renderAfflictionSummaryContent,
    AFFLICTIONS_RESOLVED_FLAG
} from "../../../src/foundry/afflictions/afflictions-service.mjs";


/* ---------- doubles ---------- */

function createActor({
    available = 2,
    isCharacter = true,
    isOwner = true,
    flags = {},
    attributeAfter = 3,
    resolution = null,
    resolveError = null
} = {}) {

    const calls = {
        resolveRollAfflictions: [],
        setFlag: []
    };

    return {
        calls,
        id: "actor1",
        uuid: "Actor.actor1",
        name: "Artyom",
        isCharacter,
        isOwner,
        flags,
        getFlag(scope, key) {
            return this.flags[`${scope}.${key}`];
        },
        async setFlag(scope, key, value) {
            calls.setFlag.push({ scope, key, value });
            this.flags[`${scope}.${key}`] = value;
        },
        getAvailableAfflictions() {
            return available;
        },
        getAttribute() {
            return attributeAfter;
        },
        items: {
            get: id => id === "w1" ? { id: "w1", name: "Makarov" } : null
        },
        async resolveRollAfflictions(result, allocation) {
            calls.resolveRollAfflictions.push({ result, allocation });
            if (resolveError) {
                throw resolveError;
            }
            return resolution ?? {
                total: available,
                attribute: { id: "agility", applied: allocation.attribute },
                composure: { applied: allocation.composure, reachedBreakingPoint: false },
                stress: { requested: allocation.stress, added: allocation.stress, limitExceeded: false },
                equipment: {
                    requested: 0, applied: false, itemId: null, itemName: null,
                    reliability: null, prevented: false, damage: null
                }
            };
        }
    };
}

const forcedResult = {
    pushCount: 1,
    pool: { equipment: 1 },
    context: { attribute: "agility", equipment: { itemId: "w1" } }
};

function createDeps({ allocation = null, promptError = null } = {}) {

    const log = {
        prompts: [],
        messages: [],
        errors: []
    };

    return {
        log,
        promptAllocation: async options => {
            log.prompts.push(options);
            if (promptError) {
                throw promptError;
            }
            return allocation;
        },
        createChatMessage: async data => {
            log.messages.push(data);
        },
        notifyError: message => log.errors.push(message),
        logError: () => {}
    };
}


/* ---------- tests ---------- */

test("ne fait rien (pas de fenêtre) s'il n'y a aucune affliction disponible", async () => {
    const actor = createActor({ available: 0 });
    const deps = createDeps();

    const outcome = await resolveAfflictionsForRoll(
        { actor, result: forcedResult, rollKey: "k-zero" }, deps
    );

    assert.equal(outcome, null);
    assert.equal(deps.log.prompts.length, 0);
    assert.equal(actor.calls.resolveRollAfflictions.length, 0);
    assert.equal(deps.log.messages.length, 0);
    assert.equal(actor.calls.setFlag.length, 0);
});

test("ignore un acteur qui n'est pas un Personnage ou dont l'utilisateur n'est pas propriétaire", async () => {
    const deps = createDeps();

    assert.equal(
        await resolveAfflictionsForRoll(
            { actor: createActor({ isCharacter: false }), result: forcedResult, rollKey: "k-npc" }, deps
        ),
        null
    );

    assert.equal(
        await resolveAfflictionsForRoll(
            { actor: createActor({ isOwner: false }), result: forcedResult, rollKey: "k-notowner" }, deps
        ),
        null
    );

    assert.equal(deps.log.prompts.length, 0);
});

test("refuse de s'ouvrir sans clé de jet (ni message.id) : idempotence impossible", async () => {
    const actor = createActor();
    const deps = createDeps();

    const outcome = await resolveAfflictionsForRoll(
        { actor, result: forcedResult }, deps
    );

    assert.equal(outcome, null);
    assert.equal(deps.log.prompts.length, 0);
});

test("ouvre la fenêtre avec le bon contexte, applique la répartition choisie et poste le résumé", async () => {
    const actor = createActor({ available: 2, attributeAfter: 1 });
    const deps = createDeps({
        allocation: { attribute: 1, composure: 0, stress: 0, equipment: 1 }
    });

    const outcome = await resolveAfflictionsForRoll(
        {
            actor,
            result: forcedResult,
            message: { id: "msg1" },
            rollLabel: "Tir au Makarov"
        },
        deps
    );

    assert.equal(deps.log.prompts.length, 1);
    assert.equal(deps.log.prompts[0].available, 2);
    assert.equal(deps.log.prompts[0].attributeLabel, "Agilité");
    assert.equal(deps.log.prompts[0].equipment.allowed, true);
    assert.equal(deps.log.prompts[0].equipment.label, "Makarov");

    assert.equal(actor.calls.resolveRollAfflictions.length, 1);
    assert.deepEqual(
        actor.calls.resolveRollAfflictions[0].allocation,
        { attribute: 1, composure: 0, stress: 0, equipment: 1 }
    );

    assert.equal(deps.log.messages.length, 1);
    assert.match(deps.log.messages[0].content, /Artyom/);
    assert.match(deps.log.messages[0].content, /Tir au Makarov/);
    assert.match(deps.log.messages[0].content, /Agilité/);
    assert.equal(outcome.closedWithoutChoice, false);
});

test("fermeture sans répartir : tout est appliqué en dégâts d'attribut, équipement exclu", async () => {
    const actor = createActor({ available: 3 });
    const deps = createDeps({ allocation: null });

    const outcome = await resolveAfflictionsForRoll(
        { actor, result: forcedResult, message: { id: "msg2" } }, deps
    );

    assert.deepEqual(
        actor.calls.resolveRollAfflictions[0].allocation,
        { attribute: 3, composure: 0, stress: 0, equipment: 0 }
    );
    assert.equal(outcome.closedWithoutChoice, true);
    assert.match(deps.log.messages[0].content, /fenêtre fermée|sans répartir/i);
});

test("jet non forcé : l'équipement n'est pas proposé", async () => {
    const actor = createActor({ available: 1 });
    const deps = createDeps({ allocation: null });

    await resolveAfflictionsForRoll(
        {
            actor,
            result: { ...forcedResult, pushCount: 0 },
            message: { id: "msg3" }
        },
        deps
    );

    assert.equal(deps.log.prompts[0].equipment.allowed, false);
});

test("une erreur de la fenêtre retombe sur le défaut (tout en attribut)", async () => {
    const actor = createActor({ available: 2 });
    const deps = createDeps({ promptError: new Error("DialogV2 indisponible") });

    await resolveAfflictionsForRoll(
        { actor, result: forcedResult, message: { id: "msg4" } }, deps
    );

    assert.deepEqual(
        actor.calls.resolveRollAfflictions[0].allocation,
        { attribute: 2, composure: 0, stress: 0, equipment: 0 }
    );
});

test("une allocation invalide renvoyée par la fenêtre est remplacée par le défaut", async () => {
    const actor = createActor({ available: 2 });
    const deps = createDeps({
        allocation: { attribute: 5, composure: 0, stress: 0, equipment: 0 }
    });

    await resolveAfflictionsForRoll(
        { actor, result: forcedResult, message: { id: "msg5" } }, deps
    );

    assert.deepEqual(
        actor.calls.resolveRollAfflictions[0].allocation,
        { attribute: 2, composure: 0, stress: 0, equipment: 0 }
    );
});

test("idempotence : un second appel pour le même jet ne fait rien (flag de l'Actor)", async () => {
    const actor = createActor({ available: 1 });
    const deps = createDeps({ allocation: null });
    const params = { actor, result: forcedResult, message: { id: "msg6" } };

    await resolveAfflictionsForRoll(params, deps);
    const second = await resolveAfflictionsForRoll(params, deps);

    assert.equal(second, null);
    assert.equal(deps.log.prompts.length, 1);
    assert.equal(actor.calls.resolveRollAfflictions.length, 1);
    assert.deepEqual(
        actor.flags[`metro-2033-yze.${AFFLICTIONS_RESOLVED_FLAG}`],
        ["msg6"]
    );
});

test("idempotence : deux appels simultanés n'ouvrent qu'une seule fenêtre", async () => {
    const actor = createActor({ available: 1 });
    const deps = createDeps({ allocation: null });
    const params = { actor, result: forcedResult, message: { id: "msg7" } };

    await Promise.all([
        resolveAfflictionsForRoll(params, deps),
        resolveAfflictionsForRoll(params, deps)
    ]);

    assert.equal(deps.log.prompts.length, 1);
    assert.equal(actor.calls.resolveRollAfflictions.length, 1);
});

test("idempotence : la clé est enregistrée AVANT l'ouverture de la fenêtre", async () => {
    const actor = createActor({ available: 1 });
    const deps = createDeps({ allocation: null });
    let flagAtPromptTime = null;

    const originalPrompt = deps.promptAllocation;
    deps.promptAllocation = async options => {
        flagAtPromptTime =
            actor.flags[`metro-2033-yze.${AFFLICTIONS_RESOLVED_FLAG}`];
        return originalPrompt(options);
    };

    await resolveAfflictionsForRoll(
        { actor, result: forcedResult, message: { id: "msg8" } }, deps
    );

    assert.deepEqual(flagAtPromptTime, ["msg8"]);
});

test("si l'enregistrement du flag échoue, rien n'est appliqué (jamais deux fois)", async () => {
    const actor = createActor({ available: 1 });
    actor.setFlag = async () => { throw new Error("permission refusée"); };
    const deps = createDeps({ allocation: null });

    const outcome = await resolveAfflictionsForRoll(
        { actor, result: forcedResult, message: { id: "msg9" } }, deps
    );

    assert.equal(outcome, null);
    assert.equal(deps.log.prompts.length, 0);
    assert.equal(actor.calls.resolveRollAfflictions.length, 0);
});

test("une erreur d'application est signalée, ne lève pas, et n'est pas rejouée", async () => {
    const actor = createActor({ available: 1, resolveError: new Error("boom") });
    const deps = createDeps({ allocation: null });
    const params = { actor, result: forcedResult, message: { id: "msg10" } };

    const outcome = await resolveAfflictionsForRoll(params, deps);
    const retry = await resolveAfflictionsForRoll(params, deps);

    assert.equal(outcome, null);
    assert.equal(retry, null);
    assert.equal(deps.log.errors.length, 1);
    assert.equal(actor.calls.resolveRollAfflictions.length, 1);
    assert.equal(deps.log.messages.length, 0);
});

test("une erreur de création du message de résumé ne lève pas", async () => {
    const actor = createActor({ available: 1 });
    const deps = createDeps({ allocation: null });
    deps.createChatMessage = async () => { throw new Error("chat KO"); };

    const outcome = await resolveAfflictionsForRoll(
        { actor, result: forcedResult, message: { id: "msg11" } }, deps
    );

    assert.notEqual(outcome, null);
    assert.equal(actor.calls.resolveRollAfflictions.length, 1);
});

test("renderAfflictionSummaryContent échappe le HTML et liste les lignes", () => {
    const html = renderAfflictionSummaryContent({
        actorName: "<b>Artyom</b>",
        rollLabel: "Jet <i>x</i>",
        total: 2,
        lines: ["Dégâts à Agilité : −2 (3 → 1)"],
        closedWithoutChoice: false
    });

    assert.doesNotMatch(html, /<b>Artyom/);
    assert.match(html, /&lt;b&gt;Artyom/);
    assert.match(html, /Dégâts à Agilité/);
    assert.match(html, /2 affliction/);
});
