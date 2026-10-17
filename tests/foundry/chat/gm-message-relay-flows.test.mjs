import { test } from "node:test";
import assert from "node:assert/strict";

import {
    GM_RELAY_ALLOWED_FLAGS,
    GM_RELAY_FLAG_RULES,
    findRelayFlagName,
    relayFlagUpdateKey,
    validateRelayedUpdate
} from "../../../src/domain/rules/gm-message-relay.mjs";


const ACTOR = "Actor.abc";

function run(flagName, current, nextFlag, extra = {}, { owner = true } = {}) {
    const key = relayFlagUpdateKey(flagName);
    const update = {
        content: "<div>ignoré</div>",
        [key]: nextFlag,
        ...extra
    };
    return validateRelayedUpdate({
        update,
        currentFlags: { [flagName]: current },
        requesterIsOwner: owner
    });
}

const ok = (...args) => assert.equal(run(...args).ok, true, JSON.stringify(run(...args)));
const refused = (...args) => assert.equal(run(...args).ok, false);


test("flags relayables : Coup de grâce + 5 flux de survie", () => {
    assert.deepEqual(
        [...GM_RELAY_ALLOWED_FLAGS].sort(),
        ["asphyxiationRoll", "coupDeGrace", "fireRoll", "illnessRoll", "poisonRoll", "terrorRoll"]
    );
    assert.ok(Object.isFrozen(GM_RELAY_FLAG_RULES));
    assert.equal(GM_RELAY_FLAG_RULES.coupDeGrace.contentMode, "free");
    for (const name of ["terrorRoll", "poisonRoll", "illnessRoll", "asphyxiationRoll", "fireRoll"]) {
        assert.equal(GM_RELAY_FLAG_RULES[name].contentMode, "rendered");
    }
});

test("findRelayFlagName", () => {
    assert.equal(findRelayFlagName({ [relayFlagUpdateKey("poisonRoll")]: {} }), "poisonRoll");
    assert.equal(findRelayFlagName({ [relayFlagUpdateKey("autre")]: {} }), null);
    assert.equal(findRelayFlagName({
        [relayFlagUpdateKey("poisonRoll")]: {},
        [relayFlagUpdateKey("illnessRoll")]: {}
    }), null);
    assert.equal(findRelayFlagName(null), null);
    assert.equal(findRelayFlagName({ content: "x" }), null);
});


/* ------------------------------ Terreur ------------------------------ */

const terrorPending = {
    actorUuid: ACTOR, terrorValue: 3, sourceLabel: "Hurlement", rolled: false
};
const terrorDone = {
    ...terrorPending, rolled: true, diceValues: [6, 2, 6], successes: 2, damage: 2, affected: true
};

test("Terreur : résolution valide (avec et sans réussite)", () => {
    ok("terrorRoll", terrorPending, terrorDone, { rolls: [{ class: "Roll" }], sound: "s.wav" });
    ok("terrorRoll", terrorPending, {
        ...terrorPending, rolled: true, diceValues: [1, 2], successes: 0, damage: 0, affected: false
    });
    // aucun dé physique (pool vide) : pas de rolls
    ok("terrorRoll", terrorPending, {
        ...terrorPending, rolled: true, diceValues: [], successes: 0, damage: 0, affected: false
    });
});

test("Terreur : refus (propriétaire, déjà jeté, identité, incohérence, champs)", () => {
    refused("terrorRoll", terrorPending, terrorDone, {}, { owner: false });
    refused("terrorRoll", terrorDone, terrorDone);
    refused("terrorRoll", terrorPending, { ...terrorDone, actorUuid: "Actor.zzz" });
    refused("terrorRoll", terrorPending, { ...terrorDone, terrorValue: 0 });
    refused("terrorRoll", terrorPending, { ...terrorDone, sourceLabel: "Autre" });
    refused("terrorRoll", terrorPending, { ...terrorDone, damage: 5 });
    refused("terrorRoll", terrorPending, { ...terrorDone, affected: false });
    refused("terrorRoll", terrorPending, { ...terrorDone, successes: -1, damage: -1 });
    refused("terrorRoll", terrorPending, { ...terrorDone, successes: 2.5 });
    refused("terrorRoll", terrorPending, { ...terrorDone, diceValues: [7] });
    refused("terrorRoll", terrorPending, { ...terrorDone, diceValues: "6" });
    refused("terrorRoll", terrorPending, { ...terrorDone, rolled: false });
    refused("terrorRoll", terrorPending, { ...terrorDone, bonus: 9 });
    refused("terrorRoll", terrorPending, terrorDone, { rolls: [{}, {}] });
    refused("terrorRoll", terrorPending, terrorDone, { author: "x" });
    refused("terrorRoll", terrorPending, terrorDone, { whisper: ["x"] });
});


/* ---------------------------- Asphyxie ---------------------------- */

const asphPending = { actorUuid: ACTOR, sourceLabel: null, sourceLevel: "extreme", rolled: false };
const asphDone = { ...asphPending, rolled: true, diceValues: [3, 4], successes: 0, failed: true };

test("Asphyxie : résolution valide (échec et réussite)", () => {
    ok("asphyxiationRoll", asphPending, asphDone);
    ok("asphyxiationRoll", asphPending, {
        ...asphPending, rolled: true, diceValues: [6], successes: 1, failed: false
    });
});

test("Asphyxie : refus", () => {
    refused("asphyxiationRoll", asphPending, asphDone, {}, { owner: false });
    refused("asphyxiationRoll", asphDone, asphDone);
    refused("asphyxiationRoll", asphPending, { ...asphDone, failed: false });
    refused("asphyxiationRoll", asphPending, { ...asphDone, successes: 2 });
    refused("asphyxiationRoll", asphPending, { ...asphDone, sourceLevel: "light" });
    refused("asphyxiationRoll", asphPending, { ...asphDone, actorUuid: "Actor.zzz" });
    refused("asphyxiationRoll", asphPending, { ...asphDone, extra: 1 });
    // la carte d'état de l'Asphyxie ne reçoit aucun Roll
    refused("asphyxiationRoll", asphPending, asphDone, { rolls: [{}] });
});


/* ------------------------------- Feu ------------------------------- */

const firePending = { actorUuid: ACTOR, sourceLabel: "Brasero", intensity: 8, rolled: false };
const fireDone = {
    ...firePending,
    rolled: true,
    diceValues: [6, 6, 6, 1, 2, 3, 4, 5],
    successes: 3,
    remainingDamage: 2,
    ignites: true,
    deathRollRequired: false
};

test("Feu : résolution valide (brûle, ou ne brûle pas)", () => {
    ok("fireRoll", firePending, fireDone);
    ok("fireRoll", firePending, {
        ...fireDone, successes: 0, remainingDamage: 0, ignites: false,
        diceValues: [1, 2, 3, 4, 5, 1, 2, 3]
    });
    ok("fireRoll", firePending, { ...fireDone, deathRollRequired: true });
});

test("Feu : refus", () => {
    refused("fireRoll", firePending, fireDone, {}, { owner: false });
    refused("fireRoll", fireDone, fireDone);
    refused("fireRoll", firePending, { ...fireDone, ignites: false });
    refused("fireRoll", firePending, { ...fireDone, remainingDamage: 4 });
    refused("fireRoll", firePending, { ...fireDone, successes: 9, remainingDamage: 2 });
    refused("fireRoll", firePending, { ...fireDone, diceValues: [6, 6] });
    refused("fireRoll", firePending, { ...fireDone, intensity: 20 });
    refused("fireRoll", firePending, { ...fireDone, actorUuid: "Actor.zzz" });
    refused("fireRoll", firePending, { ...fireDone, deathRollRequired: "oui" });
    refused("fireRoll", firePending, { ...fireDone, extra: 1 });
    refused("fireRoll", firePending, fireDone, { rolls: [{}] });
});


/* ------------------- Poison / Maladie (opposition) ------------------- */

function victimResult(successes, pushCount) {
    return { successes, pushCount, dice: {}, history: [], context: {} };
}

const poisonPending = {
    actorUuid: ACTOR, effectTypeKey: "lethal", toxicity: 3,
    sourceLabel: null, bladePoison: false, rolled: false, applied: false
};
const poisonRolled = {
    ...poisonPending, rolled: true, applied: false,
    victimResult: victimResult(1, 0), victimDiceValues: [6, 2],
    victimSuccesses: 1, poisonDiceValues: [6, 6, 3], poisonSuccesses: 2
};
const poisonPushed = {
    ...poisonRolled,
    victimResult: victimResult(2, 1), victimDiceValues: [6, 6], victimSuccesses: 2
};
const poisonAccepted = { ...poisonRolled, applied: true, fullEffect: true };

test("Poison : résolution (2 rolls), Push, acceptation valides", () => {
    ok("poisonRoll", poisonPending, poisonRolled, { rolls: [{}, {}], sound: "s.wav" });
    ok("poisonRoll", poisonPending, poisonRolled);
    ok("poisonRoll", poisonRolled, poisonPushed);
    ok("poisonRoll", poisonPushed, {
        ...poisonPushed, victimResult: victimResult(2, 2)
    });
    // acceptation : poison 2 > victime 1 => effets complets
    ok("poisonRoll", poisonRolled, poisonAccepted);
    // acceptation après Push : victime 2 = poison 2 => effets réduits
    ok("poisonRoll", poisonPushed, { ...poisonPushed, applied: true, fullEffect: false });
});

test("Poison : refus à la résolution", () => {
    refused("poisonRoll", poisonPending, poisonRolled, {}, { owner: false });
    refused("poisonRoll", poisonPending, { ...poisonRolled, applied: true, fullEffect: true });
    refused("poisonRoll", poisonPending, { ...poisonRolled, victimResult: victimResult(1, 1) });
    refused("poisonRoll", poisonPending, { ...poisonRolled, victimSuccesses: 3 });
    refused("poisonRoll", poisonPending, { ...poisonRolled, poisonDiceValues: [9] });
    refused("poisonRoll", poisonPending, { ...poisonRolled, poisonSuccesses: -1 });
    refused("poisonRoll", poisonPending, { ...poisonRolled, fullEffect: false });
    refused("poisonRoll", poisonPending, { ...poisonRolled, effectTypeKey: "sleep" });
    refused("poisonRoll", poisonPending, { ...poisonRolled, toxicity: 0 });
    refused("poisonRoll", poisonPending, { ...poisonRolled, bladePoison: true });
    refused("poisonRoll", poisonPending, { ...poisonRolled, sourceLabel: "x" });
    refused("poisonRoll", poisonPending, poisonRolled, { rolls: [{}, {}, {}] });
    refused("poisonRoll", poisonPending, { ...poisonRolled, victimResult: "x" });
    refused("poisonRoll", poisonPending, { ...poisonRolled, hack: 1 });
});

test("Poison : refus du Push", () => {
    refused("poisonRoll", poisonRolled, poisonPushed, {}, { owner: false });
    // pushCount identique ou +2
    refused("poisonRoll", poisonRolled, { ...poisonPushed, victimResult: victimResult(2, 0) });
    refused("poisonRoll", poisonRolled, { ...poisonPushed, victimResult: victimResult(2, 2) });
    // 3e Push
    refused("poisonRoll", { ...poisonPushed, victimResult: victimResult(2, 2) },
        { ...poisonPushed, victimResult: victimResult(2, 3) });
    // jet du poison réécrit
    refused("poisonRoll", poisonRolled, { ...poisonPushed, poisonSuccesses: 0 });
    refused("poisonRoll", poisonRolled, { ...poisonPushed, poisonDiceValues: [1] });
    // réussites incohérentes avec le résultat
    refused("poisonRoll", poisonRolled, { ...poisonPushed, victimSuccesses: 5 });
    // résultat d'acceptation prématuré
    refused("poisonRoll", poisonRolled, { ...poisonPushed, fullEffect: false });
    // pas de Roll à ce stade
    refused("poisonRoll", poisonRolled, poisonPushed, { rolls: [{}] });
    // identité
    refused("poisonRoll", poisonRolled, { ...poisonPushed, actorUuid: "Actor.zzz" });
    refused("poisonRoll", poisonRolled, { ...poisonPushed, toxicity: 1 });
    refused("poisonRoll", poisonRolled, { ...poisonPushed, rolled: false });
});

test("Poison : refus de l'acceptation", () => {
    refused("poisonRoll", poisonRolled, poisonAccepted, {}, { owner: false });
    // issue fabriquée
    refused("poisonRoll", poisonRolled, { ...poisonAccepted, fullEffect: false });
    refused("poisonRoll", poisonRolled, { ...poisonAccepted, fullEffect: undefined });
    refused("poisonRoll", poisonRolled, { ...poisonAccepted, bladeNoEffect: true });
    // jet modifié à l'acceptation
    refused("poisonRoll", poisonRolled, { ...poisonAccepted, victimSuccesses: 0, victimResult: victimResult(0, 0) });
    refused("poisonRoll", poisonRolled, { ...poisonAccepted, victimResult: victimResult(1, 1) });
    refused("poisonRoll", poisonRolled, { ...poisonAccepted, poisonSuccesses: 0 });
    refused("poisonRoll", poisonRolled, { ...poisonAccepted, victimDiceValues: [6, 6] });
    // retour en arrière / passage direct
    refused("poisonRoll", poisonRolled, { ...poisonAccepted, applied: false });
    refused("poisonRoll", poisonRolled, { ...poisonAccepted, rolled: false });
    refused("poisonRoll", poisonPending, poisonAccepted);
    // Roll joint à l'acceptation
    refused("poisonRoll", poisonRolled, poisonAccepted, { rolls: [{}] });
});

test("Poison : carte déjà acceptée jamais réécrite", () => {
    refused("poisonRoll", poisonAccepted, poisonAccepted);
    refused("poisonRoll", poisonAccepted, { ...poisonAccepted, fullEffect: false });
    refused("poisonRoll", poisonAccepted, poisonPushed);
});

test("Poison de lame : acceptation recalculée avec bladeNoEffect", () => {
    const bladePending = { ...poisonPending, bladePoison: true };
    const bladeRolled = { ...poisonRolled, bladePoison: true };
    ok("poisonRoll", bladePending, bladeRolled);
    // victime 1 < poison 2 : le poison l'emporte => bladeNoEffect false
    ok("poisonRoll", bladeRolled, { ...bladeRolled, applied: true, bladeNoEffect: false });
    refused("poisonRoll", bladeRolled, { ...bladeRolled, applied: true, bladeNoEffect: true });
    // fullEffect interdit en mode lame
    refused("poisonRoll", bladeRolled, { ...bladeRolled, applied: true, fullEffect: true });
    refused("poisonRoll", bladeRolled, { ...bladeRolled, applied: true, bladeNoEffect: false, fullEffect: true });
    // victime >= poison => aucun effet
    const tie = { ...bladeRolled, victimSuccesses: 2, victimResult: victimResult(2, 0) };
    ok("poisonRoll", tie, { ...tie, applied: true, bladeNoEffect: true });
    refused("poisonRoll", tie, { ...tie, applied: true, bladeNoEffect: false });
    // mode non modifiable par le demandeur
    refused("poisonRoll", bladeRolled, { ...bladeRolled, bladePoison: false, applied: true, fullEffect: true });
});

const illPending = {
    actorUuid: ACTOR, virulence: 2, sourceLabel: "Fièvre", rolled: false, applied: false
};
const illRolled = {
    ...illPending, rolled: true, applied: false,
    victimResult: victimResult(0, 0), victimDiceValues: [2, 3],
    victimSuccesses: 0, illnessDiceValues: [6, 1], illnessSuccesses: 1
};
const illPushed = {
    ...illRolled, victimResult: victimResult(1, 1), victimDiceValues: [6, 3], victimSuccesses: 1
};

test("Maladie : résolution, Push, acceptation valides", () => {
    ok("illnessRoll", illPending, illRolled, { rolls: [{}, {}] });
    ok("illnessRoll", illRolled, illPushed);
    // victime 0 < maladie 1 : malade
    ok("illnessRoll", illRolled, { ...illRolled, applied: true, sick: true });
    // après Push : victime 1 = maladie 1 : pas malade
    ok("illnessRoll", illPushed, { ...illPushed, applied: true, sick: false });
});

test("Maladie : refus", () => {
    refused("illnessRoll", illPending, illRolled, {}, { owner: false });
    refused("illnessRoll", illPending, { ...illRolled, virulence: 9 });
    refused("illnessRoll", illPending, { ...illRolled, sick: true });
    refused("illnessRoll", illPending, { ...illRolled, victimResult: victimResult(0, 1) });
    refused("illnessRoll", illPending, illRolled, { rolls: new Array(3).fill({}) });
    // Push
    refused("illnessRoll", illRolled, { ...illPushed, illnessSuccesses: 0 });
    refused("illnessRoll", illRolled, { ...illPushed, victimResult: victimResult(1, 2) });
    refused("illnessRoll", illRolled, illPushed, { rolls: [{}] });
    refused("illnessRoll", illRolled, { ...illPushed, sourceLabel: "Autre" });
    // acceptation
    refused("illnessRoll", illRolled, { ...illRolled, applied: true, sick: false });
    refused("illnessRoll", illRolled, { ...illRolled, applied: true });
    refused("illnessRoll", illRolled, { ...illRolled, applied: true, sick: true, victimSuccesses: 9 });
    refused("illnessRoll", illPushed, { ...illPushed, applied: true, sick: true });
    // déjà appliquée
    refused("illnessRoll", { ...illRolled, applied: true, sick: true }, { ...illRolled, applied: true, sick: false });
    refused("illnessRoll", { ...illRolled, applied: true, sick: true }, illPushed);
});


/* --------------------------- Transverse --------------------------- */

test("flag d'un autre flux / inconnu / multiple refusés", () => {
    // le message porte terrorRoll mais la mise à jour vise poisonRoll
    const result = validateRelayedUpdate({
        update: { [relayFlagUpdateKey("poisonRoll")]: poisonRolled },
        currentFlags: { terrorRoll: terrorPending },
        requesterIsOwner: true
    });
    assert.equal(result.ok, false);
    refused("terrorRoll", terrorPending, terrorDone, { [relayFlagUpdateKey("poisonRoll")]: poisonRolled });
    assert.equal(
        validateRelayedUpdate({
            update: { [relayFlagUpdateKey("rollResult")]: { actorUuid: ACTOR } },
            currentFlags: { rollResult: { actorUuid: ACTOR } },
            requesterIsOwner: true
        }).ok,
        false
    );
});

test("résultat de validation : mode de contenu et flag validé", () => {
    const result = run("terrorRoll", terrorPending, terrorDone);
    assert.equal(result.flagName, "terrorRoll");
    assert.equal(result.contentMode, "rendered");
    assert.deepEqual(result.nextFlag, terrorDone);
    assert.equal(
        run("coupDeGrace",
            { actorUuid: ACTOR, resolved: false },
            { actorUuid: ACTOR, resolved: true }
        ).contentMode,
        "free"
    );
});
