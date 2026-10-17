export class StunGrenadeRoll {

    static roll({
        power = 5,
        range = "short"
    } = {}) {

        if (
            !Number.isInteger(power)
            || power < 0
        ) {
            throw new TypeError(
                "La Puissance doit être un entier positif ou nul."
            );
        }


        if (
            ![
                "contact",
                "short",
                "medium"
            ].includes(range)
        ) {
            throw new TypeError(
                `Portée de grenade étourdissante invalide : ${range}`
            );
        }


        /*
         * Comme pour les explosions :
         *
         * Puissance 7+ seulement peut affecter
         * la portée moyenne, avec Puissance -2.
         *
         * La grenade étourdissante standard étant
         * de Puissance 5, elle n'atteint donc
         * normalement pas cette zone.
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
                rawSpiritDamage: 0,

                damageAttribute: "spirit",

                canPush: false
            };
        }


        const effectivePower =
            range === "medium"
                ? power - 2
                : power;


        const dice =
            this.#rollDice(
                effectivePower
            );


        const successes =
            dice.filter(
                value => value === 6
            ).length;


        /*
         * Grenade étourdissante :
         * +1 dégât d'Esprit au contact.
         *
         * Contrairement aux +2 dégâts de
         * Vigueur d'une explosion normale.
         */
        const contactDamage =
            range === "contact"
                ? 1
                : 0;


        return {
            affected: true,

            power,
            range,

            effectivePower,

            dice,
            successes,

            contactDamage,

            rawSpiritDamage:
                successes
                + contactDamage,

            damageAttribute:
                "spirit",

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
