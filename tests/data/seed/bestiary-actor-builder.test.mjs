import test from "node:test";
import assert from "node:assert/strict";

import {
    buildCreatureActorData,
    buildNpcActorData,
    buildAllBestiaryActorsData
} from "../../../src/data/seed/bestiary-actor-builder.mjs";

import { CREATURES } from "../../../src/data/seed/creature-catalog.mjs";
import { BESTIARY_NPCS } from "../../../src/data/seed/bestiary-npc-catalog.mjs";


test("le bestiaire contient 15 Créatures et 3 PNJ", () => {
    assert.equal(CREATURES.length, 15);
    assert.equal(BESTIARY_NPCS.length, 3);
});


test("buildCreatureActorData — Bibliothécaire conforme (attributs, protection, attaques)", () => {

    const entry = CREATURES.find((creature) => creature.key === "creature-bibliothecaire");
    const data = buildCreatureActorData(entry);

    assert.equal(data.type, "creature");
    assert.equal(data.name, "Bibliothécaire");
    assert.equal(data.system.attributes.vigor.value, 5);
    assert.equal(data.system.attributes.empathy.value, 1);
    assert.equal(data.system.naturalProtection.value, 6);
    assert.equal(data.system.naturalProtection.resilience, true);

    assert.equal(data.items.filter((item) => item.type === "weapon").length, 2);
    assert.equal(data.items.filter((item) => item.type === "talent").length, 1);
    const griffes = data.items.find((item) => item.name === "Griffes");
    assert.equal(griffes.type, "weapon");
    assert.equal(griffes.system.category, "melee");
    assert.equal(griffes.system.damage, 2);
    assert.equal(griffes.system.bonus.max, 2);
});


test("buildCreatureActorData — le jet d'acide de la Fourmi vorace est classé comme attaque à distance", () => {

    const entry = CREATURES.find((creature) => creature.key === "creature-fourmi-vorace");
    const data = buildCreatureActorData(entry);

    const acide = data.items.find((item) => item.name.includes("acide"));
    assert.equal(acide.system.category, "ranged");
    assert.equal(acide.system.range, "short");
});


test("buildCreatureActorData — Ver sanguin porte sa Résilience conditionnelle", () => {

    const entry = CREATURES.find((creature) => creature.key === "creature-ver-sanguin");
    const data = buildCreatureActorData(entry);

    assert.match(data.system.naturalProtection.resilienceCondition, /perforantes/);
});


test("buildNpcActorData — Kot Baïoun conforme (attributs 0-5, Talents référencés)", () => {

    const entry = BESTIARY_NPCS.find((npc) => npc.key === "npc-kot-baioun");
    const data = buildNpcActorData(entry);

    assert.equal(data.type, "npc");
    assert.equal(data.system.attributes.agility.value, 5);
    assert.equal(data.system.identity.role, "Errant — figure légendaire (chat mutant intelligent)");

    const talentItems = data.items.filter((item) => item.type === "talent");
    assert.equal(talentItems.length, 9);

    const armorItems = data.items.filter((item) => item.type === "armor");
    assert.equal(armorItems.length, 1);
    assert.equal(armorItems[0].name, "Veste renforcée");
});


test("buildNpcActorData — un Talent référencé réutilise la clé mécanique et l'effet du catalogue Talents", () => {

    const entry = BESTIARY_NPCS.find((npc) => npc.key === "npc-la-ksatriya");
    const data = buildNpcActorData(entry);

    // Livre p.124 : « Spécialiste en armement (armes à distance) », sans (S).
    const specialiste = data.items.find((item) => item.system.key === "weaponSpecialist");
    assert.equal(specialiste.name, "Spécialiste en armement (Arme à distance)");
    assert.ok(specialiste.system.effect.length > 0);
    assert.equal(specialiste.system.level, 1, "pas de (S) dans le livre -> niveau 1");
    assert.equal(specialiste.system.configuration.weaponType, "ranged");

    // Livre : « Garde du corps (S) » et « Tenace (S) » -> niveau Supérieur.
    const garde = data.items.find((item) => item.name === "Garde du corps");
    assert.equal(garde.system.level, 2);

    // Livre : « Tireur instinctif » (et non Tireur d'élite).
    assert.ok(data.items.some((item) => item.name === "Tireur instinctif"));
    assert.ok(!data.items.some((item) => item.name === "Tireur d'élite"));
});


test("Bestiaire — transcription vérifiée contre le livre (MET-06 v3)", () => {

    const sentinelle = CREATURES.find((c) => c.key === "creature-sentinelle");
    assert.match(sentinelle.special, /Vicieuse/);
    assert.match(sentinelle.special, /attaque de morsure sur la même cible/);

    const vodianoi = CREATURES.find((c) => c.key === "creature-vodianoi");
    assert.equal(vodianoi.skills.shooting, 2);
    assert.equal(vodianoi.skills.closeCombat, 1);
    assert.match(vodianoi.special, /Toxicité 6, poison paralysant/);

    const ver = CREATURES.find((c) => c.key === "creature-ver-sanguin");
    assert.ok(ver.weapons.some((w) => w.name === "Dents"));

    const brahmane = BESTIARY_NPCS.find((n) => n.key === "npc-le-brahmane");
    assert.equal(brahmane.attributes.spirit.value, 4);

    const kot = BESTIARY_NPCS.find((n) => n.key === "npc-kot-baioun");
    const maitrise = kot.talents.find((t) => t.name === "Maîtrise de soi");
    assert.equal(maitrise.advanced, true);
});


test("buildAllBestiaryActorsData — agrège Créatures et PNJ sans doublon de seedKey", () => {

    const actors = buildAllBestiaryActorsData({
        creatures: CREATURES,
        npcs: BESTIARY_NPCS
    });

    assert.equal(actors.length, CREATURES.length + BESTIARY_NPCS.length);

    const seedKeys = actors.map((actor) => actor.flags["metro-2033-yze"].seedKey);
    assert.equal(new Set(seedKeys).size, seedKeys.length);
});


test("buildCreatureActorData — les traits du livre deviennent des Talents (Sentinelle : Vicieuse)", () => {

    const entry = CREATURES.find((creature) => creature.key === "creature-sentinelle");
    const data = buildCreatureActorData(entry);

    const vicieuse = data.items.find((item) => item.type === "talent" && item.name === "Vicieuse");
    assert.ok(vicieuse, "Vicieuse absente");
    assert.equal(vicieuse.system.key, "creature-trait-vicieuse");
    assert.match(vicieuse.system.effect, /attaque de morsure/);
    assert.equal(data.system.special, "");
});
