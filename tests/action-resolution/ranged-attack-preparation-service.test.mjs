import { test } from "node:test";
import assert from "node:assert/strict";

import {
    RangedAttackPreparationService
} from "../../src/action-resolution/ranged-attack-preparation-service.mjs";


function createActorStub(
    {
        items = []
    } = {}
) {

    return {

        id:
            "actor-1",

        type:
            "character",

        system: {

            attributes: {

                agility: {
                    value: 3
                }

            },

            skills: {

                shooting:
                    2

            },

            stress: {
                dice: 0
            }

        },

        items,

        getSkillAttribute(
            skillId
        ) {

            return (
                skillId === "shooting"
                    ? "agility"
                    : null
            );

        }

    };

}


function createWeaponStub(
    actor,
    overrides = {}
) {

    return {

        id:
            "weapon-1",

        uuid:
            "Actor.actor-1.Item.weapon-1",

        name:
            "Fusil d'assaut",

        type:
            "weapon",

        actor,

        system: {

            category:
                "ranged",

            weaponCategory:
                "assaultRifle",

            automatic:
                true,

            usesAmmunition:
                true,

            heavy:
                false,

            ...overrides

        }

    };

}


test(
    "RangedAttackPreparationService.create : construit une préparation pour un tir simple",
    () => {

        const actor =
            createActorStub();

        const weapon =
            createWeaponStub(
                actor
            );


        const {
            preparation,
            burstFire
        } =
            RangedAttackPreparationService.create(
                actor,
                weapon
            );


        assert.equal(
            burstFire,
            false
        );

        assert.ok(
            preparation
        );

    }
);


test(
    "RangedAttackPreparationService.create : refuse une arme qui n'appartient pas à l'Actor",
    () => {

        const actor =
            createActorStub();

        const otherActor =
            createActorStub();

        otherActor.id =
            "actor-2";

        const weapon =
            createWeaponStub(
                otherActor
            );


        assert.throws(
            () =>
                RangedAttackPreparationService.create(
                    actor,
                    weapon
                ),
            /n'appartient pas/
        );

    }
);


test(
    "RangedAttackPreparationService.create : refuse une arme qui n'est pas à distance",
    () => {

        const actor =
            createActorStub();

        const weapon =
            createWeaponStub(
                actor,
                {
                    category:
                        "melee"
                }
            );


        assert.throws(
            () =>
                RangedAttackPreparationService.create(
                    actor,
                    weapon
                ),
            /arme à distance/
        );

    }
);


test(
    "RangedAttackPreparationService.create : une rafale suggère +3 dans le bonus manuel de la préparation",
    () => {

        const actor =
            createActorStub();

        const weapon =
            createWeaponStub(
                actor
            );


        const {
            preparation,
            burstFire
        } =
            RangedAttackPreparationService.create(
                actor,
                weapon,
                {
                    burstFire:
                        true
                }
            );


        assert.equal(
            burstFire,
            true
        );


        const manualBonusModifier =
            preparation.modifiers
                .find(
                    modifier =>
                        modifier.id
                        === "manual-bonus"
                );


        assert.ok(
            manualBonusModifier,
            "Le modificateur de bonus manuel doit être présent dans la préparation."
        );

        assert.equal(
            manualBonusModifier.value,
            3
        );

        assert.equal(
            manualBonusModifier.suggestedValue,
            3
        );

        assert.equal(
            manualBonusModifier.editable,
            true
        );

    }
);


test(
    "RangedAttackPreparationService.create : un bonus manuel explicite reste prioritaire même en rafale",
    () => {

        const actor =
            createActorStub();

        const weapon =
            createWeaponStub(
                actor
            );


        const {
            preparation
        } =
            RangedAttackPreparationService.create(
                actor,
                weapon,
                {
                    burstFire:
                        true,

                    manualBonus:
                        1
                }
            );


        const manualBonusModifier =
            preparation.modifiers
                .find(
                    modifier =>
                        modifier.id
                        === "manual-bonus"
                );


        assert.equal(
            manualBonusModifier.value,
            1
        );

    }
);


test(
    "RangedAttackPreparationService.create : un tir simple ne suggère aucun bonus manuel",
    () => {

        const actor =
            createActorStub();

        const weapon =
            createWeaponStub(
                actor
            );


        const {
            preparation
        } =
            RangedAttackPreparationService.create(
                actor,
                weapon
            );


        const manualBonusModifier =
            preparation.modifiers
                .find(
                    modifier =>
                        modifier.id
                        === "manual-bonus"
                );


        assert.equal(
            manualBonusModifier.value,
            0
        );

    }
);
