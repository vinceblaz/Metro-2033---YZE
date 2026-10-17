import {
    compareMetroInitiative
} from "../domain/rules/metro-initiative-sort.mjs";

import {
    getOrCreateFoundryMetroInitiativeDeck
} from "../foundry/initiative/metro-initiative-deck.mjs";

import {
    rollMetroInitiativeForCombatants
} from "../foundry/initiative/metro-combat-initiative.mjs";

import {
    getCombatInitiativeAssignments,
    releaseCombatInitiativeAssignments
} from "../foundry/initiative/metro-initiative-assignment-application.mjs";


/**
 * Document Combat du système Métro 2033.
 *
 * Combatant.initiative conserve la valeur
 * réelle de la carte d'initiative.
 *
 * Le Combat Tracker est trié selon la règle
 * Métro : la valeur la plus faible agit
 * en premier.
 */
export class MetroCombat extends Combat {

    /**
     * Point d'extension Foundry v14 utilisé
     * par Combat.setupTurns().
     */
    _sortCombatants(
        a,
        b
    ) {

        return compareMetroInitiative(
            a,
            b
        );
    }


    /**
     * Remplace le jet d'initiative standard
     * de Foundry par le tirage des cartes
     * d'initiative de Métro 2033.
     *
     * La signature reste compatible avec
     * Combat.rollInitiative() de Foundry v14.
     *
     * Les options de jet de dés et de message
     * ne sont volontairement pas utilisées :
     * Métro 2033 ne lance pas de dé
     * d'initiative.
     *
     * Une fois le Combat commencé, aucune
     * nouvelle distribution d'initiative
     * n'est autorisée.
     *
     * Les cartes attribuées restent donc
     * conservées pendant toute la durée
     * du conflit, y compris lors des
     * changements de round.
     */
    async rollInitiative(
        ids,
        {
            formula = null,
            updateTurn = true,
            messageMode,
            messageOptions = {}
        } = {}
    ) {

        ids =
            typeof ids === "string"
                ? [ids]
                : ids;


        if (
            !Array.isArray(
                ids
            )
        ) {

            throw new TypeError(
                "La liste des Combatants est nécessaire."
            );

        }


        /*
         * Ces paramètres appartiennent au
         * contrat Foundry v14.
         *
         * Ils restent acceptés afin que les
         * appels natifs du Combat Tracker,
         * rollAll() et rollNPC() demeurent
         * compatibles.
         *
         * Ils ne pilotent aucun jet de dés.
         */
        void formula;
        void updateTurn;
        void messageMode;
        void messageOptions;


        /*
         * L'initiative Métro est distribuée
         * avant le début du conflit.
         *
         * Une fois le Combat commencé,
         * les cartes déjà attribuées sont
         * conservées jusqu'à sa fin.
         *
         * Cela empêche notamment les appels
         * natifs ultérieurs du Combat Tracker
         * de redistribuer une initiative.
         */
        if (this.started) {

            return this;

        }


        const ownedCombatantIds =
            ids.filter(
                id => {

                    const combatant =
                        this.combatants.get(
                            id
                        );


                    return Boolean(
                        combatant?.isOwner
                    );
                }
            );


        if (
            ownedCombatantIds.length === 0
        ) {

            return this;
        }


        const deck =
            await getOrCreateFoundryMetroInitiativeDeck();


        await rollMetroInitiativeForCombatants({
            combat:
                this,

            deck,

            combatantIds:
                ownedCombatantIds
        });


        return this;
    }


    /**
     * Libère les attributions d'initiative
     * appartenant exclusivement à ce Combat.
     *
     * Cette méthode constitue la frontière
     * interne entre le cycle de vie du
     * Document Combat et le service Foundry
     * chargé des cartes d'initiative.
     *
     * La sélection des cartes à restituer
     * repose exclusivement sur les
     * initiativeAssignments du Combat.
     *
     * Un Combat ne possédant aucune
     * attribution n'a rien à restituer :
     * dans ce cas, aucun accès au paquet
     * d'initiative n'est effectué.
     *
     * Aucun recall global du paquet n'est
     * effectué.
     */
    async _releaseMetroInitiativeAssignments() {

        const assignments =
            getCombatInitiativeAssignments(
                this
            );


        if (
            assignments.length === 0
        ) {

            return {
                releasedCardIds: []
            };

        }


        return releaseCombatInitiativeAssignments({
            combat:
                this
        });
    }


    /**
     * Libère l'initiative Métro avant la
     * suppression définitive du Combat.
     *
     * Les cartes doivent être rendues pendant
     * que le Combat et ses attributions
     * persistantes existent encore.
     *
     * Le workflow parent Foundry n'est
     * poursuivi qu'après une libération
     * réussie.
     *
     * Une erreur de libération est propagée :
     * super._preDelete() n'est alors pas
     * appelé.
     */
    async _preDelete(
        options,
        user
    ) {

        await this._releaseMetroInitiativeAssignments();


        return super._preDelete(
            options,
            user
        );
    }
}