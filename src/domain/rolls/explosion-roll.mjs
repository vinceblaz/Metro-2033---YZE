export class ExplosionRoll {

    static roll(
        power,
        {
            range = "short"
        } = {}
    ) {

        if (
            !Number.isInteger(power)
            || power < 0
        ) {
            throw new RangeError(
                "La Puissance d'une explosion doit être un entier positif ou nul."
            );
        }


        if (
            ![
                "contact",
                "short",
                "medium"
            ].includes(range)
        ) {
            throw new Error(
                `Portée d'explosion invalide : ${range}.`
            );
        }


        /*
         * Une explosion n'affecte la portée moyenne
         * que si sa Puissance initiale est de 7+.
         */
        if (
            range === "medium"
            && power < 7
        ) {
            return {
                affected: false,
                power,
                range,
                effectivePower: 0,
                dice: [],
                successes: 0,
                contactDamage: 0,
                rawDamage: 0,
                canPush: false
            };
        }


        const effectivePower =
            range === "medium"
                ? Math.max(0, power - 2)
                : power;


        const dice =
            this.#rollDice(
                effectivePower
            );


        const successes =
            dice.filter(
                value => value === 6
            ).length;


        const contactDamage =
            range === "contact"
                ? 2
                : 0;


        return {
            affected: true,

            power,

            range,

            effectivePower,

            dice,

            successes,

            contactDamage,

            rawDamage:
                successes
                + contactDamage,

            canPush:
                false
        };
    }


    static #rollDice(
        count
    ) {

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