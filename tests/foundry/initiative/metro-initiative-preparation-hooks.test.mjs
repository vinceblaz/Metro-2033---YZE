import test from "node:test";
import assert from "node:assert/strict";


/*
 * InitiativePreparationApplication étend
 * une classe Foundry au niveau de sa
 * déclaration (HandlebarsApplicationMixin
 * (ApplicationV2)), comme les autres
 * ActorSheets/ItemSheets du projet.
 *
 * Un stub minimal est donc nécessaire
 * avant tout import du module de hooks,
 * qui importe transitivement la fenêtre.
 *
 * Ce stub ne cherche pas à simuler le
 * rendu réel de Foundry : il permet
 * seulement à la classe de se déclarer et
 * de s'instancier sans erreur, afin de
 * tester le câblage des hooks lui-même.
 */
class StubApplicationV2 {

    constructor(
        options = {}
    ) {

        this.options =
            options;

        this.rendered =
            false;

    }

    render() {

        this.rendered =
            true;


        return this;

    }

    bringToFront() {}

}


function HandlebarsApplicationMixinStub(
    Base
) {

    return Base;

}


globalThis.foundry = {

    applications: {

        api: {

            ApplicationV2:
                StubApplicationV2,

            HandlebarsApplicationMixin:
                HandlebarsApplicationMixinStub

        }

    },

    utils: {

        escapeHTML(
            value
        ) {

            return String(
                value ?? ""
            );

        }

    }

};


test(
    "registerInitiativePreparationHooks expose openInitiativePreparation et enregistre renderCombatTracker",
    async () => {

        const {
            registerInitiativePreparationHooks
        } =
            await import(
                "../../../src/foundry/initiative/metro-initiative-preparation-hooks.mjs"
            );


        const registeredHooks =
            [];


        globalThis.Hooks = {

            on(
                hookName,
                callback
            ) {

                registeredHooks.push({
                    hookName,
                    callback
                });


                return callback;

            }

        };


        globalThis.game = {};


        registerInitiativePreparationHooks();


        assert.equal(
            typeof game.metro2033
                ?.openInitiativePreparation,
            "function"
        );


        assert.ok(
            registeredHooks.some(
                entry =>
                    entry.hookName
                    === "renderCombatTracker"
            )
        );

    }
);


test(
    "openInitiativePreparation avertit et ne crée rien lorsqu'aucun Combat n'est actif",
    async () => {

        const {
            openInitiativePreparation
        } =
            await import(
                "../../../src/foundry/initiative/metro-initiative-preparation-hooks.mjs"
            );


        const warnings =
            [];


        globalThis.game = {
            combat:
                null
        };

        globalThis.ui = {

            notifications: {

                warn(
                    message
                ) {

                    warnings.push(
                        message
                    );

                }

            }

        };


        const result =
            openInitiativePreparation();


        assert.equal(
            result,
            null
        );

        assert.equal(
            warnings.length,
            1
        );

    }
);


test(
    "openInitiativePreparation crée et rend la fenêtre lorsqu'un Combat est fourni",
    async () => {

        const {
            openInitiativePreparation
        } =
            await import(
                "../../../src/foundry/initiative/metro-initiative-preparation-hooks.mjs"
            );


        globalThis.ui = {

            notifications: {
                warn() {}
            }

        };


        const combat = {
            id:
                "combat-1"
        };


        const application =
            openInitiativePreparation({
                combat
            });


        assert.ok(
            application
            instanceof
                StubApplicationV2
        );

        assert.equal(
            application.rendered,
            true
        );

        assert.equal(
            application.combat,
            combat
        );

    }
);


test(
    "injectCombatTrackerButton ignore silencieusement une structure DOM inattendue",
    async () => {

        const {
            registerInitiativePreparationHooks
        } =
            await import(
                "../../../src/foundry/initiative/metro-initiative-preparation-hooks.mjs"
            );


        let capturedCallback =
            null;


        globalThis.Hooks = {

            on(
                hookName,
                callback
            ) {

                if (
                    hookName
                    === "renderCombatTracker"
                ) {

                    capturedCallback =
                        callback;

                }


                return callback;

            }

        };


        globalThis.game = {};


        registerInitiativePreparationHooks();


        assert.doesNotThrow(
            () =>
                capturedCallback(
                    {},
                    null
                )
        );

    }
);
