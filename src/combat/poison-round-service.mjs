/**
 * Résolution par round des Poisons à effets complets (livre,
 * p.204-205).
 *
 * Appelé par `combat/combat-round-coordinator.mjs` (via le
 * registre `recurring-status-effect-registry.mjs`, enregistré
 * dans `foundry/poison/metro-poison-hooks.mjs`) à chaque round de
 * combat, pour tout Actor portant l'état « Empoisonné »
 * (`POISON_STATUS_EFFECT`).
 *
 * Une instance de Poison = un Item embarqué de type "poison"
 * (cf. `data/items/poison-model.mjs`) : plusieurs instances
 * peuvent coexister (sources indépendantes cumulables). Chacune
 * inflige séparément 1 point de dégâts par round à l'attribut de
 * son type, tant que celui-ci n'est pas déjà Brisé (0).
 *
 * Dépend de l'API Foundry (`actor.items`, `ChatMessage.create`) :
 * non testé unitairement, par convention du projet (cf.
 * `foundry/chat/asphyxiation-roll-chat.mjs`, `rollAndPost`).
 */

import {
    getPoisonEffectType,
    resolvePoisonRoundDamage
} from "../domain/rules/poison.mjs";


/**
 * Applique le dégât par round de chaque instance de Poison
 * embarquée sur l'Actor donné, puis publie un unique message de
 * Chat récapitulatif (une ligne par instance).
 *
 * Ne touche jamais à l'état « Empoisonné » lui-même (posé/retiré
 * uniquement à la création/suppression des Items Poison, cf.
 * `metro-poison-hooks.mjs`) ni à la suppression des Items — le
 * retrait d'une instance reste entièrement manuel, à la charge
 * du MJ (décision actée, 02/10/2026).
 */
export async function resolvePoisonRoundForActor(
    actor
) {

    const poisonItems =
        actor.items.filter(
            item => item.type === "poison"
        );


    if (poisonItems.length === 0) {
        return;
    }


    const lines = [];


    for (const item of poisonItems) {

        const effectTypeKey =
            item.system?.effectType
            ?? "lethal";


        const effectType =
            getPoisonEffectType(
                effectTypeKey
            );


        const currentAttributeValue =
            actor.getAttribute(
                effectType.attribute
            )
            ?? 0;


        const {
            attribute,
            amount,
            alreadyBroken
        } =
            resolvePoisonRoundDamage({
                effectTypeKey,
                currentAttributeValue
            });


        if (amount > 0) {

            await actor.takeAttributeDamage(
                attribute,
                amount
            );

        }


        const itemLabel =
            item.system?.sourceLabel
                ? `${effectType.label} (${item.system.sourceLabel})`
                : effectType.label;


        lines.push(
            alreadyBroken
                ? `${itemLabel} — attribut déjà Brisé, aucun dégât `
                    + "supplémentaire."
                : `${itemLabel} — 1 point de dégâts à `
                    + `${effectType.attribute.toUpperCase()}.`
        );

    }


    await ChatMessage.create({

        speaker:
            ChatMessage.getSpeaker({
                actor
            }),

        content:
            `<div class="metro-chat-survival-card metro-chat-poison-round-card">`
            + `<header class="metro-chat-survival-card-header">`
            + `<strong>Poison — dégâts du round</strong>`
            + `</header>`
            + `<ul class="metro-chat-survival-card-summary">`
            + lines
                .map(
                    line => `<li>${foundry.utils.escapeHTML(line)}</li>`
                )
                .join("")
            + `</ul>`
            + `</div>`

    });

}
