import { DicePool }
    from "./dice-pool.mjs";

import { YZERoll }
    from "./yze-roll.mjs";


export class MeleeBlockRoll {

    static roll({
        attribute = 0,
        skill = 0,
        equipment = 0,
        stress = 0,
        bonus = 0,
        penalty = 0,
        context = {}
    } = {}) {

        for (
            const [name, value]
            of Object.entries({
                attribute,
                skill,
                equipment,
                stress,
                bonus,
                penalty
            })
        ) {

            if (
                !Number.isInteger(value)
                || value < 0
            ) {
                throw new TypeError(
                    `${name} doit être un entier positif ou nul.`
                );
            }

        }


        const pool =
            new DicePool({
                attribute,
                skill,
                equipment,
                stress,
                bonus,
                penalty
            });


        const roll =
            YZERoll.roll(
                pool,
                {
                    ...context,

                    action:
                        "melee-block",

                    canPush:
                        false
                }
            );


        /*
         * On retourne une vue spécialisée du jet.
         *
         * Le résultat YZE reste disponible afin
         * de conserver le détail des dés.
         */
        return {
            roll,

            pool,

            successes:
                roll.successes,

            canPush:
                false,

            action:
                "melee-block",

            context: {
                ...context,

                action:
                    "melee-block"
            }
        };
    }

}