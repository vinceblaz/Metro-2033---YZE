/**
 * Asphyxie (livre de règles, p.205).
 *
 * « Si vous êtes exposé à des fumées ou gaz toxiques, vous
 * subissez ses effets. Vous devez faire un jet d'ENDURANCE (ce
 * jet ne peut pas être forcé) dont la fréquence dépend de la
 * Nocivité de la source. En cas d'échec, vous subissez 1 point
 * de dégâts à la VIGUEUR et à l'ESPRIT alors que vos poumons,
 * vos muqueuses et vos yeux subissent les effets nocifs des
 * fumées ou gaz. »
 *
 * Contrairement à l'attaque de Terreur, la Nocivité de la
 * source ne modifie jamais le jet lui-même : elle ne fixe que
 * la fréquence à laquelle le MJ doit le redemander (tous les
 * quarts/tours/rounds), une cadence purement narrative que ce
 * module ne gère pas (le MJ relance la macro manuellement au
 * rythme voulu, exactement comme pour le cycle quotidien de la
 * Maladie).
 *
 * Un jet d'ENDURANCE est un test de Compétence standard :
 * Attribut VIGUEUR + Compétence Endurance. Aucun dé de Stress
 * n'est prévu par le livre pour ce jet (à la différence de la
 * Terreur). Ce jet ne peut jamais être forcé (Push).
 */

/**
 * État Foundry (icône sur le Token) posé sur un Actor qui a
 * échoué un jet d'Asphyxie, tant que le MJ ne l'enlève pas
 * manuellement (mécanique homebrew actée avec le porteur du
 * projet le 28/09/2026, absente du livre de règles) : en combat,
 * il déclenche un nouveau jet d'Asphyxie automatique à chaque
 * round tant qu'il reste actif (cf.
 * `combat/recurring-status-effect-registry.mjs`) ; hors combat,
 * rien n'est automatisé, le MJ relance la macro quand il le
 * juge utile.
 */
export const ASPHYXIATION_STATUS_EFFECT = Object.freeze({

    id: "asphyxiated",
    name: "Asphyxié",
    img: "icons/svg/degen.svg"

});


export const ASPHYXIATION_SOURCE_LEVELS = {

    light: {
        key: "light",
        label: "Légère",
        frequency: "Tous les quarts",
        examples: "Fumée légère, brume irritante."
    },

    strong: {
        key: "strong",
        label: "Forte",
        frequency: "Tous les tours",
        examples: "Fumées (incendie), brume toxique."
    },

    extreme: {
        key: "extreme",
        label: "Extrême",
        frequency: "Tous les rounds",
        examples: "Gaz toxique."
    }

};


/**
 * Retourne les 3 paliers du tableau « SOURCE / NOCIVITÉ /
 * FRÉQUENCE », dans l'ordre du livre. Purement informatif :
 * n'affecte pas le jet, uniquement la fréquence à laquelle le
 * MJ doit le redemander.
 */
export function getAsphyxiationSourceLevelChoices() {

    return [
        ASPHYXIATION_SOURCE_LEVELS.light,
        ASPHYXIATION_SOURCE_LEVELS.strong,
        ASPHYXIATION_SOURCE_LEVELS.extreme
    ];

}


/**
 * Construit la configuration d'un DicePool pour le jet
 * d'ENDURANCE subi par une cible exposée à des fumées/gaz
 * toxiques : un test de Compétence standard, sans dé de Stress
 * ni modificateur (le livre n'en prévoit aucun pour ce jet).
 */
export function computeAsphyxiationDicePool({
    vigorAttribute,
    enduranceSkill
} = {}) {

    if (
        !Number.isInteger(vigorAttribute)
        || vigorAttribute < 0
    ) {

        throw new TypeError(
            "La VIGUEUR doit être un entier positif ou nul."
        );

    }


    if (
        !Number.isInteger(enduranceSkill)
        || enduranceSkill < 0
    ) {

        throw new TypeError(
            "La compétence ENDURANCE doit être un entier positif ou nul."
        );

    }


    return {

        attribute:
            vigorAttribute,

        skill:
            enduranceSkill

    };

}


/**
 * Résout l'issue du jet : en cas d'échec (aucune réussite), 1
 * point de dégâts fixe à la VIGUEUR et à l'ESPRIT. Une réussite,
 * quel que soit son nombre, écarte tout dégât — contrairement à
 * la Terreur, ce n'est pas le nombre de réussites qui compte
 * mais la seule réussite ou l'échec du jet.
 */
export function resolveAsphyxiationOutcome({
    successes
} = {}) {

    if (
        !Number.isInteger(successes)
        || successes < 0
    ) {

        throw new TypeError(
            "Le nombre de réussites doit être un entier positif ou nul."
        );

    }


    const failed =
        successes === 0;


    return {

        successes,

        failed,

        vigorDamage:
            failed ? 1 : 0,

        spiritDamage:
            failed ? 1 : 0

    };

}
