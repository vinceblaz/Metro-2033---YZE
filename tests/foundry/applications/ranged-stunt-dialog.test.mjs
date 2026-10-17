import test from "node:test";
import assert from "node:assert/strict";


test(
    "RangedStuntDialog expose une méthode prompt",
    async () => {

        const {
            RangedStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/ranged-stunt-dialog.mjs"
            );


        assert.equal(
            typeof RangedStuntDialog,
            "function"
        );


        assert.equal(
            typeof RangedStuntDialog.prompt,
            "function"
        );

    }
);


test(
    "RangedStuntDialog retourne directement une résolution sans éclat lorsqu'il n'y a aucune réussite excédentaire",
    async () => {

        const {
            RangedStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/ranged-stunt-dialog.mjs"
            );


        const rollResult = {
            successes:
                1
        };


        const result =
            await RangedStuntDialog.prompt({
                rollResult,
                explosive:
                    false
            });


        assert.deepEqual(
            result,
            {
                successes:
                    1,

                extraSuccesses:
                    0,

                spent:
                    0,

                remaining:
                    0,

                effects: {
                    vigorDamage:
                        0,

                    spiritDamage:
                        0,

                    swapInitiative:
                        false,

                    disarm:
                        false,

                    knockdown:
                        false,

                    grenade:
                        false
                }
            }
        );

    }
);


test(
    "RangedStuntDialog expose les cinq actions d'éclat ordinaires pour un tir normal",
    async () => {

        const {
            RangedStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/ranged-stunt-dialog.mjs"
            );


        const definitions =
            RangedStuntDialog.getAvailableStunts({
                explosive:
                    false
            });


        assert.deepEqual(
            definitions.map(
                definition =>
                    definition.id
            ),
            [
                "vigorDamage",
                "spiritDamage",
                "swapInitiative",
                "disarm",
                "knockdown"
            ]
        );


        assert.equal(
            definitions.some(
                definition =>
                    definition.id === "grenade"
            ),
            false
        );

    }
);


test(
    "RangedStuntDialog décrit correctement les actions répétables et uniques d'un tir normal",
    async () => {

        const {
            RangedStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/ranged-stunt-dialog.mjs"
            );


        const definitions =
            RangedStuntDialog.getAvailableStunts({
                explosive:
                    false
            });


        assert.deepEqual(
            definitions,
            [
                {
                    id:
                        "vigorDamage",

                    label:
                        "+1 dégât à la Vigueur",

                    repeatable:
                        true
                },

                {
                    id:
                        "spiritDamage",

                    label:
                        "+1 dégât à l'Esprit",

                    repeatable:
                        true
                },

                {
                    id:
                        "swapInitiative",

                    label:
                        "Échanger l'initiative",

                    repeatable:
                        false
                },

                {
                    id:
                        "disarm",

                    label:
                        "Désarmer",

                    repeatable:
                        false
                },

                {
                    id:
                        "knockdown",

                    label:
                        "Mettre au sol ou repousser",

                    repeatable:
                        false
                }
            ]
        );

    }
);

test(
    "RangedStuntDialog sollicite le dialogue lorsqu'une réussite excédentaire est disponible",
    async () => {

        const {
            RangedStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/ranged-stunt-dialog.mjs"
            );


        const calls = [];


        const dialog = {
            async prompt(options) {

                calls.push(
                    options
                );


                return null;

            }
        };


        const rollResult = {
            successes:
                2
        };


        const result =
            await RangedStuntDialog.prompt({
                rollResult,
                explosive:
                    false,
                dialog
            });


        assert.equal(
            calls.length,
            1
        );


        assert.equal(
            calls[0].extraSuccesses,
            1
        );


        assert.deepEqual(
            calls[0].definitions.map(
                definition =>
                    definition.id
            ),
            [
                "vigorDamage",
                "spiritDamage",
                "swapInitiative",
                "disarm",
                "knockdown"
            ]
        );


        assert.equal(
            result,
            null
        );

    }
);

test(
    "RangedStuntDialog résout l'allocation retournée par le dialogue",
    async () => {

        const {
            RangedStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/ranged-stunt-dialog.mjs"
            );


        const dialog = {
            async prompt() {

                return {
                    vigorDamage:
                        1,

                    spiritDamage:
                        0,

                    swapInitiative:
                        false,

                    disarm:
                        true,

                    knockdown:
                        false
                };

            }
        };


        const rollResult = {
            successes:
                3
        };


        const result =
            await RangedStuntDialog.prompt({
                rollResult,
                explosive:
                    false,
                dialog
            });


        assert.deepEqual(
            result,
            {
                successes:
                    3,

                extraSuccesses:
                    2,

                spent:
                    2,

                remaining:
                    0,

                effects: {
                    vigorDamage:
                        1,

                    spiritDamage:
                        0,

                    swapInitiative:
                        false,

                    disarm:
                        true,

                    knockdown:
                        false,

                    grenade:
                        false
                }
            }
        );

    }
);

test(
    "RangedStuntDialog retourne null lorsque le dialogue est annulé",
    async () => {

        const {
            RangedStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/ranged-stunt-dialog.mjs"
            );


        let promptCalls =
            0;


        const dialog = {
            async prompt() {

                promptCalls +=
                    1;


                return null;

            }
        };


        const rollResult = {
            successes:
                2
        };


        const result =
            await RangedStuntDialog.prompt({
                rollResult,
                explosive:
                    false,
                dialog
            });


        assert.equal(
            promptCalls,
            1
        );


        assert.equal(
            result,
            null
        );

    }
);

test(
    "RangedStuntDialog laisse le domaine refuser une allocation dépassant les réussites excédentaires",
    async () => {

        const {
            RangedStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/ranged-stunt-dialog.mjs"
            );


        const dialog = {
            async prompt() {

                return {
                    vigorDamage:
                        2,

                    spiritDamage:
                        0,

                    swapInitiative:
                        false,

                    disarm:
                        false,

                    knockdown:
                        false
                };

            }
        };


        const rollResult = {
            successes:
                2
        };


        await assert.rejects(
            () =>
                RangedStuntDialog.prompt({
                    rollResult,
                    explosive:
                        false,
                    dialog
                }),

            {
                name:
                    "RangeError",

                message:
                    "Les actions d'éclat dépensent 2 réussite(s), mais seulement 1 réussite(s) excédentaire(s) sont disponibles."
            }
        );

    }
);

test(
    "FoundryRangedStuntDialog expose une méthode prompt",
    async () => {

        const {
            FoundryRangedStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/ranged-stunt-dialog.mjs"
            );


        assert.equal(
            typeof FoundryRangedStuntDialog,
            "function"
        );


        assert.equal(
            typeof FoundryRangedStuntDialog.prompt,
            "function"
        );

    }
);

test(
    "FoundryRangedStuntDialog génère le contenu des actions répétables et uniques",
    async () => {

        const {
            FoundryRangedStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/ranged-stunt-dialog.mjs"
            );


        const definitions = [
            {
                id:
                    "vigorDamage",

                label:
                    "+1 dégât à la Vigueur",

                repeatable:
                    true
            },

            {
                id:
                    "disarm",

                label:
                    "Désarmer",

                repeatable:
                    false
            }
        ];


        const content =
            FoundryRangedStuntDialog.createContent({
                extraSuccesses:
                    2,

                definitions
            });


        assert.equal(
            typeof content,
            "string"
        );


        assert.match(
            content,
            /Réussites disponibles/
        );


        assert.match(
            content,
            />\s*2\s*</
        );


        assert.match(
            content,
            /\+1 dégât à la Vigueur/
        );


        assert.match(
            content,
            /name="stunt\.vigorDamage\.quantity"/
        );


        assert.match(
            content,
            /type="number"/
        );


        assert.match(
            content,
            /Désarmer/
        );


        assert.match(
            content,
            /name="stunt\.disarm\.selected"/
        );


        assert.match(
            content,
            /type="checkbox"/
        );

    }
);

test(
    "FoundryRangedStuntDialog échappe les identifiants et libellés injectés dans le HTML",
    async () => {

        const {
            FoundryRangedStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/ranged-stunt-dialog.mjs"
            );


        const definitions = [
            {
                id:
                    'danger" onclick="attack',

                label:
                    '<script>alert("metro")</script>',

                repeatable:
                    false
            }
        ];


        const content =
            FoundryRangedStuntDialog.createContent({
                extraSuccesses:
                    1,

                definitions
            });


        assert.doesNotMatch(
            content,
            /<script>/
        );


        assert.doesNotMatch(
            content,
            /onclick="attack/
        );


        assert.match(
            content,
            /&lt;script&gt;alert\(&quot;metro&quot;\)&lt;\/script&gt;/
        );


        assert.match(
            content,
            /data-stunt-id="danger&quot; onclick=&quot;attack"/
        );


        assert.match(
            content,
            /name="stunt\.danger&quot; onclick=&quot;attack\.selected"/
        );

    }
);

test(
    "FoundryRangedStuntDialog lit les actions répétables et uniques dans une allocation brute",
    async () => {

        const {
            FoundryRangedStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/ranged-stunt-dialog.mjs"
            );


        const definitions = [
            {
                id:
                    "vigorDamage",

                label:
                    "+1 dégât à la Vigueur",

                repeatable:
                    true
            },

            {
                id:
                    "spiritDamage",

                label:
                    "+1 dégât à l'Esprit",

                repeatable:
                    true
            },

            {
                id:
                    "swapInitiative",

                label:
                    "Échanger l'initiative",

                repeatable:
                    false
            },

            {
                id:
                    "disarm",

                label:
                    "Désarmer",

                repeatable:
                    false
            },

            {
                id:
                    "knockdown",

                label:
                    "Mettre au sol ou repousser",

                repeatable:
                    false
            }
        ];


        const form = {
            elements: {
                "stunt.vigorDamage.quantity": {
                    value:
                        "2"
                },

                "stunt.spiritDamage.quantity": {
                    value:
                        "1"
                },

                "stunt.swapInitiative.selected": {
                    checked:
                        true
                },

                "stunt.disarm.selected": {
                    checked:
                        false
                },

                "stunt.knockdown.selected": {
                    checked:
                        true
                }
            }
        };


        const allocation =
            FoundryRangedStuntDialog.readAllocation({
                form,
                definitions
            });


        assert.deepEqual(
            allocation,
            {
                vigorDamage:
                    2,

                spiritDamage:
                    1,

                swapInitiative:
                    true,

                disarm:
                    false,

                knockdown:
                    true
            }
        );

    }
);

test(
    "FoundryRangedStuntDialog normalise les quantités invalides ou négatives à zéro",
    async () => {

        const {
            FoundryRangedStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/ranged-stunt-dialog.mjs"
            );


        const definitions = [
            {
                id:
                    "vigorDamage",

                label:
                    "+1 dégât à la Vigueur",

                repeatable:
                    true
            },

            {
                id:
                    "spiritDamage",

                label:
                    "+1 dégât à l'Esprit",

                repeatable:
                    true
            }
        ];


        const form = {
            elements: {
                "stunt.vigorDamage.quantity": {
                    value:
                        "-3"
                },

                "stunt.spiritDamage.quantity": {
                    value:
                        "invalide"
                }
            }
        };


        const allocation =
            FoundryRangedStuntDialog.readAllocation({
                form,
                definitions
            });


        assert.deepEqual(
            allocation,
            {
                vigorDamage:
                    0,

                spiritDamage:
                    0
            }
        );

    }
);

test(
    "FoundryRangedStuntDialog construit et affiche le dialogue Foundry",
    async () => {

        const {
            FoundryRangedStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/ranged-stunt-dialog.mjs"
            );


        const definitions = [
            {
                id:
                    "vigorDamage",

                label:
                    "+1 dégât à la Vigueur",

                repeatable:
                    true
            },

            {
                id:
                    "disarm",

                label:
                    "Désarmer",

                repeatable:
                    false
            }
        ];


        let receivedOptions =
            null;


        let renderOptions =
            null;


        class FakeDialogV2 {

            constructor(options) {

                receivedOptions =
                    options;

            }


            addEventListener() {

                // Sans effet pour ce test.

            }


            render(options) {

                renderOptions =
                    options;

            }

        }


        const pending =
            FoundryRangedStuntDialog.prompt({
                extraSuccesses:
                    2,

                definitions,

                DialogV2Class:
                    FakeDialogV2
            });


        assert.equal(
            receivedOptions?.window?.title,
            "Choisir les éclats à distance"
        );


        assert.equal(
            receivedOptions?.form?.closeOnSubmit,
            false
        );


        assert.equal(
            typeof receivedOptions?.content,
            "string"
        );


        assert.match(
            receivedOptions.content,
            /\+1 dégât à la Vigueur/
        );


        assert.match(
            receivedOptions.content,
            /Désarmer/
        );


        assert.equal(
            Array.isArray(
                receivedOptions?.buttons
            ),
            true
        );


        assert.deepEqual(
            receivedOptions.buttons.map(
                button =>
                    button.action
            ),
            [
                "cancel",
                "confirm"
            ]
        );


        assert.deepEqual(
            renderOptions,
            {
                force:
                    true
            }
        );


        /*
         * Le faux dialogue n'effectue volontairement
         * aucune validation ni annulation.
         *
         * La Promise doit donc rester en attente.
         */
        void pending;

    }
);

test(
    "FoundryRangedStuntDialog retourne null et ferme le dialogue lors de l'annulation",
    async () => {

        const {
            FoundryRangedStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/ranged-stunt-dialog.mjs"
            );


        let receivedOptions =
            null;


        let closeCalls =
            0;


        class FakeDialogV2 {

            constructor(options) {

                receivedOptions =
                    options;

            }


            addEventListener() {

                // Sans effet pour ce test.

            }


            render() {

                // Sans effet pour ce test.

            }


            async close() {

                closeCalls +=
                    1;

            }

        }


        const resultPromise =
            FoundryRangedStuntDialog.prompt({
                extraSuccesses:
                    1,

                definitions: [
                    {
                        id:
                            "disarm",

                        label:
                            "Désarmer",

                        repeatable:
                            false
                    }
                ],

                DialogV2Class:
                    FakeDialogV2
            });


        const cancelButton =
            receivedOptions.buttons.find(
                button =>
                    button.action
                    === "cancel"
            );


        assert.equal(
            typeof cancelButton?.callback,
            "function"
        );


        const currentDialog = {
            async close() {

                closeCalls +=
                    1;

            }
        };


        const callbackResult =
            await cancelButton.callback(
                null,
                null,
                currentDialog
            );


        const result =
            await resultPromise;


        assert.equal(
            callbackResult,
            null
        );


        assert.equal(
            result,
            null
        );


        assert.equal(
            closeCalls,
            1
        );

    }
);

test(
    "FoundryRangedStuntDialog retourne null lors de la fermeture par X",
    async () => {

        const {
            FoundryRangedStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/ranged-stunt-dialog.mjs"
            );


        let closeListener =
            null;


        let closeListenerOptions =
            null;


        class FakeDialogV2 {

            constructor() {

                // Sans effet pour ce test.

            }


            addEventListener(
                type,
                listener,
                options
            ) {

                if (
                    type === "close"
                ) {

                    closeListener =
                        listener;


                    closeListenerOptions =
                        options;

                }

            }


            render() {

                // Sans effet pour ce test.

            }

        }


        const resultPromise =
            FoundryRangedStuntDialog.prompt({
                extraSuccesses:
                    1,

                definitions: [
                    {
                        id:
                            "disarm",

                        label:
                            "Désarmer",

                        repeatable:
                            false
                    }
                ],

                DialogV2Class:
                    FakeDialogV2
            });


        assert.equal(
            typeof closeListener,
            "function"
        );


        assert.deepEqual(
            closeListenerOptions,
            {
                once:
                    true
            }
        );


        closeListener();


        const result =
            await resultPromise;


        assert.equal(
            result,
            null
        );

    }
);

test(
    "FoundryRangedStuntDialog retourne l'allocation brute lors de la validation",
    async () => {

        const {
            FoundryRangedStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/ranged-stunt-dialog.mjs"
            );


        const definitions = [
            {
                id:
                    "vigorDamage",

                label:
                    "+1 dégât à la Vigueur",

                repeatable:
                    true
            },

            {
                id:
                    "spiritDamage",

                label:
                    "+1 dégât à l'Esprit",

                repeatable:
                    true
            },

            {
                id:
                    "swapInitiative",

                label:
                    "Échanger l'initiative",

                repeatable:
                    false
            },

            {
                id:
                    "disarm",

                label:
                    "Désarmer",

                repeatable:
                    false
            },

            {
                id:
                    "knockdown",

                label:
                    "Mettre au sol ou repousser",

                repeatable:
                    false
            }
        ];


        let receivedOptions =
            null;


        class FakeDialogV2 {

            constructor(options) {

                receivedOptions =
                    options;

            }


            addEventListener() {

                // Sans effet pour ce test.

            }


            render() {

                // Sans effet pour ce test.

            }

        }


        const resultPromise =
            FoundryRangedStuntDialog.prompt({
                extraSuccesses:
                    3,

                definitions,

                DialogV2Class:
                    FakeDialogV2
            });


        const confirmButton =
            receivedOptions.buttons.find(
                button =>
                    button.action
                    === "confirm"
            );


        assert.equal(
            typeof confirmButton?.callback,
            "function"
        );


        const form = {
            elements: {
                "stunt.vigorDamage.quantity": {
                    value:
                        "1"
                },

                "stunt.spiritDamage.quantity": {
                    value:
                        "0"
                },

                "stunt.swapInitiative.selected": {
                    checked:
                        true
                },

                "stunt.disarm.selected": {
                    checked:
                        true
                },

                "stunt.knockdown.selected": {
                    checked:
                        false
                }
            }
        };


        const button = {
            form
        };


        let closeCalls =
            0;


        const currentDialog = {
            async close() {

                closeCalls +=
                    1;

            }
        };


        const callbackResult =
            await confirmButton.callback(
                null,
                button,
                currentDialog
            );


        const result =
            await resultPromise;


        const expectedAllocation = {
            vigorDamage:
                1,

            spiritDamage:
                0,

            swapInitiative:
                true,

            disarm:
                true,

            knockdown:
                false
        };


        assert.deepEqual(
            callbackResult,
            expectedAllocation
        );


        assert.deepEqual(
            result,
            expectedAllocation
        );


        assert.equal(
            closeCalls,
            1
        );

    }
);

test(
    "RangedStuntDialog retourne l'allocation choisie pour le pipeline ranged",
    async () => {

        const {
            RangedStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/ranged-stunt-dialog.mjs"
            );


        const rollResult = {
            successes:
                3
        };


        const allocation = {
            vigorDamage:
                1,

            spiritDamage:
                0,

            swapInitiative:
                true,

            disarm:
                false,

            knockdown:
                false
        };


        const dialog = {

            async prompt({
                extraSuccesses,
                definitions
            }) {

                assert.equal(
                    extraSuccesses,
                    2
                );


                assert.equal(
                    Array.isArray(
                        definitions
                    ),
                    true
                );


                return allocation;

            }

        };


        const result =
            await RangedStuntDialog.chooseAllocation({
                rollResult,
                dialog
            });


        assert.deepEqual(
            result,
            allocation
        );

    }
);

test(
    "RangedStuntDialog.chooseAllocation retourne une allocation vide sans ouvrir le dialogue lorsqu'il n'y a aucune réussite excédentaire",
    async () => {

        const {
            RangedStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/ranged-stunt-dialog.mjs"
            );


        let dialogCalls =
            0;


        const dialog = {

            async prompt() {

                dialogCalls +=
                    1;


                return {
                    vigorDamage:
                        1
                };

            }

        };


        const result =
            await RangedStuntDialog.chooseAllocation({
                rollResult: {
                    successes:
                        1
                },

                dialog
            });


        assert.deepEqual(
            result,
            {}
        );


        assert.equal(
            dialogCalls,
            0
        );

    }
);


test(
    "RangedStuntDialog.chooseAllocation retourne null lorsque le choix est annulé",
    async () => {

        const {
            RangedStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/ranged-stunt-dialog.mjs"
            );


        const rollResult = {
            successes:
                2
        };


        let dialogCalls =
            0;


        const dialog = {

            async prompt({
                extraSuccesses,
                definitions
            }) {

                dialogCalls +=
                    1;


                assert.equal(
                    extraSuccesses,
                    1
                );


                assert.equal(
                    Array.isArray(
                        definitions
                    ),
                    true
                );


                return null;

            }

        };


        const result =
            await RangedStuntDialog.chooseAllocation({
                rollResult,
                dialog
            });


        assert.equal(
            result,
            null
        );


        assert.equal(
            dialogCalls,
            1
        );

    }
);


