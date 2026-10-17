/**
 * Attaque de Terreur (livre de règles, p.207).
 *
 * « Une attaque de Terreur est faite en jetant un nombre de dés
 * correspondant à la valeur de Terreur de l'événement (ou de la
 * créature). Chaque réussite inflige 1 point de dégâts à
 * l'ESPRIT des personnes susceptibles d'être affectées (ce jet
 * ne peut pas être forcé). »
 *
 * « Si le personnage ciblé par l'attaque de Terreur possède des
 * dés de Stress, ceux-ci s'ajoutent à la valeur de Terreur pour
 * le jet concernant ce personnage. » Le nombre de dés de Stress
 * étant propre à chaque personnage, le jet se fait donc
 * individuellement, cible par cible, même si la valeur de
 * Terreur de la source est partagée par tous.
 *
 * Ce jet ne peut jamais être forcé (Push) : aucune fonction de
 * ce module ne prévoit de second jet.
 *
 * Note de règle volontairement hors du périmètre de cette
 * macro : « si la source de terreur n'implique pas une créature
 * ou un événement surnaturel ou particulièrement effroyable, les
 * réussites sur le jet peuvent être affectées à la jauge de
 * sang-froid au lieu d'infliger des dégâts à l'ESPRIT de la
 * cible (au choix du MJ) ». Ce choix reste manuel : la macro
 * applique toujours les dégâts à l'ESPRIT, le MJ pouvant ensuite
 * ajuster la fiche à la main s'il préfère ce cas particulier.
 */

export const TERROR_SOURCE_LEVELS = {

    frightening: {
        key: "frightening",
        label: "Effrayante",
        value: 3,
        examples:
            "Corps en décomposition, encerclé par des adversaires plus "
            + "nombreux, peur des tunnels."
    },

    atrocious: {
        key: "atrocious",
        label: "Atroce",
        value: 5,
        examples:
            "Charnier, mort d'un PJ/PNJ proche, créature surnaturelle, "
            + "ténèbres totales."
    },

    abominable: {
        key: "abominable",
        label: "Abominable",
        value: 8,
        examples:
            "Situation ou créature unique et particulièrement "
            + "monstrueuse, mort d'un PJ « pote »."
    }

};


/**
 * Retourne les 3 paliers du tableau « SOURCE TERREUR /
 * VALEUR », dans l'ordre du livre.
 */
export function getTerrorSourceLevelChoices() {

    return [
        TERROR_SOURCE_LEVELS.frightening,
        TERROR_SOURCE_LEVELS.atrocious,
        TERROR_SOURCE_LEVELS.abominable
    ];

}


/**
 * Construit la configuration d'un DicePool pour le jet subi par
 * UNE cible d'une attaque de Terreur.
 *
 * La valeur de Terreur (partagée par toutes les cibles de la
 * même attaque) n'est rattachée à aucun Attribut/Compétence : on
 * la place dans `bonus`, comme le fait déjà le jet de Trépas
 * pour son propre modificateur ad hoc. Les dés de Stress de la
 * cible (propres à chaque personnage) sont eux placés dans
 * `stress`, conformément à la règle citée ci-dessus.
 */
export function computeTerrorDicePool({
    terrorValue,
    targetStressDice = 0
} = {}) {

    if (
        !Number.isInteger(terrorValue)
        || terrorValue < 0
    ) {

        throw new TypeError(
            "La valeur de Terreur doit être un entier positif ou nul."
        );

    }


    if (
        !Number.isInteger(targetStressDice)
        || targetStressDice < 0
    ) {

        throw new TypeError(
            "Le nombre de dés de Stress de la cible doit être un "
            + "entier positif ou nul."
        );

    }


    return {

        bonus:
            terrorValue,

        stress:
            targetStressDice

    };

}


/**
 * Résout l'issue du jet subi par une cible : chaque réussite
 * inflige directement 1 point de dégâts à l'ESPRIT (pas de jet
 * en opposition, à la différence des Poisons/Maladies : c'est un
 * jet d'attaque direct, comme pour un PNJ).
 */
export function resolveTerrorOutcome({
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


    return {

        successes,

        damage:
            successes,

        affected:
            successes > 0

    };

}
