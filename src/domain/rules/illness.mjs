/**
 * Maladies (livre de règles, p.204-205, section « Les maladies »).
 *
 * Périmètre acté avec le porteur du projet (28/09/2026, repris au
 * lancement de ce chantier le 03/10/2026) : seul le jet
 * d'exposition initial (Malade oui/non) est automatisé. Le cycle
 * complet décrit par le livre (nouveau jet de Maladie chaque
 * jour, contagion, soutien médical, guérison) reste entièrement
 * manuel/narratif, géré par le MJ en dehors de ce module.
 *
 * « Lorsque vous êtes exposé à une contagion ou une infection,
 * vous devez faire un jet en opposition d'ENDURANCE contre la
 * Virulence de la maladie. C'est un jet de Maladie. Une maladie
 * « standard » possède une Virulence de 3, mais certaines
 * maladies possèdent une Virulence bien plus élevée. Si vous
 * ratez le jet, vous tombez Malade, ce qui a différents effets :
 *
 * le jour suivant l'infection, la maladie se déclare. Vous
 * subissez alors 1 point de dégâts à la VIGUEUR et à l'AGILITÉ
 * (ces dégâts ne peuvent pas être convertis en dés de Stress) ;
 *
 * vous ne pouvez pas récupérer de points de VIGUEUR et d'AGILITÉ
 * tant que vous êtes Malade, ni éliminer de dés de Stress ;
 *
 * vous faites un nouveau jet de Maladie par jour. Chaque jet raté
 * inflige 1 nouveau point de dégâts à la VIGUEUR et à l'AGILITÉ ;
 *
 * si votre VIGUEUR est Brisée alors que vous êtes Malade, vous
 * mourrez le jour suivant si vous n'êtes pas rétabli entre temps ;
 *
 * dès que vous réussissez un jet de Maladie, vous êtes guéri. Vous
 * n'avez dès lors plus à faire de jet de Maladie et vous récupérez
 * vos points de VIGUEUR et d'AGILITÉ normalement. »
 *
 * Le livre ne tranche pas le cas d'égalité des réussites pour ce
 * jet en opposition — exactement comme pour le Poison. Par
 * convention actée avec le porteur du projet (03/10/2026, par
 * cohérence avec `resolvePoisonOpposition`/`resolveGrappleEscape`),
 * une égalité protège la victime (elle n'est pas rendue Malade).
 *
 * À la différence du Poison, ce jet initial ne connaît pas
 * d'« effets réduits » : une réussite de la victime n'inflige
 * strictement aucun effet (le livre ne décrit qu'une alternative
 * Malade/pas Malade, pas de palier intermédiaire).
 *
 * Non automatisés par ce module, volontairement laissés manuels
 * (cf. périmètre ci-dessus) :
 * - le nouveau jet de Maladie quotidien tant que la victime reste
 *   Malade (et les dégâts supplémentaires qu'un échec inflige) ;
 * - la contagion entre personnages ;
 * - le soutien médical (jet en opposition de SOINS fait par un
 *   soignant à la place du malade) ;
 * - la guérison et la récupération normale de VIGUEUR/AGILITÉ.
 *
 * Le livre ne dit nulle part que ce jet « ne peut pas être
 * forcé », à la différence de l'Asphyxie et de la Terreur qui le
 * précisent explicitement. Volontairement non implémenté dans
 * cette première version (même parti pris que pour le Poison,
 * pour rester un chantier simple) : point signalé au porteur du
 * projet, à ajouter plus tard si souhaité.
 *
 * Point de vigilance, préexistant et non corrigé ici (même lacune
 * que pour le Poison) : `domain/rules/rest.mjs` ne tient pas
 * compte de l'interdiction de récupérer de la VIGUEUR/l'AGILITÉ
 * tant que la victime est Malade — un Repos long restaurera donc
 * ces attributs normalement, ce qui diverge du livre.
 */

/**
 * Virulence par défaut d'une maladie « standard » (le livre ne
 * fournit aucun catalogue de maladies nommées, seulement cette
 * valeur de référence et la mention que « certaines maladies
 * possèdent une Virulence bien plus élevée », sans autre exemple
 * chiffré).
 */
export const ILLNESS_STANDARD_VIRULENCE = 3;


/**
 * État Foundry (icône sur le Token) posé sur un Actor qui a
 * échoué son jet de Maladie, tant que le MJ ne l'enlève pas
 * manuellement — exactement comme l'état « Asphyxié ». À la
 * différence de l'Asphyxie, aucune automatisation par round de
 * combat n'est enregistrée pour cet état (cf. périmètre ci-dessus
 * : le cycle de la Maladie est quotidien, pas round par round, et
 * reste entièrement manuel).
 */
export const ILLNESS_STATUS_EFFECT = Object.freeze({

    id: "sick",
    name: "Malade",
    img: "icons/svg/biohazard.svg"

});


/**
 * Construit la configuration des deux DicePool du jet en
 * opposition : celui de la victime (ENDURANCE, test de
 * Compétence standard, sans Stress — le livre n'en prévoit pas
 * pour ce jet) et celui de la maladie (un nombre de dés égal à sa
 * Virulence, lancé par le MJ, sans Attribut/Compétence).
 */
export function computeIllnessOpposedPools({
    virulence,
    vigorAttribute,
    enduranceSkill
} = {}) {

    if (
        !Number.isInteger(virulence)
        || virulence < 1
    ) {

        throw new TypeError(
            "La Virulence doit être un entier strictement positif."
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

        illness: {

            bonus:
                virulence

        }

    };

}


/**
 * Résout le jet en opposition entre la victime et la maladie.
 *
 * Convention actée (le livre ne tranche pas l'égalité, cf.
 * commentaire d'en-tête) : une égalité protège la victime (elle
 * n'est pas rendue Malade). La maladie ne l'emporte, et ne rend la
 * victime Malade, que si elle obtient STRICTEMENT plus de
 * réussites que la victime.
 *
 * En cas d'échec (`sick` à `true`), le livre inflige toujours 1
 * point de dégâts fixe à la VIGUEUR et à l'AGILITÉ (« le jour
 * suivant l'infection »), peu importe le nombre de réussites de la
 * maladie — comme pour l'Asphyxie, ce n'est pas le nombre de
 * réussites qui compte au-delà du seuil de victoire.
 */
export function resolveIllnessOpposition({
    victimSuccesses,
    illnessSuccesses
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
        !Number.isInteger(illnessSuccesses)
        || illnessSuccesses < 0
    ) {

        throw new TypeError(
            "Les réussites de la maladie doivent être un entier "
            + "positif ou nul."
        );

    }


    const sick =
        illnessSuccesses > victimSuccesses;


    return {

        sick,

        tie:
            victimSuccesses
            === illnessSuccesses,

        victimSuccesses,

        illnessSuccesses,

        margin:
            illnessSuccesses
            - victimSuccesses,

        vigorDamage:
            sick ? 1 : 0,

        agilityDamage:
            sick ? 1 : 0

    };

}
