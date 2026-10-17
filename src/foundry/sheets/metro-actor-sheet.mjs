import {
    MetroScrollStateMixin
} from "../applications/mixins/metro-scroll-state-mixin.mjs";

const {
    HandlebarsApplicationMixin
} = foundry.applications.api;

const {
    ActorSheetV2
} = foundry.applications.sheets;


/**
 * Classe de base des fiches Actor Métro 2033.
 *
 * Cette classe centralise uniquement les comportements
 * communs à toutes les fiches Actor du système.
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
 * - leurs interactions spécifiques.
 *
 * Aucune règle métier ne doit être implémentée ici.
 */
export class MetroActorSheet
    extends MetroScrollStateMixin(
        HandlebarsApplicationMixin(
            ActorSheetV2
        )
    ) {

    static DEFAULT_OPTIONS = {

        classes: [
            "metro-2033",
            "metro-actor-sheet"
        ],

        form: {
            closeOnSubmit: false
        },

        window: {
            resizable: true
        }
    };


    /**
     * Libellés métier des différents types d'Actor.
     */
    static ACTOR_TYPE_LABELS = {
        character: "PJ",
        npc: "PNJ",
        creature: "Créature",
        vehicle: "Véhicule"
    };


    /**
     * Titre affiché dans la barre de fenêtre Foundry.
     *
     * Exemple :
     * "PJ : Artyom"
     */
    get title() {

        const type =
            this.actor?.type
            ?? this.document?.type
            ?? "";

        const name =
            this.actor?.name
            ?? this.document?.name
            ?? "";

        const category =
            this.constructor.ACTOR_TYPE_LABELS?.[type]
            ?? "Actor";

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