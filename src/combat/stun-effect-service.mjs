const SYSTEM_ID =
    "metro-2033-yze";

const FLAG_KEY =
    "stunEffect";


export class StunEffectService {

    static getEffect(actor) {

        if (!actor) {
            throw new TypeError(
                "Un Actor est nécessaire."
            );
        }

        return actor.getFlag(
            SYSTEM_ID,
            FLAG_KEY
        ) ?? null;
    }


    static async apply({
        actor,
        combat
    } = {}) {

        if (!actor) {
            throw new TypeError(
                "Un Actor est nécessaire."
            );
        }

        if (!combat) {
            throw new TypeError(
                "Un Combat est nécessaire."
            );
        }


        const currentRound =
            combat.round ?? 0;


        /*
         * Effet créé pendant le round courant,
         * actif pendant le round suivant,
         * puis retiré à la fin de celui-ci.
         */
        const expiresAfterRound =
            currentRound + 1;


        const effect = {
            active: true,

            penalty: 2,

            createdRound:
                currentRound,

            expiresAfterRound,

            reason:
                "stun-grenade"
        };


        await actor.setFlag(
            SYSTEM_ID,
            FLAG_KEY,
            effect
        );


        return {
            applied: true,
            ...effect
        };
    }


    static isActive({
        actor,
        combat
    } = {}) {

        const effect =
            this.getEffect(actor);


        if (
            !effect
            || effect.active !== true
        ) {
            return false;
        }


        /*
         * Hors combat, l'effet n'est pas considéré
         * comme actif par ce service.
         */
        if (!combat) {
            return false;
        }


        const round =
            combat.round ?? 0;


        return (
            round <=
            effect.expiresAfterRound
        );
    }


    static getPenalty({
        actor,
        combat
    } = {}) {

        if (
            !this.isActive({
                actor,
                combat
            })
        ) {
            return 0;
        }


        return this.getEffect(actor)
            ?.penalty
            ?? 0;
    }


    static async clear(actor) {

        if (!actor) {
            throw new TypeError(
                "Un Actor est nécessaire."
            );
        }


        await actor.unsetFlag(
            SYSTEM_ID,
            FLAG_KEY
        );


        return {
            cleared: true
        };
    }


    static async clearExpired(combat) {

        if (!combat) {
            throw new TypeError(
                "Un Combat est nécessaire."
            );
        }


        const round =
            combat.round ?? 0;


        const cleared = [];


        for (
            const combatant
            of combat.combatants
        ) {

            const actor =
                combatant.actor;


            if (!actor) {
                continue;
            }


            const effect =
                this.getEffect(actor);


            if (!effect) {
                continue;
            }


            /*
             * "jusqu'à la fin du round suivant"
             *
             * Donc on retire seulement lorsque
             * le Combat ENTRE dans le round
             * encore suivant.
             *
             * Exemple :
             * créé round 3
             * actif round 3 et 4
             * supprimé au passage round 5
             */
            if (
                round >
                effect.expiresAfterRound
            ) {

                await this.clear(actor);

                cleared.push({
                    actorId:
                        actor.id,

                    actorName:
                        actor.name
                });
            }

        }


        return {
            round,
            cleared
        };
    }

}