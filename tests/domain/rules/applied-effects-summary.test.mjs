import test from "node:test";
import assert from "node:assert/strict";
import { summarizeMeleeAppliedEffects } from "../../../src/domain/rules/applied-effects-summary.mjs";

const names = { attackerName: "Bandit", defenderName: "Artyom" };

test("aucune étape : liste vide", () => {
    assert.deepEqual(summarizeMeleeAppliedEffects({}, names), []);
    assert.deepEqual(summarizeMeleeAppliedEffects(undefined, names), []);
});

test("étapes non appliquées ignorées", () => {
    const steps = {
        vigorDamage: { applied: false, reason: "no-damage", requestedDamage: 0 },
        swapInitiative: { applied: false, scheduled: false, reason: "not-selected" }
    };
    assert.deepEqual(summarizeMeleeAppliedEffects(steps, names), []);
});

test("dégâts de Vigueur avec valeurs avant/après", () => {
    const steps = { vigorDamage: { applied: true, attribute: "vigor", previous: 4, current: 1, damage: 3, overflow: 0, broken: false } };
    assert.deepEqual(summarizeMeleeAppliedEffects(steps, names), ["Artyom : Vigueur −3 (4 → 1)"]);
});

test("attribut à 0 : Brisé signalé", () => {
    const steps = { agilityDamage: { applied: true, attribute: "agility", previous: 2, current: 0, damage: 2, overflow: 1, broken: true } };
    assert.deepEqual(summarizeMeleeAppliedEffects(steps, names), ["Artyom : Agilité −2 (2 → 0) — Brisé"]);
});

test("Protection dégradée", () => {
    const steps = { protectionDamage: { applied: true, requestedDamage: 2, appliedDamage: 2, overflow: 0 } };
    assert.deepEqual(summarizeMeleeAppliedEffects(steps, names), ["Protection de Artyom dégradée de 2"]);
});

test("échange d'initiative programmé ou immédiat", () => {
    assert.deepEqual(
        summarizeMeleeAppliedEffects({ swapInitiative: { applied: false, scheduled: true, applyRound: 3 } }, names),
        ["Échange d'initiative programmé au round 3"]
    );
    assert.deepEqual(
        summarizeMeleeAppliedEffects({ swapInitiative: { applied: true } }, names),
        ["Initiative échangée entre Bandit et Artyom"]
    );
});

test("désarmement, renversement, lutte", () => {
    const steps = {
        disarm: { applied: true, narrative: true, targetName: "Artyom" },
        knockdown: { applied: true, targetName: "Artyom" },
        grapple: { applied: true }
    };
    assert.deepEqual(summarizeMeleeAppliedEffects(steps, names), [
        "Artyom est désarmé (arme lâchée, à arbitrer par le MJ)",
        "Artyom est renversé",
        "Lutte engagée entre Bandit et Artyom"
    ]);
});

test("cible déjà à terre", () => {
    const steps = { knockdown: { applied: true, alreadyProne: true, targetName: "Artyom" } };
    assert.deepEqual(summarizeMeleeAppliedEffects(steps, names), ["Artyom est déjà à terre"]);
});

test("blocage : contre-attaque et désarmement de l'attaquant", () => {
    const steps = {
        blockCounterAttack: { applied: true, attribute: "vigor", previous: 3, current: 2, damage: 1, broken: false },
        blockDisarm: { applied: true, narrative: true, targetName: "Bandit" }
    };
    assert.deepEqual(summarizeMeleeAppliedEffects(steps, names), [
        "Contre-attaque — Bandit : Vigueur −1 (3 → 2)",
        "Bandit est désarmé par le blocage (arme lâchée, à arbitrer par le MJ)"
    ]);
});

import { summarizeMeleeStunts } from "../../../src/domain/rules/applied-effects-summary.mjs";

test("éclats : aucun éclat choisi", () => {
    assert.deepEqual(summarizeMeleeStunts({ resolved: false }), []);
    assert.deepEqual(summarizeMeleeStunts({ resolved: true, spent: 0, effects: {} }), []);
});

test("éclats : effets choisis et réussites dépensées", () => {
    const lines = summarizeMeleeStunts({
        resolved: true, available: 3, spent: 3, remaining: 0,
        effects: { vigorDamage: 1, agilityDamage: 0, swapInitiative: true, disarm: false, knockdown: true, grapple: false }
    });
    assert.deepEqual(lines, [
        "Éclats : 3 réussite(s) dépensée(s) sur 3",
        "+1 dégât de Vigueur",
        "Échange d'initiative",
        "Renversement"
    ]);
});

test("éclats : dégâts multiples, désarmement, lutte, Agilité", () => {
    const lines = summarizeMeleeStunts({
        resolved: true, available: 4, spent: 4, remaining: 0,
        effects: { vigorDamage: 2, agilityDamage: 1, swapInitiative: false, disarm: true, knockdown: false, grapple: true }
    });
    assert.deepEqual(lines, [
        "Éclats : 4 réussite(s) dépensée(s) sur 4",
        "+2 dégâts de Vigueur",
        "+1 dégât d'Agilité",
        "Désarmement",
        "Lutte"
    ]);
});
