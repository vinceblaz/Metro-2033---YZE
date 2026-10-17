/**
 * Fenêtre de lancement d'un jet d'Asphyxie (p.205).
 *
 * À la différence de la Terreur, la Nocivité de la source ne
 * modifie jamais le jet lui-même — seule sa fréquence de
 * relance en dépend (tableau du livre). Le MJ doit néanmoins la
 * choisir ici (et plus seulement la consulter) : depuis
 * l'automatisation du round de combat (Bible §28.2/§32,
 * CombatRoundCoordinator), seule la Nocivité Extrême déclenche
 * un jet automatique à chaque round ; Légère et Forte restent
 * manuelles/narratives, y compris en combat. La Nocivité choisie
 * est persistée comme un flag sur l'Acteur au moment où l'état
 * « Asphyxié » lui est posé (cf. asphyxiation-roll-chat.mjs).
 *
 * Architecture identique à TerrorRollLauncherDialog : génération
 * de contenu et lecture de formulaire testables sans Foundry,
 * séparées de l'ouverture de la fenêtre elle-même (DialogV2).
 */

import {
    getAsphyxiationSourceLevelChoices
} from "../../domain/rules/asphyxiation.mjs";

import {
    escapeHTML,
    renderActorSelectionFieldset,
    readSelectedActorIds
} from "../shared/dialog-html.mjs";


export class AsphyxiationLauncherDialog {


    /**
     * Génère le contenu HTML de la fenêtre à partir des seules
     * données fournies par l'orchestrateur (aucune règle métier
     * ici : juste la présentation).
     */
    static createContent({
        actorOptions = []
    } = {}) {

        const sourceLevelRows =
            getAsphyxiationSourceLevelChoices()
                .map(
                    (level, index) => `
                        <div class="metro-macro-value-row">
                            <label>
                                <input
                                    type="radio"
                                    name="sourceLevel"
                                    value="${escapeHTML(level.key)}"
                                    ${index === 0 ? "checked" : ""}
                                />
                                <strong>${escapeHTML(level.label)}</strong>
                                — ${escapeHTML(level.frequency)}
                            </label>
                            <p class="metro-macro-value-examples">
                                ${escapeHTML(level.examples)}
                            </p>
                        </div>
                    `
                )
                .join("");


        return `
            <div class="metro2033 metro-multi-actor-roll-dialog">

                ${renderActorSelectionFieldset({
                    actorOptions,
                    legend: "Personnages exposés aux fumées/gaz toxiques"
                })}

                <fieldset>
                    <legend>Nocivité de la source (n'affecte pas le jet)</legend>

                    ${sourceLevelRows}

                    <p class="metro-macro-value-examples">
                        La Nocivité ne modifie pas le jet, seulement sa
                        fréquence. En combat, seule la Nocivité Extrême
                        déclenche un nouveau jet automatique à chaque
                        round ; Légère et Forte restent à votre charge.
                    </p>
                </fieldset>

            </div>
        `;

    }


    /**
     * Lit la sélection (Nocivité + Acteurs cochés) depuis le
     * formulaire de la fenêtre.
     */
    static readSelection({
        form,
        actorOptions = []
    } = {}) {

        const sourceKey =
            form?.elements?.sourceLevel?.value
            ?? "";

        const sourceLevel =
            getAsphyxiationSourceLevelChoices()
                .find(
                    level => level.key === sourceKey
                )
            ?? null;


        if (!sourceLevel) {

            throw new Error(
                "Sélectionnez la Nocivité de la source."
            );

        }


        const actorIds =
            readSelectedActorIds({
                form,
                actorOptions
            });


        return {

            sourceLevel:
                sourceLevel.key,

            sourceLabel:
                sourceLevel.label,

            actorIds

        };

    }


    /**
     * Ouvre la fenêtre Foundry et retourne la sélection du MJ,
     * ou null si annulée.
     */
    static async prompt({
        actorOptions = [],
        DialogV2Class = null,
        title = "Jet d'Asphyxie",
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

                        /*
                         * Rattache cette fenêtre au chrome
                         * Métro commun (bandeau d'en-tête
                         * rouge) — voir le sélecteur
                         * :is(...) de metro-base.css.
                         */
                        classes: [
                            "metro-asphyxiation-launcher-dialog"
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
