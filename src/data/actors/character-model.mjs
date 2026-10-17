const {
    SchemaField,
    NumberField,
    StringField,
    ArrayField,
    HTMLField,
    BooleanField
} = foundry.data.fields;


/**
 * DataModel d'un personnage Métro 2033.
 *
 * Ce modèle décrit uniquement les données persistantes
 * propres au personnage.
 *
 * Les règles métier ne sont volontairement pas appliquées ici.
 *
 * Exemples :
 * - règles de création ;
 * - progression par expérience ;
 * - encombrement ;
 * - états de combat ;
 * - compatibilité des munitions ;
 * - etc.
 *
 * Ces règles sont gérées par les services métier / Actor.
 *
 * Les Talents, Blessures critiques et Traumatismes psychiques
 * sont représentés par des Items embarqués dans l'Actor.
 */
export class CharacterDataModel extends foundry.abstract.TypeDataModel {

    static defineSchema(

    ) {

        /*
         * Attribut
         *
         * value = valeur actuelle
         * max   = valeur maximale
         */
        const attributeField = () => new SchemaField({

            value: new NumberField({
                required: true,
                nullable: false,
                integer: true,
                min: 0,
                max: 5,
                initial: 4
            }),

            max: new NumberField({
                required: true,
                nullable: false,
                integer: true,
                min: 1,
                max: 5,
                initial: 4
            })
        });


        /*
         * Compétence
         */
        const skillField = () => new NumberField({

            required: true,
            nullable: false,
            integer: true,
            min: 0,
            max: 5,
            initial: 0

        });


        /*
         * Relation avec un autre Actor.
         *
         * actor
         *   UUID de l'Actor lié.
         *
         * type
         *   Type métier de la relation.
         *   Exemples :
         *   - buddy
         *   - comrade
         *   - rival
         *
         * description
         *   Texte libre associé à la relation.
         */
        const relationshipField = () => new SchemaField({

            actor: new StringField({
                required: true,
                blank: true,
                initial: ""
            }),

            type: new StringField({
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


        return {

            /*
             * Identité
             *
             * Le nom et l'image du personnage sont portés
             * directement par Actor.name et Actor.img.
             */
            identity: new SchemaField({

                age: new NumberField({
                    required: true,
                    integer: true,
                    min: 0,
                    initial: 25
                }),               

                /*
                 * Valeur actuellement prévue dans la fiche :
                 * - Homme
                 * - Femme
                 *
                 * Le DataModel reste volontairement permissif.
                 */
                gender: new StringField({
                    required: true,
                    blank: true,
                    initial: ""
                }),

                appearance: new StringField({
                    required: true,
                    blank: true,
                    initial: ""
                }),

                biography: new HTMLField({
                    required: true,
                    blank: true,
                    initial: ""
                })
            }),


            /*
             * Affiliations
             *
             * faction
             *   UUID du document représentant la faction.
             *
             * community
             *   UUID du document représentant la
             *   communauté / station.
             *
             * Les deux affiliations sont facultatives.
             */
            affiliations: new SchemaField({

                faction: new StringField({
                    required: true,
                    blank: true,
                    initial: ""
                }),

                community: new StringField({
                    required: true,
                    blank: true,
                    initial: ""
                })
            }),


            /*
             * Attributs
             */
            attributes: new SchemaField({

                vigor: attributeField(),

                agility: attributeField(),

                spirit: attributeField(),

                empathy: attributeField()
            }),


            /*
             * Compétences
             */
            skills: new SchemaField({

                repair: skillField(),

                closeCombat: skillField(),

                endurance: skillField(),

                stealth: skillField(),

                reaction: skillField(),

                shooting: skillField(),

                comprehension: skillField(),

                observation: skillField(),

                survival: skillField(),

                analysis: skillField(),

                manipulation: skillField(),

                medicine: skillField()
            }),


            /*
             * Stress et Sang-froid
             */
            stress: new SchemaField({

                /*
                 * Dés de Stress actuels.
                 */
                dice: new NumberField({
                    required: true,
                    integer: true,
                    min: 0,
                    max: 5,
                    initial: 0
                }),

                /*
                 * Sang-froid.
                 */
                composure: new SchemaField({

                    /*
                     * Plafond du schéma = 7 : la limite réelle
                     * (`max`) vaut 5, 6 ou 7 selon le Talent
                     * Maîtrise de soi (cf. actor.mjs,
                     * `_applyComposureMaxFromTalents`). Un plafond
                     * à 5 interdisait d'enregistrer 6 ou 7 et
                     * empêchait d'atteindre la limite relevée.
                     */
                    current: new NumberField({
                        required: true,
                        integer: true,
                        min: 0,
                        max: 7,
                        initial: 0
                    }),

                    max: new NumberField({
                        required: true,
                        integer: true,
                        min: 1,
                        max: 5,
                        initial: 5
                    })
                }),

                breakingPoint: new NumberField({
                    required: true,
                    integer: true,
                    min: 0,
                    max: 1,
                    initial: 0
                })
            }),


            /*
             * Données narratives
             */
            narrative: new SchemaField({

                /*
                 * Note privée du MJ.
                 *
                 * La restriction d'affichage est gérée
                 * par la fiche Actor, pas par le DataModel.
                 */
                gmNotes: new HTMLField({
                    required: true,
                    blank: true,
                    initial: ""
                }),

                /*
                 * Fierté.
                 */
                pride: new SchemaField({

                    description: new StringField({
                        required: true,
                        blank: true,
                        initial: ""
                    }),

                    used: new NumberField({
                        required: true,
                        integer: true,
                        min: 0,
                        max: 1,
                        initial: 0
                    })
                }),

                /*
                 * Honte.
                 */
                shame: new StringField({
                    required: true,
                    blank: true,
                    initial: ""
                }),

                /*
                 * Relations avec les PJ / PNJ.
                 *
                 * Chaque relation pointe vers un Actor
                 * au moyen de son UUID.
                 */
                relationships: new ArrayField(
                    relationshipField()
                )
            }),


            /*
             * Ressources de survie
             *
             * Jauges de réserve (0 à 10) : Eau, Nourriture,
             * Énergie.
             *
             * Les filtres à air ne sont PAS suivis ici : ce
             * sont des objets Consommables (quantité/doses),
             * pas une ressource à jauge.
             */
            survival: new SchemaField({

                food: new NumberField({
                    required: true,
                    integer: true,
                    min: 0,
                    max: 10,
                    initial: 0
                }),

                water: new NumberField({
                    required: true,
                    integer: true,
                    min: 0,
                    max: 10,
                    initial: 0
                }),

                energy: new NumberField({
                    required: true,
                    integer: true,
                    min: 0,
                    max: 10,
                    initial: 0
                })
            }),


            /*
             * Monnaie
             *
             * Balles de qualité militaire.
             *
             * Elles peuvent également être utilisées comme
             * munitions lorsque les règles le permettent.
             */
            currency: new SchemaField({

                militaryBullets: new NumberField({
                    required: true,
                    integer: true,
                    min: 0,
                    initial: 0
                })
            }),


            /*
             * États persistants du personnage.
             *
             * Ils doivent être directement visibles et
             * modifiables depuis la fiche Actor.
             *
             * Les services métier peuvent également les modifier.
             */
            conditions: new SchemaField({

                hungry: new BooleanField({
                    required: true,
                    initial: false
                }),

                dehydrated: new BooleanField({
                    required: true,
                    initial: false
                }),

                exhausted: new BooleanField({
                    required: true,
                    initial: false
                }),

                frozen: new BooleanField({
                    required: true,
                    initial: false
                }),

                /*
                 * Au sol.
                 */
                prone: new BooleanField({
                    required: true,
                    initial: false
                }),

                /*
                 * Saisi / agrippé.
                 *
                 * La synchronisation avec GrappleService
                 * sera assurée par la couche métier.
                 */
                grappled: new BooleanField({
                    required: true,
                    initial: false
                }),

                /*
                 * Étourdi.
                 */
                stunned: new BooleanField({
                    required: true,
                    initial: false
                })
            }),


            /*
             * Radiation
             */
            radiation: new SchemaField({

                doses: new NumberField({
                    required: true,
                    integer: true,
                    min: 0,
                    initial: 0
                }),

                /*
                 * Doses de Radiation devenues permanentes.
                 *
                 * Compteur illimité (pas de plafond) : chaque
                 * tentative d'élimination d'une dose de Radiation
                 * peut, selon la règle (p.206), la rendre
                 * permanente au lieu de l'éliminer. Ce risque
                 * peut se répéter plusieurs fois au cours d'une
                 * campagne, d'où l'absence de plafond ici.
                 */
                permanent: new NumberField({
                    required: true,
                    integer: true,
                    min: 0,
                    initial: 0
                })
            }),


            /*
             * Progression
             *
             * available
             *   XP actuellement disponible.
             *
             * spent
             *   XP déjà dépensée.
             *
             * Le total n'est volontairement PAS persisté :
             *
             * total = available + spent
             *
             * La fiche affichera cette valeur calculée.
             *
             * Si le total est modifié manuellement :
             *
             * available = nouveauTotal - spent
             */
            progression: new SchemaField({

                xp: new SchemaField({

                    available: new NumberField({
                        required: true,
                        integer: true,
                        min: 0,
                        initial: 0
                    }),

                    spent: new NumberField({
                        required: true,
                        integer: true,
                        min: 0,
                        initial: 0
                    })
                }),

                /*
                 * Historique textuel temporaire.
                 *
                 * Nous pourrons le structurer davantage lorsque
                 * le système de dépense d'XP sera développé.
                 */
                history: new ArrayField(
                    new StringField({
                        blank: true
                    })
                )
            })
        };
    }
}