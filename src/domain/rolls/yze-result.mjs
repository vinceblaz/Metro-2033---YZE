import { DicePool }
    from "./dice-pool.mjs";


/**
 * Résultat structuré d'un jet YZE.
 *
 * Chaque dé conserve maintenant son origine :
 * - attribute
 * - skill
 * - equipment
 * - bonus
 * - stress
 */
export class YZEResult {

    constructor({
        pool,
        dice = {},
        successes = 0,
        pushCount = 0,
        history = [],
        context = {},
        stressAfflictions = 0,
        eliminatedStress = 0
    } = {}) {

        if (!(pool instanceof DicePool)) {

            throw new TypeError(
                "YZEResult nécessite un DicePool."
            );

        }


        if (
            !Number.isInteger(pushCount)
            || pushCount < 0
        ) {

            throw new TypeError(
                "pushCount doit être un entier positif ou nul."
            );

        }


        this.pool = pool;


        this.dice = {

            attribute:
                [...(dice.attribute ?? [])],

            skill:
                [...(dice.skill ?? [])],

            equipment:
                [...(dice.equipment ?? [])],

            bonus:
                [...(dice.bonus ?? [])],

            stress:
                [...(dice.stress ?? [])]

        };


        /*
         * Compatibilité avec notre ancienne API.
         *
         * result.dice.normal continue donc
         * à fonctionner.
         */
        Object.defineProperty(
            this.dice,
            "normal",
            {
                enumerable: true,

                get: () => [
                    ...this.dice.attribute,
                    ...this.dice.skill,
                    ...this.dice.equipment,
                    ...this.dice.bonus
                ]
            }
        );


        this.successes =
            successes;

        this.pushCount =
            pushCount;

        this.history =
            [...history];

        this.context =
            { ...context };

        this.stressAfflictions =
            stressAfflictions;

        this.eliminatedStress =
            eliminatedStress;

    }


    // ============================================================
    // ÉTAT GÉNÉRAL
    // ============================================================

    get success() {

        return this.successes > 0;

    }


    get pushed() {

        return this.pushCount > 0;

    }


    get canPush() {

        return this.canPushAgain(1);

    }


    canPushAgain(maxPushes = 1) {

        if (
            !Number.isInteger(maxPushes)
            || maxPushes < 0
        ) {

            throw new TypeError(
                "maxPushes doit être un entier positif ou nul."
            );

        }


        return this.pushCount < maxPushes;

    }


    // ============================================================
    // DÉS
    // ============================================================

    get normalDice() {

        return [
            ...this.dice.normal
        ];

    }


    get attributeResults() {

        return [
            ...this.dice.attribute
        ];

    }


    get skillResults() {

        return [
            ...this.dice.skill
        ];

    }


    get equipmentResults() {

        return [
            ...this.dice.equipment
        ];

    }


    get bonusResults() {

        return [
            ...this.dice.bonus
        ];

    }


    get stressDice() {

        return [
            ...this.dice.stress
        ];

    }


    get diceCount() {

        return (
            this.normalDice.length
            + this.dice.stress.length
        );

    }


    // ============================================================
    // AFFLICTIONS
    // ============================================================

    get attributeOnes() {

        return this.#countOnes(
            this.dice.attribute
        );

    }


    get skillOnes() {

        return this.#countOnes(
            this.dice.skill
        );

    }


    /**
     * Important pour nos futures règles
     * de détérioration d'équipement.
     */
    get equipmentOnes() {

        return this.#countOnes(
            this.dice.equipment
        );

    }


    get bonusOnes() {

        return this.#countOnes(
            this.dice.bonus
        );

    }


    get stressOnes() {

        return this.#countOnes(
            this.dice.stress
        );

    }


    get normalOnes() {

        return (
            this.attributeOnes
            + this.skillOnes
            + this.equipmentOnes
            + this.bonusOnes
        );

    }


    get normalAfflictions() {

        if (this.pushCount === 0) {

            return 0;

        }


        return this.normalOnes;

    }


    get afflictions() {

        return (
            this.normalAfflictions
            + this.stressAfflictions
        );

    }


    // ============================================================
    // COMPOSITION DU POOL
    // ============================================================

    get attributeDice() {

        return this.pool.attribute;

    }


    get skillDice() {

        return this.pool.skill;

    }


    get equipmentDice() {

        return this.pool.equipment;

    }


    get stressPoolDice() {

        return this.pool.stress;

    }


    get bonusDice() {

        return this.pool.bonus;

    }


    get penaltyDice() {

        return this.pool.penalty;

    }


    // ============================================================
    // OUTILS
    // ============================================================

    #countOnes(dice) {

        return dice.filter(
            value => value === 1
        ).length;

    }

}