/**
 * Fenêtre de lancement d'un Jet de SURVIE (système Station,
 * règles p.219).
 *
 * Pour chaque semaine complète passée à rechercher une ressource
 * particulière, un PJ a droit à ce jet (non forçable). Le joueur
 * y choisit uniquement la Station et la ressource recherchée :
 * la Compétence utilisée (SURVIE, nommée explicitement par le
 * livre) et le modificateur appliqué (table p.219, cf.
 * `domain/rules/station-survival-roll.mjs`) sont entièrement
 * déterminés par ce choix — rien d'autre à saisir ici.
 *
 * Architecture identique aux autres fenêtres de lancement du
 * projet (IllnessLauncherDialog, PoisonLauncherDialog...) :
 * génération de contenu et lecture de formulaire testables sans
 * Foundry, séparées de l'ouverture de la fenêtre elle-même
 * (DialogV2).
 */

import {
    STATION_RESOURCE_DEFINITIONS
} from "./station-population-view-model.mjs";

import {
    getStationSurvivalRollModifier
} from "../../domain/rules/station-survival-roll.mjs";

import {
    escapeHTML
} from "../shared/dialog-html.mjs";


export class StationSurvivalLauncherDialog {


    /**
     * Génère le contenu HTML de la fenêtre à partir des seules
     * données fournies par l'orchestrateur (aucune règle métier
     * ici au-delà de la lecture du modificateur, affiché à titre
     * purement informatif).
     */
    static createContent({
        stationOptions = []
    } = {}) {

        const stationChoices =
            stationOptions.length > 0
                ? stationOptions
                    .map(
                        option => `
                            <option value="${escapeHTML(option.value)}">
                                ${escapeHTML(option.label)}
                            </option>
                        `
                    )
                    .join("")
                : "";


        const resourceChoices =
            STATION_RESOURCE_DEFINITIONS
                .map(
                    definition => {

                        const modifier =
                            getStationSurvivalRollModifier(
                                definition.key
                            );

                        return `
                            <option value="${escapeHTML(definition.key)}">
                                ${escapeHTML(definition.label)} (${modifier})
                            </option>
                        `;

                    }
                )
                .join("");


        return `
            <div class="metro2033 metro-station-survival-roll-dialog">

                <fieldset>
                    <legend>Station</legend>

                    ${
                        stationOptions.length > 0
                            ? `
                                <div class="metro-macro-value-row">
                                    <label>
                                        Station affiliée, recherchée depuis une
                                        semaine complète :
                                        <select name="stationUuid">
                                            ${stationOptions.length === 1 ? "" : '<option value="">— Choisir —</option>'}
                                            ${stationChoices}
                                        </select>
                                    </label>
                                </div>
                            `
                            : `
                                <p class="metro-macro-value-examples">
                                    Aucune Station disponible. Importez-en une
                                    depuis le compendium « Métro 2033 —
                                    Stations » dans l'onglet Objets du
                                    monde, ou déposez-la sur la fiche du
                                    personnage.
                                </p>
                            `
                    }

                </fieldset>

                <fieldset>
                    <legend>Ressource recherchée</legend>

                    <div class="metro-macro-value-row">
                        <label>
                            Ressource :
                            <select name="resourceKey">
                                <option value="">— Choisir —</option>
                                ${resourceChoices}
                            </select>
                        </label>
                        <p class="metro-macro-value-examples">
                            Le modificateur du jet de SURVIE dépend
                            entièrement de la ressource recherchée
                            (règles p.219) : Eau (-3), Nourriture (-2),
                            Équipement (-1), Énergie (-2),
                            Médicaments (-4).
                        </p>
                    </div>
                </fieldset>

            </div>
        `;

    }


    /**
     * Lit la sélection (Station + ressource) depuis le formulaire
     * de la fenêtre.
     */
    static readSelection({
        form,
        stationOptions = []
    } = {}) {

        const stationUuid =
            String(
                form?.elements?.stationUuid?.value
                ?? ""
            )
                .trim();

        if (stationUuid.length === 0) {

            throw new Error(
                "Sélectionnez la Station recherchée."
            );

        }

        if (
            !stationOptions.some(
                option => option.value === stationUuid
            )
        ) {

            throw new Error(
                "Cette Station n'est plus disponible."
            );

        }


        const resourceKey =
            String(
                form?.elements?.resourceKey?.value
                ?? ""
            )
                .trim();

        if (resourceKey.length === 0) {

            throw new Error(
                "Sélectionnez la ressource recherchée."
            );

        }

        // Lève une erreur explicite si la ressource n'est pas valide.
        getStationSurvivalRollModifier(
            resourceKey
        );


        return {

            stationUuid,

            resourceKey

        };

    }


    /**
     * Ouvre la fenêtre Foundry et retourne la sélection du
     * joueur, ou null si annulée.
     */
    static async prompt({
        stationOptions = [],
        DialogV2Class = null,
        title = "Jet de SURVIE",
        confirmLabel = "Continuer",
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
                stationOptions
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
                            "metro-station-survival-launcher-dialog"
                        ],


                        window: {
                            title
                        },

                        position: {
                            width: 480
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
                                                stationOptions
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
