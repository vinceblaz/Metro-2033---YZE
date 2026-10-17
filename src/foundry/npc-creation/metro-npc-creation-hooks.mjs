import {
    NpcCreationWizardApplication
} from "../applications/npc-creation-wizard-application.mjs";


/**
 * Ouvre l'Assistant de création de PNJ.
 *
 * Réservé au MJ (la création de PNJ n'a de sens que pour lui) :
 * appelé côté MJ uniquement, comme pour la Macro créée par
 * `ensureNpcCreationMacro()` ci-dessous.
 */
export function openNpcCreationWizard() {

    const application = new NpcCreationWizardApplication();

    application.render({ force: true });

    return application;
}


const NPC_CREATION_MACRO_NAME = "Métro 2033 — Créer un PNJ";
const NPC_CREATION_MACRO_COMMAND = "game.metro2033.openNpcCreationWizard();";


/**
 * Même mécanisme robuste que pour l'Assistant PJ
 * (metro-character-creation-hooks.mjs#ensureCharacterCreationMacro) :
 * une Macro plutôt qu'un bouton injecté dans une structure DOM
 * non vérifiable depuis cet environnement de développement.
 *
 * Réservée au MJ (game.user.isGM) : la création de PNJ n'a de
 * sens que pour lui, et la création de Macro de script est de
 * toute façon par défaut restreinte au MJ/Assistant-MJ côté
 * Foundry (permission `MACRO_SCRIPT`).
 */
async function ensureNpcCreationMacro() {

    if (!game.user?.isGM) {
        return;
    }

    try {

        let macro = game.macros?.find(
            (candidate) =>
                candidate.name === NPC_CREATION_MACRO_NAME
                && candidate.command === NPC_CREATION_MACRO_COMMAND
        );

        if (!macro) {

            macro = await Macro.create({
                name: NPC_CREATION_MACRO_NAME,
                type: "script",
                img: "icons/svg/mystery-man.svg",
                command: NPC_CREATION_MACRO_COMMAND,
                scope: "global"
            });
        }

        if (!macro) {
            return;
        }

        const hotbar = game.user?.hotbar ?? {};

        const alreadyOnHotbar = Object.values(hotbar).includes(macro.id);

        if (alreadyOnHotbar) {
            return;
        }

        const firstEmptySlot = Array.from({ length: 50 }, (unused, index) => index + 1)
            .find((slot) => !hotbar[slot]);

        if (firstEmptySlot) {
            await game.user.assignHotbarMacro(macro, firstEmptySlot);

            console.log(
                `Métro 2033 | Macro « ${NPC_CREATION_MACRO_NAME} » ajoutée à l'emplacement ${firstEmptySlot} de votre barre de raccourcis.`
            );
        }

    } catch (error) {

        console.warn(
            "Métro 2033 | Impossible de créer/assigner automatiquement la macro de création de PNJ.",
            error
        );
    }
}


/**
 * Enregistre les points d'entrée Foundry de l'Assistant de
 * création de PNJ.
 */
export function registerNpcCreationHooks() {

    game.metro2033 = game.metro2033 ?? {};
    game.metro2033.openNpcCreationWizard = openNpcCreationWizard;

    // Volontairement non attendu (best-effort).
    ensureNpcCreationMacro();
}
