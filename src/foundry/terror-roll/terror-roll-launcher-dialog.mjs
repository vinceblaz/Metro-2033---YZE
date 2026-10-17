/**
 * Fenêtre de lancement d'une attaque de Terreur (p.207).
 *
 * Le MJ y choisit :
 * - la valeur de Terreur : l'un des 3 paliers du livre
 *   (Effrayante/Atroce/Abominable), ou une valeur personnalisée
 *   (le livre ne limite pas les sources de Terreur à ces 3
 *   exemples — d'autres événements/créatures pourront avoir une
 *   valeur propre, non listée dans le tableau) ;
 * - les Acteurs soumis à cette attaque.
 *
 * Architecture identique à FoundryMeleeBlockStuntDialog :
 * génération de contenu et lecture de formulaire testables sans
 * Foundry, séparées de l'ouverture de la fenêtre elle-même
 * (DialogV2).
 */

import {
    getTerrorSourceLevelChoices
} from "../../domain/rules/terror.mjs";

import {
    escapeHTML,
    renderActorSelectionFieldset,
    readSelectedActorIds
} from "../shared/dialog-html.mjs";


export class TerrorRollLauncherDialog {


    /**
     * Génère le contenu HTML de la fenêtre à partir des seules
     * données fournies par l'orchestrateur (aucune règle métier
     * ici : juste la présentation des choix).
     */
    static createContent({
        actorOptions = []
    } = {}) {

        const sourceLevelRows =
            getTerrorSourceLevelChoices()
                .map(
                    (level, index) => `
                        <div class="metro-macro-value-row">
                            <label>
                                <input
                                    type="radio"
                                    name="terrorSource"
                                    value="${escapeHTML(level.key)}"
                                    ${index === 0 ? "checked" : ""}
                                />
                                <strong>${escapeHTML(level.label)}</strong>
                                (valeur ${escapeHTML(level.value)})
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

                ${renderActorSelectionFieldset({ actorOptions })}

                <fieldset>
                    <legend>Valeur de l'attaque</legend>

                    ${sourceLevelRows}

                    <div class="metro-macro-value-row">
                        <label>
                            <input
                                type="radio"
                                name="terrorSource"
                                value="custom"
                            />
                            Valeur personnalisée :
                            <input
                                type="number"
                                name="customValue"
                                min="0"
                                step="1"
                                value="3"
                            />
                        </label>
                    </div>
                </fieldset>

            </div>
        `;

    }


    /**
     * Lit la sélection (valeur de Terreur + Acteurs cochés)
     * depuis le formulaire de la fenêtre.
     */
    static readSelection({
        form,
        actorOptions = []
    } = {}) {

        const sourceKey =
            form?.elements?.terrorSource?.value
            ?? "";


        const sourceLevel =
            getTerrorSourceLevelChoices()
                .find(
                    level => level.key === sourceKey
                )
            ?? null;


        const terrorValue =
            sourceLevel
                ? sourceLevel.value
                : Number(
                    form?.elements?.customValue?.value
                    ?? 0
                );


        if (
            !Number.isInteger(terrorValue)
            || terrorValue < 0
        ) {

            throw new Error(
                "La valeur de Terreur doit être un entier positif ou nul."
            );

        }


        const actorIds =
            readSelectedActorIds({
                form,
                actorOptions
            });


        return {

            terrorValue,

            sourceLabel:
                sourceLevel?.label
                ?? "Personnalisée",

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
        title = "Attaque de Terreur",
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
                            "metro-terror-roll-launcher-dialog"
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


                                        /*
                                         * Sélection invalide : on
                                         * laisse la fenêtre ouverte
                                         * plutôt que de l'annuler
                                         * silencieusement.
                                         */
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
