/**
 * Point d'entrée Foundry du jet de Maladie (p.204).
 *
 * Réservée au MJ, sur le même modèle que les jets de Terreur/
 * Asphyxie/Poison (metro-terror-roll-hooks.mjs,
 * metro-asphyxiation-hooks.mjs, metro-poison-hooks.mjs) : le MJ
 * déclare les Personnages/PNJ exposés, chacun subit ensuite son
 * propre jet depuis le message de Chat qui lui est dédié
 * (illness-roll-chat.mjs).
 *
 * À la différence du Poison, aucune automatisation par round de
 * combat n'est enregistrée ici (pas d'entrée dans
 * `recurringStatusEffectRegistry`) : le cycle de la Maladie est
 * quotidien, pas round par round, et reste entièrement manuel/
 * narratif au-delà du jet d'exposition initial (cf. périmètre
 * détaillé dans `domain/rules/illness.mjs`). L'état « Malade »
 * posé en cas d'échec (icône sur le Token) est donc, comme pour
 * l'Asphyxie, retiré manuellement par le MJ — ici quand le malade
 * finit par réussir son jet de Maladie quotidien (guérison), geste
 * que ce module ne gère pas.
 */

import {
    IllnessLauncherDialog
} from "./illness-launcher-dialog.mjs";

import {
    IllnessRollChat
} from "../chat/illness-roll-chat.mjs";

import {
    buildLivingActorOptions
} from "../shared/living-actor-options.mjs";


/**
 * Ouvre la fenêtre de lancement, puis crée un message de Chat
 * par Acteur sélectionné.
 */
export async function openIllnessRollDialog() {

    const actorOptions =
        buildLivingActorOptions();


    const selection =
        await IllnessLauncherDialog.prompt({
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

        await IllnessRollChat.createPendingMessage({

            actor,

            virulence:
                selection.virulence,

            sourceLabel:
                selection.sourceLabel

        });

    }


    ui.notifications?.info(
        `Jet de Maladie (Virulence ${selection.virulence}) envoyé à `
        + `${actors.length} personnage(s).`
    );


    return { selection, actors };

}


const ILLNESS_MACRO_NAME =
    "Métro 2033 — Jet de Maladie";

const ILLNESS_MACRO_COMMAND =
    "game.metro2033.openIllnessRollDialog();";


/**
 * Crée (une seule fois) une Macro appelant la fenêtre de
 * lancement et l'accroche au premier emplacement libre de la
 * barre de raccourcis du MJ. Réservée au MJ, best-effort — cf.
 * ensureTerrorRollMacro/ensureAsphyxiationRollMacro/
 * ensurePoisonRollMacro.
 */
async function ensureIllnessRollMacro() {

    if (!game.user?.isGM) {
        return;
    }


    try {

        let macro =
            game.macros?.find(
                candidate =>
                    candidate.name === ILLNESS_MACRO_NAME
                    && candidate.command === ILLNESS_MACRO_COMMAND
            );


        if (!macro) {

            macro = await Macro.create({
                name: ILLNESS_MACRO_NAME,
                type: "script",
                img: "icons/svg/biohazard.svg",
                command: ILLNESS_MACRO_COMMAND,
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
                `Métro 2033 | Macro « ${ILLNESS_MACRO_NAME} » ajoutée `
                + `à l'emplacement ${firstEmptySlot} de votre barre de raccourcis.`
            );

        }

    }
    catch (error) {

        console.warn(
            "Métro 2033 | Impossible de créer/assigner automatiquement la "
            + "macro de jet de Maladie (permissions insuffisantes ?).",
            error
        );

    }

}


export function registerIllnessHooks() {

    game.metro2033 = game.metro2033 ?? {};
    game.metro2033.openIllnessRollDialog = openIllnessRollDialog;

    // Volontairement non attendu (best-effort, cf.
    // ensureTerrorRollMacro).
    ensureIllnessRollMacro();

}
