import {
    RANGED_STUNT_IDS,
    resolveRangedStunts
} from "../../domain/rules/ranged-stunts.mjs";


export const STANDARD_RANGED_STUNT_DEFINITIONS =
    Object.freeze([
        Object.freeze({
            id:
                RANGED_STUNT_IDS.VIGOR_DAMAGE,

            label:
                "+1 dégât à la Vigueur",

            repeatable:
                true
        }),

        Object.freeze({
            id:
                RANGED_STUNT_IDS.SPIRIT_DAMAGE,

            label:
                "+1 dégât à l'Esprit",

            repeatable:
                true
        }),

        Object.freeze({
            id:
                RANGED_STUNT_IDS.SWAP_INITIATIVE,

            label:
                "Échanger l'initiative",

            repeatable:
                false
        }),

        Object.freeze({
            id:
                RANGED_STUNT_IDS.DISARM,

            label:
                "Désarmer",

            repeatable:
                false
        }),

        Object.freeze({
            id:
                RANGED_STUNT_IDS.KNOCKDOWN,

            label:
                "Mettre au sol ou repousser",

            repeatable:
                false
        })
    ]);


export const EXPLOSIVE_RANGED_STUNT_DEFINITIONS =
    Object.freeze([
        Object.freeze({
            id:
                RANGED_STUNT_IDS.GRENADE,

            label:
                "Grenade !",

            repeatable:
                false
        })
    ]);


/**
 * Fenêtre de sélection des actions d'éclat
 * pour une attaque à distance.
 *
 * Cette classe constitue la frontière Foundry/UI
 * du workflow des éclats à distance.
 *
 * Le moteur métier reste dans :
 * src/domain/rules/ranged-stunts.mjs
 */
export class RangedStuntDialog {


    /**
     * Retourne les actions d'éclat disponibles
     * pour le type d'attaque à distance concerné.
     *
     * Une attaque ordinaire propose les cinq actions
     * d'éclat générales du combat à distance.
     *
     * Une attaque utilisant les règles d'explosion
     * ne propose actuellement que « Grenade ! »,
     * conformément au contrat métier existant.
     */
    static getAvailableStunts({
        explosive = false
    } = {}) {

        if (
            explosive
        ) {

            return [
                ...EXPLOSIVE_RANGED_STUNT_DEFINITIONS
            ];

        }


        return [
            ...STANDARD_RANGED_STUNT_DEFINITIONS
        ];

    }


    /**
     * Ouvre la fenêtre de sélection des actions d'éclat.
     *
     * Lorsqu'aucune réussite excédentaire n'est disponible,
     * aucune interaction avec l'utilisateur n'est nécessaire :
     * la résolution métier vide est retournée directement.
     *
     * L'implémentation interactive sera construite
     * progressivement par TDD.
     */
    static async prompt({
        rollResult,
        explosive = false,
        dialog = null
    } = {}) 
    {

        const initialResolution =
            resolveRangedStunts({
                rollResult,
                allocation: {},
                explosive
            });


        if (
            initialResolution.extraSuccesses === 0
        ) {

            return initialResolution;

        }


        if (
            !dialog
            || typeof dialog.prompt !== "function"
        ) {

            return null;

        }


        const definitions =
            this.getAvailableStunts({
                explosive
            });


        const allocation =
            await dialog.prompt({
                extraSuccesses:
                    initialResolution.extraSuccesses,

                definitions
            });


        if (
            allocation === null
            || allocation === undefined
        ) {

            return null;

        }


        return resolveRangedStunts({
            rollResult,
            allocation,
            explosive
        });

    }

    
    static async chooseAllocation({
        rollResult,
        explosive = false,
        dialog = null
    } = {}) {

        const initialResolution =
            resolveRangedStunts({
                rollResult,
                allocation: {},
                explosive
            });


        if (
            initialResolution.extraSuccesses === 0
        ) {

            return {};

        }


        if (
            !dialog
            || typeof dialog.prompt !== "function"
        ) {

            return null;

        }


        const definitions =
            this.getAvailableStunts({
                explosive
            });


        const allocation =
            await dialog.prompt({
                extraSuccesses:
                    initialResolution.extraSuccesses,

                definitions
            });


        if (
            allocation === null
            || allocation === undefined
        ) {

            return null;

        }


        /*
        * Validation métier sans transformer
        * le contrat de cette frontière.
        *
        * Le pipeline attend l'allocation brute,
        * mais une allocation invalide doit rester
        * refusée par le domaine.
        */
        resolveRangedStunts({
            rollResult,
            allocation,
            explosive
        });


        return allocation;

    }    

}

function escapeHTML(value) {

    return String(
        value
        ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}

/**
 * Adaptateur Foundry de la fenêtre de sélection
 * des actions d'éclat à distance.
 *
 * Responsabilité :
 * - présenter les choix fournis par RangedStuntDialog ;
 * - recueillir une allocation brute ;
 * - ne réaliser aucune résolution métier.
 *
 * La validation métier reste exclusivement assurée
 * par resolveRangedStunts(), via RangedStuntDialog.
 */
export class FoundryRangedStuntDialog {


    /**
     * Génère le contenu HTML de la fenêtre
     * à partir des seules données fournies
     * par l'orchestrateur.
     *
     * Cette méthode ne connaît aucune règle métier.
     */
    static createContent({
        extraSuccesses,
        definitions = []
    } = {}) {

        const available =
            escapeHTML(
                extraSuccesses
            );


        const rows =
            definitions
                .map(
                    definition => {

                        const id =
                            escapeHTML(
                                definition?.id
                                ?? ""
                            );


                        const label =
                            escapeHTML(
                                definition?.label
                                ?? ""
                            );


                        if (
                            definition?.repeatable
                            === true
                        ) {

                            return `
                                <div
                                    class="metro2033 ranged-stunt-row"
                                    data-stunt-id="${id}"
                                >

                                    <div class="ranged-stunt-description">

                                        <strong>
                                            ${label}
                                        </strong>

                                    </div>

                                    <div class="ranged-stunt-control">

                                        <input
                                            type="number"
                                            name="stunt.${id}.quantity"
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
                                class="metro2033 ranged-stunt-row"
                                data-stunt-id="${id}"
                            >

                                <div class="ranged-stunt-control">

                                    <input
                                        type="checkbox"
                                        name="stunt.${id}.selected"
                                    />

                                </div>

                                <div class="ranged-stunt-description">

                                    <strong>
                                        ${label}
                                    </strong>

                                </div>

                            </div>
                        `;

                    }
                )
                .join("");


        return `
            <div class="metro2033 ranged-stunt-dialog">

                <p>
                    Réussites disponibles :
                    <strong data-stunt-available>
                        ${available}
                    </strong>
                </p>

                <div class="ranged-stunt-list">

                    ${rows}

                </div>

            </div>
        `;

    }

    static readAllocation({
        form,
        definitions = []
    } = {}) {

        const allocation = {};


        for (
            const definition
            of definitions
        ) {

            const id =
                String(
                    definition?.id
                    ?? ""
                );


            if (
                definition?.repeatable
                === true
            ) {

                const input =
                    form?.elements?.[
                        `stunt.${id}.quantity`
                    ];


                const rawValue =
                    Number(
                        input?.value
                        ?? 0
                    );


                allocation[id] =
                    Number.isFinite(
                        rawValue
                    )
                        ? Math.max(
                            0,
                            Math.trunc(
                                rawValue
                            )
                        )
                        : 0;


                continue;

            }


            const input =
                form?.elements?.[
                    `stunt.${id}.selected`
                ];


            allocation[id] =
                input?.checked
                === true;

        }


        return allocation;

    }


    /**
     * Ouvre l'interface Foundry de sélection des éclats.
     *
     * L'implémentation DialogV2 sera introduite
     * progressivement par TDD.
     */
    static async prompt({
        extraSuccesses,
        definitions = [],
        DialogV2Class = null,
        title = "Choisir les éclats à distance",
        confirmLabel = "Valider",
        cancelLabel = "Annuler"
    } = {}) {

        const DialogClass =
            DialogV2Class
            ?? globalThis.foundry
                ?.applications
                ?.api
                ?.DialogV2;


        if (
            typeof DialogClass
            !== "function"
        ) {

            throw new Error(
                "DialogV2 est indisponible."
            );

        }


        const content =
            this.createContent({
                extraSuccesses,
                definitions
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


                        settled =
                            true;


                        resolve(
                            value
                        );

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
                            "metro-ranged-stunt-dialog"
                        ],


                        window: {

                            title

                        },


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
                                            button?.form;


                                        if (!form) {

                                            return null;

                                        }


                                        const allocation =
                                            this.readAllocation({
                                                form,
                                                definitions
                                            });


                                        finish(
                                            allocation
                                        );


                                        await currentDialog
                                            .close();


                                        return allocation;

                                    }

                            }

                        ]

                    });


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


                dialog.render({
                    force:
                        true
                });

            }
        );

    }

}

