const {
    SchemaField,
    NumberField,
    StringField,
    HTMLField,
    BooleanField
} = foundry.data.fields;


/**
 * DataModel d'un Traumatisme psychologique Métro 2033.
 *
 * Un Traumatisme psychologique est un Item persistant
 * pouvant être attribué à un Actor.
 *
 * Le nom et l'image sont portés directement par :
 *
 * - Item.name
 * - Item.img
 *
 * Le modèle distingue :
 *
 * - la définition générique du traumatisme ;
 * - l'état propre à l'instance attribuée à un Actor.
 *
 * Les règles métier de génération, récupération et soins
 * seront implémentées dans des services dédiés.
 */
export class PsychologicalTraumaDataModel
    extends foundry.abstract.TypeDataModel {

    static defineSchema() {

        return {

            /*
             * Plage D66 correspondant au traumatisme.
             *
             * Contrairement aux Blessures critiques,
             * plusieurs traumatismes couvrent plusieurs
             * résultats D66.
             *
             * Exemples :
             *
             * Tremblements : 11 à 16
             * Anxiété      : 22 à 24
             * Infarctus    : 66 à 66
             *
             * 0 / 0 permet de représenter
             * un traumatisme personnalisé qui ne provient
             * pas de la table officielle.
             */
            d66: new SchemaField({

                min: new NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    min: 0,
                    max: 66,
                    initial: 0
                }),

                max: new NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    min: 0,
                    max: 66,
                    initial: 0
                })
            }),

            /*
            * Description publique de la blessure.
            *
            * Visible par les utilisateurs ayant accès à l'Item.
            */
            description: new HTMLField({
                required: true,
                blank: true,
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


            /*
             * Effet narratif et/ou mécanique.
             *
             * Exemples :
             *
             * - modificateur de -1 aux jets d'Agilité ;
             * - impossibilité de dormir la nuit ;
             * - dégâts d'Esprit liés à une phobie ;
             * - effets devant être interprétés.
             *
             * Nous n'automatisons pas encore ces effets.
             */
            effect: new HTMLField({
                required: true,
                blank: true,
                initial: ""
            }),


            /*
             * Mort instantanée.
             *
             * Le résultat 66 "Infarctus" tue immédiatement.
             *
             * Il n'existe pas ici de mécanique de Trépas :
             * contrairement aux blessures critiques fatales,
             * le traumatisme concerné provoque directement
             * la mort.
             */
            instantDeath: new BooleanField({
                required: true,
                initial: false
            }),


            /*
             * Formule de la période de rémission.
             *
             * Exemples :
             *
             * "1d6"
             * "2d6"
             * "3d6"
             *
             * Valeur vide lorsque :
             *
             * - le traumatisme est permanent ;
             * - il provoque une mort instantanée ;
             * - un traumatisme personnalisé ne possède
             *   aucune durée automatique.
             */
            recoveryFormula: new StringField({
                required: true,
                blank: true,
                initial: ""
            }),


            /*
             * Traumatisme permanent.
             *
             * Exemples de la table :
             *
             * - Cheveux blancs
             * - Personnalité altérée
             */
            permanent: new BooleanField({
                required: true,
                initial: false
            }),


            /*
             * État de récupération propre à l'instance
             * attribuée à un Actor.
             */
            recovery: new SchemaField({

                /*
                 * Durée initiale obtenue après résolution
                 * de recoveryFormula.
                 */
                totalDays: new NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    min: 0,
                    initial: 0
                }),


                /*
                 * Nombre de jours de rémission restants.
                 */
                remainingDays: new NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    min: 0,
                    initial: 0
                }),


                /*
                 * Indique qu'un traitement réussi a déjà
                 * réduit la période de rémission.
                 *
                 * Nous conserverons ici une information
                 * d'état simple ; le service métier gérera
                 * la limitation d'un jet de Soins par jour.
                 */
                treatmentApplied: new BooleanField({
                    required: true,
                    initial: false
                }),


                /*
                 * Le traumatisme n'a plus d'effet actif.
                 */
                healed: new BooleanField({
                    required: true,
                    initial: false
                })
            })
        };
    }
}