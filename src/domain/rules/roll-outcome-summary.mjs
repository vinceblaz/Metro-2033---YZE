/**
 * Transcription lisible d'un jet (pool, dés, Push, Stress) pour les
 * cartes de Chat qui n'affichent que les réussites (mêlée).
 * Fonction pure sur un résultat de jet sérialisé.
 */

const POOL_PARTS = [
    ["attribute", "Attribut", false],
    ["skill", "Compétence", false],
    ["equipment", "Équipement", false],
    ["stress", "Stress", false],
    ["bonus", "Bonus", false],
    ["penalty", "Malus", true]
];

const DICE_GROUPS = [
    ["attribute", "Attribut"],
    ["skill", "Compétence"],
    ["equipment", "Équipement"],
    ["bonus", "Bonus"],
    ["stress", "Stress"]
];

function formatStressDie(value) {

    if (value === 6) {
        return "6 (éliminé)";
    }

    if (value === 1) {
        return "1 (affliction)";
    }

    return String(value);
}

export function summarizeRollOutcome(result) {

    if (!result) {
        return [];
    }

    const lines = [];
    const pool = result.pool ?? {};

    const parts = [];
    let total = 0;

    for (const [key, label, negative] of POOL_PARTS) {

        const value = Number(pool[key] ?? 0);

        if (value === 0) {
            continue;
        }

        parts.push(`${parts.length === 0 ? "" : negative ? "− " : "+ "}${label} ${value}`);
        total += negative ? -value : value;
    }

    if (parts.length > 0) {
        lines.push(`Pool : ${parts.join(" ")} = ${Math.max(0, total)} dés`);
    }

    const dice = result.dice ?? {};
    const groups = [];

    for (const [key, label] of DICE_GROUPS) {

        const values = dice[key];

        if (!Array.isArray(values) || values.length === 0) {
            continue;
        }

        groups.push(
            `${label} : ${values
                .map(value => key === "stress" ? formatStressDie(value) : String(value))
                .join(" ")}`
        );
    }

    if (groups.length > 0) {
        lines.push(`Dés — ${groups.join(" · ")}`);
    }

    const push = Number(result.pushCount ?? 0);

    if (push > 0) {
        lines.push(`Jet forcé ${push} fois`);
    }

    if (Number(result.eliminatedStress ?? 0) > 0) {
        lines.push(`Dés de Stress éliminés : ${Number(result.eliminatedStress)}`);
    }

    if (Number(result.stressAfflictions ?? 0) > 0) {
        lines.push(`Afflictions (1 sur un dé de Stress) : ${Number(result.stressAfflictions)}`);
    }

    return lines;
}
