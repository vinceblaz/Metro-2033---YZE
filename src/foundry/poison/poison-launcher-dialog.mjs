/**
 * Fenêtre de lancement d'un jet de Poison (p.204-205).
 *
 * Le MJ y choisit :
 * - le type d'effet : l'un des 4 types du livre (Létal/
 *   Paralysant/Somnifère/Hallucinogène) — pas de poison
 *   personnalisé (le livre n'en fournit aucun autre) ;
 * - la Toxicité : une valeur libre (le livre ne fournit pas de
 *   catalogue de poisons nommés, seulement 3 exemples de
 *   puissance — faible 3, puissant 6, extrêmement puissant 9+) ;
 * - une source optionnelle (texte libre, purement descriptif) ;
 * - les Acteurs exposés.
 *
 * Architecture identique à TerrorRollLauncherDialog/
 * AsphyxiationLauncherDialog : génération de contenu et lecture
 * de formulaire testables sans Foundry, séparées de l'ouverture
 * de la fenêtre elle-même (DialogV2).
 */

import {
    getPoisonEffectTypeChoices
} from "../../domain/rules/poison.mjs";

import {
    escapeHTML,
    renderActorSelectionFieldset,
    readSelectedActorIds
} from "../shared/dialog-html.mjs";


export class PoisonLauncherDialog {


    /**
     * Génère le contenu HTML de la fenêtre à partir des seules
     * données fournies par l'orchestrateur (aucune règle métier
     * ici : juste la présentation des choix).
     */
    static createContent({
        actorOptions = []
    } = {}) {

        const effectTypeRows =
            getPoisonEffectTypeChoices()
                .map(
                    (effectType, index) => `
                        <div class="metro-macro-value-row">
                            <label>
                                <input
                                    type="radio"
                                    name="effectType"
                                    value="${escapeHTML(effectType.key)}"
                                    ${index === 0 ? "checked" : ""}
                                />
                                <strong>${escapeHTML(effectType.label)}</strong>
                            </label>
                            <p class="metro-macro-value-examples">
                                ${escapeHTML(effectType.fullEffect)}
                            </p>
                        </div>
                    `
                )
                .join("");


        return `
            <div class="metro2033 metro-multi-actor-roll-dialog">

                ${renderActorSelectionFieldset({
                    actorOptions,
                    legend: "Personnages exposés au poison"
                })}

                <fieldset>
                    <legend>Type d'effet</legend>

                    ${effectTypeRows}
                </fieldset>

                <fieldset>
                    <legend>Toxicité</legend>

                    <div class="metro-macro-value-row">
                        <label>
                            Valeur :
                            <input
                                type="number"
                                name="toxicity"
                                min="1"
                                step="1"
                                value="3"
                            />
                        </label>
                        <p class="metro-macro-value-examples">
                            Faible = 3, puissant = 6, extrêmement
                            puissant = 9 ou plus (le livre ne fournit
                            aucun catalogue de poisons nommés).
                        </p>
                    </div>

                    <div class="metro-macro-value-row">
                        <label>
                            Source (optionnel) :
                            <input
                                type="text"
                                name="sourceLabel"
                                placeholder="Ex. Morsure de Vodianoï"
                            />
                        </label>
                    </div>
                </fieldset>

            </div>
        `;

    }


    /**
     * Lit la sélection (type d'effet + Toxicité + source +
     * Acteurs cochés) depuis le formulaire de la fenêtre.
     */
    static readSelection({
        form,
        actorOptions = []
    } = {}) {

        const effectTypeKey =
            form?.elements?.effectType?.value
            ?? "";


        const effectType =
            getPoisonEffectTypeChoices()
                .find(
                    candidate => candidate.key === effectTypeKey
                )
            ?? null;


        if (!effectType) {

            throw new Error(
                "Sélectionnez un type d'effet de Poison."
            );

        }


        const toxicity =
            Number(
                form?.elements?.toxicity?.value
                ?? 0
            );


        if (
            !Number.isInteger(toxicity)
            || toxicity < 1
        ) {

            throw new Error(
                "La Toxicité doit être un entier strictement positif."
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

            effectTypeKey:
                effectType.key,

            effectTypeLabel:
                effectType.label,

            toxicity,

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
        title = "Jet de Poison",
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
                            "metro-poison-launcher-dialog"
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
