import { test } from "node:test";
import assert from "node:assert/strict";

import {
    collectWeaponActionSources,
    collectEquipmentActionSources,
    collectActionSources
} from "../../src/action-resolution/action-modifier-sources.mjs";


/**
 * Ce fichier verrouille le comportement actuel de
 * action-modifier-sources.mjs (aucun test n'existait
 * avant ce chantier).
 *
 * Les Item et Actor sont simulés par de simples objets
 * JavaScript : aucune dépendance à Foundry n'est requise
 * pour cette couche.
 */


function makeWeapon({

    id = "weapon-1",

    name = "Couteau",

    equipped = true,

    usableEquipmentBonus = 1,

    skillId = null,

    attributeId = null

} = {}) {

    return {

        id,

        uuid: `Actor.a1.Item.${id}`,

        name,

        type: "weapon",

        system: {

            equipped,

            usableEquipmentBonus,

            skillId,

            attributeId

        }

    };

}


function makeEquipment({

    id = "equipment-1",

    name = "Gilet",

    equipped = true,

    bonusCurrent = 1,

    skillId = null,

    attributeId = null

} = {}) {

    return {

        id,

        uuid: `Actor.a1.Item.${id}`,

        name,

        type: "equipment",

        system: {

            equipped,

            bonus: {
                current: bonusCurrent
            },

            skillId,

            attributeId

        }

    };

}


function makeActor(
    items = []
) {

    return {
        items
    };

}


/* ============================================================
 * collectWeaponActionSources
 * ============================================================ */


test(
    "collectWeaponActionSources : une arme équipée avec un bonus utilisable est proposée",
    () => {

        const weapon =
            makeWeapon({
                skillId: "closeCombat"
            });

        const actor =
            makeActor([
                weapon
            ]);

        const context = {
            actionType: "skill-roll",
            skill: "closeCombat"
        };


        const sources =
            collectWeaponActionSources(
                actor,
                context
            );


        assert.equal(
            sources.length,
            1
        );

        assert.equal(
            sources[0].type,
            "weapon"
        );

        assert.equal(
            sources[0].bonus,
            1
        );

        assert.equal(
            sources[0].appliesTo,
            "skill"
        );

    }
);


test(
    "collectWeaponActionSources : une arme non équipée n'est pas proposée et son bonus vaut 0",
    () => {

        const weapon =
            makeWeapon({
                equipped: false,
                skillId: "closeCombat"
            });

        const actor =
            makeActor([
                weapon
            ]);

        const context = {
            actionType: "skill-roll",
            skill: "closeCombat"
        };


        const sources =
            collectWeaponActionSources(
                actor,
                context
            );


        assert.equal(
            sources.length,
            0
        );

    }
);


test(
    "collectWeaponActionSources : une arme sans lien avec le skill/attribute du contexte n'est pas proposée",
    () => {

        const weapon =
            makeWeapon({
                skillId: "closeCombat"
            });

        const actor =
            makeActor([
                weapon
            ]);

        const context = {
            actionType: "skill-roll",
            skill: "stealth"
        };


        const sources =
            collectWeaponActionSources(
                actor,
                context
            );


        assert.equal(
            sources.length,
            0
        );

    }
);


test(
    "collectWeaponActionSources : une arme non équipée MAIS imposée par une attaque reste visible, verrouillée et sélectionnée, même à bonus 0",
    () => {

        const weapon =
            makeWeapon({
                id: "weapon-42",
                equipped: false,
                usableEquipmentBonus: 0,
                skillId: "closeCombat"
            });

        const actor =
            makeActor([
                weapon
            ]);

        const context = {
            actionType: "melee-attack",
            skill: "closeCombat",
            weapon: {
                id: "weapon-42"
            }
        };


        const sources =
            collectWeaponActionSources(
                actor,
                context
            );


        assert.equal(
            sources.length,
            1
        );

        assert.equal(
            sources[0].bonus,
            0
        );

        assert.equal(
            sources[0].selected,
            true
        );

        assert.equal(
            sources[0].locked,
            true
        );

    }
);


test(
    "collectWeaponActionSources : l'arme imposée par une attaque reste optionnelle pour un blocage",
    () => {

        /*
         * isAttackResolution ne couvre que
         * melee-attack et ranged-attack : pour un
         * melee-block, l'arme désignée par le contexte
         * ne doit pas être imposée si elle n'est pas
         * équipée.
         */

        const weapon =
            makeWeapon({
                id: "weapon-42",
                equipped: false,
                usableEquipmentBonus: 0,
                skillId: "closeCombat"
            });

        const actor =
            makeActor([
                weapon
            ]);

        const context = {
            actionType: "melee-block",
            skill: "closeCombat",
            weapon: {
                id: "weapon-42"
            }
        };


        const sources =
            collectWeaponActionSources(
                actor,
                context
            );


        assert.equal(
            sources.length,
            0
        );

    }
);


test(
    "collectWeaponActionSources : ignore les Item qui ne sont pas de type weapon",
    () => {

        const equipment =
            makeEquipment({
                skillId: "closeCombat"
            });

        const actor =
            makeActor([
                equipment
            ]);

        const context = {
            actionType: "skill-roll",
            skill: "closeCombat"
        };


        const sources =
            collectWeaponActionSources(
                actor,
                context
            );


        assert.equal(
            sources.length,
            0
        );

    }
);


/* ============================================================
 * collectEquipmentActionSources
 * ============================================================ */


test(
    "collectEquipmentActionSources : le flag equipped ne conditionne pas la proposition",
    () => {

        const equipment =
            makeEquipment({
                equipped: false,
                bonusCurrent: 2,
                attributeId: "vigor"
            });

        const actor =
            makeActor([
                equipment
            ]);

        const context = {
            actionType: "attribute-roll",
            attribute: "vigor"
        };


        const sources =
            collectEquipmentActionSources(
                actor,
                context
            );


        assert.equal(
            sources.length,
            1
        );

        assert.equal(
            sources[0].bonus,
            2
        );

        assert.equal(
            sources[0].appliesTo,
            "attribute"
        );

    }
);


test(
    "collectEquipmentActionSources : le bonus est tiré de system.bonus.current",
    () => {

        const equipment =
            makeEquipment({
                bonusCurrent: 3,
                attributeId: "vigor"
            });

        const actor =
            makeActor([
                equipment
            ]);

        const context = {
            actionType: "attribute-roll",
            attribute: "vigor"
        };


        const sources =
            collectEquipmentActionSources(
                actor,
                context
            );


        assert.equal(
            sources[0].bonus,
            3
        );

    }
);


test(
    "collectEquipmentActionSources : un équipement sans bonus utilisable (0) n'est pas proposé",
    () => {

        const equipment =
            makeEquipment({
                bonusCurrent: 0,
                attributeId: "vigor"
            });

        const actor =
            makeActor([
                equipment
            ]);

        const context = {
            actionType: "attribute-roll",
            attribute: "vigor"
        };


        const sources =
            collectEquipmentActionSources(
                actor,
                context
            );


        assert.equal(
            sources.length,
            0
        );

    }
);


test(
    "collectEquipmentActionSources : ignore les Item qui ne sont pas de type equipment",
    () => {

        const weapon =
            makeWeapon({
                attributeId: "vigor"
            });

        const actor =
            makeActor([
                weapon
            ]);

        const context = {
            actionType: "attribute-roll",
            attribute: "vigor"
        };


        const sources =
            collectEquipmentActionSources(
                actor,
                context
            );


        assert.equal(
            sources.length,
            0
        );

    }
);


/* ============================================================
 * collectActionSources
 * ============================================================ */


test(
    "collectActionSources : concatène les sources armes et équipements",
    () => {

        const weapon =
            makeWeapon({
                id: "weapon-1",
                skillId: "closeCombat"
            });

        const equipment =
            makeEquipment({
                id: "equipment-1",
                skillId: "closeCombat"
            });

        const actor =
            makeActor([
                weapon,
                equipment
            ]);

        const context = {
            actionType: "skill-roll",
            skill: "closeCombat"
        };


        const sources =
            collectActionSources(
                actor,
                context
            );


        assert.equal(
            sources.length,
            2
        );

        assert.ok(
            sources.some(
                source =>
                    source.type === "weapon"
            )
        );

        assert.ok(
            sources.some(
                source =>
                    source.type === "equipment"
            )
        );

    }
);


test(
    "collectActionSources : sans Item éligible, retourne un tableau vide",
    () => {

        const actor =
            makeActor([]);

        const context = {
            actionType: "skill-roll",
            skill: "closeCombat"
        };


        const sources =
            collectActionSources(
                actor,
                context
            );


        assert.deepEqual(
            sources,
            []
        );

    }
);


test(
    "collectActionSources : accepte un actor sans items (items absent)",
    () => {

        const actor = {};

        const context = {
            actionType: "skill-roll",
            skill: "closeCombat"
        };


        const sources =
            collectActionSources(
                actor,
                context
            );


        assert.deepEqual(
            sources,
            []
        );

    }
);


/* ============================================================
 * Priorité compétence / attribut
 * ============================================================ */


test(
    "createItemActionSource (via collect) : priorise la compétence sur l'attribut quand l'Item couvre les deux",
    () => {

        const weapon =
            makeWeapon({
                skillId: "closeCombat",
                attributeId: "vigor"
            });

        const actor =
            makeActor([
                weapon
            ]);

        const context = {
            actionType: "skill-roll",
            skill: "closeCombat",
            attribute: "vigor"
        };


        const sources =
            collectWeaponActionSources(
                actor,
                context
            );


        assert.equal(
            sources[0].appliesTo,
            "skill"
        );

    }
);
