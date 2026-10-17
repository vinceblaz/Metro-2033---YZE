/**
 * Point d'entrée Foundry du jet d'Asphyxie (p.205).
 *
 * Réservée au MJ, sur le même modèle que le jet de Terreur
 * (metro-terror-roll-hooks.mjs) : le MJ déclare les Personnages/
 * PNJ exposés, chacun subit ensuite son propre jet depuis le
 * message de Chat qui lui est dédié
 * (asphyxiation-roll-chat.mjs).
 */

import {
    AsphyxiationLauncherDialog
} from "./asphyxiation-launcher-dialog.mjs";

import {
    AsphyxiationRollChat,
    ASPHYXIATION_SOURCE_LEVEL_ACTOR_FLAG
} from "../chat/asphyxiation-roll-chat.mjs";

import {
    buildLivingActorOptions
} from "../shared/living-actor-options.mjs";

import {
    ASPHYXIATION_STATUS_EFFECT
} from "../../domain/rules/asphyxiation.mjs";

import {
    recurringStatusEffectRegistry
} from "../../combat/recurring-status-effect-registry.mjs";


/**
 * Ouvre la fenêtre de lancement, puis crée un message de Chat
 * par Acteur sélectionné.
 */
export async function openAsphyxiationRollDialog() {

    const actorOptions =
        buildLivingActorOptions();


    const selection =
        await AsphyxiationLauncherDialog.prompt({
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

        await AsphyxiationRollChat.createPendingMessage({
            actor,
            sourceLabel: selection.sourceLabel,
            sourceLevel: selection.sourceLevel
        });

    }


    ui.notifications?.info(
        `Jet d'Asphyxie envoyé à ${actors.length} personnage(s).`
    );


    return { selection, actors };

}


const ASPHYXIATION_MACRO_NAME =
    "Métro 2033 — Jet d'Asphyxie";

const ASPHYXIATION_MACRO_COMMAND =
    "game.metro2033.openAsphyxiationRollDialog();";


/**
 * Crée (une seule fois) une Macro appelant la fenêtre de
 * lancement et l'accroche au premier emplacement libre de la
 * barre de raccourcis du MJ. Réservée au MJ, best-effort — cf.
 * ensureTerrorRollMacro.
 */
async function ensureAsphyxiationRollMacro() {

    if (!game.user?.isGM) {
        return;
    }


    try {

        let macro =
            game.macros?.find(
                candidate =>
                    candidate.name === ASPHYXIATION_MACRO_NAME
                    && candidate.command === ASPHYXIATION_MACRO_COMMAND
            );


        if (!macro) {

            macro = await Macro.create({
                name: ASPHYXIATION_MACRO_NAME,
                type: "script",
                img: "icons/svg/poison.svg",
                command: ASPHYXIATION_MACRO_COMMAND,
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
                `Métro 2033 | Macro « ${ASPHYXIATION_MACRO_NAME} » ajoutée `
                + `à l'emplacement ${firstEmptySlot} de votre barre de raccourcis.`
            );

        }

    }
    catch (error) {

        console.warn(
            "Métro 2033 | Impossible de créer/assigner automatiquement la "
            + "macro de jet d'Asphyxie (permissions insuffisantes ?).",
            error
        );

    }

}


/**
 * Tant que l'état « Asphyxié » reste actif sur un Actor ET que
 * la Nocivité persistée pour cet Actor (flag posé au moment où
 * l'état a été appliqué, cf. asphyxiation-roll-chat.mjs) vaut
 * Extrême, un nouveau jet lui est automatiquement imposé à
 * chaque round de combat (Bible §28.2/§32 : seule la Nocivité
 * Extrême a une fréquence « tous les rounds » ; Légère et Forte
 * restent manuelles/narratives même en combat, le MJ garde la
 * main via `openAsphyxiationRollDialog()`).
 *
 * Hors combat, ce gérant n'est jamais appelé
 * (combat-round-coordinator.mjs ne parcourt que les Combatants
 * d'un Combat actif).
 */
function registerAsphyxiationRecurringDamage() {

    recurringStatusEffectRegistry.register(
        ASPHYXIATION_STATUS_EFFECT.id,
        async (
            actor,
            { combat } = {}
        ) => {

            const sourceLevel =
                actor.getFlag(
                    "metro-2033-yze",
                    ASPHYXIATION_SOURCE_LEVEL_ACTOR_FLAG
                );


            if (sourceLevel !== "extreme") {

                /*
                 * Légère/Forte : pas d'automatisation par round
                 * (Bible §32), le MJ relance manuellement au
                 * rythme voulu.
                 */
                return;

            }


            await AsphyxiationRollChat.rollAndPost({

                actor,

                sourceLabel:
                    combat?.round
                        ? `Round ${combat.round} — jet automatique`
                        : null

            });

        }
    );

}


export function registerAsphyxiationHooks() {

    game.metro2033 = game.metro2033 ?? {};
    game.metro2033.openAsphyxiationRollDialog = openAsphyxiationRollDialog;

    registerAsphyxiationRecurringDamage();

    // Volontairement non attendu (best-effort, cf.
    // ensureTerrorRollMacro).
    ensureAsphyxiationRollMacro();

}
