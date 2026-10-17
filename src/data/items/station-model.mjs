const {
    SchemaField,
    NumberField,
    StringField,
    HTMLField,
    ArrayField
} = foundry.data.fields;


/**
 * DataModel d'une Station Métro 2033.
 *
 * Une Station est un Item de référence décrivant un lieu
 * du métro (Polis, VDNKh, Rizhskaya...), ou plus largement
 * une communauté.
 *
 * Le nom et l'image sont portés directement par
 * Item.name et Item.img.
 *
 * Ce DataModel décrit uniquement les données persistantes.
 * Aucune règle métier n'est calculée ici.
 *
 * Une Station est référencée par un Personnage, via
 * system.affiliations.community (UUID).
 *
 * Le lien vers sa Faction contrôlante (controllingFaction)
 * n'est maintenu que dans ce sens (Station → Faction). La
 * fiche Faction n'affiche pas de liste automatique des
 * Stations qu'elle contrôle.
 *
 * Ce DataModel expose également les données de référence
 * du système "La Station" (règles p.218-221) : niveau de
 * Population, ressources (jauges 0-10) et personnel de
 * soutien. Ces données sont éditées manuellement : le Jet
 * de Population hebdomadaire, le contrecoup et le moral ne
 * sont volontairement pas automatisés dans cette première
 * version.
 */
export class StationDataModel
    extends foundry.abstract.TypeDataModel {

    /**
     * Structure d'une connexion vers une Station voisine
     * (tunnel, ligne...).
     */
    static _connectionField() {

        return new SchemaField({

            /*
             * UUID de l'Item Station voisin, ou texte libre
             * si la Station n'existe pas encore en tant que
             * Document.
             */
            station: new StringField({
                required: true,
                blank: true,
                initial: ""
            }),

            /*
             * Niveau de danger du trajet.
             *
             * Exemples :
             * "Sûr"
             * "Risqué"
             * "Mortel"
             *
             * String libre plutôt qu'un enum strict.
             */
            dangerLevel: new StringField({
                required: true,
                blank: true,
                initial: ""
            }),

            description: new StringField({
                required: true,
                blank: true,
                initial: ""
            })
        });
    }


    /**
     * Structure d'un PNJ notable de la Station.
     */
    static _npcField() {

        return new SchemaField({

            /*
             * UUID de l'Actor concerné.
             */
            actor: new StringField({
                required: true,
                blank: true,
                initial: ""
            }),

            /*
             * Rôle du PNJ au sein de la Station.
             *
             * Exemples :
             * "Chef de station"
             * "Marchand principal"
             */
            role: new StringField({
                required: true,
                blank: true,
                initial: ""
            })
        });
    }


    static defineSchema() {

        return {

            // ====================================================
            // DESCRIPTION
            // ====================================================

            /*
             * Description publique de la Station.
             *
             * Histoire, ambiance.
             *
             * Visible par les utilisateurs ayant accès à l'Item.
             */
            description: new HTMLField({
                required: true,
                blank: true,
                initial: ""
            }),

            /*
             * Ligne de métro sur laquelle se trouve la Station.
             *
             * String libre.
             */
            line: new StringField({
                required: true,
                blank: true,
                initial: ""
            }),

            /*
             * Population de la Station.
             *
             * Chapitre "La Station" (règles p.218-221) : la
             * Population est un NIVEAU (0 à 6), distinct du
             * nombre d'habitants qui en découle.
             *
             * - level : niveau de Population (0 à 6). Détermine
             *   notamment le nombre de dés du Jet de Population
             *   hebdomadaire.
             * - members : nombre de membres de la communauté
             *   (résultat du jet de la table officielle, ou
             *   estimation du MJ). Les PJ et le personnel de
             *   soutien n'y sont pas comptés.
             */
            population: new SchemaField({

                level: new NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    min: 0,
                    max: 6,
                    initial: 0
                }),

                members: new NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    min: 0,
                    initial: 0
                }),

                /*
                 * Dés de Stress de Moral à ajouter au PROCHAIN
                 * jet de Population (règles p.221), dus aux
                 * pertes de membres en contrecoup lors du
                 * dernier jet effectué. Consommés (remis à 0)
                 * dès que ce prochain jet est effectué.
                 *
                 * Chantier d'automatisation du système Station :
                 * seul champ ajouté à ce DataModel, les jauges
                 * de ressources/population/personnel de soutien
                 * existaient déjà (v0.9.0).
                 */
                pendingMoralStressDice: new NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    min: 0,
                    initial: 0
                })

            }),

            /*
             * Ressources de la Station.
             *
             * Jauges 0 à 10, comme les réserves de survie du
             * Personnage (règles p.218-219).
             *
             * Le Jet de Population hebdomadaire, le contrecoup
             * et le moral ne sont volontairement PAS automatisés
             * ici : ce DataModel n'expose que les données de
             * référence, éditées manuellement par le MJ/les
             * joueurs.
             */
            resources: new SchemaField({

                water: new NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    min: 0,
                    max: 10,
                    initial: 0
                }),

                food: new NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    min: 0,
                    max: 10,
                    initial: 0
                }),

                equipment: new NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    min: 0,
                    max: 10,
                    initial: 0
                }),

                energy: new NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    min: 0,
                    max: 10,
                    initial: 0
                }),

                medicine: new NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    min: 0,
                    max: 10,
                    initial: 0
                })

            }),

            /*
             * Personnel de soutien affilié à chaque ressource
             * (règles p.219).
             *
             * Chaque ressource dispose d'un personnel de soutien
             * dédié (Prospecteur pour l'Eau, Cultivateur-éleveur
             * pour la Nourriture, Ingénieur pour l'Équipement,
             * Technicien pour l'Énergie, Docteur pour les
             * Médicaments). Maximum 3 par ressource.
             *
             * Un PJ ne peut jamais être personnel de soutien.
             */
            supportPersonnel: new SchemaField({

                water: new NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    min: 0,
                    max: 3,
                    initial: 0
                }),

                food: new NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    min: 0,
                    max: 3,
                    initial: 0
                }),

                equipment: new NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    min: 0,
                    max: 3,
                    initial: 0
                }),

                energy: new NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    min: 0,
                    max: 3,
                    initial: 0
                }),

                medicine: new NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    min: 0,
                    max: 3,
                    initial: 0
                })

            }),

            /*
             * État général de la Station.
             *
             * Exemples :
             * "Prospère"
             * "En guerre"
             * "Abandonnée"
             * "Contaminée"
             *
             * String libre plutôt qu'un enum strict : ce champ
             * est purement narratif et n'est consulté par
             * aucune règle mécanique. La fiche Item propose
             * des suggestions courantes.
             */
            status: new StringField({
                required: true,
                blank: true,
                initial: ""
            }),

            /*
             * UUID de l'Item Faction contrôlant la Station.
             *
             * Vide = Station neutre / indépendante.
             */
            controllingFaction: new StringField({
                required: true,
                blank: true,
                initial: ""
            }),

            /*
             * Marché / spécialités commerciales.
             *
             * Biens échangés à cette Station.
             */
            market: new HTMLField({
                required: true,
                blank: true,
                initial: ""
            }),

            /*
             * Défenses et dangers.
             *
             * Fortifications, milices, menaces locales.
             */
            defenses: new HTMLField({
                required: true,
                blank: true,
                initial: ""
            }),


            // ====================================================
            // RELATIONS
            // ====================================================

            /*
             * Connexions vers des Stations voisines
             * (tunnels, lignes).
             */
            connections: new ArrayField(
                StationDataModel._connectionField()
            ),

            /*
             * PNJ notables de la Station.
             */
            notableNPCs: new ArrayField(
                StationDataModel._npcField()
            ),


            // ====================================================
            // NOTES MJ
            // ====================================================

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
            })
        };
    }


    // ============================================================
    // DONNÉES DÉRIVÉES
    // ============================================================

    /**
     * Station sans Faction contrôlante déclarée.
     */
    get isIndependent() {

        return this.controllingFaction === "";

    }
}
