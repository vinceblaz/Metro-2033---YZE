import { MetroItemSheet }
    from "./metro-item-sheet.mjs";

export class ConsumableSheet
    extends MetroItemSheet {

    static DEFAULT_OPTIONS = {
        ...super.DEFAULT_OPTIONS,
        classes: [
            ...(super.DEFAULT_OPTIONS.classes ?? []),
            "metro-consumable-sheet"
        ],
        position: { width: 620, height: 680 },
        form: {
            ...(super.DEFAULT_OPTIONS.form ?? {}),
            closeOnSubmit: false,
            submitOnChange: true
        }
    };

    static PARTS = {
        form: {
            template:
                "systems/metro-2033-yze/templates/items/consumable-sheet.hbs"
        }
    };

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        const system = this.item.system;
        return {
            ...context,
            item: this.item,
            system,
            isGM: game.user.isGM,
            quantityState: this._getQuantityState(system),
            encumbranceChoices: this._getEncumbranceChoices(system.weight)
        };
    }

    /**
     * Transforme la quantité restante en informations
     * directement affichables.
     *
     * Un consommable peut être :
     *
     * - "depleted" : quantité actuelle à 0
     *   (épuisé, à réapprovisionner) ;
     * - "partial" : quantité actuelle < quantité max ;
     * - "full" : quantité actuelle == quantité max.
     */
    _getQuantityState(system) {
        const current = Number(system.quantity?.current ?? 0);
        const max = Number(system.quantity?.max ?? 0);
        const depleted = max > 0 && current <= 0;
        const partial = !depleted && current < max;
        const stateId = depleted ? "depleted" : partial ? "partial" : "full";
        const stateLabel = depleted ? "Épuisé" : partial ? "Entamé" : "Complet";
        return { id: stateId, label: stateLabel, depleted, partial };
    }

    /**
     * Valeurs d'encombrement autorisées.
     *
     * L'utilisateur voit les fractions,
     * mais le DataModel stocke les valeurs numériques.
     */
    _getEncumbranceChoices(currentValue) {
        const values = [
            { value: 0, label: "Minuscule (0)" },
            { value: 0.25, label: "Très léger (1/4)" },
            { value: 0.5, label: "Léger (1/2)" },
            { value: 1, label: "Standard (1)" },
            { value: 2, label: "Lourd (2)" },
            { value: 3, label: "Très lourd (3)" }
        ];

        return values.map(
            choice => ({
                ...choice,
                selected: Number(currentValue) === choice.value
            })
        );
    }

}
