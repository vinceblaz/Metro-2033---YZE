/**
 * Fenêtre de lancement d'une exposition au feu (p.203).
 *
 * Le MJ choisit les Personnages/PNJ exposés et l'Intensité du
 * feu (8 pour un feu standard). Même architecture que
 * AsphyxiationLauncherDialog : génération du contenu et lecture
 * du formulaire testables sans Foundry, séparées de l'ouverture
 * de la fenêtre (DialogV2).
 */

import {
    FIRE_MAX_INTENSITY,
    FIRE_STANDARD_INTENSITY,
    normalizeFireIntensity
} from "../../domain/rules/fire.mjs";

import {
    escapeHTML,
    renderActorSelectionFieldset,
    readSelectedActorIds
} from "../shared/dialog-html.mjs";


export class FireLauncherDialog {

    static createContent({
        actorOptions = []
    } = {}) {

        return `
            <div class="metro2033 metro-multi-actor-roll-dialog">

                ${renderActorSelectionFieldset({
                    actorOptions,
                    legend: "Personnages exposés au feu"
                })}

                <fieldset>
                    <legend>Intensité du feu</legend>

                    <div class="metro-macro-value-row">
                        <label>
                            Intensité
                            <input
                                type="number"
                                name="intensity"
                                min="1"
                                max="${FIRE_MAX_INTENSITY}"
                                step="1"
                                value="${FIRE_STANDARD_INTENSITY}"
                            />
                        </label>
                        <p class="metro-macro-value-examples">
                            Un feu standard a une Intensité de
                            ${FIRE_STANDARD_INTENSITY} (p.203). Chaque cible
                            jette autant de dés : 1 point de dégâts à la
                            VIGUEUR par réussite, réduit par la Protection
                            (sans résilience). Si elle est blessée, elle
                            prend feu ; en combat, le feu se rejoue
                            automatiquement à chaque round avec +1
                            d'Intensité.
                        </p>
                    </div>

                    <div class="metro-macro-value-row">
                        <label>
                            Source (facultatif)
                            <input
                                type="text"
                                name="sourceLabel"
                                value=""
                                placeholder="${escapeHTML("Ex. : Incendie du dépôt")}"
                            />
                        </label>
                    </div>
                </fieldset>

            </div>
        `;

    }


    static readSelection({
        form,
        actorOptions = []
    } = {}) {

        let intensity;

        try {

            intensity =
                normalizeFireIntensity(
                    form?.elements?.intensity?.value
                );

        }
        catch {

            throw new Error(
                "L'Intensité du feu doit être un entier supérieur ou égal à 1."
            );

        }

        const sourceLabel =
            String(
                form?.elements?.sourceLabel?.value ?? ""
            ).trim();

        const actorIds =
            readSelectedActorIds({
                form,
                actorOptions
            });

        return {
            intensity,
            sourceLabel:
                sourceLabel || null,
            actorIds
        };

    }


    static async prompt({
        actorOptions = [],
        DialogV2Class = null,
        title = "Exposition au feu",
        confirmLabel = "Lancer",
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

                let settled = false;

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
                            "metro-fire-launcher-dialog"
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
