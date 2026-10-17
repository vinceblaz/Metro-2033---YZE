/**
 * Type d'arme du Talent « Spécialiste en armement » (livre p.186 :
 * « un type d'armes (de mêlée, à distance ou lourdes) »).
 *
 * Le type est DÉDUIT de l'arme (aucun champ propre) :
 * - arme lourde (`heavy`)            -> "heavy" (prioritaire) ;
 * - sinon catégorie mécanique        -> "melee" | "ranged".
 * Un type exclut les autres : une arme lourde relève uniquement
 * de « Arme lourde ».
 */

export const WEAPON_TALENT_TYPES = Object.freeze({

    melee: "Arme de mêlée",
    ranged: "Arme à distance",
    heavy: "Arme lourde"

});


export function resolveWeaponTalentType(
    weapon
) {

    const { category, heavy } = weapon ?? {};

    if (heavy === true) {
        return "heavy";
    }

    if (category === "melee" || category === "ranged") {
        return category;
    }

    return null;

}


/**
 * Ajoute (ou remplace) le type d'arme à la fin du nom d'un
 * Talent : « Spécialiste en armement (Arme lourde) ». Un suffixe
 * correspondant à un type connu est d'abord retiré ; un type vide
 * ou inconnu ramène le nom de base.
 */
export function composeSpecialistName(
    name,
    typeKey
) {

    let base = String(name ?? "").trim();

    for (const label of Object.values(WEAPON_TALENT_TYPES)) {

        const suffix = ` (${label})`;

        if (base.endsWith(suffix)) {
            base = base.slice(0, -suffix.length).trim();
        }

    }

    const label = WEAPON_TALENT_TYPES[typeKey];

    return label
        ? `${base} (${label})`
        : base;

}
