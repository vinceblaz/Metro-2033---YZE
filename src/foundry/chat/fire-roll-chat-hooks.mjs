import {
    FireRollChat
} from "./fire-roll-chat.mjs";


/**
 * Enregistre les clics sur les cartes de Feu : « Subir le feu »
 * (carte en attente) et « Tenter d'éteindre (RÉACTION) ».
 */
export function registerFireRollChatHooks() {

    Hooks.on(
        "renderChatMessageHTML",
        (
            message,
            html
        ) => {

            const rollButton =
                html.querySelector(
                    '[data-action="roll-fire"]'
                );

            if (rollButton) {

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

                            await FireRollChat.resolve(
                                message
                            );

                        }
                        catch (error) {

                            console.error(
                                "Metro 2033 | Impossible de résoudre le jet de Feu",
                                error
                            );

                            ui.notifications.error(
                                error.message
                                ?? "Impossible de résoudre le jet de Feu."
                            );

                            rollButton.disabled =
                                false;

                        }

                    }
                );

            }

            const extinguishButton =
                html.querySelector(
                    '[data-action="extinguish-fire"]'
                );

            if (extinguishButton) {

                extinguishButton.addEventListener(
                    "click",
                    async event => {

                        event.preventDefault();

                        if (extinguishButton.disabled) {
                            return;
                        }

                        extinguishButton.disabled =
                            true;

                        try {

                            await FireRollChat.attemptExtinguish(
                                message
                            );

                        }
                        catch (error) {

                            console.error(
                                "Metro 2033 | Impossible de tenter d'éteindre le feu",
                                error
                            );

                            ui.notifications.error(
                                error.message
                                ?? "Impossible de tenter d'éteindre le feu."
                            );

                        }
                        finally {

                            // Chaque tentative est une action lente :
                            // le bouton reste utilisable.
                            extinguishButton.disabled =
                                false;

                        }

                    }
                );

            }

        }
    );

}
