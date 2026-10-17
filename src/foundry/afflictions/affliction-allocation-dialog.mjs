/**
 * Fenêtre de répartition des afflictions d'un jet (livre
 * p.177, 190, 199).
 *
 * Même patron que ProtectionDamageAllocationDialog :
 * génération de contenu et lecture du formulaire sans Foundry
 * (testables), ouverture via DialogV2 séparée.
 *
 * Convention projet :
 *
 * Confirmer (somme exacte) -> retourne l'allocation
 * Annuler / X / Échap      -> retourne null ; l'appelant applique
 *                             alors TOUTES les afflictions en
 *                             dégâts d'attribut (décision du
 *                             porteur du projet).
 *
 * Cette fenêtre ne modifie AUCUN Document.
 */

import {
    escapeHTML
} from "../shared/dialog-html.mjs";

import {
    getDefaultAllocation,
    validateAllocationDraft
} from "../../domain/rules/affliction-allocation.mjs";


const FIELD_PREFIX =
    "allocation.";


export class AfflictionAllocationDialog {


    /**
     * available      : nombre d'afflictions à répartir ;
     * attributeLabel : libellé de l'attribut du jet ;
     * equipment      : { allowed, label } ;
     * rollLabel      : intitulé du jet (facultatif).
     */
    static createContent({
        available,
        attributeLabel = "l'attribut du jet",
        equipment = { allowed: false, label: null },
        rollLabel = null
    } = {}) {

        const count =
            Number(available);

        const defaults =
            getDefaultAllocation(count);

        const row = (
            key,
            title,
            hint,
            value,
            max
        ) => `
            <div class="protection-damage-allocation-row afflictions-allocation-row"
                 data-affliction-target="${key}">

                <div class="protection-damage-allocation-description">
                    <strong>${escapeHTML(title)}</strong>
                    <small>${escapeHTML(hint)}</small>
                </div>

                <div class="protection-damage-allocation-value">
                    <input
                        type="number"
                        name="${FIELD_PREFIX}${key}"
                        value="${value}"
                        min="0"
                        max="${max}"
                        step="1"
                        autocomplete="off"
                    />
                </div>

            </div>
        `;

        const equipmentRow =
            equipment?.allowed === true
                ? row(
                    "equipment",
                    `Équipement : ${equipment.label ?? "équipement utilisé"}`,
                    "1 maximum — la Fiabilité peut annuler l'affliction",
                    0,
                    1
                )
                : "";

        return `
            <div class="metro2033 protection-damage-allocation-dialog afflictions-allocation-dialog"
                 data-available="${count}">

                ${
                    rollLabel
                        ? `<p><em>${escapeHTML(rollLabel)}</em></p>`
                        : ""
                }

                <p>
                    <strong>${count}</strong>
                    affliction${count > 1 ? "s" : ""}
                    à répartir.
                </p>

                <div class="protection-damage-allocation-list">

                    ${row(
                        "attribute",
                        `Dégâts à ${attributeLabel}`,
                        "1 point de dégâts par affliction",
                        defaults.attribute,
                        count
                    )}

                    ${row(
                        "composure",
                        "Sang-froid",
                        "1 case de Sang-froid par affliction",
                        0,
                        count
                    )}

                    ${equipmentRow}

                    ${row(
                        "stress",
                        "Dé(s) de Stress",
                        "1 dé de Stress par affliction",
                        0,
                        count
                    )}

                </div>

                <p class="protection-damage-allocation-total">
                    <span>
                        Répartis :
                        <strong data-role="allocated-total">${defaults.attribute}</strong>
                        /
                        <strong data-role="available-total">${count}</strong>
                    </span>
                </p>

                <p>
                    <small>
                        Fermer la fenêtre sans confirmer applique toutes
                        les afflictions en dégâts à ${escapeHTML(attributeLabel)}.
                    </small>
                </p>

            </div>
        `;

    }


    /**
     * Lit le brouillon (valeurs brutes) depuis le formulaire.
     * Un champ absent (ex. Équipement non autorisé) vaut 0.
     */
    static readDraft(
        form
    ) {

        const draft = {};

        for (
            const key
            of [
                "attribute",
                "composure",
                "equipment",
                "stress"
            ]
        ) {

            draft[key] =
                form?.elements?.[`${FIELD_PREFIX}${key}`]?.value
                ?? 0;

        }

        return draft;

    }


    /**
     * Ouvre la fenêtre. Retourne l'allocation validée, ou null.
     */
    static async prompt({
        available,
        attributeLabel,
        equipment = { allowed: false, label: null },
        rollLabel = null,
        actorName = null,
        DialogV2Class = null
    } = {}) {

        const count =
            Number(available);

        if (
            !Number.isInteger(count)
            || count <= 0
        ) {

            throw new TypeError(
                "Le nombre d'afflictions à répartir doit être un entier strictement positif."
            );

        }


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


        const equipmentAllowed =
            equipment?.allowed === true;

        const content =
            this.createContent({
                available: count,
                attributeLabel,
                equipment,
                rollLabel
            });

        const title =
            actorName
                ? `${actorName} — Afflictions`
                : "Afflictions";


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
                            "metro-afflictions-allocation-dialog"
                        ],

                        window: {
                            title
                        },

                        form: {
                            closeOnSubmit: false
                        },

                        content,

                        buttons: [

                            {
                                action: "cancel",
                                label: "Annuler",
                                callback: (event, button, currentDialog) => {

                                    finish(null);

                                    currentDialog.close();

                                }
                            },

                            {
                                action: "confirm",
                                label: "Confirmer",
                                default: true,
                                callback: (event, button, currentDialog) => {

                                    const form =
                                        button?.form;

                                    if (!form) {
                                        return;
                                    }

                                    const check =
                                        validateAllocationDraft({
                                            available: count,
                                            draft:
                                                this.readDraft(form),
                                            equipmentAllowed
                                        });

                                    if (!check.valid) {

                                        ui.notifications?.error(
                                            check.errors[0]
                                        );

                                        // Fenêtre laissée ouverte.
                                        return;

                                    }

                                    finish(check.allocation);

                                    currentDialog.close();

                                }
                            }

                        ]

                    });


                // X / Échap : aucun bouton n'a appelé finish().
                dialog.addEventListener(
                    "close",
                    () => {
                        finish(null);
                    },
                    { once: true }
                );


                // Compteur en direct + bouton Confirmer.
                dialog.addEventListener(
                    "render",
                    () => {

                        const element =
                            dialog.element;

                        if (!element) {
                            return;
                        }

                        const refresh = () => {

                            const draft = {};

                            for (
                                const key
                                of [
                                    "attribute",
                                    "composure",
                                    "equipment",
                                    "stress"
                                ]
                            ) {

                                draft[key] =
                                    element.querySelector(
                                        `[name="${FIELD_PREFIX}${key}"]`
                                    )?.value
                                    ?? 0;

                            }

                            const check =
                                validateAllocationDraft({
                                    available: count,
                                    draft,
                                    equipmentAllowed
                                });

                            const totalElement =
                                element.querySelector(
                                    '[data-role="allocated-total"]'
                                );

                            if (totalElement) {

                                totalElement.textContent =
                                    String(check.allocated);

                            }

                            const confirmButton =
                                element.querySelector(
                                    '[data-action="confirm"]'
                                );

                            if (confirmButton) {

                                confirmButton.disabled =
                                    !check.valid;

                            }

                        };

                        for (
                            const input
                            of element.querySelectorAll(
                                `input[name^="${FIELD_PREFIX}"]`
                            )
                        ) {

                            input.addEventListener(
                                "input",
                                refresh
                            );

                        }

                        refresh();

                    },
                    { once: true }
                );


                dialog.render({ force: true });

            }
        );

    }

}
