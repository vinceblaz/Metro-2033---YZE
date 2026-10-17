/**
 * Point d'entrée Foundry de l'attaque de Terreur (p.207).
 *
 * Réservée au MJ : c'est lui qui déclare une attaque de Terreur
 * (source + Personnages/PNJ concernés), exactement comme pour la
 * création de PNJ (metro-npc-creation-hooks.mjs). Chaque joueur
 * concerné (ou le MJ pour un PNJ) subit ensuite son propre jet
 * depuis le message de Chat qui lui est dédié
 * (terror-roll-chat.mjs).
 */

import {
    TerrorRollLauncherDialog
} from "./terror-roll-launcher-dialog.mjs";

import {
    TerrorRollChat
} from "../chat/terror-roll-chat.mjs";

import {
    buildLivingActorOptions
} from "../shared/living-actor-options.mjs";


/**
 * Ouvre la fenêtre de lancement, puis crée un message de Chat
 * par Acteur sélectionné.
 */
export async function openTerrorRollDialog() {

    const actorOptions =
        buildLivingActorOptions();


    const selection =
        await TerrorRollLauncherDialog.prompt({
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

        await TerrorRollChat.createPendingMessage({

            actor,

            terrorValue:
                selection.terrorValue,

            sourceLabel:
                selection.sourceLabel

        });

    }


    ui.notifications?.info(
        `Attaque de Terreur (${selection.sourceLabel}, valeur `
        + `${selection.terrorValue}) envoyée à ${actors.length} `
        + `personnage(s).`
    );


    return { selection, actors };

}


const TERROR_ROLL_MACRO_NAME =
    "Métro 2033 — Attaque de Terreur";

const TERROR_ROLL_MACRO_COMMAND =
    "game.metro2033.openTerrorRollDialog();";


/**
 * Crée (une seule fois) une Macro appelant la fenêtre de
 * lancement et l'accroche au premier emplacement libre de la
 * barre de raccourcis du MJ. Réservée au MJ (game.user.isGM) :
 * seul lui déclare une attaque de Terreur — les joueurs
 * n'interagissent qu'avec le bouton de leur propre message de
 * Chat.
 *
 * Best-effort, à l'image de ensureCharacterCreationMacro /
 * ensureNpcCreationMacro : ne doit jamais faire échouer le hook
 * "ready".
 */
async function ensureTerrorRollMacro() {

    if (!game.user?.isGM) {
        return;
    }


    try {

        let macro =
            game.macros?.find(
                candidate =>
                    candidate.name === TERROR_ROLL_MACRO_NAME
                    && candidate.command === TERROR_ROLL_MACRO_COMMAND
            );


        if (!macro) {

            macro = await Macro.create({
                name: TERROR_ROLL_MACRO_NAME,
                type: "script",
                img: "icons/svg/terror.svg",
                command: TERROR_ROLL_MACRO_COMMAND,
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
                `Métro 2033 | Macro « ${TERROR_ROLL_MACRO_NAME} » ajoutée `
                + `à l'emplacement ${firstEmptySlot} de votre barre de raccourcis.`
            );

        }

    }
    catch (error) {

        console.warn(
            "Métro 2033 | Impossible de créer/assigner automatiquement la "
            + "macro d'attaque de Terreur (permissions insuffisantes ?).",
            error
        );

    }

}


export function registerTerrorRollHooks() {

    game.metro2033 = game.metro2033 ?? {};
    game.metro2033.openTerrorRollDialog = openTerrorRollDialog;

    // Volontairement non attendu (best-effort, cf.
    // ensureCharacterCreationMacro).
    ensureTerrorRollMacro();

}
