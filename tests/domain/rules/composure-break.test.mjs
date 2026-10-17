import test from "node:test";
import assert from "node:assert/strict";

import {
    COMPOSURE_BROKEN_STATUS_EFFECT,
    isComposureBroken,
    resolveComposureBreakSync,
    buildComposureBreakMessage
} from "../../../src/domain/rules/composure-break.mjs";

test("Brisé quand le Sang-froid atteint ou dépasse le maximum", () => {
    assert.equal(isComposureBroken({ current: 5, max: 5 }), true);
    assert.equal(isComposureBroken({ current: 6, max: 5 }), true);
    assert.equal(isComposureBroken({ current: 4, max: 5 }), false);
});

test("le plafond relevé par un Talent déplace la limite", () => {
    assert.equal(isComposureBroken({ current: 5, max: 6 }), false);
    assert.equal(isComposureBroken({ current: 6, max: 6 }), true);
    assert.equal(isComposureBroken({ current: 7, max: 7 }), true);
});

test("valeurs invalides : jamais Brisé", () => {
    assert.equal(isComposureBroken({}), false);
    assert.equal(isComposureBroken({ current: 0, max: 0 }), false);
    assert.equal(isComposureBroken({ current: "5", max: 5 }), false);
});

test("pose l'état et annonce au passage à Brisé", () => {
    assert.deepEqual(
        resolveComposureBreakSync({ current: 5, max: 5, hasStatus: false }),
        { action: "add", announce: true }
    );
});

test("re-synchronisation : pose sans annonce", () => {
    assert.deepEqual(
        resolveComposureBreakSync({
            current: 5, max: 5, hasStatus: false, announceOnAdd: false
        }),
        { action: "add", announce: false }
    );
});

test("retire l'état quand le Sang-froid repasse sous la limite", () => {
    assert.deepEqual(
        resolveComposureBreakSync({ current: 3, max: 5, hasStatus: true }),
        { action: "remove", announce: false }
    );
});

test("aucune action si l'état est déjà cohérent", () => {
    assert.equal(
        resolveComposureBreakSync({ current: 5, max: 5, hasStatus: true }).action,
        "none"
    );
    assert.equal(
        resolveComposureBreakSync({ current: 2, max: 5, hasStatus: false }).action,
        "none"
    );
});

test("message et état", () => {
    assert.equal(COMPOSURE_BROKEN_STATUS_EFFECT.name, "Brisé");
    assert.match(buildComposureBreakMessage("Ivan"), /Ivan<\/strong> est brisé/);
    assert.match(buildComposureBreakMessage("Ivan"), /Limite de sang-froid atteinte/);
});
