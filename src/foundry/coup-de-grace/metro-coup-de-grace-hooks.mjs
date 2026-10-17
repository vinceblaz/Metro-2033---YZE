/**
 * Point d'entrée Foundry du COUP DE GRÂCE (p.200).
 *
 * Réservé au MJ, exactement comme l'attaque de Terreur : le MJ
 * choisit les PJ concernés et le texte, puis chaque joueur
 * résout son propre coup de grâce depuis le bouton de sa carte
 * de Chat (coup-de-grace-chat.mjs).
 */

import {
    CoupDeGraceLauncherDialog
} from "./coup-de-grace-launcher-dialog.mjs";

import {
    CoupDeGraceChat
} from "../chat/coup-de-grace-chat.mjs";

import {
    buildLivingActorOptions
} from "../shared/living-actor-options.mjs";

import {
    TALENT_IDENTITIES
} from "../../domain/rules/talent-identity.mjs";


/**
 * Ouvre la fenêtre de lancement, puis crée un message de Chat
 * par PJ sélectionné. Réservé au MJ.
 */
export async function openCoupDeGraceDialog() {

    if (!game.user?.isGM) {

        ui.notifications?.warn(
            "Seul le MJ peut lancer un coup de grâce."
        );

        return null;

    }


    const actorOptions =
        buildLivingActorOptions({
            types: ["character"]
        })
            .map(
                option => ({

                    ...option,

                    ruthless:
                        game.actors
                            .get(option.id)
                            ?.hasTalent?.(
                                TALENT_IDENTITIES.RUTHLESS
                            )
                        === true

                })
            );


    const selection =
        await CoupDeGraceLauncherDialog.prompt({
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

        await CoupDeGraceChat.createPendingMessage({

            actor,

            text:
                selection.message

        });

    }


    ui.notifications?.info(
        `Coup de grâce proposé à ${actors.length} personnage(s).`
    );


    return { selection, actors };

}


const COUP_DE_GRACE_MACRO_NAME =
    "Métro 2033 — Coup de grâce";

const COUP_DE_GRACE_MACRO_COMMAND =
    "game.metro2033.openCoupDeGraceDialog();";


/**
 * Crée (une seule fois) la Macro et l'accroche au premier
 * emplacement libre de la barre de raccourcis du MJ. Même
 * mécanisme que ensureTerrorRollMacro. Best-effort.
 */
async function ensureCoupDeGraceMacro() {

    if (!game.user?.isGM) {
        return;
    }


    try {

        let macro =
            game.macros?.find(
                candidate =>
                    candidate.name === COUP_DE_GRACE_MACRO_NAME
                    && candidate.command === COUP_DE_GRACE_MACRO_COMMAND
            );


        if (!macro) {

            macro = await Macro.create({
                name: COUP_DE_GRACE_MACRO_NAME,
                type: "script",
                img: "icons/svg/skull.svg",
                command: COUP_DE_GRACE_MACRO_COMMAND,
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
                `Métro 2033 | Macro « ${COUP_DE_GRACE_MACRO_NAME} » ajoutée `
                + `à l'emplacement ${firstEmptySlot} de votre barre de raccourcis.`
            );

        }

    }
    catch (error) {

        console.warn(
            "Métro 2033 | Impossible de créer/assigner automatiquement la "
            + "macro de coup de grâce (permissions insuffisantes ?).",
            error
        );

    }

}


export function registerCoupDeGraceHooks() {

    game.metro2033 = game.metro2033 ?? {};
    game.metro2033.openCoupDeGraceDialog = openCoupDeGraceDialog;

    // Volontairement non attendu (best-effort).
    ensureCoupDeGraceMacro();

}
