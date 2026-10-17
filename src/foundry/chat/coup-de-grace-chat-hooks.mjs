import {
    CoupDeGraceChat
} from "./coup-de-grace-chat.mjs";


/**
 * Câble le bouton « Coup de grâce » des cartes de Chat (une par
 * PJ, cf. coup-de-grace-chat.mjs). Le bouton n'est actif que
 * pour le propriétaire de l'Acteur concerné (MJ compris) ;
 * désactivé pour tous les autres. La mise à jour de la carte
 * (dont le joueur n'est pas l'auteur) passe par un MJ actif :
 * cf. gm-message-relay.mjs.
 */
export function registerCoupDeGraceChatHooks() {

    Hooks.on(
        "renderChatMessageHTML",
        (
            message,
            html
        ) => {

            const button =
                html.querySelector(
                    '[data-action="coup-de-grace"]'
                );


            if (!button) {
                return;
            }


            const flagData =
                CoupDeGraceChat.getFlagData(
                    message
                );

            let actor = null;

            try {

                actor =
                    flagData?.actorUuid
                        ? fromUuidSync(
                            flagData.actorUuid
                        )
                        : null;

            }
            catch (error) {

                actor = null;

            }


            if (!actor?.isOwner) {

                button.disabled =
                    true;

                button.title =
                    actor
                        ? "Seul le propriétaire de ce personnage peut utiliser ce bouton."
                        : "Personnage introuvable.";

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

                        await CoupDeGraceChat.resolve(
                            message
                        );

                    }
                    catch (error) {

                        console.error(
                            "Metro 2033 | Impossible de résoudre le coup de grâce",
                            error
                        );

                        ui.notifications.error(
                            error.message
                            ?? "Impossible de résoudre le coup de grâce."
                        );

                        button.disabled =
                            false;

                    }

                }
            );

        }
    );

}
