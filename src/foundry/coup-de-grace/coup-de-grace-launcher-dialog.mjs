/**
 * Fenêtre de lancement du COUP DE GRÂCE (p.200), réservée au MJ.
 *
 * Le MJ y coche un ou plusieurs Personnages (PJ) — ceux qui
 * possèdent le Talent Impitoyable portent une étoile rouge après
 * leur nom — et peut modifier le texte adressé aux joueurs
 * (« Tu veux exécuter ta cible de sang-froid » par défaut).
 *
 * Même architecture que TerrorRollLauncherDialog : génération de
 * contenu et lecture de formulaire testables sans Foundry,
 * séparées de l'ouverture de la fenêtre (DialogV2).
 */

import {
    COUP_DE_GRACE_DEFAULT_TEXT
} from "../../domain/rules/coup-de-grace.mjs";

import {
    escapeHTML,
    readSelectedActorIds
} from "../shared/dialog-html.mjs";


export class CoupDeGraceLauncherDialog {


    /**
     * actorOptions : [{ id, name, preSelected, ruthless }]
     */
    static createContent({
        actorOptions = []
    } = {}) {

        const actorRows =
            actorOptions
                .map(
                    actorOption => `
                        <label class="metro-multi-actor-row">
                            <input
                                type="checkbox"
                                name="actor.${escapeHTML(actorOption.id)}"
                                ${actorOption.preSelected ? "checked" : ""}
                            />
                            ${escapeHTML(actorOption.name)}${
                                actorOption.ruthless
                                    ? ' <span class="metro-red-star" title="Impitoyable" aria-label="Impitoyable">★</span>'
                                    : ""
                            }
                        </label>
                    `
                )
                .join("");


        return `
            <div class="metro2033 metro-multi-actor-roll-dialog metro-coup-de-grace-dialog">

                <fieldset>
                    <legend>Personnages</legend>

                    ${
                        actorOptions.length > 0
                            ? `<div class="metro-multi-actor-grid metro-coup-de-grace-grid">${actorRows}</div>`
                            : "<p>Aucun Personnage disponible.</p>"
                    }

                    <p class="metro-macro-value-examples">
                        <span class="metro-red-star" aria-hidden="true">★</span>
                        Talent Impitoyable
                    </p>
                </fieldset>

                <fieldset>
                    <legend>Message</legend>

                    <textarea
                        name="message"
                        rows="3"
                    >${escapeHTML(COUP_DE_GRACE_DEFAULT_TEXT)}</textarea>
                </fieldset>

            </div>
        `;

    }


    /**
     * Lit la sélection (Personnages cochés + texte) depuis le
     * formulaire. Rejette une sélection vide ; un texte vide
     * retombe sur le texte par défaut.
     */
    static readSelection({
        form,
        actorOptions = []
    } = {}) {

        let actorIds;

        try {

            actorIds =
                readSelectedActorIds({
                    form,
                    actorOptions
                });

        }
        catch (error) {

            throw new Error(
                "Sélectionnez au moins un Personnage."
            );

        }


        const rawMessage =
            String(
                form?.elements?.message?.value
                ?? ""
            ).trim();


        return {

            actorIds,

            message:
                rawMessage.length > 0
                    ? rawMessage
                    : COUP_DE_GRACE_DEFAULT_TEXT

        };

    }


    /**
     * Ouvre la fenêtre Foundry et retourne la sélection du MJ,
     * ou null si annulée.
     */
    static async prompt({
        actorOptions = [],
        DialogV2Class = null,
        title = "Coup de grâce",
        confirmLabel = "Envoyer",
        cancelLabel = "Annuler"
    } = {}) {

        const DialogClass =
            DialogV2Class
            ?? globalThis.foundry
                ?.applications
                ?.api
                ?.DialogV2;


        if (typeof DialogClass !== "function") {

            throw new Error(
                "DialogV2 est indisponible."
            );

        }


        const content =
            this.createContent({
                actorOptions
            });


        return new Promise(
            resolve => {

                let settled =
                    false;


                const finish =
                    value => {

                        if (settled) {
                            return;
                        }

                        settled = true;

                        resolve(value);

                    };


                const dialog =
                    new DialogClass({

                        classes: [
                            "metro-coup-de-grace-launcher-dialog"
                        ],

                        window: {
                            title
                        },

                        position: {
                            width: 560
                        },

                        form: {
                            closeOnSubmit: false
                        },

                        content,

                        buttons: [

                            {
                                action: "cancel",
                                label: cancelLabel,
                                callback: async (event, button, currentDialog) => {

                                    finish(null);

                                    await currentDialog.close();

                                    return null;

                                }
                            },

                            {
                                action: "confirm",
                                label: confirmLabel,
                                default: true,
                                callback: async (event, button, currentDialog) => {

                                    const form =
                                        button?.form;


                                    if (!form) {
                                        return null;
                                    }


                                    let selection;

                                    try {

                                        selection =
                                            this.readSelection({
                                                form,
                                                actorOptions
                                            });

                                    }
                                    catch (error) {

                                        ui.notifications?.error(
                                            error.message
                                        );

                                        // Fenêtre laissée ouverte.
                                        return false;

                                    }


                                    finish(selection);

                                    await currentDialog.close();

                                    return selection;

                                }
                            }

                        ]

                    });


                dialog.addEventListener(
                    "close",
                    () => {
                        finish(null);
                    },
                    { once: true }
                );


                dialog.render({ force: true });

            }
        );

    }

}
