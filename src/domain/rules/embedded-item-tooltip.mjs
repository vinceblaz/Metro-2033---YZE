/**
 * Info-bulle des Items embarqués (fiches PNJ et Créature).
 *
 * Fonction pure : transforme les textes riches (HTML) d'un Item en
 * texte brut pour l'attribut `title` d'un élément.
 *
 * - Arme    : capacité particulière (`special`) puis `description` ;
 * - Talent  : texte d'effet (`effect`) puis `description` ;
 * - Autre   : `description`.
 */

const ENTITIES = {
    "&nbsp;": " ",
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": "\"",
    "&#39;": "'",
    "&apos;": "'"
};


export function htmlToPlainText(html) {

    return String(html ?? "")
        .replace(/<\s*br\s*\/?>/gi, " ")
        .replace(/<\/(p|div|li|h[1-6])>/gi, " ")
        .replace(/<[^>]*>/g, "")
        .replace(/&(?:nbsp|amp|lt|gt|quot|apos|#39);/g, entity => ENTITIES[entity])
        .replace(/\s+/g, " ")
        .trim();

}


export function buildEmbeddedItemTooltip(item) {

    const system = item?.system ?? {};

    const sources =
        item?.type === "weapon"
            ? [system.special, system.description]
            : item?.type === "talent"
                ? [system.effect, system.description]
                : [system.description];

    return sources
        .map(htmlToPlainText)
        .filter(text => text.length > 0)
        .join(" — ");

}
