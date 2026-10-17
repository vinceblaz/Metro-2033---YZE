/**
 * Représente la composition d'un pool de dés YZE.
 *
 * Cette classe ne lance aucun dé.
 * Elle décrit uniquement combien de dés
 * appartiennent à chaque source.
 */
export class DicePool {

    constructor({
        attribute = 0,
        skill = 0,
        equipment = 0,
        stress = 0,
        bonus = 0,
        penalty = 0
    } = {}) {

        this.attribute =
            this.#validate(attribute);

        this.skill =
            this.#validate(skill);

        this.equipment =
            this.#validate(equipment);

        this.stress =
            this.#validate(stress);

        this.bonus =
            this.#validate(bonus);

        this.penalty =
            this.#validate(penalty);

    }


    /**
     * Dés normaux avant application
     * du malus.
     */
    get normalDice() {

        return (
            this.attribute
            + this.skill
            + this.equipment
            + this.bonus
        );

    }


    /**
     * Nombre de dés normaux réellement lancés.
     *
     * Un malus ne peut jamais produire
     * un nombre négatif de dés.
     */
    get effectiveNormalDice() {

        return Math.max(
            0,
            this.normalDice - this.penalty
        );

    }


    /**
     * Nombre total de dés physiquement lancés,
     * y compris les dés de Stress.
     */
    get total() {

        return (
            this.effectiveNormalDice
            + this.stress
        );

    }


    /**
     * Le pool contient-il du Stress ?
     */
    get hasStress() {

        return this.stress > 0;

    }


    #validate(value) {

        if (!Number.isInteger(value)) {

            throw new TypeError(
                "Une quantité de dés doit être un entier."
            );

        }


        if (value < 0) {

            throw new RangeError(
                "Une quantité de dés ne peut pas être négative."
            );

        }


        return value;

    }

}