import {
    resolveRangedStunts
} from "./ranged-stunts.mjs";

import {
    resolveRangedAttackDamage
} from "./ranged-attack-damage.mjs";


export function resolveRangedAttackConsequences({
    rollResult,
    stuntAllocation = {}
} = {}) {

    if (!rollResult) {
        throw new Error(
            "Un résultat de jet est requis pour résoudre les conséquences d'une attaque à distance."
        );
    }


    const attack =
        rollResult.context?.attack
        ?? {};

    const weapon =
        attack.weapon
        ?? {};

    const ammunition =
        attack.ammunition
        ?? {};


    // ==================================================
    // ACTIONS D'ÉCLAT
    // ==================================================

    const stunts =
        resolveRangedStunts({

            rollResult,

            allocation:
                stuntAllocation,

            explosive:
                weapon.explosive === true

        });


    // ==================================================
    // DÉGÂTS PHYSIQUES AVANT PROTECTION
    // ==================================================

    const damage =
        resolveRangedAttackDamage({

            rollResult,

            baseDamage:
                weapon.damage ?? 0,

            bonusDamage:
                stunts.effects.vigorDamage

        });


    // ==================================================
    // PROTECTION À RÉSOUDRE
    //
    // Aucun jet de Protection n'est effectué ici.
    // Aucune mutation Foundry n'est effectuée ici.
    // ==================================================

    const protection = {

        required:
            damage.hit
            && damage.rawDamage > 0,

        incomingDamage:
            damage.rawDamage,

        protectionReduction:
            ammunition.protectionReduction
            ?? 0,

        ignoresResilience:
            ammunition.ignoresResilience
            === true

    };


    // ==================================================
    // CONSÉQUENCES HORS DÉGÂTS PHYSIQUES
    // ==================================================

    const effects = {

        spiritDamage:
            stunts.effects.spiritDamage,

        swapInitiative:
            stunts.effects.swapInitiative,

        disarm:
            stunts.effects.disarm,

        knockdown:
            stunts.effects.knockdown,

        grenade:
            stunts.effects.grenade

    };


    return {

        hit:
            damage.hit,

        damage,

        stunts,

        protection,

        effects

    };

}