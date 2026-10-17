/**
 * Résumé d'une protection embarquée (onglet Équipement des fiches
 * PNJ et Créature). Fonction pure.
 */
export function summarizeProtection(system) {
    const current = Number(system?.protection?.current ?? 0);
    const max = Number(system?.protection?.max ?? 0);

    let text = `Protection ${current}/${max}`;

    if (system?.resilience === true) {
        text += system.resilienceLost === true
            ? " · Résilience perdue"
            : " · Résilience";
    }

    return text;
}
