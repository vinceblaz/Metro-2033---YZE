import {
    TerrorRollChat
} from "./terror-roll-chat.mjs";


/**
 * Enregistre le clic sur le bouton « Subir le jet » des cartes
 * de Chat d'attaque de Terreur (une carte par Acteur ciblé, cf.
 * terror-roll-chat.mjs).
 */
export function registerTerrorRollChatHooks() {

    Hooks.on(
        "renderChatMessageHTML",
        (
            message,
            html
        ) => {

            const rollButton =
                html.querySelector(
                    '[data-action="roll-terror"]'
                );


            if (!rollButton) {
                return;
            }


            rollButton.addEventListener(
                "click",
                async event => {

                    event.preventDefault();


                    if (rollButton.disabled) {
                        return;
                    }


                    rollButton.disabled =
                        true;


                    try {

                        await TerrorRollChat.resolve(
                            message
                        );

                    }
                    catch (error) {

                        console.error(
                            "Metro 2033 | Impossible de résoudre le jet de Terreur",
                            error
                        );


                        ui.notifications.error(
                            error.message
                            ?? "Impossible de résoudre le jet de Terreur."
                        );


                        rollButton.disabled =
                            false;

                    }

                }
            );

        }
    );

}
