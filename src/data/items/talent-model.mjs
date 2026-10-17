/**
 * Modèle de données d'un Talent.
 *
 * Le Talent Item définit notamment :
 *
 * - son identifiant fonctionnel stable ;
 * - son niveau maximal ;
 * - son archétype éventuel ;
 * - sa description ;
 * - son texte d'effet ;
 * - sa note MJ ;
 * - sa configuration éventuelle.
 *
 * Le niveau réellement possédé par un Actor
 * ne doit pas être stocké dans la définition
 * du Talent.
 *
 * Un même Talent pourra être acquis
 * plusieurs fois par un Actor,
 * jusqu'à atteindre son niveau maximal.
 *
 * Les effets mécaniques réels du Talent
 * restent définis séparément dans le domaine.
 *
 * Les anciens champs `level`
 * et `hasAdvancedLevel` sont conservés
 * temporairement pendant la migration.
 */
export class TalentDataModel
    extends foundry.abstract.TypeDataModel {


    static defineSchema() {

        const fields =
            foundry.data.fields;


        return {

            /**
             * Identifiant fonctionnel stable.
             *
             * Exemples :
             *
             * "brute"
             * "rapidFire"
             * "favoriteWeapon"
             *
             * Cet identifiant est utilisé
             * par les règles métier.
             */
            key:
                new fields.StringField({
                    required: true,
                    nullable: false,
                    initial: ""
                }),


            /**
             * Niveau maximal que ce Talent
             * peut atteindre.
             *
             * Le niveau réellement possédé
             * par un Actor n'est pas stocké ici.
             *
             * 1 = Talent sans progression.
             * 2 à 5 = Talent pouvant être acquis
             * plusieurs fois jusqu'à cette limite.
             */
            maxLevel:
                new fields.NumberField({
                    required: true,
                    nullable: false,
                    initial: 1,
                    integer: true,
                    min: 1,
                    max: 5
                }),


            /**
             * LEGACY — À SUPPRIMER APRÈS MIGRATION.
             *
             * Ancien niveau stocké directement
             * dans l'Item Talent.
             */
            level:
                new fields.NumberField({
                    required: true,
                    nullable: false,
                    initial: 1,
                    integer: true,
                    min: 1,
                    max: 2
                }),


            /**
             * LEGACY — À SUPPRIMER APRÈS MIGRATION.
             *
             * Ancienne indication qu'un Talent
             * possédait un niveau Supérieur.
             */
            hasAdvancedLevel:
                new fields.BooleanField({
                    required: true,
                    nullable: false,
                    initial: false
                }),


            /**
             * Archétype auquel le Talent
             * est normalement réservé.
             *
             * Chaîne vide :
             * Talent général.
             *
             * Sinon :
             * identifiant canonique
             * d'archétype.
             *
             * Exemples :
             *
             * "soldier"
             * "mechanic"
             * "medic"
             *
             * L'autorisation réelle d'acquisition
             * reste une décision du MJ.
             */
            archetypeId:
                new fields.StringField({
                    required: true,
                    nullable: false,
                    initial: ""
                }),


            /**
             * Description narrative du Talent.
             *
             * Ce contenu pourra notamment être
             * utilisé pour l'aperçu au survol
             * dans la CharacterSheet.
             */
            description:
                new fields.HTMLField({
                    required: true,
                    nullable: false,
                    initial: ""
                }),


            /**
             * Texte décrivant l'effet
             * ou la règle du Talent.
             *
             * Ce champ est informatif.
             *
             * La logique mécanique réelle
             * reste dans domain/rules/talents.mjs.
             */
            effect:
                new fields.HTMLField({
                    required: true,
                    nullable: false,
                    initial: ""
                }),


            /**
             * Note privée du MJ.
             *
             * La restriction d'affichage
             * et d'édition sera assurée
             * par la TalentSheet.
             */
            gmNotes:
                new fields.HTMLField({
                    required: true,
                    blank: true,
                    initial: ""
                }),


            /**
             * Configuration propre à l'instance
             * du Talent.
             *
             * Certains Talents peuvent être
             * acquis plusieurs fois avec
             * des configurations différentes.
             *
             * Exemple :
             *
             * Arme de prédilection :
             *
             * {
             *     weaponCategory: "rifle"
             * }
             *
             * Aucun comportement métier
             * n'est codé dans ce schéma.
             */
            configuration:
                new fields.SchemaField({

                    weaponCategory:
                        new fields.StringField({
                            required: true,
                            nullable: false,
                            initial: ""
                        }),

                    weaponType:
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
                        }),

                    attribute:
                        new fields.StringField({
                            required: true,
                            nullable: false,
                            initial: ""
                        }),

                    custom:
                        new fields.StringField({
                            required: true,
                            nullable: false,
                            initial: ""
                        })

                })

        };

    }


    /**
     * Le Talent est-il actuellement
     * au niveau Supérieur ?
     */
    get isAdvanced() {

        return (
            this.level === 2
        );

    }


    /**
     * Le Talent peut-il encore
     * être amélioré ?
     *
     * Ce getter ne vérifie pas
     * les XP ou une autorisation MJ.
     *
     * Il ne répond qu'à la question
     * structurelle du Talent.
     */
    get canAdvance() {

        return (
            this.hasAdvancedLevel
            && this.level === 1
        );

    }


    /**
     * Le Talent est-il général ?
     */
    get isGeneralTalent() {

        return (
            !this.archetypeId
        );

    }


    /**
     * Retourne une configuration propre
     * et facilement exploitable
     * par les règles métier.
     */
    get talentConfiguration() {

        return {

            weaponCategory:
                this.configuration
                    ?.weaponCategory
                ?? "",

            weaponType:
                this.configuration
                    ?.weaponType
                ?? "",

            skill:
                this.configuration
                    ?.skill
                ?? "",

            attribute:
                this.configuration
                    ?.attribute
                ?? "",

            custom:
                this.configuration
                    ?.custom
                ?? ""

        };

    }

}