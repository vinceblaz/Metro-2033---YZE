/**
 * Point d'entrée Foundry du jet de Poison (p.204-205).
 *
 * Réservée au MJ, sur le même modèle que le jet de Terreur et le
 * jet d'Asphyxie (metro-terror-roll-hooks.mjs,
 * metro-asphyxiation-hooks.mjs) : le MJ déclare les Personnages/
 * PNJ exposés, chacun subit ensuite son propre jet depuis le
 * message de Chat qui lui est dédié (poison-roll-chat.mjs).
 *
 * Différence avec l'Asphyxie : l'état « Empoisonné » (icône sur
 * le Token) n'est jamais posé/retiré manuellement ici — il est
 * entièrement dérivé de la présence d'au moins un Item Poison
 * embarqué sur l'Actor (plusieurs instances indépendantes
 * pouvant coexister), synchronisé automatiquement à chaque
 * création/suppression d'un tel Item (`createItem`/`deleteItem`).
 * Le MJ n'a donc qu'une seule action à faire pour mettre fin à
 * une intoxication : supprimer l'Item Poison correspondant.
 */

import {
    PoisonLauncherDialog
} from "./poison-launcher-dialog.mjs";

import {
    PoisonRollChat
} from "../chat/poison-roll-chat.mjs";

import {
    buildLivingActorOptions
} from "../shared/living-actor-options.mjs";

import {
    POISON_STATUS_EFFECT
} from "../../domain/rules/poison.mjs";

import {
    recurringStatusEffectRegistry
} from "../../combat/recurring-status-effect-registry.mjs";

import {
    resolvePoisonRoundForActor
} from "../../combat/poison-round-service.mjs";


/**
 * Ouvre la fenêtre de lancement, puis crée un message de Chat
 * par Acteur sélectionné.
 */
export async function openPoisonRollDialog() {

    const actorOptions =
        buildLivingActorOptions();


    const selection =
        await PoisonLauncherDialog.prompt({
            actorOptions
        });


    if (!selection) {
        return null;
    }


    const actors =
        selection.actorIds
            .map(actorId => game.actors.get(actorId))
            .filter(Boolean);


    for (const actor of actors) {

        await PoisonRollChat.createPendingMessage({

            actor,

            effectTypeKey:
                selection.effectTypeKey,

            toxicity:
                selection.toxicity,

            sourceLabel:
                selection.sourceLabel

        });

    }


    ui.notifications?.info(
        `Jet de Poison (${selection.effectTypeLabel}, Toxicité `
        + `${selection.toxicity}) envoyé à ${actors.length} `
        + `personnage(s).`
    );


    return { selection, actors };

}


const POISON_MACRO_NAME =
    "Métro 2033 — Jet de Poison";

const POISON_MACRO_COMMAND =
    "game.metro2033.openPoisonRollDialog();";


/**
 * Crée (une seule fois) une Macro appelant la fenêtre de
 * lancement et l'accroche au premier emplacement libre de la
 * barre de raccourcis du MJ. Réservée au MJ, best-effort — cf.
 * ensureTerrorRollMacro/ensureAsphyxiationRollMacro.
 */
async function ensurePoisonRollMacro() {

    if (!game.user?.isGM) {
        return;
    }


    try {

        let macro =
            game.macros?.find(
                candidate =>
                    candidate.name === POISON_MACRO_NAME
                    && candidate.command === POISON_MACRO_COMMAND
            );


        if (!macro) {

            macro = await Macro.create({
                name: POISON_MACRO_NAME,
                type: "script",
                img: "icons/svg/poison.svg",
                command: POISON_MACRO_COMMAND,
                scope: "global"
            });

        }


        if (!macro) {
            return;
        }


        const hotbar =
            game.user?.hotbar ?? {};

        const alreadyOnHotbar =
            Object.values(hotbar).includes(macro.id);

        if (alreadyOnHotbar) {
            return;
        }


        const firstEmptySlot =
            Array.from(
                { length: 50 },
                (unused, index) => index + 1
            )
                .find(slot => !hotbar[slot]);


        if (firstEmptySlot) {

            await game.user.assignHotbarMacro(
                macro,
                firstEmptySlot
            );


            console.log(
                `Métro 2033 | Macro « ${POISON_MACRO_NAME} » ajoutée `
                + `à l'emplacement ${firstEmptySlot} de votre barre de raccourcis.`
            );

        }

    }
    catch (error) {

        console.warn(
            "Métro 2033 | Impossible de créer/assigner automatiquement la "
            + "macro de jet de Poison (permissions insuffisantes ?).",
            error
        );

    }

}


/**
 * Tant que l'état « Empoisonné » reste actif sur un Actor (donc
 * tant qu'au moins un Item Poison lui est embarqué), un nouveau
 * round de combat déclenche automatiquement
 * `resolvePoisonRoundForActor`, qui applique le dégât de CHAQUE
 * instance de Poison embarquée (cf. combat/poison-round-service.mjs)
 * — pas de distinction de Nocivité ici (à la différence de
 * l'Asphyxie) : un Poison à effets complets inflige toujours ses
 * dégâts « tous les rounds » (le livre ne prévoit pas d'autre
 * cadence pour le Poison).
 */
function registerPoisonRecurringDamage() {

    recurringStatusEffectRegistry.register(
        POISON_STATUS_EFFECT.id,
        async actor => {

            await resolvePoisonRoundForActor(
                actor
            );

        }
    );

}


/**
 * Synchronise l'état « Empoisonné » (icône sur le Token) avec la
 * présence d'au moins un Item Poison embarqué sur l'Actor
 * concerné, à chaque création/suppression d'un tel Item.
 *
 * Best-effort (comme la pose de l'état « Asphyxié ») : un Actor
 * sans Token lié au moment de l'appel ne peut pas porter d'état,
 * ce qui ne doit jamais faire échouer la création/suppression de
 * l'Item lui-même.
 */
function registerPoisonStatusSync() {

    const syncPoisonStatus =
        async actor => {

            if (!actor) {
                return;
            }


            const hasActivePoison =
                actor.items.some(
                    item => item.type === "poison"
                );


            try {

                await actor.toggleStatusEffect(
                    POISON_STATUS_EFFECT.id,
                    { active: hasActivePoison }
                );

            }
            catch (error) {

                /*
                 * Best-effort : pas de Token lié, par exemple.
                 * L'Item Poison reste créé/supprimé normalement,
                 * seule l'icône d'état est manquante.
                 */

            }

        };


    Hooks.on(
        "createItem",
        item => {

            if (
                item.type === "poison"
                && item.parent
            ) {

                syncPoisonStatus(
                    item.parent
                );

            }

        }
    );


    Hooks.on(
        "deleteItem",
        item => {

            if (
                item.type === "poison"
                && item.parent
            ) {

                syncPoisonStatus(
                    item.parent
                );

            }

        }
    );

}


export function registerPoisonHooks() {

    game.metro2033 = game.metro2033 ?? {};
    game.metro2033.openPoisonRollDialog = openPoisonRollDialog;

    registerPoisonRecurringDamage();

    registerPoisonStatusSync();

    // Volontairement non attendu (best-effort, cf.
    // ensureTerrorRollMacro).
    ensurePoisonRollMacro();

}
