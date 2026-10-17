/**
 * Point d'entrée Foundry du Feu (p.203).
 *
 * Réservée au MJ, sur le même modèle que le jet d'Asphyxie : le
 * MJ choisit les Personnages/PNJ exposés et l'Intensité ; chacun
 * subit ensuite son propre jet depuis le message de Chat qui lui
 * est dédié (fire-roll-chat.mjs). En combat, le feu se rejoue
 * automatiquement au début de chaque round tant que l'état
 * « En feu » est actif (registre des effets récurrents).
 */

import {
    FireLauncherDialog
} from "./fire-launcher-dialog.mjs";

import {
    FireRollChat,
    FIRE_INTENSITY_ACTOR_FLAG
} from "../chat/fire-roll-chat.mjs";

import {
    buildLivingActorOptions
} from "../shared/living-actor-options.mjs";

import {
    FIRE_STANDARD_INTENSITY,
    FIRE_STATUS_EFFECT,
    resolveFireRound
} from "../../domain/rules/fire.mjs";

import {
    recurringStatusEffectRegistry
} from "../../combat/recurring-status-effect-registry.mjs";


/**
 * Ouvre la fenêtre de lancement, puis crée un message de Chat
 * par Acteur sélectionné.
 */
export async function openFireRollDialog() {

    const actorOptions =
        buildLivingActorOptions();

    const selection =
        await FireLauncherDialog.prompt({
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

        await FireRollChat.createPendingMessage({
            actor,
            intensity: selection.intensity,
            sourceLabel: selection.sourceLabel
        });

    }

    ui.notifications?.info(
        `Exposition au feu envoyée à ${actors.length} personnage(s).`
    );

    return { selection, actors };

}


const FIRE_MACRO_NAME =
    "Métro 2033 — Feu";

const FIRE_MACRO_COMMAND =
    "game.metro2033.openFireRollDialog();";


/**
 * Crée (une seule fois) une Macro appelant la fenêtre de
 * lancement et l'accroche au premier emplacement libre de la
 * barre de raccourcis du MJ. Best-effort — cf.
 * ensureAsphyxiationRollMacro.
 */
async function ensureFireRollMacro() {

    if (!game.user?.isGM) {
        return;
    }

    try {

        let macro =
            game.macros?.find(
                candidate =>
                    candidate.name === FIRE_MACRO_NAME
                    && candidate.command === FIRE_MACRO_COMMAND
            );

        if (!macro) {

            macro = await Macro.create({
                name: FIRE_MACRO_NAME,
                type: "script",
                img: "icons/svg/fire.svg",
                command: FIRE_MACRO_COMMAND,
                scope: "global"
            });

        }

        if (!macro) {
            return;
        }

        const hotbar =
            game.user?.hotbar ?? {};

        if (Object.values(hotbar).includes(macro.id)) {
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
                `Métro 2033 | Macro « ${FIRE_MACRO_NAME} » ajoutée `
                + `à l'emplacement ${firstEmptySlot} de votre barre de raccourcis.`
            );

        }

    }
    catch (error) {

        console.warn(
            "Métro 2033 | Impossible de créer/assigner automatiquement la "
            + "macro de Feu (permissions insuffisantes ?).",
            error
        );

    }

}


/**
 * Au début de chaque round de combat, tout Actor « En feu »
 * subit une nouvelle « attaque » du feu, d'Intensité +1 par
 * rapport à la précédente. Sans dégâts, le feu s'éteint de
 * lui-même (cf. FireRollChat.rollAndPost).
 *
 * Un état « En feu » posé à la main par le MJ (sans Intensité
 * mémorisée) est traité comme un feu standard (Intensité 8) : la
 * première attaque automatique est donc d'Intensité 9.
 *
 * Hors combat, ce gérant n'est jamais appelé (le MJ rejoue la
 * macro ou retire l'état à la main).
 */
function registerFireRecurringDamage() {

    recurringStatusEffectRegistry.register(
        FIRE_STATUS_EFFECT.id,
        async (
            actor,
            { combat } = {}
        ) => {

            const stored =
                Number(
                    actor.getFlag(
                        "metro-2033-yze",
                        FIRE_INTENSITY_ACTOR_FLAG
                    )
                );

            const current =
                Number.isInteger(stored) && stored >= 1
                    ? stored
                    : FIRE_STANDARD_INTENSITY;

            const { intensity } =
                resolveFireRound({
                    currentIntensity: current
                });

            await FireRollChat.rollAndPost({
                actor,
                intensity,
                sourceLabel:
                    combat?.round
                        ? `Round ${combat.round}`
                        : null
            });

        }
    );

}


export function registerFireHooks() {

    game.metro2033 = game.metro2033 ?? {};
    game.metro2033.openFireRollDialog = openFireRollDialog;

    registerFireRecurringDamage();

    // Volontairement non attendu (best-effort).
    ensureFireRollMacro();

}
