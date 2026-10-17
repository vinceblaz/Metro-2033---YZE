import { MetroItemSheet }
    from "./metro-item-sheet.mjs";


/**
 * Fiche d'une Amélioration d'équipement (weaponMod) Métro 2033.
 *
 * La fiche :
 *
 * - expose les données du DataModel ;
 * - résout, pour affichage seulement, l'équipement (arme ou
 *   protection) actuellement attaché (via attachedItemUuid) ;
 * - ne contient aucune mécanique d'automatisation de jet :
 *   la proposition en fenêtre de préparation est gérée par
 *   ActionModifierDialog / RangedAttackPreparationService.
 */
export class WeaponModSheet
    extends MetroItemSheet {


    static DEFAULT_OPTIONS = {

        ...super.DEFAULT_OPTIONS,

        classes: [
            ...(super.DEFAULT_OPTIONS.classes ?? []),
            "metro-weapon-mod-sheet"
        ],

        position: {
            width: 560,
            height: 620
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
                "systems/metro-2033-yze/templates/items/weapon-mod-sheet.hbs"
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
            // TYPES D'ÉQUIPEMENT COMPATIBLES
            // ====================================================

            applicableToWeapon:
                Array.isArray(system.applicableTypes)
                && system.applicableTypes.includes("weapon"),

            applicableToArmor:
                Array.isArray(system.applicableTypes)
                && system.applicableTypes.includes("armor"),


            // ====================================================
            // ÉQUIPEMENT ATTACHÉ
            // ====================================================

            attachedItem:
                await this._prepareAttachedItem(
                    system.attachedItemUuid
                )

        };

    }


    /**
     * Résout, pour affichage seulement, l'Item (weapon ou armor)
     * actuellement référencé par attachedItemUuid.
     *
     * Même pattern de résolution que WeaponSheet pour
     * ammunitionReferenceUuid : cette référence n'influence
     * jamais directement les règles de jeu, elle sert
     * uniquement à l'interface.
     *
     * @param {string} uuid
     * @returns {Promise<object|null>}
     */
    async _prepareAttachedItem(
        uuid
    ) {

        if (!uuid) {
            return null;
        }


        let item = null;


        try {

            item =
                await fromUuid(
                    uuid
                );

        } catch (error) {

            console.warn(
                "Metro 2033 | Impossible de résoudre l'équipement attaché à cette Amélioration d'équipement.",
                {
                    weaponModId:
                        this.item.id,

                    weaponModName:
                        this.item.name,

                    attachedItemUuid:
                        uuid,

                    error
                }
            );

            return null;

        }


        if (
            !item
            || item.documentName !== "Item"
            || (
                item.type !== "weapon"
                && item.type !== "armor"
            )
        ) {
            return null;
        }


        return {

            uuid:
                item.uuid,

            id:
                item.id,

            name:
                item.name,

            img:
                item.img

        };

    }


    /**
     * Active les interactions propres à cette fiche
     * après chaque rendu.
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
                "[data-action='detach-item']"
            )
            .forEach(
                element => {

                    element.addEventListener(
                        "click",
                        event => {

                            event.preventDefault();
                            event.stopPropagation();

                            void this._detachItem();

                        }
                    );

                }
            );

    }


    /**
     * Détache cette Amélioration d'équipement de l'équipement
     * actuellement référencé.
     *
     * N'affecte jamais l'Item weapon/armor lui-même : seul
     * attachedItemUuid, porté par cet Item weaponMod,
     * est modifié.
     */
    async _detachItem() {

        if (!this.isEditable) {
            return;
        }


        try {

            await this.item.update({

                "system.attachedItemUuid":
                    ""

            });


            ui.notifications.info(
                `${this.item.name} n'est plus attachée à aucun équipement.`
            );


            await this.render();

        }
        catch (error) {

            console.error(
                "Métro 2033 | Impossible de détacher cette Amélioration d'équipement.",
                {
                    weaponMod:
                        this.item,
                    error
                }
            );


            ui.notifications.error(
                "Impossible de détacher cette Amélioration d'équipement."
            );

        }

    }

}
