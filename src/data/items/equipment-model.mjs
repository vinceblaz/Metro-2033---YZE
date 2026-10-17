const {
    SchemaField,
    NumberField,
    StringField,
    BooleanField,
    HTMLField
} = foundry.data.fields;


/**
 * DataModel d'un équipement Métro 2033.
 *
 * L'équipement peut fournir un bonus à :
 *
 * - un attribut ;
 * - une compétence ;
 * - ou potentiellement les deux.
 *
 * Son état réel est dérivé de :
 *
 * - bonus.current ;
 * - bonus.max ;
 * - repairable.
 *
 * Aucun état textuel n'est persisté afin d'éviter
 * toute incohérence entre les données sources
 * et l'état affiché par l'interface.
 */
export class EquipmentDataModel
    extends foundry.abstract.TypeDataModel {


    static defineSchema() {

        return {

            // ====================================================
            // ÉQUIPEMENT
            // ====================================================

            /**
             * L'objet est-il actuellement équipé ?
             *
             * Cette donnée sera principalement manipulée
             * depuis l'onglet Équipement de l'Actor.
             */
            equipped:
                new BooleanField({
                    required: true,
                    nullable: false,
                    initial: false
                }),


            /**
             * Attribut auquel cet équipement
             * peut apporter son bonus.
             *
             * Chaîne vide :
             * aucun attribut spécifique.
             */
            attribute:
                new StringField({
                    required: true,
                    nullable: false,
                    initial: ""
                }),


            /**
             * Compétence à laquelle cet équipement
             * peut apporter son bonus.
             *
             * Chaîne vide :
             * aucune compétence spécifique.
             */
            skill:
                new StringField({
                    required: true,
                    nullable: false,
                    initial: ""
                }),


            // ====================================================
            // BONUS
            // ====================================================

            /**
             * Bonus actuel et bonus maximum.
             *
             * current peut descendre jusqu'à 0.
             *
             * Si max > 0 et current === 0,
             * l'objet est hors d'usage.
             */
            bonus:
                new SchemaField({

                    current:
                        new NumberField({
                            required: true,
                            nullable: false,
                            integer: true,
                            min: 0,
                            max: 3,
                            initial: 0
                        }),

                    max:
                        new NumberField({
                            required: true,
                            nullable: false,
                            integer: true,
                            min: 0,
                            max: 3,
                            initial: 0
                        })

                }),


            /**
             * L'objet peut-il encore être réparé ?
             *
             * false signifie qu'une dégradation
             * éventuelle est définitive.
             */
            repairable:
                new BooleanField({
                    required: true,
                    nullable: false,
                    initial: true
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

            /**
             * Prix de l'équipement.
             *
             * Pour cette première version,
             * la fiche expose un prix unique.
             */
            price:
                new NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    min: 0,
                    initial: 0
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
             * Notes privées réservées au MJ.
             *
             * La restriction d'affichage
             * sera gérée par EquipmentSheet.
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
     * L'objet a perdu une partie
     * de son bonus maximal.
     */
    get damaged() {

        return (
            this.bonus.current
            < this.bonus.max
        );

    }


    /**
     * L'objet est hors d'usage.
     *
     * Un équipement dont le bonus maximum
     * vaut 0 n'est pas considéré cassé.
     */
    get broken() {

        return (
            this.bonus.max > 0
            && this.bonus.current <= 0
        );

    }


    /**
     * L'objet peut actuellement être réparé.
     *
     * Il faut :
     *
     * - qu'il soit effectivement abîmé ;
     * - qu'il soit encore réparable.
     */
    get canRepair() {

        return (
            this.damaged
            && this.repairable
        );

    }


    /**
     * L'objet est définitivement hors d'usage.
     */
    get destroyed() {

        return (
            this.broken
            && !this.repairable
        );

    }


    /**
     * Bonus réellement utilisable
     * par les règles.
     *
     * Un équipement doit :
     *
     * - être équipé ;
     * - ne pas être hors d'usage.
     */
    get usableEquipmentBonus() {

        if (!this.equipped) {

            return 0;

        }


        if (this.broken) {

            return 0;

        }


        return this.bonus.current;

    }


    /**
     * Identifiant de compétence exposé
     * pour rester compatible avec
     * les règles existantes de MetroActor.
     */
    get skillId() {

        return (
            this.skill || null
        );

    }


    /**
     * Identifiant d'attribut exposé
     * sous une forme homogène.
     */
    get attributeId() {

        return (
            this.attribute || null
        );

    }


    /**
     * État métier dérivé de l'objet.
     *
     * L'interface pourra traduire ces valeurs
     * en libellés utilisateur.
     */
    get conditionState() {

        if (this.destroyed) {

            return "destroyed";

        }


        if (
            this.broken
            && this.repairable
        ) {

            return "broken-repairable";

        }


        if (
            this.damaged
            && this.repairable
        ) {

            return "damaged-repairable";

        }


        if (this.damaged) {

            return "damaged";

        }


        return "good";

    }

}