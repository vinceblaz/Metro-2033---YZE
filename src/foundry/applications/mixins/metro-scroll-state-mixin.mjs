/**
 * Mixin générique de conservation du scroll
 * pour les applications Métro 2033.
 *
 * Objectif :
 *
 * - mémoriser les positions de défilement
 *   avant un rerender ;
 * - restaurer ces positions après le rerender ;
 * - fonctionner indépendamment du type
 *   d'ActorSheet ou d'ItemSheet ;
 * - ne dépendre d'aucun bouton particulier.
 *
 * Convention facultative :
 *
 * un conteneur scrollable peut recevoir :
 *
 * data-metro-scroll-key="main"
 *
 * pour lui donner une identité stable.
 *
 * Sans cette clé, une clé automatique
 * est calculée depuis le DOM.
 */


export function MetroScrollStateMixin(
    BaseApplication
) {

    return class MetroScrollState
        extends BaseApplication {

        /**
         * État de scroll capturé avant le rerender.
         */
        _metroScrollState =
            new Map();


        /**
         * Construit une clé stable pour un élément
         * scrollable.
         */
        _getMetroScrollKey(
            element,
            index
        ) {

            const explicitKey =
                element.dataset
                    ?.metroScrollKey
                ?? null;


            if (explicitKey) {

                return (
                    `data:${explicitKey}`
                );

            }


            if (element.id) {

                return (
                    `id:${element.id}`
                );

            }


            const classes =
                Array
                    .from(
                        element.classList
                        ?? []
                    )
                    .sort()
                    .join(".");


            if (classes) {

                return (
                    `class:${classes}:${index}`
                );

            }


            return (
                `scrollable:${index}`
            );

        }


        /**
         * Retourne les éléments réellement
         * scrollables de l'application.
         *
         * On ne dépend volontairement pas
         * d'un sélecteur propre à CharacterSheet.
         */
        _getMetroScrollableElements() {

            const root =
                this.element;


            if (
                !(root instanceof HTMLElement)
            ) {

                return [];

            }


            const candidates = [
                root,
                ...root.querySelectorAll("*")
            ];


            return candidates.filter(
                element => {

                    if (
                        !(element instanceof HTMLElement)
                    ) {

                        return false;

                    }


                    /*
                     * Les conteneurs explicitement marqués
                     * sont toujours pris en compte.
                     */
                    if (
                        element.dataset
                            ?.metroScrollKey
                    ) {

                        return true;

                    }


                    /*
                     * Sinon on détecte uniquement
                     * les vrais conteneurs verticaux
                     * scrollables.
                     */
                    if (
                        element.scrollHeight
                        <= element.clientHeight
                    ) {

                        return false;

                    }


                    const style =
                        getComputedStyle(
                            element
                        );


                    return [
                        "auto",
                        "scroll"
                    ].includes(
                        style.overflowY
                    );

                }
            );

        }


        /**
         * Capture l'état actuel.
         */
        _captureMetroScrollState() {

            const elements =
                this
                    ._getMetroScrollableElements();


            const state =
                new Map();


            elements.forEach(
                (
                    element,
                    index
                ) => {

                    const key =
                        this._getMetroScrollKey(
                            element,
                            index
                        );


                    state.set(
                        key,
                        {
                            top:
                                element.scrollTop,

                            left:
                                element.scrollLeft
                        }
                    );

                }
            );


            this._metroScrollState =
                state;

        }


        /**
         * Restaure l'état précédemment capturé.
         */
        _restoreMetroScrollState() {

            if (
                !this._metroScrollState
                    ?.size
            ) {

                return;

            }


            const elements =
                this
                    ._getMetroScrollableElements();


            elements.forEach(
                (
                    element,
                    index
                ) => {

                    const key =
                        this._getMetroScrollKey(
                            element,
                            index
                        );


                    const position =
                        this._metroScrollState
                            .get(
                                key
                            );


                    if (!position) {

                        return;

                    }


                    element.scrollTop =
                        position.top;


                    element.scrollLeft =
                        position.left;

                }
            );

        }


        /**
         * Avant chaque rerender :
         * mémoriser le contexte de navigation.
         */
        async _preRender(
            context,
            options
        ) {

            this._captureMetroScrollState();


            await super._preRender(
                context,
                options
            );

        }


        /**
         * Après chaque rerender :
         * restaurer le contexte de navigation.
         */
        async _postRender(
            context,
            options
        ) {

            await super._postRender(
                context,
                options
            );


            this._restoreMetroScrollState();

        }

    };

}