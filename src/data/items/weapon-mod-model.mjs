const {
    SchemaField,
    NumberField,
    StringField,
    ArrayField,
    HTMLField
} = foundry.data.fields;


/**
 * DataModel d'une Amélioration d'équipement Métro 2033
 * (weaponMod).
 *
 * Livre p.213-214 (« AMÉLIORATIONS D'ARMES ») : une Amélioration
 * est attachée à UN équipement précis (Item weapon ou armor) du
 * même Actor. Elle fonctionne comme un talent/outil proposable
 * dans la fenêtre de préparation d'un jet impliquant cet
 * équipement :
 *
 * - AUCUN bonus chiffré n'est jamais ajouté automatiquement
 *   au jet par ce DataModel ni par les services qui le
 *   consomment : l'effet décrit par `description` reste
 *   purement narratif, appliqué par le MJ à la table ;
 * - si son utilisation nécessite une ressource (`resource.id`),
 *   celle-ci est décomptée sur l'Actor via les méthodes déjà
 *   existantes `actor.hasResource()` / `actor.consumeResource()`
 *   (réserve d'Énergie, system.survival.energy).
 *
 * `applicableTypes` déclare sur quels types d'Item embarqué
 * (weapon et/ou armor) cette Amélioration peut être attachée.
 * Le livre ne définit aucune Amélioration de Protection : seules
 * des entrées de type "weapon" existent aujourd'hui dans le
 * catalogue (cf. weapon-mod-catalog.mjs), mais l'infrastructure
 * reste générique.
 */
export class WeaponModDataModel
    extends foundry.abstract.TypeDataModel {


    static defineSchema() {

        return {

            // ====================================================
            // ATTACHEMENT
            // ====================================================

            /**
             * UUID Foundry de l'Item (weapon ou armor) auquel
             * cette Amélioration d'équipement est actuellement
             * attachée.
             *
             * Chaîne vide : non attachée.
             *
             * Référence par UUID, comme le fait déjà
             * weapon-model.mjs pour ammunitionReferenceUuid
             * (un Item embarqué dans le même Actor).
             */
            attachedItemUuid:
                new StringField({
                    required: true,
                    nullable: false,
                    blank: true,
                    initial: ""
                }),

            /**
             * Types d'Item embarqué sur lesquels cette
             * Amélioration peut être attachée.
             *
             * Le livre ne définit aujourd'hui aucune Amélioration
             * de Protection : toutes les entrées du catalogue
             * valent ["weapon"]. Le champ reste générique pour
             * permettre un futur contenu de Protection, sans
             * jamais en inventer un ici.
             */
            applicableTypes:
                new ArrayField(
                    new StringField({
                        required: true,
                        nullable: false,
                        blank: false,
                        choices: [
                            "weapon",
                            "armor"
                        ]
                    }),
                    {
                        required: true,
                        nullable: false,
                        initial: ["weapon"]
                    }
                ),


            // ====================================================
            // RESSOURCE
            // ====================================================

            /**
             * Ressource éventuellement nécessaire à l'utilisation
             * de cette Amélioration d'arme.
             */
            resource:
                new SchemaField({

                    /**
                     * Identifiant de ressource sur
                     * actor.system.survival (ex. "energy").
                     *
                     * Chaîne vide : aucune ressource requise.
                     */
                    id:
                        new StringField({
                            required: true,
                            nullable: false,
                            blank: true,
                            initial: ""
                        }),

                    /**
                     * Quantité nécessaire à chaque utilisation.
                     */
                    amount:
                        new NumberField({
                            required: true,
                            nullable: false,
                            integer: true,
                            min: 0,
                            initial: 1
                        })

                }),


            // ====================================================
            // ENCOMBREMENT
            // ====================================================

            /**
             * Le livre précise que les Améliorations d'arme
             * n'ajoutent pas de poids à l'arme : la valeur par
             * défaut reste 0, mais le champ est conservé pour
             * rester homogène avec les autres Items.
             */
            weight:
                new NumberField({
                    required: true,
                    nullable: false,
                    min: 0,
                    initial: 0
                }),


            // ====================================================
            // DESCRIPTION
            // ====================================================

            /**
             * Texte d'effet/bonus verbatim du livre, affiché en
             * info-bulle dans la fenêtre de préparation d'un jet.
             */
            description:
                new HTMLField({
                    required: false,
                    nullable: false,
                    initial: ""
                }),

            /**
             * Notes privées réservées au MJ.
             *
             * La restriction d'affichage sera gérée par
             * WeaponModSheet.
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
     * Cette Amélioration d'équipement est-elle actuellement
     * attachée à un équipement ?
     */
    get isAttached() {

        return !!this.attachedItemUuid;

    }


    /**
     * Cette Amélioration d'équipement nécessite-t-elle une
     * ressource pour être utilisée ?
     */
    get requiresResource() {

        return !!this.resource.id;

    }

}
