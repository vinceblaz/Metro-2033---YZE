import {
    PoisonRollChat
} from "./poison-roll-chat.mjs";


/**
 * Enregistre un bouton d'action de la carte de Chat de jet de
 * Poison : désactive le bouton pendant l'opération, appelle
 * `handler(message)`, et réactive le bouton en cas d'erreur (la
 * mise à jour du message, en cas de succès, re-rend de toute façon
 * la carte avec son nouvel état de boutons).
 */
function registerPoisonChatAction({
    action,
    errorMessage,
    handler
}) {

    Hooks.on(
        "renderChatMessageHTML",
        (
            message,
            html
        ) => {

            const button =
                html.querySelector(
                    `[data-action="${action}"]`
                );


            if (!button) {
                return;
            }


            button.addEventListener(
                "click",
                async event => {

                    event.preventDefault();


                    if (button.disabled) {
                        return;
                    }


                    button.disabled =
                        true;


                    try {

                        await handler(
                            message,
                            button
                        );

                    }
                    catch (error) {

                        console.error(
                            `Metro 2033 | ${errorMessage}`,
                            error
                        );


                        ui.notifications.error(
                            error.message
                            ?? errorMessage
                        );


                        button.disabled =
                            false;

                    }

                }
            );

        }
    );

}


/**
 * Enregistre les clics sur les boutons « Subir le jet »,
 * « Pousser » et « Accepter le résultat » des cartes de Chat de
 * jet de Poison (une carte par Acteur ciblé, cf.
 * poison-roll-chat.mjs).
 */
export function registerPoisonRollChatHooks() {

    registerPoisonChatAction({
        action:
            "roll-poison",

        errorMessage:
            "Impossible de résoudre le jet de Poison.",

        handler:
            message => PoisonRollChat.resolve(
                message
            )
    });


    registerPoisonChatAction({
        action:
            "push-poison",

        errorMessage:
            "Impossible de forcer le jet de Poison.",

        handler:
            (message, button) => PoisonRollChat.push(
                message,
                {
                    useStress:
                        button.dataset.useStress
                        === "true"
                }
            )
    });


    registerPoisonChatAction({
        action:
            "accept-poison",

        errorMessage:
            "Impossible d'accepter le jet de Poison.",

        handler:
            message => PoisonRollChat.accept(
                message
            )
    });

}
