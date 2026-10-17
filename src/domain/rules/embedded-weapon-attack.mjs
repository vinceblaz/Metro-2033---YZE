/**
 * Bouton d'attaque d'une arme embarquée (fiches PNJ et Créature).
 *
 * Fonction pure : à partir des données d'une arme, indique quel
 * bouton afficher. L'arme doit être équipée (livre : on attaque
 * avec l'arme que l'on tient) ; la validation métier détaillée
 * reste faite par Actor.rollMeleeAttack / rollRangedAttack.
 *
 * Retourne null si aucun bouton ne doit être affiché.
 */
export function resolveEmbeddedWeaponAttack(weapon) {
    const system = weapon?.system;

    if (!system || system.equipped !== true) {
        return null;
    }

    if (system.category === "melee") {
        const enabled = system.canAttack === true;

        return {
            attackType: "melee",
            label: "Frapper",
            enabled,
            reason: enabled ? "" : "Arme hors d'usage."
        };
    }

    if (system.category === "ranged") {
        const enabled = system.canFire === true;

        return {
            attackType: "ranged",
            label: "Tirer",
            enabled,
            reason: enabled
                ? ""
                : "Arme hors d'usage, ou sans munition chargée compatible.",
            burst: system.automatic === true
                ? { attackType: "burst", label: "Rafale", enabled }
                : null
        };
    }

    return null;
}
