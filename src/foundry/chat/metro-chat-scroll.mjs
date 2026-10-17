/**
 * Gestion générique du positionnement du Chat Métro 2033.
 *
 * Convention UI :
 *
 * - lorsqu'un ChatLog est rendu ou réactivé,
 *   il doit être positionné sur la fin
 *   du dernier message disponible ;
 * - aucune carte Chat particulière
 *   ne doit implémenter ce comportement.
 */


/**
 * Positionne un ChatLog sur son dernier message.
 */
async function scrollChatToBottom(
    chatLog
) {

    if (
        !chatLog
        || typeof chatLog.scrollBottom
            !== "function"
    ) {

        return;

    }


    try {

        await chatLog.scrollBottom({
            waitImages: true
        });

    }
    catch (error) {

        console.warn(
            "Metro 2033 | Impossible de positionner le Chat sur le dernier message.",
            error
        );

    }

}


/**
 * Enregistre les hooks UI communs au Chat.
 */
export function registerMetroChatScrollHooks() {

    /*
     * Lors du rendu initial du Chat,
     * on se place sur le dernier message.
     */
    Hooks.on(
        "renderChatLog",
        async (
            chatLog
        ) => {

            await scrollChatToBottom(
                chatLog
            );

        }
    );


    /*
     * Lorsqu'un nouvel onglet Chat est activé,
     * Foundry peut avoir conservé une ancienne
     * position de scroll.
     *
     * On recentre alors sur la fin.
     */
    Hooks.on(
        "changeSidebarTab",
        async (
            sidebar,
            tabName
        ) => {

            if (
                tabName !== "chat"
            ) {

                return;

            }


            const chatLog =
                ui.chat
                ?? null;


            await scrollChatToBottom(
                chatLog
            );

        }
    );

}