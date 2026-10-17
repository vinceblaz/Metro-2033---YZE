import {
    createCombatActionState,
    normalizeCombatActionState,
    getCombatAction,
    canPerformCombatAction,
    spendCombatAction
} from "../domain/rules/combat-actions.mjs";


const SYSTEM_ID =
    "metro-2033-yze";

const FLAG_KEY =
    "combatActions";


/**
 * Gestion Foundry de l'économie d'actions
 * d'un Combatant.
 *
 * L'état est stocké sur le Combatant :
 *
 * flags.metro-2033-yze.combatActions
 *
 * {
 *     round: number,
 *     slowUsed: boolean,
 *     fastUsed: number
 * }
 */
export class CombatActionService {


    /**
     * Résout le Combatant correspondant
     * à un Actor dans un Combat.
     */
    static getCombatant(
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
            Array.from(
                combat.combatants
            ).find(
                combatant =>
                    combatant.actor?.id
                    === actor.id
            )
            ?? null
        );

    }


    /**
     * Crée l'état initial correspondant
     * au round courant.
     */
    static createState(
        combat
    ) {

        if (!combat) {

            throw new TypeError(
                "Un Combat est nécessaire."
            );

        }


        return {

            round:
                combat.round ?? 0,

            ...createCombatActionState()

        };

    }


    /**
     * Retourne l'état courant d'un Combatant.
     *
     * Si aucun état n'est enregistré, ou si
     * l'état appartient à un ancien round,
     * un état initial est retourné.
     *
     * Cette méthode ne persiste rien.
     */
    static getState(
        combat,
        combatant
    ) {

        if (!combat) {

            throw new TypeError(
                "Un Combat est nécessaire."
            );

        }


        if (!combatant) {

            throw new TypeError(
                "Un Combatant est nécessaire."
            );

        }


        const stored =
            combatant.getFlag(
                SYSTEM_ID,
                FLAG_KEY
            );


        const round =
            combat.round ?? 0;


        if (
            !stored
            || stored.round !== round
        ) {

            return this.createState(
                combat
            );

        }


        const normalized =
            normalizeCombatActionState(
                stored
            );


        return {

            round,
            ...normalized

        };

    }


    /**
     * Retourne l'état d'actions d'un Actor.
     */
    static getActorState(
        combat,
        actor
    ) {

        const combatant =
            this.getCombatant(
                combat,
                actor
            );


        if (!combatant) {

            throw new Error(
                "L'Actor n'est pas présent dans ce combat."
            );

        }


        return this.getState(
            combat,
            combatant
        );

    }


    /**
     * Vérifie si un Actor peut payer
     * le coût d'une action.
     */
    static canActorPerform(
        combat,
        actor,
        actionId
    ) {

        const action =
            getCombatAction(
                actionId
            );


        if (!action) {

            throw new Error(
                `Action de combat inconnue : ${actionId}.`
            );

        }


        const state =
            this.getActorState(
                combat,
                actor
            );


        return canPerformCombatAction(
            state,
            actionId
        );

    }


    /**
     * Dépense le coût d'une action
     * pour un Actor.
     *
     * Retourne le nouvel état persisté.
     */
    static async spendActorAction(
        combat,
        actor,
        actionId
    ) {

        const combatant =
            this.getCombatant(
                combat,
                actor
            );


        if (!combatant) {

            throw new Error(
                "L'Actor n'est pas présent dans ce combat."
            );

        }


        const current =
            this.getState(
                combat,
                combatant
            );


        const next =
            spendCombatAction(
                current,
                actionId
            );


        const stored = {

            round:
                combat.round ?? 0,

            slowUsed:
                next.slowUsed,

            fastUsed:
                next.fastUsed

        };


        await combatant.setFlag(
            SYSTEM_ID,
            FLAG_KEY,
            stored
        );


        return {
            ...stored
        };

    }


    /**
     * Réinitialise l'économie d'actions
     * d'un Combatant.
     */
    static async resetCombatant(
        combat,
        combatant
    ) {

        if (!combat) {

            throw new TypeError(
                "Un Combat est nécessaire."
            );

        }


        if (!combatant) {

            throw new TypeError(
                "Un Combatant est nécessaire."
            );

        }


        const state =
            this.createState(
                combat
            );


        await combatant.setFlag(
            SYSTEM_ID,
            FLAG_KEY,
            state
        );


        return {
            ...state
        };

    }


    /**
     * Réinitialise un Actor précis.
     */
    static async resetActor(
        combat,
        actor
    ) {

        const combatant =
            this.getCombatant(
                combat,
                actor
            );


        if (!combatant) {

            throw new Error(
                "L'Actor n'est pas présent dans ce combat."
            );

        }


        return this.resetCombatant(
            combat,
            combatant
        );

    }


    /**
     * Réinitialise tous les combattants
     * du Combat.
     */
    static async resetAll(
        combat
    ) {

        if (!combat) {

            throw new TypeError(
                "Un Combat est nécessaire."
            );

        }


        const results = [];


        for (
            const combatant
            of Array.from(
                combat.combatants
            )
        ) {

            results.push(
                await this.resetCombatant(
                    combat,
                    combatant
                )
            );

        }


        return results;

    }

}