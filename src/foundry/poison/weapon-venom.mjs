import {
    PoisonRollChat
} from "../chat/poison-roll-chat.mjs";

import {
    resolveWeaponVenomTrigger
} from "../../domain/rules/weapon-venom.mjs";


/**
 * Déclenche le venin d'une arme naturelle (Créature) sur la cible
 * si l'attaque a réellement infligé au moins 1 point de dégâts à
 * sa Vigueur : publie la carte « en attente » du jet en
 * opposition d'ENDURANCE contre la Toxicité (poison ingéré :
 * effets complets ou réduits). Le venin n'est jamais épuisé.
 *
 * Tolérant aux erreurs : cette fonction annexe ne doit jamais
 * faire échouer l'application des dégâts.
 */
export async function triggerWeaponVenom(weapon, target, vigorDamageDealt) {

    try {

        const trigger =
            resolveWeaponVenomTrigger(
                weapon?.system?.venom,
                vigorDamageDealt,
                weapon?.name
            );

        if (!trigger || !target) {
            return;
        }

        await PoisonRollChat.createPendingMessage({
            actor: target,
            effectTypeKey: trigger.effectTypeKey,
            toxicity: trigger.toxicity,
            sourceLabel: trigger.sourceLabel,
            bladePoison: false
        });

    }
    catch (error) {

        console.error(
            "Métro 2033 | Échec du déclenchement du venin.",
            { weapon, target, error }
        );

    }

}
