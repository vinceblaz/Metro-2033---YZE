import { isVehicleOutOfOrder, vehicleArmorAsProtectionValue }
    from "../../domain/rules/vehicle.mjs";

const {
    SchemaField,
    NumberField,
    StringField,
    ArrayField,
    HTMLField,
    BooleanField
} = foundry.data.fields;


export class VehicleDataModel
    extends foundry.abstract.TypeDataModel {


    static defineSchema() {

        return {

            // ====================================================
            // IDENTITÉ
            // ====================================================

            identity:
                new SchemaField({

                    /*
                     * Type de véhicule (table « VÉHICULES
                     * TYPES », p.211).
                     *
                     * Exemples :
                     * "Moto tout-terrain"
                     * "Jeep"
                     * "4x4"
                     * "Camion"
                     * "Véhicule blindé"
                     *
                     * String libre plutôt qu'un enum strict,
                     * pour permettre au MJ de décrire des
                     * variantes non listées dans le livre.
                     *
                     * Véhicules terrestres uniquement dans ce
                     * premier jalon : les véhicules aériens
                     * sont explicitement hors scope.
                     */
                    vehicleType:
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
            // CARACTÉRISTIQUES (table « VÉHICULES TYPES », p.211)
            // ====================================================

            stats:
                new SchemaField({

                    /*
                     * Déplacement.
                     *
                     * Valeur fixe (pas de current/max) : le
                     * Déplacement de base d'un véhicule ne se
                     * dégrade pas. Sa réduction éventuelle en
                     * zone encombrée est une résolution de
                     * jeu (cf. resolveVehicleDisplacement()),
                     * pas une donnée persistante.
                     */
                    displacement:
                        new NumberField({
                            required: true,
                            nullable: false,
                            integer: true,
                            min: 0,
                            initial: 2
                        }),

                    /*
                     * Le véhicule peut-il entrer en zone
                     * encombrée (Déplacement alors réduit à
                     * 1) ? Correspond au `*` de la table du
                     * livre (Moto tout-terrain, Jeep, 4x4).
                     */
                    reducedInEncumberedZone:
                        new BooleanField({
                            required: true,
                            initial: false
                        }),

                    /*
                     * Intégrité.
                     *
                     * Jauge current/max, comme les Attributs
                     * d'un Personnage/d'une Créature. Un
                     * véhicule est hors d'état (table
                     * « VÉHICULES HORS D'ÉTAT ») lorsque sa
                     * valeur courante atteint 0.
                     */
                    integrity:
                        new SchemaField({

                            value:
                                new NumberField({
                                    required: true,
                                    nullable: false,
                                    integer: true,
                                    min: 0,
                                    initial: 0
                                }),

                            max:
                                new NumberField({
                                    required: true,
                                    nullable: false,
                                    integer: true,
                                    min: 0,
                                    initial: 0
                                })

                        }),

                    /*
                     * Fiabilité.
                     *
                     * Valeur fixe propre au véhicule.
                     */
                    reliability:
                        new NumberField({
                            required: true,
                            nullable: false,
                            integer: true,
                            min: 0,
                            initial: 0
                        }),

                    /*
                     * Blindage.
                     *
                     * Valeur fixe. Sert également de valeur de
                     * Protection pour les occupants, comme un
                     * abri (règles p.211) — cf. le getter
                     * `protectionValue` ci-dessous.
                     */
                    armor:
                        new NumberField({
                            required: true,
                            nullable: false,
                            integer: true,
                            min: 0,
                            initial: 0
                        })

                }),


            // ====================================================
            // OCCUPANTS
            // ====================================================

            /*
             * Suivi structuré des occupants du véhicule, par
             * UUID d'Actor (et non purement narratif), pour
             * ouvrir la voie à une automatisation future
             * (ex : « occupant touché → Intégrité -1 »,
             * cf. resolveOccupantHitIntegrityLoss() dans
             * src/domain/rules/vehicle.mjs — non câblée dans
             * ce jalon).
             */
            occupants:
                new SchemaField({

                    /*
                     * UUID de l'Actor conducteur.
                     *
                     * Vide = pas de conducteur désigné.
                     */
                    driver:
                        new StringField({
                            required: true,
                            blank: true,
                            initial: ""
                        }),

                    /*
                     * UUID des Actors passagers.
                     */
                    passengers:
                        new ArrayField(
                            new StringField({
                                required: true,
                                blank: false
                            })
                        )

                }),


            // ====================================================
            // NOTES MJ
            // ====================================================

            /*
             * Visibles du seul MJ, par cohérence avec les
             * autres types de Document du système (Faction,
             * Station, Personnage, PNJ, Créature).
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
    // DONNÉES DÉRIVÉES
    // ============================================================

    /**
     * Le véhicule a-t-il atteint 0 d'Intégrité ?
     *
     * Déclenche normalement la table « VÉHICULES HORS D'ÉTAT »
     * (règles p.211). Ce jalon n'automatise pas le tirage :
     * ce getter est une donnée dérivée simple, exploitable par
     * un futur incrément ou consultée manuellement sur la
     * fiche.
     */
    get isOutOfOrder() {

        return isVehicleOutOfOrder({
            integrity: this.stats.integrity.value
        });

    }


    /**
     * Le Blindage sert de valeur de Protection pour les
     * occupants du véhicule, comme un abri (règles p.211).
     */
    get protectionValue() {

        return vehicleArmorAsProtectionValue({
            armor: this.stats.armor
        });

    }

}
