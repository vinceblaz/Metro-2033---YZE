const {
    SchemaField,
    NumberField,
    StringField,
    HTMLField
} = foundry.data.fields;


/**
 * DataModel d'un consommable Métro 2033.
 *
 * Recouvre les objets à quantité/doses (trousse de soins,
 * doses d'antidote ou d'antipoison, filtres à air de rechange,
 * vestiges à échanger, etc.).
 *
 * Ne recouvre PAS les ressources de station suivies par jauge
 * (Eau, Nourriture, Énergie, Médicaments : 0 à 10), qui seront
 * gérées directement sur l'onglet Survie de l'Actor.
 *
 * Comme pour l'Équipement et la Protection, ce DataModel reste
 * purement descriptif : aucune règle métier n'est automatisée
 * (la consommation d'une dose, l'effet d'une trousse de soins,
 * etc. restent gérés manuellement à la table).
 */
export class ConsumableDataModel
    extends foundry.abstract.TypeDataModel {


    static defineSchema() {

        return {

            // ====================================================
            // QUANTITÉ
            // ====================================================

            /**
             * Quantité actuelle et quantité maximale
             * (nombre de doses, de charges, d'unités...).
             *
             * current peut descendre jusqu'à 0.
             *
             * Si max > 0 et current === 0,
             * le consommable est épuisé.
             */
            quantity:
                new SchemaField({

                    current:
                        new NumberField({
                            required: true,
                            nullable: false,
                            integer: true,
                            min: 0,
                            initial: 1
                        }),

                    max:
                        new NumberField({
                            required: true,
                            nullable: false,
                            integer: true,
                            min: 0,
                            initial: 1
                        })

                }),


            /**
             * Libellé de l'unité comptée
             * (doses, charges, unités, filtres...).
             *
             * Purement informatif, affiché tel quel
             * à côté des valeurs de quantité.
             */
            unitLabel:
                new StringField({
                    required: true,
                    nullable: false,
                    initial: "unités"
                }),


            // ====================================================
            // ENCOMBREMENT
            // ====================================================

            /**
             * Encombrement numérique.
             *
             * L'interface proposera :
             *
             * 0
             * 1/4
             * 1/2
             * 1
             * 2
             * 3
             *
             * mais les valeurs sont stockées
             * numériquement :
             *
             * 0
             * 0.25
             * 0.5
             * 1
             * 2
             * 3
             */
            weight:
                new NumberField({
                    required: true,
                    nullable: false,
                    min: 0,
                    initial: 0
                }),


            // ====================================================
            // ÉCONOMIE
            // ====================================================

            price:
                new SchemaField({

                    buy:
                        new NumberField({
                            required: true,
                            nullable: false,
                            integer: true,
                            min: 0,
                            initial: 0
                        }),

                    sell:
                        new NumberField({
                            required: true,
                            nullable: false,
                            integer: true,
                            min: 0,
                            initial: 0
                        })

                }),


            // ====================================================
            // DESCRIPTION
            // ====================================================

            description:
                new HTMLField({
                    required: false,
                    nullable: false,
                    initial: ""
                }),


            /**
             * Effet ou règle spéciale de ce consommable
             * (ex : "Autorise les jets de Soins sans
             * modificateur négatif", "Neutralise un poison
             * en cours si absorbé à temps"...).
             */
            special:
                new HTMLField({
                    required: false,
                    nullable: false,
                    initial: ""
                }),


            /**
             * Notes privées réservées au MJ.
             *
             * La restriction d'affichage
             * sera gérée par ConsumableSheet.
             */
            gmNotes:
                new HTMLField({
                    required: true,
                    nullable: false,
                    initial: ""
                })

        };

    }


    // ============================================================
    // DONNÉES DÉRIVÉES
    // ============================================================

    /**
     * Le consommable a été partiellement utilisé.
     */
    get partiallyUsed() {

        return (
            this.quantity.current
            < this.quantity.max
        );

    }


    /**
     * Le consommable est épuisé.
     *
     * Un consommable dont la quantité maximale
     * vaut 0 n'est pas considéré épuisé.
     */
    get depleted() {

        return (
            this.quantity.max > 0
            && this.quantity.current <= 0
        );

    }


    /**
     * État métier dérivé du consommable.
     *
     * L'interface pourra traduire ces valeurs
     * en libellés utilisateur.
     */
    get conditionState() {

        if (this.depleted) {

            return "depleted";

        }


        if (this.partiallyUsed) {

            return "partial";

        }


        return "full";

    }

}
