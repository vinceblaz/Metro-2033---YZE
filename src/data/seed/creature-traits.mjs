/**
 * Traits de Créature (Vicieuse, Grimpeur, Spores...) : le livre des
 * Monstres les décrit comme des paragraphes titrés. Ils sont
 * convertis en Items « talent » embarqués pour être listés, lus et
 * rappelés dans le Chat. Fonctions pures.
 */

const NON_TRAIT_TITLES = new Set(["note"]);

export function slugifyTraitName(name) {

    return String(name ?? "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}


/**
 * Sépare le HTML `special` d'une Créature en traits titrés
 * (`<p><strong>Titre :</strong> texte</p>`) et texte restant.
 */
export function extractCreatureTraits(html) {

    const source = String(html ?? "");
    const traits = [];
    const kept = [];

    const paragraphs = source.match(/<p>[\s\S]*?<\/p>/g) ?? [];

    for (const paragraph of paragraphs) {

        const match = paragraph.match(
            /^<p><strong>([^<]+?)\s*:\s*<\/strong>\s*([\s\S]*?)<\/p>$/
        );

        if (!match || NON_TRAIT_TITLES.has(match[1].trim().toLowerCase())) {
            kept.push(paragraph);
            continue;
        }

        traits.push({ name: match[1].trim(), effect: match[2].trim() });
    }

    return { traits, remainder: kept.join("") };
}
