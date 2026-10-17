export class StunProtectionRoll {

    static roll({
        incomingDamage = 0,
        coverProtection = 0,
        helmetProtection = 0
    } = {}) {

        if (
            !Number.isInteger(incomingDamage)
            || incomingDamage < 0
        ) {
            throw new TypeError(
                "Les dégâts d'Esprit entrants doivent être un entier positif ou nul."
            );
        }


        if (
            !Number.isInteger(coverProtection)
            || coverProtection < 0
        ) {
            throw new TypeError(
                "La Protection de l'abri doit être un entier positif ou nul."
            );
        }


        if (
            !Number.isInteger(helmetProtection)
            || helmetProtection < 0
        ) {
            throw new TypeError(
                "La Protection du casque doit être un entier positif ou nul."
            );
        }


        const coverDice =
            this.#rollDice(
                coverProtection
            );


        const helmetDice =
            this.#rollDice(
                helmetProtection
            );


        const coverSuccesses =
            coverDice.filter(
                value => value === 6
            ).length;


        const helmetSuccesses =
            helmetDice.filter(
                value => value === 6
            ).length;


        const successes =
            coverSuccesses
            + helmetSuccesses;


        const preventedDamage =
            Math.min(
                incomingDamage,
                successes
            );


        const remainingSpiritDamage =
            Math.max(
                0,
                incomingDamage
                - preventedDamage
            );


        return {
            incomingDamage,

            protection: {
                cover:
                    coverProtection,

                helmet:
                    helmetProtection,

                total:
                    coverProtection
                    + helmetProtection
            },

            dice: {
                cover:
                    coverDice,

                helmet:
                    helmetDice
            },

            successes: {
                cover:
                    coverSuccesses,

                helmet:
                    helmetSuccesses,

                total:
                    successes
            },

            preventedDamage,

            remainingSpiritDamage,

            /*
             * Le malus d'étourdissement apparaît
             * seulement si la victime subit
             * effectivement au moins 2 dégâts
             * d'Esprit.
             */
            stunned:
                remainingSpiritDamage >= 2,

            canPush: false
        };
    }


    static #rollDice(count) {

        const dice = [];

        for (
            let index = 0;
            index < count;
            index += 1
        ) {
            dice.push(
                Math.floor(
                    Math.random() * 6
                ) + 1
            );
        }

        return dice;
    }

}