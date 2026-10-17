import { MetroItemSheet }
    from "./metro-item-sheet.mjs";

import { StationPopulationLauncherApplication }
    from "../applications/station-population-launcher-application.mjs";


/**
 * Fiche d'une Station Métro 2033.
 *
 * La fiche :
 *
 * - expose les données du DataModel ;
 * - permet d'ajouter / retirer des lignes dans les listes
 *   (connexions, PNJ notables) ;
 * - ne contient aucune règle métier.
 *
 * Les listes (connections, notableNPCs) sont éditées via
 * des boutons "Ajouter" / "Retirer" qui mettent à jour
 * l'Item directement (indépendamment de la soumission
 * du formulaire, déjà automatique grâce à submitOnChange).
 */
export class StationSheet
    extends MetroItemSheet {


    static DEFAULT_OPTIONS = {

        ...super.DEFAULT_OPTIONS,

        classes: [
            ...(super.DEFAULT_OPTIONS.classes ?? []),
            "metro-station-sheet"
        ],

        position: {
            width: 680,
            height: 780
        },

        form: {

            ...(super.DEFAULT_OPTIONS.form ?? {}),

            closeOnSubmit:
                false,

            submitOnChange:
                true

        }

    };


    static PARTS = {

        form: {
            template:
                "systems/metro-2033-yze/templates/items/station-sheet.hbs"
        }

    };


    /**
     * Ligne vide ajoutée par le bouton "Ajouter"
     * de chaque liste.
     */
    static EMPTY_ROWS = {

        connections: () => ({
            station: "",
            dangerLevel: "",
            description: ""
        }),

        notableNPCs: () => ({
            actor: "",
            role: ""
        })

    };


    /**
     * Prépare les données nécessaires au template.
     */
    async _prepareContext(
        options
    ) {

        const context =
            await super._prepareContext(
                options
            );


        const system =
            this.item.system;


        return {

            ...context,


            // ====================================================
            // DOCUMENT
            // ====================================================

            item:
                this.item,

            system,


            // ====================================================
            // PERMISSIONS
            // ====================================================

            isGM:
                game.user.isGM,


            // ====================================================
            // CHOIX
            // ====================================================

            statusChoices:
                this._getStatusChoices(),

            dangerLevelChoices:
                this._getDangerLevelChoices(),


            // ====================================================
            // POPULATION / RESSOURCES
            // ====================================================

            resourceRows:
                this._prepareResourceRows(
                    system
                ),


            // ====================================================
            // LISTES
            // ====================================================

            connections:
                await this._prepareListRows(
                    system.connections
                ),

            notableNPCs:
                await this._prepareListRows(
                    system.notableNPCs
                )

        };

    }


    /**
     * Construit les lignes du tableau Ressources / Personnel
     * de soutien à partir des jauges du DataModel.
     *
     * Règles p.218-219 : chaque ressource dispose d'un
     * personnel de soutien dédié.
     */
    _prepareResourceRows(
        system
    ) {

        const definitions = [

            {
                key: "water",
                label: "Eau",
                supportLabel: "Prospecteur"
            },

            {
                key: "food",
                label: "Nourriture",
                supportLabel: "Cultivateur-éleveur"
            },

            {
                key: "equipment",
                label: "Équipement",
                supportLabel: "Ingénieur"
            },

            {
                key: "energy",
                label: "Énergie",
                supportLabel: "Technicien"
            },

            {
                key: "medicine",
                label: "Médicaments",
                supportLabel: "Docteur"
            }

        ];


        return definitions.map(
            definition => ({

                ...definition,

                level:
                    Number(
                        system.resources?.[definition.key]
                        ?? 0
                    ),

                supportPersonnel:
                    Number(
                        system.supportPersonnel?.[definition.key]
                        ?? 0
                    )

            })
        );

    }


    /**
     * Ajoute l'index de chaque ligne, nécessaire pour
     * construire les attributs "name" indexés du formulaire
     * (system.<liste>.<index>.<champ>) et pour cibler la
     * bonne ligne lors d'une suppression.
     *
     * Résout également, pour les lignes qui possèdent un
     * champ `actor` (PNJ notables), l'UUID d'Acteur en un nom
     * affichable (`resolvedActorName`), par cohérence avec le
     * pattern déjà en place pour les occupants de Véhicule.
     * `resolvedActorName` reste `null` tant qu'aucun Acteur
     * n'est lié, et vaut "(Acteur introuvable)" si l'UUID ne
     * résout plus rien (Acteur supprimé...).
     */
    async _prepareListRows(
        rows
    ) {

        return Promise.all(
            (rows ?? []).map(
                async (row, index) => {

                    let resolvedActorName =
                        null;

                    if (row.actor) {

                        const resolved =
                            await fromUuid(
                                row.actor
                            );

                        resolvedActorName =
                            resolved?.name
                            ?? "(Acteur introuvable)";

                    }

                    return {
                        ...row,
                        index,
                        resolvedActorName
                    };

                }
            )
        );

    }


    /**
     * Suggestions d'état courantes.
     *
     * Champ texte libre : ces valeurs ne sont que des
     * suggestions, toute autre valeur reste acceptée.
     */
    _getStatusChoices() {

        return [
            "Prospère",
            "En guerre",
            "Abandonnée",
            "Contaminée"
        ];

    }


    /**
     * Suggestions de niveau de danger courantes
     * pour une connexion vers une Station voisine.
     */
    _getDangerLevelChoices() {

        return [
            "Sûr",
            "Risqué",
            "Mortel"
        ];

    }


    /**
     * Active les interactions propres à la fiche
     * de Station : ajout / retrait de lignes dans
     * les listes.
     */
    _onRender(
        context, options
    ) {

        super._onRender(
            context,
            options
        );


        const root =
            this.element;


        if (!root) {
            return;
        }


        root.querySelectorAll(
            "[data-action='addListRow']"
        ).forEach(
            button => button.addEventListener(
                "click",
                () => this._addListRow(
                    button.dataset.list
                )
            )
        );


        root.querySelectorAll(
            "[data-action='removeListRow']"
        ).forEach(
            button => button.addEventListener(
                "click",
                () => this._removeListRow(
                    button.dataset.list,
                    Number(button.dataset.index)
                )
            )
        );


        root.querySelectorAll(
            "[data-action='open-station-population-launcher']"
        ).forEach(
            button => button.addEventListener(
                "click",
                () => this._openPopulationLauncher()
            )
        );


        root.querySelectorAll(
            ".metro-list-actor-dropzone"
        ).forEach(
            element => {

                element.addEventListener(
                    "dragover",
                    event => {
                        event.preventDefault();
                    }
                );

                element.addEventListener(
                    "drop",
                    event => this._onDropListActor(
                        event,
                        element.dataset.list,
                        Number(element.dataset.index)
                    )
                );

            }
        );


        root.querySelectorAll(
            "[data-action='unlink-list-actor']"
        ).forEach(
            button => button.addEventListener(
                "click",
                () => this._onUnlinkListActor(
                    button.dataset.list,
                    Number(button.dataset.index)
                )
            )
        );

    }


    /**
     * Gère le drop d'un Acteur (sidebar ou Token) sur la
     * dropzone d'une ligne de liste (PNJ notables), et lie
     * son UUID au champ `actor` de cette ligne.
     */
    async _onDropListActor(
        event, listName, index
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

        await this.item.update({
            [`system.${listName}.${index}.actor`]: data.uuid
        });

    }


    /**
     * Délie l'Acteur d'une ligne de liste sans supprimer la
     * ligne (le `role` éventuellement déjà saisi est
     * conservé).
     */
    async _onUnlinkListActor(
        listName, index
    ) {

        if (!this.isEditable) {
            return;
        }

        await this.item.update({
            [`system.${listName}.${index}.actor`]: ""
        });

    }


    /**
     * Ouvre la fenêtre de lancement du Jet de Population
     * hebdomadaire pour cet Item Station.
     */
    _openPopulationLauncher() {

        new StationPopulationLauncherApplication(
            this.item
        ).render({ force: true });

    }


    /**
     * Ajoute une ligne vide à la liste désignée.
     */
    async _addListRow(
        listName
    ) {

        const factory =
            this.constructor.EMPTY_ROWS[listName];


        if (!factory) {
            return;
        }


        const current =
            foundry.utils.deepClone(
                this.item.system[listName]
                ?? []
            );

        current.push(
            factory()
        );

        await this.item.update({
            [`system.${listName}`]: current
        });

    }


    /**
     * Retire une ligne de la liste désignée.
     */
    async _removeListRow(
        listName, index
    ) {

        const current =
            foundry.utils.deepClone(
                this.item.system[listName]
                ?? []
            );


        if (
            index < 0
            || index >= current.length
        ) {
            return;
        }


        current.splice(index, 1);

        await this.item.update({
            [`system.${listName}`]: current
        });

    }

}
