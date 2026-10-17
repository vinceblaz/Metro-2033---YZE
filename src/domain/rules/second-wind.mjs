/**
 * Talent général SECOND SOUFFLE.
 *
 * « Lorsque vous êtes Brisé par suite d'une VIGUEUR réduite à 0,
 * vous pouvez vous remettre sur pied immédiatement sans aide.
 * Faites un jet d'ENDURANCE en n'utilisant que les dés de
 * compétence (non forçable). Pour chaque réussite, vous
 * récupérez 1 point de VIGUEUR perdu. Utilisable une seule fois
 * lorsque vous êtes Brisé ; aucun effet sur les blessures
 * critiques. »
 *
 * Aucune dépendance à Foundry.
 *
 * L'usage unique par état Brisé n'est PAS suivi par le système :
 * le bouton reste proposé tant que la VIGUEUR vaut 0 (décision
 * du porteur du projet : « bouton qui permet d'exécuter le
 * talent »).
 */


/**
 * Le bouton « Second souffle » doit-il être proposé ?
 * Oui si l'Actor possède le Talent ET que sa VIGUEUR vaut 0
 * (Brisé).
 */
export function isSecondWindAvailable({
    hasTalent,
    vigor
} = {}) {

    /*
     * Un champ vide / absent n'est pas « 0 » (Number("") === 0,
     * Number(null) === 0) : pas de bouton tant que la valeur
     * n'est pas explicitement saisie.
     */
    if (
        vigor === null
        || vigor === undefined
        || (
            typeof vigor === "string"
            && vigor.trim() === ""
        )
    ) {

        return false;

    }


    return (
        hasTalent === true
        && Number(vigor) === 0
    );

}


/**
 * VIGUEUR récupérée : 1 point par réussite, sans jamais
 * dépasser le maximum de VIGUEUR.
 */
export function resolveSecondWind({
    successes,
    vigor,
    vigorMax
} = {}) {

    const safeSuccesses =
        Number.isInteger(successes) && successes > 0
            ? successes
            : 0;

    const current =
        Number.isInteger(vigor) && vigor > 0
            ? vigor
            : 0;

    const max =
        Number.isInteger(vigorMax) && vigorMax > 0
            ? vigorMax
            : 0;

    const newVigor =
        Math.min(
            max,
            current + safeSuccesses
        );

    // Un maximum invalide ou inférieur à la valeur courante ne
    // doit jamais faire reculer la VIGUEUR.
    const finalVigor =
        Math.max(
            current,
            newVigor
        );

    return {

        successes:
            safeSuccesses,

        previous:
            current,

        recovered:
            finalVigor - current,

        vigor:
            finalVigor

    };

}
