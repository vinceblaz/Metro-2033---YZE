/**
 * Vérifie qu'une munition peut être utilisée
 * par une arme donnée.
 *
 * Cette fonction vérifie uniquement
 * la compatibilité métier.
 *
 * Elle ne vérifie pas la quantité disponible.
 */
export function isAmmunitionCompatible(
    weapon,
    ammunition
) {

    if (!weapon) {
        return false;
    }

    if (!ammunition) {
        return false;
    }

    if (
        weapon.type !== "weapon"
        || ammunition.type !== "ammunition"
    ) {
        return false;
    }

    if (!weapon.system?.usesAmmunition) {
        return false;
    }


    const weaponType =
        weapon.system?.ammunitionType
        ?? "";


    const ammoType =
        ammunition.system?.ammoType
        ?? "";


    if (!weaponType || !ammoType) {
        return false;
    }


    if (
        weaponType !== ammoType
    ) {
        return false;
    }


    const ammunitionQuality =
        ammunition.system?.quality
        ?? "standard";


    /*
     * Une munition de qualité militaire
     * ne peut être utilisée que si l'arme
     * l'autorise explicitement.
     *
     * Cette règle permet notamment d'exclure
     * les fusils à pompe, arcs, arbalètes
     * et armes lourdes sans coder leurs types
     * directement dans cette fonction.
     */
    if (
        ammunitionQuality === "military"
        && !weapon.system?.allowsMilitaryAmmunition
    ) {
        return false;
    }


    return true;

}


/**
 * Vérifie qu'une munition possède encore
 * au moins une unité disponible.
 *
 * Cette fonction ne vérifie pas
 * la compatibilité avec une arme.
 */
export function isAmmunitionAvailable(
    ammunition
) {

    if (!ammunition) {
        return false;
    }


    if (
        ammunition.type
        !== "ammunition"
    ) {
        return false;
    }


    const quantity =
        ammunition.system?.quantity
        ?? 0;


    return (
        Number.isInteger(quantity)
        && quantity > 0
    );

}


/**
 * Vérifie qu'une munition peut actuellement
 * être proposée pour une arme.
 *
 * Elle doit être :
 *
 * - compatible avec l'arme ;
 * - encore disponible dans l'équipement.
 *
 * Cette fonction sera notamment utilisée
 * pour construire la liste des munitions
 * proposées dans l'onglet Combat.
 */
export function isAmmunitionAvailableForWeapon(
    weapon,
    ammunition
) {

    return (
        isAmmunitionCompatible(
            weapon,
            ammunition
        )

        && isAmmunitionAvailable(
            ammunition
        )
    );

}