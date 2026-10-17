import {
    MetroScrollStateMixin
} from "../applications/mixins/metro-scroll-state-mixin.mjs";

const {
    HandlebarsApplicationMixin
} = foundry.applications.api;

const {
    ItemSheetV2
} = foundry.applications.sheets;


/**
 * Classe de base des fiches Item Métro 2033.
 *
 * Cette classe centralise uniquement les comportements
 * communs à toutes les fiches Item du système.
 *
 * Convention UI Métro 2033 :
 *
 * - pas de bouton "Enregistrer" ;
 * - les modifications sont sauvegardées lorsque
 *   l'utilisateur ferme la fiche avec la X ;
 * - le titre de fenêtre affiche :
 *   "<Catégorie> : <Nom>".
 *
 * Les classes spécialisées restent responsables de :
 *
 * - leur template ;
 * - leur contexte ;
 * - leur présentation ;
 * - leurs éventuelles interactions spécifiques.
 */
export class MetroItemSheet
    extends MetroScrollStateMixin(
        HandlebarsApplicationMixin(
            ItemSheetV2
        )
    ) {

    static DEFAULT_OPTIONS = {

        classes: [
            "metro-2033",
            "metro-item-sheet"
        ],

        form: {
            closeOnSubmit: false
        },

        window: {
            resizable: true
        }
    };


    /**
     * Libellés métier des différents types d'Item.
     *
     * Ces libellés sont utilisés dans le titre
     * de la fenêtre Foundry.
     */
    static ITEM_TYPE_LABELS = {
        weapon: "Arme",
        armor: "Protection",
        ammunition: "Munition",
        equipment: "Outil",
        consumable: "Objet",
        talent: "Talent",
        archetype: "Archétype",
        criticalInjury: "Blessure Critique",
        psychologicalTrauma: "Trauma Psychologique",
        poison: "Poison",
        faction: "Faction",
        station: "Station"
    };


    /**
     * Titre affiché dans la barre de fenêtre Foundry.
     *
     * Exemples :
     *
     * "Talent : Tireur d'élite"
     * "Blessure Critique : Hémorragie"
     * "Trauma Psychologique : Claustrophobie"
     */
    get title() {

        const type =
            this.item?.type
            ?? this.document?.type
            ?? "";

        const name =
            this.item?.name
            ?? this.document?.name
            ?? "";

        const category =
            this.constructor.ITEM_TYPE_LABELS?.[type]
            ?? "Item";

        return `${category} : ${name}`;
    }


    /**
     * Enregistre les données du formulaire avant
     * la fermeture de la fiche.
     *
     * Une fiche non éditable ne déclenche aucune
     * mise à jour du document.
     */
    async _preClose(options) {

        if (this.isEditable) {

            await this.submit();

        }

        await super._preClose(options);
    }
}