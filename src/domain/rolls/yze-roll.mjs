import { DicePool }
    from "./dice-pool.mjs";

import { YZEResult }
    from "./yze-result.mjs";


export class YZERoll {


    // ============================================================
    // COMPTAGE PRÉALABLE (pour un jet physique externe)
    // ============================================================

    /**
     * Retourne, pour un jet initial, le nombre de dés
     * normaux et de dés de Stress qui seront effectivement
     * lancés — avant même de les lancer.
     *
     * Sert aux intégrations qui doivent faire précéder
     * la résolution métier d'un véritable jet physique
     * (ex. un Roll Foundry), afin de savoir à l'avance
     * combien de dés demander.
     *
     * Cette méthode ne lance aucun dé.
     */
    static countInitialDiceToRoll(
        pool
    ) {

        if (!(pool instanceof DicePool)) {

            throw new TypeError(
                "YZERoll.countInitialDiceToRoll nécessite un DicePool."
            );

        }


        return {

            normal:
                pool.effectiveNormalDice,

            stress:
                pool.stress,

            total:
                pool.total

        };

    }


    /**
     * Retourne, pour un Push, le nombre de dés normaux
     * qui seront effectivement relancés (tous les dés
     * autres que des 6 déjà obtenus) et le nombre de dés
     * de Stress relancés (dés de Stress déjà en jeu, plus
     * d'éventuels dés de Stress supplémentaires).
     *
     * Cette méthode ne lance aucun dé.
     */
    static countPushDiceToRoll(
        result,
        {
            additionalStressDice = 0
        } = {}
    ) {

        if (!(result instanceof YZEResult)) {

            throw new TypeError(
                "YZERoll.countPushDiceToRoll nécessite un YZEResult."
            );

        }


        if (
            !Number.isInteger(additionalStressDice)
            || additionalStressDice < 0
        ) {

            throw new TypeError(
                "additionalStressDice doit être un entier positif ou nul."
            );

        }


        const countRerolled =
            dice =>
                dice.filter(
                    value => value !== 6
                ).length;


        const normal =
            countRerolled(result.dice.attribute)
            + countRerolled(result.dice.skill)
            + countRerolled(result.dice.equipment)
            + countRerolled(result.dice.bonus);


        const stress =
            result.dice.stress.length
            + additionalStressDice;


        return {

            normal,

            stress,

            total:
                normal + stress

        };

    }


    // ============================================================
    // JET INITIAL
    // ============================================================

    /**
     * drawDie : fonction optionnelle () => 1-6.
     *
     * Par défaut, chaque dé est tiré avec Math.random()
     * (comportement historique, inchangé).
     *
     * Une intégration (ex. Foundry) peut fournir sa propre
     * fonction afin que les dés réellement utilisés par la
     * résolution soient ceux d'un jet physique externe déjà
     * effectué (cf. countInitialDiceToRoll ci-dessus pour en
     * connaître le nombre à l'avance).
     */
    static roll(
        pool,
        context = {},
        {
            drawDie = null
        } = {}
    ) {

        if (!(pool instanceof DicePool)) {

            throw new TypeError(
                "YZERoll.roll nécessite un DicePool."
            );

        }


        const draw =
            this.#resolveDrawDie(
                drawDie
            );


        const counts =
            this.#getEffectiveSourceCounts(
                pool
            );


        const dice = {

            attribute:
                this.#rollDice(
                    counts.attribute,
                    draw
                ),

            skill:
                this.#rollDice(
                    counts.skill,
                    draw
                ),

            equipment:
                this.#rollDice(
                    counts.equipment,
                    draw
                ),

            bonus:
                this.#rollDice(
                    counts.bonus,
                    draw
                )

        };


        const stressRoll =
            this.#rollStressDice(
                pool.stress,
                draw
            );


        dice.stress =
            stressRoll.active;


        const successes =
            this.#countNormalSuccesses(
                dice
            );


        const stressAfflictions =
            this.#countOnes(
                dice.stress
            );


        const history = [

            {
                type:
                    "initial",

                pushCount:
                    0,

                dice:
                    this.#copyDice(
                        dice
                    ),

                eliminatedStress:
                    stressRoll.eliminated,

                successes,

                normalAfflictions:
                    0,

                stressAfflictions
            }

        ];


        return new YZEResult({

            pool,

            dice,

            successes,

            pushCount:
                0,

            history,

            context,

            stressAfflictions,

            eliminatedStress:
                stressRoll.eliminated

        });

    }


    // ============================================================
    // PUSH
    // ============================================================

    /**
     * drawDie : cf. le commentaire équivalent sur roll().
     */
    static push(
        result,
        {
            maxPushes = 1,
            additionalStressDice = 0,
            resetStressAfflictions = false,
            drawDie = null
        } = {}
    ) {

        if (!(result instanceof YZEResult)) {

            throw new TypeError(
                "YZERoll.push nécessite un YZEResult."
            );

        }


        if (
            !Number.isInteger(additionalStressDice)
            || additionalStressDice < 0
        ) {

            throw new TypeError(
                "additionalStressDice doit être un entier positif ou nul."
            );

        }


        if (
            !result.canPushAgain(
                maxPushes
            )
        ) {

            throw new Error(
                "Ce jet ne peut plus être forcé."
            );

        }


        const draw =
            this.#resolveDrawDie(
                drawDie
            );


        const nextPushCount =
            result.pushCount + 1;


        // ========================================================
        // DÉS NORMAUX
        // ========================================================

        const dice = {

            attribute:
                this.#pushDiceGroup(
                    result.dice.attribute,
                    draw
                ),

            skill:
                this.#pushDiceGroup(
                    result.dice.skill,
                    draw
                ),

            equipment:
                this.#pushDiceGroup(
                    result.dice.equipment,
                    draw
                ),

            bonus:
                this.#pushDiceGroup(
                    result.dice.bonus,
                    draw
                )

        };


        // ========================================================
        // STRESS
        // ========================================================

        const stressDiceToRoll =
            result.dice.stress.length
            + additionalStressDice;


        const stressRoll =
            this.#rollStressDice(
                stressDiceToRoll,
                draw
            );


        dice.stress =
            stressRoll.active;


        // ========================================================
        // RÉSOLUTION
        // ========================================================

        const successes =
            this.#countNormalSuccesses(
                dice
            );


        const normalAfflictions =
            this.#countNormalOnes(
                dice
            );


        const newStressAfflictions =
            this.#countOnes(
                dice.stress
            );


        /*
         * Au deuxième Push Métro payé en Stress,
         * seules les afflictions de Stress de
         * l'ultime relance sont conservées.
         */
        const stressAfflictions =
            resetStressAfflictions

                ? newStressAfflictions

                : (
                    result.stressAfflictions
                    + newStressAfflictions
                );


        const eliminatedStress =
            result.eliminatedStress
            + stressRoll.eliminated;


        const history = [

            ...result.history,

            {
                type:
                    "push",

                pushCount:
                    nextPushCount,

                dice:
                    this.#copyDice(
                        dice
                    ),

                addedStressDice:
                    additionalStressDice,

                eliminatedStress:
                    stressRoll.eliminated,

                successes,

                normalAfflictions,

                stressAfflictions:
                    newStressAfflictions
            }

        ];


        return new YZEResult({

            pool:
                result.pool,

            dice,

            successes,

            pushCount:
                nextPushCount,

            history,

            context:
                result.context,

            stressAfflictions,

            eliminatedStress

        });

    }


    // ============================================================
    // PUSH D'UNE CATÉGORIE
    // ============================================================

    /**
     * Conserve les 6 et relance tous les autres dés
     * d'une même origine.
     */
    static #pushDiceGroup(dice, draw) {

        const kept =
            dice.filter(
                value => value === 6
            );


        const rerollCount =
            dice.length
            - kept.length;


        return [

            ...kept,

            ...this.#rollDice(
                rerollCount,
                draw
            )

        ];

    }


    // ============================================================
    // GESTION DU MALUS
    // ============================================================

    /**
     * Répartit techniquement le malus entre les sources.
     *
     * Le malus réduit le nombre total de dés, mais n'est
     * lui-même pas une catégorie de dés lancés.
     *
     * Nous préservons les dés d'équipement aussi longtemps
     * que possible afin de conserver leur provenance.
     */
    static #getEffectiveSourceCounts(pool) {

        const counts = {

            attribute:
                pool.attribute,

            skill:
                pool.skill,

            equipment:
                pool.equipment,

            bonus:
                pool.bonus

        };


        let remainingPenalty =
            pool.penalty;


        /*
         * Ordre purement technique.
         *
         * Il ne constitue pas encore une règle Métro.
         */
        const reductionOrder = [

            "bonus",
            "skill",
            "attribute",
            "equipment"

        ];


        for (
            const source
            of reductionOrder
        ) {

            if (
                remainingPenalty <= 0
            ) {

                break;

            }


            const removed =
                Math.min(
                    counts[source],
                    remainingPenalty
                );


            counts[source] -=
                removed;


            remainingPenalty -=
                removed;

        }


        return counts;

    }


    // ============================================================
    // LANCERS
    // ============================================================

    /**
     * Normalise drawDie en une fonction () => 1-6
     * toujours appelable.
     *
     * Sans fonction fournie, comportement historique :
     * Math.random().
     */
    static #resolveDrawDie(drawDie) {

        if (typeof drawDie === "function") {

            return drawDie;

        }


        return () =>
            Math.floor(
                Math.random() * 6
            ) + 1;

    }


    static #rollDice(count, draw) {

        const dice = [];


        for (
            let index = 0;
            index < count;
            index++
        ) {

            dice.push(
                draw()
            );

        }


        return dice;

    }


    static #rollStressDice(count, draw) {

        const active = [];

        let eliminated = 0;


        for (
            let index = 0;
            index < count;
            index++
        ) {

            const value =
                draw();


            if (value === 6) {

                eliminated++;

                continue;

            }


            active.push(
                value
            );

        }


        return {

            active,

            eliminated

        };

    }


    // ============================================================
    // COMPTAGE
    // ============================================================

    static #countNormalSuccesses(dice) {

        return (

            this.#countSuccesses(
                dice.attribute
            )

            + this.#countSuccesses(
                dice.skill
            )

            + this.#countSuccesses(
                dice.equipment
            )

            + this.#countSuccesses(
                dice.bonus
            )

        );

    }


    static #countNormalOnes(dice) {

        return (

            this.#countOnes(
                dice.attribute
            )

            + this.#countOnes(
                dice.skill
            )

            + this.#countOnes(
                dice.equipment
            )

            + this.#countOnes(
                dice.bonus
            )

        );

    }


    static #countSuccesses(dice) {

        return dice.filter(
            value => value === 6
        ).length;

    }


    static #countOnes(dice) {

        return dice.filter(
            value => value === 1
        ).length;

    }


    static #copyDice(dice) {

        return {

            attribute:
                [...dice.attribute],

            skill:
                [...dice.skill],

            equipment:
                [...dice.equipment],

            bonus:
                [...dice.bonus],

            stress:
                [...dice.stress]

        };

    }

}