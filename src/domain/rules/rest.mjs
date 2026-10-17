/**
 * Repos long — un quart (5 à 10h) passé à se reposer.
 *
 * Effets (décision de conception validée par le porteur
 * du projet, cf. p.177 pour le Sang-froid) :
 *
 * - le Stress diminue de 2 (jamais sous 0) ;
 * - le Sang-froid diminue de 2 (jamais sous 0) ;
 * - chaque attribut est remis à sa valeur maximale.
 *
 * Simplification volontaire par rapport à la règle stricte
 * de récupération d'attribut (1 point par tour de repos) :
 * un quart de repos représentant 5 à 10 heures, on considère
 * que tous les attributs sont entièrement récupérés.
 *
 * Exception (comblée le 03/10/2026, à la demande du porteur
 * du projet — lacune signalée dès les chantiers Poison et
 * Maladie) : le livre précise, pour le Poison (p.205) comme
 * pour la Maladie (p.204), que « tant que [le poison/la
 * maladie] fait effet, vous ne pouvez pas récupérer de points
 * dans l'attribut affecté ». Un attribut listé dans
 * `blockedAttributeKeys` n'est donc PAS remis à son maximum :
 * sa valeur actuelle reste strictement inchangée, le Repos
 * n'ayant alors aucun effet sur lui (ni restauration complète
 * ni récupération partielle, cette dernière restant hors
 * périmètre de la simplification ci-dessus).
 */

export const REST_STRESS_REDUCTION = 2;
export const REST_COMPOSURE_REDUCTION = 2;


export function resolveRest({
    stressDice,
    composureCurrent,
    attributes,
    blockedAttributeKeys = []
} = {}) {

    if (
        !Number.isInteger(stressDice)
        || stressDice < 0
    ) {
        throw new TypeError(
            "Le nombre de dés de Stress doit être un entier positif ou nul."
        );
    }


    if (
        !Number.isInteger(composureCurrent)
        || composureCurrent < 0
    ) {
        throw new TypeError(
            "La valeur de Sang-froid actuelle doit être "
            + "un entier positif ou nul."
        );
    }


    if (
        typeof attributes !== "object"
        || attributes === null
        || Array.isArray(attributes)
    ) {
        throw new TypeError(
            "Les attributs doivent être fournis sous forme d'objet."
        );
    }


    if (!Array.isArray(blockedAttributeKeys)) {
        throw new TypeError(
            "Les clés d'attributs bloqués doivent être fournies "
            + "sous forme de tableau."
        );
    }


    const blockedKeySet =
        new Set(blockedAttributeKeys);


    const restedAttributes = {};

    for (
        const [key, attribute]
        of Object.entries(attributes)
    ) {

        if (
            !attribute
            || !Number.isInteger(attribute.value)
            || !Number.isInteger(attribute.max)
        ) {
            throw new TypeError(
                `L'attribut "${key}" doit fournir une valeur `
                + "actuelle et une valeur maximale entières."
            );
        }

        const isBlocked =
            blockedKeySet.has(key);

        restedAttributes[key] = {
            value:
                isBlocked
                    ? attribute.value
                    : attribute.max,
            max: attribute.max
        };

    }


    return {

        stressDice:
            Math.max(
                0,
                stressDice - REST_STRESS_REDUCTION
            ),

        composureCurrent:
            Math.max(
                0,
                composureCurrent - REST_COMPOSURE_REDUCTION
            ),

        attributes:
            restedAttributes,

        blockedAttributeKeys:
            Array.from(
                blockedKeySet
            ).filter(
                key => Object.hasOwn(
                    attributes,
                    key
                )
            )

    };

}
