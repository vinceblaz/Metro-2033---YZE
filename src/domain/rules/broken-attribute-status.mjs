/**
 * États « Brisé » par attribut (livre p.200 : un attribut tombé à 0
 * rend Brisé ; les effets dépendent de l'attribut). Utilisés pour
 * afficher l'état sur le Token des PNJ et Créatures.
 *
 * L'état est entièrement dérivé de la valeur de l'attribut. La mort
 * d'un PNJ secondaire à Vigueur Brisée reste une décision du MJ
 * (livre p.201) : elle n'est jamais automatisée.
 *
 * Distinct de l'état « Brisé » du Sang-froid (composureBroken).
 */

export const BROKEN_ATTRIBUTE_STATUS_EFFECTS = Object.freeze([

    Object.freeze({ id: "brokenVigor", attribute: "vigor", name: "Brisé — Vigueur (K.-O.)", img: "icons/svg/unconscious.svg" }),
    Object.freeze({ id: "brokenAgility", attribute: "agility", name: "Brisé — Agilité (à terre)", img: "icons/svg/falling.svg" }),
    Object.freeze({ id: "brokenSpirit", attribute: "spirit", name: "Brisé — Esprit (paralysé)", img: "icons/svg/terror.svg" }),
    Object.freeze({ id: "brokenEmpathy", attribute: "empathy", name: "Brisé — Empathie (effondré)", img: "icons/svg/silenced.svg" })

]);


/**
 * Compare les attributs aux états actifs et indique les états à
 * ajouter / retirer.
 */
export function resolveBrokenAttributeStatusSync({ attributes, activeStatusIds } = {}) {

    const active = new Set(activeStatusIds ?? []);
    const add = [];
    const remove = [];

    for (const status of BROKEN_ATTRIBUTE_STATUS_EFFECTS) {

        const value = attributes?.[status.attribute]?.value;

        if (!Number.isFinite(value)) {
            continue;
        }

        const broken = value <= 0;
        const present = active.has(status.id);

        if (broken && !present) {
            add.push(status.id);
        }
        else if (!broken && present) {
            remove.push(status.id);
        }

    }

    return { add, remove };
}
