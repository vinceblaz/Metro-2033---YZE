/**
 * Modèle de données d'un Archétype.
 *
 * L'Item Archétype conserve uniquement :
 *
 * - son identifiant fonctionnel stable ;
 * - les choix propres à cette instance
 *   lorsqu'une définition canonique
 *   d'archétype en demande ;
 * - sa description éventuelle ;
 * - sa note privée MJ.
 *
 * Les règles canoniques de l'Archétype
 * restent définies dans :
 *
 * domain/rules/archetypes.mjs
 */
export class ArchetypeDataModel
    extends foundry.abstract.TypeDataModel {


    static defineSchema() {

        const fields =
            foundry.data.fields;


        return {

            /**
             * Identifiant fonctionnel stable
             * de la définition canonique.
             *
             * Il correspond à `id`
             * dans ARCHETYPE_DEFINITIONS.
             *
             * Exemples :
             *
             * "diplomat"
             * "scout"
             * "soldier"
             */
            key:
                new fields.StringField({
                    required: true,
                    nullable: false,
                    initial: ""
                }),


            /**
             * Configuration propre à l'instance
             * de l'Archétype possédée par l'Actor.
             *
             * Ces champs ne redéfinissent aucune règle.
             *
             * Ils mémorisent uniquement les choix
             * effectués lorsque la définition canonique
             * propose plusieurs possibilités.
             *
             * Exemple Soldat :
             *
             * {
             *     attribute: "vigor",
             *     skill: "closeCombat"
             * }
             */
            configuration:
                new fields.SchemaField({

                    attribute:
                        new fields.StringField({
                            required: true,
                            nullable: false,
                            initial: ""
                        }),

                    skill:
                        new fields.StringField({
                            required: true,
                            nullable: false,
                            initial: ""
                        })

                }),


            /**
             * Description narrative éventuelle.
             *
             * Elle appartient à l'Item et n'intervient
             * pas dans les règles métier.
             */
            description:
                new fields.HTMLField({
                    required: true,
                    nullable: false,
                    initial: ""
                }),


            /**
             * Note privée du MJ.
             *
             * Sa visibilité sera contrôlée
             * par l'ArchetypeSheet.
             */
            gmNotes:
                new fields.HTMLField({
                    required: true,
                    blank: true,
                    initial: ""
                })

        };

    }


    /**
     * Retourne une configuration normalisée,
     * facile à consommer par l'Actor
     * et les règles métier.
     */
    get archetypeConfiguration() {

        return {

            attribute:
                this.configuration
                    ?.attribute
                ?? "",

            skill:
                this.configuration
                    ?.skill
                ?? ""

        };

    }

}