import test from "node:test";
import assert from "node:assert/strict";


test(
    "MeleeBlockStuntDialog expose les trois actions d'éclat de blocage",
    async () => {

        const {
            MeleeBlockStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/melee-block-stunt-dialog.mjs"
            );


        const definitions =
            MeleeBlockStuntDialog.getAvailableStunts();


        assert.deepEqual(
            definitions.map(
                definition =>
                    definition.key
            ),
            [
                "cancel-success",
                "counter-attack",
                "disarm"
            ]
        );

    }
);


test(
    "MeleeBlockStuntDialog.prompt retourne directement une résolution vide sans réussite de blocage",
    async () => {

        const {
            MeleeBlockStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/melee-block-stunt-dialog.mjs"
            );


        const result =
            await MeleeBlockStuntDialog.prompt({
                blockSuccesses:
                    0
            });


        assert.equal(
            result.available,
            0
        );

        assert.equal(
            result.spent,
            0
        );

        assert.deepEqual(
            result.effects,
            {
                cancelledSuccesses:
                    0,

                counterAttack:
                    false,

                disarm:
                    false
            }
        );

    }
);


test(
    "MeleeBlockStuntDialog.prompt sollicite le dialogue lorsque des réussites de blocage sont disponibles",
    async () => {

        const {
            MeleeBlockStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/melee-block-stunt-dialog.mjs"
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


        const result =
            await MeleeBlockStuntDialog.prompt({
                blockSuccesses:
                    2,

                dialog
            });


        assert.equal(
            calls.length,
            1
        );

        assert.equal(
            calls[0].blockSuccesses,
            2
        );

        assert.equal(
            result,
            null
        );

    }
);


test(
    "MeleeBlockStuntDialog.prompt résout l'allocation retournée par le dialogue",
    async () => {

        const {
            MeleeBlockStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/melee-block-stunt-dialog.mjs"
            );


        const dialog = {
            async prompt() {

                return [

                    {
                        key:
                            "counter-attack",

                        quantity:
                            1
                    },

                    {
                        key:
                            "cancel-success",

                        quantity:
                            1
                    }

                ];

            }
        };


        const result =
            await MeleeBlockStuntDialog.prompt({
                blockSuccesses:
                    2,

                dialog
            });


        assert.equal(
            result.spent,
            2
        );

        assert.equal(
            result.effects.counterAttack,
            true
        );

        assert.equal(
            result.effects.cancelledSuccesses,
            1
        );

    }
);


test(
    "MeleeBlockStuntDialog.prompt laisse le domaine refuser une allocation trop dépensière",
    async () => {

        const {
            MeleeBlockStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/melee-block-stunt-dialog.mjs"
            );


        const dialog = {
            async prompt() {

                return [

                    {
                        key:
                            "counter-attack",

                        quantity:
                            2
                    }

                ];

            }
        };


        await assert.rejects(
            () =>
                MeleeBlockStuntDialog.prompt({
                    blockSuccesses:
                        1,

                    dialog
                }),
            /qu'une seule fois/
        );

    }
);


test(
    "MeleeBlockStuntDialog.chooseAllocation retourne une allocation vide sans ouvrir le dialogue lorsqu'il n'y a aucune réussite",
    async () => {

        const {
            MeleeBlockStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/melee-block-stunt-dialog.mjs"
            );


        let dialogCalls =
            0;


        const dialog = {
            async prompt() {

                dialogCalls +=
                    1;


                return [];

            }
        };


        const result =
            await MeleeBlockStuntDialog.chooseAllocation({
                blockSuccesses:
                    0,

                dialog
            });


        assert.deepEqual(
            result,
            []
        );

        assert.equal(
            dialogCalls,
            0
        );

    }
);


test(
    "MeleeBlockStuntDialog.chooseAllocation retourne null lorsque le choix est annulé",
    async () => {

        const {
            MeleeBlockStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/melee-block-stunt-dialog.mjs"
            );


        const dialog = {
            async prompt() {

                return null;

            }
        };


        const result =
            await MeleeBlockStuntDialog.chooseAllocation({
                blockSuccesses:
                    2,

                dialog
            });


        assert.equal(
            result,
            null
        );

    }
);


test(
    "FoundryMeleeBlockStuntDialog génère le contenu des actions répétables et uniques",
    async () => {

        const {
            FoundryMeleeBlockStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/melee-block-stunt-dialog.mjs"
            );


        const definitions = [

            {
                key:
                    "cancel-success",

                label:
                    "Annuler une réussite de l'attaquant",

                repeatable:
                    true
            },

            {
                key:
                    "disarm",

                label:
                    "Désarmer l'attaquant",

                repeatable:
                    false
            }

        ];


        const content =
            FoundryMeleeBlockStuntDialog.createContent({
                blockSuccesses:
                    2,

                definitions
            });


        assert.match(
            content,
            /Réussites de blocage disponibles/
        );


        assert.match(
            content,
            />\s*2\s*</
        );


        assert.match(
            content,
            /Annuler une réussite de l&#039;attaquant/
        );


        assert.match(
            content,
            /name="blockStunt\.cancel-success\.quantity"/
        );


        assert.match(
            content,
            /Désarmer l&#039;attaquant/
        );


        assert.match(
            content,
            /name="blockStunt\.disarm\.selected"/
        );

    }
);


test(
    "FoundryMeleeBlockStuntDialog échappe les identifiants et libellés injectés dans le HTML",
    async () => {

        const {
            FoundryMeleeBlockStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/melee-block-stunt-dialog.mjs"
            );


        const definitions = [

            {
                key:
                    'danger" onclick="attack',

                label:
                    '<script>alert("metro")</script>',

                repeatable:
                    false
            }

        ];


        const content =
            FoundryMeleeBlockStuntDialog.createContent({
                blockSuccesses:
                    1,

                definitions
            });


        assert.doesNotMatch(
            content,
            /<script>/
        );


        assert.match(
            content,
            /&lt;script&gt;alert\(&quot;metro&quot;\)&lt;\/script&gt;/
        );

    }
);


test(
    "FoundryMeleeBlockStuntDialog lit une allocation brute depuis le formulaire",
    async () => {

        const {
            FoundryMeleeBlockStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/melee-block-stunt-dialog.mjs"
            );


        const definitions = [

            {
                key:
                    "cancel-success",

                label:
                    "Annuler une réussite de l'attaquant",

                repeatable:
                    true
            },

            {
                key:
                    "counter-attack",

                label:
                    "Contre-attaquer",

                repeatable:
                    false
            },

            {
                key:
                    "disarm",

                label:
                    "Désarmer l'attaquant",

                repeatable:
                    false
            }

        ];


        const form = {
            elements: {

                "blockStunt.cancel-success.quantity": {
                    value:
                        "2"
                },

                "blockStunt.counter-attack.selected": {
                    checked:
                        true
                },

                "blockStunt.disarm.selected": {
                    checked:
                        false
                }

            }
        };


        const allocation =
            FoundryMeleeBlockStuntDialog.readAllocation({
                form,
                definitions
            });


        assert.deepEqual(
            allocation,
            [

                {
                    key:
                        "cancel-success",

                    quantity:
                        2
                },

                {
                    key:
                        "counter-attack",

                    quantity:
                        1
                },

                {
                    key:
                        "disarm",

                    quantity:
                        0
                }

            ]
        );

    }
);


test(
    "FoundryMeleeBlockStuntDialog construit et affiche le dialogue Foundry",
    async () => {

        const {
            FoundryMeleeBlockStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/melee-block-stunt-dialog.mjs"
            );


        const definitions = [

            {
                key:
                    "cancel-success",

                label:
                    "Annuler une réussite de l'attaquant",

                repeatable:
                    true
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
            FoundryMeleeBlockStuntDialog.prompt({
                blockSuccesses:
                    2,

                definitions,

                DialogV2Class:
                    FakeDialogV2
            });


        assert.equal(
            receivedOptions?.window?.title,
            "Éclats de blocage"
        );


        assert.equal(
            receivedOptions?.form?.closeOnSubmit,
            false
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


        void pending;

    }
);


test(
    "FoundryMeleeBlockStuntDialog retourne null et ferme le dialogue lors de l'annulation",
    async () => {

        const {
            FoundryMeleeBlockStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/melee-block-stunt-dialog.mjs"
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

        }


        const resultPromise =
            FoundryMeleeBlockStuntDialog.prompt({
                blockSuccesses:
                    1,

                definitions: [

                    {
                        key:
                            "disarm",

                        label:
                            "Désarmer l'attaquant",

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
                    button.action === "cancel"
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
    "FoundryMeleeBlockStuntDialog retourne l'allocation brute lors de la validation",
    async () => {

        const {
            FoundryMeleeBlockStuntDialog
        } =
            await import(
                "../../../src/foundry/applications/melee-block-stunt-dialog.mjs"
            );


        const definitions = [

            {
                key:
                    "counter-attack",

                label:
                    "Contre-attaquer",

                repeatable:
                    false
            },

            {
                key:
                    "disarm",

                label:
                    "Désarmer l'attaquant",

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
            FoundryMeleeBlockStuntDialog.prompt({
                blockSuccesses:
                    2,

                definitions,

                DialogV2Class:
                    FakeDialogV2
            });


        const confirmButton =
            receivedOptions.buttons.find(
                button =>
                    button.action === "confirm"
            );


        const form = {
            elements: {

                "blockStunt.counter-attack.selected": {
                    checked:
                        true
                },

                "blockStunt.disarm.selected": {
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


        const expectedAllocation = [

            {
                key:
                    "counter-attack",

                quantity:
                    1
            },

            {
                key:
                    "disarm",

                quantity:
                    0
            }

        ];


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
