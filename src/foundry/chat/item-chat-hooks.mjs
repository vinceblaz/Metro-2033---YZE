export function registerItemChatHooks() {

    Hooks.on(
        "renderChatMessageHTML",
        (
            message,
            html
        ) => {

            const itemLinks =
                html.querySelectorAll(
                    ".metro-chat-item-card-link[data-uuid]"
                );


            for (
                const itemLink
                of itemLinks
            ) {

                itemLink.addEventListener(
                    "click",
                    async event => {

                        event.preventDefault();


                        const uuid =
                            event.currentTarget
                                .dataset.uuid;


                        if (!uuid) {
                            return;
                        }


                        try {

                            const item =
                                await fromUuid(
                                    uuid
                                );


                            if (!item) {

                                ui.notifications.warn(
                                    "Cet élément est introuvable."
                                );

                                return;

                            }


                            item.sheet?.render(
                                true
                            );

                        }
                        catch (error) {

                            console.error(
                                "Metro 2033 | Impossible d'ouvrir l'Item depuis le Chat",
                                error
                            );


                            ui.notifications.error(
                                "Impossible d'ouvrir cet élément."
                            );

                        }

                    }
                );

            }

        }
    );

}