const {
    SchemaField,
    NumberField,
    StringField,
    ArrayField,
    HTMLField,
    BooleanField
} = foundry.data.fields;


/**
 * Schéma d'un attribut de créature.
 *
 * Contrairement aux PJ, les créatures peuvent
 * dépasser 5.
 */
function attributeField(initial = 0) {

    return new SchemaField({

        value:
            new NumberField({
                required: true,
                nullable: false,
                integer: true,
                min: 0,
                max: 20,
                initial
            }),

        max:
            new NumberField({
                required: true,
                nullable: false,
                integer: true,
                min: 0,
                max: 20,
                initial
            })

    });

}


/**
 * Une compétence de créature.
 */
function skillField() {

    return new NumberField({
        required: true,
        nullable: false,
        integer: true,
        min: 0,
        max: 10,
        initial: 0
    });

}


export class CreatureDataModel
    extends foundry.abstract.TypeDataModel {


    static defineSchema() {

        return {

            // ====================================================
            // IDENTITÉ
            // ====================================================

            identity:
                new SchemaField({

                    species:
                        new StringField({
                            required: false,
                            nullable: false,
                            initial: ""
                        }),

                    description:
                        new HTMLField({
                            required: false,
                            nullable: false,
                            initial: ""
                        })

                }),


            // ====================================================
            // ATTRIBUTS
            // ====================================================

            attributes:
                new SchemaField({

                    vigor:
                        attributeField(),

                    agility:
                        attributeField(),

                    spirit:
                        attributeField(),

                    empathy:
                        attributeField()

                }),


            // ====================================================
            // COMPÉTENCES
            // ====================================================

            skills:
                new SchemaField({

                    repair:
                        skillField(),

                    closeCombat:
                        skillField(),

                    endurance:
                        skillField(),

                    stealth:
                        skillField(),

                    reaction:
                        skillField(),

                    shooting:
                        skillField(),

                    comprehension:
                        skillField(),

                    observation:
                        skillField(),

                    survival:
                        skillField(),

                    analysis:
                        skillField(),

                    manipulation:
                        skillField(),

                    medicine:
                        skillField()

                }),

            /*
             * Conditions
             *
             * Les conditions complexes seront migrées vers
             * les Active Effects lorsque nous développerons
             * cette partie.
             */
            conditions:
                new SchemaField({

                    hungry:
                        new BooleanField({
                            required: true,
                            initial: false
                        }),

                    dehydrated:
                        new BooleanField({
                            required: true,
                            initial: false
                        }),

                    exhausted:
                        new BooleanField({
                            required: true,
                            initial: false
                        }),

                    frozen:
                        new BooleanField({
                            required: true,
                            initial: false
                        }),

                    prone:
                        new BooleanField({
                            required: true,
                            initial: false
                        })

                }),                 


            // ====================================================
            // PROTECTION NATURELLE
            // ====================================================

            naturalProtection:
                new SchemaField({

                    /**
                     * Valeur fixe.
                     *
                     * Pas de current/max :
                     * la Protection naturelle ne se dégrade pas.
                     */
                    value:
                        new NumberField({
                            required: true,
                            nullable: false,
                            integer: true,
                            min: 0,
                            max: 20,
                            initial: 0
                        }),


                    /**
                     * Certaines créatures ont Résilience.
                     */
                    resilience:
                        new BooleanField({
                            required: true,
                            initial: false
                        }),


                    /**
                     * Certaines créatures ont une Résilience
                     * uniquement contre certains types de dégâts.
                     *
                     * Exemple : Ver sanguin.
                     *
                     * Pour l'instant on conserve la formulation
                     * libre du livre. Nous structurerons les types
                     * de dégâts lors du module Combat.
                     */
                    resilienceCondition:
                        new StringField({
                            required: false,
                            nullable: false,
                            initial: ""
                        })

                }),


            // ====================================================
            // NOTES / CAPACITÉS
            // ====================================================

            special:
                new HTMLField({
                    required: false,
                    nullable: false,
                    initial: ""
                }),


            // ====================================================
            // NOTES MJ
            // ====================================================

            /*
             * Visibles du seul MJ, par cohérence avec les
             * autres types de Document du système (Faction,
             * Station, Personnage, PNJ).
             */
            gmNotes:
                new HTMLField({
                    required: false,
                    nullable: false,
                    initial: ""
                })

        };

    }


    // ============================================================
    // PROTECTION
    // ============================================================

    get hasNaturalProtection() {

        return (
            this.naturalProtection.value > 0
        );

    }


    get protectionValue() {

        return this.naturalProtection.value;

    }


    /**
     * La Protection naturelle couvre implicitement
     * tout le corps.
     */
    get naturalProtectionCoverage() {

        return "all";

    }


    /**
     * Une Protection naturelle n'est jamais dégradable.
     */
    get naturalProtectionDegradable() {

        return false;

    }


    get hasNaturalResilience() {

        return (
            this.hasNaturalProtection
            && this.naturalProtection.resilience
        );

    }

}