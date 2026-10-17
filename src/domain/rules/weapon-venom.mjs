/**
 * Venin d'une arme naturelle de Créature (livre des Monstres :
 * « si la créature inflige au moins 1 point de dégâts à sa cible,
 * elle lui inocule un venin (Toxicité N, poison létal / paralysant) »).
 *
 * Contrairement au poison de lame (p.204), le venin n'est jamais
 * épuisé et suit le jet en opposition d'ENDURANCE du poison ingéré
 * (effets complets ou réduits).
 *
 * Fonction pure : dit si un venin se déclenche et avec quels
 * paramètres. Le dégât pris en compte est celui réellement subi
 * par la Vigueur de la cible.
 */
export function resolveWeaponVenomTrigger(venom, vigorDamageDealt, weaponName) {

    if (venom?.active !== true || Number(vigorDamageDealt ?? 0) < 1) {
        return null;
    }

    return {
        effectTypeKey: venom.effectType,
        toxicity: Number(venom.toxicity),
        sourceLabel: venom.sourceLabel || weaponName || ""
    };
}
