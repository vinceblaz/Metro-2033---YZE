/**
 * Trait « Vicieuse » (Sentinelle, livre des Monstres) : « si la
 * sentinelle réussit une attaque de griffes, elle peut
 * immédiatement faire une attaque de morsure sur la même cible ».
 *
 * Fonction pure : indique si la morsure de suite est proposable.
 * L'attaque de morsure reste lancée volontairement (bouton) et
 * suit le déroulement normal d'une attaque de mêlée.
 */

export const VICIEUSE_TRAIT_KEY = "creature-trait-vicieuse";

export function resolveVicieuseFollowUp({
    traitKeys,
    usedWeaponName,
    hit,
    weapons
} = {}) {

    const none = { available: false, weaponId: null, weaponName: null };

    if (
        hit !== true
        || !(traitKeys ?? []).includes(VICIEUSE_TRAIT_KEY)
        || !/griffe/i.test(String(usedWeaponName ?? ""))
    ) {
        return none;
    }

    const bite = (weapons ?? []).find(
        weapon =>
            weapon.category === "melee"
            && weapon.canAttack === true
            && /morsure/i.test(String(weapon.name ?? ""))
    );

    return bite
        ? { available: true, weaponId: bite.id, weaponName: bite.name }
        : none;
}
