import test from "node:test";
import assert from "node:assert/strict";

import { buildNpcActorData } from "../../../src/data/seed/bestiary-actor-builder.mjs";
import { STATION_NPCS } from "../../../src/data/seed/station-npc-catalog.mjs";


test("le catalogue contient 15 PNJ de Stations (Petchatniki 7, Doubrovka 4, Kojoukhovskaya 4)", () => {
    assert.equal(STATION_NPCS.length, 15);
});


test("buildNpcActorData (réutilisé) — Mamouchka conforme (attributs, Talents, Crainte)", () => {

    const entry = STATION_NPCS.find((npc) => npc.key === "station-npc-galina-mamouchka-botcharova");
    const data = buildNpcActorData(entry);

    assert.equal(data.type, "npc");
    assert.equal(data.name, "Galina « Mamouchka » Botcharova");
    assert.equal(data.system.attributes.empathy.value, 5);
    assert.equal(data.system.attributes.spirit.value, 4);
    assert.match(data.system.identity.role, /Diplomate/);
    assert.match(data.system.special, /Crainte/);

    const talentItems = data.items.filter((item) => item.type === "talent");
    assert.equal(talentItems.length, 2);

    const compassion = talentItems.find((item) => item.name === "Compassion");
    assert.equal(compassion.system.level, 2, "marqué (S) -> niveau Supérieur");
});


test("buildNpcActorData — Arme de prédilection reste résolue, la précision d'arme vit dans `special`", () => {

    const entry = STATION_NPCS.find((npc) => npc.key === "station-npc-samuel-vedernikov");
    const data = buildNpcActorData(entry);

    const armeDePredilection = data.items.find(
        (item) => item.name === "Arme de prédilection"
    );
    assert.ok(armeDePredilection);
    assert.equal(armeDePredilection.type, "talent");
    assert.match(data.system.special, /couteau/);
});


test("aucun doublon de seedKey sur l'ensemble des PNJ de Stations", () => {

    const actors = STATION_NPCS.map(buildNpcActorData);
    const seedKeys = actors.map((actor) => actor.flags["metro-2033-yze"].seedKey);
    assert.equal(new Set(seedKeys).size, seedKeys.length);
});
