/**
 * État « Brisé » lié au Sang-froid (chantier du 09/10/2026).
 *
 * Le Sang-froid est géré de façon narrative par le MJ. Lorsqu'un
 * Personnage atteint sa limite de Sang-froid (valeur actuelle >=
 * valeur maximale, soit 5 par défaut, 6 ou 7 avec les Talents
 * qui relèvent le plafond), il passe à l'état « Brisé » (icône
 * sur le Token). L'état est entièrement dérivé de la valeur de
 * Sang-froid : il n'a pas d'autre source de vérité.
 *
 * Distinct d'un attribut « Brisé » (réduit à 0), qui n'a aucun
 * lien avec cet état.
 */

export const COMPOSURE_BROKEN_STATUS_EFFECT = Object.freeze({

    id: "composureBroken",
    name: "Brisé",
    img: "icons/svg/daze.svg"

});


export function isComposureBroken({ current, max } = {}) {

    return Number.isInteger(current)
        && Number.isInteger(max)
        && max >= 1
        && current >= max;

}


/**
 * Décide de l'action à mener pour aligner l'état sur le
 * Sang-froid. `announce` n'est vrai que lors du passage effectif
 * à Brisé (état absent -> présent) : une re-synchronisation
 * (état supprimé à la main puis reposé) ne republie pas le
 * message.
 */
export function resolveComposureBreakSync({
    current,
    max,
    hasStatus,
    announceOnAdd = true
} = {}) {

    const broken =
        isComposureBroken({ current, max });

    if (broken && !hasStatus) {
        return { action: "add", announce: announceOnAdd === true };
    }

    if (!broken && hasStatus) {
        return { action: "remove", announce: false };
    }

    return { action: "none", announce: false };

}


export function buildComposureBreakMessage(actorName) {

    return `<p><strong>${actorName}</strong> est brisé.</p>`
        + `<p>Limite de sang-froid atteinte</p>`;

}
