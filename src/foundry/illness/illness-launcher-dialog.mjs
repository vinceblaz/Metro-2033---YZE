/**
 * Fenêtre de lancement d'un jet de Maladie (p.204).
 *
 * Le MJ y choisit :
 * - la Virulence : une valeur libre, préremplie à 3 (maladie
 *   « standard », le livre ne fournit aucun catalogue de maladies
 *   nommées, seulement cette valeur de référence) ;
 * - une source optionnelle (texte libre, purement descriptif —
 *   ex. « eau contaminée », « morsure de rat ») ;
 * - les Acteurs exposés.
 *
 * Architecture identique à PoisonLauncherDialog/
 * AsphyxiationLauncherDialog : génération de contenu et lecture
 * de formulaire testables sans Foundry, séparées de l'ouverture
 * de la fenêtre elle-même (DialogV2).
 */

import {
    ILLNESS_STANDARD_VIRULENCE
} from "../../domain/rules/illness.mjs";

import {
    escapeHTML,
    renderActorSelectionFieldset,
    readSelectedActorIds
} from "../shared/dialog-html.mjs";


export class IllnessLauncherDialog {


    /**
     * Génère le contenu HTML de la fenêtre à partir des seules
     * données fournies par l'orchestrateur (aucune règle métier
     * ici : juste la présentation des choix).
     */
    static createContent({
        actorOptions = []
    } = {}) {

        return `
            <div class="metro2033 metro-multi-actor-roll-dialog">

                ${renderActorSelectionFieldset({
                    actorOptions,
                    legend: "Personnages exposés à une contagion/infection"
                })}

                <fieldset>
                    <legend>Virulence</legend>

                    <div class="metro-macro-value-row">
                        <label>
                            Valeur :
                            <input
                                type="number"
                                name="virulence"
                                min="1"
                                step="1"
                                value="${escapeHTML(ILLNESS_STANDARD_VIRULENCE)}"
                            />
                        </label>
                        <p class="metro-macro-value-examples">
                            Une maladie « standard » possède une Virulence
                            de 3. Certaines maladies possèdent une Virulence
                            bien plus élevée (le livre ne fournit aucun
                            autre exemple chiffré).
                        </p>
                    </div>

                    <div class="metro-macro-value-row">
                        <label>
                            Source (optionnel) :
                            <input
                                type="text"
                                name="sourceLabel"
                                placeholder="Ex. Eau contaminée"
                            />
                        </label>
                    </div>
                </fieldset>

            </div>
        `;

    }


    /**
     * Lit la sélection (Virulence + source + Acteurs cochés)
     * depuis le formulaire de la fenêtre.
     */
    static readSelection({
        form,
        actorOptions = []
    } = {}) {

        const virulence =
            Number(
                form?.elements?.virulence?.value
                ?? 0
            );


        if (
            !Number.isInteger(virulence)
            || virulence < 1
        ) {

            throw new Error(
                "La Virulence doit être un entier strictement positif."
            );

        }


        const sourceLabel =
            String(
                form?.elements?.sourceLabel?.value
                ?? ""
            )
                .trim();


        const actorIds =
            readSelectedActorIds({
                form,
                actorOptions
            });


        return {

            virulence,

            sourceLabel:
                sourceLabel.length > 0
                    ? sourceLabel
                    : null,

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
        title = "Jet de Maladie",
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
                            "metro-illness-launcher-dialog"
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
