import test from "node:test";
import assert from "node:assert/strict";

import { buildNpcActorData } from "../../../src/data/seed/bestiary-actor-builder.mjs";
import { FACTION_NPCS } from "../../../src/data/seed/faction-npc-catalog.mjs";


test("le catalogue contient 22 PNJ de Factions (Polis 7, Hanse 5, Ligne Rouge 4, Reich 6)", () => {
    assert.equal(FACTION_NPCS.length, 22);
});


test("Natasha Kniazeva n'est volontairement pas cataloguée (personnage fictif dans la fiction)", () => {
    const found = FACTION_NPCS.find((npc) => npc.name.includes("Kniazeva"));
    assert.equal(found, undefined);
});


test("buildNpcActorData (réutilisé) — Vitaly Misko conforme (attributs, Talents, Crainte)", () => {

    const entry = FACTION_NPCS.find((npc) => npc.key === "faction-npc-vitaly-misko");
    const data = buildNpcActorData(entry);

    assert.equal(data.type, "npc");
    assert.equal(data.name, "Vitaly Misko");
    assert.equal(data.system.attributes.spirit.value, 5);
    assert.equal(data.system.attributes.vigor.value, 2);
    assert.match(data.system.identity.role, /Stratège/);
    assert.match(data.system.special, /Crainte/);

    const talentItems = data.items.filter((item) => item.type === "talent");
    assert.equal(talentItems.length, 3);

    const courage = talentItems.find((item) => item.name === "Courage");
    assert.equal(courage.system.level, 2, "marqué (S) -> niveau Supérieur");
});


test("buildNpcActorData — un Talent de plusieurs Archétypes (Inquisiteur) reste résolu et effectif", () => {

    const entry = FACTION_NPCS.find((npc) => npc.key === "faction-npc-le-doyen");
    const data = buildNpcActorData(entry);

    const inquisiteur = data.items.find((item) => item.name === "Inquisiteur");
    assert.ok(inquisiteur);
    assert.equal(inquisiteur.system.key, "inquisiteur");
    assert.ok(inquisiteur.system.effect.length > 0);
});


test("buildAllBestiaryActorsData-style — aucun doublon de seedKey sur l'ensemble des PNJ de Factions", () => {

    const actors = FACTION_NPCS.map(buildNpcActorData);
    const seedKeys = actors.map((actor) => actor.flags["metro-2033-yze"].seedKey);
    assert.equal(new Set(seedKeys).size, seedKeys.length);
});
