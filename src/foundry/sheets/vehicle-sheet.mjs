import {
    MetroActorSheet
} from "./metro-actor-sheet.mjs";


/**
 * Fiche Actor d'un Véhicule.
 *
 * Premier jalon du chantier Véhicule (cf.
 * src/data/actors/vehicle-model.mjs) : DataModel + Sheet +
 * RollTable « Véhicules hors d'état ». Les actions dédiées
 * (Démarrer le moteur, Conduire/piloter, Entrer/sortir d'un
 * véhicule) restent purement narrées dans ce jalon, sans
 * bouton dédié. Les modificateurs de combat liés aux
 * véhicules sont explicitement hors scope.
 *
 * Occupants : il n'existe pas encore, dans ce projet, de
 * patron de drag&drop d'Actor vers un champ UUID (la Station
 * laisse `notableNPCs` non lié à ce jour). Cette fiche
 * implémente donc une dropzone autonome, propre au Véhicule :
 * `_onRender()` écoute `dragover`/`drop` sur
 * `.metro-vehicle-occupant-dropzone` et met à jour
 * `system.occupants.driver` / `system.occupants.passengers`
 * via `actor.update()`. La résolution des noms d'occupants
 * (UUID → nom) se fait de façon asynchrone dans
 * `_prepareContext()`, par cohérence avec les autres champs
 * de référence du système (ex : Station → Faction).
 */
export class VehicleSheet extends MetroActorSheet {

    static DEFAULT_OPTIONS = {

        classes: [
            "metro-2033",
            "metro-actor-sheet",
            "metro-vehicle-sheet"
        ],

        position: {
            width: 560,
            height: 640
        }
    };


    static PARTS = {

        main: {
            template:
                "systems/metro-2033-yze/templates/actors/vehicle-sheet.hbs"
        }

    };


    async _prepareContext(
        options
    ) {

        const context =
            await super._prepareContext(
                options
            );

        const actor =
            this.actor;

        const system =
            actor.system;


        context.actor =
            actor;

        context.system =
            system;

        context.editable =
            this.isEditable;

        context.isGM =
            game.user.isGM === true;


        context.driver =
            await this._resolveOccupant(
                system.occupants.driver
            );

        context.passengers =
            await Promise.all(
                system.occupants.passengers.map(
                    uuid => this._resolveOccupant(uuid)
                )
            );


        return context;

    }


    /**
     * Résout un UUID d'Actor occupant en un ViewModel minimal
     * {uuid, name}, affichable même si l'Actor référencé est
     * introuvable (supprimé, dans un monde différent...).
     */
    async _resolveOccupant(
        uuid
    ) {

        if (!uuid) {
            return null;
        }

        const resolved =
            await fromUuid(
                uuid
            );

        return {

            uuid,

            name:
                resolved?.name
                ?? "(Acteur introuvable)"

        };

    }


    async _onRender(
        context,
        options
    ) {

        await super._onRender(
            context,
            options
        );


        this.element
            .querySelectorAll(
                ".metro-vehicle-occupant-dropzone"
            )
            .forEach(
                element => {

                    element.addEventListener(
                        "dragover",
                        event => {
                            event.preventDefault();
                        }
                    );

                    element.addEventListener(
                        "drop",
                        event => this._onDropOccupant(
                            event,
                            element.dataset.occupantRole
                        )
                    );

                }
            );


        this.element
            .querySelectorAll(
                "[data-action='remove-occupant']"
            )
            .forEach(
                element => {

                    element.addEventListener(
                        "click",
                        () => this._onRemoveOccupant(
                            element.dataset.occupantRole,
                            element.dataset.occupantUuid
                        )
                    );

                }
            );

    }


    /**
     * Gère le drop d'un Actor sur la dropzone du conducteur ou
     * sur celle des passagers.
     */
    async _onDropOccupant(
        event,
        role
    ) {

        event.preventDefault();

        if (!this.isEditable) {
            return;
        }

        const data =
            foundry.applications.ux.TextEditor.implementation
                .getDragEventData(event);

        if (data?.type !== "Actor" || !data.uuid) {
            return;
        }


        if (role === "driver") {

            await this.actor.update(
                {
                    "system.occupants.driver": data.uuid
                }
            );

            return;

        }

        if (role === "passenger") {

            const passengers =
                this.actor.system.occupants.passengers;

            if (passengers.includes(data.uuid)) {
                return;
            }

            await this.actor.update(
                {
                    "system.occupants.passengers":
                        [...passengers, data.uuid]
                }
            );

        }

    }


    /**
     * Retire un occupant (conducteur ou passager désigné)
     * du véhicule.
     */
    async _onRemoveOccupant(
        role,
        uuid
    ) {

        if (!this.isEditable) {
            return;
        }

        if (role === "driver") {

            await this.actor.update(
                {
                    "system.occupants.driver": ""
                }
            );

            return;

        }

        if (role === "passenger") {

            const passengers =
                this.actor.system.occupants.passengers
                    .filter(
                        passengerUuid =>
                            passengerUuid !== uuid
                    );

            await this.actor.update(
                {
                    "system.occupants.passengers": passengers
                }
            );

        }

    }

}
