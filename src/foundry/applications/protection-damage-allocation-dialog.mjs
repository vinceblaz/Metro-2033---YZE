/**
 * Fenêtre de répartition des dégâts de Protection.
 *
 * Responsabilités :
 *
 * - présenter les protections disponibles ;
 * - permettre au joueur de répartir les points ;
 * - imposer une répartition exacte ;
 * - ne modifier AUCUN Document Foundry ;
 * - ne persister AUCUN workflow.
 *
 * Convention projet :
 *
 * Annuler / X
 * → ferme la fenêtre
 * → abandonne les saisies temporaires
 * → retourne null
 *
 * Validation invalide
 * → affiche une erreur
 * → garde la fenêtre ouverte
 * → conserve les saisies courantes
 *
 * Validation valide
 * → ferme la fenêtre
 * → retourne les allocations
 */


function escapeHTML(
    value
) {

    return foundry.utils.escapeHTML(
        String(
            value ?? ""
        )
    );

}


/* ============================================================
 * NORMALISATION
 * ============================================================ */


function normalizeDamage(
    value
) {

    const number =
        Number(value);


    if (
        !Number.isInteger(number)
        || number < 0
    ) {

        return null;

    }


    return number;

}


function normalizeProtection(
    protection
) {

    if (
        !protection
        || typeof protection !== "object"
    ) {

        throw new TypeError(
            "Une protection valide est requise."
        );

    }


    const target =
        String(
            protection.target
            ?? ""
        );


    if (
        ![
            "body",
            "helmet"
        ].includes(
            target
        )
    ) {

        throw new TypeError(
            `Type de protection invalide : ${target}.`
        );

    }


    const current =
        Number(
            protection.current
            ?? 0
        );


    if (
        !Number.isInteger(current)
        || current < 0
    ) {

        throw new TypeError(
            `La Protection restante de "${protection.itemName ?? target}" est invalide.`
        );

    }


    return {

        target,

        itemId:
            protection.itemId
            ?? null,

        itemName:
            String(
                protection.itemName
                ?? target
            ),

        current

    };

}


/* ============================================================
 * CONTENU
 * ============================================================ */


function getProtectionLabel(
    protection
) {

    switch (
        protection.target
    ) {

        case "body":
            return "Armure corporelle";

        case "helmet":
            return "Casque";

        default:
            return "Protection";

    }

}


function createProtectionRow(
    protection
) {

    const target =
        escapeHTML(
            protection.target
        );


    const label =
        escapeHTML(
            getProtectionLabel(
                protection
            )
        );


    const itemName =
        escapeHTML(
            protection.itemName
        );


    const current =
        protection.current;


    return `
        <div
            class="metro2033 protection-damage-allocation-row"
            data-protection-target="${target}"
        >

            <div
                class="protection-damage-allocation-description"
            >

                <strong>
                    ${label}
                </strong>

                <div>
                    ${itemName}
                </div>

                <small>
                    Protection restante :
                    ${current}
                </small>

            </div>


            <div
                class="protection-damage-allocation-value"
            >

                <input
                    type="number"
                    name="allocation.${target}"
                    value="0"
                    min="0"
                    max="${current}"
                    step="1"
                    autocomplete="off"
                />

            </div>

        </div>
    `;

}


function createDialogContent(
    damage,
    protections
) {

    const rows =
        protections
            .map(
                protection =>
                    createProtectionRow(
                        protection
                    )
            )
            .join("");


    return `
        <div
            class="metro2033 protection-damage-allocation-dialog"
            data-required-damage="${damage}"
        >

            <p>
                Répartissez exactement
                <strong>${damage}</strong>
                point${damage > 1 ? "s" : ""}
                de dégradation entre les protections.
            </p>


            <div
                class="protection-damage-allocation-list"
            >

                ${rows}

            </div>


            <hr />


            <p
                class="protection-damage-allocation-total"
            >
                Répartis :
                <strong
                    data-role="allocated-total"
                >
                    0
                </strong>

                /

                <strong>
                    ${damage}
                </strong>
            </p>

        </div>
    `;

}


/* ============================================================
 * LECTURE DU FORMULAIRE
 * ============================================================ */


function readAllocations(
    form,
    protections
) {

    const allocations =
        {};


    for (
        const protection
        of protections
    ) {

        const input =
            form.elements[
                `allocation.${protection.target}`
            ];


        if (!input) {

            throw new Error(
                `Le champ de répartition "${protection.target}" est introuvable.`
            );

        }


        const value =
            normalizeDamage(
                input.value
            );


        if (
            value === null
        ) {

            throw new Error(
                `La dégradation attribuée à "${protection.itemName}" doit être un entier positif ou nul.`
            );

        }


        if (
            value
            > protection.current
        ) {

            throw new Error(
                `Impossible d'attribuer ${value} point(s) à "${protection.itemName}" : sa Protection restante est de ${protection.current}.`
            );

        }


        allocations[
            protection.target
        ] =
            value;

    }


    return allocations;

}


function getAllocationTotal(
    allocations
) {

    return Object.values(
        allocations
    )
        .reduce(
            (
                total,
                value
            ) =>
                total + value,
            0
        );

}


/* ============================================================
 * AFFICHAGE DU TOTAL
 * ============================================================ */


function updateDisplayedTotal(
    dialogElement,
    protections
) {

    if (!dialogElement) {

        return;

    }


    const totalElement =
        dialogElement.querySelector(
            '[data-role="allocated-total"]'
        );


    if (!totalElement) {

        return;

    }


    let total =
        0;


    for (
        const protection
        of protections
    ) {

        const input =
            dialogElement.querySelector(
                `[name="allocation.${protection.target}"]`
            );


        const value =
            normalizeDamage(
                input?.value
            );


        if (
            value !== null
        ) {

            total += value;

        }

    }


    totalElement.textContent =
        String(total);

}


/* ============================================================
 * DIALOG
 * ============================================================ */


export class ProtectionDamageAllocationDialog {


    /**
     * Ouvre la fenêtre de répartition.
     *
     * @param {Object} options
     * @param {number} options.damage
     * @param {Array} options.protections
     * @param {string|null} options.actorName
     *
     * @returns {Promise<Object|null>}
     *
     * Validation :
     *
     * {
     *     body: 1,
     *     helmet: 1
     * }
     *
     * Annulation :
     *
     * null
     */
    static async prompt({
        damage,
        protections,
        actorName = null
    } = {}) {

        const requiredDamage =
            Number(
                damage
                ?? 0
            );


        if (
            !Number.isInteger(
                requiredDamage
            )
            || requiredDamage <= 0
        ) {

            throw new TypeError(
                "Le nombre de points de dégradation doit être un entier strictement positif."
            );

        }


        if (
            !Array.isArray(
                protections
            )
            || protections.length < 2
        ) {

            throw new TypeError(
                "La fenêtre de répartition nécessite plusieurs protections."
            );

        }


        const normalizedProtections =
            protections.map(
                protection =>
                    normalizeProtection(
                        protection
                    )
            );


        const totalProtection =
            normalizedProtections.reduce(
                (
                    total,
                    protection
                ) =>
                    total
                    + protection.current,
                0
            );


        /*
         * Cette fenêtre ne doit jamais être ouverte
         * lorsqu'une destruction totale automatique
         * est possible.
         */
        if (
            requiredDamage
            >= totalProtection
        ) {

            throw new Error(
                "La répartition manuelle n'est pas nécessaire : les dégâts suffisent à détruire toutes les protections."
            );

        }


        const content =
            createDialogContent(
                requiredDamage,
                normalizedProtections
            );


        const title =
            actorName
                ? `${actorName} — Dégradation des protections`
                : "Dégradation des protections";


        return new Promise(
            resolve => {

                /*
                 * Une seule sortie de la Promise
                 * est autorisée.
                 *
                 * Cela permet au listener "close"
                 * d'être commun à :
                 *
                 * - X ;
                 * - Annuler ;
                 * - validation réussie.
                 */
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
                                "metro-protection-damage-allocation-dialog"
                            ],


                            window: {

                                title

                            },


                            form: {

                                /*
                                 * Une validation invalide
                                 * ne ferme jamais
                                 * automatiquement la fenêtre.
                                 */
                                closeOnSubmit:
                                    false

                            },


                            content,


                            buttons: [

                                {

                                    action:
                                        "cancel",

                                    label:
                                        "Annuler",

                                    callback:
                                        (
                                            event,
                                            button,
                                            currentDialog
                                        ) => {

                                            /*
                                             * Annuler :
                                             *
                                             * la Promise est résolue
                                             * AVANT la fermeture.
                                             */
                                            finish(
                                                null
                                            );


                                            currentDialog
                                                .close();

                                        }

                                },


                                {

                                    action:
                                        "confirm",

                                    label:
                                        "Valider",

                                    default:
                                        true,

                                    callback:
                                        (
                                            event,
                                            button,
                                            currentDialog
                                        ) => {

                                            try {

                                                const form =
                                                    button.form;


                                                if (!form) {

                                                    throw new Error(
                                                        "Le formulaire de répartition est introuvable."
                                                    );

                                                }


                                                const allocations =
                                                    readAllocations(
                                                        form,
                                                        normalizedProtections
                                                    );


                                                const allocatedTotal =
                                                    getAllocationTotal(
                                                        allocations
                                                    );


                                                /*
                                                 * Tous les points doivent
                                                 * être répartis exactement.
                                                 */
                                                if (
                                                    allocatedTotal
                                                    !== requiredDamage
                                                ) {

                                                    ui.notifications.error(
                                                        `Tous les points de dégradation doivent être répartis exactement : ${allocatedTotal} / ${requiredDamage}.`
                                                    );


                                                    /*
                                                     * PAS de finish().
                                                     * PAS de close().
                                                     *
                                                     * Les valeurs saisies
                                                     * restent dans le Dialog.
                                                     */
                                                    return;

                                                }


                                                /*
                                                 * Validation valide :
                                                 *
                                                 * on résout la Promise
                                                 * AVANT de fermer.
                                                 */
                                                finish(
                                                    allocations
                                                );


                                                currentDialog
                                                    .close();

                                            }
                                            catch (
                                                error
                                            ) {

                                                ui.notifications.error(
                                                    error.message
                                                    ?? "Répartition de Protection invalide."
                                                );


                                                /*
                                                 * Erreur :
                                                 *
                                                 * aucune résolution ;
                                                 * aucune fermeture.
                                                 */
                                                return;

                                            }

                                        }

                                }

                            ]

                        });


                /* ====================================================
                 * FERMETURE DE LA FENÊTRE
                 * ==================================================== */


                /*
                 * IMPORTANT :
                 *
                 * DialogV2 est une ApplicationV2.
                 *
                 * On écoute explicitement son événement
                 * "close" au lieu de dépendre d'une option
                 * `close:` passée au constructeur.
                 *
                 * X :
                 * → aucun bouton n'a appelé finish()
                 * → finish(null)
                 *
                 * Annuler :
                 * → finish(null) a déjà été appelé
                 * → le guard settled ignore ce second appel
                 *
                 * Validation valide :
                 * → finish(allocations) a déjà été appelé
                 * → le guard settled conserve les allocations.
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


                /* ====================================================
                 * MISE À JOUR DU TOTAL
                 * ==================================================== */


                /*
                 * Aucun état n'est persisté.
                 *
                 * Le compteur reflète uniquement
                 * les valeurs présentes dans
                 * cette ouverture du Dialog.
                 */
                dialog.addEventListener(
                    "render",
                    () => {

                        const element =
                            dialog.element;


                        if (!element) {

                            return;

                        }


                        const inputs =
                            element.querySelectorAll(
                                'input[name^="allocation."]'
                            );


                        for (
                            const input
                            of inputs
                        ) {

                            input.addEventListener(
                                "input",
                                () => {

                                    updateDisplayedTotal(
                                        element,
                                        normalizedProtections
                                    );

                                }
                            );

                        }


                        updateDisplayedTotal(
                            element,
                            normalizedProtections
                        );

                    },
                    {
                        once:
                            true
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