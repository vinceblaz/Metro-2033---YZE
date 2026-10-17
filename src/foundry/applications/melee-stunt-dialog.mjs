import {
    getMeleeStuntDefinitions,
    resolveMeleeStunts
} from "../../domain/rules/melee-stunts.mjs";


/* ============================================================
 * UTILITAIRES
 * ============================================================ */


function escapeHTML(value) {

    return foundry.utils.escapeHTML(
        String(value ?? "")
    );

}


function normalizeAvailableSuccesses(value) {

    const number =
        Number(value);


    if (
        !Number.isInteger(number)
        || number < 0
    ) {

        throw new TypeError(
            "Le nombre de réussites disponibles doit être un entier positif ou nul."
        );

    }


    return number;

}


/* ============================================================
 * CONTENU
 * ============================================================ */


function createStuntRow(
    definition
) {

    const key =
        escapeHTML(
            definition.key
        );


    const label =
        escapeHTML(
            definition.label
        );


    if (definition.repeatable) {

        return `
            <div
                class="metro2033 melee-stunt-row"
                data-stunt-key="${key}"
            >

                <div class="melee-stunt-description">

                    <strong>
                        ${label}
                    </strong>

                    <small>
                        Coût : ${definition.cost} réussite par utilisation
                    </small>

                </div>

                <div class="melee-stunt-control">

                    <input
                        type="number"
                        name="stunt.${key}.quantity"
                        value="0"
                        min="0"
                        step="1"
                    />

                </div>

            </div>
        `;

    }


    return `
        <div
            class="metro2033 melee-stunt-row"
            data-stunt-key="${key}"
        >

            <div class="melee-stunt-control">

                <input
                    type="checkbox"
                    name="stunt.${key}.selected"
                />

            </div>

            <div class="melee-stunt-description">

                <strong>
                    ${label}
                </strong>

                <small>
                    Coût : ${definition.cost} réussite
                </small>

            </div>

        </div>
    `;

}


/**
 * Message d'erreur volontairement intégré à la fenêtre.
 *
 * Cela permet à l'utilisateur de corriger ses choix
 * sans perdre ce qu'il vient de saisir.
 */
function createDialogContent(
    available
) {

    const definitions =
        getMeleeStuntDefinitions();


    const rows =
        definitions
            .map(
                definition =>
                    createStuntRow(
                        definition
                    )
            )
            .join("");


    return `
        <div class="metro2033 melee-stunt-dialog">

            <p>
                Réussites disponibles :
                <strong data-stunt-available>
                    ${available}
                </strong>
            </p>

            <div class="melee-stunt-list">

                ${rows}

            </div>

            <hr />

            <div class="melee-stunt-summary">

                <div>
                    Dépensées :
                    <strong data-stunt-spent>
                        0
                    </strong>
                </div>

                <div>
                    Restantes :
                    <strong data-stunt-remaining>
                        ${available}
                    </strong>
                </div>

            </div>

            <p
                class="metro2033 melee-stunt-error"
                data-stunt-error
                hidden
            ></p>

        </div>
    `;

}


/* ============================================================
 * LECTURE DU FORMULAIRE
 * ============================================================ */


function readSelections(
    form
) {

    const definitions =
        getMeleeStuntDefinitions();


    const selections = [];


    for (
        const definition
        of definitions
    ) {

        let quantity = 0;


        if (definition.repeatable) {

            const input =
                form.elements[
                    `stunt.${definition.key}.quantity`
                ];


            const rawValue =
                Number(
                    input?.value
                    ?? 0
                );


            quantity =
                Number.isFinite(rawValue)
                    ? Math.max(
                        0,
                        Math.trunc(
                            rawValue
                        )
                    )
                    : 0;

        }
        else {

            const input =
                form.elements[
                    `stunt.${definition.key}.selected`
                ];


            quantity =
                input?.checked
                    ? 1
                    : 0;

        }


        if (quantity > 0) {

            selections.push({

                key:
                    definition.key,

                quantity

            });

        }

    }


    return selections;

}


/* ============================================================
 * CALCUL DE LA DÉPENSE
 * ============================================================ */


function calculateRawSpent(
    selections
) {

    const definitions =
        new Map(
            getMeleeStuntDefinitions()
                .map(
                    definition => [
                        definition.key,
                        definition
                    ]
                )
        );


    return selections.reduce(
        (
            total,
            selection
        ) => {

            const definition =
                definitions.get(
                    selection.key
                );


            if (!definition) {

                return total;

            }


            return (
                total
                + (
                    selection.quantity
                    * definition.cost
                )
            );

        },
        0
    );

}


/* ============================================================
 * AFFICHAGE
 * ============================================================ */


function getDialogRoot(
    form
) {

    return (
        form.querySelector(
            ".melee-stunt-dialog"
        )
        ?? form
    );

}


function showValidationError(
    form,
    message
) {

    const root =
        getDialogRoot(
            form
        );


    const errorElement =
        root.querySelector(
            "[data-stunt-error]"
        );


    if (!errorElement) {

        return;

    }


    errorElement.textContent =
        String(
            message
            ?? "La sélection est invalide."
        );


    errorElement.hidden =
        false;

}


function clearValidationError(
    form
) {

    const root =
        getDialogRoot(
            form
        );


    const errorElement =
        root.querySelector(
            "[data-stunt-error]"
        );


    if (!errorElement) {

        return;

    }


    errorElement.textContent =
        "";


    errorElement.hidden =
        true;

}


/**
 * Met à jour les compteurs sans modifier
 * le moindre état métier.
 */
function updateSummary(
    form,
    available
) {

    const root =
        getDialogRoot(
            form
        );


    const spentElement =
        root.querySelector(
            "[data-stunt-spent]"
        );


    const remainingElement =
        root.querySelector(
            "[data-stunt-remaining]"
        );


    const selections =
        readSelections(
            form
        );


    const spent =
        calculateRawSpent(
            selections
        );


    const remaining =
        available - spent;


    if (spentElement) {

        spentElement.textContent =
            String(
                spent
            );

    }


    if (remainingElement) {

        remainingElement.textContent =
            String(
                remaining
            );

    }


    /*
     * Dès que la sélection redevient valide,
     * on retire le précédent message d'erreur.
     */
    if (spent <= available) {

        clearValidationError(
            form
        );

    }

}


/* ============================================================
 * LISTENERS
 * ============================================================ */


function activateListeners(
    dialog,
    available
) {

    const element =
        dialog.element;


    if (!element) {

        return;

    }


    const form =
        element.querySelector(
            "form"
        );


    if (!form) {

        return;

    }


    const inputs =
        form.querySelectorAll(
            'input[name^="stunt."]'
        );


    for (
        const input
        of inputs
    ) {

        input.addEventListener(
            "input",
            () =>
                updateSummary(
                    form,
                    available
                )
        );


        input.addEventListener(
            "change",
            () =>
                updateSummary(
                    form,
                    available
                )
        );

    }


    updateSummary(
        form,
        available
    );

}


/* ============================================================
 * DIALOG
 * ============================================================ */


export class MeleeStuntDialog {


    /**
     * Ouvre la fenêtre de sélection des éclats.
     *
     * Convention :
     *
     * X / Annuler
     * → retourne null ;
     * → abandonne les choix ;
     * → aucune conséquence métier.
     *
     * Validation invalide
     * → fenêtre conservée ;
     * → choix conservés dans la fenêtre ;
     * → aucune conséquence métier.
     *
     * Validation valide
     * → retourne la résolution ;
     * → ferme la fenêtre.
     */
    static async prompt({

        extraSuccesses,

        title = "Choisir les éclats",

        confirmLabel = "Valider",

        cancelLabel = "Annuler"

    } = {}) {

        const available =
            normalizeAvailableSuccesses(
                extraSuccesses
            );


        /*
         * Cas purement défensif.
         *
         * Normalement le bouton Chat ne sera pas
         * proposé lorsqu'il n'y a aucun éclat.
         */
        if (available === 0) {

            return resolveMeleeStunts({

                extraSuccesses:
                    0,

                allocation:
                    []

            });

        }


        const content =
            createDialogContent(
                available
            );


        return new Promise(
            resolve => {

                let settled =
                    false;


                const finish =
                    value => {

                        if (settled) {

                            return;

                        }


                        settled =
                            true;


                        resolve(
                            value
                        );

                    };


                const dialog =
                    new foundry.applications.api
                        .DialogV2({

                            /*
                             * Rattache cette fenêtre au chrome
                             * Métro commun (bandeau d'en-tête
                             * rouge) — voir le sélecteur
                             * :is(...) de metro-base.css.
                             */
                            classes: [
                                "metro-melee-stunt-dialog"
                            ],


                            window: {

                                title

                            },


                            /*
                             * Fondamental pour notre convention :
                             *
                             * la soumission d'un bouton
                             * ne ferme jamais automatiquement
                             * la fenêtre.
                             */
                            form: {

                                closeOnSubmit:
                                    false

                            },


                            content,


                            buttons: [

                                {

                                    action:
                                        "cancel",

                                    label:
                                        cancelLabel,

                                    callback:
                                        async (
                                            event,
                                            button,
                                            currentDialog
                                        ) => {

                                            /*
                                             * Annuler :
                                             *
                                             * on abandonne complètement
                                             * les saisies de cette ouverture.
                                             */
                                            finish(
                                                null
                                            );


                                            await currentDialog
                                                .close();


                                            return null;

                                        }

                                },


                                {

                                    action:
                                        "confirm",

                                    label:
                                        confirmLabel,

                                    default:
                                        true,

                                    callback:
                                        async (
                                            event,
                                            button,
                                            currentDialog
                                        ) => {

                                            const form =
                                                button.form;


                                            if (!form) {

                                                ui.notifications.error(
                                                    "Le formulaire des actions d'éclat est introuvable."
                                                );


                                                /*
                                                 * Pas de fermeture.
                                                 */
                                                return null;

                                            }


                                            const selections =
                                                readSelections(
                                                    form
                                                );


                                            try {

                                                const result =
                                                    resolveMeleeStunts({

                                                        extraSuccesses:
                                                            available,

                                                        allocation:
                                                            selections

                                                    });


                                                /*
                                                 * Validation réussie.
                                                 *
                                                 * Seulement maintenant
                                                 * on retourne le résultat.
                                                 */
                                                finish(
                                                    result
                                                );


                                                await currentDialog
                                                    .close();


                                                return result;

                                            }
                                            catch (error) {

                                                console.error(
                                                    "METRO2033 | Sélection des éclats invalide.",
                                                    error
                                                );


                                                /*
                                                 * Affichage dans la fenêtre :
                                                 * l'utilisateur voit immédiatement
                                                 * ce qu'il doit corriger.
                                                 */
                                                showValidationError(
                                                    form,
                                                    error?.message
                                                    ?? "La sélection des éclats est invalide."
                                                );


                                                ui.notifications.warn(
                                                    error?.message
                                                    ?? "La sélection des éclats est invalide."
                                                );


                                                /*
                                                 * IMPORTANT :
                                                 *
                                                 * pas de finish(...)
                                                 * pas de close()
                                                 *
                                                 * → la fenêtre reste ouverte.
                                                 */
                                                return null;

                                            }

                                        }

                                }

                            ]

                        });


                /*
                 * Fermeture par X.
                 *
                 * Si la fenêtre est déjà validée,
                 * finish() ne fera rien grâce
                 * au garde settled.
                 */
                dialog.addEventListener(
                    "close",
                    () => {

                        finish(
                            null
                        );

                    },
                    {
                        once:
                            true
                    }
                );


                /*
                 * Les listeners des compteurs sont
                 * installés à chaque rendu.
                 */
                dialog.addEventListener(
                    "render",
                    () => {

                        activateListeners(
                            dialog,
                            available
                        );

                    }
                );


                dialog.render({
                    force:
                        true
                });

            }
        );

    }

}