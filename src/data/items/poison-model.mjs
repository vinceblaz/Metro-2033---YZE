const {
    NumberField,
    StringField
} = foundry.data.fields;


/**
 * DataModel d'un Poison Métro 2033 (livre, p.204-205).
 *
 * Une instance embarquée sur un Actor représente UNE
 * intoxication à effets COMPLETS en cours (1 point de dégâts par
 * round à l'attribut de son type, jusqu'à être Brisé). Un poison
 * à effets réduits ne crée jamais d'Item : son unique point de
 * dégâts est déjà entièrement résolu au moment du jet (cf.
 * `domain/rules/poison.mjs`).
 *
 * Plusieurs instances peuvent coexister sur un même Actor
 * (sources indépendantes cumulables — décision actée au backlog,
 * 02/10/2026), chacune portée par son propre Item plutôt que par
 * un simple état booléen, à la différence de l'Asphyxie.
 *
 * Retrait entièrement manuel par le MJ (décision actée,
 * 02/10/2026) : ni la fin de tour narrative ni un antidote ne
 * sont automatisés dans cette première version — le MJ supprime
 * l'Item quand il juge que le poison a cessé de faire effet.
 */
export class PoisonDataModel
    extends foundry.abstract.TypeDataModel {

    static defineSchema() {

        return {

            /*
             * Clé du type d'effet (livre, p.205) : "lethal",
             * "paralyzing", "sleep" ou "hallucinogenic" — cf.
             * `domain/rules/poison.mjs` (POISON_EFFECT_TYPES),
             * seule source de vérité pour l'attribut ciblé et le
             * texte des effets. Jamais de poison personnalisé
             * hors de ces 4 types.
             */
            effectType: new StringField({
                required: true,
                blank: false,
                initial: "lethal",
                choices: [
                    "lethal",
                    "paralyzing",
                    "sleep",
                    "hallucinogenic"
                ]
            }),


            /*
             * Toxicité du poison ayant déclenché cette instance.
             *
             * Purement informatif une fois l'instance créée (le
             * jet en opposition initial est déjà résolu) : utile
             * pour l'affichage et la traçabilité, sans incidence
             * sur les dégâts par round qui suivent (toujours 1
             * point, cf. domain/rules/poison.mjs).
             */
            toxicity: new NumberField({
                required: true,
                nullable: false,
                integer: true,
                min: 1,
                initial: 3
            }),


            /*
             * Libellé libre de la source (ex. "Morsure de
             * Vodianoï", "Dard empoisonné").
             *
             * Purement descriptif, à l'image de `sourceLabel`
             * dans les cartes de Chat de Terreur/Asphyxie.
             */
            sourceLabel: new StringField({
                required: true,
                blank: true,
                initial: ""
            })

        };

    }

}
