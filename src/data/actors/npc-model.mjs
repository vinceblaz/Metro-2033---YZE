const {
    SchemaField,
    NumberField,
    StringField,
    HTMLField
} = foundry.data.fields;


/**
 * DataModel d'un Personnage Non-Joueur (PNJ) Métro 2033.
 *
 * Un PNJ utilise exactement le même système qu'un Personnage
 * (Attributs 0-5, Compétences 0-5) : le livre de règles ne
 * prévoit aucune statistique simplifiée séparée pour les PNJ
 * (« Les personnages non joueurs utilisent leurs compétences
 * de la même façon que les PJ », p.193).
 *
 * Les Talents, armes et protections restent, comme pour le
 * Personnage, de simples Items embarqués dans l'Actor : ils
 * ne nécessitent donc aucun champ dédié dans ce DataModel, et
 * le moteur de bonus de Talents (src/domain/rules/talents.mjs)
 * s'applique sans aucune adaptation, puisqu'il ne lit jamais
 * directement les champs du DataModel du Personnage.
 *
 * Volontairement absents de ce DataModel, à la différence du
 * Personnage : progression par XP, Archétype, Blessures
 * critiques/Traumatismes détaillés, Survie, Biographie. Un
 * PNJ est conçu pour être rempli rapidement par le MJ ; ces
 * aspects restent gérés narrativement à la table.
 *
 * Les règles métier ne sont volontairement pas appliquées ici.
 */
export class NpcDataModel extends foundry.abstract.TypeDataModel {

    static defineSchema() {

        /*
         * Attribut
         *
         * value = valeur actuelle
         * max   = valeur maximale
         *
         * Échelle strictement identique à celle du Personnage
         * (0-5), contrairement à la Créature qui peut dépasser
         * l'échelle humaine.
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


        return {

            /*
             * Identité
             *
             * Le nom et l'image du PNJ sont portés
             * directement par Actor.name et Actor.img.
             */
            identity: new SchemaField({

                role: new StringField({
                    required: true,
                    blank: true,
                    initial: ""
                }),

                description: new HTMLField({
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
             * Notes / capacités spéciales.
             *
             * Champ libre, visible de tous : à la place des
             * Talents/Blessures critiques/Traumas détaillés du
             * Personnage, pour noter en quelques mots un
             * comportement ou une capacité particulière.
             */
            special: new HTMLField({
                required: true,
                blank: true,
                initial: ""
            }),


            /*
             * Notes MJ, visibles du seul MJ.
             */
            gmNotes: new HTMLField({
                required: true,
                blank: true,
                initial: ""
            })

        };

    }

}
