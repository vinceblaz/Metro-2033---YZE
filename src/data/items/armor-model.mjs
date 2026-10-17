const {
    SchemaField,
    NumberField,
    StringField,
    BooleanField,
    HTMLField
} = foundry.data.fields;


/**
 * DataModel d'une protection Métro 2033.
 *
 * Une protection peut être :
 * - une armure corporelle ;
 * - un casque.
 */
export class ArmorDataModel
    extends foundry.abstract.TypeDataModel {


    static defineSchema() {

        return {

            // ====================================================
            // TYPE
            // ====================================================

            category:
                new StringField({
                    required: true,
                    initial: "body",
                    choices: [
                        "body",
                        "helmet"
                    ]
                }),


            equipped:
                new BooleanField({
                    required: true,
                    initial: false
                }),


            // ====================================================
            // PROTECTION
            // ====================================================

            protection:
                new SchemaField({

                    /**
                     * Protection actuelle.
                     *
                     * Elle diminue lorsque des 1 sont obtenus
                     * sur un jet de Protection.
                     */
                    current:
                        new NumberField({
                            required: true,
                            nullable: false,
                            integer: true,
                            min: 0,
                            initial: 0
                        }),

                    /**
                     * Protection d'origine.
                     *
                     * La réparation ne peut jamais
                     * dépasser cette valeur.
                     */
                    max:
                        new NumberField({
                            required: true,
                            nullable: false,
                            integer: true,
                            min: 0,
                            initial: 0
                        })

                }),


            // ====================================================
            // TRAITS
            // ====================================================

            /**
             * Résilience :
             *
             * annule automatiquement 1 dégât supplémentaire
             * tant que la Protection n'est pas réduite à 0.
             */
            resilience:
                new BooleanField({
                    required: true,
                    initial: false
                }),

            /**
             * Indique qu'une protection possédant Résilience
             * est tombée à 0 et n'a pas encore été entièrement
             * réparée.
             *
             * Le trait existe toujours, mais il est temporairement
             * inactif jusqu'au retour à la Protection maximale.
             */
            resilienceLost:
                new BooleanField({
                    required: true,
                    initial: false
                }),                

            // ====================================================
            // ENCOMBREMENT
            // ====================================================

            /**
             * Les protections ne comptent normalement pas
             * dans l'équipement transporté.
             *
             * Certaines exceptions, comme la tenue antiémeute,
             * possèdent néanmoins un encombrement.
             */
            weight:
                new NumberField({
                    required: true,
                    nullable: false,
                    min: 0,
                    initial: 0
                }),


            // ====================================================
            // AMÉLIORATIONS D'ÉQUIPEMENT (weaponMod)
            // ====================================================

            /**
             * Nombre d'emplacements d'Amélioration d'équipement
             * que CETTE protection précise peut accueillir.
             *
             * Le livre ne définit aucune Amélioration de
             * Protection ni aucun nombre d'emplacements par
             * protection : c'est un paramétrage que le MJ fait
             * lui-même pour chaque protection de sa table. 0 par
             * défaut (aucun emplacement), y compris pour toutes
             * les entrées du catalogue existantes.
             */
            weaponModSlots:
                new NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    min: 0,
                    initial: 0
                }),


            // ====================================================
            // MODIFICATEURS
            // ====================================================

            modifiers:
                new SchemaField({

                    agility:
                        new NumberField({
                            required: true,
                            nullable: false,
                            integer: true,
                            initial: 0
                        }),

                    observation:
                        new NumberField({
                            required: true,
                            nullable: false,
                            integer: true,
                            initial: 0
                        })

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
                

            /*
            * Note privée du MJ.
            *
            * La restriction d'affichage et d'édition sera gérée
            * par la fiche Item.
            */
            gmNotes: new HTMLField({
                required: true,
                blank: true,
                initial: ""
            }),                  

            special:
                new HTMLField({
                    required: false,
                    nullable: false,
                    initial: ""
                })

        };

    }


    // ============================================================
    // DONNÉES DÉRIVÉES
    // ============================================================

    get isBodyArmor() {

        return this.category === "body";

    }


    get isHelmet() {

        return this.category === "helmet";

    }


    /**
     * À Protection 0, la protection est hors d'usage.
     */
    get broken() {

        return (
            this.protection.max > 0
            && this.protection.current <= 0
        );

    }


    get damaged() {

        return (
            this.protection.current
            < this.protection.max
        );

    }


    /**
     * Protection effectivement utilisable.
     *
     * Une protection non équipée ne contribue jamais
     * automatiquement au jet de Protection.
     */
    get usableProtection() {

        if (!this.equipped) {

            return 0;

        }


        if (this.broken) {

            return 0;

        }


        return this.protection.current;

    }


    /**
     * La Résilience fonctionne uniquement tant que
     * la Protection n'est pas tombée à 0.
     */
    get activeResilience() {

        return (
            this.equipped
            && this.resilience
            && !this.resilienceLost
            && this.protection.current > 0
        );

    }

}