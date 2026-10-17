import {
    AsphyxiationRollChat
} from "./asphyxiation-roll-chat.mjs";


/**
 * Enregistre le clic sur le bouton « Subir le jet » des cartes
 * de Chat de jet d'Asphyxie (une carte par Acteur ciblé, cf.
 * asphyxiation-roll-chat.mjs).
 */
export function registerAsphyxiationRollChatHooks() {

    Hooks.on(
        "renderChatMessageHTML",
        (
            message,
            html
        ) => {

            const rollButton =
                html.querySelector(
                    '[data-action="roll-asphyxiation"]'
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

                        const result =
                            await AsphyxiationRollChat.resolve(
                                message
                            );


                        if (!result) {

                            /*
                             * Fenêtre de préparation annulée par
                             * le joueur (« Subir 1 Stress pour
                             * +3 », etc.) : aucun jet n'a été
                             * effectué, la carte reste en
                             * attente et le bouton redevient
                             * cliquable.
                             */
                            rollButton.disabled =
                                false;

                        }

                    }
                    catch (error) {

                        console.error(
                            "Metro 2033 | Impossible de résoudre le jet d'Asphyxie",
                            error
                        );


                        ui.notifications.error(
                            error.message
                            ?? "Impossible de résoudre le jet d'Asphyxie."
                        );


                        rollButton.disabled =
                            false;

                    }

                }
            );

        }
    );

}
