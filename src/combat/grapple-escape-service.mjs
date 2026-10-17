import { GrappleService }
    from "./grapple-service.mjs";

import { YZERoll }
    from "../domain/rolls/yze-roll.mjs";    


export class GrappleEscapeService {

    /**
     * Construit une opposition de libération.
     *
     * À ce stade, aucune modification de la saisie
     * n'est persistée.
     *
     * Le jet de la cible pourra éventuellement être
     * forcé avant la résolution définitive.
     */
    static create({
        grapple,
        target,
        attacker,
        targetRoll,
        attackerRoll
    } = {}) {

        if (!grapple) {
            throw new TypeError(
                "Une saisie active est nécessaire."
            );
        }


        if (!target) {
            throw new TypeError(
                "La cible est nécessaire."
            );
        }


        if (!attacker) {
            throw new TypeError(
                "Le saisisseur est nécessaire."
            );
        }


        if (!targetRoll) {
            throw new TypeError(
                "Le jet de la cible est nécessaire."
            );
        }


        if (!attackerRoll) {
            throw new TypeError(
                "Le jet du saisisseur est nécessaire."
            );
        }


        if (
            grapple.state?.active
            !== true
        ) {
            throw new Error(
                "La saisie n'est pas active."
            );
        }


        const targetId =
            grapple.state?.target?.actorId
            ?? grapple.state?.target?.id;


        const attackerId =
            grapple.state?.attacker?.actorId
            ?? grapple.state?.attacker?.id;


        if (
            targetId
            !== target.id
        ) {
            throw new Error(
                "L'Actor fourni n'est pas la cible de cette saisie."
            );
        }


        if (
            attackerId
            !== attacker.id
        ) {
            throw new Error(
                "L'Actor fourni n'est pas le saisisseur."
            );
        }


        return {
            action: {
                id:
                    "grapple-escape",

                cost:
                    "slow",

                opposed:
                    true
            },

            grappleId:
                grapple.id,

            target: {
                id:
                    target.id,

                uuid:
                    target.uuid ?? null,

                name:
                    target.name ?? null
            },

            attacker: {
                id:
                    attacker.id,

                uuid:
                    attacker.uuid ?? null,

                name:
                    attacker.name ?? null
            },

            rolls: {
                target:
                    targetRoll,

                attacker:
                    attackerRoll
            },

            push: {
                /*
                 * Celui qui tente la libération
                 * initie le jet en opposition.
                 */
                targetAllowed:
                    targetRoll.canPush
                    === true,

                /*
                 * Le saisisseur est l'adversaire :
                 * son jet ne peut pas être forcé.
                 */
                attackerAllowed:
                    false
            },

            resolved:
                false,

            resolution:
                null
        };
    }


    /**
     * Résout définitivement l'opposition.
     *
     * Cette méthode est appelée uniquement lorsque
     * le joueur a décidé de conserver son jet ou
     * après son éventuel Push.
     */
    static async resolve(
        combat,
        opposition,
        {
            targetRoll = null
        } = {}
    ) {

        if (!combat) {
            throw new Error(
                "Un combat actif est nécessaire."
            );
        }


        if (!opposition) {
            throw new TypeError(
                "Une opposition est nécessaire."
            );
        }


        if (
            opposition.resolved
            === true
        ) {
            throw new Error(
                "Cette opposition a déjà été résolue."
            );
        }


        /*
         * Si le jet de la cible a été forcé,
         * on fournit son nouveau résultat ici.
         *
         * Sinon on conserve le jet initial.
         */
        const finalTargetRoll =
            targetRoll
            ?? opposition.rolls?.target;


        const attackerRoll =
            opposition.rolls?.attacker;


        if (
            !finalTargetRoll
            || !attackerRoll
        ) {
            throw new Error(
                "Les deux résultats de jet sont nécessaires."
            );
        }


        const resolution =
            await GrappleService.resolveEscape(
                combat,
                opposition.grappleId,
                {
                    targetSuccesses:
                        finalTargetRoll.successes,

                    attackerSuccesses:
                        attackerRoll.successes
                }
            );


        return {
            ...opposition,

            rolls: {
                target:
                    finalTargetRoll,

                attacker:
                    attackerRoll
            },

            resolved:
                true,

            resolution
        };
    }

    static pushTarget(
        opposition,
        {
            maxPushes = 1,
            additionalStressDice = 0,
            resetStressAfflictions = false
        } = {}
    ) {

        if (!opposition) {
            throw new TypeError(
                "Une opposition est nécessaire."
            );
        }


        if (
            opposition.resolved
            === true
        ) {
            throw new Error(
                "Cette opposition a déjà été résolue."
            );
        }


        if (
            opposition.push?.targetAllowed
            !== true
        ) {
            throw new Error(
                "La cible ne peut pas forcer ce jet."
            );
        }


        const currentTargetRoll =
            opposition.rolls?.target;


        if (!currentTargetRoll) {
            throw new Error(
                "Le jet de la cible est introuvable."
            );
        }


        if (
            !currentTargetRoll.canPushAgain(
                maxPushes
            )
        ) {
            throw new Error(
                "Le jet de la cible ne peut plus être forcé."
            );
        }


        const pushedTargetRoll =
            YZERoll.push(
                currentTargetRoll,
                {
                    maxPushes,
                    additionalStressDice,
                    resetStressAfflictions
                }
            );


        return {
            ...opposition,

            rolls: {
                ...opposition.rolls,

                target:
                    pushedTargetRoll
            },

            push: {
                ...opposition.push,

                targetAllowed:
                    pushedTargetRoll.canPushAgain(
                        maxPushes
                    ),

                attackerAllowed:
                    false
            }
        };
    }    

}