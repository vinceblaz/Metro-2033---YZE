/**
 * Poisons (livre de règles, p.204-205, section « Les poisons »).
 *
 * Périmètre acté avec le porteur du projet (02/10/2026) : poison
 * ingéré. Le poison appliqué sur une lame (« POISONS ET
 * BLESSURES », p.204) a ensuite été ajouté (04/10/2026, choix
 * explicite : « Déclenchement automatique (recommandé) »).
 *
 * « Les puissances des poisons se mesurent en Toxicité. Un
 * poison faible possède une Toxicité de 3, un poison puissant
 * une Toxicité de 6 et un poison extrêmement puissant une
 * Toxicité de 9, voire davantage. Si vous ingérez un poison,
 * faites un jet en opposition d'ENDURANCE contre le MJ qui jette
 * un nombre de dés égal à la Toxicité du poison. Si le poison
 * remporte ce jet en opposition, vous subissez ses effets. Si
 * vous l'emportez, vous ne subissez que les effets réduits du
 * poison. »
 *
 * « Note : les dégâts infligés par les poisons ne peuvent pas
 * être convertis en dés de Stress. Tant que le poison fait
 * effet, vous ne pouvez pas récupérer de points dans l'attribut
 * affecté. Un poison cesse naturellement d'infliger ses effets
 * au bout d'un tour et vous pouvez dès lors récupérer vos points
 * d'attribut perdus normalement. »
 *
 * Le livre ne tranche pas le cas d'égalité des réussites : par
 * convention actée avec le porteur du projet (02/10/2026, par
 * cohérence avec `resolveGrappleEscape`), une égalité protège la
 * victime (effets réduits, jamais effets complets).
 *
 * Les effets réduits ne sont jamais récurrents (un seul point de
 * dégâts, immédiat) ; seuls les effets complets le sont (1 point
 * par round jusqu'à être Brisé). Une instance à effets complets
 * est donc seule représentée par un Item embarqué persistant
 * (type "poison"), afin de permettre le cumul de plusieurs
 * sources indépendantes sur un même Actor (décision actée au
 * backlog, 02/10/2026) ; une instance à effets réduits ne crée
 * aucun Item, le dégât unique étant déjà entièrement résolu.
 *
 * Le livre ne dit nulle part que ce jet « ne peut pas être
 * forcé », à la différence de l'Asphyxie et de la Terreur qui le
 * précisent explicitement : il s'agit donc vraisemblablement
 * d'un jet de Compétence standard, poussable par défaut comme
 * n'importe quel autre. Volontairement non implémenté dans cette
 * première version (parité avec Asphyxie/Terreur pour rester un
 * chantier simple) : point signalé au porteur du projet, à
 * ajouter plus tard si souhaité.
 *
 * Appliquer l'état « Brisé » qui résulte d'un Poison Létal
 * constitue un dégât dit « atypique » (p.203) : il ne déclenche
 * PAS le jet sur la table des Blessures critiques. De même,
 * l'ESPRIT Brisé par un Poison Somnifère ne déclenche pas de jet
 * de Traumatisme psychologique (le livre prévoit explicitement
 * l'inconscience à la place). Ces deux exemptions sont déjà
 * garanties par construction : ce module (et la couche Foundry
 * qui l'utilise) n'appelle jamais aucun jet de Blessure
 * critique/Traumatisme, exactement comme le fait déjà le jet
 * d'Asphyxie pour ses propres dégâts directs à la VIGUEUR/
 * l'ESPRIT.
 *
 *
 * ----------------------------------------------------------
 * POISON DE LAME (« POISONS ET BLESSURES », p.204)
 * ----------------------------------------------------------
 *
 * « Il est possible d'appliquer des poisons sur une lame, par
 * exemple. Le poison reste actif 1 tour avant de perdre ses
 * propriétés. La Toxicité d'un tel poison ne peut excéder 6. Si
 * une attaque est portée avec succès et inflige au moins 1 point
 * de dégâts à la VIGUEUR de la cible, celle-ci subit également
 * les effets du poison et doit faire un jet en opposition
 * d'ENDURANCE contre la Toxicité du poison qui ne compte pas
 * comme une action. Une fois le poison inoculé à la victime, la
 * lame n'est plus empoisonnée et la toxine [est épuisée]. Les
 * effets de ces poisons sont réduits. Ainsi, si la cible
 * empoisonnée réussit son jet d'ENDURANCE, elle ne subit aucun
 * effet du poison. Si elle le rate, elle ne subit que les effets
 * réduits du poison. »
 *
 * Ce cas réutilise le même jet en opposition d'ENDURANCE que le
 * poison ingéré (cf. `computePoisonOpposedPools`), mais diffère
 * sur deux points structurels, qui justifient une fonction de
 * résolution dédiée (`resolveBladePoisonOpposition`) plutôt que
 * de réutiliser `resolvePoisonOpposition` :
 *
 * - jamais d'effets complets, jamais d'Item `poison` embarqué
 *   créé : plafonné aux effets réduits dans tous les cas (la
 *   lame n'inocule qu'une seule dose, épuisée immédiatement,
 *   contrairement à un poison ingéré qui peut s'installer dans
 *   la durée) ;
 * - c'est un choix binaire tout-ou-rien, pas une simple
 *   distinction complet/réduit : si la victime l'emporte (ou fait
 *   jeu égal, cf. ci-dessous), elle ne subit RIEN, ni dégât ni
 *   effet ; si le poison l'emporte, elle subit uniquement les
 *   effets réduits (1 point de dégâts à l'attribut concerné).
 *
 * Égalité : le livre ne tranche pas ce cas non plus. Par la même
 * convention qu'au-dessus (une égalité protège la victime),
 * étendue logiquement à ce choix binaire : une égalité est donc
 * traitée comme une victoire de la victime (`noEffect = true`),
 * à l'inverse exact du cas ingéré où une égalité donnait les
 * effets réduits (puisqu'ici il n'existe pas de palier
 * intermédiaire en-dessous des effets réduits).
 *
 * Déclenchement : automatique (et non un bouton MJ comme pour le
 * poison ingéré), dès qu'une attaque de mêlée réussie inflige
 * réellement au moins 1 point de dégâts à la VIGUEUR de la cible
 * avec une arme dont la lame est actuellement empoisonnée (cf.
 * `combat/melee-damage-application-service.mjs`). La lame
 * redevient aussitôt non empoisonnée, que la victime résiste ou
 * non au jet qui suit (« une fois le poison inoculé » — l'
 * inoculation a lieu au déclenchement, indépendamment de l'issue
 * du jet en opposition).
 *
 * La durée « 1 tour avant de perdre ses propriétés » (si la lame
 * empoisonnée n'est jamais utilisée) reste une notion narrative
 * que le MJ gère manuellement, comme toute autre notion de
 * durée/tour narrative dans ce projet : un simple bouton
 * « Retirer le poison » est prévu sur la fiche Arme, sans
 * décompte de tour automatisé.
 */

export const POISON_EFFECT_TYPES = {

    lethal: {
        key: "lethal",
        label: "Poison Létal",
        attribute: "vigor",
        fullEffect:
            "Vous subissez 1 point de dégâts par round à la "
            + "VIGUEUR jusqu'à être Brisé. La blessure critique "
            + "qui en résulte est considérée comme atypique "
            + "(aucun jet de Blessure critique). Si vous absorbez "
            + "un antidote entre-temps, les effets du poison "
            + "cessent.",
        reducedEffect:
            "Vous subissez 1 point de dégâts à la VIGUEUR."
    },

    paralyzing: {
        key: "paralyzing",
        label: "Poison Paralysant",
        attribute: "agility",
        fullEffect:
            "Vous subissez 1 point de dégâts par round à "
            + "l'AGILITÉ jusqu'à être Brisé. Si vous absorbez un "
            + "antidote entre-temps, les effets du poison cessent.",
        reducedEffect:
            "Vous subissez 1 point de dégâts à l'AGILITÉ."
    },

    sleep: {
        key: "sleep",
        label: "Poison Somnifère",
        attribute: "spirit",
        fullEffect:
            "Vous subissez 1 point de dégâts par round à "
            + "l'ESPRIT jusqu'à être Brisé, après quoi vous "
            + "tombez inconscient durant un quart (effet narratif, "
            + "à gérer manuellement). Vous ne subissez pas de "
            + "traumatisme psychologique. Si vous absorbez un "
            + "antidote entre-temps, les effets du poison cessent.",
        reducedEffect:
            "Vous subissez 1 point de dégâts à l'ESPRIT."
    },

    hallucinogenic: {
        key: "hallucinogenic",
        label: "Poison Hallucinogène",
        attribute: "empathy",
        fullEffect:
            "Vous subissez 1 point de dégâts par round à "
            + "l'EMPATHIE jusqu'à être Brisé. Si vous absorbez un "
            + "antidote entre-temps, les effets du poison cessent.",
        reducedEffect:
            "Vous subissez 1 point de dégâts à l'EMPATHIE."
    }

};


/**
 * État Foundry (icône sur le Token) posé sur un Actor tant qu'au
 * moins un Item Poison (effets complets) lui est embarqué.
 * Purement dérivé de la présence de ces Items (cf.
 * `metro-poison-hooks.mjs`, qui synchronise automatiquement cet
 * état à chaque création/suppression d'un Item Poison) : il ne
 * porte aucune donnée propre, seulement une icône de confort sur
 * le Token.
 */
export const POISON_STATUS_EFFECT = Object.freeze({

    id: "poisoned",
    name: "Empoisonné",
    img: "icons/svg/poison.svg"

});


/**
 * Retourne les 4 types d'effet du livre, dans l'ordre où ils y
 * apparaissent.
 */
export function getPoisonEffectTypeChoices() {

    return [
        POISON_EFFECT_TYPES.lethal,
        POISON_EFFECT_TYPES.paralyzing,
        POISON_EFFECT_TYPES.sleep,
        POISON_EFFECT_TYPES.hallucinogenic
    ];

}


/**
 * Retourne la définition d'un type d'effet à partir de sa clé,
 * ou lève si la clé est inconnue (jamais de poison "personnalisé"
 * hors des 4 types du livre, à la différence de la Terreur qui
 * autorise une valeur personnalisée).
 */
export function getPoisonEffectType(
    effectTypeKey
) {

    const effectType =
        POISON_EFFECT_TYPES[effectTypeKey]
        ?? null;


    if (!effectType) {

        throw new TypeError(
            `Type d'effet de poison inconnu : "${effectTypeKey}".`
        );

    }


    return effectType;

}


/**
 * Construit la configuration des deux DicePool du jet en
 * opposition : celui de la victime (ENDURANCE, test de
 * Compétence standard, sans Stress — le livre n'en prévoit pas
 * pour ce jet) et celui du poison (un nombre de dés égal à sa
 * Toxicité, lancé par le MJ, sans Attribut/Compétence).
 */
export function computePoisonOpposedPools({
    toxicity,
    vigorAttribute,
    enduranceSkill
} = {}) {

    if (
        !Number.isInteger(toxicity)
        || toxicity < 1
    ) {

        throw new TypeError(
            "La Toxicité doit être un entier strictement positif."
        );

    }


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

        victim: {

            attribute:
                vigorAttribute,

            skill:
                enduranceSkill

        },

        poison: {

            bonus:
                toxicity

        }

    };

}


/**
 * Résout le jet en opposition entre la victime et le poison.
 *
 * Convention actée (le livre ne tranche pas l'égalité, cf.
 * commentaire d'en-tête) : une égalité protège la victime
 * (effets réduits uniquement). Le poison ne l'emporte, et
 * n'inflige ses effets complets, que s'il obtient STRICTEMENT
 * plus de réussites que la victime.
 */
export function resolvePoisonOpposition({
    victimSuccesses,
    poisonSuccesses
} = {}) {

    if (
        !Number.isInteger(victimSuccesses)
        || victimSuccesses < 0
    ) {

        throw new TypeError(
            "Les réussites de la victime doivent être un entier "
            + "positif ou nul."
        );

    }


    if (
        !Number.isInteger(poisonSuccesses)
        || poisonSuccesses < 0
    ) {

        throw new TypeError(
            "Les réussites du poison doivent être un entier "
            + "positif ou nul."
        );

    }


    const fullEffect =
        poisonSuccesses > victimSuccesses;


    return {

        fullEffect,

        tie:
            victimSuccesses
            === poisonSuccesses,

        victimSuccesses,

        poisonSuccesses,

        margin:
            poisonSuccesses
            - victimSuccesses

    };

}


/**
 * Résout le dégât infligé pour UN round par UNE instance de
 * Poison à effets complets (Item embarqué) : toujours 1 point à
 * l'attribut de son type d'effet, tant que celui-ci n'est pas
 * déjà à 0 (Brisé — plus aucun dégât supplémentaire par ce
 * biais, conformément au livre : « jusqu'à être Brisé »).
 */
export function resolvePoisonRoundDamage({
    effectTypeKey,
    currentAttributeValue
} = {}) {

    const effectType =
        getPoisonEffectType(
            effectTypeKey
        );


    if (
        !Number.isInteger(currentAttributeValue)
        || currentAttributeValue < 0
    ) {

        throw new TypeError(
            "La valeur actuelle de l'attribut doit être un "
            + "entier positif ou nul."
        );

    }


    const alreadyBroken =
        currentAttributeValue === 0;


    return {

        attribute:
            effectType.attribute,

        amount:
            alreadyBroken ? 0 : 1,

        alreadyBroken

    };

}


/**
 * Résout le jet en opposition du poison de lame (p.204).
 *
 * À la différence de `resolvePoisonOpposition` (poison ingéré),
 * ce choix est binaire : soit la victime ne subit AUCUN effet
 * (`noEffect`), soit elle subit les effets réduits — jamais
 * d'effets complets dans ce mode.
 *
 * Convention actée (cf. commentaire d'en-tête) : une égalité
 * protège la victime au maximum, donc `noEffect` est vrai dès que
 * la victime égale ou dépasse les réussites du poison
 * (`victimSuccesses >= poisonSuccesses`) — l'exact inverse du
 * calcul de `fullEffect` du cas ingéré.
 */
export function resolveBladePoisonOpposition({
    victimSuccesses,
    poisonSuccesses
} = {}) {

    if (
        !Number.isInteger(victimSuccesses)
        || victimSuccesses < 0
    ) {

        throw new TypeError(
            "Les réussites de la victime doivent être un entier "
            + "positif ou nul."
        );

    }


    if (
        !Number.isInteger(poisonSuccesses)
        || poisonSuccesses < 0
    ) {

        throw new TypeError(
            "Les réussites du poison doivent être un entier "
            + "positif ou nul."
        );

    }


    const noEffect =
        victimSuccesses
        >= poisonSuccesses;


    return {

        noEffect,

        tie:
            victimSuccesses
            === poisonSuccesses,

        victimSuccesses,

        poisonSuccesses,

        margin:
            poisonSuccesses
            - victimSuccesses

    };

}
