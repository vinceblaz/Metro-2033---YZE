export class AmmunitionDataModel
    extends foundry.abstract.TypeDataModel {

    static defineSchema() {
        const fields = foundry.data.fields;

        return {

            /*
             * Identifiant métier stable de la munition.
             *
             * Exemples :
             * "5.45x39"
             * "7.62x39"
             * "9x18"
             * "12g"
             * "arrow"
             * "bolt"
             *
             * Cet identifiant sert à déterminer la compatibilité
             * entre une arme et une munition.
             *
             * Il ne doit jamais contenir un UUID ou un Item ID Foundry.
             */
            ammoType:
                new fields.StringField({
                    required: true,
                    nullable: false,
                    initial: ""
                }),


            /*
             * Forme physique / logistique de la munition.
             *
             * Cette information décrit ce qu'est la ressource.
             * Elle ne détermine pas à elle seule son mode de consommation.
             */
            containerType:
                new fields.StringField({
                    required: true,
                    nullable: false,
                    initial: "magazine",
                    choices: [
                        "magazine",
                        "cylinder",
                        "belt",
                        "shell",
                        "arrow",
                        "bolt"
                    ]
                }),


            /*
             * Mode de consommation.
             *
             * unit :
             *   Une unité est consommée à chaque tir.
             *
             *   Exemples :
             *   - flèche
             *   - carreau
             *   - balle militaire utilisée individuellement
             *
             * container :
             *   Les tirs ordinaires ne consomment pas de quantité.
             *   Une unité est consommée lorsqu'un événement de règle
             *   impose le remplacement du chargeur/conteneur.
             *
             *   Exemples :
             *   - chargeur AK-74
             *   - barillet préparé
             *   - bande de munitions abstraite
             */
            consumptionMode:
                new fields.StringField({
                    required: true,
                    nullable: false,
                    initial: "container",
                    choices: [
                        "unit",
                        "container"
                    ]
                }),


            /*
             * Nombre d'unités actuellement disponibles
             * dans l'équipement de l'Actor.
             *
             * Sa signification dépend de consumptionMode :
             *
             * unit :
             *   nombre de projectiles individuels.
             *
             * container :
             *   nombre de chargeurs / conteneurs disponibles.
             */
            quantity:
                new fields.NumberField({
                    required: true,
                    nullable: false,
                    initial: 1,
                    integer: true,
                    min: 0
                }),


            /*
             * Compatibilités supplémentaires éventuelles.
             *
             * ammoType reste la règle métier principale.
             */
            compatibleWeaponTypes:
                new fields.ArrayField(
                    new fields.StringField({
                        required: true,
                        nullable: false,
                        initial: ""
                    }),
                    {
                        required: true,
                        nullable: false,
                        initial: []
                    }
                ),


            /*
             * Qualité de la munition.
             */
            quality:
                new fields.StringField({
                    required: true,
                    nullable: false,
                    initial: "standard",
                    choices: [
                        "standard",
                        "military",
                        "poor"
                    ]
                }),


            /*
             * Réduction de Protection apportée
             * par cette munition.
             */
            protectionReduction:
                new fields.NumberField({
                    required: true,
                    nullable: false,
                    initial: 0,
                    integer: true,
                    min: 0
                }),


            /*
             * La munition ignore-t-elle la résilience ?
             */
            ignoresResilience:
                new fields.BooleanField({
                    required: true,
                    nullable: false,
                    initial: false
                }),


            /*
             * Poids de l'ensemble représenté par l'Item.
             */
            weight:
                new fields.NumberField({
                    required: true,
                    nullable: false,
                    initial: 0,
                    min: 0
                }),


            /*
             * Valeur économique.
             */
            price:
                new fields.SchemaField({

                    buy:
                        new fields.NumberField({
                            required: true,
                            nullable: false,
                            initial: 0,
                            integer: true,
                            min: 0
                        }),

                    sell:
                        new fields.NumberField({
                            required: true,
                            nullable: false,
                            initial: 0,
                            integer: true,
                            min: 0
                        })
                }),


            /*
             * Description publique.
             */
            description:
                new fields.HTMLField({
                    required: true,
                    nullable: false,
                    initial: ""
                }),


            /*
             * Effet ou propriété mécanique particulière.
             */
            special:
                new fields.HTMLField({
                    required: true,
                    nullable: false,
                    initial: ""
                }),


            /*
             * Notes privées du MJ.
             */
            gmNotes:
                new fields.HTMLField({
                    required: true,
                    blank: true,
                    initial: ""
                })
        };
    }


    /*
     * ---------------------------------------------------------
     * GETTERS MÉTIER
     * ---------------------------------------------------------
     */


    /**
     * La munition est-elle consommée à chaque tir ?
     */
    get consumesPerShot() {
        return this.consumptionMode === "unit";
    }


    /**
     * La munition représente-t-elle un chargeur/conteneur abstrait ?
     */
    get consumesOnReload() {
        return this.consumptionMode === "container";
    }


    /**
     * Reste-t-il au moins une unité disponible ?
     */
    get available() {
        return this.quantity > 0;
    }


    /**
     * Cette munition est-elle militaire ?
     */
    get isMilitary() {
        return this.quality === "military";
    }
}