import {
    getMeleeBlockStuntDefinitions,
    resolveMeleeBlockStunts
} from "../../domain/rules/melee-block-stunts.mjs";


/**
 * Fenêtre de répartition des éclats de blocage
 * (p.197, « BLOQUER »).
 *
 * Différence fondamentale avec les éclats d'attaque :
 *
 * cette fenêtre s'ouvre JUSTE APRÈS le jet de
 * blocage, avant que l'attaquant n'ait résolu son
 * attaque. Le défenseur choisit donc À L'AVEUGLE,
 * sans savoir si l'attaque aurait touché ni combien
 * de réussites elle aurait obtenues.
 *
 * La contre-attaque et le désarmement qui résultent
 * de ce choix ne sont pas appliqués ici : ils ne
 * seront appliqués qu'à la toute fin du workflow,
 * en même temps que les conséquences de l'attaquant.
 *
 * Architecture identique à RangedStuntDialog /
 * FoundryRangedStuntDialog : une classe métier
 * testable sans Foundry (MeleeBlockStuntDialog),
 * et un adaptateur Foundry séparé
 * (FoundryMeleeBlockStuntDialog).
 */
export class MeleeBlockStuntDialog {


    /**
     * Retourne les actions d'éclat de blocage
     * disponibles.
     *
     * Simple relais vers le domaine : il n'existe
     * qu'une seule variante (pas de distinction
     * explosif/normal comme pour le tir).
     */
    static getAvailableStunts() {

        return getMeleeBlockStuntDefinitions();

    }


    /**
     * Ouvre la fenêtre de répartition et retourne
     * la résolution métier complète, ou null si le
     * choix a été annulé.
     *
     * Lorsqu'il n'y a aucune réussite de blocage
     * disponible, aucune interaction n'est nécessaire :
     * la résolution vide est retournée directement.
     */
    static async prompt({
        blockSuccesses,
        dialog = null
    } = {}) {

        const initialResolution =
            resolveMeleeBlockStunts({
                blockSuccesses,
                allocation: []
            });


        if (
            initialResolution.available === 0
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
            this.getAvailableStunts();


        const allocation =
            await dialog.prompt({

                blockSuccesses:
                    initialResolution.available,

                definitions

            });


        if (
            allocation === null
            || allocation === undefined
        ) {

            return null;

        }


        return resolveMeleeBlockStunts({
            blockSuccesses,
            allocation
        });

    }


    /**
     * Ouvre la fenêtre et retourne l'allocation
     * brute (validée par le domaine mais non
     * résolue), ou null si annulée.
     */
    static async chooseAllocation({
        blockSuccesses,
        dialog = null
    } = {}) {

        const initialResolution =
            resolveMeleeBlockStunts({
                blockSuccesses,
                allocation: []
            });


        if (
            initialResolution.available === 0
        ) {

            return [];

        }


        if (
            !dialog
            || typeof dialog.prompt !== "function"
        ) {

            return null;

        }


        const definitions =
            this.getAvailableStunts();


        const allocation =
            await dialog.prompt({

                blockSuccesses:
                    initialResolution.available,

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
         * le contrat de cette frontière : une
         * allocation invalide reste refusée par
         * le domaine.
         */
        resolveMeleeBlockStunts({
            blockSuccesses,
            allocation
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
 * Adaptateur Foundry de la fenêtre de répartition
 * des éclats de blocage.
 *
 * Responsabilité :
 * - présenter les choix fournis par MeleeBlockStuntDialog ;
 * - recueillir une allocation brute ;
 * - ne réaliser aucune résolution métier.
 *
 * La validation métier reste exclusivement assurée
 * par resolveMeleeBlockStunts(), via MeleeBlockStuntDialog.
 */
export class FoundryMeleeBlockStuntDialog {


    /**
     * Génère le contenu HTML de la fenêtre
     * à partir des seules données fournies
     * par l'orchestrateur.
     *
     * Cette méthode ne connaît aucune règle métier.
     */
    static createContent({
        blockSuccesses,
        definitions = []
    } = {}) {

        const available =
            escapeHTML(
                blockSuccesses
            );


        const rows =
            definitions
                .map(
                    definition => {

                        const key =
                            escapeHTML(
                                definition?.key
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
                                    class="metro2033 melee-block-stunt-row"
                                    data-block-stunt-key="${key}"
                                >

                                    <div class="melee-block-stunt-description">

                                        <strong>
                                            ${label}
                                        </strong>

                                    </div>

                                    <div class="melee-block-stunt-control">

                                        <input
                                            type="number"
                                            name="blockStunt.${key}.quantity"
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
                                class="metro2033 melee-block-stunt-row"
                                data-block-stunt-key="${key}"
                            >

                                <div class="melee-block-stunt-control">

                                    <input
                                        type="checkbox"
                                        name="blockStunt.${key}.selected"
                                    />

                                </div>

                                <div class="melee-block-stunt-description">

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
            <div class="metro2033 melee-block-stunt-dialog">

                <p>
                    Votre blocage a réussi. Vous devez
                    choisir maintenant, sans connaître
                    le résultat de l'attaque adverse.
                </p>

                <p>
                    Réussites de blocage disponibles :
                    <strong data-block-stunt-available>
                        ${available}
                    </strong>
                </p>

                <div class="melee-block-stunt-list">

                    ${rows}

                </div>

            </div>
        `;

    }


    /**
     * Lit une allocation brute (tableau
     * {key, quantity}) à partir du formulaire
     * de la fenêtre.
     */
    static readAllocation({
        form,
        definitions = []
    } = {}) {

        const allocation = [];


        for (
            const definition
            of definitions
        ) {

            const key =
                String(
                    definition?.key
                    ?? ""
                );


            if (
                definition?.repeatable
                === true
            ) {

                const input =
                    form?.elements?.[
                        `blockStunt.${key}.quantity`
                    ];


                const rawValue =
                    Number(
                        input?.value
                        ?? 0
                    );


                const quantity =
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


                allocation.push({
                    key,
                    quantity
                });


                continue;

            }


            const input =
                form?.elements?.[
                    `blockStunt.${key}.selected`
                ];


            allocation.push({

                key,

                quantity:
                    input?.checked === true
                        ? 1
                        : 0

            });

        }


        return allocation;

    }


    /**
     * Ouvre l'interface Foundry de répartition
     * des éclats de blocage.
     */
    static async prompt({
        blockSuccesses,
        definitions = [],
        DialogV2Class = null,
        title = "Éclats de blocage",
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
                blockSuccesses,
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
                            "metro-melee-block-stunt-dialog"
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
