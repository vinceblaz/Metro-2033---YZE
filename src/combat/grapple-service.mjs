import {
    createGrappleState,
    resolveGrappleEscape
} from "../domain/rules/grapple-state.mjs";
//,    isActiveGrappleState

import {
    getGrappleActionState,
    canMoveDuringGrapple,
    canPerformActionDuringGrapple
} from "../domain/rules/grapple-actions.mjs";

const SYSTEM_ID =
    "metro-2033-yze";

const FLAG_KEY =
    "activeGrapples";


export class GrappleService {

    static getActiveGrapples(
        combat
    ) {

        if (!combat) {
            return [];
        }


        return foundry.utils.deepClone(
            combat.getFlag(
                SYSTEM_ID,
                FLAG_KEY
            ) ?? []
        );

    }


    static getGrappleForActor(
        combat,
        actor
    ) {

        if (
            !combat
            || !actor
        ) {
            return null;
        }


        return (
            this.getActiveGrapples(
                combat
            ).find(
                entry =>
                    entry.state?.active === true
                    && (
                        entry.state.attacker?.actorId
                            === actor.id
                        || entry.state.target?.actorId
                            === actor.id
                    )
            )
            ?? null
        );

    }


    static getGrappleBetween(
        combat,
        attacker,
        target
    ) {

        if (
            !combat
            || !attacker
            || !target
        ) {
            return null;
        }


        return (
            this.getActiveGrapples(
                combat
            ).find(
                entry =>
                    entry.state?.active === true
                    && entry.state.attacker?.actorId
                        === attacker.id
                    && entry.state.target?.actorId
                        === target.id
            )
            ?? null
        );

    }


    static isActorGrappled(
        combat,
        actor
    ) {

        return (
            this.getGrappleForActor(
                combat,
                actor
            ) !== null
        );

    }


    static _getActorCombatant(
        combat,
        actor
    ) {

        return (
            combat.combatants.find(
                combatant =>
                    combatant.actorId
                    === actor.id
            )
            ?? null
        );

    }


    static _getEquippedWeapons(
        actor
    ) {

        return actor.items.filter(
            item =>
                item.type === "weapon"
                && item.system?.equipped === true
        );

    }


    static async establish({
        combat = game.combat,
        attacker,
        target,
        disarmItem = null
    } = {}) {

        if (!combat) {
            throw new Error(
                "Un combat actif est nécessaire pour établir une saisie."
            );
        }


        if (!attacker) {
            throw new TypeError(
                "Le saisisseur est nécessaire."
            );
        }


        if (!target) {
            throw new TypeError(
                "La cible est nécessaire."
            );
        }


        if (
            attacker.id
            === target.id
        ) {
            throw new Error(
                "Un Actor ne peut pas se saisir lui-même."
            );
        }


        const attackerCombatant =
            this._getActorCombatant(
                combat,
                attacker
            );

        const targetCombatant =
            this._getActorCombatant(
                combat,
                target
            );


        if (!attackerCombatant) {
            throw new Error(
                "Le saisisseur n'est pas présent dans le combat."
            );
        }


        if (!targetCombatant) {
            throw new Error(
                "La cible n'est pas présente dans le combat."
            );
        }


        /*
         * Pour l'instant, un Actor ne peut être
         * impliqué que dans une saisie active.
         */
        if (
            this.isActorGrappled(
                combat,
                attacker
            )
        ) {
            throw new Error(
                "Le saisisseur est déjà impliqué dans une saisie."
            );
        }


        if (
            this.isActorGrappled(
                combat,
                target
            )
        ) {
            throw new Error(
                "La cible est déjà impliquée dans une saisie."
            );
        }


        /*
         * État domaine.
         */
        const domainState =
            createGrappleState({
                attacker,
                target
            });


        const state = {

            active:
                domainState.active,

            attacker: {
                actorId:
                    attacker.id,

                actorUuid:
                    attacker.uuid,

                combatantId:
                    attackerCombatant.id,

                name:
                    attacker.name
            },

            target: {
                actorId:
                    target.id,

                actorUuid:
                    target.uuid,

                combatantId:
                    targetCombatant.id,

                name:
                    target.name
            },

            consequences:
                domainState.consequences,

            attackerActions:
                domainState.attackerActions,

            targetActions:
                domainState.targetActions,

            grappleAttack:
                domainState.grappleAttack,

            escape:
                domainState.escape
        };


        /*
         * Conséquence immédiate :
         * les deux tombent au sol.
         */
        await attacker.applyKnockdown();

        await target.applyKnockdown();


        /*
         * Conséquence immédiate :
         * la cible lâche l'arme qu'elle tient.
         *
         * Si une seule arme est équipée,
         * nous pouvons la sélectionner
         * automatiquement.
         */
        const equippedWeapons =
            this._getEquippedWeapons(
                target
            );


        let selectedDisarmItem =
            disarmItem;


        if (
            selectedDisarmItem
            && selectedDisarmItem.parent?.id
                !== target.id
        ) {
            throw new Error(
                "L'objet à lâcher n'appartient pas à la cible."
            );
        }


        if (
            !selectedDisarmItem
            && equippedWeapons.length === 1
        ) {
            selectedDisarmItem =
                equippedWeapons[0];
        }


        let disarmResult =
            null;


        if (selectedDisarmItem) {

            disarmResult =
                await target.applyDisarm(
                    selectedDisarmItem
                );

        }

        else if (
            equippedWeapons.length > 1
        ) {

            disarmResult = {
                applied:
                    false,

                pending:
                    true,

                reason:
                    "held-weapon-selection-required",

                candidates:
                    equippedWeapons.map(
                        item => ({
                            id:
                                item.id,

                            name:
                                item.name
                        })
                    )
            };

        }

        else {

            disarmResult = {
                applied:
                    false,

                pending:
                    false,

                reason:
                    "no-equipped-weapon"
            };

        }


        /*
         * Persistance sur le Combat.
         */
        const grapples =
            this.getActiveGrapples(
                combat
            );


        const entry = {

            id:
                foundry.utils.randomID(),

            createdRound:
                combat.round ?? 0,

            state,

            disarm:
                disarmResult
        };


        grapples.push(
            entry
        );


        await combat.setFlag(
            SYSTEM_ID,
            FLAG_KEY,
            grapples
        );


        return {
            established:
                true,

            grappleId:
                entry.id,

            combatId:
                combat.id,

            createdRound:
                entry.createdRound,

            state:
                entry.state,

            disarm:
                entry.disarm
        };

    }


    static async resolveEscape(
        combat,
        grappleId,
        {
            targetSuccesses,
            attackerSuccesses
        } = {}
    ) {

        if (!combat) {
            throw new Error(
                "Un combat actif est nécessaire."
            );
        }


        if (!grappleId) {
            throw new TypeError(
                "L'identifiant de la saisie est nécessaire."
            );
        }


        const grapples =
            this.getActiveGrapples(
                combat
            );


        const grappleIndex =
            grapples.findIndex(
                grapple =>
                    grapple.id
                    === grappleId
            );


        if (
            grappleIndex < 0
        ) {
            throw new Error(
                "Saisie active introuvable."
            );
        }


        const grapple =
            grapples[
                grappleIndex
            ];


        const resolution =
            resolveGrappleEscape({
                state:
                    grapple.state,

                targetSuccesses,

                attackerSuccesses
            });


        /*
        * Si la cible ne gagne pas l'opposition,
        * la saisie reste exactement telle quelle.
        */
        if (
            resolution.escaped
            !== true
        ) {

            return {
                grappleId:
                    grapple.id,

                escaped:
                    false,

                resolved:
                    true,

                tie:
                    resolution.tie,

                targetSuccesses:
                    resolution.targetSuccesses,

                attackerSuccesses:
                    resolution.attackerSuccesses,

                margin:
                    resolution.margin,

                state:
                    grapple.state
            };

        }


        /*
        * La cible a gagné :
        * on persiste l'état libéré.
        */
        const updatedGrapple = {
            ...grapple,

            state:
                resolution.state
        };


        const updatedGrapples = [
            ...grapples
        ];


        updatedGrapples[
            grappleIndex
        ] = updatedGrapple;


        await combat.setFlag(
            SYSTEM_ID,
            FLAG_KEY,
            updatedGrapples
        );


        return {
            grappleId:
                grapple.id,

            escaped:
                true,

            resolved:
                true,

            tie:
                false,

            targetSuccesses:
                resolution.targetSuccesses,

            attackerSuccesses:
                resolution.attackerSuccesses,

            margin:
                resolution.margin,

            state:
                resolution.state
        };
    }  
    
    /**
    * Retourne les contraintes de saisie
    * actuellement applicables à un Actor.
    *
    * Si l'Actor n'est impliqué dans aucune
    * saisie active, retourne l'état libre
    * fourni par le domaine.
    */
    static getActionState(
        combat,
        actor
    ) {

        if (!actor) {

            throw new TypeError(
                "getActionState nécessite un Actor."
            );

        }


        const grapple =
            this.getGrappleForActor(
                combat,
                actor
            );


        return getGrappleActionState(
            grapple,
            actor
        );

    }


    /**
     * Indique si un Actor peut se déplacer
     * compte tenu d'une éventuelle saisie.
     */
    static canActorMove(
        combat,
        actor
    ) {

        if (!actor) {

            throw new TypeError(
                "canActorMove nécessite un Actor."
            );

        }


        const grapple =
            this.getGrappleForActor(
                combat,
                actor
            );


        return canMoveDuringGrapple(
            grapple,
            actor
        );

    }


    /**
     * Indique si une action est autorisée
     * compte tenu d'une éventuelle saisie.
     */
    static canActorPerformAction(
        combat,
        actor,
        actionId
    ) {

        if (!actor) {

            throw new TypeError(
                "canActorPerformAction nécessite un Actor."
            );

        }


        if (
            typeof actionId !== "string"
            || actionId.length === 0
        ) {

            throw new TypeError(
                "Un identifiant d'action est nécessaire."
            );

        }


        const grapple =
            this.getGrappleForActor(
                combat,
                actor
            );


        return canPerformActionDuringGrapple(
            grapple,
            actor,
            actionId
        );

    }

}