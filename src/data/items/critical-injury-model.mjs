const {
    SchemaField,
    NumberField,
    StringField,
    HTMLField,
    BooleanField
} = foundry.data.fields;


/**
 * DataModel d'une Blessure critique Métro 2033.
 *
 * Une Blessure critique est un Item persistant pouvant
 * être attribué à un Actor.
 *
 * Le nom et l'image sont portés directement par
 * Item.name et Item.img.
 *
 * Ce DataModel décrit les données propres à la blessure.
 * Les règles métier de Trépas, soins et récupération
 * seront gérées par des services dédiés.
 */
export class CriticalInjuryDataModel
    extends foundry.abstract.TypeDataModel {

    static defineSchema() {

        return {

            /*
             * Résultat D66 correspondant à la blessure.
             *
             * Exemples :
             * 11, 16, 44, 61...
             *
             * 0 permet de créer une blessure personnalisée
             * ne provenant pas de la table officielle.
             */
            d66: new NumberField({
                required: true,
                nullable: false,
                integer: true,
                min: 0,
                max: 66,
                initial: 0
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
             * Description complète / effet narratif
             * et mécanique de la blessure.
             *
             * Exemple :
             * "Réaction –2."
             *
             * HTMLField afin de permettre une description
             * enrichie pour les blessures personnalisées.
             */
            effect: new HTMLField({
                required: true,
                blank: true,
                initial: ""
            }),


            /*
             * Blessure fatale.
             *
             * Si true, le personnage devra potentiellement
             * effectuer des jets de Trépas.
             */
            fatal: new BooleanField({
                required: true,
                initial: false
            }),


            /*
             * Modificateur appliqué au jet de Trépas.
             *
             * Exemples issus de la table :
             *
             *  0  → aucun modificateur
             * -1  → Fatal (-1)
             *
             * La valeur est stockée indépendamment du booléen
             * fatal pour garder une structure exploitable.
             */
            deathRollModifier: new NumberField({
                required: true,
                nullable: false,
                integer: true,
                initial: 0
            }),


            /*
             * Délai avant chaque jet de Trépas.
             *
             * Exemples :
             * round
             * turn
             * quarter
             * day
             *
             * Valeur vide lorsque la blessure n'est pas fatale
             * ou provoque une mort instantanée.
             *
             * On utilise une String plutôt qu'un enum strict
             * afin de permettre la création de nouvelles blessures.
             */
            deathRollInterval: new StringField({
                required: true,
                blank: true,
                initial: ""
            }),


            /*
             * Mort instantanée.
             *
             * Certaines blessures critiques tuent immédiatement
             * et ne nécessitent donc pas de jet de Trépas.
             */
            instantDeath: new BooleanField({
                required: true,
                initial: false
            }),


            /*
             * Formule de rémission.
             *
             * Exemples :
             * ""
             * "1d6"
             * "2d6"
             * "6d6"
             *
             * On stocke la formule plutôt qu'un nombre déjà lancé.
             */
            recoveryFormula: new StringField({
                required: true,
                blank: true,
                initial: ""
            }),


            /*
             * Blessure dont les effets sont permanents.
             *
             * Exemple :
             * bras sectionné.
             */
            permanent: new BooleanField({
                required: true,
                initial: false
            }),


            /*
             * État de l'instance attribuée à l'Actor.
             *
             * Une blessure créée dans un Compendium aura
             * généralement remainingRecoveryDays = 0.
             *
             * Lorsqu'elle est réellement attribuée à un Actor,
             * le service de blessure pourra lancer recoveryFormula
             * et enregistrer ici la durée obtenue.
             */
            recovery: new SchemaField({

                /*
                 * Durée initialement déterminée.
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
                 * La blessure a été soignée dans le cadre
                 * du processus de guérison.
                 *
                 * Ce champ ne signifie pas nécessairement
                 * que la blessure est entièrement guérie.
                 */
                treatmentApplied: new BooleanField({
                    required: true,
                    initial: false
                }),

                /*
                 * La blessure n'a plus d'effet actif.
                 */
                healed: new BooleanField({
                    required: true,
                    initial: false
                })
            }),


            /*
             * État vital associé aux blessures fatales.
             *
             * Ces données concernent l'instance attribuée
             * au personnage.
             */
            death: new SchemaField({

                /*
                 * Les soins d'urgence ont stabilisé
                 * le personnage.
                 */
                stabilized: new BooleanField({
                    required: true,
                    initial: false
                }),

                /*
                 * Nombre de jets de Trépas déjà effectués.
                 *
                 * Utile pour l'historique et l'interface.
                 */
                rolls: new NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    min: 0,
                    initial: 0
                })
            })
        };
    }
}