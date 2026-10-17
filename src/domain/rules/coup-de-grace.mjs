/**
 * COUP DE GRÂCE (livre p.200) et Talent IMPITOYABLE (p.186).
 *
 * « Un adversaire qui a un score de 0 en VIGUEUR ou en AGILITÉ
 * est sans défense. S'il s'agit d'un être humain et que vous
 * souhaitez lui porter un coup de grâce et le tuer
 * instantanément, vous devez échouer à un jet d'EMPATHIE (ne
 * lancez que les dés d'attribut). Même si le jet échoue, vous
 * subissez 1 point de dégâts à l'EMPATHIE et cochez une case de
 * Sang-froid (tuer de sang-froid n'est pas si aisé). Le talent
 * Impitoyable vous permet de porter un coup de grâce sans avoir
 * à faire de jet d'EMPATHIE. »
 *
 * Impitoyable : « [...] (vous subissez toujours 1 point de
 * dégâts à l'EMPATHIE, mais vous ne devez plus cocher une case
 * de sang-froid). »
 *
 * Aucune dépendance à Foundry.
 *
 * La condition « cible sans défense (VIGUEUR/AGILITÉ à 0) et
 * humaine » est appréciée par le MJ, qui déclenche la macro :
 * elle n'est pas vérifiée ici.
 *
 * Interprétation : si le jet d'EMPATHIE est RÉUSSI (au moins une
 * réussite), le personnage n'arrive pas à tuer de sang-froid ;
 * le livre ne prévoit alors aucun coût, aucun n'est appliqué.
 */


export const COUP_DE_GRACE_DEFAULT_TEXT =
    "Tu veux exécuter ta cible de sang-froid";


export const COUP_DE_GRACE_VERDICTS =
    Object.freeze({

        EXECUTED:
            "executed",

        FAILED:
            "failed"

    });


/**
 * Un jet d'EMPATHIE (dés d'attribut seuls) est-il nécessaire ?
 * Non pour un personnage Impitoyable.
 */
export function requiresEmpathyRoll({
    hasRuthless
} = {}) {

    return hasRuthless !== true;

}


/**
 * Résout un coup de grâce.
 *
 * - hasRuthless : aucun jet, coup de grâce porté, 1 dégât à
 *   l'EMPATHIE, aucune case de Sang-froid ;
 * - sinon `empathySuccesses` (entier >= 0) est obligatoire :
 *   0 réussite = échec du jet = coup de grâce porté, 1 dégât à
 *   l'EMPATHIE ET 1 case de Sang-froid ; >= 1 réussite = le
 *   personnage n'y parvient pas, aucun coût.
 */
export function resolveCoupDeGrace({
    hasRuthless = false,
    empathySuccesses
} = {}) {

    if (hasRuthless === true) {

        return {

            hasRuthless:
                true,

            rolled:
                false,

            empathySuccesses:
                null,

            verdict:
                COUP_DE_GRACE_VERDICTS.EXECUTED,

            executed:
                true,

            empathyDamage:
                1,

            composureChecks:
                0

        };

    }


    if (
        !Number.isInteger(empathySuccesses)
        || empathySuccesses < 0
    ) {

        throw new TypeError(
            "Le nombre de réussites au jet d'EMPATHIE doit être un entier positif ou nul."
        );

    }


    const executed =
        empathySuccesses === 0;


    return {

        hasRuthless:
            false,

        rolled:
            true,

        empathySuccesses,

        verdict:
            executed
                ? COUP_DE_GRACE_VERDICTS.EXECUTED
                : COUP_DE_GRACE_VERDICTS.FAILED,

        executed,

        empathyDamage:
            executed
                ? 1
                : 0,

        composureChecks:
            executed
                ? 1
                : 0

    };

}
