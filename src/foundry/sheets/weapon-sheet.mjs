import { MetroItemSheet }
    from "./metro-item-sheet.mjs";

import { getPoisonEffectTypeChoices }
    from "../../domain/rules/poison.mjs";

import {
    isWeaponModApplicableToItemType,
    canAttachWeaponModToItem
} from "../../domain/rules/weapon-mod.mjs";


/**
 * Fiche d'une arme Métro 2033.
 *
 * Responsabilités :
 *
 * - présenter les données de l'Item weapon ;
 * - préparer les données dérivées utiles à l'interface ;
 * - exposer les informations nécessaires au template ;
 * - laisser les règles métier au DataModel et aux services.
 *
 * Aucune résolution d'attaque n'est implémentée ici.
 */
export class WeaponSheet
    extends MetroItemSheet {

    static DEFAULT_OPTIONS = {

        classes: [
            "metro-2033",
            "metro-item-sheet",
            "metro-weapon-sheet"
        ],

        position: {
            width: 620,
            height: 720
        },

        form: {
            ...(super.DEFAULT_OPTIONS.form ?? {}),
            closeOnSubmit: false,
            submitOnChange: true
        },

        window: {
            resizable: true
        }
    };


    static PARTS = {

        main: {
            template:
                "systems/metro-2033-yze/templates/items/weapon-sheet.hbs"
        }
    };


    /**
     * Prépare le contexte Handlebars de la WeaponSheet.
     */
    async _prepareContext(
        options
    ) {

        const context =
            await super._prepareContext(options);

        const system = this.item.system;

        context.item = this.item;
        context.system = system;

        context.editable =
            this.isEditable;

        context.isGM =
            game.user.isGM;


        // ========================================================
        // TYPE D'ARME
        // ========================================================

        context.weapon = {

            isMelee:
                system.category === "melee",

            isRanged:
                system.category === "ranged",

            requiresAmmunition:
                system.requiresAmmunition ?? false,

            magazineLoaded:
                system.magazineLoaded ?? false,

            canFire:
                system.canFire ?? false,

            canAttack:
                system.canAttack ?? false,

            broken:
                system.broken ?? false,

            damaged:
                system.damaged ?? false,

            destroyed:
                system.destroyed ?? false,

            permanentlyDamaged:
                system.permanentlyDamaged ?? false,

            usableEquipmentBonus:
                system.usableEquipmentBonus ?? 0,

            skillId:
                system.skillId ?? null,

            hasExplosion:
                system.hasExplosion ?? false
        };

        // ========================================================
        // CATÉGORIE MÉTIER DE L'ARME
        // ========================================================

        context.weaponCategoryChoices =
            this._getWeaponCategoryChoices(
                system.weaponCategory
            );        


        // ========================================================
        // MUNITIONS CHARGÉES
        // ========================================================

        context.loadedAmmunition = {

            quality:
                system.loadedAmmoQuality ?? null,

            protectionReduction:
                system.loadedProtectionReduction ?? 0,

            ignoresResilience:
                system.loadedAmmoIgnoresResilience ?? false
        };

        // ========================================================
        // MUNITION COMPATIBLE DE RÉFÉRENCE
        // ========================================================

        context.ammunitionReference =
            await this._prepareAmmunitionReference(
                system.ammunitionReferenceUuid
            );        

        // ========================================================
        // POIDS
        // ========================================================

        context.weightChoices =
            this._getWeightChoices(
                system.weight
            );


        // ========================================================
        // AMÉLIORATIONS D'ARME ATTACHÉES
        // ========================================================

        context.attachedWeaponMods =
            this._getAttachedWeaponMods();


        // ========================================================
        // POISON DE LAME — ARMES DE MÊLÉE UNIQUEMENT
        // ========================================================

        context.poisonedBlade =
            this._preparePoisonedBlade(
                system
            );

        return context;
    }


    /**
     * Prépare le ViewModel de la section « Poison de lame »
     * (livre p.204), destiné au seul affichage/formulaire : la
     * mutation réelle est faite par `_applyPoisonedBlade` et
     * `_removePoisonedBlade`.
     *
     * N'est utile qu'aux armes de mêlée (system.category ===
     * "melee") : le template n'affiche cette section que dans ce
     * cas, mais ce ViewModel reste calculé sans condition pour
     * rester simple.
     */
    _preparePoisonedBlade(
        system
    ) {

        const poisonedBlade =
            system.poisonedBlade
            ?? {};


        return {

            active:
                poisonedBlade.active
                === true,

            effectType:
                poisonedBlade.effectType
                ?? "lethal",

            toxicity:
                poisonedBlade.toxicity
                ?? 3,

            sourceLabel:
                poisonedBlade.sourceLabel
                ?? "",

            effectTypeChoices:
                getPoisonEffectTypeChoices()
                    .map(
                        effectType => ({

                            value:
                                effectType.key,

                            label:
                                effectType.label,

                            selected:
                                effectType.key
                                === (
                                    poisonedBlade.effectType
                                    ?? "lethal"
                                )

                        })
                    )

        };

    }


    /**
     * Liste, pour affichage seulement, les Items weaponMod de
     * l'Actor de cette arme actuellement attachés à elle
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
     * Prépare la Munition utilisée comme référence documentaire
     * pour définir le type de munition compatible avec l'arme.
     *
     * Cette méthode est strictement destinée à l'interface.
     *
     * Elle ne :
     * - modifie pas ammunitionType ;
     * - ne charge pas la munition dans l'arme ;
     * - ne modifie pas magazine ;
     * - n'intervient pas dans les règles de combat.
     *
     * @param {string} uuid
     *     UUID documentaire de l'Item ammunition.
     *
     * @returns {Promise<object|null>}
     *     ViewModel destiné à Handlebars,
     *     ou null si aucune référence valide n'existe.
     */
    async _prepareAmmunitionReference(
        uuid
    ) {

        if (!uuid) {
            return null;
        }


        let ammunition = null;


        try {

            ammunition =
                await fromUuid(
                    uuid
                );

        } catch (error) {

            console.warn(
                "Metro 2033 | Impossible de résoudre la Munition de référence de l'arme.",
                {
                    weaponId:
                        this.item.id,

                    weaponName:
                        this.item.name,

                    ammunitionReferenceUuid:
                        uuid,

                    error
                }
            );

            return null;

        }


        if (!ammunition) {
            return null;
        }


        if (
            ammunition.documentName !== "Item"
            || ammunition.type !== "ammunition"
        ) {

            console.warn(
                "Metro 2033 | La référence de munition d'une arme ne pointe pas vers un Item ammunition.",
                {
                    weaponId:
                        this.item.id,

                    weaponName:
                        this.item.name,

                    ammunitionReferenceUuid:
                        uuid,

                    referencedDocument:
                        ammunition
                }
            );

            return null;

        }


        return {

            uuid:
                ammunition.uuid,

            id:
                ammunition.id,

            name:
                ammunition.name,

            img:
                ammunition.img,

            ammoType:
                ammunition.system?.ammoType
                ?? ""
        };

    }    

    /**
     * Active les interactions propres à la Munition
     * de référence après chaque rendu de la WeaponSheet.
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


        // ========================================================
        // OUVERTURE DIRECTE
        // ========================================================

        root
            .querySelectorAll(
                "[data-action='open-ammunition-reference']"
            )
            .forEach(
                element => {

                    element.addEventListener(
                        "click",
                        event => {

                            event.preventDefault();
                            event.stopPropagation();

                            void this._openAmmunitionReference();

                        }
                    );

                }
            );


        // ========================================================
        // MENU ⋮
        // ========================================================

        root
            .querySelectorAll(
                "[data-action='ammunition-reference-menu']"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        event => {

                            event.preventDefault();
                            event.stopPropagation();

                            this._openAmmunitionReferenceMenu(
                                button
                            );

                        }
                    );

                }
            );


        // ========================================================
        // CLIC DROIT SUR LA CARTE
        // ========================================================

        root
            .querySelectorAll(
                ".metro-weapon-ammo-reference-card"
            )
            .forEach(
                card => {

                    card.addEventListener(
                        "contextmenu",
                        event => {

                            event.preventDefault();
                            event.stopPropagation();

                            this._openAmmunitionReferenceMenu(
                                card
                            );

                        }
                    );

                }
            );


        // ========================================================
        // DÉTACHEMENT D'UNE AMÉLIORATION D'ARME ATTACHÉE
        // ========================================================

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


        // ========================================================
        // POISON DE LAME
        // ========================================================

        root
            .querySelectorAll(
                "[data-action='apply-poisoned-blade']"
            )
            .forEach(
                element => {

                    element.addEventListener(
                        "click",
                        event => {

                            event.preventDefault();
                            event.stopPropagation();

                            void this._applyPoisonedBlade();

                        }
                    );

                }
            );

        root
            .querySelectorAll(
                "[data-action='remove-poisoned-blade']"
            )
            .forEach(
                element => {

                    element.addEventListener(
                        "click",
                        event => {

                            event.preventDefault();
                            event.stopPropagation();

                            void this._removePoisonedBlade();

                        }
                    );

                }
            );

    }


    /**
     * Applique un poison sur la lame de cette arme (livre p.204),
     * à partir des valeurs saisies dans le petit formulaire de la
     * section « Poison de lame ».
     *
     * Ne modifie que `system.poisonedBlade` : aucune autre donnée
     * de l'arme n'est touchée.
     */
    async _applyPoisonedBlade(

    ) {

        if (!this.isEditable) {
            return;
        }


        const root =
            this.element;


        const effectType =
            root
                ?.querySelector(
                    "[name='poisonedBladeEffectType']"
                )
                ?.value
            ?? "lethal";

        const toxicity =
            Math.min(
                6,
                Math.max(
                    1,
                    Number(
                        root
                            ?.querySelector(
                                "[name='poisonedBladeToxicity']"
                            )
                            ?.value
                        ?? 3
                    )
                )
            );

        const sourceLabel =
            root
                ?.querySelector(
                    "[name='poisonedBladeSourceLabel']"
                )
                ?.value
            ?? "";


        try {

            await this.item.update({

                "system.poisonedBlade": {

                    active:
                        true,

                    effectType,

                    toxicity,

                    sourceLabel

                }

            });


            ui.notifications.info(
                `${this.item.name} est maintenant empoisonnée.`
            );


            await this.render();

        }
        catch (error) {

            console.error(
                "Métro 2033 | Impossible d'appliquer le poison sur cette lame.",
                {
                    weapon:
                        this.item,
                    error
                }
            );


            ui.notifications.error(
                "Impossible d'appliquer le poison sur cette lame."
            );

        }

    }


    /**
     * Retire manuellement le poison de la lame de cette arme
     * (geste du MJ/joueur — le livre ne prévoit aucun décompte de
     * tour automatisé pour la perte naturelle des propriétés du
     * poison).
     */
    async _removePoisonedBlade(

    ) {

        if (!this.isEditable) {
            return;
        }


        try {

            await this.item.update({

                "system.poisonedBlade.active":
                    false

            });


            ui.notifications.info(
                `Le poison a été retiré de la lame de ${this.item.name}.`
            );


            await this.render();

        }
        catch (error) {

            console.error(
                "Métro 2033 | Impossible de retirer le poison de cette lame.",
                {
                    weapon:
                        this.item,
                    error
                }
            );


            ui.notifications.error(
                "Impossible de retirer le poison de cette lame."
            );

        }

    }


    /**
     * Détache un Item weaponMod de cette arme, depuis la
     * WeaponSheet.
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
                    weapon:
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
     * Intercepte le dépôt d'un Document sur la WeaponSheet.
     *
     * Foundry VTT v14 / ItemSheetV2 transmet ici
     * le Document déjà résolu.
     *
     * Une Munition déposée devient la référence documentaire
     * utilisée pour définir le type de munition accepté par l'arme.
     *
     * Une Amélioration d'équipement (weaponMod) déposée s'attache
     * à cette arme, sous réserve de compatibilité et de quota
     * (cf. `_onDropWeaponMod`) : c'est l'Item weaponMod déposé qui
     * est mis à jour (system.attachedItemUuid), jamais l'arme
     * elle-même, qui ne porte aucune référence inverse.
     * L'attachement n'est possible que lorsque cette arme est
     * déjà assignée à un Actor, et seulement avec un weaponMod
     * appartenant au même Actor.
     *
     * Cette opération :
     * - ne crée aucune copie de l'Item ;
     * - ne supprime aucun Item ;
     * - ne modifie pas la munition actuellement chargée ;
     * - ne modifie aucune règle de combat.
     *
     * Elle synchronise uniquement :
     * - ammunitionReferenceUuid ;
     * - ammunitionType ;
     * - ou, pour un weaponMod, attachedItemUuid (sur le
     *   weaponMod lui-même).
     */
    async _onDropDocument(
        event,
        document
    ) {

        if (!this.isEditable) {
            return null;
        }


        if (!document) {

            return super._onDropDocument(
                event,
                document
            );

        }


        // ========================================================
        // AMÉLIORATION D'ARME (weaponMod)
        // ========================================================

        if (
            document.documentName === "Item"
            && document.type === "weaponMod"
        ) {

            return this._onDropWeaponMod(
                document
            );

        }


        // ========================================================
        // SEULES LES MUNITIONS SONT ACCEPTÉES SINON
        // ========================================================

        if (
            document.documentName !== "Item"
            || document.type !== "ammunition"
        ) {

            ui.notifications.warn(
                "Seul un Item Munition ou Amélioration d'équipement peut être associé à une arme."
            );

            return null;

        }


        // ========================================================
        // TYPE MÉTIER
        // ========================================================

        const ammoType =
            document.system?.ammoType
            ?? "";


        if (!ammoType) {

            ui.notifications.warn(
                "Cette Munition ne possède aucun type de munition valide."
            );

            return null;

        }


        // ========================================================
        // SYNCHRONISATION DE LA RÉFÉRENCE
        // ========================================================

        try {

            await this.item.update({

                "system.ammunitionReferenceUuid":
                    document.uuid,

                "system.ammunitionType":
                    ammoType

            });


            ui.notifications.info(
                `${document.name} est maintenant la Munition compatible de ${this.item.name}.`
            );


            await this.render();


            return document;

        }
        catch (error) {

            console.error(
                "Métro 2033 | Impossible d'associer la Munition de référence à l'arme.",
                {
                    weapon:
                        this.item,

                    ammunition:
                        document,

                    error
                }
            );


            ui.notifications.error(
                "Impossible d'associer cette Munition à l'arme."
            );


            return null;

        }

    }

    /**
     * Attache un Item weaponMod déposé à cette arme.
     *
     * C'est le weaponMod déposé qui est mis à jour
     * (system.attachedItemUuid), jamais l'arme elle-même :
     * l'arme ne porte aucune référence inverse vers ses
     * Améliorations d'équipement attachées.
     *
     * L'attachement est réservé au niveau Acteur :
     *
     * - l'arme doit déjà être assignée à un Acteur ;
     * - le weaponMod déposé doit appartenir à ce même Acteur ;
     * - le weaponMod doit déclarer "weapon" dans
     *   system.applicableTypes ;
     * - cette arme doit disposer d'au moins un emplacement
     *   d'Amélioration (system.weaponModSlots > 0) ;
     * - le nombre d'AUTRES weaponMods déjà attachés à cette arme
     *   précise ne doit pas avoir atteint ce quota.
     *
     * Un weaponMod déjà attaché à cette arme (réattachement) est
     * exclu du décompte du quota : l'opération reste idempotente.
     */
    async _onDropWeaponMod(
        weaponMod
    ) {

        const actor =
            this.item.actor;


        if (!actor) {

            ui.notifications.warn(
                "Cette arme doit d'abord être assignée à un Acteur avant d'y attacher une Amélioration d'équipement."
            );

            return null;

        }


        if (
            weaponMod.actor?.id
            !== actor.id
        ) {

            ui.notifications.warn(
                "Cette Amélioration d'équipement doit appartenir au même Acteur que l'arme."
            );

            return null;

        }


        if (
            !isWeaponModApplicableToItemType({

                applicableTypes:
                    weaponMod.system?.applicableTypes,

                itemType:
                    "weapon"

            })
        ) {

            ui.notifications.warn(
                "Cette Amélioration d'équipement ne peut pas être attachée à une arme."
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
                "Cette arme ne dispose d'aucun emplacement d'Amélioration configuré."
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
                `Nombre maximum d'Améliorations atteint pour cette arme (${weaponModSlots}).`
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
                    weapon:
                        this.item,

                    weaponMod,

                    error
                }
            );


            ui.notifications.error(
                "Impossible d'attacher cette Amélioration d'équipement à l'arme."
            );


            return null;

        }

    }


    /**
     * Résout l'Item Munition actuellement associé à l'arme.
     *
     * @returns {Promise<Item|null>}
     */
    async _getAmmunitionReferenceDocument(
        
    ) {

        const uuid =
            this.item.system?.ammunitionReferenceUuid
            ?? "";


        if (!uuid) {
            return null;
        }


        try {

            const ammunition =
                await fromUuid(
                    uuid
                );


            if (
                !ammunition
                || ammunition.documentName !== "Item"
                || ammunition.type !== "ammunition"
            ) {
                return null;
            }


            return ammunition;

        }
        catch (error) {

            console.warn(
                "Métro 2033 | Impossible de résoudre la Munition de référence.",
                {
                    weapon:
                        this.item,
                    ammunitionReferenceUuid:
                        uuid,
                    error
                }
            );


            return null;

        }

    }


    /**
     * Ouvre directement la fiche de la Munition associée.
     */
    async _openAmmunitionReference(

    ) {

        const ammunition =
            await this._getAmmunitionReferenceDocument();


        if (!ammunition) {

            ui.notifications.warn(
                "La Munition associée à cette arme est introuvable."
            );

            return;

        }


        ammunition.sheet.render(
            true
        );

    }


    /**
     * Affiche le menu contextuel de la Munition associée.
     *
     * Le menu est propre à la WeaponSheet :
     * l'action Supprimer ne détruit jamais l'Item source.
     */
    _openAmmunitionReferenceMenu(
        anchor
    ) {

        this._closeAmmunitionReferenceMenu();


        const root =
            this.element;


        if (
            !root
            || !anchor
        ) {
            return;
        }


        const menu =
            document.createElement(
                "div"
            );


        menu.classList.add(
            "metro-character-item-context-menu",
            "metro-weapon-ammo-reference-menu"
        );


        menu.innerHTML = `
            <button
                type="button"
                class="metro-character-item-context-action"
                data-ammunition-reference-action="edit"
            >

                <i
                    class="fa-solid fa-pen"
                    aria-hidden="true"
                ></i>

                <span>
                    Éditer
                </span>

            </button>


            <button
                type="button"
                class="metro-character-item-context-action"
                data-ammunition-reference-action="unlink"
            >

                <i
                    class="fa-solid fa-trash"
                    aria-hidden="true"
                ></i>

                <span>
                    Supprimer
                </span>

            </button>


            <button
                type="button"
                class="metro-character-item-context-action"
                data-ammunition-reference-action="chat"
            >

                <i
                    class="fa-solid fa-message"
                    aria-hidden="true"
                ></i>

                <span>
                    Post to Chat
                </span>

            </button>
        `;


        document.body.appendChild(
            menu
        );


        const rect =
            anchor.getBoundingClientRect();


        menu.style.position =
            "fixed";

        menu.style.left =
            `${rect.right - menu.offsetWidth}px`;

        menu.style.top =
            `${rect.bottom + 4}px`;

        menu.style.zIndex =
            "10000";


        menu
            .querySelectorAll(
                "[data-ammunition-reference-action]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        event => {

                            event.preventDefault();
                            event.stopPropagation();


                            const action =
                                button.dataset
                                    .ammunitionReferenceAction;


                            this._closeAmmunitionReferenceMenu();


                            switch (action) {

                                case "edit":

                                    void this._openAmmunitionReference();

                                    break;


                                case "unlink":

                                    void this._unlinkAmmunitionReference();

                                    break;


                                case "chat":

                                    void this._postAmmunitionReferenceToChat();

                                    break;

                            }

                        }
                    );

                }
            );


        const closeMenu =
            event => {

                if (
                    menu.contains(
                        event.target
                    )
                ) {
                    return;
                }


                this._closeAmmunitionReferenceMenu();


                document.removeEventListener(
                    "pointerdown",
                    closeMenu,
                    true
                );

            };


        queueMicrotask(
            () => {

                document.addEventListener(
                    "pointerdown",
                    closeMenu,
                    true
                );

            }
        );

    }


    /**
     * Ferme le menu contextuel de la Munition.
     */
    _closeAmmunitionReferenceMenu(

    ) {

        this.element
            ?.querySelectorAll(
                ".metro-weapon-ammo-reference-menu"
            )
            .forEach(
                menu => menu.remove()
            );

    }


    /**
     * Dissocie la Munition de référence.
     *
     * IMPORTANT :
     * cette opération modifie uniquement l'Item Weapon.
     * L'Item Munition source n'est jamais supprimé.
     *
     * ammunitionType est volontairement effacé en même temps,
     * puisque la Munition associée constituait sa source.
     *
     * magazine.* reste totalement inchangé.
     */
    async _unlinkAmmunitionReference(

    ) {

        if (!this.isEditable) {
            return;
        }


        try {

            await this.item.update({

                "system.ammunitionReferenceUuid":
                    "",

                "system.ammunitionType":
                    ""

            });


            ui.notifications.info(
                `La Munition compatible de ${this.item.name} a été dissociée.`
            );


            await this.render();

        }
        catch (error) {

            console.error(
                "Métro 2033 | Impossible de dissocier la Munition de référence.",
                {
                    weapon:
                        this.item,
                    error
                }
            );


            ui.notifications.error(
                "Impossible de dissocier la Munition de cette arme."
            );

        }

    }


    /**
     * Publie la Munition associée dans le Chat.
     *
     * La structure HTML reprend exactement
     * la convention commune des Items postés
     * depuis la CharacterSheet.
     *
     * Le lien data-uuid est pris en charge
     * par les hooks Chat du système.
     */
    async _postAmmunitionReferenceToChat(
        
    ) {

        const ammunition =
            await this._getAmmunitionReferenceDocument();


        if (!ammunition) {

            ui.notifications.warn(
                "La Munition associée à cette arme est introuvable."
            );

            return;

        }


        this._closeAmmunitionReferenceMenu();


        const itemUuid =
            ammunition.uuid;


        const content = `
            <div
                class="metro-chat-item-card"
                data-item-uuid="${itemUuid}"
            >

                <header class="metro-chat-item-card-header">

                    <a
                        class="metro-chat-item-card-link"
                        data-uuid="${itemUuid}"
                    >

                        <img
                            class="metro-chat-item-card-image"
                            src="${ammunition.img}"
                            alt="${ammunition.name}"
                        >

                        <strong class="metro-chat-item-card-name">
                            ${ammunition.name}
                        </strong>

                    </a>

                </header>

            </div>
        `;


        await ChatMessage.create({

            speaker:
                ChatMessage.getSpeaker(),

            content

        });

    }

    /**
     * Valeurs de poids autorisées pour une arme.
     *
     * Les libellés sont destinés à l'interface,
     * tandis que le DataModel conserve les valeurs numériques.
     */
    _getWeightChoices(
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
     * Catégories métier disponibles pour une arme.
     *
     * Les valeurs sont des identifiants techniques
     * persistés dans system.weaponCategory.
     *
     * Les libellés sont uniquement destinés
     * à l'interface utilisateur.
     */
    _getWeaponCategoryChoices(
        currentValue
    ) {

        const values = [

            {
                value: "",
                label: "—"
            },

            {
                value: "assaultRifle",
                label: "Fusil d’assaut"
            },

            {
                value: "pistol",
                label: "Pistolet"
            },

            {
                value: "submachineGun",
                label: "Pistolet mitrailleur"
            },

            {
                value: "rifle",
                label: "Fusil"
            },

            {
                value: "rocketLauncher",
                label: "Lance-roquette"
            },

            {
                value: "shotgun",
                label: "Fusil à pompe"
            },

            {
                value: "lightMachineGun",
                label: "Mitrailleuse légère"
            },

            {
                value: "heavyMachineGun",
                label: "Mitrailleuse lourde"
            },

            {
                value: "revolver",
                label: "Revolver"
            },

            {
                value: "bladedWeapon",
                label: "Armes blanches"
            },

            {
                value: "bluntWeapon",
                label: "Armes contondantes"
            },

            {
                value: "unarmed",
                label: "Mains nues"
            },

            {
                value: "incendiaryWeapon",
                label: "Armes incendiaires"
            },

            {
                value: "explosiveWeapon",
                label: "Armes explosives"
            }

        ];


        return values.map(
            choice => ({

                ...choice,

                selected:
                    choice.value
                    === (
                        currentValue
                        ?? ""
                    )

            })
        );

    }

}