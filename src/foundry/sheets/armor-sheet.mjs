import { MetroItemSheet }
    from "./metro-item-sheet.mjs";

import {
    isWeaponModApplicableToItemType,
    canAttachWeaponModToItem
} from "../../domain/rules/weapon-mod.mjs";


/**
 * Fiche d'une protection (armure ou casque) Métro 2033.
 *
 * La fiche :
 *
 * - expose les données du DataModel ;
 * - prépare les informations dérivées nécessaires à l'UI
 *   (état de la Protection, Résilience active) ;
 * - ne contient aucune logique de réparation ;
 * - ne modifie pas les règles métier.
 *
 * La réparation d'une protection (resolveArmorRepair /
 * Actor.repairArmor) existe déjà côté domaine, mais n'est
 * pour l'instant déclenchée par aucune interface — comme
 * pour l'équipement. Cette fiche se contente d'afficher
 * l'état courant de la Protection.
 */
export class ArmorSheet
    extends MetroItemSheet {


    static DEFAULT_OPTIONS = {

        ...super.DEFAULT_OPTIONS,

        classes: [
            ...(super.DEFAULT_OPTIONS.classes ?? []),
            "metro-armor-sheet"
        ],

        position: {
            width: 620,
            height: 720
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
                "systems/metro-2033-yze/templates/items/armor-sheet.hbs"
        }

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
            // ÉTAT DÉRIVÉ
            // ====================================================

            protectionState:
                this._getProtectionState(
                    system
                ),


            // ====================================================
            // CHOIX
            // ====================================================

            categoryChoices:
                this._getCategoryChoices(
                    system.category
                ),

            encumbranceChoices:
                this._getEncumbranceChoices(
                    system.weight
                ),


            // ====================================================
            // AMÉLIORATIONS D'ÉQUIPEMENT ATTACHÉES
            // ====================================================

            attachedWeaponMods:
                this._getAttachedWeaponMods()

        };

    }


    /**
     * Liste, pour affichage seulement, les Items weaponMod de
     * l'Actor de cette protection actuellement attachés à elle
     * (system.attachedItemUuid === this.item.uuid).
     *
     * Cette méthode ne modifie jamais aucun Document : elle ne
     * fait que lire les Items déjà embarqués dans l'Actor.
     */
    _getAttachedWeaponMods() {

        const actor =
            this.item.actor;


        if (!actor) {
            return [];
        }


        return Array.from(
            actor.items ?? []
        )
            .filter(
                item =>
                    item.type === "weaponMod"
                    && item.system?.attachedItemUuid
                        === this.item.uuid
            )
            .map(
                item => ({

                    id:
                        item.id,

                    name:
                        item.name,

                    img:
                        item.img,

                    description:
                        item.system?.description
                        ?? ""

                })
            );

    }


    /**
     * Transforme l'état métier du DataModel
     * en informations directement affichables.
     *
     * Une protection peut être :
     *
     * - "broken" : Protection actuelle à 0
     *   (hors d'usage, mais réparable) ;
     * - "damaged" : Protection actuelle < Protection max ;
     * - "good" : Protection actuelle == Protection max.
     *
     * La Résilience est signalée séparément, active
     * uniquement si la protection est équipée, possède
     * le trait, et n'est pas tombée à 0.
     */
    _getProtectionState(
        system
    ) {

        const current =
            Number(
                system.protection?.current
                ?? 0
            );

        const max =
            Number(
                system.protection?.max
                ?? 0
            );


        const broken =
            max > 0
            && current <= 0;

        const damaged =
            !broken
            && current < max;


        const stateId =
            broken
                ? "broken"
                : damaged
                    ? "damaged"
                    : "good";


        const stateLabel =
            broken
                ? "Hors d'usage"
                : damaged
                    ? "Endommagée"
                    : "Bon état";


        const activeResilience =
            system.equipped === true
            && system.resilience === true
            && system.resilienceLost !== true
            && current > 0;


        return {

            id:
                stateId,

            label:
                stateLabel,

            broken,

            damaged,

            activeResilience

        };

    }


    /**
     * Catégories de protection disponibles.
     */
    _getCategoryChoices(
        currentValue
    ) {

        const values = [

            {
                value: "body",
                label: "Corps"
            },

            {
                value: "helmet",
                label: "Casque"
            }

        ];


        return values.map(
            choice => ({

                ...choice,

                selected:
                    currentValue
                    === choice.value

            })
        );

    }


    /**
     * Valeurs d'encombrement autorisées.
     *
     * Les protections ne comptent normalement pas dans
     * l'équipement transporté (encombrement 0), mais
     * certaines exceptions (tenue antiémeute) en possèdent.
     *
     * L'utilisateur voit les fractions,
     * mais le DataModel stocke les valeurs numériques.
     */
    _getEncumbranceChoices(
        currentValue
    ) {

        const values = [

            {
                value: 0,
                label: "Minuscule (0)"
            },

            {
                value: 0.25,
                label: "Très léger (1/4)"
            },

            {
                value: 0.5,
                label: "Léger (1/2)"
            },

            {
                value: 1,
                label: "Standard (1)"
            },

            {
                value: 2,
                label: "Lourd (2)"
            },

            {
                value: 3,
                label: "Très lourd (3)"
            }

        ];


        return values.map(
            choice => ({

                ...choice,

                selected:
                    Number(
                        currentValue
                    )
                    === choice.value

            })
        );

    }


    /**
     * Active les interactions propres à cette fiche
     * après chaque rendu (détachement d'une Amélioration
     * d'équipement attachée).
     */
    _onRender(
        context,
        options
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


        root
            .querySelectorAll(
                "[data-action='detach-weapon-mod']"
            )
            .forEach(
                element => {

                    element.addEventListener(
                        "click",
                        event => {

                            event.preventDefault();
                            event.stopPropagation();

                            const weaponModId =
                                event.currentTarget
                                    .dataset
                                    .weaponModId;

                            void this._detachWeaponMod(
                                weaponModId
                            );

                        }
                    );

                }
            );

    }


    /**
     * Détache un Item weaponMod de cette protection, depuis
     * l'ArmorSheet.
     *
     * Seul le weaponMod (system.attachedItemUuid) est modifié.
     * L'Item weaponMod n'est jamais supprimé.
     */
    async _detachWeaponMod(
        weaponModId
    ) {

        const actor =
            this.item.actor;


        const weaponMod =
            actor?.items.get(
                weaponModId
            )
            ?? null;


        if (!weaponMod) {

            ui.notifications.warn(
                "Cette Amélioration d'équipement est introuvable."
            );

            return;

        }


        try {

            await weaponMod.update({

                "system.attachedItemUuid":
                    ""

            });


            ui.notifications.info(
                `${weaponMod.name} n'est plus attachée à ${this.item.name}.`
            );


            await this.render();

        }
        catch (error) {

            console.error(
                "Métro 2033 | Impossible de détacher cette Amélioration d'équipement.",
                {
                    armor:
                        this.item,
                    weaponMod,
                    error
                }
            );


            ui.notifications.error(
                "Impossible de détacher cette Amélioration d'équipement."
            );

        }

    }


    /**
     * Intercepte le dépôt d'un Document sur l'ArmorSheet.
     *
     * Seule une Amélioration d'équipement (weaponMod) est
     * acceptée : elle s'attache à cette protection, sous réserve
     * de compatibilité et de quota (cf. `_onDropWeaponMod`).
     *
     * Cette opération ne modifie jamais la protection elle-même :
     * c'est toujours l'Item weaponMod déposé qui est mis à jour
     * (system.attachedItemUuid).
     */
    async _onDropDocument(
        event,
        document
    ) {

        if (!this.isEditable) {
            return null;
        }


        if (
            !document
            || document.documentName !== "Item"
            || document.type !== "weaponMod"
        ) {

            ui.notifications.warn(
                "Seul un Item Amélioration d'équipement peut être associé à une protection."
            );

            return null;

        }


        return this._onDropWeaponMod(
            document
        );

    }


    /**
     * Attache un Item weaponMod déposé à cette protection.
     *
     * C'est le weaponMod déposé qui est mis à jour
     * (system.attachedItemUuid), jamais la protection elle-même :
     * la protection ne porte aucune référence inverse vers ses
     * Améliorations d'équipement attachées.
     *
     * L'attachement est réservé au niveau Acteur :
     *
     * - la protection doit déjà être assignée à un Acteur ;
     * - le weaponMod déposé doit appartenir à ce même Acteur ;
     * - le weaponMod doit déclarer "armor" dans
     *   system.applicableTypes ;
     * - cette protection doit disposer d'au moins un emplacement
     *   d'Amélioration (system.weaponModSlots > 0) ;
     * - le nombre d'AUTRES weaponMods déjà attachés à cette
     *   protection précise ne doit pas avoir atteint ce quota.
     *
     * Un weaponMod déjà attaché à cette protection (réattachement)
     * est exclu du décompte du quota : l'opération reste
     * idempotente.
     */
    async _onDropWeaponMod(
        weaponMod
    ) {

        const actor =
            this.item.actor;


        if (!actor) {

            ui.notifications.warn(
                "Cette protection doit d'abord être assignée à un Acteur avant d'y attacher une Amélioration d'équipement."
            );

            return null;

        }


        if (
            weaponMod.actor?.id
            !== actor.id
        ) {

            ui.notifications.warn(
                "Cette Amélioration d'équipement doit appartenir au même Acteur que la protection."
            );

            return null;

        }


        if (
            !isWeaponModApplicableToItemType({

                applicableTypes:
                    weaponMod.system?.applicableTypes,

                itemType:
                    "armor"

            })
        ) {

            ui.notifications.warn(
                "Cette Amélioration d'équipement ne peut pas être attachée à une protection."
            );

            return null;

        }


        const weaponModSlots =
            Number(
                this.item.system?.weaponModSlots
                ?? 0
            );


        if (weaponModSlots === 0) {

            ui.notifications.warn(
                "Cette protection ne dispose d'aucun emplacement d'Amélioration configuré."
            );

            return null;

        }


        const currentlyAttachedCount =
            Array.from(
                actor.items ?? []
            )
                .filter(
                    item =>
                        item.type === "weaponMod"
                        && item.id !== weaponMod.id
                        && item.system?.attachedItemUuid
                            === this.item.uuid
                )
                .length;


        if (
            !canAttachWeaponModToItem({
                currentlyAttachedCount,
                weaponModSlots
            })
        ) {

            ui.notifications.warn(
                `Nombre maximum d'Améliorations atteint pour cette protection (${weaponModSlots}).`
            );

            return null;

        }


        try {

            await weaponMod.update({

                "system.attachedItemUuid":
                    this.item.uuid

            });


            ui.notifications.info(
                `${weaponMod.name} est maintenant attachée à ${this.item.name}.`
            );


            await this.render();


            return weaponMod;

        }
        catch (error) {

            console.error(
                "Métro 2033 | Impossible d'attacher cette Amélioration d'équipement.",
                {
                    armor:
                        this.item,

                    weaponMod,

                    error
                }
            );


            ui.notifications.error(
                "Impossible d'attacher cette Amélioration d'équipement à cette protection."
            );


            return null;

        }

    }

}
